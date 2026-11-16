/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccio-decimal-percentatge/strings.js
 * ROL: Textos de «Fracció, decimal i percentatge» (fraccio-decimal-percentatge.html).
 *      Els missatges dels errors típics són a errors.js, i els textos comuns del
 *      joc, a js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_FD = {
    // Capçalera del joc: «Nombre 2 de 8»
    element: 'Nombre',
    titol: { fraccio: 'Fracció', decimal: 'Decimal', percentatge: 'Percentatge', dibuix: 'Dibuix' },
    enunciat: {
        a: 'Arrossega cada targeta a la seva casella (o toca-la i després toca la casella).',
        b: 'Escriu el mateix nombre de les altres maneres.',
    },
    nomPas: 'quatre maneres',
    nota: {
        b: 'La fracció, irreductible. Al dibuix, toca les parts per pintar-les.',
        periode: 'La fracció, irreductible. Si el decimal és periòdic, escriu el període a la casella petita.',
    },
};
