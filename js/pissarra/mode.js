/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/mode.js
 * ROL: Mode «Resolució pas a pas» (?pissarra=1): quines activitats l'admeten i
 *      si és actiu a la pàgina que s'està fent servir.
 * ARQUITECTURA:
 * - SUPORTA_PISSARRA: les pàgines que tenen resolució pas a pas animada (nom del
 *   fitxer HTML sense «.html»). index.html hi ha de coincidir: cada una porta
 *   «pissarra: true» a la seva línia, i el botó «Activar la resolució pas a
 *   pas» mostra només aquestes activitats (tests/check-repo.js ho comprova).
 * - pissarraActiva(search, pagina): funció PURA; cert si la URL porta
 *   ?pissarra=1 i la pàgina l'admet.
 * - PISSARRA_ACTIVA: el mateix per a la pàgina actual. Si és fals, l'activitat
 *   funciona exactament com sempre (no carrega KaTeX ni cap pissarra).
 * - El mode només hi afegeix animacions: no canvia les preguntes, ni la nota,
 *   ni el codi de verificació. No fa servir Math.random (les sessions fixes no
 *   canvien).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

/** Pàgines que admeten ?pissarra=1 (nom del fitxer HTML sense «.html»). */
export const SUPORTA_PISSARRA = ['prioritat', 'equacions', 'fraccions'];

/**
 * Cert si la URL (search, p. ex. '?pissarra=1') activa el mode a la pàgina «pagina»
 * (nom del fitxer sense «.html»). «suporta»: la llista de pàgines que l'admeten.
 */
export function pissarraActiva(search, pagina, suporta = SUPORTA_PISSARRA) {
    let params;
    try {
        params = new URLSearchParams(search || '');
    } catch (e) {
        return false;
    }
    return params.get('pissarra') === '1' && suporta.includes(pagina);
}

const paginaActual = (window.location.pathname.split('/').pop() || '').replace(/\.html$/, '');

/** El mode a la pàgina actual. */
export const PISSARRA_ACTIVA = pissarraActiva(window.location.search, paginaActual);
