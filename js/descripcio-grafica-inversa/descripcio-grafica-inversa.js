/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/descripcio-grafica-inversa/descripcio-grafica-inversa.js
 * ROL: Joc «Dibuixa la gràfica» (descripcio-grafica-inversa.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa fixed-sessions.js.
 * ============================================================================
 */

import '../fixed-sessions.js'; // sessions fixes (?fixed=A/B/C): ha d'anar primer

import { FunctionEngine } from '../descripcio-grafica/function-engine.js';
import { QuestionBank } from '../descripcio-grafica/question-bank.js';
import { SvgRenderer } from '../descripcio-grafica/svg-renderer.js';

(function () {
    'use strict';

    let currentLevel = Math.min(
        3,
        Math.max(1, parseInt(new URLSearchParams(window.location.search).get('nivell') || '1', 10))
    );
    let functionCount = 0;
    let currentSpec = null;

    const els = {
        gameScreen: document.getElementById('game-screen'),
        fxDisplay: document.getElementById('fx-display'),
        btnRevealFx: document.getElementById('btn-reveal-fx'),
        lvlDisplay: document.getElementById('lvl-display'),
        textSign: document.getElementById('text-sign'),
        textMono: document.getElementById('text-mono'),
        textConc: document.getElementById('text-conc'),
        blockConc: document.getElementById('block-conc'),
        graphCanvas: document.getElementById('graph-canvas'),
        graphLegend: document.getElementById('graph-legend'),
        overlay: document.getElementById('graph-overlay'),
    };

    // ----------------------------------------------------------------
    //  HELPERS D'INTERVALS (reproduïts del question-bank, notació pròpia)
    // ----------------------------------------------------------------
    const INF = Infinity;
    function _n(x) {
        if (x === INF) return '+∞';
        if (x === -INF) return '−∞';
        return x < 0 ? `−${-x}` : `${x}`;
    }
    function _iv(a, b) {
        return `(${_n(a)}, ${_n(b)})`;
    }

    // Agrupa intervals per valor i retorna array de línies HTML
    function _groupLines(breaks, parts, labelFn) {
        const pts = [-INF, ...breaks, INF];
        const seen = [],
            groups = {};
        parts.forEach((p, i) => {
            const iv = _iv(pts[i], pts[i + 1]);
            if (!groups[p]) {
                groups[p] = [];
                seen.push(p);
            }
            groups[p].push(iv);
        });
        return seen.map(p => labelFn(p, groups[p].join(' ∪ ')));
    }

    function signLines(spec) {
        const { signBreaks, signParts } = spec;
        if (signParts.every(p => p === 'positiu')) return [`f(x) > 0 a l'interval (−∞, +∞)`];
        if (signParts.every(p => p === 'negatiu')) return [`f(x) < 0 a l'interval (−∞, +∞)`];
        return _groupLines(signBreaks, signParts, (p, ivs) =>
            p === 'positiu' ? `f(x) > 0 a l'interval ${ivs}` : `f(x) < 0 a l'interval ${ivs}`
        );
    }

    function monoLines(spec) {
        const { monBreaks, monParts } = spec;
        if (monParts.length === 1) {
            const mot = monParts[0] === 'creixent' ? 'creixent' : 'decreixent';
            return [`f(x) és ${mot} a l'interval (−∞, +∞)`];
        }
        return _groupLines(monBreaks, monParts, (p, ivs) => `f(x) és ${p} a l'interval ${ivs}`);
    }

    function concLines(spec) {
        if (!spec.hasConcavity) return null;
        const { concBreaks, concParts } = spec;
        if (concParts.length === 1) {
            const mot = concParts[0] === 'amunt' ? 'positiva' : 'negativa';
            return [`f(x) té concavitat ${mot} a l'interval (−∞, +∞)`];
        }
        return _groupLines(concBreaks, concParts, (p, ivs) => {
            const mot = p === 'amunt' ? 'positiva' : 'negativa';
            return `f(x) té concavitat ${mot} a l'interval ${ivs}`;
        });
    }

    function _renderLines(el, lines) {
        el.innerHTML = lines.map(l => `<span class="desc-line">${l}</span>`).join('');
    }

    // ----------------------------------------------------------------
    //  TOGGLE FÓRMULA
    // ----------------------------------------------------------------
    window.revealFx = function () {
        els.fxDisplay.classList.remove('hidden-fx');
        els.btnRevealFx.style.display = 'none';
    };

    // ----------------------------------------------------------------
    //  CONSTRUEIX UNA NOVA FUNCIÓ
    // ----------------------------------------------------------------
    function buildFunction() {
        functionCount++;
        els.lvlDisplay.textContent = `Funció ${functionCount}`;

        // Amaga la fórmula de nou
        els.fxDisplay.classList.add('hidden-fx');
        els.btnRevealFx.style.display = '';

        // Genera l'especificació
        currentSpec = FunctionEngine.generateFunction(currentLevel);

        // Fórmula KaTeX (renderitzada però amagada)
        if (window.katex) {
            katex.render(currentSpec.latex, els.fxDisplay, { throwOnError: false, displayMode: true });
        } else {
            els.fxDisplay.textContent = currentSpec.latex;
        }

        // Blocs A / B / C — text propi, per línies
        _renderLines(els.textSign, signLines(currentSpec));
        _renderLines(els.textMono, monoLines(currentSpec));

        const cLines = concLines(currentSpec);
        if (cLines) {
            _renderLines(els.textConc, cLines);
            els.blockConc.classList.remove('no-concavity');
        } else {
            els.textConc.innerHTML = `<span class="desc-line">Aquesta família de funcions no té inflexió definida amb intervals enters.</span>`;
            els.blockConc.classList.add('no-concavity');
        }

        // Renderitza el gràfic (amagat sota l'overlay)
        els.graphCanvas.innerHTML = SvgRenderer.renderFuncSVG(currentSpec);

        // Torna a tapar el gràfic
        els.graphLegend.style.display = 'none';
        els.graphLegend.innerHTML = '';
        els.overlay.classList.remove('hidden');
    }

    // ----------------------------------------------------------------
    //  REVELA EL GRÀFIC
    // ----------------------------------------------------------------
    window.revealGraph = function () {
        if (!currentSpec) return;
        els.overlay.classList.add('hidden');
    };

    // ----------------------------------------------------------------
    //  CANVI DE NIVELL
    // ----------------------------------------------------------------
    window.buildFunction = buildFunction;

    window.setLevel = function (n) {
        currentLevel = n;
        [1, 2, 3].forEach(i => {
            const b = document.getElementById(`lvl-btn-${i}`);
            if (b) b.className = 'lvl-btn' + (i === n ? ' active' : '');
        });
        buildFunction();
    };

    // ----------------------------------------------------------------
    //  INICI
    // ----------------------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        [1, 2, 3].forEach(i => {
            const b = document.getElementById(`lvl-btn-${i}`);
            if (b) b.className = 'lvl-btn' + (i === currentLevel ? ' active' : '');
        });
        els.gameScreen.style.display = 'flex';

        function tryBuild() {
            if (window.katex) {
                buildFunction();
            } else {
                setTimeout(tryBuild, 50);
            }
        }
        tryBuild();
    });
})();
