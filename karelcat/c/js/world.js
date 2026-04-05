// ════════════════════════════════════════════════════════
// world.js — Gestió del món: CSV, helpers, condicions
// ════════════════════════════════════════════════════════

// ── CSV → estructura del món ──

function parseCSV(csv) {
  const lines = csv.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  const grid = [];
  let kStart = { x: 0, y: 0, dir: 0 };
  let foundK = false;

  for (let row = 0; row < lines.length; row++) {
    const cells = lines[row].split(',').map(c => c.trim());
    grid.push([]);
    for (let col = 0; col < cells.length; col++) {
      const c = cells[col].toUpperCase();
      if (c.startsWith('K')) {
        grid[row].push('.');
        if (!foundK) {
          foundK = true;
          const s = c.slice(1);
          const DIR_MAP = { '>': 0, 'V': 1, '<': 2, '^': 3 };
          if (s && !(s in DIR_MAP)) {
            console.warn(`⚠ Mapa corrupte: orientació '${s}' a (${col},${row}). S'assumeix →.`);
          }
          kStart = { x: col, y: row, dir: DIR_MAP[s] ?? 0 };
        }
      } else {
        grid[row].push(c === 'P' ? 'P' : c === 'A' ? 'A' : '.');
      }
    }
  }
  const maxCols = Math.max(...grid.map(r => r.length), 1);
  for (const r of grid) while (r.length < maxCols) r.push('.');
  return { grid, rows: grid.length, cols: maxCols, kStart };
}

// ── Carrega un mapa CSV a l'estat ──

function loadMapFromCSV(csv) {
  const S = K.state;
  const { grid, rows, cols, kStart } = parseCSV(csv);
  S.world     = { grid, rows, cols };
  S.worldInit = grid.map(r => [...r]);
  S.karel     = { ...kStart, motxilla: 0 };
  S.karelInit = { ...kStart, motxilla: 0 };
  K.stopProgram();
  K.renderWorldFull();
  K.updateStatus();
  K.log(K.t('log.map_loaded'), 'ok');
}

// ── Món → CSV ──

function worldToCSV() {
  const S  = K.state;
  const AR = ['>', 'v', '<', '^'];
  return S.world.grid.map((row, r) =>
    row.map((c, col) =>
      (S.karelInit.x === col && S.karelInit.y === r) ? 'K' + AR[S.karelInit.dir] : c
    ).join(',')
  ).join('\n');
}


// ── Helpers del món ──

function isRock(x, y) {
  const w = K.state.world;
  if (x < 0 || y < 0 || x >= w.cols || y >= w.rows) return true;
  return w.grid[y][x] === 'P';
}

function getCell(x, y) {
  const w = K.state.world;
  if (x < 0 || y < 0 || x >= w.cols || y >= w.rows) return null;
  return w.grid[y][x];
}

function setCell(x, y, v) {
  const w = K.state.world;
  if (y >= 0 && y < w.rows && x >= 0 && x < w.cols) w.grid[y][x] = v;
}

function front() {
  const k = K.state.karel;
  const d = K.DIRS[k.dir];
  return { x: k.x + d.dx, y: k.y + d.dy };
}


// ── Avaluació de condicions ──

function evalCond(cond) {
  const L = K.lang;
  switch (cond.type) {
    case 'not': return !evalCond(cond.inner);
    case 'and': return evalCond(cond.left) && evalCond(cond.right);
    case 'or':  return evalCond(cond.left) || evalCond(cond.right);
    case 'condition': {
      const action = L.COND_TO_ACTION[cond.name] ?? cond.name;
      const { x: fx, y: fy } = front();
      const k = K.state.karel;
      switch (action) {
        case 'rock-ahead': return isRock(fx, fy);
        case 'path-clear': return !isRock(fx, fy);
        case 'pearl-here': return getCell(k.x, k.y) === 'A';
        case 'bag-empty':  return k.motxilla === 0;
        case 'bag-full':   return k.motxilla > 0;
      }
    }
  }
  return false;
}


// ── Exporta ──

K.parseCSV       = parseCSV;
K.loadMapFromCSV = loadMapFromCSV;
K.worldToCSV     = worldToCSV;
K.isRock         = isRock;
K.getCell        = getCell;
K.setCell        = setCell;
K.front          = front;
K.evalCond       = evalCond;
