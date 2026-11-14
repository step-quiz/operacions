/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/codi-finestra.js
 * ROL: La icona «Codi» de dalt de tot de la pàgina i la finestra que mostra el
 *      codi de verificació per copiar-lo i enganxar-lo al formulari del professor.
 * ARQUITECTURA:
 * - posaIconaCodi(estat) posa la icona (fixa a dalt a la dreta, sempre a la
 *   vista). `estat()` diu en cada moment si ja hi ha codi: { codi } quan
 *   l'activitat s'ha acabat, o { falten, unitat } / { missatge } abans.
 * - Abans d'acabar, la finestra diu quantes preguntes falten i no dona cap
 *   codi: un codi a mitges es podria enviar per error com a definitiu.
 * - El codi es genera UN SOL COP, en acabar (generaCodi, des de l'activitat), i
 *   la finestra mostra sempre el mateix: obrir-la deu vegades no en fa de nous.
 * - El botó «Copiar codi» de la pantalla final obre aquesta mateixa finestra.
 * - Les activitats que no donen codi (sessions fixes, esvaïment, les de
 *   Batxillerat sense nota) no criden posaIconaCodi().
 * - Estil: css/codi.css.
 * DEPENDÈNCIES: js/codi-verificacio.js (construeixCodiV2).
 * ============================================================================
 */
import { construeixCodiV2 } from './codi-verificacio.js';

let _estat = () => ({ codi: null });
let _icona = null;
let _finestra = null;
let _tecla = null;

/**
 * Munta un codi v2 nou, amb la sal i l'hora d'ara. L'activitat el crida un sol cop, en acabar.
 * @param {object} o
 * @param {string} o.exCode      codi d'exercici (2 lletres, js/exercise-codes.js)
 * @param {number} [o.dif]       dificultat 0-3 (0 = sense nivells)
 * @param {number} o.sessions    sessions fetes (1-5)
 * @param {number} o.questions   preguntes per sessió
 * @param {number} o.nota10      nota sobre 10
 * @param {number[]} o.resultats resultat de cada pregunta: 1, 2, 3 (intent de l'encert) o 4 (fallada)
 */
export function generaCodi({ exCode, dif = 0, sessions, questions, nota10, resultats }) {
    const lletres = 'abcdefghijklmnopqrstuvwxyz';
    let salt = '';
    for (let i = 0; i < 3; i++) salt += lletres.charAt(Math.floor(Math.random() * lletres.length));
    const fita = (n, a, b) => Math.min(b, Math.max(a, Math.round(Number(n) || 0)));
    return construeixCodiV2({
        salt,
        ara: new Date(),
        exCode,
        dif: String(fita(dif, 0, 3)),
        sessions: String(fita(sessions, 1, 5)),
        questions: String(fita(questions, 1, 99)).padStart(2, '0'),
        notaInt: fita(nota10 * 10, 0, 100),
        results: resultats.slice(0, 50).map(String).join('').padEnd(30, '0'),
    });
}

/**
 * Posa la icona «Codi» a la barra de dalt.
 * @param {Function} estat  () => { codi } | { falten, unitat: [singular, plural] } | { missatge }
 */
export function posaIconaCodi(estat) {
    if (typeof estat === 'function') _estat = estat;
    if (_icona) return _icona;
    _icona = document.createElement('button');
    _icona.type = 'button';
    _icona.className = 'codi-icona';
    _icona.id = 'codi-icona';
    _icona.setAttribute('aria-haspopup', 'dialog');
    _icona.setAttribute('aria-label', 'Codi per al professor');
    _icona.title = 'Codi per al professor';
    _icona.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="4" rx="1"/>' +
        '<path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></svg>' +
        '<span>Codi</span>';
    _icona.addEventListener('click', obreFinestraCodi);
    (document.querySelector('.title-row') || document.body).appendChild(_icona);
    return _icona;
}

/** Marca la icona quan el codi ja és a punt (en acabar l'activitat); `false` ho desfà (tornar a jugar). */
export function avisaCodiLlest(llest = true) {
    if (!_icona) return;
    _icona.classList.toggle('codi-llest', llest);
    _icona.setAttribute('aria-label', llest ? 'Codi per al professor: ja és a punt' : 'Codi per al professor');
}

/** Tanca la finestra, si és oberta. */
export function tancaFinestraCodi() {
    if (_tecla) document.removeEventListener('keydown', _tecla, true);
    _tecla = null;
    if (_finestra) _finestra.remove();
    _finestra = null;
    if (_icona) _icona.focus({ preventScroll: true });
}

/** Obre la finestra del codi: el codi gran i «Copiar», o quantes preguntes falten. */
export function obreFinestraCodi() {
    tancaFinestraCodi();
    const e = _estat() || {};
    const fons = document.createElement('div');
    fons.className = 'codi-fons';
    fons.addEventListener('click', ev => {
        if (ev.target === fons) tancaFinestraCodi();
    });

    const caixa = document.createElement('div');
    caixa.className = 'codi-finestra';
    caixa.setAttribute('role', 'dialog');
    caixa.setAttribute('aria-modal', 'true');
    caixa.setAttribute('aria-labelledby', 'codi-titol');

    const titol = document.createElement('h2');
    titol.id = 'codi-titol';
    titol.textContent = 'Codi per al professor';
    caixa.appendChild(titol);

    let focus = null;
    if (e.codi) {
        const p = document.createElement('p');
        p.className = 'codi-ajuda';
        p.textContent = "Copia aquest codi i enganxa'l al formulari del professor.";
        const codi = document.createElement('div');
        codi.className = 'codi-text';
        codi.id = 'codi-text';
        codi.textContent = e.codi;
        const avis = document.createElement('p');
        avis.className = 'codi-avis';
        avis.setAttribute('aria-live', 'polite');
        const copiar = document.createElement('button');
        copiar.type = 'button';
        copiar.className = 'codi-copiar';
        copiar.textContent = 'Copiar';
        copiar.addEventListener('click', () => copia(e.codi, codi, avis, copiar));
        caixa.append(p, codi, copiar, avis);
        focus = copiar;
    } else {
        const p = document.createElement('p');
        p.className = 'codi-espera';
        if (e.missatge) {
            p.textContent = e.missatge;
        } else {
            const n = Math.max(0, e.falten || 0);
            const [sg, pl] = e.unitat || ['pregunta', 'preguntes'];
            p.textContent =
                n === 1 ? `Encara no has acabat: et falta 1 ${sg}.` : `Encara no has acabat: et falten ${n} ${pl}.`;
        }
        caixa.append(p);
        if (!e.missatge) {
            const p2 = document.createElement('p');
            p2.className = 'codi-ajuda';
            p2.textContent = 'Quan acabis, el codi sortirà aquí.';
            caixa.append(p2);
        }
    }

    const tancar = document.createElement('button');
    tancar.type = 'button';
    tancar.className = 'codi-tancar';
    tancar.textContent = 'Tancar';
    tancar.addEventListener('click', tancaFinestraCodi);
    caixa.appendChild(tancar);

    fons.appendChild(caixa);
    document.body.appendChild(fons);
    _finestra = fons;

    // Escapa tanca; Enter i les tecles del joc no arriben a l'activitat mentre és oberta
    _tecla = ev => {
        if (ev.key === 'Escape') {
            ev.preventDefault();
            tancaFinestraCodi();
        } else if (ev.key === 'Tab') {
            const f = [...caixa.querySelectorAll('button')];
            const i = f.indexOf(document.activeElement);
            if (ev.shiftKey && i <= 0) {
                ev.preventDefault();
                f[f.length - 1].focus();
            } else if (!ev.shiftKey && i === f.length - 1) {
                ev.preventDefault();
                f[0].focus();
            }
            return;
        }
        if (!caixa.contains(ev.target) || ev.key !== 'Enter') ev.stopImmediatePropagation();
    };
    document.addEventListener('keydown', _tecla, true);
    (focus || tancar).focus({ preventScroll: true });
}

// Copia el codi; si el navegador no deixa, el selecciona perquè l'alumne el copiï a mà
async function copia(text, el, avis, boto) {
    try {
        await navigator.clipboard.writeText(text);
        avis.textContent = 'Copiat. Ara enganxa’l al formulari del professor.';
        boto.textContent = 'Copiat ✓';
    } catch {
        const r = document.createRange();
        r.selectNodeContents(el);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        avis.textContent = 'No s’ha pogut copiar sol: el codi és seleccionat, copia’l amb Ctrl+C (o mantén-lo premut).';
    }
}
