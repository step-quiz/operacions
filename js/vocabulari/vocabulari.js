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
        INSTR_HINT:      'Escriu el nom de la figura',
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
        BTN_NEXT_FIGURE: 'Figura següent',
        BTN_CYCLE:       'Canviar de casella',
        BTN_INFORME:     '📋 Veure informe',
        BTN_COPIAR:      '📝 Copiar codi',
        // Avisos d'error tipogràfic (mode B)
        TYPO_ACCENT:      "Revisa l'accentuació",
        TYPO_LLETRA:      'Revisa aquesta lletra',
        TYPO_FALTA_L:     'Revisa, falta una lletra',
        TYPO_FALTA_P:     'Falta una paraula',
        INFORME_TITOL:   'Resum de les teves respostes',
        INFORME_ENCERTS: (n) => `🟢 Encerts (${n})`,
        INFORME_ERRADES: (n) => `🔴 Errades (${n})`,
        INFORME_PREGUNTA:'Pregunta:',
        INFORME_RESPOSTA:'La teva resposta:',
        INFORME_CAP_OK:  'Cap encert en aquesta partida.',
        INFORME_CAP_KO:  'Cap errada! Has fet una partida perfecta 🎉',
    };

    // =========================================================================
    // CONFIG — URL params estàndard (coherent amb config.js)
    // Paràmetres: totalsessions, totaloperations, maxintents, maxenllocmitjana, modalitat, debug
    // =========================================================================
    const _p = new URLSearchParams(window.location.search);

    function _intParam(key, fallback, min, max) {
        const raw = _p.get(key);
        if (raw === null) return fallback;
        const n = parseInt(raw, 10);
        if (!Number.isInteger(n) || n < min || n > max) return fallback;
        return n;
    }

    const MODALITAT        = (_p.get('modalitat') || 'A').toUpperCase() === 'B' ? 'B' : 'A';
    const TOTAL_SESS       = _intParam('totalsessions',    1, 1, 20);
    const TOTAL_OPS        = _intParam('totaloperations',  4, 1, 30);
    const MAX_INTENTS      = _intParam('maxintents',       4, 1, 10);
    const MAX_ENLLOC_MITJ  = _intParam('maxenllocmitjana', 1, 0,  1);

    const DEBUG = _p.get('debug') === '1';

    // Filtre de dimensió: ?dim=2 (pla) | ?dim=3 (espai) | absent = tot
    const DIM = _intParam('dim', 0, 2, 3);   // 0 = sense filtre

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
    // [FIX M1] Unificada amb game-core.js: pointer: coarse + hover: none
    function _isTouchDevice() {
        return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
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
    let _resultats    = [];   // [v2] resultat per figura: 1/2/3/4 (com game-core.js)
    let _sessio       = 0;
    let _op           = 0;
    let _isPenalizing = false;
    let _isTransiting = false;
    // [CANVI 2] punts parcials de la figura en curs (+1 per etiqueta correcta)
    let _puntsFiguraActual = 0;
    // [CANVI 3] chip seleccionat en mode tap-to-select (mòbil portrait)
    let _selectedChip      = null;
    // [BUGFIX] flag per evitar acumulació de listeners al SVG arrel entre figures
    let _svgDragListenersAdded = false;

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
            btnNextFigure:   document.getElementById('btn-next-figure'),
            btnCycle:        document.getElementById('btn-cycle'),
            writePrompt:     document.querySelector('#write-panel .write-prompt'),
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

        // [CANVI] Overlay "Col·loca el mòbil en vertical"
        // Creat dinàmicament per no modificar l'HTML base.
        _initRotateOverlay();

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
    // OVERLAY ROTACIÓ — mòbil en landscape (Canvi)
    // Detecta si és un dispositiu tàctil en landscape i mostra un missatge
    // de bloqueig fins que l'usuari giri el mòbil en vertical.
    // La condició: pointer:coarse (tàctil) + orientation:landscape.
    // =========================================================================
    function _initRotateOverlay() {
        // Crea l'element si no existeix
        let overlay = document.getElementById('rotate-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'rotate-overlay';
            overlay.innerHTML = `
                <div class="rotate-icon">📱</div>
                <div class="rotate-msg">Col·loca el mòbil en vertical per poder continuar</div>
            `;
            document.body.appendChild(overlay);
        }

        // Condició: tàctil + landscape + pantalla petita (mòbil, no Chromebook).
        // El Lenovo 300e té 1366x768 en landscape → mai ha de mostrar l'overlay.
        const mq = window.matchMedia('(pointer: coarse) and (orientation: landscape) and (max-width: 900px)');

        function _applyRotateOverlay(matches) {
            overlay.classList.toggle('visible', matches);
        }

        // Estat inicial
        _applyRotateOverlay(mq.matches);

        // Escolta canvis d'orientació (addEventListener modern; fallback addListener)
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', e => _applyRotateOverlay(e.matches));
        } else {
            mq.addListener(e => _applyRotateOverlay(e.matches));
        }
    }

    // =========================================================================
    // GAME LOOP
    // =========================================================================
    function _startGame() {
        _sessio     = 0;
        _puntsTotal = [];
        _historial  = [];
        _resultats  = [];   // [v2] netegem els resultats per figura
        _startSession();
    }

    function _startSession() {
        _op    = 0;
        _punts = 0;

        // Ordre aleatori de figures, repetint si cal fins a TOTAL_OPS
        const filtered = DIM ? VocabFigures.all.filter(f => f.dim === DIM)
                             : VocabFigures.all;
        // Fallback: si el filtre no retorna cap figura (dim no existeix al dataset),
        // usem totes les figures per evitar el bucle infinit que penja la pàgina.
        const all = filtered.length ? filtered : VocabFigures.all;
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
        _puntsFiguraActual = 0;   // [CANVI 2]
        _selectedChip      = null; // [CANVI 3]

        _figActual = _figures[_op % _figures.length];
        _etTotal   = _figActual.etiquetes.length;

        // Fons rotatiu
        els.body.style.backgroundColor =
            BG_COLORS[(_sessio * TOTAL_OPS + _op) % BG_COLORS.length];

        els.typoWarning.classList.remove('visible');
        els.contextInstr.innerText = '';
        els.contextInstr.classList.remove('error');
        if (els.btnNextFigure) els.btnNextFigure.style.display = 'none';

        _updateHeader();
        _renderFigura();

        if (MODALITAT === 'A') _setupModeA();
        else                   _setupModeB();
    }

    function _finishLevel(exhausted = false) {
        _isTransiting = true;

        // [v2] Registrem el resultat d'aquesta figura amb la mateixa escala que
        //   game-core.js: 1=sense errors · 2=1 error · 3=2+ errors · 4=fallada.
        //   Els intents gastats són MAX_INTENTS - _intents.
        if (exhausted) {
            _resultats.push(4);
        } else {
            const errors = MAX_INTENTS - _intents;
            _resultats.push(Math.min(errors + 1, 3));
        }

        // [CANVI 2] Puntuació nova:
        //   - Figura completada → sempre +10 punts (bonus per completar)
        //   - Intents esgotats  → els punts parcials guanyats etiqueta a etiqueta
        const points = exhausted ? _puntsFiguraActual : 10;
        _punts += points;
        _puntsFiguraActual = 0;
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

        _showMiniOverlay(points, exhausted);

        if (exhausted) {
            if (_op + 1 >= TOTAL_OPS) {
                // Última figura: avenç directe (sense botó) després d'un delay
                setTimeout(() => _advanceToNext(), 3000);
            } else {
                // L'alumne ha de prémer "Figura següent" per avançar
                if (els.btnNextFigure) els.btnNextFigure.style.display = 'block';
            }
        } else {
            // Avenç automàtic després d'uns segons
            const wait = points > 0 ? 1500 : 3000;
            setTimeout(() => _advanceToNext(), wait);
        }
    }

    function _advanceToNext() {
        _hideMiniOverlay();
        if (els.btnNextFigure) els.btnNextFigure.style.display = 'none';
        if (_op + 1 >= TOTAL_OPS) {
            _endSession();
        } else {
            _op++;
            _buildLevel();
        }
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

    /**
     * Actualitza el marcador en temps real durant la figura en curs,
     * mostrant els punts acumulats + els punts parcials (+1 per etiqueta correcta).
     * [CANVI 2]
     */
    function _updateLiveScore() {
        els.scoreDisplay.innerText = TEXTS.PUNTS_X(_punts + _puntsFiguraActual);
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
            // [FIX CB v2] Els events drop/dragover/dragleave sobre elements <g> del SVG
            // no es disparen de manera fiable en alguns Chrome OS (el browser els intercepta
            // internament durant HTML5 drag). El 'pointerup' tampoc no és una solució vàlida
            // perquè queda suprimit durant una operació drag HTML5.
            // Solució: escoltar els tres events al SVG arrel i calcular sobre quina
            // drop-zone cau el cursor amb .closest('.drop-zone'). El drop sobre el SVG
            // root sempre es dispara correctament.
            // [BUGFIX] Els listeners s'afegeixen UNA SOLA VEGADA: el SVG arrel persisteix
            // entre figures (només innerHTML canvia) i, sense aquest guard, cada figura
            // afegia un nou listener → cada drop disparava _handleDrop N vegades →
            // _etOK s'incrementava N cops per encert → _finishLevel() s'activava
            // prematurament (ex.: 2 encerts amb 2 listeners = _etOK=4 en una figura de 4).
            if (!_svgDragListenersAdded) {
                _svgDragListenersAdded = true;
                els.figureSvg.addEventListener('dragover', e => {
                    e.preventDefault();
                    const dz = e.target.closest('.drop-zone');
                    els.figureSvg.querySelectorAll('.drop-zone').forEach(d => d.classList.remove('dz-over'));
                    if (dz) dz.classList.add('dz-over');
                });
                els.figureSvg.addEventListener('dragleave', e => {
                    // Només treure l'highlight si el cursor surt del SVG complet
                    if (!els.figureSvg.contains(e.relatedTarget)) {
                        els.figureSvg.querySelectorAll('.drop-zone').forEach(d => d.classList.remove('dz-over'));
                    }
                });
                els.figureSvg.addEventListener('drop', e => {
                    e.preventDefault();
                    els.figureSvg.querySelectorAll('.drop-zone').forEach(d => d.classList.remove('dz-over'));
                    const word = e.dataTransfer.getData('text/plain');
                    const dz   = e.target.closest('.drop-zone');
                    if (dz) _handleDrop(dz, word);
                });
            }
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

        // [CANVI 3] En mòbil portrait: tap-to-select en lloc de drag-and-drop
        const isMob = _isMobilePortrait();

        // Mòbil portrait: embolcalla el pool en un #pool-rail-wrapper visual
        // (border + border-radius) que NO fa overflow, evitant el clipping de
        // WebKit que talla els chips quan overflow-x:auto té border-radius.
        if (isMob) {
            let wrapper = document.getElementById('pool-rail-wrapper');
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.id = 'pool-rail-wrapper';
                els.wordPool.parentNode.insertBefore(wrapper, els.wordPool);
                wrapper.appendChild(els.wordPool);
            }
        } else {
            // Desktop: desembolcalla si hi havia un wrapper d'una sessió anterior
            const wrapper = document.getElementById('pool-rail-wrapper');
            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.insertBefore(els.wordPool, wrapper);
                wrapper.parentNode.removeChild(wrapper);
            }
        }

        // Spacer inicial: workaround per al bug de padding-inline-start en
        // contenidors overflow:auto de Safari/Chrome mòbil, on el padding
        // CSS del costat inicial del scroll és ignorat. Un element real
        // garanteix l'espai en tots els browsers.
        if (isMob) {
            const spacerStart = document.createElement('span');
            spacerStart.className    = 'pool-spacer';
            spacerStart.setAttribute('aria-hidden', 'true');
            els.wordPool.appendChild(spacerStart);
        }

        VocabEngine.shuffle([..._figActual.etiquetes]).forEach(et => {
            const chip        = document.createElement('div');
            chip.className    = 'word-chip';
            chip.textContent  = et.text;
            chip.dataset.word = et.text;

            if (isMob) {
                // Mòbil portrait: tap per seleccionar; sense drag
                chip.addEventListener('click', () => _selectChipMobile(chip));
            } else {
                // Desktop / landscape: drag and drop
                chip.draggable = true;
                chip.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', et.text);
                    setTimeout(() => chip.classList.add('dragging'), 0);
                });
                chip.addEventListener('dragend', () => {
                    chip.classList.remove('dragging');
                });
                chip.addEventListener('touchstart', _onTouchStart, { passive: false });
            }

            els.wordPool.appendChild(chip);
        });

        // Spacer final: mateix motiu que l'inicial (padding-inline-end ignorat).
        if (isMob) {
            const spacerEnd = document.createElement('span');
            spacerEnd.className    = 'pool-spacer';
            spacerEnd.setAttribute('aria-hidden', 'true');
            els.wordPool.appendChild(spacerEnd);
        }

        if (isMob) {
            // Mòbil portrait: les drop-zones del SVG escolten un tap per col·locar el chip seleccionat
            els.figureSvg.querySelectorAll('.drop-zone').forEach(dz => {
                dz.addEventListener('pointerup', () => {
                    if (dz.classList.contains('dz-correct')) return;
                    if (!_selectedChip || _isTransiting || _isPenalizing) return;
                    const word = _selectedChip.dataset.word;
                    _selectedChip.classList.remove('chip-selected');
                    _selectedChip = null;
                    _handleDrop(dz, word);
                });
            });
        }
    }

    // =========================================================================
    // HELPERS MÒBIL PORTRAIT — tap-to-select (Canvi 3)
    // =========================================================================

    /**
     * Retorna true si estem en un dispositiu tàctil en mode portrait estret.
     * Condició: pantalla tàctil + ample ≤ 600px + orientació portrait.
     */
    function _isMobilePortrait() {
        if (!_isTouchDevice()) return false;
        // Mòbil portrait estret
        if (window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches) return true;
        // Chromebook / tablet tàctil (pantalla gran): drag HTML5 no és fiable sobre SVG
        if (window.matchMedia('(min-width: 1024px) and (pointer: coarse)').matches) return true;
        return false;
    }

    /**
     * Gestiona el tap sobre un chip en mode mòbil portrait:
     * - Si el chip ja és el seleccionat → desselecciona (toggle)
     * - Si hi havia un altre chip seleccionat → canvia la selecció
     * - Si no hi havia cap → selecciona
     */
    function _selectChipMobile(chip) {
        if (_isTransiting || _isPenalizing) return;
        if (chip.classList.contains('used')) return;

        if (_selectedChip === chip) {
            // Toggle off
            chip.classList.remove('chip-selected');
            _selectedChip = null;
            return;
        }
        // Treu la selecció anterior
        if (_selectedChip) _selectedChip.classList.remove('chip-selected');

        _selectedChip = chip;
        chip.classList.add('chip-selected');

        // Fa scroll al chip visible dins el pool horitzontal
        chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
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
            _puntsFiguraActual++;   // [CANVI 2] +1 per etiqueta correcta
            _updateLiveScore();
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
        _touchChip    = null;
        _selectedChip = null;   // [CANVI 3]
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

        // Si la casella actual ja està resolta, avança a la següent lliure
        const dzAll = els.figureSvg.querySelectorAll('.drop-zone');
        if (dzAll[_writeIdx] && dzAll[_writeIdx].classList.contains('dz-correct')) {
            _writeIdx = _findNextUnanswered(_writeIdx);
            if (_writeIdx === -1) { _finishLevel(); return; }
        }

        els.writeProgress.innerText = TEXTS.PARAULA_X_DE_Y(_etOK + 1, _etTotal);

        // Prompt dinàmic: "Escriu el nom de la figura" si és la casella hint
        const et = _figActual.etiquetes[_writeIdx];
        const isHintLabel = (et && et.id === _figActual.id);
        if (els.writePrompt) {
            els.writePrompt.innerText = isHintLabel ? TEXTS.INSTR_HINT : TEXTS.INSTR_MODE_B;
        }

        els.writeInput.value = '';
        els.typoWarning.classList.remove('visible');
        _highlightWriteTarget();
        _focusWriteInput();
    }

    /**
     * Cerca la següent casella no resolta a partir de `fromIdx` (excloent-lo),
     * fent un cicle complet. Retorna -1 si totes estan resoltes.
     */
    function _findNextUnanswered(fromIdx) {
        const dzAll = els.figureSvg.querySelectorAll('.drop-zone');
        for (let i = 1; i <= _etTotal; i++) {
            const idx = (fromIdx + i) % _etTotal;
            if (!dzAll[idx].classList.contains('dz-correct')) return idx;
        }
        return -1;
    }

    /**
     * Canvia a la següent casella no resolta (mode B).
     * L'alumne pot prémer "Canviar de casella" per saltar-ne una.
     */
    function _cycleWriteTarget() {
        if (_isTransiting || _isPenalizing) return;
        const next = _findNextUnanswered(_writeIdx);
        if (next === -1 || next === _writeIdx) return; // no hi ha res on saltar
        _writeIdx = next;
        _showWriteStep();
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

        if (resultat.verdict === 'correct') {
            els.typoWarning.classList.remove('visible');
            _historial.push({ pregunta: et.text, resposta: raw, ok: true });

            const dz = document.getElementById(`dz-${et.id}`);
            if (dz) {
                dz.classList.remove('dz-active', 'dz-active-still');
                dz.querySelector('text.dz-label').textContent = et.text;
                dz.classList.add('dz-correct');
            }
            _etOK++;
            _puntsFiguraActual++;   // [CANVI 2] +1 per etiqueta correcta
            _updateLiveScore();
            // Thumb-up breu sobre la casella encertada
            _showThumbsUp(et);
            // Cerca la següent casella no resolta (pot haver-ne per cicle)
            setTimeout(() => {
                const next = _findNextUnanswered(_writeIdx);
                if (next === -1) {
                    _finishLevel();
                } else {
                    _writeIdx = next;
                    _showWriteStep();
                }
            }, 400);

        } else if (resultat.verdict === 'typo') {
            // Avisa però NO penalitza.
            // Missatge específic segons el tipus d'error; mostra la paraula
            // escrita per l'alumne amb el caràcter problemàtic marcat si escau.
            const TYPO_MSG = {
                accent:      TEXTS.TYPO_ACCENT,
                lletra:      TEXTS.TYPO_LLETRA,
                faltaLletra: TEXTS.TYPO_FALTA_L,
                faltaParaula:TEXTS.TYPO_FALTA_P,
            };
            const msg = TYPO_MSG[resultat.typoKind] || TEXTS.TYPO_LLETRA;
            els.typoWarning.innerHTML =
                `\u26A0\uFE0F <span class="typo-msg">${msg}</span>` +
                `<span class="typo-written">${resultat.html}</span>`;
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
    // THUMB-UP DE CONFIRMACIÓ (mode B)
    // Apareix sobre la casella encertada com a element SVG temporal (0.6s).
    // Usa lx/ly de l'etiqueta per posicionar-se just a sobre del requadre.
    // =========================================================================
    function _showThumbsUp(et) {
        const DZ_H = 34;
        // Coordenada y: just per sobre del requadre (mig box + marge de 10px)
        const thumbY = (et.ly - DZ_H / 2 - 10);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('pointer-events', 'none');
        g.classList.add('thumbs-up-anim');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(et.lx));
        text.setAttribute('y', String(thumbY));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'auto');
        text.setAttribute('font-size', '28');
        text.textContent = '👍';

        g.appendChild(text);
        els.figureSvg.appendChild(g);

        // Eliminem l'element just quan acaba l'animació
        setTimeout(() => { if (g.parentNode) g.parentNode.removeChild(g); }, 1050);
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
    function _showMiniOverlay(points, exhausted = false) {
        if (!els.miniOverlay) return;
        if (!exhausted) {
            // Figura completada: celebració amb els punts bonus (sempre 10)
            els.miniIcon.innerText     = TEXTS.OVERLAY_OK_ICON;
            els.miniText.innerText     = TEXTS.OVERLAY_OK_TEXT;
            els.miniText.style.color   = '#047857';
            els.miniPoints.innerText   = TEXTS.OVERLAY_OK_PTS(points);
            els.miniPoints.style.color = '#059669';
        } else {
            // Intents esgotats: missatge KO + punts parcials (si n'hi ha)
            els.miniIcon.innerText     = TEXTS.OVERLAY_KO_ICON;
            els.miniText.innerText     = TEXTS.OVERLAY_KO_TEXT;
            els.miniText.style.color   = 'var(--danger)';
            els.miniPoints.innerText   = points > 0 ? TEXTS.OVERLAY_OK_PTS(points) : TEXTS.OVERLAY_KO_PTS;
            els.miniPoints.style.color = points > 0 ? '#059669' : 'var(--danger)';
        }
        els.miniOverlay.style.display = 'flex';
    }

    function _hideMiniOverlay() {
        if (els.miniOverlay) els.miniOverlay.style.display = 'none';
    }

    // =========================================================================
    // RESUM FINAL
    // =========================================================================

    function _escapeHtml(unsafe) {
        if (unsafe == null) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function _calculaNotaSobre10() {
        if (!_puntsTotal.length) return 0;
        if (MAX_ENLLOC_MITJ === 1) {
            // Només compta la millor sessió
            const maxScore = Math.max(..._puntsTotal);
            return Number((maxScore / TOTAL_OPS).toFixed(1));
        } else {
            // Mitjana de totes les sessions
            const total = _puntsTotal.reduce((a, b) => a + b, 0);
            return Number((total / (TOTAL_SESS * TOTAL_OPS)).toFixed(1));
        }
    }

    function _renderSummary() {
        const nota10  = _calculaNotaSobre10();
        const nota    = nota10.toFixed(1).replace('.', ',');
        const notaText = MAX_ENLLOC_MITJ === 1
            ? 'Millor sessió:'
            : TEXTS.SUMMARY_NOTA;

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
                    <div style="margin-top:14px;font-size:0.9em;color:var(--text-muted);">${notaText}</div>
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
            <div class="final-actions">
                <button class="btn-restart" onclick="location.reload()">${TEXTS.BTN_RESTART}</button>
                <button class="btn-submit btn-action-informe" id="btn-informe"
                        onclick="_vocabShowInforme()">${TEXTS.BTN_INFORME}</button>
                <button class="btn-submit btn-action-copiar btn-copiar-codi" id="btn-copiar"
                        onclick="_vocabCopiarCodi()">${TEXTS.BTN_COPIAR}</button>
            </div>
        `;
    }

    // =========================================================================
    // INFORME (historial d'encerts i errades)
    // =========================================================================
    function _showInforme() {
        ['game-screen', 'summary-screen'].forEach(sid => {
            const el = document.getElementById(sid);
            if (el) el.style.display = 'none';
        });

        let screen = document.getElementById('history-summary-screen');
        if (!screen) {
            screen = document.createElement('div');
            screen.id = 'history-summary-screen';
            screen.className = 'panel-content';
            document.querySelector('.panel').appendChild(screen);
        }

        const encerts = _historial.filter(h => h.ok);
        const errades = _historial.filter(h => !h.ok);

        screen.innerHTML = `
            <div style="padding:20px;text-align:left;overflow-y:auto;max-height:100%;">
                <h2 style="text-align:center;color:var(--primary);margin-bottom:25px;">
                    ${TEXTS.INFORME_TITOL}
                </h2>

                <h3 style="color:var(--success);border-bottom:2px solid var(--success);padding-bottom:5px;">
                    ${TEXTS.INFORME_ENCERTS(encerts.length)}
                </h3>
                <ul style="list-style:none;padding:0;margin-bottom:30px;">
                    ${encerts.map(e => `
                        <li style="margin-bottom:12px;background:#f0fdf4;padding:12px;border-radius:6px;border:1px solid #bbf7d0;">
                            <div style="margin-bottom:5px;color:#334155;"><strong>${TEXTS.INFORME_PREGUNTA}</strong>
                                <span style="font-family:monospace;font-size:1.1em;">${_escapeHtml(e.pregunta)}</span></div>
                            <div style="color:#059669;"><strong>${TEXTS.INFORME_RESPOSTA}</strong>
                                <span style="font-family:monospace;">${_escapeHtml(e.resposta)}</span></div>
                        </li>
                    `).join('')}
                    ${encerts.length === 0 ? `<li style="color:var(--text-muted);font-style:italic;">${TEXTS.INFORME_CAP_OK}</li>` : ''}
                </ul>

                <h3 style="color:var(--danger);border-bottom:2px solid var(--danger);padding-bottom:5px;">
                    ${TEXTS.INFORME_ERRADES(errades.length)}
                </h3>
                <ul style="list-style:none;padding:0;margin-bottom:20px;">
                    ${errades.map(e => `
                        <li style="margin-bottom:12px;background:#fef2f2;padding:12px;border-radius:6px;border:1px solid #fecaca;">
                            <div style="margin-bottom:5px;color:#334155;"><strong>${TEXTS.INFORME_PREGUNTA}</strong>
                                <span style="font-family:monospace;font-size:1.1em;">${_escapeHtml(e.pregunta)}</span></div>
                            <div style="color:#dc2626;"><strong>${TEXTS.INFORME_RESPOSTA}</strong>
                                <span style="font-family:monospace;">${_escapeHtml(e.resposta)}</span></div>
                        </li>
                    `).join('')}
                    ${errades.length === 0 ? `<li style="color:var(--text-muted);font-style:italic;">${TEXTS.INFORME_CAP_KO}</li>` : ''}
                </ul>

                <div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin-top:30px;">
                    <button class="btn-submit btn-copiar-codi" onclick="_vocabCopiarCodi()"
                            style="background-color:#334155;">${TEXTS.BTN_COPIAR}</button>
                    <button class="btn-submit" onclick="location.reload()"
                            style="background-color:var(--text-muted);">${TEXTS.BTN_RESTART}</button>
                </div>
            </div>
        `;

        screen.style.display = 'block';
    }

    // =========================================================================
    // COPIAR CODI (antifrau per al professor) — FORMAT v2
    //   Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRRR…(30)  · idèntic a game-core.js
    // =========================================================================
    async function _copiarCodi() {
        // Salt aleatori (3 lletres minúscules)
        let salt = '';
        const caracters = 'abcdefghijklmnopqrstuvwxyz';
        for (let i = 0; i < 3; i++) {
            salt += caracters.charAt(Math.floor(Math.random() * caracters.length));
        }

        // Data i hora
        const ara    = new Date();
        const dia    = String(ara.getDate()).padStart(2, '0');
        const mes    = String(ara.getMonth() + 1).padStart(2, '0');
        const hora   = String(ara.getHours()).padStart(2, '0');
        const minuts = String(ara.getMinutes()).padStart(2, '0');

        // Exercici, dificultat, sessions, preguntes
        const exCode    = 'VO';                                   // vocabulari
        const dif       = '0';                                    // sense nivells de dificultat
        const sessions  = String(Math.min(TOTAL_SESS, 5));
        const questions = String(Math.min(TOTAL_OPS, 10)).padStart(2, '0');

        // Nota (NNN = nota × 10, 000-100)
        const notaSobre10 = _calculaNotaSobre10();
        const notaInt     = Math.round(notaSobre10 * 10);
        const notaStr     = String(notaInt).padStart(3, '0');

        // Resultats per figura (30 chars). 1=sense errors · 2=1 error · 3=2+ · 4=fallada
        const resultsStr = _resultats.slice(0, 30).map(String).join('').padEnd(30, '0');

        // Checksum (idèntic a game-core.js: fa servir la nota × 10)
        const valorAscii  = salt.charCodeAt(0);
        const sumaControl = notaInt + parseInt(dia, 10) + parseInt(mes, 10)
                          + parseInt(hora, 10) + parseInt(minuts, 10) + valorAscii;
        const lletra      = 'TRWAGMYFPDXBNJZSQVHLCKE'.charAt(sumaControl % 23);

        const output = `${lletra}${salt}-${dia}${mes}-${hora}${minuts}-${exCode}-${dif}-${sessions}-${questions}-${notaStr}-${resultsStr}`;
        console.log('Codi v2 generat per al professor:', output, '(', output.length, 'chars)');

        // Intentar copiar al portapapers; fallback visual si falla
        try {
            await navigator.clipboard.writeText(output);
            _showCopiatFeedback();
        } catch {
            _showFallbackCode(output);
        }
    }

    function _showCopiatFeedback() {
        document.querySelectorAll('.btn-copiar-codi').forEach(btn => {
            btn.innerText = 'Copiat! ✅';
            btn.style.backgroundColor = 'var(--success)';
            setTimeout(() => { btn.style.display = 'none'; }, 3000);
        });
    }

    function _showFallbackCode(code) {
        let box = document.getElementById('fallback-code-box');
        if (!box) {
            box = document.createElement('div');
            box.id = 'fallback-code-box';
            box.style.cssText = 'margin:15px auto;padding:14px 18px;background:#f1f5f9;border:2px solid #cbd5e1;border-radius:8px;text-align:center;max-width:400px;';
            box.innerHTML = `
                <div style="font-size:0.9em;color:#64748b;margin-bottom:8px;">Selecciona i copia aquest codi:</div>
                <div id="fallback-code-text" style="font-family:monospace;font-size:1.1em;font-weight:bold;color:#1e293b;user-select:all;-webkit-user-select:all;cursor:text;padding:8px;background:white;border-radius:4px;border:1px solid #e2e8f0;word-break:break-all;"></div>
            `;
            document.querySelector('.panel').appendChild(box);
        }
        document.getElementById('fallback-code-text').textContent = code;
        box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // =========================================================================
    // GESTIÓ DE PANTALLES
    // =========================================================================
    function _showScreen(id) {
        ['game-screen', 'summary-screen', 'history-summary-screen'].forEach(sid => {
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

    // Globals intencionades: connecten els botons HTML amb el mòdul
    window._vocabCheckWrite = function () { _checkWrite(); };
    window._vocabCycleWrite = function () { _cycleWriteTarget(); };
    window._vocabNextFigure = function () { _advanceToNext(); };
    window._vocabShowInforme = function () { _showInforme(); };
    window._vocabCopiarCodi  = function () { _copiarCodi(); };

})();
