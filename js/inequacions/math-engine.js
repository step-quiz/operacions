/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/math-engine.js
 * ROL: Les preguntes d'«Inequacions» (inequacions.html), lliurament 17 del full de
 *      ruta, amb les decisions del David del 17/11/2026 (artifact de revisió):
 *        - inequacions de primer grau, sense interseccions, sense casos especials
 *          (cap «sense solució» ni «tots els nombres») i sense context;
 *        - a cada pas l'alumne escriu els nombres a les caselles i hi posa el signe
 *          (<, >, ≤, ≥, una targeta): així, si no el gira en dividir per un negatiu, es
 *          veu i s'explica (no hi ha cap pas propi del signe);
 *        - si la x queda a la dreta (4 > x), es gira sola i es veu escrit (x < 4);
 *        - la solució de tres maneres: la inequació, la recta (tocar el nombre, triar si
 *          hi entra i el costat) i l'interval amb peces, amb la notació (2, 5).
 *   NIVELLS    1 coeficient positiu (2x + 3 < 11) · 2 coeficient negatiu (7 − 3x ≥ 1) ·
 *              3 parèntesis i x als dos membres (3(x − 2) > 5x + 4) · 4 denominadors
 *              ((x + 1)/2 − x/3 ≤ 1). Als nivells 3 i 4, la solució és entera amb
 *              probabilitat 2/3 i una fracció amb 1/3; als 1 i 2, sempre entera.
 *   PASSOS     els de resoldre (camps: nombres enters o la fracció del resultat, i el
 *              signe, s) · recta (camp rc) · interval (camps o, e1, e2, t).
 * ARQUITECTURA: mòdul pur (l'atzar, a través de utils.js, perquè les sessions fixes el
 *      puguin sembrar). Joc comú (js/passos/joc-passos.js); recta comuna
 *      (js/passos/recta-intervals.js).
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, passos/recta-intervals.js, strings.js.
 * ============================================================================
 */

import { pick, randInt, randIntNonZero } from '../utils.js';
import { coeficient, comRacional, oposatCoef, quocientCoef, texRacional, textRacional } from '../algebra/racionals.js';
import { svgRecta } from '../passos/recta-intervals.js';
import { TEXTOS_IQ } from './strings.js';

const T = TEXTOS_IQ;

// ── Els signes ───────────────────────────────────────────────────────────────
export const SIGNES = ['lt', 'gt', 'le', 'ge'];
export const TEX_SIGNE = { lt: '<', gt: '>', le: '\\le', ge: '\\ge' };
const TEXT_SIGNE = { lt: '<', gt: '>', le: '≤', ge: '≥' };
/** El signe girat (en multiplicar o dividir per un negatiu, o en llegir la inequació al revés). */
export const GIRA = { lt: 'gt', gt: 'lt', le: 'ge', ge: 'le' };
/** El mateix sentit, però amb o sense «o igual». */
const ESTRICTE = { lt: 'le', le: 'lt', gt: 'ge', ge: 'gt' };
/** Les targetes dels signes (sempre en el mateix ordre). */
const FITXES_SIGNE = SIGNES.map(id => ({ id, tex: TEX_SIGNE[id] }));

// ── TeX ──────────────────────────────────────────────────────────────────────
/** a·x amb a enter (1 → «x», −1 → «−x»). */
const texX = a => (a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`);
/** a·x + b (b pot ser 0: no s'escriu). */
const texLineal = (a, b) => `${texX(a)}${b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`}`;
const texNombre = v => texRacional(v);
const textNombre = v => textRacional(v);

/** El TeX d'una inequació «esquerra ⊙ dreta». */
const texIneq = (e, s, d) => `${e} ${TEX_SIGNE[s]} ${d}`;

// ── Els passos ───────────────────────────────────────────────────────────────
/**
 * Els distractors del signe: el girat (amb el seu error segons el motiu) i el mateix sense o amb «o igual».
 * motiu: 'negatiu' (s'ha dividit per un negatiu: el bo ja és girat), 'positiu' (s'ha dividit per un
 * positiu) o 'terme' (s'ha passat un terme sumant o restant).
 */
function distractorsSigne(bo, motiu) {
    const codi = { negatiu: 'SIGNE_NO_GIRAT', positiu: 'SIGNE_GIRAT_POSITIU', terme: 'SIGNE_GIRAT_SENSE_MOTIU' }[motiu];
    return [
        [GIRA[bo], codi],
        [ESTRICTE[bo], 'SIGNE_ESTRICTE'],
    ];
}

const igualValor = (x, y) =>
    typeof x === 'string' || typeof y === 'string'
        ? x === y
        : comRacional(x)[0] * comRacional(y)[1] === comRacional(y)[0] * comRacional(x)[1];
/** Un pas de resoldre: plantilla amb caselles i la targeta del signe (camp s). */
function pasResol({ id, mena, enunciat, plantilla, camps, solucio, distractors, linia, nota }) {
    // un distractor que coincideix amb la bona (p. ex. el mcm que ja és un dels denominadors) no és error
    for (const c of Object.keys(distractors))
        distractors[c] = distractors[c].filter(([v]) => !igualValor(v, solucio[c]));
    return {
        id,
        mena,
        nom: T.nomPas[mena],
        enunciat,
        formules: enunciat.includes('$'),
        plantilla,
        fitxes: FITXES_SIGNE,
        camps,
        solucio,
        dades: { distractors },
        nota,
        linia,
    };
}

/** Els distractors de dividir r entre a (el resultat d'aïllar la x): multiplicar, restar, signe, girat. */
function distractorsQuocient(r, a, enter) {
    const bo = quocientCoef(r, a);
    const out = [
        [coeficient(comRacional(r)[0] * a, comRacional(r)[1]), 'MULTIPLICA'],
        [coeficient(comRacional(r)[0] - a * comRacional(r)[1], comRacional(r)[1]), 'RESTA'],
        [oposatCoef(bo), 'SIGNE_QUOCIENT'],
    ];
    if (comRacional(r)[0] !== 0) out.push([quocientCoef(a, r), 'QUOCIENT_GIRAT']);
    const vistos = new Set([JSON.stringify(comRacional(bo))]);
    return out.filter(([v]) => {
        const k = JSON.stringify(comRacional(v));
        if (vistos.has(k) || (enter && comRacional(v)[1] !== 1)) return false;
        vistos.add(k);
        return true;
    });
}

/**
 * Aïllar la x d'«a·x ⊙ r» (x a l'esquerra) o «r ⊙ a·x» (x a la dreta): divideix per a; si a < 0 es gira.
 * Amb la x a la dreta, la línia porta també la inequació girada (automàtic, decisió del David).
 */
function pasAilla(a, r, s, { dreta = false, enter = true }) {
    const sol = quocientCoef(r, a);
    const s2 = a < 0 ? GIRA[s] : s;
    const campR = { camp: 'r' };
    const plantilla = dreta ? [campR, { camp: 's' }, { tex: 'x' }] : [{ tex: 'x' }, { camp: 's' }, campR];
    const linia = dreta
        ? `\\begin{aligned} ${texNombre(sol)} &${TEX_SIGNE[s2]} x \\\\ x &${TEX_SIGNE[GIRA[s2]]} ${texNombre(sol)} \\end{aligned}`
        : texIneq('x', s2, texNombre(sol));
    return {
        pas: pasResol({
            id: 'ailla',
            mena: 'ailla',
            enunciat: T.enunciat.ailla,
            plantilla,
            camps: { r: enter ? 'enter' : 'racional', s: 'fitxa' },
            solucio: { r: enter ? sol : comRacional(sol), s: s2 },
            distractors: {
                r: distractorsQuocient(r, a, enter),
                s: distractorsSigne(s2, a < 0 ? 'negatiu' : 'positiu'),
            },
            linia,
        }),
        sol,
        signe: dreta ? GIRA[s2] : s2, // el de «x ⊙ sol»
    };
}

// ── La recta i l'interval ────────────────────────────────────────────────────
/** El pas de la recta: deu enters al voltant de la solució i, si és una fracció, la seva marca. */
function pasRecta(sol, s) {
    const v = comRacional(sol)[0] / comRacional(sol)[1];
    const lo = Math.floor(v) - 4;
    const marques = [];
    for (let k = lo; k <= lo + 9; k++) marques.push({ v: k, text: k < 0 ? `−${-k}` : String(k) });
    if (!Number.isInteger(v)) marques.push({ v, text: textNombre(sol) });
    marques.sort((p, q) => p.v - q.v);
    const i = marques.findIndex(m => m.v === v);
    const solucio = { i, ple: s === 'le' || s === 'ge', costat: s === 'lt' || s === 'le' ? 'esq' : 'dre' };
    return {
        id: 'recta',
        mena: 'recta',
        nom: T.nomPas.recta,
        enunciat: T.enunciat.recta(texIneq('x', s, texNombre(sol))),
        formules: true,
        plantilla: [{ camp: 'rc', recta: { marques } }],
        camps: { rc: 'recta' },
        solucio: { rc: solucio },
        dades: { distractors: {}, marques },
        linia: '',
        // a la resolució hi queda dibuixada la recta resolta (cap línia de TeX)
        svgResolt: svgRecta({ marques, punt: { i, ple: solucio.ple }, costat: solucio.costat }),
    };
}

/** El pas de l'interval: quatre caselles (obertura, extrems, tancament) i les peces. */
function pasInterval(sol, s) {
    const fitxes = [
        { id: 'po', tex: '(' },
        { id: 'co', tex: '[' },
        { id: 'pt', tex: ')' },
        { id: 'ct', tex: ']' },
        { id: 'n', tex: texNombre(sol) },
        ...(comRacional(sol)[0] !== 0 ? [{ id: 'no', tex: texNombre(oposatCoef(sol)) }] : []),
        { id: 'mi', tex: '-\\infty' },
        { id: 'pi', tex: '+\\infty' },
    ];
    const esq = s === 'lt' || s === 'le';
    const tancat = s === 'le' || s === 'ge';
    const solucio = esq
        ? { o: 'po', e1: 'mi', e2: 'n', t: tancat ? 'ct' : 'pt' }
        : { o: tancat ? 'co' : 'po', e1: 'n', e2: 'pi', t: 'pt' };
    const d = [];
    if (esq) {
        d.push(['o', 'co', 'INFINIT_TANCAT'], ['e1', 'pi', 'COSTAT_INTERVAL'], ['e1', 'n', 'COSTAT_INTERVAL']);
        d.push(['e2', 'no', 'EXTREM'], ['e2', 'mi', 'COSTAT_INTERVAL'], ['t', tancat ? 'pt' : 'ct', 'CLAUDATOR']);
    } else {
        d.push(['o', tancat ? 'po' : 'co', 'CLAUDATOR'], ['e1', 'no', 'EXTREM'], ['e1', 'mi', 'COSTAT_INTERVAL']);
        d.push(['e2', 'mi', 'COSTAT_INTERVAL'], ['e2', 'n', 'COSTAT_INTERVAL'], ['t', 'ct', 'INFINIT_TANCAT']);
    }
    const distractors = { o: [], e1: [], e2: [], t: [] };
    for (const [camp, valor, codi] of d) if (fitxes.some(f => f.id === valor)) distractors[camp].push([valor, codi]);
    const tex = id => fitxes.find(f => f.id === id).tex;
    const interval = `${tex(solucio.o)}${tex(solucio.e1)}, ${tex(solucio.e2)}${tex(solucio.t)}`;
    return {
        id: 'interval',
        mena: 'interval',
        nom: T.nomPas.interval,
        enunciat: T.enunciat.interval(texIneq('x', s, texNombre(sol))),
        formules: true,
        plantilla: [{ camp: 'o' }, { camp: 'e1' }, { tex: ',' }, { camp: 'e2' }, { camp: 't' }],
        fitxes,
        camps: { o: 'fitxa', e1: 'fitxa', e2: 'fitxa', t: 'fitxa' },
        solucio,
        dades: { distractors },
        linia: `x \\in ${interval.replace(/\(/g, '\\left(').replace(/\)/g, '\\right)').replace(/\[/g, '\\left[').replace(/\]/g, '\\right]')}`,
    };
}

// ── Els nivells ──────────────────────────────────────────────────────────────
/** Una solució: entera o (amb probabilitat 1/3, si es pot) una fracció B/A irreductible. */
const ambFraccions = () => randInt(1, 3) === 1;

/** Nivells 1 i 2: a·x + b ⊙ c (o c ⊙ a·x + b, amb la x a la dreta); al 2, a < 0. */
function nivell12(n) {
    const a = n === 1 ? randInt(2, 6) : -randInt(2, 6);
    const sol = randInt(-8, 8);
    const b = randIntNonZero(-9, 9);
    const c = a * sol + b;
    const s = pick(SIGNES);
    const dreta = randInt(1, 3) === 1;
    // Al nivell 2, de vegades el nombre va al davant: 7 − 3x
    const davant = n === 2 && !dreta && randInt(1, 2) === 1;
    const membreX = davant ? `${b} ${a < 0 ? '-' : '+'} ${texX(Math.abs(a))}` : texLineal(a, b);
    const tex = dreta ? texIneq(String(c), s, membreX) : texIneq(membreX, s, String(c));
    const r = c - b;
    const passa = pasResol({
        id: 'passa',
        mena: 'passa',
        enunciat: T.enunciat.passaNombre(b),
        plantilla: dreta
            ? [{ camp: 'r' }, { camp: 's' }, { camp: 'a' }, { tex: 'x' }]
            : [{ camp: 'a' }, { tex: 'x' }, { camp: 's' }, { camp: 'r' }],
        camps: dreta ? { r: 'enter', s: 'fitxa', a: 'enter' } : { a: 'enter', s: 'fitxa', r: 'enter' },
        solucio: { a, r, s },
        distractors: { r: [[c + b, 'TERME_SIGNE']], a: [[-a, 'SIGNE_COEFICIENT']], s: distractorsSigne(s, 'terme') },
        linia: dreta ? texIneq(String(r), s, texX(a)) : texIneq(texX(a), s, String(r)),
        nota: T.nota.coeficient,
    });
    const ailla = pasAilla(a, r, s, { dreta, enter: true });
    return {
        tex,
        passos: [passa, ailla.pas],
        sol: ailla.sol,
        signe: ailla.signe,
        dades: { a, b, c, s, dreta, davant },
    };
}

/** Nivell 3: p(x + q) ⊙ r·x + t. Distributiva, passar (x a l'esquerra, nombres a la dreta), aïllar. */
function nivell3() {
    const fraccio = ambFraccions(); // entera amb probabilitat 2/3 i fracció amb 1/3
    for (;;) {
        const p = pick([-5, -4, -3, -2, 2, 3, 4, 5]);
        const q = randIntNonZero(-6, 6);
        const r = randIntNonZero(-6, 6);
        const A = p - r;
        if (A === 0 || A === 1) continue;
        const B = fraccio ? randIntNonZero(-20, 20) : A * randInt(-8, 8);
        if (fraccio && B % A === 0) continue;
        const t = B + p * q;
        if (t === 0 || B === 0) continue;
        const s = pick(SIGNES);
        const parentesi = `${p === -1 ? '-' : p}\\left(${texLineal(1, q)}\\right)`;
        const tex = texIneq(parentesi, s, texLineal(r, t));
        const distributiva = pasResol({
            id: 'distributiva',
            mena: 'distributiva',
            enunciat: T.enunciat.distributiva,
            plantilla: [{ camp: 'a' }, { tex: 'x' }, { camp: 'b' }, { camp: 's' }, { tex: texLineal(r, t) }],
            camps: { a: 'enter', b: 'enter', s: 'fitxa' },
            solucio: { a: p, b: p * q, s },
            distractors: { b: [[q, 'DISTRIBUTIVA']], s: distractorsSigne(s, 'terme') },
            linia: texIneq(texLineal(p, p * q), s, texLineal(r, t)),
            nota: T.nota.coeficientINombre,
        });
        const passa = pasResol({
            id: 'passa',
            mena: 'passa',
            enunciat: T.enunciat.passaTot,
            plantilla: [{ camp: 'a' }, { tex: 'x' }, { camp: 's' }, { camp: 'r' }],
            camps: { a: 'enter', s: 'fitxa', r: 'enter' },
            solucio: { a: A, r: B, s },
            distractors: {
                a: [[p + r, 'TERME_SIGNE']],
                r: [[t + p * q, 'TERME_SIGNE']],
                s: distractorsSigne(s, 'terme'),
            },
            linia: texIneq(texX(A), s, String(B)),
            nota: T.nota.coeficient,
        });
        const ailla = pasAilla(A, B, s, { enter: false });
        return {
            tex,
            passos: [distributiva, passa, ailla.pas],
            sol: ailla.sol,
            signe: ailla.signe,
            dades: { p, q, r, t, s },
        };
    }
}

const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
/** Nivell 4: (x + a)/m ± x/n ⊙ c. Treure denominadors, distributiva i ajuntar, passar, aïllar. */
function nivell4() {
    const volFraccio = ambFraccions(); // entera amb probabilitat 2/3 i fracció amb 1/3
    for (;;) {
        const [m, n] = [pick([2, 3, 4, 5, 6]), pick([2, 3, 4, 5, 6])];
        if (m === n) continue;
        const L = (m * n) / mcd(m, n);
        const [k1, k2] = [L / m, L / n];
        const mes = randInt(1, 2) === 1;
        const A = mes ? k1 + k2 : k1 - k2;
        if (A === 0 || A === 1) continue;
        const a = randIntNonZero(-6, 6);
        const c = randIntNonZero(-5, 5);
        const B = c * L - k1 * a;
        if (B === 0) continue;
        if ((B % A !== 0) !== volFraccio) continue;
        const s = pick(SIGNES);
        const op = mes ? '+' : '-';
        const tex = texIneq(`\\dfrac{${texLineal(1, a)}}{${m}} ${op} \\dfrac{x}{${n}}`, s, String(c));
        const treu = pasResol({
            id: 'denominadors',
            mena: 'denominadors',
            enunciat: T.enunciat.denominadors(L, m, n),
            plantilla: [
                { camp: 'k1' },
                { tex: `\\left(${texLineal(1, a)}\\right) ${op}` },
                { camp: 'k2' },
                { tex: 'x' },
                { camp: 's' },
                { camp: 'r' },
            ],
            camps: { k1: 'enter', k2: 'enter', s: 'fitxa', r: 'enter' },
            solucio: { k1, k2, r: c * L, s },
            distractors: {
                k1: [
                    [L, 'MCM_SENSE_DIVIDIR'],
                    [m, 'MCM_SENSE_DIVIDIR'],
                ],
                k2: [
                    [L, 'MCM_SENSE_DIVIDIR'],
                    [n, 'MCM_SENSE_DIVIDIR'],
                ],
                r: [[c, 'NOMES_UN_MEMBRE']],
                s: distractorsSigne(s, 'terme'),
            },
            linia: texIneq(`${k1}\\left(${texLineal(1, a)}\\right) ${op} ${texX(k2)}`, s, String(c * L)),
        });
        const ajunta = pasResol({
            id: 'ajunta',
            mena: 'ajunta',
            enunciat: T.enunciat.ajunta,
            plantilla: [{ camp: 'a' }, { tex: 'x' }, { camp: 'b' }, { camp: 's' }, { tex: String(c * L) }],
            camps: { a: 'enter', b: 'enter', s: 'fitxa' },
            solucio: { a: A, b: k1 * a, s },
            distractors: {
                a: [[mes ? k1 - k2 : k1 + k2, 'SIGNE_COEFICIENT']],
                b: [[a, 'DISTRIBUTIVA']],
                s: distractorsSigne(s, 'terme'),
            },
            linia: texIneq(texLineal(A, k1 * a), s, String(c * L)),
            nota: T.nota.coeficientINombre,
        });
        const passa = pasResol({
            id: 'passa',
            mena: 'passa',
            enunciat: T.enunciat.passaNombre(k1 * a),
            plantilla: [{ camp: 'a' }, { tex: 'x' }, { camp: 's' }, { camp: 'r' }],
            camps: { a: 'enter', s: 'fitxa', r: 'enter' },
            solucio: { a: A, r: B, s },
            distractors: { r: [[c * L + k1 * a, 'TERME_SIGNE']], s: distractorsSigne(s, 'terme') },
            linia: texIneq(texX(A), s, String(B)),
            nota: T.nota.coeficient,
        });
        const ailla = pasAilla(A, B, s, { enter: false });
        return {
            tex,
            passos: [treu, ajunta, passa, ailla.pas],
            sol: ailla.sol,
            signe: ailla.signe,
            dades: { m, n, a, c, s, mes },
        };
    }
}

/** Una pregunta nova del nivell 1–4. */
export function generaPreguntaIQ(nivell) {
    const n = [1, 2, 3, 4].includes(nivell) ? nivell : 1;
    const q = n <= 2 ? nivell12(n) : n === 3 ? nivell3() : nivell4();
    const passos = [...q.passos, pasRecta(q.sol, q.signe), pasInterval(q.sol, q.signe)];
    return {
        tex: q.tex,
        text: `Resol ${q.tex
            .replace(/\\le/g, '≤')
            .replace(/\\ge/g, '≥')
            .replace(/\\left|\\right|\\dfrac/g, '')}`,
        clau: q.tex,
        passos,
        dades: { nivell: n, sol: q.sol, signe: q.signe, ...q.dades },
    };
}

/** La resposta escrita, per a l'historial. */
export function textRespostaIQ(pas, valors) {
    if (pas.mena === 'recta') {
        const r = valors.rc;
        const m = pas.dades.marques[r.i];
        return `${m ? m.text : '?'} ${r.ple ? 'ple' : 'buit'} ${r.costat === 'esq' ? '←' : '→'}`;
    }
    const peca = id => {
        const f = (pas.fitxes || []).find(x => x.id === id);
        if (!f) return String(id);
        return TEXT_SIGNE[id] || f.tex.replace(/\\infty/g, '∞').replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, '$1/$2');
    };
    return Object.keys(pas.camps)
        .map(c => (pas.camps[c] === 'fitxa' ? peca(valors[c]) : textRacional(valors[c])))
        .join(' ');
}
