/**
 * js/descripcio-grafica/question-bank.js
 * Genera preguntes de monotonia i signe per a "Descripció d'una gràfica".
 *
 * Cada pregunta retorna:
 *   { type, badge, label, options: [{text, isCorrect}, ...] }
 *
 * Les opcions (1 correcta + 3 distractors) s'expressen en text pla amb
 * intervals Unicode (−∞, +∞, ∪) per evitar KaTeX en els botons de resposta.
 *
 * Estratègia de distractors:
 *   1. Invertir creixent↔decreixent o positiu↔negatiu
 *   2. Usar els breakpoints de l'altra pregunta com a punts equivocats
 *   3. Desplaçar els breakpoints correctes ±1 o ±2
 *   4. Fallback: "sempre creixent/decreixent" o "sempre positiva/negativa"
 */

window.QuestionBank = (() => {
    'use strict';

    const INF = Infinity;

    function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /** Formata un nombre per a intervals (Unicode, no LaTeX). */
    function _n(x) {
        if (x ===  INF) return '+∞';
        if (x === -INF) return '−∞';
        return x < 0 ? `−${-x}` : `${x}`;
    }
    function _iv(a, b) { return `(${_n(a)}, ${_n(b)})`; }

    // ------------------------------------------------------------------ //
    //  TEXT DE MONOTONIA — agrupa intervals del mateix sentit amb ∪
    //  Ex: breaks=[-1,1], parts=['decreixent','creixent','decreixent']
    //  →  "f(x) és decreixent a (−∞, −1) ∪ (1, +∞) i creixent a (−1, 1)"
    // ------------------------------------------------------------------ //
    function _monLabel(breaks, parts) {
        const pts  = [-INF, ...breaks, INF];

        // Agrupa intervals per sentit, mantenint l'ordre de primera aparició
        const seen   = [];
        const groups = {};
        parts.forEach((p, i) => {
            if (!groups[p]) { groups[p] = []; seen.push(p); }
            groups[p].push(_iv(pts[i], pts[i + 1]));
        });

        const descs = seen.map(p => `${p} a ${groups[p].join(' ∪ ')}`);
        if (descs.length === 1) return `f(x) és ${descs[0]}`;
        return `f(x) és ${descs.slice(0, -1).join(', ')} i ${descs[descs.length - 1]}`;
    }

    // ------------------------------------------------------------------ //
    //  TEXT DE SIGNE
    //  Ex: signBreaks=[2,6], signParts=['negatiu','positiu','negatiu']
    //  →  "f(x) és positiva a (2, 6) i negativa a (−∞, 2) ∪ (6, +∞)"
    // ------------------------------------------------------------------ //
    function _signLabel(breaks, parts) {
        if (parts.every(p => p === 'positiu')) return 'f(x) és positiva a (−∞, +∞)';
        if (parts.every(p => p === 'negatiu')) return 'f(x) és negativa a (−∞, +∞)';
        const pts = [-INF, ...breaks, INF];
        const pos = [], neg = [];
        parts.forEach((p, i) => (p === 'positiu' ? pos : neg).push(_iv(pts[i], pts[i + 1])));
        return `f(x) és positiva a ${pos.join(' ∪ ')} i negativa a ${neg.join(' ∪ ')}`;
    }

    // ------------------------------------------------------------------ //
    //  GENERADOR DE DISTRACTORS (genèric per a mono i signe)
    //
    //  @param correct     — string de la resposta correcta
    //  @param breaks      — breakpoints de la pregunta actual
    //  @param parts       — parts de la pregunta actual
    //  @param otherBreaks — breakpoints de l'altra pregunta (fonts de distractors)
    //  @param labelFn     — _monLabel o _signLabel
    // ------------------------------------------------------------------ //
    function _genDistrs(correct, breaks, parts, otherBreaks, labelFn) {
        const FLIP = parts.map(p =>
            p === 'creixent' ? 'decreixent' :
            p === 'decreixent' ? 'creixent' :
            p === 'positiu'  ? 'negatiu'  : 'positiu'
        );
        const pool = [];
        const add  = d => { if (d !== correct && !pool.includes(d)) pool.push(d); };

        // D1: invertir totes les parts
        add(labelFn(breaks, FLIP));

        // D2–Dn: punts de tall alternatius
        const alts = [
            ...otherBreaks,
            ...(breaks.length > 0 ? [breaks[0] - 1, breaks[0] + 1, breaks[0] + 2, breaks[0] - 2] : []),
            ...(breaks.length > 1 ? [breaks[1] - 1, breaks[1] + 1] : []),
            0, 1, -1, 2, -2, 3, -3, 4, -4
        ].filter(b => !breaks.includes(b));

        for (const ab of alts) {
            if (breaks.length === 0) {
                add(labelFn([ab], [parts[0], FLIP[0]]));
                add(labelFn([ab], [FLIP[0], parts[0]]));
            } else if (breaks.length === 1) {
                add(labelFn([ab], parts));
                add(labelFn([ab], FLIP));
            } else if (breaks.length === 2) {
                add(labelFn([ab, breaks[1]], parts));
                add(labelFn([breaks[0], ab], parts));
                add(labelFn([ab, breaks[1]], FLIP));
            }
            if (pool.length >= 6) break;
        }

        // Fallback "sempre"
        const isMon = parts[0] === 'creixent' || parts[0] === 'decreixent';
        if (isMon) {
            add('f(x) és creixent a (−∞, +∞)');
            add('f(x) és decreixent a (−∞, +∞)');
        } else {
            add('f(x) és positiva a (−∞, +∞)');
            add('f(x) és negativa a (−∞, +∞)');
        }

        return pool.slice(0, 3);
    }

    // ------------------------------------------------------------------ //
    //  API PÚBLICA
    // ------------------------------------------------------------------ //
    function generateMonoQ(spec) {
        const { monBreaks, monParts, signBreaks } = spec;
        const correct = _monLabel(monBreaks, monParts);
        const distrs  = _genDistrs(correct, monBreaks, monParts, signBreaks, _monLabel);
        return {
            type:    'Q_MONO',
            badge:   'Monotonia de f(x)',
            label:   'Els intervals de monotonia de f(x) són aquests:',
            options: _shuffle([
                { text: correct, isCorrect: true  },
                ...distrs.map(t => ({ text: t, isCorrect: false }))
            ])
        };
    }

    function generateSignQ(spec) {
        const { signBreaks, signParts, monBreaks } = spec;
        const correct = _signLabel(signBreaks, signParts);
        const distrs  = _genDistrs(correct, signBreaks, signParts, monBreaks, _signLabel);
        return {
            type:    'Q_SIGN',
            badge:   'Signe de f(x)',
            label:   'On és positiva i negativa f(x)?',
            options: _shuffle([
                { text: correct, isCorrect: true  },
                ...distrs.map(t => ({ text: t, isCorrect: false }))
            ])
        };
    }

    return { generateMonoQ, generateSignQ };
})();
