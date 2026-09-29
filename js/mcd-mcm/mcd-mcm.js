/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/mcd-mcm/mcd-mcm.js
 * ROL: Joc «MCD i MCM» (mcd-mcm.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, game-core.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt, randInt } from '../utils.js';
import {
    state,
    endSession,
    hideCustomKeyboard,
    hideMiniOverlay,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    recordResult,
    showCustomKeyboard,
    showMiniOverlay,
    startGame,
    validateConfig,
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
};

const bgColors_override = [
    '#fef7ed',
    '#fefce8',
    '#fdf4ff',
    '#f0fdf4',
    '#fff1f2',
    '#ecfeff',
    '#eff6ff',
    '#faf5ff',
    '#fffbeb',
    '#f5f3ff',
];

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
function primeFactorization(n) {
    const factors = {};
    let d = 2;
    while (d * d <= n) {
        while (n % d === 0) {
            factors[d] = (factors[d] || 0) + 1;
            n /= d;
        }
        d++;
    }
    if (n > 1) factors[n] = (factors[n] || 0) + 1;
    return factors;
}

function computeMCD(fa, fb) {
    let result = 1;
    for (const p in fa) {
        if (fb[p]) result *= Math.pow(parseInt(p), Math.min(fa[p], fb[p]));
    }
    return result;
}

function computeMCM(fa, fb) {
    const allPrimes = new Set([...Object.keys(fa), ...Object.keys(fb)]);
    let result = 1;
    for (const p of allPrimes) {
        result *= Math.pow(parseInt(p), Math.max(fa[p] || 0, fb[p] || 0));
    }
    return result;
}

function formatFactorization(n, factors) {
    const primes = Object.keys(factors)
        .map(Number)
        .sort((a, b) => a - b);
    return (
        `<strong>${n}</strong> = ` +
        primes.map(p => (factors[p] === 1 ? `${p}` : `${p}<sup>${factors[p]}</sup>`)).join(' · ')
    );
}

function generatePair(opIndex) {
    const primePools = [
        [2, 3, 5],
        [2, 3, 5, 7],
        [2, 3, 5, 7, 11],
    ];
    const difficulty = Math.min(opIndex, primePools.length - 1);
    const pool = primePools[difficulty];

    function makeNumber(minFactors, maxFactors) {
        const numFactors = randInt(minFactors, maxFactors);
        let n = 1;
        for (let i = 0; i < numFactors; i++) n *= pool[randInt(0, Math.min(pool.length - 1, difficulty + 2))];
        if (n < 6) n *= pool[randInt(0, 1)];
        if (n > 150) return makeNumber(minFactors, maxFactors);
        return n;
    }

    const allowCoprime = Math.random() < 0.15;
    const maxMcm = allowCoprime ? 500 : 300;
    let attempts = 0,
        a,
        b,
        fa,
        fb,
        mcm,
        mcd;
    do {
        a = makeNumber(2, 3 + Math.min(difficulty, 1));
        b = makeNumber(2, 3 + Math.min(difficulty, 1));
        fa = primeFactorization(a);
        fb = primeFactorization(b);
        mcd = computeMCD(fa, fb);
        mcm = computeMCM(fa, fb);
        attempts++;
        if (attempts > 200) break;
    } while (b === a || mcm > maxMcm || (allowCoprime ? mcd !== 1 : mcd === 1));
    return [a, b];
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

    els.body.style.backgroundColor =
        bgColors_override[
            (state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors_override.length
        ];
    currentPhase = 'mcd';
    startPhase();
}

function startPhase() {
    els.resolutionPanel.style.display = 'none';
    els.errorMsg.textContent = '';
    els.phaseBanner.style.display = 'none';
    if (currentPhase === 'mcd') els.mcdMcmZone.innerHTML = '';
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
        els.phaseBannerText.textContent = `Calcula el MCM de ${numberA} i ${numberB}`;
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
        finishExercise(Math.max(0, 10 - (MAX_INTENTS - state.attemptsLeft)));
    }
}

function startMcdMcm(type) {
    els.mcdMcmZone.style.display = 'block';
    const label = type === 'mcd' ? 'MCD' : 'MCM';
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

    if (label === 'MCM') {
        els.phaseDisplay.innerHTML = `🔗 MCD(${numberA}, ${numberB}) = ${mcdValue}<br>🔗 MCM(${numberA}, ${numberB}) = ${mcmValue}`;
    }

    const resultDiv = document.createElement('div');
    resultDiv.className = 'factorization-display';
    resultDiv.style.background = label === 'MCD' ? 'var(--success-light)' : 'var(--accent-light)';
    resultDiv.style.color = label === 'MCD' ? '#065f46' : '#5b21b6';
    resultDiv.innerHTML = `✅ ${label}(${numberA}, ${numberB}) = <strong>${answer}</strong>`;
    els.mcdMcmZone.appendChild(resultDiv);

    setTimeout(() => advancePhase(), 1200);
}

function finishExercise(levelPoints) {
    recordResult(levelPoints > 0 ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4);
    state.isTransitioning = true;
    hideCustomKeyboard(); // [CANVI 5] Tanca el teclat custom en finalitzar
    els.resolutionPanel.style.display = 'none';
    els.mcdMcmZone.style.display = 'none';
    els.phaseBanner.style.display = 'none';

    state.sessionScore += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;

    const waitTime = showMiniOverlay(levelPoints, { successColor: 'var(--primary-dark)' });
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
            : `🔗 MCD(${numberA}, ${numberB}) = ${mcdValue}<br>🔗 MCM(${numberA}, ${numberB}) = ?`;
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
// [CANVI 4] Variables que guarden quin MCD/MCM s'està demanant ara
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
