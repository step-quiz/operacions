/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/recta-intervals.js
 * ROL: La recta numèrica amb intervals, comuna (lliurament 17, Inequacions; el 22 la
 *      tornarà a fer servir): marques amb el seu nombre, un punt ple (hi entra) o buit
 *      (no hi entra) i la semirecta cap a un costat. El joc de passos
 *      (js/passos/joc-passos.js, camp 'recta') la fa interactiva: l'alumne toca una
 *      marca, tria si el punt hi entra i cap a quin costat va la semirecta.
 * ARQUITECTURA: mòdul pur (torna text SVG; cap DOM).
 *   svgRecta({ marques: [{ v, text }], punt: { i, ple } | null, costat: 'esq' | 'dre' | null,
 *              interactiva })
 *     marques   en ordre creixent; v: el valor (un nombre, per situar-la), text: el que s'hi
 *               escriu (p. ex. «5/2»); les marques que no són enteres van una mica més amunt
 *     punt      i: l'índex de la marca on és el punt
 *     interactiva  cada marca porta una zona per tocar (class jp-r-toc, data-i)
 *   Els colors són classes (css/passos.css): jp-r-eix, jp-r-marca, jp-r-raig, jp-r-punt.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const AMPLE = 560;
const MARGE = 40;
const ALT = 78;
const Y = 34;

/** La recta en SVG (vegeu la capçalera). */
export function svgRecta({ marques, punt = null, costat = null, interactiva = false }) {
    const min = marques[0].v;
    const max = marques[marques.length - 1].v;
    const x = v => MARGE + ((v - min) / (max - min || 1)) * (AMPLE - 2 * MARGE);
    const parts = [];
    parts.push(
        `<svg class="jp-recta-svg" viewBox="0 0 ${AMPLE} ${ALT}" width="${AMPLE}" height="${ALT}" role="img" aria-label="Recta numèrica">`
    );
    // La semirecta (sota l'eix, perquè l'eix i les marques es vegin a sobre)
    if (punt && costat) {
        const x0 = x(marques[punt.i].v);
        const x1 = costat === 'dre' ? AMPLE - 6 : 6;
        parts.push(`<line class="jp-r-raig" x1="${x0}" y1="${Y}" x2="${x1}" y2="${Y}"/>`);
    }
    parts.push(`<line class="jp-r-eix" x1="6" y1="${Y}" x2="${AMPLE - 6}" y2="${Y}"/>`);
    parts.push(
        `<polygon class="jp-r-fletxa" points="${AMPLE - 4},${Y} ${AMPLE - 14},${Y - 6} ${AMPLE - 14},${Y + 6}"/>`
    );
    marques.forEach((m, i) => {
        const xm = x(m.v);
        const entera = Number.isInteger(m.v);
        parts.push(`<line class="jp-r-marca" x1="${xm}" y1="${Y - 7}" x2="${xm}" y2="${Y + 7}"/>`);
        // Les fraccions, a sobre de l'eix (així no topen amb els enters del costat)
        const yText = entera ? Y + 28 : Y - 16;
        parts.push(
            `<text class="jp-r-text${entera ? '' : ' jp-r-text-fraccio'}" x="${xm}" y="${yText}" text-anchor="middle">${m.text}</text>`
        );
        if (interactiva)
            parts.push(
                `<rect class="jp-r-toc" data-i="${i}" x="${xm - 16}" y="${Y - 26}" width="32" height="56" rx="6"><title>${m.text}</title></rect>`
            );
    });
    if (punt) {
        const xp = x(marques[punt.i].v);
        parts.push(`<circle class="jp-r-punt ${punt.ple ? 'jp-r-ple' : 'jp-r-buit'}" cx="${xp}" cy="${Y}" r="8"/>`);
    }
    parts.push('</svg>');
    return parts.join('');
}
