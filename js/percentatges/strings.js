/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/percentatges/strings.js
 * ROL: Textos de «Percentatges» (percentatges.html): enunciats dels problemes,
 *      consignes dels passos i productes de la botiga. Els missatges dels errors
 *      són a errors.js, i els textos comuns del joc, a js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM). Els enunciats són funcions de les dades
 *      (els nombres ja escrits amb coma decimal).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const majuscula = t => t.charAt(0).toUpperCase() + t.slice(1);

export const TEXTOS_PE = {
    element: 'Problema',

    // Productes de la botiga: preu en euros [mínim, màxim]; pl: plural (concordança del verb)
    productes: [
        { nom: 'una samarreta', pl: false, preu: [12, 40] },
        { nom: 'uns pantalons', pl: true, preu: [25, 60] },
        { nom: 'unes sabatilles', pl: true, preu: [40, 120] },
        { nom: 'una jaqueta', pl: false, preu: [50, 150] },
        { nom: 'uns auriculars', pl: true, preu: [20, 90] },
        { nom: 'una motxilla', pl: false, preu: [20, 60] },
        { nom: 'una bicicleta', pl: false, preu: [150, 400] },
        { nom: 'un patinet', pl: false, preu: [80, 300] },
        { nom: 'un joc de taula', pl: false, preu: [20, 70] },
        { nom: 'un llibre', pl: false, preu: [10, 30] },
    ],

    problema: {
        calcul: ({ p, q }) => `Calcula el ${p} % de ${q}.`,
        descompte: ({ prod, p, q }) =>
            `${majuscula(prod.nom)} de ${q} € ${prod.pl ? 'tenen' : 'té'} un descompte del ${p} %. Quants euros de descompte són?`,
        rebaixa: ({ prod, p, q }) =>
            `${majuscula(prod.nom)} de ${q} € ${prod.pl ? 'tenen' : 'té'} una rebaixa del ${p} %. Quant ${prod.pl ? 'costen' : 'costa'} ara?`,
        augment: ({ p, q }) => `Un preu de ${q} € puja un ${p} %. Quin és el preu nou?`,
        abansRebaixa: ({ prod, p, f }) =>
            `Després d'una rebaixa del ${p} %, ${prod.nom} ${prod.pl ? 'costen' : 'costa'} ${f} €. Quant ${prod.pl ? 'costaven' : 'costava'} abans?`,
        abansAugment: ({ p, f }) => `Després de pujar un ${p} %, un preu és de ${f} €. Quin era el preu d'abans?`,
        part: [
            ({ a, t }) => `En una classe de ${t} alumnes, ${a} porten ulleres. Quin percentatge representen?`,
            ({ a, t }) => `En una enquesta a ${t} persones, ${a} prefereixen el bàsquet. Quin percentatge representen?`,
            ({ a, t }) => `D'un hort de ${t} m², se n'han sembrat ${a} m². Quin percentatge de l'hort s'ha sembrat?`,
        ],
        encadenats: ({ canvi1, p1, canvi2, p2 }) =>
            `El preu d'un producte ${canvi1} un ${p1} % i, després, ${canvi2} un ${p2} %. Quina és la variació total?`,
    },
    puja: 'puja',
    baixa: 'baixa',

    enunciat: {
        decimal: 'Escriu el percentatge com a nombre decimal.',
        fraccio: 'Escriu el percentatge com a fracció irreductible.',
        resultat: 'Calcula-ho.',
        index: "Per quant es multiplica? (l'índex de variació)",
        index1: 'Índex de variació del primer canvi:',
        index2: 'Índex de variació del segon canvi:',
        final: 'Multiplica per l’índex.',
        inicial: 'Desfés el canvi: divideix per l’índex.',
        quocient: 'Divideix la part entre el total.',
        percent: 'Passa-ho a percentatge.',
        total: 'Els índexs encadenats es multipliquen.',
        variacio: 'Quina és la variació total?',
    },
    nomPas: {
        decimal: 'percentatge en decimal',
        fraccio: 'percentatge en fracció',
        resultat: 'resultat',
        index: 'índex de variació',
        index1: 'primer índex',
        index2: 'segon índex',
        final: 'resultat',
        inicial: "quantitat d'abans",
        quocient: 'part entre total',
        percent: 'percentatge',
        total: 'índex total',
        variacio: 'variació total',
    },
};
