/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/punts.test.js
 * ROL: La regla única dels punts (js/punts.js) i sumaPunts() de game-core.js:
 *   - puntsAmbErrors: 10 punts, 2 menys per error, mai per sota de 0; una
 *     activitat pot declarar un altre descompte (perError).
 *   - validaPunts: només accepta enters de 0 a 10 (els altres valors els porta
 *     dins del marge i diu que no eren vàlids).
 *   - sumaPunts: suma a state.sessionScore els punts validats, mai més de 10
 *     per pregunta, i avisa a la consola si en rep de no vàlids.
 * ÚS: node tests/punts.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish } = require('./harness');

// Compara per contingut (també llistes i objectes)
const eq = (label, actual, expected) =>
    ok(
        label,
        JSON.stringify(actual) === JSON.stringify(expected),
        `esperat ${JSON.stringify(expected)}, rebut ${JSON.stringify(actual)}`
    );

// Entorn mínim perquè game-core.js es pugui importar fora del navegador
globalThis.window = globalThis;
globalThis.location = { search: '', pathname: '/test.html' };

(async () => {
    const P = await import(pathToFileURL(path.join(ROOT, 'js/punts.js')).href);

    suite('1. puntsAmbErrors: 10 punts, 2 menys per error');
    eq('0 errors → 10', P.puntsAmbErrors(0), 10);
    eq('1 error → 8', P.puntsAmbErrors(1), 8);
    eq('3 errors → 4', P.puntsAmbErrors(3), 4);
    eq('5 errors → 0', P.puntsAmbErrors(5), 0);
    eq('9 errors → 0 (mai per sota de 0)', P.puntsAmbErrors(9), 0);
    eq('errors negatius o no numèrics compten com 0', [P.puntsAmbErrors(-2), P.puntsAmbErrors(undefined)], [10, 10]);
    eq('excepció declarada: 1 punt per error (3 errors → 7)', P.puntsAmbErrors(3, 1), 7);
    eq('PUNTS_MAX és 10', P.PUNTS_MAX, 10);

    suite('2. validaPunts: només enters de 0 a 10');
    for (let p = 0; p <= 10; p++) {
        const v = P.validaPunts(p);
        if (!v.ok || v.punts !== p) ok(`${p} és vàlid`, false, JSON.stringify(v));
    }
    ok('de 0 a 10, tots vàlids i iguals', true);
    eq('11 → 10, no vàlid', P.validaPunts(11), { punts: 10, ok: false });
    eq('65 → 10, no vàlid (el cas «65 / 10»)', P.validaPunts(65), { punts: 10, ok: false });
    eq('-3 → 0, no vàlid', P.validaPunts(-3), { punts: 0, ok: false });
    eq('6.5 → 7, no vàlid', P.validaPunts(6.5), { punts: 7, ok: false });
    eq('NaN → 0, no vàlid', P.validaPunts(NaN), { punts: 0, ok: false });
    eq("'8' (text) → 8", P.validaPunts('8'), { punts: 8, ok: true });

    suite('2b. Una part opcional (Fórmules STEAM: nombres 8 − 2 per error, lletres +2 / +1 / 0)');
    const R = { maxAbans: 8, despres: [2, 1] };
    eq('sense errors i amb lletres: 10', P.puntsAmbPartOpcional(0, 0, R), 10);
    eq('sense errors i sense lletres: 8', P.puntsAmbPartOpcional(0, null, R), 8);
    eq('un error amb lletres: 8 + 1 = 9', P.puntsAmbPartOpcional(0, 1, R), 9);
    eq('dos errors amb lletres: 8 + 0', P.puntsAmbPartOpcional(0, 2, R), 8);
    eq('un error amb nombres i cap amb lletres: 6 + 2', P.puntsAmbPartOpcional(1, 0, R), 8);
    eq(
        'cinc errors amb nombres: 0 (+ lletres)',
        [P.puntsAmbPartOpcional(5, null, R), P.puntsAmbPartOpcional(5, 0, R)],
        [0, 2]
    );
    ok(
        'sempre uns punts vàlids (enter de 0 a 10)',
        [0, 1, 2, 3, 4, 5, 9].every(a =>
            [null, 0, 1, 2, 7].every(d => P.validaPunts(P.puntsAmbPartOpcional(a, d, R)).ok)
        )
    );

    suite('3. sumaPunts (game-core.js): la porta d’entrada dels punts a la sessió');
    const errors = [];
    const consoleError = console.error;
    console.error = (...a) => errors.push(a.join(' '));
    try {
        const G = await import(pathToFileURL(path.join(ROOT, 'js/game-core.js')).href);
        globalThis.document = { getElementById: () => null }; // sense marcador
        G.state.sessionScore = 0;
        eq('sumaPunts(8) suma 8', [G.sumaPunts(8), G.state.sessionScore], [8, 8]);
        eq('sumaPunts(65) en suma 10, no 65', [G.sumaPunts(65), G.state.sessionScore], [10, 18]);
        eq('sumaPunts(-4) no en treu cap', [G.sumaPunts(-4), G.state.sessionScore], [0, 18]);
        eq('els dos valors no vàlids surten a la consola', errors.length, 2);
        eq('MAX_PUNTS_PREGUNTA (la nota sobre 10) val PUNTS_MAX', G.MAX_PUNTS_PREGUNTA, P.PUNTS_MAX);
    } finally {
        console.error = consoleError;
    }

    finish('PUNTS DE CADA PREGUNTA');
})();
