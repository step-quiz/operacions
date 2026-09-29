/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/decimals/decimals.js
 * ROL: Joc «Diners i canvi» (decimals.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, game-core.js, config.js, ./products-diners.js.js, ./diners-feedback.js.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { getIntParam, pick, randInt } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    hideCustomKeyboard,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbMarkForOverwrite,
    recordAnswerToHistory,
    showCustomKeyboard,
    startGame,
    validateConfig,
} from '../game-core.js';
import { DinersFeedback } from './diners-feedback.js';
import { PRODUCTS_DINERS } from './products-diners.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { checkValue, checkBill, buildLevel, checkCurrentCell });

// ============================================================
// PARÀMETRES URL
// ============================================================

const _urlParams = new URLSearchParams(window.location.search);

/**
 * Nivell 1: 1 producte, canvi directe
 * Nivell 2: 2–3 productes, total → canvi                 (default)
 * Nivell 3: 2–3 productes, total → triar bitllet → canvi
 * Nivell 4: Quantitats, total → canvi
 */
const NIVELL = getIntParam(_urlParams, 'nivell', 1, 1, 4);

// ============================================================
// ELEMENTS DOM
// ============================================================

const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    shopDisplay: document.getElementById('shop-display'),
    resolutionPanel: document.getElementById('resolution-panel'),
    stepsDone: document.getElementById('steps-done'),
    stepActive: document.getElementById('step-active'),
    stepPrompt: document.getElementById('step-prompt'),
    answerRow: document.getElementById('answer-row'),
    valueInput: document.getElementById('value-input'),
    btnSubmitVal: document.getElementById('btn-submit-val'),
    billOptions: document.getElementById('bill-options'),
    // CANVI UX: element de feedback inline (substitueix el mini-overlay)
    inlineFeedback: document.getElementById('inline-feedback'),
    // CANVI UX: botó per pujar de nivell (esquerra dels intents)
    btnNextLevel: document.getElementById('btn-next-level'),
    // Missatge pedagògic d'error (diners-feedback.js)
    stepHint: document.getElementById('step-hint'),
};

// ============================================================
// ESTAT LOCAL
// ============================================================

let isPenalizing = false;
let currentProblem = null;
let expectedAnswer = 0;
let currentStep = 1;
let totalSteps = 1;
let stepsDoneList = []; // textos dels passos completats

// ============================================================
// PRODUCTES
// ============================================================

// Catàleg carregat des de js/products-diners.js (variable global PRODUCTS_DINERS)
const PRODUCTS = PRODUCTS_DINERS;

// ============================================================
// UTILITATS
// ============================================================

function pickProduct() {
    return { ...pick(PRODUCTS) };
}

function pickNDifferent(n) {
    const result = [];
    const used = new Set();
    while (result.length < n) {
        const p = pickProduct();
        if (!used.has(p.nom)) {
            used.add(p.nom);
            result.push(p);
        }
    }
    return result;
}

/** Retorna el bitllet més petit que cobreix l'import (de la sèrie estàndard). */
function optimalBill(amount) {
    const bills = [5, 10, 20, 50];
    for (const b of bills) {
        if (b >= amount) return b;
    }
    return 50;
}

/** Genera un preu amb cèntims variats dins [min, max] (passos de 0,05 €). */
function randPrice(min, max) {
    // Treballa en cèntims per evitar errors de coma flotant
    const min5 = Math.ceil(min * 20); // unitats de 0,05
    const max5 = Math.floor(max * 20);
    const val5 = randInt(min5, max5);
    return Math.round(val5 * 5) / 100;
}

/**
 * Genera un preu amb distribució ponderada dins [min, max]:
 *   60% → x,y0  (múltiple de 0,10)
 *   30% → x,y5  (múltiple de 0,05 però NO de 0,10)
 *   10% → x,yz  (qualsevol cèntim que no acabi en 0 ni en 5)
 */
function randPriceWeighted(min, max) {
    const r = Math.random();

    if (r < 0.6) {
        // x,y0 — múltiple de 0,10
        const min10 = Math.ceil(min * 10);
        const max10 = Math.floor(max * 10);
        return (randInt(min10, max10) * 10) / 100;
    }

    if (r < 0.9) {
        // x,y5 — múltiple de 0,05 però no de 0,10 (índex imparell en unitats de 0,05)
        const min5 = Math.ceil(min * 20);
        const max5 = Math.floor(max * 20);
        const minOdd = min5 % 2 === 0 ? min5 + 1 : min5;
        const maxOdd = max5 % 2 === 0 ? max5 - 1 : max5;
        if (minOdd > maxOdd) return randPriceWeighted(min, max); // rang massa estret, torna a intentar
        const count = Math.floor((maxOdd - minOdd) / 2) + 1;
        return Math.round((minOdd + randInt(0, count - 1) * 2) * 5) / 100;
    }

    // x,yz — cèntim que NO és múltiple de 5 (reintenta si cau en múltiple de 5)
    const min100 = Math.ceil(min * 100);
    const max100 = Math.floor(max * 100);
    let cents;
    do {
        cents = randInt(min100, max100);
    } while (cents % 5 === 0);
    return cents / 100;
}

function r100(n) {
    return Math.round(n * 100) / 100;
}

// ============================================================
// FORMAT I PARSEIG
// ============================================================

function fmtMoney(n) {
    if (Math.round(n * 100) % 100 === 0) return Math.round(n) + ' €';
    return n.toFixed(2).replace('.', ',') + ' €';
}

function parseMoneyInput(str) {
    str = String(str).trim().replace('€', '').trim();
    str = str.replace(',', '.');
    // Acceptem qualsevol nombre de decimals (ex: "0.020").
    // El valor es retorna arrodonit a 2 decimals.
    // La detecció de >2 decimals es fa a checkValue per mostrar l'avís.
    if (!/^\d+(\.\d+)?$/.test(str)) return NaN;
    return Math.round(parseFloat(str) * 100) / 100;
}

function moneyEquals(a, b) {
    return Math.round(a * 100) === Math.round(b * 100);
}

// ============================================================
// CODA DE CANVIS SENSE REPETICIÓ
// ============================================================

// CANVI UX: evitem repetir el mateix valor de canvi dins d'una sessió.
// _usedChanges guarda els valors de canvi (en cèntims enters) ja vistos.
// Quan el nombre de valors únics acumulats arriba a MAX_UNIQUE_CHANGES,
// es buida el Set i es reinicia el cicle (evita bloquejos en sessions llargues).
//
// Per al nivell 1 el màxim útil és 6 (hi ha 6 monedes de cèntim possibles).
// Per als nivells 2–4, fixem un cicle de 10 valors únics per sessió.
let _usedChanges = new Set();
const MAX_UNIQUE_CHANGES = NIVELL === 1 ? 6 : 10;

/** Reseteja el registre de canvis al principi de cada sessió. */
function _resetChangeTracking() {
    _usedChanges = new Set();
}

/**
 * Retorna true si el canvi (en euros) ja s'ha usat en el cicle actual.
 * Si el Set ja ha assolit MAX_UNIQUE_CHANGES, el buidem (nou cicle).
 */
function _changeAlreadyUsed(changeCents) {
    if (_usedChanges.size >= MAX_UNIQUE_CHANGES) {
        _usedChanges = new Set();
    }
    return _usedChanges.has(changeCents);
}

function _markChangeUsed(changeCents) {
    _usedChanges.add(changeCents);
}

// ============================================================
// GENERACIÓ DE PROBLEMES
// ============================================================

function generateProblem() {
    if (NIVELL === 1) {
        // 1 producte, canvi = UNA sola moneda de cèntims (≤ 0,50 €).
        // Usa _usedChanges per garantir que no es repeteixi la mateixa moneda
        // de canvi fins que s'hagin vist les 6 possibles (cicle complet).
        const CENT_COINS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5];
        const PAYMENT_VALS = [1, 2, 5, 10];

        let prod, validCombos, chosen;
        let outerAttempts = 0;
        do {
            // Filtrem les combinacions per la moneda que toca segons _usedChanges
            const availableCoins = CENT_COINS.filter(c => !_changeAlreadyUsed(Math.round(c * 100)));
            // Si totes usades, _changeAlreadyUsed() ja ha fet reset, tornem a intentar
            const coinsToTry = availableCoins.length > 0 ? availableCoins : CENT_COINS;

            let innerAttempts = 0;
            validCombos = [];
            do {
                prod = pickProduct();
                validCombos = [];
                for (const bill of PAYMENT_VALS) {
                    for (const coin of coinsToTry) {
                        const price = Math.round((bill - coin) * 100) / 100;
                        if (price > 0 && price >= prod.preu[0] && price <= prod.preu[1]) {
                            validCombos.push({ bill, coin, price });
                        }
                    }
                }
                innerAttempts++;
            } while (validCombos.length === 0 && innerAttempts < 20);

            chosen = pick(validCombos);
            outerAttempts++;
        } while (_changeAlreadyUsed(Math.round(chosen.coin * 100)) && outerAttempts < 10);

        _markChangeUsed(Math.round(chosen.coin * 100));
        prod.price = chosen.price;
        return {
            products: [prod],
            bill: chosen.bill,
            total: chosen.price,
            change: chosen.coin,
            steps: ['change'],
        };
    }

    if (NIVELL === 2) {
        // Màxim 2 productes (randInt(2,2) = sempre 2). Reintenta si el canvi ja s'ha vist.
        let prob,
            attempts = 0;
        do {
            const n = randInt(2, 2);
            const prods = pickNDifferent(n);
            prods.forEach(p => {
                p.price = randPriceWeighted(p.preu[0], p.preu[1]);
            });
            const total = r100(prods.reduce((s, p) => s + p.price, 0));
            const bill = total <= 10 ? 10 : 20;
            prob = { products: prods, bill, total, change: r100(bill - total), steps: ['total', 'change'] };
            attempts++;
        } while (_changeAlreadyUsed(Math.round(prob.change * 100)) && attempts < 15);
        _markChangeUsed(Math.round(prob.change * 100));
        return prob;
    }

    if (NIVELL === 3) {
        // 2–3 productes, triar bitllet + canvi. Reintenta si el canvi ja s'ha vist.
        let prob,
            attempts = 0;
        do {
            const n = randInt(2, 3);
            const prods = pickNDifferent(n);
            prods.forEach(p => {
                p.price = randPriceWeighted(p.preu[0], p.preu[1]);
            });
            const total = r100(prods.reduce((s, p) => s + p.price, 0));
            const bill = optimalBill(total);
            prob = { products: prods, bill, total, change: r100(bill - total), steps: ['total', 'bill', 'change'] };
            attempts++;
        } while (_changeAlreadyUsed(Math.round(prob.change * 100)) && attempts < 15);
        _markChangeUsed(Math.round(prob.change * 100));
        return prob;
    }

    // Nivell 4: quantitats (2–3 productes amb qty 1–3). Reintenta si el canvi ja s'ha vist.
    let prob4,
        attempts4 = 0;
    do {
        const n = randInt(2, 3);
        const prods = pickNDifferent(n);
        prods.forEach(p => {
            p.qty = randInt(1, 3);
            p.price = randPriceWeighted(p.preu[0], p.preu[1]);
        });
        const total = r100(prods.reduce((s, p) => s + p.price * p.qty, 0));
        const bill = total <= 20 ? 20 : 50;
        prob4 = { products: prods, bill, total, change: r100(bill - total), steps: ['total', 'change'] };
        attempts4++;
    } while (_changeAlreadyUsed(Math.round(prob4.change * 100)) && attempts4 < 15);
    _markChangeUsed(Math.round(prob4.change * 100));
    return prob4;
}

// ============================================================
// RENDERITZACIÓ DE LA BOTIGA
// ============================================================

function renderShop(p) {
    let html = '<div class="products-row">';
    p.products.forEach((prod, i) => {
        if (i > 0) html += '<span class="products-plus">+</span>';
        const qtyLabel = prod.qty && prod.qty > 1 ? `<span class="product-qty">${prod.qty} unitats</span>` : '';
        html += `<div class="product-card">
            <span class="product-emoji">${prod.emoji}</span>
            <span class="product-name">${prod.nom}</span>
            ${qtyLabel}
            <span class="product-price">${fmtMoney(prod.price)}</span>
        </div>`;
    });
    html += '</div>';

    // El bitllet es mostra a nivells 1 i 4 (donat des del principi).
    // Als nivells 2 i 3, el bitllet només es mostra un cop resolt el pas 'total'
    // (és a dir, quan currentStep > 1). Fins llavors, l'alumne no ha de saber
    // amb quant pagarà: primer ha de calcular el total.
    const isOnTotalStep = currentProblem.steps[currentStep - 1] === 'total';
    if (NIVELL !== 3 && !(NIVELL >= 2 && isOnTotalStep)) {
        html += `<div class="bill-display">
            <span class="bill-emoji">💵</span>
            Pagues amb ${fmtMoney(p.bill)}
        </div>`;
    }
    return html;
}

// ============================================================
// GESTIÓ DE PASSOS
// ============================================================

function getStepPrompt(stepType) {
    if (stepType === 'total') return 'Quin és el total?';
    if (stepType === 'bill') return 'Amb quin bitllet pagues?';
    if (stepType === 'change') return 'Quin canvi reps?';
    return '';
}

function getExpectedForStep(stepType) {
    if (stepType === 'total') return currentProblem.total;
    if (stepType === 'change') return currentProblem.change;
    return 0; // 'bill' es gestiona amb botons, no amb input
}

/** Mostra el pas correcte (input numèric o botons de bitllet). */
function showStep() {
    const stepType = currentProblem.steps[currentStep - 1];
    els.stepPrompt.textContent = getStepPrompt(stepType);

    // Renderitzar passos completats
    els.stepsDone.innerHTML = stepsDoneList.map(t => `<div class="step-done">${t}</div>`).join('');

    if (stepType === 'bill') {
        // Pas de selecció de bitllet: mostra botons, amaga input
        els.answerRow.style.display = 'none';
        els.btnSubmitVal.style.display = 'none';
        els.billOptions.style.display = 'flex';
        hideCustomKeyboard();

        // Genera opcions: bitllet correcte + 1–2 incorrectes
        const correct = currentProblem.bill;
        const allBills = [5, 10, 20, 50];
        const options = [correct];

        // Afegeix 1–2 bitllets incorrectes (massa petits o massa grans)
        const others = allBills.filter(b => b !== correct);
        // Un bitllet massa gran (si existeix)
        const bigger = others.filter(b => b > correct);
        if (bigger.length) options.push(pick(bigger));
        // Un bitllet massa petit (no cobreix el total)
        const smaller = others.filter(b => b < currentProblem.total && !options.includes(b));
        if (smaller.length) options.push(pick(smaller));

        // Si encara en falten, afegeix qualsevol no repetit
        while (options.length < 3) {
            const candidate = pick(others);
            if (!options.includes(candidate)) options.push(candidate);
            else break;
        }

        options.sort((a, b) => a - b);

        els.billOptions.innerHTML = options
            .map(
                b =>
                    `<button class="bill-option-btn" data-bill="${b}"
                     onclick="checkBill(${b}, this)">${fmtMoney(b)}</button>`
            )
            .join('');
    } else {
        // Pas numèric: mostra input, amaga botons
        els.answerRow.style.display = 'flex';
        els.btnSubmitVal.style.display = 'inline-flex';
        els.billOptions.style.display = 'none';
        els.valueInput.value = '';
        expectedAnswer = getExpectedForStep(stepType);

        if (isTouchDevice()) showCustomKeyboard(els.valueInput);
        else els.valueInput.focus();
    }
}

/** Avança al pas següent o finalitza l'operació. */
function advanceStep(doneText) {
    stepsDoneList.push(doneText);
    // Neteja el missatge pedagògic i l'estat error-val en canviar de pas
    els.stepHint.textContent = '';
    els.stepHint.classList.remove('visible');
    els.valueInput.classList.remove('error-val');

    if (currentStep >= currentProblem.steps.length) {
        // Últim pas completat
        hideCustomKeyboard();
        finishOperation(true);
    } else {
        currentStep++;
        // CANVI UX: als nivells 2 i 3, el bitllet s'amagava durant el pas 'total'.
        // Ara que avancem al pas següent, re-renderitzem la botiga perquè aparegui.
        els.shopDisplay.innerHTML = renderShop(currentProblem);
        showStep();
    }
}

// ============================================================
// COMPROVACIÓ DE RESPOSTES
// ============================================================

function checkValue() {
    if (state.isTransitioning || isPenalizing) return;
    const raw = els.valueInput.value.trim();
    if (raw === '') return;

    // CANVI UX: detectem punt decimal europeu abans de parsear.
    // parseMoneyInput acceptaria "0.02" silenciosament (fa replace(',','.')).
    // Volem informar explícitament l'alumne que cal usar la coma.
    // No penalitzem: és un error de format, no de concepte.
    if (raw.includes('.')) {
        showErrorInInput("Has d'escriure amb COMA decimal i no amb punt decimal.");
        shakeBtn(els.btnSubmitVal);
        return;
    }

    const userAnswer = parseMoneyInput(raw);
    if (isNaN(userAnswer)) {
        shakeBtn(els.btnSubmitVal);
        penalize();
        return;
    }

    // CANVI UX: detectem si l'alumne ha escrit més de 2 decimals (ex: "0,020").
    // Si el valor arrodonit és igualment correcte, l'acceptem però mostrem
    // un avís lleuger durant 1,5 s. No penalitzem ni bloquejem l'avanç.
    const rawNormalized = raw.replace(',', '.');
    const dotPos = rawNormalized.indexOf('.');
    const hasExtraDecimals = dotPos !== -1 && rawNormalized.length - dotPos - 1 > 2;

    const stepType = currentProblem.steps[currentStep - 1];
    const question = buildQuestionText(stepType);

    if (hasExtraDecimals && moneyEquals(userAnswer, expectedAnswer)) {
        // Resposta correcta matemàticament, però amb decimals de sobra.
        // Mostrem avís temporal, registrem com a correcte i avancem.
        els.stepHint.textContent = '🔍 Has afegit més de dos decimals, vigila!';
        els.stepHint.classList.add('visible');
        setTimeout(() => {
            els.stepHint.textContent = '';
            els.stepHint.classList.remove('visible');
        }, 1500);
        recordAnswerToHistory(question, raw, true);
        if (stepType === 'total') {
            advanceStep(`✅ Total: ${fmtMoney(userAnswer)}`);
        } else {
            advanceStep(`✅ Canvi: ${fmtMoney(userAnswer)}`);
        }
        return;
    }

    if (!moneyEquals(userAnswer, expectedAnswer)) {
        shakeBtn(els.btnSubmitVal);
        recordAnswerToHistory(question, raw, false);
        penalize();

        // Missatge pedagògic específic (només al pas de 'change')
        if (stepType === 'change') {
            const errCode = DinersFeedback.detectChangeError(expectedAnswer, userAnswer, currentProblem.total);
            const msg = DinersFeedback.getChangeMsg(errCode, expectedAnswer, userAnswer, currentProblem.total);
            if (msg) {
                // CANVI UX: manté el text incorrecte visible en vermell
                // perquè l'alumne pugui llegir el missatge pedagògic en context.
                showErrorInInput(msg);
                return;
            }
        }

        // Sense missatge específic: neteja l'input com abans
        if (isTouchDevice()) kbMarkForOverwrite(els.valueInput);
        else {
            els.valueInput.value = '';
            els.valueInput.focus();
        }
        return;
    }

    recordAnswerToHistory(question, raw, true);

    if (stepType === 'total') {
        advanceStep(`✅ Total: ${fmtMoney(expectedAnswer)}`);
    } else {
        advanceStep(`✅ Canvi: ${fmtMoney(expectedAnswer)}`);
    }
}

function checkBill(chosen, btn) {
    if (state.isTransitioning || isPenalizing) return;

    const question = 'Bitllet òptim per a ' + fmtMoney(currentProblem.total);

    if (chosen !== currentProblem.bill) {
        btn.classList.add('error-shake');
        setTimeout(() => btn.classList.remove('error-shake'), 200);
        recordAnswerToHistory(question, fmtMoney(chosen), false);
        penalize();
        return;
    }

    recordAnswerToHistory(question, fmtMoney(chosen), true);
    btn.classList.add('correct');

    // Ara mostrem el bitllet a la botiga (per al pas del canvi)
    const shopEl = els.shopDisplay;
    if (!shopEl.querySelector('.bill-display')) {
        shopEl.insertAdjacentHTML(
            'beforeend',
            `<div class="bill-display" style="animation: fadeIn 0.3s;">
                <span class="bill-emoji">💵</span>
                Pagues amb ${fmtMoney(chosen)}
            </div>`
        );
    }

    setTimeout(() => {
        advanceStep(`✅ Bitllet: ${fmtMoney(chosen)}`);
    }, 500);
}

// ============================================================
// TEXT DE PREGUNTA PER A L'HISTORIAL
// ============================================================

function buildQuestionText(stepType) {
    const p = currentProblem;
    if (stepType === 'total') {
        return p.products
            .map(prod => {
                const base = `${prod.emoji} ${fmtMoney(prod.price)}`;
                return prod.qty && prod.qty > 1 ? `${prod.qty}×${base}` : base;
            })
            .join(' + ');
    }
    if (stepType === 'bill') {
        return `Bitllet per ${fmtMoney(p.total)}`;
    }
    // change
    return `Canvi: ${fmtMoney(p.bill)} − ${fmtMoney(p.total)}`;
}

// ============================================================
// UI HELPERS
// ============================================================

function shakeBtn(btn) {
    btn.classList.add('error-shake');
    setTimeout(() => btn.classList.remove('error-shake'), 200);
}

/**
 * CANVI UX: mostra un missatge pedagògic mantenint el text incorrecte
 * visible dins l'input amb contorn vermell.
 * - Selecciona tot el text perquè l'alumne pugui esborrar-lo fàcilment.
 * - El vermell desapareix automàticament quan l'alumne modifica l'input.
 * - No esborra ni sobreescriu el valor: l'alumne decideix quan esborrar.
 */
function showErrorInInput(msg) {
    els.stepHint.textContent = msg;
    els.stepHint.classList.add('visible');

    // Contorn vermell i text seleccionat
    els.valueInput.classList.add('error-val');
    els.valueInput.select();
    if (!isTouchDevice()) els.valueInput.focus();
}

// Listener: neteja l'estat error-val en qualsevol modificació de l'input.
// Usem 'input' (i no 'keydown') perquè funciona tant amb teclat físic
// com amb el teclat custom tàctil.
els.valueInput.addEventListener('input', () => {
    if (els.valueInput.classList.contains('error-val')) {
        els.valueInput.classList.remove('error-val');
        // Mantenim el stepHint visible fins que l'alumne premi OK de nou,
        // per donar-li temps de rellegir el missatge mentre corregeix.
    }
});

function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Compra ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 1 ? ' danger' : '');
}

// ============================================================
// LÒGICA PRINCIPAL
// ============================================================

function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    isPenalizing = false;
    state.isTransitioning = false;
    currentStep = 1;
    stepsDoneList = [];

    // Reseteja el registre anti-repetició al principi de cada sessió
    if (state.currentOperation === 0) _resetChangeTracking();

    // CANVI UX: netejem el feedback inline, el missatge pedagògic i l'estat error-val
    hideInlineFeedback();
    els.stepHint.textContent = '';
    els.stepHint.classList.remove('visible');
    els.valueInput.classList.remove('error-val');

    currentProblem = generateProblem();
    totalSteps = currentProblem.steps.length;

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    els.stepsDone.innerHTML = '';
    els.resolutionPanel.style.display = 'none';

    updateHeader();

    els.shopDisplay.innerHTML = renderShop(currentProblem);

    els.resolutionPanel.style.display = 'flex';
    showStep();
}

function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;

    setTimeout(() => {
        state.attemptsLeft--;
        updateHeader();

        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            hideCustomKeyboard();

            // CANVI UX: mostra la resposta correcta dins la mateixa box de l'input.
            // L'alumne veu exactament on s'havia d'arribar, en el mateix lloc
            // on havia d'escriure. Color verd per distingir-ho de l'error.
            els.valueInput.value = fmtMoney(expectedAnswer).replace(' €', '');
            els.valueInput.style.borderColor = 'var(--success)';
            els.valueInput.style.background = '#dcfce7';
            els.valueInput.style.color = '#166534';

            finishOperation(false);
        }

        isPenalizing = false;
    }, 400);
}

// ── Feedback inline ──────────────────────────────────────────
// CANVI UX: En lloc del mini-overlay de game-core (que apareixia
// fora del viewport en pantalles petites), mostrem el resultat
// directament al costat del botó OK, dins el panell visible.
//
// showInlineFeedback():
//   - Mostra el missatge (èxit o fracàs) al costat del botó OK.
//   - Bloqueja qualsevol entrada d'usuari via isTransitioning = true.
//   - Deshabilita visualment el botó OK i l'input.
// hideInlineFeedback():
//   - Restaura el botó OK i l'input al seu estat normal.
//   - (isTransitioning es torna false a buildLevel, no aquí)

function showInlineFeedback(levelPoints) {
    // Bloquem entrada immediatament (alumnes nerviosos, clics múltiples)
    state.isTransitioning = true;
    els.btnSubmitVal.disabled = true;
    if (els.valueInput) els.valueInput.disabled = true;

    const fb = els.inlineFeedback;
    fb.classList.remove('success', 'failure', 'visible');

    if (levelPoints > 0) {
        fb.innerHTML = `⭐ Molt bé! <span style="opacity:0.75;font-size:0.9em">+${levelPoints}</span>`;
        fb.classList.add('success', 'visible');
    } else {
        fb.innerHTML = '❌ Intents esgotats';
        fb.classList.add('failure', 'visible');
    }
}

function hideInlineFeedback() {
    const fb = els.inlineFeedback;
    fb.classList.remove('visible', 'success', 'failure');
    fb.innerHTML = '';
    els.btnSubmitVal.disabled = false;
    if (els.valueInput) {
        els.valueInput.disabled = false;
        // Neteja els estils inline aplicats quan s'esgoten els intents
        els.valueInput.style.borderColor = '';
        els.valueInput.style.background = '';
        els.valueInput.style.color = '';
    }
}

function finishOperation(success) {
    const fails = MAX_INTENTS - state.attemptsLeft;
    const levelPoints = success ? Math.max(0, 10 - fails * 2) : 0;
    state.sessionScore += levelPoints;

    // CANVI UX: feedback inline en lloc de showMiniOverlay (voir showInlineFeedback)
    const waitTime = success ? 1200 : 2800;
    showInlineFeedback(levelPoints);

    setTimeout(() => {
        hideInlineFeedback();
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

// ── Teclat físic ────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (els.gameScreen.style.display === 'none') return;
    if (els.resolutionPanel.style.display === 'none') return;
    // Només si el pas actiu és d'input numèric (no botons)
    if (els.answerRow.style.display === 'none') return;
    e.preventDefault();
    if (!state.isTransitioning) checkValue();
});

function checkCurrentCell() {
    checkValue();
}

// ============================================================
// INICI
// ============================================================

injectSharedHTML();
validateConfig();

// Teclat custom: tecla ',' en lloc de '−' (no hi ha imports negatius)
initCustomKeyboard({ allowNegative: true });
const minusBtn = document.querySelector('.kb-btn.kb-minus');
if (minusBtn) {
    minusBtn.dataset.key = ',';
    minusBtn.textContent = ',';
    minusBtn.classList.remove('kb-minus');
}

// ── Botó "Passar al nivell X" ────────────────────────────────
// CANVI UX: permet pujar de nivell (mai baixar) en qualsevol moment.
// Es mostra només si hi ha un nivell superior (NIVELL < 4).
// En clicar, recarrega la pàgina conservant tots els paràmetres URL
// actuals però incrementant ?nivell en 1.
(function initNextLevelBtn() {
    const btn = els.btnNextLevel;
    if (!btn || NIVELL >= 3) return; // nivell 3 és el màxim amb botó (N4 no té sentit pujar)

    btn.textContent = `Passar al nivell ${NIVELL + 1} ›`;
    btn.classList.add('visible');

    btn.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        params.set('nivell', NIVELL + 1);
        window.location.search = params.toString();
    });
})();

startGame();
