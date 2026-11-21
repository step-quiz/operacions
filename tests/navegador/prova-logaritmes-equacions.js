/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-logaritmes-equacions.js
 * ROL: «Logaritmes i equacions», bloc 2 (equacions), en un navegador de debò (Chromium
 *      amb Playwright), al Chromebook tàctil de 1366×768: una sessió de cada nivell, de
 *      cap a cap. La prova llegeix l'equació i les opcions de la pantalla (el TeX de
 *      KaTeX), en busca les solucions amb el model independent (tests/equacions-model.js)
 *      i respon: l'opció les solucions de la qual contenen les de l'equació, les
 *      solucions de segon grau, la x i les comprovacions (substituint). 10 punts a cada
 *      exercici, el subtítol de les equacions i cap error a la consola. Sense codi.
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-logaritmes-equacions.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { ROOT, suite, ok, finish } = require('../harness');
const { compila, equacio, solucions, expressioEQ, llistaX } = require('../equacions-model');

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch (e) {
    console.log('Playwright no hi és: la prova al navegador s’omet.');
    process.exit(0);
}

const PORT = 8990 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;

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
/** Un nombre com a fracció n/d (d ≤ 1000). */
function fraccio(x) {
    for (let d = 1; d <= 1000; d++) {
        const n = Math.round(x * d);
        if (Math.abs(n / d - x) < 1e-9) return [n, d];
    }
    throw new Error(`no és una fracció senzilla: ${x}`);
}

const mateix = (a, b, tol = 1e-6) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= tol);
const conte = (gran, petit) => petit.every(x => gran.some(y => Math.abs(x - y) < 1e-6));

(async () => {
    const servidor = await engegaServidor();
    const navegador = await chromium.launch();
    try {
        const pagina = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
        const errorsJs = [];
        pagina.on('pageerror', e => errorsJs.push(String(e)));
        pagina.on('console', m => m.type() === 'error' && errorsJs.push(m.text()));
        const espera = ms => pagina.waitForTimeout(ms);
        const anotacions = sel => pagina.$$eval(`${sel} annotation`, as => as.map(a => a.textContent));
        const N = 4;
        const malament = [];
        let subtitol = '';
        suite('1. Una sessió de cada nivell, de cap a cap (Chromebook 1366×768)');
        for (const tipus of ['basiques', 'mitjanes', 'irracionals']) {
            await pagina.goto(`${BASE}/logaritmes.html?tipus=${tipus}&totaloperations=${N}&maxintents=10`);
            await espera(1000);
            subtitol = await pagina.textContent('.subtitle');
            for (let qi = 0; qi < N; qi++) {
                const tex = await pagina.$eval('.jp-original annotation', a => a.textContent);
                const eq = expressioEQ(tex);
                const reals = solucions(eq, { lo: -20, hi: 120 });
                const { esq, dre } = equacio(eq);
                const log = /\\log|\\ln/.test(eq);
                for (let guarda = 0; guarda < 8; guarda++) {
                    if (await pagina.$('.franja-final')) break;
                    const opcions = await pagina.$$('#jp-opcions .jp-opcio:not([disabled])');
                    const enunciat = await anotacions('#jp-enunciat');
                    if (opcions.length && (await opcions[0].isVisible())) {
                        const textos = [];
                        for (const o of opcions)
                            textos.push((await o.getAttribute('aria-label')) || (await o.textContent()).trim());
                        let bones = [];
                        if (textos.some(t => /^Sí, és solució/.test(t))) {
                            // Comprovar: substituir x a l'equació inicial
                            const x = compila(enunciat[0].split('=')[1])({});
                            const e = esq(x);
                            const d = dre(x);
                            let motiu = /^Sí/;
                            if (!(Number.isFinite(e) && Number.isFinite(d) && Math.abs(e - d) < 1e-9))
                                motiu = log
                                    ? Number.isFinite(e)
                                        ? /no són iguals/
                                        : /logaritme/
                                    : Number.isFinite(e)
                                      ? /segon membre/
                                      : /radicand/;
                            bones = textos.filter(t => motiu.test(t));
                        } else if (textos.every(t => /^(x = -?[\d/]+( i x = -?[\d/]+)*|No té cap solució)$/.test(t))) {
                            bones = textos.filter(t => mateix(llistaX(t), reals));
                        } else {
                            // Una transformació: la que té (com a mínim) les solucions de l'equació
                            const base = /t = (\d+)\^\{x\}/.exec(enunciat.join(' '));
                            for (const t of textos) {
                                let s;
                                try {
                                    s = /t/.test(t.replace(/\\[a-z]+/g, ''))
                                        ? solucions(t, { lletra: 't', lo: -40, hi: 40 })
                                              .filter(v => v > 0)
                                              .map(v => Math.log(v) / Math.log(Number(base[1])))
                                        : solucions(t, { lo: -20, hi: 120 });
                                } catch {
                                    continue;
                                }
                                if (conte(s, reals) && s.length) bones.push(t);
                            }
                            // Si n'hi ha més d'una, la que no en té de sobres
                            if (bones.length > 1)
                                bones = bones.filter(t => mateix(solucions(t, { lo: -20, hi: 120 }), reals));
                        }
                        if (bones.length !== 1) {
                            malament.push(`${bones.length} opcions bones (${textos.join(' | ')}): ${tex}`);
                            break;
                        }
                        await opcions[textos.indexOf(bones[0])].click();
                    } else {
                        const noms = await pagina.$$eval('#jp-plantilla input.jp-camp', is => [
                            ...new Set(is.map(i => i.dataset.nom)),
                        ]);
                        let valors = {};
                        if (noms.includes('x1')) {
                            const quad = enunciat.find(t => /=\s*0/.test(t));
                            const lletra = /t/.test(quad) ? 't' : 'x';
                            const r = solucions(quad, { lletra, lo: -40, hi: 40 });
                            valors = { x1: r[0], x2: r[1] };
                        } else valors = { [noms[0]]: reals[0] };
                        for (const nom of noms) {
                            const parts = await pagina.$$(`#jp-plantilla input[data-nom="${nom}"]`);
                            const part = await parts[0].getAttribute('data-part');
                            if (part === 'n') {
                                const [n, d] = fraccio(valors[nom]);
                                await pagina.fill(`#jp-plantilla input[data-nom="${nom}"][data-part="n"]`, String(n));
                                await pagina.fill(
                                    `#jp-plantilla input[data-nom="${nom}"][data-part="d"]`,
                                    d === 1 ? '' : String(d)
                                );
                            } else if (part === 'v') {
                                await pagina.fill(
                                    `#jp-plantilla input[data-nom="${nom}"]`,
                                    valors[nom].toFixed(4).replace('.', ',')
                                );
                            } else
                                await pagina.fill(
                                    `#jp-plantilla input[data-nom="${nom}"]`,
                                    String(Math.round(valors[nom]))
                                );
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
                if (punts !== 10)
                    malament.push(
                        `${tipus} ${qi + 1}: ${punts} punts (${tex}) ${await pagina.textContent('#jp-diag').catch(() => '')}`
                    );
                const seg = await pagina.$('.franja-final #btn-next');
                if (seg) await seg.click();
                await espera(700);
            }
        }
        ok('cada equació es resol de cap a cap amb 10 punts', !malament.length, malament.join('\n      → '));
        ok('el subtítol és el de les equacions', /Equacions exponencials/.test(subtitol), subtitol);
        ok('no dona codi (Batxillerat)', !(await pagina.$('#codi-icona')));
        ok('cap error a la consola', !errorsJs.length, errorsJs.join('\n      → '));
        await pagina.goto(`${BASE}/logaritmes.html?totaloperations=1`);
        await espera(600);
        ok(
            'sense ?tipus= d’equacions, el subtítol dels logaritmes',
            /^Logaritmes:/.test(await pagina.textContent('.subtitle'))
        );
    } finally {
        await navegador.close();
        servidor.kill();
    }
    finish('LOGARITMES (EQUACIONS) AL NAVEGADOR');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
