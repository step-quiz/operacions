/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/resolucio/activitats.js
 * ROL: La llista ÚNICA de les activitats que tenen «Resolució pas a pas» (l'escenari B:
 *      l'alumne mira com es resol un exercici a resolucio.html, sense fer-lo). El portal
 *      (resolucio.html sense activitat) es dibuixa a partir d'aquí.
 * ARQUITECTURA:
 * - ACTIVITATS: { clau: { tema, nom, frase, exemple, pagina, nivells, carrega, enllac? } }.
 *   · clau: el nom del fitxer de l'activitat sense «.html» (el de resolucio.html?activitat=…);
 *   · tema: el bloc de continguts (la classe tema-… de css/temes.css): el color de la capçalera,
 *     dels botons i de la targeta del portal; el portal agrupa les targetes per tema (TEMES);
 *   · frase: què s'hi veu (la targeta del portal); exemple: una fórmula en TeX, dibuixada a la
 *     targeta amb KaTeX (només és una mostra: no és cap exercici dels que surten);
 *   · pagina: on es fa l'exercici (l'escenari A, «Ara fes-ho tu»); nivells: [[valor, nom]];
 *   · carrega(): el procediment pur de l'activitat ({ NIVELLS, exercici(nivell), passos(exercici,
 *     { oberts }), files(exercici) }), carregat només quan cal;
 *   · enllac(nivell) (opcional): l'adreça d'«Ara fes-ho tu» (si no n'hi ha, pagina?nivell=…).
 *   Prioritat: els nivells 6–8 són d'enters, i «Ara fes-ho tu» hi afegeix ?nombres=enters.
 *   Fórmules STEAM: els nivells 1–4 de l'activitat (formules-steam.html?nivell=1…4).
 *   Inequacions: només les de primer grau, els nivells 1–4 (inequacions.html?nivell=1…4); el
 *   procediment s'exporta com a ResolucioIQ.
 *   Cilindres amb un full: nivell 1 el full A4, nivell 2 altres fulls; s'exporta com a ResolucioCF.
 *   (Els noms ResolucioIQ i ResolucioCF: els tests carreguen tots els mòduls en un mateix àmbit,
 *   tests/harness.js, i les inequacions hi tenen al costat el Resolucio de les equacions.)
 * - No hi ha cap altra llista: index.html només hi enllaça (el botó «Resolució pas a pas» obre
 *   resolucio.html), i tests/check-repo.js comprova que cada clau té la seva pàgina i el seu
 *   procediment.
 * DEPENDÈNCIES: el procediment de cada activitat (p. ex. js/equacions/resolucio.js).
 * ============================================================================
 */

/** Els blocs del portal, en aquest ordre (els noms de css/temes.css). */
export const TEMES = Object.freeze([
    ['nombres', 'Nombres i operacions'],
    ['algebra', 'Àlgebra'],
    ['geometria', 'Geometria i mesura'],
    ['estadistica', 'Estadística i probabilitat'],
    ['funcions', 'Funcions i gràfiques'],
]);

export const ACTIVITATS = Object.freeze({
    'equacions': Object.freeze({
        tema: 'algebra',
        nom: 'Equacions de 1r grau',
        frase: 'Aïllar la x: treure parèntesis, ajuntar els termes semblants i dividir.',
        exemple: '3(x + 2) = 2x + 11',
        pagina: 'equacions.html',
        nivells: Object.freeze([
            [1, 'La x en un costat'],
            [2, 'La x als dos costats'],
            [3, 'Amb parèntesis'],
        ]),
        carrega: () => import('../equacions/resolucio.js').then(m => m.Resolucio),
    }),
    'fraccions': Object.freeze({
        tema: 'nombres',
        nom: 'Operacions amb fraccions',
        frase: 'Sumar, restar, multiplicar i dividir: el comú denominador i simplificar.',
        exemple: '\\dfrac{3}{4} + \\dfrac{5}{6}',
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
        tema: 'nombres',
        nom: "Prioritat d'operacions",
        frase: 'En quin ordre es fan les operacions, i per què, una a una.',
        exemple: '(8 + 6) \\cdot 5 - 4 \\cdot 5',
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
        tema: 'algebra',
        nom: 'Fórmules STEAM',
        frase: 'Aïllar una lletra en fórmules de ciències i tecnologia, primer amb nombres.',
        exemple: 'E = P \\cdot t',
        pagina: 'formules-steam.html',
        nivells: Object.freeze([
            [1, 'Un pas'],
            [2, 'Dos passos o més'],
            [3, 'La lletra al denominador'],
            [4, 'Quadrats i fórmules llargues'],
        ]),
        carrega: () => import('../formules-steam/resolucio.js').then(m => m.Resolucio),
    }),
    'inequacions': Object.freeze({
        tema: 'algebra',
        nom: 'Inequacions de primer grau',
        frase: 'Com una equació, però el signe canvia en dividir per un negatiu; la solució a la recta.',
        exemple: '-6x - 9 \\leq -15',
        pagina: 'inequacions.html',
        nivells: Object.freeze([
            [1, 'Coeficient positiu'],
            [2, 'Coeficient negatiu'],
            [3, 'Parèntesis'],
            [4, 'Denominadors'],
        ]),
        carrega: () => import('../inequacions/resolucio.js').then(m => m.ResolucioIQ),
    }),
    'cilindres': Object.freeze({
        tema: 'geometria',
        nom: 'Cilindres amb un full',
        frase: "Enrotllar un full de dues maneres: el radi, l'àrea de la base, el volum i la capacitat.",
        exemple: '2\\pi r = 21',
        pagina: 'cilindres.html',
        nivells: Object.freeze([
            [1, 'El full A4'],
            [2, 'Altres fulls'],
        ]),
        carrega: () => import('../cilindres/resolucio.js').then(m => m.ResolucioCF),
    }),
});
