/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/teclat.js
 * ROL: El teclat numèric propi per als aparells tàctils (tauletes i mòbils sense
 *      ratolí), el mateix a totes les activitats que en tenen.
 * ARQUITECTURA:
 * - injectaTeclat(lloc) posa el teclat (#customKeyboard) on toqui, si la pàgina
 *   encara no en té; initCustomKeyboard(opcions) el fa funcionar. game-core.js
 *   ho fa sol (injectSharedHTML) i en reexporta les funcions; les pàgines sense
 *   el motor comú (Complexos, Ruffini, Esglaonar, Inversa, Rectes i plans)
 *   l'importen d'aquí.
 * - Qualsevol casella de text o de número que l'alumne toqui passa a rebre el
 *   teclat (un sol listener per a tota la pàgina). Una casella que no ha de
 *   fer servir el teclat numèric es marca amb data-kb="off".
 * - Una casella amb data-locked="true" (resposta ja encertada) no s'activa.
 * - Una casella amb data-sign-id="id" té el signe en un element a part (la part
 *   imaginària de Complexos): la tecla «−» canvia aquell signe entre + i −.
 * - Estil: css/teclat.css.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const TECLES =
    '<div class="kb-grid"><button class="kb-btn" data-key="7">7</button><button class="kb-btn" data-key="8">8</button>' +
    '<button class="kb-btn" data-key="9">9</button><button class="kb-btn kb-del" data-key="del">⌫</button>' +
    '<button class="kb-btn" data-key="4">4</button><button class="kb-btn" data-key="5">5</button>' +
    '<button class="kb-btn" data-key="6">6</button><button class="kb-btn kb-minus" data-key="-">−</button>' +
    '<button class="kb-btn" data-key="1">1</button><button class="kb-btn" data-key="2">2</button>' +
    '<button class="kb-btn" data-key="3">3</button><button class="kb-btn kb-enter" data-key="enter">→</button>' +
    '<button class="kb-btn kb-zero" data-key="0">0</button></div>';

/** Cert en un aparell tàctil sense ratolí (tauleta, mòbil): és on surt el teclat propi. */
export function isTouchDevice() {
    return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}

/** Posa el teclat al final de `lloc` (si la pàgina encara no en té cap) i el torna. */
export function injectaTeclat(lloc) {
    let kb = document.getElementById('customKeyboard');
    if (kb) return kb;
    kb = document.createElement('div');
    kb.id = 'customKeyboard';
    kb.innerHTML = TECLES;
    (lloc || document.querySelector('.panel') || document.body).appendChild(kb);
    return kb;
}

let _kbActiveInput = null;
let _kbClearOnNext = false;
let _kbTeclaSigne = null; // la tecla − (amb allowNegative), que a les caselles data-coma fa de coma
let _kbTocDelegat = false;
let _onEnter = null;

/** Casella que pot fer servir el teclat numèric: un <input> de text o de número sense data-kb="off". */
function esCasellaTeclat(el) {
    if (!(el instanceof HTMLInputElement)) return false;
    if (el.type !== 'text' && el.type !== 'number') return false;
    return el.dataset.kb !== 'off';
}

// La tecla «→»: l'acció de la pàgina (onEnter), o checkCurrentCell() del joc, o un Enter de debò
// a la casella activa (perquè la pàgina faci el que fa quan es prem Enter al teclat físic)
function premEnter() {
    if (_onEnter) return _onEnter(_kbActiveInput);
    if (typeof window.checkCurrentCell === 'function') return window.checkCurrentCell();
    const inp = _kbActiveInput;
    if (inp) inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
}

/** Passa el teclat a la casella següent de la pàgina (en l'ordre del document), si n'hi ha. */
export function vesACasellaSeguent() {
    const totes = [...document.querySelectorAll('input')].filter(
        i => esCasellaTeclat(i) && !i.disabled && i.dataset.locked !== 'true' && i.offsetParent !== null
    );
    const i = totes.indexOf(_kbActiveInput);
    if (i >= 0 && i + 1 < totes.length) showCustomKeyboard(totes[i + 1]);
}

/**
 * Fa funcionar el teclat (cal haver-lo posat abans amb injectaTeclat).
 * Opcions:
 *   allowNegative     mostra la tecla − (per defecte, no)
 *   allowZero         mostra la tecla 0 (per defecte, sí)
 *   decimalComma      la tecla − passa a ser la coma decimal «,» (respostes decimals sense negatius)
 *   Amb allowNegative, una casella amb data-coma="true" (un decimal, p. ex. la mantissa d'una
 *   notació científica) canvia la tecla − per la coma mentre s'hi escriu; a les altres, torna a ser −.
 *   respectMaxLength  no escriu més caràcters que el maxlength de la casella
 *   onEnter(inp)      què fa la tecla «→» (per defecte, checkCurrentCell() o un Enter a la casella)
 */
export function initCustomKeyboard(options = {}) {
    const allowNeg = options.allowNegative ?? false;
    const allowZero = options.allowZero ?? true;
    const respectMaxLength = options.respectMaxLength ?? false;
    _onEnter = typeof options.onEnter === 'function' ? options.onEnter : null;
    const grid = document.querySelector('#customKeyboard .kb-grid');
    if (grid) {
        if (!allowNeg) grid.classList.add('kb-no-minus');
        else grid.classList.remove('kb-no-minus');
        if (!allowZero) grid.classList.add('kb-no-zero');
        else grid.classList.remove('kb-no-zero');
    }
    _kbTeclaSigne = allowNeg && !options.decimalComma ? document.querySelector('#customKeyboard .kb-minus') : null;
    if (options.decimalComma) {
        const minusBtn = document.querySelector('#customKeyboard .kb-minus');
        if (minusBtn) {
            minusBtn.dataset.key = ',';
            minusBtn.textContent = ',';
            minusBtn.classList.remove('kb-minus');
        }
    }
    // Buida la casella quan la tecla següent n'ha de substituir el contingut; si el signe és a part, torna a +
    const signeDe = inp => (inp && inp.dataset.signId ? document.getElementById(inp.dataset.signId) : null);
    const buida = () => {
        _kbActiveInput.value = '';
        _kbClearOnNext = false;
        _kbActiveInput.classList.remove('kb-selected');
        const s = signeDe(_kbActiveInput);
        if (s) s.textContent = '+';
    };
    document.querySelectorAll('#customKeyboard .kb-btn').forEach(btn => {
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (!_kbActiveInput) return;
            const key = btn.dataset.key;
            if (key === 'del') {
                if (_kbClearOnNext) buida();
                else _kbActiveInput.value = _kbActiveInput.value.slice(0, -1);
            } else if (key === 'enter') {
                premEnter();
            } else if (key === ',') {
                if (_kbClearOnNext) buida();
                const v = _kbActiveInput.value;
                if (v.includes(',')) return; // una sola coma decimal
                _kbActiveInput.value = v === '' || v === '-' ? v + '0,' : v + ',';
            } else if (key === '-') {
                const signe = signeDe(_kbActiveInput);
                if (signe) {
                    // El signe és a part (data-sign-id): la tecla − el canvia
                    signe.textContent = signe.textContent.trim() === '−' ? '+' : '−';
                } else if (_kbClearOnNext) {
                    buida();
                    _kbActiveInput.value = '-';
                } else {
                    const v = _kbActiveInput.value;
                    if (v === '') _kbActiveInput.value = '-';
                    else if (v === '-') _kbActiveInput.value = '';
                }
            } else {
                if (_kbClearOnNext) buida();
                if (_kbActiveInput.value === '-0') _kbActiveInput.value = '-';
                if (respectMaxLength) {
                    const maxLen = _kbActiveInput.maxLength;
                    if (maxLen > 0 && _kbActiveInput.value.length >= maxLen) return;
                }
                _kbActiveInput.value += key;
            }
        });
    });
    window.addEventListener('orientationchange', () => {
        const kb = document.getElementById('customKeyboard');
        if (!_kbActiveInput || !kb || !kb.classList.contains('kb-visible')) return;
        setTimeout(() => kb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    });
    // En tàctils, qualsevol casella numèrica que l'alumne toqui passa a rebre el teclat propi,
    // encara que la pàgina no l'hagi activada mai amb showCustomKeyboard(). Un sol listener per a
    // tota la pàgina, en fase de captura, perquè també valgui per a les caselles que es creen després.
    if (!_kbTocDelegat) {
        _kbTocDelegat = true;
        document.addEventListener(
            'pointerdown',
            e => {
                if (!isTouchDevice()) return;
                const inp = e.target instanceof Element ? e.target.closest('input') : null;
                if (!inp || !esCasellaTeclat(inp)) return;
                if (inp.dataset.locked === 'true' || inp.disabled) return;
                e.preventDefault();
                showCustomKeyboard(inp);
            },
            true
        );
    }
    // En tàctils, cap casella numèrica no obre el teclat del sistema
    if (isTouchDevice()) {
        document.querySelectorAll('input').forEach(inp => {
            if (esCasellaTeclat(inp)) inp.setAttribute('inputmode', 'none');
        });
    }
}

/** Fa que el teclat escrigui a `inp` i el mostra. Un input amb data-locked="true" no s'activa mai. */
export function showCustomKeyboard(inp) {
    if (!inp || inp.dataset.locked === 'true') return;
    if (_kbActiveInput) _kbActiveInput.classList.remove('kb-active-input');
    _kbActiveInput = inp;
    _kbClearOnNext = false;
    inp.setAttribute('inputmode', 'none');
    inp.setAttribute('readonly', 'readonly');
    inp.classList.add('kb-active-input');
    // La tecla − és la coma a les caselles de decimals (data-coma="true"), si el teclat té la tecla −
    if (_kbTeclaSigne) {
        const coma = inp.dataset.coma === 'true';
        _kbTeclaSigne.dataset.key = coma ? ',' : '-';
        _kbTeclaSigne.textContent = coma ? ',' : '−';
    }
    const kb = document.getElementById('customKeyboard');
    if (kb) {
        kb.classList.add('kb-visible');
        setTimeout(() => kb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
    inp.focus();
}

/** Amaga el teclat (la casella que el feia servir torna a ser editable, si no és bloquejada). */
export function hideCustomKeyboard() {
    const kb = document.getElementById('customKeyboard');
    if (kb) kb.classList.remove('kb-visible');
    if (_kbActiveInput) {
        _kbActiveInput.classList.remove('kb-active-input');
        if (_kbActiveInput.dataset.locked !== 'true') {
            _kbActiveInput.removeAttribute('readonly');
            // En tàctils es manté inputmode="none" (no s'ha d'obrir el teclat del sistema)
            if (!isTouchDevice()) _kbActiveInput.removeAttribute('inputmode');
        }
    }
    _kbActiveInput = null;
    _kbClearOnNext = false;
}

/** Input on escriu ara el teclat numèric (null si no n'hi ha cap). */
export function getKbActiveInput() {
    return _kbActiveInput;
}

/** Si `inp` és l'input actiu del teclat, el deixa de ser (sense amagar el teclat). */
export function kbReleaseInput(inp) {
    if (_kbActiveInput === inp) {
        inp.classList.remove('kb-active-input');
        _kbActiveInput = null;
    }
}

/** La tecla següent substitueix el contingut de la casella (com si fos tot seleccionat). */
export function kbMarkForOverwrite(inp) {
    _kbClearOnNext = true;
    inp.classList.add('kb-selected');
}
