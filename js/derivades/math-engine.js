/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/math-engine.js
 * ROL: Motor matemàtic pur. Generadors de coeficients K i formatadors TeX.
 * ARQUITECTURA:
 * - Capa matemàtica completament independent: no depèn de cap fitxer de la
 *   plataforma compartida (utils, config, game-core) ni del controlador DOM.
 * - Exposa window.MathEngine com a namespace explícit i net.
 * - COMPATIBILITAT FASE 1: també exposa generateK, generateFractionK i
 *   formatK com a globals directes perquè banc-preguntes.js no necessiti
 *   canvis en aquesta fase. Aquestes globals es trauran a la Fase 3.
 * - Afegeix buildKVars i buildFracKVars: consoliden lògica duplicada que
 *   ara viu dins de banc-preguntes.js. Encara no s'usen, però ja estan
 *   disponibles per a la Fase 3.
 * DEPENDÈNCIES: Requereix utils.js (randIntNonZero, pick). S'ha de carregar
 * DESPRÉS de utils.js i ABANS de banc-preguntes.js.
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

    /** CAS 2: K fraccionari p/q, simplificat, amb denominador final ≠ 1 */
    function generateFractionK() {
        const denoms = [2, 3, 4, 5];
        let q, p, common, finalDen;
        do {
            q      = pick(denoms);
            p      = randIntNonZero(-5, 5);
            common = gcd(p, q);
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

    // -------------------------------------------------------------------------
    // CONSTRUCTORS DE kVars (preparats per a Fase 3, no usats encara)
    // -------------------------------------------------------------------------

    /**
     * Construeix l'objecte kVars complet a partir d'un K enter.
     * Centralitza la lògica que ara viu duplicada dins de banc-preguntes.js.
     */
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
            kx:      kSimple === ""  ? "x"  : kSimple === "-" ? "-x"  : `${kSimple}x`,
            negKx:   negK    === ""  ? "x"  : negK    === "-" ? "-x"  : `${negK}x`,
            plusK:   plusK,
            kInv:    kInvStr
        };
    }

    /**
     * Construeix l'objecte kVars complet a partir d'un K fraccionari {num, den}.
     * Centralitza la lògica que ara viu duplicada dins de banc-preguntes.js.
     * Inclou la variant aleatòria de notació (manera1: (p/q)x, manera2: px/q).
     */
    function buildFracKVars(frac) {
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

        const isManera2 = Math.random() < 0.5;
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
            plusK:   plusK,
            kInv:    kInvStr
        };
    }

    // -------------------------------------------------------------------------
    // API PÚBLICA
    // -------------------------------------------------------------------------
    const api = { gcd, generateK, generateFractionK, formatK, buildKVars, buildFracKVars };

    // COMPATIBILITAT FASE 1: globals directes per a banc-preguntes.js
    // TODO: eliminar aquestes tres línies a la Fase 3
    window.generateK         = generateK;
    window.generateFractionK = generateFractionK;
    window.formatK           = formatK;

    return api;

})();
