'use strict';
/*
 * importar.js — o caminho de volta: transforma arquivos já gerados
 * (briefing .md, Word dos e-mails .docx, rascunho .7doc.json) num
 * rascunho preenchido. Serve para recuperar uma trilha sem redigitar.
 *
 * O .docx é lido de verdade (é um ZIP com XMLs dentro): funciona tanto
 * com o arquivo que o formulário gerou quanto com um que o Word regravou.
 */

const zlib = require('zlib');
const { ORDEM_BRIEFING, todasAsPaginas, rascunhoNovo } = require('./campos');

// ---------------------------------------------------------------------------
// Leitura de ZIP (o .docx) — aceita entradas sem compressão e deflate
// ---------------------------------------------------------------------------

function lerZip(buf) {
  // Acha o "end of central directory" varrendo do fim para o começo.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('o arquivo não parece um .docx válido');
  const total = buf.readUInt16LE(eocd + 10);
  let pos = buf.readUInt32LE(eocd + 16);
  const partes = {};
  for (let n = 0; n < total; n++) {
    if (pos + 46 > buf.length || buf.readUInt32LE(pos) !== 0x02014b50) break;
    const metodo = buf.readUInt16LE(pos + 10);
    const tamComp = buf.readUInt32LE(pos + 20);
    const tamNome = buf.readUInt16LE(pos + 28);
    const tamExtra = buf.readUInt16LE(pos + 30);
    const tamComent = buf.readUInt16LE(pos + 32);
    const offsetLocal = buf.readUInt32LE(pos + 42);
    const nome = buf.toString('utf8', pos + 46, pos + 46 + tamNome);
    // No header local, nome e extra podem ter tamanhos próprios.
    const nomeLocal = buf.readUInt16LE(offsetLocal + 26);
    const extraLocal = buf.readUInt16LE(offsetLocal + 28);
    const inicio = offsetLocal + 30 + nomeLocal + extraLocal;
    const dados = buf.slice(inicio, inicio + tamComp);
    if (metodo === 0) partes[nome] = dados;
    else if (metodo === 8) partes[nome] = zlib.inflateRawSync(dados);
    pos += 46 + tamNome + tamExtra + tamComent;
  }
  return partes;
}

// ---------------------------------------------------------------------------
// Leitura dos parágrafos do word/document.xml
// ---------------------------------------------------------------------------

function desescapar(t) {
  return String(t)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

// Um <w:p> vira { codigo, segmentos: [{ texto, negrito }] }.
// "codigo" = linha em fonte Consolas (o bloco entre ``` na exportação).
function lerParagrafo(xml) {
  const codigo = /<w:rFonts [^>]*w:ascii="Consolas"/.test(xml);
  const segmentos = [];
  const reRun = /<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g;
  let m;
  while ((m = reRun.exec(xml))) {
    const run = m[1];
    const rPr = (run.match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0];
    const negrito = /<w:b\b(?![^>]*w:val="(?:0|false)")/.test(rPr);
    let texto = '';
    const reT = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:br\s*\/>|<w:tab\s*\/>/g;
    let t;
    while ((t = reT.exec(run))) {
      texto += t[1] !== undefined ? desescapar(t[1]) : (t[0].indexOf('w:br') >= 0 ? '\n' : '\t');
    }
    if (!texto) continue;
    const anterior = segmentos[segmentos.length - 1];
    if (anterior && anterior.negrito === negrito) anterior.texto += texto;
    else segmentos.push({ texto, negrito });
  }
  return { codigo, segmentos };
}

// Reconstrói a linha como o formulário escreve: **trecho** para negrito.
function segmentosParaTexto(segs) {
  return segs.map((s) => {
    if (!s.negrito || !s.texto.trim()) return s.texto;
    const m = s.texto.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return m[1] + '**' + m[2] + '**' + m[3];
  }).join('');
}

// O parágrafo começa com "Rótulo: " em negrito? Então é o início de um campo.
function inicioDeCampo(par, campos) {
  const segs = par.segmentos;
  if (!segs.length || !segs[0].negrito) return null;
  const inicio = segs[0].texto;
  const candidatos = [...campos].sort((a, z) => z.rotulo.length - a.rotulo.length);
  for (const c of candidatos) {
    if (!inicio.startsWith(c.rotulo + ':')) continue;
    const sobra = inicio.slice(c.rotulo.length + 1).replace(/^ /, '');
    const resto = [...(sobra ? [{ texto: sobra, negrito: true }] : []), ...segs.slice(1)];
    return { campo: c, resto: segmentosParaTexto(resto) };
  }
  return null;
}

// Junta as linhas acumuladas de um campo de volta ao formato do formulário
// (linhas de código voltam para dentro de cercas de três crases).
function montarValor(campo, linhas) {
  while (linhas.length && !linhas[linhas.length - 1].codigo && !linhas[linhas.length - 1].texto.trim()) linhas.pop();
  const out = [];
  let dentro = false;
  for (const l of linhas) {
    if (l.codigo && !dentro) { out.push('```'); dentro = true; }
    if (!l.codigo && dentro) { out.push('```'); dentro = false; }
    out.push(l.texto);
  }
  if (dentro) out.push('```');
  let valor = out.join('\n').trim();
  if (valor === '—') valor = ''; // era um campo opcional vazio
  if (campo.tipo === 'links') return linksDoTexto(valor);
  return valor;
}

// Desfaz o formato "- Título — URL (Tipo)" da lista de links extras.
function linksDoTexto(texto) {
  const links = [];
  for (const linha of String(texto).split('\n')) {
    const m = linha.match(/^-?\s*(.+?)\s+—\s+(https?:\/\/\S+)\s*(?:\((.+)\))?\s*$/);
    if (m) links.push({ titulo: m[1].replace(/\*\*/g, ''), url: m[2], tipo: m[3] || 'Outro' });
  }
  return links;
}

// ---------------------------------------------------------------------------
// .docx dos e-mails -> { config, dias, nomeDoCurso }
// ---------------------------------------------------------------------------

function importarDocx(buffer) {
  const partes = lerZip(buffer);
  if (!partes['word/document.xml']) throw new Error('não achei o conteúdo do Word dentro do arquivo');
  const xml = partes['word/document.xml'].toString('utf8');

  const paginas = todasAsPaginas();
  const pagConfig = paginas.find((p) => p.id === 'emails-config');
  const resultado = { config: {}, dias: [{}, {}, {}, {}, {}, {}, {}], nomeDoCurso: '' };

  let camposSecao = null; // campos possíveis da seção atual (config ou um dia)
  let baldeSecao = null;  // onde os valores caem
  let campoAtual = null;  // { campo, linhas }

  const fecharCampo = () => {
    if (campoAtual) baldeSecao[campoAtual.campo.chave] = montarValor(campoAtual.campo, campoAtual.linhas);
    campoAtual = null;
  };

  // Os marcos do documento são reconhecidos pelo TEXTO (não pelo estilo),
  // para funcionar mesmo se o Word regravar o arquivo do seu jeito.
  const paragrafos = xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) || [];
  for (const pXml of paragrafos) {
    const par = lerParagrafo(pXml);
    const plano = par.segmentos.map((s) => s.texto).join('').trim();

    const mTitulo = plano.match(/^E-mails\s+—\s+(.+?)\s+\(7 Days of Code\)$/);
    if (mTitulo) { resultado.nomeDoCurso = mTitulo[1]; continue; }
    if (/^PARTE 1\b/.test(plano)) { fecharCampo(); camposSecao = pagConfig.campos; baldeSecao = resultado.config; continue; }
    if (/^PARTE 2\b/.test(plano)) { fecharCampo(); camposSecao = null; continue; }
    const mDia = plano.match(/^E-mail do DIA (\d)\b/);
    if (mDia) {
      fecharCampo();
      const pagDia = paginas.find((p) => p.id === 'dia-' + mDia[1]);
      camposSecao = pagDia ? pagDia.campos : null;
      baldeSecao = resultado.dias[+mDia[1] - 1] || {};
      continue;
    }
    if (/^Nota — /.test(plano)) { fecharCampo(); camposSecao = null; continue; }
    if (!camposSecao) continue;

    const inicio = inicioDeCampo(par, camposSecao);
    if (inicio) {
      fecharCampo();
      campoAtual = { campo: inicio.campo, linhas: [] };
      if (inicio.resto) campoAtual.linhas.push({ texto: inicio.resto, codigo: false });
    } else if (campoAtual) {
      campoAtual.linhas.push({ texto: segmentosParaTexto(par.segmentos), codigo: par.codigo });
    }
  }
  fecharCampo();
  return resultado;
}

// ---------------------------------------------------------------------------
// briefing .md -> { chave: valor } (só chaves conhecidas do briefing)
// ---------------------------------------------------------------------------

function importarBriefingMd(texto) {
  const briefing = {};
  let chave = null;
  let buffer = [];
  const salvar = () => {
    if (chave) briefing[chave] = buffer.join('\n').trim().replace(/<\/?strong>/gi, '**');
  };
  for (const linha of String(texto).split(/\r?\n/)) {
    const m = linha.match(/^##\s+(.+?)\s*$/);
    if (m) { salvar(); chave = ORDEM_BRIEFING.indexOf(m[1]) >= 0 ? m[1] : null; buffer = []; continue; }
    if (/^#\s/.test(linha) || /^<!--/.test(linha)) continue;
    if (chave) buffer.push(linha);
  }
  salvar();
  return briefing;
}

// ---------------------------------------------------------------------------
// Junta tudo num rascunho
// ---------------------------------------------------------------------------

function contarPreenchidos(obj) {
  return Object.values(obj).filter((v) => (Array.isArray(v) ? v.length : String(v == null ? '' : v).trim())).length;
}

/**
 * importarArquivos([{ nome, base64 }, ...]) -> { dados, resumo }
 * Aceita .md (briefing), .docx (e-mails) e .json (rascunho completo).
 */
function importarArquivos(arquivos) {
  if (!arquivos.length) throw new Error('nenhum arquivo recebido');
  const dados = rascunhoNovo();
  const resumo = [];

  for (const arq of arquivos) {
    const nome = String(arq.nome || 'arquivo');
    const buf = Buffer.from(String(arq.base64 || ''), 'base64');

    if (/\.docx$/i.test(nome)) {
      const r = importarDocx(buf);
      Object.assign(dados.emails.config, r.config);
      r.dias.forEach((d, i) => Object.assign(dados.emails.dias[i], d));
      if (r.nomeDoCurso && !String(dados.briefing['nome-do-curso'] || '').trim()) {
        dados.briefing['nome-do-curso'] = r.nomeDoCurso;
      }
      const total = contarPreenchidos(r.config) + r.dias.reduce((s, d) => s + contarPreenchidos(d), 0);
      if (!total) throw new Error('"' + nome + '" não tem os rótulos de um Word gerado pelo formulário');
      resumo.push(nome + ' → e-mails (' + total + ' campos)');

    } else if (/\.json$/i.test(nome)) {
      let r;
      try { r = JSON.parse(buf.toString('utf8')); } catch (e) { throw new Error('"' + nome + '" não é um JSON válido'); }
      if (!r || typeof r !== 'object' || (!r.briefing && !r.emails)) {
        throw new Error('"' + nome + '" não parece um rascunho .7doc.json');
      }
      if (r.briefing) Object.assign(dados.briefing, r.briefing);
      if (r.emails && r.emails.config) Object.assign(dados.emails.config, r.emails.config);
      if (r.emails && Array.isArray(r.emails.dias)) {
        r.emails.dias.slice(0, 7).forEach((d, i) => { if (d) Object.assign(dados.emails.dias[i], d); });
      }
      resumo.push(nome + ' → rascunho completo');

    } else if (/\.md$/i.test(nome)) {
      const b = importarBriefingMd(buf.toString('utf8'));
      const total = contarPreenchidos(b);
      if (!total) throw new Error('"' + nome + '" não tem os títulos "## ..." de um briefing gerado');
      Object.assign(dados.briefing, b);
      resumo.push(nome + ' → briefing (' + total + ' campos)');

    } else {
      throw new Error('não sei importar "' + nome + '" — envie .md, .docx ou .7doc.json');
    }
  }

  delete dados._rev; // um rascunho importado começa vida nova
  return { dados, resumo };
}

module.exports = { importarArquivos, importarDocx, importarBriefingMd, lerZip };
