/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/formules-steam.test.js
 * ROL: Tests de «Fórmules STEAM» (js/formules-steam/: algebra.js, cataleg.js,
 *      math-engine.js, errors.js).
 * ARQUITECTURA:
 * - Una lectura pròpia del text que veu l'alumne («v · Δt = 120», «½ · m · v²»,
 *   «√(2 · Ec / m) = v», «(v − v₀) / t = a») el converteix en una funció i el calcula.
 * - 1. Per a cada fórmula i cada lletra que s'aïlla, centenars de preguntes: els valors
 *   compleixen la fórmula; cada equació bona (les dades, cada pas amb nombres, cada pas
 *   amb lletres) es compleix amb aquests valors i cap opció dolenta no es compleix (no
 *   n'hi ha cap que també sigui bona); l'última equació té la lletra sola; el valor és el
 *   de la dada i hi cap; la unitat és la del context; les operacions coincideixen amb
 *   nombres i amb lletres; cada opció dolenta té el seu error, i el diagnòstic el
 *   reconeix; KaTeX dibuixa totes les fórmules.
 *   El pas de les dades: cada casella és una dada (amb la seva unitat) i la solució n'és la lletra.
 *   Les opcions i les consignes amb fórmules ($…$) i les línies amb color (el que passa a l'altre
 *   membre) també les dibuixa KaTeX; els passos amb lletres són els opcionals.
 * - 2. Els nivells (1-4) i les decisions del David: sempre un context; el problema (context amb les
 *   dades en negreta i pregunta) i la fórmula amb la llegenda en targetes separades; enlloc no hi
 *   diu de quina matèria són les fórmules; sense codi.
 * ÚS: node tests/formules-steam.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');

const w = loadModule(
    [
        'js/utils.js',
        'js/algebra/racionals.js',
        'js/passos/correccio.js',
        'js/formules-steam/algebra.js',
        'js/formules-steam/cataleg.js',
        'js/formules-steam/strings.js',
        'js/formules-steam/math-engine.js',
        'js/formules-steam/errors.js',
    ],
    { seed: 20261117 }
);
const { CASOS_FS, ERRORS_FS, corregeixPas, diagnosticaFS, generaPreguntaFS } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const BAD = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b/;
// Ni errors ni trossos en vermell (una ordre que KaTeX no admet en aquell mode surt en #cc0000)
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));
const num = v => (Array.isArray(v) ? v[0] / v[1] : v);

/** Converteix el text d'una equació en dues funcions dels valors: [esquerra, dreta]. */
function llegeixText(text, noms) {
    const ordenats = [...noms].sort((a, b) => b.length - a.length);
    const id = n => `L${ordenats.indexOf(n)}`;
    const js = costat => {
        let s = costat.trim();
        // les lletres, per un identificador; després, els símbols
        let out = '';
        for (let i = 0; i < s.length;) {
            const nom = ordenats.find(n => s.startsWith(n, i));
            if (nom) {
                out += ` ${id(nom)} `;
                i += nom.length;
            } else out += s[i++];
        }
        out = out
            .replace(/½ ·/g, '0.5 *')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/√\s*(L\d+|\d+(?:,\d+)?)/g, 'Math.sqrt($1)')
            .replace(/(\d),(\d)/g, '$1.$2')
            .replace(/·/g, '*')
            .replace(/−/g, '-')
            .replace(/²/g, '**2');
        if (!/^[\sL\d.+\-*/()Mathsqr]*$/.test(out)) throw new Error(`no s'entén «${costat}» → ${out}`);
        return new Function(...ordenats.map(id), `return (${out});`);
    };
    const [a, b] = text.split(' = ');
    if (b === undefined) throw new Error(`sense «=»: ${text}`);
    return [js(a), js(b), ordenats];
}
function compleix(text, noms, valors) {
    const [a, b, ordenats] = llegeixText(text, noms);
    const args = ordenats.map(n => num(valors[n]));
    const [x, y] = [a(...args), b(...args)];
    return Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y));
}

suite('1. Totes les fórmules i totes les lletres');
{
    const dolents = {
        valors: [],
        bones: [],
        dolentes: [],
        final: [],
        valor: [],
        unitat: [],
        ops: [],
        errors: [],
        katex: [],
        text: [],
    };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const vistos = new Set();
    let preguntes = 0;
    for (const cas of CASOS_FS)
        for (let k = 0; k < 120; k++) {
            preguntes++;
            const q = generaPreguntaFS(cas.nivell, cas);
            const noms = Object.keys(cas.f.lletres);
            const { valors, incognita: x } = q.dades;
            const on = `${q.text} (${noms.map(n => `${n}=${num(valors[n])}`).join(', ')})`;
            if (
                !compleix(
                    cas.f.eq
                        .replace(/\*/g, ' · ')
                        .replace(/-/g, '−')
                        .replace(/\^2/g, '²')
                        .replace(/(\w+(?:[₀₁₂]|\b)?) · (\w+)²\/2/, '½ · $1 · $2²')
                        .replace(/\//g, ' / '),
                    noms,
                    valors
                )
            )
                anota(dolents.valors, `${on}: els valors no compleixen ${cas.f.eq}`);
            const ids = q.passos.map(p => p.mena);
            const nOps = ids.filter(m => m === 'operacio').length;
            if (ids.filter(m => m === 'lletres').length !== nOps || nOps < 1)
                anota(dolents.ops, `${on}: ${ids.join(',')}`);
            for (const pas of q.passos) {
                if (pas.camps.tria) {
                    const bona = pas.opcions.find(o => o[0] === pas.solucio.tria)[1];
                    if (['substitucio', 'equacio', 'lletres'].includes(pas.mena)) {
                        try {
                            if (!compleix(bona, noms, valors))
                                anota(dolents.bones, `${on}, ${pas.id}: «${bona}» no es compleix`);
                            for (const [v, t] of pas.opcions)
                                if (v !== pas.solucio.tria && compleix(t, noms, valors))
                                    anota(dolents.dolentes, `${on}, ${pas.id}: «${t}» també es compleix`);
                        } catch (e) {
                            anota(dolents.bones, `${on}, ${pas.id}: ${e.message}`);
                        }
                    }
                    if (pas.mena === 'unitat' && bona !== cas.f.aillar[x].unitats[x][0])
                        anota(dolents.unitat, `${on}: ${bona}`);
                    const textos = pas.opcions.map(o => o[1]);
                    if (pas.opcions.length < 2 || new Set(textos).size !== textos.length || pas.literal !== true)
                        anota(dolents.errors, `${on}, ${pas.id}: opcions ${textos.join(' | ')}`);
                }
                // La bona s'accepta; cada distractor té el seu error i el diagnòstic el reconeix
                if (pas.mena === 'dades') {
                    // Cada casella porta el títol de la seva dada i la solució és la lletra d'aquesta dada
                    pas.plantilla.forEach((g, i) => {
                        const lletra = noms.find(k => `l${noms.indexOf(k)}` === pas.solucio[`c${i}`]);
                        if (!lletra || !g.titol.startsWith(w.textDecimal(valors[lletra])))
                            anota(dolents.errors, `${on}: la casella «${g.titol}» no és de ${lletra}`);
                    });
                    if (corregeixPas(pas, { ...pas.solucio }).estat !== 'ok')
                        anota(dolents.errors, `${on}, dades: la bona no s'accepta`);
                    const [c0, dist] = Object.entries(pas.dades.distractors)[0];
                    for (const [v, codi] of dist) {
                        vistos.add(codi);
                        const c = corregeixPas(pas, { ...pas.solucio, [c0]: v });
                        const d = diagnosticaFS(pas, c.valors);
                        if (c.estat !== 'error' || !d || d.errorType !== codi)
                            anota(dolents.errors, `${on}, dades: ${v} → ${c.estat}`);
                    }
                    continue;
                }
                for (const o of pas.opcions || [])
                    if (o[3] && preguntes % 3 === 0)
                        for (const f of o[3].split('$').filter((_, i) => i % 2))
                            if (!katexOk(f)) anota(dolents.katex, `${on}, ${pas.id}: ${f}`);
                for (const t of [pas.liniaMarcada, pas.marcaAnterior].filter(Boolean))
                    if (preguntes % 3 === 0 && !katexOk(t)) anota(dolents.katex, `${on}, ${pas.id}: ${t}`);
                const resp = pas.camps.r
                    ? { r: { v: w.textDecimal(pas.solucio.r), p: '' } }
                    : { tria: pas.solucio.tria };
                if (corregeixPas(pas, resp).estat !== 'ok')
                    anota(dolents.errors, `${on}, ${pas.id}: la bona no s'accepta`);
                for (const [v, codi] of pas.dades.distractors[pas.camps.r ? 'r' : 'tria']) {
                    vistos.add(codi);
                    const c = corregeixPas(pas, pas.camps.r ? { r: { v: w.textDecimal(v), p: '' } } : { tria: v });
                    const d = diagnosticaFS(pas, c.valors);
                    if (c.estat !== 'error' || !ERRORS_FS[codi] || !d || d.errorType !== codi)
                        anota(
                            dolents.errors,
                            `${on}, ${pas.id}: ${JSON.stringify(v)} → ${c.estat} ${d && d.errorType} (${codi})`
                        );
                }
                if (pas.mena === 'valor') {
                    const camp = pas.plantilla.find(t => t.camp === 'r');
                    if (num(pas.solucio.r) !== num(valors[x]) || w.textDecimal(pas.solucio.r).length > camp.llarg)
                        anota(dolents.valor, `${on}: ${JSON.stringify(pas.solucio.r)}`);
                }
                for (const t of [pas.linia, ...pas.plantilla.filter(p => p.tex).map(p => p.tex)])
                    if (preguntes % 3 === 0 && !katexOk(t)) anota(dolents.katex, `${on}, ${pas.id}: ${t}`);
                const tots = [pas.enunciat, pas.linia, ...(pas.opcions || []).map(o => o[1])].join(' ');
                if (BAD.test(tots)) anota(dolents.text, `${on}, ${pas.id}`);
            }
            // L'última equació amb lletres té la lletra sola (girada, si cal: la línia ho escriu)
            const ultim = q.passos[q.passos.length - 1];
            const textUltim = ultim.opcions.find(o => o[0] === ultim.solucio.tria)[1];
            const [ae, be] = textUltim.split(' = ');
            if (ae !== x && be !== x) anota(dolents.final, `${on}: «${textUltim}»`);
            if (be === x && !/aligned/.test(ultim.linia)) anota(dolents.final, `${on}: no es gira`);
            if (!katexOk(q.formula.tex) || BAD.test(JSON.stringify(q.problema) + q.text))
                anota(dolents.katex, `${on}: pregunta`);
            // Els passos opcionals són exactament els de lletres
            if (
                q.passos.findIndex(p => p.mena === 'lletres') !== q.opcional.desDe ||
                !katexOk(q.opcional.resum) ||
                JSON.stringify(q.opcional.punts) !== JSON.stringify({ maxAbans: 8, despres: [2, 1] })
            )
                anota(dolents.ops, `${on}: opcionals des de ${q.opcional.desDe}`);
        }
    const msg = l => l.join('\n      → ');
    ok(`${preguntes} preguntes: els valors compleixen la fórmula`, !dolents.valors.length, msg(dolents.valors));
    ok('cada equació bona es compleix amb els valors', !dolents.bones.length, msg(dolents.bones));
    ok(
        'cap opció dolenta no es compleix (no n’hi ha cap que també sigui bona)',
        !dolents.dolentes.length,
        msg(dolents.dolentes)
    );
    ok('l’última equació té la lletra sola (i es gira si cal)', !dolents.final.length, msg(dolents.final));
    ok('el valor és el de la dada i hi cap', !dolents.valor.length, msg(dolents.valor));
    ok('la unitat és la del context', !dolents.unitat.length, msg(dolents.unitat));
    ok('tantes operacions amb nombres com amb lletres', !dolents.ops.length, msg(dolents.ops));
    ok(
        'opcions diferents i literals; la bona s’accepta; cada error es reconeix',
        !dolents.errors.length,
        msg(dolents.errors)
    );
    ok('KaTeX dibuixa les fórmules', !dolents.katex.length, msg(dolents.katex));
    ok('cap text estrany', !dolents.text.length, msg(dolents.text));
    eq('surten tots els errors', [...vistos].sort().join(' '), Object.keys(ERRORS_FS).sort().join(' '));
}

suite('2. Nivells i decisions del David');
{
    const perNivell = n => CASOS_FS.filter(c => c.nivell === n).map(c => `${c.f.id}:${c.x}`);
    ok(
        `hi ha casos dels quatre nivells (${[1, 2, 3, 4].map(n => perNivell(n).length).join(', ')})`,
        [1, 2, 3, 4].every(n => perNivell(n).length >= 3)
    );
    ok(
        'la lletra al denominador és del nivell 3',
        ['velocitat:Δt', 'densitat:V', 'pressio:S'].every(c => perNivell(3).includes(c))
    );
    ok(
        'les arrels i les fórmules llargues, del nivell 4',
        ['cinetica:v', 'posicio:a', 'paralel:R'].every(c => perNivell(4).includes(c))
    );
    const q = generaPreguntaFS(1);
    const senseNegreta = [];
    for (const cas of CASOS_FS) {
        const qc = generaPreguntaFS(cas.nivell, cas);
        const dades = Object.keys(cas.f.lletres).length - 1;
        if (
            !qc.problema.context ||
            !/\?$/.test(qc.problema.pregunta) ||
            ((qc.problema.context + qc.problema.pregunta).match(/\*\*[^*]+\*\*/g) || []).length !== dades ||
            qc.formula.llegenda.length !== dades + 1
        )
            senseNegreta.push(`${cas.f.id}:${cas.x} «${qc.problema.context}» «${qc.problema.pregunta}»`);
    }
    ok(
        'sempre un context: problema (dades en negreta, pregunta a part) i fórmula amb la llegenda',
        !senseNegreta.length && q.formula.nom && q.tex === '',
        senseNegreta.slice(0, 5).join('\n      → ')
    );
    const fitxers = [
        'formules-steam.html',
        ...fs.readdirSync(path.join(ROOT, 'js/formules-steam')).map(f => `js/formules-steam/${f}`),
    ];
    const materia = fitxers.filter(f =>
        /F[íi]sica i [Qq]u[íi]mica|Tecnologia/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))
    );
    ok('enlloc no diu de quina matèria són les fórmules', !materia.length, materia.join(', '));
    ok(
        'la pàgina no dona codi (senseCodi)',
        /senseCodi:\s*true/.test(fs.readFileSync(path.join(ROOT, 'formules-steam.html'), 'utf8'))
    );
}

suite('3. Resolució pas a pas (resolucio.html): la pissarra de cada fórmula');
{
    const { provaActivitat } = require('./pissarra-activitat');
    const p = loadModule(
        [
            'js/utils.js',
            'js/algebra/racionals.js',
            'js/formules-steam/algebra.js',
            'js/formules-steam/cataleg.js',
            'js/formules-steam/strings.js',
            'js/formules-steam/math-engine.js',
            'js/pissarra/formules.js',
            'js/pissarra/comprova.js',
            'js/formules-steam/resolucio.js',
        ],
        { seed: 20261118 }
    );
    const { Resolucio, textPla, FORMULES, coeficient } = p;
    const formula = ex => FORMULES.find(f => f.id === ex.formula);

    /**
     * El model independent: calcula el text pla d'un costat d'una fila (textPla: «((2*Ec)/(m))», «sqrt(…)»,
     * «t^(2)», «2,5») amb els valors de les lletres (vars: nom en text pla → nombre).
     */
    function calcula(s, vars) {
        const noms = Object.keys(vars).sort((a, b) => b.length - a.length);
        let i = 0;
        const err = () => new Error(`no s’entén «${s}» (a la posició ${i})`);
        const mira = t => s.startsWith(t, i) && ((i += t.length), true);
        function primari() {
            if (mira('sqrt(') || mira('(')) {
                const arrel = s[i - 2] === 't';
                const v = expr();
                if (!mira(')')) throw err();
                return arrel ? Math.sqrt(v) : v;
            }
            const m = /^\d+(,\d+)?/.exec(s.slice(i));
            if (m) {
                i += m[0].length;
                return Number(m[0].replace(',', '.'));
            }
            const nom = noms.find(n => s.startsWith(n, i));
            if (!nom) throw err();
            i += nom.length;
            return vars[nom];
        }
        function potencia() {
            const b = primari();
            if (!mira('^(')) return b;
            const e = expr();
            if (!mira(')')) throw err();
            return b ** e;
        }
        function unari() {
            return mira('-') ? -unari() : potencia();
        }
        function terme() {
            let v = unari();
            for (;;)
                if (mira('*')) v *= unari();
                else if (mira('/')) v /= unari();
                else return v;
        }
        function expr() {
            let v = terme();
            for (;;)
                if (mira('+')) v += terme();
                else if (mira('-')) v -= terme();
                else return v;
        }
        const v = expr();
        if (i !== s.length) throw err();
        return v;
    }
    const SENSE = '(sense unitats)';
    /** El que cal saber d'un exercici per comprovar-ne les files: les lletres en text pla i la unitat. */
    function model(ex) {
        const f = formula(ex);
        const vars = Object.fromEntries(Object.entries(f.lletres).map(([n, [t]]) => [textPla(t), num(ex.valors[n])]));
        const [uText, uTex] = f.aillar[ex.x].unitats[ex.x];
        return { vars, unitat: uText === SENSE ? '' : textPla(uTex), senseUnitats: uText === SENSE };
    }
    /** '' si la fila (TeX amb claus) és certa per a l'exercici, o què falla. */
    function veritat(fila, ex, m) {
        const pla = textPla(fila);
        if (pla.startsWith('«unitatde»')) {
            const fi = `=${m.senseUnitats ? '«senseunitats»' : m.unitat}`;
            return pla.endsWith(fi) ? '' : `${pla}: no acaba amb «${fi}»`;
        }
        const costats = pla.split('=');
        if (costats.length !== 2) return `${pla}: no és una igualtat`;
        let [a, b] = costats;
        // el resultat amb la unitat: «Δt=3«h»»
        if (m.unitat && b.endsWith(m.unitat) && /^[\d,]+$/.test(b.slice(0, -m.unitat.length)))
            b = b.slice(0, -m.unitat.length);
        try {
            const [A, B] = [calcula(a, m.vars), calcula(b, m.vars)];
            return Math.abs(A - B) <= 1e-9 * Math.max(1, Math.abs(A), Math.abs(B)) ? '' : `${pla}: ${A} ≠ ${B}`;
        } catch (e) {
            return `${pla}: ${e.message}`;
        }
    }

    const PLURAL = /\b(fem|tenim|sumem|restem|dividim|multipliquem|aïllem|escrivim|girem|substituïm|calculem)\b/i;
    const dolents = { katex: [], plurals: [], context: [], final: [], resultat: [], mateixes: [], nivell: [] };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const senseUnitats = new Set();
    const revisa = (passos, ex, on) => {
        const formules = new Set();
        for (const pas of passos) {
            pas.files.filter(Boolean).forEach(fila => formules.add(fila));
            for (const m of pas.text.matchAll(/\$([^$]+)\$/g)) formules.add(m[1]);
            // el context del problema és el de l'activitat («fem un treball…»): només es miren les instruccions
            const instruccio = pas.text.replace(/^[^]*\? (?=Aïlla)/, '');
            if (PLURAL.test(instruccio)) anota(dolents.plurals, `${on}: «${instruccio}»`);
        }
        for (const t of formules)
            if (!katexOk(t.replace(/\\htmlData\{[^}]*\}/g, ''))) anota(dolents.katex, `${on}: ${t}`);
    };
    function* exercicis() {
        for (const cas of Resolucio.CASOS)
            for (let k = 0; k < 30; k++) {
                const ex = Resolucio.exercici(cas.nivell, cas);
                const on = `${cas.f.id}, aïllar ${cas.x} (${Object.values(ex.valors).map(num).join(', ')})`;
                const passos = Resolucio.passos(ex);
                const m = model(ex);
                if (k < 3) revisa(passos, ex, on);
                // Sempre un context: la primera frase és el problema (acaba amb una pregunta)
                if (!/\? Aïlla \$/.test(passos[0].text)) anota(dolents.context, `${on}: «${passos[0].text}»`);
                const ultim = passos[passos.length - 1];
                // (l'última fila escrita: les del final de la pissarra són per als detalls, i en aquesta vista són buides)
                const darrera = ultim.files.map(Boolean).lastIndexOf(true);
                if (!ultim.classes[darrera].includes('final')) anota(dolents.final, on);
                // El resultat amb la unitat, ressaltat
                const files = ultim.files.map(f => (f ? textPla(f) : ''));
                const xPla = textPla(formula(ex).lletres[ex.x][0]);
                const r = files.findIndex(f => f === `${xPla}=${textDecimal(ex.valors[ex.x])}${m.unitat}`);
                if (r < 0 || !ultim.classes[r].includes('final'))
                    anota(dolents.resultat, `${on}: ${files.join(' | ')}`);
                if (!files.some(f => f.startsWith('«unitatde»'))) senseUnitats.add(`${cas.f.id}:${cas.x}`);
                // Les mateixes operacions amb nombres i amb lletres
                const tipus = Resolucio.etapes(ex).map(e => e.tipus);
                const ambNombres = tipus.slice(tipus.indexOf('dades') + 1, tipus.indexOf('valor'));
                const ambLletres = tipus.slice(tipus.indexOf('lletres') + 1);
                if (ambNombres.join() !== ambLletres.join())
                    anota(dolents.mateixes, `${on}: ${ambNombres.join()} ≠ ${ambLletres.join()}`);
                yield { on, passos, vista: o => Resolucio.passos(ex, o), files: Resolucio.files(ex), m };
            }
    }
    const { textDecimal } = p;
    provaActivitat('fórmules STEAM', {
        exercicis: exercicis(),
        eines: p,
        text: true,
        veritat: (fila, ex) => veritat(fila, ex, ex.m),
        maxPeces: 8,
        minExercicis: Resolucio.CASOS.length * 30,
    });
    const llista = l => l.join('\n      → ');
    ok('KaTeX dibuixa totes les files i les fórmules de les frases', !dolents.katex.length, llista(dolents.katex));
    ok('les frases són en segona persona', !dolents.plurals.length, llista(dolents.plurals));
    ok('sempre un context: la primera frase és el problema', !dolents.context.length, llista(dolents.context));
    ok('l’última línia (la fórmula aïllada) és ressaltada', !dolents.final.length, llista(dolents.final));
    ok('el resultat amb la unitat hi és, ressaltat', !dolents.resultat.length, llista(dolents.resultat));
    ok(
        'amb lletres es fan les mateixes operacions que amb nombres',
        !dolents.mateixes.length,
        llista(dolents.mateixes)
    );
    eq(
        'sense càlcul d’unitats només hi ha T = t + 273 i les dades sense unitats',
        [...senseUnitats].sort().join(', '),
        'kelvin:t, rendiment:Pa, rendiment:Pu'
    );
    for (const n of Resolucio.NIVELLS)
        for (let k = 0; k < 100; k++) {
            const ex = Resolucio.exercici(n);
            if (ex.nivell !== n) anota(dolents.nivell, `nivell ${n}: ${ex.formula}, ${ex.x} és del ${ex.nivell}`);
        }
    ok('exercici(nivell) dona un cas d’aquell nivell', !dolents.nivell.length, llista(dolents.nivell));

    // Un exemple fet a mà: v = Δx / Δt, aïllar Δt amb Δx = 240 km i v = 80 km/h
    const cas = Resolucio.CASOS.find(c => c.f.id === 'velocitat' && c.x === 'Δt');
    const ex = {
        nivell: 3,
        formula: 'velocitat',
        x: 'Δt',
        valors: { v: coeficient(80), Δx: coeficient(240), Δt: coeficient(3) },
    };
    const passos = Resolucio.passos(ex);
    eq(
        'v = Δx / Δt amb Δx = 240 i v = 80: nombres, unitat i lletres',
        passos
            .at(-1)
            .files.filter(Boolean)
            .map(f => textPla(f))
            .join(' | '),
        [
            'v=((Δx)/(Δt))',
            '80=((240)/(Δt))',
            '80*Δt=240',
            'Δt=((240)/(80))',
            'Δt=3',
            '«unitatde»Δt«:»((«km»)/(«km/h»))=«h»',
            'Δt=3«h»',
            'v=((Δx)/(Δt))',
            'v*Δt=Δx',
            'Δt=((Δx)/(v))',
        ].join(' | ')
    );
    const [, dades, mult] = passos;
    ok(
        'les dades baixen de les seves lletres i, en multiplicar, el Δt passa a l’altre membre',
        Object.keys(dades.reanomena).length === 2 &&
            Object.keys(mult.reanomena).length === 1 &&
            /^SK\d*ka\d+$/.test(Object.values(mult.reanomena)[0].replace(/^S2/, 'SK')),
        JSON.stringify([dades.reanomena, mult.reanomena])
    );
    ok('el cas de l’exemple és del nivell 3 (la lletra al denominador)', cas && cas.nivell === 3);
    // El detall (decisions del 22/11/2026, B1–B2): l'operació als dos membres, el que se simplifica ratllat i el pas
    const obert = Resolucio.passos(ex, { oberts: new Set(['3', '4']) });
    eq(
        'v = Δx / Δt, «Vull més detall» de multiplicar i dividir: als dos membres, ratllat i el pas',
        obert
            .at(-1)
            .files.filter(Boolean)
            .slice(2, 9)
            .map(f => textPla(f) + (/\\cancel/.test(f) ? ' (ratllat)' : ''))
            .join(' | '),
        [
            '80*Δt=(((240)/(Δt)))*Δt',
            '80*Δt=(((240)/(Δt)))*Δt (ratllat)',
            '80*Δt=240',
            '((80*Δt)/(80))=((240)/(80))',
            '((80*Δt)/(80))=((240)/(80)) (ratllat)',
            'Δt=((240)/(80))',
            'Δt=3',
        ].join(' | ')
    );
    {
        const amb = new Set();
        const sense = new Set();
        for (const c of Resolucio.CASOS)
            for (let k = 0; k < 5; k++)
                for (const e of Resolucio.etapes(Resolucio.exercici(c.nivell, c)))
                    (e.detall ? amb : sense).add(e.tipus);
        ok(
            'detall a les operacions d’aïllar i al valor; mai a la fórmula, les dades, girar, la unitat ni el resultat (B1, B4)',
            ['multiplica', 'divideix', 'resta', 'suma', 'arrel', 'valor'].every(t => amb.has(t)) &&
                ['formula', 'dades', 'gira', 'unitat', 'resultat', 'lletres'].every(t => !amb.has(t)),
            `amb: ${[...amb]} · sense: ${[...sense]}`
        );
        const lletres = Resolucio.etapes(ex);
        const iLletres = lletres.findIndex(e => e.tipus === 'lletres');
        ok(
            'també hi ha detall a la part de les lletres (B3)',
            lletres.slice(iLletres + 1).some(e => e.detall)
        );
    }
}

finish('TESTS DE FÓRMULES STEAM');
