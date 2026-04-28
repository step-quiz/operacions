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

    let currentRound = 0;
    let currentPhaseIdx = 0;   // índex dins PHASES
    let currentSpec  = null;

    const els = {
        gameScreen:  document.getElementById('game-screen'),
        summary:     document.getElementById('session-summary'),
        fxDisplay:   document.getElementById('fx-display'),
        options:     document.getElementById('options-container'),
        feedback:    document.getElementById('missatge-feedback'),
        lvlDisplay:  document.getElementById('lvl-display'),
        badge:       document.getElementById('q-badge'),
        label:       document.getElementById('q-label'),
        graphCanvas: document.getElementById('graph-canvas'),
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

            setTimeout(() => {
                // Avança a la fase següent (saltant CONC si hasConcavity=false)
                const nextIdx = _nextPhaseIdx(currentPhaseIdx);
                if (nextIdx !== null) {
                    currentPhaseIdx = nextIdx;
                    buildQuestion();
                } else {
                    currentRound++;
                    if (currentRound >= TOTAL_ROUNDS) {
                        _showSummary();
                    } else {
                        buildFunction();
                    }
                }
            }, 1400);

        } else {
            btn.classList.add('wrong');
            els.feedback.innerHTML     = 'Revisa la gràfica i torna-ho a intentar.';
            els.feedback.style.opacity = '1';
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
            els.summary.style.display    = 'none';
            els.gameScreen.style.display = 'flex';
            buildFunction();
        });
    }

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
        buildFunction();
    };

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
