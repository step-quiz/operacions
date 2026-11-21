/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-binomial.js
 * ROL: «Distribució binomial» en un navegador de debò (Chromium amb Playwright),
 *      al Chromebook tàctil de 1366×768: 6 problemes progressius de cap a cap. La prova
 *      llegeix l'enunciat de la pantalla, el busca entre tots els problemes possibles i en
 *      treu les respostes. Al primer problema que té camí, tria la ruta llarga (també val);
 *      a un altre, s'equivoca a posta oblidant C(n, k) i hi ha de sortir el perquè. Punts
 *      (10 − 2 per error), nota final, sense codi i cap error a la consola.
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-binomial.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish } = require('../harness');

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch (e) {
    console.log('Playwright no hi és: la prova al navegador s’omet.');
    process.exit(0);
}

const PORT = 8900 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;
const N = 6;

function engegaServidor() {
    const p = spawn(process.execPath, [path.join(ROOT, 'tools/servidor.js'), String(PORT)], { stdio: 'ignore' });
    return new Promise((resol, rebutja) => {
        const t0 = Date.now();
        const prova = () =>
            fetch(BASE + '/index.html')
                .then(() => resol(p))
                .catch(() =>
                    Date.now() - t0 > 8000 ? rebutja(new Error('el servidor no respon')) : setTimeout(prova, 150)
                );
        prova();
    });
}
const opcio = async (pagina, text) =>
    (
        await pagina.evaluateHandle(
            t => [...document.querySelectorAll('#jp-opcions .jp-opcio')].find(b => b.getAttribute('aria-label') === t),
            text
        )
    ).asElement();
/** Un nombre com l'escriu l'alumne: «0,2373». */
const coma = (x, d) => x.toFixed(d).replace('.', ',');

(async () => {
    const motor = await import(pathToFileURL(path.join(ROOT, 'js/binomial/math-engine.js')).href);
    const perEnunciat = new Map();
    for (const nivell of [1, 2, 3])
        for (const pr of motor.totsElsProblemes(nivell)) {
            const q = motor.preguntaDeProblema(pr);
            perEnunciat.set(q.text, q);
        }
    const servidor = await engegaServidor();
    const navegador = await chromium.launch();
    try {
        suite('1. Sis problemes de cap a cap (Chromebook 1366×768)');
        const pagina = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
        const errorsJs = [];
        pagina.on('pageerror', e => errorsJs.push(String(e)));
        pagina.on('console', m => m.type() === 'error' && errorsJs.push(m.text()));
        await pagina.goto(`${BASE}/binomial.html?totaloperations=${N}&maxintents=10`);
        await pagina.waitForTimeout(1000);
        const espera = ms => pagina.waitForTimeout(ms);
        const malament = [];
        let total = 0;
        let llargaFeta = false;
        let diagnostic = false;
        let nivells = [];
        for (let qi = 0; qi < N; qi++) {
            const text = await pagina.evaluate(() =>
                [...document.querySelectorAll('.jp-targeta-problema p')].map(p => p.textContent.trim()).join(' ')
            );
            let q = perEnunciat.get(text);
            if (!q) {
                malament.push(`problema ${qi + 1}: no el trobo («${text}»)`);
                break;
            }
            nivells.push(
                q.problemaBI.r === 'eq'
                    ? 1
                    : q.passos.some(p => p.id === 'cami' && /^1 -/.test(p.linia.split('= ')[1] || ''))
                      ? 3
                      : 2
            );
            let errorsQ = 0;
            let passos = q.passos;
            for (let k = 0; k < passos.length; k++) {
                const pas = passos[k];
                if (pas.mena === 'tria') {
                    let valor = 'ok';
                    if (pas.id === 'cami' && !llargaFeta && pas.opcions.some(o => o[0] === 'ok-llarg')) {
                        valor = 'ok-llarg';
                        llargaFeta = true;
                        passos = motor.passosSegonsCami(q, passos, pas, { tria: 'ok-llarg' });
                    }
                    await (await opcio(pagina, pas.opcions.find(o => o[0] === valor)[1])).click();
                } else {
                    if (pas.mena === 'cas' && !diagnostic && pas.solucio.c > 1) {
                        // Error a posta: sense el nombre combinatori
                        const { n, j, p } = pas.dades;
                        const sensC = p ** j * (1 - p) ** (n - j);
                        await pagina.fill('#jp-plantilla input[data-nom="c"]', String(pas.solucio.c));
                        await pagina.fill('#jp-plantilla input[data-nom="pj"]', coma(sensC, 4));
                        await pagina.click('#jp-ok');
                        await espera(300);
                        const diag = await pagina.textContent('#jp-diag');
                        diagnostic = /C\(n, k\)/.test(diag);
                        errorsQ++;
                        await espera(1200);
                    }
                    for (const [nom, v] of Object.entries(pas.solucio)) {
                        const tipus = pas.camps[nom];
                        if (tipus === 'enter') await pagina.fill(`#jp-plantilla input[data-nom="${nom}"]`, String(v));
                        else if (tipus === 'racional') {
                            await pagina.fill(`#jp-plantilla input[data-nom="${nom}"][data-part="n"]`, String(v[0]));
                            await pagina.fill(`#jp-plantilla input[data-nom="${nom}"][data-part="d"]`, String(v[1]));
                        } else {
                            const x = Array.isArray(v) ? v[0] / v[1] : v;
                            const d = pas.id === 'final' && q.problemaBI.forma === 'pc' ? 2 : 4;
                            await pagina.fill(
                                `#jp-plantilla input[data-nom="${nom}"]`,
                                coma(x, d).replace(/,?0+$/, '') || '0'
                            );
                        }
                    }
                    await pagina.click('#jp-ok');
                }
                await espera(500);
            }
            await pagina.waitForSelector('.franja-final', { timeout: 4000 }).catch(() => {});
            const punts = await pagina.evaluate(() => {
                const p = document.querySelector('.franja-final .franja-punts');
                return p ? parseInt(p.textContent.replace(/[^\d]/g, ''), 10) : null;
            });
            if (punts !== 10 - 2 * errorsQ)
                malament.push(`problema ${qi + 1}: ${punts} punts (esperat ${10 - 2 * errorsQ}) — ${text}`);
            total += punts || 0;
            await pagina.click('.franja-final #btn-next');
            await espera(800);
        }
        ok(
            'cada problema es fa de cap a cap i dona els punts que toquen',
            !malament.length,
            malament.join('\n      → ')
        );
        ok('la ruta llarga, si és correcta, també val', llargaFeta);
        ok('oblidar C(n, k): surt el perquè', diagnostic);
        ok(
            `sense ?tipus=, els nivells pugen al llarg de la sessió (${nivells.join(' ')})`,
            nivells[0] === 1 && nivells[N - 1] === 3
        );
        const continua = await pagina.$('#summary-continue-btn');
        if (continua && (await continua.isVisible())) {
            await continua.click();
            await espera(500);
        }
        const textFinal = await pagina.evaluate(() => document.body.textContent);
        const nota = ((total / (N * 10)) * 10).toFixed(1).replace('.', ',');
        ok(`la nota final és ${nota} / 10`, textFinal.includes(`${nota} / 10`));
        const codi = await pagina.evaluate(() => !!document.getElementById('codi-icona'));
        ok('no dona codi (Batxillerat)', !codi);
        ok('cap error a la consola', !errorsJs.length, errorsJs.join('\n      → '));
    } finally {
        await navegador.close();
        servidor.kill();
    }
    finish('DISTRIBUCIÓ BINOMIAL AL NAVEGADOR');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
