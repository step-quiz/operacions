/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/question-bank.js
 * ROL: Registre de famílies de preguntes i selector per URL.
 * ARQUITECTURA:
 * - Cada generador retorna: { promptTex, solutionTex, options[], meta{} }
 * - FASE 10: Afegides dues famílies trigonomètriques amb argument polinòmic:
 *     'chain-sin-poly2' → f(x) = sin(x²+bx+c), f'(x) = (2x+b)·cos(x²+bx+c)
 *     'chain-cos-poly2' → f(x) = cos(x²+bx+c), f'(x) = −(2x+b)·sin(x²+bx+c)
 *   b ∈ {0,1,2,3,−1,−2,−3}, c ∈ {1,2,3,−1,−2,−3}
 *   URLs d'exemple:
 *     ?families=chain-sin-poly2
 *     ?families=chain-cos-poly2
 *     ?families=chain-sin-poly2,chain-cos-poly2
 *     ?families=chain-sin-int,chain-cos-int,chain-sin-poly2,chain-cos-poly2
 * DEPENDÈNCIES: Requereix math-engine.js i distractor-lib.js.
 * ============================================================================
 */

// =========================================================================
// AUXILIAR INTERN
// =========================================================================
const SCOPE_EXP_KX = ['universal', 'linear-inner', 'family:exp'];

function _selectDistractors(pool, correctTex, count, fallbacks) {
    const seen  = new Set([correctTex]);
    const valid = [];
    pool.forEach(d => {
        if (d.tex && d.tex.trim() !== '' && !seen.has(d.tex)) {
            seen.add(d.tex);
            valid.push(d);
        }
    });
    fallbacks.forEach(fb => {
        if (valid.length < count && !seen.has(fb.tex)) {
            seen.add(fb.tex);
            valid.push(fb);
        }
    });
    return valid.sort(() => Math.random() - 0.5).slice(0, count);
}

// =========================================================================
// AUXILIARS DE FORMAT
// =========================================================================
function _fmtLinear(a, b) {
    const aPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
    if (b === 0) return aPart;
    return `${aPart}${b > 0 ? `+${b}` : b}`;
}
function _fmtPoly2(b, c) {
    let s = 'x^2';
    if (b !== 0) s += b > 0 ? `+${b}x` : `${b}x`;
    if (c !== 0) s += c > 0 ? `+${c}` : `${c}`;
    return s;
}
function _fmtPoly2Deriv(b) {
    if (b === 0)  return '2x';
    if (b === 1)  return '2x+1';
    if (b === -1) return '2x-1';
    return b > 0 ? `2x+${b}` : `2x${b}`;
}
function _fmtConst(a) {
    if (a ===  1) return '1';
    if (a === -1) return '-1';
    return String(a);
}
function _kxArg(k) {
    if (k ===  1) return 'x';
    if (k === -1) return '-x';
    return `${k}x`;
}
function _trigTerm(k, fn, arg) {
    const fnArg = `\\${fn}(${arg})`;
    if (k ===  1) return fnArg;
    if (k === -1) return `-${fnArg}`;
    return `${k}${fnArg}`;
}
function _wrapIfNeeded(tex) {
    let depth = 0;
    for (let i = 0; i < tex.length; i++) {
        const c = tex[i];
        if (c === '{') { depth++; continue; }
        if (c === '}') { depth--; continue; }
        if (depth === 0) {
            if (c === '+') return `(${tex})`;
            if (c === '-' && i > 0) return `(${tex})`;
        }
    }
    return tex;
}
/** Formata (pDeriv)·fn(arg) amb parèntesis al factor si cal.
 *  Delega la detecció a _wrapIfNeeded, que analitza la profunditat
 *  de claus LaTeX i evita falsos positius dins \frac{}{} i similars. */
function _polyCoefTrig(pDeriv, fn, arg) {
    const fnArg    = `\\${fn}(${arg})`;
    const coefPart = _wrapIfNeeded(pDeriv);
    return `${coefPart}${fnArg}`;
}

// =========================================================================
// FAMÍLIES: e^{kx}
// =========================================================================
function generateExpKxInt() {
    const k   = MathEngine.generateKExp();   // exclou k=±1 (derivada trivial)
    const kv  = MathEngine.buildKVars(k);
    const fns = { g: arg => `e^{${arg}}`, dg: arg => `e^{${arg}}`, intG: arg => `e^{${arg}}` };
    const solutionTex = `${kv.coef}${fns.dg(kv.kx)}`;
    const pool      = DistractorLib.build(kv, fns, SCOPE_EXP_KX);
    const fallbacks = [
        { tex: `e^{${kv.kx}}+C`, feedback: "Això sembla una integral, no una derivada.",             errorType: 'INTEGRAL_CONFUSION', scope: 'family:exp' },
        { tex: `0`,               feedback: "La derivada d'una exponencial no és zero.",               errorType: 'NO_DERIVATIVE',      scope: 'universal'  },
        { tex: `x e^{x-1}`,       feedback: "No apliquis la regla de la potència a una exponencial.", errorType: 'POWER_WRONG_EXP',    scope: 'family:exp' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = e^{${kv.kx}}`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'chain-rule', outerFn: 'exp', innerFn: 'linear-int', params: { k }, ruleLabel: 'Regla de la cadena' }
    };
}
function generateExpKxFrac() {
    const frac = MathEngine.generateFractionK();
    const kv   = MathEngine.buildFracKVars(frac);
    const fns  = { g: arg => `e^{${arg}}`, dg: arg => `e^{${arg}}`, intG: arg => `e^{${arg}}` };
    const solutionTex = `${kv.coef}${fns.dg(kv.kx)}`;
    const pool      = DistractorLib.build(kv, fns, SCOPE_EXP_KX);
    const absP      = Math.abs(frac.num);
    const absPStr   = absP === 1 ? "" : absP;
    const fallbacks = [
        { tex: `\\frac{1}{${frac.den}} e^{${kv.kx}}`, feedback: "Revisa el coeficient de la regla de la cadena.", errorType: 'CHAIN_WRONG_COEF', scope: 'linear-inner' },
        { tex: `${absPStr} e^{${kv.kx}}`,             feedback: "Has oblidat el denominador de la fracció.",      errorType: 'CHAIN_WRONG_COEF', scope: 'linear-inner' },
        { tex: `e^{${kv.kx}}`,                        feedback: "Has oblidat aplicar la regla de la cadena.",     errorType: 'CHAIN_FORGOT',     scope: 'universal'    }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = e^{${kv.kx}}`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'chain-rule', outerFn: 'exp', innerFn: 'linear-frac', params: { num: frac.num, den: frac.den }, ruleLabel: 'Regla de la cadena' }
    };
}

// =========================================================================
// FAMÍLIA: x^n
// =========================================================================
function generatePowerInt() {
    const candidates  = [-3, -2, 2, 2, 3, 3, 4, 5];
    const n           = candidates[Math.floor(Math.random() * candidates.length)];
    const fmt         = MathEngine.formatPowerTerm;
    const solutionTex = fmt(n, n - 1);
    const pool        = DistractorLib.buildPower(n);
    const fallbacks   = [{ tex: fmt(n + 1, n), feedback: "L'exponent ha de disminuir en 1 quan derivem, no augmentar.", errorType: 'POWER_WRONG_EXP', scope: 'rule:power' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = x^{${n}}`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'power-rule', outerFn: 'power', innerFn: 'identity', params: { n }, ruleLabel: 'Regla de la potència' }
    };
}

// =========================================================================
// FAMÍLIES: logaritme
// =========================================================================
function generateLogKx() {
    const k = [2,2,3,3,4,5][Math.floor(Math.random()*6)];
    const solutionTex = '\\frac{1}{x}';
    const pool      = DistractorLib.buildLog('kx', { k });
    const fallbacks = [{ tex:`\\frac{${k}}{x}`, feedback:"Gairebé bé, però k/(kx) simplifica a 1/x.", errorType:'CHAIN_WRONG_COEF', scope:'family:log-kx' }, { tex:`\\frac{1}{${k}x}`, feedback:"Has oblidat la k del numerador.", errorType:'LOG_FORGOT_CHAIN', scope:'family:log-kx' }, { tex:`\\ln(${k}x)`, feedback:"Aquesta és la funció original.", errorType:'NO_DERIVATIVE', scope:'universal' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = \\ln(${k}x)`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Recorda: la k es cancel·la sempre en ln(kx).", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'log-rule', outerFn:'ln', innerFn:'linear-int', params:{k}, ruleLabel:'Derivada del logaritme' } };
}
function generateLogXn() {
    const n = [2,2,3,3,4][Math.floor(Math.random()*5)];
    const solutionTex = `\\frac{${n}}{x}`;
    const pool = DistractorLib.buildLog('xn', { n });
    const fallbacks = [{ tex:`\\frac{1}{x^{${n}}}`, feedback:"Has oblidat multiplicar per nx^{n-1}.", errorType:'LOG_FORGOT_CHAIN', scope:'family:log-xn' }, { tex:`${n}\\ln(x)`, feedback:"Has usat la propietat però no has derivat.", errorType:'NO_DERIVATIVE', scope:'family:log-xn' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = \\ln(x^{${n}})`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Resposta correcta.", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'log-rule', outerFn:'ln', innerFn:'power', params:{n}, ruleLabel:'Derivada del logaritme' } };
}
function generateLogLinear() {
    let a, b;
    do { a = pick([1,1,2,2,3,-1,-2]); b = pick([1,2,3,-1,-2,-3,0]); } while (a===1 && b===0);
    const arg = _fmtLinear(a, b);
    const aStr = _fmtConst(a);
    const solutionTex = a===1 ? `\\frac{1}{${arg}}` : `\\frac{${aStr}}{${arg}}`;
    const pool = DistractorLib.buildLog('linear', { a, b });
    const fallbacks = [{ tex:`\\frac{1}{${arg}}`, feedback:"Has oblidat multiplicar per la derivada de l'argument.", errorType:'LOG_FORGOT_CHAIN', scope:'family:log-linear' }, { tex:`\\ln(${arg})`, feedback:"Aquesta és la funció original.", errorType:'NO_DERIVATIVE', scope:'universal' }, { tex:`\\frac{${aStr}}{(${arg})^2}`, feedback:"El denominador no va al quadrat.", errorType:'CHAIN_WRONG_COEF', scope:'family:log-linear' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = \\ln(${arg})`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Resposta correcta.", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'log-rule', outerFn:'ln', innerFn:'linear-poly', params:{a,b}, ruleLabel:'Derivada del logaritme' } };
}
function generateLogPoly2() {
    const b = pick([0,1,2,3,-1,-2,-3]);
    const c = pick([1,2,3,-1,-2,-3]);
    const arg = _fmtPoly2(b, c);
    const argDeriv = _fmtPoly2Deriv(b);
    const solutionTex = `\\frac{${argDeriv}}{${arg}}`;
    const pool = DistractorLib.buildLog('poly2', { b, c });
    const fallbacks = [{ tex:`\\frac{1}{${arg}}`, feedback:"Has oblidat derivar l'argument.", errorType:'LOG_FORGOT_CHAIN', scope:'family:log-poly2' }, { tex:`\\frac{${argDeriv}}{(${arg})^2}`, feedback:"El denominador no va al quadrat.", errorType:'CHAIN_WRONG_COEF', scope:'family:log-poly2' }, { tex:`\\ln(${arg})`, feedback:"Aquesta és la funció original.", errorType:'NO_DERIVATIVE', scope:'universal' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = \\ln(${arg})`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Resposta correcta.", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'log-rule', outerFn:'ln', innerFn:'poly2', params:{b,c}, ruleLabel:'Derivada del logaritme' } };
}

// =========================================================================
// FAMÍLIES: sin(kx) i cos(kx)
// =========================================================================
function generateSinKxInt() {
    const candidates  = [-3,-2,-1,-1,1,1,2,3];
    const k           = candidates[Math.floor(Math.random() * candidates.length)];
    const arg         = _kxArg(k);
    const solutionTex = _trigTerm(k, 'cos', arg);
    const pool      = DistractorLib.buildTrig('sin', k);
    const fallbacks = [{ tex:`\\cos(${arg})`, feedback:"Has derivat sin a cos, però has oblidat multiplicar per k.", errorType:'CHAIN_FORGOT', scope:'family:sin' }, { tex:_trigTerm(k,'sin',arg), feedback:"La derivada de sin és cos, no sin.", errorType:'SIN_COS_SWAP', scope:'family:sin' }, { tex:`\\sin(${arg})`, feedback:"Aquesta és la funció original.", errorType:'NO_DERIVATIVE', scope:'universal' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = \\sin(${arg})`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Recorda: (sin(kx))' = k·cos(kx).", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'chain-rule', outerFn:'sin', innerFn:'linear-int', params:{k}, ruleLabel:'Regla de la cadena' } };
}
function generateCosKxInt() {
    const candidates  = [-3,-2,-1,-1,1,1,2,3];
    const k           = candidates[Math.floor(Math.random() * candidates.length)];
    const arg         = _kxArg(k);
    const solutionTex = _trigTerm(-k, 'sin', arg);
    const pool      = DistractorLib.buildTrig('cos', k);
    const fallbacks = [{ tex:_trigTerm(k,'sin',arg), feedback:"Has derivat cos a sin, però has oblidat el signe negatiu.", errorType:'CHAIN_SIGN', scope:'family:cos' }, { tex:_trigTerm(-k,'cos',arg), feedback:"Has posat el signe negatiu però cos no s'ha convertit en sin.", errorType:'SIN_COS_SWAP', scope:'family:cos' }, { tex:`\\cos(${arg})`, feedback:"Aquesta és la funció original.", errorType:'NO_DERIVATIVE', scope:'universal' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = \\cos(${arg})`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Recorda: (cos(kx))' = −k·sin(kx).", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'chain-rule', outerFn:'cos', innerFn:'linear-int', params:{k}, ruleLabel:'Regla de la cadena' } };
}

// =========================================================================
// FAMÍLIA: sin(x²+bx+c) — derivada (2x+b)·cos(x²+bx+c)
// =========================================================================
function generateSinPoly2() {
    const b = pick([0, 1, 2, 3, -1, -2, -3]);
    const c = pick([1, 2, 3, -1, -2, -3]);

    const arg         = _fmtPoly2(b, c);
    const pDeriv      = _fmtPoly2Deriv(b);
    const solutionTex = _polyCoefTrig(pDeriv, 'cos', arg);

    const pool      = DistractorLib.buildTrig('sin-poly2', { b, c });
    const fallbacks = [
        { tex: `\\cos(${arg})`,                          feedback: "Has derivat sin a cos, però has oblidat multiplicar per p'(x) = 2x+b.",                        errorType: 'CHAIN_FORGOT',    scope: 'family:sin-poly2' },
        { tex: _polyCoefTrig(pDeriv, 'sin', arg),        feedback: "Has multiplicat per p'(x), però la derivada de sin és cos, no sin.",                           errorType: 'SIN_COS_SWAP',    scope: 'family:sin-poly2' },
        { tex: `-${_polyCoefTrig(pDeriv, 'cos', arg)}`,  feedback: "La derivada de sin és +cos·p', no −cos·p'. El signe negatiu és de la derivada de cos.",        errorType: 'CHAIN_SIGN',      scope: 'family:sin-poly2' },
        { tex: `\\sin(${arg})`,                          feedback: "Aquesta és la funció original, no la seva derivada.",                                           errorType: 'NO_DERIVATIVE',   scope: 'universal'         }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = \\sin(${arg})`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Has aplicat la regla de la cadena: (sin(p(x)))' = p'(x)·cos(p(x)).", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'chain-rule', outerFn: 'sin', innerFn: 'poly2', params: { b, c }, ruleLabel: 'Regla de la cadena' }
    };
}

// =========================================================================
// FAMÍLIA: cos(x²+bx+c) — derivada −(2x+b)·sin(x²+bx+c)
// =========================================================================
function generateCosPoly2() {
    const b = pick([0, 1, 2, 3, -1, -2, -3]);
    const c = pick([1, 2, 3, -1, -2, -3]);

    const arg         = _fmtPoly2(b, c);
    const pDeriv      = _fmtPoly2Deriv(b);
    const solutionTex = `-${_polyCoefTrig(pDeriv, 'sin', arg)}`;

    const pool      = DistractorLib.buildTrig('cos-poly2', { b, c });
    const fallbacks = [
        { tex: _polyCoefTrig(pDeriv, 'sin', arg),        feedback: "Has derivat cos a sin i has multiplicat per p'(x), però falta el signe negatiu: (cos u)' = −sin(u)·u'.", errorType: 'CHAIN_SIGN',    scope: 'family:cos-poly2' },
        { tex: `-${_polyCoefTrig(pDeriv, 'cos', arg)}`,  feedback: "Has posat el signe negatiu, però la derivada de cos és −sin, no −cos.",                               errorType: 'SIN_COS_SWAP',  scope: 'family:cos-poly2' },
        { tex: `-\\sin(${arg})`,                         feedback: "Has derivat cos a −sin, però has oblidat multiplicar per p'(x) = 2x+b.",                              errorType: 'CHAIN_FORGOT',  scope: 'family:cos-poly2' },
        { tex: `\\cos(${arg})`,                          feedback: "Aquesta és la funció original, no la seva derivada.",                                                  errorType: 'NO_DERIVATIVE', scope: 'universal'         }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = \\cos(${arg})`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Has aplicat la regla de la cadena: (cos(p(x)))' = −p'(x)·sin(p(x)).", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'chain-rule', outerFn: 'cos', innerFn: 'poly2', params: { b, c }, ruleLabel: 'Regla de la cadena' }
    };
}

// =========================================================================
// CATÀLEG DE PARELLS (producte i quocient)
// =========================================================================
const FUNCTION_PAIRS = [
    { fTex:'x',    gTex:'e^{x}',    dfTex:'1',    dgTex:'e^{x}',        dfgTex:'e^{x}',      fdgTex:'xe^{x}',      g2Tex:'e^{2x}',    solutionProduct:'e^{x}+xe^{x}',         solutionQuotient:'\\frac{e^{x}-xe^{x}}{e^{2x}}' },
    { fTex:'x^2',  gTex:'e^{x}',    dfTex:'2x',   dgTex:'e^{x}',        dfgTex:'2xe^{x}',    fdgTex:'x^2e^{x}',    g2Tex:'e^{2x}',    solutionProduct:'2xe^{x}+x^2e^{x}',     solutionQuotient:'\\frac{2xe^{x}-x^2e^{x}}{e^{2x}}' },
    { fTex:'x',    gTex:'e^{2x}',   dfTex:'1',    dgTex:'2e^{2x}',      dfgTex:'e^{2x}',     fdgTex:'2xe^{2x}',    g2Tex:'e^{4x}',    solutionProduct:'e^{2x}+2xe^{2x}',      solutionQuotient:'\\frac{e^{2x}-2xe^{2x}}{e^{4x}}' },
    { fTex:'x+1',  gTex:'e^{x}',    dfTex:'1',    dgTex:'e^{x}',        dfgTex:'e^{x}',      fdgTex:'(x+1)e^{x}',  g2Tex:'e^{2x}',    solutionProduct:'e^{x}+(x+1)e^{x}',     solutionQuotient:'\\frac{e^{x}-(x+1)e^{x}}{e^{2x}}' },
    { fTex:'x-2',  gTex:'e^{x}',    dfTex:'1',    dgTex:'e^{x}',        dfgTex:'e^{x}',      fdgTex:'(x-2)e^{x}',  g2Tex:'e^{2x}',    solutionProduct:'e^{x}+(x-2)e^{x}',     solutionQuotient:'\\frac{e^{x}-(x-2)e^{x}}{e^{2x}}' },
    { fTex:'x',    gTex:'\\ln(x)',  dfTex:'1',    dgTex:'\\frac{1}{x}', dfgTex:'\\ln(x)',    fdgTex:'1',           g2Tex:'\\ln^2(x)', solutionProduct:'\\ln(x)+1',             solutionQuotient:'\\frac{\\ln(x)-1}{\\ln^2(x)}' },
    { fTex:'x^2',  gTex:'\\ln(x)',  dfTex:'2x',   dgTex:'\\frac{1}{x}', dfgTex:'2x\\ln(x)',  fdgTex:'x',           g2Tex:'\\ln^2(x)', solutionProduct:'2x\\ln(x)+x',           solutionQuotient:'\\frac{2x\\ln(x)-x}{\\ln^2(x)}' },
    { fTex:'x^3',  gTex:'\\ln(x)',  dfTex:'3x^2', dgTex:'\\frac{1}{x}', dfgTex:'3x^2\\ln(x)',fdgTex:'x^2',         g2Tex:'\\ln^2(x)', solutionProduct:'3x^2\\ln(x)+x^2',       solutionQuotient:'\\frac{3x^2\\ln(x)-x^2}{\\ln^2(x)}' },
    { fTex:'2x+1', gTex:'x^2',      dfTex:'2',    dgTex:'2x',           dfgTex:'2x^2',       fdgTex:'2x(2x+1)',    g2Tex:'x^4',       solutionProduct:'2x^2+2x(2x+1)',         solutionQuotient:'\\frac{2x^2-2x(2x+1)}{x^4}' },
    { fTex:'x',    gTex:'x+3',      dfTex:'1',    dgTex:'1',            dfgTex:'x+3',        fdgTex:'x',           g2Tex:'(x+3)^2',   solutionProduct:'2x+3',                  solutionQuotient:'\\frac{3}{(x+3)^2}' },
    { fTex:'2x-1', gTex:'e^{x}',    dfTex:'2',    dgTex:'e^{x}',        dfgTex:'2e^{x}',     fdgTex:'(2x-1)e^{x}', g2Tex:'e^{2x}',    solutionProduct:'2e^{x}+(2x-1)e^{x}',   solutionQuotient:'\\frac{2e^{x}-(2x-1)e^{x}}{e^{2x}}' },
    { fTex:'x^2',  gTex:'x+2',      dfTex:'2x',   dgTex:'1',            dfgTex:'2x(x+2)',    fdgTex:'x^2',         g2Tex:'(x+2)^2',   solutionProduct:'2x(x+2)+x^2',           solutionQuotient:'\\frac{2x(x+2)-x^2}{(x+2)^2}' },
];

function generateProduct() {
    const pair = FUNCTION_PAIRS[Math.floor(Math.random()*FUNCTION_PAIRS.length)];
    const fDisplay = _wrapIfNeeded(pair.fTex);
    const gDisplay = _wrapIfNeeded(pair.gTex);
    const promptTex = `${fDisplay}\\cdot ${gDisplay}`;
    const solutionTex = pair.solutionProduct;
    const pairCtx = { ...pair, promptTex, solutionTex };
    const pool = DistractorLib.buildProduct(pairCtx);
    const fallbacks = [{ tex:pair.fTex, feedback:"Aquesta és només la primera funció.", errorType:'NO_DERIVATIVE', scope:'universal' }, { tex:pair.gTex, feedback:"Aquesta és només la segona funció.", errorType:'NO_DERIVATIVE', scope:'universal' }, { tex:pair.dfTex, feedback:"Has derivat només f(x).", errorType:'PRODUCT_FORGOT_SUM', scope:'rule:product' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = ${promptTex}`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Has aplicat correctament la regla del producte: (fg)' = f'g + fg'.", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'product-rule', outerFn:pair.fTex, innerFn:pair.gTex, params:{}, ruleLabel:'Regla del producte' } };
}
function generateQuotient() {
    const pair = FUNCTION_PAIRS[Math.floor(Math.random()*FUNCTION_PAIRS.length)];
    const promptTex = `\\frac{${pair.fTex}}{${pair.gTex}}`;
    const solutionTex = pair.solutionQuotient;
    const pairCtx = { ...pair, promptTex, solutionTex };
    const pool = DistractorLib.buildQuotient(pairCtx);
    const fallbacks = [{ tex:promptTex, feedback:"Aquesta és la funció original.", errorType:'NO_DERIVATIVE', scope:'universal' }, { tex:`\\frac{${pair.dfTex}}{${pair.dgTex}}`, feedback:"Has derivat numerador i denominador per separat.", errorType:'QUOTIENT_DENOM', scope:'rule:quotient' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = ${promptTex}`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Has aplicat correctament la regla del quocient: (f'g − fg')/g².", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'quotient-rule', outerFn:pair.fTex, innerFn:pair.gTex, params:{}, ruleLabel:'Regla del quocient' } };
}

// =========================================================================
// REGISTRE DE FAMÍLIES
// =========================================================================
const FamilyRegistry = {
    'chain-exp-int':   generateExpKxInt,
    'chain-exp-frac':  generateExpKxFrac,
    'power':           generatePowerInt,
    'log-kx':          generateLogKx,
    'log-xn':          generateLogXn,
    'log-linear':      generateLogLinear,
    'log-poly2':       generateLogPoly2,
    'chain-sin-int':   generateSinKxInt,
    'chain-cos-int':   generateCosKxInt,
    'chain-sin-poly2': generateSinPoly2,
    'chain-cos-poly2': generateCosPoly2,
    'product':         generateProduct,
    'quotient':        generateQuotient,
};

// =========================================================================
// SELECTOR PER URL
// =========================================================================
function buildActiveFamilies() {
    const raw = new URLSearchParams(window.location.search).get('families');
    if (!raw) return Object.values(FamilyRegistry);
    const active = raw.split(',').map(id => id.trim()).filter(id => FamilyRegistry[id]).map(id => FamilyRegistry[id]);
    return active.length > 0 ? active : Object.values(FamilyRegistry);
}

const activeFamilies = buildActiveFamilies();

function generateChallenge() {
    const generator = activeFamilies[Math.floor(Math.random() * activeFamilies.length)];
    return generator();
}
