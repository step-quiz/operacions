/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/potencies/potencies.js
 * ROL: Joc «Potències — ESO» (potencies.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa game-core.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import {
    state,
    bgColors,
    endSession,
    hideCustomKeyboard,
    hideMiniOverlay,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbMarkForOverwrite,
    recordResult,
    registerScreens,
    showCustomKeyboard,
    showMiniOverlay,
    showScreen,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { selectRepte, checkStep, buildLevel, checkCurrentCell });

// ================================================================
// DOM
// ================================================================
const els = {
    body: document.body,
    selectionScreen: document.getElementById('selection-screen'),
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    expressionBox: document.getElementById('expression-box'),
    resolutionPanel: document.getElementById('resolution-panel'),
    currentStep: document.getElementById('current-step'),
    stepTitle: document.getElementById('step-title'),
    stepSchema: document.getElementById('step-schema'),
    stepBtns: document.getElementById('step-btns'),
    stepFeedback: document.getElementById('step-feedback'),
    btnSubmitStep: document.getElementById('btn-submit-step'),
};

// ================================================================
// ESTAT
// ================================================================
let selectedRepte = 0;
let isPenalizing = false;
let usedProblems = new Set();
let currentProblem = null;
let currentSteps = [];
let currentStepIdx = 0;
let selectedOption = null; // per als passos de botons

// ================================================================
// UTILITATS MATEMÀTIQUES
// ================================================================
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function intPow(b, e) {
    return Math.round(Math.pow(b, e));
}

// Parseja enters estrictes, inclou negatius
function parseNum(s) {
    const clean = s.trim().replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(clean)) return NaN;
    return parseFloat(clean);
}

// ================================================================
// RENDERITZACIÓ DE L'EXPRESSION BOX
// ================================================================

// Crea un <span> amb innerHTML (helper)
function mkSpan(html, cls) {
    const el = document.createElement('span');
    if (cls) el.className = cls;
    el.innerHTML = html;
    return el;
}

// Crea una potència base^exp com a node DOM
// exp negatiu → mostra entre parèntesis
function powNode(base, exp) {
    const expStr = exp < 0 ? `(${exp})` : String(exp);
    return mkSpan(`${base}<sup class="expr-sup">${expStr}</sup>`);
}

function clearExpr() {
    els.expressionBox.innerHTML = '';
}
function addEqSign() {
    els.expressionBox.appendChild(mkSpan('=', 'expr-eq'));
}

// Renderitza l'expressió del problema a l'expression-box (sense '= ?')
function renderExpr(p) {
    clearExpr();
    switch (p.type) {
        case 'prod':
            els.expressionBox.appendChild(powNode(p.base, p.m));
            els.expressionBox.appendChild(mkSpan('·', 'expr-op'));
            els.expressionBox.appendChild(powNode(p.base, p.n));
            break;

        case 'quot': {
            const frac = document.createElement('span');
            frac.className = 'expr-frac';
            const num = document.createElement('span');
            num.className = 'expr-frac-num';
            const den = document.createElement('span');
            den.className = 'expr-frac-den';
            num.appendChild(powNode(p.base, p.m));
            den.appendChild(powNode(p.base, p.n));
            frac.appendChild(num);
            frac.appendChild(den);
            els.expressionBox.appendChild(frac);
            break;
        }

        case 'powpow':
            els.expressionBox.appendChild(
                mkSpan(`(${p.base}<sup class="expr-sup">${p.m}</sup>)<sup class="expr-sup">${p.n}</sup>`)
            );
            break;

        case 'baseneg':
            els.expressionBox.appendChild(
                mkSpan(
                    p.hasParen
                        ? `(−${p.base})<sup class="expr-sup">${p.exp}</sup>`
                        : `−${p.base}<sup class="expr-sup">${p.exp}</sup>`
                )
            );
            break;

        case 'notsci':
            if (p.dir === 'to_sci') {
                els.expressionBox.appendChild(mkSpan(p.displayVal));
            } else {
                const expStr = p.exp < 0 ? `(${p.exp})` : String(p.exp);
                els.expressionBox.appendChild(
                    mkSpan(`${p.mantissaStr}&thinsp;·&thinsp;10<sup class="expr-sup">${expStr}</sup>`)
                );
            }
            break;
    }
    addEqSign();
}

// Afegeix el resultat final (en verd) a l'expression-box
function showResult(html) {
    els.expressionBox.appendChild(mkSpan(html, 'expr-result'));
}

// ================================================================
// CONSTRUCTORS D'ESQUEMA (step-schema + step-btns)
// ================================================================

// Esquema amb un sol input: [prefixHTML] = [INPUT]
function buildOneInput(prefixHTML) {
    return c => {
        c.innerHTML = '';
        els.stepBtns.innerHTML = '';
        if (prefixHTML) c.appendChild(mkSpan(prefixHTML, 'schema-text'));
        c.appendChild(mkSpan('=', 'schema-eq'));
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'schema-input';
        inp.id = 'step-input';
        inp.autocomplete = 'off';
        c.appendChild(inp);
    };
}

// Esquema buit (el contingut va als botons)
function buildEmpty() {
    return c => {
        c.innerHTML = '';
        // els.stepBtns s'omple a buildBtnSelect
    };
}

// Inserta botons de selecció a step-btns (rep contenidor com a paràmetre, per consistència)
// [ROUND 1 — clicar un botó ja valida el pas directament, sense necessitat del botó OK]
function buildBtnSelect(options) {
    return _c => {
        els.stepBtns.innerHTML = '';
        selectedOption = null;
        const wrap = document.createElement('div');
        wrap.className = 'schema-btns';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'schema-btn';
            btn.textContent = opt.label;
            btn.onclick = () => {
                wrap.querySelectorAll('.schema-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedOption = opt.value;
                // Auto-submit: no cal botó OK per als passos de botons
                if (!state.isTransitioning && !isPenalizing) checkStep();
            };
            wrap.appendChild(btn);
        });
        els.stepBtns.appendChild(wrap);
    };
}

// ================================================================
// GENERADORS DE PROBLEMES
// ================================================================

// ── REPTE 1: Propietats ──────────────────────────────────────────
function genRepte1(opIdx) {
    const BASES_GRANS = [2, 3, 4, 5, 10];
    const BASES_PETITES = [2, 3, 4, 5];

    // Progressió: primer prod/quot, després s'hi afegeix powpow
    const types = opIdx <= 1 ? pick(['prod', 'quot']) : pick(['prod', 'quot', 'powpow']);

    if (types === 'prod') {
        const base = pick(BASES_GRANS);
        const m = rand(1, 5),
            n = rand(1, 5);
        return { type: 'prod', base, m, n, result: m + n };
    }
    if (types === 'quot') {
        const base = pick(BASES_GRANS);
        const n = rand(1, 4),
            m = n + rand(1, 4);
        return { type: 'quot', base, m, n, result: m - n };
    }
    // powpow
    const base = pick(BASES_PETITES);
    const m = rand(2, 4),
        n = rand(2, 4);
    return { type: 'powpow', base, m, n, result: m * n };
}

// ── REPTE 2: Base negativa ───────────────────────────────────────
// [ROUND 6 — 4 casos garantits: (−t)^parell · (−t)^senar · −t^parell · −t^senar
//            Es barregen a l'inici de cada sessió; opIdx 0-3 en tria un cada vegada]
function maxExpForBase(b) {
    if (b <= 2) return 6;
    if (b <= 4) return 4;
    if (b <= 5) return 3;
    return 3;
}

// Ordre aleatori dels 4 casos, generat una vegada per sessió
let repte2CaseOrder = null;

function genRepte2(opIdx) {
    // Reinicia l'ordre al primer exercici de cada sessió
    if (opIdx === 0 || repte2CaseOrder === null) {
        // Els 4 casos: [hasParen, wantEven]
        const cases = [
            { hasParen: true, wantEven: true }, // (−t)^parell
            { hasParen: true, wantEven: false }, // (−t)^senar
            { hasParen: false, wantEven: true }, // −t^parell
            { hasParen: false, wantEven: false }, // −t^senar
        ];
        // Fisher-Yates shuffle
        for (let i = cases.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cases[i], cases[j]] = [cases[j], cases[i]];
        }
        repte2CaseOrder = cases;
    }

    const { hasParen, wantEven } = repte2CaseOrder[opIdx % 4];
    const base = rand(2, 9);
    const maxExp = maxExpForBase(base);
    // Tria un exponent parell o senar dins del rang permès
    const expPool = [];
    for (let e = 2; e <= maxExp; e++) {
        if ((e % 2 === 0) === wantEven) expPool.push(e);
    }
    const exp = expPool.length > 0 ? pick(expPool) : wantEven ? 2 : 3;

    const rawVal = intPow(base, exp);
    const result = hasParen ? (exp % 2 === 0 ? rawVal : -rawVal) : -rawVal; // −t^n → sempre negatiu independentment de n
    const isEven = exp % 2 === 0;
    return { type: 'baseneg', base, exp, hasParen, rawVal, result, isEven };
}

// ── REPTE 3: Notació científica ──────────────────────────────────
function genRepte3(opIdx) {
    // Mantissa: un dígit enter + un decimal (ex: 3,4)
    // Garanteix que sigui sempre X,Y (no 0,...)
    const mantInt = rand(1, 9);
    const mantDec = rand(0, 9);
    const mantissaStr = mantDec === 0 ? `${mantInt}` : `${mantInt},${mantDec}`;
    const mantissaNum = mantDec === 0 ? mantInt : parseFloat(`${mantInt}.${mantDec}`);

    const expAbs = rand(2, 6);

    // Direcció: parells → to_sci; senars → from_sci
    const dir = opIdx % 2 === 0 ? 'to_sci' : 'from_sci';

    if (dir === 'to_sci') {
        // opIdx 0,2 → nombres grans (exp positiu); opIdx 1,3 → pot ser negatiu
        const expSign = opIdx <= 1 ? 1 : pick([1, -1]);
        const exp = expSign * expAbs;
        const val = mantissaNum * Math.pow(10, exp);

        let displayVal;
        if (exp >= 0) {
            displayVal = String(Math.round(val));
        } else {
            // Nombre petit: mostra amb comma, longitud adequada
            const decimals = expAbs + (mantDec > 0 ? 1 : 0);
            displayVal = val.toFixed(decimals).replace('.', ',');
        }
        return { type: 'notsci', dir, displayVal, mantissaStr, mantissaNum, exp, expAbs };
    } else {
        // from_sci: sempre exponent positiu → resultat enter (més fàcil de validar)
        const exp = expAbs;
        const value = Math.round(mantissaNum * Math.pow(10, exp));
        return { type: 'notsci', dir, mantissaStr, mantissaNum, exp, value };
    }
}

// ================================================================
// CONSTRUCTORS DE PASSOS
// ================================================================

// ── Repte 1 ─────────────────────────────────────────────────────
const PROP_INFO = {
    prod: { label: 'aᵐ · aⁿ = aᵐ⁺ⁿ', opLabel: 'suma', opValue: 'suma', sym: '+' },
    quot: { label: 'aᵐ / aⁿ = aᵐ⁻ⁿ', opLabel: 'resta', opValue: 'resta', sym: '−' },
    powpow: { label: '(aᵐ)ⁿ = aᵐ·ⁿ', opLabel: 'multiplica', opValue: 'multiplica', sym: '×' },
};

function buildStepsRepte1(p) {
    const info = PROP_INFO[p.type];

    // PAS 1: triar l'operació amb exponents
    const step1 = {
        title: `En aquest cas, quina operació cal fer amb els exponents?`,
        hideBtnOk: true /* [ROUND 1 — auto-submit, no cal OK] */,
        buildSchema: buildEmpty(),
        buildBtns: buildBtnSelect([
            { label: 'Sumar', value: 'suma' },
            { label: 'Restar', value: 'resta' },
            { label: 'Multiplicar', value: 'multiplica' },
        ]),
        validate: () => {
            if (selectedOption === null) return false;
            return selectedOption === info.opValue;
        },
    };

    // PAS 2: input superíndex inline a l'expression-box
    const step2 = {
        title: `Escriu l'exponent:` /* [ROUND 2] */,
        buildSchema: c => {
            c.innerHTML = '';
            els.stepBtns.innerHTML = '';
        },
        // [ROUND 2 — appendToExpr: afegeix "base^[input]" directament a l'expression-box]
        appendToExpr: box => {
            const wrapper = document.createElement('span');
            wrapper.className = 'expr-base-sup expr-base-sup-pad';
            wrapper.appendChild(mkSpan(String(p.base)));
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'expr-sup-input';
            inp.id = 'step-input';
            inp.autocomplete = 'off';
            wrapper.appendChild(inp);
            box.appendChild(wrapper);
        },
        buildBtns: () => {
            els.stepBtns.innerHTML = '';
        },
        validate: () => {
            const inp = document.getElementById('step-input');
            if (!inp) return false;
            const v = parseNum(inp.value);
            return !isNaN(v) && v === p.result;
        },
        onCorrect: () => {
            showResult(`${p.base}<sup class="expr-sup">${p.result}</sup>`);
        },
    };

    return [step1, step2];
}

// ── Repte 2 ─────────────────────────────────────────────────────
function buildStepsRepte2(p) {
    const signExpected = p.hasParen && p.isEven ? 'positiu' : !p.hasParen ? 'negatiu' : 'negatiu'; // parens + senar

    // Missatge explicatiu segons el cas
    let signExplanation;
    if (!p.hasParen) {
        signExplanation = `Sense parèntesis, l'exponent sols afecta ${p.base}, no el signe → resultat sempre negatiu.`;
    } else if (p.isEven) {
        signExplanation = `Exponent parell → nombre parell de factors negatius → resultat positiu.`;
    } else {
        signExplanation = `Exponent senar → nombre senar de factors negatius → resultat negatiu.`;
    }

    // PAS 1: determinar el signe  [ROUND 5 — títol únic; 3 botons amb Zero com a distractor]
    const step1 = {
        title: `El resultat de la potència serà positiu, negatiu o zero?`,
        buildSchema: buildEmpty(),
        hideBtnOk: true,
        buildBtns: buildBtnSelect([
            { label: 'Negatiu', value: 'negatiu' },
            { label: 'Zero', value: 'zero' },
            { label: 'Positiu', value: 'positiu' },
        ]),
        validate: () => {
            if (selectedOption === null) return false;
            return selectedOption === signExpected;
        },
        // [ROUND 7 — onCorrect eliminat: l'explicació es mostra al pas 2 com a feedback permanent]
    };

    // PAS 2: calcular el valor numèric — input inline  [ROUND 5]
    const step2 = {
        title: `Calcula el resultat:`,
        // [ROUND 7 — initFeedback: es mostra immediatament quan arriba el pas 2]
        initFeedback: signExplanation,
        buildSchema: c => {
            c.innerHTML = '';
            els.stepBtns.innerHTML = '';
        },
        appendToExpr: box => {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'expr-inline-input';
            inp.id = 'step-input';
            inp.autocomplete = 'off';
            box.appendChild(inp);
        },
        buildBtns: () => {
            els.stepBtns.innerHTML = '';
        },
        validate: () => {
            const inp = document.getElementById('step-input');
            if (!inp) return false;
            const v = parseNum(inp.value);
            return !isNaN(v) && v === p.result;
        },
        onCorrect: () => showResult(String(p.result)),
    };

    return [step1, step2];
}

// ── Repte 3 ─────────────────────────────────────────────────────
function buildStepsRepte3(p) {
    if (p.dir === 'to_sci') {
        // [ROUND 9 — un sol pas: dos inputs inline  displayVal = ? · 10^?]
        // [ROUND 13 — validació parcial: mantissa correcta → verda+bloquejada; exponent continua editable]
        let mantissaLocked = false;
        let expLocked = false;

        const step1 = {
            title: `Escriu la mantissa i l'exponent:`,
            buildSchema: c => {
                c.innerHTML = '';
                els.stepBtns.innerHTML = '';
            },
            appendToExpr: box => {
                // Input mantissa
                const inpM = document.createElement('input');
                inpM.type = 'text';
                inpM.className = 'expr-inline-input';
                inpM.id = 'step-input-mant';
                inpM.autocomplete = 'off';
                box.appendChild(inpM);
                // " · " i "10^[input]" — "10" dins del wrapper per tenir superíndex real
                box.appendChild(mkSpan('&thinsp;·&thinsp;', 'expr-op'));
                const wrapExp = document.createElement('span');
                wrapExp.className = 'expr-base-sup expr-base-sup-pad';
                wrapExp.appendChild(mkSpan('10'));
                const inpE = document.createElement('input');
                inpE.type = 'text';
                inpE.className = 'expr-sup-input';
                inpE.id = 'step-input-exp';
                inpE.autocomplete = 'off';
                wrapExp.appendChild(inpE);
                box.appendChild(wrapExp);
            },
            buildBtns: () => {
                els.stepBtns.innerHTML = '';
            },
            validate: () => {
                const inpM = document.getElementById('step-input-mant');
                const inpE = document.getElementById('step-input-exp');
                if (!inpM || !inpE) return false;

                // Helper per bloquejar un input en verd
                function lockGreen(inp) {
                    inp.readOnly = true;
                    inp.style.color = 'var(--success)';
                    inp.style.borderColor = 'var(--success)';
                    inp.style.background = '#d1fae5';
                    inp.style.fontWeight = 'bold';
                }

                // Si tots dos ja estan bloquejats → verificació final (no hauria de passar)
                if (mantissaLocked && expLocked) return true;

                // ── Avaluació de l'exponent ──────────────────────────────
                if (!expLocked) {
                    const rawE = inpE.value.trim();
                    if (rawE !== '') {
                        const eVal = parseNum(rawE);
                        if (!isNaN(eVal) && eVal === p.exp) {
                            expLocked = true;
                            lockGreen(inpE);
                        }
                    }
                }

                // ── Avaluació de la mantissa ─────────────────────────────
                if (!mantissaLocked) {
                    const rawM = inpM.value.trim();
                    if (rawM === '') {
                        // Focus a mantissa si és buida
                        setTimeout(() => {
                            if (!isTouchDevice()) inpM.focus();
                        }, 50);
                        return false;
                    }
                    if (rawM.includes('.')) {
                        if (els.stepFeedback) {
                            els.stepFeedback.innerText = 'Recorda que has de fer servir coma decimal (,)';
                            els.stepFeedback.className = 'important';
                        }
                        return false;
                    }
                    const mVal = parseFloat(rawM.replace(',', '.'));
                    if (!isNaN(mVal)) {
                        if (Math.abs(mVal) < 1 || Math.abs(mVal) >= 10) {
                            // Comprova si el producte és correcte abans de dir "no és notació científica"
                            const eVal = parseNum(inpE.value.trim());
                            const productOk =
                                !isNaN(eVal) &&
                                Math.abs(mVal * Math.pow(10, eVal) - p.mantissaNum * Math.pow(10, p.exp)) <
                                    Math.abs(p.mantissaNum * Math.pow(10, p.exp)) * 1e-9;
                            if (productOk && els.stepFeedback) {
                                els.stepFeedback.innerText =
                                    'Els càlculs són correctes, però no és notació científica. Corregeix la mantissa.';
                                els.stepFeedback.className = 'important';
                            }
                            return false;
                        }
                        if (Math.abs(mVal - p.mantissaNum) < 1e-9) {
                            mantissaLocked = true;
                            lockGreen(inpM);
                        }
                    }
                }

                // ── Tots dos correctes → èxit ────────────────────────────
                if (mantissaLocked && expLocked) return true;

                // ── Un de sol correcte → missatge vermell + input vermell al camp incorrecte ───
                const inpMref = document.getElementById('step-input-mant');
                const inpEref = document.getElementById('step-input-exp');

                function markRed(inp) {
                    inp.style.color = '#dc2626';
                    inp.style.borderColor = '#dc2626';
                    inp.style.background = '#fee2e2';
                    inp.style.fontWeight = 'bold';
                }

                if (mantissaLocked && !expLocked) {
                    if (inpEref && inpEref.value.trim() !== '') markRed(inpEref);
                    if (els.stepFeedback) {
                        els.stepFeedback.innerText = 'Exponent incorrecte.';
                        els.stepFeedback.className = 'error';
                    }
                    setTimeout(() => {
                        const t = document.getElementById('step-input-exp');
                        if (t) {
                            if (isTouchDevice()) showCustomKeyboard(t);
                            else t.focus();
                        }
                    }, 50);
                } else if (expLocked && !mantissaLocked) {
                    if (inpMref && inpMref.value.trim() !== '') markRed(inpMref);
                    if (els.stepFeedback) {
                        els.stepFeedback.innerText = 'Mantissa incorrecta.';
                        els.stepFeedback.className = 'error';
                    }
                    setTimeout(() => {
                        const t = document.getElementById('step-input-mant');
                        if (t) {
                            if (isTouchDevice()) showCustomKeyboard(t);
                            else t.focus();
                        }
                    }, 50);
                }
                return false;
            },
            onCorrect: () => {
                const expStr = p.exp < 0 ? `(${p.exp})` : String(p.exp);
                showResult(`${p.mantissaStr}&thinsp;·&thinsp;10<sup class="expr-sup">${expStr}</sup>`);
            },
        };
        return [step1];
    } else {
        // from_sci: un sol pas, calcula el valor decimal enter
        const step1 = {
            title: `Expressa el nombre sense fer servir potències:`,
            buildSchema: c => {
                c.innerHTML = '';
                els.stepBtns.innerHTML = '';
            },
            appendToExpr: box => {
                // [ROUND 10 — amplada de l'input basada en el nombre de caràcters del resultat]
                const resultStr = String(p.value).replace('-', '').replace(',', '.');
                const nChars = resultStr.length + 2; // +2 marge
                const pxWidth = Math.max(80, nChars * 18);
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.className = 'expr-inline-input';
                inp.id = 'step-input';
                inp.autocomplete = 'off';
                inp.style.width = pxWidth + 'px';
                box.appendChild(inp);
            },
            buildBtns: () => {
                els.stepBtns.innerHTML = '';
            },
            validate: () => {
                const inp = document.getElementById('step-input');
                if (!inp) return false;
                const v = parseNum(inp.value);
                return !isNaN(v) && v === p.value;
            },
            onCorrect: () => showResult(String(p.value)),
        };
        return [step1];
    }
}

// ================================================================
// SISTEMA GENÈRIC DE PASSOS
// ================================================================

function showCurrentStep() {
    const step = currentSteps[currentStepIdx];

    // [ROUND 7 — initFeedback: feedback permanent precarregat; altrament neteja]
    // [ROUND 8 — visualització de initFeedback deshabilitada temporalment]
    if (els.stepFeedback) {
        els.stepFeedback.innerText = '';
        els.stepFeedback.className = '';
        /* DISABLED: if (step.initFeedback) { ... } */
    }

    els.stepTitle.innerHTML = step.title;

    // [ROUND 2 — si el pas té appendToExpr, afegeix l'input directament a l'expression-box
    //            i amaga la schema-row; altrament, usa el flux normal]
    if (step.appendToExpr) {
        step.appendToExpr(els.expressionBox);
        els.stepSchema.style.display = 'none';
        els.stepSchema.innerHTML = '';
    } else {
        els.stepSchema.style.display = '';
        step.buildSchema(els.stepSchema);
    }

    // Construeix botons (si n'hi ha)
    if (step.buildBtns) step.buildBtns(els.stepBtns);

    // [ROUND 1 — ocultar botó OK en passos de botons (auto-submit); mostrar-lo en passos d'input]
    els.btnSubmitStep.style.display = step.hideBtnOk ? 'none' : '';

    els.currentStep.classList.add('active');
    els.resolutionPanel.style.display = 'flex';

    // Focus al primer input editable (schema-row o expression-box)
    setTimeout(() => {
        const first = els.stepSchema.querySelector('input') || els.expressionBox.querySelector('input:not([readonly])');
        if (first) {
            if (isTouchDevice()) {
                showCustomKeyboard(first);
            } else {
                first.focus();
            }
        }
    }, 120);
}

function flashError() {
    // [ROUND 2+5 — busca inputs tant a schema-row com a expression-box]
    const allInputs = [
        ...els.stepSchema.querySelectorAll('input'),
        ...els.expressionBox.querySelectorAll('.expr-sup-input, .expr-inline-input'),
    ];
    allInputs.forEach(inp => {
        inp.classList.add('error-flash');
        setTimeout(() => inp.classList.remove('error-flash'), 300);
    });
    // Flash botons seleccionats (si és un pas de botons)
    els.stepBtns.querySelectorAll('.schema-btn.selected').forEach(btn => {
        btn.classList.add('error-flash');
        setTimeout(() => btn.classList.remove('error-flash'), 300);
    });
    // Flash botó OK
    els.btnSubmitStep.classList.add('error-shake');
    setTimeout(() => els.btnSubmitStep.classList.remove('error-shake'), 300);
}

function clearAndFocus() {
    // [ROUND 2+5 — buida inputs tant a schema-row com a expression-box]
    const allInputs = [
        ...els.stepSchema.querySelectorAll('input'),
        ...els.expressionBox.querySelectorAll('.expr-sup-input, .expr-inline-input'),
    ];
    allInputs.forEach(inp => {
        if (!inp.readOnly) {
            inp.value = '';
            // Restablir estil si estava marcat en vermell
            inp.style.color = '';
            inp.style.borderColor = '';
            inp.style.background = '';
            inp.style.fontWeight = '';
        }
    });
    const first = allInputs[0] || null;
    if (first) {
        if (isTouchDevice()) {
            kbMarkForOverwrite(first);
            showCustomKeyboard(first);
        } else {
            first.focus();
        }
    }
    // Desselecciona botons
    els.stepBtns.querySelectorAll('.schema-btn').forEach(b => b.classList.remove('selected'));
    selectedOption = null;
}

function checkStep() {
    if (state.isTransitioning || isPenalizing) return;

    const step = currentSteps[currentStepIdx];

    // Tots els passos usen validate()
    // [ROUND 7 — preserva initFeedback si n'hi ha; altrament neteja]
    if (els.stepFeedback && !step.initFeedback) {
        els.stepFeedback.innerText = '';
        els.stepFeedback.className = '';
    }
    const res = step.validate();

    if (res !== true) {
        // [ROUND 9 — si validate ha escrit un avís suau al feedback, no penalitzar ni buidar]
        const hasSoftWarning = els.stepFeedback && els.stepFeedback.innerText !== '';
        if (!hasSoftWarning) {
            flashError();
            penalize();
            if (state.attemptsLeft > 0) clearAndFocus();
        }
        return;
    }

    if (step.onCorrect) step.onCorrect();
    currentStepIdx++;

    if (currentStepIdx >= currentSteps.length) {
        finalizeProblem();
    } else {
        // Petit delay per veure el feedback d'onCorrect si n'hi ha
        setTimeout(() => showCurrentStep(), step.onCorrect ? 600 : 0);
    }
}

// ================================================================
// SELECCIÓ DE REPTE I FLUX DE JOC
// ================================================================

function selectRepte(n) {
    selectedRepte = n;
    startGame();
}

function updateUI() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Exercici ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';
    if (state.attemptsLeft < 3) els.attemptsDisplay.classList.add('danger');
}

function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    isPenalizing = false;

    if (state.currentOperation === 0) usedProblems = new Set();

    // Color de fons progressiu
    const ci = (state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length;
    els.body.style.backgroundColor = bgColors[ci];

    // Genera el problema
    let p, key;
    let tries = 0;
    do {
        if (selectedRepte === 1) p = genRepte1(state.currentOperation);
        else if (selectedRepte === 2) p = genRepte2(state.currentOperation);
        else p = genRepte3(state.currentOperation);
        key = JSON.stringify({ t: p.type, ...p });
        tries++;
    } while (usedProblems.has(key) && tries < 30);
    usedProblems.add(key);
    currentProblem = p;

    // Renderitza l'expressió
    renderExpr(p);

    // Construeix els passos
    if (selectedRepte === 1) currentSteps = buildStepsRepte1(p);
    else if (selectedRepte === 2) currentSteps = buildStepsRepte2(p);
    else currentSteps = buildStepsRepte3(p);

    currentStepIdx = 0;
    showCurrentStep();
    updateUI();
}

function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        state.attemptsLeft--;
        isPenalizing = false;
        updateUI();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            els.resolutionPanel.style.display = 'none';
            finalizeProblem(0);
        }
    }, 900);
}

// [ROUND 4 — mostra la solució correcta a l'expression-box quan els intents s'esgoten]
// Reconstrueix l'expressió original i afegeix el resultat en verd.
function showCorrectAnswer(p) {
    renderExpr(p); // torna a dibuixar l'expressió original (elimina l'input pendent)
    // addEqSign() ja és cridat per renderExpr; afegim el resultat en verd
    switch (p.type) {
        case 'prod':
        case 'quot':
        case 'powpow':
            showResult(`${p.base}<sup class="expr-sup">${p.result}</sup>`);
            break;
        case 'baseneg':
            showResult(String(p.result));
            break;
        case 'notsci':
            if (p.dir === 'to_sci') {
                const expStr = p.exp < 0 ? `(${p.exp})` : String(p.exp);
                showResult(`${p.mantissaStr}&thinsp;·&thinsp;10<sup class="expr-sup">${expStr}</sup>`);
            } else {
                showResult(String(p.value));
            }
            break;
    }
}

function finalizeProblem(forcedPoints) {
    if (forcedPoints === undefined) forcedPoints = null;
    recordResult(forcedPoints === 0 ? 4 : Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3));
    state.isTransitioning = true;
    hideCustomKeyboard();
    els.currentStep.classList.remove('active');
    els.resolutionPanel.style.display = 'none';

    const pts = forcedPoints !== null ? forcedPoints : Math.max(0, 10 - (MAX_INTENTS - state.attemptsLeft) * 2);

    // [ROUND 4 — si intents esgotats (pts=0), mostra la solució correcta en verd]
    if (pts === 0) showCorrectAnswer(currentProblem);

    state.sessionScore += pts;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;

    const waitTime = showMiniOverlay(pts);
    setTimeout(() => {
        hideMiniOverlay();
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

// ================================================================
// TECLAT
// ================================================================
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        if (els.gameScreen.style.display !== 'none' && els.resolutionPanel.style.display !== 'none') {
            e.preventDefault();
            if (!state.isTransitioning && !isPenalizing) checkStep();
        }
    }
});

function checkCurrentCell() {
    const inputs = Array.from(els.stepSchema.querySelectorAll('input'));
    if (!inputs.length) {
        checkStep();
        return;
    }
    const firstEmpty = inputs.find(i => i.value.trim() === '');
    if (firstEmpty) {
        showCustomKeyboard(firstEmpty);
    } else {
        checkStep();
    }
}

// ================================================================
// ARRENCADA
// ================================================================
registerScreens(['selection-screen', 'game-screen', 'session-end-screen', 'final-screen']);
injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true });
showScreen('selection-screen');
