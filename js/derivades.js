// js/derivades.js

/**
 * =========================================================================
 * FUNCIONS MATEMÀTIQUES AUXILIARS
 * =========================================================================
 */

// Calcula el Màxim Comú Divisor (MCD) per simplificar fraccions
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

/**
 * =========================================================================
 * GENERADORS DE LA CONSTANT K (Amb probabilitats estadístiques)
 * =========================================================================
 */

// CAS 1: Generador per a K enter
function generateK() {
    const r = Math.random();
    if (r < 0.2) return -1;
    if (r < 0.4) return 2;
    if (r < 0.6) return -2;
    return randIntNonZero(-6, 6);
}

// CAS 2: Generador per a K fraccionari (p/q)
function generateFractionK() {
    const denoms = [2, 3, 4, 5];
    const q = pick(denoms);
    let p = randIntNonZero(-5, 5);
    
    // Simplificar la fracció
    const common = gcd(p, q);
    return { num: p / common, den: q / common };
}

function formatK(k) {
    if (k === 1) return "";
    if (k === -1) return "-";
    return k.toString();
}

/**
 * =========================================================================
 * LÒGICA DEL JOC (CONTROLADOR)
 * =========================================================================
 */

let challengeData = null; 
const els = {
    fxDisplay:       document.getElementById('fx-display'),
    optionsContainer: document.getElementById('options-container'),
    feedback:        document.getElementById('feedback-container'),
    scoreDisplay:    document.getElementById('score-display'),
    lvlDisplay:      document.getElementById('lvl-display'),
    attemptsDisplay: document.getElementById('attempts-display')
};

// 1. Construeix un nou nivell (una nova derivada)
function buildLevel() {
    isTransitioning = false;
    
    // Configurar intents des de config.js
    attemptsLeft = MAX_INTENTS;
    
    // Actualitzar UI de progrés
    els.lvlDisplay.innerText = `Funció ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.feedback.style.opacity = '0';
    
    // Triar pregunta del banc i generar dades
    const bankItem = pick(questionBank);
    challengeData = bankItem.generate();

    // Renderitzar enunciat
    katex.render(challengeData.questionTex, els.fxDisplay, { throwOnError: false });

    // Preparar totes les opcions (Correcta + Distractors)
    // Convertim la correcta en el mateix format d'objecte que els distractors
    const allOptions = [
        { 
            tex: challengeData.correctTex, 
            feedback: "Molt bé! Resposta correcta.", 
            isCorrect: true 
        },
        ...challengeData.distractors.map(d => ({ ...d, isCorrect: false }))
    ];

    // Barrejar opcions aleatòriament
    allOptions.sort(() => Math.random() - 0.5);

    // Netejar i crear botons
    els.optionsContainer.innerHTML = '';
    allOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        
        const span = document.createElement('span');
        // IMPORTANT: Renderitzem només la propietat .tex de l'objecte
        katex.render(opt.tex, span, { throwOnError: false });
        btn.appendChild(span);

        btn.onclick = () => checkAnswer(opt);
        els.optionsContainer.appendChild(btn);
    });
}

// 2. Comprova la resposta seleccionada
function checkAnswer(opt) {
    if (isTransitioning) return;

    const feedbackContainer = els.feedback;

    if (opt.isCorrect) {
        // RESPOSTA CORRECTA
        feedbackContainer.innerHTML = `<strong>${opt.feedback}</strong>`;
        feedbackContainer.style.color = "var(--success)";
        feedbackContainer.style.opacity = '1';
        
        isTransitioning = true;
        recordAnswerToHistory(challengeData.questionTex, opt.tex, true);
        
        const fails = MAX_INTENTS - attemptsLeft;
        const levelPoints = Math.max(0, 10 - (fails * 2));
        sessionScore += levelPoints;
        els.scoreDisplay.innerText = `Punts: ${sessionScore}`;
        
        Array.from(els.optionsContainer.children).forEach(b => b.style.pointerEvents = 'none');
        _finishOp(levelPoints);

    } else {
        // RESPOSTA INCORRECTA
        attemptsLeft--;
        els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
        
        feedbackContainer.innerHTML = `<span>${opt.feedback}</span>`;
        feedbackContainer.style.color = "var(--danger)";
        feedbackContainer.style.opacity = '1';

        // Buscar el botó clicat per posar-li l'estat visual d'error
        const clickedBtn = Array.from(els.optionsContainer.children).find(b => b.textContent.includes(opt.tex) || b.innerHTML.includes(opt.tex));
        if (clickedBtn) {
            clickedBtn.classList.add('wrong');
        }

        if (attemptsLeft <= 0) {
            isTransitioning = true;
            recordAnswerToHistory(challengeData.questionTex, opt.tex, false);
            _finishOp(0);
        }
    }
}

// 3. Finalitza l'operació actual i gestiona el flux cap a game-core.js
function _finishOp(levelPoints) {
    const waitTime = showMiniOverlay(levelPoints); 
    
    setTimeout(() => {
        hideMiniOverlay();
        currentOperation++;
        
        if (currentOperation >= TOTAL_OPERATIONS) {
            endSession(); 
        } else {
            buildLevel(); 
        }
    }, waitTime);
}

// 4. Arrencada automàtica
window.addEventListener('DOMContentLoaded', () => {
    // 1. Validem la configuració
    if (typeof validateConfig === 'function') validateConfig();
    
    // 2. Injectem l'HTML compartit (teclats, pantalles finals)
    if (typeof injectSharedHTML === 'function') {
        injectSharedHTML();
    }
    
    // 3. Mostrem la pantalla i iniciem la sessió (això treu el display:none)
    if (typeof startGame === 'function') {
        startGame(); 
    } else {
        // Fallback per si no tenim game-core.js carregat
        const screen = document.getElementById('game-screen');
        if (screen) screen.style.display = 'block';
        buildLevel();
    }
});
