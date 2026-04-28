/**
 * js/descripcio-grafica/svg-renderer.js
 * Renderitza el gràfic SVG d'una especificació de funció.
 *
 * Exposa:
 *   renderFuncSVG(spec)  → string SVG complet
 *
 * Característiques:
 *   - Grid enters amb etiquetes als eixos
 *   - Fletxes als extrems dels eixos
 *   - Corba traçada per sampling (N=500 punts)
 *   - Marcadors de punts clau:  ● vermell = zero,  ● taronja = extrem
 */

window.SvgRenderer = (() => {
    'use strict';

    const W = 560, H = 390;
    const ML = 40, MR = 18, MT = 22, MB = 22;
    const PW = W - ML - MR, PH = H - MT - MB;

    function renderFuncSVG(spec) {
        let [xMin, xMax] = spec.xRange || [-6, 6];
        let [yMinR, yMaxR] = spec.yRange || [-8, 8];
        const yPad = (yMaxR - yMinR) * 0.06;
        const yMin = yMinR - yPad, yMax = yMaxR + yPad;

        const tx  = x => ML + (x - xMin) / (xMax - xMin) * PW;
        const ty  = y => MT + PH - (y - yMin) / (yMax - yMin) * PH;
        const px0 = (xMin <= 0 && xMax >= 0) ? tx(0) : ML;
        const py0 = (yMin <= 0 && yMax >= 0) ? ty(0) : MT + PH;

        const L = [];
        L.push(`<rect x="${ML}" y="${MT}" width="${PW}" height="${PH}" fill="#fff"/>`);

        // ---- Grid vertical (x enter) ----
        const xStep = (xMax - xMin) <= 14 ? 1 : 2;
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
            const px = tx(x).toFixed(1);
            L.push(`<line x1="${px}" y1="${MT}" x2="${px}" y2="${MT + PH}" stroke="${x === 0 ? '#b0c0d0' : '#d1dce8'}" stroke-width="${x === 0 ? 1 : 0.7}"/>`);
        }
        // ---- Grid horitzontal (y) ----
        const ySpan = yMax - yMin;
        const yS = ySpan <= 8 ? 1 : ySpan <= 16 ? 2 : ySpan <= 32 ? 5 : 10;
        for (let y = Math.ceil(yMin / yS) * yS; y <= yMax + yS * 0.1; y += yS) {
            const py = ty(y).toFixed(1);
            L.push(`<line x1="${ML}" y1="${py}" x2="${ML + PW}" y2="${py}" stroke="${y === 0 ? '#b0c0d0' : '#d1dce8'}" stroke-width="${y === 0 ? 1 : 0.7}"/>`);
        }

        // ---- Eixos ----
        const py0f = py0.toFixed(1), px0f = px0.toFixed(1);
        L.push(`<line x1="${ML}" y1="${py0f}" x2="${ML + PW}" y2="${py0f}" stroke="#1e293b" stroke-width="1.8"/>`);
        L.push(`<line x1="${px0f}" y1="${MT}" x2="${px0f}" y2="${MT + PH}" stroke="#1e293b" stroke-width="1.8"/>`);
        // Fletxes
        L.push(`<polygon points="${ML + PW},${py0f} ${ML + PW - 7},${py0 - 4} ${ML + PW - 7},${py0 + 4}" fill="#1e293b"/>`);
        L.push(`<polygon points="${px0f},${MT} ${px0 - 4},${MT + 7} ${px0 + 4},${MT + 7}" fill="#1e293b"/>`);
        // Etiquetes d'eix
        L.push(`<text x="${ML + PW - 10}" y="${(py0 + 16).toFixed(1)}" font-family="Barlow,sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#1e293b">x</text>`);
        L.push(`<text x="${(px0 + 6).toFixed(1)}" y="${MT + 14}" font-family="Barlow,sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#1e293b">y</text>`);

        // ---- Marques i números a X ----
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
            if (x === 0) continue;
            const px = tx(x);
            L.push(`<line x1="${px.toFixed(1)}" y1="${(py0 - 4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py0 + 4).toFixed(1)}" stroke="#1e293b" stroke-width="1.4"/>`);
            L.push(`<text x="${px.toFixed(1)}" y="${(py0 + 17).toFixed(1)}" text-anchor="middle" font-family="Barlow,sans-serif" font-size="12" font-weight="500" fill="#334155">${x}</text>`);
        }
        // ---- Marques i números a Y ----
        for (let y = Math.ceil(yMin / yS) * yS; y <= yMax; y += yS) {
            if (y === 0) continue;
            const py = ty(y);
            L.push(`<line x1="${(px0 - 4).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px0 + 4).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#1e293b" stroke-width="1.4"/>`);
            L.push(`<text x="${(px0 - 7).toFixed(1)}" y="${(py + 4.5).toFixed(1)}" text-anchor="end" font-family="Barlow,sans-serif" font-size="12" font-weight="500" fill="#334155">${y}</text>`);
        }
        L.push(`<text x="${(px0 - 7).toFixed(1)}" y="${(py0 + 17).toFixed(1)}" text-anchor="end" font-family="Barlow,sans-serif" font-size="12" font-weight="500" fill="#334155">0</text>`);

        // ---- Corba ----
        _buildCurve(spec, tx, ty, xMin, xMax, yMin, yMax).forEach(d => {
            L.push(`<path d="${d}" fill="none" stroke="#000000" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`);
        });

        // ---- Punts clau (zeros, extrems, inflexions) ----
        (spec.keyPoints || []).forEach(({ x, y, type }) => {
            if (x < xMin || x > xMax || y < yMin || y > yMax) return;
            const px = tx(x), py = ty(y);

            if (type === 'inflexion') {
                // Cercle buit en lila — marca el punt d'inflexió
                const axisY = (yMin <= 0 && yMax >= 0) ? ty(0) : MT + PH;
                L.push(`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${axisY.toFixed(1)}" stroke="#8b1a1a" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.5"/>`);
                const fmtN = v => Number.isInteger(v) ? `${v < 0 ? '−' + (-v) : v}` : v.toFixed(1);
                const abovePoint = y > (yMin + yMax) / 2;
                const lx = px + 36, ly = abovePoint ? py - 10 : py + 16;
                L.push(`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-family="Barlow,sans-serif" font-size="11" font-weight="700" fill="#8b1a1a">(${fmtN(x)}, ${fmtN(y)})</text>`);
                L.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="#8b1a1a" stroke="white" stroke-width="1.5"/>`);
                return;
            }

            const col = '#8b1a1a';
            if (type === 'extremum') {
                const axisY = (yMin <= 0 && yMax >= 0) ? ty(0) : MT + PH;
                L.push(`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${axisY.toFixed(1)}" stroke="${col}" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.55"/>`);
                const fmtN = v => Number.isInteger(v) ? `${v < 0 ? '−' + (-v) : v}` : v.toFixed(1);
                const abovePoint = y > (yMin + yMax) / 2;
                const labelY = abovePoint ? py - 10 : py + 16;
                L.push(`<text x="${px.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-family="Barlow,sans-serif" font-size="11" font-weight="700" fill="${col}">(${fmtN(x)}, ${fmtN(y)})</text>`);
            }
            L.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="${col}" stroke="white" stroke-width="1.5"/>`);
        });

        return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ` +
               `preserveAspectRatio="xMidYMid meet" ` +
               `style="width:100%;height:100%;max-height:100%;display:block">${L.join('')}</svg>`;
    }

    /** Construeix segments de camí SVG per a la corba (gestiona discontinuïtats). */
    function _buildCurve(spec, tx, ty, xMin, xMax, yMin, yMax) {
        const N     = 500;
        const yClip = (yMax - yMin) * 2;
        const paths = [];
        let d = '';

        for (let i = 0; i <= N; i++) {
            const x = xMin + (xMax - xMin) * i / N;
            const y = spec.fn(x);
            if (!isFinite(y) || isNaN(y)) { if (d) d += ' '; continue; }
            const cy = Math.max(yMin - yClip, Math.min(yMax + yClip, y));
            const px = tx(x).toFixed(2), py = ty(cy).toFixed(2);
            d += (d === '' || d.endsWith(' ')) ? `M ${px} ${py}` : ` L ${px} ${py}`;
        }

        d.split(' M ').filter(s => s.trim()).forEach(seg => {
            const full = seg.startsWith('M') ? seg : 'M ' + seg;
            if (full.includes('L')) paths.push(full);
        });

        return paths;
    }


    // ------------------------------------------------------------------ //
    //  GRÀFIC AMB SEGMENTS DE COLOR per fase resposta correcta
    //
    //  phase: 'SIGN' | 'MONO' | 'CONC'
    //  Cada interval es pinta d'un color diferent. Es mostra una llegenda.
    // ------------------------------------------------------------------ //
    function renderFuncSVGColored(spec, phase) {
        let breaks, parts, colorMap, legendLabels;
        if (phase === 'SIGN') {
            breaks      = spec.signBreaks;
            parts       = spec.signParts;
            colorMap    = { positiu: '#2563eb', negatiu: '#f97316' };
            legendLabels= { positiu: 'f(x) > 0', negatiu: 'f(x) < 0' };
        } else if (phase === 'MONO') {
            breaks      = spec.monBreaks;
            parts       = spec.monParts;
            colorMap    = { creixent: '#10b981', decreixent: '#ef4444' };
            legendLabels= { creixent: 'creixent', decreixent: 'decreixent' };
        } else {
            breaks      = spec.concBreaks;
            parts       = spec.concParts;
            colorMap    = { amunt: '#8b5cf6', avall: '#14b8a6' };
            legendLabels= { amunt: 'concavitat positiva', avall: 'concavitat negativa' };
        }

        let [xMin, xMax] = spec.xRange || [-6, 6];
        let [yMinR, yMaxR] = spec.yRange || [-8, 8];
        const yPad = (yMaxR - yMinR) * 0.06;
        const yMin = yMinR - yPad, yMax = yMaxR + yPad;

        const tx  = x => ML + (x - xMin) / (xMax - xMin) * PW;
        const ty  = y => MT + PH - (y - yMin) / (yMax - yMin) * PH;
        const px0 = (xMin <= 0 && xMax >= 0) ? tx(0) : ML;
        const py0 = (yMin <= 0 && yMax >= 0) ? ty(0) : MT + PH;

        const L = [];
        L.push(`<rect x="${ML}" y="${MT}" width="${PW}" height="${PH}" fill="#fff"/>`);

        // Grid + axes (reutilitzem la mateixa lògica)
        const xStep = (xMax - xMin) <= 14 ? 1 : 2;
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
            const px = tx(x).toFixed(1);
            L.push(`<line x1="${px}" y1="${MT}" x2="${px}" y2="${MT+PH}" stroke="${x===0?'#b0c0d0':'#d1dce8'}" stroke-width="${x===0?1:0.7}"/>`);
        }
        const ySpan = yMax - yMin;
        const yS = ySpan <= 8 ? 1 : ySpan <= 16 ? 2 : ySpan <= 32 ? 5 : 10;
        for (let y = Math.ceil(yMin/yS)*yS; y <= yMax+yS*0.1; y += yS) {
            const py = ty(y).toFixed(1);
            L.push(`<line x1="${ML}" y1="${py}" x2="${ML+PW}" y2="${py}" stroke="${y===0?'#b0c0d0':'#d1dce8'}" stroke-width="${y===0?1:0.7}"/>`);
        }
        const py0f = py0.toFixed(1), px0f = px0.toFixed(1);
        L.push(`<line x1="${ML}" y1="${py0f}" x2="${ML+PW}" y2="${py0f}" stroke="#1e293b" stroke-width="1.8"/>`);
        L.push(`<line x1="${px0f}" y1="${MT}" x2="${px0f}" y2="${MT+PH}" stroke="#1e293b" stroke-width="1.8"/>`);
        L.push(`<polygon points="${ML+PW},${py0f} ${ML+PW-7},${py0-4} ${ML+PW-7},${py0+4}" fill="#1e293b"/>`);
        L.push(`<polygon points="${px0f},${MT} ${px0-4},${MT+7} ${px0+4},${MT+7}" fill="#1e293b"/>`);
        L.push(`<text x="${ML+PW-10}" y="${(py0+16).toFixed(1)}" font-family="Barlow,sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#1e293b">x</text>`);
        L.push(`<text x="${(px0+6).toFixed(1)}" y="${MT+14}" font-family="Barlow,sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#1e293b">y</text>`);
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
            if (x === 0) continue;
            const px = tx(x);
            L.push(`<line x1="${px.toFixed(1)}" y1="${(py0-4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py0+4).toFixed(1)}" stroke="#1e293b" stroke-width="1.4"/>`);
            L.push(`<text x="${px.toFixed(1)}" y="${(py0+17).toFixed(1)}" text-anchor="middle" font-family="Barlow,sans-serif" font-size="12" font-weight="500" fill="#334155">${x}</text>`);
        }
        for (let y = Math.ceil(yMin/yS)*yS; y <= yMax; y += yS) {
            if (y === 0) continue;
            const py = ty(y);
            L.push(`<line x1="${(px0-4).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px0+4).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#1e293b" stroke-width="1.4"/>`);
            L.push(`<text x="${(px0-7).toFixed(1)}" y="${(py+4.5).toFixed(1)}" text-anchor="end" font-family="Barlow,sans-serif" font-size="12" font-weight="500" fill="#334155">${y}</text>`);
        }
        L.push(`<text x="${(px0-7).toFixed(1)}" y="${(py0+17).toFixed(1)}" text-anchor="end" font-family="Barlow,sans-serif" font-size="12" font-weight="500" fill="#334155">0</text>`);

        // ---- Corba per segments de color ----
        const segBounds = [-Infinity, ...breaks, Infinity];
        parts.forEach((part, i) => {
            const sMin = Math.max(segBounds[i],   xMin);
            const sMax = Math.min(segBounds[i+1], xMax);
            if (sMin >= sMax) return;
            const color = colorMap[part] || '#0077b6';
            _buildCurve(spec, tx, ty, sMin, sMax, yMin, yMax).forEach(d => {
                L.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`);
            });
        });

        // ---- Punts clau (igual que renderFuncSVG) ----
        (spec.keyPoints || []).forEach(({ x, y, type }) => {
            if (x < xMin || x > xMax || y < yMin || y > yMax) return;
            const px = tx(x), py = ty(y);
            if (type === 'inflexion') {
                const axisY = (yMin <= 0 && yMax >= 0) ? ty(0) : MT + PH;
                L.push(`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${axisY.toFixed(1)}" stroke="#8b1a1a" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.5"/>`);
                const fmtN = v => Number.isInteger(v)?`${v<0?'−'+(-v):v}`:v.toFixed(1);
                const abv = y > (yMin+yMax)/2;
                L.push(`<text x="${(px+36).toFixed(1)}" y="${(abv?py-10:py+16).toFixed(1)}" text-anchor="middle" font-family="Barlow,sans-serif" font-size="11" font-weight="700" fill="#8b1a1a">(${fmtN(x)}, ${fmtN(y)})</text>`);
                L.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="#8b1a1a" stroke="white" stroke-width="1.5"/>`);
                return;
            }
            const col = '#8b1a1a';
            if (type === 'extremum') {
                const axisY = (yMin <= 0 && yMax >= 0) ? ty(0) : MT + PH;
                L.push(`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${axisY.toFixed(1)}" stroke="${col}" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.55"/>`);
                const fmtN = v => Number.isInteger(v)?`${v<0?'−'+(-v):v}`:v.toFixed(1);
                const abv = y > (yMin+yMax)/2;
                L.push(`<text x="${px.toFixed(1)}" y="${(abv?py-10:py+16).toFixed(1)}" text-anchor="middle" font-family="Barlow,sans-serif" font-size="11" font-weight="700" fill="${col}">(${fmtN(x)}, ${fmtN(y)})</text>`);
            }
            L.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="${col}" stroke="white" stroke-width="1.5"/>`);
        });

        // Legend data is returned separately for HTML injection (never overlaps the curve)
        const legendEntries = [...new Set(parts)];
        const legend = legendEntries.map(p => ({ label: legendLabels[p] || p, color: colorMap[p] || '#0077b6' }));

        const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;max-height:100%;display:block">${L.join('')}</svg>`;
        return { svg, legend };
    }

    return { renderFuncSVG, renderFuncSVGColored };
})();
