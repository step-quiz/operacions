/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/pissarra-activitat.js
 * ROL: La bateria comuna de proves de la «Resolució pas a pas» d'una activitat
 *      (A3 de la revisió del 14/11/2026): una activitat només ha de dir com es
 *      resol cada exercici, com es llegeix cada línia i què ha de valer.
 * ARQUITECTURA:
 * - provaActivitat(nom, opcions) recorre els exercicis (milers, fets amb llavor)
 *   i fa aquestes comprovacions, cadascuna amb un ok() de harness.js:
 *     1. el guió sencer de cada exercici (els passos que el controlador envia a
 *        la pissarra) passa la revisió dels guions (comprova.js comprovaGuio);
 *     2. cada pas, menys el primer, mou alguna peça (reanomena, fusiona o
 *        reparteix), si escriu alguna línia (un pas que només destaca, com el
 *        detall de prioritat, no) i la pissarra no era buida (si el primer pas
 *        només és l'enunciat, com a Fórmules STEAM, el segon no té d'on moure);
 *     3. cap pas no en mou més de maxPeces;
 *     4. cada línia que es veu, a cada pas, és certa: veritat() és un model
 *        independent del codi que es prova (aritmètica exacta, feta al test);
 *     5. sense les claus, cada fila de la pissarra és l'HTML de sempre (el que
 *        pinta l'activitat sense ?pissarra=1), si l'exercici porta «clasic»;
 *     6. si l'exercici té detall a demanda («vista»), totes les vistes
 *        (comprova.js comprovaDetall: la compacta, cada pas obert i tots oberts),
 *        i la vista amb tots els passos oberts passa també les comprovacions 2, 3
 *        i 4 (cada línia del detall és certa).
 * - opcions:
 *     exercicis   iterable (pot ser un generador) d'exercicis { on, passos,
 *                 files?, clasic?, vista?, … }: on, el nom als missatges; passos,
 *                 el guió; files, les seves files (si cada exercici en té unes);
 *                 clasic[i], les files del pas i sense claus; vista, la funció
 *                 ({ oberts }) → passos del guió amb detall;
 *     eines       { comprovaGuio, comprovaDetall } (de comprova.js, carregat
 *                 amb loadModule o import());
 *     files       les files de la pissarra (1);
 *     linies      (fila) → les línies que hi ha en una fila (per defecte, la
 *                 fila sencera si no és buida);
 *     veritat     (linia, exercici) → '' si la línia és certa, o què falla;
 *     maxPeces    el màxim de peces que pot moure un pas;
 *     minExercicis el mínim d'exercicis (perquè la prova no passi buida);
 *     text        com a comprovaGuio (els historials de les activitats no en tenen).
 * ÚS: const { provaActivitat } = require('./pissarra-activitat');
 * ============================================================================
 */
'use strict';
const { ok } = require('./harness');

/** Una fila de la pissarra sense les claus: treu els <span data-k> que només hi són per la clau, i els data-k. */
const senseClaus = html => html.replace(/<span data-k="[^"]*">([^<]*)<\/span>/g, '$1').replace(/ data-k="[^"]*"/g, '');

/** Quantes peces mou un pas (les que baixen volant o es fusionen en una altra). */
const pecesMogudes = pas =>
    Object.keys(pas.reanomena || {}).length +
    Object.values(pas.fusiona || {}).flat().length +
    Object.values(pas.reparteix || {}).flat().length;

function provaActivitat(
    nom,
    {
        exercicis,
        eines,
        files = 1,
        linies = fila => (fila ? [fila] : []),
        veritat,
        maxPeces,
        minExercicis = 1,
        text = false,
    }
) {
    const { comprovaGuio, comprovaDetall } = eines;
    const errors = { guio: [], buits: [], falses: [], diferents: [], detall: [] };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    let n = 0,
        animacions = 0,
        mesPeces = 0,
        vistes = 0,
        ambClasic = 0,
        ambDetall = 0;
    for (const ex of exercicis) {
        n++;
        const { on, passos } = ex;
        const nFiles = ex.files ?? files;
        for (const e of comprovaGuio(passos, nFiles, on, { text })) anota(errors.guio, e);
        if (ex.clasic) ambClasic++;
        // Les comprovacions 2, 3 i 4 dels passos d'una vista
        const revisa = (llista, nomVista) =>
            llista.forEach((pas, i) => {
                const aqui = `${on}${nomVista}, pas ${pas.id || i + 1}`;
                // Un pas que no escriu cap línia (només destaca, p. ex. el detall de prioritat) no ha de moure res
                const nomesMarca = i > 0 && pas.estat && pas.estat.length === llista[i - 1].estat.length;
                // Si la pissarra era buida (el primer pas només és l'enunciat), no hi ha res d'on moure
                const primeraLinia = i > 0 && llista[i - 1].estat && llista[i - 1].estat.length === 0;
                if (i > 0 && !nomesMarca && !primeraLinia) {
                    animacions++;
                    const peces = pecesMogudes(pas);
                    mesPeces = Math.max(mesPeces, peces);
                    if (!peces) anota(errors.buits, aqui);
                }
                for (const fila of pas.files)
                    for (const linia of linies(fila)) {
                        vistes++;
                        const falla = veritat(linia, ex);
                        if (falla) anota(errors.falses, `${aqui}: ${falla}`);
                    }
            });
        revisa(passos, '');
        if (ex.clasic)
            passos.forEach((pas, i) => {
                if (JSON.stringify(pas.files.map(senseClaus)) !== JSON.stringify(ex.clasic[i]))
                    anota(errors.diferents, `${on}, pas ${i + 1}`);
            });
        if (ex.vista) {
            ambDetall++;
            for (const e of comprovaDetall(ex.vista, nFiles, on, { text })) anota(errors.detall, e);
            const oberts = new Set(passos.filter(p => p.teDetall).map(p => p.id));
            if (oberts.size) revisa(ex.vista({ oberts }), ' (tot el detall)');
        }
    }
    const llista = l => l.join('\n      → ');
    ok(
        `${nom}: ${animacions} animacions de ${n} exercicis passen la revisió dels guions`,
        n >= minExercicis && !errors.guio.length,
        llista(errors.guio)
    );
    ok(`${nom}: cada pas mou alguna peça`, !errors.buits.length, llista(errors.buits));
    ok(
        `${nom}: cada pas mou poques peces (com a màxim ${mesPeces}; cap pas en mou més de ${maxPeces})`,
        mesPeces <= maxPeces
    );
    ok(
        `${nom}: les ${vistes} línies que es veuen són certes`,
        vistes > 0 && !errors.falses.length,
        llista(errors.falses)
    );
    if (ambClasic)
        ok(`${nom}: sense claus, la pissarra és l’HTML de sempre`, !errors.diferents.length, llista(errors.diferents));
    if (ambDetall)
        ok(
            `${nom}: el detall a demanda de ${ambDetall} exercicis (totes les vistes)`,
            !errors.detall.length,
            llista(errors.detall)
        );
    return { exercicis: n, animacions, mesPeces, linies: vistes };
}

module.exports = { provaActivitat, senseClaus, pecesMogudes };
