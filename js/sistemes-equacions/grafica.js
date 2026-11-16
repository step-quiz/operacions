/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/sistemes-equacions/grafica.js
 * ROL: El botó «Mira-ho a la gràfica» de Sistemes d'equacions: en acabar un
 *      sistema (resolt o amb els intents esgotats), mostra les dues rectes a la
 *      quadrícula comuna i el punt on es tallen, que és la solució.
 * ARQUITECTURA:
 * - rectaDeEquacio() i svgSistema() són purs (tornen dades i text SVG, sense DOM);
 *   el dibuix és el de js/passos/quadricula.js, amb els estils de css/quadricula.css.
 * - posaBotoGrafica(p, caixa) és l'única part amb DOM: afegeix el botó i el dibuix
 *   (amagat fins que es prem) al final de la caixa del sistema. La caixa es
 *   torna a pintar a cada pregunta, i el botó se'n va amb ella.
 * - No canvia res de la pregunta, dels punts ni del codi.
 * DEPENDÈNCIES: js/passos/quadricula.js.
 * ============================================================================
 */

import { svgQuadricula } from '../passos/quadricula.js';

/** L'eix va de −LIMIT a LIMIT: les solucions dels sistemes són enters de −5 a 5. */
const LIMIT = 6;

/** La recta ax + by = c per a la quadrícula: y = mx + n, o vertical si b = 0. */
export function rectaDeEquacio(a, b, c) {
    if (b !== 0) return { m: [-a, b], n: [c, b] };
    return {
        per: [
            [c / a, 0],
            [c / a, 1],
        ],
    };
}

/** Un nombre amb el signe menys tipogràfic: −3. */
const signe = n => String(n).replace('-', '−');

/** El text del punt de tall: (2, −3). */
export function textPunt(x, y) {
    return `(${signe(x)}, ${signe(y)})`;
}

/**
 * La quadrícula amb les rectes de les dues equacions de p ({ a1, b1, c1, a2, b2, c2 })
 * i el punt de tall (x0, y0): la primera amb el color del tema, la segona amb l'accent.
 */
export function svgSistema(p) {
    return svgQuadricula({
        limit: LIMIT,
        rectes: [rectaDeEquacio(p.a1, p.b1, p.c1), { ...rectaDeEquacio(p.a2, p.b2, p.c2), classe: 'jp-q-segona' }],
        punts: [{ x: p.x0, y: p.y0, etiqueta: textPunt(p.x0, p.y0) }],
    });
}

/** Afegeix el botó «Mira-ho a la gràfica» (i el dibuix, amagat) al final de `caixa`. */
export function posaBotoGrafica(p, caixa) {
    if (!caixa) return;
    const zona = document.createElement('div');
    zona.className = 'qg';

    const boto = document.createElement('button');
    boto.type = 'button';
    boto.className = 'btn-submit qg-boto';
    boto.textContent = '📈 Mira-ho a la gràfica';
    boto.setAttribute('aria-expanded', 'false');

    const dibuix = document.createElement('div');
    dibuix.className = 'qg-dibuix';
    dibuix.hidden = true;
    dibuix.innerHTML =
        svgSistema(p) +
        '<div class="qg-llegenda">' +
        '<span><i class="qg-mostra"></i>(1a)</span>' +
        '<span><i class="qg-mostra qg-segona"></i>(2a)</span>' +
        `<span><i class="qg-mostra qg-punt"></i>${textPunt(p.x0, p.y0)}</span>` +
        '</div>' +
        '<p class="qg-text">Cada equació és una recta. Les dues rectes es tallen al punt ' +
        `<strong>${textPunt(p.x0, p.y0)}</strong>: és l'únic punt que és de totes dues, i per això ` +
        `<strong>x = ${signe(p.x0)}, y = ${signe(p.y0)}</strong> és la solució del sistema (els dos nombres alhora).</p>`;
    dibuix
        .querySelector('svg')
        .setAttribute('aria-label', `Les rectes (1a) i (2a), que es tallen a ${textPunt(p.x0, p.y0)}`);

    boto.addEventListener('click', () => {
        const obre = dibuix.hidden;
        dibuix.hidden = !obre;
        boto.setAttribute('aria-expanded', String(obre));
        boto.textContent = obre ? 'Amaga la gràfica' : '📈 Mira-ho a la gràfica';
        if (obre) dibuix.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    zona.append(boto, dibuix);
    caixa.appendChild(zona);
}
