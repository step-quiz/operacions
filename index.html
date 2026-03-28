/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/sistemes-equacions.js
 * ROL: Lògica específica del joc "Sistemes d'equacions".
 * ARQUITECTURA:
 * - Conté els generadors de problemes (genRepte1/2/3), els constructors de
 *   passos guiats (buildStepsRepte1/2/3) i el flux de joc (buildLevel,
 *   checkStep, finalizeProblem, etc.).
 * - Depèn de KaTeX (global), utils.js, config.js i game-core.js, que han
 *   de carregar-se ABANS que aquest fitxer a l'HTML.
 * DEPENDÈNCIES: katex (CDN), utils.js, config.js, game-core.js.
 * ============================================================================
 */

// ══════════════════════════════════════════════════════════
// REFERÈNCIES DOM
// ══════════════════════════════════════════════════════════

const els = {
    body:            document.body,
    selectionScreen: document.getElementById('selection-screen'),
    gameScreen:      document.getElementById('game-screen'),
    sessionDisplay:  document.getElementById('session-display'),
    lvlDisplay:      document.getElementById('lvl-display'),
    scoreDisplay:    document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    expressionBox:   document.getElementById('expression-box'),
    resolutionPanel: document.getElementById('resolution-panel'),
    currentStep:     document.getElementById('current-step'),
    stepTitle:       document.getElementById('step-title'),
    stepSchema:      document.getElementById('step-schema'),
    stepBtns:        document.getElementById('step-btns'),
    stepFeedback:    document.getElementById('step-feedback'),
    btnSubmitStep:   document.getElementById('btn-submit-step'),
    progressBar:     document.getElementById('progress-bar'),
    methodBadge:     document.getElementById('method-badge'),
};

// ══════════════════════════════════════════════════════════
// ESTAT
// ══════════════════════════════════════════════════════════

let selectedRepte  = 0;
let isPenalizing   = false;
let usedProblems   = new Set();
let previewProblem = null;
let currentProblem = null;
let currentSteps   = [];
let currentStepIdx = 0;
let selectedOption = null;
let stepPoints     = 10;  // punts del problema actual (màx 10, −2 per error, mínim 0)

// ══════════════════════════════════════════════════════════
// HELPERS KATEX I MATEMÀTICS
// ══════════════════════════════════════════════════════════

/** Renderitza LaTeX a HTML string */
function tex(s) {
    return katex.renderToString(s, { throwOnError: false, displayMode: false });
}

/**
 * Parseja un valor numèric. Estricte: buit = NaN.
 * Accepta coma com a separador decimal i guions Unicode com a signe menys.
 */
function parseNum(s) {
    var clean = String(s).trim();
    clean = clean.replace(/\u2212/g, '-').replace(/\u2013/g, '-').replace(/\u2014/g, '-');
    clean = clean.replace(',', '.');
    if (clean === '' || clean === '+' || clean === '-') return NaN;
    if (!/^-?\d+(\.\d+)?$/.test(clean)) return NaN;
    return parseFloat(clean);
}

/**
 * Parseja un coeficient d'una variable (ex: el "3" de "3y" o el "-" de "-y").
 * Accepta: "" o "+" → 1, "-" → -1, "3" → 3, "-2" → -2
 */
function parseCoef(s) {
    var clean = String(s).trim();
    clean = clean.replace(/\u2212/g, '-').replace(/\u2013/g, '-').replace(/\u2014/g, '-');
    clean = clean.replace(',', '.');
    if (clean === '' || clean === '+') return 1;
    if (clean === '-') return -1;
    if (!/^-?\d+(\.\d+)?$/.test(clean)) return NaN;
    return parseFloat(clean);
}

/**
 * Retorna un string LaTeX per a l'equació ax + by = c.
 * Si c === null, retorna només la part esquerra (sense = c).
 */
function eqTex(a, b, c) {
    let s = '';
    if (a !== 0) {
        if (a === 1)       s = 'x';
        else if (a === -1) s = '-x';
        else               s = a + 'x';
    }
    if (b !== 0) {
        const absB = Math.abs(b);
        const bVar = (absB === 1 ? '' : absB) + 'y';
        if (s === '') {
            s = (b < 0 ? '-' : '') + bVar;
        } else {
            s += (b < 0 ? ' - ' : ' + ') + bVar;
        }
    }
    if (s === '') s = '0';
    return c !== null ? s + ' = ' + c : s;
}

/**
 * Formata una expressió tipus coef·var + constant com a LaTeX.
 * Ex: fmtExprTex(2, 'y', -3) → "2y - 3"
 */
function fmtExprTex(coef, varName, constant) {
    let s = '';
    if (coef !== 0) {
        const ac   = Math.abs(coef);
        const sign = coef < 0 ? '-' : '';
        s += sign + (ac === 1 ? '' : ac) + varName;
    }
    if (constant !== 0) {
        if (s === '') s = String(constant);
        else s += constant < 0 ? ' - ' + Math.abs(constant) : ' + ' + constant;
    }
    return s || '0';
}

// ══════════════════════════════════════════════════════════
// RENDERITZACIÓ (KaTeX)
// ══════════════════════════════════════════════════════════

/** Crea un <span> amb KaTeX renderitzat */
function mkTexSpan(latexStr, cls) {
    const el = document.createElement('span');
    if (cls) el.className = cls;
    katex.render(latexStr, el, { throwOnError: false });
    return el;
}

/** Construeix el DOM del sistema (clau + dues equacions) dins container */
function renderSistemaTo(p, container) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'brace-wrap';

    const brace = document.createElement('span');
    brace.className = 'brace-left';
    brace.textContent = '{';

    const eqs = document.createElement('div');
    eqs.className = 'eq-stack';

    const eq1 = document.createElement('div');
    eq1.className = 'eq-row';
    eq1.innerHTML = tex(eqTex(p.a1, p.b1, p.c1)) + '<span class="eq-label">(1a)</span>';

    const eq2 = document.createElement('div');
    eq2.className = 'eq-row';
    eq2.innerHTML = tex(eqTex(p.a2, p.b2, p.c2)) + '<span class="eq-label">(2a)</span>';

    eqs.appendChild(eq1);
    eqs.appendChild(eq2);
    wrap.appendChild(brace);
    wrap.appendChild(eqs);
    container.appendChild(wrap);
}

function renderSistema(p) { renderSistemaTo(p, els.expressionBox); }

/** Afegeix una fila derivada a l'eq-stack (expressió aïllada, resultat parcial, etc.) */
function addExprRow(latexStr, cls, label) {
    const stack = els.expressionBox.querySelector('.eq-stack');
    if (!stack) return;
    const row = document.createElement('div');
    row.className = 'eq-row' + (cls ? ' ' + cls : '');
    row.innerHTML = tex(latexStr);
    if (label) row.innerHTML += '<span class="eq-label">' + label + '</span>';
    stack.appendChild(row);
}

/** Mostra el resultat final (solució del sistema) */
function showResultFinal(x, y) {
    addExprRow('x = ' + x + ', \\quad y = ' + y, 'result-final');
}

// ══════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════

/** Actualitza la barra de progrés (dots) */
function updateProgressBar(idx, total) {
    const bar = els.progressBar;
    if (!bar) return;
    bar.innerHTML = '';
    for (let i = 0; i < total; i++) {
        if (i > 0) {
            const conn = document.createElement('div');
            conn.className = 'step-connector';
            bar.appendChild(conn);
        }
        const dot = document.createElement('div');
        dot.className = 'step-dot';
        if (i < idx)        dot.classList.add('done');
        else if (i === idx) dot.classList.add('current');
        bar.appendChild(dot);
    }
    const lbl = document.createElement('span');
    lbl.className = 'step-label';
    lbl.textContent = 'Pas ' + (idx + 1) + ' de ' + total;
    bar.appendChild(lbl);
}

/** Actualitza el badge del mètode */
function updateMethodBadge() {
    const b = els.methodBadge;
    if (!b) return;
    if (selectedRepte === 1)      { b.textContent = 'Substitució'; b.className = 'ws-badge badge-sub'; }
    else if (selectedRepte === 2) { b.textContent = 'Reducció';    b.className = 'ws-badge badge-red'; }
    else if (selectedRepte === 3) { b.textContent = 'Igualació';   b.className = 'ws-badge badge-igu'; }
}

/** Crea un input matemàtic amb suport teclat custom */
function mkInput(id, width) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'math-input';
    inp.id = id;
    inp.autocomplete = 'off';
    if (width) inp.style.width = width + 'px';
    inp._kbDirectTapBound = true;
    inp.addEventListener('pointerdown', function(e) {
        if (!isTouchDevice()) return;
        e.preventDefault();
        showCustomKeyboard(inp);
    });
    return inp;
}

/**
 * Crea un input signat (l'alumne escriu el valor complet, amb signe si cal).
 * Retorna { btn (fragment buit), inp, getSignedValue }.
 */
function mkSignedInput(id, width, _correctVal) {
    const inp = mkInput(id, width);
    const btn = document.createDocumentFragment();
    return { btn: btn, inp: inp, getSignedValue: function() { return parseCoef(inp.value); } };
}

/**
 * Embolicar un input de terme independent amb parèntesis: + ( [inp] )
 * Evita la notació incorrecta "3y + -15", convertint-la en "3y + (-15)".
 * Retorna un DocumentFragment amb: +  (  inp  )
 */
function mkConstGroup(signedInp) {
    var frag = document.createDocumentFragment();
    var plus = document.createElement('span');
    plus.className = 'op-plus'; plus.textContent = '+';
    frag.appendChild(plus);
    var lp = document.createElement('span');
    lp.className = 'paren-const'; lp.textContent = '(';
    frag.appendChild(lp);
    frag.appendChild(signedInp.btn);
    frag.appendChild(signedInp.inp);
    var rp = document.createElement('span');
    rp.className = 'paren-const'; rp.textContent = ')';
    frag.appendChild(rp);
    return frag;
}

// ══════════════════════════════════════════════════════════
// CONSTRUCTORS D'ESQUEMA
// ══════════════════════════════════════════════════════════

/** Esquema buit */
function buildEmpty() {
    return function(c) { c.innerHTML = ''; };
}

/** Botons de selecció amb auto-submit (pills). opts.vertical = true per layout vertical */
function buildBtnSelect(options, opts) {
    return function(_c) {
        selectedOption = null;
        var wrap = document.createElement('div');
        wrap.className = 'eq-choice' + (opts && opts.vertical ? ' eq-choice-vertical' : '');
        options.forEach(function(opt) {
            var pill = document.createElement('button');
            pill.className = 'eq-pill';
            if (opt.html) pill.innerHTML = opt.html;
            else pill.textContent = opt.label;
            pill.onclick = function() {
                wrap.querySelectorAll('.eq-pill').forEach(function(b) { b.classList.remove('selected'); });
                pill.classList.add('selected');
                selectedOption = opt.value;
                if (!isTransitioning && !isPenalizing) checkStep();
            };
            wrap.appendChild(pill);
        });
        els.stepBtns.appendChild(wrap);
    };
}

/** Construeix una fila d'inputs amb text KaTeX intercalat */
function buildSchemaRow(parts) {
    return function(c) {
        c.innerHTML = '';
        var row = document.createElement('div');
        row.className = 'input-row';
        parts.forEach(function(part) {
            if (typeof part === 'string') {
                row.appendChild(mkTexSpan(part));
            } else {
                row.appendChild(mkInput(part.id, part.width || 56));
            }
        });
        c.appendChild(row);
    };
}

// ══════════════════════════════════════════════════════════
// GENERADORS DE PROBLEMES
// ══════════════════════════════════════════════════════════

// ── Repte 1: Substitució ────────────────────────────────
function genRepte1(opIdx) {
    var x0 = randIntNonZero(-5, 5);
    var y0 = randIntNonZero(-5, 5);
    var isoEq     = pick([1, 2]);
    var isoVar    = pick(['x', 'y']);
    var isoCoef   = pick([1, -1]);
    var otherCoef = randIntNonZero(-4, 4);

    var a1, b1, c1, a2, b2, c2;
    if (isoEq === 1 && isoVar === 'x') {
        a1 = isoCoef; b1 = otherCoef; c1 = a1*x0+b1*y0;
        a2 = randIntNonZero(-4,4); b2 = randIntNonZero(-4,4); c2 = a2*x0+b2*y0;
    } else if (isoEq === 1 && isoVar === 'y') {
        b1 = isoCoef; a1 = otherCoef; c1 = a1*x0+b1*y0;
        a2 = randIntNonZero(-4,4); b2 = randIntNonZero(-4,4); c2 = a2*x0+b2*y0;
    } else if (isoEq === 2 && isoVar === 'x') {
        a2 = isoCoef; b2 = otherCoef; c2 = a2*x0+b2*y0;
        a1 = randIntNonZero(-4,4); b1 = randIntNonZero(-4,4); c1 = a1*x0+b1*y0;
    } else {
        b2 = isoCoef; a2 = otherCoef; c2 = a2*x0+b2*y0;
        a1 = randIntNonZero(-4,4); b1 = randIntNonZero(-4,4); c1 = a1*x0+b1*y0;
    }

    // Garantim que el sistema és compatible determinat: det = a1·b2 − a2·b1 ≠ 0
    var det = a1 * b2 - a2 * b1;
    if (det === 0) return genRepte1(opIdx);

    return { type:'subst', a1:a1, b1:b1, c1:c1, a2:a2, b2:b2, c2:c2, x0:x0, y0:y0, isoEq:isoEq, isoVar:isoVar, isoCoef:isoCoef, otherCoef:otherCoef };
}

// ── Repte 2: Reducció ───────────────────────────────────
function genRepte2(opIdx) {
    var x0 = randIntNonZero(-5, 5);
    var y0 = randIntNonZero(-5, 5);
    var elimVar = pick(['x', 'y']);
    var tipus = opIdx === 0 ? 'direct' : pick(['direct', 'direct', 'multiply']);

    var a1, b1, c1, a2, b2, c2, factor = 1, elimEq = null;

    if (tipus === 'direct') {
        var coefElim = randIntNonZero(1, 4);
        if (elimVar === 'x') {
            a1 = coefElim; a2 = -coefElim;
            b1 = randIntNonZero(-4,4); b2 = randIntNonZero(-4,4);
        } else {
            b1 = coefElim; b2 = -coefElim;
            a1 = randIntNonZero(-4,4); a2 = randIntNonZero(-4,4);
        }
        c1 = a1*x0+b1*y0; c2 = a2*x0+b2*y0;
    } else {
        factor = pick([2, 3]);
        elimEq = pick([1, 2]);
        var coefBase = randIntNonZero(1, 3);
        if (elimVar === 'x') {
            if (elimEq === 1) { a2 = coefBase*factor; a1 = -coefBase; }
            else              { a1 = coefBase*factor; a2 = -coefBase; }
            b1 = randIntNonZero(-3,3); b2 = randIntNonZero(-3,3);
        } else {
            if (elimEq === 1) { b2 = coefBase*factor; b1 = -coefBase; }
            else              { b1 = coefBase*factor; b2 = -coefBase; }
            a1 = randIntNonZero(-3,3); a2 = randIntNonZero(-3,3);
        }
        c1 = a1*x0+b1*y0; c2 = a2*x0+b2*y0;
    }

    var det = a1*b2 - a2*b1;
    if (det === 0) return genRepte2(opIdx);

    return { type:'reduc', a1:a1, b1:b1, c1:c1, a2:a2, b2:b2, c2:c2, x0:x0, y0:y0, elimVar:elimVar, tipus:tipus, factor:factor, elimEq:elimEq };
}

// ── Repte 3: Igualació ──────────────────────────────────
function genRepte3(opIdx) {
    var coefResult = 0, tries = 0;
    var a1, b1, c1, a2, b2, c2, isoVar, isoCoef1, isoCoef2, altCoef1, altCoef2;
    do {
        var x0_ = randIntNonZero(-5, 5);
        var y0_ = randIntNonZero(-5, 5);
        isoVar   = pick(['x', 'y']);
        isoCoef1 = pick([1, -1]);
        isoCoef2 = pick([1, -1]);
        altCoef1 = randIntNonZero(-4, 4);
        altCoef2 = randIntNonZero(-4, 4);

        if (isoVar === 'x') {
            a1 = isoCoef1; b1 = altCoef1; a2 = isoCoef2; b2 = altCoef2;
        } else {
            a1 = altCoef1; b1 = isoCoef1; a2 = altCoef2; b2 = isoCoef2;
        }
        c1 = a1*x0_+b1*y0_; c2 = a2*x0_+b2*y0_;

        // coefResult: coeficient de varAlt en l'equació resultant d'igualar les
        // dues expressions aïllades. Es calcula com (-isoC1·altC1) - (-isoC2·altC2).
        coefResult = (-isoCoef1*altCoef1) - (-isoCoef2*altCoef2);

        if (coefResult !== 0) {
            // Garantim sistema compatible determinat
            var det = a1*b2 - a2*b1;
            if (det === 0) { tries++; continue; }
            return { type:'igual', a1:a1, b1:b1, c1:c1, a2:a2, b2:b2, c2:c2,
                     x0:x0_, y0:y0_, isoVar:isoVar, isoCoef1:isoCoef1, isoCoef2:isoCoef2,
                     altCoef1:altCoef1, altCoef2:altCoef2 };
        }
        tries++;
    } while (tries < 50);
    return genRepte3(opIdx);
}

// ══════════════════════════════════════════════════════════
// CONSTRUCTORS DE PASSOS
// ══════════════════════════════════════════════════════════

// ── Repte 1: Substitució ────────────────────────────────
function buildStepsRepte1(p) {
    var steps = [];

    function coefOf(eqN, v) { return v === 'x' ? (eqN === 1 ? p.a1 : p.a2) : (eqN === 1 ? p.b1 : p.b2); }
    function canIso(eqN, v) { return Math.abs(coefOf(eqN, v)) === 1; }
    function validEqs()     { return [1, 2].filter(function(n) { return canIso(n, 'x') || canIso(n, 'y'); }); }

    var chosenEq = null, chosenVar = null;

    function isoData() {
        var varAil    = chosenVar;
        var varAltra  = varAil === 'x' ? 'y' : 'x';
        var coefIso   = coefOf(chosenEq, varAil);
        var coefOther = varAil === 'x' ? (chosenEq === 1 ? p.b1 : p.b2) : (chosenEq === 1 ? p.a1 : p.a2);
        var cEq       = chosenEq === 1 ? p.c1 : p.c2;
        var isoCoefVar = -coefOther / coefIso;
        var isoConst   = cEq / coefIso;

        var subEq = chosenEq === 1 ? 2 : 1;
        var aS = subEq === 1 ? p.a1 : p.a2;
        var bS = subEq === 1 ? p.b1 : p.b2;
        var cS = subEq === 1 ? p.c1 : p.c2;

        var coefResultat, constResultat, varResultat;
        if (varAil === 'y') {
            coefResultat  = aS + bS * isoCoefVar;
            constResultat = cS - bS * isoConst;
            varResultat   = 'x';
        } else {
            coefResultat  = bS + aS * isoCoefVar;
            constResultat = cS - aS * isoConst;
            varResultat   = 'y';
        }

        var coefSubstit   = varAil === 'x' ? aS : bS;
        var expandedCoef  = coefSubstit * isoCoefVar;
        var expandedConst = coefSubstit * isoConst;

        return {
            varAil: varAil, varAltra: varAltra, isoCoefVar: isoCoefVar, isoConst: isoConst,
            coefResultat: coefResultat, constResultat: constResultat, varResultat: varResultat,
            solResultat: constResultat / coefResultat,
            solAilada: varAil === 'x' ? p.x0 : p.y0,
            subEq: subEq, aS: aS, bS: bS, cS: cS,
            coefSubstit: coefSubstit, expandedCoef: expandedCoef, expandedConst: expandedConst,
        };
    }

    // PAS 1 — Triar equació (pills amb KaTeX)
    steps.push({
        title: 'De quina equació aïlles una variable?',
        buildSchema: buildEmpty(),
        hideBtnOk: true,
        buildBtns: buildBtnSelect([
            { html: tex(eqTex(p.a1, p.b1, p.c1)) + '<span class="eq-label" style="margin-left:8px">(1a)</span>', value: '1' },
            { html: tex(eqTex(p.a2, p.b2, p.c2)) + '<span class="eq-label" style="margin-left:8px">(2a)</span>', value: '2' },
        ], { vertical: true }),
        validate: function() { return validEqs().includes(Number(selectedOption)); },
        onCorrect: function() {
            chosenEq = Number(selectedOption);
            // Destacar l'equació escollida amb fons groc (marcador)
            var eqRows = els.expressionBox.querySelectorAll('.eq-row');
            eqRows.forEach(function(r) { r.classList.remove('eq-highlight'); });
            var idx = chosenEq - 1;
            if (eqRows[idx]) eqRows[idx].classList.add('eq-highlight');
        },
    });

    // PAS 2 — Triar variable (pills)
    steps.push({
        title: 'Quina variable aïlles?',
        buildSchema: buildEmpty(),
        hideBtnOk: true,
        buildBtns: buildBtnSelect([
            { html: tex('x'), value: 'x' },
            { html: tex('y'), value: 'y' },
        ]),
        validate: function() {
            if (canIso(chosenEq, selectedOption)) return true;
            if (els.stepFeedback) {
                els.stepFeedback.innerHTML = 'Aquesta variable no té coeficient 1 ni −1.<br>Tria l\'altra, que es pot aïllar sense fraccions.';
                els.stepFeedback.className = 'feedback-msg important';
            }
            return false;
        },
        onCorrect: function() { chosenVar = selectedOption; },
    });

    // PAS 3 — Aïllar
    steps.push({
        title: function() {
            var d = isoData();
            return 'Aïlla ' + tex(d.varAil) + ' a la ' + (chosenEq === 1 ? 'primera' : 'segona') + ' equació:';
        },
        buildSchema: function(c) {
            c.innerHTML = '';
            var d = isoData();
            var row = document.createElement('div');
            row.className = 'input-row';
            row.appendChild(mkTexSpan(d.varAil + ' ='));
            var siC = mkSignedInput('iso-coef', 52, d.isoCoefVar);
            row.appendChild(siC.btn); row.appendChild(siC.inp);
            row.appendChild(mkTexSpan(d.varAltra));
            var siK = mkSignedInput('iso-const', 52, d.isoConst);
            row.appendChild(mkConstGroup(siK));
            c._getVC = siC.getSignedValue;
            c._getVK = siK.getSignedValue;
            c.appendChild(row);
        },
        validate: function() {
            var d  = isoData();
            var vc = els.stepSchema._getVC ? els.stepSchema._getVC() : NaN;
            var vk = els.stepSchema._getVK ? els.stepSchema._getVK() : NaN;
            if (isNaN(vc) || isNaN(vk)) return false;
            return vc === d.isoCoefVar && vk === d.isoConst;
        },
        onCorrect: function() {
            var d = isoData();
            addExprRow(d.varAil + ' = ' + fmtExprTex(d.isoCoefVar, d.varAltra, d.isoConst), 'iso-row');
        },
    });

    // Getters del pas de substitució
    var subGetters = {};

    // PAS 4 — Substitució (4 files alineades)
    steps.push({
        title: function() {
            var d = isoData();
            return 'Substitueix a la ' + (d.subEq === 1 ? '1a' : '2a') + ' equació:';
        },
        buildSchema: function(c) {
            c.innerHTML = '';
            var d = isoData();
            var otherCoef = d.varAil === 'x' ? d.bS : d.aS;
            var absCS = Math.abs(d.coefSubstit);

            // ── Helpers per formatar termes ─────────────────
            // Prefix del coeficient davant del parèntesi: "−3·" o "2·" o "" (si ±1)
            function coefPrefix(coef) {
                var abs = Math.abs(coef);
                var sign = coef < 0 ? '-' : '';
                return sign + (abs === 1 ? '' : abs + '\\cdot ');
            }
            // Terme de la variable no substituïda: "4y" o "−3y" etc.
            function otherTermTex(isFirst) {
                if (otherCoef === 0) return '';
                var abs = Math.abs(otherCoef);
                var num = abs === 1 ? '' : String(abs);
                if (isFirst) {
                    return (otherCoef < 0 ? '-' : '') + num + d.varAltra;
                }
                return (otherCoef < 0 ? ' - ' : ' + ') + num + d.varAltra;
            }

            // ── Construeix una fila amb el parèntesi ────────
            // parenBefore: tex abans de "("
            // parenAfter:  tex després de ")"
            function mkAlignRow(parenBefore, inpA, inpB, parenAfter, extraCls) {
                var div = document.createElement('div');
                div.className = 'align-left' + (extraCls ? ' ' + extraCls : '');
                if (parenBefore) div.appendChild(mkTexSpan(parenBefore));
                var lp = document.createElement('span');
                lp.className = 'paren-big'; lp.textContent = '(';
                div.appendChild(lp);
                div.appendChild(inpA);
                div.appendChild(mkTexSpan(d.varAltra));
                // Terme independent dins parèntesis: + ( inp )
                var opP = document.createElement('span');
                opP.className = 'op-plus'; opP.textContent = '+';
                div.appendChild(opP);
                var clp = document.createElement('span');
                clp.className = 'paren-const'; clp.textContent = '(';
                div.appendChild(clp);
                div.appendChild(inpB);
                var crp = document.createElement('span');
                crp.className = 'paren-const'; crp.textContent = ')';
                div.appendChild(crp);
                var rp = document.createElement('span');
                rp.className = 'paren-big'; rp.textContent = ')';
                div.appendChild(rp);
                if (parenAfter) div.appendChild(mkTexSpan(parenAfter));
                return div;
            }

            var grid = document.createElement('div');
            grid.className = 'align-grid';

            // ── Fila 1: equació original (text, dimmed) ─────
            var r1l = document.createElement('div'); r1l.className = 'align-left row-dim';
            r1l.appendChild(mkTexSpan(eqTex(d.aS, d.bS, null)));
            var r1r = document.createElement('div'); r1r.className = 'align-right row-dim';
            r1r.appendChild(mkTexSpan(String(d.cS)));

            // ── Fila 2: substitució (inputs) ────────────────
            var s1C = mkSignedInput('sub-coef', 50, d.isoCoefVar);
            var s1K = mkSignedInput('sub-const', 50, d.isoConst);
            var r2l;
            if (d.varAil === 'x') {
                // Ordre original: aS·x + bS·y → coefSubstit·(expr) + otherTerm
                r2l = mkAlignRow(coefPrefix(d.coefSubstit), s1C.inp, s1K.inp, otherTermTex(false), 'row-highlight');
            } else {
                // Ordre original: aS·x + bS·y → otherTerm + coefSubstit·(expr)
                var beforeParen = otherTermTex(true);
                beforeParen += (d.coefSubstit < 0 ? ' - ' : ' + ') + (absCS === 1 ? '' : absCS + '\\cdot ');
                r2l = mkAlignRow(beforeParen, s1C.inp, s1K.inp, '', 'row-highlight');
            }

            // ── Fila 3: expansió (inputs) ───────────────────
            var s2C = mkSignedInput('exp-coef', 50, d.expandedCoef);
            var s2K = mkSignedInput('exp-const', 50, d.expandedConst);
            var r3l;
            if (d.varAil === 'x') {
                r3l = mkAlignRow('', s2C.inp, s2K.inp, otherTermTex(false), '');
            } else {
                var before3 = otherTermTex(true) + ' + ';
                r3l = mkAlignRow(before3, s2C.inp, s2K.inp, '', '');
            }

            // ── Fila 4: resultat ────────────────────────────
            var r4l = document.createElement('div'); r4l.className = 'align-left';
            r4l.appendChild(mkTexSpan(d.varResultat));
            var inp4 = mkInput('sol-res', 58);
            var r4r = document.createElement('div'); r4r.className = 'align-right';
            r4r.appendChild(inp4);

            var cS_str = String(d.cS);
            [
                r1l,  mkTexSpan('=', 'align-eq'), r1r,
                r2l,  mkTexSpan('=', 'align-eq'), mkTexSpan(cS_str, 'align-right'),
                r3l,  mkTexSpan('=', 'align-eq'), mkTexSpan(cS_str, 'align-right'),
                r4l,  mkTexSpan('=', 'align-eq'), r4r,
            ].forEach(function(el) { grid.appendChild(el); });
            c.appendChild(grid);

            subGetters = {
                subCoef:  s1C.getSignedValue,
                subConst: s1K.getSignedValue,
                expCoef:  s2C.getSignedValue,
                expConst: s2K.getSignedValue,
            };
        },
        validate: function() {
            var d = isoData();
            var checks = [
                { id: 'sub-coef',  expected: d.isoCoefVar,    getter: function() { return subGetters.subCoef ? subGetters.subCoef() : NaN; } },
                { id: 'sub-const', expected: d.isoConst,      getter: function() { return subGetters.subConst ? subGetters.subConst() : NaN; } },
                { id: 'exp-coef',  expected: d.expandedCoef,  getter: function() { return subGetters.expCoef ? subGetters.expCoef() : NaN; } },
                { id: 'exp-const', expected: d.expandedConst, getter: function() { return subGetters.expConst ? subGetters.expConst() : NaN; } },
                { id: 'sol-res',   expected: d.solResultat,   getter: function() { return parseNum(document.getElementById('sol-res') ? document.getElementById('sol-res').value : ''); } },
            ];
            var allOk = true;
            for (var i = 0; i < checks.length; i++) {
                var ch = checks[i];
                var el = document.getElementById(ch.id);
                if (!el || el.readOnly) continue;
                var val = ch.getter();
                if (!isNaN(val) && val === ch.expected) {
                    el.classList.add('locked-green');
                    el.readOnly = true;
                } else {
                    allOk = false;
                    el.classList.add('error-flash');
                    (function(e) { setTimeout(function() { e.classList.remove('error-flash'); e.value=''; }, 350); })(el);
                }
            }
            if (!allOk) {
                if (els.stepFeedback) {
                    els.stepFeedback.innerHTML = 'Algun valor és incorrecte. Revisa els camps en vermell.';
                    els.stepFeedback.className = 'feedback-msg important';
                }
                setTimeout(function() {
                    var first = els.stepSchema.querySelector('input:not([readonly])');
                    if (first) { if (isTouchDevice()) showCustomKeyboard(first); else first.focus(); }
                }, 400);
                return false;
            }
            return true;
        },
        onCorrect: function() {
            var d = isoData();
            addExprRow(d.varResultat + ' = ' + d.solResultat, 'result-row');
        },
    });

    // PAS 5 — Back-substitució
    steps.push({
        title: function() {
            var d = isoData();
            return 'Substitueix ' + tex(d.varResultat + ' = ' + d.solResultat) + ' a l\'expressió aïllada. Quant val ' + tex(d.varAil) + '?';
        },
        buildSchema: function(c) {
            var d = isoData();
            buildSchemaRow([d.varAil + ' =', { id: 'sol-var2', width: 58 }])(c);
        },
        validate: function() {
            var d = isoData();
            var v = parseNum(document.getElementById('sol-var2') ? document.getElementById('sol-var2').value : '');
            return !isNaN(v) && v === d.solAilada;
        },
        onCorrect: function() {
            var d = isoData();
            addExprRow(d.varAil + ' = ' + d.solAilada, 'result-row');
            showResultFinal(p.x0, p.y0);
        },
    });

    return steps;
}

// ── Repte 2: Reducció ───────────────────────────────────
function buildStepsRepte2(p) {
    var steps = [];
    var chosenF1 = null, chosenF2 = null, chosenElimVar = null;
    var sumGetters = {};

    function getCancelledVar(f1, f2) {
        var sumX = f1*p.a1 + f2*p.a2;
        var sumY = f1*p.b1 + f2*p.b2;
        var sumC = f1*p.c1 + f2*p.c2;
        if (sumX === 0 && (sumY !== 0 || sumC !== 0)) return 'x';
        if (sumY === 0 && (sumX !== 0 || sumC !== 0)) return 'y';
        return null;
    }

    // PAS 1 — Factors
    steps.push({
        title: 'Per quant multipliques cada equació?',
        buildSchema: function(c) {
            c.innerHTML = '';
            var wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;align-items:center;width:100%;';

            function mkFactorRow(eqLatex, inpId) {
                var row = document.createElement('div');
                row.className = 'input-row';
                row.appendChild(mkTexSpan('(' + eqLatex + ') \\times'));
                row.appendChild(mkInput(inpId, 52));
                return row;
            }
            wrap.appendChild(mkFactorRow(eqTex(p.a1, p.b1, null), 'fac-1'));
            wrap.appendChild(mkFactorRow(eqTex(p.a2, p.b2, null), 'fac-2'));
            c.appendChild(wrap);
        },
        validate: function() {
            var f1 = parseNum(document.getElementById('fac-1') ? document.getElementById('fac-1').value : '');
            var f2 = parseNum(document.getElementById('fac-2') ? document.getElementById('fac-2').value : '');
            if (isNaN(f1) || isNaN(f2) || !Number.isInteger(f1) || !Number.isInteger(f2) || f1 === 0 || f2 === 0) return false;
            var cancelled = getCancelledVar(f1, f2);
            if (cancelled) {
                chosenF1 = f1; chosenF2 = f2; chosenElimVar = cancelled;
                return true;
            }
            if (els.stepFeedback) {
                var sumX = f1*p.a1+f2*p.a2, sumY = f1*p.b1+f2*p.b2;
                if (sumX === 0 && sumY === 0) {
                    els.stepFeedback.innerHTML = "S'eliminen les dues variables alhora. Necessitem que en quedi una. Prova uns altres factors.";
                } else {
                    els.stepFeedback.innerHTML = "Amb aquests factors cap variable s'elimina. Revisa'ls.";
                }
                els.stepFeedback.className = 'feedback-msg important';
            }
            return false;
        },
    });

    // PAS 2 — Alineació: equacions mult. + suma + solució
    steps.push({
        title: function() {
            var s1 = chosenF1 === 1 ? '' : chosenF1 + '·';
            var s2 = chosenF2 === 1 ? '' : chosenF2 + '·';
            return 'Suma <strong>' + s1 + '(Eq1)</strong> + <strong>' + s2 + '(Eq2)</strong>:';
        },
        buildSchema: function(c) {
            c.innerHTML = '';
            var f1 = chosenF1, f2 = chosenF2;
            var elimV = chosenElimVar, altV = elimV === 'x' ? 'y' : 'x';
            var m1a = f1*p.a1, m1b = f1*p.b1, m1c = f1*p.c1;
            var m2a = f2*p.a2, m2b = f2*p.b2, m2c = f2*p.c2;
            var sumA = m1a+m2a, sumB = m1b+m2b, sumC = m1c+m2c;
            var altCoef = elimV === 'x' ? sumB : sumA;
            var solAlt  = elimV === 'x' ? p.y0 : p.x0;
            var solElim = elimV === 'x' ? p.x0 : p.y0;

            // ── Helpers LaTeX per a les columnes de l'array ──
            function colTerm(coef, v) {
                if (coef === 0) return '0';
                var abs = Math.abs(coef);
                var s = coef < 0 ? '-' : '';
                return s + (abs === 1 ? '' : String(abs)) + v;
            }
            function colTermSigned(coef, v) {
                if (coef === 0) return '+\\,0';
                var abs = Math.abs(coef);
                var sign = coef < 0 ? '-\\,' : '+\\,';
                return sign + (abs === 1 ? '' : String(abs)) + v;
            }

            var layout = document.createElement('div');
            layout.className = 'sum-layout';

            // ── Files 1+2 + \hline via KaTeX \begin{array} ──
            var arrayTex =
                '\\def\\arraystretch{1.5}' +
                '\\begin{array}{rrrrcr}' +
                '  & ' + colTerm(m1a, 'x') + ' & ' + colTermSigned(m1b, 'y') + ' & = & ' + m1c + ' \\\\[2pt]' +
                '\\boldsymbol{+} & ' + colTerm(m2a, 'x') + ' & ' + colTermSigned(m2b, 'y') + ' & = & ' + m2c + ' \\\\' +
                '\\hline' +
                '\\end{array}';

            var arrayDiv = document.createElement('div');
            arrayDiv.style.cssText = 'text-align:center;font-size:1.15em;opacity:0.55;margin-bottom:8px';
            katex.render(arrayTex, arrayDiv, { throwOnError: false, displayMode: true });
            layout.appendChild(arrayDiv);

            // ── Fila resultat (inputs HTML) ──────────────────
            var r3 = document.createElement('div');
            r3.className = 'sum-result-row';

            if (elimV === 'x') {
                var z = document.createElement('span'); z.className = 'zero-badge'; z.textContent = '0';
                r3.appendChild(z);
                r3.appendChild(mkTexSpan('\\,x'));
                var pl = document.createElement('span'); pl.className = 'op-plus'; pl.textContent = '+';
                r3.appendChild(pl);
                r3.appendChild(mkInput('sum-alt', 50));
                r3.appendChild(mkTexSpan('y'));
            } else {
                r3.appendChild(mkInput('sum-alt', 50));
                r3.appendChild(mkTexSpan('\\,x'));
                var pl2 = document.createElement('span'); pl2.className = 'op-plus'; pl2.textContent = '+';
                r3.appendChild(pl2);
                var z2 = document.createElement('span'); z2.className = 'zero-badge'; z2.textContent = '0';
                r3.appendChild(z2);
                r3.appendChild(mkTexSpan('\\,y'));
            }
            r3.appendChild(mkTexSpan('\\;=\\;'));
            r3.appendChild(mkInput('sum-c', 58));
            layout.appendChild(r3);

            // ── Fila solució: altV = [inp] ───────────────────
            var solRow = document.createElement('div');
            solRow.className = 'sum-sol-row-simple';
            solRow.appendChild(mkTexSpan(altV));
            solRow.appendChild(mkTexSpan('\\;=\\;'));
            solRow.appendChild(mkInput('sum-sol', 58));
            layout.appendChild(solRow);

            c.appendChild(layout);

            sumGetters = { altCoef: altCoef, sumC: sumC, solAlt: solAlt, solElim: solElim };
        },
        validate: function() {
            var checks = [
                { id: 'sum-alt', expected: sumGetters.altCoef, getter: function() { return parseNum(document.getElementById('sum-alt').value); } },
                { id: 'sum-c',   expected: sumGetters.sumC,    getter: function() { return parseNum(document.getElementById('sum-c').value); } },
                { id: 'sum-sol', expected: sumGetters.solAlt,  getter: function() { return parseNum(document.getElementById('sum-sol').value); } },
            ];
            var allOk = true;
            for (var i = 0; i < checks.length; i++) {
                var ch = checks[i];
                var el = document.getElementById(ch.id);
                if (!el || el.readOnly) continue;
                var val = ch.getter();
                if (!isNaN(val) && val === ch.expected) {
                    el.classList.add('locked-green'); el.readOnly = true;
                } else {
                    allOk = false;
                    el.classList.add('error-flash');
                    (function(e) { setTimeout(function() { e.classList.remove('error-flash'); e.value=''; }, 350); })(el);
                }
            }
            if (!allOk) {
                if (els.stepFeedback) {
                    els.stepFeedback.innerHTML = 'Algun valor és incorrecte. Revisa els camps en vermell.';
                    els.stepFeedback.className = 'feedback-msg important';
                }
                setTimeout(function() {
                    var first = els.stepSchema.querySelector('input:not([readonly])');
                    if (first) { if (isTouchDevice()) showCustomKeyboard(first); else first.focus(); }
                }, 400);
                return false;
            }
            return true;
        },
        onCorrect: function() {
            var altV = chosenElimVar === 'x' ? 'y' : 'x';
            addExprRow(altV + ' = ' + sumGetters.solAlt, 'result-row');
        },
    });

    // PAS 3 — Back-substitució
    steps.push({
        title: function() {
            var altV = chosenElimVar === 'x' ? 'y' : 'x';
            return 'Substitueix ' + tex(altV + ' = ' + sumGetters.solAlt) + ' a la 1a equació. Quant val ' + tex(chosenElimVar) + '?';
        },
        buildSchema: function(c) {
            buildSchemaRow([chosenElimVar + ' =', { id: 'sol-elim', width: 58 }])(c);
        },
        validate: function() {
            var v = parseNum(document.getElementById('sol-elim') ? document.getElementById('sol-elim').value : '');
            return !isNaN(v) && v === sumGetters.solElim;
        },
        onCorrect: function() {
            addExprRow(chosenElimVar + ' = ' + sumGetters.solElim, 'result-row');
            showResultFinal(p.x0, p.y0);
        },
    });

    return steps;
}

// ── Repte 3: Igualació ──────────────────────────────────
function buildStepsRepte3(p) {
    var steps = [];

    function canIgual(v) {
        var c1 = v === 'x' ? p.a1 : p.b1;
        var c2 = v === 'x' ? p.a2 : p.b2;
        return Math.abs(c1) === 1 && Math.abs(c2) === 1;
    }

    var chosenVar = null;

    function igualData() {
        var varIso = chosenVar, varAlt = varIso === 'x' ? 'y' : 'x';
        var isoC1 = varIso === 'x' ? p.a1 : p.b1;
        var altC1 = varIso === 'x' ? p.b1 : p.a1;
        var isoC2 = varIso === 'x' ? p.a2 : p.b2;
        var altC2 = varIso === 'x' ? p.b2 : p.a2;
        var iso1CoefAlt = -isoC1*altC1, iso1Const = isoC1*p.c1;
        var iso2CoefAlt = -isoC2*altC2, iso2Const = isoC2*p.c2;
        var coefResult = iso1CoefAlt - iso2CoefAlt;
        var constResult = iso2Const - iso1Const;
        var solAlt = varIso === 'x' ? p.y0 : p.x0;
        var solIso = varIso === 'x' ? p.x0 : p.y0;
        return { varIso:varIso, varAlt:varAlt, iso1CoefAlt:iso1CoefAlt, iso1Const:iso1Const,
                 iso2CoefAlt:iso2CoefAlt, iso2Const:iso2Const,
                 coefResult:coefResult, constResult:constResult, solAlt:solAlt, solIso:solIso };
    }

    // PAS 1 — Triar variable
    steps.push({
        title: 'Quina variable aïllaràs a les dues equacions?',
        buildSchema: buildEmpty(),
        hideBtnOk: true,
        buildBtns: buildBtnSelect([
            { html: tex('x'), value: 'x' },
            { html: tex('y'), value: 'y' },
        ]),
        validate: function() {
            if (canIgual(selectedOption)) return true;
            if (els.stepFeedback) {
                els.stepFeedback.innerHTML = 'Aquesta variable no té coef. ±1 a les dues equacions.<br>Tria l\'altra.';
                els.stepFeedback.className = 'feedback-msg important';
            }
            return false;
        },
        onCorrect: function() { chosenVar = selectedOption; },
    });

    // PAS 2 — Aïlla a la 1a eq
    steps.push({
        title: function() { var d = igualData(); return 'Aïlla ' + tex(d.varIso) + ' a la <strong>primera</strong> equació:'; },
        buildSchema: function(c) {
            c.innerHTML = '';
            var d = igualData(), row = document.createElement('div');
            row.className = 'input-row';
            row.appendChild(mkTexSpan(d.varIso + ' ='));
            var siC = mkSignedInput('iso1-coef', 52, d.iso1CoefAlt);
            row.appendChild(siC.btn); row.appendChild(siC.inp);
            row.appendChild(mkTexSpan(d.varAlt));
            var siK = mkSignedInput('iso1-const', 52, d.iso1Const);
            row.appendChild(mkConstGroup(siK));
            c._getVC = siC.getSignedValue; c._getVK = siK.getSignedValue;
            c.appendChild(row);
        },
        validate: function() {
            var d = igualData();
            var vc = els.stepSchema._getVC ? els.stepSchema._getVC() : NaN;
            var vk = els.stepSchema._getVK ? els.stepSchema._getVK() : NaN;
            if (isNaN(vc) || isNaN(vk)) return false;
            return vc === d.iso1CoefAlt && vk === d.iso1Const;
        },
        onCorrect: function() {
            var d = igualData();
            addExprRow(d.varIso + ' = ' + fmtExprTex(d.iso1CoefAlt, d.varAlt, d.iso1Const), 'iso-row', '(1a)');
        },
    });

    // PAS 3 — Aïlla a la 2a eq
    steps.push({
        title: function() { var d = igualData(); return 'Aïlla ' + tex(d.varIso) + ' a la <strong>segona</strong> equació:'; },
        buildSchema: function(c) {
            c.innerHTML = '';
            var d = igualData(), row = document.createElement('div');
            row.className = 'input-row';
            row.appendChild(mkTexSpan(d.varIso + ' ='));
            var siC = mkSignedInput('iso2-coef', 52, d.iso2CoefAlt);
            row.appendChild(siC.btn); row.appendChild(siC.inp);
            row.appendChild(mkTexSpan(d.varAlt));
            var siK = mkSignedInput('iso2-const', 52, d.iso2Const);
            row.appendChild(mkConstGroup(siK));
            c._getVC = siC.getSignedValue; c._getVK = siK.getSignedValue;
            c.appendChild(row);
        },
        validate: function() {
            var d = igualData();
            var vc = els.stepSchema._getVC ? els.stepSchema._getVC() : NaN;
            var vk = els.stepSchema._getVK ? els.stepSchema._getVK() : NaN;
            if (isNaN(vc) || isNaN(vk)) return false;
            return vc === d.iso2CoefAlt && vk === d.iso2Const;
        },
        onCorrect: function() {
            var d = igualData();
            addExprRow(d.varIso + ' = ' + fmtExprTex(d.iso2CoefAlt, d.varAlt, d.iso2Const), 'iso-row', '(2a)');
        },
    });

    // PAS 4 — Equació resultant (coefResult · varAlt = constResult)
    steps.push({
        title: function() { var d = igualData(); return 'Igualem les expressions. Quina equació en ' + tex(d.varAlt) + ' obtens?'; },
        buildSchema: function(c) {
            c.innerHTML = '';
            var d = igualData();

            // Mostrar l'equació igualada: expr1 = expr2
            var eqDisplay = document.createElement('div');
            eqDisplay.style.cssText = 'text-align:center;font-size:1.15em;margin-bottom:14px;opacity:0.55';
            var expr1 = fmtExprTex(d.iso1CoefAlt, d.varAlt, d.iso1Const);
            var expr2 = fmtExprTex(d.iso2CoefAlt, d.varAlt, d.iso2Const);
            katex.render(expr1 + ' = ' + expr2, eqDisplay, { throwOnError: false, displayMode: true });
            c.appendChild(eqDisplay);

            // Inputs per a la forma simplificada: [?]varAlt = [?]
            var row = document.createElement('div');
            row.className = 'input-row';
            var siC = mkSignedInput('eq-coef', 52, d.coefResult);
            var siK = mkSignedInput('eq-const', 52, d.constResult);
            row.appendChild(siC.btn); row.appendChild(siC.inp);
            row.appendChild(mkTexSpan(d.varAlt + ' ='));
            row.appendChild(siK.btn); row.appendChild(siK.inp);
            c._getVC = siC.getSignedValue; c._getVK = siK.getSignedValue;
            c.appendChild(row);
        },
        validate: function() {
            var d = igualData();
            var vc = els.stepSchema._getVC ? els.stepSchema._getVC() : NaN;
            var vk = els.stepSchema._getVK ? els.stepSchema._getVK() : NaN;
            if (isNaN(vc) || isNaN(vk)) return false;
            return vc === d.coefResult && vk === d.constResult;
        },
    });

    // PAS 5 — Valor de varAlt
    steps.push({
        title: function() { return 'Quant val ' + tex(igualData().varAlt) + '?'; },
        buildSchema: function(c) {
            c.innerHTML = '';
            var d = igualData();
            // Mostrar l'equació resultant: coefResult·varAlt = constResult
            var eqDisp = document.createElement('div');
            eqDisp.style.cssText = 'text-align:center;font-size:1.15em;margin-bottom:14px;opacity:0.55';
            katex.render(d.coefResult + d.varAlt + ' = ' + d.constResult, eqDisp, { throwOnError: false, displayMode: true });
            c.appendChild(eqDisp);
            // Input: varAlt = ?
            var row = document.createElement('div');
            row.className = 'input-row';
            row.appendChild(mkTexSpan(d.varAlt + ' ='));
            row.appendChild(mkInput('sol-alt', 58));
            c.appendChild(row);
        },
        validate: function() {
            var d = igualData();
            var v = parseNum(document.getElementById('sol-alt') ? document.getElementById('sol-alt').value : '');
            return !isNaN(v) && v === d.solAlt;
        },
        onCorrect: function() { var d = igualData(); addExprRow(d.varAlt + ' = ' + d.solAlt, 'result-row'); },
    });

    // PAS 6 — Valor de varIso
    steps.push({
        title: function() {
            var d = igualData();
            return 'Substitueix ' + tex(d.varAlt + ' = ' + d.solAlt) + '. Quant val ' + tex(d.varIso) + '?';
        },
        buildSchema: function(c) { var d = igualData(); buildSchemaRow([d.varIso + ' =', { id: 'sol-iso', width: 58 }])(c); },
        validate: function() {
            var d = igualData();
            var v = parseNum(document.getElementById('sol-iso') ? document.getElementById('sol-iso').value : '');
            return !isNaN(v) && v === d.solIso;
        },
        onCorrect: function() { var d = igualData(); addExprRow(d.varIso + ' = ' + d.solIso, 'result-row'); showResultFinal(p.x0, p.y0); },
    });

    return steps;
}

// ══════════════════════════════════════════════════════════
// FLUX DE PASSOS
// ══════════════════════════════════════════════════════════

function showCurrentStep() {
    isTransitioning = false;   // Reset: l'alumne pot interactuar amb el nou pas
    var step = currentSteps[currentStepIdx];

    // Feedback
    if (els.stepFeedback) {
        els.stepFeedback.innerText = '';
        els.stepFeedback.className = 'feedback-msg';
    }

    // Títol
    els.stepTitle.innerHTML = typeof step.title === 'function' ? step.title() : step.title;

    // Schema
    els.stepSchema.style.display = '';
    els.stepBtns.innerHTML = '';
    step.buildSchema(els.stepSchema);

    // Botons
    if (step.buildBtns) step.buildBtns(els.stepBtns);

    // Botó OK
    els.btnSubmitStep.style.display = step.hideBtnOk ? 'none' : '';

    // Mostrar pas
    els.currentStep.classList.add('active');
    els.resolutionPanel.style.display = 'flex';

    // Progress bar i badge
    updateProgressBar(currentStepIdx, currentSteps.length);
    updateMethodBadge();

    // Focus al primer input
    setTimeout(function() {
        var first = els.stepSchema.querySelector('input:not([readonly])');
        if (first) {
            if (isTouchDevice()) { showCustomKeyboard(first); }
            else { first.focus(); }
        }
    }, 120);
}

function flashError() {
    els.stepSchema.querySelectorAll('input').forEach(function(inp) {
        inp.classList.add('error-flash');
        setTimeout(function() { inp.classList.remove('error-flash'); }, 300);
    });
    els.stepBtns.querySelectorAll('.eq-pill.selected').forEach(function(btn) {
        btn.classList.add('error-flash');
        setTimeout(function() { btn.classList.remove('error-flash'); }, 300);
    });
    els.btnSubmitStep.classList.add('error-shake');
    setTimeout(function() { els.btnSubmitStep.classList.remove('error-shake'); }, 300);
}

function clearAndFocus() {
    var allInputs = [].slice.call(els.stepSchema.querySelectorAll('input'));
    allInputs.forEach(function(inp) {
        if (!inp.readOnly) {
            inp.value = '';
            inp.style.color = ''; inp.style.borderColor = '';
            inp.style.background = ''; inp.style.fontWeight = '';
        }
    });
    var first = allInputs.find(function(i) { return !i.readOnly; }) || null;
    if (first) {
        if (isTouchDevice()) { kbMarkForOverwrite(first); showCustomKeyboard(first); }
        else { first.focus(); }
    }
    els.stepBtns.querySelectorAll('.eq-pill').forEach(function(b) { b.classList.remove('selected'); });
    selectedOption = null;
}

function checkStep() {
    if (isTransitioning || isPenalizing) return;
    var step = currentSteps[currentStepIdx];

    if (els.stepFeedback) {
        els.stepFeedback.innerText = '';
        els.stepFeedback.className = 'feedback-msg';
    }
    var res = step.validate();

    if (res !== true) {
        var hasSoftWarning = els.stepFeedback && els.stepFeedback.innerText !== '';
        if (!hasSoftWarning) {
            stepPoints = Math.max(0, stepPoints - 2);
            els.scoreDisplay.innerText = 'Punts: ' + stepPoints;

            if (stepPoints === 0) {
                // Intents esgotats: bloquejem interacció, mostrem solució i passem endavant
                isPenalizing = true;
                flashError();
                if (els.stepFeedback) {
                    els.stepFeedback.innerHTML =
                        'Intents esgotats. La solució del sistema és: ' +
                        '<strong>x&nbsp;=&nbsp;' + currentProblem.x0 +
                        ',&nbsp; y&nbsp;=&nbsp;' + currentProblem.y0 + '</strong>';
                    els.stepFeedback.className = 'feedback-msg error';
                }
                setTimeout(function() {
                    isPenalizing = false;
                    finalizeProblem(0);
                }, 2500);
                return;
            }

            flashError();
            clearAndFocus();
        }
        return;
    }

    if (step.onCorrect) step.onCorrect();
    currentStepIdx++;

    if (currentStepIdx >= currentSteps.length) {
        finalizeProblem();
    } else {
        setTimeout(function() { showCurrentStep(); }, step.onCorrect ? 600 : 0);
    }
}

// ══════════════════════════════════════════════════════════
// FLUX DEL JOC
// ══════════════════════════════════════════════════════════

function showCorrectAnswer(p) {
    renderSistema(p);
    showResultFinal(p.x0, p.y0);
}

function penalize() { /* Desactivat en aquesta activitat */ }

function finalizeProblem(forcedPoints) {
    if (forcedPoints === undefined) forcedPoints = null;
    recordResult(forcedPoints === 0 ? 4 : Math.min(MAX_INTENTS - attemptsLeft + 1, 3));
    isTransitioning = true;
    hideCustomKeyboard();
    els.currentStep.classList.remove('active');
    els.resolutionPanel.style.display = 'none';

    var pts = forcedPoints !== null ? forcedPoints : stepPoints;
    if (pts === 0) showCorrectAnswer(currentProblem);

    sessionScore += pts;

    var waitTime = showMiniOverlay(pts);
    setTimeout(function() {
        hideMiniOverlay();
        if (currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            currentOperation++;
            buildLevel();
        }
    }, waitTime);
}

function selectRepte(n) {
    selectedRepte = n;
    startGame();
}

function updateUI() {
    els.sessionDisplay.innerText = 'Sessió ' + (currentSession + 1) + ' de ' + TOTAL_SESSIONS;
    els.lvlDisplay.innerText = 'Exercici ' + (currentOperation + 1) + ' de ' + TOTAL_OPERATIONS;
    els.scoreDisplay.innerText = 'Punts: ' + stepPoints;
}

function buildLevel() {
    var p, key;

    // Comprova si un problema és matemàticament vàlid per al mètode escollit,
    // independentment del tipus amb el qual va ser generat.
    // - Reducció: sempre vàlid (qualsevol sistema lineal admet reducció).
    // - Substitució: cal almenys una variable amb coef ±1 en alguna equació.
    // - Igualació: cal una variable amb coef ±1 a les dues equacions alhora.
    function validPerMetode(prob, repte) {
        if (repte === 2) return true;
        if (repte === 1) {
            return Math.abs(prob.a1) === 1 || Math.abs(prob.b1) === 1 ||
                   Math.abs(prob.a2) === 1 || Math.abs(prob.b2) === 1;
        }
        if (repte === 3) {
            var xOk = Math.abs(prob.a1) === 1 && Math.abs(prob.a2) === 1;
            var yOk = Math.abs(prob.b1) === 1 && Math.abs(prob.b2) === 1;
            return xOk || yOk;
        }
        return false;
    }

    // Primer exercici: reutilitzar el preview si és matemàticament compatible
    // amb el mètode triat per l'alumne.
    if (currentOperation === 0 && currentSession === 0 &&
        previewProblem && validPerMetode(previewProblem, selectedRepte)) {
        p = previewProblem;
    } else {
        var tries = 0;
        do {
            p = selectedRepte === 1 ? genRepte1(currentOperation)
              : selectedRepte === 2 ? genRepte2(currentOperation)
              :                       genRepte3(currentOperation);
            key = JSON.stringify({ t: p.type, x: p.x0, y: p.y0, a1: p.a1, b1: p.b1 });
            tries++;
        } while (usedProblems.has(key) && tries < 30);
    }
    previewProblem = null;
    key = JSON.stringify({ t: p.type, x: p.x0, y: p.y0, a1: p.a1, b1: p.b1 });
    usedProblems.add(key);
    currentProblem = p;
    stepPoints = 10;  // reinicia els punts per a aquest problema

    renderSistema(p);

    currentSteps = selectedRepte === 1 ? buildStepsRepte1(p)
                 : selectedRepte === 2 ? buildStepsRepte2(p)
                 :                       buildStepsRepte3(p);
    currentStepIdx = 0;
    showCurrentStep();
    updateUI();
}

// ══════════════════════════════════════════════════════════
// TECLAT I INICIALITZACIÓ
// ══════════════════════════════════════════════════════════

/**
 * Hook cridat per game-core.js quan l'alumne prem la tecla "→" del teclat custom.
 * Si hi ha una casella activa i n'hi ha una altra de disponible a continuació,
 * hi passa el focus. Si ja és l'última casella, valida el pas (equivalent a OK).
 *
 * BUG FIX: showCustomKeyboard() posa `readonly` a l'input actiu per suprimir
 * el teclat natiu del mòbil. Això feia que:
 *   - La query :not([readonly]) exclogués l'input actiu → currIdx = -1 sempre
 *   - Els validadors saltessin els inputs amb readOnly → allOk = true sempre
 * Solució:
 *   1. Fer la query sobre TOTS els inputs, excloent només .locked-green
 *      (els que ja han estat validats correctament i no s'han de re-editar).
 *   2. Treure `readonly` i `inputmode` de l'input actiu ABANS de moure el focus,
 *      perquè el validador el pugui llegir correctament.
 */
function checkCurrentCell() {
    var inputs = [].slice.call(
        els.stepSchema.querySelectorAll('input:not(.locked-green)')
    );
    if (!inputs.length) return;

    var active  = els.stepSchema.querySelector('.kb-active-input');
    var currIdx = active ? inputs.indexOf(active) : -1;

    // Restaurar l'input actiu a no-readonly perquè el validador el pugui llegir
    if (active) {
        active.removeAttribute('readonly');
        active.removeAttribute('inputmode');
    }

    var nextIdx = currIdx + 1;
    if (nextIdx < inputs.length) {
        showCustomKeyboard(inputs[nextIdx]);
    } else {
        checkStep();
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (els.gameScreen.style.display !== 'none' &&
            els.resolutionPanel.style.display !== 'none') {
            e.preventDefault();
            if (!isTransitioning && !isPenalizing) checkStep();
        }
    }
    // [FIX M3] Tab salta al següent input dins del pas actiu
    if (e.key === 'Tab') {
        if (els.gameScreen.style.display === 'none' ||
            els.resolutionPanel.style.display === 'none') return;
        var inputs = Array.from(els.stepSchema.querySelectorAll('input:not([readonly])'))
                         .filter(function(inp) { return inp.offsetParent !== null; });
        if (inputs.length <= 1) return;
        var idx = inputs.indexOf(document.activeElement);
        if (idx === -1) return;
        var next = e.shiftKey
            ? inputs[(idx - 1 + inputs.length) % inputs.length]
            : inputs[(idx + 1) % inputs.length];
        e.preventDefault();
        if (typeof isTouchDevice === 'function' && isTouchDevice()) showCustomKeyboard(next); else next.focus();
    }
});

validateConfig();
injectSharedHTML();
initCustomKeyboard({ allowNegative: true });
registerScreens(['selection-screen', 'game-screen', 'session-end-screen', 'final-screen']);

// Routing per paràmetre ?metode=substitucio|reduccio|igualacio
var metodeParam = (urlParams.get('metode') || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

if (metodeParam === 'substitucio') {
    selectRepte(1);
} else if (metodeParam === 'reduccio') {
    selectRepte(2);
} else if (metodeParam === 'igualacio') {
    selectRepte(3);
} else {
    // El preview es genera amb genRepte3 perquè és la restricció més dura:
    // garanteix coef ±1 en la mateixa variable a les dues equacions (igualació).
    // Això implica automàticament que el sistema també és vàlid per a
    // substitució (hi ha ±1 aïllable) i reducció (sempre vàlid).
    previewProblem = genRepte3(0);
    renderSistemaTo(previewProblem, document.getElementById('preview-expression-box'));
    showScreen('selection-screen');
}
