/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/proporciodirecta/proporciodirecta.js
 * ROL: Joc «Proporcionalitat directa» (proporciodirecta.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, game-core.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { getIntParam, pick, randInt } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    hideCustomKeyboard,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbMarkForOverwrite,
    recordAnswerToHistory,
    recordResult,
    showCustomKeyboard,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { checkValue, buildLevel, checkCurrentCell });

// ============================================================
// PARÀMETRES URL
// ============================================================

const _urlParams = new URLSearchParams(window.location.search);

/**
 * Nivell 1: múltiple directe, 1 pas (default)
 * Nivell 2: reducció a la unitat, 2 passos, nombres petits
 * Nivell 3: reducció a la unitat, 2 passos, nombres grans
 */
const NIVELL = getIntParam(_urlParams, 'nivell', 1, 1, 3);

// ============================================================
// ELEMENTS DOM
// ============================================================

const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    problemDisplay: document.getElementById('problem-display'),
    resolutionPanel: document.getElementById('resolution-panel'),
    stepsDone: document.getElementById('steps-done'),
    stepPrompt: document.getElementById('step-prompt'),
    answerRow: document.getElementById('answer-row'),
    valueInput: document.getElementById('value-input'),
    btnSubmitVal: document.getElementById('btn-submit-val'),
    inlineFeedback: document.getElementById('inline-feedback'),
    btnNextLevel: document.getElementById('btn-next-level'),
    stepHint: document.getElementById('step-hint'),
};

// ============================================================
// ESTAT LOCAL
// ============================================================

let isPenalizing = false;
let currentProblem = null;
let expectedAnswer = 0;
let currentStep = 1; // 1 o 2
let stepsDoneList = [];

// ============================================================
// PRODUCTES
// ============================================================

const PRODUCTS = [
    { emoji: '🍞', nom: 'pa', noms: 'pans' },
    { emoji: '🥛', nom: 'llet', noms: 'llets' },
    { emoji: '🍎', nom: 'poma', noms: 'pomes' },
    { emoji: '✏️', nom: 'llapis', noms: 'llapis' },
    { emoji: '📓', nom: 'llibreta', noms: 'llibretes' },
    { emoji: '🍫', nom: 'xocolata', noms: 'xocolates' },
    { emoji: '💧', nom: 'ampolla', noms: 'ampolles' },
    { emoji: '🧃', nom: 'suc', noms: 'sucs' },
    { emoji: '🥐', nom: 'croissant', noms: 'croissants' },
    { emoji: '🍌', nom: 'plàtan', noms: 'plàtans' },
    { emoji: '🍪', nom: 'galeta', noms: 'galetes' },
    { emoji: '🥪', nom: 'entrepà', noms: 'entrepans' },
    { emoji: '🍕', nom: 'pizza', noms: 'pizzes' },
    { emoji: '🥤', nom: 'refresc', noms: 'refrescs' },
    { emoji: '🖊️', nom: 'boli', noms: 'bolis' },
    { emoji: '🧁', nom: 'magdalena', noms: 'magdalenes' },
    { emoji: '🍇', nom: 'raïm', noms: 'raïms' },
    { emoji: '🥜', nom: 'cacauet', noms: 'cacauets' },
];

function pickProduct() {
    return { ...pick(PRODUCTS) };
}

function productName(prod, qty) {
    return qty === 1 ? prod.nom : prod.noms;
}

// ============================================================
// GENERACIÓ DE PROBLEMES
// ============================================================

function generateProblem() {
    const prod = pickProduct();

    if (NIVELL === 1) {
        // 1 pas: múltiple directe. 4 casos equiprobables.
        const cas = pick(['1toN', 'Nto1', 'NtokN', 'kNtoN']);
        const unitPrice = randInt(1, 6);

        if (cas === '1toN') {
            const askQty = randInt(2, 8);
            return {
                prod,
                cas,
                unitPrice,
                twoStep: false,
                givenQty: 1,
                givenPrice: unitPrice,
                askQty,
                answer: unitPrice * askQty,
            };
        }
        if (cas === 'Nto1') {
            const givenQty = randInt(2, 8);
            return {
                prod,
                cas,
                unitPrice,
                twoStep: false,
                givenQty,
                givenPrice: unitPrice * givenQty,
                askQty: 1,
                answer: unitPrice,
            };
        }
        if (cas === 'NtokN') {
            const givenQty = randInt(2, 4);
            const multiplier = randInt(2, 4);
            const askQty = givenQty * multiplier;
            return {
                prod,
                cas,
                unitPrice,
                multiplier,
                twoStep: false,
                givenQty,
                givenPrice: unitPrice * givenQty,
                askQty,
                answer: unitPrice * askQty,
            };
        }
        // kNtoN
        const askQty = randInt(2, 4);
        const multiplier = randInt(2, 4);
        const givenQty = askQty * multiplier;
        return {
            prod,
            cas,
            unitPrice,
            multiplier,
            twoStep: false,
            givenQty,
            givenPrice: unitPrice * givenQty,
            askQty,
            answer: unitPrice * askQty,
        };
    }

    // Nivells 2 i 3: reducció a la unitat obligatòria (2 passos).
    // askQty no és múltiple de givenQty ni a l'inrevés.
    const big = NIVELL === 3;
    const unitPrice = big ? randInt(2, 12) : randInt(1, 6);
    const givenQty = big ? randInt(2, 12) : randInt(2, 8);

    let askQty;
    do {
        askQty = big ? randInt(2, 12) : randInt(2, 8);
    } while (askQty === givenQty || askQty % givenQty === 0 || givenQty % askQty === 0);

    return {
        prod,
        unitPrice,
        twoStep: true,
        givenQty,
        givenPrice: unitPrice * givenQty,
        askQty,
        step1Answer: unitPrice,
        step2Answer: unitPrice * askQty,
    };
}

// ============================================================
// RENDERITZACIÓ DEL PROBLEMA
// ============================================================

function renderProblem(p, showUnitRow = false) {
    const e = p.prod.emoji;
    const givenName = productName(p.prod, p.givenQty);
    const askName = productName(p.prod, p.askQty);

    let html = `<div class="problem-row">
        <span class="row-label">Dada:</span>
        <span class="problem-emoji">${e}</span>
        <span class="problem-qty">${p.givenQty} ${givenName}</span>
        <span class="problem-arrow">→</span>
        <span class="problem-price">${p.givenPrice} €</span>
    </div>`;

    if (showUnitRow) {
        html += `<div class="problem-row problem-unit-row">
            <span class="problem-emoji">${e}</span>
            <span class="problem-unit-qty">1 ${p.prod.nom}</span>
            <span class="problem-arrow">→</span>
            <span class="problem-price">${p.unitPrice} €</span>
        </div>`;
    }

    html += `<div class="problem-row">
        <span class="row-label">Busca:</span>
        <span class="problem-emoji">${e}</span>
        <span class="problem-qty">${p.askQty} ${askName}</span>
        <span class="problem-arrow">→</span>
        <span class="problem-unknown">? €</span>
    </div>`;

    return html;
}

// ============================================================
// GESTIÓ DE PASSOS
// ============================================================

function getStepPrompt() {
    const p = currentProblem;
    const askName = productName(p.prod, p.askQty);

    if (!p.twoStep) {
        if (p.askQty === 1) return `Quant costa 1 ${p.prod.nom}?`;
        return `Quant costen ${p.askQty} ${askName}?`;
    }
    if (currentStep === 1) return `Quant costa 1 ${p.prod.nom}?`;
    return `Quant costen ${p.askQty} ${askName}?`;
}

function buildQuestionText() {
    const p = currentProblem;
    const givName = productName(p.prod, p.givenQty);
    const askName = productName(p.prod, p.askQty);
    if (!p.twoStep) {
        return `${p.prod.emoji} ${p.givenQty} ${givName}→${p.givenPrice} €, ${p.askQty} ${askName}→?`;
    }
    if (currentStep === 1) {
        return `${p.prod.emoji} ${p.givenQty} ${givName}→${p.givenPrice} €, 1→?`;
    }
    return `${p.prod.emoji} 1→${p.unitPrice} €, ${p.askQty} ${askName}→?`;
}

// ============================================================
// COMPROVACIÓ DE RESPOSTES
// ============================================================

function checkValue() {
    if (state.isTransitioning || isPenalizing) return;
    const raw = els.valueInput.value.trim();
    if (raw === '') return;

    // Detectem punt decimal (no pertinent aquí, però consistent amb diners.html)
    if (raw.includes('.')) {
        showErrorInInput('Escriu un nombre enter, sense decimals.');
        shakeBtn(els.btnSubmitVal);
        return;
    }

    if (!/^\d+$/.test(raw)) {
        shakeBtn(els.btnSubmitVal);
        penalize();
        return;
    }

    const userAnswer = parseInt(raw, 10);
    const question = buildQuestionText();

    if (userAnswer !== expectedAnswer) {
        shakeBtn(els.btnSubmitVal);
        recordAnswerToHistory(question, raw, false);
        penalize();
        if (isTouchDevice()) kbMarkForOverwrite(els.valueInput);
        else {
            els.valueInput.value = '';
            els.valueInput.focus();
        }
        return;
    }

    // Correcte
    recordAnswerToHistory(question, raw, true);

    if (currentProblem.twoStep && currentStep === 1) {
        advanceStep(`✅ 1 ${currentProblem.prod.nom} → ${currentProblem.unitPrice} €`);
        return;
    }

    hideCustomKeyboard();
    finishOperation(true);
}

function advanceStep(doneText) {
    stepsDoneList.push(doneText);
    els.stepHint.textContent = '';
    els.stepHint.classList.remove('visible');
    els.valueInput.classList.remove('error-val');

    currentStep = 2;
    expectedAnswer = currentProblem.step2Answer;

    // Re-renderitza el problema amb la fila del preu unitari visible
    els.problemDisplay.innerHTML = renderProblem(currentProblem, true);

    // Mostra passos completats
    els.stepsDone.innerHTML = stepsDoneList.map(t => `<div class="step-done">${t}</div>`).join('');

    els.stepPrompt.textContent = getStepPrompt();
    els.valueInput.value = '';

    if (isTouchDevice()) showCustomKeyboard(els.valueInput);
    else els.valueInput.focus();
}

// ============================================================
// UI HELPERS
// ============================================================

function shakeBtn(btn) {
    btn.classList.add('error-shake');
    setTimeout(() => btn.classList.remove('error-shake'), 200);
}

function showErrorInInput(msg) {
    els.stepHint.textContent = msg;
    els.stepHint.classList.add('visible');
    els.valueInput.classList.add('error-val');
    els.valueInput.select();
    if (!isTouchDevice()) els.valueInput.focus();
}

els.valueInput.addEventListener('input', () => {
    if (els.valueInput.classList.contains('error-val')) {
        els.valueInput.classList.remove('error-val');
    }
});

function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Problema ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 1 ? ' danger' : '');
}

// ============================================================
// LÒGICA PRINCIPAL
// ============================================================

function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    isPenalizing = false;
    state.isTransitioning = false;
    currentStep = 1;
    stepsDoneList = [];

    hideInlineFeedback();
    els.stepHint.textContent = '';
    els.stepHint.classList.remove('visible');
    els.valueInput.classList.remove('error-val');

    currentProblem = generateProblem();
    expectedAnswer = currentProblem.twoStep ? currentProblem.step1Answer : currentProblem.answer;

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    els.stepsDone.innerHTML = '';
    els.resolutionPanel.style.display = 'none';

    updateHeader();

    els.problemDisplay.innerHTML = renderProblem(currentProblem, false);
    els.stepPrompt.textContent = getStepPrompt();
    els.valueInput.value = '';

    els.resolutionPanel.style.display = 'flex';

    if (isTouchDevice()) showCustomKeyboard(els.valueInput);
    else els.valueInput.focus();
}

function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;

    setTimeout(() => {
        state.attemptsLeft--;
        updateHeader();

        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            hideCustomKeyboard();

            // Mostra la resposta correcta dins la box en verd
            els.valueInput.value = String(expectedAnswer);
            els.valueInput.style.borderColor = 'var(--success)';
            els.valueInput.style.background = '#dcfce7';
            els.valueInput.style.color = '#166534';

            finishOperation(false);
        }

        isPenalizing = false;
    }, 400);
}

function showInlineFeedback(levelPoints) {
    state.isTransitioning = true;
    els.btnSubmitVal.disabled = true;
    if (els.valueInput) els.valueInput.disabled = true;

    const fb = els.inlineFeedback;
    fb.classList.remove('success', 'failure', 'visible');

    if (levelPoints > 0) {
        fb.innerHTML = `⭐ Molt bé! <span style="opacity:0.75;font-size:0.9em">+${levelPoints}</span>`;
        fb.classList.add('success', 'visible');
    } else {
        fb.innerHTML = '❌ Intents esgotats';
        fb.classList.add('failure', 'visible');
    }
}

function hideInlineFeedback() {
    const fb = els.inlineFeedback;
    fb.classList.remove('visible', 'success', 'failure');
    fb.innerHTML = '';
    els.btnSubmitVal.disabled = false;
    if (els.valueInput) {
        els.valueInput.disabled = false;
        els.valueInput.style.borderColor = '';
        els.valueInput.style.background = '';
        els.valueInput.style.color = '';
    }
}

function finishOperation(success) {
    recordResult(success ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4);
    const fails = MAX_INTENTS - state.attemptsLeft;
    const levelPoints = success ? Math.max(0, 10 - fails * 2) : 0;
    state.sessionScore += levelPoints;

    const waitTime = success ? 1200 : 2800;
    showInlineFeedback(levelPoints);

    setTimeout(() => {
        hideInlineFeedback();
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

// ── Teclat físic ────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (els.gameScreen.style.display === 'none') return;
    if (els.resolutionPanel.style.display === 'none') return;
    e.preventDefault();
    if (!state.isTransitioning) checkValue();
});

function checkCurrentCell() {
    checkValue();
}

// ============================================================
// INICI
// ============================================================

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false });

// Botó "Passar al nivell X" (fins a N2; N3 és el màxim)
(function initNextLevelBtn() {
    const btn = els.btnNextLevel;
    if (!btn || NIVELL >= 3) return;

    btn.textContent = `Passar al nivell ${NIVELL + 1} ›`;
    btn.classList.add('visible');

    btn.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        params.set('nivell', NIVELL + 1);
        window.location.search = params.toString();
    });
})();

startGame();
