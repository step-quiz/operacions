/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/vectors-cb-v3.js
 * ROL: Els vectors fixos del format v3 (CB). Són els MATEIXOS codis que genera
 *      tests/codi.test.js de step-quiz/cb a partir d'unes entrades: si se'n canvia
 *      un aquí, cal canviar-lo allà. Els fan servir tests/codi-verificacio.test.js
 *      (la lletra i els camps) i tests/llegeix-codi.test.js (el que en treu l'analitzador).
 * ============================================================================
 */
'use strict';

// [codi, camps que se n'han de llegir]
module.exports = [
    [
        'Mq26-2010-1150-CB-2-2-04-25-3-03-GTGS-100-211100000000000000000000000000',
        {
            curs: 2,
            mode: 2,
            questions: 4,
            any: '25',
            difMask: 3,
            sentMask: 3,
            empremta: 'GTGS',
            notaInt: 100,
            dd: 20,
            mm: 10,
            hh: 11,
            mn: 50,
            dif: ['1', '2'],
            sent: ['numeric', 'algebraic'],
        },
    ],
    [
        'Ns26-2010-0905-CB-0-1-08-00-7-31-PSSH-075-141141110000000000000000000000',
        {
            curs: 0,
            mode: 1,
            questions: 8,
            any: '00',
            difMask: 7,
            sentMask: 31,
            empremta: 'PSSH',
            notaInt: 75,
            dd: 20,
            mm: 10,
            hh: 9,
            mn: 5,
            dif: ['1', '2', '3'],
            sent: ['numeric', 'algebraic', 'mesura', 'espacial', 'estocastic'],
        },
    ],
    [
        'Bs26-2912-2359-CB-1-2-31-24-4-08-UHVO-100-1211311141111111111111111111111000000000',
        {
            curs: 1,
            mode: 2,
            questions: 31,
            any: '24',
            difMask: 4,
            sentMask: 8,
            empremta: 'UHVO',
            notaInt: 100,
            dd: 29,
            mm: 12,
            hh: 23,
            mn: 59,
            dif: ['3'],
            sent: ['espacial'],
        },
    ],
    [
        'Cq27-0401-0800-CB-2-1-03-00-6-21-GDIL-033-144000000000000000000000000000',
        {
            curs: 2,
            mode: 1,
            questions: 3,
            any: '00',
            difMask: 6,
            sentMask: 21,
            empremta: 'GDIL',
            notaInt: 33,
            dd: 4,
            mm: 1,
            hh: 8,
            mn: 0,
            dif: ['2', '3'],
            sent: ['numeric', 'mesura', 'estocastic'],
        },
    ],
    [
        'Jq26-2010-1200-CB-2-2-04-00-7-31-OUTV-100-111100000000000000000000000000',
        {
            curs: 2,
            mode: 2,
            questions: 4,
            any: '00',
            difMask: 7,
            sentMask: 31,
            empremta: 'OUTV',
            notaInt: 100,
            dd: 20,
            mm: 10,
            hh: 12,
            mn: 0,
            dif: ['1', '2', '3'],
            sent: ['numeric', 'algebraic', 'mesura', 'espacial', 'estocastic'],
        },
    ],
    [
        'Yq26-2010-1200-CB-2-2-04-00-7-31-NTNO-100-111100000000000000000000000000',
        {
            curs: 2,
            mode: 2,
            questions: 4,
            any: '00',
            difMask: 7,
            sentMask: 31,
            empremta: 'NTNO',
            notaInt: 100,
            dd: 20,
            mm: 10,
            hh: 12,
            mn: 0,
            dif: ['1', '2', '3'],
            sent: ['numeric', 'algebraic', 'mesura', 'espacial', 'estocastic'],
        },
    ],
];
