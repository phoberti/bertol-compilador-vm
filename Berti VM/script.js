/* ============================================================
   Berti VM — núcleo (parser + execução) e interface
   Aceita o TAC do compilador Bertol e o superset genérico descrito
   em "Código de Três Endereços: Instruções, Conversões de Tipo e
   Exemplos" (vetores, ponteiros, funções, ifFalse, conversões
   nomeadas, negação aritmética de variável).
   ============================================================ */

(function(){

  // ================= Núcleo: parser =================

  const RELATIONAL = new Set(['>','<','>=','<=','==','!=']);
  const ARITH = new Set(['+','-','*','/','%']);
  const LOGIC_AND = new Set(['and','&&']);
  const LOGIC_OR = new Set(['or','||']);
  const LOGIC = new Set([...LOGIC_AND, ...LOGIC_OR]);
  const FLOATY = new Set(['decimal']);

  const CONVERT_FUNCS = {
    inttofloat: 'decimal', inttodouble: 'decimal', inttochar: 'caractere',
    floattoint: 'inteiro', floattodouble: 'decimal',
    doubletoint: 'inteiro', doubletofloat: 'decimal',
    chartoint: 'inteiro', chartofloat: 'decimal'
  };
  const CAST_TYPE_MAP = { float: 'decimal', double: 'decimal', int: 'inteiro', char: 'caractere' };

  let instructions = [];
  let labelIndex = {};
  let sourceLines = [];

  const isIntLiteral = (tok) => /^-?\d+$/.test(tok);
  const isFloatLiteral = (tok) => /^-?\d+\.\d+$/.test(tok);
  const isStringLiteral = (tok) => /^"[\s\S]*"$/.test(tok);
  // Divide uma sequência de operandos em tokens, mantendo literais de texto
  // (entre aspas, possivelmente com espaços) como um único token.
  const tokenizar = (s) => s.match(/"[^"]*"|\S+/g) || [];

  function parseProgram(text){
    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    instructions = []; labelIndex = {}; sourceLines = [];
    const cleaned = rawLines.map(line => {
      const labelMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:$/);
      return { raw: line, isLabel: !!labelMatch, label: labelMatch ? labelMatch[1] : null };
    });
    let idx = 0;
    for (const item of cleaned){
      if (item.isLabel){
        labelIndex[item.label] = idx;
        sourceLines.push({ text: item.raw, isLabel: true, instrIndex: idx });
      } else {
        const instr = parseInstruction(item.raw);
        instr.raw = item.raw;
        instructions.push(instr);
        sourceLines.push({ text: item.raw, isLabel: false, instrIndex: idx });
        idx++;
      }
    }
  }

  function parseInstruction(line){
    let m;
    m = line.match(/^print\s+"([\s\S]*)"$/);
    if (m) return { type:'print_str', text: m[1] };
    m = line.match(/^print\s+(\S+)$/);
    if (m) return { type:'print_var', name: m[1] };
    m = line.match(/^read\s+(\S+)$/);
    if (m) return { type:'read', name: m[1] };

    m = line.match(/^ifFalse\s+(.+?)\s+goto\s+(\S+)$/);
    if (m){
      const parts = tokenizar(m[1].trim());
      if (parts.length === 3) return { type:'ifFalse', a:parts[0], op:parts[1], b:parts[2], target:m[2] };
      return { type:'ifFalse_truthy', a: parts[0], target: m[2] };
    }
    m = line.match(/^if\s+(.+?)\s+goto\s+(\S+)$/);
    if (m){
      const parts = tokenizar(m[1].trim());
      if (parts.length === 3) return { type:'if', a:parts[0], op:parts[1], b:parts[2], target:m[2] };
      return { type:'if_truthy', a: parts[0], target: m[2] };
    }
    m = line.match(/^goto\s+(\S+)$/);
    if (m) return { type:'goto', target: m[1] };

    m = line.match(/^param\s+(\S+)$/);
    if (m) return { type:'param', operand: m[1] };
    m = line.match(/^return(?:\s+(\S+))?$/);
    if (m) return m[1] ? { type:'return_val', operand: m[1] } : { type:'return_void' };
    m = line.match(/^call\s+(\S+?),\s*(\d+)$/);
    if (m) return { type:'call_stmt', func: m[1], n: parseInt(m[2],10) };

    m = line.match(/^(\S+)\[(\S+)\]\s*=\s*(\S+)$/);
    if (m) return { type:'array_write', base: m[1], index: m[2], src: m[3] };
    m = line.match(/^\*(\S+)\s*=\s*(\S+)$/);
    if (m) return { type:'deref_write', ptr: m[1], src: m[2] };

    m = line.match(/^(\S+)\s*=\s*(.+)$/);
    if (m){
      const dest = m[1];
      const rhs = m[2].trim();

      if (isStringLiteral(rhs) && tokenizar(rhs).length === 1) return { type:'copy', dest, src: rhs };
      let mm = rhs.match(/^call\s+(\S+?),\s*(\d+)$/);
      if (mm) return { type:'call_assign', dest, func: mm[1], n: parseInt(mm[2],10) };
      mm = rhs.match(/^&(\S+)$/);
      if (mm) return { type:'addr_of', dest, operand: mm[1] };
      mm = rhs.match(/^\*(\S+)$/);
      if (mm) return { type:'deref_read', dest, operand: mm[1] };
      mm = rhs.match(/^(\S+)\[(\S+)\]$/);
      if (mm) return { type:'array_read', dest, base: mm[1], index: mm[2] };
      mm = rhs.match(/^([a-zA-Z]+)\((\S+)\)$/);
      if (mm && CONVERT_FUNCS.hasOwnProperty(mm[1])) return { type:'convert_named', dest, func: mm[1], operand: mm[2] };
      mm = rhs.match(/^\(([a-zA-Z]+)\)\s*(\S+)$/);
      if (mm) return { type:'convert_cast', dest, castType: mm[1].toLowerCase(), operand: mm[2] };
      mm = rhs.match(/^(?:not|!)\s*(\S+)$/);
      if (mm) return { type:'not', dest, operand: mm[1] };

      const parts = tokenizar(rhs);
      if (parts.length === 1 && parts[0].startsWith('-') && !isIntLiteral(parts[0]) && !isFloatLiteral(parts[0])){
        return { type:'neg', dest, operand: parts[0].slice(1) };
      }
      if (parts.length === 3 && (ARITH.has(parts[1]) || RELATIONAL.has(parts[1]) || LOGIC.has(parts[1]))){
        return { type:'binop', dest, a: parts[0], op: parts[1], b: parts[2] };
      }
      if (parts.length === 1) return { type:'copy', dest, src: parts[0] };
      return { type:'unknown', raw: line };
    }
    return { type:'unknown', raw: line };
  }

  // ================= Estado de execução =================

  let memory = {};
  let heap = {};
  let varAddress = {};
  let arraySet = new Set();
  let nextAddr = 1000;
  let paramStack = [];
  let callStack = [];

  let pc = 0;
  let running = false;
  let instantMode = false;
  let waitingInput = null;
  let halted = true;
  let errorState = null;
  let runTimer = null;
  let stepGuard = 0;
  const STEP_GUARD_MAX = 200000;

  const $ = (id) => document.getElementById(id);

  const EXAMPLE_BERTOL = `limite = 0
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
L4:`;

  const EXAMPLE_GENERIC = `a = 4
b = 5
param a
param b
t1 = call soma, 2
print t1
x = 10
p = &x
y = *p
print y
*p = 99
print x
vetor[0] = 7
vetor[1] = 14
vetor[2] = 21
i = 2
v = vetor[i]
print v
f = inttofloat(a)
print f
goto Lfim
soma:
t2 = a + b
return t2
Lfim:`;

  function setStatus(kind, text){
    const el = $('status-pill');
    el.className = 'status-pill ' + kind;
    el.textContent = text;
  }

  function log(text, cls){
    const out = $('output');
    const span = document.createElement('div');
    if (cls) span.className = cls;
    span.textContent = text;
    out.appendChild(span);
    out.scrollTop = out.scrollHeight;
  }
  function clearOutput(){ $('output').innerHTML = ''; }

  function allocBase(){ const base = nextAddr; nextAddr += 100000; return base; }

  function markArray(name){
    if (!(name in varAddress)) varAddress[name] = allocBase();
    arraySet.add(name);
  }

  function ensureAddressable(name){
    if (name in varAddress) return varAddress[name];
    const base = allocBase();
    heap[base] = memory.hasOwnProperty(name) ? memory[name] : { value: 0, type: 'inteiro' };
    delete memory[name];
    varAddress[name] = base;
    return base;
  }

  function getVar(name){
    if (arraySet.has(name)) return { value: varAddress[name], type: 'ponteiro' };
    if (name in varAddress){
      const addr = varAddress[name];
      if (!(addr in heap)) heap[addr] = { value: 0, type: 'inteiro' };
      return heap[addr];
    }
    if (name in memory) return memory[name];
    const created = { value: 0, type: 'inteiro' };
    memory[name] = created;
    return created;
  }

  function setVar(name, val){
    if (name in varAddress && !arraySet.has(name)){ heap[varAddress[name]] = val; return; }
    memory[name] = val;
  }

  function resolveOperand(tok){
    if (tok === 'VERDADEIRO' || tok === 'true') return { value: 1, type: 'logico' };
    if (tok === 'FALSO' || tok === 'false') return { value: 0, type: 'logico' };
    if (isStringLiteral(tok)) return { value: tok.slice(1, -1), type: 'texto' };
    if (isFloatLiteral(tok)) return { value: parseFloat(tok), type: 'decimal' };
    if (isIntLiteral(tok)) return { value: parseInt(tok, 10), type: 'inteiro' };
    return getVar(tok);
  }

  function evalBinop(a, op, b){
    if (ARITH.has(op)){
      const isFloat = FLOATY.has(a.type) || FLOATY.has(b.type);
      let result;
      switch(op){
        case '+': result = a.value + b.value; break;
        case '-': result = a.value - b.value; break;
        case '*': result = a.value * b.value; break;
        case '/': result = isFloat ? (a.value / b.value) : Math.trunc(a.value / b.value); break;
        case '%': result = a.value % b.value; break;
      }
      return { value: result, type: isFloat ? 'decimal' : 'inteiro' };
    }
    if (RELATIONAL.has(op)){
      let r;
      switch(op){
        case '>': r = a.value > b.value; break;
        case '<': r = a.value < b.value; break;
        case '>=': r = a.value >= b.value; break;
        case '<=': r = a.value <= b.value; break;
        case '==': r = a.value === b.value; break;
        case '!=': r = a.value !== b.value; break;
      }
      return { value: r ? 1 : 0, type: 'logico' };
    }
    if (LOGIC.has(op)){
      const av = a.value !== 0, bv = b.value !== 0;
      const r = LOGIC_AND.has(op) ? (av && bv) : (av || bv);
      return { value: r ? 1 : 0, type: 'logico' };
    }
    throw new Error('operador desconhecido: ' + op);
  }

  function convertNamed(funcName, src){
    const targetType = CONVERT_FUNCS[funcName];
    if (targetType === 'decimal') return { value: parseFloat(src.value), type: 'decimal' };
    if (targetType === 'caractere') return { value: src.value, type: 'caractere' };
    return { value: Math.trunc(src.value), type: targetType };
  }
  function convertCast(castType, src){
    const target = CAST_TYPE_MAP[castType] || castType;
    if (target === 'decimal') return { value: parseFloat(src.value), type: 'decimal' };
    if (target === 'caractere') return { value: src.value, type: 'caractere' };
    return { value: Math.trunc(src.value), type: target };
  }

  function formatValue(v){
    if (v.type === 'logico') return v.value ? 'VERDADEIRO' : 'FALSO';
    if (v.type === 'decimal') return Number.isInteger(v.value) ? v.value.toFixed(1) : String(v.value);
    if (v.type === 'ponteiro') return '@' + v.value;
    return String(v.value);
  }

  // ================= Execução passo a passo =================

  function reset(){
    memory = {}; heap = {}; varAddress = {}; arraySet = new Set();
    nextAddr = 1000; paramStack = []; callStack = [];
    pc = 0;
    halted = instructions.length === 0;
    errorState = null; waitingInput = null; running = false; instantMode = false; stepGuard = 0;
    clearInterval(runTimer); runTimer = null;
    $('input-row').style.display = 'none';
    renderAll();
    setStatus('halted', instructions.length ? 'pronta' : 'ociosa');
  }

  function haltWithError(msg){
    errorState = msg; halted = true; running = false; instantMode = false;
    clearInterval(runTimer); runTimer = null;
    log('Erro: ' + msg, 'err');
    setStatus('error', 'erro');
    updateButtons();
  }

  function finishProgram(){
    halted = true; running = false; instantMode = false;
    clearInterval(runTimer); runTimer = null;
    log('— fim do programa —', 'sys');
    setStatus('halted', 'finalizada');
    updateButtons();
  }

  function step(){
    if (halted || waitingInput) return;
    if (pc >= instructions.length){ finishProgram(); return; }
    if (++stepGuard > STEP_GUARD_MAX){
      haltWithError('limite de ' + STEP_GUARD_MAX + ' instruções excedido (possível laço infinito)');
      return;
    }
    const instr = instructions[pc];
    try {
      switch(instr.type){
        case 'print_str': log(instr.text); pc++; break;
        case 'print_var': log(formatValue(resolveOperand(instr.name))); pc++; break;
        case 'read': {
          waitingInput = { varName: instr.name, resume: running };
          $('input-row').style.display = 'flex';
          $('input-label').textContent = 'read ' + instr.name + ' →';
          $('input-value').value = '';
          $('input-value').focus();
          setStatus('waiting', 'aguardando entrada');
          pausePlaying(); updateButtons();
          return;
        }
        case 'goto':
          if (!(instr.target in labelIndex)) throw new Error('rótulo indefinido: ' + instr.target);
          pc = labelIndex[instr.target]; break;
        case 'if': {
          const cond = evalBinop(resolveOperand(instr.a), instr.op, resolveOperand(instr.b));
          if (cond.value){
            if (!(instr.target in labelIndex)) throw new Error('rótulo indefinido: ' + instr.target);
            pc = labelIndex[instr.target];
          } else pc++;
          break;
        }
        case 'if_truthy': {
          const a = resolveOperand(instr.a);
          if (a.value){
            if (!(instr.target in labelIndex)) throw new Error('rótulo indefinido: ' + instr.target);
            pc = labelIndex[instr.target];
          } else pc++;
          break;
        }
        case 'ifFalse': {
          const cond = evalBinop(resolveOperand(instr.a), instr.op, resolveOperand(instr.b));
          if (!cond.value){
            if (!(instr.target in labelIndex)) throw new Error('rótulo indefinido: ' + instr.target);
            pc = labelIndex[instr.target];
          } else pc++;
          break;
        }
        case 'ifFalse_truthy': {
          const a = resolveOperand(instr.a);
          if (!a.value){
            if (!(instr.target in labelIndex)) throw new Error('rótulo indefinido: ' + instr.target);
            pc = labelIndex[instr.target];
          } else pc++;
          break;
        }
        case 'convert_cast': setVar(instr.dest, convertCast(instr.castType, resolveOperand(instr.operand))); pc++; break;
        case 'convert_named': setVar(instr.dest, convertNamed(instr.func, resolveOperand(instr.operand))); pc++; break;
        case 'not': {
          const s = resolveOperand(instr.operand);
          setVar(instr.dest, { value: s.value ? 0 : 1, type: 'logico' }); pc++; break;
        }
        case 'neg': {
          const s = resolveOperand(instr.operand);
          setVar(instr.dest, { value: -s.value, type: s.type }); pc++; break;
        }
        case 'binop': setVar(instr.dest, evalBinop(resolveOperand(instr.a), instr.op, resolveOperand(instr.b))); pc++; break;
        case 'copy': {
          const s = resolveOperand(instr.src);
          setVar(instr.dest, { value: s.value, type: s.type }); pc++; break;
        }
        case 'addr_of': {
          const addr = ensureAddressable(instr.operand);
          setVar(instr.dest, { value: addr, type: 'ponteiro' }); pc++; break;
        }
        case 'deref_read': {
          const p = resolveOperand(instr.operand);
          setVar(instr.dest, heap[p.value] || { value: 0, type: 'inteiro' }); pc++; break;
        }
        case 'deref_write': {
          const p = resolveOperand(instr.ptr);
          heap[p.value] = resolveOperand(instr.src); pc++; break;
        }
        case 'array_read': {
          markArray(instr.base);
          const idx = resolveOperand(instr.index).value;
          const addr = varAddress[instr.base] + idx;
          setVar(instr.dest, heap[addr] || { value: 0, type: 'inteiro' }); pc++; break;
        }
        case 'array_write': {
          markArray(instr.base);
          const idx = resolveOperand(instr.index).value;
          const addr = varAddress[instr.base] + idx;
          heap[addr] = resolveOperand(instr.src); pc++; break;
        }
        case 'param': paramStack.push(resolveOperand(instr.operand)); pc++; break;
        case 'call_stmt': {
          if (!(instr.func in labelIndex)) throw new Error('função/rótulo indefinido: ' + instr.func);
          paramStack.splice(Math.max(0, paramStack.length - instr.n), instr.n);
          callStack.push({ returnPc: pc + 1, destVar: null });
          log('→ chamando ' + instr.func + '()', 'call');
          pc = labelIndex[instr.func]; break;
        }
        case 'call_assign': {
          if (!(instr.func in labelIndex)) throw new Error('função/rótulo indefinido: ' + instr.func);
          paramStack.splice(Math.max(0, paramStack.length - instr.n), instr.n);
          callStack.push({ returnPc: pc + 1, destVar: instr.dest });
          log('→ chamando ' + instr.func + '()', 'call');
          pc = labelIndex[instr.func]; break;
        }
        case 'return_val': {
          const v = resolveOperand(instr.operand);
          const frame = callStack.pop();
          if (!frame){ finishProgram(); return; }
          if (frame.destVar) setVar(frame.destVar, v);
          log('← retorno: ' + formatValue(v), 'call');
          pc = frame.returnPc; break;
        }
        case 'return_void': {
          const frame = callStack.pop();
          if (!frame){ finishProgram(); return; }
          log('← retorno (sem valor)', 'call');
          pc = frame.returnPc; break;
        }
        default: throw new Error('instrução não reconhecida: ' + (instr.raw || instr.type));
      }
    } catch(e){ haltWithError(e.message); return; }

    if (!instantMode) renderAll();
    if (pc >= instructions.length && !waitingInput) finishProgram();
  }

  function submitInput(){
    if (!waitingInput) return;
    const raw = $('input-value').value.trim();
    if (raw.length === 0) return;
    let value;
    if (isFloatLiteral(raw)) value = { value: parseFloat(raw), type: 'decimal' };
    else if (isIntLiteral(raw)) value = { value: parseInt(raw, 10), type: 'inteiro' };
    else value = { value: raw, type: 'texto' };

    setVar(waitingInput.varName, value);
    log('read ' + waitingInput.varName + ' = ' + formatValue(value), 'sys');
    const retomar = waitingInput.resume;   // modo Run estava ativo quando o read pausou
    waitingInput = null;
    $('input-row').style.display = 'none';
    pc++;
    renderAll();
    setStatus(retomar ? 'running' : 'halted', retomar ? 'executando' : 'pronta');
    if (pc >= instructions.length){ finishProgram(); return; }
    updateButtons();
    if (instantMode) runInstant();
    else if (retomar) resumeRun();
  }

  function pausePlaying(){ running = false; clearInterval(runTimer); runTimer = null; }

  function resumeRun(){
    if (halted || waitingInput) return;
    instantMode = false;
    running = true; setStatus('running', 'executando'); updateButtons();
    const speed = 601 - Number($('speed').value);
    runTimer = setInterval(() => {
      if (halted || waitingInput){ clearInterval(runTimer); runTimer = null; return; }
      step();
    }, Math.max(1, speed));
  }

  function pauseRun(){
    instantMode = false;
    pausePlaying();
    if (!halted && !waitingInput) setStatus('halted', 'pausada');
    updateButtons();
  }

  // Executa o programa inteiro de uma vez (sem intervalo entre instruções).
  // Pausa normalmente em cada "read"; ao receber o valor, retoma sozinho
  // no mesmo modo instantâneo até o fim ou até o próximo read.
  function runInstant(){
    if (halted || waitingInput) return;
    instantMode = true;
    setStatus('running', 'executando (instantâneo)');
    updateButtons();
    while (!halted && !waitingInput){
      step();
    }
    renderAll();
    if (waitingInput){
      setStatus('waiting', 'aguardando entrada');
    } else {
      instantMode = false;
    }
    updateButtons();
  }

  // ================= Renderização =================

  function renderProgram(){
    const view = $('tac-view');
    view.innerHTML = '';
    sourceLines.forEach((sl) => {
      const row = document.createElement('div');
      row.className = 'tac-line' + (sl.isLabel ? ' label' : '') + ((!sl.isLabel && sl.instrIndex === pc && !halted) ? ' current' : '');
      const ln = document.createElement('span');
      ln.className = 'ln';
      ln.textContent = sl.isLabel ? '' : String(sl.instrIndex);
      const instr = document.createElement('span');
      instr.className = 'instr';
      instr.textContent = sl.text;
      row.appendChild(ln); row.appendChild(instr);
      view.appendChild(row);
      if (!sl.isLabel && sl.instrIndex === pc && !halted){
        setTimeout(() => row.scrollIntoView({ block:'center', behavior:'smooth' }), 0);
      }
    });
  }

  function renderMemory(){
    const body = $('memory-body');
    const names = Object.keys(memory).sort();
    body.innerHTML = '';
    $('memory-empty').style.display = names.length ? 'none' : 'block';
    $('mem-count').textContent = names.length + (names.length === 1 ? ' variável' : ' variáveis');
    for (const name of names){
      const v = memory[name];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="varname">${name}</td><td class="value">${formatValue(v)}</td><td class="type">${v.type}</td>`;
      body.appendChild(tr);
    }
    for (const name of Object.keys(varAddress).sort()){
      if (arraySet.has(name)) continue;
      const addr = varAddress[name];
      const v = heap[addr] || { value: 0, type: 'inteiro' };
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="varname">${name}<span class="badge">@${addr}</span></td><td class="value">${formatValue(v)}</td><td class="type">${v.type}</td>`;
      body.appendChild(tr);
      $('memory-empty').style.display = 'none';
    }
  }

  function renderHeap(){
    const list = $('heap-list');
    const entries = Object.keys(heap).map(Number).sort((a,b) => a-b);
    if (entries.length === 0){ list.innerHTML = '<div class="mini-empty">vazia</div>'; return; }
    list.innerHTML = entries.map(addr => {
      const v = heap[addr];
      let owner = '';
      for (const name of arraySet){
        const base = varAddress[name];
        if (addr >= base && addr < base + 100000){ owner = name + '[' + (addr-base) + ']'; break; }
      }
      return `<div><span class="addr">@${addr}</span> ${owner ? '(' + owner + ')' : ''} = ${formatValue(v)} <span class="type">${v.type}</span></div>`;
    }).join('');
  }

  function renderCallInfo(){
    const list = $('call-list');
    const parts = [];
    if (callStack.length){
      parts.push('<div><b>pilha (' + callStack.length + ')</b>: ' +
        callStack.map(f => (f.destVar || '—')).join(' ← ') + '</div>');
    }
    if (paramStack.length){
      parts.push('<div><b>parâmetros pendentes</b>: [' + paramStack.map(formatValue).join(', ') + ']</div>');
    }
    list.innerHTML = parts.length ? parts.join('') : '<div class="mini-empty">nenhuma chamada ativa</div>';
  }

  function updatePcIndicator(){ $('pc-indicator').textContent = halted ? 'PC: —' : ('PC: ' + pc); }

  function updateButtons(){
    $('btn-step').disabled = halted || !!waitingInput || running;
    $('btn-run').disabled = halted || !!waitingInput || running;
    $('btn-instant').disabled = halted || !!waitingInput || running;
    $('btn-pause').disabled = !running;
  }

  function renderAll(){
    renderProgram(); renderMemory(); renderHeap(); renderCallInfo(); updatePcIndicator(); updateButtons();
  }

  // ================= Modal de ajuda =================

  function openInfoModal(){ $('info-modal-overlay').classList.add('open'); }
  function closeInfoModal(){ $('info-modal-overlay').classList.remove('open'); }

  // ================= Ligações de interface =================

  function wire(){
    $('btn-load').addEventListener('click', () => {
      clearOutput();
      parseProgram($('tac-input').value);
      $('line-count').textContent = instructions.length + (instructions.length === 1 ? ' instrução' : ' instruções');
      reset();
      log('Programa carregado (' + instructions.length + ' instruções).', 'sys');
    });

    $('btn-example-bertol').addEventListener('click', () => { $('tac-input').value = EXAMPLE_BERTOL; });
    $('btn-example-generic').addEventListener('click', () => { $('tac-input').value = EXAMPLE_GENERIC; });

    $('btn-step').addEventListener('click', () => {
      if (halted && instructions.length === 0) return;
      step();
      if (!halted && !waitingInput) setStatus('halted', 'pausada');
    });
    $('btn-run').addEventListener('click', resumeRun);
    $('btn-instant').addEventListener('click', runInstant);
    $('btn-pause').addEventListener('click', pauseRun);
    $('btn-reset').addEventListener('click', () => { clearOutput(); reset(); });
    $('btn-clear-output').addEventListener('click', clearOutput);
    $('btn-submit-input').addEventListener('click', submitInput);
    $('input-value').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitInput(); });

    $('btn-info').addEventListener('click', openInfoModal);
    $('info-close').addEventListener('click', closeInfoModal);
    $('info-modal-overlay').addEventListener('click', (e) => { if (e.target.id === 'info-modal-overlay') closeInfoModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeInfoModal(); });

    $('tac-input').value = EXAMPLE_BERTOL;
    parseProgram(EXAMPLE_BERTOL);
    $('line-count').textContent = instructions.length + ' instruções';
    reset();
  }

  document.addEventListener('DOMContentLoaded', wire);

})();