/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/pissarra.js
 * ROL: «Resolució pas a pas» — la PISSARRA animada: dibuixa un pas (files TeX
 *      amb KaTeX, files de text) i anima el canvi al pas següent a l'estil de
 *      Graspable Math: els símbols viatgen, es fusionen o s'esvaeixen.
 * ARQUITECTURA:
 * - creaPissarra(contenidor, { files, marc }) posa la pissarra dins d'un element
 *   de la pàgina d'una activitat i torna un controlador. Dues maneres de fer-la
 *   servir:
 *   · amb un GUIÓ (tots els passos se saben d'entrada, p. ex. un exemple resolt):
 *     carrega(passos)  passos nous (de formules.js guio()): mostra el primer
 *     seguent()        anima el pas següent (Promise: acaba quan acaba l'animació)
 *     salta(i)         mostra el pas i, sense animació
 *     repeteix()       torna a animar l'arribada al pas actual («Torna-ho a veure»)
 *   · PAS A PAS LLIURE (l'activitat decideix cada pas segons el que fa l'alumne):
 *     mostraPas(pas)   mostra aquest pas, sense animació
 *     animaPas(pas)    anima el canvi del pas que es veu a aquest (Promise)
 *   i, per a totes dues: velocitat(v) (0.6 lenta, 1 normal, 1.6 ràpida),
 *   escolta(f), pas, total, ocupat, passos, element.
 *   marc: false treu la vora i el fons de punts (la pissarra queda invisible i
 *   només es veuen les animacions: serveix per animar la zona de treball que
 *   l'activitat ja tenia, amb el seu aspecte de sempre).
 * - Tipus de fila: TeX (KaTeX), text («§…»), esquema SVG («<svg…», només es fon)
 *   i HTML («<…», qualsevol altre element: l'HTML de l'activitat, inserit tal
 *   qual; els seus elements amb data-k="clau" es mouen com els símbols).
 * - Què passa amb cada símbol amb clau (vegeu formules.js):
 *     · mateixa clau abans i després, o pas.reanomena = {nova: vella}: és el
 *       mateix símbol i es desplaça; si el contingut canvia, es fon;
 *     · pas.fusiona = {nova: [velles]}: les velles van a parar a la nova;
 *     · la resta de símbols vells s'esvaeixen, i els nous apareixen.
 *   Si el pas no arrossega cap símbol, abans de moure res uns requadres blaus
 *   assenyalen què canviarà o desapareixerà, i després el segueixen. Totes les
 *   posicions es mesuren sobre el que ha dibuixat KaTeX: res no es col·loca a mà.
 * - La mida de la lletra s'ajusta perquè la fila més ampla de tots els passos hi
 *   càpiga. Si la pissarra té una alçada màxima (CSS), té la seva pròpia barra de
 *   desplaçament i abans de cada animació es mou fins a la fila que canvia.
 * - KaTeX: el de vendor/. Si la pàgina no l'ha carregat, carregaKatex() l'afegeix
 *   (així una activitat només el carrega quan fa servir la pissarra).
 * - Origen: motor.js dels procediments animats de step-quiz/pau (octubre 2026),
 *   passat a mòdul ES i separat de la pàgina. Vegeu docs/pissarra/MOTOR.md.
 * DEPENDÈNCIES: KaTeX (global katex, vendor/katex-0.16.11), css/pissarra.css.
 * ============================================================================
 */

// ── 1. CONFIGURACIÓ ──────────────────────────────────────────────────────────

/** KaTeX a la pissarra: l'única ordre «de confiança» és \htmlData (les claus). */
const OPCIONS_PISSARRA = Object.freeze({
    throwOnError: false,
    strict: 'ignore', // \htmlData és una extensió de KaTeX
    trust: context => context.command === '\\htmlData',
});
/** KaTeX als textos dels passos: cap ordre «de confiança». */
const OPCIONS_TEXT = Object.freeze({ throwOnError: false });

/** Durades en mil·lisegons, a velocitat normal. */
export const TEMPS = Object.freeze({
    pas: 1200, // moviment d'un pas
    pasAmbAvis: 1500, // moviment d'un pas que abans assenyala què canvia
    avis: 300, // aparició dels requadres d'avís
    lectura: 650, // pausa amb els requadres a la vista
    cursor: 540, // el cursor va fins a un símbol
    clic: 120, // durada d'un clic
    aparta: 230, // el cursor s'aparta del símbol
    agafa: 180, // el cursor agafa un símbol abans d'arrossegar-lo
});
/** Corba de moviment (acceleració i frenada suaus). */
const CORBA = 'cubic-bezier(.45,.05,.25,1)';
/** Mida de la lletra de la pissarra (px). Es redueix si la fila més ampla no hi cap. */
export const MIDA = Object.freeze({ gran: 30, petita: 22, minima: 12, pantallaPetita: '(max-width: 520px)' });

const KATEX_JS = new URL('../../vendor/katex-0.16.11/katex.min.js', import.meta.url).href;
const KATEX_CSS = new URL('../../vendor/katex-0.16.11/katex.min.css', import.meta.url).href;
const CURSOR =
    '<svg viewBox="0 0 22 30" aria-hidden="true"><path d="M2 2 L2 24 L7.6 18.8 L11.4 27.4 L15 25.8 L11.3 17.4 L18.6 17.4 Z" ' +
    'fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';

// ── 2. UTILITATS ─────────────────────────────────────────────────────────────

/** Crea un element: element('p', {class: 'x', text: 'Hola'}, [fills]). */
export function element(etiqueta, atributs = {}, fills = []) {
    const e = document.createElement(etiqueta);
    for (const [k, v] of Object.entries(atributs)) {
        if (v === undefined || v === null) continue;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else e.setAttribute(k, v);
    }
    e.append(...[].concat(fills).filter(Boolean));
    return e;
}

const espera = ms => new Promise(resol => setTimeout(resol, ms));
const escapa = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** «Text amb $fórmules$» → HTML (el text d'un pas, un enunciat). */
export function textAmbFormules(text) {
    return text
        .split(/(\$[^$]+\$)/)
        .map(tros =>
            tros.length > 2 && tros.startsWith('$') && tros.endsWith('$')
                ? katex.renderToString(tros.slice(1, -1), OPCIONS_TEXT)
                : escapa(tros).replace(/\n/g, '<br>')
        )
        .join('');
}

/**
 * Fila de text de la pissarra (vegeu formules.js filaText): text amb $fórmules$ i
 * frases {{clau|marca|text}}, que es poden seguir d'un pas a l'altre com els
 * símbols (data-k) i es poden marcar (classe «marca-…»).
 */
function textAmbFrases(text) {
    return text
        .split(/(\{\{[^}]*\}\})/)
        .map(tros => {
            const m = /^\{\{([^|]*)\|([^|]*)\|(.*)\}\}$/.exec(tros);
            if (!m) return textAmbFormules(tros);
            const [, k, marca, contingut] = m;
            return `<span${k ? ` data-k="${escapa(k)}"` : ''} class="pis-frase${marca ? ' marca-' + escapa(marca) : ''}">${textAmbFormules(contingut)}</span>`;
        })
        .join('');
}
const esFilaText = tex => tex.startsWith('§');
/** Una fila que és un esquema (SVG fet pel procediment, no per l'usuari): es mostra tal qual. */
const esFilaFigura = tex => tex.startsWith('<svg');
/**
 * Una fila d'HTML (fet per l'activitat, no per l'usuari: p. ex. la seva taula de la
 * resolució): es mostra tal qual i els elements amb data-k es mouen com els símbols.
 */
const esFilaHtml = tex => tex.startsWith('<') && !esFilaFigura(tex);

/** Anima un element i espera que acabi. L'estat final es manté. */
function anima(el, fotogrames, opcions) {
    return el.animate(fotogrames, Object.assign({ fill: 'forwards', easing: CORBA }, opcions)).finished;
}

/** Atura les animacions d'un element, que torna als seus estils. */
const aturaAnimacions = el => el.getAnimations().forEach(a => a.cancel());

/** Rectangle d'un element respecte d'un altre: {x, y, w, h, cx, cy}. */
function rectangle(el, origen) {
    const o = origen.getBoundingClientRect(),
        r = el.getBoundingClientRect();
    const x = r.left - o.left,
        y = r.top - o.top;
    return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
}

/** Rectangle que conté uns quants rectangles. */
function unio(rs) {
    const x = Math.min(...rs.map(q => q.x)),
        y = Math.min(...rs.map(q => q.y));
    const w = Math.max(...rs.map(q => q.x + q.w)) - x,
        h = Math.max(...rs.map(q => q.y + q.h)) - y;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

/**
 * Contingut d'un símbol, sense l'espai que KaTeX hi afegeix a dins quan va seguit
 * d'un operador: serveix per saber si el símbol canvia.
 */
const signatura = el => el.className + '|' + el.innerHTML.replace(/<span class="mspace"[^>]*><\/span>/g, '');
const midaLletra = el => parseFloat(getComputedStyle(el).fontSize);

/**
 * Carrega KaTeX (vendor/) si la pàgina no l'ha carregat encara. Torna una Promise
 * que es resol quan katex.renderToString ja es pot fer servir.
 */
let carregantKatex = null;
export function carregaKatex() {
    if (typeof katex !== 'undefined') return Promise.resolve();
    if (carregantKatex) return carregantKatex;
    if (!document.querySelector(`link[href="${KATEX_CSS}"]`)) {
        document.head.append(element('link', { rel: 'stylesheet', href: KATEX_CSS }));
    }
    carregantKatex = new Promise((resol, rebutja) => {
        const s = element('script', { src: KATEX_JS });
        s.addEventListener('load', () => resol());
        s.addEventListener('error', () => {
            carregantKatex = null;
            rebutja(new Error("No s'ha pogut carregar KaTeX"));
        });
        document.head.append(s);
    });
    return carregantKatex;
}

// ── 3. CURSOR ────────────────────────────────────────────────────────────────

/** El cursor que clica i arrossega els símbols. Les posicions són les de la punta. */
function creaCursor(escenari, el, temps) {
    let x = null,
        y = null; // null: amagat
    const transforma = (escala = 1) => `translate(${x}px, ${y}px) scale(${escala})`;

    /** Apareix per sota de la cantonada inferior dreta de l'escenari. */
    function apareix() {
        x = escenari.clientWidth - 30;
        y = escenari.clientHeight + 10;
        el.style.transform = transforma();
        el.classList.add('visible');
    }

    return {
        /** Va fins a (nx, ny), amb el botó premut si escala < 1. */
        async va(nx, ny, ms = temps(TEMPS.cursor), escala = 1) {
            if (x === null) apareix();
            const sortida = transforma(escala);
            x = nx;
            y = ny;
            await anima(el, [{ transform: sortida }, { transform: transforma(escala) }], { duration: ms });
            el.style.transform = transforma(escala);
            aturaAnimacions(el);
        },
        /** Prem el botó, o el deixa anar. */
        prem(premut) {
            const [de, a] = premut ? [1, 0.86] : [0.86, 1];
            el.animate([{ transform: transforma(de) }, { transform: transforma(a) }], {
                duration: temps(TEMPS.clic),
                fill: 'forwards',
            });
        },
        /** Ona d'un clic al punt (px, py). */
        ona(px, py) {
            const o = element('div', { class: 'pis-ona' });
            o.style.left = px + 'px';
            o.style.top = py + 'px';
            escenari.append(o);
            o.animate(
                [
                    { transform: 'scale(.3)', opacity: 0.9 },
                    { transform: 'scale(1.5)', opacity: 0 },
                ],
                { duration: temps(420), easing: 'ease-out' }
            ).finished.then(() => o.remove());
        },
        amaga() {
            x = y = null;
            el.classList.remove('visible');
            aturaAnimacions(el);
        },
    };
}

// ── 4. PISSARRA I TRANSICIONS ────────────────────────────────────────────────

/**
 * Posa una pissarra de «files» files dins del contenidor i en torna el controlador
 * (vegeu la capçalera). opcions: { files, etiqueta } (etiqueta: nom per als lectors
 * de pantalla).
 */
export function creaPissarra(contenidor, { files: nFiles, etiqueta = 'Resolució pas a pas', marc = true } = {}) {
    if (!Number.isInteger(nFiles) || nFiles < 1) throw new Error('creaPissarra: cal dir quantes files té');
    const r = {
        pissarra: element('div', { class: 'pis-pissarra' }),
        efectes: element('div', { 'class': 'pis-efectes', 'aria-hidden': 'true' }),
        cursor: element('div', { 'class': 'pis-cursor', 'aria-hidden': 'true', 'html': CURSOR }),
    };
    const classe = 'pis-escenari' + (marc ? '' : ' pis-sense-marc');
    r.escenari = element('div', { 'class': classe, 'role': 'group', 'aria-label': etiqueta }, [
        r.pissarra,
        r.efectes,
        r.cursor,
    ]);
    contenidor.append(r.escenari);

    let velocitat = 1;
    const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const temps = ms => Math.max(60, (ms / velocitat) * (reduit ? 0.35 : 1));
    const cursor = creaCursor(r.escenari, r.cursor, temps);

    let capa = null; // capa visible: les files del pas actual
    let usades = null; // les files que fa servir algun pas del guió (les altres no ocupen lloc)
    let renders = new Map(); // TeX → HTML de KaTeX: cada fila es renderitza un sol cop per guió
    const renderitza = tex => {
        if (!renders.has(tex)) renders.set(tex, katex.renderToString(tex, OPCIONS_PISSARRA));
        return renders.get(tex);
    };

    function dibuixaCapa(pas) {
        const c = element('div', { class: 'pis-capa' });
        for (let i = 0; i < nFiles; i++) {
            const tex = pas.files[i];
            const figura = tex && esFilaFigura(tex),
                html = tex && esFilaHtml(tex);
            const fila = element('div', {
                class:
                    'pis-fila' +
                    (tex && esFilaText(tex) ? ' text' : '') +
                    (figura ? ' figura' : '') +
                    (html ? ' html' : '') +
                    (pas.classes[i] ? ' ' + pas.classes[i] : ''),
            });
            if (usades && !usades.has(i)) fila.hidden = true;
            if (tex)
                fila.innerHTML = figura || html ? tex : esFilaText(tex) ? textAmbFrases(tex.slice(1)) : renderitza(tex);
            c.append(fila);
        }
        return c;
    }

    /**
     * Si la pissarra té barra de desplaçament, la mou perquè es vegi l'última fila que
     * canvia d'una capa a l'altra (sense moure-la si ja es veu). Es fa abans de mesurar res.
     */
    let ultimaVisible = -1;
    function fesVisible(vella, nova) {
        const e = r.escenari;
        if (e.scrollHeight <= e.clientHeight + 1) return;
        const files = [...nova.children];
        let ultima = -1;
        const diferent = (v, f) =>
            !v || v.innerHTML !== f.innerHTML || v.className !== f.className.replace(/\s*\bpis-nova\b/, '');
        files.forEach((f, i) => {
            if (!f.hidden && f.innerHTML && (!vella || diferent(vella.children[i], f))) ultima = i;
        });
        if (ultima < 0) ultima = ultimaVisible; // el mateix pas, redibuixat: la mateixa fila
        if (ultima < 0 || !files[ultima]) return;
        ultimaVisible = ultima;
        const o = e.getBoundingClientRect(),
            q = files[ultima].getBoundingClientRect();
        const dalt = q.top - o.top + e.scrollTop,
            baix = q.bottom - o.top + e.scrollTop;
        if (baix > e.scrollTop + e.clientHeight) e.scrollTop = Math.min(dalt, baix - e.clientHeight + 12);
        else if (dalt < e.scrollTop) e.scrollTop = Math.max(0, dalt - 12);
    }

    function mostra(pas) {
        r.efectes.replaceChildren();
        const vella = capa;
        capa = dibuixaCapa(pas);
        r.pissarra.replaceChildren(capa);
        fesVisible(vella, capa);
    }

    /**
     * Tria la mida de la lletra (la fila més ampla de tots els passos hi ha de cabre)
     * i quines files fa servir el guió (les altres no ocupen lloc). Si cap pas no té
     * fórmules (només text o HTML), la pissarra fa servir la lletra de la pàgina.
     */
    function ajusta(passos) {
        renders = new Map();
        usades = new Set();
        for (const pas of passos)
            pas.files.forEach((tex, i) => {
                if (tex) usades.add(i);
            });
        const petita = typeof matchMedia === 'function' && matchMedia(MIDA.pantallaPetita).matches;
        const base = petita ? MIDA.petita : MIDA.gran;
        const posaMida = px => r.pissarra.style.setProperty('--pis-mida', px + 'px');
        posaMida(base);
        const prova = element('div', { class: 'pis-fila pis-prova' });
        r.pissarra.append(prova);
        let maxim = 0;
        for (const pas of passos) {
            for (const tex of pas.files) {
                if (!tex || esFilaText(tex) || esFilaFigura(tex) || esFilaHtml(tex)) continue; // s'ajusten sols
                prova.innerHTML = renderitza(tex);
                maxim = Math.max(maxim, prova.firstElementChild.getBoundingClientRect().width);
            }
        }
        prova.remove();
        r.pissarra.classList.toggle('pis-sense-tex', maxim === 0);
        if (maxim === 0) return;
        const estil = getComputedStyle(r.pissarra);
        const disponible = r.pissarra.clientWidth - parseFloat(estil.paddingLeft) - parseFloat(estil.paddingRight) - 12;
        const factor = maxim > 0 && disponible > 0 ? Math.min(1, disponible / maxim) : 1;
        posaMida(Math.max(MIDA.minima, Math.floor(base * factor)));
    }

    /* Símbols amb clau d'una capa, i les seves posicions. */
    const ambClau = c => new Map([...c.querySelectorAll('[data-k]')].map(e => [e.dataset.k, e]));
    const posicions = m => new Map([...m].map(([k, e]) => [k, rectangle(e, r.efectes)]));

    /**
     * Trossos d'un símbol, un per línia: una frase d'una fila de text pot ocupar més
     * d'una línia. Un símbol partit no es pot moure com un fantasma d'una sola línia:
     * es queda a la seva capa i s'hi fon, i els requadres i el cursor van als seus trossos.
     */
    function trossos(el) {
        const o = r.efectes.getBoundingClientRect();
        return [...el.getClientRects()]
            .filter(q => q.width > 0.5 && q.height > 0.5)
            .map(q => {
                const x = q.left - o.left,
                    y = q.top - o.top;
                return { x, y, w: q.width, h: q.height, cx: x + q.width / 2, cy: y + q.height / 2 };
            });
    }

    /** Còpia d'un símbol, posada exactament damunt del rectangle «q». */
    function fantasma(el, q) {
        const estil = getComputedStyle(el);
        const f = element('div', { 'class': 'katex pis-fantasma', 'data-de': el.dataset.k });
        f.style.fontSize = estil.fontSize;
        f.style.color = estil.color;
        f.style.fontFamily = estil.fontFamily; // una frase de text no ha de canviar de lletra
        f.style.fontStyle = estil.fontStyle;
        f.style.fontWeight = estil.fontWeight; // l'HTML d'una activitat pot ser en negreta
        f.style.letterSpacing = estil.letterSpacing;
        const copia = el.cloneNode(true);
        copia.removeAttribute('data-k');
        // KaTeX pot posar a l'element mateix una classe de mida relativa al pare: fora del
        // seu lloc es tornaria a aplicar i el fantasma sortiria massa gran.
        copia.style.fontSize = estil.fontSize;
        copia.querySelectorAll('[data-k]').forEach(n => n.removeAttribute('data-k'));
        f.append(copia);
        r.efectes.append(f);
        const o = rectangle(copia, r.efectes);
        f.style.left = q.x - o.x + 'px';
        f.style.top = q.y - o.y + 'px';
        f.style.transformOrigin = `${o.x + o.w / 2}px ${o.y + o.h / 2}px`;
        return { el: f, mida: parseFloat(estil.fontSize), color: estil.color };
    }

    /** Requadre blau clar que envolta un rectangle, i apareix en «durada» ms. */
    const VORA = 4;
    const caixa = q => ({
        left: q.x - VORA + 'px',
        top: q.y - VORA + 'px',
        width: q.w + 2 * VORA + 'px',
        height: q.h + 2 * VORA + 'px',
    });
    function requadre(q, durada) {
        const e = element('div', { class: 'pis-requadre' });
        Object.assign(e.style, caixa(q));
        r.efectes.append(e);
        e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: durada, fill: 'forwards' });
        return e;
    }

    const QUIET = 'translate(0px, 0px) scale(1)';
    const trasllat = (a, b, escala) => `translate(${b.cx - a.cx}px, ${b.cy - a.cy}px) scale(${escala})`;

    async function transicio(pas) {
        const vella = capa;
        const nova = dibuixaCapa(pas);
        nova.classList.add('pis-nova');
        r.pissarra.append(nova);
        // Si el pas nou és més alt (p. ex. una línia més a la taula), la pissarra creix
        // abans de mesurar res: així no surt cap barra de desplaçament durant l'animació.
        // (la capa nova ocupa tota la pissarra, marge interior inclòs; vegeu .pis-capa.pis-nova)
        if (nova.offsetHeight > r.pissarra.offsetHeight) {
            const cs = getComputedStyle(r.pissarra);
            const marge = cs.boxSizing === 'border-box' ? 0 : parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
            r.pissarra.style.minHeight = nova.offsetHeight - marge + 'px';
        }
        fesVisible(vella, nova);

        const A = ambClau(vella),
            B = ambClau(nova);
        const RA = posicions(A),
            RB = posicions(B);
        const reanomena = new Map(Object.entries(pas.reanomena || {}));
        const fusiona = new Map(Object.entries(pas.fusiona || {}));

        /* Parelles: cada símbol nou amb el símbol vell que és el mateix. */
        const parelles = new Map(); // clau nova → clau vella
        const aparellades = new Set();
        for (const kb of B.keys()) {
            const ka = reanomena.get(kb) || kb;
            if (A.has(ka) && !aparellades.has(ka)) {
                parelles.set(kb, ka);
                aparellades.add(ka);
            }
        }
        const desti = new Map(); // clau vella → clau nova on es fusiona
        for (const [kb, kas] of fusiona) for (const ka of kas) desti.set(ka, kb);
        const velles = [...A.keys()].filter(ka => !aparellades.has(ka));
        const noves = [...B.keys()].filter(kb => !parelles.has(kb));
        const igual = (ka, kb) => signatura(A.get(ka)) === signatura(B.get(kb));
        const canvia = (ka, kb) => !igual(ka, kb) || Math.abs(midaLletra(A.get(ka)) - midaLletra(B.get(kb))) > 0.5;

        /* Símbols partits en més d'una línia (vegeu trossos): sense fantasma, es fonen amb la seva capa. */
        const TA = new Map([...A].map(([k, e]) => [k, trossos(e)]));
        const TB = new Map([...B].map(([k, e]) => [k, trossos(e)]));
        const partitA = ka => TA.get(ka).length > 1,
            partitB = kb => TB.get(kb).length > 1;
        const quiets = new Set(); // claus noves de parelles partides
        for (const [kb, ka] of parelles) {
            if (!partitA(ka) && !partitB(kb)) continue;
            quiets.add(kb);
            A.get(ka).classList.add('pis-sense-fantasma');
            B.get(kb).classList.add('pis-sense-fantasma');
        }
        for (const [k, e] of A) if (!aparellades.has(k) && partitA(k)) e.classList.add('pis-sense-fantasma');
        for (const [k, e] of B) if (!parelles.has(k) && partitB(k)) e.classList.add('pis-sense-fantasma');
        /** On s'apunta un símbol: si està partit, el primer tros. */
        const lloc = (R, T, k) => (T.has(k) && T.get(k).length > 1 ? T.get(k)[0] : R.get(k));

        /* 1. El cursor clica un símbol, o n'agafa un per arrossegar-lo. */
        const c = pas.cursor || {};
        let arrossegat = null; // {r0, r1, el}: d'on surt, on va i el seu requadre
        if (c.arrossega && RA.has(c.arrossega)) {
            const r0 = lloc(RA, TA, c.arrossega);
            const parella = [...parelles].find(([, ka]) => ka === c.arrossega);
            const r1 =
                lloc(RB, TB, c.fins) ||
                (parella && lloc(RB, TB, parella[0])) ||
                lloc(RB, TB, desti.get(c.arrossega)) ||
                r0;
            await cursor.va(r0.cx, r0.cy + r0.h * 0.15);
            arrossegat = { r0, r1, el: requadre(r0, temps(TEMPS.agafa)) };
            cursor.prem(true);
            await espera(temps(TEMPS.agafa));
        } else if (c.clic && RA.has(c.clic)) {
            const q = lloc(RA, TA, c.clic);
            await cursor.va(q.cx, q.cy + q.h * 0.15);
            cursor.prem(true);
            cursor.ona(q.cx, q.cy);
            await espera(temps(TEMPS.clic));
            cursor.prem(false);
            await cursor.va(q.x + q.w + 10, q.y + q.h + 8, temps(TEMPS.aparta));
        }

        /* 2. Avisos: si no s'arrossega res, requadres sobre el que canviarà o desapareixerà. */
        const avisos = []; // {r0, r1, el}; r1 = null si el símbol desapareix
        if (!arrossegat) {
            for (const [kb, ka] of parelles) {
                if (!canvia(ka, kb)) continue;
                if (!quiets.has(kb)) {
                    avisos.push({ r0: RA.get(ka), r1: RB.get(kb) });
                    continue;
                }
                // Partit: un requadre per tros, que segueix el tros corresponent si n'hi ha tants com abans.
                const [ta, tb] = [TA.get(ka), TB.get(kb)];
                ta.forEach((q, j) => avisos.push({ r0: q, r1: ta.length === tb.length ? tb[j] : null }));
            }
            const grups = new Map(); // els símbols que es fusionen en un, en un sol requadre
            for (const ka of velles) {
                const kb = desti.get(ka);
                if (RB.has(kb)) grups.set(kb, (grups.get(kb) || []).concat([RA.get(ka)]));
                else if (partitA(ka)) for (const q of TA.get(ka)) avisos.push({ r0: q, r1: null });
                else avisos.push({ r0: RA.get(ka), r1: null });
            }
            for (const [kb, rs] of grups) avisos.push({ r0: unio(rs), r1: RB.get(kb) });
            for (const a of avisos) a.el = requadre(a.r0, temps(TEMPS.avis));
            if (avisos.length) await espera(temps(TEMPS.avis + TEMPS.lectura));
        }

        /* 3. El moviment. La capa nova apareix sense els símbols amb clau, que fan de fantasmes. */
        const D = temps(avisos.length ? TEMPS.pasAmbAvis : TEMPS.pas);
        const feines = [];
        vella.classList.add('pis-amaga-claus');
        nova.classList.add('pis-amaga-claus');
        nova.style.visibility = 'visible';
        feines.push(anima(vella, [{ opacity: 1 }, { opacity: 0 }], { duration: D * 0.6 }));
        feines.push(anima(nova, [{ opacity: 0 }, { opacity: 1 }], { duration: D * 0.6, delay: D * 0.4 }));

        // Els requadres d'avís segueixen el seu símbol, o s'esvaeixen amb ell.
        for (const a of avisos) {
            feines.push(
                anima(
                    a.el,
                    a.r1
                        ? [
                              Object.assign({ opacity: 1 }, caixa(a.r0)),
                              Object.assign({ offset: 0.75, opacity: 1 }, caixa(a.r1)),
                              Object.assign({ opacity: 0 }, caixa(a.r1)),
                          ]
                        : [{ opacity: 1 }, { opacity: 0 }],
                    { duration: a.r1 ? D : D * 0.5 }
                )
            );
        }

        // Els símbols que continuen es desplacen; si canvien, el vell es fon en el nou.
        for (const [kb, ka] of parelles) {
            if (quiets.has(kb)) continue;
            const a = RA.get(ka),
                b = RB.get(kb),
                elB = B.get(kb);
            const vell = fantasma(A.get(ka), a);
            const escala = midaLletra(elB) / vell.mida;
            if (igual(ka, kb)) {
                feines.push(
                    anima(
                        vell.el,
                        [
                            { transform: QUIET, color: vell.color },
                            { transform: trasllat(a, b, escala), color: getComputedStyle(elB).color },
                        ],
                        { duration: D }
                    )
                );
            } else {
                const nou = fantasma(elB, b);
                feines.push(
                    anima(vell.el, [{ transform: QUIET }, { transform: trasllat(a, b, escala) }], { duration: D })
                );
                feines.push(
                    anima(vell.el, [{ opacity: 1 }, { offset: 0.5, opacity: 0 }, { opacity: 0 }], {
                        duration: D,
                        easing: 'ease-in-out',
                    })
                );
                // El nou fa el mateix camí que el vell i amb la mateixa corba (si no, mentre es
                // fonen es veuen dos símbols desplaçats).
                feines.push(
                    anima(nou.el, [{ transform: trasllat(b, a, vell.mida / nou.mida) }, { transform: QUIET }], {
                        duration: D,
                    })
                );
                feines.push(
                    anima(nou.el, [{ opacity: 0 }, { offset: 0.38, opacity: 0 }, { opacity: 1 }], {
                        duration: D,
                        easing: 'ease-in-out',
                    })
                );
            }
        }

        // Els símbols que desapareixen van a parar a la seva fusió, o s'esvaeixen.
        for (const ka of velles) {
            if (partitA(ka)) continue;
            const a = RA.get(ka),
                vell = fantasma(A.get(ka), a),
                t = RB.get(desti.get(ka));
            feines.push(
                anima(
                    vell.el,
                    t
                        ? [
                              { transform: QUIET, opacity: 1 },
                              { offset: 0.7, opacity: 0.85 },
                              { transform: trasllat(a, t, 0.55), opacity: 0 },
                          ]
                        : [
                              { transform: QUIET, opacity: 1 },
                              { transform: 'translate(0px, -6px) scale(.8)', opacity: 0 },
                          ],
                    { duration: t ? D * 0.8 : D * 0.55 }
                )
            );
        }

        // Els símbols nous apareixen; el resultat d'una fusió, amb una empenta.
        for (const kb of noves) {
            if (partitB(kb)) continue;
            const nou = fantasma(B.get(kb), RB.get(kb)),
                esFusio = fusiona.has(kb);
            feines.push(
                anima(
                    nou.el,
                    esFusio
                        ? [
                              { transform: 'scale(.4)', opacity: 0 },
                              { offset: 0.55, transform: 'scale(.4)', opacity: 0 },
                              { offset: 0.82, transform: 'scale(1.18)', opacity: 1 },
                              { transform: 'scale(1)', opacity: 1 },
                          ]
                        : [
                              { transform: 'translate(0px, 6px)', opacity: 0 },
                              { offset: 0.4, transform: 'translate(0px, 6px)', opacity: 0 },
                              { transform: 'translate(0px, 0px)', opacity: 1 },
                          ],
                    { duration: D, easing: esFusio ? 'ease-out' : CORBA }
                )
            );
        }

        // El cursor arrossega el símbol, i el requadre l'acompanya.
        if (arrossegat) {
            const { r0, r1, el } = arrossegat;
            feines.push(anima(el, [caixa(r0), caixa(r1)], { duration: D }));
            feines.push(cursor.va(r1.cx, r1.cy + r1.h * 0.15, D, 0.86));
        }

        await Promise.all(feines);

        /* 4. Queda la capa nova, i el cursor deixa anar el símbol arrossegat. */
        vella.remove();
        nova.classList.remove('pis-nova', 'pis-amaga-claus');
        nova.querySelectorAll('.pis-sense-fantasma').forEach(e => e.classList.remove('pis-sense-fantasma'));
        nova.style.visibility = '';
        r.pissarra.style.minHeight = '';
        aturaAnimacions(nova);
        capa = nova;
        for (const e of [...r.efectes.children]) if (!arrossegat || e !== arrossegat.el) e.remove();
        if (arrossegat) {
            const { r1, el } = arrossegat;
            cursor.prem(false);
            await Promise.all([
                anima(el, [{ opacity: 1 }, { opacity: 0 }], { duration: temps(TEMPS.aparta) }),
                cursor.va(r1.x + r1.w + 10, r1.y + r1.h + 8, temps(TEMPS.aparta)),
            ]);
            el.remove();
        }
    }

    // ── El controlador ──
    let passos = [],
        idx = 0,
        ocupat = false;
    const escoltes = new Set(); // funcions que s'avisen quan canvia el pas (el reproductor)
    const avisa = () => escoltes.forEach(f => f(idx));

    function salta(i) {
        if (ocupat || !passos.length) return;
        idx = Math.max(0, Math.min(passos.length - 1, i));
        mostra(passos[idx]);
        cursor.amaga();
        avisa();
    }

    /** Anima l'arribada al pas «i» des del pas «de» (que es dibuixa abans sense animació). */
    async function animaFins(de, i) {
        if (ocupat || i < 1 || i >= passos.length) return;
        ocupat = true;
        if (de !== idx) mostra(passos[de]);
        idx = i;
        avisa();
        try {
            await transicio(passos[idx]);
        } finally {
            ocupat = false;
        }
        if (idx === passos.length - 1) cursor.amaga();
        avisa();
    }

    /* Si canvia l'amplada, o quan acaben de carregar les lletres, es torna a ajustar la mida. */
    let rellotgeMida = null;
    function reajusta() {
        clearTimeout(rellotgeMida);
        rellotgeMida = setTimeout(function intenta() {
            if (!passos.length || !r.escenari.isConnected) return;
            if (ocupat) {
                rellotgeMida = setTimeout(intenta, 200);
                return;
            }
            ajusta(passos);
            mostra(passos[idx]);
            cursor.amaga();
        }, 200);
    }
    let amplada = typeof innerWidth === 'number' ? innerWidth : 0;
    // Una activitat crea una sola pissarra i hi carrega els passos de cada exercici; si la treu de
    // la pàgina, la pissarra deixa d'escoltar els canvis de mida.
    function enCanviarMida() {
        if (!r.escenari.isConnected) {
            removeEventListener('resize', enCanviarMida);
            return;
        }
        if (innerWidth === amplada) return; // al mòbil, la barra d'adreces només canvia l'alçada
        amplada = innerWidth;
        reajusta();
    }
    addEventListener('resize', enCanviarMida);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reajusta);

    /** Pas a pas lliure: mostra un pas sense animació (torna false si hi ha una animació en marxa). */
    function mostraPas(pas) {
        if (ocupat) return false;
        passos = [pas];
        idx = 0;
        ajusta(passos);
        mostra(pas);
        cursor.amaga();
        avisa();
        return true;
    }

    /**
     * Pas a pas lliure: anima el canvi del pas que es veu al pas «pas» (amb les seves
     * claus, fusiona, reanomena i cursor). Si encara no es veu cap pas, el mostra.
     * Torna una Promise que acaba quan acaba l'animació (false si n'hi havia una en marxa).
     */
    async function animaPas(pas) {
        if (ocupat) return false;
        if (!capa || !passos.length) return mostraPas(pas);
        const actual = passos[idx];
        ocupat = true;
        try {
            ajusta([actual, pas]);
            mostra(actual); // amb la mida de lletra que serveix per als dos passos
            passos = [actual, pas];
            idx = 1;
            avisa();
            await transicio(pas);
        } finally {
            ocupat = false;
        }
        avisa();
        return true;
    }

    return Object.freeze({
        mostraPas,
        animaPas,
        /** Passos nous: torna al primer. No es pot cridar durant una animació. */
        carrega(nous) {
            if (ocupat) return false;
            passos = nous;
            idx = 0;
            ajusta(passos);
            salta(0);
            return true;
        },
        seguent: () => animaFins(idx, idx + 1),
        salta,
        repeteix: () => animaFins(idx - 1, idx),
        reajusta,
        velocitat(v) {
            if (v > 0) velocitat = v;
        },
        /** Avisa «f(pas)» cada vegada que canvia el pas (al començament i al final de cada animació). */
        escolta(f) {
            escoltes.add(f);
            return () => escoltes.delete(f);
        },
        get pas() {
            return idx;
        },
        get total() {
            return passos.length;
        },
        get ocupat() {
            return ocupat;
        },
        get passos() {
            return passos;
        },
        element: r.escenari,
    });
}
