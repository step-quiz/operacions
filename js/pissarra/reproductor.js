/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/reproductor.js
 * ROL: «Resolució pas a pas» — el REPRODUCTOR d'una pissarra: botons (torna a
 *      començar, pas anterior, reprodueix/atura, pas següent), un punt per pas,
 *      la velocitat i el text del pas (què es fa i per què).
 * ARQUITECTURA:
 * - creaReproductor(contenidor, pissarra, opcions) posa els controls dins del
 *   contenidor i els connecta a una pissarra de pissarra.js. Opcions (totes
 *   opcionals; per defecte, true menys teclat):
 *     reprodueix  botó per reproduir tots els passos seguits
 *     punts       un punt per pas (es pot clicar per anar-hi)
 *     velocitat   lenta / normal / ràpida
 *     teclat      espai = reprodueix, fletxes ← → = pas anterior o següent
 *                 (per defecte false: dins d'una activitat el teclat és de l'alumne)
 * - Torna { reprodueix(), atura(), element }.
 * - L'alumne sempre marca el ritme: res no avança sol si no prem «Reprodueix».
 * - Origen: el reproductor de motor.js de step-quiz/pau (octubre 2026).
 * DEPENDÈNCIES: pissarra.js.
 * ============================================================================
 */
import { element, textAmbFormules } from './pissarra.js';

const TEMPS_LECTURA = Object.freeze({
    esperaInici: 500, // abans del primer pas, en reproduir
    llegir: 900, // pausa entre passos en reproduir…
    perParaula: 120, // …més aquest temps per paraula del text
});

const ICONES = Object.freeze({
    reinicia: 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z',
    anterior: 'M15.5 5 8.5 12l7 7z',
    reprodueix: 'M8 5v14l11-7z',
    atura: 'M7 5h4v14H7zM13 5h4v14h-4z',
    seguent: 'M8.5 5l7 7-7 7z',
});
const icona = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const espera = ms => new Promise(resol => setTimeout(resol, ms));

let comptador = 0; // per fer ids únics si una pàgina té més d'un reproductor

export function creaReproductor(contenidor, pissarra, opcions = {}) {
    const o = Object.assign({ reprodueix: true, punts: true, velocitat: true, teclat: false }, opcions);
    const boto = (classe, nom, d) =>
        element('button', {
            'class': 'pis-boto ' + classe,
            'type': 'button',
            'title': nom,
            'aria-label': nom,
            'html': icona(d),
        });
    const id = 'pis-velocitat-' + ++comptador;
    const r = {
        reinicia: boto('', 'Torna a començar', ICONES.reinicia),
        anterior: boto('', 'Pas anterior', ICONES.anterior),
        reprodueix: o.reprodueix ? boto('principal', 'Reprodueix', ICONES.reprodueix) : null,
        seguent: boto(o.reprodueix ? '' : 'principal', 'Pas següent', ICONES.seguent),
        punts: o.punts ? element('div', { 'class': 'pis-punts', 'role': 'group', 'aria-label': 'Passos' }) : null,
        velocitat: o.velocitat ? element('select', { id }) : null,
        numPas: element('span', { class: 'pis-num-pas' }),
        textPas: element('span', { class: 'pis-text-pas' }),
    };
    if (r.velocitat) {
        for (const [valor, nom] of [
            ['0.6', 'lenta'],
            ['1', 'normal'],
            ['1.6', 'ràpida'],
        ]) {
            r.velocitat.append(element('option', { value: valor, text: nom, selected: valor === '1' ? '' : null }));
        }
        r.velocitat.addEventListener('change', () => pissarra.velocitat(parseFloat(r.velocitat.value) || 1));
    }
    const bloc = element('div', { class: 'pis-controls' }, [
        element('div', { class: 'pis-reproductor' }, [
            element('div', { class: 'pis-botons' }, [r.reinicia, r.anterior, r.reprodueix, r.seguent]),
            r.punts,
            r.velocitat
                ? element('label', { class: 'pis-velocitat', for: id, text: 'Velocitat ' }, [r.velocitat])
                : null,
        ]),
        element('p', { 'class': 'pis-explicacio', 'aria-live': 'polite' }, [r.numPas, r.textPas]),
    ]);
    contenidor.append(bloc);

    let reproduint = false;
    let torn = 0; // canvia cada vegada que es talla una reproducció
    let nPunts = -1;

    function pinta() {
        const passos = pissarra.passos,
            idx = pissarra.pas,
            darrer = passos.length - 1;
        if (!passos.length) return;
        if (r.punts && nPunts !== passos.length) {
            nPunts = passos.length;
            r.punts.replaceChildren(
                ...passos.map((_, i) => {
                    const p = element('button', {
                        'class': 'pis-punt',
                        'type': 'button',
                        'aria-label': `Pas ${i + 1}`,
                    });
                    p.addEventListener('click', () => {
                        atura();
                        pissarra.salta(i);
                    });
                    return p;
                })
            );
        }
        r.numPas.textContent = `Pas ${idx + 1} de ${passos.length}`;
        r.textPas.innerHTML = textAmbFormules(passos[idx].text);
        if (r.punts) {
            [...r.punts.children].forEach((p, i) => {
                p.className = 'pis-punt' + (i === idx ? ' actual' : i < idx ? ' fet' : '');
                p.setAttribute('aria-current', i === idx ? 'step' : 'false');
            });
        }
        r.anterior.disabled = idx === 0;
        r.reinicia.disabled = idx === 0;
        r.seguent.disabled = idx === darrer;
    }

    function marcaReproduccio(estat) {
        reproduint = estat;
        if (!r.reprodueix) return;
        const nom = estat ? 'Atura' : 'Reprodueix';
        r.reprodueix.innerHTML = icona(estat ? ICONES.atura : ICONES.reprodueix);
        r.reprodueix.title = nom;
        r.reprodueix.setAttribute('aria-label', nom);
    }

    function atura() {
        torn++;
        if (reproduint) marcaReproduccio(false);
    }

    /** Reprodueix tots els passos que queden, o atura la reproducció. */
    async function reprodueix() {
        if (reproduint) {
            atura();
            return;
        }
        if (pissarra.ocupat) return;
        if (pissarra.pas >= pissarra.total - 1) pissarra.salta(0);
        marcaReproduccio(true);
        const meu = ++torn;
        await espera(TEMPS_LECTURA.esperaInici);
        while (reproduint && meu === torn && pissarra.pas < pissarra.total - 1) {
            await pissarra.seguent();
            if (!reproduint || meu !== torn) break;
            const paraules = pissarra.passos[pissarra.pas].text.split(/\s+/).length;
            await espera(TEMPS_LECTURA.llegir + paraules * TEMPS_LECTURA.perParaula);
        }
        if (meu === torn) marcaReproduccio(false);
    }

    pissarra.escolta(pinta);
    if (r.reprodueix) r.reprodueix.addEventListener('click', reprodueix);
    r.seguent.addEventListener('click', () => {
        atura();
        pissarra.seguent();
    });
    r.anterior.addEventListener('click', () => {
        atura();
        pissarra.salta(pissarra.pas - 1);
    });
    r.reinicia.addEventListener('click', () => {
        atura();
        pissarra.salta(0);
    });

    if (o.teclat) {
        document.addEventListener('keydown', e => {
            if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented || !bloc.isConnected) return;
            const t = e.target instanceof Element ? e.target : document.body;
            if (t.closest('input, select, textarea, [role="spinbutton"]')) return;
            if (e.key === ' ' && r.reprodueix) {
                if (t.closest('button, a')) return; // l'espai ja prem el botó enfocat
                e.preventDefault();
                reprodueix();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                atura();
                pissarra.seguent();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                atura();
                pissarra.salta(pissarra.pas - 1);
            }
        });
    }

    pinta();
    return Object.freeze({ reprodueix, atura, element: bloc });
}
