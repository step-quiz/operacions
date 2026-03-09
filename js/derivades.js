const els = {
    body:            document.body,
    gameScreen:      document.getElementById('game-screen'),
    sessionDisplay:  document.getElementById('session-display'),
    lvlDisplay:      document.getElementById('lvl-display'),
    scoreDisplay:    document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    fxDisplay:       document.getElementById('fx-display'),
    optionsContainer:document.getElementById('options-container')
};

let isPenalizing    = false;
let challengeData   = {};

// --- FUNCIONS AUXILIARS PER FORMATAR MATEMÀTIQUES ---

function formatK(k) {
    if (k === 1) return "";
    if (k === -1) return "-";
    return String(k);
}

function generateK() {
    let k = 0;
    while (k === 0) k = randInt(-6, 6);
    return k;
}

// Màxim Comú Divisor
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

// Generador de fraccions (K)
function generateFractionK() {
    let num, den;
    let valid = false;
    
    while (!valid) {
        num = randInt(-9, 9);
        den = randInt(2, 9); 
        
        // Condicions: no nul, producte < 10, irreductible
        if (num !== 0 && Math.abs(num * den) < 10 && gcd(Math.abs(num), den) === 1) {
            valid = true;
        }
    }
    
    const sign = num < 0 ? "-" : "";
    const absNum = Math.abs(num);
    return {
        num: num,
        den: den,
        tex: `${sign}\\frac{${absNum}}{${den}}`
    };
}

// Inverteix la fracció per al distractor de la integral
function invertFractionTex(fracObj) {
    const sign = fracObj.num < 0 ? "-" : "";
    const absNum = Math.abs(fracObj.num);
    
    // Si al donar-li la volta el denominador queda 1, és un enter
    if (absNum === 1) return `${sign}${fracObj.den}`;
    return `${sign}\\frac{${fracObj.den}}{${absNum}}`;
}


// --- BANC DE PREGUNTES ---
const questionBank = [
    {
        id: 'exp_kx_int', // Exponencial amb enters
        generate: () => {
            const k = generateK();
            const kStr = formatK(k);
            let kInvStr = k < 0 ? `-\\frac{1}{${Math.abs(k)}}` : `\\frac{1}{${k}}`;
            let potExpo = k === 1 ? "x - 1" : (k - 1 === 1 ? "x" : (k - 1 === 0 ? "" : `x - 1`));

            return {
                questionTex: `f(x) = e^{${kStr}x}`,
                correctTex: `${kStr}e^{${kStr}x}`,
                distractorsTex: [
                    `e^{${kStr}x}`,
                    `${kStr}x e^{${kStr}${potExpo}}`,
                    `${kInvStr} e^{${kStr}x}`
                ]
            };
        }
    },
    {
        id: 'exp_kx_frac', // Exponencial amb fraccions
        generate: () => {
            const frac = generateFractionK();
            const kStr = frac.tex;
            const kInvStr = invertFractionTex(frac);
            
            return {
                questionTex: `f(x) = e^{${kStr}x}`,
                correctTex: `${kStr}e^{${kStr}x}`,
                distractorsTex: [
                    `e^{${kStr}x}`,                          // Oblida regla de la cadena
                    `${kStr}x e^{${kStr}x - 1}`,             // Regla potències (escrit literal)
                    `${kInvStr} e^{${kStr}x}`                // Integral en lloc de derivada
                ]
            };
        }
    }
];

// --- MOTOR DEL JOC ---
function buildLevel() {
    attemptsLeft    = MAX_INTENTS;
    isTransitioning = false;
    isPenalizing    = false;
    
    const template = pick(questionBank);
    const qData = template.generate();
    
    let options = [
        { tex: qData.correctTex, isCorrect: true },
        { tex: qData.distractorsTex[0], isCorrect: false },
        { tex: qData.distractorsTex[1], isCorrect: false },
        { tex: qData.distractorsTex[2], isCorrect: false }
    ];
    
    options.sort(() => Math.random() - 0.5);
    
    challengeData = { questionTex: qData.questionTex, options: options };
    els.body.style.backgroundColor = bgColors[(currentSession * TOTAL_OPERATIONS + currentOperation) % bgColors.length];
    updateUI();
}

function updateUI() {
    els.sessionDisplay.innerText  = `Sessió ${currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText      = `Funció ${currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText    = `Punts: ${sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (attemptsLeft < 2 ? ' danger' : '');
    
    katex.render(challengeData.questionTex, els.fxDisplay, { displayMode: true, throwOnError: false });
    
    els.optionsContainer.innerHTML = '';
    
    // El teu patró de retards (en segons):
    // Índex 0 (Dalt-Esq - x2): 0.6s
    // Índex 1 (Dalt-Dreta - x4): 1.4s (0.6 + 0.4 + 0.4)
    // Índex 2 (Baix-Esq - x3): 1.0s (0.6 + 0.4)
    // Índex 3 (Baix-Dreta - x5): 1.8s (0.6 + 0.4 + 0.4 + 0.4)
    const delays = [0.6, 1.4, 1.0, 1.8];
    
    challengeData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        
        // Apliquem la pausa específica a cada botó
        btn.style.animationDelay = `${delays[index]}s`;
        
        const mathSpan = document.createElement('span');
        katex.render(`f'(x) = ${opt.tex}`, mathSpan, { displayMode: false, throwOnError: false });
        
        btn.appendChild(mathSpan);
        btn.onclick = () => checkAnswer(index, btn);
        els.optionsContainer.appendChild(btn);
    });
}

function penalize() {
    if (isPenalizing || isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        attemptsLeft--;
        if (attemptsLeft <= 0) {
            isTransitioning = true;
            showSolution();
        }
        isPenalizing = false;
        els.attemptsDisplay.innerText = `Intents: ${attemptsLeft}`;
        els.attemptsDisplay.className = 'attempts-counter' + (attemptsLeft < 2 ? ' danger' : '');
        if (attemptsLeft <= 0) _finishOp(0);
    }, 1000);
}

function checkAnswer(selectedIndex, btnElement) {
    if (isTransitioning || isPenalizing) return;
    const isCorrect = challengeData.options[selectedIndex].isCorrect;
    
    if (!isCorrect) {
        // 1. Fem el tremolor visual de "No" (això dura 0.3s)
        btnElement.classList.add('error-shake');
        setTimeout(() => btnElement.classList.remove('error-shake'), 300);
        
        // 2. Apliquem l'estat permanent de fallada (fons vermell, vora vermella, no clicable)
        btnElement.classList.add('wrong');
        
        if (typeof recordAnswerToHistory === 'function') {
            recordAnswerToHistory(challengeData.questionTex, "Incorrecte", false);
        }
        penalize();
        return;
    }
    
    // Si és correcta...
    btnElement.classList.add('correct');
    if (typeof recordAnswerToHistory === 'function') {
        recordAnswerToHistory(challengeData.questionTex, "Correcte", true);
    }
    
    isTransitioning = true;
    const fails       = MAX_INTENTS - attemptsLeft;
    const levelPoints = Math.max(0, 10 - (fails * 2));
    sessionScore     += levelPoints;
    els.scoreDisplay.innerText = `Punts: ${sessionScore}`;
    
    Array.from(els.optionsContainer.children).forEach(btn => btn.style.pointerEvents = 'none');
    _finishOp(levelPoints);
}

function showSolution() {
    const buttons = els.optionsContainer.children;
    challengeData.options.forEach((opt, index) => {
        buttons[index].style.pointerEvents = 'none';
        if (opt.isCorrect) buttons[index].classList.add('correct');
        else buttons[index].style.opacity = '0.5';
    });
}

function _finishOp(levelPoints) {
    const waitTime = showMiniOverlay(levelPoints);
    setTimeout(() => {
        hideMiniOverlay();
        if (currentOperation + 1 >= TOTAL_OPERATIONS) endSession();
        else {
            currentOperation++;
            buildLevel();
        }
    }, waitTime);
}

window.addEventListener('DOMContentLoaded', () => {
    if (typeof injectSharedHTML === 'function') injectSharedHTML();
    if (typeof validateConfig === 'function') validateConfig();
    if (typeof startGame === 'function') startGame();
});
