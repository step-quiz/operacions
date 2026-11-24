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
import { TEXTOS_CF, texCm, textCm } from './strings.js';

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

    // Les dades, sense unitats (el David, 24/11/2026): 2πr = 21 al plegat i h = 30 just abans del volum
    const liniaPlegat = (k, { c }) => ({
        peces: [
            P('T', `\\text{Cilindre ${k}:}\\quad`),
            P('d', '2'),
            P('p', '\\pi'),
            P('r', `r_${k}`),
            rel('q', '='),
            P('c', texCm(c)),
        ],
    });
    const liniaAltura = (k, { h }) => ({ peces: [P('H', `h_${k}`), rel('q', '='), P('hv', texCm(h))] });
    /** Les fórmules generals (només al cilindre 1). */
    const formulaArea = { peces: [P('A', 'A_{\\text{base}}'), rel('q', '='), P('p', '\\pi'), P('r', 'r^2')] };
    const formulaVolum = {
        peces: [P('V', 'V'), rel('q', '='), P('A', 'A_{\\text{base}}'), P('m', '\\cdot', 'op'), P('h', 'h')],
    };
    const liniaRadi = (k, { c, r }) => ({
        peces: [
            P('r', `r_${k}`),
            rel('q', '='),
            fraccio([P('c', texCm(c))], [P('d', '2'), P('p', '\\pi')]),
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
            P('h', texCm(h)),
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
                fraccio([P('c', texCm(c))], [P('d3', '2'), P('p3', '\\pi')]),
            ],
        };
        const simplificada = {
            peces: [P('r', `r_${k}`), rel('q', '='), fraccio([P('c', texCm(c))], [P('d3', '2'), P('p3', '\\pi')])],
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
                D.acaba(`Fes la divisió amb la calculadora: $${texCm(c)} : (2\\pi) \\approx ${num(r)}$.`, {
                    mou: { r: 'r', q: 'q', c: 'c', d: 'd3', p: 'p3' },
                });
            },
        };
    }

    // ---- LA PISSARRA ----

    /** Un volum en litres (V cm³ = V/1000 L): 1051,50 → 1,0515 (tots els decimals, sense zeros al final). */
    const litres = V => texDecimal([Math.round(V * 100), 100000]);

    /**
     * Les files de la pissarra: totes les línies, amb el detall dels dos radis obert. Cilindre 1: plegat, radi (2
     * subpassos), A = πr², A₁, V = A · h, h₁, V₁; cilindre 2: plegat, radi (2), A₂, h₂, V₂; després, quin té més
     * volum, les dues capacitats en litres i la comparació.
     */
    const files = () => 1 + (7 + 2) + (5 + 2) + 4;

    /** El guió (vegeu files). */
    function passos(ex, { oberts = new Set() } = {}) {
        const { a, b, nivell } = ex.dades;
        const vals = valors(ex);
        const g = guio(files(ex));
        const H = historial(g, { prefix: 'C', pinta: pintador(ex), oberts, objectiu: true });
        const { context, pregunta } = TEXTOS_CF.problema(a, b, ex.dades.cilindres);
        // Al nivell 1, que el full és un DIN A4 (21 × 29,7 cm)
        const a4 = nivell === 1 ? ' És un full DIN A4, el de la impressora.' : '';
        H.escriu({ figura: true }, `${context.replace(/\*\*/g, '')}${a4} ${pregunta.replace('en mL', 'en litres')}`);
        // el text del full amb cada costat: a (el de sota) o b (el del costat)
        const costat = x => (x === a ? 'a' : 'b');

        vals.forEach((v, i) => {
            const k = i + 1;
            const { c, h } = v;
            const primer = i === 0;
            // la figura és 1 línia amunt del primer plegat i 8 del segon; l'altura, 6 i 3 línies després
            H.escriu(
                liniaPlegat(k, v),
                `Enrotlla el full unint els costats de ${textCm(h)} cm: el de ${textCm(c)} cm fa la volta i és la longitud de la circumferència de la base, $2\\pi r_${k}$.`,
                { mou: { c: `${costat(c)}@${primer ? 1 : 8}` } }
            );
            H.escriu(
                liniaRadi(k, v),
                `Aïlla el radi: divideix ${textCm(c)} entre $2\\pi$ amb la calculadora i escriu-lo amb 2 decimals.`,
                { mou: { r: 'r', c: 'c', d: 'd', p: 'p' }, ...detallRadi(k, v) }
            );
            if (primer)
                H.escriu(formulaArea, "L'àrea de la base és la d'un cercle: $A_{\\text{base}} = \\pi r^2$.", {
                    mou: { p: 'p' },
                });
            H.escriu(
                liniaArea(k, v),
                `Posa-hi el radi del cilindre ${k} i escriu l'àrea amb 2 decimals.`,
                primer ? { mou: { p: 'p', v: 'v@2' } } : { mou: { v: 'v' } }
            );
            if (primer)
                H.escriu(
                    formulaVolum,
                    "El volum d'un cilindre és l'àrea de la base per l'altura: $V = A_{\\text{base}} \\cdot h$.",
                    { mou: { A: 'A@2' } }
                );
            // l'altura: el costat que queda dret, des del full
            H.escriu(liniaAltura(k, v), `L'altura és el costat que queda dret: ${textCm(h)} cm.`, {
                mou: { hv: `${costat(h)}@${primer ? 6 : 11}` },
            });
            H.escriu(liniaVolum(k, v), `Calcula el volum del cilindre ${k}: l'àrea de la base per l'altura.`, {
                mou: { a: `w@${primer ? 3 : 2}`, h: 'hv' },
            });
        });

        // Quin té més volum: els dos volums hi baixen (V₂ és a la línia anterior; V₁, 6 més amunt)
        const gran = vals[0].V > vals[1].V ? 0 : 1;
        const petit = 1 - gran;
        const desDe = j => (j === 1 ? 'w@1' : 'w@6');
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
        // Les capacitats, en litres: 1 L = 1 dm³ = 1000 cm³
        vals.forEach((v, i) => {
            const k = i + 1;
            H.escriu(
                {
                    peces: [
                        P('C', `\\text{Capacitat del cilindre ${k}}`),
                        rel('ap', '\\approx'),
                        P('w', litres(v.V)),
                        P('u', '\\ \\text{L}'),
                    ],
                },
                k === 1
                    ? `La capacitat, en litres: $1\\ \\text{L} = 1\\ \\text{dm}^3 = 1000\\ \\text{cm}^3$. Divideix el volum entre 1000: $${num(v.V)} : 1000 = ${litres(v.V)}$.`
                    : `I la capacitat de l'altre cilindre: $${num(v.V)} : 1000 = ${litres(v.V)}$.`,
                { mou: { w: `${i === gran ? 'g' : 'l'}@${k}` } }
            );
        });
        // Quantes vegades hi cap: el gran entre el petit (la capacitat del cilindre 2 és a la línia anterior)
        const quoc = vals[gran].V / vals[petit].V;
        const percent = Math.round((quoc - 1) * 100);
        const font = j => `w@${j === 1 ? 1 : 2}`;
        H.escriu(
            {
                peces: [
                    fraccio([P('n', litres(vals[gran].V))], [P('d', litres(vals[petit].V))]),
                    rel('ap', '\\approx'),
                    P('x', num(quoc)),
                ],
            },
            `Compara les capacitats: al cilindre ${gran + 1} hi cap ${num(quoc).replace('{,}', ',')} vegades el que hi cap al cilindre ${petit + 1}, és a dir, ${percent >= 40 && percent <= 60 ? `gairebé la meitat més (un ${percent} % més)` : `un ${percent} % més`}, amb el mateix full.`,
            { mou: { n: font(gran), d: font(petit) }, final: true }
        );
        return g.passos;
    }

    /** Un full nou del nivell (1: el full A4; 2: un altre rectangle). */
    const exercici = nivell => generaPreguntaCF(nivell);

    return Object.freeze({ NIVELLS: [1, 2], exercici, passos, files, valors });
})();
