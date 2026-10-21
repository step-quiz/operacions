/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/codi-verificacio.test.js
 * ROL: Comprova la lletra de control dels codis (js/codi-verificacio.js):
 *   1. Vectors fixos. Són els mateixos que ha de complir la còpia de la
 *      fórmula que hi ha a step-quiz/cb (core.js): si en canvies un, canvia
 *      també l'altre projecte.
 *   2. Canviar UNA xifra qualsevol dels resultats d'un codi nou el fa deixar
 *      de quadrar amb la lletra nova (sempre, a totes les posicions).
 *   3. Els codis d'abans (lletra antiga) continuen sent vàlids.
 *   4. Format v3 (CB): vectors fixos (els mateixos que tests/codi.test.js de cb), com es
 *      llegeixen els camps nous, que canviar-ne un de sol es detecti sempre, i que els
 *      codis mal formats es rebutgin.
 * ÚS: node tests/codi-verificacio.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, eq, finish } = require('./harness');

// Codi complet (Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRR…) → arguments de versioLletra
function camps(codi) {
    const p = codi.split('-');
    return {
        lletra: p[0][0],
        salt: p[0].slice(1),
        dd: +p[1].slice(0, 2),
        mm: +p[1].slice(2, 4),
        hh: +p[2].slice(0, 2),
        mn: +p[2].slice(2, 4),
        ni: +p[7],
        ee: p[3],
        d: p[4],
        s: p[5],
        qq: p[6],
        r: p[8],
    };
}

// Vectors fixos: [codi amb la lletra nova, lletra que tindria amb la fórmula antiga]
const VECTORS = [
    ['Gabc-1206-0930-EN-1-3-10-075-111211143111214111311112141111', 'E'],
    ['Yqxz-0311-1805-EQ-2-5-10-100-11111111111111111111111111111111111111111111111111', 'C'],
    ['Pq26-1710-1042-CB-2-1-30-062-141114411114411114111144111141', 'R'],
];

(async () => {
    const m = await import(pathToFileURL(path.join(ROOT, 'js/codi-verificacio.js')).href);
    const versio = codi => {
        const c = camps(codi);
        return m.versioLletra(c.lletra, c.ni, c.dd, c.mm, c.hh, c.mn, c.salt, m.cosDelCodi(c.ee, c.d, c.s, c.qq, c.r));
    };

    suite('1. Vectors fixos (els mateixos que a step-quiz/cb)');
    for (const [codi, antiga] of VECTORS) {
        const c = camps(codi);
        eq(
            `lletra nova de ${codi.slice(0, 20)}…`,
            m.lletraNova(c.ni, c.dd, c.mm, c.hh, c.mn, c.salt, m.cosDelCodi(c.ee, c.d, c.s, c.qq, c.r)),
            c.lletra
        );
        eq(`lletra antiga de ${codi.slice(0, 20)}…`, m.lletraAntiga(c.ni, c.dd, c.mm, c.hh, c.mn, c.salt), antiga);
        eq(`${codi.slice(0, 20)}… es reconeix com a codi nou`, versio(codi), 'nova');
    }

    suite('2. Canviar una sola xifra dels resultats es detecta sempre');
    for (const [codi] of VECTORS) {
        const c = camps(codi);
        let canvis = 0,
            detectats = 0;
        for (let i = 0; i < c.r.length; i++) {
            for (const xifra of '01234') {
                if (xifra === c.r[i]) continue;
                const r2 = c.r.slice(0, i) + xifra + c.r.slice(i + 1);
                const codi2 = codi.slice(0, codi.length - c.r.length) + r2;
                canvis++;
                if (versio(codi2) !== 'nova') detectats++;
            }
        }
        eq(`${codi.slice(0, 20)}…: ${canvis} canvis possibles, tots detectats`, detectats, canvis);
    }
    {
        // També els camps de la capçalera que abans no estaven protegits
        const [codi] = VECTORS[0];
        const p = codi.split('-');
        const variants = [
            [3, 'EQ'],
            [4, '2'],
            [5, '4'],
            [6, '09'],
        ];
        for (const [idx, valor] of variants) {
            const p2 = [...p];
            p2[idx] = valor;
            ok(`canviar el camp ${idx + 1} (${p[idx]} → ${valor}) es detecta`, versio(p2.join('-')) !== 'nova');
        }
    }

    suite("3. Els codis d'abans continuen sent vàlids");
    for (const [codi, antiga] of VECTORS) {
        const vell = antiga + codi.slice(1);
        ok(`${vell.slice(0, 20)}… és vàlid (lletra antiga)`, versio(vell) === 'antiga');
    }
    // G (nova) i E (antiga) són les dues lletres vàlides del primer vector; Z no ho és
    eq('un codi amb una lletra que no quadra amb cap fórmula és invàlid', versio('Z' + VECTORS[0][0].slice(1)), null);

    // ── 4. Format v3 (CB) ────────────────────────────────────────────────────
    // Els vectors de tests/codi.test.js de cb: allà es generen a partir d'unes entrades; aquí es
    // llegeixen amb la fórmula de l'analitzador (tests/vectors-cb-v3.js).
    const V3 = require('./vectors-cb-v3');

    suite('4a. Format v3: vectors fixos (els mateixos que a step-quiz/cb)');
    for (const [codi, esperat] of V3) {
        const r = m.llegeixCodiV3(codi);
        const nom = codi.slice(0, 24) + '…';
        ok(`${nom} es llegeix i la lletra quadra`, r !== null && r.valid === true);
        if (!r) continue;
        for (const k of [
            'curs',
            'mode',
            'questions',
            'any',
            'difMask',
            'sentMask',
            'empremta',
            'notaInt',
            'dd',
            'mm',
            'hh',
            'mn',
        ])
            eq(`${nom} ${k}`, r[k], esperat[k]);
        eq(
            `${nom} dificultats`,
            m
                .llistaDeMascara(r.difMask, m.DIFICULTATS_CB)
                .map(e => e.valor)
                .join(),
            esperat.dif.join()
        );
        eq(
            `${nom} sentits`,
            m
                .llistaDeMascara(r.sentMask, m.SENTITS_CB)
                .map(e => e.valor)
                .join(),
            esperat.sent.join()
        );
    }
    eq('les màscares de «totes» valen 7 i 31', [m.MASCARA_DIFICULTATS_TOTES, m.MASCARA_SENTITS_TOTS].join(), '7,31');
    eq('els bits de les dificultats són 1, 2, 4', m.DIFICULTATS_CB.map(e => e.bit).join(), '1,2,4');
    eq('els bits dels sentits són 1, 2, 4, 8, 16', m.SENTITS_CB.map(e => e.bit).join(), '1,2,4,8,16');
    eq('l\u2019empremta només usa 23 lletres seguides (A-W)', m.ALFABET_EMPREMTA, 'ABCDEFGHIJKLMNOPQRSTUVW');

    suite('4b. Format v3: canviar un sol caràcter del cos es detecta SEMPRE');
    {
        // alfabet permès a cada camp del cos (sense el codi d'exercici): curs, mode, QQ, AA, F, SS, EEEE, resultats
        const alfabets = {
            4: '0123',
            5: '12',
            6: '0123456789',
            7: '0123456789',
            8: '1234567',
            9: '0123456789',
            10: m.ALFABET_EMPREMTA,
            12: '01234',
        };
        let provats = 0,
            sensePerdre = 0;
        for (const [codi] of V3) {
            const p = codi.split('-');
            for (const [idx, alf] of Object.entries(alfabets)) {
                for (let i = 0; i < p[idx].length; i++) {
                    for (const c of alf) {
                        if (c === p[idx][i]) continue;
                        const q = [...p];
                        q[idx] = p[idx].slice(0, i) + c + p[idx].slice(i + 1);
                        const r = m.llegeixCodiV3(q.join('-'));
                        provats++;
                        if (r === null || r.valid === false) sensePerdre++;
                    }
                }
            }
        }
        ok(
            `${provats} canvis d'un sol caràcter (convocatòria, dificultats, sentits, empremta, resultats…), tots detectats`,
            provats > 1000 && sensePerdre === provats,
            `${provats - sensePerdre} no detectats`
        );
    }
    {
        // Els codis v3 no accepten la lletra antiga: només la nova
        const [codi] = V3[0];
        const r = m.llegeixCodiV3(codi);
        const antiga = m.lletraAntiga(r.notaInt, r.dd, r.mm, r.hh, r.mn, r.salt);
        if (antiga !== r.lletra)
            ok(
                'un codi v3 amb la lletra antiga (només nota i data) no és vàlid',
                m.llegeixCodiV3(antiga + codi.slice(1)).valid === false
            );
        else ok('(la lletra antiga coincideix amb la nova en aquest vector: es prova amb un altre)', true);
        ok(
            'un codi v3 amb la lletra d\u2019un altre vector no és vàlid',
            m.llegeixCodiV3(V3[1][0][0] + codi.slice(1)).valid === false
        );
    }

    suite('4c. Format v3: els codis mal formats es rebutgen');
    {
        const [codi] = V3[0];
        const p = codi.split('-');
        const amb = (idx, valor) => {
            const q = [...p];
            q[idx] = valor;
            return q.join('-');
        };
        eq('el v2 (9 segments) no és un v3', m.llegeixCodiV3(VECTORS[2][0]), null);
        eq('un segment de menys', m.llegeixCodiV3(p.slice(0, 12).join('-')), null);
        eq('un segment de més', m.llegeixCodiV3(codi + '-1'), null);
        eq('buit', m.llegeixCodiV3(''), null);
        eq('null', m.llegeixCodiV3(null), null);
        eq('text qualsevol', m.llegeixCodiV3('hola-que-tal'), null);
        const dolents = [
            ['empremta amb X, Y o Z (fora de A-W)', 10, 'GTGX'],
            ['empremta en minúscules', 10, 'gtgs'],
            ['empremta de 3 lletres', 10, 'GTG'],
            ['empremta amb una xifra', 10, 'GT5S'],
            ['sentits 00 (cap)', 9, '00'],
            ['sentits 32 (fora de 31)', 9, '32'],
            ['sentits d\u2019una sola xifra', 9, '3'],
            ['dificultats 0 (cap)', 8, '0'],
            ['dificultats 8 (fora de 7)', 8, '8'],
            ['convocatòria de 4 xifres', 7, '2025'],
            ['convocatòria amb lletres', 7, 'ab'],
            ['curs 4', 4, '4'],
            ['mode 0', 5, '0'],
            ['resultats amb un 5', 12, '5' + p[12].slice(1)],
            ['resultats massa curts (29)', 12, p[12].slice(1)],
            ['nota de 2 xifres', 11, '99'],
        ];
        for (const [nom, idx, valor] of dolents) eq(nom, m.llegeixCodiV3(amb(idx, valor)), null);
        ok('el codi correcte, amb espais al voltant, es llegeix', m.llegeixCodiV3(`  ${codi}\n`) !== null);
    }

    finish('Lletra de control dels codis');
})();
