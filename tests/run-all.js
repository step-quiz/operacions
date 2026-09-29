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
    ['Tests de derivades', 'js/derivades/run-tests.js'],
];

const results = TESTS.map(([name, file]) => {
    console.log(`\n${'═'.repeat(60)}\n  ${name}  (${file})\n${'═'.repeat(60)}`);
    const r = spawnSync(process.execPath, [path.join(ROOT, file)], { stdio: 'inherit', cwd: ROOT });
    return [name, r.status === 0];
});

console.log(`\n${'═'.repeat(60)}\n  RESUM\n${'═'.repeat(60)}`);
results.forEach(([name, passed]) => console.log(`  ${passed ? '✓' : '✗'} ${name}`));
const allPassed = results.every(([, passed]) => passed);
console.log(allPassed ? '\nTot correcte.' : '\nHi ha errors: mira els ✗ de més amunt.');
process.exit(allPassed ? 0 : 1);
