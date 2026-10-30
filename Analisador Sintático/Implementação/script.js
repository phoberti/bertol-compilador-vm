// ============================================================
// SCRIPT.JS — LINGUAGEM BERTOL
// Organização:
//   1. ANALISADOR LÉXICO (AFD)
//   2. ANALISADOR SINTÁTICO SLR
//   3. ANALISADOR SINTÁTICO LL(1)
//   4. INTERFACE (render, eventos, navegação)
// ============================================================


// ============================================================
//  1 — ANALISADOR LÉXICO (AFD)
// ============================================================

const NOME_ESTADO = {
    1:'q1 (Inicial)', 2:'q2 (ID/Palavra)', 4:'q4 (Inteiro)',
    5:'q5 (Após ponto)', 6:'q6 (Decimal)', 8:'q8 (String)',
    10:'q10 (String OK)', 11:'q11 (1º @)', 12:'q12 (Comentário)',
    13:'q13 (Coment. OK)', 16:'q16 (1º ?)', 17:'q17 (1º $)',
    18:'q18 (# OK)', 20:'q20 (?? OK)', 21:'q21 ($$ OK)',
    22:'q22 (Delim. OK)', 'ERRO':'ERRO',
};
function nomeEstado(e) { return NOME_ESTADO[e] || `q${e}`; }

function getTabelaSimbolos() {
    return [
        { type:"RECEBE",     categoria:"E/S"       }, { type:"MOSTRA",     categoria:"E/S"       },
        { type:"INTEIRO",    categoria:"TIPO"      }, { type:"DECIMAL",    categoria:"TIPO"      },
        { type:"TEXTO",      categoria:"TIPO"      }, { type:"LOGICO",     categoria:"TIPO"      },
        { type:"MENOR",      categoria:"REL"       }, { type:"MAIOR",      categoria:"REL"       },
        { type:"IGUAL",      categoria:"REL"       }, { type:"MAG",        categoria:"REL"       },
        { type:"MEG",        categoria:"REL"       }, { type:"DIFERENTE",  categoria:"REL"       },
        { type:"ADD",        categoria:"ARIT"      }, { type:"SUB",        categoria:"ARIT"      },
        { type:"DIV",        categoria:"ARIT"      }, { type:"MULT",       categoria:"ARIT"      },
        { type:"RESTO",      categoria:"ARIT"      }, { type:"SE",         categoria:"CONTROLE"  },
        { type:"SENAO",      categoria:"CONTROLE"  }, { type:"ENQUANTO",   categoria:"CONTROLE"  },
        { type:"PARA",       categoria:"CONTROLE"  }, { type:"DE",         categoria:"CONTROLE"  },
        { type:"ATE",        categoria:"CONTROLE"  }, { type:"PASSO",      categoria:"CONTROLE"  },
        { type:"VALE",       categoria:"ATRIB"     }, { type:"PARE",       categoria:"CONTROLE"  },
        { type:"VERDADEIRO", categoria:"BOOL"      }, { type:"FALSO",      categoria:"BOOL"      },
        { type:"$$",         categoria:"LOG"       }, { type:"??",         categoria:"LOG"       },
        { type:"XX",         categoria:"LOG"       }, { type:"(",          categoria:"DELIM"     },
        { type:")",          categoria:"DELIM"     }, { type:"[",          categoria:"DELIM"     },
        { type:"]",          categoria:"DELIM"     }, { type:"{",          categoria:"DELIM"     },
        { type:"}",          categoria:"DELIM"     }, { type:"#",          categoria:"FIM_INSTR" },
        { type:",",          categoria:"SEP"       },
    ];
}

function executarAnalisadorLexicoAFD(codigo_fonte, tabela_simbolos, recuperacao=true) {
    const MAX_ID_LEN = 12;
    let index=0, estado=1, caractere='', lexema="", tokens=[], erros=[];
    let linha=1, coluna=1, trajetoriaAtual=[];

    function proximoCaractere() {
        if (index < codigo_fonte.length) {
            caractere = codigo_fonte[index++]; coluna++;
            if (caractere==='\n') { linha++; coluna=1; }
            return true;
        }
        return false;
    }
    function registrarTransicao(de, char, para) {
        const ex = char==='\n'?'\\n':char==='\t'?'\\t':char;
        trajetoriaAtual.push({ de:nomeEstado(de), char:ex, para:nomeEstado(para) });
    }
    function registrarErro(msg) { erros.push({msg,linha,coluna}); trajetoriaAtual=[]; }
    function emitirToken(lex,lin,col) {
        tokens.push({...obterToken(lex,tabela_simbolos), linha:lin, coluna:col, trajetoria:[...trajetoriaAtual]});
        trajetoriaAtual=[];
    }

    let hasChars = proximoCaractere();
    while (hasChars) {
        switch(estado) {
            case 1:
                if      (isLetter(caractere))                { registrarTransicao(1,caractere,2);    estado=2;  lexema+=caractere; hasChars=proximoCaractere(); }
                else if (isDigit(caractere))                 { registrarTransicao(1,caractere,4);    estado=4;  lexema+=caractere; hasChars=proximoCaractere(); }
                else if (isAspas(caractere))                 { registrarTransicao(1,caractere,8);    estado=8;  lexema+=caractere; hasChars=proximoCaractere(); }
                else if (isWhiteSpace(caractere))            { hasChars=proximoCaractere(); }
                else if (isComentChar(caractere))            { registrarTransicao(1,caractere,11);   estado=11; lexema+=caractere; hasChars=proximoCaractere(); }
                else if (isCharOR(caractere))                { registrarTransicao(1,caractere,16);   estado=16; lexema+=caractere; hasChars=proximoCaractere(); }
                else if (isCharAND(caractere))               { registrarTransicao(1,caractere,17);   estado=17; lexema+=caractere; hasChars=proximoCaractere(); }
                else if (isDelimitadorFimDeInstrucao(caractere)) { registrarTransicao(1,caractere,18); estado=18; lexema=caractere;  hasChars=proximoCaractere(); }
                else if (isDelimitador(caractere))           { registrarTransicao(1,caractere,22);   estado=22; lexema=caractere;  hasChars=proximoCaractere(); }
                else { registrarTransicao(1,caractere,'ERRO'); registrarErro(`Caractere inesperado: '${caractere}'`); if(!recuperacao) return {tokens, erros}; hasChars=proximoCaractere(); }
                break;
            case 2:
                if (isAlphaNum(caractere)) { registrarTransicao(2,caractere,2); lexema+=caractere; hasChars=proximoCaractere(); }
                else {
                    if (lexema.length>MAX_ID_LEN) { registrarErro(`Identificador '${lexema}' excede ${MAX_ID_LEN} caracteres. Truncado.`); lexema=lexema.substring(0,MAX_ID_LEN); }
                    emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1;
                }
                break;
            case 4:
                if      (isDigit(caractere)) { registrarTransicao(4,caractere,4); lexema+=caractere; hasChars=proximoCaractere(); }
                else if (isPoint(caractere)) { registrarTransicao(4,caractere,5); lexema+=caractere; hasChars=proximoCaractere(); estado=5; }
                else { emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1; }
                break;
            case 5:
                if (isDigit(caractere)) { registrarTransicao(5,caractere,6); lexema+=caractere; hasChars=proximoCaractere(); estado=6; }
                else { registrarTransicao(5,caractere,'ERRO'); registrarErro(`Número mal formado '${lexema}' — esperado dígito após '.'.`); lexema=""; estado=1; if(!recuperacao) return {tokens, erros}; }
                break;
            case 6:
                if (isDigit(caractere)) { registrarTransicao(6,caractere,6); lexema+=caractere; hasChars=proximoCaractere(); }
                else { emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1; }
                break;
            case 8:
                if      (isAspas(caractere))  { registrarTransicao(8,caractere,10); lexema+=caractere; hasChars=proximoCaractere(); emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1; }
                else if (caractere==='\n')     { registrarTransicao(8,'\\n','ERRO'); registrarErro(`String não fechada '${lexema}' — quebra de linha não permitida.`); lexema=""; estado=1; if(!recuperacao) return {tokens, erros}; hasChars=proximoCaractere(); }
                else                           { registrarTransicao(8,caractere,8); lexema+=caractere; hasChars=proximoCaractere(); }
                break;
            case 11:
                if (isComentChar(caractere)) { registrarTransicao(11,caractere,12); lexema+=caractere; estado=12; hasChars=proximoCaractere(); }
                else { registrarTransicao(11,caractere,'ERRO'); registrarErro(`'@' isolado — use '@@' para comentário.`); lexema=""; estado=1; if(!recuperacao) return {tokens, erros}; }
                break;
            case 12:
                if (caractere==='\n') { registrarTransicao(12,'\\n',13); emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1; hasChars=proximoCaractere(); }
                else { registrarTransicao(12,caractere,12); lexema+=caractere; hasChars=proximoCaractere(); }
                break;
            case 16:
                if (isCharOR(caractere)) { registrarTransicao(16,caractere,20); lexema+=caractere; emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1; hasChars=proximoCaractere(); }
                else { registrarTransicao(16,caractere,'ERRO'); registrarErro(`'?' isolado — use '??' para OR.`); lexema=""; estado=1; if(!recuperacao) return {tokens, erros}; }
                break;
            case 17:
                if (isCharAND(caractere)) { registrarTransicao(17,caractere,21); lexema+=caractere; emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1; hasChars=proximoCaractere(); }
                else { registrarTransicao(17,caractere,'ERRO'); registrarErro(`'$' isolado — use '$$' para AND.`); lexema=""; estado=1; if(!recuperacao) return {tokens, erros}; }
                break;
            case 18:
                registrarTransicao(18,'#',18); emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1;
                break;
            case 22:
                registrarTransicao(22,lexema,22); emitirToken(lexema,linha,coluna-lexema.length); lexema=""; estado=1;
                break;
        }
    }
    if (lexema.length>0) {
        const msgs={8:`String não fechada: '${lexema}'`,5:`Número mal formado: '${lexema}'`,11:`'@' isolado.`,16:`'?' isolado.`,17:`'$' isolado.`};
        if (msgs[estado]) registrarErro(msgs[estado]);
        else emitirToken(lexema,linha,coluna);
    }
    return { tokens, erros };
}

function obterToken(lexema, tabela_simbolos) {
    if (lexema==="VERDADEIRO"||lexema==="FALSO") return {token:"BOOLEAN",lexema};
    if (isNumInt(lexema))     return {token:"NUM_INT",   lexema};
    if (isNumReal(lexema))    return {token:"NUM_REAL",  lexema};
    if (isString(lexema))     return {token:"STRING",    lexema};
    if (isComentario(lexema)) return {token:"COMENTARIO",lexema};
    const f = tabela_simbolos.find(t=>t.type===lexema);
    return f ? {token:f.type,lexema} : {token:"ID",lexema};
}

function isLetter(c)                    { return /^[a-zA-Z]$/.test(c);         }
function isAlphaNum(c)                  { return /^[a-zA-Z0-9_]$/.test(c);     }
function isDigit(c)                     { return /^[0-9]$/.test(c);            }
function isNumInt(lex)                  { return /^[0-9]+$/.test(lex);         }
function isNumReal(lex)                 { return /^[0-9]+\.[0-9]+$/.test(lex); }
function isPoint(c)                     { return c==='.';                       }
function isAspas(c)                     { return c==='"';                       }
function isString(lex)                  { return /^"[^"]*"$/.test(lex);        }
function isWhiteSpace(c)                { return /^[ \t\n\r]$/.test(c);        }
function isComentChar(c)                { return c==='@';                       }
function isComentario(lex)              { return lex.startsWith('@@');          }
function isCharOR(c)                    { return c==='?';                       }
function isCharAND(c)                   { return c==='$';                       }
function isDelimitadorFimDeInstrucao(c) { return c==='#';                       }
function isDelimitador(c)               { return /^[()\[\]{},]$/.test(c);      }


// ============================================================
//  2 — ANALISADOR SINTÁTICO SLR
// ============================================================

const SLR_PRODUCTIONS = [
    ["S'",1],["lista_comandos",2],["lista_comandos",1],
    ["comando",1],["comando",1],["comando",1],["comando",1],["comando",1],["comando",1],["comando",1],
    ["declaracao",5],["atribuicao",7],["atribuicao",4],
    ["entrada",5],["saida",5],
    ["lista_valores",1],["lista_valores",3],["valor_saida",1],["valor_saida",1],
    ["condicional",8],["opcional_senao",4],["opcional_senao",0],
    ["laco_repeticao",1],["laco_repeticao",1],["laco_enquanto",7],["laco_para",11],
    ["valor_for",1],["valor_for",1],["valor_for",1],["break",2],
    ["valor",1],["valor",1],["valor",1],["valor",1],["valor",1],
    ["tipo",1],["tipo",1],["tipo",1],["tipo",1],
    ["expr",2],["expr_tail",3],["expr_tail",0],
    ["binop",1],["binop",1],["binop",1],["binop",1],["binop",1],["binop",1],
    ["binop",1],["binop",1],["binop",1],["binop",1],["binop",1],["binop",1],["binop",1],
    ["term",2],["term",3],["term",1],
];

const SLR_RHS = [
    ["lista_comandos"],["comando","lista_comandos"],["comando"],
    ["declaracao"],["atribuicao"],["entrada"],["saida"],["condicional"],["laco_repeticao"],["break"],
    ["ID","[","tipo","]","#"],["ID","[","tipo","]","VALE","expr","#"],["ID","VALE","expr","#"],
    ["RECEBE","[","ID","]","#"],["MOSTRA","[","lista_valores","]","#"],
    ["valor_saida"],["valor_saida",",","lista_valores"],["STRING"],["ID"],
    ["SE","(","expr",")","{","lista_comandos","}","opcional_senao"],
    ["SENAO","{","lista_comandos","}"],["ε"],
    ["laco_enquanto"],["laco_para"],
    ["ENQUANTO","(","expr",")","{","lista_comandos","}"],
    ["PARA","ID","DE","valor_for","ATE","expr","PASSO","valor_for","{","lista_comandos","}"],
    ["NUM_INT"],["NUM_REAL"],["ID"],["PARE","#"],
    ["NUM_INT"],["NUM_REAL"],["STRING"],["BOOLEAN"],["ID"],
    ["INTEIRO"],["DECIMAL"],["TEXTO"],["LOGICO"],
    ["term","expr_tail"],["binop","term","expr_tail"],["ε"],
    ["??"],["$$"],["MENOR"],["MAIOR"],["IGUAL"],["MAG"],["MEG"],
    ["DIFERENTE"],["ADD"],["SUB"],["MULT"],["DIV"],["RESTO"],
    ["XX","term"],["(","expr",")"],["valor"],
];

const SLR_ACTION = (() => {
    const T={};
    for(let i=0;i<107;i++) T[i]={};
    const FC=["ID","RECEBE","MOSTRA","SE","ENQUANTO","PARA","PARE","$","}"];
    const FET=["#",")","PASSO"], FEX=["#",")","PASSO"], FOS=["ID","RECEBE","MOSTRA","SE","ENQUANTO","PARA","PARE","$","}"];
    const FB=["??","$$","MENOR","MAIOR","IGUAL","MAG","MEG","DIFERENTE","ADD","SUB","MULT","DIV","RESTO"];
    const FV=[...FB,...FET];
    const FBOP=["XX","(","NUM_INT","NUM_REAL","STRING","BOOLEAN","ID","VERDADEIRO","FALSO"];
    const BS={"??":"S55","$$":"S56","MENOR":"S57","MAIOR":"S58","IGUAL":"S59","MAG":"S60","MEG":"S61","DIFERENTE":"S62","ADD":"S63","SUB":"S64","MULT":"S65","DIV":"S66","RESTO":"S67"};
    const ES={"XX":"S36","(":"S37","NUM_INT":"S38","NUM_REAL":"S39","STRING":"S40","BOOLEAN":"S41","ID":"S42","VERDADEIRO":"S41","FALSO":"S41"};
    const CS={"ID":"S12","RECEBE":"S13","MOSTRA":"S14","SE":"S15","ENQUANTO":"S16","PARA":"S17","PARE":"S18"};
    const set=(st,map)=>Object.assign(T[st],map);
    const rAll=(st,tks,p)=>tks.forEach(t=>T[st][t]=`R${p}`);
    set(0,CS); T[1]["$"]="acc";
    set(2,CS); T[2]["$"]="R2"; T[2]["}"]="R2";
    FC.forEach(t=>{T[3][t]="R3";T[4][t]="R4";T[5][t]="R5";T[6][t]="R6";T[7][t]="R7";T[8][t]="R8";T[9][t]="R22";T[10][t]="R23";T[11][t]="R9";});
    set(12,{"[":"S20","VALE":"S21"});
    T[13]["["]="S22";T[14]["["]="S23";T[15]["("]="S24";T[16]["("]="S25";T[17]["ID"]="S26";T[18]["#"]="S27";
    rAll(19,FC,1);
    set(20,{"INTEIRO":"S29","DECIMAL":"S30","TEXTO":"S31","LOGICO":"S32"});
    [21,24,25,37,54,80,88].forEach(st=>set(st,ES));
    T[22]["ID"]="S43";T[23]["STRING"]="S46";T[23]["ID"]="S47";T[26]["DE"]="S50";
    rAll(27,FC,29); T[28]["]"]="S51";
    T[29]["]"]="R35";T[30]["]"]="R36";T[31]["]"]="R37";T[32]["]"]="R38";
    T[33]["#"]="S52";
    set(34,BS); FET.forEach(t=>T[34][t]="R41");
    FV.forEach(t=>T[35][t]="R57");
    set(36,ES);
    FV.forEach(t=>{T[38][t]="R30";T[39][t]="R31";T[40][t]="R32";T[41][t]="R33";T[42][t]="R34";});
    T[43]["]"]="S70";T[44]["]"]="S71";T[45][","]=  "S72";T[45]["]"]="R15";
    [",","]"].forEach(t=>{T[46][t]="R17";T[47][t]="R18";});
    T[48][")"]="S73";T[49][")"]="S74";
    set(50,{"NUM_INT":"S76","NUM_REAL":"S77","ID":"S78"});
    T[51]["#"]="S79";T[51]["VALE"]="S80";
    rAll(52,FC,12); FEX.forEach(t=>T[53][t]="R39");
    const brs=[42,43,44,45,46,47,48,49,50,51,52,53,54];
    [55,56,57,58,59,60,61,62,63,64,65,66,67].forEach((st,i)=>FBOP.forEach(t=>T[st][t]=`R${brs[i]}`));
    FV.forEach(t=>T[68][t]="R55"); T[69][")"]="S82";
    T[70]["#"]="S83";T[71]["#"]="S84";T[72]["STRING"]="S46";T[72]["ID"]="S47";
    T[73]["{"]="S86";T[74]["{"]="S87";T[75]["ATE"]="S88";
    ["ATE","{"].forEach(t=>{T[76][t]="R26";T[77][t]="R27";T[78][t]="R28";});
    rAll(79,FC,10);
    set(81,BS); FET.forEach(t=>T[81][t]="R41");
    FV.forEach(t=>T[82][t]="R56");
    rAll(83,FC,13);rAll(84,FC,14); T[85]["]"]="R16";
    [86,87,101,102].forEach(st=>set(st,CS));
    T[89]["#"]="S94"; FET.forEach(t=>T[90][t]="R40");
    T[91]["}"]="S95";T[92]["}"]="S96";T[93]["PASSO"]="S97";
    rAll(94,FC,11);
    T[95]["SENAO"]="S99"; FOS.forEach(t=>{if(t!=="SENAO")T[95][t]="R21";});
    rAll(96,FC,24);
    set(97,{"NUM_INT":"S76","NUM_REAL":"S77","ID":"S78"});
    rAll(98,FC,19);
    T[99]["{"]="S101";T[100]["{"]="S102";
    T[103]["}"]="S105";T[104]["}"]="S106";
    rAll(105,FC,20);rAll(106,FC,25);
    return T;
})();

const SLR_GOTO = (() => {
    const G={};
    for(let i=0;i<107;i++) G[i]={};
    const B=(lc)=>({"lista_comandos":lc,"comando":2,"declaracao":3,"atribuicao":4,"entrada":5,"saida":6,"condicional":7,"laco_repeticao":8,"laco_enquanto":9,"laco_para":10,"break":11});
    const E=(e)=>({"expr":e,"term":34,"valor":35,"binop":54,"expr_tail":53});
    Object.assign(G[0],B(1));Object.assign(G[2],B(19));
    G[20]["tipo"]=28;
    Object.assign(G[21],E(33)); G[23]["lista_valores"]=44;G[23]["valor_saida"]=45;
    Object.assign(G[24],E(48));Object.assign(G[25],E(49));
    G[34]["expr_tail"]=53;G[34]["binop"]=54; G[36]["term"]=68;G[36]["valor"]=35;
    Object.assign(G[37],E(69)); G[50]["valor_for"]=75;
    Object.assign(G[54],{"term":81,"valor":35});
    G[72]["lista_valores"]=85;G[72]["valor_saida"]=45;
    Object.assign(G[80],E(89)); G[81]["expr_tail"]=90;G[81]["binop"]=54;
    Object.assign(G[86],B(91));Object.assign(G[87],B(92));
    Object.assign(G[88],E(93)); G[95]["opcional_senao"]=98;G[97]["valor_for"]=100;
    Object.assign(G[101],B(103));Object.assign(G[102],B(104));
    return G;
})();

class SLRParser {
    parse(tokens, recuperacao=true) {
        const entrada = tokens.filter(t=>t.token!=="COMENTARIO").map(t=>({...t,terminal:t.token}));
        entrada.push({token:"$",lexema:"$",linha:0,terminal:"$"});
        const pilha=[0], simbolos=[], trajetoria=[], erros=[];
        let idx=0, passos=0;
        const fmtP=()=>pilha.join(" "), fmtB=()=>entrada.slice(idx).map(t=>t.terminal).join(" ");
        trajetoria.push({passo:0,pilha:`[${fmtP()}]`,buffer:fmtB(),acao:"— Início —",tipo:"info"});
        while(passos++<5000) {
            const estado=pilha[pilha.length-1], tok=entrada[idx], terminal=tok.terminal;
            const acao=SLR_ACTION[estado]?.[terminal];
            if(!acao) {
                const esp=Object.keys(SLR_ACTION[estado]||{}).join(", ");
                const msg=`Erro sintático na linha ${tok.linha}: token inesperado '${tok.lexema}' (${terminal}). Esperado: ${esp||"nenhum"}`;
                erros.push(msg);
                trajetoria.push({passo:passos,pilha:`[${fmtP()}]`,buffer:fmtB(),acao:` ERRO — ${msg}`,tipo:"erro"});
                const sync=new Set(["#","}","$","SE","ENQUANTO","PARA","RECEBE","MOSTRA","ID","PARE"]);
                while(idx<entrada.length-1&&!sync.has(entrada[idx].terminal)) idx++;
                if(!recuperacao || idx>=entrada.length-1||erros.length>=10) break;
                pilha.length=0; pilha.push(0); simbolos.length=0;
                continue;
            }
            if(acao==="acc") {
                const temErros=erros.length>0;
                trajetoria.push({passo:passos,pilha:`[${fmtP()}]`,buffer:fmtB(),
                    acao:temErros?" ACEITAR (com erros — recuperação em modo pânico foi usada)":" ACEITAR",
                    tipo:temErros?"erro":"aceitar"});
                return {sucesso:!temErros,erros,trajetoria};
            }
            if(acao.startsWith("S")) {
                const prox=parseInt(acao.slice(1));
                trajetoria.push({passo:passos,pilha:`[${fmtP()}]`,buffer:fmtB(),acao:` Shift '${tok.lexema}' → S${prox}`,tipo:"shift"});
                pilha.push(prox); simbolos.push(tok.lexema); idx++;
            } else {
                const np=parseInt(acao.slice(1));
                const [lhs,rlen]=SLR_PRODUCTIONS[np];
                for(let i=0;i<rlen;i++){pilha.pop();simbolos.pop();}
                const topo=pilha[pilha.length-1], proxGoto=SLR_GOTO[topo]?.[lhs];
                trajetoria.push({passo:passos,pilha:`[${fmtP()}]`,buffer:fmtB(),
                    acao:` Reduzir R${np}: ${lhs} → ${(SLR_RHS[np]||["?"]).join(" ")} (GOTO[${topo}][${lhs}]=${proxGoto})`,tipo:"reduce"});
                if(proxGoto===undefined){erros.push(`Erro de GOTO: estado ${topo}, símbolo '${lhs}'`);break;}
                pilha.push(proxGoto); simbolos.push(lhs);
            }
        }
        return {sucesso:false,erros,trajetoria};
    }
}
const slrParser = new SLRParser();


// ============================================================
//  3 — ANALISADOR SINTÁTICO LL(1)
// ============================================================

// Tabela de parsing LL(1): M[NT][terminal] = [lhs, rhs[]]
// rhs = [] para produções ε
const LL1_TABLE = (() => {
    const M = {};
    const def = (nt, terminals, lhs, rhs) => {
        if (!M[nt]) M[nt] = {};
        terminals.forEach(t => M[nt][t] = { lhs, rhs });
    };

    const FIRST_CMD  = ["ID","RECEBE","MOSTRA","SE","ENQUANTO","PARA","PARE"];
    const FOLLOW_CMD = ["ID","RECEBE","MOSTRA","SE","ENQUANTO","PARA","PARE","$","}"];
    const BINOPS     = ["??","$$","MENOR","MAIOR","IGUAL","MAG","MEG","DIFERENTE","ADD","SUB","MULT","DIV","RESTO"];
    const TERM_FST   = ["XX","(","NUM_INT","NUM_REAL","STRING","BOOLEAN","ID","VERDADEIRO","FALSO"];
    const FOL_EXPR   = ["#",")","PASSO"];

    // lista_comandos
    def("lista_comandos", FIRST_CMD, "lista_comandos", ["comando","lista_comandos_cont"]);

    // lista_comandos_cont
    def("lista_comandos_cont", FIRST_CMD,       "lista_comandos_cont", ["comando","lista_comandos_cont"]);
    def("lista_comandos_cont", ["$","}"],        "lista_comandos_cont", []);  // ε

    // comando
    def("comando", ["ID"],       "comando", ["cmd_id"]);
    def("comando", ["RECEBE"],   "comando", ["entrada"]);
    def("comando", ["MOSTRA"],   "comando", ["saida"]);
    def("comando", ["SE"],       "comando", ["condicional"]);
    def("comando", ["ENQUANTO","PARA"], "comando", ["laco_repeticao"]);
    def("comando", ["PARE"],     "comando", ["break"]);

    // cmd_id
    def("cmd_id", ["ID"], "cmd_id", ["ID","cmd_id_cont"]);

    // cmd_id_cont
    def("cmd_id_cont", ["["],    "cmd_id_cont", ["[","tipo","]","cmd_tipo_cont"]);
    def("cmd_id_cont", ["VALE"], "cmd_id_cont", ["VALE","expr","#"]);

    // cmd_tipo_cont
    def("cmd_tipo_cont", ["#"],    "cmd_tipo_cont", ["#"]);
    def("cmd_tipo_cont", ["VALE"], "cmd_tipo_cont", ["VALE","expr","#"]);

    // entrada
    def("entrada", ["RECEBE"], "entrada", ["RECEBE","[","ID","]","#"]);

    // saida
    def("saida", ["MOSTRA"], "saida", ["MOSTRA","[","lista_valores","]","#"]);

    // lista_valores
    def("lista_valores", ["STRING","ID"], "lista_valores", ["valor_saida","lista_valores_cont"]);

    // lista_valores_cont
    def("lista_valores_cont", [","], "lista_valores_cont", [",","lista_valores"]);
    def("lista_valores_cont", ["]"], "lista_valores_cont", []);  // ε

    // valor_saida
    def("valor_saida", ["STRING"], "valor_saida", ["STRING"]);
    def("valor_saida", ["ID"],     "valor_saida", ["ID"]);

    // condicional
    def("condicional", ["SE"], "condicional", ["SE","(","expr",")","{","lista_comandos","}","opcional_senao"]);

    // opcional_senao
    def("opcional_senao", ["SENAO"], "opcional_senao", ["SENAO","{","lista_comandos","}"]);
    def("opcional_senao", FOLLOW_CMD.filter(t=>t!=="SENAO"), "opcional_senao", []); // ε

    // laco_repeticao
    def("laco_repeticao", ["ENQUANTO"], "laco_repeticao", ["laco_enquanto"]);
    def("laco_repeticao", ["PARA"],     "laco_repeticao", ["laco_para"]);

    // laco_enquanto
    def("laco_enquanto", ["ENQUANTO"], "laco_enquanto", ["ENQUANTO","(","expr",")","{","lista_comandos","}"]);

    // laco_para
    def("laco_para", ["PARA"], "laco_para", ["PARA","ID","DE","valor_for","ATE","expr","PASSO","valor_for","{","lista_comandos","}"]);

    // valor_for
    def("valor_for", ["NUM_INT"],  "valor_for", ["NUM_INT"]);
    def("valor_for", ["NUM_REAL"], "valor_for", ["NUM_REAL"]);
    def("valor_for", ["ID"],       "valor_for", ["ID"]);

    // break
    def("break", ["PARE"], "break", ["PARE","#"]);

    // valor
    def("valor", ["NUM_INT"],  "valor", ["NUM_INT"]);
    def("valor", ["NUM_REAL"], "valor", ["NUM_REAL"]);
    def("valor", ["STRING"],   "valor", ["STRING"]);
    def("valor", ["BOOLEAN","VERDADEIRO","FALSO"], "valor", ["BOOLEAN"]);
    def("valor", ["ID"],       "valor", ["ID"]);

    // tipo
    def("tipo", ["INTEIRO"], "tipo", ["INTEIRO"]);
    def("tipo", ["DECIMAL"], "tipo", ["DECIMAL"]);
    def("tipo", ["TEXTO"],   "tipo", ["TEXTO"]);
    def("tipo", ["LOGICO"],  "tipo", ["LOGICO"]);

    // expr
    def("expr", TERM_FST, "expr", ["term","expr_tail"]);

    // expr_tail
    def("expr_tail", BINOPS,    "expr_tail", ["binop","term","expr_tail"]);
    def("expr_tail", FOL_EXPR,  "expr_tail", []);  // ε

    // binop
    const binopMap = {"??":"??","$$":"$$","MENOR":"MENOR","MAIOR":"MAIOR","IGUAL":"IGUAL",
        "MAG":"MAG","MEG":"MEG","DIFERENTE":"DIFERENTE","ADD":"ADD","SUB":"SUB",
        "MULT":"MULT","DIV":"DIV","RESTO":"RESTO"};
    Object.entries(binopMap).forEach(([t,v]) => def("binop",[t],"binop",[v]));

    // term
    def("term", ["XX"],  "term", ["XX","term"]);
    def("term", ["("],   "term", ["(","expr",")"]);
    def("term", ["NUM_INT","NUM_REAL","STRING","BOOLEAN","ID","VERDADEIRO","FALSO"], "term", ["valor"]);

    return M;
})();

// Conjunto de não-terminais da gramática LL(1)
const LL1_NTS = new Set([
    "lista_comandos","lista_comandos_cont","comando",
    "cmd_id","cmd_id_cont","cmd_tipo_cont",
    "entrada","saida","lista_valores","lista_valores_cont","valor_saida",
    "condicional","opcional_senao","laco_repeticao","laco_enquanto","laco_para",
    "valor_for","break","valor","tipo","expr","expr_tail","binop","term"
]);

class LL1Parser {
    parse(tokens, recuperacao=true) {
        // Filtra comentários e normaliza BOOLEAN
        const entrada = tokens
            .filter(t => t.token !== "COMENTARIO")
            .map(t => ({ ...t, terminal: t.token }));
        entrada.push({ token:"$", lexema:"$", linha:0, terminal:"$" });

        // Pilha inicia com [$, lista_comandos]
        const pilha      = ["$", "lista_comandos"];
        const trajetoria = [];
        const erros      = [];
        let   idx        = 0;
        let   passos     = 0;

        const fmtPilha = () => [...pilha].reverse().join(" ");
        const fmtBuf   = () => entrada.slice(idx).map(t => t.terminal).join(" ");

        trajetoria.push({
            passo:0, pilha:fmtPilha(), buffer:fmtBuf(),
            acao:"— Início —", tipo:"info"
        });

        while (passos++ < 5000) {
            const topo = pilha[pilha.length - 1];
            const tok  = entrada[idx];
            const term = tok.terminal;

            // Aceitar
            if (topo === "$" && term === "$") {
                trajetoria.push({
                    passo:passos, pilha:fmtPilha(), buffer:fmtBuf(),
                    acao: erros.length > 0
                        ? " ACEITAR (com erros — recuperação em modo pânico foi usada)"
                        : " ACEITAR",
                    tipo: erros.length > 0 ? "erro" : "aceitar"
                });
                return { sucesso: erros.length === 0, erros, trajetoria };
            }

            // Topo é terminal — CASAR
            if (!LL1_NTS.has(topo)) {
                if (topo === term) {
                    trajetoria.push({
                        passo:passos, pilha:fmtPilha(), buffer:fmtBuf(),
                        acao:` Casar '${tok.lexema}'`, tipo:"shift"
                    });
                    pilha.pop();
                    idx++;
                } else {
                    const msg = `Erro sintático na linha ${tok.linha}: esperado '${topo}', encontrado '${tok.lexema}'.`;
                    erros.push(msg);
                    trajetoria.push({
                        passo:passos, pilha:fmtPilha(), buffer:fmtBuf(),
                        acao:` ERRO — ${msg}`, tipo:"erro"
                    });
                    // Recuperação ou parada
                    if (!recuperacao) break;
                    if (idx < entrada.length - 1) idx++;
                    else break;
                    if (erros.length >= 10) { erros.push("Muitos erros. Análise interrompida."); break; }
                }
                continue;
            }

            // Topo é não-terminal — EXPANDIR
            const entrada_tabela = LL1_TABLE[topo]?.[term];
            if (!entrada_tabela) {
                const esp = LL1_TABLE[topo] ? Object.keys(LL1_TABLE[topo]).join(", ") : "nenhum";
                const msg = `Erro sintático na linha ${tok.linha}: '${tok.lexema}' (${term}) inesperado para <${topo}>. Esperado: ${esp}`;
                erros.push(msg);
                trajetoria.push({
                    passo:passos, pilha:fmtPilha(), buffer:fmtBuf(),
                    acao:` ERRO — ${msg}`, tipo:"erro"
                });
                // Recuperação modo pânico: descarta topo ou avança buffer
                const sync = new Set(["#","}","$","SE","ENQUANTO","PARA","RECEBE","MOSTRA","ID","PARE","SENAO"]);
                if (!recuperacao) break;
                if (sync.has(term)) {
                    pilha.pop();
                } else {
                    if (idx < entrada.length - 1) idx++;
                }
                if (erros.length >= 10) { erros.push("Muitos erros. Análise interrompida."); break; }
                continue;
            }

            const { lhs, rhs } = entrada_tabela;
            const rhsStr = rhs.length === 0 ? "ε" : rhs.join(" ");
            trajetoria.push({
                passo:passos, pilha:fmtPilha(), buffer:fmtBuf(),
                acao:`Expandir  <${topo}> → ${rhsStr}`, tipo:"reduce"
            });

            pilha.pop();
            // Empilha da direita para a esquerda
            for (let i = rhs.length - 1; i >= 0; i--) {
                pilha.push(rhs[i]);
            }
        }

        if (passos >= 5000) erros.push("Análise excedeu o limite de passos.");
        return { sucesso: false, erros, trajetoria };
    }
}
const ll1Parser = new LL1Parser();


// ============================================================
//  4 — INTERFACE
// ============================================================

let _modoAtual = null;

function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function categorizarToken(token) {
    if (token==='ID')         return 'Identificadores';
    if (token==='NUM_INT')    return 'Inteiros';
    if (token==='NUM_REAL')   return 'Decimais';
    if (token==='STRING')     return 'Strings';
    if (token==='BOOLEAN')    return 'Booleanos';
    if (token==='COMENTARIO') return 'Comentários';
    if (token==='VALE')       return 'Atribuição';
    if (token==='#')          return 'Fim Instrução';
    if (['INTEIRO','DECIMAL','TEXTO','LOGICO'].includes(token))                     return 'Tipos';
    if (['SE','SENAO','ENQUANTO','PARA','DE','ATE','PASSO','PARE'].includes(token)) return 'Controle';
    if (['ADD','SUB','DIV','MULT','RESTO'].includes(token))                         return 'Aritméticos';
    if (['MENOR','MAIOR','IGUAL','MAG','MEG','DIFERENTE'].includes(token))          return 'Relacionais';
    if (['$$','??','XX'].includes(token))                                            return 'Lógicos';
    if (['RECEBE','MOSTRA'].includes(token))                                         return 'E/S';
    return 'Delimitadores';
}

function tagClass(token) {
    if (token==='ID')         return 'tag-ID';
    if (token==='NUM_INT')    return 'tag-NUM_INT';
    if (token==='NUM_REAL')   return 'tag-NUM_REAL';
    if (token==='STRING')     return 'tag-STRING';
    if (token==='BOOLEAN')    return 'tag-BOOLEAN';
    if (token==='COMENTARIO') return 'tag-COMENT';
    if (token==='VALE')       return 'tag-ATRIB';
    if (token==='#')          return 'tag-FIM';
    if (['INTEIRO','DECIMAL','TEXTO','LOGICO'].includes(token))                     return 'tag-TIPO';
    if (['SE','SENAO','ENQUANTO','PARA','DE','ATE','PASSO','PARE'].includes(token)) return 'tag-CONTROLE';
    if (['ADD','SUB','DIV','MULT','RESTO'].includes(token))                         return 'tag-ARIT';
    if (['MENOR','MAIOR','IGUAL','MAG','MEG','DIFERENTE'].includes(token))          return 'tag-REL';
    if (['$$','??','XX'].includes(token))                                            return 'tag-LOG';
    if (['RECEBE','MOSTRA'].includes(token))                                         return 'tag-ES';
    return 'tag-DELIM';
}

function limparTudo(limparEditor=false) {
    if (limparEditor) document.getElementById('editor').value='';
    document.getElementById('output-panel').style.display='none';
    document.getElementById('stats').textContent='';
    document.getElementById('token-body').innerHTML='';
    document.getElementById('summary').innerHTML='';
    document.getElementById('sint-traj-body').innerHTML='';
    document.getElementById('sint-summary').innerHTML='';
    document.getElementById('erros-body').innerHTML='';
    _modoAtual=null;
}

function configurarAbas(modo) {
    const btnSint = document.getElementById('tab-btn-sintatico');
    btnSint.style.display = (modo==='lexico') ? 'none' : '';
    ativarAba(modo==='lexico' ? 'tokens' : 'sintatico');
}

function ativarAba(name) {
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
    document.getElementById('tab-tokens').style.display    = name==='tokens'    ? '' : 'none';
    document.getElementById('tab-sintatico').style.display = name==='sintatico' ? '' : 'none';
    document.getElementById('tab-erros').style.display     = name==='erros'     ? '' : 'none';
}

function renderTokens(tokens, errosLex=[]) {
    const tbody = document.getElementById('token-body');
    tbody.innerHTML='';
    const contagem={};
    tokens.forEach(t=>{ const c=categorizarToken(t.token); contagem[c]=(contagem[c]||0)+1; });
    const lexOk = errosLex.length===0;
    const feedback = lexOk
        ? `<div class="summary-item lex-feedback lex-ok"><span class="summary-val ok"> Código lexicamente correto</span></div>`
        : `<div class="summary-item lex-feedback lex-err"><span class="summary-val err"> Erros léxicos encontrados</span></div>`;
    document.getElementById('summary').innerHTML =
        feedback +
        `<div class="summary-item"><span class="summary-label">Total:</span><span class="summary-val ok">${tokens.length}</span></div>` +
        Object.entries(contagem).map(([k,v])=>
            `<div class="summary-item"><span class="summary-label">${k}:</span><span class="summary-val">${v}</span></div>`
        ).join('');

    tokens.forEach((tok,i) => {
        const tr = document.createElement('tr');
        tr.className = 'token-row'+(tok.token==='COMENTARIO'?' dimmed':'');
        tr.innerHTML = `
            <td class="td-num">${i+1}</td>
            <td class="td-token"><span class="tag ${tagClass(tok.token)}">${tok.token}</span></td>
            <td class="td-lexema">${escapeHtml(tok.lexema)}</td>
            <td class="td-linha">${tok.linha}</td>
            <td class="td-expand"><button class="btn-expand" title="Ver trajetória AFD">▶</button></td>`;
        tbody.appendChild(tr);
        const trTraj=document.createElement('tr'); trTraj.className='traj-row'; trTraj.style.display='none';
        const tdTraj=document.createElement('td'); tdTraj.colSpan=5; tdTraj.className='traj-cell';
        const traj=tok.trajetoria||[];
        if(traj.length===0) { tdTraj.innerHTML='<span class="traj-empty">Sem trajetória registrada.</span>'; }
        else {
            let html=`<div class="traj-steps"><span class="traj-state">${escapeHtml(traj[0].de)}</span>`;
            traj.forEach(p=>{
                const err=p.para==='ERRO';
                html+=`<span class="traj-arrow ${err?'arrow-erro':''}"><span class="traj-char">'${escapeHtml(p.char)}'</span><span class="traj-seta">→</span></span><span class="traj-state ${err?'state-erro':''}">${escapeHtml(p.para)}</span>`;
            });
            if(traj[traj.length-1].para!=='ERRO') html+=`<span class="traj-aceito"> Aceito</span>`;
            html+='</div>'; tdTraj.innerHTML=html;
        }
        trTraj.appendChild(tdTraj); tbody.appendChild(trTraj);
        tr.querySelector('.btn-expand').addEventListener('click',()=>{
            const aberto=trTraj.style.display!=='none';
            trTraj.style.display=aberto?'none':'';
            tr.querySelector('.btn-expand').textContent=aberto?'▶':'▼';
            tr.classList.toggle('expanded',!aberto);
        });
    });
}

function renderTrajetoriaSintatico(trajetoria, errosSint=[], aviso="") {
    const tbody=document.getElementById('sint-traj-body');
    tbody.innerHTML='';
    const aceito=errosSint.length===0&&trajetoria.some(p=>p.tipo==='aceitar');
    const avisoHtml = aviso
        ? `<div class="summary-item"><span class="summary-val warn"> ${aviso}</span></div>`
        : '';
    document.getElementById('sint-summary').innerHTML=`
        <div class="summary-item">
            <span class="summary-label">Resultado:</span>
            <span class="summary-val ${aceito?'ok':'err'}">${aceito?' Código sintaticamente correto':' Erros sintáticos encontrados'}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Passos:</span>
            <span class="summary-val">${trajetoria.length}</span>
        </div>
        ${avisoHtml}`;
    trajetoria.forEach(p=>{
        const precisaTruncar=p.pilha.length>40||p.buffer.length>35;
        const ps=p.pilha.length>40?'...'+p.pilha.slice(-37):p.pilha;
        const bs=p.buffer.length>35?p.buffer.slice(0,35)+'...':p.buffer;
        const tr=document.createElement('tr'); tr.className=`sint-row sint-${p.tipo}`;
        tr.innerHTML=`<td class="td-num">${p.passo}</td><td class="td-pilha"><code>${escapeHtml(ps)}</code></td><td class="td-buffer"><code>${escapeHtml(bs)}</code></td><td class="td-acao">${escapeHtml(p.acao)}</td><td class="td-expand">${precisaTruncar?'<button class="btn-expand" title="Ver completo">▶</button>':''}</td>`;
        tbody.appendChild(tr);
        if(precisaTruncar) {
            const trDet=document.createElement('tr'); trDet.className='sint-detalhe-row'; trDet.style.display='none';
            const tdDet=document.createElement('td'); tdDet.colSpan=5; tdDet.className='sint-detalhe-cell';
            tdDet.innerHTML=`<div class="sint-detalhe-bloco"><span class="sint-detalhe-label">Pilha completa:</span><code class="sint-detalhe-val">${escapeHtml(p.pilha)}</code></div><div class="sint-detalhe-bloco"><span class="sint-detalhe-label">Buffer completo:</span><code class="sint-detalhe-val">${escapeHtml(p.buffer)}</code></div>`;
            trDet.appendChild(tdDet); tbody.appendChild(trDet);
            tr.querySelector('.btn-expand').addEventListener('click',()=>{
                const aberto=trDet.style.display!=='none';
                trDet.style.display=aberto?'none':'';
                tr.querySelector('.btn-expand').textContent=aberto?'▶':'▼';
                tr.classList.toggle('sint-expanded',!aberto);
            });
        }
    });
}

function renderErros(errosLex, totalTokens, errosSint=[], metodo="") {
    const body=document.getElementById('erros-body');
    let html="";
    if(errosLex.length===0) {
        html+=`<div class="msg msg-success"><span class="msg-icon"></span><span>Léxico: análise concluída sem erros. ${totalTokens} token(s) reconhecido(s).</span></div>`;
    } else {
        html+=`<div class="msg msg-error"><span class="msg-icon"></span><span>Léxico: ${errosLex.length} erro(s) encontrado(s).</span></div>`;
        html+=errosLex.map(e=>`<div class="msg msg-error indent"><span class="msg-icon">•</span><span>Linha ${e.linha}: ${escapeHtml(e.msg)}</span></div>`).join('');
    }
    if(metodo) {
        html+=`<div class="erros-sep"></div>`;
        if(errosSint.length===0) {
            html+=`<div class="msg msg-success"><span class="msg-icon"></span><span>${metodo}: análise concluída sem erros.</span></div>`;
        } else {
            html+=`<div class="msg msg-error"><span class="msg-icon"></span><span>${metodo}: ${errosSint.length} erro(s) encontrado(s).</span></div>`;
            html+=errosSint.map(m=>`<div class="msg msg-error indent"><span class="msg-icon">•</span><span>${escapeHtml(m)}</span></div>`).join('');
        }
    }
    body.innerHTML=html;
}

function executarLexico(modoLexico) {
    const codigo = document.getElementById('editor').value;
    if (!codigo.trim()) { alert('Digite ou carregue um código-fonte Bertol.'); return; }
    limparTudo(false);
    _modoAtual = 'lexico';
    const recLex = modoLexico === 'recuperacao';
    const {tokens, erros} = executarAnalisadorLexicoAFD(codigo, getTabelaSimbolos(), recLex);
    renderTokens(tokens, erros);
    renderErros(erros, tokens.length, []);
    const modoLabel = recLex ? 'c/ recuperação' : 'normal';
    document.getElementById('stats').textContent = `Léxico (${modoLabel}): ${tokens.length} token(s)   ${erros.length} erro(s)`;
    document.getElementById('output-panel').style.display = '';
    configurarAbas('lexico');
}

function executarSintatico(metodo, modoLexico, modoSint) {
    const codigo = document.getElementById('editor').value;
    if (!codigo.trim()) { alert('Digite ou carregue um código-fonte Bertol.'); return; }
    limparTudo(false);
    _modoAtual = metodo;

    const recLex  = modoLexico === 'recuperacao';
    const recSint = modoSint   === 'recuperacao';

    // 1) Léxico
    const {tokens, erros:errosLex} = executarAnalisadorLexicoAFD(codigo, getTabelaSimbolos(), recLex);

    // 2) Se léxico em modo normal e encontrou erros, bloqueia o sintático
    if (!recLex && errosLex.length > 0) {
        renderTokens(tokens, errosLex);
        renderErros(errosLex, tokens.length, [], metodo);
        // Avisa que sintático não foi executado
        document.getElementById('sint-summary').innerHTML = `
            <div class="summary-item">
                <span class="summary-label" style="color:var(--error)">
                     Análise sintática não executada — erros léxicos impedem o prosseguimento.
                </span>
            </div>`;
        document.getElementById('stats').textContent = `${metodo}: análise bloqueada por erros léxicos`;
        document.getElementById('output-panel').style.display = '';
        configurarAbas('sintatico');
        return;
    }

    // 3) Avisa se léxico teve recuperação mas ainda vai rodar o sintático
    const avisoRecLex = (recLex && errosLex.length > 0)
        ? ' Resultados podem ser imprecisos devido a erros léxicos.'
        : '';

    // 4) Sintático
    const resultado = metodo === 'SLR'
        ? slrParser.parse(tokens, recSint)
        : ll1Parser.parse(tokens, recSint);

    renderTokens(tokens, errosLex);
    renderTrajetoriaSintatico(resultado.trajetoria, resultado.erros, avisoRecLex);
    renderErros(errosLex, tokens.length, resultado.erros, metodo);

    const totalErros = errosLex.length + resultado.erros.length;
    const modoLabel  = `${recLex?'léx. rec.':'léx. norm.'} / ${recSint?'sint. rec.':'sint. norm.'}`;
    document.getElementById('stats').textContent = `${metodo} (${modoLabel}): ${tokens.length} token(s)   ${totalErros} erro(s)`;
    document.getElementById('output-panel').style.display = '';
    configurarAbas('sintatico');
}

document.addEventListener('DOMContentLoaded', () => {

    // ── Tabs ────────────────────────────────────────────────
    document.querySelectorAll('.tab').forEach(tab=>
        tab.addEventListener('click',()=>ativarAba(tab.dataset.tab))
    );

    // ── Limpar ──────────────────────────────────────────────
    document.getElementById('btn-limpar').addEventListener('click',()=>limparTudo(true));

    // ── Carregar arquivo ────────────────────────────────────
    document.getElementById('file-input').addEventListener('change', e=>{
        const file=e.target.files[0]; if(!file) return;
        limparTudo(false);
        const reader=new FileReader();
        reader.onload=()=>{ document.getElementById('editor').value=reader.result; };
        reader.readAsText(file); e.target.value='';
    });

    // ── Dropdown: Análise Léxica ────────────────────────────
    const btnLexToggle = document.getElementById('btn-lexico-toggle');
    const menuLex      = document.getElementById('menu-lexico');

    btnLexToggle.addEventListener('click', e => {
        e.stopPropagation();
        menuLex.classList.toggle('open');
        document.getElementById('menu-sint').classList.remove('open');
    });

    document.querySelectorAll('[data-lexico]').forEach(btn => {
        if (!btn.closest('#menu-sint')) {
            btn.addEventListener('click', () => {
                menuLex.classList.remove('open');
                executarLexico(btn.dataset.lexico);
            });
        }
    });

    // ── Dropdown: Análise Sintática ──────────────────────────
    const btnSintToggle   = document.getElementById('btn-sint-toggle');
    const menuSint        = document.getElementById('menu-sint');
    const maisOpcoesTrig  = document.getElementById('mais-opcoes-trigger');
    const submenuMais     = document.getElementById('submenu-mais');

    btnSintToggle.addEventListener('click', e => {
        e.stopPropagation();
        menuSint.classList.toggle('open');
        menuLex.classList.remove('open');
        submenuMais.classList.remove('open');
    });

    // Clique em "Mais Opções": fecha menu principal, abre submenu
    maisOpcoesTrig.addEventListener('click', e => {
        e.stopPropagation();
        menuSint.classList.remove('open');
        submenuMais.classList.toggle('open');
    });

    document.querySelectorAll('.sint-opt').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            menuSint.classList.remove('open');
            submenuMais.classList.remove('open');
            executarSintatico(btn.dataset.metodo, btn.dataset.lexico, btn.dataset.sint);
        });
    });

    // Fechar todos os dropdowns ao clicar fora
    document.addEventListener('click', () => {
        menuLex.classList.remove('open');
        menuSint.classList.remove('open');
        submenuMais.classList.remove('open');
    });

});
