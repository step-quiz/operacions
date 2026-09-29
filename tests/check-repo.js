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
 *   5. Sessions fixes: les pàgines que les ofereixen carreguen fixed-sessions.js.
 *   6. Colors comuns: tothom fa servir css/tokens.css.
 *   7. Mòduls ES: els import existeixen, els onclick troben la seva funció,
 *      i els controladors criden window.buildLevel().
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

// ─────────────────────────────────────────────────────────────────────────────
suite('7. Mòduls ES (import/export)');
{
    const isESM = src => /^\s*(import|export)\s/m.test(src);
    const IMPORT_RE = /^\s*import\s+(?:\{([^}]*)\}\s+from\s+)?['"]([^'"]+)['"]/gm;
    const exportsOf = src =>
        new Set([
            ...[...src.matchAll(/^\s*export\s+(?:const|let|var|function\*?|class)\s+([\w$]+)/gm)].map(m => m[1]),
            ...[...src.matchAll(/^\s*export\s*\{([^}]*)\}/gm)].flatMap(m =>
                m[1].split(',').map(s =>
                    s
                        .trim()
                        .split(/\s+as\s+/)
                        .pop()
                )
            ),
        ]);

    // Codi JS de cada pàgina: els <script> inline i els fitxers que carrega,
    // seguint els import dels mòduls. type: 'classic' o 'module'.
    const scriptsOf = f => {
        const h = stripNoise(read(f)),
            out = [],
            seen = new Set();
        const addFile = (file, type) => {
            if (seen.has(file) || !exists(file)) return;
            seen.add(file);
            const src = read(file);
            out.push({ name: file, src, type });
            if (type === 'module') {
                for (const m of src.matchAll(IMPORT_RE)) addFile(path.join(path.dirname(file), m[2]), 'module');
            }
        };
        for (const m of h.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
            const attrs = m[1] || '';
            if (/application\/ld\+json/.test(attrs)) continue;
            const type = /type\s*=\s*["']module/.test(attrs) ? 'module' : 'classic';
            const src = attrs.match(/\bsrc\s*=\s*["']([^"'?#]+)/);
            if (src) addFile(path.join(path.dirname(f), src[1]), type);
            else if (m[2].trim()) {
                out.push({ name: `${f} (inline)`, src: m[2], type });
                if (type === 'module') {
                    for (const i of m[2].matchAll(IMPORT_RE)) addFile(path.join(path.dirname(f), i[2]), 'module');
                }
            }
        }
        return out;
    };

    // 1) Cada import apunta a un fitxer que existeix (camí relatiu amb .js) i que exporta aquells noms
    const importSources = [
        ...jsFiles
            .filter(f => f.startsWith('js' + path.sep))
            .map(f => ({ name: f, src: read(f), dir: path.dirname(f) })),
        ...htmlFiles.flatMap(f =>
            scriptsOf(f)
                .filter(s => s.name.endsWith('(inline)'))
                .map(s => ({ ...s, dir: path.dirname(f) }))
        ),
    ];
    const badImports = [];
    let nImports = 0;
    for (const { name, src, dir } of importSources) {
        for (const m of src.matchAll(IMPORT_RE)) {
            nImports++;
            const [, names, spec] = m;
            if (!/^\.\.?\//.test(spec) || !spec.endsWith('.js')) {
                badImports.push(`${name}: '${spec}' (cal un camí relatiu acabat en .js)`);
                continue;
            }
            const target = path.join(dir, spec);
            if (!exists(target)) {
                badImports.push(`${name}: '${spec}' no existeix`);
                continue;
            }
            const exported = exportsOf(read(target));
            for (const n of (names || '')
                .split(',')
                .map(s => s.trim().split(/\s+as\s+/)[0])
                .filter(Boolean)) {
                if (!exported.has(n)) badImports.push(`${name}: '${spec}' no exporta ${n}`);
            }
        }
    }
    ok(
        `${nImports} import: el fitxer existeix i exporta el que s'hi demana`,
        !badImports.length,
        badImports.join('\n      → ')
    );

    // 2) Un fitxer amb import/export s'ha de carregar amb type="module" (si no, el navegador no l'executa)
    const notModule = [];
    for (const f of htmlFiles) {
        for (const m of stripNoise(read(f)).matchAll(/<script(\s[^>]*)>/gi)) {
            const src = m[1].match(/\bsrc\s*=\s*["']([^"'?#]+)/);
            if (!src || /type\s*=\s*["']module/.test(m[1])) continue;
            const file = path.join(path.dirname(f), src[1]);
            if (exists(file) && isESM(read(file))) notModule.push(`${f} → ${src[1]}`);
        }
    }
    ok('els mòduls ES es carreguen amb <script type="module">', !notModule.length, notModule.join(', '));

    // 3) Les funcions cridades des dels onclick/onchange… han de ser globals. Dins d'un mòdul
    //    NO ho són: cal exposar-les amb window.X = … o Object.assign(window, { … }).
    const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'return', 'function', 'typeof', 'new', 'catch', 'void']);
    const BROWSER = [
        'alert',
        'confirm',
        'prompt',
        'event',
        'window',
        'document',
        'location',
        'history',
        'navigator',
        'open',
        'close',
        'print',
        'scrollTo',
        'fetch',
        'requestAnimationFrame',
        'getComputedStyle',
    ];
    const handlerCalls = src => {
        const calls = [];
        for (const m of src.matchAll(
            /\bon(?:click|change|input|keydown|keyup|keypress|submit|blur|focus)\s*=\s*\\?(["'])([\s\S]*?)\\?\1/g
        )) {
            for (const c of m[2].replace(/\$\{[^}]*\}/g, '0').matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
                if (!KEYWORDS.has(c[1])) calls.push(c[1]);
            }
        }
        return calls;
    };
    const unexposed = [];
    let nHandlers = 0;
    for (const f of htmlFiles) {
        const scripts = scriptsOf(f);
        const globalsHere = new Set([...Object.getOwnPropertyNames(globalThis), ...BROWSER]);
        for (const { src, type } of scripts) {
            if (type === 'classic') {
                for (const m of src.matchAll(/\bfunction\s+([\w$]+)\s*\(/g)) globalsHere.add(m[1]);
                for (const m of src.matchAll(/^\s*(?:const|let|var)\s+([\w$]+)\s*=/gm)) globalsHere.add(m[1]);
            }
            for (const m of src.matchAll(/\bwindow\.([\w$]+)\s*=/g)) globalsHere.add(m[1]);
            for (const m of src.matchAll(/Object\.assign\(\s*window\s*,\s*\{([^}]*)\}/g)) {
                m[1].split(',').forEach(s => globalsHere.add(s.trim().split(/\s*:/)[0]));
            }
        }
        const texts = [{ name: f, src: stripNoise(read(f)).replace(/<script[\s\S]*?<\/script>/gi, '') }, ...scripts];
        for (const { name, src } of texts) {
            for (const fn of handlerCalls(src)) {
                nHandlers++;
                if (!globalsHere.has(fn)) unexposed.push(`${name}: ${fn}() (pàgina ${f})`);
            }
        }
    }
    ok(
        `${nHandlers} crides des d'onclick/onchange… a funcions accessibles globalment`,
        !unexposed.length,
        [...new Set(unexposed)].join('\n      → ')
    );

    // 4) Els controladors que exposen buildLevel l'han de cridar com a window.buildLevel():
    //    les sessions fixes (js/fixed-sessions.js) substitueixen window.buildLevel per una
    //    versió que sembra cada pregunta, i una crida directa se la saltaria.
    const esmFiles = jsFiles.filter(f => f.startsWith('js' + path.sep) && isESM(read(f)));
    const bareCalls = [];
    for (const f of esmFiles) {
        const src = read(f);
        if (!/Object\.assign\(\s*window\s*,\s*\{[^}]*\bbuildLevel\b/.test(src) && !/window\.buildLevel\s*=/.test(src)) {
            continue;
        }
        src.split('\n').forEach((line, i) => {
            if (/(?<![\w$.])buildLevel\s*\(/.test(line.replace(/\bfunction\s+buildLevel\s*\(/, ''))) {
                bareCalls.push(`${f}:${i + 1}`);
            }
        });
    }
    ok('els mòduls criden window.buildLevel(), mai buildLevel() directament', !bareCalls.length, bareCalls.join(', '));

    // 5) Els mòduls exporten els seus espais de noms; no els tornen a posar a window
    const nsOnWindow = esmFiles.filter(f => /\bwindow\.[A-Z][\w$]*\s*=\s*\(/.test(read(f)));
    ok(
        `cap dels ${esmFiles.length} mòduls ES defineix espais de noms a window (window.X = (() => …))`,
        !nsOnWindow.length,
        nsOnWindow.join(', ')
    );
}

finish('COMPROVACIONS DEL REPOSITORI');
