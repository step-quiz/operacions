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
    // TYPO HIGHLIGHT
    // Dona feedback visual de l'error sense revelar la solució:
    // retorna HTML amb la paraula de l'alumne i el(s) caràcter(s)
    // problemàtic(s) embolcallat(s) en <mark class="typo-err">.
    // =========================================================================

    /**
     * Construeix un mapa: índex normalitzat → índex original.
     * Necessari perquè la normalització elimina accents (NFD + strip combining)
     * i caràcters com ·, -, espais, desplaçant els índexs.
     * @param  {string} original  La paraula sense normalitzar
     * @returns {Object}          { normIdx: origIdx, … }
     */
    function _buildNormToOrigMap(original) {
        const map = {};
        let normIdx = 0;
        const s = original.toLowerCase();
        for (let i = 0; i < s.length; i++) {
            const nfd = s[i].normalize('NFD');
            let produced = 0;
            for (const c of nfd) {
                const code = c.charCodeAt(0);
                if (code >= 0x0300 && code <= 0x036F) continue; // combining marks
                if ('·- '.includes(c)) continue;                 // caràcters eliminats
                produced++;
            }
            if (produced > 0) {
                for (let k = 0; k < produced; k++) map[normIdx + k] = i;
                normIdx += produced;
            }
        }
        return map;
    }

    /**
     * Alineació de Levenshtein amb traceback.
     * Retorna una llista d'operacions d'edició:
     *   match   — caràcter igual a les dues cadenes
     *   sub     — substitució: ai (input) ≠ bi (target)
     *   extra   — caràcter de l'input que no existeix al target (inserció)
     *   missing — caràcter del target absent a l'input (esborrat);
     *             nearAi = índex a l'input just després del buit
     * @param  {string} a  Input normalitzat (paraula de l'alumne)
     * @param  {string} b  Target normalitzat (paraula correcta)
     * @returns {Array<{type:string, ai?:number, bi?:number, nearAi?:number}>}
     */
    function _levenshteinAlign(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) =>
            Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : (j === 0 ? i : 0))
        );
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);

        const ops = [];
        let i = m, j = n;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
                ops.unshift({ type: 'match', ai: i - 1, bi: j - 1 });
                i--; j--;
            } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
                // Substitució: caràcter equivocat a l'input
                ops.unshift({ type: 'sub', ai: i - 1, bi: j - 1 });
                i--; j--;
            } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
                // Caràcter de més a l'input
                ops.unshift({ type: 'extra', ai: i - 1 });
                i--;
            } else {
                // Caràcter que falta a l'input; nearAi = posició del següent char de l'input
                ops.unshift({ type: 'missing', nearAi: i });
                j--;
            }
        }
        return ops;
    }

    /** Escapa els caràcters especials HTML. */
    function _escHtml(ch) {
        return ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * Retorna un fragment HTML amb la paraula de l'alumne i el(s) caràcter(s)
     * problemàtic(s) marcats amb <mark class="typo-err">.
     *
     * Casos coberts:
     *  - Substitució  ("cuadrat" → marca la 'u')
     *  - Lletra de més ("quadratt" → marca la 't' extra)
     *  - Lletra que falta ("qudrat" → marca la 'd', que és el caràcter
     *    just after the gap; si falta al final → afegeix un '_' indicador)
     *
     * No revela la solució ni explica en quin sentit és l'error.
     *
     * @param  {string} input   El que ha escrit l'alumne
     * @param  {string} target  La paraula correcta
     * @returns {string}        HTML segur
     */
    function getTypoHighlight(input, target) {
        const ni = _normalitza(input);
        const nt = _normalitza(target);
        const ops = _levenshteinAlign(ni, nt);
        const normToOrig = _buildNormToOrigMap(input);

        const errorOrigPositions = new Set();
        let trailingGap = false; // lletra que falta al final de la paraula

        for (const op of ops) {
            if (op.type === 'sub' || op.type === 'extra') {
                const orig = normToOrig[op.ai];
                if (orig !== undefined) errorOrigPositions.add(orig);
            } else if (op.type === 'missing') {
                if (op.nearAi < ni.length) {
                    // Marca el caràcter just després del buit
                    const orig = normToOrig[op.nearAi];
                    if (orig !== undefined) errorOrigPositions.add(orig);
                } else {
                    // El buit és al final: indica-ho amb un placeholder
                    trailingGap = true;
                }
            }
        }

        let html = '';
        for (let k = 0; k < input.length; k++) {
            const ch = _escHtml(input[k]);
            html += errorOrigPositions.has(k)
                ? `<mark class="typo-err">${ch}</mark>`
                : ch;
        }
        if (trailingGap) {
            html += '<mark class="typo-err typo-err--gap">_</mark>';
        }
        return html;
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================
    return { shuffle, avaluaResposta, getTypoHighlight };

})();
