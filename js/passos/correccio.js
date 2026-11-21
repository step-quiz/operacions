/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/correccio.js
 * ROL: Correcció dels passos del joc de passos (js/passos/joc-passos.js), comuna
 *      a totes les activitats que en fan servir: Equacions de 2n grau,
 *      Expressions algebraiques, Identitats notables…
 * ARQUITECTURA: mòdul pur (cap DOM).
 *
 *   PAS (dades, sense funcions; el format complet és a joc-passos.js)
 *     camps      { nom: tipus }, en l'ordre d'escriure'ls. Tipus:
 *                  enter        un enter (obligatori)
 *                  coeficient   un enter; en blanc val 0 (el terme no hi és)
 *                  exponent     un enter; en blanc val 1
 *                  racional     numerador i denominador ({ n, d }); denominador en blanc = 1
 *                  coeficientRacional  com racional, però tot en blanc val 0 (el terme no hi és)
 *                  tria         el valor d'una de les opcions del pas
 *                  decimal      un decimal escrit amb coma ({ v: '0,1', p: '6' }; p és el període, opcional)
 *                  pintat       quantes parts ha pintat l'alumne a la figura del pas (0 = encara no)
 *                  fitxa        l'id de la targeta que l'alumne ha posat a la casella
 *                  punts        els punts [[x, y], …] que l'alumne ha situat a la quadrícula; la
 *                               solució és { punts: [[x, y], …] } (aquests, en qualsevol ordre) o
 *                               { recta: [m, n], quants } (tants punts diferents de y = mx + n)
 *                  recta        { i, ple, costat } (js/passos/recta-intervals.js): la marca on és el
 *                               punt, si hi entra (ple) i el costat de la semirecta ('esq' | 'dre')
 *                  taula        la taula de signes (js/passos/taula-signes.js): punts de prova i cel·les;
 *                               la solució és { prova: bool, files: { id: [valor per columna] } }
 *     solucio    { nom: valor }: racional → [n, d] irreductible
 *     parell     [nom, nom]: aquests dos camps es poden respondre en qualsevol ordre
 *     proporcional  [nom, nom, nom]: val qualsevol terna d'enters proporcional a la solució
 *     alternatives  [solucio, …]: altres respostes que també són correctes (p. ex. (−x + 3)² per (x − 3)²)
 *
 * DEPENDÈNCIES: utils.js (gcd, parseStrictInt) i algebra/racionals.js.
 * ============================================================================
 */

import { gcd, parseStrictInt } from '../utils.js';
import {
    coefsIguals,
    comRacional,
    producteCoef,
    racional,
    racionalsIguals,
    sumaCoef,
    textRacional,
} from '../algebra/racionals.js';
import { llegeixTaula, taulaCorrecta } from './taula-signes.js';

// ── Correcció ────────────────────────────────────────────────────────────────
const buit = s => s === undefined || s === null || String(s).trim() === '';
// Què val una casella en blanc, als camps que es poden deixar en blanc
const VALOR_EN_BLANC = { coeficient: 0, exponent: 1, coeficientRacional: [0, 1] };

/**
 * Un decimal escrit (part «0,1» i període «6», opcional) com a racional [n, d]; null si no és un
 * decimal ben escrit. «0,1» amb període «6» és 0,1666… = 1/6.
 */
export function llegeixDecimal(text, periode = '') {
    const t = String(text || '')
        .trim()
        .replace('.', ',');
    const p = String(periode || '').trim();
    const m = t.match(/^(\d+)(?:,(\d*))?$/);
    if (!m || !/^\d*$/.test(p)) return null;
    const [enter, ante] = [Number(m[1]), m[2] || ''];
    const deu = 10 ** ante.length;
    if (!p) return racional(enter * deu + Number(ante || 0), deu);
    const nou = 10 ** p.length - 1;
    return racional((enter * deu + Number(ante || 0)) * nou + Number(p), deu * nou);
}

/** Si el punt (x, y) és de la recta y = mx + n (m i n, enters o fraccions). */
export function puntDeRecta([x, y], [m, n]) {
    return coefsIguals(y, sumaCoef(producteCoef(m, x), n));
}

/** Si uns punts situats són els de la solució d'un camp 'punts' (vegeu la capçalera). */
export function puntsCorrectes(punts, sol) {
    const clau = ([x, y]) => `${x},${y}`;
    const diferents = new Set(punts.map(clau));
    if (sol.punts) return diferents.size === sol.punts.length && sol.punts.every(p => diferents.has(clau(p)));
    return diferents.size === sol.quants && punts.every(p => puntDeRecta(p, sol.recta));
}

/** Si el camp s'escriu com una fracció (numerador i denominador). */
export function esCampFraccio(tipus) {
    return tipus === 'racional' || tipus === 'coeficientRacional';
}

/**
 * Corregeix la resposta d'un pas.
 * @param {object} pas    { camps, solucio, parell?, proporcional?, opcions? }
 * @param {object} resp   { nom: text } · racional: { nom: { n: text, d: text } } · tria: { tria: valor }
 * @returns {object} estat: 'ok' | 'error' (resta un intent) | 'incomplet' | 'avis' (no en resta cap;
 *                   codi: NO_ENTER, NO_DECIMAL, DEN_ZERO, NO_SIMPLIFICADA, FALTEN_PUNTS o FALTA_RECTA); camp: el que falta o el de l'avís;
 *                   valors: el que ha escrit, ja com a nombres (racionals simplificats);
 *                   malament: noms dels camps equivocats
 */
export function corregeixPas(pas, resp = {}) {
    const noms = Object.keys(pas.camps);
    // Si totes les caselles es poden deixar en blanc i ho estan, encara no ha respost
    if (noms.every(nom => pas.camps[nom] in VALOR_EN_BLANC && buit(resp[nom]))) {
        return { estat: 'incomplet', camp: noms[0] };
    }
    const escrit = {};
    for (const nom of noms) {
        const tipus = pas.camps[nom];
        const r = resp[nom];
        if (tipus === 'tria' || tipus === 'fitxa') {
            if (buit(r)) return { estat: 'incomplet', camp: nom };
            escrit[nom] = r;
            continue;
        }
        if (tipus === 'punts') {
            const punts = Array.isArray(r) ? r : [];
            const quants = (pas.solucio[nom].punts || []).length || pas.solucio[nom].quants || 1;
            if (!punts.length) return { estat: 'incomplet', camp: nom };
            if (punts.length < quants) return { estat: 'avis', codi: 'FALTEN_PUNTS', camp: nom };
            escrit[nom] = punts;
            continue;
        }
        if (tipus === 'recta') {
            if (!r || r.i === null || r.i === undefined) return { estat: 'incomplet', camp: nom };
            if (r.ple === null || r.ple === undefined || !r.costat)
                return { estat: 'avis', codi: 'FALTA_RECTA', camp: nom };
            escrit[nom] = { i: r.i, ple: r.ple, costat: r.costat };
            continue;
        }
        if (tipus === 'taula') {
            const t = llegeixTaula(r, pas.solucio[nom], taulaDelCamp(pas, nom));
            if (t.estat) return { ...t, camp: nom };
            escrit[nom] = t.valor;
            continue;
        }
        if (tipus === 'pintat') {
            const n = parseStrictInt(r);
            if (!(n > 0)) return { estat: 'incomplet', camp: nom };
            escrit[nom] = n;
            continue;
        }
        if (tipus === 'decimal') {
            if (buit(r && r.v)) return { estat: 'incomplet', camp: nom };
            const q = llegeixDecimal(r.v, r.p);
            if (!q) return { estat: 'avis', codi: 'NO_DECIMAL', camp: nom };
            escrit[nom] = q;
            continue;
        }
        const fraccio = esCampFraccio(tipus);
        const [textN, textD] = fraccio ? [r && r.n, r && r.d] : [r, ''];
        if (buit(textN)) {
            if (tipus in VALOR_EN_BLANC) {
                escrit[nom] = VALOR_EN_BLANC[tipus];
                continue;
            }
            return { estat: 'incomplet', camp: nom };
        }
        const n = parseStrictInt(textN);
        const d = buit(textD) ? 1 : parseStrictInt(textD);
        if (Number.isNaN(n) || Number.isNaN(d)) return { estat: 'avis', codi: 'NO_ENTER', camp: nom };
        if (d === 0) return { estat: 'avis', codi: 'DEN_ZERO', camp: nom };
        escrit[nom] = fraccio ? [n, d] : n;
    }
    const igualRecta = (a, b) => a.i === b.i && a.ple === b.ple && a.costat === b.costat;
    const encerta = (nom, sol) =>
        pas.camps[nom] === 'taula'
            ? taulaCorrecta(escrit[nom], sol[nom], taulaDelCamp(pas, nom))
            : pas.camps[nom] === 'punts'
              ? puntsCorrectes(escrit[nom], sol[nom])
              : pas.camps[nom] === 'recta'
                ? igualRecta(escrit[nom], sol[nom])
                : esCampFraccio(pas.camps[nom]) || pas.camps[nom] === 'decimal'
                  ? racionalsIguals(escrit[nom], comRacional(sol[nom]))
                  : escrit[nom] === sol[nom];
    // Camps equivocats respecte d'una solució (amb un parell, també en l'altre ordre)
    function malamentRespecte(sol) {
        if (pas.proporcional) {
            const [x, y, z] = pas.proporcional.map(nom => escrit[nom]);
            const [a, b, c] = pas.proporcional.map(nom => sol[nom]);
            return x !== 0 && x * b === y * a && x * c === z * a ? [] : [...pas.proporcional];
        }
        let dolents = noms.filter(nom => !encerta(nom, sol));
        if (pas.parell && dolents.length) {
            const [p, q] = pas.parell;
            const creuat = [p, q].filter((nom, i) => !encerta(nom, { [nom]: sol[i ? p : q] }));
            if (creuat.length < dolents.length) dolents = creuat;
        }
        return dolents;
    }
    const malament = [pas.solucio, ...(pas.alternatives || [])]
        .map(malamentRespecte)
        .reduce((millor, m) => (m.length < millor.length ? m : millor));

    const valors = {};
    let perSimplificar = null;
    for (const [nom, v] of Object.entries(escrit)) {
        if (!esCampFraccio(pas.camps[nom])) valors[nom] = v;
        else {
            valors[nom] = racional(v[0], v[1]);
            if (!perSimplificar && (v[1] < 0 || gcd(v[0], v[1]) !== 1)) perSimplificar = nom;
        }
    }
    if (malament.length) return { estat: 'error', valors, malament };
    if (perSimplificar) return { estat: 'avis', codi: 'NO_SIMPLIFICADA', camp: perSimplificar, valors };
    return { estat: 'ok', valors };
}

/** La taula del camp nom (el tros { camp: nom, taula } de la plantilla, també dins d'un grup). */
function taulaDelCamp(pas, nom) {
    const busca = trossos => {
        for (const t of trossos || []) {
            if (t.camp === nom && t.taula) return t.taula;
            const dins = t.grup && busca(t.grup);
            if (dins) return dins;
        }
        return null;
    };
    return busca(pas.plantilla);
}

/** La resposta escrita, en text pla, per a l'historial de la sessió (una activitat la pot fer a mida). */
export function textResposta(pas, valors) {
    return Object.keys(pas.camps)
        .map(nom => {
            if (pas.camps[nom] === 'punts') return valors[nom].map(([x, y]) => `(${x}, ${y})`).join(' ');
            if (pas.camps[nom] !== 'tria') return textRacional(valors[nom]);
            const opcio = pas.opcions.find(([valor]) => valor === valors[nom]);
            return opcio ? opcio[1] : String(valors[nom]);
        })
        .join(' ; ');
}

/**
 * Si l'única cosa que falla és un terme de coeficient 1 o −1 deixat en blanc (és a dir, a 0):
 * l'alumne ha llegit «x» com «no hi ha coeficient». Per als errors típics de cada activitat.
 */
export function coeficientUnEnBlanc(pas, valors) {
    const noms = Object.keys(pas.camps).filter(nom => pas.camps[nom] in VALOR_EN_BLANC && nom in valors);
    const zero = nom => racionalsIguals(comRacional(valors[nom]), [0, 1]);
    const un = nom => [1, -1].some(u => racionalsIguals(comRacional(pas.solucio[nom]), [u, 1]));
    const blancs = noms.filter(nom => zero(nom) && un(nom));
    const bons = Object.keys(pas.camps).filter(nom => !blancs.includes(nom));
    return (
        blancs.length > 0 && bons.every(nom => racionalsIguals(comRacional(valors[nom]), comRacional(pas.solucio[nom])))
    );
}

/**
 * Diagnòstic per valors equivocats: si el pas porta, a dades.distractors, els valors que donen
 * els errors típics de cada camp ({ camp: [[valor, errorType], …] }), torna l'errorType del
 * valor escrit al primer camp equivocat (o null si no n'és cap).
 */
export function errorPerDistractors(pas, valors) {
    const distractors = (pas.dades && pas.dades.distractors) || {};
    const igual = (x, y) =>
        (typeof x === 'number' && typeof y === 'number') || typeof x === 'string' || typeof y === 'string'
            ? x === y
            : racionalsIguals(comRacional(x), comRacional(y));
    for (const nom of Object.keys(pas.camps)) {
        // la recta no té distractors per valor: el diagnòstic el fa l'activitat (punt, costat…)
        if (pas.camps[nom] === 'recta') continue;
        if (!(nom in valors) || igual(valors[nom], pas.solucio[nom])) continue;
        const trobat = (distractors[nom] || []).find(([valor]) => igual(valor, valors[nom]));
        return trobat ? trobat[1] : null;
    }
    return null;
}
