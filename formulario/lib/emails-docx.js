'use strict';
/*
 * emails-docx.js — transforma o rascunho no documento Word dos 7 e-mails,
 * no formato que o marketing já recebe hoje (E-mails — <Trilha>.docx).
 *
 * Um .docx é um ZIP com XMLs dentro; o zip.js monta o pacote.
 * Os títulos usam estilos de cabeçalho DE VERDADE (Heading 1/2), então o
 * painel de navegação do Word funciona — dá para pular direto ao Dia 5.
 */

const { criarZip } = require('./zip');
const { todasAsPaginas } = require('./campos');

// --------------------------------------------------------------------------
// Helpers de XML
// --------------------------------------------------------------------------

function esc(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Um parágrafo. runs = [{ texto, negrito }]; estilo = nome do w:pStyle.
function par(runs, estilo) {
  const pPr = estilo ? '<w:pPr><w:pStyle w:val="' + estilo + '"/></w:pPr>' : '';
  const corpo = runs.map((r) =>
    '<w:r>' + (r.negrito ? '<w:rPr><w:b/></w:rPr>' : '') +
    '<w:t xml:space="preserve">' + esc(r.texto) + '</w:t></w:r>'
  ).join('');
  return '<w:p>' + pPr + corpo + '</w:p>';
}

// Converte **trechos** (e <strong>) de uma linha em runs com negrito real.
function runsDaLinha(linha) {
  const texto = String(linha).replace(/<\/?strong>/gi, '**'); // aceita os dois jeitos
  const runs = [];
  const re = /\*\*(.+?)\*\*/g;
  let ultimo = 0;
  let m;
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) runs.push({ texto: texto.slice(ultimo, m.index) });
    runs.push({ texto: m[1], negrito: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) runs.push({ texto: texto.slice(ultimo) });
  if (!runs.length) runs.push({ texto: '' });
  return runs;
}

// Linha de código (entre ```): fonte mono + fundo cinza, como no e-mail HTML.
function parCodigo(linha) {
  return '<w:p><w:pPr><w:spacing w:after="0"/><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/></w:pPr>' +
    '<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr>' +
    '<w:t xml:space="preserve">' + esc(linha) + '</w:t></w:r></w:p>';
}

// Campo com rótulo em negrito + valor. Valor com várias linhas vira
// parágrafos seguintes; **trechos** viram negrito; linhas entre ```
// saem em fonte de código (as linhas de crases somem).
function campoPar(rotulo, valor) {
  const linhas = String(valor == null ? '' : valor).split(/\r?\n/);
  const out = [];
  let dentroDeCodigo = false;
  let primeira = true;
  for (const linha of linhas) {
    if (/^\s*```/.test(linha)) { dentroDeCodigo = !dentroDeCodigo; continue; }
    if (primeira) {
      primeira = false;
      if (dentroDeCodigo) {
        out.push(par([{ texto: rotulo + ': ', negrito: true }]));
        out.push(parCodigo(linha));
      } else {
        out.push(par([{ texto: rotulo + ': ', negrito: true }, ...runsDaLinha(linha)]));
      }
      continue;
    }
    out.push(dentroDeCodigo ? parCodigo(linha) : par(runsDaLinha(linha)));
  }
  if (primeira) out.push(par([{ texto: rotulo + ': ', negrito: true }]));
  return out.join('');
}

// --------------------------------------------------------------------------
// Montagem do documento
// --------------------------------------------------------------------------

function documentoXml(dados) {
  const b = dados.briefing || {};
  const cfg = (dados.emails && dados.emails.config) || {};
  const dias = (dados.emails && dados.emails.dias) || [];
  const concl = (dados.emails && dados.emails.conclusao) || {};
  const trilha = (b['nome-do-curso'] || '').trim() || 'Trilha sem nome';
  const paginas = todasAsPaginas();
  const pagConfig = paginas.find((p) => p.id === 'emails-config');
  const pagConcl = paginas.find((p) => p.id === 'email-conclusao');

  const P = [];
  P.push(par([{ texto: 'E-mails — ' + trilha + ' (7 Days of Code)' }], 'Titulo7doc'));
  P.push(par([{ texto: 'Roteiro dos 7 e-mails para o marketing montar o workflow no HubSpot. Um documento destes por trilha. Gerado pelo formulário em _ferramentas-trilhas/formulario.' }]));
  P.push(par([{ texto: 'Onde houver [nome], o HubSpot troca pelo primeiro nome da pessoa inscrita (token de personalização).' }]));

  // PARTE 1 — configuração fixa
  P.push(par([{ texto: 'PARTE 1 — Configuração fixa (igual nos 7 e-mails)' }], 'Titulo1'));
  for (const c of pagConfig.campos) P.push(campoPar(c.rotulo, cfg[c.chave]));

  // PARTE 2 — um bloco por dia
  P.push(par([{ texto: 'PARTE 2 — Conteúdo de cada dia' }], 'Titulo1'));
  for (let n = 1; n <= 7; n++) {
    const d = dias[n - 1] || {};
    const pagDia = paginas.find((p) => p.id === 'dia-' + n);
    P.push(par([{ texto: 'E-mail do DIA ' + n + (n === 7 ? ' (último)' : '') }], 'Titulo2'));
    for (const c of pagDia.campos) {
      let valor = d[c.chave];
      // Campos de lista de links viram uma linha por link: Título — URL (Tipo)
      if (c.tipo === 'links') {
        const links = Array.isArray(valor) ? valor : [];
        valor = links.map((l) =>
          '- ' + ((l && l.titulo) || 'sem título') + ' — ' + ((l && l.url) || '') +
          ((l && l.tipo) ? ' (' + l.tipo + ')' : '')
        ).join('\n');
      }
      if (!c.obrigatorio && !String(valor == null ? '' : valor).trim()) {
        P.push(campoPar(c.rotulo, '—'));
      } else {
        P.push(campoPar(c.rotulo, valor));
      }
    }
  }

  // PARTE 3 — e-mail de conclusão (depois do Dia 7)
  P.push(par([{ texto: 'PARTE 3 — E-mail de Conclusão (após o Dia 7)' }], 'Titulo1'));
  P.push(par([{ texto: 'E-mail de Conclusão' }], 'Titulo2'));
  for (const c of pagConcl.campos) {
    const valor = concl[c.chave];
    if (!c.obrigatorio && !String(valor == null ? '' : valor).trim()) {
      P.push(campoPar(c.rotulo, '—'));
    } else {
      P.push(campoPar(c.rotulo, valor));
    }
  }

  // Nota final sobre as soluções (decisão já registrada no fluxo).
  P.push(par([{ texto: 'Nota — Solução do dia anterior' }], 'Titulo1'));
  P.push(par([{ texto: 'As soluções ficam no GitHub, na organização 7-days-of-code: um repositório por trilha, com uma branch por dia (solucao-dia-1 a solucao-dia-7). No e-mail vai o link da branch do dia; código no corpo só se for curto (e-mails longos o Gmail corta com "[Mensagem truncada]").' }]));

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + P.join('') +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>' +
    '</w:body></w:document>';
}

// Estilos mínimos: Normal + título do documento + Heading 1/2 com
// outlineLvl (é isso que liga o painel de navegação do Word).
const ESTILOS_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="160"/></w:pPr></w:style>' +
  '<w:style w:type="paragraph" w:styleId="Titulo7doc"><w:name w:val="Title"/><w:basedOn w:val="Normal"/>' +
  '<w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>' +
  '<w:style w:type="paragraph" w:styleId="Titulo1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>' +
  '<w:pPr><w:spacing w:before="360" w:after="200"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>' +
  '<w:style w:type="paragraph" w:styleId="Titulo2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>' +
  '<w:pPr><w:spacing w:before="280" w:after="160"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>' +
  '</w:styles>';

const CONTENT_TYPES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '</Types>';

const RELS_RAIZ_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>';

const RELS_DOC_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>';

function gerarEmailsDocx(dados) {
  return criarZip([
    { nome: '[Content_Types].xml', conteudo: CONTENT_TYPES_XML },
    { nome: '_rels/.rels', conteudo: RELS_RAIZ_XML },
    { nome: 'word/_rels/document.xml.rels', conteudo: RELS_DOC_XML },
    { nome: 'word/document.xml', conteudo: documentoXml(dados) },
    { nome: 'word/styles.xml', conteudo: ESTILOS_XML },
  ]);
}

module.exports = { gerarEmailsDocx };
