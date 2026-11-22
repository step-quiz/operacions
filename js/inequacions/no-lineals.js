/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/no-lineals.js
 * ROL: «Inequacions» (inequacions.html), tipus nous del lliurament 22c: inequacions de 2n
 *      grau i racionals, amb la taula de signes del 19 (js/passos/taula-signes.js) i la
 *      recta del 17 amb trams (js/passos/recta-intervals.js). Codi IQ (decisió A2).
 *      Decisions del David (21/11/2026, artefacte de revisió del 22): D1 els passos
 *      (tot a un costat si cal, els zeros, la taula amb punt de prova, la recta amb punts
 *      plens o buits, l'interval amb 4 opcions); D2 els casos especials, al nivell 3;
 *      E1 els errors (x² > 4 → x > 2, incloure un zero del denominador, multiplicar pel
 *      denominador, punt ple o buit equivocat).
 * ARQUITECTURA: mòdul pur. L'atzar, amb Math.random.
 *
 *   TIPUS
 *   quadratica   x² + bx + c ⊙ 0, dues arrels enteres          → zeros (x₁, x₂)
 *   quadrat      x² ⊙ k² → x² − k² ⊙ 0 (4 opcions)                 → zeros
 *   perX         x² ⊙ ax → x² − ax ⊙ 0 (4 opcions)                 → zeros
 *   fraccio      (x − a)/(x − b) ⊙ 0                               → zeros (numerador, denominador)
 *   fraccioK     (x + p)/(x − q) ⊙ k → una fracció ⊙ 0 (4 opcions)  → zeros
 *   sensZeros    x² + k ⊙ 0 (no s'anul·la mai)                     → zeros (4 opcions)
 *   doble        x² − 2ax + a² ⊙ 0 (= (x − a)²)                    → zeros (4 opcions)
 *   I després, sempre: la taula de signes, la recta amb trams i l'interval (4 opcions).
 *   NIVELLS      1 quadratica, quadrat, perX · 2 fraccio, fraccioK · 3 sensZeros, doble
 * DEPENDÈNCIES: passos/taula-signes.js, passos/recta-intervals.js, strings.js.
 * ============================================================================
 */

import { svgRectaTrams } from '../passos/recta-intervals.js';
import { columnesTaula, htmlTaula } from '../passos/taula-signes.js';
import { TEXTOS_NL } from './strings.js';

const TN = TEXTOS_NL;
const triaNL = arr => arr[Math.floor(Math.random() * arr.length)];
const enterNL = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
function barrejaNL(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ── Notació ─────────────────────────────────────────────────────────────────
export const TEX_REL = { lt: '<', gt: '>', le: '\\le', ge: '\\ge' };
const RELACIONS = ['lt', 'gt', 'le', 'ge'];
/** Un polinomi [[coef, 'x^2'], [coef, 'x'], [coef, '']] en TeX. */
function texPolNL(termes) {
    let s = '';
    for (const [c, v] of termes) {
        if (!c) continue;
        const abs = Math.abs(c);
        const cos = v && abs === 1 ? v : `${abs}${v}`;
        s += s ? ` ${c < 0 ? '-' : '+'} ${cos}` : `${c < 0 ? '-' : ''}${cos}`;
    }
    return s || '0';
}
/** Un polinomi pels coeficients [a, b, c] (ax² + bx + c) o [b, c] (bx + c). */
const texPolCoefs = cs =>
    texPolNL(
        cs.length === 3
            ? [
                  [cs[0], 'x^2'],
                  [cs[1], 'x'],
                  [cs[2], ''],
              ]
            : [
                  [cs[0], 'x'],
                  [cs[1], ''],
              ]
    );
const valorPol = (cs, x) => cs.reduce((acc, c) => acc * x + c, 0);
/** El nombre per a la taula i la recta: −3 amb el menys tipogràfic. */
const textNombreNL = v => (v < 0 ? `−${-v}` : String(v));
const texNombreNL = v => String(v);

// ── La solució com a conjunt ─────────────────────────────────────────────────
/**
 * El conjunt en TeX a partir dels punts crítics (valors), els trams marcats i els punts inclosos:
 * ℝ, ∅, {a}, o una unió d'intervals.
 */
export function texConjunt(valors, trams, inclosos) {
    const n = valors.length;
    // La recta com a seqüència T0 P0 T1 P1 … Tn; es busquen els trossos seguits marcats
    const elements = [];
    for (let k = 0; k <= n; k++) {
        elements.push({ tram: k, on: trams[k] });
        if (k < n) elements.push({ punt: k, on: inclosos[k] });
    }
    const trossos = [];
    let actual = null;
    for (const e of elements) {
        if (e.on) {
            if (!actual) actual = { inici: e, fi: e };
            else actual.fi = e;
        } else if (actual) {
            trossos.push(actual);
            actual = null;
        }
    }
    if (actual) trossos.push(actual);
    if (!trossos.length) return '\\varnothing';
    const t = trossos.map(({ inici, fi }) => {
        if (inici.punt !== undefined && fi.punt !== undefined && inici.punt === fi.punt)
            return `\\{${texNombreNL(valors[inici.punt])}\\}`;
        if (inici.tram === 0 && fi.tram === n) return '\\mathbb{R}';
        const esq =
            inici.tram === 0
                ? '(-\\infty'
                : inici.punt !== undefined
                  ? `[${texNombreNL(valors[inici.punt])}`
                  : `(${texNombreNL(valors[inici.tram - 1])}`;
        const dre =
            fi.tram === n
                ? '+\\infty)'
                : fi.punt !== undefined
                  ? `${texNombreNL(valors[fi.punt])}]`
                  : `${texNombreNL(valors[fi.tram])})`;
        return `${esq}, ${dre}`;
    });
    return t.join(' \\cup ');
}

// ── L'expressió f(x) = N(x)/D(x) ⊙ 0 i els passos comuns ──────────────────────
/**
 * La resta de passos a partir de l'expressió ja amb 0 a la dreta.
 * e: { num: coefs, den: coefs | null, zerosN: [valors], zerosD: [valors], rel, texExpr }
 */
function passosComuns(e, ineqTex, falsesExtra = []) {
    const f = x => valorPol(e.num, x) / (e.den ? valorPol(e.den, x) : 1);
    const punts = [...e.zerosN.map(v => ({ v, den: false })), ...e.zerosD.map(v => ({ v, den: true }))].sort(
        (p, q) => p.v - q.v
    );
    const valors = punts.map(p => p.v);
    const columnes = columnesTaula(punts.map(p => ({ v: p.v, text: textNombreNL(p.v) })));
    // El signe a cada interval (al punt mig, o a una unitat de la vora si és infinit) i a cada punt
    const signes = columnes.map((c, i) => {
        if (c.tipus === 'punt') return punts[(i - 1) / 2].den ? 'no' : 'zero';
        const x =
            c.a === -Infinity && c.b === Infinity
                ? 0
                : c.a === -Infinity
                  ? c.b - 1
                  : c.b === Infinity
                    ? c.a + 1
                    : (c.a + c.b) / 2;
        return f(x) > 0 ? 'mes' : 'menys';
    });
    const vol = e.rel === 'gt' || e.rel === 'ge' ? 'mes' : 'menys';
    const ambIgual = e.rel === 'le' || e.rel === 'ge';
    const trams = columnes.filter(c => c.tipus === 'interval').map((_, k) => signes[2 * k] === vol);
    const inclosos = punts.map(p => !p.den && ambIgual);
    const C = TN.celles;
    const opcionsSigne = {
        interval: [
            ['mes', C.mes],
            ['menys', C.menys],
        ],
        punt: [
            ['zero', C.zero],
            ['no', C.no],
        ],
    };
    const dades = { punts, valors, signes, trams, inclosos, rel: e.rel, num: e.num, den: e.den };
    const taula = {
        id: 'taula',
        mena: 'taulaNL',
        nom: TN.nomPas.taula,
        enunciat: TN.enunciat.taula(e.texExpr),
        formules: true,
        plantilla: [
            {
                camp: 'taula',
                taula: {
                    columnes,
                    files: [
                        { id: 'prova', titol: TN.files.prova, editable: true },
                        { id: 's', titol: TN.files.signe, editable: true, opcions: opcionsSigne },
                    ],
                },
            },
        ],
        camps: { taula: 'taula' },
        solucio: { taula: { prova: true, files: { s: signes } } },
        dades,
        linia: '',
        svgResolt: htmlTaula({
            columnes,
            files: [{ titol: TN.files.signe, valors: signes.map(s => C[s]) }],
        }),
    };
    const recta = {
        id: 'trams',
        mena: 'trams',
        nom: TN.nomPas.trams,
        enunciat: TN.enunciat.trams(ineqTex),
        formules: true,
        plantilla: [{ camp: 'rt', trams: { punts: punts.map(p => ({ v: p.v, text: textNombreNL(p.v) })) } }],
        camps: { rt: 'trams' },
        solucio: { rt: { trams, inclosos } },
        dades,
        linia: '',
        svgResolt: svgRectaTrams({
            punts: punts.map(p => ({ v: p.v, text: textNombreNL(p.v) })),
            trams,
            inclosos,
        }),
    };
    // L'interval: la bona i els errors típics, cadascun amb el seu conjunt
    const bona = texConjunt(valors, trams, inclosos);
    const ambDen = punts.some(p => p.den);
    const candidats = [];
    // Els signes contraris (conservant si hi entren els zeros del numerador)
    candidats.push([
        'TRAMS_SENTIT',
        texConjunt(
            valors,
            trams.map(t => !t),
            inclosos
        ),
    ]);
    // Parèntesi per claudàtor als zeros del numerador
    // Parèntesi per claudàtor; sense claudàtors ({a} ↔ ∅, ℝ ↔ ℝ − {a}), el punt ple o buit
    if (e.zerosN.length) {
        const girat = texConjunt(
            valors,
            trams,
            punts.map(p => !p.den && !ambIgual)
        );
        candidats.push([/[[\]]/.test(bona + girat) ? 'CLAUDATOR' : ambIgual ? 'PUNT_BUIT' : 'PUNT_PLE', girat]);
    }
    // Un zero del denominador inclòs
    if (ambDen)
        candidats.push([
            'DEN_INCLOS',
            texConjunt(
                valors,
                trams,
                punts.map((p, k) => p.den || inclosos[k])
            ),
        ]);
    // Només un costat (x² > 4 → x > 2; x² < 4 → x < 2)
    if (trams.length === 3 && trams[0] && trams[2] && !trams[1])
        candidats.push(['ARREL_UN_COSTAT', texConjunt(valors, [false, false, true], [false, inclosos[1]])]);
    if (trams.length === 3 && !trams[0] && trams[1] && !trams[2])
        candidats.push(['ARREL_UN_COSTAT', texConjunt(valors, [true, true, false], [true, inclosos[1]])]);
    // Els signes contraris i els claudàtors girats alhora
    if (e.zerosN.length)
        candidats.push([
            'TRAMS_SENTIT',
            texConjunt(
                valors,
                trams.map(t => !t),
                punts.map(p => !p.den && !ambIgual)
            ),
        ]);
    candidats.push(...falsesExtra);
    candidats.push(['TRAMS', '\\mathbb{R}'], ['TRAMS', '\\varnothing']);
    if (valors.length) candidats.push(['TRAMS', `\\{${texNombreNL(valors[0])}\\}`]);
    candidats.push(['TRAMS', `(-\\infty, ${texNombreNL(valors[0] ?? 0)})`]);
    const vistes = new Set([bona]);
    const opcions = [[`ok`, bona, null, `$${bona}$`]];
    const usats = {};
    for (const [codi, tex] of candidats) {
        if (opcions.length >= 4) break;
        if (vistes.has(tex)) continue;
        vistes.add(tex);
        usats[codi] = (usats[codi] || 0) + 1;
        opcions.push([usats[codi] > 1 ? `${codi}#${usats[codi]}` : codi, tex, null, `$${tex}$`]);
    }
    const interval = {
        id: 'interval',
        mena: 'tria',
        nom: TN.nomPas.interval,
        enunciat: TN.enunciat.interval(ineqTex),
        formules: true,
        plantilla: [],
        camps: { tria: 'tria' },
        solucio: { tria: 'ok' },
        opcions: barrejaNL(opcions),
        dades,
        linia: `x \\in ${bona}`,
    };
    return { passos: [taula, recta, interval], dades, conjunt: bona };
}

/** Un pas de triar entre 4 equacions o inequacions (la bona i les falses, ja sense repetir). */
function pasTriaNL(id, enunciat, bona, falses, linia, dades = {}) {
    const vistes = new Set([bona]);
    const ops = [['ok', bona, null, `$${bona}$`]];
    const usats = {};
    for (const [codi, tex] of falses) {
        if (ops.length >= 4) break;
        if (vistes.has(tex)) continue;
        vistes.add(tex);
        usats[codi] = (usats[codi] || 0) + 1;
        ops.push([usats[codi] > 1 ? `${codi}#${usats[codi]}` : codi, tex, null, `$${tex}$`]);
    }
    return {
        id,
        mena: 'tria',
        nom: TN.nomPas[id],
        enunciat,
        formules: true,
        plantilla: [],
        camps: { tria: 'tria' },
        solucio: { tria: 'ok' },
        opcions: barrejaNL(ops),
        dades,
        linia,
    };
}
/** Els zeros d'un polinomi de 2n grau (dos enters, en qualsevol ordre). */
function pasZerosParell(eqTex, [r1, r2], dades) {
    return {
        id: 'zeros',
        mena: 'zerosNL',
        nom: TN.nomPas.zeros,
        enunciat: TN.enunciat.zeros(eqTex),
        formules: true,
        plantilla: [{ grup: [{ tex: TN.camps.x1 }, { camp: 'x1' }] }, { grup: [{ tex: TN.camps.x2 }, { camp: 'x2' }] }],
        camps: { x1: 'enter', x2: 'enter' },
        solucio: { x1: r1, x2: r2 },
        parell: ['x1', 'x2'],
        nota: TN.nota.dues,
        dades: { ...dades, arrels: [r1, r2] },
        linia: `${eqTex} \\iff x = ${r1},\\; x = ${r2}`,
    };
}
const relAtzar = () => triaNL(RELACIONS);
const ineq = (esq, rel, dre) => `${esq} ${TEX_REL[rel]} ${dre}`;

// ═════════════════════════════════════════════════════════════════════════════
// NIVELL 1: DE 2n GRAU
// ═════════════════════════════════════════════════════════════════════════════
/** x² + bx + c ⊙ 0 amb dues arrels enteres. */
export function inequacioQuadratica() {
    let r1;
    let r2;
    do [r1, r2] = [enterNL(-6, 6), enterNL(-6, 6)];
    while (
        // Les arrels, a 2 o més de distància: així cada interval té un punt de prova enter
        Math.abs(r1 - r2) < 2 ||
        r1 + r2 === 0
    );
    const num = [1, -(r1 + r2), r1 * r2];
    const rel = relAtzar();
    const expr = texPolCoefs(num);
    const tex = ineq(expr, rel, '0');
    const [a, b] = [r1, r2].sort((p, q) => p - q);
    const comuns = passosComuns({ num, den: null, zerosN: [a, b], zerosD: [], rel, texExpr: expr }, tex);
    return {
        tipus: 'quadratica',
        tex,
        passos: [pasZerosParell(`${expr} = 0`, [b, a], { num }), ...comuns.passos],
        conjunt: comuns.conjunt,
        dades: comuns.dades,
    };
}

/** x² ⊙ k²: primer, tot a un costat (l'error clàssic: x² > 4 → x > 2). */
export function inequacioQuadrat() {
    const k = enterNL(2, 7);
    const rel = relAtzar();
    const tex = ineq('x^2', rel, String(k * k));
    const expr = `x^2 - ${k * k}`;
    const bona = ineq(expr, rel, '0');
    const GIR = { lt: 'gt', gt: 'lt', le: 'ge', ge: 'le' };
    const passa = pasTriaNL(
        'passa',
        TN.enunciat.passa,
        bona,
        [
            ['ARREL_UN_COSTAT', ineq('x', rel, String(k))],
            ['PASSA_SIGNE', ineq(`x^2 + ${k * k}`, rel, '0')],
            ['SENTIT_PASSA', ineq(`-x^2 + ${k * k}`, rel, '0')],
            ['ARREL_UN_COSTAT', ineq('x', rel, `\\pm ${k}`)],
            ['SENTIT_PASSA', ineq(expr, GIR[rel], '0')],
        ],
        `${tex} \\iff ${bona}`
    );
    const comuns = passosComuns(
        { num: [1, 0, -k * k], den: null, zerosN: [-k, k], zerosD: [], rel, texExpr: expr },
        bona
    );
    return {
        tipus: 'quadrat',
        tex,
        passos: [passa, pasZerosParell(`${expr} = 0`, [k, -k], { num: [1, 0, -k * k] }), ...comuns.passos],
        conjunt: comuns.conjunt,
        dades: comuns.dades,
    };
}

/** x² ⊙ ax: tot a un costat (no es pot dividir per x). */
export function inequacioPerX() {
    const a = triaNL([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
    const rel = relAtzar();
    const ax = texPolNL([[a, 'x']]);
    const tex = ineq('x^2', rel, ax);
    const num = [1, -a, 0];
    const expr = texPolCoefs(num);
    const bona = ineq(expr, rel, '0');
    const passa = pasTriaNL(
        'passa',
        TN.enunciat.passa,
        bona,
        [
            ['DIVIDEIX_X', ineq('x', rel, String(a))],
            ['PASSA_SIGNE', ineq(texPolCoefs([1, a, 0]), rel, '0')],
            ['SENTIT_PASSA', ineq(texPolCoefs([-1, a, 0]), rel, '0')],
        ],
        `${tex} \\iff ${bona}`
    );
    const [p, q] = [0, a].sort((u, v) => u - v);
    const comuns = passosComuns({ num, den: null, zerosN: [p, q], zerosD: [], rel, texExpr: expr }, bona);
    return {
        tipus: 'perX',
        tex,
        passos: [passa, pasZerosParell(`${expr} = 0`, [a, 0], { num }), ...comuns.passos],
        conjunt: comuns.conjunt,
        dades: comuns.dades,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// NIVELL 2: RACIONALS
// ═════════════════════════════════════════════════════════════════════════════
/** Els zeros del numerador i del denominador d'una fracció de primer grau sobre primer grau. */
function pasZerosFraccio(numTex, denTex, zn, zd, dades) {
    return {
        id: 'zeros',
        mena: 'zerosFraccio',
        nom: TN.nomPas.zeros,
        enunciat: TN.enunciat.zerosFraccio(numTex, denTex),
        formules: true,
        plantilla: [{ grup: [{ tex: TN.camps.n }, { camp: 'n' }] }, { grup: [{ tex: TN.camps.d }, { camp: 'd' }] }],
        camps: { n: 'enter', d: 'enter' },
        solucio: { n: zn, d: zd },
        dades: { ...dades, zn, zd },
        linia: `${numTex === 'x' ? '' : `${numTex} = 0 \\iff `}x = ${zn};\\quad ${denTex === 'x' ? '' : `${denTex} = 0 \\iff `}x = ${zd}`,
    };
}

/** (x − a)/(x − b) ⊙ 0. */
export function inequacioFraccio() {
    let a;
    let b;
    do [a, b] = [enterNL(-6, 6), enterNL(-6, 6)];
    while (Math.abs(a - b) < 2);
    const rel = relAtzar();
    const num = [1, -a];
    const den = [1, -b];
    const [nt, dt] = [texPolCoefs(num), texPolCoefs(den)];
    const expr = `\\dfrac{${nt}}{${dt}}`;
    const tex = ineq(expr, rel, '0');
    const comuns = passosComuns({ num, den, zerosN: [a], zerosD: [b], rel, texExpr: expr }, tex);
    return {
        tipus: 'fraccio',
        tex,
        passos: [pasZerosFraccio(nt, dt, a, b, { num, den }), ...comuns.passos],
        conjunt: comuns.conjunt,
        dades: comuns.dades,
    };
}

/** (x + p)/(x − q) ⊙ k: restar k amb el mateix denominador (no multiplicar pel denominador). */
export function inequacioFraccioK() {
    for (;;) {
        const k = triaNL([-2, -1, 2, 3]);
        const p = enterNL(-6, 6);
        const q = enterNL(-5, 5);
        // (x + p − k(x − q))/(x − q) = ((1 − k)x + p + kq)/(x − q)
        const A = 1 - k;
        const B = p + k * q;
        if (B % A !== 0) continue;
        const zn = -B / A;
        if (Math.abs(zn - q) < 2 || Math.abs(zn) > 8 || p === -q) continue;
        const rel = relAtzar();
        const numOrig = [1, p];
        const den = [1, -q];
        const [ntO, dt] = [texPolCoefs(numOrig), texPolCoefs(den)];
        const tex = ineq(`\\dfrac{${ntO}}{${dt}}`, rel, String(k));
        const num = [A, B];
        const nt = texPolCoefs(num);
        const expr = `\\dfrac{${nt}}{${dt}}`;
        const bona = ineq(expr, rel, '0');
        const kq = texPolCoefs([k, -k * q]); // k(x − q) desenvolupat
        const passa = pasTriaNL(
            'passa',
            TN.enunciat.passa,
            bona,
            [
                ['MULTIPLICA_DEN', ineq(ntO, rel, kq)],
                ['RESTA_SENSE_DEN', ineq(`\\dfrac{${texPolCoefs([1, p - k])}}{${dt}}`, rel, '0')],
                ['DISTRIBUTIVA_FRACCIO', ineq(`\\dfrac{${texPolCoefs([A, p - k * q])}}{${dt}}`, rel, '0')],
                ['MULTIPLICA_DEN', ineq(texPolCoefs([A, B]), rel, '0')],
            ],
            `${tex} \\iff \\dfrac{${ntO} - ${k < 0 ? `(${k})` : k}(${dt})}{${dt}} ${TEX_REL[rel]} 0 \\iff ${bona}`
        );
        const comuns = passosComuns({ num, den, zerosN: [zn], zerosD: [q], rel, texExpr: expr }, bona);
        return {
            tipus: 'fraccioK',
            tex,
            passos: [passa, pasZerosFraccio(nt, dt, zn, q, { num, den }), ...comuns.passos],
            conjunt: comuns.conjunt,
            dades: comuns.dades,
        };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// NIVELL 3: CASOS ESPECIALS
// ═════════════════════════════════════════════════════════════════════════════
/** Els zeros com a 4 opcions (sense zeros reals, o una solució doble). */
function pasZerosTria(eqTex, bona, falses, linia, dades) {
    const opcio = (valor, text) => [valor, text.replace(/\$/g, ''), null, text];
    const usats = {};
    const ops = [
        opcio('ok', bona),
        ...falses.map(([codi, text]) => {
            usats[codi] = (usats[codi] || 0) + 1;
            return opcio(usats[codi] > 1 ? `${codi}#${usats[codi]}` : codi, text);
        }),
    ];
    const vistes = new Set();
    const uniques = ops.filter(o => (vistes.has(o[1]) ? false : vistes.add(o[1])));
    return {
        id: 'zeros',
        mena: 'tria',
        nom: TN.nomPas.zeros,
        enunciat: TN.enunciat.zerosTria(eqTex),
        formules: true,
        plantilla: [],
        camps: { tria: 'tria' },
        solucio: { tria: 'ok' },
        opcions: barrejaNL(uniques.slice(0, 4)),
        dades,
        linia,
    };
}

/** x² + k ⊙ 0 (k = m²): no s'anul·la mai; la solució és ℝ o ∅. */
export function inequacioSensZeros() {
    const m = enterNL(1, 4);
    const k = m * m;
    const rel = relAtzar();
    const num = [1, 0, k];
    const expr = texPolCoefs(num);
    const tex = ineq(expr, rel, '0');
    const O = TN.opcionsZeros;
    const zeros = pasZerosTria(
        `${expr} = 0`,
        O.cap,
        [
            ['SENSE_ZEROS_REALS', O.dues(-m, m)],
            ['SENSE_ZEROS_REALS', O.una(m)],
            ['ZEROS', O.una(-k)],
        ],
        `${expr} = 0 \\iff x^2 = -${k}:\\ \\text{cap solució real}`,
        { num }
    );
    // Com si fos x² − k: els intervals de ±m
    const comuns = passosComuns({ num, den: null, zerosN: [], zerosD: [], rel, texExpr: expr }, tex, [
        ['SENSE_ZEROS_REALS', `(-${m}, ${m})`],
        ['SENSE_ZEROS_REALS', `(-\\infty, -${m}) \\cup (${m}, +\\infty)`],
    ]);
    return {
        tipus: 'sensZeros',
        tex,
        passos: [zeros, ...comuns.passos],
        conjunt: comuns.conjunt,
        dades: comuns.dades,
    };
}

/** x² − 2ax + a² ⊙ 0 = (x − a)² ⊙ 0: un sol zero (doble); la solució és ℝ, ∅, {a} o ℝ − {a}. */
export function inequacioDoble() {
    const a = triaNL([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
    const rel = relAtzar();
    const num = [1, -2 * a, a * a];
    const expr = texPolCoefs(num);
    const tex = ineq(expr, rel, '0');
    const O = TN.opcionsZeros;
    const zeros = pasZerosTria(
        `${expr} = 0`,
        O.doble(a),
        [
            ['ZERO_DOBLE', O.dues(Math.min(a, -a), Math.max(a, -a))],
            ['SENSE_ZEROS_REALS', O.cap],
            ['SIGNE_ZEROS', O.doble(-a)],
        ],
        `${expr} = (${texPolCoefs([1, -a])})^2 = 0 \\iff x = ${a}`,
        { num }
    );
    const comuns = passosComuns({ num, den: null, zerosN: [a], zerosD: [], rel, texExpr: expr }, tex);
    return {
        tipus: 'doble',
        tex,
        passos: [zeros, ...comuns.passos],
        conjunt: comuns.conjunt,
        dades: comuns.dades,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// LA PREGUNTA
// ═════════════════════════════════════════════════════════════════════════════
const PER_NIVELL_NL = {
    1: [inequacioQuadratica, inequacioQuadratica, inequacioQuadrat, inequacioPerX],
    2: [inequacioFraccio, inequacioFraccioK],
    3: [inequacioSensZeros, inequacioDoble],
};
/** Una inequació de 2n grau o racional del nivell (1 a 3). */
export function generaPreguntaNL(nivell = 1) {
    const q = triaNL(PER_NIVELL_NL[Math.min(3, Math.max(1, nivell))])();
    return {
        ...q,
        text: `Resol ${q.tex
            .replace(/\\le/g, '≤')
            .replace(/\\ge/g, '≥')
            .replace(/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
            .replace(/\^2/g, '²')}`,
        clau: `${q.tipus}|${q.tex}`,
        dades: { ...q.dades, nivell, tipus: q.tipus },
    };
}

/** La resposta en text, per a l'historial. */
export function textRespostaNL(pas, valors) {
    if (pas.mena === 'tria') {
        const o = pas.opcions.find(([v]) => v === valors.tria);
        return o ? o[1] : String(valors.tria);
    }
    if (pas.mena === 'taulaNL') {
        const s = (valors.taula && valors.taula.files && valors.taula.files.s) || [];
        return s.map(v => TN.celles[v] || '?').join(' ');
    }
    if (pas.mena === 'trams') {
        const r = valors.rt;
        return r ? texConjunt(pas.dades.valors, r.trams, r.inclosos) : '';
    }
    return Object.keys(pas.camps)
        .map(nom => String(valors[nom]))
        .join(' ; ');
}
