/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-inequacions-no-lineals.js
 * ROL: «Inequacions» de 2n grau i racionals (lliurament 22c) en un navegador de debò
 *      (Chromium amb Playwright), al Chromebook tàctil de 1366×768 i a la tauleta: una
 *      sessió de cada nivell, de cap a cap. La prova llegeix la inequació, les opcions, la
 *      taula i la recta de la pantalla, les resol amb el model independent
 *      (tests/equacions-model.js) i respon: l'opció equivalent, els zeros, la taula de
 *      signes (punt de prova i signes tocant les cel·les), la recta amb trams (tocant
 *      trams i punts, o «Cap solució») i l'interval. 10 punts a cada inequació, el
 *      subtítol i cap error a la consola.
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-inequacions-no-lineals.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { ROOT, suite, ok, finish } = require('../harness');
const { compila } = require('../equacions-model');

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch (e) {
    console.log('Playwright no hi és: la prova al navegador s’omet.');
    process.exit(0);
}

const PORT = 9080 + Math.floor(Math.random() * 90);
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

/** «A ⊙ B» → (x) → true/false (fora del domini, false). */
function inequacio(tex) {
    const m = /^(.*?)\s*(\\le|\\ge|<|>)\s*(.*)$/.exec(tex);
    const [esq, dre] = [compila(m[1]), compila(m[3])];
    return x => {
        const d = esq({ x }) - dre({ x });
        if (!Number.isFinite(d)) return false;
        return m[2] === '<' ? d < -1e-9 : m[2] === '>' ? d > 1e-9 : m[2] === '\\le' ? d <= 1e-9 : d >= -1e-9;
    };
}
function conjunt(tex) {
    if (tex === '\\varnothing') return () => false;
    if (tex === '\\mathbb{R}') return () => true;
    const peces = tex.split(' \\cup ').map(p => {
        let m;
        if ((m = /^\\\{(-?\d+)\\\}$/.exec(p))) return x => Math.abs(x - Number(m[1])) < 1e-9;
        m = /^([([])(-\\infty|-?\d+), (\+\\infty|-?\d+)([)\]])$/.exec(p);
        const a = m[2] === '-\\infty' ? -Infinity : Number(m[2]);
        const b = m[3] === '+\\infty' ? Infinity : Number(m[3]);
        return x => (m[1] === '[' ? x >= a : x > a) && (m[4] === ']' ? x <= b : x < b);
    });
    return x => peces.some(f => f(x));
}
const GRAELLA = Array.from({ length: 97 }, (_, k) => (k - 48) / 4);
const iguals = (f, g) => GRAELLA.every(x => f(x) === g(x));
const nombre = t => Number(t.replace('−', '-').replace('+∞', 'Infinity').replace('-∞', '-Infinity'));
const dins = (a, b) =>
    a === -Infinity && b === Infinity ? 0 : a === -Infinity ? b - 1 : b === Infinity ? a + 1 : Math.floor(a) + 1;

/** Escriu un nombre: amb fill a l'ordinador; a la tauleta, tocant la casella i el teclat propi. */
async function escriu(pagina, sel, text, tactil) {
    if (!tactil) return pagina.fill(sel, text);
    await pagina.locator(sel).tap();
    for (const c of text) await pagina.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
}

async function sessio(pagina, tipus, N, malament, tactil = false) {
    const espera = ms => pagina.waitForTimeout(ms);
    const anotacions = sel => pagina.$$eval(`${sel} annotation`, as => as.map(a => a.textContent));
    await pagina.goto(`${BASE}/inequacions.html?tipus=${tipus}&totaloperations=${N}&maxintents=10`);
    await espera(1000);
    for (let qi = 0; qi < N; qi++) {
        const tex = await pagina.$eval('.jp-original annotation', a => a.textContent);
        const original = inequacio(tex);
        for (let guarda = 0; guarda < 8; guarda++) {
            if (await pagina.$('.franja-final')) break;
            const enunciatText = await pagina.textContent('#jp-enunciat');
            const enunciat = await anotacions('#jp-enunciat');
            const opcions = await pagina.$$('#jp-opcions .jp-opcio:not([disabled])');
            if (opcions.length && (await opcions[0].isVisible())) {
                const textos = [];
                for (const o of opcions)
                    textos.push((await o.getAttribute('aria-label')) || (await o.textContent()).trim());
                let bones;
                if (/passa-ho tot/.test(enunciatText)) bones = textos.filter(t => iguals(inequacio(t), original));
                else if (/Quina és la solució/.test(enunciatText))
                    bones = textos.filter(t => iguals(conjunt(t), original));
                else {
                    const eq = enunciat[0];
                    const g = compila(eq.replace(/ = 0$/, ''));
                    const zeros = GRAELLA.filter(x => Math.abs(g({ x })) < 1e-9);
                    bones = textos.filter(t => {
                        const xs = [...t.matchAll(/x = (-?\d+)/g)].map(m => Number(m[1])).sort((a, b) => a - b);
                        return JSON.stringify(xs) === JSON.stringify(zeros);
                    });
                }
                if (bones.length !== 1) {
                    malament.push(`${bones.length} opcions bones (${textos.join(' | ')}): ${tex}`);
                    break;
                }
                await opcions[textos.indexOf(bones[0])].click();
            } else if (await pagina.$('#jp-plantilla .jp-taula')) {
                const expr = enunciat[0];
                const f = compila(expr);
                const caps = await pagina.$$eval('#jp-plantilla .jp-taula thead th', ths =>
                    ths.slice(1).map(t => t.textContent)
                );
                for (let i = 0; i < caps.length; i++) {
                    let desitjat;
                    if (i % 2 === 0) {
                        const [a, b] = caps[i].replace(/[()]/g, '').split(', ').map(nombre);
                        const p = dins(a, b);
                        await escriu(pagina, `#jp-plantilla .jp-taula input[data-part="p${i}"]`, String(p), tactil);
                        desitjat = f({ x: p }) > 0 ? '+' : '−';
                    } else {
                        const v = f({ x: nombre(caps[i]) });
                        desitjat = Number.isFinite(v) ? '0' : '∄';
                    }
                    const cella = await pagina.$(`#jp-plantilla .jp-taula td[data-fila="s"][data-col="${i}"] button`);
                    for (let k = 0; k < 3 && (await cella.textContent()).trim() !== desitjat; k++) await cella.click();
                }
                await pagina.click('#jp-ok');
            } else if (await pagina.$('#jp-plantilla .jp-trams')) {
                const punts = await pagina.$$eval('#jp-plantilla .jp-trams rect[data-p] title', ts =>
                    ts.map(t => t.textContent)
                );
                const vs = punts.map(nombre);
                const n = vs.length;
                let algun = false;
                for (let k = 0; k <= n; k++) {
                    const a = k === 0 ? -Infinity : vs[k - 1];
                    const b = k === n ? Infinity : vs[k];
                    const x =
                        a === -Infinity && b === Infinity
                            ? 0.37
                            : a === -Infinity
                              ? b - 0.7
                              : b === Infinity
                                ? a + 0.7
                                : (a + b) / 2;
                    if (original(x)) {
                        await pagina.click(`#jp-plantilla .jp-trams rect[data-t="${k}"]`);
                        algun = true;
                    }
                }
                for (let k = 0; k < n; k++)
                    if (original(vs[k])) {
                        await pagina.click(`#jp-plantilla .jp-trams rect[data-p="${k}"]`);
                        algun = true;
                    }
                if (!algun) await pagina.click('#jp-plantilla .jp-trams .jp-recta-boto');
                await pagina.click('#jp-ok');
            } else {
                const noms = await pagina.$$eval('#jp-plantilla input.jp-camp', is => [
                    ...new Set(is.map(i => i.dataset.nom)),
                ]);
                let valors;
                if (noms.includes('x1')) {
                    const g = compila(enunciat[0].replace(/ = 0$/, ''));
                    const zs = GRAELLA.filter(x => Math.abs(g({ x })) < 1e-9);
                    valors = { x1: zs[0], x2: zs[1] };
                } else {
                    const [gn, gd] = enunciat.map(e => compila(e.replace(/ = 0$/, '')));
                    valors = {
                        n: GRAELLA.find(x => Math.abs(gn({ x })) < 1e-9),
                        d: GRAELLA.find(x => Math.abs(gd({ x })) < 1e-9),
                    };
                }
                for (const nom of noms)
                    await escriu(pagina, `#jp-plantilla input[data-nom="${nom}"]`, String(valors[nom]), tactil);
                await pagina.click('#jp-ok');
            }
            await espera(450);
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

(async () => {
    const servidor = await engegaServidor();
    const navegador = await chromium.launch();
    try {
        const pagina = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
        const errorsJs = [];
        pagina.on('pageerror', e => errorsJs.push(String(e)));
        pagina.on('console', m => m.type() === 'error' && errorsJs.push(m.text()));
        const malament = [];
        suite('1. Una sessió de cada nivell, de cap a cap (Chromebook 1366×768)');
        let subtitol = '';
        for (const tipus of ['segon-grau', 'racionals', 'especials']) {
            await sessio(pagina, tipus, 4, malament);
            subtitol = await pagina.textContent('.subtitle');
        }
        ok('cada inequació es resol de cap a cap amb 10 punts', !malament.length, malament.join('\n      → '));
        ok('el subtítol és el de 2n grau i racionals', /2n grau i racionals/.test(subtitol), subtitol);
        ok('cap error a la consola', !errorsJs.length, errorsJs.join('\n      → '));
        await pagina.goto(`${BASE}/inequacions.html?totaloperations=1`);
        await pagina.waitForTimeout(600);
        ok(
            'sense ?tipus=, les de primer grau (el subtítol de sempre)',
            /^Resol la inequació/.test(await pagina.textContent('.subtitle'))
        );

        suite('2. Tauleta (1024×768, tàctil): la recta amb trams es toca');
        const ctx = await navegador.newContext({
            viewport: { width: 1024, height: 768 },
            hasTouch: true,
            isMobile: true,
        });
        const t = await ctx.newPage();
        const malT = [];
        t.on('pageerror', e => malT.push(String(e)));
        await sessio(t, 'no-lineals', 3, malT, true);
        ok(
            'una sessió progressiva de cap a cap a la tauleta (teclat propi i tocs)',
            !malT.length,
            malT.join('\n      → ')
        );
        await ctx.close();
    } finally {
        await navegador.close();
        servidor.kill();
    }
    finish('INEQUACIONS DE 2n GRAU I RACIONALS AL NAVEGADOR');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
