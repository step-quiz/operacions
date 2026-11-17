/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/potencies/reptes-nous.js
 * ROL: Els reptes 4 i 5 de «Potències» (potencies.html, lliurament 15 del full de
 *      ruta, decisions del David del 17/11/2026):
 *        4 · Exponent zero i negatiu: el valor d'una potència (7⁰ = 1, 2⁻³ = 1/2³ =
 *            1/8), les propietats amb exponents negatius (a³ : a⁵ = a⁻², 2⁻³ · 2⁵ =
 *            2², (3⁻²)³ = 3⁻⁶) i la base fraccionària ((2/3)⁻² = (3/2)² = 9/4). Pas a
 *            pas: primer es tria com s'escriu amb exponent positiu (les trampes:
 *            −2³, 2 · (−3)…) i després s'escriu la fracció.
 *        5 · Operacions en notació científica, només × i : (mantisses, exponents i,
 *            si cal, ajustar la mantissa perquè quedi entre 1 i 10).
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, a través de utils.js, perquè les
 *      sessions fixes el puguin sembrar). Cada exercici és dades:
 *        { tipus, text, html, solucioHtml, passos: [pas], dades }
 *      text: l'expressió en text pla; html: la mateixa, per a l'expression-box (sense
 *      «=»); solucioHtml: la cadena que la resol (es mostra en verd si s'esgoten els
 *      intents). Un pas:
 *        { mena: 'tria' | 'exponent' | 'fraccio' | 'decimal' | 'notacio', titol,
 *          on: 'expressio' (les caselles van a l'expression-box) | 'esquema' (a sota),
 *          resultat (HTML que s'afegeix a l'expressió quan el pas és bo, o ''),
 *          solucio, errors: [[valor, codi, missatge]], … }
 *        tria      opcions: [[valor, text]]                 resposta: el valor triat
 *        exponent  base (HTML), prefix (HTML de l'esquema)  resposta: '−2'
 *        fraccio   solucio [n, d]                           resposta: { num, den }
 *        decimal   prefix (HTML), solucio (coeficient)      resposta: '3,2'
 *        notacio   solucio { m, e }                         resposta: { m, e }
 *      comprova(pas, resposta) → { estat: 'ok' | 'error' | 'avis', codi?, missatge? }:
 *      'avis' no resta cap intent (fracció sense simplificar, punt en lloc de coma…).
 *      Els nombres són coeficients exactes (js/algebra/racionals.js).
 * DEPENDÈNCIES: utils.js, algebra/racionals.js.
 * ============================================================================
 */

import { pick, randInt, shuffle } from '../utils.js';
import { coeficient, coefsIguals, comRacional, producteCoef, quocientCoef, textDecimal } from '../algebra/racionals.js';

const MENYS = '−';
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

// ── Escriptura ───────────────────────────────────────────────────────────────
/** Un enter amb el signe menys de veritat. */
const fmt = n => (n < 0 ? `${MENYS}${-n}` : String(n));
/** Un exponent en text: ³, ⁻². */
const supTxt = n => (n < 0 ? '⁻' : '') + [...String(Math.abs(n))].map(c => SUP[c]).join('');
/** Un exponent en HTML. */
const supHtml = n => `<sup class="expr-sup">${fmt(n)}</sup>`;
/** Una fracció en HTML (numerador sobre denominador). */
const fracHtml = (n, d) =>
    `<span class="expr-frac"><span class="expr-frac-num">${n}</span><span class="expr-frac-den">${d}</span></span>`;
/** Una fracció en text: 2/3. */
const fracTxt = (n, d) => `${n}/${d}`;
/** Un decimal amb coma. */
const dec = x => textDecimal(x);
const potTxt = (base, e) => `${base}${supTxt(e)}`;
const potHtml = (base, e) => `${base}${supHtml(e)}`;

// ── Correcció ────────────────────────────────────────────────────────────────
const AVISOS = {
    buit: 'Escriu la resposta.',
    noEnter: 'Escriu un nombre enter (pots fer servir el signe menys).',
    noDecimal: 'Escriu un nombre amb coma decimal (per exemple, 3,2).',
    punt: 'Recorda que has de fer servir coma decimal (,).',
    zero: 'El denominador no pot ser zero.',
    simplifica: 'El valor és correcte, però simplifica la fracció.',
    ajust: 'Els càlculs són correctes, però no és notació científica: la mantissa ha de ser entre 1 i 10.',
};

/** Llegeix un enter («−2», «-2», «5»). null si no ho és. */
function llegeixEnter(text) {
    const t = String(text ?? '')
        .trim()
        .replace(/−/g, '-');
    return /^-?\d+$/.test(t) ? Number(t) : null;
}
/** Llegeix un decimal amb coma: un coeficient, 'punt' o null. */
function llegeixDecimal(text) {
    const t = String(text ?? '')
        .trim()
        .replace(/−/g, '-');
    if (/^-?\d+\.\d+$/.test(t)) return 'punt';
    const m = /^(-?)(\d+)(?:,(\d+))?$/.exec(t);
    if (!m) return null;
    const xifres = m[3] || '';
    return coeficient((m[1] ? -1 : 1) * Number(m[2] + xifres), 10 ** xifres.length);
}
const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
const igualsFraccio = ([a, b], [c, d]) => a * d === b * c;

/** Corregeix la resposta d'un pas: { estat: 'ok' | 'error' | 'avis', codi?, missatge? }. */
export function comprova(pas, resposta) {
    const error = valor => {
        const trobat = pas.errors.find(([v]) => iguals(pas.mena, v, valor));
        return trobat ? { estat: 'error', codi: trobat[1], missatge: trobat[2] } : { estat: 'error' };
    };
    switch (pas.mena) {
        case 'tria':
            if (resposta === null || resposta === undefined) return { estat: 'avis', missatge: AVISOS.buit };
            return resposta === pas.solucio ? { estat: 'ok' } : error(resposta);
        case 'exponent': {
            if (String(resposta ?? '').trim() === '') return { estat: 'avis', missatge: AVISOS.buit };
            const e = llegeixEnter(resposta);
            if (e === null) return { estat: 'avis', missatge: AVISOS.noEnter };
            return e === pas.solucio ? { estat: 'ok' } : error(e);
        }
        case 'fraccio': {
            const [num, den] = [llegeixEnter(resposta && resposta.num), llegeixEnter(resposta && resposta.den)];
            if (num === null || den === null) return { estat: 'avis', missatge: AVISOS.noEnter };
            if (den === 0) return { estat: 'avis', missatge: AVISOS.zero };
            const f = den < 0 ? [-num, -den] : [num, den];
            if (igualsFraccio(f, pas.solucio))
                return mcd(f[0], f[1]) === 1 ? { estat: 'ok' } : { estat: 'avis', missatge: AVISOS.simplifica };
            return error(f);
        }
        case 'decimal': {
            const x = llegeixDecimal(resposta);
            if (x === 'punt') return { estat: 'avis', missatge: AVISOS.punt };
            if (x === null) return { estat: 'avis', missatge: AVISOS.noDecimal };
            return coefsIguals(x, pas.solucio) ? { estat: 'ok' } : error(x);
        }
        case 'notacio': {
            const m = llegeixDecimal(resposta && resposta.m);
            const e = llegeixEnter(resposta && resposta.e);
            if (m === 'punt') return { estat: 'avis', missatge: AVISOS.punt };
            if (m === null || e === null) return { estat: 'avis', missatge: AVISOS.noDecimal };
            if (coefsIguals(m, pas.solucio.m) && e === pas.solucio.e) return { estat: 'ok' };
            const v = producteCoef(m, potencia10(e));
            const bo = producteCoef(pas.solucio.m, potencia10(pas.solucio.e));
            const [n, d] = comRacional(m);
            if (coefsIguals(v, bo) && (Math.abs(n) < d || Math.abs(n) >= 10 * d))
                return { estat: 'avis', missatge: AVISOS.ajust };
            return error({ m, e });
        }
        default:
            return { estat: 'error' };
    }
}
function iguals(mena, v, valor) {
    if (mena === 'fraccio') return igualsFraccio(v, valor);
    if (mena === 'decimal') return coefsIguals(v, valor);
    if (mena === 'notacio') return coefsIguals(v.m, valor.m) && v.e === valor.e;
    return v === valor;
}
const potencia10 = e => (e >= 0 ? 10 ** e : coeficient(1, 10 ** -e));

// ── Passos comuns ────────────────────────────────────────────────────────────
/** Un pas d'escollir (les opcions, barrejades). bona: [valor, text]; dolentes: [[valor, text, codi, missatge]]. */
function pasTria(titol, bona, dolentes, resultat, on = 'botons') {
    const vistes = new Set([bona[0], ...dolentes.map(d => d[0])]);
    if (vistes.size !== dolentes.length + 1) throw new Error('opcions repetides');
    return {
        mena: 'tria',
        titol,
        on,
        opcions: shuffle([bona, ...dolentes].map(([v, t]) => [v, t])),
        solucio: bona[0],
        errors: dolentes.map(([v, , codi, missatge]) => [v, codi, missatge]),
        resultat,
    };
}
/** Els errors d'un pas de valor: sense el bo i sense repetits (el primer mana). */
function nets(mena, solucio, llista) {
    const out = [];
    for (const e of llista) {
        if (iguals(mena, e[0], solucio) || out.some(o => iguals(mena, o[0], e[0]))) continue;
        out.push(e);
    }
    return out;
}

// ── MISSATGES ────────────────────────────────────────────────────────────────
const M = {
    ZERO_ZERO: b =>
        `Qualsevol nombre (que no sigui zero) elevat a 0 val 1: ${potTxt(b, 0)} = 1. Per exemple, 7³ : 7³ = 7⁰, i també = 1.`,
    ZERO_BASE: b =>
        `L'exponent 0 no deixa la base igual: ${potTxt(b, 0)} = 1 (qualsevol nombre que no sigui zero elevat a 0 val 1).`,
    NEG_SIGNE: (a, n) =>
        `Un exponent negatiu no fa negatiu el resultat: vol dir l'invers. ${potTxt(a, -n)} = 1/${potTxt(a, n)}.`,
    NEG_PRODUCTE: (a, n) =>
        `L'exponent no multiplica la base: ${potTxt(a, -n)} = 1/${potTxt(a, n)} (l'invers de ${potTxt(a, n)}).`,
    POTENCIA_PRODUCTE: (a, n) =>
        `Una potència és un producte de factors iguals: ${potTxt(a, n)} = ${Array(n).fill(a).join('·')} = ${a ** n}, no ${a}·${n}.`,
    INVERS_OBLIDAT: (p, q, n) =>
        `L'exponent negatiu vol dir l'invers: cal girar la fracció. (${fracTxt(p, q)})${supTxt(-n)} = (${fracTxt(q, p)})${supTxt(n)}.`,
    OP_EXPONENTS: () =>
        'Amb la mateixa base: en un producte, els exponents se sumen; en un quocient, es resten; en una potència d’una potència, es multipliquen.',
    RESTA_GIRADA: (m, n) =>
        `En un quocient, l'exponent del numerador menys el del denominador: ${fmt(m)} ${MENYS} ${n < 0 ? `(${fmt(n)})` : n} = ${fmt(m - n)}.`,
    EXP_SIGNES: (operacio, r) => `Compte amb els signes: ${operacio} = ${fmt(r)}.`,
    MANTISSA_SUMA: () => 'Les mantisses es multipliquen (no se sumen); els exponents, sí, se sumen.',
    MANTISSA_RESTA: () => 'Les mantisses es divideixen (no es resten); els exponents, sí, es resten.',
    MANTISSA_GIRADA: () => 'Divideix la primera mantissa entre la segona (el dividend entre el divisor).',
    EXP_MULTIPLICA: (e1, e2) =>
        `En multiplicar potències de 10, els exponents se sumen: 10${supTxt(e1)} · 10${supTxt(e2)} = 10${supTxt(e1 + e2)}.`,
    EXP_SUMA_DIVISIO: (e1, e2) =>
        `En dividir potències de 10, els exponents es resten: 10${supTxt(e1)} : 10${supTxt(e2)} = 10${supTxt(e1 - e2)}.`,
    EXP_RESTA_GIRADA: () => 'Resta l’exponent del dividend menys el del divisor (en aquest ordre).',
    AJUST_SENTIT: (m0, e0, m, e) =>
        `Si la mantissa es fa 10 vegades ${m0 > m ? 'més petita' : 'més gran'}, l'exponent ${m0 > m ? 'puja' : 'baixa'} 1: ` +
        `${dec(m0)} · 10${supTxt(e0)} = ${dec(m)} · 10${supTxt(e)}.`,
};
export const MISSATGES_POT = M;

// ══ REPTE 4 · EXPONENT ZERO I NEGATIU ════════════════════════════════════════
const CICLE_4 = ['neg', 'zero', 'prop', 'fracneg', 'neg', 'prop', 'fracneg', 'prop'];
export const TIPUS_4 = ['zero', 'neg', 'fracneg', 'prop'];

/** a⁰: la base pot ser un natural, un negatiu o una fracció. */
function zero() {
    const forma = pick(['n', 'neg', 'frac']);
    let baseTxt, baseHtml;
    if (forma === 'n') baseTxt = baseHtml = String(randInt(2, 15));
    else if (forma === 'neg') {
        const b = randInt(2, 9);
        baseTxt = `(${MENYS}${b})`;
        baseHtml = baseTxt;
    } else {
        const [p, q] = pick([
            [2, 3],
            [3, 4],
            [1, 2],
            [2, 5],
            [5, 3],
        ]);
        baseTxt = `(${fracTxt(p, q)})`;
        baseHtml = `(${fracHtml(p, q)})`;
    }
    const baseValor = baseTxt.replace(/^\((.*)\)$/, '$1');
    return {
        tipus: 'zero',
        text: potTxt(baseTxt, 0),
        html: potHtml(baseHtml, 0),
        solucioHtml: '1',
        dades: { forma, base: baseValor },
        passos: [
            pasTria(
                `Quant val ${potTxt(baseTxt, 0)}?`,
                ['1', '1'],
                [
                    ['0', '0', 'ZERO_ZERO', M.ZERO_ZERO(baseTxt)],
                    [baseValor, baseValor, 'ZERO_BASE', M.ZERO_BASE(baseTxt)],
                ],
                '1'
            ),
        ],
    };
}

/** a⁻ⁿ (a natural): primer, com s'escriu amb exponent positiu; després, la fracció. */
function negatiu() {
    let a, n;
    do [a, n] = [pick([2, 3, 4, 5, 6, 10]), randInt(2, 4)];
    while (a ** n > 1000 || a * n === a ** n);
    const v = a ** n;
    const pas1 = pasTria(
        `Com s'escriu ${potTxt(a, -n)} amb exponent positiu?`,
        ['inv', `1/${potTxt(a, n)}`],
        [
            ['menys', `${MENYS}${potTxt(a, n)}`, 'NEG_SIGNE', M.NEG_SIGNE(a, n)],
            ['prod', `${a} · (${MENYS}${n})`, 'NEG_PRODUCTE', M.NEG_PRODUCTE(a, n)],
            ['invmenys', `${MENYS}1/${potTxt(a, n)}`, 'NEG_SIGNE', M.NEG_SIGNE(a, n)],
        ],
        fracHtml(1, potHtml(a, n))
    );
    const pas2 = {
        mena: 'fraccio',
        titol: `Calcula-ho: escriu el resultat en forma de fracció.`,
        on: 'expressio',
        solucio: [1, v],
        errors: nets(
            'fraccio',
            [1, v],
            [
                [[1, a * n], 'POTENCIA_PRODUCTE', M.POTENCIA_PRODUCTE(a, n)],
                [[-1, v], 'NEG_SIGNE', M.NEG_SIGNE(a, n)],
                [[-1, a * n], 'NEG_PRODUCTE', M.NEG_PRODUCTE(a, n)],
                [[v, 1], 'NEG_SIGNE', M.NEG_SIGNE(a, n)],
            ]
        ),
        resultat: fracHtml(1, v),
    };
    return {
        tipus: 'neg',
        text: potTxt(a, -n),
        html: potHtml(a, -n),
        solucioHtml: `${fracHtml(1, potHtml(a, n))}<span class="expr-eq">=</span>${fracHtml(1, v)}`,
        dades: { a, n },
        passos: [pas1, pas2],
    };
}

/** (p/q)⁻ⁿ: es gira la fracció i s'eleva. */
function fraccioNegativa() {
    const [p, q] = pick([
        [2, 3],
        [3, 4],
        [2, 5],
        [3, 5],
        [3, 2],
        [4, 3],
        [5, 2],
        [5, 3],
        [4, 5],
    ]);
    const n = Math.max(p, q) <= 4 ? randInt(2, 3) : 2;
    const [num, den] = [q ** n, p ** n];
    const base = (x, y) => `(${fracTxt(x, y)})`;
    const pas1 = pasTria(
        `Com s'escriu ${base(p, q)}${supTxt(-n)} amb exponent positiu?`,
        ['inv', `${base(q, p)}${supTxt(n)}`],
        [
            ['menys', `${MENYS}${base(p, q)}${supTxt(n)}`, 'NEG_SIGNE', M.INVERS_OBLIDAT(p, q, n)],
            ['igual', `${base(p, q)}${supTxt(n)}`, 'INVERS_OBLIDAT', M.INVERS_OBLIDAT(p, q, n)],
            ['menysinv', `${MENYS}${base(q, p)}${supTxt(n)}`, 'NEG_SIGNE', M.INVERS_OBLIDAT(p, q, n)],
        ],
        `(${fracHtml(q, p)})${supHtml(n)}`
    );
    const pas2 = {
        mena: 'fraccio',
        titol: 'Calcula-ho: escriu el resultat en forma de fracció.',
        on: 'expressio',
        solucio: [num, den],
        errors: nets(
            'fraccio',
            [num, den],
            [
                [[den, num], 'INVERS_OBLIDAT', M.INVERS_OBLIDAT(p, q, n)],
                [[q * n, p * n], 'POTENCIA_PRODUCTE', M.POTENCIA_PRODUCTE(q, n)],
                [[-num, den], 'NEG_SIGNE', M.INVERS_OBLIDAT(p, q, n)],
            ]
        ),
        resultat: fracHtml(num, den),
    };
    return {
        tipus: 'fracneg',
        text: `${base(p, q)}${supTxt(-n)}`,
        html: `(${fracHtml(p, q)})${supHtml(-n)}`,
        solucioHtml: `(${fracHtml(q, p)})${supHtml(n)}<span class="expr-eq">=</span>${fracHtml(num, den)}`,
        dades: { p, q, n },
        passos: [pas1, pas2],
    };
}

/** Propietats amb exponents negatius: aᵐ : aⁿ, aᵐ · aⁿ, (aᵐ)ⁿ amb algun negatiu. */
function propietat() {
    const base = pick(['a', 'x', '2', '3', '5', '10']);
    const forma = pick(['quot', 'prod', 'powpow']);
    let m, n, r, html, text, op;
    for (;;) {
        if (forma === 'quot') {
            [m, n] = [randInt(2, 6), randInt(2, 8)];
            if (randInt(0, 2) === 0) m = -m; // a⁻² : a³
            r = m - n;
            op = 'resta';
        } else if (forma === 'prod') {
            [m, n] = [-randInt(2, 7), randInt(2, 8)];
            if (randInt(0, 1)) [m, n] = [n, m];
            r = m + n;
            op = 'suma';
        } else {
            [m, n] = [randInt(2, 4), randInt(2, 4)];
            if (randInt(0, 1)) m = -m;
            else n = -n;
            r = m * n;
            op = 'multiplica';
        }
        if (Math.abs(r) >= 2 && m !== n) break;
    }
    const p = (e, ambParentesi = false) => (ambParentesi ? `(${potTxt(base, e)})` : potTxt(base, e));
    if (forma === 'quot') {
        text = `${p(m)} : ${p(n)}`;
        html = `${potHtml(base, m)}<span class="expr-op">:</span>${potHtml(base, n)}`;
    } else if (forma === 'prod') {
        text = `${p(m)} · ${p(n)}`;
        html = `${potHtml(base, m)}<span class="expr-op">·</span>${potHtml(base, n)}`;
    } else {
        text = `(${p(m)})${supTxt(n)}`;
        html = `(${potHtml(base, m)})${supHtml(n)}`;
    }
    const OPS = {
        suma: 'Sumar',
        resta: 'Restar',
        multiplica: 'Multiplicar',
    };
    const pas1 = pasTria(
        'Quina operació cal fer amb els exponents?',
        [op, OPS[op]],
        Object.keys(OPS)
            .filter(k => k !== op)
            .map(k => [k, OPS[k], 'OP_EXPONENTS', M.OP_EXPONENTS()]),
        ''
    );
    const escrit = x => (x < 0 ? `(${fmt(x)})` : String(x));
    const operacio =
        forma === 'quot'
            ? `${fmt(m)} ${MENYS} ${escrit(n)}`
            : forma === 'prod'
              ? `${fmt(m)} + ${escrit(n)}`
              : `${escrit(m)} · ${escrit(n)}`;
    const errorsExp = [];
    if (forma === 'quot') errorsExp.push([n - m, 'RESTA_GIRADA', M.RESTA_GIRADA(m, n)]);
    errorsExp.push([-r, 'EXP_SIGNES', M.EXP_SIGNES(operacio, r)]);
    if (forma === 'prod') errorsExp.push([-(Math.abs(m) + Math.abs(n)), 'EXP_SIGNES', M.EXP_SIGNES(operacio, r)]);
    if (forma === 'quot') errorsExp.push([m + n, 'OP_EXPONENTS', M.OP_EXPONENTS()]);
    if (forma === 'prod') errorsExp.push([m * n, 'OP_EXPONENTS', M.OP_EXPONENTS()]);
    if (forma === 'powpow') errorsExp.push([m + n, 'OP_EXPONENTS', M.OP_EXPONENTS()]);
    const pas2 = {
        mena: 'exponent',
        titol: "Escriu l'exponent:",
        on: 'expressio',
        base,
        solucio: r,
        errors: nets('exponent', r, errorsExp),
        resultat: potHtml(base, r),
    };
    const passos = [pas1, pas2];
    let solucioHtml = potHtml(base, r);
    if (r < 0) {
        const k = -r;
        passos.push(
            pasTria(
                `Com s'escriu ${potTxt(base, r)} amb exponent positiu?`,
                ['inv', `1/${potTxt(base, k)}`],
                [
                    ['menys', `${MENYS}${potTxt(base, k)}`, 'NEG_SIGNE', M.NEG_SIGNE(base, k)],
                    ['igual', potTxt(base, k), 'NEG_SIGNE', M.NEG_SIGNE(base, k)],
                    ['invmenys', `${MENYS}1/${potTxt(base, k)}`, 'NEG_SIGNE', M.NEG_SIGNE(base, k)],
                ],
                fracHtml(1, potHtml(base, k))
            )
        );
        solucioHtml += `<span class="expr-eq">=</span>${fracHtml(1, potHtml(base, k))}`;
    }
    return { tipus: 'prop', text, html, solucioHtml, dades: { forma, base, m, n, r }, passos };
}

/** Un exercici del repte 4: el tipus segueix un cicle al llarg de la sessió. */
export function generaRepte4(opIdx = 0) {
    const tipus = CICLE_4[opIdx % CICLE_4.length];
    return { zero, neg: negatiu, fracneg: fraccioNegativa, prop: propietat }[tipus]();
}

// ══ REPTE 5 · OPERACIONS EN NOTACIÓ CIENTÍFICA (× i :) ═══════════════════════
const UN_DECIMAL = () => coeficient(randInt(11, 99), 10);
/** Quants decimals té un coeficient (el seu denominador divideix 10ᵗ); 99 si no és un decimal exacte. */
const decimals = x => {
    const d = comRacional(x)[1];
    for (let t = 0; t <= 12; t++) if (10 ** t % d === 0) return t;
    return 99;
};
const valorNum = x => {
    const [n, d] = comRacional(x);
    return n / d;
};
const notHtml = (m, e) => `${dec(m)}&thinsp;·&thinsp;10${supHtml(e)}`;
const notTxt = (m, e) => `${dec(m)} · 10${supTxt(e)}`;

/** Les mantisses i els exponents d'una operació: { m1, e1, m2, e2, op, m0 (sense ajustar), e0, m, e }. */
function operandsRepte5(op) {
    for (;;) {
        let m1, m2;
        if (op === '·') {
            m1 = UN_DECIMAL();
            m2 = pick([2, 3, 4, 5, 6, 7, 8, 9, coeficient(15, 10), coeficient(25, 10), coeficient(12, 10)]);
        } else {
            m2 = pick([2, 4, 5, 8, coeficient(25, 10), coeficient(16, 10), coeficient(125, 100)]);
            m1 = UN_DECIMAL();
        }
        const e1 = randInt(-9, 12),
            e2 = randInt(-9, 9);
        const m0 = op === '·' ? producteCoef(m1, m2) : quocientCoef(m1, m2);
        const e0 = op === '·' ? e1 + e2 : e1 - e2;
        if (decimals(m0) > 3 || coefsIguals(m1, m2) || e1 === 0 || e2 === 0 || Math.abs(e0) > 15) continue;
        let m = m0,
            e = e0;
        if (valorNum(m0) >= 10) {
            m = quocientCoef(m0, 10);
            e = e0 + 1;
        } else if (valorNum(m0) < 1) {
            m = producteCoef(m0, 10);
            e = e0 - 1;
        }
        if (decimals(m) > 3 || e0 === 0 || e === 0) continue;
        return { m1, e1, m2, e2, op, m0, e0, m, e };
    }
}

/** Un exercici del repte 5: alterna producte i quocient. */
export function generaRepte5(opIdx = 0) {
    const op = opIdx % 2 === 0 ? '·' : ':';
    const d = operandsRepte5(op);
    const { m1, e1, m2, e2, m0, e0, m, e } = d;
    const opHtml = `<span class="expr-op">${op}</span>`;
    const html = `(${notHtml(m1, e1)})${opHtml}(${notHtml(m2, e2)})`;
    const text = `(${notTxt(m1, e1)}) ${op} (${notTxt(m2, e2)})`;
    const producte = op === '·';
    const pas1 = {
        mena: 'decimal',
        titol: producte ? 'Multiplica les mantisses:' : 'Divideix les mantisses:',
        on: 'esquema',
        prefix: `${dec(m1)} ${op} ${dec(m2)}`,
        solucio: m0,
        errors: nets(
            'decimal',
            m0,
            producte
                ? [[coeficient(...sumaParts(m1, m2)), 'MANTISSA_SUMA', M.MANTISSA_SUMA()]]
                : [
                      [coeficient(...restaParts(m1, m2)), 'MANTISSA_RESTA', M.MANTISSA_RESTA()],
                      [quocientCoef(m2, m1), 'MANTISSA_GIRADA', M.MANTISSA_GIRADA()],
                  ]
        ).filter(([v]) => decimals(v) <= 6),
        resultat: '',
    };
    const errorsExp = producte
        ? [
              [e1 * e2, 'EXP_MULTIPLICA', M.EXP_MULTIPLICA(e1, e2)],
              [e1 - e2, 'EXP_MULTIPLICA', M.EXP_MULTIPLICA(e1, e2)],
          ]
        : [
              [e1 + e2, 'EXP_SUMA_DIVISIO', M.EXP_SUMA_DIVISIO(e1, e2)],
              [e2 - e1, 'EXP_RESTA_GIRADA', M.EXP_RESTA_GIRADA()],
          ];
    const pas2 = {
        mena: 'exponent',
        titol: producte
            ? 'Ara les potències de 10: suma els exponents.'
            : 'Ara les potències de 10: resta els exponents.',
        on: 'esquema',
        prefix: `10${supHtml(e1)} ${op} 10${supHtml(e2)}`,
        base: '10',
        solucio: e0,
        errors: nets('exponent', e0, errorsExp),
        resultat: notHtml(m0, e0),
    };
    const passos = [pas1, pas2];
    const ajust = !coefsIguals(m, m0);
    if (ajust) {
        const malSentit = e0 + (e0 - e); // l'exponent mogut cap a l'altre costat
        passos.push({
            mena: 'notacio',
            titol: 'La mantissa ha de ser entre 1 i 10: escriu el resultat en notació científica.',
            on: 'expressio',
            solucio: { m, e },
            // Sense ajustar (32 · 10²), el valor és bo: comprova() hi dona un avís, que no resta cap intent
            errors: [[{ m, e: malSentit }, 'AJUST_SENTIT', M.AJUST_SENTIT(m0, e0, m, e)]],
            resultat: notHtml(m, e),
        });
    }
    return {
        tipus: producte ? 'producte' : 'quocient',
        text,
        html,
        solucioHtml: notHtml(m0, e0) + (ajust ? `<span class="expr-eq">=</span>${notHtml(m, e)}` : ''),
        dades: d,
        passos,
    };
}
// m1 + m2 i m1 − m2 com a [numerador, denominador] (per als errors de les mantisses)
function sumaParts(x, y) {
    const [[a, b], [c, d]] = [comRacional(x), comRacional(y)];
    return [a * d + c * b, b * d];
}
function restaParts(x, y) {
    const [[a, b], [c, d]] = [comRacional(x), comRacional(y)];
    return [a * d - c * b, b * d];
}

/** Escriptura comuna, per al controlador i les proves. */
export const ESCRIPTURA_POT = { fmt, supTxt, supHtml, fracHtml, potHtml, notHtml, dec };
