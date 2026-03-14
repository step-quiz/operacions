/**
 * ============================================================================
 * PROJECTE: Vocabulari Matemàtic
 * FITXER: js/vocabulari/vocabulari.js
 * ROL: Controlador principal del joc.
 * DEPENDÈNCIES: vocabulari-figures.js, vocabulari-engine.js
 * ============================================================================
 */

(function () {
    'use strict';

    // =========================================================================
    // TEXTS — tots els literals visibles per l'usuari (font de veritat única)
    // [ROUND 1 — creació del bloc TEXTS; inclou FIGURA_HINT per a imatge 2]
    // =========================================================================
    const TEXTS = {
        // Capçalera
        SESSIO_X_DE_Y:   (s, t) => `Sessió ${s} de ${t}`,
        FIGURA_X_DE_Y:   (f, t) => `Figura ${f} de ${t}`,
        PUNTS_X:         (p)    => `Punts: ${p}`,
        INTENTS_X:       (i)    => `Intents: ${i}`,
        // Drop-zones
        DZ_PLACEHOLDER:  '?',
        FIGURA_HINT:     'Com es diu la figura?',  // pista per a l'etiqueta que nombra la figura
        // Instruccions
        INSTR_MODE_A:    'Arrossega cada paraula al lloc correcte de la figura',
        INSTR_MODE_B:    'Escriu la paraula',
        PARAULA_X_DE_Y:  (w, t) => `Paraula ${w} de ${t}`,
        // Mini overlay
        OVERLAY_OK_ICON: '⭐',
        OVERLAY_OK_TEXT: 'Molt bé!',
        OVERLAY_OK_PTS:  (p)    => `+${p} punts`,
        OVERLAY_KO_ICON: '❌',
        OVERLAY_KO_TEXT: 'Intents esgotats',
        OVERLAY_KO_PTS:  '0 punts',
        // Pantalla final
        SUMMARY_TITOL:   '🎉 Activitat completada!',
        SUMMARY_TROFEU:  '🏆',
        SUMMARY_SESSIO:  (i)    => `Sessió ${i}`,
        SUMMARY_NOTA:    'Nota final:',
        SUMMARY_ENCERTS: 'encerts',
        SUMMARY_ERRADES: 'errades',
        BTN_RESTART:     '🔄 Tornar a jugar',
    };

    // =========================================================================
    // CONFIG — URL params amb fallbacks i límits defensius
    // =========================================================================
    const _p          = new URLSearchParams(window.location.search);
    const MODALITAT   = (_p.get('modalitat') || 'A').toUpperCase() === 'B' ? 'B' : 'A';
    const TOTAL_OPS   = Math.min(30, Math.max(1, parseInt(_p.get('ops')      || '4', 10) || 4));
    const MAX_INTENTS = Math.min(10, Math.max(1, parseInt(_p.get('intents')  || '4', 10) || 4));
    const TOTAL_SESS  = Math.min(20, Math.max(1, parseInt(_p.get('sessions') || '1', 10) || 1));

    const DEBUG     = _p.get('debug') === '1';

    const BG_COLORS = [
        '#f8fafc', '#eff6ff', '#f0fdf4', '#fefce8', '#fff1f2',
        '#f5f3ff', '#ecfeff', '#fdf4ff', '#fffbeb', '#faf5ff'
    ];

    // =========================================================================
    // DETECCIÓ DE DISPOSITIU TÀCTIL
    // Utilitzada per ajustar el comportament de l'input en mode B:
    //  - Tàctil: scrollIntoView per garantir que el camp és visible
    //            quan apareix el teclat virtual del sistema.
    //  - No tàctil: focus directe, sense scroll addicional.
    // =========================================================================
    function _isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    // =========================================================================
    // ESTAT
    // =========================================================================
    let _figures      = [];
    let _figActual    = null;
    let _etTotal      = 0;
    let _etOK         = 0;
    let _writeIdx     = 0;
    let _intents      = 0;
    let _punts        = 0;
    let _puntsTotal   = [];
    let _historial    = [];
    let _sessio       = 0;
    let _op           = 0;
    let _isPenalizing = false;
    let _isTransiting = false;

    // =========================================================================
    // REFS DOM
    // =========================================================================
    let els = {};

    // =========================================================================
    // INIT
    // =========================================================================
    function init() {
        els = {
            gameArea:        document.getElementById('game-area'),
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

        // Atributs HTML de l'input per evitar correccions automàtiques
        // que confonen l'alumne (autocomplete, autocorrect iOS, etc.)
        if (els.writeInput) {
            els.writeInput.setAttribute('autocomplete',   'off');
            els.writeInput.setAttribute('autocorrect',    'off');
            els.writeInput.setAttribute('autocapitalize', 'off');
            els.writeInput.setAttribute('spellcheck',     'false');
            els.writeInput.setAttribute('inputmode',      'text');
        }

        // Enter per al mode B (teclat físic)
        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && MODALITAT === 'B' && !_isTransiting) {
                e.preventDefault();
                _checkWrite();
            }
        });

        _startGame();
    }

    // =========================================================================
    // GAME LOOP
    // =========================================================================
    function _startGame() {
        _sessio     = 0;
        _puntsTotal = [];
        _historial  = [];
        _startSession();
    }

    function _startSession() {
        _op    = 0;
        _punts = 0;

        // Ordre aleatori de figures, repetint si cal fins a TOTAL_OPS
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
        els.body.style.backgroundColor =
            BG_COLORS[(_sessio * TOTAL_OPS + _op) % BG_COLORS.length];

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
        els.scoreDisplay.innerText = TEXTS.PUNTS_X(_punts);

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
            _sessio++;
            _startSession();
        }
    }

    // =========================================================================
    // UI HEADER
    // =========================================================================
    function _updateHeader() {
        els.sessionDisplay.innerText  = TEXTS.SESSIO_X_DE_Y(_sessio + 1, TOTAL_SESS);
        els.lvlDisplay.innerText      = TEXTS.FIGURA_X_DE_Y(_op + 1, TOTAL_OPS);
        els.scoreDisplay.innerText    = TEXTS.PUNTS_X(_punts);
        els.attemptsDisplay.innerText = TEXTS.INTENTS_X(_intents);
        els.attemptsDisplay.className = 'attempts-counter' +
            (_intents < 3 ? ' danger' : '');
    }

    // =========================================================================
    // RENDER SVG + DROP-ZONES
    // =========================================================================
    function _renderFigura() {
        const DZ_W      = 130;
        const DZ_H      = 34;
        const DZ_W_HINT = 185;

        // Clamping: evita que les caselles surtin del viewBox 500×340
        const SVG_W = 500, SVG_H = 340, MARGIN = 5;
        function clampLx(v, w) { return Math.min(Math.max(v, w/2 + MARGIN), SVG_W - w/2 - MARGIN); }
        function clampLy(v)    { return Math.min(v, SVG_H - DZ_H/2 - MARGIN); }

        let dzHTML = '';

        _figActual.etiquetes.forEach(et => {
            const isHint     = (et.id === _figActual.id);
            const w          = isHint ? DZ_W_HINT : DZ_W;

            // Casella hint: sempre a l'extrem superior-esquerre del SVG
            const lx = isHint ? DZ_W_HINT/2 + MARGIN : clampLx(et.lx, w);
            const ly = isHint ? DZ_H/2 + 8           : clampLy(et.ly);

            const x          = lx - w / 2;
            const y          = ly - DZ_H / 2;
            const labelInit  = isHint ? TEXTS.FIGURA_HINT : TEXTS.DZ_PLACEHOLDER;
            const labelClass = isHint ? 'dz-label dz-label-hint' : 'dz-label';

            // Hint: sense connector. Altres: connector en traç CONTINU (sense dasharray)
            const connectorHTML = isHint ? '' : `
                <line class="dz-connector"
                      x1="${et.px}" y1="${et.py}" x2="${lx}" y2="${ly}"
                      stroke-width="1.5"
                      pointer-events="none"/>`;
            dzHTML += `
            <g class="drop-zone" id="dz-${et.id}" data-word="${et.text}" data-w="${w}">
                ${connectorHTML}
                <rect class="dz-bg" x="${x}" y="${y}" width="${w}" height="${DZ_H}" rx="5"/>
                <text class="${labelClass}" x="${lx}" y="${ly}">${labelInit}</text>
            </g>`;
        });

        els.figureSvg.innerHTML = _figActual.svg + dzHTML;

        if (DEBUG) _injectDebugGrid();

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

        // [ROUND 3 — supressió instrucció mode A] no cal text: l'acció és evident
        els.contextInstr.style.display = 'none';
        // [ROUND 3 — pool vertical esquerra] classe que activa el layout en 2 columnes
        els.gameArea.classList.add('layout-a');

        VocabEngine.shuffle([..._figActual.etiquetes]).forEach(et => {
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
    }

    function _handleDrop(dzEl, word) {
        if (_isTransiting || _isPenalizing) return;
        if (word === dzEl.dataset.word) {
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
            setTimeout(() => dzEl.classList.remove('dz-wrong'), 1200);
            _historial.push({ pregunta: `(${dzEl.dataset.word})`, resposta: word, ok: false });
            _showIncorrecte();
            _penalize();
        }
    }

    // ---- Touch drag (mode A) ----
    let _touchChip = null;

    function _onTouchStart(e) {
        if (_isTransiting) return;
        e.preventDefault();
        _touchChip = e.currentTarget;
        const touch = e.touches[0];
        els.dragGhost.textContent    = _touchChip.dataset.word;
        els.dragGhost.style.display  = 'block';
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
        els.dragGhost.style.left = (cx - els.dragGhost.offsetWidth / 2) + 'px';
        els.dragGhost.style.top  = (cy - 20) + 'px';
    }

    function _onTouchEnd(e) {
        els.dragGhost.style.display = 'none';
        _removeTouchListeners();
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
        _removeTouchListeners();
    }

    function _removeTouchListeners() {
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
        // Instrucció va dins el write-panel, no cal la banda superior
        els.contextInstr.style.display = 'none';
        // Layout 2 columnes: figura (esquerra) + write-panel (dreta)
        els.gameArea.classList.remove('layout-a');
        els.gameArea.classList.add('layout-b');
        _showWriteStep();
    }

    function _showWriteStep() {
        if (_writeIdx >= _etTotal) { _finishLevel(); return; }

        els.writeProgress.innerText = TEXTS.PARAULA_X_DE_Y(_writeIdx + 1, _etTotal);
        els.writeInput.value = '';
        els.typoWarning.classList.remove('visible');
        _highlightWriteTarget();
        _focusWriteInput();
    }

    /**
     * Focus intel·ligent de l'input:
     * - En dispositius tàctils: scrollIntoView ABANS del focus, perquè
     *   quan aparegui el teclat virtual el camp quedi visible a la meitat
     *   superior de la pantalla i no quedi tapat.
     * - En PC/Chromebook: focus directe sense scroll addicional.
     */
    function _focusWriteInput() {
        if (_isTouchDevice()) {
            // Petit delay per deixar que el layout s'estabilitzi
            setTimeout(() => {
                els.writeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Segon delay: el focus activa el teclat virtual DESPRÉS del scroll
                setTimeout(() => els.writeInput.focus(), 120);
            }, 50);
        } else {
            els.writeInput.focus();
        }
    }

    function _highlightWriteTarget() {
        // Treu l'estat actiu de totes les caselles
        els.figureSvg.querySelectorAll('.drop-zone.dz-active, .drop-zone.dz-active-still')
            .forEach(dz => dz.classList.remove('dz-active', 'dz-active-still'));

        // Marca la casella actual
        const dzAll = els.figureSvg.querySelectorAll('.drop-zone');
        if (_writeIdx < dzAll.length && !dzAll[_writeIdx].classList.contains('dz-correct')) {
            dzAll[_writeIdx].classList.add('dz-active');
        }
    }

    function _checkWrite() {
        if (_isTransiting || _isPenalizing) return;
        const raw = els.writeInput.value.trim();
        if (raw === '') return;

        const et      = _figActual.etiquetes[_writeIdx];
        const resultat = VocabEngine.avaluaResposta(raw, et.text);

        if (resultat === 'correct') {
            els.typoWarning.classList.remove('visible');
            _historial.push({ pregunta: et.text, resposta: raw, ok: true });

            const dz = document.getElementById(`dz-${et.id}`);
            if (dz) {
                dz.classList.remove('dz-active', 'dz-active-still');
                dz.querySelector('text.dz-label').textContent = et.text;
                dz.classList.add('dz-correct');
            }
            _etOK++;
            _writeIdx++;
            setTimeout(() => _showWriteStep(), 400);

        } else if (resultat === 'typo') {
            // Avisa però NO penalitza
            els.typoWarning.classList.add('visible');
            els.writeInput.value = '';
            _focusWriteInput();

        } else {
            els.typoWarning.classList.remove('visible');
            _historial.push({ pregunta: et.text, resposta: raw, ok: false });

            const dz = document.getElementById(`dz-${et.id}`);
            if (dz) {
                dz.classList.remove('dz-active', 'dz-active-still');
                dz.classList.add('dz-wrong');
                setTimeout(() => {
                    dz.classList.remove('dz-wrong');
                    dz.classList.add('dz-active-still');
                }, 1200);
            }
            els.btnSubmitWrite.classList.add('error-shake');
            setTimeout(() => els.btnSubmitWrite.classList.remove('error-shake'), 200);

            _showIncorrecte();
            _penalize();
            els.writeInput.value = '';
            _focusWriteInput();
        }
    }

    // =========================================================================
    // FEEDBACK "INCORRECTE" (1 segon, mateixa posició que el mini-overlay final)
    // =========================================================================
    function _showIncorrecte() {
        if (!els.miniOverlay) return;
        els.miniIcon.innerText     = '❌';
        els.miniText.innerText     = 'Incorrecte';
        els.miniText.style.color   = 'var(--danger)';
        els.miniPoints.innerText   = '';
        els.miniOverlay.style.display = 'flex';
        setTimeout(() => {
            // Amaguem només si no ha pres el control el mini-overlay de fi de nivell
            if (els.miniText.innerText === 'Incorrecte') {
                els.miniOverlay.style.display = 'none';
            }
        }, 1000);
    }

    // =========================================================================
    // MINI OVERLAY
    // =========================================================================
    function _showMiniOverlay(points) {
        if (!els.miniOverlay) return points > 0 ? 1500 : 3000;
        if (points > 0) {
            els.miniIcon.innerText     = TEXTS.OVERLAY_OK_ICON;
            els.miniText.innerText     = TEXTS.OVERLAY_OK_TEXT;
            els.miniText.style.color   = '#047857';
            els.miniPoints.innerText   = TEXTS.OVERLAY_OK_PTS(points);
            els.miniPoints.style.color = '#059669';
        } else {
            els.miniIcon.innerText     = TEXTS.OVERLAY_KO_ICON;
            els.miniText.innerText     = TEXTS.OVERLAY_KO_TEXT;
            els.miniText.style.color   = 'var(--danger)';
            els.miniPoints.innerText   = TEXTS.OVERLAY_KO_PTS;
            els.miniPoints.style.color = 'var(--danger)';
        }
        els.miniOverlay.style.display = 'flex';
        return points > 0 ? 1500 : 3000;
    }

    function _hideMiniOverlay() {
        if (els.miniOverlay) els.miniOverlay.style.display = 'none';
    }

    // =========================================================================
    // RESUM FINAL
    // =========================================================================
    function _renderSummary() {
        const totalPossible = TOTAL_OPS * TOTAL_SESS * 10;
        const totalPunts    = _puntsTotal.reduce((a, b) => a + b, 0);
        const nota          = ((totalPunts / totalPossible) * 10)
                                .toFixed(1).replace('.', ',');

        const encerts = _historial.filter(h => h.ok).length;
        const errades = _historial.filter(h => !h.ok).length;

        const sessionsHTML = _puntsTotal.map((p, i) => {
            const n = (p / (TOTAL_OPS * 10) * 10).toFixed(1).replace('.', ',');
            return `<div class="session-line">
                <span>${TEXTS.SUMMARY_SESSIO(i + 1)}</span><span>${n}</span>
            </div>`;
        }).join('');

        els.summaryScreen.innerHTML = `
            <h2>${TEXTS.SUMMARY_TITOL}</h2>
            <div class="summary-layout">
                <div class="trophy-icon">${TEXTS.SUMMARY_TROFEU}</div>
                <div class="summary-data">
                    ${sessionsHTML}
                    <div style="margin-top:14px;font-size:0.9em;color:var(--text-muted);">${TEXTS.SUMMARY_NOTA}</div>
                    <div style="font-size:1.6em;font-weight:bold;color:var(--success);font-family:monospace;">
                        ${nota} / 10
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:8px;">
                <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:8px;padding:12px 20px;text-align:center;min-width:90px;">
                    <div style="font-size:1.8em;font-weight:800;color:#059669;">${encerts}</div>
                    <div style="font-size:0.8em;color:var(--text-muted);">${TEXTS.SUMMARY_ENCERTS}</div>
                </div>
                <div style="background:#fef2f2;border:2px solid #fecaca;border-radius:8px;padding:12px 20px;text-align:center;min-width:90px;">
                    <div style="font-size:1.8em;font-weight:800;color:#dc2626;">${errades}</div>
                    <div style="font-size:0.8em;color:var(--text-muted);">${TEXTS.SUMMARY_ERRADES}</div>
                </div>
            </div>
            <button class="btn-restart" onclick="location.reload()">${TEXTS.BTN_RESTART}</button>
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
        if (target) target.style.display = id === 'game-screen' ? 'flex' : 'block';
    }

    // =========================================================================
    // DEBUG GRID (?debug=1)
    // Dibuixa una quadrícula numerada sobre el SVG (viewBox 500×340)
    // per facilitar l'ajust manual de coordenades a vocabulari-figures.js.
    // També mostra les coordenades del cursor en temps real.
    // =========================================================================
    function _injectDebugGrid() {
        const SVG_W = 500, SVG_H = 340;
        const STEP_MAJOR = 50;   // línia + número cada 50px
        const STEP_MINOR = 10;   // línia fina cada 10px

        let gridSVG = '<g class="debug-grid" pointer-events="none">';

        // Línies menors (cada 10px)
        for (let x = 0; x <= SVG_W; x += STEP_MINOR) {
            if (x % STEP_MAJOR === 0) continue; // les majors ja les dibuixarem
            gridSVG += `<line x1="${x}" y1="0" x2="${x}" y2="${SVG_H}"
                         stroke="#7c3aed" stroke-width="0.3" opacity="0.25"/>`;
        }
        for (let y = 0; y <= SVG_H; y += STEP_MINOR) {
            if (y % STEP_MAJOR === 0) continue;
            gridSVG += `<line x1="0" y1="${y}" x2="${SVG_W}" y2="${y}"
                         stroke="#7c3aed" stroke-width="0.3" opacity="0.25"/>`;
        }

        // Línies majors (cada 50px)
        for (let x = 0; x <= SVG_W; x += STEP_MAJOR) {
            gridSVG += `<line x1="${x}" y1="0" x2="${x}" y2="${SVG_H}"
                         stroke="#7c3aed" stroke-width="0.5" opacity="0.45"/>`;
            gridSVG += `<text x="${x + 2}" y="10"
                         font-size="8" fill="#7c3aed" opacity="0.8"
                         font-family="monospace">${x}</text>`;
        }
        for (let y = 0; y <= SVG_H; y += STEP_MAJOR) {
            gridSVG += `<line x1="0" y1="${y}" x2="${SVG_W}" y2="${y}"
                         stroke="#7c3aed" stroke-width="0.5" opacity="0.45"/>`;
            if (y > 0) { // no duplicar el 0 de la cantonada
                gridSVG += `<text x="2" y="${y - 2}"
                             font-size="8" fill="#7c3aed" opacity="0.8"
                             font-family="monospace">${y}</text>`;
            }
        }

        // Cursor: cercle + text que es mouen amb el ratolí
        gridSVG += `<circle id="debug-cursor" cx="-100" cy="-100" r="4"
                     fill="none" stroke="#ef4444" stroke-width="1.5"
                     pointer-events="none"/>`;
        gridSVG += `<text id="debug-coord" x="-100" y="-100"
                     font-size="10" fill="#ef4444" font-weight="bold"
                     font-family="monospace" pointer-events="none"></text>`;

        // Marca cada punt d'ancoratge (px,py) amb el seu id
        _figActual.etiquetes.forEach(et => {
            const isHint = (et.id === _figActual.id);
            if (isHint) return; // el hint no té punt d'ancoratge real
            gridSVG += `<circle cx="${et.px}" cy="${et.py}" r="6"
                         fill="#ef4444" opacity="0.5" pointer-events="none"/>`;
            gridSVG += `<text x="${et.px + 8}" y="${et.py + 4}"
                         font-size="9" fill="#ef4444" font-weight="bold"
                         font-family="monospace" opacity="0.85"
                         pointer-events="none">${et.id}</text>`;
        });

        gridSVG += '</g>';

        els.figureSvg.insertAdjacentHTML('beforeend', gridSVG);

        // Coordenades en temps real
        els.figureSvg.style.pointerEvents = 'all';
        els.figureSvg.addEventListener('pointermove', _onDebugMove);

        // Mostra les coordenades de cada etiqueta a la consola
        console.table(_figActual.etiquetes.map(et => ({
            id: et.id, text: et.text,
            'px (punt)': et.px, 'py (punt)': et.py,
            'lx (caixa)': et.lx, 'ly (caixa)': et.ly
        })));
    }

    function _onDebugMove(e) {
        const svg = els.figureSvg;
        const pt  = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());

        const cx = Math.round(svgPt.x);
        const cy = Math.round(svgPt.y);

        const cursor = document.getElementById('debug-cursor');
        const coord  = document.getElementById('debug-coord');
        if (cursor) { cursor.setAttribute('cx', cx); cursor.setAttribute('cy', cy); }
        if (coord)  {
            coord.setAttribute('x', cx + 8);
            coord.setAttribute('y', cy - 6);
            coord.textContent = `${cx}, ${cy}`;
        }
    }

    // =========================================================================
    // ARRENCADA
    // =========================================================================
    document.addEventListener('DOMContentLoaded', init);

    // Única global intencionada: connecta el botó OK de l'HTML amb el mòdul
    window._vocabCheckWrite = function () { _checkWrite(); };

})();
