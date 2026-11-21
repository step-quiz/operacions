/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-estudi-funcio.js
 * ROL: «Estudi d'una funció» en un navegador de debò (Chromium amb Playwright), al
 *      Chromebook tàctil de 1366×768:
 *   1. Els 6 exercicis de PAU de cap a cap: domini, f′, zeros, la taula de signes (punts de
 *      prova i botons), la fila de f, la y dels extrems, la gràfica, la part opcional (f″) i la
 *      taula de la concavitat. Un error fet a posta a la primera taula: surt el perquè i la
 *      cel·la queda marcada. Punts de cada funció = 8 − 2 per error de la 1a part + 2 de la
 *      part opcional sense errors; la nota final quadra; sense codi (Batxillerat).
 *   2. En una tauleta, el teclat numèric propi escriu als punts de prova (amb el signe −).
 *   i cap error a la consola.
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-estudi-funcio.js
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

/** El botó d'opció amb aquest text (aria-label; el TeX porta barres que un selector CSS no vol). */
const opcio = async (pagina, text) =>
    (
        await pagina.evaluateHandle(
            t => [...document.querySelectorAll('#jp-opcions .jp-opcio')].find(b => b.getAttribute('aria-label') === t),
            text
        )
    ).asElement();

(async () => {
    const { generaPreguntaEF } = await import(pathToFileURL(path.join(ROOT, 'js/estudi-funcio/math-engine.js')).href);
    const { puntDeProva } = await import(pathToFileURL(path.join(ROOT, 'js/passos/taula-signes.js')).href);
    const servidor = await engegaServidor();
    const navegador = await chromium.launch();
    try {
        suite('1. Els 6 exercicis de PAU, de cap a cap (Chromebook 1366×768)');
        const pagina = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
        const errorsJs = [];
        pagina.on('pageerror', e => errorsJs.push(String(e)));
        pagina.on('console', m => m.type() === 'error' && errorsJs.push(m.text()));
        await pagina.goto(`${BASE}/estudi-funcio.html?funcions=pau&totaloperations=${N}&maxintents=10`);
        await pagina.waitForTimeout(1000);
        const espera = ms => pagina.waitForTimeout(ms);
        const enunciat = () => pagina.textContent('#jp-enunciat');
        const malament = [];
        let total = 0;
        let diagnosticVist = false;
        let cellaMarcada = false;

        for (let qi = 0; qi < N; qi++) {
            const q = generaPreguntaEF({ funcions: 'pau', index: qi });
            let errors1 = 0;
            let opcional = false;
            for (let k = 0; k < q.passos.length; k++) {
                const pas = q.passos[k];
                if (k === q.opcional.desDe) {
                    await pagina.waitForSelector('.jp-opcio-tria-fase', { timeout: 4000 });
                    await (await pagina.$$('.jp-opcio-tria-fase'))[0].click();
                    opcional = true;
                    await espera(500);
                }
                const abans = await enunciat();
                if (pas.mena === 'tria' && pas.id !== 'grafica') {
                    const bona = pas.opcions.find(o => o[0] === 'ok')[1];
                    await (await opcio(pagina, bona)).click();
                } else if (pas.id === 'grafica') {
                    // L'ordre de les gràfiques és a l'atzar: es proven fins que una passa
                    for (let i = 0; i < 3; i++) {
                        const b = (await pagina.$$('#jp-opcions .jp-opcio:not([disabled])'))[0];
                        await b.click();
                        await espera(1200);
                        const fase = await pagina.$('.jp-opcio-tria-fase');
                        if (fase && (await fase.isVisible())) break;
                        errors1++;
                    }
                    continue;
                } else if (pas.mena === 'taula-signes' || pas.mena === 'taula-f') {
                    const t = pas.plantilla[0].taula;
                    const omple = async valors => {
                        for (const [fila, vs] of Object.entries(valors))
                            for (let i = 0; i < vs.length; i++) {
                                const sel = `#jp-plantilla td[data-fila="${fila}"][data-col="${i}"] button`;
                                for (let c = 0; c < 6; c++) {
                                    if ((await pagina.getAttribute(sel, 'data-valor')) === vs[i]) break;
                                    await pagina.click(sel);
                                }
                            }
                    };
                    if (pas.solucio.taula.prova)
                        for (let i = 0; i < t.columnes.length; i++)
                            if (t.columnes[i].tipus === 'interval')
                                await pagina.fill(
                                    `#jp-plantilla input[data-part="p${i}"]`,
                                    String(puntDeProva(t.columnes[i]))
                                );
                    if (qi === 0 && pas.id === 'taula1') {
                        // Un error a posta: el primer interval amb el signe al revés
                        const s = pas.solucio.taula.files.s.slice();
                        s[0] = s[0] === 'mes' ? 'menys' : 'mes';
                        await omple({ s });
                        await pagina.click('#jp-ok');
                        await espera(300);
                        const diag = await pagina.textContent('#jp-diag');
                        diagnosticVist = (await pagina.isVisible('#jp-diag')) && diag.length > 20;
                        cellaMarcada = !!(await pagina.$('#jp-plantilla td[data-fila="s"][data-col="0"].jp-malament'));
                        errors1++;
                        await espera(1200);
                    }
                    await omple(pas.solucio.taula.files);
                    await pagina.click('#jp-ok');
                } else if (pas.mena === 'extrems') {
                    for (const [nom, [n, d]] of Object.entries(pas.solucio)) {
                        await pagina.fill(`#jp-plantilla input[data-nom="${nom}"][data-part="n"]`, String(n));
                        if (d !== 1)
                            await pagina.fill(`#jp-plantilla input[data-nom="${nom}"][data-part="d"]`, String(d));
                    }
                    await pagina.click('#jp-ok');
                }
                await espera(500);
                const despres = await enunciat().catch(() => '');
                const fi = await pagina.$('.franja-final');
                if (despres === abans && !fi && k < q.passos.length - 1)
                    malament.push(`funció ${qi + 1}, pas ${pas.id}: no ha passat`);
            }
            await pagina.waitForSelector('.franja-final', { timeout: 4000 }).catch(() => {});
            const punts = await pagina.evaluate(() => {
                const p = document.querySelector('.franja-final .franja-punts');
                return p ? parseInt(p.textContent.replace(/[^\d]/g, ''), 10) : null;
            });
            const esperat = Math.max(0, 8 - 2 * errors1) + (opcional ? 2 : 0);
            if (punts !== esperat) malament.push(`funció ${qi + 1}: ${punts} punts (esperat ${esperat})`);
            total += punts || 0;
            await pagina.click('.franja-final #btn-next');
            await espera(800);
        }
        ok(
            'cada funció es pot fer de cap a cap i dona els punts que toquen',
            !malament.length,
            malament.join('\n      → ')
        );
        ok('un error a la taula: surt el perquè i la cel·la queda marcada', diagnosticVist && cellaMarcada);
        const continua = await pagina.$('#summary-continue-btn');
        if (continua && (await continua.isVisible())) {
            await continua.click();
            await espera(500);
        }
        const textFinal = await pagina.evaluate(() => document.body.textContent);
        const nota = ((total / (N * 10)) * 10).toFixed(1).replace('.', ',');
        ok(`la nota final és ${nota} / 10`, textFinal.includes(`${nota} / 10`));
        const codi = await pagina.evaluate(() => ({
            icona: !!document.getElementById('codi-icona'),
            copiar:
                !!document.getElementById('btn-copiar') &&
                getComputedStyle(document.getElementById('btn-copiar')).display !== 'none',
        }));
        ok('no dona codi (Batxillerat)', !codi.icona && !codi.copiar, JSON.stringify(codi));
        ok('cap error a la consola', !errorsJs.length, errorsJs.join('\n      → '));
        await pagina.close();

        suite('2. Tauleta: el teclat numèric propi escriu als punts de prova');
        const ctx = await navegador.newContext({
            viewport: { width: 1024, height: 768 },
            hasTouch: true,
            isMobile: true,
        });
        const tauleta = await ctx.newPage();
        await tauleta.goto(`${BASE}/estudi-funcio.html?funcions=pau&totaloperations=1`);
        await tauleta.waitForTimeout(900);
        const q = generaPreguntaEF({ funcions: 'pau', index: 0 });
        for (const id of ['d1', 'zeros1']) {
            const bona = q.passos.find(p => p.id === id).opcions.find(o => o[0] === 'ok')[1];
            await (await opcio(tauleta, bona)).tap();
            await tauleta.waitForTimeout(500);
        }
        await tauleta.locator('#jp-plantilla input[data-part="p0"]').tap();
        await tauleta.locator('#customKeyboard .kb-btn[data-key="-"]').tap();
        await tauleta.locator('#customKeyboard .kb-btn[data-key="2"]').tap();
        const v = await tauleta.inputValue('#jp-plantilla input[data-part="p0"]');
        ok('tocar un punt de prova i el teclat: s’hi escriu −2', /^[-−]2$/.test(v), v);
        await ctx.close();
    } finally {
        await navegador.close();
        servidor.kill();
    }
    finish('ESTUDI D’UNA FUNCIÓ AL NAVEGADOR');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
