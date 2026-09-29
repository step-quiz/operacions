/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/fixed-sessions.test.js
 * ROL: Tests de js/fixed-sessions.js (sessions fixes ?fixed=A/B/C).
 *   - La mateixa etiqueta de pregunta dona sempre la mateixa seqüència,
 *     encara que abans s'hagin gastat números aleatoris (clics, errors…).
 *   - Etiquetes, lletres o activitats diferents donen seqüències diferents.
 *   - wrap('buildLevel') torna a sembrar a cada crida.
 *   - Sense ?fixed= no es toca Math.random.
 * ÚS: node tests/fixed-sessions.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, suite, ok, eq, finish } = require('./harness');

const SRC = fs.readFileSync(path.join(ROOT, 'js/fixed-sessions.js'), 'utf8');

/** Carrega fixed-sessions.js en un context nou, com si fos la pàgina `page`. */
function page(search, pathname = '/enters.html') {
    const ctx = {
        console,
        URLSearchParams,
        location: { search, pathname },
        history: {
            replaceState(_s, _t, url) {
                ctx.location.search = url;
            },
        },
        addEventListener() {},
    };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(SRC, ctx, { filename: 'fixed-sessions.js' });
    return ctx;
}
const draw = (w, n = 8) => Array.from({ length: n }, () => vm.runInContext('Math.random()', w));

suite('Sense ?fixed=');
{
    const w = page('');
    eq('no es crea FixedSessions', typeof w.FixedSessions, 'undefined');
    ok('Math.random continua sent el del navegador', vm.runInContext('Math.random.name', w) !== 'mulberry32');
}

suite('Llavor per pregunta');
{
    const w = page('?fixed=A');
    ok('es crea FixedSessions', typeof w.FixedSessions === 'object');
    eq(
        "els paràmetres per defecte s'afegeixen a la URL",
        /totaloperations=5/.test(w.location.search) && /totalsessions=1/.test(w.location.search),
        true
    );

    w.FixedSessions.seed('s0-q3');
    const a = draw(w);
    draw(w, 37); // "l'alumne" gasta números aleatoris
    w.FixedSessions.seed('s0-q3');
    const b = draw(w);
    eq('mateixa etiqueta → mateixa seqüència, passi el que passi abans', JSON.stringify(a), JSON.stringify(b));

    w.FixedSessions.seed('s0-q4');
    const c = draw(w);
    ok('etiqueta diferent → seqüència diferent', JSON.stringify(a) !== JSON.stringify(c));
    ok(
        'els valors són a [0, 1)',
        [...a, ...c].every(x => x >= 0 && x < 1)
    );

    const w2 = page('?fixed=A'); // un altre alumne
    draw(w2, 5);
    w2.FixedSessions.seed('s0-q3');
    eq('un altre alumne amb la mateixa lletra rep la mateixa pregunta', JSON.stringify(draw(w2)), JSON.stringify(a));

    const wB = page('?fixed=B');
    wB.FixedSessions.seed('s0-q3');
    ok('lletra B → preguntes diferents de la A', JSON.stringify(draw(wB)) !== JSON.stringify(a));

    const wOther = page('?fixed=A', '/fraccions.html');
    wOther.FixedSessions.seed('s0-q3');
    ok('una altra activitat → seqüència diferent', JSON.stringify(draw(wOther)) !== JSON.stringify(a));
}

suite('next(tipus): comptador per a pàgines sense número de pregunta');
{
    const w = page('?fixed=C', '/complexos.html');
    w.FixedSessions.next('SR');
    const e1 = draw(w);
    w.FixedSessions.next('SR');
    const e2 = draw(w);
    ok('dues crides seguides → exercicis diferents', JSON.stringify(e1) !== JSON.stringify(e2));
    const w2 = page('?fixed=C', '/complexos.html');
    w2.FixedSessions.next('DV');
    draw(w2, 20); // un altre tipus no afecta el comptador de 'SR'
    w2.FixedSessions.next('SR');
    const f1 = draw(w2);
    eq('el comptador és independent per a cada tipus', JSON.stringify(f1), JSON.stringify(e1));
}

suite('wrap(): embolcallar buildLevel');
{
    const w = page('?fixed=A');
    vm.runInContext(
        `
        var currentOperation = 0, generated = [];
        function buildLevel() { generated.push(Math.random()); }
    `,
        w
    );
    ok(
        'wrap retorna true',
        w.FixedSessions.wrap('buildLevel', () => `q${vm.runInContext('currentOperation', w)}`)
    );
    ok('no embolcalla dues vegades', w.FixedSessions.wrap('buildLevel', () => 'x') === false);
    vm.runInContext('buildLevel(); Math.random(); Math.random(); buildLevel(); currentOperation++; buildLevel();', w);
    const g = vm.runInContext('generated', w);
    eq('la mateixa pregunta es regenera igual', g[0], g[1]);
    ok('la pregunta següent és diferent', g[2] !== g[0]);
}

finish('TESTS DE LES SESSIONS FIXES');
