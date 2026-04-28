/**
 * js/descripcio-grafica/question-bank.js
 * Genera preguntes de signe, monotonia i concavitat.
 *
 * Cada pregunta retorna:
 *   { type, badge, label, options: [{text, isCorrect}, ...] }
 *
 * Notació d'intervals: Unicode pla (−∞, +∞, ∪) sense KaTeX als botons.
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
        const pts = [-INF, ...breaks, INF];
        const seen = [], groups = {};
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
    // ------------------------------------------------------------------ //
    function _signLabel(breaks, parts) {
        if (parts.every(p => p === 'positiu')) return 'f(x) > 0 a (−∞, +∞)';
        if (parts.every(p => p === 'negatiu')) return 'f(x) < 0 a (−∞, +∞)';
        const pts = [-INF, ...breaks, INF];
        const pos = [], neg = [];
        parts.forEach((p, i) => (p === 'positiu' ? pos : neg).push(_iv(pts[i], pts[i + 1])));
        return `f(x) > 0 a ${pos.join(' ∪ ')} i f(x) < 0 a ${neg.join(' ∪ ')}`;
    }

    // ------------------------------------------------------------------ //
    //  TEXT DE CONCAVITAT — agrupa intervals del mateix sentit amb ∪
    //  Ex: breaks=[2], parts=['avall','amunt']
    //  →  "f(x) té concavitat negativa a (−∞, 2) i amb concavitat positiva a (2, +∞)"
    // ------------------------------------------------------------------ //
    function _concLabel(breaks, parts) {
        if (parts.every(p => p === 'amunt')) return 'f(x) té concavitat positiva a (−∞, +∞)';
        if (parts.every(p => p === 'avall')) return 'f(x) té concavitat negativa a (−∞, +∞)';
        const pts = [-INF, ...breaks, INF];
        const seen = [], groups = {};
        parts.forEach((p, i) => {
            if (!groups[p]) { groups[p] = []; seen.push(p); }
            groups[p].push(_iv(pts[i], pts[i + 1]));
        });
        const descs = seen.map(p => `amb concavitat ${p === 'amunt' ? 'positiva' : 'negativa'} a ${groups[p].join(' ∪ ')}`);
        if (descs.length === 1) return `f(x) és ${descs[0]}`;
        return `f(x) és ${descs.slice(0, -1).join(', ')} i ${descs[descs.length - 1]}`;
    }

    // ------------------------------------------------------------------ //
    //  GENERADOR DE DISTRACTORS (genèric)
    // ------------------------------------------------------------------ //
    function _genDistrs(correct, breaks, parts, otherBreaks, labelFn, fallbacks) {
        const FLIP = parts.map(p =>
            p === 'creixent'  ? 'decreixent' :
            p === 'decreixent'? 'creixent'   :
            p === 'positiu'   ? 'negatiu'    :
            p === 'negatiu'   ? 'positiu'    :
            p === 'amunt'     ? 'avall'      : 'amunt'
        );
        const pool = [];
        const add  = d => { if (d !== correct && !pool.includes(d)) pool.push(d); };

        add(labelFn(breaks, FLIP));

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

        (fallbacks || []).forEach(f => add(f));

        return pool.slice(0, 3);
    }

    // ------------------------------------------------------------------ //
    //  API PÚBLICA
    // ------------------------------------------------------------------ //
    function generateSignQ(spec) {
        const { signBreaks, signParts, monBreaks } = spec;
        const correct = _signLabel(signBreaks, signParts);
        const distrs  = _genDistrs(correct, signBreaks, signParts, monBreaks, _signLabel, [
            'f(x) > 0 a (−∞, +∞)',
            'f(x) < 0 a (−∞, +∞)'
        ]);
        return {
            type:    'Q_SIGN',
            badge:   'Signe de f(x)',
            label:   'Intervals on f(x) > 0 i on f(x) < 0:',
            options: _shuffle([
                { text: correct, isCorrect: true  },
                ...distrs.map(t => ({ text: t, isCorrect: false }))
            ])
        };
    }

    function generateMonoQ(spec) {
        const { monBreaks, monParts, signBreaks } = spec;
        const correct = _monLabel(monBreaks, monParts);
        const distrs  = _genDistrs(correct, monBreaks, monParts, signBreaks, _monLabel, [
            'f(x) és creixent a (−∞, +∞)',
            'f(x) és decreixent a (−∞, +∞)'
        ]);
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

    function generateConcQ(spec) {
        const { concBreaks, concParts, monBreaks } = spec;
        const correct = _concLabel(concBreaks, concParts);
        const distrs  = _genDistrs(correct, concBreaks, concParts, monBreaks, _concLabel, [
            'f(x) té concavitat positiva a (−∞, +∞)',
            'f(x) té concavitat negativa a (−∞, +∞)'
        ]);
        return {
            type:    'Q_CONC',
            badge:   'Concavitat de f(x)',
            label:   'Els intervals de concavitat de f(x) són aquests:',
            options: _shuffle([
                { text: correct, isCorrect: true  },
                ...distrs.map(t => ({ text: t, isCorrect: false }))
            ])
        };
    }

    return { generateSignQ, generateMonoQ, generateConcQ };
})();
