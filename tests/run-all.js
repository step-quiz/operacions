/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/run-all.js
 * ROL: Executa TOTS els tests del projecte, un darrere l'altre, i acaba amb
 *      error si algun falla. És el que executa GitHub a cada pujada
 *      (.github/workflows/tests.yml).
 * ÚS: node tests/run-all.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TESTS = [
    ['Comprovacions del repositori', 'tests/check-repo.js'],
    ['Tests dels mòduls', 'tests/modules.test.js'],
    ['Tests dels mòduls ES', 'tests/esm.test.js'],
    ['Tests de les sessions fixes', 'tests/fixed-sessions.test.js'],
    ['Lletra de control dels codis', 'tests/codi-verificacio.test.js'],
    ['Lector de codis (analitzador)', 'tests/llegeix-codi.test.js'],
    ["Intents repetits a l'analitzador", 'tests/intents.test.js'],
    ['Mode esvaïment', 'tests/esvaiment.test.js'],
    ['Equacions de 1r grau (empremta i resolució pas a pas)', 'tests/equacions.test.js'],
    ['Fraccions (resolució pas a pas)', 'tests/fraccions.test.js'],
    ['Resolució pas a pas (pissarra)', 'tests/pissarra.test.js'],
    ['Resolució pas a pas al navegador (si hi ha Playwright)', 'tests/navegador/prova-pissarra.js'],
    ['Tests de derivades', 'js/derivades/run-tests.js'],
    ['Documentació ↔ codi', 'tests/docs_vs_codi.py'],
];

const results = TESTS.map(([name, file]) => {
    console.log(`\n${'═'.repeat(60)}\n  ${name}  (${file})\n${'═'.repeat(60)}`);
    // Els .py (només biblioteca estàndard) amb python3; la resta, amb el mateix Node.
    const exe = file.endsWith('.py') ? 'python3' : process.execPath;
    const r = spawnSync(exe, [path.join(ROOT, file)], { stdio: 'inherit', cwd: ROOT });
    return [name, r.status === 0];
});

console.log(`\n${'═'.repeat(60)}\n  RESUM\n${'═'.repeat(60)}`);
results.forEach(([name, passed]) => console.log(`  ${passed ? '✓' : '✗'} ${name}`));
const allPassed = results.every(([, passed]) => passed);
console.log(allPassed ? '\nTot correcte.' : '\nHi ha errors: mira els ✗ de més amunt.');
process.exit(allPassed ? 0 : 1);
