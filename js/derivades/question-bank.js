/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/question-bank.js
 * ROL: Registre de famílies de preguntes i selector per URL.
 * ARQUITECTURA:
 * - Cada generador retorna: { promptTex, solutionTex, options[], meta{} }
 * - FASE 8 (fix): Corregits dos bugs de la regla del producte/quocient:
 *     1. _wrapIfNeeded(): afegeix parèntesis a fTex/gTex quan contenen + o -
 *        a nivell arrel (evita f(x) = x+1 · x-1 sense parèntesis).
 *     2. Eliminat el parell x²·x³ del catàleg (simplifica trivialment a x⁵
 *        i x²/x³ a x^{-1}; no té valor pedagògic com a exercici de regles).
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
// AUXILIARS DE FORMAT (compartits pels generadors de logaritme)
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

/**
 * _wrapIfNeeded(tex)
 * Retorna tex entre parèntesis si conté un + o - a nivell arrel
 * (fora de claus LaTeX {}). Evita que "x+1 \cdot x-1" es mostri
 * sense parèntesis quan s'usa com a factor d'un producte.
 *
 * Exemples:
 *   'x^2'    → 'x^2'       (sense canvi)
 *   'x+1'    → '(x+1)'     (afegeix parèntesis)
 *   'x-1'    → '(x-1)'     (afegeix parèntesis)
 *   'e^{2x}' → 'e^{2x}'    (el + és dins {}, no compta)
 *   '\\ln(x)'→ '\\ln(x)'   (sense + ni - a nivell arrel)
 */
function _wrapIfNeeded(tex) {
    let depth = 0;
    for (let i = 0; i < tex.length; i++) {
        const c = tex[i];
        if (c === '{') { depth++; continue; }
        if (c === '}') { depth--; continue; }
        if (depth === 0) {
            // + sempre indica suma visible
            if (c === '+') return `(${tex})`;
            // - només si no és el primer caràcter (evita "-x" que és un terme negatiu simple)
            if (c === '-' && i > 0) return `(${tex})`;
        }
    }
    return tex;
}

// =========================================================================
// FAMÍLIES: e^{kx}
// =========================================================================
function generateExpKxInt() {
    const k   = MathEngine.generateK();
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
    const candidates  = [2, 2, 3, 3, 4, 5];
    const k           = candidates[Math.floor(Math.random() * candidates.length)];
    const solutionTex = '\\frac{1}{x}';
    const pool      = DistractorLib.buildLog('kx', { k });
    const fallbacks = [
        { tex: `\\frac{${k}}{x}`,  feedback: "Gairebé bé, però k/(kx) simplifica a 1/x.",              errorType: 'CHAIN_WRONG_COEF', scope: 'family:log-kx' },
        { tex: `\\frac{1}{${k}x}`, feedback: "Has oblidat la k del numerador de la regla de la cadena.", errorType: 'LOG_FORGOT_CHAIN', scope: 'family:log-kx' },
        { tex: `\\ln(${k}x)`,      feedback: "Aquesta és la funció original, no la seva derivada.",      errorType: 'NO_DERIVATIVE',   scope: 'universal'     }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = \\ln(${k}x)`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Recorda: la k es cancel·la sempre en ln(kx).", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'linear-int', params: { k }, ruleLabel: 'Derivada del logaritme' }
    };
}

function generateLogXn() {
    const candidates  = [2, 2, 3, 3, 4];
    const n           = candidates[Math.floor(Math.random() * candidates.length)];
    const solutionTex = `\\frac{${n}}{x}`;
    const pool      = DistractorLib.buildLog('xn', { n });
    const fallbacks = [
        { tex: `\\frac{1}{x^{${n}}}`, feedback: "Has oblidat multiplicar per la derivada de l'argument interior (nx^{n-1}).", errorType: 'LOG_FORGOT_CHAIN', scope: 'family:log-xn' },
        { tex: `${n}\\ln(x)`,         feedback: "Has usat la propietat del logaritme però no has derivat el resultat.",       errorType: 'NO_DERIVATIVE',   scope: 'family:log-xn' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = \\ln(x^{${n}})`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'power', params: { n }, ruleLabel: 'Derivada del logaritme' }
    };
}

function generateLogLinear() {
    let a, b;
    do {
        a = pick([1, 1, 2, 2, 3, -1, -2]);
        b = pick([1, 2, 3, -1, -2, -3, 0]);
    } while (a === 1 && b === 0);
    const arg         = _fmtLinear(a, b);
    const aStr        = _fmtConst(a);
    const solutionTex = a === 1 ? `\\frac{1}{${arg}}` : `\\frac{${aStr}}{${arg}}`;
    const pool      = DistractorLib.buildLog('linear', { a, b });
    const fallbacks = [
        { tex: `\\frac{1}{${arg}}`,           feedback: "Has oblidat multiplicar per la derivada de l'argument interior.", errorType: 'LOG_FORGOT_CHAIN', scope: 'family:log-linear' },
        { tex: `\\ln(${arg})`,                feedback: "Aquesta és la funció original, no la seva derivada.",             errorType: 'NO_DERIVATIVE',   scope: 'universal'         },
        { tex: `\\frac{${aStr}}{(${arg})^2}`, feedback: "El denominador no va al quadrat en la derivada d'un logaritme.", errorType: 'CHAIN_WRONG_COEF', scope: 'family:log-linear' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = \\ln(${arg})`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'linear-poly', params: { a, b }, ruleLabel: 'Derivada del logaritme' }
    };
}

function generateLogPoly2() {
    const b = pick([0, 1, 2, 3, -1, -2, -3]);
    const c = pick([1, 2, 3, -1, -2, -3]);
    const arg         = _fmtPoly2(b, c);
    const argDeriv    = _fmtPoly2Deriv(b);
    const solutionTex = `\\frac{${argDeriv}}{${arg}}`;
    const pool      = DistractorLib.buildLog('poly2', { b, c });
    const fallbacks = [
        { tex: `\\frac{1}{${arg}}`,               feedback: "Has oblidat derivar l'argument interior del logaritme.",             errorType: 'LOG_FORGOT_CHAIN', scope: 'family:log-poly2' },
        { tex: `\\frac{${argDeriv}}{(${arg})^2}`, feedback: "El denominador no va al quadrat en la derivada d'un logaritme.",     errorType: 'CHAIN_WRONG_COEF', scope: 'family:log-poly2' },
        { tex: `\\ln(${arg})`,                    feedback: "Aquesta és la funció original, no la seva derivada.",                errorType: 'NO_DERIVATIVE',   scope: 'universal'         }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = \\ln(${arg})`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'poly2', params: { b, c }, ruleLabel: 'Derivada del logaritme' }
    };
}

// =========================================================================
// CATÀLEG DE PARELLS DE FUNCIONS (producte i quocient)
//
// Criteris d'inclusió:
// - Cap parell simplificable trivialment (x^a · x^b, x^a / x^b eliminats).
// - fTex i gTex estan en forma canònica sense parèntesis externs;
//   generateProduct() i generateQuotient() afegeixen parèntesis si cal
//   via _wrapIfNeeded().
// =========================================================================
const FUNCTION_PAIRS = [
    // x · e^x
    {
        fTex: 'x',           gTex: 'e^{x}',
        dfTex: '1',          dgTex: 'e^{x}',
        dfgTex: 'e^{x}',     fdgTex: 'xe^{x}',
        g2Tex: 'e^{2x}',
        solutionProduct:  'e^{x}+xe^{x}',
        solutionQuotient: '\\frac{e^{x}-xe^{x}}{e^{2x}}'
    },
    // x² · e^x
    {
        fTex: 'x^2',         gTex: 'e^{x}',
        dfTex: '2x',         dgTex: 'e^{x}',
        dfgTex: '2xe^{x}',   fdgTex: 'x^2e^{x}',
        g2Tex: 'e^{2x}',
        solutionProduct:  '2xe^{x}+x^2e^{x}',
        solutionQuotient: '\\frac{2xe^{x}-x^2e^{x}}{e^{2x}}'
    },
    // x · e^{2x}
    {
        fTex: 'x',           gTex: 'e^{2x}',
        dfTex: '1',          dgTex: '2e^{2x}',
        dfgTex: 'e^{2x}',    fdgTex: '2xe^{2x}',
        g2Tex: 'e^{4x}',
        solutionProduct:  'e^{2x}+2xe^{2x}',
        solutionQuotient: '\\frac{e^{2x}-2xe^{2x}}{e^{4x}}'
    },
    // (x+1) · e^x
    {
        fTex: 'x+1',         gTex: 'e^{x}',
        dfTex: '1',          dgTex: 'e^{x}',
        dfgTex: 'e^{x}',     fdgTex: '(x+1)e^{x}',
        g2Tex: 'e^{2x}',
        solutionProduct:  'e^{x}+(x+1)e^{x}',
        solutionQuotient: '\\frac{e^{x}-(x+1)e^{x}}{e^{2x}}'
    },
    // (x-2) · e^x
    {
        fTex: 'x-2',         gTex: 'e^{x}',
        dfTex: '1',          dgTex: 'e^{x}',
        dfgTex: 'e^{x}',     fdgTex: '(x-2)e^{x}',
        g2Tex: 'e^{2x}',
        solutionProduct:  'e^{x}+(x-2)e^{x}',
        solutionQuotient: '\\frac{e^{x}-(x-2)e^{x}}{e^{2x}}'
    },
    // x · ln(x)
    {
        fTex: 'x',           gTex: '\\ln(x)',
        dfTex: '1',          dgTex: '\\frac{1}{x}',
        dfgTex: '\\ln(x)',   fdgTex: '1',
        g2Tex: '\\ln^2(x)',
        solutionProduct:  '\\ln(x)+1',
        solutionQuotient: '\\frac{\\ln(x)-1}{\\ln^2(x)}'
    },
    // x² · ln(x)
    {
        fTex: 'x^2',            gTex: '\\ln(x)',
        dfTex: '2x',            dgTex: '\\frac{1}{x}',
        dfgTex: '2x\\ln(x)',    fdgTex: 'x',
        g2Tex: '\\ln^2(x)',
        solutionProduct:  '2x\\ln(x)+x',
        solutionQuotient: '\\frac{2x\\ln(x)-x}{\\ln^2(x)}'
    },
    // x³ · ln(x)
    {
        fTex: 'x^3',             gTex: '\\ln(x)',
        dfTex: '3x^2',           dgTex: '\\frac{1}{x}',
        dfgTex: '3x^2\\ln(x)',   fdgTex: 'x^2',
        g2Tex: '\\ln^2(x)',
        solutionProduct:  '3x^2\\ln(x)+x^2',
        solutionQuotient: '\\frac{3x^2\\ln(x)-x^2}{\\ln^2(x)}'
    },
    // (2x+1) · x²  [FIX: eliminat x²·x³ substituït per aquest]
    {
        fTex: '2x+1',        gTex: 'x^2',
        dfTex: '2',          dgTex: '2x',
        dfgTex: '2x^2',      fdgTex: '2x(2x+1)',
        g2Tex: 'x^4',
        solutionProduct:  '2x^2+2x(2x+1)',
        solutionQuotient: '\\frac{2x^2-2x(2x+1)}{x^4}'
    },
    // x · (x+3)
    {
        fTex: 'x',           gTex: 'x+3',
        dfTex: '1',          dgTex: '1',
        dfgTex: 'x+3',       fdgTex: 'x',
        g2Tex: '(x+3)^2',
        solutionProduct:  'x+3+x',
        solutionQuotient: '\\frac{x+3-x}{(x+3)^2}'
    },
    // (x+1) · (x-1)
    {
        fTex: 'x+1',         gTex: 'x-1',
        dfTex: '1',          dgTex: '1',
        dfgTex: 'x-1',       fdgTex: 'x+1',
        g2Tex: '(x-1)^2',
        solutionProduct:  'x-1+x+1',
        solutionQuotient: '\\frac{x-1-(x+1)}{(x-1)^2}'
    },
    // x² · (x+2)
    {
        fTex: 'x^2',          gTex: 'x+2',
        dfTex: '2x',          dgTex: '1',
        dfgTex: '2x(x+2)',    fdgTex: 'x^2',
        g2Tex: '(x+2)^2',
        solutionProduct:  '2x(x+2)+x^2',
        solutionQuotient: '\\frac{2x(x+2)-x^2}{(x+2)^2}'
    },
];

// =========================================================================
// FAMÍLIA: Regla del producte f(x)·g(x)
// =========================================================================
function generateProduct() {
    const pair        = FUNCTION_PAIRS[Math.floor(Math.random() * FUNCTION_PAIRS.length)];
    // _wrapIfNeeded afegeix parèntesis si fTex o gTex contenen + o - a nivell arrel
    const fDisplay    = _wrapIfNeeded(pair.fTex);
    const gDisplay    = _wrapIfNeeded(pair.gTex);
    const promptTex   = `${fDisplay}\\cdot ${gDisplay}`;
    const solutionTex = pair.solutionProduct;
    const pairCtx     = { ...pair, promptTex, solutionTex };

    const pool      = DistractorLib.buildProduct(pairCtx);
    const fallbacks = [
        { tex: pair.fTex,  feedback: "Aquesta és només la primera funció, no la derivada del producte.", errorType: 'NO_DERIVATIVE',      scope: 'universal'    },
        { tex: pair.gTex,  feedback: "Aquesta és només la segona funció, no la derivada del producte.",  errorType: 'NO_DERIVATIVE',      scope: 'universal'    },
        { tex: pair.dfTex, feedback: "Has derivat només f(x). Has de tenir en compte g(x) també.",       errorType: 'PRODUCT_FORGOT_SUM', scope: 'rule:product' },
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = ${promptTex}`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Has aplicat correctament la regla del producte: (fg)' = f'g + fg'.", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'product-rule', outerFn: pair.fTex, innerFn: pair.gTex, params: {}, ruleLabel: 'Regla del producte' }
    };
}

// =========================================================================
// FAMÍLIA: Regla del quocient f(x)/g(x)
// =========================================================================
function generateQuotient() {
    const pair        = FUNCTION_PAIRS[Math.floor(Math.random() * FUNCTION_PAIRS.length)];
    // \frac{}{} ja proporciona separació visual; no calen parèntesis addicionals
    const promptTex   = `\\frac{${pair.fTex}}{${pair.gTex}}`;
    const solutionTex = pair.solutionQuotient;
    const pairCtx     = { ...pair, promptTex, solutionTex };

    const pool      = DistractorLib.buildQuotient(pairCtx);
    const fallbacks = [
        { tex: promptTex,                              feedback: "Aquesta és la funció original, no la seva derivada.",                                      errorType: 'NO_DERIVATIVE',   scope: 'universal'     },
        { tex: `\\frac{${pair.dfTex}}{${pair.dgTex}}`, feedback: "Has derivat numerador i denominador per separat, però la regla del quocient és (f'g − fg')/g².", errorType: 'QUOTIENT_DENOM', scope: 'rule:quotient' },
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = ${promptTex}`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Has aplicat correctament la regla del quocient: (f'g − fg')/g².", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'quotient-rule', outerFn: pair.fTex, innerFn: pair.gTex, params: {}, ruleLabel: 'Regla del quocient' }
    };
}

// =========================================================================
// REGISTRE DE FAMÍLIES
// =========================================================================
const FamilyRegistry = {
    'chain-exp-int':  generateExpKxInt,
    'chain-exp-frac': generateExpKxFrac,
    'power':          generatePowerInt,
    'log-kx':         generateLogKx,
    'log-xn':         generateLogXn,
    'log-linear':     generateLogLinear,
    'log-poly2':      generateLogPoly2,
    'product':        generateProduct,
    'quotient':       generateQuotient,
    // 'chain-sin-int':  generateSinKxInt,  // propera: sin(kx)
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
