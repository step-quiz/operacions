// ════════════════════════════════════════════════════════
// parser.js — Classe Parser: tokens → AST
// ════════════════════════════════════════════════════════

class KarelSyntaxError extends Error {
  constructor(msg, code, line) {
    super(msg);
    this.code      = code;
    this.errorLine = line ?? null;
  }
}

class Parser {
  constructor(toks) { this.toks = toks; this.i = 0; }
  peek() { return this.toks[this.i]; }
  next() { return this.toks[this.i++]; }

  eat(t, v) {
    const tok = this.peek();
    if (tok.t !== t || (v !== undefined && tok.v !== v)) {
      const got  = tok.v ?? tok.t;
      const want = v ?? t;
      const errCode = (t === '{' || t === '}') ? 'syntax_brace'
                    : (t === '(' || t === ')') ? 'syntax_paren'
                    : t === 'N'                ? 'syntax_number'
                    :                            'syntax_instr';
      throw new KarelSyntaxError(
        K.tf('parse.expected', { want, got, n: tok.line }),
        errCode,
        tok.line
      );
    }
    return this.next();
  }

  parseAll() {
    const s = [];
    while (this.peek().t !== 'EOF') s.push(this.parseStmt());
    return s;
  }

  parseStmt() {
    const tok  = this.peek();
    const line = tok.line;
    const L    = K.lang;

    if (tok.t !== 'W') {
      throw new KarelSyntaxError(
        K.tf('parse.unexpected', { tok: tok.v ?? tok.t, n: line }),
        'syntax_instr', line
      );
    }

    const w = tok.v;

    if (L.COMMANDS.has(w))  { this.next(); return { type: 'command', name: w, line }; }

    if (w === L.KW_IF) {
      this.next(); this.eat('(');
      const cond = this.parseCond();
      this.eat(')');
      const thenB = this.parseBlock();
      let elseB = [];
      const nxt = this.peek();
      if (nxt.t === 'W' && L.KW_ELSE_ALIASES.includes(nxt.v)) {
        this.next();
        elseB = this.parseBlock();
      }
      return { type: 'if', cond, then: thenB, else: elseB, line };
    }

    if (w === L.KW_WHILE) {
      this.next(); this.eat('(');
      const cond = this.parseCond();
      this.eat(')');
      return { type: 'while', cond, body: this.parseBlock(), line };
    }

    if (w === L.KW_REPEAT) {
      this.next(); this.eat('(');
      const num = this.eat('N');
      this.eat(')');
      return { type: 'repeat', count: num.v, body: this.parseBlock(), line };
    }

    if (w === L.KW_PROC) {
      this.next();
      const nt = this.peek();
      if (nt.t !== 'W') {
        throw new KarelSyntaxError(
          K.tf('parse.expected_proc', { n: nt.line }),
          'syntax_instr', nt.line
        );
      }
      const name = nt.v;
      this.next();
      return { type: 'proc', name, body: this.parseBlock(), line };
    }

    // Crida a procediment definit per l'usuari
    this.next();
    return { type: 'call', name: w, line };
  }

  parseBlock() {
    this.eat('{');
    const s = [];
    while (this.peek().t !== '}' && this.peek().t !== 'EOF') s.push(this.parseStmt());
    this.eat('}');
    return s;
  }

  parseCond()    { return this.parseOrCond(); }

  parseOrCond() {
    let l = this.parseAndCond();
    while (this.peek().t === 'W' && this.peek().v === K.lang.KW_OR) {
      const ln = this.peek().line;
      this.next();
      l = { type: 'or', left: l, right: this.parseAndCond(), ln };
    }
    return l;
  }

  parseAndCond() {
    let l = this.parseNotCond();
    while (this.peek().t === 'W' && this.peek().v === K.lang.KW_AND) {
      const ln = this.peek().line;
      this.next();
      l = { type: 'and', left: l, right: this.parseNotCond(), ln };
    }
    return l;
  }

  parseNotCond() {
    const tok = this.peek();
    if (tok.t === 'W' && tok.v === K.lang.KW_NOT) {
      const line = tok.line;
      this.next(); this.eat('(');
      const inner = this.parseCond();
      this.eat(')');
      return { type: 'not', inner, line };
    }
    return this.parseAtomCond();
  }

  parseAtomCond() {
    const tok = this.peek(), line = tok.line;
    if (tok.t === 'W' && K.lang.CONDS.has(tok.v)) {
      this.next();
      return { type: 'condition', name: tok.v, line };
    }
    throw new KarelSyntaxError(
      K.tf('parse.unknown_cond', { tok: tok.v ?? tok.t, n: line }),
      'syntax_cond', line
    );
  }
}

// Parseja codi: retorna AST o null (si error, crida logError)
function parseCode(code) {
  try {
    return new Parser(K.tokenize(code)).parseAll();
  } catch (e) {
    const ln      = (e instanceof KarelSyntaxError) ? e.errorLine : null;
    const errCode = (e instanceof KarelSyntaxError) ? e.code : 'syntax_instr';
    K.logError(`❌ ${K.t('err.syntax')}: ${e.message}`, errCode, ln);
    if (ln) K.markErrorLine(ln);
    K.setStateUI('error');
    return null;
  }
}

K.KarelSyntaxError = KarelSyntaxError;
K.Parser           = Parser;
K.parseCode        = parseCode;
