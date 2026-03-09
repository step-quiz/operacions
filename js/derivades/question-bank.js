/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/question-bank.js
 * ROL: Registre de famílies de preguntes i selector per URL.
 * ARQUITECTURA:
 * - Substitueix banc-preguntes.js a partir de la Fase 3.
 * - Cada generador retorna el CONTRACTE FORMAL del challenge:
 *   {
 *     promptTex:   string,          — enunciat renderitzable amb KaTeX
 *     solutionTex: string,          — resposta correcta en LaTeX
 *     options: [                    — sempre 4 opcions (1 correcta + 3 distractors)
 *       { tex, feedback, errorType, isCorrect }
 *     ],
 *     meta: {                       — metadades per a analítica i feedback futur
 *       family, outerFn, innerFn, params, ruleLabel
 *     }
 *   }
 * - FamilyRegistry: objecte que mapeja id de família → funció generadora.
 *   Afegir una nova família = afegir una entrada aquí + el seu fitxer/funció.
 * - buildActiveFamilies(): llegeix ?families= de la URL i retorna el pool
 *   de generadors actius. Si el paràmetre és absent, activa totes les famílies.
 * - NOTA: 'difficulty' no forma part del contracte. No hi ha mecanisme que
 *   l'exploti i un camp que ningú no llegeix és documentació que ment.
 * DEPENDÈNCIES: Requereix math-engine.js i distractor-lib.js.
 * S'ha de carregar DESPRÉS de distractor-lib.js i ABANS de derivades.js.
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
// FAMÍLIES: e^{kx} amb k enter
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
        { tex: `e^{${kv.kx}}+C`, feedback: "Això sembla una integral, no una derivada.",        errorType: 'INTEGRAL_CONFUSION', scope: 'family:exp' },
        { tex: `0`,               feedback: "La derivada d'una exponencial no és zero.",          errorType: 'NO_DERIVATIVE',      scope: 'universal'  },
        { tex: `x e^{x-1}`,       feedback: "No apliquis la regla de la potència a una exponencial.", errorType: 'POWER_WRONG_EXP', scope: 'family:exp' }
    ];
    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `f(x) = e^{${kv.kx}}`,
        solutionTex,
        options: [
            { tex: solutionTex, feedback: "Molt bé! Resposta correcta.", errorType: null, isCorrect: true },
            ...distractors.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
        ],
        meta: {
            family:     'chain-rule',
            outerFn:    'exp',
            innerFn:    'linear-int',
            params:     { k },
            ruleLabel:  'Regla de la cadena'
        }
    };
}

// =========================================================================
// FAMÍLIES: e^{kx} amb k fraccionari
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
        meta: {
            family:    'chain-rule',
            outerFn:   'exp',
            innerFn:   'linear-frac',
            params:    { num: frac.num, den: frac.den },
            ruleLabel: 'Regla de la cadena'
        }
    };
}

// =========================================================================
// REGISTRE DE FAMÍLIES
// Afegir una nova família = una nova entrada aquí.
// La clau és l'ID que el professor pot posar a la URL: ?families=chain-exp-int
// =========================================================================

const FamilyRegistry = {
    'chain-exp-int':  generateExpKxInt,
    'chain-exp-frac': generateExpKxFrac,
    // 'chain-sin-int':  generateSinKxInt,   // propera família
    // 'power':          generatePower,
    // 'log':            generateLog,
    // 'product':        generateProduct,
    // 'quotient':       generateQuotient,
};

// =========================================================================
// SELECTOR PER URL
// Llegeix ?families=id1,id2 i retorna el pool de generadors actius.
// IDs desconeguts s'ignoren silenciosament (seguretat defensiva).
// Si el paràmetre és absent → totes les famílies actives.
// =========================================================================

function buildActiveFamilies() {
    const raw = new URLSearchParams(window.location.search).get('families');
    if (!raw) return Object.values(FamilyRegistry);

    const active = raw.split(',')
        .map(id => id.trim())
        .filter(id => FamilyRegistry[id])
        .map(id => FamilyRegistry[id]);

    // Fallback defensiu: si cap ID és vàlid, activem totes les famílies
    return active.length > 0 ? active : Object.values(FamilyRegistry);
}

// Pool actiu: calculat una sola vegada en carregar el fitxer
const activeFamilies = buildActiveFamilies();

// Funció pública per al controlador: tria una família i genera un challenge
function generateChallenge() {
    const generator = activeFamilies[Math.floor(Math.random() * activeFamilies.length)];
    return generator();
}
