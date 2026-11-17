/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/strings.js
 * ROL: Textos de «Fórmules STEAM» (formules-steam.html): consignes dels passos i la
 *      frase que presenta cada fórmula amb el significat i la unitat de les lletres.
 *      Els missatges dels errors són a errors.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_FS = {
    element: 'Fórmula',
    /** «La fórmula és v = Δx / Δt, on v és la velocitat (km/h), … i Δt és el temps (h).» */
    llegenda: (formula, parts) => {
        const llista = parts.map(([lletra, nom, unitat]) => `${lletra} és ${nom}${unitat ? ` (${unitat})` : ''}`);
        const darrera = llista.pop();
        return `La fórmula és ${formula}, on ${llista.length ? `${llista.join(', ')} i ${darrera}` : darrera}.`;
    },
    enunciat: {
        substitucio: 'Primer, amb nombres: substitueix les dades a la fórmula.',
        operacio: x => `Quina operació fas als dos membres per aïllar ${x}?`,
        equacio: 'Com queda?',
        valor: x => `Calcula el valor de ${x}.`,
        unitat: x => `En quina unitat surt ${x}? Fes les operacions amb les unitats.`,
        lletres: op => `Ara, amb lletres: ${op[0].toLowerCase()}${op.slice(1)}. Com queda?`,
    },
    nomPas: {
        substitucio: 'dades',
        operacio: 'operació',
        equacio: 'equació',
        valor: 'valor',
        unitat: 'unitat',
        lletres: 'amb lletres',
    },
    nota: {
        valor: 'Escriu el nombre amb coma decimal, si cal.',
    },
    gira: 'girem la igualtat',
};
