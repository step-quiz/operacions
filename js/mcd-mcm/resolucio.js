/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/mcd-mcm/resolucio.js
 * ROL: «Resolució pas a pas» de «MCD i mcm» (escenari B, resolucio.html?activitat=mcd-mcm),
 *      amb el mètode del David (28/11/2026, revisió «Pissarra: MCD i mcm», docs/pissarra/STATE.md
 *      decisió 25): els dos arbres de factors; dos diagrames de Venn que sempre es tallen; a la
 *      intersecció, els factors primers comuns un per un (sense potències) o un 1 si són primers
 *      entre si; fora, els que queden de cada nombre; el MCD és el producte de la intersecció i el
 *      mcm el de tots dos conjunts, amb potències i el valor a la línia de sota.
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM), exportat com a ResolucioMM. exercici(nivell): la parella de l'activitat
 *   (math-engine.js generatePair: un 20 % de primers entre si); nivell 2 amb un 7 i nivell 3 amb
 *   un 11 o un 13. passos(ex, { oberts }): el guió, una sola fila HTML (historial amb pinta i envolta).
 * - Una línia de l'historial és un tros d'un dibuix: <g data-svg="arbres"> (les arrels, un arbre
 *   sencer o, al detall, una partició) o <g data-svg="venn"> (un factor o els que queden); envolta()
 *   els treu de tot arreu (també dels calaixos) i els posa dins de dos <svg> amb la mida final des
 *   del primer pas (R4): els dos arbres l'un al costat de l'altre i, a sota, els dos cercles (sense
 *   color, B6; només els rètols «Factors del 60» i «Factors del 90», B5). Els resultats, a sota.
 * - Pas a pas: les arrels; l'arbre de cada nombre sencer (A2; «Vull més detall»: les particions
 *   una per una, com a la pissarra de factors, que es dibuixen dins de l'arbre gris de l'objectiu);
 *   un pas per factor comú (B1: una fulla de cada arbre volen juntes i es fonen); el que queda de
 *   cada nombre (B3); el MCD i el mcm (C1, C2). Les fulles que ja són al diagrama queden en gris
 *   al 30 % (B2): les línies del diagrama porten data-usa amb les claus de les fulles.
 * - Les claus són les permanents de l'historial (L<id del pas>k<peça>), donades amb l'opció extra.
 * - Cada línia porta data-eq / data-comu / data-resta: tests/mcd-mcm.test.js les comprova.
 * DEPENDÈNCIES: pissarra/formules.js, mcd-mcm/math-engine.js, factoritzar/math-engine.js,
 *      factoritzar/resolucio.js (les eines de l'arbre).
 * ============================================================================
 */
import { guio, historial } from '../pissarra/formules.js';
import { generatePair } from './math-engine.js';
import { isPrime, primeFactorization } from '../factoritzar/math-engine.js';
import { ResolucioFA } from '../factoritzar/resolucio.js';

export const ResolucioMM = (() => {
    const NIVELLS = Object.freeze([1, 2, 3]);
    const { el, El, del, arbre, interiors, fulles, posicions, R } = ResolucioFA.eines;

    // ---- LA PARELLA ----

    /** La parella d'un exercici: la de l'activitat; nivell 2 amb un 7 i nivell 3 amb un 11 o un 13. */
    function exercici(nivell = 1) {
        const nv = Math.min(Math.max(Number(nivell) || 1, 1), 3);
        const te = { 2: [7], 3: [11, 13] }[nv];
        let parella = [12, 18];
        for (let i = 0; i < 400; i++) {
            parella = generatePair(nv - 1);
            if (!te || parella.some(x => te.some(p => x % p === 0))) break;
        }
        return { nivell: nv, n: parella[0], m: parella[1] };
    }

    // ---- ELS FACTORS ----

    /** Els factors primers de n en una llista, de menor a major (2, 2, 3, 5). */
    const llista = n =>
        Object.entries(primeFactorization(n))
            .flatMap(([p, e]) => Array(e).fill(Number(p)))
            .sort((x, y) => x - y);
    /** Producte amb potències: TeX (2^{2} \cdot 3), HTML (2<sup>2</sup> · 3) i text pla (2^2*3). */
    function potencies(fs) {
        const f = {};
        fs.forEach(p => (f[p] = (f[p] || 0) + 1));
        const ps = Object.keys(f)
            .map(Number)
            .sort((x, y) => x - y);
        return {
            ps,
            f,
            tex: ps.map(p => (f[p] > 1 ? `${p}^{${f[p]}}` : p)).join(' \\cdot '),
            pla: ps.map(p => (f[p] > 1 ? `${p}^${f[p]}` : p)).join('*'),
        };
    }
    const llegeix = xs => (xs.length === 1 ? `${xs[0]}` : `${xs.slice(0, -1).join(', ')} i ${xs[xs.length - 1]}`);

    // ---- EL DIBUIX: ELS DOS ARBRES ----

    const GAP = 40; // espai entre els dos arbres
    function midesArbres(arrels) {
        const ps = arrels.map(posicions);
        const offs = [0, ps[0].w + GAP];
        return { ps, offs, w: ps[0].w + GAP + ps[1].w, h: Math.max(ps[0].h, ps[1].h) };
    }
    const dk = k => (k ? ` data-k="${k}"` : '');
    /** Un node: el nombre (encerclat si és primer) dins d'un <g data-fulla> (per posar-lo en gris, B2). */
    const node = (p, dx, v, k) =>
        `<g data-fulla="${k}">` +
        (isPrime(v) ? `<circle class="jp-fa-cercle" cx="${p.x + dx}" cy="${p.y}" r="${R}"/>` : '') +
        `<text class="jp-fa-n${isPrime(v) ? ' jp-fa-primer' : ''}"${dk(k)} x="${p.x + dx}" y="${p.y}" text-anchor="middle" dominant-baseline="central">${v}</text></g>`;
    const branca = (p, q, dx) =>
        `<line class="jp-fa-branca" x1="${p.x + dx}" y1="${p.y + 14}" x2="${q.x + dx}" y2="${q.y - (R + 2)}"/>`;
    const punt = (qa, qb, dx) =>
        `<text class="jp-fa-punt" x="${(qa.x + qb.x) / 2 + dx}" y="${qa.y}" text-anchor="middle" dominant-baseline="central">·</text>`;

    /** Un tros dels arbres: les arrels, un arbre sencer (sense l'arrel) o una partició (al detall). */
    function trosArbres(l, clauDe, ex, classe) {
        const { ps, offs } = ex.mides;
        const cls = `jp-mm-tros${classe ? ' ' + classe : ''}`;
        if (l.tipus === 'arrels')
            return (
                `<g data-svg="arbres" class="${cls}">` +
                [0, 1].map(t => node(ps[t].pos.get('r'), offs[t], ex.arrels[t].v, clauDe('n' + t))).join('') +
                '</g>'
            );
        const t = l.t;
        const { pos } = ps[t];
        const dx = offs[t];
        if (l.tipus === 'arbre') {
            const parts = [];
            const eqs = [];
            for (const nd of interiors(ex.arrels[t])) {
                const [a, b] = nd.fills;
                const [qa, qb] = [pos.get(a.cami), pos.get(b.cami)];
                eqs.push(`${nd.v}=${a.v}*${b.v}`);
                parts.push(branca(pos.get(nd.cami), qa, dx), branca(pos.get(nd.cami), qb, dx), punt(qa, qb, dx));
                parts.push(node(qa, dx, a.v, clauDe('p' + a.cami)), node(qb, dx, b.v, clauDe('p' + b.cami)));
            }
            return `<g data-svg="arbres" data-tot="${t}" class="${cls}" data-eq="${eqs.join(';')}">${parts.join('')}</g>`;
        }
        // Una partició (detall de l'arbre)
        const nd = l.node;
        const [a, b] = nd.fills;
        const [qa, qb] = [pos.get(a.cami), pos.get(b.cami)];
        return (
            `<g data-svg="arbres" data-sub="${t}" class="${cls}" data-eq="${nd.v}=${a.v}*${b.v}">` +
            branca(pos.get(nd.cami), qa, dx) +
            branca(pos.get(nd.cami), qb, dx) +
            punt(qa, qb, dx) +
            node(qa, dx, a.v, clauDe('a')) +
            node(qb, dx, b.v, clauDe('b')) +
            '</g>'
        );
    }

    // ---- EL DIBUIX: ELS DIAGRAMES DE VENN ----

    const VW = 440; // amplada del dibuix dels cercles
    const VH = 270;
    const C = [
        { x: 160, y: 150 },
        { x: 280, y: 150 },
    ];
    const RV = 115;
    const FILES = [96, 129, 162, 195];
    /** Les caselles de cada regió: la intersecció (2 columnes) i la part de fora de cada cercle (3 columnes). */
    const COLS = { mig: [205, 235], a: [70, 100, 130], b: [310, 340, 370] };
    /** La casella del k-è element (de total) d'una regió: les files centrades. */
    function casella(regio, k, total) {
        const cols = COLS[regio];
        const files = Math.ceil(total / cols.length);
        const f0 = Math.floor((FILES.length - files) / 2);
        const fila = f0 + Math.floor(k / cols.length);
        const enFila = Math.min(cols.length, total - Math.floor(k / cols.length) * cols.length);
        const col = k % cols.length;
        // Una fila incompleta, centrada
        const x0 = cols[0] + ((cols.length - enFila) * (cols[1] - cols[0])) / 2;
        return { x: x0 + col * (cols[1] - cols[0]), y: FILES[fila] };
    }
    const textVenn = (p, v, k) =>
        `<text class="jp-mm-v"${dk(k)} x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central">${v}</text>`;

    /** Un tros del diagrama: un factor comú, l'1 o els que queden d'un nombre. */
    function trosVenn(l, clauDe, classe) {
        const cls = `jp-mm-tros${classe ? ' ' + classe : ''}`;
        const usa = ` data-usa="${l.usa.join(' ')}"`;
        if (l.tipus === 'comu' || l.tipus === 'u')
            return `<g data-svg="venn" class="${cls}"${usa} data-comu="${l.v}">${textVenn(l.casella, l.v, clauDe('v'))}</g>`;
        return (
            `<g data-svg="venn" class="${cls}"${usa} data-resta="${l.quin}:${l.fs.join('*')}">` +
            l.fs.map((v, i) => textVenn(l.caselles[i], v, clauDe('v' + i))).join('') +
            '</g>'
        );
    }

    /** Els dos cercles i els rètols (B5, B6: sense color). */
    const cercles = ex =>
        C.map(c => `<circle class="jp-mm-cercle" cx="${c.x}" cy="${c.y}" r="${RV}"/>`).join('') +
        `<text class="jp-mm-retol" x="${C[0].x - 55}" y="16" text-anchor="middle">Factors ${del(ex.n)}</text>` +
        `<text class="jp-mm-retol" x="${C[1].x + 55}" y="16" text-anchor="middle">Factors ${del(ex.m)}</text>`;

    // ---- ELS RESULTATS ----

    /** «MCD(60, 90) = 2 · 3 · 5 =» i, a sota, «= 30» (C1, C2); amb un sol factor, una sola línia. */
    function resultatHtml(l, clauDe, classe) {
        const { nom, ex, fs } = l;
        const pot = potencies(fs.filter(x => x > 1));
        const valor = fs.reduce((x, y) => x * y, 1);
        const cap = `${nom}(${ex.n}, ${ex.m})`;
        const peces = pot.ps.length
            ? pot.ps
                  .map(p => `<span${dk(clauDe('p' + p))}>${p}${pot.f[p] > 1 ? `<sup>${pot.f[p]}</sup>` : ''}</span>`)
                  .join(' · ')
            : `<span${dk(clauDe('p1'))}>1</span>`;
        const sol = pot.ps.length <= 1 && (!pot.ps.length || pot.f[pot.ps[0]] === 1);
        const eq = sol ? `${cap}=${valor}` : `${cap}=${pot.pla}=${valor}`;
        const cls = `jp-mm-res${classe ? ' ' + classe : ''}`;
        if (sol) return `<div class="${cls} jp-mm-res-1" data-eq="${eq}"><span>${cap} = ${peces}</span></div>`;
        return (
            `<div class="${cls}" data-eq="${eq}">` +
            `<span class="jp-mm-r1">${cap} = ${peces}&nbsp;</span><span class="jp-mm-r2">=</span>` +
            `<span></span><span class="jp-mm-r2">= <span${dk(clauDe('val'))}>${valor}</span></span></div>`
        );
    }
    const texResultat = (nom, ex, fs) => {
        const pot = potencies(fs.filter(x => x > 1));
        const valor = fs.reduce((x, y) => x * y, 1);
        const cap = `\\mathrm{${nom}}(${ex.n}, ${ex.m})`;
        if (!pot.ps.length) return `${cap} = 1`;
        if (pot.ps.length === 1 && pot.f[pot.ps[0]] === 1) return `${cap} = ${valor}`;
        return `${cap} = ${pot.tex} = ${valor}`;
    };

    // ---- EL PINTOR I L'EMBOLCALL ----

    /** Un tros de dibuix va entre separadors (U+E001 … U+E003, d'ús privat), perquè envolta() el trobi on sigui (també dins d'un calaix). */
    const marca = (svg, g) => `\uE001${svg}\uE002${g}\uE003`;
    const TROS = /\uE001(arbres|venn)\uE002([^\uE003]*)\uE003/g;

    function pintador(ex) {
        return (l, clauDe, classe) => {
            if (l.tipus === 'arrels' || l.tipus === 'arbre' || l.tipus === 'particio')
                return marca('arbres', trosArbres(l, clauDe, ex, classe));
            if (l.tipus === 'comu' || l.tipus === 'u' || l.tipus === 'resta')
                return marca('venn', trosVenn(l, clauDe, classe));
            return resultatHtml(l, clauDe, classe);
        };
    }
    /**
     * Treu els trossos de dibuix de tots els textos (també dels calaixos), els posa als seus <svg> i deixa la resta
     * a sota. Un arbre sencer amaga les particions del seu detall (són al mateix lloc); les fulles que ja són al
     * diagrama queden en gris (B2).
     */
    function envoltador(ex) {
        const { w, h } = ex.mides;
        return textos => {
            const trossos = { arbres: [], venn: [] };
            const resta = textos.map(t =>
                t.replace(TROS, (tot, svg, g) => {
                    trossos[svg].push(g);
                    return '';
                })
            );
            // Un arbre ja escrit (no el gris de l'objectiu, mentre es fa el detall) amaga les particions del seu detall
            const tots = new Set(
                trossos.arbres
                    .filter(g => !/pis-objectiu/.test(g.slice(0, g.indexOf('>'))))
                    .map(g => (g.match(/data-tot="(\d)"/) || [])[1])
                    .filter(Boolean)
            );
            const usades = new Set(
                trossos.venn.flatMap(g => (g.match(/data-usa="([^"]*)"/) || ['', ''])[1].split(' '))
            );
            let arbres = trossos.arbres.filter(g => !tots.has((g.match(/data-sub="(\d)"/) || [])[1])).join('');
            arbres = arbres.replace(/<g data-fulla="([^"]*)">/g, (g, k) =>
                usades.has(k) ? `<g data-fulla="${k}" class="jp-mm-usat">` : g
            );
            // Tres files (els arbres i els calaixos; el diagrama; els resultats): la pissarra baixa sola fins a la
            // que canvia (una sola fila tan alta es quedaria a dalt de tot)
            const resultats = resta.filter(t => t.startsWith('<div class="jp-mm-res'));
            const calaixos = resta.filter(t => !t.startsWith('<div class="jp-mm-res'));
            return [
                '<div class="jp-fa jp-mm">' +
                    `<svg class="jp-fa-svg jp-mm-arbres" viewBox="0 0 ${w} ${h}" style="width:${w / 20}em" role="img" aria-label="Arbres de factors ${del(ex.n)} i ${del(ex.m)}">${arbres}</svg>` +
                    calaixos.join('') +
                    '</div>',
                '<div class="jp-fa jp-mm">' +
                    `<svg class="jp-fa-svg jp-mm-venn" viewBox="0 0 ${VW} ${VH}" style="width:${VW / 24}em" role="img" aria-label="Diagrames de Venn dels factors ${del(ex.n)} i ${del(ex.m)}">` +
                    (trossos.venn.length ? cercles(ex) : '') +
                    trossos.venn.join('') +
                    '</svg></div>',
                resultats.length ? `<div class="jp-fa jp-mm">${resultats.join('')}</div>` : '',
            ].join(FILA);
        };
    }
    const FILA = '\uE004';
    /** El guió amb les tres files: envolta() les escriu juntes a la fila 0, separades per U+E004. */
    const tresFiles = passos =>
        passos.map(p => Object.freeze({ ...p, files: p.files[0].split(FILA), classes: ['', '', ''] }));

    // ---- EL GUIÓ ----

    const K = (idLinia, peca) => `L${String(idLinia).toUpperCase()}k${peca}`;

    function passos(ex0, { oberts = new Set() } = {}) {
        const { n, m } = ex0;
        const arrels = [arbre(n), arbre(m)];
        const ex = { ...ex0, arrels, mides: midesArbres(arrels) };
        const g = guio(1);
        const H = historial(g, { pinta: pintador(ex), envolta: envoltador(ex), oberts, objectiu: true });
        let pas = 0;
        const clau = [new Map(), new Map()]; // camí → clau, de cada arbre

        H.escriu(
            { tipus: 'arrels' },
            `Calcula el MCD i el mcm ${del(n)} i ${del(m)}. Primer, descompon-los en factors primers.`
        );
        pas++;
        clau[0].set('r', K(pas, 'n0'));
        clau[1].set('r', K(pas, 'n1'));

        // Els dos arbres (A2): sencers; al detall, partició per partició
        [n, m].forEach((x, t) => {
            const id = String(++pas);
            const arrel = arrels[t];
            const pot = potencies(llista(x));
            const nodes = interiors(arrel);
            const [fa, fb] = arrel.fills;
            H.escriu({ tipus: 'arbre', t }, `Fes l'arbre ${del(x)}: $${x} = ${pot.tex}$.`, {
                titol: `L'arbre ${del(x)}, pas a pas`,
                extra: { reparteix: { [clau[t].get('r')]: [K(id, 'p' + fa.cami), K(id, 'p' + fb.cami)] } },
                detall: D => {
                    const sub = new Map([['r', clau[t].get('r')]]); // camí → clau als subpassos
                    nodes.forEach((nd, i) => {
                        const sid = id + 'abcdefghij'[i];
                        const [a, b] = nd.fills;
                        D.escriu(
                            { tipus: 'particio', t, node: nd },
                            `Parteix ${el(nd.v)} en dos factors: ${nd.v} = ${a.v} · ${b.v}.`,
                            {
                                extra: { reparteix: { [sub.get(nd.cami)]: [K(sid, 'a'), K(sid, 'b')] } },
                            }
                        );
                        sub.set(a.cami, K(sid, 'a'));
                        sub.set(b.cami, K(sid, 'b'));
                    });
                    const reanomena = {};
                    for (const [cami, k] of sub) if (cami !== 'r') reanomena[K(id, 'p' + cami)] = k;
                    D.acaba(`Ja tens l'arbre ${del(x)}: $${x} = ${pot.tex}$.`, { extra: { reanomena } });
                },
            });
            for (const nd of nodes) for (const f of nd.fills) clau[t].set(f.cami, K(id, 'p' + f.cami));
        });

        // Les fulles de cada arbre: [valor, clau], de menor a major
        const lliures = [0, 1].map(t =>
            fulles(arrels[t])
                .map(f => [f.v, clau[t].get(f.cami)])
                .sort((x, y) => x[0] - y[0])
        );
        const comuns = [];
        for (const [v] of lliures[0].slice()) {
            const ia = lliures[0].findIndex(x => x[0] === v);
            const ib = lliures[1].findIndex(x => x[0] === v);
            if (ia < 0 || ib < 0) continue;
            comuns.push([v, lliures[0].splice(ia, 1)[0][1], lliures[1].splice(ib, 1)[0][1]]);
        }

        // La intersecció (B1: un pas per factor comú; B4: l'1 si són primers entre si)
        const mig = [];
        if (!comuns.length) {
            const id = String(++pas);
            H.escriu(
                { tipus: 'u', v: 1, casella: casella('mig', 0, 1), usa: [] },
                `No tenen cap factor primer comú. Escriu un 1 a la intersecció: és l'únic divisor comú ${del(n)} i ${del(m)}.`,
                { extra: { fusiona: { [K(id, 'v')]: [clau[0].get('r'), clau[1].get('r')] } } }
            );
            mig.push([1, K(id, 'v')]);
        }
        const vistos = new Set();
        comuns.forEach(([v, ka, kb], i) => {
            const id = String(++pas);
            const altre = vistos.has(v);
            vistos.add(v);
            H.escriu(
                { tipus: 'comu', v, casella: casella('mig', i, comuns.length), usa: [ka, kb] },
                altre
                    ? `Tots dos tenen un altre ${v}: també va a la intersecció.`
                    : `Tots dos tenen un ${v}: posa'l a la intersecció.`,
                { extra: { fusiona: { [K(id, 'v')]: [ka, kb] } } }
            );
            mig.push([v, K(id, 'v')]);
        });

        // El que queda de cada nombre (B3); si un no en té cap, ho diu la frase de l'altre
        const fora = [[], []];
        const buit = [0, 1].filter(t => !lliures[t].length);
        [0, 1].forEach(t => {
            if (!lliures[t].length) return;
            const x = t ? m : n;
            const altre = t ? n : m;
            const id = String(++pas);
            const fs = lliures[t].map(f => f[0]);
            const avis = buit.length
                ? `${El(altre)} no té cap altre factor: només als factors ${del(altre)} no hi va res. `
                : '';
            const text =
                avis +
                (fs.length === 1
                    ? `${El(x)} encara té un ${fs[0]}: posa'l només als factors ${del(x)}.`
                    : `${El(x)} encara té ${llegeix(fs)}: posa'ls només als factors ${del(x)}.`);
            const reanomena = {};
            lliures[t].forEach(([, k], i) => (reanomena[K(id, 'v' + i)] = k));
            H.escriu(
                {
                    tipus: 'resta',
                    quin: x,
                    fs,
                    caselles: fs.map((v, i) => casella(t ? 'b' : 'a', i, fs.length)),
                    usa: lliures[t].map(f => f[1]),
                },
                text,
                { extra: { reanomena } }
            );
            fs.forEach((v, i) => fora[t].push([v, K(id, 'v' + i)]));
        });

        // El MCD (C1) i el mcm (C2)
        const fusionaDe = (id, elements) => {
            const f = {};
            elements.forEach(([v, k]) => (f[K(id, 'p' + v)] = f[K(id, 'p' + v)] || []).push(k));
            return f;
        };
        let id = String(++pas);
        const fsMcd = mig.map(x => x[0]);
        H.escriu(
            { tipus: 'resultat', nom: 'MCD', ex: { n, m }, fs: fsMcd },
            comuns.length
                ? `El MCD és el producte dels factors de la intersecció: $${texResultat('MCD', { n, m }, fsMcd)}$.`
                : `A la intersecció només hi ha l'1: $${texResultat('MCD', { n, m }, fsMcd)}$.`,
            { extra: { fusiona: fusionaDe(id, mig) } }
        );
        id = String(++pas);
        const tot = [...mig.filter(x => x[0] > 1), ...fora[0], ...fora[1]];
        const fsMcm = tot.map(x => x[0]);
        H.escriu(
            { tipus: 'resultat', nom: 'mcm', ex: { n, m }, fs: fsMcm },
            `El mcm és el producte de tots els factors dels dos conjunts: $${texResultat('mcm', { n, m }, fsMcm)}$.`,
            { extra: { fusiona: fusionaDe(id, tot) }, final: true }
        );
        return tresFiles(g.passos);
    }

    return Object.freeze({ NIVELLS, exercici, passos, files: () => 3, casella });
})();
