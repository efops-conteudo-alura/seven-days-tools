# EXEMPLO preenchido — E-mails do 7doc de Lógica com JS

> Exemplo real, extraído do e-mail do **Dia 2** que a Rafa Ballerini enviou.
> Serve para o marketing ver como o modelo fica preenchido de verdade.
> (Os outros dias seguiriam a mesma estrutura.)

---

## ⚙️ Configuração fixa (igual nos 7 e-mails)

- **Remetente:** Rafa Ballerini `<contato@7daysofcode.io>`
- **Responder para:** contato@7daysofcode.io
- **Cabeçalho:** logo 7DOC + selo "JS" + barra de progresso (7 pontos, destacando o dia atual)
- **CTA do rodapé:** "Não se esqueça de compartilhar o seu programa no seu GitHub e nas suas redes sociais com a hashtag #7DaysOfCode, e também com #feedback7DoC caso você queira alguma ajuda."
- **Assinatura:** Rafa Ballerini — Instrutora Front-End na Alura
- **Rodapé legal:** Alura, Vila Mariana, São Paulo, SP + "Não quero mais receber os Desafios"
- **Personalização:** `[nome]` = primeiro nome da pessoa

---

## 📩 E-mail do DIA 2 (preenchido)

**Assunto:** `#7DaysOfCode - Lógica JS 2/7: 👩🏽‍💻 Variáveis`

**Abertura:**
E aí, [nome], conseguiu resolver o desafio de ontem? Tenho certeza que sim! Mas, para te deixar mais confiante, vou deixar lá embaixo, no final deste e-mail, como eu resolveria o desafio, ok?

**Gancho (introdução ao tema):**
Sabe quando você se cadastra em um site e, logo em seguida, quando faz o seu login, ele já te chama pelo seu nome? É isso que você vai fazer no desafio de hoje! Quando você cria algum sistema, site ou aplicativo, é comum querer colocar alguns toques personalizados para tornar a **experiência na sua aplicação mais rica e dinâmica**. (...) Para isso, o importante é entender como **capturar e armazenar valores dentro de variáveis**. E é nisso que eu vou te ajudar hoje!

**Conceito do dia:**
Variáveis são os blocos básicos de construção de qualquer sistema e são essenciais para processar qualquer tipo de informação, seja ela de uma pessoa logada no sistema ou mesmo para exibir detalhes de produtos em um catálogo de e-commerce.

**Desafio do dia:**
Desenvolver um programa que simula um desses sites. Ele deve pedir para o usuário responder 3 perguntas:
- Qual o seu nome?
- Quantos anos você tem?
- Qual linguagem de programação você está estudando?

No final, o sistema exibe: `"Olá [nome], você tem [idade] anos e já está aprendendo [linguagem]!"` (cada informação entre [ ] é uma resposta dada pela pessoa).

**Exercício opcional:**
Complementar o código para que, depois da mensagem, o programa pergunte: "Você gosta de estudar [linguagem]? Responda 1 para SIM ou 2 para NÃO." E, conforme a resposta:
- 1 → "Muito bom! Continue estudando e você terá muito sucesso."
- 2 → "Ahh que pena... Já tentou aprender outras linguagens?"

**Dica:**
Você pode adicionar quantas perguntas quiser. Para imprimir e receber valores, use `console.log`, `prompt` e `alert`, ou HTML e CSS se já souber. Para o opcional, use a estrutura condicional `if`:
```
if (resposta == 1){
    // dê a resposta positiva
}
if (resposta == 2){
    // dê a resposta negativa
}
```

**Extra:**
`alert()` e `prompt()` criam caixas de diálogo, mas são diferentes. `alert()` mostra uma mensagem: `alert("Olá, pessoal!");`. Já `prompt()` recebe um valor do usuário:
```
const cidade = prompt("Digite a sua cidade:");
const msg = `Você é de ${cidade}!`;
alert(msg);
```

**Solução do dia anterior (Dia 1):**
[Solução do Dia 1] → hoje é um link para um Gist. (Ver a nota sobre Gist x corpo do e-mail no MODELO-emails.md.)

**Fechamento:**
Bom trabalho e até amanhã!
