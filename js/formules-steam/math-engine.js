/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/math-engine.js
 * ROL: Les preguntes de «Fórmules STEAM» (formules-steam.html), lliurament 16 del full
 *      de ruta, amb les decisions del David del 17/11/2026:
 *        - sempre un context; el problema (context i pregunta) i la fórmula (amb la
 *          llegenda: lletra · magnitud · unitat) en dues targetes separades;
 *        - sempre primer amb nombres (s'aïlla amb les dades) i després, si l'alumne ho
 *          vol, les mateixes operacions amb lletres (les altres lletres fan de paràmetres);
 *        - cada pas: quina operació es fa als dos membres i quina equació equivalent
 *          s'obté (triar); girar la igualtat és un pas a part, automàtic (es veu escrit);
 *        - la lletra al denominador, sempre en dos passos; a l'arrel, la positiva;
 *        - al final dels nombres, en quina unitat surt (operant amb les unitats).
 *      I les de la revisió de la interfície (artifact del 17/11): les opcions i les
 *      consignes amb KaTeX (fraccions grans); el que passa a l'altre membre, en color a les
 *      dues últimes línies; un pas al principi per dir a quina lletra va cada dada; els
 *      passos amb lletres, opcionals (pregunta.opcional del joc de passos).
 *   PASSOS     dades · substitucio · [operacio + equacio] per cada pas · valor · unitat ·
 *              (opcionals) lletres, un per cada pas, amb l'operació a la consigna
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
    formulesOperacio,
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
const SENSE_UNITATS = '(sense unitats)';

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
 * Un pas d'escollir: la bona [text, formules] i les dolentes [[text, codi, formules]], sense
 * repetits (les que també serien bones ja s'han tret). formules: el text de l'opció amb les
 * fórmules entre $…$ (el joc de passos les dibuixa amb KaTeX). linia: el TeX que queda escrit.
 */
function pasTria(id, mena, enunciat, bona, dolentes, linia, plantilla = []) {
    const vistes = new Set([bona[0]]);
    const netes = [];
    for (const [t, codi, f] of dolentes) {
        if (vistes.has(t) || netes.length >= 3) continue;
        vistes.add(t);
        netes.push([t, codi, f]);
    }
    const opcions = shuffle([
        ['b', bona[0], undefined, bona[1]],
        ...netes.map(([t, , f], k) => [`d${k}`, t, undefined, f]),
    ]);
    return {
        id,
        mena,
        nom: T.nomPas[mena],
        enunciat,
        formules: enunciat.includes('$'),
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
function liniaAmbGir(eq, gir, L, marcats = null) {
    if (!gir) return texEq(eq, L, marcats);
    const [a, b] = eq.map(e => tex(e, L, marcats));
    return `\\begin{aligned} ${a} &= ${b} \\\\ ${b} &= ${a} \\end{aligned}`;
}

/** Els nodes que passen a l'altre membre en un pas (es pinten en color a les dues línies). */
function nodesQueEsMouen(p) {
    if (p.op.tipus === 'multiplica') return new Set([p.op.per]);
    if (p.op.tipus === 'divideix') return new Set([p.op.per, ...(p.op.per.t === 'mul' ? p.op.per.f : [])]);
    if (p.op.tipus === 'resta' || p.op.tipus === 'suma') return new Set(p.op.mou.map(t => t.e));
    return null; // l'arrel: no hi passa res d'un membre a l'altre
}

/** Els valors d'una fórmula, amb nombres que encaixen (decimals exactes, positius, dades diferents). */
function valorsDe(f, x) {
    for (let k = 0; k < 400; k++) {
        const v = f.genera();
        // positius, amb pocs decimals i cap 1 (amb un 1, «80 = Δx / 1» ja no tindria res per aïllar)
        const nets = Object.values(v).every(y => signeCoef(y) > 0 && decimals(y) <= 3 && !coefsIguals(y, 1));
        // dues dades iguals no es podrien distingir al pas de dir a quina lletra va cada una
        const dades = Object.keys(v).filter(k2 => k2 !== x);
        const diferents = dades.every((a, i) => dades.slice(i + 1).every(b => !coefsIguals(v[a], v[b])));
        if (nets && diferents && decimals(v[x]) <= 2) return v;
    }
    throw new Error(`no surten valors per a ${f.id}`);
}

/** Les equacions dolentes d'un pas, sense les que es complirien (serien bones). */
function dolentesNetes(pas, valors) {
    return equacionsDolentes(pas).filter(([eq]) => !compleix(eq, valors));
}

/** Una equació com a opció: [text, formules] (la fracció gran, \dfrac, decisió del David). */
const opcioEq = (eq, L) => [textEq(eq), `$${texEq(eq, L)}$`];

const escapaRegex = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * El problema separat en context i pregunta (l'última frase, la que acaba amb «?»), amb les dades
 * entre **…** (en negreta): el nombre i, si la segueix, la seva unitat (una dada pot ser a la pregunta).
 */
function problemaDe(text, dades) {
    let marcat = text;
    for (const [num, unitat] of dades) {
        const amb = unitat && unitat !== SENSE_UNITATS ? `(?:\\s${escapaRegex(unitat)})?` : '';
        // sense «lookbehind» (els iPad antics no el coneixen): el caràcter d'abans es torna a escriure
        marcat = marcat.replace(
            new RegExp(`(^|[^\\d,*])(${escapaRegex(num)}(?![\\d,])${amb})`),
            (t, abans, dada) => `${abans}**${dada}**`
        );
    }
    const m = /^([\s\S]*[.!])\s+([^.!?]*\?)\s*$/.exec(marcat);
    const [context, pregunta] = m ? [m[1], m[2]] : ['', marcat];
    return { context, pregunta };
}

/** «la densitat» → «densitat» (a la llegenda, sense l'article). */
const senseArticle = t => t.replace(/^(el|la|els|les)\s+/i, '').replace(/^l['’]/i, '');

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
    const ks = Object.keys(coneguts);
    const textProblema = ctx.text(valors, fmt);
    const unitatTex = k => (ctx.unitats[k][0] === SENSE_UNITATS ? '' : `\\ ${ctx.unitats[k][1]}`);

    // 0. A quina lletra va cada dada: una casella per dada (en l'ordre del problema) i una targeta per lletra
    const perOrdre = [...ks].sort((a, b) => textProblema.indexOf(fmt(a)) - textProblema.indexOf(fmt(b)));
    const idLletra = k => `l${noms.indexOf(k)}`;
    passos.push({
        id: 'dades',
        mena: 'dades',
        nom: T.nomPas.dades,
        enunciat: T.enunciat.dades,
        plantilla: perOrdre.map((k, i) => ({
            grup: [{ camp: `c${i}` }],
            literal: true,
            titol: ctx.unitats[k][0] === SENSE_UNITATS ? fmt(k) : `${fmt(k)} ${ctx.unitats[k][0]}`,
        })),
        fitxes: shuffle(noms.map(k => ({ id: idLletra(k), tex: L[k] }))),
        camps: Object.fromEntries(perOrdre.map((k, i) => [`c${i}`, 'fitxa'])),
        solucio: Object.fromEntries(perOrdre.map((k, i) => [`c${i}`, idLletra(k)])),
        dades: {
            distractors: Object.fromEntries(
                perOrdre.map((k, i) => [`c${i}`, noms.filter(j => j !== k).map(j => [idLletra(j), 'SUBSTITUCIO'])])
            ),
        },
        linia: `${perOrdre.map(k => `${L[k]} = ${texDecimal(valors[k])}${unitatTex(k)}`).join(',\\quad ')},\\quad ${L[x]} = {?}`,
    });

    // 1. Substituir les dades (les dolentes: dades canviades de lletra)
    const subst = [];
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
            opcioEq(eqNum, L),
            shuffle(subst.filter(([e]) => !compleix(e, valors))).map(([e, c]) => {
                const [t, fo] = opcioEq(e, L);
                return [t, c, fo];
            }),
            texEq(eqNum, L)
        )
    );

    /**
     * Els passos d'una cadena (amb nombres o amb lletres): per a cada operació, l'operació i l'equació
     * (amb nombres) o només l'equació amb l'operació a la consigna (amb lletres). El que passa a l'altre
     * membre es pinta en color a la línia d'abans (marcaAnterior) i a la nova (liniaMarcada).
     */
    function cadena(passosCadena, ambNombres, anterior) {
        let liniaAnterior = anterior; // [equació, gir] de la línia d'abans
        passosCadena.forEach((p, k) => {
            const mouen = nodesQueEsMouen(p);
            const marcaAnterior = mouen ? liniaAmbGir(liniaAnterior[0], liniaAnterior[1], L, mouen) : undefined;
            const dolentes = dolentesNetes(p, valors).map(([e, c]) => {
                const [t, fo] = opcioEq(e, L);
                return [t, c, fo];
            });
            if (ambNombres) {
                const op = pasTria(
                    `op${k + 1}`,
                    'operacio',
                    T.enunciat.operacio(L[x]),
                    [textOperacio(p.op), formulesOperacio(p.op, L)],
                    operacionsDolentes(p.op).map(([o, codi]) => [textOperacio(o), codi, formulesOperacio(o, L)]),
                    texOperacio(p.op, L)
                );
                if (mouen) Object.assign(op, { marcaAnterior, liniaMarcada: texOperacio(p.op, L, true) });
                passos.push(op);
            }
            const eqPas = pasTria(
                ambNombres ? `eq${k + 1}` : `ll${k + 1}`,
                ambNombres ? 'equacio' : 'lletres',
                ambNombres ? T.enunciat.equacio : T.enunciat.lletres(formulesOperacio(p.op, L)),
                opcioEq(p.despres, L),
                dolentes,
                liniaAmbGir(p.despres, p.gira, L)
            );
            if (mouen) {
                eqPas.liniaMarcada = liniaAmbGir(p.despres, p.gira, L, mouen);
                // amb lletres no hi ha pas d'operació: la línia d'abans es marca en resoldre l'equació
                if (!ambNombres) eqPas.marcaAnterior = marcaAnterior;
            }
            passos.push(eqPas);
            liniaAnterior = [p.gira ? gira(p.despres) : p.despres, false];
        });
    }

    // 2. Aïllar amb nombres: l'operació i l'equació equivalent, pas a pas
    cadena(passosNum, true, [eqNum, false]);

    // 3. El valor: de l'última equació amb nombres (la lletra, sola a un membre)
    const ultimNum = passosNum[passosNum.length - 1];
    const costatX = ultimNum.despres[0].t === 'var' && ultimNum.despres[0].n === x ? 0 : 1;
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
    passos.push({
        id: 'valor',
        mena: 'valor',
        nom: T.nomPas.valor,
        enunciat: T.enunciat.valor(L[x]),
        formules: true,
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
            T.enunciat.unitat(L[x]),
            [uText, undefined],
            ctx.dolentes.map(d => [d, 'UNITAT', undefined]),
            `${L[x]} = ${texDecimal(valors[x])}\\ ${uTex}`,
            [{ tex: texEq(ambUnitats, L) }]
        )
    );

    // 5. Les mateixes operacions, amb lletres (opcionals: l'alumne tria si les fa)
    const desDe = passos.length;
    cadena(passosLletres, false, [eq, false]);

    const llegenda = noms.map(k => [
        L[k],
        senseArticle(f.lletres[k][1]),
        ctx.unitats[k][0] === SENSE_UNITATS ? 'sense unitats' : ctx.unitats[k][0],
    ]);
    return {
        tex: '',
        problema: problemaDe(
            textProblema,
            ks.map(k => [fmt(k), ctx.unitats[k][0]])
        ),
        formula: { nom: f.nom, tex: texEq(eq, L), llegenda },
        opcional: {
            desDe,
            pregunta: T.opcional,
            resum: `\\text{${T.resum}}\\ ${L[x]} = ${texDecimal(valors[x])}${unitatTex(x)}`,
            inici: texEq(eq, L),
        },
        text: `${f.nom}: aïllar ${x}`,
        clau: `${f.id}|${x}|${ks.map(fmt).join(',')}`,
        passos,
        dades: { formula: f.id, incognita: x, valors, nivell: nivellDe(f, x), context: textProblema },
    };
}

/** La resposta escrita, per a l'historial: el nombre amb coma, el text de l'opció triada o les lletres. */
export function textRespostaFS(pas, valors) {
    if (pas.camps.r === 'decimal') return textDecimal(valors.r);
    if (pas.mena === 'dades') {
        const lletra = id => (pas.fitxes.find(f => f.id === id) || { tex: '?' }).tex.replace(/\\Delta\s*/g, 'Δ');
        return Object.keys(pas.camps)
            .map(c => lletra(valors[c]))
            .join(', ');
    }
    const opcio = pas.opcions.find(([valor]) => valor === valors.tria);
    return opcio ? opcio[1] : String(valors.tria);
}
