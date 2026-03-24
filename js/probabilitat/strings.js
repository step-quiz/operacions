/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/probabilitat/strings.js
 * ROL: Tots els textos de feedback, pistes i hints del mòdul de probabilitat.
 * ARQUITECTURA:
 * - Font única de tots els textos visibles per l'alumne.
 * - Permet centralitzar futures traduccions o modificacions pedagògiques.
 * DEPENDÈNCIES: Cap. S'ha de carregar ABANS de distractor-lib.js.
 * ============================================================================
 */

window.Strings = (() => {

    const Feedback = {
        correct:          'Correcte!',
        singleCase:       'Has comptat un sol cas favorable. Recorda que pot haver-hi més d\'un resultat que compleixi la condició.',
        wrongCount:       'El nombre de casos favorables no és correcte. Torna a comptar quins resultats compleixen la condició.',
        complement:       'Has calculat la probabilitat de l\'esdeveniment contrari. Si busques P(A), no calculis P(no A).',
        addNotMult:       'Has sumat les probabilitats en lloc de multiplicar-les. Quan dos esdeveniments són independents, cal multiplicar.',
        forgotOne:        'Has oblidat un dels dos esdeveniments. Cal considerar tots dos alhora.',
        wrongTotal:       'El nombre total de casos possibles no és correcte. Revisa l\'espai mostral.',
        singleTrial:      'Has calculat la probabilitat per a un sol llançament/extracció, però se\'n fan dos.',
        withRepl:         'Has aplicat la fórmula AMB reposició, però l\'enunciat diu SENSE reposició. Després de la primera extracció, el total canvia.',
        withoutRepl:      'Has aplicat la fórmula SENSE reposició, però l\'enunciat diu AMB reposició. Amb reposició, les probabilitats no canvien.',
        ignoreCondition:  'No has tingut en compte la informació donada. Sabent que un fet ja ha passat, l\'espai mostral es redueix.',
        wrongNumerator:   'El numerador no és correcte. Si ja s\'ha extret una bola d\'un color, en queden menys d\'aquell color.',
        wrongDenominator: 'El denominador no és correcte. Si ja s\'ha extret una bola, el total es redueix en una unitat.',
        inverted:         'Has invertit la condició. P(A|B) no és el mateix que P(B|A). Fixa\'t bé en què se sap i què es demana.',
        jointNotCond:     'Has calculat la probabilitat conjunta P(A∩B), però es demana la probabilitat condicionada P(A|B) = P(A∩B)/P(B).',
        marginalNotCond:  'Has ignorat la condició i has calculat la probabilitat marginal. Cal restringir-se al subgrup indicat.',
    };

    const Hints = {
        SINGLE_CASE:        'La probabilitat de Laplace és P = casos favorables / casos possibles. Compta tots els resultats del dau que compleixen la condició, no només un.',
        WRONG_COUNT:        'Atura\'t a llistar un per un els resultats favorables. Per exemple, "quins nombres del dau són parells?" → 2, 4, 6 → 3 resultats.',
        COMPLEMENT:         'Si et demanen P(A), assegura\'t que no estàs calculant P(no A). La suma de les dues és 1.',
        ADD_NOT_MULT:       'Quan dos experiments són independents (un no afecta l\'altre), la probabilitat conjunta és el producte: P(A i B) = P(A) × P(B), no la suma.',
        FORGOT_ONE:         'En un experiment compost (moneda + dau, per exemple), cal multiplicar les probabilitats de cadascun: P(A) × P(B).',
        WRONG_TOTAL:        'L\'espai mostral és el conjunt de tots els resultats possibles. Un dau en té 6, una moneda en té 2, dues monedes en tenen 4 (CC, CX, XC, XX).',
        SINGLE_TRIAL:       'L\'enunciat diu que es fan dues extraccions. Cal considerar el resultat de totes dues, no només d\'una.',
        WITH_REPL:          'AMB reposició: després d\'extreure una bola, la tornem a la caixa. Les probabilitats no canvien.\nSENSE reposició: la bola no es retorna. El total disminueix.',
        WITHOUT_REPL:       'AMB reposició: les probabilitats són iguals a cada extracció.\nSENSE reposició: a la segona extracció hi ha una bola menys al total (i potser una menys del color extret).',
        IGNORE_CONDITION:   'En probabilitat condicionada, sabem que un fet ja ha passat. Això redueix l\'espai mostral. Pensa: "Si la primera és blava, quantes boles queden?"',
        WRONG_NUMERATOR:    'Si ja hem tret una bola blava, ara queden (blaves − 1) boles blaves a la caixa. El numerador ha de reflectir-ho.',
        WRONG_DENOMINATOR:  'Si ja hem tret una bola, el total de boles a la caixa és (total − 1). El denominador ha de reflectir-ho.',
        INVERTED:           'P(A|B) significa "probabilitat d\'A, sabent que B ha passat". El denominador és el nombre de casos on B és cert, no on A és cert.',
        JOINT_NOT_COND:     'La probabilitat condicionada P(A|B) no és el mateix que la conjunta P(A∩B). Cal dividir: P(A|B) = P(A∩B) / P(B).',
        MARGINAL_NOT_COND:  'Quan ens diuen "sabent que...", hem de restringir-nos a aquest subgrup. No podem usar el total de tota la població.',
    };

    return { Feedback, Hints };

})();
