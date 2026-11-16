/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/prioritat.test.js
 * ROL: Tests de la «Resolució pas a pas» de «Prioritat d'operacions» (l'escenari
 *      B, resolucio.html?activitat=prioritat: js/prioritat/resolucio.js).
 * ARQUITECTURA:
 * - 1. Els nivells de la pàgina B són grups dels de l'activitat (0–2, 3, 4–5, 6–8, 9;
 *   i amb enters, 0–1, 2–3, 4–5) i cada exercici és d'un nivell del seu grup.
 * - 2. Milers d'expressions de tots els nivells, amb la bateria comuna
 *   (tests/pissarra-activitat.js): el guió (i totes les vistes del detall) passa la
 *   revisió dels guions, cada pas que escriu una fila mou alguna peça i poques, i
 *   cada fila de la taula que es veu val el resultat (aritmètica exacta, feta aquí).
 *   I: una operació per pas, el detall «per què aquesta operació» només destaca
 *   l'operació que toca (no escriu cap fila), les frases són en segona persona i
 *   l'última fila és el resultat. Amb enters, l'aritmètica d'aquí també entén el
 *   menys de davant (−3, −(4 − 7), −2² = −4, (−2)³ = −8).
 * ÚS: node tests/prioritat.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish, loadModule } = require('./harness');
const { provaActivitat } = require('./pissarra-activitat');

// ── Aritmètica exacta (BigInt) d'una fila: nombres, + − * : ^ i parèntesis ──
const mcd = (a, b) => (b ? mcd(b, a % b) : a < 0n ? -a : a);
const fr = (n, d = 1n) => {
    if (d === 0n) throw new Error('divisió per 0');
    if (d < 0n) [n, d] = [-n, -d];
    const g = mcd(n, d) || 1n;
    return { n: n / g, d: d / g };
};
function avalua(text) {
    let i = 0;
    const s = text;
    const err = () => new Error(`no s'entén «${s}» (a la posició ${i})`);
    function primari() {
        let v;
        // El menys de davant (al principi o darrere d'un parèntesi): −3, −(4 − 7), −2² = −(2²)
        if (s[i] === '-') {
            i++;
            const w = primari();
            return fr(-w.n, w.d);
        }
        if (s[i] === '(') {
            i++;
            v = expr();
            if (s[i++] !== ')') throw err();
        } else {
            const m = /^\d+/.exec(s.slice(i));
            if (!m) throw err();
            i += m[0].length;
            v = fr(BigInt(m[0]));
        }
        if (s[i] === '^') {
            i++;
            const m = /^\d+/.exec(s.slice(i));
            if (!m) throw err();
            i += m[0].length;
            v = fr(v.n ** BigInt(m[0]), v.d ** BigInt(m[0]));
        }
        return v;
    }
    function terme() {
        let v = primari();
        while (s[i] === '*' || s[i] === ':') {
            const o = s[i++];
            const w = primari();
            v = o === '*' ? fr(v.n * w.n, v.d * w.d) : fr(v.n * w.d, v.d * w.n);
        }
        return v;
    }
    function expr() {
        let v = terme();
        while (s[i] === '+' || s[i] === '-') {
            const o = s[i++];
            const w = terme();
            v = o === '+' ? fr(v.n * w.d + w.n * v.d, v.d * w.d) : fr(v.n * w.d - w.n * v.d, v.d * w.d);
        }
        return v;
    }
    const v = expr();
    if (i !== s.length) throw err();
    return v;
}
/** Les files de la taula, en text pla: − → -, · → *, 3<sup>2</sup> → 3^2 (sense la columna de l'«=»). */
const filesDeTaula = html =>
    [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m =>
        m[1]
            .replace(/<td class="igual[^"]*">[\s\S]*?<\/td>/g, '')
            .replace(/<sup>/g, '^')
            .replace(/<[^>]+>/g, '')
            .replace(/−/g, '-')
            .replace(/·/g, '*')
            .replace(/\s+/g, '')
    );

const w = loadModule(
    [
        'js/utils.js',
        'js/prioritat/math-engine.js',
        'js/prioritat/strings.js',
        'js/prioritat/renderer.js',
        'js/pissarra/formules.js',
        'js/pissarra/comprova.js',
        'js/prioritat/resolucio.js',
    ],
    { seed: 20261116 }
);
const { Resolucio, MathEngine } = w;

suite('1. Els nivells de la pàgina B (grups dels de l’activitat)');
{
    const grups = ns => ns.flatMap(n => Resolucio.GRUPS[n]).join();
    eq(
        'els grups 1–5 cobreixen els 10 nivells de l’activitat, cadascun un cop',
        grups([1, 2, 3, 4, 5]),
        '0,1,2,3,4,5,6,7,8,9'
    );
    eq('els grups 6–8 cobreixen els 6 nivells d’enters, cadascun un cop', grups([6, 7, 8]), '0,1,2,3,4,5');
    eq('els nivells de la pàgina són 1–8', Resolucio.NIVELLS.join(), '1,2,3,4,5,6,7,8');
    const dolents = [];
    for (const n of Resolucio.NIVELLS)
        for (let k = 0; k < 300; k++) {
            const ex = Resolucio.exercici(n);
            const potencies = ex.toks.some(t => t.k === 'pow'),
                parentesis = ex.toks.some(t => t.k === 'lp'),
                productes = ex.toks.some(t => t.k === 'op' && (t.v === '·' || t.v === ':'));
            if (
                (n <= 2 && (potencies || parentesis)) ||
                (n === 3 && parentesis) ||
                (n === 4 && !parentesis) ||
                (n === 6 && (potencies || productes)) ||
                (n === 7 && (potencies || !productes)) ||
                (n === 8 && !potencies)
            )
                dolents.length < 5 && dolents.push(`nivell ${n}: ${w.Strings.toText(ex.toks)}`);
            if (MathEngine.evaluate(ex.toks, { enters: n >= 6 }) !== ex.val)
                dolents.length < 5 && dolents.push(`valor de ${ex.val}`);
        }
    ok(
        'cada nivell té el que li toca (sense potències ni parèntesis als primers, parèntesis al 4; enters: ' +
            'sumes i restes al 6, productes al 7, potències al 8)',
        !dolents.length,
        dolents.join('\n      → ')
    );
    // Hi ha negatius de veritat a tots els nivells d'enters
    const ambNegatius = n =>
        Array.from({ length: 200 }, () => Resolucio.exercici(n)).filter(ex =>
            ex.toks.some(t => (t.k === 'num' && t.v < 0) || t.k === 'neg' || (t.k === 'pow' && (t.b < 0 || t.opp)))
        ).length;
    ok(
        'als nivells 6–8 gairebé tots els exercicis tenen negatius',
        [6, 7, 8].every(n => ambNegatius(n) >= 150)
    );
}

suite('2. Resolució pas a pas (resolucio.html): el guió de cada expressió');
{
    const PLURAL = /\b(calculem|fem|tenim|sumem|restem|dividim|multipliquem|toquem|comencem)\b/i;
    const plurals = [],
        senseFinal = [],
        marques = [],
        operacions = [];
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    function* exercicis() {
        for (const nivell of Resolucio.NIVELLS)
            for (let k = 0; k < 400; k++) {
                const ex = Resolucio.exercici(nivell);
                const on = `nivell ${nivell}, ${w.Strings.toText(ex.toks)}`;
                const passos = Resolucio.passos(ex);
                const vista = ({ oberts }) => Resolucio.passos(ex, { oberts });
                // Una operació per signe, per potència i per menys de davant d'un parèntesi (treure'l)
                const ops = ex.toks.filter(t => t.k === 'op' || t.k === 'pow' || t.k === 'neg').length;
                if (passos.length !== ops + 1)
                    anota(operacions, `${on}: ${passos.length - 1} passos, ${ops} operacions`);
                const oberts = new Set(passos.filter(p => p.teDetall).map(p => p.id));
                const tot = vista({ oberts });
                tot.forEach((p, i) => {
                    if (PLURAL.test(p.text)) anota(plurals, `${on}: «${p.text}»`);
                    // El subpas del detall no escriu cap fila (només hi apareix l'objectiu en gris): només destaca
                    // (dest) l'operació que toca
                    if (p.pare && !p.tanca) {
                        const escrites = html => (html.match(/<tr(?![^>]*pis-objectiu)/g) || []).length;
                        const files = escrites(p.files[0]);
                        const abans = escrites(tot[i - 1].files[0]);
                        if (files !== abans || !/ dest"/.test(p.files[0])) anota(marques, `${on}, pas ${p.id}`);
                    }
                });
                if (!/<tr class="final">/.test(passos.at(-1).files[0])) anota(senseFinal, on);
                yield { on, passos, vista, valor: fr(BigInt(ex.val)) };
            }
    }
    provaActivitat('prioritat', {
        exercicis: exercicis(),
        eines: w,
        text: true,
        linies: fila => (fila ? filesDeTaula(fila) : []),
        veritat: (fila, ex) => {
            try {
                const v = avalua(fila);
                return v.n === ex.valor.n && v.d === ex.valor.d ? '' : `${fila} val ${v.n}/${v.d}, no ${ex.valor.n}`;
            } catch (e) {
                return e.message;
            }
        },
        maxPeces: 5,
        minExercicis: 2000,
    });
    ok('una operació per pas', !operacions.length, operacions.join('\n      → '));
    ok('el detall només destaca l’operació que toca (no escriu cap fila)', !marques.length, marques.join('\n      → '));
    ok('les frases són en segona persona', !plurals.length, plurals.join('\n      → '));
    ok('l’última fila és el resultat (classe «final»)', !senseFinal.length, senseFinal.join(', '));
    // Un exemple fet a mà: 2 + 3 · (5 − 2)
    const { N, O, L, R } = MathEngine;
    const ex = { nivell: 4, toks: [N(2), O('+'), N(3), O('·'), L(), N(5), O('-'), N(2), R()], val: 11 };
    const ps = Resolucio.passos(ex);
    eq(
        '2 + 3 · (5 − 2): una fila per operació, centrades',
        filesDeTaula(ps.at(-1).files[0]).join(' | '),
        '2+3*(5-2) | 2+3*3 | 2+9 | 11'
    );
    eq(
        'les frases diuen per què toca cada operació',
        ps.map(p => p.text).join(' / '),
        'Calcula 2 + 3 · (5 − 2). / Primer, el que hi ha dins del parèntesi: 5 − 2 = 3. / ' +
            'Les multiplicacions i les divisions van abans que les sumes i les restes: 3 · 3 = 9. / ' +
            'Només queda una operació: 2 + 9 = 11. El resultat és 11.'
    );
    ok(
        'el parèntesi i el que hi ha dins volen i es fusionen en el resultat',
        Object.values(ps[1].fusiona)[0].length === 5,
        JSON.stringify(ps[1].fusiona)
    );
    // Amb enters, a mà: −(4 − 7) + 2 i (−2)³ + 5 · (−1)
    const { NEG, P } = MathEngine;
    const e1 = { nivell: 6, toks: [NEG(), L(), N(4), O('-'), N(7), R(), O('+'), N(2)], val: 5 };
    const p1 = Resolucio.passos(e1);
    eq(
        '−(4 − 7) + 2: el parèntesi es queda fins que es treu amb el menys',
        filesDeTaula(p1.at(-1).files[0]).join(' | '),
        '-(4-7)+2 | -(-3)+2 | 3+2 | 5'
    );
    eq(
        'i les frases',
        p1.map(p => p.text).join(' / '),
        'Calcula −(4 − 7) + 2. / Primer, el que hi ha dins del parèntesi: 4 − 7 = −3. / ' +
            'El signe menys de davant del parèntesi canvia el signe: −(−3) = 3. / ' +
            'Només queda una operació: 3 + 2 = 5. El resultat és 5.'
    );
    const e2 = { nivell: 8, toks: [P(-2, 3), O('+'), N(5), O('·'), N(-1)], val: -13 };
    eq(
        '(−2)³ + 5 · (−1): els negatius, darrere d’un signe, entre parèntesis',
        filesDeTaula(Resolucio.passos(e2).at(-1).files[0]).join(' | '),
        '(-2)^3+5*(-1) | -8+5*(-1) | -8+(-5) | -13'
    );
}

finish('TESTS DE PRIORITAT (RESOLUCIÓ PAS A PAS)');
