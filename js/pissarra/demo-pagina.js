/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/demo-pagina.js
 * ROL: Controlador de pissarra-demo.html: uns botons trien un dels guions de
 *      demo.js, que es mostra a la pissarra amb el seu reproductor.
 *      La demo triada queda a l'adreça (?demo=equacio) per poder-la enllaçar.
 * DEPENDÈNCIES: pissarra.js, reproductor.js, demo.js. KaTeX el carrega la pàgina.
 * ============================================================================
 */
import { creaPissarra, element } from './pissarra.js';
import { creaReproductor } from './reproductor.js';
import { DEMOS } from './demo.js';

const zona = document.getElementById('demo');
const botons = document.getElementById('demos');

if (typeof katex === 'undefined') {
    zona.textContent =
        "No s'ha pogut carregar KaTeX, la biblioteca que dibuixa les fórmules. Torna a carregar la pàgina.";
} else {
    const files = Math.max(...DEMOS.map(d => d.files));
    const pissarra = creaPissarra(zona, { files });
    const reproductor = creaReproductor(zona, pissarra, { teclat: true });

    const tria = id => {
        const demo = DEMOS.find(d => d.id === id) || DEMOS[0];
        reproductor.atura();
        if (!pissarra.carrega(demo.passos())) return;
        for (const b of botons.children) b.setAttribute('aria-pressed', String(b.dataset.id === demo.id));
        try {
            history.replaceState(null, '', `${location.pathname}?demo=${demo.id}`);
        } catch (e) {
            /* alguns visors no deixen canviar l'adreça */
        }
    };
    for (const d of DEMOS) {
        const b = element('button', { 'class': 'demo-tria', 'type': 'button', 'text': d.nom, 'data-id': d.id });
        b.addEventListener('click', () => tria(d.id));
        botons.append(b);
    }
    tria(new URLSearchParams(location.search).get('demo'));
    // Per a les proves amb el navegador (tests/navegador/prova-pissarra.js)
    window.demoPissarra = Object.freeze({ pissarra, tria });
}
