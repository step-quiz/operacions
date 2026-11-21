/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-complexos-polar.js
 * ROL: Les pestanyes «Forma polar» i «Potències i arrels» de complexos.html en un
 *      navegador de debò (Chromium amb Playwright), al Chromebook tàctil de 1366×768:
 *   1. Cada apartat i cada nivell, de cap a cap: la prova llegeix l'enunciat de la
 *      pantalla (el TeX de KaTeX), en calcula les respostes amb el model independent
 *      (tests/complexos-polar-model.js) i les escriu: el quadrant i les arrels tocant el
 *      pla, les arrels c√s en dues caselles, els decimals amb coma i el signe amb el
 *      botó. Cap error al comptador i el missatge «Correcte».
 *   2. Un error a posta (l'argument de arctan sense el quadrant): surt el perquè i el
 *      comptador d'errors puja.
 *   3. ?pestanya=potencies obre directament la pestanya, i cap error a la consola.
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-complexos-polar.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { ROOT, suite, ok, finish } = require('../harness');
const { respostes } = require('../complexos-polar-model');

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

/** Un valor exacte com a c√s (s = 1, 2, 3 o 6). */
function comArrel(x) {
    for (const s of [1, 2, 3, 6]) {
        const c = x / Math.sqrt(s);
        if (Math.abs(c - Math.round(c)) < 1e-9) return { c: String(Math.round(c)), s: s === 1 ? '' : String(s) };
    }
    throw new Error(`no és c√s: ${x}`);
}
const coma = x => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');

(async () => {
    const servidor = await engegaServidor();
    const navegador = await chromium.launch();
    try {
        const pagina = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
        const errorsJs = [];
        pagina.on('pageerror', e => errorsJs.push(String(e)));
        pagina.on('console', m => m.type() === 'error' && !/favicon|404/.test(m.text()) && errorsJs.push(m.text()));
        const espera = ms => pagina.waitForTimeout(ms);

        /** Escriu un camp (arrel, enter o decimal amb signe) del pas actual. */
        async function omple(nom, valor) {
            const pas = '.cx-pas-actual';
            const parts = await pagina.$$(`${pas} input[data-nom="${nom}"]`);
            if (parts.length === 2) {
                const { c, s } = comArrel(valor);
                await pagina.fill(`${pas} input[data-nom="${nom}"][data-part="c"]`, c);
                await pagina.fill(`${pas} input[data-nom="${nom}"][data-part="s"]`, s);
                return;
            }
            const signe = await pagina.$(`${pas} .cx-signe`);
            const inp = `${pas} input[data-nom="${nom}"]`;
            const coma2 = (await pagina.getAttribute(inp, 'data-coma')) === 'true';
            if (signe && (await pagina.getAttribute(inp, 'data-sign-id'))) {
                const id = await pagina.getAttribute(inp, 'data-sign-id');
                if (valor < 0) await pagina.click(`#${id}`);
                await pagina.fill(inp, coma(Math.abs(valor)));
                return;
            }
            await pagina.fill(inp, coma2 ? coma(valor) : String(Math.round(valor)));
        }

        /** Fa un exercici sencer. Torna null si va bé, o un text si no. */
        async function fesExercici(nivell) {
            const tex = await pagina.$eval('.cx-enunciat annotation', a => a.textContent);
            const m = respostes(tex);
            const errorsAbans = await pagina.textContent('.cx-errors');
            let passos = 0;
            for (let guarda = 0; guarda < 8; guarda++) {
                if (await pagina.$('.cx-final .result-box')) break;
                const actual = await pagina.$('.cx-pas-actual');
                if (!actual) break;
                passos++;
                const quadrants = await pagina.$('.cx-pla-lloc [data-q]');
                const marques = await pagina.$$('.cx-pla-lloc [data-m]');
                const noms = await pagina.$$eval('.cx-pas-actual input', is => [
                    ...new Set(is.map(i => i.dataset.nom)),
                ]);
                if (quadrants && !noms.length) {
                    await pagina.click(`.cx-pla-lloc [data-q="${m.quadrant}"]`);
                } else if (marques.length && !noms.length) {
                    const bons = m.arrels.slice(1).map(a => Math.round(a) % 360);
                    // El pla es torna a dibuixar a cada toc: primer es trien els índexs
                    const tria = [];
                    for (const mk of marques) {
                        const a = Number(/(\d+)°/.exec(await mk.getAttribute('aria-label'))[1]) % 360;
                        if (bons.some(b => Math.abs(b - a) <= 1 || Math.abs(b - a) >= 359))
                            tria.push(await mk.getAttribute('data-m'));
                    }
                    for (const i of tria) await pagina.click(`.cx-pla-lloc [data-m="${i}"]`);
                    await pagina.click('.cx-pas-actual .cx-comprova');
                } else {
                    const valors = {};
                    if (m.apartat === 'pol-bin') Object.assign(valors, { a: m.a, b: m.b });
                    else if (m.apartat === 'prod-quoc') Object.assign(valors, { r: m.r, t: m.t });
                    else if (m.apartat === 'arrels') Object.assign(valors, { r: m.rArrel, t: m.t0 });
                    else if (noms.includes('a')) Object.assign(valors, { a: m.a, b: m.b });
                    else if (noms.length === 2) {
                        Object.assign(valors, { r: m.rn, t: m.tn });
                    } else Object.assign(valors, { r: m.r, t: m.t });
                    for (const nom of noms) await omple(nom, valors[nom]);
                    await pagina.click('.cx-pas-actual .cx-comprova');
                }
                await espera(350);
            }
            const fi = await pagina.$('.cx-final .result-box');
            const errorsDespres = await pagina.textContent('.cx-errors');
            if (!fi) return `no acaba (${tex}): ${await pagina.textContent('.cx-feedback')}`;
            if (errorsDespres !== errorsAbans) return `errors ${errorsAbans} → ${errorsDespres} (${tex})`;
            return passos ? null : 'cap pas';
        }

        suite('1. Cada apartat i cada nivell, de cap a cap (Chromebook 1366×768)');
        const malament = [];
        let fets = 0;
        for (const [pestanya, apartats] of [
            ['polar', ['bin-pol', 'pol-bin', 'prod-quoc', 'barreja-polar']],
            ['potencies', ['potencia', 'arrels', 'barreja-potencies']],
        ]) {
            await pagina.goto(`${BASE}/complexos.html?pestanya=${pestanya}`);
            await espera(900);
            for (const apartat of apartats)
                for (const nivell of [1, 2]) {
                    await pagina.click(`#panel-${pestanya} [data-apartat="${apartat}"]`);
                    await espera(200);
                    await pagina.click(`#panel-${pestanya} [data-nivell="${nivell}"]`);
                    await espera(300);
                    for (let k = 0; k < 2; k++) {
                        const r = await fesExercici(nivell);
                        fets++;
                        if (r) malament.push(`${apartat} ${nivell}: ${r}`);
                        const nou = await pagina.$(`#panel-${pestanya} .cx-nou`);
                        if (nou) await nou.click();
                        await espera(300);
                    }
                }
        }
        ok(`${fets} exercicis fets sense cap error i amb «Correcte»`, !malament.length, malament.join('\n      → '));

        suite('2. Un error a posta');
        await pagina.goto(`${BASE}/complexos.html?pestanya=polar`);
        await espera(900);
        await pagina.click('#panel-polar [data-nivell="2"]');
        await espera(300);
        let diag = '';
        for (let k = 0; k < 20 && !diag; k++) {
            const tex = await pagina.$eval('.cx-enunciat annotation', a => a.textContent);
            const m = respostes(tex);
            const atan = (Math.atan(m.z.im / m.z.re) * 180) / Math.PI;
            if (m.quadrant === 2 || m.quadrant === 3) {
                await pagina.click(`.cx-pla-lloc [data-q="${m.quadrant}"]`);
                await espera(300);
                await pagina.fill('.cx-pas-actual input[data-nom="r"]', coma(m.r));
                await pagina.click('.cx-pas-actual .cx-comprova');
                await espera(300);
                await pagina.fill('.cx-pas-actual input[data-nom="t"]', coma(atan));
                await pagina.click('.cx-pas-actual .cx-comprova');
                await espera(300);
                diag = await pagina.textContent('#panel-polar .cx-feedback');
            } else {
                await pagina.click('#panel-polar [data-apartat="bin-pol"]');
                await espera(300);
            }
        }
        ok('l’argument d’arctan sense el quadrant: surt el perquè (sumar 180°)', /180°/.test(diag), diag);
        ok('el comptador d’errors puja', (await pagina.textContent('#panel-polar .cx-errors')) === '1');

        suite('3. La pàgina');
        await pagina.goto(`${BASE}/complexos.html?pestanya=potencies`);
        await espera(900);
        const activa = await pagina.textContent('.ops-tab.active');
        ok('?pestanya=potencies obre «Potències i arrels»', /Potències i arrels/.test(activa));
        ok('cap error a la consola', !errorsJs.length, errorsJs.join('\n      → '));

        suite('4. Tauleta: el teclat propi escriu decimals amb coma i el signe va al botó');
        const ctx = await navegador.newContext({
            viewport: { width: 1024, height: 768 },
            hasTouch: true,
            isMobile: true,
        });
        const t = await ctx.newPage();
        await t.goto(`${BASE}/complexos.html?pestanya=polar`);
        await t.waitForTimeout(900);
        await t.locator('#panel-polar [data-apartat="pol-bin"]').tap();
        await t.waitForTimeout(200);
        await t.locator('#panel-polar [data-nivell="2"]').tap();
        await t.waitForTimeout(300);
        await t.locator('.cx-pas-actual input[data-nom="a"]').tap();
        for (const k of ['1', ',', '5']) await t.locator(`#customKeyboard .kb-btn[data-key="${k}"]`).tap();
        const v = await t.inputValue('.cx-pas-actual input[data-nom="a"]');
        await t.locator('.cx-pas-actual .cx-signe').first().tap();
        const signe = await t.textContent('.cx-pas-actual .cx-signe');
        ok(
            's’hi escriu «1,5» amb la tecla de la coma, i el botó posa el signe −',
            v === '1,5' && signe === '−',
            `${v} ${signe}`
        );
        await ctx.close();
    } finally {
        await navegador.close();
        servidor.kill();
    }
    finish('COMPLEXOS (FORMA POLAR I POTÈNCIES) AL NAVEGADOR');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
