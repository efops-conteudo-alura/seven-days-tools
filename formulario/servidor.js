#!/usr/bin/env node
'use strict';
/*
 * servidor.js — formulário local de preenchimento de trilhas do 7 Days of Code.
 *
 * Uso:  node formulario/servidor.js
 *       (abre sozinho no navegador; Ctrl+C encerra)
 *
 * Node puro, sem dependências. Escuta SÓ em 127.0.0.1 — nunca fica
 * visível na rede. Rascunhos em ../rascunhos/, arquivos finais em
 * ../briefings/ (o .md) e ../saida/ (o .docx).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const { todasAsPaginas, rascunhoNovo } = require('./lib/campos');
const { gerarBriefingMd } = require('./lib/briefing-md');
const { gerarEmailsDocx } = require('./lib/emails-docx');
const { gerarEmailsHtml } = require('./lib/emails-html');
const { validarTudo } = require('./lib/validar');
const { importarArquivos } = require('./lib/importar');

const RAIZ_FERRAMENTAS = path.join(__dirname, '..');
const DIR_PUBLIC = path.join(__dirname, 'public');
const DIR_RASCUNHOS = path.join(RAIZ_FERRAMENTAS, 'rascunhos');
const DIR_BACKUPS = path.join(DIR_RASCUNHOS, 'backups');
const DIR_BRIEFINGS = path.join(RAIZ_FERRAMENTAS, 'briefings');
const DIR_SAIDA = path.join(RAIZ_FERRAMENTAS, 'saida');
const GERAR_TRILHA = path.join(RAIZ_FERRAMENTAS, 'gerar-trilha.js');
const EXEMPLO_MD = path.join(RAIZ_FERRAMENTAS, 'exemplo-emails-logica-js.md');

const PORTA = 7307;
const RE_ARQUIVO = /^[a-z0-9][a-z0-9-]{0,63}$/; // nome de rascunho permitido

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function json(res, status, obj) {
  const corpo = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(corpo);
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let dados = '';
    req.on('data', (c) => {
      dados += c;
      if (dados.length > 5 * 1024 * 1024) { reject(new Error('corpo grande demais')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(dados ? JSON.parse(dados) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// Nome de arquivo de rascunho seguro (impede ../ e afins).
function nomeSeguro(nome) {
  const n = String(nome || '').trim().toLowerCase();
  return RE_ARQUIVO.test(n) ? n : null;
}

// Nome de trilha vira nome de arquivo Windows-válido (mantém acentos e o —).
function nomeArquivoDocx(trilha) {
  const limpo = String(trilha || 'trilha').replace(/[\\/:*?"<>|]/g, '').trim() || 'trilha';
  return 'E-mails — ' + limpo + '.docx';
}

// Carimbo de versão de um rascunho: gravado dentro do arquivo (_rev) e
// devolvido a quem salvou. Uma aba com carimbo velho não sobrescreve nada.
function novaRev() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Guarda uma cópia do arquivo atual em rascunhos/backups/ antes de qualquer
// sobrescrita ou renomeação. No máximo uma cópia a cada 10 minutos por
// rascunho (senão o auto-save geraria centenas); mantém as 40 mais recentes.
// "sempre" pula a regra dos 10 minutos (usado quando o arquivo vai sumir).
function fazerBackup(arquivo, caminho, sempre) {
  try {
    fs.mkdirSync(DIR_BACKUPS, { recursive: true });
    const meus = fs.readdirSync(DIR_BACKUPS).filter((f) => f.startsWith(arquivo + '--')).sort();
    const maisNovo = meus[meus.length - 1];
    if (!sempre && maisNovo && Date.now() - fs.statSync(path.join(DIR_BACKUPS, maisNovo)).mtimeMs < 10 * 60 * 1000) return;
    const carimbo = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    fs.copyFileSync(caminho, path.join(DIR_BACKUPS, arquivo + '--' + carimbo + '.json'));
    for (const velho of meus.slice(0, Math.max(0, meus.length - 39))) {
      fs.unlinkSync(path.join(DIR_BACKUPS, velho));
    }
  } catch (e) { /* backup nunca pode impedir o save em si */ }
}

// ---------------------------------------------------------------------------
// Exemplo real (Dia 2 da Rafa Ballerini) — parseado do arquivo existente
// ---------------------------------------------------------------------------

const MAPA_EXEMPLO = {
  'Assunto': 'assunto',
  'Abertura': 'abertura',
  'Gancho (introdução ao tema)': 'gancho',
  'Conceito do dia': 'conceito',
  'Desafio do dia': 'desafio',
  'Exercício opcional': 'exercicio-opcional',
  'Dica': 'dica',
  'Extra': 'extra',
  'Solução do dia anterior (Dia 1)': 'solucao-anterior',
  'Fechamento': 'fechamento',
};

function carregarExemplo() {
  let texto;
  try { texto = fs.readFileSync(EXEMPLO_MD, 'utf8'); } catch (e) { return {}; }
  const exemplo = {};
  let chaveAtual = null;
  let buffer = [];
  const salvar = () => {
    if (chaveAtual) exemplo[chaveAtual] = buffer.join('\n').trim();
  };
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^\*\*(.+?):?\*\*\s*(.*)$/); // linhas "**Rótulo:**"
    if (m && MAPA_EXEMPLO[m[1].replace(/:$/, '')]) {
      salvar();
      chaveAtual = MAPA_EXEMPLO[m[1].replace(/:$/, '')];
      buffer = m[2] ? [m[2]] : [];
    } else if (/^(##|---)/.test(linha)) {
      salvar();
      chaveAtual = null;
    } else if (chaveAtual) {
      buffer.push(linha);
    }
  }
  salvar();
  return exemplo;
}

// ---------------------------------------------------------------------------
// Rotas da API
// ---------------------------------------------------------------------------

async function api(req, res, url) {
  const rota = url.pathname;

  if (rota === '/api/campos' && req.method === 'GET') {
    return json(res, 200, { paginas: todasAsPaginas() });
  }

  if (rota === '/api/exemplo' && req.method === 'GET') {
    return json(res, 200, carregarExemplo());
  }

  if (rota === '/api/rascunhos' && req.method === 'GET') {
    fs.mkdirSync(DIR_RASCUNHOS, { recursive: true });
    const lista = fs.readdirSync(DIR_RASCUNHOS)
      .filter((f) => f.endsWith('.7doc.json'))
      .map((f) => {
        const arquivo = f.replace(/\.7doc\.json$/, '');
        let nome = arquivo;
        try {
          const d = JSON.parse(fs.readFileSync(path.join(DIR_RASCUNHOS, f), 'utf8'));
          nome = (d.briefing && d.briefing['nome-do-curso']) || arquivo;
        } catch (e) { /* rascunho ilegível aparece pelo nome do arquivo */ }
        const mtime = fs.statSync(path.join(DIR_RASCUNHOS, f)).mtime;
        return { arquivo, nome, atualizadoEm: mtime.toISOString() };
      })
      .sort((a, z) => z.atualizadoEm.localeCompare(a.atualizadoEm));
    return json(res, 200, lista);
  }

  if (rota === '/api/rascunho' && req.method === 'GET') {
    const arquivo = nomeSeguro(url.searchParams.get('arquivo'));
    if (!arquivo) return json(res, 400, { erro: 'nome de rascunho inválido' });
    const caminho = path.join(DIR_RASCUNHOS, arquivo + '.7doc.json');
    if (!fs.existsSync(caminho)) return json(res, 404, { erro: 'rascunho não encontrado' });
    return json(res, 200, JSON.parse(fs.readFileSync(caminho, 'utf8')));
  }

  if (rota === '/api/rascunho' && req.method === 'POST') {
    const corpo = await lerCorpo(req);
    const arquivo = nomeSeguro(corpo.arquivo);
    if (!arquivo) return json(res, 400, { erro: 'nome de rascunho inválido' });
    const dados = corpo.dados || {};
    const caminho = path.join(DIR_RASCUNHOS, arquivo + '.7doc.json');
    fs.mkdirSync(DIR_RASCUNHOS, { recursive: true });

    // Proteção contra sobrescrita cega: o arquivo no disco tem um carimbo
    // de versão (_rev). Se quem está salvando traz um carimbo diferente,
    // é uma aba desatualizada (ou uma trilha nova com slug repetido) —
    // recusa em vez de apagar o trabalho mais novo.
    if (fs.existsSync(caminho) && !corpo.sobrescrever) {
      let noDisco = null;
      try { noDisco = JSON.parse(fs.readFileSync(caminho, 'utf8')); } catch (e) { /* ilegível: deixa regravar */ }
      const revDisco = noDisco && noDisco._rev;
      if (noDisco && revDisco !== dados._rev) {
        const erro = dados._rev
          ? 'Este rascunho foi salvo por outra aba ou janela do formulário depois que você o abriu aqui. Para não apagar o trabalho mais novo, esta aba parou de salvar — feche-a e continue na mais recente (ou reabra o rascunho pela tela inicial).'
          : 'Já existe um rascunho com o slug "' + arquivo + '". Abra-o pela tela inicial em vez de começar do zero, ou use outro slug.';
        return json(res, 409, { erro, conflito: true });
      }
    }

    if (fs.existsSync(caminho)) fazerBackup(arquivo, caminho);
    dados._rev = novaRev();
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf8');

    // O slug mudou? O arquivo antigo vira backup em vez de sumir.
    const anterior = nomeSeguro(corpo.arquivoAnterior);
    if (anterior && anterior !== arquivo) {
      const velho = path.join(DIR_RASCUNHOS, anterior + '.7doc.json');
      if (fs.existsSync(velho)) { fazerBackup(anterior, velho, true); fs.unlinkSync(velho); }
    }
    return json(res, 200, { ok: true, arquivo, rev: dados._rev });
  }

  if (rota === '/api/importar' && req.method === 'POST') {
    const corpo = await lerCorpo(req);
    try {
      const r = importarArquivos(Array.isArray(corpo.arquivos) ? corpo.arquivos : []);
      return json(res, 200, { ok: true, dados: r.dados, resumo: r.resumo });
    } catch (e) {
      return json(res, 400, { erro: 'Não consegui importar: ' + String(e.message || e) });
    }
  }

  if (rota === '/api/novo' && req.method === 'GET') {
    return json(res, 200, rascunhoNovo());
  }

  if (rota === '/api/validar' && req.method === 'POST') {
    const corpo = await lerCorpo(req);
    const problemas = validarTudo(corpo.dados || {});

    // Prova real: roda o PRÓPRIO gerar-trilha.js --teste sobre o .md gerado.
    // Assim a validação final é a do gerador de verdade, não uma cópia.
    // Só é possível com o repositório completo (o gerador lê 7daysofcode/);
    // quem usa a versão do zip pula esta etapa sem erro.
    const temRepositorio = fs.existsSync(path.join(RAIZ_FERRAMENTAS, '..', '7daysofcode', 'home', 'default_metadata.yaml'));
    let gerador;
    if (!temRepositorio) {
      gerador = { ok: null, saida: 'Etapa pulada: este computador não tem o repositório completo (pasta 7daysofcode). As checagens acima continuam valendo — a prova real do gerador roda no computador de quem publica.' };
    } else {
      const md = gerarBriefingMd(corpo.dados || {});
      fs.mkdirSync(DIR_RASCUNHOS, { recursive: true });
      const tmp = path.join(DIR_RASCUNHOS, '.tmp-validacao.md');
      fs.writeFileSync(tmp, md, 'utf8');
      gerador = await new Promise((resolve) => {
        execFile(process.execPath, [GERAR_TRILHA, tmp, '--teste'], { timeout: 15000 }, (err, stdout, stderr) => {
          resolve({ ok: !err, saida: ((stdout || '') + (stderr || '')).trim() });
        });
      });
      fs.unlinkSync(tmp);
    }
    return json(res, 200, { problemas, gerador });
  }

  if (rota === '/api/exportar' && req.method === 'POST') {
    const corpo = await lerCorpo(req);
    const dados = corpo.dados || {};
    const slug = nomeSeguro((dados.briefing || {})['slug']);
    if (!slug) return json(res, 400, { erro: 'Preencha um slug válido antes de exportar (só letras minúsculas, números e hífens).' });

    fs.mkdirSync(DIR_BRIEFINGS, { recursive: true });
    fs.mkdirSync(DIR_SAIDA, { recursive: true });

    const caminhoMd = path.join(DIR_BRIEFINGS, slug + '.md');
    fs.writeFileSync(caminhoMd, gerarBriefingMd(dados), 'utf8');

    const nomeDocx = nomeArquivoDocx((dados.briefing || {})['nome-do-curso']);
    const caminhoDocx = path.join(DIR_SAIDA, nomeDocx);
    fs.writeFileSync(caminhoDocx, gerarEmailsDocx(dados));

    // Os 7 HTMLs dos e-mails (um por dia), numa pasta própria da trilha.
    const dirHtml = path.join(DIR_SAIDA, slug + '-html');
    fs.mkdirSync(dirHtml, { recursive: true });
    for (const arq of gerarEmailsHtml(dados)) {
      fs.writeFileSync(path.join(dirHtml, arq.nome), arq.conteudo, 'utf8');
    }

    return json(res, 200, {
      ok: true,
      briefing: path.relative(RAIZ_FERRAMENTAS, caminhoMd).replace(/\\/g, '/'),
      docx: path.relative(RAIZ_FERRAMENTAS, caminhoDocx).replace(/\\/g, '/'),
      html: path.relative(RAIZ_FERRAMENTAS, dirHtml).replace(/\\/g, '/'),
    });
  }

  return json(res, 404, { erro: 'rota desconhecida' });
}

// ---------------------------------------------------------------------------
// Arquivos estáticos + inicialização
// ---------------------------------------------------------------------------

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);

    const alvo = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const caminho = path.join(DIR_PUBLIC, path.normalize(alvo));
    if (!caminho.startsWith(DIR_PUBLIC) || !fs.existsSync(caminho)) {
      res.writeHead(404); return res.end('não encontrado');
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(caminho)] || 'application/octet-stream' });
    res.end(fs.readFileSync(caminho));
  } catch (e) {
    json(res, 500, { erro: String(e.message || e) });
  }
});

servidor.listen(PORTA, '127.0.0.1', () => {
  const endereco = 'http://127.0.0.1:' + PORTA;
  console.log('\n📝 Formulário de trilhas no ar: ' + endereco);
  console.log('   (Ctrl+C para encerrar)\n');
  // Abre o navegador sozinho.
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', endereco]]
    : process.platform === 'darwin' ? ['open', [endereco]]
    : ['xdg-open', [endereco]];
  execFile(cmd[0], cmd[1], () => { /* se não abrir, o link está no console */ });
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('\n❌ A porta ' + PORTA + ' já está em uso — o formulário já deve estar aberto em http://127.0.0.1:' + PORTA + '\n');
    process.exit(1);
  }
  throw e;
});
