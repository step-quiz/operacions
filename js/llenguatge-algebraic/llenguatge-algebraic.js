/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/llenguatge-algebraic/llenguatge-algebraic.js
 * ROL: Controlador DOM. Gestiona el bucle de joc multi-resposta.
 *
 * PARÀMETRES URL (llegits per utils.js + config.js):
 *   ?totalsessions=N       Nombre de sessions (defecte: 1)
 *   ?totaloperations=N     Nombre de preguntes per sessió (defecte: 10)
 *   ?maxintents=N          Intents per pregunta (defecte: 4)
 *   ?maxenllocmitjana=0|1  Nota: màxim sessió (1) o mitjana (0) (defecte: 1)
 *
 * DEPENDÈNCIES (ordre de càrrega):
 *   utils.js → config.js → game-core.js → question-bank.js → (aquest, defer)
 *
 * GLOBALS HERETATS DE game-core.js:
 *   attemptsLeft, currentOperation, sessionScore, sessionHistory,
 *   isTransitioning, showMiniOverlay, hideMiniOverlay, endSession,
 *   startGame, recordAnswerToHistory, recordResult,
 *   injectSharedHTML, validateConfig, bgColors, shuffle
 *
 * GLOBALS HERETATS DE config.js:
 *   TOTAL_OPERATIONS, MAX_INTENTS, TOTAL_SESSIONS, MAX_ENLLOC_MITJANA
 * ============================================================================
 */

// ── ELEMENTS DOM ────────────────────────────────────────────────────────────
const els = {
    body:            document.body,
    gameScreen:      document.getElementById('game-screen'),
    sessionDisplay:  document.getElementById('session-display'),
    lvlDisplay:      document.getElementById('lvl-display'),
    scoreDisplay:    document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    questionContext: document.getElementById('question-context'),
    questionText:    document.getElementById('question-text'),
    optionsGrid:     document.getElementById('options-grid'),
};

// ── ESTAT DEL JOC ───────────────────────────────────────────────────────────
let isPenalizing    = false;
let currentQuestion = null;
let usedQuestions   = [];

// ── BUILD LEVEL (cridat per game-core) ──────────────────────────────────────
function buildLevel() {
    attemptsLeft    = MAX_INTENTS;
    isTransitioning = false;
    isPenalizing    = false;

    const picked    = QuestionBank.pick(usedQuestions);
    currentQuestion = picked.question;
    usedQuestions.push(picked.index);

    const colorIndex = (currentSession * TOTAL_OPERATIONS + currentOperation) % bgColors.length;
    els.body.style.backgroundColor = bgColors[colorIndex];

    updateHeader();
    renderQuestion();
}

// ── ACTUALITZAR CAPÇALERA ────────────────────────────────────────────────────
function updateHeader() {
    els.sessionDisplay.innerText  = `Sessió ${currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText      = `Pregunta ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText    = `Punts: ${sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';
    if (attemptsLeft < 5) els.attemptsDisplay.classList.add('danger');
}

// ── RENDERITZAR EXPRESSIÓ MATEMÀTICA ─────────────────────────────────────────
// Renderitza les fraccions \frac{num}{den} amb KaTeX i deixa la resta com text.
function renderExpr(str) {
    const parts = [];
    const pattern = /\\frac\{([^}]*)\}\{([^}]*)\}/g;
    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(str)) !== null) {
        if (match.index > lastIndex) {
            parts.push(escapeHtml(str.slice(lastIndex, match.index)));
        }
        parts.push(katex.renderToString(
            `\\frac{${match[1]}}{${match[2]}}`,
            { throwOnError: false, displayMode: false }
        ));
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) {
        parts.push(escapeHtml(str.slice(lastIndex)));
    }
    return parts.join('');
}

// Longitud visual aproximada (ignora els comandos LaTeX \frac{}{})
function visualLength(str) {
    return str.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2').length;
}

// ── RENDERITZAR PREGUNTA ─────────────────────────────────────────────────────
function renderQuestion() {
    els.questionContext.innerText = currentQuestion.context;
    els.questionText.innerHTML    = currentQuestion.text;

    // Barrejar opcions
    const allOptions = [currentQuestion.answer, ...currentQuestion.distractors];
    shuffle(allOptions);

    // Decidir si cal layout vertical (expressions llargues)
    const maxLen = Math.max(...allOptions.map(o => visualLength(o)));
    els.optionsGrid.className = 'options-grid' + (maxLen > 12 ? ' vertical' : '');

    // Crear botons
    els.optionsGrid.innerHTML = '';
    allOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.innerHTML = renderExpr(opt);
        btn.dataset.value = opt;                       // valor raw per comparar
        btn.setAttribute('aria-label', `Opció: ${opt}`);
        btn.addEventListener('click', () => checkAnswer(btn, opt));
        els.optionsGrid.appendChild(btn);
    });
}

// ── COMPROVAR RESPOSTA ────────────────────────────────────────────────────────
function checkAnswer(btn, selectedOption) {
    if (isTransitioning || isPenalizing) return;

    const stepQuestion = currentQuestion.text.replace(/<[^>]*>/g, '');

    if (selectedOption === currentQuestion.answer) {
        // ✅ Correcte
        btn.classList.add('correct');
        disableAllOptions();

        if (typeof recordAnswerToHistory === 'function') {
            recordAnswerToHistory(stepQuestion, selectedOption, true);
        }

        const fails       = MAX_INTENTS - attemptsLeft;
        const levelPoints = Math.max(0, 10 - fails);

        setTimeout(() => finishQuestion(levelPoints), 700);

    } else {
        // ❌ Incorrecte
        btn.classList.add('incorrect');

        if (typeof recordAnswerToHistory === 'function') {
            recordAnswerToHistory(stepQuestion, selectedOption, false);
        }

        penalize(btn);
    }
}

// ── PENALITZACIÓ ─────────────────────────────────────────────────────────────
function penalize(btn) {
    if (isPenalizing || isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink-warning');

    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink-warning');
        attemptsLeft--;
        updateHeader();

        // Treure feedback visual del botó incorrecte i desactivar-lo
        btn.classList.remove('incorrect');
        btn.classList.add('disabled');
        btn.style.opacity = '0.4';

        // Comptem quantes opcions actives queden
        const remaining = els.optionsGrid.querySelectorAll('.btn-option:not(.disabled)');

        if (attemptsLeft <= 0 || remaining.length <= 1) {
            // Intents esgotats O només queda 1 opció (trivial) → 0 punts
            isTransitioning = true;
            revealCorrectAnswer();
            setTimeout(() => finishQuestion(0), 1500);
        }

        isPenalizing = false;
    }, 600);
}

// ── REVELAR RESPOSTA CORRECTA ────────────────────────────────────────────────
function revealCorrectAnswer() {
    const buttons = els.optionsGrid.querySelectorAll('.btn-option');
    buttons.forEach(btn => {
        if (btn.dataset.value === currentQuestion.answer) {
            btn.classList.remove('disabled');
            btn.classList.add('reveal-correct');
        } else {
            btn.classList.add('disabled');
        }
    });
}

// ── DESACTIVAR TOTES LES OPCIONS ─────────────────────────────────────────────
function disableAllOptions() {
    isTransitioning = true;
    const buttons = els.optionsGrid.querySelectorAll('.btn-option');
    buttons.forEach(btn => btn.classList.add('disabled'));
}

// ── FINALITZAR PREGUNTA I AVANÇAR ────────────────────────────────────────────
function finishQuestion(levelPoints) {
    recordResult(levelPoints > 0 ? Math.min(MAX_INTENTS - attemptsLeft + 1, 3) : 4);

    sessionScore += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;

    const waitTime = typeof showMiniOverlay === 'function'
        ? showMiniOverlay(levelPoints, { successColor: 'var(--primary-dark)', pointsColor: 'var(--success)' })
        : 1500;

    setTimeout(() => {
        if (typeof hideMiniOverlay === 'function') hideMiniOverlay();

        if (currentOperation + 1 >= TOTAL_OPERATIONS) {
            if (typeof endSession === 'function') endSession();
        } else {
            currentOperation++;
            buildLevel();
        }
    }, waitTime);
}

// ── INICIALITZACIÓ ──────────────────────────────────────────────────────────
injectSharedHTML();
validateConfig();
// No cal teclat custom en aquest joc (és multi-resposta)
startGame();
