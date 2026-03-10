/**
 * ============================================================================
 * PROJECTE: Motor Educatiu d'Integrals (Vanilla JS)
 * FITXER: js/integrals/math-engine.js
 * ROL: Motor matemàtic pur. Generadors de coeficients i formatadors TeX.
 * ARQUITECTURA:
 * - Capa matemàtica completament independent: no depèn de cap fitxer de la
 *   plataforma compartida (utils, config, game-core) ni del controlador DOM.
 * - Exposa window.MathEngine com a namespace explícit i net.
 * FUNCIONS PRINCIPALS:
 *   formatPowerTerm(coef, exp)  → formata coef·x^exp com a LaTeX
 *   formatIntResult(a, n)       → formata el resultat de ∫a·x^n dx
 *   formatExpPrimitive(k)       → formata el resultat de ∫e^{kx} dx
 *   kxArg(k)                    → formata kx com a argument LaTeX
 * DEPENDÈNCIES: Requereix utils.js (randIntNonZero, pick). S'ha de carregar
 * DESPRÉS de utils.js i ABANS de distractor-lib.js.
 * ============================================================================
 */

window.MathEngine = (() => {

    // -------------------------------------------------------------------------
    // AUXILIAR: Màxim Comú Divisor
    // -------------------------------------------------------------------------
    function gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    // -------------------------------------------------------------------------
    // GENERADORS DE COEFICIENTS
    // -------------------------------------------------------------------------

    /** K enter genèric (distribució pedagògica, valors petits més freqüents) */
    function generateK() {
        const r = Math.random();
        if (r < 0.2) return -1;
        if (r < 0.4) return  2;
        if (r < 0.6) return -2;
        return randIntNonZero(-6, 6);
    }

    /**
     * K enter per a ∫e^{kx}: exclou k=±1.
     * Amb k=1 la primitiva és la mateixa funció (cas trivial que no entrena
     * el factor 1/k). Distribució pedagògica: valors petits més freqüents.
     *   25% → 2 | 25% → −2 | 25% → 3 | 25% → uniform ≠ 0, ≠ ±1
     */
    function generateKIntExp() {
        const r = Math.random();
        if (r < 0.25) return  2;
        if (r < 0.50) return -2;
        if (r < 0.75) return  3;
        let k;
        do { k = randIntNonZero(-5, 5); } while (Math.abs(k) === 1);
        return k;
    }

    // -------------------------------------------------------------------------
    // FORMATADORS BÀSICS
    // -------------------------------------------------------------------------

    /**
     * Formata coef·x^exp com a string LaTeX.
     *   exp=0   → just el coeficient (ex: "3", "-1")
     *   exp=1   → coef·x (ex: "2x", "-x")
     *   coef=1  → x^exp sense coeficient (ex: "x^{3}")
     *   coef=-1 → -x^exp (ex: "-x^{-2}")
     */
    function formatPowerTerm(coef, exp) {
        if (exp === 0) {
            if (coef ===  1) return '1';
            if (coef === -1) return '-1';
            return String(coef);
        }
        const xp = exp === 1 ? 'x' : `x^{${exp}}`;
        if (coef ===  1) return xp;
        if (coef === -1) return `-${xp}`;
        return `${coef}${xp}`;
    }

    /**
     * Formata kx com a argument interior LaTeX.
     *   k=1  → 'x'
     *   k=-1 → '-x'
     *   k=3  → '3x'
     */
    function kxArg(k) {
        if (k ===  1) return 'x';
        if (k === -1) return '-x';
        return `${k}x`;
    }

    // -------------------------------------------------------------------------
    // FORMATADORS D'INTEGRALS
    // -------------------------------------------------------------------------

    /**
     * Formata el resultat de ∫a·x^n dx = [a/(n+1)]·x^{n+1} com a LaTeX.
     * Simplifica la fracció a/(n+1) pel màxim comú divisor.
     * S'assegura que el denominador és sempre positiu.
     *
     * Exemples:
     *   formatIntResult(1, 3)   → '\frac{x^{4}}{4}'
     *   formatIntResult(3, 2)   → 'x^{3}'          (3/3 = 1, sense fracció)
     *   formatIntResult(2, 3)   → '\frac{x^{4}}{2}'
     *   formatIntResult(1, -2)  → '-x^{-1}'         (1/(-1) = -1)
     *   formatIntResult(1, -3)  → '-\frac{x^{-2}}{2}'
     */
    function formatIntResult(a, n) {
        const newExp = n + 1;
        const g      = gcd(Math.abs(a), Math.abs(newExp));
        const numC   = a / g;
        const denC   = newExp / g;

        // Denominador sempre positiu
        const finalNum = numC * Math.sign(denC);
        const finalDen = Math.abs(denC);

        if (finalDen === 1) {
            return formatPowerTerm(finalNum, newExp);
        } else {
            // \frac{|finalNum|·x^{newExp}}{finalDen} amb signe separat
            const numTex = formatPowerTerm(Math.abs(finalNum), newExp);
            const sign   = finalNum < 0 ? '-' : '';
            return `${sign}\\frac{${numTex}}{${finalDen}}`;
        }
    }

    /**
     * Formata el resultat de ∫e^{kx} dx = (1/k)·e^{kx} com a LaTeX.
     *   k=1  → 'e^{x}'
     *   k=-1 → '-e^{-x}'
     *   k=2  → '\frac{e^{2x}}{2}'
     *   k=-3 → '-\frac{e^{-3x}}{3}'
     */
    function formatExpPrimitive(k) {
        const argTex = kxArg(k);
        const eTex   = `e^{${argTex}}`;
        if (k ===  1) return eTex;
        if (k === -1) return `-${eTex}`;
        if (k  >  0)  return `\\frac{${eTex}}{${k}}`;
        return `-\\frac{${eTex}}{${Math.abs(k)}}`;
    }

    /**
     * Auxiliar: formata a·x^{newExp}/divisor com a LaTeX, simplificant.
     * Usat per distractor-lib per construir distractors amb divisor arbitrari.
     * Garanteix denominador positiu i simplificació pel gcd.
     */
    function fmtFraction(a, newExp, divisor) {
        if (divisor === 0) return '\\text{?}';
        const g      = gcd(Math.abs(a), Math.abs(divisor));
        const numC   = a / g;
        const denC   = divisor / g;
        const fNum   = numC * Math.sign(denC);
        const fDen   = Math.abs(denC);
        if (fDen === 1) return formatPowerTerm(fNum, newExp);
        const numTex = formatPowerTerm(Math.abs(fNum), newExp);
        const sign   = fNum < 0 ? '-' : '';
        return `${sign}\\frac{${numTex}}{${fDen}}`;
    }

    // -------------------------------------------------------------------------
    // API PÚBLICA
    // -------------------------------------------------------------------------
    return {
        gcd,
        generateK,
        generateKIntExp,
        formatPowerTerm,
        kxArg,
        formatIntResult,
        formatExpPrimitive,
        fmtFraction
    };

})();
