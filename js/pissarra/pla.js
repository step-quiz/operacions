/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/pla.js
 * ROL: «Resolució pas a pas» — el PLA d'una transició: quin símbol del pas nou
 *      és quin símbol del pas vell. Mòdul PUR (sense DOM ni window): el fa
 *      servir pissarra.js abans de mesurar i dibuixar, i els tests el proven
 *      amb Node.
 * ARQUITECTURA:
 * - planifica(clausA, clausB, pas) torna:
 *     parelles   Map(clau nova → clau vella): el mateix símbol, que viatja (i es
 *                fon si el contingut canvia). Hi entren:
 *                · la mateixa clau als dos passos;
 *                · pas.reanomena = {nova: vella};
 *                · pas.copia = {nova: vella}: la nova és una còpia de la vella que
 *                  es queda al seu lloc; fa parella sense gastar l'original, que
 *                  pot viatjar, fusionar-se o repartir-se alhora;
 *                · pas.reparteix = {vella: [nova1, nova2…]}: un símbol que vola a
 *                  diversos llocs alhora (p. ex. el 2 de 2·(x + 3), que va als dos
 *                  termes). Cada nova fa parella amb la vella.
 *     copies     Set de les noves que són còpies;
 *     repartides Set de les noves que surten d'un repartiment;
 *     desti      Map(clau vella → clau nova) de pas.fusiona = {nova: [velles]};
 *     velles     les claus velles sense parella (van a la seva fusió o s'esvaeixen);
 *     noves      les claus noves sense parella (apareixen).
 * - L'ordre de les claus importa: dues claus noves que volen la mateixa vella
 *   (per la mateixa clau o per reanomena) → la primera s'hi queda.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export function planifica(clausA, clausB, pas = {}) {
    const A = new Set(clausA);
    const B = [...clausB];
    const reanomena = new Map(Object.entries(pas.reanomena || {}));
    const copia = new Map(Object.entries(pas.copia || {}));
    const repartiment = new Map(); // nova → vella
    for (const [ka, kbs] of Object.entries(pas.reparteix || {})) for (const kb of kbs) repartiment.set(kb, ka);

    const parelles = new Map();
    const copies = new Set();
    const repartides = new Set();
    const gastades = new Set(); // velles que ja tenen parella (una còpia no en gasta cap)
    for (const kb of B) {
        if (copia.has(kb)) {
            const ka = copia.get(kb);
            if (A.has(ka)) {
                parelles.set(kb, ka);
                copies.add(kb);
            }
            continue;
        }
        if (repartiment.has(kb)) {
            const ka = repartiment.get(kb);
            if (A.has(ka)) {
                parelles.set(kb, ka);
                repartides.add(kb);
                gastades.add(ka);
            }
            continue;
        }
        const ka = reanomena.get(kb) || kb;
        if (A.has(ka) && !gastades.has(ka)) {
            parelles.set(kb, ka);
            gastades.add(ka);
        }
    }
    const desti = new Map();
    for (const [kb, kas] of Object.entries(pas.fusiona || {})) for (const ka of kas) desti.set(ka, kb);
    const velles = [...A].filter(ka => !gastades.has(ka));
    const noves = B.filter(kb => !parelles.has(kb));
    return { parelles, copies, repartides, desti, velles, noves };
}
