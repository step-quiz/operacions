/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/prioritat/prioritat.js
 * ROL: Joc «Prioritat d'Operacions» (prioritat.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa utils.js, config.js, game-core.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { pick, randInt, shuffle } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    hideMiniOverlay,
    injectSharedHTML,
    isTouchDevice,
    recordAnswerToHistory,
    recordResult,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { buildLevel });

// ===== ENGINE-START =====
// ============================================================
// MOTOR MATEMÀTIC (pur, sense DOM)
// ------------------------------------------------------------
// Una expressió és un array de tokens:
//   {k:'num', v}   {k:'op', v:'+'|'-'|'·'|':'}   {k:'pow', b, e}   {k:'lp'}   {k:'rp'}
//
// evaluate(toks, cfg) avalua l'expressió amb unes regles configurables.
// Amb cfg = {} aplica les regles CORRECTES. Amb altres cfg simula els
// ERRORS TÍPICS dels alumnes (vegeu MISCONCEPTIONS). Retorna null si en
// algun moment surt un resultat negatiu, no enter o una divisió per zero.
// ============================================================
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
        () => [N(r(2, 5)), O('·'), L(), N(r(2, 6)), O('+'), N(r(2, 6)), R(), O('-'), N(r(2, 5)), O('·'), N(r(2, 5))],
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
        () => [L(), N(r(2, 9)), O('+'), N(r(2, 9)), R(), O('·'), N(r(2, 5)), O('-'), N(r(2, 5)), O('·'), N(r(2, 5))],
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
        () => [P(r(4, 9), 2), O('-'), N(r(2, 4)), O('·'), L(), N(r(5, 9)), O('-'), N(r(2, 4)), R(), O('+'), N(r(2, 9))],
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

// ------------------------------------------------------------
// RESOLUCIÓ PAS A PAS (parèntesis → potències → · : → + −, esquerra a dreta)
// ------------------------------------------------------------
function innermostParen(toks) {
    let o = -1;
    for (let i = 0; i < toks.length; i++) {
        if (toks[i].k === 'lp') o = i;
        if (toks[i].k === 'rp' && o !== -1) return [o, i];
    }
    return null;
}

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

function applyStep(toks, st) {
    const t = toks.map(x => Object.assign({}, x, { fresh: false }));
    let idx;
    if (st.kind === 'pow') {
        t.splice(st.i, 1, { k: 'num', v: Math.pow(t[st.i].b, t[st.i].e), fresh: true });
        idx = st.i;
    } else {
        const a = t[st.i - 1].v,
            op = t[st.i].v,
            b = t[st.i + 1].v;
        const res = op === '+' ? a + b : op === '-' ? a - b : op === '·' ? a * b : a / b;
        t.splice(st.i - 1, 3, { k: 'num', v: res, fresh: true });
        idx = st.i - 1;
    }
    if (t[idx - 1] && t[idx - 1].k === 'lp' && t[idx + 1] && t[idx + 1].k === 'rp') {
        t.splice(idx + 1, 1);
        t.splice(idx - 1, 1);
    }
    return t;
}

function solutionChain(toks) {
    const lines = [];
    let cur = toks;
    for (let guard = 0; guard < 30; guard++) {
        const st = nextStep(cur);
        if (!st) break;
        cur = applyStep(cur, st);
        lines.push(cur);
    }
    return lines;
}

// ------------------------------------------------------------
// TEXTOS
// ------------------------------------------------------------
const SUP = { 2: '²', 3: '³' };
const OP_SHOW = { '+': '+', '-': '−', '·': '·', ':': ':' };

function toText(toks) {
    return toks
        .map(t => {
            if (t.k === 'num') return String(t.v);
            if (t.k === 'op') return OP_SHOW[t.v];
            if (t.k === 'pow') return `${t.b}${SUP[t.e]}`;
            return t.k === 'lp' ? '(' : ')';
        })
        .join(' ')
        .replace(/\( /g, '(')
        .replace(/ \)/g, ')');
}

// Ex.: "3² = 3·3 = 9, no 3·2 = 6."
function powHint(pw) {
    return `${pw.b}${SUP[pw.e]} = ${Array(pw.e).fill(pw.b).join('·')} = ${Math.pow(pw.b, pw.e)}, no ${pw.b}·${pw.e} = ${pw.b * pw.e}.`;
}

const NOM_UNA = { '+': 'una suma', '-': 'una resta', '·': 'una multiplicació', ':': 'una divisió' };
const NOM_LA = { '+': 'la suma', '-': 'la resta', '·': 'la multiplicació', ':': 'la divisió' };
const NOM_LES = { '+': 'les sumes', '-': 'les restes', '·': 'les multiplicacions', ':': 'les divisions' };
const NOM_PL = { '+': 'sumes', '-': 'restes', '·': 'multiplicacions', ':': 'divisions' };

function joinI(parts) {
    return parts.length <= 1 ? parts[0] || '' : parts.slice(0, -1).join(', ') + ' i ' + parts[parts.length - 1];
}

// Operadors marcats pel diagnòstic (sense la potència mal calculada)
function markedOps(toks, set, diag) {
    return [...set].filter(i => i !== diag.powRed && toks[i] && toks[i].k === 'op').map(i => toks[i].v);
}

// "la multiplicació", "les multiplicacions", "la multiplicació i la divisió"...
function phraseLa(ops) {
    const parts = [];
    for (const op of ['·', ':', '+', '-']) {
        const n = ops.filter(o => o === op).length;
        if (n === 1) parts.push(NOM_LA[op]);
        if (n > 1) parts.push(NOM_LES[op]);
    }
    return joinI(parts);
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
const compact = txt => txt.replace(/ · /g, '·').replace(/ : /g, ':');

// "Has fet una resta abans que la multiplicació: és a l'inrevés!"
// (serveix per als errors "esquerra a dreta" i "sumes abans": per a l'alumne és el mateix)
function orderMsg(toks, diag) {
    const red = diag ? markedOps(toks, diag.red, diag) : [];
    const grn = diag ? markedOps(toks, diag.green, diag) : [];
    if (red.length && grn.length && (red[0] === '+' || red[0] === '-'))
        return `Has fet ${NOM_UNA[red[0]]} abans que ${phraseLa(grn)}: és a l'inrevés!`;
    return "Has fet les sumes i restes abans que les multiplicacions i divisions: és a l'inrevés!";
}

function feedbackFor(id, toks, diag) {
    if (diag === undefined && id !== 'calc') diag = diagnose(toks, id);
    const pw = toks.find(t => t.k === 'pow');
    switch (id) {
        case 'lr':
        case 'addfirst':
            return orderMsg(toks, diag);

        case 'rtl': {
            // "Atenció, si tens diverses sumes i restes seguides, es fan d'esquerra a dreta."
            const ops = diag ? markedOps(toks, new Set([...diag.red, ...diag.green]), diag) : [];
            const nivell = ops.some(o => o === '·' || o === ':') ? ['·', ':'] : ['+', '-'];
            const noms = nivell.filter(o => ops.includes(o)).map(o => NOM_PL[o]);
            return noms.length
                ? `Atenció, si tens diverses ${joinI(noms)} seguides, es fan d'esquerra a dreta.`
                : "Atenció, si tens diverses operacions del mateix tipus seguides, es fan d'esquerra a dreta.";
        }

        case 'nopar':
        case 'lrnopar':
            return "No t'has fixat que hi ha un parèntesi. Has de calcular, en primer lloc, el que hi ha dins del parèntesi.";

        case 'powterm': {
            // "En l'operació 4·3², l'exponent afecta només la base (que val 3),
            //  per tant has de calcular 3² en lloc de 12²."
            if (diag && diag.powKid) {
                const [a, b] = nodeRange(toks, diag.powKid);
                const powIdx = [...diag.green].find(i => toks[i] && toks[i].k === 'pow');
                const p = toks[powIdx];
                if (p && powIdx >= a && powIdx <= b) {
                    const sub = toks.slice(a, b + 1);
                    const baseVal = evaluate(
                        sub.map(t => (t === p ? N(p.b) : t)),
                        {}
                    );
                    if (baseVal !== null)
                        return (
                            `En l'operació ${compact(toText(sub))}, l'exponent afecta només la base (que val ${p.b}), ` +
                            `per tant has de calcular ${p.b}${SUP[p.e]} en lloc de ${baseVal}${SUP[p.e]}.`
                        );
                }
            }
            return pw ? `L'exponent afecta només la base: a ${pw.b}${SUP[pw.e]}, només el ${pw.b}.` : '';
        }

        case 'powmult':
            return pw ? powHint(pw) : '';

        case 'lrpowmult':
            return orderMsg(toks, diag) + (pw ? ' A més, ' + powHint(pw) : '');

        default:
            return 'Revisa els càlculs pas a pas.';
    }
}
// ===== ENGINE-END =====

// ============================================================
// DOM
// ============================================================
const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    expressionBox: document.getElementById('expression-box'),
    stepInstruction: document.getElementById('step-instruction'),
    feedback: document.getElementById('feedback'),
    dropZone: document.getElementById('drop-zone'),
    chipPool: document.getElementById('chip-pool'),
    solutionBox: document.getElementById('solution-box'),
    hintText: document.getElementById('hint-text'),
    dragGhost: document.getElementById('drag-ghost'),
};

// ============================================================
// ESTAT DEL JOC
// ============================================================
const PUNTS = [10, 5, 2, 1]; // punts segons el nombre de fallades abans d'encertar

let _finished = false; // l'exercici actual ja s'ha tancat
let tokens = [];
let correctAnswer = null;
let optionIds = new Map(); // valor → id de l'error (per al feedback)
let _selectedChip = null;
let _touchChip = null;
let _touchStartX = 0;
let _touchStartY = 0;

// El nivell es reparteix al llarg de la sessió: sigui quin sigui el nombre
// d'operacions, la primera és del nivell 0 i l'última del nivell 9.
function levelFor(opIndex) {
    if (TOTAL_OPERATIONS <= 1) return 0;
    return Math.round((opIndex * (LEVELS.length - 1)) / (TOTAL_OPERATIONS - 1));
}

// ============================================================
// RENDERITZAT
// ============================================================
function tokHtml(t, extra) {
    const x = extra ? ' ' + extra : '';
    if (t.k === 'num') return `<span class="tok-num${t.fresh ? ' fresh' : ''}${x}">${t.v}</span>`;
    if (t.k === 'op') return `<span class="tok-op${x}">${OP_SHOW[t.v]}</span>`;
    if (t.k === 'pow') return `<span class="tok-pow${x}">${t.b}<sup>${t.e}</sup></span>`;
    return `<span class="tok-paren${x}">${t.k === 'lp' ? '(' : ')'}</span>`;
}

// diag (opcional): { red:Set, green:Set } amb les posicions a marcar
function renderExpression(diag) {
    els.expressionBox.innerHTML = tokens
        .map((t, i) => {
            let cls = '';
            if (diag && diag.red.has(i)) cls = 'hl-red';
            else if (diag && diag.green.has(i)) cls = 'hl-green';
            return tokHtml(t, cls);
        })
        .join('');
}

function legendHtml(diag) {
    if (!diag) return '';
    const items = [];
    const orderRed = [...diag.red].some(i => i !== diag.powRed);
    if (orderRed) items.push('<span><i class="lg-box lg-red"></i>Aquesta operació l\'has feta massa aviat</span>');
    if (diag.green.size) items.push('<span><i class="lg-box lg-green"></i>Abans calia fer aquesta</span>');
    if (diag.powRed >= 0) items.push('<span><i class="lg-box lg-red"></i>Aquesta potència està mal calculada</span>');
    return items.length ? `<div class="fb-legend">${items.join('')}</div>` : '';
}

function resetDropZone() {
    els.dropZone.className = 'drop-zone';
    els.dropZone.innerHTML = '<span class="dz-placeholder">Arrossega aquí</span>';
}

function renderChipPool(values) {
    els.chipPool.innerHTML = '';
    values.forEach(val => {
        const chip = document.createElement('div');
        chip.className = 'num-chip';
        chip.textContent = val;
        chip.dataset.val = val;
        chip.setAttribute('role', 'button');
        chip.setAttribute('aria-label', `Resposta ${val}`);

        chip.addEventListener('click', () => _selectChip(chip));

        chip.draggable = true;
        chip.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', String(val));
            setTimeout(() => chip.classList.add('dragging'), 0);
        });
        chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
        chip.addEventListener('touchstart', _onTouchStart, { passive: false });

        els.chipPool.appendChild(chip);
    });
}

function renderSolution(ok) {
    const lines = solutionChain(tokens);
    const title = ok
        ? "✅ Correcte! Es resol d'aquesta manera:"
        : `La resposta correcta és <strong>${correctAnswer}</strong>. Es resol d'aquesta manera:`;
    // 29 − 4·5 + 7 =
    // = 29 − 20 + 7
    // = 9 + 7
    // = 16
    const first = `<div class="sol-line">${tokens.map(t => tokHtml(t)).join('')}<span class="sol-eq-end">=</span></div>`;
    const rest = lines
        .map(l => `<div class="sol-line"><span class="sol-eq">=</span>${l.map(t => tokHtml(t)).join('')}</div>`)
        .join('');
    els.solutionBox.innerHTML =
        `<div class="solution-title">${title}</div>` + `<div class="sol-lines">${first}${rest}</div>`;
    els.solutionBox.style.display = 'block';
}

// ============================================================
// CONSTRUCCIÓ DE CADA EXERCICI
// ============================================================
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    _finished = false;
    _selectedChip = null;

    const ex = generateExercise(levelFor(state.currentOperation));
    tokens = ex.toks;
    correctAnswer = ex.val;

    const distractors = buildDistractors(tokens, correctAnswer);
    optionIds = new Map(distractors.map(d => [d.v, d.id]));
    const values = shuffle([correctAnswer, ...distractors.map(d => d.v)]);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    renderExpression();
    els.stepInstruction.textContent = 'Quant val aquesta expressió?';
    els.feedback.textContent = '';
    els.solutionBox.style.display = 'none';
    els.solutionBox.innerHTML = '';
    resetDropZone();
    renderChipPool(values);
    els.chipPool.style.display = 'flex';
    els.hintText.style.display = 'block';
    els.hintText.textContent = isTouchDevice()
        ? 'Toca la resposta i després toca la casella (o arrossega-la).'
        : 'Arrossega la resposta fins a la casella (o clica-la i després clica la casella).';

    updateHeader();
}

function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Operació ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft < 2 ? ' danger' : '');
}

// ============================================================
// INTERACCIÓ: selecció per toc/clic
// ============================================================
function _selectChip(chip) {
    if (state.isTransitioning) return;
    if (chip.classList.contains('used') || chip.classList.contains('chip-wrong')) return;
    if (_selectedChip === chip) {
        chip.classList.remove('chip-selected');
        _selectedChip = null;
        return;
    }
    if (_selectedChip) _selectedChip.classList.remove('chip-selected');
    _selectedChip = chip;
    chip.classList.add('chip-selected');
}

// ---- Casella: esdeveniments HTML5 (escriptori) ----
els.dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    els.dropZone.classList.add('dz-over');
});
els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dz-over'));
els.dropZone.addEventListener('drop', e => {
    e.preventDefault();
    els.dropZone.classList.remove('dz-over');
    const raw = e.dataTransfer.getData('text/plain');
    if (raw !== '') handleAnswer(Number(raw));
});
// Tocar/clicar la casella amb un xip seleccionat
els.dropZone.addEventListener('pointerup', () => {
    if (!_selectedChip || state.isTransitioning) return;
    const val = Number(_selectedChip.dataset.val);
    _selectedChip.classList.remove('chip-selected');
    _selectedChip = null;
    handleAnswer(val);
});

// ---- Drag tàctil (mateix patró que vocabulari.html) ----
// Com que preventDefault() al touchstart anul·la el 'click' en mòbil,
// un toc sense desplaçament es tracta aquí mateix com a selecció.
function _onTouchStart(e) {
    if (state.isTransitioning) return;
    e.preventDefault();
    _touchChip = e.currentTarget;
    const touch = e.touches[0];
    _touchStartX = touch.clientX;
    _touchStartY = touch.clientY;
    els.dragGhost.textContent = _touchChip.dataset.val;
    document.addEventListener('touchmove', _onTouchMove, { passive: false });
    document.addEventListener('touchend', _onTouchEnd, { passive: false });
    document.addEventListener('touchcancel', _onTouchCancel, { passive: false });
}
function _onTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (els.dragGhost.style.display !== 'block' && Math.hypot(t.clientX - _touchStartX, t.clientY - _touchStartY) > 8) {
        els.dragGhost.style.display = 'block';
    }
    if (els.dragGhost.style.display === 'block') _moveGhost(t.clientX, t.clientY);
}
function _moveGhost(cx, cy) {
    els.dragGhost.style.left = cx - els.dragGhost.offsetWidth / 2 + 'px';
    els.dragGhost.style.top = cy - 20 + 'px';
}
function _onTouchEnd(e) {
    const wasDragging = els.dragGhost.style.display === 'block';
    els.dragGhost.style.display = 'none';
    _removeTouchListeners();
    const chip = _touchChip;
    _touchChip = null;
    if (!chip) return;
    if (!wasDragging) {
        _selectChip(chip);
        return;
    } // toc simple → selecciona
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.closest('#drop-zone')) {
        if (_selectedChip) {
            _selectedChip.classList.remove('chip-selected');
            _selectedChip = null;
        }
        handleAnswer(Number(chip.dataset.val));
    }
}
function _onTouchCancel() {
    els.dragGhost.style.display = 'none';
    _touchChip = null;
    _removeTouchListeners();
}
function _removeTouchListeners() {
    document.removeEventListener('touchmove', _onTouchMove);
    document.removeEventListener('touchend', _onTouchEnd);
    document.removeEventListener('touchcancel', _onTouchCancel);
}

// ============================================================
// COMPROVACIÓ DE LA RESPOSTA
// ============================================================
function handleAnswer(val) {
    if (state.isTransitioning || correctAnswer === null) return;
    const chip = [...els.chipPool.querySelectorAll('.num-chip')].find(c => Number(c.dataset.val) === val);
    if (!chip || chip.classList.contains('used') || chip.classList.contains('chip-wrong')) return;

    const exprText = toText(tokens);

    if (val === correctAnswer) {
        chip.classList.add('used');
        els.dropZone.className = 'drop-zone dz-correct';
        els.dropZone.textContent = String(val);
        els.feedback.textContent = '';
        renderExpression();
        recordAnswerToHistory(`${exprText} = ?`, String(val), true);
        finishOperation(true);
    } else {
        chip.classList.add('chip-wrong');
        els.dropZone.classList.add('dz-wrong');
        setTimeout(() => els.dropZone.classList.remove('dz-wrong'), 400);
        const errId = optionIds.get(val) || 'calc';
        const diag = errId === 'calc' ? null : diagnose(tokens, errId);
        renderExpression(diag);
        els.feedback.innerHTML =
            `<div>${val} no és correcte. ${feedbackFor(errId, tokens, diag)}</div>` + legendHtml(diag);
        recordAnswerToHistory(`${exprText} = ?`, String(val), false);
        penalize();
    }
}

// L'intent es descompta a l'instant. El parpelleig del comptador és només
// visual: NO bloqueja l'entrada (abans, durant 0,8 s s'ignoraven els tocs,
// i si l'alumne tocava de seguida l'última opció, no passava res).
function penalize() {
    state.attemptsLeft--;
    updateHeader();
    const ad = els.attemptsDisplay;
    ad.classList.remove('blink-error');
    void ad.offsetWidth; // reinicia l'animació si ja estava activa
    ad.classList.add('blink-error');
    setTimeout(() => ad.classList.remove('blink-error'), 800);
    if (state.attemptsLeft <= 0) {
        state.isTransitioning = true; // ja no s'accepten més respostes
        setTimeout(() => finishOperation(false), 700); // temps per veure l'error abans de la solució
    }
}

// ============================================================
// FI DE L'EXERCICI: resolució pas a pas + overlay + botó "Següent"
// (sense temporitzador: l'alumne decideix quan ha entès la resolució)
// ============================================================
function finishOperation(ok) {
    if (_finished) return;
    _finished = true;
    state.isTransitioning = true;

    const fails = MAX_INTENTS - state.attemptsLeft;
    const levelPoints = ok ? PUNTS[Math.min(fails, PUNTS.length - 1)] : 0;
    state.sessionScore += levelPoints;
    recordResult(ok ? Math.min(fails + 1, 3) : 4);
    updateHeader();

    if (_selectedChip) {
        _selectedChip.classList.remove('chip-selected');
        _selectedChip = null;
    }
    els.chipPool.style.display = 'none';
    els.hintText.style.display = 'none';
    if (!ok) {
        // Es mantenen les marques de l'últim error perquè l'alumne les compari amb la resolució
        els.dropZone.className = 'drop-zone dz-reveal';
        els.dropZone.textContent = String(correctAnswer);
    }
    renderSolution(ok);
    showMiniOverlay(levelPoints, { successColor: 'var(--primary-dark)' });

    const isLast = state.currentOperation + 1 >= TOTAL_OPERATIONS;
    const btn = document.createElement('button');
    btn.className = 'btn-next';
    btn.id = 'btn-next';
    btn.textContent = isLast ? 'Veure resultats' : 'Següent';
    btn.addEventListener('click', goNext);
    els.solutionBox.appendChild(btn);
    if (isTouchDevice()) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    else btn.focus({ preventScroll: true });
}

function goNext() {
    const btn = document.getElementById('btn-next');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    hideMiniOverlay();
    if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
        endSession();
    } else {
        state.currentOperation++;
        window.buildLevel();
    }
}

// Enter = "Següent" (escriptori)
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const btn = document.getElementById('btn-next');
    if (btn && !btn.disabled && els.gameScreen.style.display !== 'none') {
        e.preventDefault();
        goNext();
    }
});

// ============================================================
// ARRENCADA
// ============================================================
injectSharedHTML();
validateConfig();
startGame();
