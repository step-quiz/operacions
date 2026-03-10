/**
 * ============================================================================
 * PROJECTE: Asímptotes i Límits Laterals
 * FITXER: js/asimptotes/question-bank-asimptotes.js
 * ROL: Generació de preguntes completes (prompt + 4 opcions) a partir
 *      d'una funció.
 *
 * Tipus de preguntes:
 *   Q_VA      → Asímptota vertical
 *   Q_LATERAL → Límit lateral (esquerra o dreta)
 *   Q_HA      → Asímptota horitzontal
 *   Q_OA      → Asímptota obliqua
 *
 * DEPENDÈNCIES: strings-asimptotes.js
 * ============================================================================
 */
window.QuestionBankA = (() => {

    const S   = StringsA;
    const INF = Infinity;

    function _pick(arr)     { return arr[Math.floor(Math.random() * arr.length)]; }
    function _shuffle(arr)  {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ---- Distractors helpers ------------------------------------------------

    /** Genera 3 valors enters diferent de `correct` propers a ell */
    function _xDistractors(correct) {
        const pool = [-4, -3, -2, -1, 0, 1, 2, 3, 4].filter(v => v !== correct);
        return _shuffle(pool).slice(0, 3);
    }

    function _yDistractors(correct) {
        const pool = [-4, -3, -2, -1, 0, 1, 2, 3, 4].filter(v => v !== correct);
        return _shuffle(pool).slice(0, 3);
    }

    /** Distractors per a límits laterals */
    function _limitDistractors(correct) {
        const candidates = [INF, -INF, 0, 1, -1, 2, -2];
        return _shuffle(candidates.filter(v => v !== correct)).slice(0, 3);
    }

    // =========================================================================
    // Q_VA — Asímptota vertical
    // =========================================================================
    function generateQVA(func) {
        const hasVA   = func.va.length > 0;
        const correct = hasVA ? func.va[0] : null;

        let options;
        if (hasVA) {
            const wrongs = _xDistractors(correct);
            options = _shuffle([
                { text: S.xLabel(correct), isCorrect: true,
                  feedback: S.feedback.correct_va(correct) },
                ...wrongs.map(w => ({
                    text: S.xLabel(w), isCorrect: false,
                    feedback: S.feedback.wrong_va
                }))
            ]);
        } else {
            // sense AV: opció correcta + 3 opcions x=a falses
            const fakes = _shuffle([-3,-2,-1,1,2,3]).slice(0,3);
            options = _shuffle([
                { text: S.NO_VA, isCorrect: true,
                  feedback: S.feedback.correct_no_va() },
                ...fakes.map(w => ({
                    text: S.xLabel(w), isCorrect: false,
                    feedback: S.feedback.wrong_va
                }))
            ]);
        }

        return {
            prompt:  S.qVAPrompt(func),
            options,
            layout: 'list',
            type:   'Q_VA',
            meta:   { correct, hasVA }
        };
    }

    // =========================================================================
    // Q_LATERAL — Límit lateral
    // =========================================================================
    function generateQLateral(func) {
        const a = func.va[0];   // sempre hi ha almenys una AV per a preguntes de límit

        // Escull costat: per a log, sempre dreta (esquerra és fora de domini)
        let side;
        if (func.family === 'logarithmic') {
            side = 'right';
        } else {
            side = _pick(['left', 'right']);
        }

        const limitData = func.vaLimits[a];
        const correct   = side === 'right' ? limitData.right : limitData.left;

        // Si el límit és null (fora de domini), fem la pregunta del costat dret
        const sideUsed  = (correct === null) ? 'right' : side;
        const correctV  = sideUsed === 'right' ? limitData.right : limitData.left;

        const wrongs = _limitDistractors(correctV);
        const options = _shuffle([
            { text: S.limitLabel(correctV), isCorrect: true,
              feedback: S.feedback.correct_lateral(correctV) },
            ...wrongs.map(w => ({
                text: S.limitLabel(w), isCorrect: false,
                feedback: S.feedback.wrong_lateral
            }))
        ]);

        return {
            prompt:  S.qLateralPrompt(func, a, sideUsed),
            options,
            layout: 'list',
            type:   'Q_LATERAL',
            meta:   { a, side: sideUsed, correct: correctV }
        };
    }

    // =========================================================================
    // Q_HA — Asímptota horitzontal
    // =========================================================================
    function generateQHA(func) {
        const hasHA   = func.ha !== null;
        const correct = func.ha;

        let options;
        if (hasHA) {
            const wrongs = _yDistractors(correct);
            options = _shuffle([
                { text: S.yLabel(correct), isCorrect: true,
                  feedback: S.feedback.correct_ha(correct) },
                ...wrongs.map(w => ({
                    text: S.yLabel(w), isCorrect: false,
                    feedback: S.feedback.wrong_ha
                }))
            ]);
        } else {
            const fakes = _shuffle([-2,-1,0,1,2,3]).slice(0,3);
            options = _shuffle([
                { text: S.NO_HA, isCorrect: true,
                  feedback: S.feedback.correct_no_ha() },
                ...fakes.map(w => ({
                    text: S.yLabel(w), isCorrect: false,
                    feedback: S.feedback.wrong_ha
                }))
            ]);
        }

        return {
            prompt:  S.qHAPrompt(func),
            options,
            layout: 'list',
            type:   'Q_HA',
            meta:   { correct, hasHA }
        };
    }

    // =========================================================================
    // Q_OA — Asímptota obliqua
    // =========================================================================
    function generateQOA(func) {
        const hasOA = func.oa !== null;

        let options;
        if (hasOA) {
            const { m, b } = func.oa;
            // Distractors: mateixa pendent diferent terme, pendent diferent, etc.
            const wrongBs  = [-3,-2,-1,0,1,2,3].filter(v => v !== b);
            const wrongs   = _shuffle(wrongBs).slice(0,3).map(wb => S.oaLabel(m, wb));
            options = _shuffle([
                { text: S.oaLabel(m, b), isCorrect: true,
                  feedback: S.feedback.correct_oa(m, b) },
                ...wrongs.map(w => ({
                    text: w, isCorrect: false,
                    feedback: S.feedback.wrong_oa
                }))
            ]);
        } else {
            // Funcions sense AO → mostra com a correcte "No té AO" + 3 AO falses
            const fakeOAs = _shuffle([-2,-1,1,2]).slice(0,3).map(b => S.oaLabel(1, b));
            options = _shuffle([
                { text: S.NO_OA, isCorrect: true,
                  feedback: S.feedback.correct_no_oa() },
                ...fakeOAs.map(w => ({
                    text: w, isCorrect: false,
                    feedback: S.feedback.wrong_oa
                }))
            ]);
        }

        return {
            prompt:  S.qOAPrompt(func),
            options,
            layout: 'list',
            type:   'Q_OA',
            meta:   { hasOA, oa: func.oa }
        };
    }

    // =========================================================================
    // generateChallenge — tria el tipus de pregunta adequat per nivell
    // =========================================================================
    /**
     * @param {object} func   Funció generada per FunctionEngine
     * @param {number} level  1 | 2 | 3
     */
    function generateChallenge(func, level) {
        // Tipus disponibles per nivell
        const byLevel = {
            1: ['Q_VA', 'Q_LATERAL'],
            2: ['Q_VA', 'Q_LATERAL', 'Q_HA'],
            3: ['Q_VA', 'Q_LATERAL', 'Q_HA', 'Q_OA'],
        };
        let types = byLevel[level] || byLevel[2];

        // Filtra Q_OA si la funció no en té (i no és rational-21)
        if (!func.oa && func.family !== 'rational-21') {
            types = types.filter(t => t !== 'Q_OA');
        }
        // Filtra Q_HA si família no en té
        if (func.ha === null && func.family === 'logarithmic') {
            types = types.filter(t => t !== 'Q_HA');
        }
        // Filtra Q_LATERAL si no hi ha AV
        if (func.va.length === 0) {
            types = types.filter(t => t !== 'Q_LATERAL');
        }

        const type = _pick(types);
        switch (type) {
            case 'Q_VA':      return generateQVA(func);
            case 'Q_LATERAL': return generateQLateral(func);
            case 'Q_HA':      return generateQHA(func);
            case 'Q_OA':      return generateQOA(func);
        }
    }

    return { generateChallenge, generateQVA, generateQLateral, generateQHA, generateQOA };
})();
