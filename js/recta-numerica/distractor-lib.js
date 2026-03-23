/**
 * ============================================================================
 * PROJECTE: Recta Numèrica Doble
 * FITXER: js/recta-numerica/distractor-lib.js
 * ROL: Generació de distractors per a cada tipologia de pregunta.
 *
 * ARQUITECTURA DE NIVELLS (paràmetre `level` de 1 a 3):
 *   Nivell 1 (simple)  → errors grans i obvis (signe oposat, diferència gran)
 *   Nivell 2 (mitjà)   → errors moderats (valor d'un altre dia, confusió temporal)
 *   Nivell 3 (elaborat)→ errors subtils (±1 grau, direcció gairebé idèntica)
 *
 * API pública:
 *   buildDirectRead(correctY, cloud, yRange, questionX, level) → [y, y, y]
 *   buildCountOptions(correctCount)                            → [{count,label,isCorrect}×4]
 *   buildFrases(cloud, level)                                  → [{text,isCorrect}×4]
 *
 * DEPENDÈNCIES: strings.js
 * ============================================================================
 */
window.DistractorLib = (() => {

    const S = Strings;

    // ---- UTILITATS PRIVADES --------------------------------------------------

    function _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function _pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Elimina duplicats i l'element correcte d'un array de valors
    function _dedup(arr, exclude) {
        const seen = new Set([exclude]);
        return arr.filter(v => {
            if (seen.has(v)) return false;
            seen.add(v);
            return true;
        });
    }

    // =========================================================================
    // Q1 / Q2 — lectura directa d'un punt
    // =========================================================================
    /**
     * Retorna exactament 3 valors y incorrectes com a distractors.
     *
     * Estratègia per nivell:
     *  1 → valors enters propers (±1, ±2, ±3) que NO existeixin al núvol per al mateix x
     *  2 → valors y d'altres punts del núvol
     *  3 → valors y dels punts adjacents al dia demanat (confusió ±1 dia)
     *
     * @param {number}   correctY   Valor y correcte
     * @param {object[]} cloud      Tots els punts {x, y}
     * @param {object}   yRange     { min, max, minorStep, type }
     * @param {number}   questionX  L'x de la pregunta (excloem el seu propi punt)
     * @param {number}   level      1 | 2 | 3
     * @returns {number[]}          Array de 3 valors y incorrectes
     */
    function buildDirectRead(correctY, cloud, yRange, questionX, level) {
        const { min, max, minorStep } = yRange;
        const step = minorStep;   // unitat de salt per al nivell 1 i fallback

        const candidates = [];

        if (level === 3) {
            // Prioritat: valors y dels punts adjacents en x
            const adjX = [questionX - 1, questionX + 1, questionX - 2, questionX + 2]
                .filter(ax => ax >= -5 && ax <= 5);
            _shuffle(adjX).forEach(ax => {
                const pt = cloud.find(p => p.x === ax);
                if (pt) candidates.push(pt.y);
            });
        }

        if (level >= 2) {
            // Valors y d'altres punts del núvol (qualsevol x ≠ questionX)
            _shuffle(cloud.filter(p => p.x !== questionX)).forEach(p => candidates.push(p.y));
        }

        // Valors propers al correcte (sempre com a fallback)
        for (let d = step; candidates.length < 8; d += step) {
            if (correctY + d <= max) candidates.push(correctY + d);
            if (correctY - d >= min) candidates.push(correctY - d);
            if (d > 20 * step) break;   // evita bucle infinit
        }

        // Netejar i retornar 3
        const valid = _dedup(candidates, correctY).filter(v => v >= min && v <= max);
        return _shuffle(valid).slice(0, 3);
    }

    // =========================================================================
    // Q3 — recompte de dies amb una temperatura concreta
    // =========================================================================
    /**
     * Retorna 4 opcions de recompte, exactament una de correcta.
     * Les opcions sempre cobreixen {0, 1, 2, 3} (i el correctCount si és > 3).
     */
    function buildCountOptions(correctCount) {
        const base    = [0, 1, 2, 3];
        const pool    = base.includes(correctCount) ? base : [...base, correctCount];
        const others  = _shuffle(pool.filter(c => c !== correctCount)).slice(0, 3);
        const all     = _shuffle([correctCount, ...others]);
        return all.map(c => ({
            count:     c,
            label:     S.countLabel(c),
            isCorrect: c === correctCount
        }));
    }

    // =========================================================================
    // Q4 — selecciona la frase correcta
    // =========================================================================
    /**
     * Retorna 4 opcions {text, isCorrect}, exactament una de certa.
     *
     * Tipologies de frases:
     *  'direct'        → "[day], la temperatura [era/és/estarà] de [tempLabel]"
     *  'change'        → "entre [day1] i [day2], la temperatura [puja/baixa/es manté]"
     *  'compare-today' → "[day], la temperatura [era/serà] [més alta/baixa] que avui"
     *  'sign'          → "[day], la temperatura [era/és/estarà] [positiva/negativa]"
     *
     * Escala de dificultat de les frases falses (falseLevel):
     *  1 → error gran (signe oposat, diferència > 3, direcció molt equivocada)
     *  2 → error mitjà (valor d'un altre dia, diferència 2-3)
     *  3 → error subtil (±1 grau, direcció gairebé igual, ±1 dia de confusió)
     *
     * @param {object[]} cloud   Punts {x, y} del núvol
     * @param {number}   level   Nivell del joc (1 | 2 | 3)
     * @returns {{text:string, isCorrect:boolean}[]}   Array de 4 opcions barrejades
     */
    function buildFrases(cloud, level) {
        const allOpts = _buildAllOptions(cloud, level);

        const correctPool = allOpts.filter(o => o.isCorrect);
        const falsePool   = allOpts.filter(o => !o.isCorrect);

        // Tria 1 frase correcta
        const correctOne = _pick(_shuffle(correctPool));

        // Tria 3 falses amb diversitat de tipus
        const typeSeen = new Set([correctOne.type]);
        const chosen   = [];

        // Primera passada: tipus diversos
        _shuffle(falsePool).forEach(o => {
            if (chosen.length < 3 && !typeSeen.has(o.type)) {
                chosen.push(o);
                typeSeen.add(o.type);
            }
        });
        // Segona passada: emplena si cal
        _shuffle(falsePool).forEach(o => {
            if (chosen.length < 3 && !chosen.find(c => c.text === o.text)) {
                chosen.push(o);
            }
        });

        return _shuffle([
            { text: correctOne.text, isCorrect: true },
            ...chosen.slice(0, 3).map(o => ({ text: o.text, isCorrect: false }))
        ]);
    }

    // -------------------------------------------------------------------------
    // HELPER: genera totes les opcions possibles (certes + falses)
    // -------------------------------------------------------------------------
    function _buildAllOptions(cloud, level) {
        const v      = x => S.verbTense(x);
        const sorted = [...cloud].sort((a, b) => a.x - b.x);
        const today  = cloud.find(p => p.x === 0);

        const opts      = [];    // {type, text, isCorrect, falseLevel?}
        const trueTexts = new Set();

        // ==== FRASES CERTES ==================================================

        // C1: Lectura directa
        cloud.forEach(pt => {
            const text = `${S.capitalize(S.dayLabel(pt.x))}, la temperatura ${v(pt.x)} de ${S.tempLabel(pt.y)}`;
            trueTexts.add(text);
            opts.push({ type: 'direct', text, isCorrect: true });
        });

        // C2: Canvi entre dies consecutius — [ROUND 1 — format comparatiu: "dia1 era més alta/baixa que dia2"]
        for (let i = 0; i < sorted.length - 1; i++) {
            const p1 = sorted[i], p2 = sorted[i + 1];
            const delta = p2.y - p1.y;
            if (delta === 0) continue;   // igual → no hi ha comparació significativa
            const cmp  = delta > 0 ? 'més baixa' : 'més alta';
            const verb = p1.x < 0 ? 'era' : p1.x === 0 ? 'és' : 'serà';
            const text = `${S.capitalize(S.dayLabel(p1.x))}, la temperatura ${verb} ${cmp} que ${S.dayLabel(p2.x)}`;
            trueTexts.add(text);
            opts.push({ type: 'change', text, isCorrect: true });
        }

        // C3: Comparació amb avui
        cloud.filter(p => p.x !== 0).forEach(pt => {
            const diff = pt.y - today.y;
            let cmp;
            if (diff > 0)      cmp = `serà més alta que avui`;
            else if (diff < 0) cmp = `serà més baixa que avui`;
            else               cmp = `serà igual que avui`;
            // Ajusta verb per al passat
            if (pt.x < 0) {
                if (diff > 0)      cmp = `era més alta que avui`;
                else if (diff < 0) cmp = `era més baixa que avui`;
                else               cmp = `era igual que avui`;
            }
            const text = `${S.capitalize(S.dayLabel(pt.x))}, la temperatura ${cmp}`;
            trueTexts.add(text);
            opts.push({ type: 'compare-today', text, isCorrect: true });
        });

        // C4: Signe de la temperatura
        cloud.filter(p => p.y !== 0).forEach(pt => {
            const text = `${S.capitalize(S.dayLabel(pt.x))}, la temperatura ${v(pt.x)} ${S.signLabel(pt.y)}`;
            trueTexts.add(text);
            opts.push({ type: 'sign', text, isCorrect: true });
        });

        // ==== FRASES FALSES ==================================================
        // falseLevel: 1=gran error (fàcil d'eliminar), 3=error subtil (difícil)

        // F1: Lectura directa amb temperatura incorrecta (d'un altre punt)
        cloud.forEach(pt => {
            cloud.filter(p => p.x !== pt.x).forEach(other => {
                if (other.y === pt.y) return;
                const diff       = Math.abs(other.y - pt.y);
                const falseLevel = diff <= 1 ? 3 : diff <= 3 ? 2 : 1;
                if (falseLevel > level) return;
                const text = `${S.capitalize(S.dayLabel(pt.x))}, la temperatura ${v(pt.x)} de ${S.tempLabel(other.y)}`;
                if (!trueTexts.has(text)) opts.push({ type: 'direct', text, isCorrect: false, falseLevel });
            });
        });

        // F2: Lectura directa ±step
        const yStep = cloud[0] ? 1 : 1;   // sempre 1 (enters)
        cloud.forEach(pt => {
            [-1, 1, -2, 2, -3, 3].forEach(d => {
                const wy        = pt.y + d;
                const falseLevel = Math.abs(d) === 1 ? 3 : Math.abs(d) === 2 ? 2 : 1;
                if (falseLevel > level) return;
                const text = `${S.capitalize(S.dayLabel(pt.x))}, la temperatura ${v(pt.x)} de ${S.tempLabel(wy)}`;
                if (!trueTexts.has(text)) opts.push({ type: 'direct', text, isCorrect: false, falseLevel });
            });
        });

        // F3: Canvi de direcció incorrecte — [ROUND 1 — format comparatiu: cmp invertida]
        for (let i = 0; i < sorted.length - 1; i++) {
            const p1    = sorted[i], p2 = sorted[i + 1];
            const delta = p2.y - p1.y;
            if (delta === 0) continue;
            const wrongCmp   = delta > 0 ? 'més alta' : 'més baixa';   // invers del correcte
            const verb       = p1.x < 0 ? 'era' : p1.x === 0 ? 'és' : 'serà';
            const absD       = Math.abs(delta);
            const falseLevel = absD === 1 ? 3 : absD <= 3 ? 2 : 1;
            if (falseLevel > level) continue;
            const text = `${S.capitalize(S.dayLabel(p1.x))}, la temperatura ${verb} ${wrongCmp} que ${S.dayLabel(p2.x)}`;
            if (!trueTexts.has(text)) opts.push({ type: 'change', text, isCorrect: false, falseLevel });
        }

        // F4: Comparació amb avui incorrecta
        cloud.filter(p => p.x !== 0).forEach(pt => {
            const diff = pt.y - today.y;
            if (diff === 0) return;
            let wrongCmp;
            if (pt.x < 0)  wrongCmp = diff > 0 ? `era més baixa que avui` : `era més alta que avui`;
            else            wrongCmp = diff > 0 ? `serà més baixa que avui` : `serà més alta que avui`;
            const absD        = Math.abs(diff);
            const falseLevel  = absD === 1 ? 3 : absD <= 3 ? 2 : 1;
            if (falseLevel > level) return;
            const text = `${S.capitalize(S.dayLabel(pt.x))}, la temperatura ${wrongCmp}`;
            if (!trueTexts.has(text)) opts.push({ type: 'compare-today', text, isCorrect: false, falseLevel });
        });

        // F5: Signe incorrecte
        cloud.filter(p => p.y !== 0).forEach(pt => {
            const wrongSign  = pt.y > 0 ? S.signLabel(-1) : S.signLabel(1);
            const falseLevel = Math.abs(pt.y) <= 2 ? 2 : 1;
            if (falseLevel > level) return;
            const text = `${S.capitalize(S.dayLabel(pt.x))}, la temperatura ${v(pt.x)} ${wrongSign}`;
            if (!trueTexts.has(text)) opts.push({ type: 'sign', text, isCorrect: false, falseLevel });
        });

        // Deduplicació de les frases falses
        const seenFalse = new Set();
        return opts.filter(o => {
            if (o.isCorrect) return true;
            if (seenFalse.has(o.text)) return false;
            seenFalse.add(o.text);
            return true;
        });
    }

    return { buildDirectRead, buildCountOptions, buildFrases };
})();
