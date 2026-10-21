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
const { ROOT, suite, ok, eq, finish } = require('./harness');
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

    suite('Codis v3: la dificultat, els sentits, la convocatòria i les preguntes compten');
    const cod = await import(pathToFileURL(path.join(ROOT, 'js/codi-verificacio.js')).href);
    // Fila v3 de CB: com fila(), amb el que diu el codi nou. Per defecte, filtres «tot» i l'empremta ABCD.
    function filaV3(
        student,
        {
            hora = '11:50',
            nq = 4,
            nota = 5,
            any = null,
            difMask = 7,
            sentMask = 31,
            empremta = 'ABCD',
            codi,
            curs = '4t ESO',
            mode = 'Pràctica',
        } = {}
    ) {
        const f = fila(student, {
            hora,
            nq,
            nota,
            curs,
            mode,
            codi: codi || `V3-${student}-${hora}-${nq}-${nota}-${any}-${difMask}-${sentMask}-${empremta}`,
        });
        Object.assign(f.parsed, {
            format: 'v3',
            cbConvocatoria: any,
            cbDifMask: difMask,
            cbSentMask: sentMask,
            cbDificultats: cod.llistaDeMascara(difMask, cod.DIFICULTATS_CB),
            cbSentits: cod.llistaDeMascara(sentMask, cod.SENTITS_CB),
            empremta,
        });
        return f;
    }
    // El cas que el v2 no podia resoldre: 4 preguntes de dificultat 1 i 4 de dificultat 2
    const wd1 = filaV3('dora', { hora: '11:00', difMask: 1, empremta: 'AAAA' });
    const wd2 = filaV3('dora', { hora: '11:10', difMask: 2, empremta: 'BBBB' });
    m.marcaIntents([wd1, wd2]);
    eq(
        'dificultat 1 i dificultat 2 són proves diferents: cap intent repetit',
        [wd1.intents, wd2.intents].join(),
        '1,1'
    );
    // Mateixos filtres i mateixes preguntes: sí que és repetició
    const we1 = filaV3('enric', { hora: '11:00', difMask: 1, empremta: 'AAAA', nota: 5 });
    const we2 = filaV3('enric', { hora: '11:10', difMask: 1, empremta: 'AAAA', nota: 8 });
    m.marcaIntents([we1, we2]);
    eq('mateixos filtres i empremta: 2 intents', [we1.intent, we2.intent, we2.intents].join(), '1,2,2');
    eq('i la nota anterior és la del primer', we2.notaAnterior, 5);
    // Mateixos filtres però preguntes diferents (triades a mà, o un banc que ha canviat)
    const wf1 = filaV3('fina', { hora: '11:00', empremta: 'AAAA' });
    const wf2 = filaV3('fina', { hora: '11:10', empremta: 'BBBB' });
    m.marcaIntents([wf1, wf2]);
    eq('mateixos filtres però una altra empremta: no és repetició', [wf1.intents, wf2.intents].join(), '1,1');
    // Els sentits i la convocatòria també separen
    const wg1 = filaV3('gina', { hora: '11:00', sentMask: 1 });
    const wg2 = filaV3('gina', { hora: '11:10', sentMask: 2 });
    const wg3 = filaV3('gina', { hora: '11:20', any: '2025' });
    const wg4 = filaV3('gina', { hora: '11:30' });
    m.marcaIntents([wg1, wg2, wg3, wg4]);
    eq(
        'un sentit diferent, una convocatòria diferent: proves diferents',
        [wg1, wg2, wg3, wg4].map(x => x.intents).join(),
        '1,1,1,1'
    );
    // El mateix codi v3 dues vegades: enviament repetit
    const wh1 = filaV3('hug', { codi: 'MATEIX-V3', hora: '10:00' });
    const wh2 = filaV3('hug', { codi: 'MATEIX-V3', hora: '10:00' });
    m.marcaIntents([wh1, wh2]);
    eq('el mateix codi v3 dos cops no és un intent nou', [wh2.duplicatDe === wh1, wh1.intents].join(), 'true,1');
    // Un v2 i un v3 amb els mateixos camps bàsics no es barregen (el v3 té l'empremta)
    const wi1 = fila('ivan', { hora: '11:00' });
    const wi2 = filaV3('ivan', { hora: '11:10' });
    m.marcaIntents([wi1, wi2]);
    eq('un codi v2 i un v3 són proves diferents', [wi1.intents, wi2.intents].join(), '1,1');

    suite('Codis v3: els títols de les proves');
    eq('sense meta (v2): cap part', m.descripcioFiltres(null).length, 0);
    const metaV3 = (o = {}) => {
        const f = filaV3('x', o).parsed;
        return {
            convocatoria: f.cbConvocatoria,
            difMask: f.cbDifMask,
            sentMask: f.cbSentMask,
            empremta: f.empremta,
            dificultats: f.cbDificultats,
            sentits: f.cbSentits,
        };
    };
    eq('tot a «tots»: cap part', m.descripcioFiltres(metaV3()).length, 0);
    igual('convocatòria 2025', m.descripcioFiltres(metaV3({ any: '2025' })), ['Convocatòria 2025']);
    igual('una dificultat', m.descripcioFiltres(metaV3({ difMask: 4 })), ['Dificultat 3']);
    igual('dues dificultats', m.descripcioFiltres(metaV3({ difMask: 3 })), ['Dificultats 1, 2']);
    igual('un sentit', m.descripcioFiltres(metaV3({ sentMask: 8 })), ['Sentit Espacial']);
    igual('dos sentits, en l\u2019ordre dels bits', m.descripcioFiltres(metaV3({ sentMask: 3 })), [
        'Sentits Numèric, Algebraic',
    ]);
    igual('tot junt', m.descripcioFiltres(metaV3({ any: '2024', difMask: 6, sentMask: 20 })), [
        'Convocatòria 2024',
        'Dificultats 2, 3',
        'Sentits De mesura, Estocàstic',
    ]);

    // Dues proves de dificultat diferent surten separades i amb el títol que ho diu
    const wj1 = filaV3('joan', { hora: '11:00', difMask: 1, empremta: 'AAAA' });
    const wj2 = filaV3('joan', { hora: '11:10', difMask: 2, empremta: 'BBBB' });
    const wk1 = filaV3('kim', { hora: '11:05', difMask: 1, empremta: 'AAAA' });
    const wtots3 = [wj1, wj2, wk1];
    m.marcaIntents(wtots3);
    const wr3 = m.agrupaProves(wtots3, 'ultim', 50);
    eq('dues proves', wr3.grups.length, 2);
    igual(
        'els títols diuen la dificultat',
        wr3.grups.map(x => x.etiqueta),
        [
            'Prova de 4 preguntes · 4t ESO · Pràctica · Dificultat 1',
            'Prova de 4 preguntes · 4t ESO · Pràctica · Dificultat 2',
        ]
    );
    eq('la de dificultat 1 té 2 alumnes', wr3.grups[0].alumnes, 2);
    eq(
        'ningú no ha repetit: ni avís',
        wr3.grups.every(x => x.repetidors.length === 0),
        true
    );
    // Si el títol coincidiria, s'hi afegeix l'empremta (v3) o «codis antics» (v2)
    const wl1 = filaV3('laia', { hora: '11:00', empremta: 'AAAA' });
    const wl2 = filaV3('laia', { hora: '11:10', empremta: 'BBBB' });
    const wl3 = fila('laia', { hora: '11:20' });
    const wtl3 = [wl1, wl2, wl3];
    m.marcaIntents(wtl3);
    const wrl = m.agrupaProves(wtl3, 'tots', 50);
    igual(
        'mateix títol: es distingeixen per l\u2019empremta i per «codis antics»',
        wrl.grups.map(x => x.etiqueta).sort(),
        [
            'Prova de 4 preguntes · 4t ESO · Pràctica · codis antics',
            'Prova de 4 preguntes · 4t ESO · Pràctica · preguntes AAAA',
            'Prova de 4 preguntes · 4t ESO · Pràctica · preguntes BBBB',
        ]
    );
    ok('cap títol no es repeteix', new Set(wrl.grups.map(x => x.etiqueta)).size === wrl.grups.length);
    // El v3 que repeteix la prova (mateixes preguntes) compta com a repetidor; l'avís de limitació és només del v2
    const wm1 = filaV3('mar', { hora: '11:00', nota: 5 });
    const wm2 = filaV3('mar', { hora: '11:10', nota: 8 });
    const wtm = [wm1, wm2];
    m.marcaIntents(wtm);
    const wrm = m.agrupaProves(wtm, 'ultim', 50);
    igual('el v3 repetit surt com a repetidor', wrm.grups[0].repetidors, [{ student: 'mar', intents: 2 }]);
    ok('i el grup sap que és v3 (meta)', wrm.grups[0].meta !== null && wrm.grups[0].meta.empremta === 'ABCD');

    finish('Intents repetits a l’analitzador');
})();
