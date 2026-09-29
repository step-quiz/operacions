/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/area-perimetre/area-perimetre.js
 * ROL: Joc «Àrea i Perímetre — Pentominós» (area-perimetre.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, game-core.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt, randInt } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    getKbActiveInput,
    hideCustomKeyboard,
    hideMiniOverlay,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbReleaseInput,
    recordAnswerToHistory,
    recordResult,
    showCustomKeyboard,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { checkAnswers, toggleHelp, buildLevel, checkCurrentCell });

// ============================================================
// [FIX A1] Migrat a game-core.js v2
// Eliminat: getIntParam, randInt, parseStrictInt (→ utils.js)
// Eliminat: config (→ config.js)
// Eliminat: game-core state/functions (→ game-core.js)
// Eliminat: isTouchDevice, keyboard, injectSharedHTML (→ game-core.js)
// Eliminat: copiarResultats v1 (→ game-core.js v2)
// ============================================================

// ============================================================
// PENTOMINÓS — Biblioteca de formes
// ============================================================
const SHAPE_LIBRARY = [
    // ── TROMINOS (àrea = 3) ───────────────────────────────────
    {
        name: 'I3',
        type: 'tromino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
        ],
        onlyHorizontal: true,
    },
    {
        name: 'L3',
        type: 'tromino',
        cells: [
            [0, 0],
            [1, 0],
            [1, 1],
        ],
    },
    // ── TETROMINÓS (àrea = 4) ─────────────────────────────────
    {
        name: 'I4',
        type: 'tetromino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
        ],
        onlyHorizontal: true,
    },
    {
        name: 'O4',
        type: 'tetromino',
        cells: [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
        ],
    },
    {
        name: 'T4',
        type: 'tetromino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [1, 1],
        ],
    },
    {
        name: 'S4',
        type: 'tetromino',
        cells: [
            [0, 1],
            [0, 2],
            [1, 0],
            [1, 1],
        ],
    },
    {
        name: 'L4',
        type: 'tetromino',
        cells: [
            [0, 0],
            [1, 0],
            [2, 0],
            [2, 1],
        ],
    },
    // ── PENTOMINÓS (àrea = 5) ─────────────────────────────────
    {
        name: 'F',
        type: 'pentomino',
        cells: [
            [0, 1],
            [0, 2],
            [1, 0],
            [1, 1],
            [2, 1],
        ],
    },
    {
        name: 'I',
        type: 'pentomino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4],
        ],
        onlyHorizontal: true,
    },
    {
        name: 'L',
        type: 'pentomino',
        cells: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [3, 1],
        ],
    },
    {
        name: 'N',
        type: 'pentomino',
        cells: [
            [0, 1],
            [1, 0],
            [1, 1],
            [2, 0],
            [3, 0],
        ],
    },
    {
        name: 'P',
        type: 'pentomino',
        cells: [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
            [2, 0],
        ],
    },
    {
        name: 'T',
        type: 'pentomino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [1, 1],
            [2, 1],
        ],
    },
    {
        name: 'U',
        type: 'pentomino',
        cells: [
            [0, 0],
            [0, 2],
            [1, 0],
            [1, 1],
            [1, 2],
        ],
    },
    {
        name: 'V',
        type: 'pentomino',
        cells: [
            [0, 0],
            [1, 0],
            [2, 0],
            [2, 1],
            [2, 2],
        ],
    },
    {
        name: 'W',
        type: 'pentomino',
        cells: [
            [0, 0],
            [1, 0],
            [1, 1],
            [2, 1],
            [2, 2],
        ],
    },
    {
        name: 'X',
        type: 'pentomino',
        cells: [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, 2],
            [2, 1],
        ],
    },
    {
        name: 'Y',
        type: 'pentomino',
        cells: [
            [0, 1],
            [1, 0],
            [1, 1],
            [2, 1],
            [3, 1],
        ],
    },
    {
        name: 'Z',
        type: 'pentomino',
        cells: [
            [0, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [2, 2],
        ],
    },
];

function rotateCells(cells) {
    const maxR = Math.max(...cells.map(([r]) => r));
    const rot = cells.map(([r, c]) => [c, maxR - r]);
    const minR = Math.min(...rot.map(([r]) => r));
    const minC = Math.min(...rot.map(([, c]) => c));
    return rot.map(([r, c]) => [r - minR, c - minC]);
}
function flipCells(cells) {
    const maxC = Math.max(...cells.map(([, c]) => c));
    return cells.map(([r, c]) => [r, maxC - c]);
}
function normalizeCells(cells) {
    const minR = Math.min(...cells.map(([r]) => r));
    const minC = Math.min(...cells.map(([, c]) => c));
    return cells.map(([r, c]) => [r - minR, c - minC]);
}
function computePerimeter(cells) {
    const set = new Set(cells.map(([r, c]) => `${r},${c}`));
    let p = 0;
    for (const [r, c] of cells)
        for (const [dr, dc] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
        ])
            if (!set.has(`${r + dr},${c + dc}`)) p++;
    return p;
}
function generateVariant(shape) {
    let cells = shape.cells.map(c => [...c]);
    const rots = shape.onlyHorizontal ? 0 : randInt(0, 3);
    for (let i = 0; i < rots; i++) cells = rotateCells(cells);
    if (!shape.onlyHorizontal && Math.random() < 0.5) cells = flipCells(cells);
    cells = normalizeCells(cells);
    return {
        name: shape.name,
        type: shape.type,
        cells,
        area: cells.length,
        perimeter: computePerimeter(cells),
    };
}

// ── Estat de selecció de figures ────────────────────────────
let _sessionUsedNames = new Set();
let _lastShapeType = null;
let _consecTypeCount = 0;

const BASE_PROBS = { tromino: 0.1, tetromino: 0.5, pentomino: 0.4 };

function getAdjustedProbs() {
    const types = ['tromino', 'tetromino', 'pentomino'];
    const available = {};
    for (const t of types) available[t] = SHAPE_LIBRARY.filter(s => s.type === t && !_sessionUsedNames.has(s.name));
    let probs = {};
    for (const t of types) probs[t] = available[t].length > 0 ? BASE_PROBS[t] : 0;
    if (_lastShapeType && probs[_lastShapeType] > 0) {
        const override = _consecTypeCount >= 2 ? 0.1 : 0.8;
        probs[_lastShapeType] = override;
    }
    const total = Object.values(probs).reduce((s, v) => s + v, 0);
    if (total <= 0) {
        _sessionUsedNames.clear();
        for (const t of types) probs[t] = BASE_PROBS[t];
        return probs;
    }
    for (const t of types) probs[t] /= total;
    return probs;
}
function pickType(probs) {
    const r = Math.random();
    let acc = 0;
    for (const [t, p] of Object.entries(probs)) {
        acc += p;
        if (r < acc) return t;
    }
    return Object.keys(probs).find(t => probs[t] > 0);
}
function pickNextShape() {
    const probs = getAdjustedProbs();
    const type = pickType(probs);
    const pool = SHAPE_LIBRARY.filter(s => s.type === type && !_sessionUsedNames.has(s.name));
    const shape =
        pool.length > 0
            ? pool[randInt(0, pool.length - 1)]
            : SHAPE_LIBRARY.filter(s => s.type === type)[
                  randInt(0, SHAPE_LIBRARY.filter(s => s.type === type).length - 1)
              ];
    _sessionUsedNames.add(shape.name);
    if (shape.type === _lastShapeType) _consecTypeCount++;
    else {
        _lastShapeType = shape.type;
        _consecTypeCount = 1;
    }
    return generateVariant(shape);
}

// ============================================================
// SVG — etiquetes "1 cm" a dos costats del perímetre
// ============================================================
function findLabelCell(cells) {
    const set = new Set(cells.map(([r, c]) => `${r},${c}`));
    const exp = (r, c, s) => {
        const n = { T: [r - 1, c], B: [r + 1, c], L: [r, c - 1], R: [r, c + 1] }[s];
        return !set.has(`${n[0]},${n[1]}`);
    };
    for (const [s1, s2] of [
        ['T', 'L'],
        ['T', 'R'],
        ['B', 'L'],
        ['B', 'R'],
    ])
        for (const [r, c] of cells) if (exp(r, c, s1) && exp(r, c, s2)) return { r, c, sides: [s1, s2] };
    for (const [r, c] of cells) {
        const e = ['T', 'B', 'L', 'R'].filter(s => exp(r, c, s));
        if (e.length >= 2) return { r, c, sides: e.slice(0, 2) };
    }
    return null;
}
function renderDimLabels(cells, CELL, PAD) {
    const found = findLabelCell(cells);
    if (!found) return '';
    const { r, c, sides } = found;
    const x0 = PAD + c * CELL,
        y0 = PAD + r * CELL;
    const OFF = 14,
        EXT = 18,
        GAP = 8,
        FS = 15;
    const LC = '#475569',
        TC = '#1e293b';
    const TA = `font-family="'Segoe UI',Tahoma,sans-serif" font-size="${FS}" font-weight="700" fill="${TC}"`;
    let svg = '';
    for (const side of sides) {
        if (side === 'T') {
            const ly = y0 - OFF;
            svg += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - EXT}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="${x0 + CELL}" y1="${y0}" x2="${x0 + CELL}" y2="${y0 - EXT}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="${x0}" y1="${ly}" x2="${x0 + CELL}" y2="${ly}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <text x="${x0 + CELL / 2}" y="${ly - GAP}" ${TA} text-anchor="middle" dominant-baseline="auto">1 cm</text>`;
        } else if (side === 'B') {
            const ly = y0 + CELL + OFF;
            svg += `<line x1="${x0}" y1="${y0 + CELL}" x2="${x0}" y2="${y0 + CELL + EXT}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="${x0 + CELL}" y1="${y0 + CELL}" x2="${x0 + CELL}" y2="${y0 + CELL + EXT}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="${x0}" y1="${ly}" x2="${x0 + CELL}" y2="${ly}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <text x="${x0 + CELL / 2}" y="${ly + GAP + FS}" ${TA} text-anchor="middle" dominant-baseline="auto">1 cm</text>`;
        } else if (side === 'L') {
            const lx = x0 - OFF,
                cy = y0 + CELL / 2;
            svg += `<line x1="${x0}" y1="${y0}" x2="${x0 - EXT}" y2="${y0}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="${x0}" y1="${y0 + CELL}" x2="${x0 - EXT}" y2="${y0 + CELL}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="${lx}" y1="${y0}" x2="${lx}" y2="${y0 + CELL}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <text x="${lx - GAP}" y="${cy}" ${TA} text-anchor="middle" dominant-baseline="middle"
                    transform="rotate(-90,${lx - GAP},${cy})">1 cm</text>`;
        } else if (side === 'R') {
            const lx = x0 + CELL + OFF,
                cy = y0 + CELL / 2;
            svg += `<line x1="${x0 + CELL}" y1="${y0}" x2="${x0 + CELL + EXT}" y2="${y0}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="${x0 + CELL}" y1="${y0 + CELL}" x2="${x0 + CELL + EXT}" y2="${y0 + CELL}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="${lx}" y1="${y0}" x2="${lx}" y2="${y0 + CELL}" stroke="${LC}" stroke-width="1.5" stroke-linecap="round"/>
              <text x="${lx + GAP}" y="${cy}" ${TA} text-anchor="middle" dominant-baseline="middle"
                    transform="rotate(90,${lx + GAP},${cy})">1 cm</text>`;
        }
    }
    return svg;
}
function renderPentominoSVG(cells) {
    const CELL = 54,
        PAD = 48;
    const rows = Math.max(...cells.map(([r]) => r)) + 1;
    const cols = Math.max(...cells.map(([, c]) => c)) + 1;
    const W = cols * CELL + 2 * PAD,
        H = rows * CELL + 2 * PAD;
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
    let bg = '';
    for (const [r, c] of cells) {
        const x = PAD + c * CELL,
            y = PAD + r * CELL;
        bg += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>`;
    }
    let pento = '';
    for (const [r, c] of cells) {
        const x = PAD + c * CELL,
            y = PAD + r * CELL;
        pento += `<rect x="${x + 2}" y="${y + 2}" width="${CELL - 4}" height="${CELL - 4}" rx="4" fill="#0d9488" stroke="#0f766e" stroke-width="2"/>`;
    }
    const DIRS = [
        [-1, 0, 'T'],
        [1, 0, 'B'],
        [0, -1, 'L'],
        [0, 1, 'R'],
    ];
    let lines = '';
    for (const [r, c] of cells) {
        const x = PAD + c * CELL,
            y = PAD + r * CELL;
        for (const [dr, dc, side] of DIRS) {
            if (!cellSet.has(`${r + dr},${c + dc}`)) {
                let x1, y1, x2, y2;
                if (side === 'T') {
                    x1 = x;
                    y1 = y;
                    x2 = x + CELL;
                    y2 = y;
                }
                if (side === 'B') {
                    x1 = x;
                    y1 = y + CELL;
                    x2 = x + CELL;
                    y2 = y + CELL;
                }
                if (side === 'L') {
                    x1 = x;
                    y1 = y;
                    x2 = x;
                    y2 = y + CELL;
                }
                if (side === 'R') {
                    x1 = x + CELL;
                    y1 = y;
                    x2 = x + CELL;
                    y2 = y + CELL;
                }
                lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#134e4a" stroke-width="4" stroke-linecap="square"/>`;
            }
        }
    }
    const dimLabels = renderDimLabels(cells, CELL, PAD);
    return `<svg class="pentomino-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"
                 xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Figura pentominó">
        ${bg}${pento}${lines}${dimLabels}
    </svg>`;
}

// Els inputs encertats porten data-locked="true": el teclat de game-core.js
// no els torna a activar ni els treu el readonly.

// checkCurrentCell: salt intel·ligent entre àrea/perímetre, o valida
function checkCurrentCell() {
    const ai = document.getElementById('area-input');
    const pi = document.getElementById('perim-input');
    const inputs = [ai, pi].filter(i => i && i.dataset.locked !== 'true');
    const cur = getKbActiveInput();
    const empty = inputs.find(i => i !== cur && i.value.trim() === '');
    if (cur && cur.value.trim() !== '' && empty) {
        showCustomKeyboard(empty);
    } else {
        checkAnswers();
    }
}

// ============================================================
// LÒGICA DEL JOC
// ============================================================
let currentPentomino = null;
let isPenalizing = false;
let _helpVisible = false;
let _areaLocked = false;
let _perimLocked = false;
let _helpTimer = null;

const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    pentoContainer: document.getElementById('pentomino-container'),
    helpBox: document.getElementById('help-box'),
    answerReveal: document.getElementById('answer-reveal'),
    answerRevealVals: document.getElementById('answer-reveal-vals'),
    get areaInput() {
        return document.getElementById('area-input');
    },
    get perimInput() {
        return document.getElementById('perim-input');
    },
};

function showWarning(type, text) {
    const wb = document.getElementById('warning-box');
    if (!wb) return;
    wb.textContent = text;
    wb.className = 'warning-box visible warn-' + type;
}
function clearWarning() {
    const wb = document.getElementById('warning-box');
    if (wb) {
        wb.textContent = '';
        wb.className = 'warning-box';
    }
}

function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Figura ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 2 ? ' danger' : '');
}

function lockInput(inp) {
    inp.dataset.locked = 'true';
    inp.setAttribute('readonly', 'readonly');
    inp.classList.remove('kb-active-input', 'kb-selected', 'error-shake');
    inp.classList.add('input-locked');
    kbReleaseInput(inp);
}

function buildLevel() {
    // Reinici de sessió (game-core crida buildLevel amb currentOperation=0)
    if (state.currentOperation === 0) {
        _sessionUsedNames = new Set();
        _lastShapeType = null;
        _consecTypeCount = 0;
    }

    state.attemptsLeft = MAX_INTENTS;
    isPenalizing = false;
    state.isTransitioning = false;
    _areaLocked = false;
    _perimLocked = false;
    currentPentomino = pickNextShape();

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    els.pentoContainer.innerHTML = renderPentominoSVG(currentPentomino.cells);

    [els.areaInput, els.perimInput].forEach(inp => {
        inp.value = '';
        inp.dataset.locked = '';
        inp.classList.remove('input-locked', 'error-shake', 'kb-active-input', 'kb-selected');
        inp.removeAttribute('readonly');
        inp.removeAttribute('inputmode');
    });

    resetHelp();
    clearWarning();
    els.answerReveal.classList.remove('visible');
    els.answerRevealVals.textContent = '';
    updateHeader();

    if (isTouchDevice()) {
        showCustomKeyboard(els.areaInput);
    } else {
        els.areaInput.focus();
    }
}

function resetHelp() {
    _helpVisible = false;
    if (_helpTimer) {
        clearTimeout(_helpTimer);
        _helpTimer = null;
    }
    els.helpBox.classList.remove('visible');
    const p2 = document.getElementById('help-p2');
    const sep = document.getElementById('help-sep');
    if (p2) p2.style.display = 'none';
    if (sep) sep.style.display = 'none';
    const b = document.getElementById('btn-ajuda');
    if (b) b.textContent = '💡 Ajuda';
}

function toggleHelp() {
    _helpVisible = !_helpVisible;
    els.helpBox.classList.toggle('visible', _helpVisible);
    const b = document.getElementById('btn-ajuda');
    if (b) b.textContent = _helpVisible ? '💡 Amaga ajuda' : '💡 Ajuda';
    if (_helpVisible) {
        const p1 = document.getElementById('help-p1');
        const p2 = document.getElementById('help-p2');
        const sep = document.getElementById('help-sep');
        if (p1) p1.style.display = 'block';
        if (p2) p2.style.display = 'none';
        if (sep) sep.style.display = 'none';
        setTimeout(() => els.helpBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        if (_helpTimer) clearTimeout(_helpTimer);
        _helpTimer = setTimeout(() => {
            const p2b = document.getElementById('help-p2');
            const sepb = document.getElementById('help-sep');
            if (sepb) sepb.style.display = 'block';
            if (p2b) {
                p2b.style.display = 'block';
                p2b.style.animation = 'none';
                void p2b.offsetWidth;
                p2b.style.animation = 'fadeIn 0.35s ease';
            }
            setTimeout(() => els.helpBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
        }, 1500);
    } else {
        if (_helpTimer) {
            clearTimeout(_helpTimer);
            _helpTimer = null;
        }
        const p2 = document.getElementById('help-p2');
        const sep = document.getElementById('help-sep');
        if (p2) p2.style.display = 'none';
        if (sep) sep.style.display = 'none';
    }
}

function shakeEl(el) {
    if (!el) return;
    el.classList.remove('error-shake');
    void el.offsetWidth;
    el.classList.add('error-shake');
    setTimeout(() => el.classList.remove('error-shake'), 400);
}

// ── Verificació ──────────────────────────────────────────────
function checkAnswers() {
    if (state.isTransitioning || isPenalizing) return;
    const ai = els.areaInput,
        pi = els.perimInput;
    const areaEmpty = !_areaLocked && !ai.value.trim();
    const perimEmpty = !_perimLocked && !pi.value.trim();

    if (areaEmpty || perimEmpty) {
        clearWarning();
        showWarning('empty', "⚠️ Has d'omplir les dues caselles.");
        if (areaEmpty) shakeEl(ai);
        if (perimEmpty) shakeEl(pi);
        const toFocus = areaEmpty ? ai : pi;
        if (isTouchDevice()) showCustomKeyboard(toFocus);
        else toFocus.focus();
        return;
    }

    clearWarning();
    const areaVal = _areaLocked ? currentPentomino.area : parseStrictInt(ai.value.trim());
    const perimVal = _perimLocked ? currentPentomino.perimeter : parseStrictInt(pi.value.trim());

    if (!_areaLocked && isNaN(areaVal)) {
        shakeEl(ai);
        return;
    }
    if (!_perimLocked && isNaN(perimVal)) {
        shakeEl(pi);
        return;
    }

    const areaOk = _areaLocked || areaVal === currentPentomino.area;
    const perimOk = _perimLocked || perimVal === currentPentomino.perimeter;

    // Cas: l'alumne ha intercanviat àrea i perímetre
    if (!areaOk && !perimOk && !_areaLocked && !_perimLocked) {
        const swapped = areaVal === currentPentomino.perimeter && perimVal === currentPentomino.area;
        if (swapped) {
            showWarning('swap', '⚠️ Atenció, potser has confós àrea amb perímetre. Revisa-ho.');
            shakeEl(ai);
            shakeEl(pi);
            recordAnswerToHistory(
                `[${currentPentomino.name}] Àrea=${currentPentomino.area}cm² · Per.=${currentPentomino.perimeter}cm`,
                `Àrea:${ai.value.trim()}cm² · Per.:${pi.value.trim()}cm`,
                false
            );
            penalize();
            return;
        }
    }

    if (!areaOk) shakeEl(ai);
    if (!perimOk) shakeEl(pi);

    const question = `[${currentPentomino.name}] Àrea=${currentPentomino.area}cm² · Per.=${currentPentomino.perimeter}cm`;
    const areaStr = _areaLocked ? String(currentPentomino.area) : ai.value.trim();
    const perimStr = _perimLocked ? String(currentPentomino.perimeter) : pi.value.trim();
    const answerLbl = `Àrea:${areaStr}cm² · Per.:${perimStr}cm`;

    if (areaOk && !_areaLocked) {
        _areaLocked = true;
        lockInput(ai);
    }
    if (perimOk && !_perimLocked) {
        _perimLocked = true;
        lockInput(pi);
    }

    if (areaOk && perimOk) {
        recordAnswerToHistory(question, answerLbl, true);
        hideCustomKeyboard();
        finishOperation(true);
        return;
    }

    recordAnswerToHistory(question, answerLbl, false);
    if (!areaOk) ai.value = '';
    if (!perimOk) pi.value = '';
    penalize();
}

// ── Penalització ─────────────────────────────────────────────
function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        state.attemptsLeft--;
        updateHeader();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            hideCustomKeyboard();
            els.answerRevealVals.textContent = `Àrea = ${currentPentomino.area} cm²  ·  Perímetre = ${currentPentomino.perimeter} cm`;
            els.answerReveal.classList.add('visible');
            setTimeout(() => finishOperation(false), 2600);
        } else {
            const toFocus = !_areaLocked ? els.areaInput : els.perimInput;
            if (isTouchDevice()) showCustomKeyboard(toFocus);
            else toFocus.focus();
        }
        isPenalizing = false;
    }, 700);
}

// ── Fi d'operació ────────────────────────────────────────────
function finishOperation(success) {
    const fails = MAX_INTENTS - state.attemptsLeft;
    const pts = success ? Math.max(0, 10 - fails * 2) : 0;
    state.sessionScore += pts;

    // [FIX A1] Registre v2 de resultats per pregunta
    recordResult(success ? Math.min(fails + 1, 3) : 4);

    const wt = showMiniOverlay(pts);
    setTimeout(() => {
        hideMiniOverlay();
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, wt);
}

// ── Enter (teclat físic) ─────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const gs = document.getElementById('game-screen');
    if (!gs || gs.style.display === 'none') return;
    e.preventDefault();
    if (!state.isTransitioning) checkAnswers();
});

// ============================================================
// INICI
// ============================================================
injectSharedHTML();
initCustomKeyboard({ allowNegative: false, allowZero: true });
validateConfig();
startGame();
