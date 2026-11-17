/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/math-engine.js
 * ROL: Les preguntes de «Fórmules STEAM» (formules-steam.html), lliurament 16 del full
 *      de ruta, amb les decisions del David del 17/11/2026:
 *        - sempre un context i, a sota, la fórmula amb el significat i la unitat de cada
 *          lletra;
 *        - sempre primer amb nombres (s'aïlla amb les dades) i després les mateixes
 *          operacions amb lletres (les altres lletres fan de paràmetres);
 *        - cada pas: quina operació es fa als dos membres i com queda (triar); girar la
 *          igualtat és un pas a part, automàtic (es veu escrit a la resolució);
 *        - la lletra al denominador, sempre en dos passos; a l'arrel, la positiva;
 *        - al final dels nombres, en quina unitat surt (operant amb les unitats).
 *   PASSOS     substitucio · [operacio + equacio] per cada pas · valor · unitat ·
 *              lletres (un per cada pas, amb l'operació a l'enunciat)
 *   NIVELLS    1 un pas · 2 dos passos o més · 3 la lletra al denominador ·
 *              4 quadrats i arrels, i les fórmules llargues (posició, paral·lel)
 * ARQUITECTURA: mòdul pur (l'atzar, a través de utils.js, perquè les sessions fixes el
 *      puguin sembrar). Joc comú (js/passos/joc-passos.js); àlgebra a algebra.js;
 *      fórmules, contextos i unitats a cataleg.js.
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, algebra.js, cataleg.js, strings.js.
 * ============================================================================
 */

import { pick, shuffle } from '../utils.js';
import { coefsIguals, comRacional, signeCoef, texDecimal, textDecimal } from '../algebra/racionals.js';
import {
    V,
    aDenominador,
    aillaPassos,
    avalua,
    avaluaExacte,
    equacionsDolentes,
    gira,
    llegeixEquacio,
    operacionsDolentes,
    substitueixEq,
    tex,
    texEq,
    textEq,
    texOperacio,
    textOperacio,
} from './algebra.js';
import { FORMULES, nomsDe, texDe } from './cataleg.js';
import { TEXTOS_FS } from './strings.js';

const T = TEXTOS_FS;
const LLARG = 9;

/** Quants decimals té un coeficient (99 si no és un decimal exacte). */
function decimals(x) {
    const d = comRacional(x)[1];
    for (let t = 0; t <= 9; t++) if (10 ** t % d === 0) return t;
    return 99;
}

/** El nivell d'aïllar x a la fórmula f. */
function nivellDe(f, x) {
    const eq = llegeixEquacio(f.eq, nomsDe(f));
    const passos = aillaPassos(eq, x);
    if (passos.some(p => p.op.tipus === 'arrel') || f.id === 'posicio' || f.id === 'paralel') return 4;
    if (aDenominador(eq[0], x) || aDenominador(eq[1], x)) return 3;
    return passos.length === 1 ? 1 : 2;
}

/** Tots els casos (fórmula, lletra a aïllar), amb el seu nivell. */
export const CASOS_FS = FORMULES.flatMap(f => Object.keys(f.aillar).map(x => ({ f, x, nivell: nivellDe(f, x) })));

/** Si l'equació es compleix amb aquests valors (les lletres que hi queden, incloses). */
function compleix(eq, valors) {
    try {
        const [a, b] = eq.map(e => avalua(e, valors));
        return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    } catch (e) {
        return false;
    }
}

/**
 * Un pas d'escollir: la bona [text] i les dolentes [[text, codi]], sense repetits; les que
 * també serien bones (equivalents) es treuen. linia: el TeX que queda a la resolució.
 */
function pasTria(id, mena, enunciat, bona, dolentes, linia, plantilla = []) {
    const vistes = new Set([bona]);
    const netes = [];
    for (const [t, codi] of dolentes) {
        if (vistes.has(t) || netes.length >= 3) continue;
        vistes.add(t);
        netes.push([t, codi]);
    }
    const opcions = shuffle([[`b`, bona], ...netes.map(([t], k) => [`d${k}`, t])]);
    return {
        id,
        mena,
        nom: T.nomPas[mena],
        enunciat,
        plantilla,
        camps: { tria: 'tria' },
        opcions,
        literal: true,
        solucio: { tria: 'b' },
        dades: { distractors: { tria: netes.map(([, codi], k) => [`d${k}`, codi]) } },
        linia,
    };
}

/** El TeX d'una equació i, si cal, la mateixa girada a sota (el pas automàtic de girar-la). */
function liniaAmbGir(eq, gira, L) {
    if (!gira) return texEq(eq, L);
    return `\\begin{aligned} ${tex(eq[0], L)} &= ${tex(eq[1], L)} \\\\ ${tex(eq[1], L)} &= ${tex(eq[0], L)} \\end{aligned}`;
}

/** Els valors d'una fórmula, amb nombres que encaixen (decimals exactes, positius). */
function valorsDe(f, x) {
    for (let k = 0; k < 200; k++) {
        const v = f.genera();
        // positius, amb pocs decimals i cap 1 (amb un 1, «80 = Δx / 1» ja no tindria res per aïllar)
        const nets = Object.values(v).every(y => signeCoef(y) > 0 && decimals(y) <= 3 && !coefsIguals(y, 1));
        if (nets && decimals(v[x]) <= 2) return v;
    }
    throw new Error(`no surten valors per a ${f.id}`);
}

/** Les equacions dolentes d'un pas, sense les que es complirien (serien bones). */
function dolentesNetes(pas, valors) {
    return equacionsDolentes(pas).filter(([eq]) => !compleix(eq, valors));
}

/** Una pregunta nova de la fórmula f aïllant x (o d'un cas del nivell 1-4, si no se'n diu cap). */
export function generaPreguntaFS(nivell, cas = null) {
    const n = [1, 2, 3, 4].includes(nivell) ? nivell : 1;
    const { f, x } = cas || pick(CASOS_FS.filter(c => c.nivell === n));
    const noms = nomsDe(f);
    const L = texDe(f);
    const ctx = f.aillar[x];
    const valors = valorsDe(f, x);
    const coneguts = Object.fromEntries(noms.filter(k => k !== x).map(k => [k, valors[k]]));
    const fmt = k => textDecimal(valors[k]);
    const eq = llegeixEquacio(f.eq, noms);
    const eqNum = substitueixEq(eq, coneguts);
    const passosNum = aillaPassos(eqNum, x);
    const passosLletres = aillaPassos(eq, x);
    const passos = [];

    // 1. Substituir les dades (les dolentes: dades canviades de lletra)
    const subst = [];
    const ks = Object.keys(coneguts);
    for (const k of ks) subst.push([substitueixEq(eq, { ...coneguts, [k]: V(x), [x]: valors[k] }), 'SUBSTITUCIO']);
    for (let i = 0; i < ks.length; i++)
        for (let j = i + 1; j < ks.length; j++)
            subst.push([
                substitueixEq(eq, { ...coneguts, [ks[i]]: valors[ks[j]], [ks[j]]: valors[ks[i]] }),
                'SUBSTITUCIO',
            ]);
    passos.push(
        pasTria(
            'substitucio',
            'substitucio',
            T.enunciat.substitucio,
            textEq(eqNum),
            shuffle(subst.filter(([e]) => !compleix(e, valors))).map(([e, c]) => [textEq(e), c]),
            texEq(eqNum, L)
        )
    );

    // 2. Aïllar amb nombres: l'operació i com queda, pas a pas
    const xTxt = x;
    passosNum.forEach((p, k) => {
        passos.push(
            pasTria(
                `op${k + 1}`,
                'operacio',
                T.enunciat.operacio(xTxt),
                textOperacio(p.op),
                operacionsDolentes(p.op).map(([op, codi]) => [textOperacio(op), codi]),
                texOperacio(p.op, L)
            )
        );
        passos.push(
            pasTria(
                `eq${k + 1}`,
                'equacio',
                T.enunciat.equacio,
                textEq(p.despres),
                dolentesNetes(p, valors).map(([e, c]) => [textEq(e), c]),
                liniaAmbGir(p.despres, p.gira, L)
            )
        );
    });

    // 3. El valor: de l'última equació amb nombres (la lletra, sola a un membre)
    const ultimNum = passosNum[passosNum.length - 1];
    const [p0, q0] = ultimNum.despres;
    const costatX = p0.t === 'var' && p0.n === x ? 0 : 1;
    const valorsDolents = [];
    for (const [e, codi] of dolentesNetes(ultimNum, valors)) {
        const altre = e[1 - costatX];
        const solaX = e[costatX].t === 'var' && e[costatX].n === x;
        if (!solaX) continue;
        try {
            const v = avaluaExacte(altre, {});
            if (signeCoef(v) > 0 && decimals(v) <= 6 && !coefsIguals(v, valors[x])) valorsDolents.push([v, codi]);
        } catch (err) {
            /* amb arrels no es pot escriure exacte: no és opció */
        }
    }
    void q0;
    passos.push({
        id: 'valor',
        mena: 'valor',
        nom: T.nomPas.valor,
        enunciat: T.enunciat.valor(x),
        plantilla: [{ tex: `${L[x]} =` }, { camp: 'r', llarg: LLARG }],
        camps: { r: 'decimal' },
        solucio: { r: valors[x] },
        dades: {
            distractors: {
                r: valorsDolents.filter(([v], i, t) => t.findIndex(([w]) => coefsIguals(v, w)) === i),
            },
        },
        nota: T.nota.valor,
        linia: `${L[x]} = ${texDecimal(valors[x])}`,
    });

    // 4. La unitat: l'última equació amb lletres, amb les unitats de les dades al lloc de les lletres
    const finalLletres = passosLletres[passosLletres.length - 1].despres;
    const finalX = finalLletres[0].t === 'var' && finalLletres[0].n === x ? finalLletres : gira(finalLletres);
    const ambUnitats = substitueixEq(
        finalX,
        Object.fromEntries(ks.map(k => [k, { t: 'unit', text: ctx.unitats[k][0], tex: ctx.unitats[k][1] }]))
    );
    const [uText, uTex] = ctx.unitats[x];
    passos.push(
        pasTria(
            'unitat',
            'unitat',
            T.enunciat.unitat(x),
            uText,
            ctx.dolentes.map(d => [d, 'UNITAT']),
            `${L[x]} = ${texDecimal(valors[x])}\\ ${uTex}`,
            [{ tex: texEq(ambUnitats, L) }]
        )
    );

    // 5. Les mateixes operacions, amb lletres
    passosLletres.forEach((p, k) => {
        passos.push(
            pasTria(
                `ll${k + 1}`,
                'lletres',
                T.enunciat.lletres(textOperacio(p.op)),
                textEq(p.despres),
                dolentesNetes(p, valors).map(([e, c]) => [textEq(e), c]),
                liniaAmbGir(p.despres, p.gira, L)
            )
        );
    });

    const parts = noms.map(k => [
        k,
        f.lletres[k][1],
        ctx.unitats[k][0] === '(sense unitats)' ? 'sense unitats' : ctx.unitats[k][0],
    ]);
    return {
        // KaTeX no admet el punt volat dins d'un text: «paral·lel» s'escriu amb «ŀl»
        tex: `\\text{${f.nom.replace(/l·l/g, 'ŀl')}:}\\quad ${texEq(eq, L)}`,
        enunciat: `${ctx.text(valors, fmt)} ${T.llegenda(textEq(eq), parts)}`,
        text: `${f.nom}: aïllar ${x}`,
        clau: `${f.id}|${x}|${ks.map(fmt).join(',')}`,
        passos,
        dades: { formula: f.id, incognita: x, valors, nivell: nivellDe(f, x) },
    };
}

/** La resposta escrita, per a l'historial: el nombre amb coma o el text de l'opció triada. */
export function textRespostaFS(pas, valors) {
    if (pas.camps.r === 'decimal') return textDecimal(valors.r);
    const opcio = pas.opcions.find(([valor]) => valor === valors.tria);
    return opcio ? opcio[1] : String(valors.tria);
}
