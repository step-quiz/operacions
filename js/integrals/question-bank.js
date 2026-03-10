/**
 * ============================================================================
 * PROJECTE: Motor Educatiu d'Integrals (Vanilla JS)
 * FITXER: js/integrals/question-bank.js
 * ROL: Registre de famílies de preguntes i selector per URL.
 * ARQUITECTURA:
 * - Cada generador retorna: { promptTex, solutionTex, options[], meta{} }
 * - Encapsulat com a IIFE → window.QuestionBank.
 * - API pública:
 *     generateChallenge()  → repte aleatori de la família activa
 *     FamilyRegistry       → mapa id → funció generadora
 *     activeFamilies       → llista de generadors actius (segons URL)
 *     _testing             → { _selectDistractors } per a run-tests.js
 * FAMÍLIES DISPONIBLES:
 *   'int-power'       → ∫x^n dx         (n ∈ {2,3,4,5,−2,−3})
 *   'int-power-coef'  → ∫a·x^n dx       (a∈{−3,−2,−1,2,3}, n com int-power)
 *   'int-exp-kx'      → ∫e^{kx} dx      (|k|≥2, k enter)
 * SELECTOR PER URL:
 *   ?families=int-power              → activa sols la potència bàsica
 *   ?families=int-power,int-exp-kx   → potència + exponencial
 *   (sense paràmetre → totes les famílies)
 * DEPENDÈNCIES: Requereix math-engine.js i distractor-lib.js.
 * ============================================================================
 */

window.QuestionBank = (() => {

// =========================================================================
// AUXILIAR INTERN: selector de distractors amb diversitat d'errorType
// =========================================================================

/**
 * Selecciona `count` distractors del pool garantint diversitat de errorType.
 *
 * Algorisme:
 *  1. Deduplicació global (pool + fallbacks), excloent la solució correcta.
 *  2. Agrupació per errorType.
 *  3. Barreja aleatòria dins cada grup.
 *  4. Round-robin entre grups: un per tipus per ronda fins arribar a `count`.
 *     NO_PRIMITIVE va sempre primer (error pedagògic fonamental).
 *
 * @param {object[]} pool       Distractors principals
 * @param {string}   correctTex LaTeX de la solució correcta (s'exclou)
 * @param {number}   count      Nombre de distractors a retornar (normalment 3)
 * @param {object[]} fallbacks  Distractors de reserva si el pool és insuficient
 * @returns {object[]}
 */
function _selectDistractors(pool, correctTex, count, fallbacks = []) {
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

    // 3. Ordena els tipus: NO_PRIMITIVE primer (anchor pedagògic), resta aleatòria
    const types  = Object.keys(byType).sort(() => Math.random() - 0.5);
    const npIdx  = types.indexOf('NO_PRIMITIVE');
    if (npIdx > 0) { types.splice(npIdx, 1); types.unshift('NO_PRIMITIVE'); }

    // 4. Round-robin fins arribar a `count`
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
        if (!addedThisRound) break;
        round++;
    }
    return result;
}

// =========================================================================
// ÀLIES LOCALS → MathEngine
// =========================================================================
const _fmt    = MathEngine.formatPowerTerm;
const _fmtInt = MathEngine.formatIntResult;
const _kxArg  = MathEngine.kxArg;
const _fmtF   = MathEngine.fmtFraction;
const _fmtExp = MathEngine.formatExpPrimitive;

// Helper per construir l'opció correcta
function _correct(tex, feedbackText) {
    return { tex, feedback: feedbackText, errorType: null, isCorrect: true };
}
// Helper per construir les opcions incorrectes a partir dels distractors
function _wrongs(distractors) {
    return distractors.map(d => ({
        tex:       d.tex,
        feedback:  d.feedback,
        errorType: d.errorType,
        isCorrect: false
    }));
}

// =========================================================================
// FAMÍLIA: ∫x^n dx = x^{n+1}/(n+1)
// =========================================================================
/**
 * n ∈ {2, 3, 4, 5, −2, −3}
 * Doble pes als exponents positius (més freqüents als currículums de batxillerat).
 * Exclou n=−1 (la seva primitiva és ln(x), família no inclosa aquí).
 */
function generatePowerInt() {
    const candidates = [2, 2, 3, 3, 4, 5, -2, -3];
    const n          = candidates[Math.floor(Math.random() * candidates.length)];
    const solutionTex = _fmtInt(1, n);

    const pool        = DistractorLib.buildPower(n);
    const fallbacks   = [
        { tex: _fmt(n + 1, n), feedback: "Has incrementat el coeficient en lloc de l'exponent.", errorType: 'INT_NO_DIVIDE', scope: 'rule:power' },
        { tex: _fmtF(1, n + 1, n - 1), feedback: "Has dividit per (n−1) en lloc de (n+1).", errorType: 'INT_WRONG_DIVISOR', scope: 'rule:power' }
    ].filter(fb => fb.tex !== solutionTex);

    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `\\displaystyle\\int x^{${n}}\\,dx`,
        solutionTex,
        options: [
            _correct(solutionTex, `Molt bé! Recorda: \\int x^{${n}}\\,dx = \\frac{x^{${n+1}}}{${n+1}}.`),
            ..._wrongs(distractors)
        ],
        meta: { family: 'int-power', ruleLabel: 'Regla de la potència', params: { n } }
    };
}

// =========================================================================
// FAMÍLIA: ∫a·x^n dx = [a/(n+1)]·x^{n+1}
// =========================================================================
/**
 * a ∈ {−3,−2,−1,2,3,4} (exclou a=1, cobert per generatePowerInt)
 * n ∈ {2, 3, 4, 5, −2, −3}
 * Entrena que el coeficient a es manté (simplificat) al resultat.
 */
function generatePowerCoef() {
    const aList = [-3, -2, -1, -1, 2, 2, 3, 3, 4];
    const nList = [2, 2, 3, 3, 4, 5, -2, -3];
    const a     = aList[Math.floor(Math.random() * aList.length)];
    const n     = nList[Math.floor(Math.random() * nList.length)];

    const solutionTex = _fmtInt(a, n);
    const pool        = DistractorLib.buildPower(a, n);
    const fallbacks   = [
        // Ha derivat i oblidat el coeficient
        { tex: _fmt(n, n - 1), feedback: "Has derivat x^n (sense considerar el coeficient a).", errorType: 'INT_DERIVATIVE', scope: 'rule:power' },
        // Ha integrat sense el coeficient
        { tex: _fmtInt(1, n),  feedback: "Has obtingut la primitiva de x^n, però has oblidat el coeficient a de la funció original.", errorType: 'INT_NO_DIVIDE', scope: 'rule:power' }
    ].filter(fb => fb.tex !== solutionTex);

    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    return {
        promptTex:   `\\displaystyle\\int ${_fmt(a, n)}\\,dx`,
        solutionTex,
        options: [
            _correct(solutionTex, `Molt bé! (\\int ${_fmt(a, n)}\\,dx = ${solutionTex}).`),
            ..._wrongs(distractors)
        ],
        meta: { family: 'int-power-coef', ruleLabel: 'Regla de la potència', params: { a, n } }
    };
}

// =========================================================================
// FAMÍLIA: ∫e^{kx} dx = (1/k)·e^{kx}
// =========================================================================
/**
 * k ∈ enters, |k| ≥ 2 (generateKIntExp exclou k=±1).
 * Entrena el factor 1/k de la regla de la cadena inversa.
 */
function generateExpKx() {
    const k           = MathEngine.generateKIntExp();
    const argTex      = _kxArg(k);
    const eTex        = `e^{${argTex}}`;
    const solutionTex = _fmtExp(k);

    const pool        = DistractorLib.buildExp(k);
    // Fallbacks: casos que podrien no aparèixer al pool depenent de k
    const fallbacks   = [
        {
            tex:      eTex,
            feedback: "Aquesta és la funció original. La primitiva d'e^{kx} és (1/k)·e^{kx}.",
            errorType: 'NO_PRIMITIVE',
            scope: 'universal'
        },
        {
            tex:      `${Math.abs(k)}${eTex}`,
            feedback: "Has multiplicat per |k| (operació de derivació). La integral divideix per k.",
            errorType: 'EXP_DERIVATIVE',
            scope: 'family:exp'
        }
    ].filter(fb => fb.tex !== solutionTex);

    const distractors = _selectDistractors(pool, solutionTex, 3, fallbacks);

    // Missatge d'encert amb la fórmula concreta
    const kFrac = k > 0
        ? `\\frac{1}{${k}}`
        : `-\\frac{1}{${Math.abs(k)}}`;
    const correctFeedback =
        `Molt bé! \\int e^{${argTex}}\\,dx = ${kFrac}\\cdot e^{${argTex}}.`;

    return {
        promptTex:   `\\displaystyle\\int e^{${argTex}}\\,dx`,
        solutionTex,
        options: [
            _correct(solutionTex, correctFeedback),
            ..._wrongs(distractors)
        ],
        meta: { family: 'int-exp-kx', ruleLabel: 'Primitiva de l\'exponencial', params: { k } }
    };
}

// =========================================================================
// REGISTRE DE FAMÍLIES
// =========================================================================
const FamilyRegistry = {
    'int-power':      generatePowerInt,
    'int-power-coef': generatePowerCoef,
    'int-exp-kx':     generateExpKx,
};

// =========================================================================
// SELECTOR PER URL (?families=int-power,int-exp-kx)
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

// =========================================================================
// API PÚBLICA
// =========================================================================
return {
    generateChallenge,
    FamilyRegistry,
    activeFamilies,
    _testing: { _selectDistractors }
};

})();
