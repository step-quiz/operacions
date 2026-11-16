/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/canvi-unitats/math-engine.js
 * ROL: La matemàtica de «Canvi d'unitats» (canvi-unitats.html): genera els canvis,
 *      els seus passos i, per a cada pas, els valors que donen els errors típics.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar). Els nombres són
 *      coeficients exactes (un enter o una fracció [n, d] de denominador 10ⁿ:
 *      js/algebra/racionals.js). Joc comú (js/passos/joc-passos.js), correcció comuna
 *      (js/passos/correccio.js) i escala comuna (js/passos/escala-unitats.js).
 *
 *   NOMÉS L'ESCALA (decisió del David, 14 i 16/11/2026): longitud, massa, capacitat
 *   (cada graó × 10), superfície (× 100) i volum (× 1000), i volum ↔ capacitat
 *   (1 m³ = 1 kl, 1 dm³ = 1 l, 1 cm³ = 1 ml). Ni temps ni unitats compostes.
 *   PASSOS     salts       quants graons hi ha de la unitat de partida a la d'arribada,
 *                          i cap on (tria)
 *              operacio    multiplicar o dividir, i per quant (tria)
 *              resultat    el nombre, amb coma decimal (decimal)
 *              (volum ↔ capacitat: abans, equivalencia, a quina unitat de volum
 *              equival la de capacitat; els graons són els de l'escala del volum)
 *   NIVELLS    1 longitud, massa i capacitat · 2 superfície i volum · 3 volum ↔
 *              capacitat i de tot. Com més nivell, més graons i més decimals.
 *   ?magnitud= '' segons el nivell · longitud · massa · capacitat · superficie · volum ·
 *              volum-capacitat
 *
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, passos/escala-unitats.js i strings.js.
 * ============================================================================
 */

import { pick, randInt } from '../utils.js';
import {
    coeficient,
    coefsIguals,
    comRacional,
    producteCoef,
    quocientCoef,
    signeCoef,
    texDecimal,
    textDecimal,
} from '../algebra/racionals.js';
import { svgEscalaUnitats } from '../passos/escala-unitats.js';
import { TEXTOS_CU } from './strings.js';

/** Les escales: les unitats de la més gran a la més petita i l'exponent (cada graó val 10^exponent). */
export const ESCALES_CU = {
    longitud: { unitats: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], exponent: 1 },
    massa: { unitats: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'], exponent: 1 },
    capacitat: { unitats: ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'], exponent: 1 },
    superficie: { unitats: ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'], exponent: 2 },
    // Del volum, a l'escola es fan servir del dam³ al mm³ (els dos primers graons es veuen, però no surten)
    volum: { unitats: ['km³', 'hm³', 'dam³', 'm³', 'dm³', 'cm³', 'mm³'], exponent: 3, primera: 2 },
};

/** Volum ↔ capacitat: cada unitat de capacitat i la posició de la de volum que hi equival. */
export const EQUIVALENCIES_CU = { kl: 3, l: 4, ml: 5 };

export const MAGNITUDS_CU = {
    '': null,
    'longitud': 'longitud',
    'massa': 'massa',
    'capacitat': 'capacitat',
    'superficie': 'superficie',
    'volum': 'volum',
    'volum-capacitat': 'volum-capacitat',
};

/** La magnitud d'un canvi: la de ?magnitud= o, si no n'hi ha, la que toca al nivell. */
export function magnitudCU(opcio, nivell) {
    if (MAGNITUDS_CU[opcio]) return MAGNITUDS_CU[opcio];
    if (nivell === 1) return pick(['longitud', 'massa', 'capacitat']);
    if (nivell === 2) return pick(['superficie', 'volum']);
    return pick([
        'volum-capacitat',
        'volum-capacitat',
        'superficie',
        'volum',
        pick(['longitud', 'massa', 'capacitat']),
    ]);
}

// Graons màxims, per nivell i per exponent de l'escala (× 10, × 100, × 1000)
const MAX_SALTS = { 1: [3, 2, 1], 2: [4, 3, 2], 3: [6, 3, 2] };
const MAX_DECIMALS = 6; // del resultat
const MAX_RESULTAT = 1e9;
// Caràcters de la casella del resultat (el joc de passos en posa 6 per defecte): 9 xifres enteres o 0,000001
const LLARG_RESULTAT = 11;

// ── Nombres i escriptura ─────────────────────────────────────────────────────
const potencia = e => 10 ** e;
const per = (x, f) => producteCoef(x, f);
const entre = (x, f) => quocientCoef(x, f);
/** Quants decimals té un coeficient de decimals exactes (el seu denominador divideix una potència de 10). */
function decimals(x) {
    const d = comRacional(x)[1];
    let t = 0;
    while (potencia(t) % d !== 0) t++;
    return t;
}
// La part entera d'un nombre de 5 xifres o més, en grups de 3 separats per un espai fi (1 000 000)
const agrupa = (escrit, separador) =>
    escrit.replace(/^\d{5,}/, enter => enter.replace(/\B(?=(\d{3})+(?!\d))/g, separador));
const tx = x => agrupa(texDecimal(x), '\\,');
const ESPAI_FI = String.fromCharCode(0x202f); // l'espai fi que no es trenca, entre grups de xifres
const tt = x => agrupa(textDecimal(x), ESPAI_FI);
/** Una unitat en TeX: «km²» → \text{km}^{2}. */
export const texUnitat = u => {
    const m = u.match(/^([a-zA-Z]+)([²³]?)$/);
    return `\\text{${m[1]}}${m[2] ? `^{${m[2] === '²' ? 2 : 3}}` : ''}`;
};

/** Un valor de partida segons el nivell: un enter o un decimal curt. */
function valorCU(nivell) {
    if (nivell === 1) return randInt(0, 1) ? randInt(1, 99) : coeficient(randInt(11, 999), 10);
    const d = randInt(0, 2);
    return coeficient(randInt(1, d === 0 ? 999 : 9999), potencia(d));
}

/** Els valors equivocats d'un camp decimal: sense el bo, sense repetits i positius. */
function netsCU(sol, llista) {
    const nets = [];
    for (const [valor, errorType] of llista) {
        if (signeCoef(valor) <= 0 || coefsIguals(valor, sol) || nets.some(([v]) => coefsIguals(v, valor))) continue;
        nets.push([valor, errorType]);
    }
    return nets;
}

// ── Els passos ───────────────────────────────────────────────────────────────
const claveSalts = (k, avall) => `${k}-${avall ? 'avall' : 'amunt'}`;
const claveOperacio = (multiplica, f) => `${multiplica ? 'x' : 'd'}${f}`;

/**
 * Les opcions d'un pas d'escollir (la bona i, com a molt, 3 de dolentes, per ordre de preferència), sense
 * repetits i ordenades: { opcions: [[valor, text]], distractors: [[valor, error]] }.
 */
function ambOpcions(bona, dolentes, ordre) {
    const vistes = new Set([bona[0]]);
    const totes = [bona];
    for (const d of dolentes) {
        if (vistes.has(d[0]) || totes.length >= 4) continue;
        vistes.add(d[0]);
        totes.push(d);
    }
    totes.sort(ordre);
    return {
        opcions: totes.map(([valor, text]) => [valor, text]),
        distractors: totes.filter(([valor]) => valor !== bona[0]).map(([valor, , error]) => [valor, error]),
    };
}

/** Pas 1: quants graons i cap on (k graons; avall: cap a la unitat més petita). */
function pasSalts(de, a, k, avall) {
    const opcio = (n, av, error) => [claveSalts(n, av), TEXTOS_CU.salts(n, av), error, n, av];
    const { opcions, distractors } = ambOpcions(
        opcio(k, avall),
        [
            opcio(k, !avall, 'SENTIT'),
            opcio(k + 1, avall, 'COMPTA_UNITATS'),
            k > 1 ? opcio(k - 1, avall, 'SALTS') : opcio(k + 1, !avall, 'SENTIT'),
        ],
        (x, y) => x[3] - y[3] || Number(y[4]) - Number(x[4])
    );
    return {
        id: 'salts',
        mena: 'salts',
        nom: TEXTOS_CU.nomPas.salts,
        enunciat: TEXTOS_CU.enunciat.salts(de, a),
        plantilla: [],
        camps: { tria: 'tria' },
        opcions,
        solucio: { tria: claveSalts(k, avall) },
        dades: { distractors: { tria: distractors }, k, avall },
        linia: `${texUnitat(de)} \\;\\longrightarrow\\; ${texUnitat(a)}:\\ \\text{${TEXTOS_CU.salts(k, avall)}}`,
    };
}

/** Pas 2: multiplicar (avall) o dividir (amunt) per factorGrao^k. */
function pasOperacio(de, a, k, avall, exponent) {
    const f = potencia(exponent * k);
    const opcio = (mult, factor, error) => [
        claveOperacio(mult, factor),
        TEXTOS_CU.operacio(mult, tt(factor)),
        error,
        mult,
        factor,
    ];
    const dolentes = [opcio(!avall, f, 'SENTIT')];
    if (exponent > 1) dolentes.push(opcio(avall, potencia(k), 'DEU_PER_GRAO'));
    dolentes.push(opcio(avall, potencia(exponent * (k + 1)), 'COMPTA_UNITATS'));
    if (k > 1) dolentes.push(opcio(avall, potencia(exponent * (k - 1)), 'SALTS'));
    dolentes.push(opcio(!avall, potencia(exponent * (k + 1)), 'SENTIT'));
    const { opcions, distractors } = ambOpcions(
        opcio(avall, f),
        dolentes,
        (x, y) => Number(y[3]) - Number(x[3]) || x[4] - y[4]
    );
    return {
        id: 'operacio',
        mena: 'operacio',
        nom: TEXTOS_CU.nomPas.operacio,
        enunciat: TEXTOS_CU.enunciat.operacio(de, a),
        plantilla: [],
        camps: { tria: 'tria' },
        opcions,
        solucio: { tria: claveOperacio(avall, f) },
        dades: { distractors: { tria: distractors }, factor: f, multiplica: avall },
        linia: `${avall ? '\\times' : ':'}\\ ${tx(f)}`,
    };
}

/** Pas 3: el resultat (v en la unitat «de» → r en la unitat «a»). */
function pasResultat({ v, r, de, a, k, avall, exponent, equivalencia }) {
    const op = (x, mult, f) => (mult ? per(x, f) : entre(x, f));
    const llista = [
        [op(v, !avall, potencia(exponent * k)), 'SENTIT'],
        [per(r, 10), 'COMA'],
        [entre(r, 10), 'COMA'],
        [op(v, avall, potencia(exponent * (k + 1))), 'COMPTA_UNITATS'],
    ];
    if (exponent > 1) llista.push([op(v, avall, potencia(k)), 'DEU_PER_GRAO']);
    if (equivalencia) llista.push([per(r, 1000), 'EQUIVALENCIA'], [entre(r, 1000), 'EQUIVALENCIA']);
    return {
        id: 'resultat',
        mena: 'resultat',
        nom: TEXTOS_CU.nomPas.resultat,
        enunciat: TEXTOS_CU.enunciat.resultat,
        plantilla: [
            { tex: `${tx(v)}\\ ${texUnitat(de)} =` },
            { camp: 'r', llarg: LLARG_RESULTAT },
            { tex: `\\ ${texUnitat(a)}` },
        ],
        camps: { r: 'decimal' },
        solucio: { r },
        dades: { distractors: { r: netsCU(r, llista) }, unitat: a },
        nota: TEXTOS_CU.nota.resultat,
        linia: `${tx(v)}\\ ${texUnitat(de)} = ${tx(r)}\\ ${texUnitat(a)}`,
    };
}

/** Pas 0 de volum ↔ capacitat: a quina unitat de volum equival la de capacitat c. */
function pasEquivalencia(c) {
    const vol = ESCALES_CU.volum.unitats;
    const bona = vol[EQUIVALENCIES_CU[c]];
    const opcions = ['m³', 'dm³', 'cm³', 'mm³'].map(u => [u, `1 ${u}`]);
    return {
        id: 'equivalencia',
        mena: 'equivalencia',
        nom: TEXTOS_CU.nomPas.equivalencia,
        enunciat: TEXTOS_CU.enunciat.equivalencia(c),
        plantilla: [],
        camps: { tria: 'tria' },
        opcions,
        solucio: { tria: bona },
        dades: { distractors: { tria: opcions.filter(([u]) => u !== bona).map(([u]) => [u, 'EQUIVALENCIA']) } },
        linia: `1\\ ${texUnitat(c)} = 1\\ ${texUnitat(bona)}`,
    };
}

// ── Els canvis ───────────────────────────────────────────────────────────────
/** Unes unitats de partida i d'arribada d'una escala, amb 1 a max graons entre elles: [i, j]. */
function parellUnitats(escala, max, fixa = -1) {
    const primera = escala.primera || 0;
    const n = escala.unitats.length;
    for (;;) {
        const i = fixa >= 0 ? fixa : randInt(primera, n - 1);
        const j = randInt(primera, n - 1);
        const k = Math.abs(i - j);
        if (k >= 1 && k <= max) return [i, j];
    }
}

/** Un valor i el resultat que surten bé (pocs decimals, no massa grans): { v, r }. */
function valorsCU(nivell, k, avall, exponent) {
    const f = potencia(exponent * k);
    for (;;) {
        const v = valorCU(nivell);
        const r = avall ? per(v, f) : entre(v, f);
        const [n, d] = comRacional(r);
        if (decimals(r) <= MAX_DECIMALS && n / d < MAX_RESULTAT) return { v, r };
    }
}

/** Un canvi dins d'una escala (longitud, massa, capacitat, superfície o volum). */
function canviEscala(magnitud, nivell) {
    const escala = ESCALES_CU[magnitud];
    const max = MAX_SALTS[nivell][escala.exponent - 1];
    const [i, j] = parellUnitats(escala, max);
    const [de, a] = [escala.unitats[i], escala.unitats[j]];
    const k = Math.abs(i - j);
    const avall = j > i;
    const { v, r } = valorsCU(nivell, k, avall, escala.exponent);
    return {
        tex: `${tx(v)}\\ ${texUnitat(de)} = \\;?\\ ${texUnitat(a)}`,
        text: `${tt(v)} ${de} = ? ${a}`,
        clau: `${textDecimal(v)} ${de} ${a}`,
        svg: svgEscalaUnitats({
            unitats: escala.unitats,
            factor: potencia(escala.exponent),
            origen: i,
            desti: j,
            nom: TEXTOS_CU.magnitud[magnitud],
        }),
        passos: [
            pasSalts(de, a, k, avall),
            pasOperacio(de, a, k, avall, escala.exponent),
            pasResultat({ v, r, de, a, k, avall, exponent: escala.exponent }),
        ],
        dades: { magnitud, v, r, de, a },
    };
}

/** Volum ↔ capacitat: de volum a capacitat o al revés, passant per la unitat de volum equivalent. */
function canviVolumCapacitat(nivell) {
    const escala = ESCALES_CU.volum;
    const c = pick(Object.keys(EQUIVALENCIES_CU));
    const pont = EQUIVALENCIES_CU[c];
    const max = MAX_SALTS[nivell][2];
    const [, u] = parellUnitats(escala, max, pont); // la unitat de volum, a 1 o més graons del pont
    const capVol = randInt(0, 1) === 1; // de capacitat a volum
    const [i, j] = capVol ? [pont, u] : [u, pont];
    const k = Math.abs(i - j);
    const avall = j > i;
    const [deVol, aVol] = [escala.unitats[i], escala.unitats[j]];
    const { v, r } = valorsCU(nivell, k, avall, 3);
    const [de, a] = capVol ? [c, aVol] : [deVol, c];
    return {
        tex: `${tx(v)}\\ ${texUnitat(de)} = \\;?\\ ${texUnitat(a)}`,
        text: `${tt(v)} ${de} = ? ${a}`,
        clau: `${textDecimal(v)} ${de} ${a}`,
        svg: svgEscalaUnitats({
            unitats: escala.unitats,
            factor: 1000,
            origen: capVol ? -1 : u,
            desti: capVol ? u : -1,
            nom: TEXTOS_CU.magnitud.volum,
        }),
        passos: [
            pasEquivalencia(c),
            pasSalts(deVol, aVol, k, avall),
            pasOperacio(deVol, aVol, k, avall, 3),
            pasResultat({ v, r, de, a, k, avall, exponent: 3, equivalencia: true }),
        ],
        dades: { magnitud: 'volum-capacitat', v, r, de, a },
    };
}

/** Una pregunta nova de la magnitud i el nivell (1-3). */
export function generaPreguntaCU(magnitud, nivell) {
    const n = [1, 2, 3].includes(nivell) ? nivell : 1;
    return magnitud === 'volum-capacitat' ? canviVolumCapacitat(n) : canviEscala(magnitud, n);
}

/** La resposta escrita, per a l'historial: el nombre amb coma i la unitat, o el text de l'opció triada. */
export function textRespostaCU(pas, valors) {
    if (pas.camps.r === 'decimal') return `${tt(valors.r)} ${pas.dades.unitat}`;
    const opcio = pas.opcions.find(([valor]) => valor === valors.tria);
    return opcio ? opcio[1] : String(valors.tria);
}
