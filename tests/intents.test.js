/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/intents.test.js
 * ROL: Comprova js/analitzador-stepquiz/intents.js (l'analitzador davant d'un
 *      alumne que repeteix la prova i de proves de mida diferent):
 *   1. Intents: es numeren per hora del codi, amb la nota anterior; el mateix
 *      codi enviat dos cops no és un intent nou; invàlids i sense correu no s'ajunten.
 *   2. Quin intent compta: l'últim, el primer, el millor o tots.
 *   3. Resum CB: una prova de 4 preguntes i una de 8 del mateix alumne es
 *      separen (la pregunta 1 no es barreja).
 * ÚS: node tests/intents.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, eq, finish } = require('./harness');
// eq() compara amb ===: per a llistes i objectes, es comparen com a JSON
const igual = (label, actual, esperat) => eq(label, JSON.stringify(actual), JSON.stringify(esperat));

let n = 0;
// Una fila com la de processRows(): només els camps que fa servir intents.js
function fila(
    student,
    {
        dia = '2026-10-20',
        hora = '11:50',
        nq = 4,
        nota = 5,
        codi,
        curs = '4t ESO',
        mode = 'Pràctica',
        res,
        valid = true,
    } = {}
) {
    const [hh, mm] = hora.split(':').map(Number);
    const resultats = res || '1'.repeat(nq);
    return {
        idx: n++,
        raw: { rawCode: codi || `X-${student}-${dia}-${hora}-${nq}-${nota}-${resultats}` },
        parsed: {
            valid,
            format: 'v2',
            exerciseCode: 'CB',
            difficulty: 2,
            sessions: 2,
            questions: nq,
            cbNivell: curs,
            cbMode: mode,
            note: nota,
            day: +dia.slice(8),
            month: +dia.slice(5, 7),
            hour: hh,
            minute: mm,
            resultsArray: resultats.split('').map(Number),
        },
        student,
        dateStr: dia,
        sendTime: hora,
        classe: '',
    };
}

(async () => {
    const m = await import(pathToFileURL(path.join(ROOT, 'js/analitzador-stepquiz/intents.js')).href);

    suite('Intents: la mateixa prova repetida');
    // El cas del professor: 4 preguntes a les 11:50 i les mateixes 4 a les 11:58, amb millor nota
    const a1 = fila('anna', { hora: '11:50', nota: 5, res: '1411' });
    const a2 = fila('anna', { hora: '11:58', nota: 7.5, res: '1111' });
    const b1 = fila('bernat', { hora: '11:52', nota: 6 });
    // Enviats en ordre canviat: es numera per l'hora del codi, no per l'ordre del full
    const files = [a2, a1, b1];
    m.marcaIntents(files);
    eq('el de les 11:50 és l’intent 1', a1.intent, 1);
    eq('el de les 11:58 és l’intent 2', a2.intent, 2);
    eq('ella en té 2', a1.intents, 2);
    eq('la nota anterior del 2n és la de l’1r', a2.notaAnterior, 5);
    eq('el 1r no té nota anterior', a1.notaAnterior, null);
    eq('l’altre alumne només en té 1', b1.intents, 1);

    suite('Intents: el mateix codi dues vegades no és un intent nou');
    const c1 = fila('carla', { codi: 'MATEIX-CODI', hora: '10:00' });
    const c2 = fila('carla', { codi: 'MATEIX-CODI', hora: '10:00' });
    m.marcaIntents([c1, c2]);
    eq('1 intent en total', c1.intents, 1);
    eq('el segon és duplicat del primer', c2.duplicatDe, c1);
    eq('el duplicat té el número d’intent de l’original', c2.intent, 1);

    suite('Intents: proves diferents, invàlids i sense correu');
    const d4 = fila('dani', { nq: 4 });
    const d8 = fila('dani', { nq: 8, hora: '12:30' });
    const e1 = fila('', { hora: '09:00' });
    const e2 = fila('—', { hora: '09:05' });
    const f1 = fila('fina', { valid: false });
    const f2 = fila('fina', { hora: '12:00' });
    m.marcaIntents([d4, d8, e1, e2, f1, f2]);
    igual('4 i 8 preguntes no són la mateixa prova', [d4.intents, d8.intents], [1, 1]);
    igual('sense correu, no s’ajunten', [e1.intents, e2.intents], [null, null]);
    eq('un codi invàlid no té intents', f1.intents, null);
    eq('i no fa créixer els de l’alumne', f2.intents, 1);

    suite('Moment del codi: canvi d’any');
    const g = fila('gina', { dia: '2027-01-04', hora: '08:00' });
    g.parsed.month = 12;
    g.parsed.day = 29;
    eq('un codi de desembre enviat al gener és de l’any anterior', m.momentCodi(g), '2026-12-29 08:00');

    suite('Quin intent compta');
    const h1 = fila('hug', { hora: '11:00', nota: 9 });
    const h2 = fila('hug', { hora: '11:10', nota: 4 });
    const h3 = fila('hug', { hora: '11:20', nota: 6 });
    m.marcaIntents([h1, h2, h3]);
    const ids = r => r.map(x => x.parsed.note);
    igual('últim', ids(m.triaIntents([h2, h1, h3], 'ultim')), [6]);
    igual('primer', ids(m.triaIntents([h2, h1, h3], 'primer')), [9]);
    igual('millor', ids(m.triaIntents([h2, h1, h3], 'millor')), [9]);
    igual('tots', ids(m.triaIntents([h2, h1, h3], 'tots')).sort(), [4, 6, 9]);
    const i1 = fila('ivan', { hora: '11:00', nota: 7 });
    const i2 = fila('ivan', { hora: '11:10', nota: 7 });
    eq('millor, si empaten, l’últim', m.triaIntents([i1, i2], 'millor')[0], i2);

    suite('Resum CB: proves de mida diferent separades');
    // L'alumne fa 4 preguntes i després 8: la pregunta 1 no s'ha de barrejar
    const j4 = fila('joan', { nq: 4, hora: '11:50', res: '1111', nota: 10 });
    const j8 = fila('joan', { nq: 8, hora: '12:20', res: '14141111', nota: 6 });
    const k4 = fila('kim', { nq: 4, hora: '11:51', res: '4111', nota: 7.5 });
    const tots = [j4, j8, k4];
    m.marcaIntents(tots);
    const r = m.agrupaProves(tots, 'ultim', 50);
    igual(
        'dues proves',
        r.grups.map(x => x.nq),
        [4, 8]
    );
    eq('la de 4 té 2 alumnes', r.grups[0].alumnes, 2);
    eq('la de 8 en té 1', r.grups[1].alumnes, 1);
    const est4 = m.estadistiquesPreguntes([...r.grups[0].comptades], 4);
    igual('pregunta 1 de la prova de 4: 1 encert i 1 fallada (50 %)', est4[0].pcts, [50, 0, 0, 50]);
    const est8 = m.estadistiquesPreguntes([...r.grups[1].comptades], 8);
    eq('pregunta 1 de la prova de 8: només el que hi ha fet', est8[0].total, 1);

    suite('Resum CB: repetidors i enviaments ignorats');
    const l1 = fila('laia', { hora: '11:00', nota: 5 });
    const l2 = fila('laia', { hora: '11:10', nota: 8 });
    const l3 = fila('laia', { codi: l2.raw.rawCode, hora: '11:10', nota: 8 });
    const tl = [l1, l2, l3];
    m.marcaIntents(tl);
    const u = m.agrupaProves(tl, 'ultim', 50);
    eq('el codi idèntic s’ignora', u.ignorats, 1);
    igual(
        'només compta l’últim intent',
        [...u.grups[0].comptades].map(x => x.parsed.note),
        [8]
    );
    igual('es detecta que n’ha fet 2', u.grups[0].repetidors, [{ student: 'laia', intents: 2 }]);
    const all = m.agrupaProves(tl, 'tots', 50);
    eq('amb «tots», compten els dos intents', all.grups[0].comptades.size, 2);
    // Si l'original no és entre els enviaments mostrats (filtre de dies), el duplicat sí que compta
    const sol = m.agrupaProves([l3], 'ultim', 50);
    igual('duplicat sense l’original a la llista: no s’ignora', [sol.ignorats, sol.grups[0].comptades.size], [0, 1]);

    suite('Resum CB: un codi invàlid no desplaça el vàlid');
    const v1 = fila('vera', { hora: '11:00', nota: 8 });
    const v2 = fila('vera', { hora: '11:30', nota: 2, valid: false });
    const rv = m.agrupaProves([v1, v2], 'ultim', 50);
    igual('el vàlid compta', [...rv.grups[0].comptades].includes(v1), true);
    igual('l’invàlid segueix comptant com abans (no es perd)', [...rv.grups[0].comptades].includes(v2), true);
    igual('i no es presenta com a repetició', rv.grups[0].repetidors, []);

    suite('Resum CB: una sola prova per curs, mode i mida');
    const w1 = fila('walter', { nq: 4, hora: '11:00' });
    const w2 = fila('xavi', { nq: 4, hora: '11:05' });
    w2.parsed.difficulty = 0; // «tots els nivells» té D=0, però la mateixa lletra de curs
    igual('no es duplica el títol', m.agrupaProves([w1, w2], 'ultim', 50).grups.length, 1);

    finish('Intents repetits a l’analitzador');
})();
