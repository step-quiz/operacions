/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccions/renderer.js
 * ROL: «Resolució pas a pas» (?pissarra=1) d'«Operacions amb Fraccions»: les
 *      línies de l'expressió amb les claus de la pissarra i què mou cada pas.
 * ARQUITECTURA:
 * - Funcions pures: retornen text HTML i no toquen la pàgina (les proven els
 *   tests amb Node, tests/fraccions.test.js). L'historial (claus, còpies,
 *   fusions) el porta formules.js historial(); aquí, com es dibuixa cada línia
 *   i què mou cada pas.
 * - Sense ?pissarra=1, el joc pinta les línies com sempre (fraccions.js) i no
 *   fa servir aquest fitxer.
 * DEPENDÈNCIES: pissarra/formules.js (guio, historial).
 * ============================================================================
 */

import { guio, historial } from '../pissarra/formules.js';

export const Renderer = (() => {
    // L'expressió es pinta dins d'una pissarra d'una sola fila amb formules.js historial(): cada pas
    // escriu una línia nova a sota i les d'abans queden escrites. Els nombres que el pas fa servir
    // baixen volant de la línia anterior a la nova (i a l'anterior en queda la còpia, quieta):
    //   · amplia (fraccions equivalents amb el denominador comú): cada fracció baixa sencera i, pel
    //     camí, el numerador i el denominador es converteixen en els nous;
    //   · inverteix (la divisió com un producte): la primera fracció baixa igual, el «:» es
    //     converteix en «·» i el numerador i el denominador de la segona es creuen;
    //   · opera (sumar, restar o multiplicar): els numeradors i el signe es fusionen en el
    //     numerador del resultat, i els denominadors, en el denominador;
    //   · simplifica: la fracció baixa i es converteix en l'equivalent simplificada.
    // Si el resultat és un nombre enter, tot el que hi va es fusiona en el nombre.
    //
    // Una línia és { termes, pas }: termes, la llista de fraccions ({ n, d }, i fr: true per
    // escriure «n/1» com a fracció) i signes ('+', '-', '·', ':'); pas, el pas que l'ha escrita
    // (null a la primera, que acaba amb «=»; les altres comencen amb «=»).
    // Peces (els id de l'historial): <i><peça> (i: posició del terme; peça n numerador o nombre
    // enter, d denominador, o signe); el «=»: q.

    const esEnter = t => t.d === 1 && !t.fr;

    /** L'HTML d'una fracció, com sempre (fraccions.js); clau(peça) dona la clau de cada peça (o res). */
    function fraccioHtml(t, clau) {
        const k = p => (clau ? ` data-k="${clau(p)}"` : '');
        if (esEnter(t)) return `<span class="math-cell integer-val"${k('n')}>${t.n}</span>`;
        return (
            `<div class="fraction"><span class="math-cell"${k('n')}>${t.n}</span><hr>` +
            `<span class="math-cell"${k('d')}>${t.d}</span></div>`
        );
    }

    /** Les peces que es veuen d'un terme: ['n', 'd'], ['n'] (enter) o ['o'] (signe). */
    const pecesTerme = t => (typeof t === 'string' ? ['o'] : esEnter(t) ? ['n'] : ['n', 'd']);

    /**
     * Què fa el pas que escriu la línia nova a partir de l'anterior, en el format de formules.js
     * historial(): { mou: {peça nova: peça vella}, fusiona: {peça nova: [peces velles]} }, amb les
     * peces escrites «<i><peça>». Una peça nova amb una sola peça vella hi baixa (i pot canviar pel
     * camí); amb més d'una, s'hi fusionen.
     */
    function moviments(abans, despres, pas) {
        const brut = [];
        if (pas === 'amplia' || pas === 'simplifica')
            despres.forEach((t, i) => pecesTerme(t).forEach(p => brut.push([`${i}${p}`, [`${i}${p}`]])));
        else if (pas === 'inverteix')
            brut.push(['0n', ['0n']], ['0d', ['0d']], ['1o', ['1o']], ['2n', ['2d']], ['2d', ['2n']]);
        else if (pas === 'opera') brut.push(['0n', ['0n', '1o', '2n']], ['0d', ['0d', '2d']]);
        // Només les peces que es veuen: el que anava a un denominador que no s'escriu (resultat enter) va
        // al nombre, i les peces velles que no hi són no es fan servir
        const existeix = (termes, peca) => pecesTerme(termes[+peca[0]] ?? '').includes(peca.slice(1));
        const out = new Map();
        for (let [nova, velles] of brut) {
            if (!existeix(despres, nova)) nova = nova[0] + 'n';
            if (!existeix(despres, nova)) continue;
            const vs = velles.filter(v => existeix(abans, v));
            out.set(nova, [...(out.get(nova) || []), ...vs]);
        }
        const mou = {},
            fusiona = {};
        for (const [nova, vs] of out) {
            if (vs.length === 1) mou[nova] = vs[0];
            else if (vs.length > 1) fusiona[nova] = vs;
        }
        return { mou, fusiona };
    }

    /**
     * Una línia (vegeu més amunt), el pintor de formules.js historial(): clauDe(peça) dona la clau de cada
     * peça (sense clauDe, l'HTML de sempre); classe: una classe més per a la línia (o res).
     */
    function liniaHtml(linia, clauDe = null, classe = '') {
        const k = id => (clauDe ? ` data-k="${clauDe(id)}"` : '');
        const igual = `<span class="operator"${k('q')}>=</span>`;
        const termes = linia.termes.map((t, i) =>
            typeof t === 'string'
                ? `<span class="operator"${k(i + 'o')}>${t}</span>`
                : fraccioHtml(t, clauDe ? p => clauDe(`${i}${p}`) : null)
        );
        const dins = linia.pas ? [igual, ...termes] : [...termes, igual];
        return `<div class="expr-line${classe ? ' ' + classe : ''}">${dins.join('')}</div>`;
    }

    /** Totes les línies, a la fila de la pissarra. */
    const envolta = linies => `<div class="fr-linies">${linies.join('')}</div>`;

    /** El text pla d'una línia (p. ex. «= 14/18 + 81/18»), per als lectors de pantalla. */
    function textLinia(linia) {
        const termes = linia.termes.map(t => (typeof t === 'string' ? t : esEnter(t) ? String(t.n) : `${t.n}/${t.d}`));
        return (linia.pas ? ['=', ...termes] : [...termes, '=']).join(' ');
    }

    /**
     * L'historial d'una operació (termes: les dues fraccions i el signe), amb la primera línia escrita:
     * un historial d'una sola fila (formules.js). El primer pas de la pissarra és historia.passos[0].
     */
    function historiaNova(termes) {
        const g = guio(1);
        g.classes[0] = 'centrada';
        const H = historial(g, { prefix: 'e', pinta: liniaHtml, envolta });
        H.escriu({ termes, pas: null }, '');
        return H;
    }

    /** Escriu la línia d'un pas encertat (amplia, inverteix, opera, simplifica). Torna el pas de la pissarra. */
    function escriuPas(H, termes, pas) {
        const linia = { termes, pas };
        return H.escriu(
            linia,
            '',
            Object.assign(moviments(H.ultima.linia.termes, termes, pas), { anunci: `Línia nova: ${textLinia(linia)}` })
        );
    }

    return { fraccioHtml, liniaHtml, envolta, moviments, textLinia, historiaNova, escriuPas };
})();
