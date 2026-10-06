/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/prioritat/math-engine.js
 * ROL: Motor matemàtic pur de «Prioritat d'operacions» (sense DOM): avaluació
 *      d'expressions (amb les regles correctes i amb els errors típics),
 *      distractors, diagnòstic de l'error, generadors per nivell i resolució
 *      pas a pas (també la de la modalitat «Pas a pas»).
 * ARQUITECTURA:
 * - Una expressió és un array de tokens:
 *     {k:'num', v}   {k:'op', v:'+'|'-'|'·'|':'}   {k:'pow', b, e}   {k:'lp'}   {k:'rp'}
 * - evaluate(toks, cfg) l'avalua. Amb cfg = {} aplica les regles CORRECTES; amb
 *   altres cfg simula els ERRORS TÍPICS dels alumnes (MISCONCEPTIONS).
 * - La resolució treballa amb «línies»: els tokens d'un pas, cadascun amb les
 *   columnes de l'enunciat que ocupa [c0, c1). Cada pas fa UNA operació i el
 *   resultat ocupa les columnes de tot el que substitueix. Escrites en una
 *   taula, cada resultat queda centrat sota l'operació d'on surt: és la
 *   disposició «centrat» del projecte combinades (la pinta renderer.js).
 * - solve() resol en l'ordre «de llibre»: primer el parèntesi de més endins i
 *   més a l'esquerra; a dins, les potències, després · i :, i després + i −,
 *   d'esquerra a dreta. A la modalitat «Pas a pas», l'alumne pot fer qualsevol
 *   operació que ja es pugui fer (readyOps: les dues dades ja són nombres);
 *   si en tria una que encara no, blockers() diu quines calia fer abans i per què.
 * - Fa servir Math.random (randInt, pick, shuffle), que amb ?fixed=A/B/C està
 *   sembrat per a cada pregunta (js/fixed-sessions.js). Si canvia l'ordre en
 *   què es demanen nombres a l'atzar, canvien les preguntes de les sessions
 *   fixes: tests/modules.test.js en guarda una empremta.
 * DEPENDÈNCIES: utils.js (randInt, pick, shuffle).
 * ============================================================================
 */
import { pick, randInt, shuffle } from '../utils.js';

export const MathEngine = (() => {
    const N = v => ({ k: 'num', v });
    const O = v => ({ k: 'op', v });
    const P = (b, e) => ({ k: 'pow', b, e });
    const L = () => ({ k: 'lp' });
    const R = () => ({ k: 'rp' });

    const PREC_OK = { '+': 1, '-': 1, '·': 2, ':': 2 }; // regla correcta
    const PREC_FLAT = { '+': 1, '-': 1, '·': 1, ':': 1 }; // tot igual → esquerra a dreta
    const PREC_INV = { '+': 2, '-': 2, '·': 1, ':': 1 }; // sumes/restes primer
    const POST_PREC = 1.5; // "l'exponent afecta tot el producte" (entre + i ·)

    const MAX_RESULT = 200; // resultat correcte màxim (càlcul mental a 1r ESO)
    const MAX_DISTRACTOR = 999;

    // ============================================================
    // AVALUACIÓ (correcta i amb els errors típics)
    // evaluate() retorna null si en algun moment surt un resultat
    // negatiu, no enter o una divisió per zero.
    // ============================================================

    // Converteix l'expressió a notació polonesa inversa segons les regles de cfg.
    // Cada element recorda la posició (idx) del token original, per poder
    // reconstruir després quina operació s'ha fet i en quin ordre.
    function toRPN(toks, cfg) {
        const prec = cfg.prec || PREC_OK;
        const stream = [];
        toks.forEach((t, i) => {
            if (t.k === 'pow') {
                if (cfg.pow === 'mult') stream.push({ k: 'num', v: t.b * t.e, idx: i });
                else if (cfg.pow === 'postfix') {
                    stream.push({ k: 'num', v: t.b, idx: i });
                    stream.push({ k: 'post', e: t.e, idx: i });
                } else stream.push({ k: 'num', v: Math.pow(t.b, t.e), idx: i });
            } else if (t.k === 'lp' || t.k === 'rp') {
                if (cfg.parens !== false) stream.push({ k: t.k, idx: i });
            } else {
                stream.push(Object.assign({ idx: i }, t));
            }
        });
        // Shunting-yard
        const out = [],
            st = [];
        for (const t of stream) {
            if (t.k === 'num') out.push(t);
            else if (t.k === 'op') {
                while (st.length) {
                    const top = st[st.length - 1];
                    if (top.k !== 'op') break;
                    const pt = prec[top.v],
                        pc = prec[t.v];
                    if (pt > pc || (pt === pc && !cfg.rtl)) out.push(st.pop());
                    else break;
                }
                st.push(t);
            } else if (t.k === 'post') {
                while (st.length && st[st.length - 1].k === 'op' && prec[st[st.length - 1].v] > POST_PREC)
                    out.push(st.pop());
                out.push(t);
            } else if (t.k === 'lp') st.push(t);
            else if (t.k === 'rp') {
                while (st.length && st[st.length - 1].k !== 'lp') out.push(st.pop());
                if (!st.length) return null;
                st.pop();
            }
        }
        while (st.length) {
            const t = st.pop();
            if (t.k === 'lp') return null;
            out.push(t);
        }
        return out;
    }

    function evaluate(toks, cfg) {
        const out = toRPN(toks, cfg);
        if (!out) return null;
        // Avaluació amb control de validesa a cada pas
        const vs = [];
        for (const t of out) {
            if (t.k === 'num') {
                vs.push(t.v);
                continue;
            }
            if (t.k === 'post') {
                if (!vs.length) return null;
                vs.push(Math.pow(vs.pop(), t.e));
                continue;
            }
            if (vs.length < 2) return null;
            const b = vs.pop(),
                a = vs.pop();
            let r;
            if (t.v === '+') r = a + b;
            else if (t.v === '-') r = a - b;
            else if (t.v === '·') r = a * b;
            else {
                if (b === 0) return null;
                r = a / b;
            }
            if (!Number.isInteger(r) || r < 0) return null;
            vs.push(r);
        }
        return vs.length === 1 ? vs[0] : null;
    }

    // Errors típics, per ordre de prioritat a l'hora de triar distractors
    const MISCONCEPTIONS = [
        { id: 'lr', cfg: { prec: PREC_FLAT } }, // tot d'esquerra a dreta
        { id: 'addfirst', cfg: { prec: PREC_INV } }, // sumes/restes abans
        { id: 'rtl', cfg: { rtl: true } }, // mateix nivell de dreta a esquerra
        { id: 'nopar', cfg: { parens: false } }, // ignora parèntesis
        { id: 'powterm', cfg: { pow: 'postfix' } }, // 2·3² = 6²
        { id: 'powmult', cfg: { pow: 'mult' } }, // 3² = 3·2
        { id: 'lrnopar', cfg: { prec: PREC_FLAT, parens: false } }, // ignora parèntesis i esquerra a dreta
        { id: 'lrpowmult', cfg: { prec: PREC_FLAT, pow: 'mult' } }, // esquerra a dreta + 3² = 3·2
    ];

    // Retorna Map(valor → id de l'error) amb els errors que donen un valor vàlid i diferent del correcte
    function misconceptionMap(toks, correct) {
        const map = new Map();
        for (const m of MISCONCEPTIONS) {
            const v = evaluate(toks, m.cfg);
            if (v === null || v === correct || v > MAX_DISTRACTOR) continue;
            if (!map.has(v)) map.set(v, m.id);
        }
        return map;
    }

    // 3 distractors: primer els que surten d'errors de prioritat; si no n'hi ha prou,
    // valors propers (a la correcta i al primer distractor, per no delatar la resposta)
    function buildDistractors(toks, correct) {
        const chosen = [...misconceptionMap(toks, correct).entries()].slice(0, 3).map(([v, id]) => ({ v, id }));
        const used = new Set([correct, ...chosen.map(c => c.v)]);
        const anchor = chosen.length ? chosen[0].v : correct;
        const pool = shuffle([
            correct + 1,
            correct - 1,
            correct + 2,
            correct - 2,
            correct + 10,
            correct - 10,
            anchor + 1,
            anchor - 1,
            anchor + 2,
        ]);
        for (const v of pool) {
            if (chosen.length >= 3) break;
            if (v < 0 || used.has(v)) continue;
            used.add(v);
            chosen.push({ v, id: 'calc' });
        }
        return chosen;
    }

    // ------------------------------------------------------------
    // DIAGNÒSTIC GRÀFIC DE L'ERROR
    // Es reconstrueix l'arbre d'operacions que ha fet l'alumne (segons l'error
    // que correspon a la resposta triada) i es compara amb l'arbre correcte.
    // La primera operació de l'alumne que no agrupa els mateixos nombres que
    // a l'arbre correcte és la que "ha fet massa aviat" (vermell); les que
    // calia fer abans són les que, a l'arbre correcte, s'emporten algun dels
    // seus operands (verd).
    // ------------------------------------------------------------
    function parseTree(toks, cfg) {
        const out = toRPN(toks, cfg);
        if (!out) return null;
        const stack = [],
            order = [];
        for (const t of out) {
            if (t.k === 'num') {
                stack.push({ leaf: true, key: 'L' + t.idx, idx: t.idx });
                continue;
            }
            const kids =
                t.k === 'post'
                    ? [stack.pop()]
                    : (() => {
                          const b = stack.pop(),
                              a = stack.pop();
                          return [a, b];
                      })();
            const node = { post: t.k === 'post', idx: t.idx, key: t.k === 'post' ? 'L' + t.idx : t.idx, kids };
            stack.push(node);
            order.push(node);
        }
        return stack.length === 1 ? { root: stack[0], order } : null;
    }

    function leavesOf(node) {
        if (node.leaf) return [node.key];
        return node.kids.flatMap(leavesOf);
    }

    function diagnose(toks, id) {
        const m = MISCONCEPTIONS.find(x => x.id === id);
        if (!m) return null;
        const res = { red: new Set(), green: new Set(), powRed: -1 };

        // Error de potència (3² = 3·2): es marca la potència
        if (m.cfg.pow === 'mult') {
            res.powRed = toks.findIndex(t => t.k === 'pow');
            if (res.powRed >= 0) res.red.add(res.powRed);
        }

        const ct = parseTree(toks, {});
        const st = parseTree(toks, m.cfg);
        if (!ct || !st) return res.red.size ? res : null;

        // Arbre correcte: pare de cada node i nombres que agrupa cada operació
        const parent = new Map(),
            spanC = new Map();
        (function walk(n) {
            if (n.leaf) return;
            spanC.set(n.idx, leavesOf(n).sort().join(','));
            for (const k of n.kids) {
                parent.set(k.key, n.idx);
                walk(k);
            }
        })(ct.root);

        for (const node of st.order) {
            if (node.post) {
                // L'exponent s'aplica a una operació sencera (2·3² → 6²)
                const kid = node.kids[0];
                if (!kid.leaf) {
                    res.red.add(kid.idx);
                    res.green.add(node.idx);
                    res.powKid = kid;
                    break;
                }
                continue;
            }
            if (spanC.get(node.idx) !== leavesOf(node).sort().join(',')) {
                res.red.add(node.idx);
                for (const kid of node.kids) {
                    const p = parent.get(kid.key);
                    if (p !== undefined && p !== node.idx) res.green.add(p);
                }
                break;
            }
        }
        return res.red.size ? res : null;
    }

    // Tokens contigus que ocupa un node de l'arbre (amb els parèntesis equilibrats)
    function nodeRange(toks, node) {
        const idxs = [];
        (function walk(n) {
            idxs.push(n.idx);
            if (!n.leaf) n.kids.forEach(walk);
        })(node);
        let a = Math.min(...idxs),
            b = Math.max(...idxs);
        const depth = (x, y) => toks.slice(x, y + 1).reduce((d, t) => d + (t.k === 'lp') - (t.k === 'rp'), 0);
        while (a > 0 && depth(a, b) < 0) a--;
        while (b < toks.length - 1 && depth(a, b) > 0) b++;
        return [a, b];
    }

    // ------------------------------------------------------------
    // GENERADORS PER NIVELL (0 = més fàcil ... 9 = més difícil)
    // Cada variant retorna un array de tokens amb nombres aleatoris.
    // Les expressions no vàlides (negatius, divisions no exactes) o que
    // no permeten cap error de prioritat es descarten a generateExercise().
    // ------------------------------------------------------------
    const r = (a, b) => randInt(a, b);

    const LEVELS = [
        // 0 · Suma o resta amb un producte/quocient a la dreta        ex: 7 + 2·2
        [
            () => [N(r(2, 9)), O('+'), N(r(2, 6)), O('·'), N(r(2, 6))],
            () => {
                const b = r(2, 5),
                    c = r(2, 5);
                return [N(b * c + r(1, 9)), O('-'), N(b), O('·'), N(c)];
            },
            () => {
                const c = r(2, 5);
                return [N(c * r(1, 4)), O('+'), N(c * r(2, 6)), O(':'), N(c)];
            },
            () => {
                const c = r(2, 5),
                    q = r(2, 5);
                return [N(c * r(q + 1, q + 5)), O('-'), N(c * q), O(':'), N(c)];
            },
        ],
        // 1 · Dos productes o quocients                                ex: 8·7 − 24:3
        [
            () => [N(r(2, 9)), O('·'), N(r(2, 9)), O('+'), N(r(2, 9)), O('·'), N(r(2, 9))],
            () => [N(r(2, 9)), O('·'), N(r(2, 9)), O('-'), N(r(2, 9)), O('·'), N(r(2, 9))],
            () => {
                const d = r(2, 6);
                return [N(r(2, 9)), O('·'), N(r(2, 9)), O('+'), N(d * r(2, 9)), O(':'), N(d)];
            },
            () => {
                const d = r(2, 6);
                return [N(r(2, 9)), O('·'), N(r(2, 9)), O('-'), N(d * r(2, 9)), O(':'), N(d)];
            },
            () => {
                const b = r(2, 6);
                return [N(b * r(2, 9)), O(':'), N(b), O('+'), N(r(2, 9)), O('·'), N(r(2, 9))];
            },
        ],
        // 2 · Sumes i restes amb un producte                           ex: 3 + 4 − 2·2
        [
            () => [N(r(2, 12)), O('+'), N(r(2, 12)), O('-'), N(r(2, 5)), O('·'), N(r(2, 5))],
            () => [N(r(10, 25)), O('-'), N(r(2, 9)), O('+'), N(r(2, 5)), O('·'), N(r(2, 5))],
            () => [N(r(12, 30)), O('-'), N(r(2, 5)), O('·'), N(r(2, 5)), O('+'), N(r(2, 9))],
            () => [N(r(2, 9)), O('·'), N(r(2, 9)), O('-'), N(r(2, 9)), O('+'), N(r(2, 9))],
        ],
        // 3 · Operacions del mateix nivell seguides (esquerra a dreta)  ex: 24 : 4 · 2   ·   20 − 8 − 3
        [
            () => {
                const b = r(2, 5),
                    c = r(2, 4),
                    k = r(1, 3);
                return [N(b * c * k), O(':'), N(b), O('·'), N(c)];
            },
            () => {
                const c = r(2, 3),
                    b = c * r(1, 3),
                    k = r(1, 5);
                return [N(b * c * k), O(':'), N(b), O(':'), N(c)];
            },
            () => {
                const b = r(5, 12),
                    c = r(2, b - 1);
                return [N(b + c + r(2, 12)), O('-'), N(b), O('-'), N(c)];
            },
            () => {
                const c = r(2, 5);
                return [N(r(2, 15)), O('+'), N(c * r(2, 6)), O(':'), N(c), O('·'), N(r(2, 4))];
            },
            () => {
                const b = r(2, 6);
                return [N(b * r(2, 6)), O(':'), N(b), O('·'), N(r(2, 5)), O('+'), N(r(2, 9))];
            },
        ],
        // 4 · Potències                                                ex: 2·3²
        [
            () => [N(r(2, 5)), O('·'), P(r(3, 6), 2)],
            () => [N(r(2, 4)), O('·'), P(r(2, 3), 3)],
            () => [N(r(2, 9)), O('+'), P(r(2, 5), 2), O('·'), N(r(2, 4))],
            () => [P(r(4, 9), 2), O('-'), N(r(2, 5)), O('·'), N(r(2, 5))],
        ],
        // 5 · Potències amb altres operacions                          ex: 5 + 2·3²
        [
            () => [N(r(2, 9)), O('+'), N(r(2, 4)), O('·'), P(r(2, 5), 2)],
            () => [N(r(2, 5)), O('·'), P(r(2, 5), 2), O('-'), N(r(2, 9))],
            () => [P(r(2, 6), 2), O('+'), N(r(2, 4)), O('·'), P(r(2, 4), 2)],
            () => {
                const c = r(2, 5),
                    b = c * r(1, 2);
                return [N(c * r(1, 4)), O('+'), P(b, 2), O(':'), N(c)];
            },
        ],
        // 6 · Parèntesis                                               ex: 2·(3 + 4)
        [
            () => [N(r(2, 6)), O('·'), L(), N(r(2, 9)), O('+'), N(r(2, 9)), R()],
            () => [N(r(2, 9)), O('+'), N(r(2, 5)), O('·'), L(), N(r(2, 6)), O('+'), N(r(2, 6)), R()],
            () => [L(), N(r(2, 9)), O('+'), N(r(2, 9)), R(), O('·'), N(r(2, 5)), O('-'), N(r(2, 9))],
            () => {
                const b = r(2, 5),
                    c = r(2, 5),
                    d = r(2, 4);
                return [N((b + c) * d + r(1, 15)), O('-'), L(), N(b), O('+'), N(c), R(), O('·'), N(d)];
            },
            () => [N(r(2, 6)), O('·'), L(), N(r(6, 12)), O('-'), N(r(2, 5)), R(), O('+'), N(r(2, 9))],
        ],
        // 7 · Parèntesis amb restes i divisions                        ex: 15 − (8 − 3)
        [
            () => {
                const b = r(6, 12),
                    c = r(2, b - 2);
                return [N(b + c + r(0, 10)), O('-'), L(), N(b), O('-'), N(c), R()];
            },
            () => {
                const c = r(2, 5),
                    b = c * r(1, 3);
                return [L(), N(b + c * r(2, 6)), O('-'), N(b), R(), O(':'), N(c), O('+'), N(r(2, 9))];
            },
            () => {
                const d = r(2, 5),
                    s = d * r(2, 5),
                    b = r(2, s - 2);
                return [N(d * r(1, 4)), O('+'), L(), N(b), O('+'), N(s - b), R(), O(':'), N(d)];
            },
            () => [
                N(r(2, 5)),
                O('·'),
                L(),
                N(r(2, 6)),
                O('+'),
                N(r(2, 6)),
                R(),
                O('-'),
                N(r(2, 5)),
                O('·'),
                N(r(2, 5)),
            ],
        ],
        // 8 · Parèntesis i potències                                   ex: 3·(2 + 4) − 2²
        [
            () => [N(r(2, 6)), O('·'), L(), N(r(2, 6)), O('+'), N(r(2, 6)), R(), O('-'), P(r(2, 5), 2)],
            () => [L(), N(r(8, 15)), O('-'), N(r(2, 6)), R(), O('·'), N(r(2, 4)), O('+'), P(r(2, 5), 2)],
            () => [P(r(5, 9), 2), O('-'), L(), N(r(2, 5)), O('+'), N(r(2, 5)), R(), O('·'), N(r(2, 4))],
            () => [N(r(2, 9)), O('+'), P(r(2, 4), 2), O('·'), L(), N(r(5, 9)), O('-'), N(r(2, 4)), R()],
        ],
        // 9 · Tot combinat
        [
            () => [
                L(),
                N(r(2, 9)),
                O('+'),
                N(r(2, 9)),
                R(),
                O('·'),
                N(r(2, 5)),
                O('-'),
                N(r(2, 5)),
                O('·'),
                N(r(2, 5)),
            ],
            () => {
                const e = r(2, 5),
                    s = e * r(2, 5),
                    c = r(2, s - 2);
                return [N(r(2, 4)), O('·'), P(r(2, 5), 2), O('-'), L(), N(c), O('+'), N(s - c), R(), O(':'), N(e)];
            },
            () => {
                const e = r(2, 5),
                    b = e * r(1, 2),
                    c = r(5, 12);
                return [N(r(2, 12)), O('+'), N(b), O('·'), L(), N(c), O('-'), N(r(2, c - 1)), R(), O(':'), N(e)];
            },
            () => [
                P(r(4, 9), 2),
                O('-'),
                N(r(2, 4)),
                O('·'),
                L(),
                N(r(5, 9)),
                O('-'),
                N(r(2, 4)),
                R(),
                O('+'),
                N(r(2, 9)),
            ],
            () => {
                const c = r(2, 5),
                    s = c * r(2, 5),
                    a = r(2, s - 2);
                return [L(), N(a), O('+'), N(s - a), R(), O(':'), N(c), O('+'), N(r(2, 4)), O('·'), P(r(2, 3), 2)];
            },
        ],
    ];

    // Tria una variant del nivell i en genera nombres fins que l'expressió sigui vàlida
    // i "discriminant" (almenys 1 error de prioritat, preferiblement 2 o més).
    function generateExercise(level) {
        const variants = LEVELS[Math.max(0, Math.min(level, LEVELS.length - 1))];
        for (let v = 0; v < 6; v++) {
            const gen = pick(variants);
            let best = null;
            for (let tries = 0; tries < 200; tries++) {
                const toks = gen();
                const val = evaluate(toks, {});
                if (val === null || val > MAX_RESULT) continue;
                const nMis = misconceptionMap(toks, val).size;
                if (nMis === 0) continue;
                if (!best || nMis > best.nMis) best = { toks, val, nMis };
                if (nMis >= 2) break;
            }
            if (best) return best;
        }
        // Salvaguarda: a + b·c sempre és vàlida i discriminant
        const toks = [N(r(2, 9)), O('+'), N(r(2, 6)), O('·'), N(r(2, 6))];
        return { toks, val: evaluate(toks, {}), nMis: 1 };
    }

    // ============================================================
    // RESOLUCIÓ PAS A PAS
    // Una «línia» és l'expressió d'un pas: els tokens, cadascun amb les
    // columnes de l'enunciat que ocupa [c0, c1). A l'enunciat, el token i
    // ocupa la columna i; el resultat d'una operació ocupa les columnes de tot
    // el que substitueix (i les dels parèntesis, si en treu). Per exemple:
    //
    //     columnes:  0 1 2 3 4 5 6 7 8
    //     enunciat:  2 + 3 · ( 5 − 2 )        (a sota, cada pas, centrat)
    //     pas 1:     2 + 3 ·     3              el 3 ocupa les columnes 4-8
    //     pas 2:     2 +     9                  el 9 ocupa les columnes 2-8
    //     pas 3:        11                      l'11, totes
    // ============================================================
    function innermostParen(toks) {
        let o = -1;
        for (let i = 0; i < toks.length; i++) {
            if (toks[i].k === 'lp') o = i;
            if (toks[i].k === 'rp' && o !== -1) return [o, i];
        }
        return null;
    }

    // L'operació següent en l'ordre «de llibre» (parèntesis → potències → · : → + −, d'esquerra a dreta)
    function nextStep(toks) {
        const rg = innermostParen(toks);
        const s = rg ? rg[0] + 1 : 0;
        const e = rg ? rg[1] - 1 : toks.length - 1;
        for (let i = s; i <= e; i++) if (toks[i].k === 'pow') return { kind: 'pow', i };
        for (let i = s; i <= e; i++)
            if (toks[i].k === 'op' && (toks[i].v === '·' || toks[i].v === ':')) return { kind: 'op', i };
        for (let i = s; i <= e; i++) if (toks[i].k === 'op') return { kind: 'op', i };
        return null;
    }

    // La línia de l'enunciat: el token i, a la columna i
    function startLine(toks) {
        return toks.map((t, i) => Object.assign({}, t, { c0: i, c1: i + 1 }));
    }

    // Les posicions [p, q] dels tokens d'una operació que ja es pot fer: una
    // potència és ella sola; una operació, el signe i els dos nombres del costat
    function opRange(line, i) {
        return line[i].k === 'pow' ? [i, i] : [i - 1, i + 1];
    }

    // El resultat de l'operació de la posició i (ja s'ha de poder fer)
    function opValue(line, i) {
        const t = line[i];
        if (t.k === 'pow') return Math.pow(t.b, t.e);
        const a = line[i - 1].v,
            b = line[i + 1].v;
        return t.v === '+' ? a + b : t.v === '-' ? a - b : t.v === '·' ? a * b : a / b;
    }

    // La línia següent quan es fa l'operació de la posició i. Si el resultat queda
    // sol entre parèntesis, els parèntesis cauen (i el resultat ocupa també les seves columnes).
    function applyAt(line, i) {
        const [p, q] = opRange(line, i);
        const num = { k: 'num', v: opValue(line, i), c0: line[p].c0, c1: line[q].c1 };
        const out = line.slice(0, p).concat([num], line.slice(q + 1));
        if (out[p - 1] && out[p - 1].k === 'lp' && out[p + 1] && out[p + 1].k === 'rp') {
            num.c0 = out[p - 1].c0;
            num.c1 = out[p + 1].c1;
            out.splice(p - 1, 3, num);
        }
        return out;
    }

    // Resol des d'una línia en l'ordre «de llibre»: [{ line, op }], fins al resultat.
    // op és la posició de l'operació que es fa per passar a la línia següent (-1 a l'última).
    function solve(line) {
        const rows = [];
        let cur = line;
        for (let guard = 0; guard < 40; guard++) {
            const st = nextStep(cur);
            rows.push({ line: cur, op: st ? st.i : -1 });
            if (!st) break;
            cur = applyAt(cur, st.i);
        }
        return rows;
    }

    const isDone = line => line.length === 1 && line[0].k === 'num';

    // ------------------------------------------------------------
    // MODALITAT «PAS A PAS»: quines operacions es poden fer ja
    // L'arbre d'una línia (amb les regles correctes). Nodes:
    //   {t:'num', i}   {t:'pow', i}   {t:'bin', i, op, l, r, par}
    // i: posició del token (a 'bin', la del signe); par: anava entre parèntesis.
    // Una operació es pot fer quan les dues dades ja són nombres; una
    // potència, sempre (la base és un nombre).
    // ------------------------------------------------------------
    function lineTree(line) {
        const out = [],
            st = [];
        const reduce = () => {
            const o = st.pop(),
                b = out.pop(),
                a = out.pop();
            out.push({ t: 'bin', i: o.i, op: o.v, l: a, r: b });
        };
        line.forEach((t, i) => {
            if (t.k === 'num') out.push({ t: 'num', i });
            else if (t.k === 'pow') out.push({ t: 'pow', i });
            else if (t.k === 'op') {
                while (st.length && st[st.length - 1].k === 'op' && PREC_OK[st[st.length - 1].v] >= PREC_OK[t.v])
                    reduce();
                st.push({ k: 'op', v: t.v, i });
            } else if (t.k === 'lp') st.push({ k: 'lp' });
            else {
                while (st[st.length - 1].k !== 'lp') reduce();
                st.pop();
                out[out.length - 1].par = true;
            }
        });
        while (st.length) reduce();
        return out[0];
    }

    const nodesOf = n => (n.t === 'bin' ? [n, ...nodesOf(n.l), ...nodesOf(n.r)] : [n]);
    const isReady = n => n.t === 'pow' || (n.t === 'bin' && n.l.t === 'num' && n.r.t === 'num');

    // Les posicions (d'esquerra a dreta) de les operacions que ja es poden fer
    function readyOps(line) {
        return nodesOf(lineTree(line))
            .filter(isReady)
            .map(n => n.i)
            .sort((a, b) => a - b);
    }

    // Per què encara no es pot fer l'operació de la posició i. Retorna null si
    // ja es pot fer o si a i no hi ha cap operació. Si no:
    //   { op, green, reason }
    //   op: el signe triat; green: les posicions de les operacions que ja es
    //   poden fer i que calia fer abans (les de dins de les seves dades);
    //   reason: 'par'  → abans, el que hi ha dins del parèntesi
    //           'pow'  → abans, la potència
    //           'prio' → · i : abans que + i −
    //           'lr'   → les del mateix nivell, d'esquerra a dreta
    function blockers(line, i) {
        const x = nodesOf(lineTree(line)).find(n => n.i === i && n.t !== 'num');
        if (!x || isReady(x)) return null;
        const inside = [...nodesOf(x.l), ...nodesOf(x.r)];
        const green = inside.filter(isReady);
        const inParens = new Set(inside.filter(n => n.par).flatMap(nodesOf));
        let reason;
        if (green.some(g => inParens.has(g))) reason = 'par';
        else if (green.some(g => g.t === 'pow')) reason = 'pow';
        else if (PREC_OK[x.op] === 1 && green.some(g => PREC_OK[g.op] === 2)) reason = 'prio';
        else reason = 'lr';
        return { op: x.op, green: green.map(g => g.i).sort((a, b) => a - b), reason };
    }

    // Tres resultats equivocats però versemblants per a l'operació de la posició i
    // (primer, el de l'error més típic: 3² = 6, 4·5 = 9…), naturals i diferents.
    function stepDistractors(line, i) {
        const t = line[i],
            ok = opValue(line, i);
        let cands;
        if (t.k === 'pow') cands = [t.b * t.e, t.b + t.e, ok + t.b, ok - t.b, ok + 1, ok - 1];
        else {
            const a = line[i - 1].v,
                b = line[i + 1].v;
            if (t.v === '+') cands = [a * b, ok + 1, ok - 1, ok + 10, ok - 10];
            else if (t.v === '-') cands = [a + b, ok + 1, ok - 1, ok + 10, ok - 10];
            else if (t.v === '·') cands = [a + b, ok + a, ok - b, ok + b, ok - a, ok + 1];
            else cands = [a - b, ok + 1, ok - 1, ok + 2, ok * 2];
        }
        cands.push(ok + 2, ok + 3, ok + 4, ok + 5);
        const out = [];
        for (const v of cands) {
            if (out.length >= 3) break;
            if (Number.isInteger(v) && v >= 0 && v !== ok && !out.includes(v)) out.push(v);
        }
        return out;
    }

    return {
        N,
        O,
        P,
        L,
        R,
        MAX_RESULT,
        LEVELS,
        MISCONCEPTIONS,
        evaluate,
        misconceptionMap,
        buildDistractors,
        diagnose,
        nodeRange,
        generateExercise,
        nextStep,
        startLine,
        opRange,
        opValue,
        applyAt,
        solve,
        isDone,
        lineTree,
        readyOps,
        blockers,
        stepDistractors,
    };
})();
