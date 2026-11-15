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
 *                · la mateixa clau als dos passos (es queda o es desplaça);
 *                · pas.reanomena = {nova: vella};
 *                · pas.copia = {nova: vella}: una còpia de la vella, que no la gasta;
 *                · pas.reparteix = {vella: [nova1, nova2…]}: la vella vola a
 *                  diversos llocs alhora (p. ex. el 2 de 2·(x + 3)).
 *                Si la vella també és al pas nou (es queda escrita, com les línies
 *                d'un historial), el que hi vola és una còpia: la vella no es gasta.
 *     copies     Set de les noves que són còpies (també les d'una vella que es queda);
 *     repartides Set de les noves que surten d'un repartiment;
 *     desti      Map(clau vella → clau nova) de pas.fusiona = {nova: [velles]}, per a les
 *                velles que desapareixen;
 *     volades    [[vella, nova]]: un fantasma de la vella vola fins a la nova i s'hi fon.
 *                Són les fusions d'una vella que es queda, i els moviments (reanomena,
 *                copia, reparteix) cap a una nova que ja era al pas vell (p. ex. la línia
 *                d'un pas obert, que ja es veia en gris com a objectiu);
 *     velles     les claus velles que desapareixen sense parella (van a la seva fusió o
 *                s'esvaeixen);
 *     noves      les claus noves sense parella (apareixen).
 * - L'ordre de les claus importa: dues claus noves que volen la mateixa vella que
 *   desapareix (per reanomena) → la primera s'hi queda.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export function planifica(clausA, clausB, pas = {}) {
    const A = new Set(clausA);
    const B = [...clausB];
    const queda = new Set(B); // les velles que també són al pas nou (no es gasten)
    const reanomena = new Map(Object.entries(pas.reanomena || {}));
    const copia = new Map(Object.entries(pas.copia || {}));
    const repartiment = new Map(); // nova → vella
    for (const [ka, kbs] of Object.entries(pas.reparteix || {})) for (const kb of kbs) repartiment.set(kb, ka);

    const parelles = new Map();
    const copies = new Set();
    const repartides = new Set();
    const gastades = new Set(); // velles que desapareixen i ja tenen parella
    const volades = [];
    for (const kb of B) {
        const font = copia.get(kb) ?? repartiment.get(kb) ?? reanomena.get(kb);
        if (A.has(kb)) {
            // El mateix símbol; si a més s'hi mou un altre símbol, en vola un fantasma que s'hi fon
            parelles.set(kb, kb);
            if (font !== undefined && font !== kb && A.has(font)) volades.push([font, kb]);
            continue;
        }
        if (font === undefined || !A.has(font)) continue;
        if (queda.has(font) || copia.has(kb)) {
            parelles.set(kb, font);
            copies.add(kb);
            if (repartiment.has(kb)) repartides.add(kb);
            continue;
        }
        if (repartiment.has(kb)) {
            parelles.set(kb, font);
            repartides.add(kb);
            gastades.add(font);
            continue;
        }
        if (!gastades.has(font)) {
            parelles.set(kb, font);
            gastades.add(font);
        }
    }
    const desti = new Map();
    for (const [kb, kas] of Object.entries(pas.fusiona || {}))
        for (const ka of kas) {
            if (!A.has(ka)) continue;
            if (queda.has(ka)) volades.push([ka, kb]);
            else desti.set(ka, kb);
        }
    const velles = [...A].filter(ka => !queda.has(ka) && !gastades.has(ka));
    const noves = B.filter(kb => !parelles.has(kb));
    return { parelles, copies, repartides, desti, volades, velles, noves };
}
