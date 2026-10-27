/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-pissarra.js
 * ROL: Prova la «Resolució pas a pas» en un navegador de debò (Chromium amb
 *      Playwright), a la pàgina pissarra-demo.html:
 *   1. cada demo, pas a pas amb animació: en acabar cada pas, la pissarra té
 *      exactament els símbols (claus) d'aquell pas i no queda cap fantasma;
 *   2. a mida de portàtil (1366×700) i de mòbil (375×740): la pàgina no surt
 *      de la pantalla (cap barra horitzontal);
 *   3. el reproductor: «Pas següent», «Pas anterior», «Torna a començar», els
 *      punts i les fletxes del teclat;
 *   4. carregaKatex() carrega KaTeX en una pàgina que no el té;
 *   5. cap error a la consola.
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-pissarra.js
 * ============================================================================
 */
/* global ACTIVITIES_ESO, ACTIVITIES_BATX */ // les llistes d'index.html (dins de page.evaluate)
'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { ROOT, suite, ok, eq, finish } = require('../harness');

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch (e) {
    console.log('Playwright no hi és: la prova al navegador s’omet.');
    process.exit(0);
}

const PORT = 8700 + Math.floor(Math.random() * 200);
const BASE = `http://localhost:${PORT}`;

/** Engega tools/servidor.js i espera que respongui. */
function engegaServidor() {
    const p = spawn(process.execPath, [path.join(ROOT, 'tools/servidor.js'), String(PORT)], { stdio: 'ignore' });
    return new Promise((resol, rebutja) => {
        const t0 = Date.now();
        const prova = () =>
            fetch(BASE + '/pissarra-demo.html')
                .then(() => resol(p))
                .catch(() =>
                    Date.now() - t0 > 8000 ? rebutja(new Error('el servidor no respon')) : setTimeout(prova, 150)
                );
        prova();
    });
}

(async () => {
    const servidor = await engegaServidor();
    const navegador = await chromium.launch();
    try {
        for (const [nom, viewport] of [
            ['portàtil', { width: 1366, height: 700 }],
            ['mòbil', { width: 375, height: 740 }],
        ]) {
            suite(`1-2. Les demos pas a pas, a mida de ${nom}`);
            const pagina = await navegador.newPage({ viewport });
            const errors = [];
            pagina.on('console', m => m.type() === 'error' && errors.push(m.text()));
            pagina.on('pageerror', e => errors.push(String(e)));
            await pagina.goto(BASE + '/pissarra-demo.html');
            await pagina.waitForFunction(() => window.demoPissarra);
            const ids = await pagina.$$eval('#demos button', bs => bs.map(b => b.dataset.id));
            ok(`hi ha tres demos (${ids.join(', ')})`, ids.length === 3);
            for (const id of ids) {
                await pagina.click(`#demos button[data-id="${id}"]`);
                const resultat = await pagina.evaluate(async () => {
                    const { pissarra } = window.demoPissarra;
                    const claus = tex =>
                        [...tex.matchAll(/\\htmlData\{k=([^},]*)[^}]*\}|\{\{([^|}]+)\|/g)].map(m => m[1] || m[2]);
                    const dolents = [];
                    const revisa = i => {
                        const esperades = pissarra.passos[i].files.flatMap(claus).sort().join(',');
                        const capa = document.querySelectorAll('.pis-pissarra .pis-capa');
                        const hi = [...document.querySelectorAll('.pis-pissarra .pis-capa [data-k]')]
                            .map(e => e.dataset.k)
                            .sort()
                            .join(',');
                        const fantasmes = document.querySelectorAll('.pis-efectes > *').length;
                        if (capa.length !== 1 || hi !== esperades || fantasmes)
                            dolents.push(
                                `pas ${i + 1}: capes ${capa.length}, claus «${hi}» ≠ «${esperades}», efectes ${fantasmes}`
                            );
                    };
                    revisa(0);
                    while (pissarra.pas < pissarra.total - 1) {
                        await pissarra.seguent();
                        revisa(pissarra.pas);
                    }
                    const ample = document.documentElement.scrollWidth > window.innerWidth + 1;
                    return {
                        total: pissarra.total,
                        dolents,
                        ample,
                        final: !!document.querySelector('.pis-fila.final'),
                    };
                });
                ok(
                    `${id}: ${resultat.total} passos animats, cadascun amb els seus símbols`,
                    !resultat.dolents.length,
                    resultat.dolents.join('\n      → ')
                );
                ok(`${id}: l'últim pas té el resultat ressaltat`, resultat.final);
                ok(`${id}: la pàgina no surt de la pantalla`, !resultat.ample);
            }
            ok('cap error a la consola', !errors.length, errors.join('\n      → '));
            await pagina.close();
        }

        suite('3. El reproductor');
        {
            const pagina = await navegador.newPage({ viewport: { width: 1366, height: 700 } });
            await pagina.goto(BASE + '/pissarra-demo.html?demo=equacio');
            await pagina.waitForFunction(() => window.demoPissarra);
            const text = () => pagina.textContent('.pis-num-pas');
            const espera = () => pagina.waitForFunction(() => !window.demoPissarra.pissarra.ocupat);
            eq("l'adreça tria la demo", await pagina.evaluate(() => window.demoPissarra.pissarra.total), 5);
            eq('comença al pas 1', await text(), 'Pas 1 de 5');
            ok('«Pas anterior» desactivat al primer pas', await pagina.isDisabled('button[aria-label="Pas anterior"]'));
            await pagina.click('button[aria-label="Pas següent"]');
            await espera();
            eq('«Pas següent» → pas 2', await text(), 'Pas 2 de 5');
            await pagina.keyboard.press('ArrowRight');
            await espera();
            eq('fletxa → del teclat → pas 3', await text(), 'Pas 3 de 5');
            await pagina.click('button[aria-label="Pas anterior"]');
            eq('«Pas anterior» → pas 2 (sense animació)', await text(), 'Pas 2 de 5');
            await pagina.click('.pis-punt:nth-child(5)');
            eq('el cinquè punt → pas 5', await text(), 'Pas 5 de 5');
            ok('«Pas següent» desactivat a l’últim pas', await pagina.isDisabled('button[aria-label="Pas següent"]'));
            await pagina.click('button[aria-label="Torna a començar"]');
            eq('«Torna a començar» → pas 1', await text(), 'Pas 1 de 5');
            ok('el text del pas té les fórmules dibuixades', (await pagina.$$('.pis-text-pas .katex')).length > 0);
            await pagina.close();
        }

        suite('4. carregaKatex() en una pàgina sense KaTeX');
        {
            const pagina = await navegador.newPage();
            await pagina.goto(BASE + '/index.html');
            const abans = await pagina.evaluate(() => typeof window.katex);
            const despres = await pagina.evaluate(async () => {
                const m = await import('/js/pissarra/pissarra.js');
                await m.carregaKatex();
                await m.carregaKatex(); // dos cops: no el torna a carregar
                return [typeof window.katex.renderToString, document.querySelectorAll('script[src*="katex"]').length];
            });
            eq('index.html no té KaTeX', abans, 'undefined');
            eq('després de carregaKatex(), katex.renderToString existeix', despres[0], 'function');
            eq('KaTeX es carrega un sol cop', despres[1], 1);
            await pagina.close();
        }

        suite('5. index.html: el botó «Activar la resolució pas a pas»');
        {
            // L'index de debò: si cap activitat no té «pissarra: true», el botó no surt
            const real = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await real.goto(BASE + '/index.html');
            const llista = await real.evaluate(
                () => [...ACTIVITIES_ESO, ...ACTIVITIES_BATX].filter(a => a.pissarra).length
            );
            eq('el botó surt si i només si alguna activitat la té', await real.isVisible('#btn-pissarra'), llista > 0);
            await real.close();

            // Un index amb prioritat (ESO) marcada «pissarra: true» i cap de Batxillerat
            const pagina = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            const errors = [];
            pagina.on('pageerror', e => errors.push(String(e)));
            await pagina.route('**/index.html', async ruta => {
                const resposta = await ruta.fetch();
                let html = (await resposta.text()).replace(/\bpissarra: true, /g, '');
                html = html.replace("{ file: 'prioritat.html',", "{ file: 'prioritat.html', pissarra: true,");
                await ruta.fulfill({ response: resposta, body: html });
            });
            await pagina.goto(BASE + '/index.html');
            await pagina.waitForTimeout(1900); // les animacions d'entrada
            const enllac = s => pagina.textContent(`#l-${s}`);
            const opcions = s => pagina.$$eval(`#cd-${s} .cd-option`, os => os.map(o => o.textContent.trim()));
            ok('amb una activitat marcada, el botó surt', await pagina.isVisible('#btn-pissarra'));
            eq('per defecte està desactivat', await pagina.getAttribute('#btn-pissarra', 'aria-pressed'), 'false');
            const esoAbans = (await opcions('eso')).length;
            ok('desactivat: el menú d’ESO té totes les activitats', esoAbans > 20);
            ok('desactivat: l’enllaç no porta pissarra=1', !/pissarra=/.test(await enllac('eso')));

            await pagina.click('#btn-pissarra');
            eq('activat: aria-pressed', await pagina.getAttribute('#btn-pissarra', 'aria-pressed'), 'true');
            eq(
                'activat: el text diu «Desactivar…»',
                (await pagina.textContent('#btn-pissarra')).trim(),
                'Desactivar la resolució pas a pas'
            );
            eq("activat: el menú d'ESO només té prioritat", (await opcions('eso')).join('|'), "Prioritat d'operacions");
            ok(
                'activat: l’enllaç d’ESO és de prioritat i porta pissarra=1',
                /prioritat\.html\?.*pissarra=1/.test(await enllac('eso'))
            );
            eq('activat: el menú de Batxillerat és buit', (await opcions('batx')).length, 0);
            eq(
                'activat: Batxillerat diu que encara no n’hi ha cap',
                (await pagina.textContent('#cd-batx .cd-label')).trim(),
                "Encara no n'hi ha cap"
            );
            ok(
                'activat: sense activitat, «Obre» i «Copia» desactivats',
                (await pagina.isDisabled('#p-batx')) && (await pagina.isDisabled('#c-batx'))
            );
            eq('activat: sense activitat, no hi ha enllaç', (await enllac('batx')).trim(), '');

            await pagina.click('#btn-pissarra');
            eq('desactivat de nou: totes les activitats', (await opcions('eso')).length, esoAbans);
            ok('desactivat de nou: l’enllaç ja no porta pissarra=1', !/pissarra=/.test(await enllac('eso')));
            ok('desactivat de nou: Batxillerat torna a tenir enllaç', /\.html/.test(await enllac('batx')));
            ok('desactivat de nou: «Obre» actiu', !(await pagina.isDisabled('#p-batx')));
            ok("cap error a la consola de l'index", !errors.length, errors.join('\n      → '));
            await pagina.close();
        }
    } finally {
        await navegador.close();
        servidor.kill();
    }
    finish('RESOLUCIÓ PAS A PAS AL NAVEGADOR');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
