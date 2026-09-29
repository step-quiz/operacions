/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/check-repo.js
 * ROL: Comprovacions de tot el repositori (no executa cap joc):
 *   1. Sintaxi de tots els fitxers JS i dels <script> inline dels HTML.
 *   2. Enllaços locals trencats (href, src, location.href, llista d'index.html).
 *   3. Codis d'exercici (js/exercise-codes.js) coherents amb les pàgines.
 *   4. Guardes contra errors ja corregits que no han de tornar:
 *      barrejat esbiaixat, PDF.js sense isEvalSupported:false, zoom bloquejat.
 * ÚS: node tests/check-repo.js
 * ============================================================================
 */
'use strict';
const fs    = require('fs');
const path  = require('path');
const vm    = require('vm');
const { spawnSync } = require('child_process');
const { ROOT, suite, ok, finish, loadModule, listFiles } = require('./harness');

const read   = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = f => fs.existsSync(path.join(ROOT, f));
const htmlFiles = listFiles('.', ['.html']).sort();
const jsFiles   = listFiles('.', ['.js']).sort();

// Treu comentaris HTML i blocs <style> (un "<script>" dins d'un comentari CSS
// no és un script de debò).
const stripNoise = h => h.replace(/<!--[\s\S]*?-->/g, '').replace(/<style[\s\S]*?<\/style>/gi, '');

/** Comprova la sintaxi d'un codi JS sense executar-lo. Retorna el missatge d'error o null. */
function syntaxError(code, filename, isModule) {
    if (isModule) {
        const r = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: code, encoding: 'utf8' });
        return r.status === 0 ? null : (r.stderr.split('\n').find(l => /Error/.test(l)) || 'error de sintaxi');
    }
    try { new vm.Script(code, { filename }); return null; } catch (e) { return e.message; }
}

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Sintaxi JavaScript');
{
    const errors = [];
    for (const f of jsFiles) {
        const src = read(f);
        const isModule = /^\s*(import|export)\s/m.test(src);
        const err = syntaxError(src, f, isModule);
        if (err) errors.push(`${f}: ${err}`);
    }
    ok(`${jsFiles.length} fitxers .js sense errors de sintaxi`, !errors.length, errors.join('\n      → '));

    const inlineErrors = [];
    let count = 0;
    for (const f of htmlFiles) {
        const h = stripNoise(read(f));
        for (const m of h.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
            const attrs = m[1] || '', code = m[2];
            if (/\bsrc\s*=/.test(attrs) || !code.trim()) continue;
            count++;
            if (/application\/ld\+json/.test(attrs)) {
                try { JSON.parse(code); } catch (e) { inlineErrors.push(`${f} (JSON-LD): ${e.message}`); }
                continue;
            }
            const err = syntaxError(code, f, /type\s*=\s*["']module/.test(attrs));
            if (err) inlineErrors.push(`${f}: ${err}`);
        }
    }
    ok(`${count} blocs <script> inline sense errors de sintaxi`, !inlineErrors.length, inlineErrors.join('\n      → '));
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Enllaços locals');
{
    const broken = [];
    const isExternal = u => /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/.test(u) || u.includes('${') || u.includes("'+") || u === '';
    const check = (from, url, baseDir) => {
        const clean = url.split(/[?#]/)[0];
        if (isExternal(url) || !clean) return;
        const target = clean.startsWith('/') ? clean.slice(1) : path.join(baseDir, clean);
        if (!exists(target) && !exists(target + '.html')) broken.push(`${from} → ${url}`);
    };
    for (const f of htmlFiles) {
        const h = stripNoise(read(f)), dir = path.dirname(f);
        for (const m of h.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) check(f, m[1], dir);
        for (const m of h.matchAll(/location\.href\s*=\s*['"]([^'"]+\.html)/g))  check(f, m[1], dir);
        for (const m of h.matchAll(/['"](vendor\/[^'"]+)['"]/g))                    check(f, m[1], dir);
    }
    // La llista d'activitats del generador d'enllaços (index.html)
    const idx = read('index.html');
    for (const m of idx.matchAll(/\b(?:file|yt):\s*'([^']+)'/g)) check('index.html (llista)', m[1], '.');
    // Redireccions dins dels fitxers JS (relatives a la pàgina, que és a l'arrel)
    for (const f of jsFiles.filter(f => f.startsWith('js/'))) {
        for (const m of read(f).matchAll(/location\.href\s*=\s*['"]([^'"]+\.html)/g)) check(f, m[1], '.');
    }
    ok(`cap enllaç local trencat (${htmlFiles.length} pàgines)`, !broken.length, broken.join('\n      → '));
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Codis d\'exercici (js/exercise-codes.js)');
{
    const w = loadModule(['js/exercise-codes.js']);
    const codes = w.EXERCISE_CODES, entries = Object.entries(codes);

    const badFormat = entries.filter(([, c]) => !/^[A-Z]{2}$/.test(c)).map(([n, c]) => `${n}: ${c}`);
    ok('tots els codis són 2 lletres majúscules', !badFormat.length, badFormat.join(', '));

    const seen = {}, dups = [];
    entries.forEach(([n, c]) => { if (seen[c]) dups.push(`${c} (${seen[c]}, ${n})`); seen[c] = n; });
    ok('cap codi repetit', !dups.length, dups.join(', '));

    const reserved = entries.filter(([, c]) => c === 'CB' || c === 'XX').map(([n]) => n);
    ok("no es fa servir 'CB' (projecte cb) ni 'XX' (codi d'error)", !reserved.length, reserved.join(', '));

    const noPage = entries.map(([n]) => n).filter(n => !n.startsWith('a-') && !exists(`${n}.html`));
    ok('cada exercici de la taula té la seva pàgina HTML', !noPage.length, noPage.join(', '));

    const gamePages = htmlFiles.filter(f => !f.includes(path.sep) && /src=["']js\/game-core\.js["']/.test(read(f)));
    const missing = [], order = [], noCode = [];
    for (const f of gamePages) {
        const h = read(f);
        const iCodes = h.search(/src=["']js\/exercise-codes\.js["']/);
        const iCore  = h.search(/src=["']js\/game-core\.js["']/);
        if (iCodes < 0) missing.push(f); else if (iCodes > iCore) order.push(f);
        if (!codes[f.replace(/\.html$/, '')]) noCode.push(f);
    }
    ok(`les ${gamePages.length} pàgines amb game-core.js carreguen exercise-codes.js`, !missing.length, missing.join(', '));
    ok('exercise-codes.js es carrega ABANS de game-core.js', !order.length, order.join(', '));
    ok("cada pàgina amb game-core.js té codi d'exercici (si no, genera 'XX')", !noCode.length, noCode.join(', '));
    ok("l'analitzador carrega exercise-codes.js",
       /src=["']js\/exercise-codes\.js["']/.test(read('analitzador-stepquiz.html')));
}

// ─────────────────────────────────────────────────────────────────────────────
suite('4. Errors corregits que no han de tornar');
{
    const sources = [...htmlFiles, ...jsFiles].filter(f => !f.startsWith('tests' + path.sep));

    // Barrejar amb sort(() => Math.random() - 0.5) NO és aleatori de manera uniforme:
    // la resposta correcta queda massa sovint a la 1a posició. Cal fer servir shuffle().
    // Detecta qualsevol .sort(...) amb Math.random dins la funció de comparació.
    const biased = /\.sort\(\s*(?:\([^)]*\)\s*=>|\w+\s*=>|function\s*\([^)]*\)\s*\{)[^;]{0,80}?Math\.random/;
    const biasedHits = sources.filter(f => biased.test(read(f)));
    ok('cap barrejat esbiaixat amb sort(() => Math.random() ...)', !biasedHits.length, biasedHits.join(', '));

    // PDF.js 3.x: cal isEvalSupported:false a cada getDocument (CVE-2024-4367)
    const pdfBad = [];
    for (const f of sources) {
        for (const m of read(f).matchAll(/getDocument\(([^)]*)\)/g)) {
            if (!/isEvalSupported\s*:\s*false/.test(m[1])) pdfBad.push(f);
        }
    }
    ok('PDF.js: totes les crides a getDocument porten isEvalSupported: false', !pdfBad.length, pdfBad.join(', '));

    // No bloquejar el zoom (WCAG 1.4.4)
    const zoomBad = htmlFiles.filter(f => /<meta[^>]+name=["']viewport["'][^>]*(user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b)/i.test(read(f)));
    ok('cap pàgina bloqueja el zoom (user-scalable=no / maximum-scale=1)', !zoomBad.length, zoomBad.join(', '));
}

finish('COMPROVACIONS DEL REPOSITORI');
