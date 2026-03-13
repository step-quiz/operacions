/**
 * ============================================================================
 * PROJECTE: Vocabulari Matemàtic
 * FITXER: js/vocabulari/vocabulari.js
 * ROL: Controlador principal del joc. Gestiona l'estat, renderitza el DOM
 *      i coordina els dos modes (A: drag & drop, B: escriptura lliure).
 * ARQUITECTURA:
 * - Cap global implícita: tot encapsulat en l'àmbit d'aquest mòdul.
 * - Cap dependència de game-core.js, utils.js ni shared.css.
 * - Llegeix la configuració de la URL (?modalitat=B&ops=6&intents=3).
 * - Usa VocabFigures (dades) i VocabEngine (lògica pura).
 * DEPENDÈNCIES: vocabulari-figures.js, vocabulari-engine.js
 * ============================================================================
 */

(function () {
    'use strict';

    // =========================================================================
    // CONFIG — paràmetres URL amb fallbacks i límits defensius
    // =========================================================================
    const _p         = new URLSearchParams(window.location.search);

    const MODALITAT  = (_p.get('modalitat') || 'A').toUpperCase() === 'B' ? 'B' : 'A';
    const TOTAL_OPS  = Math.min(30, Math.max(1, parseInt(_p.get('ops')     || '4',  10) || 4));
    const MAX_INTENTS= Math.min(10, Math.max(1, parseInt(_p.get('intents') || '4',  10) || 4));
    const TOTAL_SESS = Math.min(20, Math.max(1, parseInt(_p.get('sessions')|| '1',  10) || 1));

    // Paleta de fons rotativa entre figures
    const BG_COLORS = [
        '#f8fafc', '#eff6ff', '#f0fdf4', '#fefce8', '#fff1f2',
        '#f5f3ff', '#ecfeff', '#fdf4ff', '#fffbeb', '#faf5ff'
    ];

    // =========================================================================
    // ESTAT
    // =========================================================================
    let _figures       = [];   // llista ordenada de figures per a la partida
    let _figActual     = null;
    let _etTotal       = 0;    // total d'etiquetes de la figura actual
    let _etOK          = 0;    // etiquetes col·locades correctament
    let _writeIdx      = 0;    // índex del mode B
    let _intents       = 0;    // intents restants
    let _punts         = 0;    // punts de la sessió actual
    let _puntsTotal    = [];   // punts per sessió (per al resum)
    let _historial     = [];   // [{pregunta, resposta, ok}]
    let _sessio        = 0;    // sessió actual (0-indexed)
    let _op            = 0;    // operació actual dins la sessió (0-indexed)
    let _isPenalizing  = false;
    let _isTransiting  = false;

    // =========================================================================
    // REFS DOM — inicialitzades a init()
    // =========================================================================
    let els = {};

    // =========================================================================
    // INIT
    // =========================================================================
    function init() {
        els = {
            body:            document.body,
            gameScreen:      document.getElementById('game-screen'),
            summaryScreen:   document.getElementById('summary-screen'),
            sessionDisplay:  document.getElementById('session-display'),
            lvlDisplay:      document.getElementById('lvl-display'),
            scoreDisplay:    document.getElementById('score-display'),
            attemptsDisplay: document.getElementById('attempts-display'),
            figureSvg:       document.getElementById('figure-svg'),
            wordPool:        document.getElementById('word-pool'),
            writePanel:      document.getElementById('write-panel'),
            writeInput:      document.getElementById('write-input'),
            btnSubmitWrite:  document.getElementById('btn-submit-write'),
            writeProgress:   document.getElementById('write-progress'),
            typoWarning:     document.getElementById('typo-warning'),
            contextInstr:    document.getElementById('context-instruction'),
            miniOverlay:     document.getElementById('mini-overlay'),
            miniIcon:        document.getElementById('mini-icon'),
            miniText:        document.getElementById('mini-text'),
            miniPoints:      document.getElementById('mini-points'),
            dragGhost:       document.getElementById('drag-ghost'),
        };

        // Listener Enter per al mode B
        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && MODALITAT === 'B') {
                if (!_isTransiting) {
                    e.preventDefault();
                    _checkWrite();
                }
            }
        });

        _startGame();
    }

    // =========================================================================
    // GAME LOOP
    // =========================================================================
    function _startGame() {
        _sessio      = 0;
        _puntsTotal  = [];
        _historial   = [];
        _startSession();
    }

    function _startSession() {
        _op    = 0;
        _punts = 0;

        // Genera l'ordre de figures: barrejat, repetint si cal
        const all = VocabFigures.all;
        let ordre = VocabEngine.shuffle(all);
        while (ordre.length < TOTAL_OPS) {
            ordre = [...ordre, ...VocabEngine.shuffle(all)];
        }
        _figures = ordre;

        _showScreen('game-screen');
        _buildLevel();
    }

    function _buildLevel() {
        _intents      = MAX_INTENTS;
        _isTransiting = false;
        _isPenalizing = false;
        _etOK         = 0;
        _writeIdx     = 0;

        _figActual = _figures[_op % _figures.length];
        _etTotal   = _figActual.etiquetes.length;

        // Fons rotatiu
        const idx = (_sessio * TOTAL_OPS + _op) % BG_COLORS.length;
        els.body.style.backgroundColor = BG_COLORS[idx];

        els.typoWarning.classList.remove('visible');
        els.contextInstr.innerText = '';
        els.contextInstr.classList.remove('error');

        _updateHeader();
        _renderFigura();

        if (MODALITAT === 'A') _setupModeA();
        else                   _setupModeB();
    }

    function _finishLevel(exhausted = false) {
        _isTransiting = true;

        const fails  = MAX_INTENTS - _intents;
        const points = exhausted ? 0 : Math.max(0, 10 - fails * 2);
        _punts += points;
        els.scoreDisplay.innerText = `Punts: ${_punts}`;

        // Si s'han esgotat els intents, mostra totes les etiquetes
        if (exhausted) {
            _figActual.etiquetes.forEach(et => {
                const dz = document.getElementById(`dz-${et.id}`);
                if (dz && !dz.classList.contains('dz-correct')) {
                    dz.querySelector('text.dz-label').textContent = et.text;
                    dz.classList.add('dz-wrong');
                }
            });
        }

        const wait = _showMiniOverlay(points);
        setTimeout(() => {
            _hideMiniOverlay();
            if (_op + 1 >= TOTAL_OPS) {
                _endSession();
            } else {
                _op++;
                _buildLevel();
            }
        }, wait);
    }

    function _endSession() {
        _puntsTotal.push(_punts);

        if (_sessio + 1 >= TOTAL_SESS) {
            _renderSummary();
            _showScreen('summary-screen');
        } else {
            // Sessió intermèdia: mostra breu missatge i continua
            _sessio++;
            _startSession();
        }
    }

    // =========================================================================
    // UI HEADER
    // =========================================================================
    function _updateHeader() {
        els.sessionDisplay.innerText  = `Sessió ${_sessio + 1} de ${TOTAL_SESS}`;
        els.lvlDisplay.innerText      = `Figura ${_op + 1} de ${TOTAL_OPS}`;
        els.scoreDisplay.innerText    = `Punts: ${_punts}`;
        els.attemptsDisplay.innerText = `Intents: ${_intents}`;
        els.attemptsDisplay.className = 'attempts-counter' +
            (_intents < 3 ? ' danger' : '');
    }

    // =========================================================================
    // RENDER SVG + DROP-ZONES
    // =========================================================================
    function _renderFigura() {
        const fig  = _figActual;
        const DZ_W = 100, DZ_H = 26;

        let dzHTML = '';
        fig.etiquetes.forEach(et => {
            const x  = et.lx - DZ_W / 2;
            const y  = et.ly - DZ_H / 2;

            dzHTML += `
            <line x1="${et.px}" y1="${et.py}" x2="${et.lx}" y2="${et.ly}"
                  stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 3"
                  pointer-events="none"/>
            <circle cx="${et.px}" cy="${et.py}" r="3.5" fill="#94a3b8" pointer-events="none"/>
            <g class="drop-zone" id="dz-${et.id}" data-word="${et.text}">
                <rect class="dz-bg" x="${x}" y="${y}" width="${DZ_W}" height="${DZ_H}" rx="5"/>
                <text class="dz-label" x="${et.lx}" y="${et.ly}">?</text>
            </g>`;
        });

        els.figureSvg.innerHTML = fig.svg + dzHTML;

        if (MODALITAT === 'A') {
            els.figureSvg.querySelectorAll('.drop-zone').forEach(dz => {
                dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('dz-over'); });
                dz.addEventListener('dragleave', () => dz.classList.remove('dz-over'));
                dz.addEventListener('drop',      e => {
                    e.preventDefault();
                    dz.classList.remove('dz-over');
                    _handleDrop(dz, e.dataTransfer.getData('text/plain'));
                });
            });
        } else {
            _highlightWriteTarget();
        }
    }

    // =========================================================================
    // PENALITZACIÓ
    // =========================================================================
    function _penalize() {
        if (_isPenalizing || _isTransiting) return;
        _isPenalizing = true;

        els.attemptsDisplay.classList.add('danger');
        setTimeout(() => {
            _intents--;
            _updateHeader();
            if (_intents <= 0) {
                _isTransiting = true;
                _finishLevel(true);
            }
            _isPenalizing = false;
        }, 800);
    }

    // =========================================================================
    // MODE A — DRAG & DROP
    // =========================================================================
    function _setupModeA() {
        els.wordPool.style.display   = 'flex';
        els.writePanel.style.display = 'none';
        els.wordPool.innerHTML       = '';

        const paraules = VocabEngine.shuffle([..._figActual.etiquetes]);
        paraules.forEach(et => {
            const chip        = document.createElement('div');
            chip.className    = 'word-chip';
            chip.textContent  = et.text;
            chip.draggable    = true;
            chip.dataset.word = et.text;

            chip.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', et.text);
                setTimeout(() => chip.classList.add('dragging'), 0);
            });
            chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
            chip.addEventListener('touchstart', _onTouchStart, { passive: false });

            els.wordPool.appendChild(chip);
        });

        els.contextInstr.innerText = 'Arrossega cada paraula al lloc correcte de la figura';
    }

    function _handleDrop(dzEl, word) {
        if (_isTransiting || _isPenalizing) return;
        const expected = dzEl.dataset.word;

        if (word === expected) {
            dzEl.querySelector('text.dz-label').textContent = word;
            dzEl.classList.add('dz-correct');
            dzEl.style.pointerEvents = 'none';

            const chip = [...els.wordPool.querySelectorAll('.word-chip')]
                            .find(c => c.dataset.word === word);
            if (chip) chip.classList.add('used');

            _historial.push({ pregunta: `Vocabulari: ${word}`, resposta: word, ok: true });
            _etOK++;
            if (_etOK >= _etTotal) _finishLevel();

        } else {
            dzEl.classList.add('dz-wrong');
            setTimeout(() => dzEl.classList.remove('dz-wrong'), 600);
            _historial.push({ pregunta: `Vocabulari (${dzEl.dataset.word})`, resposta: word, ok: false });
            _penalize();
        }
    }

    // ---- Touch drag ----
    let _touchChip = null;

    function _onTouchStart(e) {
        if (_isTransiting) return;
        e.preventDefault();
        const touch   = e.touches[0];
        _touchChip    = e.currentTarget;
        const ghost   = els.dragGhost;
        ghost.textContent = _touchChip.dataset.word;
        ghost.style.display = 'block';
        _moveGhost(touch.clientX, touch.clientY);

        document.addEventListener('touchmove',   _onTouchMove,   { passive: false });
        document.addEventListener('touchend',    _onTouchEnd,    { passive: false });
        document.addEventListener('touchcancel', _onTouchCancel, { passive: false });
    }

    function _onTouchMove(e) {
        e.preventDefault();
        _moveGhost(e.touches[0].clientX, e.touches[0].clientY);
    }

    function _moveGhost(cx, cy) {
        const g = els.dragGhost;
        g.style.left = (cx - g.offsetWidth / 2) + 'px';
        g.style.top  = (cy - 20) + 'px';
    }

    function _onTouchEnd(e) {
        els.dragGhost.style.display = 'none';
        document.removeEventListener('touchmove',   _onTouchMove);
        document.removeEventListener('touchend',    _onTouchEnd);
        document.removeEventListener('touchcancel', _onTouchCancel);

        if (!_touchChip) return;
        const touch = e.changedTouches[0];
        const el    = document.elementFromPoint(touch.clientX, touch.clientY);
        const dz    = el ? el.closest('.drop-zone') : null;
        if (dz) _handleDrop(dz, _touchChip.dataset.word);
        _touchChip = null;
    }

    function _onTouchCancel() {
        els.dragGhost.style.display = 'none';
        _touchChip = null;
        document.removeEventListener('touchmove',   _onTouchMove);
        document.removeEventListener('touchend',    _onTouchEnd);
        document.removeEventListener('touchcancel', _onTouchCancel);
    }

    // =========================================================================
    // MODE B — ESCRIPTURA LLIURE
    // =========================================================================
    function _setupModeB() {
        els.wordPool.style.display   = 'none';
        els.writePanel.style.display = 'flex';
        _writeIdx = 0;
        els.typoWarning.classList.remove('visible');
        els.contextInstr.innerText = 'Escriu la paraula que descriu cada element assenyalat';
        _showWriteStep();
    }

    function _showWriteStep() {
        if (_writeIdx >= _etTotal) { _finishLevel(); return; }

        els.writeProgress.innerText = `Paraula ${_writeIdx + 1} de ${_etTotal}`;
        els.writeInput.value = '';
        els.typoWarning.classList.remove('visible');
        _highlightWriteTarget();
        els.writeInput.focus();
    }

    function _highlightWriteTarget() {
        els.figureSvg.querySelectorAll('.drop-zone').forEach((dz, i) => {
            if (i === _writeIdx && !dz.classList.contains('dz-correct')) {
                const rect = dz.querySelector('rect.dz-bg');
                if (rect) {
                    rect.setAttribute('stroke', 'var(--primary)');
                    rect.setAttribute('stroke-width', '2.5');
                    rect.setAttribute('stroke-dasharray', 'none');
                    rect.style.fill = 'var(--primary-light)';
                }
            }
        });
    }

    function _checkWrite() {
        if (_isTransiting || _isPenalizing) return;
        const raw = els.writeInput.value.trim();
        if (raw === '') return;

        const et      = _figActual.etiquetes[_writeIdx];
        const resultat = VocabEngine.avaluaResposta(raw, et.text);

        if (resultat === 'correct') {
            els.typoWarning.classList.remove('visible');
            _historial.push({ pregunta: `Vocabulari: ${et.text}`, resposta: raw, ok: true });

            const dz = document.getElementById(`dz-${et.id}`);
            if (dz) {
                dz.querySelector('text.dz-label').textContent = et.text;
                dz.classList.add('dz-correct');
            }

            _etOK++;
            _writeIdx++;
            setTimeout(() => _showWriteStep(), 400);

        } else if (resultat === 'typo') {
            els.typoWarning.classList.add('visible');
            els.writeInput.value = '';
            els.writeInput.focus();

        } else {
            els.typoWarning.classList.remove('visible');
            _historial.push({ pregunta: `Vocabulari: ${et.text}`, resposta: raw, ok: false });

            const dz = document.getElementById(`dz-${et.id}`);
            if (dz) {
                dz.classList.add('dz-wrong');
                setTimeout(() => dz.classList.remove('dz-wrong'), 600);
            }
            els.btnSubmitWrite.classList.add('error-shake');
            setTimeout(() => els.btnSubmitWrite.classList.remove('error-shake'), 200);

            _penalize();
            els.writeInput.value = '';
            els.writeInput.focus();
        }
    }

    // =========================================================================
    // MINI OVERLAY (entre figures)
    // =========================================================================
    function _showMiniOverlay(points) {
        const overlay = els.miniOverlay;
        if (!overlay) return points > 0 ? 1500 : 3000;

        if (points > 0) {
            els.miniIcon.innerText   = '⭐';
            els.miniText.innerText   = 'Molt bé!';
            els.miniText.style.color = '#047857';
            els.miniPoints.innerText = `+${points} punts`;
            els.miniPoints.style.color = '#059669';
        } else {
            els.miniIcon.innerText   = '❌';
            els.miniText.innerText   = 'Intents esgotats';
            els.miniText.style.color = 'var(--danger)';
            els.miniPoints.innerText = '0 punts';
            els.miniPoints.style.color = 'var(--danger)';
        }

        overlay.style.display = 'flex';
        return points > 0 ? 1500 : 3000;
    }

    function _hideMiniOverlay() {
        if (els.miniOverlay) els.miniOverlay.style.display = 'none';
    }

    // =========================================================================
    // RESUM FINAL
    // =========================================================================
    function _renderSummary() {
        const totalPossible = TOTAL_OPS * TOTAL_SESS;
        const totalPunts    = _puntsTotal.reduce((a, b) => a + b, 0);
        const nota          = (totalPunts / totalPossible).toFixed(1).replace('.', ',');

        const encerts = _historial.filter(h => h.ok);
        const errades = _historial.filter(h => !h.ok);

        const sessionsHTML = _puntsTotal.map((p, i) => {
            const n = (p / TOTAL_OPS).toFixed(1).replace('.', ',');
            return `<div class="session-line">
                <span>Sessió ${i + 1}</span>
                <span>${n}</span>
            </div>`;
        }).join('');

        els.summaryScreen.innerHTML = `
            <h2>🎉 Activitat completada!</h2>
            <div class="summary-layout">
                <div class="trophy-icon">🏆</div>
                <div class="summary-data">
                    ${sessionsHTML}
                    <div style="margin-top:16px; font-size:0.9em; color:var(--text-muted);">Nota final:</div>
                    <div style="font-size:1.6em; font-weight:bold; color:var(--success); font-family:monospace;">
                        ${nota} / 10
                    </div>
                </div>
            </div>

            <div style="margin:20px 0; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:8px;padding:12px 20px;text-align:center;">
                    <div style="font-size:1.8em;font-weight:800;color:#059669;">${encerts.length}</div>
                    <div style="font-size:0.8em;color:var(--text-muted);">encerts</div>
                </div>
                <div style="background:#fef2f2;border:2px solid #fecaca;border-radius:8px;padding:12px 20px;text-align:center;">
                    <div style="font-size:1.8em;font-weight:800;color:#dc2626;">${errades.length}</div>
                    <div style="font-size:0.8em;color:var(--text-muted);">errades</div>
                </div>
            </div>

            <button class="btn-restart" onclick="location.reload()">🔄 Tornar a jugar</button>
        `;
    }

    // =========================================================================
    // GESTIÓ DE PANTALLES
    // =========================================================================
    function _showScreen(id) {
        ['game-screen', 'summary-screen'].forEach(sid => {
            const el = document.getElementById(sid);
            if (el) el.style.display = 'none';
        });
        const target = document.getElementById(id);
        if (target) target.style.display = 'block';
    }

    // =========================================================================
    // ARRENCADA
    // =========================================================================
    document.addEventListener('DOMContentLoaded', init);

    // Exposem _checkWrite perquè el botó OK de l'HTML pugui cridar-la
    window._vocabCheckWrite = function () { _checkWrite(); };

})();
