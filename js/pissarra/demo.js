/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/demo.js
 * ROL: Cinc guions de mostra de la «Resolució pas a pas» (pàgina
 *      pissarra-demo.html): una expressió amb prioritat d'operacions, una
 *      equació de primer grau, una suma de fraccions, el teorema de Pitàgores
 *      (on les lletres i els nombres volen del triangle, un esquema SVG, a la
 *      fórmula) i una equació amb parèntesis amb el detall a demanda (el 2 de
 *      fora es reparteix als dos termes). Serveixen per veure la pissarra
 *      funcionant i de model per als procediments de les activitats.
 * ARQUITECTURA:
 * - Mòdul PUR: cada demo és { id, nom, files, passos(opcions), detall? } i
 *   passos({ oberts }) torna la llista de passos (formules.js guio()), amb els
 *   passos d'«oberts» escrits amb detall (detall: true si la demo en té).
 *   tests/pissarra.test.js comprova que cada guió és correcte, que cada línia
 *   que es veu és certa i, amb detall, totes les vistes (comprovaDetall).
 * - Una idea per pas; el text diu què es fa i per què, en segona persona.
 * - Cada pas escriu una línia nova a sota i les d'abans queden escrites (formules.js historial()):
 *   els símbols que canvien baixen volant de la línia d'abans a la nova.
 * DEPENDÈNCIES: formules.js.
 * ============================================================================
 */
import { guio, linies, historial, P, grup, fraccio } from './formules.js';

/** 3 + 4 · 2: primer la multiplicació, després la suma. */
function passosPrioritat() {
    const g = guio(3);
    const L = linies(g);
    const igual = P('q', '=');
    const linia0 = [P('a', '3'), P('s', '+'), P('b', '4'), P('m', '\\cdot'), P('c', '2')];
    L.escriu(linia0, 'Has de calcular $3 + 4 \\cdot 2$.');
    L.canvia(
        [P('a', '3'), P('s', '+'), grup([P('b', '4'), P('m', '\\cdot'), P('c', '2')], 'actual')],
        'Primer es fa la multiplicació: $4 \\cdot 2$.'
    );
    const linia1 = [P('a', '3'), P('s', '+'), P('p', '8')];
    L.escriu(linia1, '$4 \\cdot 2 = 8$.', { fusiona: { p: ['b', 'm', 'c'] }, anterior: [...linia0, igual] });
    L.escriu([P('r', '11')], 'Ara la suma: $3 + 8 = 11$.', {
        fusiona: { r: ['a', 's', 'p'] },
        anterior: [...linia1, igual],
        final: true,
    });
    return g.passos;
}

/** 2x + 3 = 11: el 3 passa a l'altre membre restant, el 2 passa dividint. */
function passosEquacio() {
    const g = guio(5);
    const L = linies(g);
    const dosX = [P('c', '2'), P('x', 'x')];
    L.escriu([...dosX, P('s', '+'), P('t', '3'), P('q', '='), P('d', '11')], "Resol l'equació $2x + 3 = 11$.");
    L.escriu(
        [...dosX, P('q', '='), P('d', '11'), P('s', '-'), P('t', '3')],
        "El $+3$ passa a l'altre membre restant: $-3$.",
        {
            mou: { s: 's', t: 't' },
        }
    );
    L.escriu([...dosX, P('q', '='), P('e', '8')], '$11 - 3 = 8$.', { fusiona: { e: ['d', 's', 't'] } });
    L.escriu(
        [P('x', 'x'), P('q', '='), fraccio([P('e', '8')], [P('c', '2')])],
        "El $2$ que multiplica la $x$ passa a l'altre membre dividint.",
        { mou: { e: 'e', c: 'c' } }
    );
    L.escriu([P('x', 'x'), P('q', '='), P('v', '4', 'solucio')], '$8 : 2 = 4$. La solució és $x = 4$.', {
        fusiona: { v: ['e', 'c'] },
        final: true,
    });
    return g.passos;
}

/** 1/2 + 1/3: denominador comú, multiplicacions, suma dels numeradors. */
function passosFraccions() {
    const g = guio(5);
    const L = linies(g);
    const igual = P('q', '=');
    const per = (k, f) => [P('m' + k, '\\cdot'), P('f' + k, f, 'tria')];
    const linia0 = [fraccio([P('n1', '1')], [P('d1', '2')]), P('s', '+'), fraccio([P('n2', '1')], [P('d2', '3')])];
    L.escriu(linia0, 'Has de sumar $\\frac{1}{2} + \\frac{1}{3}$: els denominadors són diferents.');
    const linia1 = [
        fraccio([P('n1', '1'), ...per('a', '3')], [P('d1', '2'), ...per('b', '3')]),
        P('s', '+'),
        fraccio([P('n2', '1'), ...per('c', '2')], [P('d2', '3'), ...per('d', '2')]),
    ];
    L.escriu(linia1, 'El denominador comú és $6$: multiplica el numerador i el denominador de cada fracció.', {
        anterior: [...linia0, igual],
    });
    const linia2 = [fraccio([P('N1', '3')], [P('D1', '6')]), P('s', '+'), fraccio([P('N2', '2')], [P('D2', '6')])];
    L.escriu(linia2, 'Fes les multiplicacions.', {
        fusiona: {
            N1: ['n1', 'ma', 'fa'],
            D1: ['d1', 'mb', 'fb'],
            N2: ['n2', 'mc', 'fc'],
            D2: ['d2', 'md', 'fd'],
        },
        anterior: [...linia1, igual],
    });
    const linia3 = [fraccio([P('N1', '3'), P('s', '+'), P('N2', '2')], [P('D', '6')])];
    L.escriu(linia3, 'Amb el mateix denominador, suma els numeradors.', {
        mou: { N1: 'N1', s: 's', N2: 'N2' },
        fusiona: { D: ['D1', 'D2'] },
        anterior: [...linia2, igual],
    });
    L.escriu([fraccio([P('N', '5')], [P('D', '6')])], 'El resultat és $\\frac{5}{6}$.', {
        fusiona: { N: ['N1', 's', 'N2'] },
        mou: { D: 'D' },
        anterior: [...linia3, igual],
        final: true,
    });
    return g.passos;
}

/**
 * El triangle rectangle de la demo de Pitàgores, en SVG. Les lletres (a, b, c) i els catets (6, 8) són
 * <text> amb clau: volen cap a la fórmula com els símbols. Quan un ha volat, al triangle en queda la
 * còpia (la mateixa clau amb una «c» al final).
 *   lletres, nombres: 'originals' o 'copies'
 */
function triangle({ lletres = 'originals', nombres = 'originals' } = {}) {
    const k = (clau, quines) => (quines === 'copies' ? clau + 'c' : clau);
    const lletra = (x, y, clau, t, ancora = 'start') =>
        `<text x="${x}" y="${y}" font-family="KaTeX_Math, 'Times New Roman', serif" font-style="italic" ` +
        `font-size="20" text-anchor="${ancora}" data-k="${k(clau, lletres)}">${t}</text>`;
    const nombre = (x, y, clau, t, ancora) =>
        `<text x="${x}" y="${y}" font-family="KaTeX_Main, 'Times New Roman', serif" font-size="20" ` +
        `text-anchor="${ancora}" data-k="${k(clau, nombres)}">${t}</text>`;
    return (
        '<svg viewBox="0 0 240 152" role="img" aria-label="Triangle rectangle amb els catets b = 6 i c = 8 i la hipotenusa a">' +
        '<path d="M48 22 L48 122 L198 122 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M48 108 L62 108 L62 122" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
        lletra(56, 80, 'fb', 'b') +
        lletra(123, 115, 'fc', 'c', 'middle') +
        lletra(132, 62, 'fa', 'a') +
        nombre(38, 80, 'f6', '6', 'end') +
        nombre(123, 146, 'f8', '8', 'middle') +
        '</svg>'
    );
}

/** Pitàgores: primer la fórmula sola (les lletres volen del triangle), després els catets hi volen. */
function passosPitagores() {
    const g = guio(6);
    const L = linies(g, 1); // fila 0: el triangle; files 1-5: les línies
    const igual = P('q', '=');
    g.files[0] = triangle();
    g.afegeix('El triangle és rectangle: calcula la hipotenusa, $a$.');
    // Les lletres volen del triangle a la fórmula; al triangle en queden les còpies
    g.files[0] = triangle({ lletres: 'copies' });
    let r = L.nombre;
    const linia0 = [P('a', 'a^2'), igual, P('b', 'b^2'), P('s', '+'), P('c', 'c^2')];
    L.escriu(
        linia0,
        'Escriu el teorema de Pitàgores: el quadrat de la hipotenusa és la suma dels quadrats dels catets.',
        {
            extra: {
                reanomena: { [L.clau(r, 'a')]: 'fa', [L.clau(r, 'b')]: 'fb', [L.clau(r, 'c')]: 'fc' },
                copia: { fac: 'fa', fbc: 'fb', fcc: 'fc' },
            },
        }
    );
    // Els catets volen del triangle a la fórmula
    g.files[0] = triangle({ lletres: 'copies', nombres: 'copies' });
    r = L.nombre;
    const linia1 = [P('a', 'a^2'), igual, P('b', '6^2'), P('s', '+'), P('c', '8^2')];
    L.escriu(linia1, 'Substitueix els catets: $b = 6$ i $c = 8$.', {
        mou: { a: 'a', q: 'q', s: 's' },
        extra: {
            reanomena: { [L.clau(r, 'b')]: 'f6', [L.clau(r, 'c')]: 'f8' },
            copia: { f6c: 'f6', f8c: 'f8' },
        },
    });
    const linia2 = [P('a', 'a^2'), igual, P('n36', '36'), P('s', '+'), P('n64', '64')];
    L.escriu(linia2, 'Calcula els quadrats: $6^2 = 36$ i $8^2 = 64$.', {
        mou: { a: 'a', q: 'q', s: 's' },
        fusiona: { n36: ['b'], n64: ['c'] },
    });
    const linia3 = [P('a', 'a^2'), igual, P('n', '100')];
    L.escriu(linia3, 'Suma: $36 + 64 = 100$.', { mou: { a: 'a', q: 'q' }, fusiona: { n: ['n36', 's', 'n64'] } });
    L.escriu(
        [P('a', 'a'), igual, P('r', '\\sqrt{100}'), P('q2', '='), P('v', '10', 'solucio')],
        "Fes l'arrel quadrada (la hipotenusa és positiva): $a = 10$.",
        { mou: { a: 'a', q: 'q', r: 'n' }, final: true }
    );
    return g.passos;
}

/**
 * 2(x + 3) = 14, amb el detall a demanda: la distributiva (el 2 es reparteix als dos termes), passar el
 * +6 a l'altre membre (restar 6 als dos membres) i passar el 2 dividint (dividir els dos membres per 2).
 * Tancada fa 6 línies; amb tot el detall, 10.
 */
function passosParentesis({ oberts = new Set() } = {}) {
    const g = guio(10);
    const H = historial(g, { oberts, objectiu: true });
    const [c, x, q, d] = [P('c', '2'), P('x', 'x'), P('q', '='), P('d', '14')];
    H.escriu([c, P('a', '('), x, P('s', '+'), P('t', '3'), P('b', ')'), q, d], "Resol l'equació $2(x + 3) = 14$.");
    H.escriu(
        [c, x, P('s', '+'), P('n', '6'), q, d],
        'Aplica la propietat distributiva: el $2$ multiplica cada terme del parèntesi.',
        {
            mou: { x: 'x', s: 's', q: 'q', d: 'd' },
            reparteix: { c: ['c', 'n'] },
            fusiona: { n: ['t'] },
            detall: D => {
                D.escriu(
                    [
                        P('c1', '2'),
                        P('m1', '\\cdot'),
                        x,
                        P('s', '+'),
                        P('c2', '2'),
                        P('m2', '\\cdot'),
                        P('t', '3'),
                        q,
                        d,
                    ],
                    'Multiplica el $2$ per cada terme del parèntesi: $2 \\cdot x + 2 \\cdot 3$.',
                    { mou: { x: 'x', s: 's', t: 't', q: 'q', d: 'd' }, reparteix: { c: ['c1', 'c2'] } }
                );
                D.acaba('Fes les multiplicacions: $2 \\cdot x = 2x$ i $2 \\cdot 3 = 6$.', {
                    mou: { c: 'c1', x: 'x', s: 's', q: 'q', d: 'd' },
                    fusiona: { n: ['c2', 'm2', 't'] },
                });
            },
        }
    );
    H.escriu([c, x, q, d, P('s', '-'), P('n', '6')], "El $+6$ passa a l'altre membre restant: $-6$.", {
        mou: { c: 'c', x: 'x', q: 'q', d: 'd', s: 's', n: 'n' },
        detall: D => {
            D.escriu(
                [c, x, P('s', '+'), P('n', '6'), P('s1', '-'), P('n1', '6'), q, d, P('s2', '-'), P('n2', '6')],
                'Resta $6$ als dos membres: la igualtat es manté.',
                { mou: { c: 'c', x: 'x', s: 's', q: 'q', d: 'd' }, reparteix: { n: ['n', 'n1', 'n2'] } }
            );
            D.escriu([c, x, P('s', '+'), P('z', '0'), q, d, P('s2', '-'), P('n2', '6')], '$6 - 6 = 0$.', {
                mou: { c: 'c', x: 'x', s: 's', q: 'q', d: 'd', s2: 's2', n2: 'n2' },
                fusiona: { z: ['n', 's1', 'n1'] },
            });
            D.acaba('Sumar $0$ no canvia res.', { mou: { c: 'c', x: 'x', q: 'q', d: 'd', s: 's2', n: 'n2' } });
        },
    });
    H.escriu([c, x, q, P('e', '8')], '$14 - 6 = 8$.', {
        mou: { c: 'c', x: 'x', q: 'q' },
        fusiona: { e: ['d', 's', 'n'] },
    });
    H.escriu([x, q, fraccio([P('e', '8')], [c])], "El $2$ que multiplica la $x$ passa a l'altre membre dividint.", {
        mou: { x: 'x', q: 'q', e: 'e', c: 'c' },
        detall: D => {
            D.escriu(
                [fraccio([c, x], [P('c1', '2')]), q, fraccio([P('e', '8')], [P('c2', '2')])],
                'Divideix els dos membres per $2$.',
                { mou: { x: 'x', q: 'q', e: 'e' }, reparteix: { c: ['c', 'c1', 'c2'] } }
            );
            D.acaba("A l'esquerra, el $2$ de dalt i el de baix se simplifiquen: queda $x$.", {
                mou: { x: 'x', q: 'q', e: 'e', c: 'c2' },
            });
        },
    });
    H.escriu([x, q, P('v', '4', 'solucio')], '$8 : 2 = 4$. La solució és $x = 4$.', {
        mou: { x: 'x', q: 'q' },
        fusiona: { v: ['e', 'c'] },
        final: true,
    });
    return g.passos;
}

export const DEMOS = Object.freeze([
    Object.freeze({ id: 'prioritat', nom: "Prioritat d'operacions", files: 3, passos: passosPrioritat }),
    Object.freeze({ id: 'equacio', nom: 'Equació de primer grau', files: 5, passos: passosEquacio }),
    Object.freeze({ id: 'fraccions', nom: 'Suma de fraccions', files: 5, passos: passosFraccions }),
    Object.freeze({ id: 'pitagores', nom: 'Teorema de Pitàgores', files: 6, passos: passosPitagores }),
    Object.freeze({
        id: 'parentesis',
        nom: 'Equació amb parèntesis',
        files: 10,
        passos: passosParentesis,
        detall: true,
    }),
]);
