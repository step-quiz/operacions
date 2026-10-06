/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/prioritat/renderer.js
 * ROL: HTML de «Prioritat d'operacions»: l'expressió (amb les marques del
 *      diagnòstic) i la resolució en una taula «centrada».
 * ARQUITECTURA:
 * - Funcions pures: retornen text HTML i no toquen la pàgina (els tests les
 *   proven amb Node, tests/modules.test.js).
 * - La taula és la disposició «centrat» del projecte combinades: una columna
 *   per a cada nombre, signe, potència i parèntesi de l'enunciat; el resultat
 *   d'una operació ocupa (colspan) les columnes del que substitueix i hi queda
 *   centrat a sota. Cada línia, menys l'última, acaba amb «=»:
 *
 *       2 + 3 · ( 5 − 2 ) =
 *       2 + 3 ·     3     =
 *       2 +     9         =
 *          11
 *
 * - «Destaca»: a cada línia, l'operació que es fa a la línia següent va en
 *   blau fosc i subratllada (classe dest), també com al projecte combinades.
 * - Modalitat «Pas a pas»: a la línia de treball (l'última), els signes i les
 *   potències són botons (data-i = posició del token a la línia).
 * DEPENDÈNCIES: math-engine.js (opRange), strings.js (OP_SHOW, opLabel).
 * ============================================================================
 */
import { MathEngine } from './math-engine.js';
import { Strings } from './strings.js';

export const Renderer = (() => {
    const { opRange } = MathEngine;
    const { OP_SHOW, opLabel } = Strings;

    const CLS = { num: 'tok-num', op: 'tok-op', pow: 'tok-pow', lp: 'tok-paren tok-lp', rp: 'tok-paren tok-rp' };

    // El contingut d'un token: 12, −, 3<sup>2</sup>, (
    function tokText(t) {
        if (t.k === 'num') return String(t.v);
        if (t.k === 'op') return OP_SHOW[t.v];
        if (t.k === 'pow') return `${t.b}<sup>${t.e}</sup>`;
        return t.k === 'lp' ? '(' : ')';
    }

    function tokHtml(t, extra) {
        return `<span class="${CLS[t.k]}${extra ? ' ' + extra : ''}">${tokText(t)}</span>`;
    }

    // L'expressió de la modalitat «Resultat final».
    // diag (opcional): { red:Set, green:Set } amb les posicions a marcar
    function expressionHtml(toks, diag) {
        return toks
            .map((t, i) => {
                let cls = '';
                if (diag && diag.red.has(i)) cls = 'hl-red';
                else if (diag && diag.green.has(i)) cls = 'hl-green';
                return tokHtml(t, cls);
            })
            .join('');
    }

    /**
     * La resolució en una taula «centrada».
     * @param {Array}  rows  [{ line, op, auto }]: les línies, de l'enunciat cap avall (MathEngine.solve o
     *                       les que fa l'alumne). op: posició de l'operació que es fa per passar a la línia
     *                       següent (-1: cap); es destaca. auto: línia que no ha fet l'alumne (es mostra en gris).
     * @param {object} o     { active: l'última línia és la de treball (signes i potències, botons),
     *                         red, green: Set de posicions de la línia de treball a marcar en vermell / verd }
     */
    function tableHtml(rows, o = {}) {
        const last = rows.length - 1;
        const trs = rows.map((row, k) => {
            const { line, op } = row;
            const [p, q] = op >= 0 ? opRange(line, op) : [-1, -2];
            const active = !!o.active && k === last;
            const tds = line.map((t, i) => {
                let inner = tokText(t);
                if (active && (t.k === 'op' || t.k === 'pow')) {
                    let mark = '';
                    if (o.red && o.red.has(i)) mark = ' hl-red';
                    else if (o.green && o.green.has(i)) mark = ' hl-green';
                    inner = `<button type="button" class="tok-btn${mark}" data-i="${i}" aria-label="${opLabel(t)}">${inner}</button>`;
                }
                const cls = CLS[t.k] + (i >= p && i <= q ? ' dest' : '');
                const span = t.c1 - t.c0;
                return `<td class="${cls}"${span > 1 ? ` colspan="${span}"` : ''}>${inner}</td>`;
            });
            const eq = k < last ? '<td class="igual">=</td>' : '';
            return `<tr${row.auto ? ' class="auto"' : ''}>${tds.join('')}${eq}</tr>`;
        });
        return `<table class="centrat">${trs.join('')}</table>`;
    }

    return { tokText, tokHtml, expressionHtml, tableHtml };
})();
