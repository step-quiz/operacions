// js/banc-preguntes.js

const questionBank = [
    {
        id: 'exp_kx_int', 
        generate: () => {
            const k = generateK();
            const kStr = formatK(k); 
            
            // Format especial per la fracció inversa i sumes
            const kInvStr = k === -1 ? "-" : (k < 0 ? `-\\frac{1}{${Math.abs(k)}}` : `\\frac{1}{${k}}`);
            const plusK = k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
            
            // Calculem -K per als nous distractors
            const negKStr = formatK(-k);

            const correctTex = `${kStr}e^{${kStr}x}`;

            // Llista mestra de distractors actualitzada (10 opcions)
            const allDistractors = [
                `e^{${kStr}x}`,                       // Oblida la regla de la cadena
                `${kInvStr}e^{${kStr}x}`,             // Fa la integral
                `${kStr}xe^{${kStr}x}`,               // Baixa la x
                `e^{${kStr}(x-1)}`,                   // Regla potències a l'exponent
                `e^{${kStr}x} ${plusK}`,              // Suma K a la funció original
                `e^x`,                                // Es menja la K de l'exponent
                `${kStr}e^x`,                         // Baixa la K però se n'oblida a l'exponent
                
                // --- ELS TEUS 3 NOUS DISTRACTORS ---
                `e^{${negKStr}x}`,                    // e^(-Kx)
                `${negKStr}e^{${negKStr}x}`,          // -K * e^(-Kx)
                `e^x ${plusK}`                        // e^x + K
            ];

            // Filtre per evitar duplicats o respostes que coincideixin amb la correcta
            const validDistractors = [...new Set(allDistractors.filter(d => d !== correctTex))];

            // Triem 3 distractors a l'atzar d'aquesta llista neta
            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kStr}x}`,
                correctTex: correctTex,
                distractorsTex: selectedDistractors
            };
        }
    },
 {
        id: 'exp_kx_frac', 
        generate: () => {
            const frac = generateFractionK();
            
            // Extraiem numerador (p) i denominador (q)
            const p = frac.num;
            const q = frac.den;
            const absP = Math.abs(p);
            const sign = p < 0 ? "-" : "";

            // 1. Preparem el coeficient K aïllat (sense la x) per posar davant d'e
            const kCoefStr = p < 0 ? `-\\frac{${absP}}{${q}}` : `\\frac{${absP}}{${q}}`;
            
            // 2. Preparem la inversa de K i el -K aïllats
            const kInvStr = p < 0 ? `-\\frac{${q}}{${absP}}` : `\\frac{${q}}{${absP}}`;
            const negKCoefStr = p < 0 ? `\\frac{${absP}}{${q}}` : `-\\frac{${absP}}{${q}}`;
            
            // Preparem la suma de +K al final
            const plusK = p > 0 ? `+ ${kCoefStr}` : kCoefStr;

            // --- LA MÀGIA: Manera 1 o Manera 2 per escriure Kx ---
            const isManera2 = Math.random() < 0.5;
            let kxStr, negKxStr;

            if (isManera2) {
                // Manera 2: px/q (Ex: 3x/5 o x/5)
                // Si p=1 o p=-1, escrivim només "x" al numerador
                const pxStr = absP === 1 ? "x" : `${absP}x`;
                kxStr = `${sign}\\frac{${pxStr}}{${q}}`;
                
                // També calculem -Kx per als distractors
                negKxStr = p < 0 ? `\\frac{${pxStr}}{${q}}` : `-\\frac{${pxStr}}{${q}}`;
            } else {
                // Manera 1: (p/q)x (Ex: 3/5 x)
                kxStr = `${kCoefStr}x`;
                negKxStr = `${negKCoefStr}x`;
            }

            // Ara muntem la resposta correcta i els distractors usant els blocs
            const correctTex = `${kCoefStr}e^{${kxStr}}`;

            const allDistractors = [
                `e^{${kxStr}}`,                       
                `${kInvStr}e^{${kxStr}}`,            
                `${kxStr}e^{${kxStr}}`,              
                `e^{${kCoefStr}(x-1)}`,                   
                `e^{${kxStr}} ${plusK}`,              
                `e^x`,                                
                `${kCoefStr}e^x`,
                
                // Distractors amb el signe canviat
                `e^{${negKxStr}}`,
                `${negKCoefStr}e^{${negKxStr}}`,
                `e^x ${plusK}`
            ];

            const validDistractors = [...new Set(allDistractors.filter(d => d !== correctTex))];
            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kxStr}}`,
                correctTex: correctTex,
                distractorsTex: selectedDistractors
            };
        }
    }
];
