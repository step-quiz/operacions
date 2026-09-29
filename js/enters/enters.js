/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/enters/enters.js
 * ROL: Joc «Operacions amb Enters» (enters.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, game-core.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { randInt, randIntNonZero, shuffle } from '../utils.js';
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
Object.assign(window, { checkSign, checkValue, buildLevel, checkCurrentCell });

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
    stepSign: document.getElementById('step-sign'),
    stepValue: document.getElementById('step-value'),
    valueInput: document.getElementById('value-input'),
    btnSubmitVal: document.getElementById('btn-submit-val'),
};

let isPenalizing = false;
let tokens = [];
let activeOpIndex = -1;
let expectedSubAns = null;
let opBlinkTimeoutId = null;
let opCueDelayTimeoutId = null;
let opCueLocked = false;

// ---- GENERACIÓ D'EXPRESSIONS ----
function getTerm() {
    if (Math.random() > 0.5) {
        // [FIX m1] Almenys un operand no-zero per evitar 0·0 trivial
        return [
            { type: 'num', val: randIntNonZero(-8, 8) },
            { type: 'op', val: '·' },
            { type: 'num', val: randInt(-8, 8) },
        ];
    } else {
        const b = randIntNonZero(-8, 8);
        const ans = randInt(-8, 8);
        return [
            { type: 'num', val: b * ans },
            { type: 'op', val: ':' },
            { type: 'num', val: b },
        ];
    }
}

function getNum() {
    return [{ type: 'num', val: randInt(-15, 15) }];
}

function generateExpression(opIndex) {
    const op1 = Math.random() > 0.5 ? '+' : '-';
    const op2 = Math.random() > 0.5 ? '+' : '-';

    if (opIndex <= 1) {
        return opIndex === 0 ? [...getNum(), { type: 'op', val: op1 }, ...getNum()] : getTerm();
    }
    if (opIndex <= 4) {
        const term = getTerm(),
            num = getNum();
        return Math.random() > 0.5
            ? [...term, { type: 'op', val: op1 }, ...num]
            : [...num, { type: 'op', val: op1 }, ...term];
    }
    if (opIndex <= 7) {
        return [...getTerm(), { type: 'op', val: op1 }, ...getTerm()];
    }
    const parts = [getTerm(), getTerm(), getNum()];
    shuffle(parts);
    return [...parts[0], { type: 'op', val: op1 }, ...parts[1], { type: 'op', val: op2 }, ...parts[2]];
}

function calculate(a, op, b) {
    switch (op) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '·':
            return a * b;
        case ':':
            return a / b;
    }
}

function getOpPriority(op) {
    if (op === '·' || op === ':') return 2;
    if (op === '+' || op === '-') return 1;
    return 0;
}

function getValidOpIndices() {
    const validIds = [];
    const ops = [];
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === 'op') ops.push({ index: i, val: tokens[i].val, p: getOpPriority(tokens[i].val) });
    }
    function isBoundToP2(idx) {
        if (idx > 0 && tokens[idx - 1].type === 'op' && getOpPriority(tokens[idx - 1].val) === 2) return true;
        if (idx < tokens.length - 1 && tokens[idx + 1].type === 'op' && getOpPriority(tokens[idx + 1].val) === 2)
            return true;
        return false;
    }
    let p2Block = [];
    for (let i = 0; i < ops.length; i++) {
        if (ops[i].p === 2) {
            p2Block.push(ops[i].index);
        } else {
            if (p2Block.length > 0) {
                validIds.push(p2Block[0]);
                p2Block = [];
            }
        }
    }
    if (p2Block.length > 0) validIds.push(p2Block[0]);
    for (let i = 0; i < ops.length; i++) {
        if (ops[i].p === 1) {
            const opIdx = ops[i].index;
            if (!isBoundToP2(opIdx - 1) && !isBoundToP2(opIdx + 1)) {
                const leftOp = i > 0 ? ops[i - 1].val : null;
                if (leftOp !== '-') validIds.push(opIdx);
            }
        }
    }
    return validIds;
}

function formatNum(num, isFirst = false) {
    if (num < 0 && !isFirst) return `(${num})`;
    return String(num);
}

function clearOpSelectionCue() {
    if (opBlinkTimeoutId) {
        clearTimeout(opBlinkTimeoutId);
        opBlinkTimeoutId = null;
    }
    if (opCueDelayTimeoutId) {
        clearTimeout(opCueDelayTimeoutId);
        opCueDelayTimeoutId = null;
    }
    els.opInstruction.classList.remove('active');
    els.opInstruction.innerText = '';
    els.expressionBox.querySelectorAll('.token-op.step0-blink').forEach(b => b.classList.remove('step0-blink'));
}

function showOpSelectionCue() {
    clearOpSelectionCue();
    const opButtons = els.expressionBox.querySelectorAll('.token-op');
    if (opCueLocked || activeOpIndex !== -1 || state.isTransitioning || opButtons.length <= 1) return;
    els.opInstruction.innerText = "Clica a l'operació que cal fer a continuació";
    els.opInstruction.classList.add('active');
    opButtons.forEach(b => b.classList.add('step0-blink'));
    opBlinkTimeoutId = setTimeout(() => {
        opButtons.forEach(b => b.classList.remove('step0-blink'));
        opBlinkTimeoutId = null;
    }, 2000);
}

function showOpPriorityErrorThenCue() {
    clearOpSelectionCue();
    const opButtons = els.expressionBox.querySelectorAll('.token-op');
    if (activeOpIndex !== -1 || state.isTransitioning || opButtons.length <= 1) {
        opCueLocked = false;
        return;
    }
    opCueLocked = true;
    els.opInstruction.innerHTML = `<span class="op-instruction-line error">Error: has de complir la prioritat d'operacions</span>`;
    els.opInstruction.classList.add('active');
    opCueDelayTimeoutId = setTimeout(() => {
        if (activeOpIndex !== -1 || state.isTransitioning) {
            opCueLocked = false;
            return;
        }
        els.opInstruction.innerHTML = `
            <span class="op-instruction-line error">Error: has de complir la prioritat d'operacions</span>
            <span class="op-instruction-line hint">Clica a l'operació que cal fer a continuació</span>
        `;
        opButtons.forEach(b => b.classList.add('step0-blink'));
        opBlinkTimeoutId = setTimeout(() => {
            opButtons.forEach(b => b.classList.remove('step0-blink'));
            opBlinkTimeoutId = null;
        }, 2000);
        opCueLocked = false;
    }, 500);
}

function updateUI() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Operació ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft < 3 ? ' danger' : '');
    els.expressionBox.innerHTML = '';

    let opCount = 0;
    tokens.forEach((tok, index) => {
        const el = document.createElement(tok.type === 'op' ? 'button' : 'span');
        if (tok.type === 'op') {
            opCount++;
            const opLabel = { '+': 'suma', '-': 'resta', '·': 'multiplicació', ':': 'divisió' };
            el.className = 'token-op';
            el.innerText = tok.val;
            el.id = `op-${index}`;
            el.setAttribute('aria-label', `Operador ${opLabel[tok.val] || tok.val}`);
            el.onclick = () => handleOpClick(index, el);
        } else {
            el.className = 'token-num';
            if (tok.resolved) el.classList.add('resolved-num');
            el.id = `num-${index}`;
            el.innerText = formatNum(tok.val, index === 0);
        }
        els.expressionBox.appendChild(el);
    });

    // 🟢 CORRECCIÓ 6: Reaplicar els colors i selectors visuals si recreem la UI a mitja operació
    if (activeOpIndex !== -1) {
        const opBtn = document.getElementById(`op-${activeOpIndex}`);
        if (opBtn) opBtn.classList.add('auto-selected');
        const leftNum = document.getElementById(`num-${activeOpIndex - 1}`);
        if (leftNum) leftNum.classList.add('highlight');
        const rightNum = document.getElementById(`num-${activeOpIndex + 1}`);
        if (rightNum) rightNum.classList.add('highlight');
    }

    const cueInProgress = opBlinkTimeoutId !== null || opCueDelayTimeoutId !== null;
    if (activeOpIndex === -1 && !state.isTransitioning && opCount > 1 && !opCueLocked && !cueInProgress)
        showOpSelectionCue();
    else if (!cueInProgress) clearOpSelectionCue();
    if (activeOpIndex === -1) els.resolutionPanel.style.display = 'none';
    if (opCount === 1 && activeOpIndex === -1 && !state.isTransitioning) {
        setTimeout(() => {
            const idx = tokens.findIndex(t => t.type === 'op');
            const btn = document.getElementById(`op-${idx}`);
            if (btn) handleOpClick(idx, btn);
        }, 50);
    }
}

function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    tokens = generateExpression(state.currentOperation);
    activeOpIndex = -1;
    expectedSubAns = null;
    state.isTransitioning = false;
    isPenalizing = false;
    opCueLocked = false;
    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    clearOpSelectionCue();
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
            els.stepValue.classList.remove('active');
            els.stepSign.classList.remove('active');

            // 🟢 CORRECCIÓ 2: Amagar el teclat si ens quedem sense intents
            hideCustomKeyboard();
        }
        isPenalizing = false;
        updateUI();
        if (state.attemptsLeft <= 0) _finishOp(0);
    }, 1000);
}

function _finishOp(levelPoints) {
    recordResult(levelPoints > 0 ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4);
    const waitTime = showMiniOverlay(levelPoints);
    setTimeout(() => {
        hideMiniOverlay();
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            // 🟢 CORRECCIÓ 1: Eliminat sessionScores.push(sessionScore) d'aquí per no duplicar-lo.
            // endSession() ja se n'encarrega!
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

function handleOpClick(index, btnElement) {
    if (state.attemptsLeft <= 0 || activeOpIndex !== -1 || state.isTransitioning || isPenalizing) {
        btnElement.blur();
        return;
    }
    const validIndices = getValidOpIndices();
    if (!validIndices.includes(index)) {
        btnElement.classList.add('error-shake');
        setTimeout(() => btnElement.classList.remove('error-shake'), 200);
        opCueLocked = true;
        clearOpSelectionCue();
        penalize();
        if (state.attemptsLeft > 0 && !state.isTransitioning) showOpPriorityErrorThenCue();
        btnElement.blur();
        return;
    }
    opCueLocked = false;
    clearOpSelectionCue();
    activeOpIndex = index;
    const a = tokens[index - 1].val,
        op = tokens[index].val,
        b = tokens[index + 1].val;
    expectedSubAns = calculate(a, op, b);
    document.getElementById(`num-${index - 1}`).classList.add('highlight');
    document.getElementById(`num-${index + 1}`).classList.add('highlight');
    btnElement.classList.add('auto-selected');
    els.resolutionPanel.style.display = 'flex';
    els.subProblem.innerText = `${formatNum(a, true)} ${op} ${formatNum(b)}`;
    els.stepSign.classList.add('active');
    els.stepValue.classList.remove('active');
    btnElement.blur();
}

function checkSign(selectedSign, btnElement) {
    if (activeOpIndex === -1 || state.isTransitioning || isPenalizing) return;
    const correctSign = expectedSubAns === 0 ? 'zero' : expectedSubAns > 0 ? 'positiu' : 'negatiu';

    const a = tokens[activeOpIndex - 1].val;
    const op = tokens[activeOpIndex].val;
    const b = tokens[activeOpIndex + 1].val;
    const stepQuestion = `Signe de: ${formatNum(a, true)} ${op} ${formatNum(b)}`;

    if (selectedSign !== correctSign) {
        btnElement.classList.add('error-shake');
        setTimeout(() => btnElement.classList.remove('error-shake'), 200);
        recordAnswerToHistory(stepQuestion, selectedSign, false);
        penalize();
        btnElement.blur();
        return;
    }

    recordAnswerToHistory(stepQuestion, selectedSign, true);

    if (correctSign === 'zero') {
        finalizeSubProblem();
    } else {
        els.stepSign.classList.remove('active');
        els.stepValue.classList.add('active');
        els.valueInput.value = '';
        if (isTouchDevice()) {
            showCustomKeyboard(els.valueInput);
        } else {
            els.valueInput.focus();
        }
    }
}

function checkValue() {
    if (activeOpIndex === -1 || state.isTransitioning || isPenalizing) return;
    const rawValue = els.valueInput.value.trim();
    if (rawValue === '') return;

    // 🟢 CORRECCIÓ 5: Regex estricte per evitar valors amb trampa com "1e2", "0x10", etc.
    if (!/^-?\d+$/.test(rawValue)) {
        els.btnSubmitVal.classList.add('error-shake');
        setTimeout(() => els.btnSubmitVal.classList.remove('error-shake'), 200);
        penalize();
        return;
    }

    const userAnswer = parseInt(rawValue, 10);

    const a = tokens[activeOpIndex - 1].val;
    const op = tokens[activeOpIndex].val;
    const b = tokens[activeOpIndex + 1].val;
    const stepQuestion = `Valor de: ${formatNum(a, true)} ${op} ${formatNum(b)}`;

    if (userAnswer !== expectedSubAns) {
        els.btnSubmitVal.classList.add('error-shake');
        setTimeout(() => els.btnSubmitVal.classList.remove('error-shake'), 200);
        recordAnswerToHistory(stepQuestion, rawValue, false);

        penalize();
        if (isTouchDevice()) {
            kbMarkForOverwrite(els.valueInput);
        } else {
            els.valueInput.value = '';
            els.valueInput.focus();
        }
        return;
    }

    recordAnswerToHistory(stepQuestion, rawValue, true);

    // 🟢 CORRECCIÓ 2: Teclat forçat a ocultar-se en encertar
    hideCustomKeyboard();
    finalizeSubProblem();
}

function finalizeSubProblem() {
    tokens.splice(activeOpIndex - 1, 3, { type: 'num', val: expectedSubAns, resolved: true });
    activeOpIndex = -1;
    expectedSubAns = null;
    els.stepValue.classList.remove('active');
    els.stepSign.classList.remove('active');
    els.valueInput.value = '';
    updateUI();
    if (tokens.length === 1) {
        state.isTransitioning = true;
        const fails = MAX_INTENTS - state.attemptsLeft;
        const levelPoints = Math.max(0, 10 - fails * 2);
        state.sessionScore += levelPoints;
        els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
        _finishOp(levelPoints);
    }
}

// 🟢 CORRECCIÓ 3: Prevenir event.preventDefault() global i problemes d'accessibilitat
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        // Només interceptem l'Enter quan estem efectivament actius al pas de valor de la pantalla de joc.
        if (els.gameScreen.style.display !== 'none' && els.stepValue.classList.contains('active')) {
            e.preventDefault();
            if (!state.isTransitioning) checkValue();
        }
    }
});

function checkCurrentCell() {
    checkValue();
}

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true });
startGame();
