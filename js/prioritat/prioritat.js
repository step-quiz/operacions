/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/prioritat/prioritat.js
 * ROL: Controlador del joc «Prioritat d'operacions» (prioritat.html).
 * ARQUITECTURA:
 * - Dues modalitats (paràmetre URL ?modalitat=):
 *     · «Resultat final» (per defecte): l'alumne arrossega (o toca) el valor
 *       de l'expressió entre quatre opcions. Si s'equivoca, el missatge i les
 *       marques de l'expressió li expliquen l'error de prioritat que ha fet.
 *     · «Pas a pas» (?modalitat=passos): l'alumne resol l'expressió operació
 *       a operació. Toca l'operació que es pot fer (si encara no es pot, se li
 *       diu per què) i en tria el resultat; cada pas s'escriu sota l'anterior,
 *       amb el resultat centrat sota l'operació d'on surt.
 * - En acabar cada expressió es veu tota la resolució en una taula «centrada»,
 *   amb l'operació que es fa a cada línia en blau i subratllada (les opcions
 *   «centrat» i «destaca» del projecte combinades).
 * - La matemàtica és a math-engine.js; els textos, a strings.js; l'HTML de
 *   l'expressió i de la taula, a renderer.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, utils.js,
 *      game-core.js, math-engine.js, strings.js i renderer.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS, urlParams } from '../config.js';
import { shuffle } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    hideMiniOverlay,
    injectSharedHTML,
    isTouchDevice,
    recordAnswerToHistory,
    recordResult,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';
import { MathEngine } from './math-engine.js';
import { Strings } from './strings.js';
import { Renderer } from './renderer.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { buildLevel });

// ?modalitat=passos → «Pas a pas»; qualsevol altre valor (o cap) → «Resultat final»
const STEP_MODE = urlParams.get('modalitat') === 'passos';

// ============================================================
// DOM
// ============================================================
const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    expressionBox: document.getElementById('expression-box'),
    stepsBox: document.getElementById('steps-box'),
    stepInstruction: document.getElementById('step-instruction'),
    feedback: document.getElementById('feedback'),
    dropZone: document.getElementById('drop-zone'),
    chipPool: document.getElementById('chip-pool'),
    solutionBox: document.getElementById('solution-box'),
    hintText: document.getElementById('hint-text'),
    dragGhost: document.getElementById('drag-ghost'),
};

// ============================================================
// ESTAT DEL JOC
// ============================================================
const PUNTS = [10, 5, 2, 1]; // punts segons el nombre de fallades abans d'encertar

let _finished = false; // l'exercici actual ja s'ha tancat
let tokens = [];
let correctAnswer = null;
// «Resultat final»
let optionIds = new Map(); // valor → id de l'error (per al feedback)
let _selectedChip = null;
let _touchChip = null;
let _touchStartX = 0;
let _touchStartY = 0;
// «Pas a pas»
let rows = []; // les línies fetes [{ line, op, auto }]; l'última és la de treball
let phase = 'op'; // 'op': cal tocar l'operació · 'result': cal triar-ne el resultat

// El nivell es reparteix al llarg de la sessió: sigui quin sigui el nombre
// d'operacions, la primera és del nivell 0 i l'última del nivell 9.
function levelFor(opIndex) {
    if (TOTAL_OPERATIONS <= 1) return 0;
    return Math.round((opIndex * (MathEngine.LEVELS.length - 1)) / (TOTAL_OPERATIONS - 1));
}

// ============================================================
// RENDERITZAT
// ============================================================

// diag (opcional): { red:Set, green:Set } amb les posicions a marcar
function renderExpression(diag) {
    els.expressionBox.innerHTML = Renderer.expressionHtml(tokens, diag);
}

// La llegenda de les marques: [vermell, verd] (textos de la modalitat)
function legendHtml(red, green) {
    const items = [];
    if (red) items.push(`<span><i class="lg-box lg-red"></i>${red}</span>`);
    if (green) items.push(`<span><i class="lg-box lg-green"></i>${green}</span>`);
    return items.length ? `<div class="fb-legend">${items.join('')}</div>` : '';
}

function diagLegendHtml(diag) {
    if (!diag) return '';
    const orderRed = [...diag.red].some(i => i !== diag.powRed);
    let html = legendHtml(
        orderRed ? "Aquesta operació l'has feta massa aviat" : '',
        diag.green.size ? 'Abans calia fer aquesta' : ''
    );
    if (diag.powRed >= 0) html += legendHtml('Aquesta potència està mal calculada', '');
    return html;
}

function resetDropZone() {
    els.dropZone.className = 'drop-zone';
    els.dropZone.innerHTML = '<span class="dz-placeholder">Arrossega aquí</span>';
}

function renderChipPool(values) {
    els.chipPool.innerHTML = '';
    values.forEach(val => {
        const chip = document.createElement('div');
        chip.className = 'num-chip';
        chip.textContent = val;
        chip.dataset.val = val;
        chip.setAttribute('role', 'button');
        chip.setAttribute('aria-label', `Resposta ${val}`);

        chip.addEventListener('click', () => _selectChip(chip));

        chip.draggable = true;
        chip.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', String(val));
            setTimeout(() => chip.classList.add('dragging'), 0);
        });
        chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
        chip.addEventListener('touchstart', _onTouchStart, { passive: false });

        els.chipPool.appendChild(chip);
    });
}

// La resolució «de llibre», en una taula centrada (modalitat «Resultat final»)
function renderSolution(ok) {
    const title = ok
        ? "✅ Correcte! Es resol d'aquesta manera:"
        : `La resposta correcta és <strong>${correctAnswer}</strong>. Es resol d'aquesta manera:`;
    const table = Renderer.tableHtml(MathEngine.solve(MathEngine.startLine(tokens)));
    els.solutionBox.innerHTML = `<div class="solution-title">${title}</div><div class="taula-wrap">${table}</div>`;
    els.solutionBox.style.display = 'block';
}

// ============================================================
// CONSTRUCCIÓ DE CADA EXERCICI
// ============================================================
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    _finished = false;
    _selectedChip = null;

    const ex = MathEngine.generateExercise(levelFor(state.currentOperation));
    tokens = ex.toks;
    correctAnswer = ex.val;

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    els.feedback.textContent = '';
    els.solutionBox.style.display = 'none';
    els.solutionBox.innerHTML = '';

    if (STEP_MODE) buildStepLevel();
    else buildResultLevel();
    updateHeader();
}

function buildResultLevel() {
    const distractors = MathEngine.buildDistractors(tokens, correctAnswer);
    optionIds = new Map(distractors.map(d => [d.v, d.id]));
    const values = shuffle([correctAnswer, ...distractors.map(d => d.v)]);

    renderExpression();
    els.stepInstruction.textContent = 'Quant val aquesta expressió?';
    resetDropZone();
    renderChipPool(values);
    els.chipPool.style.display = 'flex';
    els.hintText.style.display = 'block';
    els.hintText.textContent = isTouchDevice()
        ? 'Toca la resposta i després toca la casella (o arrossega-la).'
        : 'Arrossega la resposta fins a la casella (o clica-la i després clica la casella).';
}

function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `${STEP_MODE ? 'Expressió' : 'Operació'} ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft < 2 ? ' danger' : '');
}

// ============================================================
// «RESULTAT FINAL» · INTERACCIÓ: selecció per toc/clic
// ============================================================
function _selectChip(chip) {
    if (state.isTransitioning) return;
    if (chip.classList.contains('used') || chip.classList.contains('chip-wrong')) return;
    if (_selectedChip === chip) {
        chip.classList.remove('chip-selected');
        _selectedChip = null;
        return;
    }
    if (_selectedChip) _selectedChip.classList.remove('chip-selected');
    _selectedChip = chip;
    chip.classList.add('chip-selected');
}

// ---- Casella: esdeveniments HTML5 (escriptori) ----
els.dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    els.dropZone.classList.add('dz-over');
});
els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dz-over'));
els.dropZone.addEventListener('drop', e => {
    e.preventDefault();
    els.dropZone.classList.remove('dz-over');
    const raw = e.dataTransfer.getData('text/plain');
    if (raw !== '') handleAnswer(Number(raw));
});
// Tocar/clicar la casella amb un xip seleccionat
els.dropZone.addEventListener('pointerup', () => {
    if (!_selectedChip || state.isTransitioning) return;
    const val = Number(_selectedChip.dataset.val);
    _selectedChip.classList.remove('chip-selected');
    _selectedChip = null;
    handleAnswer(val);
});

// ---- Drag tàctil (mateix patró que vocabulari.html) ----
// Com que preventDefault() al touchstart anul·la el 'click' en mòbil,
// un toc sense desplaçament es tracta aquí mateix com a selecció.
function _onTouchStart(e) {
    if (state.isTransitioning) return;
    e.preventDefault();
    _touchChip = e.currentTarget;
    const touch = e.touches[0];
    _touchStartX = touch.clientX;
    _touchStartY = touch.clientY;
    els.dragGhost.textContent = _touchChip.dataset.val;
    document.addEventListener('touchmove', _onTouchMove, { passive: false });
    document.addEventListener('touchend', _onTouchEnd, { passive: false });
    document.addEventListener('touchcancel', _onTouchCancel, { passive: false });
}
function _onTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (els.dragGhost.style.display !== 'block' && Math.hypot(t.clientX - _touchStartX, t.clientY - _touchStartY) > 8) {
        els.dragGhost.style.display = 'block';
    }
    if (els.dragGhost.style.display === 'block') _moveGhost(t.clientX, t.clientY);
}
function _moveGhost(cx, cy) {
    els.dragGhost.style.left = cx - els.dragGhost.offsetWidth / 2 + 'px';
    els.dragGhost.style.top = cy - 20 + 'px';
}
function _onTouchEnd(e) {
    const wasDragging = els.dragGhost.style.display === 'block';
    els.dragGhost.style.display = 'none';
    _removeTouchListeners();
    const chip = _touchChip;
    _touchChip = null;
    if (!chip) return;
    if (!wasDragging) {
        _selectChip(chip);
        return;
    } // toc simple → selecciona
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.closest('#drop-zone')) {
        if (_selectedChip) {
            _selectedChip.classList.remove('chip-selected');
            _selectedChip = null;
        }
        handleAnswer(Number(chip.dataset.val));
    }
}
function _onTouchCancel() {
    els.dragGhost.style.display = 'none';
    _touchChip = null;
    _removeTouchListeners();
}
function _removeTouchListeners() {
    document.removeEventListener('touchmove', _onTouchMove);
    document.removeEventListener('touchend', _onTouchEnd);
    document.removeEventListener('touchcancel', _onTouchCancel);
}

// ---- Comprovació de la resposta ----
function handleAnswer(val) {
    if (state.isTransitioning || correctAnswer === null) return;
    const chip = [...els.chipPool.querySelectorAll('.num-chip')].find(c => Number(c.dataset.val) === val);
    if (!chip || chip.classList.contains('used') || chip.classList.contains('chip-wrong')) return;

    const exprText = Strings.toText(tokens);

    if (val === correctAnswer) {
        chip.classList.add('used');
        els.dropZone.className = 'drop-zone dz-correct';
        els.dropZone.textContent = String(val);
        els.feedback.textContent = '';
        renderExpression();
        recordAnswerToHistory(`${exprText} = ?`, String(val), true);
        finishOperation(true);
    } else {
        chip.classList.add('chip-wrong');
        els.dropZone.classList.add('dz-wrong');
        setTimeout(() => els.dropZone.classList.remove('dz-wrong'), 400);
        const errId = optionIds.get(val) || 'calc';
        const diag = errId === 'calc' ? null : MathEngine.diagnose(tokens, errId);
        renderExpression(diag);
        els.feedback.innerHTML =
            `<div>${val} no és correcte. ${Strings.feedbackFor(errId, tokens, diag)}</div>` + diagLegendHtml(diag);
        recordAnswerToHistory(`${exprText} = ?`, String(val), false);
        penalize();
    }
}

// ============================================================
// «PAS A PAS»
// Cada línia de la taula és un pas. A la de sota (la de treball), els signes
// i les potències són botons: l'alumne toca l'operació que es pot fer i, si
// és bona, en tria el resultat entre quatre; el resultat s'escriu a la línia
// següent, centrat sota l'operació (que queda en blau i subratllada).
// ============================================================
function buildStepLevel() {
    rows = [{ line: MathEngine.startLine(tokens), op: -1 }];
    renderSteps();
    askOp();
}

// marks (opcional): { red:Set, green:Set } amb posicions de la línia de treball
function renderSteps(marks = {}) {
    const active = !_finished && phase === 'op';
    const table = Renderer.tableHtml(rows, { active, red: marks.red, green: marks.green });
    els.stepsBox.innerHTML = `<div class="taula-wrap">${table}</div>`;
}

function askOp() {
    phase = 'op';
    els.stepInstruction.textContent = Strings.Step.chooseOp;
    els.chipPool.innerHTML = '';
    els.chipPool.style.display = 'none';
    els.hintText.style.display = 'block';
    els.hintText.textContent = Strings.Step.chooseOpHint;
}

function askResult() {
    phase = 'result';
    const { line, op } = rows[rows.length - 1];
    const values = shuffle([MathEngine.opValue(line, op), ...MathEngine.stepDistractors(line, op)]);
    els.stepInstruction.textContent = Strings.Step.result(line, op);
    els.chipPool.innerHTML = '';
    values.forEach(val => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'num-chip';
        chip.textContent = val;
        chip.dataset.val = val;
        chip.setAttribute('aria-label', `Resultat ${val}`);
        chip.addEventListener('click', () => handleStepResult(val, chip));
        els.chipPool.appendChild(chip);
    });
    els.chipPool.style.display = 'flex';
    els.hintText.textContent = Strings.Step.resultHint;
}

// L'alumne ha tocat l'operació de la posició i de la línia de treball
function handleStepOp(i) {
    if (state.isTransitioning || _finished || phase !== 'op') return;
    const row = rows[rows.length - 1];
    const line = row.line;
    if (MathEngine.readyOps(line).includes(i)) {
        row.op = i;
        els.feedback.textContent = '';
        askResult();
        renderSteps();
        return;
    }
    const bl = MathEngine.blockers(line, i);
    if (!bl) return;
    renderSteps({ red: new Set([i]), green: new Set(bl.green) });
    els.feedback.innerHTML =
        `<div>${Strings.blockerMsg(bl, line)}</div>` + legendHtml(Strings.Step.legendRed, Strings.Step.legendGreen);
    recordAnswerToHistory(`${Strings.toText(line)} (quina operació toca?)`, Strings.opLabel(line[i]), false);
    penalize();
}

// L'alumne ha triat el resultat val de l'operació escollida
function handleStepResult(val, chip) {
    if (state.isTransitioning || _finished || phase !== 'result') return;
    if (chip.classList.contains('chip-wrong')) return;
    const row = rows[rows.length - 1];
    if (val !== MathEngine.opValue(row.line, row.op)) {
        chip.classList.add('chip-wrong');
        els.feedback.innerHTML = `<div>${Strings.wrongResultMsg(row.line, row.op, val)}</div>`;
        recordAnswerToHistory(`${Strings.opText(row.line, row.op)} = ?`, String(val), false);
        penalize();
        return;
    }
    const next = MathEngine.applyAt(row.line, row.op);
    rows.push({ line: next, op: -1 });
    els.feedback.textContent = '';
    if (MathEngine.isDone(next)) {
        recordAnswerToHistory(`${Strings.toText(tokens)} = ?`, String(correctAnswer), true);
        finishOperation(true);
    } else {
        askOp();
        renderSteps();
    }
}

// Sense intents: la resolució s'acaba sola (les línies que falten, en gris)
function completeSteps() {
    const row = rows[rows.length - 1];
    if (phase === 'result') rows.push({ line: MathEngine.applyAt(row.line, row.op), op: -1, auto: true });
    const rest = MathEngine.solve(rows[rows.length - 1].line);
    rows[rows.length - 1].op = rest[0].op;
    rest.slice(1).forEach(r => rows.push({ line: r.line, op: r.op, auto: true }));
}

els.stepsBox.addEventListener('click', e => {
    const btn = e.target.closest('.tok-btn');
    if (btn) handleStepOp(Number(btn.dataset.i));
});

// ============================================================
// INTENTS
// L'intent es descompta a l'instant. El parpelleig del comptador és només
// visual: NO bloqueja l'entrada (abans, durant 0,8 s s'ignoraven els tocs,
// i si l'alumne tocava de seguida l'última opció, no passava res).
// ============================================================
function penalize() {
    state.attemptsLeft--;
    updateHeader();
    const ad = els.attemptsDisplay;
    ad.classList.remove('blink-error');
    void ad.offsetWidth; // reinicia l'animació si ja estava activa
    ad.classList.add('blink-error');
    setTimeout(() => ad.classList.remove('blink-error'), 800);
    if (state.attemptsLeft <= 0) {
        state.isTransitioning = true; // ja no s'accepten més respostes
        setTimeout(() => finishOperation(false), 700); // temps per veure l'error abans de la solució
    }
}

// ============================================================
// FI DE L'EXERCICI: resolució + overlay + botó "Següent"
// (sense temporitzador: l'alumne decideix quan ha entès la resolució)
// ============================================================
function finishOperation(ok) {
    if (_finished) return;
    _finished = true;
    state.isTransitioning = true;

    const fails = MAX_INTENTS - state.attemptsLeft;
    const levelPoints = ok ? PUNTS[Math.min(fails, PUNTS.length - 1)] : 0;
    state.sessionScore += levelPoints;
    recordResult(ok ? Math.min(fails + 1, 3) : 4);
    updateHeader();

    if (_selectedChip) {
        _selectedChip.classList.remove('chip-selected');
        _selectedChip = null;
    }
    els.chipPool.style.display = 'none';
    els.hintText.style.display = 'none';
    if (STEP_MODE) {
        // Es mantenen el missatge i les marques de l'últim error, per comparar-los amb la resolució
        if (!ok) completeSteps();
        renderSteps();
        els.stepInstruction.textContent = '';
        els.solutionBox.innerHTML = `<div class="solution-title">${ok ? '✅ ' + Strings.Step.doneOk : Strings.Step.doneFail}</div>`;
        els.solutionBox.style.display = 'block';
    } else {
        if (!ok) {
            // Es mantenen les marques de l'últim error perquè l'alumne les compari amb la resolució
            els.dropZone.className = 'drop-zone dz-reveal';
            els.dropZone.textContent = String(correctAnswer);
        }
        renderSolution(ok);
    }
    showMiniOverlay(levelPoints, { successColor: 'var(--primary-dark)' });

    const isLast = state.currentOperation + 1 >= TOTAL_OPERATIONS;
    const btn = document.createElement('button');
    btn.className = 'btn-next';
    btn.id = 'btn-next';
    btn.textContent = isLast ? 'Veure resultats' : 'Següent';
    btn.addEventListener('click', goNext);
    els.solutionBox.appendChild(btn);
    if (isTouchDevice()) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    else btn.focus({ preventScroll: true });
}

function goNext() {
    const btn = document.getElementById('btn-next');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    hideMiniOverlay();
    if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
        endSession();
    } else {
        state.currentOperation++;
        window.buildLevel();
    }
}

// Enter = "Següent" (escriptori)
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const btn = document.getElementById('btn-next');
    if (btn && !btn.disabled && els.gameScreen.style.display !== 'none') {
        e.preventDefault();
        goNext();
    }
});

// ============================================================
// ARRENCADA
// ============================================================
if (STEP_MODE) els.body.classList.add('mode-passos');
injectSharedHTML();
validateConfig();
startGame();
