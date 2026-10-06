/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/prioritat/strings.js
 * ROL: Textos de «Prioritat d'operacions»: l'expressió en text pla (informe)
 *      i tots els missatges de feedback, els dels errors típics (modalitat
 *      «Resultat final») i els de la modalitat «Pas a pas».
 * DEPENDÈNCIES: math-engine.js (evaluate, diagnose, nodeRange, N).
 * ============================================================================
 */
import { MathEngine } from './math-engine.js';

export const Strings = (() => {
    const { N, evaluate, diagnose, nodeRange } = MathEngine;

    const SUP = { 2: '²', 3: '³' };
    const OP_SHOW = { '+': '+', '-': '−', '·': '·', ':': ':' };

    function toText(toks) {
        return toks
            .map(t => {
                if (t.k === 'num') return String(t.v);
                if (t.k === 'op') return OP_SHOW[t.v];
                if (t.k === 'pow') return `${t.b}${SUP[t.e]}`;
                return t.k === 'lp' ? '(' : ')';
            })
            .join(' ')
            .replace(/\( /g, '(')
            .replace(/ \)/g, ')');
    }

    // Ex.: "3² = 3·3 = 9, no 3·2 = 6."
    function powHint(pw) {
        return `${pw.b}${SUP[pw.e]} = ${Array(pw.e).fill(pw.b).join('·')} = ${Math.pow(pw.b, pw.e)}, no ${pw.b}·${pw.e} = ${pw.b * pw.e}.`;
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
                                `En l'operació ${compact(toText(sub))}, l'exponent afecta només la base (que val ${p.b}), ` +
                                `per tant has de calcular ${p.b}${SUP[p.e]} en lloc de ${baseVal}${SUP[p.e]}.`
                            );
                    }
                }
                return pw ? `L'exponent afecta només la base: a ${pw.b}${SUP[pw.e]}, només el ${pw.b}.` : '';
            }

            case 'powmult':
                return pw ? powHint(pw) : '';

            case 'lrpowmult':
                return orderMsg(toks, diag) + (pw ? ' A més, ' + powHint(pw) : '');

            default:
                return 'Revisa els càlculs pas a pas.';
        }
    }

    // ------------------------------------------------------------
    // MODALITAT «PAS A PAS»
    // ------------------------------------------------------------

    // L'operació de la posició i d'una línia, en text: "4 · 5", "3²"
    function opText(line, i) {
        const t = line[i];
        if (t.k === 'pow') return `${t.b}${SUP[t.e]}`;
        return `${line[i - 1].v} ${OP_SHOW[t.v]} ${line[i + 1].v}`;
    }

    // El nom d'un signe o d'una potència, per als lectors de pantalla: "multiplicació", "potència 3²"
    function opLabel(t) {
        return t.k === 'pow' ? `potència ${t.b}${SUP[t.e]}` : NOM[t.v];
    }

    // Per què encara no es pot fer l'operació triada (bl = MathEngine.blockers(line, i))
    function blockerMsg(bl, line) {
        const greenOps = bl.green.map(i => line[i]);
        switch (bl.reason) {
            case 'par':
                return 'Primer cal fer el que hi ha dins del parèntesi.';
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

    // "No: 4 · 5 no fa 9."
    function wrongResultMsg(line, i, val) {
        return `No: ${opText(line, i)} no fa ${val}.`;
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

    return {
        SUP,
        OP_SHOW,
        toText,
        feedbackFor,
        opText,
        opLabel,
        blockerMsg,
        wrongResultMsg,
        Step,
    };
})();
