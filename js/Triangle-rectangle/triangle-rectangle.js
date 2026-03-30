/**
 * triangle-rectangle.js
 * Activitat "Resolució de triangles rectangles" per a Step Quiz.
 *
 * Estructura:
 *  1. Configuració (URL params)
 *  2. PRNG determinista (sessions fixes A/B/C)
 *  3. Generació de problemes
 *  4. Generació de passos (3 passos per problema)
 *  5. Renderització del triangle SVG
 *  6. Màquina d'estats del joc
 *  7. Handlers d'entrada
 *  8. Inicialització
 *
 * Integració amb game-core.js:
 *  Si game-core.js exposa window.GameCore, es delega la gestió
 *  de la capçalera i la pantalla final. Si no existeix, aquest
 *  fitxer és completament autònom.
 */

'use strict';

// ══════════════════════════════════════════════════════════
// 1. CONFIGURACIÓ
// ══════════════════════════════════════════════════════════

const P   = new URLSearchParams(location.search);
const CFG = {
  sessions  : clamp(parseInt(P.get('totalsessions'))   || 1, 1, 5),
  ops       : clamp(parseInt(P.get('totaloperations')) || 6, 1, 10),
  maxErrors : clamp(parseInt(P.get('maxintents'))      || 4, 1, 8),
  nivell    : clamp(parseInt(P.get('nivell'))          || 2, 1, 3),
  fixed     : P.get('fixed') || null,   // 'A' | 'B' | 'C' | null
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }


// ══════════════════════════════════════════════════════════
// 2. PRNG DETERMINISTA
// ══════════════════════════════════════════════════════════

const SESSION_SEEDS = { A: 0x1A2B3C, B: 0xDEAD42, C: 0x9F8E7D };

function makePRNG(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    s = s >>> 0;
    return s / 0x100000000;
  };
}

let rng = CFG.fixed
  ? makePRNG(SESSION_SEEDS[CFG.fixed] ?? 0x123456)
  : () => Math.random();

function pickRnd(arr) { return arr[Math.floor(rng() * arr.length)]; }


// ══════════════════════════════════════════════════════════
// 3. DADES D'ANGLES
// ══════════════════════════════════════════════════════════

/**
 * Cada entrada conté:
 *   alpha   → graus
 *   sin/cos/tan → valors arrodonits a 3 decimals
 *   sinFrac/cosFrac/tanFrac → representació textual (per als enunciats)
 */
const ANGLE_SETS = {
  1: [  // Fàcil: 30°, 45°, 60°
    { alpha:30, sin:0.500, cos:0.866, tan:0.577,
      sinFrac:'1/2', cosFrac:'√3/2', tanFrac:'1/√3' },
    { alpha:45, sin:0.707, cos:0.707, tan:1.000,
      sinFrac:'√2/2', cosFrac:'√2/2', tanFrac:'1' },
    { alpha:60, sin:0.866, cos:0.500, tan:1.732,
      sinFrac:'√3/2', cosFrac:'1/2', tanFrac:'√3' },
  ],
  2: [  // Normal: els anteriors + 37° i 53° (triangle 3-4-5)
    { alpha:30, sin:0.500, cos:0.866, tan:0.577,
      sinFrac:'1/2', cosFrac:'√3/2', tanFrac:'1/√3' },
    { alpha:37, sin:0.600, cos:0.800, tan:0.750,
      sinFrac:'3/5', cosFrac:'4/5', tanFrac:'3/4' },
    { alpha:45, sin:0.707, cos:0.707, tan:1.000,
      sinFrac:'√2/2', cosFrac:'√2/2', tanFrac:'1' },
    { alpha:53, sin:0.800, cos:0.600, tan:1.333,
      sinFrac:'4/5', cosFrac:'3/5', tanFrac:'4/3' },
    { alpha:60, sin:0.866, cos:0.500, tan:1.732,
      sinFrac:'√3/2', cosFrac:'1/2', tanFrac:'√3' },
  ],
  3: [  // Difícil: angles arbitraris (cal calculadora)
    { alpha:25, sin:0.423, cos:0.906, tan:0.466, sinFrac:null, cosFrac:null, tanFrac:null },
    { alpha:35, sin:0.574, cos:0.819, tan:0.700, sinFrac:null, cosFrac:null, tanFrac:null },
    { alpha:40, sin:0.643, cos:0.766, tan:0.839, sinFrac:null, cosFrac:null, tanFrac:null },
    { alpha:50, sin:0.766, cos:0.643, tan:1.192, sinFrac:null, cosFrac:null, tanFrac:null },
    { alpha:55, sin:0.819, cos:0.574, tan:1.428, sinFrac:null, cosFrac:null, tanFrac:null },
    { alpha:65, sin:0.906, cos:0.423, tan:2.145, sinFrac:null, cosFrac:null, tanFrac:null },
  ],
};

// ══════════════════════════════════════════════════════════
// 4. GENERACIÓ DE PROBLEMES
// ══════════════════════════════════════════════════════════

/**
 * Notació del triangle:
 *   - Angle recte a C (baix-esquerra del SVG)
 *   - α a A (baix-dreta)
 *   - B al vèrtex superior
 *   - a = BC = costat oposat a α (vertical)
 *   - b = CA = costat adjacent a α (horitzontal)
 *   - c = AB = hipotenusa
 */

const HYPS = [5, 8, 10, 12, 15, 20];  // hipotenuses habituals

function generateProblem() {
  const angles = ANGLE_SETS[CFG.nivell] ?? ANGLE_SETS[2];
  const ad     = pickRnd(angles);

  // Calculem els 3 costats a partir de la hipotenusa
  const c = pickRnd(HYPS);
  const a = fmt(c * ad.sin);
  const b = fmt(c * ad.cos);

  // Escenaris possibles:
  //  Tipus B (trobar costat): 4 escenaris
  //  Tipus A (trobar angle): 3 escenaris — únicament en nivell ≥ 2
  const scenarios = buildScenarios(ad, a, b, c);
  const prob = pickRnd(scenarios);

  return { ...prob, a, b, c, alpha: ad.alpha, ad };
}

function buildScenarios(ad, a, b, c) {
  const { alpha, sin:sv, cos:cv, tan:tv } = ad;
  const list = [
    // ──── Trobar costat oposat (a) ────────────────────────
    {
      find: 'a',
      givenAlpha: true, givenA: false, givenB: false, givenC: true,
      ratio: 'sin', ratioVal: sv,
      step2q : `Quin és el valor de sin(${alpha}°)?`,
      step3q : `Doncs, <b>a = c · sin(${alpha}°) = ${c} · sin(${alpha}°)</b> = ?`,
      step3formula: c + ' × ' + sv,
      answer: a,
      answerType: 'side',
    },
    // ──── Trobar costat adjacent (b) ──────────────────────
    {
      find: 'b',
      givenAlpha: true, givenA: false, givenB: false, givenC: true,
      ratio: 'cos', ratioVal: cv,
      step2q : `Quin és el valor de cos(${alpha}°)?`,
      step3q : `Doncs, <b>b = c · cos(${alpha}°) = ${c} · cos(${alpha}°)</b> = ?`,
      step3formula: c + ' × ' + cv,
      answer: b,
      answerType: 'side',
    },
    // ──── Trobar hipotenusa (c) a partir d'oposat ─────────
    {
      find: 'c',
      givenAlpha: true, givenA: true, givenB: false, givenC: false,
      ratio: 'sin', ratioVal: sv,
      step2q : `Quin és el valor de sin(${alpha}°)?`,
      step3q : `Doncs, <b>c = a / sin(${alpha}°) = ${a} / sin(${alpha}°)</b> = ?`,
      step3formula: a + ' ÷ ' + sv,
      answer: c,
      answerType: 'side',
    },
    // ──── Trobar hipotenusa (c) a partir d'adjacent ───────
    {
      find: 'c',
      givenAlpha: true, givenA: false, givenB: true, givenC: false,
      ratio: 'cos', ratioVal: cv,
      step2q : `Quin és el valor de cos(${alpha}°)?`,
      step3q : `Doncs, <b>c = b / cos(${alpha}°) = ${b} / cos(${alpha}°)</b> = ?`,
      step3formula: b + ' ÷ ' + cv,
      answer: c,
      answerType: 'side',
    },
  ];

  // Nivell ≥ 2: afegim escenaris de trobar angle
  if (CFG.nivell >= 2) {
    list.push(
      // ──── Trobar α a partir d'oposat i hipotenusa ───────
      {
        find: 'alpha',
        givenAlpha: false, givenA: true, givenB: false, givenC: true,
        ratio: 'sin', ratioVal: sv,
        step2q : `sin(α) = a/c = ${a}/${c}. Calcula aquest quocient.`,
        step3q : `Aleshores <b>α = arcsin(${sv})</b> = ? (en graus)`,
        step3formula: `arcsin(${sv})`,
        answer: ad.alpha,
        answerType: 'angle',
      },
      // ──── Trobar α a partir d'adjacent i hipotenusa ─────
      {
        find: 'alpha',
        givenAlpha: false, givenA: false, givenB: true, givenC: true,
        ratio: 'cos', ratioVal: cv,
        step2q : `cos(α) = b/c = ${b}/${c}. Calcula aquest quocient.`,
        step3q : `Aleshores <b>α = arccos(${cv})</b> = ? (en graus)`,
        step3formula: `arccos(${cv})`,
        answer: ad.alpha,
        answerType: 'angle',
      },
      // ──── Trobar α a partir d'oposat i adjacent ─────────
      {
        find: 'alpha',
        givenAlpha: false, givenA: true, givenB: true, givenC: false,
        ratio: 'tan', ratioVal: tv,
        step2q : `tan(α) = a/b = ${a}/${b}. Calcula aquest quocient.`,
        step3q : `Aleshores <b>α = arctan(${tv})</b> = ? (en graus)`,
        step3formula: `arctan(${tv})`,
        answer: ad.alpha,
        answerType: 'angle',
      }
    );
  }

  return list;
}

/**
 * Construeix els 3 passos del problema.
 * Cada pas: { question, inputType:'ratio'|'number', answer, tolerance }
 */
function buildSteps(prob) {
  const { find, ratio, ratioVal, step2q, step3q, answer, answerType, a, b, c, alpha } = prob;

  // ── Pas 1: triar raó ──
  const step1q = buildStep1Question(find, ratio, a, b, c, alpha);

  return [
    {
      question    : step1q,
      inputType   : 'ratio',
      answer      : ratio,
      tolerance   : 0,
    },
    {
      question    : step2q,
      inputType   : 'number',
      answer      : parseFloat(ratioVal),
      tolerance   : 0.015,   // 3 decimals és suficient
    },
    {
      question    : step3q,
      inputType   : 'number',
      answer      : parseFloat(answer),
      tolerance   : answerType === 'angle' ? 0.6 : 0.05,
      unit        : answerType === 'angle' ? '°' : '',
    },
  ];
}

function buildStep1Question(find, ratio, a, b, c, alpha) {
  const sideNames = {
    a: 'el costat oposat',
    b: 'el costat adjacent',
    c: 'la hipotenusa',
    alpha: 'l\'angle α',
  };
  const ratioDescriptions = {
    sin: 'relaciona l\'<b>oposat</b> i la <b>hipotenusa</b>',
    cos: 'relaciona l\'<b>adjacent</b> i la <b>hipotenusa</b>',
    tan: 'relaciona l\'<b>oposat</b> i l\'<b>adjacent</b>',
  };

  if (find === 'alpha') {
    // "Quina raó trigonomètrica et permet relacionar a i c per trobar α?"
    const s1 = find === 'alpha' && ratio === 'sin' ? `a (=${a}) i c (=${c})` :
               find === 'alpha' && ratio === 'cos' ? `b (=${b}) i c (=${c})` :
               `a (=${a}) i b (=${b})`;
    return `Quina raó trigonomètrica ${ratioDescriptions[ratio]}?`;
  }

  return `Vols trobar <b>${sideNames[find]}</b>. Quina raó trigonomètrica ${ratioDescriptions[ratio]}?`;
}


// ══════════════════════════════════════════════════════════
// 5. RENDERITZACIÓ SVG
// ══════════════════════════════════════════════════════════

/*
 * Coordenades fixes del triangle (proporcions 3:4:5 aproximades):
 *   C (angle recte) = (45, 165)
 *   A (angle α)     = (225, 165)
 *   B (vèrtex)      = (45, 35)
 */
const SVG_C = { x: 45,  y: 165 };
const SVG_A = { x: 225, y: 165 };
const SVG_B = { x: 45,  y: 35  };

function renderSVG(prob) {
  const svg = document.getElementById('tri-svg');
  svg.innerHTML = '';   // neteja

  const { find, a, b, c, alpha,
          givenA, givenB, givenC, givenAlpha } = prob;

  // ── Angle recte a C ──────────────────────────────────
  const SQ = 14;
  appendSVG(svg, 'path', {
    class: 'tri-angle-sq',
    d: `M ${SVG_C.x},${SVG_C.y - SQ} L ${SVG_C.x + SQ},${SVG_C.y - SQ} L ${SVG_C.x + SQ},${SVG_C.y}`,
  });

  // ── Arc de l'angle α a A ─────────────────────────────
  // Arc petit de 28px de radi
  const R = 28;
  const αRad = Math.atan2(SVG_B.y - SVG_A.y, SVG_B.x - SVG_A.x);
  const startX = SVG_A.x + R * Math.cos(αRad);
  const startY = SVG_A.y + R * Math.sin(αRad);
  const endX   = SVG_A.x - R;   // cap a C (180°)
  const endY   = SVG_A.y;
  appendSVG(svg, 'path', {
    class: 'tri-arc',
    d: `M ${startX.toFixed(1)},${startY.toFixed(1)} A ${R},${R} 0 0,0 ${endX},${endY}`,
  });

  // ── Els 3 costats ────────────────────────────────────
  drawSide(svg, SVG_B, SVG_C, find === 'a');   // costat a (vertical)
  drawSide(svg, SVG_C, SVG_A, find === 'b');   // costat b (horitzontal)
  drawSide(svg, SVG_A, SVG_B, find === 'c');   // costat c (hipotenusa)

  // ── Etiquetes dels costats ───────────────────────────
  // a: esquerra de la vertical, centrat
  drawSideLabel(svg, 24, 102,  'a', a, find === 'a');
  // b: sota de l'horitzontal, centrat
  drawSideLabel(svg, 136, 186, 'b', b, find === 'b');
  // c: dreta de la hipotenusa
  drawSideLabel(svg, 152, 88,  'c', c, find === 'c');

  // ── Etiqueta α ───────────────────────────────────────
  const alphaText = find === 'alpha' ? 'α = ?' : `α = ${alpha}°`;
  const aEl = appendSVG(svg, 'text', {
    class: 'tri-alpha' + (find === 'alpha' ? ' unknown' : ''),
    x: 188, y: 155,
    'text-anchor': 'middle',
  });
  aEl.innerHTML = alphaText;

  // ── Vèrtexs (lleugeres) ──────────────────────────────
  [['C', SVG_C.x - 14, SVG_C.y + 14],
   ['A', SVG_A.x + 10, SVG_A.y + 14],
   ['B', SVG_B.x - 12, SVG_B.y - 4]].forEach(([lbl, x, y]) => {
    const el = appendSVG(svg, 'text', {
      class: 'tri-val var-lbl',
      x, y,
      'text-anchor': 'middle',
    });
    el.textContent = lbl;
  });
}

function drawSide(svg, p1, p2, isUnknown) {
  const el = appendSVG(svg, 'line', {
    class: 'tri-side' + (isUnknown ? ' unknown' : ''),
    x1: p1.x, y1: p1.y,
    x2: p2.x, y2: p2.y,
  });
}

function drawSideLabel(svg, x, y, varName, value, isUnknown) {
  const el = appendSVG(svg, 'text', {
    class: 'tri-val' + (isUnknown ? ' unknown' : ''),
    x, y,
    'text-anchor': 'middle',
  });
  el.textContent = isUnknown ? `${varName} = ?` : `${varName} = ${value}`;
}

function appendSVG(parent, tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent.appendChild(el);
  return el;
}


// ══════════════════════════════════════════════════════════
// 6. MÀQUINA D'ESTATS
// ══════════════════════════════════════════════════════════

const STATE = {
  session    : 1,
  opNum      : 0,        // 0-indexed dins la sessió
  totalErrors: 0,
  stepErrors : 0,        // errors al pas actual
  problem    : null,
  steps      : null,
  stepIdx    : 0,        // 0, 1, 2
  solved     : 0,        // problemes resolts correctament
};

function startSession() {
  STATE.opNum       = 0;
  STATE.totalErrors = 0;
  updateHeader();
  nextProblem();
}

function nextProblem() {
  STATE.opNum++;
  STATE.stepIdx    = 0;
  STATE.stepErrors = 0;
  STATE.problem    = generateProblem();
  STATE.steps      = buildSteps(STATE.problem);

  renderSVG(STATE.problem);
  updateHeader();
  renderStep();
}

function renderStep() {
  const step = STATE.steps[STATE.stepIdx];

  // badge "Pas N/3"
  document.getElementById('step-num').textContent   = STATE.stepIdx + 1;
  document.getElementById('step-total').textContent = STATE.steps.length;

  // pregunta (pot tenir HTML)
  document.getElementById('step-question').innerHTML = step.question;

  // amaga tot
  hideAll();

  if (step.inputType === 'ratio') {
    document.getElementById('input-ratio').classList.remove('hidden');
    // reset botons
    document.querySelectorAll('.ratio-btn').forEach(b => {
      b.classList.remove('selected', 'wrong');
    });
  } else {
    document.getElementById('input-number').classList.remove('hidden');
    const f = document.getElementById('num-field');
    f.value = '';
    f.classList.remove('wrong');
    f.focus();
  }
}

function hideAll() {
  document.getElementById('input-ratio').classList.add('hidden');
  document.getElementById('input-number').classList.add('hidden');
  document.getElementById('step-feedback').classList.add('hidden');
  document.getElementById('next-step-btn').classList.add('hidden');
  document.getElementById('next-problem-btn').classList.add('hidden');
  document.getElementById('step-feedback').className = 'feedback hidden';
}

// ── Validació d'una resposta ──
function checkAnswer(value) {
  const step    = STATE.steps[STATE.stepIdx];
  const correct = isCorrect(value, step);

  if (correct) {
    onStepCorrect(step);
  } else {
    onStepWrong(step, value);
  }
}

function isCorrect(value, step) {
  if (step.inputType === 'ratio') {
    return String(value).toLowerCase() === step.answer;
  }
  const num = parseFloat(value);
  return !isNaN(num) && Math.abs(num - step.answer) <= step.tolerance;
}

function onStepCorrect(step) {
  STATE.stepErrors = 0;

  showFeedback('ok',
    STATE.stepIdx === 2
      ? `✓ Correcte! Resposta: <b>${step.answer}${step.unit || ''}</b>`
      : `✓ Molt bé! Continuem.`
  );

  const isLastStep = STATE.stepIdx === STATE.steps.length - 1;

  if (isLastStep) {
    STATE.solved++;
    // Revela la incògnita al SVG
    revealAnswer();

    const isLastProblem = STATE.opNum >= CFG.ops;
    if (isLastProblem) {
      // Mostra el botó de fi de sessió (amb delay per llegir el feedback)
      setTimeout(() => showEndScreen(), 1200);
    } else {
      document.getElementById('next-problem-btn').classList.remove('hidden');
    }
  } else {
    document.getElementById('next-step-btn').classList.remove('hidden');
  }
}

function onStepWrong(step, value) {
  STATE.stepErrors++;
  STATE.totalErrors++;
  updateHeader();

  const hint = buildHint(step, STATE.stepErrors);
  showFeedback('wrong', hint);

  // Animació visual a l'input
  if (step.inputType === 'ratio') {
    const btn = document.querySelector(`.ratio-btn[data-ratio="${value}"]`);
    if (btn) { btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 400); }
  } else {
    const f = document.getElementById('num-field');
    f.classList.add('wrong');
    setTimeout(() => f.classList.remove('wrong'), 600);
  }

  // Desbloqueig: si ha fallat moltes vegades, mostra la resposta i avança
  if (STATE.stepErrors >= 3) {
    setTimeout(() => {
      showFeedback('wrong', `La resposta era: <b>${step.answer}${step.unit || ''}</b>. Continua!`);
      STATE.stepErrors = 0;
      const isLastStep = STATE.stepIdx === STATE.steps.length - 1;
      if (isLastStep) {
        revealAnswer();
        const isLastProblem = STATE.opNum >= CFG.ops;
        if (isLastProblem) setTimeout(() => showEndScreen(), 1200);
        else document.getElementById('next-problem-btn').classList.remove('hidden');
      } else {
        document.getElementById('next-step-btn').classList.remove('hidden');
      }
    }, 800);
  }
}

function buildHint(step, attempt) {
  if (step.inputType === 'ratio') {
    if (attempt === 1) return '✗ No és correcta. Recorda: sin = oposat/hipotenusa · cos = adjacent/hipotenusa · tan = oposat/adjacent';
    return '✗ Torna-ho a provar.';
  }
  // Hint numèric
  if (attempt === 1) return '✗ No és correcta. Revisa el càlcul.';
  if (attempt === 2) {
    if (step.answer !== undefined) {
      const hint = step.answer > 1 ? 'El resultat és > 1.' : 'El resultat és entre 0 i 1.';
      return `✗ ${hint} Torna-ho a provar.`;
    }
  }
  return `✗ Pista: la resposta correcta és propera a <b>${step.answer}</b>.`;
}

// ── Revelar resposta al SVG ──
function revealAnswer() {
  const prob = STATE.problem;
  // Actualitza el label de la incògnita al SVG
  const labelMap = { a: 24, b: 136, c: 152 };  // posicions x aproximades
  const svg = document.getElementById('tri-svg');

  svg.querySelectorAll('.tri-val.unknown').forEach(el => {
    const old = el.textContent;
    const varName = old.split(' ')[0];  // 'a', 'b', 'c'
    const value = prob[varName];
    el.textContent = `${varName} = ${value}`;
    el.classList.remove('unknown');
    el.classList.add('answer-revealed');
  });
  svg.querySelectorAll('.tri-alpha.unknown').forEach(el => {
    el.innerHTML = `α = ${prob.alpha}°`;
    el.classList.remove('unknown');
    el.classList.add('answer-revealed');
  });
  svg.querySelectorAll('.tri-side.unknown').forEach(el => {
    el.classList.remove('unknown');
  });
}

// ── Capçalera ──
function updateHeader() {
  document.getElementById('sq-cur-session').textContent   = STATE.session;
  document.getElementById('sq-total-sessions').textContent = CFG.sessions;
  document.getElementById('sq-cur-op').textContent        = STATE.opNum;
  document.getElementById('sq-total-ops').textContent     = CFG.ops;
  document.getElementById('sq-cur-errors').textContent    = STATE.totalErrors;
  document.getElementById('sq-max-errors').textContent    = CFG.maxErrors;

  const pct = Math.round((Math.max(0, STATE.opNum - 1) / CFG.ops) * 100);
  const fill = document.getElementById('sq-progress-fill');
  if (fill) fill.style.width = pct + '%';
}

// ── Pantalla final ──
function showEndScreen() {
  const pct    = Math.round((STATE.solved / CFG.ops) * 100);
  const icon   = pct >= 80 ? '🏆' : pct >= 50 ? '🎯' : '📚';
  const title  = pct >= 80 ? 'Excel·lent!' : pct >= 50 ? 'Ben fet!' : 'Continua practicant';
  const scoreT = `Has resolt ${STATE.solved} de ${CFG.ops} problemes (${pct}%) amb ${STATE.totalErrors} error${STATE.totalErrors !== 1 ? 's' : ''}.`;

  document.getElementById('end-icon').textContent   = icon;
  document.getElementById('end-title').textContent  = title;
  document.getElementById('end-score').textContent  = scoreT;
  document.getElementById('end-screen').classList.remove('hidden');

  // Si game-core.js exposa finishSession, deleguem
  if (window.GameCore && typeof window.GameCore.finishSession === 'function') {
    window.GameCore.finishSession({ solved: STATE.solved, errors: STATE.totalErrors });
  }
}

// ── Feedback visual ──
function showFeedback(type, html) {
  const el = document.getElementById('step-feedback');
  el.className = `feedback ${type}`;
  el.innerHTML = html;
}


// ══════════════════════════════════════════════════════════
// 7. HANDLERS
// ══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // Botons de raó (sin / cos / tan)
  document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = STATE.steps[STATE.stepIdx];
      if (step.inputType !== 'ratio') return;
      checkAnswer(btn.dataset.ratio);
    });
  });

  // Botó "Comprova" (input numèric)
  document.getElementById('check-btn').addEventListener('click', submitNumber);

  // Enter en el camp numèric
  document.getElementById('num-field').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitNumber();
  });

  // Botó "Pas següent"
  document.getElementById('next-step-btn').addEventListener('click', () => {
    STATE.stepIdx++;
    renderStep();
  });

  // Botó "Problema següent"
  document.getElementById('next-problem-btn').addEventListener('click', () => {
    nextProblem();
  });

  // Botó pantalla final
  document.getElementById('end-btn').addEventListener('click', () => {
    location.href = 'index.html';
  });

  // Inicia
  startSession();
});

function submitNumber() {
  const val = document.getElementById('num-field').value.trim();
  if (val === '') return;
  checkAnswer(val);
}


// ══════════════════════════════════════════════════════════
// 8. UTILITATS
// ══════════════════════════════════════════════════════════

/** Arrodoneix a 3 decimals i elimina zeros finals */
function fmt(n) {
  const r = Math.round(n * 1000) / 1000;
  // Elimina decimals innecessaris però manté fins a 3
  return parseFloat(r.toFixed(3)).toString();
}
