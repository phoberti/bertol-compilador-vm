// ============================================================
// ANALISADOR LÉXICO — LINGUAGEM BERTOL
// Autômato Finito Determinístico (AFD)
// ============================================================

// Nomes descritivos dos estados para exibição na trajetória
const NOME_ESTADO = {
    1:  'q1 (Inicial)',
    2:  'q2 (ID/Palavra)',
    4:  'q4 (Inteiro)',
    5:  'q5 (Após ponto)',
    6:  'q6 (Decimal)',
    7:  'q7 (Decimal)',
    8:  'q8 (String)',
    10: 'q10 (String OK)',
    11: 'q11 (1º @)',
    12: 'q12 (Comentário)',
    13: 'q13 (Coment. OK)',
    16: 'q16 (1º ?)',
    17: 'q17 (1º $)',
    18: 'q18 (# OK)',
    20: 'q20 (?? OK)',
    21: 'q21 ($$ OK)',
    22: 'q22 (Delim. OK)',
    'ERRO': 'ERRO',
};

function nomeEstado(e) {
    return NOME_ESTADO[e] || `q${e}`;
}

// ------------------------------------------------------------
function getTabelaSimbolos() {
    return [
        { type: "RECEBE",      categoria: "E/S"       },
        { type: "MOSTRA",      categoria: "E/S"       },
        { type: "INTEIRO",     categoria: "TIPO"      },
        { type: "DECIMAL",     categoria: "TIPO"      },
        { type: "TEXTO",       categoria: "TIPO"      },
        { type: "LOGICO",      categoria: "TIPO"      },
        { type: "MENOR",       categoria: "REL"       },
        { type: "MAIOR",       categoria: "REL"       },
        { type: "IGUAL",       categoria: "REL"       },
        { type: "MAG",         categoria: "REL"       },
        { type: "MEG",         categoria: "REL"       },
        { type: "DIFERENTE",   categoria: "REL"       },
        { type: "ADD",         categoria: "ARIT"      },
        { type: "SUB",         categoria: "ARIT"      },
        { type: "DIV",         categoria: "ARIT"      },
        { type: "MULT",        categoria: "ARIT"      },
        { type: "RESTO",       categoria: "ARIT"      },
        { type: "SE",          categoria: "CONTROLE"  },
        { type: "SENAO",       categoria: "CONTROLE"  },
        { type: "ENQUANTO",    categoria: "CONTROLE"  },
        { type: "PARA",        categoria: "CONTROLE"  },
        { type: "DE",          categoria: "CONTROLE"  },
        { type: "ATE",         categoria: "CONTROLE"  },
        { type: "PASSO",       categoria: "CONTROLE"  },
        { type: "VALE",        categoria: "ATRIB"     },
        { type: "PARE",        categoria: "CONTROLE"  },
        { type: "VERDADEIRO",  categoria: "BOOL"      },
        { type: "FALSO",       categoria: "BOOL"      },
        { type: "$$",          categoria: "LOG"       },
        { type: "??",          categoria: "LOG"       },
        { type: "XX",          categoria: "LOG"       },
        { type: "(",           categoria: "DELIM"     },
        { type: ")",           categoria: "DELIM"     },
        { type: "[",           categoria: "DELIM"     },
        { type: "]",           categoria: "DELIM"     },
        { type: "{",           categoria: "DELIM"     },
        { type: "}",           categoria: "DELIM"     },
        { type: "#",           categoria: "FIM_INSTR" },
        { type: ",",           categoria: "SEP"       },
    ];
}

// ------------------------------------------------------------
// AFD
// ------------------------------------------------------------
function executarAnalisadorLexicoAFD(codigo_fonte, tabela_simbolos) {
    const MAX_ID_LEN = 12;

    let index = 0, estado = 1, caractere = '';
    let lexema = "", tokens = [], erros = [];
    let linha = 1, coluna = 1;

    // Trajetória do token atual: array de { de, char, para }
    let trajetoriaAtual = [];

    function proximoCaractere() {
        if (index < codigo_fonte.length) {
            caractere = codigo_fonte[index++];
            coluna++;
            if (caractere === '\n') { linha++; coluna = 1; }
            return true;
        }
        return false;
    }

    function registrarTransicao(de, char, para) {
        const exibir = char === '\n' ? '\\n' : char === '\t' ? '\\t' : char;
        trajetoriaAtual.push({ de: nomeEstado(de), char: exibir, para: nomeEstado(para) });
    }

    function registrarErro(msg) {
        erros.push({ msg, linha, coluna });
        trajetoriaAtual = [];
    }

    function emitirToken(lex, lin, col) {
        const tokenObj = obterToken(lex, tabela_simbolos);
        tokens.push({
            ...tokenObj,
            linha: lin,
            coluna: col,
            trajetoria: [...trajetoriaAtual]
        });
        trajetoriaAtual = [];
    }

    let hasChars = proximoCaractere();

    while (hasChars) {
        switch (estado) {

            case 1:
                if (isLetter(caractere)) {
                    registrarTransicao(1, caractere, 2);
                    estado = 2; lexema += caractere; hasChars = proximoCaractere();
                } else if (isDigit(caractere)) {
                    registrarTransicao(1, caractere, 4);
                    estado = 4; lexema += caractere; hasChars = proximoCaractere();
                } else if (isAspas(caractere)) {
                    registrarTransicao(1, caractere, 8);
                    estado = 8; lexema += caractere; hasChars = proximoCaractere();
                } else if (isWhiteSpace(caractere)) {
                    hasChars = proximoCaractere();
                } else if (isComentChar(caractere)) {
                    registrarTransicao(1, caractere, 11);
                    estado = 11; lexema += caractere; hasChars = proximoCaractere();
                } else if (isCharOR(caractere)) {
                    registrarTransicao(1, caractere, 16);
                    estado = 16; lexema += caractere; hasChars = proximoCaractere();
                } else if (isCharAND(caractere)) {
                    registrarTransicao(1, caractere, 17);
                    estado = 17; lexema += caractere; hasChars = proximoCaractere();
                } else if (isDelimitadorFimDeInstrucao(caractere)) {
                    registrarTransicao(1, caractere, 18);
                    estado = 18; lexema = caractere; hasChars = proximoCaractere();
                } else if (isDelimitador(caractere)) {
                    registrarTransicao(1, caractere, 22);
                    estado = 22; lexema = caractere; hasChars = proximoCaractere();
                } else {
                    registrarTransicao(1, caractere, 'ERRO');
                    registrarErro(`Caractere inesperado: '${caractere}'`);
                    hasChars = proximoCaractere();
                }
                break;

            case 2:
                if (isAlphaNum(caractere)) {
                    registrarTransicao(2, caractere, 2);
                    lexema += caractere; hasChars = proximoCaractere();
                } else {
                    if (lexema.length > MAX_ID_LEN) {
                        registrarErro(`Identificador '${lexema}' excede ${MAX_ID_LEN} caracteres. Truncado.`);
                        lexema = lexema.substring(0, MAX_ID_LEN);
                    }
                    emitirToken(lexema, linha, coluna - lexema.length);
                    lexema = ""; estado = 1;
                }
                break;

            case 4:
                if (isDigit(caractere)) {
                    registrarTransicao(4, caractere, 4);
                    lexema += caractere; hasChars = proximoCaractere();
                } else if (isPoint(caractere)) {
                    registrarTransicao(4, caractere, 5);
                    lexema += caractere; hasChars = proximoCaractere(); estado = 5;
                } else {
                    emitirToken(lexema, linha, coluna - lexema.length);
                    lexema = ""; estado = 1;
                }
                break;

            case 5:
                if (isDigit(caractere)) {
                    registrarTransicao(5, caractere, 6);
                    lexema += caractere; hasChars = proximoCaractere(); estado = 6;
                } else {
                    registrarTransicao(5, caractere, 'ERRO');
                    registrarErro(`Número mal formado '${lexema}' — esperado dígito após '.'.`);
                    lexema = ""; estado = 1;
                }
                break;

            case 6:
                if (isDigit(caractere)) {
                    registrarTransicao(6, caractere, 6);
                    lexema += caractere; hasChars = proximoCaractere();
                } else {
                    emitirToken(lexema, linha, coluna - lexema.length);
                    lexema = ""; estado = 1;
                }
                break;

            case 8:
                if (isAspas(caractere)) {
                    registrarTransicao(8, caractere, 10);
                    lexema += caractere; hasChars = proximoCaractere();
                    emitirToken(lexema, linha, coluna - lexema.length);
                    lexema = ""; estado = 1;
                } else if (caractere === '\n') {
                    registrarTransicao(8, '\\n', 'ERRO');
                    registrarErro(`String não fechada '${lexema}' — quebra de linha não permitida.`);
                    lexema = ""; estado = 1; hasChars = proximoCaractere();
                } else {
                    registrarTransicao(8, caractere, 8);
                    lexema += caractere; hasChars = proximoCaractere();
                }
                break;

            case 11:
                if (isComentChar(caractere)) {
                    registrarTransicao(11, caractere, 12);
                    lexema += caractere; estado = 12; hasChars = proximoCaractere();
                } else {
                    registrarTransicao(11, caractere, 'ERRO');
                    registrarErro(`'@' isolado — use '@@' para comentário.`);
                    lexema = ""; estado = 1;
                }
                break;

            case 12:
                if (caractere === '\n') {
                    registrarTransicao(12, '\\n', 13);
                    emitirToken(lexema, linha, coluna - lexema.length);
                    lexema = ""; estado = 1; hasChars = proximoCaractere();
                } else {
                    registrarTransicao(12, caractere, 12);
                    lexema += caractere; hasChars = proximoCaractere();
                }
                break;

            case 16:
                if (isCharOR(caractere)) {
                    registrarTransicao(16, caractere, 20);
                    lexema += caractere;
                    emitirToken(lexema, linha, coluna - lexema.length);
                    lexema = ""; estado = 1; hasChars = proximoCaractere();
                } else {
                    registrarTransicao(16, caractere, 'ERRO');
                    registrarErro(`'?' isolado — use '??' para o operador OR.`);
                    lexema = ""; estado = 1;
                }
                break;

            case 17:
                if (isCharAND(caractere)) {
                    registrarTransicao(17, caractere, 21);
                    lexema += caractere;
                    emitirToken(lexema, linha, coluna - lexema.length);
                    lexema = ""; estado = 1; hasChars = proximoCaractere();
                } else {
                    registrarTransicao(17, caractere, 'ERRO');
                    registrarErro(`'$' isolado — use '$$' para o operador AND.`);
                    lexema = ""; estado = 1;
                }
                break;

            case 18:
                registrarTransicao(18, '#', 18);
                emitirToken(lexema, linha, coluna - lexema.length);
                lexema = ""; estado = 1;
                break;

            case 22:
                registrarTransicao(22, lexema, 22);
                emitirToken(lexema, linha, coluna - lexema.length);
                lexema = ""; estado = 1;
                break;
        }
    }

    if (lexema.length > 0) {
        const msgs = {
            8:  `String não fechada ao fim do arquivo: '${lexema}'`,
            5:  `Número mal formado ao fim do arquivo: '${lexema}'`,
            11: `'@' isolado ao fim do arquivo.`,
            16: `'?' isolado ao fim do arquivo.`,
            17: `'$' isolado ao fim do arquivo.`,
        };
        if (msgs[estado]) registrarErro(msgs[estado]);
        else emitirToken(lexema, linha, coluna);
    }

    return { tokens, erros };
}

// ------------------------------------------------------------
function obterToken(lexema, tabela_simbolos) {
    if (lexema === "VERDADEIRO" || lexema === "FALSO")
        return { token: "BOOLEAN", lexema };
    if (isNumInt(lexema))     return { token: "NUM_INT",    lexema };
    if (isNumReal(lexema))    return { token: "NUM_REAL",   lexema };
    if (isString(lexema))     return { token: "STRING",     lexema };
    if (isComentario(lexema)) return { token: "COMENTARIO", lexema };
    const encontrado = tabela_simbolos.find(t => t.type === lexema);
    if (encontrado) return { token: encontrado.type, lexema };
    return { token: "ID", lexema };
}

// ------------------------------------------------------------
function isLetter(c)                    { return /^[a-zA-Z]$/.test(c);         }
function isAlphaNum(c)                  { return /^[a-zA-Z0-9_]$/.test(c);     }
function isDigit(c)                     { return /^[0-9]$/.test(c);            }
function isNumInt(lex)                  { return /^[0-9]+$/.test(lex);         }
function isNumReal(lex)                 { return /^[0-9]+\.[0-9]+$/.test(lex); }
function isPoint(c)                     { return c === '.';                     }
function isAspas(c)                     { return c === '"';                     }
function isString(lex)                  { return /^"[^"]*"$/.test(lex);        }
function isWhiteSpace(c)                { return /^[ \t\n\r]$/.test(c);        }
function isComentChar(c)                { return c === '@';                     }
function isComentario(lex)              { return lex.startsWith('@@');          }
function isCharOR(c)                    { return c === '?';                     }
function isCharAND(c)                   { return c === '$';                     }
function isDelimitadorFimDeInstrucao(c) { return c === '#';                     }
function isDelimitador(c)               { return /^[()\[\]{},]$/.test(c);      }
