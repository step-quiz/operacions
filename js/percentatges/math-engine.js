/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/percentatges/math-engine.js
 * ROL: La matemàtica de «Percentatges» (percentatges.html): genera els problemes,
 *      els seus passos i, per a cada pas, els valors que donen els errors típics.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar). Els nombres són
 *      coeficients exactes (un enter o una fracció [n, d]: js/algebra/racionals.js).
 *      Joc comú (js/passos/joc-passos.js) i correcció comuna (js/passos/correccio.js).
 *
 *   TIPUS       calcul      el p % d'una quantitat (abans, el percentatge en decimal o fracció)
 *               variacio    augments i rebaixes amb l'índex de variació (× 1,21, × 0,7)
 *               inversPreu  la quantitat d'abans d'un augment o d'una rebaixa (dividir per l'índex)
 *               inversPart  quin tant per cent representa una part
 *               encadenats  dos canvis seguits (es multipliquen els índexs)
 *   ?tipus=     '' segons el nivell (1: calcul · 2: calcul i variacio · 3: la resta) ·
 *               calcul · variacio · invers (els dos inversos) · encadenats
 *
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, passos/textos.js i strings.js.
 * ============================================================================
 */

import { gcd, pick, randInt } from '../utils.js';
import {
    coeficient,
    coefsIguals,
    comRacional,
    producteCoef,
    quocientCoef,
    signeCoef,
    sumaCoef,
    texDecimal,
    textDecimal,
} from '../algebra/racionals.js';
import { TEXTOS_PE } from './strings.js';

export const TIPUS_PE = {
    '': null,
    'calcul': ['calcul'],
    'variacio': ['variacio'],
    'invers': ['inversPreu', 'inversPart'],
    'encadenats': ['encadenats'],
};

/** El tipus d'una pregunta: el de ?tipus= o, si no n'hi ha, el que toca al nivell. */
export function tipusPE(opcio, nivell) {
    const llista = TIPUS_PE[opcio];
    if (llista) return pick(llista);
    if (nivell === 1) return 'calcul';
    if (nivell === 2) return pick(['calcul', 'variacio']);
    return pick(['variacio', 'inversPreu', 'inversPart', 'encadenats']);
}

// ── Nombres ──────────────────────────────────────────────────────────────────
const cent = p => quocientCoef(p, 100);
const mes = (x, y) => sumaCoef(x, y);
const menys = (x, y) => sumaCoef(x, producteCoef(y, -1));
const per = (x, y) => producteCoef(x, y);
const entre = (x, y) => quocientCoef(x, y);
/** Si té com a molt `n` decimals (i és positiu). */
const decimalsMax = (x, n = 2) => signeCoef(x) > 0 && 10 ** n % comRacional(x)[1] === 0;

// Escriptura: TeX i text amb coma decimal (els euros, amb dos decimals si en tenen)
const tx = (x, euros = false) => texDecimal(x, { minDecimals: euros ? 2 : 0 });
const tt = (x, euros = false) => textDecimal(x, { minDecimals: euros ? 2 : 0 });
const EUR = { tex: '\\text{€}' };

/** Els valors equivocats d'un camp, sense el bo, sense repetits i positius. */
function netsPE(sol, llista) {
    const nets = [];
    for (const [valor, errorType] of llista) {
        if (signeCoef(valor) <= 0 || coefsIguals(valor, sol) || nets.some(([v]) => coefsIguals(v, valor))) continue;
        nets.push([valor, errorType]);
    }
    return nets;
}

function pasPE(id, plantilla, camp, solucio, distractors, linia, enunciat = id) {
    return {
        id,
        mena: id,
        nom: TEXTOS_PE.nomPas[id],
        enunciat: TEXTOS_PE.enunciat[enunciat],
        plantilla,
        camps: { [camp]: camp === 'f' ? 'racional' : 'decimal' },
        solucio: { [camp]: camp === 'f' ? comRacional(solucio) : solucio },
        dades: { distractors: { [camp]: netsPE(solucio, distractors) } },
        linia,
    };
}

// Índex de variació d'un augment (signe 1) o d'una rebaixa (−1) del p %
const indexPE = (p, signe) => mes(1, per(signe, cent(p)));
const texCanvi = (p, signe) => `${signe > 0 ? '+' : '-'}${tx(p)}\\,\\%`;

function pasIndexPE(id, p, signe, camp = 'i') {
    const index = indexPE(p, signe);
    // (amb un percentatge d'una xifra: 5 % → × 1,5 en lloc de × 1,05)
    const [pn, pd] = comRacional(p);
    const deu = pn < 10 * pd ? [[mes(1, per(signe, entre(p, 10))), 'DECIMAL_5']] : [];
    return pasPE(
        id,
        [{ tex: `${texCanvi(p, signe)} \\;\\Rightarrow\\; \\times` }, { camp }],
        camp,
        index,
        [[cent(p), 'INDEX_SENSE_1'], [indexPE(p, -signe), 'INDEX_SIGNE'], ...deu, [mes(1, p), 'SENSE_100']],
        `${texCanvi(p, signe)} \\;\\Rightarrow\\; \\times ${tx(index)}`
    );
}

// ── Els cinc tipus ───────────────────────────────────────────────────────────
function calculPE(nivell) {
    for (;;) {
        let p, q;
        if (nivell === 1) {
            p = pick([10, 20, 25, 50, 75, 5, 30, 40]);
            q = (100 / gcd(p, 100)) * randInt(1, 8);
            if (q < 10 || q > 400) continue;
        } else if (nivell === 2) {
            p = randInt(1, 95);
            q = randInt(2, 80) * 5;
        } else {
            p = pick([150, 120, 200, coeficient(5, 2), coeficient(25, 2), coeficient(1, 2), randInt(1, 99)]);
            q = randInt(4, 400);
        }
        const r = per(cent(p), q);
        if (!decimalsMax(r)) continue;
        const ambFraccio = nivell === 1 && [10, 20, 25, 50, 75].includes(p) && randInt(0, 1) === 1;
        const botiga = randInt(0, 1) === 1;
        const prod = pick(TEXTOS_PE.productes);
        const enunciat = botiga
            ? TEXTOS_PE.problema.descompte({ prod, p: tt(p), q: tt(q, true) })
            : TEXTOS_PE.problema.calcul({ p: tt(p), q: tt(q) });
        const unitat = botiga ? [EUR] : [];
        const fraccio = comRacional(cent(p));
        const primer = ambFraccio
            ? pasPE(
                  'fraccio',
                  [{ tex: `${tx(p)}\\,\\% =` }, { camp: 'f' }],
                  'f',
                  cent(p),
                  [
                      [[1, p], 'PERCENT_DEN'],
                      [p, 'SENSE_100'],
                  ],
                  `${tx(p)}\\,\\% = \\dfrac{${fraccio[0]}}{${fraccio[1]}}`
              )
            : pasPE(
                  'decimal',
                  [{ tex: `${tx(p)}\\,\\% =` }, { camp: 'd' }],
                  'd',
                  cent(p),
                  [
                      [p, 'SENSE_100'],
                      [entre(p, 10), 'DECIMAL_5'],
                      [entre(p, 1000), 'COMA'],
                  ],
                  `${tx(p)}\\,\\% = ${tx(cent(p))}`
              );
        const factor = ambFraccio ? `\\dfrac{${fraccio[0]}}{${fraccio[1]}}` : tx(cent(p));
        const segon = pasPE(
            'resultat',
            [{ tex: `${factor} \\cdot ${tx(q)} =` }, { camp: 'r' }, ...unitat],
            'r',
            r,
            [
                [menys(q, p), 'RESTA_PERCENT'],
                [per(p, q), 'SENSE_100'],
                [menys(q, r), 'COMPLEMENT'],
                [per(r, 10), 'COMA'],
                [entre(r, 10), 'COMA'],
            ],
            `${tx(p)}\\,\\% \\text{ de } ${tx(q)} = ${factor} \\cdot ${tx(q)} = ${tx(r, botiga)}${botiga ? '\\text{ €}' : ''}`
        );
        return { enunciat, clau: `c${tt(p)}-${q}`, passos: [primer, segon] };
    }
}

function variacioPE(nivell) {
    for (;;) {
        const p =
            nivell === 1
                ? pick([10, 20, 25, 50])
                : nivell === 2
                  ? randInt(2, 60)
                  : pick([randInt(1, 9), randInt(10, 90)]);
        const signe = pick([1, -1]);
        const prod = pick(TEXTOS_PE.productes);
        const q = randInt(prod.preu[0], prod.preu[1]);
        const index = indexPE(p, signe);
        const r = per(q, index);
        if (!decimalsMax(r)) continue;
        const enunciat =
            signe < 0
                ? TEXTOS_PE.problema.rebaixa({ prod, p: tt(p), q: tt(q, true) })
                : TEXTOS_PE.problema.augment({ p: tt(p), q: tt(q, true) });
        const variacio = per(q, cent(p));
        const final = pasPE(
            'final',
            [{ tex: `${tx(q)} \\cdot ${tx(index)} =` }, { camp: 'r' }, EUR],
            'r',
            r,
            [
                [variacio, 'NOMES_VARIACIO'],
                [mes(q, per(signe, p)), 'SUMA_PERCENT'],
                [per(q, indexPE(p, -signe)), 'INDEX_SIGNE'],
            ],
            `${tx(q)} \\cdot ${tx(index)} = ${tx(r, true)}\\text{ €}`
        );
        return { enunciat, clau: `v${p}${signe}-${q}`, passos: [pasIndexPE('index', p, signe), final] };
    }
}

function inversPreuPE() {
    for (;;) {
        const signe = randInt(1, 100) <= 70 ? -1 : 1;
        const p = signe < 0 ? pick([10, 15, 20, 25, 30, 40, 50]) : pick([10, 20, 25, 50]);
        const prod = pick(TEXTOS_PE.productes);
        const q = randInt(prod.preu[0], prod.preu[1]);
        const index = indexPE(p, signe);
        const f = per(q, index);
        if (!decimalsMax(f)) continue;
        const enunciat =
            signe < 0
                ? TEXTOS_PE.problema.abansRebaixa({ prod, p: tt(p), f: tt(f, true) })
                : TEXTOS_PE.problema.abansAugment({ p: tt(p), f: tt(f, true) });
        const inicial = pasPE(
            'inicial',
            [
                { tex: `x \\cdot ${tx(index)} = ${tx(f)} \\;\\Rightarrow\\; x = ${tx(f)} : ${tx(index)} =` },
                { camp: 'r' },
                EUR,
            ],
            'r',
            q,
            [
                [per(f, index), 'MULTIPLICA'],
                [per(f, indexPE(p, -signe)), 'DESFER_PERCENT'],
                [mes(f, per(-signe, p)), 'DESFER_PERCENT'],
            ],
            `x = ${tx(f)} : ${tx(index)} = ${tx(q, true)}\\text{ €}`
        );
        return { enunciat, clau: `i${p}${signe}-${q}`, passos: [pasIndexPE('index', p, signe), inicial] };
    }
}

function inversPartPE() {
    const t = pick([20, 25, 40, 50, 80, 125, 200, 250, 400, 500]);
    const a = randInt(1, t - 1);
    const quocient = entre(a, t);
    const percent = per(quocient, 100);
    const enunciat = pick(TEXTOS_PE.problema.part)({ a, t });
    return {
        enunciat,
        clau: `p${a}-${t}`,
        passos: [
            pasPE(
                'quocient',
                [{ tex: `${a} : ${t} =` }, { camp: 'q' }],
                'q',
                quocient,
                [
                    [entre(t, a), 'DIVIDEIX_INVERS'],
                    [percent, 'PER_100'],
                    [per(quocient, 10), 'COMA'],
                ],
                `${a} : ${t} = ${tx(quocient)}`
            ),
            pasPE(
                'percent',
                [{ tex: `${tx(quocient)} =` }, { camp: 'p' }, { tex: '\\%' }],
                'p',
                percent,
                [
                    [quocient, 'PER_100'],
                    [per(quocient, 10), 'COMA'],
                    [per(quocient, 1000), 'COMA'],
                ],
                `${tx(quocient)} = ${tx(percent)}\\,\\%`
            ),
        ],
    };
}

function encadenatsPE() {
    for (;;) {
        const [s1, s2] = pick([
            [1, -1],
            [1, -1],
            [1, -1],
            [-1, -1],
            [1, 1],
        ]);
        const p1 = pick([10, 20, 25, 30, 40, 50]);
        const p2 = pick([10, 20, 25, 30, 40]);
        const [i1, i2] = [indexPE(p1, s1), indexPE(p2, s2)];
        const total = per(i1, i2);
        if (coefsIguals(total, 1)) continue;
        const puja = signeCoef(menys(total, 1)) > 0;
        const variacio = per(puja ? menys(total, 1) : menys(1, total), 100);
        const sumaPercent = mes(per(s1, p1), per(s2, p2));
        const absSuma = signeCoef(sumaPercent) < 0 ? per(sumaPercent, -1) : sumaPercent;
        const paraula = s => (s > 0 ? TEXTOS_PE.puja : TEXTOS_PE.baixa);
        return {
            enunciat: TEXTOS_PE.problema.encadenats({ canvi1: paraula(s1), p1, canvi2: paraula(s2), p2 }),
            clau: `e${s1 * p1}${s2 * p2}`,
            passos: [
                pasIndexPE('index1', p1, s1, 'i1'),
                pasIndexPE('index2', p2, s2, 'i2'),
                pasPE(
                    'total',
                    [{ tex: `${tx(i1)} \\cdot ${tx(i2)} =` }, { camp: 't' }],
                    't',
                    total,
                    [
                        [mes(i1, i2), 'SUMA_INDEXS'],
                        [mes(1, cent(sumaPercent)), 'SUMA_PERCENTATGES'],
                    ],
                    `${tx(i1)} \\cdot ${tx(i2)} = ${tx(total)}`
                ),
                pasPE(
                    'variacio',
                    [
                        { tex: `\\times ${tx(total)} \\;\\Rightarrow\\; \\text{${paraula(puja ? 1 : -1)} un}` },
                        { camp: 'v' },
                        { tex: '\\%' },
                    ],
                    'v',
                    variacio,
                    [
                        [absSuma, 'SUMA_PERCENTATGES'],
                        [per(total, 100), 'INDEX_COM_PERCENT'],
                        [entre(variacio, 100), 'PER_100'],
                    ],
                    `\\times ${tx(total)} \\;\\Rightarrow\\; \\text{${paraula(puja ? 1 : -1)} un } ${tx(variacio)}\\,\\%`
                ),
            ],
        };
    }
}

const GENERADORS_PE = {
    calcul: calculPE,
    variacio: variacioPE,
    inversPreu: inversPreuPE,
    inversPart: inversPartPE,
    encadenats: encadenatsPE,
};

/** Una pregunta nova: { tipus, tex: '', enunciat, text, clau, passos }. */
export function generaPreguntaPE(tipus, nivell) {
    const n = Math.min(3, Math.max(1, nivell));
    const q = GENERADORS_PE[tipus](n);
    return { tipus, tex: '', text: q.enunciat, ...q };
}

/** La resposta, en text pla, per a l'historial. */
export function textRespostaPE(pas, valors) {
    const [camp] = Object.keys(pas.camps);
    const v = valors[camp];
    if (pas.camps[camp] === 'racional') return `${v[0]}/${v[1]}`;
    return tt(v) + (camp === 'p' || camp === 'v' ? ' %' : '');
}
