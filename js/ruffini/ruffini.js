/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/ruffini/ruffini.js
 * ROL: Joc «Regla de Ruffini» (ruffini.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa fixed-sessions.js.
 * ============================================================================
 */

import { FixedSessions } from '../fixed-sessions.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { initApp });

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS DE TEMPS  —  modifica aquí, no cal tocar res més al codi
// ════════════════════════════════════════════════════════════════════════════
//
const DEBUG = 0; // 1 = mostra la caixa DEBUG amb les arrels reals; 0 = oculta
//
//  JS (mil·lisegons):
const T_AUTOFILL_DELAY = 300; // retard abans d'autoompletar la 1a cel·la
const T_CELL_CONFIRM_NEXT = 400; // retard entre cel·la correcta i la següent
const T_ROOT_FOUND_DELAY = 500; // retard entre residu=0 i missatge "arrel"
const T_REJECT_DELAY = 500; // retard entre residu≠0 i missatge rebuig
const T_FOCUS_DELAY = 50; // retard per donar focus a l'input (PC)
const T_ATTRACT_INIT = 50; // retard inicial del blink-shake candidats
const T_ROOT_MSG_VISIBLE = 5000; // temps visible del missatge "Hem trobat..."
const T_FADE_OUT_WAIT = 1000; // espera fins avançar després del fade-out
const T_SCROLL_DELAY = 150; // retard abans del scroll al resultat final
//
//  CSS (edita les variables --t-* al bloc :root de l'estil):
//    --t-anim-pop      pop-in de cada cel·la confirmada
//    --t-anim-shake    shake d'una cel·la incorrecta
//    --t-anim-flash    flash verd→blanc quan residu = 0
//    --t-attract-dur   durada del blink-shake dels candidats
//    --t-fade-out      durada del fade-out del missatge "Hem trobat..."
//                      (T_FADE_OUT_WAIT ha de ser ≥ --t-fade-out en ms)
//
// ════════════════════════════════════════════════════════════════════════════

// ─── ESTAT GLOBAL ────────────────────────────────────────────────────────
let poly = [];
let polyOrig = [];
let degree = 3;
let roots = [];
let currentR = null;
let stepIdx = 0;
let results = [];
let triedWrong = new Set();
let finished = false;
let divIdx = 0;
let debugRoots = [];
let errorCount = 0; // comptador d'errors de l'exercici
let continueAutoTimer = null; // [ROUND 2 — ref global al timer de showContinue, per cancel·lar-lo des de selectCandidate]

// ─── GENERACIÓ DEL POLINOMI ──────────────────────────────────────────────
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickConstantTermAbs(monic) {
    const r = Math.random();
    let pool;
    if (r < 0.2) pool = [2, 3, 5, 7, 11, 13, 17, 19];
    else if (r < 0.7) pool = [4, 6, 9, 10, 14, 15];
    else pool = [8, 12, 18, 20];
    if (!monic) pool = pool.filter(x => x % 2 === 0);
    if (pool.length === 0) return pickConstantTermAbs(monic);
    return pool[Math.floor(Math.random() * pool.length)];
}

function factorizeInto(n, parts) {
    if (parts === 1) return [n];
    const divs = [];
    for (let d = 1; d <= n; d++) {
        if (n % d === 0) divs.push(d);
    }
    const d = divs[Math.floor(Math.random() * divs.length)];
    return [d, ...factorizeInto(n / d, parts - 1)];
}

function assignSigns(factors, wantPositiveProduct) {
    const result = factors.map(f => (Math.random() < 0.5 ? f : -f));
    const prod = result.reduce((a, b) => a * b, 1);
    if (prod > 0 !== wantPositiveProduct) result[0] = -result[0];
    return result;
}

function generatePoly() {
    degree = parseInt(document.getElementById('degreeSelect').value);
    const monic = document.getElementById('monicSelect').value === 'monic';
    const lead = monic ? 1 : Math.random() < 0.5 ? 2 : -2;

    let chosenRoots;
    const zeroMode = Math.random() < 0.2;

    if (zeroMode && degree === 3) {
        const a = randInt(1, 4) * (Math.random() < 0.5 ? 1 : -1);
        const b = randInt(1, 4) * (Math.random() < 0.5 ? 1 : -1);
        const c = -(a + b);
        if (c === 0) return generatePoly();
        chosenRoots = [a, b, c];
    } else if (zeroMode && degree === 4) {
        const a = randInt(1, 4);
        const b = randInt(1, 4);
        if (a === b) return generatePoly();
        chosenRoots = [a, -a, b, -b];
    } else {
        const ctAbs = pickConstantTermAbs(monic);
        const targetCt = (Math.random() < 0.5 ? 1 : -1) * ctAbs;
        const divisor = lead * Math.pow(-1, degree);
        const rootsProd = targetCt / divisor;
        if (!Number.isInteger(rootsProd) || rootsProd === 0) return generatePoly();
        const factors = factorizeInto(Math.abs(rootsProd), degree);
        chosenRoots = assignSigns(factors, rootsProd > 0);
    }

    let coeffs = [lead];
    for (const r of chosenRoots) {
        const newC = new Array(coeffs.length + 1).fill(0);
        for (let i = 0; i < coeffs.length; i++) {
            newC[i] += coeffs[i];
            newC[i + 1] -= r * coeffs[i];
        }
        coeffs = newC;
    }

    const ct = coeffs[coeffs.length - 1];
    const intermediate = coeffs.slice(1, -1);
    const ctOk = Math.abs(ct) >= 1 && Math.abs(ct) <= 20;
    const interOk = intermediate.every(c => Math.abs(c) <= 9);
    if (!ctOk || !interOk) return generatePoly();

    polyOrig = [...coeffs];
    poly = [...coeffs];
    debugRoots = [...chosenRoots].sort((a, b) => a - b);
    roots = [];
    triedWrong.clear();
    finished = false;
}

// ─── DIVISORS ────────────────────────────────────────────────────────────
function getDivisors(n) {
    n = Math.abs(n);
    if (n === 0) return [];
    let divs = [];
    for (let i = 1; i <= n; i++) {
        if (n % i === 0) {
            divs.push(i);
            divs.push(-i);
        }
    }
    return [...new Set(divs)].sort((a, b) => a - b);
}

function candidatesForCurrentPoly() {
    const constantTerm = poly[poly.length - 1];
    const leadCoef = poly[0];
    let cands = new Set();

    if (constantTerm === 0) {
        cands.add(0);
        let nonZeroTerm = 0;
        for (let i = poly.length - 2; i >= 0; i--) {
            if (poly[i] !== 0) {
                nonZeroTerm = poly[i];
                break;
            }
        }
        if (nonZeroTerm !== 0) {
            const divNZ = getDivisors(nonZeroTerm);
            const divLead = getDivisors(Math.abs(leadCoef));
            for (const p of divNZ) for (const q of divLead) if (q !== 0 && Number.isInteger(p / q)) cands.add(p / q);
        }
    } else {
        const divConst = getDivisors(constantTerm);
        const divLead = getDivisors(Math.abs(leadCoef));
        for (const p of divConst) for (const q of divLead) if (q !== 0 && Number.isInteger(p / q)) cands.add(p / q);
    }
    return [...cands].sort((a, b) => a - b);
}

// ─── RENDERITZAR POLINOMI ────────────────────────────────────────────────
function polyToHTML(coeffs) {
    const n = coeffs.length - 1;
    let parts = [];
    for (let i = 0; i <= n; i++) {
        const exp = n - i;
        const c = coeffs[i];
        if (c === 0) continue;
        const absC = Math.abs(c);
        const sign = c > 0 ? (parts.length === 0 ? '' : ' + ') : parts.length === 0 ? '−' : ' − ';
        const cs = absC === 1 && exp > 0 ? '' : String(absC);
        let term;
        if (exp === 0) term = sign + String(absC);
        else if (exp === 1) term = sign + cs + 'x';
        else term = sign + cs + 'x<sup>' + exp + '</sup>';
        parts.push(term);
    }
    return 'p(x) = ' + (parts.join('') || '0');
}

// ─── INICIALITZAR ────────────────────────────────────────────────────────
function initApp() {
    // Sessions fixes: la llavor es posa aquí i no dins generatePoly(), que es crida
    // a si mateixa quan descarta un polinomi (amb la mateixa llavor no acabaria mai).
    FixedSessions?.next(
        'g' + document.getElementById('degreeSelect').value + document.getElementById('monicSelect').value
    );
    generatePoly();
    renderUI();
}

function renderUI() {
    document.getElementById('polyDisplay').innerHTML = polyToHTML(poly);
    renderDebug();
    renderHint();
    renderCandidates();
    document.getElementById('ruffiniTable').innerHTML = '';
    document.getElementById('rootFoundMsg').innerHTML = '';
    document.getElementById('feedback').innerText = '';
    document.getElementById('actionArea').innerHTML = '';
    document.getElementById('resultBox').innerHTML = '';
    document.getElementById('nextStepSlot').innerHTML = '';
    errorCount = 0;
    updateErrorsBtn();
    currentR = null;
    stepIdx = 0;
    results = [];
    divIdx = 0;
}

function renderDebug() {
    const box = document.getElementById('debugBox');
    if (!DEBUG) {
        box.style.display = 'none';
        return;
    }
    box.style.display = '';
    const s = debugRoots.map(r => `x = ${r}`).join(',  ');
    box.innerHTML = `🐛 <strong>DEBUG — Arrels:</strong>  ${s}`;
}

function updateErrorsBtn(done = false) {
    const btn = document.getElementById('errorsBtn');
    const count = document.getElementById('errorsCount');
    count.textContent = errorCount;
    btn.classList.toggle('finished', done);
}

function renderHint() {
    const ct = poly[poly.length - 1];
    const lc = poly[0];
    let html;
    if (ct === 0) {
        html = `El terme independent és <strong>0</strong>, per tant <strong>r = 0</strong> és arrel segura. Els altres candidats venen dels divisors del primer terme no nul.`;
    } else {
        const divs = getDivisors(ct)
            .filter(d => d > 0)
            .join(', ');
        html = `Els divisors del terme independent són: ± {${divs}}`;
        if (Math.abs(lc) !== 1) html += ` (dividits pels de <strong>${lc}</strong>)`;
    }
    document.getElementById('hintBox').innerHTML = html;
}

function renderCandidates() {
    const row = document.getElementById('candidatesRow');
    const cands = candidatesForCurrentPoly();
    row.innerHTML = '';

    const positives = cands.filter(r => r >= 0).sort((a, b) => a - b);
    const negatives = cands.filter(r => r < 0).sort((a, b) => a - b);
    const absVals = positives.map(r => r);
    negatives.forEach(r => {
        if (!absVals.includes(Math.abs(r))) absVals.push(Math.abs(r));
    });
    absVals.sort((a, b) => a - b);

    const grid = document.createElement('div');
    grid.className = 'candidates-grid';
    grid.style.gridTemplateColumns = `repeat(${absVals.length}, auto)`;

    // Fila superior: negatius
    absVals.forEach(abs => {
        const r = abs === 0 ? null : -abs;
        const btn = document.createElement('button');
        btn.className = 'btn-candidate';
        if (r === null || !negatives.includes(r)) {
            btn.style.visibility = 'hidden';
            btn.disabled = true;
        } else {
            btn.textContent = String(r);
            btn.dataset.val = r;
            if (triedWrong.has(r)) btn.classList.add('tried-wrong');
            btn.addEventListener('click', () => selectCandidate(r, btn));
        }
        grid.appendChild(btn);
    });

    // Fila inferior: positius
    absVals.forEach(abs => {
        const btn = document.createElement('button');
        btn.className = 'btn-candidate';
        if (!positives.includes(abs)) {
            btn.style.visibility = 'hidden';
            btn.disabled = true;
        } else {
            btn.textContent = '+' + abs;
            btn.dataset.val = abs;
            if (triedWrong.has(abs)) btn.classList.add('tried-wrong');
            btn.addEventListener('click', () => selectCandidate(abs, btn));
        }
        grid.appendChild(btn);
    });

    row.appendChild(grid);
    setTimeout(() => triggerCandidatesAttract(), T_ATTRACT_INIT);
}

function triggerCandidatesAttract() {
    const row = document.getElementById('candidatesRow');
    row.classList.remove('candidates-attract');
    void row.offsetWidth;
    row.classList.add('candidates-attract');
    row.addEventListener('animationend', () => row.classList.remove('candidates-attract'), { once: true });
}

function clearCurrentAttempt() {
    const table = document.getElementById('ruffiniTable');
    const n = divIdx === 0 ? 3 : 2;
    for (let i = 0; i < n && table.rows.length > 0; i++) table.deleteRow(table.rows.length - 1);
}

// ─── SELECCIÓ D'UN CANDIDAT ──────────────────────────────────────────────
function selectCandidate(r, btnClicked) {
    if (finished) return;
    // [ROUND 2 — cancel·lem el timer d'auto-avanç per evitar la race condition]
    if (continueAutoTimer !== null) {
        clearTimeout(continueAutoTimer);
        continueAutoTimer = null;
    }
    document.getElementById('nextStepSlot').innerHTML = '';
    if (currentR !== null) clearCurrentAttempt();
    document.querySelectorAll('.btn-candidate').forEach(b => {
        if (!b.classList.contains('tried-wrong')) b.classList.remove('active');
    });
    btnClicked.classList.add('active');
    currentR = r;
    stepIdx = 0;
    results = [];
    document.getElementById('feedback').innerText = '';
    document.getElementById('actionArea').innerHTML = '';
    buildTable(r);
}

// ─── CONSTRUIR / AFEGIR FILES RUFFINI ───────────────────────────────────
function buildTable(r) {
    const table = document.getElementById('ruffiniTable');
    const n = poly.length;

    if (divIdx === 0) {
        table.innerHTML = '';
        const row1 = table.insertRow();
        const tdRoot = row1.insertCell();
        tdRoot.className = 'cell-root';
        tdRoot.rowSpan = 2;
        tdRoot.style.verticalAlign = 'bottom';
        tdRoot.style.paddingBottom = '4px';
        tdRoot.innerHTML = r >= 0 ? '+' + r : '' + r;
        for (let j = 0; j < n; j++) {
            const td = row1.insertCell();
            td.className = 'cell-coef';
            td.id = `coef-${divIdx}-${j}`;
            td.innerHTML = formatNum(poly[j]);
        }
        const row2 = table.insertRow();
        for (let j = 0; j < n; j++) {
            const td = row2.insertCell();
            td.className = 'cell-prod';
            td.id = `prod-${divIdx}-${j}`;
            td.innerHTML = '&nbsp;';
        }
        const row3 = table.insertRow();
        row3.classList.add('row-divider');
        const tdBlank = row3.insertCell();
        tdBlank.className = 'cell-root';
        tdBlank.style.borderRight = '3px solid #1e293b';
        tdBlank.style.borderTop = '2.5px solid #1e293b';
        for (let j = 0; j < n; j++) {
            const td = row3.insertCell();
            td.className = j === n - 1 ? 'cell-result cell-remainder' : 'cell-result';
            td.id = `res-${divIdx}-${j}`;
            td.appendChild(makeInput(divIdx, j));
        }
    } else {
        const row2 = table.insertRow();
        const tdRoot = row2.insertCell();
        tdRoot.className = 'cell-root';
        tdRoot.rowSpan = 2;
        tdRoot.style.verticalAlign = 'top';
        tdRoot.style.paddingTop = '10px';
        tdRoot.innerHTML = r >= 0 ? '+' + r : '' + r;
        tdRoot.style.borderRight = '3px solid #1e293b';
        for (let j = 0; j < n; j++) {
            const td = row2.insertCell();
            td.className = 'cell-prod';
            td.id = `prod-${divIdx}-${j}`;
            td.innerHTML = '&nbsp;';
        }
        const row3 = table.insertRow();
        row3.classList.add('row-divider');
        for (let j = 0; j < n; j++) {
            const td = row3.insertCell();
            td.className = j === n - 1 ? 'cell-result cell-remainder' : 'cell-result';
            td.id = `res-${divIdx}-${j}`;
            td.appendChild(makeInput(divIdx, j));
        }
    }

    setTimeout(() => autoFillFirst(), T_AUTOFILL_DELAY);
}

// ─── DETECCIÓ TÀCTIL ─────────────────────────────────────────────────────
const isTouchDevice = () => window.matchMedia('(pointer: coarse) and (hover: none)').matches;

function makeInput(dIdx, j) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.inputMode = isTouchDevice() ? 'none' : 'numeric';
    inp.className = 'cell-input';
    inp.id = `inp-${dIdx}-${j}`;
    inp.disabled = true;
    inp.setAttribute('autocomplete', 'off');
    inp.setAttribute('readonly', isTouchDevice());
    return inp;
}

function autoFillFirst() {
    const inp = document.getElementById(`inp-${divIdx}-0`);
    inp.value = poly[0];
    inp.disabled = true;
    inp.classList.add('confirmed', 'anim-pop');
    results.push(poly[0]);
    stepIdx = 1;
    activateNextCell();
}

function activateNextCell() {
    if (stepIdx >= poly.length) return;

    const prod = currentR * results[stepIdx - 1];
    const prodCell = document.getElementById(`prod-${divIdx}-${stepIdx}`);
    prodCell.innerHTML = `<em>${formatNum(prod)}</em>`;
    prodCell.classList.add('anim-pop');

    const inp = document.getElementById(`inp-${divIdx}-${stepIdx}`);
    inp.disabled = false;
    inp.removeAttribute('readonly');
    inp.value = '';
    inp.classList.remove('confirmed', 'confirmed-root', 'anim-pop', 'kb-selected');
    kbClearOnNext = false;

    if (isTouchDevice()) {
        inp.setAttribute('readonly', true);
        showCustomKeyboard(inp);
    } else {
        inp.addEventListener('keydown', onKeyDown);
        setTimeout(() => inp.focus(), T_FOCUS_DELAY);
    }
    document.getElementById('actionArea').innerHTML = '';
}

function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        checkCurrentCell();
    }
}

// ─── TECLAT CUSTOM ───────────────────────────────────────────────────────
let activeKbInput = null;
let kbClearOnNext = false; // quan true, el proper dígit sobreescriu el valor (simula "tot seleccionat")

function showCustomKeyboard(inp) {
    activeKbInput = inp;
    document.getElementById('customKeyboard').classList.add('kb-visible');
    inp.focus();
    // Scroll suau per assegurar que la cel·la activa és visible per sobre del teclat
    setTimeout(() => inp.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

function hideCustomKeyboard() {
    document.getElementById('customKeyboard').classList.remove('kb-visible');
    activeKbInput = null;
}

function initCustomKeyboard() {
    document.querySelectorAll('#customKeyboard .kb-btn').forEach(btn => {
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (!activeKbInput) return;
            const key = btn.dataset.key;
            if (key === 'del') {
                kbClearOnNext = false;
                activeKbInput.classList.remove('kb-selected');
                activeKbInput.value = activeKbInput.value.slice(0, -1);
            } else if (key === 'enter') {
                checkCurrentCell();
            } else if (key === '-') {
                kbClearOnNext = false;
                activeKbInput.classList.remove('kb-selected');
                if (activeKbInput.value === '' || activeKbInput.value === '-')
                    activeKbInput.value = activeKbInput.value === '-' ? '' : '-';
            } else {
                // Dígit
                if (kbClearOnNext) {
                    activeKbInput.value = '';
                    kbClearOnNext = false;
                    activeKbInput.classList.remove('kb-selected');
                }
                if (activeKbInput.value === '-0') activeKbInput.value = '-';
                activeKbInput.value += key;
            }
        });
    });
}

// ─── COMPROVACIÓ D'UNA CEL·LA ────────────────────────────────────────────
function checkCurrentCell() {
    const inp = document.getElementById(`inp-${divIdx}-${stepIdx}`);
    const fb = document.getElementById('feedback');
    const entered = parseInt(inp.value, 10);
    const expected = poly[stepIdx] + currentR * results[stepIdx - 1];

    if (isNaN(entered)) {
        fb.style.color = 'var(--warning)';
        fb.innerText = '⚠️ Escriu un número.';
        return;
    }
    if (entered !== expected) {
        fb.style.color = 'var(--danger)';
        fb.innerText = '❌ No és correcte. Torna-ho a intentar.';
        inp.classList.remove('anim-shake');
        void inp.offsetWidth;
        inp.classList.add('anim-shake');
        errorCount++;
        updateErrorsBtn();
        if (isTouchDevice()) {
            kbClearOnNext = true;
            inp.classList.add('kb-selected');
        } else {
            inp.select();
        }
        return;
    }

    fb.innerText = '';
    results.push(expected);
    inp.removeEventListener('keydown', onKeyDown);
    inp.disabled = true;

    const isLast = stepIdx === poly.length - 1;
    const isZero = expected === 0;

    if (isLast && isZero) {
        hideCustomKeyboard();
        inp.classList.add('confirmed', 'confirmed-root', 'anim-flash');
        setTimeout(() => confirmRootFound(), T_ROOT_FOUND_DELAY);
    } else if (isLast && !isZero) {
        hideCustomKeyboard();
        inp.classList.add('confirmed', 'anim-flash');
        setTimeout(() => rejectCandidate(), T_REJECT_DELAY);
    } else {
        inp.classList.add('confirmed', 'anim-flash');
        stepIdx++;
        setTimeout(() => activateNextCell(), T_CELL_CONFIRM_NEXT);
    }
}

// ─── ARREL TROBADA ───────────────────────────────────────────────────────
function confirmRootFound() {
    const fb = document.getElementById('rootFoundMsg');
    fb.style.color = 'var(--success)';
    fb.innerHTML = `✅ Hem trobat una arrel del polinomi, que és a = ${currentR}.`;

    roots.push(currentR);
    poly = results.slice(0, results.length - 1);

    document.querySelectorAll('.btn-candidate').forEach(b => {
        if (parseInt(b.dataset.val) === currentR) {
            b.disabled = true;
            b.classList.remove('active');
            b.style.background = '#f1f5f9';
            b.style.borderColor = '#cbd5e1';
            b.style.color = '#64748b';
        }
    });

    if (poly.length <= 1) {
        showFinalResult();
        return;
    }
    showContinue();
}

function showContinue() {
    const slot = document.getElementById('nextStepSlot');
    const msg = document.getElementById('rootFoundMsg');
    slot.innerHTML = '';

    const advance = () => {
        // [ROUND 1 — triedWrong NO s'esborra: si r no era arrel de p(x), tampoc pot ser-ho del quocient]
        currentR = null;
        stepIdx = 0;
        results = [];
        divIdx++;
        document.getElementById('feedback').innerText = '';
        msg.innerHTML = '';
        msg.classList.remove('fade-out');
        document.getElementById('actionArea').innerHTML = '';
        slot.innerHTML = '';
        renderHint();
        renderCandidates();
    };

    const btn = document.createElement('button');
    btn.className = 'btn-check-sm';
    btn.textContent = 'Següent pas';
    // [ROUND 2 — usa continueAutoTimer global perquè selectCandidate també el pugui cancel·lar]
    btn.onclick = () => {
        clearTimeout(continueAutoTimer);
        continueAutoTimer = null;
        advance();
    };
    slot.appendChild(btn);
    document.getElementById('actionArea').innerHTML = '';

    continueAutoTimer = setTimeout(() => {
        msg.classList.add('fade-out');
        setTimeout(() => advance(), T_FADE_OUT_WAIT);
    }, T_ROOT_MSG_VISIBLE);
}

// ─── CANDIDAT DESCARTAT ──────────────────────────────────────────────────
function rejectCandidate() {
    hideCustomKeyboard();
    const fb = document.getElementById('feedback');
    const remainder = results[results.length - 1];
    fb.style.color = 'var(--danger)';
    fb.innerHTML = `❌ Residu = ${remainder} ≠ 0. Per tant, a = ${currentR} no és arrel.`;

    triedWrong.add(currentR);
    document.querySelectorAll('.btn-candidate').forEach(b => {
        if (parseInt(b.dataset.val) === currentR) {
            b.classList.add('tried-wrong');
            b.classList.remove('active');
        }
    });

    const slot = document.getElementById('nextStepSlot');
    slot.innerHTML = '';
    document.getElementById('actionArea').innerHTML = '';

    const dismiss = () => {
        clearCurrentAttempt();
        fb.classList.remove('fade-out');
        fb.innerText = '';
        slot.innerHTML = '';
        currentR = null;
        // blink-shake igual que quan arriba un candidat nou
        triggerCandidatesAttract();
    };

    const btn = document.createElement('button');
    btn.className = 'btn-check-sm';
    btn.textContent = 'Escull un altre valor';
    btn.onclick = () => {
        clearTimeout(autoTimer);
        dismiss();
    };
    slot.appendChild(btn);

    const autoTimer = setTimeout(() => {
        fb.classList.add('fade-out');
        setTimeout(() => dismiss(), T_FADE_OUT_WAIT);
    }, T_ROOT_MSG_VISIBLE);
}

// ─── RESULTAT FINAL ──────────────────────────────────────────────────────
function showFinalResult() {
    finished = true;
    document.getElementById('actionArea').innerHTML = '';
    updateErrorsBtn(true); // torna el botó errors de color blau

    let expr = '';
    if (polyOrig[0] !== 1 && polyOrig[0] !== -1) expr += formatNum(polyOrig[0]);
    else if (polyOrig[0] === -1) expr += '−';

    const mult = new Map();
    for (const r of roots) mult.set(r, (mult.get(r) || 0) + 1);
    for (const [r, m] of mult.entries()) {
        const factor = `(x ${r >= 0 ? '− ' + r : '+ ' + Math.abs(r)})`;
        expr += m > 1 ? `${factor}<sup>${m}</sup>` : factor;
    }
    if (poly.length > 2) expr += ' · (' + polyToHTMLShort(poly) + ')';

    const box = document.getElementById('resultBox');
    box.innerHTML = `
        <div class="result-box">
            <div class="result-title">✅ Factorització completa</div>
            <div class="result-expr">p(x) = ${expr}</div>
            <button class="btn-check-sm" style="margin: 16px auto 0" onclick="initApp()">Exercici nou</button>
        </div>`;

    setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'center' }), T_SCROLL_DELAY);
}

// ─── UTILS ───────────────────────────────────────────────────────────────
function formatNum(n) {
    return n >= 0 ? String(n) : '−' + String(Math.abs(n));
}

function polyToHTMLShort(coeffs) {
    const n = coeffs.length - 1;
    let parts = [];
    for (let i = 0; i <= n; i++) {
        const exp = n - i;
        const c = coeffs[i];
        if (c === 0) continue;
        const absC = Math.abs(c);
        const sign = c > 0 ? (parts.length === 0 ? '' : '+') : parts.length === 0 ? '−' : '−';
        const cs = absC === 1 && exp > 0 ? '' : String(absC);
        if (exp === 0) parts.push(sign + String(absC));
        else if (exp === 1) parts.push(sign + cs + 'x');
        else parts.push(sign + cs + 'x<sup>' + exp + '</sup>');
    }
    return parts.join('');
}

// ─── ARRENCADA ───────────────────────────────────────────────────────────
window.onload = () => {
    initCustomKeyboard();
    initApp();
};
