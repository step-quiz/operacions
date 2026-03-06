// ============================================================
// js/game-core.js — Lògica compartida de sessions, puntuació,
//                   pantalles finals, informe i seguretat
// NOTA: Requereix utils.js i config.js carregats prèviament
// ============================================================

// ---- PALETA DE FONS (compartida) ---
const bgColors = [
    '#f8fafc', '#eff6ff', '#f0fdf4', '#fefce8', '#fff1f2',
    '#f5f3ff', '#ecfeff', '#fdf4ff', '#fffbeb', '#faf5ff'
];

// ---- ESTAT COMPARTIT DEL JOC ----
let sessionHistory   = []; 
let currentSession   = 0;
let currentOperation = 0;
let sessionScore     = 0;
let sessionScores    = [];
let attemptsLeft     = 0;   
let isTransitioning  = false;

// ---- VALIDACIÓ DE CONFIGURACIÓ ----
function validateConfig() {
    const errors = [];
    const isPosInt = (n) => Number.isInteger(n) && n > 0;

    if (!isPosInt(TOTAL_SESSIONS))        errors.push('TOTAL_SESSIONS ha de ser un enter positiu (> 0).');
    if (!isPosInt(TOTAL_OPERATIONS))      errors.push('TOTAL_OPERATIONS ha de ser un enter positiu (> 0).');
    if (!isPosInt(MAX_INTENTS))           errors.push('MAX_INTENTS ha de ser un enter positiu (> 0).');
    if (![0, 1].includes(MAX_ENLLOC_MITJANA)) errors.push('MAX_ENLLOC_MITJANA ha de ser 0 o 1.');

    if (errors.length) {
        const msg = 'Configuració invàlida:\n- ' + errors.join('\n- ');
        console.error(msg);
        alert(msg);
        throw new Error(msg);
    }
}

// ---- GESTIÓ DE PANTALLES ----
let _allScreenIds = ['game-screen', 'session-end-screen', 'final-screen'];

function registerScreens(ids) {
    _allScreenIds = ids;
}

function showScreen(id) {
    _allScreenIds.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
}

// ---- INICI I FI DEL JOC ----
function startGame() {
    currentSession = 0;
    sessionScores  = [];
    sessionHistory = []; 
    showScreen('game-screen');
    startSession();
}

function startSession() {
    currentOperation = 0;
    sessionScore     = 0;
    if (typeof buildLevel === 'function') buildLevel();
}

function endSession() {
    // 🟢 CORRECCIÓ 1: Aquest és l'ÚNIC lloc on es fa push de la nota.
    sessionScores.push(sessionScore);

    if (currentSession + 1 >= TOTAL_SESSIONS) {
        renderFinalSummary();
        showScreen('final-screen');
    } else {
        showScreen('session-end-screen');

        const titleEl = document.getElementById('session-end-title');
        if (titleEl) titleEl.innerText = `Sessió ${currentSession + 1} completada`;

        const btnEl = document.getElementById('btn-next-session');
        if (btnEl) {
            btnEl.style.display = 'none';
            setTimeout(() => {
                btnEl.style.display = 'inline-block';
                isTransitioning = false;
            }, 1000);
        }
    }
}

function startNextSession() {
    currentSession++;
    showScreen('game-screen');
    startSession();
}

// ---- CÀLCUL I RENDER DE LA NOTA FINAL ----
function calculaNotaSobre10() {
    if (!sessionScores.length) return 0;

    if (MAX_ENLLOC_MITJANA === 1) {
        const maxScore = Math.max(...sessionScores);
        return Number((maxScore / TOTAL_OPERATIONS).toFixed(1));
    } else {
        const total = sessionScores.reduce((acc, s) => acc + s, 0);
        return Number((total / (TOTAL_SESSIONS * TOTAL_OPERATIONS)).toFixed(1));
    }
}

function renderFinalSummary() {
    let html = '';

    for (let i = 0; i < sessionScores.length; i++) {
        const notaSessio = (sessionScores[i] / TOTAL_OPERATIONS).toFixed(1).replace('.', ',');
        html += `<div class="session-line">
            <span>Sessió ${i + 1}</span>
            <span>${notaSessio}</span>
        </div>`;
    }

    const nota10    = calculaNotaSobre10().toFixed(1).replace('.', ',');
    const textFinal = MAX_ENLLOC_MITJANA === 1
        ? 'La sessió amb nota més alta obté:'
        : 'La nota mitjana és:';

    html += `<div style="margin-top:20px; text-align:left;">
        <div style="font-size:0.95em; color:var(--text-muted); margin-bottom:5px;">${textFinal}</div>
        <div style="font-size:1.5em; font-weight:bold; color:var(--success); font-family:monospace;">${nota10} / 10</div>
    </div>`;

    const summaryEl = document.getElementById('final-summary');
    if (summaryEl) summaryEl.innerHTML = html;
}

function finalitzar() {
    window.location.reload();
}

// ---- MINI OVERLAY (victòria / fracàs) ----
function showMiniOverlay(levelPoints, options = {}) {
    const successColor = options.successColor || '#047857';
    const pointsColor  = options.pointsColor  || '#059669';

    const vicText   = document.getElementById('mini-vic-text');
    const vicIcon   = document.getElementById('mini-vic-icon');
    const vicPoints = document.getElementById('mini-vic-points');
    const overlay   = document.getElementById('mini-victory-overlay');

    let waitTime;

    if (levelPoints > 0) {
        if (vicText)   { vicText.innerText   = 'Molt bé!';             vicText.style.color   = successColor; }
        if (vicIcon)   { vicIcon.innerText   = '⭐'; }
        if (vicPoints) { vicPoints.innerText = `+${levelPoints} punts`; vicPoints.style.color = pointsColor; }
        waitTime = 1500;
    } else {
        if (vicText)   { vicText.innerText   = 'Intents esgotats'; vicText.style.color   = 'var(--danger)'; }
        if (vicIcon)   { vicIcon.innerText   = '❌'; }
        if (vicPoints) { vicPoints.innerText = '0 punts';           vicPoints.style.color = 'var(--danger)'; }
        waitTime = 3000;
    }

    if (overlay) {
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    }

    return waitTime;
}

function hideMiniOverlay() {
    const overlay = document.getElementById('mini-victory-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }
}

// ============================================================
// INJECCIÓ HTML COMPARTIT (evita duplicar blocs a cada joc)
// ============================================================

function injectSharedHTML() {
    const gameScreen = document.getElementById('game-screen');
    const panel = document.querySelector('.panel');
    if (!gameScreen || !panel) return;

    // 1. Mini overlay de victòria/fracàs (dins de game-screen)
    const overlay = document.createElement('div');
    overlay.id = 'mini-victory-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="vic-message-row">
            <div class="mini-vic-text" id="mini-vic-text">Molt bé!</div>
            <div class="star-icon" id="mini-vic-icon">⭐</div>
        </div>
        <div class="mini-vic-points" id="mini-vic-points">+10 punts</div>
    `;
    gameScreen.appendChild(overlay);

    // 2. Teclat numèric custom
    const kb = document.createElement('div');
    kb.id = 'customKeyboard';
    kb.innerHTML = `
        <div class="kb-grid">
            <button class="kb-btn" data-key="7">7</button>
            <button class="kb-btn" data-key="8">8</button>
            <button class="kb-btn" data-key="9">9</button>
            <button class="kb-btn kb-del" data-key="del">⌫</button>
            <button class="kb-btn" data-key="4">4</button>
            <button class="kb-btn" data-key="5">5</button>
            <button class="kb-btn" data-key="6">6</button>
            <button class="kb-btn kb-minus" data-key="-">−</button>
            <button class="kb-btn" data-key="1">1</button>
            <button class="kb-btn" data-key="2">2</button>
            <button class="kb-btn" data-key="3">3</button>
            <button class="kb-btn kb-enter" data-key="enter">→</button>
            <button class="kb-btn kb-zero" data-key="0">0</button>
        </div>
    `;
    panel.appendChild(kb);

    // 3. Pantalla fi de sessió
    const sessionEnd = document.createElement('div');
    sessionEnd.id = 'session-end-screen';
    sessionEnd.innerHTML = `
        <div class="trophy-icon">👍</div>
        <h2 id="session-end-title">Sessió completada</h2>
        <button class="btn-green" id="btn-next-session" onclick="startNextSession()">
            Començar sessió següent
        </button>
    `;
    panel.appendChild(sessionEnd);

    // 4. Pantalla final amb resum i botons
    const finalScreen = document.createElement('div');
    finalScreen.id = 'final-screen';
    finalScreen.style.display = 'none';
    finalScreen.innerHTML = `
        <div id="final-results">
            <h2>Resum</h2>
            <div class="final-layout">
                <div id="final-summary" class="final-summary"></div>
                <div class="trophy-icon">🏆</div>
            </div>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 25px;">
                <button class="btn-submit" onclick="if(typeof showHistorySummary === 'function') showHistorySummary();" style="background-color: var(--primary);">
                    📋 Informe
                </button>
                <button id="btn-copiar" class="btn-submit" onclick="if(typeof copiarResultats === 'function') copiarResultats();" style="background-color: #334155;">
                    🔒 Copiar codi
                </button>
                <button class="btn-submit" onclick="finalitzar()" style="background-color: var(--text-muted);">
                    🔄 Tornar a jugar
                </button>
            </div>
        </div>
    `;
    panel.appendChild(finalScreen);
}

// ============================================================
// TECLAT NUMÈRIC CUSTOM (mòbil / tàctil)
// ============================================================

function isTouchDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

let _kbActiveInput  = null;
let _kbClearOnNext  = false;

function initCustomKeyboard(options = {}) {
    const allowNeg  = options.allowNegative ?? false;
    const allowZero = options.allowZero     ?? true;
    const grid      = document.querySelector('#customKeyboard .kb-grid');

    if (grid) {
        if (!allowNeg)  grid.classList.add('kb-no-minus');
        else            grid.classList.remove('kb-no-minus');
        if (!allowZero) grid.classList.add('kb-no-zero');
        else            grid.classList.remove('kb-no-zero');
    }

    document.querySelectorAll('#customKeyboard .kb-btn').forEach(btn => {
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (!_kbActiveInput) return;
            const key = btn.dataset.key;

            if (key === 'del') {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                } else {
                    _kbActiveInput.value = _kbActiveInput.value.slice(0, -1);
                }
            } else if (key === 'enter') {
                if (typeof checkCurrentCell === 'function') checkCurrentCell();
            } else if (key === '-') {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '-';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                } else {
                    const v = _kbActiveInput.value;
                    if (v === '')       _kbActiveInput.value = '-';
                    else if (v === '-') _kbActiveInput.value = '';
                }
            } else {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                }
                if (_kbActiveInput.value === '-0') _kbActiveInput.value = '-';
                _kbActiveInput.value += key;
            }
        });
    });
}

function showCustomKeyboard(inp) {
    if (_kbActiveInput) _kbActiveInput.classList.remove('kb-active-input');
    _kbActiveInput = inp;
    _kbClearOnNext = false;
    inp.setAttribute('inputmode', 'none');
    inp.setAttribute('readonly', 'readonly');
    inp.classList.add('kb-active-input');
    const kb = document.getElementById('customKeyboard');
    if (kb) {
        kb.classList.add('kb-visible');
        setTimeout(() => kb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
    inp.focus();
}

function hideCustomKeyboard() {
    const kb = document.getElementById('customKeyboard');
    if (kb) kb.classList.remove('kb-visible');
    if (_kbActiveInput) _kbActiveInput.classList.remove('kb-active-input');
    _kbActiveInput = null;
    _kbClearOnNext = false;
}

function kbMarkForOverwrite(inp) {
    _kbClearOnNext = true;
    inp.classList.add('kb-selected');
}

// ============================================================
// SISTEMA D'HISTORIAL I PROTECCIÓ XSS
// ============================================================

// 🟢 CORRECCIÓ 4: Escapar HTML per evitar injeccions de codi
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function recordAnswerToHistory(question, answer, isCorrect) {
    sessionHistory.push({ question, answer, isCorrect });
}

function showHistorySummary() {
    _allScreenIds.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });

    let summaryScreen = document.getElementById('history-summary-screen');
    if (!summaryScreen) {
        summaryScreen = document.createElement('div');
        summaryScreen.id = 'history-summary-screen';
        summaryScreen.className = 'panel-content'; 
        
        const mainPanel = document.querySelector('.panel') || document.body;
        mainPanel.appendChild(summaryScreen);
    }

    const encerts = sessionHistory.filter(item => item.isCorrect);
    const errades = sessionHistory.filter(item => !item.isCorrect);

    // 🟢 CORRECCIÓ 4: S'utilitza escapeHtml() en les dades d'entrada
    summaryScreen.innerHTML = `
        <div style="padding: 20px; text-align: left;">
            <h2 style="text-align:center; color: var(--primary); margin-bottom: 25px;">Resum de les teves respostes</h2>
            
            <h3 style="color: var(--success); border-bottom: 2px solid var(--success); padding-bottom: 5px;">
                🟢 Encerts (${encerts.length})
            </h3>
            <ul style="list-style: none; padding: 0; margin-bottom: 30px;">
                ${encerts.map(e => `
                    <li style="margin-bottom: 15px; background: #f0fdf4; padding: 12px; border-radius: 6px; border: 1px solid #bbf7d0;">
                        <div style="margin-bottom: 5px; color: #334155;"><strong>Pregunta:</strong> <span style="font-family: monospace; font-size: 1.1em;">${escapeHtml(e.question)}</span></div>
                        <div style="color: #059669;"><strong>La teva resposta:</strong> <span style="font-family: monospace;">${escapeHtml(e.answer)}</span></div>
                    </li>
                `).join('')}
                ${encerts.length === 0 ? '<li style=\"color: var(--text-muted); font-style: italic;\">Cap encert en aquesta partida.</li>' : ''}
            </ul>

            <h3 style="color: var(--danger); border-bottom: 2px solid var(--danger); padding-bottom: 5px;">
                🔴 Errades (${errades.length})
            </h3>
            <ul style="list-style: none; padding: 0; margin-bottom: 20px;">
                ${errades.map(e => `
                    <li style="margin-bottom: 15px; background: #fef2f2; padding: 12px; border-radius: 6px; border: 1px solid #fecaca;">
                        <div style="margin-bottom: 5px; color: #334155;"><strong>Pregunta:</strong> <span style="font-family: monospace; font-size: 1.1em;">${escapeHtml(e.question)}</span></div>
                        <div style="color: #dc2626;"><strong>La teva resposta:</strong> <span style="font-family: monospace;">${escapeHtml(e.answer)}</span></div>
                    </li>
                `).join('')}
                ${errades.length === 0 ? '<li style=\"color: var(--text-muted); font-style: italic;\">Cap errada! Has fet una partida perfecta 🎉</li>' : ''}
            </ul>

            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 30px;">
                <button id="btn-copiar-informe" class="btn-submit" onclick="copiarResultats(); this.innerText='Copiat! ✅'; this.style.backgroundColor='var(--success)'; this.style.borderColor='var(--success)'; setTimeout(() => { this.style.display='none'; }, 3000);" style="background-color: #334155;">
                    🔒 Copiar codi
                </button>
                <button class="btn-submit" onclick="finalitzar()" style="background-color: var(--text-muted);">
                    🔄 Tornar a jugar
                </button>
            </div>
        </div>
    `;

    summaryScreen.style.display = 'block';
}
// ============================================================
// SISTEMA DE VERIFICACIÓ ANTIFRAU
// ============================================================

async function copiarResultats() {
    let randomStr = "";
    const caracters = "abcdefghijklmnopqrstuvwxyz"; 
    for (let i = 0; i < 3; i++) {
        randomStr += caracters.charAt(Math.floor(Math.random() * caracters.length));
    }

    const ara = new Date();
    const dia = String(ara.getDate()).padStart(2, '0');
    const mes = String(ara.getMonth() + 1).padStart(2, '0');
    const dateStr = dia + mes;

    const hora = String(ara.getHours()).padStart(2, '0');
    const minuts = String(ara.getMinutes()).padStart(2, '0');
    
    // 🟢 CORRECCIÓ 7: Afegim els segons per evitar trampes dins el mateix minut
    const segons = String(ara.getSeconds()).padStart(2, '0');
    const timeStr = hora + minuts + segons;

    const notaSobre10 = calculaNotaSobre10();
    const notaFormatada = notaSobre10.toFixed(2).padStart(5, '0').replace('.', ',');

    const notaSencera = Math.round(notaSobre10 * 100);
    const primerCaracterRand = randomStr.charAt(0);
    const valorAscii = primerCaracterRand.charCodeAt(0);

    // Sumem també els segons a la matemàtica modular
    const sumaControl = notaSencera + parseInt(dia, 10) + parseInt(mes, 10) + parseInt(hora, 10) + parseInt(minuts, 10) + parseInt(segons, 10) + valorAscii;
    
    const lletresControl = "TRWAGMYFPDXBNJZSQVHLCKE";
    const lletraAssignada = lletresControl.charAt(sumaControl % 23);

    const nomFitxer = window.location.pathname.split('/').pop().replace('.html', '');

    const output = `${lletraAssignada}${randomStr}-${dateStr}-${timeStr}-${notaFormatada}-${nomFitxer}`;
    console.log("Codi generat per al professor:", output);

    function mostrarExit() {
        const btnCopiar = document.getElementById('btn-copiar');
        if (btnCopiar) {
            btnCopiar.innerText = "Copiat! ✅";
            btnCopiar.style.backgroundColor = "var(--success)";
            btnCopiar.style.borderColor = "var(--success)";
            setTimeout(() => { btnCopiar.style.display = "none"; }, 3000);
        }
    }

    // 🟢 CORRECCIÓ 8: Eliminat el fallback amb textarea oculta (document.execCommand)
    // que Google Safe Browsing detectava com a Clipboard Hijacking.
    // Ara: API moderna + prompt() natiu com a fallback segur.
    try {
        await navigator.clipboard.writeText(output);
        mostrarExit();
    } catch (err) {
        prompt("Copia aquest codi i envia'l al professor:", output);
    }
}
