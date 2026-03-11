/**
 * ============================================================================
 * PROJECTE: Recta Numèrica Doble
 * FITXER: js/recta-numerica/recta-numerica.js
 * ROL: Controlador DOM. Dibuixa el gràfic SVG i gestiona el bucle de joc.
 *
 * PARÀMETRES URL:
 *   ?nivell=1|2|3   Nivell de dificultat (defecte: 2)
 *   ?preguntes=N    Nombre de preguntes per partida (defecte: 6)
 *
 * DEPENDÈNCIES (ordre de càrrega):
 *   cloud-engine.js → strings.js → distractor-lib.js → question-bank.js → (aquest, defer)
 * ============================================================================
 */

// ============================================================================
// CONFIGURACIÓ
// ============================================================================
const _params       = new URLSearchParams(window.location.search);
const GAME_LEVEL    = Math.min(3, Math.max(1, parseInt(_params.get('nivell')    || '2', 10)));
const TOTAL_Q       = Math.min(12, Math.max(3, parseInt(_params.get('preguntes') || '6', 10)));
const MAX_INTENTS   = 3;
const PTS_FIRST     = 10;
const PTS_SECOND    = 5;

// ============================================================================
// ESTAT DEL JOC
// ============================================================================
let currentQ       = 0;
let score          = 0;
let attemptsLeft   = MAX_INTENTS;
let isAnswered     = false;
let challengeData  = null;
let cloud          = null;
let yRange         = null;

// Historial per al resum final
let history = [];   // [{type, correct, pointsEarned}]

// ============================================================================
// ELEMENTS DOM
// ============================================================================
const els = {
    gameScreen:   document.getElementById('game-screen'),
    summaryScreen:document.getElementById('summary-screen'),
    graphContainer:document.getElementById('graph-container'),
    prompt:       document.getElementById('question-prompt'),
    options:      document.getElementById('options-container'),
    feedback:     document.getElementById('feedback'),
    scoreDisplay: document.getElementById('score-display'),
    qDisplay:     document.getElementById('q-display'),
    levelDisplay: document.getElementById('level-display'),
    attDisplay:   document.getElementById('attempts-display'),
};

// ============================================================================
// SVG — RENDERITZACIÓ DEL GRÀFIC
// ============================================================================

/**
 * Genera l'SVG del gràfic.
 * @param {object[]} cloud   Punts {x, y}
 * @param {object}   yr      Rang Y {min, max, majorStep, minorStep}
 * @returns {string}         Markup SVG complet
 */
function renderSVG(cloud, yr) {
    const W = 560, H = 420;
    // mt ampli per a etiqueta Y per sobre del pla
    const ml = 20, mr = 20, mt = 30, mb = 20;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    const xMin = -5, xMax = 5;
    const tx = x => ml + (x - xMin) / (xMax - xMin) * pw;
    const ty = y => mt + ph - (y - yr.min) / (yr.max - yr.min) * ph;

    // Posicions dels eixos en coordenades SVG
    const px0 = tx(0);                              // Eix Y (x=0)
    const py0 = (yr.min <= 0 && yr.max >= 0)        // Eix X (y=0)
        ? ty(0) : mt + ph;

    const lines = [];

    // Fons blanc pur — sense rectangle de frontera
    lines.push(`<rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" fill="#ffffff"/>`);

    // Grid menor (rangs mitjà/gran)
    if (yr.minorStep < yr.majorStep) {
        for (let y = yr.min; y <= yr.max; y += yr.minorStep) {
            const py = ty(y);
            lines.push(`<line x1="${ml}" y1="${py.toFixed(1)}" x2="${ml+pw}" y2="${py.toFixed(1)}" stroke="#b8c4ce" stroke-width="0.7"/>`);
        }
    }

    // Grid vertical (cada 1 unitat de x)
    for (let x = xMin; x <= xMax; x++) {
        const px = tx(x);
        lines.push(`<line x1="${px.toFixed(1)}" y1="${mt}" x2="${px.toFixed(1)}" y2="${mt+ph}" stroke="#b8c4ce" stroke-width="0.7"/>`);
    }

    // Grid major Y
    for (let y = yr.min; y <= yr.max; y += yr.majorStep) {
        const py = ty(y);
        lines.push(`<line x1="${ml}" y1="${py.toFixed(1)}" x2="${ml+pw}" y2="${py.toFixed(1)}" stroke="#9aaab8" stroke-width="1"/>`);
    }

    // Eix X (y=0)
    lines.push(`<line x1="${ml}" y1="${py0.toFixed(1)}" x2="${ml+pw}" y2="${py0.toFixed(1)}" stroke="#000000" stroke-width="2"/>`);

    // Eix Y (x=0)
    lines.push(`<line x1="${px0.toFixed(1)}" y1="${mt}" x2="${px0.toFixed(1)}" y2="${mt+ph}" stroke="#000000" stroke-width="2"/>`);

    // Etiquetes eix Y — sobre l'eix Y, a l'esquerra de la línia
    for (let y = yr.min; y <= yr.max; y += yr.majorStep) {
        if (y === 0) continue;   // el 0 es posa a la intersecció
        const py = ty(y);
        // Tick sobre l'eix Y
        lines.push(`<line x1="${(px0-4).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px0+4).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#000000" stroke-width="1.5"/>`);
        // Text a l'esquerra de l'eix Y
        lines.push(`<text x="${(px0-8).toFixed(1)}" y="${(py+5).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="14" font-weight="500" fill="#000000">${y}</text>`);
    }

    // Etiquetes eix X — sobre l'eix X, sota la línia
    for (let x = xMin; x <= xMax; x++) {
        if (x === 0) continue;   // el 0 es posa a la intersecció
        const px = tx(x);
        // Tick sobre l'eix X
        lines.push(`<line x1="${px.toFixed(1)}" y1="${(py0-4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py0+4).toFixed(1)}" stroke="#000000" stroke-width="1.5"/>`);
        // Text sota l'eix X
        lines.push(`<text x="${px.toFixed(1)}" y="${(py0+20).toFixed(1)}" text-anchor="middle" font-family="'Barlow',sans-serif" font-size="14" font-weight="500" fill="#000000">${x}</text>`);
    }

    // Etiqueta "0" a la intersecció dels eixos
    lines.push(`<text x="${(px0-8).toFixed(1)}" y="${(py0+20).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="14" font-weight="500" fill="#000000">0</text>`);

    // Etiqueta eix Y: a la línia superior del viewBox (y=16), alineada amb el títol de la pregunta
    lines.push(`<text x="${(px0 + 6).toFixed(1)}" y="16" text-anchor="start" font-family="'Barlow',sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#000000">y: temperatura (ºC)</text>`);

    // Etiqueta eix X: a sobre de l'extrem dret de l'eix, text-anchor="end" per no sortir del viewBox
    lines.push(`<text x="${(ml + pw).toFixed(1)}" y="${(py0 - 7).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#000000">x: temps (dies)</text>`);

    // Punts del núvol (dibuixats al final, per davant de tot)
    cloud.forEach(pt => {
        const px = tx(pt.x), py = ty(pt.y);
        lines.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7" fill="#0077b6" stroke="white" stroke-width="2.5"/>`);
    });

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block">${lines.join('')}</svg>`;
}

// ============================================================================
// CICLE DE JOC
// ============================================================================

function buildLevel() {
    isAnswered   = false;
    attemptsLeft = MAX_INTENTS;

    // Genera nou núvol i rang per a cada pregunta
    yRange        = CloudEngine.chooseYRange(GAME_LEVEL);
    cloud         = CloudEngine.generateCloud(yRange);
    challengeData = QuestionBank.generateChallenge(cloud, yRange, GAME_LEVEL);

    // Actualitza capçalera
    els.qDisplay.textContent     = `Pregunta ${currentQ + 1} de ${TOTAL_Q}`;
    els.scoreDisplay.textContent = `Punts: ${score}`;
    els.attDisplay.textContent   = `Intents: ${attemptsLeft}`;
    els.attDisplay.classList.remove('danger');

    // Dibuixa el gràfic
    els.graphContainer.innerHTML = renderSVG(cloud, yRange);

    // Mostra la pregunta
    els.prompt.textContent = challengeData.prompt;

    // Esborra botó "Següent" si existia
    const oldNext = document.getElementById('btn-next');
    if (oldNext) oldNext.remove();

    // Restaura el feedback a la posició original (després de les opcions)
    if (els.feedback.previousElementSibling !== els.options) {
        els.options.parentNode.insertBefore(els.feedback, els.options.nextSibling);
    }

    // Feedback buit
    els.feedback.innerHTML   = '';
    els.feedback.className   = 'feedback-area';
    els.feedback.style.opacity = '0';

    // Crea els botons d'opcions
    const isGrid = challengeData.layout === 'grid';
    els.options.className = isGrid ? 'options-grid' : 'options-list';
    els.options.innerHTML = '';

    challengeData.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.textContent = opt.text;
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

        // Estil botó correcte
        btn.classList.add('correct');
        _disableAllButtons();

        history.push({ type: challengeData.type, correct: true, pointsEarned: pts });

        _showFeedback(opt.feedback, 'correct');
        els.scoreDisplay.textContent = `Punts: ${score}`;

        setTimeout(() => _nextQuestion(), 1600);

    } else {
        attemptsLeft--;
        btn.classList.add('wrong');
        els.attDisplay.textContent = `Intents: ${attemptsLeft}`;

        if (attemptsLeft <= 0) {
            // Esgotats els intents: ordre B) feedback → A) resposta correcta → C) botó següent
            isAnswered = true;
            history.push({ type: challengeData.type, correct: false, pointsEarned: 0 });

            // Amaga totes les opcions immediatament
            Array.from(els.options.querySelectorAll('.btn-option')).forEach(b => {
                b.style.pointerEvents = 'none';
                b.style.display = 'none';
            });

            // B) Mou el feedback ABANS del contenidor d'opcions al DOM, i mostra'l
            els.options.parentNode.insertBefore(els.feedback, els.options);
            _showFeedback('Ja has gastat tots els intents. Aquí tens la resposta correcta.', 'neutral');

            // A) Resposta correcta — després de 0.8s
            setTimeout(() => {
                Array.from(els.options.querySelectorAll('.btn-option')).forEach(b => {
                    const optData = challengeData.options.find(o => b.textContent.trim() === o.text.trim());
                    if (optData && optData.isCorrect) {
                        b.style.display = '';
                        b.classList.add('reveal-answer');
                    }
                });

                // C) Botó següent — després de 1.2s addicionals (2.0s total)
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

// _highlightCorrectButton eliminat: la lògica ara és dins checkAnswer

function _showFeedback(text, type) {
    els.feedback.textContent  = text;
    els.feedback.className    = `feedback-area feedback-${type}`;
    els.feedback.style.opacity = '1';
}

function _showNextButton() {
    const btn = document.createElement('button');
    btn.id        = 'btn-next';
    btn.className = 'btn-next';
    btn.textContent = 'Següent pregunta →';
    btn.addEventListener('click', () => _nextQuestion());
    // Insereix sota el feedback
    els.options.insertAdjacentElement('afterend', btn);
}

// ============================================================================
// PANTALLA DE RESUM FINAL
// ============================================================================
function _showSummary() {
    els.gameScreen.style.display   = 'none';
    els.summaryScreen.style.display = 'block';

    const maxScore  = TOTAL_Q * PTS_FIRST;
    const firstTry  = history.filter(h => h.correct && h.pointsEarned === PTS_FIRST).length;
    const secondTry = history.filter(h => h.correct && h.pointsEarned === PTS_SECOND).length;
    const failed    = history.filter(h => !h.correct).length;
    const pct       = Math.round(score / maxScore * 100);

    // Puntuació sobre 10, amb coma decimal, sense zeros finals innecessaris
    const scoreOver10Raw = score / maxScore * 10;
    const scoreOver10 = Number.isInteger(scoreOver10Raw)
        ? String(scoreOver10Raw)
        : scoreOver10Raw.toFixed(2).replace('.', ',');

    // Emoji de trofeu basat en percentatge
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
        els.summaryScreen.style.display = 'none';
        els.gameScreen.style.display    = 'block';
        buildLevel();
    });
}

// ============================================================================
// INICIALITZACIÓ
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    // Mostra el nivell a la capçalera
    if (els.levelDisplay) {
        const lbls = { 1: 'Nivell fàcil', 2: 'Nivell mitjà', 3: 'Nivell difícil' };
        els.levelDisplay.textContent = lbls[GAME_LEVEL] || `Nivell ${GAME_LEVEL}`;
    }

    // [ROUND 5 — botó Tutorial: fade-out 2s → navegació a la URL del tutorial]
    const TUTORIAL_URL   = 'https://step-quiz.net/recta-numerica-tutorial';
    const FADE_DURATION  = 1500;   /* ms — [ROUND 6: reduït de 2000 a 1500] ha de coincidir amb transition: opacity 1.5s del CSS */
    const btnTutorial    = document.getElementById('btn-tutorial');
    const fadeOverlay    = document.getElementById('fade-overlay');
    if (btnTutorial && fadeOverlay) {
        btnTutorial.addEventListener('click', () => {
            fadeOverlay.classList.add('active');   // dispara la transició CSS d'opacitat 0→1
            setTimeout(() => {
                window.location.href = TUTORIAL_URL;
            }, FADE_DURATION);
        });
    }

    els.gameScreen.style.display = 'block';
    buildLevel();
});
