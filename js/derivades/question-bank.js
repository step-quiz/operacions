/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/question-bank.js
 * ROL: Registre de famílies de preguntes i selector per URL.
 * ARQUITECTURA:
 * - Cada generador retorna: { promptTex, solutionTex, options[], meta{} }
 * - FASE 7: Afegides dues famílies de logaritme amb argument polinòmic:
 *     'log-linear' → f(x) = ln(ax+b),    f'(x) = a/(ax+b)
 *     'log-poly2'  → f(x) = ln(x²+bx+c), f'(x) = (2x+b)/(x²+bx+c)
 *   URLs d'exemple:
 *     ?families=log-linear
 *     ?families=log-poly2
 *     ?families=log-linear,log-poly2
 *     ?families=log-kx,log-xn,log-linear,log-poly2
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
    const aPart = a ===  1 ? 'x' : a === -1 ? '-x' : `${a}x`;
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

// =========================================================================
// FAMÍLIA: e^{kx} amb k enter
// =========================================================================
function generateExpKxInt() {
    const k   = MathEngine.generateK();
    const kv  = MathEngine.buildKVars(k);
    const fns = { g: arg => `e^{${arg}}`, dg: arg => `e^{${arg}}`, intG: arg => `e^{${arg}}` };
    const solutionTex = `${kv.coef}${fns.dg(kv.kx)}`;
    const pool        = DistractorLib.build(kv, fns, SCOPE_EXP_KX);
    const fallbacks   = [
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

// =========================================================================
// FAMÍLIA: e^{kx} amb k fraccionari
// =========================================================================
function generateExpKxFrac() {
    const frac = MathEngine.generateFractionK();
    const kv   = MathEngine.buildFracKVars(frac);
    const fns  = { g: arg => `e^{${arg}}`, dg: arg => `e^{${arg}}`, intG: arg => `e^{${arg}}` };
    const solutionTex = `${kv.coef}${fns.dg(kv.kx)}`;
    const pool        = DistractorLib.build(kv, fns, SCOPE_EXP_KX);
    const absP        = Math.abs(frac.num);
    const absPStr     = absP === 1 ? "" : absP;
    const fallbacks   = [
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
// FAMÍLIA: ln(kx)
// =========================================================================
function generateLogKx() {
    const candidates  = [2, 2, 3, 3, 4, 5];
    const k           = candidates[Math.floor(Math.random() * candidates.length)];
    const solutionTex = '\\frac{1}{x}';
    const pool        = DistractorLib.buildLog('kx', { k });
    const fallbacks   = [
        { tex: `\\frac{${k}}{x}`,     feedback: "Gairebé bé, però k/(kx) simplifica a 1/x.",              errorType: 'CHAIN_WRONG_COEF',  scope: 'family:log-kx' },
        { tex: `\\frac{1}{${k}x}`,    feedback: "Has oblidat la k del numerador de la regla de la cadena.", errorType: 'LOG_FORGOT_CHAIN',  scope: 'family:log-kx' },
        { tex: `\\ln(${k}x)`,         feedback: "Aquesta és la funció original, no la seva derivada.",      errorType: 'NO_DERIVATIVE',     scope: 'universal'     }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = \\ln(${k}x)`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Recorda: la k es cancel·la sempre en ln(kx).", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'linear-int', params: { k }, ruleLabel: 'Derivada del logaritme' }
    };
}

// =========================================================================
// FAMÍLIA: ln(x^n)
// =========================================================================
function generateLogXn() {
    const candidates  = [2, 2, 3, 3, 4];
    const n           = candidates[Math.floor(Math.random() * candidates.length)];
    const solutionTex = `\\frac{${n}}{x}`;
    const pool        = DistractorLib.buildLog('xn', { n });
    const fallbacks   = [
        { tex: `\\frac{1}{x^{${n}}}`, feedback: "Has oblidat multiplicar per la derivada de l'argument interior (nx^{n-1}).", errorType: 'LOG_FORGOT_CHAIN', scope: 'family:log-xn' },
        { tex: `${n}\\ln(x)`,         feedback: "Has usat la propietat del logaritme però no has derivat el resultat.",       errorType: 'NO_DERIVATIVE',    scope: 'family:log-xn' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: `f(x) = \\ln(x^{${n}})`, solutionTex,
        options: [{ tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true }, ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'power', params: { n }, ruleLabel: 'Derivada del logaritme' }
    };
}

// =========================================================================
// FAMÍLIA: ln(ax+b) — derivada a/(ax+b)
// =========================================================================
function generateLogLinear() {
    // a ∈ {1,2,3,-1,-2}, b ∈ {1,2,3,-1,-2,-3}, (a,b) ≠ (1,0) perquè seria ln(x) trivial
    // Evitem b=0 amb a=1 (seria ln(x), família diferent)
    let a, b;
    do {
        a = pick([1, 1, 2, 2, 3, -1, -2]);
        b = pick([1, 2, 3, -1, -2, -3, 0]);
    } while (a === 1 && b === 0);

    const arg         = _fmtLinear(a, b);
    const aStr        = _fmtConst(a);
    // Solució: a/(ax+b)
    const solutionTex = a === 1 ? `\\frac{1}{${arg}}` : `\\frac{${aStr}}{${arg}}`;

    const pool      = DistractorLib.buildLog('linear', { a, b });
    const fallbacks = [
        { tex: `\\frac{1}{${arg}}`,          feedback: "Has oblidat multiplicar per la derivada de l'argument interior.", errorType: 'LOG_FORGOT_CHAIN', scope: 'family:log-linear' },
        { tex: `\\ln(${arg})`,               feedback: "Aquesta és la funció original, no la seva derivada.",             errorType: 'NO_DERIVATIVE',    scope: 'universal'         },
        { tex: `\\frac{${aStr}}{(${arg})^2}`,feedback: "El denominador no va al quadrat en la derivada d'un logaritme.", errorType: 'CHAIN_WRONG_COEF', scope: 'family:log-linear' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = \\ln(${arg})`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'linear-poly', params: { a, b }, ruleLabel: 'Derivada del logaritme' }
    };
}

// =========================================================================
// FAMÍLIA: ln(x²+bx+c) — derivada (2x+b)/(x²+bx+c)
// =========================================================================
function generateLogPoly2() {
    // b ∈ {0,1,2,3,-1,-2,-3}, c ∈ {1,2,3,-1,-2,-3}
    // c ≠ 0 per evitar ln(x²+bx) = ln(x(x+b)) que porta a una simplificació
    // que podria confondre (ln|x| + ln|x+b|)
    const b = pick([0, 1, 2, 3, -1, -2, -3]);
    const c = pick([1, 2, 3, -1, -2, -3]);

    const arg         = _fmtPoly2(b, c);
    const argDeriv    = _fmtPoly2Deriv(b);
    const solutionTex = `\\frac{${argDeriv}}{${arg}}`;

    const pool      = DistractorLib.buildLog('poly2', { b, c });
    const fallbacks = [
        { tex: `\\frac{1}{${arg}}`,           feedback: "Has oblidat derivar l'argument interior del logaritme.",                  errorType: 'LOG_FORGOT_CHAIN', scope: 'family:log-poly2' },
        { tex: `\\frac{${argDeriv}}{(${arg})^2}`, feedback: "El denominador no va al quadrat en la derivada d'un logaritme.",     errorType: 'CHAIN_WRONG_COEF', scope: 'family:log-poly2' },
        { tex: `\\ln(${arg})`,                feedback: "Aquesta és la funció original, no la seva derivada.",                     errorType: 'NO_DERIVATIVE',    scope: 'universal'         }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = \\ln(${arg})`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'poly2', params: { b, c }, ruleLabel: 'Derivada del logaritme' }
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
    // 'chain-sin-int':  generateSinKxInt,  // propera: sin(kx)
    // 'product':        generateProduct,   // futura: regla del producte
    // 'quotient':       generateQuotient,  // futura: regla del quocient
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
