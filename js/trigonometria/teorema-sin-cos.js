/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/trigonometria/teorema-sin-cos.js
 * ROL: Lògica específica del joc "Triangles — Sinus i Cosinus".
 * DEPENDÈNCIES: js/game-core.js (estat global, startGame, endSession,
 *               showMiniOverlay, hideMiniOverlay, recordAnswerToHistory,
 *               recordResult, sessionScore, currentSession, currentOperation,
 *               attemptsLeft, isTransitioning, bgColors)
 * ============================================================================
 */

/* ================================================================
   PROBLEMES — dades pedagògiques
   Convenció de vèrtexs:
     A (baix-esquerra) · B (baix-dreta) · C (dalt)
     a = costat BC (oposat a A)
     b = costat AC (oposat a B)
     c = costat AB (base, oposat a C)
   ================================================================ */
const PROBLEMS = [

    /* ─── DIFICULTAT 0 — Sinus, trobar costat ─────────────────── */
    {
        id:  0, difficulty: 0, theorem: 'sinus',
        given: { sides: { a: '√2' }, angles: { A: 30, B: 45 } },
        find:  { type: 'side', name: 'b' },
        answer: '2', distractors: ['1', '√3', '√2'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 30, B: 45, C: 105 },
    },
    {
        id:  1, difficulty: 0, theorem: 'sinus',
        given: { sides: { a: '√3' }, angles: { A: 60, B: 30 } },
        find:  { type: 'side', name: 'b' },
        answer: '1', distractors: ['2', '√3', '√2'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 60, B: 30, C: 90 },
    },

    /* ─── DIFICULTAT 1 — Sinus + Cosinus, trobar costat ──────── */
    {
        id:  2, difficulty: 1, theorem: 'sinus',
        given: { sides: { a: '1' }, angles: { A: 30, B: 60 } },
        find:  { type: 'side', name: 'b' },
        answer: '√3', distractors: ['2', '1', '√2'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 30, B: 60, C: 90 },
    },
    {
        id:  3, difficulty: 1, theorem: 'sinus',
        given: { sides: { a: '1' }, angles: { A: 45, B: 90 } },
        find:  { type: 'side', name: 'b' },
        answer: '√2', distractors: ['1', '2', '√3'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 45, B: 90, C: 45 },
    },
    {
        id:  4, difficulty: 1, theorem: 'cosinus',
        given: { sides: { a: '2', b: '2' }, angles: { C: 60 } },
        find:  { type: 'side', name: 'c' },
        answer: '2', distractors: ['√3', '2√2', '4'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 60, B: 60, C: 60 },
    },
    {
        id:  5, difficulty: 1, theorem: 'cosinus',
        given: { sides: { a: '1', b: '1' }, angles: { C: 90 } },
        find:  { type: 'side', name: 'c' },
        answer: '√2', distractors: ['1', '2', '√3'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 45, B: 45, C: 90 },
    },
    {
        id:  6, difficulty: 1, theorem: 'cosinus',
        given: { sides: { a: '3', b: '4' }, angles: { C: 90 } },
        find:  { type: 'side', name: 'c' },
        answer: '5', distractors: ['6', '7', '3√2'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 37, B: 53, C: 90 },
    },

    /* ─── DIFICULTAT 2 — Mixt: costat i angle ────────────────── */
    {
        id:  7, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '√2' }, angles: { A: 45, B: 60 } },
        find:  { type: 'side', name: 'b' },
        answer: '√3', distractors: ['2', '1', '√6'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 45, B: 60, C: 75 },
    },
    {
        id:  8, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '1', b: '√3' }, angles: { A: 30 } },
        find:  { type: 'angle', name: 'B' },
        answer: '60°', distractors: ['45°', '90°', '30°'],
        step2hint: 'sin(B) = b · sin(A) / a',
        numericAngles: { A: 30, B: 60, C: 90 },
    },
    {
        id:  9, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '√2', b: '2' }, angles: { A: 30 } },
        find:  { type: 'angle', name: 'B' },
        answer: '45°', distractors: ['60°', '30°', '90°'],
        step2hint: 'sin(B) = b · sin(A) / a',
        numericAngles: { A: 30, B: 45, C: 105 },
    },
    {
        id: 10, difficulty: 2, theorem: 'cosinus',
        given: { sides: { a: '1', b: '1' }, angles: { C: 120 } },
        find:  { type: 'side', name: 'c' },
        answer: '√3', distractors: ['2', '√2', '1'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 30, B: 30, C: 120 },
    },
    {
        id: 11, difficulty: 2, theorem: 'cosinus',
        given: { sides: { a: '3', b: '4', c: '5' } },
        find:  { type: 'angle', name: 'C' },
        answer: '90°', distractors: ['60°', '45°', '30°'],
        step2hint: 'cos(C) = (a² + b² − c²) / (2ab)',
        numericAngles: { A: 37, B: 53, C: 90 },
    },

    /* ─── DIFICULTAT 3 — Avançat: angles obtus i valors compostos */
    {
        id: 12, difficulty: 3, theorem: 'sinus',
        given: { sides: { a: '√3', b: '2' }, angles: { A: 60 } },
        find:  { type: 'angle', name: 'B' },
        answer: '90°', distractors: ['45°', '60°', '120°'],
        step2hint: 'sin(B) = b · sin(A) / a',
        numericAngles: { A: 60, B: 90, C: 30 },
    },
    {
        id: 13, difficulty: 3, theorem: 'cosinus',
        given: { sides: { a: '2', b: '2' }, angles: { C: 120 } },
        find:  { type: 'side', name: 'c' },
        answer: '2√3', distractors: ['2', '4', '√6'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 30, B: 30, C: 120 },
    },
    {
        id: 14, difficulty: 3, theorem: 'cosinus',
        given: { sides: { a: '1', b: '1', c: '1' } },
        find:  { type: 'angle', name: 'A' },
        answer: '60°', distractors: ['45°', '90°', '30°'],
        step2hint: 'cos(A) = (b² + c² − a²) / (2bc)',
        numericAngles: { A: 60, B: 60, C: 60 },
    },
    {
        id: 15, difficulty: 3, theorem: 'cosinus',
        given: { sides: { a: '2', b: '2', c: '2√3' } },
        find:  { type: 'angle', name: 'C' },
        answer: '120°', distractors: ['90°', '60°', '150°'],
        step2hint: 'cos(C) = (a² + b² − c²) / (2ab)',
        numericAngles: { A: 30, B: 30, C: 120 },
    },
    {
        id: 16, difficulty: 3, theorem: 'cosinus',
        given: { sides: { a: '√2', b: '√2', c: '2' } },
        find:  { type: 'angle', name: 'C' },
        answer: '90°', distractors: ['60°', '120°', '45°'],
        step2hint: 'cos(C) = (a² + b² − c²) / (2ab)',
        numericAngles: { A: 45, B: 45, C: 90 },
    },
    {
        id: 17, difficulty: 3, theorem: 'cosinus',
        given: { sides: { a: '1', b: '√3', c: '2' } },
        find:  { type: 'angle', name: 'C' },
        answer: '90°', distractors: ['60°', '30°', '120°'],
        step2hint: 'cos(C) = (a² + b² − c²) / (2ab)',
        numericAngles: { A: 30, B: 60, C: 90 },
    },

    /* ─── NOU BLOC — Sinus AAS, trobar costat ───────────────────── */
    {
        id: 18, difficulty: 0, theorem: 'sinus',
        given: { sides: { a: '2' }, angles: { A: 90, B: 30 } },
        find:  { type: 'side', name: 'b' },
        answer: '1', distractors: ['2', '√3', '√2'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 90, B: 30, C: 60 },
    },
    {
        id: 19, difficulty: 0, theorem: 'sinus',
        given: { sides: { a: '√3' }, angles: { A: 60, B: 90 } },
        find:  { type: 'side', name: 'b' },
        answer: '2', distractors: ['1', '√3', '√6'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 60, B: 90, C: 30 },
    },
    {
        id: 20, difficulty: 1, theorem: 'sinus',
        given: { sides: { a: '√3' }, angles: { A: 30, B: 90 } },
        find:  { type: 'side', name: 'b' },
        answer: '2√3', distractors: ['√3', '3', '√6'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 30, B: 90, C: 60 },
    },
    {
        id: 21, difficulty: 1, theorem: 'sinus',
        given: { sides: { a: '1' }, angles: { A: 45, B: 90 } },
        find:  { type: 'side', name: 'b' },
        answer: '√2', distractors: ['1', '2', '√3'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 45, B: 90, C: 45 },
    },
    {
        id: 22, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '1' }, angles: { A: 30, B: 120 } },
        find:  { type: 'side', name: 'b' },
        answer: '√3', distractors: ['1', '2', '√2'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 30, B: 120, C: 30 },
    },
    {
        id: 23, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '√6' }, angles: { A: 60, B: 45 } },
        find:  { type: 'side', name: 'b' },
        answer: '2', distractors: ['√3', '√6', '√2'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 60, B: 45, C: 75 },
    },
    {
        id: 24, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '√2' }, angles: { A: 45, B: 30 } },
        find:  { type: 'side', name: 'b' },
        answer: '1', distractors: ['√2', '2', '√3'],
        step2hint: 'b = a · sin(B) / sin(A)',
        numericAngles: { A: 45, B: 30, C: 105 },
    },

    /* ─── NOU BLOC — Sinus SSA, trobar angle ────────────────────── */
    {
        id: 25, difficulty: 1, theorem: 'sinus',
        given: { sides: { a: '2', b: '1' }, angles: { A: 90 } },
        find:  { type: 'angle', name: 'B' },
        answer: '30°', distractors: ['45°', '60°', '90°'],
        step2hint: 'sin(B) = b · sin(A) / a',
        numericAngles: { A: 90, B: 30, C: 60 },
    },
    {
        id: 26, difficulty: 1, theorem: 'sinus',
        given: { sides: { a: '2', b: '√3' }, angles: { A: 90 } },
        find:  { type: 'angle', name: 'B' },
        answer: '60°', distractors: ['30°', '45°', '90°'],
        step2hint: 'sin(B) = b · sin(A) / a',
        numericAngles: { A: 90, B: 60, C: 30 },
    },
    {
        id: 27, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '√3', b: '√2' }, angles: { A: 60 } },
        find:  { type: 'angle', name: 'B' },
        answer: '45°', distractors: ['30°', '60°', '90°'],
        step2hint: 'sin(B) = b · sin(A) / a',
        numericAngles: { A: 60, B: 45, C: 75 },
    },
    {
        id: 28, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '√2', b: '√3' }, angles: { A: 45 } },
        find:  { type: 'angle', name: 'B' },
        answer: '60°', distractors: ['30°', '45°', '90°'],
        step2hint: 'sin(B) = b · sin(A) / a',
        numericAngles: { A: 45, B: 60, C: 75 },
    },
    {
        id: 29, difficulty: 2, theorem: 'sinus',
        given: { sides: { a: '√2', b: '2' }, angles: { A: 45 } },
        find:  { type: 'angle', name: 'B' },
        answer: '90°', distractors: ['30°', '60°', '45°'],
        step2hint: 'sin(B) = b · sin(A) / a',
        numericAngles: { A: 45, B: 90, C: 45 },
    },

    /* ─── NOU BLOC — Cosinus SAS, trobar costat ─────────────────── */
    {
        id: 30, difficulty: 1, theorem: 'cosinus',
        given: { sides: { a: '1', b: '2' }, angles: { C: 60 } },
        find:  { type: 'side', name: 'c' },
        answer: '√3', distractors: ['1', '2', '√5'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 30, B: 90, C: 60 },
    },
    {
        id: 31, difficulty: 2, theorem: 'cosinus',
        given: { sides: { a: '√3', b: '2' }, angles: { C: 30 } },
        find:  { type: 'side', name: 'c' },
        answer: '1', distractors: ['2', '√3', '√2'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 60, B: 90, C: 30 },
    },
    {
        id: 32, difficulty: 1, theorem: 'cosinus',
        given: { sides: { a: '2', b: '2' }, angles: { C: 90 } },
        find:  { type: 'side', name: 'c' },
        answer: '2√2', distractors: ['2', '4', '√2'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 45, B: 45, C: 90 },
    },
    {
        id: 33, difficulty: 3, theorem: 'cosinus',
        given: { sides: { a: '√3', b: '√3' }, angles: { C: 120 } },
        find:  { type: 'side', name: 'c' },
        answer: '3', distractors: ['2√3', '√3', '2'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 30, B: 30, C: 120 },
    },
    {
        id: 34, difficulty: 1, theorem: 'cosinus',
        given: { sides: { a: '1', b: '√3' }, angles: { C: 90 } },
        find:  { type: 'side', name: 'c' },
        answer: '2', distractors: ['√2', '√3', '√5'],
        step2hint: 'c² = a² + b² − 2ab · cos(C)',
        numericAngles: { A: 30, B: 60, C: 90 },
    },

    /* ─── NOU BLOC — Cosinus SSS, trobar angle ──────────────────── */
    {
        id: 35, difficulty: 2, theorem: 'cosinus',
        given: { sides: { a: '1', b: '√3', c: '2' } },
        find:  { type: 'angle', name: 'A' },
        answer: '30°', distractors: ['45°', '60°', '90°'],
        step2hint: 'cos(A) = (b² + c² − a²) / (2bc)',
        numericAngles: { A: 30, B: 60, C: 90 },
    },
    {
        id: 36, difficulty: 2, theorem: 'cosinus',
        given: { sides: { a: '√2', b: '√2', c: '2' } },
        find:  { type: 'angle', name: 'A' },
        answer: '45°', distractors: ['30°', '60°', '90°'],
        step2hint: 'cos(A) = (b² + c² − a²) / (2bc)',
        numericAngles: { A: 45, B: 45, C: 90 },
    },
    {
        id: 37, difficulty: 3, theorem: 'cosinus',
        given: { sides: { a: '2', b: '2√3', c: '4' } },
        find:  { type: 'angle', name: 'C' },
        answer: '90°', distractors: ['60°', '120°', '45°'],
        step2hint: 'cos(C) = (a² + b² − c²) / (2ab)',
        numericAngles: { A: 30, B: 60, C: 90 },
    },
    {
        id: 38, difficulty: 2, theorem: 'cosinus',
        given: { sides: { a: '√3', b: '1', c: '2' } },
        find:  { type: 'angle', name: 'B' },
        answer: '30°', distractors: ['45°', '60°', '90°'],
        step2hint: 'cos(B) = (a² + c² − b²) / (2ac)',
        numericAngles: { A: 60, B: 30, C: 90 },
    },
    {
        id: 39, difficulty: 3, theorem: 'cosinus',
        given: { sides: { a: '1', b: '1', c: '√3' } },
        find:  { type: 'angle', name: 'C' },
        answer: '120°', distractors: ['90°', '60°', '150°'],
        step2hint: 'cos(C) = (a² + b² − c²) / (2ab)',
        numericAngles: { A: 30, B: 30, C: 120 },
    },
];

/* ================================================================
   BARALLA ALEATÒRIA — tots els 40 problemes, sense repetició
   ================================================================ */
let shuffledDeck = [];
let deckPos      = 0;

function shuffleDeck() {
    shuffledDeck = PROBLEMS.map((_, i) => i);
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    deckPos = 0;
}

/* ================================================================
   ESTAT ESPECÍFIC D'AQUEST JOC
   ================================================================ */
let isPenalizing   = false;
let currentProblem = null;

/* ================================================================
   CACHE DOM
   ================================================================ */
const els = {
    body:            document.body,
    gameScreen:      document.getElementById('game-screen'),
    sessionDisplay:  document.getElementById('session-display'),
    lvlDisplay:      document.getElementById('lvl-display'),
    scoreDisplay:    document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    problemBox:      document.getElementById('problem-box'),
    triangleSvg:     document.getElementById('triangle-svg'),
    resolutionPanel: document.getElementById('resolution-panel'),
    stepInstruction: document.getElementById('step-instruction'),
    helpBtn:         document.getElementById('btn-help'),
    helpPanel:       document.getElementById('help-panel'),
    stepValue:       document.getElementById('step-value'),
    valueButtons:    document.getElementById('value-buttons'),
};

/* ================================================================
   SELECCIÓ DE PROBLEMA
   ================================================================ */
function selectProblem() {
    if (deckPos >= shuffledDeck.length) shuffleDeck();
    return PROBLEMS[shuffledDeck[deckPos++]];
}

/* ================================================================
   DIBUIX DEL TRIANGLE SVG
   ================================================================ */
function drawTriangle(problem) {
    const { given, find } = problem;
    const na = problem.numericAngles;

    const toRad = d => d * Math.PI / 180;
    const sinA  = Math.sin(toRad(na.A));
    const sinB  = Math.sin(toRad(na.B));
    const sinC  = Math.sin(toRad(na.C));
    const cosA  = Math.cos(toRad(na.A));

    const c_rel  = sinC;
    const Cx_rel = sinB * cosA;
    const Cy_rel = sinB * sinA;

    const vW = 240, vH = 175, pad = 28;
    const scale = Math.min((vW - 2*pad) / c_rel, (vH - 2*pad) / Cy_rel);

    const triW = c_rel  * scale;
    const ox   = (vW - triW) / 2;
    const oy   = vH - pad;

    const Av = { x: ox,                  y: oy };
    const Bv = { x: ox + triW,           y: oy };
    const Cv = { x: ox + Cx_rel * scale, y: oy - Cy_rel * scale };

    const gx = (Av.x + Bv.x + Cv.x) / 3;
    const gy = (Av.y + Bv.y + Cv.y) / 3;

    function sidePos(p1, p2, dist = 14) {
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        const dx = mx - gx, dy = my - gy;
        const l  = Math.hypot(dx, dy) || 1;
        return { x: mx + dx / l * dist, y: my + dy / l * dist };
    }
    function anglePos(v, dist = 20) {
        const dx = gx - v.x, dy = gy - v.y;
        const l  = Math.hypot(dx, dy) || 1;
        return { x: v.x + dx / l * dist, y: v.y + dy / l * dist };
    }
    function vertexPos(v, dist = 14) {
        const dx = v.x - gx, dy = v.y - gy;
        const l  = Math.hypot(dx, dy) || 1;
        return { x: v.x + dx / l * dist, y: v.y + dy / l * dist };
    }

    function getLabel(type, name) {
        if (find.type === type && find.name === name)
            return { text: '?', color: '#d97706', bold: true, size: 17 };
        if (type === 'side') {
            const v = given.sides?.[name];
            return v ? { text: v, color: '#334155', bold: true, size: 14 } : null;
        } else {
            const v = given.angles?.[name];
            return (v !== undefined && v !== null)
                ? { text: v + '°', color: '#0f766e', bold: false, size: 13 } : null;
        }
    }

    function svgTxt(x, y, lbl, anchor = 'middle') {
        if (!lbl) return '';
        const ff = lbl.bold
            ? `font-family="'Courier New', monospace"`
            : `font-family="'Segoe UI', sans-serif"`;
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}"
                      text-anchor="${anchor}" dominant-baseline="middle"
                      ${ff} font-size="${lbl.size}"
                      font-weight="${lbl.bold ? 'bold' : '600'}"
                      fill="${lbl.color}">${lbl.text}</text>`;
    }

    function rightAngleMark(vx, vy, p1x, p1y, p2x, p2y, size = 11) {
        const d1x = p1x-vx, d1y = p1y-vy;
        const d2x = p2x-vx, d2y = p2y-vy;
        const l1  = Math.hypot(d1x, d1y), l2 = Math.hypot(d2x, d2y);
        const u1x = d1x/l1*size, u1y = d1y/l1*size;
        const u2x = d2x/l2*size, u2y = d2y/l2*size;
        const mx  = vx+u1x+u2x, my = vy+u1y+u2y;
        return `<polyline points="${(vx+u1x).toFixed(1)},${(vy+u1y).toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)} ${(vx+u2x).toFixed(1)},${(vy+u2y).toFixed(1)}"
                          fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linejoin="miter"/>`;
    }

    let extraMarkers = '';
    if (na.A === 90) extraMarkers += rightAngleMark(Av.x, Av.y, Bv.x, Bv.y, Cv.x, Cv.y);
    if (na.B === 90) extraMarkers += rightAngleMark(Bv.x, Bv.y, Av.x, Av.y, Cv.x, Cv.y);
    if (na.C === 90) extraMarkers += rightAngleMark(Cv.x, Cv.y, Av.x, Av.y, Bv.x, Bv.y);

    function strokeColor(type, name) {
        return (find.type === type && find.name === name) ? '#d97706' : '#94a3b8';
    }
    function strokeW(type, name) {
        return (find.type === type && find.name === name) ? 3 : 2.2;
    }

    const pA  = sidePos(Bv, Cv);
    const pB  = sidePos(Av, Cv);
    const pC  = sidePos(Av, Bv);
    const pAa = anglePos(Av);
    const pBa = anglePos(Bv);
    const pCa = anglePos(Cv);
    const vA  = vertexPos(Av);
    const vB  = vertexPos(Bv);
    const vC  = vertexPos(Cv);

    els.triangleSvg.innerHTML = `
        <line x1="${Av.x.toFixed(1)}" y1="${Av.y.toFixed(1)}"
              x2="${Bv.x.toFixed(1)}" y2="${Bv.y.toFixed(1)}"
              stroke="${strokeColor('side','c')}" stroke-width="${strokeW('side','c')}"/>
        <line x1="${Av.x.toFixed(1)}" y1="${Av.y.toFixed(1)}"
              x2="${Cv.x.toFixed(1)}" y2="${Cv.y.toFixed(1)}"
              stroke="${strokeColor('side','b')}" stroke-width="${strokeW('side','b')}"/>
        <line x1="${Bv.x.toFixed(1)}" y1="${Bv.y.toFixed(1)}"
              x2="${Cv.x.toFixed(1)}" y2="${Cv.y.toFixed(1)}"
              stroke="${strokeColor('side','a')}" stroke-width="${strokeW('side','a')}"/>

        ${extraMarkers}

        <circle cx="${Av.x.toFixed(1)}" cy="${Av.y.toFixed(1)}" r="4" fill="#0f766e" stroke="white" stroke-width="1.5"/>
        <circle cx="${Bv.x.toFixed(1)}" cy="${Bv.y.toFixed(1)}" r="4" fill="#0f766e" stroke="white" stroke-width="1.5"/>
        <circle cx="${Cv.x.toFixed(1)}" cy="${Cv.y.toFixed(1)}" r="4" fill="#0f766e" stroke="white" stroke-width="1.5"/>

        <text x="${vA.x.toFixed(1)}" y="${vA.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
              font-size="14" font-weight="bold" fill="#0f766e" font-family="'Segoe UI', sans-serif">A</text>
        <text x="${vB.x.toFixed(1)}" y="${vB.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
              font-size="14" font-weight="bold" fill="#0f766e" font-family="'Segoe UI', sans-serif">B</text>
        <text x="${vC.x.toFixed(1)}" y="${vC.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
              font-size="14" font-weight="bold" fill="#0f766e" font-family="'Segoe UI', sans-serif">C</text>

        ${svgTxt(pA.x,  pA.y,  getLabel('side',  'a'))}
        ${svgTxt(pB.x,  pB.y,  getLabel('side',  'b'))}
        ${svgTxt(pC.x,  pC.y,  getLabel('side',  'c'))}
        ${svgTxt(pAa.x, pAa.y, getLabel('angle', 'A'))}
        ${svgTxt(pBa.x, pBa.y, getLabel('angle', 'B'))}
        ${svgTxt(pCa.x, pCa.y, getLabel('angle', 'C'))}
    `;
}

/* ================================================================
   CONSTRUCCIÓ DEL NIVELL (cridat per game-core startSession)
   ================================================================ */
function buildLevel() {
    attemptsLeft    = MAX_INTENTS;
    isPenalizing    = false;
    isTransitioning = false;

    els.body.style.backgroundColor =
        bgColors[(currentSession * TOTAL_OPERATIONS + currentOperation) % bgColors.length];

    currentProblem = selectProblem();
    const p = currentProblem;

    drawTriangle(p);

    els.sessionDisplay.innerText  = `Sessió ${currentSession+1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText      = `Problema ${currentOperation+1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText    = `Punts: ${sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';

    const findNameLbl = p.find.type === 'side'
        ? `el costat <strong>${p.find.name}</strong>`
        : `l'angle <strong>${p.find.name}</strong>`;
    els.stepInstruction.innerHTML = `Quant val ${findNameLbl}?`;

    els.helpPanel.innerHTML = '';
    els.helpPanel.classList.remove('visible');
    els.helpBtn.classList.remove('open');
    els.helpBtn.textContent = '💡 Ajuda';

    buildValueButtons();

    hideMiniOverlay();
    els.problemBox.style.display      = 'flex';
    els.resolutionPanel.style.display = 'flex';
    els.stepValue.classList.add('active');
}

/* ================================================================
   PENALITZACIÓ
   ================================================================ */
function penalize(btn) {
    if (isPenalizing || isTransitioning || attemptsLeft <= 0) return;
    isPenalizing = true;
    if (btn) {
        btn.classList.add('error-shake');
        setTimeout(() => btn.classList.remove('error-shake'), 400);
    }
    els.attemptsDisplay.classList.add('blink');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        attemptsLeft--;
        els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
        els.attemptsDisplay.className = 'attempts-counter' +
            (attemptsLeft < 2 ? ' danger' : '');
        isPenalizing = false;
        if (attemptsLeft <= 0) {
            isTransitioning = true;
            els.stepValue.classList.remove('active');
            _finishOp(0);
        }
    }, 650);
}

/* ================================================================
   FI D'OPERACIÓ
   ================================================================ */
function _finishOp(points) {
    const p = currentProblem;
    sessionScore += points;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;

    const typeLabel = p.find.type === 'side' ? 'costat' : 'angle';
    recordAnswerToHistory(`${typeLabel} ${p.find.name} del triangle`, p.answer, points > 0);
    recordResult(points > 0 ? Math.min(MAX_INTENTS - attemptsLeft + 1, 3) : 4);

    const waitTime = showMiniOverlay(points);
    setTimeout(() => {
        hideMiniOverlay();
        if (currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            currentOperation++;
            buildLevel();
        }
    }, waitTime);
}

/* ================================================================
   AJUDA
   ================================================================ */
function toggleHelp() {
    const open = els.helpPanel.classList.contains('visible');
    if (open) {
        els.helpPanel.classList.remove('visible');
        els.helpBtn.classList.remove('open');
        els.helpBtn.textContent = '💡 Ajuda';
    } else {
        els.helpPanel.innerHTML = buildHints(currentProblem);
        els.helpPanel.classList.add('visible');
        els.helpBtn.classList.add('open');
        els.helpBtn.textContent = '✖ Tanca';
    }
}

function getTriangleCase(sideKeys, angleKeys) {
    const nS = sideKeys.length;
    if (nS === 3)              return 'SSS';
    if (angleKeys.length >= 2) return 'AAS';
    if (nS === 2 && angleKeys.length === 1) {
        const angLower = angleKeys[0].toLowerCase();
        return sideKeys.includes(angLower) ? 'SSA' : 'SAS';
    }
    return 'OTHER';
}

function buildHints(p) {
    const na       = p.numericAngles;
    const sideKeys = Object.keys(p.given.sides  || {});
    const angleKeys= Object.keys(p.given.angles || {});
    const nS       = sideKeys.length;
    const hasRight = Object.values(na).some(v => v === 90);
    const findSide = p.find.type === 'side';
    const case_    = getTriangleCase(sideKeys, angleKeys);

    const av   = Object.values(na);
    const isIso = av[0]===av[1] || av[1]===av[2] || av[0]===av[2];

    const ranked = [];

    if (hasRight && nS >= 2 && findSide) {
        ranked.push({
            badge: '1r 🏆', badgeClass: 'badge-best', best: true,
            icon: '📐', name: 'Teorema de Pitàgores',
            formula: 'a² + b² = c²  (c = hipotenusa)',
            reason: 'Triangle rectangle amb 2 costats: mètode directe i òptim.',
        });
        ranked.push({
            badge: '2n', badgeClass: 'badge-second', best: false,
            icon: '📐', name: 'Teorema del cosinus',
            formula: 'c² = a² + b² − 2ab·cos(90°) = a² + b²',
            reason: 'Funciona, però amb cos(90°) = 0 es redueix a Pitàgores.',
        });
    } else if (case_ === 'AAS') {
        ranked.push({
            badge: '1r 🏆', badgeClass: 'badge-best', best: true,
            icon: '📏', name: 'Teorema del sinus',
            formula: p.step2hint,
            reason: 'Coneixes 2 angles i 1 costat: la raó del sinus és directa.',
        });
    } else if (case_ === 'SSA') {
        ranked.push({
            badge: '1r 🏆', badgeClass: 'badge-best', best: true,
            icon: '📏', name: 'Teorema del sinus',
            formula: p.step2hint,
            reason: "Coneixes 2 costats i l'angle oposat a un: la raó del sinus és directa.",
        });
    } else if (case_ === 'SAS') {
        ranked.push({
            badge: '1r 🏆', badgeClass: 'badge-best', best: true,
            icon: '📐', name: 'Teorema del cosinus',
            formula: p.step2hint,
            reason: "Coneixes 2 costats i l'angle entre ells: el cosinus és l'únic mètode directe.",
        });
        ranked.push({
            badge: '2n', badgeClass: 'badge-second', best: false,
            icon: '📏', name: 'Teorema del sinus',
            formula: 'a / sin(A) = b / sin(B) = c / sin(C)',
            reason: 'Un cop trobat el tercer costat, pots trobar els angles restants.',
        });
    } else if (case_ === 'SSS') {
        ranked.push({
            badge: '1r 🏆', badgeClass: 'badge-best', best: true,
            icon: '📐', name: 'Teorema del cosinus',
            formula: p.step2hint,
            reason: 'Coneixes els 3 costats: despeça directament l\'angle.',
        });
        ranked.push({
            badge: '2n', badgeClass: 'badge-second', best: false,
            icon: '📏', name: 'Teorema del sinus',
            formula: 'a / sin(A) = b / sin(B)',
            reason: 'Possible alternativa, però primer necessitaries trobar un angle.',
        });
    }

    if (isIso) {
        const eqPairs = [];
        if (na.A === na.B) eqPairs.push('A = B → a = b');
        if (na.B === na.C) eqPairs.push('B = C → b = c');
        if (na.A === na.C) eqPairs.push('A = C → a = c');
        ranked.push({
            badge: '💡', badgeClass: 'badge-tip', best: false,
            icon: '🔁', name: 'Propietat isòsceles',
            formula: eqPairs.join('  ·  '),
            reason: 'Angles iguals → costats iguals. Pot simplificar els càlculs.',
        });
    }

    return ranked.map(h => `
        <div class="hint-item${h.best ? ' hint-best' : ''}">
            <div class="hint-left">
                <span class="hint-badge ${h.badgeClass}">${h.badge}</span>
                <span class="hint-icon">${h.icon}</span>
            </div>
            <div class="hint-body">
                <span class="hint-name">${h.name}</span>
                <span class="hint-formula">${h.formula}</span>
                <span class="hint-reason">${h.reason}</span>
            </div>
        </div>`).join('');
}

/* ================================================================
   BOTONS DE VALOR (4 opcions múltiples)
   ================================================================ */
function buildValueButtons() {
    const p = currentProblem;
    const options = [p.answer, ...p.distractors];
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    els.valueButtons.innerHTML = '';
    options.forEach(val => {
        const btn = document.createElement('button');
        btn.className   = 'btn-value';
        btn.textContent = val;
        btn.setAttribute('aria-label', val);
        btn.onclick = () => checkValue(val, btn);
        els.valueButtons.appendChild(btn);
    });
}

function checkValue(val, btn) {
    if (isTransitioning || isPenalizing || attemptsLeft <= 0) return;
    if (val !== currentProblem.answer) {
        penalize(btn);
        return;
    }
    els.stepValue.classList.remove('active');
    isTransitioning = true;
    _finishOp(1);
}

/* ================================================================
   INICIALITZACIÓ — cridat des del HTML després de game-core.js
   ================================================================ */
function initGame() {
    shuffleDeck();
    injectSharedHTML();
    validateConfig();
    startGame();
}
