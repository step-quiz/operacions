/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/banc-preguntes.js
 * ROL: Motor pedagògic i generador de distractors (Matriu d'Errors).
 * ARQUITECTURA MATEMÀTICA (Escalabilitat):
 * - El disseny es basa en derivar funcions compostes f(x) = g(h(x)) 
 * aplicant la regla de la cadena: f'(x) = g'(h(x)) * h'(x).
 * - Abstracció modular: L'argument intern (h(x) = Kx) està totalment separat 
 * de la funció principal (g). 
 * - El generador injecta objectes `kVars` (variables algebraiques) i `fns` 
 * (funcions g, dg, i integral) a una funció universal de distractors.
 * - Actualment implementat per a g(x) = e^x, però preparat per escalar a 
 * sinus, polinomis, etc., sense alterar la lògica central.
 * DEPENDÈNCIES: Funcions auxiliars (generateK, formatK) viuen a derivades.js.
 * ============================================================================
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
            
            // Creem versions de K que mai siguin buides per a fòrmules internes
            const kStr = formatK(k); 
            const kSimple = k === 1 ? "" : (k === -1 ? "-" : k.toString());
            
            // Corregim kInvStr per evitar strings buits o mal formats
            const kInvStr = k === 1 ? "" : (k === -1 ? "-" : (k < 0 ? `-\\frac{1}{${Math.abs(k)}}` : `\\frac{1}{${k}}`));
            
            const plusK = k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
            const negKStr = formatK(-k);

            const kVars = {
                // Coeficient principal: si és 1, la derivada d'e^x és e^x (sense res davant)
                coef: kSimple, 
                negCoef: negKStr, 
                kx: kSimple === "" ? "x" : (kSimple === "-" ? "-x" : `${kSimple}x`), 
                negKx: negKStr === "" ? "x" : (negKStr === "-" ? "-x" : `${negKStr}x`), 
                plusK: plusK, 
                kInv: kInvStr
            };
            
            const fns = {
                g: (arg) => `e^{${arg}}`, 
                dg: (arg) => `e^{${arg}}`, 
                intG: (arg) => `e^{${arg}}`
            };

            // Ara la resposta correcta i l'enunciat aniran coordinats
            const correctTex = `${kVars.coef}${fns.dg(kVars.kx)}`;
            const allDistractors = buildChainRuleDistractors(kVars, fns);

            // Filtre de seguretat: eliminem qualsevol distractor que hagi quedat buit o igual a la correcta
            const uniqueDistractorsMap = new Map();
            allDistractors.forEach(distractor => {
                if (distractor.tex && distractor.tex.trim() !== "" && distractor.tex !== correctTex && !uniqueDistractorsMap.has(distractor.tex)) {
                    uniqueDistractorsMap.set(distractor.tex, distractor);
                }
            });

            const validDistractors = Array.from(uniqueDistractorsMap.values());
            
            // SI PER ALGUNA RAÓ ENS QUEDEM SENSE DISTRACTORS (molt rar), en posem un de genèric de seguretat
            if (validDistractors.length < 3) {
                // MILLORA APLICADA: Usem kVars.kx en lloc d'una x fixa perquè sigui creïble
                validDistractors.push({ tex: `e^{${kVars.kx}}+C`, feedback: "Això sembla una integral, no una derivada." });
                validDistractors.push({ tex: `0`, feedback: "La derivada d'una exponencial no és zero." });
                validDistractors.push({ tex: `x e^{x-1}`, feedback: "No apliquis la regla de la potència a una exponencial." });
            }

            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kVars.kx}}`,
                correctTex: correctTex,
                distractors: selectedDistractors
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
                coef: kCoefStr, 
                negCoef: negKCoefStr, 
                kx: kxStr, 
                negKx: negKxStr, 
                plusK: plusK, 
                kInv: kInvStr
            };

            const fns = {
                g: (arg) => `e^{${arg}}`, 
                dg: (arg) => `e^{${arg}}`, 
                intG: (arg) => `e^{${arg}}`
            };

            const correctTex = `${kVars.coef}${fns.dg(kVars.kx)}`;
            const allDistractors = buildChainRuleDistractors(kVars, fns);

            // APLIQUEM EL MATEIX FILTRE DE SEGURETAT QUE ALS ENTERS
            const uniqueDistractorsMap = new Map();
            allDistractors.forEach(distractor => {
                // Verifiquem que el text existeixi, no sigui buit i no sigui igual a la correcta
                if (distractor.tex && distractor.tex.trim() !== "" && distractor.tex !== correctTex && !uniqueDistractorsMap.has(distractor.tex)) {
                    uniqueDistractorsMap.set(distractor.tex, distractor);
                }
            });

            const validDistractors = Array.from(uniqueDistractorsMap.values());
            
            // Fallback de seguretat per a fraccions
            if (validDistractors.length < 3) {
                // MILLORA APLICADA: Evitem posar un "1" literal al davant de l'exponencial
                const absPStr = absP === 1 ? "" : absP;
                
                validDistractors.push({ tex: `\\frac{1}{${q}} e^{${kVars.kx}}`, feedback: "Revisa el coeficient de la regla de la cadena." });
                validDistractors.push({ tex: `${absPStr} e^{${kVars.kx}}`, feedback: "Has oblidat el denominador de la fracció." });
                validDistractors.push({ tex: `e^{${kxStr}}`, feedback: "Has oblidat aplicar la regla de la cadena." });
            }

            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kVars.kx}}`,
                correctTex: correctTex,
                distractors: selectedDistractors
            };
        }
    }
];
