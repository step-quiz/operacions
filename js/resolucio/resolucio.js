/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/resolucio/resolucio.js
 * ROL: Controlador de resolucio.html, l'escenari B de la «Resolució pas a pas»:
 *      l'alumne mira com es resol un exercici d'una activitat, pas a pas, a la
 *      pissarra (sense fer-lo ell). Amb el reproductor marca el ritme, i a cada
 *      pas que en té pot demanar «Vull més detall». «Ara fes-ho tu» porta a
 *      l'activitat (l'escenari A), amb el mateix nivell.
 * ARQUITECTURA:
 * - resolucio.html?activitat=equacions&nivell=2: l'activitat és una de
 *   js/resolucio/activitats.js; el nivell, un dels seus (per defecte, el primer).
 *   Sense activitat (o una que no en té), la pàgina diu quines en tenen.
 * - Cada exercici és nou (el procediment de l'activitat el genera); el nivell
 *   queda a l'adreça per poder-la enllaçar.
 * DEPENDÈNCIES: pissarra.js, reproductor.js, activitats.js (i el procediment de
 *      cada activitat). KaTeX el carrega la pàgina.
 * ============================================================================
 */
import { creaPissarra, element } from '../pissarra/pissarra.js';
import { creaReproductor } from '../pissarra/reproductor.js';
import { ACTIVITATS } from './activitats.js';

const zona = document.getElementById('pissarra');
const barra = document.getElementById('barra');
const nivells = document.getElementById('nivells');
const unAltre = document.getElementById('un-altre');
const fesHoTu = document.getElementById('fes-ho-tu');
const titol = document.getElementById('titol');

const parametres = new URLSearchParams(location.search);
const clau = parametres.get('activitat');
const activitat = Object.prototype.hasOwnProperty.call(ACTIVITATS, clau) ? ACTIVITATS[clau] : null;

/** Sense activitat: la llista de les que tenen resolució pas a pas. */
function llista() {
    zona.replaceChildren(
        element('div', { class: 'avis' }, [
            element('p', { text: 'Tria una activitat amb resolució pas a pas:' }),
            element(
                'ul',
                {},
                Object.entries(ACTIVITATS).map(([k, a]) =>
                    element('li', {}, [element('a', { href: `resolucio.html?activitat=${k}`, text: a.nom })])
                )
            ),
        ])
    );
}

async function inicia() {
    if (typeof katex === 'undefined') {
        zona.textContent =
            "No s'ha pogut carregar KaTeX, la biblioteca que dibuixa les fórmules. Torna a carregar la pàgina.";
        return;
    }
    const procediment = await activitat.carrega();
    const valors = activitat.nivells.map(([v]) => v);
    let nivell = Number(parametres.get('nivell'));
    if (!valors.includes(nivell)) nivell = valors[0];

    document.title = `Resolució pas a pas — ${activitat.nom}`;
    titol.textContent = `${activitat.nom}: resolució pas a pas`;
    barra.hidden = false;
    const pissarra = creaPissarra(zona, { files: 40 });
    const reproductor = creaReproductor(zona, pissarra, { teclat: true });

    /** Un exercici nou del nivell, amb el detall tancat; el nivell queda a l'adreça i a «Ara fes-ho tu». */
    function nouExercici() {
        reproductor.atura();
        const exercici = procediment.exercici(nivell);
        reproductor.carrega(oberts => procediment.passos(exercici, { oberts }));
        for (const b of nivells.children) b.setAttribute('aria-pressed', String(Number(b.dataset.nivell) === nivell));
        fesHoTu.href = `${activitat.pagina}?nivell=${nivell}`;
        try {
            history.replaceState(null, '', `${location.pathname}?activitat=${clau}&nivell=${nivell}`);
        } catch (e) {
            /* alguns visors no deixen canviar l'adreça */
        }
    }
    for (const [valor, nom] of activitat.nivells) {
        const b = element('button', { 'class': 'tria', 'type': 'button', 'text': nom, 'data-nivell': valor });
        b.addEventListener('click', () => {
            if (pissarra.ocupat) return;
            nivell = valor;
            nouExercici();
        });
        nivells.append(b);
    }
    unAltre.addEventListener('click', () => {
        if (!pissarra.ocupat) nouExercici();
    });
    nouExercici();
    // Per a les proves amb el navegador (tests/navegador/prova-pissarra.js)
    window.resolucio = Object.freeze({ pissarra, reproductor, nouExercici });
}

if (activitat) inicia();
else llista();
