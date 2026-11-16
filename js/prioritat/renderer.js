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
 *   potències són botons (data-i = posició del token a la línia). A les altres
 *   línies van dins d'un <span class="tok-lloc">, que ocupa la mateixa caixa que
 *   un botó: així la taula no canvia d'amplada quan els botons hi són o no.
 * - La «Resolució pas a pas» (escenari B, js/prioritat/resolucio.js) pinta la
 *   mateixa taula, fila a fila, amb les claus de la pissarra (fa servir tokText).
 * - Enters: un negatiu darrere d'un signe s'escriu entre parèntesis, «5 − (−3)»
 *   (tokText rep el token d'abans); el menys davant d'un parèntesi, «−(», és una
 *   operació (un botó, a «Pas a pas»: treure el parèntesi de −(−3)).
 * DEPENDÈNCIES: math-engine.js (opRange), strings.js (OP_SHOW, opLabel, fmt, fmtDins).
 * ============================================================================
 */
import { MathEngine } from './math-engine.js';
import { Strings } from './strings.js';

export const Renderer = (() => {
    const { opRange } = MathEngine;
    const { OP_SHOW, opLabel, Esv, fmt, fmtDins } = Strings;

    const CLS = {
        num: 'tok-num',
        op: 'tok-op',
        neg: 'tok-op tok-neg',
        pow: 'tok-pow',
        lp: 'tok-paren tok-lp',
        rp: 'tok-paren tok-rp',
    };
    /** Els tokens que són una operació (botons a «Pas a pas»): els signes, les potències i el −( … ). */
    const esOperacio = t => t.k === 'op' || t.k === 'pow' || t.k === 'neg';

    // El contingut d'un token: 12, −, 3<sup>2</sup>, (, i amb enters (−3), (−2)<sup>3</sup>, −2<sup>2</sup>.
    // prev: el token d'abans (un negatiu darrere d'un signe va entre parèntesis)
    function tokText(t, prev) {
        if (t.k === 'num') return prev && prev.k !== 'lp' ? fmtDins(t.v) : fmt(t.v);
        if (t.k === 'op') return OP_SHOW[t.v];
        if (t.k === 'neg') return OP_SHOW['-'];
        if (t.k === 'pow') return `${t.opp ? OP_SHOW['-'] : ''}${fmtDins(t.b)}<sup>${t.e}</sup>`;
        return t.k === 'lp' ? '(' : ')';
    }

    function tokHtml(t, extra, prev) {
        return `<span class="${CLS[t.k]}${extra ? ' ' + extra : ''}">${tokText(t, prev)}</span>`;
    }

    // L'expressió de la modalitat «Resultat final».
    // diag (opcional): { red:Set, green:Set } amb les posicions a marcar
    function expressionHtml(toks, diag) {
        return toks
            .map((t, i) => {
                let cls = '';
                if (diag && diag.red.has(i)) cls = 'hl-red';
                else if (diag && diag.green.has(i)) cls = 'hl-green';
                return tokHtml(t, cls, toks[i - 1]);
            })
            .join('');
    }

    /**
     * La resolució en una taula «centrada».
     * @param {Array}  rows  [{ line, op, auto, marca }]: les línies, de l'enunciat cap avall (MathEngine.solve o
     *                       les que fa l'alumne). op: posició de l'operació que es fa per passar a la línia
     *                       següent (-1: cap); es destaca. auto: línia que no ha fet l'alumne (es mostra en gris).
     *                       marca (mode «Esvaïment»): 'exemple' (resolta, en gris) o 'ajuda' (feta amb ajuda).
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
                let inner = tokText(t, line[i - 1]);
                if (active && esOperacio(t)) {
                    let mark = '';
                    if (o.red && o.red.has(i)) mark = ' hl-red';
                    else if (o.green && o.green.has(i)) mark = ' hl-green';
                    inner = `<button type="button" class="tok-btn${mark}" data-i="${i}" aria-label="${opLabel(t)}">${inner}</button>`;
                } else if (esOperacio(t)) {
                    // La mateixa caixa que un botó: la taula no s'eixampla quan apareixen els botons
                    inner = `<span class="tok-lloc">${inner}</span>`;
                }
                const cls = CLS[t.k] + (i >= p && i <= q ? ' dest' : '');
                const span = t.c1 - t.c0;
                return `<td class="${cls}"${span > 1 ? ` colspan="${span}"` : ''}>${inner}</td>`;
            });
            // L'última línia també té la columna de l'«=», buida (un «=» invisible): quan s'hi escriu la
            // línia següent, la taula no s'eixampla
            const eq = k < last ? '<td class="igual">=</td>' : '<td class="igual reserva">=</td>';
            // Mode «Esvaïment»: marca 'exemple' (pas resolt, en gris) o 'ajuda' (pas fet amb ajuda),
            // amb una nota al final de la línia. La línia de treball no la porta (encara s'hi treballa).
            const marca = row.marca && !active ? row.marca : '';
            const cls = [row.auto || marca === 'exemple' ? 'auto' : '', marca].filter(Boolean).join(' ');
            const nota = marca
                ? `<td class="nota-pas">${marca === 'ajuda' ? Esv.notaAjuda : Esv.notaExemple}</td>`
                : '';
            return `<tr${cls ? ` class="${cls}"` : ''}>${tds.join('')}${eq}${nota}</tr>`;
        });
        return `<table class="centrat">${trs.join('')}</table>`;
    }

    return { CLS, esOperacio, tokText, tokHtml, expressionHtml, tableHtml };
})();
