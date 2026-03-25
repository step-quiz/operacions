/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estadistica-inversa/estadistica-inversa.js
 * ROL: Controlador DOM de l'exercici invers d'estadística descriptiva.
 * ARQUITECTURA:
 * - L'alumne rep condicions (mitjana, mediana, moda) i proposa nombres
 *   que les compleixin. El sistema valida pas a pas, mostrant quines
 *   condicions es compleixen i quines no.
 * - L'alumne ha de trobar una solució vàlida per completar l'exercici.
 * - Puntuació: 10 − errors (mínim 0).
 * DEPENDÈNCIES: utils, config, game-core, math-engine, question-bank.
 * ============================================================================
 */

let challengeData  = null;
let totalErrors    = 0;
let helpExpanded   = false;

const ME = MathEngine;

const els = {
    scoreDisplay:    document.getElementById('score-display'),
    lvlDisplay:      document.getElementById('lvl-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    promptBox:       document.getElementById('prompt-box'),
    condBadges:      document.getElementById('cond-badges'),
    inputGrid:       document.getElementById('input-grid'),
    feedback:        document.getElementById('missatge-feedback'),
    diagBox:         document.getElementById('diagnostic-box'),
    btnCheck:        document.getElementById('btn-check'),
    progressInfo:    document.getElementById('progress-info'),
    helpPanel:       document.getElementById('help-panel'),
    helpContent:     document.getElementById('help-content'),
    btnHelp:         document.getElementById('btn-help'),
};

// =========================================================================
// 1. BUILDLEVEL
// =========================================================================
function buildLevel() {
    isTransitioning = false;
    totalErrors     = 0;
    helpExpanded    = false;

    // Reinicia l'estat de sessió del QuestionBank quan comença una sessió nova
    if (currentOperation === 0) QuestionBank.resetSession();

    els.lvlDisplay.innerText = `Pregunta ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;
    els.feedback.style.opacity = '0';
    els.feedback.innerHTML = '';
    els.diagBox.innerHTML = '';
    els.diagBox.style.display = 'none';
    els.helpPanel.style.display = 'none';
    els.btnHelp.textContent = '💡 Ajuda';
    els.progressInfo.innerHTML = '';
    els.btnCheck.style.display = 'inline-block';

    challengeData = QuestionBank.generateChallenge();
    renderProblem();
    renderInputs();
    renderHelpContent();
}

// =========================================================================
// 2. RENDERITZAR
// =========================================================================
function renderProblem() {
    els.promptBox.innerHTML = challengeData.prompt;

    // Info de progrés (no usada amb solució única, però netegem per seguretat)
    updateProgressInfo();
}

function renderInputs() {
    let html = '<div class="input-cells">';
    for (let i = 0; i < challengeData.k; i++) {
        html += `<input type="text" class="num-input" id="num-${i}" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="?">`;
    }
    html += '</div>';
    els.inputGrid.innerHTML = html;

    // Focus al primer input
    document.getElementById('num-0').focus();

    // Tab entre inputs i Enter per comprovar
    for (let i = 0; i < challengeData.k; i++) {
        const inp = document.getElementById(`num-${i}`);
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
            if (e.key === 'Tab' && !e.shiftKey && i < challengeData.k - 1) {
                e.preventDefault();
                document.getElementById(`num-${i + 1}`).focus();
            }
        });
        // Teclat custom en mòbil
        if (typeof isTouchDevice === 'function' && isTouchDevice() && typeof showCustomKeyboard === 'function') {
            inp.addEventListener('pointerdown', e => { e.preventDefault(); showCustomKeyboard(inp); });
        }
    }
}

function renderHelpContent() {
    els.helpContent.innerHTML = `<div class="help-line">${challengeData.hint}</div>`;
}

function updateProgressInfo() {
    els.progressInfo.innerHTML = '';
}

// =========================================================================
// 3. COMPROVAR RESPOSTA
// =========================================================================
function checkAnswer() {
    if (isTransitioning) return;

    // Recull valors
    const values = [];
    let allFilled = true;
    for (let i = 0; i < challengeData.k; i++) {
        const inp = document.getElementById(`num-${i}`);
        const val = ME.parseInput(inp.value);
        if (isNaN(val) || !Number.isInteger(val)) { allFilled = false; }
        else if (val < 1 || val > 10) { allFilled = false; }
        values.push(val);
    }

    if (!allFilled || values.some(isNaN)) {
        showFeedback('⚠️ Omple tots els espais amb nombres enters entre 1 i 10.', 'warn');
        return;
    }

    // Comprova validesa del rang
    if (!allFilled || values.some(isNaN)) {
        showFeedback('⚠️ Omple tots els espais amb nombres enters entre 1 i 10.', 'warn');
        return;
    }

    // Valida
    const sorted = [...values].sort((a, b) => a - b);
    const result = ME.validate(values, challengeData.conditions);
    renderDiagnostic(sorted, result);

    const allOk = result.meanOk && result.medianOk && result.modeOk;

    if (allOk) {
        markInputsCorrect();
        isTransitioning = true;
        showFeedback('✅ Molt bé! Has trobat una solució correcta!', 'ok');
        const promptText = challengeData.prompt.replace(/<[^>]+>/g, '');
        recordAnswerToHistory(promptText, sorted.join(', '), true);
        showNextButton();
    } else {
        totalErrors++;
        markInputsWrong();
        const hint = buildHintMessage(result);
        if (hint) showFeedback(hint, 'err');
        // Registrem cada intent fallit a l'historial
        const promptText = challengeData.prompt.replace(/<[^>]+>/g, '');
        recordAnswerToHistory(promptText, sorted.join(', '), false);
    }
}

// =========================================================================
// 4. DIAGNÒSTIC PAS A PAS
// =========================================================================
function renderDiagnostic(sorted, result) {
    const conds = challengeData.conditions;
    const showSorted = conds.median !== undefined || conds.mode !== undefined;
    let html = showSorted
        ? `<div class="diag-row"><span class="diag-label">Nombres ordenats:</span><span class="diag-value">${sorted.join(', ')}</span></div>`
        : '';

    if (conds.mean !== undefined) {
        const icon = result.meanOk ? '✅' : '❌';
        const cls  = result.meanOk ? 'diag-ok' : 'diag-err';
        const diagText = result.meanOk
            ? `La mitjana de les teves dades és ${ME.fmtCondensed(result.computedMean)}.`
            : `La mitjana de les teves dades és ${ME.fmtCondensed(result.computedMean)}. Has d'aconseguir que sigui ${ME.fmtCondensed(conds.mean)}.`;
        html += `<div class="diag-row ${cls}"><span class="diag-label">${icon} Mitjana:</span><span class="diag-value">${diagText}</span></div>`;
    }
    if (conds.median !== undefined) {
        const icon = result.medianOk ? '✅' : '❌';
        const cls  = result.medianOk ? 'diag-ok' : 'diag-err';
        html += `<div class="diag-row ${cls}"><span class="diag-label">${icon} Mediana:</span><span class="diag-value">${ME.fmtCondensed(result.computedMedian)}</span><span class="diag-target">objectiu: ${ME.fmtCondensed(conds.median)}</span></div>`;
    }
    if (conds.mode !== undefined) {
        const icon = result.modeOk ? '✅' : '❌';
        const cls  = result.modeOk ? 'diag-ok' : 'diag-err';
        const modeStr = result.computedMode ? result.computedMode.join(', ') : 'cap (amodal)';
        html += `<div class="diag-row ${cls}"><span class="diag-label">${icon} Moda:</span><span class="diag-value">${modeStr}</span><span class="diag-target">objectiu: ${conds.mode}</span></div>`;
    }

    els.diagBox.innerHTML = html;
    els.diagBox.style.display = 'block';
}

function buildHintMessage(result) {
    const conds = challengeData.conditions;
    const parts = [];

    if (conds.mean !== undefined && !result.meanOk) {
        // El diagnòstic visual ja mostra la mitjana calculada vs l'objectiu.
        // L'ajuda conté la suma necessària. No cal missatge addicional.
    }
    if (conds.median !== undefined && !result.medianOk) {
        parts.push(`Un cop ordenats, el valor central hauria de ser ${ME.fmtCondensed(conds.median)}, però és ${ME.fmtCondensed(result.computedMedian)}.`);
    }
    if (conds.mode !== undefined && !result.modeOk) {
        if (result.computedMode === null) {
            parts.push(`Cap valor es repeteix. Necessites que el ${conds.mode} aparegui almenys 2 cops.`);
        } else {
            parts.push(`La moda actual és ${result.computedMode.join(', ')}, però hauria de ser ${conds.mode}.`);
        }
    }

    if (parts.length === 0) return null;
    return '❌ ' + parts.join(' ');
}

// =========================================================================
// 5. HELPERS VISUALS
// =========================================================================
function markInputsCorrect() {
    for (let i = 0; i < challengeData.k; i++) {
        const inp = document.getElementById(`num-${i}`);
        inp.classList.remove('num-wrong');
        inp.classList.add('num-correct');
        inp.readOnly = true;
    }
}

function markInputsWrong() {
    for (let i = 0; i < challengeData.k; i++) {
        const inp = document.getElementById(`num-${i}`);
        inp.classList.add('num-wrong');
        setTimeout(() => inp.classList.remove('num-wrong'), 400);
    }
}

function showFeedback(msg, type) {
    els.feedback.innerHTML = msg;
    els.feedback.className = 'feedback-bar fb-' + type;
    els.feedback.style.opacity = '1';
}

// =========================================================================
// 6. BOTÓ "SEGÜENT"
// =========================================================================
function showNextButton() {
    const btn = els.btnCheck;
    btn.textContent = 'Següent →';
    btn.classList.add('btn-next-shake');
    btn.removeEventListener('click', checkAnswer);
    btn.addEventListener('click', _onNextClick);
}

function _onNextClick() {
    const btn = els.btnCheck;
    btn.classList.remove('btn-next-shake');
    btn.removeEventListener('click', _onNextClick);
    btn.addEventListener('click', checkAnswer);
    finishExercise();
}

// =========================================================================
// 7. FI DE L'EXERCICI
// =========================================================================
function finishExercise() {
    const levelPoints = Math.max(0, 10 - totalErrors);
    sessionScore += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;
    recordResult(totalErrors === 0 ? 1 : totalErrors <= 2 ? 2 : totalErrors <= 5 ? 3 : 4);

    currentOperation++;
    if (currentOperation >= TOTAL_OPERATIONS) {
        endSession();
    } else {
        buildLevel();
    }
}

// =========================================================================
// 7. AJUDA DESPLEGABLE
// =========================================================================
function toggleHelp() {
    if (helpExpanded) {
        els.helpPanel.style.display = 'none';
        els.btnHelp.textContent = '💡 Ajuda';
        helpExpanded = false;
    } else {
        els.helpPanel.style.display = 'block';
        els.btnHelp.textContent = '💡 Amagar ajuda';
        helpExpanded = true;
        els.helpPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// =========================================================================
// 8. ARRENCADA
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof validateConfig   === 'function') validateConfig();
    if (typeof injectSharedHTML === 'function') injectSharedHTML();

    els.btnCheck.addEventListener('click', checkAnswer);
    els.btnHelp.addEventListener('click', toggleHelp);

    if (typeof startGame === 'function') {
        startGame();
    } else {
        const screen = document.getElementById('game-screen');
        if (screen) screen.style.display = 'block';
        buildLevel();
    }
});
