/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/equacions-segon-grau.test.js
 * ROL: Tests d'«Equacions de 2n grau» (js/equacions-segon-grau/): les
 *      equacions que es generen, els passos, la correcció i el diagnòstic dels
 *      errors típics.
 * ARQUITECTURA:
 * - Es generen milers d'equacions de cada tipus i nivell. Les solucions es
 *   comproven aquí substituint-les a l'equació original amb aritmètica exacta
 *   (les «per ordenar», membre a membre, tal com estan escrites), sense fer
 *   servir la fórmula del motor.
 * - Cada equació es resol pas a pas com ho faria l'alumne: la resposta bona
 *   s'accepta, les dues solucions valen en qualsevol ordre, una fracció sense
 *   simplificar només avisa i una resposta equivocada assenyala la casella.
 * - Cada error de la taxonomia es provoca amb una resposta feta a mà.
 * ÚS: node tests/equacions-segon-grau.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');

const FITXERS = [
    'js/utils.js',
    'js/algebra/racionals.js',
    'js/algebra/polinomis.js',
    'js/passos/correccio.js',
    'js/equacions-segon-grau/strings.js',
    'js/equacions-segon-grau/math-engine.js',
    'js/equacions-segon-grau/errors.js',
];
const w = loadModule(FITXERS, { seed: 2026 });
const { TIPUS_SG, TEXTOS_SG, ERRORS_SG } = w;

const TIPUS = ['completa', 'senseB', 'senseC', 'ordenar', 'biquadrada'];
const PER_COMBINACIO = 1500;
const BAD_TEXT =
    /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b|[+\-−] [+\-−]|(?<![\d.])1x|(?<![\d.])1t/;

// ── Aritmètica exacta, independent del motor ─────────────────────────────────
const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
const Q = (n, d = 1) => {
    const g = mcd(n, d) || 1;
    return d < 0 ? [-n / g, -d / g] : [n / g, d / g];
};
const suma = (x, y) => Q(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
const prod = (x, y) => Q(x[0] * y[0], x[1] * y[1]);
const pot = (x, n) => Array.from({ length: n }).reduce(acc => prod(acc, x), Q(1));
const polinomi = (termes, x) => termes.reduce((acc, [coef, grau]) => suma(acc, prod(Q(coef), pot(x, grau))), Q(0));
// Un membre d'una equació per ordenar: producte de trossos { t: termes } o { par: termes, exp }
const membre = (trossos, x) =>
    trossos.reduce(
        (acc, tros) => prod(acc, tros.t ? polinomi(tros.t, x) : pot(polinomi(tros.par, x), tros.exp || 1)),
        Q(1)
    );
// Quant val (primer membre − segon membre) de l'equació original en x
function residu(e, x) {
    if (e.tipus === 'ordenar') {
        const dre = membre(e.membres[1], x);
        return suma(membre(e.membres[0], x), [-dre[0], dre[1]]);
    }
    const graus = e.tipus === 'biquadrada' ? [4, 2, 0] : [2, 1, 0];
    return polinomi(
        [e.a, e.b, e.c].map((coef, i) => [coef, graus[i]]),
        x
    );
}
// Quantes solucions reals diferents té l'equació, comptades aquí pel signe del discriminant. A les
// «per ordenar», abans es comprova que ax² + bx + c és de debò (primer membre − segon membre): dos
// polinomis de 2n grau que coincideixen en tres punts són el mateix.
function nombreDeSolucions(e) {
    const { a, b, c } = e;
    if (e.tipus === 'ordenar' && [0, 1, -2].some(x => residu(e, Q(x))[0] !== a * x * x + b * x + c)) return -1;
    const delta = b * b - 4 * a * c;
    if (e.tipus !== 'biquadrada') return delta > 0 ? 2 : delta === 0 ? 1 : 0;
    if (delta < 0) return 0;
    const ts = [...new Set([1, -1].map(s => (-b + s * Math.sqrt(delta)) / (2 * a)))];
    return ts.reduce((n, t) => n + (t > 0 ? 2 : t === 0 ? 1 : 0), 0);
}

// ── Respostes ────────────────────────────────────────────────────────────────
const comQ = v => (Array.isArray(v) ? v : [v, 1]);
// La resposta bona d'un pas, tal com l'escriuria l'alumne
function respostaBona(pas, { denominadorEnBlanc = false } = {}) {
    const resp = {};
    for (const [nom, tipus] of Object.entries(pas.camps)) {
        const s = pas.solucio[nom];
        if (tipus === 'tria') resp[nom] = s;
        else if (tipus === 'enter') resp[nom] = String(s);
        else resp[nom] = { n: String(s[0]), d: s[1] === 1 && denominadorEnBlanc ? '' : String(s[1]) };
    }
    return resp;
}
const clona = o => JSON.parse(JSON.stringify(o));

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Equacions generades: coeficients, escriptura i solucions');
{
    for (const tipus of TIPUS) {
        for (const nivell of [1, 2, 3]) {
            const errors = [];
            const nSols = new Set();
            const vistes = new Set();
            for (let i = 0; i < PER_COMBINACIO && errors.length < 3; i++) {
                const e = w.generaEquacioSG(tipus, nivell);
                const err = msg => errors.push(`${e.text}: ${msg}`);
                vistes.add(e.tex);
                if (e.tipus !== tipus) err(`tipus ${e.tipus}`);
                if (![e.a, e.b, e.c].every(Number.isInteger) || e.a === 0) err('coeficients');
                if (
                    tipus === 'senseB'
                        ? e.b !== 0 || e.c === 0
                        : tipus === 'senseC'
                          ? e.c !== 0 || e.b === 0
                          : e.b === 0
                )
                    err('termes que hi falten o hi sobren');
                if ((tipus === 'completa' || tipus === 'ordenar') && e.c === 0) err('c = 0');
                if (BAD_TEXT.test(e.tex) || BAD_TEXT.test(e.text) || !e.tex.includes('=')) err(`escriptura «${e.tex}»`);
                const delta = e.b * e.b - 4 * e.a * e.c;
                if (delta > 0 && !Number.isInteger(Math.sqrt(delta))) err(`Δ = ${delta} no és un quadrat`);
                // Les solucions del motor anul·len l'equació original, i no n'hi ha cap més
                const sols = w.resolEquacioSG(e);
                if (sols.some(s => residu(e, s)[0] !== 0)) err(`solucions ${JSON.stringify(sols)}`);
                const quantes = nombreDeSolucions(e);
                if (quantes !== sols.length) err(`${sols.length} solucions, i n'hi hauria d'haver ${quantes}`);
                if (new Set(sols.map(String)).size !== sols.length) err('solucions repetides');
                nSols.add(sols.length);
                if (
                    nivell === 1 &&
                    tipus === 'completa' &&
                    (e.a !== 1 || sols.length !== 2 || sols.some(s => s[1] !== 1))
                )
                    err('al nivell 1 les completes tenen a = 1 i dues solucions enteres');
                if (tipus === 'ordenar' && (e.trampes || []).some(t => t.coefs[0] * e.b === t.coefs[1] * e.a))
                    err('una trampa coincideix amb la resposta bona');
            }
            ok(
                `${tipus}, nivell ${nivell}: ${PER_COMBINACIO} equacions (${vistes.size} de diferents; solucions: ${[...nSols].sort().join(', ')})`,
                !errors.length && vistes.size >= 8,
                errors.join(' | ')
            );
        }
    }
    const casos = (tipus, nivell) =>
        new Set(Array.from({ length: 600 }, () => w.resolEquacioSG(w.generaEquacioSG(tipus, nivell)).length));
    ok(
        'completes de nivell 2 i 3: n’hi ha amb dues solucions, amb una i sense cap',
        [2, 3].every(n => casos('completa', n).size === 3)
    );
    ok(
        'incompletes sense b de nivell 2 i 3: n’hi ha amb dues solucions i sense cap',
        [2, 3].every(n => casos('senseB', n).size === 2)
    );
    ok('biquadrades: n’hi ha amb 4 solucions i amb 2', casos('biquadrada', 2).has(4) && casos('biquadrada', 2).has(2));
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Passos: la resolució completa, pas a pas');
{
    for (const tipus of TIPUS) {
        const errors = [];
        const menes = new Set();
        for (let i = 0; i < PER_COMBINACIO && errors.length < 3; i++) {
            const e = w.generaEquacioSG(tipus, 1 + (i % 3));
            const err = msg => errors.push(`${e.text}: ${msg}`);
            const passos = w.passosEquacioSG(e, { classifica: i % 2 === 0 });
            if (new Set(passos.map(p => p.id)).size !== passos.length) err('identificadors repetits');
            if ((passos[0].mena === 'classifica') !== (i % 2 === 0 && !!TEXTOS_SG.classe[tipus]))
                err('pas de classificar');
            const finals = [];
            for (const pas of passos) {
                menes.add(pas.mena);
                const noms = Object.keys(pas.camps);
                const aLaPlantilla = JSON.stringify(pas.plantilla).match(/"camp":"\w+"/g) || [];
                const esperats = noms.filter(n => pas.camps[n] !== 'tria');
                if (
                    aLaPlantilla.length !== esperats.length ||
                    esperats.some(n => !aLaPlantilla.includes(`"camp":"${n}"`))
                )
                    err(`${pas.id}: la plantilla no té les caselles dels camps`);
                if (!pas.enunciat || BAD_TEXT.test(pas.enunciat) || pas.enunciat.includes('{'))
                    err(`${pas.id}: enunciat`);
                if (!pas.linia || BAD_TEXT.test(pas.linia)) err(`${pas.id}: línia «${pas.linia}»`);
                if (!TEXTOS_SG.nomPas[pas.mena]) err(`${pas.mena}: sense nom per a l'historial`);
                if (pas.camps.tria && !pas.opcions.some(([valor]) => valor === pas.solucio.tria))
                    err(`${pas.id}: opcions`);
                for (const blanc of [false, true]) {
                    const r = w.corregeixPas(pas, respostaBona(pas, { denominadorEnBlanc: blanc }));
                    if (r.estat !== 'ok') err(`${pas.id}: la resposta bona dona «${r.estat}»`);
                    else if (BAD_TEXT.test(w.textResposta(pas, r.valors))) err(`${pas.id}: text de la resposta`);
                }
                if (pas.parell) {
                    const girada = respostaBona(pas);
                    [girada.x1, girada.x2] = [girada.x2, girada.x1];
                    if (w.corregeixPas(pas, girada).estat !== 'ok')
                        err(`${pas.id}: no accepta les solucions en l'altre ordre`);
                }
                if (
                    pas.mena === 'arrels' ||
                    (pas.mena === 'solucions' && tipus !== 'biquadrada') ||
                    pas.mena === 'solucionsFactor'
                )
                    finals.push(...noms.map(n => comQ(pas.solucio[n])));
            }
            const sols = w.resolEquacioSG(e);
            const clau = llista => llista.map(String).sort().join(' ');
            if (clau(finals) !== clau(sols)) err(`els passos donen ${clau(finals)} i les solucions són ${clau(sols)}`);
        }
        ok(
            `${tipus}: ${PER_COMBINACIO} resolucions (passos: ${[...menes].join(', ')})`,
            !errors.length,
            errors.join(' | ')
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Correcció: avisos, errors i equacions equivalents');
{
    const completa = { tipus: 'completa', a: 2, b: -1, c: -10 }; // x = 5/2 i x = −2
    const passos = w.passosEquacioSG(completa);
    const pas = mena => passos.find(p => p.mena === mena);
    const estat = (p, resp) => w.corregeixPas(p, resp).estat;

    eq('falta una casella → incomplet', estat(pas('coeficients'), { a: '2', b: '', c: '-10' }), 'incomplet');
    eq('diu quina casella falta', w.corregeixPas(pas('coeficients'), { a: '2', b: '', c: '-10' }).camp, 'b');
    eq('text que no és un enter → avís', w.corregeixPas(pas('discriminant'), { delta: '8,1' }).codi, 'NO_ENTER');
    eq('un pas d’escollir sense res triat → incomplet', estat(pas('nombre'), {}), 'incomplet');
    const sol = { x1: { n: '5', d: '2' }, x2: { n: '-2', d: '' } };
    eq('5/2 i −2 → correcte', estat(pas('solucions'), sol), 'ok');
    eq('−2 i 5/2 → correcte', estat(pas('solucions'), { x1: sol.x2, x2: sol.x1 }), 'ok');
    const sense = w.corregeixPas(pas('solucions'), { x1: { n: '10', d: '4' }, x2: { n: '-2', d: '1' } });
    ok(
        '10/4 → avís de simplificar, sense restar intent',
        sense.estat === 'avis' && sense.codi === 'NO_SIMPLIFICADA' && sense.camp === 'x1'
    );
    eq(
        '−4/2 en lloc de −2 → avís de simplificar',
        w.corregeixPas(pas('solucions'), { x1: sol.x1, x2: { n: '-4', d: '2' } }).codi,
        'NO_SIMPLIFICADA'
    );
    eq('5/−2 no és 5/2 → error', estat(pas('solucions'), { x1: { n: '5', d: '-2' }, x2: sol.x2 }), 'error');
    eq(
        'denominador 0 → avís',
        w.corregeixPas(pas('solucions'), { x1: { n: '5', d: '0' }, x2: sol.x2 }).codi,
        'DEN_ZERO'
    );
    const mig = w.corregeixPas(pas('solucions'), { x1: { n: '-2', d: '' }, x2: { n: '3', d: '' } });
    ok(
        'una solució bona i una de dolenta → només s’assenyala la dolenta',
        mig.estat === 'error' && String(mig.malament) === 'x2'
    );
    const dues = w.corregeixPas(pas('solucions'), { x1: sol.x1, x2: sol.x1 });
    ok('la mateixa solució dues vegades → error', dues.estat === 'error' && dues.malament.length === 1);
    const form = w.corregeixPas(pas('formula'), { mb: '1', arrel: '81', da: '4' });
    ok(
        'a la fórmula s’assenyala només la casella equivocada',
        form.estat === 'error' && String(form.malament) === 'arrel'
    );

    // Per ordenar: val qualsevol equació equivalent, i la resta de passos es fan amb aquella
    const errors = [];
    for (let i = 0; i < 900 && errors.length < 3; i++) {
        const e = w.generaEquacioSG('ordenar', 1 + (i % 3));
        const [ordena, ...resta] = w.passosEquacioSG(e);
        for (const k of [1, -1, 2, -3]) {
            const coefs = [e.a, e.b, e.c].map(n => k * n);
            const r = w.corregeixPas(ordena, { a: String(coefs[0]), b: String(coefs[1]), c: String(coefs[2]) });
            if (r.estat !== 'ok') errors.push(`${e.text}: no accepta l'equació multiplicada per ${k}`);
            const [ordena2, ...resta2] = w.passosEquacioSG(e, { coefs });
            if (resta2.length !== resta.length || ordena2.linia.includes('undefined'))
                errors.push(`${e.text}: passos amb k = ${k}`);
            const [d1, d2] = [resta, resta2].map(ps => ps[0].solucio.delta);
            if (d2 !== k * k * d1) errors.push(`${e.text}: discriminant amb k = ${k}`);
            const finals = ps =>
                Object.values(ps[ps.length - 1].solucio)
                    .map(v => String(comQ(v)))
                    .sort()
                    .join(' ');
            if (resta.length > 2 && finals(resta) !== finals(resta2)) errors.push(`${e.text}: solucions amb k = ${k}`);
        }
        for (const dolenta of [
            [e.a, e.b, e.c + 1],
            [e.a, -e.b, e.c],
            [0, 0, 0],
            [e.a, e.b, -e.c],
        ]) {
            const r = w.corregeixPas(ordena, { a: String(dolenta[0]), b: String(dolenta[1]), c: String(dolenta[2]) });
            if (r.estat !== 'error' || r.malament.length !== 3) errors.push(`${e.text}: accepta ${dolenta}`);
        }
        for (const t of e.trampes) {
            const r = w.corregeixPas(ordena, { a: String(t.coefs[0]), b: String(t.coefs[1]), c: String(t.coefs[2]) });
            const d = r.estat === 'error' ? w.diagnosticaSG(ordena, r.valors) : null;
            if (!d || d.errorType !== t.errorType) errors.push(`${e.text}: la trampa ${t.errorType} no es diagnostica`);
        }
    }
    ok(
        'per ordenar: 900 equacions × equacions equivalents, respostes dolentes i trampes',
        !errors.length,
        errors.join(' | ')
    );

    // Respostes equivocades a l'atzar: mai s'accepten i el diagnòstic mai peta
    const fuzz = [];
    let diagnosticades = 0;
    let provades = 0;
    for (let i = 0; i < 3000 && fuzz.length < 3; i++) {
        const tipus = TIPUS[i % TIPUS.length];
        const e = w.generaEquacioSG(tipus, 1 + (i % 3));
        for (const p of w.passosEquacioSG(e, { classifica: true })) {
            const noms = Object.keys(p.camps);
            const nom = noms[i % noms.length];
            const resp = respostaBona(p);
            if (p.camps[nom] === 'tria') resp[nom] = p.opcions.find(([valor]) => valor !== p.solucio.tria)[0];
            else if (p.camps[nom] === 'enter') resp[nom] = String(p.solucio[nom] + 1 + (i % 4));
            else resp[nom] = { n: String(p.solucio[nom][0] + p.solucio[nom][1] * (1 + (i % 3))), d: resp[nom].d };
            const r = w.corregeixPas(p, resp);
            provades++;
            // (en un parell, la resposta canviada pot ser l'altra solució repetida: també és un error)
            if (r.estat !== 'error') fuzz.push(`${e.text} · ${p.id}: ${JSON.stringify(resp)} → ${r.estat}`);
            else if (!p.proporcional && !p.parell && String(r.malament) !== nom)
                fuzz.push(`${e.text} · ${p.id}: assenyala ${r.malament}`);
            let d;
            try {
                d = w.diagnosticaSG(p, r.valors);
            } catch (ex) {
                fuzz.push(`${p.id}: el diagnòstic peta (${ex.message})`);
            }
            if (d) {
                diagnosticades++;
                if (!ERRORS_SG[d.errorType] || !d.missatge || !d.etiqueta || BAD_TEXT.test(d.missatge))
                    fuzz.push(`${p.id}: diagnòstic mal format`);
            }
        }
    }
    ok(
        `${provades} respostes equivocades a l'atzar: cap s'accepta (${diagnosticades} amb diagnòstic)`,
        !fuzz.length,
        fuzz.join(' | ')
    );
    ok(
        'el diagnòstic no peta amb dades absurdes',
        w.diagnosticaSG({ mena: 'no-existeix' }, null) === null && w.diagnosticaSG({ mena: 'arrels' }, {}) === null
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('4. Diagnòstic: cada error típic, amb una resposta feta a mà');
{
    const provocats = new Set();
    // Resol l'equació fins al pas `mena`, hi escriu `resp` i mira quin error es diagnostica
    function prova(titol, e, mena, resp, esperat, opcions = {}) {
        const pas = w.passosEquacioSG(e, opcions).find(p => p.mena === mena);
        const r = w.corregeixPas(pas, resp);
        const d = r.estat === 'error' ? w.diagnosticaSG(pas, r.valors) : null;
        if (d) provocats.add(d.errorType);
        eq(titol, d ? d.errorType : `(${r.estat}, sense diagnòstic)`, esperat);
    }
    const fr = (n, d = '') => ({ n: String(n), d: String(d) });
    const A = { tipus: 'completa', a: 1, b: -5, c: 6 }; //   x = 3, x = 2      Δ = 1
    const B = { tipus: 'completa', a: 2, b: -1, c: -10 }; // x = 5/2, x = −2   Δ = 81
    const C = { tipus: 'completa', a: 3, b: 4, c: -4 }; //   x = 2/3, x = −2   Δ = 64
    const D = { tipus: 'completa', a: -1, b: 3, c: 10 }; //  x = −2, x = 5     Δ = 49
    const SB = { tipus: 'senseB', a: 2, b: 0, c: -50 }; //   x = ±5
    const SB4 = { tipus: 'senseB', a: 4, b: 0, c: -9 }; //   x = ±3/2
    const SC = { tipus: 'senseC', a: 2, b: -6, c: 0 }; //    x = 0, x = 3
    const BQ = { tipus: 'biquadrada', a: 1, b: -5, c: 4 };

    prova('classificar malament', A, 'classifica', { tria: 'senseB' }, 'CLASSIFICA', { classifica: true });
    prova('coeficients sense signe', A, 'coeficients', { a: '1', b: '5', c: '6' }, 'COEF_SIGNE');
    prova('coeficients intercanviats', A, 'coeficients', { a: '1', b: '6', c: '-5' }, 'COEF_ORDRE');
    prova('a = 0 quan no es veu cap nombre', A, 'coeficients', { a: '0', b: '-5', c: '6' }, 'COEF_U');
    prova('canvi t = x² amb un signe equivocat', BQ, 'canvi', { a: '1', b: '5', c: '4' }, 'COEF_SIGNE');
    prova('−b² amb b negatiu', A, 'discriminant', { delta: '-49' }, 'DISC_B2_NEGATIU');
    prova('b² + 4ac', A, 'discriminant', { delta: '49' }, 'DISC_SIGNE_4AC');
    prova('b² − 4·|ac| amb a·c negatiu', B, 'discriminant', { delta: '-79' }, 'DISC_SIGNE_4AC');
    prova('b² − ac', A, 'discriminant', { delta: '19' }, 'DISC_SENSE_4');
    prova('2b − 4ac', A, 'discriminant', { delta: '-34' }, 'DISC_DOBLE_B');
    prova('√Δ en lloc de Δ', B, 'discriminant', { delta: '9' }, 'DISC_ARREL');
    prova('nombre de solucions', A, 'nombre', { tria: 0 }, 'NOMBRE_DELTA');
    prova('b en lloc de −b', A, 'formula', { mb: '-5', arrel: '1', da: '2' }, 'FORM_SIGNE_B');
    prova('Δ en lloc de √Δ', B, 'formula', { mb: '1', arrel: '81', da: '4' }, 'FORM_ARREL');
    prova('Δ/2 en lloc de √Δ', C, 'formula', { mb: '-4', arrel: '32', da: '6' }, 'FORM_ARREL_MEITAT');
    prova('a en lloc de 2a', B, 'formula', { mb: '1', arrel: '9', da: '2' }, 'FORM_DEN');
    prova('solucions amb el signe canviat', A, 'solucions', { x1: '-3', x2: '-2' }, 'SOL_SIGNE');
    prova('numeradors sense dividir', A, 'solucions', { x1: '6', x2: '4' }, 'SOL_SENSE_DIVIDIR');
    prova('dividir per 2 i no per 2a', B, 'solucions', { x1: fr(5), x2: fr(-4) }, 'SOL_DIVISOR');
    prova('dividir només l’arrel', B, 'solucions', { x1: fr(13, 4), x2: fr(-5, 4) }, 'SOL_NOMES_ARREL');
    prova('a negativa: solucions amb el signe canviat', D, 'solucions', { x1: '2', x2: '-5' }, 'SOL_SIGNE');
    prova('aïllar sense canviar el signe', SB, 'aillar', { k: '-50' }, 'AILLAR_SIGNE');
    prova('restar el coeficient', SB, 'dividir', { q: '48' }, 'DIVIDIR_RESTA');
    prova('signe de la divisió', SB, 'dividir', { q: '-25' }, 'DIVIDIR_SIGNE');
    prova('divisió girada', SB4, 'dividir', { q: fr(4, 9) }, 'DIVIDIR_INVERS');
    prova('quants nombres tenen aquest quadrat', SB, 'nombreArrel', { tria: 1 }, 'NOMBRE_QUADRAT');
    prova('només la solució positiva', SB, 'arrels', { x1: '5', x2: '5' }, 'ARRELS_NOMES_POSITIVA');
    prova('sense fer l’arrel', SB, 'arrels', { x1: '25', x2: '-25' }, 'ARRELS_SENSE_ARREL');
    prova('la meitat en lloc de l’arrel', SB4, 'arrels', { x1: fr(9, 8), x2: fr(-9, 8) }, 'ARRELS_MEITAT');
    prova('factor comú amb el signe canviat', SC, 'factor', { p: '2', q: '6' }, 'FACTOR_SIGNE');
    prova('parèntesi girat', SC, 'factor', { p: '-6', q: '2' }, 'FACTOR_INTERCANVI');
    prova('falta x = 0', SC, 'solucionsFactor', { x1: '3', x2: '-3' }, 'ZERO_PERDUT');
    prova('segona solució amb el signe canviat', SC, 'solucionsFactor', { x1: '0', x2: '-3' }, 'LINEAL_SIGNE');
    prova('segona solució sense dividir', SC, 'solucionsFactor', { x1: '6', x2: '0' }, 'LINEAL_SENSE_DIVIDIR');
    prova(
        'segona solució girada',
        { tipus: 'senseC', a: 3, b: -2, c: 0 },
        'solucionsFactor',
        { x1: fr(0), x2: fr(3, 2) },
        'LINEAL_INVERSA'
    );
    // Les de les equacions per ordenar (ORDENA_QUADRAT i ORDENA_DISTRIBUTIVA) es proven a la suite 3
    const ordenar = { tipus: 'ordenar', a: 1, b: -2, c: -63, trampes: [] };
    prova('ordenar sense canviar el signe', ordenar, 'ordena', { a: '1', b: '2', c: '63' }, 'ORDENA_SIGNE');
    for (const t of ['ORDENA_QUADRAT', 'ORDENA_DISTRIBUTIVA']) provocats.add(t);

    const sense = Object.keys(ERRORS_SG).filter(k => !provocats.has(k));
    ok(
        `els ${Object.keys(ERRORS_SG).length} errors de la taxonomia tenen una prova`,
        !sense.length,
        `sense prova: ${sense}`
    );
    const malFets = Object.entries(ERRORS_SG).filter(([, e]) => !e.etiqueta || !e.missatge);
    ok('cada error té etiqueta i missatge', !malFets.length, malFets.map(([k]) => k).join(', '));
    const resposta = w.passosEquacioSG(A).map(p => w.diagnosticaSG(p, w.corregeixPas(p, respostaBona(p)).valors));
    ok(
        'una resposta que no encaixa amb cap error típic → null',
        w.diagnosticaSG(w.passosEquacioSG(A)[1], { delta: 7 }) === null && resposta.length === 5
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('5. Nivells, tipus i generador d’enllaços');
{
    eq('nivell fix: el de ?nivell=', [1, 2, 3].map(n => w.nivellProgressiu(n, 0, 5)).join(), '1,2,3');
    eq(
        'nivell 0: progressiu al llarg de 5 equacions',
        [0, 1, 2, 3, 4].map(i => w.nivellProgressiu(0, i, 5)).join(),
        '1,1,2,2,3'
    );
    eq('nivell 0: progressiu al llarg de 3 equacions', [0, 1, 2].map(i => w.nivellProgressiu(0, i, 3)).join(), '1,2,3');
    ok(
        'es classifica quan es barregen completes i incompletes',
        w.calClassificarSG('') && w.calClassificarSG('incompletes')
    );
    ok(
        'no es classifica quan totes són del mateix tipus',
        !['completes', 'ordenar', 'biquadrades'].some(w.calClassificarSG)
    );
    ok('les biquadrades només surten si es demanen', !TIPUS_SG[''].includes('biquadrada'));
    ok(
        'tots els tipus de TIPUS_SG tenen generador',
        Object.values(TIPUS_SG)
            .flat()
            .every(t => TIPUS.includes(t))
    );

    // Les opcions que ofereix index.html són exactament les que entén el joc
    const dades = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    const { OPCIONS_ACTIVITAT, ACTIVITIES_ESO } = vm.runInNewContext(
        `${dades}\n({ OPCIONS_ACTIVITAT, ACTIVITIES_ESO });`
    );
    const opcio = (OPCIONS_ACTIVITAT['equacions-segon-grau.html'] || []).find(o => o.param === 'tipus');
    ok('index.html ofereix el paràmetre «tipus»', !!opcio);
    eq(
        'amb les mateixes opcions que TIPUS_SG',
        opcio
            ? opcio.valors
                  .map(([valor]) => valor)
                  .sort()
                  .join()
            : '',
        Object.keys(TIPUS_SG).sort().join()
    );
    const entrada = ACTIVITIES_ESO.find(a => a.file === 'equacions-segon-grau.html');
    ok(
        "és al menú d'ESO, amb nivells i sessions fixes",
        !!entrada && entrada.difficulty === true && entrada.fixed === true
    );
    // Les sessions fixes sembren buildLevel: l'equació s'ha de generar a dins (joc-passos.js la demana a generaPregunta)
    const llegeix = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
    const controlador = llegeix('js/equacions-segon-grau/equacions-segon-grau.js');
    ok(
        'el controlador genera les equacions a generaPregunta',
        /generaPregunta\([^)]*\) \{[\s\S]*?generaEquacioSG\(/.test(controlador)
    );
    ok(
        'i el joc de passos la crida dins de buildLevel',
        /function buildLevel\(\) \{[\s\S]*?config\.generaPregunta\(/.test(llegeix('js/passos/joc-passos.js'))
    );
    ok(
        "cada pas té el nom per a l'historial",
        w.passosEquacioSG(w.generaEquacioSG('biquadrada', 2), { classifica: true }).every(p => p.nom)
    );
    const tria = clona(TEXTOS_SG.nombre);
    ok(
        'els textos de les opcions hi són tots',
        [0, 1, 2].every(k => tria[k] && TEXTOS_SG.nombreArrel[k])
    );
}

finish("TESTS D'EQUACIONS DE 2N GRAU");
