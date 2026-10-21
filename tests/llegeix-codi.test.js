/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/llegeix-codi.test.js
 * ROL: Comprova js/analitzador-stepquiz/llegeix-codi.js, el que llegeix els codis
 *      que arriben pel formulari:
 *   1. Un codi de cada format i de cada època (v1-cb, v2 amb la lletra antiga i
 *      amb la nova, v2 de cb, v3 de cb), i el que se n'ha de treure camp per camp.
 *   2. Els codis dolents: lletra que no quadra, massa resultats, buits, brossa.
 *   3. Anada i tornada del v2: construeixCodiV2 (el que fan servir game-core.js i
 *      vocabulari.js) per a TOTS els codis d'exercici, i parseCode ho ha de llegir igual.
 *   4. Anada i tornada del v3: els vectors de cb (tests/vectors-cb-v3.js).
 *   5. Si step-quiz/cb és clonat al costat (../cb), els codis que genera el seu
 *      codi.js de debò. A GitHub no hi és i se salta (els vectors del punt 4 ja hi són).
 *   REGLA: un format publicat no es toca mai. Si un canvi fa fallar el punt 1, és
 *   que l'analitzador ja no llegiria codis que els alumnes han enviat.
 * ÚS: node tests/llegeix-codi.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, eq, finish } = require('./harness');
const V3 = require('./vectors-cb-v3');

const importa = f => import(pathToFileURL(path.join(ROOT, f)).href);

// Comprova els camps esperats d'un codi llegit (només els que es donen)
function camps(nom, p, esperat) {
    for (const [k, v] of Object.entries(esperat)) {
        if (Array.isArray(v) || (v && typeof v === 'object'))
            eq(`${nom}: ${k}`, JSON.stringify(p[k]), JSON.stringify(v));
        else eq(`${nom}: ${k}`, p[k], v);
    }
}

// Un codi de cada format i de cada època. Si un d'aquests canvia, l'analitzador deixa
// de llegir codis que els alumnes ja han enviat: no es toquen, se n'hi afegeixen.
const FORMATS = [
    {
        nom: 'v1-cb (els primers de cb, pràctica)',
        codi: 'Yq26-1203-1015-07,50-121311411111000000000000000000-cb',
        esperat: {
            format: 'v1-cb',
            valid: true,
            resultatsVerificats: false,
            exerciseCode: 'CB',
            note: 7.5,
            cbNivell: '4t ESO',
            cbAny: '2026',
            day: 12,
            month: 3,
            hour: 10,
            minute: 15,
            results: '121311411111000000000000000000',
        },
    },
    {
        nom: 'v1-cb de 2n ESO',
        codi: 'Gs26-0502-0900-10,00-111111111111111111110000000000-cb',
        esperat: { format: 'v1-cb', valid: true, note: 10, cbNivell: '2n ESO', cbAny: '2026' },
    },
    {
        nom: "v2 amb la lletra antiga (d'abans del 18/10/2026)",
        codi: 'Eabc-1206-0930-EN-1-3-10-075-111211143111214111311112141111',
        esperat: {
            format: 'v2',
            valid: true,
            resultatsVerificats: false,
            exerciseCode: 'EN',
            exercise: 'enters',
            note: 7.5,
            difficulty: 1,
            sessions: 3,
            questions: 10,
            day: 12,
            month: 6,
            hour: 9,
            minute: 30,
        },
    },
    {
        nom: 'v2 amb la lletra nova',
        codi: 'Gabc-1206-0930-EN-1-3-10-075-111211143111214111311112141111',
        esperat: { format: 'v2', valid: true, resultatsVerificats: true, exerciseCode: 'EN', note: 7.5 },
    },
    {
        nom: 'v2 amb 50 resultats (5 sessions × 10)',
        codi: 'Sxyz-0310-1805-FR-2-5-10-100-11111111111111111111111111111111111111111111111111',
        esperat: { format: 'v2', valid: true, resultatsVerificats: true, exercise: 'fraccions', note: 10 },
    },
    {
        nom: 'v2 de cb (abans del v3)',
        codi: 'Pq26-1710-1042-CB-2-1-30-062-141114411114411114111144111141',
        esperat: {
            format: 'v2',
            valid: true,
            resultatsVerificats: true,
            exerciseCode: 'CB',
            exercise: 'competencies-basiques',
            note: 6.2,
            questions: 30,
            cbNivell: '4t ESO',
            cbAny: '2026',
            cbMode: 'Examen',
        },
    },
    {
        nom: 'v3 de cb',
        codi: 'Mq26-2010-1150-CB-2-2-04-25-3-03-GTGS-100-211100000000000000000000000000',
        esperat: {
            format: 'v3',
            valid: true,
            resultatsVerificats: true,
            exerciseCode: 'CB',
            note: 10,
            difficulty: 2,
            sessions: 2,
            questions: 4,
            cbNivell: '4t ESO',
            cbAny: '2026',
            cbMode: 'Pràctica',
            cbConvocatoria: '2025',
            cbDifMask: 3,
            cbSentMask: 3,
            empremta: 'GTGS',
            day: 20,
            month: 10,
            hour: 11,
            minute: 50,
        },
    },
    {
        nom: 'v3 de cb sense filtres (tots els cursos, anys, dificultats i sentits)',
        codi: 'Ns26-2010-0905-CB-0-1-08-00-7-31-PSSH-075-141141110000000000000000000000',
        esperat: {
            format: 'v3',
            valid: true,
            cbNivell: 'Tots els cursos',
            cbMode: 'Examen',
            cbConvocatoria: null,
            cbDifMask: 7,
            cbSentMask: 31,
        },
    },
];

// Codis que no s'han d'acceptar, i què n'ha de dir l'analitzador
const DOLENTS = [
    ['buit', '', { format: 'empty', valid: false, error: 'Buit' }],
    ['només espais', '   ', { format: 'empty', valid: false }],
    ['brossa', 'hola, no sé el codi', { format: 'unknown', valid: false, error: 'Format desconegut' }],
    [
        'v1-cb amb la lletra canviada',
        'Zq26-1203-1015-07,50-121311411111000000000000000000-cb',
        { format: 'v1-cb', valid: false, error: 'Checksum invàlid' },
    ],
    [
        'v2 amb una lletra que no quadra amb cap fórmula',
        'Zabc-1206-0930-EN-1-3-10-075-111211143111214111311112141111',
        { format: 'v2', valid: false, resultatsVerificats: false, error: 'Checksum invàlid' },
    ],
    [
        'v2 amb un resultat canviat (lletra nova)',
        'Gabc-1206-0930-EN-1-3-10-075-111211143111214111311112141114',
        // Quadra amb l'antiga per atzar? No: la G és la nova i l'antiga d'aquest codi és la E
        { format: 'v2', valid: false },
    ],
    [
        'v2 amb 51 resultats',
        'Gabc-1206-0930-EN-1-3-10-075-' + '1'.repeat(51),
        { format: 'unknown', valid: false, error: 'El codi porta 51 resultats i el màxim admès és 50' },
    ],
    [
        'v3 amb la lletra canviada',
        'Aq26-2010-1150-CB-2-2-04-25-3-03-GTGS-100-211100000000000000000000000000',
        { format: 'v3', valid: false, resultatsVerificats: false, error: 'Checksum invàlid' },
    ],
    [
        "v3 amb una empremta fora de l'alfabet (X)",
        'Mq26-2010-1150-CB-2-2-04-25-3-03-GTGX-100-211100000000000000000000000000',
        { format: 'unknown', valid: false },
    ],
];

(async () => {
    const { parseCode, esV2, MAX_RES } = await importa('js/analitzador-stepquiz/llegeix-codi.js');
    const cv = await importa('js/codi-verificacio.js');
    const { EXERCISE_CODES, EXERCISE_NAMES } = await importa('js/exercise-codes.js');

    suite('1. Un codi de cada format i de cada època');
    for (const f of FORMATS) camps(f.nom, parseCode(f.codi), f.esperat);
    for (const f of FORMATS)
        eq(`${f.nom}: amb espais al voltant es llegeix igual`, parseCode(`  ${f.codi} \t`).valid, true);
    ok(
        'esV2() és cert per als v2 i els v3, i fals per als altres',
        FORMATS.every(f => esV2(parseCode(f.codi)) === ['v2', 'v3'].includes(f.esperat.format))
    );
    eq('MAX_RES (resultats màxims del v2) és 50', MAX_RES, 50);
    {
        // Tots els formats donen els mateixos camps, perquè la taula i el detall no fallin
        const claus = r =>
            [
                'format',
                'valid',
                'checksumOk',
                'exercise',
                'exerciseCode',
                'note',
                'results',
                'resultsArray',
                'error',
            ].filter(k => !(k in r));
        const llegits = [...FORMATS.map(f => f.codi), ...DOLENTS.map(d => d[1])].map(parseCode);
        ok(
            'tots els codis llegits tenen els camps bàsics',
            llegits.every(r => claus(r).length === 0)
        );
        ok(
            'resultsArray és results xifra per xifra',
            llegits.every(r => r.resultsArray.join('') === r.results)
        );
    }

    suite('2. Codis dolents');
    for (const [nom, codi, esperat] of DOLENTS) camps(nom, parseCode(codi), esperat);
    eq('parseCode(null) no peta: és buit', parseCode(null).format, 'empty');

    suite("3. Anada i tornada del v2: tots els codis d'exercici");
    {
        const codis = [...new Set([...Object.values(EXERCISE_CODES), 'VO', 'XX'])];
        const casos = [
            { dif: '0', sessions: '1', questions: '01', notaInt: 0, results: '4'.padEnd(30, '0') },
            { dif: '3', sessions: '5', questions: '10', notaInt: 100, results: '1234'.repeat(12) + '12' },
            { dif: '2', sessions: '3', questions: '10', notaInt: 67, results: '1'.repeat(30) },
        ];
        const dates = [new Date(2026, 0, 1, 0, 0), new Date(2026, 11, 31, 23, 59), new Date(2027, 5, 9, 7, 5)];
        let fets = 0,
            bons = 0;
        const errors = [];
        for (const exCode of codis) {
            casos.forEach((c, i) => {
                const ara = dates[i % dates.length];
                const codi = cv.construeixCodiV2({ salt: 'kqz', ara, exCode, ...c });
                const p = parseCode(codi);
                fets++;
                const bo =
                    p.format === 'v2' &&
                    p.valid &&
                    p.resultatsVerificats &&
                    p.exerciseCode === exCode &&
                    p.exercise === (EXERCISE_NAMES[exCode] || exCode) &&
                    p.difficulty === +c.dif &&
                    p.sessions === +c.sessions &&
                    p.questions === +c.questions &&
                    p.note === c.notaInt / 10 &&
                    p.results === c.results &&
                    p.day === ara.getDate() &&
                    p.month === ara.getMonth() + 1 &&
                    p.hour === ara.getHours() &&
                    p.minute === ara.getMinutes();
                if (bo) bons++;
                else errors.push(codi);
            });
        }
        eq(
            `${fets} codis generats (${codis.length} exercicis × ${casos.length} casos), tots llegits igual`,
            bons,
            fets
        );
        if (errors.length) console.log('      → ' + errors.slice(0, 5).join('\n      → '));
        eq(
            'construeixCodiV2 dona el vector fix de tests/codi-verificacio.test.js',
            cv.construeixCodiV2({
                salt: 'abc',
                ara: new Date(2026, 5, 12, 9, 30),
                exCode: 'EN',
                dif: '1',
                sessions: '3',
                questions: '10',
                notaInt: 75,
                results: '111211143111214111311112141111',
            }),
            'Gabc-1206-0930-EN-1-3-10-075-111211143111214111311112141111'
        );
        ok(
            'game-core.js i vocabulari.js munten el codi amb construeixCodiV2',
            ['js/game-core.js', 'js/vocabulari/vocabulari.js'].every(f =>
                /construeixCodiV2\(/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))
            )
        );
    }

    suite('4. Anada i tornada del v3: els vectors de cb');
    for (const [codi, e] of V3) {
        const p = parseCode(codi);
        const nom = codi.slice(0, 24) + '…';
        camps(nom, p, {
            format: 'v3',
            valid: true,
            exerciseCode: 'CB',
            difficulty: e.curs,
            sessions: e.mode,
            questions: e.questions,
            note: e.notaInt / 10,
            cbConvocatoria: e.any === '00' ? null : '20' + e.any,
            cbDifMask: e.difMask,
            cbSentMask: e.sentMask,
            empremta: e.empremta,
            day: e.dd,
            month: e.mm,
            hour: e.hh,
            minute: e.mn,
        });
        eq(`${nom}: dificultats`, p.cbDificultats.map(d => d.valor).join(), e.dif.join());
        eq(`${nom}: sentits`, p.cbSentits.map(d => d.valor).join(), e.sent.join());
    }

    suite('5. Els codis que genera step-quiz/cb (si és clonat a ../cb)');
    const codiCB = path.join(ROOT, '..', 'cb', 'codi.js');
    if (!fs.existsSync(codiCB)) {
        console.log(
            "  · omès: no hi ha ../cb/codi.js (a GitHub és normal; els vectors del punt 4 ja s'hi han comprovat)"
        );
    } else {
        const CB = require(codiCB);
        // Llavor fixa: si falla, l'error es pot repetir
        let llavor = 20261021;
        const atzar = () => (llavor = (Math.imul(llavor, 1103515245) + 12345) >>> 0) / 2 ** 32;
        const tria = l => l[Math.floor(atzar() * l.length)];
        const subconjunt = l => l.filter(() => atzar() < 0.5);
        const NIVELLS = [null, '2eso', '4eso'];
        const ANYS = [null, '2022', '2023', '2024', '2025', '2026'];
        let fets = 0,
            bons = 0;
        const errors = [];
        for (let i = 0; i < 300; i++) {
            const nq = 1 + Math.floor(atzar() * 45);
            const ids = Array.from({ length: nq }, (_, k) => 100 + k * 3 + Math.floor(atzar() * 3));
            const modeExamen = atzar() < 0.5;
            const resultatsExamen = ids.map(id => ({ id, encertat: atzar() < 0.7 }));
            const intentsPerPregunta = Object.fromEntries(ids.map(id => [id, Math.floor(atzar() * 6)]));
            const encerts = resultatsExamen.filter(r => r.encertat).length;
            const d = {
                ara: new Date(
                    2026 + Math.floor(atzar() * 2),
                    Math.floor(atzar() * 12),
                    1 + Math.floor(atzar() * 28),
                    Math.floor(atzar() * 24),
                    Math.floor(atzar() * 60)
                ),
                nivell: tria(NIVELLS),
                any: tria(ANYS),
                dificultats: subconjunt(CB.DIFICULTATS),
                sentits: subconjunt(CB.SENTITS),
                modeExamen,
                ids,
                resultatsExamen,
                intentsPerPregunta,
                notaSobre10: (encerts / nq) * 10,
            };
            const codi = CB.construeix(d);
            const p = parseCode(codi);
            fets++;
            // Les triades, en l'ordre dels bits; cap triada vol dir totes
            const triades = (llista, taula) => taula.filter(v => !llista.length || llista.includes(v)).join();
            const bo =
                p.format === 'v3' &&
                p.valid &&
                p.cbNivell === ({ '2eso': '2n ESO', '4eso': '4t ESO' }[d.nivell] || 'Tots els cursos') &&
                p.cbMode === (modeExamen ? 'Examen' : 'Pràctica') &&
                p.questions === Math.min(nq, 99) &&
                p.cbConvocatoria === d.any &&
                p.cbDificultats.map(x => x.valor).join() === triades(d.dificultats, CB.DIFICULTATS) &&
                p.cbSentits.map(x => x.valor).join() === triades(d.sentits, CB.SENTITS) &&
                p.empremta === CB.empremta(ids) &&
                p.note === Math.round(d.notaSobre10 * 10) / 10 &&
                p.results.length === (nq > 30 ? 40 : 30);
            if (bo) bons++;
            else errors.push(codi);
        }
        eq(`${fets} codis generats per ../cb/codi.js a l'atzar, tots llegits igual`, bons, fets);
        if (errors.length) console.log('      → ' + errors.slice(0, 5).join('\n      → '));
    }

    finish('Lector de codis');
})();
