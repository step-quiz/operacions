/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/navegador/prova-pissarra.js
 * ROL: Prova la «Resolució pas a pas» en un navegador de debò (Chromium amb
 *      Playwright), a pissarra-demo.html, resolucio.html i les activitats:
 *   1. cada demo, pas a pas amb animació: en acabar cada pas, la pissarra té
 *      exactament els símbols (claus) d'aquell pas i no queda cap fantasma; i a la
 *      demo amb detall, «Vull més detall» i «Menys detall» del reproductor;
 *   2. a mida de portàtil (1366×700) i de mòbil (375×740): la pàgina no surt
 *      de la pantalla (cap barra horitzontal);
 *   3. el reproductor: «Pas següent», «Pas anterior», «Torna a començar», els
 *      punts i les fletxes del teclat;
 *   4. carregaKatex() carrega KaTeX en una pàgina que no el té;
 *   5. el botó «Activar la resolució pas a pas» d'index.html;
 *   6. escenari A: prioritat, equacions i fraccions, també amb ?pissarra=1, són les
 *      de sempre (cap pissarra); a equacions, «Mira com es resol» obre la resolució
 *      del mateix nivell en una pestanya nova;
 *   7. escenari B, resolucio.html?activitat=equacions (portàtil i mòbil): cada pas
 *      amb els seus símbols, «Vull més detall» a cada pas que en té (la línia del pas
 *      en gris com a objectiu, els subpassos al calaix, «Menys detall»), el nivell,
 *      «Un altre exercici» i «Ara fes-ho tu»; sense activitat, la llista;
 *   8. si una animació falla, la cua del motor (encua) mostra el pas i continua;
 *   9. a l'inici del moviment, cada fantasma es dibuixa exactament damunt del seu
 *      original (a resolucio.html, també en obrir un detall, i els <text> d'un
 *      esquema SVG a la demo de Pitàgores), i cap requadre d'avís no tapa un símbol
 *      que no es mou;
 *  10. la taula de prioritat no canvia de mida (R4);
 *  11. amb «reduir el moviment», cap símbol no viatja;
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

// ── Respostes calculades a partir del que es veu a la pàgina (sense fer servir el codi de les activitats) ──

/** Prioritat: l'operació que toca a la línia de treball (ordre «de llibre») i el seu resultat. */
const PAS_PRIORITAT = () => {
    // L'última taula de la zona de treball (amb la pissarra, la de la capa que es veu; sense, l'única)
    const taules = document.querySelectorAll('#steps-box table.centrat');
    const files = [...taules[taules.length - 1].querySelectorAll('tr')];
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
};

// ── Per congelar una animació: s'alenteixen les animacions i els temporitzadors de la pàgina ──
// (a cada crida torna a alentir: provaPasCongelat la deixa a 1 en acabar, i els embolcalls només es posen un cop)
const ALENTEIX = k => `(() => {
    const posats = window.__lent !== undefined;
    window.__lent = ${k};
    if (posats) return;
    const ot = window.setTimeout.bind(window);
    window.setTimeout = (f, ms, ...a) => ot(f, (ms || 0) * window.__lent, ...a);
    const oa = Element.prototype.animate;
    Element.prototype.animate = function (kf, o) {
        o = typeof o === 'number' ? { duration: o } : Object.assign({}, o);
        if (o.duration) o.duration *= window.__lent;
        return oa.call(this, kf, o);
    };
})()`;
const ATURA_A_LINICI = () =>
    document.getAnimations().forEach(a => {
        a.pause();
        a.currentTime = 0;
    });
const CONTINUA = () => document.getAnimations().forEach(a => a.play());

/**
 * Mentre es veuen els requadres d'avís (abans del moviment): cap requadre no tapa un símbol que no es
 * mou (té la mateixa clau, el mateix text i el mateix lloc a la capa vella i a la nova, i no és la font de
 * cap moviment: d'una font que es queda escrita en vola una còpia, i el requadre l'assenyala).
 */
const REQUADRES_NETS = sel => {
    const capes = [...document.querySelectorAll(sel + ' .pis-capa')];
    const vella = capes.find(c => !c.classList.contains('pis-nova'));
    const nova = capes.find(c => c.classList.contains('pis-nova'));
    if (!vella || !nova) return { requadres: 0, quiets: 0, tapats: ['no hi ha les dues capes'] };
    const rect = e => e.getBoundingClientRect();
    // Les fonts d'un moviment es queden al seu lloc (en vola una còpia), però el requadre les ha d'assenyalar
    const pis = (window.resolucio || window.demoPissarra || {}).pissarra;
    const pas = pis ? pis.passos[pis.pas] : {};
    const fonts = new Set([
        ...Object.values(pas.reanomena || {}),
        ...Object.values(pas.fusiona || {}).flat(),
        ...Object.keys(pas.reparteix || {}),
        ...Object.values(pas.copia || {}),
    ]);
    const quiets = [...vella.querySelectorAll('[data-k]')].filter(e => {
        if (fonts.has(e.dataset.k)) return false;
        const n = nova.querySelector(`[data-k="${e.dataset.k}"]`);
        if (!n) return false;
        const a = rect(e),
            b = rect(n);
        return (
            a.width > 0.5 &&
            Math.abs(a.left - b.left) < 0.5 &&
            Math.abs(a.top - b.top) < 0.5 &&
            e.textContent === n.textContent
        );
    });
    const requadres = [...document.querySelectorAll('.pis-requadre')].map(rect);
    const tapats = [];
    for (const q of requadres)
        for (const e of quiets) {
            const r = rect(e);
            // el requadre té 4 px de marge al voltant del que assenyala; el símbol, 1 px de tolerància
            if (q.left + 5 < r.right && r.left + 1 < q.right - 4 && q.top + 5 < r.bottom && r.top + 1 < q.bottom - 4)
                tapats.push(`«${e.textContent.trim()}» (${e.dataset.k})`);
        }
    return { requadres: requadres.length, quiets: quiets.length, tapats };
};

/**
 * Amb les animacions aturades a l'inici: cada fantasma d'un símbol que ja hi era es dibuixa damunt
 * del seu original (la lletra, no la caixa: ±0,75 px). Els fantasmes dels símbols nous comencen
 * desplaçats a propòsit i no es miren.
 */
const FANTASMES_FIDELS = sel => {
    const caixaText = el => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return r.getBoundingClientRect();
    };
    const vella = [...document.querySelectorAll(sel + ' .pis-capa')].find(c => !c.classList.contains('pis-nova'));
    const desviats = [];
    let n = 0;
    for (const f of document.querySelectorAll('.pis-fantasma')) {
        const orig = vella && vella.querySelector(`[data-k="${f.dataset.de}"]`);
        const copia = f.firstElementChild;
        if (!orig || !copia || copia.textContent.trim() !== orig.textContent.trim()) continue;
        const a = caixaText(copia),
            b = caixaText(orig);
        n++;
        const dx = a.left - b.left,
            dy = a.top - b.top;
        if (Math.abs(dx) > 0.75 || Math.abs(dy) > 0.75)
            desviats.push(`${f.dataset.de} «${orig.textContent.trim()}»: ${dx.toFixed(1)}, ${dy.toFixed(1)} px`);
    }
    return { n, desviats };
};

/** Prova un pas congelat: requadres nets (si n'hi ha) i fantasmes fidels. fes: el que dispara el pas. */
async function provaPasCongelat(pagina, sel, nom, fes) {
    await pagina.evaluate(ALENTEIX(25));
    await fes();
    const ambRequadres = await pagina
        .waitForFunction(() => document.querySelector('.pis-requadre'), null, { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
    let req = null;
    if (ambRequadres) {
        await pagina.waitForTimeout(400); // els requadres ja s'han posat; el moviment encara no ha començat
        req = await pagina.evaluate(REQUADRES_NETS, sel);
    }
    // Abans del moviment hi ha els requadres d'avís i la pausa de lectura (950 ms, ×25 aquí): marge ampli
    await pagina.waitForFunction(() => document.querySelector('.pis-fantasma'), null, { timeout: 90000 });
    await pagina.evaluate(ATURA_A_LINICI);
    const fid = await pagina.evaluate(FANTASMES_FIDELS, sel);
    await pagina.evaluate(CONTINUA);
    await pagina.evaluate(() => (window.__lent = 1));
    await pagina.waitForFunction(s => !document.querySelector(s + ' .pis-nova'), sel, { timeout: 60000 });
    if (req)
        ok(
            `${nom}: cap requadre d'avís no tapa un símbol que no es mou (${req.requadres} requadres, ${req.quiets} símbols quiets)`,
            !req.tapats.length,
            req.tapats.join(', ')
        );
    ok(
        `${nom}: els ${fid.n} fantasmes comencen exactament damunt del seu original`,
        fid.n > 0 && !fid.desviats.length,
        fid.desviats.slice(0, 6).join(' · ')
    );
}

/**
 * Recorre el guió que es veu pas a pas, amb animació (a la pàgina de les demos, window.demoPissarra; a
 * resolucio.html, window.resolucio), i revisa que en acabar cada pas la pissarra té exactament els símbols
 * (claus) d'aquell pas i cap fantasma.
 */
const RECORRE_DEMO = async (on = 'demoPissarra') => {
    const { pissarra } = window[on];
    const claus = tex =>
        [...tex.matchAll(/\\htmlData\{k=([^},]*)[^}]*\}|\{\{([^|}]+)\||\bdata-k="([^"]+)"/g)].map(
            m => m[1] || m[2] || m[3]
        );
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
            dolents.push(`pas ${i + 1}: capes ${capa.length}, claus «${hi}» ≠ «${esperades}», efectes ${fantasmes}`);
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
};

/** Al navegador: '' si la pissarra té exactament els símbols (claus) del pas que es veu i cap fantasma. */
const REVISA = on => {
    const { pissarra } = window[on];
    const claus = tex =>
        [...tex.matchAll(/\\htmlData\{k=([^},]*)[^}]*\}|\{\{([^|}]+)\||\bdata-k="([^"]+)"/g)].map(
            m => m[1] || m[2] || m[3]
        );
    const esperades = pissarra.passos[pissarra.pas].files
        .flatMap(f => (f ? claus(f) : []))
        .sort()
        .join(',');
    const capes = document.querySelectorAll('.pis-pissarra .pis-capa');
    const hi = [...document.querySelectorAll('.pis-pissarra .pis-capa [data-k]')]
        .map(e => e.dataset.k)
        .sort()
        .join(',');
    const fantasmes = document.querySelectorAll('.pis-efectes > *').length;
    return capes.length !== 1 || hi !== esperades || fantasmes
        ? `capes ${capes.length}, claus «${hi}» ≠ «${esperades}», efectes ${fantasmes}`
        : '';
};

/**
 * «Vull més detall» amb el reproductor (window[on]: la pissarra), a cada pas que en té: la línia del pas baixa en
 * gris com a objectiu, cada «Pas següent» escriu un subpas al calaix, al final l'objectiu ja no hi és, i
 * «Menys detall» torna a la vista tancada. Després de cada pas, els símbols justos i cap fantasma.
 */
async function provaDetall(pagina, on, nom) {
    const estat = () =>
        pagina.evaluate(o => {
            const { pissarra } = window[o];
            const b = document.querySelector('.pis-detall-boto');
            return {
                pas: pissarra.pas,
                total: pissarra.total,
                id: pissarra.passos[pissarra.pas].id,
                boto: b.hidden ? '' : b.textContent,
                num: document.querySelector('.pis-num-pas').textContent,
                detall: document.querySelectorAll('.pis-capa .pis-fila.detall').length,
                objectiu: document.querySelectorAll('.pis-capa .pis-fila.objectiu').length,
            };
        }, on);
    const espera = () => pagina.waitForFunction(o => !window[o].pissarra.ocupat, on);
    const malament = [];
    const revisa = async on2 => {
        const r = await pagina.evaluate(REVISA, on);
        if (r) malament.push(`${on2}: ${r}`);
    };
    const ambDetall = await pagina.evaluate(
        o =>
            window[o].pissarra.passos
                .map((p, i) => [i, p.id, p.teDetall])
                .filter(([, , t]) => t)
                .map(([i, id]) => [i, id]),
        on
    );
    const tancat = await pagina.evaluate(o => window[o].pissarra.total, on);
    for (const [i, id] of ambDetall) {
        await pagina.evaluate(([o, j]) => window[o].pissarra.salta(j), [on, i]);
        let e = await estat();
        if (e.boto !== 'Vull més detall') malament.push(`pas ${id}: el botó diu «${e.boto}»`);
        await pagina.click('.pis-detall-boto');
        await espera();
        e = await estat();
        await revisa(`pas ${id} obert`);
        if (!new RegExp(`^Pas ${id}a de `).test(e.num) || !e.detall || e.objectiu !== 1 || e.boto !== 'Menys detall')
            malament.push(`pas ${id} obert: ${JSON.stringify(e)}`);
        let subpassos = 1;
        while (subpassos < 8) {
            await pagina.click('button[aria-label="Pas següent"]');
            await espera();
            e = await estat();
            await revisa(`pas ${e.id}`);
            if (!e.id.startsWith(id) || e.id === id) break;
            subpassos++;
            if (e.objectiu === 0) break; // el subpas que tanca el pas: la línia ja no és en gris
        }
        if (e.objectiu !== 0) malament.push(`pas ${id}: al final del detall encara hi ha l'objectiu en gris`);
        await pagina.click('button[aria-label="Pas anterior"]');
        await espera();
        await pagina.click('.pis-detall-boto');
        await espera();
        e = await estat();
        await revisa(`pas ${id} plegat`);
        if (e.id !== id || e.detall || e.objectiu || e.total !== tancat)
            malament.push(`pas ${id} plegat: ${JSON.stringify(e)}`);
    }
    ok(
        `${nom}: «Vull més detall» a ${ambDetall.length} passos (objectiu en gris, subpassos al calaix) i «Menys detall»`,
        ambDetall.length > 0 && !malament.length,
        malament.slice(0, 6).join('\n      → ')
    );
}

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
            ok(`hi ha cinc demos (${ids.join(', ')})`, ids.length === 5);
            for (const id of ids) {
                await pagina.click(`#demos button[data-id="${id}"]`);
                const resultat = await pagina.evaluate(RECORRE_DEMO);
                ok(
                    `${id}: ${resultat.total} passos animats, cadascun amb els seus símbols`,
                    !resultat.dolents.length,
                    resultat.dolents.join('\n      → ')
                );
                ok(`${id}: l'últim pas té el resultat ressaltat`, resultat.final);
                ok(`${id}: la pàgina no surt de la pantalla`, !resultat.ample);
            }
            // La demo amb detall a demanda: el botó del reproductor
            await pagina.click('#demos button[data-id="parentesis"]');
            await provaDetall(pagina, 'demoPissarra', 'demo parentesis');
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
                // Només prioritat té la resolució pas a pas (es treuen les marques de les altres)
                let html = (await resposta.text()).replace(/, pissarra: true/g, '');
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
                'activat: l’enllaç d’ESO és la resolució de prioritat («resolucio.html?activitat=prioritat»)',
                /\/resolucio\.html\?activitat=prioritat$/.test((await enllac('eso')).trim())
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

        suite('6. Escenari A: les activitats de sempre, sense pissarra');
        {
            for (const pagina of ['prioritat', 'equacions', 'fraccions']) {
                const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
                const errors = [];
                p.on('pageerror', e => errors.push(String(e)));
                await p.goto(`${BASE}/${pagina}.html?pissarra=1&totaloperations=3`);
                await p.waitForTimeout(600);
                eq(
                    `${pagina}.html?pissarra=1: cap pissarra (l’activitat de sempre)`,
                    await p.$$eval('.pis-escenari', es => es.length),
                    0
                );
                ok(`${pagina}.html?pissarra=1: cap error a la consola`, !errors.length, errors.join('\n      → '));
                await p.close();
            }
            // Equacions: «Mira com es resol» obre la resolució d'una equació del mateix nivell, en una pestanya nova
            const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await p.goto(BASE + '/equacions.html?totaloperations=3&nivell=3');
            await p.waitForSelector('#value-input');
            const enllac = await p.$eval('#mira-com', a => [a.textContent, a.getAttribute('href'), a.target]);
            ok(
                `equacions: «Mira com es resol» porta a la resolució del nivell 3, en una pestanya nova (${enllac[1]})`,
                /^Mira com es resol/.test(enllac[0]) &&
                    enllac[1] === 'resolucio.html?activitat=equacions&nivell=3' &&
                    enllac[2] === '_blank'
            );
            const [nova] = await Promise.all([p.context().waitForEvent('page'), p.click('#mira-com')]);
            await nova.waitForFunction(() => window.resolucio, null, { timeout: 8000 });
            eq(
                'la pestanya nova és la resolució de les equacions',
                new URL(nova.url()).search,
                '?activitat=equacions&nivell=3'
            );
            await nova.close();
            await p.close();
        }

        suite('7. Escenari B: resolucio.html (mirar com es resol)');
        {
            for (const [nom, viewport] of [
                ['portàtil', { width: 1366, height: 768 }],
                ['mòbil', { width: 375, height: 740 }],
            ]) {
                const p = await navegador.newPage({ viewport });
                const errors = [];
                p.on('pageerror', e => errors.push(String(e)));
                p.on('console', m => m.type() === 'error' && errors.push(m.text()));
                await p.goto(BASE + '/resolucio.html?activitat=equacions&nivell=3');
                await p.waitForFunction(() => window.resolucio);
                const r = await p.evaluate(RECORRE_DEMO, 'resolucio');
                ok(
                    `${nom}: ${r.total} passos animats, cadascun amb els seus símbols`,
                    r.total > 1 && !r.dolents.length,
                    r.dolents.join('\n      → ')
                );
                ok(`${nom}: l'últim pas té el resultat ressaltat`, r.final);
                ok(`${nom}: la pàgina no surt de la pantalla`, !r.ample);
                await provaDetall(p, 'resolucio', nom);
                // Nivell, «Un altre exercici» i «Ara fes-ho tu»
                await p.click('#nivells button[data-nivell="1"]');
                await p.waitForFunction(() => !window.resolucio.pissarra.ocupat);
                eq(
                    `${nom}: el nivell queda a l'adreça`,
                    await p.evaluate(() => location.search),
                    '?activitat=equacions&nivell=1'
                );
                eq(
                    `${nom}: «Ara fes-ho tu» porta a l'activitat, amb el nivell`,
                    await p.getAttribute('#fes-ho-tu', 'href'),
                    'equacions.html?nivell=1'
                );
                eq(
                    `${nom}: un exercici nou comença pel primer pas`,
                    await p.evaluate(() => window.resolucio.pissarra.pas),
                    0
                );
                await p.click('#un-altre');
                eq(`${nom}: «Un altre exercici» també`, await p.evaluate(() => window.resolucio.pissarra.pas), 0);
                ok(`${nom}: cap error a la consola`, !errors.length, errors.join('\n      → '));
                await p.close();
            }
            const p = await navegador.newPage();
            await p.goto(BASE + '/resolucio.html');
            ok(
                'sense activitat, la pàgina diu quines en tenen',
                await p.isVisible('a[href="resolucio.html?activitat=equacions"]')
            );
            await p.close();
        }

        suite('8. Si una animació falla, la cua del motor continua');
        {
            const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            const errors = [];
            p.on('console', m => m.type() === 'error' && errors.push(m.text()));
            p.on('pageerror', e => errors.push(String(e)));
            await p.goto(BASE + '/pissarra-demo.html?demo=equacio');
            await p.waitForFunction(() => window.demoPissarra);
            // Una sola excepció, a la propera animació; el pas següent passa per la cua (encua)
            const queda = await p.evaluate(async () => {
                const { pissarra } = window.demoPissarra;
                const original = Element.prototype.animate;
                let fet = false;
                Element.prototype.animate = function (...a) {
                    if (!fet) {
                        fet = true;
                        throw new Error('fallada simulada');
                    }
                    return original.apply(this, a);
                };
                const seguent = pissarra.passos[1];
                await pissarra.encua(seguent, { anima: true });
                return pissarra.passos[pissarra.pas] === seguent && !pissarra.ocupat;
            });
            ok('amb una animació que falla, el pas es mostra igualment i la cua no es bloqueja', queda);
            ok(
                'el motor ho diu a la consola',
                errors.some(e => /l'animació ha fallat/.test(e))
            );
            const altres = errors.filter(e => !/l'animació ha fallat|fallada simulada/.test(e));
            ok('cap altre error a la consola', !altres.length, altres.join('\n      → '));
            await p.close();
        }

        suite('9. Fantasmes fidels i requadres que no tapen res');
        {
            // Resolució d'una equació: un pas, obrir-ne el detall i un subpas (les línies d'abans es queden)
            let p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await p.goto(BASE + '/resolucio.html?activitat=equacions&nivell=3');
            await p.waitForFunction(() => window.resolucio);
            await provaPasCongelat(p, '#pissarra', 'resolució, pas 2', () =>
                p.evaluate(() => {
                    window.resolucio.pissarra.seguent();
                })
            );
            // El primer pas que té detall (si el pas 2 no en té, es va endavant sense mirar res)
            const lliure = () => p.waitForFunction(() => !window.resolucio.pissarra.ocupat);
            await lliure();
            const teDetall = () =>
                p.evaluate(() => window.resolucio.pissarra.passos[window.resolucio.pissarra.pas].teDetall);
            for (let k = 0; k < 8 && !(await teDetall()); k++) {
                await p.evaluate(() => window.resolucio.pissarra.seguent());
                await lliure();
            }
            ok('resolució: hi ha un pas amb detall per provar', await teDetall());
            await provaPasCongelat(p, '#pissarra', 'resolució, obrir el detall', () => p.click('.pis-detall-boto'));
            await lliure();
            await provaPasCongelat(p, '#pissarra', 'resolució, un subpas', () =>
                p.evaluate(() => {
                    window.resolucio.pissarra.seguent();
                })
            );
            await p.close();

            // Demo de Pitàgores: les lletres i els catets volen del triangle (SVG) a la fórmula
            p = await navegador.newPage({ viewport: { width: 1366, height: 800 } });
            await p.goto(BASE + '/pissarra-demo.html?demo=pitagores');
            await p.waitForFunction(() => window.demoPissarra);
            for (const n of [2, 3]) {
                await provaPasCongelat(p, '#demo', `Pitàgores, pas ${n} (des del triangle SVG)`, () =>
                    p.evaluate(() => {
                        window.demoPissarra.pissarra.seguent();
                    })
                );
            }
            await p.close();
        }

        suite('10. La taula de prioritat no canvia de mida');
        {
            const mides = p =>
                p.evaluate(() => {
                    const taula = document.querySelector('#steps-box table.centrat');
                    const primer = taula.querySelector('td');
                    return [taula.offsetWidth, Math.round(primer.getBoundingClientRect().left * 10) / 10];
                });
            const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await p.goto(BASE + '/prioritat.html?modalitat=passos&totaloperations=2');
            await p.waitForSelector('#steps-box table.centrat');
            const vistes = [];
            for (let g = 0; g < 3 && !(await p.$('.franja-final #btn-next')); g++) {
                vistes.push(await mides(p));
                const { i, val } = await p.evaluate(PAS_PRIORITAT);
                await p.click(`#steps-box .tok-btn[data-i="${i}"]`);
                await p.waitForTimeout(150);
                vistes.push(await mides(p));
                await p.click(`#chip-pool .num-chip[data-val="${val}"]`);
                await p.waitForTimeout(150);
            }
            vistes.push(await mides(p));
            const amples = new Set(vistes.map(v => v[0])),
                xs = new Set(vistes.map(v => v[1]));
            ok(
                `prioritat «Pas a pas»: la taula no canvia d'amplada ni es desplaça (${vistes.length} moments)`,
                amples.size === 1 && xs.size === 1,
                JSON.stringify(vistes)
            );
            await p.close();
        }

        suite('11. Moviment reduït');
        {
            for (const reduit of [true, false]) {
                const p = await navegador.newPage({
                    viewport: { width: 1366, height: 768 },
                    reducedMotion: reduit ? 'reduce' : 'no-preference',
                });
                await p.goto(BASE + '/resolucio.html?activitat=equacions&nivell=2');
                await p.waitForFunction(() => window.resolucio);
                // Es compten els fantasmes que apareixen durant el pas
                await p.evaluate(() => {
                    window.__fantasmes = 0;
                    new MutationObserver(ms => {
                        for (const m of ms)
                            for (const n of m.addedNodes)
                                if (n.classList && n.classList.contains('pis-fantasma')) window.__fantasmes++;
                    }).observe(document.body, { childList: true, subtree: true });
                });
                await p.evaluate(() => window.resolucio.pissarra.seguent());
                const [fantasmes, revisio] = await p
                    .evaluate(REVISA, 'resolucio')
                    .then(async r => [await p.evaluate(() => window.__fantasmes), r]);
                if (reduit) ok('amb «reduir el moviment», cap símbol no viatja (cap fantasma)', fantasmes === 0);
                else ok('sense «reduir el moviment», els símbols viatgen', fantasmes > 0);
                eq(`${reduit ? 'moviment reduït' : 'moviment normal'}: el pas acaba amb els seus símbols`, revisio, '');
                eq(
                    `${reduit ? 'moviment reduït' : 'moviment normal'}: el text del pas es llegeix (aria-live)`,
                    await p.getAttribute('.pis-explicacio', 'aria-live'),
                    'polite'
                );
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
