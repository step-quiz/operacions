/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/complexos/polar.js
 * ROL: Les pestanyes «Forma polar» i «Potències i arrels» de complexos.html
 *      (el DOM): el menú d'apartats i de nivell, l'enunciat, el pla complex, els
 *      passos d'un en un (com la pestanya Divisió) i el comptador d'errors.
 *      Pràctica lliure, com les altres pestanyes: sense sessions ni punts.
 *      La matemàtica, la correcció i els errors són a polar-engine.js (pur).
 * ÚS: complexos.js crida iniciaPestanyaCx('polar' | 'potencies') en obrir la pestanya
 *     i enterCx() quan es prem Enter (o la tecla → del teclat tàctil).
 * DEPENDÈNCIES: KaTeX (global, vendor/), teclat.js, polar-engine.js, pla-complex.js,
 *      strings-polar.js.
 * ============================================================================
 */

import { getKbActiveInput, isTouchDevice, kbMarkForOverwrite, showCustomKeyboard } from '../teclat.js';
import { PESTANYES_CX, corregeixPasCx, generaExerciciCx } from './polar-engine.js';
import { svgPlaComplex } from './pla-complex.js';
import { TEXTOS_CX } from './strings-polar.js';

const T = TEXTOS_CX;
const estat = {
    polar: { apartat: 'bin-pol', nivell: 1, errors: 0 },
    potencies: { apartat: 'potencia', nivell: 1, errors: 0 },
};
let actual = null; // { pestanya, ex, index, pla, quadrant, marques, acabat }

// ── Ajudes de DOM ───────────────────────────────────────────────────────────
const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
};
const tex = (t, display = false) => {
    const s = el('span', 'cx-tex');
    katex.render(t, s, { throwOnError: false, displayMode: display });
    return s;
};
/** Text amb fórmules entre $…$. */
function ambFormules(text) {
    const s = el('span');
    String(text)
        .split('$')
        .forEach((tros, i) => s.appendChild(i % 2 ? tex(tros) : document.createTextNode(tros)));
    return s;
}
const panell = () => document.getElementById(`panel-${actual.pestanya}`);

// ── La pestanya ─────────────────────────────────────────────────────────────
export function iniciaPestanyaCx(pestanya) {
    const p = document.getElementById(`panel-${pestanya}`);
    const e = estat[pestanya];
    p.innerHTML = '';
    // Menú: apartats i nivell
    const menu = el('div', 'cx-menu');
    const apartats = el('div', 'cx-apartats');
    for (const a of [...PESTANYES_CX[pestanya], `barreja-${pestanya}`]) {
        const b = el('button', `cx-apartat${a === e.apartat ? ' actiu' : ''}`, T.apartats[a]);
        b.type = 'button';
        b.dataset.apartat = a;
        b.addEventListener('click', () => {
            e.apartat = a;
            iniciaPestanyaCx(pestanya);
        });
        apartats.appendChild(b);
    }
    const nivells = el('div', 'cx-nivells');
    for (const n of [1, 2]) {
        const b = el('button', `cx-nivell${n === e.nivell ? ' actiu' : ''}`, T.nivells[n]);
        b.type = 'button';
        b.dataset.nivell = String(n);
        b.addEventListener('click', () => {
            e.nivell = n;
            iniciaPestanyaCx(pestanya);
        });
        nivells.appendChild(b);
    }
    menu.append(apartats, nivells);
    p.appendChild(menu);
    // Errors i enunciat
    const fila = el('div', 'exercise-row');
    const errs = el('button', 'btn-errors');
    errs.append(`${T.ui.errors} `, el('span', 'cx-errors', String(e.errors)));
    fila.appendChild(errs);
    const enunciat = el('div', 'exercise-display cx-enunciat');
    fila.appendChild(enunciat);
    p.appendChild(fila);
    const cos = el('div', 'cx-cos');
    const pla = el('div', 'cx-pla-lloc');
    const passos = el('div', 'cx-passos');
    cos.append(pla, passos);
    p.appendChild(cos);
    p.appendChild(el('div', 'feedback cx-feedback'));
    p.appendChild(el('div', 'cx-final'));
    nouExercici(pestanya);
}

function nouExercici(pestanya) {
    const e = estat[pestanya];
    const ex = generaExerciciCx(e.apartat, e.nivell);
    actual = {
        pestanya,
        ex,
        index: 0,
        pla: { ...ex.pla, vectors: [...ex.pla.vectors] },
        quadrant: null,
        marques: [],
        acabat: false,
    };
    const p = panell();
    const enunciat = p.querySelector('.cx-enunciat');
    enunciat.innerHTML = '';
    enunciat.appendChild(tex(ex.enunciatTex));
    p.querySelector('.cx-passos').innerHTML = '';
    p.querySelector('.cx-final').innerHTML = '';
    p.querySelector('.cx-feedback').textContent = '';
    pintaPla();
    mostraPas();
}

// ── El pla ──────────────────────────────────────────────────────────────────
function pintaPla() {
    const pas = actual.ex.passos[actual.index];
    const opcions = { ...actual.pla };
    const quadrantActiu = !actual.acabat && pas && pas.camps[0].tipus === 'quadrant';
    opcions.quadrants = quadrantActiu;
    if (pas && pas.pla && !actual.acabat) Object.assign(opcions, pas.pla, { seleccionades: actual.marques });
    const lloc = panell().querySelector('.cx-pla-lloc');
    lloc.innerHTML = svgPlaComplex(opcions);
    if (quadrantActiu)
        lloc.querySelectorAll('[data-q]').forEach(r =>
            r.addEventListener('click', () => {
                actual.quadrant = Number(r.dataset.q);
                comprova();
            })
        );
    lloc.querySelectorAll('[data-m]').forEach(c =>
        c.addEventListener('click', () => {
            const i = Number(c.dataset.m);
            actual.marques = actual.marques.includes(i) ? actual.marques.filter(x => x !== i) : [...actual.marques, i];
            pintaPla();
        })
    );
}

// ── Els passos ──────────────────────────────────────────────────────────────
function preparaCasella(inp) {
    inp.type = 'text';
    inp.autocomplete = 'off';
    if (isTouchDevice()) inp.inputMode = 'none';
    else inp.inputMode = 'decimal';
    inp.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            enterCx();
        }
    });
    inp.addEventListener('input', () => inp.classList.remove('cx-malament'));
}

function creaCamp(camp, i) {
    const caixa = el('span', 'cx-camp');
    caixa.dataset.nom = camp.nom;
    if (camp.etiqueta) caixa.appendChild(tex(camp.etiqueta));
    if (camp.tipus === 'arrel') {
        const c = el('input', 'step-input step-input-sm');
        c.dataset.nom = camp.nom;
        c.dataset.part = 'c';
        c.setAttribute('aria-label', `${camp.nom}: coeficient`);
        const arrel = el('span', 'cx-arrel');
        arrel.appendChild(el('span', 'cx-arrel-signe', '√'));
        const s = el('input', 'step-input step-input-sm cx-radicand');
        s.dataset.nom = camp.nom;
        s.dataset.part = 's';
        s.setAttribute('aria-label', `${camp.nom}: dins de l’arrel`);
        arrel.appendChild(s);
        [c, s].forEach(preparaCasella);
        caixa.append(c, arrel);
    } else if (camp.tipus === 'enter' || camp.tipus === 'decimal') {
        if (camp.signe) {
            const signe = el('button', 'cx-signe', '+');
            signe.type = 'button';
            signe.id = `cx-signe-${camp.nom}-${i}`;
            signe.setAttribute('aria-label', 'canvia el signe');
            signe.addEventListener('click', () => (signe.textContent = signe.textContent === '+' ? '−' : '+'));
            caixa.appendChild(signe);
        }
        const inp = el('input', 'step-input');
        inp.dataset.nom = camp.nom;
        if (camp.tipus === 'decimal') inp.dataset.coma = 'true';
        if (camp.signe) inp.dataset.signId = `cx-signe-${camp.nom}-${i}`;
        preparaCasella(inp);
        caixa.appendChild(inp);
    }
    if (camp.sufix) caixa.appendChild(tex(camp.sufix));
    return caixa;
}

function mostraPas() {
    const pas = actual.ex.passos[actual.index];
    const lloc = panell().querySelector('.cx-passos');
    const vell = lloc.querySelector('.cx-pas-actual');
    if (vell) vell.remove();
    if (!pas) return;
    const div = el('div', 'dv-step cx-pas-actual');
    const titol = el('div', 'cx-pas-titol');
    titol.append(el('span', 'cx-pas-num', `${actual.index + 1}/${actual.ex.passos.length}`), ambFormules(pas.titol));
    div.appendChild(titol);
    const tipus = pas.camps[0].tipus;
    if (tipus !== 'quadrant' && tipus !== 'marques') {
        const fila = el('div', 'dv-step-row cx-camps');
        pas.camps.forEach((c, i) => fila.appendChild(creaCamp(c, i)));
        div.appendChild(fila);
        if (pas.camps.some(c => c.tipus === 'arrel')) div.appendChild(el('div', 'cx-nota', T.nota.arrel));
        else if (pas.camps.some(c => c.tipus === 'decimal')) div.appendChild(el('div', 'cx-nota', T.nota.decimals));
    }
    if (tipus !== 'quadrant') {
        const b = el('button', 'btn-check-sm cx-comprova', T.ui.comprova);
        b.type = 'button';
        b.addEventListener('click', comprova);
        div.appendChild(b);
    }
    lloc.appendChild(div);
    actual.quadrant = null;
    actual.marques = [];
    pintaPla();
    const primera = div.querySelector('input');
    if (primera) enfoca(primera);
}

function enfoca(inp) {
    if (isTouchDevice()) showCustomKeyboard(inp);
    else setTimeout(() => inp.focus(), 50);
}

function llegeix(pas) {
    const div = panell().querySelector('.cx-pas-actual');
    const valors = {};
    for (const camp of pas.camps) {
        if (camp.tipus === 'quadrant') valors[camp.nom] = actual.quadrant;
        else if (camp.tipus === 'marques') valors[camp.nom] = actual.marques.slice();
        else if (camp.tipus === 'arrel') {
            const v = {};
            div.querySelectorAll(`input[data-nom="${camp.nom}"]`).forEach(i => (v[i.dataset.part] = i.value));
            valors[camp.nom] = v;
        } else {
            const inp = div.querySelector(`input[data-nom="${camp.nom}"]`);
            let v = inp.value.trim();
            const signe = inp.dataset.signId && document.getElementById(inp.dataset.signId);
            if (signe && signe.textContent === '−' && v && !v.startsWith('-')) v = `-${v}`;
            valors[camp.nom] = v;
        }
    }
    return valors;
}

/** Enter: salta a la casella buida següent, o comprova. */
export function enterCx() {
    if (!actual || actual.acabat) return;
    const div = panell().querySelector('.cx-pas-actual');
    if (!div) return;
    const inputs = [...div.querySelectorAll('input')];
    const cur = getKbActiveInput() || document.activeElement;
    const buida = inputs.find(i => i !== cur && !i.value.trim() && !i.classList.contains('cx-radicand'));
    if (cur && inputs.includes(cur) && cur.value.trim() && buida) return enfoca(buida);
    comprova();
}

function comprova() {
    const pas = actual.ex.passos[actual.index];
    const r = corregeixPasCx(pas, llegeix(pas));
    const fb = panell().querySelector('.cx-feedback');
    const div = panell().querySelector('.cx-pas-actual');
    if (r.estat === 'incomplet') {
        const buida = div && div.querySelector(`input[data-nom="${r.camp}"]`);
        if (buida) enfoca(buida);
        return;
    }
    if (r.estat === 'avis') {
        fb.style.color = 'var(--warning-dark)';
        fb.textContent = r.missatge;
        return;
    }
    if (r.estat === 'error') {
        const e = estat[actual.pestanya];
        e.errors++;
        panell().querySelector('.cx-errors').textContent = String(e.errors);
        fb.style.color = 'var(--danger)';
        fb.textContent = `${T.ui.error} ${r.missatge}`;
        let primera = null;
        for (const nom of r.malament)
            div.querySelectorAll(`input[data-nom="${nom}"]`).forEach(inp => {
                inp.classList.add('cx-malament');
                inp.classList.remove('anim-shake');
                void inp.offsetWidth;
                inp.classList.add('anim-shake');
                if (!primera) primera = inp;
            });
        if (primera) {
            enfoca(primera);
            if (isTouchDevice()) kbMarkForOverwrite(primera);
            else setTimeout(() => primera.select(), 60);
        }
        if (pas.camps[0].tipus === 'marques') {
            actual.marques = [];
            pintaPla();
        }
        return;
    }
    // Encert: la línia resolta, el resultat al pla i el pas següent
    fb.textContent = '';
    const lloc = panell().querySelector('.cx-passos');
    const linia = el('div', 'cx-linia');
    linia.appendChild(tex(pas.linia));
    lloc.insertBefore(linia, lloc.querySelector('.cx-pas-actual'));
    if (pas.plaResolt) actual.pla.vectors.push(pas.plaResolt);
    if (pas.pla) {
        // Les arrels: queden totes marcades, amb el polígon
        Object.assign(actual.pla, pas.pla, { seleccionades: pas.solucio.m, poligon: true });
    }
    actual.index++;
    if (actual.index >= actual.ex.passos.length) {
        actual.acabat = true;
        div.remove();
        pintaPla();
        const fi = panell().querySelector('.cx-final');
        fi.innerHTML = '';
        const caixa = el('div', 'result-box anim-fade-in-up');
        caixa.appendChild(el('div', 'result-title', T.ui.correcte));
        const nou = el('button', 'btn-check-sm cx-nou', T.ui.nou);
        nou.type = 'button';
        nou.style.margin = '16px auto 0';
        nou.style.display = 'block';
        nou.addEventListener('click', () => nouExercici(actual.pestanya));
        caixa.appendChild(nou);
        fi.appendChild(caixa);
        setTimeout(() => fi.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
        return;
    }
    mostraPas();
}
