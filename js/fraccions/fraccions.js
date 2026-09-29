/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccions/fraccions.js
 * ROL: Joc «Operacions amb Fraccions» (fraccions.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa game-core.js, utils.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { randInt } from '../utils.js';
import {
    state,
    endSession,
    getKbActiveInput,
    hideCustomKeyboard,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbMarkForOverwrite,
    recordAnswerToHistory,
    recordResult,
    registerScreens,
    showCustomKeyboard,
    showScreen,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { selectMode, buildLevel, checkCurrentCell });

// ============================================================
// CODI ESPECÍFIC DE FRACCIONS — el que NO és compartit
// ============================================================

// Registrem totes les pantalles (incloent el menú)
registerScreens(['menu-screen', 'game-screen', 'session-end-screen', 'final-screen']);

// Cache DOM específic
const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    exprBox: document.getElementById('expression-box'),
    mainSubtitle: document.getElementById('main-subtitle'),
};

// Estat específic de fraccions
let currentMode = '';
let currentLevelSelection = 3;
let n1, d1, n2, d2, op;
let userDen = 0,
    userNum1 = 0,
    userNum2 = 0;
let unsimpResN = 0,
    unsimpResD = 0;
let finalResN = 0,
    finalResD = 0;
let isPenalizing = false;

// ---- MENÚ DE SELECCIÓ ----
function selectMode(mode) {
    currentMode = mode;
    if (mode === 'addsub') {
        currentLevelSelection = parseInt(document.getElementById('addsub-level').value);
        els.mainSubtitle.innerText = 'Suma o resta de fraccions pas a pas';
    } else {
        els.mainSubtitle.innerText = 'Producte o divisió de fraccions pas a pas';
    }
    startGame();
}

// ---- UTILITATS MATEMÀTIQUES ----
function getMCD(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function getMCM(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / getMCD(a, b);
}

function isIrreducibleRequired() {
    const cb = document.getElementById('irreducible-toggle');
    return cb ? cb.checked : true;
}

function getIrreducible() {
    let n, d;
    do {
        n = randInt(1, 9);
        d = randInt(2, 9);
    } while (getMCD(n, d) !== 1);
    return { n, d };
}

// ---- GENERACIÓ DE PROBLEMES ----
function generateProblem() {
    let found = false;

    while (!found) {
        let f1 = getIrreducible();
        let f2 = getIrreducible();
        n1 = f1.n;
        d1 = f1.d;
        n2 = f2.n;
        d2 = f2.d;

        if (currentMode === 'addsub') {
            if (currentLevelSelection === 1) {
                d2 = d1;
                found = true;
            } else if (currentLevelSelection === 2) {
                let mult = randInt(2, 4);
                if (Math.random() > 0.5) d2 = d1 * mult;
                else d1 = d2 * mult;
                if (d1 <= 30 && d2 <= 30 && d1 !== d2) found = true;
            } else {
                let mcm = getMCM(d1, d2);
                if (mcm !== d1 && mcm !== d2 && d1 !== d2) found = true;
            }
        } else {
            found = true;
        }
    }

    if (currentMode === 'addsub') {
        op = Math.random() > 0.5 ? '+' : '-';
        if (op === '-' && n1 / d1 < n2 / d2) {
            let tn = n1,
                td = d1;
            n1 = n2;
            d1 = d2;
            n2 = tn;
            d2 = td;
        }
        let tn1 = n1 * (getMCM(d1, d2) / d1),
            tn2 = n2 * (getMCM(d1, d2) / d2),
            td = getMCM(d1, d2);
        let resN = op === '+' ? tn1 + tn2 : tn1 - tn2;
        let mcd = getMCD(resN, td);
        finalResN = resN / mcd;
        finalResD = td / mcd;
    } else {
        op = Math.random() > 0.5 ? '·' : ':';
        if (op === '·') {
            unsimpResN = n1 * n2;
            unsimpResD = d1 * d2;
        } else {
            unsimpResN = n1 * d2;
            unsimpResD = d1 * n2;
        }
        let mcd = getMCD(unsimpResN, unsimpResD);
        finalResN = unsimpResN / mcd;
        finalResD = unsimpResD / mcd;
    }
}

// ---- FORMAT ----
function formatFraction(n, d) {
    if (d === 1) return `<span class="math-cell integer-val">${n}</span>`;
    return `<div class="fraction"><span class="math-cell">${n}</span><hr><span class="math-cell">${d}</span></div>`;
}

function appendToExpression(htmlContent) {
    let line = document.createElement('div');
    line.className = 'expr-line';
    line.style.animation = 'fadeIn 0.5s ease-out';
    line.innerHTML = htmlContent;
    els.exprBox.appendChild(line);
}

function resetWarnings() {
    document.querySelectorAll('.warn-msg').forEach(msg => (msg.style.display = 'none'));
}

// ---- GESTIÓ DE PASSOS ----
function showStep(id) {
    document.querySelectorAll('.step-container').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        const inputs = Array.from(target.querySelectorAll('input[type="text"].math-cell'));
        const firstVisibleInput = inputs.find(inp => inp.offsetParent !== null);

        if (firstVisibleInput) {
            firstVisibleInput.value = '';

            // [CANVIS 1+3] Unificada detecció tàctil a isTouchDevice(); eliminada crida a registerKbInput inexistent
            if (isTouchDevice()) {
                showCustomKeyboard(firstVisibleInput);
            } else {
                setTimeout(() => {
                    firstVisibleInput.focus();
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
        }
    }
}

// ---- UI ----
function updateUI() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Operació ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';
    if (state.attemptsLeft <= 1) els.attemptsDisplay.classList.add('danger');
}

// ---- BUILD LEVEL (cridat per game-core) ----
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    resetWarnings();

    generateProblem();

    els.exprBox.innerHTML = `
            <div class="expr-line">
                ${formatFraction(n1, d1)}
                <span class="operator">${op}</span>
                ${formatFraction(n2, d2)}
                <span class="operator">=</span>
            </div>
        `;

    updateUI();
    document.querySelectorAll('input[type="text"].math-cell').forEach(inp => (inp.value = ''));

    if (currentMode === 'addsub') {
        if (d1 === d2) {
            userDen = d1;
            userNum1 = n1;
            userNum2 = n2;
            showStep('step-3');
        } else {
            const step1Title = document.querySelector('#step-1 .step-title');
            if (step1Title) {
                if (currentLevelSelection === 2 || currentLevelSelection === 3) {
                    step1Title.innerText = `Escriu un múltiple comú dels denominadors ${d1} i ${d2}`;
                } else {
                    step1Title.innerText = 'Escriu un denominador comú';
                }
            }
            showStep('step-1');
        }
    } else {
        if (op === ':') {
            document.getElementById('md-s1-f1').innerHTML = formatFraction(n1, d1);
            showStep('step-md-1');
        } else {
            showStep('step-md-2');
        }
    }
}

// ---- PENALITZACIÓ ----
function processFailure() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    if (typeof recordAnswerToHistory === 'function') {
        recordAnswerToHistory('Problema de fraccions (Mode: ' + currentMode + ')', 'Incorrecte', false);
    }
    const attemptsEl = document.getElementById('attempts-display');
    attemptsEl.classList.add('blink');
    setTimeout(() => {
        attemptsEl.classList.remove('blink');
        state.attemptsLeft--;
        updateUI();

        const activeStep = document.querySelector('.step-container.active');
        if (activeStep) {
            let btn = activeStep.querySelector('.step-btn');
            if (btn) {
                btn.classList.add('error-shake');
                setTimeout(() => btn.classList.remove('error-shake'), 150);
            }
        }

        if (state.attemptsLeft <= 0) {
            triggerMiniVictory(false, 0);
        } else if (activeStep) {
            const inpts = activeStep.querySelectorAll('input');
            if (inpts.length > 0) {
                if (isTouchDevice()) {
                    kbMarkForOverwrite(inpts[0]);
                } else {
                    inpts[0].select();
                }
            }
        }
        isPenalizing = false;
    }, 1000);
}
// ---- COMPROVAR VALOR ----
function checkValue() {
    if (state.isTransitioning || isPenalizing) return; // [CANVI 4] Afegit guard isPenalizing
    const activeStep = document.querySelector('.step-container.active');
    if (!activeStep) return;
    const stepId = activeStep.id;

    if (stepId === 'step-1') {
        let ansD = parseInt(document.getElementById('s1-den').value, 10);
        if (isNaN(ansD)) return;
        if (ansD > 0 && ansD % d1 === 0 && ansD % d2 === 0) {
            userDen = ansD;
            document.getElementById('s2-orig-n1').innerText = n1;
            document.getElementById('s2-orig-d1').innerText = d1;
            document.getElementById('s2-d1-text').innerText = userDen;
            document.getElementById('s2-orig-n2').innerText = n2;
            document.getElementById('s2-orig-d2').innerText = d2;
            document.getElementById('s2-d2-text').innerText = userDen;

            const row1 = document.getElementById('s2-row-1');
            const row2 = document.getElementById('s2-row-2');
            if (row1 && row2) {
                row1.style.display = 'flex';
                row2.style.display = 'flex';
                if (userDen === d1) {
                    row1.style.display = 'none';
                    document.getElementById('s2-f1-top').value = 1;
                    document.getElementById('s2-f1-bot').value = 1;
                    document.getElementById('s2-n1').value = n1;
                }
                if (userDen === d2) {
                    row2.style.display = 'none';
                    document.getElementById('s2-f2-top').value = 1;
                    document.getElementById('s2-f2-bot').value = 1;
                    document.getElementById('s2-n2').value = n2;
                }
            }
            hideCustomKeyboard();
            showStep('step-2');
        } else {
            processFailure();
        }
    } else if (stepId === 'step-2') {
        let expectedF1 = userDen / d1,
            expectedF2 = userDen / d2;
        let skipF1 = expectedF1 === 1,
            skipF2 = expectedF2 === 1;
        let ok1 = true,
            ok2 = true;

        if (!skipF1) {
            let inF1Top = parseInt(document.getElementById('s2-f1-top').value, 10);
            let inF1Bot = parseInt(document.getElementById('s2-f1-bot').value, 10);
            let inN1 = parseInt(document.getElementById('s2-n1').value, 10);
            if (isNaN(inF1Top) || isNaN(inF1Bot) || isNaN(inN1)) return;
            ok1 = inF1Top === expectedF1 && inF1Bot === expectedF1 && inN1 === n1 * expectedF1;
            if (ok1) userNum1 = inN1;
        } else {
            userNum1 = n1;
        }

        if (!skipF2) {
            let inF2Top = parseInt(document.getElementById('s2-f2-top').value, 10);
            let inF2Bot = parseInt(document.getElementById('s2-f2-bot').value, 10);
            let inN2 = parseInt(document.getElementById('s2-n2').value, 10);
            if (isNaN(inF2Top) || isNaN(inF2Bot) || isNaN(inN2)) return;
            ok2 = inF2Top === expectedF2 && inF2Bot === expectedF2 && inN2 === n2 * expectedF2;
            if (ok2) userNum2 = inN2;
        } else {
            userNum2 = n2;
        }

        if (ok1 && ok2) {
            appendToExpression(`
                    <span class="operator">=</span>
                    ${formatFraction(userNum1, userDen)}
                    <span class="operator">${op}</span>
                    ${formatFraction(userNum2, userDen)}
                `);
            hideCustomKeyboard();
            showStep('step-3');
        } else {
            processFailure();
        }
    } else if (stepId === 'step-3') {
        let resN = parseInt(document.getElementById('s3-n').value, 10);
        let s3d_val = document.getElementById('s3-d').value.trim();
        let resD = s3d_val === '' ? 1 : parseInt(s3d_val, 10);
        if (isNaN(resN) || isNaN(resD)) return;

        let expectedResN = op === '+' ? userNum1 + userNum2 : userNum1 - userNum2;
        let requireIrred = isIrreducibleRequired();

        if (resN === expectedResN && resD === userDen) {
            unsimpResN = resN;
            unsimpResD = resD;
            appendToExpression(`<span class="operator">=</span>${formatFraction(unsimpResN, unsimpResD)}`);
            if (!requireIrred || getMCD(unsimpResN, unsimpResD) === 1) {
                finishSuccess();
            } else {
                hideCustomKeyboard();
                showStep('step-4');
            }
        } else if (resN === finalResN && resD === finalResD) {
            appendToExpression(`<span class="operator">=</span>${formatFraction(finalResN, finalResD)}`);
            finishSuccess();
        } else {
            processFailure();
        }
    } else if (stepId === 'step-4') {
        if (!isIrreducibleRequired()) {
            finishSuccess();
            return;
        }
        let simpN = parseInt(document.getElementById('s4-n').value, 10);
        let s4d_val = document.getElementById('s4-d').value.trim();
        let simpD = s4d_val === '' ? 1 : parseInt(s4d_val, 10);
        if (isNaN(simpN) || isNaN(simpD)) return;

        if (finalResD === 1) {
            if (simpN === finalResN) {
                appendToExpression(
                    `<span class="operator">=</span><span class="math-cell integer-val">${finalResN}</span>`
                );
                finishSuccess();
            } else {
                processFailure();
            }
            return;
        }

        if (simpN * finalResD === simpD * finalResN) {
            if (simpN === finalResN && simpD === finalResD) {
                appendToExpression(`<span class="operator">=</span>${formatFraction(finalResN, finalResD)}`);
                finishSuccess();
            } else {
                appendToExpression(`<span class="operator">=</span>${formatFraction(simpN, simpD)}`);
                document.getElementById('s4-n').value = '';
                document.getElementById('s4-d').value = '';
                if (isTouchDevice()) showCustomKeyboard(document.getElementById('s4-n'));
                else document.getElementById('s4-n').focus();
                activeStep.querySelector('.warn-msg').style.display = 'block';
            }
        } else {
            processFailure();
        }
    } else if (stepId === 'step-md-1') {
        let inN = parseInt(document.getElementById('md-s1-n').value, 10);
        let inD = parseInt(document.getElementById('md-s1-d').value, 10);
        if (isNaN(inN) || isNaN(inD)) return;

        if (inN === d2 && inD === n2) {
            let invHTML =
                n2 === 1
                    ? `<div class="fraction"><span class="math-cell">${d2}</span><hr><span class="math-cell">1</span></div>`
                    : formatFraction(d2, n2);
            appendToExpression(`
                    <span class="operator">=</span>
                    ${formatFraction(n1, d1)}
                    <span class="operator">·</span>
                    ${invHTML}
                `);
            hideCustomKeyboard();
            showStep('step-md-2');
        } else {
            processFailure();
        }
    } else if (stepId === 'step-md-2') {
        let resN = parseInt(document.getElementById('md-s2-n').value, 10);
        let s2d_val = document.getElementById('md-s2-d').value.trim();
        let resD = s2d_val === '' ? 1 : parseInt(s2d_val, 10);
        if (isNaN(resN) || isNaN(resD)) return;

        let requireIrred = isIrreducibleRequired();

        if (resN === unsimpResN && resD === unsimpResD) {
            appendToExpression(`<span class="operator">=</span>${formatFraction(unsimpResN, unsimpResD)}`);
            if (!requireIrred || getMCD(unsimpResN, unsimpResD) === 1) {
                finishSuccess();
            } else {
                hideCustomKeyboard();
                showStep('step-md-3');
            }
        } else if (resN === finalResN && resD === finalResD) {
            appendToExpression(`<span class="operator">=</span>${formatFraction(finalResN, finalResD)}`);
            finishSuccess();
        } else {
            processFailure();
        }
    } else if (stepId === 'step-md-3') {
        if (!isIrreducibleRequired()) {
            finishSuccess();
            return;
        }
        let simpN = parseInt(document.getElementById('md-s3-n').value, 10);
        let s3d_val = document.getElementById('md-s3-d').value.trim();
        let simpD = s3d_val === '' ? 1 : parseInt(s3d_val, 10);
        if (isNaN(simpN) || isNaN(simpD)) return;

        if (simpN * finalResD === simpD * finalResN) {
            if (simpN === finalResN && simpD === finalResD) {
                appendToExpression(`<span class="operator">=</span>${formatFraction(finalResN, finalResD)}`);
                finishSuccess();
            } else {
                appendToExpression(`<span class="operator">=</span>${formatFraction(simpN, simpD)}`);
                document.getElementById('md-s3-n').value = '';
                document.getElementById('md-s3-d').value = '';
                if (isTouchDevice()) showCustomKeyboard(document.getElementById('md-s3-n'));
                else document.getElementById('md-s3-n').focus();
                activeStep.querySelector('.warn-msg').style.display = 'block';
            }
        } else {
            processFailure();
        }
    }
}

// ---- FINALITZACIÓ ----
function finishSuccess() {
    // 🟢 CANVI PRO 3: Amaguem el teclat SEMPRE que l'alumne acaba l'exercici, abans de l'animació
    if (typeof hideCustomKeyboard === 'function') {
        hideCustomKeyboard();
    }

    if (typeof recordAnswerToHistory === 'function') {
        recordAnswerToHistory('Problema de fraccions (Mode: ' + currentMode + ')', 'Correcte', true);
    }

    const fails = MAX_INTENTS - state.attemptsLeft;
    const levelPoints = Math.max(0, 10 - fails);
    triggerMiniVictory(true, levelPoints);
}

function triggerMiniVictory(isSuccess, points) {
    recordResult(isSuccess ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4);
    state.isTransitioning = true;
    hideCustomKeyboard();
    document.querySelectorAll('.step-container').forEach(s => s.classList.remove('active'));

    if (isSuccess) state.sessionScore += points;

    const vicText = document.getElementById('mini-vic-text');
    const vicIcon = document.getElementById('mini-vic-icon');
    const vicPoints = document.getElementById('mini-vic-points');

    let waitTime = 1500;

    if (isSuccess) {
        vicText.innerText = 'Correcte!';
        vicText.style.color = 'var(--success)';
        vicIcon.innerText = '⭐';
        vicPoints.innerText = `+${points} punts`;
        vicPoints.style.color = 'var(--success)';
    } else {
        vicText.innerText = 'Sense intents!';
        vicText.style.color = 'var(--danger)';
        vicIcon.innerText = '❌';
        let formattedSol = finalResD === 1 ? finalResN : `${finalResN}/${finalResD}`;
        vicPoints.innerText = `Solució: ${formattedSol}`;
        vicPoints.style.color = 'var(--danger)';
        waitTime = 3500;
    }

    const overlay = document.getElementById('mini-victory-overlay');
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');

    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;

    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        state.isTransitioning = false;

        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

// ---- TECLAT FÍSIC ----
document.querySelectorAll('.step-btn').forEach(btn => btn.addEventListener('click', checkValue));

// 🟢 CORRECCIÓ PRO: Prevenir event.preventDefault() global i problemes d'accessibilitat al menú
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        // Només interceptem l'Enter quan estem efectivament a la pantalla de joc i en un pas actiu.
        if (els.gameScreen.style.display !== 'none') {
            const activeStep = document.querySelector('.step-container.active');
            if (activeStep) {
                e.preventDefault();
                if (!state.isTransitioning) checkValue();
            }
        }
    }
    // [FIX M3] Tab salta al següent input visible dins del pas actiu
    if (e.key === 'Tab') {
        const activeStep = document.querySelector('.step-container.active');
        if (!activeStep || els.gameScreen.style.display === 'none') return;
        const inputs = Array.from(activeStep.querySelectorAll('input[type="text"].math-cell')).filter(
            inp => inp.offsetParent !== null
        );
        if (inputs.length <= 1) return;
        const idx = inputs.indexOf(document.activeElement);
        if (idx === -1) return;
        const next = e.shiftKey ? inputs[(idx - 1 + inputs.length) % inputs.length] : inputs[(idx + 1) % inputs.length];
        e.preventDefault();
        if (isTouchDevice()) showCustomKeyboard(next);
        else next.focus();
    }
});
// ---- checkCurrentCell: botó → del teclat custom ----
// Lògica intel·ligent: salta al següent input buit visible dins del pas;
// si tots estan plens → valida.
function checkCurrentCell() {
    const activeStep = document.querySelector('.step-container.active');
    if (!activeStep) {
        checkValue();
        return;
    }

    const inputs = Array.from(activeStep.querySelectorAll('input[type="text"].math-cell')).filter(
        inp => inp.offsetParent !== null
    ); // només visibles
    if (inputs.length === 0) {
        checkValue();
        return;
    }

    // Busquem el primer input buit DESPRÉS de l'actiu
    const currentIdx = inputs.indexOf(getKbActiveInput());
    for (let i = 1; i <= inputs.length; i++) {
        const next = inputs[(currentIdx + i) % inputs.length];
        if (next.value.trim() === '') {
            showCustomKeyboard(next);
            return;
        }
    }
    // Tots plens → validem
    checkValue();
}

// ---- ARRENCADA: mostrem el menú (el joc s'inicia quan l'usuari tria mode) ----
injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true });

// [CANVI 2] Eliminat bloc redundant de detecció tàctil manual:
// showCustomKeyboard ja gestiona inputmode/readonly i _kbDirectTapBound.
showScreen('menu-screen');

window.addEventListener('load', () => {
    const levelSelect = document.getElementById('addsub-level');
    if (levelSelect && levelSelect.value === '3') {
        levelSelect.classList.add('level-attention');
        setTimeout(() => levelSelect.classList.remove('level-attention'), 1800);
    }
});
