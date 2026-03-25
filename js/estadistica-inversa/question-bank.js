/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estadistica-inversa/question-bank.js
 * ROL: Generador de problemes inversos d'estadística descriptiva.
 *      Genera les condicions (mitjana, mediana, moda) i verifica que
 *      existeixin prou solucions abans de presentar el problema.
 * ARQUITECTURA:
 * - El generador treballa "cap enrere": primer crea un conjunt de dades
 *   vàlid, en calcula les estadístiques, i després usa findSolutions()
 *   per confirmar que existeixen almenys tantes solucions com les que
 *   el nivell requereix (1 per a nivell 1, 2 per a nivells 2-3).
 * - Nivells:
 *     1: una condició (mitjana O mediana O moda), 1 solució demanada.
 *     2: dues condicions, 2 solucions demanades.
 *     3: tres condicions (mitjana + mediana + moda), 2 solucions demanades.
 * DEPENDÈNCIES: utils.js (randInt, pick, shuffle), math-engine.js.
 * ============================================================================
 */

window.QuestionBank = (() => {

    const ME = MathEngine;
    const LO = 1, HI = 10;    // rang de notes

    // =====================================================================
    // HELPERS
    // =====================================================================

    /** Genera un conjunt de k enters aleatoris entre LO i HI. */
    function _randSet(k) {
        const arr = [];
        for (let i = 0; i < k; i++) arr.push(randInt(LO, HI));
        return arr.sort((a, b) => a - b);
    }

    /** Intenta generar un problema fins a maxTries vegades. */
    function _tryGenerate(fn, maxTries) {
        for (let i = 0; i < (maxTries || 60); i++) {
            const result = fn();
            if (result) return result;
        }
        return null;
    }

    // =====================================================================
    // NIVELL 1: UNA CONDICIÓ, 1 SOLUCIÓ
    // =====================================================================

    function genLevel1() {
        const type = pick(['mean', 'median', 'mode']);

        if (type === 'mean') return _genMeanOnly();
        if (type === 'median') return _genMedianOnly();
        return _genModeOnly();
    }

    function _genMeanOnly() {
        return _tryGenerate(() => {
            const k = pick([3, 4]);
            const targetMean = pick([3, 4, 5, 5.5, 6, 6.5, 7, 7.5, 8]);
            const conds = { mean: targetMean };
            const sols = ME.findSolutions(k, LO, HI, conds, 5);
            if (sols.length < 3) return null;  // volem que sigui fàcil

            return {
                k, conditions: conds, solutionsNeeded: 1,
                condLabels: [`Mitjana = ${ME.fmtCondensed(targetMean)}`],
                prompt: `Proposa <strong>${k} nombres enters</strong>, entre ${LO} i ${HI}, de manera que<br>la mitjana aritmètica valgui <strong>${ME.fmtCondensed(targetMean)}</strong>.`,
                hint: `La mitjana, en el nostre cas, és la suma dels nombres dividida entre ${k}. Per tant, cal que la suma dels nombres sigui ${ME.fmtCondensed(targetMean * k)}.`,
                _exampleSol: pick(sols),
            };
        });
    }

    function _genMedianOnly() {
        return _tryGenerate(() => {
            const k = pick([3, 5]);
            const targetMedian = randInt(3, 8);
            const conds = { median: targetMedian };
            const sols = ME.findSolutions(k, LO, HI, conds, 5);
            if (sols.length < 5) return null;

            const posText = k === 3
                ? 'el segon valor (el del mig) un cop ordenats'
                : 'el tercer valor (el del mig) un cop ordenats';

            return {
                k, conditions: conds, solutionsNeeded: 1,
                condLabels: [`Mediana = ${targetMedian}`],
                prompt: `Proposa <strong>${k} nombres enters</strong>, entre ${LO} i ${HI}, de manera que la mediana valgui <strong>${targetMedian}</strong>.`,
                hint: `La mediana és el valor central de les dades, un cop ordenades de petita a gran.`,
                _exampleSol: pick(sols),
            };
        });
    }

    function _genModeOnly() {
        return _tryGenerate(() => {
            const k = 5;
            const targetMode = randInt(3, 8);
            const conds = { mode: targetMode };
            const sols = ME.findSolutions(k, LO, HI, conds, 5);
            if (sols.length < 5) return null;

            return {
                k, conditions: conds, solutionsNeeded: 1,
                condLabels: [`Moda = ${targetMode}`],
                prompt: `Proposa <strong>${k} nombres enters</strong>, entre ${LO} i ${HI}, de manera que la moda valgui <strong>${targetMode}</strong>.`,
                hint: `La moda és el valor que apareix més vegades. El valor ${targetMode} ha d'aparèixer almenys 2 cops, i cap altre valor pot aparèixer més vegades que ell.`,
                _exampleSol: pick(sols),
            };
        });
    }

    // =====================================================================
    // NIVELL 2: DUES CONDICIONS, 2 SOLUCIONS
    // =====================================================================

    function genLevel2() {
        const type = pick(['mean_median', 'mean_mode', 'median_mode']);

        if (type === 'mean_median') return _genMeanMedian();
        if (type === 'mean_mode')   return _genMeanMode();
        return _genMedianMode();
    }

    function _genMeanMedian() {
        return _tryGenerate(() => {
            const k = pick([4, 5]);
            const seed = _randSet(k);
            const targetMean   = Math.round(ME.mean(seed) * 2) / 2;  // arrodoneix a .5
            const targetMedian = ME.median(seed);
            if (!Number.isInteger(targetMedian) && targetMedian % 0.5 !== 0) return null;

            const conds = { mean: targetMean, median: targetMedian };
            const sols = ME.findSolutions(k, LO, HI, conds, 3);
            if (sols.length < 2) return null;

            return {
                k, conditions: conds, solutionsNeeded: 1,
                condLabels: [`Mitjana = ${ME.fmtCondensed(targetMean)}`, `Mediana = ${ME.fmtCondensed(targetMedian)}`],
                prompt: `Proposa <strong>${k} nombres enters</strong>, entre ${LO} i ${HI}, de manera que<br>la mitjana valgui <strong>${ME.fmtCondensed(targetMean)}</strong> i la mediana valgui <strong>${ME.fmtCondensed(targetMedian)}</strong>.`,
                hint: `La suma dels ${k} nombres ha de ser ${ME.fmtCondensed(targetMean * k)}. A més, la mediana és el valor central de les dades, un cop ordenades de petita a gran.`,
                _exampleSol: sols[0],
            };
        });
    }

    function _genMeanMode() {
        return _tryGenerate(() => {
            const k = 5;
            const seed = _randSet(k);
            // Forcem una moda
            seed[randInt(0, k - 2)] = seed[randInt(1, k - 1)];
            seed.sort((a, b) => a - b);

            const m = ME.mode(seed);
            if (!m || m.length !== 1) return null;
            const targetMode = m[0];
            const targetMean = Math.round(ME.mean(seed) * 2) / 2;

            const conds = { mean: targetMean, mode: targetMode };
            const sols = ME.findSolutions(k, LO, HI, conds, 3);
            if (sols.length < 2) return null;

            return {
                k, conditions: conds, solutionsNeeded: 1,
                condLabels: [`Mitjana = ${ME.fmtCondensed(targetMean)}`, `Moda = ${targetMode}`],
                prompt: `Proposa <strong>${k} nombres enters</strong>, entre ${LO} i ${HI}, de manera que<br>la mitjana valgui <strong>${ME.fmtCondensed(targetMean)}</strong> i la moda valgui <strong>${targetMode}</strong>.`,
                hint: `La suma dels ${k} nombres ha de ser ${ME.fmtCondensed(targetMean * k)}. A més, la moda és el valor que apareix més vegades: el ${targetMode} ha d'aparèixer més que cap altre.`,
                _exampleSol: sols[0],
            };
        });
    }

    function _genMedianMode() {
        return _tryGenerate(() => {
            const k = 5;
            const seed = _randSet(k);
            seed[randInt(0, k - 2)] = seed[randInt(1, k - 1)];
            seed.sort((a, b) => a - b);

            const m = ME.mode(seed);
            if (!m || m.length !== 1) return null;
            const targetMode   = m[0];
            const targetMedian = ME.median(seed);

            const conds = { median: targetMedian, mode: targetMode };
            const sols = ME.findSolutions(k, LO, HI, conds, 3);
            if (sols.length < 2) return null;

            return {
                k, conditions: conds, solutionsNeeded: 1,
                condLabels: [`Mediana = ${ME.fmtCondensed(targetMedian)}`, `Moda = ${targetMode}`],
                prompt: `Proposa <strong>${k} nombres enters</strong>, entre ${LO} i ${HI}, de manera que la mediana valgui <strong>${ME.fmtCondensed(targetMedian)}</strong> i la moda valgui <strong>${targetMode}</strong>.`,
                hint: `La mediana és el valor central de les dades, un cop ordenades de petita a gran. A més, el ${targetMode} ha d'aparèixer almenys 2 cops (més que cap altre valor).`,
                _exampleSol: sols[0],
            };
        });
    }

    // =====================================================================
    // NIVELL 3: TRES CONDICIONS, 2 SOLUCIONS
    // =====================================================================

    function genLevel3() {
        return _tryGenerate(() => {
            const k = 5;
            const seed = _randSet(k);
            // Forcem una moda clara
            const modeVal = seed[randInt(1, 3)];
            const modeIdx = randInt(0, k - 1);
            if (seed[modeIdx] !== modeVal) seed[modeIdx] = modeVal;
            seed.sort((a, b) => a - b);

            const m = ME.mode(seed);
            if (!m || m.length !== 1) return null;
            const targetMode   = m[0];
            const targetMedian = ME.median(seed);
            const targetMean   = Math.round(ME.mean(seed) * 2) / 2;

            const conds = { mean: targetMean, median: targetMedian, mode: targetMode };
            const sols = ME.findSolutions(k, LO, HI, conds, 3);
            if (sols.length < 2) return null;

            return {
                k, conditions: conds, solutionsNeeded: 1,
                condLabels: [
                    `Mitjana = ${ME.fmtCondensed(targetMean)}`,
                    `Mediana = ${ME.fmtCondensed(targetMedian)}`,
                    `Moda = ${targetMode}`,
                ],
                prompt: `Proposa <strong>${k} nombres enters</strong>, entre ${LO} i ${HI}, de manera que<br>la mitjana valgui <strong>${ME.fmtCondensed(targetMean)}</strong>, la mediana valgui <strong>${ME.fmtCondensed(targetMedian)}</strong> i la moda valgui <strong>${targetMode}</strong>.`,
                hint: `La suma dels ${k} nombres ha de ser ${ME.fmtCondensed(targetMean * k)}. La mediana és el valor central de les dades, un cop ordenades de petita a gran. La moda és el valor que apareix més vegades: el ${targetMode} ha d'aparèixer més que cap altre.`,
                _exampleSol: sols[0],
            };
        }, 100);
    }

    // =====================================================================
    // SELECTOR PER NIVELL
    // =====================================================================

    const levelGenerators = {
        1: genLevel1,
        2: genLevel2,
        3: genLevel3,
    };

    // ── Estat de sessió ──────────────────────────────────────────────────
    // Guarda la "signatura" de cada pregunta generada per evitar repeticions,
    // i el tipus de l'última pregunta per aplicar la penalització consecutiva.
    //
    // Signatura de nivell 1: "mean:6", "median:5", "mode:4"
    // Signatura de nivells 2-3: clau JSON de les condicions, p.ex. '{"mean":6,"median":5}'
    let _sessionSigs  = [];   // signatures de totes les preguntes d'aquesta sessió
    let _lastType     = null; // tipus (mean / median / mode) de l'última pregunta (només nivell 1)

    function resetSession() {
        _sessionSigs = [];
        _lastType    = null;
    }

    // ── Selector de tipus per a nivell 1 amb distribució i anti-consecutiu ─
    //
    // Distribució base:  mean 40 %  ·  median 40 %  ·  mode 20 %
    //
    // Anti-consecutiu: volem que P(t → t) = BASE[t]² / 2
    // és a dir, P(t | prev = t) = BASE[t] / 2.
    //
    // Condició matemàtica:
    //   BASE[t] · f_t / (BASE[t] · f_t + sumOthers_t) = BASE[t] / 2
    //   ⟹  f_t = sumOthers_t / (2 − BASE[t])
    //
    // Factors resolts:
    //   f_mean   = 0.60 / 1.60 = 0.375
    //   f_median = 0.60 / 1.60 = 0.375
    //   f_mode   = 0.80 / 1.80 ≈ 0.444
    //
    // Verificació: P(mean→mean) = 0.4 × 0.20 = 0.08  ✓
    //              P(mode→mode) = 0.2 × 0.10 = 0.02  ✓
    const _ANTI_CONSEC_FACTOR = { mean: 0.375, median: 0.375, mode: 0.4444 };

    function _pickLevel1Type() {
        const BASE = { mean: 0.40, median: 0.40, mode: 0.20 };
        const types = ['mean', 'median', 'mode'];
        const weights = types.map(t =>
            t === _lastType ? BASE[t] * _ANTI_CONSEC_FACTOR[t] : BASE[t]
        );
        const total = weights.reduce((s, w) => s + w, 0);
        let r = Math.random() * total;
        for (let i = 0; i < types.length; i++) {
            r -= weights[i];
            if (r <= 0) return types[i];
        }
        return types[types.length - 1];
    }

    // ── Genera la signatura d'un challenge ──────────────────────────────
    function _sig(ch) {
        // Per a nivell 1 la signatura inclou el tipus i el valor objectiu.
        // Per als altres nivells, les condicions completes (JSON ordenat).
        const keys = Object.keys(ch.conditions).sort();
        return keys.map(k => `${k}:${ch.conditions[k]}`).join('|');
    }

    // ── generateChallenge principal ──────────────────────────────────────
    function generateChallenge() {
        const raw = new URLSearchParams(window.location.search).get('nivell');
        const lvl = (raw && levelGenerators[raw]) ? parseInt(raw) : 1;

        const MAX_OUTER = 40; // intents per trobar un challenge no repetit
        let ch = null;

        for (let attempt = 0; attempt < MAX_OUTER; attempt++) {
            let candidate = null;

            if (lvl === 1) {
                // Tria el tipus amb distribució ponderada i anti-consecutiu
                const type = _pickLevel1Type();
                if      (type === 'mean')   candidate = _genMeanOnly();
                else if (type === 'median') candidate = _genMedianOnly();
                else                        candidate = _genModeOnly();

                if (!candidate) continue;

                // Comprova que no sigui signatura repetida a la sessió
                const s = _sig(candidate);
                if (_sessionSigs.includes(s)) continue;

                // Acceptat: desa l'estat
                _sessionSigs.push(s);
                _lastType = type;
                ch = candidate;
                break;

            } else {
                // Nivells 2-3: genera directament i comprova no-repetició
                candidate = levelGenerators[lvl]();
                if (!candidate) {
                    // Fallback a nivell inferior
                    candidate = lvl > 1 ? levelGenerators[lvl - 1]() : null;
                }
                if (!candidate) continue;

                const s = _sig(candidate);
                if (_sessionSigs.includes(s)) continue;

                _sessionSigs.push(s);
                ch = candidate;
                break;
            }
        }

        // Últim recurs: si no hem trobat res, genera sense restricció
        if (!ch) {
            ch = _genMeanOnly() || _genMedianOnly() || _genModeOnly();
        }

        ch.level = lvl;
        return ch;
    }

    return { generateChallenge, resetSession };

})();
