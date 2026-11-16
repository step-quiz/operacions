/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/escala-unitats.js
 * ROL: L'escala de les unitats, comuna (Canvi d'unitats; la poden fer servir altres
 *      activitats de mesura): els graons d'una magnitud, de la unitat més gran (dalt
 *      a l'esquerra) a la més petita (baix a la dreta), amb la unitat de partida i la
 *      d'arribada marcades i la regla a sota («baixar un graó: × 10 · pujar un graó:
 *      : 10»).
 * ARQUITECTURA: mòdul pur (cap DOM): torna el text SVG. Colors del tema de la pàgina
 *      (css/escala-unitats.css): la unitat de partida, --primary; la d'arribada,
 *      --accent. Cada graó porta data-unitat i, si cal, la classe eu-origen o eu-desti
 *      (les proves la tornen a llegir).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const W = 62; // amplada d'un graó
const H = 30; // alçada d'un graó
const MARGE = 8;

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * L'escala d'unes unitats.
 * @param {object} o  { unitats: ['km', 'hm', …] (de la més gran a la més petita), factor: 10 | 100 | 1000
 *                    (el que val cada graó), origen, desti: les posicions marcades (o -1), nom: la magnitud
 *                    (per als lectors de pantalla) }
 */
export function svgEscalaUnitats({ unitats, factor, origen = -1, desti = -1, nom = '' }) {
    const n = unitats.length;
    const ample = MARGE * 2 + n * W;
    const altEscala = MARGE + n * H;
    const alt = altEscala + 58;
    const graons = unitats.map((u, i) => {
        const x = MARGE + i * W;
        const y = MARGE + i * H;
        const classe = ['eu-grao', i === origen ? 'eu-origen' : '', i === desti ? 'eu-desti' : '']
            .filter(Boolean)
            .join(' ');
        // Cada graó és un esglaó: la seva cara de dalt (on hi ha la unitat) i el tros de paret fins a terra
        return (
            `<g class="${classe}" data-unitat="${esc(u)}">` +
            `<rect class="eu-paret" x="${x}" y="${y}" width="${W}" height="${altEscala - y}"/>` +
            `<rect class="eu-cara" x="${x}" y="${y}" width="${W}" height="${H}"/>` +
            `<text class="eu-unitat" x="${x + W / 2}" y="${y + H / 2 + 6}" text-anchor="middle">${esc(u)}</text>` +
            '</g>'
        );
    });
    const regla =
        `<text class="eu-regla" x="${ample / 2}" y="${altEscala + 22}" text-anchor="middle">` +
        `Baixar un graó: × ${factor} · Pujar un graó: : ${factor}</text>`;
    const llegenda = [];
    if (origen >= 0 || desti >= 0) {
        const y = altEscala + 44;
        const peces = [];
        if (origen >= 0) peces.push(['eu-origen', 'unitat de partida']);
        if (desti >= 0) peces.push(['eu-desti', "unitat d'arribada"]);
        const total = peces.length;
        peces.forEach(([classe, text], k) => {
            const cx = ample / 2 + (k - (total - 1) / 2) * 150 - 60;
            llegenda.push(
                `<g class="${classe}"><rect class="eu-cara" x="${cx}" y="${y - 11}" width="14" height="14"/></g>` +
                    `<text class="eu-llegenda" x="${cx + 20}" y="${y + 1}">${esc(text)}</text>`
            );
        });
    }
    const etiqueta = `Escala de les unitats${nom ? ` de ${nom}` : ''}: ${unitats.join(', ')}`;
    return (
        `<svg class="eu" viewBox="0 0 ${ample} ${alt}" width="${ample}" height="${alt}" role="img" ` +
        `aria-label="${esc(etiqueta)}" data-factor="${factor}">` +
        graons.join('') +
        regla +
        llegenda.join('') +
        '</svg>'
    );
}
