/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions/equacions.js
 * ROL: Joc «Equacions de 1r Grau» (equacions.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa game-core.js, utils.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt, randIntNonZero } from '../utils.js';
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

// Constructors curts per termes
const xT = c => ({ k: 'x', c });
const nT = v => ({ k: 'n', v });
const pT = (outer, inner) => ({ k: 'p', c: outer, n: inner });

// Flag opcional: ?lefttoright=1 → mai generem formes amb x només a la dreta
const leftToRightOnly = (() => {
    try {
        return new URLSearchParams(window.location.search).get('lefttoright') === '1';
    } catch (e) {
        return false;
    }
})();

// ---- GENERACIÓ ALEATÒRIA D'EQUACIONS ----
//
// L'estat canònic és sempre lA·x + lB = rC·x + rD (x al costat esquerre).
// dispLeft / dispRight són els termes que es veuen a pantalla.
// Per formes B (b=ax) i D (c=ax+b) el canònic té x a l'esquerra però
// dispLeft/dispRight es generen també en canònic; buildLevel s'encarrega
// d'invertir-los visualment quan swapInitial:true.

function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateEquation(opIndex) {
    const nivell = typeof state.currentDifficulty === 'number' ? state.currentDifficulty : 0;
    if (nivell === 1) return genN1();
    if (nivell === 2) {
        const r = Math.random();
        if (r < 0.25) return genN1();
        if (r < 0.55) return genBothSidesX();
        return genMultiTermX();
    }
    if (nivell === 3) {
        const r = Math.random();
        if (r < 0.2) return genN1();
        if (r < 0.45) return genBothSidesX();
        if (r < 0.6) return genMultiTermX();
        return genParens();
    }
    // Sense ?nivell= → comportament legacy per opIndex
    return genLegacy(opIndex);
}

// -------- Generadors per nivell --------

function genN1() {
    // Si està actiu ?lefttoright=1, només permetem les formes A (ax=b)
    // i C (ax+b=c) — bloquegem B (b=ax) i D (c=ax+b).
    const forms = leftToRightOnly ? ['A', 'C'] : ['A', 'B', 'C', 'D'];
    const form = pickOne(forms);
    let lA, lB, rD, xSol;
    for (let safety = 0; safety < 60; safety++) {
        xSol = randIntNonZero(-9, 9);
        lA = randIntNonZero(-6, 6);
        if (Math.abs(lA) < 2) continue;
        if (form === 'A' || form === 'B') {
            lB = 0;
            rD = lA * xSol;
        } else {
            lB = randIntNonZero(-9, 9);
            rD = lA * xSol + lB;
            if (rD === 0) continue;
        }
        break;
    }
    const dispLeft = [xT(lA)];
    if (lB !== 0) dispLeft.push(nT(lB));
    const dispRight = [nT(rD)];
    const swapInitial = form === 'B' || form === 'D';
    return {
        leftA: lA,
        leftB: lB,
        rightC: 0,
        rightD: rD,
        xSol,
        dispLeft,
        dispRight,
        swapInitial,
    };
}

function genBothSidesX() {
    let lA, lB, rC, rD, xSol;
    for (let safety = 0; safety < 80; safety++) {
        xSol = randIntNonZero(-7, 7);
        lA = randIntNonZero(-5, 5);
        rC = randIntNonZero(-5, 5);
        if (Math.abs(lA - rC) < 2) continue;
        lB = randIntNonZero(-9, 9);
        rD = (lA - rC) * xSol + lB;
        if (rD === 0) continue;
        break;
    }
    return {
        leftA: lA,
        leftB: lB,
        rightC: rC,
        rightD: rD,
        xSol,
        dispLeft: [xT(lA), nT(lB)],
        dispRight: [xT(rC), nT(rD)],
        swapInitial: false,
    };
}

function genMultiTermX() {
    let lA, lB, rC, rD, xSol, a1, a2, c1, c2;
    let tries = 0;
    while (tries++ < 80) {
        xSol = randIntNonZero(-7, 7);
        lA = randIntNonZero(-8, 8);
        rC = randIntNonZero(-6, 6);
        if (Math.abs(lA - rC) < 2) continue;
        lB = randIntNonZero(-9, 9);
        rD = (lA - rC) * xSol + lB;
        if (rD === 0) continue;

        // Partim lA = a1 + a2 amb a1, a2 ≠ 0 i |·| ≤ 6
        let okA = false;
        for (let t = 0; t < 30; t++) {
            a1 = randIntNonZero(-6, 6);
            a2 = lA - a1;
            if (a2 !== 0 && Math.abs(a2) <= 6) {
                okA = true;
                break;
            }
        }
        if (!okA) continue;

        // Partim rC = c1 + c2 amb c1, c2 ≠ 0 i |·| ≤ 6
        let okC = false;
        for (let t = 0; t < 30; t++) {
            c1 = randIntNonZero(-6, 6);
            c2 = rC - c1;
            if (c2 !== 0 && Math.abs(c2) <= 6) {
                okC = true;
                break;
            }
        }
        if (!okC) continue;
        break;
    }
    if (tries >= 80) return genBothSidesX();

    return {
        leftA: lA,
        leftB: lB,
        rightC: rC,
        rightD: rD,
        xSol,
        dispLeft: [xT(a1), nT(lB), xT(a2)],
        dispRight: [xT(c1), nT(rD), xT(c2)],
        swapInitial: false,
    };
}

function genParens() {
    // Forma: a(x+b) + c·x + d  =  e(x+f) + g·x + h
    // Després de distribuir:  (a+c)·x + (a·b+d)  =  (e+g)·x + (e·f+h)
    let a, b, c, d, e, f, g, h, lA, lB, rC, rD, xSol;
    let tries = 0;
    while (tries++ < 120) {
        xSol = randIntNonZero(-7, 7);
        a = randIntNonZero(-5, 5);
        if (Math.abs(a) < 2) continue; // a=±1 fa la distribució trivial
        b = randIntNonZero(-6, 6);
        c = randIntNonZero(-5, 5);
        d = randIntNonZero(-9, 9);
        e = randIntNonZero(-5, 5);
        if (Math.abs(e) < 2) continue;
        f = randIntNonZero(-6, 6);
        g = randIntNonZero(-5, 5);

        lA = a + c;
        rC = e + g;
        if (lA === 0 || rC === 0) continue;
        if (Math.abs(lA - rC) < 2) continue;

        lB = a * b + d;
        if (lB === 0) continue;
        if (Math.abs(lB) > 30) continue;

        // rD = e·f + h, i alhora xSol = (rD - lB) / (lA - rC)
        //  ⇒ h = (lA - rC)·xSol + lB - e·f
        h = (lA - rC) * xSol + lB - e * f;
        if (h === 0) continue; // evitem "+0" amagat al display
        if (Math.abs(h) > 30) continue;

        rD = e * f + h;
        if (rD === 0) continue;
        if (Math.abs(rD) > 50) continue;
        break;
    }
    if (tries >= 120) return genBothSidesX();

    return {
        leftA: lA,
        leftB: lB,
        rightC: rC,
        rightD: rD,
        xSol,
        dispLeft: [pT(a, b), xT(c), nT(d)],
        dispRight: [pT(e, f), xT(g), nT(h)],
        swapInitial: false,
    };
}

function genLegacy(opIndex) {
    // Preserva exactament la lògica legacy original per opIndex.
    const xSol = randIntNonZero(-10, 10);
    let leftA, leftB, rightC, rightD;

    if (opIndex <= 1) {
        leftA = randIntNonZero(-6, 6);
        while (Math.abs(leftA) === 1) leftA = randIntNonZero(-6, 6);
        leftB = 0;
        rightC = 0;
        rightD = leftA * xSol;
    } else if (opIndex <= 3) {
        leftA = randIntNonZero(-5, 5);
        leftB = randIntNonZero(-10, 10);
        rightC = 0;
        rightD = leftA * xSol + leftB;
    } else if (opIndex <= 5 && opIndex !== TOTAL_OPERATIONS - 1) {
        leftA = randIntNonZero(-4, 4);
        rightC = randIntNonZero(-3, 3);
        while (rightC === leftA) rightC = randIntNonZero(-3, 3);
        leftB = randIntNonZero(-8, 8);
        rightD = (leftA - rightC) * xSol + leftB;
    } else {
        leftA = randIntNonZero(-6, 6);
        rightC = randIntNonZero(-5, 5);
        while (rightC === leftA) rightC = randIntNonZero(-5, 5);
        while (Math.abs(leftA - rightC) === 1) {
            rightC = randIntNonZero(-5, 5);
            if (rightC === leftA) continue;
        }
        leftB = randIntNonZero(-10, 10);
        rightD = (leftA - rightC) * xSol + leftB;
    }

    const dispLeft = [];
    if (leftA !== 0) dispLeft.push(xT(leftA));
    if (leftB !== 0) dispLeft.push(nT(leftB));
    if (dispLeft.length === 0) dispLeft.push(nT(0));

    const dispRight = [];
    if (rightC !== 0) dispRight.push(xT(rightC));
    if (rightD !== 0) dispRight.push(nT(rightD));
    if (dispRight.length === 0) dispRight.push(nT(0));

    return {
        leftA,
        leftB,
        rightC,
        rightD,
        xSol,
        dispLeft,
        dispRight,
        swapInitial: false,
    };
}

// ---- DETERMINACIÓ DELS PASSOS DE RESOLUCIÓ ----
//
// Ordre dels passos:
//   1. distribute_left  (un per cada parèntesi a l'esquerra)
//   2. distribute_right (un per cada parèntesi a la dreta)
//   3. simplify_left_x  (si hi ha > 1 terme x a l'esquerra)
//   4. simplify_left_n  (si hi ha > 1 terme independent a l'esquerra)
//   5. simplify_right_x (si hi ha > 1 terme x a la dreta)
//   6. simplify_right_n (si hi ha > 1 terme independent a la dreta)
//   7. group_x          (si rC ≠ 0)
//   8. group_num        (si lB ≠ 0)
//   9. solve            (si lA ≠ 1)

function determineSteps(eq) {
    const result = [];
    let dispL = eq.dispLeft.slice();
    let dispR = eq.dispRight.slice();
    let lA = eq.leftA,
        lB = eq.leftB,
        rC = eq.rightC,
        rD = eq.rightD;

    // 1. distribute_left
    while (true) {
        const idx = dispL.findIndex(t => t.k === 'p');
        if (idx === -1) break;
        const paren = dispL[idx];
        const newConst = paren.c * paren.n;
        const newDispL = dispL.slice();
        newDispL.splice(idx, 1, xT(paren.c), nT(newConst));
        result.push({
            type: 'distribute_left',
            instruction: `Aplica la propietat distributiva al parèntesi de l'esquerra`,
            answer: newConst,
            label: 'Terme independent',
            distIdx: idx,
            distOuter: paren.c,
            distInner: paren.n,
            dispLeftBefore: dispL,
            dispRightBefore: dispR.slice(),
            dispLeftAfter: newDispL,
            dispRightAfter: dispR.slice(),
        });
        dispL = newDispL;
    }

    // 2. distribute_right
    while (true) {
        const idx = dispR.findIndex(t => t.k === 'p');
        if (idx === -1) break;
        const paren = dispR[idx];
        const newConst = paren.c * paren.n;
        const newDispR = dispR.slice();
        newDispR.splice(idx, 1, xT(paren.c), nT(newConst));
        result.push({
            type: 'distribute_right',
            instruction: `Aplica la propietat distributiva al parèntesi de la dreta`,
            answer: newConst,
            label: 'Terme independent',
            distIdx: idx,
            distOuter: paren.c,
            distInner: paren.n,
            dispLeftBefore: dispL.slice(),
            dispRightBefore: dispR,
            dispLeftAfter: dispL.slice(),
            dispRightAfter: newDispR,
        });
        dispR = newDispR;
    }

    // 3. simplify_left_x
    {
        const xs = dispL.filter(t => t.k === 'x');
        if (xs.length > 1) {
            const sum = xs.reduce((s, t) => s + t.c, 0);
            const newDispL = [];
            let placed = false;
            for (const t of dispL) {
                if (t.k === 'x') {
                    if (!placed) {
                        newDispL.push(xT(sum));
                        placed = true;
                    }
                } else {
                    newDispL.push(t);
                }
            }
            result.push({
                type: 'simplify_left_x',
                instruction: `Suma els termes amb x del costat esquerre`,
                answer: sum,
                label: 'Coeficient de x',
                dispLeftBefore: dispL,
                dispRightBefore: dispR.slice(),
                dispLeftAfter: newDispL,
                dispRightAfter: dispR.slice(),
            });
            dispL = newDispL;
        }
    }

    // 4. simplify_left_n
    {
        const ns = dispL.filter(t => t.k === 'n');
        if (ns.length > 1) {
            const sum = ns.reduce((s, t) => s + t.v, 0);
            const newDispL = [];
            let placed = false;
            for (const t of dispL) {
                if (t.k === 'n') {
                    if (!placed) {
                        newDispL.push(nT(sum));
                        placed = true;
                    }
                } else {
                    newDispL.push(t);
                }
            }
            result.push({
                type: 'simplify_left_n',
                instruction: `Suma els termes independents del costat esquerre`,
                answer: sum,
                label: 'Terme independent',
                dispLeftBefore: dispL,
                dispRightBefore: dispR.slice(),
                dispLeftAfter: newDispL,
                dispRightAfter: dispR.slice(),
            });
            dispL = newDispL;
        }
    }

    // 5. simplify_right_x
    {
        const xs = dispR.filter(t => t.k === 'x');
        if (xs.length > 1) {
            const sum = xs.reduce((s, t) => s + t.c, 0);
            const newDispR = [];
            let placed = false;
            for (const t of dispR) {
                if (t.k === 'x') {
                    if (!placed) {
                        newDispR.push(xT(sum));
                        placed = true;
                    }
                } else {
                    newDispR.push(t);
                }
            }
            result.push({
                type: 'simplify_right_x',
                instruction: `Suma els termes amb x del costat dret`,
                answer: sum,
                label: 'Coeficient de x',
                dispLeftBefore: dispL.slice(),
                dispRightBefore: dispR,
                dispLeftAfter: dispL.slice(),
                dispRightAfter: newDispR,
            });
            dispR = newDispR;
        }
    }

    // 6. simplify_right_n
    {
        const ns = dispR.filter(t => t.k === 'n');
        if (ns.length > 1) {
            const sum = ns.reduce((s, t) => s + t.v, 0);
            const newDispR = [];
            let placed = false;
            for (const t of dispR) {
                if (t.k === 'n') {
                    if (!placed) {
                        newDispR.push(nT(sum));
                        placed = true;
                    }
                } else {
                    newDispR.push(t);
                }
            }
            result.push({
                type: 'simplify_right_n',
                instruction: `Suma els termes independents del costat dret`,
                answer: sum,
                label: 'Terme independent',
                dispLeftBefore: dispL.slice(),
                dispRightBefore: dispR,
                dispLeftAfter: dispL.slice(),
                dispRightAfter: newDispR,
            });
            dispR = newDispR;
        }
    }

    // 7. group_x — passem x al costat esquerre
    if (rC !== 0) {
        const newLA = lA - rC;
        const newDispL = [];
        if (newLA !== 0) newDispL.push(xT(newLA));
        if (lB !== 0) newDispL.push(nT(lB));
        if (newDispL.length === 0) newDispL.push(nT(0));
        const newDispR = [];
        if (rD !== 0) newDispR.push(nT(rD));
        if (newDispR.length === 0) newDispR.push(nT(0));
        result.push({
            type: 'group_x',
            instruction: `Quant val el coeficient de la x?`,
            answer: newLA,
            label: 'Coeficient de x',
            dispLeftBefore: dispL,
            dispRightBefore: dispR,
            dispLeftAfter: newDispL,
            dispRightAfter: newDispR,
        });
        dispL = newDispL;
        dispR = newDispR;
        lA = newLA;
        rC = 0;
    }

    // 8. group_num — passem el terme independent a la dreta
    if (lB !== 0) {
        const newRD = rD - lB;
        const newDispL = [];
        if (lA !== 0) newDispL.push(xT(lA));
        if (newDispL.length === 0) newDispL.push(nT(0));
        const newDispR = [nT(newRD)];
        result.push({
            type: 'group_num',
            instruction: `Quant val el terme independent?`,
            answer: newRD,
            label: 'Terme independent',
            dispLeftBefore: dispL,
            dispRightBefore: dispR,
            dispLeftAfter: newDispL,
            dispRightAfter: newDispR,
        });
        dispL = newDispL;
        dispR = newDispR;
        rD = newRD;
        lB = 0;
    }

    // 9. solve — dividim pel coeficient de la x
    if (lA !== 1) {
        const newDispL = [xT(1)];
        const newDispR = [nT(eq.xSol)];
        result.push({
            type: 'solve',
            instruction: `Quina és la solució de l'equació?`,
            answer: eq.xSol,
            label: 'Valor de x',
            dispLeftBefore: dispL,
            dispRightBefore: dispR,
            dispLeftAfter: newDispL,
            dispRightAfter: newDispR,
        });
    }

    return result;
}

// ---- RENDER DE TERMES ----
//
// renderOneToken(t) → { html, isNegative }
//   Retorna la representació "absoluta" del terme i si la seva contribució
//   al costat és negativa. La unió de tokens posa els signes entremig.
//
// Tipus de token:
//   { k:'x', c }              → c·x
//   { k:'n', v }              → v
//   { k:'p', c, n }           → c·(x + n)
//   { k:'_input_x', html }    → [input]·x  (placeholder per a un coeficient)
//   { k:'_input_n', html }    → [input]    (placeholder per a una constant)

function renderOneToken(t) {
    if (t.k === 'x') {
        const isNeg = t.c < 0;
        const a = Math.abs(t.c);
        const inner = a === 1 ? '<span class="eq-var">x</span>' : a + '<span class="eq-var">x</span>';
        return { html: inner, isNegative: isNeg };
    }
    if (t.k === 'n') {
        return { html: String(Math.abs(t.v)), isNegative: t.v < 0 };
    }
    if (t.k === 'p') {
        const isNeg = t.c < 0;
        const a = Math.abs(t.c);
        const outer = a === 1 ? '' : String(a);
        let innerStr;
        if (t.n > 0) innerStr = '<span class="eq-var">x</span> + ' + t.n;
        else if (t.n < 0) innerStr = '<span class="eq-var">x</span> − ' + Math.abs(t.n);
        else innerStr = '<span class="eq-var">x</span>';
        return { html: outer + '(' + innerStr + ')', isNegative: isNeg };
    }
    if (t.k === '_input_x') {
        return { html: t.html + '<span class="eq-var">x</span>', isNegative: false };
    }
    if (t.k === '_input_n') {
        return { html: t.html, isNegative: false };
    }
    return { html: '?', isNegative: false };
}

function renderTerms(arr) {
    // Filtrem termes nuls (però mai els placeholders ni els parèntesis)
    const filtered = arr.filter(t => {
        if (t.k === 'n') return t.v !== 0;
        if (t.k === 'x') return t.c !== 0;
        return true;
    });
    if (filtered.length === 0) return '0';

    let html = '';
    for (let i = 0; i < filtered.length; i++) {
        const piece = renderOneToken(filtered[i]);
        if (i === 0) {
            html = (piece.isNegative ? '−' : '') + piece.html;
        } else {
            html += (piece.isNegative ? ' − ' : ' + ') + piece.html;
        }
    }
    return html;
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

// ---- BUILD LEVEL (cridat per game-core) ----
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;

    equation = generateEquation(state.currentOperation);
    steps = determineSteps(equation);
    currentStepIndex = 0;

    const colorIndex = (state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length;
    els.body.style.backgroundColor = bgColors[colorIndex];

    els.eqHistory.innerHTML = '';
    els.eqHistory.style.display = 'flex';
    els.stepHint.style.display = 'none';

    // Per les formes b=ax i c=ax+b (swapInitial), invertim només la
    // primera línia visual; la resta del joc treballa en forma canònica.
    const origLeft = equation.swapInitial ? equation.dispRight : equation.dispLeft;
    const origRight = equation.swapInitial ? equation.dispLeft : equation.dispRight;
    addEquationToHistory(origLeft, origRight, 'eq-original');

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
