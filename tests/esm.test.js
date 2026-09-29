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
const vm = require('vm');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish, listFiles } = require('./harness');

// Entorn mínim: window.location (llegit en generar preguntes) i les funcions de
// js/utils.js, que en el navegador són globals (script clàssic).
globalThis.window = globalThis;
globalThis.location = { search: '', pathname: '/test.html' };
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/utils.js'), 'utf8'), { filename: 'js/utils.js' });

const isESM = src => /^\s*(import|export)\s/m.test(src);
const modules = listFiles('js', ['.js'])
    .filter(f => f.split(path.sep).length === 3) // js/<activitat>/<fitxer>.js
    .filter(f => isESM(fs.readFileSync(path.join(ROOT, f), 'utf8')));
// Controladors: fan servir el DOM en carregar-se (s'importen des d'una pàgina)
const isController = src => /Object\.assign\(window|document\.(getElementById|querySelector)/.test(src);

(async () => {
    suite(`Mòduls ES carregats amb import() natiu`);
    let tested = 0;
    for (const f of modules) {
        const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
        if (isController(src)) continue;
        const declared = [...src.matchAll(/^export const (\w+)/gm)].map(m => m[1]);
        try {
            const mod = await import(pathToFileURL(path.join(ROOT, f)).href);
            const missing = declared.filter(n => mod[n] === undefined || mod[n] === null);
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
    ok(`s'han provat ${tested} mòduls de lògica`, tested >= 30, `només ${tested}`);
    finish('TESTS DELS MÒDULS ES');
})();
