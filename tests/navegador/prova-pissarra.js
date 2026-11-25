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
 *   5. el botó «Resolució pas a pas» d'index.html obre el portal (resolucio.html) en una
 *      pestanya nova, i l'índex té el peu flotant;
 *   6. escenari A: prioritat, equacions i fraccions, també amb ?pissarra=1, són les
 *      de sempre (cap pissarra); a equacions, «Mira com es resol» obre la resolució
 *      del mateix nivell en una pestanya nova; a fraccions, prioritat i fórmules STEAM,
 *      l'enllaç porta el nivell que toca;
 *   7. escenari B, resolucio.html?activitat=equacions, fraccions, prioritat,
 *      formules-steam, inequacions i cilindres (portàtil i mòbil): cada pas amb els seus símbols, «Vull més
 *      detall» a cada pas que en té (la línia del pas en gris com a objectiu, els
 *      subpassos al calaix, «Menys detall»), el nivell (el desplegable, també amb el
 *      teclat), «Un altre exercici» i «Ara fes-ho tu»; el peu flotant a la vista; a la
 *      tauleta, el botó «Pas següent» no es mou d'un pas a l'altre; sense activitat,
 *      el portal (una targeta per activitat, amb els nivells i «Copia l'enllaç»);
 *   8. si una animació falla, la cua del motor (encua) mostra el pas i continua;
 *   9. a l'inici del moviment, cada fantasma es dibuixa exactament damunt del seu
 *      original (a resolucio.html, també en obrir un detall, i els <text> d'un
 *      esquema SVG a la demo de Pitàgores), i cap requadre d'avís no tapa un símbol
 *      que no es mou;
 *  10. la taula de prioritat no canvia de mida (R4);
 *  11. amb «reduir el moviment», cap símbol no viatja;
 *  12. a classe: tocar per acabar el pas, ↺ i el mode Projectar (la pissarra a tota
 *      l'amplada i l'alçada, també a pantalla ampla, i sense el peu);
 *   i cap error a la consola.
 * - Si Playwright no hi és (p. ex. a GitHub), la prova s'omet i no falla.
 * ÚS: node tests/navegador/prova-pissarra.js
 * ============================================================================
 */
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
/**
 * Un error de la consola que compta: no ho és un recurs de fora que no carrega (la icona de la llicència del peu,
 * de licensebuttons.net, quan les proves no tenen internet).
 */
const errorPropi = m =>
    m.type() === 'error' && !(/^Failed to load resource/.test(m.text()) && !(m.location().url || '').startsWith(BASE));

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
    // Les lletres ja carregades: si una font arriba tard (màquina carregada), la línia es mou ~1,5 px
    // després de posar-hi els fantasmes i la mesura falla sense que el motor faci res malament
    await pagina.evaluate(() => document.fonts.ready.then(() => true));
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
        final: !!document.querySelector('.pis-fila.final, .pis-fila tr.final'),
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
                // El detall: les files del calaix o, a la taula de prioritat (sense calaix), l'operació
                // destacada just a sobre de la fila de l'objectiu
                detall: document.querySelectorAll(
                    '.pis-capa .pis-fila.detall, .pis-capa .pis-calaix-pas, .pis-capa tr:has(+ tr.pis-objectiu) td.dest'
                ).length,
                objectiu: document.querySelectorAll('.pis-capa .pis-fila.objectiu, .pis-capa tr.pis-objectiu').length,
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
            pagina.on('console', m => errorPropi(m) && errors.push(m.text()));
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

        suite('5. index.html: el botó «Resolució pas a pas» i el peu flotant');
        {
            const pagina = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            const errors = [];
            pagina.on('pageerror', e => errors.push(String(e)));
            await pagina.goto(BASE + '/index.html');
            await pagina.waitForTimeout(1900); // les animacions d'entrada
            ok('el botó «Resolució pas a pas» hi és', await pagina.isVisible('#btn-resolucio'));
            eq(
                'és un enllaç a resolucio.html en una pestanya nova',
                await pagina.$eval('#btn-resolucio', a => [a.getAttribute('href'), a.target].join(' ')),
                'resolucio.html _blank'
            );
            const [nova] = await Promise.all([pagina.context().waitForEvent('page'), pagina.click('#btn-resolucio')]);
            await nova.waitForSelector('.targeta', { timeout: 8000 });
            ok(
                'la pestanya nova és el portal de les resolucions',
                new URL(nova.url()).pathname.endsWith('/resolucio.html')
            );
            await nova.close();
            const opcions = s => pagina.$$eval(`#cd-${s} .cd-option`, os => os.length);
            ok(
                'els menús d’ESO i de Batxillerat tenen totes les activitats',
                (await opcions('eso')) > 20 && (await opcions('batx')) > 5
            );
            // El segon panell (sessions…) s'amaga fins que es tria una activitat; després ja no desapareix
            ok(
                'abans de triar cap activitat, les opcions (sessions…) són amagades',
                !(await pagina.isVisible('#s-eso'))
            );
            // El menú d'ESO ja no s'obre sol en carregar (des del 25/11/2026): s'obre si cal
            if (!(await pagina.$eval('#cd-eso', w => w.classList.contains('open'))))
                await pagina.click('#cd-eso .cd-trigger');
            await pagina.click('#cd-eso-opt-1');
            ok('en triar una activitat, les opcions (sessions…) apareixen', await pagina.isVisible('#s-eso'));
            ok(
                'ESO: «Sessió fixa» és la primera fila del segon panell',
                await pagina.$eval('#panel-eso .sub-panel-params .row', r => r.id === 'row-fixed-eso')
            );
            ok(
                'el dock: el botó, a sobre de les icones, i la petjada, a sota',
                await pagina.evaluate(() => {
                    const y = s => document.querySelector(s).getBoundingClientRect();
                    return (
                        y('#btn-resolucio').bottom <= y('.dock-icones').top &&
                        y('.dock-icones').bottom <= y('.petjada-link').top
                    );
                })
            );
            const peu = await pagina.$eval('footer.peu', f => {
                const r = f.getBoundingClientRect();
                return {
                    fix: getComputedStyle(f).position,
                    baix: innerHeight - r.bottom,
                    visible: r.top < innerHeight,
                };
            });
            ok(
                `el peu és flotant i es veu a baix (${JSON.stringify(peu)})`,
                peu.fix === 'fixed' && peu.visible && peu.baix >= 4 && peu.baix <= 20
            );
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
            // Fraccions: el nivell de la resolució és el de la suma i la resta triat al menú (o 4, producte i divisió)
            const f = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await f.goto(BASE + '/fraccions.html?totaloperations=3');
            await f.selectOption('#addsub-level', '2');
            await f.click('button[onclick="selectMode(\'addsub\')"]');
            eq(
                'fraccions: suma o resta del nivell 2 → «Mira com es resol» del nivell 2',
                await f.getAttribute('#mira-com', 'href'),
                'resolucio.html?activitat=fraccions&nivell=2'
            );
            await f.goto(BASE + '/fraccions.html?totaloperations=3');
            await f.click('button[onclick="selectMode(\'muldiv\')"]');
            eq(
                'fraccions: producte o divisió → «Mira com es resol» del nivell 4',
                await f.getAttribute('#mira-com', 'href'),
                'resolucio.html?activitat=fraccions&nivell=4'
            );
            await f.close();
            // Fórmules STEAM: «Mira com es resol» porta a la resolució de la mateixa fórmula; amb ?materia=quimica,
            // totes les fórmules són de química
            const s = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await s.goto(BASE + '/formules-steam.html?totaloperations=3&nivell=2&materia=quimica');
            await s.waitForSelector('#jp-joc .jp-enllac');
            const hrefSteam = await s.getAttribute('#jp-joc .jp-enllac', 'href');
            const quimiques = await s.evaluate(() =>
                import('/js/formules-steam/cataleg.js').then(m =>
                    m.FORMULES.filter(f => f.materia === 'quimica').map(f => f.id)
                )
            );
            const fSteam = (/^resolucio\.html\?activitat=formules-steam&nivell=([a-z]+)$/.exec(hrefSteam) || [])[1];
            ok(
                `fórmules STEAM de química → «Mira com es resol» de la mateixa fórmula, de química (${hrefSteam})`,
                quimiques.includes(fSteam)
            );
            await s.close();
            // Inequacions: «Mira com es resol» porta a la resolució del mateix nivell
            const iq = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await iq.goto(BASE + '/inequacions.html?totaloperations=3&nivell=3');
            await iq.waitForSelector('#jp-joc .jp-enllac');
            eq(
                'inequacions del nivell 3 → «Mira com es resol» del nivell 3',
                await iq.getAttribute('#jp-joc .jp-enllac', 'href'),
                'resolucio.html?activitat=inequacions&nivell=3'
            );
            await iq.close();
            // Cilindres: «Mira com es resol» porta a la resolució del nivell del full
            const cf = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await cf.goto(BASE + '/cilindres.html?totaloperations=3&nivell=2');
            await cf.waitForSelector('#jp-joc .jp-enllac');
            eq(
                'cilindres del nivell 2 → «Mira com es resol» del nivell 2',
                await cf.getAttribute('#jp-joc .jp-enllac', 'href'),
                'resolucio.html?activitat=cilindres&nivell=2'
            );
            await cf.close();
            // Prioritat: la primera expressió de la sessió és del nivell 0 → el grup 1 de la resolució
            const q = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await q.goto(BASE + '/prioritat.html?totaloperations=3');
            await q.waitForSelector('#mira-com');
            eq(
                'prioritat: la primera expressió (nivell 0) → «Mira com es resol» del grup 1',
                await q.getAttribute('#mira-com', 'href'),
                'resolucio.html?activitat=prioritat&nivell=1'
            );
            await q.close();
        }

        suite('7. Escenari B: resolucio.html (mirar com es resol)');
        {
            for (const [act, lloc, viewport, nivellInicial = 3] of [
                ['equacions', 'portàtil', { width: 1366, height: 768 }],
                ['equacions', 'mòbil', { width: 375, height: 740 }],
                ['fraccions', 'portàtil', { width: 1366, height: 768 }],
                ['fraccions', 'mòbil', { width: 375, height: 740 }],
                ['prioritat', 'portàtil', { width: 1366, height: 768 }],
                ['prioritat', 'mòbil', { width: 375, height: 740 }],
                // Fórmules STEAM: el nivell 4 (les pissarres més llargues); encara sense detall a demanda
                ['formules-steam', 'portàtil', { width: 1366, height: 768 }, 'posicio'],
                ['formules-steam', 'mòbil', { width: 375, height: 740 }, 'boyle'],
                // Inequacions de primer grau: el nivell 4 (denominadors) i el 2 (dividir per un negatiu)
                ['inequacions', 'portàtil', { width: 1366, height: 768 }, 4],
                ['inequacions', 'mòbil', { width: 375, height: 740 }, 2],
                // Cilindres amb un full: el full A4 (portàtil) i un altre full (mòbil)
                ['cilindres', 'portàtil', { width: 1366, height: 768 }, 1],
                ['cilindres', 'mòbil', { width: 375, height: 740 }, 2],
            ]) {
                const nom = `${act}, ${lloc}`;
                const p = await navegador.newPage({ viewport });
                const errors = [];
                p.on('pageerror', e => errors.push(String(e)));
                p.on('console', m => errorPropi(m) && errors.push(m.text()));
                await p.goto(`${BASE}/resolucio.html?activitat=${act}&nivell=${nivellInicial}`);
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
                // El peu, flotant i a la vista
                const peu = await p.$eval('footer.peu', f => {
                    const r = f.getBoundingClientRect();
                    return getComputedStyle(f).position === 'fixed' && r.bottom <= innerHeight && r.top > 0;
                });
                ok(`${nom}: el peu flotant es veu`, peu);
                // Nivell (el desplegable), «Un altre exercici» i «Ara fes-ho tu». Els nivells que es veuen: els de
                // l'activitat o, amb grups (Fórmules STEAM), les fórmules de la matèria triada
                const visibles = () =>
                    p.$$eval('#nivells [role="option"]:not([hidden])', os =>
                        os.map(o => [o.dataset.nivell, o.textContent.trim()])
                    );
                // El que ha de fer el registre: quants nivells es veuen i on porta «Ara fes-ho tu»
                const registre = (v, quants) =>
                    p.evaluate(
                        async ([a, v, quants]) => {
                            const reg = (await import('/js/resolucio/activitats.js')).ACTIVITATS[a];
                            const grup = (document.querySelector('.grup[aria-checked="true"]') || {}).dataset;
                            const g = grup ? grup.grup : undefined;
                            const n = reg.nivells
                                ? reg.nivells.length
                                : (await reg.carrega()).NIVELLS.filter(x => x[2] === g).length;
                            if (quants) return n;
                            return reg.enllac
                                ? reg.enllac(reg.nivells ? Number(v) : v, g)
                                : `${reg.pagina}?nivell=${v}`;
                        },
                        [act, v, quants]
                    );
                await p.click('#nivell-boto');
                ok(`${nom}: el desplegable del nivell s'obre`, await p.isVisible('#nivells'));
                const vs = await visibles();
                eq(`${nom}: el desplegable té tots els nivells (del grup)`, vs.length, await registre(null, true));
                eq(
                    `${nom}: la fletxa de la capçalera torna al portal`,
                    await p.getAttribute('#torna', 'href'),
                    'resolucio.html'
                );
                const [[v1, nom1], [v2]] = vs;
                await p.click(`#nivells [data-nivell="${v1}"]`);
                await p.waitForFunction(() => !window.resolucio.pissarra.ocupat);
                eq(
                    `${nom}: el nivell queda a l'adreça`,
                    await p.evaluate(() => location.search),
                    `?activitat=${act}&nivell=${v1}`
                );
                eq(
                    `${nom}: «Ara fes-ho tu» porta a l'activitat, amb el nivell (o la matèria)`,
                    await p.getAttribute('#fes-ho-tu', 'href'),
                    await registre(v1)
                );
                eq(
                    `${nom}: un exercici nou comença pel primer pas`,
                    await p.evaluate(() => window.resolucio.pissarra.pas),
                    0
                );
                ok(`${nom}: en triar, el desplegable es tanca`, !(await p.isVisible('#nivells')));
                eq(
                    `${nom}: el botó diu el nivell triat`,
                    (await p.textContent('#nivell-nom')).trim(),
                    nom1.replace(/^\d+/, '')
                );
                await p.click('#un-altre');
                eq(`${nom}: «Un altre exercici» també`, await p.evaluate(() => window.resolucio.pissarra.pas), 0);
                // El nivell amb el teclat: ↓ obre, ↓ baixa, Retorn tria
                await p.focus('#nivell-boto');
                await p.keyboard.press('ArrowDown');
                await p.keyboard.press('ArrowDown');
                await p.keyboard.press('Enter');
                await p.waitForFunction(() => !window.resolucio.pissarra.ocupat);
                eq(
                    `${nom}: amb el teclat (↓ ↓ Retorn) es tria el segon nivell, i les fletxes no passen cap pas`,
                    [
                        await p.evaluate(() => location.search),
                        await p.evaluate(() => window.resolucio.pissarra.pas),
                    ].join(' '),
                    `?activitat=${act}&nivell=${v2} 0`
                );
                // Fórmules STEAM: primer la matèria (els botons) i després la fórmula
                if (act === 'formules-steam') {
                    eq(`${nom}: hi ha els botons de les tres matèries`, await p.$$eval('.grup', bs => bs.length), 3);
                    await p.click('.grup[data-grup="quimica"]');
                    await p.waitForFunction(() => !window.resolucio.pissarra.ocupat);
                    const fq = new URLSearchParams(await p.evaluate(() => location.search)).get('nivell');
                    const quimiques = await p.evaluate(() =>
                        import('/js/formules-steam/cataleg.js').then(m =>
                            m.FORMULES.filter(f => f.materia === 'quimica').map(f => f.id)
                        )
                    );
                    ok(
                        `${nom}: «Química» posa una fórmula de química (${fq}) i només en mostra de química`,
                        quimiques.includes(fq) &&
                            (await visibles()).every(([v]) => quimiques.includes(v)) &&
                            (await p.getAttribute('.grup[data-grup="quimica"]', 'aria-checked')) === 'true'
                    );
                    eq(
                        `${nom}: «Ara fes-ho tu» porta a les fórmules de química`,
                        await p.getAttribute('#fes-ho-tu', 'href'),
                        'formules-steam.html?materia=quimica'
                    );
                }
                ok(`${nom}: cap error a la consola`, !errors.length, errors.join('\n      → '));
                await p.close();
            }
            // A la tauleta (una columna), el botó «Pas següent» no es mou d'un pas a l'altre (la pissarra ocupa
            // tota l'alçada des del principi)
            {
                const t = await navegador.newPage({ viewport: { width: 820, height: 1000 } });
                await t.goto(BASE + '/resolucio.html?activitat=equacions&nivell=3');
                await t.waitForFunction(() => window.resolucio);
                const posicions = [];
                for (let i = 0; i < 4; i++) {
                    posicions.push(
                        await t.$eval('.pis-boto[aria-label="Pas següent"]', b =>
                            Math.round(b.getBoundingClientRect().top)
                        )
                    );
                    await t.evaluate(() => window.resolucio.pissarra.seguent());
                    await t.waitForFunction(() => !window.resolucio.pissarra.ocupat);
                }
                ok(
                    `tauleta: el botó «Pas següent» és sempre al mateix lloc (${posicions.join(', ')})`,
                    new Set(posicions).size === 1
                );
                await t.close();
            }
            const p = await navegador.newPage();
            await p.goto(BASE + '/resolucio.html');
            eq(
                'sense activitat, el portal té una targeta per activitat',
                await p.$$eval('.targeta', ts => ts.length),
                6
            );
            ok(
                'cada targeta té la fórmula d’exemple dibuixada amb KaTeX, els nivells, «Mira com es resol» i «Copia l’enllaç»',
                await p.$$eval('.targeta', ts =>
                    ts.every(
                        t =>
                            t.querySelector('.targeta-exemple .katex') &&
                            t.querySelector('.xip-nivell') &&
                            t.querySelector('.copia') &&
                            t.querySelector('a.targeta-mira')
                    )
                )
            );
            eq(
                'el xip del nivell 2 de les equacions hi porta directament',
                await p.$$eval('.xip-nivell', xs =>
                    xs.map(x => x.getAttribute('href')).find(h => h === 'resolucio.html?activitat=equacions&nivell=2')
                ),
                'resolucio.html?activitat=equacions&nivell=2'
            );
            eq('al portal, la fletxa torna a l’índex', await p.getAttribute('#torna', 'href'), 'index.html');
            ok(
                'a la targeta de Fórmules STEAM, un xip per matèria (Física, Química, Tecnologia)',
                await p.isVisible('a.xip-nivell[href="resolucio.html?activitat=formules-steam&grup=quimica"]')
            );
            ok(
                'sense activitat, la pàgina diu quines en tenen',
                (await p.isVisible('a.targeta-enllac[href="resolucio.html?activitat=equacions"]')) &&
                    (await p.isVisible('a.targeta-enllac[href="resolucio.html?activitat=fraccions"]')) &&
                    (await p.isVisible('a.targeta-enllac[href="resolucio.html?activitat=prioritat"]')) &&
                    (await p.isVisible('a.targeta-enllac[href="resolucio.html?activitat=formules-steam"]')) &&
                    (await p.isVisible('a.targeta-enllac[href="resolucio.html?activitat=inequacions"]')) &&
                    (await p.isVisible('a.targeta-enllac[href="resolucio.html?activitat=cilindres"]'))
            );
            await p.close();
        }

        suite('8. Si una animació falla, la cua del motor continua');
        {
            const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            const errors = [];
            p.on('console', m => errorPropi(m) && errors.push(m.text()));
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

            // Fraccions: el detall del comú denominador fa volar nombres d'una línia de més amunt (id@k)
            p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await p.goto(BASE + '/resolucio.html?activitat=fraccions&nivell=3');
            await p.waitForFunction(() => window.resolucio);
            const lliureF = () => p.waitForFunction(() => !window.resolucio.pissarra.ocupat);
            await p.evaluate(() => window.resolucio.pissarra.salta(1)); // el pas 2: el comú denominador
            await p.click('.pis-detall-boto'); // 2a: el mcm
            await lliureF();
            await provaPasCongelat(p, '#pissarra', 'fraccions, ampliar la primera fracció (de dues línies amunt)', () =>
                p.evaluate(() => {
                    window.resolucio.pissarra.seguent();
                })
            );
            await lliureF();
            await p.evaluate(() => window.resolucio.pissarra.seguent()); // 2c: la segona fracció
            await lliureF();
            await provaPasCongelat(p, '#pissarra', 'fraccions, tancar el detall (de diverses línies amunt)', () =>
                p.evaluate(() => {
                    window.resolucio.pissarra.seguent();
                })
            );
            await p.close();

            // Prioritat: a la taula, els tokens de l'operació volen de la seva cel·la i es fusionen en el resultat.
            // El primer pas, una potència (3²): el seu superíndex també ha de ser el mateix al fantasma
            p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await p.goto(BASE + '/resolucio.html?activitat=prioritat&nivell=3');
            await p.waitForFunction(() => window.resolucio);
            for (let k = 0; k < 40; k++) {
                const ambPotencia = await p.evaluate(() => /[²³] =/.test(window.resolucio.pissarra.passos[1].text));
                if (ambPotencia) break;
                await p.click('#un-altre');
                await p.waitForFunction(() => !window.resolucio.pissarra.ocupat);
            }
            ok(
                'prioritat: hi ha un exercici que comença per una potència',
                await p.evaluate(() => /[²³] =/.test(window.resolucio.pissarra.passos[1].text))
            );
            await provaPasCongelat(p, '#pissarra', 'prioritat, pas 2 (la taula, una potència)', () =>
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

        suite('12. A classe: tocar per acabar el pas, ↺ i el mode professor');
        {
            const p = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
            const errors = [];
            p.on('pageerror', e => errors.push(String(e)));
            p.on('console', m => errorPropi(m) && errors.push(m.text()));
            await p.goto(BASE + '/resolucio.html?activitat=equacions&nivell=3');
            await p.waitForFunction(() => window.resolucio);
            const lliure = () => p.waitForFunction(() => !window.resolucio.pissarra.ocupat, null, { timeout: 8000 });
            const pas = () => p.evaluate(() => window.resolucio.pissarra.pas);
            ok('al primer pas, el ↺ no hi és', !(await p.isVisible('.pis-repeteix')));
            // Tocar la pissarra mentre s'anima: el pas queda escrit de seguida
            await p.evaluate(() => {
                window.resolucio.pissarra.seguent();
            });
            await p.waitForTimeout(120);
            const t0 = Date.now();
            await p.click('#pissarra .pis-escenari');
            await lliure();
            ok(
                `tocar la pissarra acaba el pas de cop (${Date.now() - t0} ms)`,
                Date.now() - t0 < 900 && (await pas()) === 1
            );
            const r = await p.evaluate(REVISA, 'resolucio');
            ok('el pas acabat de cop té els seus símbols i cap resta de l’animació', !r, r);
            // ↺: torna a animar el mateix pas
            ok('després del primer pas, el ↺ hi és', await p.isVisible('.pis-repeteix'));
            await p.click('.pis-repeteix');
            const anima = await p.evaluate(() => window.resolucio.pissarra.ocupat);
            await lliure();
            ok('↺ torna a animar el mateix pas', anima && (await pas()) === 1);
            // L'espai acaba el pas que s'anima; Av Pàg i Re Pàg passen els passos
            // (amb la màquina carregada, Av Pàg pot trigar a engegar el pas: l'espai només quan ja s'anima,
            // que és el que es prova; si arribés abans, actuaria sobre el botó que tingués el focus)
            await p.keyboard.press('PageDown');
            await p
                .waitForFunction(() => window.resolucio.pissarra.ocupat || window.resolucio.pissarra.pas === 2, null, {
                    timeout: 8000,
                })
                .catch(() => {});
            await p.keyboard.press('Space');
            await lliure();
            eq('Av Pàg passa al pas següent i l’espai l’acaba de cop', await pas(), 2);
            await p.keyboard.press('PageUp');
            await p.waitForFunction(() => window.resolucio.pissarra.pas === 1, null, { timeout: 8000 }).catch(() => {});
            await lliure();
            eq('Re Pàg torna al pas anterior', await pas(), 1);
            // Mode professor
            await p.click('#professor');
            await p.waitForTimeout(500);
            const dins = await p.evaluate(() => ({
                classe: document.body.classList.contains('professor'),
                adreca: location.search,
                frase: getComputedStyle(document.querySelector('.pis-explicacio-fila')).display,
                mida: parseFloat(getComputedStyle(document.querySelector('.pis-pissarra')).fontSize),
                titol: getComputedStyle(document.querySelector('header h1')).display,
                peu: getComputedStyle(document.querySelector('footer.peu')).display,
                boto: document.querySelector('#professor').textContent,
            }));
            ok(
                `«Projectar»: pissarra gran (${dins.mida}px), sense frases, títol ni peu, «Deixa de projectar» i a l’adreça`,
                dins.classe &&
                    dins.adreca.endsWith('&professor=1') &&
                    dins.frase === 'none' &&
                    dins.titol === 'none' &&
                    dins.peu === 'none' &&
                    dins.boto === 'Deixa de projectar' &&
                    dins.mida > 40,
                JSON.stringify(dins)
            );
            await p.click('#professor');
            await p.waitForTimeout(300);
            const fora = await p.evaluate(() => [document.body.classList.contains('professor'), location.search]);
            ok(
                'en sortir, tot torna a ser com abans',
                !fora[0] && !fora[1].includes('professor'),
                JSON.stringify(fora)
            );
            // A pantalla ampla, la pissarra ocupa tota l'amplada i l'alçada, encara que el que hi ha escrit sigui
            // estret (una suma de fraccions): abans s'encongia a l'amplada del contingut
            {
                const a = await navegador.newPage({ viewport: { width: 1366, height: 680 } });
                await a.goto(BASE + '/resolucio.html?activitat=fraccions&nivell=1&professor=1');
                await a.waitForFunction(() => window.resolucio);
                const mida = await a.$eval('#pissarra .pis-escenari', e => {
                    const r = e.getBoundingClientRect();
                    const c = document.querySelector('.pis-controls').getBoundingClientRect();
                    return { ample: Math.round(r.width), alt: Math.round(r.height), baixBotons: Math.round(c.bottom) };
                });
                ok(
                    `«Projectar» a 1366 × 680: la pissarra fa tota l'amplada i l'alçada, amb els botons a baix (${JSON.stringify(mida)})`,
                    mida.ample > 1250 && mida.alt > 420 && mida.baixBotons > 600 && mida.baixBotons <= 680
                );
                await a.close();
            }
            await p.goto(BASE + '/resolucio.html?activitat=prioritat&nivell=4&professor=1');
            await p.waitForFunction(() => window.resolucio);
            ok(
                '?professor=1 obre en mode professor, amb el botó «Pantalla completa»',
                (await p.evaluate(() => document.body.classList.contains('professor'))) &&
                    (await p.isVisible('#pantalla'))
            );
            ok('cap error a la consola', !errors.length, errors.join('\n      → '));
            await p.close();
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
