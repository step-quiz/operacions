/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/resolucio.js
 * ROL: «Resolució pas a pas» d'«Inequacions» de primer grau (l'escenari B, a
 *      resolucio.html?activitat=inequacions): el guió de la pissarra d'una inequació,
 *      pas a pas, amb el detall a demanda. Decisió 22 del David (C1–C7, 22/11/2026,
 *      docs/pissarra/STATE.md): els quatre nivells de l'activitat; les mateixes frases i
 *      el mateix ordre que la pissarra de les equacions (en fa servir el motor i el
 *      detall); en dividir per un negatiu, «el signe de desigualtat canvia» (mai «es
 *      gira»), amb el signe ressaltat d'un altre color; 4 > x → x < 4 és un pas propi;
 *      al final, la recta (SVG) i l'interval.
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM). S'exporta com a ResolucioIQ (el registre, js/resolucio/activitats.js,
 *   el carrega amb aquest nom: als tests, «Resolucio» ja és el de les equacions). exercici(nivell) és una pregunta de l'activitat
 *   (math-engine.js generaPreguntaIQ: les seves dades, la recta i l'interval);
 *   passos(ex, { oberts }) en torna el guió (js/pissarra/formules.js historial).
 * - planteja(ex) escriu la inequació com una equació de js/equacions/math-engine.js
 *   (la forma canònica, amb la x a l'esquerra) i el signe que hi ha entre els dos
 *   membres; els passos són els de determineSteps, amb les peces, els moviments i el
 *   detall de js/equacions/resolucio.js: aquí només s'hi posa el signe de
 *   desigualtat al lloc del «=» (la peça q) i es canvien les frases que parlen de la
 *   igualtat. Al nivell 4, el primer pas (treure els denominadors) és propi.
 * - Amb la x a la dreta (nivells 1 i 2, «11 > 2x + 3»), la x hi queda, com a
 *   l'activitat: les línies es pinten amb els membres girats (mirall) i, al final,
 *   «4 > x» es llegeix «x < 4» en un pas propi.
 * - La solució pot ser una fracció (nivells 3 i 4): el nombre de l'última línia es
 *   pinta amb \dfrac (la peça porta frac).
 * - tests/inequacions.test.js passa la bateria comuna (tests/pissarra-activitat.js):
 *   cada línia que es veu (també les del detall) té la mateixa solució.
 * DEPENDÈNCIES: equacions/math-engine.js, equacions/resolucio.js, pissarra/formules.js,
 *      algebra/racionals.js, passos/recta-intervals.js, math-engine.js.
 * ============================================================================
 */
import { MathEngine } from '../equacions/math-engine.js';
import { Resolucio } from '../equacions/resolucio.js';
import { clau, guio, historial } from '../pissarra/formules.js';
import { comRacional } from '../algebra/racionals.js';
import { svgRecta } from '../passos/recta-intervals.js';
import { GIRA, TEX_SIGNE, generaPreguntaIQ } from './math-engine.js';

export const ResolucioIQ = (() => {
    const Equacions = Resolucio;
    const { xT, nT, pT } = MathEngine;
    /** La marca del signe de desigualtat quan canvia (groc: formules.js MARQUES). */
    const MARCA = 'tria';

    const pc = (id, t, tipus = '') => ({ id, t: String(t), tipus });
    const IGUAL = () => pc('q', '=', 'igual');
    /** El TeX d'un text de les peces: «−» → «-», «·» → «\cdot». */
    const tex = t => String(t).replace(/−/g, '-').replace(/·/g, '\\cdot ');
    const ambSigne = v => (v < 0 ? `−${-v}` : String(v));
    const factor = v => (v < 0 ? `(−${-v})` : String(v));
    /** El TeX d'un racional [n, d]: 3, -2, \dfrac{7}{3}, -\dfrac{7}{3}. */
    const texQ = ([n, d]) => (d === 1 ? tex(ambSigne(n)) : `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${d}}`);
    const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));

    /**
     * La inequació com una equació de les equacions (la forma canònica lA·x + lB ⊙ rC·x + rD) i el signe ⊙;
     * mirall: la x és a la dreta (es pinta girada); denominadors: el nivell 4, abans de la forma canònica.
     */
    function planteja(ex) {
        const d = ex.dades;
        const sol = comRacional(d.sol);
        const xSol = sol[0] / sol[1];
        if (d.nivell <= 2) {
            const { a, b, c, s, dreta, davant } = d;
            return {
                eq: {
                    leftA: a,
                    leftB: b,
                    rightC: 0,
                    rightD: c,
                    xSol,
                    dispLeft: davant ? [nT(b), xT(a)] : [xT(a), nT(b)],
                    dispRight: [nT(c)],
                },
                // «c ⊙ ax + b» és «ax + b ⊙' c», amb el signe girat
                signe: dreta ? GIRA[s] : s,
                mirall: !!dreta,
                sol,
            };
        }
        if (d.nivell === 3) {
            const { p, q, r, t, s } = d;
            return {
                eq: {
                    leftA: p,
                    leftB: p * q,
                    rightC: r,
                    rightD: t,
                    xSol,
                    dispLeft: [pT(p, q)],
                    dispRight: [xT(r), nT(t)],
                },
                signe: s,
                mirall: false,
                sol,
            };
        }
        const { m, n, a, c, s, mes } = d;
        const L = (m * n) / mcd(m, n);
        const [k1, k2] = [L / m, L / n];
        return {
            eq: {
                leftA: mes ? k1 + k2 : k1 - k2,
                leftB: k1 * a,
                rightC: 0,
                rightD: c * L,
                xSol,
                dispLeft: [pT(k1, a), xT(mes ? k2 : -k2)],
                dispRight: [nT(c * L)],
            },
            signe: s,
            mirall: false,
            sol,
            denominadors: { m, n, a, c, mes, L, k1, k2 },
        };
    }

    /**
     * Una línia de la pissarra a partir de les peces de les equacions: el signe de desigualtat (el canònic, s) al
     * lloc del «=», la solució fraccionària amb \dfrac i, amb mirall, els dos membres girats (i el signe també).
     */
    function linia(peces, s, P, { marca = '', mirall = P.mirall } = {}) {
        const [n, d] = P.sol;
        const decimal = d === 1 ? null : String(Math.abs(n / d));
        let ps = peces.map(p => {
            if (p.id === 'q') return { ...p, t: TEX_SIGNE[mirall ? GIRA[s] : s], marca };
            if (decimal !== null && p.t === decimal) return { ...p, frac: [Math.abs(n), d] };
            return p;
        });
        if (mirall) {
            const i = ps.findIndex(p => p.id === 'q');
            ps = [...ps.slice(i + 1), ps[i], ...ps.slice(0, i)];
        }
        return { peces: ps };
    }

    /** El pintor de l'historial: una línia en TeX (amb fraccions i marques) o la recta (SVG). */
    function pinta(l, clauDe) {
        if (l.recta) return svgRecta({ ...l.recta, clau: clauDe('n') });
        const una = p => {
            if (p.fraccio) return `\\dfrac{${p.fraccio[0].map(una).join('')}}{${p.fraccio[1].map(una).join('')}}`;
            const s = clau(clauDe(p.id), p.frac ? `\\dfrac{${p.frac[0]}}{${p.frac[1]}}` : tex(p.t), p.marca || '');
            if (p.tipus === 'igual') return `\\mathrel{${s}}`;
            return p.tipus === 'op' || p.t === '·' ? `\\mathbin{${s}}` : s;
        };
        return l.peces.map(una).join('');
    }

    // ---- EL NIVELL 4: TREURE ELS DENOMINADORS ----

    /** Les peces de la inequació del nivell 4: (x + a)/m ± x/n ⊙ c. */
    function pecesDenominadors({ m, n, a, c, mes }) {
        const num = [pc('Fx', 'x', 'x'), pc('Ft', a > 0 ? '+' : '−', 'op'), pc('Fm', Math.abs(a))];
        return {
            num,
            peces: [
                { fraccio: [num, [pc('Fd', m)]] },
                pc('Fo', mes ? '+' : '−', 'op'),
                { fraccio: [[pc('Gx', 'x', 'x')], [pc('Gd', n)]] },
                IGUAL(),
                ...(c < 0 ? [pc('Rs', '−')] : []),
                pc('Rc', Math.abs(c)),
            ],
        };
    }

    /** El pas de treure els denominadors (i el seu detall): de (x + a)/m ± x/n ⊙ c a k1(x + a) ± k2·x ⊙ c·L. */
    function escriuDenominadors(H, P, s) {
        const { m, n, c, mes, L, k1, k2 } = P.denominadors;
        const { num } = pecesDenominadors(P.denominadors);
        const nova = linia(Equacions.pecesDe({ left: P.eq.dispLeft, right: P.eq.dispRight }), s, P);
        const baixen = { L0x: 'Fx', L0t: 'Ft', L0m: 'Fm', L1x: 'Gx', L1s: 'Fo' };
        const op = {
            mou: { ...baixen, R0n: 'Rc', ...(c < 0 ? { R0s: 'Rs' } : {}) },
            titol: 'Detall: treure els denominadors',
            detall: D => {
                const multiplicada = [
                    pc('A1', L),
                    pc('d1', '·'),
                    { fraccio: [num, [pc('Fd', m)]] },
                    pc('Fo', mes ? '+' : '−', 'op'),
                    pc('A2', L),
                    pc('d2', '·'),
                    { fraccio: [[pc('Gx', 'x', 'x')], [pc('Gd', n)]] },
                    IGUAL(),
                    pc('A3', L),
                    pc('d3', '·'),
                    pc('Rc', factor(c)),
                ];
                const queden = { Fx: 'Fx', Ft: 'Ft', Fm: 'Fm', Fd: 'Fd', Fo: 'Fo', Gx: 'Gx', Gd: 'Gd' };
                D.escriu(
                    linia(multiplicada, s, P),
                    `Multiplica els dos membres per ${L}: com que és positiu, la desigualtat es manté.`,
                    c < 0 ? { mou: queden, fusiona: { Rc: ['Rs', 'Rc'] } } : { mou: { ...queden, Rc: 'Rc' } }
                );
                const fusiona = { R0n: ['A3', 'Rc'] };
                if (k1 !== 1) fusiona.L0c = ['A1', 'Fd'];
                if (k2 !== 1) fusiona.L1c = ['A2', 'Gd'];
                D.acaba(
                    `Simplifica: $${L} : ${m} = ${k1}$, $${L} : ${n} = ${k2}$ i $${L} \\cdot ${tex(factor(c))} = ${tex(ambSigne(L * c))}$.`,
                    { mou: baixen, fusiona }
                );
            },
        };
        H.escriu(
            nova,
            `Treu els denominadors: multiplica els dos membres per $${L}$, el m.c.m. de $${m}$ i $${n}$.`,
            op
        );
    }

    /**
     * Quan un membre val 0 (la solució 0, als nivells 1 i 2), les equacions l'escriuen amb la peça R0z i no
     * R0n (a les equacions no passa mai): els moviments que hi van a parar passen a R0z.
     */
    function ambZero(op, peces) {
        if (!op || !peces.some(p => p.id === 'R0z') || peces.some(p => p.id === 'R0n')) return op;
        const out = { ...op };
        for (const c of ['mou', 'fusiona'])
            if (out[c] && out[c].R0n !== undefined) {
                const { R0n, ...resta } = out[c];
                out[c] = { ...resta, R0z: R0n };
            }
        return out;
    }

    // ---- LES FRASES ----

    /** El coeficient de la x i el nombre de la dreta abans d'aïllar (la forma canònica). */
    function divisio(pas) {
        const a = pas.dispLeftBefore.find(t => t.k === 'x').c;
        const n = pas.dispRightBefore.find(t => t.k === 'n');
        return { a, b: n ? n.v : 0 };
    }

    /** La frase d'un pas tancat (segona persona), com a la pissarra de les equacions. */
    function frase(pas, P) {
        if (pas.type === 'group_x') return "Passa els termes amb x a l'esquerra.";
        if (pas.type === 'group_num')
            return P.mirall ? "Passa els nombres a l'esquerra." : 'Passa els nombres a la dreta.';
        if (pas.type === 'solve') {
            const { a, b } = divisio(pas);
            const base = `Aïlla la x: divideix $${tex(ambSigne(b))}$ entre $${tex(ambSigne(a))}$.`;
            return a < 0 ? `${base} Com que divideixes per un nombre negatiu, el signe de desigualtat canvia.` : base;
        }
        return `${pas.instruction}.`;
    }

    /** Les frases del detall de les equacions, dites per a una desigualtat. */
    const desigualtat = text => text.replace('la igualtat es manté', 'la desigualtat es manté');

    // ---- LA PISSARRA ----

    /** Les files de la pissarra d'una inequació: totes les línies, amb tots els passos oberts. */
    function files(ex, P = planteja(ex), etapes = MathEngine.determineSteps(P.eq)) {
        let n = 1 + (P.denominadors ? 2 : 0) + (P.mirall ? 1 : 0) + 2;
        for (const pas of etapes) {
            const det = Equacions.detallPas(pas);
            n += 1 + (det ? det.subpassos.length : 0);
        }
        return n;
    }

    /**
     * El guió d'una inequació: la primera línia, una línia per pas (amb el detall dels passos d'«oberts»), la
     * x a l'esquerra si era a la dreta, la recta i l'interval.
     */
    function passos(ex, { oberts = new Set() } = {}) {
        const P = planteja(ex);
        const etapes = MathEngine.determineSteps(P.eq);
        const g = guio(files(ex, P, etapes));
        const H = historial(g, { prefix: 'I', pinta, oberts, objectiu: true });
        let s = P.signe;
        const inicial = P.denominadors
            ? linia(pecesDenominadors(P.denominadors).peces, s, P)
            : linia(Equacions.pecesDe({ left: P.eq.dispLeft, right: P.eq.dispRight }), s, P);
        H.escriu(inicial, `Resol la inequació $${ex.tex}$.`);
        if (P.denominadors) escriuDenominadors(H, P, s);

        for (const pas of etapes) {
            const { a, b } = pas.type === 'solve' ? divisio(pas) : {};
            const gira = pas.type === 'solve' && a < 0;
            if (gira) s = GIRA[s];
            const despres = Equacions.pecesDe({ left: pas.dispLeftAfter, right: pas.dispRightAfter });
            const op = ambZero(Equacions.moviments(pas), despres);
            // el signe baixa volant i canvia (ressaltat)
            if (gira) op.mou.q = 'q';
            const det = Equacions.detallPas(pas);
            if (det) {
                const titol = P.mirall ? det.titol.replace('a la dreta', "a l'esquerra") : det.titol;
                const textAcaba =
                    pas.type === 'solve'
                        ? `Fes la divisió: $${tex(ambSigne(b))} : ${tex(factor(a))} = ${texQ(P.sol)}$.`
                        : det.textAcaba;
                Object.assign(op, {
                    titol,
                    detall: D => {
                        det.subpassos.forEach((sp, j) => {
                            const divideix = pas.type === 'solve' && j === 0;
                            const text = divideix
                                ? `Divideix els dos membres per ${ambSigne(a)}: ${
                                      gira
                                          ? 'com que és negatiu, el signe de desigualtat canvia.'
                                          : 'com que és positiu, la desigualtat es manté.'
                                  }`
                                : desigualtat(sp.text);
                            const opSp = { mou: sp.mou, fusiona: sp.fusiona, reparteix: sp.reparteix };
                            if (divideix && gira) opSp.mou = { ...(sp.mou || {}), q: 'q' };
                            D.escriu(linia(sp.linia.peces, s, P, { marca: divideix && gira ? MARCA : '' }), text, opSp);
                        });
                        D.acaba(textAcaba, ambZero(det.acaba, despres));
                    },
                });
            }
            H.escriu(linia(despres, s, P, { marca: gira ? MARCA : '' }), frase(pas, P), op);
        }

        // La línia «x ⊙ solució» (la forma canònica, sense girar): les peces L0x, q, R0s (si és negativa) i el
        // nombre, N (R0n, o R0z si és 0)
        const xSol = Equacions.pecesDe({ left: [xT(1)], right: [nT(P.eq.xSol)] });
        const negativa = P.sol[0] < 0;
        const N = P.sol[0] === 0 ? 'R0z' : 'R0n';
        if (P.mirall) {
            const girada = linia(xSol, s, P);
            const recta = linia(xSol, s, P, { marca: MARCA, mirall: false });
            const texDe = l =>
                l.peces
                    .map(p => (p.frac ? `\\dfrac{${p.frac[0]}}{${p.frac[1]}}` : p.id === 'q' ? ` ${p.t} ` : tex(p.t)))
                    .join('');
            H.escriu(
                recta,
                `Escriu-la amb la x a l'esquerra: $${texDe(girada)}$ vol dir el mateix que $${texDe(recta)}$. El signe de desigualtat canvia.`,
                { mou: { L0x: 'L0x', q: 'q', [N]: N, ...(negativa ? { R0s: 'R0s' } : {}) } }
            );
        }

        // La recta: el nombre hi baixa volant
        const pasRecta = ex.passos.find(p => p.mena === 'recta');
        const { i, ple, costat } = pasRecta.solucio.rc;
        const sol = texQ(P.sol);
        H.escriu(
            { recta: { marques: pasRecta.dades.marques, punt: { i, ple }, costat } },
            `Dibuixa la solució a la recta: són els nombres més ${costat === 'esq' ? 'petits' : 'grans'} que $${sol}$; el $${sol}$ ${
                ple ? 'hi entra (punt ple)' : 'no hi entra (punt buit)'
            }.`,
            negativa ? { fusiona: { n: ['R0s', N] } } : { mou: { n: N } }
        );

        // L'interval: les peces de l'activitat; la x i el nombre baixen de la línia «x ⊙ solució»
        const pasInterval = ex.passos.find(p => p.mena === 'interval');
        const { o, e1, e2, t } = pasInterval.solucio;
        // amb una fracció, els parèntesis i els claudàtors grans (\Bigl, \Bigr), perquè l'abracin
        const gran = { '(': '\\Bigl(', '[': '\\Bigl[', ')': '\\Bigr)', ']': '\\Bigr]' };
        const fitxa = id => {
            const t = pasInterval.fitxes.find(f => f.id === id).tex;
            return P.sol[1] !== 1 && gran[t] ? gran[t] : t;
        };
        const extrem = (id, nom) => (id === 'n' ? pc('n', fitxa(id)) : pc(nom, fitxa(id)));
        const interval = [
            pc('x', 'x', 'x'),
            pc('e', '\\in', 'igual'),
            pc('o', fitxa(o)),
            extrem(e1, 'a'),
            pc('c', ',\\,'),
            extrem(e2, 'b'),
            pc('t', fitxa(t)),
        ];
        H.escriu(
            { peces: interval },
            `Escriu la solució com a interval: el $${sol}$ ${
                ple ? 'hi entra, claudàtor' : 'no hi entra, parèntesi'
            }; a l'infinit, sempre parèntesi.`,
            {
                mou: { x: 'L0x@2', ...(negativa ? {} : { n: `${N}@2` }) },
                ...(negativa ? { fusiona: { n: ['R0s@2', `${N}@2`] } } : {}),
                final: true,
            }
        );
        return g.passos;
    }

    /** Una inequació nova del nivell (1–4, com els de l'activitat). */
    const exercici = nivell => generaPreguntaIQ(nivell);

    return Object.freeze({ NIVELLS: [1, 2, 3, 4], exercici, passos, files, planteja });
})();
