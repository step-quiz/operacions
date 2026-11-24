/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/cilindres/strings.js
 * ROL: Textos de «Cilindres amb un full» (cilindres.html): el problema, les consignes,
 *      les opcions i les línies que queden escrites. «Volum» amb cm³ i «capacitat» amb mL
 *      (decisió del David, 23/11/2026). Els missatges dels errors són a errors.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

/** Una mida del full amb coma decimal: 29.7 → «29,7» (text) i «29{,}7» (TeX). */
export const textCm = v => String(v).replace('.', ',');
export const texCm = v => String(v).replace('.', '{,}');

export const TEXTOS_CF = {
    element: 'Full',
    formules: 'Fórmules',
    /** L'enllaç a la «Resolució pas a pas». */
    enllac: 'Mira com es resol un full com aquest ↗',
    /** La targeta «Problema»: quins costats s'uneixen per fer cada cilindre. */
    problema: (a, b, cil) => {
        const unint = k => {
            // s'uneixen els costats que fan d'altura (els de llargada h): el costat c fa la volta
            const { c, h } = cil[k];
            return `unint els costats de ${textCm(h)} cm (el costat de ${textCm(c)} cm fa la volta)`;
        };
        return {
            context: `Tens un full de **${textCm(a)} cm** × **${textCm(b)} cm**. L’enrotlles per fer un cilindre sense tapes, de dues maneres: el cilindre 1, ${unint(0)}, i el cilindre 2, ${unint(1)}.`,
            pregunta: 'Quin dels dos cilindres té més volum? Quina capacitat té cadascun, en mL?',
        };
    },
    figura: (a, b) => `El full de ${textCm(a)} cm per ${textCm(b)} cm i els dos cilindres que se’n fan`,
    nomCilindre: k => `cilindre ${k}`,
    enunciat: {
        plegat: (k, costat) => `Al cilindre ${k}, en què es converteix el costat de ${textCm(costat)} cm?`,
        radi: k => `El radi de la base del cilindre ${k}. Escriu-lo amb 2 decimals.`,
        area: k => `L’àrea de la base del cilindre ${k}. Escriu-la amb 2 decimals.`,
        volum: k => `El volum del cilindre ${k}. Escriu-lo amb 2 decimals.`,
        compara: 'Quin cilindre té més volum?',
        capacitat: k => `Quina capacitat té el cilindre ${k}, en mL?`,
    },
    plegat: {
        circumferencia: 'En la longitud de la circumferència de la base',
        diametre: 'En el diàmetre de la base',
        radi: 'En el radi de la base',
        altura: 'En l’altura del cilindre',
    },
    liniaPlegat: (k, costat, circ) =>
        circ
            ? `\\text{Cilindre ${k}: } 2\\pi r_${k} = ${texCm(costat)}\\ \\text{cm}`
            : `\\text{Cilindre ${k}: } h_${k} = ${texCm(costat)}\\ \\text{cm}`,
    compara: { c1: 'El cilindre 1', c2: 'El cilindre 2', igual: 'Tots dos tenen el mateix volum' },
    liniaCompara: k => `\\text{El cilindre ${k} té més volum.}`,
    nomPas: {
        plegat: 'plegat',
        radi: 'radi',
        area: 'àrea de la base',
        volum: 'volum',
        compara: 'quin té més volum',
        capacitat: 'capacitat',
    },
    nota: {
        decimals: 'Amb la calculadora; escriu el resultat amb 2 decimals i coma (p. ex. 3,34).',
        capacitat: 'El volum es mesura en cm³; la capacitat, en mL: 1 cm³ correspon a 1 mL.',
    },
};
