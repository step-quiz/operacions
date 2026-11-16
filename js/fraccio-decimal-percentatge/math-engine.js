/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccio-decimal-percentatge/math-engine.js
 * ROL: La matemàtica de «Fracció, decimal i percentatge»: tria el nombre, el
 *      n'escriu de quatre maneres (fracció, decimal, percentatge i dibuix) i en
 *      prepara les respostes equivocades típiques.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar). Joc comú
 *      (js/passos/joc-passos.js) i correcció comuna (js/passos/correccio.js).
 *
 *   NOMBRE      un racional [n, d] irreductible, 0 < n/d ≤ 2,5
 *   NIVELLS     1: fraccions de referència (1/2, 1/4, 3/4, 1/5, 1/10…)
 *               2: qualsevol decimal exacte, més del 100 % i menys de l'1 %
 *               3: decimals periòdics (1/3, 5/6, 4/11…); sovint es dona el decimal
 *                  i cal trobar la fracció generatriu
 *   MODALITAT   a: arrossegar targetes (les falses són errors típics) · b: escriure
 *               (fracció, decimal amb període, percentatge i pintar el dibuix)
 *   El dibuix només hi és si el denominador és ≤ 12.
 *
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, passos/figura-fraccio.js i strings.js.
 * ============================================================================
 */

import { gcd, pick, randInt, shuffle } from '../utils.js';
import { expansioDecimal, racional, racionalsIguals, texDecimal, textDecimal } from '../algebra/racionals.js';
import { svgFiguraFraccio } from '../passos/figura-fraccio.js';
import { TEXTOS_FD } from './strings.js';

export const COLUMNES_FD = ['fraccio', 'decimal', 'percentatge', 'dibuix'];

// ── Els nombres ──────────────────────────────────────────────────────────────
const REFERENCIES_FD = [
    [1, 2],
    [1, 4],
    [3, 4],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [1, 10],
    [3, 10],
    [7, 10],
    [9, 10],
];
const PETITS_FD = [
    [1, 200],
    [3, 200],
    [1, 400],
    [1, 500],
    [3, 500],
    [1, 1000],
];

/** Una fracció irreductible amb un d'aquests denominadors i n/d dins de [min, max). */
function ambDenominadorFD(dens, min, max) {
    for (;;) {
        const d = pick(dens);
        const n = randInt(Math.max(1, Math.ceil(min * d)), Math.ceil(max * d) - 1);
        if (n > 0 && gcd(n, d) === 1 && n / d >= min && n / d < max) return [n, d];
    }
}

export function generaNombreFD(nivell) {
    const sort = randInt(1, 100);
    if (nivell === 1) return pick(REFERENCIES_FD);
    if (nivell === 2) {
        if (sort <= 60) return ambDenominadorFD([8, 20, 25, 50, 100], 0, 1);
        if (sort <= 85) return ambDenominadorFD([2, 4, 5, 8, 10], 1.01, 2.5);
        return pick(PETITS_FD);
    }
    if (sort <= 75) return ambDenominadorFD([3, 6, 9, 11, 12, 15, 18], 0, 1);
    return ambDenominadorFD([3, 6], 1.01, 2.5);
}

// ── Decimals (js/algebra/racionals.js) ───────────────────────────────────────
export const expansioFD = v => expansioDecimal(v);
export const esPeriodicFD = v => expansioDecimal(v).periode !== '';
export const texDecimalFD = v => texDecimal(v);
export const textDecimalFD = v => textDecimal(v);

export const percentFD = ([n, d]) => racional(100 * n, d);
const texPercentFD = v => `${texDecimalFD(percentFD(v))}\\,\\%`;

/** El dibuix del nombre (o null si el denominador és massa gran). */
export function figuraFD([n, d]) {
    if (d > 12 || n > 2.5 * d) return null;
    return { parts: d, unitats: Math.ceil(n / d), pintades: n };
}

// ── Escriptures de cada columna ──────────────────────────────────────────────
// valor: un racional (fracció, decimal), el percentatge (racional) o les parts pintades (dibuix)
function texDeFD(columna, valor) {
    if (columna === 'fraccio') return `\\dfrac{${valor[0]}}{${valor[1]}}`;
    if (columna === 'decimal') return texDecimalFD(valor);
    return `${texDecimalFD(valor)}\\,\\%`;
}

export function textDeFD(columna, valor) {
    if (columna === 'fraccio') return `${valor[0]}/${valor[1]}`;
    if (columna === 'decimal') return textDecimalFD(valor);
    if (columna === 'percentatge') return `${textDecimalFD(valor)} %`;
    return `${valor} parts pintades`;
}

/** Els valors bons de cada columna. */
export function valorsFD(v) {
    const figura = figuraFD(v);
    return { fraccio: v, decimal: v, percentatge: percentFD(v), dibuix: figura ? v[0] : null };
}

// ── Respostes equivocades típiques ───────────────────────────────────────────
// Per a cada columna, [valor equivocat, errorType]. Al dibuix, el valor són les parts pintades
// (i, a les targetes, la figura).
export function distractorsFD(v) {
    const [n, d] = v;
    const { enter, ante, periode } = expansioDecimal(v);
    const p = percentFD(v);
    const xifresD = String(d).length;
    const llista = {
        fraccio: [[[d, n], 'INVERSA']],
        decimal: [
            [[d, 10 ** xifresD], 'FRACCIO_COMA'],
            [[n * 10 ** xifresD + d, 10 ** (String(n).length + xifresD)], 'FRACCIO_COMA'],
            [p, 'PER_100'],
            [[10 * n, d], 'COMA'],
            [[n, 10 * d], 'COMA'],
        ],
        percentatge: [
            [v, 'PER_100'],
            [[d, 1], 'DEN_PERCENT'],
            [[10 * p[0], p[1]], 'COMA'],
            [[p[0], 10 * p[1]], 'COMA'],
        ],
        dibuix: [],
    };
    if (enter === 0 && ante && !periode) llista.fraccio.push([[1, Number(ante)], 'DECIMAL_DEN']);
    if (p[1] === 1) llista.fraccio.push([[1, p[0]], 'PERCENT_DEN']);
    llista.fraccio.push([[n + 1, d], null], [[n, d + 1], null]);
    if (periode) {
        // El període tallat: 0,3 o 0,33 en lloc de 0,3̅
        const tall = `${ante}${periode}`;
        llista.decimal.unshift([[enter * 10 ** tall.length + Number(tall), 10 ** tall.length], 'PERIODE']);
        const pe = expansioDecimal(p);
        const tallP = `${pe.ante}${pe.periode}`;
        llista.percentatge.unshift([[pe.enter * 10 ** tallP.length + Number(tallP), 10 ** tallP.length], 'PERIODE']);
    }
    const figura = figuraFD(v);
    if (figura) {
        const total = figura.parts * figura.unitats;
        if (total - n > 0 && total - n !== n) llista.dibuix.push([total - n, 'COMPLEMENT']);
        if (d !== n) llista.dibuix.push([d, 'PARTS']);
        llista.dibuix.push([n === 1 ? 2 : n - 1, null]);
    }
    // Sense repetits ni el valor bo, i els racionals simplificats
    const bons = valorsFD(v);
    const igual = (col, x, y) => (col === 'dibuix' ? x === y : racionalsIguals(x, y));
    for (const col of COLUMNES_FD) {
        const nets = [];
        for (const [valor, errorType] of llista[col]) {
            const net = col === 'dibuix' ? valor : racional(valor[0], valor[1]);
            if (col !== 'dibuix' && (net[0] <= 0 || net[1] > 100000)) continue;
            if (col === 'dibuix' && !(net > 0)) continue;
            if (igual(col, net, bons[col]) || nets.some(([x]) => igual(col, x, net))) continue;
            nets.push([net, errorType]);
        }
        llista[col] = nets;
    }
    return llista;
}

// ── La pregunta ──────────────────────────────────────────────────────────────
/**
 * Una pregunta nova: { tex: '', text, clau, valor, donada, passos }.
 * @param {number} nivell     1-3
 * @param {string} modalitat  'a' (targetes) o 'b' (escriure)
 */
export function generaPreguntaFD(nivell, modalitat = 'a') {
    const n = Math.min(3, Math.max(1, nivell));
    const v = generaNombreFD(n);
    const figura = figuraFD(v);
    const columnes = COLUMNES_FD.filter(c => c !== 'dibuix' || figura);
    // Al nivell 3, sovint es dona el decimal (i cal trobar la fracció generatriu)
    const donada = n === 3 && randInt(1, 100) <= 60 ? 'decimal' : pick(columnes);
    return preguntaFD(v, donada, modalitat, { periode: n === 3 });
}

/** La pregunta d'un nombre concret (els tests la fan servir directament). */
export function preguntaFD(v, donada, modalitat = 'a', { periode = false } = {}) {
    const figura = figuraFD(v);
    const columnes = COLUMNES_FD.filter(c => c !== 'dibuix' || figura);
    const bons = valorsFD(v);
    const distractors = distractorsFD(v);
    const mostra = col => (col === 'dibuix' ? { svg: svgFiguraFraccio(figura) } : { tex: texDeFD(col, bons[col]) });
    const pas = {
        id: 'fdp',
        mena: 'fdp',
        nom: TEXTOS_FD.nomPas,
        enunciat: TEXTOS_FD.enunciat[modalitat],
        camps: {},
        solucio: {},
        dades: { v, donada, modalitat, distractors },
        linia: [`\\dfrac{${v[0]}}{${v[1]}}`, texDecimalFD(v), texPercentFD(v)].join(' = '),
    };

    if (modalitat === 'a') {
        // Per a cada columna que falta, la targeta bona i dues de falses
        const fitxes = [];
        for (const col of columnes.filter(c => c !== donada)) {
            fitxes.push({ columna: col, valor: bons[col], errorType: null, bona: true });
            for (const [valor, errorType] of distractors[col].slice(0, 2))
                fitxes.push({ columna: col, valor, errorType });
        }
        shuffle(fitxes);
        pas.fitxes = [];
        pas.dades.fitxes = {};
        fitxes.forEach((f, i) => {
            const id = `t${i}`;
            const contingut =
                f.columna === 'dibuix'
                    ? { svg: svgFiguraFraccio(dibuixFitxaFD(f, figura, v)) }
                    : { tex: texDeFD(f.columna, f.valor) };
            pas.fitxes.push({ id, ...contingut });
            const text =
                f.errorType === 'PARTS' ? `${v[0]} parts de ${figura.parts + 1}` : textDeFD(f.columna, f.valor);
            pas.dades.fitxes[id] = { columna: f.columna, errorType: f.errorType, text };
            if (f.bona) pas.solucio[f.columna] = id;
        });
        // (els camps, en l'ordre de les columnes)
        pas.camps = Object.fromEntries(columnes.filter(c => c !== donada).map(c => [c, 'fitxa']));
        pas.plantilla = columnes.map(col => ({
            grup: [col === donada ? mostra(col) : { camp: col }],
            titol: TEXTOS_FD.titol[col],
        }));
        return { tex: '', text: textPregunta(donada, bons), clau: `${v}-${donada}`, valor: v, donada, passos: [pas] };
    }

    // Escriure: fracció (irreductible), decimal i percentatge (amb període, si cal) i pintar el dibuix
    const ambPeriode = periode || esPeriodicFD(v);
    const tipus = { fraccio: 'racional', decimal: 'decimal', percentatge: 'decimal', dibuix: 'pintat' };
    pas.plantilla = columnes.map(col => {
        let contingut;
        if (col === donada) contingut = [mostra(col)];
        else if (col === 'percentatge') contingut = [{ camp: col, periode: ambPeriode }, { tex: '\\%' }];
        else contingut = [{ camp: col, periode: ambPeriode }];
        return { grup: contingut, titol: TEXTOS_FD.titol[col] };
    });
    for (const col of columnes.filter(c => c !== donada)) {
        pas.camps[col] = tipus[col];
        pas.solucio[col] = bons[col];
    }
    if (figura && donada !== 'dibuix') pas.figura = { parts: figura.parts, unitats: figura.unitats };
    pas.nota = ambPeriode ? TEXTOS_FD.nota.periode : TEXTOS_FD.nota.b;
    return { tex: '', text: textPregunta(donada, bons), clau: `${v}-${donada}`, valor: v, donada, passos: [pas] };
}

const textPregunta = (donada, bons) =>
    donada === 'dibuix' ? `dibuix de ${textDeFD('fraccio', bons.fraccio)}` : textDeFD(donada, bons[donada]);

// La figura d'una targeta de dibuix: la bona, el complement o la de les parts equivocades
function dibuixFitxaFD(f, figura, v) {
    if (f.errorType === 'PARTS') return { parts: figura.parts + 1, unitats: figura.unitats, pintades: v[0] };
    return { ...figura, pintades: f.valor };
}

/** La resposta, en text pla, per a l'historial. */
export function textRespostaFD(pas, valors) {
    return Object.keys(pas.camps)
        .map(col => {
            const v = valors[col];
            if (pas.camps[col] === 'fitxa') return (pas.dades.fitxes[v] || { text: '?' }).text;
            return textDeFD(col, v);
        })
        .join(' · ');
}
