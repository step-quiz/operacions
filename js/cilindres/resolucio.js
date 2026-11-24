/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/cilindres/resolucio.js
 * ROL: «Resolució pas a pas» de «Cilindres amb un full» (l'escenari B, a
 *      resolucio.html?activitat=cilindres): el guió de la pissarra d'un full enrotllat
 *      de dues maneres, pas a pas. Decisions del David (23/11/2026, PENDING.md §2b): el
 *      costat del full vola a la longitud de la circumferència de la base (com a la demo
 *      de Pitàgores) i «Vull més detall» al pas del radi.
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM), exportat com a ResolucioCF (als tests, «Resolucio» ja és el
 *   d'una altra activitat). exercici(nivell) és una pregunta de l'activitat
 *   (math-engine.js generaPreguntaCF: nivell 1, el full A4; nivell 2, un altre full);
 *   passos(ex, { oberts }) en torna el guió (js/pissarra/formules.js historial).
 * - Les línies: la figura de l'activitat (svgCilindres, amb data-k als textos dels
 *   costats del full); per a cada cilindre, el plegat (2πr = costat i h = l'altre: els
 *   nombres volen del full), el radi (amb detall: dividir els dos membres entre 2π i
 *   simplificar), l'àrea de la base i el volum; després, quin té més volum i la
 *   capacitat de cadascun en mL (volum en cm³, capacitat en mL: paraules del David).
 * - Els valors són els de l'activitat amb 2 decimals, en cadena (r arrodonit, A = π·r²
 *   arrodonida, V = A·h arrodonit), com els faria l'alumne amb la calculadora.
 * - tests/cilindres.test.js passa la bateria comuna (tests/pissarra-activitat.js).
 * DEPENDÈNCIES: pissarra/formules.js, algebra/racionals.js, math-engine.js, strings.js.
 * ============================================================================
 */
import { clau, guio, historial } from '../pissarra/formules.js';
import { texDecimal } from '../algebra/racionals.js';
import { generaPreguntaCF, svgCilindres } from './math-engine.js';
import { TEXTOS_CF } from './strings.js';

export const ResolucioCF = (() => {
    const dos = v => Math.round(v * 100) / 100;
    /** Un nombre amb 2 decimals i coma (TeX): 3{,}34. */
    const num = v => texDecimal([Math.round(v * 100), 100], { minDecimals: 2 });

    // Una línia és { figura: true } (la figura) o { peces }: { id, tex, tipus } (tipus 'rel' o 'op') o
    // { fraccio: [peces del numerador, peces del denominador] }.
    const P = (id, tex, tipus = '') => ({ id, tex, tipus });
    const rel = (id, tex) => P(id, tex, 'rel');
    const fraccio = (n, d) => ({ fraccio: [n, d] });
    const CM = (id, exp = '') => P(id, `\\ \\text{cm}${exp ? `^${exp}` : ''}`);

    /** Els valors de cada cilindre, amb 2 decimals en cadena (com a l'activitat). */
    function valors(ex) {
        return ex.dades.cilindres.map(({ c, h }) => {
            const r = dos(c / (2 * Math.PI));
            const A = dos(Math.PI * r * r);
            return { c, h, r, A, V: dos(A * h) };
        });
    }

    /** El pintor: la figura (amb les claus dels costats del full) o una línia de TeX. */
    function pintador(ex) {
        const { a, b, cilindres } = ex.dades;
        return (l, clauDe) => {
            if (l.figura) return svgCilindres(a, b, cilindres, { a: clauDe('a'), b: clauDe('b') });
            const una = p => {
                if (p.fraccio) return `\\dfrac{${p.fraccio[0].map(una).join('')}}{${p.fraccio[1].map(una).join('')}}`;
                const s = clau(clauDe(p.id), p.tex);
                return p.tipus === 'rel' ? `\\mathrel{${s}}` : p.tipus === 'op' ? `\\mathbin{${s}}` : s;
            };
            return l.peces.map(una).join('');
        };
    }

    // ---- LES LÍNIES DE CADA CILINDRE ----

    const liniaPlegat = (k, { c, h }) => ({
        peces: [
            P('T', `\\text{Cilindre ${k}:}\\quad`),
            P('d', '2'),
            P('p', '\\pi'),
            P('r', `r_${k}`),
            rel('q', '='),
            P('c', String(c)),
            CM('uc'),
            P('H', `\\qquad h_${k}`),
            rel('qh', '='),
            P('hv', String(h)),
            CM('uh'),
        ],
    });
    const liniaRadi = (k, { c, r }) => ({
        peces: [
            P('r', `r_${k}`),
            rel('q', '='),
            fraccio([P('c', String(c))], [P('d', '2'), P('p', '\\pi')]),
            rel('ap', '\\approx'),
            P('v', num(r)),
            CM('u'),
        ],
    });
    const liniaArea = (k, { r, A }) => ({
        peces: [
            P('A', `A_${k}`),
            rel('q', '='),
            P('p', '\\pi'),
            P('m', '\\cdot', 'op'),
            P('v', `{${num(r)}}^2`),
            rel('ap', '\\approx'),
            P('w', num(A)),
            CM('u', 2),
        ],
    });
    const liniaVolum = (k, { h, A, V }) => ({
        peces: [
            P('V', `V_${k}`),
            rel('q', '='),
            P('a', num(A)),
            P('m', '\\cdot', 'op'),
            P('h', String(h)),
            rel('ap', '\\approx'),
            P('w', num(V)),
            CM('u', 3),
        ],
    });

    /** El detall del radi: divideix els dos membres entre 2π; el 2π de l'esquerra es simplifica. */
    function detallRadi(k, { c, r }) {
        const dividida = {
            peces: [
                fraccio([P('d', '2'), P('p', '\\pi'), P('r', `r_${k}`)], [P('d2', '2'), P('p2', '\\pi')]),
                rel('q', '='),
                fraccio([P('c', String(c))], [P('d3', '2'), P('p3', '\\pi')]),
            ],
        };
        const simplificada = {
            peces: [P('r', `r_${k}`), rel('q', '='), fraccio([P('c', String(c))], [P('d3', '2'), P('p3', '\\pi')])],
        };
        return {
            titol: 'Detall: aïllar el radi',
            detall: D => {
                D.escriu(dividida, 'Divideix els dos membres entre 2π: la igualtat es manté.', {
                    reparteix: { d: ['d', 'd2', 'd3'], p: ['p', 'p2', 'p3'] },
                    mou: { r: 'r', c: 'c' },
                });
                D.escriu(simplificada, `A l'esquerra, 2π entre 2π és 1: queda r${k} sol.`, {
                    mou: { r: 'r', q: 'q', c: 'c', d3: 'd3', p3: 'p3' },
                });
                D.acaba(`Fes la divisió amb la calculadora: $${c} : (2\\pi) \\approx ${num(r)}$.`, {
                    mou: { r: 'r', q: 'q', c: 'c', d: 'd3', p: 'p3' },
                });
            },
        };
    }

    // ---- LA PISSARRA ----

    /** Les files de la pissarra: totes les línies, amb el detall dels dos radis obert. */
    const files = () => 1 + 2 * (4 + 2) + 3;

    /** El guió: la figura, els passos de cada cilindre, quin té més volum i les capacitats. */
    function passos(ex, { oberts = new Set() } = {}) {
        const { a } = ex.dades;
        const vals = valors(ex);
        const g = guio(files(ex));
        const H = historial(g, { prefix: 'C', pinta: pintador(ex), oberts, objectiu: true });
        const { context, pregunta } = TEXTOS_CF.problema(ex.dades.a, ex.dades.b, ex.dades.cilindres);
        H.escriu({ figura: true }, `${context.replace(/\*\*/g, '')} ${pregunta}`);

        vals.forEach((v, i) => {
            const k = i + 1;
            const { c, h } = v;
            // el text del full amb cada costat: a (el de sota) o b (el del costat)
            const costat = x => (x === a ? 'a' : 'b');
            const fins = i === 0 ? 1 : 5; // quantes línies amunt és la figura
            H.escriu(
                liniaPlegat(k, v),
                `Enrotlla el full unint els costats de ${h} cm: el de ${c} cm fa la volta i és la longitud de la circumferència de la base, $2\\pi r_${k}$; el de ${h} cm queda dret i és l'altura.`,
                { mou: { c: `${costat(c)}@${fins}`, hv: `${costat(h)}@${fins}` } }
            );
            H.escriu(
                liniaRadi(k, v),
                `Aïlla el radi: divideix ${c} entre $2\\pi$ amb la calculadora i escriu-lo amb 2 decimals.`,
                { mou: { r: 'r', c: 'c', d: 'd', p: 'p' }, ...detallRadi(k, v) }
            );
            H.escriu(liniaArea(k, v), `L'àrea de la base és $\\pi r^2$: posa-hi el radi i escriu-la amb 2 decimals.`, {
                mou: { v: 'v' },
            });
            H.escriu(liniaVolum(k, v), "El volum és l'àrea de la base per l'altura: $V = A_{\\text{base}} \\cdot h$.", {
                mou: { a: 'w', h: 'hv@3' },
            });
        });

        // Quin té més volum: els dos volums hi baixen
        const gran = vals[0].V > vals[1].V ? 0 : 1;
        const petit = 1 - gran;
        const desDe = j => (j === 1 ? 'w@1' : 'w@5'); // el volum del cilindre 2 és a la línia anterior
        H.escriu(
            {
                peces: [
                    P('g', num(vals[gran].V)),
                    CM('ug', 3),
                    rel('mes', '>'),
                    P('l', num(vals[petit].V)),
                    CM('ul', 3),
                ],
            },
            `Compara els volums: el cilindre ${gran + 1} té més volum. És el que fa la volta amb el costat més llarg.`,
            { mou: { g: desDe(gran), l: desDe(petit) } }
        );
        // Les capacitats, en mL: 1 cm³ correspon a 1 mL
        vals.forEach((v, i) => {
            const k = i + 1;
            const font = i === gran ? 'g' : 'l';
            H.escriu(
                {
                    peces: [
                        P('C', `\\text{Capacitat del cilindre ${k}}`),
                        rel('ap', '\\approx'),
                        P('w', num(v.V)),
                        P('u', '\\ \\text{mL}'),
                    ],
                },
                k === 1
                    ? 'El volum es mesura en cm³ i la capacitat, en mL: 1 cm³ correspon a 1 mL, i el nombre és el mateix.'
                    : "I la capacitat de l'altre cilindre.",
                { mou: { w: `${font}@${k}` }, final: k === 2 }
            );
        });
        return g.passos;
    }

    /** Un full nou del nivell (1: el full A4; 2: un altre rectangle). */
    const exercici = nivell => generaPreguntaCF(nivell);

    return Object.freeze({ NIVELLS: [1, 2], exercici, passos, files, valors });
})();
