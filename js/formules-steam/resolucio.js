/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/resolucio.js
 * ROL: «Resolució pas a pas» de «Fórmules STEAM» (l'escenari B: l'alumne mira com
 *      s'aïlla una lletra d'una fórmula, a resolucio.html?activitat=formules-steam):
 *      el guió de la pissarra, pas a pas. Lliurament 16 del full de ruta, primera etapa
 *      de la pissarra; la segona (22/11/2026), el detall a demanda (vegeu la secció DETALL).
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM): passos(ex, { oberts }) torna la llista de passos de la
 *   pissarra (js/pissarra/formules.js guio i historial, en TeX, una línia per fila);
 *   exercici(formula) en genera un amb el mateix motor que l'activitat; NIVELLS són les
 *   fórmules per matèries ([clau, nom, matèria]: a resolucio.html es tria la matèria i després
 *   la fórmula, el David 24/11/2026), i exercici(formula) aïlla qualsevol lletra seva
 *   (math-engine.js generaPreguntaFS: la fórmula, la lletra i les dades).
 * - L'ordre és el de l'activitat (decisions del David del 17/11/2026: sempre un
 *   context, primer amb nombres i després les mateixes operacions amb lletres):
 *     1. la fórmula (la frase porta el context del problema);
 *     2. les dades al lloc de les lletres (cada lletra baixa i es torna el seu nombre);
 *     3. una línia per operació (la mateixa als dos membres) i, si la lletra queda a
 *        la dreta, girar la igualtat, en un pas a part;
 *     4. el valor (els nombres es fusionen en el resultat);
 *     5. la unitat, operant amb les unitats com si fossin lletres (cada nombre es torna
 *        la seva unitat), i el resultat amb la unitat (ressaltat). En una suma amb un
 *        nombre sol (T = t + 273) no hi ha càlcul d'unitats: la unitat és la de la fórmula;
 *     6. la fórmula una altra vegada i les mateixes operacions amb lletres; l'última
 *        línia, la fórmula de la lletra aïllada (ressaltada).
 * - Les peces: cada node de l'arbre de l'expressió (algebra.js) té un número per sempre
 *   (un WeakMap). Com que aillaPassos fa servir els mateixos nodes d'un pas al següent, la
 *   mateixa peça té el mateix id a totes les línies; els nombres de les dades i les unitats
 *   prenen el número de la seva lletra. Ids: a<n> una lletra, un nombre o una unitat;
 *   s<n> el signe d'un terme; p<n> el «·» davant d'un factor; h<n> el «·» de «½ ·»;
 *   e<n> l'exponent «2»; l<n> i r<n> els parèntesis; q el «=»; r el resultat; u la unitat.
 * - Només volen les peces que fan el canvi: el que passa a l'altre membre (multiplicant,
 *   dividint, sumant o restant, amb el seu signe), la lletra que perd el quadrat, les
 *   dades que entren, els nombres que es fusionen en el resultat; en girar, totes les
 *   lletres i els nombres (cada membre se'n va a l'altre costat).
 * - tests/formules-steam.test.js comprova milers d'exercicis de tots els nivells amb la
 *   bateria comuna (tests/pissarra-activitat.js): el guió és correcte, cada pas mou alguna
 *   peça i cada línia que es veu és certa amb les dades del problema.
 * DEPENDÈNCIES: pissarra/formules.js, algebra/racionals.js, algebra.js, cataleg.js,
 *      math-engine.js.
 * ============================================================================
 */
import { clau, guio, historial } from '../pissarra/formules.js';
import { texDecimal, textDecimal } from '../algebra/racionals.js';
import { aillaPassos, esMeitat, llegeixEquacio, substitueixEq, tex, texEq } from './algebra.js';
import { FORMULES, MATERIES, nomsDe, texDe } from './cataleg.js';
import { CASOS_FS, generaPreguntaFS } from './math-engine.js';

export const Resolucio = (() => {
    // ---- LES PECES ----
    //
    // Una línia és una llista d'elements: { id, tex, tipus } (una peça; tipus 'op' o 'rel' per als operadors i
    // el «=»), { fr: [numerador, denominador] }, { arrel: elements }, { quad: [base, peça de l'exponent] } o
    // { raw: tex } (TeX sense clau, p. ex. «\ » abans de la unitat).

    const P = (id, t, tipus = '') => ({ id, tex: t, tipus });

    /** El TeX d'una línia, amb la clau de cada peça (clauDe(id)). */
    function pinta(linia, clauDe) {
        const tros = es =>
            es
                .map(e => {
                    if (e.raw !== undefined) return e.raw;
                    if (e.fr) return `\\dfrac{${tros(e.fr[0])}}{${tros(e.fr[1])}}`;
                    if (e.arrel) return `\\sqrt{${tros(e.arrel)}}`;
                    if (e.quad) return `{${tros(e.quad[0])}}^{${tros([e.quad[1]])}}`;
                    if (e.cancel) return `\\cancel{${tros(e.cancel)}}`;
                    const t = clau(clauDe(e.id), e.tex);
                    return e.tipus === 'op' ? `\\mathbin{${t}}` : e.tipus === 'rel' ? `\\mathrel{${t}}` : t;
                })
                .join('');
        return tros(linia);
    }

    /** Els ids de les peces d'una línia, en ordre. */
    const idsDe = es =>
        es.flatMap(e =>
            e.raw !== undefined
                ? []
                : e.fr
                  ? [...idsDe(e.fr[0]), ...idsDe(e.fr[1])]
                  : e.arrel
                    ? idsDe(e.arrel)
                    : e.cancel
                      ? idsDe(e.cancel)
                      : e.quad
                        ? [...idsDe(e.quad[0]), e.quad[1].id]
                        : [e.id]
        );
    /** Només les lletres, els nombres i les unitats (les peces a<n>). */
    const fullesDe = es => idsDe(es).filter(id => /^a\d+$/.test(id));

    const esNum = e => e.t === 'num';
    const atomic = e => e.t === 'num' || e.t === 'var' || e.t === 'unit' || e.t === 'sqrt';
    const teFraccio = e =>
        e.t === 'div' ||
        (e.t === 'add' && e.terms.some(t => teFraccio(t.e))) ||
        (e.t === 'mul' && e.f.some(teFraccio)) ||
        (e.t === 'pow' && teFraccio(e.b));

    /**
     * Les peces d'un exercici: num(node) és el número del node (per sempre); iguala(nou, vell) fa que un node nou
     * (un nombre de les dades, una unitat) tingui el número del vell (la seva lletra).
     */
    function registre() {
        const nums = new WeakMap();
        let n = 0;
        const num = node => {
            if (!nums.has(node)) nums.set(node, ++n);
            return nums.get(node);
        };
        const iguala = (nou, vell) => nums.set(nou, num(vell));
        /** Els elements d'una expressió (com algebra.js tex, amb les peces). */
        function peces(e, L) {
            const k = num(e);
            const entre = x => {
                const gran = teFraccio(x);
                return [
                    P(`l${num(x)}`, gran ? '\\Bigl(' : '('),
                    ...peces(x, L),
                    P(`r${num(x)}`, gran ? '\\Bigr)' : ')'),
                ];
            };
            switch (e.t) {
                case 'num':
                    return [P(`a${k}`, texDecimal(e.v))];
                case 'var':
                    return [P(`a${k}`, L[e.n] || e.n)];
                case 'unit':
                    return [P(`a${k}`, e.tex)];
                case 'add':
                    return e.terms.flatMap(({ s, e: x }, j) => {
                        const cos = x.t === 'add' ? entre(x) : peces(x, L);
                        const signe = j > 0 || s < 0 ? [P(`s${num(x)}`, s < 0 ? '-' : '+', 'op')] : [];
                        return [...signe, ...cos];
                    });
                case 'mul':
                    return e.f.flatMap((x, j) => [
                        ...(j > 0 ? [P(`p${num(x)}`, '\\cdot', 'op')] : []),
                        ...(x.t === 'add' ? entre(x) : peces(x, L)),
                    ]);
                case 'div':
                    if (esMeitat(e))
                        return [
                            P(`a${num(e.d)}`, '\\tfrac{1}{2}'),
                            P(`h${k}`, '\\cdot', 'op'),
                            ...(e.n.t === 'add' ? entre(e.n) : peces(e.n, L)),
                        ];
                    return [{ fr: [peces(e.n, L), peces(e.d, L)] }];
                case 'pow':
                    return [
                        {
                            quad: [atomic(e.b) && e.b.t !== 'sqrt' ? peces(e.b, L) : entre(e.b), P(`e${k}`, '2')],
                        },
                    ];
                case 'sqrt':
                    return [{ arrel: peces(e.e, L) }];
            }
            throw new Error(`node desconegut ${e.t}`);
        }
        const equacio = ([a, b], L) => [...peces(a, L), P('q', '=', 'rel'), ...peces(b, L)];
        return { num, iguala, peces, equacio };
    }

    /** Recorre dos arbres de la mateixa forma (la fórmula i la mateixa amb les dades) i en dona les parelles. */
    function aparella(a, b, fes) {
        fes(a, b);
        if (a.t === 'add') a.terms.forEach((t, j) => aparella(t.e, b.terms[j].e, fes));
        else if (a.t === 'mul') a.f.forEach((x, j) => aparella(x, b.f[j], fes));
        else if (a.t === 'div') {
            aparella(a.n, b.n, fes);
            aparella(a.d, b.d, fes);
        } else if (a.t === 'pow') aparella(a.b, b.b, fes);
        else if (a.t === 'sqrt') aparella(a.e, b.e, fes);
    }

    /** Una còpia de l'expressió amb cada nombre de les dades canviat per la seva unitat (amb el seu número). */
    function ambUnitats(e, R, dades, unitats) {
        let r = e;
        const U = x => ambUnitats(x, R, dades, unitats);
        if (e.t === 'num' && dades.has(e)) {
            const [text, t] = unitats[dades.get(e)];
            r = { t: 'unit', text, tex: t };
        } else if (e.t === 'add') r = { t: 'add', terms: e.terms.map(({ s, e: x }) => ({ s, e: U(x) })) };
        else if (e.t === 'mul') r = { t: 'mul', f: e.f.map(U) };
        else if (e.t === 'div') r = { t: 'div', n: U(e.n), d: U(e.d) };
        else if (e.t === 'pow') r = { t: 'pow', b: U(e.b), e: 2 };
        else if (e.t === 'sqrt') r = { t: 'sqrt', e: U(e.e) };
        if (r !== e) R.iguala(r, e);
        return r;
    }

    /** Si hi ha una suma amb un nombre de la fórmula sol (T = t + 273): les unitats no s'hi poden operar. */
    const sumaAmbNombre = e =>
        (e.t === 'add' && e.terms.some(t => esNum(t.e) && !t.e.dada)) ||
        (e.t === 'add' && e.terms.some(t => sumaAmbNombre(t.e))) ||
        (e.t === 'mul' && e.f.some(sumaAmbNombre)) ||
        (e.t === 'div' && (sumaAmbNombre(e.n) || sumaAmbNombre(e.d))) ||
        (e.t === 'pow' && sumaAmbNombre(e.b)) ||
        (e.t === 'sqrt' && sumaAmbNombre(e.e));

    const SENSE_UNITATS = '(sense unitats)';
    /** A les frases (sota la pissarra), les fraccions petites (una \dfrac fa la línia de text massa alta). */
    const petit = t => t.replace(/\\dfrac/g, '\\frac');
    const majuscula = t => t.charAt(0).toUpperCase() + t.slice(1);

    // ---- ELS PASSOS ----

    /**
     * Tot el que cal per escriure un exercici: les línies (amb el pas que les escriu) en l'ordre de la pissarra.
     * Cada etapa: { tipus, linia, text, mou, fusiona, final }.
     */
    function etapes(ex) {
        const f = FORMULES.find(g => g.id === ex.formula);
        const { x, valors } = ex;
        const noms = nomsDe(f);
        const L = texDe(f);
        const ctx = f.aillar[x];
        const R = registre();
        const eq = llegeixEquacio(f.eq, noms);
        const coneguts = Object.fromEntries(noms.filter(k => k !== x).map(k => [k, valors[k]]));
        const eqNum = substitueixEq(eq, coneguts);
        // Els nombres de les dades prenen el número de la seva lletra (així la lletra «es torna» el nombre)
        const dades = new Map(); // node del nombre → nom de la lletra
        const dadesMogudes = [];
        for (let c = 0; c < 2; c++)
            aparella(eq[c], eqNum[c], (a, b) => {
                if (a === b) return;
                R.iguala(b, a);
                if (a.t === 'var' && b.t === 'num') {
                    dades.set(b, a.n);
                    dadesMogudes.push(`a${R.num(a)}`);
                }
            });
        const fmt = k => textDecimal(valors[k]);
        const uDe = k => ctx.unitats[k];
        const texDada = k =>
            `${L[k]} = ${texDecimal(valors[k])}${uDe(k)[0] === SENSE_UNITATS ? '' : `\\ ${uDe(k)[1]}`}`;
        const llista = ts => (ts.length > 1 ? `${ts.slice(0, -1).join(', ')} i ${ts[ts.length - 1]}` : ts[0]);
        const texX = L[x];
        const out = [];

        // 1. La fórmula, amb el context
        const formula = R.equacio(eq, L);
        out.push({
            tipus: 'formula',
            linia: formula,
            text: `${ctx.text(valors, fmt)} Aïlla $${texX}$ de la fórmula $${petit(texEq(eq, L))}$: primer, amb els nombres.`,
        });

        // 2. Les dades
        out.push({
            tipus: 'dades',
            linia: R.equacio(eqNum, L),
            text: `Escriu cada dada al lloc de la seva lletra: ${llista(Object.keys(coneguts).map(k => `$${texDada(k)}$`))}.`,
            mou: Object.fromEntries(dadesMogudes.map(id => [id, id])),
        });

        /** Les etapes de les operacions d'una cadena (passos d'aillaPassos), a partir de la línia d'abans. */
        function operacions(passos) {
            let anterior = out[out.length - 1].linia;
            passos.forEach(p => {
                const linia = R.equacio(p.despres, L);
                const vells = new Set(idsDe(anterior));
                const nous = new Set(idsDe(linia));
                const queden = ids => ids.filter(id => vells.has(id) && nous.has(id));
                // Volen les lletres i els nombres que passen a l'altre membre (i el signe dels termes, que canvia);
                // amb l'arrel, la lletra que perd el quadrat
                let mogudes;
                if (p.op.tipus === 'resta' || p.op.tipus === 'suma')
                    mogudes = p.op.mou.flatMap(t => [`s${R.num(t.e)}`, ...fullesDe(R.peces(t.e, L))]);
                else if (p.op.tipus === 'arrel') mogudes = fullesDe(R.peces(p.nouS, L));
                else mogudes = fullesDe(R.peces(p.op.per, L));
                out.push({
                    tipus: p.op.tipus,
                    linia,
                    text: fraseOperacio(p, x, L),
                    mou: Object.fromEntries(queden(mogudes).map(id => [id, id])),
                    detall: detallOperacio(p, x, L, R),
                });
                anterior = linia;
                if (p.gira) {
                    const girada = R.equacio([p.despres[1], p.despres[0]], L);
                    out.push({
                        tipus: 'gira',
                        linia: girada,
                        text: `Gira la igualtat: escriu $${texX}$ a l’esquerra.`,
                        mou: Object.fromEntries(fullesDe(linia).map(id => [id, id])),
                    });
                    anterior = girada;
                }
            });
        }

        // 3. Les operacions amb nombres
        const passosNum = aillaPassos(eqNum, x);
        operacions(passosNum);
        const ultim = passosNum[passosNum.length - 1].despres;
        const valorExpr = ultim[0].t === 'var' && ultim[0].n === x ? ultim[1] : ultim[0];
        const idX = `a${R.num(ultim[0].t === 'var' && ultim[0].n === x ? ultim[0] : ultim[1])}`;

        // 4. El valor
        const valorTex = texDecimal(valors[x]);
        out.push({
            tipus: 'valor',
            linia: [P(idX, texX), P('q', '=', 'rel'), P('r', valorTex)],
            text: `Fes les operacions: $${texX} = ${valorTex}$.`,
            fusiona: { r: fullesDe(R.peces(valorExpr, L)) },
            detall: detallValor(valorExpr, ultim, x, L, R, valorTex),
        });

        // 5. La unitat
        const [uText, uTex] = uDe(x);
        const senseUnitats = uText === SENSE_UNITATS;
        const unitatFinal = senseUnitats ? '\\text{sense unitats}' : uTex;
        // Sense càlcul d'unitats si hi ha una suma amb un nombre sol o una dada sense unitats (W · η no aclareix res)
        const dadesSenseUnitats = [...dades.values()].some(k => uDe(k)[0] === SENSE_UNITATS);
        if (!sumaAmbNombre(valorExpr) && !dadesSenseUnitats) {
            const expr = ambUnitats(valorExpr, R, dades, ctx.unitats);
            const linia = [
                { raw: `\\text{unitat de } ${texX}\\text{:}\\quad ` },
                ...R.peces(expr, L),
                P('q', '=', 'rel'),
                P('u', unitatFinal),
            ];
            const moguts = fullesDe(R.peces(expr, L)).filter(id => idsDe(out[out.length - 2].linia).includes(id));
            out.push({
                tipus: 'unitat',
                linia,
                text: senseUnitats
                    ? 'En quina unitat surt? Opera amb les unitats com si fossin lletres: se simplifiquen i el resultat no en té.'
                    : `En quina unitat surt? Opera amb les unitats com si fossin lletres: surt en ${uText}.`,
                // les unitats surten dels nombres de la línia d'abans del valor (dues línies amunt)
                mou: Object.fromEntries(moguts.map(id => [id, `${id}@2`])),
            });
        }
        const ambUnitat = out[out.length - 1].tipus === 'unitat';
        const resultat = [
            P(idX, texX),
            P('q', '=', 'rel'),
            P('r', valorTex),
            ...(senseUnitats ? [] : [{ raw: '\\ ' }, P('u', uTex)]),
        ];
        const resultatTex = `${texX} = ${valorTex}${senseUnitats ? '' : `\\ ${uTex}`}`;
        out.push({
            tipus: 'resultat',
            linia: resultat,
            text: senseUnitats
                ? `El resultat: $${resultatTex}$, sense unitats.`
                : ambUnitat
                  ? `El resultat, amb la unitat: $${resultatTex}$.`
                  : `${majuscula(f.lletres[x][1])} es mesura en ${uText}: $${resultatTex}$.`,
            mou: ambUnitat && !senseUnitats ? { r: 'r@2', u: 'u' } : { r: ambUnitat ? 'r@2' : 'r' },
            final: true,
        });

        // 6. Amb lletres: la fórmula una altra vegada (baixa de la primera línia) i les mateixes operacions
        out.push({
            tipus: 'lletres',
            linia: R.equacio(eq, L),
            text: 'Ara fes les mateixes operacions amb lletres: torna a escriure la fórmula.',
            mou: Object.fromEntries(fullesDe(formula).map(id => [id, `${id}@${out.length}`])),
        });
        const passosLletres = aillaPassos(eq, x);
        operacions(passosLletres);
        const fi = passosLletres[passosLletres.length - 1];
        const aillada = fi.gira ? [fi.despres[1], fi.despres[0]] : fi.despres;
        const darrera = out[out.length - 1];
        darrera.final = true;
        darrera.text += ` Ja tens la fórmula de ${f.lletres[x][1]}: $${petit(texEq(aillada, L))}$.`;
        return out;
    }

    // ---- DETALL A DEMANDA («Vull més detall»; decisions del David del 22/11/2026, B1–B4) ----
    //
    // Les operacions d'aïllar (també amb lletres) s'obren en dos subpassos i el pas:
    //   1. l'operació escrita als dos membres (80 · Δt = (240/Δt) · Δt; v₀ + a · t − v₀ = v − v₀);
    //   2. el que se simplifica, ratllat (\cancel): el que multiplica i divideix, o el que suma i resta;
    //   i llavors la línia del pas. L'arrel: √(v²) = √(…) i llavors v = √(…). Sense detall: la meitat (½ · …),
    //   la fórmula, les dades, girar la igualtat i la unitat. Les còpies de l'operació porten l'id de la peça
    //   amb un prefix: D (al membre de la lletra) i E (a l'altre, que és on queda).
    // El valor, quan hi ha més d'una operació: una per subpas, en l'ordre de la calculadora (2 · 150 : 6 →
    //   300 : 6 → 50); si algun resultat parcial no és un decimal curt, sense detall.

    /** Una còpia dels elements amb els ids amb prefix (la mateixa peça, en un altre lloc). */
    const copia = (es, pre) =>
        es.map(e =>
            e.raw !== undefined
                ? e
                : e.fr
                  ? { fr: [copia(e.fr[0], pre), copia(e.fr[1], pre)] }
                  : e.arrel
                    ? { arrel: copia(e.arrel, pre) }
                    : e.cancel
                      ? { cancel: copia(e.cancel, pre) }
                      : e.quad
                        ? { quad: [copia(e.quad[0], pre), copia([e.quad[1]], pre)[0]] }
                        : { ...e, id: pre + e.id }
        );
    const entreRaw = es => [{ raw: '\\Bigl(' }, ...es, { raw: '\\Bigr)' }];
    /** Els elements d'una expressió, entre parèntesis si és una suma (o una fracció, si es diu). */
    const ambParentesi = (e, es, fraccio = false) => (e.t === 'add' || (fraccio && e.t === 'div') ? entreRaw(es) : es);
    const desDe = ids => Object.fromEntries(ids.map(id => [id, id]));

    function detallOperacio(p, x, L, R) {
        const { op, S, O, costat } = p;
        const Q = P('q', '=', 'rel');
        const membres = (Sx, Ox) => (costat === 0 ? [...Sx, Q, ...Ox] : [...Ox, Q, ...Sx]);
        const T = e => `$${petit(tex(e, L))}$`;
        const xT = `$${L[x]}$`;
        const final = R.equacio(p.despres, L);
        if (op.tipus === 'multiplica') {
            if (esMeitat(S)) return null;
            const d = R.peces(S.d, L);
            const fd = fullesDe(d);
            if (2 * fd.length > 7) return null;
            const Dd = copia(d, 'D');
            const Ed = copia(d, 'E');
            const linia1 = membres(
                [...ambParentesi(S, R.peces(S, L), true), P('Dp', '\\cdot', 'op'), ...ambParentesi(S.d, Dd)],
                [...ambParentesi(O, R.peces(O, L)), P('Ep', '\\cdot', 'op'), ...ambParentesi(S.d, Ed)]
            );
            const linia2 = membres(
                [
                    { raw: '\\Bigl(' },
                    { fr: [R.peces(S.n, L), [{ cancel: d }]] },
                    { raw: '\\Bigr)' },
                    P('Dp', '\\cdot', 'op'),
                    { cancel: ambParentesi(S.d, Dd) },
                ],
                [...ambParentesi(O, R.peces(O, L)), P('Ep', '\\cdot', 'op'), ...ambParentesi(S.d, Ed)]
            );
            return {
                titol: 'Detall: la mateixa operació als dos membres',
                subpassos: [
                    {
                        linia: linia1,
                        text: `Multiplica els dos membres per ${T(S.d)}.`,
                        reparteix: Object.fromEntries(fd.map(id => [id, [`D${id}`, `E${id}`]])),
                    },
                    {
                        linia: linia2,
                        text: `Al membre de ${xT}, ${T(S.d)} divideix i multiplica: se simplifica.`,
                        mou: desDe([...fd, ...fd.map(id => `D${id}`)]),
                    },
                ],
                textAcaba: `Escriu el que queda: $${petit(texEq(p.despres, L))}$.`,
                acaba: {
                    mou: Object.fromEntries(fd.filter(id => idsDe(final).includes(id)).map(id => [id, `E${id}`])),
                },
            };
        }
        if (op.tipus === 'divideix') {
            const per = op.per;
            const pp = R.peces(per, L);
            const fp = fullesDe(pp);
            if (2 * fp.length > 7) return null;
            const Dp = copia(pp, 'D');
            const Ep = copia(pp, 'E');
            const linia1 = membres([{ fr: [R.peces(S, L), Dp] }], [{ fr: [R.peces(O, L), Ep] }]);
            // El numerador amb els factors sense la lletra ratllats
            const num = S.f.flatMap((f, j) => {
                const cos = f.t === 'add' ? entreRaw(R.peces(f, L)) : R.peces(f, L);
                const dot = j > 0 ? [P(`p${R.num(f)}`, '\\cdot', 'op')] : [];
                return contéX(f, x) ? [...dot, ...cos] : [...dot, { cancel: cos }];
            });
            const linia2 = membres([{ fr: [num, [{ cancel: Dp }]] }], [{ fr: [R.peces(O, L), Ep] }]);
            return {
                titol: 'Detall: la mateixa operació als dos membres',
                subpassos: [
                    {
                        linia: linia1,
                        text: `Divideix els dos membres per ${T(per)}.`,
                        reparteix: Object.fromEntries(fp.map(id => [id, [`D${id}`, `E${id}`]])),
                    },
                    {
                        linia: linia2,
                        text: `Al membre de ${xT}, ${T(per)} multiplica i divideix: se simplifica.`,
                        mou: desDe([...fp, ...fp.map(id => `D${id}`)]),
                    },
                ],
                textAcaba: `Escriu el que queda: $${petit(texEq(p.despres, L))}$.`,
                acaba: {
                    mou: Object.fromEntries(fp.filter(id => idsDe(final).includes(id)).map(id => [id, `E${id}`])),
                },
            };
        }
        if (op.tipus === 'resta' || op.tipus === 'suma') {
            const termes = op.mou; // els termes que passen a l'altre membre
            const fulles = termes.flatMap(t => fullesDe(R.peces(t.e, L)));
            if (2 * fulles.length > 7 || S.t !== 'add') return null;
            // Un terme amb el signe canviat (el que s'afegeix als dos membres), amb prefix
            const afegit = (t, pre) => [
                P(`${pre}s${R.num(t.e)}`, t.s > 0 ? '-' : '+', 'op'),
                ...copia(t.e.t === 'add' ? entreRaw(R.peces(t.e, L)) : R.peces(t.e, L), pre),
            ];
            const Op = R.peces(O, L);
            const altre = [...Op, ...termes.flatMap(t => afegit(t, 'E'))];
            const linia1 = membres([...R.peces(S, L), ...termes.flatMap(t => afegit(t, 'D'))], altre);
            const treu = new Set(termes.map(t => t.e));
            const sRatllat = S.terms.flatMap(({ s: sg, e }, j) => {
                const cos = e.t === 'add' ? entreRaw(R.peces(e, L)) : R.peces(e, L);
                const signe = j > 0 || sg < 0 ? [P(`s${R.num(e)}`, sg < 0 ? '-' : '+', 'op')] : [];
                return treu.has(e) ? [{ cancel: [...signe, ...cos] }] : [...signe, ...cos];
            });
            const linia2 = membres([...sRatllat, ...termes.map(t => ({ cancel: afegit(t, 'D') }))], altre);
            const perT = T(op.per);
            const idsFinal = new Set(idsDe(final));
            const acabaMou = {};
            for (const t of termes)
                for (const id of [`s${R.num(t.e)}`, ...fullesDe(R.peces(t.e, L))])
                    if (idsFinal.has(id)) acabaMou[id] = `E${id}`;
            return {
                titol: 'Detall: la mateixa operació als dos membres',
                subpassos: [
                    {
                        linia: linia1,
                        text: `${op.tipus === 'resta' ? 'Resta' : 'Suma'} ${perT} als dos membres.`,
                        reparteix: Object.fromEntries(fulles.map(id => [id, [`D${id}`, `E${id}`]])),
                    },
                    {
                        linia: linia2,
                        text: `Al membre de ${xT}, ${perT} suma i resta: s’anul·la (dona 0).`,
                        mou: desDe([...fulles, ...fulles.map(id => `D${id}`)]),
                    },
                ],
                textAcaba: `Escriu el que queda: $${petit(texEq(p.despres, L))}$.`,
                acaba: { mou: acabaMou },
            };
        }
        if (op.tipus === 'arrel') {
            const b = R.peces(S.b, L);
            const fb = fullesDe(b);
            const linia1 = membres([{ arrel: R.peces(S, L) }], [{ arrel: R.peces(O, L) }]);
            return {
                titol: 'Detall: la mateixa operació als dos membres',
                subpassos: [
                    {
                        linia: linia1,
                        text: 'Fes l’arrel quadrada dels dos membres.',
                        mou: desDe([...fb, `e${R.num(S)}`].filter(id => idsDe(linia1).includes(id)).slice(0, 7)),
                    },
                ],
                textAcaba: `L’arrel quadrada desfà el quadrat (la lletra és positiva): $${petit(texEq(p.despres, L))}$.`,
                acaba: { mou: desDe(fb.filter(id => idsDe(final).includes(id))) },
            };
        }
        return null;
    }

    /** Un decimal curt (com a molt 4 decimals) i no negatiu, o null. */
    const curt = v => {
        const r = Math.round(v * 1e4) / 1e4;
        return v >= 0 && Math.abs(v - r) < 1e-9 * Math.max(1, Math.abs(v)) ? r : null;
    };
    /**
     * Fa una operació de l'expressió (la primera, en l'ordre de la calculadora, que només té nombres):
     * { e: expressió nova, node: el node fet, valor, text } o null si ja és un nombre. node.v === undefined si
     * el resultat no és un decimal curt.
     */
    function unaOperacio(e) {
        const fet = (node, v, t) => ({ node, valor: v, text: t, nou: { t: 'num', v } });
        const T = n => texDecimal(n.v);
        if (esNum(e)) return null;
        if (e.t === 'add') {
            const k = e.terms.findIndex(t => !esNum(t.e));
            if (k >= 0) {
                const r = unaOperacio(e.terms[k].e);
                if (!r) return null;
                return { ...r, e: { t: 'add', terms: e.terms.map((t, j) => (j === k ? { s: t.s, e: r.e } : t)) } };
            }
            const [a, b, ...resta] = e.terms;
            const v = a.s * a.e.v + b.s * b.e.v;
            const f = fet(
                [a.e, b.e],
                v,
                `${a.s < 0 ? '-' : ''}${T(a.e)} ${b.s < 0 ? '-' : '+'} ${T(b.e)} = ${texDecimal(v)}`
            );
            const nou = resta.length ? { t: 'add', terms: [{ s: 1, e: f.nou }, ...resta] } : f.nou;
            return { ...f, e: nou };
        }
        if (e.t === 'mul') {
            const k = e.f.findIndex(g => !esNum(g));
            if (k >= 0) {
                const r = unaOperacio(e.f[k]);
                if (!r) return null;
                return { ...r, e: { t: 'mul', f: e.f.map((g, j) => (j === k ? r.e : g)) } };
            }
            const [a, b, ...resta] = e.f;
            const v = a.v * b.v;
            const f = fet([a, b], v, `${T(a)} \\cdot ${T(b)} = ${texDecimal(v)}`);
            return { ...f, e: resta.length ? { t: 'mul', f: [f.nou, ...resta] } : f.nou };
        }
        if (e.t === 'div') {
            for (const c of ['n', 'd'])
                if (!esNum(e[c])) {
                    const r = unaOperacio(e[c]);
                    if (!r) return null;
                    return { ...r, e: { ...e, [c]: r.e } };
                }
            const v = e.n.v / e.d.v;
            const f = fet([e.n, e.d], v, `${T(e.n)} : ${T(e.d)} = ${texDecimal(curt(v) ?? v)}`);
            return { ...f, e: f.nou };
        }
        if (e.t === 'pow' || e.t === 'sqrt') {
            const fill = e.t === 'pow' ? e.b : e.e;
            if (!esNum(fill)) {
                const r = unaOperacio(fill);
                if (!r) return null;
                return { ...r, e: e.t === 'pow' ? { ...e, b: r.e } : { ...e, e: r.e } };
            }
            const v = e.t === 'pow' ? fill.v ** 2 : Math.sqrt(fill.v);
            const t =
                e.t === 'pow' ? `${T(fill)}^2 = ${texDecimal(v)}` : `\\sqrt{${T(fill)}} = ${texDecimal(curt(v) ?? v)}`;
            const f = fet([fill], v, t);
            return { ...f, e: f.nou };
        }
        return null;
    }

    /** El detall del valor: una operació per subpas (si n'hi ha més d'una i tots els parcials són curts). */
    function detallValor(valorExpr, ultim, x, L, R, valorTex) {
        const xAEsquerra = ultim[0].t === 'var' && ultim[0].n === x;
        const nodeX = xAEsquerra ? ultim[0] : ultim[1];
        const linia = e => [P(`a${R.num(nodeX)}`, L[x]), P('q', '=', 'rel'), ...R.peces(e, L)];
        const passosV = [];
        let e = valorExpr;
        for (let guarda = 0; guarda < 10; guarda++) {
            const r = unaOperacio(e);
            if (!r) break;
            const v = curt(r.valor);
            if (v === null) return null;
            r.nou.v = v;
            passosV.push({ ...r, abans: e });
            e = r.e;
        }
        if (passosV.length < 2) return null;
        // Abans del primer subpas, la línia és la de l'última operació (o la girada): la lletra pot ser a la dreta
        const subpassos = passosV.slice(0, -1).map(r => ({
            linia: linia(r.e),
            text: `Calcula: $${r.text}$.`,
            fusiona: { [`a${R.num(r.nou)}`]: r.node.flatMap(n => fullesDe(R.peces(n, L))) },
        }));
        const darrer = passosV[passosV.length - 1];
        return {
            titol: 'Detall: les operacions, una a una',
            subpassos,
            textAcaba: `Calcula: $${darrer.text}$. Així, $${L[x]} = ${valorTex}$.`,
            acaba: { fusiona: { r: darrer.node.flatMap(n => fullesDe(R.peces(n, L))) } },
        };
    }

    /** La frase d'una operació: què hi ha al membre de la lletra i què es fa als dos membres. */
    function fraseOperacio(p, x, L) {
        const { op, S } = p;
        const T = e => `$${petit(tex(e, L))}$`;
        const per = op.per ? T(op.per) : '';
        const xT = `$${L[x]}$`;
        switch (op.tipus) {
            case 'multiplica':
                if (esMeitat(S)) return 'Hi ha un ½: multiplica els dos membres per 2.';
                return contéX(S.d, x)
                    ? `${xT} és al denominador: multiplica els dos membres per ${per}.`
                    : `Hi ha un denominador, ${per}: multiplica els dos membres per ${per}.`;
            case 'divideix':
                return `Hi ha un factor que multiplica, ${per}: divideix els dos membres per ${per}.`;
            case 'resta':
                return `Per treure ${per}, que suma, resta ${per} als dos membres.`;
            case 'suma':
                return `Per treure ${per}, que resta, suma ${per} als dos membres.`;
            case 'arrel':
                return 'Hi ha un quadrat: fes l’arrel quadrada dels dos membres (la positiva).';
        }
        throw new Error(`operació desconeguda ${op.tipus}`);
    }

    /** Si la lletra x és dins de l'expressió e. */
    const contéX = (e, x) =>
        e.t === 'var'
            ? e.n === x
            : e.t === 'add'
              ? e.terms.some(t => contéX(t.e, x))
              : e.t === 'mul'
                ? e.f.some(g => contéX(g, x))
                : e.t === 'div'
                  ? contéX(e.n, x) || contéX(e.d, x)
                  : e.t === 'pow'
                    ? contéX(e.b, x)
                    : e.t === 'sqrt'
                      ? contéX(e.e, x)
                      : false;

    /** Les files de la pissarra: totes les línies, amb tots els passos oberts. */
    const files = ex => etapes(ex).reduce((n, e) => n + 1 + (e.detall ? e.detall.subpassos.length : 0), 0);

    /**
     * El guió d'un exercici. oberts: els passos (els seus id, '3', '4'…) que s'escriuen amb el detall; mentre es
     * fan els subpassos, la línia del pas es veu en gris com a objectiu.
     */
    function passos(ex, { oberts = new Set() } = {}) {
        const llista = etapes(ex);
        const g = guio(files(ex));
        const H = historial(g, { prefix: 'S', pinta, oberts, objectiu: true });
        for (const e of llista) {
            const op = {
                ...(e.mou && Object.keys(e.mou).length ? { mou: e.mou } : {}),
                ...(e.fusiona ? { fusiona: e.fusiona } : {}),
                final: !!e.final,
            };
            const det = e.detall;
            if (det)
                Object.assign(op, {
                    titol: det.titol,
                    detall: D => {
                        for (const sp of det.subpassos)
                            D.escriu(sp.linia, sp.text, {
                                ...(sp.mou ? { mou: sp.mou } : {}),
                                ...(sp.fusiona ? { fusiona: sp.fusiona } : {}),
                                ...(sp.reparteix ? { reparteix: sp.reparteix } : {}),
                            });
                        D.acaba(det.textAcaba, det.acaba);
                    },
                });
            H.escriu(e.linia, e.text, op);
        }
        return g.passos;
    }

    /** Un exercici nou del nivell (1–4, com l'activitat), o del cas { f, x } que es digui. */
    /**
     * Un exercici nou. A resolucio.html, «nivell» és la clau d'una fórmula (NIVELLS: la matèria i després la
     * fórmula, el David 24/11/2026): surt aquella fórmula, aïllant qualsevol de les seves lletres. Un nombre de
     * l'1 al 4 encara dona un cas d'aquell nivell de dificultat (els tests), i cas, aquell cas exacte.
     */
    function exercici(nivell, cas = null) {
        const formula = typeof nivell === 'string' ? nivell : null;
        const { dades } = generaPreguntaFS(formula ? 1 : nivell, cas, { formula });
        return { nivell: dades.nivell, formula: dades.formula, x: dades.incognita, valors: dades.valors };
    }

    /** Les fórmules, per matèries (les de MATERIES, en aquest ordre): [clau, nom, matèria]. */
    const NIVELLS = Object.freeze(
        MATERIES.flatMap(([m]) => FORMULES.filter(f => f.materia === m).map(f => Object.freeze([f.id, f.nom, m])))
    );

    return Object.freeze({ NIVELLS, CASOS: CASOS_FS, exercici, passos, files, etapes, pinta });
})();
