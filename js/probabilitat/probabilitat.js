/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/probabilitat/probabilitat.js
 * ROL: Controlador DOM del joc de probabilitat.
 * ARQUITECTURA:
 * - Segueix el patró de derivades.js: buildLevel → checkAnswer → _finishOp
 *   → showSessionSummary → endSession.
 * - L'enunciat és text HTML (promptText), no LaTeX.
 * - Les opcions de resposta són fraccions renderitzades amb KaTeX.
 * - Feedback a dos nivells (immediat + hint ampliat) + resposta correcta
 *   quan s'esgoten els intents.
 * - Resum pedagògic de sessió amb freqüència d'errors conceptuals.
 * DEPENDÈNCIES: Fitxer final. Ordre requerit:
 *   utils → config → game-core → math-engine → strings
 *   → distractor-lib → question-bank → (aquest, defer)
 * ============================================================================
 */

let errorHistory  = [];
let challengeData = null;

const els = {
    promptDisplay:    document.getElementById('prompt-display'),
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

    // showScreen() posa display:block com a inline style; cal corregir-ho
    const _gs = document.getElementById('game-screen');
    if (_gs) _gs.style.display = 'grid';

    const _lvl = new URLSearchParams(window.location.search).get('nivell');
    const _sessText = TOTAL_SESSIONS > 1 ? `Sessió ${currentSession + 1} de ${TOTAL_SESSIONS} · ` : '';
    const _lvlText  = _lvl ? ` · Nivell ${_lvl}` : '';
    els.lvlDisplay.innerText      = `${_sessText}Pregunta ${currentOperation + 1} de ${TOTAL_OPERATIONS}${_lvlText}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.feedback.style.opacity    = '0';
    els.feedback.innerHTML        = '';

    challengeData = QuestionBank.generateChallenge();

    // Enunciat com a HTML (no KaTeX); <br> inicial per separació visual
    els.promptDisplay.innerHTML = '<br>' + challengeData.promptText;

    const allOptions = shuffle([...challengeData.options]);

    els.optionsContainer.innerHTML = '';
    allOptions.forEach(opt => {
        const btn  = document.createElement('button');
        btn.className = 'btn-option';
        const span = document.createElement('span');
        katex.render(opt.tex, span, { throwOnError: false, displayMode: false });
        btn.appendChild(span);
        if (!/\\/.test(opt.tex)) btn.classList.add('opt-integer');
        btn.onclick = () => checkAnswer(opt, btn);
        els.optionsContainer.appendChild(btn);
    });
}

// =========================================================================
// 2. Renderitza el feedback (dos nivells + resposta correcta)
// =========================================================================
function renderFeedback(opt, showSolution) {
    const fc = els.feedback;

    if (opt.isCorrect) {
        fc.innerHTML     = `<strong class="feedback-correct">${opt.feedback}</strong>`;
        fc.style.opacity = '1';
        return;
    }

    fc.innerHTML     = `<span class="feedback-wrong">${opt.feedback}</span>`;
    fc.style.opacity = '1';

    // Hint ampliat (botó desplegable)
    const hint = DistractorLib.FeedbackHints[opt.errorType];
    if (hint) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className   = 'hint-toggle-btn';
        toggleBtn.textContent = '+ ajuda';

        const hintBox = document.createElement('div');
        hintBox.className     = 'hint-box';
        hintBox.textContent   = hint;
        hintBox.style.display = 'none';

        toggleBtn.addEventListener('click', () => {
            const isHidden = hintBox.style.display === 'none';
            hintBox.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? '− ajuda' : '+ ajuda';
        });

        fc.appendChild(document.createElement('br'));
        fc.appendChild(toggleBtn);
        fc.appendChild(hintBox);
    }

    // Resposta correcta quan s'esgoten els intents
    if (showSolution && challengeData?.solutionTex) {
        const solutionRow = document.createElement('div');
        solutionRow.className = 'solution-reveal';

        const label = document.createElement('span');
        label.className = 'solution-label';
        label.innerText = 'La resposta correcta era:';

        const formula = document.createElement('span');
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
        renderFeedback(opt, false);

        recordAnswerToHistory(challengeData.promptText, opt.tex, true);
        errorHistory.push({
            question: challengeData.promptText, questionN: currentOperation,
            errorType: null, isCorrect: true, meta: challengeData.meta
        });

        const fails       = MAX_INTENTS - attemptsLeft;
        const levelPoints = Math.max(0, 10 - (fails * 2));
        sessionScore     += levelPoints;
        recordResult(Math.min(fails + 1, 3));
        els.scoreDisplay.innerText = `Punts: ${sessionScore}`;

        Array.from(els.optionsContainer.children).forEach(b => b.style.pointerEvents = 'none');
        _finishOp(levelPoints);

    } else {
        attemptsLeft--;
        els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
        if (clickedBtn) clickedBtn.classList.add('wrong');

        errorHistory.push({
            question: challengeData.promptText, questionN: currentOperation,
            errorType: opt.errorType, isCorrect: false, meta: challengeData.meta
        });

        const isLastAttempt = attemptsLeft <= 0;
        renderFeedback(opt, isLastAttempt);

        if (isLastAttempt) {
            isTransitioning = true;
            recordAnswerToHistory(challengeData.promptText, opt.tex, false);
            recordResult(4);
            setTimeout(() => _finishOp(0), 800);
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
function showSessionSummary() {
    const byQuestion = {};
    errorHistory.forEach(e => {
        if (!byQuestion[e.questionN]) byQuestion[e.questionN] = [];
        byQuestion[e.questionN].push(e);
    });

    let firstTry = 0, retried = 0, failed = 0;
    Object.values(byQuestion).forEach(entries => {
        const hasCorrect = entries.some(e => e.isCorrect);
        const hasError   = entries.some(e => !e.isCorrect);
        if (hasCorrect && !hasError)  firstTry++;
        else if (hasCorrect)          retried++;
        else                          failed++;
    });

    const errorCounts = {};
    errorHistory
        .filter(e => !e.isCorrect && e.errorType)
        .forEach(e => { errorCounts[e.errorType] = (errorCounts[e.errorType] || 0) + 1; });

    const sortedErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);

    const panel = document.getElementById('session-summary');
    if (!panel) { endSession(); return; }

    const maxScore = TOTAL_OPERATIONS * 10;
    let html = `
        <div class="summary-score">
            <span class="summary-score-label">Puntuació final</span>
            <span class="summary-score-value">${sessionScore} / ${maxScore}</span>
        </div>
        <div class="summary-stats">
            <div class="summary-stat summary-stat--ok"><span class="summary-stat-num">${firstTry}</span><span class="summary-stat-desc">correctes a la primera</span></div>
            <div class="summary-stat summary-stat--warn"><span class="summary-stat-num">${retried}</span><span class="summary-stat-desc">correctes al segon intent</span></div>
            <div class="summary-stat summary-stat--err"><span class="summary-stat-num">${failed}</span><span class="summary-stat-desc">sense resoldre</span></div>
        </div>`;

    if (sortedErrors.length > 0) {
        html += `<div class="summary-errors-title">Errors conceptuals detectats</div><div class="summary-errors-list">`;
        sortedErrors.forEach(([type, count]) => {
            const hint  = DistractorLib.FeedbackHints[type] || '';
            const times = count === 1 ? '1 vegada' : `${count} vegades`;
            html += `<div class="summary-error-item"><div class="summary-error-header"><span class="summary-error-type">${_errorTypeLabel(type)}</span><span class="summary-error-count">${times}</span></div>${hint ? `<div class="summary-error-hint">${hint}</div>` : ''}</div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="summary-no-errors">Cap error conceptual detectat. Excel·lent!</div>`;
    }

    html += `<button class="summary-continue-btn" id="summary-continue-btn">Continua</button>`;
    panel.innerHTML = html;

    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) gameScreen.style.display = 'none';
    panel.style.display = 'block';

    document.getElementById('summary-continue-btn').addEventListener('click', () => {
        panel.style.display = 'none';
        errorHistory = [];
        if (typeof QuestionBank !== 'undefined') QuestionBank.resetSession();
        endSession();
    });
}

function _errorTypeLabel(type) {
    const labels = {
        SINGLE_CASE:        'Recompte de casos favorables',
        WRONG_COUNT:        'Error de recompte',
        COMPLEMENT:         'Confusió amb l\'esdeveniment contrari',
        ADD_NOT_MULT:       'Suma en lloc de producte',
        FORGOT_ONE:         'Esdeveniment oblidat',
        WRONG_TOTAL:        'Espai mostral incorrecte',
        SINGLE_TRIAL:       'Una sola extracció en lloc de dues',
        WITH_REPL:          'Confusió amb/sense reposició',
        WITHOUT_REPL:       'Confusió amb/sense reposició',
        IGNORE_CONDITION:   'Condició ignorada',
        WRONG_NUMERATOR:    'Numerador incorrecte',
        WRONG_DENOMINATOR:  'Denominador incorrecte',
        INVERTED:           'Condició invertida',
        JOINT_NOT_COND:     'Conjunta en lloc de condicionada',
        MARGINAL_NOT_COND:  'Marginal en lloc de condicionada',
    };
    return labels[type] || type;
}

// =========================================================================
// 6. Arrencada automàtica
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof validateConfig   === 'function') validateConfig();
    if (typeof injectSharedHTML === 'function') injectSharedHTML();
    if (typeof QuestionBank !== 'undefined') QuestionBank.resetSession();

    if (typeof startGame === 'function') {
        startGame();
    } else {
        const screen = document.getElementById('game-screen');
        if (screen) screen.style.display = 'block';
        buildLevel();
    }
});
