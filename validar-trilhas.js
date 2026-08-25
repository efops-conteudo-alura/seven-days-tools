#!/usr/bin/env node
/*
 * validar-trilhas.js
 * -----------------------------------------------------------------------------
 * Audita as trilhas em 7daysofcode/ e aponta problemas comuns, sem gravar nada.
 *
 * Verifica, em cada trilha:
 *   - se os blocos obrigatórios existem;
 *   - se tem exatamente 7 dias em howitworks;
 *   - se o formId do HubSpot está preenchido;
 *   - se o portalId está correto (sem espaços sobrando);
 *   - se a descrição da página menciona o nome do curso
 *     (pega erros de copiar-colar, como "Flutter" que diz "de GitHub").
 *
 * Uso:  node validar-trilhas.js
 * Não precisa instalar nada.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '7daysofcode');
const PORTAL_ID_ESPERADO = '21748317';
const BLOCOS_OBRIGATORIOS = [
  'site:', 'hubspotform:', 'banner:', 'textGoingToLearn:',
  'howitworks:', 'authors:', 'catchprhrase:', 'faq:',
];

// Extrai o valor de uma chave "chave: valor" (primeira ocorrência).
function valor(txt, chave) {
  const m = txt.match(new RegExp('^\\s*' + chave + ':\\s*"?([^"\\n]*)"?', 'm'));
  return m ? m[1].trim() : null;
}

function main() {
  if (!fs.existsSync(RAIZ)) {
    console.error('Pasta 7daysofcode não encontrada em ' + RAIZ);
    process.exit(1);
  }

  const pastas = fs.readdirSync(RAIZ, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'home')
    .map((d) => d.name)
    .sort();

  let totalProblemas = 0;
  const trilhasComProblema = [];

  for (const nome of pastas) {
    const arq = path.join(RAIZ, nome, 'default_metadata.yaml');
    const problemas = [];

    if (!fs.existsSync(arq)) {
      problemas.push('não tem default_metadata.yaml');
    } else {
      const txt = fs.readFileSync(arq, 'utf8');

      for (const bloco of BLOCOS_OBRIGATORIOS) {
        if (!new RegExp('^' + bloco, 'm').test(txt)) problemas.push('falta o bloco "' + bloco + '"');
      }

      const dias = (txt.match(/^\s*- title:/gm) || []).length;
      if (dias !== 7) problemas.push('tem ' + dias + ' dias em howitworks (esperado: 7)');

      const portal = valor(txt, 'portalId');
      if (portal !== null && portal !== PORTAL_ID_ESPERADO) {
        problemas.push('portalId estranho: "' + portal + '" (esperado "' + PORTAL_ID_ESPERADO + '")');
      }

      const formId = valor(txt, 'formId');
      if (!formId) problemas.push('formId do HubSpot vazio (inscrição não funciona)');

      // Erro de copiar-colar: a descrição da página cita outra tecnologia.
      const curso = valor(txt, 'courseName');
      const pageDesc = valor(txt, 'pageDescription');
      if (curso && pageDesc && !pageDesc.toLowerCase().includes(curso.toLowerCase())) {
        problemas.push('a descrição da página não menciona "' + curso + '" — possível erro de copiar-colar: "' + pageDesc + '"');
      }
    }

    if (problemas.length) {
      trilhasComProblema.push({ nome, problemas });
      totalProblemas += problemas.length;
    }
  }

  console.log('\n🔎 Auditoria de ' + pastas.length + ' trilhas\n');
  if (!trilhasComProblema.length) {
    console.log('✅ Nenhum problema encontrado. Tudo certo!\n');
    return;
  }
  for (const t of trilhasComProblema) {
    console.log('⚠️  ' + t.nome);
    for (const p of t.problemas) console.log('     - ' + p);
  }
  console.log('\nTotal: ' + totalProblemas + ' problema(s) em ' + trilhasComProblema.length + ' trilha(s).\n');
}

main();
