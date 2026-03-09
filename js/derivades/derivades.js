/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/derivades.js
 * ROL: Controlador específic del joc de derivades.
 * ARQUITECTURA:
 * - FASE 4: Feedback ampliat per a l'alumne. Dos nivells de feedback:
 *   1. Feedback immediat (opt.feedback): sempre visible en error.
 *   2. Hint ampliat (DistractorLib.FeedbackHints[errorType]): explicació
 *      conceptual del tipus d'error, visible en bloc separat sota el feedback.
 *      Només apareix si existeix entrada a FeedbackHints per aquell errorType.
 *   3. Resposta correcta: visible quan s'esgoten tots els intents, renderitzada
 *      amb KaTeX dins el feedback container. game-core.js és intocable, de
 *      manera que la resposta correcta s'injecta al feedback container propi
 *      de derivades.js, no al mini-overlay de game-core.js.
 * - errorHistory[]: registre paral·lel d'errorType iniciat a la Fase 3,
 *   ara usat per construir el resum final d'errors conceptuals.
 * DEPENDÈNCIES: Fitxer final. Ordre requerit:
 *   utils → config → game-core → math-engine → distractor-lib
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

    els.lvlDisplay.innerText      = `Funció ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.feedback.style.opacity    = '0';
    els.feedback.innerHTML        = '';

    challengeData = generateChallenge();

    katex.render(challengeData.promptTex, els.fxDisplay, { throwOnError: false });

    const allOptions = [...challengeData.options].sort(() => Math.random() - 0.5);

    els.optionsContainer.innerHTML = '';
    allOptions.forEach(opt => {
        const btn  = document.createElement('button');
        btn.className = 'btn-option';
        const span = document.createElement('span');
        katex.render(opt.tex, span, { throwOnError: false });
        btn.appendChild(span);
        btn.onclick = () => checkAnswer(opt, btn);
        els.optionsContainer.appendChild(btn);
    });
}

// =========================================================================
// 2. Renderitza el feedback (dos nivells + resposta correcta opcional)
// =========================================================================

/**
 * Renderitza el bloc de feedback complet dins els.feedback.
 * @param {object}  opt            - L'opció clicada (té .feedback, .errorType, .isCorrect)
 * @param {boolean} showSolution   - Si true, mostra la resposta correcta amb KaTeX
 */
function renderFeedback(opt, showSolution = false) {
    const fc = els.feedback;

    if (opt.isCorrect) {
        fc.innerHTML          = `<strong class="feedback-correct">${opt.feedback}</strong>`;
        fc.style.opacity      = '1';
        return;
    }

    // --- Nivell 1: feedback immediat ---
    let html = `<span class="feedback-wrong">${opt.feedback}</span>`;

    // --- Nivell 2: hint ampliat (si existeix per aquest errorType) ---
    const hint = DistractorLib.FeedbackHints[opt.errorType];
    if (hint) {
        html += `<div class="hint-box">${hint}</div>`;
    }

    fc.innerHTML     = html;
    fc.style.opacity = '1';

    // --- Nivell 3: resposta correcta (quan s'esgoten els intents) ---
    if (showSolution && challengeData?.solutionTex) {
        const solutionRow = document.createElement('div');
        solutionRow.className = 'solution-reveal';

        const label = document.createElement('span');
        label.className  = 'solution-label';
        label.innerText  = 'La resposta correcta era:';

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
        renderFeedback(opt);

        recordAnswerToHistory(challengeData.promptTex, opt.tex, true);
        errorHistory.push({
            question:  challengeData.promptTex,
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

        if (clickedBtn) clickedBtn.classList.add('wrong');

        errorHistory.push({
            question:  challengeData.promptTex,
            errorType: opt.errorType,
            isCorrect: false,
            meta:      challengeData.meta
        });

        const isLastAttempt = attemptsLeft <= 0;

        // Mostra la solució correcta només quan s'esgoten els intents
        renderFeedback(opt, isLastAttempt);

        if (isLastAttempt) {
            isTransitioning = true;
            recordAnswerToHistory(challengeData.promptTex, opt.tex, false);
            // Petit retard per deixar que l'alumne llegeixi la solució
            // abans que aparegui el mini-overlay de game-core.js
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
            endSession();
        } else {
            buildLevel();
        }
    }, waitTime);
}

// =========================================================================
// 5. Arrencada automàtica
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
