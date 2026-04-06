// ════════════════════════════════════════════════════════
// interpreter.js — Intèrpret (generadors JS)
//
// Yield objectes { cmd, line } per a cada acció.
// Els errors de runtime (bucle infinit, recursió) es senyalen
// amb yield { type:'error', code, msg, line }.
// La capa d'execució (execution.js) consumeix els yields.
// ════════════════════════════════════════════════════════

function* runStmts(stmts) {
  for (const s of stmts) yield* runStmt(s);
}

function* runStmt(node) {
  const S = K.state;

  switch (node.type) {
    case 'command':
      yield { cmd: node.name, line: node.line };
      break;

    case 'if':
      yield* runStmts(K.evalCond(node.cond) ? node.then : node.else);
      break;

    case 'while': {
      let guard = 50000;
      while (K.evalCond(node.cond)) {
        if (--guard <= 0) {
          yield { type: 'error', code: 'inf_loop', msg: K.t('log.inf_loop'), line: node.line };
          return;
        }
        yield* runStmts(node.body);
      }
      break;
    }

    case 'repeat':
      for (let i = 0; i < node.count; i++) yield* runStmts(node.body);
      break;

    case 'call': {
      const body = S.procs[node.name];
      if (!body) {
        yield {
          type: 'error', code: 'proc_undef',
          msg: `'${node.name}' (${K.t('log.line')} ${node.line}): ${K.t('err.proc_undef')}`,
          line: node.line,
        };
        return;
      }
      S.callDepth++;
      if (S.callDepth > 50) {
        yield { type: 'error', code: 'deep_rec', msg: K.t('log.deep_rec'), line: node.line };
        S.callDepth = 0;
        return;
      }
      yield* runStmts(body);
      S.callDepth--;
      break;
    }

    case 'proc':
      break; // les definicions de procediment es processen al build
  }
}

K.runStmts = runStmts;
K.runStmt  = runStmt;
