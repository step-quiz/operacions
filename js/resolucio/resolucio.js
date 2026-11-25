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
 *   «Un altre exercici», al costat, és una acció. Una activitat amb grups (Fórmules STEAM: les
 *   matèries) té abans uns botons per triar el grup, i el desplegable només mostra els nivells (les
 *   fórmules) d'aquell grup; a l'adreça, &nivell=<clau de la fórmula> (o &grup=<matèria>, el portal).
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

/** El portal: una targeta per activitat, en l'ordre dels blocs (TEMES) i del registre, sense subtítols. */
function portal() {
    document.body.classList.add('portal');
    $('portal').hidden = false;
    const ambKatex = typeof katex !== 'undefined';
    const blocs = TEMES.map(([tema]) => {
        const activitats = Object.entries(ACTIVITATS).filter(([, a]) => a.tema === tema);
        if (!activitats.length) return [];
        const targetes = activitats.map(([k, a]) => {
            const exemple = element('div', { 'class': 'targeta-exemple', 'aria-hidden': 'true' });
            // Un esquema (SVG del registre, p. ex. els cilindres) o la fórmula d'exemple
            if (a.esquema) exemple.innerHTML = a.esquema;
            else if (ambKatex) katex.render(a.exemple, exemple, { throwOnError: false, displayMode: false });
            else exemple.textContent = a.exemple;
            // Un xip per nivell o, amb grups, un per grup (les matèries de Fórmules STEAM); tots amb el número
            const xips = a.grups
                ? a.grups.map(([g, n], i) =>
                      element('a', { class: 'xip-nivell', href: `${enllacActivitat(k)}&grup=${g}`, title: n }, [
                          element('b', { text: String(i + 1) }),
                          n,
                      ])
                  )
                : a.nivells.map(([v, n]) =>
                      element('a', { class: 'xip-nivell', href: enllacActivitat(k, v), title: n }, [
                          element('b', { text: String(v) }),
                          n,
                      ])
                  );
            const nivells = element(
                'div',
                { 'class': 'targeta-nivells', 'aria-label': `Nivells de ${a.nom}`, 'role': 'group' },
                xips
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
            return element('article', { class: `targeta tema-${tema}` }, [
                exemple,
                element('div', { class: 'targeta-cos' }, [
                    element('h3', {}, [
                        element('a', { class: 'targeta-enllac', href: enllacActivitat(k), text: a.nom }),
                    ]),
                    element('p', { class: 'targeta-frase', text: a.frase }),
                    nivells,
                    element('div', { class: 'targeta-peu' }, [
                        // Un botó com «Copia l'enllaç» (el mateix enllaç que el títol: fora del Tab i dels lectors)
                        element('a', {
                            'class': 'targeta-mira',
                            'href': enllacActivitat(k),
                            'tabindex': '-1',
                            'aria-hidden': 'true',
                            'text': 'Mira com es resol →',
                        }),
                        botoCopia,
                    ]),
                ]),
            ]);
        });
        return targetes;
    });
    // Sense subtítols de bloc (el David, 25/11/2026): totes les targetes en una sola graella, en l'ordre dels blocs
    $('blocs').replaceChildren(element('div', { class: 'targetes' }, blocs.flat()));
}

/**
 * El desplegable del nivell (un listbox, com els menús de l'índex): el botó en mostra el número i el nom; la
 * llista s'obre cap amunt si a sota no hi cap. tria(valor) es crida quan l'alumne en tria un. Amb grups (les
 * matèries de Fórmules STEAM), cada nivell és [valor, nom, grup] i la llista només mostra els del grup triat
 * (posaGrup); aleshores el valor és una clau (no un número) i el botó no en mostra el número.
 */
function creaNivells(nivells, tria) {
    const caixa = $('nivell');
    const boto = $('nivell-boto');
    const llista = $('nivells');
    const ambNumero = nivells.every(([v]) => typeof v === 'number');
    let actual = nivells[0][0];
    let grup = nivells[0][2];
    let actiu = 0; // l'opció ressaltada amb el teclat (posició dins de les visibles)
    const opcions = nivells.map(([valor, nom], i) => {
        const o = element('div', {
            'class': 'nivell-opcio',
            'role': 'option',
            'id': `nivell-op-${i}`,
            'data-nivell': valor,
            'aria-selected': 'false',
        });
        if (ambNumero) o.append(element('span', { class: 'nivell-num', text: String(valor) }));
        o.append(element('span', { text: nom }));
        o.insertAdjacentHTML('beforeend', SVG_CHECK);
        o.addEventListener('click', () => escull(i));
        llista.append(o);
        return o;
    });
    $('nivell-num').hidden = !ambNumero;
    const visibles = () => opcions.filter((o, i) => nivells[i][2] === grup);
    const obert = () => !llista.hidden;
    function ressalta(k) {
        const vs = visibles();
        actiu = (k + vs.length) % vs.length;
        opcions.forEach(o => o.classList.toggle('actiu', o === vs[actiu]));
        llista.setAttribute('aria-activedescendant', vs[actiu].id);
        vs[actiu].scrollIntoView({ block: 'nearest' });
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
        ressalta(
            Math.max(
                0,
                visibles().findIndex(o => o.dataset.nivell === String(actual))
            )
        );
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
    const esculVisible = k => escull(opcions.indexOf(visibles()[k]));
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
            'End': () => ressalta(visibles().length - 1),
            'Enter': () => esculVisible(actiu),
            ' ': () => esculVisible(actiu),
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
        /** Marca el nivell que es veu (al botó i a la llista); amb grups, la llista passa al seu grup. */
        posa(valor) {
            actual = valor;
            const i = nivells.findIndex(([v]) => v === valor);
            grup = nivells[i][2];
            opcions.forEach((o, j) => (o.hidden = nivells[j][2] !== grup));
            $('nivell-num').textContent = String(valor);
            $('nivell-nom').textContent = nivells[i][1];
            opcions.forEach((o, j) => o.setAttribute('aria-selected', String(j === i)));
        },
    };
}

/**
 * Els grups (les matèries de Fórmules STEAM): uns botons enganxats, abans del desplegable. tria(clau) es crida
 * quan l'alumne en tria un; posa(clau) marca el que es veu.
 */
function creaGrups(grups, tria) {
    const caixa = $('grups');
    caixa.hidden = false;
    const botons = grups.map(([k, nom]) => {
        const b = element('button', {
            'type': 'button',
            'class': 'grup',
            'role': 'radio',
            'data-grup': k,
            'text': nom,
        });
        b.addEventListener('click', () => tria(k));
        caixa.append(b);
        return b;
    });
    return {
        posa(k) {
            for (const b of botons) b.setAttribute('aria-checked', String(b.dataset.grup === k));
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
    // Els nivells: els del registre o, amb grups, els del procediment ([valor, nom, grup]). A l'adreça, el valor
    // (un número o una clau) o, amb grups, només el grup (el primer nivell d'aquell grup).
    const nivells = activitat.nivells || procediment.NIVELLS;
    const demanat = parametres.get('nivell');
    const delGrup = activitat.grups && nivells.find(n => n[2] === parametres.get('grup'));
    let nivell = (nivells.find(([v]) => String(v) === demanat) || delGrup || nivells[0])[0];
    const grupDe = v => (nivells.find(([x]) => x === v) || [])[2];

    fesHoTu.hidden = false;
    botoProfessor.hidden = false;
    const pissarra = creaPissarra(zona, { files: 40 });
    const reproductor = creaReproductor(zona, pissarra, { teclat: true, dalt: true });
    // El pas i els botons van a la columna de l'esquerra, a sobre del nivell (resolucio.html)
    lateral.prepend(zona.querySelector('.pis-explicacio-fila'), reproductor.element);

    const triaNivell = creaNivells(nivells, valor => {
        if (pissarra.ocupat) return;
        nivell = valor;
        nouExercici();
    });
    // Amb grups, primer el grup (la matèria) i després el nivell (la fórmula): triar un grup en mostra el primer
    const triaGrup = activitat.grups
        ? creaGrups(activitat.grups, k => {
              if (pissarra.ocupat || k === grupDe(nivell)) return;
              nivell = nivells.find(n => n[2] === k)[0];
              nouExercici();
          })
        : null;
    if (activitat.grups) $('nivell-etiqueta').textContent = 'Fórmula';

    /** Un exercici nou del nivell, amb el detall tancat; el nivell queda a l'adreça i a «Ara fes-ho tu». */
    function nouExercici() {
        reproductor.atura();
        const exercici = procediment.exercici(nivell);
        reproductor.carrega(oberts => procediment.passos(exercici, { oberts }));
        triaNivell.posa(nivell);
        if (triaGrup) triaGrup.posa(grupDe(nivell));
        fesHoTu.href = activitat.enllac
            ? activitat.enllac(nivell, grupDe(nivell))
            : `${activitat.pagina}?nivell=${nivell}`;
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
