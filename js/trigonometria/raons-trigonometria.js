/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/trigonometria/raons-trigonometria.js
 * ROL: Lògica específica del joc "Trigonometria — Valors exactes".
 * DEPENDÈNCIES: js/game-core.js (estat global, startGame, endSession,
 *               showMiniOverlay, hideMiniOverlay, recordAnswerToHistory,
 *               recordResult, sessionScore, currentSession, currentOperation,
 *               attemptsLeft, isTransitioning, bgColors)
 * ============================================================================
 */

/* ================================================================
   TAULA DE VALORS TRIGONOMÈTRICS
   Fem servir IDs de string per evitar problemes amb floats.
   ================================================================ */
const V = {
    ZERO:        'zero',
    ONE:         'one',
    NEG_ONE:     'neg_one',
    HALF:        'half',
    NEG_HALF:    'neg_half',
    SQRT2_2:     'sqrt2_2',
    NEG_SQRT2_2: 'neg_sqrt2_2',
    SQRT3_2:     'sqrt3_2',
    NEG_SQRT3_2: 'neg_sqrt3_2',
    SQRT3:       'sqrt3',
    NEG_SQRT3:   'neg_sqrt3',
    SQRT3_3:     'sqrt3_3',
    NEG_SQRT3_3: 'neg_sqrt3_3',
    UNDEF:       'undef',
};

/* HTML de cada valor (fracció visual) */
const VAL_HTML = {
    zero:        '0',
    one:         '1',
    neg_one:     '−1',
    half:        '<span class="frac"><span class="num">1</span><span class="den">2</span></span>',
    neg_half:    '−<span class="frac"><span class="num">1</span><span class="den">2</span></span>',
    sqrt2_2:     '<span class="frac"><span class="num">√2</span><span class="den">2</span></span>',
    neg_sqrt2_2: '−<span class="frac"><span class="num">√2</span><span class="den">2</span></span>',
    sqrt3_2:     '<span class="frac"><span class="num">√3</span><span class="den">2</span></span>',
    neg_sqrt3_2: '−<span class="frac"><span class="num">√3</span><span class="den">2</span></span>',
    sqrt3:       '√3',
    neg_sqrt3:   '−√3',
    sqrt3_3:     '<span class="frac"><span class="num">√3</span><span class="den">3</span></span>',
    neg_sqrt3_3: '−<span class="frac"><span class="num">√3</span><span class="den">3</span></span>',
    undef:       '<span style="font-size:2em;line-height:1">∞</span>',
};

/* Text pla per l'informe */
const VAL_TEXT = {
    zero: '0', one: '1', neg_one: '−1',
    half: '1/2', neg_half: '−1/2',
    sqrt2_2: '√2/2', neg_sqrt2_2: '−√2/2',
    sqrt3_2: '√3/2', neg_sqrt3_2: '−√3/2',
    sqrt3: '√3', neg_sqrt3: '−√3',
    sqrt3_3: '√3/3', neg_sqrt3_3: '−√3/3',
    undef: '∞',
};

/* Pool de tots els valors possibles per generar distractors */
const ALL_VALS = ['zero','one','neg_one','half','neg_half','sqrt2_2','neg_sqrt2_2',
                  'sqrt3_2','neg_sqrt3_2','sqrt3','neg_sqrt3','sqrt3_3','neg_sqrt3_3','undef'];

/* Taula completa per angle (0–360°, múltiples de 30 o 45) */
const TRIG = {
    0:   { sin: V.ZERO,        cos: V.ONE,         tan: V.ZERO        },
    30:  { sin: V.HALF,        cos: V.SQRT3_2,     tan: V.SQRT3_3     },
    45:  { sin: V.SQRT2_2,     cos: V.SQRT2_2,     tan: V.ONE         },
    60:  { sin: V.SQRT3_2,     cos: V.HALF,        tan: V.SQRT3       },
    90:  { sin: V.ONE,         cos: V.ZERO,        tan: V.UNDEF       },
    120: { sin: V.SQRT3_2,     cos: V.NEG_HALF,    tan: V.NEG_SQRT3   },
    135: { sin: V.SQRT2_2,     cos: V.NEG_SQRT2_2, tan: V.NEG_ONE     },
    150: { sin: V.HALF,        cos: V.NEG_SQRT3_2, tan: V.NEG_SQRT3_3 },
    180: { sin: V.ZERO,        cos: V.NEG_ONE,     tan: V.ZERO        },
    210: { sin: V.NEG_HALF,    cos: V.NEG_SQRT3_2, tan: V.SQRT3_3     },
    225: { sin: V.NEG_SQRT2_2, cos: V.NEG_SQRT2_2, tan: V.ONE         },
    240: { sin: V.NEG_SQRT3_2, cos: V.NEG_HALF,    tan: V.SQRT3       },
    270: { sin: V.NEG_ONE,     cos: V.ZERO,        tan: V.UNDEF       },
    300: { sin: V.NEG_SQRT3_2, cos: V.HALF,        tan: V.NEG_SQRT3   },
    315: { sin: V.NEG_SQRT2_2, cos: V.SQRT2_2,     tan: V.NEG_ONE     },
    330: { sin: V.NEG_HALF,    cos: V.SQRT3_2,     tan: V.NEG_SQRT3_3 },
};

/* Pools d'angles progressius per dificultat */
const POOLS = {
    easy:   [0, 30, 45, 60, 90],
    medium: [0, 30, 45, 60, 90, 120, 135, 150, 180],
    full:   [0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330],
};

/* ================================================================
   ESTAT ESPECÍFIC D'AQUEST JOC
   ================================================================ */
let currentAngle = 0;
let currentFunc  = 'sin';
let correctValue = V.ZERO;
let isPenalizing = false;

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
    trigExpression:  document.getElementById('trig-expression'),
    resolutionPanel: document.getElementById('resolution-panel'),
    stepInstruction: document.getElementById('step-instruction'),
    stepValue:       document.getElementById('step-value'),
    valueButtons:    document.getElementById('value-buttons'),
    unitCircleSvg:   document.getElementById('unit-circle-svg'),
};

/* ================================================================
   GENERACIÓ DE PROBLEMES
   ================================================================ */
function getPoolForOp(opIdx) {
    const half = TOTAL_OPERATIONS / 2;
    if (opIdx < half) return { angles: POOLS.medium, funcs: ['sin', 'cos'] };
    return                   { angles: POOLS.full,   funcs: ['sin', 'cos', 'tan'] };
}

function pickProblem(opIdx) {
    const { angles, funcs } = getPoolForOp(opIdx);
    const half = TOTAL_OPERATIONS / 2;
    let angle, fn, val, tries = 0;
    do {
        angle = angles[Math.floor(Math.random() * angles.length)];
        fn    = funcs [Math.floor(Math.random() * funcs.length)];
        val   = TRIG[angle][fn];
        tries++;
    } while (tries < 60 && val === V.UNDEF && opIdx < half);
    return { angle, fn, val };
}

/* ================================================================
   CERCLE UNITAT SVG
   ================================================================ */
function drawCircle(angle) {
    const deg = ((angle % 360) + 360) % 360;
    const rad = deg * Math.PI / 180;
    const cx = 100, cy = 100, r = 72;

    const px = +(cx + r * Math.cos(rad)).toFixed(3);
    const py = +(cy - r * Math.sin(rad)).toFixed(3);

    const arcR  = 20;
    const arcX  = +(cx + arcR * Math.cos(rad)).toFixed(3);
    const arcY  = +(cy - arcR * Math.sin(rad)).toFixed(3);
    const bigArc = deg > 180 ? 1 : 0;

    const midRad = rad / 2;
    const lblDist = arcR + 16;
    const lblX    = +(cx + lblDist * Math.cos(midRad)).toFixed(1);
    const lblY    = +(cy - lblDist * Math.sin(midRad) + 4).toFixed(1);

    const PC = '#7c3aed';
    const AC = '#d97706';

    els.unitCircleSvg.innerHTML = `
        <circle cx="${cx}" cy="${cy}" r="${r}"
                fill="none" stroke="#ddd6fe" stroke-width="1.8"/>
        <line x1="${cx-r-14}" y1="${cy}" x2="${cx+r+14}" y2="${cy}"
              stroke="#cbd5e1" stroke-width="1"/>
        <line x1="${cx}" y1="${cy-r-14}" x2="${cx}" y2="${cy+r+14}"
              stroke="#cbd5e1" stroke-width="1"/>
        <text x="${cx+r+6}"   y="${cy+4}"    font-size="9.5" fill="#94a3b8" font-family="monospace">1</text>
        <text x="${cx-r-18}"  y="${cy+4}"    font-size="9.5" fill="#94a3b8" font-family="monospace">−1</text>
        <text x="${cx+3}"     y="${cy-r-6}"  font-size="9.5" fill="#94a3b8" font-family="monospace">1</text>
        <text x="${cx+3}"     y="${cy+r+13}" font-size="9.5" fill="#94a3b8" font-family="monospace">−1</text>
        <path d="M ${cx+arcR} ${cy} A ${arcR} ${arcR} 0 ${bigArc} 0 ${arcX} ${arcY}"
              fill="none" stroke="${AC}" stroke-width="2.2" opacity="0.85"/>
        <line x1="${px}" y1="${py}" x2="${px}" y2="${cy}"
              stroke="${PC}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.45"/>
        <line x1="${px}" y1="${py}" x2="${cx}" y2="${py}"
              stroke="${PC}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.45"/>
        <line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}"
              stroke="${PC}" stroke-width="2.5"/>
        <circle cx="${px}" cy="${py}" r="5.5"
                fill="${PC}" stroke="white" stroke-width="2.2"/>
        <text x="${lblX}" y="${lblY}" font-size="11" fill="${AC}"
              font-family="monospace" font-weight="bold"
              text-anchor="middle">${angle}°</text>
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

    const problem = pickProblem(currentOperation);
    currentAngle = problem.angle;
    currentFunc  = problem.fn;
    correctValue = problem.val;

    drawCircle(currentAngle);

    const fnLabel = { sin:'sin', cos:'cos', tan:'tan' };
    els.trigExpression.innerHTML =
        `<span class="trig-fn">${fnLabel[currentFunc]}</span>` +
        `(<span class="trig-angle">${currentAngle}°</span>)`;

    els.sessionDisplay.innerText  = `Sessió ${currentSession+1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText      = `Pregunta ${currentOperation+1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText    = `Punts: ${sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';

    hideMiniOverlay();
    els.problemBox.style.display      = 'flex';
    els.resolutionPanel.style.display = 'flex';
    els.stepValue.classList.add('active');

    buildValueButtons();

    els.stepInstruction.innerHTML =
        `Quant val ` +
        `<span style="font-family:monospace;color:var(--primary)">${fnLabel[currentFunc]}(${currentAngle}°)</span>?`;
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
    sessionScore += points;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;

    const fnLabel = { sin:'sin', cos:'cos', tan:'tan' };
    const question = `${fnLabel[currentFunc]}(${currentAngle}°)`;
    const answer   = VAL_TEXT[correctValue];
    recordAnswerToHistory(question, answer, points > 0);
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
   BOTONS DE VALOR (4 opcions múltiples)
   ================================================================ */
function oppositeVal(valId) {
    if (valId === 'zero' || valId === 'undef') return null;
    return valId.startsWith('neg_') ? valId.slice(4) : 'neg_' + valId;
}

function buildValueButtons() {
    const opposite  = oppositeVal(correctValue);
    const companion = currentFunc === 'sin' ? TRIG[currentAngle]['cos']
                    : currentFunc === 'cos' ? TRIG[currentAngle]['sin']
                    : null;

    const mustHaveUniq = [...new Set(
        [opposite, companion].filter(v => v !== null && v !== correctValue)
    )];

    const pool = ALL_VALS.filter(v => v !== correctValue && !mustHaveUniq.includes(v));
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const options = [correctValue, ...mustHaveUniq, ...pool].slice(0, 4);
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    els.valueButtons.innerHTML = '';
    options.forEach(valId => {
        const btn = document.createElement('button');
        btn.className = 'btn-value';
        btn.innerHTML = VAL_HTML[valId];
        btn.setAttribute('aria-label', VAL_TEXT[valId]);
        btn.onclick = () => checkValue(valId, btn);
        els.valueButtons.appendChild(btn);
    });
}

function checkValue(valId, btn) {
    if (isTransitioning || isPenalizing || attemptsLeft <= 0) return;
    if (valId !== correctValue) {
        penalize(btn);
        return;
    }
    els.stepValue.classList.remove('active');
    isTransitioning = true;
    _finishOp(1);
}
