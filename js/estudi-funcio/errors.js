/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estudi-funcio/errors.js
 * ROL: Diagnòstic dels errors d'«Estudi d'una funció»: per a cada resposta
 *      equivocada, quin error típic és (ERRORS_EF, strings.js).
 *   - Passos de triar: el valor de l'opció falsa ja és el tipus d'error.
 *   - Taula de signes: punt de prova fora de l'interval; 0 en un punt fora del domini (o ∄ en
 *     un zero); els signes de f en lloc dels de f′; signe equivocat.
 *   - Fila de f: fletxa o concavitat contrària al signe; extrem (o inflexió) sense canvi de signe;
 *     màxim i mínim intercanviats; extrem en un punt fora del domini; extrem oblidat.
 *   - y dels extrems: calculada amb f′ en lloc de f.
 * ARQUITECTURA: mòdul pur.
 * DEPENDÈNCIES: polinomis-ef.js, passos/taula-signes.js, strings.js.
 * ============================================================================
 */

import { pValor, pValorQ } from './polinomis-ef.js';
import { racionalsIguals, comRacional } from '../algebra/racionals.js';
import { cellesMalament } from '../passos/taula-signes.js';
import { ERRORS_EF } from './strings.js';

const resultat = codi => (ERRORS_EF[codi] ? { codi, ...ERRORS_EF[codi] } : null);

function diagnosticaTaulaSignes(pas, escrit) {
    const sol = pas.solucio.taula;
    const { taula } = pas.dades;
    const cols = pas.plantilla[0].taula.columnes;
    const dolentes = cellesMalament(escrit, sol, pas.plantilla[0].taula);
    if (dolentes.some(d => d.fila === 'prova')) return 'EF_T_PROVA';
    const s = escrit.files.s;
    for (let i = 0; i < cols.length; i++) {
        if (cols[i].tipus !== 'punt' || s[i] === sol.files.s[i]) continue;
        return sol.files.s[i] === 'no' ? 'EF_T_FORA_ZERO' : 'EF_T_ZERO_NO';
    }
    // Els signes de f (o de f′, si és la taula de f″) als punts de prova
    const { P, Q, ordre } = pas.dades;
    const signeDe = x => {
        const v = ordre === 1 ? pValor(P, x) / pValor(Q, x) : signeDerivada(pas.dades, x);
        return v > 0 ? 'mes' : v < 0 ? 'menys' : 'zero';
    };
    const intervals = cols.map((c, i) => i).filter(i => cols[i].tipus === 'interval');
    const quadraAmb = fn => intervals.every(i => s[i] === fn(escrit.prova[i]));
    const signeBo = intervals.every(i => s[i] === taula.signe[i]);
    if (!signeBo && quadraAmb(signeDe)) return ordre === 1 ? 'EF_T_SIGNE_F' : 'EF_T_SIGNE_D1';
    return 'EF_T_SIGNE';
}
/** f′ exacta, N1/Q² (la taula de f″ amb els signes de f′ és el mateix error, un nivell més avall). */
function signeDerivada({ N1, Q }, x) {
    return pValor(N1, x) / pValor(Q, x) ** 2;
}

function diagnosticaFila(pas, escrit) {
    const sol = pas.solucio.taula.files.f;
    const f = escrit.files.f;
    const { ordre } = pas.dades;
    const cols = pas.plantilla[0].taula.columnes;
    for (let i = 0; i < cols.length; i++) {
        if (f[i] === sol[i]) continue;
        if (cols[i].tipus === 'interval') return ordre === 1 ? 'EF_T_FLETXA' : 'EF_T_CONCAVITAT';
        if (sol[i] === 'no') return 'EF_T_FORA_EXTREM';
        if (f[i] === 'no') return 'EF_T_ZERO_NO';
        if (sol[i] === 'cap') return ordre === 1 ? 'EF_T_SENSE_CANVI' : 'EF_T_INF_SENSE_CANVI';
        if (f[i] === 'cap') return 'EF_T_OBLIDAT';
        if (ordre === 1) return 'EF_T_MAX_MIN';
    }
    return 'EF_T_ALTRE';
}

function diagnosticaExtrems(pas, valors) {
    const { N1, xs } = pas.dades;
    for (let i = 0; i < xs.length; i++) {
        const v = comRacional(valors[`y${i}`]);
        if (racionalsIguals(v, comRacional(pas.solucio[`y${i}`]))) continue;
        // f′(x) = 0 als extrems: si ha escrit 0 (i f no hi val 0), ha substituït a f′
        const dp = pValorQ(N1, xs[i]);
        if (v[0] === 0 && dp[0] === 0) return 'EF_Y_DERIVADA';
        return 'EF_Y_ALTRE';
    }
    return 'EF_Y_ALTRE';
}

/** El diagnòstic per al joc de passos: { missatge, etiqueta } o null. */
export function diagnosticaEF(pas, valors) {
    let codi = null;
    if (pas.mena === 'tria') codi = String(valors.tria || '').split('#')[0];
    else if (pas.mena === 'taula-signes') codi = diagnosticaTaulaSignes(pas, valors.taula);
    else if (pas.mena === 'taula-f') codi = diagnosticaFila(pas, valors.taula);
    else if (pas.mena === 'extrems') codi = diagnosticaExtrems(pas, valors);
    const r = resultat(codi);
    return r ? { missatge: r.missatge, etiqueta: r.etiqueta, codi } : null;
}

/** La resposta en text, per a l'historial. */
export function textRespostaEF(pas, valors) {
    if (pas.mena === 'tria') {
        const o = pas.opcions.find(([v]) => v === valors.tria);
        return o ? o[1] : String(valors.tria);
    }
    if (pas.mena === 'taula-signes' || pas.mena === 'taula-f') {
        const t = valors.taula;
        const files = Object.entries(t.files).map(([id, v]) => `${id}: ${v.join(' ')}`);
        const prova = Object.values(t.prova || {});
        return [prova.length ? `prova: ${prova.join(' ')}` : '', ...files].filter(Boolean).join(' · ');
    }
    return Object.keys(pas.camps)
        .map(nom => {
            const [n, d] = comRacional(valors[nom]);
            return d === 1 ? String(n) : `${n}/${d}`;
        })
        .join(' ; ');
}
