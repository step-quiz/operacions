/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/binomial/strings.js
 * ROL: Textos de «Distribució binomial»: els contextos dels problemes, les
 *      consignes dels passos i el perquè de cada error (ERRORS_BI). Les fórmules,
 *      entre $…$ (KaTeX).
 * ============================================================================
 */

const NOMBRES = {
    m: ['cap', 'un', 'dos', 'tres', 'quatre', 'cinc', 'sis'],
    f: ['cap', 'una', 'dues', 'tres', 'quatre', 'cinc', 'sis'],
};
/** «dues peces», «una peça». */
export const quantitat = (k, { g, sg, pl }) => `${NOMBRES[g][k]} ${k === 1 ? sg : pl}`;

/**
 * La part de la pregunta que diu quants èxits: { text, singular, negativa }.
 * r: 'eq' | 'ge' | 'le' | 'gt' | 'lt'.
 */
export function fraseQuants(r, k, n, nom) {
    const { g, sg, pl } = nom;
    const tots = g === 'f' ? 'totes les' : 'tots els';
    if (r === 'eq' && k === 0) return { text: `cap ${sg}`, singular: true, negativa: true };
    if (r === 'eq' && k === n) return { text: `${tots} ${pl}`, singular: false };
    const q = quantitat(k, nom);
    const de = k === 1 ? `d’${NOMBRES[g][1]} ${sg}` : `de ${q}`;
    const text = {
        eq: `exactament ${q}`,
        ge: `almenys ${q}`,
        le: `com a màxim ${q}`,
        gt: `més ${de}`,
        lt: `menys ${de}`,
    }[r];
    return { text, singular: k === 1 || r === 'gt' };
}

/**
 * Els contextos. Cada un: nom (de l'èxit, per comptar), maneres de donar la p (formes) i
 * els textos. p: [numerador, denominador]. pTextos: com s'escriu la p a l'enunciat.
 */
export const CONTEXTOS = [
    {
        id: 'peces',
        nom: { g: 'f', sg: 'peça', pl: 'peces' },
        formes: {
            pc: [2, 4, 5, 8, 10, 15, 20],
            u: [5, 10, 15, 20],
            frac: [
                [1, 20],
                [1, 10],
                [1, 5],
            ],
        },
        intro: (pt, n) =>
            `En una fàbrica, ${pt.pc ? `el ${pt.text} de les peces surten defectuoses` : pt.frac ? `${pt.text} peces surt defectuosa` : `la probabilitat que una peça surti defectuosa és ${pt.text}`}. Es trien ${n} peces a l’atzar.`,
        pregunta: f =>
            `Quina és la probabilitat que ${f.negativa ? `${f.text} no surti` : `${f.text} ${f.singular ? 'surti' : 'surtin'}`} defectuos${f.singular ? 'a' : 'es'}?`,
    },
    {
        id: 'tirs',
        nom: { g: 'm', sg: 'tir', pl: 'tirs' },
        formes: {
            pc: [60, 70, 75, 80, 85],
            u: [60, 70, 75, 80],
            frac: [
                [3, 4],
                [4, 5],
                [2, 3],
            ],
        },
        intro: (pt, n) =>
            `Una jugadora de bàsquet ${pt.pc ? `encerta el ${pt.text} dels tirs lliures` : pt.frac ? `encerta ${pt.text} tirs lliures` : `encerta cada tir lliure amb una probabilitat de ${pt.text}`}. En fa ${n}.`,
        pregunta: f =>
            `Quina és la probabilitat que ${f.negativa ? `${f.text} no entri` : `${f.text} ${f.singular ? 'entri' : 'entrin'}`}?`,
    },
    {
        id: 'llavors',
        nom: { g: 'f', sg: 'llavor', pl: 'llavors' },
        formes: {
            pc: [70, 75, 80, 85, 90],
            u: [70, 80, 90],
            frac: [
                [3, 4],
                [4, 5],
                [9, 10],
            ],
        },
        intro: (pt, n) =>
            `${pt.pc ? `El ${pt.text} de les llavors d’un sobre germinen` : pt.frac ? `De les llavors d’un sobre, en germinen ${pt.text}` : `Cada llavor d’un sobre germina amb una probabilitat de ${pt.text}`}. Se’n planten ${n}.`,
        pregunta: f =>
            `Quina és la probabilitat que ${f.negativa ? `${f.text} no germini` : `${f.text} ${f.singular ? 'germini' : 'germinin'}`}?`,
    },
    {
        id: 'vacuna',
        nom: { g: 'f', sg: 'persona', pl: 'persones' },
        formes: {
            pc: [5, 10, 15, 20, 25],
            u: [10, 15, 20, 25],
            frac: [
                [1, 10],
                [1, 5],
                [1, 4],
            ],
        },
        intro: (pt, n) =>
            `Una vacuna provoca febre lleu ${pt.pc ? `al ${pt.text} de les persones` : pt.frac ? `a ${pt.text} persones` : `amb una probabilitat de ${pt.text}`}. Es vacunen ${n} persones.`,
        pregunta: f =>
            `Quina és la probabilitat que ${f.negativa ? `${f.text} no tingui` : `${f.text} ${f.singular ? 'tingui' : 'tinguin'}`} febre?`,
    },
    {
        id: 'test',
        nom: { g: 'f', sg: 'resposta', pl: 'respostes' },
        formes: {
            frac: [
                [1, 4],
                [1, 3],
            ],
        },
        intro: (pt, n, p) =>
            `Un test té ${n} preguntes, i cada pregunta té ${p[1]} respostes de les quals només una és correcta. Una persona les contesta totes a l’atzar.`,
        pregunta: f =>
            `Quina és la probabilitat que ${f.negativa ? `${f.text} no sigui correcta` : `${f.text} ${f.singular ? 'sigui correcta' : 'siguin correctes'}`}?`,
    },
    {
        id: 'dau',
        nom: { g: 'f', sg: 'vegada', pl: 'vegades' },
        formes: { frac: [[1, 6]] },
        intro: (pt, n) => `Es llança un dau ${n} vegades.`,
        pregunta: f =>
            f.negativa
                ? 'Quina és la probabilitat que no surti cap sis?'
                : `Quina és la probabilitat que surti un sis ${f.text}?`,
    },
    {
        id: 'moneda',
        nom: { g: 'f', sg: 'vegada', pl: 'vegades' },
        formes: { frac: [[1, 2]] },
        intro: (pt, n) => `Es llança una moneda ${n} vegades.`,
        pregunta: f =>
            f.negativa
                ? 'Quina és la probabilitat que no surti cap cara?'
                : `Quina és la probabilitat que surti cara ${f.text}?`,
    },
];

export const TEXTOS_BI = {
    element: 'Problema',
    enunciat: {
        dades: 'Identifica el nombre de repeticions $n$, la probabilitat d’èxit $p$ (en tant per u) i $q = 1 - p$.',
        dadesFraccio: 'Identifica $n$, la probabilitat d’èxit $p$ i $q = 1 - p$ (en fracció).',
        pregunta: 'Si $X$ compta els èxits, com s’escriu la pregunta?',
        cami: 'Com la calcularàs? Si el contrari té menys casos, fes-ho pel contrari: $P(A) = 1 - P(\\text{no } A)$.',
        cas: (n, k) =>
            `Calcula $\\binom{${n}}{${k}}$ i $P(X = ${k}) = \\binom{n}{k}\\, p^{k}\\, q^{n-k}$ (amb 4 decimals).`,
        finalU: 'Ara la resposta: la probabilitat, amb 4 decimals.',
        finalPc: 'Ara la resposta, en tant per cent (com a l’enunciat), amb 2 decimals.',
    },
    nota: {
        percent: 'p en tant per u: per exemple, 15 % = 0,15.',
        fraccio: 'Si el resultat és un nombre enter, deixa el denominador en blanc.',
        decimals: 'Arrodoneix a 4 decimals: 0,23730 → 0,2373.',
        percentFinal: 'Per passar a tant per cent, multiplica per 100: 0,4219 → 42,19 %.',
    },
    nomPas: {
        dades: 'n, p i q',
        pregunta: 'la pregunta',
        cami: 'el camí',
        cas: 'un cas',
        final: 'la resposta',
    },
    ok: 'Molt bé!',
};

/** El perquè de cada error: etiqueta (historial) i missatge. */
export const ERRORS_BI = {
    BI_N_K: {
        etiqueta: 'n confós amb k',
        missatge:
            'n és el nombre de repeticions (quantes vegades es fa l’experiment), no el nombre d’èxits de la pregunta.',
    },
    BI_N: { etiqueta: 'n', missatge: 'Compta quantes vegades es repeteix l’experiment: aquest és n.' },
    BI_PERCENT: {
        etiqueta: 'p sense passar a tant per u',
        missatge: 'Una probabilitat va de 0 a 1: un tant per cent es divideix per 100 (15 % = 0,15).',
    },
    BI_PERCENT_DEC: {
        etiqueta: 'p dividida per 10',
        missatge: 'Per passar un tant per cent a tant per u es divideix per 100, no per 10: 15 % = 0,15.',
    },
    BI_P: {
        etiqueta: 'p',
        missatge: 'p és la probabilitat de l’èxit, el que compta la pregunta. Torna a llegir l’enunciat.',
    },
    BI_P_FRACASSOS: {
        etiqueta: 'p i q intercanviades',
        missatge:
            'Has posat la probabilitat del fracàs. L’èxit és el que compta la pregunta: la seva probabilitat és p.',
    },
    BI_Q_P: { etiqueta: 'q = p', missatge: 'q és la probabilitat del fracàs: q = 1 − p.' },
    BI_Q: { etiqueta: 'q', missatge: 'Calcula q = 1 − p amb compte.' },
    BI_ALMENYS: {
        etiqueta: '«almenys» com a «més de»',
        missatge: '«Almenys k» vol dir k o més: P(X ≥ k). «Més de k» seria P(X > k), sense el k.',
    },
    BI_MAXIM: {
        etiqueta: '«com a màxim» com a «menys de»',
        missatge: '«Com a màxim k» vol dir k o menys: P(X ≤ k). «Menys de k» seria P(X < k), sense el k.',
    },
    BI_MES_DE: {
        etiqueta: '«més de» com a «almenys»',
        missatge: '«Més de k» no inclou el k: P(X > k) = P(X ≥ k + 1).',
    },
    BI_MENYS_DE: {
        etiqueta: '«menys de» com a «com a màxim»',
        missatge: '«Menys de k» no inclou el k: P(X < k) = P(X ≤ k − 1).',
    },
    BI_SENTIT: {
        etiqueta: 'desigualtat al revés',
        missatge:
            'Mira cap a on va: «almenys» i «més de» són valors grans (≥, >); «com a màxim» i «menys de», petits (≤, <).',
    },
    BI_EXACTE: {
        etiqueta: 'una desigualtat com a «exactament»',
        missatge: 'La pregunta no demana un sol valor: inclou tots els valors que compleixen la condició.',
    },
    BI_EXACTE_DESIG: {
        etiqueta: '«exactament» com a desigualtat',
        missatge: '«Exactament k» és un sol valor: P(X = k).',
    },
    BI_CAP: {
        etiqueta: '«cap»',
        missatge: '«Cap» vol dir zero èxits: P(X = 0).',
    },
    BI_TOTS: {
        etiqueta: '«tots»',
        missatge: '«Tots» vol dir n èxits: P(X = n).',
    },
    BI_CONTRARI_LIMIT: {
        etiqueta: 'el contrari mal fet',
        missatge: 'El contrari de «X ≥ k» és «X ≤ k − 1» (o «X < k»): el k no hi entra. P(X ≥ k) = 1 − P(X ≤ k − 1).',
    },
    BI_LIMIT: {
        etiqueta: 'el límit sí o no',
        missatge: 'Revisa si el valor k hi entra: amb ≥ i ≤ sí; amb > i < no.',
    },
    BI_OBLIDA_0: {
        etiqueta: 'oblidat el cas 0',
        missatge: 'X també pot valer 0 (cap èxit): «com a màxim 2» és 0, 1 i 2.',
    },
    BI_CASOS: {
        etiqueta: 'casos',
        missatge: 'Escriu tots els valors de X, de 0 a n, i marca els que compleixen la condició.',
    },
    BI_COMBINATORI: {
        etiqueta: 'nombre combinatori',
        missatge: 'C(n, k) = n! / (k! · (n − k)!). Amb la calculadora, la tecla nCr.',
    },
    BI_SENSE_C: {
        etiqueta: 'sense el nombre combinatori',
        missatge: 'Falta multiplicar per C(n, k): són les maneres de triar en quines repeticions hi ha els k èxits.',
    },
    BI_EXPONENTS: {
        etiqueta: 'exponents intercanviats',
        missatge: 'p va elevat al nombre d’èxits (k) i q al de fracassos (n − k): pᵏ · qⁿ⁻ᵏ.',
    },
    BI_OBLIDA_Q: {
        etiqueta: 'oblidat qⁿ⁻ᵏ',
        missatge: 'A més dels k èxits, hi ha n − k fracassos: cal multiplicar també per qⁿ⁻ᵏ.',
    },
    BI_CALCUL: {
        etiqueta: 'càlcul',
        missatge:
            'Torna a fer el càlcul: C(n, k) · pᵏ · qⁿ⁻ᵏ, amb parèntesis a la calculadora, i arrodoneix a 4 decimals.',
    },
    BI_OBLIDA_1MENYS: {
        etiqueta: 'oblidat el 1 −',
        missatge: 'Has calculat la probabilitat del contrari. La resposta és 1 menys aquesta suma.',
    },
    BI_PERCENT_FINAL: {
        etiqueta: 'resposta sense passar a %',
        missatge: 'L’enunciat parla en tant per cent: multiplica la probabilitat per 100 (0,4219 → 42,19 %).',
    },
    BI_SUMA: {
        etiqueta: 'suma',
        missatge: 'Suma les probabilitats de tots els casos (i, si vas pel contrari, resta-ho d’1).',
    },
};
