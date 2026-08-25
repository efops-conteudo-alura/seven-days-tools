'use strict';
/*
 * app.js — a interface do formulário. As definições de campo vêm do
 * servidor (/api/campos), que as lê de lib/campos.js: uma fonte só.
 */

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

const estado = {
  paginas: [],        // definições vindas de lib/campos.js
  exemplo: {},        // textos do exemplo real (Dia 2 de Lógica com JS)
  dados: null,        // o rascunho em edição
  arquivo: null,      // nome do arquivo do rascunho no disco
  paginaAtual: null,  // id da página visível
  problemas: [],      // resultado da última validação
  timerSave: null,
  conflito: false,    // outra aba salvou por cima — esta aba para de salvar
  sobrescrever: false, // o próximo save pode substituir um rascunho existente (importação confirmada)
};

const $ = (sel) => document.querySelector(sel);

async function api(rota, corpo) {
  const resp = await fetch(rota, corpo === undefined
    ? undefined
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  if (!resp.ok) {
    const info = await resp.json().catch(() => ({}));
    const erro = new Error(info.erro || ('falha em ' + rota));
    erro.conflito = !!info.conflito;
    throw erro;
  }
  return resp.json();
}

// Onde vive o valor de um campo, conforme o domínio da página.
function balde(pagina) {
  if (pagina.dominio === 'briefing') return estado.dados.briefing;
  if (pagina.dominio === 'config') return estado.dados.emails.config;
  return estado.dados.emails.dias[pagina.dia - 1];
}

function valorDe(pagina, chave) {
  return (balde(pagina) || {})[chave] || '';
}

// "Tem conteúdo?" — vale para texto e para listas (campos tipo 'links').
function preenchido(v) {
  if (Array.isArray(v)) return v.length > 0;
  return !!String(v == null ? '' : v).trim();
}

// ---------------------------------------------------------------------------
// Tela inicial
// ---------------------------------------------------------------------------

async function mostrarInicio() {
  $('#tela-form').classList.add('oculta');
  $('#tela-inicio').classList.remove('oculta');
  const lista = $('#lista-rascunhos');
  lista.innerHTML = '<li class="vazio">Carregando…</li>';
  const rascunhos = await api('/api/rascunhos');
  if (!rascunhos.length) {
    lista.innerHTML = '<li class="vazio">Nenhum rascunho ainda — comece uma trilha nova.</li>';
    return;
  }
  lista.innerHTML = '';
  for (const r of rascunhos) {
    const li = document.createElement('li');
    const botao = document.createElement('button');
    const quando = new Date(r.atualizadoEm).toLocaleString('pt-BR');
    botao.innerHTML = '<strong></strong> <span class="quando"></span>';
    botao.querySelector('strong').textContent = r.nome;
    botao.querySelector('.quando').textContent = '· salvo em ' + quando;
    botao.addEventListener('click', () => abrirRascunho(r.arquivo));
    li.appendChild(botao);
    lista.appendChild(li);
  }
}

async function novaTrilha() {
  estado.dados = await api('/api/novo');
  estado.arquivo = null; // ganha nome quando o slug for preenchido
  estado.conflito = false;
  estado.sobrescrever = false;
  abrirFormulario();
}

async function abrirRascunho(arquivo) {
  estado.dados = await api('/api/rascunho?arquivo=' + encodeURIComponent(arquivo));
  estado.arquivo = arquivo;
  estado.conflito = false;
  estado.sobrescrever = false;
  abrirFormulario();
}

// Recuperação: sobe os arquivos já gerados (briefing .md, Word .docx dos
// e-mails ou um rascunho .7doc.json) e preenche o formulário de volta.
async function importarArquivos(lista) {
  const arquivos = [];
  for (const f of lista) {
    arquivos.push({ nome: f.name, base64: base64De(await f.arrayBuffer()) });
  }
  const r = await api('/api/importar', { arquivos });

  // Se já existe um rascunho com o mesmo nome de arquivo, pergunta antes.
  const slug = ((r.dados.briefing || {})['slug'] || '').trim().toLowerCase();
  const alvo = /^[a-z0-9][a-z0-9-]{0,63}$/.test(slug) ? slug : 'sem-nome';
  const existentes = await api('/api/rascunhos');
  const jaExiste = existentes.some((e) => e.arquivo === alvo);
  if (jaExiste && !confirm('Já existe um rascunho "' + alvo + '" na tela inicial.\n\n' +
    'Substituir pelo conteúdo importado? (uma cópia do atual fica guardada em rascunhos/backups)')) {
    return;
  }

  estado.dados = r.dados;
  estado.arquivo = null;
  estado.conflito = false;
  estado.sobrescrever = jaExiste;
  abrirFormulario();
  await salvar();
  alert('Importado com sucesso:\n\n' + r.resumo.map((l) => '• ' + l).join('\n') +
    '\n\nConfira os campos — tudo já está salvo como rascunho.');
}

function base64De(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

// ---------------------------------------------------------------------------
// Formulário
// ---------------------------------------------------------------------------

function abrirFormulario() {
  estado.problemas = [];
  $('#painel-problemas').classList.add('oculta');
  $('#tela-inicio').classList.add('oculta');
  $('#tela-form').classList.remove('oculta');
  montarIndice();
  irPara(estado.paginas[0].id);
}

function tituloTrilha() {
  return (estado.dados.briefing['nome-do-curso'] || '').trim() || 'Trilha sem nome';
}

function montarIndice() {
  $('#titulo-trilha').textContent = tituloTrilha();
  const nav = $('#indice');
  nav.innerHTML = '';
  let secaoAtual = '';
  for (const pag of estado.paginas) {
    const secao = pag.dominio === 'briefing' ? 'Briefing (página de inscrição)' : 'Os 7 e-mails';
    if (secao !== secaoAtual) {
      secaoAtual = secao;
      const div = document.createElement('div');
      div.className = 'secao';
      div.textContent = secao;
      nav.appendChild(div);
    }
    const a = document.createElement('a');
    a.href = '#' + pag.id;
    a.dataset.pagina = pag.id;
    a.innerHTML = '<span class="bola"></span><span></span>';
    a.querySelector('span:last-child').textContent = pag.titulo;
    a.addEventListener('click', (ev) => { ev.preventDefault(); irPara(pag.id); });
    nav.appendChild(a);
  }
  atualizarBolinhas();
}

// vazia / parcial / completa, por página
function statusDaPagina(pag) {
  const valores = balde(pag) || {};
  const preenchidos = pag.campos.filter((c) => preenchido(valores[c.chave]));
  if (!preenchidos.length) return 'vazia';
  const obrigatorios = pag.campos.filter((c) => c.obrigatorio);
  const completos = obrigatorios.filter((c) => {
    const v = valores[c.chave];
    if (Array.isArray(v)) return v.length > 0;
    const t = String(v || '').trim();
    return t && !/ESCREVA AQUI|^PREENCHER-DEPOIS/i.test(t);
  });
  return completos.length === obrigatorios.length ? 'completa' : 'parcial';
}

function atualizarBolinhas() {
  for (const pag of estado.paginas) {
    const a = document.querySelector('#indice a[data-pagina="' + pag.id + '"]');
    if (!a) continue;
    const bola = a.querySelector('.bola');
    bola.className = 'bola';
    const st = statusDaPagina(pag);
    if (st !== 'vazia') bola.classList.add(st);
    a.classList.toggle('atual', pag.id === estado.paginaAtual);
  }
}

function irPara(paginaId, focarCampo) {
  estado.paginaAtual = paginaId;
  const pag = estado.paginas.find((p) => p.id === paginaId);
  const main = $('#pagina');
  main.innerHTML = '';

  const h2 = document.createElement('h2');
  h2.textContent = pag.titulo;
  main.appendChild(h2);
  if (pag.descricao) {
    const p = document.createElement('p');
    p.className = 'descricao';
    p.textContent = pag.descricao;
    main.appendChild(p);
  }

  for (const campo of pag.campos) main.appendChild(montarCampo(pag, campo));

  // navegação anterior/próxima no rodapé
  const idx = estado.paginas.indexOf(pag);
  const rodape = document.createElement('div');
  rodape.className = 'navegacao-rodape';
  const antes = document.createElement('button');
  antes.className = 'botao';
  antes.textContent = '← Anterior';
  antes.disabled = idx === 0;
  antes.addEventListener('click', () => irPara(estado.paginas[idx - 1].id));
  const depois = document.createElement('button');
  depois.className = 'botao';
  depois.textContent = 'Próxima →';
  depois.disabled = idx === estado.paginas.length - 1;
  depois.addEventListener('click', () => irPara(estado.paginas[idx + 1].id));
  rodape.append(antes, depois);
  main.appendChild(rodape);

  atualizarBolinhas();
  window.scrollTo(0, 0);

  if (focarCampo) {
    const el = document.getElementById('c_' + focarCampo);
    if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); }
  }
}

function montarCampo(pag, campo) {
  const div = document.createElement('div');
  div.className = 'campo';
  div.dataset.campo = campo.chave;

  const label = document.createElement('label');
  label.htmlFor = 'c_' + campo.chave;
  label.textContent = campo.rotulo + ' ';
  if (!campo.obrigatorio) {
    const span = document.createElement('span');
    span.className = 'opcional';
    span.textContent = '(opcional)';
    label.appendChild(span);
  }
  div.appendChild(label);

  if (campo.ajuda) {
    const ajuda = document.createElement('div');
    ajuda.className = 'ajuda';
    ajuda.textContent = campo.ajuda;
    div.appendChild(ajuda);
  }

  // Campo de lista de links: em vez de caixa de texto, uma lista + modal.
  if (campo.tipo === 'links') {
    div.appendChild(montarCampoLinks(pag, campo));
    return div;
  }

  let entrada;
  if (campo.tipo === 'escolha') {
    entrada = document.createElement('select');
    const vazia = document.createElement('option');
    vazia.value = '';
    vazia.textContent = '— escolha —';
    entrada.appendChild(vazia);
    for (const op of campo.opcoes) {
      const o = document.createElement('option');
      o.value = typeof op === 'string' ? op : op.valor;
      o.textContent = typeof op === 'string' ? op : op.rotulo;
      entrada.appendChild(o);
    }
  } else if (campo.tipo === 'paragrafo') {
    entrada = document.createElement('textarea');
    if (campo.placeholder) entrada.placeholder = campo.placeholder;
  } else {
    entrada = document.createElement('input');
    entrada.type = 'text';
    if (campo.placeholder) entrada.placeholder = campo.placeholder;
  }
  entrada.id = 'c_' + campo.chave;
  entrada.value = valorDe(pag, campo.chave);
  entrada.addEventListener('input', () => {
    balde(pag)[campo.chave] = entrada.value;
    if (campo.chave === 'nome-do-curso') $('#titulo-trilha').textContent = tituloTrilha();
    agendarSave();
    atualizarBolinhas();
  });
  div.appendChild(entrada);

  // ferramentas do campo: "usar modelo" (assunto) e "ver exemplo real"
  const ferramentas = document.createElement('div');
  ferramentas.className = 'ferramentas';
  if (campo.modeloAssunto) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '⚡ usar modelo do assunto';
    btn.addEventListener('click', () => {
      const nome = (estado.dados.briefing['nome-do-curso'] || '<Trilha>').trim() || '<Trilha>';
      const prefixo = '#7DaysOfCode - ' + nome + ' ' + pag.dia + '/7: ';
      if (!entrada.value.trim() || confirm('Substituir o assunto atual pelo modelo?')) {
        entrada.value = prefixo;
        entrada.dispatchEvent(new Event('input'));
        entrada.focus();
      }
    });
    ferramentas.appendChild(btn);
  }
  if (campo.usarSlug) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '⚡ usar o slug';
    btn.addEventListener('click', () => {
      const slug = (estado.dados.briefing['slug'] || '').trim();
      if (!slug) { alert('Preencha o slug primeiro (é o primeiro campo desta página).'); return; }
      if (!entrada.value.trim() || confirm('Substituir o código atual por "' + slug + '"?')) {
        entrada.value = slug;
        entrada.dispatchEvent(new Event('input'));
      }
    });
    ferramentas.appendChild(btn);
  }
  if (pag.dominio === 'dia' && estado.exemplo[campo.chave]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '👁 ver exemplo real';
    btn.addEventListener('click', () => {
      $('#texto-exemplo').textContent = estado.exemplo[campo.chave];
      $('#modal-exemplo').classList.remove('oculta');
    });
    ferramentas.appendChild(btn);
  }
  if (ferramentas.children.length) div.appendChild(ferramentas);

  return div;
}

// ---------------------------------------------------------------------------
// Montador de links (campos tipo 'links')
// ---------------------------------------------------------------------------

// A lista de links já adicionados + o botão que abre o modal.
function montarCampoLinks(pag, campo) {
  const caixa = document.createElement('div');
  caixa.className = 'lista-links';

  const render = () => {
    caixa.innerHTML = '';
    const b = balde(pag);
    const links = Array.isArray(b[campo.chave]) ? b[campo.chave] : [];

    if (!links.length) {
      const vazio = document.createElement('div');
      vazio.className = 'links-vazio';
      vazio.textContent = 'Nenhum link adicionado ainda.';
      caixa.appendChild(vazio);
    }
    links.forEach((link, i) => {
      const item = document.createElement('div');
      item.className = 'link-item';
      item.innerHTML = '<span class="link-tipo"></span>' +
        '<div class="link-textos"><strong></strong><small></small></div>' +
        '<button type="button" class="link-remover" title="Remover este link">✕</button>';
      item.querySelector('.link-tipo').textContent = link.tipo || 'Outro';
      item.querySelector('strong').textContent = link.titulo || '';
      item.querySelector('small').textContent = link.url || '';
      item.querySelector('.link-remover').addEventListener('click', () => {
        links.splice(i, 1);
        b[campo.chave] = links;
        render();
        agendarSave();
        atualizarBolinhas();
      });
      caixa.appendChild(item);
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'botao botao-add-link';
    btn.textContent = '➕ Adicionar link';
    btn.addEventListener('click', () => abrirModalLink(pag, campo, render));
    caixa.appendChild(btn);
  };

  render();
  return caixa;
}

// Para onde vai o link quando o modal confirmar.
const modalLink = { pag: null, campo: null, aoAdicionar: null };

function abrirModalLink(pag, campo, aoAdicionar) {
  modalLink.pag = pag;
  modalLink.campo = campo;
  modalLink.aoAdicionar = aoAdicionar;

  const select = $('#link-tipo');
  select.innerHTML = '';
  for (const t of campo.opcoes || ['Outro']) {
    const o = document.createElement('option');
    o.value = t;
    o.textContent = t;
    select.appendChild(o);
  }
  $('#link-titulo').value = '';
  $('#link-url').value = '';
  $('#link-erro').classList.add('oculta');
  $('#modal-link').classList.remove('oculta');
  $('#link-titulo').focus();
}

function fecharModalLink() {
  $('#modal-link').classList.add('oculta');
}

function confirmarLink() {
  const titulo = $('#link-titulo').value.trim();
  const url = $('#link-url').value.trim();
  const erroEl = $('#link-erro');

  let msg = '';
  if (!titulo) msg = 'Preencha o título do material.';
  else if (!url) msg = 'Preencha o link (URL).';
  else if (!/^https?:\/\/\S+$/i.test(url)) msg = 'O link precisa começar com http:// ou https:// — cole o endereço completo.';
  if (msg) {
    erroEl.textContent = '⚠ ' + msg;
    erroEl.classList.remove('oculta');
    return;
  }

  const b = balde(modalLink.pag);
  const lista = Array.isArray(b[modalLink.campo.chave]) ? b[modalLink.campo.chave] : [];
  lista.push({ titulo, url, tipo: $('#link-tipo').value });
  b[modalLink.campo.chave] = lista;

  fecharModalLink();
  if (modalLink.aoAdicionar) modalLink.aoAdicionar();
  agendarSave();
  atualizarBolinhas();
}

// ---------------------------------------------------------------------------
// Auto-save
// ---------------------------------------------------------------------------

function nomeArquivoAtual() {
  const slug = (estado.dados.briefing['slug'] || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(slug) ? slug : (estado.arquivo || 'sem-nome');
}

function agendarSave() {
  if (estado.conflito) return;
  clearTimeout(estado.timerSave);
  estado.timerSave = setTimeout(salvar, 800);
}

async function salvar() {
  clearTimeout(estado.timerSave);
  if (!estado.dados || estado.conflito) return;
  const arquivo = nomeArquivoAtual();
  try {
    const r = await api('/api/rascunho', {
      arquivo,
      arquivoAnterior: estado.arquivo,
      dados: estado.dados,
      sobrescrever: estado.sobrescrever || undefined,
    });
    estado.sobrescrever = false;
    estado.arquivo = arquivo;
    estado.dados._rev = r.rev; // o carimbo de versão desta gravação
    $('#salvo').textContent = '💾 salvo às ' + new Date().toLocaleTimeString('pt-BR');
  } catch (e) {
    if (e.conflito) {
      // Outra aba salvou por cima (ou o slug já é de outro rascunho).
      // Esta aba PARA de salvar para não apagar nada.
      estado.conflito = true;
      $('#salvo').textContent = '🛑 NÃO está salvando — veja o aviso';
      alert('⚠ Este rascunho não foi salvo!\n\n' + e.message);
    } else {
      $('#salvo').textContent = '⚠ não consegui salvar: ' + e.message;
    }
  }
}

// ---------------------------------------------------------------------------
// Validação e exportação
// ---------------------------------------------------------------------------

async function validarTudo() {
  await salvar();
  $('#botao-validar').disabled = true;
  try {
    const r = await api('/api/validar', { dados: estado.dados });
    estado.problemas = r.problemas;
    mostrarProblemas(r);
  } finally {
    $('#botao-validar').disabled = false;
  }
}

function mostrarProblemas(r) {
  const painel = $('#painel-problemas');
  const lista = $('#lista-problemas');
  painel.classList.remove('oculta');
  lista.innerHTML = '';

  const erros = r.problemas.filter((p) => p.nivel === 'erro').length;
  const avisos = r.problemas.length - erros;
  $('#problemas-titulo').textContent = 'Validação — ' + erros + ' erro(s), ' + avisos + ' aviso(s)';

  if (!r.problemas.length) {
    const li = document.createElement('li');
    li.className = 'tudo-certo';
    li.textContent = '✅ Nenhum problema encontrado!';
    lista.appendChild(li);
  }
  for (const p of r.problemas) {
    const li = document.createElement('li');
    li.className = p.nivel;
    li.innerHTML = '<span class="nivel"></span> <span class="msg"></span>';
    li.querySelector('.nivel').textContent = p.nivel === 'erro' ? 'ERRO' : 'AVISO';
    li.querySelector('.msg').textContent = ' ' + p.msg;
    li.addEventListener('click', () => irPara(p.paginaId, p.campo));
    lista.appendChild(li);
  }

  // saída do gerar-trilha.js --teste (a validação "de verdade")
  const div = $('#saida-gerador');
  div.innerHTML = '<div class="rotulo">Prova real: gerar-trilha.js --teste</div>';
  const pre = document.createElement('pre');
  const cabecalho = r.gerador.ok === null ? 'ℹ️ '
    : r.gerador.ok ? '✅ O gerador aceitou o briefing.\n\n'
    : '❌ O gerador recusou o briefing:\n\n';
  pre.textContent = cabecalho + r.gerador.saida;
  div.appendChild(pre);
}

async function exportarTudo() {
  await salvar();
  const temErro = estado.problemas.some((p) => p.nivel === 'erro');
  if (temErro && !confirm('A última validação encontrou ERROS. Gerar os arquivos mesmo assim?')) return;
  try {
    const r = await api('/api/exportar', { dados: estado.dados });
    alert('Arquivos gerados dentro de _ferramentas-trilhas:\n\n📄 ' + r.briefing + '\n📄 ' + r.docx +
      '\n📁 ' + r.html + ' (7 HTMLs, um por dia — para colar no HubSpot)' +
      '\n\nPróximos passos:\n1. node gerar-trilha.js ' + r.briefing + ' --teste\n2. Suba o .docx para a pasta da trilha no SharePoint.\n3. No HubSpot, cole o HTML de cada dia no e-mail correspondente.');
  } catch (e) {
    alert('Não consegui exportar: ' + e.message);
  }
}

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

async function iniciar() {
  const [campos, exemplo] = await Promise.all([api('/api/campos'), api('/api/exemplo')]);
  estado.paginas = campos.paginas;
  estado.exemplo = exemplo;

  $('#botao-nova').addEventListener('click', novaTrilha);
  $('#botao-importar').addEventListener('click', () => $('#arquivos-importar').click());
  $('#arquivos-importar').addEventListener('change', async (ev) => {
    const lista = Array.from(ev.target.files || []);
    ev.target.value = ''; // permite escolher os mesmos arquivos de novo
    if (!lista.length) return;
    try { await importarArquivos(lista); } catch (e) { alert(e.message); }
  });
  $('#botao-voltar').addEventListener('click', async () => { await salvar(); mostrarInicio(); });
  $('#botao-validar').addEventListener('click', validarTudo);
  $('#botao-exportar').addEventListener('click', exportarTudo);
  $('#fechar-problemas').addEventListener('click', () => $('#painel-problemas').classList.add('oculta'));
  $('#fechar-exemplo').addEventListener('click', () => $('#modal-exemplo').classList.add('oculta'));
  $('#modal-exemplo').addEventListener('click', (ev) => {
    if (ev.target === $('#modal-exemplo')) $('#modal-exemplo').classList.add('oculta');
  });

  // modal de adicionar link
  $('#fechar-link').addEventListener('click', fecharModalLink);
  $('#cancelar-link').addEventListener('click', fecharModalLink);
  $('#adicionar-link').addEventListener('click', confirmarLink);
  $('#modal-link').addEventListener('click', (ev) => {
    if (ev.target === $('#modal-link')) fecharModalLink();
  });
  for (const id of ['#link-titulo', '#link-url']) {
    $(id).addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); confirmarLink(); }
    });
  }

  mostrarInicio();
}

iniciar();
