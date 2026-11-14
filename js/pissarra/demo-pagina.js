/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/demo-pagina.js
 * ROL: Controlador de pissarra-demo.html: uns botons trien un dels guions de
 *      demo.js, que es mostra a la pissarra amb el seu reproductor.
 *      La demo triada queda a l'adreça (?demo=equacio) per poder-la enllaçar.
 *      Si la demo té detall a demanda, la casella «Mostra'l amb tot el detall»
 *      l'escriu amb tots els passos oberts (?detall=1). És provisional: el botó
 *      «Vull més detall» de cada pas és de l'etapa 3 (docs/pissarra/STATE.md).
 * DEPENDÈNCIES: pissarra.js, reproductor.js, demo.js. KaTeX el carrega la pàgina.
 * ============================================================================
 */
import { creaPissarra, element } from './pissarra.js';
import { creaReproductor } from './reproductor.js';
import { DEMOS } from './demo.js';

const zona = document.getElementById('demo');
const botons = document.getElementById('demos');
const detall = document.getElementById('detall-demo');
const casella = document.getElementById('detall-casella');

if (typeof katex === 'undefined') {
    zona.textContent =
        "No s'ha pogut carregar KaTeX, la biblioteca que dibuixa les fórmules. Torna a carregar la pàgina.";
} else {
    const files = Math.max(...DEMOS.map(d => d.files));
    const pissarra = creaPissarra(zona, { files });
    const reproductor = creaReproductor(zona, pissarra, { teclat: true });

    let actual = null;
    /** Els passos de la demo: amb la casella marcada, tots els passos que tenen detall, oberts. */
    const passosDe = demo => {
        if (!demo.detall || !casella.checked) return demo.passos();
        const oberts = demo
            .passos()
            .filter(p => p.teDetall)
            .map(p => p.id);
        return demo.passos({ oberts: new Set(oberts) });
    };
    const tria = id => {
        const demo = DEMOS.find(d => d.id === id) || DEMOS[0];
        reproductor.atura();
        detall.hidden = !demo.detall;
        if (!pissarra.carrega(passosDe(demo))) return;
        actual = demo;
        for (const b of botons.children) b.setAttribute('aria-pressed', String(b.dataset.id === demo.id));
        try {
            const ambDetall = demo.detall && casella.checked ? '&detall=1' : '';
            history.replaceState(null, '', `${location.pathname}?demo=${demo.id}${ambDetall}`);
        } catch (e) {
            /* alguns visors no deixen canviar l'adreça */
        }
    };
    for (const d of DEMOS) {
        const b = element('button', { 'class': 'demo-tria', 'type': 'button', 'text': d.nom, 'data-id': d.id });
        b.addEventListener('click', () => tria(d.id));
        botons.append(b);
    }
    casella.addEventListener('change', () => tria(actual ? actual.id : null));
    const parametres = new URLSearchParams(location.search);
    casella.checked = parametres.get('detall') === '1';
    tria(parametres.get('demo'));
    // Per a les proves amb el navegador (tests/navegador/prova-pissarra.js)
    window.demoPissarra = Object.freeze({ pissarra, tria });
}
