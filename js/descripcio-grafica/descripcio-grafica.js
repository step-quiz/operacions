/**
 * js/descripcio-grafica/descripcio-grafica.js
 * Controlador DOM per a l'activitat "Descripció d'una gràfica".
 *
 * Flux per funció:
 *   1. buildFunction()  → genera especificació + renderitza gràfic
 *   2. buildQuestion('MONO') → mostra pregunta de monotonia
 *   3. Resposta correcta → buildQuestion('SIGN')
 *   4. Resposta correcta → currentRound++
 *      Si acabat → _showSummary(); si no → buildFunction()
 *
 * Comportament davant errors:
 *   - Botó incorrecte → es desactiva en vermell
 *   - L'alumne pot tornar a intentar-ho amb les opcions restants
 *   - No es compten intents ni punts
 *
 * URL params:
 *   ?nivell=1|2|3        (per defecte 1)
 *   ?preguntes=N         (total de preguntes individuals; per defecte 8 → 4 funcions)
 *   ?fixed=A|B|C         (gestionat per js/fixed-sessions.js)
 */

(function () {
    'use strict';

    const _p         = new URLSearchParams(window.location.search);
    let   currentLevel = Math.min(3, Math.max(1, parseInt(_p.get('nivell') || '1', 10)));
    const TOTAL_Q      = Math.max(4, parseInt(_p.get('preguntes') || '8', 10));
    const TOTAL_ROUNDS = Math.max(2, Math.round(TOTAL_Q / 2));

    const LEVEL_NAMES = {}; // reservat per a ús futur

    let currentRound = 0;
    let currentPhase = 'SIGN';   // 'SIGN' | 'MONO'
    let currentSpec  = null;
    let isAnswered   = false;

    const els = {
        gameScreen:   document.getElementById('game-screen'),
        summary:      document.getElementById('session-summary'),
        fxDisplay:    document.getElementById('fx-display'),
        options:      document.getElementById('options-container'),
        feedback:     document.getElementById('missatge-feedback'),
        lvlDisplay:   document.getElementById('lvl-display'),
        badge:        document.getElementById('q-badge'),
        label:        document.getElementById('q-label'),
        graphCanvas:  document.getElementById('graph-canvas'),
    };

    // ------------------------------------------------------------------ //
    //  NOVA FUNCIÓ
    // ------------------------------------------------------------------ //
    function buildFunction() {
        isAnswered  = false;
        currentSpec = FunctionEngine.generateFunction(currentLevel);

        // La gràfica és sempre visible (l'alumne l'ha de llegir per respondre)
        els.graphCanvas.innerHTML = SvgRenderer.renderFuncSVG(currentSpec);

        currentPhase = 'SIGN';
        buildQuestion();
    }

    // ------------------------------------------------------------------ //
    //  NOVA PREGUNTA (mateixa funció, nova fase)
    // ------------------------------------------------------------------ //
    function buildQuestion() {
        isAnswered = false;
        els.feedback.style.opacity = '0';
        els.feedback.innerHTML     = '';

        // Comptador
        const absQ = currentRound * 2 + (currentPhase === 'SIGN' ? 0 : 1) + 1;
        els.lvlDisplay.textContent = `Pregunta ${absQ} de ${TOTAL_ROUNDS * 2}`;

        // Genera pregunta
        const q = currentPhase === 'MONO'
            ? QuestionBank.generateMonoQ(currentSpec)
            : QuestionBank.generateSignQ(currentSpec);

        els.badge.textContent = q.badge;
        els.label.textContent = q.label;

        // Fórmula de la funció (KaTeX, displayMode)
        katex.render(currentSpec.latex, els.fxDisplay, { throwOnError: false, displayMode: true });

        // Botons d'opció
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
        if (isAnswered) return;

        if (opt.isCorrect) {
            isAnswered = true;
            btn.classList.add('correct');
            _disableAll();
            els.feedback.innerHTML     = '<span class="feedback-correct">✓ Correcte!</span>';
            els.feedback.style.opacity = '1';

            setTimeout(() => {
                if (currentPhase === 'SIGN') {
                    // Passa a la pregunta de monotonia (mateixa gràfica)
                    currentPhase = 'MONO';
                    buildQuestion();
                } else {
                    // Funció completada, passa a la següent
                    currentRound++;
                    if (currentRound >= TOTAL_ROUNDS) {
                        _showSummary();
                    } else {
                        buildFunction();
                    }
                }
            }, 1400);

        } else {
            // Opció incorrecta: es deshabilita; les altres resten actives
            btn.classList.add('wrong');
            els.feedback.innerHTML     = 'Revisa la gràfica i torna-ho a intentar.';
            els.feedback.style.opacity = '1';
        }
    }

    function _disableAll() {
        els.options.querySelectorAll('.btn-option')
            .forEach(b => { b.style.pointerEvents = 'none'; });
    }

    // ------------------------------------------------------------------ //
    //  PANTALLA FINAL (sense puntuació ni estadístiques)
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
            currentRound = 0; currentPhase = 'SIGN'; currentSpec = null;
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
        // Actualitza estil actiu dels botons
        [1, 2, 3].forEach(i => {
            const b = document.getElementById(`lvl-btn-${i}`);
            if (b) b.className = 'lvl-btn' + (i === n ? ' active' : '');
        });
        // Reinicia des del principi amb el nou nivell
        currentRound = 0; currentPhase = 'SIGN'; currentSpec = null;
        buildFunction();
    };

    // ------------------------------------------------------------------ //
    //  INICI
    // ------------------------------------------------------------------ //
    window.addEventListener('DOMContentLoaded', () => {
        // Sincronitza el botó actiu amb el nivell del paràmetre URL (si n'hi ha)
        [1, 2, 3].forEach(i => {
            const b = document.getElementById(`lvl-btn-${i}`);
            if (b) b.className = 'lvl-btn' + (i === currentLevel ? ' active' : '');
        });
        els.gameScreen.style.display = 'flex';
        buildFunction();
    });

})();
