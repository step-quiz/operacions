/**
 * ============================================================================
 * PROJECTE: Motor Educatiu d'Integrals (Vanilla JS)
 * FITXER: js/integrals/integrals.js
 * ROL: Controlador específic del joc d'integrals.
 * ARQUITECTURA:
 * - Mirall de derivades.js: mateixa estructura de funcions, mateixa separació
 *   de responsabilitats, mateixa gestió del feedback en tres nivells:
 *     1. Feedback immediat (opt.feedback): sempre visible en error.
 *     2. Hint ampliat (DistractorLib.FeedbackHints[errorType]): bloc groc
 *        expandible, apareix si existeix entrada per aquell errorType.
 *     3. Resposta correcta: visible quan s'esgoten tots els intents.
 * - errorHistory[]: registre paral·lel d'errorType per construir el resum
 *   pedagògic al final de sessió.
 * - game-core.js és INTOCABLE: la resposta correcta i el resum s'injecten
 *   al feedback container propi, no al mini-overlay de game-core.js.
 * DEPENDÈNCIES: Fitxer final. Ordre requerit:
 *   utils → config → game-core → math-engine → strings → distractor-lib
 *   → question-bank → (aquest, defer)
 * ============================================================================
 */

let errorHistory  = [];
let challengeData = null;

const els = {
    fxDisplay:        document.getElementById('fx-display'),
    optionsContainer: document.getElementById('options-container'),
    feedback:         document.getElementById('missatge-feedback'),
    scoreDisplay:     document.getElementById('score-display'),
    lvlDisplay:       document.getElementById('lvl-display'),
    attemptsDisplay:  document.getElementById('attempts-display')
};

// =========================================================================
// 1. Construeix un nou nivell
// =========================================================================
function buildLevel() {
    isTransitioning = false;
    attemptsLeft    = MAX_INTENTS;

    els.lvlDisplay.innerText      = `Integral ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.feedback.style.opacity    = '0';
    els.feedback.innerHTML        = '';

    challengeData = QuestionBank.generateChallenge();

    katex.render(challengeData.promptTex, els.fxDisplay, { throwOnError: false });

    const allOptions = [...challengeData.options].sort(() => Math.random() - 0.5);

    els.optionsContainer.innerHTML = '';
    allOptions.forEach((opt, i) => {
        const btn  = document.createElement('button');
        btn.className = 'btn-option';
        // Retard escalonat per a l'animació popIn
        btn.style.animationDelay = `${i * 60}ms`;
        const span = document.createElement('span');
        katex.render(opt.tex, span, { throwOnError: false });
        btn.appendChild(span);
        btn.onclick = () => checkAnswer(opt, btn);
        els.optionsContainer.appendChild(btn);
    });
}

// =========================================================================
// 2. Renderitza el feedback (tres nivells + resposta correcta opcional)
// =========================================================================

/**
 * Renderitza el bloc de feedback complet dins els.feedback.
 * @param {object}  opt          - L'opció clicada (té .feedback, .errorType, .isCorrect)
 * @param {boolean} showSolution - Si true, mostra la primitiva correcta amb KaTeX
 */
function renderFeedback(opt, showSolution = false) {
    const fc = els.feedback;

    if (opt.isCorrect) {
        fc.innerHTML     = `<strong class="feedback-correct">${opt.feedback}</strong>`;
        fc.style.opacity = '1';
        return;
    }

    // ── Nivell 1: feedback immediat
    fc.innerHTML     = `<span class="feedback-wrong">${opt.feedback}</span>`;
    fc.style.opacity = '1';

    // ── Nivell 2: botó "+ ajuda" que desplega el hint (si existeix)
    const hint = DistractorLib.FeedbackHints[opt.errorType];
    if (hint) {
        const toggleBtn       = document.createElement('button');
        toggleBtn.className   = 'hint-toggle-btn';
        toggleBtn.textContent = '+ ajuda';

        const hintBox         = document.createElement('div');
        hintBox.className     = 'hint-box';
        hintBox.textContent   = hint;
        hintBox.style.display = 'none';

        toggleBtn.addEventListener('click', () => {
            const isHidden        = hintBox.style.display === 'none';
            hintBox.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? '− ajuda' : '+ ajuda';
        });

        fc.appendChild(document.createElement('br'));
        fc.appendChild(toggleBtn);
        fc.appendChild(hintBox);
    }

    // ── Nivell 3: primitiva correcta (quan s'esgoten els intents)
    if (showSolution && challengeData?.solutionTex) {
        const solutionRow     = document.createElement('div');
        solutionRow.className = 'solution-reveal';

        const label       = document.createElement('span');
        label.className   = 'solution-label';
        label.innerText   = 'La primitiva correcta era:';

        const formula     = document.createElement('span');
        formula.className = 'solution-formula';
        katex.render(challengeData.solutionTex, formula, { throwOnError: false });

        solutionRow.appendChild(label);
        solutionRow.appendChild(formula);
        fc.appendChild(solutionRow);
    }
}

// =========================================================================
// 3. Comprova la resposta seleccionada
// =========================================================================
function checkAnswer(opt, clickedBtn) {
    if (isTransitioning) return;

    if (opt.isCorrect) {
        isTransitioning = true;
        renderFeedback(opt);

        recordAnswerToHistory(challengeData.promptTex, opt.tex, true);
        errorHistory.push({
            question:  challengeData.promptTex,
            questionN: currentOperation,
            errorType: null,
            isCorrect: true,
            meta:      challengeData.meta
        });

        const fails       = MAX_INTENTS - attemptsLeft;
        const levelPoints = Math.max(0, 10 - (fails * 2));
        sessionScore     += levelPoints;
        els.scoreDisplay.innerText = `Punts: ${sessionScore}`;

        Array.from(els.optionsContainer.children).forEach(b => b.style.pointerEvents = 'none');
        _finishOp(levelPoints);

    } else {
        attemptsLeft--;
        els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;

        // Marca el botó clicat com erroni
        if (clickedBtn) clickedBtn.classList.add('wrong');

        errorHistory.push({
            question:  challengeData.promptTex,
            questionN: currentOperation,
            errorType: opt.errorType,
            isCorrect: false,
            meta:      challengeData.meta
        });

        const isLastAttempt = attemptsLeft <= 0;

        // Mostra la solució correcta només quan s'esgoten els intents
        renderFeedback(opt, isLastAttempt);

        // Animació del comptador d'intents
        els.attemptsDisplay.classList.remove('blink');
        void els.attemptsDisplay.offsetWidth; // força reflow per reiniciar animació
        els.attemptsDisplay.classList.add('blink');
        if (attemptsLeft === 1) els.attemptsDisplay.classList.add('danger');
        setTimeout(() => els.attemptsDisplay.classList.remove('blink'), 1100);

        if (isLastAttempt) {
            isTransitioning = true;
            recordAnswerToHistory(challengeData.promptTex, opt.tex, false);
            // Petit retard per deixar que l'alumne llegeixi la solució
            setTimeout(() => _finishOp(0), 1200);
        }
    }
}

// =========================================================================
// 4. Finalitza l'operació actual
// =========================================================================
function _finishOp(levelPoints) {
    const waitTime = showMiniOverlay(levelPoints);

    setTimeout(() => {
        hideMiniOverlay();
        currentOperation++;

        if (currentOperation >= TOTAL_OPERATIONS) {
            showSessionSummary();
        } else {
            buildLevel();
        }
    }, waitTime);
}

// =========================================================================
// 5. Resum pedagògic de sessió
// =========================================================================

/**
 * Construeix i mostra el resum de la sessió a partir d'errorHistory.
 * Amaga #game-screen i mostra #session-summary.
 * El botó "Continua" crida endSession() de game-core.js.
 */
function showSessionSummary() {
    // ── Estadístiques per pregunta ──
    const byQuestion = {};
    errorHistory.forEach(e => {
        if (!byQuestion[e.questionN]) byQuestion[e.questionN] = [];
        byQuestion[e.questionN].push(e);
    });

    let firstTry = 0, retried = 0, failed = 0;
    Object.values(byQuestion).forEach(entries => {
        const hasCorrect = entries.some(e =>  e.isCorrect);
        const hasError   = entries.some(e => !e.isCorrect);
        if      (hasCorrect && !hasError) firstTry++;
        else if (hasCorrect)              retried++;
        else                              failed++;
    });

    // ── Freqüència d'errors conceptuals ──
    const errorCounts = {};
    errorHistory
        .filter(e => !e.isCorrect && e.errorType)
        .forEach(e => { errorCounts[e.errorType] = (errorCounts[e.errorType] || 0) + 1; });

    const sortedErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);

    // ── Construeix el DOM del resum ──
    const panel = document.getElementById('session-summary');
    if (!panel) { endSession(); return; }

    const maxScore = TOTAL_OPERATIONS * 10;
    let html = `
        <div class="summary-score">
            <span class="summary-score-label">Puntuació final</span>
            <span class="summary-score-value">${sessionScore} / ${maxScore}</span>
        </div>
        <div class="summary-stats">
            <div class="summary-stat summary-stat--ok">
                <span class="summary-stat-num">${firstTry}</span>
                <span class="summary-stat-desc">correctes a la primera</span>
            </div>
            <div class="summary-stat summary-stat--warn">
                <span class="summary-stat-num">${retried}</span>
                <span class="summary-stat-desc">correctes al segon intent</span>
            </div>
            <div class="summary-stat summary-stat--err">
                <span class="summary-stat-num">${failed}</span>
                <span class="summary-stat-desc">sense resoldre</span>
            </div>
        </div>`;

    if (sortedErrors.length > 0) {
        html += `<div class="summary-errors-title">Errors conceptuals detectats</div>
                 <div class="summary-errors-list">`;
        sortedErrors.forEach(([type, count]) => {
            const hint  = DistractorLib.FeedbackHints[type] || '';
            const times = count === 1 ? '1 vegada' : `${count} vegades`;
            html += `
                <div class="summary-error-item">
                    <div class="summary-error-header">
                        <span class="summary-error-type">${_errorTypeLabel(type)}</span>
                        <span class="summary-error-count">${times}</span>
                    </div>
                    ${hint ? `<div class="summary-error-hint">${hint}</div>` : ''}
                </div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="summary-no-errors">Cap error conceptual detectat. Excel·lent!</div>`;
    }

    html += `<button class="summary-continue-btn" id="summary-continue-btn">Continua</button>`;

    panel.innerHTML = html;

    // ── Transició: amaga joc, mostra resum ──
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) gameScreen.style.display = 'none';
    panel.style.display = 'block';

    document.getElementById('summary-continue-btn')
        .addEventListener('click', () => {
            panel.style.display = 'none';
            errorHistory = [];   // reset per a la sessió següent
            endSession();
        });
}

/**
 * Tradueix un errorType intern a una etiqueta llegible per a l'alumne.
 */
function _errorTypeLabel(type) {
    const labels = {
        INT_NO_DIVIDE:      'Divisió per (n+1) oblidada',
        INT_WRONG_DIVISOR:  'Divisor incorrecte: n en lloc de (n+1)',
        INT_WRONG_EXP:      'Exponent no incrementat',
        INT_DERIVATIVE:     'S\'ha derivat en lloc d\'integrar',
        INT_MULTIPLY:       'Multiplicació en lloc de divisió per (n+1)',
        EXP_FORGOT_COEF:    'Factor 1/k oblidat a l\'exponencial',
        EXP_DERIVATIVE:     'Regla de la derivada aplicada a l\'integral',
        EXP_WRONG_COEF:     'Coeficient de l\'exponencial incorrecte',
        NO_PRIMITIVE:       'Funció original no integrada',
        INTEGRAL_CONFUSION: 'Confusió entre primitiva i derivada',
    };
    return labels[type] || type;
}

// =========================================================================
// 6. Arrencada automàtica
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof validateConfig   === 'function') validateConfig();
    if (typeof injectSharedHTML === 'function') injectSharedHTML();

    if (typeof startGame === 'function') {
        startGame();
    } else {
        const screen = document.getElementById('game-screen');
        if (screen) screen.style.display = 'block';
        buildLevel();
    }
});
