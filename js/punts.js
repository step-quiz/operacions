/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/punts.js
 * ROL: La regla única dels punts de cada pregunta.
 * ARQUITECTURA:
 * - Cada pregunta val com a màxim PUNTS_MAX (10) punts i cada error en treu 2,
 *   fins a 0: puntsAmbErrors(errors). La nota sobre 10 de game-core.js compta
 *   amb aquest màxim.
 * - Una activitat només se'n pot apartar si ho declara explícitament, passant
 *   un altre valor a `perError` (p. ex. les d'estadística, que compten cada
 *   casella errònia i no cada intent).
 * - Una pregunta amb una part opcional (Fórmules STEAM: els passos amb lletres, decisió del
 *   David del 17/11/2026) en declara el repartiment: puntsAmbPartOpcional(errorsAbans,
 *   errorsDespres, { maxAbans, despres }) — la part obligatòria val maxAbans menys 2 per error
 *   (fins a 0) i la part opcional, despres[errors] (0 si en té més, o si no s'ha fet).
 * - validaPunts(p) és la porta d'entrada dels punts a la sessió: rebutja els
 *   valors que no són un enter de 0 a 10 (els porta dins del marge i avisa).
 * - Mòdul pur: sense DOM, es prova amb tests/punts.test.js.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

/** Punts màxims d'una pregunta. */
export const PUNTS_MAX = 10;

/** Punts que treu cada error, si l'activitat no en declara uns altres. */
export const PUNTS_PER_ERROR = 2;

/**
 * Punts d'una pregunta acabada amb `errors` errors: 10, 8, 6… fins a 0.
 * @param {number} errors     errors (intents fallats) abans d'acabar
 * @param {number} perError   punts que treu cada error (2 si no es diu res)
 */
export function puntsAmbErrors(errors, perError = PUNTS_PER_ERROR) {
    const e = Math.max(0, Math.floor(Number(errors) || 0));
    return Math.max(0, PUNTS_MAX - e * perError);
}

/**
 * Punts d'una pregunta amb una part opcional: la part obligatòria val maxAbans − 2 per error (fins a 0)
 * i l'opcional, despres[errors] (0 amb més errors). errorsDespres null: no s'ha fet la part opcional.
 * P. ex. { maxAbans: 8, despres: [2, 1] }: 8 + 2 sense cap error; qui salta l'opcional, com a molt 8.
 */
export function puntsAmbPartOpcional(errorsAbans, errorsDespres, { maxAbans = 8, despres = [2, 1] } = {}) {
    const a = Math.max(0, Math.floor(Number(errorsAbans) || 0));
    const abans = Math.max(0, maxAbans - a * PUNTS_PER_ERROR);
    if (errorsDespres === null || errorsDespres === undefined) return Math.min(PUNTS_MAX, abans);
    const d = Math.max(0, Math.floor(Number(errorsDespres) || 0));
    return Math.min(PUNTS_MAX, abans + (despres[d] || 0));
}

/**
 * Comprova que `p` són uns punts vàlids per a una pregunta (enter de 0 a 10).
 * @returns {{ punts: number, ok: boolean }} `punts` sempre és vàlid (arrodonit i
 *          portat dins del marge); `ok` és fals si el valor rebut no ho era.
 */
export function validaPunts(p) {
    const n = Number(p);
    if (!Number.isFinite(n)) return { punts: 0, ok: false };
    const punts = Math.min(PUNTS_MAX, Math.max(0, Math.round(n)));
    return { punts, ok: punts === n };
}
