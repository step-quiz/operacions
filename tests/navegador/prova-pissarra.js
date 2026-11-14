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
 *   7. equacions.html amb ?pissarra=1: 5 equacions resoltes (sense nivell, a mida
 *      de portàtil, i de nivell 3, a mida de mòbil): cada pas s'anima i afegeix una
 *      línia a l'historial; sense el paràmetre, cap pissarra;
 *   8. fraccions.html amb ?pissarra=1: sumes i restes (nivell 3, a mida de portàtil)
 *      i productes i divisions (a mida de mòbil) resoltes pas a pas; cada pas
 *      encertat s'anima i afegeix una línia, també una simplificació a mitges (i
 *      el pas torna a sortir, amb l'avís); sense el paràmetre, cap pissarra;
 *   9. si una animació falla, l'activitat continua (la cua del motor no es bloqueja);
 *  10. a l'inici del moviment, cada fantasma es dibuixa exactament damunt del seu
 *      original (també els <text> d'un esquema SVG, a la demo de Pitàgores), i cap
 *      requadre d'avís no tapa un símbol que no es mou;
 *  11. cap taula ni finestra no canvia de mida: la taula de prioritat (amb la pissarra i
 *      sense) i la zona de treball d'equacions mentre baixen els termes;
 *  12. amb «reduir el moviment», cap símbol no viatja; i la línia nova s'anuncia en text;
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

/** Equacions: la resposta del pas actual, a partir de l'última línia de l'historial i de la pregunta. */
const RESPOSTA_EQUACIO = () => {
    const linies = [...document.querySelectorAll('#eq-history .pis-capa .eq-history-line')];
    const text = linies[linies.length - 1].textContent.replace(/−/g, '-').replace(/\s+/g, '');
    const pregunta = document.getElementById('step-instruction').textContent;
    const termes = costat => {
        const out = [];
        const re = /([+-]?)(\d*)\(x([+-])(\d+)\)|([+-]?)(\d*)x|([+-]?)(\d+)/g;
        let m;
        while ((m = re.exec(costat))) {
            if (m[0] === '') {
                re.lastIndex++;
                continue;
            }
            if (m[4] !== undefined)
                out.push({
                    k: 'p',
                    c: (m[1] === '-' ? -1 : 1) * (m[2] ? +m[2] : 1),
                    n: (m[3] === '-' ? -1 : 1) * +m[4],
                });
            else if (m[6] !== undefined && m[0].endsWith('x'))
                out.push({ k: 'x', c: (m[5] === '-' ? -1 : 1) * (m[6] ? +m[6] : 1) });
            else out.push({ k: 'n', v: (m[7] === '-' ? -1 : 1) * +m[8] });
        }
        return out;
    };
    let [L, R] = text.split('=').map(termes);
    const sx = ts => ts.filter(t => t.k === 'x').reduce((s, t) => s + t.c, 0);
    const sn = ts => ts.filter(t => t.k === 'n').reduce((s, t) => s + t.v, 0);
    // La primera línia de «b = ax» es mostra girada: les x només a la dreta
    if (!L.some(t => t.k !== 'n') && R.some(t => t.k !== 'n')) [L, R] = [R, L];
    if (/distributiva/.test(pregunta)) {
        const p = (/esquerra/.test(pregunta) ? L : R).find(t => t.k === 'p');
        return p.c * p.n;
    }
    if (/Suma els termes amb x/.test(pregunta)) return sx(/esquerre/.test(pregunta) ? L : R);
    if (/Suma els termes independents/.test(pregunta)) return sn(/esquerre/.test(pregunta) ? L : R);
    if (/coeficient de la x/.test(pregunta)) return sx(L) - sx(R);
    if (/terme independent/.test(pregunta)) return sn(R) - sn(L);
    return sn(R) / sx(L);
};

/**
 * Fraccions: les respostes del pas actiu, calculades a partir de la primera línia.
 * mitges: a la simplificació, una fracció equivalent que encara no és irreductible (si n'hi ha).
 */
const RESPOSTA_FRACCIONS = mitges => {
    const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
    const linies = [...document.querySelectorAll('#expression-box .pis-capa .expr-line')];
    const llegeix = l =>
        [...l.children]
            .map(c =>
                c.classList.contains('fraction')
                    ? [...c.querySelectorAll('.math-cell')].map(m => +m.textContent)
                    : c.classList.contains('integer-val')
                      ? [+c.textContent, 1]
                      : c.textContent
            )
            .filter(t => t !== '=');
    const [[n1, d1], , [n2, d2]] = llegeix(linies[0]);
    const darrera = llegeix(linies[linies.length - 1]);
    const pas = document.querySelector('.step-container.active').id;
    if (pas === 'step-1') return { 's1-den': (d1 * d2) / mcd(d1, d2) };
    if (pas === 'step-2') {
        const D = +document.getElementById('s2-d1-text').textContent;
        return {
            's2-f1-top': D / d1,
            's2-f1-bot': D / d1,
            's2-n1': (n1 * D) / d1,
            's2-f2-top': D / d2,
            's2-f2-bot': D / d2,
            's2-n2': (n2 * D) / d2,
        };
    }
    if (pas === 'step-3') {
        const [[a, D], o, [b]] = darrera;
        return { 's3-n': o === '+' ? a + b : a - b, 's3-d': D };
    }
    if (pas === 'step-md-1') return { 'md-s1-n': d2, 'md-s1-d': n2 };
    if (pas === 'step-md-2') {
        const [[a, b], , [c, e]] = darrera;
        return { 'md-s2-n': a * c, 'md-s2-d': b * e };
    }
    const [[n, d]] = darrera;
    const g = mcd(n, d);
    let k = g;
    if (mitges) for (let j = 2; j < g; j++) if (g % j === 0) k = j;
    const [cn, cd] = pas === 'step-4' ? ['s4-n', 's4-d'] : ['md-s3-n', 'md-s3-d'];
    return { [cn]: n / k, [cd]: d / k === 1 ? '' : d / k, mitges: k !== g };
};

// ── Per congelar una animació: s'alenteixen les animacions i els temporitzadors de la pàgina ──
const ALENTEIX = k => `(() => {
    if (window.__lent) return;
    window.__lent = ${k};
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
 * mou (té la mateixa clau, el mateix text i el mateix lloc a la capa vella i a la nova).
 */
const REQUADRES_NETS = sel => {
    const capes = [...document.querySelectorAll(sel + ' .pis-capa')];
    const vella = capes.find(c => !c.classList.contains('pis-nova'));
    const nova = capes.find(c => c.classList.contains('pis-nova'));
    if (!vella || !nova) return { requadres: 0, quiets: 0, tapats: ['no hi ha les dues capes'] };
    const rect = e => e.getBoundingClientRect();
    const quiets = [...vella.querySelectorAll('[data-k]')].filter(e => {
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
    await pagina.waitForFunction(() => document.querySelector('.pis-fantasma'), null, { timeout: 30000 });
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

/** Espera la franja del final de pregunta i prem «Següent» (tota pregunta s'acaba així). */
async function premSeguent(pagina) {
    const boto = await pagina.waitForSelector('.franja-final #btn-next', { timeout: 6000 }).catch(() => null);
    if (boto) await boto.click();
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
            ok(`hi ha quatre demos (${ids.join(', ')})`, ids.length === 4);
            for (const id of ids) {
                await pagina.click(`#demos button[data-id="${id}"]`);
                const resultat = await pagina.evaluate(async () => {
                    const { pissarra } = window.demoPissarra;
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
            const quinPas = () => pagina.evaluate(PAS_PRIORITAT);
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

        suite('7. equacions.html amb la resolució pas a pas (?pissarra=1)');
        {
            // La resposta del pas actual, calculada a partir de l'última línia de l'historial i de la pregunta
            // (sense fer servir el codi de l'activitat)
            const RESPOSTA = RESPOSTA_EQUACIO;
            for (const [nom, viewport, q] of [
                ['portàtil, sense nivell (el que dona el botó de l’índex)', { width: 1366, height: 768 }, ''],
                ['mòbil, nivell 3 (parèntesis)', { width: 375, height: 740 }, '&nivell=3'],
            ]) {
                const pagina = await navegador.newPage({ viewport });
                const errors = [];
                pagina.on('pageerror', e => errors.push(String(e)));
                pagina.on('console', m => m.type() === 'error' && errors.push(m.text()));
                await pagina.goto(BASE + '/equacions.html?pissarra=1&totaloperations=5' + q);
                await pagina.waitForSelector('#value-input');
                let passos = 0,
                    animats = 0,
                    ample = false;
                const malament = [];
                for (let e = 0; e < 5; e++) {
                    for (let g = 0; g < 12; g++) {
                        const actiu = await pagina
                            .waitForFunction(
                                () => document.getElementById('step-value').classList.contains('active'),
                                null,
                                {
                                    timeout: 6000,
                                }
                            )
                            .then(() => true)
                            .catch(() => false);
                        if (!actiu) break;
                        const linies = () => pagina.$$eval('#eq-history .pis-capa .eq-history-line', ls => ls.length);
                        const abans = await linies();
                        const v = await pagina.evaluate(RESPOSTA);
                        await pagina.fill('#value-input', String(v));
                        await pagina.keyboard.press('Enter');
                        const fantasmes = await pagina
                            .waitForFunction(() => document.querySelectorAll('.pis-fantasma').length > 0, null, {
                                timeout: 2500,
                            })
                            .then(() => true)
                            .catch(() => false);
                        await pagina.waitForFunction(() => !document.querySelector('#eq-history .pis-nova'));
                        ample =
                            ample ||
                            (await pagina.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
                        passos++;
                        if (fantasmes) animats++;
                        const despres = await linies();
                        if (despres !== abans + 1) malament.push(`equació ${e + 1}: ${abans} → ${despres} línies`);
                        // L'equació s'acaba quan surt la solució (en verd)
                        if (await pagina.$('#eq-history .pis-capa .eq-solved')) break;
                    }
                    // Al final de cada equació, la franja amb el botó «Següent» (no es passa sola)
                    await premSeguent(pagina);
                }
                const punts = await pagina.textContent('#score-display');
                ok(
                    `${nom}: ${passos} passos encertats, tots animats`,
                    passos >= 5 && animats === passos,
                    `${animats} de ${passos}`
                );
                ok(`${nom}: cada pas afegeix exactament una línia`, !malament.length, malament.join('\n      → '));
                eq(`${nom}: les 5 equacions, amb tots els punts`, punts.trim(), 'Punts: 50');
                ok(`${nom}: la pàgina no surt de la pantalla`, !ample);
                ok(`${nom}: cap error a la consola`, !errors.length, errors.join('\n      → '));
                await pagina.close();
            }
            // Sense ?pissarra=1, equacions és com sempre: cap pissarra
            const p = await navegador.newPage();
            await p.goto(BASE + '/equacions.html');
            await p.waitForSelector('#eq-history .eq-history-line');
            eq('equacions.html (sense paràmetres): cap pissarra', await p.$$eval('.pis-escenari', es => es.length), 0);
            await p.close();
        }

        suite('8. fraccions.html amb la resolució pas a pas (?pissarra=1)');
        {
            // Les respostes del pas actiu, calculades a partir de la primera línia (sense el codi de l'activitat).
            // mitges: a la simplificació, una fracció equivalent que encara no és irreductible (si n'hi ha).
            const RESPOSTA = RESPOSTA_FRACCIONS;
            for (const [nom, viewport, boto] of [
                ['portàtil, suma o resta (nivell 3)', { width: 1366, height: 768 }, 'addsub'],
                ['mòbil, producte o divisió', { width: 375, height: 740 }, 'muldiv'],
            ]) {
                const pagina = await navegador.newPage({ viewport });
                const errors = [];
                pagina.on('pageerror', e => errors.push(String(e)));
                pagina.on('console', m => m.type() === 'error' && errors.push(m.text()));
                await pagina.goto(BASE + '/fraccions.html?pissarra=1&totaloperations=6');
                await pagina.click(`button[onclick="selectMode('${boto}')"]`);
                let passos = 0,
                    animats = 0,
                    ample = false,
                    mitges = 0;
                const malament = [];
                const linies = () => pagina.$$eval('#expression-box .pis-capa .expr-line', ls => ls.length);
                for (let e = 0; e < 6; e++) {
                    for (let g = 0; g < 10; g++) {
                        const actiu = await pagina
                            .waitForFunction(() => document.querySelector('.step-container.active'), null, {
                                timeout: 6000,
                            })
                            .then(() => true)
                            .catch(() => false);
                        if (!actiu) break;
                        // Quan surt un pas, l'activitat posa el cursor a la primera casella al cap de 50 ms: si
                        // s'escriu abans, una xifra pot anar a parar a la casella que no és
                        await pagina.waitForTimeout(100);
                        const pas = await pagina.$eval('.step-container.active', s => s.id);
                        const aMitges = /step-4|md-3/.test(pas) && !mitges;
                        const { mitges: mig, ...respostes } = await pagina.evaluate(RESPOSTA, aMitges);
                        const abans = await linies();
                        for (const [id, v] of Object.entries(respostes))
                            if (await pagina.isVisible('#' + id)) await pagina.fill('#' + id, String(v));
                        await pagina.keyboard.press('Enter');
                        // El denominador comú no escriu cap línia (surt el pas de les fraccions equivalents)
                        if (pas === 'step-1') {
                            await pagina.waitForSelector('#step-2.active', { timeout: 3000 }).catch(() => {});
                            continue;
                        }
                        const fantasmes = await pagina
                            .waitForFunction(() => document.querySelectorAll('.pis-fantasma').length > 0, null, {
                                timeout: 2500,
                            })
                            .then(() => true)
                            .catch(() => false);
                        await pagina.waitForFunction(() => !document.querySelector('#expression-box .pis-nova'));
                        ample =
                            ample ||
                            (await pagina.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
                        passos++;
                        if (fantasmes) animats++;
                        const despres = await linies();
                        if (despres !== abans + 1)
                            malament.push(
                                `operació ${e + 1}, ${pas} ${JSON.stringify(respostes)}: ${abans} → ${despres}`
                            );
                        // Una simplificació a mitges: el pas torna a sortir, amb l'avís
                        if (mig) {
                            const torna = await pagina
                                .waitForFunction(
                                    id => document.querySelector('.step-container.active')?.id === id,
                                    pas,
                                    { timeout: 3000 }
                                )
                                .then(() => true)
                                .catch(() => false);
                            const avis = torna && (await pagina.isVisible(`#${pas} .warn-msg`));
                            if (torna && avis) mitges++;
                            else if (torna) malament.push(`${pas}: torna a sortir però sense l'avís`);
                        }
                        // L'operació s'acaba quan surt la franja «Molt bé!» amb el botó «Següent»
                        if (await pagina.isVisible('.franja-final #btn-next')) break;
                    }
                    await premSeguent(pagina);
                }
                const punts = await pagina.textContent('#score-display');
                ok(
                    `${nom}: ${passos} passos encertats, tots animats`,
                    passos >= 6 && animats === passos,
                    `${animats} de ${passos}`
                );
                ok(`${nom}: cada pas afegeix exactament una línia`, !malament.length, malament.join('\n      → '));
                eq(`${nom}: les 6 operacions, amb tots els punts`, punts.trim(), 'Punts: 60');
                ok(`${nom}: la pàgina no surt de la pantalla`, !ample);
                ok(`${nom}: cap error a la consola`, !errors.length, errors.join('\n      → '));
                if (mitges) ok(`${nom}: una simplificació a mitges s'anima i el pas torna a sortir, amb l'avís`, true);
                await pagina.close();
            }
            // Sense ?pissarra=1, fraccions és com sempre: cap pissarra
            const p = await navegador.newPage();
            await p.goto(BASE + '/fraccions.html');
            await p.click(`button[onclick="selectMode('addsub')"]`);
            await p.waitForSelector('#expression-box .expr-line');
            eq('fraccions.html (sense paràmetres): cap pissarra', await p.$$eval('.pis-escenari', es => es.length), 0);
            await p.close();
        }

        suite("9. Si una animació falla, l'activitat continua (la cua del motor)");
        {
            const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            const errors = [];
            p.on('console', m => m.type() === 'error' && errors.push(m.text()));
            p.on('pageerror', e => errors.push(String(e)));
            await p.goto(BASE + '/equacions.html?pissarra=1&totaloperations=3&nivell=3');
            await p.waitForFunction(() => document.getElementById('step-value').classList.contains('active'));
            // Una sola excepció, a la propera animació
            await p.evaluate(() => {
                const original = Element.prototype.animate;
                let fet = false;
                Element.prototype.animate = function (...a) {
                    if (!fet) {
                        fet = true;
                        throw new Error('fallada simulada');
                    }
                    return original.apply(this, a);
                };
            });
            const linies = () => p.$$eval('#eq-history .pis-capa .eq-history-line', ls => ls.length);
            const abans = await linies();
            await p.fill('#value-input', String(await p.evaluate(RESPOSTA_EQUACIO)));
            await p.keyboard.press('Enter');
            const continua = await p
                .waitForFunction(
                    () =>
                        document.getElementById('step-value').classList.contains('active') ||
                        !!document.querySelector('.franja-final'),
                    null,
                    { timeout: 6000 }
                )
                .then(() => true)
                .catch(() => false);
            ok('amb una animació que falla, el pas següent surt igualment', continua);
            eq('la línia nova hi és, sense animació', await linies(), abans + 1);
            ok(
                'el motor ho diu a la consola',
                errors.some(e => /l'animació ha fallat/.test(e))
            );
            const altres = errors.filter(e => !/l'animació ha fallat|fallada simulada/.test(e));
            ok('cap altre error a la consola', !altres.length, altres.join('\n      → '));
            await p.close();
        }

        suite('10. Fantasmes fidels i requadres que no tapen res');
        {
            // Prioritat: el primer pas de l'expressió (la línia de dalt no es mou)
            let p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await p.goto(BASE + '/prioritat.html?pissarra=1&totaloperations=2');
            await p.waitForSelector('#steps-box .pis-escenari');
            await provaPasCongelat(p, '#steps-box', 'prioritat', async () => {
                const { i, val } = await p.evaluate(PAS_PRIORITAT);
                await p.click(`#steps-box .pis-capa .tok-btn[data-i="${i}"]`);
                await p.click(`#chip-pool .num-chip[data-val="${val}"]`);
            });
            await p.close();

            // Equacions: un pas d'una equació amb parèntesis (la línia de dalt no es mou; l'«=» té farciment)
            p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await p.goto(BASE + '/equacions.html?pissarra=1&totaloperations=3&nivell=3');
            await p.waitForFunction(() => document.getElementById('step-value').classList.contains('active'));
            await provaPasCongelat(p, '#eq-history', 'equacions', async () => {
                await p.fill('#value-input', String(await p.evaluate(RESPOSTA_EQUACIO)));
                await p.keyboard.press('Enter');
            });
            await p.close();

            // Fraccions: la suma dels numeradors, després d'ampliar (numeradors i denominadors en requadres a part)
            p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            let provat = false;
            for (let intent = 0; intent < 8 && !provat; intent++) {
                await p.goto(BASE + '/fraccions.html?pissarra=1&totaloperations=6');
                await p.click(`button[onclick="selectMode('addsub')"]`);
                let ampliat = false;
                for (let g = 0; g < 8 && !provat; g++) {
                    const actiu = await p
                        .waitForFunction(() => document.querySelector('.step-container.active'), null, {
                            timeout: 8000,
                        })
                        .then(() => true)
                        .catch(() => false);
                    if (!actiu) break;
                    await p.waitForTimeout(150);
                    const pas = await p.$eval('.step-container.active', e => e.id);
                    const respostes = await p.evaluate(RESPOSTA_FRACCIONS, false);
                    delete respostes.mitges;
                    for (const [id, v] of Object.entries(respostes))
                        if (await p.isVisible('#' + id)) await p.fill('#' + id, String(v));
                    if (pas === 'step-2') ampliat = true;
                    if (pas === 'step-3' && ampliat) {
                        await provaPasCongelat(p, '#expression-box', 'fraccions', () => p.keyboard.press('Enter'));
                        provat = true;
                        break;
                    }
                    await p.keyboard.press('Enter');
                    if (pas === 'step-1') {
                        await p.waitForSelector('#step-2.active', { timeout: 4000 }).catch(() => {});
                        continue;
                    }
                    await p.waitForFunction(() => !document.querySelector('#expression-box .pis-nova'));
                    if (await p.isVisible('.franja-final #btn-next')) break;
                }
            }
            ok('fraccions: hi ha hagut una suma amb denominadors diferents per provar', provat);
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

        suite('11. Cap taula ni finestra no canvia de mida');
        {
            const mides = (p, sel) =>
                p.evaluate(s => {
                    const capa = [...document.querySelectorAll(s)].pop();
                    const taula = capa.querySelector('table.centrat');
                    const primer = taula.querySelector('td');
                    return [taula.offsetWidth, Math.round(primer.getBoundingClientRect().left * 10) / 10];
                }, sel);
            for (const [nom, q, sel] of [
                ['amb la pissarra', '?pissarra=1&totaloperations=2', '#steps-box .pis-capa'],
                ['«Pas a pas» sense la pissarra', '?modalitat=passos&totaloperations=2', '#steps-box'],
            ]) {
                const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
                await p.goto(BASE + '/prioritat.html' + q);
                await p.waitForSelector('#steps-box table.centrat');
                const vistes = [];
                for (let g = 0; g < 3 && !(await p.$('.franja-final #btn-next')); g++) {
                    vistes.push(await mides(p, sel));
                    const { i, val } = await p.evaluate(PAS_PRIORITAT);
                    await p.click(`#steps-box .tok-btn[data-i="${i}"]`);
                    await p.waitForTimeout(150);
                    vistes.push(await mides(p, sel));
                    await p.click(`#chip-pool .num-chip[data-val="${val}"]`);
                    await p.waitForFunction(() => !document.querySelector('#steps-box .pis-nova'));
                    await p.waitForTimeout(150);
                }
                vistes.push(await mides(p, sel));
                const amples = new Set(vistes.map(v => v[0])),
                    xs = new Set(vistes.map(v => v[1]));
                ok(
                    `prioritat ${nom}: la taula no canvia d'amplada ni es desplaça (${vistes.length} moments)`,
                    amples.size === 1 && xs.size === 1,
                    JSON.stringify(vistes)
                );
                await p.close();
            }
            // Equacions: mentre baixen els termes, la zona de treball s'amaga però no s'encongeix
            const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
            await p.goto(BASE + '/equacions.html?pissarra=1&totaloperations=3&nivell=3');
            await p.waitForFunction(() => document.getElementById('step-value').classList.contains('active'));
            const alcada = () => p.evaluate(() => document.getElementById('resolution-panel').offsetHeight);
            const abans = await alcada();
            await p.fill('#value-input', String(await p.evaluate(RESPOSTA_EQUACIO)));
            await p.keyboard.press('Enter');
            await p.waitForSelector('#eq-history .pis-nova');
            const durant = await alcada();
            await p.waitForFunction(() => !document.querySelector('#eq-history .pis-nova'));
            ok(
                `equacions: la zona de treball no s'encongeix mentre s'anima la línia (${abans} → ${durant} px)`,
                Math.abs(durant - abans) <= 1
            );
            await p.close();
        }

        suite('12. Moviment reduït i línia nova anunciada');
        {
            for (const reduit of [true, false]) {
                const p = await navegador.newPage({
                    viewport: { width: 1366, height: 768 },
                    reducedMotion: reduit ? 'reduce' : 'no-preference',
                });
                await p.goto(BASE + '/equacions.html?pissarra=1&totaloperations=3&nivell=3');
                await p.waitForFunction(() => document.getElementById('step-value').classList.contains('active'));
                // Es compten els fantasmes que apareixen durant el pas
                await p.evaluate(() => {
                    window.__fantasmes = 0;
                    new MutationObserver(ms => {
                        for (const m of ms)
                            for (const n of m.addedNodes)
                                if (n.classList && n.classList.contains('pis-fantasma')) window.__fantasmes++;
                    }).observe(document.body, { childList: true, subtree: true });
                });
                const linies = () => p.$$eval('#eq-history .pis-capa .eq-history-line', ls => ls.length);
                const abans = await linies();
                await p.fill('#value-input', String(await p.evaluate(RESPOSTA_EQUACIO)));
                await p.keyboard.press('Enter');
                await p.waitForFunction(
                    () =>
                        document.getElementById('step-value').classList.contains('active') ||
                        !!document.querySelector('.franja-final'),
                    null,
                    { timeout: 8000 }
                );
                const [fantasmes, anunci, darrera] = await p.evaluate(() => {
                    const ls = [...document.querySelectorAll('#eq-history .pis-capa .eq-history-line')];
                    return [
                        window.__fantasmes,
                        document.querySelector('#eq-history .pis-anunci').textContent,
                        ls[ls.length - 1].textContent,
                    ];
                });
                const net = t => t.replace(/\s+/g, '');
                if (reduit) ok('amb «reduir el moviment», cap símbol no viatja (cap fantasma)', fantasmes === 0);
                else ok('sense «reduir el moviment», els símbols viatgen', fantasmes > 0);
                eq(`${reduit ? 'moviment reduït' : 'moviment normal'}: hi ha una línia més`, await linies(), abans + 1);
                ok(
                    `${reduit ? 'moviment reduït' : 'moviment normal'}: la línia nova s'anuncia en text («${anunci}»)`,
                    anunci.startsWith('Línia nova: ') && net(anunci.slice(12)) === net(darrera),
                    `anunci «${anunci}» · línia «${darrera}»`
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
