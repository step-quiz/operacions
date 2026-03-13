/**
 * ============================================================================
 * PROJECTE: Vocabulari Matemàtic
 * FITXER: js/vocabulari/vocabulari-engine.js
 * ROL: Lògica pura del joc, sense DOM ni estat extern.
 * ARQUITECTURA:
 * - Mòdul IIFE sense efectes secundaris.
 * - shuffle():        barreja un array (Fisher-Yates).
 * - avaluaResposta(): compara la resposta de l'alumne amb la paraula correcta
 *   i retorna 'correct' | 'typo' | 'wrong'.
 *   Usa distància de Levenshtein normalitzada per a la detecció d'errors
 *   tipogràfics, ignorant accents, espais i punts volats (·).
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
window.VocabEngine = (() => {

    // =========================================================================
    // SHUFFLE (Fisher-Yates)
    // =========================================================================
    /**
     * Retorna una còpia barrejada de l'array. No modifica l'original.
     * @param  {Array} arr
     * @returns {Array}
     */
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // =========================================================================
    // FUZZY MATCHING
    // =========================================================================

    /**
     * Distància de Levenshtein entre dos strings.
     * @param  {string} a
     * @param  {string} b
     * @returns {number}
     */
    function _levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        return dp[m][n];
    }

    /**
     * Normalitza un string per a comparació:
     * - Minúscules
     * - Sense accents (NFD + strip combining marks)
     * - Sense punts volats (·), guions i espais
     * @param  {string} s
     * @returns {string}
     */
    function _normalitza(s) {
        return String(s)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[·\-\s]+/g, '');
    }

    /**
     * Avalua la resposta de l'alumne contra la paraula correcta.
     *
     * Lògica:
     *  - Normalitza ambdues per eliminar diferències d'accents/espais.
     *  - Si coincideixen exactament → 'correct'
     *  - Si la distància Levenshtein és ≤ llindar → 'typo' (avisa sense penalitzar)
     *    Llindar: 1 per a paraules curtes (≤5 caràcters normalitzats), 2 per a llargues.
     *  - Altrament → 'wrong'
     *
     * @param  {string} input   El que ha escrit l'alumne
     * @param  {string} target  La paraula correcta
     * @returns {'correct'|'typo'|'wrong'}
     */
    function avaluaResposta(input, target) {
        const ni = _normalitza(input);
        const nt = _normalitza(target);
        if (ni === nt) return 'correct';
        const dist      = _levenshtein(ni, nt);
        const threshold = nt.length <= 5 ? 1 : 2;
        return dist <= threshold ? 'typo' : 'wrong';
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================
    return { shuffle, avaluaResposta };

})();
