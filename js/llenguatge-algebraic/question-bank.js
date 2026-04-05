/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/llenguatge-algebraic/question-bank.js
 * ROL: Banc de preguntes de llenguatge algebraic.
 *
 * Cada generador retorna:
 *   { context, text, answer, distractors[] }
 *
 *   context      → etiqueta temàtica (ex: 'Edat', 'Geometria')
 *   text         → enunciat HTML de la pregunta
 *   answer       → resposta correcta (string)
 *   distractors  → 3 opcions incorrectes (strings)
 *
 * API pública:
 *   QuestionBank.pick(usedIndices)  → { question, index }
 *   QuestionBank.size               → nombre total de generadors
 *
 * DEPENDÈNCIES: utils.js (randInt)
 * ============================================================================
 */
window.QuestionBank = (() => {

    const V = '<span class="var-highlight">x</span>';

    // ── POOL DE GENERADORS ──────────────────────────────────────────────────
    const pool = [];

    // ──────── BLOC 1: Edat i anys ────────
    pool.push(() => {
        const n = randInt(2, 12);
        return {
            context: 'Edat',
            text: `Si avui tinc ${V} anys, quants anys tindré d'aquí ${n} anys?`,
            answer: `x + ${n}`,
            distractors: [`x − ${n}`, `${n}x`, `${n}`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 10);
        return {
            context: 'Edat',
            text: `Si avui tinc ${V} anys, quants anys tenia fa ${n} anys?`,
            answer: `x − ${n}`,
            distractors: [`x + ${n}`, `${n}x`, `${n} − x`]
        };
    });
    pool.push(() => {
        return {
            context: 'Edat',
            text: `La meva germana té el doble d'anys que jo. Si jo tinc ${V} anys, quants té ella?`,
            answer: `2x`,
            distractors: [`x + 2`, `x − 2`, `x / 2`]
        };
    });
    pool.push(() => {
        return {
            context: 'Edat',
            text: `El meu avi té el triple d'anys que el meu pare. Si el meu pare té ${V} anys, quants anys té l'avi?`,
            answer: `3x`,
            distractors: [`x + 3`, `x³`, `x / 3`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return {
            context: 'Edat',
            text: `En Marc té ${V} anys i la seva mare ${n} vegades més. Quants anys té la mare?`,
            answer: `${n}x`,
            distractors: [`x + ${n}`, `x − ${n}`, `x / ${n}`]
        };
    });

    // ──────── BLOC 2: Operacions bàsiques ────────
    pool.push(() => {
        const n = randInt(3, 15);
        return {
            context: 'Nombres',
            text: `La suma d'un nombre ${V} i ${n}.`,
            answer: `x + ${n}`,
            distractors: [`x − ${n}`, `${n}x`, `x · ${n} + ${n}`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 10);
        return {
            context: 'Nombres',
            text: `El doble d'un nombre ${V}, augmentat en ${n}.`,
            answer: `2x + ${n}`,
            distractors: [`2(x + ${n})`, `x + ${2 * n}`, `2x − ${n}`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 8);
        return {
            context: 'Nombres',
            text: `El triple d'un nombre ${V}, disminuït en ${n}.`,
            answer: `3x − ${n}`,
            distractors: [`3(x − ${n})`, `3x + ${n}`, `x − ${3 * n}`]
        };
    });
    pool.push(() => {
        return {
            context: 'Nombres',
            text: `La meitat d'un nombre ${V}.`,
            answer: `x / 2`,
            distractors: [`2x`, `x − 2`, `x · 2`]
        };
    });
    pool.push(() => {
        return {
            context: 'Nombres',
            text: `La tercera part d'un nombre ${V}.`,
            answer: `x / 3`,
            distractors: [`3x`, `x − 3`, `x + 3`]
        };
    });
    pool.push(() => {
        return {
            context: 'Nombres',
            text: `El quadrat d'un nombre ${V}.`,
            answer: `x²`,
            distractors: [`2x`, `x + 2`, `√x`]
        };
    });
    pool.push(() => {
        return {
            context: 'Nombres',
            text: `El cub d'un nombre ${V}.`,
            answer: `x³`,
            distractors: [`3x`, `x + 3`, `x · 3`]
        };
    });

    // ──────── BLOC 3: Nombres consecutius ────────
    pool.push(() => {
        return {
            context: 'Consecutius',
            text: `Si un nombre és ${V}, quin és el nombre consecutiu (el següent)?`,
            answer: `x + 1`,
            distractors: [`x − 1`, `2x`, `x · 1`]
        };
    });
    pool.push(() => {
        return {
            context: 'Consecutius',
            text: `Si un nombre és ${V}, quin és el nombre anterior?`,
            answer: `x − 1`,
            distractors: [`x + 1`, `x / 1`, `−x`]
        };
    });
    pool.push(() => {
        return {
            context: 'Consecutius',
            text: `La suma de dos nombres consecutius, si el primer és ${V}.`,
            answer: `2x + 1`,
            distractors: [`x + 1`, `2x`, `x²`]
        };
    });

    // ──────── BLOC 4: Diners i preus ────────
    pool.push(() => {
        const n = randInt(2, 8);
        return {
            context: 'Diners',
            text: `Tinc ${V} euros i em gasto ${n} €. Quants euros em queden?`,
            answer: `x − ${n}`,
            distractors: [`x + ${n}`, `${n} − x`, `${n}x`]
        };
    });
    pool.push(() => {
        const n = randInt(5, 20);
        return {
            context: 'Diners',
            text: `Tinc ${V} euros i em donen ${n} € més. Quants euros tinc ara?`,
            answer: `x + ${n}`,
            distractors: [`x − ${n}`, `${n}x`, `${n}`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return {
            context: 'Diners',
            text: `Compro ${n} llibretes que costen ${V} euros cadascuna. Quant pago en total?`,
            answer: `${n}x`,
            distractors: [`x + ${n}`, `x / ${n}`, `x − ${n}`]
        };
    });
    pool.push(() => {
        const n = randInt(3, 6);
        return {
            context: 'Diners',
            text: `Repartim ${V} euros entre ${n} amics a parts iguals. Quant rep cadascú?`,
            answer: `x / ${n}`,
            distractors: [`${n}x`, `x − ${n}`, `x + ${n}`]
        };
    });

    // ──────── BLOC 5: Geometria ────────
    pool.push(() => {
        return {
            context: 'Geometria',
            text: `El perímetre d'un quadrat de costat ${V}.`,
            answer: `4x`,
            distractors: [`x + 4`, `x²`, `2x`]
        };
    });
    pool.push(() => {
        return {
            context: 'Geometria',
            text: `L'àrea d'un quadrat de costat ${V}.`,
            answer: `x²`,
            distractors: [`4x`, `2x`, `x + x`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 8);
        return {
            context: 'Geometria',
            text: `El perímetre d'un rectangle de base ${V} i altura ${n}.`,
            answer: `2x + ${2 * n}`,
            distractors: [`${n}x`, `x + ${n}`, `2x · ${n}`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 6);
        return {
            context: 'Geometria',
            text: `L'àrea d'un rectangle de base ${V} i altura ${n}.`,
            answer: `${n}x`,
            distractors: [`x + ${n}`, `2x + ${2 * n}`, `x²`]
        };
    });
    pool.push(() => {
        return {
            context: 'Geometria',
            text: `L'àrea d'un triangle de base ${V} i altura ${V}.`,
            answer: `x² / 2`,
            distractors: [`x²`, `2x`, `x + x`]
        };
    });

    // ──────── BLOC 6: Situacions quotidianes ────────
    pool.push(() => {
        const n = randInt(2, 5);
        return {
            context: 'Vida quotidiana',
            text: `En una classe hi ha ${V} alumnes. Si n'arriben ${n} més, quants n'hi ha en total?`,
            answer: `x + ${n}`,
            distractors: [`x − ${n}`, `${n}x`, `x`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 4);
        return {
            context: 'Vida quotidiana',
            text: `En una classe hi ha ${V} alumnes i se'n van ${n}. Quants en queden?`,
            answer: `x − ${n}`,
            distractors: [`x + ${n}`, `${n}x`, `${n} − x`]
        };
    });
    pool.push(() => {
        return {
            context: 'Vida quotidiana',
            text: `En un aparcament hi ha ${V} cotxes i el doble de motos. Quantes motos hi ha?`,
            answer: `2x`,
            distractors: [`x + 2`, `x / 2`, `x²`]
        };
    });
    pool.push(() => {
        const n = randInt(3, 7);
        return {
            context: 'Vida quotidiana',
            text: `Cada dia camino ${V} km. Quants km camino en ${n} dies?`,
            answer: `${n}x`,
            distractors: [`x + ${n}`, `x / ${n}`, `x − ${n}`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return {
            context: 'Vida quotidiana',
            text: `Si tinc ${V} cromos i el meu amic en té ${n} menys que jo, quants en té el meu amic?`,
            answer: `x − ${n}`,
            distractors: [`x + ${n}`, `${n} − x`, `${n}x`]
        };
    });
    pool.push(() => {
        const n = randInt(3, 8);
        return {
            context: 'Vida quotidiana',
            text: `Si tinc ${V} cromos i el meu amic en té ${n} més que jo, quants en té el meu amic?`,
            answer: `x + ${n}`,
            distractors: [`x − ${n}`, `${n}x`, `${n}`]
        };
    });

    // ──────── BLOC 7: Expressions més elaborades ────────
    pool.push(() => {
        return {
            context: 'Nombres',
            text: `L'oposat d'un nombre ${V}.`,
            answer: `−x`,
            distractors: [`1/x`, `x`, `|x|`]
        };
    });
    pool.push(() => {
        return {
            context: 'Nombres',
            text: `L'invers d'un nombre ${V}.`,
            answer: `1 / x`,
            distractors: [`−x`, `x`, `x²`]
        };
    });
    pool.push(() => {
        const a = randInt(2, 4);
        const b = randInt(1, 6);
        return {
            context: 'Nombres',
            text: `El ${a === 2 ? 'doble' : a === 3 ? 'triple' : 'quàdruple'} d'un nombre ${V}, menys ${b}.`,
            answer: `${a}x − ${b}`,
            distractors: [`${a}x + ${b}`, `${a}(x − ${b})`, `x − ${a * b}`]
        };
    });
    pool.push(() => {
        const a = randInt(2, 4);
        const b = randInt(1, 5);
        return {
            context: 'Nombres',
            text: `${a === 2 ? 'El doble' : a === 3 ? 'El triple' : 'El quàdruple'} de la suma d'un nombre ${V} i ${b}.`,
            answer: `${a}(x + ${b})`,
            distractors: [`${a}x + ${b}`, `${a}x + ${a + b}`, `x + ${a * b}`]
        };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return {
            context: 'Nombres',
            text: `La meitat d'un nombre ${V}, augmentada en ${n}.`,
            answer: `x / 2 + ${n}`,
            distractors: [`(x + ${n}) / 2`, `2x + ${n}`, `x / ${2 * n}`]
        };
    });
    pool.push(() => {
        return {
            context: 'Nombres',
            text: `La suma d'un nombre ${V} i el seu quadrat.`,
            answer: `x + x²`,
            distractors: [`x²`, `2x²`, `(x + x)²`]
        };
    });
    pool.push(() => {
        return {
            context: 'Nombres',
            text: `La diferència entre el quadrat d'un nombre ${V} i el propi nombre.`,
            answer: `x² − x`,
            distractors: [`x − x²`, `x²`, `(x − 1)²`]
        };
    });

    // ── API PÚBLICA ─────────────────────────────────────────────────────────

    /**
     * Tria una pregunta del pool que no hagi estat usada (per índex).
     * @param {number[]} usedIndices  Índexs ja usats en aquesta partida.
     * @returns {{ question: object, index: number }}
     */
    function pick(usedIndices) {
        if (usedIndices.length >= pool.length) {
            usedIndices.length = 0;  // Reset si hem exhaurit el pool
        }
        let idx;
        do {
            idx = randInt(0, pool.length - 1);
        } while (usedIndices.includes(idx));
        return { question: pool[idx](), index: idx };
    }

    return { pick, size: pool.length };
})();
