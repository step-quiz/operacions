/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/triangle-rectangle/triangle-rectangle.js
 * ROL: Lògica específica del joc "Triangle Rectangle — Teorema de Pitàgores".
 * DEPENDÈNCIES: js/game-core.js (estat global, startGame, endSession,
 *               showMiniOverlay, hideMiniOverlay, recordAnswerToHistory,
 *               recordResult, sessionScore, currentSession, currentOperation,
 *               attemptsLeft, isTransitioning, bgColors)
 *
 * CONVENCIÓ DEL TRIANGLE:
 *   A (baix-esquerra) = angle recte  ·  B (baix-dreta)  ·  C (dalt-esquerra)
 *   a = catet vertical (AC)
 *   b = catet horitzontal (AB)
 *   c = hipotenusa (BC)
 *   Pitàgores:  a² + b² = c²
 * ============================================================================
 */

/* ── CONFIGURACIÓ DEL JOC ───────────────────────────────────────────────── */
const TOTAL_SESSIONS    = window.APP_CONFIG?.defaultSessions      ?? 3;
const TOTAL_OPERATIONS  = window.APP_CONFIG?.defaultOperations    ?? 8;
const MAX_INTENTS       = window.APP_CONFIG?.defaultIntents       ?? 4;
const MAX_ENLLOC_MITJANA= window.APP_CONFIG?.defaultEnllocMitjana ?? 1;

/* ── PROBLEMES ──────────────────────────────────────────────────────────── */
/*
 * Cada problema té:
 *   find   : 'a' | 'b' | 'c'  — valor a trobar
 *   given  : { a?, b?, c? }   — valors coneguts (strings)
 *   answer : string            — resposta correcta
 *   distractors : [string x3]  — opcions incorrectes
 *   hint   : string            — pas a pas per a l'ajuda
 */
const PROBLEMS = [

    /* ── Troba la hipotenusa (c = √(a²+b²)) ────────────────────────────── */
    {
        id: 0, find: 'c',
        given: { a: '3', b: '4' },
        answer: '5',
        distractors: ['7', '√7', '2√2'],
        hint: 'c = √(3² + 4²) = √(9 + 16) = √25 = 5',
    },
    {
        id: 1, find: 'c',
        given: { a: '5', b: '12' },
        answer: '13',
        distractors: ['17', '11', '√119'],
        hint: 'c = √(5² + 12²) = √(25 + 144) = √169 = 13',
    },
    {
        id: 2, find: 'c',
        given: { a: '6', b: '8' },
        answer: '10',
        distractors: ['14', '√28', '7'],
        hint: 'c = √(6² + 8²) = √(36 + 64) = √100 = 10',
    },
    {
        id: 3, find: 'c',
        given: { a: '1', b: '1' },
        answer: '√2',
        distractors: ['2', '√3', '1'],
        hint: 'c = √(1² + 1²) = √(1 + 1) = √2',
    },
    {
        id: 4, find: 'c',
        given: { a: '1', b: '2' },
        answer: '√5',
        distractors: ['3', '√3', '√7'],
        hint: 'c = √(1² + 2²) = √(1 + 4) = √5',
    },
    {
        id: 5, find: 'c',
        given: { a: '2', b: '2' },
        answer: '2√2',
        distractors: ['4', '√6', '2√3'],
        hint: 'c = √(2² + 2²) = √(4 + 4) = √8 = 2√2',
    },
    {
        id: 6, find: 'c',
        given: { a: '8', b: '15' },
        answer: '17',
        distractors: ['23', '16', '√161'],
        hint: 'c = √(8² + 15²) = √(64 + 225) = √289 = 17',
    },
    {
        id: 7, find: 'c',
        given: { a: '3', b: '3' },
        answer: '3√2',
        distractors: ['6', '√15', '9'],
        hint: 'c = √(3² + 3²) = √(9 + 9) = √18 = 3√2',
    },
    {
        id: 8, find: 'c',
        given: { a: '7', b: '24' },
        answer: '25',
        distractors: ['31', '√527', '√625'],
        hint: 'c = √(7² + 24²) = √(49 + 576) = √625 = 25',
    },

    /* ── Troba el catet a (a = √(c²−b²)) ───────────────────────────────── */
    {
        id: 9, find: 'a',
        given: { b: '4', c: '5' },
        answer: '3',
        distractors: ['1', '√41', '6'],
        hint: 'a = √(c² − b²) = √(25 − 16) = √9 = 3',
    },
    {
        id: 10, find: 'a',
        given: { b: '12', c: '13' },
        answer: '5',
        distractors: ['1', '7', '√119'],
        hint: 'a = √(c² − b²) = √(169 − 144) = √25 = 5',
    },
    {
        id: 11, find: 'a',
        given: { b: '6', c: '10' },
        answer: '8',
        distractors: ['4', '√164', '√136'],
        hint: 'a = √(c² − b²) = √(100 − 36) = √64 = 8',
    },
    {
        id: 12, find: 'a',
        given: { b: '1', c: '√2' },
        answer: '1',
        distractors: ['√3', '2', '√5'],
        hint: 'a = √(c² − b²) = √(2 − 1) = √1 = 1',
    },
    {
        id: 13, find: 'a',
        given: { b: '1', c: '√5' },
        answer: '2',
        distractors: ['4', '√6', '√3'],
        hint: 'a = √(c² − b²) = √(5 − 1) = √4 = 2',
    },
    {
        id: 14, find: 'a',
        given: { b: '8', c: '17' },
        answer: '15',
        distractors: ['9', '7', '√353'],
        hint: 'a = √(c² − b²) = √(289 − 64) = √225 = 15',
    },

    /* ── Troba el catet b (b = √(c²−a²)) ───────────────────────────────── */
    {
        id: 15, find: 'b',
        given: { a: '3', c: '5' },
        answer: '4',
        distractors: ['2', '√34', '6'],
        hint: 'b = √(c² − a²) = √(25 − 9) = √16 = 4',
    },
    {
        id: 16, find: 'b',
        given: { a: '5', c: '13' },
        answer: '12',
        distractors: ['8', '√194', '10'],
        hint: 'b = √(c² − a²) = √(169 − 25) = √144 = 12',
    },
    {
        id: 17, find: 'b',
        given: { a: '9', c: '15' },
        answer: '12',
        distractors: ['6', '√306', '10'],
        hint: 'b = √(c² − a²) = √(225 − 81) = √144 = 12',
    },
    {
        id: 18, find: 'b',
        given: { a: '7', c: '25' },
        answer: '24',
        distractors: ['18', '26', '√576'],
        hint: 'b = √(c² − a²) = √(625 − 49) = √576 = 24',
    },
    {
        id: 19, find: 'b',
        given: { a: '2', c: '√8' },
        answer: '2',
        distractors: ['4', '√12', '√6'],
        hint: 'b = √(c² − a²) = √(8 − 4) = √4 = 2',
    },
];

/* ── ESTAT ESPECÍFIC D'AQUEST JOC ───────────────────────────────────────── */
let deck           = [];
let deckPos        = 0;
let isPenalizing   = false;
let currentProblem = null;

/* ── CACHE DOM ──────────────────────────────────────────────────────────── */
const els = {
    body:            document.body,
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

/* ── UTILITATS NUMÈRIQUES ───────────────────────────────────────────────── */
/**
 * Avalua un string de valor matemàtic a un número.
 * Accepta: '5', '√2', '2√3', '3√2', etc.
 */
function evalVal(s) {
    if (s == null || s === '') return 0;
    // Format n√m  o  √m
    const m = String(s).match(/^(\d*\.?\d*)√(\d+)$/);
    if (m) {
        const coef = m[1] !== '' ? parseFloat(m[1]) : 1;
        return coef * Math.sqrt(parseInt(m[2], 10));
    }
    return parseFloat(s);
}

/**
 * Retorna les dimensions numèriques dels dos catets (aN, bN).
 * Independentment de quin sigui el valor desconegut.
 */
function getTriangleDimensions(p) {
    let aN, bN;
    if (p.find === 'c') {
        aN = evalVal(p.given.a);
        bN = evalVal(p.given.b);
    } else if (p.find === 'a') {
        bN = evalVal(p.given.b);
        const cN = evalVal(p.given.c);
        aN = Math.sqrt(Math.max(0, cN * cN - bN * bN));
    } else {   // find === 'b'
        aN = evalVal(p.given.a);
        const cN = evalVal(p.given.c);
        bN = Math.sqrt(Math.max(0, cN * cN - aN * aN));
    }
    return { aN: aN || 1, bN: bN || 1 };
}

/* ── BARALLA I SELECCIÓ DE PROBLEMES ─────────────────────────────────────── */
function shuffleDeck() {
    deck = PROBLEMS.map((_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    deckPos = 0;
}

function selectProblem() {
    if (deckPos >= deck.length) shuffleDeck();
    return PROBLEMS[deck[deckPos++]];
}

/* ── DIBUIX DEL TRIANGLE RECTANGLE SVG ─────────────────────────────────── */
/*
 * Convenció visual:
 *   A (baix-esquerra) = angle recte  →  marcador quadrat
 *   C (dalt-esquerra) = vèrtex superior
 *   B (baix-dreta)   = vèrtex de la dreta
 *   a (costat AC)    = catet vertical   (esquerra)
 *   b (costat AB)    = catet horitzontal (baix)
 *   c (costat BC)    = hipotenusa
 * El costat desconegut es mostra en color primari i amb línia discontínua.
 */
function drawRightTriangle(p) {
    const svg = els.triangleSvg;
    const { aN, bN } = getTriangleDimensions(p);

    // ── Escala per encabir al viewBox 240×195 (marges: 30 dalt/baix, 40 lat.)
    const MAX_W = 155, MAX_H = 120;
    const scaleW = MAX_W / bN;
    const scaleH = MAX_H / aN;
    const scale  = Math.min(scaleW, scaleH);
    const bPx    = bN * scale;
    const aPx    = aN * scale;

    // ── Vèrtexs
    const AX = 38,      AY = 162;          // angle recte (baix-esq)
    const BX = AX + bPx, BY = AY;          // baix-dret
    const CX = AX,       CY = AY - aPx;   // dalt-esq

    // ── Colors
    const COL_KNOWN    = '#334155';
    const COL_UNKNOWN  = '#7c3aed';
    const isAUnk = (p.find === 'a');
    const isBUnk = (p.find === 'b');
    const isCUnk = (p.find === 'c');

    const colA = isAUnk ? COL_UNKNOWN : COL_KNOWN;
    const colB = isBUnk ? COL_UNKNOWN : COL_KNOWN;
    const colC = isCUnk ? COL_UNKNOWN : COL_KNOWN;

    const strokeA = `stroke="${colA}" stroke-width="2.5"${isAUnk ? ' stroke-dasharray="7,4"' : ''}`;
    const strokeB = `stroke="${colB}" stroke-width="2.5"${isBUnk ? ' stroke-dasharray="7,4"' : ''}`;
    const strokeC = `stroke="${colC}" stroke-width="2.5"${isCUnk ? ' stroke-dasharray="7,4"' : ''}`;

    // ── Etiquetes de valors
    const labelA = isAUnk ? '?' : p.given.a;
    const labelB = isBUnk ? '?' : p.given.b;
    const labelC = isCUnk ? '?' : p.given.c;

    // ── Posicions d'etiquetes
    const midAY  = (AY + CY) / 2;          // mig costat a  → a l'esquerra
    const midBX  = (AX + BX) / 2;          // mig costat b  → a baix
    const midCX  = (BX + CX) / 2;          // mig hipotenusa
    const midCY  = (BY + CY) / 2;

    // Offset perpendicular exterior de la hipotenusa
    const bcLen  = Math.sqrt((CX - BX) ** 2 + (CY - BY) ** 2);
    const bcDX   = (CX - BX) / bcLen;
    const bcDY   = (CY - BY) / bcLen;
    // Girar 90° CCW (exterior del triangle)
    const perpDX = -bcDY;
    const perpDY =  bcDX;
    const OFFSET_C = 16;
    const lCX = midCX + perpDX * OFFSET_C;
    const lCY = midCY + perpDY * OFFSET_C;

    // Marcador angle recte a A
    const SQ = 10;

    svg.innerHTML = `
        <!-- Ombra interior del triangle -->
        <polygon points="${AX},${AY} ${BX},${BY} ${CX},${CY}"
                 fill="#ede9fe" stroke="none" opacity="0.55"/>

        <!-- Costat a (AC, catet vertical) -->
        <line x1="${AX}" y1="${AY}" x2="${CX}" y2="${CY}" ${strokeA}/>

        <!-- Costat b (AB, catet horitzontal) -->
        <line x1="${AX}" y1="${AY}" x2="${BX}" y2="${BY}" ${strokeB}/>

        <!-- Costat c (BC, hipotenusa) -->
        <line x1="${BX}" y1="${BY}" x2="${CX}" y2="${CY}" ${strokeC}/>

        <!-- Marcador angle recte (quadradet a A) -->
        <path d="M ${AX},${AY - SQ} L ${AX + SQ},${AY - SQ} L ${AX + SQ},${AY}"
              fill="none" stroke="#64748b" stroke-width="1.5"/>

        <!-- Etiqueta costat a -->
        <text x="${AX - 12}" y="${midAY + 5}"
              fill="${colA}" font-size="14" font-weight="bold"
              font-family="Courier New, monospace" text-anchor="middle">${labelA}</text>

        <!-- Etiqueta costat b -->
        <text x="${midBX}" y="${AY + 19}"
              fill="${colB}" font-size="14" font-weight="bold"
              font-family="Courier New, monospace" text-anchor="middle">${labelB}</text>

        <!-- Etiqueta hipotenusa c -->
        <text x="${lCX}" y="${lCY + 5}"
              fill="${colC}" font-size="14" font-weight="bold"
              font-family="Courier New, monospace" text-anchor="middle">${labelC}</text>

        <!-- Noms de vèrtexs (subtils) -->
        <text x="${AX - 13}" y="${AY + 14}" fill="#94a3b8" font-size="10"
              font-family="sans-serif" text-anchor="middle">A</text>
        <text x="${BX + 10}" y="${AY + 6}" fill="#94a3b8" font-size="10"
              font-family="sans-serif" text-anchor="middle">B</text>
        <text x="${CX - 12}" y="${CY - 4}" fill="#94a3b8" font-size="10"
              font-family="sans-serif" text-anchor="middle">C</text>
    `;
}

/* ── CONSTRUIR UN NIVELL ─────────────────────────────────────────────────── */
function buildLevel() {
    attemptsLeft    = MAX_INTENTS;
    isPenalizing    = false;
    isTransitioning = false;

    els.body.style.backgroundColor =
        bgColors[(currentSession * TOTAL_OPERATIONS + currentOperation) % bgColors.length];

    currentProblem = selectProblem();

    drawRightTriangle(currentProblem);

    els.sessionDisplay.innerText  = `Sessió ${currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText      = `Problema ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText    = `Punts: ${sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';

    const findLabel = {
        a: 'el catet <strong>a</strong>',
        b: 'el catet <strong>b</strong>',
        c: 'la hipotenusa <strong>c</strong>',
    }[currentProblem.find];
    els.stepInstruction.innerHTML = `Quant val ${findLabel}?`;

    // Tanca l'ajuda
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

/* ── BOTONS DE VALOR (4 opcions múltiples barrejades) ───────────────────── */
function buildValueButtons() {
    const p       = currentProblem;
    const options = [p.answer, ...p.distractors];

    // Fisher–Yates shuffle
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

/* ── COMPROVACIÓ DE RESPOSTA ─────────────────────────────────────────────── */
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

/* ── PENALITZACIÓ (resposta incorrecta) ─────────────────────────────────── */
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
        els.attemptsDisplay.innerText    = `Intents: ${attemptsLeft}`;
        els.attemptsDisplay.className    = 'attempts-counter' +
            (attemptsLeft < 2 ? ' danger' : '');
        isPenalizing = false;
        if (attemptsLeft <= 0) {
            isTransitioning = true;
            els.stepValue.classList.remove('active');
            _finishOp(0);
        }
    }, 650);
}

/* ── FI D'OPERACIÓ ───────────────────────────────────────────────────────── */
function _finishOp(points) {
    const p = currentProblem;
    sessionScore += points;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;

    const labelMap = { a: 'catet a', b: 'catet b', c: 'hipotenusa c' };
    recordAnswerToHistory(
        `${labelMap[p.find]} del triangle (a=${p.given.a ?? '?'}, b=${p.given.b ?? '?'}, c=${p.given.c ?? '?'})`,
        p.answer,
        points > 0,
    );
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

/* ── AJUDA (pistes pas a pas) ────────────────────────────────────────────── */
function toggleHelp() {
    const isOpen = els.helpPanel.classList.contains('visible');
    if (isOpen) {
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

function buildHints(p) {
    const formulaMap = {
        c: 'c = √(a² + b²)',
        a: 'a = √(c² − b²)',
        b: 'b = √(c² − a²)',
    };
    const reasonMap = {
        c: 'Coneixes els dos catets: aplica directament Pitàgores per trobar la hipotenusa.',
        a: 'Coneixes la hipotenusa i un catet: aïlla el catet desconegut a Pitàgores.',
        b: 'Coneixes la hipotenusa i un catet: aïlla el catet desconegut a Pitàgores.',
    };

    const hints = [
        {
            badge: '1r 🏆', badgeClass: 'badge-best', best: true,
            icon: '📐',
            name:    'Teorema de Pitàgores',
            formula: formulaMap[p.find],
            reason:  reasonMap[p.find],
        },
        {
            badge: '💡', badgeClass: 'badge-tip', best: false,
            icon:    '🔢',
            name:    'Càlcul pas a pas',
            formula: p.hint,
            reason:  'Substitueix els valors i simplifica l\'arrel.',
        },
    ];

    return hints.map(h => `
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

/* ── INICIALITZACIÓ ──────────────────────────────────────────────────────── */
function initGame() {
    shuffleDeck();
    injectSharedHTML();
    validateConfig();
    startGame();
}
