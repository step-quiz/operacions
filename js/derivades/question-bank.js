/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/question-bank.js
 * ROL: Registre de famílies de preguntes i selector per URL.
 * ARQUITECTURA:
 * - Cada generador retorna el CONTRACTE FORMAL del challenge:
 *   { promptTex, solutionTex, options[], meta{} }
 * - FamilyRegistry: afegir una nova família = una entrada nova aquí.
 * - buildActiveFamilies(): llegeix ?families= de la URL.
 *   Si absent → totes les famílies del registre.
 * - FASE 5: Afegida la família 'power' (regla de la potència, f(x)=x^n).
 *   Verificació de la separació de capes: generatePowerInt() no toca
 *   cap codi de la regla de la cadena. El FamilyRegistry creix amb
 *   una sola línia nova. El selector per URL ja funciona sense canvis.
 *   URL d'exemple: ?families=power
 *   URL combinada:  ?families=chain-exp-int,chain-exp-frac,power
 * DEPENDÈNCIES: Requereix math-engine.js i distractor-lib.js.
 * ============================================================================
 */

// =========================================================================
// AUXILIAR INTERN: selecció i filtratge de distractors
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
// FAMÍLIA: e^{kx} amb k enter
// =========================================================================

function generateExpKxInt() {
    const k   = MathEngine.generateK();
    const kv  = MathEngine.buildKVars(k);
    const fns = {
        g:    arg => `e^{${arg}}`,
        dg:   arg => `e^{${arg}}`,
        intG: arg => `e^{${arg}}`
    };

    const solutionTex = `${kv.coef}${fns.dg(kv.kx)}`;
    const pool        = DistractorLib.build(kv, fns, SCOPE_EXP_KX);
    const fallbacks   = [
        { tex: `e^{${kv.kx}}+C`, feedback: "Això sembla una integral, no una derivada.",           errorType: 'INTEGRAL_CONFUSION', scope: 'family:exp' },
        { tex: `0`,               feedback: "La derivada d'una exponencial no és zero.",             errorType: 'NO_DERIVATIVE',      scope: 'universal'  },
        { tex: `x e^{x-1}`,       feedback: "No apliquis la regla de la potència a una exponencial.", errorType: 'POWER_WRONG_EXP',   scope: 'family:exp' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = e^{${kv.kx}}`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'chain-rule', outerFn: 'exp', innerFn: 'linear-int', params: { k }, ruleLabel: 'Regla de la cadena' }
    };
}

// =========================================================================
// FAMÍLIA: e^{kx} amb k fraccionari
// =========================================================================

function generateExpKxFrac() {
    const frac = MathEngine.generateFractionK();
    const kv   = MathEngine.buildFracKVars(frac);
    const fns  = {
        g:    arg => `e^{${arg}}`,
        dg:   arg => `e^{${arg}}`,
        intG: arg => `e^{${arg}}`
    };

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
        promptTex:   `f(x) = e^{${kv.kx}}`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: { family: 'chain-rule', outerFn: 'exp', innerFn: 'linear-frac', params: { num: frac.num, den: frac.den }, ruleLabel: 'Regla de la cadena' }
    };
}

// =========================================================================
// FAMÍLIA: x^n (regla de la potència, exponent enter)
// =========================================================================

function generatePowerInt() {
    // n ∈ {-3,-2,2,3,4,5}: exclosos 0 (trivial) i 1 (f'=1, massa fàcil)
    // n=2 i n=3 amb més pes: casos més comuns al currículum de Batxillerat
    const candidates = [-3, -2, 2, 2, 3, 3, 4, 5];
    const n = candidates[Math.floor(Math.random() * candidates.length)];

    const fmt         = MathEngine.formatPowerTerm;
    const solutionTex = fmt(n, n - 1);
    const pool        = DistractorLib.buildPower(n);

    // Fallback genèric per si el pool queda curt (molt improbable)
    const fallbacks = [
        {
            tex:       fmt(n + 1, n),
            feedback:  "L'exponent ha de disminuir en 1 quan derivem, no augmentar.",
            errorType: 'POWER_WRONG_EXP',
            scope:     'rule:power'
        }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = x^{${n}}`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: {
            family:    'power-rule',
            outerFn:   'power',
            innerFn:   'identity',
            params:    { n },
            ruleLabel: 'Regla de la potència'
        }
    };
}

// =========================================================================
// REGISTRE DE FAMÍLIES
// Afegir una nova família = una nova entrada aquí + la seva funció generadora.
// La clau és l'ID per a la URL: ?families=power
// =========================================================================

const FamilyRegistry = {
    'chain-exp-int':  generateExpKxInt,
    'chain-exp-frac': generateExpKxFrac,
    'power':          generatePowerInt,
    // 'chain-sin-int':  generateSinKxInt,   // propera: sin(kx)
    // 'log':            generateLog,         // propera: ln(f(x))
    // 'product':        generateProduct,     // futura: regla del producte
    // 'quotient':       generateQuotient,    // futura: regla del quocient
};

// =========================================================================
// SELECTOR PER URL
// =========================================================================

function buildActiveFamilies() {
    const raw = new URLSearchParams(window.location.search).get('families');
    if (!raw) return Object.values(FamilyRegistry);

    const active = raw.split(',')
        .map(id => id.trim())
        .filter(id => FamilyRegistry[id])
        .map(id => FamilyRegistry[id]);

    return active.length > 0 ? active : Object.values(FamilyRegistry);
}

const activeFamilies = buildActiveFamilies();

function generateChallenge() {
    const generator = activeFamilies[Math.floor(Math.random() * activeFamilies.length)];
    return generator();
}
