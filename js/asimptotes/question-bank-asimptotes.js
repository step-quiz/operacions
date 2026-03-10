/**
 * question-bank-asimptotes.js — genera preguntes amb 4 opcions LaTeX.
 * Cada opció: { tex, isCorrect, feedback, errorType }
 */
window.QuestionBankA = (() => {
    const S   = StringsA;
    const INF = Infinity;

    function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function _xDistractors(correct) {
        return _shuffle([-4,-3,-2,-1,0,1,2,3,4].filter(v => v !== correct)).slice(0, 3);
    }
    function _yDistractors(correct) {
        return _shuffle([-4,-3,-2,-1,0,1,2,3,4].filter(v => v !== correct)).slice(0, 3);
    }
    function _limitDistractors(correct) {
        return _shuffle([INF, -INF, 0, 1, -1, 2, -2].filter(v => v !== correct)).slice(0, 3);
    }

    // ---- Q_VA ---------------------------------------------------------------
    function generateQVA(func) {
        const hasVA = func.va.length > 0;
        const correct = hasVA ? func.va[0] : null;
        let options;
        if (hasVA) {
            options = _shuffle([
                { tex: S.xTeX(correct), isCorrect: true,  feedback: S.feedback.correct_va(correct), errorType: null },
                ..._xDistractors(correct).map(w => ({ tex: S.xTeX(w), isCorrect: false, feedback: S.feedback.wrong_va, errorType: 'VA_WRONG' }))
            ]);
        } else {
            options = _shuffle([
                { tex: S.NO_VA_TEX, isCorrect: true, feedback: S.feedback.correct_no_va(), errorType: null },
                ..._shuffle([-3,-2,-1,1,2,3]).slice(0,3).map(w => ({ tex: S.xTeX(w), isCorrect: false, feedback: S.feedback.wrong_va, errorType: 'VA_WRONG' }))
            ]);
        }
        return { promptTex: S.qVATeX(func), solutionTex: hasVA ? S.xTeX(correct) : S.NO_VA_TEX, options, type: 'Q_VA', meta: { correct, hasVA } };
    }

    // ---- Q_LATERAL ----------------------------------------------------------
    function generateQLateral(func) {
        const a    = func.va[0];
        let side   = func.family === 'logarithmic' ? 'right' : _pick(['left', 'right']);
        const lims = func.vaLimits[a];
        let correctV = side === 'right' ? lims.right : lims.left;
        if (correctV === null) { side = 'right'; correctV = lims.right; }

        const options = _shuffle([
            { tex: S.limitTeX(correctV), isCorrect: true, feedback: S.feedback.correct_lateral(correctV), errorType: null },
            ..._limitDistractors(correctV).map(w => ({ tex: S.limitTeX(w), isCorrect: false, feedback: S.feedback.wrong_lateral, errorType: 'LATERAL_WRONG' }))
        ]);
        return { promptTex: S.qLateralTeX(func, a, side), solutionTex: S.limitTeX(correctV), options, type: 'Q_LATERAL', meta: { a, side, correct: correctV } };
    }

    // ---- Q_HA ---------------------------------------------------------------
    function generateQHA(func) {
        const hasHA = func.ha !== null;
        const correct = func.ha;
        let options;
        if (hasHA) {
            options = _shuffle([
                { tex: S.yTeX(correct), isCorrect: true, feedback: S.feedback.correct_ha(correct), errorType: null },
                ..._yDistractors(correct).map(w => ({ tex: S.yTeX(w), isCorrect: false, feedback: S.feedback.wrong_ha, errorType: 'HA_WRONG' }))
            ]);
        } else {
            options = _shuffle([
                { tex: S.NO_HA_TEX, isCorrect: true, feedback: S.feedback.correct_no_ha(), errorType: null },
                ..._shuffle([-2,-1,0,1,2,3]).slice(0,3).map(w => ({ tex: S.yTeX(w), isCorrect: false, feedback: S.feedback.wrong_ha, errorType: 'HA_WRONG' }))
            ]);
        }
        return { promptTex: S.qHATeX(func), solutionTex: hasHA ? S.yTeX(correct) : S.NO_HA_TEX, options, type: 'Q_HA', meta: { correct, hasHA } };
    }

    // ---- Q_OA ---------------------------------------------------------------
    function generateQOA(func) {
        const hasOA = func.oa !== null;
        let options;
        if (hasOA) {
            const { m, b } = func.oa;
            const wrongs   = _shuffle([-3,-2,-1,0,1,2,3].filter(v => v !== b)).slice(0,3).map(wb => S.oaTeX(m, wb));
            options = _shuffle([
                { tex: S.oaTeX(m, b), isCorrect: true, feedback: S.feedback.correct_oa(m, b), errorType: null },
                ...wrongs.map(w => ({ tex: w, isCorrect: false, feedback: S.feedback.wrong_oa, errorType: 'OA_WRONG' }))
            ]);
        } else {
            const fakeOAs = _shuffle([-2,-1,1,2]).slice(0,3).map(b => S.oaTeX(1, b));
            options = _shuffle([
                { tex: S.NO_OA_TEX, isCorrect: true, feedback: S.feedback.correct_no_oa(), errorType: null },
                ...fakeOAs.map(w => ({ tex: w, isCorrect: false, feedback: S.feedback.wrong_oa, errorType: 'OA_WRONG' }))
            ]);
        }
        const solutionTex = hasOA ? S.oaTeX(func.oa.m, func.oa.b) : S.NO_OA_TEX;
        return { promptTex: S.qOATeX(func), solutionTex, options, type: 'Q_OA', meta: { hasOA, oa: func.oa } };
    }

    // ---- generateChallenge --------------------------------------------------
    function generateChallenge(func, level) {
        let types = { 1: ['Q_VA','Q_LATERAL'], 2: ['Q_VA','Q_LATERAL','Q_HA'], 3: ['Q_VA','Q_LATERAL','Q_HA','Q_OA'] }[level] || ['Q_VA','Q_LATERAL','Q_HA'];
        if (!func.oa && func.family !== 'rational-21') types = types.filter(t => t !== 'Q_OA');
        if (func.ha === null && func.family === 'logarithmic') types = types.filter(t => t !== 'Q_HA');
        if (func.va.length === 0) types = types.filter(t => t !== 'Q_LATERAL');
        const type = _pick(types);
        switch (type) {
            case 'Q_VA':      return generateQVA(func);
            case 'Q_LATERAL': return generateQLateral(func);
            case 'Q_HA':      return generateQHA(func);
            case 'Q_OA':      return generateQOA(func);
        }
    }

    return { generateChallenge };
})();
