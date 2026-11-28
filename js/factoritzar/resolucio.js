/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/factoritzar/resolucio.js
 * ROL: «Resolució pas a pas» de «Descompondre en factors primers» (l'escenari B, a
 *      resolucio.html?activitat=factoritzar): l'arbre de factors que creix pas a pas
 *      (nivells 1–3) o les divisions en columna (nivell 4). Decisions del David
 *      (28/11/2026, revisió «Pissarra: arbre de factors», docs/pissarra/STATE.md decisió 24).
 * ARQUITECTURA:
 * - Mòdul PUR (sense DOM), exportat com a ResolucioFA (als tests tots els mòduls comparteixen
 *   un àmbit, tests/harness.js). exercici(nivell): el nombre de l'activitat
 *   (math-engine.js generateNumber; nivell 2 sempre amb un 7, nivell 3 sempre amb un 11);
 *   passos(ex, { oberts }): el guió (js/pissarra/formules.js historial, una sola fila HTML).
 * - Arbre: cada línia de l'historial és un tros de l'arbre (l'arrel o una partició en dos
 *   fills); envolta() els dibuixa tots dins d'un mateix <svg> amb la mida de l'arbre sencer
 *   des del primer pas (R4: res no canvia de mida). Els nombres són <text data-k>: el pare
 *   es reparteix volant als dos fills. Els primers queden encerclats (un sol color, C3) en el
 *   pas que els escriu. Partició «natural» (B1): la taula de multiplicar, la de l'11, acaba
 *   en 0, acaba en 5 i, si no, el primer més petit. Una branca sencera abans de la següent,
 *   d'esquerra a dreta (B4). Al final, les fulles volen directament a les potències (C1).
 * - Columna (nivell 4, B5): una fila per divisió, sempre pel primer més petit; el divisor
 *   s'escriu a la dreta de la fila de dalt (opció «anterior») i el quocient a sota.
 * - Detall a demanda (B2: el criteri de divisibilitat només amb «Vull més detall»): a cada
 *   partició o divisió, la raó (la taula, acaba en 0 o en 5, xifra parella, la suma de les
 *   xifres, provar de dividir) i el càlcul; a l'últim pas de l'arbre, un altre arbre del
 *   mateix nombre amb les mateixes fulles (C2), si n'hi ha cap.
 * - Les claus són les permanents de l'historial (L<id del pas>k<peça>): els moviments entre
 *   línies que no són consecutives es donen amb claus absolutes (opció extra).
 * - Cada línia porta data-eq (la igualtat que afirma, en text pla) i els primers encerclats
 *   data-primer: tests/factoritzar.test.js les comprova amb un model propi.
 * - ResolucioFA.eines: la llengua (el, El, del) i l'arbre (parteix, arbre, interiors, fulles, posicions i les
 *   mides DX, DY, R), per a la resolució del MCD i el mcm, que comença amb dos arbres.
 * DEPENDÈNCIES: pissarra/formules.js, factoritzar/math-engine.js.
 * ============================================================================
 */
import { guio, historial } from '../pissarra/formules.js';
import { generateNumber, isPrime, primeFactorization } from './math-engine.js';

export const ResolucioFA = (() => {
    // Els nivells (els noms són al registre, js/resolucio/activitats.js): 1–3 l'arbre, 4 la columna
    const NIVELLS = Object.freeze([1, 2, 3, 4]);

    // ---- EL NOMBRE ----

    /** El nombre d'un exercici: el de la pregunta de l'activitat; nivell 2 amb un 7 i nivell 3 amb un 11. */
    function exercici(nivell = 1) {
        const nv = Math.min(Math.max(Number(nivell) || 1, 1), 4);
        const cal = { 2: 7, 3: 11 }[nv];
        let n = 0;
        for (let i = 0; i < 400; i++) {
            n = generateNumber(nv === 4 ? i % 3 : nv - 1);
            if (!cal || n % cal === 0) break;
        }
        if (cal && n % cal) n = cal * 6; // no passa mai a la pràctica (400 intents)
        return { nivell: nv, n, columna: nv === 4 };
    }

    // ---- LA LLENGUA ----

    /** «el 60» o «l'80» / «l'11» / «l'8». */
    const comenca = n => n === 1 || n === 8 || n === 11 || (n >= 80 && n <= 89);
    const el = n => (comenca(n) ? `l'${n}` : `el ${n}`);
    const El = n => (comenca(n) ? `L'${n}` : `El ${n}`);
    const del = n => (comenca(n) ? `de l'${n}` : `del ${n}`);

    // ---- LES PARTICIONS ----

    /** El primer més petit que divideix n (n > 1). */
    const menor = n => {
        for (let p = 2; p * p <= n; p++) if (n % p === 0) return p;
        return n;
    };

    /**
     * La partició «natural» de n en dos factors (a ≤ b) i per què (B1): la taula de multiplicar (els dos factors
     * fins a 10, els més iguals possible), la de l'11 (fins a 11 · 12), acaba en 0, acaba en 5, el primer més petit.
     */
    function parteix(n) {
        for (let a = Math.floor(Math.sqrt(n)); a >= 2; a--)
            if (n % a === 0 && n / a <= 10) return { a, b: n / a, motiu: 'taula', t: a };
        if (n % 11 === 0 && n / 11 >= 2 && n / 11 <= 12)
            return { a: Math.min(11, n / 11), b: Math.max(11, n / 11), motiu: 'taula', t: 11 };
        if (n % 10 === 0) return ordena(n / 10, 10, 'zero', 10);
        if (n % 5 === 0) return ordena(5, n / 5, 'cinc', 5);
        const p = menor(n);
        return ordena(p, n / p, motiuPrimer(p), p);
    }
    const ordena = (x, y, motiu, d) => ({ a: Math.min(x, y), b: Math.max(x, y), motiu, d });
    const motiuPrimer = p => ({ 2: 'parell', 3: 'tres', 5: 'cinc' })[p] || 'prova';

    /** L'arbre de n: { v, cami, fills?: [esquerra, dreta], part? } (camí: 'r', 'r0', 'r01'…). */
    function arbre(n, cami = 'r', particio = parteix) {
        const node = { v: n, cami };
        if (isPrime(n)) return node;
        const part = particio(n);
        node.part = part;
        node.fills = [arbre(part.a, cami + '0'), arbre(part.b, cami + '1')];
        return node;
    }
    /** Els nodes amb fills, en l'ordre en què es parteixen (una branca sencera abans de la següent, B4). */
    function interiors(node, out = []) {
        if (!node.fills) return out;
        out.push(node);
        node.fills.forEach(f => interiors(f, out));
        return out;
    }
    const fulles = (node, out = []) => (node.fills ? node.fills.forEach(f => fulles(f, out)) : out.push(node), out);
    const profunditat = node => (node.fills ? 1 + Math.max(...node.fills.map(profunditat)) : 0);

    /** Un altre arbre de n (C2): una altra primera partició, si n'hi ha; null si n només té un arbre. */
    function unAltre(n) {
        const nat = parteix(n);
        for (let a = 2; a * a <= n; a++)
            if (n % a === 0 && a !== nat.a) return arbre(n, 'r', m => (m === n ? ordena(a, n / a, '', 0) : parteix(m)));
        return null;
    }

    // ---- EL DIBUIX DE L'ARBRE ----

    const DX = 50; // amplada d'una fulla (unitats de l'SVG; la lletra fa 20)
    const DY = 62; // alçada d'un pis
    const R = 15; // radi del cercle d'un primer

    /** Les posicions de tots els nodes: les fulles d'esquerra a dreta; un pare, al mig dels seus fills. */
    function posicions(arrel) {
        const pos = new Map();
        let i = 0;
        const col = (node, d) => {
            if (node.fills) {
                node.fills.forEach(f => col(f, d + 1));
                const [e, f] = node.fills.map(x => pos.get(x.cami).x);
                pos.set(node.cami, { x: (e + f) / 2, y: d * DY + 26 });
            } else pos.set(node.cami, { x: (i++ + 0.5) * DX, y: d * DY + 26 });
        };
        col(arrel, 0);
        return { pos, w: i * DX, h: profunditat(arrel) * DY + 52 };
    }

    const dk = k => (k ? ` data-k="${k}"` : '');
    const textNode = (p, v, k, primer) =>
        (primer ? `<circle class="jp-fa-cercle" cx="${p.x}" cy="${p.y}" r="${R}"/>` : '') +
        `<text class="jp-fa-n${primer ? ' jp-fa-primer' : ''}"${primer ? ` data-primer="${v}"` : ''}${dk(k)}` +
        ` x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central">${v}</text>`;
    const branca = (p, q) =>
        `<line class="jp-fa-branca" x1="${p.x}" y1="${p.y + 14}" x2="${q.x}" y2="${q.y - (R + 2)}"/>`;

    /** Un tros de l'arbre: l'arrel o una partició (les branques, els dos fills i el punt entre ells). */
    function trosArbre(l, clauDe, pos, classe) {
        const cls = `jp-fa-tros${classe ? ' ' + classe : ''}`;
        if (l.tipus === 'arrel') return `<g class="${cls}">${textNode(pos.get('r'), l.v, clauDe('n'))}</g>`;
        const p = pos.get(l.cami);
        const [qa, qb] = [pos.get(l.cami + '0'), pos.get(l.cami + '1')];
        const [a, b] = l.fills;
        const primers = l.fills.filter(isPrime);
        return (
            `<g class="${cls}" data-eq="${l.v}=${a}*${b}" data-primers="${primers.join(',')}">` +
            branca(p, qa) +
            branca(p, qb) +
            `<text class="jp-fa-punt" x="${(qa.x + qb.x) / 2}" y="${qa.y}" text-anchor="middle" dominant-baseline="central">·</text>` +
            textNode(qa, a, clauDe('a'), isPrime(a)) +
            textNode(qb, b, clauDe('b'), isPrime(b)) +
            '</g>'
        );
    }

    /** Un arbre sencer petit (el de C2, dins del calaix): l'arrel amb clau «n» i les fulles «f0», «f1»… */
    function arbrePetit(arrel, clauDe) {
        const { pos, w, h } = posicions(arrel);
        const parts = [];
        const eqs = [];
        let f = 0;
        const dibuixa = node => {
            const p = pos.get(node.cami);
            const k = node.cami === 'r' ? clauDe('n') : node.fills ? null : clauDe('f' + f++);
            parts.push(textNode(p, node.v, k, !node.fills));
            if (node.fills) {
                eqs.push(`${node.v}=${node.fills[0].v}*${node.fills[1].v}`);
                node.fills.forEach(x => parts.push(branca(p, pos.get(x.cami))));
                node.fills.forEach(dibuixa);
            }
        };
        dibuixa(arrel);
        return (
            `<div class="jp-fa-altre" data-eq="${eqs.join(';')}">` +
            `<svg class="jp-fa-svg" viewBox="0 0 ${w} ${h}" style="width:${w / 20}em" role="img" aria-label="Un altre arbre ${del(arrel.v)}">` +
            parts.join('') +
            '</svg></div>'
        );
    }

    // ---- LES LÍNIES DE TEXT (càlculs del detall, la columna i el resultat) ----

    /** Una línia de text: peces { id, v } (amb clau) o text sense clau; eq: la igualtat que afirma. */
    function liniaHtml(l, clauDe, classe, base) {
        const cos = l.peces.map(p => (typeof p === 'string' ? p : `<span${dk(clauDe(p.id))}>${p.v}</span>`)).join('');
        return `<div class="${base}${classe ? ' ' + classe : ''}"${l.eq ? ` data-eq="${l.eq}"` : ''}>${cos}</div>`;
    }
    const calc = (peces, eq) => ({ tipus: 'calc', peces, eq });

    /** El resultat amb potències (C1): n = 2² · 3 · 5; peces «n» i «p<primer>». */
    function producte(n) {
        const f = primeFactorization(n);
        const primers = Object.keys(f)
            .map(Number)
            .sort((x, y) => x - y);
        const peces = [{ id: 'n', v: n }, ' = '];
        primers.forEach((p, i) => {
            if (i) peces.push(' · ');
            peces.push({ id: 'p' + p, v: f[p] > 1 ? `${p}<sup>${f[p]}</sup>` : String(p) });
        });
        const eq = `${n}=${primers.map(p => (f[p] > 1 ? `${p}^${f[p]}` : p)).join('*')}`;
        return { tipus: 'producte', peces, eq, primers, f };
    }
    /** «ordenades; les que es repeteixen, en forma de potència» o, si no se'n repeteix cap, «de menor a major». */
    const repetits = ({ primers, f }, quins) =>
        primers.some(p => f[p] > 1) ? `de menor a major i ${quins}, en forma de potència` : 'de menor a major';
    const texProducte = ({ primers, f }) => primers.map(p => (f[p] > 1 ? `${p}^{${f[p]}}` : p)).join(' \\cdot ');

    // ---- EL PINTOR ----

    function pintador(ex, pos) {
        return (l, clauDe, classe) => {
            if (l.tipus === 'arrel' || l.tipus === 'parteix') return trosArbre(l, clauDe, pos, classe);
            if (l.tipus === 'altre') return arbrePetit(l.arbre, clauDe);
            if (l.tipus === 'fila') {
                const n = `<span class="jp-fa-col-n"${dk(clauDe('n'))}>${l.n}</span>`;
                const p = l.p
                    ? `<span class="jp-fa-col-p"${dk(clauDe('p'))}>${l.p}</span>`
                    : '<span class="jp-fa-col-p"></span>';
                const eq = l.p ? ` data-eq="${l.n}:${l.p}=${l.n / l.p}" data-menor="${l.n}:${l.p}"` : '';
                return `<div class="jp-fa-col${classe ? ' ' + classe : ''}"${eq}>${n}${p}</div>`;
            }
            return liniaHtml(l, clauDe, classe, l.tipus === 'producte' ? 'jp-fa-prod' : 'jp-fa-calc');
        };
    }

    /** Totes les línies en una sola fila HTML: els trossos de l'arbre dins d'un <svg>, la resta a sota. */
    function envoltador(ex, mides) {
        return textos => {
            const arbreSvg = mides
                ? `<svg class="jp-fa-svg jp-fa-arbre" viewBox="0 0 ${mides.w} ${mides.h}" style="width:${mides.w / 20}em" role="img" aria-label="Arbre de factors ${del(ex.n)}">` +
                  textos.filter(t => t.startsWith('<g')).join('') +
                  '</svg>'
                : '';
            const resta = textos.filter(t => !t.startsWith('<g')).join('');
            return `<div class="jp-fa${ex.columna ? ' jp-fa-columna' : ''}">${arbreSvg}${resta}</div>`;
        };
    }

    // ---- EL DETALL: PER QUÈ ES POT DIVIDIR (B2) ----

    /**
     * Els subpassos d'una partició n = a · b (o d'una divisió n : d = q a la columna): el criteri i el càlcul. nK:
     * la clau del nombre n (on és escrit); torna els subpassos [{ linia, text, extra (claus relatives a la línia
     * nova), fills }]: fills, les peces de la darrera línia que van al fill esquerre i al dret (a ≤ b) de l'arbre;
     * a la columna, el quocient és la peça «q».
     */
    function perQue(n, part, nK) {
        const { motiu } = part;
        if (motiu === 'taula') {
            const { a, b, t } = part;
            const [x, y] = t === a ? [a, b] : [b, a]; // primer el de la taula
            return [
                {
                    linia: calc(
                        [{ id: 'x', v: x }, ' · ', { id: 'y', v: y }, ' = ', { id: 'n', v: n }],
                        `${x}*${y}=${n}`
                    ),
                    text: `${El(n)} és a la taula ${del(t)}: ${x} · ${y} = ${n}.`,
                    extra: { reanomena: { n: nK } },
                    fills: t === a ? ['x', 'y'] : ['y', 'x'],
                },
            ];
        }
        const d = part.d;
        const q = n / d;
        const divisio = {
            linia: calc([{ id: 'n', v: n }, ' : ', { id: 'd', v: d }, ' = ', { id: 'q', v: q }], `${n}:${d}=${q}`),
            extra: { reanomena: { n: nK } },
            fills: d <= q ? ['d', 'q'] : ['q', 'd'],
        };
        if (motiu === 'zero')
            return [{ ...divisio, text: `${El(n)} acaba en 0: és múltiple de 10. Divideix-lo entre 10.` }];
        if (motiu === 'cinc')
            return [
                {
                    ...divisio,
                    text: `${El(n)} acaba en ${n % 10}: és múltiple de 5. Divideix-lo entre 5.`,
                },
            ];
        if (motiu === 'parell')
            return [{ ...divisio, text: `${El(n)} acaba en xifra parella: és múltiple de 2. Divideix-lo entre 2.` }];
        if (motiu === 'tres') {
            const xifres = String(n).split('').map(Number);
            const s = xifres.reduce((x, y) => x + y, 0);
            const peces = [];
            xifres.forEach((x, i) => {
                if (i) peces.push(' + ');
                peces.push({ id: 'x' + i, v: x });
            });
            peces.push(' = ', { id: 's', v: s });
            return [
                {
                    linia: calc(peces, `${xifres.join('+')}=${s}`),
                    text: `Suma les xifres ${del(n)}: ${xifres.join(' + ')} = ${s}.`,
                    extra: { reparteix: { [nK]: xifres.map((x, i) => 'x' + i) } },
                },
                {
                    ...divisio,
                    text: `${El(s)} és múltiple de 3: ${el(n)} també. Divideix-lo entre 3.`,
                },
            ];
        }
        // Un primer que no té criteri a 1r d'ESO (7, 11): provar de dividir
        return [{ ...divisio, text: `Prova de dividir ${el(n)} entre ${d}: la divisió és exacta.` }];
    }

    // ---- EL GUIÓ ----

    const K = (idLinia, peca) => `L${String(idLinia).toUpperCase()}k${peca}`;

    /** Les claus absolutes de l'extra: les peces noves (relatives) passen a la clau de la línia que s'escriu. */
    function absolutes(extra, idNova) {
        const out = {};
        for (const [nom, m] of Object.entries(extra || {})) {
            out[nom] = {};
            for (const [x, y] of Object.entries(m))
                if (nom === 'reparteix') out[nom][x] = y.map(id => K(idNova, id));
                else out[nom][K(idNova, x)] = y;
        }
        return out;
    }

    function passos(ex, { oberts = new Set() } = {}) {
        return ex.columna ? passosColumna(ex, oberts) : passosArbre(ex, oberts);
    }

    function passosArbre(ex, oberts) {
        const n = ex.n;
        const arrel = arbre(n);
        const { pos, w, h } = posicions(arrel);
        const g = guio(1);
        const H = historial(g, {
            pinta: pintador(ex, pos),
            envolta: envoltador(ex, { w, h }),
            oberts,
            objectiu: true,
        });
        let pas = 0;
        const clauNode = new Map(); // camí → la clau del seu nombre
        H.escriu({ tipus: 'arrel', v: n }, `Descompon ${el(n)} en factors primers: fes-ne l'arbre.`);
        clauNode.set('r', K(++pas, 'n'));

        for (const node of interiors(arrel)) {
            const id = String(++pas);
            const [a, b] = node.fills.map(f => f.v);
            const linia = { tipus: 'parteix', v: node.v, cami: node.cami, fills: [a, b] };
            const nK = clauNode.get(node.cami);
            const primers = [a, b].filter(isPrime);
            const notaPrimers = !primers.length
                ? ''
                : primers.length === 2
                  ? a === b
                      ? ` ${El(a)} és primer: aquestes branques s'acaben.`
                      : ` ${El(a)} i ${el(b)} són primers: aquestes branques s'acaben.`
                  : ` ${El(primers[0])} és primer: aquesta branca s'acaba.`;
            const text = `Parteix ${el(node.v)} en dos factors: $${node.v} = ${a} \\cdot ${b}$.${notaPrimers}`;
            const sub = perQue(node.v, node.part, nK);
            H.escriu(linia, text, {
                titol: `Per què es pot partir ${el(node.v)}`,
                extra: { reparteix: { [nK]: [K(id, 'a'), K(id, 'b')] } },
                detall: D => {
                    sub.forEach((s, i) => {
                        const ids = `${id}${'abcdefgh'[i]}`;
                        // el primer subpas de «tres» reparteix el nombre a les xifres; el segon el torna a portar
                        D.escriu(s.linia, s.text, { extra: absolutes(s.extra, ids) });
                    });
                    const darrer = sub[sub.length - 1];
                    D.acaba(`Per tant, $${node.v} = ${a} \\cdot ${b}$.${notaPrimers}`, {
                        mou: { a: darrer.fills[0], b: darrer.fills[1] },
                    });
                },
            });
            node.fills.forEach((f, i) => clauNode.set(f.cami, K(id, i ? 'b' : 'a')));
        }

        // El resultat (C1): les fulles volen directament a les potències
        const prod = producte(n);
        const id = String(pas + 1);
        const deFulles = arbreFulles => {
            const fusiona = {};
            arbreFulles.forEach(([v, k]) => (fusiona['p' + v] = fusiona['p' + v] || []).push(k));
            return fusiona;
        };
        const fullesMain = fulles(arrel).map(f => [f.v, clauNode.get(f.cami)]);
        const fusiona = deFulles(fullesMain);
        const textFinal = `Escriu ${el(n)} amb les fulles de l'arbre, ${repetits(prod, 'les que es repeteixen')}: $${n} = ${texProducte(prod)}$.`;
        const altre = unAltre(n);
        H.escriu(prod, textFinal, {
            extra: {
                fusiona: Object.fromEntries(Object.entries(fusiona).map(([p, ks]) => [K(id, p), ks])),
                reanomena: { [K(id, 'n')]: clauNode.get('r') },
            },
            final: true,
            titol: `Un altre arbre ${del(n)}`,
            detall: altre
                ? D => {
                      const sid = id + 'a';
                      const [x, y] = altre.fills.map(f => f.v);
                      D.escriu(
                          { tipus: 'altre', arbre: altre },
                          `Un altre arbre ${del(n)}: comença per ${n} = ${x} · ${y} en lloc de ${n} = ${arrel.fills[0].v} · ${arrel.fills[1].v}.`,
                          { extra: { reanomena: { [K(sid, 'n')]: clauNode.get('r') } } }
                      );
                      const fa = fulles(altre).map((f, i) => [f.v, K(sid, 'f' + i)]);
                      D.acaba(`Les fulles són les mateixes: $${n} = ${texProducte(prod)}$, comencis com comencis.`, {
                          extra: {
                              fusiona: Object.fromEntries(
                                  Object.entries(deFulles(fa)).map(([p, ks]) => [K(id, p), ks])
                              ),
                              reanomena: { [K(id, 'n')]: K(sid, 'n') },
                          },
                      });
                  }
                : undefined,
        });
        return g.passos;
    }

    function passosColumna(ex, oberts) {
        const n = ex.n;
        const g = guio(1);
        const H = historial(g, { pinta: pintador(ex, null), envolta: envoltador(ex, null), oberts, objectiu: true });
        let pas = 0;
        H.escriu({ tipus: 'fila', n }, `Descompon ${el(n)} en factors primers: divideix-lo en columna.`);
        let fila = { tipus: 'fila', n, id: String(++pas) };
        const divisors = [];
        while (fila.n > 1) {
            const m = fila.n;
            const d = menor(m);
            const q = m / d;
            const id = String(++pas);
            const primer = isPrime(m);
            const text = primer
                ? `${El(m)} és primer: divideix-lo entre ell mateix, $${m} : ${m} = 1$.`
                : `Divideix ${el(m)} entre ${d}, el primer més petit que el divideix: $${m} : ${d} = ${q}$.`;
            const nK = K(fila.id, 'n');
            const part = { d, motiu: primer ? 'primer' : motiuPrimer(d) };
            const sub = primer ? null : perQue(m, part, nK);
            const anterior = { tipus: 'fila', n: m, p: d };
            divisors.push([d, K(fila.id, 'p')]);
            H.escriu({ tipus: 'fila', n: q }, text, {
                anterior,
                titol: `Per què es pot dividir ${el(m)} entre ${d}`,
                extra: { reanomena: { [K(id, 'n')]: nK } },
                detall: sub
                    ? D => {
                          sub.forEach((s, i) => {
                              const ids = `${id}${'abcdefgh'[i]}`;
                              D.escriu(s.linia, s.text, { extra: absolutes(s.extra, ids) });
                          });
                          D.acaba(`Escriu ${el(d)} a la dreta ${del(m)} i el quocient, ${q}, a sota.`, {
                              mou: { n: 'q' },
                          });
                      }
                    : undefined,
            });
            fila = { tipus: 'fila', n: q, id };
        }
        // El resultat: els divisors de la columna volen a les potències
        const prod = producte(n);
        const id = String(pas + 1);
        const fusiona = {};
        divisors.forEach(([p, k]) => (fusiona[K(id, 'p' + p)] = fusiona[K(id, 'p' + p)] || []).push(k));
        H.escriu(
            prod,
            `Escriu ${el(n)} amb els divisors de la columna, ${repetits(prod, 'els que es repeteixen')}: $${n} = ${texProducte(prod)}$.`,
            { extra: { fusiona, reanomena: { [K(id, 'n')]: K('1', 'n') } }, final: true }
        );
        return g.passos;
    }

    // Les eines de l'arbre, compartides amb la resolució del MCD i el mcm (js/mcd-mcm/resolucio.js)
    const eines = Object.freeze({ el, El, del, parteix, arbre, interiors, fulles, posicions, DX, DY, R });
    return Object.freeze({ NIVELLS, exercici, passos, files: () => 1, parteix, arbre, unAltre, eines });
})();
