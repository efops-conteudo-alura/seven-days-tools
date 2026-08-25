# Modelo de e-mails — 7 Days of Code (sequência dos 7 dias)

> **Para que serve:** este documento é o **roteiro completo dos 7 e-mails** de uma trilha.
> A equipe de conteúdo preenche → a pessoa do marketing usa como base para montar
> a automação (workflow) no HubSpot. **Um documento destes por trilha.**
>
> **Diferença para o outro modelo:** o `MODELO-briefing.md` gera a *página de inscrição*
> (no GitHub). Este aqui é o *conteúdo dos e-mails* (no HubSpot). São coisas separadas.

---

## ⚙️ PARTE 1 — Configuração fixa (igual nos 7 e-mails)

*O marketing configura isto uma vez no HubSpot e reaproveita em todos os dias.*

- **Remetente:** Nome do instrutor `<contato@7daysofcode.io>`
- **Responder para:** contato@7daysofcode.io
- **Cabeçalho visual:** logo do 7 Days of Code + selo da tecnologia + barra de progresso (destacando o dia atual, de 1 a 7)
- **Rodapé de incentivo (CTA):** "Não se esqueça de compartilhar o seu programa no seu GitHub e nas redes com a hashtag #7DaysOfCode, e também #feedback7DoC caso queira ajuda."
- **Assinatura:** Nome do instrutor + cargo (ex.: "Rafa Ballerini — Instrutora Front-End na Alura")
- **Rodapé legal:** endereço (Alura, Vila Mariana, São Paulo, SP) + link de descadastro "Não quero mais receber os Desafios" *(obrigatório)*

**Personalização (o mesmo em todos):**
- `[nome]` = primeiro nome da pessoa inscrita. *(No HubSpot isso é um "token"/campo de personalização.)*

---

## ✉️ PARTE 2 — Conteúdo de cada dia

> Preencha um bloco por dia. Onde houver `[nome]`, o HubSpot troca pelo nome da pessoa.
> Campos marcados como *(opcional)* podem ficar em branco se aquele dia não tiver.

---

### 📩 E-mail do DIA 1

**Assunto:** `#7DaysOfCode - <Trilha> 1/7: <emoji> <Tema do dia>`

**Preheader** *(a previazinha que aparece na caixa de entrada, ~1 linha):*
ESCREVA AQUI

**Abertura:**
Boas-vindas ao desafio (no Dia 1 não há "desafio de ontem"). Ex.: "Que bom que você está aqui, [nome]! Vamos começar?"

**Gancho (introdução ao tema):**
ESCREVA AQUI

**Conceito do dia:**
ESCREVA AQUI

**Desafio do dia:**
ESCREVA AQUI (enunciado claro; se ajudar, mostre um exemplo de entrada e a saída esperada)

**Exercício opcional** *(opcional):*
ESCREVA AQUI OU DEIXE EM BRANCO

**Dica** *(opcional):*
ESCREVA AQUI OU DEIXE EM BRANCO

**Extra** *(opcional):*
ESCREVA AQUI OU DEIXE EM BRANCO

**Solução do dia anterior:**
— (não se aplica no Dia 1) —

**Fechamento:**
"Bom trabalho e até amanhã!"

---

### 📩 E-mail do DIA 2

**Assunto:** `#7DaysOfCode - <Trilha> 2/7: <emoji> <Tema do dia>`

**Preheader:**
ESCREVA AQUI

**Abertura:**
"E aí, [nome], conseguiu resolver o desafio de ontem? ... (avise que a solução está no fim do e-mail)"

**Gancho (introdução ao tema):**
ESCREVA AQUI

**Conceito do dia:**
ESCREVA AQUI

**Desafio do dia:**
ESCREVA AQUI

**Exercício opcional** *(opcional):*
ESCREVA AQUI OU DEIXE EM BRANCO

**Dica** *(opcional):*
ESCREVA AQUI OU DEIXE EM BRANCO

**Extra** *(opcional):*
ESCREVA AQUI OU DEIXE EM BRANCO

**Solução do dia anterior (Dia 1):**
COLE AQUI O LINK da pasta da trilha no repositório de soluções (ou o código, se for curto — ver nota no fim)

**Fechamento:**
"Bom trabalho e até amanhã!"

---

### 📩 E-mail do DIA 3
*(mesma estrutura do Dia 2 — Assunto, Preheader, Abertura, Gancho, Conceito, Desafio, Opcional, Dica, Extra, Solução do Dia 2, Fechamento)*

### 📩 E-mail do DIA 4
*(mesma estrutura)*

### 📩 E-mail do DIA 5
*(mesma estrutura)*

### 📩 E-mail do DIA 6
*(mesma estrutura)*

### 📩 E-mail do DIA 7 (último)

**Assunto:** `#7DaysOfCode - <Trilha> 7/7: <emoji> <Tema do dia>`

*(estrutura igual, mas o Fechamento muda:)*

**Fechamento (encerramento da jornada):**
Parabéns por concluir os 7 dias + próximos passos (ex.: publicar o projeto no GitHub, continuar estudando, convite para outra trilha/Alura). NÃO usar "até amanhã".

---

## ✅ Nota: como entregar a "Solução do dia anterior" — DEFINIDO

**Padrão em uso:** as soluções ficam no **GitHub, dentro da organização 7 Days of Code** (`github.com/7-days-of-code`) — **um repositório por trilha**, com **uma branch por dia** (`solucao-dia-1` … `solucao-dia-7`). Exemplo real: `github.com/7-days-of-code/prompt-engineering`. **Não usamos mais Gists avulsos.**

**Como fica no e-mail:** no campo *Solução do dia anterior*, cole o **link da branch do dia** (ex.: `https://github.com/7-days-of-code/minha-trilha/tree/solucao-dia-2`). Se o código for curto, dá para colá-lo também no corpo (formato **híbrido**).

> ⚠️ **Risco de corte do Gmail:** e-mails muito longos são cortados com "[Mensagem truncada]", e a solução, que fica no fim, é justamente o que some. Por isso, para códigos maiores, prefira **só o link**; use o corpo (híbrido) apenas quando o trecho for curto.
