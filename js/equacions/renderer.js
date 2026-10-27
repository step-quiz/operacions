/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions/renderer.js
 * ROL: HTML de les equacions d'«Equacions de 1r grau»: els termes de cada costat
 *      (amb els signes entremig) i les línies de l'historial.
 * ARQUITECTURA:
 * - Funcions pures: retornen text HTML i no toquen la pàgina (les proven els
 *   tests amb Node, tests/equacions.test.js).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const Renderer = (() => {
    // ---- RENDER DE TERMES ----
    //
    // renderOneToken(t) → { html, isNegative }
    //   Retorna la representació "absoluta" del terme i si la seva contribució
    //   al costat és negativa. La unió de tokens posa els signes entremig.
    //
    // Tipus de token:
    //   { k:'x', c }              → c·x
    //   { k:'n', v }              → v
    //   { k:'p', c, n }           → c·(x + n)
    //   { k:'_input_x', html }    → [input]·x  (placeholder per a un coeficient)
    //   { k:'_input_n', html }    → [input]    (placeholder per a una constant)

    function renderOneToken(t) {
        if (t.k === 'x') {
            const isNeg = t.c < 0;
            const a = Math.abs(t.c);
            const inner = a === 1 ? '<span class="eq-var">x</span>' : a + '<span class="eq-var">x</span>';
            return { html: inner, isNegative: isNeg };
        }
        if (t.k === 'n') {
            return { html: String(Math.abs(t.v)), isNegative: t.v < 0 };
        }
        if (t.k === 'p') {
            const isNeg = t.c < 0;
            const a = Math.abs(t.c);
            const outer = a === 1 ? '' : String(a);
            let innerStr;
            if (t.n > 0) innerStr = '<span class="eq-var">x</span> + ' + t.n;
            else if (t.n < 0) innerStr = '<span class="eq-var">x</span> − ' + Math.abs(t.n);
            else innerStr = '<span class="eq-var">x</span>';
            return { html: outer + '(' + innerStr + ')', isNegative: isNeg };
        }
        if (t.k === '_input_x') {
            return { html: t.html + '<span class="eq-var">x</span>', isNegative: false };
        }
        if (t.k === '_input_n') {
            return { html: t.html, isNegative: false };
        }
        return { html: '?', isNegative: false };
    }

    function renderTerms(arr) {
        // Filtrem termes nuls (però mai els placeholders ni els parèntesis)
        const filtered = arr.filter(t => {
            if (t.k === 'n') return t.v !== 0;
            if (t.k === 'x') return t.c !== 0;
            return true;
        });
        if (filtered.length === 0) return '0';

        let html = '';
        for (let i = 0; i < filtered.length; i++) {
            const piece = renderOneToken(filtered[i]);
            if (i === 0) {
                html = (piece.isNegative ? '−' : '') + piece.html;
            } else {
                html += (piece.isNegative ? ' − ' : ' + ') + piece.html;
            }
        }
        return html;
    }

    return { renderOneToken, renderTerms };
})();
