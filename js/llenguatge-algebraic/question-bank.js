/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/llenguatge-algebraic/question-bank.js
 * ROL: Banc de preguntes de llenguatge algebraic (80 preguntes).
 *
 * Cada generador retorna:
 *   { context, text, answer, distractors[] }
 *
 * API pública:
 *   QuestionBank.pick(usedIndices)  → { question, index }
 *   QuestionBank.size               → nombre total de generadors
 *
 * DEPENDÈNCIES: utils.js (randInt, shuffle)
 * ============================================================================
 */
window.QuestionBank = (() => {

    const V = '<span class="var-highlight">x</span>';
    const pool = [];

    // Noms variats per a les preguntes contextuals
    const NOMS = ['en Pau', 'la Laia', 'en Marc', 'la Noa', 'en Moha', 'la Yasmina', 'en Joan', 'la Ruth', 'l\'Ainhoa', 'en Biel', 'la Fàtima', 'en Jan'];
    function nom() { return pick(NOMS); }
    // =========================================================================
    // BLOC 1 — EDAT I ANYS  (10 preguntes: 0–9)
    // =========================================================================
    pool.push(() => {
        const n = randInt(2, 12);
        return { context: 'Edat', text: `Si avui tinc ${V} anys, quants anys tindré d'aquí ${n} anys?`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 10);
        return { context: 'Edat', text: `Si avui tinc ${V} anys, quants anys tenia fa ${n} anys?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `${n} − x`] };
    });
    pool.push(() => {
        return { context: 'Edat', text: `La meva germana té el doble d'anys que jo. Si jo tinc ${V} anys, quants té ella?`,
            answer: `2x`, distractors: [`x + 2`, `x − 2`, `\\frac{x}{2}`] };
    });
    pool.push(() => {
        return { context: 'Edat', text: `El meu avi té el triple d'anys que el meu pare. Si el meu pare té ${V} anys, quants anys té l'avi?`,
            answer: `3x`, distractors: [`x + 3`, `x³`, `\\frac{x}{3}`] };
    });
    pool.push(() => {
        const n = randInt(5, 15);
        return { context: 'Edat', text: `El meu pare té ${n} anys més que jo. Si jo tinc ${V} anys, quants anys té el meu pare?`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Edat', text: `La meva cosina té ${n} anys menys que jo. Si jo tinc ${V} anys, quants anys té ella?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n} − x`, `${n}x`] };
    });
    pool.push(() => {
        return { context: 'Edat', text: `El meu germà petit té la meitat d'anys que jo. Si jo tinc ${V} anys, quants anys té ell?`,
            answer: `\\frac{x}{2}`, distractors: [`2x`, `x − 2`, `x + 2`] };
    });
    pool.push(() => {
        const n = randInt(3, 8);
        return { context: 'Edat', text: `D'aquí ${n} anys, quina edat tindré si ara tinc ${V} anys?`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `x`] };
    });

    pool.push(() => {
        const n = randInt(2, 4);
        const p = nom();
        return { context: 'Edat', text: `${p} i el seu germà/na es porten ${n} anys. Si ${p} té ${V} anys i és el/la gran, quants anys té el germà/na?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `${n}`] };
    });

    // =========================================================================
    // BLOC 2 — NOMBRES I OPERACIONS BÀSIQUES  (12 preguntes: 10–21)
    // =========================================================================
    pool.push(() => {
        const n = randInt(3, 15);
        return { context: 'Nombres', text: `La suma d'un nombre ${V} i ${n}.`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `x · ${n} + ${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 10);
        return { context: 'Nombres', text: `El doble d'un nombre ${V}, augmentat en ${n}.`,
            answer: `2x + ${n}`, distractors: [`2(x + ${n})`, `x + ${2 * n}`, `2x − ${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 8);
        return { context: 'Nombres', text: `El triple d'un nombre ${V}, disminuït en ${n}.`,
            answer: `3x − ${n}`, distractors: [`3(x − ${n})`, `3x + ${n}`, `x − ${3 * n}`] };
    });
    pool.push(() => {
        return { context: 'Nombres', text: `La meitat d'un nombre ${V}.`,
            answer: `\\frac{x}{2}`, distractors: [`2x`, `x − 2`, `x · 2`] };
    });
    pool.push(() => {
        return { context: 'Nombres', text: `La tercera part d'un nombre ${V}.`,
            answer: `\\frac{x}{3}`, distractors: [`3x`, `x − 3`, `x + 3`] };
    });
    pool.push(() => {
        return { context: 'Nombres', text: `El quadrat d'un nombre ${V}.`,
            answer: `x²`, distractors: [`2x`, `x + 2`, `√x`] };
    });
    pool.push(() => {
        return { context: 'Nombres', text: `El cub d'un nombre ${V}.`,
            answer: `x³`, distractors: [`3x`, `x + 3`, `x · 3`] };
    });
    pool.push(() => {
        const n = randInt(2, 9);
        return { context: 'Nombres', text: `Un nombre ${V} disminuït en ${n}.`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n} − x`, `${n}x`] };
    });
    pool.push(() => {
        const n = randInt(2, 6);
        return { context: 'Nombres', text: `El producte d'un nombre ${V} per ${n}.`,
            answer: `${n}x`, distractors: [`x + ${n}`, `\\frac{x}{${n}}`, `x − ${n}`] };
    });
    pool.push(() => {
        const n = randInt(4, 8);
        return { context: 'Nombres', text: `La quarta part d'un nombre ${V}.`,
            answer: `\\frac{x}{4}`, distractors: [`4x`, `x − 4`, `x + 4`] };
    });
    pool.push(() => {
        return { context: 'Nombres', text: `Un nombre ${V} augmentat en la seva meitat.`,
            answer: `x + \\frac{x}{2}`, distractors: [`\\frac{x}{2}`, `2x`, `x · \\frac{x}{2}`] };
    });
    pool.push(() => {
        const n = randInt(2, 7);
        return { context: 'Nombres', text: `La diferència entre ${n} i un nombre ${V}.`,
            answer: `${n} − x`, distractors: [`x − ${n}`, `x + ${n}`, `${n}x`] };
    });

    // =========================================================================
    // BLOC 3 — CONSECUTIUS, PARELLS I SENARS  (8 preguntes: 22–29)
    // =========================================================================
    pool.push(() => {
        return { context: 'Consecutius', text: `Si un nombre és ${V}, quin és el nombre consecutiu (el següent)?`,
            answer: `x + 1`, distractors: [`x − 1`, `2x`, `x · 1`] };
    });
    pool.push(() => {
        return { context: 'Consecutius', text: `Si un nombre és ${V}, quin és el nombre anterior?`,
            answer: `x − 1`, distractors: [`x + 1`, `\\frac{x}{1}`, `−x`] };
    });
    pool.push(() => {
        return { context: 'Consecutius', text: `Si un nombre ${V} és parell, quin és el següent nombre parell?`,
            answer: `x + 2`, distractors: [`x + 1`, `2x`, `x · 2`] };
    });
    pool.push(() => {
        return { context: 'Consecutius', text: `Si un nombre ${V} és senar, quin és el següent nombre senar?`,
            answer: `x + 2`, distractors: [`x + 1`, `2x`, `x + 3`] };
    });

    pool.push(() => {
        return { context: 'Consecutius', text: `La suma d'un nombre ${V} i el seu consecutiu.`,
            answer: `2x + 1`, distractors: [`x + 1`, `2x`, `x²`] };
    });
    pool.push(() => {
        return { context: 'Consecutius', text: `La suma de tres nombres consecutius, si el primer és ${V}.`,
            answer: `3x + 3`, distractors: [`3x`, `x + 3`, `3x + 1`] };
    });


    // =========================================================================
    // BLOC 4 — DINERS I PREUS  (10 preguntes: 30–39)
    // =========================================================================
    pool.push(() => {
        const n = randInt(2, 8);
        return { context: 'Diners', text: `Tinc ${V} euros i em gasto ${n} €. Quants euros em queden?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n} − x`, `${n}x`] };
    });
    pool.push(() => {
        const n = randInt(5, 20);
        return { context: 'Diners', text: `Tinc ${V} euros i em donen ${n} € més. Quants euros tinc ara?`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Diners', text: `Compro ${n} llibretes que costen ${V} euros cadascuna. Quant pago en total?`,
            answer: `${n}x`, distractors: [`x + ${n}`, `\\frac{x}{${n}}`, `x − ${n}`] };
    });
    pool.push(() => {
        const n = randInt(3, 6);
        return { context: 'Diners', text: `Repartim ${V} euros entre ${n} amics a parts iguals. Quant rep cadascú?`,
            answer: `\\frac{x}{${n}}`, distractors: [`${n}x`, `x − ${n}`, `x + ${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Diners', text: `Un gelat costa ${V} euros. Quant costen ${n} gelats?`,
            answer: `${n}x`, distractors: [`x + ${n}`, `x − ${n}`, `\\frac{x}{${n}}`] };
    });
    pool.push(() => {
        const n = randInt(1, 5);
        return { context: 'Diners', text: `Una samarreta costa ${V} euros i li fan un descompte de ${n} €. Quin és el preu final?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `\\frac{x}{${n}}`] };
    });
    pool.push(() => {
        const n = randInt(5, 15);
        return { context: 'Diners', text: `Pago ${V} euros per una entrada i ${n} € per les crispetes. Quant pago en total?`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `x · ${n}`] };
    });

    pool.push(() => {
        const a = randInt(2, 4);
        const b = randInt(1, 3);
        return { context: 'Diners', text: `Compro ${a} entrepans a ${V} euros i ${b} ampolles d'aigua a 1 €. Quant pago?`,
            answer: `${a}x + ${b}`, distractors: [`${a + b}x`, `${a}x − ${b}`, `x + ${a + b}`] };
    });


    // =========================================================================
    // BLOC 5 — GEOMETRIA  (8 preguntes: 40–47)
    // =========================================================================
    pool.push(() => {
        return { context: 'Geometria', text: `El perímetre d'un quadrat de costat ${V}.`,
            answer: `4x`, distractors: [`x + 4`, `x²`, `2x`] };
    });
    pool.push(() => {
        return { context: 'Geometria', text: `L'àrea d'un quadrat de costat ${V}.`,
            answer: `x²`, distractors: [`4x`, `2x`, `x + x`] };
    });
    pool.push(() => {
        const n = randInt(2, 8);
        return { context: 'Geometria', text: `El perímetre d'un rectangle de base ${V} i altura ${n}.`,
            answer: `2x + ${2 * n}`, distractors: [`${n}x`, `x + ${n}`, `2x · ${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 6);
        return { context: 'Geometria', text: `L'àrea d'un rectangle de base ${V} i altura ${n}.`,
            answer: `${n}x`, distractors: [`x + ${n}`, `2x + ${2 * n}`, `x²`] };
    });
    pool.push(() => {
        return { context: 'Geometria', text: `El perímetre d'un triangle equilàter de costat ${V}.`,
            answer: `3x`, distractors: [`x + 3`, `x³`, `\\frac{x}{3}`] };
    });
    pool.push(() => {
        const n = randInt(2, 6);
        return { context: 'Geometria', text: `L'àrea d'un triangle de base ${V} i altura ${n}.`,
            answer: `\\frac{${n}x}{2}`, distractors: [`${n}x`, `x + ${n}`, `2x + ${n}`] };
    });
    pool.push(() => {
        const n = randInt(1, 5);
        return { context: 'Geometria', text: `El costat d'un quadrat és ${V}. Si l'augmentem en ${n}, quin serà el nou costat?`,
            answer: `x + ${n}`, distractors: [`${n}x`, `x − ${n}`, `x · ${n}`] };
    });


    // =========================================================================
    // BLOC 6 — ESCOLA I CLASSE  (8 preguntes: 48–55)
    // =========================================================================
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Escola', text: `En una classe hi ha ${V} alumnes. Si n'arriben ${n} més, quants n'hi ha en total?`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `x`] };
    });
    pool.push(() => {
        const n = randInt(2, 4);
        return { context: 'Escola', text: `En una classe hi ha ${V} alumnes i se'n van ${n}. Quants en queden?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `${n} − x`] };
    });
    pool.push(() => {
        return { context: 'Escola', text: `A l'escola hi ha ${V} alumnes repartits en 2 grups iguals. Quants alumnes té cada grup?`,
            answer: `\\frac{x}{2}`, distractors: [`2x`, `x − 2`, `x + 2`] };
    });
    pool.push(() => {
        const n = randInt(3, 6);
        return { context: 'Escola', text: `Un examen té ${V} preguntes. Si en fallo ${n}, quantes n'encerto?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Escola', text: `Cada alumne porta ${n} llapis. Si hi ha ${V} alumnes, quants llapis hi ha en total?`,
            answer: `${n}x`, distractors: [`x + ${n}`, `\\frac{x}{${n}}`, `x − ${n}`] };
    });
    pool.push(() => {
        const n = randInt(10, 30);
        return { context: 'Escola', text: `A la biblioteca hi ha ${n} llibres i en compren ${V} més. Quants n'hi ha ara?`,
            answer: `${n} + x`, distractors: [`${n} − x`, `${n}x`, `x − ${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 4);
        return { context: 'Escola', text: `Tinc ${V} pàgines per llegir i cada dia en llegeixo ${n}. Quantes pàgines em falten després d'un dia?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `\\frac{x}{${n}}`] };
    });


    // =========================================================================
    // BLOC 7 — ESPORT, MENJAR I LLEURE  (8 preguntes: 56–63)
    // =========================================================================
    pool.push(() => {
        const n = randInt(3, 7);
        return { context: 'Esport', text: `Cada dia camino ${V} km. Quants km camino en ${n} dies?`,
            answer: `${n}x`, distractors: [`x + ${n}`, `\\frac{x}{${n}}`, `x − ${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Esport', text: `Un equip ha marcat ${V} gols i l'altre en porta ${n} menys. Quants gols porta el segon equip?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n} − x`, `${n}x`] };
    });
    pool.push(() => {
        return { context: 'Esport', text: `En un aparcament hi ha ${V} cotxes i el doble de motos. Quants vehicles hi ha en total?`,
            answer: `3x`, distractors: [`2x`, `x + 2`, `x²`] };
    });
    pool.push(() => {
        const n = randInt(2, 4);
        return { context: 'Menjar', text: `Una pizza es talla en ${V} trossos. Si en menjo ${n}, quants trossos queden?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 6);
        return { context: 'Menjar', text: `Tinc ${V} galetes i les reparteixo entre ${n} amics. Quantes en toca a cadascú?`,
            answer: `\\frac{x}{${n}}`, distractors: [`${n}x`, `x − ${n}`, `x + ${n}`] };
    });
    pool.push(() => {
        const n = randInt(3, 6);
        return { context: 'Lleure', text: `Tinc ${V} cançons a la playlist i n'afegeixo ${n} més. Quantes en tinc ara?`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `${n}`] };
    });

    // =========================================================================
    // BLOC 8 — TECNOLOGIA I VIDA MODERNA
    // =========================================================================
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Tecnologia', text: `Tinc ${V} fotos al mòbil i n'esborro ${n}. Quantes en queden?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `${n} − x`] };
    });
    pool.push(() => {
        const n = randInt(3, 8);
        return { context: 'Tecnologia', text: `Tinc ${V} fotos al mòbil i la meva amiga en té ${n} més que jo. Quantes en té ella?`,
            answer: `x + ${n}`, distractors: [`x − ${n}`, `${n}x`, `${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Tecnologia', text: `Tinc ${V} cançons a la playlist i el meu amic en té ${n} menys que jo. Quantes en té ell?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n} − x`, `${n}x`] };
    });
    pool.push(() => {
        return { context: 'Tecnologia', text: `Fa dos mesos tenia ${V} subscriptors i ara tinc el triple. Quants subscriptors tinc ara?`,
            answer: `3x`, distractors: [`x + 3`, `x³`, `\\frac{x}{3}`] };
    });
    pool.push(() => {
        const n = randInt(10, 30);
        return { context: 'Tecnologia', text: `El meu mòbil té ${V} GB lliures. Si instal·lo una app que ocupa ${n} GB, quant espai em queda?`,
            answer: `x − ${n}`, distractors: [`x + ${n}`, `${n}x`, `${n} − x`] };
    });
    pool.push(() => {
        return { context: 'Tecnologia', text: `Tinc ${V} seguidors i avui se n'afegeix el doble. Quants seguidors tinc en total?`,
            answer: `3x`, distractors: [`2x`, `x + 2`, `x²`] };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Tecnologia', text: `Un vídeo dura ${V} minuts. Si el veig a velocitat ×${n}, quant de temps dura?`,
            answer: `\\frac{x}{${n}}`, distractors: [`${n}x`, `x − ${n}`, `x + ${n}`] };
    });

    // =========================================================================
    // BLOC 9 — EXPRESSIONS ELABORADES  (8 preguntes: 72–79)
    // =========================================================================
    pool.push(() => {
        return { context: 'Nombres', text: `L'oposat d'un nombre ${V}.`,
            answer: `−x`, distractors: [`\\frac{1}{x}`, `x`, `|x|`] };
    });
    pool.push(() => {
        return { context: 'Nombres', text: `L'invers d'un nombre ${V}.`,
            answer: `\\frac{1}{x}`, distractors: [`−x`, `x`, `x²`] };
    });
    pool.push(() => {
        const a = randInt(2, 4);
        const b = randInt(1, 6);
        return { context: 'Nombres', text: `El ${a === 2 ? 'doble' : a === 3 ? 'triple' : 'quàdruple'} d'un nombre ${V}, menys ${b}.`,
            answer: `${a}x − ${b}`, distractors: [`${a}x + ${b}`, `${a}(x − ${b})`, `x − ${a * b}`] };
    });
    pool.push(() => {
        const a = randInt(2, 4);
        const b = randInt(1, 5);
        return { context: 'Nombres', text: `${a === 2 ? 'El doble' : a === 3 ? 'El triple' : 'El quàdruple'} de la suma d'un nombre ${V} i ${b}.`,
            answer: `${a}(x + ${b})`, distractors: [`${a}x + ${b}`, `${a}x + ${a + b}`, `x + ${a * b}`] };
    });
    pool.push(() => {
        return { context: 'Nombres', text: `La suma d'un nombre ${V} i el seu quadrat.`,
            answer: `x + x²`, distractors: [`x²`, `2x²`, `(x + x)²`] };
    });
    pool.push(() => {
        return { context: 'Nombres', text: `El doble d'un nombre ${V}, menys la seva meitat.`,
            answer: `2x − \\frac{x}{2}`, distractors: [`\\frac{x}{2}`, `2x + \\frac{x}{2}`, `x`] };
    });
    pool.push(() => {
        const n = randInt(2, 6);
        return { context: 'Nombres', text: `La meitat de la suma d'un nombre ${V} i ${n}.`,
            answer: `\\frac{x + ${n}}{2}`, distractors: [`\\frac{x}{2} + ${n}`, `x + \\frac{${n}}{2}`, `2x + ${n}`] };
    });
    pool.push(() => {
        const n = randInt(2, 5);
        return { context: 'Nombres', text: `El quadrat d'un nombre ${V}, augmentat en ${n}.`,
            answer: `x² + ${n}`, distractors: [`(x + ${n})²`, `${n}x²`, `2x + ${n}`] };
    });

    // =========================================================================
    // API PÚBLICA
    // =========================================================================
    function pick(usedIndices) {
        if (usedIndices.length >= pool.length) {
            usedIndices.length = 0;
        }
        let idx;
        do {
            idx = randInt(0, pool.length - 1);
        } while (usedIndices.includes(idx));
        return { question: pool[idx](), index: idx };
    }

    return { pick, size: pool.length };
})();
