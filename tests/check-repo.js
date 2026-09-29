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
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const { ROOT, suite, ok, finish, loadModule, listFiles } = require('./harness');

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = f => fs.existsSync(path.join(ROOT, f));
const htmlFiles = listFiles('.', ['.html']).sort();
const jsFiles = listFiles('.', ['.js']).sort();

// Treu comentaris HTML i blocs <style> (un "<script>" dins d'un comentari CSS
// no és un script de debò).
const stripNoise = h => h.replace(/<!--[\s\S]*?-->/g, '').replace(/<style[\s\S]*?<\/style>/gi, '');

/** Comprova la sintaxi d'un codi JS sense executar-lo. Retorna el missatge d'error o null. */
function syntaxError(code, filename, isModule) {
    if (isModule) {
        const r = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: code, encoding: 'utf8' });
        return r.status === 0 ? null : r.stderr.split('\n').find(l => /Error/.test(l)) || 'error de sintaxi';
    }
    try {
        new vm.Script(code, { filename });
        return null;
    } catch (e) {
        return e.message;
    }
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
            const attrs = m[1] || '',
                code = m[2];
            if (/\bsrc\s*=/.test(attrs) || !code.trim()) continue;
            count++;
            if (/application\/ld\+json/.test(attrs)) {
                try {
                    JSON.parse(code);
                } catch (e) {
                    inlineErrors.push(`${f} (JSON-LD): ${e.message}`);
                }
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
    const isExternal = u =>
        /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/.test(u) || u.includes('${') || u.includes("'+") || u === '';
    const check = (from, url, baseDir) => {
        const clean = url.split(/[?#]/)[0];
        if (isExternal(url) || !clean) return;
        const target = clean.startsWith('/') ? clean.slice(1) : path.join(baseDir, clean);
        if (!exists(target) && !exists(target + '.html')) broken.push(`${from} → ${url}`);
    };
    for (const f of htmlFiles) {
        const h = stripNoise(read(f)),
            dir = path.dirname(f);
        for (const m of h.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) check(f, m[1], dir);
        for (const m of h.matchAll(/location\.href\s*=\s*['"]([^'"]+\.html)/g)) check(f, m[1], dir);
        for (const m of h.matchAll(/['"](vendor\/[^'"]+)['"]/g)) check(f, m[1], dir);
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
suite("3. Codis d'exercici (js/exercise-codes.js)");
{
    const w = loadModule(['js/exercise-codes.js']);
    const codes = w.EXERCISE_CODES,
        entries = Object.entries(codes);

    const badFormat = entries.filter(([, c]) => !/^[A-Z]{2}$/.test(c)).map(([n, c]) => `${n}: ${c}`);
    ok('tots els codis són 2 lletres majúscules', !badFormat.length, badFormat.join(', '));

    const seen = {},
        dups = [];
    entries.forEach(([n, c]) => {
        if (seen[c]) dups.push(`${c} (${seen[c]}, ${n})`);
        seen[c] = n;
    });
    ok('cap codi repetit', !dups.length, dups.join(', '));

    const reserved = entries.filter(([, c]) => c === 'CB' || c === 'XX').map(([n]) => n);
    ok("no es fa servir 'CB' (projecte cb) ni 'XX' (codi d'error)", !reserved.length, reserved.join(', '));

    const noPage = entries.map(([n]) => n).filter(n => !n.startsWith('a-') && !exists(`${n}.html`));
    ok('cada exercici de la taula té la seva pàgina HTML', !noPage.length, noPage.join(', '));

    const gamePages = htmlFiles.filter(f => !f.includes(path.sep) && /src=["']js\/game-core\.js["']/.test(read(f)));
    const missing = [],
        order = [],
        noCode = [];
    for (const f of gamePages) {
        const h = read(f);
        const iCodes = h.search(/src=["']js\/exercise-codes\.js["']/);
        const iCore = h.search(/src=["']js\/game-core\.js["']/);
        if (iCodes < 0) missing.push(f);
        else if (iCodes > iCore) order.push(f);
        if (!codes[f.replace(/\.html$/, '')]) noCode.push(f);
    }
    ok(
        `les ${gamePages.length} pàgines amb game-core.js carreguen exercise-codes.js`,
        !missing.length,
        missing.join(', ')
    );
    ok('exercise-codes.js es carrega ABANS de game-core.js', !order.length, order.join(', '));
    ok("cada pàgina amb game-core.js té codi d'exercici (si no, genera 'XX')", !noCode.length, noCode.join(', '));
    ok(
        "l'analitzador carrega exercise-codes.js",
        /src=["']js\/exercise-codes\.js["']/.test(read('analitzador-stepquiz.html'))
    );
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
    const zoomBad = htmlFiles.filter(f =>
        /<meta[^>]+name=["']viewport["'][^>]*(user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b)/i.test(read(f))
    );
    ok('cap pàgina bloqueja el zoom (user-scalable=no / maximum-scale=1)', !zoomBad.length, zoomBad.join(', '));
}

// ─────────────────────────────────────────────────────────────────────────────
suite('5. Sessions fixes (?fixed=A/B/C)');
{
    // Activitats que el generador d'enllaços ofereix amb "Sessió fixa"
    const offered = [...read('index.html').matchAll(/\{\s*file:\s*'([^']+\.html)'[^}]*\bfixed:\s*true[^}]*\}/g)].map(
        m => m[1]
    );
    ok(`index.html ofereix sessió fixa en ${offered.length} activitats`, offered.length > 0);

    const notLoaded = [],
        notFirst = [],
        noHook = [];
    for (const f of offered) {
        const h = stripNoise(read(f));
        const scripts = [...h.matchAll(/<script\b[^>]*>/gi)].map(m => m[0]);
        if (!scripts.some(s => /src=["']js\/fixed-sessions\.js["']/.test(s))) {
            notLoaded.push(f);
            continue;
        }
        // Ha d'anar abans de qualsevol altre script del projecte (js/…): utils, config, game-core…
        const firstLocal = scripts.find(s => /src=["']js\//.test(s));
        if (!/src=["']js\/fixed-sessions\.js["']/.test(firstLocal)) notFirst.push(f);
        // Sense game-core.js, la pàgina ha de tornar a sembrar ella mateixa a cada exercici
        if (!/src=["']js\/game-core\.js["']/.test(h)) {
            const own = [
                h,
                ...[...h.matchAll(/src=["'](js\/[^"']+\.js)["']/g)]
                    .map(m => m[1])
                    .filter(exists)
                    .map(read),
            ].join('\n');
            if (!/FixedSessions\??\.(seed|next|wrap)\(/.test(own)) noHook.push(f);
        }
    }
    ok("totes les que l'ofereixen carreguen js/fixed-sessions.js", !notLoaded.length, notLoaded.join(', '));
    ok('fixed-sessions.js es carrega abans que cap altre script de js/', !notFirst.length, notFirst.join(', '));
    ok(
        'les pàgines sense game-core.js tornen a sembrar a cada exercici (FixedSessions.seed/next)',
        !noHook.length,
        noHook.join(', ')
    );
    ok(
        'game-core.js embolcalla buildLevel en començar el joc',
        /FixedSessions\.wrap\(\s*'buildLevel'/.test(read('js/game-core.js'))
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('6. Colors comuns (css/tokens.css)');
{
    const tokensSrc = read('css/tokens.css');
    const CANON = [...tokensSrc.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]);
    ok(`css/tokens.css defineix ${CANON.length} colors comuns`, CANON.length >= 10);

    // Cap altre fitxer de l'arrel ni de css/ els pot redefinir
    const own = [...htmlFiles.filter(f => !f.includes(path.sep)), ...listFiles('css', ['.css'])].filter(
        f => f !== path.join('css', 'tokens.css')
    );
    const redefined = [];
    for (const f of own) {
        const hit = CANON.find(t => new RegExp(`${t}\\s*:`).test(read(f)));
        if (hit) redefined.push(`${f} (${hit})`);
    }
    ok('cap altre fitxer redefineix els colors comuns', !redefined.length, redefined.join(', '));

    // Les pàgines que els fan servir han d'enllaçar tokens.css abans de cap altre CSS
    const uses = s => CANON.some(t => s.includes(`var(${t})`) || s.includes(`var(${t},`));
    const noLink = [],
        badOrder = [];
    for (const f of htmlFiles.filter(f => !f.includes(path.sep))) {
        const h = read(f);
        const linked = [...h.matchAll(/href=["'](css\/[^"'?]+)/g)].map(m => m[1]).filter(exists);
        if (!uses(h + linked.map(read).join('\n'))) continue;
        const iTok = h.search(/href=["']css\/tokens\.css["']/);
        if (iTok < 0) {
            noLink.push(f);
            continue;
        }
        const iOther = [h.search(/href=["']css\/(?!tokens\.css)/), h.search(/<style[\s>]/)].filter(i => i >= 0);
        if (iOther.some(i => i < iTok)) badOrder.push(f);
    }
    ok('les pàgines que fan servir els colors comuns enllacen css/tokens.css', !noLink.length, noLink.join(', '));
    ok('css/tokens.css es carrega abans que cap altre estil', !badOrder.length, badOrder.join(', '));
}

finish('COMPROVACIONS DEL REPOSITORI');
