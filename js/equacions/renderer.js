/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions/renderer.js
 * ROL: HTML de les equacions d'«Equacions de 1r grau»: els termes de cada costat
 *      (amb els signes entremig) i les línies de l'historial.
 * ARQUITECTURA:
 * - Funcions pures: retornen text HTML i no toquen la pàgina (les proven els
 *   tests amb Node, tests/equacions.test.js).
 * - «Resolució pas a pas» (?pissarra=1): com es dibuixa cada línia de l'historial
 *   amb les claus de la pissarra i què mou cada pas; l'historial (claus, còpies,
 *   fusions) el porta formules.js historial(). Vegeu la secció del final.
 * DEPENDÈNCIES: pissarra/formules.js (guio, historial).
 * ============================================================================
 */

import { guio, historial } from '../pissarra/formules.js';

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
    // L'historial es pinta dins d'una pissarra d'una sola fila amb formules.js historial(): cada pas
    // escriu una línia nova a sota i les d'abans queden escrites. Els símbols que el pas mou baixen
    // volant de la línia anterior a la nova (i a l'anterior en queda la còpia, quieta):
    //   · distributiva: la x i el coeficient de fora baixen al terme amb x, i el nombre de dins es
    //     fusiona en el terme independent nou;
    //   · sumar termes d'un costat, passar les x a l'esquerra, passar els nombres a la dreta: els
    //     termes que s'ajunten es fusionen en el terme nou;
    //   · aïllar la x: la x baixa, i el coeficient i el nombre de la dreta es fusionen en la solució.
    // Una línia és { left, right, inv }: els termes de la forma canònica; inv, la primera línia de
    // «b = ax» (es mostra amb els costats girats). La classe de cada línia (eq-original, eq-latest,
    // eq-solved o res) la porta l'historial.
    // Peces (els id de l'historial): <costat><i><peça> (costat L/R de la forma canònica, encara que
    // es mostri girat; i: posició del terme; peça s signe, c coeficient, x, n nombre, a «(», t signe
    // de dins, m nombre de dins, b «)», z el «0» d'un costat buit); el «=»: q.

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
     * Què fa un pas a la línia nova, en el format de formules.js historial(): { mou: {peça nova: peça
     * vella}, fusiona: {peça nova: [peces velles]} }, amb les peces escrites «<costat><i><peça>».
     */
    function moviments(pas) {
        const abans = { L: pas.dispLeftBefore, R: pas.dispRightBefore };
        const despres = { L: pas.dispLeftAfter, R: pas.dispRightAfter };
        const pa = { L: pecesCostat(abans.L), R: pecesCostat(abans.R) };
        const pd = { L: pecesCostat(despres.L), R: pecesCostat(despres.R) };
        const totes = (S, i) => (pa[S].get(i) || []).map(p => `${S}${i}${p}`);
        const te = (P, S, i, peca) => (P[S].get(i) || []).includes(peca);
        const mou = {},
            fusiona = {};
        // Uns termes que s'ajunten en un de nou (S, j): si el nou té coeficient, la primera x hi baixa
        // i la resta s'hi fusiona en el coeficient; si no, tot es fusiona en la x
        const ajunta = (fonts, S, j, k) => {
            const peces = fonts.flatMap(([T, i]) => totes(T, i));
            if (!peces.length) return;
            if (k === 'n' || te(pd, S, j, 'n')) {
                if (te(pd, S, j, 'n')) fusiona[`${S}${j}n`] = peces;
                return;
            }
            if (!te(pd, S, j, 'x')) return;
            if (te(pd, S, j, 'c')) {
                const [T0, i0] = fonts[0];
                mou[`${S}${j}x`] = `${T0}${i0}x`;
                fusiona[`${S}${j}c`] = peces.filter(p => p !== `${T0}${i0}x`);
            } else fusiona[`${S}${j}x`] = peces;
        };
        const t = pas.type;
        if (t === 'distribute_left' || t === 'distribute_right') {
            const S = t === 'distribute_left' ? 'L' : 'R',
                i = pas.distIdx;
            mou[`${S}${i}x`] = `${S}${i}x`;
            if (te(pa, S, i, 'c') && te(pd, S, i, 'c')) mou[`${S}${i}c`] = `${S}${i}c`;
            if (te(pa, S, i, 's') && te(pd, S, i, 's')) mou[`${S}${i}s`] = `${S}${i}s`;
            if (te(pd, S, i + 1, 'n'))
                fusiona[`${S}${i + 1}n`] = [`${S}${i}t`, `${S}${i}m`].filter(p => te(pa, S, i, p.slice(-1)));
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
            fusiona.R0n = peces;
        } else if (t === 'solve') {
            const [ix] = posicions(abans.L, 'x');
            mou.L0x = `L${ix}x`;
            const peces = totes('L', ix).filter(p => p !== `L${ix}x`);
            for (const i of posicions(abans.R, 'n')) peces.push(...totes('R', i));
            fusiona.R0n = peces;
        }
        return { mou, fusiona };
    }

    /**
     * Una línia de l'historial (vegeu més amunt), el pintor de formules.js historial(): clauDe(peça) dona la
     * clau de cada peça (sense clauDe, l'HTML de sempre); classe: la classe de la línia.
     */
    function liniaHtml(linia, clauDe = null, classe = '') {
        const clau = S => (clauDe ? (i, peca) => clauDe(`${S}${i}${peca}`) : null);
        const [esq, dre] = linia.inv
            ? [costatHtml(linia.right, clau('R')), costatHtml(linia.left, clau('L'))]
            : [costatHtml(linia.left, clau('L')), costatHtml(linia.right, clau('R'))];
        const igual = clauDe
            ? `<span class="eq-sign" data-k="${clauDe('q')}">=</span>`
            : '<span class="eq-sign">=</span>';
        return `<div class="eq-history-line${classe ? ' ' + classe : ''}">${esq}${igual}${dre}</div>`;
    }

    /** Totes les línies, a la fila de la pissarra. */
    const envolta = linies => `<div class="eq-linies">${linies.join('')}</div>`;

    /** El text pla d'una línia de l'historial (p. ex. «2x + 6 = 14»), per als lectors de pantalla. */
    function textLinia(linia) {
        const pla = arr => renderTerms(arr).replace(/<[^>]+>/g, '');
        const [esq, dre] = linia.inv ? [linia.right, linia.left] : [linia.left, linia.right];
        return `${pla(esq)} = ${pla(dre)}`;
    }

    /**
     * L'historial d'una equació (math-engine.js generateEquation), amb la primera línia escrita: un
     * historial d'una sola fila (formules.js). El primer pas de la pissarra és historia.passos[0].
     */
    function historiaNova(eq) {
        const g = guio(1);
        g.classes[0] = 'centrada';
        const H = historial(g, { prefix: 'e', pinta: liniaHtml, envolta });
        H.escriu({ left: eq.dispLeft, right: eq.dispRight, inv: !!eq.swapInitial }, '', { classe: 'eq-original' });
        return H;
    }

    /**
     * Escriu la línia d'un pas encertat (math-engine.js determineSteps); final: és l'últim. Torna el pas
     * de la pissarra, que anima la línia nova: la que era l'última deixa de ser-ho.
     */
    function escriuPas(H, pas, final) {
        const linia = { left: pas.dispLeftAfter, right: pas.dispRightAfter, inv: false };
        return H.escriu(
            linia,
            '',
            Object.assign(moviments(pas), {
                classe: final ? 'eq-solved' : 'eq-latest',
                classeAnterior: H.ultima.classe === 'eq-latest' ? '' : undefined,
                anunci: `Línia nova: ${textLinia(linia)}`,
            })
        );
    }

    return { renderOneToken, renderTerms, liniaHtml, envolta, moviments, textLinia, historiaNova, escriuPas };
})();
