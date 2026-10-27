/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/comprova.js
 * ROL: «Resolució pas a pas» — eines per COMPROVAR els guions (les fan servir
 *      els tests, no les pàgines). Mòdul PUR (sense DOM ni window).
 * ARQUITECTURA:
 * - comprovaGuio(passos, nFiles): la revisió estructural d'un guió (claus
 *   vàlides i úniques a cada pas, fusions, canvis de nom i còpies coherents, el cursor
 *   apunta a símbols que hi són, cap pas idèntic a l'anterior…). Torna la llista
 *   d'errors (buida si tot és correcte).
 * - textPla(tex): una fila TeX de la pissarra convertida en text pla que es pot
 *   llegir i calcular (sense claus ni ordres de presentació): així els tests
 *   poden comprovar que cada línia que veu l'alumne és certa.
 * - clausDe(tex): les claus d'una fila, en ordre.
 * - Origen: proves/comprova.js del repositori step-quiz/pau (octubre 2026).
 *   Regla de la casa: cada procediment té un test que calcula el resultat per
 *   un altre camí (un model independent) i comprova totes les línies de tots
 *   els passos de molts exercicis. Vegeu docs/pissarra/MOTOR.md.
 * DEPENDÈNCIES: formules.js (CLAU_VALIDA).
 * ============================================================================
 */
import { CLAU_VALIDA } from './formules.js';

/** Claus d'una fila (TeX, text amb frases {{clau|…}} o HTML amb data-k="clau"), en ordre. */
export const clausDe = tex =>
    [...tex.matchAll(/\\htmlData\{k=([^},]*)[^}]*\}|\{\{([^|}]+)\||\bdata-k="([^"]+)"/g)].map(
        m => m[1] || m[2] || m[3]
    );

/**
 * Revisió estructural d'un guió. Torna una llista de frases que diuen què falla
 * (buida si tot és correcte). «nom» identifica el guió als missatges.
 */
export function comprovaGuio(passos, nFiles, nom = 'guió') {
    const errors = [];
    const comprova = (condicio, missatge) => {
        if (!condicio) errors.push(missatge());
    };
    comprova(Array.isArray(passos) && passos.length >= 1, () => `${nom}: no té cap pas`);
    let A = null,
        anterior = null;
    (passos || []).forEach((pas, i) => {
        const on = `${nom}, pas ${i + 1}`;
        comprova(
            Array.isArray(pas.files) && pas.files.length === nFiles && pas.classes.length === nFiles,
            () => `${on}: el nombre de files no és ${nFiles}`
        );
        comprova(
            typeof pas.text === 'string' && pas.text.trim() && pas.text.split('$').length % 2 === 1,
            () => `${on}: text buit o amb «$» desaparellats`
        );
        const llista = pas.files.flatMap(clausDe);
        const B = new Set(llista);
        comprova(
            B.size === llista.length,
            () => `${on}: claus repetides (${llista.filter((k, j) => llista.indexOf(k) !== j)})`
        );
        comprova(
            llista.every(k => CLAU_VALIDA.test(k)),
            () => `${on}: clau no vàlida`
        );
        if (anterior) {
            comprova(
                anterior.files.join('\n') !== pas.files.join('\n') || anterior.classes.join() !== pas.classes.join(),
                () => `${on}: idèntic a l'anterior`
            );
        }
        const reanomena = Object.entries(pas.reanomena || {});
        const fusiona = Object.entries(pas.fusiona || {});
        const cursor = pas.cursor || {};
        if (!A) {
            comprova(
                !reanomena.length && !fusiona.length && !cursor.clic && !cursor.arrossega,
                () => `${on}: el primer pas no pot animar res`
            );
        } else {
            for (const [kb, ka] of reanomena) {
                comprova(B.has(kb) && !A.has(kb), () => `${on}: reanomena ${kb}←${ka}: «${kb}» ha de ser nova`);
                comprova(A.has(ka) && !B.has(ka), () => `${on}: reanomena ${kb}←${ka}: «${ka}» ha de ser vella`);
            }
            for (const [kb, ka] of Object.entries(pas.copia || {})) {
                comprova(B.has(kb) && !A.has(kb), () => `${on}: còpia ${kb}←${ka}: «${kb}» ha de ser nova`);
                comprova(A.has(ka), () => `${on}: còpia ${kb}←${ka}: «${ka}» no era al pas anterior`);
            }
            const fonts = fusiona.flatMap(([, kas]) => kas);
            comprova(new Set(fonts).size === fonts.length, () => `${on}: un símbol es fusiona dues vegades`);
            for (const [kb, kas] of fusiona) {
                comprova(B.has(kb), () => `${on}: fusiona ${kb}: no és al pas nou`);
                for (const ka of kas) {
                    comprova(
                        A.has(ka) && !B.has(ka),
                        () => `${on}: fusiona ${kb}←${ka}: «${ka}» ha de ser al pas anterior i no al nou`
                    );
                    comprova(
                        !reanomena.some(([, v]) => v === ka),
                        () => `${on}: «${ka}» es fusiona i es reanomena alhora`
                    );
                }
            }
            if (cursor.clic)
                comprova(A.has(cursor.clic), () => `${on}: el cursor clica «${cursor.clic}», que no hi és`);
            if (cursor.arrossega) {
                comprova(
                    A.has(cursor.arrossega),
                    () => `${on}: el cursor arrossega «${cursor.arrossega}», que no hi és`
                );
            }
            if (cursor.fins) {
                comprova(B.has(cursor.fins), () => `${on}: el cursor arrossega fins a «${cursor.fins}», que no hi és`);
            }
        }
        A = B;
        anterior = pas;
    });
    return errors;
}

/**
 * Converteix una fila TeX de la pissarra en text pla que es pot calcular: treu les
 * claus i les marques, \mathbin, \mathrel, \left, \right i els espais;
 * \cdot → *, : (dividir) es manté, ^{…} → ^(…), \frac{a}{b} → ((a)/(b)),
 * \sqrt{a} → sqrt(a), \text{…} → «…», \boxed{a} → a, \textcolor{c}{a} → a,
 * \cancel{a} → a. Una ordre que no coneix fa fallar la prova (així una ordre nova
 * a la pissarra obliga a ensenyar-la aquí).
 */
export function textPla(tex) {
    let i = 0;
    const grup = () => {
        if (tex[i] !== '{') return tex[i++]; // argument d'un sol caràcter
        i++;
        const s = sequencia('}');
        if (tex[i] !== '}') throw new Error(`Falta una «}» a: ${tex}`);
        i++;
        return s;
    };
    function sequencia(fi) {
        let s = '';
        while (i < tex.length && tex[i] !== fi) {
            const c = tex[i];
            if (c === '{') {
                s += grup();
                continue;
            }
            if (c === '}') throw new Error(`Sobra una «}» a: ${tex}`);
            if (c === '^') {
                i++;
                s += '^(' + grup() + ')';
                continue;
            }
            if (c === '\\') {
                const ordre = /^\\([A-Za-z]+|.)/.exec(tex.slice(i))[0];
                i += ordre.length;
                switch (ordre) {
                    case '\\htmlData':
                        grup(); // l'atribut k=…; el contingut és el grup següent
                        break;
                    case '\\mathbin':
                    case '\\mathrel':
                    case '\\mathord':
                    case '\\left':
                    case '\\right':
                    case '\\,':
                    case '\\ ':
                    case '\\quad':
                    case '\\qquad':
                    case '\\textstyle':
                    case '\\displaystyle':
                        break;
                    case '\\cdot':
                        s += '*';
                        break;
                    case '\\div':
                        s += ':';
                        break;
                    case '\\frac':
                    case '\\dfrac':
                    case '\\tfrac': {
                        const a = grup(),
                            b = grup();
                        s += `((${a})/(${b}))`;
                        break;
                    }
                    case '\\sqrt':
                        s += `sqrt(${grup()})`;
                        break;
                    case '\\text':
                    case '\\textbf':
                        s += `«${grup()}»`;
                        break;
                    case '\\boxed':
                    case '\\cancel':
                        s += grup();
                        break;
                    case '\\textcolor':
                        grup(); // el color no compta
                        s += grup();
                        break;
                    case '\\begin':
                    case '\\end':
                        grup(); // els entorns (array): només en queda el contingut
                        break;
                    case '\\\\':
                        s += ';'; // salt de línia d'un array
                        break;
                    case '\\neq':
                    case '\\ne':
                        s += '≠';
                        break;
                    case '\\le':
                        s += '≤';
                        break;
                    case '\\ge':
                        s += '≥';
                        break;
                    case '\\{':
                        s += '{';
                        break;
                    case '\\}':
                        s += '}';
                        break;
                    case '\\%':
                        s += '%';
                        break;
                    default:
                        throw new Error(`Ordre TeX no prevista per la prova: ${ordre}`);
                }
                continue;
            }
            s += c;
            i++;
        }
        return s;
    }
    return sequencia(undefined).replace(/\s+/g, '');
}
