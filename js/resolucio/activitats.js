/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/resolucio/activitats.js
 * ROL: Les activitats que tenen «Resolució pas a pas» (l'escenari B: l'alumne
 *      mira com es resol un exercici a resolucio.html, sense fer-lo).
 * ARQUITECTURA:
 * - ACTIVITATS: { clau: { nom, pagina, nivells, carrega } }. clau: el nom del fitxer
 *   de l'activitat sense «.html» (el de resolucio.html?activitat=…); pagina: on es fa
 *   l'exercici (l'escenari A, «Ara fes-ho tu»); nivells: [[valor, nom]]; carrega():
 *   el procediment pur de l'activitat ({ NIVELLS, exercici(nivell), passos(exercici,
 *   { oberts }), files(exercici) }), carregat només quan cal; enllac(nivell) (opcional):
 *   l'adreça d'«Ara fes-ho tu» (si no n'hi ha, pagina?nivell=…).
 *   Prioritat: els nivells 6–8 són d'enters, i «Ara fes-ho tu» hi afegeix ?nombres=enters.
 *   Fórmules STEAM: els nivells 1–4 de l'activitat (formules-steam.html?nivell=1…4).
 * - Les claus són les de SUPORTA_PISSARRA (js/pissarra/mode.js) i les de «pissarra:
 *   true» a index.html (tests/check-repo.js ho comprova).
 * DEPENDÈNCIES: el procediment de cada activitat (p. ex. js/equacions/resolucio.js).
 * ============================================================================
 */

export const ACTIVITATS = Object.freeze({
    'equacions': Object.freeze({
        nom: 'Equacions de 1r grau',
        pagina: 'equacions.html',
        nivells: Object.freeze([
            [1, 'Nivell 1'],
            [2, 'Nivell 2'],
            [3, 'Nivell 3'],
        ]),
        carrega: () => import('../equacions/resolucio.js').then(m => m.Resolucio),
    }),
    'fraccions': Object.freeze({
        nom: 'Operacions amb fraccions',
        pagina: 'fraccions.html',
        nivells: Object.freeze([
            [1, 'Mateix denominador'],
            [2, 'Denominador múltiple'],
            [3, 'Denominadors diferents'],
            [4, 'Producte i divisió'],
        ]),
        carrega: () => import('../fraccions/resolucio.js').then(m => m.Resolucio),
    }),
    'prioritat': Object.freeze({
        nom: "Prioritat d'operacions",
        pagina: 'prioritat.html',
        nivells: Object.freeze([
            [1, 'Productes i sumes'],
            [2, "D'esquerra a dreta"],
            [3, 'Potències'],
            [4, 'Parèntesis'],
            [5, 'Tot combinat'],
            [6, 'Enters: sumes i restes'],
            [7, 'Enters: regla dels signes'],
            [8, 'Enters: potències i tot'],
        ]),
        enllac: nivell => (nivell >= 6 ? 'prioritat.html?nombres=enters' : `prioritat.html?nivell=${nivell}`),
        carrega: () => import('../prioritat/resolucio.js').then(m => m.Resolucio),
    }),
    'formules-steam': Object.freeze({
        nom: 'Fórmules STEAM',
        pagina: 'formules-steam.html',
        nivells: Object.freeze([
            [1, 'Un pas'],
            [2, 'Dos passos o més'],
            [3, 'La lletra al denominador'],
            [4, 'Quadrats i fórmules llargues'],
        ]),
        carrega: () => import('../formules-steam/resolucio.js').then(m => m.Resolucio),
    }),
});
