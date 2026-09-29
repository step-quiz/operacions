/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafica-i-funcio/grafica-i-funcio.js
 * ROL: Joc «Gràfica i funció» (grafica-i-funcio.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa fixed-sessions.js.
 * ============================================================================
 */

import { FixedSessions } from '../fixed-sessions.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { setDifficulty, restartGame });

// ============================================================
// CONFIGURACIÓ
// ============================================================
const TOTAL_OPERATIONS = 5;
let difficultyLevel = 1; // 1, 2 o 3

let currentOperation = 0;
let score = 0;
let isTransitioning = false;
let currentSeed = null;
let funcColor = '#3b82f6';
let showFuncLabel = false;
let lastSeedStr = '';

const _gfCanvas = document.getElementById('graph-canvas');
const ctx = _gfCanvas.getContext('2d');

// [FIX BUG3] Escalar el canvas per devicePixelRatio.
// Tot el codi dibuixa en espai 600×600; el canvas físic té més píxels.
(function _applyDPR() {
    const dpr = window.devicePixelRatio || 1;
    _gfCanvas.width = Math.round(600 * dpr);
    _gfCanvas.height = Math.round(600 * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
})();

const TYPE_INFO = {
    directa: {
        label: 'Funció de proporció directa',
        levels: [1, 2, 3],
        confusedWith: ['afi', 'quadratica', 'inversa'],
    },
    afi: { label: 'Funció afí', levels: [1, 2, 3], confusedWith: ['directa', 'quadratica', 'cubica'] },
    quadratica: { label: 'Funció quadràtica', levels: [1, 2, 3], confusedWith: ['cubica', 'afi', 'directa'] },
    inversa: { label: 'Funció de proporció inversa', levels: [1, 2, 3], confusedWith: ['exp', 'log', 'quadratica'] },
    exp: { label: 'Funció exponencial', levels: [2, 3], confusedWith: ['log', 'inversa', 'quadratica'] },
    log: { label: 'Funció logarítmica', levels: [2, 3], confusedWith: ['exp', 'inversa', 'afi'] },
    cubica: { label: 'Funció polinòmica de grau ≥ 3', levels: [3], confusedWith: ['quadratica', 'afi', 'exp'] },
};

const SEED_FUNCTIONS = [
    {
        type: 'directa',
        f: x => 2 * x,
        str: 'y = 2x',
        dist: [
            { str: 'y = -2x', f: x => -2 * x },
            { str: 'y = \\frac{1}{2}x', f: x => 0.5 * x },
            { str: 'y = 3x', f: x => 3 * x },
        ],
    },
    {
        type: 'directa',
        f: x => -x,
        str: 'y = -x',
        dist: [
            { str: 'y = x', f: x => x },
            { str: 'y = -2x', f: x => -2 * x },
            { str: 'y = -\\frac{1}{2}x', f: x => -0.5 * x },
        ],
    },
    {
        type: 'directa',
        f: x => 0.5 * x,
        str: 'y = \\frac{1}{2}x',
        dist: [
            { str: 'y = x', f: x => x },
            { str: 'y = 2x', f: x => 2 * x },
            { str: 'y = -\\frac{1}{2}x', f: x => -0.5 * x },
        ],
    },
    {
        type: 'directa',
        f: x => -3 * x,
        str: 'y = -3x',
        dist: [
            { str: 'y = 3x', f: x => 3 * x },
            { str: 'y = -x', f: x => -x },
            { str: 'y = -2x', f: x => -2 * x },
        ],
    },
    {
        type: 'directa',
        f: x => 3 * x,
        str: 'y = 3x',
        dist: [
            { str: 'y = -3x', f: x => -3 * x },
            { str: 'y = 2x', f: x => 2 * x },
            { str: 'y = x', f: x => x },
        ],
    },

    {
        type: 'afi',
        f: x => 2 * x + 1,
        str: 'y = 2x + 1',
        dist: [
            { str: 'y = 2x - 1', f: x => 2 * x - 1 },
            { str: 'y = -2x + 1', f: x => -2 * x + 1 },
            { str: 'y = x + 1', f: x => x + 1 },
        ],
    },
    {
        type: 'afi',
        f: x => -x + 3,
        str: 'y = -x + 3',
        dist: [
            { str: 'y = x + 3', f: x => x + 3 },
            { str: 'y = -x - 3', f: x => -x - 3 },
            { str: 'y = -2x + 3', f: x => -2 * x + 3 },
        ],
    },
    {
        type: 'afi',
        f: x => x - 2,
        str: 'y = x - 2',
        dist: [
            { str: 'y = x + 2', f: x => x + 2 },
            { str: 'y = -x - 2', f: x => -x - 2 },
            { str: 'y = 2x - 2', f: x => 2 * x - 2 },
        ],
    },
    {
        type: 'afi',
        f: x => -2 * x - 1,
        str: 'y = -2x - 1',
        dist: [
            { str: 'y = 2x - 1', f: x => 2 * x - 1 },
            { str: 'y = -2x + 1', f: x => -2 * x + 1 },
            { str: 'y = -x - 1', f: x => -x - 1 },
        ],
    },
    {
        type: 'afi',
        f: x => 0.5 * x + 2,
        str: 'y = \\frac{1}{2}x + 2',
        dist: [
            { str: 'y = \\frac{1}{2}x - 2', f: x => 0.5 * x - 2 },
            { str: 'y = 2x + 2', f: x => 2 * x + 2 },
            { str: 'y = -\\frac{1}{2}x + 2', f: x => -0.5 * x + 2 },
        ],
    },
    {
        type: 'afi',
        f: x => -x - 2,
        str: 'y = -x - 2',
        dist: [
            { str: 'y = x - 2', f: x => x - 2 },
            { str: 'y = -x + 2', f: x => -x + 2 },
            { str: 'y = -2x - 2', f: x => -2 * x - 2 },
        ],
    },

    {
        type: 'quadratica',
        f: x => x * x - 4,
        str: 'y = x^2 - 4',
        dist: [
            { str: 'y = x^2 + 4', f: x => x * x + 4 },
            { str: 'y = -x^2 - 4', f: x => -x * x - 4 },
            { str: 'y = x^2 - 2', f: x => x * x - 2 },
        ],
    },
    {
        type: 'quadratica',
        f: x => -x * x + 2,
        str: 'y = -x^2 + 2',
        dist: [
            { str: 'y = x^2 + 2', f: x => x * x + 2 },
            { str: 'y = -x^2 - 2', f: x => -x * x - 2 },
            { str: 'y = -x^2 + 4', f: x => -x * x + 4 },
        ],
    },
    {
        type: 'quadratica',
        f: x => x * x + 2 * x,
        str: 'y = x^2 + 2x',
        dist: [
            { str: 'y = x^2 - 2x', f: x => x * x - 2 * x },
            { str: 'y = -x^2 + 2x', f: x => -x * x + 2 * x },
            { str: 'y = x^2 + 2x + 2', f: x => x * x + 2 * x + 2 },
        ],
    },
    {
        type: 'quadratica',
        f: x => -x * x - 2 * x,
        str: 'y = -x^2 - 2x',
        dist: [
            { str: 'y = x^2 - 2x', f: x => x * x - 2 * x },
            { str: 'y = -x^2 + 2x', f: x => -x * x + 2 * x },
            { str: 'y = -x^2 - 2x + 2', f: x => -x * x - 2 * x + 2 },
        ],
    },
    {
        type: 'quadratica',
        f: x => 2 * x * x - 3,
        str: 'y = 2x^2 - 3',
        dist: [
            { str: 'y = 2x^2 + 3', f: x => 2 * x * x + 3 },
            { str: 'y = -2x^2 - 3', f: x => -2 * x * x - 3 },
            { str: 'y = x^2 - 3', f: x => x * x - 3 },
        ],
    },
    {
        type: 'quadratica',
        f: x => -0.5 * x * x + 1,
        str: 'y = -\\frac{1}{2}x^2 + 1',
        dist: [
            { str: 'y = \\frac{1}{2}x^2 + 1', f: x => 0.5 * x * x + 1 },
            { str: 'y = -x^2 + 1', f: x => -x * x + 1 },
            { str: 'y = -\\frac{1}{2}x^2 - 1', f: x => -0.5 * x * x - 1 },
        ],
    },
    {
        type: 'quadratica',
        f: x => x * x - 2 * x - 1,
        str: 'y = x^2 - 2x - 1',
        dist: [
            { str: 'y = x^2 + 2x - 1', f: x => x * x + 2 * x - 1 },
            { str: 'y = x^2 - 2x + 1', f: x => x * x - 2 * x + 1 },
            { str: 'y = -x^2 - 2x - 1', f: x => -x * x - 2 * x - 1 },
        ],
    },

    {
        type: 'inversa',
        f: x => 2 / x,
        str: 'y = \\frac{2}{x}',
        dist: [
            { str: 'y = -\\frac{2}{x}', f: x => -2 / x },
            { str: 'y = \\frac{4}{x}', f: x => 4 / x },
            { str: 'y = \\frac{1}{x}', f: x => 1 / x },
        ],
    },
    {
        type: 'inversa',
        f: x => -2 / x,
        str: 'y = -\\frac{2}{x}',
        dist: [
            { str: 'y = \\frac{2}{x}', f: x => 2 / x },
            { str: 'y = -\\frac{4}{x}', f: x => -4 / x },
            { str: 'y = -\\frac{1}{x}', f: x => -1 / x },
        ],
    },
    {
        type: 'inversa',
        f: x => 4 / x,
        str: 'y = \\frac{4}{x}',
        dist: [
            { str: 'y = -\\frac{4}{x}', f: x => -4 / x },
            { str: 'y = \\frac{2}{x}', f: x => 2 / x },
            { str: 'y = \\frac{1}{x}', f: x => 1 / x },
        ],
    },
    {
        type: 'inversa',
        f: x => -4 / x,
        str: 'y = -\\frac{4}{x}',
        dist: [
            { str: 'y = \\frac{4}{x}', f: x => 4 / x },
            { str: 'y = -\\frac{2}{x}', f: x => -2 / x },
            { str: 'y = -\\frac{1}{x}', f: x => -1 / x },
        ],
    },
    {
        type: 'inversa',
        f: x => 1 / x,
        str: 'y = \\frac{1}{x}',
        dist: [
            { str: 'y = -\\frac{1}{x}', f: x => -1 / x },
            { str: 'y = \\frac{2}{x}', f: x => 2 / x },
            { str: 'y = \\frac{4}{x}', f: x => 4 / x },
        ],
    },

    {
        type: 'exp',
        f: x => Math.pow(2, x),
        str: 'y = 2^x',
        dist: [
            { str: 'y = 3^x', f: x => Math.pow(3, x) },
            { str: 'y = \\left(\\frac{1}{2}\\right)^x', f: x => Math.pow(0.5, x) },
            { str: 'y = 2 \\cdot 2^x', f: x => 2 * Math.pow(2, x) },
        ],
    },
    {
        type: 'exp',
        f: x => Math.pow(0.5, x),
        str: 'y = \\left(\\frac{1}{2}\\right)^x',
        dist: [
            { str: 'y = 2^x', f: x => Math.pow(2, x) },
            { str: 'y = \\left(\\frac{1}{3}\\right)^x', f: x => Math.pow(1 / 3, x) },
            { str: 'y = 2 \\cdot \\left(\\frac{1}{2}\\right)^x', f: x => 2 * Math.pow(0.5, x) },
        ],
    },
    {
        type: 'exp',
        f: x => Math.pow(3, x),
        str: 'y = 3^x',
        dist: [
            { str: 'y = 2^x', f: x => Math.pow(2, x) },
            { str: 'y = \\left(\\frac{1}{3}\\right)^x', f: x => Math.pow(1 / 3, x) },
            { str: 'y = 3 \\cdot 2^x', f: x => 3 * Math.pow(2, x) },
        ],
    },
    {
        type: 'exp',
        f: x => Math.pow(1 / 3, x),
        str: 'y = \\left(\\frac{1}{3}\\right)^x',
        dist: [
            { str: 'y = \\left(\\frac{1}{2}\\right)^x', f: x => Math.pow(0.5, x) },
            { str: 'y = 3^x', f: x => Math.pow(3, x) },
            { str: 'y = 2 \\cdot \\left(\\frac{1}{3}\\right)^x', f: x => 2 * Math.pow(1 / 3, x) },
        ],
    },
    {
        type: 'exp',
        f: x => 2 * Math.pow(2, x),
        str: 'y = 2 \\cdot 2^x',
        dist: [
            { str: 'y = 2^x', f: x => Math.pow(2, x) },
            { str: 'y = 3 \\cdot 2^x', f: x => 3 * Math.pow(2, x) },
            { str: 'y = 2 \\cdot 3^x', f: x => 2 * Math.pow(3, x) },
        ],
    },

    {
        type: 'log',
        f: x => (x > 0 ? Math.log2(x) : NaN),
        str: 'y = \\log_2(x)',
        dist: [
            { str: 'y = -\\log_2(x)', f: x => (x > 0 ? -Math.log2(x) : NaN) },
            { str: 'y = \\log_3(x)', f: x => (x > 0 ? Math.log(x) / Math.log(3) : NaN) },
            { str: 'y = 2\\log_2(x)', f: x => (x > 0 ? 2 * Math.log2(x) : NaN) },
        ],
    },
    {
        type: 'log',
        f: x => (x > 0 ? -Math.log2(x) : NaN),
        str: 'y = -\\log_2(x)',
        dist: [
            { str: 'y = \\log_2(x)', f: x => (x > 0 ? Math.log2(x) : NaN) },
            { str: 'y = -\\log_3(x)', f: x => (x > 0 ? -Math.log(x) / Math.log(3) : NaN) },
            { str: 'y = -2\\log_2(x)', f: x => (x > 0 ? -2 * Math.log2(x) : NaN) },
        ],
    },
    {
        type: 'log',
        f: x => (x > 0 ? Math.log(x) / Math.log(3) : NaN),
        str: 'y = \\log_3(x)',
        dist: [
            { str: 'y = \\log_2(x)', f: x => (x > 0 ? Math.log2(x) : NaN) },
            { str: 'y = -\\log_3(x)', f: x => (x > 0 ? -Math.log(x) / Math.log(3) : NaN) },
            { str: 'y = \\log_3(x) + 1', f: x => (x > 0 ? Math.log(x) / Math.log(3) + 1 : NaN) },
        ],
    },
    {
        type: 'log',
        f: x => (x > 0 ? -Math.log(x) / Math.log(3) : NaN),
        str: 'y = -\\log_3(x)',
        dist: [
            { str: 'y = \\log_3(x)', f: x => (x > 0 ? Math.log(x) / Math.log(3) : NaN) },
            { str: 'y = -\\log_2(x)', f: x => (x > 0 ? -Math.log2(x) : NaN) },
            { str: 'y = -2\\log_3(x)', f: x => (x > 0 ? (-2 * Math.log(x)) / Math.log(3) : NaN) },
        ],
    },

    {
        type: 'cubica',
        f: x => x * x * x,
        str: 'y = x^3',
        dist: [
            { str: 'y = -x^3', f: x => -x * x * x },
            { str: 'y = x^3 + 2', f: x => x * x * x + 2 },
            { str: 'y = x^3 - 2x', f: x => x * x * x - 2 * x },
        ],
    },
    {
        type: 'cubica',
        f: x => -x * x * x,
        str: 'y = -x^3',
        dist: [
            { str: 'y = x^3', f: x => x * x * x },
            { str: 'y = -x^3 + 2', f: x => -x * x * x + 2 },
            { str: 'y = -x^3 - x', f: x => -x * x * x - x },
        ],
    },
    {
        type: 'cubica',
        f: x => x * x * x - 3 * x,
        str: 'y = x^3 - 3x',
        dist: [
            { str: 'y = x^3 + 3x', f: x => x * x * x + 3 * x },
            { str: 'y = -x^3 - 3x', f: x => -x * x * x - 3 * x },
            { str: 'y = x^3 - x', f: x => x * x * x - x },
        ],
    },
    {
        type: 'cubica',
        f: x => -x * x * x + 3 * x,
        str: 'y = -x^3 + 3x',
        dist: [
            { str: 'y = x^3 + 3x', f: x => x * x * x + 3 * x },
            { str: 'y = -x^3 - 3x', f: x => -x * x * x - 3 * x },
            { str: 'y = -x^3 + x', f: x => -x * x * x + x },
        ],
    },
    {
        type: 'cubica',
        f: x => x * x * x + x * x - 2 * x,
        str: 'y = x^3 + x^2 - 2x',
        dist: [
            { str: 'y = x^3 - x^2 + 2x', f: x => x * x * x - x * x + 2 * x },
            { str: 'y = x^3 + x^2 + 2x', f: x => x * x * x + x * x + 2 * x },
            { str: 'y = -x^3 + x^2 - 2x', f: x => -x * x * x + x * x - 2 * x },
        ],
    },
];

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getAvailableTypes() {
    return Object.keys(TYPE_INFO).filter(id => TYPE_INFO[id].levels.includes(difficultyLevel));
}

function setDifficulty(lvl, btn) {
    if (isTransitioning) return;
    difficultyLevel = lvl;
    document.querySelectorAll('.lvl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (currentOperation >= TOTAL_OPERATIONS) {
        currentOperation = 0;
        score = 0;
        document.getElementById('score-display').innerText = 'Punts: 0';
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('end-screen').classList.remove('active');
    }
    lastSeedStr = '';
    buildLevel();
}

function drawGrid() {
    ctx.clearRect(0, 0, 600, 600);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 600, 600);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
        const p = (i + 5) * 60;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, 600);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(600, p);
        ctx.stroke();
    }

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(300, 0);
    ctx.lineTo(300, 600);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(600, 300);
    ctx.stroke();

    ctx.font = '17px Segoe UI';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    for (let i = -5; i <= 5; i++) {
        if (i !== 0) {
            ctx.fillText(i, (i + 5) * 60, 320);
            ctx.fillText(i, 285, 600 - (i + 5) * 60 + 5);
        }
    }

    if (showFuncLabel) {
        ctx.font = 'bold 20px Segoe UI';
        ctx.fillStyle = funcColor;
        ctx.textAlign = 'right';
        ctx.fillText('f(x)', 582, 32);
    }
}

function drawFunction(fn, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.8;
    let first = true;
    for (let px = 0; px <= 600; px++) {
        const x = -5 + px / 60;
        const y = fn(x);
        if (isFinite(y) && !isNaN(y) && Math.abs(y) < 12) {
            const py = 300 - y * 60;
            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        } else {
            first = true;
        }
    }
    ctx.stroke();
}

function buildLevel() {
    FixedSessions?.seed(`q${currentOperation}`); // sessions fixes
    isTransitioning = false;
    showFuncLabel = false;

    document.getElementById('lvl-display').innerText = `Gràfica ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;

    const available = SEED_FUNCTIONS.filter(
        s => TYPE_INFO[s.type] && TYPE_INFO[s.type].levels.includes(difficultyLevel)
    );
    let seed,
        attempts = 0;
    do {
        seed = available[Math.floor(Math.random() * available.length)];
        attempts++;
    } while (seed.str === lastSeedStr && available.length > 1 && attempts < 15);
    lastSeedStr = seed.str;
    currentSeed = seed;

    funcColor = '#3b82f6';

    drawGrid();
    drawFunction(currentSeed.f, funcColor);

    document.getElementById('step-1').classList.add('active');
    document.getElementById('step-2').classList.remove('active');

    document.querySelectorAll('#step-1 .btn-option').forEach(b => {
        b.classList.remove('correct-flash', 'error-shake', 'wrong-choice');
    });

    buildTypeOptions();
}

function buildTypeOptions() {
    const correct = currentSeed.type;
    const availableTypes = getAvailableTypes();

    const preferred = (TYPE_INFO[correct].confusedWith || []).filter(t => availableTypes.includes(t));
    const others = availableTypes.filter(t => t !== correct && !preferred.includes(t));
    shuffleArray(preferred);
    shuffleArray(others);
    const distractorTypes = [...preferred, ...others].slice(0, 3);

    let options = [
        { label: TYPE_INFO[correct].label, correct: true },
        ...distractorTypes.map(t => ({ label: TYPE_INFO[t].label, correct: false })),
    ];
    shuffleArray(options);

    const container = document.getElementById('type-options');
    container.innerHTML = '';
    options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'btn-option';
        b.textContent = opt.label;
        b.onclick = () => checkStep1(opt.correct, b);
        container.appendChild(b);
    });
}

function checkStep1(isCorrect, btn) {
    if (isTransitioning) return;
    if (isCorrect) {
        isTransitioning = true;
        btn.classList.add('correct-flash');
        showFuncLabel = true;

        document.getElementById('step2-question').innerHTML =
            `La gràfica representa una <strong>${TYPE_INFO[currentSeed.type].label.toLowerCase()}</strong>.<br>Quina és la seva expressió algebraica?`;

        setTimeout(() => {
            document.getElementById('step-1').classList.remove('active');
            document.getElementById('step-2').classList.add('active');
            drawGrid();
            drawFunction(currentSeed.f, funcColor);
            buildFormulaOptions();
            isTransitioning = false;
        }, 700);
    } else {
        btn.classList.add('error-shake', 'wrong-choice');
    }
}

function buildFormulaOptions() {
    let options = [
        { str: currentSeed.str, correct: true },
        ...currentSeed.dist.map(d => ({ str: d.str, correct: false })),
    ];
    shuffleArray(options);

    const container = document.getElementById('formula-options');
    container.innerHTML = '';
    options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'btn-option btn-formula';

        katex.render(opt.str, b, { throwOnError: false, displayMode: false });

        b.onclick = () => checkStep2(opt.correct, b);
        container.appendChild(b);
    });
}

function checkStep2(isCorrect, btn) {
    if (isTransitioning) return;
    if (isCorrect) {
        isTransitioning = true;
        score++;
        document.getElementById('score-display').innerText = `Punts: ${score}`;
        btn.classList.add('correct-flash');
        setTimeout(() => {
            currentOperation++;
            if (currentOperation >= TOTAL_OPERATIONS) {
                showEndScreen();
            } else {
                buildLevel();
            }
        }, 1000);
    } else {
        btn.classList.add('error-shake', 'wrong-choice');
    }
}

function showEndScreen() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('end-screen').classList.add('active');

    const pct = score / TOTAL_OPERATIONS;
    const emoji = pct === 1 ? '🏆' : pct >= 0.6 ? '🎉' : '💪';
    document.getElementById('end-emoji').textContent = emoji;
    document.getElementById('end-score-text').innerHTML =
        `Has encertat <strong>${score} de ${TOTAL_OPERATIONS}</strong> expressions algebraiques!`;
}

function restartGame() {
    currentOperation = 0;
    score = 0;
    lastSeedStr = '';
    document.getElementById('score-display').innerText = 'Punts: 0';
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('end-screen').classList.remove('active');
    buildLevel();
}

buildLevel();

window.addEventListener('load', () => {
    const btns = document.querySelectorAll('.lvl-btn');
    if (btns.length >= 3) {
        btns[0].classList.add('attention-shake');
        btns[1].classList.add('attention-blink');
        btns[2].classList.add('attention-blink');
    }
});
