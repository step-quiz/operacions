/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/mcd-mcm/mcd-mcm.js
 * ROL: Joc «MCD i mcm» (mcd-mcm.html). Abans era dins de l'HTML. Notació: MCD i mcm a tot arreu
 *      (decisió del David, 28/11/2026).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, game-core.js, config.js i
 *      math-engine.js (la parella, el MCD i el mcm, compartits amb la resolució pas a pas) i
 *      factoritzar/math-engine.js (la descomposició).
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt } from '../utils.js';
import { primeFactorization } from '../factoritzar/math-engine.js';
import { computeMCD, computeMCM, generatePair } from './math-engine.js';
import {
    state,
    hideCustomKeyboard,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    recordResult,
    showCustomKeyboard,
    startGame,
    validateConfig,
    acabaPregunta,
    puntsDeLaPregunta,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { checkMcdMcm, buildLevel, checkCurrentCell });

// ============================================================
// DOM
// ============================================================
const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    phaseDisplay: document.getElementById('phase-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    phaseBanner: document.getElementById('phase-banner'),
    phaseBannerTitle: document.getElementById('phase-banner-title'),
    phaseBannerText: document.getElementById('phase-banner-text'),
    mcdMcmZone: document.getElementById('mcd-mcm-zone'),
    resolutionPanel: document.getElementById('resolution-panel'),
    stepInstruction: document.getElementById('step-instruction'),
    inputZone: document.getElementById('input-zone'),
    errorMsg: document.getElementById('error-msg'),
    miraCom: document.getElementById('mira-com'), // «Mira com es resol» (resolucio.html)
};

// ============================================================
// ESTAT ESPECÍFIC DEL JOC
// ============================================================
let isPenalizing = false;
let currentPhase = 'mcd';
let numberA = 0,
    numberB = 0;
let factorsA = {},
    factorsB = {};
let mcdValue = 0,
    mcmValue = 0;

// ============================================================
// MATEMÀTIQUES
// ============================================================
// primeFactorization: factoritzar/math-engine.js; computeMCD, computeMCM i generatePair: math-engine.js

function formatFactorization(n, factors) {
    const primes = Object.keys(factors)
        .map(Number)
        .sort((a, b) => a - b);
    return (
        `<strong>${n}</strong> = ` +
        primes.map(p => (factors[p] === 1 ? `${p}` : `${p}<sup>${factors[p]}</sup>`)).join(' · ')
    );
}

// ============================================================
// FLUX DEL JOC
// ============================================================
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    isPenalizing = false;

    const [a, b] = generatePair(state.currentOperation);
    numberA = a;
    numberB = b;
    factorsA = primeFactorization(a);
    factorsB = primeFactorization(b);
    mcdValue = computeMCD(factorsA, factorsB);
    mcmValue = computeMCM(factorsA, factorsB);
    // «Mira com es resol»: el nivell de la resolució pas a pas amb els mateixos primers (1: 2, 3 i 5; 2: també el 7;
    // 3: també l'11 i el 13), segons la pregunta, com generatePair
    if (els.miraCom) {
        const nivell = Math.min(state.currentOperation, 2) + 1;
        els.miraCom.href = `resolucio.html?activitat=mcd-mcm&nivell=${nivell}`;
    }

    currentPhase = 'mcd';
    startPhase();
}

function startPhase() {
    els.resolutionPanel.style.display = 'none';
    els.errorMsg.textContent = '';
    els.phaseBanner.style.display = 'none';
    if (currentPhase === 'mcd') {
        // Pregunta nova: buida la zona del MCD i el mcm de la pregunta anterior
        els.mcdMcmZone.innerHTML = '';
        els.mcdMcmZone.style.display = 'none';
    }
    updateHeader();

    if (currentPhase === 'mcd') {
        els.phaseBanner.style.display = 'block';
        els.phaseBannerTitle.textContent = '🔗 Màxim Comú Divisor';
        els.phaseBannerText.textContent = `Calcula el MCD de ${numberA} i ${numberB}`;
        setTimeout(() => {
            els.phaseBanner.style.display = 'none';
            startMcdMcm('mcd');
        }, 1500);
    } else if (currentPhase === 'mcm') {
        els.phaseBanner.style.display = 'block';
        els.phaseBannerTitle.textContent = '🔗 Mínim Comú Múltiple';
        els.phaseBannerText.textContent = `Calcula el mcm de ${numberA} i ${numberB}`;
        setTimeout(() => {
            els.phaseBanner.style.display = 'none';
            startMcdMcm('mcm');
        }, 1500);
    }
}

function advancePhase() {
    if (currentPhase === 'mcd') {
        currentPhase = 'mcm';
        startPhase();
    } else if (currentPhase === 'mcm') {
        finishExercise(puntsDeLaPregunta());
    }
}

function startMcdMcm(type) {
    els.mcdMcmZone.style.display = 'block';
    const label = type === 'mcd' ? 'MCD' : 'mcm';
    const fullName = type === 'mcd' ? 'màxim comú divisor' : 'mínim comú múltiple';
    const answer = type === 'mcd' ? mcdValue : mcmValue;

    // [CANVI 4] Guardem els valors actius per a checkCurrentCell
    _activeAnswer = answer;
    _activeLabel = label;

    els.mcdMcmZone.innerHTML = `<div class="both-factorizations"><div class="fact-row row-a">${formatFactorization(numberA, factorsA)}</div><div class="fact-row row-b">${formatFactorization(numberB, factorsB)}</div></div>`;

    els.resolutionPanel.style.display = 'flex';
    els.stepInstruction.innerHTML = `Quin és el <span style="color: var(--accent); font-weight: bold;">${fullName}</span> de ${numberA} i ${numberB}?`;
    els.errorMsg.textContent = '';
    // [CANVI 2] type="text" en lloc de type="number" (evita teclat natiu en mòbil)
    els.inputZone.innerHTML = `<div class="input-row"><input type="text" class="factor-input" id="mcd-mcm-input" autocomplete="off" aria-label="${label}"><button class="btn-submit" id="btn-mcd-mcm-submit" onclick="checkMcdMcm(${answer}, '${label}')">OK</button></div>`;

    // [CANVI 3] Focus condicional: teclat custom en tàctil, focus natiu en escriptori
    const inp = document.getElementById('mcd-mcm-input');
    if (isTouchDevice()) {
        showCustomKeyboard(inp);
    } else {
        inp.focus();
    }
}

function checkMcdMcm(answer, label) {
    if (state.isTransitioning || isPenalizing) return;
    const input = document.getElementById('mcd-mcm-input');
    const rawValue = input.value.trim();

    if (rawValue === '') {
        showError('Introdueix un nombre');
        return;
    }

    const userVal = parseStrictInt(rawValue);
    if (isNaN(userVal)) {
        showError('Introdueix un nombre vàlid');
        return;
    }

    if (userVal !== answer) {
        showError(`${userVal} no és el resultat correcte. Torna-ho a intentar.`);
        penalize();
        if (state.attemptsLeft > 0) {
            input.value = '';
            input.focus();
        }
        return;
    }

    els.errorMsg.textContent = '';
    hideCustomKeyboard(); // [CANVI 5] Tanca el teclat custom en encertar
    els.resolutionPanel.style.display = 'none';

    if (label === 'mcm') {
        els.phaseDisplay.innerHTML = `🔗 MCD(${numberA}, ${numberB}) = ${mcdValue}<br>🔗 mcm(${numberA}, ${numberB}) = ${mcmValue}`;
    }

    const resultDiv = document.createElement('div');
    resultDiv.className = 'factorization-display';
    // MCD amb el color del tema, mcm amb el segon to (el verd és només per als encerts)
    resultDiv.style.background = label === 'MCD' ? 'var(--primary-light)' : 'var(--accent-light)';
    resultDiv.style.color = label === 'MCD' ? 'var(--primary-dark)' : 'var(--accent-dark)';
    resultDiv.innerHTML = `✅ ${label}(${numberA}, ${numberB}) = <strong>${answer}</strong>`;
    els.mcdMcmZone.appendChild(resultDiv);

    setTimeout(() => advancePhase(), 1200);
}

function finishExercise(levelPoints) {
    recordResult(levelPoints > 0 ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4);
    // El MCD i el mcm calculats es queden a la vista fins que l'alumne prem «Següent»
    els.resolutionPanel.style.display = 'none';
    els.phaseBanner.style.display = 'none';
    acabaPregunta(levelPoints);
}

// ============================================================
// PENALITZACIÓ (amb guarda anti-clics ràpids)
// ============================================================
function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink-error');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink-error');
        state.attemptsLeft--;
        isPenalizing = false;
        updateHeader();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            els.resolutionPanel.style.display = 'none';
            finishExercise(0);
        }
    }, 1000);
}

function showError(msg) {
    els.errorMsg.textContent = msg;
    const btn = els.inputZone.querySelector('.btn-submit');
    if (btn) {
        btn.classList.add('error-shake');
        setTimeout(() => btn.classList.remove('error-shake'), 200);
    }
}

// ============================================================
// ACTUALITZACIÓ UI
// ============================================================
function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Exercici ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft < 3 ? ' danger' : '');
    els.phaseDisplay.innerHTML =
        currentPhase === 'mcd'
            ? `🔗 MCD(${numberA}, ${numberB})`
            : `🔗 MCD(${numberA}, ${numberB}) = ${mcdValue}<br>🔗 mcm(${numberA}, ${numberB}) = ?`;
}

// ============================================================
// TECLAT
// ============================================================
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !state.isTransitioning && !isPenalizing && els.gameScreen.style.display !== 'none') {
        const mcdMcmBtn = document.getElementById('btn-mcd-mcm-submit');
        if (mcdMcmBtn) mcdMcmBtn.click();
    }
});

// ============================================================
// TECLAT CUSTOM — variables d'estat i checkCurrentCell
// ============================================================
// [CANVI 4] Variables que guarden quin MCD/mcm s'està demanant ara
let _activeAnswer = 0;
let _activeLabel = '';

// [CANVI 4] Botó → del teclat custom crida sempre checkCurrentCell
function checkCurrentCell() {
    if (_activeAnswer !== 0) checkMcdMcm(_activeAnswer, _activeLabel);
}

// ============================================================
// ARRENCADA
// ============================================================
injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false }); // [CANVI 1] Inicialitza listeners del teclat custom
startGame();
