/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/probabilitat/question-bank.js
 * ROL: Registre de famílies de preguntes de probabilitat (3 nivells).
 * ARQUITECTURA:
 * - Cada generador retorna:
 *     { promptText, solutionTex, options[], meta{} }
 *   on promptText és HTML (no LaTeX) per a l'enunciat textual.
 * - Famílies per nivell:
 *   NIVELL 1 (Laplace directe i esdeveniments independents):
 *     die-single, coin-die, two-coins
 *   NIVELL 2 (Arbre de decisions: extraccions amb/sense reposició):
 *     balls-with-repl, balls-without-repl, balls-diff-color
 *   NIVELL 3 (Probabilitat condicionada, sense Bayes):
 *     conditional-balls, conditional-table
 * - Selector per URL: ?nivell=1, ?nivell=2, ?nivell=3
 *   Si absent, s'activa el nivell 1.
 * DEPENDÈNCIES: math-engine.js, distractor-lib.js, strings.js.
 * ============================================================================
 */

window.QuestionBank = (() => {

    const ME  = MathEngine;
    const DL  = DistractorLib;
    const tex = ME.fracToTex;
    const S   = Strings.Feedback;

    function _buildOptions(solutionFrac, distractors) {
        const solutionTex = tex(solutionFrac);
        const selected = DL.selectDistractors(distractors, solutionTex, 3);
        return {
            solutionTex,
            options: [
                { tex: solutionTex, feedback: S.correct, errorType: null, isCorrect: true },
                ...selected.map(d => ({ tex: d.tex, feedback: d.feedback, errorType: d.errorType, isCorrect: false }))
            ]
        };
    }

    // =========================================================================
    // NIVELL 1: LAPLACE DIRECTE + ESDEVENIMENTS INDEPENDENTS
    // =========================================================================

    /** Dau: probabilitat d'una condició simple */
    function generateDieSingle() {
        const conditions = [
            { text: 'treure un nombre parell',               favorable: [2, 4, 6] },
            { text: 'treure un nombre senar',                favorable: [1, 3, 5] },
            { text: 'treure un nombre primer',               favorable: [2, 3, 5] },
            { text: 'treure un nombre més gran que 2',       favorable: [3, 4, 5, 6] },
            { text: 'treure un nombre més gran que 3',       favorable: [4, 5, 6] },
            { text: 'treure un nombre més gran que 4',       favorable: [5, 6] },
            { text: 'treure un nombre menor que 3',          favorable: [1, 2] },
            { text: 'treure un nombre menor que 4',          favorable: [1, 2, 3] },
            { text: 'treure un nombre menor que 5',          favorable: [1, 2, 3, 4] },
            { text: 'treure un múltiple de 3',               favorable: [3, 6] },
            { text: 'treure un 6',                           favorable: [6] },
            { text: 'treure un nombre que no sigui el 4',    favorable: [1, 2, 3, 5, 6] },
        ];
        const cond = pick(conditions);
        const n = cond.favorable.length;
        const solutionFrac = ME.frac(n, 6);
        const distractors  = DL.buildDieSingle(n);
        const { solutionTex, options } = _buildOptions(solutionFrac, distractors);
        return {
            promptText: `Llancem un dau equilibrat de 6 cares. Quina és la probabilitat de ${cond.text}?`,
            solutionTex,
            options,
            meta: { family: 'die-single', level: 1, params: { condition: cond.text, favorable: n } }
        };
    }

    /** Moneda + dau: dos esdeveniments independents */
    function generateCoinDie() {
        const dieConditions = [
            { text: 'un nombre parell al dau',    pDie: ME.frac(3, 6) },
            { text: 'un sis al dau',              pDie: ME.frac(1, 6) },
            { text: 'un nombre primer al dau',    pDie: ME.frac(3, 6) },
            { text: 'un nombre més gran que 4',   pDie: ME.frac(2, 6) },
            { text: 'un múltiple de 3 al dau',    pDie: ME.frac(2, 6) },
        ];
        const coinFace = pick(['cara', 'creu']);
        const pCoin = ME.frac(1, 2);
        const dieCond = pick(dieConditions);
        const solutionFrac = ME.mulFrac(pCoin, dieCond.pDie);
        const distractors  = DL.buildIndependent(pCoin, dieCond.pDie);
        const { solutionTex, options } = _buildOptions(solutionFrac, distractors);
        return {
            promptText: `Llancem una moneda equilibrada i un dau de 6 cares. Quina és la probabilitat de treure ${coinFace} a la moneda i ${dieCond.text}?`,
            solutionTex,
            options,
            meta: { family: 'coin-die', level: 1, params: { coinFace, dieCond: dieCond.text } }
        };
    }

    /** Dues monedes: P(dues cares), P(cap cara), P(almenys una cara) */
    function generateTwoCoins() {
        const scenarios = [
            {
                text: 'treure dues cares',
                frac: ME.frac(1, 4),
                pA: ME.frac(1, 2), pB: ME.frac(1, 2)
            },
            {
                text: 'no treure cap cara (dues creus)',
                frac: ME.frac(1, 4),
                pA: ME.frac(1, 2), pB: ME.frac(1, 2)
            },
            {
                text: 'treure almenys una cara',
                frac: ME.frac(3, 4),
                pA: ME.frac(1, 2), pB: ME.frac(1, 2)
            },
        ];
        const sc = pick(scenarios);
        const distractors = DL.buildIndependent(sc.pA, sc.pB);
        // Afegim distractors extra específics
        if (sc.frac.num === 3 && sc.frac.den === 4) {
            // Per "almenys una cara": error típic = 1/2 (una sola moneda)
            distractors.push({ tex: tex(ME.frac(1, 2)), feedback: S.singleTrial, errorType: 'SINGLE_TRIAL' });
        }
        const { solutionTex, options } = _buildOptions(sc.frac, distractors);
        return {
            promptText: `Llancem dues monedes equilibrades. Quina és la probabilitat de ${sc.text}?`,
            solutionTex,
            options,
            meta: { family: 'two-coins', level: 1, params: { scenario: sc.text } }
        };
    }

    // =========================================================================
    // NIVELL 2: ARBRE DE DECISIONS (EXTRACCIONS)
    // =========================================================================

    /** Genera composició de caixa aleatòria: {blue, red, total, colorText, otherText} */
    function _randomBox() {
        const blue  = randInt(2, 5);
        let red;
        do { red = randInt(2, 5); } while (red === blue);
        const colors = pick([
            { main: 'blaves',   sing: 'blava',   other: 'vermelles', otherSing: 'vermella' },
            { main: 'verdes',   sing: 'verda',   other: 'grogues',   otherSing: 'groga' },
            { main: 'blanques', sing: 'blanca',  other: 'negres',    otherSing: 'negra' },
        ]);
        return { b: blue, r: red, t: blue + red, cMain: colors.main, singMain: colors.sing, cOther: colors.other, singOther: colors.otherSing };
    }

    function _boxText(box) {
        return `${box.b} boles ${box.cMain} i ${box.r} boles ${box.cOther} (${box.t} boles en total)`;
    }

    /** Boles AMB reposició: P(2 del mateix color) */
    function generateBallsWithRepl() {
        const box = _randomBox();
        const solutionFrac = ME.frac(box.b * box.b, box.t * box.t);
        const distractors  = DL.buildWithReplacement(box.b, box.t);
        const { solutionTex, options } = _buildOptions(solutionFrac, distractors);
        return {
            promptText: `Una caixa conté ${_boxText(box)}. Extraiem una bola, l'apuntem i la tornem a la caixa. Després n'extraiem una altra. Quina és la probabilitat que les dues siguin ${box.cMain}?`,
            solutionTex,
            options,
            meta: { family: 'balls-with-repl', level: 2, params: { b: box.b, r: box.r, t: box.t } }
        };
    }

    /** Boles SENSE reposició: P(2 del mateix color) */
    function generateBallsWithoutRepl() {
        const box = _randomBox();
        const solutionFrac = ME.frac(box.b * (box.b - 1), box.t * (box.t - 1));
        const distractors  = DL.buildWithoutReplacement(box.b, box.t);
        const { solutionTex, options } = _buildOptions(solutionFrac, distractors);
        return {
            promptText: `Una caixa conté ${_boxText(box)}. Extraiem una bola sense tornar-la a la caixa, i després n'extraiem una altra. Quina és la probabilitat que les dues siguin ${box.cMain}?`,
            solutionTex,
            options,
            meta: { family: 'balls-without-repl', level: 2, params: { b: box.b, r: box.r, t: box.t } }
        };
    }

    /** Boles SENSE reposició: P(primera d'un color, segona d'un altre) */
    function generateBallsDiffColor() {
        const box = _randomBox();
        const solutionFrac = ME.frac(box.b * box.r, box.t * (box.t - 1));
        const distractors  = DL.buildDiffColorNoRepl(box.b, box.r, box.t);
        const { solutionTex, options } = _buildOptions(solutionFrac, distractors);
        return {
            promptText: `Una caixa conté ${_boxText(box)}. Extraiem dues boles sense reposició. Quina és la probabilitat que la primera sigui ${box.singMain} i la segona sigui ${box.singOther}?`,
            solutionTex,
            options,
            meta: { family: 'balls-diff-color', level: 2, params: { b: box.b, r: box.r, t: box.t } }
        };
    }

    // =========================================================================
    // NIVELL 3: PROBABILITAT CONDICIONADA (sense Bayes)
    // =========================================================================

    /** Condicionada amb boles: P(2a blava | 1a blava) */
    function generateConditionalBalls() {
        const box = _randomBox();
        // Assegurem b >= 2 per tenir sentit
        const b = Math.max(box.b, 2);
        const t = b + box.r;
        const solutionFrac = ME.frac(b - 1, t - 1);
        const distractors  = DL.buildConditionalBalls(b, t);
        const { solutionTex, options } = _buildOptions(solutionFrac, distractors);
        return {
            promptText: `Una caixa conté ${b} boles ${box.cMain} i ${box.r} boles ${box.cOther}. Extraiem dues boles sense reposició. Sabent que la primera bola és ${box.singMain}, quina és la probabilitat que la segona també sigui ${box.singMain}?`,
            solutionTex,
            options,
            meta: { family: 'conditional-balls', level: 3, params: { b, r: box.r, t } }
        };
    }

    /** Condicionada amb taula: "En una classe de N alumnes..." */
    function generateConditionalTable() {
        // Generem una taula 2×2 coherent
        const nAB    = randInt(4, 10);       // aprova I fa esport
        const nAnotB = randInt(3, 10);       // aprova I NO fa esport
        const nnotAB = randInt(2, 8);        // NO aprova I fa esport
        const nnotAnotB = randInt(2, 8);     // NO aprova I NO fa esport

        const nA  = nAB + nAnotB;            // total que aproven
        const nB  = nAB + nnotAB;            // total que fan esport
        const N   = nA + nnotAB + nnotAnotB; // total alumnes

        const contexts = [
            {
                condLabel: 'aprova matemàtiques',
                askLabel:  'faci esport',
                nCond: nA, nTarget: nAB, nOther: nB,
                // P(esport | aprova) = nAB / nA
            },
            {
                condLabel: 'fa esport',
                askLabel:  'aprovi matemàtiques',
                nCond: nB, nTarget: nAB, nOther: nA,
                // P(aprova | esport) = nAB / nB
            },
        ];
        const ctx = pick(contexts);
        const solutionFrac = ME.frac(ctx.nTarget, ctx.nCond);
        const distractors  = DL.buildConditionalTable(ctx.nTarget, ctx.nCond, ctx.nOther, N);
        const { solutionTex, options } = _buildOptions(solutionFrac, distractors);
        return {
            promptText: `En una classe de ${N} alumnes, ${nA} aproven matemàtiques i ${nB} fan esport. ${nAB} alumnes aproven matemàtiques i alhora fan esport. Si triem un alumne a l'atzar que ${ctx.condLabel}, quina és la probabilitat que ${ctx.askLabel}?`,
            solutionTex,
            options,
            meta: { family: 'conditional-table', level: 3, params: { nAB, nA, nB, N } }
        };
    }

    // =========================================================================
    // REGISTRE I SELECTOR PER NIVELL (URL ?nivell=)
    // =========================================================================

    const FamilyRegistry = {
        1: [generateDieSingle, generateCoinDie, generateTwoCoins],
        2: [generateBallsWithRepl, generateBallsWithoutRepl, generateBallsDiffColor],
        3: [generateConditionalBalls, generateConditionalTable],
    };

    function buildActiveFamilies() {
        const raw = new URLSearchParams(window.location.search).get('nivell');
        const lvl = raw ? parseInt(raw) : 0;
        if (lvl >= 1 && lvl <= 3) return FamilyRegistry[lvl];
        // Si no hi ha nivell o és invàlid, activa tots
        return Object.values(FamilyRegistry).flat();
    }

    const activeFamilies = buildActiveFamilies();

    // Anti-col·lisió: evita repetir el mateix promptText dins una sessió
    const _usedPrompts = new Set();
    const _MAX_RETRIES = 20;

    function generateChallenge() {
        let challenge;
        let attempts = 0;
        do {
            const generator = pick(activeFamilies);
            challenge = generator();
            attempts++;
        } while (_usedPrompts.has(challenge.promptText) && attempts < _MAX_RETRIES);
        _usedPrompts.add(challenge.promptText);
        return challenge;
    }

    function resetSession() {
        _usedPrompts.clear();
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================
    return {
        generateChallenge,
        resetSession,
        FamilyRegistry,
        activeFamilies,
    };

})();
