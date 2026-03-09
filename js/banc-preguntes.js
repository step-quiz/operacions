// js/banc-preguntes.js

/**
 * =========================================================================
 * GENERADOR UNIVERSAL DE DISTRACTORS (Amb feedback pedagògic)
 * =========================================================================
 */
function buildChainRuleDistractors(kVars, fns) {
    const { coef, negCoef, kx, negKx, plusK, kInv } = kVars;
    const { g, dg, intG } = fns;

    return [
        // --- ERRORS DE LA REGLA DE LA CADENA ---
        { tex: `${dg(kx)}`, feedback: "Has oblidat aplicar la regla de la cadena." },
        { tex: `${coef}${g(kx)}`, feedback: "No és aquesta la derivada." },
        { tex: `${g(kx)}`, feedback: "No has derivat." },
        
        // --- ERRORS DE CONFUSIÓ AMB INTEGRALS ---
        { tex: `${kInv}${dg(kx)}`, feedback: "Quan has aplicat la regla de la cadena, t'has equivocat en un coeficient." },
        { tex: `${kInv}${intG(kx)}`, feedback: "Incorrecte: recorda que estem derivant." },
        { tex: `${intG(kx)}`, feedback: "Incorrecte: recorda que estem derivant." },
        
        // --- ERRORS ALGÈBRICS I DE NOTACIÓ ---
        { tex: `${coef}x${dg(kx)}`, feedback: "No has aplicat correctament la regla de la cadena." },
        { tex: `${dg(`${coef}(x-1)`)}`, feedback: "Compte, aquesta funció no es deriva com si fos un polinomi." },
        { tex: `${dg(kx)} ${plusK}`, feedback: "No apliques correctament la regla de la cadena, perquè no hi va una suma." },
        { tex: `${dg('x')} ${plusK}`, feedback: "No apliques correctament la regla de la cadena, perquè no hi va una suma." },
        
        // --- ERRORS D'OBLIDAR LA K DE L'ARGUMENT ---
        { tex: `${dg('x')}`, feedback: "No és aquesta la derivada." },
        { tex: `${coef}${dg('x')}`, feedback: "No has aplicat correctament la regla de la cadena." },
        
        // --- ERRORS DE SIGNE ---
        { tex: `${dg(negKx)}`, feedback: "Revisa els signes que has escrit i, a més, recorda aplicar la regla de la cadena." },
        { tex: `${negCoef}${dg(negKx)}`, feedback: "Hi ha algun error amb els signes." }
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
            const k = generateK();
            const kStr = formatK(k); 
            const kInvStr = k === -1 ? "-" : (k < 0 ? `-\\frac{1}{${Math.abs(k)}}` : `\\frac{1}{${k}}`);
            const plusK = k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
            const negKStr = formatK(-k);

            const kVars = {
                coef: kStr, negCoef: negKStr, kx: `${kStr}x`, negKx: `${negKStr}x`, plusK: plusK, kInv: kInvStr
            };
            
            const fns = {
                g: (arg) => `e^{${arg}}`, dg: (arg) => `e^{${arg}}`, intG: (arg) => `e^{${arg}}`
            };

            const correctTex = `${kVars.coef}${fns.dg(kVars.kx)}`;
            const allDistractors = buildChainRuleDistractors(kVars, fns);

            // Filtre anti-col·lisions per a OBJECTES usant Map
            const uniqueDistractorsMap = new Map();
            allDistractors.forEach(distractor => {
                if (distractor.tex !== correctTex && !uniqueDistractorsMap.has(distractor.tex)) {
                    uniqueDistractorsMap.set(distractor.tex, distractor);
                }
            });

            const validDistractors = Array.from(uniqueDistractorsMap.values());
            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kVars.kx}}`,
                correctTex: correctTex,
                distractors: selectedDistractors // <-- Atenció: Ara es diu 'distractors' (array d'objectes), no distractorsTex
            };
        }
    },
    {
        id: 'exp_kx_frac', 
        generate: () => {
            const frac = generateFractionK();
            const p = frac.num;
            const q = frac.den;
            const absP = Math.abs(p);
            const sign = p < 0 ? "-" : "";

            const kCoefStr = p < 0 ? `-\\frac{${absP}}{${q}}` : `\\frac{${absP}}{${q}}`;
            const kInvStr = absP === 1 ? (p < 0 ? `-${q}` : `${q}`) : (p < 0 ? `-\\frac{${q}}{${absP}}` : `\\frac{${q}}{${absP}}`);
            const negKCoefStr = p < 0 ? `\\frac{${absP}}{${q}}` : `-\\frac{${absP}}{${q}}`;
            const plusK = p > 0 ? `+ ${kCoefStr}` : kCoefStr;

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

            const kVars = {
                coef: kCoefStr, negCoef: negKCoefStr, kx: kxStr, negKx: negKxStr, plusK: plusK, kInv: kInvStr
            };

            const fns = {
                g: (arg) => `e^{${arg}}`, dg: (arg) => `e^{${arg}}`, intG: (arg) => `e^{${arg}}`
            };

            const correctTex = `${kVars.coef}${fns.dg(kVars.kx)}`;
            const allDistractors = buildChainRuleDistractors(kVars, fns);

            const uniqueDistractorsMap = new Map();
            allDistractors.forEach(distractor => {
                if (distractor.tex !== correctTex && !uniqueDistractorsMap.has(distractor.tex)) {
                    uniqueDistractorsMap.set(distractor.tex, distractor);
                }
            });

            const validDistractors = Array.from(uniqueDistractorsMap.values());
            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kVars.kx}}`,
                correctTex: correctTex,
                distractors: selectedDistractors // <-- Array d'objectes
            };
        }
    }
];s
