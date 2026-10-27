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
 * - «Resolució pas a pas» (?pissarra=1, js/pissarra/): amb l'opció claus, cada
 *   token, cada «=» i cada nota porten una clau (data-k) perquè la pissarra els
 *   pugui seguir d'una taula a la següent. Quan s'escriu una línia nova, els
 *   tokens de l'operació (i els parèntesis que cauen) baixen i es fusionen en el
 *   resultat (fusioUltimaLinia); la resta de la línia nova apareix al seu lloc.
 *     token de la línia r      r<r>c<c0>x<c1>  (c0, c1: les columnes que ocupa)
 *     ja fusionat a la r + 1   s<r>c<c0>x<c1>  (la còpia que queda a la línia r)
 *     «=» de la línia r        e<r>            nota de la línia r   n<r>
 *   Sense l'opció, l'HTML és el de sempre.
 * DEPENDÈNCIES: math-engine.js (opRange), strings.js (OP_SHOW, opLabel).
 * ============================================================================
 */
import { MathEngine } from './math-engine.js';
import { Strings } from './strings.js';

export const Renderer = (() => {
    const { opRange } = MathEngine;
    const { OP_SHOW, opLabel, Esv } = Strings;

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

    // ── Claus per a la pissarra (?pissarra=1) ──
    const columnes = t => `c${t.c0}x${t.c1}`;
    // Un token és «el mateix» a la línia següent si hi ocupa les mateixes columnes i no ha canviat
    // (una potència calculada ocupa les mateixes columnes que el seu resultat, però no és el mateix)
    const identitat = t => `${columnes(t)}:${tokText(t)}`;

    // Les columnes dels tokens de la línia r que ja s'han fusionat en un resultat de la línia r + 1
    function fusionats(rows, r) {
        if (r + 1 >= rows.length) return new Set();
        const seguent = new Set(rows[r + 1].line.map(identitat));
        return new Set(rows[r].line.filter(t => !seguent.has(identitat(t))).map(columnes));
    }

    /**
     * La fusió de l'última línia escrita: { clau del resultat: [claus dels tokens de la línia
     * anterior que s'hi fusionen] }, amb les claus que tenien quan la línia anterior era
     * l'última. {} si no n'hi ha (una sola línia).
     */
    function fusioUltimaLinia(rows) {
        const L = rows.length - 1;
        if (L < 1) return {};
        const anterior = new Set(rows[L - 1].line.map(identitat));
        const resultats = rows[L].line.filter(t => !anterior.has(identitat(t)));
        if (resultats.length !== 1) return {};
        const res = resultats[0];
        const fonts = rows[L - 1].line.filter(t => t.c0 >= res.c0 && t.c1 <= res.c1);
        return { [`r${L}${columnes(res)}`]: fonts.map(t => `r${L - 1}${columnes(t)}`) };
    }

    /**
     * La resolució en una taula «centrada».
     * @param {Array}  rows  [{ line, op, auto, marca }]: les línies, de l'enunciat cap avall (MathEngine.solve o
     *                       les que fa l'alumne). op: posició de l'operació que es fa per passar a la línia
     *                       següent (-1: cap); es destaca. auto: línia que no ha fet l'alumne (es mostra en gris).
     *                       marca (mode «Esvaïment»): 'exemple' (resolta, en gris) o 'ajuda' (feta amb ajuda).
     * @param {object} o     { active: l'última línia és la de treball (signes i potències, botons),
     *                         red, green: Set de posicions de la línia de treball a marcar en vermell / verd,
     *                         claus: posa les claus de la pissarra (data-k) }
     */
    function tableHtml(rows, o = {}) {
        const last = rows.length - 1;
        // Amb claus, el contingut de cada cel·la va dins d'un <span data-k>
        const ambClau = (k, html) => (o.claus ? `<span data-k="${k}">${html}</span>` : html);
        const trs = rows.map((row, k) => {
            const { line, op } = row;
            const [p, q] = op >= 0 ? opRange(line, op) : [-1, -2];
            const active = !!o.active && k === last;
            const fets = o.claus ? fusionats(rows, k) : null;
            const tds = line.map((t, i) => {
                let inner = tokText(t);
                if (o.claus) inner = ambClau(`${fets.has(columnes(t)) ? 's' : 'r'}${k}${columnes(t)}`, inner);
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
            const eq = k < last ? `<td class="igual">${ambClau(`e${k}`, '=')}</td>` : '';
            // Mode «Esvaïment»: marca 'exemple' (pas resolt, en gris) o 'ajuda' (pas fet amb ajuda),
            // amb una nota al final de la línia. La línia de treball no la porta (encara s'hi treballa).
            const marca = row.marca && !active ? row.marca : '';
            const cls = [row.auto || marca === 'exemple' ? 'auto' : '', marca].filter(Boolean).join(' ');
            const nota = marca
                ? `${k < last ? '' : '<td class="igual"></td>'}<td class="nota-pas">${ambClau(`n${k}`, marca === 'ajuda' ? Esv.notaAjuda : Esv.notaExemple)}</td>`
                : '';
            return `<tr${cls ? ` class="${cls}"` : ''}>${tds.join('')}${eq}${nota}</tr>`;
        });
        return `<table class="centrat">${trs.join('')}</table>`;
    }

    return { tokText, tokHtml, expressionHtml, tableHtml, fusioUltimaLinia };
})();
