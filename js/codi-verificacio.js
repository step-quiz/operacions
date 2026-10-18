/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/codi-verificacio.js
 * ROL: La lletra de control dels codis de verificació (format v2):
 *      Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRR…
 *
 *   La fan servir els generadors (game-core.js, vocabulari/vocabulari.js) i
 *   l'analitzador (analitzador-stepquiz/analitzador-stepquiz.js). El projecte
 *   cb (Competències Bàsiques, core.js) en té una còpia idèntica: si es toca
 *   aquí, cal tocar-la allà també (tests/codi-verificacio.test.js té els
 *   vectors de prova que totes dues han de complir).
 *
 * ── DUES FÓRMULES ──────────────────────────────────────────────────────────
 *   Lletra antiga (codis generats fins al 18/10/2026):
 *     suma = NNN + DD + MM + HH + mm + ASCII(salt[0])
 *     Només protegeix la nota, la data i l'hora. Els resultats de cada
 *     pregunta (i l'exercici, la dificultat, les sessions i les preguntes)
 *     es podien canviar sense que la lletra ho detectés.
 *
 *   Lletra nova (des del 18/10/2026):
 *     suma = (la mateixa d'abans) + Σ pes(i) · ASCII(cos[i])
 *     on cos = EE + D + S + QQ + RRR… (els camps del codi enganxats, sense
 *     guions) i pes(i) = (i mod 22) + 1. Com que els pesos van de 1 a 22 i
 *     23 és primer, canviar una sola xifra dels resultats canvia SEMPRE la
 *     lletra.
 *
 *   El format del codi no canvia gens (mateixa llargada i mateixos caràcters):
 *   el formulari i l'analitzador antic no se n'adonen. L'analitzador nou
 *   accepta totes dues lletres i diu quina quadra:
 *     'nova'   → codi vàlid i resultats verificats;
 *     'antiga' → codi vàlid amb el format d'abans: nota i data verificades,
 *                resultats no (o és d'abans del 18/10/2026, o se n'han
 *                canviat els resultats);
 *     null     → codi invàlid.
 *
 *   Tot és al navegador i el codi és públic: qui el llegeixi pot fabricar un
 *   codi. La lletra és dissuasiva, com la del DNI, no criptogràfica.
 * ============================================================================
 */

export const LLETRES_CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';

/** Suma de la fórmula antiga. Tots els números són enters (DD, MM, HH, mm, NNN). */
function sumaBase(notaInt, dd, mm, hh, mn, salt) {
    return notaInt + dd + mm + hh + mn + salt.charCodeAt(0);
}

/** Suma ponderada del cos del codi (EE + D + S + QQ + resultats). */
export function sumaCos(cos) {
    let s = 0;
    for (let i = 0; i < cos.length; i++) s += ((i % 22) + 1) * cos.charCodeAt(i);
    return s;
}

/** El cos del codi: els camps que la fórmula antiga no protegia, enganxats. */
export function cosDelCodi(exCode, dif, sessions, questions, results) {
    return `${exCode}${dif}${sessions}${questions}${results}`;
}

/** Lletra de la fórmula antiga (només per verificar codis d'abans). */
export function lletraAntiga(notaInt, dd, mm, hh, mn, salt) {
    return LLETRES_CONTROL.charAt(sumaBase(notaInt, dd, mm, hh, mn, salt) % 23);
}

/** Lletra de la fórmula nova: la que han de posar els generadors. */
export function lletraNova(notaInt, dd, mm, hh, mn, salt, cos) {
    return LLETRES_CONTROL.charAt((sumaBase(notaInt, dd, mm, hh, mn, salt) + sumaCos(cos)) % 23);
}

/**
 * Quina fórmula quadra amb la lletra d'un codi: 'nova', 'antiga' o null.
 * Es prova primer la nova: un codi nou que per atzar també quadri amb
 * l'antiga (1 de cada 23) es dona per verificat, que és el que és.
 */
export function versioLletra(lletra, notaInt, dd, mm, hh, mn, salt, cos) {
    if (lletraNova(notaInt, dd, mm, hh, mn, salt, cos) === lletra) return 'nova';
    if (lletraAntiga(notaInt, dd, mm, hh, mn, salt) === lletra) return 'antiga';
    return null;
}
