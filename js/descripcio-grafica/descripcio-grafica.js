/**
 * js/descripcio-grafica/descripcio-grafica.js
 * Controlador DOM per a l'activitat "Descripció d'una gràfica".
 *
 * Flux per funció:
 *   1. SIGN  → pregunta sobre el signe de f(x)
 *   2. MONO  → pregunta sobre la monotonia
 *   3. CONC  → pregunta sobre la concavitat  (només si spec.hasConcavity)
 *
 * El comptador mostra "Funció X de Y" ja que el total de preguntes
 * varia (2 o 3) segons la família de funció generada.
 *
 * URL params:
 *   ?nivell=1|2|3        (per defecte 1)
 *   ?preguntes=N         (nombre de funcions; per defecte 4)
 *   ?fixed=A|B|C         (gestionat per js/fixed-sessions.js)
 */

(function () {
    'use strict';

    const _p           = new URLSearchParams(window.location.search);
    let   currentLevel = Math.min(3, Math.max(1, parseInt(_p.get('nivell')    || '1', 10)));
    const TOTAL_ROUNDS = Math.max(2,             parseInt(_p.get('preguntes') || '4', 10));

    // Ordre de les fases per funció
    const PHASES = ['SIGN', 'MONO', 'CONC'];

    let currentRound    = 0;
    let currentPhaseIdx = 0;
    let currentSpec     = null;
    let showColoredGraphs = true;   // preferència de l'usuari
    let _countdownTimer   = null;   // referència al setTimeout actiu
    let _advanceFn        = null;   // funció de pas guardada per skipCountdown
    let _countdownPaused  = false;  // estat de pausa (tecla espai)
    let _countdownStartTs = 0;      // ms en què s'ha (re)iniciat el tram actual
    let _countdownLeft    = 0;      // ms restants quan es pausa

    const els = {
        gameScreen:  document.getElementById('game-screen'),
        summary:     document.getElementById('session-summary'),
        fxDisplay:   document.getElementById('fx-display'),
        options:     document.getElementById('options-container'),
        feedback:    document.getElementById('missatge-feedback'),
        lvlDisplay:  document.getElementById('lvl-display'),
        badge:       document.getElementById('q-badge'),
        label:       document.getElementById('q-label'),
        graphCanvas:  document.getElementById('graph-canvas'),
        graphLegend:  document.getElementById('graph-legend'),
        graphFooter:  document.getElementById('graph-footer'),
        countdownBar: document.getElementById('countdown-bar'),
    };

    // ------------------------------------------------------------------ //
    //  NOVA FUNCIÓ
    // ------------------------------------------------------------------ //
    function buildFunction() {
        currentSpec      = FunctionEngine.generateFunction(currentLevel);
        currentPhaseIdx  = 0;
        els.graphCanvas.innerHTML = SvgRenderer.renderFuncSVG(currentSpec);
        buildQuestion();
    }

    // ------------------------------------------------------------------ //
    //  NOVA PREGUNTA
    // ------------------------------------------------------------------ //
    function buildQuestion() {
        // Restaura la gràfica negra (pot venir d'un estat acolorit)
        if (currentSpec) {
            els.graphCanvas.innerHTML = SvgRenderer.renderFuncSVG(currentSpec);
        }
        _clearCountdown();   // amaga llegenda i barra si quedaven visibles
        els.feedback.style.opacity = '0';
        els.feedback.innerHTML     = '';
        els.lvlDisplay.textContent = `Funció ${currentRound + 1} de ${TOTAL_ROUNDS}`;

        const phase = PHASES[currentPhaseIdx];
        let q;
        if      (phase === 'SIGN') q = QuestionBank.generateSignQ(currentSpec);
        else if (phase === 'MONO') q = QuestionBank.generateMonoQ(currentSpec);
        else                       q = QuestionBank.generateConcQ(currentSpec);

        els.badge.textContent = q.badge;
        els.label.textContent = q.label;
        katex.render(currentSpec.latex, els.fxDisplay, { throwOnError: false, displayMode: true });

        els.options.innerHTML = '';
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'btn-option';
            btn.style.animationDelay = `${idx * 55}ms`;
            btn.textContent = opt.text;
            btn.addEventListener('click', () => checkAnswer(opt, btn));
            els.options.appendChild(btn);
        });
    }

    // ------------------------------------------------------------------ //
    //  COMPROVACIÓ DE RESPOSTA
    // ------------------------------------------------------------------ //
    function checkAnswer(opt, btn) {
        if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;

        if (opt.isCorrect) {
            btn.classList.add('correct');
            _disableAll();
            els.feedback.innerHTML     = '<span class="feedback-correct">✓ Correcte!</span>';
            els.feedback.style.opacity = '1';

            const phase = PHASES[currentPhaseIdx];
            const advance = () => {
                _clearCountdown();
                const nextIdx = _nextPhaseIdx(currentPhaseIdx);
                if (nextIdx !== null) {
                    currentPhaseIdx = nextIdx;
                    buildQuestion();
                } else {
                    currentRound++;
                    if (currentRound >= TOTAL_ROUNDS) _showSummary();
                    else buildFunction();
                }
            };

            if (showColoredGraphs) {
                // Petit delay per veure el botó verd, llavors mostra la gràfica acolorida
                setTimeout(() => {
                    const { svg, legend } = SvgRenderer.renderFuncSVGColored(currentSpec, phase);
                    els.graphCanvas.innerHTML = svg;
                    // Llegenda HTML sota el gràfic (mai tapa la corba)
                    els.graphLegend.innerHTML = legend.map(e =>
                        `<span class="legend-pill" style="--pill-color:${e.color}">${e.label}</span>`
                    ).join('');
                    els.graphLegend.style.display = 'flex';
                    _startCountdown(5000, advance);
                }, 400);
            } else {
                setTimeout(advance, 1400);
            }

        } else {
            btn.classList.add('wrong');
            els.feedback.innerHTML     = 'Revisa la gràfica i torna-ho a intentar.';
            els.feedback.style.opacity = '1';
        }
    }

    // ------------------------------------------------------------------ //
    //  COUNTDOWN (barra de progrés + boto skip)
    //  La tecla ESPAI pausa/reprèn (per si el docent vol explicar alguna cosa)
    // ------------------------------------------------------------------ //
    function _startCountdown(duration, callback) {
        _advanceFn         = callback;
        _countdownPaused   = false;
        _countdownLeft     = duration;
        _countdownStartTs  = Date.now();

        // Treu el focus del botó de resposta perquè ESPAI no el reactivi
        if (document.activeElement && document.activeElement.blur) {
            try { document.activeElement.blur(); } catch (e) { /* no-op */ }
        }

        els.graphFooter.style.display = 'flex';
        const bar = els.countdownBar;
        bar.classList.remove('paused');
        bar.style.animation = 'none';
        bar.style.animationPlayState = '';
        bar.offsetWidth;  // reflow
        bar.style.animation = `drainBar ${duration}ms linear forwards`;
        _countdownTimer = setTimeout(callback, duration);
    }

    function _pauseCountdown() {
        if (!_countdownTimer || _countdownPaused) return;
        clearTimeout(_countdownTimer);
        _countdownTimer = null;
        _countdownLeft -= (Date.now() - _countdownStartTs);
        if (_countdownLeft < 0) _countdownLeft = 0;
        els.countdownBar.style.animationPlayState = 'paused';
        els.countdownBar.classList.add('paused');
        _countdownPaused = true;
    }

    function _resumeCountdown() {
        if (!_countdownPaused || !_advanceFn) return;
        _countdownPaused  = false;
        _countdownStartTs = Date.now();
        els.countdownBar.classList.remove('paused');
        els.countdownBar.style.animationPlayState = 'running';
        _countdownTimer = setTimeout(_advanceFn, _countdownLeft);
    }

    function _clearCountdown() {
        if (_countdownTimer) { clearTimeout(_countdownTimer); _countdownTimer = null; }
        _advanceFn       = null;
        _countdownPaused = false;
        if (els.graphFooter) els.graphFooter.style.display = 'none';
        if (els.graphLegend) { els.graphLegend.style.display = 'none'; els.graphLegend.innerHTML = ''; }
        if (els.countdownBar) {
            els.countdownBar.style.animationPlayState = '';
            els.countdownBar.classList.remove('paused');
        }
    }

    /** Retorna l'índex de la següent fase, o null si s'ha acabat la funció. */
    function _nextPhaseIdx(idx) {
        const next = idx + 1;
        if (next >= PHASES.length) return null;
        // Saltar CONC si la funció no té concavitat
        if (PHASES[next] === 'CONC' && !currentSpec.hasConcavity) return null;
        return next;
    }

    function _disableAll() {
        els.options.querySelectorAll('.btn-option')
            .forEach(b => { b.style.pointerEvents = 'none'; });
    }

    // ------------------------------------------------------------------ //
    //  PANTALLA FINAL
    // ------------------------------------------------------------------ //
    function _showSummary() {
        els.gameScreen.style.display = 'none';
        els.summary.innerHTML = `
            <div class="end-emoji">🎉</div>
            <div class="end-title">Molt bé!</div>
            <div class="end-sub">Has completat totes les preguntes.</div>
            <button class="summary-continue-btn" id="btn-restart">Torna a jugar</button>`;
        els.summary.style.display = 'flex';
        document.getElementById('btn-restart').addEventListener('click', () => {
            currentRound = 0; currentPhaseIdx = 0; currentSpec = null;
            _clearCountdown();
            els.summary.style.display    = 'none';
            els.gameScreen.style.display = 'flex';
            buildFunction();
        });
    }

    // ------------------------------------------------------------------ //
    //  CONFIGURACIÓ — cridat des del botó onclick del HTML
    // ------------------------------------------------------------------ //
    window.toggleColoredGraphs = function () {
        showColoredGraphs = !showColoredGraphs;
        const btn = document.getElementById('btn-colored');
        if (btn) btn.className = 'colored-toggle' + (showColoredGraphs ? ' active' : '');
    };

    window.skipCountdown = function () {
        if (_advanceFn) { const fn = _advanceFn; _clearCountdown(); fn(); }
    };

    // ------------------------------------------------------------------ //
    //  CANVI DE NIVELL (cridat des dels botons onclick del HTML)
    // ------------------------------------------------------------------ //
    window.setLevel = function (n) {
        currentLevel = n;
        [1, 2, 3].forEach(i => {
            const b = document.getElementById(`lvl-btn-${i}`);
            if (b) b.className = 'lvl-btn' + (i === n ? ' active' : '');
        });
        currentRound = 0; currentPhaseIdx = 0; currentSpec = null;
        _clearCountdown();
        buildFunction();
    };

    // ------------------------------------------------------------------ //
    //  TECLA ESPAI — pausa/reprèn el countdown si està actiu
    // ------------------------------------------------------------------ //
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Space' && e.key !== ' ') return;
        const tg = e.target || {};
        const tn = (tg.tagName || '').toLowerCase();
        if (tn === 'input' || tn === 'textarea' || tg.isContentEditable) return;
        // Només actuem si hi ha un countdown actiu (després de respondre correctament)
        if (!_advanceFn) return;
        e.preventDefault();
        if (_countdownPaused) _resumeCountdown();
        else                  _pauseCountdown();
    });

    // ------------------------------------------------------------------ //
    //  INICI
    // ------------------------------------------------------------------ //
    window.addEventListener('DOMContentLoaded', () => {
        [1, 2, 3].forEach(i => {
            const b = document.getElementById(`lvl-btn-${i}`);
            if (b) b.className = 'lvl-btn' + (i === currentLevel ? ' active' : '');
        });
        els.gameScreen.style.display = 'flex';
        buildFunction();
    });

})();
