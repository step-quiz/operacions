/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafics-estadistics/math-engine.js
 * ROL: Motor de «Gràfics estadístics» (grafics-estadistics.html): les dades, el
 *      gràfic i la pregunta, amb els distractors de cada error típic (errors.js).
 *      Cada pregunta és un sol pas del joc de passos comú: una casella (decimal) o
 *      unes opcions (tria).
 * ARQUITECTURA: mòdul pur (els gràfics, de js/passos/grafic-estadistic.js).
 *   FAMÍLIES (?grafics=): barres · sectors · pictogrames · histogrames (i polígons),
 *     o els grups de GRAFICS_GE ('' totes, '1r-2n', '3r-4t'). La sessió les alterna.
 *   NIVELLS (els tipus de cada família, a TIPUS_GE):
 *     1  llegir un valor, comparar (diferència), total; sectors: el percentatge que falta
 *     2  + percentatge, moda i mediana (variable numèrica), afirmacions certes, interval
 *        modal i marca de classe, «menys de», persones a partir del percentatge, graus
 *     3  + gràfics que enganyen: eix tallat, escala irregular, pictograma que creix en àrea
 *   DADES: les variables numèriques (discretes i agrupades) surten dels generadors de
 *     js/estadistica/question-bank.js (les mateixes distribucions realistes), ajuntant-ne
 *     mostres fins a la mida que cal; les categòriques (esport, transport…), d'aquí.
 *     Els valors de les barres són múltiples de l'escala (es poden llegir exactament) i
 *     l'escala no va d'1 en 1 (cal mirar-la).
 *   PREGUNTES (?preguntes=): '' segons el nivell, o un grup de PREGUNTES_GE (llegir ·
 *     calcular · afirmacions · enganys): només aquests tipus, de tots els nivells, i
 *     només les famílies que en tenen.
 *   generaPreguntaGE({ grafics, preguntes, nivell, index, opcions }) → { text, clau, enunciat, svg, passos: [pas] }
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, passos/grafic-estadistic.js,
 *   estadistica/question-bank.js.
 * ============================================================================
 */

import { pick, randInt, shuffle } from '../utils.js';
import { racional } from '../algebra/racionals.js';
import {
    svgBarres,
    svgHistograma,
    svgPictograma,
    svgPictogramaArea,
    svgSectors,
    pasNet,
    textNombre,
} from '../passos/grafic-estadistic.js';
import { QuestionBank } from '../estadistica/question-bank.js';
import { TEXTOS_GE } from './strings.js';

// ── Opcions ──────────────────────────────────────────────────────────────────
export const GRAFICS_GE = {
    '': ['barres', 'sectors', 'pictogrames', 'histogrames'],
    '1r-2n': ['barres', 'sectors', 'pictogrames'],
    '3r-4t': ['barres', 'sectors', 'histogrames'],
    'barres': ['barres'],
    'sectors': ['sectors'],
    'pictogrames': ['pictogrames'],
    'histogrames': ['histogrames'],
};

/** Els tipus de pregunta de cada família, per nivell (cada nivell inclou els d'abans). */
export const TIPUS_GE = {
    barres: {
        1: ['lectura', 'diferencia', 'total'],
        2: ['percentatge', 'afirmacions', 'moda', 'mediana', 'freq'],
        3: ['eix-tallat', 'escala-irregular'],
    },
    sectors: { 1: ['falta'], 2: ['persones', 'angle', 'afirmacions-sectors'], 3: [] },
    pictogrames: { 1: ['icones', 'icones-total', 'icones-diferencia'], 2: [], 3: ['area'] },
    histogrames: { 1: ['interval'], 2: ['menys', 'percentatge-hist', 'marca', 'modal'], 3: [] },
};
/** Els que enganyen: al nivell 3 en surt un de cada 2 preguntes (si la família en té). */
const ENGANYS = ['eix-tallat', 'escala-irregular', 'area'];

/** Els grups de preguntes que es poden triar a l'índex (?preguntes=). */
export const PREGUNTES_GE = {
    llegir: [
        'lectura',
        'diferencia',
        'total',
        'freq',
        'falta',
        'icones',
        'icones-total',
        'icones-diferencia',
        'interval',
    ],
    calcular: ['percentatge', 'moda', 'mediana', 'persones', 'angle', 'menys', 'percentatge-hist', 'marca', 'modal'],
    afirmacions: ['afirmacions', 'afirmacions-sectors'],
    enganys: ENGANYS,
};
const totsTipus = familia => [1, 2, 3].flatMap(n => TIPUS_GE[familia][n]);
const delGrup = (familia, preguntes) => totsTipus(familia).filter(t => (PREGUNTES_GE[preguntes] || []).includes(t));

export function familiaGE(grafics, index, preguntes = '') {
    const llista = GRAFICS_GE[grafics] || GRAFICS_GE[''];
    // Amb un grup de preguntes, només les famílies que en tenen (si no en té cap, totes)
    const amb = llista.filter(f => delGrup(f, preguntes).length);
    const ll = amb.length ? amb : llista;
    return ll[index % ll.length];
}

export function tipusGE(familia, nivell, preguntes = '') {
    const grup = delGrup(familia, preguntes);
    if (grup.length) return pick(grup);
    const t = TIPUS_GE[familia];
    const normals = [1, 2].filter(n => n <= nivell).flatMap(n => t[n]);
    const enganys = nivell >= 3 ? t[3] : [];
    return enganys.length && Math.random() < 0.5 ? pick(enganys) : pick(normals);
}

// ── Ajudes ───────────────────────────────────────────────────────────────────
/** Un nombre (enter o amb pocs decimals) com a racional. */
export function rac(x) {
    let d = 1;
    while (!Number.isInteger(Math.round(x * d * 1e6) / 1e6) && d < 1e4) d *= 10;
    return racional(Math.round(x * d), d);
}
const texN = v => textNombre(v).replace(',', '{,}');
const texT = t => `\\text{${String(t).replace(/%/g, '\\%')}}`;
const suma = a => a.reduce((x, y) => x + y, 0);
/** n valors diferents d'1 a max (sense ordre). */
const diferents = (n, max) => shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, n);

/** Distractors útils: ni la solució, ni repetits, ni valors no finits o negatius. */
export function netsGE(sol, llista) {
    const vist = new Set([String(sol)]);
    return llista.filter(([v]) => {
        if (typeof v === 'number' && (!Number.isFinite(v) || v < 0)) return false;
        const k = String(v);
        if (vist.has(k)) return false;
        vist.add(k);
        return true;
    });
}

/** Un pas d'una casella (decimal): solucio i distractors en nombres. */
function pasNombre(id, enunciat, sol, distractors, linia, unitat = '') {
    return {
        id,
        mena: id,
        nom: TEXTOS_GE.noms[id],
        enunciat,
        plantilla: [{ camp: 'r' }, ...(unitat ? [{ tex: `\\;${texT(unitat)}` }] : [])],
        camps: { r: 'decimal' },
        solucio: { r: rac(sol) },
        dades: {
            distractors: { r: netsGE(sol, distractors).map(([v, e]) => [Array.isArray(v) ? v : rac(v), e]) },
            sol,
        },
        linia,
    };
}

/** Un pas d'opcions: una certa (cert) i les falses [text, error]; n opcions com a molt. */
function pasTria(id, enunciat, cert, falses, n) {
    const triades = shuffle(falses.slice()).slice(0, Math.max(1, n - 1));
    const opcions = shuffle([['cert', cert], ...triades.map(([t], i) => [`f${i}`, t])]);
    return {
        id,
        mena: id,
        nom: TEXTOS_GE.noms[id],
        enunciat,
        plantilla: [],
        camps: { tria: 'tria' },
        opcions,
        solucio: { tria: 'cert' },
        dades: { distractors: { tria: triades.map(([, e], i) => [`f${i}`, e]) } },
        linia: texT(cert.replace(/[«»]/g, '')),
    };
}

// ── Dades categòriques ───────────────────────────────────────────────────────
const CONTEXTOS = [
    {
        titol: 'Esport preferit',
        categories: ['Futbol', 'Bàsquet', 'Natació', 'Handbol', 'Tennis'],
        pregunta: 'quin és el teu esport preferit?',
    },
    {
        titol: "Com arriben a l'institut",
        categories: ['A peu', 'Bicicleta', 'Autobús', 'Cotxe', 'Metro'],
        pregunta: "com véns a l'institut?",
    },
    {
        titol: 'Fruita preferida',
        categories: ['Poma', 'Plàtan', 'Taronja', 'Maduixa', 'Préssec'],
        pregunta: 'quina és la teva fruita preferida?',
    },
    { titol: 'Mascota', categories: ['Gos', 'Gat', 'Peix', 'Ocell', 'Cap'], pregunta: 'quina mascota tens a casa?' },
    {
        titol: 'Música preferida',
        categories: ['Pop', 'Rock', 'Rap', 'Clàssica', 'Reggaeton'],
        pregunta: 'quina música escoltes més?',
    },
    {
        titol: 'Cap de setmana',
        categories: ['Esport', 'Lectura', 'Videojocs', 'Cinema', 'Música'],
        pregunta: 'què fas més el cap de setmana?',
    },
];

/** k categories d'un context, valors diferents i múltiples de pas. */
function categoriques(k, pas, maxUnitats = 8) {
    const ctx = pick(CONTEXTOS);
    const categories = ctx.categories.slice(0, k);
    const unitats = diferents(k, maxUnitats);
    return { ctx, categories, unitats, valors: unitats.map(u => u * pas), pas };
}
const enquesta = ctx =>
    `Enquesta a uns quants grups de l'institut: «${ctx.pregunta}» Cada alumne tria una sola resposta.`;

// ── BARRES (variable categòrica) ─────────────────────────────────────────────
function barresCategoriques(tipus, nivell, n) {
    const pas = nivell === 1 ? pick([2, 5]) : pick([2, 5, 10]);
    let d = categoriques(pick([4, 5]), pas);
    // Per al percentatge, el total ha de deixar un percentatge enter per a alguna categoria
    if (tipus === 'percentatge') {
        const bo = x => x.valors.some(v => (100 * v) % suma(x.valors) === 0 && (100 * v) / suma(x.valors) !== v);
        for (let i = 0; i < 300 && !bo(d); i++) d = categoriques(pick([4, 5]), pas);
        // Si no n'ha sortit cap, unes unitats que sumen 10 (tots els percentatges són enters)
        if (!bo(d))
            d = {
                ...d,
                unitats: [4, 3, 2, 1].slice(0, 4),
                valors: [4, 3, 2, 1].map(u => u * pas),
                categories: d.categories.slice(0, 4),
            };
    }
    const { ctx, categories: cats, unitats: u, valors: v } = d;
    const N = suma(v);
    const svg = svgBarres({ categories: cats, valors: v, pas, titolY: 'Alumnes', titolX: ctx.titol });
    const i = randInt(0, cats.length - 1);
    const ordre = cats.map((_, j) => j).sort((a, b) => v[b] - v[a]);
    const [gran, petit] = shuffle(cats.map((_, j) => j))
        .slice(0, 2)
        .sort((a, b) => v[b] - v[a]);
    const moda = ordre[0];
    let pas_;
    if (tipus === 'lectura') {
        pas_ = pasNombre(
            'lectura',
            `Quants alumnes han triat «${cats[i]}»?`,
            v[i],
            [[u[i], 'SENSE_ESCALA']],
            `${texT(cats[i] + ':')}\\ ${v[i]}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    } else if (tipus === 'diferencia') {
        const dif = v[gran] - v[petit];
        pas_ = pasNombre(
            'diferencia',
            `Quants alumnes més han triat «${cats[gran]}» que «${cats[petit]}»?`,
            dif,
            [
                [v[gran] + v[petit], 'SUMA_PER_DIFERENCIA'],
                [v[gran], 'NOMES_UN_VALOR'],
                [u[gran] - u[petit], 'SENSE_ESCALA'],
            ],
            `${v[gran]} - ${v[petit]} = ${dif}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    } else if (tipus === 'total') {
        pas_ = pasNombre(
            'total',
            "Quants alumnes han respost l'enquesta?",
            N,
            [
                [cats.length, 'COMPTA_CATEGORIES'],
                [v[moda], 'NOMES_EL_MAXIM'],
                [suma(u), 'SENSE_ESCALA'],
            ],
            `${v.join(' + ')} = ${N}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    } else if (tipus === 'percentatge') {
        const bons = cats.map((_, j) => j).filter(j => (100 * v[j]) % N === 0);
        const j = pick(bons);
        const p = (100 * v[j]) / N;
        const delMaxim = (100 * v[j]) / v[moda];
        pas_ = pasNombre(
            'percentatge',
            `Han respost ${N} alumnes. Quin percentatge ha triat «${cats[j]}»?`,
            p,
            [
                [v[j], 'FREQ_PER_PERCENT'],
                ...(Number.isInteger(delMaxim) && j !== moda ? [[delMaxim, 'PERCENT_DEL_MAXIM']] : []),
            ],
            `\\dfrac{${v[j]}}{${N}}\\cdot 100 = ${p}\\,\\%`,
            '%'
        );
    } else {
        // afirmacions
        const certes = [
            `L'opció més triada és «${cats[moda]}».`,
            `«${cats[i]}» l'han triat ${v[i]} alumnes.`,
            `«${cats[gran]}» té ${v[gran] - v[petit]} vots més que «${cats[petit]}».`,
        ];
        const falses = [
            [`«${cats[i]}» l'han triat ${u[i]} alumnes.`, 'SENSE_ESCALA'],
            [`Han respost l'enquesta ${cats.length} alumnes.`, 'COMPTA_CATEGORIES'],
            [`Han respost l'enquesta ${v[moda]} alumnes.`, 'NOMES_EL_MAXIM'],
            [`«${cats[gran]}» té ${v[gran] + v[petit]} vots més que «${cats[petit]}».`, 'SUMA_PER_DIFERENCIA'],
        ];
        if (2 * v[moda] < N) falses.push([`Més de la meitat dels alumnes ha triat «${cats[moda]}».`, 'MAJORIA']);
        pas_ = pasTria('afirmacions', 'Quina afirmació és certa?', pick(certes), falses, n);
    }
    return { enunciat: enquesta(ctx), svg, pas: pas_, clau: `barres:${tipus}:${v.join(',')}` };
}

// ── BARRES (variable numèrica discreta, de js/estadistica) ───────────────────
const DISCRETES = ['germans', 'nota', 'son', 'calcat'];
const TEXT_DISCRETA = {
    germans: { variable: 'el nombre de germans', valor: x => `${x} germà${x === 1 ? '' : 'ns'}` },
    nota: { variable: "la nota de l'examen", valor: x => `un ${x}` },
    son: { variable: 'les hores de son', valor: x => `${x} h` },
    calcat: { variable: 'el número de calçat', valor: x => `un ${x}` },
};

/** n dades d'un generador de js/estadistica/question-bank.js (ajuntant-ne mostres). */
function mostra(id, n) {
    const g = QuestionBank.generators[id];
    let ds = g();
    const dades = [...ds.data];
    while (dades.length < n) dades.push(...g().data);
    return { label: ds.label, unit: ds.unit, intervalOptions: ds.intervalOptions, data: dades.slice(0, n) };
}

function barresNumeriques(tipus) {
    const id = pick(DISCRETES);
    let d, xs, f, maxF;
    for (let t = 0; t < 200; t++) {
        d = mostra(id, pick([15, 17, 19, 21, 23, 25]));
        const [a, b] = [Math.min(...d.data), Math.max(...d.data)];
        xs = Array.from({ length: b - a + 1 }, (_, k) => a + k);
        f = xs.map(x => d.data.filter(y => y === x).length);
        maxF = Math.max(...f);
        if (f.filter(y => y === maxF).length === 1 && xs.length >= 4) break;
    }
    const N = d.data.length;
    const txt = TEXT_DISCRETA[id];
    const svg = svgBarres({
        categories: xs.map(String),
        valors: f,
        pas: 1,
        cada: pasNet(maxF),
        titolY: 'Alumnes',
        titolX: d.label + (d.unit ? ` (${d.unit})` : ''),
    });
    const moda = xs[f.indexOf(maxF)];
    const ordenades = [...d.data].sort((x, y) => x - y);
    const mediana = ordenades[(N - 1) / 2];
    const enunciat = `S'ha preguntat a ${N} alumnes ${txt.variable}. El gràfic en mostra les respostes.`;
    let pas_;
    if (tipus === 'moda') {
        pas_ = pasNombre(
            'moda',
            `Quina és la moda de ${txt.variable}?`,
            moda,
            [[maxF, 'FREQ_PER_VALOR']],
            `${texT('Mo')} = ${moda}`
        );
    } else if (tipus === 'mediana') {
        pas_ = pasNombre(
            'mediana',
            `Quina és la mediana de ${txt.variable}?`,
            mediana,
            [
                [(xs[0] + xs[xs.length - 1]) / 2, 'MEDIANA_DE_L_EIX'],
                [moda, 'MODA_PER_MEDIANA'],
                [(N + 1) / 2, 'POSICIO_PER_VALOR'],
            ],
            `${texT(`La dada ${(N + 1) / 2}a de ${N}:`)}\\ ${texT('Me')} = ${mediana}`
        );
    } else {
        const bons = xs.map((_, j) => j).filter(j => f[j] > 0 && f[j] !== xs[j]);
        const k = bons.length ? pick(bons) : f.indexOf(maxF);
        pas_ = pasNombre(
            'freq',
            `Quants alumnes han dit ${txt.valor(xs[k])}?`,
            f[k],
            [[xs[k], 'VALOR_PER_FREQ']],
            `${texT(txt.valor(xs[k]) + ':')}\\ ${f[k]}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    }
    return { enunciat, svg, pas: pas_, clau: `barres-n:${tipus}:${id}:${f.join(',')}` };
}

// ── SECTORS ──────────────────────────────────────────────────────────────────
/** k percentatges diferents, múltiples de 5, que sumen 100. */
function percentatges(k) {
    for (;;) {
        const p = diferents(k - 1, 11).map(x => 5 * x); // 5 … 55
        const resta = 100 - suma(p);
        if (resta >= 5 && resta % 5 === 0 && !p.includes(resta)) return shuffle([...p, resta]);
    }
}

function sectors(tipus, n) {
    const k = pick([4, 5]);
    const ctx = pick(CONTEXTOS);
    const cats = ctx.categories.slice(0, k);
    const p = percentatges(k);
    const i = randInt(0, k - 1);
    const moda = p.indexOf(Math.max(...p));
    let etiquetes = p.map(x => `${x} %`);
    let enunciat = enquesta(ctx);
    let pas_;
    if (tipus === 'falta') {
        etiquetes = etiquetes.map((e, j) => (j === i ? '?' : e));
        const altres = 100 - p[i];
        pas_ = pasNombre(
            'falta',
            `Quin percentatge ha triat «${cats[i]}»?`,
            p[i],
            [[altres, 'SUMA_ALTRES']],
            `100 - ${altres} = ${p[i]}\\,\\%`,
            '%'
        );
    } else if (tipus === 'persones') {
        const N = pick([40, 60, 80, 120, 200]);
        enunciat += ` Han respost ${N} alumnes.`;
        const sol = (p[i] * N) / 100;
        pas_ = pasNombre(
            'persones',
            `Quants alumnes han triat «${cats[i]}»?`,
            sol,
            [[p[i], 'PERCENT_PER_FREQ']],
            `${p[i]}\\,\\%\\ ${texT('de')}\\ ${N} = ${texN(sol)}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    } else if (tipus === 'angle') {
        etiquetes = p.map(x => `${texDeGraus(x)}°`);
        pas_ = pasNombre(
            'angle',
            `Quin percentatge ha triat «${cats[i]}»?`,
            p[i],
            [
                [3.6 * p[i], 'ANGLE_PER_PERCENT'],
                [(3.6 * p[i]) / 360, 'FRACCIO_PER_PERCENT'],
            ],
            `\\dfrac{${texN(3.6 * p[i])}^\\circ}{360^\\circ}\\cdot 100 = ${p[i]}\\,\\%`,
            '%'
        );
    } else {
        const N = pick([40, 60, 80, 200]);
        enunciat += ` Han respost ${N} alumnes.`;
        const j = pick(cats.map((_, x) => x).filter(x => x !== i));
        const certes = [
            `L'opció més triada és «${cats[moda]}».`,
            `«${cats[i]}» l'han triat ${(p[i] * N) / 100} alumnes.`,
            `«${cats[i]}» i «${cats[j]}» sumen el ${p[i] + p[j]} %.`,
        ];
        const falses = [
            [`«${cats[i]}» l'han triat ${p[i]} alumnes.`, 'PERCENT_PER_FREQ'],
            [`El sector de «${cats[i]}» fa ${p[i]}°.`, 'ANGLE_PER_PERCENT'],
        ];
        if (100 - p[i] - p[j] !== p[i] + p[j])
            falses.push([`«${cats[i]}» i «${cats[j]}» sumen el ${100 - p[i] - p[j]} %.`, 'SUMA_ALTRES']);
        if (p[moda] < 50) falses.push([`Més de la meitat dels alumnes ha triat «${cats[moda]}».`, 'MAJORIA']);
        pas_ = pasTria('afirmacions-sectors', 'Quina afirmació és certa?', pick(certes), falses, n);
    }
    const svg = svgSectors({ categories: cats, valors: p, etiquetes });
    return { enunciat, svg, pas: pas_, clau: `sectors:${tipus}:${p.join(',')}:${i}` };
}
const texDeGraus = p => textNombre(3.6 * p);

// ── PICTOGRAMES ──────────────────────────────────────────────────────────────
function pictogrames(tipus) {
    const unitat = pick([2, 4, 10]);
    const k = pick([3, 4, 5]);
    const ctx = pick(CONTEXTOS);
    const cats = ctx.categories.slice(0, k);
    // Mitges icones (valors múltiples de unitat/2), entre 1 i 8 icones per fila
    const mitges = diferents(k, 16); // en mitges icones: 1 … 16
    const v = mitges.map(m => (m * unitat) / 2);
    const icones = v.map(x => x / unitat);
    const senseMitges = v.map(x => Math.floor(x / unitat) * unitat);
    const ambMitja = cats.map((_, j) => j).filter(j => v[j] % unitat !== 0);
    const i = ambMitja.length && Math.random() < 0.7 ? pick(ambMitja) : randInt(0, k - 1);
    const [gran, petit] = shuffle(cats.map((_, j) => j))
        .slice(0, 2)
        .sort((a, b) => v[b] - v[a]);
    const svg = svgPictograma({ categories: cats, valors: v, unitat, nomUnitat: 'alumnes' });
    let pas_;
    if (tipus === 'icones') {
        pas_ = pasNombre(
            'icones',
            `Quants alumnes han triat «${cats[i]}»?`,
            v[i],
            [
                [icones[i], 'COMPTA_ICONES'],
                [senseMitges[i], 'MITJA_ICONA'],
            ],
            `${texN(icones[i])} \\cdot ${unitat} = ${v[i]}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    } else if (tipus === 'icones-total') {
        const N = suma(v);
        pas_ = pasNombre(
            'icones-total',
            "Quants alumnes han respost l'enquesta?",
            N,
            [
                [suma(icones), 'COMPTA_ICONES'],
                [suma(senseMitges), 'MITJA_ICONA'],
            ],
            `${texN(suma(icones))} \\cdot ${unitat} = ${N}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    } else {
        const dif = v[gran] - v[petit];
        pas_ = pasNombre(
            'icones-diferencia',
            `Quants alumnes més han triat «${cats[gran]}» que «${cats[petit]}»?`,
            dif,
            [
                [icones[gran] - icones[petit], 'COMPTA_ICONES'],
                [v[gran] + v[petit], 'SUMA_PER_DIFERENCIA'],
            ],
            `${v[gran]} - ${v[petit]} = ${dif}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    }
    return { enunciat: enquesta(ctx), svg, pas: pas_, clau: `picto:${tipus}:${v.join(',')}:${i}` };
}

// ── HISTOGRAMES I POLÍGONS (variable agrupada, de js/estadistica) ────────────
const AGRUPADES = ['minuts', 'alcada', 'pes', 'pulsacions'];
const TEXT_AGRUPADA = {
    minuts: "els minuts que triguen a arribar a l'institut",
    alcada: "l'alçada",
    pes: 'el pes',
    pulsacions: 'les pulsacions per minut en repòs',
};
const interval = (a, b) => `[${textNombre(a)}, ${textNombre(b)})`;

function histogrames(tipus, nivell, n) {
    const id = pick(AGRUPADES);
    let d, limits, f;
    for (let t = 0; t < 200; t++) {
        d = mostra(id, pick([20, 25, 50]));
        limits = pick(d.intervalOptions).limits;
        f = limits
            .slice(0, -1)
            .map(
                (a, j) =>
                    d.data.filter(x => x >= a && (x < limits[j + 1] || (j === limits.length - 2 && x <= limits[j + 1])))
                        .length
            );
        const maxF = Math.max(...f);
        if (f.filter(y => y === maxF).length === 1 && f.length >= 3) break;
    }
    const N = d.data.length;
    const unit = d.unit;
    const k = f.length;
    const poligon = nivell >= 2 && (tipus === 'marca' || Math.random() < 0.4);
    const nomesPoligon = poligon && Math.random() < 0.5;
    const svg = svgHistograma({
        limits,
        freq: f,
        barres: !nomesPoligon,
        poligon,
        titolY: 'Alumnes',
        titolX: `${d.label} (${unit})`,
    });
    const enunciat = `S'ha mesurat ${TEXT_AGRUPADA[id]} de ${N} alumnes. El gràfic agrupa les dades en intervals.`;
    const modal = f.indexOf(Math.max(...f));
    let pas_;
    if (tipus === 'interval') {
        const i = randInt(0, k - 1);
        const veins = [i - 1, i + 1].filter(j => j >= 0 && j < k).map(j => [f[j], 'INTERVAL_VEI']);
        pas_ = pasNombre(
            'interval',
            `Quants alumnes hi ha a l'interval ${interval(limits[i], limits[i + 1])} ${unit}?`,
            f[i],
            veins,
            `${texT(interval(limits[i], limits[i + 1]) + ':')}\\ ${f[i]}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    } else if (tipus === 'menys') {
        const j = randInt(2, k - 1); // «menys de limits[j]»: les barres 0 … j−1
        const sol = suma(f.slice(0, j));
        pas_ = pasNombre(
            'menys',
            `Quants alumnes tenen menys de ${textNombre(limits[j])} ${unit}?`,
            sol,
            [
                [f[j - 1], 'NOMES_UNA_BARRA'],
                [suma(f.slice(0, j + 1)), 'INCLOU_INTERVAL'],
            ],
            `${f.slice(0, j).join(' + ')} = ${sol}\\ ${texT('alumnes')}`,
            'alumnes'
        );
    } else if (tipus === 'percentatge-hist') {
        const j = randInt(1, k - 2); // «de limits[j] o més»: les barres j … k−1
        const quants = suma(f.slice(j));
        const p = (100 * quants) / N;
        pas_ = pasNombre(
            'percentatge-hist',
            `Quin percentatge dels ${N} alumnes té ${textNombre(limits[j])} ${unit} o més?`,
            p,
            [
                [quants, 'FREQ_PER_PERCENT'],
                [(100 * f[j]) / N, 'NOMES_UNA_BARRA'],
            ],
            `\\dfrac{${quants}}{${N}}\\cdot 100 = ${texN(p)}\\,\\%`,
            '%'
        );
    } else if (tipus === 'marca') {
        const [a, b] = [limits[modal], limits[modal + 1]];
        const marca = (a + b) / 2;
        pas_ = pasNombre(
            'marca',
            "Quina és la marca de classe de l'interval amb més alumnes?",
            marca,
            [
                [f[modal], 'FREQ_PER_VALOR'],
                [a, 'LIMIT_PER_MARCA'],
                [b, 'LIMIT_PER_MARCA'],
            ],
            `\\dfrac{${texN(a)} + ${texN(b)}}{2} = ${texN(marca)}\\ ${texT(unit)}`,
            unit
        );
    } else {
        const cert = interval(limits[modal], limits[modal + 1]);
        const falses = f
            .map((_, j) => j)
            .filter(j => j !== modal)
            .map(j => [interval(limits[j], limits[j + 1]), Math.abs(j - modal) === 1 ? 'INTERVAL_VEI' : null]);
        pas_ = pasTria('modal', `Quin és l'interval modal (${unit})?`, cert, falses, n);
        pas_.dades.distractors.tria = pas_.dades.distractors.tria.filter(([, e]) => e);
    }
    return { enunciat, svg, pas: pas_, clau: `hist:${tipus}:${id}:${f.join(',')}` };
}

// ── GRÀFICS QUE ENGANYEN (nivell 3) ──────────────────────────────────────────
const LLISTES = ['Llista A', 'Llista B', 'Llista C'];

function eixTallat(n) {
    const pas = pick([2, 5]);
    const base = pas * randInt(10, 20); // on comença l'eix
    const [a, b] = [base + pas, base + 3 * pas]; // les barres semblen 1 : 3
    const cats = LLISTES.slice(0, 2);
    const svg = svgBarres({
        categories: cats,
        valors: [a, b],
        pas,
        min: base,
        titolY: 'Vots',
        titolX: 'Eleccions al consell escolar',
    });
    const pas_ = pasTria(
        'eix-tallat',
        'Quina afirmació és certa?',
        `La Llista B té només ${b - a} vots més que la Llista A (${b} i ${a}).`,
        [
            ['La Llista B té el triple de vots que la Llista A.', 'EIX_TALLAT'],
            ['La Llista B té més del doble de vots que la Llista A.', 'EIX_TALLAT'],
            [`La Llista A té ${a - base} vots.`, 'EIX_TALLAT'],
            [`La Llista B té ${b - base} vots.`, 'EIX_TALLAT'],
        ],
        n
    );
    return {
        enunciat: 'Un cartell de la Llista B mostra els vots de les eleccions al consell escolar.',
        svg,
        pas: pas_,
        clau: `tallat:${a},${b},${base}`,
    };
}

function escalaIrregular() {
    const marques = pick([
        [0, 10, 20, 50, 100],
        [0, 5, 10, 25, 50, 100],
        [0, 20, 40, 100, 200],
    ]);
    // Dues barres a dues marques: la relació de valors és entera i no és la de les altures
    let ia, ic;
    for (;;) {
        [ia, ic] = [randInt(1, marques.length - 2), randInt(2, marques.length - 1)];
        if (ic > ia && marques[ic] % marques[ia] === 0 && marques[ic] / marques[ia] !== ic / ia) break;
    }
    const ib = pick([...Array(marques.length).keys()].filter(j => j > 0 && j !== ia && j !== ic));
    const cats = ['Gener', 'Febrer', 'Març'];
    const valors = [marques[ia], marques[ib], marques[ic]];
    const svg = svgBarres({
        categories: cats,
        valors,
        marques,
        titolY: 'Entrades',
        titolX: 'Entrades venudes per a la funció de teatre',
    });
    const sol = marques[ic] / marques[ia];
    const pas_ = pasNombre(
        'escala-irregular',
        'Quantes vegades més entrades que al gener es van vendre al març?',
        sol,
        [[racional(ic, ia), 'ESCALA_IRREGULAR']],
        `\\dfrac{${marques[ic]}}{${marques[ia]}} = ${sol}`,
        'vegades'
    );
    return {
        enunciat: "Les entrades venudes per a la funció de teatre de l'institut.",
        svg,
        pas: pas_,
        clau: `irregular:${valors.join(',')}`,
    };
}

function pictogramaArea() {
    const vegades = pick([2, 3]);
    const pas = pick([10, 20, 50]);
    const a = pas * pick(vegades === 2 ? [2, 3, 4] : [1, 2]);
    const cats = ['2023', '2024'];
    const svg = svgPictogramaArea({ categories: cats, valors: [a, vegades * a], pas, titolY: 'Socis' });
    const pas_ = pasNombre(
        'area',
        'Quantes vegades més socis té el club el 2024 que el 2023?',
        vegades,
        [[vegades * vegades, 'AREA_PICTOGRAMA']],
        `\\dfrac{${vegades * a}}{${a}} = ${vegades}`,
        'vegades'
    );
    return {
        enunciat: "El club d'escacs de l'institut fa propaganda amb aquest gràfic dels seus socis.",
        svg,
        pas: pas_,
        clau: `area:${a},${vegades}`,
    };
}

// ── PREGUNTA ─────────────────────────────────────────────────────────────────
export function generaPreguntaGE({ grafics = '', preguntes = '', nivell = 1, index = 0, opcions = 4 } = {}) {
    const familia = familiaGE(grafics, index, preguntes);
    const tipus = tipusGE(familia, nivell, preguntes);
    const n = Math.max(3, Math.min(5, opcions));
    let r;
    if (tipus === 'eix-tallat') r = eixTallat(n);
    else if (tipus === 'escala-irregular') r = escalaIrregular();
    else if (tipus === 'area') r = pictogramaArea();
    else if (familia === 'barres')
        r = ['moda', 'mediana', 'freq'].includes(tipus)
            ? barresNumeriques(tipus)
            : barresCategoriques(tipus, nivell, n);
    else if (familia === 'sectors') r = sectors(tipus, n);
    else if (familia === 'pictogrames') r = pictogrames(tipus);
    else r = histogrames(tipus, nivell, n);
    return {
        text: `${TEXTOS_GE.families[familia]}${ENGANYS.includes(tipus) ? ' (enganya)' : ''}`,
        clau: r.clau,
        enunciat: r.enunciat,
        svg: r.svg,
        passos: [r.pas],
    };
}

/** El text de la resposta per a l'historial. */
export function textRespostaGE(pas, valors) {
    if (pas.camps.tria) {
        const o = pas.opcions.find(([v]) => v === valors.tria);
        return o ? o[1] : '';
    }
    const [nn, dd] = Array.isArray(valors.r) ? valors.r : [valors.r, 1];
    return textNombre(nn / dd);
}
