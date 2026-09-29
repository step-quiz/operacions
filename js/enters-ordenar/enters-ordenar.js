/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/enters-ordenar/enters-ordenar.js
 * ROL: Joc «Ordenar Enters» (enters-ordenar.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, game-core.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { randInt, shuffle } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    hideCustomKeyboard,
    hideMiniOverlay,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbMarkForOverwrite,
    recordAnswerToHistory,
    recordResult,
    showCustomKeyboard,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { checkRepte1, checkRepte2, checkRepte3, buildLevel, checkCurrentCell });

const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    expressionBox: document.getElementById('expression-box'),
    opInstruction: document.getElementById('op-instruction'),
    resolutionPanel: document.getElementById('resolution-panel'),
    subProblem: document.getElementById('sub-problem-display'),

    stepRepte1: document.getElementById('step-repte1'),
    stepRepte2: document.getElementById('step-repte2'),
    stepRepte3: document.getElementById('step-repte3'),

    btnSubmitVal: document.getElementById('btn-submit-val'),
    btnSubmitR3: document.getElementById('btn-submit-r3'),
    r3Msg: document.getElementById('r3-msg'), // Node per al missatge

    r3Title: document.getElementById('r3-title'),
    r3Grid: document.getElementById('r3-grid'),

    hiddenVault: document.getElementById('hidden-vault'),
    valueInput: document.getElementById('value-input'),
};

let isPenalizing = false;
let challengeType = 1;
let challengeData = {};

function formatNum(num) {
    if (num < 0) return `(${num})`;
    return String(num);
}

function generateChallenge(type) {
    let data = {};
    if (type === 1) {
        let p = randInt(-9, 9);
        let q = randInt(-9, 9);
        while (p === q) q = randInt(-9, 9);
        data = { p, q, correctSign: p < q ? '<' : '>' };
    } else if (type === 2) {
        let p = randInt(-9, 7);
        let q = randInt(p + 2, 9);
        data = { p, q };
    } else if (type === 3) {
        let r = randInt(-5, 4);
        let numCorrects = randInt(2, 4);
        let nums = [];

        while (nums.length < numCorrects) {
            let n = randInt(-9, r - 1);
            if (!nums.includes(n)) nums.push(n);
        }

        while (nums.length < 8) {
            let n = randInt(r, 9);
            if (!nums.includes(n)) nums.push(n);
        }

        shuffle(nums);
        data = { r, nums, locked: Array(8).fill(false) };
    }
    return data;
}

function updateUI() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Repte ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft < 3 ? ' danger' : '');

    els.expressionBox.style.display = 'flex';
    els.subProblem.style.display = 'block';
    els.resolutionPanel.style.display = 'flex';

    els.stepRepte1.classList.remove('active');
    els.stepRepte2.classList.remove('active');
    els.stepRepte3.classList.remove('active');
    els.opInstruction.classList.remove('active');

    els.btnSubmitR3.style.display = '';
    if (els.r3Msg) els.r3Msg.innerText = ''; // Netegem el missatge residual si n'hi hagués

    if (els.valueInput.parentNode === els.expressionBox) {
        els.hiddenVault.appendChild(els.valueInput);
    }

    if (challengeType === 1) {
        els.expressionBox.innerHTML = `
            <span class="token-num highlight">${formatNum(challengeData.p)}</span>
            <span class="token-op auto-selected">?</span>
            <span class="token-num highlight">${formatNum(challengeData.q)}</span>
        `;
        els.subProblem.innerText = "Completa l'interrogant";
        els.stepRepte1.classList.add('active');
    } else if (challengeType === 2) {
        els.expressionBox.innerHTML = `
            <span class="token-num highlight">${formatNum(challengeData.p)}</span>
            <span class="token-num" style="background:transparent">&lt;</span>
            <span id="input-placeholder"></span>
            <span class="token-num" style="background:transparent">&lt;</span>
            <span class="token-num highlight">${formatNum(challengeData.q)}</span>
        `;

        const placeholder = document.getElementById('input-placeholder');
        placeholder.replaceWith(els.valueInput);

        els.valueInput.value = '';
        els.subProblem.innerText = 'Escriu un enter que compleixi les desigualtats';
        els.stepRepte2.classList.add('active');

        if (typeof isTouchDevice === 'function' && isTouchDevice()) {
            if (typeof showCustomKeyboard === 'function') showCustomKeyboard(els.valueInput);
        } else {
            els.valueInput.focus();
        }
    } else if (challengeType === 3) {
        els.expressionBox.style.display = 'none';
        els.subProblem.style.display = 'none';

        els.r3Title.innerText = `Selecciona els nombres que siguin menors que ${challengeData.r}`;
        els.r3Grid.innerHTML = '';

        const coordsCartesianes = [
            { x: 1, y: 1 },
            { x: 2, y: 3 },
            { x: 4, y: 5 },
            { x: 5, y: 2 },
            { x: 7, y: 2 },
            { x: 9, y: 4 },
            { x: 10, y: 1 },
            { x: 6, y: 4 },
        ];

        challengeData.nums.forEach((num, i) => {
            const btn = document.createElement('button');
            btn.className = 'btn-sign';
            btn.innerText = num;

            const leftPercent = coordsCartesianes[i].x * 10;
            const topPercent = (5.5 - coordsCartesianes[i].y) * 20;

            btn.style.position = 'absolute';
            btn.style.left = `${leftPercent}%`;
            btn.style.top = `${topPercent}%`;
            btn.style.transform = 'translate(-50%, -50%)';
            btn.style.minWidth = '50px';
            btn.style.width = '50px';

            if (challengeData.locked[i]) {
                btn.classList.add('selected');
                btn.style.backgroundColor = 'var(--success)';
                btn.style.borderColor = 'var(--success)';
                btn.style.color = 'white';
                btn.style.pointerEvents = 'none';
            } else {
                btn.onclick = function () {
                    if (isPenalizing || state.isTransitioning) return;
                    this.classList.toggle('selected');
                };
            }

            els.r3Grid.appendChild(btn);
        });

        els.stepRepte3.classList.add('active');
    }
}

function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    challengeType = (state.currentOperation % 3) + 1;
    challengeData = generateChallenge(challengeType);
    state.isTransitioning = false;
    isPenalizing = false;

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    updateUI();
}

function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        state.attemptsLeft--;
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            els.stepRepte1.classList.remove('active');
            els.stepRepte2.classList.remove('active');
            els.stepRepte3.classList.remove('active');
            if (typeof hideCustomKeyboard === 'function') hideCustomKeyboard();
        }
        isPenalizing = false;
        updateUI();
        if (state.attemptsLeft <= 0) _finishOp(0);
    }, 1000);
}

function _finishOp(levelPoints) {
    recordResult(levelPoints > 0 ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4);
    if (typeof hideCustomKeyboard === 'function') hideCustomKeyboard();
    const waitTime = showMiniOverlay(levelPoints);
    setTimeout(() => {
        hideMiniOverlay();
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

function checkRepte1(selectedSign, btnElement) {
    if (state.isTransitioning || isPenalizing) return;
    const stepQuestion = `Signe entre ${challengeData.p} i ${challengeData.q}`;

    if (selectedSign !== challengeData.correctSign) {
        btnElement.classList.add('error-shake');
        setTimeout(() => btnElement.classList.remove('error-shake'), 200);
        if (typeof recordAnswerToHistory === 'function') recordAnswerToHistory(stepQuestion, selectedSign, false);
        penalize();
        btnElement.blur();
        return;
    }

    if (typeof recordAnswerToHistory === 'function') recordAnswerToHistory(stepQuestion, selectedSign, true);
    els.expressionBox.innerHTML = `
        <span class="token-num highlight">${formatNum(challengeData.p)}</span>
        <span class="token-num resolved-num" style="font-size:1.5em">${selectedSign}</span>
        <span class="token-num highlight">${formatNum(challengeData.q)}</span>
    `;
    els.stepRepte1.classList.remove('active');
    successEnd();
}

function checkRepte2() {
    if (state.isTransitioning || isPenalizing) return;
    const rawValue = els.valueInput.value.trim();
    if (rawValue === '') return;

    if (!/^-?\d+$/.test(rawValue)) {
        els.valueInput.classList.add('error-shake');
        els.btnSubmitVal.classList.add('error-shake');
        setTimeout(() => {
            els.valueInput.classList.remove('error-shake');
            els.btnSubmitVal.classList.remove('error-shake');
        }, 200);
        penalize();
        return;
    }

    const userAnswer = parseInt(rawValue, 10);
    const stepQuestion = `Enter entre ${challengeData.p} i ${challengeData.q}`;

    if (userAnswer <= challengeData.p || userAnswer >= challengeData.q) {
        els.valueInput.classList.add('error-shake');
        els.btnSubmitVal.classList.add('error-shake');
        setTimeout(() => {
            els.valueInput.classList.remove('error-shake');
            els.btnSubmitVal.classList.remove('error-shake');
        }, 200);
        if (typeof recordAnswerToHistory === 'function') recordAnswerToHistory(stepQuestion, rawValue, false);
        penalize();

        if (typeof isTouchDevice === 'function' && isTouchDevice()) {
            if (typeof kbMarkForOverwrite === 'function') kbMarkForOverwrite(els.valueInput);
        } else {
            els.valueInput.value = '';
            els.valueInput.focus();
        }
        return;
    }

    if (typeof recordAnswerToHistory === 'function') recordAnswerToHistory(stepQuestion, rawValue, true);

    const resolvedSpan = document.createElement('span');
    resolvedSpan.className = 'token-num resolved-num';
    resolvedSpan.innerText = userAnswer;
    els.valueInput.parentNode.insertBefore(resolvedSpan, els.valueInput);
    els.hiddenVault.appendChild(els.valueInput);

    els.stepRepte2.classList.remove('active');
    successEnd();
}

function checkRepte3() {
    if (state.isTransitioning || isPenalizing) return;
    const buttons = els.r3Grid.querySelectorAll('.btn-sign');
    let allCorrect = true;
    let isMissing = false;

    buttons.forEach((btn, i) => {
        const isSelected = btn.classList.contains('selected');
        const isLessThanR = challengeData.nums[i] < challengeData.r;
        if (isSelected !== isLessThanR) {
            allCorrect = false;
            // Si l'hauria d'haver seleccionat però no ho ha fet...
            if (!isSelected && isLessThanR) {
                isMissing = true;
            }
        }
    });

    const stepQuestion = `Menors que ${challengeData.r}`;

    if (!allCorrect) {
        els.btnSubmitR3.classList.add('error-shake');
        setTimeout(() => els.btnSubmitR3.classList.remove('error-shake'), 200);
        if (typeof recordAnswerToHistory === 'function') recordAnswerToHistory(stepQuestion, 'Error', false);

        // 🟢 NOU: Si s'ha deixat d'escollir algun nombre correcte, li ho indiquem amb el missatge
        if (isMissing && els.r3Msg) {
            els.r3Msg.innerText = 'Falta encara algun nombre.';
            setTimeout(() => {
                els.r3Msg.innerText = '';
            }, 3000);
        }

        buttons.forEach((btn, i) => {
            const isSelected = btn.classList.contains('selected');
            const isLessThanR = challengeData.nums[i] < challengeData.r;

            if (isSelected && isLessThanR) {
                challengeData.locked[i] = true;
                btn.style.backgroundColor = 'var(--success)';
                btn.style.borderColor = 'var(--success)';
                btn.style.color = 'white';
                btn.style.pointerEvents = 'none';
            } else if (isSelected && !isLessThanR) {
                btn.classList.add('error-shake');
                setTimeout(() => btn.classList.remove('error-shake'), 400);
            }
        });

        penalize();
        return;
    }

    if (typeof recordAnswerToHistory === 'function') recordAnswerToHistory(stepQuestion, 'Correcte', true);

    buttons.forEach((btn, i) => {
        btn.style.pointerEvents = 'none';
        if (challengeData.nums[i] < challengeData.r) {
            btn.style.backgroundColor = 'var(--success)';
            btn.style.borderColor = 'var(--success)';
            btn.style.color = 'white';
        }
    });

    els.btnSubmitR3.style.display = 'none';
    successEnd();
}

function successEnd() {
    state.isTransitioning = true;
    const fails = MAX_INTENTS - state.attemptsLeft;
    const levelPoints = Math.max(0, 10 - fails * 2);
    state.sessionScore += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    _finishOp(levelPoints);
}

document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        if (els.gameScreen.style.display !== 'none') {
            e.preventDefault();
            if (!state.isTransitioning) checkCurrentCell();
        }
    }
});

function checkCurrentCell() {
    if (challengeType === 2) checkRepte2();
    if (challengeType === 3) checkRepte3();
}

if (typeof injectSharedHTML === 'function') injectSharedHTML();
if (typeof validateConfig === 'function') validateConfig();

if (typeof initCustomKeyboard === 'function') initCustomKeyboard({ allowNegative: true });

if (typeof startGame === 'function') startGame();
