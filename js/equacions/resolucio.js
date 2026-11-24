/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions/resolucio.js
 * ROL: «Resolució pas a pas» d'«Equacions de 1r grau» (l'escenari B: l'alumne mira
 *      com es resol una equació, a resolucio.html?activitat=equacions): el guió de la
 *      pissarra d'una equació, pas a pas, amb el detall a demanda de cada pas.
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM): passos(eq, { oberts }) torna la llista de passos de la
 *   pissarra (js/pissarra/formules.js guio i historial, en TeX, una línia per fila i
 *   l'objectiu en gris quan un pas és obert); exercici(nivell) en genera una
 *   (math-engine.js, els nivells 1, 2 i 3 de l'activitat).
 * - Els passos són els de l'activitat (math-engine.js determineSteps), amb una frase
 *   en segona persona. Només volen els símbols que fan el canvi (moviments); la resta
 *   de la línia nova hi apareix.
 * - El detall a demanda de cada pas (detallPas) porta, en subpassos, fins a la línia
 *   del pas: distributiva, ajuntar els termes amb x, passar les x, passar els nombres
 *   i aïllar la x (ajuntar els nombres no en té). Vegeu la secció del detall.
 * - ajudants: pc, IGUAL, tex, ambSigne i factor, els mateixos per a les inequacions (no se'n fa
 *   una còpia).
 * - tests/equacions.test.js comprova milers d'equacions de tots els nivells: el guió
 *   és correcte, cada línia que es veu (també les del detall) té la solució de
 *   l'equació, KaTeX dibuixa totes les fórmules i el detall compleix la seva regla.
 * DEPENDÈNCIES: math-engine.js, pissarra/formules.js.
 * ============================================================================
 */
import { MathEngine } from './math-engine.js';
import { clau, guio, historial } from '../pissarra/formules.js';

export const Resolucio = (() => {
    // Una línia és la forma de sempre, { left, right, inv } (els termes de math-engine.js; inv: la primera
    // línia de «b = ax», girada), o una línia del detall, { peces: [{ id, t, tipus }] }. Les peces d'un terme
    // porten l'id <costat><i><peça> (costat L/R de la forma canònica, encara que es mostri girat; i: la
    // posició del terme; peça s signe, c coeficient, x, n nombre, a «(», t signe de dins, m nombre de dins,
    // b «)», z el «0» d'un costat buit); el «=»: q.

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

    /** Les posicions dels termes d'un tipus en un costat (sense els nuls). */
    const posicions = (arr, k) => arr.map((t, i) => (t.k === k && !esNul(t) ? i : -1)).filter(i => i >= 0);

    /**
     * Què fa un pas (tancat) a la línia nova, en el format de formules.js historial(): { mou: {peça nova:
     * peça vella}, fusiona: {peça nova: [peces velles]} }, amb les peces escrites «<costat><i><peça>»:
     *   · distributiva: la x i el coeficient de fora baixen al terme amb x, i el nombre de dins es fusiona
     *     en el terme independent nou;
     *   · sumar termes d'un costat, passar les x a l'esquerra, passar els nombres a la dreta: els termes
     *     que s'ajunten es fusionen en el terme nou;
     *   · aïllar la x: la x baixa, i el coeficient i el nombre de la dreta es fusionen en la solució.
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

    const IGUAL = { id: 'q', t: '=', tipus: 'igual' };
    const pc = (id, t, tipus = '') => ({ id, t: String(t), tipus });
    /** Un factor d'un producte o d'una divisió: entre parèntesis si és negatiu, (−2). */
    const factor = v => (v < 0 ? `(−${Math.abs(v)})` : String(v));
    /** Un nombre amb el seu signe: −3. */
    const ambSigne = v => (v < 0 ? `−${Math.abs(v)}` : String(v));
    /** Un terme amb x escrit: 2x, x, −3x, −x. */
    const monomi = c => `${c < 0 ? '−' : ''}${Math.abs(c) === 1 ? '' : Math.abs(c)}x`;

    /** Una línia de peces en text («2·x + 2·3 = 14»). */
    const textDe = peces => peces.map(p => (p.tipus === 'op' || p.tipus === 'igual' ? ` ${p.t} ` : p.t)).join('');
    /** El TeX d'un text de les peces: «−» → «-», «·» → «\cdot». */
    const tex = t => String(t).replace(/−/g, '-').replace(/·/g, '\\cdot ');

    // ---- DETALL A DEMANDA («Vull més detall») ----
    //
    // Quan l'alumne demana més detall d'un pas, el pas s'obre en subpassos que porten fins a la seva línia:
    //   · distributiva: 2(x + 3) → 2·x + 2·3 (el 2 es reparteix als dos termes; si és negatiu, (−2)·x + (−2)·3);
    //   · ajuntar els termes amb x d'un costat: 3x + 2x → (3 + 2)x;
    //   · passar les x a l'esquerra: resta 2x als dos membres; 2x − 2x = 0; sumar 0 no canvia res;
    //   · passar els nombres a la dreta: resta 4 als dos membres; 4 − 4 = 0; sumar 0 no canvia res;
    //   · aïllar la x: divideix els dos membres per 3; 3x : 3 = x.
    // Després, el subpas que tanca el pas fa l'últim càlcul (textAcaba) i escriu la línia del pas. Ajuntar
    // els nombres d'un costat (4 + 6) no en té. Una línia del detall és { peces: [{ id, t, tipus }] }: t, el
    // text; tipus 'x' (la incògnita), 'op' (un signe entre dos termes), 'igual' (el «=») o res. Les peces dels
    // termes que ja hi eren porten l'id de sempre; les noves, un id propi.

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
            textAcaba: `Fes la multiplicació: $${tex(factor(c))} \\cdot ${tex(factor(n))} = ${tex(ambSigne(c * n))}$.`,
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
            textAcaba: `Fes la suma: $${tex(text)} = ${tex(monomi(suma))}$.`,
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
        const textAcaba = eL
            ? `Fes la suma: $${tex(monomi(eL.t.c))} ${rC > 0 ? '-' : '+'} ${tex(monomi(k))} = ${tex(monomi(coefNou))}$.`
            : "Ja tens les x a l'esquerra.";
        return { titol: "Detall: passar les x a l'esquerra", textAcaba, subpassos, acaba };
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
        const resultat = despres.length ? despres[0].t.v : 0;
        return {
            titol: 'Detall: passar els nombres a la dreta',
            textAcaba: `Fes el càlcul: $${tex(textDe(dreta))} = ${tex(ambSigne(resultat))}$.`,
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
        const b = vR.length ? vR[0].t.v : 0;
        return {
            titol: 'Detall: aïllar la x',
            textAcaba: `Fes la divisió: $${tex(ambSigne(b))} : ${tex(factor(a))} = ${tex(ambSigne(b / a))}$.`,
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
     * acaba: { mou, fusiona, reparteix }, textAcaba } (els moviments, com a formules.js historial), o null.
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

    // ---- LA PISSARRA ----

    /** Les peces d'una línia (la forma de sempre o una del detall). */
    function pecesDe(linia) {
        if (linia.peces) return linia.peces;
        const [S1, A1, S2, A2] = linia.inv ? ['R', linia.right, 'L', linia.left] : ['L', linia.left, 'R', linia.right];
        return [...costatDe(visibles(A1), S1), IGUAL, ...costatDe(visibles(A2), S2)];
    }

    /** El pintor de l'historial (formules.js): una línia en TeX, amb la clau de cada peça (o sense, per als textos). */
    function pintaTex(linia, clauDe) {
        return pecesDe(linia)
            .map(p => {
                const t = tex(p.t);
                const s = clauDe ? clau(clauDe(p.id), t) : `{${t}}`;
                if (p.tipus === 'igual') return `\\mathrel{${s}}`;
                return p.tipus === 'op' || p.t === '·' ? `\\mathbin{${s}}` : s;
            })
            .join('');
    }
    /** El TeX d'una línia sense claus, per a les frases (p. ex. «-5x + 9 = 5x + 39»). */
    const texLinia = linia => tex(textDe(pecesDe(linia)));

    /** La frase d'un pas tancat (segona persona). */
    function frase(pas) {
        if (pas.type === 'group_x') return "Passa els termes amb x a l'esquerra.";
        if (pas.type === 'group_num') return 'Passa els nombres a la dreta.';
        if (pas.type === 'solve') {
            const a = visibles(pas.dispLeftBefore)[0].t.c;
            const vR = visibles(pas.dispRightBefore);
            const b = vR.length ? vR[0].t.v : 0;
            return `Aïlla la x: divideix $${tex(ambSigne(b))}$ entre $${tex(ambSigne(a))}$.`;
        }
        return `${pas.instruction}.`;
    }

    /** Les files de la pissarra d'una equació: totes les línies, amb tots els passos oberts. */
    const files = (eq, etapes = MathEngine.determineSteps(eq)) =>
        1 + etapes.reduce((n, p) => n + 1 + (detallPas(p) ? detallPas(p).subpassos.length : 0), 0);

    /**
     * El guió d'una equació (math-engine.js): la primera línia i una línia per pas, cadascun amb la seva frase.
     * oberts: els passos (els seus id, '2', '3'…) que s'escriuen amb el detall; mentre es fan els subpassos,
     * la línia del pas es veu en gris com a objectiu.
     */
    function passos(eq, { oberts = new Set() } = {}) {
        const etapes = MathEngine.determineSteps(eq);
        const g = guio(files(eq, etapes));
        const H = historial(g, { prefix: 'E', pinta: pintaTex, oberts, objectiu: true });
        const inicial = { left: eq.dispLeft, right: eq.dispRight, inv: !!eq.swapInitial };
        H.escriu(inicial, `Resol l'equació $${texLinia(inicial)}$.`);
        const solucio = ` La solució és $x = ${tex(ambSigne(eq.xSol))}$.`;
        etapes.forEach((pas, j) => {
            const final = j === etapes.length - 1;
            const linia = { left: pas.dispLeftAfter, right: pas.dispRightAfter, inv: false };
            const op = Object.assign(moviments(pas), { final });
            const det = detallPas(pas);
            if (det)
                Object.assign(op, {
                    titol: det.titol,
                    detall: D => {
                        for (const sp of det.subpassos)
                            D.escriu(sp.linia, sp.text, { mou: sp.mou, fusiona: sp.fusiona, reparteix: sp.reparteix });
                        D.acaba(det.textAcaba + (final ? solucio : ''), det.acaba);
                    },
                });
            H.escriu(linia, frase(pas) + (final ? solucio : ''), op);
        });
        return g.passos;
    }

    /** Una equació nova del nivell (1, 2 o 3, com els de l'activitat). */
    const exercici = nivell => MathEngine.generateEquation(0, { nivell, totalOperations: 10 });

    // Els ajudants de les peces, per a les inequacions (js/inequacions/resolucio.js), que en fan servir el motor
    const ajudants = Object.freeze({ pc, IGUAL, tex, ambSigne, factor });
    return Object.freeze({
        NIVELLS: [1, 2, 3],
        exercici,
        passos,
        files,
        detallPas,
        moviments,
        pecesDe,
        texLinia,
        ajudants,
    });
})();
