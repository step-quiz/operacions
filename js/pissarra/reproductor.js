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
 *     detall      (oberts) → passos: el guió amb els passos d'«oberts» oberts (formules.js
 *                 historial amb detall i objectiu). Amb aquesta opció, al costat del text
 *                 del pas surt «Vull més detall» quan el pas en té: la línia del pas baixa en
 *                 gris com a objectiu i els subpassos s'escriuen a sobre, dins del calaix, un a
 *                 cada «Pas següent»; mentre s'és dins del detall, «Menys detall» el plega.
 * - Torna { reprodueix(), atura(), carrega(passos o detall), element }: carrega() posa un
 *   guió nou (o, amb una funció, el guió d'un exercici nou amb el detall tancat).
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
        detall: element('button', { class: 'pis-detall-boto', type: 'button', hidden: '' }),
    };
    let detall = typeof o.detall === 'function' ? o.detall : null; // (oberts) → passos
    let oberts = new Set();
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
        element('div', { class: 'pis-explicacio-fila' }, [
            element('p', { 'class': 'pis-explicacio', 'aria-live': 'polite' }, [r.numPas, r.textPas]),
            r.detall,
        ]),
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
                ...passos.map((pas, i) => {
                    const p = element('button', {
                        'class': 'pis-punt',
                        'type': 'button',
                        'aria-label': `Pas ${pas.id || i + 1}`,
                    });
                    p.addEventListener('click', () => {
                        atura();
                        pissarra.salta(i);
                    });
                    return p;
                })
            );
        }
        // Amb el detall, els passos es compten com a la vista tancada: «Pas 2b de 6»
        const pas = passos[idx];
        const tancats = passos.filter(p => !p.pare || (p.tanca && p.pares.length === 1)).length;
        r.numPas.textContent = `Pas ${pas.id || idx + 1} de ${detall ? tancats : passos.length}`;
        r.textPas.innerHTML = textAmbFormules(pas.text);
        if (r.punts) {
            [...r.punts.children].forEach((p, i) => {
                p.className =
                    'pis-punt' + (passos[i].pare ? ' sub' : '') + (i === idx ? ' actual' : i < idx ? ' fet' : '');
                p.setAttribute('aria-current', i === idx ? 'step' : 'false');
            });
        }
        r.detall.hidden = !detall || !(pas.teDetall || pas.pare);
        r.detall.textContent = pas.teDetall ? 'Vull més detall' : 'Menys detall';
        r.detall.disabled = pissarra.ocupat;
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

    /** Els passos oberts dins de «id» (els seus id comencen per «id» i hi afegeixen una lletra o una xifra). */
    const dins = (x, id) => x === id || (x.startsWith(id) && /\d$/.test(id) === /^[a-z]/i.test(x.slice(id.length)));

    /** «Vull més detall»: obre el pas que es veu; «Menys detall»: plega el detall on s'és. */
    async function canviaDetall() {
        const pas = pissarra.passos[pissarra.pas];
        if (!detall || pissarra.ocupat || !pas) return;
        atura();
        if (pas.teDetall) {
            oberts.add(pas.id);
            const nous = detall(new Set(oberts));
            await pissarra.canviaGuio(
                nous,
                nous.findIndex(p => p.pare === pas.id)
            );
        } else if (pas.pare) {
            const id = pas.pare;
            oberts = new Set([...oberts].filter(x => !dins(x, id)));
            const nous = detall(new Set(oberts));
            await pissarra.canviaGuio(
                nous,
                nous.findIndex(p => p.id === id),
                { senseVols: true }
            );
        }
        r.detall.focus();
    }

    /** Un guió nou (una llista de passos) o, amb una funció (oberts) → passos, un exercici nou amb el detall. */
    function carrega(guio) {
        atura();
        if (typeof guio === 'function') {
            detall = guio;
            oberts = new Set();
            return pissarra.carrega(detall(new Set()));
        }
        detall = null;
        return pissarra.carrega(guio);
    }

    pissarra.escolta(pinta);
    r.detall.addEventListener('click', canviaDetall);
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
    return Object.freeze({ reprodueix, atura, carrega, element: bloc });
}
