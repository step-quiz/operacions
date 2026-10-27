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
 *   5. el botó «Activar la resolució pas a pas» d'index.html;
 *   6. prioritat.html amb ?pissarra=1: es resolen expressions senceres clicant
 *      (l'operació bona i el resultat bo); cada línia nova s'anima (l'operació
 *      baixa i es fusiona) i en acabar hi ha exactament una línia més; també amb
 *      l'esvaïment; i sense el paràmetre, prioritat no té cap pissarra;
 *   i cap error a la consola.
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

            const fonsObre = () => pagina.$eval('#p-eso', b => getComputedStyle(b).backgroundColor);
            eq('desactivat: «Obre» és blau', await fonsObre(), 'rgb(59, 130, 246)');
            ok('desactivat: hi ha les opcions (sessions…)', await pagina.isVisible('#s-eso'));
            await pagina.click('#btn-pissarra');
            eq('activat: aria-pressed', await pagina.getAttribute('#btn-pissarra', 'aria-pressed'), 'true');
            await pagina.mouse.move(5, 5);
            await pagina.waitForTimeout(400); // la transició de colors
            eq('activat: «Obre» és lila', await fonsObre(), 'rgb(124, 58, 237)');
            const opcionsVisibles = await pagina.$$eval('.sub-panel-params .row, #row-fixed-batx', rs =>
                rs.filter(r => r.offsetParent !== null).map(r => r.textContent.trim().split('\n')[0])
            );
            ok('activat: no hi ha cap opció de configuració', !opcionsVisibles.length, opcionsVisibles.join(', '));
            eq(
                'activat: el text diu «Desactivar…»',
                (await pagina.textContent('#btn-pissarra')).trim(),
                'Desactivar la resolució pas a pas'
            );
            eq("activat: el menú d'ESO només té prioritat", (await opcions('eso')).join('|'), "Prioritat d'operacions");
            ok(
                'activat: l’enllaç d’ESO és només «prioritat.html?pissarra=1»',
                /\/prioritat\.html\?pissarra=1$/.test((await enllac('eso')).trim())
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
            await pagina.mouse.move(5, 5);
            await pagina.waitForTimeout(400);
            eq('desactivat de nou: «Obre» torna a ser blau', await fonsObre(), 'rgb(59, 130, 246)');
            ok('desactivat de nou: tornen les opcions', await pagina.isVisible('#s-eso'));
            eq('desactivat de nou: totes les activitats', (await opcions('eso')).length, esoAbans);
            ok('desactivat de nou: l’enllaç ja no porta pissarra=1', !/pissarra=/.test(await enllac('eso')));
            ok('desactivat de nou: Batxillerat torna a tenir enllaç', /\.html/.test(await enllac('batx')));
            ok('desactivat de nou: «Obre» actiu', !(await pagina.isDisabled('#p-batx')));
            ok("cap error a la consola de l'index", !errors.length, errors.join('\n      → '));
            await pagina.close();
        }

        suite('6. prioritat.html amb la resolució pas a pas (?pissarra=1)');
        {
            // L'operació que toca a la línia de treball (ordre «de llibre») i el seu resultat,
            // llegits de la taula de la pàgina (sense fer servir el codi de l'activitat)
            const quinPas = () =>
                pagina.evaluate(() => {
                    const files = [...document.querySelectorAll('#steps-box .pis-capa table.centrat tr')];
                    const cel = [...files[files.length - 1].querySelectorAll('td')].filter(
                        td => !td.classList.contains('igual') && !td.classList.contains('nota-pas')
                    );
                    const tok = cel.map(td => {
                        const t = td.textContent.trim(),
                            sup = td.querySelector('sup');
                        if (sup)
                            return {
                                k: 'pow',
                                b: +t.slice(0, t.length - sup.textContent.length),
                                e: +sup.textContent,
                                td,
                            };
                        if (t === '(' || t === ')') return { k: t, td };
                        return /^\d+$/.test(t) ? { k: 'num', v: +t, td } : { k: 'op', v: t, td };
                    });
                    let s = 0,
                        e = tok.length - 1,
                        d = 0,
                        maxd = 0;
                    tok.forEach((t, i) => {
                        if (t.k === '(' && ++d > maxd) {
                            maxd = d;
                            s = i + 1;
                        } else if (t.k === ')') d--;
                    });
                    if (maxd) e = tok.findIndex((t, i) => i >= s && t.k === ')') - 1;
                    const dins = tok.map((t, i) => i).filter(i => i >= s && i <= e);
                    const i =
                        dins.find(j => tok[j].k === 'pow') ??
                        dins.find(j => tok[j].k === 'op' && (tok[j].v === '·' || tok[j].v === ':')) ??
                        dins.find(j => tok[j].k === 'op');
                    const t = tok[i];
                    let val;
                    if (t.k === 'pow') val = t.b ** t.e;
                    else {
                        const [a, b] = [tok[i - 1].v, tok[i + 1].v];
                        val = t.v === '+' ? a + b : t.v === '·' ? a * b : t.v === ':' ? a / b : a - b;
                    }
                    const boto = t.td.querySelector('.tok-btn');
                    return { i: boto ? boto.dataset.i : null, val, linies: files.length };
                });
            const linies = () => pagina.$$eval('#steps-box .pis-capa table.centrat tr', trs => trs.length);
            const sensePissarraOcupada = () =>
                pagina.waitForFunction(() => !document.querySelector('#steps-box .pis-nova'));

            const pagina = await navegador.newPage({ viewport: { width: 1366, height: 700 } });
            const errors = [];
            pagina.on('pageerror', e => errors.push(String(e)));
            pagina.on('console', m => m.type() === 'error' && errors.push(m.text()));
            await pagina.goto(BASE + '/prioritat.html?pissarra=1&totaloperations=10&maxintents=3');
            await pagina.waitForSelector('#steps-box .pis-escenari');
            let passos = 0,
                animats = 0,
                malament = [];
            for (let ex = 0; ex < 10; ex++) {
                for (let guarda = 0; guarda < 12 && !(await pagina.$('#btn-next')); guarda++) {
                    const { i, val, linies: abans } = await quinPas();
                    await pagina.click(`#steps-box .pis-capa .tok-btn[data-i="${i}"]`);
                    await pagina.click(`#chip-pool .num-chip[data-val="${val}"]`);
                    // A mitja animació hi ha fantasmes (els símbols que es mouen)
                    const fantasmes = await pagina
                        .waitForFunction(() => document.querySelectorAll('.pis-fantasma').length > 0, null, {
                            timeout: 2500,
                        })
                        .then(() => true)
                        .catch(() => false);
                    await sensePissarraOcupada();
                    passos++;
                    if (fantasmes) animats++;
                    const despres = await linies();
                    const restes = await pagina.$$eval('.pis-efectes > *', es => es.length);
                    if (despres !== abans + 1 || restes)
                        malament.push(`exercici ${ex + 1}: ${abans} → ${despres} línies, ${restes} restes`);
                }
                if (ex < 9) await pagina.click('#btn-next');
            }
            ok(
                `${passos} passos fets clicant: tots s'animen`,
                passos > 20 && animats === passos,
                `${animats} de ${passos}`
            );
            ok(
                'cada pas afegeix exactament una línia i no deixa restes de l’animació',
                !malament.length,
                malament.join('\n      → ')
            );
            ok(
                'les 10 expressions acaben amb el botó «Veure resultats»',
                /Veure resultats/.test(await pagina.textContent('#btn-next'))
            );
            ok('cap error a la consola', !errors.length, errors.join('\n      → '));
            await pagina.close();

            // Esvaïment + pissarra: els passos de l'exemple resolt també s'animen
            const esv = await navegador.newPage({ viewport: { width: 1366, height: 700 } });
            await esv.goto(BASE + '/prioritat.html?esvaiment=1&pissarra=1');
            await esv.waitForSelector('.esv-btn');
            await esv.click('.esv-btn');
            const animaExemple = await esv
                .waitForFunction(() => document.querySelectorAll('.pis-fantasma').length > 0, null, { timeout: 3000 })
                .then(() => true)
                .catch(() => false);
            ok('esvaïment: el pas de l’exemple resolt s’anima', animaExemple);
            await esv.close();

            // Sense ?pissarra=1, prioritat és com sempre: cap pissarra i KaTeX no es carrega
            for (const q of ['modalitat=passos', '']) {
                const p = await navegador.newPage();
                await p.goto(BASE + '/prioritat.html?' + q);
                await p.waitForTimeout(600);
                const [pis, kx] = await p.evaluate(() => [
                    document.querySelectorAll('.pis-escenari').length,
                    document.querySelectorAll('script[src*="katex"]').length,
                ]);
                ok(`prioritat.html?${q || '(sense paràmetres)'}: cap pissarra ni KaTeX`, pis === 0 && kx === 0);
                await p.close();
            }
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
