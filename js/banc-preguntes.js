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
            const kStr = frac.tex;
            const kInvStr = invertFractionTex(frac);
            const plusK = frac.num > 0 ? `+ ${kStr}` : kStr;
            
            // Calculem -K per a les fraccions
            const negNum = -frac.num;
            const negSign = negNum < 0 ? "-" : "";
            const negKStr = `${negSign}\\frac{${Math.abs(negNum)}}{${frac.den}}`;

            const correctTex = `${kStr}e^{${kStr}x}`;

            const allDistractors = [
                `e^{${kStr}x}`,                       
                `${kInvStr}e^{${kStr}x}`,            
                `${kStr}xe^{${kStr}x}`,              
                `e^{${kStr}(x-1)}`,                   
                `e^{${kStr}x} ${plusK}`,              
                `e^x`,                                
                `${kStr}e^x`,
                
                // --- ELS TEUS 3 NOUS DISTRACTORS ---
                `e^{${negKStr}x}`,
                `${negKStr}e^{${negKStr}x}`,
                `e^x ${plusK}`
            ];

            const validDistractors = [...new Set(allDistractors.filter(d => d !== correctTex))];
            const selectedDistractors = validDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kStr}x}`,
                correctTex: correctTex,
                distractorsTex: selectedDistractors
            };
        }
    }
];
