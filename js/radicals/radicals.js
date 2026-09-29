/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/radicals/radicals.js
 * ROL: Joc «Radicals — 4t ESO» (radicals.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa game-core.js, utils.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt, pick } from '../utils.js';
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
    recordResult,
    registerScreens,
    showCustomKeyboard,
    showMiniOverlay,
    showScreen,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { selectRepte, checkStep, buildLevel, checkCurrentCell });

// ============================================================
// DOM
// ============================================================
const els = {
    body: document.body,
    selectionScreen: document.getElementById('selection-screen'),
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    expressionBox: document.getElementById('expression-box'),
    intermediateBox: document.getElementById('intermediate-box'),
    resolutionPanel: document.getElementById('resolution-panel'),
    currentStep: document.getElementById('current-step'),
    stepTitle: document.getElementById('step-title'),
    stepSchema: document.getElementById('step-schema'),
    stepFeedback: document.getElementById('step-feedback'),
    btnSubmitStep: document.getElementById('btn-submit-step'),
};

// ============================================================
// ESTAT
// ============================================================
let selectedRepte = 0;
let isPenalizing = false;
let usedProblems = new Set();

let currentProblem = null;
let currentSteps = [];
let currentStepIdx = 0;

let r1FactorSquare = null,
    r1FactorRest = null;
let r2FactorSquare = null,
    r2FactorRest = null;
let r2DecompA = null,
    r2DecompB = null;

// ============================================================
// UTILITATS MATEMÀTIQUES
// ============================================================
function getFactorPairs(n) {
    const p = [];
    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) p.push([i, n / i]);
    }
    return p;
}

function isPerfectSquare(n) {
    if (!Number.isInteger(n) || n < 0) return false;
    return Number.isInteger(Math.sqrt(n));
}

function maxPerfectSquareDivisor(n) {
    let best = 1;
    for (let i = 2; i * i <= n; i++) {
        if (n % (i * i) === 0) best = i * i;
    }
    return best;
}

// ============================================================
// RENDERITZACIÓ — RADICAL
// ============================================================
function buildRadicalSpan(frontCoef, radicand, extraClass) {
    const g = document.createElement('span');
    g.className = 'radical-group' + (extraClass ? ' ' + extraClass : '');
    if (frontCoef > 1) {
        const c = document.createElement('span');
        c.className = 'radical-front-coef';
        c.innerText = frontCoef;
        g.appendChild(c);
        const d = document.createElement('span');
        d.className = 'radical-dot';
        d.innerText = '·';
        g.appendChild(d);
    }
    const s = document.createElement('span');
    s.className = 'radical-sign';
    s.innerText = '√';
    g.appendChild(s);
    const r = document.createElement('span');
    r.className = 'radical-radicand';
    r.innerText = radicand;
    g.appendChild(r);
    return g;
}

function addEqualsTo(container) {
    const e = document.createElement('span');
    e.className = 'radical-equals';
    e.innerText = '=';
    container.appendChild(e);
}

function showExprRadical(coef, rad) {
    els.expressionBox.innerHTML = '';
    els.expressionBox.appendChild(buildRadicalSpan(coef, rad, ''));
    addEqualsTo(els.expressionBox);
}

// ============================================================
// ESQUEMES — Builders
// ============================================================
function schemaRadOnlyInput(container) {
    container.innerHTML = '';
    const eq = document.createElement('span');
    eq.className = 'schema-equals';
    eq.innerText = '=';
    container.appendChild(eq);
    const sign = document.createElement('span');
    sign.className = 'schema-sign';
    sign.innerText = '√';
    container.appendChild(sign);
    const bar = document.createElement('span');
    bar.className = 'schema-radicand-bar';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'schema-input';
    inp.id = 'step-input';
    inp.autocomplete = 'off';
    bar.appendChild(inp);
    container.appendChild(bar); // [CANVI 2]
}

function schemaTwoRadInputs(container) {
    container.innerHTML = '';
    const eq = document.createElement('span');
    eq.className = 'schema-equals';
    eq.innerText = '=';
    container.appendChild(eq);
    const sign1 = document.createElement('span');
    sign1.className = 'schema-sign';
    sign1.innerText = '√';
    container.appendChild(sign1);
    const bar1 = document.createElement('span');
    bar1.className = 'schema-radicand-bar';
    const inp1 = document.createElement('input');
    inp1.type = 'text';
    inp1.className = 'schema-input';
    inp1.id = 'step-input-a';
    inp1.autocomplete = 'off';
    bar1.appendChild(inp1);
    container.appendChild(bar1); // [CANVI 2]
    const dot = document.createElement('span');
    dot.className = 'schema-dot';
    dot.innerText = '·';
    container.appendChild(dot);
    const sign2 = document.createElement('span');
    sign2.className = 'schema-sign';
    sign2.innerText = '√';
    container.appendChild(sign2);
    const bar2 = document.createElement('span');
    bar2.className = 'schema-radicand-bar';
    const inp2 = document.createElement('input');
    inp2.type = 'text';
    inp2.className = 'schema-input';
    inp2.id = 'step-input-b';
    inp2.autocomplete = 'off';
    bar2.appendChild(inp2);
    container.appendChild(bar2); // [CANVI 2]
}

function schemaCoefTwoRadInputs(container, coefVal) {
    container.innerHTML = '';
    const eq = document.createElement('span');
    eq.className = 'schema-equals';
    eq.innerText = '=';
    container.appendChild(eq);
    if (coefVal !== 1) {
        const box = document.createElement('span');
        box.className = 'schema-box grey filled';
        box.innerText = coefVal;
        container.appendChild(box);
        const dot0 = document.createElement('span');
        dot0.className = 'schema-dot';
        dot0.innerText = '·';
        container.appendChild(dot0);
    }
    const sign1 = document.createElement('span');
    sign1.className = 'schema-sign';
    sign1.innerText = '√';
    container.appendChild(sign1);
    const bar1 = document.createElement('span');
    bar1.className = 'schema-radicand-bar';
    const inp1 = document.createElement('input');
    inp1.type = 'text';
    inp1.className = 'schema-input';
    inp1.id = 'step-input-a';
    inp1.autocomplete = 'off';
    bar1.appendChild(inp1);
    container.appendChild(bar1); // [CANVI 2]
    const dot = document.createElement('span');
    dot.className = 'schema-dot';
    dot.innerText = '·';
    container.appendChild(dot);
    const sign2 = document.createElement('span');
    sign2.className = 'schema-sign';
    sign2.innerText = '√';
    container.appendChild(sign2);
    const bar2 = document.createElement('span');
    bar2.className = 'schema-radicand-bar';
    const inp2 = document.createElement('input');
    inp2.type = 'text';
    inp2.className = 'schema-input';
    inp2.id = 'step-input-b';
    inp2.autocomplete = 'off';
    bar2.appendChild(inp2);
    container.appendChild(bar2); // [CANVI 2]
}

function schemaCoefAndRadInput(container) {
    container.innerHTML = '';
    const eq = document.createElement('span');
    eq.className = 'schema-equals';
    eq.innerText = '=';
    container.appendChild(eq);
    const inpC = document.createElement('input');
    inpC.type = 'text';
    inpC.className = 'schema-input';
    inpC.id = 'step-input-c';
    inpC.autocomplete = 'off';
    container.appendChild(inpC); // [CANVI 2]
    const dot = document.createElement('span');
    dot.className = 'schema-dot';
    dot.innerText = '·';
    container.appendChild(dot);
    const sign = document.createElement('span');
    sign.className = 'schema-sign';
    sign.innerText = '√';
    container.appendChild(sign);
    const bar = document.createElement('span');
    bar.className = 'schema-radicand-bar';
    const inpB = document.createElement('input');
    inpB.type = 'text';
    inpB.className = 'schema-input';
    inpB.id = 'step-input-b2';
    inpB.autocomplete = 'off';
    bar.appendChild(inpB);
    container.appendChild(bar); // [CANVI 2]
}

// ============================================================
// SISTEMA GENÈRIC DE PASSOS
// ============================================================
function showCurrentStep() {
    if (els.stepFeedback) {
        els.stepFeedback.innerText = '';
        els.stepFeedback.className = '';
    }
    const step = currentSteps[currentStepIdx];
    els.stepTitle.innerText = step.title;
    step.buildSchema(els.stepSchema);
    els.currentStep.classList.add('active');
    els.resolutionPanel.style.display = 'flex';
    // [CANVI 4] Focus condicional: teclat custom en tàctil, focus natiu en escriptori
    setTimeout(() => {
        const first = els.stepSchema.querySelector('input');
        if (first) {
            if (isTouchDevice()) {
                showCustomKeyboard(first);
            } else {
                first.focus();
            }
        }
    }, 100);
}

function flashError() {
    const inputs = els.stepSchema.querySelectorAll('input');
    inputs.forEach(inp => inp.classList.add('error-flash'));
    els.btnSubmitStep.classList.add('error-shake');
    setTimeout(() => {
        inputs.forEach(inp => inp.classList.remove('error-flash'));
        els.btnSubmitStep.classList.remove('error-shake');
    }, 250);
}

function clearAndFocus() {
    const inputs = els.stepSchema.querySelectorAll('input');
    inputs.forEach(inp => (inp.value = ''));
    const first = els.stepSchema.querySelector('input');
    // [CANVI 4] Focus condicional en error
    if (first) {
        if (isTouchDevice()) {
            kbMarkForOverwrite(first);
            showCustomKeyboard(first);
        } else {
            first.focus();
        }
    }
}

function checkStep() {
    if (state.isTransitioning || isPenalizing) return;

    const step = currentSteps[currentStepIdx];

    if (step.validate) {
        if (els.stepFeedback) {
            els.stepFeedback.innerText = '';
            els.stepFeedback.className = '';
        }
        const res = step.validate();

        if (res && typeof res === 'object' && res.status === 'suboptimal') {
            if (els.stepFeedback) {
                els.stepFeedback.innerText = res.message;
                els.stepFeedback.className = 'important';
            }
            return;
        }

        if (res !== true) {
            flashError();
            penalize();
            if (state.attemptsLeft > 0) clearAndFocus();
            return;
        }

        if (step.onCorrect) step.onCorrect();
        currentStepIdx++;
        if (currentStepIdx >= currentSteps.length) finalizeProblem();
        else showCurrentStep();
        return;
    }

    // Pas amb resposta simple (step.answer)
    const inp = document.getElementById('step-input');
    if (!inp) return;
    const raw = inp.value.trim();
    if (raw === '') return;

    const userVal = parseStrictInt(raw);
    if (isNaN(userVal) || userVal !== step.answer) {
        flashError();
        penalize();
        // [CANVI 4] Focus condicional en error de pas simple
        if (state.attemptsLeft > 0) {
            inp.value = '';
            if (isTouchDevice()) {
                kbMarkForOverwrite(inp);
                showCustomKeyboard(inp);
            } else {
                inp.focus();
            }
        }
        return;
    }

    if (step.onCorrect) step.onCorrect();
    currentStepIdx++;
    if (currentStepIdx >= currentSteps.length) finalizeProblem();
    else showCurrentStep();
}

// ============================================================
// SELECCIÓ DE REPTE
// ============================================================
function selectRepte(n) {
    selectedRepte = n;
    startGame();
}

// ============================================================
// BUILD LEVEL / PENALIZE / FINALIZE
// ============================================================
function updateUI() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Exercici ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';
    if (state.attemptsLeft < 3) els.attemptsDisplay.classList.add('danger');
}

function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    isPenalizing = false;

    // Resetejar problemes usats a l'inici de cada sessió
    if (state.currentOperation === 0) usedProblems = new Set();

    const ci = (state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length;
    els.body.style.backgroundColor = bgColors[ci];

    if (els.intermediateBox) els.intermediateBox.innerHTML = '';

    if (selectedRepte === 1) {
        currentProblem = generateRepte1(state.currentOperation);
        showExprRadical(currentProblem.frontCoef, currentProblem.radicand);
        currentSteps = buildStepsRepte1(currentProblem);
    } else {
        currentProblem = generateRepte2(state.currentOperation);
        renderRepte2Expr(currentProblem);
        currentSteps = buildStepsRepte2(currentProblem);
    }

    currentStepIdx = 0;
    showCurrentStep();
    updateUI();
}

function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        state.attemptsLeft--;
        isPenalizing = false;
        updateUI();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            els.resolutionPanel.style.display = 'none';
            finalizeProblem(0);
        }
    }, 1000);
}

function showFinalResult() {
    const p = currentProblem;
    els.expressionBox.innerHTML = '';

    const origWrap = document.createElement('span');
    origWrap.style.opacity = '0.35';
    if (selectedRepte === 1) {
        origWrap.appendChild(buildRadicalSpan(p.frontCoef, p.radicand, ''));
    } else {
        buildRepte2OrigNodes(origWrap, p);
    }
    els.expressionBox.appendChild(origWrap);
    addEqualsTo(els.expressionBox);

    if (p.finalRadicand === 1) {
        const sp = document.createElement('span');
        sp.className = 'radical-group resolved';
        sp.innerText = p.finalCoef;
        els.expressionBox.appendChild(sp);
    } else {
        els.expressionBox.appendChild(buildRadicalSpan(p.finalCoef, p.finalRadicand, 'resolved'));
    }
}

function finalizeProblem(forcedPoints) {
    if (forcedPoints === undefined) forcedPoints = null;
    recordResult(forcedPoints === 0 ? 4 : Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3));
    state.isTransitioning = true;
    showFinalResult();
    els.currentStep.classList.remove('active');
    hideCustomKeyboard(); // [CANVI 6] Tanca el teclat custom en finalitzar
    els.resolutionPanel.style.display = 'none';

    let pts;
    if (forcedPoints !== null) {
        pts = forcedPoints;
    } else {
        const fails = MAX_INTENTS - state.attemptsLeft;
        pts = Math.max(0, 10 - fails * 2);
    }

    state.sessionScore += pts;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;

    const waitTime = showMiniOverlay(pts);
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
// REPTE 1 — EXTREURE FACTORS
// ============================================================
const R1_BASES_EASY = [2, 3, 5, 7];
const R1_BASES_MEDIUM = [2, 3, 5, 6, 7, 10, 11];
const R1_BASES_HARD = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];
const R1_SQ_EASY = [
    { sq: 4, r: 2 },
    { sq: 9, r: 3 },
];
const R1_SQ_MEDIUM = [
    { sq: 4, r: 2 },
    { sq: 9, r: 3 },
    { sq: 16, r: 4 },
    { sq: 25, r: 5 },
];

function generateRepte1(opIndex) {
    for (let t = 0; t < 50; t++) {
        let p;
        {
            let bases, squares;
            if (opIndex <= 1) {
                bases = R1_BASES_EASY;
                squares = R1_SQ_EASY;
            } else if (opIndex <= 3) {
                bases = R1_BASES_MEDIUM;
                squares = R1_SQ_MEDIUM;
            } else {
                bases = R1_BASES_HARD;
                squares = R1_SQ_MEDIUM;
            }
            const base = pick(bases),
                si = pick(squares);
            // Fixem sempre el coeficient frontal (frontCoef) a 1
            p = {
                frontCoef: 1,
                radicand: base * si.sq,
                expectedSquare: si.sq,
                expectedRest: base,
                finalCoef: si.r, // Com que frontCoef és 1, finalCoef és directament l'arrel extreta
                finalRadicand: base,
            };
        }
        const key = p.frontCoef + '|' + p.radicand;
        if (!usedProblems.has(key)) {
            usedProblems.add(key);
            return p;
        }
    }
    const b = pick(R1_BASES_EASY),
        s = pick(R1_SQ_EASY);
    return {
        frontCoef: 1,
        radicand: b * s.sq,
        expectedSquare: s.sq,
        expectedRest: b,
        finalCoef: s.r,
        finalRadicand: b,
    };
}

function buildStepsRepte1(p) {
    r1FactorSquare = null;
    r1FactorRest = null;
    // Afegim aquestes dues variables per guardar exactament què ha escrit l'alumne
    let r1DecompA = null;
    let r1DecompB = null;

    return [
        {
            title: "Expressa el radicand com √a · √b (un d'ells ha de ser quadrat perfecte)",
            buildSchema: c => schemaTwoRadInputs(c),
            validate: () => {
                const ia = document.getElementById('step-input-a');
                const ib = document.getElementById('step-input-b');
                if (!ia || !ib) return false;

                const a = parseStrictInt(ia.value);
                const b = parseStrictInt(ib.value);
                if (isNaN(a) || isNaN(b)) return false;
                if (a <= 0 || b <= 0) return false;
                if (a * b !== p.radicand) return false;

                const aSq = isPerfectSquare(a);
                const bSq = isPerfectSquare(b);
                if (!aSq && !bSq) return false;
                if (aSq && bSq) return false;

                r1FactorSquare = aSq ? a : b;
                r1FactorRest = aSq ? b : a;

                const bestSq = maxPerfectSquareDivisor(p.radicand);
                if (r1FactorSquare < bestSq) {
                    return {
                        status: 'suboptimal',
                        message:
                            'És correcte, però el quadrat perfecte extret no és el més gran possible. Torna-ho a provar.',
                    };
                }

                // Si tot és correcte, desem els valors just abans de donar el vist i plau
                r1DecompA = a;
                r1DecompB = b;

                return true;
            },
            // AFEGIM AQUESTA PART: S'executa només si el validate() ha retornat true
            onCorrect: () => {
                if (!els.intermediateBox) return;
                els.intermediateBox.innerHTML = '';

                // Dibuixem la primera arrel que l'alumne ha escrit
                els.intermediateBox.appendChild(buildRadicalSpan(1, r1DecompA, ''));

                // Dibuixem el punt de multiplicar
                const dot = document.createElement('span');
                dot.className = 'radical-dot';
                dot.innerText = ' · ';
                els.intermediateBox.appendChild(dot);

                // Dibuixem la segona arrel
                els.intermediateBox.appendChild(buildRadicalSpan(1, r1DecompB, ''));

                // (Opcional) Si vols que aparegui un signe igual al final d'aquesta línia,
                // pots descomentar la línia següent (si tens la funció addEqualsTo disponible globalment):
                // addEqualsTo(els.intermediateBox);
            },
        },
        {
            title: 'Ara escriu c · √b (on c² = a)',
            buildSchema: c => schemaCoefAndRadInput(c),
            validate: () => {
                const ic = document.getElementById('step-input-c');
                const ib = document.getElementById('step-input-b2');
                if (!ic || !ib) return false;

                const cVal = parseStrictInt(ic.value);
                const bVal = parseStrictInt(ib.value);
                if (isNaN(cVal) || isNaN(bVal)) return false;
                if (cVal <= 0 || bVal <= 0) return false;
                if (r1FactorSquare === null || r1FactorRest === null) return false;
                if (bVal !== r1FactorRest) return false;
                if (cVal * cVal !== r1FactorSquare) return false;

                p.finalCoef = p.frontCoef * cVal;
                p.finalRadicand = r1FactorRest;
                return true;
            },
        },
    ];
}

// ============================================================
// REPTE 2 — PRODUCTE I QUOCIENT
// ============================================================
const R2_BASES = [2, 3, 5, 7];
const R2_ROOTS = [2, 3, 4, 5];

function generateRepte2(opIndex) {
    for (let t = 0; t < 60; t++) {
        let p;
        if (opIndex <= 1) p = genLevelA();
        else if (opIndex <= 3) p = genLevelB();
        else p = genLevelC();
        if (!p) continue;
        const key = p.type + '|' + JSON.stringify(p.display);
        if (!usedProblems.has(key)) {
            usedProblems.add(key);
            return p;
        }
    }
    return genLevelA();
}

function genLevelA() {
    const isProduct = Math.random() > 0.4;
    const er = pick(R2_ROOTS),
        base = pick(R2_BASES);
    const cRad = er * er * base;

    if (isProduct) {
        const pairsAll = getFactorPairs(cRad);
        if (pairsAll.length === 0) return null;
        const pairs = pairsAll.filter(([x, y]) => !isPerfectSquare(x) && !isPerfectSquare(y));
        if (pairs.length === 0) return null;
        const [r1, r2] = pick(pairs);
        return {
            type: 'prod_simple',
            r1,
            r2,
            combinedRad: cRad,
            extractedRoot: er,
            base,
            finalCoef: er,
            finalRadicand: base,
            display: { r1, r2 },
        };
    } else {
        const mOptions = [2, 3, 5].filter(m => !isPerfectSquare(cRad * m));
        if (mOptions.length === 0) return null;
        const m = pick(mOptions);
        return {
            type: 'quot_simple',
            numRad: cRad * m,
            denRad: m,
            combinedRad: cRad,
            extractedRoot: er,
            base,
            finalCoef: er,
            finalRadicand: base,
            display: { n: cRad * m, d: m },
        };
    }
}

function genLevelB() {
    const c1 = pick([2, 3, 4]),
        c2 = pick([2, 3]);
    const er = pick([2, 3]),
        base = pick(R2_BASES);
    const cRad = er * er * base;
    const pairsAll = getFactorPairs(cRad);
    if (pairsAll.length === 0) return null;
    const pairs = pairsAll.filter(([x, y]) => !isPerfectSquare(x) && !isPerfectSquare(y));
    if (pairs.length === 0) return null;
    const [r1, r2] = pick(pairs);
    const combinedCoef = c1 * c2;
    return {
        type: 'prod_coef',
        c1,
        c2,
        r1,
        r2,
        combinedCoef,
        combinedRad: cRad,
        extractedRoot: er,
        base,
        finalCoef: combinedCoef * er,
        finalRadicand: base,
        display: { c1, c2, r1, r2 },
    };
}

function genLevelC() {
    const qCoef = pick([2, 3]),
        er = pick([2, 3]),
        base = pick(R2_BASES);
    const d = pick([2, 3]),
        a = qCoef * d;
    const e = pick([2, 3, 5]),
        qRad = er * er * base,
        b = qRad * e;
    if (isPerfectSquare(b)) return null;
    return {
        type: 'quot_coef',
        a,
        b,
        d,
        e,
        quotientCoef: qCoef,
        quotientRad: qRad,
        extractedRoot: er,
        base,
        finalCoef: qCoef * er,
        finalRadicand: base,
        display: { a, b, d, e },
    };
}

function renderRepte2Expr(p) {
    els.expressionBox.innerHTML = '';
    buildRepte2OrigNodes(els.expressionBox, p);
    addEqualsTo(els.expressionBox);
}

function buildRepte2OrigNodes(container, p) {
    if (p.type === 'prod_simple') {
        container.appendChild(buildRadicalSpan(1, p.r1, ''));
        const op = document.createElement('span');
        op.className = 'radical-op';
        op.innerText = '·';
        container.appendChild(op);
        container.appendChild(buildRadicalSpan(1, p.r2, ''));
    } else if (p.type === 'quot_simple') {
        // AQUÍ ESTÀ EL CANVI: Ara fem servir la mateixa estructura de fracció que a quot_coef
        const frac = document.createElement('span');
        frac.className = 'frac-display';
        const num = document.createElement('span');
        num.className = 'frac-num-row';
        num.appendChild(buildRadicalSpan(1, p.numRad, ''));
        const den = document.createElement('span');
        den.className = 'frac-den-row';
        den.appendChild(buildRadicalSpan(1, p.denRad, ''));
        frac.appendChild(num);
        frac.appendChild(den);
        container.appendChild(frac);
    } else if (p.type === 'prod_coef') {
        container.appendChild(buildRadicalSpan(p.c1, p.r1, ''));
        const op = document.createElement('span');
        op.className = 'radical-op';
        op.innerText = '·';
        container.appendChild(op);
        container.appendChild(buildRadicalSpan(p.c2, p.r2, ''));
    } else if (p.type === 'quot_coef') {
        const frac = document.createElement('span');
        frac.className = 'frac-display';
        const num = document.createElement('span');
        num.className = 'frac-num-row';
        num.appendChild(buildRadicalSpan(p.a, p.b, ''));
        const den = document.createElement('span');
        den.className = 'frac-den-row';
        den.appendChild(buildRadicalSpan(p.d, p.e, ''));
        frac.appendChild(num);
        frac.appendChild(den);
        container.appendChild(frac);
    }
}
function addSimplifyStepsDecompose(steps, p, frontCoef, radicandN) {
    r2FactorSquare = null;
    r2FactorRest = null;
    r2DecompA = null;
    r2DecompB = null;

    steps.push({
        title: "Expressa el radicand com √a · √b (un d'ells ha de ser quadrat perfecte)",
        buildSchema: c => schemaCoefTwoRadInputs(c, frontCoef),
        validate: () => {
            const ia = document.getElementById('step-input-a');
            const ib = document.getElementById('step-input-b');
            if (!ia || !ib) return false;

            const a = parseStrictInt(ia.value);
            const b = parseStrictInt(ib.value);
            if (isNaN(a) || isNaN(b)) return false;
            if (a <= 0 || b <= 0) return false;
            if (a * b !== radicandN) return false;

            r2DecompA = a;
            r2DecompB = b;
            const aSq = isPerfectSquare(a);
            const bSq = isPerfectSquare(b);
            if (!aSq && !bSq) return false;
            if (aSq && bSq) return false;

            r2FactorSquare = aSq ? a : b;
            r2FactorRest = aSq ? b : a;

            const bestSq = maxPerfectSquareDivisor(radicandN);
            if (r2FactorSquare < bestSq) {
                return {
                    status: 'suboptimal',
                    message:
                        'És correcte, però el quadrat perfecte extret no és el més gran possible. Torna-ho a provar.',
                };
            }
            return true;
        },
        onCorrect: () => {
            if (!els.intermediateBox) return;
            els.intermediateBox.innerHTML = '';
            if (frontCoef !== 1) {
                const coefSpan = document.createElement('span');
                coefSpan.innerText = frontCoef;
                els.intermediateBox.appendChild(coefSpan);
                const dot0 = document.createElement('span');
                dot0.className = 'radical-dot';
                dot0.innerText = '·';
                els.intermediateBox.appendChild(dot0);
            }
            els.intermediateBox.appendChild(buildRadicalSpan(1, r2DecompA, ''));
            const dot = document.createElement('span');
            dot.className = 'radical-dot';
            dot.innerText = '·';
            els.intermediateBox.appendChild(dot);
            els.intermediateBox.appendChild(buildRadicalSpan(1, r2DecompB, ''));
        },
    });

    steps.push({
        title: "Ara reescriu l'expressió com: c · √b (on c² = a)",
        buildSchema: c => schemaCoefAndRadInput(c),
        validate: () => {
            const ic = document.getElementById('step-input-c');
            const ib = document.getElementById('step-input-b2');
            if (!ic || !ib) return false;

            const cVal = parseStrictInt(ic.value);
            const bVal = parseStrictInt(ib.value);
            if (isNaN(cVal) || isNaN(bVal)) return false;
            if (cVal <= 0 || bVal <= 0) return false;
            if (r2FactorSquare === null || r2FactorRest === null) return false;
            if (bVal !== r2FactorRest) return false;

            const rootA = Math.sqrt(r2FactorSquare);
            if (!Number.isInteger(rootA)) return false;
            const expectedCoef = frontCoef * rootA;
            if (cVal !== expectedCoef) return false;

            p.finalCoef = expectedCoef;
            p.finalRadicand = r2FactorRest;
            return true;
        },
    });
}

function buildStepsRepte2(p) {
    const steps = [];

    if (p.type === 'prod_simple') {
        steps.push({
            title: 'Multiplica els radicands',
            answer: p.combinedRad,
            buildSchema: c => schemaRadOnlyInput(c),
            onCorrect: () => showExprRadical(1, p.combinedRad),
        });
        addSimplifyStepsDecompose(steps, p, 1, p.combinedRad);
    } else if (p.type === 'quot_simple') {
        steps.push({
            title: 'Divideix els radicands',
            answer: p.combinedRad,
            buildSchema: c => schemaRadOnlyInput(c),
            onCorrect: () => showExprRadical(1, p.combinedRad),
        });
        addSimplifyStepsDecompose(steps, p, 1, p.combinedRad);
    } else if (p.type === 'prod_coef') {
        steps.push({
            title: "Escriu el factor que multiplica l'arrel",
            buildSchema: c => schemaCoefAndRadInput(c),
            validate: () => {
                const ic = document.getElementById('step-input-c');
                const ib = document.getElementById('step-input-b2');
                if (!ic || !ib) return false;
                const cVal = parseStrictInt(ic.value);
                const bVal = parseStrictInt(ib.value);
                if (isNaN(cVal) || isNaN(bVal)) return false;
                if (cVal !== p.combinedCoef) return false;
                if (bVal !== p.combinedRad) return false;
                return true;
            },
            onCorrect: () => showExprRadical(p.combinedCoef, p.combinedRad),
        });
        addSimplifyStepsDecompose(steps, p, p.combinedCoef, p.combinedRad);
    } else if (p.type === 'quot_coef') {
        steps.push({
            title: "Escriu el factor que multiplica l'arrel",
            buildSchema: c => schemaCoefAndRadInput(c),
            validate: () => {
                const ic = document.getElementById('step-input-c');
                const ib = document.getElementById('step-input-b2');
                if (!ic || !ib) return false;
                const cVal = parseStrictInt(ic.value);
                const bVal = parseStrictInt(ib.value);
                if (isNaN(cVal) || isNaN(bVal)) return false;
                if (cVal !== p.quotientCoef) return false;
                if (bVal !== p.quotientRad) return false;
                return true;
            },
            onCorrect: () => showExprRadical(p.quotientCoef, p.quotientRad),
        });
        addSimplifyStepsDecompose(steps, p, p.quotientCoef, p.quotientRad);
    }

    return steps;
}

// ============================================================
// TECLAT
// ============================================================
document.addEventListener('keydown', e => {
    // [CANVI 3] preventDefault només quan el joc és actiu (evita bloquejar la pantalla de selecció)
    if (e.key === 'Enter') {
        if (els.gameScreen.style.display !== 'none' && els.resolutionPanel.style.display !== 'none') {
            e.preventDefault();
            if (!state.isTransitioning && !isPenalizing) checkStep();
        }
    }
});

// ============================================================
// ARRENCADA
// ============================================================
// [CANVI 5] Botó → del teclat custom: salta al primer input buit de l'esquema actiu;
// si tots plens (o cap) → valida el pas.
function checkCurrentCell() {
    const inputs = Array.from(els.stepSchema.querySelectorAll('input'));
    if (!inputs.length) return;
    const firstEmpty = inputs.find(i => i.value.trim() === '');
    if (firstEmpty) {
        showCustomKeyboard(firstEmpty);
    } else {
        checkStep();
    }
}

registerScreens(['selection-screen', 'game-screen', 'session-end-screen', 'final-screen']);
injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false }); // [CANVI 1] Activa listeners del teclat custom
showScreen('selection-screen');
