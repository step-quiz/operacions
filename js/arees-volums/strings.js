/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/arees-volums/strings.js
 * ROL: Textos d'«Àrees i volums» (arees-volums.html): noms de les figures, consignes
 *      dels passos, opcions i noms curts per a l'historial. Els missatges dels errors
 *      són a errors.js, i els textos comuns del joc, a js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_AV = {
    element: 'Exercici',

    // [«de» + nom (del triangle, de l'esfera…), nom curt per a l'historial]
    figura: {
        triangle: ['del triangle', 'Triangle'],
        paralelogram: ['del paral·lelogram', 'Paral·lelogram'],
        rombe: ['del rombe', 'Rombe'],
        trapezi: ['del trapezi', 'Trapezi'],
        cercle: ['del cercle', 'Cercle'],
        casa: ['de la figura', 'Rectangle i triangle'],
        forat: ['de la figura', 'Rectangle amb un forat'],
        porta: ['de la figura', 'Rectangle i semicercle'],
        L: ['de la figura', 'Figura en forma de L'],
        ortoedre: ["de l'ortoedre", 'Ortoedre'],
        cilindre: ['del cilindre', 'Cilindre'],
        piramide: ['de la piràmide', 'Piràmide'],
        con: ['del con', 'Con'],
        esfera: ["de l'esfera", 'Esfera'],
    },

    enunciat: {
        area: (nom, pi) => `Calcula l'àrea ${nom}${pi ? ' (π ≈ 3,14)' : ''}.`,
        cos: (nom, pi) => `Calcula l'àrea total i el volum ${nom}${pi ? ' (π ≈ 3,14)' : ''}.`,
        esfera: "Calcula l'àrea i el volum de l'esfera (π ≈ 3,14).",
        formula: "Quina fórmula dona l'àrea?",
        formulaVolum: 'Quina fórmula dona el volum?',
        base: "Quin segment és la base (el costat on cau l'altura)?",
        altura: "Quin segment és l'altura?",
        alturaCos: nom => `Quin segment és l'altura ${nom}?`,
        diagonals: 'Quines són les diagonals?',
        bases: 'Quines són les dues bases (els costats paral·lels)?',
        radi: 'Quant fa el radi?',
        calcul: "Calcula l'àrea.",
        unitat: "En quina unitat s'expressa l'àrea?",
        unitatVolum: "En quina unitat s'expressa el volum?",
        estrategia: "Com es calcula l'àrea d'aquesta figura?",
        part: nom => `Calcula l'àrea ${nom}.`,
        total: "Calcula l'àrea de tota la figura.",
        base3: "Calcula l'àrea de la base.",
        lateral: "Calcula l'àrea lateral (la de les cares del voltant, sense les bases).",
        lateralCorba: "Calcula l'àrea lateral (la de la superfície corba, sense les bases).",
        total3: "Calcula l'àrea total.",
        volum: 'Calcula el volum.',
        areaEsfera: "Calcula l'àrea de l'esfera.",
    },

    // Les parts de les figures compostes: [«de» + nom, subíndex en TeX]
    part: {
        rectangle: ['del rectangle', 'rectangle'],
        triangle: ['del triangle', 'triangle'],
        cercle: ['del cercle', 'cercle'],
        semicercle: ['del semicercle', 'semicercle'],
        gran: ['del rectangle gran', 'gran'],
        tros: ['del tros que falta', 'tros'],
    },

    nomPas: {
        formula: 'fórmula',
        base: 'base',
        altura: 'altura',
        diagonals: 'diagonals',
        bases: 'bases',
        radi: 'radi',
        calcul: 'àrea',
        unitat: 'unitat',
        estrategia: 'com es calcula',
        part1: 'primera part',
        part2: 'segona part',
        total: 'àrea de la figura',
        base3: 'àrea de la base',
        lateral: 'àrea lateral',
        total3: 'àrea total',
        area: 'àrea',
        formulaVolum: 'fórmula del volum',
        volum: 'volum',
    },

    // Les opcions dels passos «Quina fórmula…?» (· multiplica, : divideix)
    formula: {
        bh2: 'base · altura : 2',
        bh: 'base · altura',
        bc: 'base · costat',
        bc2: 'base · costat : 2',
        tres: 'suma dels tres costats',
        quatre: 'suma dels quatre costats',
        perimetre: '2 · (base + costat)',
        Dd2: 'diagonal gran · diagonal petita : 2',
        Dd: 'diagonal gran · diagonal petita',
        cc: 'costat · costat',
        c4: '4 · costat',
        trapezi: '(base gran + base petita) · altura : 2',
        trapeziSense: '(base gran + base petita) · altura',
        trapeziUna: 'base gran · altura',
        cercle: 'π · radi²',
        cercleD: 'π · diàmetre²',
        circumferencia: '2 · π · radi',
        circumferenciaD: 'π · diàmetre',
        esfera: '4 · π · radi³ : 3',
        esferaSense: '4 · π · radi³',
        esferaArea: '4 · π · radi²',
        esferaD: '4 · π · diàmetre³ : 3',
    },

    estrategia: {
        suma: (a, b) => `Sumar l'àrea ${a} i la ${b}`,
        resta: (a, b) => `Restar l'àrea ${b} de la ${a}`,
        multiplica: (a, b) => `Multiplicar l'àrea ${a} per la ${b}`,
    },

    // Paraules de la resolució (TeX)
    tex: {
        base: '\\text{base}',
        altura: '\\text{altura}',
        gran: '\\text{base gran}',
        petita: '\\text{base petita}',
        D: '\\text{diagonal gran}',
        d: '\\text{diagonal petita}',
        radi: '\\text{radi}',
        diagonals: '\\text{diagonals}',
        bases: '\\text{bases}',
    },
    i: 'i',
};
