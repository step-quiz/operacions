/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/complexos/complexos.js
 * ROL: Joc «Nombres Complexos» (complexos.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, fixed-sessions.js.
 * ============================================================================
 */

import { FixedSessions } from '../fixed-sessions.js';
import { parseStrictInt, randInt } from '../utils.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { switchOp, initSumaResta, initProducte, initDivisio });

const T_FOCUS_DELAY = 50,
    T_SCROLL_DELAY = 150;

// ─── ESTAT GLOBAL ─────────────────────────────────────────────────
let currentOp = 'sumaresta';
let z1 = { re: 0, im: 0 },
    z2 = { re: 0, im: 0 };
let opSign = '+';
let expectedRe = 0,
    expectedIm = 0;
let errorCount = 0,
    finished = false,
    hintShown = false;

// ─── UTILS ────────────────────────────────────────────────────────
// randInt, pick, parseStrictInt → utils.js
function randCoef() {
    const r = Math.random();
    if (r < 0.2) return 0;
    if (r < 0.5) return -randInt(1, 9);
    return randInt(1, 9);
}
function randNonZeroCoef() {
    return (Math.random() < 0.3 ? -1 : 1) * randInt(1, 9);
}

function isInvalidPair(a, b, c, d) {
    // z1=0 o z2=0
    if (a === 0 && b === 0) return true;
    if (c === 0 && d === 0) return true;
    // z1=1 o z2=1
    if (a === 1 && b === 0) return true;
    if (c === 1 && d === 0) return true;
    // Ambdós reals purs (b=0 i d=0)
    if (b === 0 && d === 0) return true;
    // z1 real pura + z2 imaginària pura (o viceversa)
    if (b === 0 && c === 0) return true;
    if (a === 0 && d === 0) return true;
    return false;
}

function generateTwoComplex() {
    let a, b, c, d;
    if (Math.random() < 0.8) {
        // 80%: tots quatre coeficients no nuls
        do {
            a = randNonZeroCoef();
            b = randNonZeroCoef();
            c = randNonZeroCoef();
            d = randNonZeroCoef();
        } while (isInvalidPair(a, b, c, d));
    } else {
        // 20%: almenys un zero, però respectant les restriccions
        do {
            a = randCoef();
            b = randCoef();
            c = randCoef();
            d = randCoef();
            if (a !== 0 && b !== 0 && c !== 0 && d !== 0) {
                const pick = randInt(0, 3);
                if (pick === 0) a = 0;
                else if (pick === 1) b = 0;
                else if (pick === 2) c = 0;
                else d = 0;
            }
        } while (isInvalidPair(a, b, c, d));
    }
    return [
        { re: a, im: b },
        { re: c, im: d },
    ];
}
function fmtNum(n) {
    return n >= 0 ? String(n) : '−' + Math.abs(n);
}
function fmtComplex(re, im) {
    if (re === 0 && im === 0) return '0';
    let p = [];
    if (re !== 0) p.push(fmtNum(re));
    if (im !== 0) {
        const a = Math.abs(im);
        if (re !== 0) p.push(im > 0 ? ' + ' : ' − ');
        else if (im < 0) p.push('−');
        p.push(a === 1 ? '<em>i</em>' : a + '<em>i</em>');
    }
    return p.join('');
}
/** Genera HTML d'una fracció CSS */
function htmlFrac(num, den, extraClass) {
    const cls = 'frac' + (extraClass ? ' ' + extraClass : '');
    return `<span class="${cls}"><span class="frac-num">${num}</span><span class="frac-den">${den}</span></span>`;
}
const isTouchDevice = () => window.matchMedia('(pointer: coarse) and (hover: none)').matches;

// ─── TABS ─────────────────────────────────────────────────────────
function switchOp(op, btn) {
    if (btn.classList.contains('disabled')) return;
    document.querySelectorAll('.ops-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentOp = op;
    ['sumaresta', 'producte', 'divisio', 'potencia'].forEach(id => {
        document.getElementById('panel-' + id).style.display = id === op ? '' : 'none';
    });
    hideCustomKeyboard();
    if (op === 'sumaresta') initSumaResta();
    else if (op === 'producte') initProducte();
    else if (op === 'divisio') initDivisio();
}

// ─── INPUT GENÈRIC ────────────────────────────────────────────────
function setupInput(inp) {
    inp.removeEventListener('keydown', onKeyDown);
    inp.addEventListener('keydown', onKeyDown);
    if (isTouchDevice()) {
        inp.setAttribute('readonly', true);
        inp.inputMode = 'none';
        inp.addEventListener('pointerdown', function () {
            if (!inp.disabled) {
                activeKbInput = inp;
                kbClearOnNext = false;
                setTimeout(() => {
                    const kb = document.getElementById('customKeyboard');
                    if (kb.classList.contains('kb-visible'))
                        kb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 50);
            }
        });
    } else {
        inp.removeAttribute('readonly');
        inp.inputMode = 'numeric';
        inp.addEventListener('focus', () => {
            setTimeout(() => inp.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
        });
    }
}
function onKeyDown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        onEnterPressed();
    } else if (e.key === 'Tab') {
        e.preventDefault();
        tabToNext(e.target);
    }
}
function tabToNext(current) {
    const panel = document.getElementById('panel-' + currentOp);
    const inputs = [...panel.querySelectorAll('.step-input:not(:disabled)')];
    if (!inputs.length) return;
    const idx = inputs.indexOf(current);
    const next = inputs[(idx + 1) % inputs.length];
    next.focus();
    if (isTouchDevice()) {
        activeKbInput = next;
        kbClearOnNext = false;
    }
}
function onEnterPressed() {
    if (currentOp === 'sumaresta') enterSR();
    else if (currentOp === 'producte') enterPR();
    else if (currentOp === 'divisio') enterDV();
}
function focusInput(inp) {
    if (isTouchDevice()) {
        activeKbInput = inp;
        if (!document.getElementById('customKeyboard').classList.contains('kb-visible')) showCustomKeyboard(inp);
    } else {
        setTimeout(() => inp.focus(), T_FOCUS_DELAY);
    }
}
function selectInputContent(inp) {
    if (isTouchDevice()) {
        kbClearOnNext = true;
        inp.classList.add('kb-selected');
    } else {
        setTimeout(() => {
            inp.focus();
            inp.select();
        }, T_FOCUS_DELAY);
    }
}
function triggerShake(inp) {
    inp.classList.remove('anim-shake');
    void inp.offsetWidth;
    inp.classList.add('anim-shake');
}

/* [ROUND 1 — signe dinàmic: − al span, valor absolut a l'input] */
function setupImSignHandlers(imInp) {
    if (!imInp || !imInp.dataset.signId) return;
    // Teclat físic: la tecla '-' commuta el span en lloc d'escriure al valor
    imInp.addEventListener('keydown', e => {
        if (e.key === '-') {
            e.preventDefault();
            const span = document.getElementById(imInp.dataset.signId);
            if (span) span.textContent = span.textContent.trim() === '−' ? '+' : '−';
        }
    });
    // Salvaguarda: si '-' arriba a l'input (p.ex. enganxar), el mou al span
    imInp.addEventListener('input', () => {
        if (imInp.value.startsWith('-')) {
            const span = document.getElementById(imInp.dataset.signId);
            if (span) {
                span.textContent = '−';
                imInp.value = imInp.value.slice(1);
            }
        }
    });
}
function readSignedImValue(inp) {
    if (!inp) return NaN;
    const span = inp.dataset.signId ? document.getElementById(inp.dataset.signId) : null;
    const sign = span && span.textContent.trim() === '−' ? -1 : 1;
    const v = parseStrictInt(inp.value);
    if (isNaN(v)) return NaN;
    return v === 0 ? 0 : v * sign;
}

// ─── VALIDACIÓ GENÈRICA 2 INPUTS (re+im) ─────────────────────────
function genericEnter2(panelId) {
    const panel = document.getElementById(panelId);
    const inputs = [...panel.querySelectorAll('.step-input:not(:disabled)')];
    if (!inputs.length) return 'check';
    const cur = activeKbInput || document.activeElement;
    const hasVal = v => v.trim() !== '' && v.trim() !== '-';
    if (cur && hasVal(cur.value)) {
        const empty = inputs.find(i => i !== cur && !hasVal(i.value));
        if (empty) {
            focusInput(empty);
            if (isTouchDevice()) activeKbInput = empty;
            return 'jumped';
        }
    }
    return 'check';
}

function genericCheck2(inpRe, inpIm, expRe, expIm, locked, errSpan, hintKey, fb) {
    fb.classList.remove('fade-out');
    const reT = inpRe ? inpRe.value.trim() : '',
        imT = inpIm ? inpIm.value.trim() : '';
    const reE = !locked.re && (reT === '' || reT === '-'),
        imE = !locked.im && (imT === '' || imT === '-');
    if (reE || imE) {
        fb.style.color = 'var(--warning)';
        fb.innerText = '⚠️ Cal omplir la part real i la part imaginària.';
        if (reE) focusInput(inpRe);
        else focusInput(inpIm);
        return 'empty';
    }
    const eRe = locked.re ? expRe : parseStrictInt(reT),
        eIm = locked.im ? expIm : readSignedImValue(inpIm); /* [ROUND 1] */
    if (!locked.re && isNaN(eRe)) {
        fb.style.color = 'var(--warning)';
        fb.innerText = '⚠️ Escriu un número.';
        focusInput(inpRe);
        return 'nan';
    }
    if (!locked.im && isNaN(eIm)) {
        fb.style.color = 'var(--warning)';
        fb.innerText = '⚠️ Escriu un número.';
        focusInput(inpIm);
        return 'nan';
    }
    const reOk = eRe === expRe,
        imOk = eIm === expIm;
    if (reOk && imOk) {
        fb.innerText = '';
        return 'ok';
    }
    errorCount++;
    document.getElementById(errSpan).textContent = errorCount;
    showHint(hintKey);
    fb.style.color = 'var(--danger)';
    fb.innerText = '❌ No és correcte. Torna-ho a intentar.';
    if (reOk && !locked.re) {
        locked.re = true;
        inpRe.disabled = true;
        inpRe.classList.add('locked-ok');
    }
    if (imOk && !locked.im) {
        locked.im = true;
        inpIm.disabled = true;
        inpIm.classList.add('locked-ok');
    }
    if (!reOk && !locked.re) {
        triggerShake(inpRe);
        selectInputContent(inpRe);
    }
    if (!imOk && !locked.im) {
        triggerShake(inpIm);
        if (reOk || locked.re) selectInputContent(inpIm);
    }
    if (!reOk && !locked.re) focusInput(inpRe);
    else if (!imOk && !locked.im) focusInput(inpIm);
    return 'error';
}

function showHint(key) {
    if (hintShown) return;
    hintShown = true;
    const h = document.getElementById('hint' + key);
    if (key === 'SR') {
        const w = opSign === '+' ? 'sumar' : 'restar';
        h.innerHTML = `Cal ${w} <strong>per separat</strong> la part real i la part imaginària.`;
    } else if (key === 'PR') {
        h.innerHTML = `(a+b<em>i</em>) · (c+d<em>i</em>) = (ac−bd) + (ad+bc) · <em>i</em>`;
    } else if (key === 'DV') {
        h.innerHTML = `Multiplica numerador i denominador pel <strong>conjugat</strong> del denominador.`;
    }
    h.classList.add('visible');
}
/* [ROUND 2 — amaga el hint quan la resposta és correcta] */
function hideHint(key) {
    const h = document.getElementById('hint' + key);
    if (h) h.classList.remove('visible');
}

// ════════════════════════════════════════════════════════════════════
// SUMA / RESTA
// ════════════════════════════════════════════════════════════════════
let srLocked = { re: false, im: false };
function generateSR() {
    FixedSessions?.next('SR');
    [z1, z2] = generateTwoComplex();
    opSign = Math.random() < 0.5 ? '+' : '−';
    if (opSign === '+') {
        expectedRe = z1.re + z2.re;
        expectedIm = z1.im + z2.im;
    } else {
        expectedRe = z1.re - z2.re;
        expectedIm = z1.im - z2.im;
    }
}
function initSumaResta() {
    hideCustomKeyboard();
    generateSR();
    errorCount = 0;
    finished = false;
    hintShown = false;
    srLocked = { re: false, im: false };
    document.getElementById('errCntSR').textContent = '0';
    document.getElementById('exDispSR').innerHTML =
        `( ${fmtComplex(z1.re, z1.im)} )&ensp;${opSign}&ensp;( ${fmtComplex(z2.re, z2.im)} )&ensp;= ?`;
    const h = document.getElementById('hintSR');
    h.classList.remove('visible');
    h.innerHTML = '';
    document.getElementById('answerSR').innerHTML =
        `<div class="answer-inline"><span class="answer-label">Escriu el resultat:</span><input type="text" inputmode="numeric" autocomplete="off" class="step-input" id="sr-re"><span class="answer-symbol" id="sign-sr">+</span><input type="text" inputmode="numeric" autocomplete="off" class="step-input" id="sr-im" data-sign-id="sign-sr"><span class="answer-symbol-i">·&thinsp;i</span></div>`;
    setupInput(document.getElementById('sr-re'));
    setupInput(document.getElementById('sr-im'));
    setupImSignHandlers(document.getElementById('sr-im')); /* [ROUND 1] */
    document.getElementById('fbSR').innerText = '';
    document.getElementById('fbSR').classList.remove('fade-out');
    document.getElementById('resSR').innerHTML = '';
    if (isTouchDevice()) showCustomKeyboard(document.getElementById('sr-re'));
    else setTimeout(() => document.getElementById('sr-re').focus(), T_FOCUS_DELAY);
}
function enterSR() {
    if (genericEnter2('panel-sumaresta') !== 'check') return;
    checkSR();
}
function checkSR() {
    const r = genericCheck2(
        document.getElementById('sr-re'),
        document.getElementById('sr-im'),
        expectedRe,
        expectedIm,
        srLocked,
        'errCntSR',
        'SR',
        document.getElementById('fbSR')
    );
    if (r === 'ok') {
        hideCustomKeyboard();
        hideHint('SR');
        finished = true; /* [ROUND 2] */
        document.getElementById('exDispSR').innerHTML =
            `( ${fmtComplex(z1.re, z1.im)} )&ensp;${opSign}&ensp;( ${fmtComplex(z2.re, z2.im)} )`;
        document.getElementById('answerSR').innerHTML =
            `<div class="answer-final">= ${fmtComplex(expectedRe, expectedIm)}</div>`;
        document.getElementById('resSR').innerHTML =
            `<div class="result-box anim-fade-in-up"><div class="result-title">✅ Correcte!</div><button class="btn-check-sm" style="margin:16px auto 0;display:block" onclick="initSumaResta()">Exercici nou</button></div>`;
        setTimeout(
            () => document.getElementById('resSR').scrollIntoView({ behavior: 'smooth', block: 'center' }),
            T_SCROLL_DELAY
        );
    }
}

// ════════════════════════════════════════════════════════════════════
// PRODUCTE
// ════════════════════════════════════════════════════════════════════
let prLocked = { re: false, im: false };
function generatePR() {
    FixedSessions?.next('PR');
    [z1, z2] = generateTwoComplex();
    expectedRe = z1.re * z2.re - z1.im * z2.im;
    expectedIm = z1.re * z2.im + z1.im * z2.re;
}
function initProducte() {
    hideCustomKeyboard();
    generatePR();
    errorCount = 0;
    finished = false;
    hintShown = false;
    prLocked = { re: false, im: false };
    document.getElementById('errCntPR').textContent = '0';
    document.getElementById('exDispPR').innerHTML =
        `( ${fmtComplex(z1.re, z1.im)} ) · ( ${fmtComplex(z2.re, z2.im)} )&ensp;= ?`;
    const h = document.getElementById('hintPR');
    h.classList.remove('visible');
    h.innerHTML = '';
    document.getElementById('answerPR').innerHTML =
        `<div class="answer-inline"><span class="answer-label">Escriu el resultat:</span><input type="text" inputmode="numeric" autocomplete="off" class="step-input" id="pr-re"><span class="answer-symbol" id="sign-pr">+</span><input type="text" inputmode="numeric" autocomplete="off" class="step-input" id="pr-im" data-sign-id="sign-pr"><span class="answer-symbol-i">·&thinsp;i</span></div>`;
    setupInput(document.getElementById('pr-re'));
    setupInput(document.getElementById('pr-im'));
    setupImSignHandlers(document.getElementById('pr-im')); /* [ROUND 1] */
    document.getElementById('fbPR').innerText = '';
    document.getElementById('fbPR').classList.remove('fade-out');
    document.getElementById('resPR').innerHTML = '';
    if (isTouchDevice()) showCustomKeyboard(document.getElementById('pr-re'));
    else setTimeout(() => document.getElementById('pr-re').focus(), T_FOCUS_DELAY);
}
function enterPR() {
    if (genericEnter2('panel-producte') !== 'check') return;
    checkPR();
}
function checkPR() {
    const r = genericCheck2(
        document.getElementById('pr-re'),
        document.getElementById('pr-im'),
        expectedRe,
        expectedIm,
        prLocked,
        'errCntPR',
        'PR',
        document.getElementById('fbPR')
    );
    if (r === 'ok') {
        hideCustomKeyboard();
        hideHint('PR');
        finished = true; /* [ROUND 2] */
        document.getElementById('exDispPR').innerHTML =
            `( ${fmtComplex(z1.re, z1.im)} ) · ( ${fmtComplex(z2.re, z2.im)} )`;
        document.getElementById('answerPR').innerHTML =
            `<div class="answer-final">= ${fmtComplex(expectedRe, expectedIm)}</div>`;
        document.getElementById('resPR').innerHTML =
            `<div class="result-box anim-fade-in-up"><div class="result-title">✅ Correcte!</div><button class="btn-check-sm" style="margin:16px auto 0;display:block" onclick="initProducte()">Exercici nou</button></div>`;
        setTimeout(
            () => document.getElementById('resPR').scrollIntoView({ behavior: 'smooth', block: 'center' }),
            T_SCROLL_DELAY
        );
    }
}

// ════════════════════════════════════════════════════════════════════
// DIVISIÓ
// ════════════════════════════════════════════════════════════════════
let dvPhase = 1;
let dvExp = { numRe: 0, numIm: 0, den: 0 }; // pas 1 expected
let dvLocked1 = { re: false, im: false, den: false };
let dvStep2Groups = [];

function generateDV() {
    FixedSessions?.next('DV'); // sessions fixes: mateix exercici per a tothom
    // Per la divisió, z2 ha de tenir part imaginària ≠ 0
    // (perquè la multiplicació pel conjugat tingui sentit pedagògic)
    do {
        [z1, z2] = generateTwoComplex();
    } while (z2.im === 0);

    const a = z1.re,
        b = z1.im,
        c = z2.re,
        d = z2.im;
    dvExp.numRe = a * c + b * d;
    dvExp.numIm = b * c - a * d;
    dvExp.den = c * c + d * d;
}

function initDivisio() {
    hideCustomKeyboard();
    generateDV();
    dvPhase = 1;
    errorCount = 0;
    finished = false;
    hintShown = false;
    dvLocked1 = { re: false, im: false, den: false };
    dvStep2Groups = [];
    document.getElementById('errCntDV').textContent = '0';
    const h = document.getElementById('hintDV');
    h.classList.remove('visible');
    h.innerHTML = '';
    document.getElementById('fbDV').innerText = '';
    document.getElementById('fbDV').classList.remove('fade-out');
    document.getElementById('resDV').innerHTML = '';
    document.getElementById('dvSteps').innerHTML = '';

    // Enunciat: fracció
    const z1h = fmtComplex(z1.re, z1.im),
        z2h = fmtComplex(z2.re, z2.im);
    const conjH = fmtComplex(z2.re, -z2.im);
    const enun = document.getElementById('dvEnunciat');
    enun.innerHTML = htmlFrac(z1h, z2h, 'frac-big') + `<span>&ensp;= ?</span>`;

    // Després de 750ms, mostrar la multiplicació pel conjugat
    setTimeout(() => {
        enun.innerHTML =
            htmlFrac(z1h, z2h, 'frac-big') +
            `<span class="dv-conjugat">&ensp;=&ensp;` +
            htmlFrac(z1h, z2h, 'frac-big') +
            `&ensp;·&ensp;` +
            htmlFrac(conjH, conjH, 'frac-big frac-grey') +
            `&ensp;=</span>`;
        // Esperar 300ms i mostrar pas 1
        setTimeout(() => showDVstep1(), 300);
    }, 750);
}

function showDVstep1() {
    const steps = document.getElementById('dvSteps');
    steps.innerHTML = `
        <div class="dv-step" id="dvStep1">
            <div class="dv-step-title">Pas 1: multiplica numeradors i denominadors</div>
            <div class="dv-step-row">
                ${htmlFrac(
                    `<input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-numre"> <span style="font-size:1rem;font-weight:700">+</span> <input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-numim"> <span style="font-size:.9rem;font-weight:700;font-style:italic">·&thinsp;i</span>`,
                    `<input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-den">`,
                    'frac-input'
                )}
            </div>
        </div>`;
    ['dv-numre', 'dv-numim', 'dv-den'].forEach(id => setupInput(document.getElementById(id)));
    const first = document.getElementById('dv-numre');
    if (isTouchDevice()) showCustomKeyboard(first);
    else setTimeout(() => first.focus(), T_FOCUS_DELAY);
    setTimeout(() => steps.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function enterDV() {
    if (dvPhase === 1) enterDV1();
    else enterDV2();
}

function enterDV1() {
    // Salta a casella buida si n'hi ha
    const inputs = [...document.querySelectorAll('#dvStep1 .step-input:not(:disabled)')];
    if (!inputs.length) {
        checkDV1();
        return;
    }
    const cur = activeKbInput || document.activeElement;
    const hasVal = v => v.trim() !== '' && v.trim() !== '-';
    if (cur && hasVal(cur.value)) {
        const empty = inputs.find(i => i !== cur && !hasVal(i.value));
        if (empty) {
            focusInput(empty);
            if (isTouchDevice()) activeKbInput = empty;
            return;
        }
    }
    checkDV1();
}

function checkDV1() {
    const fb = document.getElementById('fbDV');
    fb.classList.remove('fade-out');
    const inpNR = document.getElementById('dv-numre'),
        inpNI = document.getElementById('dv-numim'),
        inpD = document.getElementById('dv-den');
    const ids = [
        { inp: inpNR, exp: dvExp.numRe, key: 're' },
        { inp: inpNI, exp: dvExp.numIm, key: 'im' },
        { inp: inpD, exp: dvExp.den, key: 'den' },
    ];

    // Comprovar buits
    const anyEmpty = ids.some(o => !dvLocked1[o.key] && (o.inp.value.trim() === '' || o.inp.value.trim() === '-'));
    if (anyEmpty) {
        fb.style.color = 'var(--warning)';
        fb.innerText = '⚠️ Cal omplir tots els camps.';
        const first = ids.find(o => !dvLocked1[o.key] && (o.inp.value.trim() === '' || o.inp.value.trim() === '-'));
        if (first) focusInput(first.inp);
        return;
    }

    // Parse i comprovar
    const vals = {};
    for (const o of ids) {
        if (dvLocked1[o.key]) {
            vals[o.key] = o.exp;
            continue;
        }
        vals[o.key] = parseStrictInt(o.inp.value);
        if (isNaN(vals[o.key])) {
            fb.style.color = 'var(--warning)';
            fb.innerText = '⚠️ Escriu un número.';
            focusInput(o.inp);
            return;
        }
    }

    const results = {};
    ids.forEach(o => (results[o.key] = vals[o.key] === o.exp));
    const allOk = Object.values(results).every(v => v);

    if (allOk) {
        fb.innerText = '';
        hideCustomKeyboard();
        hideHint('DV'); /* [ROUND 2] */
        ids.forEach(o => {
            o.inp.disabled = true;
            o.inp.classList.add('confirmed', 'anim-flash');
            o.inp.classList.remove('locked-ok');
        });
        dvPhase = 2;
        setTimeout(() => showDVstep2(), 400);
        return;
    }

    // Errors
    errorCount++;
    document.getElementById('errCntDV').textContent = errorCount;
    showHint('DV');
    fb.style.color = 'var(--danger)';
    fb.innerText = '❌ No és correcte. Torna-ho a intentar.';

    let firstWrong = null;
    for (const o of ids) {
        if (results[o.key] && !dvLocked1[o.key]) {
            dvLocked1[o.key] = true;
            o.inp.disabled = true;
            o.inp.classList.add('locked-ok');
        }
        if (!results[o.key] && !dvLocked1[o.key]) {
            triggerShake(o.inp);
            if (!firstWrong) {
                firstWrong = o.inp;
                selectInputContent(o.inp);
            }
        }
    }
    if (firstWrong) focusInput(firstWrong);
}

function showDVstep2() {
    const k = dvExp.den,
        p = dvExp.numRe,
        q = dvExp.numIm;
    const reExact = p % k === 0,
        imExact = q % k === 0;

    // Canviar títol
    document.querySelector('#dvStep1 .dv-step-title').textContent =
        'Pas 2: escriu la part real i la part imaginària del resultat final';

    // Reescriure la fracció del pas 1 de forma compacta (sense inputs)
    const compactFrac = htmlFrac(fmtComplex(p, q), k, 'frac-big');

    // Construir inputs del resultat per grups (real, imag)
    let realPart, imagPart;
    dvStep2Groups = [];

    if (reExact) {
        realPart = `<input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-rr">`;
        dvStep2Groups.push({ type: 'int', ids: ['dv-rr'], exp: p / k, locked: false });
    } else {
        realPart = htmlFrac(
            `<input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-rn">`,
            `<input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-rd">`,
            'frac-input'
        );
        dvStep2Groups.push({ type: 'frac', ids: ['dv-rn', 'dv-rd'], expNum: p, expDen: k, locked: false });
    }

    if (imExact) {
        imagPart = `<input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-ir" data-sign-id="sign-dv">`;
        dvStep2Groups.push({ type: 'int', ids: ['dv-ir'], exp: q / k, locked: false, isIm: true }); /* [ROUND 1] */
    } else {
        imagPart = htmlFrac(
            `<input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-in" data-sign-id="sign-dv">`,
            `<input type="text" inputmode="numeric" autocomplete="off" class="step-input step-input-sm" id="dv-id">`,
            'frac-input'
        );
        dvStep2Groups.push({
            type: 'frac',
            ids: ['dv-in', 'dv-id'],
            expNum: q,
            expDen: k,
            locked: false,
            isIm: true,
        }); /* [ROUND 1] */
    }

    // Substituir contingut del step1: fracció compacta = inputs resultat
    const step1 = document.getElementById('dvStep1');
    step1.querySelector('.dv-step-row').innerHTML = `
        ${compactFrac}
        <span class="answer-symbol" style="font-size:1.1rem">=</span>
        ${realPart}
        <span class="answer-symbol" id="sign-dv" style="font-size:1.1rem">+</span>
        ${imagPart}
        <span class="answer-symbol-i" style="font-size:1rem">·&thinsp;i</span>`;

    dvStep2Groups.forEach(g => g.ids.forEach(id => setupInput(document.getElementById(id))));
    /* [ROUND 1] Setup sign handler per al camp im */
    const imGrp = dvStep2Groups.find(g => g.isIm);
    if (imGrp) setupImSignHandlers(document.getElementById(imGrp.ids[0]));
    const first = document.getElementById(dvStep2Groups[0].ids[0]);
    if (isTouchDevice()) showCustomKeyboard(first);
    else setTimeout(() => first.focus(), T_FOCUS_DELAY);
    setTimeout(() => step1.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function enterDV2() {
    const inputs = [...document.querySelectorAll('#dvStep1 .step-input:not(:disabled)')];
    if (!inputs.length) {
        checkDV2();
        return;
    }
    const cur = activeKbInput || document.activeElement;
    const hasVal = v => v.trim() !== '' && v.trim() !== '-';
    if (cur && hasVal(cur.value)) {
        const empty = inputs.find(i => i !== cur && !hasVal(i.value));
        if (empty) {
            focusInput(empty);
            if (isTouchDevice()) activeKbInput = empty;
            return;
        }
    }
    checkDV2();
}

function checkDV2() {
    const fb = document.getElementById('fbDV');
    fb.classList.remove('fade-out');

    // Comprovar buits
    for (const g of dvStep2Groups) {
        if (g.locked) continue;
        for (const id of g.ids) {
            const v = document.getElementById(id).value.trim();
            if (v === '' || v === '-') {
                fb.style.color = 'var(--warning)';
                fb.innerText = '⚠️ Cal omplir tots els camps.';
                focusInput(document.getElementById(id));
                return;
            }
        }
    }

    // Parse tots els valors
    for (const g of dvStep2Groups) {
        if (g.locked) continue;
        for (const id of g.ids) {
            const v = parseStrictInt(document.getElementById(id).value);
            if (isNaN(v)) {
                fb.style.color = 'var(--warning)';
                fb.innerText = '⚠️ Escriu un número.';
                focusInput(document.getElementById(id));
                return;
            }
        }
    }

    // Validar cada grup
    const groupResults = dvStep2Groups.map(g => {
        if (g.locked) return { g, ok: true };
        if (g.type === 'int') {
            const inp = document.getElementById(g.ids[0]);
            const v = g.isIm ? readSignedImValue(inp) : parseStrictInt(inp.value); /* [ROUND 1] */
            return { g, ok: v === g.exp };
        } else {
            // Fracció: validar per equivalència (producte creuat)
            const numInp = document.getElementById(g.ids[0]);
            const num = g.isIm ? readSignedImValue(numInp) : parseStrictInt(numInp.value); /* [ROUND 1] */
            const den = parseStrictInt(document.getElementById(g.ids[1]).value);
            if (den === 0) return { g, ok: false };
            // num/den === expNum/expDen  <=>  num*expDen === expNum*den
            return { g, ok: num * g.expDen === g.expNum * den };
        }
    });

    const allOk = groupResults.every(r => r.ok);

    if (allOk) {
        fb.innerText = '';
        hideCustomKeyboard();
        hideHint('DV');
        finished = true; /* [ROUND 2] */
        const z1h = fmtComplex(z1.re, z1.im),
            z2h = fmtComplex(z2.re, z2.im);
        document.getElementById('dvEnunciat').innerHTML = htmlFrac(z1h, z2h, 'frac-big') + `<span>&ensp;=</span>`;
        // Resultat elegant
        const k = dvExp.den,
            p = dvExp.numRe,
            q = dvExp.numIm;
        let finalHTML;
        const reE = p % k === 0,
            imE = q % k === 0;
        if (reE && imE) {
            // Ambdós enters → fmtComplex ja gestiona ±1, signe, etc.
            finalHTML = '= ' + fmtComplex(p / k, q / k);
        } else {
            // Almenys un és fracció
            // Part real
            let rp;
            if (reE) {
                rp = fmtNum(p / k);
            } else {
                const un = parseStrictInt(document.getElementById('dv-rn').value),
                    ud = parseStrictInt(document.getElementById('dv-rd').value);
                rp = htmlFrac(fmtNum(un), fmtNum(ud));
            }
            // Signe de la part imaginària (k sempre >0, signe ve de q)
            const imSign = q > 0 ? ' + ' : ' − ';
            // Part imaginària (valor absolut)
            let ip;
            if (imE) {
                const absQK = Math.abs(q / k);
                ip = absQK === 1 ? '' : fmtNum(absQK);
            } else {
                const un = parseStrictInt(document.getElementById('dv-in').value),
                    ud = parseStrictInt(document.getElementById('dv-id').value);
                // Mostrar la fracció en positiu (el signe ja el posa imSign)
                const absUn = Math.abs(un),
                    absUd = Math.abs(ud);
                // Si |un/ud|==1, no cal escriure la fracció
                if (absUn === absUd) {
                    ip = '';
                } else {
                    ip = htmlFrac(fmtNum(absUn), fmtNum(absUd));
                }
            }
            finalHTML = '= ' + rp + imSign + ip + '<em>i</em>';
        }
        document.getElementById('dvSteps').innerHTML =
            `<div class="answer-final" style="margin-top:14px">${finalHTML}</div>`;
        document.getElementById('resDV').innerHTML =
            `<div class="result-box anim-fade-in-up"><div class="result-title">✅ Correcte!</div><button class="btn-check-sm" style="margin:16px auto 0;display:block" onclick="initDivisio()">Exercici nou</button></div>`;
        setTimeout(
            () => document.getElementById('resDV').scrollIntoView({ behavior: 'smooth', block: 'center' }),
            T_SCROLL_DELAY
        );
        return;
    }

    // Errors
    errorCount++;
    document.getElementById('errCntDV').textContent = errorCount;
    showHint('DV');
    fb.style.color = 'var(--danger)';
    fb.innerText = '❌ No és correcte. Torna-ho a intentar.';

    let firstWrong = null;
    for (const r of groupResults) {
        const inps = r.g.ids.map(id => document.getElementById(id));
        if (r.ok && !r.g.locked) {
            r.g.locked = true;
            inps.forEach(inp => {
                inp.disabled = true;
                inp.classList.add('locked-ok');
            });
        }
        if (!r.ok && !r.g.locked) {
            inps.forEach(inp => triggerShake(inp));
            if (!firstWrong) {
                firstWrong = inps[0];
                inps.forEach(inp => selectInputContent(inp));
            }
        }
    }
    if (firstWrong) focusInput(firstWrong);
}
// ════════════════════════════════════════════════════════════════════
// TECLAT CUSTOM
// ════════════════════════════════════════════════════════════════════
let activeKbInput = null,
    kbClearOnNext = false;
function showCustomKeyboard(inp) {
    activeKbInput = inp;
    const kb = document.getElementById('customKeyboard');
    kb.classList.add('kb-visible');
    inp.focus();
    setTimeout(() => kb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}
function hideCustomKeyboard() {
    document.getElementById('customKeyboard').classList.remove('kb-visible');
    activeKbInput = null;
}
function initCustomKeyboard() {
    document.querySelectorAll('#customKeyboard .kb-btn').forEach(btn => {
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (!activeKbInput) return;
            const key = btn.dataset.key;
            if (key === 'del') {
                if (kbClearOnNext) {
                    activeKbInput.value = '';
                    kbClearOnNext = false;
                    activeKbInput.classList.remove('kb-selected');
                } else {
                    activeKbInput.value = activeKbInput.value.slice(0, -1);
                }
            } else if (key === 'enter') {
                onEnterPressed();
            } else if (key === '-') {
                /* [ROUND 1] Im fields: commuta el span de signe en lloc d'escriure '-' */
                if (activeKbInput.dataset.signId) {
                    const span = document.getElementById(activeKbInput.dataset.signId);
                    if (span) span.textContent = span.textContent.trim() === '−' ? '+' : '−';
                } else {
                    if (kbClearOnNext) {
                        activeKbInput.value = '-';
                        kbClearOnNext = false;
                        activeKbInput.classList.remove('kb-selected');
                    } else {
                        if (activeKbInput.value === '' || activeKbInput.value === '-')
                            activeKbInput.value = activeKbInput.value === '-' ? '' : '-';
                    }
                }
            } else {
                if (kbClearOnNext) {
                    activeKbInput.value = '';
                    kbClearOnNext = false;
                    activeKbInput.classList.remove('kb-selected');
                    /* [ROUND 1] Reset signe a '+' quan s'esborral contingut per sobreescriure */
                    if (activeKbInput.dataset.signId) {
                        const s = document.getElementById(activeKbInput.dataset.signId);
                        if (s) s.textContent = '+';
                    }
                }
                if (activeKbInput.value === '-0') activeKbInput.value = '-';
                activeKbInput.value += key;
            }
        });
    });
}

window.onload = () => {
    initCustomKeyboard();
    initSumaResta();
};
