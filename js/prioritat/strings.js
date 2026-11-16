/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/prioritat/strings.js
 * ROL: Textos de «Prioritat d'operacions»: l'expressió en text pla (informe)
 *      i tots els missatges de feedback, els dels errors típics (modalitat
 *      «Resultat final») i els de la modalitat «Pas a pas».
 *      Amb enters (?nombres=enters): els negatius s'escriuen amb el signe «−»
 *      (U+2212) i, darrere d'un signe, entre parèntesis: «5 − (−3)»; els missatges
 *      dels errors dels signes (feedbackFor, pistaSigne) i el pas «treure el
 *      parèntesi» de −(−3).
 * DEPENDÈNCIES: math-engine.js (evaluate, diagnose, nodeRange, N, powValue).
 * ============================================================================
 */
import { MathEngine } from './math-engine.js';

export const Strings = (() => {
    const { N, evaluate, diagnose, nodeRange, powValue } = MathEngine;

    const SUP = { 2: '²', 3: '³', 4: '⁴', 5: '⁵' };
    const OP_SHOW = { '+': '+', '-': '−', '·': '·', ':': ':' };
    const MENYS = OP_SHOW['-'];

    /** Un enter amb el signe menys de veritat: −3. */
    const fmt = v => (v < 0 ? `${MENYS}${-v}` : String(v));
    /** Un enter darrere d'un signe: els negatius, entre parèntesis: (−3). */
    const fmtDins = v => (v < 0 ? `(${fmt(v)})` : String(v));
    /** Una potència en text: 3², (−2)³, −2². */
    const powText = t => `${t.opp ? MENYS : ''}${t.b < 0 ? `(${fmt(t.b)})` : t.b}${SUP[t.e]}`;

    function toText(toks) {
        return toks
            .map((t, i) => {
                const prev = toks[i - 1];
                if (t.k === 'num') return prev && prev.k !== 'lp' ? fmtDins(t.v) : fmt(t.v);
                if (t.k === 'op') return OP_SHOW[t.v];
                if (t.k === 'neg') return MENYS;
                if (t.k === 'pow') return powText(t);
                return t.k === 'lp' ? '(' : ')';
            })
            .join(' ')
            .replace(/\( /g, '(')
            .replace(/ \)/g, ')')
            .replace(/(^|\() *− \(/g, '$1−('); // −(4 − 7): el menys de davant, enganxat al parèntesi
    }

    // Ex.: "3² = 3·3 = 9, no 3·2 = 6."   "(−2)³ = (−2)·(−2)·(−2) = −8, no (−2)·3 = −6."
    function powHint(pw) {
        const base = pw.b < 0 ? `(${fmt(pw.b)})` : String(pw.b);
        const producte = Array(pw.e).fill(base).join('·');
        const mal = pw.b * pw.e * (pw.opp ? -1 : 1);
        const desenvolupa = pw.opp ? `${MENYS}(${producte})` : producte;
        return `${powText(pw)} = ${desenvolupa} = ${fmt(powValue(pw))}, no ${pw.opp ? MENYS : ''}${base}·${pw.e} = ${fmt(mal)}.`;
    }

    const NOM = { '+': 'suma', '-': 'resta', '·': 'multiplicació', ':': 'divisió' };
    const NOM_UNA = { '+': 'una suma', '-': 'una resta', '·': 'una multiplicació', ':': 'una divisió' };
    const NOM_LA = { '+': 'la suma', '-': 'la resta', '·': 'la multiplicació', ':': 'la divisió' };
    const NOM_LES = { '+': 'les sumes', '-': 'les restes', '·': 'les multiplicacions', ':': 'les divisions' };
    const NOM_PL = { '+': 'sumes', '-': 'restes', '·': 'multiplicacions', ':': 'divisions' };

    function joinI(parts) {
        return parts.length <= 1 ? parts[0] || '' : parts.slice(0, -1).join(', ') + ' i ' + parts[parts.length - 1];
    }

    // Operadors marcats pel diagnòstic (sense la potència mal calculada)
    function markedOps(toks, set, diag) {
        return [...set].filter(i => i !== diag.powRed && toks[i] && toks[i].k === 'op').map(i => toks[i].v);
    }

    // "la multiplicació", "les multiplicacions", "la multiplicació i la divisió"...
    function phraseLa(ops) {
        const parts = [];
        for (const op of ['·', ':', '+', '-']) {
            const n = ops.filter(o => o === op).length;
            if (n === 1) parts.push(NOM_LA[op]);
            if (n > 1) parts.push(NOM_LES[op]);
        }
        return joinI(parts);
    }

    const compact = txt => txt.replace(/ · /g, '·').replace(/ : /g, ':');

    // "Has fet una resta abans que la multiplicació: és a l'inrevés!"
    // (serveix per als errors "esquerra a dreta" i "sumes abans": per a l'alumne és el mateix)
    function orderMsg(toks, diag) {
        const red = diag ? markedOps(toks, diag.red, diag) : [];
        const grn = diag ? markedOps(toks, diag.green, diag) : [];
        if (red.length && grn.length && (red[0] === '+' || red[0] === '-'))
            return `Has fet ${NOM_UNA[red[0]]} abans que ${phraseLa(grn)}: és a l'inrevés!`;
        return "Has fet les sumes i restes abans que les multiplicacions i divisions: és a l'inrevés!";
    }

    // "Atenció, si tens diverses sumes i restes seguides, es fan d'esquerra a dreta."
    function leftToRightMsg(ops) {
        const nivell = ops.some(o => o === '·' || o === ':') ? ['·', ':'] : ['+', '-'];
        const noms = nivell.filter(o => ops.includes(o)).map(o => NOM_PL[o]);
        return noms.length
            ? `Atenció, si tens diverses ${joinI(noms)} seguides, es fan d'esquerra a dreta.`
            : "Atenció, si tens diverses operacions del mateix tipus seguides, es fan d'esquerra a dreta.";
    }

    // Modalitat «Resultat final»: per què la resposta triada (un error típic) no és la bona
    function feedbackFor(id, toks, diag) {
        if (diag === undefined && id !== 'calc') diag = diagnose(toks, id);
        const pw = toks.find(t => t.k === 'pow');
        switch (id) {
            case 'lr':
            case 'addfirst':
                return orderMsg(toks, diag);

            case 'rtl':
                return leftToRightMsg(diag ? markedOps(toks, new Set([...diag.red, ...diag.green]), diag) : []);

            case 'nopar':
            case 'lrnopar':
                return "No t'has fixat que hi ha un parèntesi. Has de calcular, en primer lloc, el que hi ha dins del parèntesi.";

            case 'powterm': {
                // "En l'operació 4·3², l'exponent afecta només la base (que val 3),
                //  per tant has de calcular 3² en lloc de 12²."
                if (diag && diag.powKid) {
                    const [a, b] = nodeRange(toks, diag.powKid);
                    const powIdx = [...diag.green].find(i => toks[i] && toks[i].k === 'pow');
                    const p = toks[powIdx];
                    if (p && powIdx >= a && powIdx <= b) {
                        const sub = toks.slice(a, b + 1);
                        const baseVal = evaluate(
                            sub.map(t => (t === p ? N(p.b) : t)),
                            {}
                        );
                        if (baseVal !== null)
                            return (
                                `En l'operació ${compact(toText(sub))}, l'exponent afecta només la base (que val ${fmt(p.b)}), ` +
                                `per tant has de calcular ${powText(p)} en lloc de ${fmtDins(baseVal)}${SUP[p.e]}.`
                            );
                    }
                }
                return pw ? `L'exponent afecta només la base: a ${powText(pw)}, només el ${fmt(pw.b)}.` : '';
            }

            case 'powmult':
                return pw ? powHint(pw) : '';

            case 'lrpowmult':
                return orderMsg(toks, diag) + (pw ? ' A més, ' + powHint(pw) : '');

            // Errors dels signes (enters): amb l'operació on el signe surt malament (diag.cas), si n'hi ha
            case 'signesuma':
            case 'restaneg':
            case 'signeprod':
            case 'powsigne':
            case 'powopp':
            case 'negpar':
                return missatgeSigne(id, diag && diag.cas);

            default:
                return 'Revisa els càlculs pas a pas.';
        }
    }

    // ------------------------------------------------------------
    // ERRORS DELS SIGNES (enters)
    // cas (math-engine.js diagnose): l'operació on el signe surt malament, amb els seus nombres:
    //   { k: 'op', a, op, b, ok, mal } · { k: 'pow', t, ok, mal } · { k: 'neg', v, ok, mal }
    // Sense cas, el missatge porta un exemple.
    // ------------------------------------------------------------
    const potenciaDesenvolupada = t => Array(t.e).fill(fmtDins(t.b)).join('·');
    function missatgeSigne(id, cas) {
        if (!cas) cas = EXEMPLES_SIGNE[id];
        const opera = c => `${fmtDins(c.a)} ${OP_SHOW[c.op]} ${fmtDins(c.b)}`;
        switch (id) {
            case 'signesuma': {
                const text = `${fmt(cas.a)} ${OP_SHOW[cas.op]} ${fmtDins(cas.b)}`;
                const resta = cas.op === '-' ? ` (restar és sumar l'oposat: ${fmt(cas.a)} + ${fmtDins(-cas.b)})` : '';
                return (
                    `Compte amb el signe del resultat: ${text} = ${fmt(cas.ok)}, no ${fmt(cas.mal)}${resta}. ` +
                    'El resultat porta el signe del nombre que té el valor absolut més gran.'
                );
            }
            case 'restaneg':
                return (
                    `Restar un nombre negatiu és sumar el seu oposat: ${fmt(cas.a)} ${MENYS} ${fmtDins(cas.b)} = ` +
                    `${fmt(cas.a)} + ${-cas.b} = ${fmt(cas.ok)}.`
                );
            case 'signeprod':
                return (
                    'Regla dels signes: signes iguals donen positiu i signes diferents, negatiu (menys per menys ' +
                    `fa més; menys per més fa menys). ${opera(cas)} = ${fmt(cas.ok)}.`
                );
            case 'powsigne':
                return (
                    "Una potència de base negativa és positiva si l'exponent és parell i negativa si és senar: " +
                    `${powText(cas.t)} = ${potenciaDesenvolupada(cas.t)} = ${fmt(cas.ok)}.`
                );
            case 'powopp': {
                const t = cas.t;
                const positiva = { k: 'pow', b: -t.b, e: t.e };
                return (
                    `Sense parèntesi, l'exponent afecta només el nombre, no el signe: ${powText(t)} = ` +
                    `${MENYS}(${Array(t.e).fill(t.b).join('·')}) = ${fmt(cas.ok)}; en canvi, ${powText(positiva)} = ` +
                    `${fmt(powValue(positiva))}.`
                );
            }
            case 'negpar':
                return (
                    'El signe menys de davant del parèntesi canvia el signe del que hi ha a dins: ' +
                    `${MENYS}(${fmt(cas.v)}) = ${fmt(cas.ok)}.`
                );
            default:
                return '';
        }
    }
    // Els exemples dels missatges quan no hi ha l'operació de l'exercici
    const EXEMPLES_SIGNE = {
        signesuma: { k: 'op', a: 3, op: '-', b: 8, ok: -5, mal: 5 },
        restaneg: { k: 'op', a: 5, op: '-', b: -3, ok: 8, mal: 2 },
        signeprod: { k: 'op', a: -3, op: '·', b: -2, ok: 6, mal: -6 },
        powsigne: { k: 'pow', t: { k: 'pow', b: -2, e: 3 }, ok: -8, mal: 8 },
        powopp: { k: 'pow', t: { k: 'pow', b: 2, e: 2, opp: true }, ok: -4, mal: 4 },
        negpar: { k: 'neg', v: -3, ok: 3, mal: -3 },
    };

    // ------------------------------------------------------------
    // MODALITAT «PAS A PAS»
    // ------------------------------------------------------------

    // L'operació de la posició i d'una línia, en text: "4 · 5", "3²", "5 − (−3)", "(−3) · (−2)", "−(−3)"
    function opText(line, i) {
        const t = line[i];
        if (t.k === 'pow') return powText(t);
        if (t.k === 'neg') return `${MENYS}(${fmt(line[i + 2].v)})`;
        const a = line[i - 1].v;
        // El primer nombre, entre parèntesis si és negatiu i l'operació és un producte o un quocient
        const primer = t.v === '·' || t.v === ':' ? fmtDins(a) : fmt(a);
        return `${primer} ${OP_SHOW[t.v]} ${fmtDins(line[i + 1].v)}`;
    }

    // El nom d'un signe o d'una potència, per als lectors de pantalla: "multiplicació", "potència 3²"
    function opLabel(t) {
        if (t.k === 'neg') return 'treure el parèntesi amb el signe menys';
        return t.k === 'pow' ? `potència ${powText(t)}` : NOM[t.v];
    }

    // Per què encara no es pot fer l'operació triada (bl = MathEngine.blockers(line, i))
    function blockerMsg(bl, line) {
        const greenOps = bl.green.map(i => line[i]);
        switch (bl.reason) {
            case 'par':
                return 'Primer cal fer el que hi ha dins del parèntesi.';
            case 'neg':
                return 'Abans cal treure el parèntesi que té un signe menys davant.';
            case 'pow': {
                const n = greenOps.filter(t => t.k === 'pow').length;
                return `Abans cal calcular ${n > 1 ? 'les potències' : 'la potència'}.`;
            }
            case 'prio':
                return (
                    `Encara no pots fer aquesta ${NOM[bl.op]}: abans cal fer ${phraseLa(greenOps.map(t => t.v))}. ` +
                    'Les multiplicacions i les divisions van abans que les sumes i les restes.'
                );
            default:
                return leftToRightMsg([bl.op, ...greenOps.map(t => t.v)]);
        }
    }

    // Amb enters, si el resultat triat només té el signe malament: la regla del signe, amb aquesta operació
    // (si no, '')
    function pistaSigne(line, i, val) {
        const t = line[i];
        if (t.k === 'neg') {
            const v = line[i + 2].v;
            return val === v && v !== 0 ? missatgeSigne('negpar', { k: 'neg', v, ok: -v, mal: v }) : '';
        }
        if (t.k === 'pow') {
            const ok = powValue(t);
            if (val !== -ok || ok === 0) return '';
            if (t.opp) return missatgeSigne('powopp', { k: 'pow', t, ok, mal: val });
            return t.b < 0 ? missatgeSigne('powsigne', { k: 'pow', t, ok, mal: val }) : '';
        }
        const [a, b] = [line[i - 1].v, line[i + 1].v];
        const ok = evaluate([N(a), t, N(b)], { enters: true });
        if (ok === null) return '';
        const cas = { k: 'op', a, op: t.v, b, ok, mal: val };
        if (t.v === '-' && b < 0 && val === a + b) return missatgeSigne('restaneg', cas);
        if (val !== -ok || ok === 0) return '';
        if (t.v === '·' || t.v === ':') return missatgeSigne('signeprod', cas);
        return missatgeSigne('signesuma', cas);
    }

    // "No: 4 · 5 no fa 9."   Amb enters: "No: 5 − (−3) no fa 2. Restar un nombre negatiu és sumar…"
    function wrongResultMsg(line, i, val) {
        const pista = pistaSigne(line, i, val);
        return `No: ${opText(line, i)} no fa ${fmt(val)}.${pista ? ' ' + pista : ''}`;
    }

    const Step = {
        chooseOp: "Toca l'operació que s'ha de fer ara.",
        chooseOpHint: "Toca el signe de l'operació (o la potència). Després en triaràs el resultat.",
        result: (line, i) => `Quant fa ${opText(line, i)}?`,
        resultHint: 'Toca el resultat.',
        doneOk: "Molt bé! Has resolt tota l'expressió.",
        doneFail: "T'has quedat sense intents. Aquí tens la resolució acabada (en gris, els passos que faltaven).",
        legendRed: 'Aquesta encara no es pot fer',
        legendGreen: 'Abans cal fer aquesta',
    };

    // ------------------------------------------------------------
    // MODE «ESVAÏMENT» (?esvaiment=1): exemples resolts que es van esvaint
    // ------------------------------------------------------------

    // Per què es fa aquest pas ara (pas = un element de MathEngine.passosEsvaiment)
    const MOTIU = {
        par: 'Primer, el que hi ha dins del parèntesi',
        pow: 'Abans, les potències',
        prio: 'Les multiplicacions i les divisions van abans que les sumes i les restes',
        lr: 'D’esquerra a dreta',
        sola: 'Només queda una operació',
        neg: 'El signe menys de davant del parèntesi canvia el signe',
    };
    function exemplePas(pas) {
        return `${MOTIU[pas.motiu]}: ${opText(pas.line, pas.op)} = ${fmt(pas.resposta)}.`;
    }

    const Esv = {
        mira: 'Mira com es resol. Toca «Següent pas».',
        seguent: 'Següent pas',
        araTu: 'Ara tu',
        continua: 'Continua',
        teu: n => (n === 1 ? 'Ara fes tu l’últim pas.' : `Ara fes tu els ${n} últims passos.`),
        exemple: pas => `Exemple. ${exemplePas(pas)}`,
        // L'alumne ha triat el resultat equivocat: es mostra el bo
        resultatBo: (line, i, val, ok) => `${opText(line, i)} no fa ${fmt(val)}: fa ${fmt(ok)}. Fixa-t’hi i continua.`,
        // L'alumne ha triat una operació que encara no es pot fer: es fa la bona
        ferAixi: (line, i, ok) => `Es fa així: ${opText(line, i)} = ${fmt(ok)}.`,
        capcalera: (nAlumne, nPassos) => `Fas tu: ${nAlumne} de ${nPassos}`,
        fetSencer: 'Has vist l’exemple sencer.',
        totSol: 'Ja ho fas tot sol!',
        beFet: n =>
            n === 1 ? 'Molt bé! Has fet l’últim pas sense ajuda.' : `Molt bé! Has fet ${n} passos sense ajuda.`,
        ambAjuda: 'Has acabat amb una mica d’ajuda.',
        puja: 'Al pròxim, faràs un pas més tu.',
        baixa: 'Al pròxim, un pas menys: anirà millor.',
        notaExemple: 'exemple',
        notaAjuda: 'amb ajuda',
    };

    return {
        SUP,
        OP_SHOW,
        fmt,
        fmtDins,
        powText,
        toText,
        feedbackFor,
        opText,
        opLabel,
        blockerMsg,
        missatgeSigne,
        pistaSigne,
        wrongResultMsg,
        Step,
        exemplePas,
        Esv,
    };
})();
