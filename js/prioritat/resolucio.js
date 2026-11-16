/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/prioritat/resolucio.js
 * ROL: «Resolució pas a pas» de «Prioritat d'operacions» (l'escenari B: l'alumne
 *      mira com es resol una expressió, a resolucio.html?activitat=prioritat): el
 *      guió de la pissarra, una operació per pas, amb el detall a demanda de cada pas.
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM). La pissarra és la taula «centrada» de l'activitat
 *   (renderer.js tableHtml): una fila per línia, cada resultat centrat sota
 *   l'operació que substitueix, i a cada fila, l'operació que es fa per passar a la
 *   següent destacada (classe dest). Tota la taula és una sola fila de la pissarra,
 *   escrita amb js/pissarra/formules.js historial() (pinta: una <tr> per línia;
 *   envolta: la <table>). Les claus de cada cel·la són les columnes de l'enunciat que
 *   ocupa (c<c0>x<c1>) i les de l'«=», e.
 * - Una operació per pas, en l'ordre «de llibre» (math-engine.js solve), amb una
 *   frase que diu per què toca (math-engine.js motiuPas, strings.js exemplePas):
 *   «Primer, el que hi ha dins del parèntesi: 3 + 4 = 7.». Els tokens de l'operació
 *   (i els parèntesis que cauen) volen i es fusionen en el resultat; la resta de la
 *   fila nova hi apareix.
 * - El detall a demanda (decisió del David, 16/11/2026): «per què aquesta operació».
 *   Un subpas destaca a la taula l'operació que toca (sense escriure cap fila) i
 *   explica l'ordre de les operacions i per què és aquesta; després, D.acaba() la
 *   calcula. L'última operació (la sola que queda) no en té.
 * - Nivells (8): productes i sumes (els nivells 0–2 de l'activitat), esquerra a
 *   dreta (3), potències (4–5), parèntesis (6–8) i tot combinat (9); i amb enters
 *   (?nombres=enters de l'activitat, decisió del David, 16/11/2026): sumes i restes
 *   (els nivells d'enters 0–1), regla dels signes (2–3), potències de base negativa
 *   i tot (4–5). Els negatius, darrere d'un signe, entre parèntesis: 5 − (−3); treure
 *   el parèntesi de −(−3) és un pas més, amb la seva frase.
 * - tests/prioritat.test.js comprova milers d'expressions de tots els nivells: el
 *   guió és correcte, cada fila que es veu val el resultat i el detall compleix la
 *   seva regla.
 * DEPENDÈNCIES: utils.js (pick), math-engine.js, renderer.js (tokText), strings.js,
 *      pissarra/formules.js.
 * ============================================================================
 */
import { pick } from '../utils.js';
import { MathEngine } from './math-engine.js';
import { Renderer } from './renderer.js';
import { Strings } from './strings.js';
import { guio, historial } from '../pissarra/formules.js';

export const Resolucio = (() => {
    const { startLine, solve, opRange, opValue, motiuPas, generateExercise, generateExerciseEnters } = MathEngine;
    const { tokText, CLS, esOperacio } = Renderer;
    const { opText, toText, exemplePas, fmt } = Strings;

    /** Els nivells de la pàgina B → els nivells dels generadors de l'activitat (6–8: els d'enters). */
    const GRUPS = { 1: [0, 1, 2], 2: [3], 3: [4, 5], 4: [6, 7, 8], 5: [9], 6: [0, 1], 7: [2, 3], 8: [4, 5] };
    const ENTERS = new Set([6, 7, 8]);

    // ---- LA TAULA ----
    // Una línia és { line, op, igual }: line, els tokens amb les columnes que ocupen (math-engine.js); op, la
    // posició de l'operació que es fa per passar a la línia següent (-1: cap), destacada; igual, si la fila
    // acaba amb «=» (totes menys l'última, que el té invisible perquè la taula no s'eixampli).

    const columnes = t => `c${t.c0}x${t.c1}`;
    /** Un token i les columnes que ocupa (sense dependre de com s'escriu: −3 o (−3)). */
    const identitat = t => `${columnes(t)}:${t.k}:${t.v ?? ''}:${t.b ?? ''}:${t.e ?? ''}:${t.opp ? 1 : 0}`;

    /** El pintor de l'historial: una fila de la taula, amb la clau de cada cel·la; classe, la de la fila. */
    function pinta(linia, clauDe, classe) {
        const { line, op, igual } = linia;
        const [p, q] = op >= 0 ? opRange(line, op) : [-1, -2];
        const tds = line.map((t, i) => {
            let dins = `<span data-k="${clauDe(columnes(t))}">${tokText(t, line[i - 1])}</span>`;
            // Els signes i les potències, dins de la mateixa caixa que a l'activitat (tok-lloc)
            if (esOperacio(t)) dins = `<span class="tok-lloc">${dins}</span>`;
            const span = t.c1 - t.c0;
            const cls = CLS[t.k] + (i >= p && i <= q ? ' dest' : '');
            return `<td class="${cls}"${span > 1 ? ` colspan="${span}"` : ''}>${dins}</td>`;
        });
        const eq = igual
            ? `<td class="igual"><span data-k="${clauDe('e')}">=</span></td>`
            : '<td class="igual reserva">=</td>';
        return `<tr${classe ? ` class="${classe}"` : ''}>${tds.join('')}${eq}</tr>`;
    }
    const envolta = files => `<table class="centrat">${files.join('')}</table>`;
    // El detall no escriu files (només destaca l'operació): si mai n'hi hagués, anirien a la taula tal qual
    const calaix = files => files.join('');

    // ---- ELS PASSOS ----

    /** Què fa l'operació de la posició i de la línia: { fusiona: { resultat: [tokens que s'hi fusionen] } }. */
    function moviments(abans, despres) {
        const vells = new Set(abans.map(identitat));
        const res = despres.find(t => !vells.has(identitat(t)));
        const fonts = abans.filter(t => t.c0 >= res.c0 && t.c1 <= res.c1);
        return { fusiona: { [columnes(res)]: fonts.map(columnes) } };
    }

    const ORDRE =
        "L'ordre és: parèntesis, potències, multiplicacions i divisions, sumes i restes (les del mateix nivell, " +
        "d'esquerra a dreta).";

    /** La frase del detall: l'ordre de les operacions i per què toca aquesta. */
    function perQue(line, i, motiu) {
        const op = opText(line, i);
        const t = line[i];
        const nom = t.k === 'pow' ? 'una potència' : { '·': 'una multiplicació', ':': 'una divisió' }[t.v];
        const quina = {
            neg: `el parèntesi ja només té un nombre, i el signe menys de davant li canvia el signe`,
            par: `és dins del parèntesi, i el parèntesi va primer`,
            pow: `és una potència, i no queda cap parèntesi per fer`,
            prio: `és ${nom}, i no queda cap parèntesi ni cap potència per fer`,
            lr: `és la primera de les del seu nivell començant per l'esquerra`,
        }[motiu];
        return `${ORDRE} Ara toca ${op}: ${quina}.`;
    }

    /** Els passos de la resolució: [{ abans, despres, i, motiu, resposta }], un per operació. */
    function etapes(ex) {
        const files = solve(startLine(ex.toks));
        return files.slice(1).map((f, j) => {
            const abans = files[j].line,
                i = files[j].op;
            return { abans, despres: f.line, i, motiu: motiuPas(abans, i), resposta: opValue(abans, i) };
        });
    }

    /** Les files de la pissarra: tota la taula és una sola fila. */
    const files = () => 1;

    /**
     * El guió d'una expressió: la primera línia (l'enunciat) i una fila per operació, cadascuna amb la seva
     * frase. oberts: els passos (els seus id, '2', '3'…) que s'escriuen amb el detall; mentre es fa el subpas,
     * la fila del pas es veu en gris com a objectiu.
     */
    function passos(ex, { oberts = new Set() } = {}) {
        const g = guio(1);
        g.classes[0] = 'centrada';
        const H = historial(g, { prefix: 'P', pinta, envolta, calaix, oberts, objectiu: true });
        const inicial = startLine(ex.toks);
        H.escriu({ line: inicial, op: -1, igual: false }, `Calcula ${toText(ex.toks)}.`);
        const llista = etapes(ex);
        llista.forEach((e, j) => {
            const final = j === llista.length - 1;
            const fi = final ? ` El resultat és ${fmt(e.resposta)}.` : '';
            const anterior = { line: e.abans, op: e.i, igual: true };
            const op = Object.assign(moviments(e.abans, e.despres), { anterior, final });
            if (e.motiu !== 'sola')
                Object.assign(op, {
                    titol: 'Detall: per què aquesta operació',
                    detall: D => {
                        D.canvia(anterior, perQue(e.abans, e.i, e.motiu));
                        D.acaba(`${opText(e.abans, e.i)} = ${fmt(e.resposta)}.${fi}`, moviments(e.abans, e.despres));
                    },
                });
            const frase = exemplePas({ line: e.abans, op: e.i, motiu: e.motiu, resposta: e.resposta });
            H.escriu({ line: e.despres, op: -1, igual: false }, frase + fi, op);
        });
        return g.passos;
    }

    /** Una expressió nova del nivell (1–8): un dels nivells de l'activitat del grup (6–8: amb enters). */
    function exercici(nivell) {
        const genera = ENTERS.has(nivell) ? generateExerciseEnters : generateExercise;
        const { toks, val } = genera(pick(GRUPS[nivell]));
        return { nivell, toks, val };
    }

    return Object.freeze({ NIVELLS: [1, 2, 3, 4, 5, 6, 7, 8], GRUPS, exercici, passos, files, etapes, pinta, perQue });
})();
