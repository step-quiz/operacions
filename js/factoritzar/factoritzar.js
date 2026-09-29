/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/factoritzar/factoritzar.js
 * ROL: Joc «Descomposició Factorial» (factoritzar.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, game-core.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt, randInt } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    hideCustomKeyboard,
    hideMiniOverlay,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    recordAnswerToHistory,
    recordResult,
    showCustomKeyboard,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { checkFactors, buildLevel, checkCurrentCell });

// ============================================================
// CODI ESPECÍFIC DE FACTORITZAR — el que NO és compartit
// ============================================================

// Cache DOM específic
const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    phaseBanner: document.getElementById('phase-banner'),
    phaseBannerTitle: document.getElementById('phase-banner-title'),
    phaseBannerText: document.getElementById('phase-banner-text'),
    treeContainer: document.getElementById('tree-container'),
    factResult: document.getElementById('factorization-result'),
    resolutionPanel: document.getElementById('resolution-panel'),
    stepCounter: document.getElementById('step-counter'),
    stepInstruction: document.getElementById('step-instruction'),
    inputZone: document.getElementById('input-zone'),
    errorMsg: document.getElementById('error-msg'),
};

// Estat específic de factoritzar
let numberA = 0;
let factorsA = {};
let currentTree = null;
let isPenalizing = false;

// ---- MATEMÀTIQUES ----
function isPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

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

function formatFactorization(n, factors) {
    const primes = Object.keys(factors)
        .map(Number)
        .sort((a, b) => a - b);
    return (
        `<strong>${n}</strong> = ` +
        primes.map(p => (factors[p] === 1 ? `${p}` : `${p}<sup>${factors[p]}</sup>`)).join(' · ')
    );
}

// ---- GENERACIÓ DE NOMBRES ----
function generateNumber(opIndex) {
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
        for (let i = 0; i < numFactors; i++) {
            n *= pool[randInt(0, Math.min(pool.length - 1, difficulty + 2))];
        }
        if (n < 6) n *= pool[randInt(0, 1)];
        if (n > 150) return makeNumber(minFactors, maxFactors);
        return n;
    }
    return makeNumber(2, 3 + Math.min(difficulty, 1));
}

// ---- ARBRE DE FACTORS ----
function createNode(value) {
    return {
        value: value,
        isPrime: isPrime(value),
        children: null,
        id: 'node_' + Math.random().toString(36).substr(2, 6),
    };
}

function getPendingNodes(node) {
    if (!node) return [];
    if (!node.children && !node.isPrime) return [node];
    if (!node.children) return [];
    return [...getPendingNodes(node.children[0]), ...getPendingNodes(node.children[1])];
}

function renderTree(node, activeNodeId, isComplete, isRoot) {
    if (!node) return '';
    let nodeClass = 'node-value';
    if (isComplete) {
        if (isRoot && node.children) nodeClass += ' decomposed';
        else if (node.isPrime && !node.children) nodeClass += ' prime';
        else if (node.children) nodeClass += ' decomposed';
    } else {
        if (node.isPrime && !node.children) nodeClass += ' prime-done';
        else if (node.id === activeNodeId) nodeClass += ' active';
        else if (node.children) nodeClass += ' decomposed';
    }
    let html = `<div class="tree-node"><div class="${nodeClass}" data-id="${node.id}">${node.value}</div>`;
    if (node.children) {
        html += `<div class="node-children">${renderTree(node.children[0], activeNodeId, isComplete, false)}<div class="split-symbol">·</div>${renderTree(node.children[1], activeNodeId, isComplete, false)}</div>`;
    }
    html += `</div>`;
    return html;
}

function renderCurrentTree() {
    const pending = getPendingNodes(currentTree);
    els.treeContainer.innerHTML = renderTree(
        currentTree,
        pending.length > 0 ? pending[0].id : null,
        pending.length === 0,
        true
    );
}

// ---- BUILD LEVEL (cridat per game-core) ----
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;

    numberA = generateNumber(state.currentOperation);
    factorsA = primeFactorization(numberA);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    startPhase();
}

function startPhase() {
    els.treeContainer.innerHTML = '';
    els.factResult.style.display = 'none';
    els.factResult.innerHTML = '';
    els.resolutionPanel.style.display = 'none';
    els.errorMsg.textContent = '';
    els.phaseBanner.style.display = 'none';
    updateHeader();

    els.phaseBanner.style.display = 'block';
    els.phaseBannerTitle.textContent = '🌳 Descomposició factorial';
    els.phaseBannerText.textContent = 'en factors primers';
    setTimeout(() => {
        els.phaseBanner.style.display = 'none';
        startFactorTree(numberA);
    }, 1250);
}

function startFactorTree(number) {
    currentTree = createNode(number);
    if (currentTree.isPrime) {
        renderCurrentTree();
        showFactorizationResult(number);
        setTimeout(() => advancePhase(), 1200);
        return;
    }
    renderCurrentTree();
    showFactorInput();
}

function showFactorInput() {
    const pending = getPendingNodes(currentTree);
    if (pending.length === 0) {
        showFactorizationResult(numberA);
        setTimeout(() => advancePhase(), 1500);
        return;
    }

    els.resolutionPanel.style.display = 'flex';
    els.stepInstruction.innerHTML = `Descompon <strong>${pending[0].value}</strong> en dos factors majors que 1`;
    els.errorMsg.textContent = '';

    els.inputZone.innerHTML = `
            <div class="input-row">
                <input type="text" class="factor-input" id="factor-a-input" autocomplete="off" inputmode="none" placeholder="?">
                <span class="input-multiply">·</span>
                <input type="text" class="factor-input" id="factor-b-input" autocomplete="off" inputmode="none" placeholder="?">
                <span class="input-equals">=</span>
                <span class="input-target">${pending[0].value}</span>
            </div>
            <button class="btn-submit" id="btn-factor-submit" onclick="checkFactors()">OK</button>`;

    const inpA = document.getElementById('factor-a-input');
    const inpB = document.getElementById('factor-b-input');

    // CONTROL DE VISIBILITAT: Només obrim el teclat custom automàticament si és TÀCTIL
    if (isTouchDevice()) {
        setTimeout(() => {
            showCustomKeyboard(inpA); // Obre el teclat custom al mòbil
        }, 50);
    } else {
        // A PC, simplement fem focus normal i el teclat custom es queda amagat
        hideCustomKeyboard();
        inpA.focus();
    }

    // NAVEGACIÓ LLIURE: Si l'usuari clica/toca un input, ens assegurem que el teclat custom l'apunti
    [inpA, inpB].forEach(el => {
        el.addEventListener('focus', () => {
            if (isTouchDevice()) showCustomKeyboard(el);
        });
    });
}

// ---- COMPROVAR FACTORS ----
// ---- COMPROVAR FACTORS ----
function checkFactors() {
    if (state.isTransitioning) return;

    const inpA = document.getElementById('factor-a-input');
    const inpB = document.getElementById('factor-b-input');
    if (!inpA || !inpB) return;

    const a = parseStrictInt(inpA.value);
    const b = parseStrictInt(inpB.value);

    const pending = getPendingNodes(currentTree);
    if (pending.length === 0) return;

    // --- ACCIÓ DE NETEJA: Torna a posar l'usuari a la primera casella ---
    const resetInputs = () => {
        if (state.attemptsLeft > 0) {
            // El petit retard (100ms) evita bloquejos en mòbils en processar l'error
            setTimeout(() => {
                inpA.value = '';
                inpB.value = '';
                if (isTouchDevice()) {
                    showCustomKeyboard(inpA); // Força l'obertura del teclat custom a la casella A
                }
                inpA.focus(); // Posa el cursor visible a la casella A (tant a PC com a mòbil)
            }, 100);
        }
    };

    // 1. Validació: Si està buit o no és un número
    if (isNaN(a) || isNaN(b)) {
        showError('Introdueix dos nombres');
        resetInputs();
        return;
    }

    // 2. Validació: Si l'usuari posa un 1 (ex: 1 · 9)
    if (a < 2 || b < 2) {
        showError('Tots dos factors han de ser majors que 1');
        penalize();
        resetInputs();
        return;
    }

    // Generem la pregunta i resposta per a l'informe d'historial
    const stepQuestion = 'Factors de ' + pending[0].value;
    const userAnswer = a + ' · ' + b;

    // 3. Validació: Si s'equivoquen al multiplicar
    if (a * b !== pending[0].value) {
        showError(`${a} · ${b} = ${a * b}, però ha de ser ${pending[0].value}`);

        // Guardem l'error a l'historial
        if (typeof recordAnswerToHistory === 'function') {
            recordAnswerToHistory(stepQuestion, userAnswer, false);
        }

        penalize();
        resetInputs();
        return;
    }

    // 🟢 Guardem l'encert a l'historial
    if (typeof recordAnswerToHistory === 'function') {
        recordAnswerToHistory(stepQuestion, userAnswer, true);
    }

    // Si tot és correcte: netejem errors, amaguem teclat i avancem l'arbre
    els.errorMsg.textContent = '';
    hideCustomKeyboard();
    pending[0].children = [createNode(a), createNode(b)];
    renderCurrentTree();
    setTimeout(() => showFactorInput(), 400);
}
function showFactorizationResult(number) {
    els.resolutionPanel.style.display = 'none';
    hideCustomKeyboard();
    const div = document.createElement('div');
    div.className = 'factorization-display';
    div.innerHTML = '✅ ' + formatFactorization(number, factorsA);
    els.factResult.innerHTML = '';
    els.factResult.appendChild(div);
    els.factResult.style.display = 'block';
}

function advancePhase() {
    finishExercise(Math.max(0, 10 - (MAX_INTENTS - state.attemptsLeft)));
}

// ---- FINALITZAR EXERCICI ----
function finishExercise(levelPoints) {
    recordResult(levelPoints > 0 ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4);
    state.isTransitioning = true;
    if (typeof hideCustomKeyboard === 'function') hideCustomKeyboard();
    els.resolutionPanel.style.display = 'none';
    els.treeContainer.innerHTML = '';
    els.factResult.style.display = 'none';
    els.phaseBanner.style.display = 'none';

    // Sumem els punts a la variable global i actualitzem marcador
    state.sessionScore += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;

    // Mostrem l'overlay de "Molt bé" o "Intents esgotats"
    const waitTime =
        typeof showMiniOverlay === 'function'
            ? showMiniOverlay(levelPoints, { successColor: 'var(--primary-dark)', pointsColor: 'var(--success)' })
            : 1500;

    // Passem al següent exercici o acabem la sessió
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
// ---- PENALITZACIÓ ----
function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink-animation');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink-animation');
        state.attemptsLeft--;
        updateHeader();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            els.resolutionPanel.style.display = 'none';
            finishExercise(0);
        }
        isPenalizing = false;
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

function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Exercici ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft < 5 ? ' danger' : '');
}

// ---- TECLAT FÍSIC ----
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !state.isTransitioning && els.gameScreen.style.display !== 'none') {
        e.preventDefault();
        const factorBtn = document.getElementById('btn-factor-submit');
        if (factorBtn) checkFactors();
    }
    if (e.key === 'Tab') {
        const factA = document.getElementById('factor-a-input');
        const factB = document.getElementById('factor-b-input');
        if (factA && factB && document.activeElement === factA) {
            e.preventDefault();
            factB.focus();
        }
    }
});

// ---- checkCurrentCell: botó → del teclat custom ----
// Lògica intel·ligent: si input A ple i B buit → salta a B; sinó → checkFactors
function checkCurrentCell() {
    const inpA = document.getElementById('factor-a-input');
    const inpB = document.getElementById('factor-b-input');
    if (!inpA || !inpB) return;

    const aFull = inpA.value.trim() !== '';
    const bFull = inpB.value.trim() !== '';

    if (aFull && !bFull) {
        // Salta al segon input
        showCustomKeyboard(inpB);
    } else if (!aFull && bFull) {
        // Salta al primer input
        showCustomKeyboard(inpA);
    } else {
        // Tots dos plens (o tots dos buits) → intenta validar
        checkFactors();
    }
}

// ---- ARRENCADA ----
injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false, allowZero: true });
startGame();
