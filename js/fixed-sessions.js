/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fixed-sessions.js
 * ROL: Sessions fixes per al professorat. Quan la URL conté ?fixed=A (o B, C),
 *      TOTS els alumnes que obrin el mateix enllaç obtindran exactament els
 *      mateixos exercicis, amb els mateixos nombres i les mateixes opcions.
 *
 * COM FUNCIONA:
 *   1. Substitueix Math.random() per un generador pseudoaleatori determinista
 *      (Mulberry32). La llavor NO és una sola per a tota la sessió: cada
 *      pregunta en té una de pròpia, calculada a partir de la lletra (A/B/C),
 *      l'activitat i el número de pregunta. Així, el que faci un alumne en una
 *      pregunta (errors, clics, reintents…) no pot canviar les preguntes
 *      següents: la pregunta 3 és la mateixa per a tothom.
 *        - Jocs amb game-core.js: automàtic. game-core.js crida
 *          FixedSessions.wrap('buildLevel', …) en començar i cada crida a
 *          buildLevel() torna a sembrar amb (sessió, pregunta).
 *        - Pàgines amb flux propi: criden FixedSessions?.seed(etiqueta)
 *          o FixedSessions?.next(tipus) quan generen un exercici nou.
 *          (FixedSessions val null si la URL no porta ?fixed=A/B/C.)
 *   2. Injecta paràmetres URL automàticament (5 operacions, 1 sessió, nivell
 *      i famílies segons l'activitat) via history.replaceState, ABANS que
 *      config.js i game-core.js els llegeixin.
 *   3. Mostra un badge visual "Sessió fixa A/B/C" perquè professor i alumne
 *      sàpiguen que estan en mode determinista.
 *
 * ÚS PER AL PROFESSORAT:
 *   enters.html?fixed=A          → Sessió A d'enters (tots fan el mateix)
 *   enters.html?fixed=B          → Sessió B (exercicis diferents d'A)
 *   derivades.html?fixed=C       → Sessió C de derivades (nivell avançat)
 *   equacions.html?fixed=A&maxintents=5  → Es pot combinar amb altres params
 *
 * ORDRE D'EXECUCIÓ:
 *   ⚠️ CRÍTIC: s'ha d'executar ABANS que ningú llegeixi la URL o faci servir
 *   Math.random. És un mòdul ES: config.js l'importa en primer lloc (i per
 *   tant també game-core.js), i les pàgines sense game-core.js l'importen
 *   elles mateixes com a PRIMER import:
 *     import { FixedSessions } from '../fixed-sessions.js';
 *
 * DEPENDÈNCIES: Cap. Autocontingut.
 * ============================================================================
 */

export const FixedSessions = (() => {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    const fixedRaw = params.get('fixed');
    if (!fixedRaw) return null; // mode aleatori normal — no fem res

    const fixedKey = fixedRaw.toUpperCase();
    if (!['A', 'B', 'C'].includes(fixedKey)) return null;

    const exercici = window.location.pathname.split('/').pop().replace('.html', '');

    // ── 1. PRNG DETERMINISTA (Mulberry32) AMB UNA LLAVOR PER PREGUNTA ────
    //    Mateixa etiqueta de pregunta → mateixa seqüència → mateix exercici.

    // Hash FNV-1a de 32 bits: converteix "A|enters|s0-q3" en un enter.
    function hash32(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }

    let _state = 0;
    function _seed(label) {
        _state = hash32(fixedKey + '|' + exercici + '|' + label);
    }

    const _originalRandom = Math.random;
    Math.random = function mulberry32() {
        _state |= 0;
        _state = (_state + 0x6d2b79f5) | 0;
        let t = Math.imul(_state ^ (_state >>> 15), 1 | _state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    _seed('inici'); // el que es generi en carregar la pàgina, abans de la 1a pregunta

    const _counters = {};
    const api = {
        key: fixedKey,

        /** Torna a sembrar l'atzar per a la pregunta identificada per `label`. */
        seed(label) {
            _seed(String(label));
        },

        /**
         * Per a pàgines sense comptador de preguntes: la n-èsima crida amb el
         * mateix `tipus` rep sempre la mateixa llavor (p. ex. 'SR', 'SR', …).
         */
        next(tipus = 'q') {
            const n = (_counters[tipus] = (_counters[tipus] ?? -1) + 1);
            _seed(tipus + '#' + n);
        },

        /**
         * Embolcalla window[name] (p. ex. 'buildLevel') perquè cada crida torni
         * a sembrar amb l'etiqueta que retorna labelFn(). El joc l'ha d'haver
         * exposat (Object.assign(window, { buildLevel })) i cridar-la sempre
         * com a window.buildLevel(): una crida directa no passaria per aquí.
         */
        wrap(name, labelFn) {
            const fn = window[name];
            if (typeof fn !== 'function' || fn._fixedWrapped) return false;
            const wrapped = function () {
                _seed(String(labelFn()));
                return fn.apply(this, arguments);
            };
            wrapped._fixedWrapped = true;
            window[name] = wrapped;
            return window[name] === wrapped;
        },
    };

    // ── 2. PARÀMETRES URL PER ACTIVITAT ──────────────────────────────────
    //    Afegim paràmetres sense recarregar la pàgina. config.js i game-core.js
    //    els trobaran quan es carreguin (perquè aquest script va PRIMER).

    let changed = false;

    // 2a. Forçar 5 operacions i 1 sessió (si no s'ha especificat)
    if (!params.has('totaloperations')) {
        params.set('totaloperations', '5');
        changed = true;
    }
    if (!params.has('totalsessions')) {
        params.set('totalsessions', '1');
        changed = true;
    }

    // 2b. Activitats amb NIVELLS: A→1, B→2, C→3
    const NIVELLS_PER_SESSIO = {
        'probabilitat': { A: '1', B: '2', C: '3' },
        'estadistica-inversa': { A: '1', B: '2', C: '3' },
        'asimptotes': { A: '1', B: '2', C: '3' },
        'descripcio-grafica': { A: '1', B: '2', C: '3' },
        'descripcio-grafica-inversa': { A: '1', B: '2', C: '3' },
        'recta-numerica': { A: '1', B: '2', C: '3' },
    };

    if (NIVELLS_PER_SESSIO[exercici] && !params.has('nivell')) {
        const nivell = NIVELLS_PER_SESSIO[exercici][fixedKey];
        if (nivell) {
            params.set('nivell', nivell);
            changed = true;
        }
    }

    // 2c. Activitats amb FAMÍLIES: cada sessió activa famílies diferents
    const FAMILIES_PER_SESSIO = {
        derivades: {
            A: 'power,power-coef,chain-exp-int',
            B: 'log-kx,log-linear,chain-sin-int,chain-cos-int',
            C: 'compound-exp-sin,compound-ln-sin,product,quotient',
        },
        integrals: {
            A: 'int-power',
            B: 'int-power-coef',
            C: 'int-exp-kx',
        },
    };

    if (FAMILIES_PER_SESSIO[exercici] && !params.has('families')) {
        const fam = FAMILIES_PER_SESSIO[exercici][fixedKey];
        if (fam) {
            params.set('families', fam);
            changed = true;
        }
    }

    // 2d. Activitats amb TIPUS: cada sessió usa un tipus de dades diferent
    const TIPUS_PER_SESSIO = {
        estadistica: {
            A: 'calcat',
            B: 'alcada',
            C: 'pulsacions',
        },
    };

    if (TIPUS_PER_SESSIO[exercici] && !params.has('tipus')) {
        const tipus = TIPUS_PER_SESSIO[exercici][fixedKey];
        if (tipus) {
            params.set('tipus', tipus);
            changed = true;
        }
    }

    // Apliquem els canvis a la URL (sense recarregar la pàgina)
    if (changed) {
        history.replaceState(null, '', '?' + params.toString());
    }

    // ── 3. BADGE VISUAL ──────────────────────────────────────────────────
    //    Mostra un indicador flotant perquè tothom sàpiga que és sessió fixa.

    window.addEventListener('DOMContentLoaded', function () {
        const badge = document.createElement('div');
        badge.textContent = 'Sessió fixa ' + fixedKey;
        badge.style.cssText = [
            'position:fixed',
            'top:8px',
            'right:8px',
            'z-index:9999',
            'background:#1e293b',
            'color:#fbbf24',
            'padding:5px 14px',
            'border-radius:6px',
            'font-size:12px',
            'font-weight:700',
            'letter-spacing:0.5px',
            'box-shadow:0 2px 8px rgba(0,0,0,0.15)',
            'pointer-events:none',
            'opacity:0.9',
        ].join(';');
        document.body.appendChild(badge);
    });

    // ── 4. RESTAURAR Math.random PER A copiarResultats ───────────────────
    //    El salt del codi de verificació ha de ser aleatori DE VERITAT
    //    (sinó tots els alumnes tindrien el mateix codi i el professor no
    //    podria distingir-los). Restaurem l'original quan l'alumne acaba.

    api.restoreRandom = function () {
        Math.random = _originalRandom;
    };

    // [FIX C2] Safety net: si l'alumne surt abans de la pantalla final
    window.addEventListener('beforeunload', function () {
        Math.random = _originalRandom;
    });

    // Restaurem quan el joc s'acaba (pantalla final visible)
    window.addEventListener('DOMContentLoaded', function () {
        const observer = new MutationObserver(function () {
            const final = document.getElementById('final-screen');
            if (final && final.style.display === 'block') {
                Math.random = _originalRandom;
                observer.disconnect();
            }
        });
        const panel = document.querySelector('.panel') || document.body;
        observer.observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    });

    return api;
})();
