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
 *       cursor?: {clic: 'k'} | {arrossega: 'k', fins: 'k2'} }
 *   i la pissarra (pissarra.js) anima la diferència entre dos passos seguits.
 * - Cada símbol que s'ha de poder seguir d'un pas al següent porta una CLAU:
 *   \htmlData{k=<clau>}{<símbol>}. Mateixa clau abans i després → el símbol es
 *   desplaça; fusiona → els vells van a parar al nou; la resta s'esvaeix o apareix.
 *   Una clau és única dins d'un pas (sumant totes les files).
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

// ── 4. GUIÓ ──────────────────────────────────────────────────────────────────

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
