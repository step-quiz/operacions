// ════════════════════════════════════════════════════════
// tokenizer.js — Funció pura: codi → tokens
// ════════════════════════════════════════════════════════

function tokenize(code) {
  const toks = [];
  let i = 0, line = 1;
  while (i < code.length) {
    const c = code[i];
    if (c === '\n')           { line++; i++; continue; }
    if (/\s/.test(c))         { i++; continue; }
    if (c === '/' && code[i+1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    if ('{}()'.includes(c))   { toks.push({ t: c, line }); i++; continue; }
    if (/[0-9]/.test(c)) {
      let n = '';
      const tl = line;
      while (i < code.length && /[0-9]/.test(code[i])) n += code[i++];
      toks.push({ t: 'N', v: parseInt(n), line: tl });
      continue;
    }
    if (!/[\s{}()\/]/.test(c)) {
      let w = '';
      const tl = line;
      while (i < code.length && !/[\s{}()\/]/.test(code[i])) w += code[i++];
      toks.push({ t: 'W', v: w, line: tl });
      continue;
    }
    i++;
  }
  toks.push({ t: 'EOF', line });
  return toks;
}

K.tokenize = tokenize;
