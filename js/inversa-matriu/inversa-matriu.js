/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inversa-matriu/inversa-matriu.js
 * ROL: Joc «Inversa d'una matriu 3×3» (inversa-matriu.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa fixed-sessions.js.
 * ============================================================================
 */

import { FixedSessions } from '../fixed-sessions.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { initApp, onMethodChange, submitManualMatrix, hlCofactor, clrHl, toggleHelp, checkCurrentStep });

// ── ESTAT ──
let matrix = [];
let computedDet = 0;
let cofMatrix = []; // matriu de cofactors Cij (de A, mètode A)
let adjMatrix = []; // adjunta = Cᵀ
let transMatrix = []; // transposada Aᵀ (mètode B)
let currentStep = 0; // 0=det, 1=pas2, 2=pas3, 3=inversa
let exerciseFinished = false;
let manualInputActive = false;
let failCounts = [0, 0, 0, 0]; // intents fallits per cada etapa
let methodB = false; // false=mètode A, true=mètode B (Aᵀ primer)

// ── MATEMÀTIQUES ──
const det2 = (a, b, c, d) => a * d - b * c;

function getMinor(m, row, col) {
    const sub = [];
    for (let i = 0; i < 3; i++) {
        if (i === row) continue;
        const r = [];
        for (let j = 0; j < 3; j++) {
            if (j !== col) r.push(m[i][j]);
        }
        sub.push(r);
    }
    return sub;
}

function det3(m) {
    return (
        m[0][0] * det2(m[1][1], m[1][2], m[2][1], m[2][2]) -
        m[0][1] * det2(m[1][0], m[1][2], m[2][0], m[2][2]) +
        m[0][2] * det2(m[1][0], m[1][1], m[2][0], m[2][1])
    );
}

function cofactor(m, i, j) {
    const s = getMinor(m, i, j);
    return Math.pow(-1, i + j) * det2(s[0][0], s[0][1], s[1][0], s[1][1]);
}

function allCofactors(m) {
    return Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => cofactor(m, i, j)));
}

function adjugate(C) {
    return Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => C[j][i]));
}

function precompute() {
    computedDet = det3(matrix);
    cofMatrix = allCofactors(matrix);
    adjMatrix = adjugate(cofMatrix);
    transMatrix = Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => matrix[j][i]));
    renderDebug();
}

// ── DEBUG PANEL ──
const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

function renderDebug() {
    if (!DEBUG) return;
    let p = document.getElementById('debugPanel');
    if (!p) {
        p = document.createElement('div');
        p.id = 'debugPanel';
        document.body.appendChild(p);
    }

    const fmtRow = r => r.map(v => String(v).padStart(4)).join('  ');
    const matTable = m =>
        m.map((r, i) => `<tr>${r.map((v, j) => `<td>[${i}${j}]</td><td>${v}</td>`).join('')}</tr>`).join('');

    // Fraccions inversa: adj[i][j] / det
    const fracRows = adjMatrix
        .map((r, i) =>
            r
                .map((v, j) => {
                    const g = gcd(Math.abs(v), Math.abs(computedDet));
                    const ns = (v / g) * (computedDet < 0 ? -1 : 1);
                    const ds = Math.abs(computedDet / g);
                    return `<td>[${i}${j}]</td><td>${ns}/${ds}</td>`;
                })
                .join('')
        )
        .map(r => `<tr>${r}</tr>`)
        .join('');

    p.innerHTML = `
        <h3>🐛 Debug</h3>
        <div class="dbsec">Matriu A</div>
        <pre style="margin:4px 0; color:#e2e8f0">${matrix.map(fmtRow).join('\n')}</pre>
        <div class="dbsec">Determinant</div>
        <span class="dbk">det(A) = </span><span class="dbv">${computedDet}</span>
        <div class="dbsec">Cofactors C<sub>ij</sub></div>
        <table>${matTable(cofMatrix)}</table>
        <div class="dbsec">Adjunta adj(A)</div>
        <table>${matTable(adjMatrix)}</table>
        <div class="dbsec">Inversa A<sup>−1</sup> (fraccions simplificades)</div>
        <table>${fracRows}</table>`;
}

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

// ── INIT ──
window.onload = initApp;

document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || exerciseFinished) return;
    if (manualInputActive) submitManualMatrix();
    else checkCurrentStep();
});

function initApp() {
    currentStep = 0;
    exerciseFinished = false;
    failCounts = [0, 0, 0, 0];
    methodB = document.getElementById('methodToggle').checked;
    updateStepperLabels();
    document.getElementById('feedback').innerText = '';
    const isManual = document.getElementById('originSelect').value === 'manual';
    if (isManual) {
        manualInputActive = true;
        renderManualInput();
        resetStepper();
    } else {
        manualInputActive = false;
        FixedSessions?.next('m'); // sessions fixes: mateix exercici per a tothom
        generateMatrix();
        precompute();
        renderCurrentStep();
    }
    updateStepper();
}

function generateMatrix() {
    // Distribució ponderada del determinant:
    // det= 1 → p=1/4 | det=-1 → p=1/4 | det= 2 → p=1/8 | det=-2 → p=1/8 | altres → p=1/4
    const r = Math.random();
    let targetDet;
    if (r < 0.25) targetDet = 1;
    else if (r < 0.5) targetDet = -1;
    else if (r < 0.625) targetDet = 2;
    else if (r < 0.75) targetDet = -2;
    else targetDet = null; // "altres": qualsevol enter ≠ 0, |d| ≤ 50

    const ri = () => {
        if (Math.random() < 0.12) return 0;
        let v = 0;
        while (v === 0) v = Math.floor(Math.random() * 11) - 5;
        return v;
    };
    let m,
        d,
        att = 0;
    do {
        m = Array.from({ length: 3 }, () => [ri(), ri(), ri()]);
        d = det3(m);
        att++;
        if (targetDet !== null) {
            if (d === targetDet) break;
        } else {
            // "altres": evita ±1 i ±2, accepta qualsevol enter ≠ 0 amb |d| ≤ 50
            if (d !== 0 && Math.abs(d) <= 50 && Math.abs(d) !== 1 && Math.abs(d) !== 2) break;
        }
    } while (att < 600);
    matrix = m;
}

// ── ENTRADA MANUAL ──
function renderManualInput() {
    const c = document.getElementById('mainContainer');
    c.innerHTML = '';

    const block = el('div', 'panel-block');
    block.appendChild(titleEl('Defineix la matriu A'));
    const grid = el('div', 'matrix');
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = el('div', 'cell');
            cell.innerHTML = `<input type="number" id="m${i}${j}" placeholder="?" onfocus="this.select()">`;
            grid.appendChild(cell);
        }
    block.appendChild(grid);
    c.appendChild(block);

    const action = el('div', 'side-action');
    action.innerHTML = `<button class="btn-check" onclick="submitManualMatrix()">Establir matriu</button>`;
    c.appendChild(action);

    setTimeout(() => {
        const f = document.querySelector('#mainContainer input');
        if (f) f.focus();
    }, 50);
}

function submitManualMatrix() {
    let m = [],
        allFilled = true;
    for (let i = 0; i < 3; i++) {
        let row = [];
        for (let j = 0; j < 3; j++) {
            const v = document.getElementById(`m${i}${j}`).value.trim();
            if (v === '') {
                allFilled = false;
            }
            row.push(parseInt(v));
        }
        m.push(row);
    }
    if (!allFilled) {
        showFb('⚠️ Cal omplir tots els elements.', 'warning');
        return;
    }
    const d = det3(m);
    if (d === 0) {
        showFb('⚠️ Aquesta matriu no és invertible (det = 0). Torna-ho a provar.', 'danger');
        return;
    }
    matrix = m;
    document.getElementById('feedback').innerText = '';
    manualInputActive = false;
    precompute();
    currentStep = 0;
    exerciseFinished = false;
    renderCurrentStep();
    updateStepper();
}

// ── STEPPER ──
function updateStepper() {
    for (let i = 0; i < 4; i++) {
        const item = document.getElementById(`stepItem${i}`);
        const circle = document.getElementById(`stepCircle${i}`);
        item.classList.remove('active', 'done');
        circle.classList.remove('active', 'done');
        if (i < currentStep) {
            item.classList.add('done');
            circle.classList.add('done');
            circle.innerHTML = '✓';
        } else if (i === currentStep && !exerciseFinished) {
            item.classList.add('active');
            circle.classList.add('active');
            circle.innerHTML = i + 1;
        } else {
            circle.innerHTML = i + 1;
        }
    }
    for (let i = 0; i < 3; i++) document.getElementById(`stepConn${i}`).classList.toggle('done', i < currentStep);

    // Bloqueja el toggle a partir del pas 1
    const toggle = document.getElementById('methodToggle');
    if (toggle) {
        toggle.disabled = currentStep >= 1;
        toggle.parentElement.style.opacity = currentStep >= 1 ? '0.4' : '1';
        toggle.parentElement.style.pointerEvents = currentStep >= 1 ? 'none' : '';
    }
}

function onMethodChange() {
    methodB = document.getElementById('methodToggle').checked;
    updateStepperLabels();
    // Només regenera matriu si estem al pas 0; si no, simplement actualitza labels
    if (currentStep === 0 && !exerciseFinished) {
        initApp();
    }
}

function updateStepperLabels() {
    const labels = methodB ? ['det(A)', 'Aᵀ', 'Cofactors', 'A⁻¹'] : ['det(A)', 'Cofactors', 'adj(A)', 'A⁻¹'];
    labels.forEach((l, i) => {
        const el = document.getElementById(`stepLabel${i}`);
        if (el) el.textContent = l;
    });
}

function resetStepper() {
    for (let i = 0; i < 4; i++) {
        document.getElementById(`stepItem${i}`).classList.remove('active', 'done');
        const c = document.getElementById(`stepCircle${i}`);
        c.classList.remove('active', 'done');
        c.innerHTML = i + 1;
    }
    for (let i = 0; i < 3; i++) document.getElementById(`stepConn${i}`).classList.remove('done');
}

function markAllDone() {
    for (let i = 0; i < 4; i++) {
        const item = document.getElementById(`stepItem${i}`);
        const circle = document.getElementById(`stepCircle${i}`);
        item.classList.remove('active');
        item.classList.add('done');
        circle.classList.remove('active');
        circle.classList.add('done');
        circle.innerHTML = '✓';
    }
    for (let i = 0; i < 3; i++) document.getElementById(`stepConn${i}`).classList.add('done');
}

// ── RENDER ──
function renderCurrentStep() {
    const c = document.getElementById('mainContainer');
    c.innerHTML = '';
    document.getElementById('feedback').innerText = '';
    switch (currentStep) {
        case 0:
            renderDet(c);
            break;
        case 1:
            methodB ? renderTranspose(c) : renderCofactors(c);
            break;
        case 2:
            methodB ? renderCofactorsB(c) : renderAdjugate(c);
            break;
        case 3:
            renderInverse(c);
            break;
    }
}

// PAS 0: Determinant
function renderDet(c) {
    c.appendChild(matrixPanel('Matriu A', staticMatrix(matrix)));

    const center = el('div', 'center-panel');
    formula(center, 'det(A) = ?');
    c.appendChild(center);

    const right = el('div', 'panel-block');
    right.appendChild(titleEl('Determinant'));
    const area = el('div', 'det-area');
    area.innerHTML = `
        <div class="det-label">det(A) =</div>
        <input type="number" id="detInput" class="det-input" placeholder="?" onfocus="this.select()">`;
    right.appendChild(area);
    c.appendChild(right);
    c.appendChild(actionBtn());
    setTimeout(() => {
        const f = document.getElementById('detInput');
        if (f) f.focus();
    }, 50);
}

// PAS 1: Cofactors
function renderCofactors(c) {
    // Esquerra: matriu A interactiva
    const left = el('div', 'panel-block');
    left.appendChild(titleEl('Matriu A'));
    const gridA = el('div', 'matrix');
    gridA.id = 'matrixAGrid';
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = el('div', 'cell');
            cell.id = `aCell${i}${j}`;
            cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
            cell.innerText = matrix[i][j];
            gridA.appendChild(cell);
        }
    left.appendChild(gridA);
    c.appendChild(left);

    // Centre: scaffold
    const center = el('div', 'center-panel');
    formula(center, 'C<sub>ij</sub> = (−1)<sup>i+j</sup>·det(M<sub>ij</sub>)');
    helpRow(center);

    const s = el('div', 'scaffold-panel');
    s.id = 'scaffoldDet';
    s.style.display = 'none';
    s.innerHTML = `
        <div class="scaffold-title">Signe dels cofactors</div>
        <div class="sign-grid">
            ${['+', '−', '+', '−', '+', '−', '+', '−', '+']
                .map(sg => `<div class="sign-cell ${sg === '+' ? 'plus' : 'minus'}">${sg}</div>`)
                .join('')}
        </div>
        <div style="margin-top:8px; font-size:0.78rem; line-height:1.55;">
            En fer clic en un camp, la matriu A ressalta la submatriu 2×2 corresponent.
        </div>`;
    center.appendChild(s);
    c.appendChild(center);

    // Dreta: inputs cofactors
    const right = el('div', 'panel-block');
    right.appendChild(titleEl('Cofactors C'));
    const gridC = el('div', 'matrix');
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = el('div', 'cell');
            cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
            cell.innerHTML = `<input type="number" id="cof${i}${j}" placeholder="?"
            onfocus="hlCofactor(${i},${j}); this.select()" onblur="clrHl()">`;
            gridC.appendChild(cell);
        }
    right.appendChild(gridC);
    c.appendChild(right);
    c.appendChild(actionBtn());
}

// PAS 1 (Mètode B): Transposada Aᵀ
function renderTranspose(c) {
    c.appendChild(matrixPanel('Matriu A', staticMatrix(matrix)));

    const center = el('div', 'center-panel');
    formula(center, '(Aᵀ)<sub>ij</sub> = a<sub>ji</sub>');
    helpRow(center);
    scaffold(
        center,
        'Transposada',
        `Per obtenir Aᵀ, intercanvia files i columnes:<br><br>
         La fila <em>i</em> de A passa a ser la columna <em>i</em> de Aᵀ.`
    );
    c.appendChild(center);

    const right = el('div', 'panel-block');
    right.appendChild(titleEl('Aᵀ'));
    const gridT = el('div', 'matrix');
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = el('div', 'cell');
            cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
            cell.innerHTML = `<input type="number" id="tr${i}${j}" placeholder="?" onfocus="this.select()">`;
            gridT.appendChild(cell);
        }
    right.appendChild(gridT);
    c.appendChild(right);
    c.appendChild(actionBtn());
    setTimeout(() => {
        const f = document.getElementById('tr00');
        if (f) f.focus();
    }, 50);
}

function checkTranspose() {
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            if (document.getElementById(`tr${i}${j}`).value.trim() === '') {
                showFb('⚠️ Omple tots els elements de la transposada.', 'warning');
                return;
            }
        }
    let allOk = true;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            if (parseInt(document.getElementById(`tr${i}${j}`).value) !== transMatrix[i][j]) {
                allOk = false;
                break;
            }
        }
    if (!allOk) {
        showFb('❌ Algun element és incorrecte. Recorda: (Aᵀ)ᵢⱼ = aⱼᵢ.', 'danger');
        failStep(1);
        return;
    }
    triggerSuccess('✅ Transposada correcta!');
    setTimeout(() => {
        currentStep = 2;
        renderCurrentStep();
        updateStepper();
    }, 1000);
}

// PAS 2 (Mètode B): Cofactors de Aᵀ (= adj(A))
function renderCofactorsB(c) {
    // Esquerra: Aᵀ interactiva per ressaltar submatrius
    const left = el('div', 'panel-block');
    left.appendChild(titleEl('Aᵀ'));
    const gridT = el('div', 'matrix');
    gridT.id = 'matrixAGrid'; // reutilitzem id per hlCofactor
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = el('div', 'cell');
            cell.id = `aCell${i}${j}`;
            cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
            cell.innerText = transMatrix[i][j];
            gridT.appendChild(cell);
        }
    left.appendChild(gridT);
    c.appendChild(left);

    // Centre: scaffold
    const center = el('div', 'center-panel');
    formula(center, 'C<sub>ij</sub>(Aᵀ) = (−1)<sup>i+j</sup>·det(M<sub>ij</sub>)');
    helpRow(center);

    const s = el('div', 'scaffold-panel');
    s.id = 'scaffoldDet';
    s.style.display = 'none';
    s.innerHTML = `
        <div class="scaffold-title">Signe dels cofactors</div>
        <div class="sign-grid">
            ${['+', '−', '+', '−', '+', '−', '+', '−', '+']
                .map(sg => `<div class="sign-cell ${sg === '+' ? 'plus' : 'minus'}">${sg}</div>`)
                .join('')}
        </div>
        <div style="margin-top:8px; font-size:0.78rem; line-height:1.55;">
            En fer clic en un camp, Aᵀ ressalta la submatriu 2×2 corresponent.<br><br>
            Els cofactors de Aᵀ coincideixen directament amb adj(A).
        </div>`;
    center.appendChild(s);
    c.appendChild(center);

    // Dreta: inputs cofactors de Aᵀ
    const right = el('div', 'panel-block');
    right.appendChild(titleEl('Cofactors de Aᵀ'));
    const gridC = el('div', 'matrix');
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = el('div', 'cell');
            cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
            // id="cof…" per reutilitzar checkCofactors i showAnswer
            cell.innerHTML = `<input type="number" id="cof${i}${j}" placeholder="?"
            onfocus="hlCofactor(${i},${j}); this.select()" onblur="clrHl()">`;
            gridC.appendChild(cell);
        }
    right.appendChild(gridC);
    c.appendChild(right);
    c.appendChild(actionBtn());
}

function checkCofactorsB() {
    // Mateixa lògica que checkCofactors però valida contra adjMatrix (= cofactors de Aᵀ)
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            if (document.getElementById(`cof${i}${j}`).value.trim() === '') {
                showFb('⚠️ Omple tots els cofactors de Aᵀ abans de comprovar.', 'warning');
                return;
            }
        }
    let nOk = 0,
        nErr = 0;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const inp = document.getElementById(`cof${i}${j}`);
            if (inp.classList.contains('cell-correct')) {
                nOk++;
                continue;
            }
            if (parseInt(inp.value) === adjMatrix[i][j]) {
                inp.classList.add('cell-correct');
                inp.setAttribute('readonly', true);
                inp.onblur = null;
                inp.onfocus = null;
                nOk++;
            } else {
                nErr++;
                inp.style.borderColor = 'var(--danger)';
                inp.style.color = 'var(--danger)';
                inp.oninput = function () {
                    this.style.borderColor = '';
                    this.style.color = '';
                    this.oninput = null;
                };
            }
        }
    if (nErr === 0) {
        triggerSuccess('✅ Cofactors de Aᵀ correctes!');
        setTimeout(() => {
            currentStep = 3;
            renderCurrentStep();
            updateStepper();
        }, 1000);
    } else {
        const sErr = nErr === 1 ? '1 cofactor incorrecte' : `${nErr} cofactors incorrectes`;
        const sOk = nOk === 1 ? '1 correcte' : `${nOk} correctes`;
        showFb(`❌ ${sErr} (${sOk} de 9). Revisa els signes i els menors 2×2.`, 'danger');
        failStep(2);
    }
}

// PAS 2 (Mètode A): Adjunta
function renderAdjugate(c) {
    c.appendChild(matrixPanel('Matriu de cofactors C', staticMatrix(cofMatrix)));

    const center = el('div', 'center-panel');
    formula(center, 'adj(A)<sub>ij</sub> = C<sub>ji</sub>');
    helpRow(center);
    scaffold(
        center,
        'Transposada dels cofactors',
        `L'adjunta és la <strong>transposada</strong> de la matriu de cofactors.<br><br>
         Cada element (i,j) de adj(A) és el cofactor C<sub>ji</sub><br>
         (índexs invertits, files ↔ columnes).`
    );
    c.appendChild(center);

    const right = el('div', 'panel-block');
    right.appendChild(titleEl('adj(A)'));
    const gridAdj = el('div', 'matrix');
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = el('div', 'cell');
            cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
            cell.innerHTML = `<input type="number" id="adj${i}${j}" placeholder="?" onfocus="this.select()">`;
            gridAdj.appendChild(cell);
        }
    right.appendChild(gridAdj);
    c.appendChild(right);
    c.appendChild(actionBtn());
}

// PAS 3: Inversa
function renderInverse(c) {
    const detUnit = Math.abs(computedDet) === 1;

    if (detUnit) {
        // ── CASE det=±1: l'usuari omple la matriu inversa directament (enters) ──
        c.appendChild(matrixPanel('adj(A)', staticMatrix(adjMatrix)));

        const center = el('div', 'center-panel');
        const badge = el('div', '');
        badge.style.cssText = 'text-align:center;';
        badge.innerHTML = `<span class="det-badge">det(A) = ${computedDet}</span>`;
        center.appendChild(badge);
        c.appendChild(center);

        const right = el('div', 'panel-block');
        const titleInv = el('div', 'matrix-title');
        titleInv.innerHTML = 'A<sup>−1</sup>';
        right.appendChild(titleInv);
        const gridInv = el('div', 'matrix');
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                const cell = el('div', 'cell');
                cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
                cell.innerHTML = `<input type="number" id="inv${i}${j}" placeholder="?" onfocus="this.select()">`;
                gridInv.appendChild(cell);
            }
        right.appendChild(gridInv);
        c.appendChild(right);
    } else {
        // ── CASE det≠±1: A⁻¹ = (p/q) · [matriu] layout horitzontal ──

        // Esquerra: adj(A) de referència + det badge
        const left = el('div', 'panel-block');
        left.appendChild(titleEl('adj(A)'));
        left.appendChild(staticMatrix(adjMatrix));
        const detBadge = el('div', '');
        detBadge.style.cssText = 'margin-top:12px; text-align:center;';
        detBadge.innerHTML = `<span class="det-badge">det(A) = ${computedDet}</span>`;
        left.appendChild(detBadge);
        c.appendChild(left);

        // Dreta: A⁻¹ = [p/q] · [matriu] tot en línia
        const right = el('div', 'panel-block');
        right.style.alignItems = 'center';

        const row = el('div', 'inv-formula-row');

        // "A⁻¹ ="
        const lhs = el('div', 'inv-lhs');
        lhs.innerHTML = 'A<sup>−1</sup> =';
        row.appendChild(lhs);

        // fracció p/q inline
        const frac = el('div', 'inline-frac');
        frac.innerHTML = `
            <input type="number" id="scalarNum" class="frac-num-inp" placeholder="p" onfocus="this.select()">
            <div class="frac-hbar"></div>
            <input type="number" id="scalarDen" class="frac-den-inp" placeholder="q" onfocus="this.select()">`;
        row.appendChild(frac);

        // punt de multiplicació ·
        const cdot = el('div', 'inv-cdot');
        cdot.textContent = '·';
        row.appendChild(cdot);

        // matriu d'inputs
        const gridInv = el('div', 'matrix');
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                const cell = el('div', 'cell');
                cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
                cell.innerHTML = `<input type="number" id="inv${i}${j}" placeholder="?" onfocus="this.select()">`;
                gridInv.appendChild(cell);
            }
        row.appendChild(gridInv);

        right.appendChild(row);
        c.appendChild(right);
    }

    c.appendChild(actionBtn());
    setTimeout(() => {
        const f = detUnit ? document.getElementById('inv00') : document.getElementById('scalarNum');
        if (f) f.focus();
    }, 50);
}

// ── COMPROVACIÓ ──
function checkCurrentStep() {
    switch (currentStep) {
        case 0:
            checkDet();
            break;
        case 1:
            methodB ? checkTranspose() : checkCofactors();
            break;
        case 2:
            methodB ? checkCofactorsB() : checkAdjugate();
            break;
        case 3:
            checkInverse();
            break;
    }
}

function checkDet() {
    const val = parseInt(document.getElementById('detInput').value);
    if (isNaN(val)) {
        showFb('⚠️ Introdueix el valor del determinant.', 'warning');
        return;
    }
    if (val === computedDet) {
        triggerSuccess('✅ Determinant correcte!');
        setTimeout(() => {
            currentStep = 1;
            renderCurrentStep();
            updateStepper();
        }, 1000);
    } else {
        showFb('❌ Determinant incorrecte. Revisa el càlcul.', 'danger');
        failStep(0);
    }
}

function checkCofactors() {
    // Primer: comprova que tots estiguin omplerts
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            if (document.getElementById(`cof${i}${j}`).value.trim() === '') {
                showFb('⚠️ Omple tots els cofactors abans de comprovar.', 'warning');
                return;
            }
        }
    // Compta encerts i errors, i marca en verd els correctes
    let nOk = 0,
        nErr = 0;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const inp = document.getElementById(`cof${i}${j}`);
            if (inp.classList.contains('cell-correct')) {
                nOk++;
                continue;
            } // ja estava verd
            if (parseInt(inp.value) === cofMatrix[i][j]) {
                inp.classList.add('cell-correct');
                inp.setAttribute('readonly', true);
                inp.removeAttribute('onfocus');
                inp.removeAttribute('onblur');
                inp.onblur = null;
                inp.onfocus = null;
                nOk++;
            } else {
                nErr++;
                inp.style.borderColor = 'var(--danger)';
                inp.style.color = 'var(--danger)';
                // Restore color on next edit
                inp.oninput = function () {
                    this.style.borderColor = '';
                    this.style.color = '';
                    this.oninput = null;
                };
            }
        }
    if (nErr === 0) {
        triggerSuccess('✅ Matriu de cofactors correcta!');
        setTimeout(() => {
            currentStep = 2;
            renderCurrentStep();
            updateStepper();
        }, 1000);
    } else {
        const sErr = nErr === 1 ? '1 cofactor incorrecte' : `${nErr} cofactors incorrectes`;
        const sOk = nOk === 1 ? '1 correcte' : `${nOk} correctes`;
        showFb(`❌ ${sErr} (${sOk} de 9). Revisa els signes i els menors 2×2.`, 'danger');
        failStep(1);
    }
}

function checkAdjugate() {
    let allFilled = true,
        allOk = true;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const v = document.getElementById(`adj${i}${j}`).value.trim();
            if (v === '') {
                allFilled = false;
            } else if (parseInt(v) !== adjMatrix[i][j]) {
                allOk = false;
            }
        }
    if (!allFilled) {
        showFb("⚠️ Omple tots els elements de l'adjunta.", 'warning');
        return;
    }
    if (!allOk) {
        showFb('❌ Algun element és incorrecte. Recorda: adj(A)ᵢⱼ = Cⱼᵢ (transposada).', 'danger');
        failStep(2);
        return;
    }
    triggerSuccess('✅ Adjunta correcta!');
    setTimeout(() => {
        currentStep = 3;
        renderCurrentStep();
        updateStepper();
    }, 1000);
}

function checkInverse() {
    const detUnit = Math.abs(computedDet) === 1;

    if (detUnit) {
        // Validació enters: inv[i][j] = adjMatrix[i][j] / computedDet (= ±adjMatrix[i][j])
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                if (document.getElementById(`inv${i}${j}`).value.trim() === '') {
                    showFb('⚠️ Omple tots els elements de la matriu inversa.', 'warning');
                    return;
                }
            }
        let allOk = true;
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                const v = parseInt(document.getElementById(`inv${i}${j}`).value);
                const expected = adjMatrix[i][j] / computedDet;
                if (v !== expected) {
                    allOk = false;
                    break;
                }
            }
        if (!allOk) {
            showFb('❌ Algun element és incorrecte.', 'danger');
            failStep(3);
            return;
        }
    } else {
        // Validació escalar: p/q = 1/det  →  p·det = q·1  →  p·det = q
        const p = parseInt(document.getElementById('scalarNum').value);
        const q = parseInt(document.getElementById('scalarDen').value);
        if (isNaN(p) || isNaN(q)) {
            showFb("⚠️ Omple el numerador i el denominador de l'escalar.", 'warning');
            return;
        }
        if (q === 0) {
            showFb('⚠️ El denominador no pot ser zero.', 'warning');
            return;
        }
        if (p * computedDet !== q) {
            showFb(`❌ L'escalar p/q no és igual a 1/${computedDet}. Comprova els valors.`, 'danger');
            failStep(3);
            return;
        }

        // Validació matriu: ha de ser adj(A)
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                if (document.getElementById(`inv${i}${j}`).value.trim() === '') {
                    showFb('⚠️ Omple tots els elements de la matriu.', 'warning');
                    return;
                }
            }
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                const v = parseInt(document.getElementById(`inv${i}${j}`).value);
                if (v !== adjMatrix[i][j]) {
                    showFb('❌ Algun element de la matriu és incorrecte. Ha de ser la còpia de adj(A).', 'danger');
                    failStep(3);
                    return;
                }
            }
    }

    triggerSuccess('✅ Inversa correcta! Exercici completat.');
    exerciseFinished = true;
    markAllDone();
    const sa = document.getElementById('sideAction');
    if (sa)
        sa.innerHTML = `
        <div style="color:var(--success); font-weight:700; font-size:1.05rem; letter-spacing:0.01em; margin-bottom:4px;">
            Matriu invertida ✓
        </div>
        <button class="btn-nou-exemple" onclick="initApp()">Fer un altre exemple</button>`;
}

// ── RESSALTAT COFACTORS ──
function hlCofactor(row, col) {
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = document.getElementById(`aCell${i}${j}`);
            if (!cell) return;
            cell.classList.remove('cell-dimmed', 'cell-highlighted');
            i === row || j === col ? cell.classList.add('cell-dimmed') : cell.classList.add('cell-highlighted');
        }
}
function clrHl() {
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = document.getElementById(`aCell${i}${j}`);
            if (cell) cell.classList.remove('cell-dimmed', 'cell-highlighted');
        }
}

// ── FEEDBACK ──
function triggerSuccess(msg) {
    const fb = document.getElementById('feedback');
    fb.innerText = msg;
    fb.style.color = 'var(--success)';
    fb.classList.remove('success-pols');
    void fb.offsetWidth;
    fb.classList.add('success-pols');
    fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function showFb(msg, type) {
    const fb = document.getElementById('feedback');
    fb.innerText = msg;
    fb.style.color = type === 'warning' ? 'var(--warning)' : 'var(--danger)';
    fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function toggleHelp() {
    const s = document.getElementById('scaffoldDet');
    if (s) s.style.display = document.getElementById('helpToggle').checked ? 'block' : 'none';
}

// ── INTENTS FALLITS I REVELAR RESPOSTA ──
function failStep(step) {
    failCounts[step]++;
    if (failCounts[step] >= 3) maybeShowReveal(step);
}

function maybeShowReveal(step) {
    const area = document.getElementById('revealArea');
    if (!area || area.querySelector('.btn-reveal')) return; // ja hi és
    const btn = document.createElement('button');
    btn.className = 'btn-reveal';
    btn.textContent = 'Veure la resposta';
    btn.onclick = () => showAnswer(step);
    area.appendChild(btn);
}

function showAnswer(step) {
    if (step === 0) {
        const inp = document.getElementById('detInput');
        if (inp) {
            inp.value = computedDet;
            inp.disabled = true;
            inp.style.color = 'var(--warning)';
            inp.style.borderColor = 'var(--warning)';
        }
        showFb(`ℹ️ Resposta: det(A) = ${computedDet}`, 'warning');
    } else if (step === 1) {
        if (methodB) {
            // Mètode B: revela la transposada
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++) {
                    const inp = document.getElementById(`tr${i}${j}`);
                    if (!inp) continue;
                    inp.value = transMatrix[i][j];
                    inp.disabled = true;
                    inp.style.color = 'var(--warning)';
                    inp.style.borderColor = 'var(--warning)';
                }
            showFb('ℹ️ Resposta mostrada. Recorda: (Aᵀ)ᵢⱼ = aⱼᵢ.', 'warning');
        } else {
            // Mètode A: revela cofactors de A
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++) {
                    const inp = document.getElementById(`cof${i}${j}`);
                    if (!inp || inp.classList.contains('cell-correct')) continue;
                    inp.value = cofMatrix[i][j];
                    inp.classList.add('cell-correct');
                    inp.style.background = 'rgba(217,119,6,0.10)';
                    inp.style.borderColor = 'var(--warning)';
                    inp.style.color = 'var(--warning)';
                    inp.setAttribute('readonly', true);
                    inp.onblur = null;
                    inp.onfocus = null;
                }
            showFb("ℹ️ Resposta mostrada. Fixa't en els signes i els menors 2×2.", 'warning');
        }
    } else if (step === 2) {
        if (methodB) {
            // Mètode B pas 2: cofactors de Aᵀ = adjMatrix
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++) {
                    const inp = document.getElementById(`cof${i}${j}`);
                    if (!inp || inp.classList.contains('cell-correct')) continue;
                    inp.value = adjMatrix[i][j];
                    inp.classList.add('cell-correct');
                    inp.style.background = 'rgba(217,119,6,0.10)';
                    inp.style.borderColor = 'var(--warning)';
                    inp.style.color = 'var(--warning)';
                    inp.setAttribute('readonly', true);
                    inp.onblur = null;
                    inp.onfocus = null;
                }
            showFb('ℹ️ Resposta mostrada. Recorda: cofactors(Aᵀ) = adj(A).', 'warning');
        } else {
            // Mètode A pas 2: adjunta
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++) {
                    const inp = document.getElementById(`adj${i}${j}`);
                    if (!inp) continue;
                    inp.value = adjMatrix[i][j];
                    inp.disabled = true;
                    inp.style.color = 'var(--warning)';
                    inp.style.borderColor = 'var(--warning)';
                }
            showFb('ℹ️ Resposta mostrada. Recorda: adj(A)ᵢⱼ = Cⱼᵢ (transposada).', 'warning');
        }
    } else if (step === 3) {
        const detUnit = Math.abs(computedDet) === 1;
        if (!detUnit) {
            const sn = document.getElementById('scalarNum');
            const sd = document.getElementById('scalarDen');
            if (sn) {
                sn.value = 1;
                sn.disabled = true;
                sn.style.color = 'var(--warning)';
                sn.style.borderColor = 'var(--warning)';
            }
            if (sd) {
                sd.value = computedDet;
                sd.disabled = true;
                sd.style.color = 'var(--warning)';
                sd.style.borderColor = 'var(--warning)';
            }
        }
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++) {
                const inp = document.getElementById(`inv${i}${j}`);
                if (!inp) continue;
                inp.value = detUnit ? adjMatrix[i][j] / computedDet : adjMatrix[i][j];
                inp.disabled = true;
                inp.style.color = 'var(--warning)';
                inp.style.borderColor = 'var(--warning)';
            }
        showFb('ℹ️ Resposta mostrada.', 'warning');
    }
    const area = document.getElementById('revealArea');
    if (area) area.innerHTML = '';
}

// ── DOM HELPERS ──
function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
}
function titleEl(text) {
    const e = el('div', 'matrix-title');
    e.innerText = text;
    return e;
}
function staticMatrix(m) {
    const grid = el('div', 'matrix');
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const cell = el('div', 'cell');
            cell.style.animationDelay = `${(i * 3 + j) * 0.022}s`;
            cell.innerText = m[i][j];
            grid.appendChild(cell);
        }
    return grid;
}
function matrixPanel(title, gridEl) {
    const block = el('div', 'panel-block');
    block.appendChild(titleEl(title));
    block.appendChild(gridEl);
    return block;
}
function formula(parent, html) {
    const e = el('div', 'step-formula');
    e.innerHTML = html;
    parent.appendChild(e);
}
function helpRow(parent) {
    const r = el('div', 'help-row');
    r.innerHTML = `<label>Mostrar ajuda <input type="checkbox" id="helpToggle" onchange="toggleHelp()"></label>`;
    parent.appendChild(r);
}
function scaffold(parent, title, bodyHTML) {
    const s = el('div', 'scaffold-panel');
    s.id = 'scaffoldDet';
    s.style.display = 'none';
    s.innerHTML = `<div class="scaffold-title">${title}</div>
        <div style="line-height:1.7; font-size:0.82rem;">${bodyHTML}</div>`;
    parent.appendChild(s);
}
function actionBtn() {
    const a = el('div', 'side-action');
    a.id = 'sideAction';
    a.innerHTML = `<button class="btn-check" onclick="checkCurrentStep()">Comprovar</button>
                   <div id="revealArea"></div>`;
    return a;
}
