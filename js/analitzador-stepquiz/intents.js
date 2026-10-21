/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/analitzador-stepquiz/intents.js
 * ROL: Lògica pura (sense DOM) de l'analitzador per als alumnes que fan la
 *      mateixa prova més d'un cop i per a les proves de mida diferent:
 *
 *   1. Intents. Dos enviaments són «la mateixa prova» d'un alumne si tenen el
 *      mateix exercici, nivell (D), mode o sessions (S) i nombre de preguntes
 *      (QQ). Se'n numeren per ordre de data i hora del CODI (no de l'enviament
 *      al formulari). Si l'alumne envia dos cops el MATEIX codi, no és un
 *      intent nou: és un enviament repetit.
 *
 *   2. Proves de Competències Bàsiques. Les preguntes del codi només porten la
 *      POSICIÓ (1a, 2a, 3a…), no quina pregunta del banc és. Per no barrejar
 *      la «pregunta 1» d'una prova de 4 preguntes amb la d'una de 8, el resum
 *      CB separa les proves pel nombre de preguntes (a més del curs i el mode).
 *
 *   Codis v3 (des de la nova generació de cb): el codi porta també la convocatòria,
 *   les dificultats, els sentits i una empremta de les preguntes, i tot això compta
 *   per saber si dues proves són la mateixa: 4 preguntes de dificultat 1 i 4 de
 *   dificultat 2 són proves diferents, i també ho són dues proves amb els mateixos
 *   filtres però preguntes diferents (triades a mà o amb un banc que ha canviat).
 *
 *   LIMITACIÓ (només codis v2, anteriors): el codi no diu quina dificultat s'ha triat.
 *   Dues proves amb el mateix nombre de preguntes (p. ex. 4 de dificultat 1 i 4 de
 *   dificultat 2) no es poden distingir i es tracten com a intents de la mateixa prova.
 *
 * Una «fila» és la de processRows() de analitzador-stepquiz.js:
 *   { idx, raw:{rawCode}, parsed, student, dateStr, sendTime, codeTime, … }
 * ============================================================================
 */

import { MASCARA_DIFICULTATS_TOTES, MASCARA_SENTITS_TOTS } from '../codi-verificacio.js';

/** Maneres de triar quins intents compten a les estadístiques. */
export const POLITIQUES = ['ultim', 'primer', 'millor', 'tots'];

const dosXifres = n => String(n).padStart(2, '0');

/**
 * Moment en què es va fer la prova, com a text que s'ordena bé: YYYY-MM-DD HH:MM.
 * Dia, mes, hora i minut són els del codi; l'any (que el codi no porta) és el de
 * l'enviament, restant-ne un si el mes del codi és molt posterior (desembre → gener).
 */
export function momentCodi(row) {
    const p = row.parsed;
    if (!p || p.day == null || p.hour == null) return `${row.dateStr || '0000-00-00'} ${row.sendTime || '00:00'}`;
    let any = row.dateStr ? +row.dateStr.slice(0, 4) : 0;
    const mesEnviament = row.dateStr ? +row.dateStr.slice(5, 7) : p.month;
    if (any && p.month > mesEnviament + 6) any -= 1;
    return `${String(any).padStart(4, '0')}-${dosXifres(p.month)}-${dosXifres(p.day)} ${dosXifres(p.hour)}:${dosXifres(p.minute)}`;
}

function perMoment(a, b) {
    return momentCodi(a).localeCompare(momentCodi(b)) || a.idx - b.idx;
}

const alumneReal = row => !!row.student && row.student !== '—';

/**
 * Clau d'un alumne. Sense correu, cada fila és algú diferent (no es poden ajuntar).
 * Un codi invàlid tampoc s'ajunta amb els altres: així, p. ex., un codi mal copiat
 * enviat després no pot passar per «l'últim intent» i desplaçar el vàlid.
 */
export function clauAlumne(row) {
    return alumneReal(row) && row.parsed.valid ? row.student : `#${row.idx}`;
}

const esV2o3 = p => p.format === 'v2' || p.format === 'v3';

/** Camps del v3 que fan que dues proves siguin diferents: què s'ha triat i quines preguntes són. Al v2, cap. */
const clauFiltres = p => (p.format === 'v3' ? [p.cbConvocatoria || '', p.cbDifMask, p.cbSentMask, p.empremta] : []);

/** Clau de «la mateixa prova» d'un alumne, o null si no es pot saber (codi invàlid, sense correu…). */
export function clauProva(row) {
    const p = row.parsed;
    if (!p || !p.valid || !esV2o3(p) || !alumneReal(row)) return null;
    return [row.student, p.exerciseCode, p.difficulty, p.sessions, p.questions, ...clauFiltres(p)].join('|');
}

/**
 * Posa a cada fila (modifica les files):
 *   intent       número d'intent dins de la seva prova (1, 2, 3…), o null
 *   intents      quants intents té l'alumne d'aquesta prova, o null
 *   duplicatDe   la fila del primer enviament d'aquest mateix codi, o null
 *   notaAnterior nota de l'intent anterior, o null si és el primer
 * Es calcula amb TOTES les files (no només les filtrades): així «2n intent» vol
 * dir el mateix amb qualsevol filtre.
 */
export function marcaIntents(rows) {
    const grups = new Map();
    for (const r of rows) {
        r.intent = null;
        r.intents = null;
        r.duplicatDe = null;
        r.notaAnterior = null;
        const clau = clauProva(r);
        if (!clau) continue;
        if (!grups.has(clau)) grups.set(clau, []);
        grups.get(clau).push(r);
    }
    for (const grup of grups.values()) {
        grup.sort(perMoment);
        const primerAmbCodi = new Map();
        const distints = [];
        for (const r of grup) {
            const codi = String(r.raw.rawCode || '').trim();
            if (primerAmbCodi.has(codi)) {
                r.duplicatDe = primerAmbCodi.get(codi);
                continue;
            }
            primerAmbCodi.set(codi, r);
            distints.push(r);
            r.intent = distints.length;
            if (distints.length > 1) r.notaAnterior = distints[distints.length - 2].parsed.note;
        }
        for (const r of grup) {
            r.intents = distints.length;
            if (r.duplicatDe) {
                r.intent = r.duplicatDe.intent;
                r.notaAnterior = r.duplicatDe.notaAnterior;
            }
        }
    }
}

/**
 * Dels enviaments d'UN alumne d'UNA prova, els que compten a les estadístiques.
 * politica: 'ultim' (l'últim), 'primer', 'millor' (la nota més alta; si empaten, l'últim) o 'tots'.
 */
export function triaIntents(files, politica) {
    if (politica === 'tots' || files.length <= 1) return files.slice();
    const ordenades = [...files].sort(perMoment);
    if (politica === 'primer') return [ordenades[0]];
    if (politica === 'millor') {
        const nota = r => (r.parsed.note == null ? -1 : r.parsed.note);
        return [ordenades.reduce((millor, r) => (nota(r) >= nota(millor) ? r : millor))];
    }
    return [ordenades[ordenades.length - 1]];
}

/** Nombre de preguntes d'un codi: el del camp QQ (màxim maxRes) o, si no en porta, les que tenen resultat. */
export function nombrePreguntes(row, maxRes) {
    if (row.parsed.questions) return Math.min(row.parsed.questions, maxRes);
    const a = row.parsed.resultsArray;
    let n = a.length;
    while (n > 0 && !a[n - 1]) n--;
    return n;
}

/**
 * Separa els enviaments de CB en proves (mateix curs, nivell, mode i nombre de
 * preguntes) i, dins de cada una, tria els intents que compten.
 *
 * Retorna { grups, ignorats }:
 *   ignorats  enviaments descartats perquè repeteixen el codi d'un altre que també és a la llista
 *   grups     [{ nivell, mode, nq, meta, etiqueta, files, comptades, alumnes, repetidors }] ordenats per curs, mode i mida
 *     meta        què diu el codi v3 (convocatoria, difMask, sentMask, empremta, dificultats, sentits), o null si és v2
 *     etiqueta    el títol de la prova: «Prova de 4 preguntes · 4t ESO · Pràctica · Dificultat 1»
 *     files       tots els enviaments de la prova (sense els ignorats)
 *     comptades   Set de les files que compten a les estadístiques
 *     alumnes     nombre d'alumnes que hi compten
 *     repetidors  [{ student, intents }] alumnes amb més d'un enviament a la prova
 */
export function agrupaProves(files, politica, maxRes) {
    const presents = new Set(files);
    const unics = files.filter(r => !(r.duplicatDe && presents.has(r.duplicatDe)));
    const perClau = new Map();
    for (const r of unics) {
        const p = r.parsed;
        const nq = nombrePreguntes(r, maxRes);
        const clau = [p.cbNivell || '', p.cbMode || '', nq, ...clauFiltres(p)].join('|');
        if (!perClau.has(clau)) {
            const meta =
                p.format === 'v3'
                    ? {
                          convocatoria: p.cbConvocatoria || null,
                          difMask: p.cbDifMask,
                          sentMask: p.cbSentMask,
                          empremta: p.empremta,
                          dificultats: p.cbDificultats,
                          sentits: p.cbSentits,
                      }
                    : null;
            perClau.set(clau, { nivell: p.cbNivell || '', mode: p.cbMode || '', nq, meta, files: [] });
        }
        perClau.get(clau).files.push(r);
    }
    const grups = [...perClau.values()].map(g => {
        const perAlumne = new Map();
        for (const r of g.files) {
            const k = clauAlumne(r);
            if (!perAlumne.has(k)) perAlumne.set(k, []);
            perAlumne.get(k).push(r);
        }
        g.comptades = new Set();
        g.repetidors = [];
        for (const llista of perAlumne.values()) {
            triaIntents(llista, politica).forEach(r => g.comptades.add(r));
            if (llista.length > 1) g.repetidors.push({ student: llista[0].student, intents: llista.length });
        }
        g.alumnes = new Set([...g.comptades].map(clauAlumne)).size;
        return g;
    });
    grups.sort(
        (a, b) =>
            a.nivell.localeCompare(b.nivell) ||
            a.mode.localeCompare(b.mode) ||
            a.nq - b.nq ||
            (a.meta ? a.meta.empremta : '').localeCompare(b.meta ? b.meta.empremta : '')
    );
    posaEtiquetes(grups);
    return { grups, ignorats: files.length - unics.length };
}

/**
 * Les parts del títol que diuen què s'havia triat (només codis v3), sense dir res del que és «tot»:
 * ['Convocatòria 2025', 'Dificultats 1, 2', 'Sentit Numèric'].
 */
export function descripcioFiltres(meta) {
    if (!meta) return [];
    const parts = [];
    if (meta.convocatoria) parts.push(`Convocatòria ${meta.convocatoria}`);
    if (meta.difMask !== MASCARA_DIFICULTATS_TOTES) {
        parts.push(
            `${meta.dificultats.length > 1 ? 'Dificultats' : 'Dificultat'} ${meta.dificultats.map(d => d.valor).join(', ')}`
        );
    }
    if (meta.sentMask !== MASCARA_SENTITS_TOTS) {
        parts.push(`${meta.sentits.length > 1 ? 'Sentits' : 'Sentit'} ${meta.sentits.map(d => d.nom).join(', ')}`);
    }
    return parts;
}

/** El títol d'una prova: «Prova de 4 preguntes · 4t ESO · Pràctica · Convocatòria 2025 · Dificultat 1». */
export function etiquetaProva(g) {
    return [`Prova de ${g.nq} preguntes`, g.nivell, g.mode, ...descripcioFiltres(g.meta)].filter(Boolean).join(' · ');
}

/**
 * Posa `etiqueta` a cada prova. Si dues tindrien el mateix títol (mateixos filtres però preguntes
 * diferents, o una prova v3 amb tot a «tots» igual que una de v2), s'hi afegeix el que les distingeix:
 * l'empremta de les preguntes (v3) o «codis antics» (v2).
 */
export function posaEtiquetes(grups) {
    const base = grups.map(etiquetaProva);
    grups.forEach((g, i) => {
        const repetida = base.filter(b => b === base[i]).length > 1;
        g.etiqueta = repetida ? `${base[i]} · ${g.meta ? 'preguntes ' + g.meta.empremta : 'codis antics'}` : base[i];
    });
}

/**
 * Estadístiques de cada posició 0..nq-1 sobre les files donades: null si ningú
 * hi té resultat; si no, { med, counts, pcts, total } (counts[1..4] i pcts[0..3] de 1 a 4).
 */
export function estadistiquesPreguntes(files, nq) {
    return Array.from({ length: nq }, (_, q) => {
        const vals = files.map(r => r.parsed.resultsArray[q] || 0).filter(v => v > 0);
        if (!vals.length) return null;
        const counts = [0, 0, 0, 0, 0];
        vals.forEach(v => counts[v]++);
        const sorted = [...vals].sort((a, b) => a - b);
        const med = sorted[Math.floor(sorted.length / 2)];
        const pcts = [1, 2, 3, 4].map(v => Math.round((counts[v] / vals.length) * 100));
        return { med, counts, pcts, total: vals.length };
    });
}
