// js/derivades.js

/**
 * =========================================================================
 * FUNCIONS MATEMÀTIQUES AUXILIARS
 * =========================================================================
 */

// Tria un element a l'atzar d'una matriu
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Calcula el Màxim Comú Divisor (MCD) per simplificar fraccions
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

/**
 * =========================================================================
 * GENERADORS DE LA CONSTANT K (Amb probabilitats estadístiques)
 * =========================================================================
 */

// CAS 1: Generador per a K enter
function generateK() {
    const r = Math.random();
    
    // Franges de probabilitat per forçar escenaris conflictius
    if (r < 0.2) return -1; // 20% de probabilitat
    if (r < 0.4) return 2;  // 20% de probabilitat
    if (r < 0.6) return -2; // 20% de probabilitat
    
    // 40% restant: valors amb valor absolut < 7.
    // Excloem el 0, l'1, i els que ja tenen probabilitat fixa (-1, 2, -2).
    const altres = [-6, -5, -4, -3, 3, 4, 5, 6];
    return pickRandom(altres);
}

// CAS 2: Generador per a K fracció (K = a/b)
function generateFractionK() {
    let a, b;
    
    do {
        // 1. Generem el numerador 'a'
        const rA = Math.random();
        if (rA < 0.3) {
            a = 1;         // 30%
        } else if (rA < 0.6) {
            a = -1;        // 30%
        } else {
            // 40% restant. Excloem 0, 1 i -1
            const altresA = [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]; 
            a = pickRandom(altresA);
        }

        // 2. Generem el denominador 'b'
        const rB = Math.random();
        if (rB < 0.3) {
            b = 2;         // 30%
        } else if (rB < 0.6) {
            b = -2;        // 30%
        } else {
            // 40% restant. Excloem 0, 1, -1 (per no generar enters), 2 i -2
            const altresB = [-6, -5, -4, -3, 3, 4, 5, 6]; 
            b = pickRandom(altresB);
        }
        
    } while (gcd(a, b) !== 1); // Rebutgem i tornem a tirar si no és irreduïble

    // Normalitzem el signe: passem el negatiu al numerador perquè el denominador 
    // sigui sempre positiu (evita problemes visuals en formatar el LaTeX)
    if (b < 0) {
        a = -a;
        b = -b;
    }

    // Retornem l'objecte complet amb la propietat 'tex' ja precalculada per comoditat
    return { 
        num: a, 
        den: b, 
        tex: a < 0 ? `-\\frac{${Math.abs(a)}}{${b}}` : `\\frac{${a}}{${b}}` 
    };
}

/**
 * =========================================================================
 * FORMATADORS DE TEXT LaTeX
 * =========================================================================
 */

// Formata un nombre enter per al LaTeX (evita escriure "1x", "-1x")
function formatK(k) {
    if (k === 1) return "";
    if (k === -1) return "-";
    return k.toString();
}
