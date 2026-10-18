/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/esvaiment.test.js
 * ROL: Tests del mode «Esvaïment» (?esvaiment=1): el motor de nivells
 *      (js/esvaiment.js) i els passos de cada exercici que l'admet.
 * ARQUITECTURA:
 * - El motor de nivells es prova amb casos fets a mà (pujar, baixar, terra a 0,
 *   exercicis de llargades diferents) i amb URL estranyes.
 * - Els passos de cada exercici es comproven sobre milers d'exercicis generats
 *   amb llavor, i el resultat final es recalcula de manera INDEPENDENT del motor
 *   (sense fer servir el codi que es prova).
 * ÚS: node tests/esvaiment.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish, loadModule } = require('./harness');

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Motor de nivells (js/esvaiment.js): paràmetres de la URL');
{
    const w = loadModule(['js/esvaiment.js']);
    const { Esvaiment, SUPORTA_ESVAIMENT } = w;
    const L = (s, p = 'prioritat') => Esvaiment.llegeixParametres(s, p);
    ok('SUPORTA_ESVAIMENT inclou prioritat', SUPORTA_ESVAIMENT.includes('prioritat'));
    eq('?esvaiment=1 → actiu', L('?esvaiment=1').actiu, true);
    eq('sense paràmetre → no actiu', L('').actiu, false);
    eq('?esvaiment=0 → no actiu', L('?esvaiment=0').actiu, false);
    eq('?esvaiment=sí → no actiu', L('?esvaiment=s%C3%AD').actiu, false);
    eq('pàgina que no l’admet → no actiu', L('?esvaiment=1', 'enters').actiu, false);
    eq('inici per defecte 0', L('?esvaiment=1').inici, 0);
    eq('?inici=3 → 3', L('?esvaiment=1&inici=3').inici, 3);
    eq('?inici=-1 → 0', L('?esvaiment=1&inici=-1').inici, 0);
    eq('?inici=2.5 → 0', L('?esvaiment=1&inici=2.5').inici, 0);
    eq('?inici=abc → 0', L('?esvaiment=1&inici=abc').inici, 0);
    eq('?inici=99 → 0 (fora de rang)', L('?esvaiment=1&inici=99').inici, 0);
    eq('URL buida o null no peta', L(null).actiu, false);
    eq('URL plena de soroll no peta', L('?%%%&&=&esvaiment').actiu, false);
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Motor de nivells: pujar, baixar i retallar');
{
    const { Esvaiment } = loadModule(['js/esvaiment.js']);
    const S = (k, encertsSeguits = 0) => ({ k, encertsSeguits });
    const D = (st, senseErrors, nPassos = 5) => Esvaiment.despresItem(st, { senseErrors, nPassos });

    eq('inicial() → k 0', Esvaiment.inicial().k, 0);
    eq('inicial(3) → k 3', Esvaiment.inicial(3).k, 3);
    eq('inicial(-2) → k 0', Esvaiment.inicial(-2).k, 0);
    eq('1 exercici sense errors: encara no puja', D(S(1), true).k, 1);
    eq('1 exercici sense errors: compta 1 seguit', D(S(1), true).encertsSeguits, 1);
    eq('2 seguits sense errors: puja', D(D(S(1), true), true).k, 2);
    eq('en pujar, el comptador torna a 0', D(D(S(1), true), true).encertsSeguits, 0);
    eq('un error: baixa un nivell', D(S(3, 1), false).k, 2);
    eq('un error: el comptador torna a 0', D(S(3, 1), false).encertsSeguits, 0);
    eq('mai per sota de 0', D(S(0), false).k, 0);
    eq('encert, error, encert: no puja', D(D(D(S(2), true), false), true).k, 1);
    // Retall: k no pot créixer sense límit per sobre de la llargada dels exercicis
    eq('k 9 en un exercici de 3 passos, error → 2', D(S(9), false, 3).k, 2);
    eq('k 9 en un exercici de 3 passos, 2 encerts → 4', D(D(S(9), true, 3), true, 3).k, 4);
    eq('passosAlumne retalla a nPassos', Esvaiment.passosAlumne(S(7), 4), 4);
    eq('passosAlumne amb k 0 → 0', Esvaiment.passosAlumne(S(0), 4), 0);
    const st = S(2, 1);
    D(st, true);
    eq("despresItem no modifica l'estat d'entrada", JSON.stringify(st), JSON.stringify(S(2, 1)));

    // Una sessió sencera
    const s = Esvaiment.creaSessio(0);
    const r1 = s.acabaItem({ senseErrors: true, nPassos: 4 });
    const r2 = s.acabaItem({ senseErrors: true, nPassos: 4 });
    eq('sessió: dos exemples sencers → k 1', s.k, 1);
    ok('sessió: el segon exemple diu que puja', !r1.pujat && r2.pujat);
    const r3 = s.acabaItem({ senseErrors: false, nPassos: 4 });
    ok('sessió: un error diu que baixa', r3.baixat && s.k === 0);
    eq('sessió: 2 estrelles de 3', s.estrelles(), 2);
    eq('sessió: el registre té 3 exercicis', s.registre.length, 3);
    const t = Esvaiment.creaSessio(3);
    ok('sessió: tot sol si fa tots els passos sense errors', t.acabaItem({ senseErrors: true, nPassos: 3 }).totSol);
    ok('sessió: no és «tot sol» amb errors', !t.acabaItem({ senseErrors: false, nPassos: 3 }).totSol);
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. La sessió de la pàgina (ESVAIMENT)');
{
    const on = loadModule(['js/esvaiment.js'], { search: '?esvaiment=1&inici=2', pathname: '/prioritat.html' });
    ok('prioritat.html?esvaiment=1 → sessió activa', on.ESVAIMENT !== null);
    eq('?inici=2 → k 2', on.ESVAIMENT && on.ESVAIMENT.k, 2);
    const off = loadModule(['js/esvaiment.js'], { search: '', pathname: '/prioritat.html' });
    eq('sense ?esvaiment=1 → null', off.ESVAIMENT, null);
    const altra = loadModule(['js/esvaiment.js'], { search: '?esvaiment=1', pathname: '/enters.html' });
    eq('pàgina que no l’admet → null', altra.ESVAIMENT, null);
}

// ─────────────────────────────────────────────────────────────────────────────
suite('4. Prioritat: passos de l’esvaïment (MathEngine.passosEsvaiment)');
{
    const w = loadModule(
        ['js/utils.js', 'js/prioritat/math-engine.js', 'js/prioritat/strings.js', 'js/prioritat/renderer.js'],
        { seed: 777 }
    );
    const { MathEngine: M, Strings: S, Renderer: R } = w;

    // Avaluació INDEPENDENT: l'expressió escrita en JavaScript
    const JS_OP = { '+': '+', '-': '-', '·': '*', ':': '/' };
    const jsVal = toks =>
        Function(
            `return (${toks
                .map(t =>
                    t.k === 'num'
                        ? `(${t.v})`
                        : t.k === 'op'
                          ? JS_OP[t.v]
                          : t.k === 'pow'
                            ? `(${t.b}**${t.e})`
                            : t.k === 'lp'
                              ? '('
                              : ')'
                )
                .join(' ')});`
        )();
    // Profunditat de parèntesis a la posició i (també independent)
    const dins = (line, i) => line.slice(0, i).reduce((d, t) => d + (t.k === 'lp') - (t.k === 'rp'), 0) > 0;

    const err = [];
    let n = 0;
    for (let level = 0; level < M.LEVELS.length; level++) {
        for (let rep = 0; rep < 100; rep++) {
            const ex = M.generateExercise(level);
            const passos = M.passosEsvaiment(ex.toks);
            n++;
            const nOps = ex.toks.filter(t => t.k === 'op' || t.k === 'pow').length;
            if (passos.length !== nOps)
                err.push(`${S.toText(ex.toks)}: ${passos.length} passos per ${nOps} operacions`);
            // Aplicar els passos l'un rere l'altre arriba al resultat, i cada pas parteix de la línia anterior
            let line = M.startLine(ex.toks);
            passos.forEach((p, j) => {
                if (JSON.stringify(p.line) !== JSON.stringify(line))
                    err.push(`${S.toText(ex.toks)}: el pas ${j + 1} no parteix de la línia anterior`);
                if (p.resposta !== M.opValue(line, p.op)) err.push(`${S.toText(ex.toks)}: resposta del pas ${j + 1}`);
                if (!['par', 'pow', 'prio', 'lr', 'sola'].includes(p.motiu)) err.push(`motiu desconegut ${p.motiu}`);
                if ((p.motiu === 'par') !== dins(line, p.op))
                    err.push(`${S.toText(line)}: motiu ${p.motiu} i parèntesi`);
                const txt = S.exemplePas(p);
                if (/undefined|NaN|null/.test(txt)) err.push(`text: ${txt}`);
                line = M.applyAt(line, p.op);
            });
            if (!M.isDone(line)) err.push(`${S.toText(ex.toks)}: els passos no acaben en un nombre`);
            else if (line[0].v !== jsVal(ex.toks)) err.push(`${S.toText(ex.toks)}: ${line[0].v} ≠ ${jsVal(ex.toks)}`);
            if (
                passos.length &&
                passos[passos.length - 1].motiu !== 'sola' &&
                !dins(passos[passos.length - 1].line, passos[passos.length - 1].op)
            )
                err.push(`${S.toText(ex.toks)}: l'últim pas hauria de ser l'única operació`);
        }
    }
    ok(
        `${n} expressions: els passos reprodueixen el resultat (recalculat a part) i els textos són complets`,
        !err.length,
        err.slice(0, 5).join(' · ')
    );

    // Renderitzat: sense marca, la taula és la de sempre; amb marca, porta la nota
    const ex = M.generateExercise(5);
    const rows = M.solve(M.startLine(ex.toks));
    const plana = R.tableHtml(rows);
    ok('sense marca: cap nota ni classe nova', !/nota-pas|ajuda|exemple/.test(plana));
    const marcades = rows.map((r, j) => (j === 0 ? r : Object.assign({}, r, { marca: j === 1 ? 'exemple' : 'ajuda' })));
    const html = R.tableHtml(marcades);
    ok(
        'marca «exemple»: línia en gris amb la nota',
        /<tr class="auto exemple">/.test(html) && html.includes(S.Esv.notaExemple)
    );
    ok(
        'marca «ajuda»: línia amb la nota «amb ajuda»',
        /<tr class="ajuda">/.test(html) && html.includes(S.Esv.notaAjuda)
    );
    const treball = R.tableHtml(marcades, { active: true });
    const ultima = treball.split('<tr').pop();
    ok('la línia de treball no porta la marca', !/nota-pas|ajuda/.test(ultima));
}

finish('TESTS DE L’ESVAÏMENT');
