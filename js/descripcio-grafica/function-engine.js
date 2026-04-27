/**
 * js/descripcio-grafica/function-engine.js
 * Genera especificacions de funcions per a l'activitat "Descripció d'una gràfica".
 *
 * Cada especificació inclou:
 *   family, fn, latex,
 *   monBreaks [], monParts []    — punts de canvi de monotonia i sentit per interval
 *   signBreaks [], signParts []  — zeros (canvis de signe) i signe per interval
 *   xRange [], yRange []         — finestra de visualització
 *   keyPoints []                 — {x, y, type:'root'|'extremum'} per al SVG
 *
 * Tots els punts crítics i zeros tenen coordenades enteres per disseny.
 *
 * Nivells:
 *   1 — lineal, quadràtica (2 arrels, cap arrel)
 *   2 — + cúbica monotònica, cúbica amb arrel doble
 *   3 — + exponencial, sqrt(x²+k), racionals amb domini ℝ
 */

window.FunctionEngine = (() => {
    'use strict';

    function _ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    /** LaTeX per a (x − a), sense parèntesis. */
    function _xa(a) {
        if (a === 0) return 'x';
        return a < 0 ? `x + ${-a}` : `x - ${a}`;
    }
    /** LaTeX per a (x − a), amb parèntesis si a ≠ 0. */
    function _xap(a) {
        if (a === 0) return 'x';
        return a < 0 ? `(x + ${-a})` : `(x - ${a})`;
    }

    // ------------------------------------------------------------------ //
    //  LINEAL   f(x) = m(x − a)
    // ------------------------------------------------------------------ //
    function makeLinear() {
        const m = _pick([1, 2, -1, -2]);
        const a = _ri(-4, 4);
        let latex;
        if (m ===  1) latex = `f(x) = ${_xa(a)}`;
        else if (m === -1) latex = a === 0 ? `f(x) = -x` : `f(x) = -${_xap(a)}`;
        else latex = a === 0 ? `f(x) = ${m}x` : `f(x) = ${m}${_xap(a)}`;
        return {
            family: 'linear', fn: x => m * (x - a), latex,
            monBreaks: [], monParts: [m > 0 ? 'creixent' : 'decreixent'],
            signBreaks: [a], signParts: m > 0 ? ['negatiu', 'positiu'] : ['positiu', 'negatiu'],
            xRange: [a - 5, a + 5], yRange: [-8, 8],
            keyPoints: [{ x: a, y: 0, type: 'root' }]
        };
    }

    // ------------------------------------------------------------------ //
    //  QUADRÀTICA AMB 2 ARRELS ENTERES (mateixa paritat → vèrtex enter)
    //  f(x) = ±(x − r1)(x − r2)
    // ------------------------------------------------------------------ //
    function makeQuad2Roots() {
        const diff = _pick([2, 4, 6]);          // diferència parella → vèrtex enter
        const r1 = _ri(-4, 4 - diff);
        const r2 = r1 + diff;
        const v  = (r1 + r2) / 2;              // vèrtex (enter garantit)
        const sgn = _pick([1, -1]);
        const fn = sgn > 0 ? x => (x - r1) * (x - r2) : x => -(x - r1) * (x - r2);
        const vy = fn(v);
        const latex = sgn > 0
            ? `f(x) = ${_xap(r1)}${_xap(r2)}`
            : `f(x) = -${_xap(r1)}${_xap(r2)}`;
        return {
            family: 'quad2', fn, latex,
            monBreaks: [v],
            monParts:  sgn > 0 ? ['decreixent', 'creixent'] : ['creixent', 'decreixent'],
            signBreaks: [r1, r2],
            signParts:  sgn > 0 ? ['positiu', 'negatiu', 'positiu'] : ['negatiu', 'positiu', 'negatiu'],
            xRange: [r1 - 3, r2 + 3], yRange: [Math.min(0, vy) - 2, Math.max(0, vy) + 2],
            keyPoints: [
                { x: r1, y: 0, type: 'root' },
                { x: r2, y: 0, type: 'root' },
                { x: v,  y: vy, type: 'extremum' }
            ]
        };
    }

    // ------------------------------------------------------------------ //
    //  QUADRÀTICA SENSE ARRELS REALS (sempre positiva o sempre negativa)
    //  f(x) = ±((x − h)² + k),  k > 0
    // ------------------------------------------------------------------ //
    function makeQuadNoRoots() {
        const h   = _ri(-3, 3);
        const k   = _ri(2, 5);
        const sgn = _pick([1, -1]);
        const fn  = sgn > 0 ? x => (x - h) ** 2 + k : x => -((x - h) ** 2) - k;
        const base = h === 0 ? 'x' : _xap(h);
        const latex = sgn > 0
            ? `f(x) = ${base}^2 + ${k}`
            : `f(x) = -${base}^2 - ${k}`;
        return {
            family: 'quadNoRoots', fn, latex,
            monBreaks: [h],
            monParts:  sgn > 0 ? ['decreixent', 'creixent'] : ['creixent', 'decreixent'],
            signBreaks: [], signParts: [sgn > 0 ? 'positiu' : 'negatiu'],
            xRange: [h - 5, h + 5], yRange: sgn > 0 ? [-2, k + 5] : [-(k + 5), 2],
            keyPoints: [{ x: h, y: sgn * k, type: 'extremum' }]
        };
    }

    // ------------------------------------------------------------------ //
    //  CÚBICA MONOTÒNICA   f(x) = ±(x − a)³
    // ------------------------------------------------------------------ //
    function makeCubicMono() {
        const a   = _ri(-3, 3);
        const sgn = _pick([1, -1]);
        const fn  = sgn > 0 ? x => (x - a) ** 3 : x => -((x - a) ** 3);
        const base = a === 0 ? 'x' : _xap(a);
        const latex = sgn > 0 ? `f(x) = ${base}^3` : `f(x) = -${base}^3`;
        return {
            family: 'cubicMono', fn, latex,
            monBreaks: [], monParts: [sgn > 0 ? 'creixent' : 'decreixent'],
            signBreaks: [a], signParts: sgn > 0 ? ['negatiu', 'positiu'] : ['positiu', 'negatiu'],
            xRange: [a - 3, a + 3], yRange: [-15, 15],
            keyPoints: [{ x: a, y: 0, type: 'root' }]
        };
    }

    // ------------------------------------------------------------------ //
    //  CÚBICA AMB ARREL DOBLE   f(x) = ±(x − p)(x − q)²
    //
    //  Parells (p, q) on (q + 2p) % 3 === 0 → punts crítics enters:
    //    x = q  i  x = (q + 2p)/3
    //  El signe canvia només a x = p (arrel simple).
    //  A x = q (arrel doble) la funció toca zero però no canvia de signe.
    // ------------------------------------------------------------------ //
    function makeCubicDouble() {
        const PAIRS = [
            [0, 3], [3, 0], [-3, 0], [0, -3],
            [-2, 1], [2, -1], [-1, 2], [1, -2]
        ];
        const [p, q] = _pick(PAIRS);
        const sgn = _pick([1, -1]);
        const fn  = sgn > 0 ? x => (x - p) * (x - q) ** 2 : x => -((x - p) * (x - q) ** 2);

        // Punts crítics
        const ic   = (q + 2 * p) / 3;          // (q + 2p)/3, sempre enter per construcció
        const c_lo = Math.min(q, ic);
        const c_hi = Math.max(q, ic);

        // Monotonia: sgn > 0 → creixent–decreixent–creixent; sgn < 0 → invers
        const monParts = sgn > 0
            ? ['creixent', 'decreixent', 'creixent']
            : ['decreixent', 'creixent', 'decreixent'];

        // Signe: canvi només a x = p
        const signParts = sgn > 0 ? ['negatiu', 'positiu'] : ['positiu', 'negatiu'];

        const Sp = p === 0 ? 'x' : p < 0 ? `(x + ${-p})` : `(x - ${p})`;
        const Sq = q === 0 ? 'x^2' : q < 0 ? `(x + ${-q})^2` : `(x - ${q})^2`;
        const latex = sgn > 0 ? `f(x) = ${Sp}${Sq}` : `f(x) = -${Sp}${Sq}`;

        const xs = [p, q, c_lo, c_hi];
        const ys = xs.map(fn);
        return {
            family: 'cubicDouble', fn, latex,
            monBreaks: [c_lo, c_hi], monParts,
            signBreaks: [p], signParts,
            xRange: [Math.min(...xs) - 3, Math.max(...xs) + 3],
            yRange: [
                Math.max(Math.min(...ys) - 3, -25),
                Math.min(Math.max(...ys) + 3,  25)
            ],
            keyPoints: [
                { x: p, y: 0, type: 'root' },
                ...(p !== q ? [{ x: q, y: 0, type: 'root' }] : []),
                { x: c_lo, y: fn(c_lo), type: 'extremum' },
                { x: c_hi, y: fn(c_hi), type: 'extremum' }
            ].filter(kp => isFinite(kp.x) && isFinite(kp.y))
        };
    }

    // ------------------------------------------------------------------ //
    //  EXPONENCIAL
    //    Amb arrel: f(x) = ±(eˣ⁻ᵃ − 1)   → arrel entera a x = a
    //    Sense:     f(x) = ±eˣ⁻ᵃ          → sempre positiva/negativa
    // ------------------------------------------------------------------ //
    function makeExp() {
        const a       = _ri(-2, 3);
        const hasRoot = _pick([true, false]);
        const sgn     = _pick([1, -1]);
        const ex      = a === 0 ? 'e^x' : `e^{${_xa(a)}}`;
        if (hasRoot) {
            const fn    = x => sgn * (Math.exp(x - a) - 1);
            const latex = sgn > 0 ? `f(x) = ${ex} - 1` : `f(x) = 1 - ${ex}`;
            return {
                family: 'exp', fn, latex,
                monBreaks: [], monParts: [sgn > 0 ? 'creixent' : 'decreixent'],
                signBreaks: [a], signParts: sgn > 0 ? ['negatiu', 'positiu'] : ['positiu', 'negatiu'],
                xRange: [a - 4, a + 4], yRange: sgn > 0 ? [-1.5, 14] : [-14, 1.5],
                keyPoints: [{ x: a, y: 0, type: 'root' }]
            };
        } else {
            const fn    = x => sgn * Math.exp(x - a);
            const latex = sgn > 0 ? `f(x) = ${ex}` : `f(x) = -${ex}`;
            return {
                family: 'exp', fn, latex,
                monBreaks: [], monParts: [sgn > 0 ? 'creixent' : 'decreixent'],
                signBreaks: [], signParts: [sgn > 0 ? 'positiu' : 'negatiu'],
                xRange: [a - 4, a + 4], yRange: sgn > 0 ? [-0.5, 14] : [-14, 0.5],
                keyPoints: []
            };
        }
    }

    // ------------------------------------------------------------------ //
    //  ARREL QUADRADA (domini ℝ)
    //    Sempre positiva/negativa:  ±√(x² + k)
    //    Amb arrels enteres:  triple pitagòric (a,b,r) → zeros ±r
    //      sgn > 0: √(x²+a²) − b,  mínim a x=0 (valor a−b < 0), zeros ±r
    //      sgn < 0: b − √(x²+a²),  màxim a x=0 (valor b−a > 0), zeros ±r
    // ------------------------------------------------------------------ //
    function makeSqrt() {
        const type = _pick(['always', 'roots']);
        const sgn  = _pick([1, -1]);
        if (type === 'always') {
            const k   = _pick([1, 4, 9]);
            const fn  = x => sgn * Math.sqrt(x * x + k);
            const sq  = `\\sqrt{x^2+${k}}`;
            const latex = sgn > 0 ? `f(x) = ${sq}` : `f(x) = -${sq}`;
            return {
                family: 'sqrt', fn, latex,
                monBreaks: [0], monParts: sgn > 0 ? ['decreixent', 'creixent'] : ['creixent', 'decreixent'],
                signBreaks: [], signParts: [sgn > 0 ? 'positiu' : 'negatiu'],
                xRange: [-5, 5], yRange: sgn > 0 ? [-0.5, 7] : [-7, 0.5],
                keyPoints: []
            };
        } else {
            // Triples pitagòrics: (3,5,4) i (4,5,3)  →  a²+r²=b²
            const [a, b, r] = _pick([[3, 5, 4], [4, 5, 3]]);
            if (sgn > 0) {
                const fn    = x => Math.sqrt(x * x + a * a) - b;
                const latex = `f(x) = \\sqrt{x^2+${a * a}} - ${b}`;
                return {
                    family: 'sqrt', fn, latex,
                    monBreaks: [0], monParts: ['decreixent', 'creixent'],
                    signBreaks: [-r, r], signParts: ['positiu', 'negatiu', 'positiu'],
                    xRange: [-r - 3, r + 3], yRange: [a - b - 1, 4],
                    keyPoints: [
                        { x: -r, y: 0, type: 'root' }, { x: r, y: 0, type: 'root' },
                        { x: 0, y: a - b, type: 'extremum' }
                    ]
                };
            } else {
                const fn    = x => b - Math.sqrt(x * x + a * a);
                const latex = `f(x) = ${b} - \\sqrt{x^2+${a * a}}`;
                return {
                    family: 'sqrt', fn, latex,
                    monBreaks: [0], monParts: ['creixent', 'decreixent'],
                    signBreaks: [-r, r], signParts: ['negatiu', 'positiu', 'negatiu'],
                    xRange: [-r - 3, r + 3], yRange: [-4, b - a + 1],
                    keyPoints: [
                        { x: -r, y: 0, type: 'root' }, { x: r, y: 0, type: 'root' },
                        { x: 0, y: b - a, type: 'extremum' }
                    ]
                };
            }
        }
    }

    // ------------------------------------------------------------------ //
    //  FUNCIONS RACIONALS (domini ℝ)
    //    'inv':     ±1/(x²+1)          — sempre d'un signe, extrem a x=0
    //    'xover':   ±x/(x²+1)          — arrel a x=0, extrems a x=±1
    //    'x2minus': (x²−r²)/(x²+1)     — zeros ±r, mínim a x=0
    // ------------------------------------------------------------------ //
    function makeRational() {
        const type = _pick(['inv', 'xover', 'x2minus']);
        if (type === 'inv') {
            const sgn = _pick([1, -1]);
            const fn  = x => sgn / (x * x + 1);
            const latex = sgn > 0
                ? `f(x) = \\dfrac{1}{x^2+1}`
                : `f(x) = \\dfrac{-1}{x^2+1}`;
            return {
                family: 'rational', fn, latex,
                monBreaks: [0], monParts: sgn > 0 ? ['creixent', 'decreixent'] : ['decreixent', 'creixent'],
                signBreaks: [], signParts: [sgn > 0 ? 'positiu' : 'negatiu'],
                xRange: [-5, 5], yRange: [-1.5, 1.5],
                keyPoints: [{ x: 0, y: sgn, type: 'extremum' }]
            };
        } else if (type === 'xover') {
            const sgn = _pick([1, -1]);
            const fn  = x => sgn * x / (x * x + 1);
            const latex = sgn > 0
                ? `f(x) = \\dfrac{x}{x^2+1}`
                : `f(x) = \\dfrac{-x}{x^2+1}`;
            return {
                family: 'rational', fn, latex,
                monBreaks: [-1, 1],
                monParts: sgn > 0 ? ['decreixent', 'creixent', 'decreixent'] : ['creixent', 'decreixent', 'creixent'],
                signBreaks: [0], signParts: sgn > 0 ? ['negatiu', 'positiu'] : ['positiu', 'negatiu'],
                xRange: [-5, 5], yRange: [-0.8, 0.8],
                keyPoints: [
                    { x: -1, y: -sgn * 0.5, type: 'extremum' },
                    { x:  0, y: 0,          type: 'root'      },
                    { x:  1, y:  sgn * 0.5, type: 'extremum'  }
                ]
            };
        } else {
            // (x² − r²) / (x² + 1): zero a ±r, mínim a x=0 (valor −r²)
            const r  = _pick([1, 2, 3]);
            const fn = x => (x * x - r * r) / (x * x + 1);
            const latex = `f(x) = \\dfrac{x^2-${r * r}}{x^2+1}`;
            return {
                family: 'rational', fn, latex,
                monBreaks: [0], monParts: ['decreixent', 'creixent'],
                signBreaks: [-r, r], signParts: ['positiu', 'negatiu', 'positiu'],
                xRange: [-r - 4, r + 4], yRange: [-r * r - 0.5, 1.5],
                keyPoints: [
                    { x: -r, y: 0,     type: 'root'     },
                    { x:  r, y: 0,     type: 'root'     },
                    { x:  0, y: -r*r,  type: 'extremum' }
                ]
            };
        }
    }

    // ------------------------------------------------------------------ //
    //  API PÚBLICA
    // ------------------------------------------------------------------ //
    function generateFunction(level) {
        const byLevel = {
            1: ['linear', 'quad2', 'quadNoRoots'],
            2: ['linear', 'quad2', 'quadNoRoots', 'cubicMono', 'cubicDouble'],
            3: ['linear', 'quad2', 'quadNoRoots', 'cubicMono', 'cubicDouble', 'exp', 'sqrt', 'rational'],
        };
        const t = _pick(byLevel[level] || byLevel[2]);
        switch (t) {
            case 'linear':      return makeLinear();
            case 'quad2':       return makeQuad2Roots();
            case 'quadNoRoots': return makeQuadNoRoots();
            case 'cubicMono':   return makeCubicMono();
            case 'cubicDouble': return makeCubicDouble();
            case 'exp':         return makeExp();
            case 'sqrt':        return makeSqrt();
            case 'rational':    return makeRational();
            default:            return makeLinear();
        }
    }

    return { generateFunction };
})();
