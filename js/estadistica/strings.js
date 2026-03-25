/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estadistica/strings.js
 * ROL: Tots els textos de feedback i instruccions del mòdul d'estadística.
 * DEPENDÈNCIES: Cap. S'ha de carregar ABANS del controlador.
 * ============================================================================
 */

window.Strings = (() => {

    const Phases = {
        selectInterval: '📊 Tria com vols agrupar les dades',
        marca:          '📐 Calcula la marca de classe (punt mitjà) de cada interval',
        fi:             '📋 Omple la columna de freqüència absoluta (F<sub>a</sub>)',
        hiPct:          '📋 Omple les columnes de freqüència relativa (f<sub>r</sub>) i percentatge (%)',
        mean:           '📈 Calcula la mitjana aritmètica',
        median:         '📈 Calcula la mediana',
        mode:           '📈 Quina és la moda?',
        medianInterval: '📈 En quin interval es troba la mediana?',
        modeInterval:   '📈 Quin és l\'interval modal?',
    };

    const Feedback = {
        fillAll:        '⚠️ Omple totes les cel·les abans de comprovar.',
        allCorrect:     '✅ Tot correcte!',
        someWrong:      (nErr, nTotal) => `❌ ${nErr} de ${nTotal} cel·les incorrectes. Revisa les marcades en vermell.`,
        correct:        '✅ Correcte!',
        wrong:          '❌ Incorrecte. Torna-ho a provar.',
        wrongMean:      '❌ Revisa el càlcul. Recorda: mitjana = Σ(x<sub>i</sub>·F<sub>a</sub>) / n',
        wrongMeanGr:    '❌ Revisa el càlcul. Recorda: mitjana = Σ(marca<sub>i</sub>·F<sub>a</sub>) / n',
        wrongMedian:    '❌ Recorda: ordena les dades i busca el valor central.',
        wrongMode:      '❌ La moda és el valor amb més freqüència absoluta.',
        wrongInterval:  '❌ No és aquest interval. Mira quina fila de la taula acumula la posició central.',
        showSolution:   (val) => `La resposta correcta era: <strong>${val}</strong>`,
        hintFi:         'Compta quantes vegades apareix cada valor a les dades.',
        hintHi:         'F<sub>a</sub>: freqüència absoluta. f<sub>r</sub>: freqüència relativa. %: percentatge.',
        hintMarca:      'La marca de classe és el punt mitjà de l\'interval: (límit inferior + límit superior) / 2.',
    };

    return { Phases, Feedback };

})();
