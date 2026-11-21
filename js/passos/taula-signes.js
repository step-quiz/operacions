/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/taula-signes.js
 * ROL: La TAULA DE SIGNES interactiva, comuna (camp 'taula' del joc de passos).
 *      La fa servir «Estudi d'una funció» (signe de f′ i f″, creixement, extrems,
 *      concavitat) i la poden fer servir les inequacions de 2n grau o racionals.
 *
 *   TAULA (dades del tros { camp, taula } de la plantilla)
 *     columnes  [{ tipus: 'interval', text, a, b } | { tipus: 'punt', text }]
 *               a, b: els extrems de l'interval (nombres; ±Infinity), per validar el punt de prova
 *     files     [{ id, titol, editable, valors?, opcions? }]
 *               id 'prova': caselles per escriure un punt de prova (enter) a cada interval
 *               qualsevol altre id: una cel·la per columna; editable → un botó que va canviant
 *               de valor cada vegada que es toca (opcions: { interval: [[valor, etiqueta]], punt: […] });
 *               no editable → valors[i] (etiquetes ja escrites, '' si no n'hi ha)
 *   SOLUCIÓ (pas.solucio[nom])
 *     { prova: bool, files: { id: [valor per columna] } }   només les files editables (sense 'prova')
 *   RESPOSTA (llegida per joc-passos.js)
 *     { p0: '…', p2: '…', …, files: { id: [valor | null] } }   p<i>: la casella de la columna i
 *   ESCRIT (després de llegeixTaula)
 *     { prova: { i: nombre }, files: { id: [valor] } }
 *
 * ARQUITECTURA: el model, la correcció i la taula resolta (HTML en text) són purs; creaTaulaSignes
 *      fa el DOM (només al navegador).
 * DEPENDÈNCIES: utils.js (parseStrictInt).
 * ============================================================================
 */

import { parseStrictInt } from '../utils.js';

const buitTS = s => s === undefined || s === null || String(s).trim() === '';

/** Les columnes d'una taula a partir dels punts (ordenats): intervals i punts alternats. */
export function columnesTaula(punts) {
    const cols = [];
    const extrem = (v, text) => ({ v, text });
    const inici = extrem(-Infinity, '−∞');
    const fi = extrem(Infinity, '+∞');
    const vores = [inici, ...punts.map(p => extrem(p.v, p.text)), fi];
    for (let i = 0; i < vores.length - 1; i++) {
        const [a, b] = [vores[i], vores[i + 1]];
        cols.push({ tipus: 'interval', text: `(${a.text}, ${b.text})`, a: a.v, b: b.v });
        if (i < punts.length) cols.push({ tipus: 'punt', text: punts[i].text, ...(punts[i].dades || {}) });
    }
    return cols;
}

/** Un punt de prova dins de l'interval: el punt mig, o un enter a la vora si és infinit. */
export function puntDeProva({ a, b }) {
    if (a === -Infinity && b === Infinity) return 0;
    if (a === -Infinity) return Math.ceil(b) - 1;
    if (b === Infinity) return Math.floor(a) + 1;
    // Un enter de dins (els generadors en garanteixen un); si no, el punt mig
    const k = Math.floor(a) + 1;
    return k < b ? k : (a + b) / 2;
}

/**
 * Llegeix la resposta. Torna { estat: 'incomplet' | 'avis', codi } o { valor: ESCRIT }.
 * Codis d'avís: NO_ENTER (un punt de prova que no és un enter), FALTA_TAULA (una cel·la sense tocar).
 */
export function llegeixTaula(r, sol, taula) {
    r = r || {};
    const prova = {};
    if (sol.prova) {
        let algun = false;
        for (let i = 0; i < taula.columnes.length; i++) {
            if (taula.columnes[i].tipus !== 'interval') continue;
            const t = r[`p${i}`];
            if (buitTS(t)) continue;
            algun = true;
            const n = parseStrictInt(String(t).replace(/[−–]/g, '-'));
            if (Number.isNaN(n)) return { estat: 'avis', codi: 'NO_ENTER' };
            prova[i] = n;
        }
        if (!algun) return { estat: 'incomplet' };
        const falten = taula.columnes.some((c, i) => c.tipus === 'interval' && !(i in prova));
        if (falten) return { estat: 'incomplet' };
    }
    const files = {};
    for (const id of Object.keys(sol.files)) {
        const v = (r.files && r.files[id]) || [];
        if (taula.columnes.some((_, i) => buitTS(v[i]))) return { estat: 'avis', codi: 'FALTA_TAULA' };
        files[id] = v.slice(0, taula.columnes.length);
    }
    return { valor: { prova, files } };
}

/** Les cel·les equivocades: [{ fila, col }] (fila 'prova' per als punts de prova fora de l'interval). */
export function cellesMalament(escrit, sol, taula) {
    const dolentes = [];
    if (sol.prova)
        taula.columnes.forEach((c, i) => {
            if (c.tipus !== 'interval') return;
            const p = escrit.prova[i];
            if (!(p > c.a && p < c.b)) dolentes.push({ fila: 'prova', col: i });
        });
    for (const [id, valors] of Object.entries(sol.files))
        valors.forEach((v, i) => {
            if (escrit.files[id][i] !== v) dolentes.push({ fila: id, col: i });
        });
    return dolentes;
}

export const taulaCorrecta = (escrit, sol, taula) => cellesMalament(escrit, sol, taula).length === 0;

// ── La taula resolta (HTML en text, per a la resolució) ─────────────────────
const escTS = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * La taula plena, com a HTML (la resolució la posa tal com és). files: [{ titol, valors: [etiqueta] }].
 * Els punts de prova no s'hi escriuen (cadascú n'ha triat uns).
 */
export function htmlTaula({ columnes, files, titolX = 'x' }) {
    const cap = columnes.map(c => `<th class="jp-taula-${c.tipus}" scope="col">${escTS(c.text)}</th>`).join('');
    const cos = files
        .map(
            f =>
                `<tr><th scope="row">${escTS(f.titol)}</th>${f.valors
                    .map((v, i) => `<td class="jp-taula-${columnes[i].tipus}">${escTS(v)}</td>`)
                    .join('')}</tr>`
        )
        .join('');
    return `<div class="jp-taula jp-taula-resolta"><table><thead><tr><th scope="col">${escTS(titolX)}</th>${cap}</tr></thead><tbody>${cos}</tbody></table></div>`;
}

// ── El giny (DOM) ───────────────────────────────────────────────────────────
/**
 * Crea la taula interactiva. Les caselles dels punts de prova són inputs .jp-camp (el joc de
 * passos les recull i el teclat numèric hi escriu); l'estat dels botons va a data-resposta
 * ({ files: { id: [valor] } }). L'esdeveniment 'jp-corregeix' (detail: { sol }) marca les cel·les
 * equivocades.
 * @param {string} nom      el nom del camp
 * @param {object} taula    TAULA
 * @param {object} textos   { pregunta: etiqueta d'una cel·la sense tocar, provaAria: text accessible }
 */
export function creaTaulaSignes(nom, taula, { buida = '?', provaAria = 'punt de prova' } = {}) {
    const caixa = document.createElement('div');
    caixa.className = 'jp-taula';
    caixa.dataset.nom = nom;
    const estat = { files: {} };
    const desa = () => {
        caixa.dataset.resposta = JSON.stringify(estat);
    };
    const taulaEl = document.createElement('table');
    const thead = document.createElement('thead');
    const capFila = document.createElement('tr');
    const x = document.createElement('th');
    x.scope = 'col';
    x.textContent = taula.titolX || 'x';
    capFila.appendChild(x);
    taula.columnes.forEach(c => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = `jp-taula-${c.tipus}`;
        th.textContent = c.text;
        capFila.appendChild(th);
    });
    thead.appendChild(capFila);
    const tbody = document.createElement('tbody');
    for (const fila of taula.files) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = fila.titol;
        tr.appendChild(th);
        if (fila.editable && fila.id !== 'prova') estat.files[fila.id] = taula.columnes.map(() => null);
        taula.columnes.forEach((c, i) => {
            const td = document.createElement('td');
            td.className = `jp-taula-${c.tipus}`;
            td.dataset.fila = fila.id;
            td.dataset.col = String(i);
            if (fila.id === 'prova') {
                if (c.tipus === 'interval') {
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.className = 'jp-camp jp-taula-prova';
                    inp.autocomplete = 'off';
                    inp.maxLength = 4;
                    inp.dataset.nom = nom;
                    inp.dataset.part = `p${i}`;
                    inp.setAttribute('aria-label', `${provaAria} ${c.text}`);
                    inp.addEventListener('input', () => {
                        inp.value = inp.value.replace(/[−–]/g, '-').replace(/[^\d-]/g, '');
                        td.classList.remove('jp-malament');
                    });
                    td.appendChild(inp);
                }
            } else if (fila.editable) {
                const opcions = (fila.opcions && fila.opcions[c.tipus]) || [];
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'jp-taula-cella';
                b.textContent = buida;
                b.setAttribute('aria-label', `${fila.titol}, ${c.text}`);
                b.addEventListener('click', () => {
                    const actual = estat.files[fila.id][i];
                    const k = opcions.findIndex(([v]) => v === actual);
                    const [v, etiqueta] = opcions[(k + 1) % opcions.length];
                    estat.files[fila.id][i] = v;
                    b.textContent = etiqueta;
                    b.dataset.valor = v;
                    td.classList.remove('jp-malament');
                    desa();
                });
                td.appendChild(b);
            } else {
                td.textContent = (fila.valors && fila.valors[i]) || '';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }
    taulaEl.append(thead, tbody);
    caixa.appendChild(taulaEl);
    caixa.addEventListener('jp-corregeix', e => {
        const { sol } = e.detail || {};
        if (!sol) return;
        const r = { files: estat.files };
        caixa.querySelectorAll('input.jp-taula-prova').forEach(inp => (r[inp.dataset.part] = inp.value));
        const l = llegeixTaula(r, sol, taula);
        if (!l.valor) return;
        for (const { fila, col } of cellesMalament(l.valor, sol, taula)) {
            const td = caixa.querySelector(`td[data-fila="${fila}"][data-col="${col}"]`);
            if (td) td.classList.add('jp-malament');
        }
    });
    desa();
    return caixa;
}
