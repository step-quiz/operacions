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

    finish('Lletra de control dels codis');
})();
