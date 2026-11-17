/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/joc-passos.js
 * ROL: El joc de passos, comú a les activitats que es resolen pas a pas escrivint
 *      en caselles (Equacions de 2n grau, Expressions algebraiques…). Cada
 *      activitat només diu quina pregunta toca i com es diagnostiquen els errors;
 *      aquí es pinta tot, es corregeix i es fa anar la sessió.
 *
 *   PREGUNTA (la torna config.generaPregunta)
 *     { tex, text, passos }   tex: la pregunta (KaTeX; buit si la pregunta és dins de la plantilla);
 *                             enunciat (opcional): el problema, en text, a sobre de la resolució;
 *                             svg (opcional): una figura (p. ex. una gràfica) a sobre de la resolució;
 *                             text: la mateixa, per a l'historial; clau (opcional): per no repetir-la
 *                             problema (opcional): { context, pregunta } — una targeta «Problema»: el
 *                             context (els trossos entre **…** en negreta) i la pregunta en una línia a part;
 *                             formula (opcional): { nom, tex, llegenda: [[tex, magnitud, unitat]] } — una
 *                             targeta «Fórmula» amb la llegenda en taula;
 *                             enllac (opcional): { href, text } — un enllaç sota les targetes (pestanya nova);
 *                             opcional (opcional): { desDe, pregunta, si, no, resum, inici } — els passos des
 *                             de desDe són opcionals: abans, l'alumne tria si els vol fer (si → les línies
 *                             fetes es pleguen en una franja amb el resum, que es pot desplegar, i s'escriu
 *                             la línia inici; no → la pregunta s'acaba amb els punts que porti); amb
 *                             punts: { maxAbans, despres }, els punts es reparteixen entre les dues parts
 *                             (js/punts.js puntsAmbPartOpcional); sense, la regla de sempre
 *
 *   PAS (dades, sense funcions; la correcció és a correccio.js)
 *     id, mena    id únic dins de la pregunta; mena: quin pas és (el diagnòstic en mira això)
 *     nom         nom curt del pas, per a l'historial
 *     enunciat    la consigna
 *     plantilla   trossos: { tex } · { svg } · { camp: nom, sup?: true (casella d'exponent),
 *                 periode?: true (decimal amb casella de període), llarg?: n (un decimal de més de
 *                 6 caràcters, p. ex. 0,000576) } · { frac: { num, den } } ·
 *                 { grup: [trossos], titol, literal? } (una columna amb el seu títol; literal: el títol
 *                 tal com és, sense majúscules ni lletra petita, p. ex. una dada amb la unitat)
 *                 Com es pinta un camp depèn del seu tipus: enter/coeficient/exponent, una
 *                 casella; racional, una fracció de caselles; decimal, la casella i la del
 *                 període; pintat, la figura de pas.figura per pintar-hi parts; fitxa, una
 *                 casella buida on es deixa una de les targetes de pas.fitxes.
 *     fitxes      [{ id, tex } | { id, svg }]: les targetes per arrossegar (o tocar i col·locar)
 *     figura      { parts, unitats }: la figura del camp 'pintat' (js/passos/figura-fraccio.js)
 *     svgResolt   (opcional) un SVG que s'afegeix a la resolució amb la línia (p. ex. la recta dibuixada)
 *                 Un camp 'punts' es pinta com una quadrícula on es toquen els punts; el tros
 *                 { camp, quadricula: { limit, previa } } en diu la mida. Amb dos punts es veu la
 *                 recta (o, amb previa: 'parabola', amb tres punts la paràbola que hi passa).
 *     camps, solucio, parell, proporcional   vegeu correccio.js
 *     opcions     [[valor, text, svg?, formules?], …] dels camps 'tria' (es pinten com a botons; amb
 *                 svg, el botó és el dibuix, amb el text a sota: p. ex. «Gràfica B»; amb formules, el
 *                 botó mostra aquest text amb les fórmules entre $…$ dibuixades amb KaTeX, i text queda
 *                 per a l'historial i per als lectors de pantalla). La primera lletra
 *                 del text es veu en majúscula, si el pas no porta literal: true (p. ex. les
 *                 lletres dels segments d'una figura, «b = 6 cm», o les unitats, «cm²»)
 *     formules    (opcional) true: la consigna porta fórmules entre $…$ (KaTeX)
 *     nota        text d'ajuda sota les caselles (opcional)
 *     dades       el que necessita el diagnòstic
 *     linia       TeX del pas resolt: queda escrit a la resolució
 *     liniaMarcada (opcional) la mateixa línia amb el que es mou en color: es veu així fins que un pas
 *                 posterior comença una altra operació (marcaAnterior) o no en porta (llavors, linia)
 *     marcaAnterior (opcional) TeX que substitueix l'última línia escrita en resoldre el pas (la mateixa
 *                 amb el que es mourà en color); abans es tornen a escriure normals les línies marcades
 *
 *   FUNCIONAMENT
 *     - Cada pas resolt s'afegeix a la resolució, sota la pregunta.
 *     - Retorn (o → del teclat numèric): a la casella buida següent o, si no n'hi ha, corregeix.
 *     - Una resposta equivocada resta un intent, marca les caselles dolentes i, si
 *       config.diagnostica la reconeix, n'explica el perquè. Els avisos (fracció sense
 *       simplificar, text que no és un enter…) no resten cap intent.
 *     - Pregunta resolta o intents esgotats (amb la resta de la resolució a la vista): la
 *       franja comuna «Molt bé! +N punts» / «Intents esgotats» amb el botó «Següent»
 *       (acabaPregunta() de game-core.js, js/seguent.js). Mai no es passa de pregunta sol.
 *       Punts: la regla única de js/punts.js (10 − 2 per error; 0 si s'esgoten).
 *
 * ÚS (des del controlador de l'activitat, un mòdul ES carregat per la pàgina):
 *   iniciaJocPassos({
 *     element: 'Equació',                          // capçalera: «Equació 2 de 5»
 *     generaPregunta: ({ nivell, index, total }) => pregunta,   // nivell 1-3
 *     teclat: { decimalComma: true },              // opcional: opcions del teclat numèric
 *     diagnostica: (pas, valors) => ({ missatge, etiqueta }) | null,
 *     enEncertar: (pregunta, pas, valors) => passos nous | null,  // opcional
 *     textResposta: (pas, valors) => text,         // opcional (historial)
 *     desplacament: true,   // opcional: després de cada encert, es veuen les dues últimes línies i el pas
 *     plegaAntigues: true,  // opcional: en pantalles baixes, amb més de 4 línies en una fase, les del mig
 *                           //   es pleguen (es veuen la primera i les dues últimes)
 *   });
 *   La pàgina ha de tenir la capçalera habitual (#session-display, #lvl-display,
 *   #score-display, #attempts-display) i un <div id="jp-joc"></div> dins de #game-screen.
 *
 * DEPENDÈNCIES: KaTeX (global). config.js, utils.js, game-core.js, correccio.js, textos.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { nivellProgressiu } from '../utils.js';
import {
    state,
    acabaPregunta,
    getKbActiveInput,
    hideCustomKeyboard,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbMarkForOverwrite,
    puntsDeLaPregunta,
    recordAnswerToHistory,
    recordResult,
    showCustomKeyboard,
    startGame,
    validateConfig,
} from '../game-core.js';
import { puntsAmbPartOpcional } from '../punts.js';
import { corregeixPas, esCampFraccio, textResposta } from './correccio.js';
import { svgFiguraFraccio } from './figura-fraccio.js';
import { parabolaPerTresPunts, svgQuadricula } from './quadricula.js';
import { TEXTOS_PASSOS } from './textos.js';

const MARCAT = `
    <div class="jp-resolucio" id="jp-resolucio" aria-live="polite"></div>
    <div class="jp-pas" id="jp-pas">
        <div class="jp-comptador" id="jp-comptador"></div>
        <div class="jp-enunciat" id="jp-enunciat"></div>
        <div class="jp-plantilla" id="jp-plantilla"></div>
        <div class="jp-fitxes" id="jp-fitxes" hidden></div>
        <div class="jp-opcions" id="jp-opcions" hidden></div>
        <div class="jp-nota" id="jp-nota" hidden></div>
        <div class="jp-diag" id="jp-diag" role="status" hidden></div>
        <button type="button" class="btn-submit" id="jp-ok"></button>
    </div>`;

export function iniciaJocPassos(config) {
    const { ui, avisos } = TEXTOS_PASSOS;
    const textDeResposta = config.textResposta || textResposta;
    document.getElementById('jp-joc').innerHTML = MARCAT;
    const $ = id => document.getElementById(id);
    const els = {
        gameScreen: $('game-screen'),
        sessionDisplay: $('session-display'),
        lvlDisplay: $('lvl-display'),
        scoreDisplay: $('score-display'),
        attemptsDisplay: $('attempts-display'),
        resolucio: $('jp-resolucio'),
        pas: $('jp-pas'),
        comptador: $('jp-comptador'),
        enunciat: $('jp-enunciat'),
        plantilla: $('jp-plantilla'),
        fitxes: $('jp-fitxes'),
        opcions: $('jp-opcions'),
        nota: $('jp-nota'),
        diag: $('jp-diag'),
        ok: $('jp-ok'),
    };

    let pregunta = null;
    let passos = [];
    let index = 0;
    let triada = null; // l'opció clicada en un pas d'escollir
    let penalitzant = false;
    let darrera = ''; // la pregunta anterior, per no repetir-la tot seguit
    let fitxaTriada = null; // la targeta tocada, a punt de col·locar
    let zona = null; // on s'escriuen les línies (la fase que es fa ara)
    let marcades = []; // les línies escrites amb color: [{ div, tex }] (tex: com han de quedar)
    let triantOpcional = false; // l'alumne tria si fa els passos opcionals
    let ambOpcionals = false; // ha triat fer-los
    let errorsAbans = 0; // els errors abans dels passos opcionals (els punts de pregunta.opcional.punts)

    // ---- BUILD LEVEL (cridat per game-core; les sessions fixes el sembren) ----
    function buildLevel() {
        state.attemptsLeft = MAX_INTENTS;
        state.isTransitioning = false;
        penalitzant = false;

        const opcions = {
            nivell: nivellProgressiu(state.currentDifficulty || 0, state.currentOperation, TOTAL_OPERATIONS),
            index: state.currentOperation,
            total: TOTAL_OPERATIONS,
        };
        for (let i = 0; i < 5; i++) {
            pregunta = config.generaPregunta(opcions);
            if ((pregunta.clau || pregunta.tex) !== darrera) break;
        }
        darrera = pregunta.clau || pregunta.tex;
        passos = pregunta.passos;
        index = 0;

        els.resolucio.innerHTML = '';
        marcades = [];
        triantOpcional = false;
        ambOpcionals = false;
        zona = els.resolucio;
        if (pregunta.problema) afegeixProblema(pregunta.problema);
        if (pregunta.formula) afegeixFormula(pregunta.formula);
        if (pregunta.enllac) afegeixEnllac(pregunta.enllac);
        if (pregunta.opcional || config.plegaAntigues) novaFase();
        if (pregunta.enunciat) {
            const problema = document.createElement('p');
            problema.className = 'jp-problema';
            problema.textContent = pregunta.enunciat;
            els.resolucio.appendChild(problema);
        }
        if (pregunta.svg) afegeixSvg(pregunta.svg, 'jp-figura-pregunta');
        if (pregunta.tex) afegeixLinia(pregunta.tex, 'jp-original');
        actualitzaCapcalera();
        mostraPas();
    }

    function actualitzaCapcalera() {
        els.sessionDisplay.innerText = `${ui.sessio} ${state.currentSession + 1} ${ui.de} ${TOTAL_SESSIONS}`;
        els.lvlDisplay.innerText = `${config.element} ${state.currentOperation + 1} ${ui.de} ${TOTAL_OPERATIONS}`;
        els.scoreDisplay.innerText = `${ui.punts}: ${state.sessionScore}`;
        els.attemptsDisplay.innerText = `${ui.intents}: ${state.attemptsLeft}`;
        els.attemptsDisplay.classList.toggle('danger', state.attemptsLeft <= 1);
    }

    // ---- PINTAR ----
    /** Un text amb fórmules entre $…$: el text tal qual i les fórmules amb KaTeX. */
    function pintaAmbFormules(el, text) {
        el.textContent = '';
        String(text)
            .split('$')
            .forEach((tros, i) => {
                if (!tros) return;
                if (i % 2 === 0) el.appendChild(document.createTextNode(tros));
                else {
                    const span = document.createElement('span');
                    span.className = 'jp-formula';
                    katex.render(tros, span, { throwOnError: false });
                    el.appendChild(span);
                }
            });
    }

    function targeta(classe, etiqueta) {
        const div = document.createElement('div');
        div.className = `jp-targeta ${classe}`;
        const etq = document.createElement('div');
        etq.className = 'jp-targeta-etq';
        etq.textContent = etiqueta;
        div.appendChild(etq);
        els.resolucio.appendChild(div);
        return div;
    }

    /** Un paràgraf amb els trossos entre **…** en negreta. */
    function paragraf(text, classe = '') {
        const p = document.createElement('p');
        if (classe) p.className = classe;
        String(text)
            .split('**')
            .forEach((tros, i) => {
                if (!tros) return;
                if (i % 2 === 0) p.appendChild(document.createTextNode(tros));
                else {
                    const b = document.createElement('b');
                    b.textContent = tros;
                    p.appendChild(b);
                }
            });
        return p;
    }

    /** La targeta «Problema»: el context i la pregunta en una línia a part (les dades, en negreta). */
    function afegeixProblema({ context, pregunta: preg }) {
        const div = targeta('jp-targeta-problema', ui.problema);
        if (context) div.appendChild(paragraf(context));
        div.appendChild(paragraf(preg, 'jp-targeta-pregunta'));
    }

    /** La targeta «Fórmula»: el nom, la fórmula i la llegenda (lletra · magnitud · unitat). */
    function afegeixFormula({ nom, tex, llegenda }) {
        const div = targeta('jp-targeta-formula', nom ? `${ui.formula} · ${nom}` : ui.formula);
        const cos = document.createElement('div');
        cos.className = 'jp-formula-cos';
        const f = document.createElement('div');
        f.className = 'jp-formula-tex';
        katex.render(tex, f, { throwOnError: false });
        cos.appendChild(f);
        if (llegenda && llegenda.length) {
            const taula = document.createElement('table');
            taula.className = 'jp-llegenda';
            for (const [lletra, magnitud, unitat] of llegenda) {
                const tr = document.createElement('tr');
                const td = [0, 1, 2].map(() => document.createElement('td'));
                katex.render(lletra, td[0], { throwOnError: false });
                td[1].textContent = magnitud;
                td[2].textContent = unitat || '—';
                tr.append(...td);
                taula.appendChild(tr);
            }
            cos.appendChild(taula);
        }
        div.appendChild(cos);
    }

    function afegeixEnllac({ href, text }) {
        const a = document.createElement('a');
        a.className = 'jp-enllac';
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = text;
        els.resolucio.appendChild(a);
    }

    /** Una fase nova de la resolució: les línies que s'escriuen a partir d'ara hi van. */
    function novaFase() {
        zona = document.createElement('div');
        zona.className = 'jp-fase';
        els.resolucio.appendChild(zona);
    }

    /** Una franja plegada (es pot desplegar): resum (TeX) i, a dins, els elements. */
    function plega(elements, resumTex, textBoto) {
        const caixa = document.createElement('div');
        caixa.className = 'jp-plegat';
        const boto = document.createElement('button');
        boto.type = 'button';
        boto.className = 'jp-plega';
        boto.setAttribute('aria-expanded', 'false');
        const fletxa = document.createElement('span');
        fletxa.className = 'jp-plega-fletxa';
        fletxa.setAttribute('aria-hidden', 'true');
        const resum = document.createElement('span');
        resum.className = 'jp-plega-resum';
        if (resumTex) katex.render(resumTex, resum, { throwOnError: false });
        const accio = document.createElement('span');
        accio.className = 'jp-plega-accio';
        boto.append(fletxa, resum, accio);
        const cos = document.createElement('div');
        cos.className = 'jp-plegat-cos';
        cos.hidden = true;
        cos.append(...elements);
        const posa = obert => {
            cos.hidden = !obert;
            boto.setAttribute('aria-expanded', String(obert));
            accio.textContent = obert ? ui.amaga : textBoto(cos.querySelectorAll('.jp-linia').length);
        };
        boto.addEventListener('click', () => posa(cos.hidden));
        posa(false);
        caixa.append(boto, cos);
        caixa.afegeix = els2 => {
            cos.append(...els2);
            posa(!cos.hidden);
        };
        return caixa;
    }

    /**
     * En pantalles baixes, si la fase té més de 4 línies, les del mig es pleguen: es veuen la primera (la
     * fórmula de la fase) i les dues últimes.
     */
    function plegaAntigues() {
        if (!config.plegaAntigues || !zona || zona === els.resolucio) return;
        if (!(window.matchMedia && window.matchMedia('(max-height: 860px)').matches)) return;
        const linies = Array.from(zona.children).filter(el => el.classList.contains('jp-linia'));
        if (linies.length <= 4 && !zona.querySelector(':scope > .jp-plegat')) return;
        const mig = linies.slice(1, -2);
        if (!mig.length) return;
        let franja = zona.querySelector(':scope > .jp-plegat');
        if (franja) franja.afegeix(mig);
        else {
            franja = plega(mig, '', n => ui.liniesMes(n));
            zona.insertBefore(franja, linies[linies.length - 2]);
        }
    }

    /** Després d'un encert: que es vegin les dues últimes línies i el pas (si hi caben). */
    function mostraUltimes() {
        const linies = (zona || els.resolucio).querySelectorAll(':scope > .jp-linia');
        const des = linies[Math.max(0, linies.length - 2)];
        const suau = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        const comportament = suau ? 'smooth' : 'auto';
        if (des) {
            const dalt = des.getBoundingClientRect().top;
            const baix = els.pas.getBoundingClientRect().bottom;
            if (baix - dalt <= window.innerHeight - 16) {
                window.scrollBy({ top: dalt - 8, behavior: comportament });
                return;
            }
        }
        els.pas.scrollIntoView({ block: 'end', behavior: comportament });
    }

    function afegeixSvg(svg, classe = '') {
        const div = document.createElement('div');
        div.className = `jp-linia jp-linia-svg ${classe}`.trim();
        div.innerHTML = svg;
        (zona || els.resolucio).appendChild(div);
    }

    // net: com ha de quedar la línia quan es treguin els colors (desmarca)
    function afegeixLinia(tex, classe = '', net = tex) {
        const div = document.createElement('div');
        div.className = `jp-linia ${classe}`.trim();
        div.dataset.tex = net;
        katex.render(tex, div, { throwOnError: false });
        (zona || els.resolucio).appendChild(div);
        return div;
    }

    // llarg: quants caràcters hi caben (6 per defecte; una casella més llarga també és més ampla)
    function creaCasella(nom, part = '', sup = false, llarg = 6) {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = sup ? 'jp-camp jp-sup' : 'jp-camp';
        inp.autocomplete = 'off';
        inp.maxLength = llarg;
        if (llarg > 6) {
            inp.classList.add('jp-llarg');
            inp.style.setProperty('--jp-llarg', String(llarg));
        }
        inp.dataset.nom = nom;
        inp.dataset.part = part;
        inp.setAttribute(
            'aria-label',
            part === 'n' ? 'numerador' : part === 'd' ? 'denominador' : sup ? 'exponent' : 'nombre'
        );
        // Només enters: xifres i el signe menys (també si s'enganxa un «−» tipogràfic). A la part
        // «v» d'un decimal, xifres i coma; al període, només xifres.
        const permesos = part === 'v' ? /[^\d,]/g : part === 'p' ? /\D/g : /[^\d-]/g;
        inp.addEventListener('input', () => {
            inp.value = inp.value.replace(/[−–]/g, '-').replace('.', ',').replace(permesos, '');
            inp.classList.remove('jp-malament');
        });
        return inp;
    }

    function creaFraccio(dalt, baix) {
        const frac = document.createElement('span');
        frac.className = 'jp-frac';
        const num = document.createElement('span');
        num.className = 'jp-frac-num';
        const den = document.createElement('span');
        den.className = 'jp-frac-den';
        dalt(num);
        baix(den);
        frac.append(num, den);
        return frac;
    }

    function pintaTros(tros, pare, pas) {
        if (tros.grup) {
            const grup = document.createElement('div');
            grup.className = 'jp-grup';
            if (tros.titol) {
                const titol = document.createElement('div');
                // literal: el títol tal com és (p. ex. una dada amb la unitat: «10 m», no «10 M»)
                titol.className = tros.literal ? 'jp-grup-titol jp-grup-titol-literal' : 'jp-grup-titol';
                titol.textContent = tros.titol;
                grup.appendChild(titol);
            }
            const cos = document.createElement('div');
            cos.className = 'jp-grup-cos';
            tros.grup.forEach(t => pintaTros(t, cos, pas));
            grup.appendChild(cos);
            pare.appendChild(grup);
        } else if (tros.svg) {
            const span = document.createElement('span');
            span.className = 'jp-svg';
            span.innerHTML = tros.svg;
            pare.appendChild(span);
        } else if (tros.frac) {
            const pinta = trossos => lloc => trossos.forEach(t => pintaTros(t, lloc, pas));
            pare.appendChild(creaFraccio(pinta(tros.frac.num), pinta(tros.frac.den)));
        } else if (tros.camp) {
            pare.appendChild(creaCamp(tros, pas));
        } else if (tros.tex) {
            const span = document.createElement('span');
            span.className = 'jp-tex';
            katex.render(tros.tex, span, { throwOnError: false });
            pare.appendChild(span);
        }
    }

    // Un camp per respondre, segons el seu tipus (vegeu la capçalera)
    function creaCamp(tros, pas) {
        const nom = tros.camp;
        const tipus = pas.camps[nom];
        if (esCampFraccio(tipus)) {
            const frac = creaFraccio(
                lloc => lloc.appendChild(creaCasella(nom, 'n')),
                lloc => lloc.appendChild(creaCasella(nom, 'd'))
            );
            frac.classList.add('jp-racional');
            return frac;
        }
        if (tipus === 'decimal') {
            const dec = document.createElement('span');
            dec.className = 'jp-decimal';
            dec.appendChild(creaCasella(nom, 'v', false, tros.llarg || 6));
            if (tros.periode) {
                const periode = creaCasella(nom, 'p');
                periode.classList.add('jp-periode');
                periode.setAttribute('aria-label', 'període');
                dec.appendChild(periode);
            }
            return dec;
        }
        if (tipus === 'pintat') {
            const dibuix = document.createElement('div');
            dibuix.className = 'jp-dibuix';
            dibuix.dataset.nom = nom;
            dibuix.innerHTML = svgFiguraFraccio({ ...pas.figura, pintades: 0 });
            dibuix.querySelectorAll('.jp-part').forEach(part =>
                part.addEventListener('click', () => {
                    part.classList.toggle('jp-ple');
                    dibuix.classList.remove('jp-malament');
                })
            );
            return dibuix;
        }
        if (tipus === 'punts') return creaQuadricula(nom, tros.quadricula || {}, pas);
        if (tipus === 'fitxa') {
            const forat = document.createElement('div');
            forat.className = 'jp-forat';
            forat.dataset.nom = nom;
            forat.dataset.buit = TEXTOS_PASSOS.avisos.buit;
            forat.addEventListener('click', e => {
                if (e.target.closest('.jp-fitxa')) return;
                if (fitxaTriada) colloca(fitxaTriada, forat);
            });
            forat.addEventListener('dragover', e => e.preventDefault());
            forat.addEventListener('drop', e => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                const fitxa = els.pas.querySelector(`.jp-fitxa[data-id="${id}"]`);
                if (fitxa) colloca(fitxa, forat);
            });
            return forat;
        }
        return creaCasella(nom, '', !!tros.sup);
    }

    // ---- QUADRÍCULA (camps 'punts'): tocar-la hi posa (o en treu) el punt més proper ----
    function creaQuadricula(nom, opcions, pas) {
        const sol = pas.solucio[nom];
        const maxim = (sol.punts || []).length || sol.quants || 1;
        const q = document.createElement('div');
        q.className = 'jp-quadricula';
        q.dataset.nom = nom;
        q.dataset.punts = '[]';
        const pinta = () => {
            const punts = JSON.parse(q.dataset.punts);
            // Amb dos punts es veu la recta; amb previa: 'parabola', amb tres, la paràbola que hi passa
            const parabola = opcions.previa === 'parabola' && punts.length >= 3 ? parabolaPerTresPunts(punts) : null;
            const rectes =
                opcions.previa !== 'parabola' && punts.length === 2 ? [{ per: punts, classe: 'jp-q-previa' }] : [];
            const paraboles = parabola ? [{ ...parabola, classe: 'jp-q-previa' }] : [];
            q.innerHTML = svgQuadricula({
                ...opcions,
                punts: punts.map(([x, y]) => ({ x, y })),
                rectes,
                paraboles,
                interactiva: true,
            });
        };
        q.addEventListener('click', e => {
            const svg = q.querySelector('svg');
            const pt = svg.createSVGPoint();
            [pt.x, pt.y] = [e.clientX, e.clientY];
            const p = pt.matrixTransform(svg.getScreenCTM().inverse());
            const [L, u, M] = ['limit', 'u', 'marge'].map(k => Number(svg.dataset[k]));
            const [x, y] = [Math.round(p.x / u - L - M), Math.round(L + M - p.y / u)];
            if (Math.abs(x) > L || Math.abs(y) > L) return;
            let punts = JSON.parse(q.dataset.punts);
            const ja = punts.findIndex(([a, b]) => a === x && b === y);
            if (ja >= 0) punts.splice(ja, 1);
            else punts = [...punts, [x, y]].slice(-maxim);
            q.dataset.punts = JSON.stringify(punts);
            q.classList.remove('jp-malament');
            if (els.diag.classList.contains('jp-avis')) mostraDiagnostic('');
            pinta();
        });
        pinta();
        return q;
    }

    // ---- TARGETES (camps 'fitxa'): arrossegar-les, o tocar-ne una i després la casella ----
    function creaFitxa(fitxa) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'jp-fitxa';
        btn.dataset.id = fitxa.id;
        btn.draggable = true;
        if (fitxa.svg) btn.innerHTML = fitxa.svg;
        else katex.render(fitxa.tex, btn, { throwOnError: false });
        // Tocar una targeta la tria (o la torna al munt, si ja era en una casella)
        btn.addEventListener('click', () => {
            const forat = btn.parentElement;
            if (forat.classList.contains('jp-forat')) {
                forat.classList.remove('jp-malament');
                els.fitxes.appendChild(btn);
                triaFitxa(null);
            } else triaFitxa(fitxaTriada === btn ? null : btn);
        });
        btn.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', fitxa.id);
            triaFitxa(null);
        });
        return btn;
    }

    function triaFitxa(btn) {
        if (fitxaTriada) fitxaTriada.classList.remove('jp-triada');
        fitxaTriada = btn;
        if (btn) btn.classList.add('jp-triada');
    }

    function colloca(fitxa, forat) {
        const anterior = forat.querySelector('.jp-fitxa');
        if (anterior && anterior !== fitxa) els.fitxes.appendChild(anterior);
        const origen = fitxa.parentElement;
        if (origen && origen.classList.contains('jp-forat')) origen.classList.remove('jp-malament');
        forat.appendChild(fitxa);
        forat.classList.remove('jp-malament');
        triaFitxa(null);
    }

    const caselles = () => Array.from(els.plantilla.querySelectorAll('input.jp-camp'));
    // Les caselles d'un camp (la d'un enter, o el numerador i el denominador d'una fracció)
    const casellesDe = nom => caselles().filter(inp => inp.dataset.nom === nom);

    function enfoca(inp, sobreescriu = false) {
        if (isTouchDevice()) {
            showCustomKeyboard(inp);
            if (sobreescriu && inp.value !== '') kbMarkForOverwrite(inp);
        } else {
            inp.focus();
            if (sobreescriu) inp.select();
        }
    }

    function mostraDiagnostic(text, avis = false) {
        els.diag.textContent = text || '';
        els.diag.classList.toggle('jp-avis', avis);
        els.diag.hidden = !text;
    }

    function mostraPas() {
        const pas = passos[index];
        const esTria = Object.values(pas.camps).includes('tria');
        triada = null;
        // Amb passos opcionals, cada fase compta a part
        const desDe = pregunta.opcional ? pregunta.opcional.desDe : passos.length;
        const [primer, total] = index < desDe ? [0, desDe] : [desDe, passos.length - desDe];
        els.comptador.textContent = total > 1 ? `${ui.pas} ${index - primer + 1} ${ui.de} ${total}` : '';
        els.comptador.hidden = total <= 1;
        if (pas.formules) pintaAmbFormules(els.enunciat, pas.enunciat);
        else els.enunciat.textContent = pas.enunciat;
        els.plantilla.innerHTML = '';
        pas.plantilla.forEach(tros => pintaTros(tros, els.plantilla, pas));
        els.plantilla.hidden = pas.plantilla.length === 0;
        triaFitxa(null);
        els.fitxes.innerHTML = '';
        (pas.fitxes || []).forEach(f => els.fitxes.appendChild(creaFitxa(f)));
        els.fitxes.hidden = !pas.fitxes;

        els.opcions.innerHTML = '';
        els.opcions.hidden = !esTria;
        els.opcions.classList.toggle('jp-opcions-svg', esTria && pas.opcions.some(o => o[2]));
        if (esTria) {
            pas.opcions.forEach(([valor, text, svg, formules]) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'jp-opcio';
                if (pas.literal) btn.classList.add('jp-opcio-literal');
                if (svg) {
                    // Una opció que és un dibuix (p. ex. una gràfica), amb el seu nom a sota
                    btn.classList.add('jp-opcio-svg');
                    btn.innerHTML = svg;
                    const nom = document.createElement('span');
                    nom.className = 'jp-opcio-nom';
                    nom.textContent = text;
                    btn.appendChild(nom);
                    btn.setAttribute('aria-label', text);
                } else if (formules) {
                    pintaAmbFormules(btn, formules);
                    btn.setAttribute('aria-label', text);
                } else btn.textContent = text;
                btn.addEventListener('click', () => {
                    if (btn.disabled) return;
                    triada = { valor, btn };
                    comprova();
                });
                els.opcions.appendChild(btn);
            });
        }
        const nota = pas.nota || (Object.values(pas.camps).some(esCampFraccio) ? avisos.racional : '');
        els.nota.textContent = nota;
        els.nota.hidden = !nota;
        els.ok.hidden = esTria;
        els.pas.hidden = false;
        mostraDiagnostic('');

        const primera = caselles()[0];
        if (primera) enfoca(primera);
        else hideCustomKeyboard();
        if (config.desplacament && index > 0) mostraUltimes();
        else els.pas.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // ---- PASSOS OPCIONALS: l'alumne tria si els fa ----
    function triaOpcionals() {
        const op = pregunta.opcional;
        triantOpcional = true;
        errorsAbans = MAX_INTENTS - state.attemptsLeft;
        hideCustomKeyboard();
        els.comptador.hidden = true;
        els.enunciat.textContent = op.pregunta;
        els.plantilla.hidden = true;
        els.fitxes.hidden = true;
        els.nota.hidden = true;
        els.ok.hidden = true;
        mostraDiagnostic('');
        els.opcions.innerHTML = '';
        els.opcions.hidden = false;
        els.opcions.classList.remove('jp-opcions-svg');
        for (const [text, si] of [
            [op.si || ui.si, true],
            [op.no || ui.no, false],
        ]) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'jp-opcio jp-opcio-literal jp-opcio-tria-fase';
            btn.textContent = text;
            btn.addEventListener('click', () => (si ? fesOpcionals() : acaba()));
            els.opcions.appendChild(btn);
        }
        els.pas.hidden = false;
        if (config.desplacament) mostraUltimes();
    }

    function fesOpcionals() {
        const op = pregunta.opcional;
        triantOpcional = false;
        ambOpcionals = true;
        desmarca();
        // Les línies fetes es pleguen en una franja amb el resum; la fase nova comença amb la línia inici
        const fetes = Array.from(zona.children);
        const franja = plega(fetes, op.resum, n => ui.mostraPassos(n));
        franja.classList.add('jp-plegat-fase');
        zona.appendChild(franja);
        novaFase();
        if (op.inici) afegeixLinia(op.inici, 'jp-inici-fase');
        mostraPas();
    }

    // ---- RESPONDRE ----
    function llegeixResposta() {
        const resp = {};
        if (triada) resp.tria = triada.valor;
        caselles().forEach(inp => {
            const { nom, part } = inp.dataset;
            if (part) (resp[nom] = resp[nom] || {})[part] = inp.value;
            else resp[nom] = inp.value;
        });
        els.plantilla.querySelectorAll('.jp-dibuix').forEach(d => {
            resp[d.dataset.nom] = String(d.querySelectorAll('.jp-part.jp-ple').length);
        });
        els.plantilla.querySelectorAll('.jp-quadricula').forEach(q => {
            resp[q.dataset.nom] = JSON.parse(q.dataset.punts);
        });
        els.plantilla.querySelectorAll('.jp-forat').forEach(f => {
            const fitxa = f.querySelector('.jp-fitxa');
            resp[f.dataset.nom] = fitxa ? fitxa.dataset.id : '';
        });
        return resp;
    }

    // Retorn (i → del teclat numèric): la casella buida següent; si no n'hi ha, la primera
    // obligatòria que falti; si no en falta cap, corregeix
    function checkCurrentCell() {
        const pas = passos[index];
        if (state.isTransitioning || penalitzant || triantOpcional || Object.values(pas.camps).includes('tria')) return;
        const totes = caselles();
        const activa = getKbActiveInput() || document.activeElement;
        const buida = inp => inp.value.trim() === '';
        const seguent = totes.slice(totes.indexOf(activa) + 1).find(buida);
        const obligatoria = totes.find(
            inp => buida(inp) && ['enter', 'racional'].includes(pas.camps[inp.dataset.nom]) && inp.dataset.part !== 'd'
        );
        if (seguent) enfoca(seguent);
        else if (obligatoria) enfoca(obligatoria);
        else comprova();
    }

    function comprova() {
        if (state.isTransitioning || penalitzant) return;
        const pas = passos[index];
        const r = corregeixPas(pas, llegeixResposta());

        if (r.estat === 'incomplet' || r.estat === 'avis') {
            if (r.estat === 'avis') mostraDiagnostic(avisos[r.codi], true);
            const [falta] = casellesDe(r.camp).filter(inp => r.estat === 'avis' || inp.value.trim() === '');
            if (falta) enfoca(falta, r.estat === 'avis');
            return;
        }

        const enunciat = pas.nom ? `${pregunta.text} · ${pas.nom}` : pregunta.text;
        const resposta = textDeResposta(pas, r.valors);
        if (r.estat === 'ok') {
            recordAnswerToHistory(enunciat, resposta, true);
            encerta(r.valors);
            return;
        }

        const diag = config.diagnostica ? config.diagnostica(pas, r.valors) : null;
        recordAnswerToHistory(enunciat, diag ? `${resposta} (${diag.etiqueta})` : resposta, false);
        mostraDiagnostic(diag ? diag.missatge : avisos.generic);
        if (triada) {
            triada.btn.classList.add('jp-malament');
            triada.btn.disabled = true;
            triada = null;
        }
        r.malament.forEach(nom => {
            casellesDe(nom).forEach(inp => inp.classList.add('jp-malament'));
            els.plantilla
                .querySelectorAll(
                    `.jp-dibuix[data-nom="${nom}"], .jp-forat[data-nom="${nom}"], .jp-quadricula[data-nom="${nom}"]`
                )
                .forEach(el => el.classList.add('jp-malament'));
        });
        penalitza(r.malament);
    }

    function penalitza(malament) {
        penalitzant = true;
        els.attemptsDisplay.classList.add('blink-warning');
        setTimeout(() => {
            els.attemptsDisplay.classList.remove('blink-warning');
            state.attemptsLeft--;
            actualitzaCapcalera();
            penalitzant = false;
            if (state.attemptsLeft <= 0) {
                esgota();
                return;
            }
            const [primera] = malament.flatMap(casellesDe);
            if (primera) enfoca(primera, true);
        }, 1000);
    }

    function encerta(valors) {
        // L'activitat pot refer els passos que queden a partir de la resposta de l'alumne
        const nous = config.enEncertar ? config.enEncertar(pregunta, passos[index], valors) : null;
        if (nous) passos = nous;
        const pas = passos[index];
        index++;
        const final = index >= passos.length;
        const fiFase = pregunta.opcional && !ambOpcionals && index === pregunta.opcional.desDe;
        // El que es mou, en color: una operació nova torna normals les línies marcades i marca l'anterior
        if (pas.marcaAnterior || !pas.liniaMarcada) desmarca();
        if (pas.marcaAnterior) {
            const ultima = Array.from(zona.querySelectorAll(':scope > .jp-linia')).pop();
            if (ultima && ultima.dataset.tex) {
                marcades.push({ div: ultima, tex: ultima.dataset.tex });
                katex.render(pas.marcaAnterior, ultima, { throwOnError: false });
            }
        }
        const classe = final || fiFase ? 'jp-final' : '';
        const div = afegeixLinia(pas.liniaMarcada || pas.linia, classe, pas.linia);
        if (pas.liniaMarcada) marcades.push({ div, tex: pas.linia });
        if (pas.svgResolt) afegeixSvg(pas.svgResolt);
        hideCustomKeyboard();
        plegaAntigues();
        if (fiFase) {
            desmarca();
            triaOpcionals();
            return;
        }
        if (!final) {
            mostraPas();
            return;
        }
        desmarca();
        acaba();
    }

    /** Torna a escriure normals les línies marcades amb color. */
    function desmarca() {
        for (const { div, tex } of marcades) katex.render(tex, div, { throwOnError: false });
        marcades = [];
    }

    /** Pregunta resolta: la franja «Molt bé! +N punts» i el botó «Següent» (game-core.js). */
    function acaba() {
        triantOpcional = false;
        recordResult(Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3));
        els.pas.hidden = true;
        const repartiment = pregunta.opcional && pregunta.opcional.punts;
        if (!repartiment) {
            acabaPregunta(puntsDeLaPregunta());
            return;
        }
        const errors = MAX_INTENTS - state.attemptsLeft;
        acabaPregunta(
            ambOpcionals
                ? puntsAmbPartOpcional(errorsAbans, errors - errorsAbans, repartiment)
                : puntsAmbPartOpcional(errors, null, repartiment)
        );
    }

    // Intents esgotats: s'escriu la resta de la resolució i l'alumne continua quan vol
    // (la franja «Intents esgotats · 0 punts» i el botó «Següent», de game-core.js)
    function esgota() {
        recordResult(4);
        desmarca();
        const fi = pregunta.opcional && !ambOpcionals ? pregunta.opcional.desDe : passos.length;
        passos.slice(index, fi).forEach(pas => {
            afegeixLinia(pas.linia, 'jp-donada');
            if (pas.svgResolt) afegeixSvg(pas.svgResolt);
        });
        els.plantilla.hidden = true;
        els.opcions.hidden = true;
        els.fitxes.hidden = true;
        els.nota.hidden = true;
        els.ok.hidden = true;
        els.comptador.hidden = true;
        els.enunciat.textContent = avisos.esgotat;
        acabaPregunta(0, { encert: false });
    }

    // game-core.js crida buildLevel (les sessions fixes el substitueixen per una versió que sembra
    // l'atzar de cada pregunta) i checkCurrentCell (la tecla → del teclat numèric)
    Object.assign(window, { buildLevel, checkCurrentCell });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter' || els.gameScreen.style.display === 'none') return;
        if (e.target instanceof HTMLButtonElement) return; // el botó ja fa la seva feina
        e.preventDefault();
        checkCurrentCell();
    });
    // Una targeta deixada al munt hi torna
    els.fitxes.addEventListener('dragover', e => e.preventDefault());
    els.fitxes.addEventListener('drop', e => {
        e.preventDefault();
        const fitxa = els.pas.querySelector(`.jp-fitxa[data-id="${e.dataTransfer.getData('text/plain')}"]`);
        if (!fitxa) return;
        if (fitxa.parentElement.classList.contains('jp-forat')) fitxa.parentElement.classList.remove('jp-malament');
        els.fitxes.appendChild(fitxa);
    });
    els.ok.addEventListener('click', comprova);
    els.ok.textContent = ui.ok;

    injectSharedHTML();
    validateConfig();
    initCustomKeyboard(config.teclat || { allowNegative: true });
    startGame();
}
