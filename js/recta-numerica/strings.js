/**
 * ============================================================================
 * PROJECTE: Recta Numèrica Doble
 * FITXER: js/recta-numerica/strings.js
 * ROL: Font única de tots els textos visibles a l'alumne.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
window.Strings = (() => {

    /** Etiqueta de dia en català */
    function dayLabel(x) {
        if (x ===  0) return 'avui';
        if (x === -1) return 'ahir';
        if (x === -2) return "abans-d'ahir";
        if (x ===  1) return 'demà';
        if (x ===  2) return 'demà-passat';
        return x < 0 ? `fa ${Math.abs(x)} dies` : `d'aquí ${x} dies`;
    }

    /** Etiqueta de temperatura completa: "3 graus sobre zero", "2 graus sota zero", "0 graus" */
    function tempLabel(y) {
        if (y === 0) return '0 graus';
        const abs = Math.abs(y);
        const pl  = abs === 1 ? 'grau' : 'graus';
        return y > 0 ? `${abs} ${pl} sobre zero` : `${abs} ${pl} sota zero`;
    }

    /** "puja" / "baixa" / "es manté" */
    function changeLabel(delta) {
        if (delta > 0) return 'puja';
        if (delta < 0) return 'baixa';
        return 'es manté';
    }

    /** "positiva" / "negativa" */
    function signLabel(y) {
        if (y > 0) return 'positiva (sobre zero)';
        if (y < 0) return 'negativa (sota zero)';
        return 'exactament 0';
    }

    /**
     * Etiqueta numèrica per a opcions de Q1/Q2.
     * Mostra el valor amb − tipogràfic per als negatius.
     */
    function numLabel(y) {
        if (y === 0) return '0';
        return y > 0 ? `${y}` : `\u2212${Math.abs(y)}`;   // −  (U+2212)
    }

    /**
     * Etiqueta de recompte per a Q3.
     */
    function countLabel(n) {
        if (n === 0) return 'No hi ha cap dia amb aquesta temperatura';
        if (n === 1) return 'Sí, hi ha exactament 1 dia amb aquesta temperatura';
        return `Hi ha exactament ${n} dies amb aquesta temperatura`;
    }

    /** Verb de temps per a un dia concret */
    function verbTense(x) {
        // Present/passat → "era" (o "és" per a avui), futur → "estarà"
        if (x  <  0) return 'era';
        if (x === 0) return 'és';
        return 'estarà';
    }

    // ---- PROMPTS --------------------------------------------------------

    /** Pregunta Q1 */
    const Q1_PROMPT = 'Quina temperatura fa avui?';

    /** Pregunta Q2 */
    function q2Prompt(x) {
        if (x < 0) return `Quina temperatura feia ${dayLabel(x)}?`;
        return `Quina temperatura farà ${dayLabel(x)}?`;
    }

    /** Pregunta Q3 */
    function q3Prompt(y) {
        return `Hi ha algun dia representat al gràfic on la temperatura sigui exactament de ${tempLabel(y)}?`;
    }

    /** Pregunta Q4 */
    const Q4_PROMPT = 'Selecciona la frase correcta:';

    // ---- FEEDBACKS ------------------------------------------------------

    const feedback = {
        correct_generic:    '✓ Correcte!',
        correct_q1:         (y)    => `✓ Correcte! Avui la temperatura és de ${tempLabel(y)}.`,
        correct_q2:         (x, y) => `✓ Correcte! ${capitalize(dayLabel(x))}, la temperatura ${verbTense(x)} de ${tempLabel(y)}.`,
        correct_q3_zero:    (y)    => `✓ Correcte! Cap punt del gràfic té una temperatura de ${tempLabel(y)}.`,
        correct_q3_some:    (n, y) => `✓ Correcte! Hi ha ${n === 1 ? '1 dia' : `${n} dies`} amb temperatura de ${tempLabel(y)}.`,
        correct_q4:         '✓ Correcte! Has llegit bé el gràfic.',
        wrong_q1q2:         'Busca bé el punt a l\'eix horitzontal i llegeix el valor a l\'eix vertical.',
        wrong_q3:           'Compta amb cura els punts que tenen exactament aquesta temperatura.',
        wrong_q4:           'Llegeix amb cura cada valor del gràfic abans de triar.',
    };

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    return {
        dayLabel, tempLabel, changeLabel, signLabel,
        numLabel, countLabel, verbTense, capitalize,
        Q1_PROMPT, q2Prompt, q3Prompt, Q4_PROMPT,
        feedback
    };
})();
