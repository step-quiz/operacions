/**
 * ============================================================================
 * PROJECTE: Recta Numèrica Doble
 * FITXER: js/recta-numerica/question-bank.js
 * ROL: Generació de preguntes completes a partir del núvol de punts.
 *
 * Cada generateQ*() retorna:
 *   { prompt, options[], layout, type, meta{} }
 *
 *   prompt   → text de la pregunta
 *   options  → [{text|value, isCorrect, feedback}]
 *   layout   → 'grid' (Q1/Q2) o 'list' (Q3/Q4)
 *   type     → 'Q1'|'Q2'|'Q3'|'Q4'
 *   meta     → dades de depuració (x, y, ...)
 *
 * API pública:
 *   generateChallenge(cloud, yRange, level)  → repte aleatori
 *
 * DEPENDÈNCIES: strings.js, distractor-lib.js
 * ============================================================================
 */
window.QuestionBank = (() => {

    const S = Strings;
    const D = DistractorLib;

    function _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    /* [ROUND 1 — _sortDesc: ordena opcions numèriques de major a menor] */
    function _sortDesc(arr) { return [...arr].sort((a, b) => b - a); }

    // =========================================================================
    // Q1: Quina temperatura fa avui?
    // =========================================================================
    function generateQ1(cloud, yRange, level) {
        const today     = cloud.find(p => p.x === 0);
        const correctY  = today.y;
        const wrong3    = D.buildDirectRead(correctY, cloud, yRange, 0, level);

        const allY = _sortDesc([correctY, ...wrong3]);   /* [ROUND 1 — ordenació descendent] */
        const options = allY.map(y => ({
            text:      S.numLabel(y),
            value:     y,
            isCorrect: y === correctY,
            feedback:  y === correctY
                ? S.feedback.correct_q1(correctY)
                : S.feedback.wrong_q1q2
        }));

        return {
            prompt:  S.Q1_PROMPT,
            options,
            layout:  'grid',
            type:    'Q1',
            meta:    { x: 0, y: correctY }
        };
    }

    // =========================================================================
    // Q2: Quina temperatura feia/farà [dia]?
    // =========================================================================
    function generateQ2(cloud, yRange, level) {
        // Tria un punt del núvol ≠ x=0
        const candidates = cloud.filter(p => p.x !== 0);
        const pt         = _pick(candidates);
        const correctY   = pt.y;
        const wrong3     = D.buildDirectRead(correctY, cloud, yRange, pt.x, level);

        const allY = _sortDesc([correctY, ...wrong3]);   /* [ROUND 1 — ordenació descendent] */
        const options = allY.map(y => ({
            text:      S.numLabel(y),
            value:     y,
            isCorrect: y === correctY,
            feedback:  y === correctY
                ? S.feedback.correct_q2(pt.x, correctY)
                : S.feedback.wrong_q1q2
        }));

        return {
            prompt:  S.q2Prompt(pt.x),
            options,
            layout:  'grid',
            type:    'Q2',
            meta:    { x: pt.x, y: correctY }
        };
    }

    // =========================================================================
    // Q3: Hi ha algun dia on la temperatura sigui exactament Y°C?
    // =========================================================================
    function generateQ3(cloud, yRange, level) {
        const cloudY = cloud.map(p => p.y);

        // Marge segur: mateix càlcul que cloud-engine per garantir
        // que queryY sempre és un valor visible al gràfic
        const span   = yRange.max - yRange.min;
        const margin = Math.max(1, Math.round(span * 0.15));
        const minY   = yRange.min + margin;
        const maxY   = yRange.max - margin;

        // Tria el valor Y a consultar:
        // 50% → valor que SÍ existeix al núvol (count ≥ 1)
        // 50% → valor proper que NO existeix (count = 0)
        let queryY;
        if (Math.random() < 0.5) {
            queryY = _pick(cloudY);   // existeix segur (cloud-engine ja garanteix els marges)
        } else {
            // Valor proper als existents però absent, dins el rang visible
            const absent = [];
            for (let y = minY; y <= maxY; y++) {
                if (!cloudY.includes(y)) absent.push(y);
            }
            if (absent.length > 0) {
                // Prioritza els propers als valors del núvol
                absent.sort((a, b) => {
                    const dA = Math.min(...cloudY.map(y => Math.abs(y - a)));
                    const dB = Math.min(...cloudY.map(y => Math.abs(y - b)));
                    return dA - dB;
                });
                // Agafa dels top 5 del ranking
                queryY = _pick(absent.slice(0, 5));
            } else {
                queryY = _pick(cloudY);  // fallback: tots ocupats
            }
        }

        const correctCount = cloudY.filter(y => y === queryY).length;
        const options = D.buildCountOptions(correctCount)
            .sort((a, b) => a.count - b.count)
            .map(opt => ({
            text:      opt.label,
            isCorrect: opt.isCorrect,
            feedback:  opt.isCorrect
                ? (correctCount === 0
                    ? S.feedback.correct_q3_zero(queryY)
                    : S.feedback.correct_q3_some(correctCount, queryY))
                : S.feedback.wrong_q3
        }));

        return {
            prompt:  S.q3Prompt(queryY),
            options,
            layout:  'list',
            type:    'Q3',
            meta:    { queryY, correctCount }
        };
    }

    // =========================================================================
    // Q4: Selecciona la frase correcta
    // =========================================================================
    function generateQ4(cloud, level) {
        const rawOptions = D.buildFrases(cloud, level);
        const options    = rawOptions.map(opt => ({
            text:      opt.text,
            isCorrect: opt.isCorrect,
            feedback:  opt.isCorrect
                ? S.feedback.correct_q4
                : S.feedback.wrong_q4
        }));

        return {
            prompt:  S.Q4_PROMPT,
            options,
            layout:  'list',
            type:    'Q4',
            meta:    {}
        };
    }

    // =========================================================================
    // generateChallenge: tria aleatòriament el tipus de pregunta
    // =========================================================================
    /**
     * @param {object[]} cloud   Punts del núvol
     * @param {object}   yRange  Rang Y
     * @param {number}   level   Nivell del joc (1|2|3)
     * @returns {object}         Challenge complet
     */
    function generateChallenge(cloud, yRange, level) {
        // Nivell 1: només Q1 i Q2 (lectura directa)
        // Nivell 2: Q1, Q2 i Q3 (afegeix recompte)
        // Nivell 3: Q1, Q2, Q3 i Q4 (afegeix frases)
        const typesByLevel = {
            1: ['Q1', 'Q2'],
            2: ['Q1', 'Q2', 'Q3'],
            3: ['Q1', 'Q2', 'Q3', 'Q4'],
        };
        const types = typesByLevel[level] || typesByLevel[2];
        const type  = _pick(types);
        switch (type) {
            case 'Q1': return generateQ1(cloud, yRange, level);
            case 'Q2': return generateQ2(cloud, yRange, level);
            case 'Q3': return generateQ3(cloud, yRange, level);
            case 'Q4': return generateQ4(cloud, level);
        }
    }

    return { generateChallenge, generateQ1, generateQ2, generateQ3, generateQ4 };
})();
