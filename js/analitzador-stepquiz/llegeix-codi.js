/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/analitzador-stepquiz/llegeix-codi.js
 * ROL: Llegeix un codi de verificació, de qualsevol època, i en diu el format,
 *      si és vàlid i què hi ha a dins. Lògica pura, sense DOM: la fa servir
 *      analitzador-stepquiz.js i la comprova tests/llegeix-codi.test.js.
 *
 *   Formats que es llegeixen (vegeu CONTRIBUTING.md, «Codis de verificació»):
 *     'v3'     Lsss-DDMM-HHMM-CB-D-S-QQ-AA-F-SS-EEEE-NNN-RRR…  (13 segments; cb)
 *     'v2'     Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRR…  (9 segments; tots els exercicis
 *              d'operacions i cb fins al v3). Lletra nova o antiga.
 *     'v1-cb'  Lsss-DDMM-HHMM-N,NN-…-RRR(30)-cb  (els primers codis de cb)
 *     'empty' / 'unknown'  res, o res que s'hi assembli
 *   Es proven per aquest ordre. Cada format es reconeix per la forma (nombre de
 *   segments i el format de cada un), i per això un format nou no pot tenir la
 *   forma de cap dels anteriors: les proves ho vigilen.
 *
 *   REGLA: un format publicat no es toca mai. Els alumnes en tenen codis enviats
 *   al formulari i s'han de poder continuar llegint.
 * ============================================================================
 */

import { EXERCISE_NAMES } from '../exercise-codes.js';
import {
    versioLletra,
    lletraAntiga,
    cosDelCodi,
    llegeixCodiV3,
    llistaDeMascara,
    DIFICULTATS_CB,
    SENTITS_CB,
} from '../codi-verificacio.js';

// Codis d'exercici: taula única compartida amb game-core.js (js/exercise-codes.js).
// 'CB' és el codi que genera el projecte cb (Competències Bàsiques).
const EX = { ...EXERCISE_NAMES, CB: 'competencies-basiques' };

// Llargada màxima del camp de resultats del format v2: una posició per pregunta.
// Els codis de 30 continuen sent vàlids, perquè la regla accepta el rang 30-50
// (50 = 5 sessions × 10 preguntes, el màxim que permet el generador d'enllaços).
export const MAX_RES = 50;
const RE_RES_OK = new RegExp(`^[01234]{30,${MAX_RES}}$`);
const RE_RES_LLARG = new RegExp(`^[01234]{${MAX_RES + 1},}$`);

// Els codis v2 i els v3 (CB amb convocatòria, dificultats, sentits i empremta) comparteixen els camps bàsics
export const esV2 = p => p.format === 'v2' || p.format === 'v3';

// Un codi buit o que no es pot llegir: els mateixos camps que els altres perquè el detall de la fila no falli (p.note, etc.)
function senseCodi(format, error) {
    return {
        format,
        valid: false,
        checksumOk: false,
        exercise: '?',
        exerciseCode: '',
        note: null,
        difficulty: 0,
        sessions: null,
        questions: null,
        day: null,
        month: null,
        hour: null,
        minute: null,
        results: '',
        resultsArray: [],
        error,
    };
}

export function parseCode(raw) {
    if (!raw || !raw.trim()) return senseCodi('empty', 'Buit');
    const code = raw.trim(),
        p = code.split('-');
    const v3 = llegeixCodiV3(code);
    if (v3) {
        const result = {
            format: 'v3',
            valid: v3.valid,
            checksumOk: v3.valid,
            resultatsVerificats: v3.valid, // al v3 només hi ha lletra nova: cobreix també els resultats
            exercise: EX[v3.exCode] || v3.exCode,
            exerciseCode: v3.exCode,
            note: v3.notaInt / 10,
            difficulty: v3.curs, // com al v2: el camp D (a CB és el curs)
            sessions: v3.mode, // com al v2: el camp S (a CB és el mode)
            questions: v3.questions,
            day: v3.dd,
            month: v3.mm,
            hour: v3.hh,
            minute: v3.mn,
            results: v3.results,
            resultsArray: v3.results.split('').map(Number),
            cbNivell: null,
            cbAny: null,
            cbMode: null,
            cbConvocatoria: null,
            cbDifMask: v3.difMask,
            cbSentMask: v3.sentMask,
            cbDificultats: llistaDeMascara(v3.difMask, DIFICULTATS_CB),
            cbSentits: llistaDeMascara(v3.sentMask, SENTITS_CB),
            empremta: v3.empremta,
            error: v3.valid ? null : 'Checksum invàlid',
        };
        if (v3.exCode === 'CB') {
            result.cbNivell = { 1: '2n ESO', 2: '4t ESO', 0: 'Tots els cursos' }[v3.curs] || null;
            result.cbAny = /^\d{2}$/.test(v3.salt.slice(1)) ? '20' + v3.salt.slice(1) : null; // any en què es fa la prova
            result.cbMode = v3.mode === 1 ? 'Examen' : v3.mode === 2 ? 'Pràctica' : null;
            result.cbConvocatoria = v3.any === '00' ? null : '20' + v3.any;
        }
        return result;
    }
    if (
        p.length === 9 &&
        /^[A-Z][a-z][a-z0-9]{2}$/.test(p[0]) &&
        /^\d{4}$/.test(p[1]) &&
        /^\d{4}$/.test(p[2]) &&
        /^[A-Z0-9]{2}$/.test(p[3]) &&
        /^[0-3]$/.test(p[4]) &&
        /^[1-5]$/.test(p[5]) &&
        /^\d{2}$/.test(p[6]) &&
        /^\d{3}$/.test(p[7]) &&
        RE_RES_OK.test(p[8])
    ) {
        const ltr = p[0][0],
            salt = p[0].slice(1),
            dd = +p[1].slice(0, 2),
            mm = +p[1].slice(2, 4),
            hh = +p[2].slice(0, 2),
            mn = +p[2].slice(2, 4);
        // Lletra nova (cobreix també els resultats) o antiga (codis d'abans del 18/10/2026)
        const ni = +p[7],
            versio = versioLletra(ltr, ni, dd, mm, hh, mn, salt, cosDelCodi(p[3], p[4], p[5], p[6], p[8])),
            ok = versio !== null;
        const result = {
            format: 'v2',
            valid: ok,
            checksumOk: ok,
            resultatsVerificats: versio === 'nova',
            exercise: EX[p[3]] || p[3],
            exerciseCode: p[3],
            note: ni / 10,
            difficulty: +p[4],
            sessions: +p[5],
            questions: +p[6],
            day: dd,
            month: mm,
            hour: hh,
            minute: mn,
            results: p[8],
            resultsArray: p[8].split('').map(Number),
            cbNivell: null,
            cbAny: null,
            cbMode: null,
            error: ok ? null : 'Checksum invàlid',
        };
        // Decodifica camps CB del salt i sessions (si exerciseCode==='CB')
        if (p[3] === 'CB') {
            result.cbNivell = salt[0] === 'q' ? '4t ESO' : salt[0] === 's' ? '2n ESO' : null;
            result.cbAny = salt[1] && salt[2] && /^\d{2}$/.test(salt[1] + salt[2]) ? '20' + salt[1] + salt[2] : null;
            result.cbMode = +p[5] === 1 ? 'Examen' : +p[5] === 2 ? 'Pràctica' : null;
        }
        return result;
    }
    if (
        p.length >= 6 &&
        /^[A-Z][a-z][a-z0-9]{2}$/.test(p[0]) &&
        /^\d{4}$/.test(p[1]) &&
        /^\d{4}$/.test(p[2]) &&
        /^[0-9]{30}$/.test(p[p.length - 2]) &&
        p[p.length - 1] === 'cb'
    ) {
        const ltr = p[0][0],
            salt = p[0].slice(1),
            dd = +p[1].slice(0, 2),
            mm = +p[1].slice(2, 4),
            hh = +p[2].slice(0, 2),
            mn = +p[2].slice(2, 4);
        const nota = parseFloat(p[3].replace(',', '.')),
            ni = Math.round(nota * 100),
            ok = lletraAntiga(ni, dd, mm, hh, mn, salt) === ltr;
        const res = p[p.length - 2];
        // Decodifica salt: pos0='s'->2n ESO,'q'->4t ESO; pos1-2=any
        const cbNivell = salt[0] === 'q' ? '4t ESO' : salt[0] === 's' ? '2n ESO' : null;
        const cbAny = salt[1] && salt[2] && /^\d{2}$/.test(salt[1] + salt[2]) ? '20' + salt[1] + salt[2] : null;
        return {
            format: 'v1-cb',
            valid: ok,
            checksumOk: ok,
            resultatsVerificats: false,
            exercise: 'cb',
            exerciseCode: 'CB',
            cbNivell,
            cbAny,
            note: nota,
            difficulty: 0,
            sessions: null,
            questions: null,
            day: dd,
            month: mm,
            hour: hh,
            minute: mn,
            results: res,
            resultsArray: res.split('').map(Number),
            error: ok ? null : 'Checksum invàlid',
        };
    }
    // Format bo però massa resultats: val la pena dir-ho, perquè si no l'usuari
    // veu «Format desconegut» i no sap on mirar.
    if (p.length === 9 && RE_RES_LLARG.test(p[8]))
        return senseCodi('unknown', `El codi porta ${p[8].length} resultats i el màxim admès és ${MAX_RES}`);
    return senseCodi('unknown', 'Format desconegut');
}
