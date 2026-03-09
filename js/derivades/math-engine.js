/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/math-engine.js
 * ROL: Motor matemàtic pur. Generadors de coeficients K i formatadors TeX.
 * ARQUITECTURA:
 * - Capa matemàtica completament independent: no depèn de cap fitxer de la
 *   plataforma compartida (utils, config, game-core) ni del controlador DOM.
 * - Exposa window.MathEngine com a namespace explícit i net.
 * - FASE 5: Afegit formatPowerTerm(coef, exp) per formatar coef·x^exp com
 *   a string LaTeX. Usat per distractor-lib.js i question-bank.js per a
 *   la nova família de la regla de la potència.
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
    // GENERADORS DE LA CONSTANT K
    // -------------------------------------------------------------------------

    /** CAS 1: K enter, distribució pedagògica (valors petits més freqüents) */
    function generateK() {
        const r = Math.random();
        if (r < 0.2) return -1;
        if (r < 0.4) return  2;
        if (r < 0.6) return -2;
        return randIntNonZero(-6, 6);
    }

    /**
     * CAS 1b: K enter per a la família e^{kx}, exclou k=±1.
     * Amb k=1 la derivada és la mateixa funció (trivial); amb k=−1 la regla
     * de la cadena és invisible per a l'alumne. Tots dos casos s'eliminen.
     * Distribució pedagògica: valors petits més freqüents.
     *   25% → 2 | 25% → −2 | 25% → 3 | 25% → uniform ≠ 0, ≠ ±1
     */
    function generateKExp() {
        const r = Math.random();
        if (r < 0.25) return  2;
        if (r < 0.50) return -2;
        if (r < 0.75) return  3;
        let k;
        do { k = randIntNonZero(-6, 6); } while (Math.abs(k) === 1);
        return k;
    }

    /** CAS 2: K fraccionari p/q, simplificat, amb denominador final ≠ 1 */
    function generateFractionK() {
        const denoms = [2, 3, 4, 5];
        let q, p, common, finalDen;
        do {
            q        = pick(denoms);
            p        = randIntNonZero(-5, 5);
            common   = gcd(p, q);
            finalDen = q / common;
        } while (finalDen === 1);
        return { num: p / common, den: finalDen };
    }

    // -------------------------------------------------------------------------
    // FORMATADORS TEX
    // -------------------------------------------------------------------------

    /**
     * Formata un K enter com a string per a TeX.
     * k=1  → ""   (coeficient invisible)
     * k=-1 → "-"  (només signe)
     * k=3  → "3"
     */
    function formatK(k) {
        if (k ===  1) return "";
        if (k === -1) return "-";
        return k.toString();
    }

    /**
     * Formata coef·x^exp com a string LaTeX.
     * Casos especials gestionats:
     *   exp=0          → just el coeficient (ex: "3", "-1")
     *   exp=1          → coef·x (ex: "2x", "-x")
     *   coef=1         → x^exp sense coeficient (ex: "x^{3}")
     *   coef=-1        → -x^exp (ex: "-x^{-2}")
     * Usat per a la regla de la potència i els seus distractors.
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

    // -------------------------------------------------------------------------
    // FORMATADORS COMPARTITS (usats per distractor-lib.js i question-bank.js)
    // Font única: elimina la duplicació entre els dos fitxers clients.
    // -------------------------------------------------------------------------

    /** "ax+b" → p.ex. 'x', '-x', '2x', '2x+3', '-x-1' */
    function fmtLinear(a, b) {
        const aPart = a ===  1 ? 'x' : a === -1 ? '-x' : `${a}x`;
        if (b === 0) return aPart;
        return `${aPart}${b > 0 ? `+${b}` : b}`;
    }

    /** "x²+bx+c" → p.ex. 'x^2', 'x^2+3x', 'x^2-2x+1', 'x^2-x+2' */
    function fmtPoly2(b, c) {
        let s = 'x^2';
        if (b !== 0) {
            if      (b ===  1) s += '+x';
            else if (b === -1) s += '-x';
            else               s += b > 0 ? `+${b}x` : `${b}x`;
        }
        if (c !== 0) s += c > 0 ? `+${c}` : `${c}`;
        return s;
    }

    /** Derivada de x²+bx+c → "2x+b" → p.ex. '2x', '2x+1', '2x-3' */
    function fmtPoly2Deriv(b) {
        if (b === 0)  return '2x';
        if (b === 1)  return '2x+1';
        if (b === -1) return '2x-1';
        return b > 0 ? `2x+${b}` : `2x${b}`;
    }

    /** Constant enter com a string LaTeX: 1→'1', -1→'-1', 3→'3' */
    function fmtConst(a) {
        if (a ===  1) return '1';
        if (a === -1) return '-1';
        return String(a);
    }

    /** kx com a argument LaTeX: 1→'x', -1→'-x', 3→'3x' */
    function kxArg(k) {
        if (k ===  1) return 'x';
        if (k === -1) return '-x';
        return `${k}x`;
    }

    /** k·fn(arg) com a LaTeX: 1→'\\fn(arg)', -1→'-\\fn(arg)', k→'k\\fn(arg)' */
    function trigTerm(k, fn, arg) {
        const fnArg = `\\${fn}(${arg})`;
        if (k ===  1) return fnArg;
        if (k === -1) return `-${fnArg}`;
        return `${k}${fnArg}`;
    }

    /**
     * Determina si cal envolicar tex entre parèntesis analitzant la
     * profunditat de claus LaTeX. Evita falsos positius quan els operadors
     * + o − apareixen dins \frac{}{} o altres entorns amb claus.
     * Exemples:
     *   '2x+3'           → '(2x+3)'          ← + a profunditat 0
     *   '2x'             → '2x'               ← cap operador a prof 0
     *   '-x'             → '-x'               ← - a posició 0, no infix
     *   '2x-1'           → '(2x-1)'           ← - infix a profunditat 0
     *   '\\frac{x+1}{2}' → '\\frac{x+1}{2}'  ← + dins claus, prof > 0
     */
    function wrapIfNeeded(tex) {
        let depth = 0;
        for (let i = 0; i < tex.length; i++) {
            const c = tex[i];
            if (c === '{') { depth++; continue; }
            if (c === '}') { depth--; continue; }
            if (depth === 0) {
                if (c === '+') return `(${tex})`;
                if (c === '-' && i > 0) return `(${tex})`;
            }
        }
        return tex;
    }

    /**
     * Formata pDeriv·fn(arg) com a LaTeX.
     * Posa parèntesis al factor si wrapIfNeeded ho determina.
     * p.ex. polyCoefTrig('2x+3','cos','x^2+3x+1') → '(2x+3)\\cos(x^2+3x+1)'
     */
    function polyCoefTrig(pDeriv, fn, arg) {
        return `${wrapIfNeeded(pDeriv)}\\${fn}(${arg})`;
    }

    // -------------------------------------------------------------------------
    // CONSTRUCTORS DE kVars (per a h(x) = kx)
    // -------------------------------------------------------------------------

    /** Construeix kVars complet a partir d'un K enter. */
    function buildKVars(k) {
        const kSimple = formatK(k);
        const negK    = formatK(-k);
        const kInvStr = k ===  1 ? ""
                      : k === -1 ? "-"
                      : k  <  0  ? `-\\frac{1}{${Math.abs(k)}}`
                      :             `\\frac{1}{${k}}`;
        const plusK   = k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;

        return {
            coef:    kSimple,
            negCoef: negK,
            kx:      kSimple === "" ? "x" : kSimple === "-" ? "-x" : `${kSimple}x`,
            negKx:   negK    === "" ? "x" : negK    === "-" ? "-x" : `${negK}x`,
            plusK,
            kInv:    kInvStr
        };
    }

    /**
     * Construeix kVars complet a partir d'un K fraccionari {num, den}.
     * @param {object}  frac          - { num, den } fracció simplificada
     * @param {boolean} [useInline]   - Si true, usa estil "px/q"; si false, "\frac{p}{q}x".
     *                                  Per defecte aleatori (compatibilitat enrere).
     */
    function buildFracKVars(frac, useInline) {
        const p    = frac.num;
        const q    = frac.den;
        const absP = Math.abs(p);
        const sign = p < 0 ? "-" : "";

        const kCoefStr    = p < 0 ? `-\\frac{${absP}}{${q}}` : `\\frac{${absP}}{${q}}`;
        const negKCoefStr = p < 0 ?  `\\frac{${absP}}{${q}}` : `-\\frac{${absP}}{${q}}`;
        const kInvStr     = absP === 1
            ? (p < 0 ? `-${q}` : `${q}`)
            : (p < 0 ? `-\\frac{${q}}{${absP}}` : `\\frac{${q}}{${absP}}`);
        const plusK = p > 0 ? `+ ${kCoefStr}` : kCoefStr;

        // useInline: true → "px/q", false → "\frac{p}{q}x"
        // Si no s'especifica, es tria aleatòriament per compatibilitat enrere.
        const isManera2 = useInline !== undefined ? useInline : Math.random() < 0.5;
        let kxStr, negKxStr;
        if (isManera2) {
            const pxStr = absP === 1 ? "x" : `${absP}x`;
            kxStr    = `${sign}\\frac{${pxStr}}{${q}}`;
            negKxStr = p < 0 ? `\\frac{${pxStr}}{${q}}` : `-\\frac{${pxStr}}{${q}}`;
        } else {
            kxStr    = `${kCoefStr}x`;
            negKxStr = `${negKCoefStr}x`;
        }

        return {
            coef:    kCoefStr,
            negCoef: negKCoefStr,
            kx:      kxStr,
            negKx:   negKxStr,
            plusK,
            kInv:    kInvStr
        };
    }

    // -------------------------------------------------------------------------
    // API PÚBLICA
    // -------------------------------------------------------------------------
    return {
        gcd,
        generateK, generateKExp, generateFractionK,
        formatK, formatPowerTerm,
        fmtLinear, fmtPoly2, fmtPoly2Deriv, fmtConst,
        kxArg, trigTerm, wrapIfNeeded, polyCoefTrig,
        buildKVars, buildFracKVars
    };

})();
