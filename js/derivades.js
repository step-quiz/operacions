// js/derivades.js

/**
 * =========================================================================
 * FUNCIONS MATEMÀTIQUES AUXILIARS
 * =========================================================================
 */

// Tria un element a l'atzar d'una matriu
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

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
    
    // Franges de probabilitat per forçar escenaris conflictius
    if (r < 0.2) return -1; // 20% de probabilitat
    if (r < 0.4) return 2;  // 20% de probabilitat
    if (r < 0.6) return -2; // 20% de probabilitat
    
    // 40% restant: valors amb valor absolut < 7.
    // Excloem el 0, l'1, i els que ja tenen probabilitat fixa (-1, 2, -2).
    const altres = [-6, -5, -4, -3, 3, 4, 5, 6];
    return pickRandom(altres);
}

// CAS 2: Generador per a K fracció (K = a/b)
function generateFractionK() {
    let a, b;
    
    do {
        // 1. Generem el numerador 'a'
        const rA = Math.random();
        if (rA < 0.3) {
            a = 1;         // 30%
        } else if (rA < 0.6) {
            a = -1;        // 30%
        } else {
            // 40% restant. Excloem 0, 1 i -1
            const altresA = [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]; 
            a = pickRandom(altresA);
        }

        // 2. Generem el denominador 'b'
        const rB = Math.random();
        if (rB < 0.3) {
            b = 2;         // 30%
        } else if (rB < 0.6) {
            b = -2;        // 30%
        } else {
            // 40% restant. Excloem 0, 1, -1 (per no generar enters), 2 i -2
            const altresB = [-6, -5, -4, -3, 3, 4, 5, 6]; 
            b = pickRandom(altresB);
        }
        
    } while (gcd(a, b) !== 1); // Rebutgem i tornem a tirar si no és irreduïble

    // Normalitzem el signe: passem el negatiu al numerador perquè el denominador 
    // sigui sempre positiu (evita problemes visuals en formatar el LaTeX)
    if (b < 0) {
        a = -a;
        b = -b;
    }

    // Retornem l'objecte complet amb la propietat 'tex' ja precalculada per comoditat
    return { 
        num: a, 
        den: b, 
        tex: a < 0 ? `-\\frac{${Math.abs(a)}}{${b}}` : `\\frac{${a}}{${b}}` 
    };
}

/**
 * =========================================================================
 * FORMATADORS DE TEXT LaTeX
 * =========================================================================
 */

// Formata un nombre enter per al LaTeX (evita escriure "1x", "-1x")
function formatK(k) {
    if (k === 1) return "";
    if (k === -1) return "-";
    return k.toString();
}

/**
 * =========================================================================
 * LÒGICA DE LA INTERFÍCIE (UI) I CONNEXIÓ AMB GAME-CORE
 * =========================================================================
 */

const els = {
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay:     document.getElementById('lvl-display'),
    scoreDisplay:   document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    fxDisplay:      document.getElementById('fx-display'),
    optionsContainer: document.getElementById('options-container')
};

let challengeData = {};

// 1. Aquesta funció la crida el teu game-core.js a startSession()
function buildLevel() {
    attemptsLeft = typeof MAX_INTENTS !== 'undefined' ? MAX_INTENTS : 2;
    isTransitioning = false;
    
    // Agafem les dades de banc-preguntes.js
    const bankItem = pickRandom(questionBank);
    const rawData = bankItem.generate();
    
    // Homogeneïtzem l'opció correcta per convertir-la en objecte
    const correctOption = { tex: rawData.correctTex, isCorrect: true, feedback: "" };
    
    // Afegim isCorrect: false als distractors que ja tenen el feedback pedagògic
    const incorrectOptions = rawData.distractors.map(d => ({
        tex: d.tex, isCorrect: false, feedback: d.feedback
    }));
    
    const allOptions = [correctOption, ...incorrectOptions];
    allOptions.sort(() => Math.random() - 0.5); // Barregem els botons
    
    challengeData = { questionTex: rawData.questionTex, options: allOptions };
    updateUI();
}

function updateUI() {
    // Actualitzem marcadors del teu game-core
    els.sessionDisplay.innerText  = `Sessió ${currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText      = `Funció ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText    = `Punts: ${sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (attemptsLeft < 2 ? ' danger' : '');
    
    // Netejem el missatge de feedback de la ronda anterior
    const feedbackContainer = document.getElementById('missatge-feedback');
    if(feedbackContainer) {
        feedbackContainer.innerText = '';
        feedbackContainer.style.opacity = '0';
    }
    
    // Renderitzem l'enunciat amb KaTeX
    katex.render(challengeData.questionTex, els.fxDisplay, { displayMode: true, throwOnError: false });
    els.optionsContainer.innerHTML = '';
    
    // Creem els botons de respostes
    challengeData.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        
        const mathSpan = document.createElement('span');
        katex.render(`f'(x) = ${opt.tex}`, mathSpan, { displayMode: false, throwOnError: false });
        btn.appendChild(mathSpan);
        
        btn.onclick = () => checkAnswer(opt, btn); 
        els.optionsContainer.appendChild(btn);
    });
}

function checkAnswer(opt, btnElement) {
    if (isTransitioning) return;
    const feedbackContainer = document.getElementById('missatge-feedback');
    
    // --- SI FALLA ---
    if (!opt.isCorrect) {
        btnElement.classList.add('error-shake', 'wrong');
        setTimeout(() => btnElement.classList.remove('error-shake'), 300);
        
        // MOSTRA EL MISSATGE PEDAGÒGIC
        if(feedbackContainer) {
            feedbackContainer.innerText = opt.feedback;
            feedbackContainer.style.color = "var(--danger)";
            feedbackContainer.style.opacity = '1';
        }
        
        attemptsLeft--;
        els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
        
        // Si es queda sense intents
        if (attemptsLeft <= 0) {
            isTransitioning = true;
            Array.from(els.optionsContainer.children).forEach(b => b.style.pointerEvents = 'none');
            recordAnswerToHistory(challengeData.questionTex, opt.tex, false);
            _finishOp(0);
        }
        return;
    }
    
    // --- SI ENCERTA ---
    btnElement.classList.add('correct');
    if(feedbackContainer) {
        feedbackContainer.innerText = "Molt bé! Has aplicat bé les regles.";
        feedbackContainer.style.color = "var(--success)";
        feedbackContainer.style.opacity = '1';
    }
    
    isTransitioning = true;
    recordAnswerToHistory(challengeData.questionTex, opt.tex, true);
    
    const fails = (typeof MAX_INTENTS !== 'undefined' ? MAX_INTENTS : 2) - attemptsLeft;
    const levelPoints = Math.max(0, 10 - (fails * 2));
    sessionScore += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;
    
    Array.from(els.optionsContainer.children).forEach(b => b.style.pointerEvents = 'none');
    _finishOp(levelPoints);
}

// 2. Aquesta funció gestiona el pas a la següent pregunta parlant amb game-core.js
function _finishOp(levelPoints) {
    // Usem l'overlay integrat al teu game-core.js
    const waitTime = showMiniOverlay(levelPoints); 
    
    setTimeout(() => {
        hideMiniOverlay();
        currentOperation++;
        
        if (currentOperation >= TOTAL_OPERATIONS) {
            endSession(); // Cridem a game-core.js per acabar
        } else {
            buildLevel(); // Passem a la següent derivada
        }
    }, waitTime);
}

// 3. Arrencada automàtica en carregar la pàgina
window.addEventListener('DOMContentLoaded', () => {
    if (typeof validateConfig === 'function') validateConfig();
    
    // INJECTEM L'HTML COMPARTIT ABANS DE COMENÇAR (Molt important!)
    if (typeof injectSharedHTML === 'function') injectSharedHTML();
    
    startGame(); // Cridem al game-core per iniciar l'estructura
});
