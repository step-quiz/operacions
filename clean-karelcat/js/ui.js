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
  if (dot) dot.className = state;  // '', 'running', 'step', 'error' (el CSS ja sap aquests noms)
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


// ── Toggle fosc/clar ──

const ICON_SUN  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const ICON_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

function updateThemeBtn() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  const isLight = document.body.classList.contains('light');
  btn.innerHTML = isLight ? ICON_MOON : ICON_SUN;
  btn.title     = isLight ? 'Mode fosc' : 'Mode clar';
  btn.setAttribute('aria-label', btn.title);
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem(K.LS_KEY_THEME, isLight ? 'light' : 'dark');
  updateThemeBtn();
}

function initTheme() {
  if (localStorage.getItem(K.LS_KEY_THEME) === 'light') {
    document.body.classList.add('light');
  }
  updateThemeBtn();
}


// ── Exporta ──

K.log             = log;
K.logError        = logError;
K.setStateUI      = setStateUI;
K.updateUI        = updateUI;
K.initSpeedSlider = initSpeedSlider;
K.handleRunClick  = handleRunClick;

window.handleRunClick = handleRunClick;  // per a onclick="handleRunClick()" al HTML

K.updateThemeBtn = updateThemeBtn;
K.toggleTheme    = toggleTheme;
K.initTheme      = initTheme;

window.toggleTheme = toggleTheme;        // per a onclick="toggleTheme()" al HTML
