/**
 * ============================================================================
 * PROJECTE: Asímptotes i Límits Laterals
 * FITXER: js/asimptotes/strings-asimptotes.js
 * ROL: Font única de tots els textos visibles a l'alumne.
 * ============================================================================
 */
window.StringsA = (() => {

    const INF = Infinity;

    // ---- etiquetes de valors ------------------------------------------------

    function xLabel(a) {
        if (a === 0)  return 'x = 0';
        if (a > 0)    return `x = ${a}`;
        return `x = −${-a}`;
    }

    function yLabel(b) {
        if (b === 0)  return 'y = 0';
        if (b > 0)    return `y = ${b}`;
        return `y = −${-b}`;
    }

    function limitLabel(v) {
        if (v === INF)   return '+∞';
        if (v === -INF)  return '−∞';
        if (v === null)  return 'No existeix (fora del domini)';
        if (v === 0)     return '0';
        return `${v < 0 ? '−' : ''}${Math.abs(v)}`;
    }

    function oaLabel(m, b) {
        const bPart = b === 0 ? '' : b > 0 ? ` + ${b}` : ` − ${-b}`;
        return `y = x${bPart}`;
    }

    function aLabel(a) {
        if (a === 0)  return '0';
        if (a > 0)    return `${a}`;
        return `−${-a}`;
    }

    // ---- display HTML de la funció ------------------------------------------

    function funcHTML(func) {
        if (func.numStr !== null) {
            return `f(x) = <span class="mfrac"><span class="mnum">${func.numStr}</span><span class="mden">${func.denStr}</span></span>`;
        }
        // Expressió directa (log, exp)
        const expr = func.exprStr
            .replace('e^', 'e<sup>')
            .replace(/\)$/, ')</sup>');
        // Millor: replacements específics
        return `f(x) = ${_formatExpr(func.exprStr)}`;
    }

    function _formatExpr(s) {
        // e^(1/(x−a)) → e<sup>1/(x−a)</sup>
        const expMatch = s.match(/^e\^\((.+)\)$/);
        if (expMatch) return `e<sup>${expMatch[1]}</sup>`;
        // ln(...)
        const lnMatch = s.match(/^ln\((.+)\)$/);
        if (lnMatch) return `ln(${lnMatch[1]})`;
        return s;
    }

    // ---- prompts de preguntes -----------------------------------------------

    function qVAPrompt(func) {
        return `Troba l'asímptota vertical de:<div class="math-display">${funcHTML(func)}</div>`;
    }

    function qLateralPrompt(func, a, side) {
        const sideStr = side === 'right' ? '⁺' : '⁻';
        const aStr    = aLabel(a);
        return `Calcula el límit lateral:<div class="math-display"><span class="mlimit">lim <sub>x → ${aStr}${sideStr}</sub> ${funcHTML(func)}</span></div>`;
    }

    function qHAPrompt(func) {
        return `Troba l'asímptota horitzontal de:<div class="math-display">${funcHTML(func)}</div>`;
    }

    function qOAPrompt(func) {
        return `Troba l'asímptota obliqua de:<div class="math-display">${funcHTML(func)}</div>`;
    }

    // ---- feedbacks ----------------------------------------------------------

    const feedback = {
        correct_va:      a      => `✓ Correcte! L'asímptota vertical és ${xLabel(a)}.`,
        correct_no_va:   ()     => `✓ Correcte! Aquesta funció no té asímptota vertical.`,
        correct_lateral: v      => `✓ Correcte! El límit lateral és ${limitLabel(v)}.`,
        correct_ha:      b      => `✓ Correcte! L'asímptota horitzontal és ${yLabel(b)}.`,
        correct_no_ha:   ()     => `✓ Correcte! Aquesta funció no té asímptota horitzontal.`,
        correct_oa:      (m, b) => `✓ Correcte! L'asímptota obliqua és ${oaLabel(m, b)}.`,
        correct_no_oa:   ()     => `✓ Correcte! Aquesta funció no té asímptota obliqua.`,
        wrong_va:        'Recorda: l\'AV es troba igualment a x = a quan el denominador s\'anul·la.',
        wrong_lateral:   'Analitza el signe quan x s\'acosta al punt des de cada costat.',
        wrong_ha:        'Calcula lim f(x) quan x → +∞ i x → −∞.',
        wrong_oa:        'Fes la divisió polinòmica del numerador entre el denominador.',
    };

    // ---- etiquetes UI -------------------------------------------------------

    const NO_VA = 'No té asímptota vertical';
    const NO_HA = 'No té asímptota horitzontal';
    const NO_OA = 'No té asímptota obliqua';

    return {
        xLabel, yLabel, limitLabel, oaLabel, aLabel,
        funcHTML,
        qVAPrompt, qLateralPrompt, qHAPrompt, qOAPrompt,
        feedback,
        NO_VA, NO_HA, NO_OA
    };
})();
