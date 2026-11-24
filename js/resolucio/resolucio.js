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
 * - resolucio.html (sense activitat) és el PORTAL: una targeta per activitat de
 *   js/resolucio/activitats.js, agrupades per bloc (TEMES), amb el nom, la fórmula
 *   d'exemple (KaTeX), una frase, els nivells (xips que hi porten directament) i
 *   «Copia l'enllaç» (per al professorat). L'obre el botó «Resolució pas a pas»
 *   d'index.html, en una pestanya nova (el David, 24/11/2026).
 * - resolucio.html?activitat=equacions&nivell=2: la resolució d'una activitat; el
 *   nivell, un dels seus (per defecte, el primer). Cada exercici és nou (el
 *   procediment de l'activitat el genera); el nivell queda a l'adreça per poder-la
 *   enllaçar. Una activitat que no en té mostra el portal.
 * - Disposició (css/resolucio.css; el David, 24/11/2026): la pàgina té el color del
 *   bloc de l'activitat (la classe tema-… a <html>) i és d'una pantalla: la pissarra
 *   ocupa tota l'alçada que queda (CSS, sense càlculs aquí) i els botons no es mouen
 *   d'un pas a l'altre. La capçalera: «← Resolucions» (el portal), el nom, «Ara fes-ho
 *   tu» i «Projectar»; el peu, flotant.
 * - El nivell es tria amb un desplegable (un listbox: fletxes, Inici/Fi, Retorn, Esc);
 *   «Un altre exercici», al costat, és una acció.
 * - Projectar (el mode professor, per al projector; el David, 16/11/2026): el botó
 *   «Projectar» (o ?professor=1) fa la pissarra gran (--pis-escala) a tota la pantalla
 *   i amaga el títol, el nivell, les frases i el peu; amb el botó, pantalla completa.
 *   Els passos es passen amb les fletxes, l'espai o un comandament (Re Pàg / Av Pàg).
 * DEPENDÈNCIES: pissarra.js, reproductor.js, activitats.js (i el procediment de
 *      cada activitat). KaTeX el carrega la pàgina.
 * ============================================================================
 */
import { creaPissarra, element } from '../pissarra/pissarra.js';
import { creaReproductor } from '../pissarra/reproductor.js';
import { ACTIVITATS, TEMES } from './activitats.js';

const $ = id => document.getElementById(id);
const zona = $('pissarra');
const lateral = $('lateral');
const unAltre = $('un-altre');
const fesHoTu = $('fes-ho-tu');
const botoProfessor = $('professor');
const botoPantalla = $('pantalla');
const titol = $('titol');

const parametres = new URLSearchParams(location.search);
const clau = parametres.get('activitat');
const activitat = Object.prototype.hasOwnProperty.call(ACTIVITATS, clau) ? ACTIVITATS[clau] : null;

const SVG_CHECK =
    '<svg class="nivell-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 8 7 12 13 4"/></svg>';
const SVG_COPIA =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/>' +
    '<path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';

const enllacActivitat = (k, nivell) => `resolucio.html?activitat=${k}` + (nivell ? `&nivell=${nivell}` : '');

/** Copia un text al porta-retalls; si el navegador no ho deixa, torna false. */
async function copia(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        return false;
    }
}

/** El portal: una targeta per activitat, agrupades per bloc (TEMES), en l'ordre del registre. */
function portal() {
    document.body.classList.add('portal');
    $('portal').hidden = false;
    const ambKatex = typeof katex !== 'undefined';
    const blocs = TEMES.map(([tema, nomBloc]) => {
        const activitats = Object.entries(ACTIVITATS).filter(([, a]) => a.tema === tema);
        if (!activitats.length) return null;
        const targetes = activitats.map(([k, a]) => {
            const exemple = element('div', { 'class': 'targeta-exemple', 'aria-hidden': 'true' });
            if (ambKatex) katex.render(a.exemple, exemple, { throwOnError: false, displayMode: false });
            else exemple.textContent = a.exemple;
            const nivells = element(
                'div',
                { 'class': 'targeta-nivells', 'aria-label': `Nivells de ${a.nom}`, 'role': 'group' },
                a.nivells.map(([v, n]) =>
                    element('a', { class: 'xip-nivell', href: enllacActivitat(k, v), title: n }, [
                        element('b', { text: String(v) }),
                        n,
                    ])
                )
            );
            const botoCopia = element('button', {
                type: 'button',
                class: 'copia',
                html: `${SVG_COPIA}<span>Copia l'enllaç</span>`,
                title: "Copia l'enllaç d'aquesta resolució per passar-lo als alumnes",
            });
            botoCopia.addEventListener('click', async () => {
                const url = new URL(enllacActivitat(k), location.href).href;
                const text = botoCopia.querySelector('span');
                text.textContent = (await copia(url)) ? 'Copiat ✓' : url;
                setTimeout(() => (text.textContent = "Copia l'enllaç"), 2500);
            });
            return element('article', { class: 'targeta' }, [
                exemple,
                element('div', { class: 'targeta-cos' }, [
                    element('h3', {}, [
                        element('a', { class: 'targeta-enllac', href: enllacActivitat(k), text: a.nom }),
                    ]),
                    element('p', { class: 'targeta-frase', text: a.frase }),
                    nivells,
                    element('div', { class: 'targeta-peu' }, [
                        element('span', {
                            'class': 'targeta-mira',
                            'aria-hidden': 'true',
                            'text': 'Mira com es resol →',
                        }),
                        botoCopia,
                    ]),
                ]),
            ]);
        });
        return element('section', { 'class': `bloc tema-${tema}`, 'aria-labelledby': `bloc-${tema}` }, [
            element('h2', { class: 'bloc-titol', id: `bloc-${tema}`, text: nomBloc }),
            element('div', { class: 'targetes' }, targetes),
        ]);
    });
    $('blocs').replaceChildren(...blocs.filter(Boolean));
}

/**
 * El desplegable del nivell (un listbox, com els menús de l'índex): el botó en mostra el número i el nom; la
 * llista s'obre cap amunt si a sota no hi cap. tria(valor) es crida quan l'alumne en tria un.
 */
function creaNivells(nivells, tria) {
    const caixa = $('nivell');
    const boto = $('nivell-boto');
    const llista = $('nivells');
    let actual = nivells[0][0];
    let actiu = 0; // l'opció ressaltada amb el teclat
    const opcions = nivells.map(([valor, nom], i) => {
        const o = element('div', {
            'class': 'nivell-opcio',
            'role': 'option',
            'id': `nivell-op-${i}`,
            'data-nivell': valor,
            'aria-selected': 'false',
        });
        o.innerHTML = `<span class="nivell-num">${valor}</span>`;
        o.append(element('span', { text: nom }));
        o.insertAdjacentHTML('beforeend', SVG_CHECK);
        o.addEventListener('click', () => escull(i));
        llista.append(o);
        return o;
    });
    const obert = () => !llista.hidden;
    function ressalta(i) {
        actiu = (i + opcions.length) % opcions.length;
        opcions.forEach((o, j) => o.classList.toggle('actiu', j === actiu));
        llista.setAttribute('aria-activedescendant', opcions[actiu].id);
        opcions[actiu].scrollIntoView({ block: 'nearest' });
    }
    function obre() {
        llista.hidden = false;
        caixa.classList.add('obert');
        boto.setAttribute('aria-expanded', 'true');
        // Cap amunt si a sota no hi cap (la columna de l'esquerra a les pantalles grans, el mòbil)
        caixa.classList.remove('amunt');
        const r = boto.getBoundingClientRect();
        const alt = llista.offsetHeight;
        if (innerHeight - r.bottom < alt + 70 && r.top > innerHeight - r.bottom) caixa.classList.add('amunt');
        ressalta(nivells.findIndex(([v]) => v === actual));
        llista.focus();
    }
    function tanca(tornaAlBoto = true) {
        if (!obert()) return;
        llista.hidden = true;
        caixa.classList.remove('obert');
        boto.setAttribute('aria-expanded', 'false');
        if (tornaAlBoto) boto.focus();
    }
    function escull(i) {
        tanca();
        tria(nivells[i][0]);
    }
    boto.addEventListener('click', () => (obert() ? tanca() : obre()));
    boto.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            obre();
        }
    });
    llista.addEventListener('keydown', e => {
        const tecles = {
            'ArrowDown': () => ressalta(actiu + 1),
            'ArrowUp': () => ressalta(actiu - 1),
            'Home': () => ressalta(0),
            'End': () => ressalta(opcions.length - 1),
            'Enter': () => escull(actiu),
            ' ': () => escull(actiu),
            'Escape': () => tanca(),
            'Tab': () => tanca(false),
        };
        if (!tecles[e.key]) return;
        if (e.key !== 'Tab') e.preventDefault();
        tecles[e.key]();
    });
    document.addEventListener('click', e => {
        if (!caixa.contains(e.target)) tanca(false);
    });
    return {
        /** Marca el nivell que es veu (al botó i a la llista). */
        posa(valor) {
            actual = valor;
            const i = nivells.findIndex(([v]) => v === valor);
            $('nivell-num').textContent = String(valor);
            $('nivell-nom').textContent = nivells[i][1];
            opcions.forEach((o, j) => o.setAttribute('aria-selected', String(j === i)));
        },
    };
}

async function inicia() {
    document.body.classList.add('activitat');
    if (activitat.tema) document.documentElement.classList.add('tema-' + activitat.tema);
    $('resolucio').hidden = false;
    $('torna').href = 'resolucio.html';
    $('torna').setAttribute('aria-label', 'Totes les resolucions');
    $('torna-text').textContent = 'Resolucions';
    titol.replaceChildren(activitat.nom, element('span', { class: 'cap-sub', text: ' · resolució pas a pas' }));
    document.title = `Resolució pas a pas — ${activitat.nom}`;
    if (typeof katex === 'undefined') {
        zona.textContent =
            "No s'ha pogut carregar KaTeX, la biblioteca que dibuixa les fórmules. Torna a carregar la pàgina.";
        return;
    }
    const procediment = await activitat.carrega();
    const valors = activitat.nivells.map(([v]) => v);
    let nivell = Number(parametres.get('nivell'));
    if (!valors.includes(nivell)) nivell = valors[0];

    fesHoTu.hidden = false;
    botoProfessor.hidden = false;
    const pissarra = creaPissarra(zona, { files: 40 });
    const reproductor = creaReproductor(zona, pissarra, { teclat: true, dalt: true });
    // El pas i els botons van a la columna de l'esquerra, a sobre del nivell (resolucio.html)
    lateral.prepend(zona.querySelector('.pis-explicacio-fila'), reproductor.element);

    const triaNivell = creaNivells(activitat.nivells, valor => {
        if (pissarra.ocupat) return;
        nivell = valor;
        nouExercici();
    });

    /** Un exercici nou del nivell, amb el detall tancat; el nivell queda a l'adreça i a «Ara fes-ho tu». */
    function nouExercici() {
        reproductor.atura();
        const exercici = procediment.exercici(nivell);
        reproductor.carrega(oberts => procediment.passos(exercici, { oberts }));
        triaNivell.posa(nivell);
        fesHoTu.href = activitat.enllac ? activitat.enllac(nivell) : `${activitat.pagina}?nivell=${nivell}`;
        posaAdreca();
    }
    /** L'adreça diu l'activitat, el nivell i, si hi és, el mode professor (per poder-la enllaçar). */
    function posaAdreca() {
        const professor = document.body.classList.contains('professor') ? '&professor=1' : '';
        try {
            history.replaceState(null, '', `${location.pathname}?activitat=${clau}&nivell=${nivell}${professor}`);
        } catch (e) {
            /* alguns visors no deixen canviar l'adreça */
        }
    }
    unAltre.addEventListener('click', () => {
        if (!pissarra.ocupat) nouExercici();
    });

    // Projectar (el mode professor, per al projector): la pissarra gran, sense les frases. En entrar-hi amb el botó,
    // pantalla completa (el navegador només la deixa demanar després d'un clic); amb ?professor=1, el botó
    // «Pantalla completa». Esc surt de la pantalla completa; el botó, del mode.
    const enPantalla = () => Boolean(document.fullscreenElement);
    function posaProfessor(actiu, { pantalla = false } = {}) {
        document.body.classList.toggle('professor', actiu);
        botoProfessor.setAttribute('aria-pressed', String(actiu));
        botoProfessor.textContent = actiu ? 'Deixa de projectar' : 'Projectar';
        if (pantalla && actiu && !enPantalla() && document.documentElement.requestFullscreen)
            document.documentElement.requestFullscreen().catch(() => {});
        if (!actiu && enPantalla() && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        botoPantalla.hidden = !actiu || enPantalla() || !document.documentElement.requestFullscreen;
        posaAdreca();
        pissarra.reajusta();
    }
    botoProfessor.addEventListener('click', () =>
        posaProfessor(!document.body.classList.contains('professor'), { pantalla: true })
    );
    botoPantalla.addEventListener('click', () => posaProfessor(true, { pantalla: true }));
    document.addEventListener('fullscreenchange', () => {
        botoPantalla.hidden = !document.body.classList.contains('professor') || enPantalla();
        pissarra.reajusta();
    });

    nouExercici();
    if (parametres.get('professor') === '1') posaProfessor(true);
    // Per a les proves amb el navegador (tests/navegador/prova-pissarra.js)
    window.resolucio = Object.freeze({ pissarra, reproductor, nouExercici });
}

if (activitat) inicia();
else portal();
