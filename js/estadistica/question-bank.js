/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estadistica/question-bank.js
 * ROL: Generadors de conjunts de dades realistes per a alumnes de 14 anys.
 *      8 tipus: 4 discrets (taula directa) + 4 continus (intervals).
 * ARQUITECTURA:
 * - Cada generador retorna:
 *     { type: 'discrete'|'grouped', label, unit, data, context,
 *       tableData (precomputed), intervalOptions? }
 * - Selector per URL: ?tipus=calcatN (on N=1..8). Si absent, aleatori.
 * DEPENDÈNCIES: utils.js (randInt, pick, shuffle), math-engine.js.
 * ============================================================================
 */

window.QuestionBank = (() => {

    const ME = MathEngine;
    const N_MIN = 8;
    const N_MAX = 12;

    // =====================================================================
    // HELPERS DE GENERACIÓ
    // =====================================================================

    /** Genera N valors seguint una distribució discreta ponderada. */
    function weightedSample(n, weights) {
        // weights = [{val, w}, ...], w relatiu
        const totalW = weights.reduce((s, e) => s + e.w, 0);
        const result = [];
        for (let i = 0; i < n; i++) {
            let r = Math.random() * totalW, cum = 0;
            for (const e of weights) {
                cum += e.w;
                if (r <= cum) { result.push(e.val); break; }
            }
        }
        return result;
    }

    /** Genera N valors enters amb distribució aprox. normal (sum of uniforms). */
    function normalIntSample(n, mean, sd, min, max) {
        const result = [];
        for (let i = 0; i < n; i++) {
            // Suma de 6 uniformes → aprox normal
            let sum = 0;
            for (let j = 0; j < 6; j++) sum += Math.random();
            let val = Math.round(mean + sd * (sum - 3));
            val = Math.max(min, Math.min(max, val));
            result.push(val);
        }
        return result;
    }

    /** Genera N valors reals amb distribució aprox. normal. */
    function normalRealSample(n, mean, sd, min, max, decimals) {
        const result = [];
        const factor = Math.pow(10, decimals || 0);
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < 6; j++) sum += Math.random();
            let val = mean + sd * (sum - 3);
            val = Math.max(min, Math.min(max, val));
            val = Math.round(val * factor) / factor;
            result.push(val);
        }
        return result;
    }

    // =====================================================================
    // TIPUS 1-4: DADES DISCRETES
    // =====================================================================

    function genCalcat() {
        const N = randInt(N_MIN, N_MAX);
        const data = normalIntSample(N, 39, 1.8, 35, 44);
        return {
            type: 'discrete', label: 'Número de calçat', unit: '',
            context: `S'ha preguntat el número de calçat a ${N} alumnes de 3r d'ESO. Aquí tens les dades recollides:`,
            data
        };
    }

    function genGermans() {
        const N = randInt(N_MIN, N_MAX);
        const weights = [
            { val: 0, w: 15 }, { val: 1, w: 40 }, { val: 2, w: 30 },
            { val: 3, w: 12 }, { val: 4, w: 3 }
        ];
        const data = weightedSample(N, weights);
        return {
            type: 'discrete', label: 'Nombre de germans', unit: '',
            context: `S'ha preguntat a ${N} alumnes de la classe quants germans tenen. Aquí tens les respostes:`,
            data
        };
    }

    function genNota() {
        const N = randInt(N_MIN, N_MAX);
        const weights = [
            { val: 1, w: 2 }, { val: 2, w: 4 }, { val: 3, w: 8 },
            { val: 4, w: 12 }, { val: 5, w: 18 }, { val: 6, w: 20 },
            { val: 7, w: 16 }, { val: 8, w: 10 }, { val: 9, w: 6 }, { val: 10, w: 4 }
        ];
        const data = weightedSample(N, weights);
        return {
            type: 'discrete', label: 'Nota de l\'examen', unit: '',
            context: `Les notes d'un examen de matemàtiques de ${N} alumnes han estat:`,
            data
        };
    }

    function genSon() {
        const N = randInt(N_MIN, N_MAX);
        const weights = [
            { val: 6, w: 8 }, { val: 7, w: 20 }, { val: 8, w: 35 },
            { val: 9, w: 25 }, { val: 10, w: 10 }, { val: 11, w: 2 }
        ];
        const data = weightedSample(N, weights);
        return {
            type: 'discrete', label: 'Hores de son', unit: 'h',
            context: `S'ha preguntat a ${N} alumnes quantes hores dormen cada nit. Les respostes han estat:`,
            data
        };
    }

    // =====================================================================
    // TIPUS 5-8: DADES CONTÍNUES (agrupades per intervals)
    // =====================================================================

    function genMinuts() {
        const N = randInt(N_MIN, N_MAX);
        const data = normalRealSample(N, 18, 8, 3, 43, 0);
        return {
            type: 'grouped', label: 'Minuts per arribar a l\'institut', unit: 'min',
            context: `S'ha mesurat el temps (en minuts) que triguen ${N} alumnes a arribar a l'institut:`,
            data,
            intervalOptions: [
                { label: 'Intervals de 10 min', limits: [0, 10, 20, 30, 40, 50] },
                { label: 'Intervals de 15 min', limits: [0, 15, 30, 45] },
            ]
        };
    }

    function genAlcada() {
        const N = randInt(N_MIN, N_MAX);
        const data = normalRealSample(N, 163, 7, 147, 183, 1);
        return {
            type: 'grouped', label: 'Alçada', unit: 'cm',
            context: `S'ha mesurat l'alçada (en cm) de ${N} alumnes de 3r d'ESO:`,
            data,
            intervalOptions: [
                { label: 'Intervals de 5 cm', limits: [145, 150, 155, 160, 165, 170, 175, 180, 185] },
                { label: 'Intervals de 8 cm', limits: [145, 153, 161, 169, 177, 185] },
            ]
        };
    }

    function genPes() {
        const N = randInt(N_MIN, N_MAX);
        const data = normalRealSample(N, 55, 8, 38, 78, 1);
        return {
            type: 'grouped', label: 'Pes', unit: 'kg',
            context: `S'ha mesurat el pes (en kg) de ${N} alumnes de la classe:`,
            data,
            intervalOptions: [
                { label: 'Intervals de 8 kg', limits: [36, 44, 52, 60, 68, 76, 84] },
                { label: 'Intervals de 10 kg', limits: [35, 45, 55, 65, 75, 85] },
            ]
        };
    }

    function genPulsacions() {
        const N = randInt(N_MIN, N_MAX);
        const data = normalRealSample(N, 74, 9, 52, 98, 0);
        return {
            type: 'grouped', label: 'Pulsacions en repòs', unit: 'ppm',
            context: `S'han mesurat les pulsacions per minut en repòs de ${N} alumnes:`,
            data,
            intervalOptions: [
                { label: 'Intervals de 10 ppm', limits: [50, 60, 70, 80, 90, 100] },
                { label: 'Intervals de 15 ppm', limits: [50, 65, 80, 95, 110] },
            ]
        };
    }

    // =====================================================================
    // REGISTRE I SELECTOR
    // =====================================================================

    const generators = {
        'calcat': genCalcat, 'germans': genGermans, 'nota': genNota, 'son': genSon,
        'minuts': genMinuts, 'alcada': genAlcada, 'pes': genPes, 'pulsacions': genPulsacions,
    };

    const discreteIds  = ['calcat', 'germans', 'nota', 'son'];
    const groupedIds   = ['minuts', 'alcada', 'pes', 'pulsacions'];
    const allIds       = [...discreteIds, ...groupedIds];

    function generateDataset() {
        const raw = new URLSearchParams(window.location.search).get('tipus');
        const id = (raw && generators[raw]) ? raw : pick(allIds);
        const ds = generators[id]();
        ds.id = id;
        return ds;
    }

    function resetSession() { /* no-op per compatibilitat */ }

    return { generateDataset, resetSession, generators, allIds };

})();
