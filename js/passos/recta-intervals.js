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
 *
 *   RECTA AMB TRAMS (lliurament 22c, inequacions de 2n grau i racionals; camp 'trams')
 *   svgRectaTrams({ punts: [{ v, text }], trams: [bool], inclosos: [bool], interactiva })
 *     punts      els punts crítics, en ordre creixent, repartits per igual (esquema, com la taula)
 *     trams      n + 1 valors: el tram de l'esquerra de tot, els de entre punts i el de la dreta
 *     inclosos   n valors: si cada punt hi entra (ple); si no, buit quan toca un tram marcat
 *   creaRectaTrams(nom, { punts }, { capSolucio })   el giny (DOM): tocar un tram el marca o el
 *     desmarca; tocar un punt el fa ple o no; el botó «Cap solució» ho buida tot. La resposta va a
 *     data-resposta ({ trams, inclosos, buida, tocat }), com la de la recta (.jp-recta).
 *   llegeixTrams(resposta) → { estat: 'incomplet' } | { valor: { trams, inclosos } }
 *   tramsIguals(a, b)
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

// ═════════════════════════════════════════════════════════════════════════════
// RECTA AMB TRAMS (inequacions de 2n grau i racionals)
// ═════════════════════════════════════════════════════════════════════════════
/** La x de cada punt crític: repartits per igual entre els marges. */
const xsTrams = n => Array.from({ length: n }, (_, k) => MARGE + ((k + 1) * (AMPLE - 2 * MARGE)) / (n + 1));

/** La recta amb trams en SVG (vegeu la capçalera). */
export function svgRectaTrams({ punts, trams, inclosos, interactiva = false }) {
    const n = punts.length;
    const xs = xsTrams(n);
    const vora = k => (k < 0 ? 6 : k >= n ? AMPLE - 6 : xs[k]);
    const parts = [
        `<svg class="jp-recta-svg jp-trams-svg" viewBox="0 0 ${AMPLE} ${ALT}" width="${AMPLE}" height="${ALT}" role="img" aria-label="Recta numèrica">`,
    ];
    trams.forEach((marcat, k) => {
        if (marcat) parts.push(`<line class="jp-r-raig" x1="${vora(k - 1)}" y1="${Y}" x2="${vora(k)}" y2="${Y}"/>`);
    });
    parts.push(`<line class="jp-r-eix" x1="6" y1="${Y}" x2="${AMPLE - 6}" y2="${Y}"/>`);
    parts.push(
        `<polygon class="jp-r-fletxa" points="${AMPLE - 4},${Y} ${AMPLE - 14},${Y - 6} ${AMPLE - 14},${Y + 6}"/>`
    );
    punts.forEach((p, k) => {
        parts.push(`<line class="jp-r-marca" x1="${xs[k]}" y1="${Y - 7}" x2="${xs[k]}" y2="${Y + 7}"/>`);
        parts.push(`<text class="jp-r-text" x="${xs[k]}" y="${Y + 28}" text-anchor="middle">${p.text}</text>`);
        if (inclosos[k] || trams[k] || trams[k + 1])
            parts.push(
                `<circle class="jp-r-punt ${inclosos[k] ? 'jp-r-ple' : 'jp-r-buit'}" cx="${xs[k]}" cy="${Y}" r="8"/>`
            );
    });
    if (interactiva) {
        // Zones per tocar: els trams (sense tocar els punts) i els punts
        trams.forEach((_, k) => {
            const x1 = vora(k - 1) + (k > 0 ? 18 : 0);
            const x2 = vora(k) - (k < n ? 18 : 0);
            parts.push(
                `<rect class="jp-r-toc jp-r-toc-tram" data-t="${k}" x="${x1}" y="${Y - 24}" width="${Math.max(10, x2 - x1)}" height="48" rx="6"><title>tram ${k + 1}</title></rect>`
            );
        });
        punts.forEach((p, k) =>
            parts.push(
                `<rect class="jp-r-toc" data-p="${k}" x="${xs[k] - 16}" y="${Y - 26}" width="32" height="56" rx="6"><title>${p.text}</title></rect>`
            )
        );
    }
    parts.push('</svg>');
    return parts.join('');
}

/** Llegeix la resposta del giny: incomplet si no s'ha tocat res. */
export function llegeixTrams(r) {
    if (!r || !r.tocat) return { estat: 'incomplet' };
    const trams = r.buida ? r.trams.map(() => false) : r.trams.slice();
    const inclosos = r.buida ? r.inclosos.map(() => false) : r.inclosos.slice();
    return { valor: { trams, inclosos } };
}

export const tramsIguals = (a, b) =>
    a.trams.length === b.trams.length &&
    a.trams.every((t, k) => t === b.trams[k]) &&
    a.inclosos.every((p, k) => p === b.inclosos[k]);

/** El giny de la recta amb trams (només al navegador). */
export function creaRectaTrams(nom, { punts }, { capSolucio = 'Cap solució' } = {}) {
    const caixa = document.createElement('div');
    caixa.className = 'jp-recta jp-trams';
    caixa.dataset.nom = nom;
    const estat = {
        trams: Array.from({ length: punts.length + 1 }, () => false),
        inclosos: punts.map(() => false),
        buida: false,
        tocat: false,
    };
    const dibuix = document.createElement('div');
    dibuix.className = 'jp-recta-dibuix';
    const botons = document.createElement('div');
    botons.className = 'jp-recta-botons';
    const cap = document.createElement('button');
    cap.type = 'button';
    cap.className = 'jp-recta-boto';
    cap.textContent = capSolucio;
    const desa = () => {
        caixa.dataset.resposta = JSON.stringify(estat);
        caixa.classList.remove('jp-malament');
    };
    const pinta = () => {
        dibuix.innerHTML = svgRectaTrams({ punts, trams: estat.trams, inclosos: estat.inclosos, interactiva: true });
        dibuix.querySelectorAll('.jp-r-toc').forEach(z =>
            z.addEventListener('click', () => {
                if (z.dataset.t !== undefined) estat.trams[Number(z.dataset.t)] = !estat.trams[Number(z.dataset.t)];
                else estat.inclosos[Number(z.dataset.p)] = !estat.inclosos[Number(z.dataset.p)];
                estat.buida = false;
                estat.tocat = true;
                desa();
                pinta();
            })
        );
        cap.setAttribute('aria-pressed', String(estat.buida));
    };
    cap.addEventListener('click', () => {
        estat.buida = !estat.buida;
        if (estat.buida) {
            estat.trams.fill(false);
            estat.inclosos.fill(false);
        }
        estat.tocat = true;
        desa();
        pinta();
    });
    botons.appendChild(cap);
    caixa.append(dibuix, botons);
    desa();
    pinta();
    return caixa;
}
