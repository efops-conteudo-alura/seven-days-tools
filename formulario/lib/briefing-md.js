'use strict';
/*
 * briefing-md.js — transforma o rascunho no Briefing .md,
 * no formato exato que o gerar-trilha.js lê (títulos "## chave", UTF-8).
 */

const { ORDEM_BRIEFING } = require('./campos');

// A página do site entende <strong>; no formulário se escreve **texto**.
// Aqui a conversão acontece (quem já escreve <strong> direto também pode).
function negrito(texto) {
  return String(texto).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function gerarBriefingMd(dados) {
  const b = dados.briefing || {};
  const L = [];
  L.push('# Briefing de trilha — 7 Days of Code');
  L.push('');
  L.push('<!-- Gerado pelo formulário (_ferramentas-trilhas/formulario). -->');
  L.push('<!-- Para regenerar, abra o rascunho no formulário; edição manual também funciona. -->');
  L.push('');
  for (const chave of ORDEM_BRIEFING) {
    L.push('## ' + chave);
    L.push(negrito(String(b[chave] == null ? '' : b[chave]).trim()));
    L.push('');
  }
  return L.join('\n');
}

module.exports = { gerarBriefingMd };
