/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/cataleg.js
 * ROL: Les fórmules de «Fórmules STEAM» (formules-steam.html): fórmules que surten
 *      quan estudiem el món que ens envolta. Per a cada fórmula: el nom, la matèria
 *      (física, química o tecnologia: el David, 24/11/2026, en canvi de la decisió del
 *      17/11 de no dir-ho enlloc), l'equació (en la notació que llegeix algebra.js), les
 *      lletres (TeX i significat), com es generen uns valors que encaixen (genera) i, per
 *      a cada lletra que es pot aïllar, el context (sempre n'hi ha un), les unitats i les
 *      unitats equivocades típiques.
 *   MATERIES     [[clau, nom]]: física, química i tecnologia (l'electricitat i les màquines són
 *                de tecnologia); cada fórmula en porta una (materia).
 * ARQUITECTURA: mòdul pur (l'atzar, a través de utils.js). Els valors són coeficients
 *      exactes (js/algebra/racionals.js): els decimals amb coma surten exactes.
 *   unitats      { lletra: [text, TeX] } (la unitat de cada lletra en aquest context)
 *   dolentes     les unitats equivocades de la lletra aïllada (les opcions del pas final)
 *   text(v, f)   el context; v: els valors, f(lletra): el valor escrit amb coma
 * DEPENDÈNCIES: utils.js, algebra/racionals.js.
 * ============================================================================
 */

import { pick, randInt } from '../utils.js';
import { coeficient, producteCoef, quocientCoef, sumaCoef } from '../algebra/racionals.js';

const c = (n, d = 1) => coeficient(n, d);
const per = (...xs) => xs.reduce((a, b) => producteCoef(a, b), 1);
const entre = (a, b) => quocientCoef(a, b);
const mes = (a, b) => sumaCoef(a, b);
const rang = (a, b, pas = 1) => Array.from({ length: Math.floor((b - a) / pas) + 1 }, (_, i) => a + i * pas);
const dec = (llista, d) => pick(llista) / d; // per als rangs decimals: dec([5,10,15], 10) → 0,5…
const cd = (n, d) => c(Math.round(n * d), d);
const G = c(98, 10); // g = 9,8 m/s²
const u = (text, tex = `\\text{${text}}`) => [text, tex];

/** Les matèries, en aquest ordre (la resolució pas a pas i l'activitat deixen triar-ne una). */
export const MATERIES = Object.freeze([
    ['fisica', 'Física'],
    ['quimica', 'Química'],
    ['tecnologia', 'Tecnologia'],
]);

/** Algunes substàncies i la seva massa molar (g/mol), per als contextos de química. */
const SUBSTANCIES = [
    [18, "l'aigua", "d'aigua"],
    [44, 'el diòxid de carboni', 'de diòxid de carboni'],
    [180, 'la glucosa', 'de glucosa'],
    [32, "l'oxigen", "d'oxigen"],
    [40, "l'hidròxid de sodi", "d'hidròxid de sodi"],
    [58.5, 'el clorur de sodi', 'de clorur de sodi'],
];
/** La substància d'una massa molar escrita amb coma («58,5»). */
const substancia = text => SUBSTANCIES.find(([m]) => String(m).replace('.', ',') === text) || SUBSTANCIES[0];
const majuscula = t => t.charAt(0).toUpperCase() + t.slice(1);

export const FORMULES = [
    {
        id: 'densitat',
        nom: 'Densitat',
        materia: 'fisica',
        eq: 'd = m/V',
        lletres: { d: ['d', 'la densitat'], m: ['m', 'la massa'], V: ['V', 'el volum'] },
        genera: () => {
            const d = cd(pick([0.8, 1, 2.7, 7.9, 8.9, 11.3, 19.3]), 10);
            const V = c(randInt(2, 30) * 5);
            return { d, V, m: per(d, V) };
        },
        aillar: {
            m: {
                unitats: { d: u('g/cm³', '\\text{g/cm}^3'), m: u('g'), V: u('cm³', '\\text{cm}^3') },
                dolentes: ['g/cm³', 'cm³', 'g·cm³'],
                text: (v, f) => `Una peça d'un metall de densitat ${f('d')} g/cm³ ocupa ${f('V')} cm³. Quina massa té?`,
            },
            V: {
                unitats: { d: u('g/cm³', '\\text{g/cm}^3'), m: u('g'), V: u('cm³', '\\text{cm}^3') },
                dolentes: ['g', 'g/cm³', 'g²/cm³'],
                text: (v, f) =>
                    `Una anella de ${f('m')} g és d'un material de densitat ${f('d')} g/cm³. Quin volum ocupa?`,
            },
        },
    },
    {
        id: 'velocitat',
        nom: 'Velocitat mitjana',
        materia: 'fisica',
        eq: 'v = Δx/Δt',
        lletres: {
            v: ['v', 'la velocitat'],
            Δx: ['\\Delta x', 'la distància recorreguda'],
            Δt: ['\\Delta t', 'el temps'],
        },
        genera: () => {
            const v = c(pick(rang(30, 120, 10)));
            const Δt = cd(dec([5, 10, 15, 20, 25, 30, 40], 10), 10);
            return { v, Δt, Δx: per(v, Δt) };
        },
        aillar: {
            Δx: {
                unitats: { v: u('km/h'), Δx: u('km'), Δt: u('h') },
                dolentes: ['km/h', 'h', 'km/h²'],
                text: (v, f) =>
                    `Un autobús circula a una velocitat mitjana de ${f('v')} km/h durant ${f('Δt')} h. Quina distància recorre?`,
            },
            Δt: {
                unitats: { v: u('km/h'), Δx: u('km'), Δt: u('h') },
                dolentes: ['km/h', 'km·h', 'h/km'],
                text: (v, f) =>
                    `Un tren recorre ${f('Δx')} km a una velocitat mitjana de ${f('v')} km/h. Quant de temps hi tarda?`,
            },
        },
    },
    {
        id: 'newton',
        nom: 'Segona llei de Newton',
        materia: 'fisica',
        eq: 'F = m*a',
        lletres: { F: ['F', 'la força'], m: ['m', 'la massa'], a: ['a', "l'acceleració"] },
        genera: () => {
            const m = c(pick(rang(2, 80)));
            const a = cd(dec(rang(5, 60, 5), 10), 10);
            return { m, a, F: per(m, a) };
        },
        aillar: {
            m: {
                unitats: { F: u('N'), m: u('kg'), a: u('m/s²', '\\text{m/s}^2') },
                dolentes: ['N', 'N·m/s²', 'm/s²'],
                text: (v, f) =>
                    `Empenyem un carretó amb una força de ${f('F')} N i accelera ${f('a')} m/s². Quina massa té?`,
            },
            a: {
                unitats: { F: u('N'), m: u('kg'), a: u('m/s²', '\\text{m/s}^2') },
                dolentes: ['N', 'kg/N', 'N·kg'],
                text: (v, f) =>
                    `Sobre una moto de ${f('m')} kg actua una força neta de ${f('F')} N. Quina acceleració té?`,
            },
        },
    },
    {
        id: 'hooke',
        nom: 'Llei de Hooke',
        materia: 'fisica',
        eq: 'F = k*Δx',
        lletres: { F: ['F', 'la força'], k: ['k', 'la constant de la molla'], Δx: ['\\Delta x', "l'allargament"] },
        genera: () => {
            const k = c(pick(rang(50, 500, 50)));
            const Δx = cd(dec(rang(2, 20, 2), 100), 100);
            return { k, Δx, F: per(k, Δx) };
        },
        aillar: {
            k: {
                unitats: { F: u('N'), k: u('N/m'), Δx: u('m') },
                dolentes: ['N', 'N·m', 'm/N'],
                text: (v, f) =>
                    `Pengem un pes de ${f('F')} N d'una molla i s'allarga ${f('Δx')} m. Quina és la constant de la molla?`,
            },
            Δx: {
                unitats: { F: u('N'), k: u('N/m'), Δx: u('m') },
                dolentes: ['N', 'N/m', 'N²/m'],
                text: (v, f) =>
                    `Una molla té una constant de ${f('k')} N/m. Quant s'allarga si hi pengem un pes de ${f('F')} N?`,
            },
        },
    },
    {
        id: 'ohm',
        nom: "Llei d'Ohm",
        materia: 'tecnologia',
        eq: 'V = I*R',
        lletres: { V: ['V', 'la tensió'], I: ['I', 'la intensitat'], R: ['R', 'la resistència'] },
        genera: () => {
            const R = c(pick([10, 20, 30, 40, 50, 60, 80, 100, 220, 470]));
            const I = cd(dec(rang(1, 20), 10), 10);
            return { R, I, V: per(I, R) };
        },
        aillar: {
            I: {
                unitats: { V: u('V'), I: u('A'), R: u('Ω', '\\Omega') },
                dolentes: ['V', 'Ω', 'V·Ω'],
                text: (v, f) =>
                    `Connectem una resistència de ${f('R')} Ω a una pila de ${f('V')} V. Quina intensitat hi circula?`,
            },
            R: {
                unitats: { V: u('V'), I: u('A'), R: u('Ω', '\\Omega') },
                dolentes: ['A', 'V', 'V·A'],
                text: (v, f) => `Una bombeta connectada a ${f('V')} V deixa passar ${f('I')} A. Quina resistència té?`,
            },
        },
    },
    {
        id: 'kelvin',
        nom: 'Kelvin i graus Celsius',
        materia: 'fisica',
        eq: 'T = t + 273',
        lletres: { T: ['T', 'la temperatura en kelvin'], t: ['t', 'la temperatura en graus Celsius'] },
        genera: () => {
            const t = c(randInt(5, 95));
            return { t, T: mes(t, 273) };
        },
        aillar: {
            t: {
                unitats: { T: u('K'), t: u('°C', '{}^\\circ\\text{C}') },
                dolentes: ['K', '°F', 'K/°C'],
                text: (v, f) =>
                    `Un termòmetre de laboratori marca ${f('T')} K. Quina temperatura és, en graus Celsius?`,
            },
        },
    },
    {
        id: 'acceleracio',
        nom: 'Acceleració',
        materia: 'fisica',
        eq: 'a = (v - v₀)/t',
        lletres: {
            'a': ['a', "l'acceleració"],
            'v': ['v', 'la velocitat final'],
            'v₀': ['v_0', 'la velocitat inicial'],
            't': ['t', 'el temps'],
        },
        genera: () => {
            const v0 = c(pick(rang(2, 20, 2)));
            const a = cd(dec(rang(5, 40, 5), 10), 10);
            const t = c(pick(rang(2, 12, 2)));
            return { 'v₀': v0, a, t, 'v': mes(v0, per(a, t)) };
        },
        aillar: {
            'v': {
                unitats: { 'a': u('m/s²', '\\text{m/s}^2'), 'v': u('m/s'), 'v₀': u('m/s'), 't': u('s') },
                dolentes: ['m/s²', 's', 'm·s'],
                text: (v, f) =>
                    `Un cotxe va a ${f('v₀')} m/s i accelera ${f('a')} m/s² durant ${f('t')} s. A quina velocitat va al final?`,
            },
            't': {
                unitats: { 'a': u('m/s²', '\\text{m/s}^2'), 'v': u('m/s'), 'v₀': u('m/s'), 't': u('s') },
                dolentes: ['m/s', 'm/s²', 's²'],
                text: (v, f) =>
                    `Una moto passa de ${f('v₀')} m/s a ${f('v')} m/s amb una acceleració de ${f('a')} m/s². Quant de temps ha estat accelerant?`,
            },
            'v₀': {
                unitats: { 'a': u('m/s²', '\\text{m/s}^2'), 'v': u('m/s'), 'v₀': u('m/s'), 't': u('s') },
                dolentes: ['m/s²', 's', 'm'],
                text: (v, f) =>
                    `Una bicicleta accelera ${f('a')} m/s² durant ${f('t')} s i arriba a ${f('v')} m/s. Quina velocitat tenia al principi?`,
            },
        },
    },
    {
        id: 'mrua',
        nom: 'Velocitat en un moviment accelerat',
        materia: 'fisica',
        eq: 'v = v₀ + a*t',
        lletres: {
            'v': ['v', 'la velocitat final'],
            'v₀': ['v_0', 'la velocitat inicial'],
            'a': ['a', "l'acceleració"],
            't': ['t', 'el temps'],
        },
        genera: () => {
            const v0 = c(pick(rang(2, 20, 2)));
            const a = cd(dec(rang(5, 40, 5), 10), 10);
            const t = c(pick(rang(2, 12, 2)));
            return { 'v₀': v0, a, t, 'v': mes(v0, per(a, t)) };
        },
        aillar: {
            'a': {
                unitats: { 'a': u('m/s²', '\\text{m/s}^2'), 'v': u('m/s'), 'v₀': u('m/s'), 't': u('s') },
                dolentes: ['m/s', 'm', 's/m'],
                text: (v, f) =>
                    `Un tren surt a ${f('v₀')} m/s i, al cap de ${f('t')} s, va a ${f('v')} m/s. Quina acceleració ha tingut?`,
            },
            't': {
                unitats: { 'a': u('m/s²', '\\text{m/s}^2'), 'v': u('m/s'), 'v₀': u('m/s'), 't': u('s') },
                dolentes: ['m/s', 's²', 'm'],
                text: (v, f) =>
                    `Un avió que va a ${f('v₀')} m/s accelera ${f('a')} m/s² fins a ${f('v')} m/s. Quant de temps triga?`,
            },
            'v₀': {
                unitats: { 'a': u('m/s²', '\\text{m/s}^2'), 'v': u('m/s'), 'v₀': u('m/s'), 't': u('s') },
                dolentes: ['m/s²', 's', 'm'],
                text: (v, f) =>
                    `Un patinet accelera ${f('a')} m/s² durant ${f('t')} s i acaba a ${f('v')} m/s. Amb quina velocitat ha començat?`,
            },
        },
    },
    {
        id: 'pes',
        nom: 'Pes',
        materia: 'fisica',
        eq: 'P = m*g',
        lletres: { P: ['P', 'el pes'], m: ['m', 'la massa'], g: ['g', 'la gravetat'] },
        genera: () => {
            const m = c(pick(rang(2, 90)));
            const g = pick([G, G, c(162, 100), c(371, 100)]);
            return { m, g, P: per(m, g) };
        },
        aillar: {
            m: {
                unitats: { P: u('N'), m: u('kg'), g: u('m/s²', '\\text{m/s}^2') },
                dolentes: ['N', 'N·m/s²', 'm/s²'],
                text: (v, f) =>
                    `Una maleta pesa ${f('P')} N en un lloc on la gravetat és de ${f('g')} m/s². Quina massa té?`,
            },
            g: {
                unitats: { P: u('N'), m: u('kg'), g: u('m/s²', '\\text{m/s}^2') },
                dolentes: ['N', 'kg/N', 'N·kg'],
                text: (v, f) =>
                    `Un robot de ${f('m')} kg pesa ${f('P')} N en un altre planeta. Quant hi val la gravetat?`,
            },
        },
    },
    {
        id: 'pressio',
        nom: 'Pressió',
        materia: 'fisica',
        eq: 'p = F/S',
        lletres: { p: ['p', 'la pressió'], F: ['F', 'la força'], S: ['S', 'la superfície'] },
        genera: () => {
            const S = cd(pick([0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 2]), 100);
            const F = c(pick(rang(100, 2000, 50)));
            return { S, F, p: entre(F, S) };
        },
        aillar: {
            F: {
                unitats: { p: u('Pa'), F: u('N'), S: u('m²', '\\text{m}^2') },
                dolentes: ['Pa', 'Pa/m²', 'm²'],
                text: (v, f) =>
                    `Una caixa fa una pressió de ${f('p')} Pa sobre una superfície de ${f('S')} m². Quina força fa?`,
            },
            S: {
                unitats: { p: u('Pa'), F: u('N'), S: u('m²', '\\text{m}^2') },
                dolentes: ['N', 'Pa', 'N·Pa'],
                text: (v, f) =>
                    `Una persona de ${f('F')} N de pes fa una pressió de ${f('p')} Pa sobre la neu. Quina superfície trepitja?`,
            },
        },
    },
    {
        id: 'potencial',
        nom: 'Energia potencial',
        materia: 'fisica',
        eq: 'Ep = m*g*h',
        lletres: {
            Ep: ['E_p', "l'energia potencial"],
            m: ['m', 'la massa'],
            g: ['g', 'la gravetat'],
            h: ['h', "l'altura"],
        },
        genera: () => {
            const m = c(pick(rang(1, 60)));
            const h = c(pick(rang(2, 50)));
            return { m, h, g: G, Ep: per(m, G, h) };
        },
        aillar: {
            h: {
                unitats: { Ep: u('J'), m: u('kg'), g: u('m/s²', '\\text{m/s}^2'), h: u('m') },
                dolentes: ['J', 'J/kg', 'kg·m'],
                text: (v, f) =>
                    `Una pilota de ${f('m')} kg té ${f('Ep')} J d'energia potencial (g = ${f('g')} m/s²). A quina altura és?`,
            },
            m: {
                unitats: { Ep: u('J'), m: u('kg'), g: u('m/s²', '\\text{m/s}^2'), h: u('m') },
                dolentes: ['J', 'J/m', 'N'],
                text: (v, f) =>
                    `Un test a ${f('h')} m d'altura té ${f('Ep')} J d'energia potencial (g = ${f('g')} m/s²). Quina massa té?`,
            },
        },
    },
    {
        id: 'cinetica',
        nom: 'Energia cinètica',
        materia: 'fisica',
        eq: 'Ec = m*v^2/2',
        lletres: { Ec: ['E_c', "l'energia cinètica"], m: ['m', 'la massa'], v: ['v', 'la velocitat'] },
        genera: () => {
            const m = c(pick(rang(2, 100, 2)));
            const v = c(pick(rang(2, 30)));
            return { m, v, Ec: entre(per(m, v, v), 2) };
        },
        aillar: {
            m: {
                unitats: { Ec: u('J'), m: u('kg'), v: u('m/s') },
                dolentes: ['J', 'J·s/m', 'm/s'],
                text: (v, f) =>
                    `Un ciclista que va a ${f('v')} m/s té ${f('Ec')} J d'energia cinètica. Quina massa té, amb la bici?`,
            },
            v: {
                unitats: { Ec: u('J'), m: u('kg'), v: u('m/s') },
                dolentes: ['m²/s²', 'J', 'J/kg'],
                text: (v, f) => `Un carretó de ${f('m')} kg té ${f('Ec')} J d'energia cinètica. A quina velocitat va?`,
            },
        },
    },
    {
        id: 'treball',
        nom: 'Treball',
        materia: 'fisica',
        eq: 'W = F*d',
        lletres: { W: ['W', 'el treball'], F: ['F', 'la força'], d: ['d', 'la distància'] },
        genera: () => {
            const F = c(pick(rang(10, 500, 10)));
            const d = c(pick(rang(2, 40)));
            return { F, d, W: per(F, d) };
        },
        aillar: {
            F: {
                unitats: { W: u('J'), F: u('N'), d: u('m') },
                dolentes: ['J', 'J·m', 'm'],
                text: (v, f) => `Per arrossegar una caixa ${f('d')} m fem un treball de ${f('W')} J. Quina força fem?`,
            },
            d: {
                unitats: { W: u('J'), F: u('N'), d: u('m') },
                dolentes: ['N', 'J', 'J·N'],
                text: (v, f) =>
                    `Amb una força de ${f('F')} N fem un treball de ${f('W')} J empenyent un sofà. Quina distància l'hem mogut?`,
            },
        },
    },
    {
        id: 'potencia',
        nom: 'Potència',
        materia: 'fisica',
        eq: 'P = W/t',
        lletres: { P: ['P', 'la potència'], W: ['W', 'el treball'], t: ['t', 'el temps'] },
        genera: () => {
            const P = c(pick(rang(50, 2000, 50)));
            const t = c(pick(rang(2, 60, 2)));
            return { P, t, W: per(P, t) };
        },
        aillar: {
            W: {
                unitats: { P: u('W'), W: u('J'), t: u('s') },
                dolentes: ['W', 'W/s', 's'],
                text: (v, f) => `Una grua de ${f('P')} W funciona durant ${f('t')} s. Quin treball fa?`,
            },
            t: {
                unitats: { P: u('W'), W: u('J'), t: u('s') },
                dolentes: ['W', 'J·W', 'W/J'],
                text: (v, f) =>
                    `Un motor de ${f('P')} W fa un treball de ${f('W')} J. Quant de temps ha estat funcionant?`,
            },
        },
    },
    {
        id: 'calor',
        nom: 'Calor',
        materia: 'fisica',
        eq: 'Q = m*c*ΔT',
        lletres: {
            Q: ['Q', 'la calor'],
            m: ['m', 'la massa'],
            c: ['c', 'la calor específica'],
            ΔT: ['\\Delta T', "l'augment de temperatura"],
        },
        genera: () => {
            const c0 = c(pick([4180, 900, 450, 390]));
            const m = cd(dec(rang(1, 20), 10), 10);
            const ΔT = c(pick(rang(5, 80, 5)));
            return { c: c0, m, ΔT, Q: per(m, c0, ΔT) };
        },
        aillar: {
            ΔT: {
                unitats: {
                    Q: u('J'),
                    m: u('kg'),
                    c: u('J/(kg·°C)', '\\text{J/(kg}\\cdot{}^\\circ\\text{C)}'),
                    ΔT: u('°C', '{}^\\circ\\text{C}'),
                },
                dolentes: ['J', 'J/kg', 'kg·°C'],
                text: (v, f) =>
                    `Escalfem ${f('m')} kg d'aigua (calor específica: ${f('c')} J/(kg·°C)) donant-li ${f('Q')} J. Quants graus puja la temperatura?`,
            },
            m: {
                unitats: {
                    Q: u('J'),
                    m: u('kg'),
                    c: u('J/(kg·°C)', '\\text{J/(kg}\\cdot{}^\\circ\\text{C)}'),
                    ΔT: u('°C', '{}^\\circ\\text{C}'),
                },
                dolentes: ['J', 'J/°C', '°C'],
                text: (v, f) =>
                    `Per escalfar ${f('ΔT')} °C una peça d'un metall de calor específica ${f('c')} J/(kg·°C) calen ${f('Q')} J. Quina massa té?`,
            },
        },
    },
    {
        id: 'electrica',
        nom: 'Potència elèctrica',
        materia: 'tecnologia',
        eq: 'P = V*I',
        lletres: { P: ['P', 'la potència'], V: ['V', 'la tensió'], I: ['I', 'la intensitat'] },
        genera: () => {
            const V = cd(pick([4.5, 9, 12, 24, 230]), 10);
            const I = cd(dec(rang(1, 50), 10), 10);
            return { V, I, P: per(V, I) };
        },
        aillar: {
            I: {
                unitats: { P: u('W'), V: u('V'), I: u('A') },
                dolentes: ['W', 'V', 'W·V'],
                text: (v, f) => `Una estufa de ${f('P')} W està connectada a ${f('V')} V. Quina intensitat consumeix?`,
            },
            V: {
                unitats: { P: u('W'), V: u('V'), I: u('A') },
                dolentes: ['W', 'A', 'W·A'],
                text: (v, f) => `Un motor de joguina de ${f('P')} W consumeix ${f('I')} A. A quina tensió funciona?`,
            },
        },
    },
    {
        id: 'energia',
        nom: 'Energia consumida',
        materia: 'tecnologia',
        eq: 'E = P*t',
        lletres: { E: ['E', "l'energia"], P: ['P', 'la potència'], t: ['t', 'el temps'] },
        genera: () => {
            const P = cd(dec(rang(1, 30), 10), 10);
            const t = c(pick(rang(1, 12)));
            return { P, t, E: per(P, t) };
        },
        aillar: {
            t: {
                unitats: { E: u('kWh'), P: u('kW'), t: u('h') },
                dolentes: ['kW', 'kWh/kW²', 'kWh·kW'],
                text: (v, f) => `Una rentadora de ${f('P')} kW ha consumit ${f('E')} kWh. Quantes hores ha funcionat?`,
            },
            P: {
                unitats: { E: u('kWh'), P: u('kW'), t: u('h') },
                dolentes: ['kWh', 'h', 'kWh·h'],
                text: (v, f) => `Un forn ha consumit ${f('E')} kWh en ${f('t')} h. Quina potència té?`,
            },
        },
    },
    {
        id: 'palanca',
        nom: 'Llei de la palanca',
        materia: 'tecnologia',
        eq: 'F*d = R*r',
        lletres: {
            F: ['F', 'la força'],
            d: ['d', 'el braç de la força'],
            R: ['R', 'la resistència'],
            r: ['r', 'el braç de la resistència'],
        },
        genera: () => {
            const R = c(pick(rang(50, 600, 50)));
            const r = cd(dec(rang(1, 10), 10), 10);
            const d = cd(dec(rang(5, 30, 5), 10), 10);
            return { R, r, d, F: entre(per(R, r), d) };
        },
        aillar: {
            F: {
                unitats: { F: u('N'), d: u('m'), R: u('N'), r: u('m') },
                dolentes: ['m', 'N·m', 'N/m'],
                text: (v, f) =>
                    `Amb una palanca volem aixecar una pedra de ${f('R')} N que és a ${f('r')} m del punt de suport. Si empenyem a ${f('d')} m del suport, quina força hem de fer?`,
            },
            d: {
                unitats: { F: u('N'), d: u('m'), R: u('N'), r: u('m') },
                dolentes: ['N', 'N·m', 'm/N'],
                text: (v, f) =>
                    `Per aixecar ${f('R')} N situats a ${f('r')} m del punt de suport fem una força de ${f('F')} N. A quina distància del suport empenyem?`,
            },
        },
    },
    {
        id: 'politges',
        nom: 'Politges',
        materia: 'tecnologia',
        eq: 'n₁*d₁ = n₂*d₂',
        lletres: {
            'n₁': ['n_1', 'la velocitat de la politja motora'],
            'd₁': ['d_1', 'el diàmetre de la politja motora'],
            'n₂': ['n_2', 'la velocitat de la politja conduïda'],
            'd₂': ['d_2', 'el diàmetre de la politja conduïda'],
        },
        genera: () => {
            const d2 = c(pick(rang(5, 40, 5)));
            const d1 = c(pick(rang(5, 40, 5)));
            const n2 = c(pick(rang(100, 1200, 100)));
            return { 'd₁': d1, 'd₂': d2, 'n₂': n2, 'n₁': entre(per(n2, d2), d1) };
        },
        aillar: {
            'n₂': {
                unitats: { 'n₁': u('rpm'), 'd₁': u('cm'), 'n₂': u('rpm'), 'd₂': u('cm') },
                dolentes: ['cm', 'rpm·cm', 'cm/rpm'],
                text: (v, f) =>
                    `Un motor fa girar a ${f('n₁')} rpm una politja de ${f('d₁')} cm de diàmetre, unida amb una corretja a una altra de ${f('d₂')} cm. A quina velocitat gira la segona?`,
            },
            'd₂': {
                unitats: { 'n₁': u('rpm'), 'd₁': u('cm'), 'n₂': u('rpm'), 'd₂': u('cm') },
                dolentes: ['rpm', 'rpm·cm', 'rpm/cm'],
                text: (v, f) =>
                    `Una politja de ${f('d₁')} cm gira a ${f('n₁')} rpm. Quin diàmetre ha de tenir la politja conduïda perquè giri a ${f('n₂')} rpm?`,
            },
        },
    },
    {
        id: 'engranatges',
        nom: 'Engranatges',
        materia: 'tecnologia',
        eq: 'n₁*z₁ = n₂*z₂',
        lletres: {
            'n₁': ['n_1', 'la velocitat de la roda motora'],
            'z₁': ['z_1', 'les dents de la roda motora'],
            'n₂': ['n_2', 'la velocitat de la roda conduïda'],
            'z₂': ['z_2', 'les dents de la roda conduïda'],
        },
        genera: () => {
            const z1 = c(pick(rang(10, 60, 5)));
            const z2 = c(pick(rang(10, 60, 5)));
            const n2 = c(pick(rang(30, 600, 30)));
            return { 'z₁': z1, 'z₂': z2, 'n₂': n2, 'n₁': entre(per(n2, z2), z1) };
        },
        aillar: {
            'n₂': {
                unitats: { 'n₁': u('rpm'), 'z₁': u('dents'), 'n₂': u('rpm'), 'z₂': u('dents') },
                dolentes: ['dents', 'rpm·dents', 'dents/rpm'],
                text: (v, f) =>
                    `Una roda dentada de ${f('z₁')} dents gira a ${f('n₁')} rpm i fa girar una altra de ${f('z₂')} dents. A quina velocitat gira la segona?`,
            },
            'z₁': {
                unitats: { 'n₁': u('rpm'), 'z₁': u('dents'), 'n₂': u('rpm'), 'z₂': u('dents') },
                dolentes: ['rpm', 'rpm/dents', 'rpm·dents'],
                text: (v, f) =>
                    `La roda motora gira a ${f('n₁')} rpm i la conduïda, de ${f('z₂')} dents, a ${f('n₂')} rpm. Quantes dents té la roda motora?`,
            },
        },
    },
    {
        id: 'rendiment',
        nom: 'Rendiment',
        materia: 'tecnologia',
        eq: 'η = Pu/Pa',
        lletres: {
            η: ['\\eta', 'el rendiment'],
            Pu: ['P_u', 'la potència útil'],
            Pa: ['P_a', 'la potència absorbida'],
        },
        genera: () => {
            const Pa = c(pick(rang(100, 2000, 100)));
            const η = cd(dec(rang(20, 95, 5), 100), 100);
            return { Pa, η, Pu: per(η, Pa) };
        },
        aillar: {
            Pu: {
                unitats: { η: u('(sense unitats)', '\\text{(sense unitats)}'), Pu: u('W'), Pa: u('W') },
                dolentes: ['W²', '%', 'W/s'],
                text: (v, f) =>
                    `Un motor absorbeix ${f('Pa')} W i té un rendiment de ${f('η')}. Quina potència útil dona?`,
            },
            Pa: {
                unitats: { η: u('(sense unitats)', '\\text{(sense unitats)}'), Pu: u('W'), Pa: u('W') },
                dolentes: ['W²', '%', '1/W'],
                text: (v, f) =>
                    `Una bomba d'aigua dona ${f('Pu')} W útils i té un rendiment de ${f('η')}. Quina potència absorbeix?`,
            },
        },
    },
    {
        id: 'posicio',
        nom: 'Posició en un moviment accelerat',
        materia: 'fisica',
        eq: 'x = x₀ + v₀*t + a*t^2/2',
        lletres: {
            'x': ['x', 'la posició final'],
            'x₀': ['x_0', 'la posició inicial'],
            'v₀': ['v_0', 'la velocitat inicial'],
            'a': ['a', "l'acceleració"],
            't': ['t', 'el temps'],
        },
        genera: () => {
            const x0 = c(pick(rang(5, 50, 5)));
            const v0 = c(pick(rang(1, 10)));
            const a = c(pick(rang(1, 6)));
            const t = c(pick(rang(2, 10, 2)));
            return { 'x₀': x0, 'v₀': v0, a, t, 'x': mes(mes(x0, per(v0, t)), entre(per(a, t, t), 2)) };
        },
        aillar: {
            'a': {
                unitats: { 'x': u('m'), 'x₀': u('m'), 'v₀': u('m/s'), 'a': u('m/s²', '\\text{m/s}^2'), 't': u('s') },
                dolentes: ['m/s', 'm', 'm·s²'],
                text: (v, f) =>
                    `Un cotxe és a ${f('x₀')} m de la sortida i va a ${f('v₀')} m/s. Al cap de ${f('t')} s és a ${f('x')} m. Quina acceleració té?`,
            },
            'x₀': {
                unitats: { 'x': u('m'), 'x₀': u('m'), 'v₀': u('m/s'), 'a': u('m/s²', '\\text{m/s}^2'), 't': u('s') },
                dolentes: ['m/s', 's', 'm/s²'],
                text: (v, f) =>
                    `Un corredor va a ${f('v₀')} m/s i accelera ${f('a')} m/s². Al cap de ${f('t')} s és a ${f('x')} m de la sortida. On era al principi?`,
            },
        },
    },
    {
        id: 'paralel',
        nom: 'Resistències en paral·lel',
        materia: 'tecnologia',
        eq: '1/R = 1/R₁ + 1/R₂',
        lletres: {
            'R': ['R', 'la resistència equivalent'],
            'R₁': ['R_1', 'la primera resistència'],
            'R₂': ['R_2', 'la segona resistència'],
        },
        genera: () => {
            const [r1, r2, r] = pick([
                [3, 6, 2],
                [4, 12, 3],
                [6, 12, 4],
                [10, 15, 6],
                [20, 30, 12],
                [10, 10, 5],
                [20, 20, 10],
                [12, 24, 8],
                [30, 60, 20],
                [40, 60, 24],
            ]);
            return pick([true, false])
                ? { 'R₁': c(r1), 'R₂': c(r2), 'R': c(r) }
                : { 'R₁': c(r2), 'R₂': c(r1), 'R': c(r) };
        },
        aillar: {
            'R': {
                unitats: { 'R': u('Ω', '\\Omega'), 'R₁': u('Ω', '\\Omega'), 'R₂': u('Ω', '\\Omega') },
                dolentes: ['1/Ω', 'Ω²', 'Ω/2'],
                text: (v, f) =>
                    `Connectem en paral·lel dues resistències de ${f('R₁')} Ω i ${f('R₂')} Ω. Quina és la resistència equivalent?`,
            },
            'R₁': {
                unitats: { 'R': u('Ω', '\\Omega'), 'R₁': u('Ω', '\\Omega'), 'R₂': u('Ω', '\\Omega') },
                dolentes: ['1/Ω', 'Ω²', 'Ω/2'],
                text: (v, f) =>
                    `Amb una resistència de ${f('R₂')} Ω en paral·lel, volem una resistència equivalent de ${f('R')} Ω. Quina resistència hi hem de posar?`,
            },
        },
    },
    {
        id: 'concentracio',
        nom: 'Concentració en massa',
        materia: 'quimica',
        eq: 'c = m/V',
        lletres: { c: ['c', 'la concentració'], m: ['m', 'la massa de solut'], V: ['V', 'el volum de la dissolució'] },
        genera: () => {
            const c0 = c(pick([2, 4, 5, 8, 10, 20, 25, 40]));
            const V = cd(pick([0.25, 0.5, 0.75, 1.5, 2, 2.5, 3]), 100);
            return { c: c0, V, m: per(c0, V) };
        },
        aillar: {
            m: {
                unitats: { c: u('g/L'), m: u('g'), V: u('L') },
                dolentes: ['g/L', 'L', 'g·L'],
                text: (v, f) =>
                    `Volem preparar una dissolució de sucre en aigua de concentració ${f('c')} g/L. Si en fem ${f('V')} L, quina massa de sucre hi hem de dissoldre?`,
            },
            V: {
                unitats: { c: u('g/L'), m: u('g'), V: u('L') },
                dolentes: ['g', 'g/L', 'g²/L'],
                text: (v, f) =>
                    `Una dissolució de sal en aigua té una concentració de ${f('c')} g/L i conté ${f('m')} g de sal. Quin volum de dissolució tenim?`,
            },
        },
    },
    {
        id: 'mols',
        nom: 'Quantitat de substància (mols)',
        materia: 'quimica',
        eq: 'n = m/M',
        lletres: { n: ['n', 'la quantitat de substància'], m: ['m', 'la massa'], M: ['M', 'la massa molar'] },
        genera: () => {
            const [massa] = pick(SUBSTANCIES);
            const M = cd(massa, 10);
            const n = cd(pick([0.5, 1.5, 2, 2.5, 3, 4, 5]), 10);
            return { M, n, m: per(n, M) };
        },
        aillar: {
            m: {
                unitats: { n: u('mol'), m: u('g'), M: u('g/mol') },
                dolentes: ['mol', 'g/mol', 'mol²'],
                text: (v, f) => {
                    const [, nom, de] = substancia(f('M'));
                    return `Tenim ${f('n')} mol ${de}. ${majuscula(nom)} té una massa molar de ${f('M')} g/mol. Quina massa en tenim?`;
                },
            },
            M: {
                unitats: { n: u('mol'), m: u('g'), M: u('g/mol') },
                dolentes: ['g·mol', 'mol/g', 'g'],
                text: (v, f) =>
                    `Tenim ${f('n')} mol d'una substància que té una massa de ${f('m')} g. Quina és la seva massa molar?`,
            },
        },
    },
    {
        id: 'molaritat',
        nom: 'Molaritat',
        materia: 'quimica',
        eq: 'M = n/V',
        lletres: { M: ['M', 'la molaritat'], n: ['n', 'la quantitat de solut'], V: ['V', 'el volum de la dissolució'] },
        genera: () => {
            const M = cd(pick([0.1, 0.4, 1.5, 3, 6]), 10);
            const V = cd(pick([0.25, 0.5, 2, 2.5]), 100);
            return { M, V, n: per(M, V) };
        },
        aillar: {
            n: {
                unitats: { M: u('mol/L'), n: u('mol'), V: u('L') },
                dolentes: ['mol/L', 'L', 'mol·L'],
                text: (v, f) =>
                    `Al laboratori tenim ${f('V')} L d'una dissolució d'àcid clorhídric de concentració ${f('M')} mol/L. Quants mols d'àcid hi ha dissolts?`,
            },
            V: {
                unitats: { M: u('mol/L'), n: u('mol'), V: u('L') },
                dolentes: ['mol', 'mol/L', 'mol²/L'],
                text: (v, f) =>
                    `Volem preparar una dissolució de sucre de concentració ${f('M')} mol/L i tenim ${f('n')} mol de sucre. Quin volum de dissolució en podem fer?`,
            },
        },
    },
    {
        id: 'boyle',
        nom: 'Llei de Boyle',
        materia: 'quimica',
        eq: 'p₁*V₁ = p₂*V₂',
        lletres: {
            'p₁': ['p_1', 'la pressió inicial'],
            'V₁': ['V_1', 'el volum inicial'],
            'p₂': ['p_2', 'la pressió final'],
            'V₂': ['V_2', 'el volum final'],
        },
        genera: () => {
            const p1 = cd(pick([1, 1.5, 2]), 10);
            const V1 = c(pick([6, 12, 24, 36]));
            const k = cd(pick([2, 3, 4, 0.5]), 10);
            return { 'p₁': p1, 'V₁': V1, 'p₂': per(p1, k), 'V₂': entre(V1, k) };
        },
        aillar: {
            'V₂': {
                unitats: { 'p₁': u('atm'), 'V₁': u('L'), 'p₂': u('atm'), 'V₂': u('L') },
                dolentes: ['atm', 'atm·L', 'L/atm'],
                text: (v, f) =>
                    `Un gas és a una pressió de ${f('p₁')} atm i ocupa ${f('V₁')} L. Si, sense canviar la temperatura, la pressió passa a ${f('p₂')} atm, quin volum ocuparà?`,
            },
            'p₂': {
                unitats: { 'p₁': u('atm'), 'V₁': u('L'), 'p₂': u('atm'), 'V₂': u('L') },
                dolentes: ['L', 'atm·L', 'atm/L'],
                text: (v, f) =>
                    `Un gas és a una pressió de ${f('p₁')} atm i ocupa ${f('V₁')} L. Si, sense canviar la temperatura, el volum passa a ${f('V₂')} L, quina pressió tindrà?`,
            },
        },
    },
];

/** Les lletres d'una fórmula (els noms que llegeix algebra.js). */
export const nomsDe = f => Object.keys(f.lletres);
/** El TeX de cada lletra d'una fórmula: { nom: tex }. */
export const texDe = f => Object.fromEntries(Object.entries(f.lletres).map(([n, [tex]]) => [n, tex]));
