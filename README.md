<div align="center">

# Bertol

**Uma linguagem didática, um compilador completo e uma máquina virtual que executa o código gerado.**
Da gramática à execução, tudo visível, passo a passo, no navegador.

![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-puro-f7df1e.svg?logo=javascript&logoColor=black)
![Sem dependências](https://img.shields.io/badge/depend%C3%AAncias-nenhuma-brightgreen.svg)
![TCC](https://img.shields.io/badge/TCC-UNIOESTE-9cf.svg)

</div>

---

## Sobre o projeto

Na disciplina de Compiladores, o ciclo prático termina na geração do **Código de Três Endereços (TAC)**. Para executar o código intermediário, o estudante precisa de uma ferramenta externa e, por isso, não vê o resultado final do processo.

Este projeto fecha esse ciclo. Ele reúne três artefatos integrados:

| Artefato | O que é |
|---|---|
| **Bertol** | Linguagem imperativa com sintaxe em português estruturado, criada para fins didáticos. |
| **Compilador Bertol** | Compilador de quatro fases que expõe a trajetória interna de cada uma delas. |
| **Berti VM** | Máquina virtual que interpreta e executa o TAC, instrução por instrução, mostrando memória, pilhas e saída. |

Tudo foi escrito em **HTML, CSS e JavaScript puros**, sem bibliotecas, sem *frameworks* e sem geradores automáticos de analisadores (nada de lex/yacc). Os dois sistemas rodam direto no navegador: basta abrir o `index.html`.

> Trabalho de Conclusão de Curso – Ciência da Computação, UNIOESTE (campus Cascavel).
> Autor: **Pedro Henrique de Oliveira Berti**. Orientador: **Prof. Guilherme Galante**.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Como usar](#como-usar)
- [Passo a passo detalhado](#passo-a-passo-detalhado)
- [A linguagem Bertol](#a-linguagem-bertol)
- [Exemplo completo: do Bertol à execução](#exemplo-completo-do-bertol-à-execução)
- [O compilador](#o-compilador)
- [A Berti VM](#a-berti-vm)
- [Testes e validação](#testes-e-validação)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como citar](#como-citar)
- [Licença](#licença)

---

## Funcionalidades

### Compilador

- **Análise léxica** por um Autômato Finito Determinístico (AFD) de **22 estados**, com visualização da trajetória do autômato.
- **Análise sintática** por **dois métodos independentes**: **SLR** (tabela com 107 estados) e **LL(1)**, com visualização da pilha e dos movimentos do analisador.
- **Análise semântica** com **22 regras formalizadas** (RS-01 a RS-22), tabela de símbolos e verificação de tipos.
- **Geração de Código de Três Endereços (TAC)** para todas as construções da linguagem.
- **Recuperação de erros** nas três fases de análise, com modos *com* e *sem* recuperação.
- Exibição, em abas, de *tokens*, análise sintática, análise semântica, tabela de símbolos, TAC e erros.

### Berti VM

- Executa o **TAC gerado pelo compilador sem nenhuma alteração**.
- Aceita também o **formato genérico de TAC** usado na disciplina: vetores, ponteiros, funções (`param`, `call`, `return`), desvio `ifFalse` e conversões de tipo. Assim, pode executar o código intermediário de outras linguagens desenvolvidas em sala de aula.
- Mostra em tempo real a **instrução corrente**, as **variáveis**, a **memória indexada**, a **pilha de chamadas e de parâmetros** e a **saída**.
- Três modos de execução: **Step** (uma instrução por vez), **Run** (contínuo, com velocidade ajustável) e **Instantâneo** (programa inteiro de uma vez).

---

## Como usar

Não há instalação, *build* nem servidor: as ferramentas são páginas estáticas que rodam direto no navegador.

**Resumo rápido**

1. Baixe o projeto (**Code → Download ZIP** no GitHub) e extraia o ZIP.
2. Dê um clique duplo no `index.html` da ferramenta desejada:

   | Ferramenta | Arquivo |
   |---|---|
   | Analisador Léxico | `Analisador Léxico/Implementação/index.html` |
   | Analisador Sintático (SLR e LL(1)) | `Analisador Sintático/Implementação/index.html` |
   | Compilador completo (léxico, sintático, semântico e TAC) | `Analisador Semântico/Implementação/index.html` |
   | Berti VM | `Berti VM/index.html` |

3. No compilador, escreva ou carregue um programa Bertol, rode a análise e copie o TAC. Na Berti VM, cole o TAC e execute.

Para um guia completo, desde a preparação do computador, veja o [**Passo a passo detalhado**](#passo-a-passo-detalhado).

3. Fluxo de uso típico:
   1. No compilador completo, escreva (ou carregue) um programa Bertol.
   2. Rode as análises e observe cada fase.
   3. Copie o TAC gerado.
   4. Na Berti VM, cole o TAC no painel **Entrada TAC**, clique em **Carregar programa** e execute com **Step**, **Run** ou **Instantâneo**.

> Dica: o botão **!** da VM abre um guia com o passo a passo e os formatos de instrução aceitos.

Se publicar com **GitHub Pages**, as ferramentas ficam acessíveis por link, por exemplo:
`https://phoberti.github.io/bertol-compilador-vm/Berti%20VM/`.

---

## Passo a passo detalhado

Este guia assume que você **não tem nada instalado** além do sistema operacional (Windows, macOS ou Linux). Você **não precisa** de VS Code, Live Server, Node.js, Python, Git nem de qualquer outro programa de desenvolvimento. Só precisa de um navegador e dos arquivos do projeto.

### Parte 0 – Preparação do computador

#### 0.1 Ter um navegador moderno

Use a versão atual de **Google Chrome**, **Microsoft Edge** ou **Mozilla Firefox**. O Edge já vem instalado no Windows. Se você não tem nenhum:

1. Acesse o site oficial do navegador escolhido (por exemplo, `google.com/chrome` ou `mozilla.org/firefox`).
2. Baixe o instalador e execute-o.
3. Siga o assistente até o fim e abra o navegador uma vez para confirmar que funciona.

#### 0.2 Baixar o projeto (escolha **uma** das opções)

**Opção A – Baixar o arquivo ZIP (a mais simples, sem Git)**

1. Abra no navegador: `https://github.com/phoberti/bertol-compilador-vm`
2. Clique no botão verde **Code**.
3. Clique em **Download ZIP**. O arquivo `bertol-compilador-vm-main.zip` vai para a pasta **Downloads**.
4. **Extraia** o ZIP (este passo é obrigatório; abrir os arquivos de dentro do ZIP sem extrair não funciona direito):
   - **Windows:** clique com o botão direito no arquivo → **Extrair tudo...** → **Extrair**.
   - **macOS:** dê um clique duplo no arquivo.
   - **Linux:** botão direito → **Extrair aqui** (ou, no terminal: `unzip bertol-compilador-vm-main.zip`).
5. Abra a pasta extraída. Você deve ver as pastas `Analisador Léxico`, `Analisador Sintático`, `Analisador Semântico` e `Berti VM`.

**Opção B – Clonar com Git (para quem já usa Git)**

1. Instale o Git, se ainda não tiver:
   - **Windows:** baixe em `git-scm.com/download/win`, execute o instalador e aceite as opções padrão.
   - **macOS:** no Terminal, rode `xcode-select --install` (ou instale em `git-scm.com`).
   - **Linux (Debian/Ubuntu):** `sudo apt install git`.
2. Abra o terminal (Prompt de Comando/PowerShell no Windows, Terminal no macOS/Linux) na pasta onde quer guardar o projeto.
3. Rode:

   ```bash
   git clone https://github.com/phoberti/bertol-compilador-vm.git
   cd bertol-compilador-vm
   ```

#### 0.3 Conferir o conteúdo

Dentro da pasta do projeto, confirme que existem estes arquivos (cada ferramenta precisa dos **três** arquivos na mesma pasta):

```
Analisador Semântico/Implementação/  →  index.html, script.js, style.css
Berti VM/                            →  index.html, script.js, style.css
```

> **Importante:** não mova o `index.html` para outra pasta sem levar o `script.js` e o `style.css` junto, senão a página abre sem estilo e sem funcionar.

### Como abrir cada ferramenta no navegador

Escolha qualquer um dos métodos abaixo. Todos funcionam offline (a única coisa que depende da internet é a fonte decorativa JetBrains Mono, e sem ela o navegador usa outra).

**Método 1 – Duplo clique (recomendado)**

1. Entre na pasta da ferramenta (por exemplo, `Berti VM`).
2. Dê um **clique duplo** em `index.html`. Ele abre no navegador padrão.
3. Se abrir em um programa errado (editor de texto, por exemplo): clique com o botão direito em `index.html` → **Abrir com** → escolha seu navegador.

**Método 2 – Arrastar para o navegador**

1. Abra o navegador.
2. Arraste o arquivo `index.html` da pasta para a janela do navegador.

**Método 3 – Pelo endereço**

1. No navegador, pressione `Ctrl+O` (Windows/Linux) ou `Cmd+O` (macOS).
2. Selecione o `index.html` desejado.

Dica: guarde as duas ferramentas em **abas separadas** (compilador e Berti VM), pois você vai copiar o TAC de uma para a outra.

**Caminhos de cada ferramenta**

| Ferramenta | Arquivo |
|---|---|
| Compilador completo | `Analisador Semântico/Implementação/index.html` |
| Analisador Sintático (SLR e LL(1)) | `Analisador Sintático/Implementação/index.html` |
| Analisador Léxico | `Analisador Léxico/Implementação/index.html` |
| Berti VM | `Berti VM/index.html` |

**Alternativa opcional: servidor local sem VS Code**

Normalmente não é necessária. Se o seu navegador ou o seu sistema bloquear a abertura direta de arquivos, e você tiver o Python instalado, rode na pasta do projeto:

```bash
python -m http.server 8000
```

(em alguns sistemas, `python3`) e acesse `http://localhost:8000/Berti%20VM/` ou `http://localhost:8000/Analisador%20Sem%C3%A2ntico/Implementa%C3%A7%C3%A3o/`. Para encerrar, volte ao terminal e pressione `Ctrl+C`.

### Parte 1 – Compilar um programa Bertol

1. **Abra o compilador.** Abra o arquivo `Analisador Semântico/Implementação/index.html` com um clique duplo (ou arraste-o para uma janela do navegador). Não é preciso servidor, Live Server nem instalação.
2. **Informe o programa.** Há duas formas:
   - digitar ou colar o código Bertol no editor; ou
   - usar o botão de carregar arquivo e escolher um `.bertol` das pastas `Exemplos` (por exemplo, `sucesso1.bertol`).
3. **Escolha a análise** nos menus da barra superior: **Análise Léxica**, **Análise Sintática** ou **Análise Semântica**. Cada menu oferece as variações disponíveis:
   - modo **normal** (a análise para ao encontrar o problema) ou **com recuperação de erros** (registra o erro, se ressincroniza e continua);
   - método sintático **SLR** ou **LL(1)**.
   
   A Análise Semântica executa o *pipeline* inteiro (léxica, sintática e semântica) e, se não houver erros que impeçam o prosseguimento, gera o TAC.
4. **Observe os resultados** nas abas que aparecem abaixo do editor:

   | Aba | O que mostra |
   |---|---|
   | Tokens | Cada *token* reconhecido, com lexema, linha e coluna |
   | Sintático | Trajetória passo a passo do analisador escolhido (SLR ou LL(1)) |
   | Semântico | Trajetória da verificação das regras semânticas |
   | Símbolos | Tabela de símbolos (nome, tipo, inicialização) |
   | TAC | Código de Três Endereços gerado |
   | Erros | Lista de erros léxicos, sintáticos e semânticos, com linha e coluna |

5. **Corrija e repita.** Se houver erros, edite o código e execute novamente. O botão **Limpar** zera o editor e todas as abas.
6. **Copie o TAC.** Na aba **TAC**, selecione todo o código gerado e copie (`Ctrl+C`).

### Parte 2 – Executar o TAC na Berti VM

1. **Abra a VM.** Abra o arquivo `Berti VM/index.html` em outra aba do navegador. O indicador no canto superior direito mostra **ociosa**.
2. **Cole o TAC** no painel **1. Entrada TAC**. Para só experimentar, use um dos exemplos: **Exemplo Bertol** ou **Exemplo vetor / ponteiro / função**.
3. **Clique em ▶ Carregar programa.** As instruções aparecem numeradas no painel **2. Execução** e o indicador muda para **pronta**. Erros de formato são avisados aqui.
4. **Execute** escolhendo um dos modos:

   | Modo | Como usar | Quando é útil |
   |---|---|---|
   | **Step ▸** | Cada clique executa uma instrução | Acompanhar a lógica linha a linha |
   | **Run ▸▸** | Executa continuamente; ajuste a velocidade com o controle deslizante e use **Pausar** para parar | Ver o programa andando |
   | **⚡ Instantâneo** | Executa tudo de uma vez | Ver apenas o resultado final |

5. **Responda às leituras.** Quando o programa executa um `read`, a VM pausa e pede o valor no painel **4. Saída**. Digite o valor e clique em **Enviar** (ou pressione `Enter`); a execução continua no mesmo modo.
6. **Acompanhe o estado.** Enquanto executa:
   - o painel **2. Execução** destaca a instrução corrente e mostra o `PC`;
   - o painel **3. Memória** mostra variáveis (nome, valor e tipo), a memória indexada e a pilha de chamadas e parâmetros;
   - o painel **4. Saída** mostra o que o programa imprime. Ao terminar, aparece `— fim do programa —` e o estado muda para **finalizada**.
7. **Repita ou recomece.** **↺ Reiniciar** volta ao início mantendo o programa carregado. Para outro programa, cole o novo TAC e clique em **Carregar programa** de novo.
8. **Precisa de ajuda?** O botão **!** no cabeçalho abre um guia rápido dentro da própria VM.

### Exemplo guiado (2 minutos)

1. No compilador, carregue `Analisador Semântico/Exemplos/sucesso1.bertol` e rode a **Análise Semântica**.
2. Abra a aba **TAC** e copie o código.
3. Na Berti VM, cole no painel **1. Entrada TAC** e clique em **Carregar programa**.
4. Clique em **Step ▸** algumas vezes para ver as variáveis mudarem e, depois, em **Run ▸▸** para terminar. Se houver `read`, digite os valores pedidos.

### Problemas comuns

| Sintoma | Causa provável e solução |
|---|---|
| A aba **TAC** não aparece | A análise não foi a semântica, ou há erros que bloqueiam a geração. Veja a aba **Erros** |
| A VM diz `instrução não reconhecida` | O texto colado não está em um dos formatos de TAC aceitos. Cole o TAC exatamente como foi gerado |
| A VM diz `rótulo indefinido` | Há um `goto`/`if` para um rótulo que não existe no trecho colado. Copie o TAC completo, inclusive a última linha |
| A VM para com `limite de 200000 instruções excedido` | O programa provavelmente tem um laço infinito (por exemplo, uma condição que nunca muda) |
| A fonte do texto parece diferente | A fonte JetBrains Mono vem da internet; sem conexão, o navegador usa outra e tudo continua funcionando |

---

## A linguagem Bertol

### Tipos

`INTEIRO`, `DECIMAL`, `TEXTO`, `LOGICO` (valores `VERDADEIRO` e `FALSO`).

### Comandos

| Comando | Sintaxe |
|---|---|
| Declaração | `nome[TIPO]#` ou `nome[TIPO] VALE valor#` |
| Atribuição | `nome VALE expressao#` |
| Entrada | `RECEBE[nome]#` |
| Saída | `MOSTRA[item1, item2, ...]#` (cada item é um texto entre aspas ou um identificador) |
| Condicional | `SE(condicao) { ... }` ou `SE(condicao) { ... } SENAO { ... }` |
| Repetição | `ENQUANTO(condicao) { ... }` |
| Repetição contada | `PARA i DE inicio ATE fim PASSO p { ... }` |
| Interrupção de laço | `PARE#` |
| Comentário | `@@ texto até o fim da linha` |

O delimitador de fim de instrução é o `#`. A variável de controle do `PARA` precisa estar declarada antes do laço.

### Operadores

| Categoria | Operadores |
|---|---|
| Aritméticos | `ADD` `SUB` `MULT` `DIV` `RESTO` |
| Relacionais | `MAIOR` `MENOR` `MAG` (≥) `MEG` (≤) `IGUAL` `DIFERENTE` |
| Lógicos | `$$` (e) `??` (ou) `XX` (não) |

### Exemplo

```text
n[INTEIRO]#
MOSTRA["Digite um numero: "]#
RECEBE[n]#
ENQUANTO(n MAIOR 0) {
    MOSTRA[n]#
    n VALE n SUB 1#
}
MOSTRA["Fim!"]#
```

---

## Exemplo completo: do Bertol à execução

**1. Programa em Bertol**

```text
a[INTEIRO]#
b[INTEIRO]#
soma[INTEIRO]#
MOSTRA["Digite o primeiro numero: "]#
RECEBE[a]#
MOSTRA["Digite o segundo numero: "]#
RECEBE[b]#
soma VALE a ADD b#
MOSTRA["Soma: ", soma]#
```

**2. TAC gerado pelo compilador**

```text
print "Digite o primeiro numero: "
read a
print "Digite o segundo numero: "
read b
t1 = a + b
soma = t1
print "Soma: "
print soma
```

**3. Execução na Berti VM** (entradas `3` e `4`)

```text
Digite o primeiro numero:
read a = 3
Digite o segundo numero:
read b = 4
Soma:
7
— fim do programa —
```

Um exemplo com condicional e laço, em que se vê o padrão de tradução dos desvios:

```text
limite[INTEIRO] VALE 0#
contador[INTEIRO]#
MOSTRA["Informe um valor: "]#
RECEBE[limite]#
SE(limite MAIOR 0) {
    PARA contador DE 0 ATE limite PASSO 1 {
        MOSTRA[contador]#
    }
}
SENAO {
    MOSTRA["O limite deve ser maior que 0."]#
}
```

<details>
<summary>TAC gerado (19 instruções)</summary>

```text
limite = 0
print "Informe um valor: "
read limite
if limite > 0 goto L1
t1 = 0
goto L2
L1:
t1 = 1
L2:
if t1 == 1 goto L3
goto L4
L3:
contador = 0
L6:
t2 = contador <= limite
if t2 == 1 goto L7
goto L8
L7:
print contador
t3 = contador + 1
contador = t3
goto L6
L8:
goto L5
L4:
print "O limite deve ser maior que 0."
L5:
```

Com a entrada `3`, a saída é `0 1 2 3`; com `0` ou `-1`, é a mensagem do `SENAO`.

</details>

---

## O compilador

```
Código-fonte Bertol
        │
        ▼
 ┌──────────────────┐
 │ Análise léxica   │  AFD com 22 estados
 └────────┬─────────┘
          ▼
 ┌──────────────────┐
 │ Análise sintática│  SLR (107 estados) ou LL(1)
 └────────┬─────────┘
          ▼
 ┌──────────────────┐
 │ Análise semântica│  22 regras (RS-01 a RS-22) + tabela de símbolos
 └────────┬─────────┘
          ▼
 ┌──────────────────┐
 │ Geração de TAC   │  Código de Três Endereços
 └────────┬─────────┘
          ▼
      Berti VM
```

### Recuperação de erros

Cada fase de análise pode operar com ou sem recuperação:

- **Léxica:** ao detectar um caractere inválido ou um texto sem aspas de fechamento, registra o erro com linha e coluna, descarta o trecho e volta ao estado inicial.
- **Sintática:** o analisador registra o erro, descarta tokens até encontrar um ponto de sincronização e continua. Há um limite de 10 erros por análise.
- **Semântica:** aplica ações paliativas por tipo de erro (por exemplo, uma variável não declarada é registrada como se fosse `INTEIRO` para que a análise prossiga).

### Tradução para TAC

Cada comparação usada como condição vira um padrão de seis instruções que grava 0 ou 1 em um temporário, e o laço `PARA` calcula a condição diretamente. As expressões são decompostas respeitando a precedência (`??` < `$$` < relacionais < `ADD`/`SUB` < `MULT`/`DIV`/`RESTO`).

---

## A Berti VM

### Interface

| Painel | Conteúdo |
|---|---|
| **1. Entrada TAC** | Campo de texto do programa e botões *Carregar programa*, *Exemplo Bertol* e *Exemplo vetor / ponteiro / função*. |
| **2. Execução** | Lista numerada das instruções, destaque da instrução corrente, indicador do PC e botões de controle. |
| **3. Memória** | Variáveis (nome, valor e tipo), memória indexada, pilha de chamadas e parâmetros pendentes. |
| **4. Saída** | Linhas escritas por `print`, mensagens de `read`, de chamada/retorno de função e de erro, e o campo de entrada de valores. |

### Controles

| Botão | Efeito |
|---|---|
| **Step** | Executa uma instrução e pausa. |
| **Run** | Executa continuamente. A velocidade é ajustável pelo controle deslizante. |
| **Instantâneo** | Executa o programa inteiro de uma só vez. |
| **Pausar** | Interrompe o modo *Run*. |
| **Reiniciar** | Volta ao início, mantendo o programa carregado. |

O comando `read` pausa a execução e pede o valor no painel de saída, e a execução continua no mesmo modo depois que o valor é enviado.

### Instruções aceitas

| Categoria | Formatos |
|---|---|
| Atribuição | `x = y` · `x = y op z` · `x = -y` · `x = not y` · `x = (float) y` · `x = conv(y)` |
| Vetores | `x = a[i]` · `a[i] = y` |
| Ponteiros | `p = &x` · `x = *p` · `*p = y` |
| Desvios | `goto L` · `if y op z goto L` · `if y goto L` · `ifFalse y op z goto L` · `ifFalse y goto L` |
| Entrada e saída | `read x` · `print y` · `print "texto"` |
| Funções | `param y` · `call f, n` · `x = call f, n` · `return` · `return y` |
| Rótulos | `L1:` (linha própria) |

Operadores: `+ - * / %`, `> < >= <= == !=`, `and`/`&&`, `or`/`||`.

### Modelo de dados e de memória

- Tipos internos: **inteiro**, **decimal**, **logico**, **texto**, **caractere** e **ponteiro**. A VM é dinamicamente tipada: o tipo de uma variável é o tipo do último valor que ela recebeu.
- Vetores e variáveis cujo endereço foi tomado ficam na **memória indexada**. Os endereços são alocados a partir de `@1000`, e cada vetor ou variável endereçável reserva um bloco de 100000 endereços (o primeiro vetor começa em `@1000`, o seguinte em `@101000`).
- O nome de um vetor usado sozinho vale o seu endereço-base, o que permite aritmética de ponteiros.

### Funções

Uma função é um trecho iniciado por rótulo e terminado em `return`. Por convenção da VM, todas as variáveis são **globais e compartilhadas**: os valores empilhados por `param` são retirados na chamada, e a função acessa os dados pelos nomes das variáveis do código principal. O código principal deve desviar do corpo da função com `goto`, como no exemplo:

```text
a = 4
b = 5
param a
param b
r = call soma, 2
print r
goto Lfim
soma:
s = a + b
return s
Lfim:
```

### Erros de execução

| Situação | Mensagem |
|---|---|
| Desvio para rótulo inexistente | `rótulo indefinido: L` |
| Chamada de função inexistente | `função/rótulo indefinido: f` |
| Linha que não corresponde a nenhum formato | `instrução não reconhecida: <linha>` |
| Mais de 200000 instruções executadas | `limite de 200000 instruções excedido (possível laço infinito)` |

---

## Testes e validação

A validação foi manual, no navegador, com saídas esperadas definidas antes de cada execução.

| Conjunto | Quantidade | Resultado |
|---|---|---|
| Programas Bertol válidos nas quatro fases do compilador | 14 | Aceitos em todas as fases |
| Programas Bertol com erros intencionais (léxicos, sintáticos e semânticos) | 11 | Erro detectado na fase esperada |
| Programas Bertol (1 a 10) executados na Berti VM, com diferentes entradas | 41 execuções | Saída conforme a esperada |
| Programas em TAC com vetores, ponteiros e funções | 5 | Saída conforme a esperada |
| Execuções nos três modos da VM (*Step*, *Run*, *Instantâneo*) | 138 | Mesma saída nos três modos, sem erros |

Os programas de teste estão nas pastas `Exemplos` de cada analisador e no arquivo [`exemplos_c_bertol.md`](exemplos_c_bertol.md), que traz os programas em Bertol com o código C equivalente.

---

## Estrutura do repositório

```
bertol-compilador-vm/
├── Analisador Léxico/
│   ├── Documentação/        # AFD (imagem), especificação, tokens, recuperação de erros
│   ├── Exemplos/            # sucesso1-3 e erro1-3 (.bertol)
│   └── Implementação/       # index.html, script.js, style.css
├── Analisador Sintático/
│   ├── Documentação/
│   │   ├── LL(1)/           # gramática, FIRST/FOLLOW e tabela LL(1)
│   │   └── SLR/             # gramática aumentada, FIRST/FOLLOW e tabela SLR
│   ├── Exemplos/            # sint_sucesso1-3 e sint_erro1-3 (.bertol)
│   └── Implementação/
├── Analisador Semântico/
│   ├── Documentação/        # especificação semântica, ações, tabela de símbolos
│   ├── Exemplos/            # sucesso1-5, erro1-5 e teste01-10 (.bertol)
│   └── Implementação/       # compilador completo, até a geração de TAC
├── Berti VM/                # index.html, script.js, style.css
├── Recuperação de Erros - Resumo.txt
├── estrutura.txt
├── exemplos_c_bertol.md
├── Monografia.pdf
├── LICENSE
└── README.md
```

---

## Como citar

> BERTI, Pedro Henrique de Oliveira. **Da Gramática à Execução: Projeto e Implementação de uma Linguagem de Programação, Compilador e Máquina Virtual com Fins Didáticos**. 2026. Trabalho de Conclusão de Curso (Bacharelado em Ciência da Computação) – Universidade Estadual do Oeste do Paraná, Cascavel, 2026. Orientador: Guilherme Galante.

---

## Licença

Distribuído sob a licença **MIT**. Veja o arquivo [`LICENSE`](LICENSE) para mais detalhes.

---

<div align="center">

Desenvolvido por **Pedro Henrique de Oliveira Berti** · UNIOESTE, Cascavel · Orientação do Prof. Guilherme Galante

</div>
