/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/gots-fitxes/gots-fitxes.js
 * ROL: Joc «Gots i Fitxes — Equacions» (gots-fitxes.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa game-core.js, utils.js, config.js.
 * ============================================================================
 */

import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt, randInt } from '../utils.js';
import {
    state,
    endSession,
    hideCustomKeyboard,
    hideMiniOverlay,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbMarkForOverwrite,
    recordAnswerToHistory,
    recordResult,
    showCustomKeyboard,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, { checkCurrentCell, continueObservation, continueToNext, buildLevel });

// ============================================================
// CODI ESPECÍFIC DE "GOTS I FITXES"
// (no redeclarem: attemptsLeft, currentSession, currentOperation,
//                 sessionScore, isTransitioning, currentDifficulty)
// ============================================================

// ---- Cache DOM ----
const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    scene: document.getElementById('scene-svg-container'),
    caption: document.getElementById('scene-caption'),
    equationPrev: document.getElementById('equation-prev'),
    equation: document.getElementById('equation-display'),
    stepInstr: document.getElementById('step-instruction'),
    answerInput: document.getElementById('answer-input'),
    btnCheck: document.getElementById('btn-check'),
    btnContinue: document.getElementById('btn-continue'),
    btnNext: document.getElementById('btn-next'),
    feedback: document.getElementById('feedback-area'),
};

// ---- Estat específic del joc ----
let currentEquation = null; // { level, ... }
let currentLevel = 1; // 1..4
let phases = []; // descripció dels passos de la pregunta actual
let currentPhase = 0; // índex dins de `phases`
let isPenalizing = false;
let awaitingNext = false; // esperant que l'usuari cliqui "Equació següent"
let lastQuestionSuccess = false;
let lastQuestionPoints = 0;

// ---- Llegim el nivell de la URL (per defecte 2; admetem 1..4) ----
(function readLevel() {
    const raw = new URLSearchParams(window.location.search).get('nivell');
    const n = parseInt(raw, 10);
    currentLevel = Number.isFinite(n) && n >= 1 && n <= 4 ? n : 2;
    // game-core llegeix també currentDifficulty per al codi v2; el clamp ja és 0-3.
    state.currentDifficulty = Math.min(currentLevel, 3);
})();

// ---- Construeix els enllaços dels botons de nivell preservant la resta
// de paràmetres de la URL (totaloperations, totalsessions, etc.), i marca
// com a "active" el botó del nivell actual. Clicar el botó k és equivalent
// a fer la crida HTML amb ?nivell=k (recàrrega completa de la pàgina). ----
(function setupLevelSwitcher() {
    document.querySelectorAll('#level-switcher .level-btn').forEach(btn => {
        const lvl = parseInt(btn.dataset.level, 10);
        const params = new URLSearchParams(window.location.search);
        params.set('nivell', String(lvl));
        btn.href = '?' + params.toString();
        if (lvl === currentLevel) {
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'page');
            // Evitem la recàrrega innecessària si l'usuari clica el nivell actual.
            btn.addEventListener('click', e => e.preventDefault());
        }
    });
})();

// ============================================================
// 1. GENERACIÓ D'EQUACIONS
// ============================================================
function generateEquation(level) {
    if (level === 1) {
        const a = randInt(2, 4);
        const x = randInt(1, 9);
        return { level: 1, a, x, total: a * x };
    }
    if (level === 2) {
        const a = randInt(2, 4);
        const x = randInt(1, 9);
        const b = randInt(1, 6);
        return { level: 2, a, b, x, c: a * x + b };
    }
    if (level === 3) {
        // ax + b = cx + d amb a-c >= 2 (perquè el pas final no sigui trivial),
        // x ∈ [1,5], b ∈ [1,4]. d = (a-c)*x + b → integer x, b ≠ d.
        const a = randInt(3, 5);
        const c = randInt(1, a - 2);
        const x = randInt(1, 5);
        const b = randInt(1, 4);
        const d = (a - c) * x + b;
        return { level: 3, a, b, c, d, x };
    }
    // level === 4: p(cx + d) + ax + b = total
    let p, cpp, dpp, aOut, bOut, x, total;
    do {
        p = randInt(2, 3);
        cpp = randInt(1, 2); // cups per plate (capat a 2 per limitar el total visual)
        dpp = randInt(1, 4); // chips per plate
        aOut = randInt(0, 2); // cups outside plates
        bOut = randInt(1, 6); // chips outside plates
        x = randInt(1, 4); // x capat a 4 per mantenir total raonable
    } while (p * cpp + aOut < 2); // guard: almenys 2 gots en total
    total = p * (cpp * x + dpp) + aOut * x + bOut;
    return { level: 4, p, c: cpp, d: dpp, a: aOut, b: bOut, x, total };
}

// ============================================================
// 2. PHASE MACHINE (passos de cada pregunta)
// ============================================================
function determinePhases(eq) {
    if (eq.level === 1) {
        return [
            {
                kind: 'input',
                instruction: `Quantes fitxes hi ha a sota cada got?`,
                expected: eq.x,
                hint: `${eq.total} fitxes repartides entre ${eq.a} gots.`,
            },
        ];
    }
    if (eq.level === 2) {
        return [
            {
                kind: 'input',
                instruction: `Quantes fitxes vols treure de la taula?`,
                expected: eq.b,
                hint: `Mira les fitxes soltes: n'hi ha ${eq.b} a la taula amb gots. Treu el mateix nombre de cada costat.`,
            },
            {
                kind: 'input',
                instruction: `Quantes fitxes hi ha a sota cada got?`,
                expected: eq.x,
                hint: `${eq.c - eq.b} fitxes repartides entre ${eq.a} gots.`,
            },
        ];
    }
    if (eq.level === 3) {
        return [
            {
                kind: 'input',
                instruction: `Quantes fitxes vols treure de la taula?`,
                expected: eq.b,
                hint: `Mira les fitxes soltes del costat amb menys gots: n'hi ha ${eq.b}. Treu el mateix nombre de cada costat.`,
            },
            {
                kind: 'input',
                instruction: `Quantes fitxes hi ha a sota cada got?`,
                expected: eq.x,
                hint: `${eq.d - eq.b} fitxes repartides entre ${eq.a - eq.c} gots.`,
            },
        ];
    }
    // level 4
    const totalCups = eq.p * eq.c + eq.a;
    const totalChips = eq.p * eq.d + eq.b;
    const rhsAfter = eq.total - totalChips;
    // Helper: tria singular/plural i, opcionalment, omet l'element quan n === 0.
    const ng = n => `${n} ${n === 1 ? 'got' : 'gots'}`;
    const nf = n => `${n} ${n === 1 ? 'fitxa' : 'fitxes'}`;
    // Construïm la frase "Observa: ..." amb cura — sense "0 got(s)" ni "fitxa(es)".
    const insidePlates = `${ng(eq.c)} i ${nf(eq.d)}`;
    let outside;
    if (eq.a > 0 && eq.b > 0) outside = `, més ${ng(eq.a)} i ${nf(eq.b)} fora dels plats`;
    else if (eq.a > 0) outside = `, més ${ng(eq.a)} fora dels plats`;
    else if (eq.b > 0) outside = `, més ${nf(eq.b)} fora dels plats`;
    else outside = '';
    const observeText = `Observa: ${eq.p} plats amb ${insidePlates} cada un${outside}. Tot suma ${eq.total} fitxes. Quan ho entenguis, continua.`;
    // Construcció robusta de les pistes (singular/plural i omissió de 0).
    const cupsHint = eq.a > 0 ? `${eq.p} plats × ${ng(eq.c)} + ${ng(eq.a)} fora` : `${eq.p} plats × ${ng(eq.c)}`;
    const chipsHint = eq.b > 0 ? `${eq.p} plats × ${nf(eq.d)} + ${nf(eq.b)} fora` : `${eq.p} plats × ${nf(eq.d)}`;
    return [
        {
            kind: 'observe',
            instruction: observeText,
        },
        {
            kind: 'input',
            instruction: `Expandeix els plats. Quants gots hi ha ara a la taula en total?`,
            expected: totalCups,
            hint: `${cupsHint}.`,
        },
        {
            kind: 'input',
            instruction: `I quantes fitxes soltes hi ha ara en total?`,
            expected: totalChips,
            hint: `${chipsHint}.`,
        },
        {
            kind: 'input',
            instruction: `Quantes fitxes vols treure de la taula?`,
            expected: totalChips,
            hint: `Les ${totalChips} fitxes soltes: n'has de treure les mateixes de cada costat.`,
        },
        {
            kind: 'input',
            instruction: `Quantes fitxes hi ha a sota cada got?`,
            expected: eq.x,
            hint: `${rhsAfter} fitxes repartides entre ${totalCups} gots.`,
        },
    ];
}

// ============================================================
// 3. RENDERITZADOR DE L'ESCENA SVG
// ============================================================
// Constants de layout
const CUP_W = 50,
    CUP_H = 40; // amplada/alçada del got
const CHIP_R = 9; // radi de la fitxa
const TABLE_Y = 105; // línia de la taula (per a levels 1-3)

// ---- helpers de SVG ----
function svgCup(x, y, idx, side) {
    // got cap per avall: trapezoid més ample a dalt
    const wTop = CUP_W,
        wBot = CUP_W - 14;
    const dx = (wTop - wBot) / 2;
    const pts = [`${x},${y}`, `${x + wTop},${y}`, `${x + wTop - dx},${y + CUP_H}`, `${x + dx},${y + CUP_H}`].join(' ');
    // fitxes "amagades" sota el got (apareixeran en aixecar-lo)
    return `<g class="cup-group" data-side="${side}" data-idx="${idx}" style="transform-box:fill-box;transform-origin:center;">
        <polygon class="cup-body" points="${pts}"/>
        <rect class="cup-rim" x="${x + dx - 1}" y="${y + CUP_H - 3}" width="${wBot + 2}" height="4" rx="1.5"/>
    </g>`;
}

function svgChip(cx, cy, idx, side, hidden) {
    const cls = hidden ? 'chip-circle chip-inside' : 'chip-circle';
    return `<g class="chip-group" data-side="${side}" data-idx="${idx}">
        <circle class="${cls}" cx="${cx}" cy="${cy}" r="${CHIP_R}"/>
    </g>`;
}

function chipLayout(count, xStart, xEnd, baseY) {
    // distribueix `count` fitxes en files si calen, dins de [xStart, xEnd], baseline = baseY
    const positions = [];
    if (count === 0) return positions;
    const usableW = xEnd - xStart;
    const minSpacing = 2 * CHIP_R + 3;
    const perRow = Math.max(1, Math.min(count, Math.floor(usableW / minSpacing)));
    const rows = Math.ceil(count / perRow);
    for (let r = 0; r < rows; r++) {
        const itemsInRow = r === rows - 1 ? count - (rows - 1) * perRow : perRow;
        const rowW = (itemsInRow - 1) * minSpacing;
        const startX = xStart + (usableW - rowW) / 2;
        const y = baseY - r * (2 * CHIP_R + 2);
        for (let k = 0; k < itemsInRow; k++) {
            positions.push({ cx: startX + k * minSpacing, cy: y });
        }
    }
    return positions;
}

// distribució de gots en una zona (rang x)
function cupLayout(count, xStart, xEnd, cupY) {
    const positions = [];
    if (count === 0) return positions;
    const totalCupsW = count * CUP_W + (count - 1) * 6;
    const startX = xStart + (xEnd - xStart - totalCupsW) / 2;
    for (let i = 0; i < count; i++) {
        positions.push({ x: startX + i * (CUP_W + 6), y: cupY });
    }
    return positions;
}

function renderScene(eq) {
    if (eq.level === 4) return renderSceneL4(eq);
    return renderSceneL123(eq);
}

function renderSceneL123(eq) {
    // Només dibuixem el costat ESQUERRE: el dret va a la llegenda textual (#scene-caption).
    let cups, chips;
    if (eq.level === 1) {
        cups = eq.a;
        chips = 0;
    } else if (eq.level === 2) {
        cups = eq.a;
        chips = eq.b;
    } else {
        cups = eq.a;
        chips = eq.b;
    } // level 3: igual

    const VB_W = 400,
        VB_H = 130;
    const X1 = 10,
        X2 = VB_W - 10;
    const cupY = TABLE_Y - CUP_H;
    const chipBaseY = TABLE_Y - CHIP_R - 2;

    // Distribució: si hi ha gots I fitxes, les amplades es repartixen segons
    // el contingut natural i el tot queda centrat. Si només hi ha gots o
    // només hi ha fitxes, ocupen tota la zona disponible.
    let cupPos = [],
        chipPos = [];
    if (cups > 0 && chips > 0) {
        const cupsW = cups * CUP_W + (cups - 1) * 6;
        const minSpacing = 2 * CHIP_R + 3;
        const chipsRowW = Math.min(chips, Math.floor((X2 - X1 - cupsW - 16) / minSpacing)) * minSpacing;
        const totalW = cupsW + 16 + Math.max(chipsRowW, minSpacing);
        const startX = X1 + Math.max(0, (X2 - X1 - totalW) / 2);
        for (let i = 0; i < cups; i++) {
            cupPos.push({ x: startX + i * (CUP_W + 6), y: cupY });
        }
        const chipsStart = startX + cupsW + 16;
        chipPos = chipLayout(chips, chipsStart, Math.max(chipsStart + minSpacing, X2), chipBaseY);
    } else if (cups > 0) {
        cupPos = cupLayout(cups, X1, X2, cupY);
    } else if (chips > 0) {
        chipPos = chipLayout(chips, X1, X2, chipBaseY);
    }

    let svg = `<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">`;
    // Línia de la taula
    svg += `<line class="table-line" x1="5" y1="${TABLE_Y}" x2="${VB_W - 5}" y2="${TABLE_Y}"/>`;
    // (Sense signe igual ni costat dret: la informació del total va a la llegenda.)

    // gots esquerra amb les fitxes "amagades" sota cada got (per a l'animació final)
    cupPos.forEach((p, i) => {
        svg += svgCup(p.x, p.y, i, 'left');
        const insidePositions = chipLayout(eq.x, p.x - 3, p.x + CUP_W + 3, TABLE_Y - 4);
        insidePositions.forEach((q, j) => {
            svg += `<g class="chip-group chip-inside-group" data-side="left-inside" data-idx="${i}-${j}">
                <circle class="chip-inside" cx="${q.cx}" cy="${q.cy}" r="${CHIP_R - 1}"/>
            </g>`;
        });
    });
    // fitxes soltes esquerra
    chipPos.forEach((p, i) => {
        svg += svgChip(p.cx, p.cy, i, 'left');
    });

    svg += `</svg>`;
    els.scene.innerHTML = svg;
}

function renderSceneL4(eq) {
    // Només esquerra: plats + zona de fora. El total va a la llegenda.
    const VB_W = 540,
        VB_H = 180;
    const PLATE_TABLE_Y = 140;
    const cupY = PLATE_TABLE_Y - CUP_H;
    const chipBaseY = PLATE_TABLE_Y - CHIP_R - 2;

    const x1 = 15,
        x2 = VB_W - 15;
    const zoneCount = eq.p + (eq.a + eq.b > 0 ? 1 : 0);
    const zoneW = (x2 - x1) / Math.max(zoneCount, 1);

    let svg = `<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">`;
    svg += `<line class="table-line" x1="5" y1="${PLATE_TABLE_Y}" x2="${VB_W - 5}" y2="${PLATE_TABLE_Y}"/>`;
    // (Sense signe igual ni costat dret.)

    // Plats
    for (let i = 0; i < eq.p; i++) {
        const zx1 = x1 + i * zoneW;
        const zx2 = zx1 + zoneW - 8;
        const cx = (zx1 + zx2) / 2;
        const cy = PLATE_TABLE_Y - 4;
        const rx = (zx2 - zx1) / 2;
        const ry = 14;
        svg += `<g class="plate-group" data-plate="${i}">
            <ellipse class="plate-ellipse" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
        </g>`;
        // dins el plat: gots a l'esquerra, fitxes a la dreta
        const innerX1 = zx1 + 6,
            innerX2 = zx2 - 6;
        const split = innerX1 + (innerX2 - innerX1) * (eq.c > 0 && eq.d > 0 ? 0.55 : 1);
        const cupPos = cupLayout(eq.c, innerX1, split, cupY);
        const chipPos = chipLayout(eq.d, split, innerX2, chipBaseY);
        cupPos.forEach((p, j) => {
            svg += svgCup(p.x, p.y, `p${i}c${j}`, `plate${i}`);
        });
        chipPos.forEach((p, j) => {
            svg += svgChip(p.cx, p.cy, `p${i}h${j}`, `plate${i}`);
        });
    }

    // Fora dels plats
    if (eq.a + eq.b > 0) {
        const zx1 = x1 + eq.p * zoneW;
        const zx2 = x2;
        const split = zx1 + (zx2 - zx1) * (eq.a > 0 && eq.b > 0 ? 0.45 : 1);
        const cupPos = cupLayout(eq.a, zx1, split, cupY);
        const chipPos = chipLayout(eq.b, split, zx2, chipBaseY);
        cupPos.forEach((p, j) => {
            svg += svgCup(p.x, p.y, `o${j}`, 'outside');
        });
        chipPos.forEach((p, j) => {
            svg += svgChip(p.cx, p.cy, `o${j}`, 'outside');
        });
    }

    svg += `</svg>`;
    els.scene.innerHTML = svg;
}

// ============================================================
// 3b. LLEGENDA DE L'ESCENA — substitueix el "costat dret" visual
// ============================================================
// Després de cada pas, indica què hi ha "a l'altre costat" amb una frase.
function getSceneCaption(eq, phaseIdx) {
    if (eq.level === 1) {
        // L1 té una única fase, que ja és la final.
        return `Tenim ${eq.total} fitxes repartides a parts iguals entre els ${eq.a} gots.`;
    }
    if (eq.level === 2) {
        // ph0: estat inicial (b fitxes soltes visibles + a gots amb fitxes amagades).
        // ph1: pas final, ja sense fitxes soltes; queden c-b repartides entre els a gots.
        if (phaseIdx === 0) return `Tenim ${eq.c} fitxes en total, però algunes estan sota els gots.`;
        return `Tenim ${eq.c - eq.b} fitxes repartides a parts iguals entre els ${eq.a} gots.`;
    }
    if (eq.level === 3) {
        // ph0: hi ha gots a tots dos costats; ho descrivim explícitament perquè el dret no es dibuixa.
        // ph1: després d'emparellar gots i retirar fitxes, queden d-b fitxes repartides entre a-c gots.
        if (phaseIdx === 0) {
            const gotStr = eq.c === 1 ? 'got' : 'gots';
            return `A l'altre costat hi ha ${eq.c} ${gotStr} i ${eq.d} fitxes; algunes estan sota els gots.`;
        }
        const cupsLeft = eq.a - eq.c;
        const gotStr = cupsLeft === 1 ? 'got' : 'gots';
        return `Tenim ${eq.d - eq.b} fitxes repartides a parts iguals entre ${cupsLeft === 1 ? "l'únic" : `els ${cupsLeft}`} ${gotStr}.`;
    }
    // level 4
    const totalCups = eq.p * eq.c + eq.a;
    const totalChips = eq.p * eq.d + eq.b;
    const rhsAfter = eq.total - totalChips;
    // ph0..ph3: encara hi ha fitxes soltes a la vista, total = eq.total.
    // ph4: després de retirar fitxes → rhsAfter repartides entre totalCups gots.
    if (phaseIdx <= 3) return `Tenim ${eq.total} fitxes en total, però algunes estan sota els gots.`;
    return `Tenim ${rhsAfter} fitxes repartides a parts iguals entre els ${totalCups} gots.`;
}

function renderSceneCaption(eq, phaseIdx) {
    els.caption.classList.add('eq-updating');
    setTimeout(() => {
        els.caption.innerText = getSceneCaption(eq, phaseIdx);
        els.caption.classList.remove('eq-updating');
    }, 200);
}

// ============================================================
// 4. ANIMACIONS ENTRE PASSOS
// ============================================================
function animateSceneToPhase(phaseIdx) {
    const eq = currentEquation;
    if (!eq) return;

    if (eq.level === 1) {
        if (phaseIdx === 1) {
            // Final: aixequem els gots i revelem les fitxes
            els.scene.querySelectorAll('.cup-group').forEach(g => g.classList.add('cup-lifted'));
            els.scene.querySelectorAll('.chip-inside').forEach(c => c.classList.add('chip-revealed'));
        }
        return;
    }

    if (eq.level === 2) {
        if (phaseIdx === 1) {
            // ph0→ph1: el jugador acaba de respondre "treu b fitxes" → animem la retirada
            els.scene
                .querySelectorAll('.chip-group[data-side="left"], .chip-group[data-side="right"]')
                .forEach(g => g.classList.add('chip-removed'));
        } else if (phaseIdx === 2) {
            // ph1→final: aixequem els gots i revelem les fitxes amagades
            els.scene.querySelectorAll('.cup-group[data-side="left"]').forEach(g => g.classList.add('cup-lifted'));
            els.scene.querySelectorAll('.chip-inside').forEach(c => c.classList.add('chip-revealed'));
        }
        return;
    }

    if (eq.level === 3) {
        if (phaseIdx === 1) {
            // ph0→ph1: retirem b fitxes i emparellem c gots de cada costat
            const leftCups = els.scene.querySelectorAll('.cup-group[data-side="left"]');
            for (let i = 0; i < eq.c && i < leftCups.length; i++) leftCups[i].classList.add('chip-removed');
            els.scene.querySelectorAll('.cup-group[data-side="right"]').forEach(g => g.classList.add('chip-removed'));
            els.scene
                .querySelectorAll('.chip-group[data-side="left"], .chip-group[data-side="right"]')
                .forEach(g => g.classList.add('chip-removed'));
            els.scene
                .querySelectorAll('.chip-group[data-side="right-inside"]')
                .forEach(g => g.classList.add('chip-removed'));
        } else if (phaseIdx === 2) {
            // ph1→final: aixequem els gots esquerra restants i revelem fitxes
            const leftCups = els.scene.querySelectorAll('.cup-group[data-side="left"]');
            for (let i = eq.c; i < leftCups.length; i++) leftCups[i].classList.add('cup-lifted');
            els.scene.querySelectorAll('.chip-group[data-side="left-inside"]').forEach(g => {
                const [cupIdx] = g.dataset.idx.split('-').map(Number);
                if (cupIdx >= eq.c) {
                    g.querySelectorAll('.chip-inside').forEach(c => c.classList.add('chip-revealed'));
                }
            });
        }
        return;
    }

    if (eq.level === 4) {
        if (phaseIdx === 1) {
            // Expandeix els plats: les vores dels plats s'esvaeixen
            els.scene.querySelectorAll('.plate-ellipse').forEach(p => p.classList.add('plate-fading'));
        } else if (phaseIdx === 4) {
            // ph3→ph4: retira totes les fitxes soltes (i les de dintre dels plats expandits)
            els.scene
                .querySelectorAll(
                    '.chip-group[data-side="right"], .chip-group[data-side="outside"], .chip-group[data-side^="plate"]'
                )
                .forEach(g => g.classList.add('chip-removed'));
        } else if (phaseIdx === 5) {
            // ph4→final: aixequem tots els gots i revelem les fitxes
            els.scene.querySelectorAll('.cup-group').forEach(g => g.classList.add('cup-lifted'));
            els.scene.querySelectorAll('.chip-inside').forEach(c => c.classList.add('chip-revealed'));
        }
        return;
    }
}

// ============================================================
// 5. RENDERITZAT DE L'EQUACIÓ EN TEXT
// ============================================================
function fmtCoef(n, withSpan) {
    const inner = withSpan ? '<span class="eq-var">x</span>' : 'x';
    if (n === 1) return inner;
    if (n === -1) return '−' + inner;
    return `${n}${inner}`;
}

function buildEquationHTML(eq, phaseIdx) {
    if (eq.level === 1) {
        if (phaseIdx === 0) return `${fmtCoef(eq.a, true)} <span class="eq-sign">=</span> ${eq.total}`;
        return `<span class="eq-var">x</span> <span class="eq-sign">=</span> ${eq.x}`;
    }
    if (eq.level === 2) {
        // ph0: equació original. ph1: després de restar b a cada banda.
        if (phaseIdx === 0) return `${fmtCoef(eq.a, true)} + ${eq.b} <span class="eq-sign">=</span> ${eq.c}`;
        if (phaseIdx === 1) return `${fmtCoef(eq.a, true)} <span class="eq-sign">=</span> ${eq.c - eq.b}`;
        return `<span class="eq-var">x</span> <span class="eq-sign">=</span> ${eq.x}`;
    }
    if (eq.level === 3) {
        // ph0: equació original. ph1: després de restar c·x i b a cada banda.
        if (phaseIdx === 0)
            return `${fmtCoef(eq.a, true)} + ${eq.b} <span class="eq-sign">=</span> ${fmtCoef(eq.c, true)} + ${eq.d}`;
        if (phaseIdx === 1) return `${fmtCoef(eq.a - eq.c, true)} <span class="eq-sign">=</span> ${eq.d - eq.b}`;
        return `<span class="eq-var">x</span> <span class="eq-sign">=</span> ${eq.x}`;
    }
    // level 4 (5 fases: observe, cups-total, chips-total, treure, per-cup)
    const totalCups = eq.p * eq.c + eq.a;
    const totalChips = eq.p * eq.d + eq.b;
    const rhsAfter = eq.total - totalChips;
    if (phaseIdx === 0) {
        const outer =
            eq.a > 0 || eq.b > 0 ? ` + ${eq.a > 0 ? fmtCoef(eq.a, true) + (eq.b > 0 ? ' + ' + eq.b : '') : eq.b}` : '';
        return `${eq.p}<span class="eq-bracket">(${fmtCoef(eq.c, true)} + ${eq.d})</span>${outer} <span class="eq-sign">=</span> ${eq.total}`;
    }
    if (phaseIdx === 1 || phaseIdx === 2) {
        // Forma expandida: p·c·x + p·d + a·x + b = total
        let parts = [];
        parts.push(fmtCoef(eq.p * eq.c, true));
        parts.push(String(eq.p * eq.d));
        if (eq.a > 0) parts.push(fmtCoef(eq.a, true));
        if (eq.b > 0) parts.push(String(eq.b));
        return parts.join(' + ') + ` <span class="eq-sign">=</span> ${eq.total}`;
    }
    if (phaseIdx === 3) {
        // Forma combinada, abans de la sostracció
        return `${fmtCoef(totalCups, true)} + ${totalChips} <span class="eq-sign">=</span> ${eq.total}`;
    }
    if (phaseIdx === 4) {
        // Després de retirar fitxes: pas final (per-cup)
        return `${fmtCoef(totalCups, true)} <span class="eq-sign">=</span> ${rhsAfter}`;
    }
    return `<span class="eq-var">x</span> <span class="eq-sign">=</span> ${eq.x}`;
}

function renderEquationText(eq, phaseIdx) {
    els.equation.classList.add('eq-updating');
    els.equationPrev.classList.add('eq-updating');
    setTimeout(() => {
        els.equation.innerHTML = buildEquationHTML(eq, phaseIdx);
        // L'equació "prèvia" mostra l'estat anterior DIFERENT, en gris.
        const prevHTML = prevEquationHTML(eq, phaseIdx);
        els.equationPrev.innerHTML = prevHTML || '';
        // Marquem com a resolt quan l'índex passa de l'última fase d'entrada
        // (és a dir, quan ja mostrem la forma "x = ans" després de respondre).
        const isFinal = phaseIdx >= phases.length;
        els.equation.classList.toggle('eq-solved', isFinal && lastWasCorrect);
        els.equation.classList.remove('eq-updating');
        els.equationPrev.classList.remove('eq-updating');
    }, 200);
}

// Retorna l'HTML de l'equació anterior "distinta" (en gris, més petita), o null si no n'hi ha.
// Per L4, ph1 i ph2 mostren la mateixa equació expandida; el pas a ph2 manté la prèvia (= original).
function prevEquationHTML(eq, phaseIdx) {
    if (phaseIdx <= 0) return null;
    // Estat post-final: phaseIdx === phases.length → mostrem "x = ans".
    // La prèvia és l'última equació "no resolta" (phases.length - 1).
    if (phaseIdx >= phases.length) return buildEquationHTML(eq, phases.length - 1);
    let prevIdx;
    if (eq.level === 4) {
        // Mapa de fase actual → fase amb l'equació anterior DIFERENT
        const map = { 1: 0, 2: 0, 3: 1, 4: 3 };
        prevIdx = phaseIdx in map ? map[phaseIdx] : phaseIdx - 1;
    } else {
        prevIdx = phaseIdx - 1;
    }
    return buildEquationHTML(eq, prevIdx);
}

function formatEquationString(eq) {
    if (eq.level === 1) return `${eq.a}x = ${eq.total}`;
    if (eq.level === 2) return `${eq.a}x + ${eq.b} = ${eq.c}`;
    if (eq.level === 3) return `${eq.a}x + ${eq.b} = ${eq.c}x + ${eq.d}`;
    const outer = (eq.a > 0 ? ` + ${eq.a}x` : '') + (eq.b > 0 ? ` + ${eq.b}` : '');
    return `${eq.p}(${eq.c}x + ${eq.d})${outer} = ${eq.total}`;
}

// ============================================================
// 6. GAME FLOW
// ============================================================
let lastWasCorrect = false;

function updateHeader() {
    els.sessionDisplay.innerText = `Sessió ${state.currentSession + 1} de ${TOTAL_SESSIONS}`;
    els.lvlDisplay.innerText = `Pregunta ${state.currentOperation + 1} de ${TOTAL_OPERATIONS}`;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;
    els.attemptsDisplay.innerText = `Intents: ${state.attemptsLeft}`;
    els.attemptsDisplay.className = 'attempts-counter';
    if (state.attemptsLeft <= 1) els.attemptsDisplay.classList.add('danger');
}

function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    lastWasCorrect = false;

    currentEquation = generateEquation(currentLevel);
    phases = determinePhases(currentEquation);
    currentPhase = 0;

    renderScene(currentEquation);
    renderSceneCaption(currentEquation, currentPhase);
    renderEquationText(currentEquation, currentPhase);
    showCurrentPhase();
    updateHeader();
}

function showCurrentPhase() {
    const phase = phases[currentPhase];
    els.stepInstr.innerText = phase.instruction;
    els.feedback.innerHTML = '';
    els.feedback.className = '';
    els.answerInput.value = '';
    els.btnNext.style.display = 'none';

    if (phase.kind === 'observe') {
        els.answerInput.style.display = 'none';
        els.btnCheck.style.display = 'none';
        els.btnContinue.style.display = 'inline-block';
        hideCustomKeyboard();
    } else {
        els.answerInput.style.display = '';
        els.btnCheck.style.display = '';
        els.btnContinue.style.display = 'none';
        if (isTouchDevice()) {
            showCustomKeyboard(els.answerInput);
        } else {
            els.answerInput.focus();
        }
    }
}

function continueObservation() {
    if (state.isTransitioning) return;
    if (phases[currentPhase].kind !== 'observe') return;
    advancePhase();
}

function checkCurrentCell() {
    if (state.isTransitioning || isPenalizing) return;
    const phase = phases[currentPhase];
    if (!phase || phase.kind !== 'input') return;

    const raw = els.answerInput.value.trim();
    if (raw === '') return;
    const val = parseStrictInt(raw);

    if (isNaN(val) || val !== phase.expected) {
        recordAnswerToHistory(`Pas ${currentPhase + 1} de "${formatEquationString(currentEquation)}"`, raw, false);
        shakeInput();
        showFeedback('❌ ' + phase.hint, 'fail');
        penalize();
        if (isTouchDevice()) {
            kbMarkForOverwrite(els.answerInput);
        } else {
            els.answerInput.value = '';
            els.answerInput.focus();
        }
        return;
    }

    // Correcte
    recordAnswerToHistory(`Pas ${currentPhase + 1} de "${formatEquationString(currentEquation)}"`, raw, true);
    showFeedback('✓', 'success');
    advancePhase();
}

function advancePhase() {
    state.isTransitioning = true;
    hideCustomKeyboard();

    const isLast = currentPhase + 1 >= phases.length;

    if (isLast) {
        // Última fase d'entrada superada → mostrem "x = ans" i acabem.
        lastWasCorrect = true;
        const solvedIdx = phases.length; // índex "post-final" → render "x = ans"
        renderEquationText(currentEquation, solvedIdx);
        renderSceneCaption(currentEquation, currentPhase);
        animateSceneToPhase(currentPhase + 1); // animació final (aixecar gots, etc.)
        setTimeout(() => finishQuestion(true), 1200);
        return;
    }

    // Animació visual de transició a la fase següent
    setTimeout(() => {
        currentPhase++;
        animateSceneToPhase(currentPhase);
        renderSceneCaption(currentEquation, currentPhase);
        renderEquationText(currentEquation, currentPhase);
        setTimeout(() => {
            state.isTransitioning = false;
            showCurrentPhase();
            updateHeader();
        }, 700);
    }, 400);
}

// L'usuari ha decidit passar a la pregunta següent (o, si és la darrera de la
// darrera sessió, a la pantalla final amb el codi).
function continueToNext() {
    if (!awaitingNext) return;
    awaitingNext = false;
    els.btnNext.style.display = 'none';
    proceedAfterQuestion();
}

function penalize() {
    if (isPenalizing) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink-warning');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink-warning');
        state.attemptsLeft--;
        updateHeader();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            // mostra resposta correcta i acaba
            const phase = phases[currentPhase];
            if (phase && phase.kind === 'input') {
                showFeedback(`La resposta correcta era ${phase.expected}.`, 'fail');
            }
            setTimeout(() => finishQuestion(false), 1800);
        }
        isPenalizing = false;
    }, 700);
}

function finishQuestion(success) {
    const attemptCode = success ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4;
    recordResult(attemptCode);

    hideCustomKeyboard();
    // La nota de game-core.js compta 10 punts màxims per pregunta
    // (MAX_PUNTS_PREGUNTA): cal sumar els mateixos punts que mostra l'overlay.
    lastQuestionPoints = success ? Math.max(0, 10 - (MAX_INTENTS - state.attemptsLeft)) : 0;
    lastQuestionSuccess = success;
    state.sessionScore += lastQuestionPoints;
    els.scoreDisplay.innerText = `Punts: ${state.sessionScore}`;

    // Cas especial: si era la darrera pregunta de la darrera sessió, anem
    // directament a la pantalla final (no té sentit demanar "Equació següent").
    const isLastOfAll = state.currentOperation + 1 >= TOTAL_OPERATIONS && state.currentSession + 1 >= TOTAL_SESSIONS;
    if (isLastOfAll) {
        proceedAfterQuestion();
        return;
    }

    // Mostrem el botó "Equació següent →" i amaguem la resta de controls.
    awaitingNext = true;
    els.answerInput.style.display = 'none';
    els.btnCheck.style.display = 'none';
    els.btnContinue.style.display = 'none';
    els.btnNext.style.display = 'inline-block';
    // El feedback ja conté el ✓ o el missatge d'error final; el deixem.
}

// Es crida quan l'usuari clica "Equació següent" — o automàticament quan és
// la pregunta finalíssima de tot l'exercici.
function proceedAfterQuestion() {
    const success = lastQuestionSuccess;
    const points = lastQuestionPoints;
    const waitTime =
        typeof showMiniOverlay === 'function'
            ? showMiniOverlay(success ? points : 0, {
                  successColor: 'var(--primary-dark)',
                  pointsColor: 'var(--success)',
              })
            : 1500;

    setTimeout(() => {
        if (typeof hideMiniOverlay === 'function') hideMiniOverlay();
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

// ============================================================
// 7. HELPERS UI
// ============================================================
function shakeInput() {
    els.answerInput.classList.remove('shake');
    void els.answerInput.offsetWidth; // force reflow
    els.answerInput.classList.add('shake');
}

function showFeedback(text, type) {
    els.feedback.innerHTML = text;
    els.feedback.className = type === 'success' ? 'success' : '';
}

// Estil opcional per el "blink-warning" del comptador d'intents
(function injectBlinkStyle() {
    const css = `
        .attempts-counter.blink-warning { animation: blinkAttempts 0.7s ease-in-out; }
        @keyframes blinkAttempts {
            0%, 100% { background-color: var(--primary-light); }
            50%      { background-color: #facc15; }
        }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
})();

// ---- Teclat físic (Enter) ----
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (els.gameScreen.style.display === 'none') return;
    e.preventDefault();
    if (awaitingNext) {
        continueToNext();
        return;
    }
    const phase = phases[currentPhase];
    if (!phase || state.isTransitioning) return;
    if (phase.kind === 'observe') {
        continueObservation();
    } else {
        checkCurrentCell();
    }
});

// ============================================================
// 8. ARRENCADA
// ============================================================
injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false, allowZero: true });
startGame();
