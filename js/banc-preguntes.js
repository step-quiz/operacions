// js/banc-preguntes.js

const questionBank = [
    {
        id: 'exp_kx_int', 
        generate: () => {
            const k = generateK();
            const kStr = formatK(k); 
            const kInvStr = k < 0 ? `-\\frac{1}{${Math.abs(k)}}` : `\\frac{1}{${k}}`;
            const plusK = k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;

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
