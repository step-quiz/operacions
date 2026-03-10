/**
 * ============================================================================
 * PROJECTE: Asímptotes i Límits Laterals
 * FITXER: js/asimptotes/asimptotes.js
 * ROL: Controlador DOM + renderitzador SVG de corbes amb asímptotes.
 *
 * PARÀMETRES URL:
 *   ?nivell=1|2|3   Nivell de dificultat (defecte: 2)
 *   ?preguntes=N    Nombre de preguntes (defecte: 6)
 *
 * DEPENDÈNCIES (ordre):
 *   function-engine.js → strings-asimptotes.js →
 *   question-bank-asimptotes.js → (aquest, defer)
 * ============================================================================
 */

// ============================================================================
// CONFIGURACIÓ
// ============================================================================
const _params     = new URLSearchParams(window.location.search);
const GAME_LEVEL  = Math.min(3, Math.max(1, parseInt(_params.get('nivell')     || '2', 10)));
const TOTAL_Q     = Math.min(12, Math.max(3, parseInt(_params.get('preguntes') || '6', 10)));
const MAX_INTENTS = 3;
const PTS_FIRST   = 10;
const PTS_SECOND  = 5;

// ============================================================================
// ESTAT DEL JOC
// ============================================================================
let currentQ     = 0;
let score        = 0;
let attemptsLeft = MAX_INTENTS;
let isAnswered   = false;
let challenge    = null;
let currentFunc  = null;
let history      = [];

// ============================================================================
// ELEMENTS DOM
// ============================================================================
const els = {
    gameScreen:    document.getElementById('game-screen'),
    summaryScreen: document.getElementById('summary-screen'),
    graphContainer:document.getElementById('graph-container'),
    prompt:        document.getElementById('question-prompt'),
    options:       document.getElementById('options-container'),
    feedback:      document.getElementById('feedback'),
    scoreDisplay:  document.getElementById('score-display'),
    qDisplay:      document.getElementById('q-display'),
    levelDisplay:  document.getElementById('level-display'),
    attDisplay:    document.getElementById('attempts-display'),
};

// ============================================================================
// SVG — RENDERITZACIÓ
// ============================================================================

function renderSVG(func) {
    const W = 560, H = 420;
    const ml = 35, mr = 20, mt = 30, mb = 30;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    const [xMin, xMax] = func.xRange;
    const [yMin, yMax] = func.yRange;

    const tx = x => ml + (x - xMin) / (xMax - xMin) * pw;
    const ty = y => mt + ph - (y - yMin) / (yMax - yMin) * ph;

    // Posicions dels eixos
    const px0 = tx(0);
    const py0 = (yMin <= 0 && yMax >= 0) ? ty(0) : mt + ph;

    const lines = [];

    // Fons blanc
    lines.push(`<rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" fill="#ffffff"/>`);

    // Grid menor
    const xStep = (xMax - xMin) <= 14 ? 1 : 2;
    for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
        const px = tx(x);
        lines.push(`<line x1="${px.toFixed(1)}" y1="${mt}" x2="${px.toFixed(1)}" y2="${mt+ph}" stroke="#b8c4ce" stroke-width="0.7"/>`);
    }
    const yStepMinor = _yStep(yMin, yMax);
    for (let y = Math.ceil(yMin / yStepMinor) * yStepMinor; y <= yMax; y += yStepMinor) {
        const py = ty(y);
        lines.push(`<line x1="${ml}" y1="${py.toFixed(1)}" x2="${ml+pw}" y2="${py.toFixed(1)}" stroke="#b8c4ce" stroke-width="0.7"/>`);
    }
    // Grid major Y
    const yStepMajor = _yStep(yMin, yMax) * (yMax - yMin > 12 ? 2 : 1);
    for (let y = Math.ceil(yMin / yStepMajor) * yStepMajor; y <= yMax; y += yStepMajor) {
        const py = ty(y);
        lines.push(`<line x1="${ml}" y1="${py.toFixed(1)}" x2="${ml+pw}" y2="${py.toFixed(1)}" stroke="#9aaab8" stroke-width="1"/>`);
    }

    // Eixos principals
    lines.push(`<line x1="${ml}" y1="${py0.toFixed(1)}" x2="${ml+pw}" y2="${py0.toFixed(1)}" stroke="#000000" stroke-width="2"/>`);
    lines.push(`<line x1="${px0.toFixed(1)}" y1="${mt}" x2="${px0.toFixed(1)}" y2="${mt+ph}" stroke="#000000" stroke-width="2"/>`);

    // Etiquetes eix Y
    for (let y = Math.ceil(yMin / yStepMajor) * yStepMajor; y <= yMax; y += yStepMajor) {
        if (y === 0) continue;
        const py = ty(y);
        lines.push(`<line x1="${(px0-4).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px0+4).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#000000" stroke-width="1.5"/>`);
        lines.push(`<text x="${(px0-8).toFixed(1)}" y="${(py+5).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="13" font-weight="500" fill="#000000">${y}</text>`);
    }

    // Etiquetes eix X
    for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
        if (x === 0) continue;
        const px = tx(x);
        lines.push(`<line x1="${px.toFixed(1)}" y1="${(py0-4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py0+4).toFixed(1)}" stroke="#000000" stroke-width="1.5"/>`);
        lines.push(`<text x="${px.toFixed(1)}" y="${(py0+18).toFixed(1)}" text-anchor="middle" font-family="'Barlow',sans-serif" font-size="13" font-weight="500" fill="#000000">${x}</text>`);
    }

    // Etiqueta 0
    lines.push(`<text x="${(px0-8).toFixed(1)}" y="${(py0+18).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="13" font-weight="500" fill="#000000">0</text>`);

    // Etiquetes d'eixos
    lines.push(`<text x="${(ml+pw).toFixed(1)}" y="${(py0-8).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#000000">x</text>`);
    lines.push(`<text x="${(px0+6).toFixed(1)}" y="16" text-anchor="start" font-family="'Barlow',sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#000000">y</text>`);

    // ---- Asímptotes (línies discontínues) -----------------------------------

    // Asímptotes verticals (vermell)
    func.va.forEach(a => {
        if (a < xMin || a > xMax) return;
        const px = tx(a);
        lines.push(`<line x1="${px.toFixed(1)}" y1="${mt}" x2="${px.toFixed(1)}" y2="${mt+ph}" stroke="#e53e3e" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8"/>`);
        lines.push(`<text x="${(px+5).toFixed(1)}" y="${(mt+14).toFixed(1)}" font-family="'Barlow',sans-serif" font-size="12" fill="#e53e3e" font-weight="600">x = ${a}</text>`);
    });

    // Asímptota horitzontal (blau)
    if (func.ha !== null) {
        const h = func.ha;
        if (h >= yMin && h <= yMax) {
            const py = ty(h);
            lines.push(`<line x1="${ml}" y1="${py.toFixed(1)}" x2="${ml+pw}" y2="${py.toFixed(1)}" stroke="#2b6cb0" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8"/>`);
            lines.push(`<text x="${(ml+4).toFixed(1)}" y="${(py-5).toFixed(1)}" font-family="'Barlow',sans-serif" font-size="12" fill="#2b6cb0" font-weight="600">y = ${h}</text>`);
        }
    }

    // Asímptota obliqua (verd fosc)
    if (func.oa) {
        const { m, b } = func.oa;
        const y1 = m * xMin + b;
        const y2 = m * xMax + b;
        const p1x = ml, p1y = ty(y1);
        const p2x = ml + pw, p2y = ty(y2);
        lines.push(`<line x1="${p1x}" y1="${p1y.toFixed(1)}" x2="${p2x}" y2="${p2y.toFixed(1)}" stroke="#276749" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8"/>`);
        const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` − ${-b}`;
        lines.push(`<text x="${(ml+4).toFixed(1)}" y="${(ty(m*xMin+b)-5).toFixed(1)}" font-family="'Barlow',sans-serif" font-size="12" fill="#276749" font-weight="600">y = x${bStr}</text>`);
    }

    // ---- Corba de la funció -------------------------------------------------
    const pathData = _buildCurvePaths(func, tx, ty, xMin, xMax, yMin, yMax, ml, mr, mt, ph, pw);
    pathData.forEach(d => {
        lines.push(`<path d="${d}" fill="none" stroke="#0077b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`);
    });

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:calc(100vh - 130px);max-height:520px;display:block">${lines.join('')}</svg>`;
}

function _yStep(yMin, yMax) {
    const span = yMax - yMin;
    if (span <= 8)  return 1;
    if (span <= 16) return 2;
    if (span <= 30) return 5;
    return 10;
}

function _buildCurvePaths(func, tx, ty, xMin, xMax, yMin, yMax, ml, mr, mt, ph, pw) {
    const N       = 600;
    const eps     = (xMax - xMin) * 0.018;   // zona d'exclusió al voltant de les AV
    const yClip   = (yMax - yMin) * 1.1;
    const paths   = [];

    // Dividir el rang x en intervals entre AV (i extrems)
    const breaks  = [-Infinity, ...func.va.slice().sort((a,b)=>a-b), Infinity];
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
            const clampedY = Math.max(yMin - yClip, Math.min(yMax + yClip, y));
            const px = tx(x);
            const py = ty(clampedY);
            const cmd = (d === '' || d.endsWith(' ')) ? `M ${px.toFixed(2)} ${py.toFixed(2)}` : ` L ${px.toFixed(2)} ${py.toFixed(2)}`;
            d += cmd;
        }
        // Dividir el path en segments continus
        d.split(' M ').filter(s => s.trim()).forEach(seg => {
            const full = seg.startsWith('M') ? seg : 'M ' + seg;
            if (full.includes('L')) paths.push(full);
        });
    });

    return paths;
}

// ============================================================================
// CICLE DE JOC
// ============================================================================

function buildLevel() {
    isAnswered   = false;
    attemptsLeft = MAX_INTENTS;

    // Esborra botó "Següent" si existia
    const oldNext = document.getElementById('btn-next');
    if (oldNext) oldNext.remove();

    // Restaura el feedback a la posició original (després de les opcions)
    if (els.feedback.previousElementSibling !== els.options) {
        els.options.parentNode.insertBefore(els.feedback, els.options.nextSibling);
    }

    // Genera nova funció i pregunta
    currentFunc = FunctionEngine.generateFunction(GAME_LEVEL);
    challenge   = QuestionBankA.generateChallenge(currentFunc, GAME_LEVEL);

    // Capçalera
    els.qDisplay.textContent     = `Pregunta ${currentQ + 1} de ${TOTAL_Q}`;
    els.scoreDisplay.textContent = `Punts: ${score}`;
    els.attDisplay.textContent   = `Intents: ${attemptsLeft}`;
    els.attDisplay.classList.remove('danger');

    // Gràfic
    els.graphContainer.innerHTML = renderSVG(currentFunc);

    // Pregunta
    els.prompt.innerHTML = challenge.prompt;

    // Feedback buit
    els.feedback.innerHTML    = '';
    els.feedback.className    = 'feedback-area';
    els.feedback.style.opacity = '0';

    // Opcions
    els.options.className = 'options-list';
    els.options.innerHTML = '';
    challenge.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.innerHTML = opt.text;
        btn.style.animationDelay = `${idx * 60}ms`;
        btn.addEventListener('click', () => checkAnswer(opt, btn));
        els.options.appendChild(btn);
    });
}

function checkAnswer(opt, btn) {
    if (isAnswered) return;

    if (opt.isCorrect) {
        isAnswered = true;
        const pts  = attemptsLeft === MAX_INTENTS ? PTS_FIRST : PTS_SECOND;
        score     += pts;

        btn.classList.add('correct');
        _disableAllButtons();
        history.push({ type: challenge.type, correct: true, pointsEarned: pts });
        _showFeedback(opt.feedback, 'correct');
        els.scoreDisplay.textContent = `Punts: ${score}`;
        setTimeout(() => _nextQuestion(), 1600);

    } else {
        attemptsLeft--;
        btn.classList.add('wrong');
        els.attDisplay.textContent = `Intents: ${attemptsLeft}`;

        if (attemptsLeft <= 0) {
            isAnswered = true;
            history.push({ type: challenge.type, correct: false, pointsEarned: 0 });

            // Amaga totes les opcions
            Array.from(els.options.querySelectorAll('.btn-option')).forEach(b => {
                b.style.pointerEvents = 'none';
                b.style.display = 'none';
            });

            // B) Mou feedback ABANS de les opcions + mostra'l
            els.options.parentNode.insertBefore(els.feedback, els.options);
            _showFeedback('Ja has gastat tots els intents. Aquí tens la resposta correcta.', 'neutral');

            // A) Mostra la correcta (0.8s)
            setTimeout(() => {
                Array.from(els.options.querySelectorAll('.btn-option')).forEach(b => {
                    const optData = challenge.options.find(o => b.innerHTML.trim() === o.text.trim());
                    if (optData && optData.isCorrect) {
                        b.style.display = '';
                        b.classList.add('reveal-answer');
                    }
                });
                // C) Botó següent (1.2s addicionals)
                setTimeout(() => _showNextButton(), 1200);
            }, 800);

        } else {
            els.attDisplay.classList.add('danger');
            _showFeedback(`✗ Incorrecte. ${opt.feedback}`, 'wrong');
        }
    }
}

function _nextQuestion() {
    currentQ++;
    if (currentQ >= TOTAL_Q) {
        _showSummary();
    } else {
        buildLevel();
    }
}

function _disableAllButtons() {
    Array.from(els.options.querySelectorAll('.btn-option'))
        .forEach(b => { b.style.pointerEvents = 'none'; });
}

function _showFeedback(text, type) {
    els.feedback.textContent   = text;
    els.feedback.className     = `feedback-area feedback-${type}`;
    els.feedback.style.opacity = '1';
}

function _showNextButton() {
    const btn     = document.createElement('button');
    btn.id        = 'btn-next';
    btn.className = 'btn-next';
    btn.textContent = 'Següent pregunta →';
    btn.addEventListener('click', () => _nextQuestion());
    els.options.insertAdjacentElement('afterend', btn);
}

// ============================================================================
// RESUM FINAL
// ============================================================================
function _showSummary() {
    els.gameScreen.classList.add('hidden');
    els.summaryScreen.classList.remove('hidden');

    const maxScore  = TOTAL_Q * PTS_FIRST;
    const firstTry  = history.filter(h => h.correct && h.pointsEarned === PTS_FIRST).length;
    const secondTry = history.filter(h => h.correct && h.pointsEarned === PTS_SECOND).length;
    const failed    = history.filter(h => !h.correct).length;
    const pct       = Math.round(score / maxScore * 100);

    const scoreOver10Raw = score / maxScore * 10;
    const scoreOver10    = Number.isInteger(scoreOver10Raw)
        ? String(scoreOver10Raw)
        : scoreOver10Raw.toFixed(2).replace('.', ',');

    const trophy = pct >= 90 ? '🌟' : pct >= 70 ? '😊' : pct >= 50 ? '🙂' : '💪';

    els.summaryScreen.innerHTML = `
        <div class="summary-wrap">
            <div class="summary-trophy">${trophy}</div>
            <h2 class="summary-title">Partida completada</h2>
            <div class="summary-score-row">
                <span class="summary-score-label">Puntuació</span>
                <span class="summary-score-value">${scoreOver10}</span>
            </div>
            <div class="summary-bar-bg">
                <div class="summary-bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="summary-stats">
                <div class="summary-stat summary-stat--ok">
                    <span class="stat-num">${firstTry}</span>
                    <span class="stat-desc">al primer intent</span>
                </div>
                <div class="summary-stat summary-stat--warn">
                    <span class="stat-num">${secondTry}</span>
                    <span class="stat-desc">al segon intent</span>
                </div>
                <div class="summary-stat summary-stat--err">
                    <span class="stat-num">${failed}</span>
                    <span class="stat-desc">sense resoldre</span>
                </div>
            </div>
            <button class="btn-restart" id="btn-restart">Torna a jugar</button>
        </div>`;

    document.getElementById('btn-restart').addEventListener('click', () => {
        currentQ = 0; score = 0; history = [];
        els.summaryScreen.classList.add('hidden');
        els.gameScreen.classList.remove('hidden');
        buildLevel();
    });
}

// ============================================================================
// INICIALITZACIÓ
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (els.levelDisplay) {
        const lbls = { 1: 'Nivell fàcil', 2: 'Nivell mitjà', 3: 'Nivell difícil' };
        els.levelDisplay.textContent = lbls[GAME_LEVEL] || `Nivell ${GAME_LEVEL}`;
    }
    els.gameScreen.classList.remove('hidden');
    buildLevel();
});
