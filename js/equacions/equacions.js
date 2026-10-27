/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions/equacions.js
 * ROL: Joc «Equacions de 1r Grau» (equacions.html). Abans era dins de l'HTML.
 * ARQUITECTURA: la generació de les equacions i els passos són a math-engine.js
 *      (pur); l'HTML dels termes, a renderer.js; aquí, el joc (DOM).
 *      «Resolució pas a pas» (?pissarra=1, js/pissarra/): l'historial es pinta dins
 *      d'una pissarra sense marc i cada línia nova s'anima (els termes que el pas
 *      mou baixen de la línia anterior i s'hi fusionen; les d'abans queden
 *      escrites). No canvia res més: preguntes, punts ni codi.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa game-core.js, utils.js, config.js,
 *      pissarra/mode.js, pissarra/pissarra.js, math-engine.js i renderer.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt } from '../utils.js';
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
import { PISSARRA_ACTIVA } from '../pissarra/mode.js';
import { creaPissarra } from '../pissarra/pissarra.js';
import { MathEngine } from './math-engine.js';
import { Renderer } from './renderer.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { checkValue, buildLevel, checkCurrentCell });

// ============================================================
// CODI ESPECÍFIC D'EQUACIONS — el que NO és compartit
// ============================================================
//
// NIVELLS (via ?nivell=):
//   Nivell 1: ax = b, b = ax, ax+b = c, c = ax+b
//   Nivell 2: nivell 1 + ax+b = cx+d + agrupar termes
//             (ex: a1·x + b + a2·x = c1·x + d + c2·x)
//   Nivell 3: nivell 1 + nivell 2 + parèntesis
//             (ex: a(x+b) + c·x + d = e(x+f) + g·x + h)
//   Sense ?nivell= → comportament legacy (progressió per opIndex)
//
// FLAGS:
//   ?lefttoright=1 → mai surten formes amb x només a la dreta
//                    (es bloquegen "b=ax" i "c=ax+b" del nivell 1).
//                    Només afecta nivell 1; nivells 2/3 ja tenen x als
//                    dos costats i el legacy mai els genera.
// ============================================================

// Cache DOM específic d'aquest joc
const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    eqHistory: document.getElementById('eq-history'),
    stepHint: document.getElementById('step-hint'),
    resolutionPanel: document.getElementById('resolution-panel'),
    stepCounter: document.getElementById('step-counter'),
    stepInstruction: document.getElementById('step-instruction'),
    stepValue: document.getElementById('step-value'),
    valueInput: null, // es crea dinàmicament a renderStepHint
    btnSubmitVal: document.getElementById('btn-submit-val'),
};

// Estat específic d'equacions
//   equation = {
//       dispLeft:  [terms...],   ← termes a la dreta tal com es veuen
//       dispRight: [terms...],
//       leftA, leftB, rightC, rightD,   ← forma canònica (x a l'esquerra)
//       xSol,
//       swapInitial: bool        ← (opcional) si l'eq-original es mostra amb costats invertits
//   }
//   Cada term:
//       { k:'x', c:<coef> }              → c·x
//       { k:'n', v:<valor> }             → v
//       { k:'p', c:<extern>, n:<intern> } → extern·(x + intern)
let equation = null;
let steps = [];
let currentStepIndex = 0;
let isPenalizing = false;
// «Resolució pas a pas» (?pissarra=1): la pissarra de l'historial (null si no és actiu), les línies de
// l'historial ({ left, right, inv, classe, pas }, vegeu renderer.js) i la cua d'animacions
const pissarra = PISSARRA_ACTIVA ? creaPissarra(els.eqHistory, { files: 1, marc: false }) : null;
let historia = [];
let cuaPissarra = Promise.resolve();

// La matemàtica és a math-engine.js; l'HTML dels termes, a renderer.js
const { xT, nT, determineSteps } = MathEngine;
const { renderTerms } = Renderer;

// Flag opcional: ?lefttoright=1 → mai generem formes amb x només a la dreta
const leftToRightOnly = (() => {
    try {
        return new URLSearchParams(window.location.search).get('lefttoright') === '1';
    } catch (e) {
        return false;
    }
})();

// Una equació nova, amb el nivell (?nivell=), ?lefttoright=1 i el nombre d'equacions de la sessió
function generateEquation(opIndex) {
    const nivell = typeof state.currentDifficulty === 'number' ? state.currentDifficulty : 0;
    return MathEngine.generateEquation(opIndex, {
        nivell,
        leftToRight: leftToRightOnly,
        totalOperations: TOTAL_OPERATIONS,
    });
}

function addEquationToHistory(leftArr, rightArr, extraClass) {
    const prev = els.eqHistory.querySelector('.eq-latest');
    if (prev) prev.classList.remove('eq-latest');

    const div = document.createElement('div');
    div.className = 'eq-history-line';
    if (extraClass) div.classList.add(extraClass);
    div.innerHTML = renderTerms(leftArr) + '<span class="eq-sign">=</span>' + renderTerms(rightArr);
    els.eqHistory.appendChild(div);
}

// «Resolució pas a pas»: l'historial a la pissarra. anima: la línia nova s'escriu amb animació (un pas
// que l'alumne ha encertat, i va de pressa: ja sap què ha calculat); si no, es mostra tal qual.
// Les pintades van en cua: una animació sempre acaba abans que comenci la següent.
function pintaHistoria(anima) {
    const pas = Object.assign(
        { files: [Renderer.historiaHtml(historia)], classes: ['centrada'], text: '' },
        anima ? Renderer.animacioUltimaLinia(historia) : {}
    );
    cuaPissarra = cuaPissarra.then(() => {
        if (!anima) return pissarra.mostraPas(pas);
        pissarra.velocitat(1.6);
        return pissarra.animaPas(pas);
    });
    return cuaPissarra;
}

// ---- BUILD LEVEL (cridat per game-core) ----
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;

    equation = generateEquation(state.currentOperation);
    steps = determineSteps(equation);
    currentStepIndex = 0;

    const colorIndex = (state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length;
    els.body.style.backgroundColor = bgColors[colorIndex];

    if (!pissarra) els.eqHistory.innerHTML = '';
    els.eqHistory.style.display = 'flex';
    els.stepHint.style.display = 'none';

    // Per les formes b=ax i c=ax+b (swapInitial), invertim només la
    // primera línia visual; la resta del joc treballa en forma canònica.
    const origLeft = equation.swapInitial ? equation.dispRight : equation.dispLeft;
    const origRight = equation.swapInitial ? equation.dispLeft : equation.dispRight;
    if (pissarra) {
        historia = [
            {
                left: equation.dispLeft,
                right: equation.dispRight,
                inv: !!equation.swapInitial,
                classe: 'eq-original',
                pas: null,
            },
        ];
        pintaHistoria(false);
    } else addEquationToHistory(origLeft, origRight, 'eq-original');

    updateHeader();
    showCurrentStep();
}

// ---- ACTUALITZAR INTERFÍCIE ----
function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Equació ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';
    if (state.attemptsLeft < 5) els.attemptsDisplay.classList.add('danger');
}

function showCurrentStep() {
    if (currentStepIndex >= steps.length) {
        const fails = MAX_INTENTS - state.attemptsLeft;
        const levelPoints = Math.max(0, 10 - fails);
        finishEquation(levelPoints);
        return;
    }

    const step = steps[currentStepIndex];

    els.resolutionPanel.style.display = 'flex';
    els.stepCounter.innerText = `Pas ${currentStepIndex + 1} de ${steps.length}`;
    els.stepInstruction.innerHTML = step.instruction;

    renderStepHint(step);

    els.stepValue.classList.add('active');
    els.valueInput = document.getElementById('value-input');
    els.valueInput.value = '';

    if (isTouchDevice()) {
        showCustomKeyboard(els.valueInput);
    } else {
        els.valueInput.focus();
    }
}

function renderStepHint(step) {
    const Q =
        '<input type="text" id="value-input" autocomplete="off" aria-label="Resultat numèric" class="hint-input">';
    const inX = { k: '_input_x', html: Q };
    const inN = { k: '_input_n', html: Q };
    let leftTokens, rightTokens;

    if (step.type === 'distribute_left') {
        // Substituïm el parèntesi per: coef·x + [input]
        leftTokens = step.dispLeftBefore.slice();
        leftTokens.splice(step.distIdx, 1, xT(step.distOuter), inN);
        rightTokens = step.dispRightBefore.slice();
    } else if (step.type === 'distribute_right') {
        leftTokens = step.dispLeftBefore.slice();
        rightTokens = step.dispRightBefore.slice();
        rightTokens.splice(step.distIdx, 1, xT(step.distOuter), inN);
    } else if (step.type === 'simplify_left_x') {
        // [input]·x al lloc del primer x; els altres x desapareixen.
        leftTokens = [];
        let placed = false;
        for (const t of step.dispLeftBefore) {
            if (t.k === 'x') {
                if (!placed) {
                    leftTokens.push(inX);
                    placed = true;
                }
            } else {
                leftTokens.push(t);
            }
        }
        rightTokens = step.dispRightBefore.slice();
    } else if (step.type === 'simplify_left_n') {
        leftTokens = [];
        let placed = false;
        for (const t of step.dispLeftBefore) {
            if (t.k === 'n') {
                if (!placed) {
                    leftTokens.push(inN);
                    placed = true;
                }
            } else {
                leftTokens.push(t);
            }
        }
        rightTokens = step.dispRightBefore.slice();
    } else if (step.type === 'simplify_right_x') {
        leftTokens = step.dispLeftBefore.slice();
        rightTokens = [];
        let placed = false;
        for (const t of step.dispRightBefore) {
            if (t.k === 'x') {
                if (!placed) {
                    rightTokens.push(inX);
                    placed = true;
                }
            } else {
                rightTokens.push(t);
            }
        }
    } else if (step.type === 'simplify_right_n') {
        leftTokens = step.dispLeftBefore.slice();
        rightTokens = [];
        let placed = false;
        for (const t of step.dispRightBefore) {
            if (t.k === 'n') {
                if (!placed) {
                    rightTokens.push(inN);
                    placed = true;
                }
            } else {
                rightTokens.push(t);
            }
        }
    } else if (step.type === 'group_x') {
        // [input]·x + (constants esquerra) = (constants dreta)
        leftTokens = [inX];
        for (const t of step.dispLeftBefore) {
            if (t.k === 'n') leftTokens.push(t);
        }
        rightTokens = [];
        for (const t of step.dispRightBefore) {
            if (t.k === 'n') rightTokens.push(t);
        }
        if (rightTokens.length === 0) rightTokens.push(nT(0));
    } else if (step.type === 'group_num') {
        // (coef)x = [input]
        leftTokens = [];
        for (const t of step.dispLeftBefore) {
            if (t.k === 'x') leftTokens.push(t);
        }
        if (leftTokens.length === 0) leftTokens.push(nT(0));
        rightTokens = [inN];
    } else {
        // 'solve'
        leftTokens = [xT(1)];
        rightTokens = [inN];
    }

    els.stepHint.innerHTML = renderTerms(leftTokens) + ' <span class="eq-sign">=</span> ' + renderTerms(rightTokens);
    els.stepHint.style.display = 'block';
}

// ---- PENALITZACIÓ ----
function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink-warning');

    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink-warning');

        state.attemptsLeft--;
        updateHeader();

        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            els.stepValue.classList.remove('active');
            if (els.valueInput) els.valueInput.value = '';
            if (typeof hideCustomKeyboard === 'function') hideCustomKeyboard();
            finishEquation(0);
        }
        isPenalizing = false;
    }, 1000);
}
// ---- COMPROVAR VALOR ----
function checkValue() {
    if (state.isTransitioning || isPenalizing) return;

    const rawValue = els.valueInput.value.trim();
    if (rawValue === '') return;
    const step = steps[currentStepIndex];

    // Convertim l'input de text a número (ex: "-3" -> -3)
    const userAnswer = parseStrictInt(rawValue);
    if (isNaN(userAnswer)) return;

    // Nom neutre de la pregunta per a l'informe
    const stepQuestion = 'Pas ' + (currentStepIndex + 1) + " de l'equació";

    // CORRECCIÓ: Comparem amb step.answer (on tens guardada la solució numèrica)
    if (userAnswer !== step.answer) {
        els.btnSubmitVal.classList.add('error-shake');
        setTimeout(() => els.btnSubmitVal.classList.remove('error-shake'), 200);

        // 🔴 Guardem l'error a l'historial si la funció està disponible
        if (typeof recordAnswerToHistory === 'function') {
            recordAnswerToHistory(stepQuestion, rawValue, false);
        }

        penalize();
        if (isTouchDevice()) {
            kbMarkForOverwrite(els.valueInput);
        } else {
            if (els.valueInput) {
                els.valueInput.value = '';
                els.valueInput.focus();
            }
        }
        return;
    }

    // 🟢 Guardem l'encert a l'historial si la funció està disponible
    if (typeof recordAnswerToHistory === 'function') {
        recordAnswerToHistory(stepQuestion, rawValue, true);
    }

    // correcte
    els.btnSubmitVal.classList.add('success-pop');
    setTimeout(() => els.btnSubmitVal.classList.remove('success-pop'), 300);

    advanceStep();
}
// ---- AVANÇAR AL SEGÜENT PAS ----
function advanceStep() {
    const step = steps[currentStepIndex];

    const isFinal = currentStepIndex === steps.length - 1;
    if (pissarra) {
        // La línia nova s'anima; mentre baixen els termes, la línia de treball s'amaga i el pas
        // següent surt quan l'animació s'acaba
        const darrera = historia[historia.length - 1];
        if (darrera.classe === 'eq-latest') darrera.classe = '';
        historia.push({
            left: step.dispLeftAfter,
            right: step.dispRightAfter,
            inv: false,
            classe: isFinal ? 'eq-solved' : 'eq-latest',
            pas: step,
        });
        els.stepValue.classList.remove('active');
        if (els.valueInput) els.valueInput.value = '';
        hideCustomKeyboard();
        els.stepHint.style.display = 'none';
        currentStepIndex++;
        pintaHistoria(true).then(() => {
            if (!state.isTransitioning) showCurrentStep();
        });
        return;
    }
    addEquationToHistory(step.dispLeftAfter, step.dispRightAfter, isFinal ? 'eq-solved' : 'eq-latest');

    els.stepValue.classList.remove('active');
    if (els.valueInput) els.valueInput.value = '';
    hideCustomKeyboard();

    currentStepIndex++;

    setTimeout(() => {
        showCurrentStep();
    }, 500);
}

// ---- FINALITZAR EQUACIÓ I AVANÇAR ----
function finishEquation(levelPoints) {
    recordResult(levelPoints > 0 ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4);
    state.isTransitioning = true;
    if (typeof hideCustomKeyboard === 'function') hideCustomKeyboard();
    els.resolutionPanel.style.display = 'none';
    els.stepHint.style.display = 'none';

    // Sumem els punts a la variable global i actualitzem marcador
    state.sessionScore += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;

    // Mostrem l'overlay de "Molt bé" o "Intents esgotats"
    const waitTime =
        typeof showMiniOverlay === 'function'
            ? showMiniOverlay(levelPoints, { successColor: 'var(--primary-dark)', pointsColor: 'var(--success)' })
            : 1500;

    // Passem a la següent equació o acabem la sessió
    setTimeout(() => {
        if (typeof hideMiniOverlay === 'function') hideMiniOverlay();

        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            if (typeof endSession === 'function') endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

// ---- TECLAT FÍSIC ----
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        // Només interceptem l'Enter quan estem efectivament actius al pas de valor.
        if (els.gameScreen.style.display !== 'none' && els.stepValue.classList.contains('active')) {
            e.preventDefault();
            if (!state.isTransitioning) checkValue();
        }
    }
});

// ---- checkCurrentCell: alias que game-core crida en prémer → del teclat custom ----
function checkCurrentCell() {
    checkValue();
}

// ---- ARRENCADA ----
injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true });
startGame();
