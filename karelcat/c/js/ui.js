// ════════════════════════════════════════════════════════
// ui.js — Peces mínimes d'interfície: log, badge, slider
// ════════════════════════════════════════════════════════


// ── Log de missatges ──

function log(msg, type) {
  const el = document.getElementById('log');
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'log-line ' + (type || '');
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function logError(msg, code, line) {
  log(msg, 'err');
  if (line) K.markErrorLine(line);
}


// ── Badge d'estat + mutació del botó Executa↔Atura ──

function setStateUI(state) {
  K.state.currentState = state;
  const dot = document.getElementById('state-dot');
  const lbl = document.getElementById('state-lbl');
  if (dot) dot.className = 'state-' + state;
  if (lbl) lbl.textContent = K.t('state.' + state);

  // Mutació del botó principal: "Executa" quan res no corre, "Atura" mentre corre
  const btn = document.getElementById('btn-run');
  if (btn) {
    const running = (state === 'running' || state === 'step');
    btn.textContent = K.t(running ? 'ui.stop' : 'ui.run');
    btn.classList.toggle('p', !running);  // verd/primari quan no corre
    btn.classList.toggle('r', running);   // vermell quan corre
  }
}

// Un sol handler per al botó: segons estat, arrenca o atura
function handleRunClick() {
  const s = K.state.currentState;
  if (s === 'running' || s === 'step') {
    K.stopProgram();
  } else {
    K.runProgram();
  }
}


// ── Etiquetes dels botons i labels ──

function updateUI() {
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = K.t(key);
  };
  setText('btn-reset', 'ui.reset');
  setText('lbl-speed', 'ui.speed');
  setText('lbl-bag',   'ui.bag');
  // btn-run el gestiona setStateUI (muta entre Executa/Atura).
  // state-lbl també el gestiona setStateUI.
  setStateUI(K.state.currentState || 'idle');
}


// ── Slider de velocitat ──

function initSpeedSlider() {
  const spd = document.getElementById('speed');
  const lbl = document.getElementById('speed-lbl');
  if (!spd) return;
  const apply = () => {
    const idx = parseInt(spd.value) - 1;
    K.state.stepDelay = K.SPEED_DELAYS[idx];
    if (lbl) lbl.textContent = K.UI_LANGS[K.state.uiLang].speed[idx] || spd.value;
  };
  spd.addEventListener('input', apply);
  apply();
}


// ── Exporta ──

K.log             = log;
K.logError        = logError;
K.setStateUI      = setStateUI;
K.updateUI        = updateUI;
K.initSpeedSlider = initSpeedSlider;
K.handleRunClick  = handleRunClick;

window.handleRunClick = handleRunClick;  // per a onclick="handleRunClick()" al HTML
