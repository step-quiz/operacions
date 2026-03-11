/**
 * strings-asimptotes.js — font única de tots els textos i LaTeX visibles.
 * Totes les funcions que retornen math retornen strings LaTeX vàlids per KaTeX.
 */
window.StringsA = (() => {
    const INF = Infinity;

    // ---- LaTeX de valors ------------------------------------------------

    function xTeX(a) {
        if (a === 0)  return 'x = 0';
        if (a > 0)    return `x = ${a}`;
        return `x = -${-a}`;
    }

    function yTeX(b) {
        if (b === 0)  return 'y = 0';
        if (b > 0)    return `y = ${b}`;
        return `y = -${-b}`;
    }

    function limitTeX(v) {
        if (v === INF)   return '+\\infty';
        if (v === -INF)  return '-\\infty';
        if (v === null)  return '\\nexists';
        if (v === 0)     return '0';
        return v < 0 ? `-${Math.abs(v)}` : `${v}`;
    }

    function oaTeX(m, b) {
        const bPart = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`;
        return `y = x${bPart}`;
    }

    // ---- LaTeX de la funció ------------------------------------------------

    function funcTeX(func) {
        if (func.family === 'rational-simple' || func.family === 'rational-11' || func.family === 'rational-21') {
            return `f(x) = \\dfrac{${func.numStr}}{${func.denStr}}`;
        }
        if (func.family === 'logarithmic') {
            return `f(x) = \\ln\\!\\left(${func.denStr}\\right)`;
        }
        if (func.family === 'exponential') {
            return `f(x) = e^{\\frac{1}{${func.denStr}}}`;
        }
        return 'f(x)';
    }

    // ---- LaTeX dels prompts ------------------------------------------------

    function qVATeX(func) {
        return `\\text{Asímptota vertical de }\\quad ${funcTeX(func)}`;
    }

    function qLateralTeX(func, a, side) {
        const sup  = side === 'right' ? '^{+}' : '^{-}';
        const aStr = a === 0 ? '0' : a > 0 ? `${a}` : `(-${-a})`;
        return `\\lim_{x \\to ${aStr}${sup}} ${funcTeX(func)}`;
    }

    function qHATeX(func) {
        return `\\text{Asímptota horitzontal de }\\quad ${funcTeX(func)}`;
    }

    function qOATeX(func) {
        return `\\text{Asímptota obliqua de }\\quad ${funcTeX(func)}`;
    }

    // ---- Etiquetes de label per a les preguntes (no-math) ------------------

    const labels = {
        Q_VA:      'Asímptota vertical',
        Q_LATERAL: 'Límit lateral',
        Q_HA:      'Asímptota horitzontal',
        Q_OA:      'Asímptota obliqua',
    };

    // ---- Feedbacks (text pla) ----------------------------------------------

    const feedback = {
        correct_va:      a      => `Correcte.`,
        correct_no_va:   ()     => `Correcte.`,
        correct_lateral: v      => v === INF || v === -INF
            ? `Correcte! El límit lateral és ${v === INF ? '+∞' : '−∞'}.`
            : `Correcte! El límit lateral és ${v}.`,
        correct_ha:      b      => `Correcte.`,
        correct_no_ha:   ()     => `Correcte, aquesta funció no té asímptota horitzontal.`,
        correct_oa:      (m, b) => `Correcte.`,
        correct_no_oa:   ()     => `Correcte, aquesta funció no té asímptota obliqua.`,
        wrong_va:        'Recorda: estudia els valors on el límit no sigui un nombre finit.',
        wrong_lateral:   'Analitza el signe de la funció quan x està prou a prop del límit.',
        wrong_ha:        'Calcula lim f(x) quan x pren valors tan grans com vulguem (→ +∞ i x → −∞).',
        wrong_oa:        'Simplifica la teva funció racional.',
    };

    // ---- Etiquetes per a opcions sense LaTeX --------------------------------
    const NO_VA_TEX = '\\text{No té asímptota vertical}';
    const NO_HA_TEX = '\\text{No té asímptota horitzontal}';
    const NO_OA_TEX = '\\text{No té asímptota obliqua}';

    return {
        xTeX, yTeX, limitTeX, oaTeX, funcTeX,
        qVATeX, qLateralTeX, qHATeX, qOATeX,
        labels, feedback,
        NO_VA_TEX, NO_HA_TEX, NO_OA_TEX
    };
})();
