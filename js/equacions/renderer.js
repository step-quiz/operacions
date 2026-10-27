/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions/renderer.js
 * ROL: HTML de les equacions d'«Equacions de 1r grau»: els termes de cada costat
 *      (amb els signes entremig) i les línies de l'historial.
 * ARQUITECTURA:
 * - Funcions pures: retornen text HTML i no toquen la pàgina (les proven els
 *   tests amb Node, tests/equacions.test.js).
 * - «Resolució pas a pas» (?pissarra=1): l'historial amb les claus de la
 *   pissarra i què mou cada pas (vegeu la secció del final).
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

    // ---- «RESOLUCIÓ PAS A PAS» (?pissarra=1, js/pissarra/) ----
    //
    // L'historial es pinta dins d'una pissarra: cada pas escriu una línia nova a
    // sota i les d'abans queden escrites. Els símbols que el pas mou baixen volant
    // de la línia anterior a la nova (i a l'anterior en queda la còpia, quieta):
    //   · distributiva: la x i el coeficient de fora baixen al terme amb x, i el
    //     nombre de dins es fusiona en el terme independent nou;
    //   · sumar termes d'un costat, passar les x a l'esquerra, passar els nombres a
    //     la dreta: els termes que s'ajunten es fusionen en el terme nou;
    //   · aïllar la x: la x baixa, i el coeficient i el nombre de la dreta es
    //     fusionen en la solució.
    // Una línia de l'historial és { left, right, inv, classe, pas }: els termes de la
    // forma canònica; inv, la primera línia de «b = ax» (es mostra amb els costats
    // girats); classe (eq-original, eq-latest, eq-solved o ''); pas, el pas que l'ha
    // escrita (null a la primera).
    // Claus: e<r><costat><i><peça> (r: línia; costat L/R de la forma canònica, encara
    // que es mostri girat; i: posició del terme; peça s signe, c coeficient, x, n
    // nombre, a «(», t signe de dins, m nombre de dins, b «)», z el «0» d'un costat
    // buit); la còpia que queda d'una peça que ha baixat: f<r>…; el «=»: e<r>q.

    const esNul = t => (t.k === 'n' ? t.v === 0 : t.k === 'x' ? t.c === 0 : false);
    const esNegatiu = t => (t.k === 'n' ? t.v < 0 : t.c < 0);

    /** Les peces que es veuen de cada terme d'un costat: Map posició → [peces]. Un costat buit: «0» (z). */
    function pecesCostat(arr) {
        const out = new Map();
        const visibles = arr.map((t, i) => [t, i]).filter(([t]) => !esNul(t));
        if (!visibles.length) out.set(0, ['z']);
        visibles.forEach(([t, i], j) => {
            const p = j > 0 || esNegatiu(t) ? ['s'] : [];
            if (t.k === 'x') p.push(...(Math.abs(t.c) === 1 ? ['x'] : ['c', 'x']));
            else if (t.k === 'n') p.push('n');
            else p.push(...(Math.abs(t.c) === 1 ? [] : ['c']), 'a', 'x', ...(t.n ? ['t', 'm'] : []), 'b');
            out.set(i, p);
        });
        return out;
    }

    /** L'HTML d'un costat, com renderTerms; clau(i, peça) dona la clau de cada peça (o res). */
    function costatHtml(arr, clau) {
        const amb = (i, peca, text) => (clau ? `<span data-k="${clau(i, peca)}">${text}</span>` : text);
        const x = i =>
            clau ? `<span class="eq-var" data-k="${clau(i, 'x')}">x</span>` : '<span class="eq-var">x</span>';
        const visibles = arr.map((t, i) => [t, i]).filter(([t]) => !esNul(t));
        if (!visibles.length) return amb(0, 'z', '0');
        return visibles
            .map(([t, i], j) => {
                const neg = esNegatiu(t);
                const signe = j === 0 ? (neg ? amb(i, 's', '−') : '') : ` ${amb(i, 's', neg ? '−' : '+')} `;
                const a = Math.abs(t.c);
                if (t.k === 'x') return signe + (a === 1 ? '' : amb(i, 'c', a)) + x(i);
                if (t.k === 'n') return signe + amb(i, 'n', Math.abs(t.v));
                const dins = t.n ? ` ${amb(i, 't', t.n > 0 ? '+' : '−')} ${amb(i, 'm', Math.abs(t.n))}` : '';
                return signe + (a === 1 ? '' : amb(i, 'c', a)) + amb(i, 'a', '(') + x(i) + dins + amb(i, 'b', ')');
            })
            .join('');
    }

    /** Les posicions dels termes d'un tipus en un costat (sense els nuls). */
    const posicions = (arr, k) => arr.map((t, i) => (t.k === k && !esNul(t) ? i : -1)).filter(i => i >= 0);

    /**
     * Què fa un pas a la línia nova: { mou: [[peça nova, peça vella]], fusiona: [[peça nova, [peces velles]]] },
     * amb les peces escrites «<costat><i><peça>» (forma canònica).
     */
    function moviments(pas) {
        const abans = { L: pas.dispLeftBefore, R: pas.dispRightBefore };
        const despres = { L: pas.dispLeftAfter, R: pas.dispRightAfter };
        const pa = { L: pecesCostat(abans.L), R: pecesCostat(abans.R) };
        const pd = { L: pecesCostat(despres.L), R: pecesCostat(despres.R) };
        const totes = (S, i) => (pa[S].get(i) || []).map(p => `${S}${i}${p}`);
        const te = (P, S, i, peca) => (P[S].get(i) || []).includes(peca);
        const mou = [],
            fusiona = [];
        // Uns termes que s'ajunten en un de nou (S, j): si el nou té coeficient, la primera x hi baixa
        // i la resta s'hi fusiona en el coeficient; si no, tot es fusiona en la x
        const ajunta = (fonts, S, j, k) => {
            const peces = fonts.flatMap(([T, i]) => totes(T, i));
            if (!peces.length) return;
            if (k === 'n' || te(pd, S, j, 'n')) {
                if (te(pd, S, j, 'n')) fusiona.push([`${S}${j}n`, peces]);
                return;
            }
            if (!te(pd, S, j, 'x')) return;
            if (te(pd, S, j, 'c')) {
                const [T0, i0] = fonts[0];
                mou.push([`${S}${j}x`, `${T0}${i0}x`]);
                fusiona.push([`${S}${j}c`, peces.filter(p => p !== `${T0}${i0}x`)]);
            } else fusiona.push([`${S}${j}x`, peces]);
        };
        const t = pas.type;
        if (t === 'distribute_left' || t === 'distribute_right') {
            const S = t === 'distribute_left' ? 'L' : 'R',
                i = pas.distIdx;
            mou.push([`${S}${i}x`, `${S}${i}x`]);
            if (te(pa, S, i, 'c') && te(pd, S, i, 'c')) mou.push([`${S}${i}c`, `${S}${i}c`]);
            if (te(pa, S, i, 's') && te(pd, S, i, 's')) mou.push([`${S}${i}s`, `${S}${i}s`]);
            if (te(pd, S, i + 1, 'n'))
                fusiona.push([`${S}${i + 1}n`, [`${S}${i}t`, `${S}${i}m`].filter(p => te(pa, S, i, p.slice(-1)))]);
        } else if (/^simplify_(left|right)_(x|n)$/.test(t)) {
            const S = t.includes('left') ? 'L' : 'R',
                k = t.slice(-1);
            ajunta(
                posicions(abans[S], k).map(i => [S, i]),
                S,
                despres[S].findIndex(u => u.k === k),
                k
            );
        } else if (t === 'group_x') {
            const fonts = [
                ...posicions(abans.L, 'x').map(i => ['L', i]),
                ...posicions(abans.R, 'x').map(i => ['R', i]),
            ];
            ajunta(
                fonts,
                'L',
                despres.L.findIndex(u => u.k === 'x'),
                'x'
            );
        } else if (t === 'group_num') {
            const fonts = [
                ...posicions(abans.L, 'n').map(i => ['L', i]),
                ...posicions(abans.R, 'n').map(i => ['R', i]),
            ];
            const peces = fonts.flatMap(([T, i]) => totes(T, i));
            if (pa.R.has(0) && pa.R.get(0).includes('z')) peces.push('R0z'); // el «0» d'un costat buit
            fusiona.push(['R0n', peces]);
        } else if (t === 'solve') {
            const [ix] = posicions(abans.L, 'x');
            mou.push(['L0x', `L${ix}x`]);
            const peces = totes('L', ix).filter(p => p !== `L${ix}x`);
            for (const i of posicions(abans.R, 'n')) peces.push(...totes('R', i));
            fusiona.push(['R0n', peces]);
        }
        return { mou, fusiona };
    }

    /** Les peces de la línia r que han baixat a la línia r + 1 (Set de «<costat><i><peça>»). */
    function baixades(historia, r) {
        const seguent = historia[r + 1];
        if (!seguent || !seguent.pas) return new Set();
        const { mou, fusiona } = moviments(seguent.pas);
        return new Set([...mou.map(([, v]) => v), ...fusiona.flatMap(([, vs]) => vs)]);
    }

    /** Una línia de l'historial (vegeu més amunt); r: la seva posició. claus: posa les claus de la pissarra. */
    function liniaHtml(linia, r, { claus = false, fonts = new Set() } = {}) {
        const clau = S =>
            claus ? (i, peca) => `${fonts.has(`${S}${i}${peca}`) ? 'f' : 'e'}${r}${S}${i}${peca}` : null;
        const [esq, dre] = linia.inv
            ? [costatHtml(linia.right, clau('R')), costatHtml(linia.left, clau('L'))]
            : [costatHtml(linia.left, clau('L')), costatHtml(linia.right, clau('R'))];
        const igual = claus ? `<span class="eq-sign" data-k="e${r}q">=</span>` : '<span class="eq-sign">=</span>';
        return `<div class="eq-history-line${linia.classe ? ' ' + linia.classe : ''}">${esq}${igual}${dre}</div>`;
    }

    /** Tot l'historial, amb les claus de la pissarra. */
    function historiaHtml(historia) {
        const linies = historia.map((l, r) => liniaHtml(l, r, { claus: true, fonts: baixades(historia, r) }));
        return `<div class="eq-linies">${linies.join('')}</div>`;
    }

    /** L'animació de l'última línia: { reanomena, fusiona, copia } amb les claus de la pissarra. */
    function animacioUltimaLinia(historia) {
        const r = historia.length - 1;
        if (r < 1 || !historia[r].pas) return {};
        const { mou, fusiona } = moviments(historia[r].pas);
        const vella = p => `e${r - 1}${p}`,
            nova = p => `e${r}${p}`;
        const fonts = baixades(historia, r - 1);
        return {
            reanomena: Object.fromEntries(mou.map(([n, v]) => [nova(n), vella(v)])),
            fusiona: Object.fromEntries(fusiona.map(([n, vs]) => [nova(n), vs.map(vella)])),
            copia: Object.fromEntries([...fonts].map(p => [`f${r - 1}${p}`, vella(p)])),
        };
    }

    return { renderOneToken, renderTerms, liniaHtml, historiaHtml, animacioUltimaLinia, moviments };
})();
