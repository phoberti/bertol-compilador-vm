# 10 programas: C vs. Bertol

---

## 1. Soma de dois números

**C**

```c
#include <stdio.h>
int main() {
    int a, b, soma;
    printf("Digite o primeiro numero: ");
    scanf("%d", &a);
    printf("Digite o segundo numero: ");
    scanf("%d", &b);
    soma = a + b;
    printf("Soma: %d\n", soma);
    return 0;
}
```

**Bertol**

```
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

---

## 2. Par ou ímpar

**C**

```c
#include <stdio.h>
int main() {
    int n, resto;
    printf("Digite um numero: ");
    scanf("%d", &n);
    resto = n % 2;
    if (resto == 0) {
        printf("Par\n");
    } else {
        printf("Impar\n");
    }
    return 0;
}
```

**Bertol**

```
n[INTEIRO]#
resto[INTEIRO]#
MOSTRA["Digite um numero: "]#
RECEBE[n]#
resto VALE n RESTO 2#
SE(resto IGUAL 0) {
    MOSTRA["Par"]#
}
SENAO {
    MOSTRA["Impar"]#
}
```

---

## 3. Maior de dois números

**C**

```c
#include <stdio.h>
int main() {
    int a, b;
    printf("Digite dois numeros: ");
    scanf("%d %d", &a, &b);
    if (a > b) {
        printf("Maior: %d\n", a);
    } else {
        printf("Maior: %d\n", b);
    }
    return 0;
}
```

**Bertol** *(o `scanf` duplo vira dois `RECEBE` separados)*

```
a[INTEIRO]#
b[INTEIRO]#
MOSTRA["Digite o primeiro numero: "]#
RECEBE[a]#
MOSTRA["Digite o segundo numero: "]#
RECEBE[b]#
SE(a MAIOR b) {
    MOSTRA["Maior: ", a]#
}
SENAO {
    MOSTRA["Maior: ", b]#
}
```

---

## 4. Número dentro de um intervalo (operador lógico E)

**C**

```c
#include <stdio.h>
int main() {
    int x, a, b;
    printf("Digite x, limite inferior e limite superior: ");
    scanf("%d %d %d", &x, &a, &b);
    if (x >= a && x <= b) {
        printf("Dentro do intervalo\n");
    } else {
        printf("Fora do intervalo\n");
    }
    return 0;
}
```

**Bertol**

```
x[INTEIRO]#
a[INTEIRO]#
b[INTEIRO]#
MOSTRA["Digite x: "]#
RECEBE[x]#
MOSTRA["Digite o limite inferior: "]#
RECEBE[a]#
MOSTRA["Digite o limite superior: "]#
RECEBE[b]#
SE(x MAG a $$ x MEG b) {
    MOSTRA["Dentro do intervalo"]#
}
SENAO {
    MOSTRA["Fora do intervalo"]#
}
```

---

## 5. Fatorial

**C**

```c
#include <stdio.h>
int main() {
    int n, i, fatorial;
    printf("Digite um numero: ");
    scanf("%d", &n);
    fatorial = 1;
    i = 1;
    while (i <= n) {
        fatorial = fatorial * i;
        i = i + 1;
    }
    printf("Fatorial: %d\n", fatorial);
    return 0;
}
```

**Bertol**

```
n[INTEIRO]#
i[INTEIRO]#
fatorial[INTEIRO] VALE 1#
MOSTRA["Digite um numero: "]#
RECEBE[n]#
i VALE 1#
ENQUANTO(i MEG n) {
    fatorial VALE fatorial MULT i#
    i VALE i ADD 1#
}
MOSTRA["Fatorial: ", fatorial]#
```

---

## 6. Fibonacci até N termos

**C**

```c
#include <stdio.h>
int main() {
    int n, i, a, b, prox;
    printf("Quantos termos: ");
    scanf("%d", &n);
    a = 0;
    b = 1;
    i = 1;
    while (i <= n) {
        printf("%d\n", a);
        prox = a + b;
        a = b;
        b = prox;
        i = i + 1;
    }
    return 0;
}
```

**Bertol**

```
n[INTEIRO]#
i[INTEIRO]#
a[INTEIRO] VALE 0#
b[INTEIRO] VALE 1#
prox[INTEIRO]#
MOSTRA["Quantos termos: "]#
RECEBE[n]#
i VALE 1#
ENQUANTO(i MEG n) {
    MOSTRA[a]#
    prox VALE a ADD b#
    a VALE b#
    b VALE prox#
    i VALE i ADD 1#
}
```

---

## 7. Contagem regressiva

**C**

```c
#include <stdio.h>
int main() {
    int n;
    printf("Digite um numero: ");
    scanf("%d", &n);
    while (n > 0) {
        printf("%d\n", n);
        n = n - 1;
    }
    printf("Fim!\n");
    return 0;
}
```

**Bertol**

```
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

## 8. Número primo (com interrupção antecipada do laço)

**C**

```c
#include <stdio.h>
int main() {
    int n, i, resto, primo;
    printf("Digite um numero: ");
    scanf("%d", &n);
    primo = 1;
    i = 2;
    while (i < n) {
        resto = n % i;
        if (resto == 0) {
            primo = 0;
            break;
        }
        i = i + 1;
    }
    if (n < 2) {
        primo = 0;
    }
    if (primo) {
        printf("Primo\n");
    } else {
        printf("Nao primo\n");
    }
    return 0;
}
```

**Bertol** *(`break` do C vira `PARE` do Bertol)*

```
n[INTEIRO]#
i[INTEIRO]#
resto[INTEIRO]#
primo[LOGICO] VALE VERDADEIRO#
MOSTRA["Digite um numero: "]#
RECEBE[n]#
i VALE 2#
ENQUANTO(i MENOR n) {
    resto VALE n RESTO i#
    SE(resto IGUAL 0) {
        primo VALE FALSO#
        PARE#
    }
    i VALE i ADD 1#
}
SE(n MENOR 2) {
    primo VALE FALSO#
}
SE(primo) {
    MOSTRA["Primo"]#
}
SENAO {
    MOSTRA["Nao primo"]#
}
```

---

## 9. Soma dos dígitos de um número

**C**

```c
#include <stdio.h>
int main() {
    int n, digito, soma;
    printf("Digite um numero: ");
    scanf("%d", &n);
    soma = 0;
    while (n > 0) {
        digito = n % 10;
        soma = soma + digito;
        n = n / 10;
    }
    printf("Soma dos digitos: %d\n", soma);
    return 0;
}
```

**Bertol**

```
n[INTEIRO]#
digito[INTEIRO]#
soma[INTEIRO] VALE 0#
MOSTRA["Digite um numero: "]#
RECEBE[n]#
ENQUANTO(n MAIOR 0) {
    digito VALE n RESTO 10#
    soma VALE soma ADD digito#
    n VALE n DIV 10#
}
MOSTRA["Soma dos digitos: ", soma]#
```

---

## 10. Tabuada de multiplicação

**C**

```c
#include <stdio.h>
int main() {
    int n, i, resultado;
    printf("Digite um numero: ");
    scanf("%d", &n);
    for (i = 1; i <= 10; i = i + 1) {
        resultado = n * i;
        printf("%d\n", resultado);
    }
    return 0;
}
```

**Bertol**

```
n[INTEIRO]#
i[INTEIRO]#
resultado[INTEIRO]#
MOSTRA["Digite um numero: "]#
RECEBE[n]#
PARA i DE 1 ATE 10 PASSO 1 {
    resultado VALE n MULT i#
    MOSTRA[resultado]#
}
```

---

## Entradas de teste e saída esperada

valores para conferir rapidamente se C, Bertol→TAC e Berti VM concordam

| #  | Programa            | Entrada              | Saída esperada                                |
| -- | ------------------- | -------------------- | ---------------------------------------------- |
| 1  | Soma                | `3`, `4`         | `Soma: 7`                                    |
| 2  | Par/ímpar          | `7`                | `Impar`                                      |
| 3  | Maior de dois       | `10`, `4`        | `Maior: 10`                                  |
| 4  | Intervalo           | `5`, `1`, `10` | `Dentro do intervalo`                        |
| 5  | Fatorial            | `5`                | `Fatorial: 120`                              |
| 6  | Fibonacci           | `6`                | `0 1 1 2 3 5` (um por linha)                 |
| 7  | Contagem regressiva | `3`                | `3 2 1 Fim!`                                 |
| 8  | Primo               | `7`                | `Primo`                                      |
| 9  | Soma dos dígitos   | `238`              | `Soma dos digitos: 13`                       |
| 10 | Tabuada             | `4`                | `4 8 12 16 20 24 28 32 36 40` (um por linha) |
