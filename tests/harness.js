/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/harness.js
 * ROL: Eines mínimes per als tests (sense dependències: només Node).
 * ARQUITECTURA:
 * - suite() / ok() / eq(): registre de resultats i sortida per consola.
 * - loadModule(): carrega fitxers JS del projecte dins d'un context aïllat
 *   (vm.createContext), com si fossin <script> d'una pàgina. Cada mòdul té
 *   el seu propi context, així els noms compartits (MathEngine, QuestionBank…)
 *   no xoquen entre si.
 * - Math.random es substitueix per un generador amb llavor (Mulberry32): els
 *   tests donen sempre el mateix resultat i, si fallen, l'error es pot repetir.
 * - Els mòduls ES es carreguen al mateix context traduint `import {X} from
 *   './x.js'` (x.js s'ha d'haver carregat abans a la llista), `export const X =`
 *   (queda també a window.X, per als tests) i `export function X` (global).
 *   Que els imports i exports quadrin ho comproven check-repo.js, esm.test.js
 *   i ESLint.
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

let passed = 0,
    failed = 0;
const failures = [];
let currentSuite = '';

function suite(name) {
    currentSuite = name;
    console.log(`\n▶ ${name}`);
}

function ok(label, cond, detail = '') {
    if (cond) {
        passed++;
        console.log(`  ✓ ${label}`);
    } else {
        failed++;
        failures.push(`${currentSuite} › ${label}`);
        console.log(`  ✗ ${label}${detail ? `\n      → ${detail}` : ''}`);
    }
}

function eq(label, actual, expected) {
    ok(label, actual === expected, `esperat ${JSON.stringify(expected)}, rebut ${JSON.stringify(actual)}`);
}

/** Acaba el procés amb el resum i codi de sortida 0 (tot bé) o 1 (algun error). */
function finish(title) {
    console.log(`\n${'─'.repeat(60)}\n${title}: ${passed} correctes, ${failed} errors`);
    if (failed) failures.forEach(f => console.log(`  ✗ ${f}`));
    process.exit(failed ? 1 : 0);
}

const MULBERRY32 = `function (seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}`;

/** Tradueix un mòdul ES a un script clàssic per al context aïllat dels tests. */
function esmToScript(src, file) {
    const out = src
        .replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?[ \t]*$/gm, '')
        .replace(/^import\s*['"][^'"]+['"];?.*$/gm, '') // import només per l'efecte
        .replace(/^export const (\w+)\s*=/gm, 'const $1 = window.$1 =')
        .replace(/^export ((?:async )?function\*? )/gm, '$1'); // funció de nivell superior: ja és global
    if (/^\s*(import|export)\s/m.test(out)) throw new Error(`${file}: import/export que els tests no saben traduir`);
    return '"use strict";\n' + out; // els mòduls sempre són estrictes
}
const isESM = src => /^\s*(import|export)\s/m.test(src);

/**
 * Carrega fitxers del projecte (camins relatius a l'arrel) en un context nou.
 * @param {string[]} files   p. ex. ['js/utils.js', 'js/integrals/math-engine.js']
 * @param {object}   opts    { search: '?nivell=2', seed: 12345 }
 * @returns {object} el "window" del context (hi ha QuestionBank, MathEngine…)
 */
function loadModule(files, { search = '', seed = 12345 } = {}) {
    const ctx = { console, URLSearchParams };
    ctx.window = ctx;
    ctx.location = { search, pathname: '/test.html' };
    vm.createContext(ctx);
    vm.runInContext(`Math.random = (${MULBERRY32})(${seed});`, ctx);
    for (const f of files) {
        const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
        vm.runInContext(isESM(src) ? esmToScript(src, f) : src, ctx, { filename: f });
    }
    return ctx;
}

/** Llista recursiva de fitxers amb una extensió, sense .git, node_modules ni vendor. */
function listFiles(dir, exts, skip = ['.git', 'node_modules', 'vendor']) {
    const out = [];
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (!skip.includes(e.name)) out.push(...listFiles(rel, exts, skip));
        } else if (exts.some(x => e.name.endsWith(x))) out.push(rel);
    }
    return out;
}

module.exports = {
    esmToScript,
    ROOT,
    suite,
    ok,
    eq,
    finish,
    loadModule,
    listFiles,
};
