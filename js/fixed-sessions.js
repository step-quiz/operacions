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
 *      (Mulberry32) inicialitzat amb una llavor fixa per a cada sessió.
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
 * ORDRE DE CÀRREGA:
 *   ⚠️ CRÍTIC: Ha de ser el PRIMER <script> de la pàgina, ABANS de utils.js.
 *   <script src="js/fixed-sessions.js"></script>   ← PRIMER
 *   <script src="js/utils.js"></script>
 *   <script src="js/config.js"></script>
 *   ...
 *
 * DEPENDÈNCIES: Cap. Autocontingut.
 * ============================================================================
 */

(function() {
    'use strict';

    const params   = new URLSearchParams(window.location.search);
    const fixedRaw = params.get('fixed');
    if (!fixedRaw) return;  // mode aleatori normal — no fem res

    const fixedKey = fixedRaw.toUpperCase();
    if (!['A', 'B', 'C'].includes(fixedKey)) return;

    // ── 1. PRNG DETERMINISTA (Mulberry32) ────────────────────────────────
    //    Mateixa llavor → mateixa seqüència → mateixos exercicis per a tothom.
    const SEEDS = { A: 314159, B: 271828, C: 161803 };
    let _seed = SEEDS[fixedKey];
    const _originalRandom = Math.random;

    Math.random = function mulberry32() {
        _seed |= 0;
        _seed = _seed + 0x6D2B79F5 | 0;
        let t = Math.imul(_seed ^ _seed >>> 15, 1 | _seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    // ── 2. PARÀMETRES URL PER ACTIVITAT ──────────────────────────────────
    //    Afegim paràmetres sense recarregar la pàgina. config.js i game-core.js
    //    els trobaran quan es carreguin (perquè aquest script va PRIMER).

    const exercici = window.location.pathname.split('/').pop().replace('.html', '');
    let changed = false;

    // 2a. Forçar 5 operacions i 1 sessió (si no s'ha especificat)
    if (!params.has('totaloperations')) { params.set('totaloperations', '5'); changed = true; }
    if (!params.has('totalsessions'))   { params.set('totalsessions', '1');   changed = true; }

    // 2b. Activitats amb NIVELLS: A→1, B→2, C→3
    const NIVELLS_PER_SESSIO = {
        'probabilitat':              { A: '1', B: '2', C: '3' },
        'estadistica-inversa':       { A: '1', B: '2', C: '3' },
        'asimptotes':                { A: '1', B: '2', C: '3' },
        'descripcio-grafica':        { A: '1', B: '2', C: '3' },
        'descripcio-grafica-inversa':{ A: '1', B: '2', C: '3' },
        'recta-numerica':            { A: '1', B: '2', C: '3' },
    };

    if (NIVELLS_PER_SESSIO[exercici] && !params.has('nivell')) {
        const nivell = NIVELLS_PER_SESSIO[exercici][fixedKey];
        if (nivell) { params.set('nivell', nivell); changed = true; }
    }

    // 2c. Activitats amb FAMÍLIES: cada sessió activa famílies diferents
    const FAMILIES_PER_SESSIO = {
        'derivades': {
            A: 'power,power-coef,chain-exp-int',
            B: 'log-kx,log-linear,chain-sin-int,chain-cos-int',
            C: 'compound-exp-sin,compound-ln-sin,product,quotient',
        },
        'integrals': {
            A: 'int-power',
            B: 'int-power-coef',
            C: 'int-exp-kx',
        },
    };

    if (FAMILIES_PER_SESSIO[exercici] && !params.has('families')) {
        const fam = FAMILIES_PER_SESSIO[exercici][fixedKey];
        if (fam) { params.set('families', fam); changed = true; }
    }

    // 2d. Activitats amb TIPUS: cada sessió usa un tipus de dades diferent
    const TIPUS_PER_SESSIO = {
        'estadistica': {
            A: 'calcat',
            B: 'alcada',
            C: 'pulsacions',
        },
    };

    if (TIPUS_PER_SESSIO[exercici] && !params.has('tipus')) {
        const tipus = TIPUS_PER_SESSIO[exercici][fixedKey];
        if (tipus) { params.set('tipus', tipus); changed = true; }
    }

    // Apliquem els canvis a la URL (sense recarregar la pàgina)
    if (changed) {
        history.replaceState(null, '', '?' + params.toString());
    }

    // ── 3. BADGE VISUAL ──────────────────────────────────────────────────
    //    Mostra un indicador flotant perquè tothom sàpiga que és sessió fixa.

    window.addEventListener('DOMContentLoaded', function() {
        const badge = document.createElement('div');
        badge.textContent = 'Sessió fixa ' + fixedKey;
        badge.style.cssText = [
            'position:fixed', 'top:8px', 'right:8px', 'z-index:9999',
            'background:#1e293b', 'color:#fbbf24', 'padding:5px 14px',
            'border-radius:6px', 'font-size:12px', 'font-weight:700',
            'letter-spacing:0.5px', 'box-shadow:0 2px 8px rgba(0,0,0,0.15)',
            'pointer-events:none', 'opacity:0.9',
        ].join(';');
        document.body.appendChild(badge);
    });

    // ── 4. RESTAURAR Math.random PER A copiarResultats ───────────────────
    //    El salt del codi de verificació ha de ser aleatori DE VERITAT
    //    (sinó tots els alumnes tindrien el mateix codi i el professor no
    //    podria distingir-los). Restaurem l'original quan l'alumne acaba.

    window._fixedSessionActive = true;
    window._restoreRandom = function() {
        Math.random = _originalRandom;
    };

    // [FIX C2] Safety net: si l'alumne surt abans de la pantalla final
    window.addEventListener('beforeunload', function() {
        Math.random = _originalRandom;
    });

    // Restaurem quan el joc s'acaba (pantalla final visible)
    window.addEventListener('DOMContentLoaded', function() {
        const observer = new MutationObserver(function() {
            const final = document.getElementById('final-screen');
            if (final && final.style.display === 'block') {
                Math.random = _originalRandom;
                observer.disconnect();
            }
        });
        const panel = document.querySelector('.panel') || document.body;
        observer.observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    });

})();
