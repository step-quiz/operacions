/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/derivades.js
 * ROL: Controlador específic del joc de derivades.
 * ARQUITECTURA:
 * - FASE 3: Llegeix el contracte formal del challenge (§4 del pla):
 *   { promptTex, solutionTex, options, meta }
 *   Les opcions ja arriben completes des de question-bank.js, incloent
 *   errorType i isCorrect. El controlador no construeix ni filtra opcions.
 * - recordAnswerToHistory() desa ara també errorType per a analítica futura.
 *   NOTA: game-core.js és intocable (capa compartida), de manera que la
 *   crida a recordAnswerToHistory() continua amb la signatura original
 *   (question, answer, isCorrect). L'errorType es desa en un registre
 *   paral·lel errorHistory[], disponible per a la Fase 4 (feedback ampliat).
 * - Controlador DOM pur: demana un challenge a generateChallenge(),
 *   el renderitza amb KaTeX, gestiona clics i avança el flux de joc.
 * DEPENDÈNCIES: Fitxer final. Ordre requerit:
 *   utils → config → game-core → math-engine → distractor-lib
 *   → question-bank → (aquest, defer)
 * ============================================================================
 */

// Registre paral·lel d'errorType per a la Fase 4 (no toca game-core.js)
let errorHistory = [];

let challengeData = null;
const els = {
    fxDisplay:        document.getElementById('fx-display'),
    optionsContainer: document.getElementById('options-container'),
    feedback:         document.getElementById('missatge-feedback'),
    scoreDisplay:     document.getElementById('score-display'),
    lvlDisplay:       document.getElementById('lvl-display'),
    attemptsDisplay:  document.getElementById('attempts-display')
};

// 1. Construeix un nou nivell (una nova derivada)
function buildLevel() {
    isTransitioning = false;
    attemptsLeft    = MAX_INTENTS;

    els.lvlDisplay.innerText      = `Funció ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.feedback.style.opacity    = '0';

    // Genera el challenge amb el contracte formal
    challengeData = generateChallenge();

    // Renderitza l'enunciat
    katex.render(challengeData.promptTex, els.fxDisplay, { throwOnError: false });

    // Les opcions ja arriben completes i en el format correcte des de question-bank.js
    // El controlador només les barreja i crea els botons
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

// 2. Comprova la resposta seleccionada
function checkAnswer(opt, clickedBtn) {
    if (isTransitioning) return;

    const feedbackContainer = els.feedback;

    if (opt.isCorrect) {
        isTransitioning = true;

        feedbackContainer.innerHTML    = `<strong>${opt.feedback}</strong>`;
        feedbackContainer.style.color  = "var(--success)";
        feedbackContainer.style.opacity = '1';

        // Desa a l'historial compartit (game-core.js, signatura intocable)
        recordAnswerToHistory(challengeData.promptTex, opt.tex, true);
        // Desa errorType al registre paral·lel (null = encert sense error)
        errorHistory.push({ question: challengeData.promptTex, errorType: null, isCorrect: true, meta: challengeData.meta });

        const fails       = MAX_INTENTS - attemptsLeft;
        const levelPoints = Math.max(0, 10 - (fails * 2));
        sessionScore     += levelPoints;
        els.scoreDisplay.innerText = `Punts: ${sessionScore}`;

        Array.from(els.optionsContainer.children).forEach(b => b.style.pointerEvents = 'none');
        _finishOp(levelPoints);

    } else {
        attemptsLeft--;
        els.attemptsDisplay.innerText  = `Intents: ${attemptsLeft}`;

        feedbackContainer.innerHTML    = `<span>${opt.feedback}</span>`;
        feedbackContainer.style.color  = "var(--danger)";
        feedbackContainer.style.opacity = '1';

        if (clickedBtn) clickedBtn.classList.add('wrong');

        // Desa errorType al registre paral·lel
        errorHistory.push({ question: challengeData.promptTex, errorType: opt.errorType, isCorrect: false, meta: challengeData.meta });

        if (attemptsLeft <= 0) {
            isTransitioning = true;
            recordAnswerToHistory(challengeData.promptTex, opt.tex, false);
            _finishOp(0);
        }
    }
}

// 3. Finalitza l'operació actual
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

// 4. Arrencada automàtica
window.addEventListener('DOMContentLoaded', () => {
    if (typeof validateConfig  === 'function') validateConfig();
    if (typeof injectSharedHTML === 'function') injectSharedHTML();

    if (typeof startGame === 'function') {
        startGame();
    } else {
        const screen = document.getElementById('game-screen');
        if (screen) screen.style.display = 'block';
        buildLevel();
    }
});
