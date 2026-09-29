/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/esglaonar-matriu/esglaonar-matriu.js
 * ROL: Joc «Esglaonar matriu» (esglaonar-matriu.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa fixed-sessions.js.
 * ============================================================================
 */

import { FixedSessions } from '../fixed-sessions.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { initApp, onOrderChange, renderStep, updateHelp, checkStep, setManualMatrix, applySwap });

let matrix = [];
let matrixHistory = [];
let currentCols = 4;
let isManualMode = false;
let currentStepIdx = 0;
let feedbackOffset = 0;
let exerciseFinished = false;

const steps = [
    { tRow: 1, pRow: 0, label: 'Fila 2' },
    { tRow: 2, pRow: 0, label: 'Fila 3' },
    { tRow: 2, pRow: 1, label: 'Fila 3' },
];

window.onload = initApp;

document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !exerciseFinished) {
        if (isManualMode) setManualMatrix();
        else checkStep();
    }
});

function initApp() {
    currentCols = parseInt(document.getElementById('sizeSelect').value);
    isManualMode = document.getElementById('originSelect').value === 'manual';
    document.documentElement.style.setProperty('--cols', currentCols);
    currentStepIdx = 0;
    exerciseFinished = false;
    feedbackOffset = 0;
    document.getElementById('feedback').innerText = '';

    document.getElementById('centralPanel').style.display = 'flex';
    document.getElementById('wrapperRight').style.display = 'flex';

    if (isManualMode) renderManualInput();
    else {
        FixedSessions?.next('c' + currentCols);
        generateSmartMatrix();
        matrixHistory = [matrix.map(r => [...r])];
        renderStep();
    }
}

function generateSmartMatrix() {
    const getInt = (canBeZero = true) => {
        if (canBeZero && Math.random() < 0.1) return 0;
        let v = 0;
        while (v === 0) v = Math.floor(Math.random() * 17) - 8;
        return v;
    };
    let m = [];
    let success = false;
    let attempts = 0;
    while (!success && attempts < 200) {
        attempts++;
        m = [];
        m.push([getInt(false), getInt(), getInt(), getInt()].slice(0, currentCols));
        m.push([getInt(false), getInt(), getInt(), getInt()].slice(0, currentCols));
        let r3 = [];
        const scenario = Math.random();
        if (currentCols === 4) {
            if (scenario < 0.125) {
                const c1 = getInt(false),
                    c2 = getInt(false);
                for (let j = 0; j < currentCols; j++) r3.push(c1 * m[0][j] + c2 * m[1][j]);
            } else if (scenario < 0.25) {
                const c1 = getInt(false),
                    c2 = getInt(false);
                for (let j = 0; j < currentCols; j++) r3.push(c1 * m[0][j] + c2 * m[1][j]);
                r3[currentCols - 1] += Math.random() < 0.5 ? 2 : -2;
            } else {
                r3 = [getInt(false), getInt(), getInt(), getInt()].slice(0, currentCols);
            }
        } else {
            r3 = [getInt(false), getInt(), getInt()].slice(0, currentCols);
        }
        m.push(r3);
        success = m.every(row => row.every(v => Math.abs(v) <= 18)) && m[2][0] !== 0;
    }
    matrix = m;
}

function renderManualInput() {
    document.getElementById('centralPanel').style.display = 'none';
    document.getElementById('wrapperRight').style.display = 'none';
    document.getElementById('feedback').innerText = '';

    const chain = document.getElementById('historyChain');
    chain.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'matrix-wrapper';
    const title = document.createElement('div');
    title.className = 'matrix-title';
    title.innerText = 'Defineix la matriu';
    const grid = document.createElement('div');
    grid.className = 'matrix';
    for (let i = 0; i < 3 * currentCols; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.animationDelay = `${i * 0.02}s`;
        if (currentCols === 4 && i % currentCols === 3) cell.classList.add('sep-column');
        cell.innerHTML = `<input type="number" class="manual-cell" placeholder="?" onfocus="this.select()">`;
        grid.appendChild(cell);
    }
    wrapper.appendChild(title);
    wrapper.appendChild(grid);
    chain.appendChild(wrapper);

    document.getElementById('sideAction').innerHTML =
        `<button id="mainBtn" class="btn-check" onclick="setManualMatrix()">Establir aquesta matriu</button>`;

    setTimeout(() => {
        const firstInput = document.querySelector('.manual-cell');
        if (firstInput) firstInput.focus();
    }, 50);
}

function setManualMatrix() {
    const inputs = document.querySelectorAll('.manual-cell');
    const fb = document.getElementById('feedback');
    let m = [];
    let idx = 0;
    let allFilled = true;

    for (let i = 0; i < 3; i++) {
        let row = [];
        for (let j = 0; j < currentCols; j++) {
            const valStr = inputs[idx++].value.trim();
            if (valStr === '') allFilled = false;
            row.push(parseInt(valStr));
        }
        m.push(row);
    }

    if (!allFilled) {
        fb.innerText = '⚠️ Cal donar valor a tots els elements de la matriu.';
        fb.style.color = 'var(--warning)';
        fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    document.getElementById('centralPanel').style.display = 'flex';
    document.getElementById('wrapperRight').style.display = 'flex';

    matrix = m;
    matrixHistory = [matrix.map(r => [...r])];
    isManualMode = false;
    renderStep();
}

function renderStep() {
    const step = steps[currentStepIdx];
    const order = document.getElementById('orderSelect').value;

    // ── MODE PERMUTACIÓ ──
    if (order === 'swap') {
        document.getElementById('helpRow').style.display = 'none';
        document.getElementById('scaffold').style.opacity = '0';
        document.getElementById('matrixTitleRight').innerText = 'Matriu permutada';
        document.getElementById('opText').innerHTML = '';

        renderHistoryChain();
        previewSwap();

        document.getElementById('sideAction').innerHTML =
            `<button class="btn-check" onclick="applySwap()">Aplicar permutació</button>`;
        return;
    }

    // ── MODE OPERACIÓ DE FILA ──
    document.getElementById('helpRow').style.display = '';
    document.getElementById('matrixTitleRight').innerText = step.label;
    const targetL = `F<sub>${step.tRow + 1}</sub>`;
    const pivotL = `F<sub>${step.pRow + 1}</sub>`;

    if (order === 'pivotFirst') {
        document.getElementById('opText').innerHTML =
            `${targetL} ⮕ <input type="number" id="cLeft" class="op-input" onfocus="this.select()"> ${pivotL} + <input type="number" id="cRight" class="op-input" onfocus="this.select()"> ${targetL}`;
    } else {
        document.getElementById('opText').innerHTML =
            `${targetL} ⮕ <input type="number" id="cLeft" class="op-input" onfocus="this.select()"> ${targetL} + <input type="number" id="cRight" class="op-input" onfocus="this.select()"> ${pivotL}`;
    }
    document.getElementById('cLeft').addEventListener('input', updateHelp);
    document.getElementById('cRight').addEventListener('input', updateHelp);

    renderHistoryChain();

    const mRight = document.getElementById('matrixRight');
    mRight.innerHTML = '';
    matrix.forEach((row, i) => {
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.animationDelay = `${(i * currentCols + j) * 0.018}s`;
            if (currentCols === 4 && j === 3) cell.classList.add('sep-column');
            if (i === step.tRow) {
                cell.innerHTML = `<input type="number" id="r${j}" placeholder="?" onfocus="this.select()">`;
            } else {
                cell.innerText = val;
            }
            mRight.appendChild(cell);
        });
    });
    document.getElementById('sideAction').innerHTML =
        `<button id="mainBtn" class="btn-check" onclick="checkStep()">Comprovar</button>`;
    updateHelp();
}

function renderHistoryChain() {
    const chain = document.getElementById('historyChain');
    chain.innerHTML = '';
    matrixHistory.forEach((mat, idx) => {
        if (idx > 0) {
            const tilde = document.createElement('div');
            tilde.className = 'tilde';
            tilde.style.cssText = 'font-size:3.5rem; opacity:0.6; margin:0 -5px;';
            tilde.innerText = '~';
            chain.appendChild(tilde);
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'matrix-wrapper';
        const grid = document.createElement('div');
        grid.className = 'matrix';
        mat.forEach((row, i) =>
            row.forEach((val, j) => {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.animationDelay = `${(i * currentCols + j) * 0.018}s`;
                if (currentCols === 4 && j === 3) cell.classList.add('sep-column');
                // boxed zeros per als passos ja fets
                let isA21Done = currentStepIdx > 0 && i === 1 && j === 0;
                let isA31Done = currentStepIdx > 1 && i === 2 && j === 0;
                let isA32Done = exerciseFinished && i === 2 && j === 1;
                if (val === 0 && idx === matrixHistory.length - 1 && (isA21Done || isA31Done || isA32Done)) {
                    cell.innerHTML = `<span class="boxed-zero">0</span>`;
                } else {
                    cell.innerText = val;
                }
                grid.appendChild(cell);
            })
        );
        wrapper.appendChild(grid);
        chain.appendChild(wrapper);
    });
}

function updateHelp() {
    const step = steps[currentStepIdx];
    const order = document.getElementById('orderSelect').value;
    const valL = parseInt(document.getElementById('cLeft').value);
    const valR = parseInt(document.getElementById('cRight').value);
    const active = document.getElementById('helpToggle').checked;
    document.getElementById('scaffold').style.opacity = active ? '1' : '0';
    const vL1 = document.getElementById('vL1'),
        vV1 = document.getElementById('vV1');
    const vL2 = document.getElementById('vL2'),
        vV2 = document.getElementById('vV2');
    if (isNaN(valL) || isNaN(valR)) {
        vL1.innerText = '...';
        vV1.innerText = '';
        vL2.innerText = '...';
        vV2.innerText = '';
        document.getElementById('strategyCheck').style.display = 'none';
        return;
    }
    let rL = order === 'pivotFirst' ? matrix[step.pRow] : matrix[step.tRow];
    let rR = order === 'pivotFirst' ? matrix[step.tRow] : matrix[step.pRow];
    let labL = order === 'pivotFirst' ? `F${step.pRow + 1}` : `F${step.tRow + 1}`;
    let labR = order === 'pivotFirst' ? `F${step.tRow + 1}` : `F${step.pRow + 1}`;
    vL1.innerText = `${valL}·${labL}`;
    vV1.innerText = `(${rL.map(x => valL * x).join(',')})`;
    vL2.innerText = `${valR}·${labR}`;
    vV2.innerText = `(${rR.map(x => valR * x).join(',')})`;
    const colIdx = currentStepIdx === 2 ? 1 : 0;
    const isZero = valL * rL[colIdx] + valR * rR[colIdx] === 0;
    document.getElementById('strategyCheck').style.display = isZero && (valL !== 0 || valR !== 0) ? 'block' : 'none';
}

function onOrderChange() {
    const isSwap = document.getElementById('orderSelect').value === 'swap';
    document.getElementById('swapRowsLabel').style.display = isSwap ? '' : 'none';
    renderStep();
}

function previewSwap() {
    const rowA = parseInt(document.getElementById('swapA').value);
    const rowB = parseInt(document.getElementById('swapB').value);
    let prev = matrix.map(r => [...r]);
    [prev[rowA], prev[rowB]] = [prev[rowB], prev[rowA]];
    const mRight = document.getElementById('matrixRight');
    mRight.innerHTML = '';
    prev.forEach((row, i) =>
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.animationDelay = `${(i * currentCols + j) * 0.018}s`;
            if (currentCols === 4 && j === 3) cell.classList.add('sep-column');
            if (i === rowA || i === rowB) {
                cell.style.color = 'var(--primary)';
                cell.style.fontWeight = '700';
                cell.style.background = 'rgba(37,99,235,0.07)';
                cell.style.borderRadius = '6px';
            }
            cell.innerText = val;
            mRight.appendChild(cell);
        })
    );
}

function applySwap() {
    const rowA = parseInt(document.getElementById('swapA').value);
    const rowB = parseInt(document.getElementById('swapB').value);
    if (rowA === rowB) {
        const fb = document.getElementById('feedback');
        fb.innerText = `⚠️ Tria dues files diferents.`;
        fb.style.color = 'var(--warning)';
        return;
    }
    [matrix[rowA], matrix[rowB]] = [matrix[rowB], matrix[rowA]];
    matrixHistory.push(matrix.map(r => [...r]));

    renderHistoryChain();
    const mRight = document.getElementById('matrixRight');
    mRight.innerHTML = '';
    matrix.forEach((row, i) =>
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.animationDelay = `${(i * currentCols + j) * 0.018}s`;
            if (currentCols === 4 && j === 3) cell.classList.add('sep-column');
            if (i === rowA || i === rowB) {
                cell.style.color = 'var(--primary)';
                cell.style.fontWeight = '700';
                cell.style.background = 'rgba(37,99,235,0.07)';
                cell.style.borderRadius = '6px';
            }
            cell.innerText = val;
            mRight.appendChild(cell);
        })
    );
    document.getElementById('matrixTitleRight').innerText = 'Matriu permutada';

    triggerSuccessFeedback(`✅ Files F${rowA + 1} i F${rowB + 1} permutades.`);
    setTimeout(() => {
        const sel = document.getElementById('orderSelect');
        sel.value = 'pivotFirst';
        document.getElementById('swapRowsLabel').style.display = 'none';
        renderStep();
    }, 1200);
}

function checkStep() {
    const step = steps[currentStepIdx];
    const order = document.getElementById('orderSelect').value;
    const valL = parseInt(document.getElementById('cLeft').value);
    const valR = parseInt(document.getElementById('cRight').value);
    const res = [];
    for (let j = 0; j < currentCols; j++) res.push(parseInt(document.getElementById(`r${j}`).value));
    const fb = document.getElementById('feedback');
    if (isNaN(valL) || isNaN(valR) || res.some(isNaN)) {
        fb.innerText = `⚠️ Omple tota la fila.`;
        fb.style.color = 'var(--warning)';
        fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const targetCoeff = order === 'pivotFirst' ? valR : valL;
    if (targetCoeff === 0) {
        fb.innerText =
            '❌ El coeficient de Fi ha de ser diferent de zero: si fos 0 estaries substituint la fila (operació no invertible), no combinant-la.';
        fb.style.color = 'var(--danger)';
        fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    let rowL = order === 'pivotFirst' ? matrix[step.pRow] : matrix[step.tRow];
    let rowR = order === 'pivotFirst' ? matrix[step.tRow] : matrix[step.pRow];
    const colIdx = currentStepIdx === 2 ? 1 : 0;
    if (valL * rowL[colIdx] + valR * rowR[colIdx] !== 0) {
        fb.innerText = '❌ No genera el zero.';
        fb.style.color = 'var(--danger)';
        fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (res.every((val, j) => val === valL * rowL[j] + valR * rowR[j])) {
        triggerSuccessFeedback(`✅ Pas correcte.`);
        matrix[step.tRow] = [...res];
        matrixHistory.push(matrix.map(r => [...r]));
        setTimeout(() => {
            if (currentStepIdx < steps.length - 1) {
                currentStepIdx++;
                renderStep();
            } else {
                exerciseFinished = true;
                finishExercise();
            }
        }, 1000);
    } else {
        fb.innerText = '❌ Càlculs incorrectes.';
        fb.style.color = 'var(--danger)';
        fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function triggerSuccessFeedback(msg) {
    const fb = document.getElementById('feedback');
    fb.innerText = msg;
    fb.style.color = 'var(--success)';
    fb.classList.remove('success-pols');
    void fb.offsetWidth;
    fb.classList.add('success-pols');
    fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function finishExercise() {
    const fb = document.getElementById('feedback');
    fb.innerText = '';
    document.getElementById('sideAction').innerHTML = `
        <div style="color:var(--success); font-weight:700; font-size:1.05rem; letter-spacing:0.01em;">Matriu ja esglaonada ✓</div>
        <button class="btn-mini" onclick="initApp()">Nou exercici</button>
    `;
    renderHistoryChain();
    const mRight = document.getElementById('matrixRight');
    mRight.innerHTML = '';
    matrix.forEach((row, i) =>
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.animationDelay = `${(i * currentCols + j) * 0.018}s`;
            if (currentCols === 4 && j === 3) cell.classList.add('sep-column');
            cell.innerText = val;
            mRight.appendChild(cell);
        })
    );
    document.getElementById('sideAction').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
