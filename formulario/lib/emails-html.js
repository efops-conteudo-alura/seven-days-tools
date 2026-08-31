'use strict';
/*
 * emails-html.js — transforma o rascunho nos 7 HTMLs de e-mail, prontos
 * para o marketing colar no HubSpot (um arquivo por dia).
 *
 * O visual segue o template de ../modelo-emails-html/template-email.html: cartão branco,
 * cabeçalho escuro clicável com o logo do 7DoC, barra de progresso,
 * caixas de Importante/Dica e bloco de prompt em fonte de código.
 *
 * Convenções de escrita nos campos (as mesmas do resto do formulário):
 *   **texto**      vira negrito
 *   [nome]         vira o token {{ contact.firstname }} do HubSpot
 *   ``` ... ```    linhas entre três crases viram o bloco escuro de código
 *
 * O rodapé legal (endereço + descadastro) NÃO entra aqui: o HubSpot
 * acrescenta o dele automaticamente.
 */

const { CTA_CONCLUSAO_PADRAO } = require('./campos');

// UTM padronizada da tarja do topo: e<dia>-desafio + tecnologia sem hífens.
const UTM_BASE = 'utm_source=hubspot&utm_medium=email&utm_campaign=7doc_2026';
const URL_ALURA = 'https://www.alura.com.br/';
const URL_LOGO = 'https://7daysofcode.io/assets/img/background-7days.1750260030.svg';

const FONTE = 'Arial,Helvetica,sans-serif';
const FONTE_MONO = "Consolas,'Courier New',monospace";

// --------------------------------------------------------------------------
// Helpers de texto
// --------------------------------------------------------------------------

function esc(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// **negrito** e [nome] dentro de uma linha já escapada.
function inline(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[nome\]/g, '{{ contact.firstname }}');
}

// Divide o texto de um campo em blocos: 'texto' e 'codigo' (entre ```).
function blocosDoCampo(texto) {
  const blocos = [];
  let atual = { tipo: 'texto', linhas: [] };
  for (const linha of String(texto == null ? '' : texto).split(/\r?\n/)) {
    if (/^\s*```/.test(linha)) {
      blocos.push(atual);
      atual = { tipo: atual.tipo === 'codigo' ? 'texto' : 'codigo', linhas: [] };
    } else {
      atual.linhas.push(linha);
    }
  }
  blocos.push(atual);
  return blocos.filter((b) => b.linhas.join('').trim());
}

// Preserva a indentação de uma linha de código com &nbsp;.
function linhaDeCodigo(linha) {
  const m = String(linha).match(/^(\s*)(.*)$/);
  return '&nbsp;'.repeat(m[1].length) + inline(m[2]);
}

// --------------------------------------------------------------------------
// Pedaços visuais (cada função devolve <tr>...</tr>)
// --------------------------------------------------------------------------

function trParagrafo(html, css) {
  return '<tr><td style="padding:16px 24px 0 24px;font-family:' + FONTE + ';' +
    (css || 'font-size:16px;line-height:26px;color:#3A4150;') + '">' + html + '</td></tr>';
}

// Um campo de texto livre vira parágrafos (separados por linha em branco)
// e blocos de código (entre ```).
function trsDeCampo(texto) {
  const out = [];
  for (const bloco of blocosDoCampo(texto)) {
    if (bloco.tipo === 'codigo') {
      out.push('<tr><td style="padding:16px 24px 0 24px;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0C0C0E;border-radius:8px;">' +
        '<tr><td style="padding:18px 20px;font-family:' + FONTE_MONO + ';font-size:13px;line-height:20px;color:#E6E8EC;">' +
        bloco.linhas.map(linhaDeCodigo).join('<br/>') +
        '</td></tr></table></td></tr>');
    } else {
      const paragrafos = bloco.linhas.join('\n').split(/\n\s*\n/);
      for (const p of paragrafos) {
        if (!p.trim()) continue;
        out.push(trParagrafo(p.split('\n').map(inline).join('<br/>')));
      }
    }
  }
  return out.join('');
}

function trCabecalho(urlTarja, nomeTecnologia) {
  return '<tr><td style="background-color:#0C0C0E;">' +
    '<a href="' + esc(urlTarja) + '" target="_blank" style="display:block;padding:20px 24px;text-decoration:none;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td><img src="' + esc(URL_LOGO) + '" height="44" alt="7 Days of Code" style="display:block;border:0;" /></td>' +
    '<td align="right"><span style="display:inline-block;padding:6px 14px;border:1px solid #1F53E5;border-radius:20px;font-family:' + FONTE + ';font-size:11px;font-weight:bold;letter-spacing:0.5px;color:#9DB8FF;text-transform:uppercase;white-space:nowrap;">' +
    esc(nomeTecnologia) + '</span></td>' +
    '</tr></table></a></td></tr>';
}

function trProgresso(dia) {
  const larguras = ['14%', '14%', '14%', '15%', '14%', '14%', '14%'];
  const celulas = larguras.map((w, i) =>
    '<td height="6" width="' + w + '" bgcolor="' + (i < dia ? '#1F53E5' : '#E4E7ED') + '" style="font-size:0;line-height:0;">&nbsp;</td>'
  ).join('');
  return '<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + celulas + '</tr></table></td></tr>';
}

function trEtiqueta(nomeTecnologia, dia) {
  return '<tr><td style="padding:20px 24px 0 24px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td style="font-family:' + FONTE + ';font-size:12px;font-weight:bold;letter-spacing:0.5px;color:#1F53E5;text-transform:uppercase;">#7DaysOfCode &middot; ' + esc(nomeTecnologia) + '</td>' +
    '<td align="right" style="font-family:' + FONTE + ';font-size:11px;font-weight:bold;letter-spacing:1px;color:#8892A4;text-transform:uppercase;white-space:nowrap;">Dia ' + dia + ' de 7</td>' +
    '</tr></table></td></tr>';
}

function trSecao(titulo) {
  return '<tr><td style="padding:28px 24px 0 24px;font-family:' + FONTE + ';font-size:12px;font-weight:bold;letter-spacing:0.5px;color:#1F53E5;text-transform:uppercase;">' + esc(titulo) + '</td></tr>';
}

function trCartao(tituloMaiusculo, conteudoHtml, corFundo, corBorda, corTexto) {
  return '<tr><td style="padding:20px 24px 0 24px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:' + corFundo + ';border:1px solid ' + corBorda + ';border-radius:6px;">' +
    '<tr><td style="padding:16px 20px;font-family:' + FONTE + ';font-size:14px;line-height:22px;color:' + corTexto + ';">' +
    (tituloMaiusculo ? '<span style="display:block;font-size:11px;font-weight:bold;letter-spacing:0.5px;color:#8892A4;text-transform:uppercase;padding-bottom:8px;">' + esc(tituloMaiusculo) + '</span>' : '') +
    conteudoHtml + '</td></tr></table></td></tr>';
}

function botao(url, rotulo) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr>' +
    '<td align="center" bgcolor="#1F53E5" style="background-color:#1F53E5;border-radius:24px;">' +
    '<a href="' + esc(url) + '" target="_blank" style="display:block;padding:11px 24px;font-family:' + FONTE + ';font-size:13px;font-weight:bold;color:#FFFFFF;text-decoration:none;white-space:nowrap;">' + esc(rotulo) + ' &rarr;</a>' +
    '</td></tr></table>';
}

// --------------------------------------------------------------------------
// O e-mail de um dia
// --------------------------------------------------------------------------

function htmlDoDia(n, d, cfg, nomeTecnologia, termoUtm) {
  const utm = UTM_BASE + '&utm_content=e' + n + '-desafio&utm_term=' + termoUtm;
  const T = [];

  T.push(trCabecalho(URL_ALURA + '?' + utm, nomeTecnologia));
  T.push(trProgresso(n));
  T.push(trEtiqueta(nomeTecnologia, n));

  T.push(trsDeCampo(d['abertura']));
  T.push(trsDeCampo(d['gancho']));

  // Conceito do dia — cartão claro
  const conceito = blocosDoCampo(d['conceito']).map((b) =>
    b.tipo === 'codigo'
      ? '<div style="background-color:#0C0C0E;border-radius:8px;padding:14px 16px;margin-top:10px;font-family:' + FONTE_MONO + ';font-size:13px;line-height:20px;color:#E6E8EC;">' + b.linhas.map(linhaDeCodigo).join('<br/>') + '</div>'
      : b.linhas.join('\n').split(/\n\s*\n/).filter((p) => p.trim())
        .map((p) => '<div style="font-size:14px;line-height:24px;padding-top:8px;">' + p.split('\n').map(inline).join('<br/>') + '</div>').join('')
  ).join('');
  T.push(trCartao('Conceito do dia', conceito, '#F7F9FC', '#E4E7ED', '#3A4150'));

  T.push(trSecao('Desafio do dia'));
  T.push(trsDeCampo(d['desafio']));

  if (String(d['exercicio-opcional'] || '').trim()) {
    T.push(trParagrafo('<strong>Exercício opcional:</strong> ' +
      String(d['exercicio-opcional']).split(/\r?\n/).map(inline).join('<br/>'),
      'font-size:14px;line-height:24px;color:#3A4150;'));
  }
  if (String(d['dica'] || '').trim()) {
    T.push(trCartao('', '💡 <strong>Dica:</strong> ' +
      String(d['dica']).split(/\r?\n/).map(inline).join('<br/>'),
      '#F0F5FF', '#C9D8F8', '#27407E'));
  }

  // Links extras (o montador de links) — lista "Para saber mais"
  const links = Array.isArray(d['extra']) ? d['extra'] : [];
  if (links.length) {
    T.push(trParagrafo('<strong>Para saber mais:</strong><br/>' +
      links.map((l) =>
        '<a href="' + esc(l.url) + '" target="_blank" style="color:#1F53E5;text-decoration:underline;">' + esc(l.titulo) + '</a>' +
        (l.tipo ? ' <span style="color:#8892A4;font-size:12px;">(' + esc(l.tipo) + ')</span>' : '')
      ).join('<br/>'),
      'font-size:14px;line-height:24px;color:#3A4150;'));
  }

  // Solução do dia anterior (dias 2–7): texto + botão para a primeira URL
  const solucao = String(d['solucao-anterior'] || '').trim();
  if (n >= 2 && solucao) {
    const m = solucao.match(/https?:\/\/\S+/);
    const textoSolucao = solucao.replace(/https?:\/\/\S+/g, '').trim();
    T.push(trCartao('Solução do dia anterior',
      (textoSolucao ? '<div style="line-height:24px;">' + textoSolucao.split(/\r?\n/).map(inline).join('<br/>') + '</div>' : '') +
      (m ? botao(m[0], 'Ver a solução completa') : ''),
      '#F7F9FC', '#E4E7ED', '#3A4150'));
  }

  T.push(trsDeCampo(d['fechamento']));

  // Assinatura — "Nome — Cargo" da configuração fixa
  const assinatura = String(cfg['assinatura'] || '').trim();
  const partes = assinatura.split(/\s+—\s+|\s+-\s+/);
  T.push('<tr><td style="padding:22px 24px 0 24px;font-family:' + FONTE + ';font-size:14px;line-height:20px;color:#3A4150;">' +
    '<span style="color:#0C0C0E;font-weight:bold;">' + inline(partes[0] || '') + '</span>' +
    (partes[1] ? '<br/><span style="color:#8892A4;">' + inline(partes.slice(1).join(' — ')) + '</span>' : '') +
    '</td></tr>');

  // Rodapé de incentivo (hashtags em destaque)
  const cta = inline(cfg['cta-rodape'] || '')
    .replace(/(#[\wÀ-ÿ]+)/g, '<strong style="color:#9DB8FF;">$1</strong>');
  T.push('<tr><td style="padding:26px 24px 24px 24px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0C0C0E;border-radius:8px;">' +
    '<tr><td style="padding:18px 20px;font-family:' + FONTE + ';font-size:14px;line-height:22px;color:#E6E8EC;">' + cta + '</td></tr>' +
    '</table></td></tr>');

  return '<!-- ASSUNTO: ' + esc(d['assunto'] || '') + ' -->\n' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EEF1F6;">\n' +
    '<tr><td align="center" style="padding:24px 16px;">\n' +
    '<div style="display:none;font-size:1px;color:#EEF1F6;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">' + esc(d['preheader'] || '') + '</div>\n' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#FFFFFF;">\n' +
    T.join('\n') +
    '\n</table></td></tr></table>\n';
}

// --------------------------------------------------------------------------
// O e-mail de conclusão (depois do Dia 7)
//
// Visual baseado no arquivo de referência saida/<slug>-html/conclusao.html:
// mesma tarja, barra de progresso cheia, cartão "Solução do dia" liberando o
// Dia 7, parágrafos de encerramento e o rodapé de incentivo.
// --------------------------------------------------------------------------

function htmlDaConclusao(d, cfg, nomeTecnologia, termoUtm) {
  const utm = UTM_BASE + '&utm_content=e7-conclusao&utm_term=' + termoUtm;
  const T = [];

  T.push(trCabecalho(URL_ALURA + '?' + utm, nomeTecnologia));
  T.push(trProgresso(7));
  T.push(trEtiqueta(nomeTecnologia, 7));

  T.push(trsDeCampo(d['abertura']));
  T.push(trsDeCampo(d['corpo']));

  // Cartão "Solução do dia" liberando o Dia 7
  const linkSolucao = String(d['solucao-dia-7'] || '').trim();
  if (linkSolucao) {
    T.push(trCartao('Solução do dia', botao(linkSolucao, 'Solução do Dia 7'), '#F7F9FC', '#E4E7ED', '#3A4150'));
  }

  T.push(trsDeCampo(d['fechamento']));
  // Texto fixo se o campo ainda estiver vazio (rascunho antigo sem este balde).
  T.push(trsDeCampo(String(d['call-to-action'] || '').trim() ? d['call-to-action'] : CTA_CONCLUSAO_PADRAO));

  // Assinatura — "Nome — Cargo" da configuração fixa
  const assinatura = String(cfg['assinatura'] || '').trim();
  const partes = assinatura.split(/\s+—\s+|\s+-\s+/);
  T.push('<tr><td style="padding:22px 24px 0 24px;font-family:' + FONTE + ';font-size:14px;line-height:20px;color:#3A4150;">' +
    '<span style="color:#0C0C0E;font-weight:bold;">' + inline(partes[0] || '') + '</span>' +
    (partes[1] ? '<br/><span style="color:#8892A4;">' + inline(partes.slice(1).join(' — ')) + '</span>' : '') +
    '</td></tr>');

  // Rodapé de incentivo (hashtags em destaque)
  const cta = inline(cfg['cta-rodape'] || '')
    .replace(/(#[\wÀ-ÿ]+)/g, '<strong style="color:#9DB8FF;">$1</strong>');
  T.push('<tr><td style="padding:26px 24px 24px 24px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0C0C0E;border-radius:8px;">' +
    '<tr><td style="padding:18px 20px;font-family:' + FONTE + ';font-size:14px;line-height:22px;color:#E6E8EC;">' + cta + '</td></tr>' +
    '</table></td></tr>');

  return '<!-- ASSUNTO: ' + esc(d['assunto'] || '') + ' -->\n' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EEF1F6;">\n' +
    '<tr><td align="center" style="padding:24px 16px;">\n' +
    '<div style="display:none;font-size:1px;color:#EEF1F6;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">' + esc(d['preheader'] || '') + '</div>\n' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#FFFFFF;">\n' +
    T.join('\n') +
    '\n</table></td></tr></table>\n';
}

// --------------------------------------------------------------------------

// Devolve [{ nome: 'dia-1.html', conteudo: '...' }, ...]
function gerarEmailsHtml(dados) {
  const b = (dados && dados.briefing) || {};
  const cfg = (dados && dados.emails && dados.emails.config) || {};
  const dias = (dados && dados.emails && dados.emails.dias) || [];
  const concl = (dados && dados.emails && dados.emails.conclusao) || {};

  const nomeTecnologia = String(b['nome-do-curso'] || '').trim() || 'Trilha sem nome';
  // utm_term: o slug sem hífens (prompt-engineering -> promptengineering)
  const base = String(b['slug'] || '').trim() || nomeTecnologia;
  const termoUtm = base.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

  return [
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
      nome: 'dia-' + n + '.html',
      conteudo: htmlDoDia(n, dias[n - 1] || {}, cfg, nomeTecnologia, termoUtm),
    })),
    { nome: 'conclusao.html', conteudo: htmlDaConclusao(concl, cfg, nomeTecnologia, termoUtm) },
  ];
}

module.exports = { gerarEmailsHtml };
