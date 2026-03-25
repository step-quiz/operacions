/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/mitjana/strings.js
 * ROL: Tots els textos visibles per l'alumne del mòdul de mitjana.
 * ARQUITECTURA:
 * - Font única de tots els literals: enunciats, contextos, feedback i ajuda.
 * - Permet centralitzar futures traduccions o modificacions pedagògiques.
 * DEPENDÈNCIES: Cap. S'ha de carregar ABANS de question-bank.js.
 * ============================================================================
 */

window.Strings = (() => {

    // =========================================================================
    // CONTEXTOS — matèries i tipus d'avaluació
    // =========================================================================

    const Subjects = [
        'Matemàtiques', 'Llengua catalana', 'Castellà', 'Anglès',
        'Ciències naturals', 'Ciències socials', 'Tecnologia',
        'Educació física', 'Música', 'Plàstica',
    ];

    const Evaluations = [
        'les notes del primer trimestre',
        'les qualificacions dels exàmens parcials',
        'les notes de les activitats avaluades',
        'les qualificacions de les proves del curs',
    ];

    // =========================================================================
    // CONTEXTOS PONDERADA — etiquetes d'activitats per nombre de components
    // =========================================================================

    const WeightedLabels = {
        2: [
            ['examen final',   'treball de curs'],
            ['examen teòric',  'examen pràctic'],
            ['prova escrita',  'projecte'],
            ['examen',         'participació a classe'],
        ],
        3: [
            ['examen teòric', 'examen pràctic', 'treballs'],
            ['primer parcial', 'segon parcial',  'treball final'],
            ['examen',         'participació',   'deures'],
        ],
        pool: [
            'examen 1', 'examen 2', 'examen 3', 'treball',
            'projecte', 'exposició oral', 'participació',
            'pràctiques', 'deures', 'prova oral',
        ],
    };

    // =========================================================================
    // ENUNCIATS — frases introductòries de cada tipus de problema
    // =========================================================================

    const Context = {
        simple:   (evaluation) => `Un alumne ha obtingut ${evaluation}:`,
        weighted: (subject)    => `La nota final de <strong>${subject}</strong> es calcula amb aquesta ponderació:`,
    };

    // =========================================================================
    // AJUDA PAS A PAS
    // =========================================================================

    const Help = {
        simpleIntro:    'La <strong>mitjana aritmètica</strong> es calcula sumant tots els valors i dividint pel nombre de dades.',
        simpleFormula:  'Fórmula: x̄ = (x₁ + x₂ + ... + xₙ) / n',
        simpleSum:      (sumStr, sumVal) => `Suma: ${sumStr} = ${sumVal}`,
        simpleN:        (n)              => `Nombre de dades: n = ${n}`,
        simpleResult:   (sumVal, n, res) => `Mitjana: ${sumVal} / ${n} = ${res}`,

        weightedIntro:    'La <strong>mitjana ponderada</strong> multiplica cada valor pel seu pes i divideix pel total dels pesos.',
        weightedFormula:  'Fórmula: x̄ = (x₁·w₁ + x₂·w₂ + ... + xₙ·wₙ) / (w₁ + w₂ + ... + wₙ)',
        weightedProducts: (products)         => `Productes: ${products}`,
        weightedSumProd:  (sumProd)           => `Suma dels productes: ${sumProd}`,
        weightedSumW:     (sumW)              => `Suma dels pesos: ${sumW}`,
        weightedResult:   (sumProd, sumW, res) => `Mitjana ponderada: ${sumProd} / ${sumW} = ${res}`,
    };

    // =========================================================================
    // FEEDBACK — respostes correctes, incorrectes i avisos
    // =========================================================================

    const Feedback = {
        invalidInput:    '⚠️ Escriu un nombre vàlid. Pots usar la coma o el punt com a separador decimal.',
        correct:         (res) => `✅ Correcte! La resposta és ${res}.`,
        exhausted:       (res) => `❌ Intents esgotats. La resposta correcta era <strong>${res}</strong>.`,

        wrongSimple:     '❌ No és correcte. Recorda: suma totes les notes i divideix pel nombre de notes.',
        wrongWeighted:   '❌ No és correcte. Recorda: multiplica cada nota pel seu pes, suma els productes i divideix per la suma dels pesos.',
        wrongUsedSimple: '❌ No és correcte. Has calculat la mitjana simple, però cal ponderar cada nota pel seu pes.',
    };

    // =========================================================================
    // BOTONS D'AJUDA
    // =========================================================================

    const Btn = {
        helpShow: '💡 Ajuda',
        helpHide: '💡 Amagar ajuda',
    };

    // =========================================================================
    // TAULA DE NOTES — capçaleres
    // =========================================================================

    const Table = {
        colActivity: 'Activitat',
        colGrade:    'Nota',
        colWeight:   'Pes (%)',
    };

    // =========================================================================
    // PREGUNTA FINAL DE CADA PROBLEMA
    // =========================================================================

    const Ask = {
        simple:   'Calcula la <strong>mitjana aritmètica</strong>.',
        weighted: 'Calcula la <strong>mitjana aritmètica ponderada</strong>.',
    };

    // =========================================================================
    // ZONA D'INPUT
    // =========================================================================

    const Input = {
        label:       'Resposta:',
        placeholder: 'Escriu el resultat',
        btnSubmit:   'Comprova',
    };

    // =========================================================================
    // HISTORIAL DE RESPOSTES
    // =========================================================================

    const History = {
        simple:   'Mitjana aritmètica',
        weighted: 'Mitjana ponderada',
    };

    return { Subjects, Evaluations, WeightedLabels, Context, Help, Feedback, Btn, Table, Ask, Input, History };

})();
