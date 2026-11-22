/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/formules.js
 * ROL: «Resolució pas a pas» — fórmules amb CLAUS i GUIONS dels passos.
 *      Mòdul PUR (sense DOM ni window): el fan servir els procediments de cada
 *      activitat per escriure què hi ha a la pissarra després de cada pas, i
 *      els tests per comprovar-ho.
 * ARQUITECTURA:
 * - Un procediment és una funció pura dades → llista de passos. Un pas és
 *     { files: ['TeX', '§text', ''], classes: ['', 'final', ''], text: 'Frase amb $TeX$.',
 *       reanomena?: {nova: 'vella'}, fusiona?: {nova: ['vella1', 'vella2']},
 *       reparteix?: {vella: ['nova1', 'nova2']}, copia?: {nova: 'vella'},
 *       cursor?: {clic: 'k'} | {arrossega: 'k', fins: 'k2'}, anunci?: 'text' }
 *   i la pissarra (pissarra.js) anima la diferència entre dos passos seguits.
 * - Cada símbol que s'ha de poder seguir d'un pas al següent porta una CLAU:
 *   \htmlData{k=<clau>}{<símbol>}. Mateixa clau abans i després → el símbol es
 *   desplaça; fusiona → els vells van a parar al nou; reparteix → el vell vola a
 *   cada nou; la resta s'esvaeix o apareix. Una clau és única dins d'un pas
 *   (sumant totes les files).
 * - historial() (secció 4) escriu les línies que queden escrites, en TeX o amb
 *   l'HTML d'una activitat, i hi posa les claus, les còpies i el detall a demanda.
 * - Origen: és el motor dels procediments animats del repositori step-quiz/pau
 *   (procediments/formules.js, octubre 2026), passat a mòdul ES. Aquí només hi
 *   ha la part comuna a totes les matèries; els escriptors propis d'una activitat
 *   (polinomis, fraccions…) s'hi afegiran quan una activitat els necessiti.
 *   Explicació completa: docs/pissarra/MOTOR.md.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

// ── 1. CLAUS ─────────────────────────────────────────────────────────────────

export const CLAU_VALIDA = /^[A-Za-z][A-Za-z0-9]*$/;

/**
 * Les marques d'un símbol (un fons de color, a css/pissarra.css). Els colors volen
 * dir sempre el mateix: mes = verd (triat, positiu), menys = vermell (eliminat,
 * negatiu), tria = groc (afegit, el que es comprova), actual = lila (el que es
 * calcula ara), solucio = lila (les solucions trobades), cami0/1/2 = un color per
 * camí d'un arbre (blau, rosa, cian).
 */
export const MARQUES = new Set(['mes', 'menys', 'tria', 'cami0', 'cami1', 'cami2', 'actual', 'solucio']);

/** Símbol amb clau, i potser amb una marca: \htmlData{k=a11,marca=mes}{m}. */
export function clau(k, tex, marca = '') {
    if (!CLAU_VALIDA.test(k)) throw new Error(`Clau no vàlida: «${k}»`);
    if (marca && !MARQUES.has(marca)) throw new Error(`Marca no vàlida: «${marca}»`);
    return `\\htmlData{k=${k}${marca ? ',marca=' + marca : ''}}{${tex}}`;
}

/** Una marca de color sense clau, per a un tros d'un símbol que ja en té (no es mou sol). */
export function marca(tex, m) {
    if (!MARQUES.has(m)) throw new Error(`Marca no vàlida: «${m}»`);
    return `\\htmlData{marca=${m}}{${tex}}`;
}

/** Operador binari amb clau («+», «−», «·»): conserva l'espaiat de TeX. */
export const op = (k, tex) => `\\mathbin{${clau(k, tex)}}`;

/** Relació amb clau («=»): conserva l'espaiat de TeX. */
export const rel = (k, tex) => `\\mathrel{${clau(k, tex)}}`;

/** Un tros tatxat en vermell (una solució que no serveix, un factor que se simplifica). */
export const tatxa = tex => `\\textcolor{#b91c1c}{\\cancel{${tex}}}`;

const RELACIONS = new Set(['=', '<', '>']);
const OPERADORS = new Set(['+', '-', '\\cdot']);

/**
 * Fórmula amb claus escrita de manera compacta: «⟦k:tex⟧» és el símbol «tex» amb
 * la clau k. Si el text comença per «prefix: », totes les claus porten aquest
 * prefix, i el «=» que no és dins de cap ⟦…⟧ (n'hi pot haver un com a màxim) porta
 * la clau prefix + «q». «=», «<» i «>» s'escriuen com a relacions (rel); «+», «-»
 * i «\cdot», com a operadors (op).
 *   marcat('q4: ⟦a:a⟧ + ⟦b:b⟧ = ⟦r:2⟧')   →  claus q4a, q4b, q4q i q4r
 */
export function marcat(text) {
    const m = /^([A-Za-z][A-Za-z0-9]*): /.exec(text);
    const P = m ? m[1] : '';
    let iguals = 0;
    const tex = (m ? text.slice(m[0].length) : text)
        .split(/(⟦[^⟦⟧]*⟧)/)
        .map((tros, i) => {
            if (i % 2) {
                const s = /^⟦([A-Za-z0-9]+):([\s\S]*)⟧$/.exec(tros);
                if (!s) throw new Error(`Símbol mal escrit: «${tros}»`);
                const [, k, contingut] = s;
                return (RELACIONS.has(contingut) ? rel : OPERADORS.has(contingut) ? op : clau)(P + k, contingut);
            }
            if (/[⟦⟧]/.test(tros)) throw new Error(`Claudàtors desaparellats a «${text}»`);
            return P
                ? tros.replace(/=/g, () => {
                      iguals++;
                      return rel(P + 'q', '=');
                  })
                : tros;
        })
        .join('');
    if (iguals > 1) throw new Error(`Hi ha més d'un «=» sense clau a «${text}»`);
    return tex;
}

// ── 2. FILES DE TEXT ─────────────────────────────────────────────────────────

/**
 * Una fila de la pissarra pot ser text en lloc de TeX (p. ex. l'enunciat d'un
 * problema): comença per «§». Dins del text hi pot haver $fórmules$, salts de línia
 * «\n» i frases {{clau|marca|text}}: la clau fa que la pissarra la pugui seguir i
 * arrossegar com un símbol; la marca (p. ex. «objectiu») la ressalta.
 */
export const filaText = text => '§' + text;

export function frase(k, text, marca = '') {
    if (k && !CLAU_VALIDA.test(k)) throw new Error(`Clau no vàlida: «${k}»`);
    return `{{${k}|${marca}|${text}}}`;
}

// ── 3. FILES LLARGUES: EN DIVERSES LÍNIES ────────────────────────────────────

/*
 * Amplada aproximada d'un TeX, en píxels de la pissarra al mòbil (mesurada amb
 * KaTeX: una «m» fa uns 14 px, una xifra 8,5, un «+» amb els espais 16, etc.).
 * Només serveix per decidir on es parteix una fila llarga.
 */
const AMPLE_ORDRE = {
    '\\cdot': 12,
    '\\qquad': 32,
    '\\quad': 16,
    '\\,': 3,
    '\\ ': 5,
    '\\neq': 20,
    '\\ne': 20,
    '\\iff': 36,
    '\\le': 20,
    '\\ge': 20,
    '\\lambda': 10,
    '\\cdots': 22,
    '\\ldots': 22,
};

export function ampleTex(tex) {
    let t = tex
        .replace(/\\htmlData\{[^}]*\}/g, '')
        .replace(/\\(mathrel|mathbin|left|right|textstyle|displaystyle)/g, '');
    let ample = 0;
    // Una fracció fa l'amplada del més ample, el numerador o el denominador.
    for (let i = t.search(/\\d?frac\{/); i >= 0; i = t.search(/\\d?frac\{/)) {
        const grup = k => {
            let n = 0,
                j = k;
            do {
                if (t[j] === '{') n++;
                else if (t[j] === '}') n--;
                j++;
            } while (n && j < t.length);
            return j;
        };
        const a = t.indexOf('{', i),
            fa = grup(a),
            fb = grup(fa);
        ample += Math.max(ampleTex(t.slice(a + 1, fa - 1)), ampleTex(t.slice(fa + 1, fb - 1))) / 1.08 + 4;
        t = t.slice(0, i) + t.slice(fb);
    }
    // Una matriu (o un array) fa l'amplada de la seva fila més ampla, més els espais entre columnes.
    t = t.replace(
        /\\begin\{((?:[pvb]|small)?matrix|array)\}(\{[^}]*\})?((?:(?!\\begin\{)[\s\S])*?)\\end\{\1\}/g,
        (_, entorn, _c, cos) => {
            const files = cos.split(/\\\\(?:\[[^\]]*\])?/).map(f => f.split('&'));
            ample +=
                Math.max(
                    ...files.map(
                        f =>
                            f.reduce((s, c) => s + ampleTex(c), 0) / 1.08 +
                            (f.length - 1) * (entorn === 'array' ? 12 : 23)
                    )
                ) + (entorn === 'array' ? 0 : 12);
            return '';
        }
    );
    t = t.replace(/\\text\{([^}]*)\}/g, (_, x) => {
        ample += 8 * x.length + 12;
        return '';
    });
    t = t.replace(/\^\{([^{}]*)\}|\^(.)/g, (_, a, b) => {
        ample += 0.7 * ampleTex(a || b);
        return '';
    });
    t = t.replace(/\\[A-Za-z]+|\\./g, o => {
        ample += o in AMPLE_ORDRE ? AMPLE_ORDRE[o] : 10;
        return '';
    });
    for (const c of t.replace(/[{}\s]/g, '')) {
        ample += /[mw]/.test(c)
            ? 14.5
            : /[A-Za-z]/.test(c)
              ? 9
              : /\d/.test(c)
                ? 8.5
                : /[()[\]]/.test(c)
                  ? 6.5
                  : c === '|'
                    ? 4
                    : c === ','
                      ? 4
                      : /[+-]/.test(c)
                        ? 16
                        : /[=<>]/.test(c)
                          ? 20
                          : 9;
    }
    return Math.round(ample * 1.08);
}

/**
 * Amplada màxima d'una línia (px, mesurada com ampleTex). Els aparells de referència
 * són Chromebooks i portàtils: 460 px a mida de mòbil ≈ 630 px a la lletra de 30 px.
 */
export const AMPLE_LINIA = 460;

/**
 * Una fila llarga en diverses línies: «inici» i després les peces (cada una amb el
 * seu signe, p. ex. « + 2m»), tantes com càpiguen en «ample» píxels; les línies
 * següents comencen amb un sagnat. Si tot hi cap, una sola línia (sense array).
 * Un resultat curt («= 5») no queda mai sol en una línia nova.
 */
export function enLinies(inici, peces, { ample = AMPLE_LINIA, sagnat = '\\qquad ', final = '', espai = '4pt' } = {}) {
    const grups = [[]]; // les peces de cada línia
    const text = k =>
        (k === 0 ? inici : sagnat) + grups[k].map((p, j) => (k > 0 && j === 0 ? p.replace(/^\s+/, '') : p)).join('');
    for (const p of peces) {
        const k = grups.length - 1;
        if (grups[k].length && ampleTex(text(k) + p) > ample) grups.push([p]);
        else grups[k].push(p);
    }
    const n = grups.length;
    if (n > 1 && grups[n - 1].length === 1 && grups[n - 2].length > 1 && ampleTex(grups[n - 1][0]) < ample / 3) {
        const moguda = grups[n - 2].pop();
        if (ampleTex(sagnat + moguda.replace(/^\s+/, '') + grups[n - 1][0]) <= ample) grups[n - 1].unshift(moguda);
        else grups[n - 2].push(moguda);
    }
    const linies = grups.map((_, k) => text(k));
    // El final («= 0») sempre a la mateixa línia que l'última peça: sol en una línia nova costa de llegir.
    if (final) linies[linies.length - 1] += final;
    return linies.length > 1 ? `\\begin{array}{l} ${linies.join(` \\\\[${espai}] `)} \\end{array}` : linies[0];
}

// ── 4. LÍNIES QUE QUEDEN ESCRITES: L'HISTORIAL ───────────────────────────────

/**
 * Una resolució escrita línia a línia, com a la pissarra de classe: cada pas escriu una línia nova a
 * sota i les d'abans QUEDEN ESCRITES (així ho vol el David: tots els passos intermedis a la vista).
 * És l'eina comuna de totes les activitats, amb fórmules TeX o amb HTML propi:
 *   const H = historial(g);                       // TeX: cada línia a la seva fila del guió
 *   H.escriu([P('a', '3'), P('s', '+'), P('b', '4')], 'Has de calcular…');
 *   H.escriu([P('r', '7')], 'Suma.', { fusiona: { r: ['a', 's', 'b'] }, final: true });
 * Una línia de TeX és una llista de peces: P(id, tex, marca) (id: lletres i xifres, únic dins de la
 * línia; «+», «-», «\cdot» i «:» s'escriuen com a operadors, «=» com a relació), grup(peces, marca)
 * per pintar diverses peces d'un sol color i fraccio(numerador, denominador) (dues llistes de peces).
 * Opcions de historial(g, opcions):
 *   · fila: la primera fila del guió (0); prefix: el de les claus ('L');
 *   · pinta(linia, clauDe, classe, { nivell, text }): com es dibuixa una línia (per defecte pintaTex).
 *     Una activitat amb HTML hi posa el seu: la línia pot ser qualsevol objecte, i clauDe(id) dona la
 *     clau de la peça id (data-k="…");
 *   · envolta(textos): totes les línies en una sola fila del guió (p. ex. un <div> amb les línies
 *     de l'HTML, una pissarra d'una sola fila); les d'un pas obert van dins del seu calaix
 *     (calaix(linies, { id, titol, nou }), per defecte calaixHtml), cadascuna amb la frase del seu
 *     subpas. Sense envolta, la línia r va a la fila fila + r, la seva classe és la classe de la fila
 *     i les d'un pas obert hi afegeixen «detall» (el calaix, css/pissarra.css);
 *   · oberts: els passos que s'han d'escriure amb detall (vegeu més avall).
 * escriu(linia, text, opcions) escriu una línia nova i torna el pas del guió:
 *   · mou: { idNou: idVell }         la peça de la línia anterior hi baixa volant (i pot canviar,
 *                                     p. ex. «+3» que passa a l'altre membre com a «−3»);
 *   · fusiona: { idNou: [idsVells] } les peces de la línia anterior hi baixen i es fusionen en una;
 *   · reparteix: { idVell: [idsNous] } la peça de la línia anterior hi baixa a diversos llocs alhora
 *                                     (el 2 de 2(x + 3), que va als dos termes);
 *   · un id vell «id@k» és la peça id d'una línia escrita k línies més amunt (id@1 = id): p. ex. un
 *     subpas que fa un càlcul al marge i després torna a agafar nombres de la línia de l'enunciat; amb
 *     k ≥ 2 no es compten les línies d'un detall obert entremig (les d'un nivell més endins);
 *   · la resta de peces de la línia nova hi apareixen al seu lloc, i a la línia anterior en queda una
 *     còpia (no es mou res de les línies que ja estaven escrites);
 *   · anterior: línia                la línia anterior canvia alhora (p. ex. s'hi afegeix «=»);
 *   · classe / classeAnterior         la classe de la línia nova i, si es diu, la nova classe de
 *                                     l'anterior; final: true és classe 'final' (el resultat);
 *   · extra: { reanomena, copia }    per als símbols que vénen de fora de les línies (p. ex. d'un
 *                                     esquema SVG d'una altra fila): s'afegeixen tal qual al pas;
 *   · cursor, anunci                 passen tal qual al pas;
 *   · id, detall                     vegeu el detall a demanda.
 * canvia(linia, text, { classe }) canvia l'última línia sense escriure'n cap de nova (p. ex. per marcar
 * l'operació que es farà). clau(r, id) diu quina clau tindrà la peça id a la línia r (mentre no hagi
 * baixat a la següent); nombre, quantes línies hi ha; ultima, { linia, classe } de l'última; passos,
 * els del guió. Les claus: peça «id» de la línia r → <prefix><r>k<id>; la seva còpia, quan ja ha
 * baixat a la línia r + 1 → <prefix>c<r>k<id>.
 *
 * DETALL A DEMANDA («Vull més detall», la proposta del David del 14/11). Un pas pot portar detall:
 *   H.escriu(linia, 'Aplica la distributiva.', { mou: {…}, detall: D => {
 *       D.escriu(liniaIntermedia, 'Multiplica el 2 per cada terme.', { reparteix: {…} });
 *       D.acaba('Fes les multiplicacions.', { fusiona: {…} });   // escriu «linia», la del pas tancat
 *   } });
 * Si l'id del pas és a «oberts», el pas s'escriu amb els seus subpassos (D.escriu, D.canvia; els
 * subpassos també poden portar detall) i D.acaba escriu la línia del pas tancat, amb la seva classe:
 * un pas obert només afegeix línies entremig i la resta del guió no canvia. Si no hi és, el pas
 * s'escriu sencer i porta teDetall: true. El títol del calaix és el text del pas (o l'opció titol).
 * H.obre(linia, { titol, classe, … }) obre un pas ara i en torna les ordres (escriu, canvia, obre,
 * acaba): una activitat hi escriu els subpassos quan l'alumne demana detall, i acaba() quan contesta. El primer subpas que escriu fa a la línia anterior el
 * mateix que hi fa el pas (anterior, classeAnterior). Els passos porten unes metadades per a les
 * proves i per a la interfície: id (el número del pas a la vista compacta, '1', '2'…, o el que digui
 * l'opció id; els subpassos, '2a', '2b'…, i els seus, '2a1', '2a2'…), pare (el pas que s'ha obert) i
 * pares (tots els passos oberts on és, del de fora al de dins), tanca (el subpas de D.acaba),
 * teDetall i estat (les línies escrites després del pas, sense claus:
 * [{ nivell, signatura }]; les d'un detall són d'un nivell més). comprovaDetall (comprova.js) revisa
 * la regla amb totes les vistes.
 */
export const P = (id, tex, marca = '') => ({ id, tex, marca });
export const grup = (peces, marca) => ({ grup: peces, marca });
export const fraccio = (numerador, denominador) => ({ fraccio: [numerador, denominador] });

/** El pintor TeX de l'historial: una línia (llista de peces P, grup i fraccio), amb la clau de cada peça. */
export function pintaTex(peces, clauDe) {
    const tros = ps => ps.map(peca).join('');
    function peca(p) {
        if (p.grup) return marca(tros(p.grup), p.marca);
        if (p.fraccio) return `\\dfrac{${tros(p.fraccio[0])}}{${tros(p.fraccio[1])}}`;
        const k = clauDe(p.id);
        if (OPERADORS.has(p.tex) || p.tex === ':') return `\\mathbin{${clau(k, p.tex, p.marca)}}`;
        if (RELACIONS.has(p.tex)) return `\\mathrel{${clau(k, p.tex, p.marca)}}`;
        return clau(k, p.tex, p.marca);
    }
    return tros(peces);
}

const LLETRES = 'abcdefghijklmnopqrstuvwxyz';
const mapa = (obj, f) => Object.fromEntries(Object.entries(obj).map(([k, v]) => f(k, v)));

/** Text segur dins d'HTML (els títols i les frases dels calaixos). */
const escapa = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * El calaix d'un pas obert dins d'una fila HTML (historial amb envolta): el títol i les línies del detall.
 * nou: el pas on apareix (s'obre amb un petit gir 3D, css/pissarra.css). Una activitat hi pot posar el seu
 * (opció calaix de historial).
 */
export function calaixHtml(linies, { titol = '', nou = false } = {}) {
    return (
        `<div class="pis-calaix${nou ? ' pis-calaix-nou' : ''}">` +
        (titol ? `<div class="pis-calaix-titol">${escapa(titol)}</div>` : '') +
        linies.join('') +
        '</div>'
    );
}

/** Una línia d'un detall, dins del calaix, amb la frase del subpas que l'ha escrita. */
const ambNota = (html, text) =>
    `<div class="pis-calaix-pas">${html}${text ? `<p class="pis-calaix-nota">${escapa(text)}</p>` : ''}</div>`;

export function historial(
    g,
    {
        fila = 0,
        prefix = 'L',
        pinta = pintaTex,
        envolta = null,
        calaix = calaixHtml,
        oberts = new Set(),
        objectiu = false,
    } = {}
) {
    if (!CLAU_VALIDA.test(prefix)) throw new Error(`Prefix no vàlid: «${prefix}»`);
    // Les línies escrites: { linia, classe, nivell, dins, text, idLinia }; dins: els passos oberts dins el calaix
    // dels quals és la línia (del de fora al de dins); text: la frase del pas que l'ha escrita; idLinia: l'id
    // del pas que l'ha escrita (el del pas tancat, si és la línia d'un D.acaba).
    const escrites = [];
    // La clau d'una peça és per sempre: <prefix><id de la línia, en majúscules>k<id de la peça>. Així la mateixa
    // línia té les mateixes claus a totes les vistes (amb un pas obert o tancat) i cap línia escrita no les
    // canvia: el que baixa a la línia nova és una còpia que hi vola.
    const clauLinia = (idLinia, id) => `${prefix}${idLinia.toUpperCase()}k${id}`;
    const clauDe = (r, id) => clauLinia(mostrades[r].idLinia, id);
    // Els passos oberts que encara no s'han acabat, amb la línia del pas tancat (objectiu: es veu en gris)
    const pendents = [];
    let mostrades = escrites; // les línies que es pinten: les escrites i, amb objectiu, les dels passos oberts
    // Una línia sense les claus de la seva fila (la mateixa peça té la mateixa clau a totes les vistes)
    const signatura = l => `${l.classe}¦${pinta(l.linia, id => 'k' + id, l.classe, l)}`;
    let desfase = 0; // els passos de més que han afegit els detalls oberts (els números són els del compacte)
    const titols = new Map(); // pas obert → el títol del seu calaix
    const ambLinies = new Set(); // els passos oberts que ja tenen alguna línia al calaix
    let nou = null; // el pas obert el calaix del qual apareix en aquest pas

    const pintaLinia = r => {
        const l = mostrades[r];
        return pinta(l.linia, id => clauDe(r, id), l.classe, { nivell: l.nivell, text: l.text });
    };
    /** Les línies r0…r1 − 1, les dels detalls dins dels seus calaixos (n: els calaixos que hi ha a fora). */
    function agrupa(r0, r1, n) {
        const out = [];
        for (let r = r0; r < r1;) {
            const id = mostrades[r].dins[n];
            if (id === undefined) {
                out.push(n ? ambNota(pintaLinia(r), mostrades[r].text) : pintaLinia(r));
                r++;
                continue;
            }
            let fi = r;
            while (fi < r1 && mostrades[fi].dins[n] === id) fi++;
            out.push(calaix(agrupa(r, fi, n + 1), { id, titol: titols.get(id) || '', nou: nou === id }));
            r = fi;
        }
        return out;
    }
    // Una fila per línia: les d'un detall porten la classe «detall» (el calaix, css/pissarra.css) i la
    // línia del pas obert que encara no s'ha acabat, «objectiu» (en gris)
    function pintaTot() {
        const objectius = pendents
            .slice()
            .reverse()
            .map(p =>
                Object.assign({}, p, { classe: [p.classe, envolta ? 'pis-objectiu' : 'objectiu'].join(' ').trim() })
            );
        mostrades = escrites.concat(objectius);
        if (envolta) g.files[fila] = envolta(agrupa(0, mostrades.length, 0));
        else {
            mostrades.forEach((l, r) => {
                g.files[fila + r] = pintaLinia(r);
                g.classes[fila + r] = [l.classe, l.dins.length ? 'detall' : ''].filter(Boolean).join(' ');
            });
            for (let r = mostrades.length; r + fila < g.files.length; r++) {
                g.files[fila + r] = '';
                g.classes[fila + r] = '';
            }
        }
        mostrades = escrites;
    }

    /** Pinta la pissarra, hi afegeix el pas (amb les metadades) i el torna. */
    function afegeix(text, opcions, meta) {
        pintaTot();
        nou = null;
        const estat = escrites.map(l => ({ nivell: l.nivell, signatura: signatura(l) }));
        g.afegeix(text, Object.assign({}, opcions, meta, { estat }));
        return g.passos[g.passos.length - 1];
    }

    // pares: els passos oberts on és el pas, del de fora al de dins (el seu pare és l'últim)
    const meta = (id, pares, { teDetall = false, tanca = null } = {}) =>
        Object.assign(
            { id },
            pares.length ? { pare: pares[pares.length - 1], pares } : {},
            tanca ? { tanca } : {},
            teDetall ? { teDetall: true } : {}
        );

    /** Opcions que passen tal qual al pas: cursor, anunci i extra. */
    function talQual(op, opcions) {
        if (op.cursor) opcions.cursor = op.cursor;
        if (op.anunci) opcions.anunci = op.anunci;
        if (op.extra)
            for (const [nom, m] of Object.entries(op.extra)) opcions[nom] = Object.assign({}, opcions[nom], m);
        return opcions;
    }

    /**
     * Escriu una línia nova a sota (vegeu la capçalera); nivell: el de la línia; dins: els calaixos on va;
     * m: les metadades del pas.
     */
    function escriuLinia(linia, text, op, classe, nivell, dins, m) {
        const { mou = {}, fusiona = {}, reparteix = {} } = op;
        const r = escrites.length;
        const idLinia = m.tanca || m.id;
        const opcions = {};
        if (r > 0) {
            const ant = escrites[r - 1];
            if (op.anterior !== undefined && op.anterior !== null) ant.linia = op.anterior;
            if (op.classeAnterior !== undefined) ant.classe = op.classeAnterior;
            // De la línia anterior (que es queda) vola una còpia de cada peça que baixa; «id@k»: la peça id de
            // la línia escrita k línies més amunt (p. ex. «0n@2», de la de just abans de l'anterior)
            // Amb k ≥ 2 es compten només les línies del mateix nivell o de fora, i les del detall que es tanca
            // (no les d'un altre detall obert entremig): així la referència és la mateixa amb el pas d'abans
            // obert o tancat
            const delNivell = escrites.filter(l => l.nivell <= nivell || (m.tanca && l.dins.includes(m.tanca)));
            const vella = ref => {
                const [id, k = '1'] = String(ref).split('@');
                const l = Number(k) === 1 ? escrites[r - 1] : delNivell[delNivell.length - Number(k)];
                if (!l || !(Number(k) >= 1)) throw new Error(`No hi ha cap línia escrita ${k} línies amunt («${ref}»)`);
                return clauLinia(l.idLinia, id);
            };
            const nova = id => clauLinia(idLinia, id);
            if (Object.keys(mou).length) opcions.reanomena = mapa(mou, (n, v) => [nova(n), vella(v)]);
            if (Object.keys(fusiona).length) opcions.fusiona = mapa(fusiona, (n, vs) => [nova(n), vs.map(vella)]);
            if (Object.keys(reparteix).length) opcions.reparteix = mapa(reparteix, (v, ns) => [vella(v), ns.map(nova)]);
        }
        escrites.push({ linia, classe, nivell, dins, text, idLinia });
        const calaixNou = dins[dins.length - 1];
        if (calaixNou !== undefined && !ambLinies.has(calaixNou)) {
            ambLinies.add(calaixNou);
            nou = calaixNou;
        }
        return afegeix(text, talQual(op, opcions), m);
    }

    /**
     * Les ordres d'un nivell: el de dalt (0) o el d'un pas obert. pares: els passos oberts on s'escriu
     * ([] a dalt); nouId(): l'id del pas següent; heretat: el que el pas obert fa a la línia anterior,
     * que fa el primer subpas que escriu (hereta).
     */
    function ordres(nivell, pares, nouId, heretat = null) {
        function hereta(op) {
            if (!heretat) return op;
            const amb = Object.assign({}, heretat, op);
            heretat = null;
            return amb;
        }
        const classeDe = op => op.classe ?? (op.final ? 'final' : '');
        function escriu(linia, text, op = {}) {
            const id = op.id ?? nouId();
            op = hereta(op);
            if (op.detall && oberts.has(id)) {
                op.detall(obre(id, linia, Object.assign({ titol: text }, op), classeDe(op), nivell, pares));
                return g.passos[g.passos.length - 1];
            }
            const m = meta(id, pares, { teDetall: !!op.detall });
            return escriuLinia(linia, text, op, classeDe(op), nivell, pares, m);
        }
        /** Obre ara un pas (amb el seu id i la línia del pas tancat) i torna { escriu, canvia, obre, acaba }. */
        function obreAra(linia, op = {}) {
            const id = op.id ?? nouId();
            op = hereta(op);
            return obre(id, linia, op, classeDe(op), nivell, pares);
        }
        function canvia(linia, text, op = {}) {
            const id = op.id ?? nouId();
            const l = escrites[escrites.length - 1];
            if (linia !== undefined && linia !== null) l.linia = linia;
            if (op.classe !== undefined) l.classe = op.classe;
            return afegeix(text, talQual(op, {}), meta(id, pares));
        }
        return { escriu, canvia, obre: obreAra, hereta };
    }

    /**
     * Un pas obert: torna les ordres dels seus subpassos i acaba(), que escriu la línia del pas tancat (amb la
     * seva classe i al nivell del pas: la que veu qui no obre el pas). op.titol: el títol del calaix.
     */
    function obre(id, linia, op, classe, nivell, pares) {
        const abans = g.passos.length;
        let k = 0;
        const fill = () => id + (/\d$/.test(id) ? LLETRES[k++] : String(++k));
        const heretat = {};
        if (op.anterior !== undefined && op.anterior !== null) heretat.anterior = op.anterior;
        if (op.classeAnterior !== undefined) heretat.classeAnterior = op.classeAnterior;
        const dins = [...pares, id];
        titols.set(id, op.titol || '');
        // Amb objectiu, la línia del pas tancat es veu en gris a sota del calaix mentre es fan els subpassos
        const pendent = { linia, classe, nivell, dins: pares, text: '', idLinia: id };
        if (objectiu) pendents.push(pendent);
        const D = ordres(nivell + 1, dins, fill, heretat);
        let acabat = false;
        const acaba = (text, subop = {}) => {
            if (acabat) throw new Error(`El detall de «${id}» ja s'ha acabat`);
            acabat = true;
            if (pendents.includes(pendent)) pendents.splice(pendents.indexOf(pendent), 1);
            const sid = subop.id ?? fill();
            const pas = escriuLinia(
                linia,
                text,
                D.hereta(subop),
                classe,
                nivell,
                pares,
                meta(sid, dins, { tanca: id })
            );
            if (nivell === 0) desfase += g.passos.length - abans - 1;
            return pas;
        };
        return Object.freeze({ escriu: D.escriu, canvia: D.canvia, obre: D.obre, acaba });
    }

    const idSeguent = () => String(g.passos.length + 1 - desfase);
    const dalt = ordres(0, [], idSeguent);
    return Object.freeze({
        escriu: dalt.escriu,
        canvia: dalt.canvia,
        obre: dalt.obre,
        /** La clau de la peça «id» a la línia r (r = nombre: la de la línia que escriurà el pas següent). */
        clau: (r, id) => clauLinia(r < escrites.length ? escrites[r].idLinia : idSeguent(), id),
        get nombre() {
            return escrites.length;
        },
        get ultima() {
            const l = escrites[escrites.length - 1];
            return l ? { linia: l.linia, classe: l.classe } : null;
        },
        get passos() {
            return g.passos;
        },
    });
}

/** La primera manera d'escriure l'historial (TeX, cada línia a la seva fila): historial(g, { fila, prefix }). */
export const linies = (g, primeraFila = 0, prefix = 'L') => historial(g, { fila: primeraFila, prefix });

// ── 5. GUIÓ ──────────────────────────────────────────────────────────────────

/**
 * Constructor de la llista de passos d'un procediment.
 *   const g = guio(2);                     // pissarra de 2 files
 *   g.files[0] = '…';                      // TeX amb claus de la fila 0
 *   g.classes[0] = 'final';                // classe de la fila 0 (final, separat, destacat)
 *   g.afegeix('Text del pas.', { fusiona: { r: ['a', 'b'] } });
 *   g.completa(' Una frase més per al mateix pas.');
 *   return g.passos;
 * Un pas que no canviaria res de la pissarra (mateixes fórmules, mateixes claus i
 * mateixes classes) no s'afegeix: així un guió pot demanar un pas opcional sense
 * comprovar si cal.
 */
export function guio(nFiles) {
    const files = Array(nFiles).fill('');
    const classes = Array(nFiles).fill('');
    const passos = [];
    function afegeix(text, opcions = {}) {
        const pas = Object.freeze(Object.assign({ files: files.slice(), classes: classes.slice(), text }, opcions));
        const anterior = passos[passos.length - 1];
        const igual =
            anterior &&
            anterior.files.join('\n') === pas.files.join('\n') &&
            anterior.classes.join() === pas.classes.join();
        if (!igual) passos.push(pas);
    }
    /** Afegeix una frase al text de l'últim pas (quan la pissarra no ha de canviar). */
    function completa(text) {
        const i = passos.length - 1;
        passos[i] = Object.freeze(Object.assign({}, passos[i], { text: passos[i].text + text }));
    }
    return { files, classes, afegeix, completa, passos };
}
