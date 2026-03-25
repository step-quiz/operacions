/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estadistica/estadistica.js
 * ROL: Controlador DOM del joc d'estadística descriptiva.
 * ARQUITECTURA:
 * - L'exercici es divideix en fases dins d'una sola "operació" de game-core:
 *   DISCRET:  FI → HI_PCT → MEAN → MEDIAN → MODE
 *   AGRUPAT:  SELECT → MARCA → FI → HI_PCT → MEAN → MEDIAN_INT → MODE_INT
 * - Cada fase de taula valida totes les cel·les alhora (verd/vermell).
 * - Cada fase d'estadístic valida un sol input.
 * - Puntuació: 10 − totalErrors (mínim 0).
 * DEPENDÈNCIES: utils, config, game-core, math-engine, strings, question-bank.
 * ============================================================================
 */

// ── ESTAT ────────────────────────────────────────────────────────────────
let dataset       = null;    // dades generades
let tableData     = null;    // taula precomputada
let totalErrors   = 0;       // errors acumulats a tota l'operació
let currentPhase  = '';
let phaseList     = [];
let phaseIdx      = 0;

// Color-coding de les dades brutes (per ajudar al recompte)
let valueColors   = {};      // { valor: índex de color }
let nextColorIdx  = 0;
const DATA_PALETTE = [
    { bg: '#fed7aa', border: '#f97316', text: '#7c2d12' }, // taronja
    { bg: '#bfdbfe', border: '#3b82f6', text: '#1e3a8a' }, // blau
    { bg: '#bbf7d0', border: '#16a34a', text: '#14532d' }, // verd
    { bg: '#e9d5ff', border: '#9333ea', text: '#4c1d95' }, // violeta
    { bg: '#fde68a', border: '#d97706', text: '#78350f' }, // groc
    { bg: '#fecdd3', border: '#e11d48', text: '#881337' }, // rosa-vermell
    { bg: '#a5f3fc', border: '#0891b2', text: '#164e63' }, // cian
    { bg: '#d9f99d', border: '#65a30d', text: '#365314' }, // llima
];

const ME = MathEngine;
const S  = Strings;

const els = {
    scoreDisplay:    document.getElementById('score-display'),
    lvlDisplay:      document.getElementById('lvl-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    contextBox:      document.getElementById('context-box'),
    dataGrid:        document.getElementById('data-grid'),
    phaseTitle:      document.getElementById('phase-title'),
    tableWrap:       document.getElementById('table-wrap'),
    statsWrap:       document.getElementById('stats-wrap'),
    feedback:        document.getElementById('missatge-feedback'),
    btnCheck:        document.getElementById('btn-check'),
    hintBar:         document.getElementById('hint-bar'),
    stepDots:        document.getElementById('step-dots'),
};

// ── BUILDLEVEL (crida de game-core) ──────────────────────────────────────
function buildLevel() {
    isTransitioning = false;
    totalErrors     = 0;
    phaseIdx        = 0;
    valueColors     = {};
    nextColorIdx    = 0;

    els.lvlDisplay.innerHTML = `Sessió ${currentSession + 1} de ${TOTAL_SESSIONS} &nbsp;·&nbsp; Exercici ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText    = 'Punts: 0';
    els.feedback.style.opacity    = '0';
    els.feedback.innerHTML        = '';

    // Genera dades
    dataset = QuestionBank.generateDataset();

    // Context i dades brutes
    els.contextBox.innerHTML = dataset.context;
    renderDataGrid(dataset.data, dataset.unit);

    // Decideix fases
    if (dataset.type === 'discrete') {
        tableData = ME.discreteFreqTable(dataset.data);
        tableData.hi  = ME.relativeFreq(tableData.fi, tableData.n);
        tableData.pct = ME.percentage(tableData.hi);
        phaseList = ['FI', 'HI_PCT', 'MEAN', 'MEDIAN', 'MODE'];
    } else {
        // Primer: triar intervals
        phaseList = ['SELECT', 'MARCA', 'FI', 'HI_PCT', 'MEAN', 'MEDIAN_INT', 'MODE_INT'];
    }

    renderStepDots();
    startPhase();
}

// ── RENDERITZAR DADES BRUTES ─────────────────────────────────────────────
function renderDataGrid(data, unit) {
    let html = '<div class="data-grid-inner">';
    data.forEach((v, i) => {
        const valStr = typeof v === 'number' && !Number.isInteger(v) ? ME.fmt(v, 1) : String(v);
        html += `<span class="data-cell" data-val="${v}" data-idx="${i}">${valStr}</span>`;
    });
    html += '</div>';
    els.dataGrid.innerHTML = html;

    // Click handler: assigna color a tots els del mateix valor
    els.dataGrid.querySelectorAll('.data-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const val = cell.dataset.val;
            if (valueColors[val] !== undefined) return; // ja assignat
            const c = DATA_PALETTE[nextColorIdx % DATA_PALETTE.length];
            valueColors[val] = nextColorIdx;
            nextColorIdx++;
            // Aplica color a totes les cel·les amb el mateix valor
            els.dataGrid.querySelectorAll(`.data-cell[data-val="${val}"]`).forEach(c2 => {
                const col = DATA_PALETTE[valueColors[val]];
                c2.style.background    = col.bg;
                c2.style.borderColor   = col.border;
                c2.style.color         = col.text;
                c2.style.cursor        = 'default';
            });
        });
    });
}

// ── RESTAURAR COLORS ACTUALS ALS DATA-CELLS (en canviar de fase) ─────────
function reapplyDataColors() {
    els.dataGrid.querySelectorAll('.data-cell').forEach(cell => {
        const val = cell.dataset.val;
        if (valueColors[val] !== undefined) {
            const col = DATA_PALETTE[valueColors[val]];
            cell.style.background  = col.bg;
            cell.style.borderColor = col.border;
            cell.style.color       = col.text;
            cell.style.cursor      = 'default';
        }
    });
}

// ── STEP DOTS ────────────────────────────────────────────────────────────
function renderStepDots() {
    let html = '';
    phaseList.forEach((_, i) => {
        if (i > 0) html += '<div class="sd-conn"></div>';
        const cls = i < phaseIdx ? 'sd-done' : i === phaseIdx ? 'sd-cur' : '';
        html += `<div class="sd-dot ${cls}"></div>`;
    });
    els.stepDots.innerHTML = html;
}

// ── GESTIÓ DE FASES ──────────────────────────────────────────────────────
function startPhase() {
    currentPhase = phaseList[phaseIdx];
    els.feedback.style.opacity = '0';
    els.feedback.innerHTML = '';
    els.statsWrap.innerHTML = '';
    els.statsWrap.style.display = 'none';
    els.btnCheck.style.display = 'inline-block';
    els.hintBar.innerHTML = '';
    renderStepDots();
    reapplyDataColors();

    switch (currentPhase) {
        case 'SELECT':       renderSelectInterval(); break;
        case 'MARCA':        renderMarcaPhase();     break;
        case 'FI':           renderFiPhase();        break;
        case 'HI_PCT':       renderHiPctPhase();     break;
        case 'MEAN':         renderStatInput(S.Phases.mean, 'mean');          break;
        case 'MEDIAN':       renderStatInput(S.Phases.median, 'median');      break;
        case 'MODE':         renderStatInput(S.Phases.mode, 'mode');          break;
        case 'MEDIAN_INT':   renderStatSelect(S.Phases.medianInterval, 'medianInt'); break;
        case 'MODE_INT':     renderStatSelect(S.Phases.modeInterval, 'modeInt');     break;
    }
}

function advancePhase() {
    phaseIdx++;
    if (phaseIdx >= phaseList.length) {
        finishExercise();
    } else {
        startPhase();
    }
}

// ── FASE SELECT: triar intervals ─────────────────────────────────────────
function renderSelectInterval() {
    els.phaseTitle.innerHTML = S.Phases.selectInterval;
    els.tableWrap.innerHTML  = '';
    els.btnCheck.style.display = 'none';

    const wrap = document.createElement('div');
    wrap.className = 'interval-options';
    dataset.intervalOptions.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn-interval-option';
        // Mostra etiqueta + previsualització dels intervals
        const preview = [];
        for (let j = 0; j < opt.limits.length - 1; j++) {
            const lo = opt.limits[j], hi = opt.limits[j + 1];
            const bracket = j === opt.limits.length - 2 ? ']' : ')';
            preview.push(`[${lo}, ${hi}${bracket}`);
        }
        btn.innerHTML = `<strong>${opt.label}</strong><span class="interval-preview">${preview.join(' &nbsp;|&nbsp; ')}</span>`;
        btn.onclick = () => selectInterval(i);
        wrap.appendChild(btn);
    });
    els.tableWrap.appendChild(wrap);
}

function selectInterval(idx) {
    const opt = dataset.intervalOptions[idx];
    tableData = ME.groupedFreqTable(dataset.data, opt.limits);
    tableData.hi  = ME.relativeFreq(tableData.fi, tableData.n);
    tableData.pct = ME.percentage(tableData.hi);
    advancePhase();
}

// ── FASE MARCA: marques de classe ────────────────────────────────────────
function renderMarcaPhase() {
    els.phaseTitle.innerHTML = S.Phases.marca;
    els.hintBar.innerHTML    = `<span class="hint-text">💡 ${S.Feedback.hintMarca}</span>`;
    const rows = tableData.intervals.length;
    let html = '<table class="freq-table"><thead><tr><th>Interval</th><th>Marca de classe (x<sub>i</sub>)</th></tr></thead><tbody>';
    tableData.intervals.forEach((iv, i) => {
        const bracket = i === rows - 1 ? ']' : ')';
        html += `<tr><td class="cell-label">[${iv.lo}, ${iv.hi}${bracket}</td><td><input class="cell-input" id="marca-${i}" inputmode="decimal" autocomplete="off"></td></tr>`;
    });
    html += '</tbody></table>';
    els.tableWrap.innerHTML = html;
    focusFirst();
}

// ── FASE FI: freqüència absoluta ─────────────────────────────────────────
function renderFiPhase() {
    els.phaseTitle.innerHTML = S.Phases.fi;
    els.hintBar.innerHTML    = '';
    const isGrouped = dataset.type === 'grouped';
    const rows = isGrouped ? tableData.intervals.length : tableData.values.length;

    let html = '<table class="freq-table"><thead><tr>';
    html += isGrouped ? '<th>Interval</th><th>Marca (x<sub>i</sub>)</th>' : `<th>${dataset.label} (x)</th>`;
    html += '<th>F<sub>a</sub></th></tr></thead><tbody>';

    for (let i = 0; i < rows; i++) {
        html += '<tr>';
        if (isGrouped) {
            const iv = tableData.intervals[i];
            const bracket = i === rows - 1 ? ']' : ')';
            html += `<td class="cell-label">[${iv.lo}, ${iv.hi}${bracket}</td>`;
            html += `<td class="cell-fixed">${ME.fmt(iv.marca, 1)}</td>`;
        } else {
            html += `<td class="cell-fixed">${tableData.values[i]}</td>`;
        }
        html += `<td><input class="cell-input" id="fi-${i}" inputmode="numeric" autocomplete="off"></td>`;
        html += '</tr>';
    }
    html += `</tbody><tfoot><tr><td ${isGrouped ? 'colspan="2"' : ''} class="cell-label">Total</td><td class="cell-fixed">${tableData.n}</td></tr></tfoot></table>`;
    els.tableWrap.innerHTML = html;
    focusFirst();
}

// ── FASE HI_PCT: relativa i percentatge ──────────────────────────────────
function renderHiPctPhase() {
    els.phaseTitle.innerHTML = S.Phases.hiPct;
    els.hintBar.innerHTML    = `<span class="hint-text">💡 ${S.Feedback.hintHi}</span>`;
    const isGrouped = dataset.type === 'grouped';
    const rows = isGrouped ? tableData.intervals.length : tableData.values.length;

    let html = '<table class="freq-table"><thead><tr>';
    html += isGrouped ? '<th>Interval</th>' : `<th>x</th>`;
    html += '<th>F<sub>a</sub></th><th>f<sub>r</sub></th><th>%</th></tr></thead><tbody>';

    for (let i = 0; i < rows; i++) {
        html += '<tr>';
        if (isGrouped) {
            const iv = tableData.intervals[i];
            const bracket = i === rows - 1 ? ']' : ')';
            html += `<td class="cell-label">[${iv.lo}, ${iv.hi}${bracket}</td>`;
        } else {
            html += `<td class="cell-fixed">${tableData.values[i]}</td>`;
        }
        html += `<td class="cell-fixed">${tableData.fi[i]}</td>`;
        html += `<td><input class="cell-input cell-sm" id="hi-${i}" inputmode="decimal" autocomplete="off"></td>`;
        html += `<td><input class="cell-input cell-sm" id="pct-${i}" inputmode="decimal" autocomplete="off"></td>`;
        html += '</tr>';
    }
    html += `</tbody><tfoot><tr><td class="cell-label"${isGrouped ? '' : ''}>Total</td><td class="cell-fixed">${tableData.n}</td><td class="cell-fixed">1,00</td><td class="cell-fixed">100</td></tr></tfoot></table>`;
    els.tableWrap.innerHTML = html;
    focusFirst();
}

// ── FASES ESTADÍSTICS: input numèric ─────────────────────────────────────
function renderStatInput(title, statId) {
    els.phaseTitle.innerHTML = title;
    els.tableWrap.innerHTML  = '';
    showReadOnlyTable();
    els.statsWrap.style.display = 'block';

    let hintText = '';
    if (statId === 'mean') {
        const isGr = dataset.type === 'grouped';
        hintText = isGr
            ? 'Mitjana = Σ(marca<sub>i</sub> · F<sub>a</sub>) / n'
            : 'Mitjana = Σ(x · F<sub>a</sub>) / n';
    } else if (statId === 'median') {
        hintText = 'Ordena les dades i busca el valor central (posició ' + (tableData.n % 2 === 0 ? (tableData.n / 2) + ' i ' + (tableData.n / 2 + 1) : Math.ceil(tableData.n / 2)) + ').';
    } else if (statId === 'mode') {
        hintText = 'La moda és el valor de x amb la freqüència absoluta (F<sub>a</sub>) més alta.';
    }
    els.hintBar.innerHTML = `<span class="hint-text">💡 ${hintText}</span>`;

    els.statsWrap.innerHTML = `
        <div class="stat-question">
            <input class="stat-input" id="stat-input" inputmode="decimal" autocomplete="off" placeholder="Escriu la resposta">
        </div>`;
    document.getElementById('stat-input').focus();
}

// ── FASES ESTADÍSTICS: selecció d'interval ───────────────────────────────
function renderStatSelect(title, statId) {
    els.phaseTitle.innerHTML = title;
    els.tableWrap.innerHTML  = '';
    showReadOnlyTable();
    els.statsWrap.style.display = 'block';
    els.btnCheck.style.display  = 'none';

    let hintText = statId === 'medianInt'
        ? 'Busca l\'interval on la freqüència acumulada arriba a la posició central (n/2 = ' + (tableData.n / 2) + ').'
        : 'L\'interval modal és el que té la freqüència absoluta més alta.';
    els.hintBar.innerHTML = `<span class="hint-text">💡 ${hintText}</span>`;

    const rows = tableData.intervals.length;
    let html = '<div class="interval-select-grid">';
    for (let i = 0; i < rows; i++) {
        const iv = tableData.intervals[i];
        const bracket = i === rows - 1 ? ']' : ')';
        html += `<button class="btn-interval-choice" data-idx="${i}" onclick="selectStatInterval(${i}, '${statId}')">[${iv.lo}, ${iv.hi}${bracket}</button>`;
    }
    html += '</div>';
    els.statsWrap.innerHTML = html;
}

function selectStatInterval(idx, statId) {
    let correctIdx;
    if (statId === 'medianInt') {
        correctIdx = ME.medianGroupedIndex(tableData.fi, tableData.n);
    } else {
        const modes = ME.modeGroupedIndex(tableData.fi);
        correctIdx = modes[0]; // primer interval modal
        if (modes.includes(idx)) correctIdx = idx; // acceptar qualsevol
    }

    const btns = document.querySelectorAll('.btn-interval-choice');
    const clicked = document.querySelector(`.btn-interval-choice[data-idx="${idx}"]`);

    if (idx === correctIdx || (statId === 'modeInt' && ME.modeGroupedIndex(tableData.fi).includes(idx))) {
        clicked.classList.add('choice-correct');
        btns.forEach(b => b.disabled = true);
        showFeedback(S.Feedback.correct, 'ok');
        recordAnswerToHistory(S.Phases[statId === 'medianInt' ? 'medianInterval' : 'modeInterval'], fmtInterval(idx), true);
        setTimeout(advancePhase, 1200);
    } else {
        clicked.classList.add('choice-wrong');
        clicked.disabled = true;
        totalErrors++;
        showFeedback(S.Feedback.wrongInterval, 'err');
    }
}

function fmtInterval(i) {
    const iv = tableData.intervals[i];
    const bracket = i === tableData.intervals.length - 1 ? ']' : ')';
    return `[${iv.lo}, ${iv.hi}${bracket}`;
}

// ── TAULA NOMÉS LECTURA (per a la fase d'estadístics) ────────────────────
function showReadOnlyTable() {
    const isGrouped = dataset.type === 'grouped';
    const rows = isGrouped ? tableData.intervals.length : tableData.values.length;
    let html = '<table class="freq-table freq-table-readonly"><thead><tr>';
    if (isGrouped) html += '<th>Interval</th><th>Marca</th>';
    else html += '<th>x</th>';
    html += '<th>F<sub>a</sub></th><th>f<sub>r</sub></th><th>%</th></tr></thead><tbody>';
    for (let i = 0; i < rows; i++) {
        html += '<tr>';
        if (isGrouped) {
            const iv = tableData.intervals[i];
            const bracket = i === rows - 1 ? ']' : ')';
            html += `<td class="cell-label">[${iv.lo}, ${iv.hi}${bracket}</td><td class="cell-fixed">${ME.fmt(iv.marca, 1)}</td>`;
        } else {
            html += `<td class="cell-fixed">${tableData.values[i]}</td>`;
        }
        html += `<td class="cell-fixed">${tableData.fi[i]}</td>`;
        html += `<td class="cell-fixed">${ME.fmt(tableData.hi[i], 4)}</td>`;
        html += `<td class="cell-fixed">${ME.fmt(tableData.pct[i], 2)}</td>`;
        html += '</tr>';
    }
    html += '</tbody></table>';
    els.tableWrap.innerHTML = html;
}

// ── CHECK BUTTON (dispatcher) ────────────────────────────────────────────
function checkCurrentStep() {
    switch (currentPhase) {
        case 'MARCA':       checkMarca();   break;
        case 'FI':          checkFi();      break;
        case 'HI_PCT':      checkHiPct();   break;
        case 'MEAN':        checkStat('mean');    break;
        case 'MEDIAN':      checkStat('median');  break;
        case 'MODE':        checkStat('mode');    break;
    }
}

// ── VALIDADORS DE TAULA ──────────────────────────────────────────────────

function checkMarca() {
    const rows = tableData.intervals.length;
    if (!allFilled('marca-', rows)) { showFeedback(S.Feedback.fillAll, 'warn'); return; }
    let nErr = 0;
    for (let i = 0; i < rows; i++) {
        const inp = document.getElementById(`marca-${i}`);
        if (inp.classList.contains('cell-ok')) continue;
        const val = ME.parseInput(inp.value);
        if (ME.approxEqual(val, tableData.intervals[i].marca, 0.05)) {
            markOk(inp);
        } else {
            markErr(inp); nErr++;
        }
    }
    if (nErr === 0) { showFeedback(S.Feedback.allCorrect, 'ok'); setTimeout(advancePhase, 1000); }
    else { totalErrors += nErr; showFeedback(S.Feedback.someWrong(nErr, rows), 'err'); }
}

function checkFi() {
    const rows = dataset.type === 'grouped' ? tableData.intervals.length : tableData.values.length;
    if (!allFilled('fi-', rows)) { showFeedback(S.Feedback.fillAll, 'warn'); return; }
    let nErr = 0;
    for (let i = 0; i < rows; i++) {
        const inp = document.getElementById(`fi-${i}`);
        if (inp.classList.contains('cell-ok')) continue;
        const val = ME.parseInput(inp.value);
        if (val === tableData.fi[i]) {
            markOk(inp);
        } else {
            markErr(inp); nErr++;
        }
    }
    if (nErr === 0) { showFeedback(S.Feedback.allCorrect, 'ok'); setTimeout(advancePhase, 1000); }
    else { totalErrors += nErr; showFeedback(S.Feedback.someWrong(nErr, rows), 'err'); }
}

function checkHiPct() {
    const rows = dataset.type === 'grouped' ? tableData.intervals.length : tableData.values.length;
    if (!allFilled('hi-', rows) || !allFilled('pct-', rows)) { showFeedback(S.Feedback.fillAll, 'warn'); return; }
    let nErr = 0;
    for (let i = 0; i < rows; i++) {
        const hiInp  = document.getElementById(`hi-${i}`);
        const pctInp = document.getElementById(`pct-${i}`);
        if (!hiInp.classList.contains('cell-ok')) {
            const hVal = ME.parseInput(hiInp.value);
            if (ME.approxEqual(hVal, tableData.hi[i], 0.006)) markOk(hiInp);
            else { markErr(hiInp); nErr++; }
        }
        if (!pctInp.classList.contains('cell-ok')) {
            const pVal = ME.parseInput(pctInp.value);
            if (ME.approxEqual(pVal, tableData.pct[i], 0.15)) markOk(pctInp);
            else { markErr(pctInp); nErr++; }
        }
    }
    if (nErr === 0) { showFeedback(S.Feedback.allCorrect, 'ok'); setTimeout(advancePhase, 1000); }
    else { totalErrors += nErr; showFeedback(S.Feedback.someWrong(nErr, rows * 2), 'err'); }
}

// ── VALIDADOR D'ESTADÍSTICS ──────────────────────────────────────────────

function checkStat(statId) {
    const inp = document.getElementById('stat-input');
    const val = ME.parseInput(inp.value);
    if (isNaN(val)) { showFeedback(S.Feedback.fillAll, 'warn'); return; }

    let correct, tolerance = 0.05, wrongMsg;
    const isGrouped = dataset.type === 'grouped';

    if (statId === 'mean') {
        correct = isGrouped
            ? ME.meanGrouped(tableData.intervals, tableData.fi, tableData.n)
            : ME.meanDiscrete(tableData.values, tableData.fi, tableData.n);
        tolerance = 0.06;
        wrongMsg = isGrouped ? S.Feedback.wrongMeanGr : S.Feedback.wrongMean;
    } else if (statId === 'median') {
        correct  = ME.medianDiscrete(dataset.data);
        tolerance = 0.06;
        wrongMsg = S.Feedback.wrongMedian;
    } else if (statId === 'mode') {
        const modes = ME.modeDiscrete(tableData.values, tableData.fi);
        // Accepta qualsevol moda si és multimodal
        if (modes.some(m => ME.approxEqual(val, m, 0.01))) {
            showFeedback(S.Feedback.correct, 'ok');
            inp.classList.add('cell-ok');
            inp.readOnly = true;
            recordAnswerToHistory(S.Phases.mode, String(val), true);
            setTimeout(advancePhase, 1000);
            return;
        }
        totalErrors++;
        markErr(inp);
        showFeedback(S.Feedback.wrongMode, 'err');
        return;
    }

    if (ME.approxEqual(val, correct, tolerance)) {
        showFeedback(S.Feedback.correct, 'ok');
        inp.classList.add('cell-ok');
        inp.readOnly = true;
        recordAnswerToHistory(S.Phases[statId === 'mean' ? 'mean' : 'median'], String(val), true);
        setTimeout(advancePhase, 1000);
    } else {
        totalErrors++;
        markErr(inp);
        showFeedback(wrongMsg, 'err');
    }
}

// ── FI DE L'EXERCICI ─────────────────────────────────────────────────────

function finishExercise() {
    const levelPoints = Math.max(0, 10 - totalErrors);
    sessionScore += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;
    recordResult(totalErrors === 0 ? 1 : totalErrors <= 3 ? 2 : totalErrors <= 6 ? 3 : 4);

    const waitTime = showMiniOverlay(levelPoints);
    setTimeout(() => {
        hideMiniOverlay();
        currentOperation++;
        if (currentOperation >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            buildLevel();
        }
    }, waitTime);
}

// ── HELPERS UI ───────────────────────────────────────────────────────────

function allFilled(prefix, count) {
    for (let i = 0; i < count; i++) {
        if (document.getElementById(`${prefix}${i}`).value.trim() === '') return false;
    }
    return true;
}

function markOk(inp) {
    inp.classList.remove('cell-err');
    inp.classList.add('cell-ok');
    inp.readOnly = true;
}

function markErr(inp) {
    inp.classList.remove('cell-ok');
    inp.classList.add('cell-err');
    inp.addEventListener('input', function handler() {
        inp.classList.remove('cell-err');
        inp.removeEventListener('input', handler);
    });
}

function showFeedback(msg, type) {
    const fc = els.feedback;
    fc.innerHTML = msg;
    fc.className = 'feedback-bar fb-' + type;
    fc.style.opacity = '1';
}

function focusFirst() {
    const first = els.tableWrap.querySelector('.cell-input:not([readonly])');
    if (first) first.focus();
}

// ── ARRENCADA ────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    if (typeof validateConfig   === 'function') validateConfig();
    if (typeof injectSharedHTML === 'function') injectSharedHTML();

    // game-core fa display:'block' via inline style; en desktop necessitem 'flex'
    const _gs = document.getElementById('game-screen');
    if (_gs) {
        new MutationObserver(() => {
            if (_gs.style.display === 'block') _gs.style.display = 'flex';
        }).observe(_gs, { attributes: true, attributeFilter: ['style'] });
    }

    els.btnCheck.addEventListener('click', checkCurrentStep);

    // Enter → check
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            checkCurrentStep();
        }
    });

    if (typeof startGame === 'function') {
        startGame();
    } else {
        const screen = document.getElementById('game-screen');
        if (screen) screen.style.display = 'block';
        buildLevel();
    }
});
