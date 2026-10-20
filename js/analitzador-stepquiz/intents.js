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
 *   LIMITACIÓ: el codi no diu quina dificultat s'ha triat. Dues proves amb el
 *   mateix nombre de preguntes (p. ex. 4 de dificultat 1 i 4 de dificultat 2)
 *   no es poden distingir i es tracten com a intents de la mateixa prova.
 *
 * Una «fila» és la de processRows() de analitzador-stepquiz.js:
 *   { idx, raw:{rawCode}, parsed, student, dateStr, sendTime, codeTime, … }
 * ============================================================================
 */

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

/** Clau d'un alumne. Sense correu, cada fila és algú diferent (no es poden ajuntar). */
export function clauAlumne(row) {
    return alumneReal(row) ? row.student : `#${row.idx}`;
}

/** Clau de «la mateixa prova» d'un alumne, o null si no es pot saber (codi invàlid, sense correu…). */
export function clauProva(row) {
    const p = row.parsed;
    if (!p || !p.valid || p.format !== 'v2' || !alumneReal(row)) return null;
    return [row.student, p.exerciseCode, p.difficulty, p.sessions, p.questions].join('|');
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
 *   grups     [{ nivell, mode, nq, files, comptades, alumnes, repetidors }] ordenats per curs, mode i mida
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
        const clau = [p.cbNivell || '', p.difficulty, p.cbMode || '', nq].join('|');
        if (!perClau.has(clau)) perClau.set(clau, { nivell: p.cbNivell || '', mode: p.cbMode || '', nq, files: [] });
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
    grups.sort((a, b) => a.nivell.localeCompare(b.nivell) || a.mode.localeCompare(b.mode) || a.nq - b.nq || 0);
    return { grups, ignorats: files.length - unics.length };
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
