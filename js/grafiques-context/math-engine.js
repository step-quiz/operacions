/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafiques-context/math-engine.js
 * ROL: Motor de «Gràfiques en context» (grafiques-context.html): una història, la
 *      seva gràfica (trams rectes o corbes) i la pregunta, amb els distractors de
 *      cada error típic (errors.js). Cada pregunta és un sol pas del joc de passos:
 *      caselles (decimal) o opcions (tria; al relat, les opcions són gràfiques).
 * ARQUITECTURA: mòdul pur (la gràfica, de js/passos/grafica-context.js).
 *   MENES (?grafiques=): 'segments' (excursió, dipòsit, bateria del mòbil),
 *     'temperatura' (corba suau d'un dia) i 'forma' (planta, cotxe que arrenca,
 *     objecte que cau, globus que es desinfla: corbes que acceleren o frenen).
 *     '' les alterna totes; 'corbes', temperatura i forma.
 *   TIPUS de pregunta, per mena i nivell (TIPUS_GX); grups per triar a l'índex
 *     (?preguntes=, PREGUNTES_GX): llegir · descriure · relat.
 *   Tots els valors que es pregunten cauen en una ratlla de la quadrícula (els
 *   trams corbs, amb Δ = s·D², hi passen a cada x enter): es llegeixen exactament.
 *   Les afirmacions i les gràfiques del relat porten a dades el que afirmen (dades.
 *   afirmacions, dades.targetes), perquè les proves ho comprovin amb la gràfica.
 *   generaPreguntaGX({ grafiques, preguntes, nivell, index, opcions }) → { text, clau, enunciat, svg?, passos: [pas] }
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, passos/grafica-context.js.
 * ============================================================================
 */

import { pick, randInt, shuffle } from '../utils.js';
import { racional } from '../algebra/racionals.js';
import { svgGraficaContext, valorGrafica } from '../passos/grafica-context.js';
import { TEXTOS_GX } from './strings.js';

// ── Opcions ──────────────────────────────────────────────────────────────────
export const GRAFIQUES_GX = {
    '': ['segments', 'temperatura', 'forma'],
    'segments': ['segments'],
    'corbes': ['temperatura', 'forma'],
};

export const TIPUS_GX = {
    segments: {
        1: ['valor', 'maxim-valor', 'maxim-instant', 'aturat', 'creix', 'decreix'],
        2: ['antiimatge', 'rapid', 'relat'],
        3: ['velocitat', 'domini-recorregut', 'afirmacions'],
    },
    temperatura: {
        1: ['valor', 'maxim-valor', 'maxim-instant', 'minim-valor', 'minim-instant', 'creix'],
        2: ['decreix'],
        3: ['domini-recorregut'],
    },
    forma: { 1: ['valor'], 2: ['antiimatge', 'increment', 'forma', 'relat'], 3: ['domini-recorregut'] },
};

export const PREGUNTES_GX = {
    llegir: [
        'valor',
        'antiimatge',
        'maxim-valor',
        'maxim-instant',
        'minim-valor',
        'minim-instant',
        'aturat',
        'increment',
    ],
    descriure: ['creix', 'decreix', 'rapid', 'forma', 'velocitat', 'domini-recorregut', 'afirmacions'],
    relat: ['relat'],
};
const totsTipus = mena => [1, 2, 3].flatMap(n => TIPUS_GX[mena][n]);
const delGrup = (mena, preguntes) => totsTipus(mena).filter(t => (PREGUNTES_GX[preguntes] || []).includes(t));

export function menaGX(grafiques, index, preguntes = '') {
    const llista = GRAFIQUES_GX[grafiques] || GRAFIQUES_GX[''];
    const amb = llista.filter(m => delGrup(m, preguntes).length);
    const ll = amb.length ? amb : llista;
    return ll[index % ll.length];
}

export function tipusGX(mena, nivell, preguntes = '') {
    const grup = delGrup(mena, preguntes);
    if (grup.length) return pick(grup);
    return pick([1, 2, 3].filter(n => n <= nivell).flatMap(n => TIPUS_GX[mena][n]));
}

// ── Ajudes ───────────────────────────────────────────────────────────────────
export function rac(x) {
    let d = 1;
    while (!Number.isInteger(Math.round(x * d * 1e6) / 1e6) && d < 1e4) d *= 10;
    return racional(Math.round(x * d), d);
}
const tn = v => String(Math.round(v * 1000) / 1000).replace('.', ',');
const texT = t => `\\text{${String(t).replace(/%/g, '\\%')}}`;
const esEnter = v => Math.abs(v - Math.round(v)) < 1e-9;
const LLETRES = 'ABCDE';

export function netsGX(sol, llista) {
    const valor = v => (Array.isArray(v) ? v[0] / v[1] : v);
    const clau = v => String(Math.round(valor(v) * 1e9) / 1e9);
    const vist = new Set([clau(sol)]);
    return llista.filter(([v]) => {
        if (!Number.isFinite(valor(v)) || valor(v) < 0) return false;
        const k = clau(v);
        if (vist.has(k)) return false;
        vist.add(k);
        return true;
    });
}

/** Un pas de caselles (decimal): camps [{ nom, sol, distractors }] i la plantilla de text i caselles. */
function pasCaselles(id, enunciat, camps, plantilla, linia, extra = {}) {
    const solucio = {};
    const distractors = {};
    camps.forEach(c => {
        solucio[c.nom] = rac(c.sol);
        distractors[c.nom] = netsGX(c.sol, c.distractors || []).map(([v, e]) => [Array.isArray(v) ? v : rac(v), e]);
    });
    return {
        id,
        mena: id,
        nom: TEXTOS_GX.noms[id],
        enunciat,
        plantilla,
        camps: Object.fromEntries(camps.map(c => [c.nom, 'decimal'])),
        solucio,
        dades: { distractors, sol: camps.map(c => c.sol) },
        linia,
        ...extra,
    };
}
const unaCasella = (id, enunciat, sol, distractors, linia, unitat) =>
    pasCaselles(
        id,
        enunciat,
        [{ nom: 'r', sol, distractors }],
        [{ camp: 'r' }, ...(unitat ? [{ tex: `\\;${texT(unitat)}` }] : [])],
        linia
    );

/** Un pas d'opcions: certa i falses [text, error, dada?]; amb svg, cada opció és una gràfica. */
function pasTria(id, enunciat, cert, falses, n, linia) {
    const triades = shuffle(falses.slice()).slice(0, Math.max(1, n - 1));
    const totes = shuffle([{ valor: 'cert', ...cert }, ...triades.map((f, i) => ({ valor: `f${i}`, ...f }))]);
    const ambSvg = totes.some(o => o.svg);
    const opcions = totes.map((o, i) => (ambSvg ? [o.valor, `Gràfica ${LLETRES[i]}`, o.svg] : [o.valor, o.text]));
    const lletra = ambSvg ? LLETRES[totes.findIndex(o => o.valor === 'cert')] : '';
    return {
        id,
        mena: id,
        nom: TEXTOS_GX.noms[id],
        enunciat,
        plantilla: [],
        camps: { tria: 'tria' },
        opcions,
        solucio: { tria: 'cert' },
        dades: {
            distractors: { tria: totes.filter(o => o.valor !== 'cert' && o.error).map(o => [o.valor, o.error]) },
            afirmacions: totes.filter(o => o.dada).map(o => ({ valor: o.valor, dada: o.dada })),
            targetes: totes.filter(o => o.trams).map(o => ({ valor: o.valor, trams: o.trams })),
        },
        linia: linia || texT(ambSvg ? `La gràfica ${lletra}` : cert.text),
    };
}

// Punts clau d'uns trams
const punts = trams => [[trams[0].x0, trams[0].y0], ...trams.map(t => [t.x1, t.y1])];
const pendent = t => (t.y1 - t.y0) / (t.x1 - t.x0);
const signe = t => Math.sign(t.y1 - t.y0);

// ── HISTÒRIES DE SEGMENTS ────────────────────────────────────────────────────
const NOMS = ['la Marta', 'en Pau', 'la Laia', 'en Biel', 'la Júlia', 'en Nil'];
const maj = t => t.charAt(0).toUpperCase() + t.slice(1);

const HISTORIES = {
    excursio: {
        unitat: 1,
        xMax: 9,
        yMax: 14,
        pasY: 1,
        cadaY: 2,
        titolX: 'Temps (h)',
        titolY: 'Distància a casa (km)',
        ux: 'h',
        uy: 'km',
        uRitme: 'km/h',
        patrons: [
            ['+', '0', '-'],
            ['+', '0', '+', '-'],
            ['+', '+', '0', '-'],
            ['+', '0', '+', '0', '-'],
        ],
        inici: () => 0,
        final: 0,
        canvi: () => randInt(2, 5),
        enunciat: nom =>
            `${maj(nom)} fa una excursió a peu. La gràfica diu a quina distància de casa és al llarg del temps.`,
        q: {
            valor: x => `Al cap de ${tn(x)} h, a quants quilòmetres de casa és?`,
            antiimatge: y => `Al cap de quantes hores és a ${tn(y)} km de casa?`,
            maxValor: 'A quina distància màxima de casa arriba?',
            maxInstant: 'Al cap de quantes hores és més lluny de casa?',
            aturat: "Quantes hores s'atura en total?",
            creix: "En quin d'aquests trams s'allunya de casa?",
            decreix: "En quin d'aquests trams torna cap a casa?",
            rapid: "En quin d'aquests trams camina més de pressa?",
            ritme: (a, b) => `A quina velocitat camina entre les ${tn(a)} h i les ${tn(b)} h?`,
            recorregut: 'Entre quines distàncies de casa es mou?',
            domini: 'Entre quins temps va la gràfica (el domini)?',
        },
        afirma: {
            valor: (x, y) => `Al cap de ${tn(x)} h és a ${tn(y)} km de casa.`,
            creix: 's’allunya de casa',
            decreix: 'torna cap a casa',
            maxim: y => `La distància màxima a casa és de ${tn(y)} km.`,
        },
        interval: (a, b) => `De ${tn(a)} h a ${tn(b)} h`,
        relat: (trams, nom) =>
            trams
                .map((t, i) => {
                    const d = t.x1 - t.x0;
                    if (signe(t) > 0)
                        return i === 0
                            ? `${maj(nom)} surt de casa i camina ${tn(d)} h fins a ${tn(t.y1)} km.`
                            : `Després camina ${tn(d)} h més, fins a ${tn(t.y1)} km de casa.`;
                    if (signe(t) === 0) return `S'atura ${tn(d)} h.`;
                    return t.y1 === 0
                        ? `Torna a casa en ${tn(d)} h.`
                        : `Torna ${tn(d)} h cap a casa, fins a ${tn(t.y1)} km.`;
                })
                .join(' '),
    },
    diposit: {
        unitat: 10,
        xMax: 12,
        yMax: 100,
        pasY: 10,
        cadaY: 20,
        titolX: 'Temps (min)',
        titolY: 'Aigua (l)',
        ux: 'min',
        uy: 'l',
        uRitme: 'l/min',
        patrons: [
            ['+', '0', '-', '+'],
            ['+', '-', '0', '+'],
            ['-', '0', '+', '-'],
            ['+', '0', '-', '0', '+'],
        ],
        inici: () => pick([0, 10, 20, 30]),
        final: null,
        canvi: () => randInt(2, 5),
        enunciat: () => "Un dipòsit d'aigua s'omple i es buida. La gràfica diu quants litres hi ha a cada moment.",
        q: {
            valor: x => `Al minut ${tn(x)}, quants litres hi ha al dipòsit?`,
            antiimatge: y => `En quin minut hi ha ${tn(y)} litres?`,
            maxValor: 'Quants litres hi ha, com a màxim?',
            maxInstant: 'En quin minut hi ha més aigua?',
            aturat: "Quants minuts no canvia la quantitat d'aigua?",
            creix: "En quin d'aquests trams s'omple el dipòsit?",
            decreix: "En quin d'aquests trams es buida el dipòsit?",
            rapid: "En quin d'aquests trams canvia més de pressa la quantitat d'aigua?",
            ritme: (a, b) => `Quants litres per minut entren o surten entre el minut ${tn(a)} i el ${tn(b)}?`,
            recorregut: "Entre quines quantitats d'aigua es mou?",
            domini: 'Entre quins minuts va la gràfica (el domini)?',
        },
        afirma: {
            valor: (x, y) => `Al minut ${tn(x)} hi ha ${tn(y)} litres.`,
            creix: 's’omple',
            decreix: 'es buida',
            maxim: y => `Com a màxim hi ha ${tn(y)} litres.`,
        },
        interval: (a, b) => `Del minut ${tn(a)} al ${tn(b)}`,
        relat: trams =>
            [`Al començament hi ha ${tn(trams[0].y0)} litres.`]
                .concat(
                    trams.map(t => {
                        const d = t.x1 - t.x0;
                        if (signe(t) > 0) return `Durant ${tn(d)} min s'omple fins a ${tn(t.y1)} litres.`;
                        if (signe(t) === 0) return `Durant ${tn(d)} min no entra ni surt aigua.`;
                        return `Durant ${tn(d)} min es buida fins a ${tn(t.y1)} litres.`;
                    })
                )
                .join(' '),
    },
    bateria: {
        unitat: 10,
        xMax: 10,
        yMax: 100,
        pasY: 10,
        cadaY: 20,
        titolX: 'Temps (h)',
        titolY: 'Bateria (%)',
        ux: 'h',
        uy: '%',
        uRitme: '% per hora',
        patrons: [
            ['-', '0', '-', '+'],
            ['-', '+', '0', '-'],
            ['-', '0', '+', '-'],
            ['-', '-', '0', '+'],
        ],
        inici: () => pick([100, 90, 80]),
        final: null,
        canvi: () => randInt(2, 4),
        enunciat: nom => `La gràfica diu la càrrega de la bateria del mòbil de ${nom} al llarg del dia.`,
        q: {
            valor: x => `Al cap de ${tn(x)} h, quina càrrega té la bateria (%)?`,
            antiimatge: y => `Al cap de quantes hores té el ${tn(y)} %?`,
            maxValor: 'Quina és la càrrega màxima (%)?',
            maxInstant: 'Al cap de quantes hores té més càrrega?',
            aturat: 'Quantes hores no canvia la càrrega?',
            creix: "En quin d'aquests trams es carrega?",
            decreix: "En quin d'aquests trams es descarrega?",
            rapid: "En quin d'aquests trams canvia més de pressa la càrrega?",
            ritme: (a, b) => `Quants punts per hora (%) canvia la càrrega entre les ${tn(a)} h i les ${tn(b)} h?`,
            recorregut: 'Entre quines càrregues (%) es mou?',
            domini: 'Entre quins temps va la gràfica (el domini)?',
        },
        afirma: {
            valor: (x, y) => `Al cap de ${tn(x)} h té el ${tn(y)} %.`,
            creix: 'es carrega',
            decreix: 'es descarrega',
            maxim: y => `La càrrega màxima és del ${tn(y)} %.`,
        },
        interval: (a, b) => `De ${tn(a)} h a ${tn(b)} h`,
        relat: trams =>
            [`Al començament té el ${tn(trams[0].y0)} %.`]
                .concat(
                    trams.map(t => {
                        const d = t.x1 - t.x0;
                        if (signe(t) > 0) return `Durant ${tn(d)} h es carrega fins al ${tn(t.y1)} %.`;
                        if (signe(t) === 0) return `Durant ${tn(d)} h està apagat.`;
                        return `Durant ${tn(d)} h el fa servir i baixa fins al ${tn(t.y1)} %.`;
                    })
                )
                .join(' '),
    },
};

/** Uns trams per a una història, amb pendents diferents i dins dels límits. */
export function tramsHistoria(h) {
    for (let intent = 0; intent < 2000; intent++) {
        const patro = pick(h.patrons);
        const trams = [];
        let [x, y] = [0, h.inici()];
        let bo = true;
        patro.forEach((sg, i) => {
            const d = sg === '0' ? randInt(1, 2) : randInt(1, 3);
            let y1 = y;
            if (sg === '+') y1 = y + h.canvi() * h.unitat;
            if (sg === '-') y1 = i === patro.length - 1 && h.final !== null ? h.final : y - h.canvi() * h.unitat;
            if (y1 < 0 || y1 > h.yMax) bo = false;
            trams.push({ x0: x, x1: x + d, y0: y, y1, forma: 'recta' });
            [x, y] = [x + d, y1];
        });
        if (!bo || x > h.xMax) continue;
        // Pendents diferents (un sol tram «més de pressa») i no gaire suaus
        const p = trams.filter(t => signe(t) !== 0).map(t => Math.abs(pendent(t)));
        if (new Set(p.map(v => v.toFixed(6))).size !== p.length) continue;
        if (trams.some(t => signe(t) !== 0 && t.y1 === t.y0)) continue;
        return trams;
    }
    throw new Error('tramsHistoria: no hi ha cap combinació');
}

// Les x enteres on el valor cau en una ratlla (múltiple de la unitat): es llegeix exactament
const xsLlegibles = (trams, unitat = 1) => {
    const T = trams[trams.length - 1].x1;
    const xs = [];
    for (let x = 0; x <= T; x++) if (esEnter(valorGrafica(trams, x) / unitat)) xs.push(x);
    return xs;
};
/** Les x on la gràfica val y (null si en un tram pla, o si alguna no és entera). */
function antiimatges(trams, y) {
    const xs = [];
    for (const t of trams) {
        if (signe(t) === 0) {
            if (t.y0 === y) return null;
            continue;
        }
        const [a, b] = [Math.min(t.y0, t.y1), Math.max(t.y0, t.y1)];
        if (y < a - 1e-9 || y > b + 1e-9) continue;
        let x;
        if (!t.forma || t.forma === 'recta') x = t.x0 + ((y - t.y0) / (t.y1 - t.y0)) * (t.x1 - t.x0);
        else {
            // corba: la x entera on hi passa (si n'hi ha)
            const cand = [];
            for (let k = t.x0; k <= t.x1; k++) if (Math.abs(valorGrafica([t], k) - y) < 1e-9) cand.push(k);
            if (!cand.length) return null;
            x = cand[0];
        }
        if (!esEnter(x)) return null;
        if (!xs.some(v => Math.abs(v - x) < 1e-9)) xs.push(Math.round(x));
    }
    return xs.sort((p, q) => p - q);
}

function dibuixa(h, trams, mini = false) {
    const T = trams[trams.length - 1].x1;
    return svgGraficaContext({
        trams,
        xMax: mini ? h.xMaxTargetes : Math.max(T, h.xMin || 0),
        yMax: h.yMaxGrafica || h.yMax,
        pasX: h.pasX || 1,
        cadaX: h.cadaX || 0,
        pasY: h.pasY,
        cadaY: mini ? h.cadaYmini || h.cadaY * 2 : h.cadaY,
        titolX: h.titolX,
        titolY: h.titolY,
        mini,
    });
}

/** Les opcions d'interval (tria) per a creix / decreix: un tram del signe que toca. */
function opcionsTram(h, trams, sg) {
    const bons = trams.filter(t => signe(t) === sg);
    const t = pick(bons);
    const falses = trams
        .filter(u => signe(u) !== sg)
        .map(u => ({ text: h.interval(u.x0, u.x1), error: signe(u) === 0 ? 'HORITZONTAL' : 'CREIX_DECREIX' }));
    return { cert: { text: h.interval(t.x0, t.x1) }, falses };
}

/** Variants falses d'unes trams (per al relat): [trams, error]. */
function variantsRelat(h, trams) {
    const v = [];
    const dins = tt =>
        tt.every(t => t.y0 >= 0 && t.y1 >= 0 && t.y0 <= h.yMax && t.y1 <= h.yMax) && tt[tt.length - 1].x1 <= h.xMax;
    // Refà les x a partir de les durades
    const ambDurades = (tt, durades) => {
        let x = 0;
        return tt.map((t, k) => {
            const n = { ...t, x0: x, x1: x + durades[k] };
            x += durades[k];
            return n;
        });
    };
    const durades = trams.map(t => t.x1 - t.x0);
    // Temps canviats: dos trams de durades diferents s'intercanvien les durades (dues variants com a molt)
    let canvis = 0;
    for (let i = 0; i < trams.length && canvis < 2; i++)
        for (let j = i + 1; j < trams.length && canvis < 2; j++) {
            if (durades[i] === durades[j]) continue;
            const d = durades.slice();
            [d[i], d[j]] = [d[j], d[i]];
            v.push([ambDurades(trams, d), 'TEMPS_CANVIATS']);
            canvis++;
        }
    // Un canvi d'una hora: un tram s'allarga i el següent s'escurça
    for (let i = 0; i + 1 < trams.length; i++)
        if (durades[i + 1] >= 2) {
            const d = durades.slice();
            d[i]++;
            d[i + 1]--;
            v.push([ambDurades(trams, d), 'TEMPS_CANVIATS']);
            break;
        }
    // Un tram pla dibuixat baixant (aturar-se no és tornar enrere)
    const ip = trams.findIndex(t => signe(t) === 0 && t.y0 > 0);
    if (ip >= 0) {
        const k = Math.min(trams[ip].y0, 2 * h.unitat);
        const nous = trams.map((t, j) =>
            j < ip
                ? { ...t }
                : j === ip
                  ? { ...t, y1: t.y1 - k }
                  : { ...t, y0: t.y0 - k, y1: j === trams.length - 1 && h.final !== null ? t.y1 : t.y1 - k }
        );
        if (dins(nous) && nous.every(t => !(signe(t) === 0 && t.y0 !== t.y1))) v.push([nous, 'HORITZONTAL']);
    }
    // L'últim tram de baixada dibuixat pujant (la distància a casa no és el camí fet)
    const iu = trams.length - 1;
    if (signe(trams[iu]) < 0) {
        const nous = trams.map(t => ({ ...t }));
        nous[iu].y1 = trams[iu].y0 + (trams[iu].y0 - trams[iu].y1);
        if (dins(nous)) v.push([nous, 'CREIX_DECREIX']);
    }
    // Dos trams que pugen (o baixen) s'intercanvien quant canvien
    const mou = trams.map((t, j) => j).filter(j => signe(trams[j]) !== 0);
    for (let p = 0; p < mou.length; p++)
        for (let q = p + 1; q < mou.length; q++) {
            const [i, j] = [mou[p], mou[q]];
            const [di, dj] = [trams[i].y1 - trams[i].y0, trams[j].y1 - trams[j].y0];
            if (Math.sign(di) !== Math.sign(dj) || di === dj) continue;
            let y = trams[0].y0;
            const nous = trams.map((t, k) => {
                const d = k === i ? dj : k === j ? di : t.y1 - t.y0;
                const n = { ...t, y0: y, y1: y + d };
                y += d;
                return n;
            });
            if (dins(nous) && !v.some(([, e]) => e === 'VALORS_CANVIATS')) v.push([nous, 'VALORS_CANVIATS']);
        }
    // Un valor on acaba un tram que puja, una unitat més amunt (i la resta igual de desplaçada)
    const ip2 = trams.findIndex(t => signe(t) > 0);
    if (ip2 >= 0) {
        const k = h.unitat;
        const nous = trams.map((t, j) =>
            j < ip2
                ? { ...t }
                : j === ip2
                  ? { ...t, y1: t.y1 + k }
                  : { ...t, y0: t.y0 + k, y1: j === trams.length - 1 && h.final !== null ? t.y1 : t.y1 + k }
        );
        if (dins(nous) && nous.every(t => !(t.y0 === t.y1 && trams.find(u => u.x0 === t.x0 && signe(u) !== 0))))
            v.push([nous, 'VALORS_CANVIATS']);
    }
    const clau = tt => punts(tt).join(';');
    const vist = new Set([clau(trams)]);
    return v.filter(([tt]) => (vist.has(clau(tt)) ? false : vist.add(clau(tt))));
}

function preguntaSegments(tipus, n) {
    const id = pick(Object.keys(HISTORIES));
    const h = { ...HISTORIES[id] };
    const nom = pick(NOMS);
    const trams = tramsHistoria(h);
    const T = trams[trams.length - 1].x1;
    const pts = punts(trams);
    const ys = pts.map(p => p[1]);
    const [ymin, ymax] = [Math.min(...ys), Math.max(...ys)];
    const enunciat = h.enunciat(nom);
    let pas;
    let ambGrafica = true;
    const escala = (v, err = 'SENSE_ESCALA') => (h.unitat > 1 ? [[v / h.unitat, err]] : []);
    const unicMax = ys.filter(y => y === ymax).length === 1;
    if (tipus === 'maxim-instant' && !unicMax) tipus = 'maxim-valor';
    if (tipus === 'valor') {
        const x = pick(xsLlegibles(trams, h.unitat).filter(v => v > 0));
        const y = valorGrafica(trams, x);
        pas = unaCasella(
            'valor',
            h.q.valor(x),
            y,
            [[x, 'EIX_CANVIAT'], ...escala(y)],
            `f(${tn(x)}) = ${tn(y)}\\ ${texT(h.uy)}`,
            h.uy
        );
    } else if (tipus === 'maxim-valor') {
        const xm = pts.find(p => p[1] === ymax)[0];
        pas = unaCasella(
            'maxim-valor',
            h.q.maxValor,
            ymax,
            [[xm, 'INSTANT_PER_VALOR'], ...escala(ymax)],
            `${texT('màxim:')}\\ ${tn(ymax)}\\ ${texT(h.uy)}`,
            h.uy
        );
    } else if (tipus === 'maxim-instant') {
        const xm = pts.find(p => p[1] === ymax)[0];
        pas = unaCasella(
            'maxim-instant',
            h.q.maxInstant,
            xm,
            [[ymax, 'VALOR_PER_INSTANT']],
            `x = ${tn(xm)}\\ ${texT(h.ux)}`,
            h.ux
        );
    } else if (tipus === 'aturat') {
        const plans = trams.filter(t => signe(t) === 0);
        const total = plans.reduce((s, t) => s + t.x1 - t.x0, 0);
        const d = [
            [plans[0].x0, 'INSTANT_PER_DURADA'],
            [plans[0].x1, 'INSTANT_PER_DURADA'],
            [plans[0].y0, 'EIX_CANVIAT'],
        ];
        if (plans.length > 1) d.push([plans[0].x1 - plans[0].x0, 'NOMES_UN_TRAM']);
        pas = unaCasella(
            'aturat',
            h.q.aturat,
            total,
            d,
            `${plans.map(t => `(${tn(t.x1)} - ${tn(t.x0)})`).join(' + ')} = ${tn(total)}\\ ${texT(h.ux)}`,
            h.ux
        );
    } else if (tipus === 'creix' || tipus === 'decreix') {
        const { cert, falses } = opcionsTram(h, trams, tipus === 'creix' ? 1 : -1);
        pas = pasTria(tipus, tipus === 'creix' ? h.q.creix : h.q.decreix, cert, falses, n);
    } else if (tipus === 'rapid') {
        const mou = trams.filter(t => signe(t) !== 0);
        const rapid = mou.reduce((m, t) => (Math.abs(pendent(t)) > Math.abs(pendent(m)) ? t : m));
        const llarg = mou.reduce((m, t) => (Math.abs(t.y1 - t.y0) > Math.abs(m.y1 - m.y0) ? t : m));
        const alt = mou.reduce((m, t) => (Math.max(t.y0, t.y1) > Math.max(m.y0, m.y1) ? t : m));
        const falses = trams
            .filter(t => t !== rapid)
            .map(t => ({
                text: h.interval(t.x0, t.x1),
                error:
                    signe(t) === 0
                        ? 'HORITZONTAL'
                        : t === llarg
                          ? 'MES_LLARG_PER_RAPID'
                          : t === alt
                            ? 'MES_ALT_PER_RAPID'
                            : 'MENYS_INCLINAT',
            }));
        pas = pasTria('rapid', h.q.rapid, { text: h.interval(rapid.x0, rapid.x1) }, falses, n);
    } else if (tipus === 'antiimatge') {
        const cands = [...new Set(ys)].filter(y => {
            const a = antiimatges(trams, y);
            return a && a.length >= 1 && a.length <= 2;
        });
        if (!cands.length) return preguntaSegments('valor', n);
        const y = pick(cands);
        const sols = antiimatges(trams, y);
        const inv = valorGrafica(trams, y);
        const d = Number.isFinite(inv) && !sols.includes(inv) ? [[inv, 'EIX_CANVIAT']] : [];
        const camps = sols.map((s, i) => ({ nom: `x${i + 1}`, sol: s, distractors: d }));
        const plantilla =
            sols.length === 2
                ? [
                      { camp: 'x1' },
                      { tex: `\\;${texT(h.ux)}\\quad${texT('i')}\\quad` },
                      { camp: 'x2' },
                      { tex: `\\;${texT(h.ux)}` },
                  ]
                : [{ camp: 'x1' }, { tex: `\\;${texT(h.ux)}` }];
        const enun = h.q.antiimatge(y) + (sols.length === 2 ? ' (hi és dues vegades)' : '');
        pas = pasCaselles(
            'antiimatge',
            enun,
            camps,
            plantilla,
            `x = ${sols.map(tn).join(`\\ ${texT('i')}\\ `)}\\ ${texT(h.ux)}`,
            sols.length === 2 ? { parell: ['x1', 'x2'] } : {}
        );
    } else if (tipus === 'velocitat') {
        const bons = trams.filter(t => signe(t) !== 0 && esEnter(Math.abs(pendent(t))));
        if (!bons.length) return preguntaSegments('rapid', n);
        const t = pick(bons);
        const [dx, dy] = [t.x1 - t.x0, Math.abs(t.y1 - t.y0)];
        const v = dy / dx;
        pas = unaCasella(
            'velocitat',
            h.q.ritme(t.x0, t.x1),
            v,
            [
                [dy, 'NOMES_EL_CANVI'],
                [racional(dx, dy), 'DIVISIO_GIRADA'],
            ],
            `\\dfrac{${tn(dy)}}{${tn(dx)}} = ${tn(v)}\\ ${texT(h.uRitme)}`,
            h.uRitme
        );
    } else if (tipus === 'domini-recorregut') {
        const recorregut = Math.random() < 0.6;
        const [a, b] = recorregut ? [ymin, ymax] : [0, T];
        const [ad, bd] = recorregut ? [0, T] : [ymin, ymax];
        const u = recorregut ? h.uy : h.ux;
        pas = pasCaselles(
            'domini-recorregut',
            recorregut ? h.q.recorregut : h.q.domini,
            [
                {
                    nom: 'a',
                    sol: a,
                    distractors: [[ad, recorregut ? 'DOMINI_PER_RECORREGUT' : 'RECORREGUT_PER_DOMINI']],
                },
                {
                    nom: 'b',
                    sol: b,
                    distractors: [[bd, recorregut ? 'DOMINI_PER_RECORREGUT' : 'RECORREGUT_PER_DOMINI']],
                },
            ],
            [
                { tex: `${texT('de')}\\;` },
                { camp: 'a' },
                { tex: `\\;${texT(u)}\\quad${texT('a')}\\;` },
                { camp: 'b' },
                { tex: `\\;${texT(u)}` },
            ],
            `${texT(recorregut ? 'Recorregut:' : 'Domini:')}\\ [${tn(a)}, ${tn(b)}]`
        );
    } else if (tipus === 'afirmacions') {
        const xv = pick(xsLlegibles(trams, h.unitat).filter(v => v > 0));
        const yv = valorGrafica(trams, xv);
        const puja = pick(trams.filter(t => signe(t) > 0).concat(trams.filter(t => signe(t) < 0)));
        const pla = trams.find(t => signe(t) === 0);
        const xm = pts.find(p => p[1] === ymax)[0];
        const verb = t => (signe(t) > 0 ? h.afirma.creix : h.afirma.decreix);
        const certes = [
            { text: h.afirma.valor(xv, yv), dada: { tipus: 'valor', x: xv, y: yv } },
            {
                text: `${h.interval(puja.x0, puja.x1)} ${verb(puja)}.`,
                dada: { tipus: 'sentit', x0: puja.x0, x1: puja.x1, signe: signe(puja) },
            },
            { text: h.afirma.maxim(ymax), dada: { tipus: 'maxim', y: ymax } },
        ];
        const falses = [];
        if (pla) {
            const s = pick([1, -1]);
            falses.push({
                text: `${h.interval(pla.x0, pla.x1)} ${s > 0 ? h.afirma.creix : h.afirma.decreix}.`,
                error: 'HORITZONTAL',
                dada: { tipus: 'sentit', x0: pla.x0, x1: pla.x1, signe: s },
            });
        }
        if (xm !== ymax)
            falses.push({ text: h.afirma.maxim(xm), error: 'INSTANT_PER_VALOR', dada: { tipus: 'maxim', y: xm } });
        const yInv = valorGrafica(trams, yv);
        if (yv !== xv && yv <= T && Number.isFinite(yInv) && yInv !== xv)
            falses.push({ text: h.afirma.valor(yv, xv), error: 'EIX_CANVIAT', dada: { tipus: 'valor', x: yv, y: xv } });
        const contrari = trams.find(t => signe(t) === -signe(puja));
        if (contrari)
            falses.push({
                text: `${h.interval(contrari.x0, contrari.x1)} ${verb(puja)}.`,
                error: 'CREIX_DECREIX',
                dada: { tipus: 'sentit', x0: contrari.x0, x1: contrari.x1, signe: signe(puja) },
            });
        if (id === 'excursio') {
            const t = pick(trams.filter(u => signe(u) > 0));
            falses.push({
                text: `${h.interval(t.x0, t.x1)} puja una muntanya.`,
                error: 'DIBUIX_DEL_CAMI',
                dada: { tipus: 'fals' },
            });
            const total = trams.reduce((s, u) => s + Math.abs(u.y1 - u.y0), 0);
            certes.push({ text: `En total camina ${tn(total)} km.`, dada: { tipus: 'total', y: total } });
            if (total !== ymax)
                falses.push({
                    text: `En total camina ${tn(ymax)} km.`,
                    error: 'MAXIM_PER_TOTAL',
                    dada: { tipus: 'total', y: ymax },
                });
        }
        pas = pasTria('afirmacions', 'Quina afirmació és certa?', pick(certes), falses, n);
    } else {
        // relat: quina gràfica hi correspon?
        ambGrafica = false;
        h.xMaxTargetes = h.xMax;
        const variants = variantsRelat(h, trams);
        if (variants.length < 2) return preguntaSegments('rapid', n);
        const cert = { svg: dibuixa(h, trams, true), trams };
        const falses = variants.map(([tt, error]) => ({ svg: dibuixa(h, tt, true), error, trams: tt }));
        pas = pasTria('relat', `${h.relat(trams, nom)} Quina gràfica correspon a aquest relat?`, cert, falses, n);
        Object.assign(pas.dades, { historia: id, nom });
    }
    return {
        enunciat: ambGrafica ? enunciat : `${maj(h.titolY.replace(/ \(.*\)$/, ''))} al llarg del temps (${h.ux}).`,
        svg: ambGrafica ? dibuixa(h, trams) : '',
        pas,
        clau: `seg:${id}:${tipus}:${pts.join(';')}`,
        mena: 'segments',
    };
}

/** El relat d'unes trams d'una història (el mateix text que l'enunciat de les preguntes de relat). */
export function relatGX(historia, trams, nom) {
    return HISTORIES[historia].relat(trams, nom);
}

// ── TEMPERATURA D'UN DIA (corba suau) ────────────────────────────────────────
const TEMPERATURA = {
    xMax: 24,
    xMin: 24,
    pasX: 1,
    cadaX: 3,
    yMax: 30,
    pasY: 1,
    cadaY: 5,
    titolX: 'Hora del dia (h)',
    titolY: 'Temperatura (°C)',
    ux: 'h',
    uy: '°C',
    interval: (a, b) => `De ${tn(a)} h a ${tn(b)} h`,
};

export function tramsTemperatura() {
    for (;;) {
        const [h1, h2] = [randInt(5, 7), randInt(14, 16)];
        const m = randInt(4, 12);
        const M = m + randInt(8, 14);
        const a = randInt(m + 2, M - 3);
        const b = randInt(m + 2, M - 2);
        if (M > 28 || a === b) continue;
        return [
            { x0: 0, x1: h1, y0: a, y1: m, forma: 'suau' },
            { x0: h1, x1: h2, y0: m, y1: M, forma: 'suau' },
            { x0: h2, x1: 24, y0: M, y1: b, forma: 'suau' },
        ];
    }
}

function preguntaTemperatura(tipus, n) {
    const h = TEMPERATURA;
    const trams = tramsTemperatura();
    const [[, a], [h1, m], [h2, M], [, b]] = punts(trams);
    let pas;
    if (tipus === 'valor') {
        // A les hores clau, o al mig d'un tram si el valor és enter
        const xs = [0, h1, h2, 24].concat(
            trams.map(t => (t.x0 + t.x1) / 2).filter(x => esEnter(x) && esEnter(valorGrafica(trams, x)))
        );
        const x = pick(xs);
        const y = valorGrafica(trams, x);
        pas = unaCasella(
            'valor',
            `Quina temperatura fa a les ${tn(x)} h?`,
            y,
            [[x, 'EIX_CANVIAT']],
            `T(${tn(x)}) = ${tn(y)}\\ ${texT('°C')}`,
            '°C'
        );
    } else if (tipus === 'maxim-valor')
        pas = unaCasella(
            'maxim-valor',
            'Quina és la temperatura màxima del dia?',
            M,
            [[h2, 'INSTANT_PER_VALOR']],
            `${texT('màxima:')}\\ ${tn(M)}\\ ${texT('°C')}`,
            '°C'
        );
    else if (tipus === 'maxim-instant')
        pas = unaCasella(
            'maxim-instant',
            'A quina hora fa més calor?',
            h2,
            [[M, 'VALOR_PER_INSTANT']],
            `${texT('a les')}\\ ${tn(h2)}\\ ${texT('h')}`,
            'h'
        );
    else if (tipus === 'minim-valor')
        pas = unaCasella(
            'minim-valor',
            'Quina és la temperatura mínima del dia?',
            m,
            [[h1, 'INSTANT_PER_VALOR']],
            `${texT('mínima:')}\\ ${tn(m)}\\ ${texT('°C')}`,
            '°C'
        );
    else if (tipus === 'minim-instant')
        pas = unaCasella(
            'minim-instant',
            'A quina hora fa més fred?',
            h1,
            [[m, 'VALOR_PER_INSTANT']],
            `${texT('a les')}\\ ${tn(h1)}\\ ${texT('h')}`,
            'h'
        );
    else if (tipus === 'creix')
        pas = pasTria(
            'creix',
            "En quin d'aquests trams puja la temperatura?",
            { text: h.interval(h1, h2) },
            [
                { text: h.interval(0, h1), error: 'CREIX_DECREIX' },
                { text: h.interval(h2, 24), error: 'CREIX_DECREIX' },
                { text: h.interval(0, h2), error: 'NOMES_EN_PART' },
                { text: h.interval(h1, 24), error: 'NOMES_EN_PART' },
            ],
            n
        );
    else if (tipus === 'decreix')
        pas = pasTria(
            'decreix',
            "En quin d'aquests trams baixa la temperatura?",
            { text: h.interval(h2, 24) },
            [
                { text: h.interval(h1, h2), error: 'CREIX_DECREIX' },
                { text: h.interval(h1, 24), error: 'NOMES_EN_PART' },
                { text: h.interval(0, h2), error: 'NOMES_EN_PART' },
                { text: h.interval(0, 24), error: 'NOMES_EN_PART' },
            ],
            n
        );
    else {
        pas = pasCaselles(
            'domini-recorregut',
            'Entre quines temperatures es mou al llarg del dia (el recorregut)?',
            [
                {
                    nom: 'a',
                    sol: m,
                    distractors: [
                        [0, 'DOMINI_PER_RECORREGUT'],
                        [a, 'PRIMER_PER_MINIM'],
                    ],
                },
                {
                    nom: 'b',
                    sol: M,
                    distractors: [
                        [24, 'DOMINI_PER_RECORREGUT'],
                        [b, 'PRIMER_PER_MINIM'],
                    ],
                },
            ],
            [
                { tex: `${texT('de')}\\;` },
                { camp: 'a' },
                { tex: `\\;${texT('°C')}\\quad${texT('a')}\\;` },
                { camp: 'b' },
                { tex: `\\;${texT('°C')}` },
            ],
            `${texT('Recorregut:')}\\ [${tn(m)}, ${tn(M)}]`
        );
    }
    return {
        enunciat: "La gràfica diu la temperatura a l'exterior de l'institut al llarg d'un dia de primavera.",
        svg: dibuixa(h, trams),
        pas,
        clau: `temp:${tipus}:${punts(trams).join(';')}`,
        mena: 'temperatura',
    };
}

// ── CORBES QUE ACCELEREN O FRENEN ────────────────────────────────────────────
// Δ = s·D² perquè a cada x enter el valor sigui enter: y0 + s·k² (accelera) o y0 + s·(2Dk − k²) (frena)
const FORMES = {
    planta: {
        forma: 'frena',
        sentit: 1,
        params: () => ({ D: 4, s: pick([1, 2]), y0: pick([0, 2, 4]) }),
        titolX: 'Temps (setmanes)',
        titolY: 'Alçada (cm)',
        ux: 'setmanes',
        uy: 'cm',
        enunciat: "Una planta creix des que neix. La gràfica en mostra l'alçada cada setmana.",
        valor: x => `Quant fa la planta al cap de ${tn(x)} setmanes?`,
        antiimatge: y => `Al cap de quantes setmanes fa ${tn(y)} cm?`,
        increment: k => `Quant creix la planta durant la setmana ${k} (de la ${k - 1} a la ${k})?`,
        pregunta: 'Com creix la planta?',
        relat: "Una planta creix molt de pressa les primeres setmanes, i cada setmana creix menys que l'anterior.",
    },
    cotxe: {
        forma: 'accelera',
        sentit: 1,
        params: () => ({ D: pick([4, 5]), s: pick([2, 3]), y0: 0 }),
        titolX: 'Temps (s)',
        titolY: 'Distància (m)',
        ux: 's',
        uy: 'm',
        enunciat: 'Un cotxe arrenca en un semàfor. La gràfica diu quants metres ha fet a cada segon.',
        valor: x => `Quants metres ha fet al cap de ${tn(x)} s?`,
        antiimatge: y => `Al cap de quants segons ha fet ${tn(y)} m?`,
        increment: k => `Quants metres fa durant el segon ${k} (del ${k - 1} al ${k})?`,
        pregunta: 'Com avança el cotxe?',
        relat: 'Un cotxe arrenca a poc a poc i cada segon va més de pressa: cada segon fa més metres que l’anterior.',
    },
    caiguda: {
        forma: 'accelera',
        sentit: -1,
        params: () => {
            const D = pick([3, 4]);
            return { D, s: 5, y0: 5 * D * D + pick([0, 5, 10]) };
        },
        titolX: 'Temps (s)',
        titolY: 'Alçada (m)',
        ux: 's',
        uy: 'm',
        enunciat: "Una pedra cau des d'un penya-segat. La gràfica diu a quina alçada és a cada segon.",
        valor: x => `A quina alçada és al cap de ${tn(x)} s?`,
        antiimatge: y => `Al cap de quants segons és a ${tn(y)} m d'alçada?`,
        increment: k => `Quants metres baixa durant el segon ${k} (del ${k - 1} al ${k})?`,
        pregunta: 'Com baixa la pedra?',
        relat: 'Una pedra cau: al principi baixa a poc a poc i cada segon baixa més metres que l’anterior.',
    },
    globus: {
        forma: 'frena',
        sentit: -1,
        params: () => {
            const s = pick([1, 2]);
            return { D: 4, s, y0: 16 * s + pick([0, 2, 4]) };
        },
        titolX: 'Temps (min)',
        titolY: 'Aire (l)',
        ux: 'min',
        uy: 'l',
        enunciat: "Un globus es desinfla. La gràfica diu quants litres d'aire li queden a cada minut.",
        valor: x => `Quants litres d'aire li queden al cap de ${tn(x)} min?`,
        antiimatge: y => `Al cap de quants minuts li queden ${tn(y)} litres?`,
        increment: k => `Quants litres perd durant el minut ${k} (del ${k - 1} al ${k})?`,
        pregunta: "Com perd l'aire el globus?",
        relat: 'Un globus es desinfla molt de pressa al principi, i cada minut perd menys aire que l’anterior.',
    },
};
// Com canvia: [sentit, forma] → text; forma 'recta' = sempre igual
const TEXT_FORMA = {
    '1,accelera': 'Augmenta cada vegada més de pressa.',
    '1,frena': 'Augmenta cada vegada més a poc a poc.',
    '1,recta': 'Augmenta sempre igual de pressa.',
    '-1,accelera': 'Disminueix cada vegada més de pressa.',
    '-1,frena': 'Disminueix cada vegada més a poc a poc.',
    '-1,recta': 'Disminueix sempre igual de pressa.',
};

/** El tram d'una forma, amb el sentit i la forma que es diguin. */
function tramForma(f, { D, s, y0 }, sentit = f.sentit, forma = f.forma) {
    const delta = s * D * D;
    const ini = sentit === f.sentit ? y0 : sentit > 0 ? y0 - delta : y0 + delta;
    return [{ x0: 0, x1: D, y0: ini, y1: ini + sentit * delta, forma }];
}

function preguntaForma(tipus, n) {
    const id = pick(Object.keys(FORMES));
    const f = FORMES[id];
    const p = f.params();
    const trams = tramForma(f, p);
    // Els eixos de cada cas: una ratlla per cada s (els valors són múltiples de s) i l'eix fins a
    // un múltiple dels números, amb lloc per a la gràfica girada del relat
    const pasY = p.s;
    const alt = f.sentit > 0 ? p.y0 + p.s * p.D * p.D : p.y0; // el valor més alt (també de la gràfica girada)
    const cadaY = [2, 5, 10].map(k => k * pasY).find(c => Math.ceil(alt / c) <= 8) || 20 * pasY;
    const yMax = Math.ceil(alt / cadaY) * cadaY;
    const h = { ...f, xMax: p.D, xMaxTargetes: p.D, pasX: 1, pasY, cadaY, cadaYmini: cadaY * 2, yMax };
    const vals = Array.from({ length: p.D + 1 }, (_, k) => valorGrafica(trams, k));
    let pas;
    let ambGrafica = true;
    if (tipus === 'valor') {
        const x = randInt(1, p.D);
        const y = vals[x];
        pas = unaCasella(
            'valor',
            f.valor(x),
            y,
            [[x, 'EIX_CANVIAT'], ...(f.pasY > 1 ? [[y / f.pasY, 'SENSE_ESCALA']] : [])],
            `f(${tn(x)}) = ${tn(y)}\\ ${texT(f.uy)}`,
            f.uy
        );
    } else if (tipus === 'antiimatge') {
        const k = randInt(1, p.D);
        const y = vals[k];
        const inv = valorGrafica(trams, y);
        pas = unaCasella(
            'antiimatge',
            f.antiimatge(y),
            k,
            Number.isFinite(inv) && inv !== k ? [[inv, 'EIX_CANVIAT']] : [],
            `x = ${tn(k)}\\ ${texT(f.ux)}`,
            f.ux
        );
    } else if (tipus === 'increment') {
        const k = randInt(2, p.D);
        const inc = Math.abs(vals[k] - vals[k - 1]);
        pas = unaCasella(
            'increment',
            f.increment(k),
            inc,
            [
                [vals[k], 'VALOR_PER_INCREMENT'],
                [Math.abs(vals[k] - vals[0]), 'DES_DEL_PRINCIPI'],
            ],
            `|${tn(vals[k])} - ${tn(vals[k - 1])}| = ${tn(inc)}\\ ${texT(f.uy)}`,
            f.uy
        );
    } else if (tipus === 'forma') {
        const clau = `${f.sentit},${f.forma}`;
        const falses = Object.keys(TEXT_FORMA)
            .filter(k => k !== clau)
            .map(k => {
                const [sg, fo] = k.split(',');
                const error =
                    Number(sg) !== f.sentit ? 'CREIX_DECREIX' : fo === 'recta' ? 'RECTA_PER_CORBA' : 'CONCAVITAT';
                return { text: TEXT_FORMA[k], error, dada: { tipus: 'forma', sentit: Number(sg), forma: fo } };
            });
        pas = pasTria(
            'forma',
            f.pregunta,
            { text: TEXT_FORMA[clau], dada: { tipus: 'forma', sentit: f.sentit, forma: f.forma } },
            falses,
            n
        );
    } else if (tipus === 'relat') {
        ambGrafica = false;
        const cert = { svg: dibuixa(h, trams, true), trams };
        const falses = [
            [tramForma(f, p, f.sentit, f.forma === 'frena' ? 'accelera' : 'frena'), 'CONCAVITAT'],
            [tramForma(f, p, f.sentit, 'recta'), 'RECTA_PER_CORBA'],
            [tramForma(f, p, -f.sentit, f.forma), 'CREIX_DECREIX'],
        ].map(([tt, error]) => ({ svg: dibuixa(h, tt, true), error, trams: tt }));
        pas = pasTria('relat', `${f.relat} Quina gràfica hi correspon?`, cert, falses, n);
    } else {
        const [a, b] = [Math.min(...vals), Math.max(...vals)];
        pas = pasCaselles(
            'domini-recorregut',
            `Entre quins valors (${f.uy}) es mou la gràfica (el recorregut)?`,
            [
                { nom: 'a', sol: a, distractors: [[0, a === 0 ? '' : 'DOMINI_PER_RECORREGUT']].filter(([, e]) => e) },
                { nom: 'b', sol: b, distractors: [[p.D, 'DOMINI_PER_RECORREGUT']] },
            ],
            [
                { tex: `${texT('de')}\\;` },
                { camp: 'a' },
                { tex: `\\;${texT(f.uy)}\\quad${texT('a')}\\;` },
                { camp: 'b' },
                { tex: `\\;${texT(f.uy)}` },
            ],
            `${texT('Recorregut:')}\\ [${tn(a)}, ${tn(b)}]`
        );
    }
    return {
        enunciat: ambGrafica ? f.enunciat : '',
        svg: ambGrafica ? dibuixa(h, trams) : '',
        pas,
        clau: `forma:${id}:${tipus}:${vals.join(',')}`,
        mena: 'forma',
    };
}

// ── PREGUNTA ─────────────────────────────────────────────────────────────────
export function generaPreguntaGX({ grafiques = '', preguntes = '', nivell = 1, index = 0, opcions = 4 } = {}) {
    const mena = menaGX(grafiques, index, preguntes);
    const tipus = tipusGX(mena, nivell, preguntes);
    const n = Math.max(3, Math.min(5, opcions));
    const r =
        mena === 'segments'
            ? preguntaSegments(tipus, n)
            : mena === 'temperatura'
              ? preguntaTemperatura(tipus, n)
              : preguntaForma(tipus, n);
    return {
        text: TEXTOS_GX.menes[r.mena],
        clau: r.clau,
        ...(r.enunciat ? { enunciat: r.enunciat } : {}),
        ...(r.svg ? { svg: r.svg } : {}),
        passos: [r.pas],
    };
}

/** El text de la resposta per a l'historial. */
export function textRespostaGX(pas, valors) {
    if (pas.camps.tria) {
        const o = pas.opcions.find(([v]) => v === valors.tria);
        return o ? o[1] : '';
    }
    return Object.keys(pas.camps)
        .map(k => {
            const v = valors[k];
            const [a, b] = Array.isArray(v) ? v : [v, 1];
            return tn(a / b);
        })
        .join(' i ');
}
