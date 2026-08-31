# Fluxo de trabalho — trilhas do 7 Days of Code

Da **demanda** até a **publicação**: quem pede, onde registra, quais documentos criar e em que ordem.
Vale tanto para **criar uma trilha nova** quanto para **editar uma existente**.

> Este é o guia **do processo**. A parte técnica (rodar o script que gera a página) está no [GUIA.md](GUIA.md).

---

## 🗺️ O fluxo em uma olhada

```
   Demanda                ClickUp                 SharePoint              Execução              Publicação
      │                      │                        │                      │                      │
 alguém quer   ──▶   tarefa na lista    ──▶   backup dos        ──▶   formulário, HubSpot  ──▶   página no ar
 uma trilha           "Demandas                  arquivos             e visuais prontos       + e-mails no HubSpot
                      Operacionais"                                                          + tarefa "fechado"
```

**Regra de ouro:** demanda que não está no ClickUp **não existe**. Nada começa antes da tarefa ser aberta.

---

## 📖 Vocabulário rápido

| Termo | O que é, em português normal |
|---|---|
| **Trilha** | Um desafio de 7 dias sobre um tema (ex.: "Prompt Engineering"). |
| **Página de inscrição** | A página do site onde a pessoa se inscreve. Mora no **GitHub**. |
| **Os 7 e-mails** | O conteúdo que a pessoa recebe, um por dia, depois de se inscrever. Mora no **HubSpot**. |
| **Briefing** | Documento com os textos que viram a *página de inscrição*. |
| **Modelo de e-mails** | Documento com os textos dos *7 e-mails*. É outro documento — não confunda com o briefing. |
| **formId** | Um número que o HubSpot dá ao formulário de inscrição. Sem ele o botão da página não funciona. |
| **Workflow** | No HubSpot, é a "automação": a regra que dispara o e-mail certo no dia certo. |
| **Soluções** | O código-resposta de cada desafio. Ficam no GitHub, na organização `7-days-of-code` — um repositório por trilha, com uma branch por dia (`solucao-dia-1` … `solucao-dia-7`). |

---

## ⚠️ Toda trilha tem DOIS entregáveis separados

1. **A página de inscrição** → GitHub → gerada a partir do **briefing**.
2. **Os 7 e-mails** → HubSpot → montados a partir do **modelo de e-mails**.

São independentes: uma pode estar pronta e a outra não. Por isso a tarefa do ClickUp tem itens de checklist para as duas.

---

## 🧩 A página de inscrição vive em DOIS repositórios

Isso não é óbvio e explica várias coisas do fluxo. A página que a pessoa vê é montada juntando duas metades, que ficam em lugares diferentes:

| Repositório | O que guarda | Quem mexe |
|---|---|---|
| **`caelum/cosmos`** (este) | O **conteúdo**: o `default_metadata.yaml` de cada trilha — textos, nome do instrutor, os 7 dias | Você / conteúdo |
| **`caelum/alura-site`** | A **aparência**: o código PHP da página, o CSS, os ícones e as fotos | Time do site / design |

No `alura-site`, a parte do 7 Days of Code fica em:

```
7daysofcode/
├── assets/img/     ← ícones das trilhas e fotos dos instrutores
├── pages/          ← o código das páginas
│   └── matricula/__codigo__.php   ← o template de TODA página de trilha
└── templates/
```

**Não existe uma página por trilha.** Existe **um único template** que se transforma em qualquer trilha. Quando alguém abre `7daysofcode.io/matricula/github`, esse arquivo pega o `github` da URL e vai buscar o YAML correspondente aqui no cosmos:

```php
$cosmos = new Cosmos($URL_VARS['codigo']);
$dataCosmos = $cosmos->getDefaultMetadata();
if (empty($dataCosmos)) return PageRouter::error_page(404);
```

Três consequências práticas:

1. **O nome da pasta no cosmos é o endereço da página.** `7daysofcode/prompt-engineering/` vira `/matricula/prompt-engineering`. Errou o nome da pasta, a página dá 404.
2. **Mudança de texto não precisa do time do site.** Editar o YAML aqui e publicar já muda a página no ar. Só o que é visual (layout, ícone novo) depende do outro repositório.
3. **O `formId` do YAML é injetado direto no formulário do HubSpot** pelo template. Se estiver vazio, a página carrega mas o formulário não aparece.

> 💡 **Recurso existente e não usado:** o template prevê `expired` no bloco `site` do YAML. Quando presente, a página troca o formulário por um banner de chamada para outra ação (`expiredBanner`). Nenhuma trilha usa hoje e o script não gera — mas é uma alternativa melhor que `ativa: não` quando uma trilha sai do ar, porque a página continua existindo e direciona a pessoa para outro lugar em vez de sumir.

---

## Etapa 1 — A demanda chega

**Quem faz:** quem está pedindo a trilha (liderança, marketing, conteúdo — qualquer pessoa).

A demanda pode nascer em conversa, reunião ou Teams. Não importa por onde chegou: **quem pede é responsável por registrar a tarefa no ClickUp**. Se o pedido chegou até você por outro canal, responda pedindo que a pessoa abra a tarefa (ou abra você e marque quem pediu como observador — mas o padrão é quem pede registrar).

**O que a demanda precisa trazer, no mínimo:**

- Tema da trilha (ex.: "MCP", "IA para Marketing")
- Instrutor(a) que será creditado
- Se existe data-alvo de lançamento
- Se é trilha **nova** ou **edição** de uma existente

Sem isso a tarefa fica em `backlog` até alguém completar.

---

## Etapa 2 — Abrir a tarefa no ClickUp

📍 Lista: **Demandas Operacionais** → https://app.clickup.com/3148001/v/li/901327963111
(espaço *[Conteúdo] Suporte Educacional*)

### Passo a passo

1. Abra a lista e **duplique a tarefa `7doc - Modelo de tarefa`** (menu `...` → *Duplicate*). Assim o tipo e os campos já vêm certos.
2. **Renomeie** com o nome da trilha. Só o tema, sem prefixo. Ex.: `Prompt Engineering`.
3. Confira o **tipo da tarefa**: precisa ser `7 days of code`. É isso que diferencia essas tarefas das outras demandas operacionais da lista.
4. Preencha o campo **Instrutor(a)**.
5. **Atribua responsáveis** — pelo menos alguém de conteúdo e alguém de marketing.
6. Coloque **data de entrega** se houver data-alvo de lançamento.
7. **Cole o checklist** abaixo na tarefa (aba *Checklists* → colar tudo de uma vez, o ClickUp quebra em itens).
8. Na **descrição**, cole o link da pasta do 7 Days of Code no SharePoint (Etapa 3) e qualquer contexto do pedido.

### Checklist padrão (copie e cole)

```
Briefing da página preenchido
Modelo de e-mails preenchido (7 dias)
Soluções dos 7 desafios escritas
formId do formulário criado no HubSpot
Ícone da trilha commitado no repositório do site (alura-site)
Foto do instrutor commitada no repositório do site (alura-site)
Soluções publicadas no repositório do GitHub
Página gerada e publicada (site)
E-mails montados no workflow do HubSpot
Teste de inscrição feito (recebi o e-mail do Dia 1)
```

### O que cada status significa

| Status | Quando usar |
|---|---|
| `backlog` | Demanda registrada, ainda não começou. |
| `fazendo` | Alguém está trabalhando em pelo menos um item do checklist. |
| `feito` | Tudo pronto e publicado — página no ar **e** e-mails montados. |
| `fechado` | Teste de inscrição feito e conferido. Só então encerre. |

> A tarefa só sai de `fazendo` quando **todos** os itens do checklist estiverem marcados. Se algo travou (ex.: falta acesso ao HubSpot), deixe em `fazendo` e escreva um comentário dizendo o que está bloqueando — não mova para `feito`.

---

## Etapa 3 — O backup no SharePoint

📍 Pasta do 7 Days of Code no SharePoint.

É o local de **backup das trilhas**: para lá vão os arquivos que o formulário gerar na próxima etapa — em especial o `E-mails — <Trilha>.docx`, para revisão. É lá também que fica o `7doc-ferramentas.zip`, para quem não tem o repositório.

Volte ao ClickUp e **cole o link da pasta** na descrição da tarefa, para quem chegar depois encontrar tudo.

> ⚠️ **O SharePoint é o único lugar desses documentos.** O repositório não guarda cópia — o que
> o formulário gerar (o `.docx`, os HTMLs) precisa ser **subido lá manualmente** ao final do
> trabalho. O mesmo vale para o `7doc-ferramentas.zip`: depois de qualquer mudança nas
> ferramentas, atualize a cópia que está lá.

---

## Etapa 4 — Preencher o conteúdo (no formulário)

**Quem faz:** equipe de conteúdo.

O preenchimento é feito no **formulário local** — as duas entregas (página de inscrição e os 7 e-mails) num lugar só, cada informação num campo próprio, com exemplo de como preencher.

### O que precisa

- **Node** instalado ([nodejs.org](https://nodejs.org), instalação padrão) — só isso.
- E as ferramentas, de um dos dois jeitos:
  - **tem o repositório?** já está tudo na pasta `_ferramentas-trilhas`;
  - **não tem?** baixe o **`7doc-ferramentas.zip`** na pasta do 7 Days of Code no SharePoint e descompacte em qualquer pasta.

### Como usar

1. No terminal, dentro da pasta `_ferramentas-trilhas`: `node formulario/servidor.js` — o navegador abre sozinho.
2. Clique em **"Começar uma trilha nova"** e preencha as 12 páginas navegando pelo índice lateral. Cada campo traz um exemplo; negrito se escreve `**assim**`; **tudo salva sozinho** (pode fechar e continuar outro dia).
3. Clique em **"✓ Validar tudo"** — os problemas aparecem listados e o clique leva ao campo certo.
4. Clique em **"📄 Gerar os arquivos"**. Saem os três produtos, já com os nomes e formatos certos:
   - `briefings/<slug>.md` → alimenta a geração da página (Etapa 6);
   - `saida/E-mails — <Trilha>.docx` → **suba na pasta do 7 Days of Code no SharePoint** (Etapa 3), para revisão;
   - `saida/<slug>-html/` → **8 HTMLs prontos** (`dia-1.html` a `dia-7.html` + `conclusao.html`) para o marketing colar no HubSpot (Etapa 7).

Quem preencheu pelo zip (sem o repositório) tem um passo a mais: enviar o rascunho — o arquivo `rascunhos/<slug>.7doc.json` — para quem publica, que o coloca na pasta `rascunhos/` dele e segue dali. O passo a passo completo está no [GUIA.md](GUIA.md).

Se um rascunho sumir ou vier de outra máquina, ninguém redigita nada: o botão **"⬆ Subir arquivos gerados"** da tela inicial reconstrói o formulário a partir do briefing `.md` e/ou do `.docx` dos e-mails (funciona até com o `.docx` do SharePoint). O formulário também guarda cópias de segurança automáticas em `rascunhos/backups/` e recusa que uma aba desatualizada do navegador salve por cima do trabalho mais novo.

Ao terminar, marque no ClickUp: *Briefing da página preenchido* e *Modelo de e-mails preenchido*.

---

## Etapa 5 — As três dependências externas

Rodam **em paralelo** com a escrita do conteúdo. Cobre cedo, porque são as que mais atrasam lançamento.

| # | Dependência | Quem faz | O que você precisa receber |
|---|---|---|---|
| 1 | **Formulário de inscrição** | Responsável pelo HubSpot | O número do `formId` |
| 2 | **Visuais** | Design | Ícone `icon-<codigo>-card.svg` e a foto do instrutor — **commitados no repositório do site** (veja abaixo) |
| 3 | **Soluções dos desafios** | Conteúdo | Código das 7 soluções, para publicar no GitHub |

### ⚠️ Sobre os visuais: receber o arquivo não basta

O ícone e a foto **não moram no repositório das páginas**. Eles ficam em outro repositório, o do site:

```
github.com/caelum/alura-site → 7daysofcode/assets/img/
├── icon-<codigo>-card.svg          ← ícone da trilha
└── instrutores/instrutor-<nome>.jpg ← foto de quem é creditado
```

O YAML da trilha guarda só o **nome** do arquivo (`icon: "icon-github-card.svg"`), e o site monta o caminho colando esse nome depois de `/assets/img/`. Se o arquivo não estiver lá, **não aparece erro nenhum**: a página abre normal, o validador passa, e o card fica com uma imagem quebrada no ar.

Por isso o item de checklist *"Ícone da trilha entregue pelo design"* só está cumprido quando o SVG **está commitado no `alura-site`** — não quando o designer te mandou o arquivo. São dois passos, e o segundo costuma ser esquecido.

Ao pedir o ícone ao design, combine o nome **antes**: ele precisa ser exatamente `icon-<codigo>-card.svg`, usando o mesmo `codigo` que vai no briefing.

### Como publicar o ícone (e a foto) no `alura-site`

⚠️ **O `alura-site` não funciona como este repositório.** Aqui você commita direto na `master`; lá **não dá** — a branch é protegida e tudo entra por Pull Request revisado. É o site principal da Alura, com milhares de PRs no histórico.

Você **tem permissão de escrita** no repositório (verificado em 04/08/2026), então não precisa pedir para ninguém subir o arquivo. Mas precisa de **alguém para aprovar o PR**.

Passo a passo:

1. Clonar `github.com/caelum/alura-site` (se ainda não tiver local)
2. Criar uma branch — ex.: `7doc-icone-<codigo>`
3. Colocar os arquivos:
   - `7daysofcode/assets/img/icon-<codigo>-card.svg`
   - `7daysofcode/assets/img/instrutores/instrutor-<nome>.jpg` (se for instrutor novo)
4. Abrir o Pull Request explicando que é o visual de uma trilha nova do 7 Days of Code
5. **Aguardar aprovação** de alguém do time do site

> ⏱️ **Planeje com folga.** O passo 5 não depende de você. Se a trilha tem data de lançamento, abra o PR do ícone bem antes — descobrir que o revisor está de férias na véspera do lançamento é o pior momento possível.

Como o conteúdo (cosmos) e o visual (alura-site) são independentes, dá para publicar a página primeiro e o ícone depois. Só não anuncie a trilha antes do ícone entrar — até lá o card fica com imagem quebrada.

**Sobre as soluções (padrão em uso):** cada trilha tem **seu próprio repositório** na organização `github.com/7-days-of-code`, com **uma branch por dia** (`solucao-dia-1` … `solucao-dia-7`) — exemplo real: `github.com/7-days-of-code/prompt-engineering`. No e-mail, o campo "Solução do dia anterior" recebe o **link da branch do dia** (ex.: `.../tree/solucao-dia-2`). Nada de Gists soltos.
Se o código for curto, dá para colar no corpo do e-mail também — mas cuidado: e-mail muito longo o Gmail corta com "[Mensagem truncada]", e a solução fica justamente no fim.

---

## Etapa 6 — Gerar e publicar a página

**Quem faz:** parte técnica (você ou quem tiver o repositório clonado).

Detalhe completo dos comandos está no [GUIA.md](GUIA.md). Resumo:

1. O briefing já está em `_ferramentas-trilhas/briefings/<slug>.md` — o formulário o gerou na Etapa 4. (Se veio de outra pessoa como rascunho `.7doc.json`, coloque o arquivo na sua pasta `rascunhos/`, abra o formulário, valide e gere os arquivos.) Conferir se o `formId` já foi preenchido.
2. `node gerar-trilha.js briefings/<slug>.md --teste` (simula, não grava nada).
3. Se estiver ok, rodar sem `--teste`.
4. `node validar-trilhas.js` para conferir que nada quebrou.
5. `git add` → `commit` → `push`. O site atualiza sozinho depois de um tempo.

Marque no ClickUp: *Página gerada e publicada*.

---

## Etapa 7 — Montar os e-mails no HubSpot

**Quem faz:** marketing / responsável pelo HubSpot.

1. Envie para quem monta o documento `E-mails — <trilha>.docx` (link do SharePoint, para conferência do texto) **e a pasta `saida/<slug>-html/`** com os 7 HTMLs prontos.
2. A pessoa cria o **workflow** no HubSpot: um e-mail por dia, disparado a partir da inscrição no formulário daquela trilha, **colando o HTML do dia correspondente** no editor de cada e-mail (o visual, os links e as UTMs já vêm prontos).
3. Confirme que o rodapé legal e o link de descadastro estão lá — é obrigatório. Os HTMLs saem sem esse rodapé de propósito: é o padrão da própria ferramenta que deve entrar.
4. Faça um envio de prova e confira o logo do topo: ele é um SVG e alguns clientes de e-mail (Gmail) não exibem SVG — se aparecer quebrado, suba uma versão PNG do logo no gerenciador de arquivos do HubSpot e troque a URL da imagem.

Marque: *E-mails montados no workflow do HubSpot*.

---

## Etapa 8 — Testar e fechar

Antes de mover a tarefa para `fechado`:

- [ ] Abrir a página de inscrição no site e conferir textos, ícone e foto do instrutor
- [ ] **Se inscrever de verdade** com um e-mail seu
- [ ] Confirmar que o e-mail do Dia 1 chegou, com o visual certo e os links funcionando
- [ ] Conferir que o link da solução abre a pasta correta no GitHub

Deu tudo certo → `fechado`. Escreva um comentário na tarefa com o link da página publicada.

---

## ✏️ Editar uma trilha existente

Fluxo curto:

1. **Abra uma tarefa no ClickUp** mesmo assim (tipo `7 days of code`), com o nome no formato `Ajuste — <Trilha>`. Descreva o que muda e por quê.
2. Se o ajuste é **na página**: altera-se o arquivo `7daysofcode/<trilha>/default_metadata.yaml`, roda o validador e publica.
3. Se o ajuste é **nos e-mails**: atualize o `E-mails — <Trilha>.docx` na pasta do 7 Days of Code no SharePoint e avise o marketing para corrigir no HubSpot. **Alterar o Word não muda o e-mail sozinho.**
4. Confira o resultado no ar e feche a tarefa.

> 💡 Rode `node validar-trilhas.js` de vez em quando mesmo sem demanda: ele audita as 34 trilhas e aponta erros herdados.

---

## 👥 Quem faz o quê (resumo)

| Frente | Responsável | Onde trabalha |
|---|---|---|
| Registrar a demanda | Quem pede | ClickUp — *Demandas Operacionais* |
| Backup dos arquivos da trilha | Quem toca a trilha | SharePoint — pasta do 7 Days of Code |
| Escrever briefing e e-mails | Conteúdo | Formulário local (repositório ou `7doc-ferramentas.zip`) |
| Escrever as soluções | Conteúdo | GitHub — org `7-days-of-code` |
| Formulário / `formId` | Marketing (HubSpot) | Painel do HubSpot |
| Montar os e-mails | Marketing (HubSpot) | Workflow no HubSpot |
| Ícone e foto | Design | Arquivos de imagem |
| Gerar e publicar a página | Parte técnica | Repositório do site |

Os nomes e contatos de cada frente ficam em **`Contatos e acessos.docx`**, na pasta do 7 Days of Code no SharePoint — mantenha atualizado.

---

## 🔗 Onde fica cada coisa

| Coisa | Lugar |
|---|---|
| Lista de demandas | https://app.clickup.com/3148001/v/li/901327963111 |
| Tarefa-modelo do 7doc | `7doc - Modelo de tarefa`, na lista acima |
| Backup das trilhas, contatos e `7doc-ferramentas.zip` | SharePoint → pasta do 7 Days of Code |
| Briefing gerado | `_ferramentas-trilhas/briefings/<slug>.md` (saída do formulário) |
| HTMLs dos e-mails | `_ferramentas-trilhas/saida/<slug>-html/` (saída do formulário) |
| Conteúdo das páginas (YAML) | `github.com/caelum/cosmos` → pasta `7daysofcode/` |
| Código e visual das páginas | `github.com/caelum/alura-site` → pasta `7daysofcode/` |
| Ícones das trilhas | `alura-site` → `7daysofcode/assets/img/icon-<codigo>-card.svg` |
| Fotos dos instrutores | `alura-site` → `7daysofcode/assets/img/instrutores/` |
| Soluções dos desafios | GitHub → `github.com/7-days-of-code` |
| E-mails | HubSpot (workflows) |
| Comandos e scripts | [GUIA.md](GUIA.md) |

---

## 🚧 Pendências conhecidas

Coisas que ainda não estão resolvidas e podem travar uma trilha nova:

1. **Acesso ao HubSpot.** Ainda falta ver por dentro como o disparo dos 7 e-mails é montado. Confirmado que o envio funciona, mas sem acesso não dá para montar trilha nova sozinho.
2. **Faltam materiais de apoio no SharePoint:** o exemplo preenchido (Lógica com JS), a anatomia visual do e-mail e os visuais (logo, selos).
3. ~~Repositório das soluções ainda não foi criado~~ **Resolvido (verificado em 12/08/2026):** as soluções já estão no ar na organização `7-days-of-code`, no padrão *um repositório por trilha, uma branch por dia* (ex.: `github.com/7-days-of-code/prompt-engineering`, branches `solucao-dia-1` … `solucao-dia-7`).
4. **Bug herdado:** a página de Flutter dizia "inscreva-se no 7 Days de GitHub" — já corrigida, mas vale rodar o validador antes de qualquer publicação.
5. **Publicar o ícone depende de aprovação de terceiros** — veja *"Como publicar o ícone"* na Etapa 5. Não é bloqueio, mas é o passo que atrasa lançamento sem avisar: você abre o PR e espera alguém revisar. Ainda não sabemos quem costuma revisar PRs do `alura-site` nem o tempo médio de aprovação. Vale perguntar ao time do site antes da primeira trilha.
   Verificado em 04/08/2026: todos os ícones das trilhas hoje no ar existem no `alura-site` — nenhum card quebrado no momento.
