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
 * DEPENDÈNCIES: formules.js.
 * ============================================================================
 */
import { clau, op, rel, marca, guio } from './formules.js';

const K = clau;

/** 3 + 4 · 2: primer la multiplicació, després la suma. */
function passosPrioritat() {
    const g = guio(1);
    const producte = K('b', '4') + op('m', '\\cdot') + K('c', '2');
    g.files[0] = K('a', '3') + op('s', '+') + producte;
    g.afegeix('Has de calcular $3 + 4 \\cdot 2$.');
    g.files[0] = K('a', '3') + op('s', '+') + marca(producte, 'actual');
    g.afegeix('Primer es fa la multiplicació: $4 \\cdot 2$.');
    g.files[0] = K('a', '3') + op('s', '+') + K('p', '8');
    g.afegeix('$4 \\cdot 2 = 8$.', { fusiona: { p: ['b', 'm', 'c'] } });
    g.files[0] = K('r', '11');
    g.classes[0] = 'final';
    g.afegeix('Ara la suma: $3 + 8 = 11$.', { fusiona: { r: ['a', 's', 'p'] } });
    return g.passos;
}

/** 2x + 3 = 11: el 3 passa a l'altre membre restant, el 2 passa dividint. */
function passosEquacio() {
    const g = guio(1);
    const xIgual = K('x', 'x') + rel('q', '=');
    g.files[0] = K('c', '2') + K('x', 'x') + op('s', '+') + K('t', '3') + rel('q', '=') + K('d', '11');
    g.afegeix("Resol l'equació $2x + 3 = 11$.");
    g.files[0] = K('c', '2') + K('x', 'x') + rel('q', '=') + K('d', '11') + op('s', '-') + K('t', '3');
    g.afegeix("El $+3$ passa a l'altre membre restant: $-3$.");
    g.files[0] = K('c', '2') + K('x', 'x') + rel('q', '=') + K('e', '8');
    g.afegeix('$11 - 3 = 8$.', { fusiona: { e: ['d', 's', 't'] } });
    g.files[0] = xIgual + `\\dfrac{${K('e', '8')}}{${K('c', '2')}}`;
    g.afegeix("El $2$ que multiplica la $x$ passa a l'altre membre dividint.");
    g.files[0] = xIgual + K('v', '4', 'solucio');
    g.classes[0] = 'final';
    g.afegeix('$8 : 2 = 4$. La solució és $x = 4$.', { fusiona: { v: ['e', 'c'] } });
    return g.passos;
}

/** 1/2 + 1/3: denominador comú, multiplicacions, suma dels numeradors. */
function passosFraccions() {
    const g = guio(1);
    const fr = (n, d) => `\\dfrac{${n}}{${d}}`;
    const per = (k, f) => op('m' + k, '\\cdot') + K('f' + k, f, 'tria');
    g.files[0] = fr(K('n1', '1'), K('d1', '2')) + op('s', '+') + fr(K('n2', '1'), K('d2', '3'));
    g.afegeix('Has de sumar $\\frac{1}{2} + \\frac{1}{3}$: els denominadors són diferents.');
    g.files[0] =
        fr(K('n1', '1') + per('a', '3'), K('d1', '2') + per('b', '3')) +
        op('s', '+') +
        fr(K('n2', '1') + per('c', '2'), K('d2', '3') + per('d', '2'));
    g.afegeix('El denominador comú és $6$: multiplica el numerador i el denominador de cada fracció.');
    g.files[0] = fr(K('N1', '3'), K('D1', '6')) + op('s', '+') + fr(K('N2', '2'), K('D2', '6'));
    g.afegeix('Fes les multiplicacions.', {
        fusiona: {
            N1: ['n1', 'ma', 'fa'],
            D1: ['d1', 'mb', 'fb'],
            N2: ['n2', 'mc', 'fc'],
            D2: ['d2', 'md', 'fd'],
        },
    });
    g.files[0] = fr(K('N1', '3') + op('s', '+') + K('N2', '2'), K('D', '6'));
    g.afegeix('Amb el mateix denominador, suma els numeradors.', { fusiona: { D: ['D1', 'D2'] } });
    g.files[0] = fr(K('N', '5'), K('D', '6'));
    g.classes[0] = 'final';
    g.afegeix('El resultat és $\\frac{5}{6}$.', { fusiona: { N: ['N1', 's', 'N2'] } });
    return g.passos;
}

export const DEMOS = Object.freeze([
    Object.freeze({ id: 'prioritat', nom: "Prioritat d'operacions", files: 1, passos: passosPrioritat }),
    Object.freeze({ id: 'equacio', nom: 'Equació de primer grau', files: 1, passos: passosEquacio }),
    Object.freeze({ id: 'fraccions', nom: 'Suma de fraccions', files: 1, passos: passosFraccions }),
]);
