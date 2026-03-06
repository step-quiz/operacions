// ============================================================
// js/utils.js — Funcions utilitàries compartides per tots els jocs
// NOTA: Aquest fitxer s'ha de carregar PRIMER, abans de config.js
// ============================================================

/**
 * Llegeix un paràmetre enter de la URL i el valida.
 * Si és absent, invàlid o fora de rang, retorna el valor per defecte.
 */
function getIntParam(params, key, fallback, min, max) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const n = Number(raw);
    if (!Number.isInteger(n)) return fallback;
    if (n < min || n > max) return fallback;
    return n;
}

/**
 * Retorna un enter aleatori entre min i max (tots dos inclosos).
 * Equivalent a la funció "rand" o "randInt" que apareix en cada joc.
 */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Retorna un enter aleatori entre min i max que no sigui zero.
 */
function randIntNonZero(min, max) {
    let n = 0;
    while (n === 0) n = randInt(min, max);
    return n;
}

/**
 * Retorna un element aleatori d'un array.
 */
function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
}

/**
 * Parseja un string com a enter estricte (només dígits, opcionalment amb signe negatiu).
 * Rebutja notació científica (1e2), hexadecimal (0x10), decimals (1.5) i text barrejat (12abc).
 * Retorna NaN si l'entrada no és un enter vàlid.
 */
function parseStrictInt(str) {
    str = String(str).trim();
    if (!/^-?\d+$/.test(str)) return NaN;
    return parseInt(str, 10);
}

