/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/logaritmes/math-engine.js
 * ROL: «Logaritmes i equacions» (logaritmes.html, Batx, sense codi), bloc 1:
 *      logaritmes. Exercicis i passos del joc de passos (js/passos/joc-passos.js).
 *      Decisions del David (21/11/2026, artefacte de revisió del 22): sense canvi
 *      de base; amb calculadora sí (log i ln amb 4 decimals).
 * ARQUITECTURA: mòdul pur. L'atzar, amb Math.random.
 *
 *   TIPUS
 *   definicio    logₐ x per la definició: x com a potència de a, i el logaritme (racional)
 *   forma        de forma logarítmica a exponencial, o al revés (caselles)
 *   propietats   desenvolupar log(aᵖbᵠ/cʳ) o agrupar en un sol logaritme (4 opcions)
 *   calcul       calcular amb propietats: log₂ 24 − log₂ 3 = log₂ 8 = 3 (4 opcions + valor)
 *   calculadora  log x o ln x: el signe (abans de calcular) i el valor amb 4 decimals
 *   NIVELLS      1 definició (exponents naturals) i forma · 2 definició (exponents negatius i
 *                fraccionaris), calcular amb propietats i calculadora · 3 desenvolupar i agrupar,
 *                i calcular amb un coeficient (2 log 5 + log 4)
 * DEPENDÈNCIES: algebra/racionals.js, strings.js.
 * ============================================================================
 */

import { racional, texDecimal, texRacional } from '../algebra/racionals.js';
import { TEXTOS_LG } from './strings.js';

const T = TEXTOS_LG;
const triaLG = arr => arr[Math.floor(Math.random() * arr.length)];
const barrejaLG = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// ── Notació ─────────────────────────────────────────────────────────────────
/** log en TeX: base 10 → \log, e → \ln, altres → \log_{b}. */
export const texLog = b => (b === 10 ? '\\log' : b === 'e' ? '\\ln' : `\\log_{${b}}`);
const texBase = b => (b === 'e' ? 'e' : String(b));
/** bᵏ (k racional [n, d]) com a valor en TeX: 8, \tfrac{1}{9}, 0{,}01, e^{3}, \sqrt{e}, \tfrac{1}{e^{2}}. */
export function texPotenciaValor(b, [n, d]) {
    if (b === 'e') {
        if (d === 2 && n === 1) return '\\sqrt{e}';
        if (d === 1 && n === 0) return '1';
        if (d === 1 && n === 1) return 'e';
        if (d === 1 && n > 0) return `e^{${n}}`;
        if (d === 1 && n < 0) return `\\tfrac{1}{${n === -1 ? 'e' : `e^{${-n}}`}}`;
        throw new Error(`e^${n}/${d}`);
    }
    const v = b ** (n / d);
    const enter = Math.round(v);
    if (Math.abs(v - enter) < 1e-9) return String(enter);
    if (b === 10) return texDecimal(racional(1, Math.round(1 / v)));
    const inv = Math.round(1 / v);
    if (Math.abs(1 / v - inv) < 1e-9) return `\\tfrac{1}{${inv}}`;
    throw new Error(`${b}^${n}/${d} no és enter ni 1/enter`);
}
const opcio = (valor, tex) => [valor, tex, null, `$${tex}$`];
function triaOpcionsLG(bona, falses) {
    const vistes = new Set([bona]);
    const ops = [opcio('ok', bona)];
    const usats = {};
    for (const [err, tex] of falses) {
        if (ops.length >= 4) break;
        if (vistes.has(tex)) continue;
        vistes.add(tex);
        usats[err] = (usats[err] || 0) + 1;
        ops.push(opcio(usats[err] > 1 ? `${err}#${usats[err]}` : err, tex));
    }
    return barrejaLG(ops);
}

// ═════════════════════════════════════════════════════════════════════════════
// TIPUS
// ═════════════════════════════════════════════════════════════════════════════
/** logₐ x per la definició. Nivell 1: exponents naturals; nivell 2: negatius i fraccionaris. */
export function exerciciDefinicio(nivell) {
    let b;
    let k;
    let base = null; // si la base és una potència c^m (exponents fraccionaris)
    if (nivell <= 1) {
        b = triaLG([2, 3, 5, 10, 'e']);
        const max = { 2: 6, 3: 4, 5: 3, 10: 4, e: 4 }[b];
        k = racional(Math.floor(Math.random() * (max + 1)));
    } else if (Math.random() < 0.5) {
        b = triaLG([2, 3, 5, 10, 'e']);
        const max = { 2: 4, 3: 3, 5: 2, 10: 4, e: 3 }[b];
        k = racional(-1 - Math.floor(Math.random() * max));
        if (b === 'e' && Math.random() < 0.3) k = racional(1, 2);
    } else {
        // La base és c^m i l'argument c^j: logₐ x = j/m (no enter)
        const c = triaLG([2, 3]);
        const m = triaLG(c === 2 ? [2, 3] : [2, 3]);
        let j;
        do j = triaLG([-3, -2, -1, 1, 2, 3, 4]);
        while (j % m === 0 || (c === 3 && Math.abs(j) > 3));
        b = c ** m;
        base = { c, m };
        k = racional(j, m);
    }
    const xTex = texPotenciaValor(b, k);
    const bTex = texBase(b);
    const logTex = `${texLog(b)} ${xTex.startsWith('\\tfrac') || xTex.includes('{,}') ? `\\left(${xTex}\\right)` : xTex}`;
    const kTex = texRacional(k).replace('\\dfrac', '\\tfrac');
    const potTex = `${bTex}^{${texRacional(k).replace('\\dfrac', '\\frac')}}`;
    const dades = { b, k, base, x: b === 'e' ? Math.E ** (k[0] / k[1]) : b ** (k[0] / k[1]) };
    return {
        tipus: 'definicio',
        tex: `${logTex}`,
        que: 'Calcula',
        passos: [
            {
                id: 'potencia',
                mena: 'potencia',
                nom: T.nomPas.potencia,
                enunciat: T.enunciat.potencia(bTex, xTex),
                formules: true,
                plantilla: [{ grup: [{ tex: `${xTex} = ${bTex}^{\\,k},\\quad k =` }, { camp: 'k' }] }],
                camps: { k: 'racional' },
                solucio: { k },
                nota: T.nota.racional,
                dades,
                linia: `${xTex} = ${potTex}`,
            },
            {
                id: 'valor',
                mena: 'valor',
                nom: T.nomPas.valor,
                enunciat: T.enunciat.valor,
                formules: true,
                plantilla: [{ grup: [{ tex: `${logTex} =` }, { camp: 'v' }] }],
                camps: { v: 'racional' },
                solucio: { v: k },
                nota: T.nota.racional,
                dades,
                linia: `${logTex} = ${texLog(b)} ${potTex} = ${kTex}`,
            },
        ],
    };
}

/** De forma logarítmica a exponencial, o al revés (bases 2 a 5, exponents de −3 a 4). */
export function exerciciForma() {
    const b = triaLG([2, 3, 4, 5]);
    const max = { 2: 5, 3: 4, 4: 3, 5: 3 }[b];
    let k;
    do k = -2 + Math.floor(Math.random() * (max + 3));
    while (k === 0 || k === 1);
    const kq = racional(k);
    const x = k > 0 ? racional(b ** k) : racional(1, b ** -k);
    const xTex = texRacional(x);
    const aExp = Math.random() < 0.5;
    const logTex = `\\log_{${b}} ${k < 0 ? `\\left(${xTex}\\right)` : xTex} = ${k}`;
    const expTex = `${b}^{${k}} = ${xTex}`;
    const comu = {
        id: 'forma',
        mena: 'forma',
        nom: T.nomPas.forma,
        formules: true,
        nota: T.nota.racional,
        dades: { b, k, x, aExp },
    };
    if (aExp)
        return {
            tipus: 'forma',
            tex: logTex,
            que: 'Forma exponencial de',
            passos: [
                {
                    ...comu,
                    enunciat: T.enunciat.aExponencial,
                    plantilla: [
                        { grup: [{ tex: '\\text{base} =' }, { camp: 'a' }] },
                        { grup: [{ tex: '\\text{exponent} =' }, { camp: 'y' }] },
                        { grup: [{ tex: '\\text{resultat} =' }, { camp: 'x' }] },
                    ],
                    camps: { a: 'enter', y: 'racional', x: 'racional' },
                    solucio: { a: b, y: kq, x },
                    linia: `${logTex} \\iff ${expTex}`,
                },
            ],
        };
    return {
        tipus: 'forma',
        tex: expTex,
        que: 'Forma logarítmica de',
        passos: [
            {
                ...comu,
                enunciat: T.enunciat.aLogaritmica,
                plantilla: [
                    { grup: [{ tex: '\\text{base} =' }, { camp: 'a' }] },
                    { grup: [{ tex: '\\text{argument} =' }, { camp: 'x' }] },
                    { grup: [{ tex: '\\text{valor del logaritme} =' }, { camp: 'y' }] },
                ],
                camps: { a: 'enter', x: 'racional', y: 'racional' },
                solucio: { a: b, x, y: kq },
                linia: `${expTex} \\iff ${logTex}`,
            },
        ],
    };
}

/** Desenvolupar log(aᵖbᵠ/cʳ) o agrupar p log a + q log b − r log c. */
export function exerciciPropietats() {
    const [p, q, r] = [triaLG([1, 2, 3]), triaLG([1, 2, 3]), triaLG([2, 3, 4])];
    const pot = (v, e) => (e === 1 ? v : `${v}^{${e}}`);
    const coef = (e, v) => `${e === 1 ? '' : e}\\log ${v}`;
    const arg = `\\dfrac{${pot('a', p)}\\,${pot('b', q)}}{${pot('c', r)}}`;
    const desenvolupat = `${coef(p, 'a')} + ${coef(q, 'b')} - ${coef(r, 'c')}`;
    if (Math.random() < 0.5) {
        const falses = [
            ['LG_QUOCIENT_SIGNE', `${coef(p, 'a')} + ${coef(q, 'b')} + ${coef(r, 'c')}`],
            [
                'LG_POTENCIA',
                `${p === 1 ? '\\log a' : `(\\log a)^{${p}}`} + ${q === 1 ? '\\log b' : `(\\log b)^{${q}}`} - ${`(\\log c)^{${r}}`}`,
            ],
            ['LG_PRODUCTE_LOGS', `${coef(p, 'a')} \\cdot ${coef(q, 'b')} - ${coef(r, 'c')}`],
            ['LG_QUOCIENT_LOGS', `\\dfrac{${coef(p, 'a')} + ${coef(q, 'b')}}{${coef(r, 'c')}}`],
        ];
        return {
            tipus: 'propietats',
            tex: `\\log ${arg}`,
            que: 'Desenvolupa',
            passos: [
                {
                    id: 'propietats',
                    mena: 'tria',
                    nom: T.nomPas.propietats,
                    enunciat: T.enunciat.desenvolupa,
                    formules: true,
                    plantilla: [],
                    camps: { tria: 'tria' },
                    solucio: { tria: 'ok' },
                    opcions: triaOpcionsLG(desenvolupat, falses),
                    dades: { p, q, r },
                    linia: `\\log ${arg} = ${desenvolupat}`,
                },
            ],
        };
    }
    const falses = [
        ['LG_SUMA', `\\log\\left(${pot('a', p)} + ${pot('b', q)} - ${pot('c', r)}\\right)`],
        ['LG_COEF', `\\log \\dfrac{${p === 1 ? '' : p}a\\cdot ${q === 1 ? '' : q}b}{${r}c}`],
        ['LG_QUOCIENT_SIGNE', `\\log\\left(${pot('a', p)}\\,${pot('b', q)}\\,${pot('c', r)}\\right)`],
        ['LG_QUOCIENT_LOGS', `\\dfrac{\\log\\left(${pot('a', p)}\\,${pot('b', q)}\\right)}{\\log ${pot('c', r)}}`],
    ];
    return {
        tipus: 'propietats',
        tex: desenvolupat,
        que: 'Agrupa en un sol logaritme:',
        passos: [
            {
                id: 'propietats',
                mena: 'tria',
                nom: T.nomPas.agrupa,
                enunciat: T.enunciat.agrupa,
                formules: true,
                plantilla: [],
                camps: { tria: 'tria' },
                solucio: { tria: 'ok' },
                opcions: triaOpcionsLG(`\\log ${arg}`, falses),
                dades: { p, q, r },
                linia: `${desenvolupat} = \\log ${arg}`,
            },
        ],
    };
}

/** Calcular amb propietats: logₐ M ± logₐ N (o c·logₐ M + logₐ N, nivell 3) = logₐ aᵏ = k. */
export function exerciciCalcul(nivell) {
    for (;;) {
        const b = triaLG([2, 3, 5, 6, 10]);
        const k = triaLG(b >= 6 ? [1, 2] : [1, 2, 3]);
        const bk = b ** k;
        const lg = texLog(b);
        let expr;
        let agrupat;
        let falses;
        let M;
        let N;
        let c = 1;
        const mode = nivell >= 3 ? triaLG(['coef', 'suma', 'resta']) : triaLG(['suma', 'resta']);
        if (mode === 'suma') {
            const divs = [];
            for (let d = 2; d < bk; d++) if (bk % d === 0 && d !== b && bk / d !== b) divs.push(d);
            if (!divs.length) continue;
            M = triaLG(divs);
            N = bk / M;
            expr = `${lg} ${M} + ${lg} ${N}`;
            agrupat = `${lg} (${M}\\cdot ${N})`;
            falses = [
                ['LG_SUMA', `${lg} (${M} + ${N})`],
                ['LG_PRODUCTE_LOGS', `${lg} ${M} \\cdot ${lg} ${N}`],
                ['LG_RESTA', `${lg} \\dfrac{${M}}{${N}}`],
            ];
        } else if (mode === 'resta') {
            N = triaLG([2, 3, 4, 5, 6, 7].filter(n => n !== b && n % b !== 0 && b % n !== 0));
            if (!N) continue;
            M = bk * N;
            expr = `${lg} ${M} - ${lg} ${N}`;
            agrupat = `${lg} \\dfrac{${M}}{${N}}`;
            falses = [
                ['LG_RESTA', `${lg} (${M} - ${N})`],
                ['LG_QUOCIENT_LOGS', `\\dfrac{${lg} ${M}}{${lg} ${N}}`],
                ['LG_ORDRE', `${lg} \\dfrac{${N}}{${M}}`],
            ];
        } else {
            // c·logₐ M + logₐ N, amb Mᶜ·N = aᵏ
            c = 2;
            const opcions = [];
            for (let m = 2; m * m <= bk; m++)
                if (bk % (m * m) === 0 && bk / (m * m) > 1 && m !== b && m !== 2) opcions.push(m); // m = 2: 2·m = m²
            if (!opcions.length) continue;
            M = triaLG(opcions);
            N = bk / (M * M);
            if (N === b) continue;
            expr = `${c}${lg} ${M} + ${lg} ${N}`;
            agrupat = `${lg} (${M}^{${c}}\\cdot ${N})`;
            falses = [
                ['LG_COEF', `${lg} (${c}\\cdot ${M}\\cdot ${N})`],
                ['LG_SUMA', `${lg} (${M}^{${c}} + ${N})`],
                ['LG_POTENCIA', `(${lg} ${M})^{${c}} + ${lg} ${N}`],
            ];
        }
        const dades = { b, k, M, N, c, mode, bk };
        return {
            tipus: 'calcul',
            tex: expr,
            que: 'Calcula',
            passos: [
                {
                    id: 'agrupa',
                    mena: 'tria',
                    nom: T.nomPas.agrupa,
                    enunciat: T.enunciat.agrupaCalcul,
                    formules: true,
                    plantilla: [],
                    camps: { tria: 'tria' },
                    solucio: { tria: 'ok' },
                    opcions: triaOpcionsLG(agrupat, falses),
                    dades,
                    linia: `${expr} = ${agrupat} = ${lg} ${bk}`,
                },
                {
                    id: 'valorCalcul',
                    mena: 'valorCalcul',
                    nom: T.nomPas.valorCalcul,
                    enunciat: T.enunciat.valorCalcul,
                    formules: true,
                    plantilla: [{ grup: [{ tex: `${lg} ${bk} =` }, { camp: 'v' }] }],
                    camps: { v: 'enter' },
                    solucio: { v: k },
                    dades,
                    linia: `${lg} ${bk} = ${k} \\quad (${texBase(b)}^{${k}} = ${bk})`,
                },
            ],
        };
    }
}

/** log x o ln x amb la calculadora: primer el signe; després el valor (4 decimals, sense signe). */
export function exerciciCalculadora() {
    const b = triaLG([10, 'e']);
    const petit = Math.random() < 0.45;
    const x = petit
        ? triaLG([0.02, 0.05, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9])
        : triaLG([2, 3, 5, 7, 12, 15, 20, 30, 45, 50, 75, 150, 200, 500]);
    if (b === 10 && [0.1].includes(x)) return exerciciCalculadora();
    const v = b === 10 ? Math.log10(x) : Math.log(x);
    const negatiu = v < 0;
    const xTex = Number.isInteger(x) ? String(x) : String(x).replace('.', '{,}');
    const logTex = `${texLog(b)} ${xTex}`;
    const abs4 = Math.round(Math.abs(v) * 1e4) / 1e4;
    return {
        tipus: 'calculadora',
        tex: logTex,
        que: 'Calcula',
        passos: [
            {
                id: 'signe',
                mena: 'tria',
                nom: T.nomPas.signe,
                enunciat: T.enunciat.signe,
                formules: true,
                plantilla: [],
                camps: { tria: 'tria' },
                solucio: { tria: 'ok' },
                opcions: [
                    [negatiu ? 'LG_SIGNE_CALC' : 'ok', T.opcions.positiu],
                    [negatiu ? 'ok' : 'LG_SIGNE_CALC', T.opcions.negatiu],
                ],
                dades: { b, x },
                linia: `${xTex} ${x < 1 ? '<' : '>'} 1 \\;\\Rightarrow\\; ${logTex} ${negatiu ? '< 0' : '> 0'}`,
            },
            {
                id: 'calculadora',
                mena: 'calculadora',
                nom: T.nomPas.calculadora,
                enunciat: T.enunciat.calculadora,
                formules: true,
                plantilla: [{ grup: [{ tex: `${logTex} \\approx ${negatiu ? '-' : ''}` }, { camp: 'v' }] }],
                camps: { v: 'decimal' },
                solucio: { v: abs4 },
                tolerancia: { v: 1e-4 },
                nota: T.nota.decimals,
                dades: { b, x, v },
                linia: `${logTex} \\approx ${negatiu ? '-' : ''}${texDecimal(racional(Math.round(abs4 * 1e4), 1e4))}`,
            },
        ],
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// LA PREGUNTA
// ═════════════════════════════════════════════════════════════════════════════
const PER_NIVELL = {
    1: [() => exerciciDefinicio(1), () => exerciciDefinicio(1), exerciciForma],
    2: [() => exerciciDefinicio(2), () => exerciciCalcul(2), exerciciCalculadora],
    3: [exerciciPropietats, () => exerciciCalcul(3), () => exerciciDefinicio(2)],
};
/** Una pregunta del nivell (1 a 3). */
export function generaPreguntaLG({ nivell = 1 } = {}) {
    const ex = triaLG(PER_NIVELL[Math.min(3, Math.max(1, nivell))])();
    // La línia de dalt: què es demana i l'expressió («Calcula  log₂ 8»)
    return { ...ex, tex: `\\text{${ex.que} } ${ex.tex}`, text: ex.que, clau: `${ex.tipus}|${ex.tex}` };
}
