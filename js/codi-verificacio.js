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
 *
 * ── FORMAT v3 (Competències Bàsiques) ──────────────────────────────────────
 *   Lsss-DDMM-HHMM-CB-D-S-QQ-AA-F-SS-EEEE-NNN-RRR…   (13 segments; el v2 en té 9)
 *   Als camps del v2 hi afegeix què s'ha triat a l'enllaç de la prova:
 *     AA    convocatòria triada: els dos últims dígits de l'any, o 00 = tots els anys
 *     F     dificultats triades, com a suma: 1 = baixa, 2 = mitjana, 4 = alta (7 = totes)
 *     SS    sentits triats, com a suma de dues xifres: 1 numèric, 2 algebraic, 4 de mesura,
 *           8 espacial, 16 estocàstic (31 = tots)
 *     EEEE  empremta de la llista d'ids de les preguntes de la prova, en ordre: 4 lletres
 *           de la A a la W. Dues proves amb la mateixa empremta tenen exactament les
 *           mateixes preguntes; si el professor ha triat preguntes una a una (paràmetre q)
 *           o el banc ha canviat, l'empremta ho delata encara que els filtres coincideixin.
 *   La lletra de control cobreix també aquests camps. Als codis v3 només s'accepta la
 *   lletra nova: no hi ha codis v3 d'abans del 18/10/2026 que justifiquin l'antiga.
 *   Les lletres de l'empremta són 23 de seguides (ASCII 65-87) perquè canviar-ne una
 *   sola no pugui deixar la suma igual: la diferència màxima és 22 i 23 és primer.
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

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT v3 (CB)
// ─────────────────────────────────────────────────────────────────────────────

/** Lletres de l'empremta: 23 de seguides, perquè un canvi d'una sola lletra mai quedi amagat per la lletra de control. */
export const ALFABET_EMPREMTA = 'ABCDEFGHIJKLMNOPQRSTUVW';

/** Dificultats de CB, amb el bit que les representa al camp F (1, 2, 4). */
export const DIFICULTATS_CB = [
    { bit: 1, valor: '1', nom: 'Baixa' },
    { bit: 2, valor: '2', nom: 'Mitjana' },
    { bit: 4, valor: '3', nom: 'Alta' },
];

/** Sentits de CB, amb el bit que els representa al camp SS (1, 2, 4, 8, 16). */
export const SENTITS_CB = [
    { bit: 1, valor: 'numeric', nom: 'Numèric' },
    { bit: 2, valor: 'algebraic', nom: 'Algebraic' },
    { bit: 4, valor: 'mesura', nom: 'De mesura' },
    { bit: 8, valor: 'espacial', nom: 'Espacial' },
    { bit: 16, valor: 'estocastic', nom: 'Estocàstic' },
];

export const MASCARA_DIFICULTATS_TOTES = 7;
export const MASCARA_SENTITS_TOTS = 31;

/** Les entrades de la taula que té un bit de la màscara: llistaDeMascara(5, DIFICULTATS_CB) → baixa i alta. */
export function llistaDeMascara(mascara, taula) {
    return taula.filter(e => (mascara & e.bit) !== 0);
}

/** El cos del codi v3: el del v2 més la convocatòria, les dificultats, els sentits i l'empremta (tot com a text del codi). */
export function cosDelCodiV3(exCode, dif, sessions, questions, any, difMask, sentMask, empremta, results) {
    return `${exCode}${dif}${sessions}${questions}${any}${difMask}${sentMask}${empremta}${results}`;
}

const RE_V3 = {
    cap: /^[A-Z][a-z][a-z0-9]{2}$/,
    dataHora: /^\d{4}$/,
    exercici: /^[A-Z0-9]{2}$/,
    curs: /^[0-3]$/,
    mode: /^[1-5]$/,
    preguntes: /^\d{2}$/,
    any: /^\d{2}$/,
    dificultats: /^[1-7]$/,
    sentits: /^(0[1-9]|[12]\d|3[01])$/,
    empremta: new RegExp(`^[${ALFABET_EMPREMTA}]{4}$`),
    nota: /^\d{3}$/,
    resultats: /^[01234]{30,50}$/,
};

/**
 * Llegeix un codi v3. Retorna null si no té la forma d'un codi v3 (cal que tingui 13
 * segments i que cada un tingui el seu format); si en té, un objecte amb tots els
 * camps i `valid`: la lletra de control quadra amb la fórmula nova.
 */
export function llegeixCodiV3(raw) {
    const p = String(raw ?? '')
        .trim()
        .split('-');
    if (p.length !== 13) return null;
    const [cap, dataStr, horaStr, ex, d, s, qq, any, dif, sent, emp, nnn, res] = p;
    const bo =
        RE_V3.cap.test(cap) &&
        RE_V3.dataHora.test(dataStr) &&
        RE_V3.dataHora.test(horaStr) &&
        RE_V3.exercici.test(ex) &&
        RE_V3.curs.test(d) &&
        RE_V3.mode.test(s) &&
        RE_V3.preguntes.test(qq) &&
        RE_V3.any.test(any) &&
        RE_V3.dificultats.test(dif) &&
        RE_V3.sentits.test(sent) &&
        RE_V3.empremta.test(emp) &&
        RE_V3.nota.test(nnn) &&
        RE_V3.resultats.test(res);
    if (!bo) return null;
    const salt = cap.slice(1);
    const dd = +dataStr.slice(0, 2),
        mm = +dataStr.slice(2, 4),
        hh = +horaStr.slice(0, 2),
        mn = +horaStr.slice(2, 4);
    const cos = cosDelCodiV3(ex, d, s, qq, any, dif, sent, emp, res);
    return {
        lletra: cap[0],
        salt,
        dd,
        mm,
        hh,
        mn,
        exCode: ex,
        curs: +d,
        mode: +s,
        questions: +qq,
        any,
        difMask: +dif,
        sentMask: +sent,
        empremta: emp,
        notaInt: +nnn,
        results: res,
        valid: lletraNova(+nnn, dd, mm, hh, mn, salt, cos) === cap[0],
    };
}
