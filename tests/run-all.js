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
    ['Punts de cada pregunta', 'tests/punts.test.js'],
    ['Lletra de control dels codis', 'tests/codi-verificacio.test.js'],
    ['Lector de codis (analitzador)', 'tests/llegeix-codi.test.js'],
    ["Intents repetits a l'analitzador", 'tests/intents.test.js'],
    ['Mode esvaïment', 'tests/esvaiment.test.js'],
    ['Equacions de 1r grau (empremta i resolució pas a pas)', 'tests/equacions.test.js'],
    ['Fraccions (resolució pas a pas)', 'tests/fraccions.test.js'],
    ["Prioritat d'operacions (resolució pas a pas)", 'tests/prioritat.test.js'],
    ['Equacions de 2n grau (equacions, passos i errors)', 'tests/equacions-segon-grau.test.js'],
    ['Expressions algebraiques (polinomis, expressions i errors)', 'tests/expressions-algebraiques.test.js'],
    ['Identitats notables (racionals, preguntes i errors)', 'tests/identitats-notables.test.js'],
    ['Fracció, decimal i percentatge (decimals, targetes i errors)', 'tests/fraccio-decimal-percentatge.test.js'],
    ['Percentatges (problemes, índexs i errors)', 'tests/percentatges.test.js'],
    ['La recta (quadrícula, punts i errors)', 'tests/recta.test.js'],
    ['La paràbola (paràboles, punts notables i errors)', 'tests/parabola.test.js'],
    ['Sistemes: «Mira-ho a la gràfica» (rectes i punt de tall)', 'tests/sistemes-grafica.test.js'],
    ['Gràfics estadístics (gràfic comú, preguntes i errors)', 'tests/grafics-estadistics.test.js'],
    ['Gràfiques en context (gràfica comuna, històries i errors)', 'tests/grafiques-context.test.js'],
    ["Canvi d'unitats (escala, passos i errors)", 'tests/canvi-unitats.test.js'],
    ['Àrees i volums (figures, passos i errors)', 'tests/arees-volums.test.js'],
    ["Prioritat d'operacions amb enters (signes, passos i errors)", 'tests/prioritat-enters.test.js'],
    ['Potències: reptes 4 i 5 (exponents negatius i notació científica)', 'tests/potencies.test.js'],
    ['Fórmules STEAM (aïllar una lletra, passos i errors)', 'tests/formules-steam.test.js'],
    ['Inequacions (passos, recta, interval i errors)', 'tests/inequacions.test.js'],
    ['Resolució pas a pas (pissarra)', 'tests/pissarra.test.js'],
    ['Resolució pas a pas al navegador (si hi ha Playwright)', 'tests/navegador/prova-pissarra.js'],
    ['Activitats jugades al navegador (si hi ha Playwright)', 'tests/navegador/prova-activitats.js'],
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
