/**
 * function-engine.js — genera instàncies de funcions amb dades d'asímptotes.
 * NOTA: strings produeixen LaTeX vàlid (usa '-' estàndard, no '−' Unicode).
 */
window.FunctionEngine = (() => {
    const INF = Infinity;
    function _randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function _pick(arr)     { return arr[Math.floor(Math.random() * arr.length)]; }

    function _xMinusA(a) {
        if (a === 0) return 'x';
        return a < 0 ? `x + ${-a}` : `x - ${a}`;
    }

    function _makeRationalSimple() {
        const k = _pick([1, 2, 3, -1, -2, -3]);
        const a = _pick([-3, -2, -1, 1, 2, 3]);
        const numStr = k === 1 ? '1' : k === -1 ? '-1' : (k < 0 ? `-${-k}` : `${k}`);
        return { family: 'rational-simple', numStr, denStr: _xMinusA(a),
            fn: x => k / (x - a),
            va: [a], ha: 0, oa: null,
            domain: x => Math.abs(x - a) > 1e-9,
            vaLimits: { [a]: { left: k > 0 ? -INF : INF, right: k > 0 ? INF : -INF } },
            xRange: [-6, 6], yRange: [-8, 8],
            params: { k, a } };
    }

    function _makeRational11() {
        const p = _pick([1, 2, -1, -2, 3, -3]);
        const a = _pick([-3, -2, -1, 1, 2, 3]);
        let q; do { q = _randInt(-5, 5); } while (p * a + q === 0);
        const numAtA = p * a + q;
        const pPart  = p === 1 ? 'x' : p === -1 ? '-x' : `${p}x`;
        const qPart  = q === 0 ? '' : q > 0 ? ` + ${q}` : ` - ${-q}`;
        return { family: 'rational-11', numStr: `${pPart}${qPart}`, denStr: _xMinusA(a),
            fn: x => (p * x + q) / (x - a),
            va: [a], ha: p, oa: null,
            domain: x => Math.abs(x - a) > 1e-9,
            vaLimits: { [a]: { left: numAtA > 0 ? -INF : INF, right: numAtA > 0 ? INF : -INF } },
            xRange: [-6, 6], yRange: [p - 10, p + 10],
            params: { p, q, a, numAtA } };
    }

    function _makeRational21() {
        const a = _pick([-3, -2, -1, 1, 2, 3]);
        let b, c;
        do { b = _randInt(-3, 3); c = _randInt(-4, 4); } while (a*a + b*a + c === 0);
        const rem = a*a + a*b + c;
        const oaB = a + b;
        const bPart = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` - ${-b}x`;
        const cPart = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${-c}`;
        return { family: 'rational-21', numStr: `x^2${bPart}${cPart}`, denStr: _xMinusA(a),
            fn: x => (x*x + b*x + c) / (x - a),
            va: [a], ha: null, oa: { m: 1, b: oaB },
            domain: x => Math.abs(x - a) > 1e-9,
            vaLimits: { [a]: { left: rem > 0 ? -INF : INF, right: rem > 0 ? INF : -INF } },
            xRange: [-6, 6], yRange: [-15, 15],
            params: { a, b, c, rem, oaB } };
    }

    function _makeLogarithmic() {
        const a = _pick([-3, -2, -1, 0, 1, 2, 3]);
        return { family: 'logarithmic', numStr: null, denStr: _xMinusA(a),
            fn: x => x > a ? Math.log(x - a) : NaN,
            va: [a], ha: null, oa: null,
            domain: x => x > a,
            vaLimits: { [a]: { left: null, right: -INF } },
            xRange: [a - 1.5, a + 8], yRange: [-4, 4],
            params: { a } };
    }

    function _makeExponential() {
        const a = _pick([-2, -1, 0, 1, 2]);
        return { family: 'exponential', numStr: null, denStr: _xMinusA(a),
            fn: x => Math.abs(x - a) > 1e-9 ? Math.exp(1 / (x - a)) : NaN,
            va: [a], ha: 1, oa: null,
            domain: x => Math.abs(x - a) > 1e-9,
            vaLimits: { [a]: { left: 0, right: INF } },
            xRange: [a - 5, a + 5], yRange: [-0.5, 8],
            params: { a } };
    }

    const _generators = {
        'rational-simple': _makeRationalSimple, 'rational-11': _makeRational11,
        'rational-21': _makeRational21, 'logarithmic': _makeLogarithmic,
        'exponential': _makeExponential,
    };

    function generateFunction(level) {
        const byLevel = {
            1: ['rational-simple'],
            2: ['rational-simple', 'rational-11', 'logarithmic'],
            3: ['rational-simple', 'rational-11', 'rational-21', 'logarithmic', 'exponential'],
        };
        return _generators[_pick(byLevel[level] || byLevel[2])]();
    }

    return { generateFunction };
})();
