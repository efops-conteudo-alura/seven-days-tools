#!/usr/bin/env node
/*
 * gerar-trilha.js
 * -----------------------------------------------------------------------------
 * Transforma um briefing preenchido (MODELO-briefing.md) na configuração da
 * página de inscrição de uma trilha do 7 Days of Code.
 *
 * O que ele faz:
 *   1. Lê o briefing e valida os campos.
 *   2. Cria  7daysofcode/<slug>/default_metadata.yaml  (a página da trilha),
 *      injetando automaticamente as partes fixas (banner, FAQ, HubSpot etc.).
 *   3. Adiciona a trilha na lista principal  7daysofcode/home/default_metadata.yaml.
 *
 * Uso:
 *   node gerar-trilha.js briefings/nome.md            -> gera de verdade
 *   node gerar-trilha.js briefings/nome.md --teste    -> só mostra, não grava
 *   node gerar-trilha.js briefings/nome.md --forcar   -> sobrescreve se já existir
 *
 * Não precisa instalar nada: usa só o Node puro.
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constantes iguais em TODAS as trilhas (o time não precisa escrever isso).
// ---------------------------------------------------------------------------
const HUBSPOT_REGION = 'na1';
const HUBSPOT_PORTAL_ID = '21748317';
const CTA = 'Quero me inscrever já!';
const LINK_TEXT = 'Comece agora!';
// As 10 categorias do site + "outros" (legado: 4 trilhas antigas ainda usam).
const CATEGORIAS_VALIDAS = [
  'back-end', 'front-end', 'dados', 'inteligencia-artificial', 'devops',
  'ciberseguranca', 'cloud', 'ux-design', 'mobile', 'gestao-negocios', 'outros',
];

const BANNER = {
  type: 'Coloque em prática seus estudos',
  dates: '7 desafios em 7 dias',
  feature: 'Desenvolva seu portfólio e GitHub',
  support: 'Criado por profissionais do mercado',
};

// FAQ padrão, idêntico em todas as trilhas (copiado fiel do repositório).
const FAQ = [
  ['Como posso me organizar para realizar os exercícios?', 'Depois de fazer a sua inscrição, você receberá um e-mail por dia com o contexto, a tarefa e os links de material extra sobre o assunto daquele dia. Recomendamos que você reserve pelo menos 1 (uma) hora para ver todo o material e completar o exercício.'],
  ['Preciso ser assinante da Alura?', 'Não. A iniciativa do 7 Days Of Code é aberta para qualquer pessoa que queira participar.'],
  ['Qual a diferença do 7 Days Of Code para o Alura Challenge?', 'O Alura Challenge propõe um aprendizado baseado no Challenge Based Learning, que a Apple ajudou a criar e é definido em 3 pilares: engajar, investigar e agir. Os Challenges só estão disponíveis para alunos e alunas da Alura e têm uma duração de 4 semanas. Durante as 4 semanas do Challenge, temos eventos como live coding e plantão de dúvidas, que não teremos para o 7 Days Of Code.'],
  ['Qual a diferença do 7 Days Of Code para a Imersão da Alura?', 'A Imersão da Alura é um conteúdo extenso em vídeos. Disponibilizamos aproximadamente 1h de vídeo todos os dias para quem se inscreveu na Imersão. Além disso, a imersão tem um servidor do Discord para as pessoas tirarem dúvidas e conversarem sobre seus projetos. Já o 7 Days Of Code não possui conteúdo em vídeo e nem canal do Discord específico para quem se inscreveu. É um desafio seu de aprendizado e prática.'],
  ['Para quem é essa iniciativa?', 'Para quem tem interesse em tecnologia e programação, e quer saber como praticar as habilidades pedidas pelo mercado de trabalho.'],
  ['Quando posso me inscrever?', 'Você pode se inscrever no dia que preferir e em quantas tecnologias quiser. A partir do momento da sua inscrição, você receberá um e-mail por dia durante 7 dias com dicas do que praticar.'],
  ['A inscrição no 7 Days Of Code me dá acesso à Alura?', 'Não, essa é uma iniciativa aberta para todo mundo que garante o recebimento dos desafios pelo período proposto (7 dias). Se você tiver acesso à plataforma, terá mais material de estudos à sua disposição.'],
  ['Qual material ou ferramenta preciso para participar?', 'Isso depende da tecnologia que você escolher praticar. O mínimo que você precisa é uma conta de e-mail para receber o material a partir do momento da sua inscrição.'],
  ['Vai ter certificado?', 'Melhor que certificado: ao final dos 7 dias, você terá criado alguns projetos, podendo incluí-los no seu portfólio e demonstrar suas habilidades. Compartilhe seus resultados no Instagram, Twitter e LinkedIn!'],
  ['Se eu tiver dúvidas, posso falar com alguém?', 'Se tiver dúvidas, acione a comunidade de desenvolvedores através do seu GitHub e das suas redes sociais e compartilhe o que está fazendo com outras pessoas, para que vocês possam trocar conhecimento.'],
];

// Placeholders do modelo que contam como "não preenchido".
const PLACEHOLDERS = [
  'COLOQUE', 'DESCREVA', 'PREENCHER-DEPOIS', 'coloque-o-codigo-aqui',
  'COLOQUE-O-SLUG-AQUI', 'https://coloque-o-link-da-foto-aqui',
];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const RAIZ_TRILHAS = path.join(__dirname, '..', '7daysofcode');

function erro(msg) {
  console.error('\n❌ ERRO: ' + msg + '\n');
  process.exit(1);
}
function aviso(msg) { console.warn('⚠️  ' + msg); }
function ok(msg) { console.log('✅ ' + msg); }

// Escapa um texto para virar uma string YAML entre aspas duplas, em uma linha.
function q(texto) {
  const s = String(texto == null ? '' : texto)
    .replace(/\\/g, '\\\\')   // barra invertida
    .replace(/"/g, '\\"')     // aspas duplas
    .replace(/\s+/g, ' ')     // colapsa quebras de linha/espaços em um espaço
    .trim();
  return '"' + s + '"';
}

// Um campo parece não preenchido?
function vazioOuPlaceholder(v) {
  if (!v || !v.trim()) return true;
  return PLACEHOLDERS.some((p) => v.trim().toUpperCase().startsWith(p.toUpperCase()));
}

// ---------------------------------------------------------------------------
// Leitura do briefing (Markdown com títulos "## chave")
// ---------------------------------------------------------------------------
function lerBriefing(caminho) {
  if (!fs.existsSync(caminho)) erro('Briefing não encontrado: ' + caminho);
  let texto = fs.readFileSync(caminho, 'utf8');
  texto = texto.replace(/^﻿/, ''); // Bloco de Notas salva uma marca invisível no início
  if (/�/.test(texto)) {
    erro(
      'O briefing parece ter sido salvo com a codificação errada (acentos corrompidos).\n' +
        '   Abra o arquivo no Bloco de Notas, use "Salvar como" e escolha Codificação: UTF-8.'
    );
  }
  texto = texto.replace(/<!--[\s\S]*?-->/g, ''); // remove instruções/comentários

  const campos = {};
  let chaveAtual = null;
  let buffer = [];
  const salvar = () => {
    if (chaveAtual !== null) campos[chaveAtual] = buffer.join('\n').trim();
  };
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^##\s+(.+?)\s*$/); // título de nível 2 = uma chave
    if (m) {
      salvar();
      chaveAtual = m[1].trim().toLowerCase();
      buffer = [];
    } else if (chaveAtual !== null) {
      buffer.push(linha);
    }
  }
  salvar();
  return campos;
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------
function validar(c) {
  const obrig = [
    'slug', 'nome-do-curso', 'codigo', 'categoria', 'instrutor', 'tema',
    'o-que-vai-praticar', 'frase-de-efeito', 'foto-do-autor',
    'minibio-do-autor', 'bio-do-autor', 'ativa',
    'dia-1', 'dia-2', 'dia-3', 'dia-4', 'dia-5', 'dia-6', 'dia-7',
  ];
  const faltando = obrig.filter((k) => vazioOuPlaceholder(c[k]));
  if (faltando.length) {
    erro('Estes campos do briefing não foram preenchidos:\n   - ' + faltando.join('\n   - '));
  }

  const slug = c['slug'].trim();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    erro('O "slug" deve ter só letras minúsculas, números e hífens (sem espaços/acentos). Recebido: "' + slug + '"');
  }

  const cat = c['categoria'].trim().toLowerCase();
  if (!CATEGORIAS_VALIDAS.includes(cat)) {
    erro('A "categoria" deve ser uma de: ' + CATEGORIAS_VALIDAS.join(', ') + '. Recebido: "' + cat + '"');
  }

  const cod = c['codigo'].trim();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(cod)) {
    aviso('O "codigo" tem formato incomum ("' + cod + '"). Confirme se o ícone icon-' + cod + '-card.svg existe.');
  }
}

// ---------------------------------------------------------------------------
// Montagem do YAML da trilha
// ---------------------------------------------------------------------------
function montarYaml(c) {
  const nome = c['nome-do-curso'].trim();
  const instrutor = c['instrutor'].trim();
  const codigo = c['codigo'].trim();
  const formId = c['hubspot-formid'] ? c['hubspot-formid'].trim() : '';
  const formIdOk = !vazioOuPlaceholder(formId);

  const L = [];
  L.push('site:');
  L.push('  title: ' + q('7 Days Of Code | ' + nome + ' - ' + instrutor));
  L.push('  cta: ' + q(CTA));
  L.push('  pageDescription: ' + q('Inscreva-se no 7 Days of Code de ' + nome));
  L.push('  code: ' + q(codigo));
  L.push('  icon: ' + q('icon-' + codigo + '-card.svg'));
  L.push('  courseName: ' + q(nome));
  L.push('');
  L.push('hubspotform:');
  L.push('  region: ' + q(HUBSPOT_REGION));
  L.push('  portalId: ' + q(HUBSPOT_PORTAL_ID));
  L.push('  formId: ' + q(formIdOk ? formId : ''));
  L.push('');
  L.push('banner:');
  L.push('  type: ' + q(BANNER.type));
  L.push('  dates: ' + q(BANNER.dates));
  L.push('  feature: ' + q(BANNER.feature));
  L.push('  support: ' + q(BANNER.support));
  L.push('');
  L.push('textGoingToLearn:');
  L.push('  text: ' + q(c['o-que-vai-praticar']));
  L.push('');
  L.push('howitworks:');
  for (let i = 1; i <= 7; i++) {
    L.push('  - title: ' + q('Dia ' + i));
    L.push('    description: ' + q(c['dia-' + i]));
  }
  L.push('');
  L.push('authors:');
  L.push('  - name: ' + q(instrutor));
  L.push('    photo: ' + q(c['foto-do-autor']));
  L.push('    minibio: ' + q(c['minibio-do-autor']));
  L.push('    bio: ' + q(c['bio-do-autor']));
  if (!vazioOuPlaceholder(c['instagram-do-autor'])) L.push('    instagram: ' + q(c['instagram-do-autor']));
  if (!vazioOuPlaceholder(c['linkedin-do-autor'])) L.push('    linkedin: ' + q(c['linkedin-do-autor']));
  L.push('');
  L.push('catchprhrase:'); // (mantém a grafia original usada no projeto)
  L.push('  text: ' + q(c['frase-de-efeito']));
  L.push('');
  L.push('faq:');
  for (const [pergunta, resposta] of FAQ) {
    L.push('  - question: ' + q(pergunta));
    L.push('    answer: ' + q(resposta));
  }
  L.push('');
  return L.join('\n');
}

// ---------------------------------------------------------------------------
// Entrada da trilha na lista principal (home)
// ---------------------------------------------------------------------------
function montarEntradaHome(c) {
  const ativa = /^s/i.test(c['ativa'].trim()); // "sim" -> true
  const L = [];
  L.push('  - code: ' + q(c['codigo'].trim()));
  L.push('    link: ' + q('/matricula/' + c['slug'].trim()));
  L.push('    name: ' + q(c['nome-do-curso'].trim()));
  L.push('    theme: ' + q(c['tema']));
  L.push('    text: ' + q('com ' + c['instrutor'].trim()));
  L.push('    link-text: ' + q(LINK_TEXT));
  L.push('    category: ' + q(c['categoria'].trim().toLowerCase()));
  L.push('    active: ' + (ativa ? 'true' : 'false'));
  L.push('');
  return L.join('\n');
}

function atualizarHome(c, teste) {
  const caminhoHome = path.join(RAIZ_TRILHAS, 'home', 'default_metadata.yaml');
  if (!fs.existsSync(caminhoHome)) {
    aviso('Lista principal (home) não encontrada — pulei essa etapa. Baixe a pasta home se precisar.');
    return;
  }
  let home = fs.readFileSync(caminhoHome, 'utf8');
  const slug = c['slug'].trim();

  if (home.includes('/matricula/' + slug + '"') || home.includes('/matricula/' + slug + "'")) {
    aviso('A trilha "' + slug + '" já está na lista principal (home) — não vou duplicar.');
    return;
  }

  const entrada = montarEntradaHome(c);
  // Insere o novo bloco logo antes da seção "faq:" da home.
  const idx = home.search(/^faq:/m);
  let novo;
  if (idx === -1) {
    novo = home.replace(/\s*$/, '\n') + '\n' + entrada;
  } else {
    novo = home.slice(0, idx) + entrada + '\n' + home.slice(idx);
  }

  if (teste) {
    console.log('\n----- (TESTE) entrada que seria adicionada na lista principal (home) -----');
    console.log(entrada);
    return;
  }
  fs.writeFileSync(caminhoHome + '.bak', home); // backup de segurança
  fs.writeFileSync(caminhoHome, novo);
  ok('Trilha adicionada na lista principal (home). Backup salvo em home/default_metadata.yaml.bak');
}

// ---------------------------------------------------------------------------
// Programa principal
// ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const teste = args.includes('--teste');
  const forcar = args.includes('--forcar');
  const caminho = args.find((a) => !a.startsWith('--'));

  if (!caminho) {
    console.log('Uso: node gerar-trilha.js briefings/nome.md [--teste] [--forcar]');
    process.exit(0);
  }

  const campos = lerBriefing(caminho);
  validar(campos);

  const slug = campos['slug'].trim();
  const pastaTrilha = path.join(RAIZ_TRILHAS, slug);
  const arquivoTrilha = path.join(pastaTrilha, 'default_metadata.yaml');

  if (fs.existsSync(arquivoTrilha) && !forcar && !teste) {
    erro('A trilha "' + slug + '" já existe.\n   Use --forcar para sobrescrever, ou escolha outro slug.');
  }

  const yaml = montarYaml(campos);

  if (teste) {
    console.log('\n===== (TESTE) 7daysofcode/' + slug + '/default_metadata.yaml =====\n');
    console.log(yaml);
    atualizarHome(campos, true);
    console.log('\n(Modo teste: nada foi gravado.)');
  } else {
    fs.mkdirSync(pastaTrilha, { recursive: true });
    fs.writeFileSync(arquivoTrilha, yaml);
    ok('Página criada: 7daysofcode/' + slug + '/default_metadata.yaml');
    atualizarHome(campos, false);
  }

  // Lembretes das dependências externas
  const formIdOk = !vazioOuPlaceholder(campos['hubspot-formid']);
  console.log('\n📋 Confira antes de publicar:');
  if (!formIdOk) console.log('   • ⚠️  O formId do HubSpot NÃO foi preenchido — o botão de inscrição não vai funcionar até preencher.');
  console.log('   • O ícone "icon-' + campos['codigo'].trim() + '-card.svg" precisa existir no site.');
  console.log('   • A foto do instrutor precisa abrir no link informado.');
  console.log('   • Rode "node validar-trilhas.js" e depois publique com git.\n');
}

main();
