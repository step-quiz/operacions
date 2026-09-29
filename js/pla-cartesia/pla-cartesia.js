/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pla-cartesia/pla-cartesia.js
 * ROL: Joc «Funcions i Gràfiques» (pla-cartesia.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa game-core.js, config.js, utils.js, fixed-sessions.js.
 * ============================================================================
 */

import { FixedSessions } from '../fixed-sessions.js';
import { MAX_ENLLOC_MITJANA, MAX_INTENTS, TOTAL_OPERATIONS } from '../config.js';
import { parseStrictInt, randInt } from '../utils.js';
import {
    state,
    initCustomKeyboard,
    isTouchDevice,
    kbMarkForOverwrite,
    recordResult,
    showCustomKeyboard,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, {
    selectSection,
    selectDifficulty,
    goToSections,
    checkCoordInput,
    checkQuadrant,
    showFinalScreen,
    finalitzar,
    checkCurrentCell,
});

// ============================================================
// CODI ESPECÍFIC DE FUNCIONS I GRÀFIQUES
// NOTA: game-core.js carregat NOMÉS pel teclat custom.
//       Lògica de seccions, overlay i pantalles: pròpia d'aquest joc.
//       SÍ usa utils.js (randInt, pick) i config.js (TOTAL_OPERATIONS, etc.)
// ============================================================

// ---- DOM ----
const els = {
    body: document.body,
    mainPanel: document.getElementById('main-panel'),
    sectionScreen: document.getElementById('section-screen'),
    diffScreen: document.getElementById('difficulty-screen'),
    diffTitle: document.getElementById('diff-section-title'),
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    gamePrompt: document.getElementById('game-prompt'),
    canvas: document.getElementById('cartesian-canvas'),
    coordInputArea: document.getElementById('coord-input-area'),
    inputX: document.getElementById('input-x'),
    inputY: document.getElementById('input-y'),
    btnCoordSubmit: document.getElementById('btn-coord-submit'),
    feedbackBar: document.getElementById('feedback-bar'),
    quadrantArea: document.getElementById('quadrant-area'),
    btnEixX: document.getElementById('btn-eix-x'),
    btnEixY: document.getElementById('btn-eix-y'),
    btnOrigen: document.getElementById('btn-origen'),
    miniOverlay: document.getElementById('mini-victory-overlay'),
    miniVicText: document.getElementById('mini-vic-text'),
    miniVicIcon: document.getElementById('mini-vic-icon'),
    miniVicPoints: document.getElementById('mini-vic-points'),
    sessionEndScreen: document.getElementById('session-end-screen'),
    sessionEndTitle: document.getElementById('session-end-title'),
    sessionScoreText: document.getElementById('session-score-text'),
    finalScreen: document.getElementById('final-screen'),
    finalSummary: document.getElementById('final-summary'),
};
const ctx = els.canvas.getContext('2d');

// [BUGFIX] bgColors ja declarat per game-core.js — usem pcBgColors per evitar conflicte de let/const
const pcBgColors = [
    '#f0f4ff',
    '#eff6ff',
    '#f0fdf4',
    '#fefce8',
    '#fff1f2',
    '#f5f3ff',
    '#ecfeff',
    '#fdf4ff',
    '#fffbeb',
    '#faf5ff',
];

// ---- ESTAT ----
let currentSection = '3a',
    difficultyLevel = 2;
// [BUGFIX] currentOperation i sessionScore ja declarats per game-core.js
let allResults = [];
// [BUGFIX] attemptsLeft i isTransitioning ja declarats per game-core.js
let isPenalizing = false;
let exerciseMode = 'place',
    targetX = 0,
    targetY = 0,
    answered = false,
    pointLabel = 'A';
let targetQuadrant = 'Q1';
const POINT_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// GRID FIX: x ∈ [−5, 5], y ∈ [−4, 4]
const GX_MIN = -5,
    GX_MAX = 5,
    GY_MIN = -4,
    GY_MAX = 4;
const GCOLS = GX_MAX - GX_MIN;
const GROWS = GY_MAX - GY_MIN;

// Canvas layout
let dpr = 1,
    cellSize = 50;
let marginL = 0,
    marginR = 0,
    marginT = 0,
    marginB = 0;
let originX = 0,
    originY = 0,
    cssW = 0,
    cssH = 0;

// ---- PANTALLES (pròpies — no usa game-core) ----
const ALL_SCREENS = ['section-screen', 'difficulty-screen', 'game-screen', 'session-end-screen', 'final-screen'];
function showScreen(id) {
    ALL_SCREENS.forEach(s => (document.getElementById(s).style.display = 'none'));
    document.getElementById(id).style.display = 'block';
}

// ---- SECCIÓ I DIFICULTAT ----
function goToSections() {
    showScreen('section-screen');
    els.body.style.backgroundColor = '#f0f4ff';
}

function selectSection(s) {
    currentSection = s;
    const diffBtns = document.querySelectorAll('.diff-btn');
    if (s === '3a') {
        els.diffTitle.innerText = '🧭 3a · Els 4 quadrants';
        diffBtns[0].querySelector('.diff-detail').innerText = 'Quadrants 1 i 2';
        diffBtns[1].querySelector('.diff-detail').innerText = 'Quadrants 1, 2, 3 i 4';
        diffBtns[2].querySelector('.diff-detail').innerText = 'Quadrants, eixos i origen';
    } else if (s === '3b') {
        els.diffTitle.innerText = '📍 3b · Situa el punt';
        diffBtns[0].querySelector('.diff-detail').innerText = 'Quadrants 1 i 2';
        diffBtns[1].querySelector('.diff-detail').innerText = 'Quadrants 1, 2, 3 i 4';
        diffBtns[2].querySelector('.diff-detail').innerText = 'Quadrants, eixos i origen';
    }
    showScreen('difficulty-screen');
}

function selectDifficulty(lv) {
    difficultyLevel = lv;
    state.currentOperation = 0;
    state.sessionScore = 0;
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    isPenalizing = false;
    showScreen('game-screen');
    resizeCanvas();
    buildExercise();
}

// ---- CANVAS HiDPI ----
function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const panelW = els.mainPanel.getBoundingClientRect().width;
    const availW = panelW - 16;
    marginL = 42;
    marginR = 42;
    marginT = 52;
    marginB = 38;
    cellSize = Math.floor((availW - marginL - marginR) / GCOLS);
    if (cellSize < 26) cellSize = 26;
    cssW = marginL + GCOLS * cellSize + marginR;
    cssH = marginT + GROWS * cellSize + marginB;
    els.canvas.width = Math.round(cssW * dpr);
    els.canvas.height = Math.round(cssH * dpr);
    els.canvas.style.width = cssW + 'px';
    els.canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    originX = marginL + -GX_MIN * cellSize;
    originY = marginT + GY_MAX * cellSize;
    updateWrapHeight();
}

function updateWrapHeight() {
    const wrap = document.querySelector('.canvas-wrap');
    const headerH = document.querySelector('.header-info')?.offsetHeight || 70;
    const promptH = els.gamePrompt?.offsetHeight || 45;
    const coordH = els.coordInputArea.classList.contains('active') ? els.coordInputArea.offsetHeight || 48 : 0;
    const quadH = els.quadrantArea.classList.contains('active') ? els.quadrantArea.offsetHeight || 100 : 0;
    const feedbackH = 42;
    const extraUI = 80;
    const usedH = headerH + promptH + coordH + quadH + feedbackH + extraUI;
    const wrapH = window.innerHeight - usedH;
    wrap.style.maxHeight = Math.max(200, wrapH) + 'px';
}

function cX(gx) {
    return originX + gx * cellSize;
}
function cY(gy) {
    return originY - gy * cellSize;
}
function gX(cx) {
    return Math.round((cx - originX) / cellSize);
}
function gY(cy) {
    return Math.round((originY - cy) / cellSize);
}

function drawGrid() {
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#fafbff';
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = '#d5dbe8';
    ctx.lineWidth = 1;
    for (let i = GX_MIN; i <= GX_MAX; i++) {
        ctx.beginPath();
        ctx.moveTo(cX(i), marginT);
        ctx.lineTo(cX(i), cssH - marginB);
        ctx.stroke();
    }
    for (let i = GY_MIN; i <= GY_MAX; i++) {
        ctx.beginPath();
        ctx.moveTo(marginL, cY(i));
        ctx.lineTo(cssW - marginR, cY(i));
        ctx.stroke();
    }

    const axExt = Math.round(cellSize * 0.65);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(marginL - axExt, originY);
    ctx.lineTo(cssW - marginR + axExt, originY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(originX, marginT - axExt);
    ctx.lineTo(originX, cssH - marginB + axExt);
    ctx.stroke();

    const a = 7;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(cssW - marginR + axExt, originY);
    ctx.lineTo(cssW - marginR + axExt - a, originY - a * 0.6);
    ctx.lineTo(cssW - marginR + axExt - a, originY + a * 0.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(originX, marginT - axExt);
    ctx.lineTo(originX - a * 0.6, marginT - axExt + a);
    ctx.lineTo(originX + a * 0.6, marginT - axExt + a);
    ctx.fill();

    const fs = Math.max(11, Math.round(cellSize * 0.24));
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${fs}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = GX_MIN; i <= GX_MAX; i++) {
        if (i === 0) continue;
        ctx.fillText(String(i), cX(i), originY + 7);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = GY_MIN; i <= GY_MAX; i++) {
        if (i === 0) continue;
        ctx.fillText(String(i), originX - 9, cY(i));
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', originX - 8, originY + 6);

    ctx.font = `bold ${fs + 2}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x', cssW - marginR + axExt + 2, originY - 6);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('y', originX + 8, marginT - axExt - 4);
}

function drawPoint(gx, gy, color, label, r) {
    r = r || 8;
    const px = cX(gx),
        py = cY(gy);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (label) {
        const fs = Math.max(14, Math.round(cellSize * 0.38));
        ctx.fillStyle = color;
        ctx.font = `bold ${fs}px 'Courier New', monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, px + r + 4, py - r + 2);
    }
}

function scrollCanvasToPoint(gx, gy) {
    const wrap = document.querySelector('.canvas-wrap');
    const pointY = cY(gy);
    wrap.scrollTo({ top: Math.max(0, pointY - wrap.clientHeight / 2), behavior: 'smooth' });
}

// ---- GENERACIÓ ----
function getQuadrantOf(x, y) {
    if (x === 0 && y === 0) return 'Origen';
    if (x === 0) return 'Eix Y';
    if (y === 0) return 'Eix X';
    if (x > 0 && y > 0) return 'Q1';
    if (x < 0 && y > 0) return 'Q2';
    if (x < 0 && y < 0) return 'Q3';
    return 'Q4';
}

function quadrantText(q) {
    const map = {
        'Q1': '1r quadrant',
        'Q2': '2n quadrant',
        'Q3': '3r quadrant',
        'Q4': '4t quadrant',
        'Eix X': "l'eix X",
        'Eix Y': "l'eix Y",
        'Origen': "l'origen",
    };
    return map[q] || q;
}

function quadrantPrep(q) {
    if (q === 'Eix X' || q === 'Eix Y') return 'sobre ' + quadrantText(q);
    if (q === 'Origen') return 'a ' + quadrantText(q);
    return 'al ' + quadrantText(q);
}

function buildExercise() {
    // Sessions fixes: llavor pròpia per a cada exercici (secció, nivell, número)
    FixedSessions?.seed(`${currentSection}-n${difficultyLevel}-q${state.currentOperation}`);
    if (currentSection === '3a') buildExerciseQuadrants();
    else if (currentSection === '3b') buildExerciseSitua();
}

// ---- 3b — SITUA EL PUNT ----
function generateTargetSitua() {
    let x, y;
    if (difficultyLevel === 1) {
        x = randInt(GX_MIN, GX_MAX);
        y = randInt(1, GY_MAX);
        while (x === 0) x = randInt(GX_MIN, GX_MAX);
    } else if (difficultyLevel === 2) {
        do {
            x = randInt(GX_MIN, GX_MAX);
            y = randInt(GY_MIN, GY_MAX);
        } while (x === 0 || y === 0);
    } else {
        x = randInt(GX_MIN, GX_MAX);
        y = randInt(GY_MIN, GY_MAX);
    }
    return { x, y };
}

function buildExerciseSitua() {
    state.attemptsLeft = MAX_INTENTS;
    answered = false;
    state.isTransitioning = false;
    isPenalizing = false;
    pointLabel = POINT_LABELS[state.currentOperation % 26];
    els.canvas.style.cursor = 'crosshair';

    exerciseMode =
        difficultyLevel === 1 && state.currentOperation < 5 ? 'place' : Math.random() < 0.6 ? 'place' : 'identify';

    const t = generateTargetSitua();
    targetX = t.x;
    targetY = t.y;
    updateGameUI();
    drawGrid();

    els.quadrantArea.classList.remove('active');
    els.feedbackBar.className = 'feedback-bar hidden';
    els.feedbackBar.innerText = '';

    if (exerciseMode === 'place') {
        els.gamePrompt.innerHTML =
            'Situa el punt <strong>' + pointLabel + '(' + targetX + ', ' + targetY + ')</strong> al pla cartesià';
        els.coordInputArea.classList.remove('active');
        updateWrapHeight();
        document.querySelector('.canvas-wrap').scrollTo({ top: 0 });
    } else {
        drawPoint(targetX, targetY, '#4f46e5', pointLabel, 9);
        els.gamePrompt.innerHTML = 'Quines són les coordenades del punt <strong>' + pointLabel + '</strong>?';
        els.coordInputArea.classList.add('active');
        els.inputX.value = '';
        els.inputY.value = '';
        // [CANVI 4] Focus condicional
        if (isTouchDevice()) {
            showCustomKeyboard(els.inputX);
        } else {
            els.inputX.focus();
        }
        updateWrapHeight();
        setTimeout(function () {
            scrollCanvasToPoint(targetX, targetY);
        }, 150);
    }
    els.body.style.backgroundColor = pcBgColors[state.currentOperation % pcBgColors.length];
}

// ---- 3a — ELS 4 QUADRANTS ----
function generateTargetQuadrants() {
    let x, y;
    if (difficultyLevel === 1) {
        x = randInt(GX_MIN, GX_MAX);
        y = randInt(1, GY_MAX);
        while (x === 0) x = randInt(GX_MIN, GX_MAX);
    } else if (difficultyLevel === 2) {
        do {
            x = randInt(GX_MIN, GX_MAX);
            y = randInt(GY_MIN, GY_MAX);
        } while (x === 0 || y === 0);
    } else {
        x = randInt(GX_MIN, GX_MAX);
        y = randInt(GY_MIN, GY_MAX);
    }
    return { x, y };
}

function buildExerciseQuadrants() {
    state.attemptsLeft = MAX_INTENTS;
    answered = false;
    state.isTransitioning = false;
    isPenalizing = false;
    pointLabel = POINT_LABELS[state.currentOperation % 26];

    document.querySelectorAll('.q-btn').forEach(function (b) {
        b.classList.remove('correct-flash', 'error-shake');
    });
    els.canvas.style.cursor = 'default';

    var pickRatio = difficultyLevel === 1 ? 0.8 : 0.6;
    exerciseMode = Math.random() < pickRatio ? 'quadrant-pick' : 'quadrant-give';

    var t = generateTargetQuadrants();
    targetX = t.x;
    targetY = t.y;
    targetQuadrant = getQuadrantOf(targetX, targetY);

    updateGameUI();
    drawGrid();

    els.feedbackBar.className = 'feedback-bar hidden';
    els.feedbackBar.innerText = '';

    var showAxis = difficultyLevel === 3;
    els.btnEixX.classList.toggle('hidden-btn', !showAxis);
    els.btnEixY.classList.toggle('hidden-btn', !showAxis);
    els.btnOrigen.classList.toggle('hidden-btn', !showAxis);

    if (exerciseMode === 'quadrant-pick') {
        drawPoint(targetX, targetY, '#4f46e5', pointLabel, 9);
        var prompt3a =
            difficultyLevel === 3
                ? 'Situa el punt <strong>' + pointLabel + "</strong> en un quadrant, o bé sobre un eix, o bé a l'origen"
                : 'A quin quadrant es troba el punt <strong>' + pointLabel + '</strong>?';
        els.gamePrompt.innerHTML = prompt3a;
        els.coordInputArea.classList.remove('active');
        els.quadrantArea.classList.add('active');
        updateWrapHeight();
        setTimeout(function () {
            scrollCanvasToPoint(targetX, targetY);
        }, 150);
    } else {
        var quads =
            difficultyLevel === 1
                ? ['Q1', 'Q2']
                : difficultyLevel === 2
                  ? ['Q1', 'Q2', 'Q3', 'Q4']
                  : ['Q1', 'Q2', 'Q3', 'Q4', 'Eix X', 'Eix Y', 'Origen'];
        targetQuadrant = quads[randInt(0, quads.length - 1)];

        els.gamePrompt.innerHTML = 'Escriu un punt que estigui <strong>' + quadrantPrep(targetQuadrant) + '</strong>';
        els.quadrantArea.classList.remove('active');
        els.coordInputArea.classList.add('active');
        els.inputX.value = '';
        els.inputY.value = '';
        // [CANVI 4] Focus condicional
        if (isTouchDevice()) {
            showCustomKeyboard(els.inputX);
        } else {
            els.inputX.focus();
        }
        updateWrapHeight();
        document.querySelector('.canvas-wrap').scrollTo({ top: 0 });
    }
    els.body.style.backgroundColor = pcBgColors[state.currentOperation % pcBgColors.length];
}

function updateGameUI() {
    var dn = ['', 'Nivell A', 'Nivell B', 'Nivell C'];
    var sectionLabels = { '3a': '3a · Els 4 quadrants', '3b': '3b · Situa el punt' };
    els.sessionDisplay.innerText = (sectionLabels[currentSection] || currentSection) + ' · ' + dn[difficultyLevel];
    els.lvlDisplay.innerText = 'Exercici ' + (state.currentOperation + 1) + ' de ' + TOTAL_OPERATIONS;
    els.scoreDisplay.innerText = 'Punts: ' + state.sessionScore;
    els.attemptsDisplay.innerText = 'Intents: ' + state.attemptsLeft;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft < 3 ? ' danger' : '');
}

// ---- INTERACCIÓ CANVAS ----
function getCSSCoords(e) {
    var rect = els.canvas.getBoundingClientRect();
    var cx2, cy2;
    if (e.changedTouches && e.changedTouches.length) {
        cx2 = e.changedTouches[0].clientX;
        cy2 = e.changedTouches[0].clientY;
    } else {
        cx2 = e.clientX;
        cy2 = e.clientY;
    }
    return { cx: (cx2 - rect.left) * (cssW / rect.width), cy: (cy2 - rect.top) * (cssH / rect.height) };
}

els.canvas.addEventListener('click', handleClick);
els.canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    handleClick(e);
});

function handleClick(e) {
    if (
        currentSection !== '3b' ||
        exerciseMode !== 'place' ||
        answered ||
        state.isTransitioning ||
        isPenalizing ||
        state.attemptsLeft <= 0
    )
        return;
    var coords = getCSSCoords(e);
    var gx2 = gX(coords.cx),
        gy2 = gY(coords.cy);
    if (gx2 < GX_MIN || gx2 > GX_MAX || gy2 < GY_MIN || gy2 > GY_MAX) return;

    drawGrid();
    if (gx2 === targetX && gy2 === targetY) {
        drawPoint(gx2, gy2, '#10b981', pointLabel, 9);
        els.feedbackBar.innerText = '✓ Correcte! ' + pointLabel + '(' + targetX + ', ' + targetY + ')';
        els.feedbackBar.className = 'feedback-bar correct';
        answered = true;
        finalizeProblem();
    } else {
        drawPoint(gx2, gy2, '#ef4444', '', 6);
        els.feedbackBar.innerText = '✗ Això és (' + gx2 + ', ' + gy2 + ')';
        els.feedbackBar.className = 'feedback-bar wrong';
        penalize();
        setTimeout(function () {
            if (!answered && state.attemptsLeft > 0) {
                drawGrid();
                els.feedbackBar.className = 'feedback-bar hidden';
            }
        }, 2400);
    }
}

// ---- QUADRANT CHECK ----
function checkQuadrant(chosen, btnEl) {
    if (answered || state.isTransitioning || isPenalizing || state.attemptsLeft <= 0) return;

    if (chosen === targetQuadrant) {
        btnEl.classList.add('correct-flash');
        drawGrid();
        drawPoint(targetX, targetY, '#10b981', pointLabel, 9);
        els.feedbackBar.innerText =
            '✓ Correcte! ' + pointLabel + '(' + targetX + ', ' + targetY + ') està ' + quadrantPrep(targetQuadrant);
        els.feedbackBar.className = 'feedback-bar correct';
        answered = true;
        finalizeProblem();
    } else {
        btnEl.classList.add('error-shake');
        setTimeout(function () {
            btnEl.classList.remove('error-shake');
        }, 250);
        els.feedbackBar.innerText = '✗ No és ' + chosen;
        els.feedbackBar.className = 'feedback-bar wrong';
        penalize();
    }
}

// ---- INPUT COORDENADES ----
function checkCoordInput() {
    if (answered || state.isTransitioning || isPenalizing || state.attemptsLeft <= 0) return;

    var xv = els.inputX.value.trim(),
        yv = els.inputY.value.trim();
    if (!xv || !yv) return;
    var ux = parseStrictInt(xv),
        uy = parseStrictInt(yv);
    if (isNaN(ux) || isNaN(uy)) return;

    if (currentSection === '3a' && exerciseMode === 'quadrant-give') {
        var givenQ = getQuadrantOf(ux, uy);

        if (givenQ === targetQuadrant) {
            drawGrid();
            var fitsInGrid = ux >= GX_MIN && ux <= GX_MAX && uy >= GY_MIN && uy <= GY_MAX;
            if (fitsInGrid) {
                drawPoint(ux, uy, '#10b981', pointLabel, 9);
                scrollCanvasToPoint(ux, uy);
            }
            els.feedbackBar.innerText = '✓ Correcte! (' + ux + ', ' + uy + ') està ' + quadrantPrep(targetQuadrant);
            els.feedbackBar.className = 'feedback-bar correct';
            answered = true;
            finalizeProblem();
        } else {
            els.btnCoordSubmit.classList.add('error-shake');
            setTimeout(function () {
                els.btnCoordSubmit.classList.remove('error-shake');
            }, 200);
            els.feedbackBar.innerText =
                '✗ El teu punt és ' + quadrantPrep(givenQ) + '. Necessitem que estigui ' + quadrantPrep(targetQuadrant);
            els.feedbackBar.className = 'feedback-bar wrong';
            penalize();
            els.inputX.value = '';
            els.inputY.value = '';
            // [CANVI 4] Focus condicional en error
            if (isTouchDevice()) {
                kbMarkForOverwrite(els.inputX);
                showCustomKeyboard(els.inputX);
            } else {
                els.inputX.focus();
            }
        }
        return;
    }

    if (exerciseMode !== 'identify') return;

    if (ux === targetX && uy === targetY) {
        drawGrid();
        drawPoint(targetX, targetY, '#10b981', pointLabel, 9);
        els.feedbackBar.innerText = '✓ Correcte! ' + pointLabel + '(' + targetX + ', ' + targetY + ')';
        els.feedbackBar.className = 'feedback-bar correct';
        answered = true;
        finalizeProblem();
    } else {
        els.btnCoordSubmit.classList.add('error-shake');
        setTimeout(function () {
            els.btnCoordSubmit.classList.remove('error-shake');
        }, 200);
        var hint = '';
        if (ux === targetX) hint = ' — La x és correcta, revisa la y';
        else if (uy === targetY) hint = ' — La y és correcta, revisa la x';
        els.feedbackBar.innerText = '✗ (' + ux + ', ' + uy + ') no és correcte' + hint;
        els.feedbackBar.className = 'feedback-bar wrong';
        penalize();
        els.inputX.value = '';
        els.inputY.value = '';
        // [CANVI 4] Focus condicional en error
        if (isTouchDevice()) {
            kbMarkForOverwrite(els.inputX);
            showCustomKeyboard(els.inputX);
        } else {
            els.inputX.focus();
        }
    }
}

// ---- PUNTUACIÓ I TRANSICIONS ----
function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    setTimeout(function () {
        state.attemptsLeft--;
        isPenalizing = false;
        updateGameUI();
        if (state.attemptsLeft <= 0) finalizeProblem(0);
    }, 300);
}

function finalizeProblem(forcedPoints) {
    if (forcedPoints === undefined) forcedPoints = null;
    recordResult(forcedPoints === 0 ? 4 : Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3));
    state.isTransitioning = true;
    els.coordInputArea.classList.remove('active');
    els.quadrantArea.classList.remove('active');

    var pts,
        waitTime = 1500;

    if (forcedPoints !== null) {
        pts = forcedPoints;
        els.miniVicText.innerText = 'Intents esgotats';
        els.miniVicText.style.color = 'var(--danger)';
        els.miniVicIcon.innerText = '❌';
        els.miniVicPoints.innerText = '0 punts';
        els.miniVicPoints.style.color = 'var(--danger)';
        waitTime = 3000;
    } else {
        var fails = MAX_INTENTS - state.attemptsLeft;
        pts = Math.max(0, 10 - fails * 2);
        els.miniVicText.innerText = 'Molt bé!';
        els.miniVicText.style.color = 'var(--primary-dark)';
        els.miniVicIcon.innerText = '⭐';
        els.miniVicPoints.innerText = '+' + pts + ' punts';
        els.miniVicPoints.style.color = 'var(--success)';
    }

    state.sessionScore += pts;
    els.scoreDisplay.innerText = 'Punts: ' + state.sessionScore;
    els.miniOverlay.style.display = 'flex';

    setTimeout(function () {
        els.miniOverlay.style.display = 'none';
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSection();
        } else {
            state.currentOperation++;
            buildExercise();
            els.gamePrompt.classList.add('highlight-new');
            setTimeout(function () {
                els.gamePrompt.classList.remove('highlight-new');
            }, 1200);
        }
    }, waitTime);
}

// ---- FI SECCIÓ I RESULTATS FINALS ----
function endSection() {
    var dn = ['', 'Nivell A', 'Nivell B', 'Nivell C'];
    var sectionLabels = { '3a': '3a · Els 4 quadrants', '3b': '3b · Situa el punt' };
    allResults.push({
        section: currentSection,
        difficulty: dn[difficultyLevel],
        score: state.sessionScore,
        maxScore: TOTAL_OPERATIONS * 10,
    });
    showScreen('session-end-screen');
    els.sessionEndTitle.innerText = sectionLabels[currentSection] + ' completada! (' + dn[difficultyLevel] + ')';
    els.sessionScoreText.innerText = state.sessionScore + ' / ' + TOTAL_OPERATIONS * 10 + ' PUNTS';
    state.isTransitioning = false;
}

function showFinalScreen() {
    renderFinalSummary();
    showScreen('final-screen');
}

function renderFinalSummary() {
    var html = '';
    for (var i = 0; i < allResults.length; i++) {
        var r = allResults[i];
        var notaSessio = (r.score / TOTAL_OPERATIONS).toFixed(1).replace('.', ',');
        html +=
            '<div class="session-line"><span>' +
            r.section +
            ' (' +
            r.difficulty +
            ')</span><span>' +
            notaSessio +
            '</span></div>';
    }

    var nota10 = calculaNotaSobre10().toFixed(1).replace('.', ',');
    var textFinal = MAX_ENLLOC_MITJANA === 1 ? 'La sessió amb nota més alta obté:' : 'La nota mitjana és:';

    html +=
        '<div style="margin-top: 20px; text-align: left;">' +
        '<div style="font-size: 0.95em; color: var(--text-muted); margin-bottom: 5px;">' +
        textFinal +
        '</div>' +
        '<div style="font-size: 2.2em; font-weight: bold; color: var(--success); font-family: monospace;">' +
        nota10 +
        ' / 10</div>' +
        '</div>';

    els.finalSummary.innerHTML = html;
}

function calculaNotaSobre10() {
    if (!allResults.length) return 0;
    if (MAX_ENLLOC_MITJANA === 1) {
        var maxScore = Math.max.apply(
            null,
            allResults.map(function (r) {
                return r.score;
            })
        );
        return Number((maxScore / TOTAL_OPERATIONS).toFixed(1));
    } else {
        var total = 0;
        for (var i = 0; i < allResults.length; i++) total += allResults[i].score;
        return Number((total / (allResults.length * TOTAL_OPERATIONS)).toFixed(1));
    }
}

function finalitzar() {
    window.location.reload();
}

// ---- TECLAT I RESIZE ----
document.addEventListener('keydown', function (e) {
    // [CANVI 3] preventDefault només quan el joc és actiu i hi ha inputs de coordenades visibles
    if (e.key === 'Enter') {
        if (
            els.gameScreen.style.display !== 'none' &&
            (exerciseMode === 'identify' || exerciseMode === 'quadrant-give') &&
            els.coordInputArea.classList.contains('active')
        ) {
            e.preventDefault();
            if (!state.isTransitioning && !isPenalizing) checkCoordInput();
        }
    }
});

window.addEventListener('resize', function () {
    if (els.gameScreen.style.display !== 'none') {
        resizeCanvas();
        drawGrid();
        if ((exerciseMode === 'identify' || exerciseMode === 'quadrant-pick') && !answered) {
            drawPoint(targetX, targetY, '#4f46e5', pointLabel, 9);
        }
        if (answered) drawPoint(targetX, targetY, '#10b981', pointLabel, 9);
    }
});

// [CANVI 5] Botó → del teclat custom: salta de input-x a input-y si x és ple i y buit;
// si tots dos plens (o buits) → valida.
function checkCurrentCell() {
    const xFull = els.inputX && els.inputX.value.trim() !== '';
    const yFull = els.inputY && els.inputY.value.trim() !== '';
    if (xFull && !yFull) {
        showCustomKeyboard(els.inputY);
    } else if (!xFull && yFull) {
        showCustomKeyboard(els.inputX);
    } else {
        checkCoordInput();
    }
}

// [CANVI 1] Injectem manualment el teclat custom al panel (sense injectSharedHTML,
// que duplicaria l'overlay i les pantalles ja existents en aquest joc).
(function injectCustomKeyboard() {
    const panel = document.querySelector('.panel');
    if (!panel || document.getElementById('customKeyboard')) return;
    const kb = document.createElement('div');
    kb.id = 'customKeyboard';
    kb.innerHTML = `
        <div class="kb-grid">
            <button class="kb-btn" data-key="7">7</button>
            <button class="kb-btn" data-key="8">8</button>
            <button class="kb-btn" data-key="9">9</button>
            <button class="kb-btn kb-del" data-key="del">⌫</button>
            <button class="kb-btn" data-key="4">4</button>
            <button class="kb-btn" data-key="5">5</button>
            <button class="kb-btn" data-key="6">6</button>
            <button class="kb-btn kb-minus" data-key="-">−</button>
            <button class="kb-btn" data-key="1">1</button>
            <button class="kb-btn" data-key="2">2</button>
            <button class="kb-btn" data-key="3">3</button>
            <button class="kb-btn kb-enter" data-key="enter">→</button>
            <button class="kb-btn kb-zero" data-key="0">0</button>
        </div>`;
    panel.appendChild(kb);
})();
initCustomKeyboard({ allowNegative: true }); // [CANVI 1] Activa listeners del teclat custom

// Comencem directament al selector de seccions
goToSections();
