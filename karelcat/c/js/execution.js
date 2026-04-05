// ════════════════════════════════════════════════════════
// execution.js — Control d'execució + execAction
// ════════════════════════════════════════════════════════

// ── Executa una acció individual ──

function execAction(step) {
  const S = K.state;

  // Error de l'intèrpret (bucle infinit, recursió, proc desconegut)
  if (step.type === 'error') {
    K.logError(`❌ ${step.msg}`, step.code, step.line);
    K.markErrorLine(step.line);
    K.setStateUI('error');
    stopProgram();
    return false;
  }

  const { cmd, line } = step;
  K.highlightLine(line);
  S.stepCount++;

  const action = K.lang.CMD_TO_ACTION[cmd] ?? cmd;
  const { x: fx, y: fy } = K.front();

  function errStop(msgKey) {
    K.logError(`❌ ${cmd} (${K.t('log.line')} ${line}): ${K.t('err.' + msgKey)}`, msgKey, line);
    K.markErrorLine(line);
    K.setStateUI('error');
    stopProgram();
    return false;
  }

  switch (action) {
    case 'move':
      if (K.isRock(fx, fy)) return errStop('rock');
      S.karel.x = fx; S.karel.y = fy;
      K.log(`${cmd} → (${S.karel.x}, ${S.karel.y})`, 'inf');
      break;
    case 'turn-right':
      S.karel.dir = (S.karel.dir + 1) % 4;
      K.log(`${cmd} → ${K.DIRS[S.karel.dir].arrow}`, 'cmd');
      break;
    case 'turn-left':
      S.karel.dir = (S.karel.dir + 3) % 4;
      K.log(`${cmd} → ${K.DIRS[S.karel.dir].arrow}`, 'cmd');
      break;
    case 'turn-around':
      S.karel.dir = (S.karel.dir + 2) % 4;
      K.log(`${cmd} → ${K.DIRS[S.karel.dir].arrow}`, 'cmd');
      break;
    case 'grab':
      if (K.getCell(S.karel.x, S.karel.y) !== 'A') return errStop('no_pearl');
      K.setCell(S.karel.x, S.karel.y, '.'); S.karel.motxilla++;
      K.log(`${cmd} ⚪ → ${S.karel.motxilla}`, 'ok');
      break;
    case 'drop':
      if (S.karel.motxilla <= 0) return errStop('bag_empty');
      if (K.getCell(S.karel.x, S.karel.y) === 'A') {
        K.log(`⚠ ${cmd}: ja hi ha una perla aquí — la teva es conserva`, 'inf');
        break;
      }
      K.setCell(S.karel.x, S.karel.y, 'A'); S.karel.motxilla--;
      K.log(`${cmd} ⚪ → ${S.karel.motxilla}`, 'ok');
      break;
  }

  K.renderWorld();
  K.updateStatus();
  return true;
}


// ── Build + Run / Step / Stop ──

function buildInterpreter() {
  const S = K.state;
  const ast = K.parseCode(document.getElementById('code-editor')?.value || '');
  if (!ast) return null;
  S.procs = {}; S.callDepth = 0; S.stepCount = 0;
  for (const node of ast) if (node.type === 'proc') S.procs[node.name] = node.body;
  return K.runStmts(ast.filter(n => n.type !== 'proc'));
}

function runProgram() {
  const S = K.state;
  if (S.running) return;
  const gen = buildInterpreter();
  if (!gen) return;
  // Cada execució nova és pàgina en blanc
  const logEl = document.getElementById('log');
  if (logEl) logEl.innerHTML = '';
  K.clearLineMarks();
  S.interpreter = gen; S.stepMode = false; S.running = true;
  K.setStateUI('running');
  K.log(K.t('log.running'), 'ok');
  tick();
}

function stepProgram() {
  const S = K.state;
  if (!S.running && !S.interpreter) {
    const gen = buildInterpreter();
    if (!gen) return;
    K.clearLineMarks();
    S.interpreter = gen; S.running = true; S.stepMode = true;
    K.setStateUI('step');
    K.log(K.t('log.step_mode'), 'ok');
  }
  doStep();
}

function doStep() {
  const S = K.state;
  if (!S.interpreter) return;
  const res = S.interpreter.next();
  if (res.done) {
    K.log(K.t('log.done'), 'ok');
    K.clearLineMarks();
    S.running = false; S.interpreter = null;
    K.setStateUI('idle');
    return;
  }
  execAction(res.value);
}

function tick() {
  const S = K.state;
  if (!S.running || S.stepMode || !S.interpreter) return;
  const res = S.interpreter.next();
  if (res.done) {
    K.log(K.t('log.done'), 'ok');
    K.clearLineMarks();
    S.running = false; S.interpreter = null;
    K.setStateUI('idle');
    return;
  }
  const ok = execAction(res.value);
  if (ok !== false) S.tickTimer = setTimeout(tick, S.stepDelay);
}

function stopProgram() {
  const S  = K.state;
  const was = S.running || S.stepMode;
  S.running = false; S.stepMode = false; S.interpreter = null;
  if (S.tickTimer) { clearTimeout(S.tickTimer); S.tickTimer = null; }
  if (was) { K.clearLineMarks(); K.setStateUI('idle'); }
}

function resetKarel() {
  const S = K.state;
  stopProgram();
  S.world.grid = S.worldInit.map(r => [...r]);
  S.karel = { ...S.karelInit };
  K.clearLineMarks();
  K.renderWorldFull();
  K.updateStatus();
  K.setStateUI('idle');
  K.log(K.t('log.reset'), 'dim');
}


// ── Exporta ──

K.execAction   = execAction;
K.runProgram   = runProgram;
K.stepProgram  = stepProgram;
K.stopProgram  = stopProgram;
K.resetKarel   = resetKarel;

// Globals per a HTML onclick
window.runProgram  = runProgram;
window.stepProgram = stepProgram;
window.stopProgram = stopProgram;
window.resetKarel  = resetKarel;
