/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/seguent.js
 * ROL: El final de cada pregunta, igual a totes les activitats: una franja a
 *      sota de l'exercici («Molt bé! +8 punts» o «Intents esgotats · 0 punts»)
 *      amb el botó «Següent» («Veure resultats» a l'última pregunta).
 * ARQUITECTURA:
 * - No tapa l'exercici: la resolució o la solució es queden a la vista fins que
 *   l'alumne prem el botó. Mai no es passa de pregunta sol.
 * - El botó agafa el focus i la tecla Enter el prem (també si l'activitat té un
 *   listener d'Enter propi: aquest s'atura mentre la franja és a la vista).
 * - Les activitats del motor comú hi arriben a través d'acabaPregunta() de
 *   game-core.js; les que no el fan servir (Vocabulari, les de gràfiques de
 *   Batxillerat) criden directament mostraSeguent().
 * - Estil: css/seguent.css.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

let _franja = null;
let _tecla = null;

/** Text dels punts: «+8 punts», «+1 punt», «0 punts». */
export function textPunts(punts) {
    if (punts > 0) return `+${punts} ${punts === 1 ? 'punt' : 'punts'}`;
    return '0 punts';
}

/** Treu la franja, si n'hi ha cap a la vista. */
export function amagaSeguent() {
    if (_tecla) document.removeEventListener('keydown', _tecla, true);
    _tecla = null;
    if (_franja) _franja.remove();
    _franja = null;
}

/**
 * Mostra la franja del final de pregunta.
 * @param {object}   o
 * @param {?number}  o.punts      punts de la pregunta (0-10), o null en les activitats sense punts
 * @param {boolean}  [o.encert]   cert si l'ha resolta (per defecte, punts > 0, o cert sense punts)
 * @param {boolean}  [o.ultima]   cert a l'última pregunta: el botó diu «Veure resultats»
 * @param {Element}  [o.lloc]     on va la franja (al final); per defecte, #game-screen
 * @param {string}   [o.titol]    text principal, si no és el de sempre
 * @param {Function} o.onSeguent  què fer quan l'alumne prem el botó
 */
export function mostraSeguent({
    punts = 0,
    encert = punts === null || punts > 0,
    ultima = false,
    lloc,
    titol,
    onSeguent,
}) {
    amagaSeguent();
    const desti = lloc || document.getElementById('game-screen') || document.querySelector('.panel') || document.body;

    const franja = document.createElement('div');
    franja.className = 'franja-final ' + (encert ? 'franja-ok' : 'franja-ko');
    franja.setAttribute('role', 'status');

    const text = document.createElement('div');
    text.className = 'franja-text';
    const t = document.createElement('span');
    t.className = 'franja-titol';
    t.textContent =
        titol || (encert ? (punts === null || punts > 0 ? 'Molt bé!' : 'Exercici acabat') : 'Intents esgotats');
    text.append(t);
    if (punts !== null) {
        const p = document.createElement('span');
        p.className = 'franja-punts';
        p.textContent = textPunts(punts);
        text.append(p);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-next';
    btn.id = 'btn-next';
    btn.textContent = ultima ? 'Veure resultats' : 'Següent';
    btn.addEventListener(
        'click',
        () => {
            amagaSeguent();
            if (typeof onSeguent === 'function') onSeguent();
        },
        { once: true }
    );

    franja.append(text, btn);
    desti.appendChild(franja);
    _franja = franja;

    // Enter prem el botó, encara que el focus sigui en una altra banda o que l'activitat
    // tingui un listener d'Enter propi (fase de captura: arriba abans que el seu)
    _tecla = e => {
        if (e.key !== 'Enter' || e.repeat) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        btn.click();
    };
    document.addEventListener('keydown', _tecla, true);

    btn.focus({ preventScroll: true });
    franja.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return franja;
}
