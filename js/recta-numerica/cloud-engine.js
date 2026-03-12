/**
 * ============================================================================
 * PROJECTE: Recta Numèrica Doble
 * FITXER: js/recta-numerica/cloud-engine.js
 * ROL: Motor de generació del núvol de punts (temperatura vs. temps).
 * ARQUITECTURA:
 * - Capa matemàtica pura, sense DOM ni dependències externes.
 * - chooseYRange(): tria el rang de l'eix Y amb les probabilitats especificades.
 * - generateCloud(yRange): genera entre 4 i 8 punts enters, sempre incloent
 *   x=0, seguint una corba suau amb salts bruscos opcionals.
 *   Probabilitats de salt: 60% cap, 30% un, 10% dos.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
window.CloudEngine = (() => {

    function _randInt(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }
    function _clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }
    function _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * Tria el rang de l'eix Y.
     * Retorna { min, max, majorStep, minorStep, type }
     *
     * Probabilitats:
     *   80% → [-6, 6]   majorStep=1  minorStep=1
     *   10% → [-5, 20]  majorStep=5  minorStep=1
     *   10% → [-10, 40] majorStep=10 minorStep=5
     */
    function chooseYRange(level) {
        const r = Math.random();
        if (level === 1) {
            // Nivell fàcil: sempre rang petit ±6
            return { min: -6, max: 6, majorStep: 1, minorStep: 1, type: 'small' };
        }
        if (level === 2) {
            // Nivell mitjà: 80% petit, 20% mitjà, 0% gran
            if (r < 0.80) return { min: -6,  max:  6, majorStep:  1, minorStep: 1, type: 'small'  };
            return               { min: -5,  max: 20, majorStep:  5, minorStep: 1, type: 'medium' };
        }
        // Nivell 3 (difícil): probabilitats originals
        if (r < 0.80) return { min: -6,  max:  6, majorStep:  1, minorStep: 1, type: 'small'  };
        if (r < 0.90) return { min: -5,  max: 20, majorStep:  5, minorStep: 1, type: 'medium' };
        return               { min: -10, max: 40, majorStep: 10, minorStep: 5, type: 'large'  };
    }

    /**
     * Genera el núvol de punts.
     * Garanties:
     *  - Entre 4 i 8 punts, x ∈ [-5,5] enters, y ∈ [min,max] enters
     *  - x=0 sempre present, cap x repetit
     *  - Corba suau + salts bruscos opcionals
     *
     * @param   {object}               yRange  Resultat de chooseYRange()
     * @returns {Array<{x,y}>}                 Ordenat per x creixent
     */
    function generateCloud(yRange) {
        const { min, max } = yRange;
        const span = max - min;

        const count  = _randInt(4, 8);
        const otherX = _shuffle([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]).slice(0, count - 1);
        const xs     = [0, ...otherX].sort((a, b) => a - b);

        // 60% cap salt, 30% un, 10% dos
        const rj       = Math.random();
        const numJumps = rj < 0.60 ? 0 : rj < 0.90 ? 1 : 2;
        const jumpSet  = new Set(
            _shuffle(Array.from({ length: xs.length - 1 }, (_, i) => i)).slice(0, numJumps)
        );

        const smoothMax = Math.max(1, Math.round(span / 8));
        const jumpMin   = Math.max(2, Math.round(span / 4));
        const jumpMax   = Math.max(4, Math.round(span / 2));

        const margin = Math.max(1, Math.round(span * 0.15));
        let y = _randInt(min + margin, max - margin);

        const points = [];
        for (let i = 0; i < xs.length; i++) {
            points.push({ x: xs[i], y });
            if (i < xs.length - 1) {
                const delta = jumpSet.has(i)
                    ? _randInt(jumpMin, jumpMax) * (Math.random() < 0.5 ? 1 : -1)
                    : _randInt(-smoothMax, smoothMax);
                y = _clamp(y + delta, min + margin, max - margin);
            }
        }
        return points;
    }

    return { chooseYRange, generateCloud };
})();
