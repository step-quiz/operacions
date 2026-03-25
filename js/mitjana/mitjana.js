/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/mitjana/mitjana.js
 * ROL: Controlador DOM del joc de mitjana aritmètica i ponderada.
 * ARQUITECTURA:
 * - Cada operació: mostra l'enunciat amb taula de notes → l'alumne escriu
 *   la resposta → validació amb feedback → botó ajuda desplegable amb
 *   resolució pas a pas.
 * - Puntuació: 10 = 1r intent, 8 = 2n, 6 = 3r, 0 = esgotats.
 * DEPENDÈNCIES: utils, config, game-core, math-engine, strings, question-bank.
 * ============================================================================
 */

let challengeData = null;
let helpExpanded  = false;

const ME = MathEngine;
const S  = Strings;

const els = {
    scoreDisplay:    document.getElementById('score-display'),
    lvlDisplay:      document.getElementById('lvl-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    enunciat:        document.getElementById('enunciat'),
    inputZone:       document.getElementById('input-zone'),
    feedback:        document.getElementById('missatge-feedback'),
    helpPanel:       document.getElementById('help-panel'),
    helpContent:     document.getElementById('help-content'),
    btnHelp:         document.getElementById('btn-help'),
};

// =========================================================================
// 1. CONSTRUEIX UN NOU NIVELL
// =========================================================================
function buildLevel() {
    isTransitioning = false;
    attemptsLeft    = MAX_INTENTS;
    helpExpanded    = false;

    els.lvlDisplay.innerText      = `Pregunta ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.attemptsDisplay.classList.remove('danger');
    els.feedback.style.opacity    = '0';
    els.feedback.innerHTML        = '';
    els.helpPanel.style.display   = 'none';
    els.helpContent.innerHTML     = '';
    els.btnHelp.textContent       = S.Btn.helpShow;

    challengeData = QuestionBank.generateChallenge();
    renderProblem(challengeData);
    renderInput();
}

// =========================================================================
// 2. RENDERITZA L'ENUNCIAT
// =========================================================================
function renderProblem(ch) {
    const isWeighted = ch.type === 'weighted';

    let html = `<div class="problem-context">${ch.context}</div>`;
    html += '<table class="notes-table"><thead><tr>';
    html += `<th>${S.Table.colActivity}</th><th>${S.Table.colGrade}</th>`;
    if (isWeighted) html += `<th>${S.Table.colWeight}</th>`;
    html += '</tr></thead><tbody>';

    ch.rows.forEach(row => {
        const valStr = Number.isInteger(row.value) ? String(row.value) : ME.fmt(row.value, 2);
        html += `<tr><td class="td-label">${row.label}</td><td class="td-value">${valStr}</td>`;
        if (isWeighted) html += `<td class="td-weight">${row.weight}%</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';

    if (isWeighted) {
        html += `<div class="problem-ask">${S.Ask.weighted}</div>`;
    } else {
        html += `<div class="problem-ask">${S.Ask.simple}</div>`;
    }

    els.enunciat.innerHTML = html;

    // Prepara l'ajuda (oculta fins que es demani)
    let helpHtml = '';
    ch.helpLines.forEach(line => {
        helpHtml += `<div class="help-line">${line}</div>`;
    });
    els.helpContent.innerHTML = helpHtml;
}

// =========================================================================
// 3. RENDERITZA L'INPUT
// =========================================================================
function renderInput() {
    els.inputZone.innerHTML = `
        <div class="answer-row">
            <label class="answer-label">${S.Input.label}</label>
            <input type="text" class="answer-input" id="answer-input"
                   inputmode="decimal" autocomplete="off"
                   placeholder="${S.Input.placeholder}">
            <button class="btn-submit btn-ok" id="btn-ok">${S.Input.btnSubmit}</button>
        </div>`;

    const inp = document.getElementById('answer-input');
    const btn = document.getElementById('btn-ok');

    btn.addEventListener('click', checkAnswer);
    inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
    });

    // Teclat custom en mòbil
    if (typeof isTouchDevice === 'function' && isTouchDevice()) {
        if (typeof showCustomKeyboard === 'function') {
            inp.addEventListener('pointerdown', e => {
                e.preventDefault();
                showCustomKeyboard(inp);
            });
        }
    }

    inp.focus();
}

// =========================================================================
// 4. COMPROVA LA RESPOSTA
// =========================================================================
function checkAnswer() {
    if (isTransitioning) return;

    const inp = document.getElementById('answer-input');
    const val = ME.parseInput(inp.value);

    if (isNaN(val)) {
        showFeedback(S.Feedback.invalidInput, 'warn');
        return;
    }

    const correct = challengeData.correctAnswer;

    if (ME.approxEqual(val, correct, 0.04)) {
        // CORRECTE
        isTransitioning = true;
        inp.classList.add('input-correct');
        inp.readOnly = true;

        const fails       = MAX_INTENTS - attemptsLeft;
        const levelPoints = Math.max(0, 10 - (fails * 2));
        sessionScore     += levelPoints;
        els.scoreDisplay.innerText = `Punts: ${sessionScore}`;
        recordResult(Math.min(fails + 1, 3));
        recordAnswerToHistory(
            challengeData.type === 'weighted' ? S.History.weighted : S.History.simple,
            ME.fmt(val, 2), true
        );

        showFeedback(S.Feedback.correct(ME.fmt(correct, 2)), 'ok');
        _finishOp(levelPoints);

    } else {
        // INCORRECTE
        attemptsLeft--;
        els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
        if (attemptsLeft <= 1) els.attemptsDisplay.classList.add('danger');

        inp.classList.add('input-wrong');
        setTimeout(() => inp.classList.remove('input-wrong'), 400);

        if (attemptsLeft <= 0) {
            // Esgotats
            isTransitioning = true;
            inp.readOnly = true;
            recordResult(4);
            recordAnswerToHistory(
                challengeData.type === 'weighted' ? S.History.weighted : S.History.simple,
                ME.fmt(val, 2), false
            );

            // Mostra la solució i expandeix l'ajuda automàticament
            showFeedback(S.Feedback.exhausted(ME.fmt(correct, 2)), 'err');
            expandHelp();
            setTimeout(() => _finishOp(0), 4000);
        } else {
            // Encara té intents
            let msg = '';
            if (challengeData.type === 'weighted') {
                msg = ME.approxEqual(val, ME.mean(challengeData.values), 0.04)
                    ? S.Feedback.wrongUsedSimple
                    : S.Feedback.wrongWeighted;
            } else {
                msg = S.Feedback.wrongSimple;
            }
            showFeedback(msg, 'err');
        }
    }
}

// =========================================================================
// 5. AJUDA DESPLEGABLE
// =========================================================================
function toggleHelp() {
    if (helpExpanded) {
        els.helpPanel.style.display = 'none';
        els.btnHelp.textContent     = S.Btn.helpShow;
        helpExpanded = false;
    } else {
        expandHelp();
    }
}

function expandHelp() {
    els.helpPanel.style.display = 'block';
    els.btnHelp.textContent     = S.Btn.helpHide;
    helpExpanded = true;
    els.helpPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// =========================================================================
// 6. FINALITZA L'OPERACIÓ ACTUAL
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
// 7. HELPERS UI
// =========================================================================
function showFeedback(msg, type) {
    const fc = els.feedback;
    fc.innerHTML   = msg;
    fc.className   = 'feedback-bar fb-' + type;
    fc.style.opacity = '1';
}

// =========================================================================
// 8. ARRENCADA
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof validateConfig   === 'function') validateConfig();
    if (typeof injectSharedHTML === 'function') injectSharedHTML();

    els.btnHelp.addEventListener('click', toggleHelp);

    if (typeof startGame === 'function') {
        startGame();
    } else {
        const screen = document.getElementById('game-screen');
        if (screen) screen.style.display = 'block';
        buildLevel();
    }
});
