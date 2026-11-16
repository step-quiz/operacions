/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/figura-fraccio.js
 * ROL: Dibuix d'una fracció: un o més cercles dividits en parts iguals, amb unes
 *      quantes parts pintades. El fa servir el joc de passos (js/passos/joc-passos.js)
 *      per a les figures que es donen i per a les que pinta l'alumne (camp 'pintat').
 * ARQUITECTURA: mòdul pur: torna el codi SVG com a text (cap DOM). Cada part és un
 *      <path> (o un <circle>, si la unitat no es divideix) amb data-part="i" i la
 *      classe jp-part (més jp-ple si està pintada).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const r2 = x => Math.round(x * 100) / 100;

/**
 * @param {object} f   parts: en quantes parts es divideix cada unitat · unitats: quants cercles ·
 *                     pintades: quantes parts estan pintades (comptant d'un cercle a l'altre)
 * @returns {string} SVG
 */
export function svgFiguraFraccio({ parts, unitats = 1, pintades = 0, mida = 84 }) {
    const marge = 10;
    const r = mida / 2 - 3;
    let cos = '';
    for (let u = 0; u < unitats; u++) {
        const [cx, cy] = [u * (mida + marge) + mida / 2, mida / 2];
        for (let i = 0; i < parts; i++) {
            const k = u * parts + i;
            const classe = `jp-part${k < pintades ? ' jp-ple' : ''}`;
            if (parts === 1) {
                cos += `<circle class="${classe}" data-part="${k}" cx="${cx}" cy="${cy}" r="${r}"/>`;
                continue;
            }
            const [a0, a1] = [i, i + 1].map(j => ((-90 + (j * 360) / parts) * Math.PI) / 180);
            const [x0, y0, x1, y1] = [
                cx + r * Math.cos(a0),
                cy + r * Math.sin(a0),
                cx + r * Math.cos(a1),
                cy + r * Math.sin(a1),
            ];
            const gran = 360 / parts > 180 ? 1 : 0;
            cos += `<path class="${classe}" data-part="${k}" d="M${cx} ${cy}L${r2(x0)} ${r2(y0)}A${r} ${r} 0 ${gran} 1 ${r2(x1)} ${r2(y1)}Z"/>`;
        }
    }
    const ample = unitats * (mida + marge) - marge;
    return `<svg class="jp-figura" viewBox="0 0 ${ample} ${mida}" width="${ample}" height="${mida}" role="img" aria-label="${pintades} de ${parts * unitats} parts pintades">${cos}</svg>`;
}
