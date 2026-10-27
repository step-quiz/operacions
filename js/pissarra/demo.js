/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/demo.js
 * ROL: Tres guions de mostra de la «Resolució pas a pas» (pàgina
 *      pissarra-demo.html): una expressió amb prioritat d'operacions, una
 *      equació de primer grau i una suma de fraccions. Serveixen per veure la
 *      pissarra funcionant i de model per als procediments de les activitats.
 * ARQUITECTURA:
 * - Mòdul PUR: cada demo és { id, nom, files, passos() } i passos() torna la
 *   llista de passos (formules.js guio()). tests/pissarra.test.js comprova que
 *   cada guió és correcte i que cada línia que es veu és certa.
 * - Una idea per pas; el text diu què es fa i per què, en segona persona.
 * - Cada pas escriu una línia nova a sota i les d'abans queden escrites (formules.js linies()): els
 *   símbols que canvien baixen volant de la línia d'abans a la nova.
 * DEPENDÈNCIES: formules.js.
 * ============================================================================
 */
import { guio, linies, P, grup, fraccio } from './formules.js';

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

export const DEMOS = Object.freeze([
    Object.freeze({ id: 'prioritat', nom: "Prioritat d'operacions", files: 3, passos: passosPrioritat }),
    Object.freeze({ id: 'equacio', nom: 'Equació de primer grau', files: 5, passos: passosEquacio }),
    Object.freeze({ id: 'fraccions', nom: 'Suma de fraccions', files: 5, passos: passosFraccions }),
]);
