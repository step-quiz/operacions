// js/banc-preguntes.js

/**
 * =========================================================================
 * GENERADOR UNIVERSAL DE DISTRACTORS (Regla de la Cadena: f(x) = g(Kx))
 * =========================================================================
 * @param {Object} kVars - Objecte amb les cadenes de text de K ja formatades.
 * @param {Object} fns - Funcions { g, dg, intG } que retornen codi LaTeX.
 * @returns {Array} - Llista mestra amb tots els possibles errors cognitius.
 */
function buildChainRuleDistractors(kVars, fns) {
    const { coef, negCoef, kx, negKx, plusK, kInv } = kVars;
    const { g, dg, intG } = fns;

    return [
        // --- ERRORS DE LA REGLA DE LA CADENA ---
        `${dg(kx)}`,                           // 1. Oblida derivar a dins
        `${coef}${g(kx)}`,                     // 2. Deriva a dins però no a fora
        `${g(kx)}`,                            // 3. No deriva ni a dins ni a fora (copia l'enunciat)
        
        // --- ERRORS DE CONFUSIÓ AMB INTEGRALS ---
        `${kInv}${dg(kx)}`,                    // 4. Multiplica per 1/K en lloc de K
        `${kInv}${intG(kx)}`,                  // 5. Fa la integral completa perfectament
        `${intG(kx)}`,                         // 6. Fa la integral només a fora
        
        // --- ERRORS ALGÈBRICS I DE NOTACIÓ ---
        `${coef}x${dg(kx)}`,                   // 7. Baixa la x (fals ús regla potències)
        `${dg(`${coef}(x-1)`)}`,               // 8. Resta 1 a l'argument (fals ús regla potències)
        `${dg(kx)} ${plusK}`,                  // 9. Suma K fora de la funció
        `${dg('x')} ${plusK}`,                 // 10. Es menja la K de dins i la suma a fora
        
        // --- ERRORS D'OBLIDAR LA K DE L'ARGUMENT ---
        `${dg('x')}`,                          // 11. Es menja la K de l'argument completament
        `${coef}${dg('x')}`,                   // 12. Treu K fora però l'esborra de dins
        
        // --- ERRORS DE SIGNE ---
        `${dg(negKx)}`,                        // 13. Canvia el signe només a dins
        `${negCoef}${dg(negKx)}`               // 14. Canvia el signe a dins i a fora
    ];
}

/**
 * =========================================================================
 * BANC DE PREGUNTES
 * =========================================================================
 */
const questionBank = [
    {
        id: 'exp_kx_int', 
        generate: () => {
            // 1. Variables de K
            const k = generateK();
            const kStr = formatK(k); 
            const kInvStr = k === -1 ? "-" : (k < 0 ? `-\\frac{1}{${Math.abs(k)}}` : `\\frac{1}{${k}}`);
            const plusK = k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
            const negKStr = formatK(-k);

            // 2. Empaquetem les variables per a la fàbrica
            const kVars = {
                coef: kStr,
                negCoef: negKStr,
                kx: `${kStr}x`,
                negKx: `${negKStr}x`,
                plusK: plusK,
                kInv: kInvStr
            };
            
            // 3. Definim el comportament de g(x) = e^x
            const fns = {
                g:    (arg) => `e^{${arg}}`,
                dg:   (arg) => `e^{${arg}}`,
                intG: (arg) => `e^{${arg}}`
            };

            // 4. Generem correcta i distractors
            const correctTex = `${kVars.coef}${fns.dg(kVars.kx)}`;
            const allDistractors = buildChainRuleDistractors(kVars, fns);

            // 5. Filtrem col·lisions (duplicats o iguals a la correcta) i triem 3
            const validDistractors = [...new Set(allDistractors.filter(d => d !== correctTex))];
            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kVars.kx}}`,
                correctTex: correctTex,
                distractorsTex: selectedDistractors
            };
        }
    },
    {
        id: 'exp_kx_frac', 
        generate: () => {
            // 1. Variables de K (Fracció)
            const frac = generateFractionK();
            const p = frac.num;
            const q = frac.den;
            const absP = Math.abs(p);
            const sign = p < 0 ? "-" : "";

            const kCoefStr = p < 0 ? `-\\frac{${absP}}{${q}}` : `\\frac{${absP}}{${q}}`;
            const kInvStr = p < 0 ? `-\\frac{${q}}{${absP}}` : `\\frac{${q}}{${absP}}`;
            const negKCoefStr = p < 0 ? `\\frac{${absP}}{${q}}` : `-\\frac{${absP}}{${q}}`;
            const plusK = p > 0 ? `+ ${kCoefStr}` : kCoefStr;

            // 2. Alternança de notació (Manera 1 vs Manera 2)
            const isManera2 = Math.random() < 0.5;
            let kxStr, negKxStr;

            if (isManera2) {
                const pxStr = absP === 1 ? "x" : `${absP}x`;
                kxStr = `${sign}\\frac{${pxStr}}{${q}}`;
                negKxStr = p < 0 ? `\\frac{${pxStr}}{${q}}` : `-\\frac{${pxStr}}{${q}}`;
            } else {
                kxStr = `${kCoefStr}x`;
                negKxStr = `${negKCoefStr}x`;
            }

            // 3. Empaquetem per a la fàbrica
            const kVars = {
                coef: kCoefStr,
                negCoef: negKCoefStr,
                kx: kxStr,
                negKx: negKxStr,
                plusK: plusK,
                kInv: kInvStr
            };

            // 4. Funcions base per a e^x
            const fns = {
                g:    (arg) => `e^{${arg}}`,
                dg:   (arg) => `e^{${arg}}`,
                intG: (arg) => `e^{${arg}}`
            };

            // 5. Muntem-ho tot
            const correctTex = `${kVars.coef}${fns.dg(kVars.kx)}`;
            const allDistractors = buildChainRuleDistractors(kVars, fns);

            const validDistractors = [...new Set(allDistractors.filter(d => d !== correctTex))];
            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kVars.kx}}`,
                correctTex: correctTex,
                distractorsTex: selectedDistractors
            };
        }
    }
];
