/**
 * js/descripcio-grafica/function-engine.js
 * Genera especificacions de funcions per a l'activitat "Descripció d'una gràfica".
 *
 * Cada especificació inclou:
 *   family, fn, latex,
 *   monBreaks [], monParts []      — canvis de monotonia i sentit per interval
 *   signBreaks [], signParts []    — zeros i signe per interval
 *   concBreaks [], concParts []    — punts d'inflexió i concavitat per interval
 *   hasConcavity bool              — false → no es fa la pregunta de concavitat
 *   xRange [], yRange []           — finestra de visualització
 *   keyPoints []                   — {x, y, type:'root'|'extremum'|'inflexion'}
 *
 * Concavitats:
 *   linear    → hasConcavity=false  (f''=0)
 *   quad*     → constant (sense inflexió), hasConcavity=true
 *   cubicMono → inflexió entera a x=a
 *   cubicDouble→ inflexió entera a x=(p+2q)/3
 *   exp, sqrt → constant, hasConcavity=true
 *   rational  → hasConcavity=false  (inflexió irracional)
 */

window.FunctionEngine = (() => {
    'use strict';

    function _ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function _xa(a) {
        if (a === 0) return 'x';
        return a < 0 ? `x + ${-a}` : `x - ${a}`;
    }
    function _xap(a) {
        if (a === 0) return 'x';
        return a < 0 ? `(x + ${-a})` : `(x - ${a})`;
    }

    // ------------------------------------------------------------------ //
    //  LINEAL   f(x) = m(x − a)      f''= 0 → sense concavitat
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
            hasConcavity: false, concBreaks: [], concParts: [],
            xRange: [a - 5, a + 5], yRange: [-8, 8],
            keyPoints: [{ x: a, y: 0, type: 'root' }]
        };
    }

    // ------------------------------------------------------------------ //
    //  QUADRÀTICA 2 ARRELS   f(x) = ±(x−r1)(x−r2)
    //  f'' = ±2  → concavitat constant
    // ------------------------------------------------------------------ //
    function makeQuad2Roots() {
        const diff = _pick([2, 4, 6]);
        const r1 = _ri(-4, 4 - diff);
        const r2 = r1 + diff;
        const v  = (r1 + r2) / 2;
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
            hasConcavity: true,
            concBreaks: [], concParts: [sgn > 0 ? 'amunt' : 'avall'],
            xRange: [r1 - 3, r2 + 3], yRange: [Math.min(0, vy) - 2, Math.max(0, vy) + 2],
            keyPoints: [
                { x: r1, y: 0,  type: 'root'     },
                { x: r2, y: 0,  type: 'root'     },
                { x: v,  y: vy, type: 'extremum' }
            ]
        };
    }

    // ------------------------------------------------------------------ //
    //  QUADRÀTICA SENSE ARRELS   f(x) = ±((x−h)²+k)
    //  f'' = ±2  → concavitat constant
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
            hasConcavity: true,
            concBreaks: [], concParts: [sgn > 0 ? 'amunt' : 'avall'],
            xRange: [h - 5, h + 5], yRange: sgn > 0 ? [-2, k + 5] : [-(k + 5), 2],
            keyPoints: [{ x: h, y: sgn * k, type: 'extremum' }]
        };
    }

    // ------------------------------------------------------------------ //
    //  CÚBICA MONOTÒNICA   f(x) = ±(x−a)³
    //  f'' = ±6(x−a)  → inflexió entera a x=a
    //    sgn>0: avall a (−∞,a), amunt a (a,+∞)
    //    sgn<0: amunt a (−∞,a), avall a (a,+∞)
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
            hasConcavity: true,
            concBreaks: [a],
            concParts: sgn > 0 ? ['avall', 'amunt'] : ['amunt', 'avall'],
            xRange: [a - 3, a + 3], yRange: [-15, 15],
            keyPoints: [
                { x: a, y: 0, type: 'root'     },
                { x: a, y: 0, type: 'inflexion' }
            ]
        };
    }

    // ------------------------------------------------------------------ //
    //  CÚBICA AMB ARREL DOBLE   f(x) = ±(x−p)(x−q)²
    //  f'' = ±(6x − 2(p+2q))  → inflexió entera a x=(p+2q)/3
    //    sgn>0: avall a (−∞,infl), amunt a (infl,+∞)
    //    sgn<0: amunt a (−∞,infl), avall a (infl,+∞)
    // ------------------------------------------------------------------ //
    function makeCubicDouble() {
        const PAIRS = [
            [0, 3], [3, 0], [-3, 0], [0, -3],
            [-2, 1], [2, -1], [-1, 2], [1, -2]
        ];
        const [p, q] = _pick(PAIRS);
        const sgn = _pick([1, -1]);
        const fn  = sgn > 0 ? x => (x - p) * (x - q) ** 2 : x => -((x - p) * (x - q) ** 2);

        const ic   = (q + 2 * p) / 3;   // punt crític no-q
        const c_lo = Math.min(q, ic);
        const c_hi = Math.max(q, ic);

        const infl = (p + 2 * q) / 3;   // punt d'inflexió (sempre enter per construcció)

        const monParts = sgn > 0
            ? ['creixent', 'decreixent', 'creixent']
            : ['decreixent', 'creixent', 'decreixent'];
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
            hasConcavity: true,
            concBreaks: [infl],
            concParts: sgn > 0 ? ['avall', 'amunt'] : ['amunt', 'avall'],
            xRange: [Math.min(...xs) - 3, Math.max(...xs) + 3],
            yRange: [
                Math.max(Math.min(...ys) - 3, -25),
                Math.min(Math.max(...ys) + 3,  25)
            ],
            keyPoints: [
                { x: p,    y: 0,       type: 'root'     },
                ...(p !== q ? [{ x: q, y: 0, type: 'root' }] : []),
                { x: c_lo, y: fn(c_lo), type: 'extremum' },
                { x: c_hi, y: fn(c_hi), type: 'extremum' },
                { x: infl, y: fn(infl), type: 'inflexion' }
            ].filter(kp => isFinite(kp.x) && isFinite(kp.y))
        };
    }

    // ------------------------------------------------------------------ //
    //  EXPONENCIAL   f(x) = ±eˣ⁻ᵃ  o  ±(eˣ⁻ᵃ−1)
    //  f'' = ±eˣ⁻ᵃ  → sempre del mateix signe → concavitat constant
    // ------------------------------------------------------------------ //
    function makeExp() {
        const a       = _ri(-2, 3);
        const hasRoot = _pick([true, false]);
        const sgn     = _pick([1, -1]);
        const ex      = a === 0 ? 'e^x' : `e^{${_xa(a)}}`;
        const concParts = [sgn > 0 ? 'amunt' : 'avall'];
        if (hasRoot) {
            const fn    = x => sgn * (Math.exp(x - a) - 1);
            const latex = sgn > 0 ? `f(x) = ${ex} - 1` : `f(x) = 1 - ${ex}`;
            return {
                family: 'exp', fn, latex,
                monBreaks: [], monParts: [sgn > 0 ? 'creixent' : 'decreixent'],
                signBreaks: [a], signParts: sgn > 0 ? ['negatiu', 'positiu'] : ['positiu', 'negatiu'],
                hasConcavity: true, concBreaks: [], concParts,
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
                hasConcavity: true, concBreaks: [], concParts,
                xRange: [a - 4, a + 4], yRange: sgn > 0 ? [-0.5, 14] : [-14, 0.5],
                keyPoints: []
            };
        }
    }

    // ------------------------------------------------------------------ //
    //  ARREL QUADRADA (domini ℝ)
    //  f''(√(x²+k)) = k/(x²+k)^(3/2) > 0  → concavitat constant
    // ------------------------------------------------------------------ //
    function makeSqrt() {
        const type = _pick(['always', 'roots']);
        const sgn  = _pick([1, -1]);
        const concParts = [sgn > 0 ? 'amunt' : 'avall'];
        if (type === 'always') {
            const k   = _pick([1, 4, 9]);
            const fn  = x => sgn * Math.sqrt(x * x + k);
            const sq  = `\\sqrt{x^2+${k}}`;
            const latex = sgn > 0 ? `f(x) = ${sq}` : `f(x) = -${sq}`;
            return {
                family: 'sqrt', fn, latex,
                monBreaks: [0], monParts: sgn > 0 ? ['decreixent', 'creixent'] : ['creixent', 'decreixent'],
                signBreaks: [], signParts: [sgn > 0 ? 'positiu' : 'negatiu'],
                hasConcavity: true, concBreaks: [], concParts,
                xRange: [-5, 5], yRange: sgn > 0 ? [-0.5, 7] : [-7, 0.5],
                keyPoints: []
            };
        } else {
            const [a, b, r] = _pick([[3, 5, 4], [4, 5, 3]]);
            if (sgn > 0) {
                const fn    = x => Math.sqrt(x * x + a * a) - b;
                const latex = `f(x) = \\sqrt{x^2+${a * a}} - ${b}`;
                return {
                    family: 'sqrt', fn, latex,
                    monBreaks: [0], monParts: ['decreixent', 'creixent'],
                    signBreaks: [-r, r], signParts: ['positiu', 'negatiu', 'positiu'],
                    hasConcavity: true, concBreaks: [], concParts: ['amunt'],
                    xRange: [-r - 3, r + 3], yRange: [a - b - 1, 4],
                    keyPoints: [
                        { x: -r, y: 0,     type: 'root'     },
                        { x:  r, y: 0,     type: 'root'     },
                        { x:  0, y: a - b, type: 'extremum' }
                    ]
                };
            } else {
                const fn    = x => b - Math.sqrt(x * x + a * a);
                const latex = `f(x) = ${b} - \\sqrt{x^2+${a * a}}`;
                return {
                    family: 'sqrt', fn, latex,
                    monBreaks: [0], monParts: ['creixent', 'decreixent'],
                    signBreaks: [-r, r], signParts: ['negatiu', 'positiu', 'negatiu'],
                    hasConcavity: true, concBreaks: [], concParts: ['avall'],
                    xRange: [-r - 3, r + 3], yRange: [-4, b - a + 1],
                    keyPoints: [
                        { x: -r, y: 0,     type: 'root'     },
                        { x:  r, y: 0,     type: 'root'     },
                        { x:  0, y: b - a, type: 'extremum' }
                    ]
                };
            }
        }
    }

    // ------------------------------------------------------------------ //
    //  FUNCIONS RACIONALS (domini ℝ)   hasConcavity=false
    //  (els punts d'inflexió impliquen ±1/√3, no enters)
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
                hasConcavity: false, concBreaks: [], concParts: [],
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
                hasConcavity: false, concBreaks: [], concParts: [],
                xRange: [-5, 5], yRange: [-0.8, 0.8],
                keyPoints: [
                    { x: -1, y: -sgn * 0.5, type: 'extremum' },
                    { x:  0, y: 0,           type: 'root'     },
                    { x:  1, y:  sgn * 0.5,  type: 'extremum' }
                ]
            };
        } else {
            const r  = _pick([1, 2, 3]);
            const fn = x => (x * x - r * r) / (x * x + 1);
            const latex = `f(x) = \\dfrac{x^2-${r * r}}{x^2+1}`;
            return {
                family: 'rational', fn, latex,
                monBreaks: [0], monParts: ['decreixent', 'creixent'],
                signBreaks: [-r, r], signParts: ['positiu', 'negatiu', 'positiu'],
                hasConcavity: false, concBreaks: [], concParts: [],
                xRange: [-r - 4, r + 4], yRange: [-r * r - 0.5, 1.5],
                keyPoints: [
                    { x: -r, y: 0,    type: 'root'     },
                    { x:  r, y: 0,    type: 'root'     },
                    { x:  0, y: -r*r, type: 'extremum' }
                ]
            };
        }
    }

    // ------------------------------------------------------------------ //
    //  API PÚBLICA
    // ------------------------------------------------------------------ //

    // Famílies ponderades per nivell.
    // Quad + cubic lleugerament sobrerepresentades; les altres presents però menys.
    const WEIGHTED_FAMILIES = {
        1: [
            'linear',
            'quad2', 'quad2', 'quad2',
            'quadNoRoots', 'quadNoRoots', 'quadNoRoots',
        ],
        2: [
            'quad2', 'quad2', 'quad2',
            'quadNoRoots', 'quadNoRoots', 'quadNoRoots',
            'cubicMono', 'cubicMono', 'cubicMono',
            'cubicDouble', 'cubicDouble', 'cubicDouble',
        ],
        3: [
            'linear',
            'quad2', 'quad2', 'quad2',
            'quadNoRoots', 'quadNoRoots', 'quadNoRoots',
            'cubicMono', 'cubicMono', 'cubicMono',
            'cubicDouble', 'cubicDouble', 'cubicDouble',
            'exp', 'exp',
            'sqrt', 'sqrt',
            'rational', 'rational',
        ],
    };

    // Baralla per nivell: garanteix que totes les famílies surtin abans de repetir.
    // En sessions fixes (PRNG determinista), la baralla és reproducible I variada.
    const _deck = {};

    // Fisher-Yates in-place shuffle (usa Math.random, determinista en sessions fixes)
    function _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function _refillDeck(level) {
        const pool = [...(WEIGHTED_FAMILIES[level] || WEIGHTED_FAMILIES[2])];
        _shuffle(pool);

        if (level >= 2) {
            // Garanteix que les 2 primeres funcions tractades siguin cúbiques.
            // pop() treu del final → les cúbiques han d'anar al final de l'array.
            const cubicIdxs = [];
            for (let i = 0; i < pool.length && cubicIdxs.length < 2; i++) {
                if (pool[i].startsWith('cubic')) cubicIdxs.push(i);
            }
            // Retirem en ordre invers per no invalidar els índexs i afegim al final
            for (let i = cubicIdxs.length - 1; i >= 0; i--) {
                pool.push(pool.splice(cubicIdxs[i], 1)[0]);
            }
        }

        _deck[level] = pool;
    }

    function _dealFamily(level) {
        if (!_deck[level] || _deck[level].length === 0) _refillDeck(level);
        return _deck[level].pop();
    }

    function generateFunction(level) {
        const t = _dealFamily(level);
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
