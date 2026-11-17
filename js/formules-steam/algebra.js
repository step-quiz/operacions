/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/algebra.js
 * ROL: El petit motor d'àlgebra de «Fórmules STEAM» (formules-steam.html): llegeix
 *      una fórmula escrita («v = Dx/Dt»), l'escriu en text i en TeX, hi substitueix
 *      nombres, aïlla una lletra pas a pas (una operació als dos membres per pas, en
 *      l'ordre de llibre) i fabrica les respostes equivocades de cada pas a partir dels
 *      errors típics.
 * ARQUITECTURA: mòdul pur (cap DOM, cap atzar).
 *   EXPRESSIONS (arbres):
 *     {t:'num', v, dada?}     v: coeficient exacte (js/algebra/racionals.js); dada: true si
 *                             és una dada substituïda (no va al davant ni fa de ½)
 *     {t:'var', n}            n: el nom de la lletra («v», «Δx», «v₀», «Ec»)
 *     {t:'add', terms:[{s, e}]}   s: +1 o −1
 *     {t:'mul', f:[e…]}       {t:'div', n, d}     {t:'pow', b, e: 2}     {t:'sqrt', e}
 *     {t:'unit', text, tex}   una unitat (per escriure el càlcul de les unitats)
 *   Una equació és [esquerra, dreta]. Els noms de les lletres els dona el catàleg
 *   (cataleg.js): el lector reconeix el nom més llarg que encaixa.
 *   AÏLLAR (aillaPassos): mentre la lletra no estigui sola, es mira el membre on és:
 *     suma       es treuen els altres termes (resta o suma als dos membres)
 *     quocient   es multiplica pel denominador (també si la lletra hi és: és el primer
 *                dels dos passos de la lletra al denominador, decisió del David)
 *     producte   es divideix pels altres factors
 *     quadrat    es fa l'arrel quadrada (només la positiva: són magnituds)
 *   Si la lletra acaba a la dreta, el pas porta gira: true (la igualtat es gira en un
 *   pas a part, automàtic).
 *   ERRORS (dolentes): per a cada operació, les equacions que donen els errors típics
 *   (restar en lloc de dividir, el quocient girat, l'arrel d'una part…), amb el codi.
 * DEPENDÈNCIES: algebra/racionals.js.
 * ============================================================================
 */

import {
    coeficient,
    comRacional,
    producteCoef,
    quocientCoef,
    sumaCoef,
    texDecimal,
    textDecimal,
} from '../algebra/racionals.js';

const MENYS = '−';
export const N = v => ({ t: 'num', v });
export const V = n => ({ t: 'var', n });
const add = terms => ({ t: 'add', terms });
const mul = f => ({ t: 'mul', f });
const esU = e => e.t === 'num' && comRacional(e.v).join() === '1,1';
const div = (n, d) => (esU(d) ? n : { t: 'div', n, d });
const pow = b => ({ t: 'pow', b, e: 2 });
const sqrt = e => ({ t: 'sqrt', e });

// ── Lectura ──────────────────────────────────────────────────────────────────
/** Llegeix una expressió («2*Ec/m», «v0 + a*t», «sqrt(F/k)»); noms: les lletres que hi pot haver. */
export function llegeix(text, noms) {
    const s = text.replace(/\s+/g, '');
    const ordenats = [...noms].sort((a, b) => b.length - a.length);
    let i = 0;
    const err = () => new Error(`no s'entén «${text}» (posició ${i})`);
    const expr = () => {
        const terms = [];
        let signe = 1;
        if (s[i] === '-') {
            signe = -1;
            i++;
        }
        terms.push({ s: signe, e: terme() });
        while (s[i] === '+' || s[i] === '-') {
            const sg = s[i++] === '+' ? 1 : -1;
            terms.push({ s: sg, e: terme() });
        }
        return terms.length === 1 && terms[0].s === 1 ? terms[0].e : add(terms);
    };
    const terme = () => {
        let e = potencia();
        while (s[i] === '*' || s[i] === '/') {
            const op = s[i++];
            const f = potencia();
            if (op === '/') e = div(e, f);
            else e = e.t === 'mul' ? mul([...e.f, f]) : mul([e, f]);
        }
        return e;
    };
    const potencia = () => {
        const b = atom();
        if (s[i] === '^') {
            i++;
            if (s[i++] !== '2') throw err();
            return pow(b);
        }
        return b;
    };
    const atom = () => {
        if (s.startsWith('sqrt(', i)) {
            i += 5;
            const e = expr();
            if (s[i++] !== ')') throw err();
            return sqrt(e);
        }
        if (s[i] === '(') {
            i++;
            const e = expr();
            if (s[i++] !== ')') throw err();
            return e;
        }
        const m = /^\d+(?:\.\d+)?/.exec(s.slice(i));
        if (m) {
            i += m[0].length;
            const [ent, dec = ''] = m[0].split('.');
            return N(coeficient(Number(ent + dec), 10 ** dec.length));
        }
        const nom = ordenats.find(n => s.startsWith(n, i));
        if (!nom) throw err();
        i += nom.length;
        return V(nom);
    };
    const e = expr();
    if (i !== s.length) throw err();
    return e;
}
/** Llegeix una equació «A = B». */
export function llegeixEquacio(text, noms) {
    const [a, b] = text.split('=');
    return [llegeix(a, noms), llegeix(b, noms)];
}

// ── Escriptura ───────────────────────────────────────────────────────────────
const esNum = e => e.t === 'num';
/** Un nombre de la fórmula (el 2 de ½ · m · v²), no una dada (substitueix les marca amb dada: true). */
const esConstant = e => esNum(e) && !e.dada;
// «½ · …» només amb el 2 de la fórmula: una dada que val 2 (P = W / t amb t = 2) es queda «W / 2»
export const esMeitat = e =>
    e.t === 'div' &&
    esConstant(e.d) &&
    comRacional(e.d.v).join() === '2,1' &&
    !esNum(e.n) &&
    e.n.t !== 'div' &&
    e.n.t !== 'add';
const atomic = e => e.t === 'num' || e.t === 'var' || e.t === 'unit' || e.t === 'sqrt';

/** En text (per als botons): «Δt = Δx / v», «v = √(2 · Ec / m)», «½ · m · v²». */
export function text(e) {
    switch (e.t) {
        case 'num':
            return textDecimal(e.v);
        case 'var':
            return e.n;
        case 'unit':
            return e.text;
        case 'add':
            return e.terms
                .map(({ s, e: x }, k) => {
                    const t = x.t === 'add' ? `(${text(x)})` : text(x);
                    return k === 0 ? (s < 0 ? `${MENYS}${t}` : t) : `${s < 0 ? ` ${MENYS} ` : ' + '}${t}`;
                })
                .join('');
        case 'mul':
            return e.f.map(x => (x.t === 'add' || x.t === 'div' ? `(${text(x)})` : text(x))).join(' · ');
        case 'div': {
            if (esMeitat(e)) return `½ · ${e.n.t === 'add' ? `(${text(e.n)})` : text(e.n)}`;
            const n = e.n.t === 'add' || e.n.t === 'div' ? `(${text(e.n)})` : text(e.n);
            const d = atomic(e.d) || e.d.t === 'pow' ? text(e.d) : `(${text(e.d)})`;
            return `${n} / ${d}`;
        }
        case 'pow':
            return `${atomic(e.b) && e.b.t !== 'sqrt' ? text(e.b) : `(${text(e.b)})`}²`;
        case 'sqrt':
            return atomic(e.e) ? `√${text(e.e)}` : `√(${text(e.e)})`;
    }
    throw new Error(`node desconegut ${e.t}`);
}
/** El color de les peces que passen a l'altre membre (decisió del David: cap vermell). */
export const COLOR_MOU = '#0e7490';
const pinta = t => '\\textcolor{' + COLOR_MOU + '}{' + t + '}';
/**
 * En TeX; lletres: { nom: tex } (per defecte, el nom tal qual); marcats (opcional): un Set de nodes que
 * es pinten de COLOR_MOU (el que passa a l'altre membre en un pas).
 */
export function tex(e, lletres = {}, marcats = null) {
    const marcat = Boolean(marcats && marcats.has(e));
    // dins d'una peça pintada, res més no es pinta (cap color dins d'un altre)
    const t = texNode(e, lletres, marcat ? null : marcats);
    return marcat ? pinta(t) : t;
}
function texNode(e, lletres, marcats) {
    const T = x => tex(x, lletres, marcats);
    switch (e.t) {
        case 'num':
            return texDecimal(e.v);
        case 'var':
            return lletres[e.n] || e.n;
        case 'unit':
            return e.tex;
        case 'add':
            return e.terms
                .map(({ s, e: x }, k) => {
                    const t = x.t === 'add' ? `\\left(${T(x)}\\right)` : T(x);
                    return k === 0 ? (s < 0 ? `-${t}` : t) : `${s < 0 ? ' - ' : ' + '}${t}`;
                })
                .join('');
        case 'mul':
            return e.f.map(x => (x.t === 'add' ? `\\left(${T(x)}\\right)` : T(x))).join(' \\cdot ');
        case 'div':
            if (esMeitat(e)) {
                const meitat = marcats && marcats.has(e.d) ? pinta('\\tfrac{1}{2}') : '\\tfrac{1}{2}';
                return `${meitat} \\cdot ${e.n.t === 'add' ? `\\left(${T(e.n)}\\right)` : T(e.n)}`;
            }
            return `\\dfrac{${T(e.n)}}{${T(e.d)}}`;
        case 'pow':
            return atomic(e.b) && e.b.t !== 'sqrt' ? `${T(e.b)}^{2}` : `\\left(${T(e.b)}\\right)^{2}`;
        case 'sqrt':
            return `\\sqrt{${T(e.e)}}`;
    }
    throw new Error(`node desconegut ${e.t}`);
}
export const textEq = ([a, b]) => `${text(a)} = ${text(b)}`;
export const texEq = ([a, b], lletres, marcats = null) => `${tex(a, lletres, marcats)} = ${tex(b, lletres, marcats)}`;

// ── Substituir i avaluar ─────────────────────────────────────────────────────
/** Canvia les lletres de valors ({ nom: coeficient o node }) per nombres (o pel node donat). */
export function substitueix(e, valors) {
    const S = x => substitueix(x, valors);
    switch (e.t) {
        case 'var': {
            if (!(e.n in valors)) return e;
            const v = valors[e.n];
            return v && typeof v === 'object' && !Array.isArray(v) ? v : { ...N(v), dada: true };
        }
        case 'add':
            return add(e.terms.map(({ s, e: x }) => ({ s, e: S(x) })));
        case 'mul':
            return mul(e.f.map(S));
        case 'div':
            return div(S(e.n), S(e.d));
        case 'pow':
            return pow(S(e.b));
        case 'sqrt':
            return sqrt(S(e.e));
        default:
            return e;
    }
}
export const substitueixEq = ([a, b], valors) => [substitueix(a, valors), substitueix(b, valors)];

/** El valor d'una expressió (nombres de coma flotant; per a les proves i per comparar). */
export function avalua(e, valors = {}) {
    const A = x => avalua(x, valors);
    switch (e.t) {
        case 'num': {
            const [n, d] = comRacional(e.v);
            return n / d;
        }
        case 'var': {
            const v = valors[e.n];
            if (v === undefined) throw new Error(`falta el valor de ${e.n}`);
            const [n, d] = comRacional(v);
            return n / d;
        }
        case 'add':
            return e.terms.reduce((s, { s: sg, e: x }) => s + sg * A(x), 0);
        case 'mul':
            return e.f.reduce((p, x) => p * A(x), 1);
        case 'div':
            return A(e.n) / A(e.d);
        case 'pow':
            return A(e.b) ** 2;
        case 'sqrt':
            return Math.sqrt(A(e.e));
    }
    throw new Error(`no es pot avaluar ${e.t}`);
}
/** El valor exacte (coeficient) d'una expressió sense arrels. */
export function avaluaExacte(e, valors = {}) {
    const A = x => avaluaExacte(x, valors);
    switch (e.t) {
        case 'num':
            return e.v;
        case 'var':
            if (valors[e.n] === undefined) throw new Error(`falta el valor de ${e.n}`);
            return valors[e.n];
        case 'add':
            return e.terms.reduce((s, { s: sg, e: x }) => sumaCoef(s, producteCoef(sg, A(x))), 0);
        case 'mul':
            return e.f.reduce((p, x) => producteCoef(p, A(x)), 1);
        case 'div':
            return quocientCoef(A(e.n), A(e.d));
        case 'pow':
            return producteCoef(A(e.b), A(e.b));
    }
    throw new Error(`no es pot avaluar exactament ${e.t}`);
}

// ── Aïllar ───────────────────────────────────────────────────────────────────
const conte = (e, x) =>
    e.t === 'var'
        ? e.n === x
        : e.t === 'add'
          ? e.terms.some(t => conte(t.e, x))
          : e.t === 'mul'
            ? e.f.some(f => conte(f, x))
            : e.t === 'div'
              ? conte(e.n, x) || conte(e.d, x)
              : e.t === 'pow'
                ? conte(e.b, x)
                : e.t === 'sqrt'
                  ? conte(e.e, x)
                  : false;
/** Un producte d'una llista de factors (un sol factor, sense «mul»). */
const producte = f => (f.length === 1 ? f[0] : mul(f));
/**
 * Multiplica: els nombres de la fórmula van al davant (2 · (x − x₀)); les dades, no, perquè amb nombres
 * quedi en el mateix ordre que amb lletres (80000 · 0,02 com p · S).
 */
function multiplica(a, b) {
    const fa = a.t === 'mul' ? a.f : [a];
    const fb = b.t === 'mul' ? b.f : [b];
    const f = [...fb.filter(esConstant), ...fa, ...fb.filter(f => !esConstant(f))].filter(x => !esU(x));
    return f.length ? producte(f) : N(1);
}
/** Treu termes d'una suma: torna la suma que queda. */
const sumaDe = terms => (terms.length === 1 && terms[0].s === 1 ? terms[0].e : add(terms));

/**
 * Els passos per aïllar x a l'equació eq. Cada pas:
 *   { op: { tipus: 'resta'|'suma'|'multiplica'|'divideix'|'arrel', per: expressió|null },
 *     abans: equació, despres: equació, gira: true si després la lletra queda a la dreta i és sola }
 */
export function aillaPassos(eq, x) {
    const passos = [];
    let [a, b] = eq;
    for (let guard = 0; guard < 12; guard++) {
        const esquerra = conte(a, x);
        const S = esquerra ? a : b;
        const O = esquerra ? b : a;
        if (S.t === 'var' && S.n === x) break;
        let op, nouS, nouO;
        if (S.t === 'add') {
            const k = S.terms.findIndex(t => conte(t.e, x));
            const altres = S.terms.filter((_, j) => j !== k);
            const meu = S.terms[k];
            if (meu.s > 0) {
                // es treuen tots els altres termes: el que suma, restant; el que resta, sumant
                const per = sumaDe(altres);
                op = {
                    tipus: altres.length === 1 && altres[0].s < 0 ? 'suma' : 'resta',
                    per: altres.length === 1 ? altres[0].e : per,
                    mou: altres,
                };
                nouS = meu.e;
                nouO = add([
                    ...(O.t === 'add' ? O.terms : [{ s: 1, e: O }]),
                    ...altres.map(t => ({ s: -t.s, e: t.e })),
                ]);
            } else {
                // la lletra resta: se suma als dos membres
                op = { tipus: 'suma', per: meu.e, mou: [meu] };
                nouS = sumaDe(altres);
                nouO = add([...(O.t === 'add' ? O.terms : [{ s: 1, e: O }]), { s: 1, e: meu.e }]);
            }
        } else if (S.t === 'div') {
            op = { tipus: 'multiplica', per: S.d };
            nouS = S.n;
            nouO = multiplica(O, S.d);
        } else if (S.t === 'mul') {
            const altres = S.f.filter(f => !conte(f, x));
            const meu = S.f.find(f => conte(f, x));
            const per = producte(altres);
            op = { tipus: 'divideix', per };
            nouS = meu;
            nouO = div(O, per);
        } else if (S.t === 'pow') {
            op = { tipus: 'arrel', per: null };
            nouS = S.b;
            nouO = sqrt(O);
        } else throw new Error(`no sé aïllar ${x} de ${text(S)}`);
        const despres = esquerra ? [nouS, nouO] : [nouO, nouS];
        // costat: on era la lletra abans (0 esquerra, 1 dreta); S i O, els dos membres d'abans; nouS i nouO,
        // el que en surt (amb la lletra al denominador, la lletra passa a nouO)
        passos.push({ op, abans: [a, b], despres, costat: esquerra ? 0 : 1, S, O, nouS, nouO });
        [a, b] = despres;
    }
    if (passos.length) {
        const ultim = passos[passos.length - 1];
        const [p, q] = ultim.despres;
        ultim.gira = !(p.t === 'var' && p.n === x) && q.t === 'var' && q.n === x;
    }
    return passos;
}
/** Si la lletra x és dins d'un denominador de l'expressió. */
export function aDenominador(e, x) {
    if (e.t === 'div') return conte(e.d, x) || aDenominador(e.n, x);
    if (e.t === 'add') return e.terms.some(t => aDenominador(t.e, x));
    if (e.t === 'mul') return e.f.some(f => aDenominador(f, x));
    if (e.t === 'pow') return aDenominador(e.b, x);
    if (e.t === 'sqrt') return aDenominador(e.e, x);
    return false;
}
/** Gira una equació. */
export const gira = ([a, b]) => [b, a];

// ── Les operacions en paraules ───────────────────────────────────────────────
export function textOperacio(op) {
    const p = op.per ? text(op.per) : '';
    const ambParentesi = op.per && op.per.t === 'add' ? `(${p})` : p;
    return {
        resta: `Resta ${ambParentesi} als dos membres`,
        suma: `Suma ${ambParentesi} als dos membres`,
        multiplica: `Multiplica els dos membres per ${ambParentesi}`,
        divideix: `Divideix els dos membres per ${ambParentesi}`,
        arrel: "Fes l'arrel quadrada dels dos membres",
    }[op.tipus];
}

/** La mateixa operació en TeX (el que hi ha darrere de «per», en mode matemàtic); marca: en color. */
export function texOperacio(op, lletres = {}, marca = false) {
    if (!op.per) return "\\text{Fes l'arrel quadrada dels dos membres}";
    const p = tex(op.per, lletres);
    const entre = op.per.t === 'add' ? `\\left(${p}\\right)` : p;
    const per = marca ? pinta(entre) : entre;
    return {
        resta: `\\text{Resta } ${per} \\text{ als dos membres}`,
        suma: `\\text{Suma } ${per} \\text{ als dos membres}`,
        multiplica: `\\text{Multiplica els dos membres per } ${per}`,
        divideix: `\\text{Divideix els dos membres per } ${per}`,
    }[op.tipus];
}

/**
 * La mateixa operació en text amb fórmules entre $…$ (els botons i les consignes del joc de passos les
 * dibuixen amb KaTeX): «Multiplica els dos membres per $\\Delta t$».
 */
export function formulesOperacio(op, lletres = {}) {
    if (!op.per) return "Fes l'arrel quadrada dels dos membres";
    const p = tex(op.per, lletres);
    const per = '$' + (op.per.t === 'add' ? `\\left(${p}\\right)` : p) + '$';
    return {
        resta: `Resta ${per} als dos membres`,
        suma: `Suma ${per} als dos membres`,
        multiplica: `Multiplica els dos membres per ${per}`,
        divideix: `Divideix els dos membres per ${per}`,
    }[op.tipus];
}

/** Les operacions equivocades d'un pas: [[op, codi]]. */
export function operacionsDolentes(op) {
    const per = op.per;
    switch (op.tipus) {
        case 'divideix':
            return [
                [{ tipus: 'resta', per }, 'RESTA_EN_LLOC_DE_DIVIDIR'],
                [{ tipus: 'multiplica', per }, 'MULTIPLICA_EN_LLOC_DE_DIVIDIR'],
            ];
        case 'multiplica':
            return [
                [{ tipus: 'divideix', per }, 'DIVIDEIX_EN_LLOC_DE_MULTIPLICAR'],
                [{ tipus: 'resta', per }, 'RESTA_EN_LLOC_DE_MULTIPLICAR'],
            ];
        case 'resta':
            return [
                [{ tipus: 'suma', per }, 'SIGNE_EN_PASSAR'],
                [{ tipus: 'divideix', per }, 'DIVIDEIX_EN_LLOC_DE_RESTAR'],
            ];
        case 'suma':
            return [
                [{ tipus: 'resta', per }, 'SIGNE_EN_PASSAR'],
                [{ tipus: 'divideix', per }, 'DIVIDEIX_EN_LLOC_DE_RESTAR'],
            ];
        case 'arrel':
            return [
                [{ tipus: 'divideix', per: N(2) }, 'ARREL_COM_MEITAT'],
                [{ tipus: 'multiplica', per: N(2) }, 'ARREL_COM_MEITAT'],
            ];
    }
    return [];
}

/**
 * Les equacions equivocades d'un pas (el pas tal com el torna aillaPassos): [[equació, codi]].
 * Gairebé totes surten d'aplicar malament l'operació al membre que no té la lletra (O); els membres
 * queden on eren.
 */
export function equacionsDolentes(pas) {
    const { op, S, O, nouS, costat } = pas;
    const fes = (nouSdolent, nouOdolent) => (costat === 0 ? [nouSdolent, nouOdolent] : [nouOdolent, nouSdolent]);
    const termes = e => (e.t === 'add' ? e.terms : [{ s: 1, e }]);
    const out = [];
    const per = op.per;
    if (op.tipus === 'divideix') {
        out.push([fes(nouS, add([...termes(O), { s: -1, e: per }])), 'RESTA_EN_LLOC_DE_DIVIDIR']);
        out.push([fes(nouS, multiplica(O, per)), 'MULTIPLICA_EN_LLOC_DE_DIVIDIR']);
        out.push([fes(nouS, div(per, O)), 'QUOCIENT_GIRAT']);
    } else if (op.tipus === 'multiplica') {
        out.push([fes(nouS, div(O, per)), 'DIVIDEIX_EN_LLOC_DE_MULTIPLICAR']);
        if (esMeitat(S)) out.push([fes(nouS, O), 'OBLIDA_MEITAT']);
        // El denominador puja al mateix membre (v = Δx · Δt) en lloc de passar a l'altre
        else out.push([fes(multiplica(S.n, per), O), 'NOMES_UN_MEMBRE']);
    } else if (op.tipus === 'resta' || op.tipus === 'suma') {
        // Els termes passen a l'altre membre sense canviar de signe
        out.push([fes(nouS, add([...termes(O), ...op.mou.map(t => ({ s: t.s, e: t.e }))])), 'SIGNE_EN_PASSAR']);
        out.push([fes(nouS, div(O, per)), 'DIVIDEIX_EN_LLOC_DE_RESTAR']);
    } else if (op.tipus === 'arrel') {
        out.push([fes(nouS, div(O, N(2))), 'ARREL_COM_MEITAT']);
        out.push([fes(nouS, pow(O)), 'QUADRAT_EN_LLOC_D_ARREL']);
        if (O.t === 'div') out.push([fes(nouS, div(sqrt(O.n), O.d)), 'ARREL_UNA_PART']);
    }
    return out;
}
