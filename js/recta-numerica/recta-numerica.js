/**
 * ============================================================================
 * PROJECTE: Recta Numèrica Doble
 * FITXER: js/recta-numerica/recta-numerica.js
 * ROL: Controlador DOM. Dibuixa el gràfic SVG i gestiona el bucle de joc.
 *
 * PARÀMETRES URL (llegits per utils.js + config.js):
 *   ?nivell=1|2|3          Nivell de dificultat (defecte: 2)
 *   ?totalsessions=N       Nombre de sessions (defecte: 1)
 *   ?totaloperations=N     Nombre de preguntes per sessió (defecte: 6)
 *   ?maxintents=N          Intents per pregunta (defecte: 2)
 *   ?maxenllocmitjana=0|1  Nota: màxim sessió (1) o mitjana (0) (defecte: 1)
 *
 * DEPENDÈNCIES (ordre de càrrega):
 *   utils.js → config.js → game-core.js → cloud-engine.js → strings.js →
 *   distractor-lib.js → question-bank.js → (aquest, defer)
 *
 * GLOBALS HERETATS DE game-core.js:
 *   attemptsLeft, currentOperation, sessionScore, sessionHistory,
 *   isTransitioning, showMiniOverlay, hideMiniOverlay, endSession,
 *   startGame, recordAnswerToHistory, injectSharedHTML, validateConfig
 *
 * GLOBALS HERETATS DE config.js:
 *   TOTAL_OPERATIONS, MAX_INTENTS, TOTAL_SESSIONS, MAX_ENLLOC_MITJANA
 * ============================================================================
 */

// ============================================================================
// CONFIGURACIÓ ESPECÍFICA D'AQUEST JOC
// ============================================================================
const _params    = new URLSearchParams(window.location.search);
const GAME_LEVEL = Math.min(3, Math.max(1, parseInt(_params.get('nivell') || '2', 10)));
const PTS_FIRST  = 10;   // punts si s'encerta al primer intent
const PTS_SECOND = 5;    // punts si s'encerta a partir del segon intent

// ============================================================================
// ESTAT DEL JOC (específic d'aquest controlador)
// attemptsLeft, currentOperation, sessionScore, sessionHistory:
//   → gestionats globalment per game-core.js
// ============================================================================
let isAnswered    = false;
let challengeData = null;
let cloud         = null;
let yRange        = null;

// ============================================================================
// ELEMENTS DOM
// ============================================================================
const els = {
    gameScreen:     document.getElementById('game-screen'),
    graphContainer: document.getElementById('graph-container'),
    prompt:         document.getElementById('question-prompt'),
    options:        document.getElementById('options-container'),
    feedback:       document.getElementById('feedback'),
    scoreDisplay:   document.getElementById('score-display'),
    qDisplay:       document.getElementById('q-display'),
    levelDisplay:   document.getElementById('level-display'),
    attDisplay:     document.getElementById('attempts-display'),
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
    const ml = 20, mr = 20, mt = 30, mb = 20;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    const xMin = -5, xMax = 5;
    const tx = x => ml + (x - xMin) / (xMax - xMin) * pw;
    const ty = y => mt + ph - (y - yr.min) / (yr.max - yr.min) * ph;

    const px0 = tx(0);
    const py0 = (yr.min <= 0 && yr.max >= 0) ? ty(0) : mt + ph;

    const lines = [];

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

    // Etiquetes eix Y
    for (let y = yr.min; y <= yr.max; y += yr.majorStep) {
        if (y === 0) continue;
        const py = ty(y);
        lines.push(`<line x1="${(px0-4).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px0+4).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#000000" stroke-width="1.5"/>`);
        lines.push(`<text x="${(px0-8).toFixed(1)}" y="${(py+5).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="14" font-weight="500" fill="#000000">${y}</text>`);
    }

    // Etiquetes eix X
    for (let x = xMin; x <= xMax; x++) {
        if (x === 0) continue;
        const px = tx(x);
        lines.push(`<line x1="${px.toFixed(1)}" y1="${(py0-4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py0+4).toFixed(1)}" stroke="#000000" stroke-width="1.5"/>`);
        lines.push(`<text x="${px.toFixed(1)}" y="${(py0+20).toFixed(1)}" text-anchor="middle" font-family="'Barlow',sans-serif" font-size="14" font-weight="500" fill="#000000">${x}</text>`);
    }

    // Etiqueta "0" a la intersecció
    lines.push(`<text x="${(px0-8).toFixed(1)}" y="${(py0+20).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="14" font-weight="500" fill="#000000">0</text>`);

    // Etiquetes dels eixos
    lines.push(`<text x="${(px0 + 6).toFixed(1)}" y="16" text-anchor="start" font-family="'Barlow',sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#000000">y: temperatura (ºC)</text>`);
    lines.push(`<text x="${(ml + pw).toFixed(1)}" y="${(py0 - 7).toFixed(1)}" text-anchor="end" font-family="'Barlow',sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#000000">x: temps (dies)</text>`);

    // Punts del núvol
    cloud.forEach(pt => {
        const px = tx(pt.x), py = ty(pt.y);
        lines.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7" fill="#0077b6" stroke="white" stroke-width="2.5"/>`);
    });

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block">${lines.join('')}</svg>`;
}

// ============================================================================
// CICLE DE JOC
// ============================================================================

/**
 * Construeix una nova pregunta. Cridat per game-core.js via startSession().
 */
function buildLevel() {
    // showScreen() de game-core usa display:'block'; restaurem display:'flex'
    // que necessita el layout de dues columnes d'aquest joc.
    els.gameScreen.style.display = 'flex';

    isAnswered   = false;
    attemptsLeft = MAX_INTENTS;

    // Genera nou núvol i rang per a cada pregunta
    yRange        = CloudEngine.chooseYRange(GAME_LEVEL);
    cloud         = CloudEngine.generateCloud(yRange);
    challengeData = QuestionBank.generateChallenge(cloud, yRange, GAME_LEVEL);

    // Actualitza capçalera
    els.qDisplay.textContent     = `Pregunta ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.textContent = `Punts: ${sessionScore}`;
    els.attDisplay.textContent   = `Intents: ${attemptsLeft}`;
    els.attDisplay.classList.remove('danger');

    // Dibuixa el gràfic
    els.graphContainer.innerHTML = renderSVG(cloud, yRange);

    // Mostra la pregunta
    els.prompt.textContent = challengeData.prompt;

    // Feedback buit
    els.feedback.innerHTML     = '';
    els.feedback.className     = 'feedback-area';
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
        sessionScore += pts;

        btn.classList.add('correct');
        _disableAllButtons();
        _showFeedback(opt.feedback, 'correct');
        els.scoreDisplay.textContent = `Punts: ${sessionScore}`;

        recordAnswerToHistory(challengeData.prompt, opt.text, true);
        recordResult(attemptsLeft === MAX_INTENTS ? 1 : 2);
        _finishQuestion(pts);

    } else {
        attemptsLeft--;
        btn.classList.add('wrong');
        els.attDisplay.textContent = `Intents: ${attemptsLeft}`;

        if (attemptsLeft <= 0) {
            isAnswered = true;
            recordAnswerToHistory(challengeData.prompt, '—', false);

            recordResult(4);
            _disableAllButtons();

            // Revela la resposta correcta
            Array.from(els.options.querySelectorAll('.btn-option')).forEach(b => {
                const optData = challengeData.options.find(o => b.textContent.trim() === o.text.trim());
                if (optData && optData.isCorrect) b.classList.add('reveal-answer');
            });

            _finishQuestion(0);

        } else {
            els.attDisplay.classList.add('danger');
            _showFeedback(`✗ Incorrecte. ${opt.feedback}`, 'wrong');
        }
    }
}

/**
 * Mostra el mini overlay (èxit o intents esgotats) i avança a la pregunta següent.
 * Segueix el mateix patró que _finishOp() d'enters.html.
 */
function _finishQuestion(levelPoints) {
    const waitTime = showMiniOverlay(levelPoints);
    setTimeout(() => {
        hideMiniOverlay();
        _nextQuestion();
    }, waitTime);
}

function _nextQuestion() {
    currentOperation++;
    if (currentOperation >= TOTAL_OPERATIONS) {
        endSession();   // game-core gestiona sessions i pantalla final
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

// ============================================================================
// FIX LOCAL: scroll de l'informe final
// Sobrescriu showHistorySummary() de game-core.js per forçar scroll al .panel
// d'aquest joc. game-core.js no es modifica per no afectar els altres jocs.
// ============================================================================
const _origShowHistory = showHistorySummary;
window.showHistorySummary = function () {
    _origShowHistory();
    const panel = document.querySelector('.panel');
    if (panel) {
        panel.style.overflowY = 'auto';
        panel.style.maxHeight = '100vh';
    }
};

// ============================================================================
// INICIALITZACIÓ
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {

    // Mostra el nivell a la capçalera
    if (els.levelDisplay) {
        const lbls = { 1: 'Nivell fàcil', 2: 'Nivell mitjà', 3: 'Nivell difícil' };
        els.levelDisplay.textContent = lbls[GAME_LEVEL] || `Nivell ${GAME_LEVEL}`;
    }

    // Botó Tutorial: fade-out → navegació a la URL del tutorial
    const TUTORIAL_URL  = 'https://step-quiz.net/recta-numerica-tutorial';
    const FADE_DURATION = 1500;
    const btnTutorial   = document.getElementById('btn-tutorial');
    const fadeOverlay   = document.getElementById('fade-overlay');
    if (btnTutorial && fadeOverlay) {
        btnTutorial.addEventListener('click', () => {
            fadeOverlay.classList.add('active');
            setTimeout(() => { window.location.href = TUTORIAL_URL; }, FADE_DURATION);
        });
    }

    // Injecta mini overlay, session-end-screen i final-screen al DOM;
    // valida la configuració; i arrenca el joc.
    injectSharedHTML();
    validateConfig();
    startGame();
});
