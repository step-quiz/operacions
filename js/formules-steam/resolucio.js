/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/resolucio.js
 * ROL: «Resolució pas a pas» de «Fórmules STEAM» (l'escenari B: l'alumne mira com
 *      s'aïlla una lletra d'una fórmula, a resolucio.html?activitat=formules-steam):
 *      el guió de la pissarra, pas a pas. Lliurament 16 del full de ruta, primera etapa
 *      de la pissarra (sense detall a demanda).
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM): passos(ex, { oberts }) torna la llista de passos de la
 *   pissarra (js/pissarra/formules.js guio i historial, en TeX, una línia per fila);
 *   exercici(nivell) en genera un amb el mateix motor que l'activitat
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
import { FORMULES, nomsDe, texDe } from './cataleg.js';
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

    const files = ex => etapes(ex).length;

    function passos(ex, { oberts = new Set() } = {}) {
        const llista = etapes(ex);
        const g = guio(llista.length);
        const H = historial(g, { prefix: 'S', pinta, oberts, objectiu: true });
        for (const e of llista)
            H.escriu(e.linia, e.text, {
                ...(e.mou && Object.keys(e.mou).length ? { mou: e.mou } : {}),
                ...(e.fusiona ? { fusiona: e.fusiona } : {}),
                final: !!e.final,
            });
        return g.passos;
    }

    /** Un exercici nou del nivell (1–4, com l'activitat), o del cas { f, x } que es digui. */
    function exercici(nivell, cas = null) {
        const { dades } = generaPreguntaFS(nivell, cas);
        return { nivell: dades.nivell, formula: dades.formula, x: dades.incognita, valors: dades.valors };
    }

    return Object.freeze({ NIVELLS: [1, 2, 3, 4], CASOS: CASOS_FS, exercici, passos, files, etapes, pinta });
})();
