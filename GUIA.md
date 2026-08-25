# Guia — Criar trilhas do 7 Days of Code

Este guia leva você do zero até a trilha no ar, mesmo sem saber programar. O caminho todo passa pelo **formulário local**: você preenche campos no navegador, valida com um botão e os arquivos saem prontos nos formatos certos.

> **O que é uma "trilha"?**
> É um desafio de 7 dias sobre um tema (ex.: Java, React). Ela tem **duas entregas**:
> a **página de inscrição** (que mora neste repositório e vira o site) e os **7 e-mails**
> (que viram um documento Word de revisão **e 7 HTMLs prontos** para o marketing colar no HubSpot).
> O formulário preenche as duas de uma vez.

> 📋 **Procurando o processo, e não os comandos?**
> Quem pede a trilha, tarefa no ClickUp, backup no SharePoint, quem faz o quê — tudo isso está no
> **[FLUXO-DE-TRABALHO.md](FLUXO-DE-TRABALHO.md)**. Este arquivo aqui é a parte técnica: rodar o formulário, gerar e publicar.

---

## ✅ O que você precisa antes de começar

| Requisito | Para quê | Como conseguir |
|---|---|---|
| **Node** instalado | Rodar o formulário e os scripts | [nodejs.org](https://nodejs.org), instalação padrão ("Next, Next, Finish") |
| **Este repositório** no computador | Publicar a página no site | `git clone https://github.com/caelum/cosmos.git` (peça acesso se não tiver) |
| `formId` do **HubSpot** | O botão de inscrição funcionar | Pedir a quem cuida do HubSpot (pode preencher depois) |
| **Ícone e foto** no site | O card não ficar com imagem quebrada | PR no `caelum/alura-site` — ver passo 6 |

> **Não tem o repositório?** Dá para preencher todo o conteúdo mesmo assim: baixe o
> **`7doc-ferramentas.zip`** (na pasta do 7 Days of Code no SharePoint), descompacte em qualquer
> pasta e siga os passos 1 a 4 abaixo do mesmo jeito. A única diferença é que a "prova real" da
> validação é pulada (ela roda no computador de quem publica). Ao terminar, mande seu rascunho
> — o arquivo `rascunhos/<slug>.7doc.json` — para quem tem o repositório fazer os passos 5 a 8.

---

## 🚀 Criar uma trilha nova, do zero ao ar

### 1. Abra o formulário

Abra o terminal na pasta `_ferramentas-trilhas` e rode:

```
node formulario/servidor.js
```

O navegador abre sozinho. Clique em **"➕ Começar uma trilha nova"**.

### 2. Preencha as 11 páginas

O índice na lateral esquerda mostra tudo o que existe para preencher: 3 páginas de briefing (a página de inscrição), 1 de configuração dos e-mails e 1 para cada um dos 7 dias. A bolinha ao lado de cada página mostra o andamento: vazia, amarela (parcial) ou verde (completa).

Enquanto preenche:

- **Cada campo traz um exemplo em cinza** mostrando o que se espera ali.
- **👁 ver exemplo real** (nos campos de e-mail) abre o trecho equivalente de uma trilha que já foi ao ar.
- **⚡ usar modelo do assunto** monta o começo do assunto do e-mail com o nome da trilha e o número do dia certos.
- **Negrito:** escreva `**assim**`. Vira negrito de verdade no Word, no HTML e na página.
- **Bloco de código:** nos campos de e-mail, texto entre linhas de três crases (```` ``` ````) vira a caixa preta estilo terminal no HTML e sai em fonte de código no Word — use para os prompts e códigos dos desafios. É crase (`` ` ``, três vezes, numa linha só para isso), não aspas.
- **Links extras:** o campo "Links extras (Para saber mais)" de cada dia tem o botão **➕ Adicionar link**, que pede título, URL e tipo (artigo, vídeo...). Esses links viram a lista "Para saber mais" no e-mail.
- **Tudo é salvo sozinho** enquanto você digita. Pode fechar e voltar outro dia — o rascunho estará na tela inicial.
- **Uma aba por vez.** Se o formulário perceber que outra aba ou janela salvou o mesmo rascunho depois de você abri-lo (acontece quando uma aba de ontem fica esquecida aberta), ele **para de salvar naquela aba** e avisa — assim a versão mais nova nunca é apagada pela velha. Feche a aba avisada e continue na mais recente.
- **Cópias de segurança automáticas.** Antes de sobrescrever um rascunho, o formulário guarda uma cópia em `rascunhos/backups/` (até uma a cada 10 minutos, as 40 mais recentes). Se algo der errado, dá para voltar no tempo: copie o backup desejado para `rascunhos/` com o nome `<slug>.7doc.json` — ou importe-o pela tela inicial (abaixo).

Dois campos da página *Identidade* merecem atenção especial:

- **slug** — o endereço da página (`/matricula/<slug>`). Só letras minúsculas, números e hífens.
- **codigo** — o identificador do ícone. **Combine com o design antes**, porque o arquivo do ícone precisa se chamar exatamente `icon-<codigo>-card.svg`. Na dúvida, use o mesmo valor do slug.

### 3. Valide

Clique em **"✓ Validar tudo"**. Cada problema aparece no painel à direita — clicar nele leva direto ao campo culpado. **Erros** quebram a entrega (ex.: dia 5 com assunto "4/7", `[Nome]` grafado errado); **avisos** valem conferir (ex.: assunto comprido demais). No fim do painel, a "prova real": o gerador oficial da página confirma que aceita o briefing.

### 4. Gere os arquivos

Clique em **"📄 Gerar os arquivos"**. Saem três:

| Arquivo | O que é | Para onde vai |
|---|---|---|
| `briefings/<slug>.md` | O briefing da página | Fica aqui; alimenta o passo 5 |
| `saida/E-mails — <Trilha>.docx` | O roteiro dos 7 e-mails, para revisão | Suba na pasta do 7 Days of Code no SharePoint |
| `saida/<slug>-html/` | **7 HTMLs prontos** (`dia-1.html` a `dia-7.html`), com visual, logo e UTMs | Marketing cola cada um no e-mail correspondente do HubSpot |

Os HTMLs já saem sem o rodapé de endereço/descadastro — o HubSpot acrescenta o dele automaticamente.

> **Perdeu o rascunho? Dá para recuperar dos arquivos gerados.**
> A tela inicial tem o botão **"⬆ Subir arquivos gerados"**: selecione o briefing (`.md`),
> o Word dos e-mails (`.docx`) e/ou um rascunho (`.7doc.json`) e o formulário preenche
> todos os campos de volta — sem redigitar nada. Pode enviar mais de um arquivo de uma
> vez (o `.md` recupera a página, o `.docx` recupera os 7 e-mails). Funciona até com um
> `.docx` que alguém editou e salvou de novo no Word.

### 5. Gere a página do site

De volta ao terminal (na pasta `_ferramentas-trilhas`):

```
node gerar-trilha.js briefings/<slug>.md --teste
```

O `--teste` mostra o que seria criado, sem gravar. Se estiver tudo certo, rode de novo **sem** o `--teste`. Isso cria a página (`7daysofcode/<slug>/`) e adiciona a trilha na lista da home.

### 6. Confirme as dependências externas

Antes de anunciar a trilha, três coisas de fora precisam estar no lugar:

1. **`formId` do HubSpot** — sem ele a página abre, mas o botão de inscrição não funciona. Se recebeu depois de gerar, preencha no formulário e repita os passos 4 e 5 (use `--forcar` no gerador).
2. **Ícone e foto no `alura-site`** — os visuais moram em outro repositório (`caelum/alura-site` → `7daysofcode/assets/img/`) e entram lá **por Pull Request revisado**, que depende de aprovação de outra pessoa. Abra esse PR cedo. O passo a passo está no [FLUXO-DE-TRABALHO.md](FLUXO-DE-TRABALHO.md), Etapa 5. Se o ícone não estiver lá, a página publica sem erro e o card fica quebrado.
3. **Soluções dos desafios** — publicadas em `github.com/7-days-of-code`, um repositório por trilha com uma branch por dia (`solucao-dia-1` … `solucao-dia-7`); os e-mails apontam para a branch do dia.

### 7. Publique

```
node validar-trilhas.js
git add 7daysofcode/
git commit -m "feat: adiciona trilha <nome>"
git push
```

O validador audita todas as trilhas antes de subir. O site atualiza sozinho um tempo depois do push. Você tem permissão de commit direto na `master`; abrir Pull Request é opcional.

### 8. Teste de verdade

Abra a página no ar, confira textos, ícone e foto — e **se inscreva com um e-mail seu**. A trilha só está pronta quando o e-mail do Dia 1 chegar certinho (visual, links e solução apontando para a pasta certa).

---

## 📧 Onde vivem os e-mails dos 7 dias?

Este repositório só tem a **página de inscrição**. Os 7 e-mails são montados e disparados no **HubSpot**: o marketing monta o *workflow* (um e-mail por dia, a partir da inscrição) usando os arquivos do passo 4 — o `.docx` para revisar o texto e os **HTMLs da pasta `saida/<slug>-html/` para colar direto no editor** de cada e-mail. O template visual de referência fica em `modelo-emails-html/`, aqui nesta pasta.

**Pendência:** ainda falta acesso ao painel do HubSpot para ver por dentro como o workflow é montado. Sem isso, a parte dos e-mails de uma trilha nova depende do marketing.

---

## ✏️ Editar uma trilha existente

Para um ajuste pequeno (corrigir um texto, trocar instrutor):

1. O arquivo da trilha é `7daysofcode/<slug>/default_metadata.yaml` — a alteração é feita direto nele.
2. Rode `node validar-trilhas.js` antes de publicar — ele pega erros comuns.
3. Publique com `git add` → `commit` → `push`, como no passo 7.

Se o ajuste for **nos e-mails**: atualize o Word da trilha no SharePoint e avise o marketing para corrigir no HubSpot — mudar o Word não muda o e-mail sozinho.

> 💡 Rode `node validar-trilhas.js` de vez em quando mesmo sem editar nada: ele audita as 34 trilhas e aponta problemas herdados.

---

## 🖊 Alternativa: preencher sem o formulário

Os modelos continuam existindo para quem preferir o caminho manual: `MODELO-briefing.md` (abre no Bloco de Notas; não apague os títulos `##`; salve em UTF-8) e `MODELO-emails.docx`. O resultado alimenta os mesmos passos 5 a 8. Mas o formulário existe justamente para não precisar disso.

---

## 📂 Mapa dos arquivos desta pasta

```
_ferramentas-trilhas/
├── GUIA.md                ← este arquivo (parte técnica)
├── FLUXO-DE-TRABALHO.md   ← o processo ponta a ponta (demanda → ClickUp → SharePoint → publicação)
├── formulario/            ← o formulário local (node formulario/servidor.js)
│   ├── servidor.js        ← sobe o formulário no navegador
│   └── lib/campos.js      ← definição de TODOS os campos (a fonte da verdade)
├── gerar-trilha.js        ← transforma o briefing em página do site
├── validar-trilhas.js     ← audita as trilhas publicadas em busca de erros
├── MODELO-briefing.md     ← modelo em branco da página (caminho manual)
├── MODELO-emails.md       ← modelo em branco dos e-mails (+ versão .docx)
├── modelo-emails-html/    ← template visual dos e-mails em HTML + exemplos prontos (dias 1 e 2)
├── briefings/             ← briefings prontos (saída do formulário)
│   └── EXEMPLO-preenchido.md  ← um exemplo pronto (pode testar o gerador nele)
├── rascunhos/             ← rascunhos do formulário (criada sozinha; fica fora do git)
│   └── backups/           ← cópias de segurança automáticas dos rascunhos
└── saida/                 ← .docx e HTMLs dos e-mails gerados (criada sozinha; fica fora do git)
```

**O `7doc-ferramentas.zip`** (na raiz do repositório e na pasta do 7 Days of Code no SharePoint) é um retrato desta pasta para quem não tem o repositório. Depois de qualquer mudança nas ferramentas, gere-o de novo e atualize a cópia do SharePoint.
