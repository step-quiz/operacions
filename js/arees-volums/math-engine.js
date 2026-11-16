/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/arees-volums/math-engine.js
 * ROL: La matemàtica d'«Àrees i volums» (arees-volums.html): genera les figures, els
 *      seus passos i, per a cada pas, els valors que donen els errors típics.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar). Els nombres són
 *      coeficients exactes (js/algebra/racionals.js): π ≈ 3,14 = 314/100, i les àrees i
 *      els volums surten amb decimals exactes. Joc comú (js/passos/joc-passos.js),
 *      correcció comuna (js/passos/correccio.js) i figures comunes
 *      (js/passos/figures-mesura.js).
 *
 *   DECISIONS DEL DAVID (16/11/2026)
 *     - La base i l'altura es marquen triant la lletra d'un segment del dibuix; el costat
 *       inclinat (o l'apotema, o la generatriu) és la trampa de l'altura.
 *     - π ≈ 3,14 i els resultats, amb els decimals exactes.
 *     - Cossos: l'àrea de la base, la lateral i la total, i el volum, pas a pas.
 *     - 3 nivells i l'opció ?dim= (2: només figures planes; 3: només cossos).
 *   LES MESURES són enteres: els costats inclinats surten de ternes pitagòriques. A la
 *     piràmide i al con, un dels catets de la terna és múltiple de 3, i per això el volum
 *     (: 3) és exacte; a l'esfera, el radi és múltiple de 3 (i mai 3, perquè l'àrea i el
 *     volum no donin el mateix nombre).
 *   PASSOS     figura plana    fórmula (tria) · base i altura, diagonals o bases (tria
 *                              d'una lletra o d'un parell) · radi (cercle) · àrea (decimal)
 *                              · unitat (tria: u, u², u³)
 *              figura composta com es calcula (sumar o restar, tria) · les dues parts ·
 *                              l'àrea de la figura · unitat
 *              cos             altura (piràmide i con, tria) · àrea de la base · lateral ·
 *                              total (amb la unitat escrita) · volum · unitat del volum
 *                              (esfera: àrea, fórmula del volum, volum, unitat)
 *   NIVELLS    ?dim=''   1 triangle, paral·lelogram, rombe · 2 trapezi, cercle i compostes ·
 *                        3 cossos
 *              ?dim=2    1 igual · 2 trapezi i cercle · 3 compostes
 *              ?dim=3    1 ortoedre i cilindre · 2 piràmide i con · 3 tots, amb l'esfera
 *
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, passos/figures-mesura.js i strings.js.
 * ============================================================================
 */

import { pick, randInt, shuffle } from '../utils.js';
import {
    coeficient,
    coefsIguals,
    comRacional,
    oposatCoef,
    producteCoef,
    quocientCoef,
    signeCoef,
    sumaCoef,
    texDecimal,
    textDecimal,
} from '../algebra/racionals.js';
import {
    svgCasa,
    svgCercle,
    svgCilindre,
    svgCon,
    svgEsfera,
    svgForat,
    svgL,
    svgOrtoedre,
    svgParalelogram,
    svgPiramide,
    svgPorta,
    svgRombe,
    svgTrapezi,
    svgTriangle,
} from '../passos/figures-mesura.js';
import { TEXTOS_AV } from './strings.js';

const T = TEXTOS_AV;

const PLANES = ['triangle', 'paralelogram', 'rombe'];
const COMPOSTES = ['casa', 'forat', 'porta', 'L'];
export const COSSOS_AV = ['ortoedre', 'cilindre', 'piramide', 'con', 'esfera'];
const AMB_PI = ['cercle', 'forat', 'porta', 'cilindre', 'con', 'esfera'];

/** Les figures de cada nivell, segons ?dim= ('' tot, '2' planes, '3' cossos). */
export const FIGURES_AV = {
    '': { 1: PLANES, 2: ['trapezi', 'cercle', 'trapezi', 'cercle', ...COMPOSTES], 3: COSSOS_AV },
    '2': { 1: PLANES, 2: ['trapezi', 'cercle'], 3: COMPOSTES },
    '3': { 1: ['ortoedre', 'cilindre'], 2: ['piramide', 'con'], 3: COSSOS_AV },
};

/** La figura d'una pregunta: una de les del nivell (1-3) i de l'opció ?dim=. */
export function figuraAV(dim, nivell) {
    const d = Object.prototype.hasOwnProperty.call(FIGURES_AV, dim) ? dim : '';
    return pick(FIGURES_AV[d][[1, 2, 3].includes(nivell) ? nivell : 1]);
}

export const PI_AV = coeficient(314, 100);
const PI_TEX = '3{,}14';
const UNITATS = ['cm', 'dm', 'm'];
// Caràcters de les caselles dels resultats (el joc en posa 6 per defecte): 7234,56 en cap
const LLARG = 8;

// ── Nombres i escriptura ─────────────────────────────────────────────────────
const per = (...xs) => xs.reduce((a, b) => producteCoef(a, b), 1);
const mes = (...xs) => xs.reduce((a, b) => sumaCoef(a, b), 0);
const menys = (x, y) => sumaCoef(x, oposatCoef(y));
const entre = (x, n) => quocientCoef(x, n);
const tx = x => texDecimal(x);
const tt = x => textDecimal(x);
/** Una unitat elevada a e (1 longitud, 2 àrea, 3 volum): «cm²» i \text{cm}^{2}. */
export const textUnitat = (u, e) => u + ['', '', '²', '³'][e];
const texUnitat = (u, e) => `\\text{${u}}${e > 1 ? `^{${e}}` : ''}`;
const sub = nom => `A_{\\text{${nom}}}`;

// Ternes pitagòriques: els costats inclinats enters
const TERNES = [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [9, 12, 15],
    [8, 15, 17],
    [12, 16, 20],
];
/** Les ternes amb hipotenusa ≤ max, amb els catets en tots dos ordres: [catet, catet, hipotenusa]. */
const ternes = max =>
    TERNES.filter(t => t[2] <= max).flatMap(([p, q, r]) => [
        [p, q, r],
        [q, p, r],
    ]);
const diferents = (...xs) => new Set(xs).size === xs.length;

/** Posa una lletra (a, b, c, d, en un ordre a l'atzar) a cada segment: { id: { lletra, valor } }. */
function ambLletres(valors) {
    const lletres = shuffle(['a', 'b', 'c', 'd']);
    const segments = {};
    Object.keys(valors).forEach((id, i) => {
        segments[id] = { lletra: lletres[i], valor: tt(valors[id]) };
    });
    return segments;
}

/** Si un coeficient té decimals exactes (el seu denominador només té els factors 2 i 5). */
function exacte(x) {
    let d = comRacional(x)[1];
    for (const p of [2, 5]) while (d % p === 0) d /= p;
    return d === 1;
}

/**
 * Els valors equivocats d'un camp decimal: sense el bo, sense repetits, positius i amb decimals
 * exactes (un decimal periòdic no es pot escriure a la casella).
 */
function nets(sol, llista) {
    const net = [];
    for (const [valor, errorType] of llista) {
        if (
            signeCoef(valor) <= 0 ||
            !exacte(valor) ||
            coefsIguals(valor, sol) ||
            net.some(([v]) => coefsIguals(v, valor))
        )
            continue;
        net.push([valor, errorType]);
    }
    return net;
}

// ── Els passos ───────────────────────────────────────────────────────────────
/**
 * Un pas d'escollir: la bona [valor, text] i les dolentes [valor, text, errorType|null] (com a molt
 * 4 opcions en total, per ordre de preferència). barreja: les opcions, a l'atzar (si no, per valor);
 * literal: el text de les opcions, tal com és (sense la primera lletra en majúscula: «b = 6 cm», «cm²»).
 */
function pasTria(id, enunciat, bona, dolentes, linia, { barreja = true, literal = false, nom = T.nomPas[id] } = {}) {
    const totes = [bona];
    for (const d of dolentes) if (totes.length < 4 && !totes.some(([v]) => v === d[0])) totes.push(d);
    const ordenades = barreja ? shuffle(totes.slice()) : totes.slice().sort((x, y) => x[0].localeCompare(y[0]));
    return {
        id,
        mena: id,
        nom,
        enunciat,
        plantilla: [],
        camps: { tria: 'tria' },
        opcions: ordenades.map(([valor, text]) => [valor, text]),
        literal,
        solucio: { tria: bona[0] },
        dades: {
            distractors: {
                tria: totes
                    .slice(1)
                    .filter(d => d[2])
                    .map(([valor, , error]) => [valor, error]),
            },
        },
        linia,
    };
}

/** Un pas d'escriure un nombre: «simbol = [casella] (unitat)». unitat: [u, exponent] o null. */
function pasNombre({ id, nom = T.nomPas[id], enunciat, simbol, sol, llista, linia, unitat = null, nota = '' }) {
    const plantilla = [{ tex: `${simbol} =` }, { camp: 'r', llarg: LLARG }];
    if (unitat) plantilla.push({ tex: `\\ ${texUnitat(...unitat)}` });
    return {
        id,
        mena: id,
        nom,
        enunciat,
        plantilla,
        camps: { r: 'decimal' },
        solucio: { r: sol },
        dades: { distractors: { r: nets(sol, llista) }, unitat: unitat ? textUnitat(...unitat) : '' },
        nota,
        linia: unitat ? `${linia}\\ ${texUnitat(...unitat)}` : linia,
    };
}

/** El pas de la unitat: u (longitud), u² (àrea) o u³ (volum); e, la bona. */
function pasUnitat(u, e, simbol, valor) {
    const opcio = k => [String(k), textUnitat(u, k)];
    return pasTria(
        'unitat',
        e === 3 ? T.enunciat.unitatVolum : T.enunciat.unitat,
        opcio(e),
        [1, 2, 3].filter(k => k !== e).map(k => [...opcio(k), 'UNITAT']),
        `${simbol} = ${tx(valor)}\\ ${texUnitat(u, e)}`,
        { barreja: false, literal: true }
    );
}

/** Escollir un segment del dibuix (bona: el seu id); errors: { id del segment: errorType }. */
function pasSegment(id, enunciat, fig, bona, errors, paraula) {
    const { segments, valors, u } = fig;
    const opcio = s => [segments[s].lletra, `${segments[s].lletra} = ${segments[s].valor} ${u}`, errors[s] || null];
    return pasTria(
        id,
        enunciat,
        opcio(bona),
        Object.keys(segments)
            .filter(s => s !== bona)
            .map(opcio),
        `${paraula} = ${segments[bona].lletra} = ${tx(valors[bona])}\\ ${texUnitat(u, 1)}`,
        { barreja: false, literal: true }
    );
}

/** Escollir un parell de segments (les diagonals, les bases); paraules: les dels dos, en TeX. */
function pasParell(id, enunciat, fig, [s1, s2], error, [p1, p2]) {
    const { segments, valors, u } = fig;
    const opcio = (x, y, e) => {
        const [l1, l2] = [segments[x].lletra, segments[y].lletra].sort();
        return [`${l1}${l2}`, `${l1} ${T.i} ${l2}`, e];
    };
    const ids = Object.keys(segments);
    const dolents = [];
    ids.forEach((x, i) =>
        ids.slice(i + 1).forEach(y => {
            if (!([x, y].includes(s1) && [x, y].includes(s2))) dolents.push(opcio(x, y, error));
        })
    );
    const valor = s => `${segments[s].lletra} = ${tx(valors[s])}\\ ${texUnitat(u, 1)}`;
    return pasTria(id, enunciat, opcio(s1, s2), shuffle(dolents), `${p1} = ${valor(s1)},\\quad ${p2} = ${valor(s2)}`, {
        barreja: false,
        literal: true,
    });
}

/** Les dades comunes d'una figura: les mesures, les lletres i la unitat. */
const figura = (valors, u) => ({ valors, segments: ambLletres(valors), u });

// ── Figures planes ───────────────────────────────────────────────────────────
function triangle(u) {
    let h, a1, c1, a2, c2;
    do {
        const totes = ternes(20);
        [h, a1, c1] = pick(totes);
        [, a2, c2] = pick(totes.filter(t => t[0] === h));
    } while (a1 + a2 === h);
    const b = a1 + a2;
    const fig = figura({ base: b, esq: c1, dre: c2, altura: h }, u);
    const A = entre(per(b, h), 2);
    return {
        ...fig,
        svg: svgTriangle({ a1, a2, h, segments: fig.segments, u }),
        resultat: { area: A },
        passos: [
            pasTria(
                'formula',
                T.enunciat.formula,
                ['bh2', T.formula.bh2],
                [
                    ['bh', T.formula.bh, 'OBLIDA_MEITAT'],
                    ['tres', T.formula.tres, 'AREA_PERIMETRE'],
                    ['bc2', T.formula.bc2, 'ALTURA_INCLINADA'],
                ],
                `A = \\dfrac{${T.tex.base} \\cdot ${T.tex.altura}}{2}`
            ),
            pasSegment(
                'base',
                T.enunciat.base,
                fig,
                'base',
                { altura: 'BASE_ALTURA', esq: 'BASE_COSTAT', dre: 'BASE_COSTAT' },
                T.tex.base
            ),
            pasSegment(
                'altura',
                T.enunciat.altura,
                fig,
                'altura',
                { base: 'BASE_ALTURA', esq: 'ALTURA_INCLINADA', dre: 'ALTURA_INCLINADA' },
                T.tex.altura
            ),
            pasNombre({
                id: 'calcul',
                enunciat: T.enunciat.calcul,
                simbol: 'A',
                sol: A,
                llista: [
                    [per(b, h), 'OBLIDA_MEITAT'],
                    [entre(per(b, c1), 2), 'ALTURA_INCLINADA'],
                    [entre(per(b, c2), 2), 'ALTURA_INCLINADA'],
                    [mes(b, c1, c2), 'AREA_PERIMETRE'],
                ],
                linia: `A = \\dfrac{${b} \\cdot ${h}}{2} = ${tx(A)}`,
            }),
            pasUnitat(u, 2, 'A', A),
        ],
    };
}

function paralelogram(u) {
    const [x, h, c] = pick(ternes(20));
    let b;
    do b = randInt(x + 3, x + 12);
    while (!diferents(b, c, h));
    const fig = figura({ base: b, costat: c, altura: h }, u);
    const A = per(b, h);
    return {
        ...fig,
        svg: svgParalelogram({ b, x, h, segments: fig.segments, u }),
        resultat: { area: A },
        passos: [
            pasTria(
                'formula',
                T.enunciat.formula,
                ['bh', T.formula.bh],
                [
                    ['bh2', T.formula.bh2, 'MEITAT_DE_MES'],
                    ['bc', T.formula.bc, 'ALTURA_INCLINADA'],
                    ['perimetre', T.formula.perimetre, 'AREA_PERIMETRE'],
                ],
                `A = ${T.tex.base} \\cdot ${T.tex.altura}`
            ),
            pasSegment(
                'base',
                T.enunciat.base,
                fig,
                'base',
                { altura: 'BASE_ALTURA', costat: 'BASE_COSTAT' },
                T.tex.base
            ),
            pasSegment(
                'altura',
                T.enunciat.altura,
                fig,
                'altura',
                { base: 'BASE_ALTURA', costat: 'ALTURA_INCLINADA' },
                T.tex.altura
            ),
            pasNombre({
                id: 'calcul',
                enunciat: T.enunciat.calcul,
                simbol: 'A',
                sol: A,
                llista: [
                    [per(b, c), 'ALTURA_INCLINADA'],
                    [entre(per(b, h), 2), 'MEITAT_DE_MES'],
                    [per(2, mes(b, c)), 'AREA_PERIMETRE'],
                ],
                linia: `A = ${b} \\cdot ${h} = ${tx(A)}`,
            }),
            pasUnitat(u, 2, 'A', A),
        ],
    };
}

function rombe(u) {
    const [p, q, c] = pick(TERNES.filter(t => t[2] <= 20));
    const [D, d] = [2 * q, 2 * p];
    const fig = figura({ gran: D, petita: d, costat: c }, u);
    const A = entre(per(D, d), 2);
    return {
        ...fig,
        svg: svgRombe({ D, d, segments: fig.segments, u }),
        resultat: { area: A },
        passos: [
            pasTria(
                'formula',
                T.enunciat.formula,
                ['Dd2', T.formula.Dd2],
                [
                    ['Dd', T.formula.Dd, 'OBLIDA_MEITAT'],
                    ['cc', T.formula.cc, 'COSTAT_DIAGONAL'],
                    ['c4', T.formula.c4, 'AREA_PERIMETRE'],
                ],
                `A = \\dfrac{${T.tex.D} \\cdot ${T.tex.d}}{2}`
            ),
            pasParell('diagonals', T.enunciat.diagonals, fig, ['gran', 'petita'], 'COSTAT_DIAGONAL', [
                T.tex.D,
                T.tex.d,
            ]),
            pasNombre({
                id: 'calcul',
                enunciat: T.enunciat.calcul,
                simbol: 'A',
                sol: A,
                llista: [
                    [per(D, d), 'OBLIDA_MEITAT'],
                    [per(c, c), 'COSTAT_DIAGONAL'],
                    [per(4, c), 'AREA_PERIMETRE'],
                    [entre(per(D, c), 2), 'COSTAT_DIAGONAL'],
                    [entre(per(d, c), 2), 'COSTAT_DIAGONAL'],
                ],
                linia: `A = \\dfrac{${D} \\cdot ${d}}{2} = ${tx(A)}`,
            }),
            pasUnitat(u, 2, 'A', A),
        ],
    };
}

function trapezi(u) {
    const [k, h, c] = pick(ternes(20));
    let b;
    do b = randInt(3, 12);
    while (!diferents(b + k, b, h, c));
    const B = b + k;
    const fig = figura({ gran: B, petita: b, altura: h, costat: c }, u);
    const A = entre(per(B + b, h), 2);
    return {
        ...fig,
        svg: svgTrapezi({ B, b, h, segments: fig.segments, u }),
        resultat: { area: A },
        passos: [
            pasTria(
                'formula',
                T.enunciat.formula,
                ['trapezi', T.formula.trapezi],
                [
                    ['trapeziSense', T.formula.trapeziSense, 'OBLIDA_MEITAT'],
                    ['trapeziUna', T.formula.trapeziUna, 'NOMES_UNA_BASE'],
                    ['quatre', T.formula.quatre, 'AREA_PERIMETRE'],
                ],
                `A = \\dfrac{(${T.tex.gran} + ${T.tex.petita}) \\cdot ${T.tex.altura}}{2}`
            ),
            pasParell('bases', T.enunciat.bases, fig, ['gran', 'petita'], 'BASES', [T.tex.gran, T.tex.petita]),
            pasSegment(
                'altura',
                T.enunciat.altura,
                fig,
                'altura',
                { costat: 'ALTURA_INCLINADA', gran: 'BASE_ALTURA', petita: 'BASE_ALTURA' },
                T.tex.altura
            ),
            pasNombre({
                id: 'calcul',
                enunciat: T.enunciat.calcul,
                simbol: 'A',
                sol: A,
                llista: [
                    [per(B + b, h), 'OBLIDA_MEITAT'],
                    [entre(per(B + b, c), 2), 'ALTURA_INCLINADA'],
                    [per(B, h), 'NOMES_UNA_BASE'],
                    [entre(per(B, h), 2), 'NOMES_UNA_BASE'],
                    [B + b + h + c, 'AREA_PERIMETRE'],
                ],
                linia: `A = \\dfrac{(${B} + ${b}) \\cdot ${h}}{2} = ${tx(A)}`,
            }),
            pasUnitat(u, 2, 'A', A),
        ],
    };
}

function cercle(u) {
    const r = randInt(2, 10);
    const d = 2 * r;
    const fig = figura({ diametre: d }, u);
    const A = per(PI_AV, r, r);
    return {
        ...fig,
        svg: svgCercle({ d, segments: fig.segments, u }),
        resultat: { area: A },
        passos: [
            pasTria(
                'formula',
                T.enunciat.formula,
                ['cercle', T.formula.cercle],
                [
                    ['circumferencia', T.formula.circumferencia, 'AREA_PERIMETRE'],
                    ['cercleD', T.formula.cercleD, 'RADI_DIAMETRE'],
                    ['circumferenciaD', T.formula.circumferenciaD, 'AREA_PERIMETRE'],
                ],
                `A = \\pi \\cdot ${T.tex.radi}^2`
            ),
            pasNombre({
                id: 'radi',
                enunciat: T.enunciat.radi,
                simbol: 'r',
                sol: r,
                llista: [
                    [d, 'RADI_DIAMETRE'],
                    [2 * d, 'RADI_DIAMETRE'],
                ],
                unitat: [u, 1],
                linia: `r = \\dfrac{${d}}{2} = ${r}`,
            }),
            pasNombre({
                id: 'calcul',
                enunciat: T.enunciat.calcul,
                simbol: 'A',
                sol: A,
                llista: [
                    [per(PI_AV, d, d), 'RADI_DIAMETRE'],
                    [per(2, PI_AV, r), 'AREA_PERIMETRE'],
                    [per(PI_AV, r), 'QUADRAT'],
                    [per(PI_AV, d), 'AREA_PERIMETRE'],
                ],
                linia: `A = ${PI_TEX} \\cdot ${r}^2 = ${tx(A)}`,
            }),
            pasUnitat(u, 2, 'A', A),
        ],
    };
}

// ── Figures compostes ────────────────────────────────────────────────────────
/**
 * Els passos d'una figura composta: com es calcula, les dues parts, el total i la unitat.
 * p1, p2: { part (clau de T.part), sol, llista, linia }; suma: si les parts se sumen (si no, es resten).
 */
function passosComposta(fig, p1, p2, suma, llistaTotal) {
    const [n1, s1] = T.part[p1.part];
    const [n2, s2] = T.part[p2.part];
    const total = suma ? mes(p1.sol, p2.sol) : menys(p1.sol, p2.sol);
    const signe = suma ? '+' : '-';
    const opcions = {
        suma: ['suma', T.estrategia.suma(n1, n2)],
        resta: ['resta', T.estrategia.resta(n1, n2)],
        multiplica: ['multiplica', T.estrategia.multiplica(n1, n2)],
    };
    const bona = suma ? 'suma' : 'resta';
    const part = (id, p, nom, s) =>
        pasNombre({
            id,
            nom: `${T.nomPas.calcul} ${nom}`,
            enunciat: T.enunciat.part(nom),
            simbol: sub(s),
            sol: p.sol,
            llista: p.llista,
            linia: `${sub(s)} = ${p.linia} = ${tx(p.sol)}`,
            nota: p.nota || '',
        });
    return {
        resultat: { area: total },
        passos: [
            pasTria(
                'estrategia',
                T.enunciat.estrategia,
                opcions[bona],
                ['suma', 'resta', 'multiplica'].filter(k => k !== bona).map(k => [...opcions[k], 'SUMA_RESTA']),
                `A = ${sub(s1)} ${signe} ${sub(s2)}`
            ),
            part('part1', p1, n1, s1),
            part('part2', p2, n2, s2),
            pasNombre({
                id: 'total',
                enunciat: T.enunciat.total,
                simbol: 'A',
                sol: total,
                llista: [[suma ? menys(p1.sol, p2.sol) : mes(p1.sol, p2.sol), 'SUMA_RESTA'], ...llistaTotal],
                linia: `A = ${tx(p1.sol)} ${signe} ${tx(p2.sol)} = ${tx(total)}`,
            }),
            pasUnitat(fig.u, 2, 'A', total),
        ],
    };
}

/** La part «rectangle» d'una figura composta (ample W i alt H). */
const partRectangle = (part, W, H) => ({
    part,
    sol: per(W, H),
    llista: [
        [per(2, W + H), 'AREA_PERIMETRE'],
        [W + H, 'AREA_PERIMETRE'],
    ],
    linia: `${W} \\cdot ${H}`,
});

function casa(u) {
    let W, A, Tt;
    do [W, A, Tt] = [randInt(4, 12), randInt(3, 9), randInt(2, 6)];
    while (!diferents(W, A, Tt));
    const fig = figura({ ample: W, alt: A, teulada: Tt }, u);
    const triangleSol = entre(per(W, Tt), 2);
    const rect = partRectangle('rectangle', W, A);
    return {
        ...fig,
        svg: svgCasa({ W, A, T: Tt, segments: fig.segments, u }),
        ...passosComposta(
            fig,
            rect,
            {
                part: 'triangle',
                sol: triangleSol,
                llista: [[per(W, Tt), 'OBLIDA_MEITAT']],
                linia: `\\dfrac{${W} \\cdot ${Tt}}{2}`,
            },
            true,
            [[mes(rect.sol, per(W, Tt)), 'OBLIDA_MEITAT']]
        ),
    };
}

function forat(u) {
    let W, A, r;
    do [W, A, r] = [randInt(8, 16), randInt(6, 12), randInt(1, 4)];
    while (!diferents(W, A, r) || 2 * r > Math.min(W, A) - 4);
    const fig = figura({ ample: W, alt: A, radi: r }, u);
    return {
        ...fig,
        svg: svgForat({ W, A, r, segments: fig.segments, u }),
        ...passosComposta(
            fig,
            partRectangle('rectangle', W, A),
            {
                part: 'cercle',
                sol: per(PI_AV, r, r),
                llista: [
                    [per(PI_AV, 2 * r, 2 * r), 'RADI_DIAMETRE'],
                    [per(2, PI_AV, r), 'AREA_PERIMETRE'],
                    [per(PI_AV, r), 'QUADRAT'],
                ],
                linia: `${PI_TEX} \\cdot ${r}^2`,
            },
            false,
            []
        ),
    };
}

function porta(u) {
    let r, A;
    do [r, A] = [randInt(2, 6), randInt(5, 14)];
    while (A === 2 * r);
    const W = 2 * r;
    const fig = figura({ ample: W, alt: A }, u);
    const rect = partRectangle('rectangle', W, A);
    const cercleSencer = per(PI_AV, r, r);
    return {
        ...fig,
        svg: svgPorta({ W, A, segments: fig.segments, u }),
        ...passosComposta(
            fig,
            rect,
            {
                part: 'semicercle',
                sol: entre(cercleSencer, 2),
                llista: [
                    [cercleSencer, 'OBLIDA_MEITAT'],
                    [entre(per(PI_AV, W, W), 2), 'RADI_DIAMETRE'],
                    [per(PI_AV, W, W), 'RADI_DIAMETRE'],
                    [per(PI_AV, r), 'AREA_PERIMETRE'],
                ],
                linia: `\\dfrac{${PI_TEX} \\cdot ${r}^2}{2}`,
            },
            true,
            [[mes(rect.sol, cercleSencer), 'OBLIDA_MEITAT']]
        ),
    };
}

function formaL(u) {
    let W, H, w, h;
    do {
        [W, H] = [randInt(6, 14), randInt(6, 14)];
        [w, h] = [randInt(2, W - 3), randInt(2, H - 3)];
    } while (!diferents(W, H, w, h));
    const fig = figura({ 'ample': W, 'alt': H, 'falta-ample': w, 'falta-alt': h }, u);
    return {
        ...fig,
        svg: svgL({ W, H, w, h, segments: fig.segments, u }),
        ...passosComposta(fig, partRectangle('gran', W, H), partRectangle('tros', w, h), false, []),
    };
}

// ── Cossos ───────────────────────────────────────────────────────────────────
/** Àrea de la base (amb la unitat escrita). */
const pasBase = (u, sol, llista, linia) =>
    pasNombre({ id: 'base3', enunciat: T.enunciat.base3, simbol: 'A_B', sol, llista, linia, unitat: [u, 2] });
/** Àrea lateral. */
const pasLateral = (u, sol, llista, linia, corba = false) =>
    pasNombre({
        id: 'lateral',
        enunciat: corba ? T.enunciat.lateralCorba : T.enunciat.lateral,
        simbol: 'A_L',
        sol,
        llista,
        linia,
        unitat: [u, 2],
    });
/** Àrea total: la lateral i les bases (dues o una). */
function pasTotal(u, AL, AB, bases) {
    const sol = mes(AL, per(bases, AB));
    return pasNombre({
        id: 'total3',
        enunciat: T.enunciat.total3,
        simbol: 'A_T',
        sol,
        llista:
            bases === 2
                ? [
                      [mes(AL, AB), 'OBLIDA_BASES'],
                      [AL, 'OBLIDA_BASES'],
                  ]
                : [
                      [mes(AL, per(2, AB)), 'DUES_BASES'],
                      [AL, 'OBLIDA_BASES'],
                  ],
        linia: `A_T = ${tx(AL)} + ${bases === 2 ? '2 \\cdot ' : ''}${tx(AB)} = ${tx(sol)}`,
        unitat: [u, 2],
    });
}
/** Volum (sense la unitat: es tria al pas següent). */
const pasVolum = (sol, llista, linia) =>
    pasNombre({ id: 'volum', enunciat: T.enunciat.volum, simbol: 'V', sol, llista, linia });

function ortoedre(u) {
    let a, b, c;
    do [a, b, c] = [randInt(2, 10), randInt(2, 8), randInt(2, 12)];
    while (!diferents(a, b, c));
    const fig = figura({ ample: a, fons: b, alt: c }, u);
    const AB = per(a, b);
    const AL = per(2, a + b, c);
    const AT = mes(AL, per(2, AB));
    const V = per(AB, c);
    return {
        ...fig,
        svg: svgOrtoedre({ a, b, c, segments: fig.segments, u }),
        resultat: { area: AT, volum: V },
        passos: [
            pasBase(u, AB, [[per(2, a + b), 'AREA_PERIMETRE']], `A_B = ${a} \\cdot ${b} = ${tx(AB)}`),
            pasLateral(
                u,
                AL,
                [
                    [per(a + b, c), 'CARES_LATERALS'],
                    [per(a, b, c), 'AREA_VOLUM'],
                ],
                `A_L = 2 \\cdot (${a} + ${b}) \\cdot ${c} = ${tx(AL)}`
            ),
            pasTotal(u, AL, AB, 2),
            pasVolum(
                V,
                [
                    [entre(V, 3), 'TERC_DE_MES'],
                    [AT, 'AREA_VOLUM'],
                ],
                `V = A_B \\cdot ${T.tex.altura} = ${tx(AB)} \\cdot ${c} = ${tx(V)}`
            ),
            pasUnitat(u, 3, 'V', V),
        ],
    };
}

function cilindre(u) {
    let r, h;
    do [r, h] = [randInt(1, 6), randInt(2, 12)];
    while (!diferents(r, h, 2 * r));
    const fig = figura({ radi: r, alt: h }, u);
    const AB = per(PI_AV, r, r);
    const AL = per(2, PI_AV, r, h);
    const AT = mes(AL, per(2, AB));
    const V = per(AB, h);
    return {
        ...fig,
        svg: svgCilindre({ r, h, segments: fig.segments, u }),
        resultat: { area: AT, volum: V },
        passos: [
            pasBase(
                u,
                AB,
                [
                    [per(2, PI_AV, r), 'AREA_PERIMETRE'],
                    [per(PI_AV, 2 * r, 2 * r), 'RADI_DIAMETRE'],
                    [per(PI_AV, r), 'QUADRAT'],
                ],
                `A_B = ${PI_TEX} \\cdot ${r}^2 = ${tx(AB)}`
            ),
            pasLateral(
                u,
                AL,
                [
                    [per(PI_AV, r, h), 'LONGITUD_CIRCUMFERENCIA'],
                    [per(2, PI_AV, 2 * r, h), 'RADI_DIAMETRE'],
                    [per(PI_AV, r, r, h), 'AREA_VOLUM'],
                ],
                `A_L = 2 \\cdot ${PI_TEX} \\cdot ${r} \\cdot ${h} = ${tx(AL)}`,
                true
            ),
            pasTotal(u, AL, AB, 2),
            pasVolum(
                V,
                [
                    [entre(V, 3), 'TERC_DE_MES'],
                    [per(PI_AV, 2 * r, 2 * r, h), 'RADI_DIAMETRE'],
                    [AL, 'AREA_VOLUM'],
                ],
                `V = A_B \\cdot ${T.tex.altura} = ${tx(AB)} \\cdot ${h} = ${tx(V)}`
            ),
            pasUnitat(u, 3, 'V', V),
        ],
    };
}

function piramide(u) {
    const [p, h, ap] = pick(ternes(15));
    const b = 2 * p;
    const fig = figura({ base: b, altura: h, apotema: ap }, u);
    const AB = per(b, b);
    const AL = per(4, entre(per(b, ap), 2));
    const AT = mes(AL, AB);
    const V = entre(per(AB, h), 3);
    return {
        ...fig,
        svg: svgPiramide({ b, h, segments: fig.segments, u }),
        resultat: { area: AT, volum: V },
        passos: [
            pasSegment(
                'altura',
                T.enunciat.alturaCos(T.figura.piramide[0]),
                fig,
                'altura',
                { apotema: 'APOTEMA_ALTURA', base: 'BASE_ALTURA' },
                T.tex.altura
            ),
            pasBase(
                u,
                AB,
                [
                    [per(4, b), 'AREA_PERIMETRE'],
                    [per(2, b), 'QUADRAT'],
                ],
                `A_B = ${b}^2 = ${tx(AB)}`
            ),
            pasLateral(
                u,
                AL,
                [
                    [per(4, entre(per(b, h), 2)), 'LATERAL_AMB_ALTURA'],
                    [per(4, b, ap), 'OBLIDA_MEITAT'],
                    [entre(per(b, ap), 2), 'CARES_LATERALS'],
                ],
                `A_L = 4 \\cdot \\dfrac{${b} \\cdot ${ap}}{2} = ${tx(AL)}`
            ),
            pasTotal(u, AL, AB, 1),
            pasVolum(
                V,
                [
                    [per(AB, h), 'OBLIDA_TERC'],
                    [entre(per(AB, ap), 3), 'APOTEMA_ALTURA'],
                    [AT, 'AREA_VOLUM'],
                ],
                `V = \\dfrac{A_B \\cdot ${T.tex.altura}}{3} = \\dfrac{${tx(AB)} \\cdot ${h}}{3} = ${tx(V)}`
            ),
            pasUnitat(u, 3, 'V', V),
        ],
    };
}

function con(u) {
    const [r, h, g] = pick(ternes(15));
    const fig = figura({ radi: r, altura: h, generatriu: g }, u);
    const AB = per(PI_AV, r, r);
    const AL = per(PI_AV, r, g);
    const AT = mes(AL, AB);
    const V = entre(per(AB, h), 3);
    return {
        ...fig,
        svg: svgCon({ r, h, segments: fig.segments, u }),
        resultat: { area: AT, volum: V },
        passos: [
            pasSegment(
                'altura',
                T.enunciat.alturaCos(T.figura.con[0]),
                fig,
                'altura',
                { generatriu: 'APOTEMA_ALTURA', radi: 'BASE_ALTURA' },
                T.tex.altura
            ),
            pasBase(
                u,
                AB,
                [
                    [per(2, PI_AV, r), 'AREA_PERIMETRE'],
                    [per(PI_AV, 2 * r, 2 * r), 'RADI_DIAMETRE'],
                    [per(PI_AV, r), 'QUADRAT'],
                ],
                `A_B = ${PI_TEX} \\cdot ${r}^2 = ${tx(AB)}`
            ),
            pasLateral(
                u,
                AL,
                [
                    [per(PI_AV, r, h), 'LATERAL_AMB_ALTURA'],
                    [per(2, PI_AV, r, g), 'LATERAL_CON'],
                ],
                `A_L = ${PI_TEX} \\cdot ${r} \\cdot ${g} = ${tx(AL)}`,
                true
            ),
            pasTotal(u, AL, AB, 1),
            pasVolum(
                V,
                [
                    [per(AB, h), 'OBLIDA_TERC'],
                    [entre(per(AB, g), 3), 'APOTEMA_ALTURA'],
                    [AT, 'AREA_VOLUM'],
                ],
                `V = \\dfrac{A_B \\cdot ${T.tex.altura}}{3} = \\dfrac{${tx(AB)} \\cdot ${h}}{3} = ${tx(V)}`
            ),
            pasUnitat(u, 3, 'V', V),
        ],
    };
}

function esfera(u) {
    const r = pick([6, 9, 12]);
    const fig = figura({ radi: r }, u);
    const A = per(4, PI_AV, r, r);
    const V = entre(per(4, PI_AV, r, r, r), 3);
    return {
        ...fig,
        svg: svgEsfera({ r, segments: fig.segments, u }),
        resultat: { area: A, volum: V },
        passos: [
            pasNombre({
                id: 'area',
                enunciat: T.enunciat.areaEsfera,
                simbol: 'A',
                sol: A,
                llista: [
                    [per(PI_AV, r, r), 'ESFERA'],
                    [per(4, PI_AV, 2 * r, 2 * r), 'RADI_DIAMETRE'],
                    [per(2, PI_AV, r), 'AREA_PERIMETRE'],
                    [per(4, PI_AV, r), 'QUADRAT'],
                ],
                linia: `A = 4 \\cdot ${PI_TEX} \\cdot ${r}^2 = ${tx(A)}`,
                unitat: [u, 2],
            }),
            pasTria(
                'formulaVolum',
                T.enunciat.formulaVolum,
                ['esfera', T.formula.esfera],
                [
                    ['esferaSense', T.formula.esferaSense, 'OBLIDA_TERC'],
                    ['esferaArea', T.formula.esferaArea, 'AREA_VOLUM'],
                    ['esferaD', T.formula.esferaD, 'RADI_DIAMETRE'],
                ],
                `V = \\dfrac{4 \\cdot \\pi \\cdot ${T.tex.radi}^3}{3}`
            ),
            pasVolum(
                V,
                [
                    [per(4, PI_AV, r, r, r), 'OBLIDA_TERC'],
                    [entre(per(PI_AV, r, r, r), 3), 'ESFERA'],
                    [A, 'AREA_VOLUM'],
                    [entre(per(4, PI_AV, 2 * r, 2 * r, 2 * r), 3), 'RADI_DIAMETRE'],
                ],
                `V = \\dfrac{4 \\cdot ${PI_TEX} \\cdot ${r}^3}{3} = ${tx(V)}`
            ),
            pasUnitat(u, 3, 'V', V),
        ],
    };
}

const GENERADORS = {
    triangle,
    paralelogram,
    rombe,
    trapezi,
    cercle,
    casa,
    forat,
    porta,
    L: formaL,
    ortoedre,
    cilindre,
    piramide,
    con,
    esfera,
};

/** Una pregunta nova de la figura (una clau de GENERADORS: vegeu figuraAV). */
export function generaPreguntaAV(nomFigura) {
    const u = pick(UNITATS);
    const fig = GENERADORS[nomFigura](u);
    const [nom, curt] = T.figura[nomFigura];
    const pi = AMB_PI.includes(nomFigura);
    const enunciat =
        nomFigura === 'esfera'
            ? T.enunciat.esfera
            : COSSOS_AV.includes(nomFigura)
              ? T.enunciat.cos(nom, pi)
              : T.enunciat.area(nom, pi);
    const mesures = Object.values(fig.segments)
        .sort((x, y) => x.lletra.localeCompare(y.lletra))
        .map(s => `${s.lletra} = ${s.valor} ${u}`)
        .join(', ');
    return {
        tex: '',
        enunciat,
        svg: fig.svg,
        text: `${curt}: ${mesures}`,
        clau: `${nomFigura} ${mesures}`,
        passos: fig.passos,
        dades: { figura: nomFigura, u, valors: fig.valors, ...fig.resultat },
    };
}

/** La resposta escrita, per a l'historial: el nombre amb coma (i la unitat), o el text de l'opció triada. */
export function textRespostaAV(pas, valors) {
    if (pas.camps.r === 'decimal') return `${tt(valors.r)}${pas.dades.unitat ? ` ${pas.dades.unitat}` : ''}`;
    const opcio = pas.opcions.find(([valor]) => valor === valors.tria);
    return opcio ? opcio[1] : String(valors.tria);
}
