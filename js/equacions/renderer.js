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
 *   fusions) el porta formules.js historial(). I el detall a demanda de cada pas
 *   («Vull més detall»: detallPas, obreDetall). Vegeu les seccions del final.
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
        if (linia.peces) return pecesHtml(linia.peces, clauDe, classe);
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
        if (linia.peces)
            return linia.peces.map(p => (p.tipus === 'op' || p.tipus === 'igual' ? ` ${p.t} ` : p.t)).join('');
        const pla = arr => renderTerms(arr).replace(/<[^>]+>/g, '');
        const [esq, dre] = linia.inv ? [linia.right, linia.left] : [linia.left, linia.right];
        return `${pla(esq)} = ${pla(dre)}`;
    }

    /**
     * L'historial d'una equació (math-engine.js generateEquation), amb la primera línia escrita: un
     * historial d'una sola fila (formules.js). El primer pas de la pissarra és historia.passos[0].
     * oberts: els passos que s'escriuen amb el detall obert (les proves; l'activitat obre el pas amb
     * obreDetall quan l'alumne ho demana).
     */
    function historiaNova(eq, { oberts = new Set() } = {}) {
        const g = guio(1);
        g.classes[0] = 'centrada';
        const H = historial(g, { prefix: 'e', pinta: liniaHtml, envolta, oberts });
        H.escriu({ left: eq.dispLeft, right: eq.dispRight, inv: !!eq.swapInitial }, '', { classe: 'eq-original' });
        return H;
    }

    /** Les opcions de la línia d'un pas encertat: la seva classe, la de la línia anterior i l'anunci. */
    const opcionsPas = (H, linia, final) => ({
        classe: final ? 'eq-solved' : 'eq-latest',
        classeAnterior: H.ultima.classe === 'eq-latest' ? '' : undefined,
        anunci: `Línia nova: ${textLinia(linia)}`,
    });
    const liniaDe = pas => ({ left: pas.dispLeftAfter, right: pas.dispRightAfter, inv: false });

    /**
     * Escriu la línia d'un pas encertat (math-engine.js determineSteps); final: és l'últim. Torna el pas
     * de la pissarra, que anima la línia nova: la que era l'última deixa de ser-ho. Si el pas té detall,
     * el porta (teDetall): obert, s'escriu com amb obreDetall (és el que fan les proves amb totes les vistes).
     */
    function escriuPas(H, pas, final) {
        const linia = liniaDe(pas);
        const det = detallPas(pas);
        const op = Object.assign(moviments(pas), opcionsPas(H, linia, final));
        if (det)
            Object.assign(op, {
                titol: det.titol,
                detall: D => {
                    escriuSubpassos(D, det);
                    tancaDetall(D, det, linia);
                },
            });
        return H.escriu(linia, '', op);
    }

    /**
     * L'alumne demana més detall abans de contestar el pas: s'obre a l'historial i s'hi escriuen els
     * subpassos, que porten fins just abans de la resposta. Torna { passos, acaba }: passos, els passos de
     * la pissarra dels subpassos (es mostren d'un en un); acaba(), quan l'alumne ha contestat bé, escriu la
     * línia del pas a partir de l'última del detall i en torna el pas. Sense detall, null.
     */
    function obreDetall(H, pas, final) {
        const det = detallPas(pas);
        if (!det) return null;
        const linia = liniaDe(pas);
        const D = H.obre(linia, Object.assign(opcionsPas(H, linia, final), { titol: det.titol }));
        return { passos: escriuSubpassos(D, det), acaba: () => tancaDetall(D, det, linia) };
    }

    const escriuSubpassos = (D, det) =>
        det.subpassos.map(sp =>
            D.escriu(sp.linia, sp.text, {
                mou: sp.mou,
                fusiona: sp.fusiona,
                reparteix: sp.reparteix,
                anunci: `${sp.text} ${textLinia(sp.linia)}`,
            })
        );
    const tancaDetall = (D, det, linia) =>
        D.acaba('', Object.assign({}, det.acaba, { anunci: `Línia nova: ${textLinia(linia)}` }));

    // ---- DETALL A DEMANDA («Vull més detall», etapa 3 de la revisió del 14/11/2026) ----
    //
    // Abans de contestar un pas, l'alumne pot demanar més detall: la pissarra escriu dins d'un calaix uns
    // subpassos que porten fins just abans de la resposta (l'últim càlcul encara el fa l'alumne), i quan
    // contesta bé, la línia del pas surt de l'última línia del detall:
    //   · distributiva: 2(x + 3) → 2·x + 2·3 (el 2 es reparteix als dos termes);
    //   · ajuntar els termes amb x d'un costat: 3x + 2x → (3 + 2)x;
    //   · passar les x a l'esquerra: resta 2x als dos membres; 2x − 2x = 0; sumar 0 no canvia res;
    //   · passar els nombres a la dreta: resta 4 als dos membres; 4 − 4 = 0; sumar 0 no canvia res;
    //   · aïllar la x: divideix els dos membres per 3; 3x : 3 = x.
    // Ajuntar els nombres d'un costat (4 + 6) no en té. Cada línia del detall és una equació amb la mateixa
    // solució (tests/equacions.test.js, amb totes les vistes). Com als passos de sempre, només volen els
    // símbols que fan el canvi; la resta de la línia nova hi apareix.
    // Una línia del detall és { peces: [{ id, t, tipus }] }: t, el text; tipus 'x' (la incògnita), 'op' (un
    // signe entre dos termes, amb espais), 'igual' (el «=») o res. Les peces dels termes que ja hi eren porten
    // l'id de sempre (<costat><i><peça>); les noves, un id propi.

    const IGUAL = { id: 'q', t: '=', tipus: 'igual' };
    const pc = (id, t, tipus = '') => ({ id, t: String(t), tipus });
    /** Un factor d'un producte o d'una divisió: entre parèntesis si és negatiu, (−2). */
    const factor = v => (v < 0 ? `(−${Math.abs(v)})` : String(v));
    /** Un nombre amb el seu signe: −3. */
    const ambSigne = v => (v < 0 ? `−${Math.abs(v)}` : String(v));
    /** Un terme amb x escrit: 2x, x, −3x, −x. */
    const monomi = c => `${c < 0 ? '−' : ''}${Math.abs(c) === 1 ? '' : Math.abs(c)}x`;

    /** L'HTML d'una línia del detall (com liniaHtml). */
    function pecesHtml(peces, clauDe, classe) {
        const k = id => (clauDe ? ` data-k="${clauDe(id)}"` : '');
        const html = peces
            .map(p => {
                if (p.tipus === 'x') return `<span class="eq-var"${k(p.id)}>x</span>`;
                if (p.tipus === 'igual') return `<span class="eq-sign"${k(p.id)}>=</span>`;
                const span = clauDe ? `<span${k(p.id)}>${p.t}</span>` : p.t;
                return p.tipus === 'op' ? ` ${span} ` : span;
            })
            .join('');
        return `<div class="eq-history-line${classe ? ' ' + classe : ''}">${html}</div>`;
    }

    /** Les peces d'un terme, com les dibuixa costatHtml, amb els id de sempre; primer: és el primer del costat. */
    function pecesTerme(t, S, i, primer) {
        const id = p => `${S}${i}${p}`;
        const out = [];
        const neg = esNegatiu(t);
        if (!primer) out.push(pc(id('s'), neg ? '−' : '+', 'op'));
        else if (neg) out.push(pc(id('s'), '−'));
        const a = Math.abs(t.c);
        if (t.k === 'x') {
            if (a !== 1) out.push(pc(id('c'), a));
            out.push(pc(id('x'), 'x', 'x'));
        } else if (t.k === 'n') out.push(pc(id('n'), Math.abs(t.v)));
        else {
            if (a !== 1) out.push(pc(id('c'), a));
            out.push(pc(id('a'), '('), pc(id('x'), 'x', 'x'));
            if (t.n) out.push(pc(id('t'), t.n > 0 ? '+' : '−', 'op'), pc(id('m'), Math.abs(t.n)));
            out.push(pc(id('b'), ')'));
        }
        return out;
    }

    /** Els termes que es veuen d'un costat: [{ t, i }] (i: la posició a la forma canònica). */
    const visibles = arr => arr.map((t, i) => ({ t, i })).filter(({ t }) => !esNul(t));
    /** Les peces d'uns termes seguits (cada un sap si és el primer); un costat sense termes és «0». */
    const costatDe = (termes, S, zero = `${S}0z`) =>
        termes.length ? termes.flatMap(({ t, i }, j) => pecesTerme(t, S, i, j === 0)) : [pc(zero, '0')];
    const linia = (L, R) => ({ peces: [...L, IGUAL, ...R] });
    /** Les peces del terme i d'un costat dins d'una línia del detall. */
    const delTerme = (peces, S, i) => peces.filter(p => new RegExp(`^${S}${i}[a-z]$`).test(p.id));

    /** 2(x + 3) → 2·x + 2·3. */
    function detallDistributiva(pas) {
        const S = pas.type === 'distribute_left' ? 'L' : 'R';
        const O = S === 'L' ? 'R' : 'L';
        const { distOuter: c, distInner: n, distIdx: i } = pas;
        if (c === 1 || !n) return null;
        const abans = S === 'L' ? pas.dispLeftBefore : pas.dispRightBefore;
        const altre = S === 'L' ? pas.dispRightBefore : pas.dispLeftBefore;
        const id = p => `${S}${i}${p}`;
        const v = visibles(abans);
        const primer = v.findIndex(e => e.i === i) === 0;
        const nous = [];
        if (!primer) nous.push(pc(c > 0 ? id('s') : id('u'), '+', 'op'));
        nous.push(pc(id('c1'), factor(c)), pc(id('d1'), '·'), pc(id('x'), 'x', 'x'), pc(id('v'), '+', 'op'));
        nous.push(pc(id('c2'), factor(c)), pc(id('d2'), '·'), pc(id('n2'), factor(n)));
        const costatS = v.flatMap((e, k) => (e.i === i ? nous : pecesTerme(e.t, S, e.i, k === 0)));
        const costatO = costatDe(visibles(altre), O);
        const mou = { [id('x')]: id('x'), [id('n2')]: id('m') };
        const fusiona = {};
        // El de fora vola als dos productes; si és negatiu, el «−» va al primer (amb c = −1, el «−» és el que vola)
        const reparteix = Math.abs(c) !== 1 ? { [id('c')]: [id('c1'), id('c2')] } : { [id('s')]: [id('c1'), id('c2')] };
        if (c < 0 && Math.abs(c) !== 1) fusiona[id('c1')] = [id('s')];
        if (n > 0) mou[id('v')] = id('t');
        else fusiona[id('n2')] = [id('t')];
        // Tancament: c·x → el terme amb x; c·n → el terme independent nou (la resposta)
        const A = p => `${S}${i}${p}`;
        const B = p => `${S}${i + 1}${p}`;
        const acaba = {
            mou: { [A('x')]: id('x'), [B('s')]: id('v') },
            fusiona: { [B('n')]: [id('c2'), id('d2'), id('n2')] },
        };
        if (c > 0) acaba.mou[A('c')] = id('c1');
        else if (Math.abs(c) !== 1) acaba.reparteix = { [id('c1')]: [A('s'), A('c')] };
        else acaba.mou[A('s')] = id('c1');
        return {
            titol: 'Detall: la propietat distributiva',
            subpassos: [
                {
                    linia: S === 'L' ? linia(costatS, costatO) : linia(costatO, costatS),
                    text: `Multiplica el ${ambSigne(c)} per cada terme del parèntesi.`,
                    mou,
                    fusiona,
                    reparteix,
                },
            ],
            acaba,
        };
    }

    /** 3x + 2x → (3 + 2)x. */
    function detallAjuntaX(pas) {
        const S = pas.type.includes('left') ? 'L' : 'R';
        const O = S === 'L' ? 'R' : 'L';
        const abans = S === 'L' ? pas.dispLeftBefore : pas.dispRightBefore;
        const altre = S === 'L' ? pas.dispRightBefore : pas.dispLeftBefore;
        const despres = S === 'L' ? pas.dispLeftAfter : pas.dispRightAfter;
        const v = visibles(abans);
        const xs = v.filter(e => e.t.k === 'x');
        const suma = xs.reduce((a, e) => a + e.t.c, 0);
        if (xs.length < 2 || !suma) return null;
        const i1 = xs[0].i;
        const id = (i, p) => `${S}${i}${p}`;
        const primer = v[0].i === i1;
        // El grup: [+] ( c1 ± c2 … ) x, amb els coeficients amb el seu signe
        const grup = [];
        if (!primer) grup.push(pc(id(i1, 'gs'), '+', 'op'));
        grup.push(pc(id(i1, 'ga'), '('));
        xs.forEach((e, p) => {
            if (p > 0) grup.push(pc(id(e.i, 'e'), e.t.c < 0 ? '−' : '+', 'op'));
            else if (e.t.c < 0) grup.push(pc(id(e.i, 'e'), '−'));
            grup.push(pc(id(e.i, 'k'), Math.abs(e.t.c)));
        });
        grup.push(pc(id(i1, 'gb'), ')'), pc(id(i1, 'x'), 'x', 'x'));
        const costatS = v.flatMap((e, k) =>
            e.t.k !== 'x' ? pecesTerme(e.t, S, e.i, k === 0) : e.i === i1 ? grup : []
        );
        const mou = { [id(i1, 'x')]: id(i1, 'x') };
        const fusiona = { [id(i1, 'x')]: xs.slice(1).map(e => id(e.i, 'x')) };
        xs.forEach((e, p) => {
            if (Math.abs(e.t.c) !== 1) mou[id(e.i, 'k')] = id(e.i, 'c');
            const teSigne = v[0].i !== e.i || e.t.c < 0;
            if (!teSigne) return;
            if (p === 0 && e.t.c > 0) mou[id(i1, 'gs')] = id(i1, 's');
            else mou[id(e.i, 'e')] = id(e.i, 's');
        });
        const text = grup
            .filter(p => !p.id.endsWith('gs'))
            .map(p => (p.tipus === 'op' ? ` ${p.t} ` : p.t))
            .join('');
        // Tancament: el contingut del parèntesi es fusiona en el coeficient (la resposta) i la x hi baixa
        const j = despres.findIndex(t => t.k === 'x');
        const A = p => `${S}${j}${p}`;
        const dins = grup.filter(p => p.tipus !== 'x' && !p.id.endsWith('gs')).map(p => p.id);
        const acaba = {
            mou: { [A('x')]: id(i1, 'x') },
            fusiona: { [Math.abs(suma) !== 1 ? A('c') : A('x')]: dins },
        };
        if (!primer) acaba.mou[A('s')] = id(i1, 'gs');
        return {
            titol: 'Detall: ajuntar els termes amb x',
            subpassos: [
                {
                    linia:
                        S === 'L'
                            ? linia(costatS, costatDe(visibles(altre), O))
                            : linia(costatDe(visibles(altre), O), costatS),
                    text: `Ajunta els termes amb x: ${text}.`,
                    mou,
                    fusiona,
                },
            ],
            acaba,
        };
    }

    /** 5x + 3 = 2x + 9: resta 2x als dos membres; 2x − 2x = 0; sumar 0 no canvia res. */
    function detallPassaX(pas) {
        const vL = visibles(pas.dispLeftBefore),
            vR = visibles(pas.dispRightBefore);
        const eR = vR.find(e => e.t.k === 'x');
        if (!eR) return null;
        const eL = vL.find(e => e.t.k === 'x');
        const rC = eR.t.c;
        const k = Math.abs(rC);
        const signe = rC > 0 ? '−' : '+';
        const R = p => `R${eR.i}${p}`;
        // El terme nou (−2x) als dos costats: a l'esquerra, darrere del terme amb x (o al davant, si no n'hi ha)
        const nouL = primer => [
            ...(primer ? (rC > 0 ? [pc('Lgs', '−')] : []) : [pc('Lgs', signe, 'op')]),
            ...(k !== 1 ? [pc('Lgc', k)] : []),
            pc('Lgx', 'x', 'x'),
        ];
        const nouR = [pc('Rgs', signe, 'op'), ...(k !== 1 ? [pc('Rgc', k)] : []), pc('Rgx', 'x', 'x')];
        const esquerra = eL
            ? vL.flatMap((e, j) => [...pecesTerme(e.t, 'L', e.i, j === 0), ...(e === eL ? nouL(false) : [])])
            : [...nouL(true), ...vL.flatMap(e => pecesTerme(e.t, 'L', e.i, false))];
        const ambNou = vR.flatMap((e, j) => [...pecesTerme(e.t, 'R', e.i, j === 0), ...(e === eR ? nouR : [])]);
        const reparteix = { [R('x')]: [R('x'), 'Lgx', 'Rgx'] };
        if (k !== 1) reparteix[R('c')] = [R('c'), 'Lgc', 'Rgc'];
        const subpassos = [
            {
                linia: linia(esquerra, ambNou),
                text: `${rC > 0 ? 'Resta' : 'Suma'} ${monomi(k)} als dos membres: la igualtat es manté.`,
                reparteix,
            },
        ];
        // 2x − 2x = 0: el terme amb x i el nou es fusionen en un 0 (amb el signe del terme, si no era el primer)
        const primerR = vR[0] === eR;
        const zero = primerR ? [pc('Rz', '0')] : [pc('Rzs', '+', 'op'), pc('Rz', '0')];
        const ambZero = vR.flatMap((e, j) => (e === eR ? zero : pecesTerme(e.t, 'R', e.i, j === 0)));
        const delX = delTerme(ambNou, 'R', eR.i).filter(p => primerR || !p.id.endsWith('s'));
        subpassos.push({
            linia: linia(esquerra, ambZero),
            text: `${monomi(rC)} ${signe} ${monomi(k)} = 0.`,
            fusiona: { Rz: [...delX.map(p => p.id), ...nouR.map(p => p.id)] },
            mou: primerR ? {} : { Rzs: R('s') },
        });
        // Sumar 0 no canvia res (si a la dreta hi ha res més que el 0): la resta de la dreta hi baixa
        const restaR = vR.filter(e => e !== eR);
        if (restaR.length) {
            const dreta = costatDe(restaR, 'R');
            subpassos.push({
                linia: linia(esquerra, dreta),
                text: 'Sumar 0 no canvia res.',
                mou: Object.fromEntries(dreta.map(p => [p.id, p.id])),
            });
        }
        // Tancament: els termes amb x de l'esquerra es fusionen en el coeficient nou (la resposta)
        const despres = pas.dispLeftAfter;
        const j = despres.findIndex(t => t.k === 'x');
        const A = p => `L${j}${p}`;
        const coefNou = despres[j].c;
        const dinsCoef = [...(eL ? delTerme(esquerra, 'L', eL.i).filter(p => p.tipus !== 'x') : []), ...nouL(!eL)]
            .filter(p => p.tipus !== 'x')
            .map(p => p.id);
        const acaba = eL
            ? { mou: { [A('x')]: `L${eL.i}x` }, fusiona: { [A('x')]: ['Lgx'] } }
            : { mou: { [A('x')]: 'Lgx' }, fusiona: {} };
        const desti = Math.abs(coefNou) !== 1 ? A('c') : A('x');
        if (dinsCoef.length) acaba.fusiona[desti] = [...(acaba.fusiona[desti] || []), ...dinsCoef];
        return { titol: "Detall: passar les x a l'esquerra", subpassos, acaba };
    }

    /** 2x + 4 = 10: resta 4 als dos membres; 4 − 4 = 0; sumar 0 no canvia res. */
    function detallPassaNombres(pas) {
        const vL = visibles(pas.dispLeftBefore),
            vR = visibles(pas.dispRightBefore);
        const eN = vL.find(e => e.t.k === 'n');
        if (!eN) return null;
        const lB = eN.t.v;
        const k = Math.abs(lB);
        const signe = lB > 0 ? '−' : '+';
        const N = p => `L${eN.i}${p}`;
        const esquerra = vL.flatMap((e, j) => [
            ...pecesTerme(e.t, 'L', e.i, j === 0),
            ...(e === eN ? [pc('Lgs', signe, 'op'), pc('Lgn', k)] : []),
        ]);
        const dretaAbans = costatDe(vR, 'R');
        const dreta = [...dretaAbans, pc('Rgs', signe, 'op'), pc('Rgn', k)];
        const subpassos = [
            {
                linia: linia(esquerra, dreta),
                text: `${lB > 0 ? 'Resta' : 'Suma'} ${k} als dos membres: la igualtat es manté.`,
                reparteix: { [N('n')]: [N('n'), 'Lgn', 'Rgn'] },
            },
        ];
        // 4 − 4 = 0
        const primerN = vL[0] === eN;
        const zero = primerN ? [pc('Lz', '0')] : [pc('Lzs', '+', 'op'), pc('Lz', '0')];
        const ambZero = vL.flatMap((e, j) => (e === eN ? zero : pecesTerme(e.t, 'L', e.i, j === 0)));
        const delN = delTerme(esquerra, 'L', eN.i).filter(p => primerN || !p.id.endsWith('s'));
        subpassos.push({
            linia: linia(ambZero, dreta),
            text: `${ambSigne(lB)} ${signe} ${k} = 0.`,
            fusiona: { Lz: [...delN.map(p => p.id), 'Lgs', 'Lgn'] },
            mou: primerN ? {} : { Lzs: N('s') },
        });
        // Sumar 0 no canvia res: la resta de l'esquerra hi baixa
        const esquerraSola = costatDe(
            vL.filter(e => e !== eN),
            'L'
        );
        subpassos.push({
            linia: linia(esquerraSola, dreta),
            text: 'Sumar 0 no canvia res.',
            mou: Object.fromEntries(esquerraSola.map(p => [p.id, p.id])),
        });
        // Tancament: la dreta es fusiona en el nombre nou (la resposta)
        const despres = visibles(pas.dispRightAfter);
        const desti = despres.length ? `R${despres[0].i}n` : 'R0z';
        return {
            titol: 'Detall: passar els nombres a la dreta',
            subpassos,
            acaba: { fusiona: { [desti]: dreta.map(p => p.id) } },
        };
    }

    /** 3x = 6: divideix els dos membres per 3; 3x : 3 = x. */
    function detallAilla(pas) {
        const vL = visibles(pas.dispLeftBefore),
            vR = visibles(pas.dispRightBefore);
        if (vL.length !== 1 || vL[0].t.k !== 'x') return null;
        const eX = vL[0];
        const a = eX.t.c;
        const X = p => `L${eX.i}${p}`;
        const terme = pecesTerme(eX.t, 'L', eX.i, true);
        const dretaAbans = costatDe(vR, 'R');
        const esquerra = [...terme, pc('Ld', ':', 'op'), pc('Lv', factor(a))];
        const dreta = [...dretaAbans, pc('Rd', ':', 'op'), pc('Rv', factor(a))];
        const font = Math.abs(a) !== 1 ? X('c') : X('s');
        return {
            titol: 'Detall: aïllar la x',
            subpassos: [
                {
                    linia: linia(esquerra, dreta),
                    text: `Divideix els dos membres per ${ambSigne(a)}: la igualtat es manté.`,
                    reparteix: { [font]: [font, 'Lv', 'Rv'] },
                },
                {
                    linia: linia([pc(X('x'), 'x', 'x')], dreta),
                    text: `${monomi(a)} : ${factor(a)} = x.`,
                    mou: { [X('x')]: X('x') },
                },
            ],
            acaba: { mou: { L0x: X('x') }, fusiona: { R0n: dreta.map(p => p.id) } },
        };
    }

    /**
     * El detall d'un pas (vegeu més amunt): { titol, subpassos: [{ linia, text, mou, fusiona, reparteix }],
     * acaba: { mou, fusiona, reparteix } } (els moviments, com a formules.js historial), o null.
     */
    function detallPas(pas) {
        const t = pas.type;
        if (t === 'distribute_left' || t === 'distribute_right') return detallDistributiva(pas);
        if (t === 'simplify_left_x' || t === 'simplify_right_x') return detallAjuntaX(pas);
        if (t === 'group_x') return detallPassaX(pas);
        if (t === 'group_num') return detallPassaNombres(pas);
        if (t === 'solve') return detallAilla(pas);
        return null; // ajuntar els nombres d'un costat: no en té
    }

    return {
        renderOneToken,
        renderTerms,
        liniaHtml,
        envolta,
        moviments,
        textLinia,
        historiaNova,
        escriuPas,
        detallPas,
        obreDetall,
    };
})();
