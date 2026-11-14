/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/game-core.js
 *
 * ── FORMAT DE CODI v2 ───────────────────────────────────────────────────────
 *
 *   Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR  (59-79 chars)
 *
 *   L     1   Lletra de control antifrau
 *   sss   3   Salt aleatori (3 lletres minúscules)
 *   DDMM  4   Data
 *   HHMM  4   Hora i minuts
 *   EE    2   Codi d'exercici (taula EXERCISE_CODES de js/exercise-codes.js)
 *   D     1   Dificultat: 0=sense nivells, 1-3=nivell triat
 *   S     1   Sessions completades (1-5)
 *   QQ    2   Preguntes per sessió (01-10)
 *   NNN   3   Nota x10 arrodonida (000-100). Ex: 7,5 -> 075
 *   RRR 30-50 Resultats per pregunta, sessió rere sessió (S × QQ, mínim 30):
 *               1=encertada al 1r intent
 *               2=encertada al 2n intent
 *               3=encertada al 3r intent o posterior
 *               4=fallada (intents esgotats)
 *               0=posicio buida
 *
 * ── CHECKSUM ────────────────────────────────────────────────────────────────
 *   lletraNova() de js/codi-verificacio.js: cobreix la nota, la data, l'hora
 *   i també l'exercici, la dificultat, les sessions, les preguntes i els
 *   resultats (des del 18/10/2026; la fórmula d'abans només cobria els tres
 *   primers). Detalls al capdamunt d'aquell fitxer.
 *
 * ── FINAL DE CADA PREGUNTA ──────────────────────────────────────────────────
 *   acabaPregunta(punts) suma els punts (sumaPunts), mostra la franja «Molt bé!
 *   +N punts» / «Intents esgotats» amb el botó «Següent» (js/seguent.js) i, quan
 *   l'alumne el prem, passa a la pregunta següent o acaba la sessió. Mai no es
 *   passa de pregunta sol. Els punts surten de puntsDeLaPregunta() (10 menys 2
 *   per error, js/punts.js) i sumaPunts() és l'única manera de sumar-los a
 *   state.sessionScore (tests/check-repo.js ho comprova).
 *
 * ── COM REGISTRAR RESULTATS PER PREGUNTA ────────────────────────────────────
 *   Cridar recordResult(codi) en finalitzar cada pregunta:
 *
 *   // Resposta CORRECTA (state.attemptsLeft sense decrementar per aquest intent):
 *   recordResult(Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3));
 *
 *   // Fallo definitiu:
 *   recordResult(4);
 *
 * ── DIFICULTAT ──────────────────────────────────────────────────────────────
 *   Es llegeix automaticament del parametre URL ?nivell=N.
 *   Jocs sense nivells no han de fer res (D=0 per defecte).
 *
 * ── MODE «ESVAÏMENT» (?esvaiment=1, js/esvaiment.js) ────────────────────────
 *   No es genera mai el codi (copiarResultats() surt de seguida i el botó
 *   s'amaga) i la pantalla final mostra estrelles en lloc de la nota.
 *
 * ── COM S'USA (mòdul ES) ────────────────────────────────────────────────────
 *   import { state, startGame, recordResult } from '../game-core.js';
 *   - L'estat de la partida és a `state` (state.attemptsLeft, state.sessionScore…).
 *   - El joc ha d'exposar a window les funcions que aquest mòdul crida:
 *       Object.assign(window, { buildLevel });            // obligatòria
 *       Object.assign(window, { checkCurrentCell });      // si fa servir el teclat
 *     i cridar sempre window.buildLevel() (les sessions fixes l'embolcallen).
 * ============================================================================
 */

import { TOTAL_SESSIONS, TOTAL_OPERATIONS, MAX_ENLLOC_MITJANA, MAX_INTENTS } from './config.js';
import { EXERCISE_CODES } from './exercise-codes.js'; // taula única compartida amb l'analitzador
import { avisaCodiLlest, generaCodi, obreFinestraCodi, posaIconaCodi } from './codi-finestra.js'; // icona i finestra del codi
import { FixedSessions } from './fixed-sessions.js';
import { ESVAIMENT } from './esvaiment.js'; // mode «Esvaïment» (?esvaiment=1): no dona codi
import { PUNTS_MAX, puntsAmbErrors, validaPunts } from './punts.js'; // la regla única dels punts
import { mostraSeguent } from './seguent.js'; // la franja del final de pregunta amb el botó «Següent»

// ── NOMBRE MÀXIM DE RESULTATS AL CODI ────────────────────────────────────────
// El generador d'enllaços permet fins a 5 sessions × 10 preguntes = 50.
export const MAX_RESULTS = 50;

// ── DIFICULTAT (llegida automaticament de l'URL) ─────────────────────────────
const _urlNivell = new URLSearchParams(window.location.search).get('nivell');

// ── PALETA DE FONS ───────────────────────────────────────────────────────────
export const bgColors = [
    '#f8fafc',
    '#eff6ff',
    '#f0fdf4',
    '#fefce8',
    '#fff1f2',
    '#f5f3ff',
    '#ecfeff',
    '#fdf4ff',
    '#fffbeb',
    '#faf5ff',
];

// ── ESTAT COMPARTIT DEL JOC ──────────────────────────────────────────────────
// Tot l'estat en un sol objecte perquè els jocs el puguin modificar
// (state.attemptsLeft--, state.sessionScore += …): una variable importada d'un
// altre mòdul es pot llegir però no reassignar.
export const state = {
    currentDifficulty: _urlNivell ? Math.min(Math.max(parseInt(_urlNivell, 10) || 0, 0), 3) : 0,
    sessionHistory: [],
    sessionResults: [], // codis per pregunta [1,2,3,4,…] (màxim MAX_RESULTS)
    currentSession: 0,
    currentOperation: 0,
    sessionScore: 0,
    sessionScores: [],
    attemptsLeft: 0,
    isTransitioning: false,
    preguntesFetes: 0, // preguntes acabades (per dir quantes en falten abans de donar el codi)
};

// ── VALIDACIO DE CONFIGURACIO ────────────────────────────────────────────────
export function validateConfig() {
    const errors = [];
    const isPosInt = n => Number.isInteger(n) && n > 0;
    if (!isPosInt(TOTAL_SESSIONS)) errors.push('TOTAL_SESSIONS ha de ser un enter positiu.');
    if (!isPosInt(TOTAL_OPERATIONS)) errors.push('TOTAL_OPERATIONS ha de ser un enter positiu.');
    if (!isPosInt(MAX_INTENTS)) errors.push('MAX_INTENTS ha de ser un enter positiu.');
    if (![0, 1].includes(MAX_ENLLOC_MITJANA)) errors.push('MAX_ENLLOC_MITJANA ha de ser 0 o 1.');
    if (errors.length) {
        const msg = 'Configuració invàlida:\n- ' + errors.join('\n- ');
        console.error(msg);
        alert(msg);
        throw new Error(msg);
    }
}

// ── GESTIO DE PANTALLES ──────────────────────────────────────────────────────
let _allScreenIds = ['game-screen', 'session-end-screen', 'final-screen'];
export function registerScreens(ids) {
    _allScreenIds = ids;
}
export function showScreen(id) {
    _allScreenIds.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
}

// ── INICI I FI DEL JOC ──────────────────────────────────────────────────────
export function startGame() {
    // Sessions fixes (?fixed=A/B/C): cada crida a buildLevel() torna a sembrar
    // l'atzar amb (sessió, pregunta). Així una pregunta no depèn del que l'alumne
    // hagi fet a les anteriors i és la mateixa per a tothom (js/fixed-sessions.js).
    if (FixedSessions) FixedSessions.wrap('buildLevel', () => `s${state.currentSession}-q${state.currentOperation}`);
    state.currentSession = 0;
    state.sessionScores = [];
    state.sessionHistory = [];
    state.sessionResults = [];
    state.preguntesFetes = 0;
    showScreen('game-screen');
    startSession();
}

export function startSession() {
    state.currentOperation = 0;
    state.sessionScore = 0;
    if (typeof window.buildLevel === 'function') window.buildLevel();
}

export function endSession() {
    state.sessionScores.push(state.sessionScore);
    if (state.currentSession + 1 >= TOTAL_SESSIONS) {
        // El codi es genera ara, un sol cop: la icona «Codi» i el botó «Copiar codi» mostren sempre aquest
        if (codiFinal()) avisaCodiLlest();
        renderFinalSummary();
        showScreen('final-screen');
    } else {
        showScreen('session-end-screen');
        const titleEl = document.getElementById('session-end-title');
        if (titleEl) titleEl.innerText = `Sessió ${state.currentSession + 1} completada`;
        const btnEl = document.getElementById('btn-next-session');
        if (btnEl) {
            // [FIX M7] Text temporal durant l'espera d'1s
            btnEl.style.display = 'none';
            const waitMsg = document.createElement('div');
            waitMsg.id = 'session-wait-msg';
            waitMsg.style.cssText = 'color:var(--text-muted);font-size:0.95em;margin-top:10px;text-align:center;';
            waitMsg.innerText = 'Preparant sessió següent…';
            btnEl.parentNode.insertBefore(waitMsg, btnEl.nextSibling);
            setTimeout(() => {
                btnEl.style.display = 'inline-block';
                state.isTransitioning = false;
                const msg = document.getElementById('session-wait-msg');
                if (msg) msg.remove();
            }, 1000);
        }
    }
}

export function startNextSession() {
    state.currentSession++;
    showScreen('game-screen');
    startSession();
}

// ── PUNTS DE CADA PREGUNTA ───────────────────────────────────────────────────
// Cada pregunta val com a màxim MAX_PUNTS_PREGUNTA (10) punts i cada error en treu 2
// (js/punts.js). La puntuació màxima d'una sessió és TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA.
export const MAX_PUNTS_PREGUNTA = PUNTS_MAX;
export { puntsAmbErrors };

/** Punts de la pregunta actual segons els intents gastats: 10, 8, 6… fins a 0. */
export function puntsDeLaPregunta() {
    return puntsAmbErrors(MAX_INTENTS - state.attemptsLeft);
}

/**
 * L'única manera de sumar punts a la sessió. Rebutja els valors que no són un enter
 * de 0 a 10 (els porta dins del marge i ho diu a la consola) i posa al dia el marcador.
 * @returns {number} els punts sumats
 */
export function sumaPunts(punts) {
    const v = validaPunts(punts);
    if (!v.ok) console.error(`sumaPunts: ${punts} no són uns punts vàlids (0-${PUNTS_MAX}); se'n compten ${v.punts}`);
    state.sessionScore += v.punts;
    const marcador = document.getElementById('score-display');
    if (marcador) marcador.textContent = `Punts: ${state.sessionScore}`;
    return v.punts;
}

/**
 * Final de la pregunta actual: suma els punts, tanca el teclat i mostra la franja amb
 * el botó «Següent» (o «Veure resultats» a l'última pregunta de la sessió). Quan
 * l'alumne el prem, passa a la pregunta següent o crida `alFinal` (endSession).
 * @param {number} punts         punts de la pregunta (normalment puntsDeLaPregunta(), o 0)
 * @param {object} [o]
 * @param {boolean} [o.encert]   cert si l'ha resolta (per defecte, punts > 0)
 * @param {Function} [o.alFinal] què fer després de l'última pregunta (per defecte, endSession)
 * @param {Function} [o.alSeguent] com es munta la pregunta següent (per defecte, window.buildLevel)
 * @param {Element} [o.lloc]     on va la franja (per defecte, al final de #game-screen)
 * @param {string} [o.titol]     text principal, si no és el de sempre
 */
export function acabaPregunta(punts, { encert, alFinal = endSession, alSeguent, lloc, titol } = {}) {
    const sumats = sumaPunts(punts);
    state.preguntesFetes++;
    state.isTransitioning = true;
    hideCustomKeyboard();
    const ultima = state.currentOperation + 1 >= TOTAL_OPERATIONS;
    mostraSeguent({
        punts: sumats,
        encert: encert ?? sumats > 0,
        ultima,
        lloc,
        titol,
        onSeguent: () => {
            if (ultima) {
                alFinal();
            } else {
                state.currentOperation++;
                state.isTransitioning = false;
                if (alSeguent) alSeguent();
                else window.buildLevel();
            }
        },
    });
}

// ── NOTA FINAL ───────────────────────────────────────────────────────────────
export function calculaNotaSobre10() {
    if (!state.sessionScores.length) return 0;
    const maxSessio = TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA; // punts màxims d'1 sessió
    if (MAX_ENLLOC_MITJANA === 1) {
        // Nota = millor sessió, normalitzada sobre 10
        return Number(((Math.max(...state.sessionScores) / maxSessio) * 10).toFixed(1));
    } else {
        // Nota = mitjana de totes les sessions, normalitzada sobre 10
        return Number(
            ((state.sessionScores.reduce((a, s) => a + s, 0) / (TOTAL_SESSIONS * maxSessio)) * 10).toFixed(1)
        );
    }
}

// Mode «Esvaïment»: sense nota ni codi. Una estrella per exercici fet sense errors
// i fins on ha arribat l'alumne (js/esvaiment.js).
function resumEsvaiment() {
    const r = ESVAIMENT.registre;
    const n = ESVAIMENT.estrelles();
    const estrelles = r.map(x => (x.senseErrors ? '★' : '☆')).join(' ');
    const ultim = r[r.length - 1];
    let fins = '';
    if (ultim && ultim.senseErrors && ultim.nAlumne >= ultim.nPassos)
        fins = 'Ja ho fas tot sol! L’últim exercici l’has fet sencer.';
    else if (ultim) fins = `A l’últim exercici has fet tu ${ultim.nAlumne} de ${ultim.nPassos} passos.`;
    return (
        `<div class="esv-resum">` +
        `<div class="esv-estrelles" aria-label="${n} de ${r.length} exercicis sense errors">${estrelles}</div>` +
        `<div class="esv-linia">${n} de ${r.length} sense errors.</div>` +
        (fins ? `<div class="esv-linia">${fins}</div>` : '') +
        `<div class="esv-nota">Mode esvaïment (exemples resolts): aquesta activitat no dona codi.</div>` +
        `</div>`
    );
}

export function renderFinalSummary() {
    if (ESVAIMENT) {
        const el = document.getElementById('final-summary');
        if (el) el.innerHTML = resumEsvaiment();
        return;
    }
    let html = '';
    for (let i = 0; i < state.sessionScores.length; i++) {
        html += `<div class="session-line"><span>Sessió ${i + 1}</span><span>${((state.sessionScores[i] / (TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA)) * 10).toFixed(1).replace('.', ',')}</span></div>`;
    }
    const nota10 = calculaNotaSobre10().toFixed(1).replace('.', ',');
    const textFinal = MAX_ENLLOC_MITJANA === 1 ? 'La sessió amb nota més alta obté:' : 'La nota mitjana és:';
    html += `<div style="margin-top:20px;text-align:left;"><div style="font-size:0.95em;color:var(--text-muted);margin-bottom:5px;">${textFinal}</div><div style="font-size:1.5em;font-weight:bold;color:var(--success);font-family:monospace;">${nota10} / 10</div></div>`;
    const summaryEl = document.getElementById('final-summary');
    if (summaryEl) summaryEl.innerHTML = html;
}

// [FIX A3] Confirmació abans de recarregar
export function finalitzar() {
    if (confirm("Segur que vols tornar a començar? Perdràs el codi si no l'has copiat.")) {
        window.location.reload();
    }
}

// ── INJECCIO HTML COMPARTIT ──────────────────────────────────────────────────
export function injectSharedHTML() {
    const gameScreen = document.getElementById('game-screen');
    const panel = document.querySelector('.panel');
    if (!gameScreen || !panel) return;

    // 1. Teclat numeric
    const kb = document.createElement('div');
    kb.id = 'customKeyboard';
    kb.innerHTML = `<div class="kb-grid"><button class="kb-btn" data-key="7">7</button><button class="kb-btn" data-key="8">8</button><button class="kb-btn" data-key="9">9</button><button class="kb-btn kb-del" data-key="del">⌫</button><button class="kb-btn" data-key="4">4</button><button class="kb-btn" data-key="5">5</button><button class="kb-btn" data-key="6">6</button><button class="kb-btn kb-minus" data-key="-">−</button><button class="kb-btn" data-key="1">1</button><button class="kb-btn" data-key="2">2</button><button class="kb-btn" data-key="3">3</button><button class="kb-btn kb-enter" data-key="enter">→</button><button class="kb-btn kb-zero" data-key="0">0</button></div>`;
    panel.appendChild(kb);

    // 2. Fi de sessio
    const sessionEnd = document.createElement('div');
    sessionEnd.id = 'session-end-screen';
    sessionEnd.innerHTML = `<div class="trophy-icon">👍</div><h2 id="session-end-title">Sessió completada</h2><button class="btn-green" id="btn-next-session" onclick="startNextSession()">Començar sessió següent</button>`;
    panel.appendChild(sessionEnd);

    // 3. Pantalla final
    const finalScreen = document.createElement('div');
    finalScreen.id = 'final-screen';
    finalScreen.style.display = 'none';
    finalScreen.innerHTML = `<div id="final-results"><h2>Resum</h2><div class="final-layout"><div id="final-summary" class="final-summary"></div><div class="trophy-icon">🏆</div></div><div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin-top:25px;"><button class="btn-submit" onclick="if(typeof showHistorySummary==='function')showHistorySummary();" style="background-color:var(--primary);">📋 Informe</button><button id="btn-copiar" class="btn-submit" onclick="if(typeof copiarResultats==='function')copiarResultats();" style="background-color:#334155;">📝 Copiar codi</button><button class="btn-submit" onclick="finalitzar()" style="background-color:var(--text-muted);">🔄 Tornar a jugar</button></div></div>`;
    panel.appendChild(finalScreen);
    if (FixedSessions || ESVAIMENT) finalScreen.querySelector('#btn-copiar').style.display = 'none';

    // 4. Icona «Codi» de dalt a la dreta (no en sessions fixes ni en esvaïment, que no donen codi)
    if (!FixedSessions && !ESVAIMENT) {
        posaIconaCodi(() =>
            _codiFinal ? { codi: _codiFinal } : { falten: TOTAL_SESSIONS * TOTAL_OPERATIONS - state.preguntesFetes }
        );
    }
}

// ── TECLAT NUMERIC CUSTOM ────────────────────────────────────────────────────
export function isTouchDevice() {
    return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}
let _kbActiveInput = null;
let _kbClearOnNext = false;
let _kbTocDelegat = false;

/**
 * Casella que pot fer servir el teclat numèric: un <input> de text o de número dins del panell
 * del joc (.panel). Un joc en pot excloure una amb data-kb="off".
 */
function esCasellaTeclat(el) {
    if (!(el instanceof HTMLInputElement)) return false;
    if (el.type !== 'text' && el.type !== 'number') return false;
    if (el.dataset.kb === 'off') return false;
    return !!el.closest('.panel');
}

// Opcions: allowNegative (tecla −), allowZero (tecla 0), decimalComma (la tecla − passa a ser la
// coma decimal «,»: per a activitats amb respostes decimals i sense nombres negatius) i
// respectMaxLength (el teclat no escriu més caràcters que el maxlength de l'input).
export function initCustomKeyboard(options = {}) {
    const allowNeg = options.allowNegative ?? false;
    const allowZero = options.allowZero ?? true;
    const respectMaxLength = options.respectMaxLength ?? false;
    const grid = document.querySelector('#customKeyboard .kb-grid');
    if (grid) {
        if (!allowNeg) grid.classList.add('kb-no-minus');
        else grid.classList.remove('kb-no-minus');
        if (!allowZero) grid.classList.add('kb-no-zero');
        else grid.classList.remove('kb-no-zero');
    }
    if (options.decimalComma) {
        const minusBtn = document.querySelector('#customKeyboard .kb-minus');
        if (minusBtn) {
            minusBtn.dataset.key = ',';
            minusBtn.textContent = ',';
            minusBtn.classList.remove('kb-minus');
        }
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
                } else _kbActiveInput.value = _kbActiveInput.value.slice(0, -1);
            } else if (key === 'enter') {
                if (typeof window.checkCurrentCell === 'function') window.checkCurrentCell();
            } else if (key === ',') {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                }
                const v = _kbActiveInput.value;
                if (v.includes(',')) return; // una sola coma decimal
                _kbActiveInput.value = v === '' || v === '-' ? v + '0,' : v + ',';
            } else if (key === '-') {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '-';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                } else {
                    const v = _kbActiveInput.value;
                    if (v === '') _kbActiveInput.value = '-';
                    else if (v === '-') _kbActiveInput.value = '';
                }
            } else {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                }
                if (_kbActiveInput.value === '-0') _kbActiveInput.value = '-';
                if (respectMaxLength) {
                    const maxLen = _kbActiveInput.maxLength;
                    if (maxLen > 0 && _kbActiveInput.value.length >= maxLen) return;
                }
                _kbActiveInput.value += key;
            }
        });
    });
    // En tàctils, qualsevol casella numèrica que l'alumne toqui passa a rebre el teclat propi,
    // encara que el joc no l'hagi activada mai amb showCustomKeyboard(). Abans, en tocar la
    // segona casella d'una pregunta (perímetre, exponent…) s'obria el teclat del sistema i el
    // propi continuava escrivint a la primera. Un sol listener per a tota la pàgina, en fase de
    // captura, perquè també valgui per a les caselles que el joc crea a cada pregunta.
    if (!_kbTocDelegat) {
        _kbTocDelegat = true;
        document.addEventListener(
            'pointerdown',
            e => {
                if (!isTouchDevice()) return;
                const inp = e.target instanceof Element ? e.target.closest('input') : null;
                if (!inp || !esCasellaTeclat(inp)) return;
                if (inp.dataset.locked === 'true' || inp.disabled) return;
                e.preventDefault();
                showCustomKeyboard(inp);
            },
            true
        );
    }
    window.addEventListener('orientationchange', () => {
        const kb = document.getElementById('customKeyboard');
        if (!_kbActiveInput || !kb || !kb.classList.contains('kb-visible')) return;
        setTimeout(() => kb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    });
    // [FIX C3] En tàctils, pre-establir inputmode="none" a tots els inputs
    if (isTouchDevice()) {
        document.querySelectorAll('#game-screen input[type="text"], #game-screen input[type="number"]').forEach(inp => {
            inp.setAttribute('inputmode', 'none');
        });
    }
}

// Un input amb data-locked="true" (resposta ja encertada) no s'activa mai.
export function showCustomKeyboard(inp) {
    if (inp && inp.dataset.locked === 'true') return;
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

export function hideCustomKeyboard() {
    const kb = document.getElementById('customKeyboard');
    if (kb) kb.classList.remove('kb-visible');
    if (_kbActiveInput) {
        _kbActiveInput.classList.remove('kb-active-input');
        // Un input bloquejat (data-locked="true") es queda en només lectura
        if (_kbActiveInput.dataset.locked !== 'true') {
            _kbActiveInput.removeAttribute('readonly');
            // [FIX C3] En tàctils, mantenim inputmode="none"
            if (!isTouchDevice()) _kbActiveInput.removeAttribute('inputmode');
        }
    }
    _kbActiveInput = null;
    _kbClearOnNext = false;
}

/** Input on escriu ara el teclat numèric (null si no n'hi ha cap). */
export function getKbActiveInput() {
    return _kbActiveInput;
}

/** Si `inp` és l'input actiu del teclat, el deixa de ser (sense amagar el teclat). */
export function kbReleaseInput(inp) {
    if (_kbActiveInput === inp) {
        inp.classList.remove('kb-active-input');
        _kbActiveInput = null;
    }
}

export function kbMarkForOverwrite(inp) {
    _kbClearOnNext = true;
    inp.classList.add('kb-selected');
}

// ── HISTORIAL (resum textual pantalla final) ─────────────────────────────────
export function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Converteix \frac{num}{den} → num/den per a la visualització en text pla (informe)
export function plainFrac(str) {
    if (!str) return '';
    return String(str).replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
}

export function recordAnswerToHistory(question, answer, isCorrect) {
    state.sessionHistory.push({ question, answer, isCorrect });
}

// ── REGISTRE DE RESULTATS PER PREGUNTA (format v2) ───────────────────────────
/**
 * Registra el resultat d'una pregunta al vector sessionResults.
 * @param {number} attemptCode  1=1r intent ok  2=2n  3=3r o mes  4=fallit
 *
 * Us recomanat:
 *   // Correcta (state.attemptsLeft sense decrementar per aquest intent):
 *   recordResult(Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3));
 *   // Fallada definitiva:
 *   recordResult(4);
 */
export function recordResult(attemptCode) {
    if (state.sessionResults.length < MAX_RESULTS) state.sessionResults.push(attemptCode);
}

export function showHistorySummary() {
    _allScreenIds.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    let sc = document.getElementById('history-summary-screen');
    if (!sc) {
        sc = document.createElement('div');
        sc.id = 'history-summary-screen';
        sc.className = 'panel-content';
        (document.querySelector('.panel') || document.body).appendChild(sc);
    }
    const encerts = state.sessionHistory.filter(i => i.isCorrect);
    const errades = state.sessionHistory.filter(i => !i.isCorrect);

    // [FIX m8] Reescrit amb classes CSS de shared.css (responsive, mantenible)
    const liOk = encerts.length
        ? encerts
              .map(
                  e =>
                      `<li class="history-item history-item--ok"><div class="history-q"><strong>P:</strong> <span class="history-mono">${escapeHtml(e.question)}</span></div><div class="history-a--ok"><strong>R:</strong> <span class="history-mono">${escapeHtml(plainFrac(e.answer))}</span></div></li>`
              )
              .join('')
        : '<li class="history-empty">Cap encert en aquesta partida.</li>';
    const liBad = errades.length
        ? errades
              .map(
                  e =>
                      `<li class="history-item history-item--bad"><div class="history-q"><strong>P:</strong> <span class="history-mono">${escapeHtml(e.question)}</span></div><div class="history-a--bad"><strong>R:</strong> <span class="history-mono">${escapeHtml(plainFrac(e.answer))}</span></div></li>`
              )
              .join('')
        : '<li class="history-empty">Cap errada! Partida perfecta 🎉</li>';

    sc.innerHTML = `<div class="history-summary">
        <h2>Resum de les teves respostes</h2>
        <h3 class="history-title history-title--ok">🟢 Encerts (${encerts.length})</h3>
        <ul class="history-list">${liOk}</ul>
        <h3 class="history-title history-title--bad">🔴 Errades (${errades.length})</h3>
        <ul class="history-list">${liBad}</ul>
        <div class="history-actions">
            <button class="btn-submit" id="btn-copiar-hist" onclick="copiarResultats()" style="background-color:#334155;">📝 Copiar codi</button>
            <button class="btn-submit" onclick="finalitzar()" style="background-color:var(--text-muted);margin-left:12px;">🔄 Tornar a jugar</button>
        </div>
    </div>`;
    // [FIX m9] El botó crida copiarResultats() que ja gestiona el feedback visual internament
    sc.style.display = 'block';
    if (FixedSessions || ESVAIMENT) {
        const b = document.getElementById('btn-copiar-hist');
        if (b) b.style.display = 'none';
    }
}

// ── FUNCIONS CRIDADES DES DE L'HTML ─────────────────────────────────────────
// Els botons que crea injectSharedHTML() i l'informe les criden amb onclick="…",
// que només veu window. Un joc en pot substituir alguna després d'importar
// aquest mòdul (p. ex. window.showHistorySummary = …).
Object.assign(window, { startNextSession, showHistorySummary, copiarResultats, finalitzar });

// ── CODI DE VERIFICACIÓ v2 ───────────────────────────────────────────────────
// Es genera UN SOL COP, en acabar l'última sessió (endSession). La icona «Codi» i el
// botó «Copiar codi» obren la mateixa finestra (js/codi-finestra.js), que mostra
// sempre aquest codi: copiar-lo deu vegades no en fa deu de diferents.
let _codiFinal = null;

/** El codi de la partida (el genera la primera vegada), o null si aquesta modalitat no en dona. */
export function codiFinal() {
    if (FixedSessions || ESVAIMENT) return null;
    if (!_codiFinal) {
        const nomFitxer = window.location.pathname.split('/').pop().replace('.html', '');
        _codiFinal = generaCodi({
            exCode: EXERCISE_CODES[nomFitxer] || 'XX', // 'XX': pàgina sense codi a la taula
            dif: state.currentDifficulty || 0,
            sessions: Math.min(TOTAL_SESSIONS, 5),
            questions: Math.min(TOTAL_OPERATIONS, 10),
            nota10: calculaNotaSobre10(),
            resultats: state.sessionResults.slice(0, MAX_RESULTS),
        });
        console.log('Codi v2:', _codiFinal, '(', _codiFinal.length, 'chars)');
    }
    return _codiFinal;
}

/** Botó «Copiar codi» (pantalla final i informe): obre la finestra del codi. */
// Mode «Esvaïment» i sessions fixes: mai no es genera codi (l'alumne no ha fet sol tots els passos)
export async function copiarResultats() {
    if (ESVAIMENT) return;
    if (FixedSessions) return;
    codiFinal();
    obreFinestraCodi();
}
