// js/banc-preguntes.js

const questionBank = [
    {
        id: 'exp_kx_int', 
        generate: () => {
            const k = generateK();
            const kStr = formatK(k); 
            
            // Format especial per la fracció inversa si K és -1 (evitem -1/1)
            const kInvStr = k === -1 ? "-" : (k < 0 ? `-\\frac{1}{${Math.abs(k)}}` : `\\frac{1}{${k}}`);
            const plusK = k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;

            // Guardem la resposta correcta en una variable per poder-la comparar
            const correctTex = `${kStr}e^{${kStr}x}`;

            const allDistractors = [
                `e^{${kStr}x}`,                       
                `${kInvStr}e^{${kStr}x}`,            
                `${kStr}xe^{${kStr}x}`,              
                `e^{${kStr}(x-1)}`,                   
                `e^{${kStr}x} ${plusK}`,              
                `${kStr}e^{${kStr}x} ${plusK}`,       
                `e^x`,                                
                `${kStr}e^x`                          
            ];

            // EL FILTRE MÀGIC: Eliminem qualsevol distractor que sigui igual a la resposta correcta, 
            // i amb el 'Set' eliminem qualsevol distractor duplicat entre si.
            const validDistractors = [...new Set(allDistractors.filter(d => d !== correctTex))];

            // Ara triem 3 distractors d'aquesta llista neta
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

            const allDistractors = [
                `e^{${kStr}x}`,                       
                `${kInvStr} e^{${kStr}x}`,            
                `${kStr}x e^{${kStr}x}`,              
                `e^{${kStr}(x-1)}`,                   
                `e^{${kStr}x} ${plusK}`,              
                `${kStr}e^{${kStr}x} ${plusK}`,       
                `e^x`,                                
                `${kStr}e^x`                          
            ];

            const selectedDistractors = allDistractors.sort(() => Math.random() - 0.5).slice(0, 3);

            return {
                questionTex: `f(x) = e^{${kStr}x}`,
                correctTex: `${kStr}e^{${kStr}x}`,
                distractorsTex: selectedDistractors
            };
        }
    }
];
