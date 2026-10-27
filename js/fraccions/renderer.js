/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccions/renderer.js
 * ROL: «Resolució pas a pas» (?pissarra=1) d'«Operacions amb Fraccions»: les
 *      línies de l'expressió amb les claus de la pissarra i què mou cada pas.
 * ARQUITECTURA:
 * - Funcions pures: retornen text HTML i no toquen la pàgina (les proven els
 *   tests amb Node, tests/fraccions.test.js).
 * - Sense ?pissarra=1, el joc pinta les línies com sempre (fraccions.js) i no
 *   fa servir aquest fitxer.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const Renderer = (() => {
    // L'expressió es pinta dins d'una pissarra: cada pas escriu una línia nova a sota
    // i les d'abans queden escrites. Els nombres que el pas fa servir baixen volant de
    // la línia anterior a la nova (i a l'anterior en queda la còpia, quieta):
    //   · amplia (fraccions equivalents amb el denominador comú): cada fracció baixa
    //     sencera i, pel camí, el numerador i el denominador es converteixen en els nous;
    //   · inverteix (la divisió com un producte): la primera fracció baixa igual, el «:»
    //     es converteix en «·» i el numerador i el denominador de la segona es creuen;
    //   · opera (sumar, restar o multiplicar): els numeradors i el signe es fusionen en
    //     el numerador del resultat, i els denominadors, en el denominador;
    //   · simplifica: la fracció baixa i es converteix en l'equivalent simplificada.
    // Si el resultat és un nombre enter, tot el que hi va es fusiona en el nombre.
    //
    // Una línia és { termes, pas, classe }: termes, la llista de fraccions ({ n, d }, i
    // fr: true per escriure «n/1» com a fracció) i signes ('+', '-', '·', ':'); pas, el
    // pas que l'ha escrita (null a la primera, que acaba amb «=»; les altres comencen
    // amb «=»); classe, una classe més per a la línia (o res).
    // Claus: e<r><i><peça> (r: línia; i: posició del terme; peça n numerador o nombre
    // enter, d denominador, o signe); la còpia que queda d'una peça que ha baixat:
    // f<r><i><peça>; el «=»: e<r>q.

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
     * Què fa el pas que escriu la línia nova a partir de l'anterior: [[peça nova, [peces velles]]], amb les
     * peces escrites «<i><peça>». Una peça nova amb una sola peça vella hi baixa (i pot canviar pel camí);
     * amb més d'una, s'hi fusionen.
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
        return [...out].filter(([, vs]) => vs.length);
    }

    /** Les peces de la línia r que han baixat a la línia r + 1 (Set de «<i><peça>»). */
    function baixades(historia, r) {
        const seguent = historia[r + 1];
        if (!seguent || !seguent.pas) return new Set();
        return new Set(moviments(historia[r].termes, seguent.termes, seguent.pas).flatMap(([, vs]) => vs));
    }

    /** Una línia (vegeu més amunt); r: la seva posició. claus: posa les claus de la pissarra. */
    function liniaHtml(linia, r, { claus = false, fonts = new Set() } = {}) {
        const k = (i, p) => (claus ? ` data-k="${fonts.has(`${i}${p}`) ? 'f' : 'e'}${r}${i}${p}"` : '');
        const igual = `<span class="operator"${claus ? ` data-k="e${r}q"` : ''}>=</span>`;
        const termes = linia.termes.map((t, i) =>
            typeof t === 'string'
                ? `<span class="operator"${k(i, 'o')}>${t}</span>`
                : fraccioHtml(t, claus ? p => `${fonts.has(`${i}${p}`) ? 'f' : 'e'}${r}${i}${p}` : null)
        );
        const dins = linia.pas ? [igual, ...termes] : [...termes, igual];
        return `<div class="expr-line${linia.classe ? ' ' + linia.classe : ''}">${dins.join('')}</div>`;
    }

    /** Totes les línies, amb les claus de la pissarra. */
    function historiaHtml(historia) {
        const linies = historia.map((l, r) => liniaHtml(l, r, { claus: true, fonts: baixades(historia, r) }));
        return `<div class="fr-linies">${linies.join('')}</div>`;
    }

    /** L'animació de l'última línia: { reanomena, fusiona, copia } amb les claus de la pissarra. */
    function animacioUltimaLinia(historia) {
        const r = historia.length - 1;
        if (r < 1 || !historia[r].pas) return {};
        const mov = moviments(historia[r - 1].termes, historia[r].termes, historia[r].pas);
        const vella = p => `e${r - 1}${p}`,
            nova = p => `e${r}${p}`;
        const fonts = baixades(historia, r - 1);
        return {
            reanomena: Object.fromEntries(
                mov.filter(([, vs]) => vs.length === 1).map(([n, [v]]) => [nova(n), vella(v)])
            ),
            fusiona: Object.fromEntries(
                mov.filter(([, vs]) => vs.length > 1).map(([n, vs]) => [nova(n), vs.map(vella)])
            ),
            copia: Object.fromEntries([...fonts].map(p => [`f${r - 1}${p}`, vella(p)])),
        };
    }

    return { fraccioHtml, liniaHtml, historiaHtml, animacioUltimaLinia, moviments };
})();
