/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions/math-engine.js
 * ROL: Motor matemàtic pur d'«Equacions de 1r grau» (sense DOM): genera les
 *      equacions de cada nivell i en determina els passos de resolució.
 * ARQUITECTURA:
 * - Una equació és { leftA, leftB, rightC, rightD, xSol, dispLeft, dispRight,
 *   swapInitial }: la forma canònica lA·x + lB = rC·x + rD (x a l'esquerra) i
 *   els termes que es veuen. Termes: {k:'x', c} (c·x), {k:'n', v} (v) i
 *   {k:'p', c, n} (c·(x + n)).
 * - determineSteps(eq): els passos, en ordre (distributiva, sumar termes de cada
 *   costat, passar les x a l'esquerra, passar els nombres a la dreta, aïllar la
 *   x). Cada pas té el tipus, la pregunta, la resposta i els termes de cada
 *   costat abans i després.
 * - Fa servir Math.random (randIntNonZero, pickOne), que amb ?fixed=A/B/C està
 *   sembrat per a cada pregunta (js/fixed-sessions.js). Si canvia l'ordre en què
 *   es demanen nombres a l'atzar, canvien les preguntes de les sessions fixes:
 *   tests/equacions.test.js en guarda una empremta (el codi es va moure aquí des
 *   del controlador el 27/10/2026 sense canviar-ne cap pregunta).
 * DEPENDÈNCIES: utils.js (randIntNonZero).
 * ============================================================================
 */
import { randIntNonZero } from '../utils.js';

export const MathEngine = (() => {
    // Constructors curts per termes
    const xT = c => ({ k: 'x', c });
    const nT = v => ({ k: 'n', v });
    const pT = (outer, inner) => ({ k: 'p', c: outer, n: inner });

    // ---- GENERACIÓ ALEATÒRIA D'EQUACIONS ----
    //
    // L'estat canònic és sempre lA·x + lB = rC·x + rD (x al costat esquerre).
    // dispLeft / dispRight són els termes que es veuen a pantalla.
    // Per formes B (b=ax) i D (c=ax+b) el canònic té x a l'esquerra però
    // dispLeft/dispRight es generen també en canònic; buildLevel s'encarrega
    // d'invertir-los visualment quan swapInitial:true.

    function pickOne(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Una equació nova. opcions: { nivell (0 = sense ?nivell=, progressió per opIndex; 1, 2, 3),
     * leftToRight (?lefttoright=1: al nivell 1 no surten formes amb la x només a la dreta),
     * totalOperations (el nombre d'equacions de la sessió: l'última del mode sense nivell és diferent) }
     */
    function generateEquation(opIndex, { nivell = 0, leftToRight = false, totalOperations = 10 } = {}) {
        if (nivell === 1) return genN1(leftToRight);
        if (nivell === 2) {
            const r = Math.random();
            if (r < 0.25) return genN1(leftToRight);
            if (r < 0.55) return genBothSidesX();
            return genMultiTermX();
        }
        if (nivell === 3) {
            const r = Math.random();
            if (r < 0.2) return genN1(leftToRight);
            if (r < 0.45) return genBothSidesX();
            if (r < 0.6) return genMultiTermX();
            return genParens();
        }
        // Sense ?nivell= → comportament legacy per opIndex
        return genLegacy(opIndex, totalOperations);
    }

    // -------- Generadors per nivell --------

    function genN1(leftToRightOnly) {
        // Si està actiu ?lefttoright=1, només permetem les formes A (ax=b)
        // i C (ax+b=c) — bloquegem B (b=ax) i D (c=ax+b).
        const forms = leftToRightOnly ? ['A', 'C'] : ['A', 'B', 'C', 'D'];
        const form = pickOne(forms);
        let lA, lB, rD, xSol;
        for (let safety = 0; safety < 60; safety++) {
            xSol = randIntNonZero(-9, 9);
            lA = randIntNonZero(-6, 6);
            if (Math.abs(lA) < 2) continue;
            if (form === 'A' || form === 'B') {
                lB = 0;
                rD = lA * xSol;
            } else {
                lB = randIntNonZero(-9, 9);
                rD = lA * xSol + lB;
                if (rD === 0) continue;
            }
            break;
        }
        const dispLeft = [xT(lA)];
        if (lB !== 0) dispLeft.push(nT(lB));
        const dispRight = [nT(rD)];
        const swapInitial = form === 'B' || form === 'D';
        return {
            leftA: lA,
            leftB: lB,
            rightC: 0,
            rightD: rD,
            xSol,
            dispLeft,
            dispRight,
            swapInitial,
        };
    }

    function genBothSidesX() {
        let lA, lB, rC, rD, xSol;
        for (let safety = 0; safety < 80; safety++) {
            xSol = randIntNonZero(-7, 7);
            lA = randIntNonZero(-5, 5);
            rC = randIntNonZero(-5, 5);
            if (Math.abs(lA - rC) < 2) continue;
            lB = randIntNonZero(-9, 9);
            rD = (lA - rC) * xSol + lB;
            if (rD === 0) continue;
            break;
        }
        return {
            leftA: lA,
            leftB: lB,
            rightC: rC,
            rightD: rD,
            xSol,
            dispLeft: [xT(lA), nT(lB)],
            dispRight: [xT(rC), nT(rD)],
            swapInitial: false,
        };
    }

    function genMultiTermX() {
        let lA, lB, rC, rD, xSol, a1, a2, c1, c2;
        let tries = 0;
        while (tries++ < 80) {
            xSol = randIntNonZero(-7, 7);
            lA = randIntNonZero(-8, 8);
            rC = randIntNonZero(-6, 6);
            if (Math.abs(lA - rC) < 2) continue;
            lB = randIntNonZero(-9, 9);
            rD = (lA - rC) * xSol + lB;
            if (rD === 0) continue;

            // Partim lA = a1 + a2 amb a1, a2 ≠ 0 i |·| ≤ 6
            let okA = false;
            for (let t = 0; t < 30; t++) {
                a1 = randIntNonZero(-6, 6);
                a2 = lA - a1;
                if (a2 !== 0 && Math.abs(a2) <= 6) {
                    okA = true;
                    break;
                }
            }
            if (!okA) continue;

            // Partim rC = c1 + c2 amb c1, c2 ≠ 0 i |·| ≤ 6
            let okC = false;
            for (let t = 0; t < 30; t++) {
                c1 = randIntNonZero(-6, 6);
                c2 = rC - c1;
                if (c2 !== 0 && Math.abs(c2) <= 6) {
                    okC = true;
                    break;
                }
            }
            if (!okC) continue;
            break;
        }
        if (tries >= 80) return genBothSidesX();

        return {
            leftA: lA,
            leftB: lB,
            rightC: rC,
            rightD: rD,
            xSol,
            dispLeft: [xT(a1), nT(lB), xT(a2)],
            dispRight: [xT(c1), nT(rD), xT(c2)],
            swapInitial: false,
        };
    }

    function genParens() {
        // Forma: a(x+b) + c·x + d  =  e(x+f) + g·x + h
        // Després de distribuir:  (a+c)·x + (a·b+d)  =  (e+g)·x + (e·f+h)
        let a, b, c, d, e, f, g, h, lA, lB, rC, rD, xSol;
        let tries = 0;
        while (tries++ < 120) {
            xSol = randIntNonZero(-7, 7);
            a = randIntNonZero(-5, 5);
            if (Math.abs(a) < 2) continue; // a=±1 fa la distribució trivial
            b = randIntNonZero(-6, 6);
            c = randIntNonZero(-5, 5);
            d = randIntNonZero(-9, 9);
            e = randIntNonZero(-5, 5);
            if (Math.abs(e) < 2) continue;
            f = randIntNonZero(-6, 6);
            g = randIntNonZero(-5, 5);

            lA = a + c;
            rC = e + g;
            if (lA === 0 || rC === 0) continue;
            if (Math.abs(lA - rC) < 2) continue;

            lB = a * b + d;
            if (lB === 0) continue;
            if (Math.abs(lB) > 30) continue;

            // rD = e·f + h, i alhora xSol = (rD - lB) / (lA - rC)
            //  ⇒ h = (lA - rC)·xSol + lB - e·f
            h = (lA - rC) * xSol + lB - e * f;
            if (h === 0) continue; // evitem "+0" amagat al display
            if (Math.abs(h) > 30) continue;

            rD = e * f + h;
            if (rD === 0) continue;
            if (Math.abs(rD) > 50) continue;
            break;
        }
        if (tries >= 120) return genBothSidesX();

        return {
            leftA: lA,
            leftB: lB,
            rightC: rC,
            rightD: rD,
            xSol,
            dispLeft: [pT(a, b), xT(c), nT(d)],
            dispRight: [pT(e, f), xT(g), nT(h)],
            swapInitial: false,
        };
    }

    function genLegacy(opIndex, TOTAL_OPERATIONS) {
        // Preserva exactament la lògica legacy original per opIndex.
        const xSol = randIntNonZero(-10, 10);
        let leftA, leftB, rightC, rightD;

        if (opIndex <= 1) {
            leftA = randIntNonZero(-6, 6);
            while (Math.abs(leftA) === 1) leftA = randIntNonZero(-6, 6);
            leftB = 0;
            rightC = 0;
            rightD = leftA * xSol;
        } else if (opIndex <= 3) {
            leftA = randIntNonZero(-5, 5);
            leftB = randIntNonZero(-10, 10);
            rightC = 0;
            rightD = leftA * xSol + leftB;
        } else if (opIndex <= 5 && opIndex !== TOTAL_OPERATIONS - 1) {
            leftA = randIntNonZero(-4, 4);
            rightC = randIntNonZero(-3, 3);
            while (rightC === leftA) rightC = randIntNonZero(-3, 3);
            leftB = randIntNonZero(-8, 8);
            rightD = (leftA - rightC) * xSol + leftB;
        } else {
            leftA = randIntNonZero(-6, 6);
            rightC = randIntNonZero(-5, 5);
            // rC ≠ lA (si no, «3x + 4 = 3x + 4»: no té una solució) i |lA − rC| ≠ 1. Abans el segon bucle
            // podia acabar amb rC = lA (corregit el 27/10/2026); les equacions bones no han canviat.
            while (rightC === leftA || Math.abs(leftA - rightC) === 1) rightC = randIntNonZero(-5, 5);
            leftB = randIntNonZero(-10, 10);
            rightD = (leftA - rightC) * xSol + leftB;
        }

        const dispLeft = [];
        if (leftA !== 0) dispLeft.push(xT(leftA));
        if (leftB !== 0) dispLeft.push(nT(leftB));
        if (dispLeft.length === 0) dispLeft.push(nT(0));

        const dispRight = [];
        if (rightC !== 0) dispRight.push(xT(rightC));
        if (rightD !== 0) dispRight.push(nT(rightD));
        if (dispRight.length === 0) dispRight.push(nT(0));

        return {
            leftA,
            leftB,
            rightC,
            rightD,
            xSol,
            dispLeft,
            dispRight,
            swapInitial: false,
        };
    }

    // ---- DETERMINACIÓ DELS PASSOS DE RESOLUCIÓ ----
    //
    // Ordre dels passos:
    //   1. distribute_left  (un per cada parèntesi a l'esquerra)
    //   2. distribute_right (un per cada parèntesi a la dreta)
    //   3. simplify_left_x  (si hi ha > 1 terme x a l'esquerra)
    //   4. simplify_left_n  (si hi ha > 1 terme independent a l'esquerra)
    //   5. simplify_right_x (si hi ha > 1 terme x a la dreta)
    //   6. simplify_right_n (si hi ha > 1 terme independent a la dreta)
    //   7. group_x          (si rC ≠ 0)
    //   8. group_num        (si lB ≠ 0)
    //   9. solve            (si lA ≠ 1)

    function determineSteps(eq) {
        const result = [];
        let dispL = eq.dispLeft.slice();
        let dispR = eq.dispRight.slice();
        let lA = eq.leftA,
            lB = eq.leftB,
            rC = eq.rightC,
            rD = eq.rightD;

        // 1. distribute_left
        while (true) {
            const idx = dispL.findIndex(t => t.k === 'p');
            if (idx === -1) break;
            const paren = dispL[idx];
            const newConst = paren.c * paren.n;
            const newDispL = dispL.slice();
            newDispL.splice(idx, 1, xT(paren.c), nT(newConst));
            result.push({
                type: 'distribute_left',
                instruction: `Aplica la propietat distributiva al parèntesi de l'esquerra`,
                answer: newConst,
                label: 'Terme independent',
                distIdx: idx,
                distOuter: paren.c,
                distInner: paren.n,
                dispLeftBefore: dispL,
                dispRightBefore: dispR.slice(),
                dispLeftAfter: newDispL,
                dispRightAfter: dispR.slice(),
            });
            dispL = newDispL;
        }

        // 2. distribute_right
        while (true) {
            const idx = dispR.findIndex(t => t.k === 'p');
            if (idx === -1) break;
            const paren = dispR[idx];
            const newConst = paren.c * paren.n;
            const newDispR = dispR.slice();
            newDispR.splice(idx, 1, xT(paren.c), nT(newConst));
            result.push({
                type: 'distribute_right',
                instruction: `Aplica la propietat distributiva al parèntesi de la dreta`,
                answer: newConst,
                label: 'Terme independent',
                distIdx: idx,
                distOuter: paren.c,
                distInner: paren.n,
                dispLeftBefore: dispL.slice(),
                dispRightBefore: dispR,
                dispLeftAfter: dispL.slice(),
                dispRightAfter: newDispR,
            });
            dispR = newDispR;
        }

        // 3. simplify_left_x
        {
            const xs = dispL.filter(t => t.k === 'x');
            if (xs.length > 1) {
                const sum = xs.reduce((s, t) => s + t.c, 0);
                const newDispL = [];
                let placed = false;
                for (const t of dispL) {
                    if (t.k === 'x') {
                        if (!placed) {
                            newDispL.push(xT(sum));
                            placed = true;
                        }
                    } else {
                        newDispL.push(t);
                    }
                }
                result.push({
                    type: 'simplify_left_x',
                    instruction: `Suma els termes amb x del costat esquerre`,
                    answer: sum,
                    label: 'Coeficient de x',
                    dispLeftBefore: dispL,
                    dispRightBefore: dispR.slice(),
                    dispLeftAfter: newDispL,
                    dispRightAfter: dispR.slice(),
                });
                dispL = newDispL;
            }
        }

        // 4. simplify_left_n
        {
            const ns = dispL.filter(t => t.k === 'n');
            if (ns.length > 1) {
                const sum = ns.reduce((s, t) => s + t.v, 0);
                const newDispL = [];
                let placed = false;
                for (const t of dispL) {
                    if (t.k === 'n') {
                        if (!placed) {
                            newDispL.push(nT(sum));
                            placed = true;
                        }
                    } else {
                        newDispL.push(t);
                    }
                }
                result.push({
                    type: 'simplify_left_n',
                    instruction: `Suma els termes independents del costat esquerre`,
                    answer: sum,
                    label: 'Terme independent',
                    dispLeftBefore: dispL,
                    dispRightBefore: dispR.slice(),
                    dispLeftAfter: newDispL,
                    dispRightAfter: dispR.slice(),
                });
                dispL = newDispL;
            }
        }

        // 5. simplify_right_x
        {
            const xs = dispR.filter(t => t.k === 'x');
            if (xs.length > 1) {
                const sum = xs.reduce((s, t) => s + t.c, 0);
                const newDispR = [];
                let placed = false;
                for (const t of dispR) {
                    if (t.k === 'x') {
                        if (!placed) {
                            newDispR.push(xT(sum));
                            placed = true;
                        }
                    } else {
                        newDispR.push(t);
                    }
                }
                result.push({
                    type: 'simplify_right_x',
                    instruction: `Suma els termes amb x del costat dret`,
                    answer: sum,
                    label: 'Coeficient de x',
                    dispLeftBefore: dispL.slice(),
                    dispRightBefore: dispR,
                    dispLeftAfter: dispL.slice(),
                    dispRightAfter: newDispR,
                });
                dispR = newDispR;
            }
        }

        // 6. simplify_right_n
        {
            const ns = dispR.filter(t => t.k === 'n');
            if (ns.length > 1) {
                const sum = ns.reduce((s, t) => s + t.v, 0);
                const newDispR = [];
                let placed = false;
                for (const t of dispR) {
                    if (t.k === 'n') {
                        if (!placed) {
                            newDispR.push(nT(sum));
                            placed = true;
                        }
                    } else {
                        newDispR.push(t);
                    }
                }
                result.push({
                    type: 'simplify_right_n',
                    instruction: `Suma els termes independents del costat dret`,
                    answer: sum,
                    label: 'Terme independent',
                    dispLeftBefore: dispL.slice(),
                    dispRightBefore: dispR,
                    dispLeftAfter: dispL.slice(),
                    dispRightAfter: newDispR,
                });
                dispR = newDispR;
            }
        }

        // 7. group_x — passem x al costat esquerre
        if (rC !== 0) {
            const newLA = lA - rC;
            const newDispL = [];
            if (newLA !== 0) newDispL.push(xT(newLA));
            if (lB !== 0) newDispL.push(nT(lB));
            if (newDispL.length === 0) newDispL.push(nT(0));
            const newDispR = [];
            if (rD !== 0) newDispR.push(nT(rD));
            if (newDispR.length === 0) newDispR.push(nT(0));
            result.push({
                type: 'group_x',
                instruction: `Quant val el coeficient de la x?`,
                answer: newLA,
                label: 'Coeficient de x',
                dispLeftBefore: dispL,
                dispRightBefore: dispR,
                dispLeftAfter: newDispL,
                dispRightAfter: newDispR,
            });
            dispL = newDispL;
            dispR = newDispR;
            lA = newLA;
            rC = 0;
        }

        // 8. group_num — passem el terme independent a la dreta
        if (lB !== 0) {
            const newRD = rD - lB;
            const newDispL = [];
            if (lA !== 0) newDispL.push(xT(lA));
            if (newDispL.length === 0) newDispL.push(nT(0));
            const newDispR = [nT(newRD)];
            result.push({
                type: 'group_num',
                instruction: `Quant val el terme independent?`,
                answer: newRD,
                label: 'Terme independent',
                dispLeftBefore: dispL,
                dispRightBefore: dispR,
                dispLeftAfter: newDispL,
                dispRightAfter: newDispR,
            });
            dispL = newDispL;
            dispR = newDispR;
            rD = newRD;
            lB = 0;
        }

        // 9. solve — dividim pel coeficient de la x
        if (lA !== 1) {
            const newDispL = [xT(1)];
            const newDispR = [nT(eq.xSol)];
            result.push({
                type: 'solve',
                instruction: `Quina és la solució de l'equació?`,
                answer: eq.xSol,
                label: 'Valor de x',
                dispLeftBefore: dispL,
                dispRightBefore: dispR,
                dispLeftAfter: newDispL,
                dispRightAfter: newDispR,
            });
        }

        return result;
    }

    return { xT, nT, pT, generateEquation, determineSteps };
})();
