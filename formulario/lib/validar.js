'use strict';
/*
 * validar.js — todas as regras de preenchimento, do briefing e dos e-mails.
 *
 * Boa parte das regras de e-mail já existia EM PROSA no MODELO-emails.md
 * (ex.: "não usar 'até amanhã' no Dia 7", "e-mail longo o Gmail corta").
 * Aqui elas viram checagem automática.
 *
 * Cada problema: { nivel: 'erro'|'aviso', paginaId, campo, msg }
 * O paginaId+campo permitem à interface levar o clique direto ao campo.
 */

const { CATEGORIAS, PLACEHOLDERS, todasAsPaginas } = require('./campos');

const RE_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LIMITE_ASSUNTO = 75;          // o modelo fixo já ocupa ~40; acima de ~75 corta até no computador
const PREHEADER_MIN = 40;
const PREHEADER_MAX = 140;
const LIMITE_EMAIL = 6000;          // caracteres somados; perto do corte do Gmail

function vazio(v) {
  return !v || !String(v).trim();
}

function pareceLugarNenhum(v) {
  if (vazio(v)) return true;
  const t = String(v).trim().toUpperCase();
  return PLACEHOLDERS.some((p) => t.startsWith(p.toUpperCase()));
}

function urlValida(v) {
  return /^https?:\/\/\S+$/i.test(String(v).trim());
}

function validarTudo(dados) {
  const problemas = [];
  const add = (nivel, paginaId, campo, msg) => problemas.push({ nivel, paginaId, campo, msg });

  const b = (dados && dados.briefing) || {};
  const cfg = (dados && dados.emails && dados.emails.config) || {};
  const dias = (dados && dados.emails && dados.emails.dias) || [];
  const concl = (dados && dados.emails && dados.emails.conclusao) || {};
  const paginas = todasAsPaginas();

  // -------------------------------------------------------------------------
  // Briefing e configuração fixa: obrigatórios + placeholders não trocados
  // -------------------------------------------------------------------------
  for (const pag of paginas) {
    if (pag.dominio === 'dia') continue;
    const valores = pag.dominio === 'briefing' ? b : pag.dominio === 'conclusao' ? concl : cfg;
    for (const c of pag.campos) {
      if (c.chave === 'hubspot-formid') continue; // tratado como aviso, abaixo
      // Campo com padrão fixo (ex.: chamado final da conclusão): se ainda não
      // gravado (rascunho antigo sem este balde), conta como preenchido.
      const v = valores[c.chave] === undefined || valores[c.chave] === '' ? c.padrao : valores[c.chave];
      if (c.obrigatorio && pareceLugarNenhum(v)) {
        add('erro', pag.id, c.chave, '"' + c.rotulo + '" não foi preenchido.');
      }
    }
  }

  const slug = String(b['slug'] || '').trim();
  if (slug && !RE_SLUG.test(slug)) {
    add('erro', 'briefing-identidade', 'slug', 'O slug deve ter só letras minúsculas, números e hífens (sem espaços/acentos). Recebido: "' + slug + '".');
  }
  const codigo = String(b['codigo'] || '').trim();
  if (codigo && !pareceLugarNenhum(codigo) && !RE_SLUG.test(codigo)) {
    add('aviso', 'briefing-identidade', 'codigo', 'O código "' + codigo + '" tem formato incomum. Confirme com o design o nome exato do ícone.');
  }
  const cat = String(b['categoria'] || '').trim().toLowerCase();
  const slugsCategorias = CATEGORIAS.map((c) => c.slug);
  if (cat && !slugsCategorias.includes(cat)) {
    add('erro', 'briefing-identidade', 'categoria', 'Categoria deve ser uma de: ' + slugsCategorias.join(', ') + '.');
  }
  if (!vazio(b['foto-do-autor']) && !pareceLugarNenhum(b['foto-do-autor']) && !urlValida(b['foto-do-autor'])) {
    add('erro', 'briefing-autor', 'foto-do-autor', 'A foto do autor precisa ser um link começando com http:// ou https://.');
  }
  for (const rede of ['instagram-do-autor', 'linkedin-do-autor']) {
    if (!vazio(b[rede]) && !urlValida(b[rede])) {
      add('aviso', 'briefing-autor', rede, 'O link de "' + rede + '" não parece uma URL válida.');
    }
  }
  if (!vazio(cfg['rodape-legal']) && !/descadastr|não quero mais receber/i.test(cfg['rodape-legal'])) {
    add('aviso', 'emails-config', 'rodape-legal', 'O rodapé legal não menciona o descadastro — ele é obrigatório por lei.');
  }

  // -------------------------------------------------------------------------
  // E-mails, dia a dia
  // -------------------------------------------------------------------------
  const trilhasNoAssunto = {}; // nome extraído do assunto -> dias em que aparece

  for (let n = 1; n <= 7; n++) {
    const pagId = 'dia-' + n;
    const d = dias[n - 1] || {};
    const pagDia = paginas.find((p) => p.id === pagId);

    // Obrigatórios (inclui "solução do dia anterior" nos dias 2–7)
    for (const c of pagDia.campos) {
      const v = d[c.chave];
      if (c.tipo === 'links') {
        // Lista de links: cada item precisa de título e de URL válida.
        const links = Array.isArray(v) ? v : [];
        if (c.obrigatorio && !links.length) {
          add('erro', pagId, c.chave, 'Dia ' + n + ': "' + c.rotulo + '" não tem nenhum link.');
        }
        links.forEach((link, i) => {
          const pos = 'link ' + (i + 1);
          if (vazio(link && link.titulo)) {
            add('erro', pagId, c.chave, 'Dia ' + n + ': o ' + pos + ' de "' + c.rotulo + '" está sem título.');
          }
          if (!urlValida(link && link.url)) {
            add('erro', pagId, c.chave, 'Dia ' + n + ': o ' + pos + ' de "' + c.rotulo + '" ("' + ((link && link.titulo) || 'sem título') + '") não tem uma URL válida — precisa começar com http:// ou https://.');
          }
        });
        continue;
      }
      if (c.obrigatorio && vazio(v)) {
        add('erro', pagId, c.chave, 'Dia ' + n + ': "' + c.rotulo + '" não foi preenchido.');
      } else if (!vazio(v) && /ESCREVA AQUI/i.test(v)) {
        add('erro', pagId, c.chave, 'Dia ' + n + ': "' + c.rotulo + '" ainda tem o texto do modelo ("ESCREVA AQUI").');
      }
    }

    const assunto = String(d['assunto'] || '').trim();
    if (assunto) {
      // Numeração N/7 — o erro mais provável, porque cada dia nasce de uma cópia
      const m = assunto.match(/(\d)\s*\/\s*7/);
      if (!m) {
        add('erro', pagId, 'assunto', 'Dia ' + n + ': o assunto não tem a numeração "' + n + '/7".');
      } else if (Number(m[1]) !== n) {
        add('erro', pagId, 'assunto', 'Dia ' + n + ': o assunto diz "' + m[1] + '/7" — deveria ser "' + n + '/7". Provável sobra de copiar-colar.');
      }
      // Nome da trilha entre "#7DaysOfCode - " e o "N/7"
      const t = assunto.match(/#7DaysOfCode\s*-\s*(.+?)\s*\d\s*\/\s*7/i);
      if (t) {
        const nome = t[1].trim();
        (trilhasNoAssunto[nome] = trilhasNoAssunto[nome] || []).push(n);
      }
      // O modelo fixo ("#7DaysOfCode - <Trilha> N/7: ") já ocupa ~40 caracteres,
      // então só avisamos quando o total passa do que o desktop exibe (~75).
      // No celular o corte é inevitável — o que ajuda é o tema vir logo após o "N/7:".
      const tamAssunto = [...assunto].length; // emoji conta como 1, não 2
      if (tamAssunto > LIMITE_ASSUNTO) {
        add('aviso', pagId, 'assunto', 'Dia ' + n + ': assunto com ' + tamAssunto + ' caracteres — acima de ~' + LIMITE_ASSUNTO + ' corta até no computador. O modelo fixo já ocupa ~40; tente encurtar o tema depois do "' + n + '/7:".');
      }
    }

    const preheader = String(d['preheader'] || '').trim();
    if (preheader && (preheader.length < PREHEADER_MIN || preheader.length > PREHEADER_MAX)) {
      add('aviso', pagId, 'preheader', 'Dia ' + n + ': preheader com ' + preheader.length + ' caracteres — o ideal fica entre ' + PREHEADER_MIN + ' e ' + PREHEADER_MAX + '.');
    }

    // [nome] grafado errado: o HubSpot só substitui exatamente "[nome]".
    // Trechos entre crases (`assim` ou blocos ```) são código, não
    // personalização — então saem do texto antes da checagem.
    for (const c of pagDia.campos) {
      if (c.tipo === 'links') continue;
      const foraDoCodigo = String(d[c.chave] || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`\n]*`/g, ' ');
      const errados = (foraDoCodigo.match(/\[\s*nome\s*\]|\{\s*nome\s*\}/gi) || []).filter((tok) => tok !== '[nome]');
      if (errados.length) {
        add('erro', pagId, c.chave, 'Dia ' + n + ': personalização grafada errada (' + [...new Set(errados)].join(', ') + ') — o HubSpot só troca exatamente "[nome]".');
      }
    }

    // Solução do dia anterior
    const solucao = String(d['solucao-anterior'] || '').trim();
    if (n === 1 && solucao) {
      add('erro', pagId, 'solucao-anterior', 'Dia 1: não existe "solução do dia anterior" — este texto seria ignorado ou confundiria o marketing.');
    }
    if (n >= 2 && solucao && /gist\.github\.com/i.test(solucao)) {
      add('aviso', pagId, 'solucao-anterior', 'Dia ' + n + ': a solução aponta para um Gist — o padrão é usar o repositório da trilha em github.com/7-days-of-code (branch solucao-dia-' + (n - 1) + ').');
    }

    // Fechamento do Dia 7 não pode prometer amanhã
    if (n === 7 && /até amanhã/i.test(String(d['fechamento'] || ''))) {
      add('erro', pagId, 'fechamento', 'Dia 7: o fechamento diz "até amanhã", mas é o último dia — troque pelo encerramento da jornada.');
    }

    // Abertura dos dias 2–7 deveria retomar o desafio de ontem.
    // A checagem é por palavras (não entende o sentido do texto) — por isso o
    // aviso diz o que procurou e deixa claro que pode ser ignorado.
    const abertura = String(d['abertura'] || '');
    const reRetomada = new RegExp('ontem|anterior|solu[cç]|[uú]ltimo desafio|desafio passado|dia\\s*' + (n - 1) + '\\b', 'i');
    if (n >= 2 && abertura.trim() && !reRetomada.test(abertura)) {
      add('aviso', pagId, 'abertura', 'Dia ' + n + ': não encontrei na abertura palavras como "ontem", "anterior", "solução" ou "Dia ' + (n - 1) + '". É a abertura que retoma o desafio de ontem e avisa que a solução está no fim do e-mail — se ela já faz isso com outras palavras, ignore este aviso.');
    }

    // Tamanho total do dia (o Gmail corta e-mail longo — e a solução fica no fim)
    const total = pagDia.campos.reduce((s, c) => {
      const v = d[c.chave];
      if (c.tipo === 'links') {
        const links = Array.isArray(v) ? v : [];
        return s + links.reduce((t, l) => t + String((l && l.titulo) || '').length + String((l && l.url) || '').length, 0);
      }
      return s + String(v || '').length;
    }, 0);
    if (total > LIMITE_EMAIL) {
      add('aviso', pagId, 'desafio', 'Dia ' + n + ': e-mail com ~' + total + ' caracteres — o Gmail corta mensagens longas ("[Mensagem truncada]") e a solução, que fica no fim, é o que some. Prefira links.');
    }
  }

  // -------------------------------------------------------------------------
  // E-mail de Conclusão (depois do Dia 7) — checagens próprias
  // -------------------------------------------------------------------------
  const pagConclId = 'email-conclusao';
  const assuntoConcl = String(concl['assunto'] || '');
  if (assuntoConcl && /(\d)\s*\/\s*7/.test(assuntoConcl)) {
    add('erro', pagConclId, 'assunto', 'Conclusão: o assunto não deve trazer a numeração "N/7" — este é o e-mail de encerramento, não um dia.');
  }
  const nomeConcl = String(concl['solucao-dia-7'] || '').trim();
  if (nomeConcl && !urlValida(nomeConcl)) {
    add('erro', pagConclId, 'solucao-dia-7', 'Conclusão: a solução do Dia 7 precisa ser um link começando com http:// ou https://.');
  }

  // Nome da trilha inconsistente entre os assuntos (erro tipo "bug do Flutter")
  const nomes = Object.keys(trilhasNoAssunto);
  if (nomes.length > 1) {
    const desc = nomes.map((nm) => '"' + nm + '" (dia' + (trilhasNoAssunto[nm].length > 1 ? 's' : '') + ' ' + trilhasNoAssunto[nm].join(', ') + ')').join(' vs ');
    add('erro', 'dia-1', 'assunto', 'Os assuntos usam nomes de trilha diferentes: ' + desc + '. Provável sobra de outra trilha.');
  }

  // Opcionais vazios nos 7 dias — provável esquecimento, não escolha
  const semConteudo = (v) => (Array.isArray(v) ? !v.length : vazio(v));
  for (const opc of ['dica', 'extra', 'exercicio-opcional']) {
    if (dias.every((d) => semConteudo((d || {})[opc]))) {
      const nome = opc === 'extra' ? 'links extras' : opc.replace(/-/g, ' ');
      add('aviso', 'dia-1', opc, 'Nenhum dos 7 dias tem "' + nome + '". É opcional, mas em todos os dias vazio costuma ser esquecimento.');
    }
  }

  // -------------------------------------------------------------------------
  // Avisos gerais (não impedem a entrega)
  // -------------------------------------------------------------------------
  if (pareceLugarNenhum(b['hubspot-formid'])) {
    add('aviso', 'briefing-identidade', 'hubspot-formid', 'O formId do HubSpot ainda não foi preenchido — a página existe, mas o botão de inscrição não funciona sem ele.');
  }
  if (codigo && !pareceLugarNenhum(codigo)) {
    add('aviso', 'briefing-identidade', 'codigo', 'Lembrete: o ícone "icon-' + codigo + '-card.svg" precisa estar commitado no repositório caelum/alura-site (entra por PR — conte com o tempo de aprovação).');
  }

  // Erros primeiro, avisos depois
  problemas.sort((a, z) => (a.nivel === z.nivel ? 0 : a.nivel === 'erro' ? -1 : 1));
  return problemas;
}

module.exports = { validarTudo };
