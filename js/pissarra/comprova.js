/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/pissarra/comprova.js
 * ROL: «Resolució pas a pas» — eines per COMPROVAR els guions (les fan servir
 *      els tests, no les pàgines). Mòdul PUR (sense DOM ni window).
 * ARQUITECTURA:
 * - comprovaGuio(passos, nFiles, nom, { text }): la revisió estructural d'un guió
 *   (claus vàlides i úniques a cada pas, fusions, canvis de nom, còpies i
 *   repartiments coherents: les velles eren al pas anterior i les noves són al
 *   nou; una vella que desapareix no es fa servir dues vegades; el cursor apunta
 *   a símbols que hi són, cap pas idèntic a l'anterior…). Torna la llista d'errors (buida si tot és correcte). text: false
 *   no demana el text de cada pas (els historials de les activitats no en tenen).
 * - comprovaDetall(fesGuio, nFiles, nom, { text }): la regla del detall a demanda.
 *   fesGuio({ oberts }) torna els passos d'un guió fet amb historial() (formules.js) amb els
 *   passos d'«oberts» oberts. Es comproven la vista compacta, cada pas obert d'un en un (els
 *   subpassos amb detall, dins del seu pare) i tots oberts alhora: cada vista passa
 *   comprovaGuio, i un pas obert només hi afegeix línies entremig: acaba amb la línia del pas
 *   tancat (D.acaba), la resta de passos hi són amb el mateix text i, després de cada pas, la
 *   pissarra és la de la vista tancada sense comptar les línies del detall. Com que obrir un
 *   pas només canvia el que hi ha entre el seu començament i el seu final, això garanteix
 *   totes les combinacions.
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
export function comprovaGuio(passos, nFiles, nom = 'guió', { text = true } = {}) {
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
        if (text)
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
        const reparteix = Object.entries(pas.reparteix || {});
        const cursor = pas.cursor || {};
        if (!A) {
            comprova(
                !reanomena.length && !fusiona.length && !reparteix.length && !cursor.clic && !cursor.arrossega,
                () => `${on}: el primer pas no pot animar res`
            );
        } else {
            // Una vella que també és al pas nou es queda (les línies d'un historial): el que vola és una còpia,
            // i es pot moure, fusionar o repartir alhora. Una que desapareix només pot fer una d'aquestes coses.
            const desapareix = ka => A.has(ka) && !B.has(ka);
            for (const [kb, ka] of reanomena) {
                comprova(B.has(kb), () => `${on}: reanomena ${kb}←${ka}: «${kb}» no és al pas nou`);
                comprova(A.has(ka), () => `${on}: reanomena ${kb}←${ka}: «${ka}» no era al pas anterior`);
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
                    comprova(A.has(ka), () => `${on}: fusiona ${kb}←${ka}: «${ka}» ha de ser al pas anterior`);
                    comprova(
                        !desapareix(ka) || !reanomena.some(([, v]) => v === ka),
                        () => `${on}: «${ka}» es fusiona i es reanomena alhora`
                    );
                }
            }
            const destins = reparteix.flatMap(([, kbs]) => kbs || []);
            comprova(new Set(destins).size === destins.length, () => `${on}: un símbol nou surt de dos repartiments`);
            for (const [ka, kbs] of reparteix) {
                comprova(A.has(ka), () => `${on}: reparteix ${ka}: ha de ser al pas anterior`);
                comprova(Array.isArray(kbs) && kbs.length >= 1, () => `${on}: reparteix ${ka}: cap destí`);
                for (const kb of kbs || []) {
                    comprova(B.has(kb), () => `${on}: reparteix ${ka}→${kb}: «${kb}» no és al pas nou`);
                    comprova(
                        !reanomena.some(([n]) => n === kb) && !(kb in (pas.copia || {})),
                        () => `${on}: «${kb}» surt d'un repartiment i d'un canvi de nom o d'una còpia alhora`
                    );
                }
                comprova(
                    !desapareix(ka) || (!fonts.includes(ka) && !reanomena.some(([, v]) => v === ka)),
                    () => `${on}: «${ka}» es reparteix i es fusiona o es reanomena alhora`
                );
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
 * La regla del detall a demanda (vegeu la capçalera). Torna la llista d'errors.
 * Els passos els escriu historial() (formules.js), que hi posa les metadades: id, pare i pares (el
 * pas obert d'un subpas i tots els que l'envolten), tanca (el subpas de D.acaba, que escriu la
 * línia del pas tancat), teDetall (es pot obrir) i estat (les línies escrites després del pas,
 * sense claus, amb el seu nivell).
 * text: com a comprovaGuio.
 */
export function comprovaDetall(fesGuio, nFiles, nom = 'guió', { text = true } = {}) {
    const errors = [];
    const vista = oberts => fesGuio({ oberts: new Set(oberts) });
    const nomDe = oberts => `${nom} (${oberts.length ? 'obert: ' + oberts.join(', ') : 'compacte'})`;
    const compacte = vista([]);
    errors.push(...comprovaGuio(compacte, nFiles, nomDe([]), { text }));
    // Cada pas amb detall s'obre dins de la vista on surt (un subpas amb detall, dins del seu pare)
    const tots = [];
    const pendents = [{ oberts: [], passos: compacte, pare: null }];
    while (pendents.length) {
        const { oberts, passos, pare } = pendents.shift();
        for (const p of passos) {
            if (!p.teDetall || (p.pare || null) !== pare) continue;
            const ara = [...oberts, p.id];
            tots.push(p.id);
            const oberta = vista(ara);
            errors.push(...comprovaGuio(oberta, nFiles, nomDe(ara), { text }));
            errors.push(...comparaVistes(passos, oberta, new Set([p.id]), oberts.length, nomDe(ara)));
            pendents.push({ oberts: ara, passos: oberta, pare: p.id });
        }
    }
    if (tots.length > 1) {
        const oberta = vista(tots);
        errors.push(...comprovaGuio(oberta, nFiles, nomDe(['tots']), { text }));
        const primers = new Set(compacte.filter(p => p.teDetall).map(p => p.id));
        errors.push(...comparaVistes(compacte, oberta, primers, 0, nomDe(['tots'])));
    }
    return errors;
}

/**
 * Compara una vista amb la mateixa vista amb uns passos més oberts («ara»): cada pas de la tancada hi
 * és (un pas obert, com el subpas de D.acaba), amb el mateix text, i després de cada pas la pissarra hi
 * és igual sense comptar les línies dels detalls oberts (les de nivell més gran que «nivell»). Cada
 * pas obert hi afegeix algun subpas, a més del de D.acaba.
 */
function comparaVistes(tancada, oberta, ara, nivell, on) {
    const errors = [];
    const estat = p =>
        (p.estat || [])
            .filter(l => l.nivell <= nivell)
            .map(l => l.signatura)
            .join('\n');
    for (const p of tancada) {
        if (p.id === undefined) continue; // un pas que no ha escrit l'historial
        const obert = ara.has(p.id);
        const q = oberta.find(s => (obert ? s.tanca === p.id : s.id === p.id));
        if (!q) {
            errors.push(
                obert
                    ? `${on}: el detall de «${p.id}» no acaba amb D.acaba() (la línia del pas tancat)`
                    : `${on}: hi falta el pas «${p.id}»`
            );
            continue;
        }
        if (estat(q) !== estat(p))
            errors.push(`${on}: després del pas «${p.id}», la pissarra no és la de la vista tancada`);
        if (!obert && q.text !== p.text) errors.push(`${on}: el text del pas «${p.id}» canvia`);
    }
    for (const id of ara)
        if (oberta.filter(s => (s.pares || []).includes(id)).length < 2)
            errors.push(`${on}: el detall de «${id}» no hi afegeix cap pas (a més de D.acaba)`);
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
