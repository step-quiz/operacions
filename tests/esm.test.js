/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/esm.test.js
 * ROL: Carrega de manera NATIVA (import() de Node) tots els mòduls ES de lògica
 *      de js/<activitat>/ i comprova que exporten el que declaren. Els altres
 *      tests els carreguen traduïts a un context aïllat; aquest verifica que
 *      també funcionen com a mòduls de debò (imports resolts, sintaxi, etc.).
 *      Els controladors no es carreguen aquí perquè necessiten la pàgina (DOM).
 * ÚS: node tests/esm.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish, listFiles } = require('./harness');

// Entorn mínim: window.location (la base i les preguntes llegeixen la URL)
globalThis.window = globalThis;
globalThis.location = { search: '', pathname: '/test.html' };

const isESM = src => /^\s*(import|export)\s/m.test(src);
// La base compartida (no toca el DOM en carregar-se) i els mòduls de lògica de cada activitat
const BASE = ['js/fixed-sessions.js', 'js/utils.js', 'js/config.js', 'js/exercise-codes.js', 'js/game-core.js'];
const modules = listFiles('js', ['.js'])
    .filter(f => f.split(path.sep).length === 3) // js/<activitat>/<fitxer>.js
    .filter(f => isESM(fs.readFileSync(path.join(ROOT, f), 'utf8')));
// Controladors: fan servir el DOM en carregar-se (s'importen des d'una pàgina)
const isController = src => /Object\.assign\(window|document\.(getElementById|querySelector)/.test(src);

(async () => {
    suite(`Mòduls ES carregats amb import() natiu`);
    let tested = 0;
    for (const f of [...BASE, ...modules]) {
        const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
        if (!BASE.includes(f) && isController(src)) continue;
        const declared = [...src.matchAll(/^export (?:const|(?:async )?function) (\w+)/gm)].map(m => m[1]);
        try {
            const mod = await import(pathToFileURL(path.join(ROOT, f)).href);
            // FixedSessions val null quan la URL no porta ?fixed=A/B/C
            const missing = declared.filter(n => mod[n] === undefined || (mod[n] === null && n !== 'FixedSessions'));
            ok(
                `${f} → ${declared.join(', ')}`,
                declared.length > 0 && !missing.length,
                `no s'han exportat: ${missing}`
            );
        } catch (e) {
            ok(`${f}`, false, e.message);
        }
        tested++;
    }
    ok(`s'han provat ${tested} mòduls (base + lògica)`, tested >= 38, `només ${tested}`);
    finish('TESTS DELS MÒDULS ES');
})();
