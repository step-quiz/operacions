/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/esvaiment.js
 * ROL: Mode «Esvaïment» (exemples resolts que es van esvaint, ?esvaiment=1).
 *      Primer l'alumne veu un exercici resolt sencer; després, el mateix tipus
 *      d'exercici amb l'últim pas per fer; després, amb els dos últims… fins que
 *      ho fa tot sol. Si s'equivoca en un pas, se li mostra el pas correcte
 *      (aprenentatge sense error) i el pròxim exercici torna un nivell enrere.
 * ARQUITECTURA:
 * - Esvaiment: funcions PURES (sense DOM ni window), les que proven els tests.
 *     estat = { k, encertsSeguits }
 *     k: quants passos (comptant des del final) fa l'alumne. Si k ≥ el nombre de
 *     passos de l'exercici, el fa tot ell (és l'exercici normal).
 *     Regla (aprovada el 18/10/2026): 2 exercicis seguits sense cap error → k+1;
 *     qualsevol error → k−1 (mai per sota de 0). Abans de pujar o baixar, k es
 *     retalla al nombre de passos de l'exercici que s'acaba de fer: així un k
 *     molt alt no «amaga» les baixades.
 * - ESVAIMENT: la sessió de la pàgina (null si la URL no porta ?esvaiment=1 o
 *   si la pàgina no admet el mode). La fan servir game-core.js (pantalla final,
 *   sense codi de verificació) i el controlador de cada exercici.
 * - SUPORTA_ESVAIMENT: les pàgines que admeten el mode (nom del fitxer HTML
 *   sense «.html»). index.html hi ha de coincidir (tests/check-repo.js).
 * - En aquest mode NO es genera mai el codi de verificació (com a les sessions
 *   fixes): l'alumne no ha fet sol tots els passos.
 * - No fa servir Math.random: no canvia les preguntes de les sessions fixes.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

/** Pàgines que admeten ?esvaiment=1 (nom del fitxer HTML sense «.html»). */
export const SUPORTA_ESVAIMENT = ['prioritat'];

export const Esvaiment = (() => {
    const ENCERTS_PER_PUJAR = 2;
    const INICI_MAX = 9; // ?inici= de 0 a 9

    /**
     * Llegeix els paràmetres de la URL.
     * @param {string} search  window.location.search (p. ex. '?esvaiment=1&inici=2')
     * @param {string} pagina  nom del fitxer sense «.html» (p. ex. 'prioritat')
     * @returns {{ actiu: boolean, inici: number }}
     */
    function llegeixParametres(search, pagina) {
        let params;
        try {
            params = new URLSearchParams(search || '');
        } catch (e) {
            return { actiu: false, inici: 0 };
        }
        const actiu = params.get('esvaiment') === '1' && SUPORTA_ESVAIMENT.includes(pagina);
        const raw = params.get('inici');
        const n = raw === null ? 0 : Number(raw);
        const inici = Number.isInteger(n) && n >= 0 && n <= INICI_MAX ? n : 0;
        return { actiu, inici };
    }

    /** L'estat inicial: l'alumne fa els k0 últims passos del primer exercici. */
    function inicial(k0 = 0) {
        const k = Number.isInteger(k0) && k0 > 0 ? Math.min(k0, INICI_MAX) : 0;
        return { k, encertsSeguits: 0 };
    }

    /** Quants passos (els últims) fa l'alumne en un exercici de nPassos passos. */
    function passosAlumne(estat, nPassos) {
        return Math.max(0, Math.min(estat.k, nPassos));
    }

    /**
     * L'estat per a l'exercici següent.
     * @param {object} estat  { k, encertsSeguits }
     * @param {object} o      { senseErrors: bool, nPassos: passos de l'exercici que s'acaba de fer }
     * @returns {object} estat nou (l'antic no es modifica)
     */
    function despresItem(estat, { senseErrors, nPassos }) {
        const base = Number.isInteger(nPassos) && nPassos >= 0 ? Math.min(estat.k, nPassos) : estat.k;
        if (!senseErrors) return { k: Math.max(base - 1, 0), encertsSeguits: 0 };
        const seguits = estat.encertsSeguits + 1;
        if (seguits >= ENCERTS_PER_PUJAR) return { k: base + 1, encertsSeguits: 0 };
        return { k: base, encertsSeguits: seguits };
    }

    /**
     * Una sessió d'esvaïment: guarda l'estat i el registre de cada exercici.
     * registre: [{ senseErrors, nAlumne, nPassos }] (per a la pantalla final)
     */
    function creaSessio(k0 = 0) {
        let estat = inicial(k0);
        const registre = [];
        return {
            get k() {
                return estat.k;
            },
            registre,
            passosAlumne(nPassos) {
                return passosAlumne(estat, nPassos);
            },
            /** Tanca un exercici. Retorna { pujat, baixat, totSol } per al missatge. */
            acabaItem({ senseErrors, nPassos }) {
                const nAlumne = passosAlumne(estat, nPassos);
                const abans = Math.min(estat.k, nPassos);
                registre.push({ senseErrors: !!senseErrors, nAlumne, nPassos });
                estat = despresItem(estat, { senseErrors: !!senseErrors, nPassos });
                return {
                    pujat: estat.k > abans,
                    baixat: estat.k < abans,
                    totSol: !!senseErrors && nPassos > 0 && nAlumne >= nPassos,
                };
            },
            /** Exercicis fets sense cap error. */
            estrelles() {
                return registre.filter(r => r.senseErrors).length;
            },
        };
    }

    return { ENCERTS_PER_PUJAR, INICI_MAX, llegeixParametres, inicial, passosAlumne, despresItem, creaSessio };
})();

// La sessió d'aquesta pàgina (null si el mode no és actiu)
export const ESVAIMENT = (() => {
    const loc = typeof window !== 'undefined' && window.location ? window.location : { search: '', pathname: '' };
    const pagina = String(loc.pathname || '')
        .split('/')
        .pop()
        .replace('.html', '');
    const { actiu, inici } = Esvaiment.llegeixParametres(loc.search, pagina);
    return actiu ? Esvaiment.creaSessio(inici) : null;
})();
