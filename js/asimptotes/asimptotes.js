/**
 * asimptotes.js — Controlador DOM per al joc d'asímptotes.
 * UX/UI modellat sobre derivades.js: KaTeX, function-box, options-grid 2×2.
 *
 * URL params: ?nivell=1|2|3  ?preguntes=N
 */

const _params    = new URLSearchParams(window.location.search);
const GAME_LEVEL = Math.min(3, Math.max(1, parseInt(_params.get('nivell')     || '2', 10)));
const TOTAL_Q    = Math.min(12, Math.max(3, parseInt(_params.get('preguntes') || '6', 10)));
const MAX_INTENTS = 3;
const PTS_FIRST   = 10;

let currentQ      = 0;
let score         = 0;
let attemptsLeft  = MAX_INTENTS;
let isAnswered    = false;
let challengeData = null;
let currentFunc   = null;
let history       = [];
let graphRevealed = false;   // si l'alumne ha vist el gràfic en aquesta pregunta

const els = {
    gameScreen:    document.getElementById('game-screen'),
    summaryScreen: document.getElementById('session-summary'),
    fxDisplay:     document.getElementById('fx-display'),
    typeDisplay:   document.getElementById('type-display'),
    options:       document.getElementById('options-container'),
    feedback:      document.getElementById('missatge-feedback'),
    scoreDisplay:  document.getElementById('score-display'),
    lvlDisplay:    document.getElementById('lvl-display'),
    attDisplay:    document.getElementById('attempts-display'),
    levelDisplay:  document.getElementById('level-display'),
};

// ============================================================================
// BUILD LEVEL
// ============================================================================
function buildLevel() {
    isAnswered   = false;
    attemptsLeft = MAX_INTENTS;

    els.lvlDisplay.textContent  = `Pregunta ${currentQ + 1} de ${TOTAL_Q}`;
    els.scoreDisplay.textContent = `Punts: ${score}`;
    els.attDisplay.textContent  = `Intents: ${attemptsLeft}`;
    els.attDisplay.classList.remove('danger');

    els.feedback.style.opacity = '0';
    els.feedback.innerHTML     = '';

    currentFunc   = FunctionEngine.generateFunction(GAME_LEVEL);
    challengeData = QuestionBankA.generateChallenge(currentFunc, GAME_LEVEL);

    // Pregunta amb KaTeX
    katex.render(challengeData.promptTex, els.fxDisplay, {
        throwOnError: false, displayMode: true
    });

    // Etiqueta del tipus
    if (els.typeDisplay) {
        els.typeDisplay.textContent = StringsA.labels[challengeData.type] || '';
    }

    // Gràfic SVG: sempre es renderitza però comença amagat
    graphRevealed = false;
    const gc = document.getElementById('graph-canvas');
    if (gc && currentFunc.fn) {
        gc.innerHTML = renderSVG(currentFunc);
        gc.style.display = 'none';
    }

    // Toggle "Mostrar gràfica"
    const gr = document.getElementById('graph-right');
    if (gr) {
        gr.innerHTML = '';

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'btn-toggle-graph';
        toggleBtn.className = 'btn-toggle-graph';
        toggleBtn.textContent = '👁 Mostrar gràfica de la funció';
        toggleBtn.addEventListener('click', () => {
            if (graphRevealed) return;
            graphRevealed = true;
            toggleBtn.remove();
            gc.style.display = '';
        });
        gr.appendChild(toggleBtn);
        gr.appendChild(gc);
    }

    // Opcions amb KaTeX
    els.options.innerHTML = '';
    [...challengeData.options].forEach((opt, idx) => {
        const btn  = document.createElement('button');
        btn.className = 'btn-option';
        btn.style.animationDelay = `${idx * 60}ms`;
        const span = document.createElement('span');
        katex.render(opt.tex, span, { throwOnError: false });
        btn.appendChild(span);
        btn.addEventListener('click', () => checkAnswer(opt, btn));
        els.options.appendChild(btn);
    });
}


// ============================================================================
// SVG — RENDERITZACIÓ DE LA CORBA
// ============================================================================

function renderSVG(func) {
    const W = 560, H = 420;
    const ml = 35, mr = 20, mt = 30, mb = 30;
    const pw = W - ml - mr, ph = H - mt - mb;

    const [xMin, xMax] = func.xRange || [-6, 6];
    const [yMin, yMax] = func.yRange || [-8, 8];

    const tx = x => ml + (x - xMin) / (xMax - xMin) * pw;
    const ty = y => mt + ph - (y - yMin) / (yMax - yMin) * ph;
    const px0 = tx(0);
    const py0 = (yMin <= 0 && yMax >= 0) ? ty(0) : mt + ph;

    const lines = [];
    lines.push(`<rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" fill="#ffffff"/>`);

    // Grid
    const xStep = (xMax - xMin) <= 14 ? 1 : 2;
    for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
        const px = tx(x);
        lines.push(`<line x1="${px.toFixed(1)}" y1="${mt}" x2="${px.toFixed(1)}" y2="${mt+ph}" stroke="#b8c4ce" stroke-width="0.7"/>`);
    }
    const yStepMinor = _yStep(yMin, yMax);
    for (let y = Math.ceil(yMin/yStepMinor)*yStepMinor; y <= yMax; y += yStepMinor) {
        const py = ty(y);
        lines.push(`<line x1="${ml}" y1="${py.toFixed(1)}" x2="${ml+pw}" y2="${py.toFixed(1)}" stroke="${y % (yStepMinor*2) === 0 ? '#9aaab8' : '#b8c4ce'}" stroke-width="${y % (yStepMinor*2) === 0 ? 1 : 0.7}"/>`);
    }

    // Eixos
    lines.push(`<line x1="${ml}" y1="${py0.toFixed(1)}" x2="${ml+pw}" y2="${py0.toFixed(1)}" stroke="#000" stroke-width="2"/>`);
    lines.push(`<line x1="${px0.toFixed(1)}" y1="${mt}" x2="${px0.toFixed(1)}" y2="${mt+ph}" stroke="#000" stroke-width="2"/>`);

    // Etiquetes Y
    const yStepLabel = yStepMinor * (yMax - yMin > 12 ? 2 : 1);
    for (let y = Math.ceil(yMin/yStepLabel)*yStepLabel; y <= yMax; y += yStepLabel) {
        if (y === 0) continue;
        const py = ty(y);
        lines.push(`<line x1="${(px0-4).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px0+4).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#000" stroke-width="1.5"/>`);
        lines.push(`<text x="${(px0-8).toFixed(1)}" y="${(py+5).toFixed(1)}" text-anchor="end" font-family="Barlow,sans-serif" font-size="13" font-weight="500" fill="#000">${y}</text>`);
    }
    // Etiquetes X
    for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
        if (x === 0) continue;
        const px = tx(x);
        lines.push(`<line x1="${px.toFixed(1)}" y1="${(py0-4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py0+4).toFixed(1)}" stroke="#000" stroke-width="1.5"/>`);
        lines.push(`<text x="${px.toFixed(1)}" y="${(py0+18).toFixed(1)}" text-anchor="middle" font-family="Barlow,sans-serif" font-size="13" font-weight="500" fill="#000">${x}</text>`);
    }
    lines.push(`<text x="${(px0-8).toFixed(1)}" y="${(py0+18).toFixed(1)}" text-anchor="end" font-family="Barlow,sans-serif" font-size="13" font-weight="500" fill="#000">0</text>`);

    // Títols eixos
    lines.push(`<text x="${(ml+pw).toFixed(1)}" y="${(py0-8).toFixed(1)}" text-anchor="end" font-family="Barlow,sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#000">x</text>`);
    lines.push(`<text x="${(px0+6).toFixed(1)}" y="16" font-family="Barlow,sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#000">y</text>`);

    // Asímptotes verticals (vermell)
    func.va.forEach(a => {
        if (a < xMin || a > xMax) return;
        const px = tx(a);
        const aStr = a > 0 ? `x = ${a}` : a < 0 ? `x = -${-a}` : 'x = 0';
        lines.push(`<line x1="${px.toFixed(1)}" y1="${mt}" x2="${px.toFixed(1)}" y2="${mt+ph}" stroke="#e53e3e" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8"/>`);
        lines.push(`<text x="${(px+5).toFixed(1)}" y="${(mt+14).toFixed(1)}" font-family="Barlow,sans-serif" font-size="12" fill="#e53e3e" font-weight="600">${aStr}</text>`);
    });

    // Asímptota horitzontal (blau)
    if (func.ha !== null && func.ha !== undefined) {
        const h = func.ha;
        if (h >= yMin && h <= yMax) {
            const py = ty(h);
            const hStr = h > 0 ? `y = ${h}` : h < 0 ? `y = -${-h}` : 'y = 0';
            lines.push(`<line x1="${ml}" y1="${py.toFixed(1)}" x2="${ml+pw}" y2="${py.toFixed(1)}" stroke="#2b6cb0" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8"/>`);
            lines.push(`<text x="${(ml+4).toFixed(1)}" y="${(py-5).toFixed(1)}" font-family="Barlow,sans-serif" font-size="12" fill="#2b6cb0" font-weight="600">${hStr}</text>`);
        }
    }

    // Asímptota obliqua (verd)
    if (func.oa) {
        const { m, b } = func.oa;
        const py1 = ty(m * xMin + b), py2 = ty(m * xMax + b);
        const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`;
        lines.push(`<line x1="${ml}" y1="${py1.toFixed(1)}" x2="${ml+pw}" y2="${py2.toFixed(1)}" stroke="#276749" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8"/>`);
        lines.push(`<text x="${(ml+4).toFixed(1)}" y="${(ty(m*xMin+b)-5).toFixed(1)}" font-family="Barlow,sans-serif" font-size="12" fill="#276749" font-weight="600">y = x${bStr}</text>`);
    }

    // Corba
    const pathData = _buildCurvePaths(func, tx, ty, xMin, xMax, yMin, yMax);
    pathData.forEach(d => {
        lines.push(`<path d="${d}" fill="none" stroke="#0077b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`);
    });

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block">${lines.join('')}</svg>`;
}

function _yStep(yMin, yMax) {
    const span = yMax - yMin;
    if (span <= 8)  return 1;
    if (span <= 16) return 2;
    if (span <= 30) return 5;
    return 10;
}

function _buildCurvePaths(func, tx, ty, xMin, xMax, yMin, yMax) {
    const N    = 600;
    const eps  = (xMax - xMin) * 0.018;
    const yClip = (yMax - yMin) * 1.1;
    const paths = [];
    const breaks = [-Infinity, ...(func.va || []).slice().sort((a,b)=>a-b), Infinity];
    const intervals = [];
    for (let i = 0; i < breaks.length - 1; i++) {
        const lo = Math.max(xMin + 0.01, breaks[i] + eps);
        const hi = Math.min(xMax - 0.01, breaks[i+1] - eps);
        if (lo < hi) intervals.push([lo, hi]);
    }
    intervals.forEach(([lo, hi]) => {
        let d = '';
        for (let i = 0; i <= N; i++) {
            const x = lo + (hi - lo) * i / N;
            if (!func.domain(x)) { d += ' '; continue; }
            const y = func.fn(x);
            if (!isFinite(y) || isNaN(y)) { d += ' '; continue; }
            const cy = Math.max(yMin - yClip, Math.min(yMax + yClip, y));
            const cmd = (d === '' || d.endsWith(' '))
                ? `M ${tx(x).toFixed(2)} ${ty(cy).toFixed(2)}`
                : ` L ${tx(x).toFixed(2)} ${ty(cy).toFixed(2)}`;
            d += cmd;
        }
        d.split(' M ').filter(s => s.trim()).forEach(seg => {
            const full = seg.startsWith('M') ? seg : 'M ' + seg;
            if (full.includes('L')) paths.push(full);
        });
    });
    return paths;
}

// ============================================================================
// CHECK ANSWER
// ============================================================================
function checkAnswer(opt, clickedBtn) {
    if (isAnswered) return;

    if (opt.isCorrect) {
        isAnswered = true;
        let pts = attemptsLeft === MAX_INTENTS ? PTS_FIRST
                : attemptsLeft === 2           ? 5
                : 0;
        if (graphRevealed && pts > 0) pts = Math.floor(pts / 2);
        score += pts;

        clickedBtn.classList.add('correct');
        _disableAll();
        history.push({ type: challengeData.type, correct: true, pointsEarned: pts });
        _renderFeedback(opt, false);
        els.scoreDisplay.textContent = `Punts: ${score}`;
        setTimeout(() => _next(), 1600);

    } else {
        attemptsLeft--;
        clickedBtn.classList.add('wrong');
        els.attDisplay.textContent = `Intents: ${attemptsLeft}`;
        els.attDisplay.classList.add('danger');
        history.push({ type: challengeData.type, correct: false, pointsEarned: 0 });

        const isLast = attemptsLeft <= 0;
        _renderFeedback(opt, isLast);

        if (isLast) {
            isAnswered = true;
            _disableAll();
            setTimeout(() => _next(), 2200);
        }
    }
}

function _renderFeedback(opt, showSolution) {
    const fc = els.feedback;

    if (opt.isCorrect) {
        fc.innerHTML = `<strong class="feedback-correct">✓ ${opt.feedback}</strong>`;
        fc.style.opacity = '1';
        return;
    }

    fc.innerHTML = `<span class="feedback-wrong">${opt.feedback}</span>`;
    fc.style.opacity = '1';

    if (showSolution && challengeData?.solutionTex) {
        const row = document.createElement('div');
        row.className = 'solution-reveal';
        const label = document.createElement('span');
        label.className = 'solution-label';
        label.textContent = 'La resposta correcta era:';
        const formula = document.createElement('span');
        formula.className = 'solution-formula';
        katex.render(challengeData.solutionTex, formula, { throwOnError: false });
        row.appendChild(label);
        row.appendChild(formula);
        fc.appendChild(row);
    }
}

function _disableAll() {
    Array.from(els.options.querySelectorAll('.btn-option'))
        .forEach(b => { b.style.pointerEvents = 'none'; });
}

function _next() {
    currentQ++;
    if (currentQ >= TOTAL_Q) _showSummary();
    else buildLevel();
}

// ============================================================================
// RESUM FINAL
// ============================================================================
function _showSummary() {
    els.gameScreen.style.display = 'none';

    const maxScore  = TOTAL_Q * PTS_FIRST;
    const firstTry  = history.filter(h => h.correct && h.pointsEarned === PTS_FIRST).length;
    const retried   = history.filter(h => h.correct && h.pointsEarned === 5).length;
    const failed    = history.filter(h => !h.correct).length;
    const pct       = Math.round(score / maxScore * 100);

    const scoreOver10Raw = score / maxScore * 10;
    const scoreOver10 = Number.isInteger(scoreOver10Raw)
        ? String(scoreOver10Raw)
        : scoreOver10Raw.toFixed(2).replace('.', ',');

    const trophy = pct >= 90 ? '🌟' : pct >= 70 ? '😊' : pct >= 50 ? '🙂' : '💪';

    // Freqüència d'errors per tipus
    const byType = {};
    history.filter(h => !h.correct).forEach(h => {
        byType[h.type] = (byType[h.type] || 0) + 1;
    });
    const sortedErrors = Object.entries(byType).sort((a,b) => b[1]-a[1]);

    const errorTypeLabels = {
        Q_VA:      'Asímptota vertical',
        Q_LATERAL: 'Límit lateral',
        Q_HA:      'Asímptota horitzontal',
        Q_OA:      'Asímptota obliqua',
    };

    let errorsHTML = '';
    if (sortedErrors.length > 0) {
        errorsHTML = `<div class="summary-errors-title">Errors per tipus de pregunta</div>
        <div class="summary-errors-list">` +
        sortedErrors.map(([type, count]) => `
            <div class="summary-error-item">
                <div class="summary-error-header">
                    <span class="summary-error-type">${errorTypeLabels[type] || type}</span>
                    <span class="summary-error-count">${count === 1 ? '1 vegada' : `${count} vegades`}</span>
                </div>
            </div>`).join('') +
        `</div>`;
    } else {
        errorsHTML = `<div class="summary-no-errors">Cap error! Excel·lent! ${trophy}</div>`;
    }

    els.summaryScreen.innerHTML = `
        <div class="summary-score">
            <span class="summary-score-label">Puntuació</span>
            <span class="summary-score-value">${scoreOver10}</span>
        </div>
        <div class="summary-stats">
            <div class="summary-stat summary-stat--ok">
                <span class="summary-stat-num">${firstTry}</span>
                <span class="summary-stat-desc">al primer intent</span>
            </div>
            <div class="summary-stat summary-stat--warn">
                <span class="summary-stat-num">${retried}</span>
                <span class="summary-stat-desc">al segon intent</span>
            </div>
            <div class="summary-stat summary-stat--err">
                <span class="summary-stat-num">${failed}</span>
                <span class="summary-stat-desc">sense resoldre</span>
            </div>
        </div>
        ${errorsHTML}
        <button class="summary-continue-btn" id="btn-restart">Torna a jugar</button>
    `;
    els.summaryScreen.style.display = 'block';

    document.getElementById('btn-restart').addEventListener('click', () => {
        currentQ = 0; score = 0; history = [];
        els.summaryScreen.style.display = 'none';
        els.gameScreen.style.display    = 'flex';
        buildLevel();
    });
}

// ============================================================================
// INICI
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (els.levelDisplay) {
        els.levelDisplay.textContent = { 1: 'Nivell fàcil', 2: 'Nivell mitjà', 3: 'Nivell difícil' }[GAME_LEVEL] || '';
    }
    els.gameScreen.style.display = 'flex';
    buildLevel();
});
