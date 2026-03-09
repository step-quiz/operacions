/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/banc-preguntes.js
 * ROL: Motor pedagògic i registre de famílies de preguntes.
 * ARQUITECTURA MATEMÀTICA (Escalabilitat):
 * - El disseny es basa en derivar funcions compostes f(x) = g(h(x))
 *   aplicant la regla de la cadena: f'(x) = g'(h(x)) * h'(x).
 * - En la Fase 2 del refactor, la generació de distractors ha migrat a
 *   distractor-lib.js. Aquest fitxer ja NO conté buildChainRuleDistractors:
 *   crida DistractorLib.build(kVars, fns, scopeFilter) amb el scope correcte
 *   per a cada família. Això garanteix que cap distractor incoherent
 *   aparegui quan s'afegeixin noves famílies (sin, log, etc.).
 * - Cada generador declara el seu scopeFilter explícitament. Ara mateix
 *   les dues famílies (enters i fraccions) usen el mateix scope perquè
 *   ambdues són g(x)=e^x amb h(x)=kx.
 * DEPENDÈNCIES: Requereix math-engine.js i distractor-lib.js.
 * ============================================================================
 */

// Scope que comparteixen totes les variants de e^{kx}:
// - 'universal':    distractors vàlids per a qualsevol composició
// - 'linear-inner': distractors vàlids quan h(x) = kx
// - 'family:exp':   distractors vàlids només per a g(x) = e^x
const SCOPE_EXP_KX = ['universal', 'linear-inner', 'family:exp'];

/**
 * Selecciona fins a N distractors únics del pool, exclou la correcta,
 * i afegeix fallbacks de seguretat si el pool queda curt.
 * Retorna sempre exactament N distractors (si n'hi ha prou al pool).
 */
function _selectDistractors(pool, correctTex, count, fallbacks) {
    const seen = new Set([correctTex]);
    const valid = [];

    pool.forEach(d => {
        if (d.tex && d.tex.trim() !== '' && !seen.has(d.tex)) {
            seen.add(d.tex);
            valid.push(d);
        }
    });

    // Afegir fallbacks si el pool queda curt (cas molt rar)
    fallbacks.forEach(fb => {
        if (valid.length < count && !seen.has(fb.tex)) {
            seen.add(fb.tex);
            valid.push(fb);
        }
    });

    return valid.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * =========================================================================
 * BANC DE PREGUNTES
 * =========================================================================
 */
const questionBank = [
    {
        id: 'exp_kx_int',

        generate: () => {
            const k   = MathEngine.generateK();
            const kv  = MathEngine.buildKVars(k);

            const fns = {
                g:    arg => `e^{${arg}}`,
                dg:   arg => `e^{${arg}}`,
                intG: arg => `e^{${arg}}`
            };

            const correctTex = `${kv.coef}${fns.dg(kv.kx)}`;

            const pool = DistractorLib.build(kv, fns, SCOPE_EXP_KX);

            const fallbacks = [
                { tex: `e^{${kv.kx}}+C`,  feedback: "Això sembla una integral, no una derivada.",       errorType: 'INTEGRAL_CONFUSION', scope: 'family:exp' },
                { tex: `0`,                feedback: "La derivada d'una exponencial no és zero.",         errorType: 'NO_DERIVATIVE',      scope: 'universal'  },
                { tex: `x e^{x-1}`,        feedback: "No apliquis la regla de la potència a una exponencial.", errorType: 'POWER_WRONG_EXP', scope: 'family:exp' }
            ];

            const distractors = _selectDistractors(pool, correctTex, 3, fallbacks);

            return {
                questionTex: `f(x) = e^{${kv.kx}}`,
                correctTex,
                distractors
            };
        }
    },

    {
        id: 'exp_kx_frac',

        generate: () => {
            const frac = MathEngine.generateFractionK();
            const kv   = MathEngine.buildFracKVars(frac);

            const fns = {
                g:    arg => `e^{${arg}}`,
                dg:   arg => `e^{${arg}}`,
                intG: arg => `e^{${arg}}`
            };

            const correctTex = `${kv.coef}${fns.dg(kv.kx)}`;

            const pool = DistractorLib.build(kv, fns, SCOPE_EXP_KX);

            const absP    = Math.abs(frac.num);
            const absPStr = absP === 1 ? "" : absP;
            const fallbacks = [
                { tex: `\\frac{1}{${frac.den}} e^{${kv.kx}}`, feedback: "Revisa el coeficient de la regla de la cadena.",  errorType: 'CHAIN_WRONG_COEF',  scope: 'linear-inner' },
                { tex: `${absPStr} e^{${kv.kx}}`,             feedback: "Has oblidat el denominador de la fracció.",       errorType: 'CHAIN_WRONG_COEF',  scope: 'linear-inner' },
                { tex: `e^{${kv.kx}}`,                        feedback: "Has oblidat aplicar la regla de la cadena.",      errorType: 'CHAIN_FORGOT',      scope: 'universal'    }
            ];

            const distractors = _selectDistractors(pool, correctTex, 3, fallbacks);

            return {
                questionTex: `f(x) = e^{${kv.kx}}`,
                correctTex,
                distractors
            };
        }
    }
];
