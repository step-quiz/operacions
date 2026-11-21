/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/binomial/math-engine.js
 * ROL: «Distribució binomial» (1r–2n Batx): problemes amb context i la pregunta
 *      del joc de passos (js/passos/joc-passos.js). Sense la normal ni aproximacions,
 *      sense mitjana ni desviació (decisions del David, 21/11/2026).
 * ARQUITECTURA: mòdul pur. L'atzar, amb Math.random (els tests el sembren).
 *
 *   PROBLEMA  { context, n, p: [a, b], forma: 'u' | 'pc' | 'frac', r, k }
 *             n de 2 a 6; p = a/b; r: 'eq' | 'ge' | 'le' | 'gt' | 'lt'
 *   CASOS     els valors de X que compleixen la pregunta (C) i els del contrari (T)
 *   NIVELLS   1  P(X = k) (també «cap» i «tots»)
 *             2  desigualtat amb pocs casos (≤ 3), que es fa directament
 *             3  cal el contrari: directament n'hi hauria 3 o més, i pel contrari menys
 *   PASSOS    dades (n, p, q) · pregunta (4 opcions) · camí (4 opcions; nivells 2 i 3) ·
 *             un pas per cas (C(n, k) i P(X = k)) · la resposta (si en cal: una suma, 1 − …,
 *             o el tant per cent). La resposta, en tant per u o en tant per cent, com l'enunciat.
 *   Decimals amb 4 xifres: tolerància 0,0001 a cada cas i 0,0002 a la resposta
 *   (0,02 punts si és en tant per cent), per si l'alumne suma valors ja arrodonits.
 * DEPENDÈNCIES: algebra/racionals.js, strings.js.
 * ============================================================================
 */

import { racional } from '../algebra/racionals.js';
import { CONTEXTOS, TEXTOS_BI, fraseQuants } from './strings.js';

const T = TEXTOS_BI;
const triaBI = arr => arr[Math.floor(Math.random() * arr.length)];
const barrejaBI = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// ── Càlcul ──────────────────────────────────────────────────────────────────
export function combinatori(n, k) {
    if (k < 0 || k > n) return 0;
    let c = 1;
    for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
    return Math.round(c);
}
/** P(X = k) exacta (nombre). */
export const probBinomial = (n, k, p) => combinatori(n, k) * p ** k * (1 - p) ** (n - k);
const arrodoneix4 = x => Math.round(x * 1e4) / 1e4;

/** Els valors de X que entren a P(X r k). */
export const entra = (r, k) =>
    ({ eq: j => j === k, ge: j => j >= k, le: j => j <= k, gt: j => j > k, lt: j => j < k })[r];
export function casos(r, k, n) {
    const C = [];
    const Tc = [];
    for (let j = 0; j <= n; j++) (entra(r, k)(j) ? C : Tc).push(j);
    return { C, T: Tc };
}

// ── Format ──────────────────────────────────────────────────────────────────
/** 0,2373 (text) i 0{,}2373 (TeX); sense zeros de més si n'hi ha menys de 4. */
export function textDecimalBI(x, decimals = 4) {
    const t = x.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');
    return t.replace('.', ',');
}
const texDecimalBI = (x, decimals = 4) => textDecimalBI(x, decimals).replace(',', '{,}');
export const texRel = { eq: '=', ge: '\\ge', le: '\\le', gt: '>', lt: '<' };
const texP = (r, k) => `P(X ${texRel[r]} ${k})`;
/** p en TeX: 0{,}25 o \tfrac{1}{6}. */
const texProb = ([a, b], forma) => (forma === 'frac' ? `\\tfrac{${a}}{${b}}` : texDecimalBI(a / b));
/** La suma de P(X = j): «P(X = 0) + P(X = 1)»; amb 1 − davant si és el contrari. */
function texSuma(js, contrari) {
    const s = js.map(j => `P(X = ${j})`).join(' + ');
    if (!contrari) return s;
    return js.length === 1 ? `1 - ${s}` : `1 - [${s}]`;
}

// ── El problema ─────────────────────────────────────────────────────────────
/** Totes les preguntes (r, k) del nivell, per a n. */
export function preguntesPossibles(nivell, n) {
    const totes = [];
    for (const r of ['eq', 'ge', 'le', 'gt', 'lt'])
        for (let k = 0; k <= n; k++) {
            const { C, T: Tc } = casos(r, k, n);
            if (!C.length || !Tc.length) continue; // P = 1 o 0: no és pregunta
            if (r === 'eq' ? nivell !== 1 : nivell === 1) continue;
            if (nivell === 2 && !(C.length <= 3 && C.length <= Tc.length)) continue;
            if (nivell === 3 && !(C.length >= 3 && Tc.length < C.length)) continue;
            // «menys de 0», «més de n»… ja s'han descartat; «com a màxim 0» = «cap»
            if (r === 'le' && k === 0) continue;
            if (r === 'ge' && k === n) continue;
            // «més de cap» i «menys d'un» no es diuen així: són «almenys un» i «cap»
            if ((r === 'gt' && k === 0) || (r === 'lt' && k <= 1)) continue;
            totes.push({ r, k });
        }
    return totes;
}
const preguntaDelNivell = (nivell, n) => triaBI(preguntesPossibles(nivell, n));

/** Es pot fer aquest problema? (cap cas de la ruta curta no surt amb menys de 0,0005) */
function problemaValid({ n, p, r, k }) {
    const pv = p[0] / p[1];
    const { C, T: Tc } = casos(r, k, n);
    const ruta = C.length <= Tc.length ? C : Tc;
    return !ruta.some(j => probBinomial(n, j, pv) < 5e-4);
}

/** Tots els problemes possibles d'un nivell (per als tests i per a la prova al navegador). */
export function totsElsProblemes(nivell) {
    const tots = [];
    for (const context of CONTEXTOS)
        for (const forma of Object.keys(context.formes))
            for (const valor of context.formes[forma]) {
                const p = forma === 'frac' ? racional(valor[0], valor[1]) : racional(valor, 100);
                for (let n = 2; n <= 6; n++)
                    for (const { r, k } of preguntesPossibles(nivell, n)) {
                        const pr = { context, forma, p, n, r, k };
                        if (problemaValid(pr)) tots.push(pr);
                    }
            }
    return tots;
}

function pText(p, forma) {
    const [a, b] = p;
    if (forma === 'pc') return { pc: true, text: `${(a * 100) / b} %` };
    if (forma === 'frac') return { frac: true, text: `${a} de cada ${b}` };
    return { text: textDecimalBI(a / b) };
}

/** Un problema a l'atzar del nivell (cap cas no pot sortir amb menys de 0,0001). */
export function generaProblema(nivell) {
    for (let intent = 0; intent < 200; intent++) {
        const context = triaBI(CONTEXTOS);
        const forma = triaBI(Object.keys(context.formes));
        const valor = triaBI(context.formes[forma]);
        const p = forma === 'frac' ? racional(valor[0], valor[1]) : racional(valor, 100);
        const n = 2 + Math.floor(Math.random() * 5); // 2 a 6
        const q = preguntaDelNivell(nivell, n);
        if (!q) continue;
        const pr = { context, forma, p, n, r: q.r, k: q.k };
        if (problemaValid(pr)) return pr;
    }
    throw new Error('cap problema');
}

// ── Opcions ─────────────────────────────────────────────────────────────────
function opcioBI(valor, tex) {
    return [valor, tex, null, `$${tex}$`];
}
/** Opcions de la traducció de la pregunta a P(X r k). */
function opcionsPregunta(r, k, n) {
    const c = [];
    const afegeix = (err, r2, k2) => c.push({ err, r: r2, k: k2 });
    if (r === 'eq' && k === 0) {
        afegeix('BI_CAP', 'eq', n);
        afegeix('BI_CAP', 'ge', 1);
        afegeix('BI_CAP', 'le', 1);
        afegeix('BI_CAP', 'lt', 1);
    } else if (r === 'eq' && k === n) {
        afegeix('BI_TOTS', 'eq', 0);
        afegeix('BI_TOTS', 'ge', 1);
        afegeix('BI_EXACTE_DESIG', 'ge', n - 1);
        afegeix('BI_TOTS', 'le', n - 1);
        afegeix('BI_EXACTE_DESIG', 'gt', n - 1);
    } else if (r === 'eq') {
        afegeix('BI_EXACTE_DESIG', 'ge', k);
        afegeix('BI_EXACTE_DESIG', 'le', k);
        afegeix('BI_EXACTE_DESIG', 'gt', k);
    } else {
        const igual = { ge: 'gt', le: 'lt', gt: 'ge', lt: 'le' }[r];
        const errIgual = { ge: 'BI_ALMENYS', le: 'BI_MAXIM', gt: 'BI_MES_DE', lt: 'BI_MENYS_DE' }[r];
        const sentit = { ge: 'le', le: 'ge', gt: 'lt', lt: 'gt' }[r];
        afegeix(errIgual, igual, k);
        afegeix('BI_SENTIT', sentit, k);
        afegeix('BI_EXACTE', 'eq', k);
    }
    const bona = opcioBI('ok', texP(r, k));
    const vistes = new Set([bona[1]]);
    const falses = [];
    const usats = {};
    for (const o of c) {
        const tex = texP(o.r, o.k);
        if (vistes.has(tex)) continue;
        vistes.add(tex);
        usats[o.err] = (usats[o.err] || 0) + 1;
        falses.push(opcioBI(usats[o.err] > 1 ? `${o.err}#${usats[o.err]}` : o.err, tex));
    }
    return barrejaBI([bona, ...falses.slice(0, 3)]);
}

/**
 * Opcions del camí: la ruta curta (ok), la llarga (ok-llarg) si també té pocs casos, i errors:
 * el contrari amb el límit equivocat, el límit, oblidar el 0.
 */
function opcionsCami(r, k, n) {
    const { C, T: Tc } = casos(r, k, n);
    const curtaEsContrari = Tc.length < C.length;
    const clau = (js, contrari) => `${contrari ? '1-' : ''}${js.join(',')}`;
    const ops = [];
    const vistes = new Set();
    const afegeix = (valor, js, contrari) => {
        if (!js.length) return;
        const k2 = clau(js, contrari);
        if (vistes.has(k2)) return;
        vistes.add(k2);
        ops.push(opcioBI(valor, texSuma(js, contrari)));
    };
    afegeix('ok', curtaEsContrari ? Tc : C, curtaEsContrari);
    const llarga = curtaEsContrari ? C : Tc;
    if (llarga.length <= 3) afegeix('ok-llarg', llarga, !curtaEsContrari);
    // Errors: el contrari amb el k mal posat, el límit, el 0
    const vora = C.includes(k) ? k : r === 'gt' ? k + 1 : k - 1; // el valor de C del costat de k
    const falses = [];
    const Tmes = [...Tc, vora].sort((a, b) => a - b); // el contrari amb el k dins
    const Cmenys = C.filter(j => j !== vora);
    const Cmes = [...C, r === 'ge' || r === 'gt' ? Math.min(...C) - 1 : Math.max(...C) + 1]
        .filter(j => j >= 0 && j <= n)
        .sort((a, b) => a - b);
    const Tmenys = Tc.filter(j => j !== (r === 'ge' || r === 'gt' ? Math.max(...Tc) : Math.min(...Tc)));
    falses.push(['BI_CONTRARI_LIMIT', Tmes, true]);
    if (C.includes(0)) falses.push(['BI_OBLIDA_0', C.filter(j => j), false]);
    if (Tc.includes(0)) falses.push(['BI_OBLIDA_0', Tc.filter(j => j), true]);
    falses.push(['BI_LIMIT', Cmenys, false], ['BI_CONTRARI_LIMIT', Tmenys, true], ['BI_LIMIT', Cmes, false]);
    const usats = {};
    for (const [err, js, contrari] of falses) {
        if (ops.length >= 4) break;
        usats[err] = (usats[err] || 0) + 1;
        afegeix(usats[err] > 1 ? `${err}#${usats[err]}` : err, js, contrari);
    }
    return barrejaBI(ops);
}

// ── Els passos ──────────────────────────────────────────────────────────────
function pasDades(pr) {
    const { n, p, forma } = pr;
    const fraccio = forma === 'frac';
    const tipus = fraccio ? 'racional' : 'decimal';
    const q = racional(p[1] - p[0], p[1]);
    return {
        id: 'dades',
        mena: 'dades',
        nom: T.nomPas.dades,
        enunciat: fraccio ? T.enunciat.dadesFraccio : T.enunciat.dades,
        formules: true,
        plantilla: [
            { grup: [{ tex: 'n =' }, { camp: 'n' }] },
            { grup: [{ tex: 'p =' }, { camp: 'p' }] },
            { grup: [{ tex: 'q = 1 - p =' }, { camp: 'q' }] },
        ],
        camps: { n: 'enter', p: tipus, q: tipus },
        solucio: { n, p, q },
        nota: fraccio ? T.nota.fraccio : forma === 'pc' ? T.nota.percent : undefined,
        dades: { k: pr.k, forma, n, p, q },
        linia: `X \\sim B(${n},\\ ${texProb(p, forma)}),\\quad q = ${texProb(q, forma)}`,
    };
}

function pasPregunta(pr) {
    const { r, k, n } = pr;
    return {
        id: 'pregunta',
        mena: 'tria',
        nom: T.nomPas.pregunta,
        enunciat: T.enunciat.pregunta,
        formules: true,
        plantilla: [],
        camps: { tria: 'tria' },
        solucio: { tria: 'ok' },
        opcions: opcionsPregunta(r, k, n),
        dades: {},
        linia: `\\text{Es demana } ${texP(r, k)}`,
    };
}

function pasCami(pr) {
    const { r, k, n } = pr;
    const { C, T: Tc } = casos(r, k, n);
    const contrari = Tc.length < C.length;
    const ruta = contrari ? Tc : C;
    const opcions = opcionsCami(r, k, n);
    const pas = {
        id: 'cami',
        mena: 'tria',
        nom: T.nomPas.cami,
        enunciat: T.enunciat.cami,
        formules: true,
        plantilla: [],
        camps: { tria: 'tria' },
        solucio: { tria: 'ok' },
        opcions,
        dades: {},
        linia: `${texP(r, k)} = ${texSuma(ruta, contrari)}`,
    };
    if (opcions.some(o => o[0] === 'ok-llarg')) pas.alternatives = [{ tria: 'ok-llarg' }];
    return pas;
}

function pasCas(pr, j) {
    const { n, p, forma } = pr;
    const pv = p[0] / p[1];
    const valor = probBinomial(n, j, pv);
    const a4 = arrodoneix4(valor);
    const q = racional(p[1] - p[0], p[1]);
    const exacte = Math.abs(a4 - valor) < 1e-12;
    const potencia = (b, e) => (e === 1 ? b : forma === 'frac' ? `\\left(${b}\\right)^{${e}}` : `${b}^{${e}}`);
    const factors = [`\\binom{${n}}{${j}}`];
    if (j > 0) factors.push(potencia(texProb(p, forma), j));
    if (n - j > 0) factors.push(potencia(texProb(q, forma), n - j));
    return {
        id: `cas${j}`,
        mena: 'cas',
        nom: T.nomPas.cas,
        enunciat: T.enunciat.cas(n, j),
        formules: true,
        plantilla: [
            { grup: [{ tex: `\\binom{${n}}{${j}} =` }, { camp: 'c' }] },
            { grup: [{ tex: `P(X = ${j}) =` }, { camp: 'pj' }] },
        ],
        camps: { c: 'enter', pj: 'decimal' },
        solucio: { c: combinatori(n, j), pj: a4 },
        tolerancia: { pj: 1e-4 },
        nota: T.nota.decimals,
        dades: { n, j, p: pv, valor },
        linia: `P(X = ${j}) = ${factors.join(' \\cdot ')} ${exacte ? '=' : '\\approx'} ${texDecimalBI(a4)}`,
        valor: a4,
    };
}

function pasFinal(pr, ruta, contrari, valorsCasos) {
    const { n, r, k, forma } = pr;
    const pv = pr.p[0] / pr.p[1];
    const exacta = ruta.reduce((s, j) => s + probBinomial(n, j, pv), 0);
    const resultat = contrari ? 1 - exacta : exacta;
    const pc = forma === 'pc';
    const sol = pc ? Math.round(resultat * 1e4) / 100 : arrodoneix4(resultat);
    const sumaTex = valorsCasos.map(v => texDecimalBI(v)).join(' + ');
    const expr = contrari ? (ruta.length === 1 ? `1 - ${sumaTex}` : `1 - (${sumaTex})`) : sumaTex;
    const totalTex = texDecimalBI(arrodoneix4(resultat));
    const parts = [texP(r, k)];
    if (ruta.length > 1 || contrari) parts.push(expr);
    let linia = `${parts.join(' = ')} \\approx ${totalTex}`;
    if (pc) linia += ` = ${texDecimalBI(sol, 2)}\\,\\%`;
    return {
        id: 'final',
        mena: 'final',
        nom: T.nomPas.final,
        enunciat: pc ? T.enunciat.finalPc : T.enunciat.finalU,
        formules: true,
        plantilla: [
            {
                grup: [
                    { tex: `${texP(r, k)} ${pc ? '=' : '\\approx'}` },
                    { camp: 'r' },
                    ...(pc ? [{ tex: '\\%' }] : []),
                ],
            },
        ],
        camps: { r: 'decimal' },
        solucio: { r: sol },
        tolerancia: { r: pc ? 0.02 : 2e-4 },
        nota: pc ? T.nota.percentFinal : T.nota.decimals,
        dades: { contrari, suma: exacta, pc, resultat },
        linia,
    };
}

/** Els passos a partir del camí (després del pas «camí», si l'alumne tria la ruta llarga). */
export function passosDesDe(pr, llarga = false) {
    const { C, T: Tc } = casos(pr.r, pr.k, pr.n);
    let contrari = Tc.length < C.length;
    if (llarga) contrari = !contrari;
    const ruta = contrari ? Tc : C;
    const passosCas = ruta.map(j => pasCas(pr, j));
    const passos = [...passosCas];
    // La resposta: si hi ha més d'un cas, si és el contrari o si cal el tant per cent
    if (ruta.length > 1 || contrari || pr.forma === 'pc')
        passos.push(
            pasFinal(
                pr,
                ruta,
                contrari,
                passosCas.map(p => p.valor)
            )
        );
    return passos;
}

export function preguntaDeProblema(pr) {
    const f = fraseQuants(pr.r, pr.k, pr.n, pr.context.nom);
    const context = pr.context.intro(pText(pr.p, pr.forma), pr.n, pr.p);
    const pregunta = pr.context.pregunta(f);
    const passos = [pasDades(pr), pasPregunta(pr)];
    if (pr.r !== 'eq') passos.push(pasCami(pr));
    passos.push(...passosDesDe(pr));
    return {
        // La targeta «Problema» del joc de passos: el context i la pregunta
        problema: { context, pregunta },
        text: `${context} ${pregunta}`,
        clau: `${pr.context.id}|${pr.n}|${pr.p.join('/')}|${pr.forma}|${pr.r}|${pr.k}`,
        passos,
        dades: { problema: { ...pr, context: pr.context.id } },
        problemaBI: pr,
    };
}

/**
 * Després del pas «camí»: si l'alumne ha triat la ruta llarga (també correcta), els passos que
 * queden es refan per aquest camí (i la línia del camí el diu). Torna els passos nous o null.
 */
export function passosSegonsCami(pregunta, passos, pas, valors) {
    if (pas.id !== 'cami' || valors.tria !== 'ok-llarg') return null;
    const pr = pregunta.problemaBI;
    const i = passos.indexOf(pas);
    const { C, T: Tc } = casos(pr.r, pr.k, pr.n);
    const contrari = !(Tc.length < C.length);
    const ruta = contrari ? Tc : C;
    const cami = { ...pas, linia: `${texP(pr.r, pr.k)} = ${texSuma(ruta, contrari)}` };
    return [...passos.slice(0, i), cami, ...passosDesDe(pr, true)];
}

/** La pregunta del nivell (1 a 3). */
export const generaPreguntaBI = ({ nivell = 1 } = {}) => preguntaDeProblema(generaProblema(nivell));
