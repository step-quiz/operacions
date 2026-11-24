/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/cilindres.test.js
 * ROL: Tests de «Cilindres amb un full» (js/cilindres/: math-engine.js, errors.js).
 * ARQUITECTURA:
 * - 1. Centenars de fulls: tres alumnes simulats (arrodoneix a 2 decimals, trunca a 2
 *   decimals, fa servir π ≈ 3,14) fan tots els passos amb correcció amb arrossegament
 *   (refaPassos, com el joc de passos amb enEncertar): cap resposta ben feta no es rebutja;
 *   el volum de l'alumne queda a prop del model propi (V = c²·h / 4π); la comparació és
 *   la del model; cada distractor es diagnostica amb el seu codi; KaTeX dibuixa tot.
 * - 2. Les decisions del David (23/11/2026): el costat és la circumferència; nivell 1 el
 *   full A4 (21 × 30, V₁ ≈ 1 052,8 cm³), nivell 2 altres rectangles; capacitat en mL;
 *   quatre opcions al plegat; la pàgina, el codi CF.
 * - 3. La «Resolució pas a pas» (js/cilindres/resolucio.js): la bateria comuna
 *   (tests/pissarra-activitat.js) amb centenars de fulls, tancats i amb el detall del radi:
 *   cada línia és certa amb un model propi (r = c/2π, A = π·r² i V = A·h, amb 2 decimals en
 *   cadena com l'alumne; «≈» vol dir a menys de mig centèsim); els costats del full volen
 *   a la fórmula; volum en cm³ i capacitat en mL; KaTeX; l'activitat hi enllaça.
 * ÚS: node tests/cilindres.test.js
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
        'js/cilindres/strings.js',
        'js/cilindres/math-engine.js',
        'js/cilindres/errors.js',
    ],
    { seed: 20261123 }
);
const { generaPreguntaCF, refaPassos, corregeixPas, diagnosticaCF, ERRORS_CF } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));
const model = ({ c, h }) => (c * c * h) / (4 * Math.PI);
const text = v => v.toFixed(2).replace('.', ',');

/** Els tres alumnes: com calculen i com escriuen un nombre amb 2 decimals. */
const ALUMNES = {
    'arrodoneix': { pi: Math.PI, dos: v => Math.round(v * 100) / 100 },
    'trunca': { pi: Math.PI, dos: v => Math.floor(v * 100 + 1e-9) / 100 },
    'pi = 3,14': { pi: 3.14, dos: v => Math.round(v * 100) / 100 },
};

/** Juga una pregunta amb un alumne: torna els errors trobats i el seu volum final de cada cilindre. */
function juga(q, alumne, anota, on) {
    const { pi, dos } = ALUMNES[alumne];
    const meus = {};
    let passos = q.passos;
    for (let i = 0; i < passos.length; i++) {
        const pas = passos[i];
        const k = Number((pas.id.match(/\d$/) || ['0'])[0]);
        const cil = q.dades.cilindres[k - 1];
        let resp;
        if (pas.mena === 'plegat') resp = { tria: pas.solucio.tria };
        else if (pas.mena === 'compara') resp = { tria: meus.V1 > meus.V2 ? 'c1' : 'c2' };
        else {
            let v;
            if (pas.mena === 'radi') v = meus[`r${k}`] = dos(cil.c / (2 * pi));
            else if (pas.mena === 'area') v = meus[`A${k}`] = dos(pi * meus[`r${k}`] ** 2);
            else if (pas.mena === 'volum') v = meus[`V${k}`] = dos(meus[`A${k}`] * cil.h);
            else v = meus[`V${k}`]; // la capacitat en mL: el mateix nombre que el volum
            resp = { r: { v: text(v), p: '' } };
        }
        const r = corregeixPas(pas, resp);
        if (r.estat !== 'ok') {
            anota(`${on} (${alumne}), ${pas.id}: ${JSON.stringify(resp)} → ${r.estat}`);
            return meus;
        }
        const nous = refaPassos(q, pas, r.valors);
        if (nous) passos = nous;
    }
    return meus;
}

suite('1. Centenars de fulls, amb tres alumnes (correcció amb arrossegament)');
{
    const dolents = { rebutjades: [], model: [], errors: [], katex: [] };
    const anota = l => t => l.length < 5 && l.push(t);
    const vistos = new Set();
    let n = 0;
    for (const nivell of [1, 2])
        for (let k = 0; k < (nivell === 1 ? 20 : 300); k++) {
            n++;
            const q0 = generaPreguntaCF(nivell);
            const on = `${q0.dades.a} × ${q0.dades.b}`;
            for (const alumne of Object.keys(ALUMNES)) {
                const q = JSON.parse(JSON.stringify(q0));
                const meus = juga(q, alumne, anota(dolents.rebutjades), on);
                q.dades.cilindres.forEach((cil, i) => {
                    const V = meus[`V${i + 1}`];
                    if (V === undefined || Math.abs(V - model(cil)) / model(cil) > 0.012)
                        anota(dolents.model)(`${on} (${alumne}): V${i + 1} = ${V}, model ${model(cil).toFixed(2)}`);
                });
            }
            // Cada distractor (amb la cadena bona) es diagnostica amb el seu codi
            const q = JSON.parse(JSON.stringify(q0));
            for (const pas of q.passos) {
                for (const [v, codi] of pas.dades.distractors.tria || pas.dades.distractors.r || []) {
                    vistos.add(codi);
                    const resp = pas.camps.tria
                        ? { tria: v }
                        : { r: { v: text(Array.isArray(v) ? v[0] / v[1] : v), p: '' } };
                    const r = corregeixPas(pas, resp);
                    const d = r.estat === 'error' ? diagnosticaCF(pas, r.valors) : null;
                    if (!d || d.errorType !== codi || !ERRORS_CF[codi])
                        anota(dolents.errors)(
                            `${on}, ${pas.id}: ${JSON.stringify(resp)} → ${r.estat} ${d && d.errorType} (${codi})`
                        );
                }
                for (const t of [pas.linia, ...pas.plantilla.filter(p => p.tex).map(p => p.tex)].filter(Boolean))
                    if (k % 10 === 0 && !katexOk(t)) anota(dolents.katex)(`${on}, ${pas.id}: ${t}`);
            }
            if (k % 10 === 0 && !katexOk(q0.formula.tex)) anota(dolents.katex)('fórmules');
        }
    const msg = l => l.join('\n      → ');
    ok(
        `${n} fulls × 3 alumnes: cap resposta ben feta no es rebutja (arrodonir, truncar, π ≈ 3,14)`,
        !dolents.rebutjades.length,
        msg(dolents.rebutjades)
    );
    ok('el volum de l’alumne queda a prop del model (V = c²·h / 4π)', !dolents.model.length, msg(dolents.model));
    ok('cada distractor és un error i el diagnòstic en reconeix el codi', !dolents.errors.length, msg(dolents.errors));
    ok('KaTeX dibuixa totes les fórmules', !dolents.katex.length, msg(dolents.katex));
    const sobren = Object.keys(ERRORS_CF).filter(c => !vistos.has(c));
    ok('surten tots els errors', !sobren.length, sobren.join(', '));
}

suite('2. Les decisions del David');
{
    const q = generaPreguntaCF(1);
    eq('nivell 1: el full A4, 21 × 30', `${q.dades.a} × ${q.dades.b}`, '21 × 30');
    const [c1, c2] = q.dades.cilindres;
    ok(
        'al full A4, el cilindre 1 fa la volta amb 21 cm i té 30 cm d’altura (l’enunciat del David)',
        c1.c === 21 && c1.h === 30 && c2.c === 30 && c2.h === 21
    );
    ok(
        `V₁ ≈ 1052,8 cm³ i V₂ ≈ 1504,0 cm³ (model: ${model(c1).toFixed(1)} i ${model(c2).toFixed(1)})`,
        Math.abs(model(c1) - 1052.8) < 0.1 && Math.abs(model(c2) - 1504.0) < 0.1
    );
    const radi = q.passos.find(p => p.id === 'radi1');
    ok(
        'el radi surt de 2πr = costat (circumferència, no diàmetre)',
        Math.abs(radi.solucio.r[0] / radi.solucio.r[1] - 21 / (2 * Math.PI)) < 0.01
    );
    const plegat = q.passos.find(p => p.mena === 'plegat');
    eq('el plegat té quatre opcions', plegat.opcions.length, 4);
    ok(
        'la capacitat es diu en mL i el volum en cm³',
        q.passos.filter(p => p.mena === 'capacitat').every(p => /mL/.test(p.linia)) &&
            q.passos.filter(p => p.mena === 'volum').every(p => /cm\}\^3/.test(p.linia))
    );
    let amples = 0;
    for (let k = 0; k < 200; k++) {
        const q2 = generaPreguntaCF(2);
        if (q2.dades.a === 21 && q2.dades.b === 30) amples = -1000;
        if (q2.dades.cilindres[0].c > q2.dades.cilindres[1].c) amples++;
    }
    ok(
        `nivell 2: altres rectangles, i el cilindre ample no és sempre el 2 (${amples} de 200 el primer)`,
        amples > 40 && amples < 160
    );
    const html = fs.readFileSync(path.join(ROOT, 'cilindres.html'), 'utf8');
    ok(
        'la pàgina: tema de geometria, el controlador i amb codi',
        /tema-geometria/.test(html) && /js\/cilindres\/cilindres\.js/.test(html) && !/senseCodi/.test(html)
    );
    ok(
        'codi d’exercici CF',
        /'cilindres': 'CF'/.test(fs.readFileSync(path.join(ROOT, 'js/exercise-codes.js'), 'utf8'))
    );
    ok(
        'la figura: el full i els dos cilindres',
        /jp-cf-full/.test(q.svg) && (q.svg.match(/<ellipse/g) || []).length === 2
    );
}

suite('3. Resolució pas a pas (resolucio.html?activitat=cilindres): la pissarra');
{
    const { provaActivitat } = require('./pissarra-activitat');
    const p = loadModule(
        [
            'js/utils.js',
            'js/algebra/racionals.js',
            'js/passos/correccio.js',
            'js/cilindres/strings.js',
            'js/cilindres/math-engine.js',
            'js/pissarra/formules.js',
            'js/pissarra/comprova.js',
            'js/cilindres/resolucio.js',
        ],
        { seed: 20261124 }
    );
    const R = p.ResolucioCF;
    const dos2 = v => Math.round(v * 100) / 100;
    /** El model de cada cilindre: r exacte; A amb el radi arrodonit; V amb l'àrea arrodonida. */
    const model = ex =>
        ex.dades.cilindres.map(({ c, h }) => {
            const r = c / (2 * Math.PI);
            const A = Math.PI * dos2(r) ** 2;
            return { r, A, V: dos2(A) * h, h };
        });
    /** Un membre en text pla («((21)/(2π))», «π*3,34^(2)», «2πr_1»), amb les variables del model. */
    function avalua(text, vars) {
        let i = 0;
        const primari = () => {
            if (text[i] === '(') {
                i++;
                const v = suma();
                if (text[i] !== ')') throw new Error(`falta «)» a ${text}`);
                i++;
                return v;
            }
            if (text[i] === 'π') return (i++, Math.PI);
            const vr = /^([rAVh])_(\d)/.exec(text.slice(i));
            if (vr) {
                i += vr[0].length;
                return vars[Number(vr[2]) - 1][vr[1]];
            }
            const m = /^\d+(,\d+)?/.exec(text.slice(i));
            if (!m) throw new Error(`no s'entén «${text.slice(i)}» a ${text}`);
            i += m[0].length;
            return Number(m[0].replace(',', '.'));
        };
        const potencia = () => {
            const b = primari();
            if (text[i] !== '^') return b;
            i++;
            return b ** primari();
        };
        const producte = () => {
            let v = potencia();
            for (;;) {
                if (text[i] === '*') v = (i++, v * potencia());
                else if (text[i] === '/') v = (i++, v / potencia());
                else if (/[(πrAVh\d]/.test(text[i] || '')) v *= potencia();
                else return v;
            }
        };
        function suma() {
            let v = producte();
            while (text[i] === '+' || text[i] === '-') v = text[i++] === '+' ? v + producte() : v - producte();
            return v;
        }
        const v = suma();
        if (i !== text.length) throw new Error(`sobra «${text.slice(i)}» a ${text}`);
        return v;
    }
    const PROVA = {
        '=': (x, y) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y)),
        '≈': (x, y) => Math.abs(x - y) <= 0.0051,
        '>': (x, y) => x > y,
    };
    function veritat(fila, ex) {
        // sense els textos («Cilindre 1:», «cm», «mL») ni els seus exponents
        const pla = p.textPla(fila).replace(/«[^»]*»(\^\(\d\))?/g, '');
        try {
            const trossos = pla.split(/([=≈>])/);
            if (trossos[0] === '') trossos.splice(0, 2); // «≈ 1051,50» (la capacitat): res a comparar
            const vars = model(ex);
            for (let j = 0; j + 2 < trossos.length; j += 2) {
                // «2πr_1=21 h_1=30»: dues igualtats seguides sense separador (el «\qquad» no deixa res)
                const dreta = trossos[j + 2].replace(/(\d)(h_\d)$/, '$1');
                const [x, y] = [avalua(trossos[j].replace(/^.*\d(?=h_\d$)/, ''), vars), avalua(dreta, vars)];
                if (!PROVA[trossos[j + 1]](x, y)) return `${pla}: ${x} ${trossos[j + 1]} ${y} no és cert`;
            }
            return '';
        } catch (e) {
            return `${pla}: ${e.message}`;
        }
    }
    const dolents = { katex: [], plurals: [], vola: [], unitats: [], final: [] };
    const anota2 = (l, t) => l.length < 5 && l.push(t);
    const PLURAL = /\b(calculem|fem|tenim|sabem|passem|sumem|dividim|multipliquem|aïllem|enrotllem)\b/i;
    function* exercicis() {
        for (const nivell of R.NIVELLS)
            for (let k = 0; k < (nivell === 1 ? 5 : 300); k++) {
                const ex = R.exercici(nivell);
                const on = `nivell ${nivell}, ${ex.dades.a} × ${ex.dades.b}`;
                const passos = R.passos(ex);
                const vista = ({ oberts }) => R.passos(ex, { oberts });
                if (k < 20) {
                    const tot = vista({ oberts: new Set(passos.filter(x => x.teDetall).map(x => x.id)) });
                    const formules = new Set();
                    for (const ps of [...passos, ...tot]) {
                        ps.files.filter(f => f && !f.startsWith('<svg')).forEach(f => formules.add(f));
                        for (const m of ps.text.matchAll(/\$([^$]+)\$/g)) formules.add(m[1]);
                        if (PLURAL.test(ps.text)) anota2(dolents.plurals, `${on}: «${ps.text}»`);
                    }
                    for (const f of formules)
                        if (
                            /katex-error/.test(
                                katex.renderToString(f, {
                                    throwOnError: false,
                                    strict: 'ignore',
                                    trust: c => c.command === '\\htmlData',
                                })
                            )
                        )
                            anota2(dolents.katex, `${on}: ${f}`);
                }
                // Els costats del full volen a la fórmula (des dels textos de la figura, amb data-k)
                const plegats = passos.filter(x => /^Enrotlla el full/.test(x.text));
                if (
                    plegats.length !== 2 ||
                    plegats.some(x => Object.values(x.reanomena || {}).filter(v => /^C\dk[ab]$/.test(v)).length !== 2)
                )
                    anota2(dolents.vola, on);
                // Volum en cm³, capacitat en mL
                const ultim = passos[passos.length - 1];
                const plans = ultim.files.filter(f => f && !f.startsWith('<svg')).map(f => p.textPla(f));
                const vols = plans.filter(f => /^V_\d/.test(f));
                const caps = plans.filter(f => /Capacitat/.test(f));
                if (
                    vols.length !== 2 ||
                    !vols.every(f => /«cm»\^\(3\)$/.test(f)) ||
                    caps.length !== 2 ||
                    !caps.every(f => /«mL»$/.test(f))
                )
                    anota2(dolents.unitats, `${on}: ${plans.join(' | ')}`);
                if (!ultim.classes.some(c => /final/.test(c))) anota2(dolents.final, on);
                yield { on, passos, vista, files: R.files(ex), dades: ex.dades };
            }
    }
    provaActivitat('cilindres', {
        exercicis: exercicis(),
        eines: p,
        text: true,
        linies: fila => (fila && !fila.startsWith('<svg') ? [fila] : []),
        veritat: (fila, ex) => veritat(fila, { dades: ex.dades }),
        maxPeces: 8,
        minExercicis: 300,
    });
    const llista = l => l.join('\n      → ');
    ok('KaTeX dibuixa totes les files i les fórmules de les frases', !dolents.katex.length, llista(dolents.katex));
    ok('les frases són en segona persona', !dolents.plurals.length, llista(dolents.plurals));
    ok('els dos costats del full volen de la figura a la fórmula', !dolents.vola.length, llista(dolents.vola));
    ok('el volum en cm³ i la capacitat en mL', !dolents.unitats.length, llista(dolents.unitats));
    ok('l’última línia és ressaltada', !dolents.final.length, llista(dolents.final));
    const html = fs.readFileSync(path.join(ROOT, 'js/cilindres/cilindres.js'), 'utf8');
    ok(
        'l’activitat hi enllaça («Mira com es resol», amb el nivell)',
        /resolucio\.html\?activitat=cilindres&nivell=\$\{pregunta\.dades\.nivell\}/.test(html)
    );
}

finish('TESTS DE CILINDRES AMB UN FULL');
