/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/analitzador-stepquiz/analitzador-stepquiz.js
 * ROL: Joc «StepQuiz — Analitzador de resultats» (analitzador-stepquiz.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa exercise-codes.js.
 * ============================================================================
 */

import { EXERCISE_NAMES } from '../exercise-codes.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, {
    setView,
    exportGradebookXLSX,
    resetView,
    openHelp,
    switchMode,
    handleFile,
    handlePaste,
    onSingleInput,
    analyzeSingle,
    applyFilters,
    toggleDatePicker,
    clearDateRange,
    closeDatePicker,
    clearFilters,
    openCB,
    sortBy,
    closeCB,
    exportCBtxt,
    exportCBxlsx,
    closeHelp,
    toggleDet,
    drShift,
    drPick,
    drPreset,
    drHoverDay,
    showTip,
    hideTip,
});

// Codis d'exercici: taula única compartida amb game-core.js (js/exercise-codes.js).
// 'CB' és el codi que genera el projecte cb (Competències Bàsiques).
const EX = { ...EXERCISE_NAMES, CB: 'competencies-basiques' };
const LC = 'TRWAGMYFPDXBNJZSQVHLCKE',
    GAP = 15;
let allRows = [],
    filtRows = [],
    expIdx = null;
let currentView = 'list'; // 'list' | 'book'
let sortKey = null,
    sortDir = 1; // ordenació de la vista Enviaments

function csvLine(l, sep) {
    const r = [];
    let c = '',
        q = false;
    for (const ch of l) {
        if (ch === '"') q = !q;
        else if (ch === sep && !q) {
            r.push(c.trim());
            c = '';
        } else c += ch;
    }
    r.push(c.trim());
    return r;
}
function parseCSV(txt) {
    const ls = txt.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    if (ls.length < 2) return null;
    // Auto-detect separator: tab (Sheets copy-paste) or comma (CSV export)
    const sep = ls[0].includes('\t') ? '\t' : ',';
    const hds = csvLine(ls[0], sep),
        h = hds.map(s => s.toLowerCase());
    let ci = h.findIndex(s => s.includes('codi') || s.includes('stepquiz') || s.includes('code'));
    let ei = h.findIndex(s => s.includes('electr') || s.includes('email') || s.includes('correu'));
    let ti = h.findIndex(s => s.includes('temps') || s.includes('timestamp') || s.includes('data'));
    // Columna de classe/curs (opcional): "Selecciona la classe", "Curs", "Grup"…
    let cli = h.findIndex(
        s => s.includes('classe') || s.includes('curs') || s.includes('grup') || s.includes('nivell')
    );
    const headerFound = ci >= 0; // hem trobat una columna de codi pel nom?
    if (ci < 0 || ei < 0 || ti < 0) {
        const f = csvLine(ls[1], sep);
        if (ci < 0) ci = f.findIndex(v => /^[A-Z][a-z][a-z0-9]{2}-\d{4}/.test(v));
        if (ei < 0) ei = f.findIndex(v => v.includes('@'));
        if (ti < 0) ti = f.findIndex(v => /\d{2}\/\d{2}\/\d{4}/.test(v));
    }
    const h2i = h.findIndex(s => s === 'hora2');
    const rows = ls
        .slice(1)
        .filter(l => l.trim())
        .map(l => {
            const c = csvLine(l, sep);
            return {
                timestamp: ti >= 0 ? (c[ti] || '').trim() : '',
                email: ei >= 0 ? (c[ei] || '').trim() : '',
                rawCode: ci >= 0 ? (c[ci] || '').trim() : '',
                hora2: h2i >= 0 ? (c[h2i] || '').trim() : '',
                classe: cli >= 0 ? (c[cli] || '').trim() : '',
            };
        });
    rows._headerFound = headerFound; // marca per a la validació de contingut
    return rows;
}
function chk(ltr, salt, dd, mm, hh, mn, ni) {
    return LC.charAt((ni + dd + mm + hh + mn + salt.charCodeAt(0)) % 23) === ltr;
}
// Llargada màxima del camp de resultats del format v2: una posició per pregunta.
// Els codis de 30 continuen sent vàlids, perquè la regla accepta el rang 30-50
// (50 = 5 sessions × 10 preguntes, el màxim que permet el generador d'enllaços).
const MAX_RES = 50;
const RE_RES_OK = new RegExp(`^[01234]{30,${MAX_RES}}$`);
const RE_RES_LLARG = new RegExp(`^[01234]{${MAX_RES + 1},}$`);

// Escapa text per inserir-lo dins d'HTML. Tot el que ve del full de respostes
// (codi, correu, classe) l'escriu l'alumne i no és de confiança.
function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parseCode(raw) {
    // Mateixos camps que 'unknown' perquè el detall de la fila no falli (p.note, etc.)
    if (!raw || !raw.trim())
        return {
            format: 'empty',
            valid: false,
            checksumOk: false,
            exercise: '?',
            exerciseCode: '',
            note: null,
            difficulty: 0,
            sessions: null,
            questions: null,
            day: null,
            month: null,
            hour: null,
            minute: null,
            results: '',
            resultsArray: [],
            error: 'Buit',
        };
    const code = raw.trim(),
        p = code.split('-');
    if (
        p.length === 9 &&
        /^[A-Z][a-z][a-z0-9]{2}$/.test(p[0]) &&
        /^\d{4}$/.test(p[1]) &&
        /^\d{4}$/.test(p[2]) &&
        /^[A-Z0-9]{2}$/.test(p[3]) &&
        /^[0-3]$/.test(p[4]) &&
        /^[1-5]$/.test(p[5]) &&
        /^\d{2}$/.test(p[6]) &&
        /^\d{3}$/.test(p[7]) &&
        RE_RES_OK.test(p[8])
    ) {
        const ltr = p[0][0],
            salt = p[0].slice(1),
            dd = +p[1].slice(0, 2),
            mm = +p[1].slice(2, 4),
            hh = +p[2].slice(0, 2),
            mn = +p[2].slice(2, 4);
        const ni = +p[7],
            ok = chk(ltr, salt, dd, mm, hh, mn, ni);
        const result = {
            format: 'v2',
            valid: ok,
            checksumOk: ok,
            exercise: EX[p[3]] || p[3],
            exerciseCode: p[3],
            note: ni / 10,
            difficulty: +p[4],
            sessions: +p[5],
            questions: +p[6],
            day: dd,
            month: mm,
            hour: hh,
            minute: mn,
            results: p[8],
            resultsArray: p[8].split('').map(Number),
            cbNivell: null,
            cbAny: null,
            cbMode: null,
            error: ok ? null : 'Checksum invàlid',
        };
        // Decodifica camps CB del salt i sessions (si exerciseCode==='CB')
        if (p[3] === 'CB') {
            result.cbNivell = salt[0] === 'q' ? '4t ESO' : salt[0] === 's' ? '2n ESO' : null;
            result.cbAny = salt[1] && salt[2] && /^\d{2}$/.test(salt[1] + salt[2]) ? '20' + salt[1] + salt[2] : null;
            result.cbMode = +p[5] === 1 ? 'Examen' : +p[5] === 2 ? 'Pràctica' : null;
        }
        return result;
    }
    if (
        p.length >= 6 &&
        /^[A-Z][a-z][a-z0-9]{2}$/.test(p[0]) &&
        /^\d{4}$/.test(p[1]) &&
        /^\d{4}$/.test(p[2]) &&
        /^[0-9]{30}$/.test(p[p.length - 2]) &&
        p[p.length - 1] === 'cb'
    ) {
        const ltr = p[0][0],
            salt = p[0].slice(1),
            dd = +p[1].slice(0, 2),
            mm = +p[1].slice(2, 4),
            hh = +p[2].slice(0, 2),
            mn = +p[2].slice(2, 4);
        const nota = parseFloat(p[3].replace(',', '.')),
            ni = Math.round(nota * 100),
            ok = chk(ltr, salt, dd, mm, hh, mn, ni);
        const res = p[p.length - 2];
        // Decodifica salt: pos0='s'->2n ESO,'q'->4t ESO; pos1-2=any
        const cbNivell = salt[0] === 'q' ? '4t ESO' : salt[0] === 's' ? '2n ESO' : null;
        const cbAny = salt[1] && salt[2] && /^\d{2}$/.test(salt[1] + salt[2]) ? '20' + salt[1] + salt[2] : null;
        return {
            format: 'v1-cb',
            valid: ok,
            checksumOk: ok,
            exercise: 'cb',
            exerciseCode: 'CB',
            cbNivell,
            cbAny,
            note: nota,
            difficulty: 0,
            sessions: null,
            questions: null,
            day: dd,
            month: mm,
            hour: hh,
            minute: mn,
            results: res,
            resultsArray: res.split('').map(Number),
            error: ok ? null : 'Checksum invàlid',
        };
    }
    // Format bo però massa resultats: val la pena dir-ho, perquè si no l'usuari
    // veu «Format desconegut» i no sap on mirar.
    if (p.length === 9 && RE_RES_LLARG.test(p[8]))
        return {
            format: 'unknown',
            valid: false,
            checksumOk: false,
            exercise: '?',
            exerciseCode: '',
            note: null,
            difficulty: 0,
            sessions: null,
            questions: null,
            day: null,
            month: null,
            hour: null,
            minute: null,
            results: '',
            resultsArray: [],
            error: `El codi porta ${p[8].length} resultats i el màxim admès és ${MAX_RES}`,
        };
    return {
        format: 'unknown',
        valid: false,
        checksumOk: false,
        exercise: '?',
        exerciseCode: '',
        note: null,
        difficulty: 0,
        sessions: null,
        questions: null,
        day: null,
        month: null,
        hour: null,
        minute: null,
        results: '',
        resultsArray: [],
        error: 'Format desconegut',
    };
}

function stu(email) {
    return !email || !email.includes('@') ? email || '—' : email.split('@')[0];
}
function xdate(ts) {
    ts = String(ts);
    // Format ISO (Excel via SheetJS, ja normalitzat): YYYY-MM-DD
    let m = ts.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    // Format Sheets/CSV europeu: D/M/YYYY o DD/MM/YYYY
    m = ts.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return '';
}
function xtime(ts) {
    const m = ts.match(/(\d{1,2}):(\d{2}):\d{2}/);
    return m ? `${String(+m[1]).padStart(2, '0')}:${m[2]}` : '';
}
function ctime(p) {
    return p.hour === null ? null : `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}
function gap(t1, t2) {
    const f = s => {
        const m = s && s.match(/^(\d{1,2}):(\d{2})$/);
        return m ? +m[1] * 60 + +m[2] : null;
    };
    const a = f(t1),
        b = f(t2);
    return a !== null && b !== null ? b - a : null;
}

function processRows(csv) {
    return csv.map((r, i) => {
        const p = parseCode(r.rawCode),
            st = stu(r.email),
            ds = xdate(r.timestamp),
            st2 = xtime(r.timestamp),
            ct = ctime(p),
            g = gap(ct, st2);
        const status = p.valid ? (g !== null && g > GAP ? 'warn' : 'ok') : 'invalid';
        const dd = ds ? ds.slice(8) + '/' + ds.slice(5, 7) : '—';
        return {
            idx: i,
            raw: r,
            parsed: p,
            student: st,
            classe: r.classe || '',
            dateStr: ds,
            dayDisplay: dd,
            sendTime: st2,
            codeTime: ct,
            gap: g,
            status,
        };
    });
}

function dots(arr, sm = true) {
    if (!arr || !arr.some(v => v > 0)) return '<span class="mu">—</span>';
    const cl = ['rd0', 'rd1', 'rd2', 'rd3', 'rd4'];
    if (sm)
        return (
            '<div class="rdots">' +
            arr
                .slice(0, MAX_RES)
                .map(v => `<div class="rd ${cl[v]}"></div>`)
                .join('') +
            '</div>'
        );
    return arr
        .slice(0, MAX_RES)
        .map(v => `<div class="rdlg" style="background:var(--r${v})">${['', '1', '2', '3', '✗'][v] || ''}</div>`)
        .join('');
}

function rnote(n) {
    if (n === null || isNaN(n)) return '<span class="mu">—</span>';
    return `<span class="tm" style="font-weight:700;color:var(--text);">${n.toFixed(1).replace('.', ',')}</span>`;
}
function rstatus(s, e) {
    if (s === 'ok') return `<span title="Checksum correcte">✅</span>`;
    if (s === 'warn') return `<span title="Gap > ${GAP} min" style="cursor:help">⚠️</span>`;
    return `<span title="${e || ''}" style="cursor:help">❌</span>`;
}
function rgap(g) {
    if (g === null) return '<span class="mu">—</span>';
    if (g <= 6) return `<span class="mu">${g < 0 ? g + 'm' : '' + g + 'm'}</span>`;
    if (g <= 15) return `<span style="color:var(--warn)">${g}m</span>`;
    return `<span style="color:var(--danger);font-weight:600">${g}m</span>`;
}

function renderRow(row) {
    const p = row.parsed,
        open = expIdx === row.idx;
    const dif = p.difficulty > 0 ? p.difficulty : '<span class="mu">—</span>';
    const ses = p.sessions || '<span class="mu">—</span>';
    const prg = p.questions || '<span class="mu">—</span>';
    const hd = p.resultsArray && p.resultsArray.some(v => v > 0);
    return `<tr class="${open ? 'row-exp' : ''}" id="row-${row.idx}" onclick="toggleDet(${row.idx})">
    <td style="text-align:center">${rstatus(row.status, p.error)}</td>
    <td class="tm">${row.dayDisplay}</td>
    <td class="tm">${row.sendTime || '<span class="mu">—</span>'}</td>
    <td title="${esc(row.student)}">${esc(row.student)}</td>
    <td class="td-classe tm">${row.classe ? esc(row.classe) : '<span class="mu">—</span>'}</td>
    <td><button class="exp-btn ${open ? 'open' : ''}" onclick="event.stopPropagation();toggleDet(${row.idx})">${open ? '▲' : '▼'}</button></td>
    <td>${rnote(p.note)}</td>
    <td title="${esc(p.exercise || '')}">${esc(p.exercise || '—')}</td>
    <td class="mu" style="text-align:center">${dif}</td>
    <td class="mu" style="text-align:center">${ses}</td>
    <td class="mu" style="text-align:center">${prg}</td>
    <td>${rgap(row.gap)}</td>
    <td>${hd ? dots(p.resultsArray) : '<span class="mu">—</span>'}</td>
  </tr>${open ? renderDet(row) : ''}`;
}

function renderDet(row) {
    const p = row.parsed,
        hd = p.resultsArray && p.resultsArray.some(v => v > 0);
    const items = [
        { k: 'Format', v: p.format },
        { k: 'Data', v: p.day ? `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}` : '—' },
        { k: 'Hora activitat', v: row.codeTime || '—' },
        { k: 'Hora enviament', v: row.sendTime || '—' },
        { k: 'Validació', v: p.checksumOk ? '✅ OK' : '❌ KO' },
        { k: 'Nota', v: p.note !== null ? p.note.toFixed(2).replace('.', ',') : '—' },
    ];
    if (row.classe) items.push({ k: 'Classe', v: row.classe });
    items.push({ k: 'Activitat', v: p.exercise || p.exerciseCode || '—' });
    if (p.cbNivell) items.push({ k: 'Curs', v: p.cbNivell });
    if (p.cbAny) items.push({ k: 'Convocatòria', v: 'CB ' + p.cbAny });
    if (p.cbMode) items.push({ k: 'Mode', v: p.cbMode });
    if (p.format === 'v2' && p.exerciseCode !== 'CB') {
        items.push({ k: 'Dificultat', v: p.difficulty === 0 ? '—' : `Nivell ${p.difficulty}` });
        items.push({ k: 'Sessions', v: String(p.sessions) });
        items.push({ k: 'Preguntes', v: String(p.questions) });
    } else if (p.format === 'v2' && p.exerciseCode === 'CB') {
        items.push({ k: 'Preguntes', v: String(p.questions) });
    }
    const ss = p.sessions || 1,
        qq = p.questions || 30;
    let dhtml = '';
    if (hd) {
        // Capçalera de numeració de preguntes
        const numCols = Math.max(
            ...Array.from({ length: ss }, (_, s) => {
                const sl = p.resultsArray.slice(s * qq, (s + 1) * qq);
                return sl.filter(v => v !== 0).length;
            })
        );
        const numHeader = Array.from({ length: numCols }, (_, i) => `<div class="det-qnum">${i + 1}</div>`).join('');
        dhtml += `<div class="det-qnums"><span class="det-sess-lbl" style="font-size:9px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;">Pregunta</span><div style="display:flex;gap:3px">${numHeader}</div></div>`;
        for (let s = 0; s < ss; s++) {
            const sl = p.resultsArray.slice(s * qq, (s + 1) * qq);
            if (sl.every(v => v === 0)) continue;
            const activeSl = sl.filter(v => v !== 0);
            dhtml += `<div class="det-sess">
        <span class="det-sess-lbl">Sessió ${s + 1}</span>
        <div style="display:flex;gap:3px">${activeSl.map(v => `<div class="rdlg" style="background:var(--r${v})">${['', '1', '2', '3', '✗'][v] || ''}</div>`).join('')}</div>
      </div>`;
        }
    }
    return `<tr class="det-row" id="detail-${row.idx}"><td colspan="13"><div class="det-panel">
    <button class="collapse-btn" onclick="toggleDet(${row.idx})" title="Col·lapsar">▲</button>
    <div class="det-code">${esc(row.raw.rawCode)}</div>
    <div class="det-grid">${items.map(i => `<div class="det-item"><div class="dk">${i.k}</div><div class="dv">${esc(i.v)}</div></div>`).join('')}</div>
    ${
        hd
            ? `<div>${dhtml}<div class="legend">
          <div class="li"><div class="ld" style="background:var(--r1)"></div>1r intent</div>
          <div class="li"><div class="ld" style="background:var(--r2)"></div>2n intent</div>
          <div class="li"><div class="ld" style="background:var(--r3)"></div>3r+ intents</div>
          <div class="li"><div class="ld" style="background:var(--r4)"></div>Fallit</div>
        </div></div>`
            : '<div style="color:var(--muted);font-size:12px">Aquest codi no porta detall pregunta a pregunta.</div>'
    }
  </div></td></tr>`;
}

function renderStats(rows) {
    const el = document.getElementById('stat-pills');
    if (!el) return; // la barra d'estadístiques s'ha retirat de la UI
    const tot = rows.length,
        ok = rows.filter(r => r.status === 'ok').length,
        wn = rows.filter(r => r.status === 'warn').length,
        inv = rows.filter(r => r.status === 'invalid').length;
    const ns = rows
        .filter(r => r.parsed.note !== null && !isNaN(r.parsed.note) && r.status !== 'invalid')
        .map(r => r.parsed.note);
    const avg = ns.length ? (ns.reduce((a, b) => a + b, 0) / ns.length).toFixed(2).replace('.', ',') : '—';
    el.innerHTML = `<div class="sp"><strong>${tot}</strong> entrades</div>
     <div class="sp-sep"></div>
     <div class="sp">✅ <strong class="ok">${ok}</strong></div>
     <div class="sp">⚠️ <strong class="warn">${wn}</strong></div>
     <div class="sp">❌ <strong class="danger">${inv}</strong></div>
     <div class="sp-sep"></div>
     <div class="sp">Nota mitjana: <strong class="avg">${avg}</strong></div>`;
}

function renderTable(rows) {
    const tb = document.getElementById('tbody'),
        em = document.getElementById('empty');
    document.getElementById('count').textContent = `${rows.length} ${rows.length !== 1 ? 'entrades' : 'entrada'}`;
    if (!rows.length) {
        tb.innerHTML = '';
        em.style.display = 'block';
        return;
    }
    em.style.display = 'none';
    tb.innerHTML = rows.map(renderRow).join('');
}

function populateEx(rows) {
    const ex = [...new Set(rows.map(r => r.parsed.exercise).filter(Boolean))].sort();
    document.getElementById('f-ex').innerHTML =
        '<option value="">Tots</option>' + ex.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join('');
}

function populateStu(rows) {
    const stus = [...new Set(rows.map(r => r.student).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    document.getElementById('f-stu').innerHTML =
        '<option value="">Tots</option>' + stus.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
}

function populateClasses(rows) {
    const cls = [...new Set(rows.map(r => r.classe).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );
    document.getElementById('f-cls').innerHTML =
        '<option value="">Totes</option>' + cls.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    // Amaga tot el que és de classe si cap fila en porta
    document.body.classList.toggle('no-classe', cls.length === 0);
}

function applyFilters() {
    const st = document.getElementById('f-stu').value.trim();
    const cls = document.getElementById('f-cls').value;
    const ex = document.getElementById('f-ex').value;
    const sta = document.getElementById('f-sta').value;
    expIdx = null;
    filtRows = allRows.filter(r => {
        if (st && r.student !== st) return false;
        if (cls && r.classe !== cls) return false;
        if (ex && r.parsed.exercise !== ex) return false;
        if (sta && r.status !== sta) return false;
        if (!inDateRange(r.dateStr)) return false;
        return true;
    });
    refreshView();
    renderStats(filtRows);
    checkCBButton();
}

function refreshView() {
    if (currentView === 'book') {
        renderGradebook(filtRows);
    } else {
        renderTable(sortRows(filtRows));
    }
}

// ── Ordenació de la vista Enviaments ──────────────────────────
function sortRows(rows) {
    if (!sortKey) return rows;
    const r = [...rows];
    const val = {
        dia: x => x.dateStr || '',
        alumne: x => x.student || '',
        classe: x => x.classe || '',
        nota: x => (x.parsed.note == null ? -1 : x.parsed.note),
        exercici: x => x.parsed.exercise || '',
    }[sortKey];
    r.sort((a, b) => {
        const va = val(a),
            vb = val(b);
        if (typeof va === 'number') return (va - vb) * sortDir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * sortDir;
    });
    return r;
}
function sortBy(key) {
    if (sortKey === key) sortDir = -sortDir;
    else {
        sortKey = key;
        sortDir = 1;
    }
    // marca visual a la capçalera
    document.querySelectorAll('th.sortable').forEach(th => {
        const on = th.dataset.sort === sortKey;
        th.classList.toggle('sorted', on);
        const a = th.querySelector('.arr');
        if (a) a.textContent = on ? (sortDir > 0 ? '↑' : '↓') : '↕';
    });
    renderTable(sortRows(filtRows));
}

// ── Commutador de vista ───────────────────────────────────────
function setView(v) {
    currentView = v;
    document.getElementById('vt-list').classList.toggle('active', v === 'list');
    document.getElementById('vt-book').classList.toggle('active', v === 'book');
    document.getElementById('table-wrap-el').classList.toggle('hidden', v !== 'list');
    document.getElementById('gb-wrap').classList.toggle('hidden', v !== 'book');
    refreshView();
}

// ── Model de dades de la llibreta ─────────────────────────────
// Retorna { students:[{name,classe,notes:{activitat:{note,count}},avg}], activities:[...] }
// Per a cada alumne+activitat es guarda la nota de l'ÚLTIM enviament vàlid.
function buildGradebook(rows) {
    const valid = rows.filter(r => r.status !== 'invalid' && r.parsed.note != null && !isNaN(r.parsed.note));
    const acts = [...new Set(valid.map(r => r.parsed.exercise).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const map = {}; // clau: nom d'alumne
    valid.forEach(r => {
        const key = r.student || '—';
        if (!map[key]) map[key] = { name: key, classe: r.classe || '', notes: {}, lastDate: '' };
        if (r.classe && !map[key].classe) map[key].classe = r.classe;
        // Data d'enviament més recent de l'alumne (ISO YYYY-MM-DD)
        if (r.dateStr && r.dateStr > map[key].lastDate) map[key].lastDate = r.dateStr;
        const act = r.parsed.exercise || '—';
        const cell = map[key].notes[act] || (map[key].notes[act] = { note: null, count: 0, _t: '' });
        cell.count++;
        // Ens quedem amb l'últim enviament (marca de temps més recent disponible)
        const t = (r.dateStr || '') + ' ' + (r.sendTime || '');
        if (cell.note === null || t >= cell._t) {
            cell.note = r.parsed.note;
            cell._t = t;
        }
    });
    const students = Object.values(map)
        .map(s => {
            const vals = acts.map(a => (s.notes[a] ? s.notes[a].note : null)).filter(v => v != null);
            s.avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
            return s;
        })
        .sort((a, b) => {
            // ordena per classe i després per alumne
            const c = (a.classe || '').localeCompare(b.classe || '', undefined, { numeric: true });
            return c !== 0 ? c : a.name.localeCompare(b.name);
        });
    return { students, activities: acts };
}

function noteClass(n) {
    return n < 5 ? 'n-lo' : n < 7 ? 'n-mid' : 'n-hi';
}

function renderGradebook(rows) {
    const gb = buildGradebook(rows);
    const wrap = document.getElementById('gb-wrap');
    if (!gb.students.length) {
        wrap.innerHTML = '<div class="empty-state">🔍 Cap nota vàlida amb els filtres actuals</div>';
        return;
    }
    const hasCls = gb.students.some(s => s.classe);
    document.getElementById('count').textContent =
        `${gb.students.length} alumne${gb.students.length !== 1 ? 's' : ''} · ${gb.activities.length} activitat${gb.activities.length !== 1 ? 's' : ''}`;

    let h = '<table class="gradebook"><thead><tr>';
    h += '<th class="gb-stu" style="left:0">Alumne</th>';
    const clsLeft = 130; // ha de coincidir amb l'amplada de .gb-stu
    if (hasCls) h += `<th class="gb-cls" style="left:${clsLeft}px">Classe</th>`;
    gb.activities.forEach(a => (h += `<th title="${esc(a)}">${esc(a)}</th>`));
    h += '<th class="gb-avg">Mitjana</th></tr></thead><tbody>';

    gb.students.forEach(s => {
        h += '<tr>';
        h += `<td class="gb-stu" style="left:0" title="${esc(s.name)}">${esc(s.name)}</td>`;
        if (hasCls) h += `<td class="gb-cls" style="left:${clsLeft}px">${esc(s.classe || '—')}</td>`;
        gb.activities.forEach(a => {
            const c = s.notes[a];
            if (!c) {
                h += '<td><span class="gb-empty-cell">·</span></td>';
            } else {
                const nStr = c.note.toFixed(1).replace('.', ',');
                const cnt = c.count > 1 ? `<span class="gb-count"> (${c.count})</span>` : '';
                h += `<td title="${esc(a)}: ${c.count} enviament${c.count !== 1 ? 's' : ''}"><span class="gb-note ${noteClass(c.note)}">${nStr}</span>${cnt}</td>`;
            }
        });
        const avgStr = s.avg != null ? s.avg.toFixed(2).replace('.', ',') : '—';
        h += `<td class="gb-avg">${s.avg != null ? `<span class="gb-note ${noteClass(s.avg)}">${avgStr}</span>` : '—'}</td>`;
        h += '</tr>';
    });
    h += '</tbody></table>';
    wrap.innerHTML = h;
}

// ── Exportació XLSX: matriu alumne × activitat (amb estils, via ExcelJS) ──────
async function exportGradebookXLSX() {
    if (typeof ExcelJS === 'undefined') {
        showLoadError(
            "No s'ha pogut carregar el generador d'Excel (cal connexió a Internet el primer cop). Torna-ho a provar."
        );
        return;
    }
    const gb = buildGradebook(filtRows);
    if (!gb.students.length) {
        showLoadError('No hi ha notes vàlides per exportar amb els filtres actuals.');
        return;
    }
    const hasCls = gb.students.some(s => s.classe);
    // Format de data llegible DD/MM/AAAA a partir de l'ISO YYYY-MM-DD
    const fmtDate = iso => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };
    const header = ['Alumne', ...(hasCls ? ['Classe'] : []), 'Data', ...gb.activities]; // sense "Mitjana"

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Notes');
    ws.addRow(header);
    gb.students.forEach(s => {
        const row = [s.name, ...(hasCls ? [s.classe || ''] : []), fmtDate(s.lastDate)];
        // Les notes s'afegeixen com a NOMBRE (o null si no n'hi ha), no com a text
        gb.activities.forEach(a => row.push(s.notes[a] ? Number(s.notes[a].note.toFixed(2)) : null));
        ws.addRow(row);
    });

    // Amplada de columnes
    ws.columns = header.map((hh, i) => ({
        width: i === 0 ? 22 : hh === 'Classe' ? 10 : hh === 'Data' ? 13 : Math.max(11, hh.length + 2),
    }));

    // Capçalera: negreta + centrada
    ws.getRow(1).eachCell(c => {
        c.font = { bold: true };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    // Totes les dades (files 2 endavant): alineades a l'esquerra, mantenint el tipus nombre
    for (let r = 2; r <= ws.rowCount; r++) {
        ws.getRow(r).eachCell({ includeEmpty: true }, c => {
            c.alignment = { horizontal: 'left' };
        });
    }
    // Congela capçalera + columna d'alumnes
    ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

    const buf = await wb.xlsx.writeBuffer();
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
        new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    );
    a.download = `stepquiz-llibreta-${today}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function clearFilters() {
    ['f-stu', 'f-cls', 'f-ex', 'f-sta'].forEach(id => (document.getElementById(id).value = ''));
    dateFrom = '';
    dateTo = '';
    drPicking = false;
    updateDateTrigger();
    applyFilters();
}

function toggleDet(i) {
    expIdx = expIdx === i ? null : i;
    renderTable(sortRows(filtRows));
    if (expIdx !== null)
        setTimeout(() => {
            const el = document.getElementById(`detail-${i}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
}

function showLoadError(msg) {
    const box = document.getElementById('load-error');
    if (box) {
        box.textContent = msg;
        box.style.display = 'block';
        clearTimeout(showLoadError._t);
        showLoadError._t = setTimeout(() => {
            box.style.display = 'none';
        }, 8000);
    }
}

function looksLikeStepQuizData(csv) {
    // Vàlid si: (a) hi havia una columna de codi identificada per la capçalera, o
    //           (b) alguna fila conté un codi que parseja a un format real (v2 / v1-cb).
    if (csv._headerFound) return true;
    return csv.some(r => {
        const f = parseCode(r.rawCode).format;
        return f === 'v2' || f === 'v1-cb';
    });
}

function loadData(txt) {
    const csv = parseCSV(txt);
    if (!csv || !csv.length) {
        showLoadError(
            "No s'han trobat dades. Comprova que sigui el full de respostes del formulari (CSV o Excel), amb una fila de capçalera i una fila per alumne."
        );
        return;
    }
    if (!looksLikeStepQuizData(csv)) {
        showLoadError(
            'Aquest arxiu no sembla un full de resultats de StepQuiz. Cap columna conté codis vàlids. Si has pujat un PDF o un altre document, descarrega el full de respostes del Google Form com a CSV o Excel i torna-ho a provar.'
        );
        return;
    }
    allRows = processRows(csv);
    filtRows = [...allRows];
    expIdx = null;
    // Segona barrera: si res no ha parsejat a un format conegut, no mostrem la taula
    if (!allRows.some(r => r.parsed.format === 'v2' || r.parsed.format === 'v1-cb')) {
        allRows = [];
        filtRows = [];
        showLoadError(
            "S'han llegit files, però cap conté un codi StepQuiz reconeixible. Revisa que hagis triat la columna correcta i que els codis siguin del format actual."
        );
        return;
    }
    document.getElementById('load-error').style.display = 'none';
    document.getElementById('upload-zone').style.display = 'none';
    document.getElementById('main-view').classList.add('visible');
    document.getElementById('hdr-right').style.display = 'flex';
    document.getElementById('header-tabs').style.display = 'flex';
    filtRows = [...allRows];
    dateFrom = '';
    dateTo = '';
    drPicking = false;
    drAnchor = null;
    updateDateTrigger();
    sortKey = null;
    sortDir = 1;
    setView('list');
    populateEx(allRows);
    populateStu(allRows);
    populateClasses(allRows);
    renderStats(allRows);
    const btnCb = document.getElementById('btn-cb');
    if (btnCb) btnCb._wasReady = false;
    checkCBButton();
}

function resetView() {
    document.getElementById('upload-zone').style.display = 'flex';
    document.getElementById('main-view').classList.remove('visible');
    document.getElementById('hdr-right').style.display = 'none';
    document.getElementById('header-tabs').style.display = 'none';
    document.getElementById('paste-area').value = '';
    const si = document.getElementById('single-input');
    if (si) si.value = '';
    const sr = document.getElementById('single-result');
    if (sr) sr.classList.remove('show');
    switchMode('sheet');
    const le = document.getElementById('load-error');
    if (le) le.style.display = 'none';
    currentView = 'list';
    sortKey = null;
    sortDir = 1;
    allRows = [];
    filtRows = [];
    expIdx = null;
}

function exportSummary() {
    const hasCls = allRows.some(r => r.classe);
    const ls = [
        (hasCls ? 'Alumne,Classe,' : 'Alumne,') + 'Exercici,Nota,Dificultat,Sessions,Preguntes,Estat,Gap(min),Codi',
    ];
    filtRows.forEach(r => {
        const p = r.parsed;
        const base = hasCls ? [r.student, r.classe || ''] : [r.student];
        ls.push(
            [
                ...base,
                p.exercise || '',
                p.note !== null ? p.note.toFixed(2) : '',
                p.difficulty ?? '',
                p.sessions ?? '',
                p.questions ?? '',
                r.status,
                r.gap !== null ? r.gap : '',
                '"' + r.raw.rawCode.replace(/"/g, '""') + '"',
            ].join(',')
        );
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ls.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'stepquiz-resum.csv';
    a.click();
}

function handleFile(f) {
    if (!f) return;
    const name = (f.name || '').toLowerCase();
    const isXlsx = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm');
    const isText = name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.tsv');

    // Barrera 1: rebutgem tipus que sabem que NO són fulls de resultats
    const badExt = [
        '.pdf',
        '.doc',
        '.docx',
        '.ppt',
        '.pptx',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.zip',
        '.json',
        '.html',
    ];
    if (badExt.some(ext => name.endsWith(ext))) {
        showLoadError(
            '«' +
                f.name +
                '» no és un full de resultats. Cal un CSV o un Excel (.xlsx) descarregat del Google Form. Si tens un PDF o una imatge, no serveixen: ves al full de respostes del formulari i tria Fitxer → Baixa → CSV.'
        );
        return;
    }

    if (isXlsx) {
        if (typeof XLSX === 'undefined') {
            showLoadError(
                "No s'ha pogut carregar el lector d'Excel (cal connexió a Internet el primer cop). Descarrega el full com a CSV i torna-ho a provar."
            );
            return;
        }
        const r = new FileReader();
        r.onload = e => {
            try {
                // cellDates:true → les dates es llegeixen com a objectes Date reals, no com a
                // text formatat regionalment (que podria ser 7/2/2026 = ambigu mes/dia).
                const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
                const ws = wb.Sheets[wb.SheetNames[0]];
                // Passem a matriu de files; les dates surten com a Date, la resta com a text.
                const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, blankrows: false, defval: '' });
                const pad = n => String(n).padStart(2, '0');
                const isoDate = d =>
                    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                const tsv = aoa
                    .map(row =>
                        row
                            .map(cell => {
                                if (cell instanceof Date && !isNaN(cell)) return isoDate(cell);
                                return cell == null ? '' : String(cell).replace(/[\t\r\n]/g, ' ');
                            })
                            .join('\t')
                    )
                    .join('\n');
                loadData(tsv);
            } catch (err) {
                console.error(err);
                showLoadError("No s'ha pogut llegir l'arxiu Excel. Comprova que no estigui malmès o desa'l com a CSV.");
            }
        };
        r.readAsArrayBuffer(f);
        return;
    }

    // Barrera 2: per a la resta, llegim com a text però comprovem que no sigui binari
    // (p. ex. un PDF reanomenat .csv comença amb la signatura "%PDF-").
    const r = new FileReader();
    r.onload = e => {
        const txt = e.target.result || '';
        // eslint-disable-next-line no-control-regex -- volem detectar caràcters de control (fitxer binari)
        if (txt.slice(0, 5) === '%PDF-' || /[\x00-\x08\x0E-\x1F]/.test(txt.slice(0, 1000))) {
            showLoadError(
                'Aquest arxiu sembla un PDF o un fitxer binari, no un full de text. Descarrega el full de respostes del Google Form com a CSV o Excel.'
            );
            return;
        }
        loadData(txt);
    };
    r.readAsText(f, 'UTF-8');
}
function handlePaste() {
    const t = document.getElementById('paste-area').value.trim();
    if (!t) {
        showLoadError('Enganxa primer el contingut del full de respostes.');
        return;
    }
    loadData(t);
}

// ─── MODES D'ENTRADA ────────────────────────────────────────────────────────
function switchMode(mode) {
    const sheet = mode === 'sheet';
    document.getElementById('tab-sheet').classList.toggle('active', sheet);
    document.getElementById('tab-single').classList.toggle('active', !sheet);
    document.getElementById('panel-sheet').classList.toggle('active', sheet);
    document.getElementById('panel-single').classList.toggle('active', !sheet);
    if (!sheet) setTimeout(() => document.getElementById('single-input').focus(), 30);
}

function onSingleInput() {
    const inp = document.getElementById('single-input');
    inp.classList.remove('bad');
    // Amaga el resultat mentre s'edita perquè no confongui
    const box = document.getElementById('single-result');
    if (box.classList.contains('show') && !inp.value.trim()) box.classList.remove('show');
}

function analyzeSingle() {
    const inp = document.getElementById('single-input');
    const raw = inp.value.trim();
    const box = document.getElementById('single-result');
    if (!raw) {
        inp.classList.add('bad');
        inp.focus();
        return;
    }
    const p = parseCode(raw);
    if (p.format === 'unknown' || p.format === 'empty') {
        inp.classList.add('bad');
        box.className = 'single-result show';
        box.innerHTML = `<div class="sr-head bad">❌ Codi no reconegut<span class="sr-badge">?</span></div>
      <div class="sr-body"><div class="sr-err">Aquest text no té el format d'un codi StepQuiz. Comprova que l'hagis copiat sencer.</div></div>`;
        return;
    }
    inp.classList.remove('bad');
    box.className = 'single-result show';
    box.innerHTML = renderSingle(raw, p);
}

function renderSingle(raw, p) {
    const ok = p.checksumOk;
    const fmtLabel = { 'v2': 'Format v2', 'v1-cb': 'Format v1 · CB' }[p.format] || p.format;
    const hd = p.resultsArray && p.resultsArray.some(v => v > 0);
    const items = [
        { k: 'Validació', v: ok ? '✅ Correcta' : '❌ Checksum KO' },
        { k: 'Exercici', v: p.exercise || p.exerciseCode || '—' },
        { k: 'Nota', v: p.note !== null && !isNaN(p.note) ? p.note.toFixed(2).replace('.', ',') : '—' },
        { k: 'Data', v: p.day ? `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}` : '—' },
        {
            k: 'Hora',
            v: p.hour === null ? '—' : `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`,
        },
    ];
    if (p.format === 'v2' && p.exerciseCode !== 'CB') {
        items.push({ k: 'Dificultat', v: p.difficulty === 0 ? '—' : `Nivell ${p.difficulty}` });
        items.push({ k: 'Sessions', v: String(p.sessions) });
        items.push({ k: 'Preguntes', v: String(p.questions) });
    }
    if (p.cbNivell) items.push({ k: 'Curs', v: p.cbNivell });
    if (p.cbAny) items.push({ k: 'Convocatòria', v: 'CB ' + p.cbAny });
    if (p.cbMode) items.push({ k: 'Mode', v: p.cbMode });

    const ss = p.sessions || 1,
        qq = p.questions || 30;
    let sessHtml = '';
    if (hd) {
        for (let s = 0; s < ss; s++) {
            const sl = p.resultsArray.slice(s * qq, (s + 1) * qq).filter(v => v !== 0);
            if (!sl.length) continue;
            sessHtml += `<div class="sr-sess"><span class="sr-sess-lbl">${ss > 1 ? 'Sessió ' + (s + 1) : 'Preguntes'}</span>
        <div style="display:flex;gap:3px;flex-wrap:wrap">${sl.map(v => `<div class="rdlg" style="background:var(--r${v})">${['', '1', '2', '3', '✗'][v] || ''}</div>`).join('')}</div></div>`;
        }
    }

    return `<div class="sr-head ${ok ? 'ok' : 'bad'}">${ok ? '✅ Codi vàlid' : '❌ Codi invàlid'}<span class="sr-badge">${fmtLabel}</span></div>
    <div class="sr-body">
      <div class="sr-grid">${items.map(i => `<div class="sr-item"><span class="k">${i.k}</span><span class="v">${esc(i.v)}</span></div>`).join('')}</div>
      ${!ok ? `<div class="sr-err" style="margin-bottom:10px">⚠️ El checksum no quadra: el codi pot haver estat modificat o mal copiat.</div>` : ''}
      ${
          hd
              ? `${sessHtml}<div class="legend" style="margin-top:8px">
          <div class="li"><div class="ld" style="background:var(--r1)"></div>1r intent</div>
          <div class="li"><div class="ld" style="background:var(--r2)"></div>2n intent</div>
          <div class="li"><div class="ld" style="background:var(--r3)"></div>3r+ intents</div>
          <div class="li"><div class="ld" style="background:var(--r4)"></div>Fallit</div>
        </div>`
              : '<div style="color:var(--muted);font-size:12px">Aquest format no desa el detall pregunta a pregunta.</div>'
      }
    </div>`;
}

// ─── AJUDA ──────────────────────────────────────────────────────────────────
function openHelp() {
    document.getElementById('help-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeHelp() {
    document.getElementById('help-overlay').classList.remove('open');
    if (!document.getElementById('cb-overlay').classList.contains('open')) document.body.style.overflow = '';
}

const dz = document.getElementById('dropzone');
dz.addEventListener('dragover', e => {
    e.preventDefault();
    dz.classList.add('dragover');
});
dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
});
document.addEventListener('paste', e => {
    if (document.getElementById('paste-area').matches(':focus')) return;
    if (document.getElementById('upload-zone').style.display === 'none') return;
    const t = (e.clipboardData || window.clipboardData).getData('text');
    if (t && t.includes('\n')) document.getElementById('paste-area').value = t;
});

// ─── SELECTOR D'INTERVAL DE DATES ──────────────────────────────────────────
// Funciona com el calendari d'una web de vols: 1r clic = dia d'inici (ja filtra
// per aquell dia sol); 2n clic = dia final (filtra l'interval i tanca).
let dateFrom = '',
    dateTo = ''; // 'YYYY-MM-DD'; buits = tots els dies
let drPicking = false; // true = esperant el dia final
let drHover = ''; // previsualització de l'interval en passar el ratolí
let drAnchor = null; // {y,m} del primer mes visible
const DR_MONTHS = [
    'gener',
    'febrer',
    'març',
    'abril',
    'maig',
    'juny',
    'juliol',
    'agost',
    'setembre',
    'octubre',
    'novembre',
    'desembre',
];
const DR_WD = ['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg'];

function ymd(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function fmtDMY(s) {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
}
function inDateRange(ds) {
    if (!dateFrom) return true;
    return !!ds && ds >= dateFrom && ds <= (dateTo || dateFrom);
}
function dateRangeLabel() {
    if (!dateFrom) return '';
    if (!dateTo || dateTo === dateFrom) return fmtDMY(dateFrom);
    return `${fmtDMY(dateFrom)} – ${fmtDMY(dateTo)}`;
}
function updateDateTrigger() {
    const btn = document.getElementById('f-date'),
        txt = document.getElementById('dr-txt');
    if (!btn) return;
    if (!dateFrom) {
        txt.textContent = 'Tots els dies';
        btn.classList.add('empty');
        btn.classList.remove('active');
    } else {
        txt.textContent = dateRangeLabel();
        btn.classList.remove('empty');
        btn.classList.add('active');
    }
}
function setDateRange(from, to) {
    if (to && to < from) [from, to] = [to, from];
    dateFrom = from || '';
    dateTo = from ? to || from : '';
    updateDateTrigger();
    applyFilters();
}
function clearDateRange() {
    drPicking = false;
    drHover = '';
    setDateRange('', '');
    renderDatePicker();
}

function openDatePicker() {
    const pop = document.getElementById('dr-pop');
    if (!drAnchor) {
        // Obre al mes de la selecció; si no n'hi ha, al mes de la dada més recent
        let base = dateFrom;
        if (!base) {
            const ds = allRows
                .map(r => r.dateStr)
                .filter(Boolean)
                .sort();
            base = ds[ds.length - 1] || '';
        }
        const dt = base ? new Date(+base.slice(0, 4), +base.slice(5, 7) - 1, 1) : new Date();
        // El mes de referència queda a la dreta si no hi ha selecció (dades recents)
        if (!dateFrom) dt.setMonth(dt.getMonth() - 1);
        drAnchor = { y: dt.getFullYear(), m: dt.getMonth() };
    }
    drPicking = false;
    drHover = '';
    renderDatePicker();
    pop.classList.add('open');
    document.getElementById('f-date').setAttribute('aria-expanded', 'true');
}
function closeDatePicker() {
    const pop = document.getElementById('dr-pop');
    if (!pop || !pop.classList.contains('open')) return;
    pop.classList.remove('open');
    drPicking = false;
    drHover = '';
    drAnchor = null;
    document.getElementById('f-date').setAttribute('aria-expanded', 'false');
}
function toggleDatePicker() {
    document.getElementById('dr-pop').classList.contains('open') ? closeDatePicker() : openDatePicker();
}
function drShift(n) {
    const d = new Date(drAnchor.y, drAnchor.m + n, 1);
    drAnchor = { y: d.getFullYear(), m: d.getMonth() };
    renderDatePicker();
}

function drPick(ds) {
    if (!drPicking) {
        // 1r clic: dia d'inici
        drPicking = true;
        drHover = '';
        setDateRange(ds, ds);
    } else {
        // 2n clic: dia final
        drPicking = false;
        drHover = '';
        setDateRange(dateFrom, ds);
        closeDatePicker();
        return;
    }
    renderDatePicker();
}
function drPreset(kind) {
    const dates = [...new Set(allRows.map(r => r.dateStr).filter(Boolean))].sort();
    const today = new Date();
    const t = ymd(today.getFullYear(), today.getMonth(), today.getDate());
    const addDays = (s, n) => {
        const d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + n);
        return ymd(d.getFullYear(), d.getMonth(), d.getDate());
    };
    if (kind === 'today') setDateRange(t, t);
    else if (kind === 'last') {
        const l = dates[dates.length - 1];
        if (l) setDateRange(l, l);
    } else if (kind === 'week') {
        // setmana (dl–dg) de la dada més recent
        const l = dates[dates.length - 1];
        if (!l) return;
        const d = new Date(+l.slice(0, 4), +l.slice(5, 7) - 1, +l.slice(8, 10));
        const off = (d.getDay() + 6) % 7;
        const mon = addDays(l, -off);
        setDateRange(mon, addDays(mon, 6));
    }
    closeDatePicker();
}

function renderDatePicker() {
    const withData = new Set(allRows.map(r => r.dateStr).filter(Boolean));
    const now = new Date();
    const todayS = ymd(now.getFullYear(), now.getMonth(), now.getDate());
    // Extrems visuals (amb previsualització mentre s'escull el dia final)
    let a = dateFrom,
        b = dateTo;
    if (drPicking && drHover) {
        a = dateFrom;
        b = drHover;
        if (b < a) [a, b] = [b, a];
    }
    const monthHtml = (y, m, idx) => {
        const first = new Date(y, m, 1),
            days = new Date(y, m + 1, 0).getDate(),
            lead = (first.getDay() + 6) % 7;
        let h = `<div class="dr-month"><div class="dr-mhead">
      <button type="button" class="dr-nav${idx === 0 ? '' : ' ghost'}" onclick="drShift(-1)" aria-label="Mes anterior">‹</button>
      <div class="dr-mtitle">${DR_MONTHS[m]} ${y}</div>
      <button type="button" class="dr-nav${idx === 1 ? '' : ' ghost'}" onclick="drShift(1)" aria-label="Mes següent">›</button>
    </div><div class="dr-grid">${DR_WD.map(w => `<div class="dr-wd">${w}</div>`).join('')}`;
        for (let i = 0; i < lead; i++) h += `<div class="dr-day blank"></div>`;
        for (let d = 1; d <= days; d++) {
            const ds = ymd(y, m, d),
                c = ['dr-day'];
            if (withData.has(ds)) c.push('has-data');
            if (ds === todayS) c.push('today');
            if (a && ds === a) c.push('edge-start');
            if (a && ds === (b || a)) c.push('edge-end');
            if (a && b && ds > a && ds < b) c.push('in-range');
            h += `<button type="button" class="${c.join(' ')}" data-d="${ds}" onclick="drPick('${ds}')" onmouseenter="drHoverDay('${ds}')" title="${withData.has(ds) ? 'Hi ha enviaments' : ''}"><span>${d}</span></button>`;
        }
        return h + '</div></div>';
    };
    const n = new Date(drAnchor.y, drAnchor.m + 1, 1);
    document.getElementById('dr-months').innerHTML =
        monthHtml(drAnchor.y, drAnchor.m, 0) + monthHtml(n.getFullYear(), n.getMonth(), 1);
    document.getElementById('dr-presets').innerHTML =
        `<button type="button" class="dr-preset" onclick="drPreset('last')">Darrer dia amb dades</button>` +
        `<button type="button" class="dr-preset" onclick="drPreset('week')">Setmana de la darrera dada</button>` +
        `<button type="button" class="dr-preset" onclick="drPreset('today')">Avui</button>`;
    const hint = document.getElementById('dr-hint');
    if (drPicking)
        hint.innerHTML = `Inici: <b>${fmtDMY(dateFrom)}</b> · tria el dia final, o prem <b>Fet</b> per a un sol dia`;
    else if (dateFrom) hint.innerHTML = `Seleccionat: <b>${dateRangeLabel()}</b>`;
    else hint.innerHTML = `Tria el dia d'inici · els dies amb <b style="color:var(--accent)">•</b> tenen enviaments`;
}
function drHoverDay(ds) {
    if (!drPicking || drHover === ds) return;
    drHover = ds;
    // Actualitza només les classes (sense redibuixar) per no perdre el hover
    let a = dateFrom,
        b = ds;
    if (b < a) [a, b] = [b, a];
    document.querySelectorAll('#dr-months .dr-day[data-d]').forEach(el => {
        const d = el.dataset.d;
        el.classList.toggle('edge-start', d === a);
        el.classList.toggle('edge-end', d === b);
        el.classList.toggle('in-range', d > a && d < b);
    });
}
// Tanca en clicar fora
document.addEventListener('mousedown', e => {
    const w = document.getElementById('dr-wrap');
    if (w && !w.contains(e.target)) closeDatePicker();
});

// Avís si un mateix alumne apareix més d'un cop dins l'interval
function dupNoteHtml(rows) {
    const cnt = {};
    rows.forEach(r => {
        cnt[r.student] = (cnt[r.student] || 0) + 1;
    });
    const dups = Object.entries(cnt).filter(([, n]) => n > 1);
    if (!dups.length) return '';
    const list = dups.map(([s, n]) => `${esc(s)} (${n})`).join(', ');
    return `<div class="cb-dup-note">⚠️ Hi ha alumnes amb més d'un enviament en aquest període: <b>${list}</b>. Tots compten a les estadístiques per pregunta. Pots filtrar per alumne o per estat si vols excloure'n algun.</div>`;
}

// ─── CB RESUM ───────────────────────────────────────────────────────────────

function checkCBButton() {
    const dt = dateFrom;
    const cbRows = filtRows.filter(
        r => r.parsed.exerciseCode === 'CB' && r.parsed.resultsArray && r.parsed.resultsArray.some(v => v > 0)
    );
    const ready = dt !== '' && cbRows.length >= 2;
    const btn = document.getElementById('btn-cb');
    if (!btn) return;
    // Shake-blink when conditions just became ready
    if (ready && !btn._wasReady) {
        btn.classList.remove('btn-cb-shake');
        void btn.offsetWidth; // reflow to restart animation
        btn.classList.add('btn-cb-shake');
        setTimeout(() => btn.classList.remove('btn-cb-shake'), 2100);
    }
    btn._wasReady = ready;
    btn.disabled = !ready;
    btn.style.opacity = ready ? '' : '0.45';
    btn.style.cursor = ready ? '' : 'not-allowed';
}

function openCB() {
    const dt = dateFrom;
    const cbRows = filtRows.filter(
        r => r.parsed.exerciseCode === 'CB' && r.parsed.resultsArray && r.parsed.resultsArray.some(v => v > 0)
    );

    // Auto-correct filters if not ready
    const exSel = document.getElementById('f-ex');
    const dateFi = document.getElementById('f-date');
    if (!cbRows.length || dt === '') {
        // Auto-set exercise to cb if not set
        if (exSel && exSel.value !== 'competencies-basiques') {
            exSel.value = 'competencies-basiques';
            applyFilters();
        }
        // Highlight date field i obre el calendari
        dateFi.classList.add('f-date-alert');
        dateFi.focus();
        if (dt === '') openDatePicker();
        setTimeout(() => dateFi.classList.remove('f-date-alert'), 3000);
        return;
    }
    if (!cbRows.length) return;

    const N = MAX_RES;
    const labels = ['', '1', '2', '3', '✗'];
    const colors = ['var(--r0)', 'var(--r1)', 'var(--r2)', 'var(--r3)', 'var(--r4)'];

    // Per-question stats (only active questions = non-zero across any student)
    const qStats = Array.from({ length: N }, (_, q) => {
        const vals = cbRows.map(r => r.parsed.resultsArray[q] || 0).filter(v => v > 0);
        if (!vals.length) return null;
        const counts = [0, 0, 0, 0, 0]; // index 1-4
        vals.forEach(v => counts[v]++);
        const sorted = [...vals].sort((a, b) => a - b);
        const med = sorted[Math.floor(sorted.length / 2)];
        const pcts = [1, 2, 3, 4].map(v => Math.round((counts[v] / vals.length) * 100));
        return { med, counts, pcts, total: vals.length };
    });

    const activeQs = qStats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);

    // Format date display (un dia o un interval)
    const dateLabel = dateRangeLabel();
    const multiDay = dateFrom !== dateTo;

    // Decodifica nivell, any i mode del primer codi CB (per al títol)
    const firstRow = cbRows[0];
    const cbNivellLabel = firstRow && firstRow.parsed.cbNivell ? ` · ${firstRow.parsed.cbNivell}` : '';
    const cbAnyLabel = firstRow && firstRow.parsed.cbAny ? ` · CB ${firstRow.parsed.cbAny}` : '';
    const cbModeLabel = firstRow && firstRow.parsed.cbMode ? ` · ${firstRow.parsed.cbMode}` : '';

    // ── SUMMARY ──
    let summaryHtml = `<div class="cb-legend">
    <div class="cb-li"><div class="cb-ld" style="background:var(--r1)"></div>1r intent</div>
    <div class="cb-li"><div class="cb-ld" style="background:var(--r2)"></div>2n intent</div>
    <div class="cb-li"><div class="cb-ld" style="background:var(--r3)"></div>3r+ intents</div>
    <div class="cb-li"><div class="cb-ld" style="background:var(--r4)"></div>Fallit</div>
  </div>
  ${dupNoteHtml(cbRows)}
  <p class="cb-section-title">Resum per pregunta — ${cbRows.length} alumnes · ${dateLabel}${cbNivellLabel}${cbAnyLabel}${cbModeLabel}</p>
  <div class="cb-summary-grid">`;

    const BAR_H = 60; // total bar height px
    activeQs.forEach(q => {
        const s = qStats[q];
        const segs = [1, 2, 3, 4]
            .map(v => {
                const h = Math.round((s.pcts[v - 1] * BAR_H) / 100);
                return h > 0
                    ? `<div class="cb-q-seg" style="height:${h}px;background:${colors[v]};" title="${s.pcts[v - 1]}%"></div>`
                    : '';
            })
            .join('');
        const medColor = colors[s.med] || 'var(--muted)';
        const medLabel = labels[s.med] || '?';
        // Difícil: mediana > 1 O percentatge de fallits >= 20%
        const isHard = s.med > 1 || s.pcts[3] >= 20;
        summaryHtml += `<div class="cb-q-col">
      <div class="cb-q-num${isHard ? ' hard' : ''}">${q + 1}</div>
      <div class="cb-q-bar" style="height:${BAR_H}px;">${segs}</div>
      <div class="cb-q-median${isHard ? ' hard' : ''}" style="background:${medColor};">${medLabel}</div>
    </div>`;
    });
    summaryHtml += `</div>`;

    // ── MATRIX ──
    summaryHtml += `<p class="cb-section-title" style="margin-top:8px;">Matriu alumnes × preguntes</p>
  <div class="cb-matrix-wrap"><table class="cb-matrix"><thead><tr>
    <th class="cb-stu-h">Alumne</th>
    <th class="cb-nota-h">Nota</th>
    ${activeQs
        .map(q => {
            const s = qStats[q];
            const isHard = s && (s.med > 1 || s.pcts[3] >= 20);
            return `<th style="${isHard ? 'color:#dc2626;font-weight:800;background:#fff5f5;' : ''}">${q + 1}</th>`;
        })
        .join('')}
  </tr></thead><tbody>`;

    cbRows.sort((a, b) => (b.parsed.note || 0) - (a.parsed.note || 0));
    cbRows.forEach(row => {
        const arr = row.parsed.resultsArray;
        const nota = row.parsed.note !== null ? row.parsed.note.toFixed(2).replace('.', ',') : '—';
        summaryHtml += `<tr>
      <td class="cb-stu-cell" data-tip="${esc(row.student + (row.classe ? ' · ' + row.classe : '') + (multiDay && row.dateStr ? ' · ' + fmtDMY(row.dateStr) : ''))}" onmouseenter="showTip(event,this)" onmouseleave="hideTip()">${esc(row.student.slice(0, 4))}</td>
      <td class="cb-nota-cell">${nota}</td>
      ${activeQs
          .map(q => {
              const v = arr[q] || 0;
              return `<td><div class="cb-cell cb-cell-${v}">${v > 0 ? labels[v] : ''}</div></td>`;
          })
          .join('')}
    </tr>`;
    });

    summaryHtml += `</tbody></table></div>`;

    document.getElementById('cb-modal-title').textContent =
        `Resum CB — ${dateLabel}${cbNivellLabel}${cbAnyLabel}${cbModeLabel}`;
    document.getElementById('cb-modal-body').innerHTML = summaryHtml;
    document.getElementById('cb-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function exportCBtxt() {
    const dt = dateFrom;
    const cbRows = filtRows.filter(
        r => r.parsed.exerciseCode === 'CB' && r.parsed.resultsArray && r.parsed.resultsArray.some(v => v > 0)
    );
    if (!cbRows.length || !dt) return;

    const N = MAX_RES;
    const dateLabel = dateRangeLabel();

    const qStats = Array.from({ length: N }, (_, q) => {
        const vals = cbRows.map(r => r.parsed.resultsArray[q] || 0).filter(v => v > 0);
        if (!vals.length) return null;
        const n = vals.length;
        const counts = [0, 0, 0, 0, 0];
        vals.forEach(v => counts[v]++);
        const sorted = [...vals].sort((a, b) => a - b);
        const med = sorted[Math.floor(sorted.length / 2)];
        const pcts = [1, 2, 3, 4].map(v => Math.round((counts[v] / n) * 100));
        const isHard = med > 1 || pcts[3] >= 20;
        return { q: q + 1, med, pcts, isHard, n };
    }).filter(Boolean);

    const hard = qStats.filter(s => s.isHard).sort((a, b) => a.q - b.q);
    const easy = qStats.filter(s => !s.isHard).sort((a, b) => a.q - b.q);

    const fmtQ = s =>
        `P${String(s.q).padStart(2, ' ')}:  1r=${String(s.pcts[0]).padStart(3)}%  2n=${String(s.pcts[1]).padStart(3)}%  3r=${String(s.pcts[2]).padStart(3)}%  4t=${String(s.pcts[3]).padStart(3)}%`;

    const fr = cbRows[0];
    const nLabel = fr && fr.parsed.cbNivell ? ' · ' + fr.parsed.cbNivell : '';
    const aLabel = fr && fr.parsed.cbAny ? ' · CB ' + fr.parsed.cbAny : '';
    const mLabel = fr && fr.parsed.cbMode ? ' · ' + fr.parsed.cbMode : '';

    const lines = [
        `Resum CB — ${dateLabel}${nLabel}${aLabel}${mLabel} — ${cbRows.length} alumnes`,
        '='.repeat(56),
        '',
        `PREGUNTES A MILLORAR (${hard.length})`,
        '-'.repeat(56),
        ...hard.map(fmtQ),
        '',
        `PREGUNTES QUE HAN ANAT BÉ (${easy.length})`,
        '-'.repeat(56),
        ...easy.map(fmtQ),
        '',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dateFrom === dateTo ? `resum-cb-${dateFrom}.txt` : `resum-cb-${dateFrom}_a_${dateTo}.txt`;
    a.click();
}

// ── Exportació Excel del resum CB ───────────────────────────────────────────
// Reprodueix el full que es feia a mà: 1 / X per pregunta i alumne, la nota,
// els percentatges per pregunta i la llista de preguntes per treballar.
const CB_XL_LLINDAR = 50; // % d'errors a partir del qual una pregunta és "per treballar"
const CB_XL_COLORS = { 1: 'FFB7E1CD', X: 'FFF4C7C3', 2: 'FFFFF2CC', 3: 'FFFCE5CD' }; // verd, vermell, groc, taronja
const CB_XL_NOTA_BAIXA = 'FFC53929'; // nota < 5 en vermell

function xlCol(n) {
    let s = '';
    while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

async function exportCBxlsx() {
    if (typeof ExcelJS === 'undefined') {
        alert("No s'ha pogut carregar el generador d'Excel (cal connexió a Internet). Torna-ho a provar.");
        return;
    }
    // Mateixos alumnes que el resum CB, en l'ordre del full de respostes
    const rows = filtRows.filter(
        r => r.parsed.exerciseCode === 'CB' && r.parsed.resultsArray && r.parsed.resultsArray.some(v => v > 0)
    );
    if (!rows.length || !dateFrom) return;
    try {
        // Preguntes de cada alumne: les que diu el codi (com a màxim les MAX_RES que hi caben)
        const nPreg = r => {
            if (r.parsed.questions) return Math.min(r.parsed.questions, MAX_RES);
            const a = r.parsed.resultsArray;
            let n = a.length;
            while (n > 0 && !a[n - 1]) n--;
            return n;
        };
        const res = (r, q) => (q < nPreg(r) ? r.parsed.resultsArray[q] || 0 : 0);
        const aXL = v => (v === 4 ? 'X' : v >= 1 && v <= 3 ? v : null); // 1 encert · 4 fallada → X · 0 → buit
        const N = Math.max(...rows.map(nPreg));

        // Disposició idèntica al full fet a mà: capçalera a la fila 2, alumnes des de B3
        const F1 = 3,
            FN = F1 + rows.length - 1;
        const CA = 2,
            CP1 = 3,
            CPN = CP1 + N - 1,
            CR = CPN + 1;
        const FONT = { name: 'Arial', size: 10 };
        const ESQ = { horizontal: 'left', vertical: 'middle' },
            MIG = { horizontal: 'center', vertical: 'middle' };

        const [, mf, df] = dateFrom.split('-'),
            [, mt, dt] = (dateTo || dateFrom).split('-');
        const wb = new ExcelJS.Workbook();
        wb.calcProperties.fullCalcOnLoad = true;
        const ws = wb.addWorksheet(dateFrom === dateTo ? df + mf : `${df}${mf}-${dt}${mt}`);
        const put = (r, c, value, align) => {
            const cell = ws.getCell(r, c);
            cell.value = value;
            cell.font = FONT;
            if (align) cell.alignment = align;
            return cell;
        };

        // Capçalera
        const fr = rows[0].parsed;
        const etiqueta =
            [fr.cbNivell, fr.cbAny ? 'CB ' + fr.cbAny : '', fr.cbMode].filter(Boolean).join(' · ') || 'Alumne';
        put(2, CA, etiqueta, ESQ);
        for (let q = 1; q <= N; q++) put(2, CP1 + q - 1, 'Pregunta ' + q, ESQ);
        put(2, CR, 'Resultat', ESQ);
        ws.getRow(2).height = 22.5;

        // Una fila per alumne: 1 / X i la nota (encerts / preguntes × 10)
        rows.forEach((r, i) => {
            const f = F1 + i,
                nq = nPreg(r);
            put(f, CA, r.raw.email || r.student, { vertical: 'middle' });
            let uns = 0;
            for (let q = 0; q < N; q++) {
                const v = aXL(res(r, q));
                if (v === 1) uns++;
                put(f, CP1 + q, v, MIG);
            }
            const nota =
                r.parsed.questions > MAX_RES
                    ? r.parsed.note // el codi no hi cap sencer: la nota del codi
                    : { formula: `COUNTIF(${xlCol(CP1)}${f}:${xlCol(CPN)}${f},1)/${nq}*10`, result: (uns / nq) * 10 };
            put(f, CR, nota, MIG);
            ws.getRow(f).height = 22.5;
        });

        // Total: percentatge de cada resposta per pregunta
        const presents = [1, 2, 3, 'X'].filter(
            v => v === 1 || v === 'X' || rows.some(r => [...Array(N).keys()].some(q => aXL(res(r, q)) === v))
        );
        const FT = FN + 1;
        put(FT, 1, 'Total:');
        presents.forEach((v, k) => {
            const f = FT + 1 + k;
            put(f, CA, v, { horizontal: 'center' });
            for (let q = 0; q < N; q++) {
                const L = xlCol(CP1 + q),
                    col = rows.map(r => aXL(res(r, q))).filter(x => x !== null);
                if (!col.length) continue;
                const crit = v === 'X' ? '"X"' : v;
                const cell = put(
                    f,
                    CP1 + q,
                    {
                        formula: `COUNTIF(${L}$${F1}:${L}$${FN},${crit})/COUNTA(${L}$${F1}:${L}$${FN})`,
                        result: col.filter(x => x === v).length / col.length,
                    },
                    { horizontal: 'center' }
                );
                cell.numFmt = '0%';
            }
        });

        // Preguntes per treballar: les que fallen el CB_XL_LLINDAR % o més (mateixa fila i columnes que al full fet a mà)
        const FL = FT + presents.length + 6;
        put(FL, 1, 'Preguntes per treballar:');
        const perTreballar = [];
        for (let q = 0; q < N; q++) {
            const col = rows.map(r => res(r, q)).filter(v => v > 0);
            const errors = col.filter(v => v !== 1).length;
            if (col.length && errors * 100 >= CB_XL_LLINDAR * col.length) perTreballar.push(q + 1);
        }
        // Una cada 8 columnes (com al full fet a mà) si caben dins l'amplada de la taula; si no, seguides
        const pas = CA + 8 * (perTreballar.length - 1) <= CR ? 8 : 1;
        if (perTreballar.length) perTreballar.forEach((q, k) => put(FL, CA + pas * k, `Pregunta ${q}:`));
        else put(FL, CA, 'Cap');

        // Colors (format condicional, com al full fet a mà)
        const fill = argb => ({ fill: { type: 'pattern', pattern: 'solid', bgColor: { argb } } });
        ws.addConditionalFormatting({
            ref: `${xlCol(CP1)}${F1}:${xlCol(CPN)}${FN}`,
            rules: presents.map(v => ({
                type: 'cellIs',
                operator: 'equal',
                formulae: [v === 'X' ? '"X"' : String(v)],
                style: fill(CB_XL_COLORS[v]),
            })),
        });
        ws.addConditionalFormatting({
            ref: `${xlCol(CR)}${F1}:${xlCol(CR)}${FN}`,
            rules: [
                {
                    type: 'cellIs',
                    operator: 'lessThan',
                    formulae: ['5'],
                    style: { font: { color: { argb: CB_XL_NOTA_BAIXA } } },
                },
            ],
        });

        // Amplades: que es llegeixin sencers els correus i "Preguntes per treballar:"
        ws.getColumn(1).width = 21;
        ws.getColumn(CA).width = Math.min(
            45,
            Math.max(14, ...rows.map(r => (r.raw.email || r.student).length + 2), etiqueta.length + 2)
        );
        for (let c = CP1; c <= CR; c++) ws.getColumn(c).width = 12.63;

        const buf = await wb.xlsx.writeBuffer();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(
            new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        );
        a.download = dateFrom === dateTo ? `resum-cb-${dateFrom}.xlsx` : `resum-cb-${dateFrom}_a_${dateTo}.xlsx`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
        console.error(e);
        alert("No s'ha pogut generar l'Excel: " + e.message);
    }
}

function showTip(e, el) {
    const tip = document.getElementById('cb-tooltip');
    tip.textContent = el.dataset.tip;
    tip.style.display = 'block';
    const rect = el.getBoundingClientRect();
    // Position above the cell, centered horizontally on it
    tip.style.left = rect.left + rect.width / 2 + 'px';
    tip.style.top = rect.top - 28 + 'px';
    tip.style.transform = 'translateX(-50%)';
}
function hideTip() {
    document.getElementById('cb-tooltip').style.display = 'none';
}

function closeCB() {
    document.getElementById('cb-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeDatePicker();
        closeCB();
        closeHelp();
    }
});
