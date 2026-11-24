/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccions/resolucio.js
 * ROL: «Resolució pas a pas» d'«Operacions amb Fraccions» (l'escenari B: l'alumne
 *      mira com es resol una operació amb dues fraccions, a
 *      resolucio.html?activitat=fraccions): el guió de la pissarra, pas a pas, amb el
 *      detall a demanda dels passos que en tenen.
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM): passos(ex, { oberts }) torna la llista de passos de la
 *   pissarra (js/pissarra/formules.js guio i historial, en TeX, una línia per fila i
 *   l'objectiu en gris quan un pas és obert); exercici(nivell) en genera una, com
 *   l'activitat (fraccions.js generateProblem): 1 mateix denominador, 2 un
 *   denominador múltiple de l'altre, 3 denominadors qualssevol (sumes i restes),
 *   4 producte o divisió. El resultat no és mai 0.
 * - La resolució és una cadena d'igualtats: la primera línia és l'operació i cada
 *   pas escriu a sota «= …»:
 *     · comú denominador (nivells 2 i 3): les fraccions equivalents amb el mcm;
 *     · operar: sumar o restar els numeradors (el denominador es queda), o
 *       multiplicar numeradors i denominadors, o dividir (multiplicar en creu);
 *     · simplificar: dividir el numerador i el denominador pel seu mcd (si cal;
 *       el resultat pot ser un nombre enter).
 *   Només volen els nombres que fan el canvi; la resta de la línia nova hi apareix.
 * - El detall a demanda (decisió del David, 15/11/2026): el comú denominador (el mcm
 *   pels múltiples del denominador més gran, i després cada fracció ampliada en una
 *   línia pròpia), simplificar (el mcd i les dues divisions) i dividir (girar la
 *   segona fracció i multiplicar). Les línies del detall que són càlculs al marge
 *   (mcm, mcd, ampliar una fracció) no són de la cadena: no comencen per «=».
 *   Els nombres que tornen a sortir de l'operació volen de la seva línia, encara
 *   que sigui més amunt (formules.js: «id@k», k línies amunt).
 * - tests/fraccions.test.js comprova milers d'operacions de tots els nivells: el guió
 *   és correcte, cada línia que es veu (també les del detall) és certa, KaTeX
 *   dibuixa totes les fórmules i el detall compleix la seva regla.
 * DEPENDÈNCIES: utils.js (gcd, randInt), pissarra/formules.js.
 * ============================================================================
 */
import { gcd, randInt } from '../utils.js';
import { clau, guio, historial } from '../pissarra/formules.js';

export const Resolucio = (() => {
    const mcd = gcd;
    const mcm = (a, b) => (a / mcd(a, b)) * b;

    // ---- LES LÍNIES ----
    //
    // Una línia és una llista d'elements: { id, t } (un símbol: t, el seu TeX; id, lletres i xifres, únic dins
    // de la línia) o { fr: [numerador, denominador] } (una fracció: dues llistes de símbols). Els id de la
    // cadena: a…, o, b… (la primera fracció, el signe i la segona: an, ad, bn, bd), r… (el resultat d'operar:
    // rn, rd), s… (el simplificat: sn, sd) i q (el «=» del davant).

    const s = (id, t) => ({ id, t: String(t) });
    const fr = (num, den) => ({ fr: [num, den] });
    const IGUAL = s('q', '=');
    const OPS = { '+': '+', '-': '-', '·': '\\cdot', ':': ':' };
    /** Una fracció { n, d } amb els id <x>n i <x>d (o, si és un nombre enter, només <x>n). */
    const fraccio = (x, { n, d }) => (d === 1 ? s(`${x}n`, n) : fr([s(`${x}n`, n)], [s(`${x}d`, d)]));
    /** La línia de l'operació: a op b (amb «=» al davant si no és la primera). */
    const operacio = (a, op, b, igual = true) => [
        ...(igual ? [IGUAL] : []),
        fraccio('a', a),
        s('o', OPS[op]),
        fraccio('b', b),
    ];

    const OPERADORS = new Set(['+', '-', '\\cdot', ':']);
    /** El TeX d'una línia; clauDe(id) dona la clau de cada símbol (sense clauDe, sense claus). */
    function pintaTex(linia, clauDe = null) {
        const simbol = e => {
            if (!clauDe) return e.t === '=' || OPERADORS.has(e.t) ? ` ${e.t} ` : e.t;
            const t = clau(clauDe(e.id), e.t);
            if (e.t === '=') return `\\mathrel{${t}}`;
            return OPERADORS.has(e.t) ? `\\mathbin{${t}}` : t;
        };
        const tros = es => es.map(e => (e.fr ? `\\dfrac{${tros(e.fr[0])}}{${tros(e.fr[1])}}` : simbol(e))).join('');
        return tros(linia);
    }
    // A les frases (sota la pissarra), les fraccions petites (\frac): una \dfrac fa la línia de text massa alta
    /** El TeX d'una fracció o d'un nombre enter, per a les frases. */
    const texFr = ({ n, d }) => (d === 1 ? String(n) : `\\frac{${n}}{${d}}`);
    /** El TeX sense claus d'una línia, per a les frases (p. ex. «\frac{5}{6} + \frac{7}{9}»). */
    const texLinia = linia =>
        pintaTex(linia)
            .replace(/\\dfrac/g, '\\frac')
            .replace(/\s+/g, ' ')
            .trim();

    // ---- ELS PASSOS ----
    //
    // etapes(ex) torna els passos de la vista compacta: { tipus, linia, text, mou, fusiona, detall } (detall:
    // { titol, subpassos: [{ linia, text, mou, fusiona, reparteix }], acaba: { mou, fusiona }, textAcaba },
    // o res). Els moviments són els de formules.js historial (mou: {nou: vell}, fusiona: {nou: [vells]},
    // reparteix: {vell: [nous]}), amb «id@k» per a un símbol de k línies amunt.

    /** Els múltiples del més gran fins al mcm, en text: «9, 18». */
    const multiples = (g, m) =>
        Array.from({ length: m / g }, (_, i) => g * (i + 1))
            .map(String)
            .join(', ');

    /** El detall del comú denominador: mcm(d1, d2) = m; cada fracció que canvia, ampliada; i les dues amb el m. */
    function detallComu(a, op, b, m) {
        const [g, h] = a.d >= b.d ? [a.d, b.d] : [b.d, a.d];
        const subpassos = [];
        const textMcm =
            g === m
                ? `Busca el mcm de ${a.d} i ${b.d}: ${g}, el més gran, ja és múltiple de ${h}. El mcm és ${m}.`
                : `Busca el mcm de ${a.d} i ${b.d}: dels múltiples de ${g}, el més gran (${multiples(g, m)}…), ` +
                  `el primer que també és múltiple de ${h} és el ${m}.`;
        subpassos.push({
            linia: [
                s('mf', '\\text{mcm}'),
                s('ma', '('),
                s('mx', a.d),
                s('mc', ','),
                s('my', b.d),
                s('mb', ')'),
                s('mq', '='),
                s('mm', m),
            ],
            text: textMcm,
            mou: { mx: 'ad', my: 'bd' },
        });
        // Cada fracció que canvia: x/y = (x·k)/(y·k) = (x·k)/m, en una línia pròpia (la de l'operació, k línies amunt)
        const ampliades = {}; // 'a' / 'b' → quantes línies després de la de l'operació s'ha escrit la seva
        for (const [x, f] of [
            ['a', a],
            ['b', b],
        ]) {
            const k = m / f.d;
            if (k === 1) continue;
            const amunt = subpassos.length + 1; // la línia de l'operació, des de la que s'escriu ara
            subpassos.push({
                linia: [
                    fr([s('pn', f.n)], [s('pd', f.d)]),
                    s('pq', '='),
                    fr([s('xn', f.n), s('xp', '\\cdot'), s('xk', k)], [s('xd', f.d), s('yp', '\\cdot'), s('yk', k)]),
                    s('zq', '='),
                    fr([s('zn', f.n * k)], [s('zd', m)]),
                ],
                text: `${m} : ${f.d} = ${k}: multiplica el numerador i el denominador de $${texFr(f)}$ per ${k}.`,
                reparteix: { [`${x}n@${amunt}`]: ['pn', 'xn'], [`${x}d@${amunt}`]: ['pd', 'xd'] },
                mou: { zd: `mm@${amunt - 1}` },
            });
            ampliades[x] = subpassos.length;
        }
        // Tancament: les fraccions ampliades baixen de la seva línia (les que no canvien, de la de l'operació)
        const n = subpassos.length;
        const acaba = { mou: { o: `o@${n + 1}` } };
        for (const x of ['a', 'b']) {
            if (ampliades[x]) {
                const amunt = n - ampliades[x] + 1;
                Object.assign(acaba.mou, { [`${x}n`]: `zn@${amunt}`, [`${x}d`]: `zd@${amunt}` });
            } else Object.assign(acaba.mou, { [`${x}n`]: `${x}n@${n + 1}`, [`${x}d`]: `${x}d@${n + 1}` });
        }
        return {
            titol: 'Detall: el comú denominador',
            subpassos,
            acaba,
            textAcaba: `Escriu les dues fraccions amb el denominador comú, ${m}.`,
        };
    }

    /** El detall de simplificar r: mcd(n, d) = g; (n : g)/(d : g); i el resultat. */
    function detallSimplifica(r, g, res) {
        const linia = [IGUAL, fr([s('xn', r.n), s('xp', ':'), s('xk', g)], [s('xd', r.d), s('yp', ':'), s('yk', g)])];
        const enter = res.d === 1;
        const num = ['xn', 'xp', 'xk'],
            den = ['xd', 'yp', 'yk'];
        return {
            titol: 'Detall: simplificar',
            subpassos: [
                {
                    linia: [
                        s('mf', '\\text{mcd}'),
                        s('ma', '('),
                        s('mx', r.n),
                        s('mc', ','),
                        s('my', r.d),
                        s('mb', ')'),
                        s('mq', '='),
                        s('mm', g),
                    ],
                    text: `Busca el mcd de ${r.n} i ${r.d}: el divisor més gran que tenen en comú és el ${g}.`,
                    mou: { mx: 'rn', my: 'rd' },
                },
                {
                    linia,
                    text: `Divideix el numerador i el denominador per ${g}.`,
                    mou: { xn: 'rn@2', xd: 'rd@2' },
                    reparteix: { mm: ['xk', 'yk'] },
                },
            ],
            acaba: enter ? { fusiona: { sn: [...num, ...den] } } : { fusiona: { sn: num, sd: den } },
            textAcaba:
                `Fes les divisions: $${r.n} : ${g} = ${r.n / g}$ i $${r.d} : ${g} = ${r.d / g}$.` +
                (enter ? ' Una fracció amb denominador 1 és un nombre enter.' : ''),
        };
    }

    /** El detall de dividir: a : b = a · (b girada); i multiplicar. */
    function detallDivideix(a, b, r) {
        return {
            titol: 'Detall: dividir fraccions',
            subpassos: [
                {
                    // La inversa sempre com a fracció, també amb denominador 1 (la de 1/5 és 5/1)
                    linia: [IGUAL, fraccio('a', a), s('o', '\\cdot'), fr([s('bn', b.d)], [s('bd', b.n)])],
                    text:
                        `Dividir per $${texFr(b)}$ és multiplicar per la seva inversa, $\\frac{${b.d}}{${b.n}}$: ` +
                        'gira-la i canvia el «:» per «·».',
                    mou: { an: 'an', ad: 'ad', o: 'o', bn: 'bd', bd: 'bn' },
                },
            ],
            acaba: { fusiona: { rn: ['an', 'o', 'bn'], rd: ['ad', 'bd'] } },
            textAcaba: `Multiplica els numeradors i els denominadors: $${a.n} \\cdot ${b.d} = ${r.n}$ i $${a.d} \\cdot ${b.n} = ${r.d}$.`,
        };
    }

    /** El resultat d'operar, sense simplificar: { n, d }. */
    function opera({ a, op, b }) {
        if (op === '·') return { n: a.n * b.n, d: a.d * b.d };
        if (op === ':') return { n: a.n * b.d, d: a.d * b.n };
        const m = mcm(a.d, b.d);
        const [x, y] = [a.n * (m / a.d), b.n * (m / b.d)];
        return { n: op === '+' ? x + y : x - y, d: m };
    }

    /** El resultat irreductible: { n, d } (d = 1 si és un nombre enter). */
    function resultat(ex) {
        const r = opera(ex);
        const g = mcd(r.n, r.d);
        return { n: r.n / g, d: r.d / g };
    }

    function etapes(ex) {
        const { a, op, b } = ex;
        const out = [];
        let actual = { a, b }; // les fraccions de la línia que hi ha escrita
        if (op === '+' || op === '-') {
            const m = mcm(a.d, b.d);
            if (a.d !== b.d) {
                const a2 = { n: a.n * (m / a.d), d: m },
                    b2 = { n: b.n * (m / b.d), d: m };
                out.push({
                    tipus: 'comu',
                    linia: operacio(a2, op, b2),
                    text: `Redueix les fraccions a comú denominador: el mcm de ${a.d} i ${b.d} és ${m}.`,
                    mou: { an: 'an', ad: 'ad', o: 'o', bn: 'bn', bd: 'bd' },
                    detall: detallComu(a, op, b, m),
                });
                actual = { a: a2, b: b2 };
            }
            const r = { n: op === '+' ? actual.a.n + actual.b.n : actual.a.n - actual.b.n, d: m };
            const verb = op === '+' ? 'suma' : 'resta';
            out.push({
                tipus: 'opera',
                linia: [IGUAL, fraccio('r', r)],
                text:
                    `${a.d === b.d ? 'Tenen' : 'Ara tenen'} el mateix denominador: ${verb} els numeradors i deixa el ` +
                    `denominador, $${actual.a.n} ${op} ${actual.b.n} = ${r.n}$.`,
                fusiona: { rn: ['an', 'o', 'bn'], rd: ['ad', 'bd'] },
                r,
            });
        } else if (op === '·') {
            const r = opera(ex);
            out.push({
                tipus: 'opera',
                linia: [IGUAL, fraccio('r', r)],
                text:
                    `Multiplica els numeradors i els denominadors: $${a.n} \\cdot ${b.n} = ${r.n}$ i ` +
                    `$${a.d} \\cdot ${b.d} = ${r.d}$.`,
                fusiona: { rn: ['an', 'o', 'bn'], rd: ['ad', 'bd'] },
                r,
            });
        } else {
            const r = opera(ex);
            out.push({
                tipus: 'divideix',
                linia: [IGUAL, fraccio('r', r)],
                text: `Divideix multiplicant en creu: $${a.n} \\cdot ${b.d} = ${r.n}$ i $${a.d} \\cdot ${b.n} = ${r.d}$.`,
                fusiona: { rn: ['an', 'o', 'bd'], rd: ['ad', 'bn'] },
                detall: detallDivideix(a, b, r),
                r,
            });
        }
        const r = out[out.length - 1].r;
        const g = mcd(r.n, r.d);
        if (g > 1) {
            const res = { n: r.n / g, d: r.d / g };
            out.push({
                tipus: 'simplifica',
                linia: [IGUAL, fraccio('s', res)],
                text:
                    `Simplifica: divideix el numerador i el denominador per ${g}, el seu mcd` +
                    (res.d === 1 ? '; el resultat és un nombre enter.' : '.'),
                ...(res.d === 1 ? { fusiona: { sn: ['rn', 'rd'] } } : { mou: { sn: 'rn', sd: 'rd' } }),
                detall: detallSimplifica(r, g, res),
            });
        }
        return out;
    }

    /** Les files de la pissarra d'un exercici: totes les línies, amb tots els passos oberts. */
    const files = ex => 1 + etapes(ex).reduce((n, e) => n + 1 + (e.detall ? e.detall.subpassos.length : 0), 0);

    /**
     * El guió d'un exercici: la primera línia (l'operació) i una línia per pas, cadascun amb la seva frase.
     * oberts: els passos (els seus id, '2', '3'…) que s'escriuen amb el detall; mentre es fan els subpassos,
     * la línia del pas es veu en gris com a objectiu.
     */
    function passos(ex, { oberts = new Set() } = {}) {
        const llista = etapes(ex);
        const g = guio(files(ex));
        const H = historial(g, { prefix: 'F', pinta: pintaTex, oberts, objectiu: true });
        const inicial = operacio(ex.a, ex.op, ex.b, false);
        H.escriu(inicial, `Calcula $${texLinia(inicial)}$.`);
        const res = resultat(ex);
        const fi = ` El resultat és $${texFr(res)}$.`;
        llista.forEach((e, j) => {
            const final = j === llista.length - 1;
            const op = { mou: e.mou, fusiona: e.fusiona, final };
            const det = e.detall;
            if (det)
                Object.assign(op, {
                    titol: det.titol,
                    detall: D => {
                        for (const sp of det.subpassos)
                            D.escriu(sp.linia, sp.text, { mou: sp.mou, fusiona: sp.fusiona, reparteix: sp.reparteix });
                        D.acaba(det.textAcaba + (final ? fi : ''), det.acaba);
                    },
                });
            H.escriu(e.linia, e.text + (final ? fi : ''), op);
        });
        return g.passos;
    }

    /** Una fracció irreductible a/b amb 1 ≤ a ≤ 9 i 2 ≤ b ≤ 9. */
    function irreductible() {
        let n, d;
        do {
            n = randInt(1, 9);
            d = randInt(2, 9);
        } while (mcd(n, d) !== 1);
        return { n, d };
    }

    /** Una operació nova del nivell (1–3: suma o resta, amb els denominadors de l'activitat; 4: producte o divisió). */
    function exercici(nivell) {
        for (;;) {
            let a = irreductible(),
                b = irreductible();
            if (nivell === 4) {
                const ex = { nivell, a, op: Math.random() > 0.5 ? '·' : ':', b };
                return ex;
            }
            if (nivell === 1) b = { n: b.n, d: a.d };
            else if (nivell === 2) {
                const k = randInt(2, 4);
                if (Math.random() > 0.5) b = { n: b.n, d: a.d * k };
                else a = { n: a.n, d: b.d * k };
                if (a.d > 30 || b.d > 30 || a.d === b.d) continue;
                // Les fraccions han de ser irreductibles també amb el denominador nou
                if (mcd(a.n, a.d) !== 1 || mcd(b.n, b.d) !== 1) continue;
            } else {
                const m = mcm(a.d, b.d);
                if (m === a.d || m === b.d || a.d === b.d) continue;
            }
            if (nivell === 1 && mcd(b.n, b.d) !== 1) continue;
            let op = Math.random() > 0.5 ? '+' : '-';
            if (op === '-' && a.n * b.d < b.n * a.d) [a, b] = [b, a];
            if (op === '-' && a.n * b.d === b.n * a.d) op = '+'; // el resultat no és mai 0
            return { nivell, a, op, b };
        }
    }

    return Object.freeze({ NIVELLS: [1, 2, 3, 4], exercici, passos, files, etapes, resultat, texLinia, pintaTex });
})();
