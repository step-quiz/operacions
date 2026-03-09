/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/derivades.js
 * ROL: Controlador específic del joc de derivades.
 * ARQUITECTURA:
 * - En la Fase 1 del refactor, les funcions matemàtiques pures (generateK,
 *   generateFractionK, formatK, gcd) han migrat a math-engine.js.
 *   Aquest fitxer ja NO les defineix: les llegeix via window.MathEngine o
 *   com a globals de compatibilitat (vegeu math-engine.js).
 * - Controlador DOM: Enllaça el banc de preguntes amb la interfície d'usuari,
 *   renderitza fòrmules usant KaTeX i avalua respostes gestionant els estats.
 * - Bootstrap: Actua com a punt d'arrencada (DOMContentLoaded), orquestrant
 *   la injecció del core i validant dependències abans de mostrar el joc.
 * DEPENDÈNCIES: Fitxer final. Requereix tots els JS previs carregats:
 *   utils → config → game-core → math-engine → banc-preguntes → (aquest)
 * ============================================================================
 */

/**
 * =========================================================================
 * LÒGICA DEL JOC (CONTROLADOR)
 * =========================================================================
 */

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

    // Configurar intents des de config.js
    attemptsLeft = MAX_INTENTS;

    // Actualitzar UI de progrés
    els.lvlDisplay.innerText      = `Funció ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.feedback.style.opacity    = '0';

    // Triar pregunta del banc i generar dades
    const bankItem    = pick(questionBank);
    challengeData     = bankItem.generate();

    // Renderitzar enunciat
    katex.render(challengeData.questionTex, els.fxDisplay, { throwOnError: false });

    // Preparar totes les opcions (Correcta + Distractors)
    const allOptions = [
        {
            tex:       challengeData.correctTex,
            feedback:  "Molt bé! Resposta correcta.",
            isCorrect: true
        },
        ...challengeData.distractors.map(d => ({ ...d, isCorrect: false }))
    ];

    // Barrejar opcions aleatòriament
    allOptions.sort(() => Math.random() - 0.5);

    // Netejar i crear botons
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
        // --- RESPOSTA CORRECTA ---
        isTransitioning = true;

        feedbackContainer.innerHTML    = `<strong>${opt.feedback}</strong>`;
        feedbackContainer.style.color  = "var(--success)";
        feedbackContainer.style.opacity = '1';

        recordAnswerToHistory(challengeData.questionTex, opt.tex, true);

        const fails       = MAX_INTENTS - attemptsLeft;
        const levelPoints = Math.max(0, 10 - (fails * 2));
        sessionScore     += levelPoints;
        els.scoreDisplay.innerText = `Punts: ${sessionScore}`;

        // Desactivem tots els botons
        Array.from(els.optionsContainer.children).forEach(b => b.style.pointerEvents = 'none');
        _finishOp(levelPoints);

    } else {
        // --- RESPOSTA INCORRECTA ---
        attemptsLeft--;
        els.attemptsDisplay.innerText  = `Intents: ${attemptsLeft}`;

        feedbackContainer.innerHTML    = `<span>${opt.feedback}</span>`;
        feedbackContainer.style.color  = "var(--danger)";
        feedbackContainer.style.opacity = '1';

        if (clickedBtn) clickedBtn.classList.add('wrong');

        if (attemptsLeft <= 0) {
            isTransitioning = true;
            recordAnswerToHistory(challengeData.questionTex, opt.tex, false);
            _finishOp(0);
        }
    }
}

// 3. Finalitza l'operació actual i gestiona el flux cap a game-core.js
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
    // 1. Validem la configuració
    if (typeof validateConfig === 'function') validateConfig();

    // 2. Injectem l'HTML compartit (mini-overlay, pantalles finals)
    if (typeof injectSharedHTML === 'function') injectSharedHTML();

    // 3. Mostrem la pantalla i iniciem la sessió
    if (typeof startGame === 'function') {
        startGame();
    } else {
        // Fallback per si no tenim game-core.js carregat
        const screen = document.getElementById('game-screen');
        if (screen) screen.style.display = 'block';
        buildLevel();
    }
});
