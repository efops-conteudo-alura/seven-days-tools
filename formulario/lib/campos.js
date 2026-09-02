'use strict';
/*
 * campos.js — FONTE DA VERDADE de todos os campos do formulário.
 *
 * A interface (app.js), o validador (validar.js) e os exportadores
 * (briefing-md.js, emails-docx.js) leem TUDO daqui. Para adicionar,
 * remover ou reordenar um campo, mexa só neste arquivo.
 *
 * Cada campo tem:
 *   chave        identificador (no briefing, é o mesmo título "## chave" do .md)
 *   rotulo       nome mostrado na tela
 *   tipo         'linha' | 'paragrafo' | 'escolha' | 'links'
 *   opcoes       (só tipo 'escolha') lista de valores possíveis
 *   obrigatorio  true/false
 *   ajuda        texto curto de orientação, vindo dos modelos
 *   placeholder  exemplo em cinza dentro do campo (o "modelo" de preenchimento)
 *   padrao       valor que já vem preenchido num rascunho novo
 *   modeloAssunto  (só no assunto do e-mail) a UI oferece botão "usar modelo"
 */

// As categorias do site (o que vai no arquivo é o slug; a tela mostra o nome).
const CATEGORIAS = [
  { slug: 'back-end', nome: 'Back-end' },
  { slug: 'front-end', nome: 'Front-end' },
  { slug: 'dados', nome: 'Dados' },
  { slug: 'inteligencia-artificial', nome: 'Inteligência Artificial' },
  { slug: 'devops', nome: 'DevOps' },
  { slug: 'ciberseguranca', nome: 'Cibersegurança' },
  { slug: 'cloud', nome: 'Cloud' },
  { slug: 'ux-design', nome: 'UX & Design' },
  { slug: 'mobile', nome: 'Mobile' },
  { slug: 'gestao-negocios', nome: 'Gestão & Negócios' },
];

// Tipos de conteúdo que um link extra pode ter (o modal "Adicionar link").
const TIPOS_DE_LINK = ['Artigo', 'Curso', 'Vídeo', 'Documentação', 'Podcast', 'Outro'];

// Textos que contam como "não preenchido" (herdados dos modelos atuais).
const PLACEHOLDERS = [
  'COLOQUE', 'DESCREVA', 'PREENCHER-DEPOIS', 'ESCREVA AQUI',
  'coloque-o-codigo-aqui', 'COLOQUE-O-SLUG-AQUI', 'https://coloque-o-link-da-foto-aqui',
];

// ---------------------------------------------------------------------------
// Briefing (gera a página de inscrição — mesmo formato do MODELO-briefing.md)
// ---------------------------------------------------------------------------

// Ordem exata dos títulos "##" no arquivo .md exportado.
const ORDEM_BRIEFING = [
  'slug', 'nome-do-curso', 'codigo', 'categoria', 'instrutor', 'tema',
  'o-que-vai-praticar', 'dia-1', 'dia-2', 'dia-3', 'dia-4', 'dia-5', 'dia-6', 'dia-7',
  'frase-de-efeito', 'foto-do-autor', 'minibio-do-autor', 'bio-do-autor',
  'instagram-do-autor', 'linkedin-do-autor', 'hubspot-formid', 'ativa',
];

const PAGINAS_BRIEFING = [
  {
    id: 'briefing-identidade',
    titulo: 'Briefing · Identidade',
    dominio: 'briefing',
    campos: [
      { chave: 'slug', rotulo: 'Slug (endereço da página)', tipo: 'linha', obrigatorio: true,
        ajuda: 'Só letras minúsculas, números e hífens. Vira o nome da pasta e o link /matricula/<slug>.',
        placeholder: 'react-ecommerce' },
      { chave: 'nome-do-curso', rotulo: 'Nome do curso', tipo: 'linha', obrigatorio: true,
        ajuda: 'Como aparece no título da página.',
        placeholder: 'Ex.: Java, React, HTML e CSS' },
      { chave: 'codigo', rotulo: 'Código (identificador do ícone)', tipo: 'linha', obrigatorio: true, usarSlug: true,
        ajuda: 'Usado para achar o ícone icon-<codigo>-card.svg no site. Combine com o design ANTES. Na dúvida, use o mesmo valor do slug — o botão "usar o slug" copia para você.',
        placeholder: 'react' },
      { chave: 'categoria', rotulo: 'Categoria', tipo: 'escolha', obrigatorio: true,
        opcoes: CATEGORIAS.map((c) => ({ valor: c.slug, rotulo: c.nome })),
        ajuda: 'Onde a trilha aparece no filtro do site.' },
      { chave: 'instrutor', rotulo: 'Instrutor(a) creditado', tipo: 'linha', obrigatorio: true,
        ajuda: 'O "rosto" do desafio. Aparece no título, no card e na seção de autor.',
        placeholder: 'Paulo Silveira' },
      { chave: 'tema', rotulo: 'Tema (frase do card)', tipo: 'linha', obrigatorio: true,
        ajuda: 'Uma frase curta que resume o desafio. Aparece no card da trilha na home.',
        placeholder: 'Consumindo a API de filmes do IMDB e criando uma página HTML de exibição' },
      { chave: 'hubspot-formid', rotulo: 'formId do HubSpot', tipo: 'linha', obrigatorio: false,
        ajuda: 'O código do formulário de inscrição, criado no HubSpot. Se ainda não tiver, deixe como está.',
        padrao: 'PREENCHER-DEPOIS' },
      { chave: 'ativa', rotulo: 'Trilha ativa?', tipo: 'escolha', opcoes: ['sim', 'nao'], obrigatorio: true,
        ajuda: '"sim" publica; "nao" deixa como "em breve".', padrao: 'sim' },
    ],
  },
  {
    id: 'briefing-conteudo',
    titulo: 'Briefing · Conteúdo',
    dominio: 'briefing',
    campos: [
      { chave: 'o-que-vai-praticar', rotulo: 'O que a pessoa vai praticar', tipo: 'paragrafo', obrigatorio: true,
        ajuda: 'Parágrafo de apresentação da trilha. Escreva **texto** para negrito — o formulário converte para o formato certo na página e no Word.',
        placeholder: 'Durante os 7 Days de **React**, você vai praticar...' },
      ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
        chave: 'dia-' + n, rotulo: 'Dia ' + n + ' (na página)', tipo: 'paragrafo', obrigatorio: true,
        ajuda: 'O que a pessoa vai fazer no dia ' + n + '. Escreva **texto** para negrito.',
        placeholder: 'Descreva o desafio do dia ' + n + '...',
      })),
      { chave: 'frase-de-efeito', rotulo: 'Frase de efeito', tipo: 'linha', obrigatorio: true,
        ajuda: 'Citação inspiradora com o autor no final, separado por " - ".',
        placeholder: 'Nada na vida deve ser temido, apenas compreendido. - Marie Curie' },
    ],
  },
  {
    id: 'briefing-autor',
    titulo: 'Briefing · Autor',
    dominio: 'briefing',
    campos: [
      { chave: 'foto-do-autor', rotulo: 'Foto do autor (URL)', tipo: 'linha', obrigatorio: true,
        ajuda: 'Link de uma imagem da pessoa. Precisa abrir no navegador. Se a foto oficial ainda não estiver no site, um link provisório serve (ex.: https://github.com/<usuario>.png) — troque pela oficial antes do lançamento.',
        placeholder: 'https://7daysofcode.io/assets/img/instrutores/instrutor-fulano.jpg' },
      { chave: 'minibio-do-autor', rotulo: 'Minibio (uma linha)', tipo: 'linha', obrigatorio: true,
        placeholder: 'Desenvolvedora Front-end e Alura Star.' },
      { chave: 'bio-do-autor', rotulo: 'Bio completa (um parágrafo)', tipo: 'paragrafo', obrigatorio: true,
        placeholder: 'Fulana é desenvolvedora há X anos, formada em...' },
      { chave: 'instagram-do-autor', rotulo: 'Instagram (URL)', tipo: 'linha', obrigatorio: false,
        ajuda: 'URL completa. Se não tiver, deixe em branco.',
        placeholder: 'https://www.instagram.com/usuario/' },
      { chave: 'linkedin-do-autor', rotulo: 'LinkedIn (URL)', tipo: 'linha', obrigatorio: false,
        ajuda: 'URL completa. Se não tiver, deixe em branco.',
        placeholder: 'https://www.linkedin.com/in/usuario/' },
    ],
  },
];

// ---------------------------------------------------------------------------
// E-mails — PARTE 1: configuração fixa (igual nos 7 dias)
// ---------------------------------------------------------------------------

const PAGINA_CONFIG = {
  id: 'emails-config',
  titulo: 'E-mails · Configuração fixa',
  dominio: 'config',
  descricao: 'O marketing configura isto uma vez no HubSpot e reaproveita nos 7 e-mails. A maioria já vem preenchida com o padrão — normalmente só o remetente e a assinatura mudam.',
  campos: [
    { chave: 'remetente', rotulo: 'Remetente', tipo: 'linha', obrigatorio: true,
      ajuda: 'Nome do instrutor + o e-mail oficial.',
      placeholder: 'Rafa Ballerini <contato@7daysofcode.io>' },
    { chave: 'responder-para', rotulo: 'Responder para', tipo: 'linha', obrigatorio: true,
      padrao: 'contato@7daysofcode.io' },
    { chave: 'cabecalho-visual', rotulo: 'Cabeçalho visual', tipo: 'linha', obrigatorio: true,
      padrao: 'Logo do 7 Days of Code + selo da tecnologia + barra de progresso (destacando o dia atual, de 1 a 7)' },
    { chave: 'cta-rodape', rotulo: 'Rodapé de incentivo (CTA)', tipo: 'paragrafo', obrigatorio: true,
      padrao: 'Não se esqueça de compartilhar o seu programa no seu GitHub e nas redes com a hashtag #7DaysOfCode, e também #feedback7DoC caso queira ajuda.' },
    { chave: 'assinatura', rotulo: 'Assinatura', tipo: 'linha', obrigatorio: true,
      ajuda: 'Nome do instrutor + cargo.',
      placeholder: 'Rafa Ballerini — Instrutora Front-End na Alura' },
    { chave: 'rodape-legal', rotulo: 'Rodapé legal (obrigatório)', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'Endereço + link de descadastro. Exigência legal — não remova.',
      padrao: 'Alura, Vila Mariana, São Paulo, SP + link de descadastro "Não quero mais receber os Desafios"' },
  ],
};

// ---------------------------------------------------------------------------
// E-mails — PARTE 2: uma página por dia
// ---------------------------------------------------------------------------

function paginaDia(n) {
  const ultimo = n === 7;
  const campos = [
    { chave: 'assunto', rotulo: 'Assunto', tipo: 'linha', obrigatorio: true, modeloAssunto: true,
      ajuda: 'Formato: #7DaysOfCode - <Trilha> ' + n + '/7: <emoji> <Tema do dia>. O botão "usar modelo" preenche o começo.',
      placeholder: '#7DaysOfCode - Lógica JS ' + n + '/7: 👩🏽‍💻 Variáveis' },
    { chave: 'preheader', rotulo: 'Preheader', tipo: 'linha', obrigatorio: true,
      ajuda: 'A previazinha que aparece na caixa de entrada, ao lado do assunto (~1 linha).',
      placeholder: 'Hoje você vai guardar as respostas do usuário em variáveis.' },
    { chave: 'abertura', rotulo: 'Abertura', tipo: 'paragrafo', obrigatorio: true,
      ajuda: n === 1
        ? 'Boas-vindas ao desafio — no Dia 1 não existe "desafio de ontem".'
        : 'Retome o desafio de ontem e avise que a solução está no fim do e-mail.',
      placeholder: n === 1
        ? 'Que bom que você está aqui, [nome]! Vamos começar?'
        : 'E aí, [nome], conseguiu resolver o desafio de ontem? A solução está no fim deste e-mail!' },
    { chave: 'gancho', rotulo: 'Gancho (introdução ao tema)', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'Situação do dia a dia que conecta a pessoa ao tema de hoje. Escreva **texto** para negrito (vale para todos os campos de e-mail — vira negrito de verdade no Word).',
      placeholder: 'Sabe quando você se cadastra em um site e ele te chama pelo nome?...' },
    { chave: 'conceito', rotulo: 'Conceito do dia', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'A explicação do conceito. Código ou prompt de exemplo entre linhas de três crases (```) vira a caixa escura estilo terminal no e-mail.',
      placeholder: 'Variáveis são os blocos básicos de construção de qualquer sistema...' },
    { chave: 'desafio', rotulo: 'Desafio do dia', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'Enunciado claro. Coloque o prompt ou o código do desafio entre linhas de três crases (```): no e-mail vira a caixa escura estilo terminal, e no Word sai em fonte de código. Uma linha só com ``` antes, outra depois.',
      placeholder: 'Monte o prompt do dia. Exemplo:\n```\nPAPEL: Você é uma mentora de carreira...\nTAREFA: ...\n```' },
    { chave: 'exercicio-opcional', rotulo: 'Exercício opcional', tipo: 'paragrafo', obrigatorio: false,
      ajuda: 'Pode ficar em branco se este dia não tiver.' },
    { chave: 'dica', rotulo: 'Dica', tipo: 'paragrafo', obrigatorio: false,
      ajuda: 'Pode ficar em branco se este dia não tiver.' },
    { chave: 'extra', rotulo: 'Links extras (Para saber mais)', tipo: 'links', obrigatorio: false,
      opcoes: TIPOS_DE_LINK,
      ajuda: 'Materiais complementares do dia (artigo, vídeo, documentação). Cada link tem título, URL e tipo — assim o e-mail sai com os links certinhos, sem texto solto. Pode ficar vazio.' },
  ];
  if (n >= 2) {
    campos.push({ chave: 'solucao-anterior', rotulo: 'Solução do dia anterior (Dia ' + (n - 1) + ')', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'Cole o LINK da branch do dia no repositório da trilha em github.com/7-days-of-code. Código no corpo só se for curto (e-mail longo o Gmail corta).',
      placeholder: 'https://github.com/7-days-of-code/minha-trilha/tree/solucao-dia-' + (n - 1) });
  }
  campos.push({ chave: 'fechamento', rotulo: ultimo ? 'Fechamento (encerramento da jornada)' : 'Fechamento', tipo: 'paragrafo', obrigatorio: true,
    ajuda: ultimo
      ? 'Parabéns por concluir os 7 dias + próximos passos (publicar no GitHub, outra trilha, Alura). NÃO use "até amanhã".'
      : 'Curto e animado.',
    padrao: ultimo ? '' : 'Bom trabalho e até amanhã!',
    placeholder: ultimo ? 'Parabéns, [nome]! Você concluiu os 7 dias...' : 'Bom trabalho e até amanhã!' });

  return {
    id: 'dia-' + n,
    titulo: 'E-mail do Dia ' + n + (ultimo ? ' (último)' : ''),
    dominio: 'dia',
    dia: n,
    campos,
  };
}

// ---------------------------------------------------------------------------
// E-mails — PARTE 3: o e-mail de conclusão (depois do Dia 7)
// ---------------------------------------------------------------------------

// Texto fixo do bloco final (próximos passos) — compartilhado entre o
// formulário (padrão já preenchido) e o exportador (que o usa se o campo
// ainda estiver vazio, como em rascunhos antigos sem este balde).
const CTA_CONCLUSAO_PADRAO = 'É o seu momento de voltar para a superfície e mostrar para todo o mundo o que você criou durante este mergulho.\n\n' +
  'Use a hashtag #7DaysOfCode para compartilhar no seu GitHub e nas suas redes sociais o que você desenvolveu. Se preferir, me marque no LinkedIn também que eu vou adorar ver o seu progresso!\n\n' +
  '<a href="https://7daysofcode.io/">Fique de olho na plataforma 7 Days of Code</a> para encarar outros desafios e continuar aprendendo e praticando.\n\n' +
  'Voltamos a nos falar em breve através da Newsletter Dev em T, com atualizações do mundo Tech, novidades da Alura, e muito mais!';

// O visual parte do arquivo de referência saida/<slug>-html/conclusao.html:
// a mesma tarja, barra de progresso cheia, cartão da solução do Dia 7 e o
// rodapé de incentivo — mas com textos próprios de encerramento.
const PAGINA_CONCLUSAO = {
  id: 'email-conclusao',
  titulo: 'E-mail de Conclusão',
  dominio: 'conclusao',
  campos: [
    { chave: 'assunto', rotulo: 'Assunto', tipo: 'linha', obrigatorio: true, modeloAssunto: true,
      ajuda: 'Formato: #7DaysOfCode - <Trilha> : 🎉 <Tema>. Neste e-mail NÃO se usa a numeração "7/7".',
      placeholder: '#7DaysOfCode - Vibe Coding com Claude Code : 🎉 Parabéns por concluir!' },
    { chave: 'preheader', rotulo: 'Preheader', tipo: 'linha', obrigatorio: true,
      ajuda: 'A previzinha que aparece na caixa de entrada.',
      placeholder: 'Parabéns por ter concluído o #7DaysOfCode! A solução do Dia 7 já está liberada.' },
    { chave: 'abertura', rotulo: 'Abertura', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'Saudação e o anúncio da conclusão da jornada.',
      placeholder: 'Olá,\n\nParabéns por ter concluído o #7DaysOfCode!' },
    { chave: 'corpo', rotulo: 'Corpo (celebração + solução)', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'Parágrafos celebrando a jornada e liberando a solução do Dia 7 para comparação.',
      placeholder: 'Foi uma experiência incrível te desafiar. Agora que você já chegou até aqui, vou liberar a solução do Dia 7...' },
    { chave: 'solucao-dia-7', rotulo: 'Solução do Dia 7 (link)', tipo: 'linha', obrigatorio: true,
      ajuda: 'Cole o LINK da branch do Dia 7 do repositório da trilha em github.com/7-days-of-code.',
      placeholder: 'https://github.com/7-days-of-code/vibe-coding-claude/tree/solucao-dia-7' },
    { chave: 'fechamento', rotulo: 'Fechamento', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'Encerramento: agradecimento, compartilhar com #7DaysOfCode e próximos passos.',
      placeholder: 'Espero que você tenha aproveitado e ganhado mais confiança em usar o Claude como seu fiel companheiro de trabalho.' },
    { chave: 'call-to-action', rotulo: 'Chamado final (próximos passos)', tipo: 'paragrafo', obrigatorio: true,
      ajuda: 'O bloco com os próximos passos. Já vem com o texto padrão do 7 Days of Code — pode editar, mas é bom manter o espírito (compartilhar com #7DaysOfCode e seguir desafiando-se).',
      padrao: CTA_CONCLUSAO_PADRAO },
  ],
};

// ---------------------------------------------------------------------------

function todasAsPaginas() {
  return [
    ...PAGINAS_BRIEFING,
    PAGINA_CONFIG,
    ...[1, 2, 3, 4, 5, 6, 7].map(paginaDia),
    PAGINA_CONCLUSAO,
  ];
}

// Rascunho novo, com os valores-padrão já aplicados.
function rascunhoNovo() {
  const dados = { versao: 1, briefing: {}, emails: { config: {}, dias: [{}, {}, {}, {}, {}, {}, {}], conclusao: {} } };
  for (const pag of todasAsPaginas()) {
    for (const c of pag.campos) {
      if (c.padrao === undefined) continue;
      if (pag.dominio === 'briefing') dados.briefing[c.chave] = c.padrao;
      else if (pag.dominio === 'config') dados.emails.config[c.chave] = c.padrao;
      else if (pag.dominio === 'conclusao') dados.emails.conclusao[c.chave] = c.padrao;
      else dados.emails.dias[pag.dia - 1][c.chave] = c.padrao;
    }
  }
  return dados;
}

module.exports = { CATEGORIAS, TIPOS_DE_LINK, PLACEHOLDERS, ORDEM_BRIEFING, todasAsPaginas, rascunhoNovo, CTA_CONCLUSAO_PADRAO };
