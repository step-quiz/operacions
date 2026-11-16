/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-activitats.js
 * ROL: Juga les activitats en un navegador de debò (Chromium amb Playwright):
 *   1. Les activitats de resposta triada (trigonometria, Pitàgores, sinus i
 *      cosinus, derivades, integrals, probabilitat, llenguatge algebraic, recta
 *      numèrica i asímptotes): una sessió curta clicant opcions. A cada pregunta,
 *      la franja diu els punts que toquen (10 menys 2 per cada error, o 0 si
 *      s'esgoten els intents) i s'hi prem «Següent». En acabar, la nota és la
 *      suma dels punts sobre 10, la icona «Codi» és a punt i l'analitzador
 *      llegeix el codi (exercici, nota i resultat de cada pregunta). Derivades
 *      i integrals (Batxillerat, senseCodi) no en donen: ni icona ni «Copiar codi».
 *   2. El teclat numèric propi en una tauleta: a totes les activitats que en
 *      tenen, cada casella que es toca rep el que s'escriu (també la segona
 *      casella d'una pregunta, i el signe a part de Complexos).
 *   i cap error a la consola.
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-activitats.js
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

/** Engega tools/servidor.js i espera que respongui. */
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

const coma = n => n.toFixed(1).replace('.', ',');

/** La franja del final de pregunta: { ok, punts } o null si no n'hi ha. */
const franja = pagina =>
    pagina.evaluate(() => {
        const f = document.querySelector('.franja-final');
        if (!f || !f.offsetParent) return null;
        const p = f.querySelector('.franja-punts');
        return {
            ok: f.classList.contains('franja-ok'),
            punts: p ? parseInt(p.textContent.replace(/[^\d]/g, ''), 10) : null,
        };
    });

/**
 * Juga una pregunta clicant opcions per ordre (sense repetir-ne cap) fins que surt la franja.
 * Torna { errors, franja }.
 */
async function juga(pagina, selector) {
    const clicades = new Set();
    let errors = 0;
    for (let k = 0; k < 14; k++) {
        const f = await franja(pagina);
        if (f) return { errors, franja: f };
        const botons = await pagina.$$(selector);
        let fet = false;
        for (let i = 0; i < botons.length; i++) {
            if (clicades.has(i)) continue;
            const b = botons[i];
            if (!(await b.isVisible().catch(() => false))) continue;
            const estat = await b.evaluate(e => ({
                cls: e.className,
                pe: getComputedStyle(e).pointerEvents,
                dis: e.disabled,
            }));
            if (estat.dis || estat.pe === 'none' || /wrong|correct|disabled|reveal/.test(estat.cls)) continue;
            clicades.add(i);
            await b.click({ timeout: 2000 }).catch(() => {});
            await pagina.waitForTimeout(1050); // les animacions de l'error (fins a 1 s)
            if (!(await franja(pagina))) errors++;
            fet = true;
            break;
        }
        if (!fet) await pagina.waitForTimeout(500);
    }
    return { errors, franja: await franja(pagina) };
}

(async () => {
    const servidor = await engegaServidor();
    const navegador = await chromium.launch();
    const { parseCode } = await import(pathToFileURL(path.join(ROOT, 'js/analitzador-stepquiz/llegeix-codi.js')).href);
    try {
        suite('1. Activitats de resposta triada: punts a cada pregunta, «Següent», nota i codi');
        const JOCS = [
            ['raons-trigonometria', '.btn-value', 'RT'],
            ['triangle-rectangle', '.btn-value', 'TR'],
            ['teorema-sin-cos', '.btn-value', 'TC'],
            ['derivades', '#options-container .btn-option', null], // Batxillerat: sense codi (senseCodi)
            ['integrals', '#options-container .btn-option', null], // Batxillerat: sense codi (senseCodi)
            ['probabilitat', '#options-container .btn-option', 'PB'],
            ['llenguatge-algebraic', '#options-grid .btn-option', 'LA'],
            ['recta-numerica', '#options-container .btn-option', 'RN'],
            ['asimptotes', '#options-container .btn-option', 'AS'],
        ];
        const N = 3;
        for (const [nom, selector, ex] of JOCS) {
            const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
            const errorsJs = [];
            pagina.on('pageerror', e => errorsJs.push(String(e)));
            pagina.on('dialog', d => d.dismiss().catch(() => {}));
            const q = nom === 'asimptotes' ? `?preguntes=${N}` : `?totaloperations=${N}&totalsessions=1&maxintents=10`;
            await pagina.goto(`${BASE}/${nom}.html${q}`);
            await pagina.waitForTimeout(900);
            let total = 0;
            const resultats = [];
            const malament = [];
            for (let i = 0; i < N; i++) {
                const { errors, franja: f } = await juga(pagina, selector);
                if (!f) {
                    malament.push(`pregunta ${i + 1}: no surt la franja`);
                    break;
                }
                const esperat = f.ok ? Math.max(0, 10 - 2 * errors) : 0;
                if (f.punts !== esperat)
                    malament.push(`pregunta ${i + 1}: ${errors} errors → ${f.punts} punts (esperat ${esperat})`);
                total += f.punts || 0;
                resultats.push(f.ok ? Math.min(errors + 1, 3) : 4);
                const boto = await pagina.$('.franja-final #btn-next');
                const text = boto ? (await boto.textContent()).trim() : '';
                const ultima = i === N - 1;
                if (text !== (ultima ? 'Veure resultats' : 'Següent'))
                    malament.push(`pregunta ${i + 1}: el botó diu «${text}»`);
                if (boto) await boto.click();
                await pagina.waitForTimeout(700);
                if (!ultima && (await franja(pagina))) malament.push(`pregunta ${i + 1}: la franja no se'n va`);
            }
            ok(
                `${nom}: cada pregunta dona 10 punts menys 2 per error, i «Següent» passa a la següent`,
                !malament.length,
                malament.join('\n      → ')
            );

            // Resum pedagògic (derivades, integrals, probabilitat): «Continua» porta a la pantalla final
            const continua = await pagina.$('#summary-continue-btn');
            if (continua && (await continua.isVisible())) {
                await continua.click();
                await pagina.waitForTimeout(500);
            }
            const textFinal = await pagina.evaluate(
                () =>
                    (document.querySelector('#final-summary') || document.querySelector('.summary-score-value') || {})
                        .textContent || ''
            );
            const nota = coma((total / (N * 10)) * 10);
            ok(
                `${nom}: la nota final és ${nota} / 10 (${total} punts de ${N * 10})`,
                textFinal.includes(`${nota} / 10`),
                textFinal.replace(/\s+/g, ' ').slice(0, 120)
            );

            // Batxillerat del motor comú (senseCodi): ni icona «Codi» ni botó «Copiar codi»
            if (!ex) {
                const res = await pagina.evaluate(() => {
                    const copiar = document.getElementById('btn-copiar');
                    return {
                        icona: !!document.getElementById('codi-icona'),
                        copiar: !!copiar && getComputedStyle(copiar).display !== 'none',
                    };
                });
                ok(
                    `${nom}: no dona codi (ni icona «Codi» ni botó «Copiar codi»)`,
                    !res.icona && !res.copiar,
                    JSON.stringify(res)
                );
                ok(`${nom}: cap error a la consola`, !errorsJs.length, errorsJs.join('\n      → '));
                await pagina.close();
                continue;
            }

            // La icona «Codi» és a punt i l'analitzador llegeix el codi
            const llest = await pagina.evaluate(() =>
                document.getElementById('codi-icona')?.classList.contains('codi-llest')
            );
            let codi = null;
            if (llest) {
                await pagina.click('#codi-icona');
                await pagina.waitForTimeout(200);
                codi = await pagina.evaluate(() => document.querySelector('.codi-text')?.textContent || null);
                await pagina.keyboard.press('Escape');
            }
            const c = codi ? parseCode(codi.trim()) : null;
            ok(
                `${nom}: el codi és vàlid i diu ${ex}, nota ${nota} i els resultats ${resultats.join('')}`,
                !!c &&
                    c.valid &&
                    c.exerciseCode === ex &&
                    c.note === Number(((total / N / 10) * 10).toFixed(1)) &&
                    c.results.startsWith(resultats.join('')),
                codi
                    ? JSON.stringify({ codi, valid: c && c.valid, ex: c && c.exerciseCode, nota: c && c.note })
                    : 'sense codi'
            );
            ok(`${nom}: cap error a la consola`, !errorsJs.length, errorsJs.join('\n      → '));
            await pagina.close();
        }

        suite('2. El teclat numèric propi en una tauleta: cada casella tocada rep el que s’escriu');
        const ctx = await navegador.newContext({
            viewport: { width: 1024, height: 768 },
            hasTouch: true,
            isMobile: true,
        });
        const TECLAT = [
            ['area-perimetre.html', []],
            ['decimals.html', []],
            ['equacions.html', []],
            ['proporciodirecta.html', []],
            ['gots-fitxes.html', []],
            ['mitjana.html', []],
            ['estadistica-inversa.html', []],
            ['estadistica.html?tipus=calcat', []],
            ['fraccions.html', ['button[onclick="selectMode(\'addsub\')"]']],
            ['radicals.html', ['[onclick="selectRepte(1)"]']],
            ['potencies.html', ['[onclick="selectRepte(3)"]']],
            ['sistemes-equacions.html', ['[onclick="selectRepte(2)"]']],
            ['complexos.html', []],
            ['esglaonar-matriu.html', []],
            ['inversa-matriu.html', []],
            ['ruffini.html', ['candidat']],
            ['rectes-plans.html', ['tria']],
        ];
        for (const [pag, abans] of TECLAT) {
            const pagina = await ctx.newPage();
            const errorsJs = [];
            pagina.on('pageerror', e => errorsJs.push(String(e)));
            await pagina.goto(`${BASE}/${pag}`);
            await pagina.waitForTimeout(800);
            for (const a of abans) {
                if (a === 'candidat') {
                    for (const b of await pagina.$$('button')) {
                        if (/^[+-]\d+$/.test((await b.textContent()).trim())) {
                            await b.tap();
                            break;
                        }
                    }
                    await pagina.waitForTimeout(1500);
                } else if (a === 'tria') {
                    const sel = await pagina.$('select.target-sel');
                    const v = await sel.$$eval('option', os => os.map(o => o.value).filter(Boolean));
                    await sel.selectOption(v[0]);
                    await pagina.waitForTimeout(500);
                } else {
                    await pagina.tap(a).catch(() => {});
                    await pagina.waitForTimeout(900);
                }
            }
            const n = await pagina.evaluate(() => {
                const l = [
                    ...document.querySelectorAll('input:not([type]), input[type="text"], input[type="number"]'),
                ].filter(i => i.offsetParent && !i.disabled && i.dataset.locked !== 'true' && i.dataset.kb !== 'off');
                l.forEach((e, k) => e.setAttribute('data-prova', k));
                return l.length;
            });
            const malament = [];
            for (let k = 0; k < Math.min(n, 4); k++) {
                const abansVal = await pagina.$eval(`[data-prova="${k}"]`, i => i.value);
                await pagina.tap(`[data-prova="${k}"]`);
                await pagina.waitForTimeout(250);
                await pagina.tap('#customKeyboard .kb-btn[data-key="7"]').catch(() => {});
                await pagina.waitForTimeout(120);
                const r = await pagina.$eval(`[data-prova="${k}"]`, i => ({
                    v: i.value,
                    ro: i.readOnly,
                    im: i.getAttribute('inputmode'),
                }));
                if (r.v !== abansVal + '7' || !r.ro || r.im !== 'none')
                    malament.push(`casella ${k + 1}: ${JSON.stringify(r)} (abans «${abansVal}»)`);
            }
            ok(
                `${pag}: ${Math.min(n, 4)} caselles tocades, cadascuna rep la tecla «7» i cap no obre el teclat del sistema`,
                n > 0 && !malament.length,
                n ? malament.join('\n      → ') : 'cap casella'
            );
            if (pag === 'complexos.html') {
                // La part imaginària té el signe a part: la tecla − el canvia
                const signe = await pagina.evaluate(() => {
                    const i = document.querySelector('input[data-sign-id]');
                    return i ? { id: i.id, s: i.dataset.signId } : null;
                });
                if (signe) {
                    await pagina.tap('#' + signe.id);
                    await pagina.waitForTimeout(200);
                    const a = await pagina.$eval('#' + signe.s, e => e.textContent.trim());
                    await pagina.tap('#customKeyboard .kb-btn[data-key="-"]');
                    const d = await pagina.$eval('#' + signe.s, e => e.textContent.trim());
                    ok(
                        'complexos.html: a la part imaginària, la tecla − canvia el signe de davant',
                        a !== d,
                        `${a} → ${d}`
                    );
                }
            }
            ok(`${pag}: cap error a la consola`, !errorsJs.length, errorsJs.join('\n      → '));
            await pagina.close();
        }
        await ctx.close();
    } finally {
        await navegador.close();
        servidor.kill();
    }
    finish('ACTIVITATS AL NAVEGADOR');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
