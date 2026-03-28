/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/question-bank.js
 * ROL: Registre de famílies de preguntes i selector per URL.
 * ARQUITECTURA:
 * - Cada generador retorna: { promptTex, solutionTex, options[], meta{} }
 * - Encapsulat com a IIFE → window.QuestionBank (mateix patró que MathEngine
 *   i DistractorLib). Cap símbol intern pol·lueix el scope global.
 * - API pública:
 *     generateChallenge()  → repte aleatori de la família activa
 *     FamilyRegistry       → mapa id → funció generadora
 *     activeFamilies       → llista de generadors actius (segons URL)
 *     _testing             → { _selectDistractors, FUNCTION_PAIRS }
 *                            (exposat exclusivament per a run-tests.js)
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

window.QuestionBank = (() => {

// =========================================================================
// AUXILIAR INTERN
// =========================================================================
const SCOPE_EXP_KX = ['universal', 'linear-inner', 'family:exp'];

/**
 * Selecciona `count` distractors del pool garantint diversitat de errorType.
 *
 * Algorisme:
 *  1. Deduplicació global (pool + fallbacks), excloent la solució correcta.
 *  2. Agrupació per errorType.
 *  3. Barreja aleatòria dins cada grup.
 *  4. Round-robin entre grups: un per tipus per ronda fins arribar a `count`.
 *     NO_DERIVATIVE va sempre primer (error pedagògic fonamental: l'alumne
 *     ha de reconèixer que la funció original no és la derivada).
 *
 * Garantia: si hi ha ≥3 errorTypes al pool, els 3 distractors seran de
 * tipus diferents. Si n'hi ha menys, es repeteix el tipus menys representat.
 *
 * @param {object[]} pool       Distractors principals (de distractor-lib)
 * @param {string}   correctTex LaTeX de la solució correcta (s'exclou)
 * @param {number}   count      Nombre de distractors a retornar (normalment 3)
 * @param {object[]} fallbacks  Distractors de reserva si el pool és insuficient
 * @returns {object[]}
 */
function _selectDistractors(pool, correctTex, count, fallbacks) {
    // 1. Deduplicació: pool primer, fallbacks només si cal
    const seen  = new Set([correctTex]);
    const valid = [];
    [...pool, ...fallbacks].forEach(d => {
        if (d.tex && d.tex.trim() !== '' && !seen.has(d.tex)) {
            seen.add(d.tex);
            valid.push(d);
        }
    });

    // Cas degenerat: menys candidats que count → retorna tots barrejats
    if (valid.length <= count) return valid.sort(() => Math.random() - 0.5);

    // 2. Agrupa per errorType i barreja dins cada grup
    const byType = {};
    valid.forEach(d => {
        const t = d.errorType || 'OTHER';
        if (!byType[t]) byType[t] = [];
        byType[t].push(d);
    });
    Object.values(byType).forEach(arr => arr.sort(() => Math.random() - 0.5));

    // 3. Ordena els tipus amb prioritats pedagògiques fixes:
    //    [FIX PEDAGÒGIC] CHAIN_FORGOT / LOG_FORGOT_CHAIN representen l'error
    //    "m'oblido de multiplicar per h'(x)" en composicions. Ha d'aparèixer
    //    SEMPRE que existeixi al pool (l'error més freqüent i didàctic).
    //    NO_DERIVATIVE és l'anchor fonamental ("no he derivat res").
    //    Ordre: NO_DERIVATIVE → CHAIN_FORGOT/LOG_FORGOT_CHAIN → resta aleatòria.
    const types = Object.keys(byType).sort(() => Math.random() - 0.5);

    // Mou els tipus prioritaris al davant (en ordre invers d'inserció)
    const priorityOrder = ['CHAIN_FORGOT', 'LOG_FORGOT_CHAIN', 'NO_DERIVATIVE'];
    for (const pt of priorityOrder) {
        const idx = types.indexOf(pt);
        if (idx > 0) { types.splice(idx, 1); types.unshift(pt); }
    }

    // 4. Round-robin: una ronda = un distractor per tipus
    const result = [];
    let round = 0;
    while (result.length < count) {
        let addedThisRound = false;
        for (const t of types) {
            if (result.length >= count) break;
            if (round < byType[t].length) {
                result.push(byType[t][round]);
                addedThisRound = true;
            }
        }
        if (!addedThisRound) break;   // tots els grups exhaurits
        round++;
    }
    return result;
}

// =========================================================================
// ÀLIES LOCALS → MathEngine (font única, evita duplicació)
// =========================================================================
const _fmtLinear    = MathEngine.fmtLinear;
const _fmtPoly2     = MathEngine.fmtPoly2;
const _fmtPoly2Deriv= MathEngine.fmtPoly2Deriv;
const _fmtConst     = MathEngine.fmtConst;
const _kxArg        = MathEngine.kxArg;
const _trigTerm     = MathEngine.trigTerm;
const _wrapIfNeeded = MathEngine.wrapIfNeeded;
const _polyCoefTrig = MathEngine.polyCoefTrig;

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
        { tex: `e^{${kv.kx}}+${k}`, feedback: "Això sembla una integral, no una derivada.",           errorType: 'INTEGRAL_CONFUSION', scope: 'family:exp' },
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
// FAMÍLIA: a·x^n  (coeficient enter ≠ 0, ≠ 1)
// =========================================================================
/**
 * Genera preguntes del tipus f(x) = a·x^n amb a∈{−3,−2,−1,2,3,4} i
 * n∈{−3,−2,2,3,4,5}. Exclou a=1 (cobert per generatePowerInt).
 * La derivada és f'(x) = an·x^{n−1}.
 *
 * Errors pedagògics específics d'aquesta família:
 *   · Conserva a però no baixa n com a factor (→ a·x^{n-1})
 *   · Baixa n però oblida el factor a (→ n·x^{n-1})
 *   · Coef correcte però exponent no reduït (→ an·x^n)
 */
function generatePowerCoef() {
    const aList = [-3, -2, -1, -1, 2, 2, 3, 3, 4];  // -1 i 2,3 més freqüents
    const nList = [-3, -2, 2, 2, 3, 3, 4, 5];
    const a     = aList[Math.floor(Math.random() * aList.length)];
    const n     = nList[Math.floor(Math.random() * nList.length)];

    const fmt         = MathEngine.formatPowerTerm;
    const solutionTex = fmt(a * n, n - 1);
    const pool        = DistractorLib.buildPower(a, n);
    const fallbacks   = [
        { tex: fmt(a, n - 1),     feedback: "Has reduït l'exponent però has oblidat multiplicar pel valor de n.", errorType: 'POWER_FORGOT_R',   scope: 'rule:power' },
        { tex: fmt(a * n, n),     feedback: "El coeficient és correcte però l'exponent no s'ha reduït en 1.",    errorType: 'POWER_WRONG_EXP', scope: 'rule:power' },
        { tex: fmt(a, n),         feedback: "Aquesta és la funció original, no la seva derivada.",                errorType: 'NO_DERIVATIVE',   scope: 'universal'  }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex:   `f(x) = ${fmt(a, n)}`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: `Molt bé! Recorda: (${fmt(a, n)})' = ${solutionTex}.`, errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'power-rule', outerFn: 'power', innerFn: 'identity', params: { a, n }, ruleLabel: 'Regla de la potència' }
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
    const fallbacks = [{ tex:`\\cos(${arg})`, feedback:"Has derivat 'sin → cos', però has oblidat multiplicar per k.", errorType:'CHAIN_FORGOT', scope:'family:sin' }, { tex:_trigTerm(k,'sin',arg), feedback:"La derivada de sin és cos, no sin.", errorType:'SIN_COS_SWAP', scope:'family:sin' }, { tex:`\\sin(${arg})`, feedback:"Aquesta és la funció original.", errorType:'NO_DERIVATIVE', scope:'universal' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = \\sin(${arg})`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Recorda: (sin(kx))' = k·cos(kx).", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'chain-rule', outerFn:'sin', innerFn:'linear-int', params:{k}, ruleLabel:'Regla de la cadena' } };
}
function generateCosKxInt() {
    const candidates  = [-3,-2,-1,-1,1,1,2,3];
    const k           = candidates[Math.floor(Math.random() * candidates.length)];
    const arg         = _kxArg(k);
    const solutionTex = _trigTerm(-k, 'sin', arg);
    const pool      = DistractorLib.buildTrig('cos', k);
    const fallbacks = [{ tex:_trigTerm(k,'sin',arg), feedback:"Has derivat 'cos → sin', però has oblidat el signe negatiu.", errorType:'CHAIN_SIGN', scope:'family:cos' }, { tex:_trigTerm(-k,'cos',arg), feedback:"Has posat el signe negatiu però cos no s'ha convertit en sin.", errorType:'SIN_COS_SWAP', scope:'family:cos' }, { tex:`\\cos(${arg})`, feedback:"Aquesta és la funció original.", errorType:'NO_DERIVATIVE', scope:'universal' }];
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
        { tex: `\\cos(${arg})`,                          feedback: "Has derivat 'sin → cos', però has oblidat multiplicar per p'(x) = 2x+b.",                        errorType: 'CHAIN_FORGOT',    scope: 'family:sin-poly2' },
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
        { tex: _polyCoefTrig(pDeriv, 'sin', arg),        feedback: "Has derivat 'cos → sin' i has multiplicat per p'(x), però falta el signe negatiu: (cos u)' = −sin(u)·u'.", errorType: 'CHAIN_SIGN',    scope: 'family:cos-poly2' },
        { tex: `-${_polyCoefTrig(pDeriv, 'cos', arg)}`,  feedback: "Has posat el signe negatiu, però la derivada de cos és −sin, no −cos.",                               errorType: 'SIN_COS_SWAP',  scope: 'family:cos-poly2' },
        { tex: `-\\sin(${arg})`,                         feedback: "Has derivat 'cos → −sin', però has oblidat multiplicar per p'(x) = 2x+b.",                              errorType: 'CHAIN_FORGOT',  scope: 'family:cos-poly2' },
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
// Cada fila pre-calcula tots els camps que _buildProductPool /
// _buildQuotientPool necessiten, perquè les operacions simbòliques de
// _mul/_add/_sub no cobreixen totes les formes algebraiques complexes.
// Camps:
//   dfgTex  = f'·g    fdgTex = f·g'    g2Tex = g²
//   solutionProduct   = f'g + fg'
//   solutionQuotient  = (f'g − fg') / g²
// =========================================================================
const FUNCTION_PAIRS = [
    // --- polinomi × exponencial ---
    { fTex:'x',    gTex:'e^{x}',    dfTex:'1',    dgTex:'e^{x}',        dfgTex:'e^{x}',        fdgTex:'xe^{x}',        g2Tex:'e^{2x}',     solutionProduct:'e^{x}+xe^{x}',              solutionQuotient:'\\frac{e^{x}-xe^{x}}{e^{2x}}' },
    { fTex:'x^2',  gTex:'e^{x}',    dfTex:'2x',   dgTex:'e^{x}',        dfgTex:'2xe^{x}',      fdgTex:'x^2e^{x}',      g2Tex:'e^{2x}',     solutionProduct:'2xe^{x}+x^2e^{x}',          solutionQuotient:'\\frac{2xe^{x}-x^2e^{x}}{e^{2x}}' },
    { fTex:'x^3',  gTex:'e^{x}',    dfTex:'3x^2', dgTex:'e^{x}',        dfgTex:'3x^2e^{x}',    fdgTex:'x^3e^{x}',      g2Tex:'e^{2x}',     solutionProduct:'3x^2e^{x}+x^3e^{x}',        solutionQuotient:'\\frac{3x^2e^{x}-x^3e^{x}}{e^{2x}}' },
    { fTex:'x',    gTex:'e^{2x}',   dfTex:'1',    dgTex:'2e^{2x}',      dfgTex:'e^{2x}',       fdgTex:'2xe^{2x}',      g2Tex:'e^{4x}',     solutionProduct:'e^{2x}+2xe^{2x}',           solutionQuotient:'\\frac{e^{2x}-2xe^{2x}}{e^{4x}}' },
    { fTex:'x+1',  gTex:'e^{x}',    dfTex:'1',    dgTex:'e^{x}',        dfgTex:'e^{x}',        fdgTex:'(x+1)e^{x}',    g2Tex:'e^{2x}',     solutionProduct:'e^{x}+(x+1)e^{x}',          solutionQuotient:'\\frac{e^{x}-(x+1)e^{x}}{e^{2x}}' },
    { fTex:'x-2',  gTex:'e^{x}',    dfTex:'1',    dgTex:'e^{x}',        dfgTex:'e^{x}',        fdgTex:'(x-2)e^{x}',    g2Tex:'e^{2x}',     solutionProduct:'e^{x}+(x-2)e^{x}',          solutionQuotient:'\\frac{e^{x}-(x-2)e^{x}}{e^{2x}}' },
    { fTex:'2x-1', gTex:'e^{x}',    dfTex:'2',    dgTex:'e^{x}',        dfgTex:'2e^{x}',       fdgTex:'(2x-1)e^{x}',   g2Tex:'e^{2x}',     solutionProduct:'2e^{x}+(2x-1)e^{x}',        solutionQuotient:'\\frac{2e^{x}-(2x-1)e^{x}}{e^{2x}}' },
    // --- polinomi × logaritme ---
    { fTex:'x',    gTex:'\\ln(x)',   dfTex:'1',    dgTex:'\\frac{1}{x}', dfgTex:'\\ln(x)',      fdgTex:'1',             g2Tex:'\\ln^2(x)',   solutionProduct:'\\ln(x)+1',                  solutionQuotient:'\\frac{\\ln(x)-1}{\\ln^2(x)}' },
    { fTex:'x^2',  gTex:'\\ln(x)',   dfTex:'2x',   dgTex:'\\frac{1}{x}', dfgTex:'2x\\ln(x)',    fdgTex:'x',             g2Tex:'\\ln^2(x)',   solutionProduct:'2x\\ln(x)+x',                solutionQuotient:'\\frac{2x\\ln(x)-x}{\\ln^2(x)}' },
    { fTex:'x^3',  gTex:'\\ln(x)',   dfTex:'3x^2', dgTex:'\\frac{1}{x}', dfgTex:'3x^2\\ln(x)',  fdgTex:'x^2',           g2Tex:'\\ln^2(x)',   solutionProduct:'3x^2\\ln(x)+x^2',            solutionQuotient:'\\frac{3x^2\\ln(x)-x^2}{\\ln^2(x)}' },
    // --- polinomi × polinomi ---
    { fTex:'2x+1', gTex:'x^2',       dfTex:'2',    dgTex:'2x',           dfgTex:'2x^2',         fdgTex:'2x(2x+1)',      g2Tex:'x^4',        solutionProduct:'2x^2+2x(2x+1)',              solutionQuotient:'\\frac{2x^2-2x(2x+1)}{x^4}' },
    { fTex:'x',    gTex:'x+3',        dfTex:'1',    dgTex:'1',            dfgTex:'x+3',          fdgTex:'x',             g2Tex:'(x+3)^2',    solutionProduct:'2x+3',                       solutionQuotient:'\\frac{3}{(x+3)^2}' },
    { fTex:'x+3',  gTex:'x^2',        dfTex:'1',    dgTex:'2x',           dfgTex:'x^2',          fdgTex:'2x(x+3)',       g2Tex:'x^4',        solutionProduct:'x^2+2x(x+3)',                solutionQuotient:'\\frac{x^2-2x(x+3)}{x^4}' },
    { fTex:'x+1',  gTex:'x^2',        dfTex:'1',    dgTex:'2x',           dfgTex:'x^2',          fdgTex:'2x(x+1)',       g2Tex:'x^4',        solutionProduct:'x^2+2x(x+1)',                solutionQuotient:'\\frac{x^2-2x(x+1)}{x^4}' },
    { fTex:'x^2',  gTex:'x+2',        dfTex:'2x',   dgTex:'1',            dfgTex:'2x(x+2)',      fdgTex:'x^2',           g2Tex:'(x+2)^2',    solutionProduct:'2x(x+2)+x^2',                solutionQuotient:'\\frac{2x(x+2)-x^2}{(x+2)^2}' },
    { fTex:'x^2',  gTex:'x-1',        dfTex:'2x',   dgTex:'1',            dfgTex:'2x(x-1)',      fdgTex:'x^2',           g2Tex:'(x-1)^2',    solutionProduct:'2x(x-1)+x^2',                solutionQuotient:'\\frac{2x(x-1)-x^2}{(x-1)^2}' },
    // --- polinomi × trigonomètrica ---
    { fTex:'x',    gTex:'\\sin(x)',   dfTex:'1',    dgTex:'\\cos(x)',     dfgTex:'\\sin(x)',     fdgTex:'x\\cos(x)',     g2Tex:'\\sin^2(x)', solutionProduct:'\\sin(x)+x\\cos(x)',          solutionQuotient:'\\frac{\\sin(x)-x\\cos(x)}{\\sin^2(x)}' },
    { fTex:'x',    gTex:'\\cos(x)',   dfTex:'1',    dgTex:'-\\sin(x)',    dfgTex:'\\cos(x)',     fdgTex:'-x\\sin(x)',    g2Tex:'\\cos^2(x)', solutionProduct:'\\cos(x)-x\\sin(x)',          solutionQuotient:'\\frac{\\cos(x)+x\\sin(x)}{\\cos^2(x)}' },
    { fTex:'x^2',  gTex:'\\sin(x)',   dfTex:'2x',   dgTex:'\\cos(x)',     dfgTex:'2x\\sin(x)',   fdgTex:'x^2\\cos(x)',   g2Tex:'\\sin^2(x)', solutionProduct:'2x\\sin(x)+x^2\\cos(x)',      solutionQuotient:'\\frac{2x\\sin(x)-x^2\\cos(x)}{\\sin^2(x)}' },
    { fTex:'e^{x}',gTex:'\\sin(x)',   dfTex:'e^{x}',dgTex:'\\cos(x)',     dfgTex:'e^{x}\\sin(x)',fdgTex:'e^{x}\\cos(x)',g2Tex:'\\sin^2(x)', solutionProduct:'e^{x}\\sin(x)+e^{x}\\cos(x)', solutionQuotient:'\\frac{e^{x}\\sin(x)-e^{x}\\cos(x)}{\\sin^2(x)}' },
    { fTex:'e^{x}',gTex:'\\cos(x)',   dfTex:'e^{x}',dgTex:'-\\sin(x)',    dfgTex:'e^{x}\\cos(x)',fdgTex:'-e^{x}\\sin(x)',g2Tex:'\\cos^2(x)',solutionProduct:'e^{x}\\cos(x)-e^{x}\\sin(x)', solutionQuotient:'\\frac{e^{x}\\cos(x)+e^{x}\\sin(x)}{\\cos^2(x)}' },
];

function generateProduct() {
    const pair = FUNCTION_PAIRS[Math.floor(Math.random()*FUNCTION_PAIRS.length)];
    const fDisplay = _wrapIfNeeded(pair.fTex);
    const gDisplay = _wrapIfNeeded(pair.gTex);
    // displayTex: versió visual amb \cdot per mostrar la funció a l'alumne
    // promptTex:  versió sense \cdot per al pool de distractors,
    //             igual al format de fdgTex → evita duplicats semàntics
    const displayTex = `${fDisplay}\\cdot ${gDisplay}`;
    const promptTex  = `${fDisplay}${gDisplay}`;
    const solutionTex = pair.solutionProduct;
    const pairCtx = { ...pair, promptTex, solutionTex };
    const pool = DistractorLib.buildProduct(pairCtx);
    const fallbacks = [{ tex:pair.fTex, feedback:"Aquesta és només la primera funció.", errorType:'NO_DERIVATIVE', scope:'universal' }, { tex:pair.gTex, feedback:"Aquesta és només la segona funció.", errorType:'NO_DERIVATIVE', scope:'universal' }, { tex:pair.dfTex, feedback:"Has derivat només f(x).", errorType:'PRODUCT_FORGOT_SUM', scope:'rule:product' }];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return { promptTex:`f(x) = ${displayTex}`, solutionTex, options:[{ tex:solutionTex, feedback:"Molt bé! Has aplicat correctament la regla del producte: (fg)' = f'g + fg'.", errorType:null, isCorrect:true }, ...distractors.map(d=>({ tex:d.tex, feedback:d.feedback, errorType:d.errorType, isCorrect:false }))], meta:{ family:'product-rule', outerFn:pair.fTex, innerFn:pair.gTex, params:{}, ruleLabel:'Regla del producte' } };
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
// FAMÍLIES: compostes d'ordre superior (e^trig i ln∘trig)
// =========================================================================

/**
 * f(x) = e^{sin(x)}   →   f'(x) = cos(x)·e^{sin(x)}
 */
function generateExpSin() {
    const solutionTex = '\\cos(x)e^{\\sin(x)}';
    const pool        = DistractorLib.buildCompound('exp-sin');
    const fallbacks   = [
        { tex: 'e^{\\cos(x)}',               feedback: "Has derivat l'argument, però has substituït dins l'exponencial en lloc de multiplicar.", errorType: 'CHAIN_WRONG_COEF', scope: 'family:exp-sin' },
        { tex: 'e^{\\sin(x)}',               feedback: "Aquesta és la funció original, no la seva derivada.",                                   errorType: 'NO_DERIVATIVE',    scope: 'universal' },
        { tex: '\\cos(x)',                    feedback: "Has calculat la derivada de l'interior, però has oblidat multiplicar per e^{sin(x)}.",  errorType: 'CHAIN_FORGOT',     scope: 'family:exp-sin' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: 'f(x) = e^{\\sin(x)}', solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! (e^{sin(x)})' = cos(x)·e^{sin(x)}: derivada exterior avaluada a sin(x), per la derivada interior cos(x).", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'chain-rule', outerFn: 'exp', innerFn: 'sin', params: {}, ruleLabel: 'Regla de la cadena' }
    };
}

/**
 * f(x) = e^{cos(x)}   →   f'(x) = −sin(x)·e^{cos(x)}
 */
function generateExpCos() {
    const solutionTex = '-\\sin(x)e^{\\cos(x)}';
    const pool        = DistractorLib.buildCompound('exp-cos');
    const fallbacks   = [
        { tex: 'e^{-\\sin(x)}',              feedback: "Has substituït l'argument per la seva derivada. L'exponencial és e^{cos(x)}, no e^{−sin(x)}.",           errorType: 'CHAIN_WRONG_COEF', scope: 'family:exp-cos' },
        { tex: 'e^{\\cos(x)}',               feedback: "Aquesta és la funció original, no la seva derivada.",                                                     errorType: 'NO_DERIVATIVE',    scope: 'universal' },
        { tex: '-\\sin(x)',                   feedback: "Has calculat la derivada de l'interior, però has oblidat multiplicar per e^{cos(x)}.",                    errorType: 'CHAIN_FORGOT',     scope: 'family:exp-cos' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: 'f(x) = e^{\\cos(x)}', solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! (e^{cos(x)})' = −sin(x)·e^{cos(x)}: atenció al signe negatiu de cos'(x) = −sin(x).", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'chain-rule', outerFn: 'exp', innerFn: 'cos', params: {}, ruleLabel: 'Regla de la cadena' }
    };
}

/**
 * f(x) = ln(sin(x))   →   f'(x) = cos(x)/sin(x)
 */
function generateLnSin() {
    const solutionTex = '\\frac{\\cos(x)}{\\sin(x)}';
    const pool        = DistractorLib.buildCompound('ln-sin');
    const fallbacks   = [
        { tex: '\\frac{1}{\\sin(x)}',         feedback: "Has derivat el logaritme, però has oblidat multiplicar per la derivada interior cos(x).",  errorType: 'LOG_FORGOT_CHAIN', scope: 'family:ln-sin' },
        { tex: '\\frac{\\sin(x)}{\\cos(x)}',  feedback: "La derivada de ln(f) és f'/f, no f/f'. Tens la fracció invertida.",                       errorType: 'LOG_INVERTED',     scope: 'family:ln-sin' },
        { tex: '\\ln(\\sin(x))',               feedback: "Aquesta és la funció original, no la seva derivada.",                                     errorType: 'NO_DERIVATIVE',    scope: 'universal' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: 'f(x) = \\ln(\\sin(x))', solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! (ln(sin(x)))' = cos(x)/sin(x): derivada del logaritme per la derivada interior cos(x), dividida per sin(x).", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'sin', params: {}, ruleLabel: 'Derivada del logaritme' }
    };
}

/**
 * f(x) = ln(cos(x))   →   f'(x) = −sin(x)/cos(x)
 */
function generateLnCos() {
    const solutionTex = '\\frac{-\\sin(x)}{\\cos(x)}';
    const pool        = DistractorLib.buildCompound('ln-cos');
    const fallbacks   = [
        { tex: '\\frac{1}{\\cos(x)}',         feedback: "Has derivat el logaritme, però has oblidat multiplicar per la derivada interior −sin(x).", errorType: 'LOG_FORGOT_CHAIN', scope: 'family:ln-cos' },
        { tex: '\\frac{\\sin(x)}{\\cos(x)}',  feedback: "Has oblidat el signe negatiu. La derivada de cos(x) és −sin(x), no +sin(x).",            errorType: 'CHAIN_SIGN',       scope: 'family:ln-cos' },
        { tex: '\\ln(\\cos(x))',               feedback: "Aquesta és la funció original, no la seva derivada.",                                     errorType: 'NO_DERIVATIVE',    scope: 'universal' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);
    return {
        promptTex: 'f(x) = \\ln(\\cos(x))', solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! (ln(cos(x)))' = −sin(x)/cos(x): atenció al signe negatiu de cos'(x) = −sin(x).", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'log-rule', outerFn: 'ln', innerFn: 'cos', params: {}, ruleLabel: 'Derivada del logaritme' }
    };
}

// =========================================================================
// REGISTRE DE FAMÍLIES
// =========================================================================
const FamilyRegistry = {
    'chain-exp-int':   generateExpKxInt,
    'chain-exp-frac':  generateExpKxFrac,
    'power':           generatePowerInt,
    'power-coef':      generatePowerCoef,
    'log-kx':          generateLogKx,
    'log-xn':          generateLogXn,
    'log-linear':      generateLogLinear,
    'log-poly2':       generateLogPoly2,
    'chain-sin-int':   generateSinKxInt,
    'chain-cos-int':   generateCosKxInt,
    'chain-sin-poly2': generateSinPoly2,
    'chain-cos-poly2': generateCosPoly2,
    'compound-exp-sin':generateExpSin,
    'compound-exp-cos':generateExpCos,
    'compound-ln-sin': generateLnSin,
    'compound-ln-cos': generateLnCos,
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

// [ROUND 1 — Anti-col·lisió: evita repetir el mateix promptTex dins una sessió]
const _usedPrompts = new Set();

// Nombre màxim de reintents abans de rendir-se (evita bucle infinit si el
// pool de famílies actives és molt petit i tots els prompts estan exhaurits).
const _MAX_RETRIES = 12;

function generateChallenge() {
    let challenge;
    let attempts = 0;
    do {
        const generator = activeFamilies[Math.floor(Math.random() * activeFamilies.length)];
        challenge = generator();
        attempts++;
    } while (_usedPrompts.has(challenge.promptTex) && attempts < _MAX_RETRIES);
    _usedPrompts.add(challenge.promptTex);
    return challenge;
}

// [ROUND 1 — resetSession: neteja l'historial de prompts per a la sessió nova]
function resetSession() {
    _usedPrompts.clear();
}

// =========================================================================
// API PÚBLICA
// =========================================================================
return {
    generateChallenge,
    resetSession,       // [ROUND 1 — Anti-col·lisió]
    FamilyRegistry,
    activeFamilies,
    // _testing: accessible per run-tests.js, no per al codi de producció
    _testing: { _selectDistractors, FUNCTION_PAIRS }
};

})();
