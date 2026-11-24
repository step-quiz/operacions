/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/mode.js
 * ROL: «Resolució pas a pas»: quines activitats la tenen.
 * ARQUITECTURA:
 * - Dos escenaris independents (el David, 15/11/2026): A, l'alumne fa l'exercici
 *   (l'activitat de sempre, sense pissarra); B, l'alumne mira com es resol un
 *   exercici, pas a pas, a la pissarra (resolucio.html?activitat=…).
 * - SUPORTA_PISSARRA: les activitats que tenen l'escenari B (nom del fitxer HTML
 *   sense «.html»): les claus de js/resolucio/activitats.js. index.html hi ha de
 *   coincidir: cada una porta «pissarra: true» a la seva línia, i el botó
 *   «Activar la resolució pas a pas» mostra només aquestes activitats, amb
 *   l'enllaç a resolucio.html (tests/check-repo.js ho comprova).
 * - Les activitats no en fan servir res: un enllaç antic amb ?pissarra=1 obre
 *   l'activitat de sempre.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

/** Activitats amb resolució pas a pas (nom del fitxer HTML sense «.html»). */
export const SUPORTA_PISSARRA = ['equacions', 'fraccions', 'prioritat', 'formules-steam', 'inequacions', 'cilindres'];
