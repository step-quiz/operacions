/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-logaritmes.js
 * ROL: «Logaritmes i equacions» (bloc 1) en un navegador de debò (Chromium amb
 *      Playwright), al Chromebook tàctil de 1366×768: una sessió de cada nivell, de cap
 *      a cap. La prova llegeix l'enunciat i les opcions de la pantalla (el TeX de KaTeX),
 *      en calcula les respostes amb el model independent (tests/logaritmes-model.js) i les
 *      escriu: 10 punts a cada exercici i cap error a la consola. A la tauleta, la casella
 *      decimal rep la coma del teclat propi. Sense codi (Batxillerat).
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-logaritmes.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { ROOT, suite, ok, finish } = require('../harness');
const { avalua, expressio, logIArgument } = require('../logaritmes-model');

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch (e) {
    console.log('Playwright no hi és: la prova al navegador s’omet.');
    process.exit(0);
}

const PORT = 8900 + Math.floor(Math.random() * 90);
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

(async () => {
    const servidor = await engegaServidor();
    const navegador = await chromium.launch();
    try {
        const pagina = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
        const errorsJs = [];
        pagina.on('pageerror', e => errorsJs.push(String(e)));
        pagina.on('console', m => m.type() === 'error' && errorsJs.push(m.text()));
        const espera = ms => pagina.waitForTimeout(ms);
        const N = 4;
        const malament = [];
        suite('1. Una sessió de cada nivell, de cap a cap (Chromebook 1366×768)');
        for (const tipus of ['definicio', 'calcul', 'propietats']) {
            await pagina.goto(`${BASE}/logaritmes.html?tipus=${tipus}&totaloperations=${N}&maxintents=10`);
            await espera(1000);
            for (let qi = 0; qi < N; qi++) {
                const tex = await pagina.$eval('.jp-original annotation', a => a.textContent);
                const e = expressio(tex);
                for (let guarda = 0; guarda < 6; guarda++) {
                    if (await pagina.$('.franja-final')) break;
                    const opcions = await pagina.$$('#jp-opcions .jp-opcio:not([disabled])');
                    if (opcions.length && (await opcions[0].isVisible())) {
                        // L'opció bona: la que val el mateix que l'enunciat (amb a, b, c a l'atzar)
                        let bona = null;
                        for (const o of opcions) {
                            const t = (await o.getAttribute('aria-label')) || (await o.textContent()).trim();
                            if (t === 'Positiu' || t === 'Negatiu') {
                                if ((t === 'Negatiu') === avalua(e) < 0) bona = o;
                                continue;
                            }
                            const vars = { a: 2.3, b: 5.7, c: 1.9 };
                            try {
                                if (Math.abs(avalua(t, vars) - avalua(e, vars)) < 1e-9) bona = o;
                            } catch {
                                /* opció que no és una expressió */
                            }
                        }
                        if (!bona) {
                            malament.push(`cap opció bona: ${tex}`);
                            break;
                        }
                        await bona.click();
                    } else {
                        const noms = await pagina.$$eval('#jp-plantilla input.jp-camp', is => [
                            ...new Set(is.map(i => i.dataset.nom)),
                        ]);
                        const pas = await pagina.textContent('#jp-enunciat');
                        let valors = {};
                        if (noms.includes('a')) {
                            // Forma exponencial ↔ logarítmica
                            const [esq, dre] = e.split('=').map(t => t.trim());
                            if (/^\\log/.test(esq)) {
                                const { b, x } = logIArgument(esq);
                                valors = { a: b, y: avalua(dre), x };
                            } else {
                                const m = /^(\d+)\^\{(-?\d+)\}$/.exec(esq);
                                valors = { a: Number(m[1]), y: Number(m[2]), x: avalua(dre) };
                            }
                        } else if (noms.includes('k')) valors = { k: avalua(e) };
                        else if (/calculadora/.test(pas)) valors = { v: Math.abs(avalua(e)) };
                        else valors = { v: avalua(e) };
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
        ok('cada exercici es fa de cap a cap amb 10 punts', !malament.length, malament.join('\n      → '));
        ok('no dona codi (Batxillerat)', !(await pagina.$('#codi-icona')));
        ok('cap error a la consola', !errorsJs.length, errorsJs.join('\n      → '));

        suite('2. Tauleta: la casella decimal rep la coma');
        const ctx = await navegador.newContext({
            viewport: { width: 1024, height: 768 },
            hasTouch: true,
            isMobile: true,
        });
        const t = await ctx.newPage();
        let trobat = false;
        for (let k = 0; k < 12 && !trobat; k++) {
            await t.goto(`${BASE}/logaritmes.html?tipus=calcul&totaloperations=1`);
            await t.waitForTimeout(800);
            const tex = await t.$eval('.jp-original annotation', a => a.textContent);
            if (!/^\\text\{Calcula \} \\(log|ln) \d/.test(tex) || /\\log_/.test(tex)) continue;
            const e = expressio(tex);
            const signe = avalua(e) < 0 ? 'Negatiu' : 'Positiu';
            const op = await t.$(`#jp-opcions .jp-opcio:has-text("${signe}")`);
            if (!op) continue;
            await op.tap();
            await t.waitForTimeout(600);
            const inp = t.locator('#jp-plantilla input[data-part="v"]');
            if (!(await inp.count())) continue;
            await inp.tap();
            for (const key of ['0', ',', '5']) await t.locator(`#customKeyboard .kb-btn[data-key="${key}"]`).tap();
            const v = await inp.inputValue();
            ok('tocar la casella i el teclat: «0,5»', v === '0,5', v);
            trobat = true;
        }
        ok('s’ha trobat un exercici de calculadora per provar-ho', trobat);
        await ctx.close();
    } finally {
        await navegador.close();
        servidor.kill();
    }
    finish('LOGARITMES AL NAVEGADOR');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
