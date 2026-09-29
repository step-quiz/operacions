/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafica-funcio-i-derivada/grafica-funcio-i-derivada.js
 * ROL: Joc «La funció i la seva derivada» (grafica-funcio-i-derivada.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa fixed-sessions.js.
 * ============================================================================
 */

import { FixedSessions } from '../fixed-sessions.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { setDifficulty, checkStep1 });

// ============================================================
// CONFIGURACIÓ
// ============================================================
const TOTAL_SESSIONS = 2;
const TOTAL_OPERATIONS = 5;
const MAX_INTENTS = 8;
const K_DISTRACTORS = 3;
let difficultyLevel = 1; // 1, 2 o 3

let currentOperation = 0,
    sessionScore = 0,
    isTransitioning = false,
    showLegend = false;
let currentProblem = { fOriginal: null, fDerivada: null, colorOriginal: '', colorDerivada: '' };
const _gfdCanvas = document.getElementById('graph-canvas');
const ctx = _gfdCanvas.getContext('2d');

// [FIX BUG3] Escalar el canvas per devicePixelRatio.
(function _applyDPR() {
    const dpr = window.devicePixelRatio || 1;
    _gfdCanvas.width = Math.round(600 * dpr);
    _gfdCanvas.height = Math.round(600 * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
})();

// Si el nombre és enter (ex. 4,00), mostrem només "4"
const fmt = val => {
    const n = Number(val);
    const nearestInt = Math.round(n);
    if (Math.abs(n - nearestInt) < 1e-9) return String(nearestInt);
    return n.toFixed(2).replace('.', ',');
};

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const SEED_FUNCTIONS = [
    // Polinomis (Nivell 1, 2, 3)
    { type: 'poly', str: 'x^2 - 4', f: x => x * x - 4, df: x => 2 * x, crits: [0], infs: [] },
    { type: 'poly', str: '-x^2 + 1', f: x => -x * x + 1, df: x => -2 * x, crits: [0], infs: [] },
    { type: 'poly', str: 'x^2 + 2x', f: x => x * x + 2 * x, df: x => 2 * x + 2, crits: [-1], infs: [] },
    { type: 'poly', str: 'x^3 - 3x', f: x => x * x * x - 3 * x, df: x => 3 * x * x - 3, crits: [-1, 1], infs: [0] },
    {
        type: 'poly',
        str: 'x^3 + 3x^2',
        f: x => x * x * x + 3 * x * x,
        df: x => 3 * x * x + 6 * x,
        crits: [-2, 0],
        infs: [-1],
    },
    {
        type: 'poly',
        str: 'x^3 - 6x',
        f: x => x * x * x - 6 * x,
        df: x => 3 * x * x - 6,
        crits: [-1.41, 1.41],
        infs: [0],
    },
    {
        type: 'poly',
        str: 'x^4 - 2x^2',
        f: x => x * x * x * x - 2 * x * x,
        df: x => 4 * x * x * x - 4 * x,
        crits: [-1, 0, 1],
        infs: [-0.57, 0.57],
    },
    {
        type: 'poly',
        str: 'x^4 - 4x^2 + 3',
        f: x => x * x * x * x - 4 * x * x + 3,
        df: x => 4 * x * x * x - 8 * x,
        crits: [-1.41, 0, 1.41],
        infs: [-0.82, 0.82],
    },
    // Racionals sense asímptotes (Nivell 2, 3)
    {
        type: 'smooth',
        str: '4 / (x^2+1)',
        f: x => 4 / (x * x + 1),
        df: x => (-8 * x) / Math.pow(x * x + 1, 2),
        crits: [0],
        infs: [-0.57, 0.57],
    },
    {
        type: 'smooth',
        str: 'x / (x^2+1)',
        f: x => x / (x * x + 1),
        df: x => (1 - x * x) / Math.pow(x * x + 1, 2),
        crits: [-1, 1],
        infs: [0],
    },
    {
        type: 'smooth',
        str: '3 / (x^2+4)',
        f: x => 3 / (x * x + 4),
        df: x => (-6 * x) / Math.pow(x * x + 4, 2),
        crits: [0],
        infs: [-1.15, 1.15],
    },
    // Amb asímptotes (Nivell 3)
    { type: 'asym', str: 'x + 1/x', f: x => x + 1 / x, df: x => 1 - 1 / (x * x), crits: [-1, 1], vas: [0], infs: [] },
    { type: 'asym', str: 'x - 1/x', f: x => x - 1 / x, df: x => 1 + 1 / (x * x), crits: [], vas: [0], infs: [] },
];
function setDifficulty(lvl, btn) {
    if (isTransitioning) return;
    difficultyLevel = lvl;
    document.querySelectorAll('.lvl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buildLevel();
}

function generateProblem() {
    let filtered = SEED_FUNCTIONS;
    if (difficultyLevel === 1) filtered = SEED_FUNCTIONS.filter(s => s.type === 'poly');
    if (difficultyLevel === 2) filtered = SEED_FUNCTIONS.filter(s => s.type !== 'asym');

    const seed = filtered[Math.floor(Math.random() * filtered.length)];

    // Més varietat: A i B ja no són fixes
    const A_OPTIONS = [0.8, 1.0, 1.2, 1.5];
    const B_OPTIONS = [0.75, 1.0, 1.25];
    const A = A_OPTIONS[Math.floor(Math.random() * A_OPTIONS.length)];
    const B = B_OPTIONS[Math.floor(Math.random() * B_OPTIONS.length)] * (Math.random() > 0.5 ? 1 : -1);

    const h = Math.floor(Math.random() * 5) - 2;
    const k = Math.floor(Math.random() * 3) - 1;

    currentProblem.fOriginal = x => A * seed.f(B * (x - h)) + k;
    currentProblem.fDerivada = x => A * B * seed.df(B * (x - h));
    currentProblem.colorOriginal = Math.random() > 0.5 ? 'blue' : 'red';
    currentProblem.colorDerivada = currentProblem.colorOriginal === 'blue' ? 'red' : 'blue';

    //            document.getElementById('debug-info').innerHTML =
    //                `DEBUG: ${seed.str} | A=${fmt(A)} | B=${fmt(B)} | f(x) és ${currentProblem.colorOriginal}`;

    buildQuestions(seed, B, h);
}

function buildQuestions(seed, B, h) {
    const crits = seed.crits.map(c => c / B + h);
    const infs = seed.infs.map(i => i / B + h);
    const vas = (seed.vas || []).map(v => v / B + h); // reservat per a futurs usos

    const strF = `<span style="color:var(--func-${currentProblem.colorOriginal}); font-weight:bold;">f(x)</span>`;
    const strDF = `<span style="color:var(--func-${currentProblem.colorDerivada}); font-weight:bold;">f&nbsp;'&nbsp;(x)</span>`;
    const derivColor = `var(--func-${currentProblem.colorDerivada})`;

    const strDFat = xVal => `<span style="color:${derivColor}; font-weight:bold;">f&nbsp;'&nbsp;(${fmt(xVal)})</span>`;

    let pool = [];

    // 1. Extrems
    crits.forEach(x => {
        if (x < -4 || x > 4) return;
        const type = currentProblem.fDerivada(x - 0.1) > 0 ? 'màxim' : 'mínim';

        const dfVerb = Math.random() > 0.5 ? `${strDF} talla l'eix d'abscisses en x = ${fmt(x)}` : `${strDFat(x)} = 0`;

        pool.push({
            x: x,
            correct: `${strF} té un ${type} relatiu en x = ${fmt(x)}<br>i, per tant, ${dfVerb}.`,
            wrong: `${strF} té un ${type === 'màxim' ? 'mínim' : 'màxim'} relatiu en x = ${fmt(x)}<br>i, per tant, ${dfVerb}.`,
        });
    });

    // 2. Monotonia
    [-3, -1, 1, 3].forEach(x => {
        const realX = x + h;
        if (crits.some(c => Math.abs(c - realX) < 0.6)) return;

        const isPositive = currentProblem.fDerivada(realX) > 0;
        const monotonia = isPositive ? 'creixent' : 'decreixent';
        const correctSign = isPositive ? '&gt;' : '&lt;';
        const wrongSign = isPositive ? '&lt;' : '&gt;';

        // Espais correctes: "f'(a) < 0" / "f'(a) > 0"
        const dfAtWithSign = sign => `${strDFat(realX)} ${sign} 0`;

        pool.push({
            x: realX,
            correct: `${strF} és <strong>${monotonia}</strong> a prop de x = ${fmt(realX)},<br>i, per tant, ${dfAtWithSign(correctSign)}.`,
            wrong: `${strF} és <strong>${monotonia}</strong> a prop de x = ${fmt(realX)},<br>i, per tant, ${dfAtWithSign(wrongSign)}.`,
        });
    });

    // 3. Concavitat (Només Nivell 3)

    if (difficultyLevel === 3) {
        infs.forEach(x => {
            const sign =
                currentProblem.fDerivada(x + 0.1) > currentProblem.fDerivada(x - 0.1)
                    ? ['positiva', 'creixent']
                    : ['negativa', 'decreixent'];
            const wrongVerb = sign[1] === 'creixent' ? 'decreixent' : 'creixent';

            pool.push({
                x: x,
                correct: `A prop de x = ${fmt(x)}, ${strF} té concavitat <strong>${sign[0]}</strong>,<br>i això es confirma perquè ${strDF} és <strong>${sign[1]}</strong>.`,
                wrong: `A prop de x = ${fmt(x)}, ${strF} té concavitat <strong>${sign[0]}</strong>,<br>i això es confirma perquè ${strDF} és <strong>${wrongVerb}</strong>.`,
            });
        });
    }

    // Defensiu: si el pool queda buit, regenera
    if (pool.length === 0) {
        generateProblem();
        return;
    }

    // Selecció segons nivell (sense distractors duplicats)
    const correctObj = pool[Math.floor(Math.random() * pool.length)];
    let options = [{ label: correctObj.correct, correct: true }];

    // Construïm tots els distractors possibles i eliminem duplicats
    let uniqueWrongLabels = [
        ...new Set(
            pool.map(candidate => {
                const finalX = difficultyLevel === 1 ? correctObj.x : candidate.x;
                return candidate.wrong.replace(new RegExp(fmt(candidate.x), 'g'), fmt(finalX));
            })
        ),
    ].filter(label => label !== correctObj.correct);

    // Si no hi ha prou distractors únics, regenera (cas poc probable)
    if (uniqueWrongLabels.length < K_DISTRACTORS) {
        generateProblem();
        return;
    }

    // Barreja i agafa K_DISTRACTORS
    shuffleArray(uniqueWrongLabels);
    for (let i = 0; i < K_DISTRACTORS; i++) {
        options.push({ label: uniqueWrongLabels[i], correct: false });
    }

    renderOptions(options);
}

function renderOptions(opts) {
    const container = document.getElementById('justification-options');
    container.innerHTML = '';

    shuffleArray(opts).forEach(o => {
        const b = document.createElement('button');
        b.className = 'btn-option btn-neutral';
        b.style.textAlign = 'left';
        b.innerHTML = o.label;

        b.onclick = () => {
            if (isTransitioning) return;

            if (o.correct) {
                isTransitioning = true;
                b.classList.add('correct-flash');
                setTimeout(() => {
                    currentOperation++;
                    buildLevel();
                }, 1000);
            } else {
                b.classList.add('error-shake');
                setTimeout(() => b.classList.remove('error-shake'), 300);
            }
        };

        container.appendChild(b);
    });
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

    if (showLegend) {
        ctx.font = 'bold 20px Segoe UI';
        ctx.fillStyle = currentProblem.colorOriginal === 'blue' ? '#3b82f6' : '#ef4444';
        ctx.fillText('f(x)', 550, 40);

        ctx.fillStyle = currentProblem.colorDerivada === 'blue' ? '#3b82f6' : '#ef4444';
        ctx.fillText("f ' (x)", 550, 70);
    }
}

function drawFunction(fn, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    let first = true;
    for (let px = 0; px <= 600; px++) {
        const x = -5 + px / 60;
        const y = fn(x);

        if (isFinite(y) && Math.abs(y) < 12) {
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
    showLegend = false;

    // Reset visual dels botons del pas 1
    document.querySelectorAll('#step-1 .btn-option').forEach(btn => {
        btn.classList.remove('correct-flash', 'error-shake');
    });

    document.getElementById('step-1').classList.add('active');
    document.getElementById('step-2').classList.remove('active');

    generateProblem();
    drawGrid();

    drawFunction(
        currentProblem.colorOriginal === 'blue' ? currentProblem.fOriginal : currentProblem.fDerivada,
        '#3b82f6'
    );
    drawFunction(
        currentProblem.colorOriginal === 'red' ? currentProblem.fOriginal : currentProblem.fDerivada,
        '#ef4444'
    );

    document.getElementById('lvl-display').innerText = `Gràfica ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
}

function checkStep1(color, btn) {
    if (isTransitioning) return;

    if (color === currentProblem.colorOriginal) {
        isTransitioning = true;
        btn.classList.add('correct-flash');
        showLegend = true;

        setTimeout(() => {
            document.getElementById('step-1').classList.remove('active');
            document.getElementById('step-2').classList.add('active');

            drawGrid();
            drawFunction(
                currentProblem.colorOriginal === 'blue' ? currentProblem.fOriginal : currentProblem.fDerivada,
                '#3b82f6'
            );
            drawFunction(
                currentProblem.colorOriginal === 'red' ? currentProblem.fOriginal : currentProblem.fDerivada,
                '#ef4444'
            );

            isTransitioning = false;

            if (window.innerWidth >= 850) {
                document.getElementById('main-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 600);
    } else {
        btn.classList.add('error-shake');
        setTimeout(() => btn.classList.remove('error-shake'), 300);
    }
}

buildLevel();
// Activa el parpelleig inicial als botons de nivell 2 i 3 quan la pàgina es carrega
window.addEventListener('load', () => {
    const btns = document.querySelectorAll('.lvl-btn');
    if (btns.length >= 3) {
        btns[0].classList.add('attention-shake'); // Botó Nivell 1
        btns[1].classList.add('attention-blink');
        btns[2].classList.add('attention-blink');
    }
});
