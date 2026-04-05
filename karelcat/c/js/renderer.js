// ════════════════════════════════════════════════════════
// renderer.js — Renderitzat diferencial + auto-escala
// ════════════════════════════════════════════════════════

let _renderedSnapshot = null;
let _lastCellSize     = 0;

function calcCellSize() {
  const area = document.getElementById('world-area');
  if (!area) return 36;
  const S = K.state;
  const pad = 52, statusH = 40;
  const byW = Math.floor((area.clientWidth  - pad - (S.world.cols + 1) * 2) / S.world.cols);
  const byH = Math.floor((area.clientHeight - pad - statusH - (S.world.rows + 1) * 2) / S.world.rows);
  return Math.max(18, Math.min(56, byW, byH));
}

function _cellKey(col, row) {
  const S = K.state;
  if (S.karel.x === col && S.karel.y === row) return 'K' + S.karel.dir;
  return S.world.grid[row][col];
}

function _applyCellContent(div, col, row, fs) {
  const S = K.state;
  div.className = 'cell';
  div.style.fontSize = fs;
  if (S.karel.x === col && S.karel.y === row) {
    div.classList.add('c-k');
    div.innerHTML = K.KAREL_ASSETS.MEDUSA;
    const svg = div.querySelector('.karel-entity');
    if (svg) svg.setAttribute('data-dir', K.DIRS[S.karel.dir].dataDir);
  } else {
    const c = S.world.grid[row][col];
    if      (c === 'P') { div.classList.add('c-p'); div.innerHTML = K.KAREL_ASSETS.ROCK; }
    else if (c === 'A') { div.classList.add('c-a'); div.innerHTML = K.KAREL_ASSETS.PEARL; }
    else                { div.classList.add('c-e'); div.innerHTML = ''; }
  }
}

function renderWorld() {
  const S    = K.state;
  const size = calcCellSize();
  const fs   = Math.round(size * 0.52) + 'px';
  document.documentElement.style.setProperty('--cell-size', size + 'px');
  const g = document.getElementById('world-grid');
  if (!g) return;
  g.style.gridTemplateColumns = `repeat(${S.world.cols}, ${size}px)`;

  const needsFullRebuild = !_renderedSnapshot
    || _renderedSnapshot.rows !== S.world.rows
    || _renderedSnapshot.cols !== S.world.cols;

  if (needsFullRebuild) {
    g.innerHTML = '';
    for (let row = 0; row < S.world.rows; row++) {
      for (let col = 0; col < S.world.cols; col++) {
        const div = document.createElement('div');
        div.dataset.col = col;
        div.dataset.row = row;
        _applyCellContent(div, col, row, fs);
        g.appendChild(div);
      }
    }
  } else {
    const children = g.children;
    for (let row = 0; row < S.world.rows; row++) {
      for (let col = 0; col < S.world.cols; col++) {
        const newKey = _cellKey(col, row);
        const oldKey = _renderedSnapshot.keys[row * S.world.cols + col];
        if (newKey !== oldKey || size !== _lastCellSize) {
          const div = children[row * S.world.cols + col];
          if (div) _applyCellContent(div, col, row, fs);
        }
      }
    }
  }

  // Desa snapshot
  const keys = [];
  for (let row = 0; row < S.world.rows; row++) {
    for (let col = 0; col < S.world.cols; col++) {
      keys.push(_cellKey(col, row));
    }
  }
  _renderedSnapshot = { rows: S.world.rows, cols: S.world.cols, keys };
  _lastCellSize = size;
}

function renderWorldFull() {
  _renderedSnapshot = null;
  renderWorld();
}

function updateStatus() {
  const bagEl = document.getElementById('st-bag');
  if (bagEl) bagEl.textContent = K.state.karel.motxilla;
}


// ── Exporta ──

K.renderWorld      = renderWorld;
K.renderWorldFull  = renderWorldFull;
K.updateStatus     = updateStatus;
