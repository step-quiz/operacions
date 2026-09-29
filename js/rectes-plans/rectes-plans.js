/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/rectes-plans/rectes-plans.js
 * ROL: Joc «Equacions de rectes i plans a R³» (rectes-plans.html). Abans era dins de l'HTML.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa fixed-sessions.js.
 * ============================================================================
 */

import { FixedSessions } from '../fixed-sessions.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel…) i els onclick de l'HTML.
Object.assign(window, {
    switchTab,
    renderWorkspace,
    initProblem,
    checkAnswer,
    handleLevel1Help,
    handleLevel2Help,
    renderWorkspacePlans,
    initProblemPlans,
    checkAnswerPlans,
    handleLevel1HelpPlans,
    handleLevel2HelpPlans,
});

const FORMATS = ['vectorial', 'parametriques', 'continues', 'implicites'];
let currentLine = { P: [0, 0, 0], v: [0, 0, 0] };
let currentPlane = { P: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0], n: [0, 0, 0], D: 0 };
let currentTab = 'rectes';
let currentSourceFormat = '';
let helpLevel = 0; // 0: cap, 1: ajuda, 2: més ajuda
let rectesInitialized = true;
let plansInitialized = false;

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randNonZero(min, max) {
    let n = 0;
    while (n === 0) {
        n = randInt(min, max);
    }
    return n;
}

function cleanMath(coeff, variable, isFirst = false) {
    if (coeff === 0) return '';
    let sign = coeff > 0 ? (isFirst ? '' : '+ ') : isFirst ? '-' : '- ';
    let absCoeff = Math.abs(coeff);
    let val = absCoeff === 1 ? variable : absCoeff + variable;
    return sign + val + ' ';
}

function formatConst(val, isFirst = false) {
    if (val === 0) return isFirst ? '0' : '';
    let sign = val > 0 ? (isFirst ? '' : '+ ') : isFirst ? '-' : '- ';
    return sign + Math.abs(val) + ' ';
}

function getSignSelect(id) {
    return `<select id="${id}" class="sign-select"><option value="+">+</option><option value="-">-</option></select>`;
}

function initProblem() {
    FixedSessions?.next('recta'); // sessions fixes: mateix exercici per a tothom
    // 1. Generació de vector i punt amb números nets
    const vx = randNonZero(-3, 3);
    const vy = randNonZero(-2, 2);
    const vz = randNonZero(-3, 3);
    currentLine.v = [vx, vy, vz];

    const k = randInt(-3, 3);
    const py = vy * k;
    const px = randInt(-5, 5);
    const pz = randInt(-5, 5);
    currentLine.P = [px, py, pz];

    // 2. Triar format d'origen
    currentSourceFormat = FORMATS[Math.floor(Math.random() * FORMATS.length)];

    const box = document.getElementById('source-equation');
    const instruction = document.getElementById('instruction-text');
    const [p1, p2, p3] = currentLine.P;
    const [v1, v2, v3] = currentLine.v;

    let html = '';
    let eqText = '';

    // 3. Renderitzar segons el format
    // Afegim white-space: nowrap als blocks d'origen perquè no es trenquin en mòbil tampoc
    if (currentSourceFormat === 'vectorial') {
        eqText = "d'aquesta equació vectorial";
        html = `(x, y, z) = (${p1}, ${p2}, ${p3}) + λ(${v1}, ${v2}, ${v3})`;
    } else if (currentSourceFormat === 'parametriques') {
        eqText = "d'aquestes equacions paramètriques";
        html = `<div class="system-brace lines-3"><div style="text-align:left; white-space:nowrap; line-height: 1.5;">
            x = ${p1 === 0 ? '' : p1} ${cleanMath(v1, 'λ', p1 === 0)}<br>
            y = ${p2 === 0 ? '' : p2} ${cleanMath(v2, 'λ', p2 === 0)}<br>
            z = ${p3 === 0 ? '' : p3} ${cleanMath(v3, 'λ', p3 === 0)}
        </div></div>`;
    } else if (currentSourceFormat === 'continues') {
        eqText = "d'aquestes equacions contínues";
        const f = p => (p === 0 ? '' : p > 0 ? `- ${p}` : `+ ${Math.abs(p)}`);
        html = `<div style="display:flex; align-items:center;">
            <div class="fraction"><span>x ${f(p1)}</span><div class="fraction-line"></div><span>${v1}</span></div> =
            <div class="fraction"><span>y ${f(p2)}</span><div class="fraction-line"></div><span>${v2}</span></div> =
            <div class="fraction"><span>z ${f(p3)}</span><div class="fraction-line"></div><span>${v3}</span></div>
        </div>`;
    } else if (currentSourceFormat === 'implicites') {
        eqText = "d'aquestes equacions implícites";
        const A1 = v2,
            B1 = -v1,
            D1 = v1 * p2 - v2 * p1;
        const B2 = v3,
            C2 = -v2,
            D2 = v2 * p3 - v3 * p2;
        html = `<div class="system-brace lines-2"><div style="text-align:left; white-space:nowrap; line-height: 1.5;">
            ${cleanMath(A1, 'x', true)}${cleanMath(B1, 'y')}${formatConst(D1)} = 0<br>
            ${cleanMath(B2, 'y', true)}${cleanMath(C2, 'z')}${formatConst(D2)} = 0
        </div></div>`;
    }

    instruction.innerText = `Una recta s'expressa a partir ${eqText}:`;
    box.innerHTML = html;

    // 4. Neteja de la interfície
    const select = document.getElementById('target-format');
    select.value = '';
    Array.from(select.options).forEach(opt => {
        opt.style.display = opt.value === currentSourceFormat || opt.value === '' ? 'none' : 'block';
    });
    document.getElementById('workspace').innerHTML = '';
    document.getElementById('btn-check').style.display = 'none';
    document.getElementById('btn-next').style.display = 'none';
    document.getElementById('btn-help').style.display = 'none';
    document.getElementById('help-box').style.display = 'none';
    const errBox = document.getElementById('error-box');
    if (errBox) errBox.style.display = 'none';
}

function renderWorkspace() {
    const format = document.getElementById('target-format').value;
    const ws = document.getElementById('workspace');
    const btnHelp = document.getElementById('btn-help');
    const btnMoreHelp = document.getElementById('btn-more-help');
    const hb = document.getElementById('help-box');

    document.getElementById('btn-check').style.display = 'inline-block';
    document.getElementById('btn-next').style.display = 'none';

    // Reset total de l'ajuda
    helpLevel = 0;
    hb.style.display = 'none';
    hb.innerHTML = '';

    // Reset de l'error
    const errBox = document.getElementById('error-box');
    if (errBox) errBox.style.display = 'none';

    // Botó Ajuda (Reset a estat inicial)
    btnHelp.disabled = false;
    btnHelp.style.background = '#F0CB90';
    btnHelp.style.color = '#000';
    btnHelp.style.cursor = 'pointer';
    // El botó d'ajuda apareix si el DESTÍ és implícites O si l'ORIGEN és implícites
    btnHelp.style.display = 'inline-block';

    // Amagar el botó de Més Ajuda
    btnMoreHelp.style.display = 'none';

    // APLICACIÓ DE CLASSES FLEX (eq-row, eq-col) PER EVITAR SALTS DE LÍNIA EN MÒBIL
    if (format === 'vectorial') {
        ws.innerHTML = `<div class="eq-row">(x,y,z) = (<input type="number" step="any" id="vp1" class="math-input">, <input type="number" step="any" id="vp2" class="math-input">, <input type="number" step="any" id="vp3" class="math-input">) + λ(<input type="number" step="any" id="vv1" class="math-input">, <input type="number" step="any" id="vv2" class="math-input">, <input type="number" step="any" id="vv3" class="math-input">)</div>`;
    } else if (format === 'parametriques') {
        ws.innerHTML = `<div class="system-brace lines-3"><div class="eq-col">
            <div class="eq-row">x = <input type="number" step="any" id="pp1" class="math-input"> ${getSignSelect('ps1')} <input type="number" step="any" id="pv1" class="math-input"> λ</div>
            <div class="eq-row">y = <input type="number" step="any" id="pp2" class="math-input"> ${getSignSelect('ps2')} <input type="number" step="any" id="pv2" class="math-input"> λ</div>
            <div class="eq-row">z = <input type="number" step="any" id="pp3" class="math-input"> ${getSignSelect('ps3')} <input type="number" step="any" id="pv3" class="math-input"> λ</div>
        </div></div>`;
    } else if (format === 'continues') {
        ws.innerHTML = `<div class="eq-row"><div class="fraction"><span>x ${getSignSelect('cs1')} <input type="number" step="any" id="cp1" class="math-input"></span><div class="fraction-line"></div><input type="number" step="any" id="cv1" class="math-input"></div> <span style="font-size:1.5rem; margin:0 0.2rem">=</span><div class="fraction"><span>y ${getSignSelect('cs2')} <input type="number" step="any" id="cp2" class="math-input"></span><div class="fraction-line"></div><input type="number" step="any" id="cv2" class="math-input"></div> <span style="font-size:1.5rem; margin:0 0.2rem">=</span><div class="fraction"><span>z ${getSignSelect('cs3')} <input type="number" step="any" id="cp3" class="math-input"></span><div class="fraction-line"></div><input type="number" step="any" id="cv3" class="math-input"></div></div>`;
    } else if (format === 'implicites') {
        ws.innerHTML = `<div class="system-brace lines-2"><div class="eq-col">
            <div class="eq-row"><input type="number" step="any" id="ia1" class="math-input">x ${getSignSelect('is1')} <input type="number" step="any" id="ib1" class="math-input">y ${getSignSelect('is2')} <input type="number" step="any" id="id1" class="math-input"> = 0</div>
            <div class="eq-row"><input type="number" step="any" id="ib2" class="math-input">y ${getSignSelect('is3')} <input type="number" step="any" id="ic2" class="math-input">z ${getSignSelect('is4')} <input type="number" step="any" id="id2" class="math-input"> = 0</div>
        </div></div>`;
    }
}

function handleLevel1Help() {
    const hb = document.getElementById('help-box');
    const btnHelp = document.getElementById('btn-help');
    const btnMore = document.getElementById('btn-more-help');
    const targetFormat = document.getElementById('target-format').value;
    const [p1, p2, p3] = currentLine.P;
    const [v1, v2, v3] = currentLine.v;

    btnHelp.disabled = true;
    btnHelp.style.background = '#e2e8f0';
    btnHelp.style.color = '#94a3b8';
    btnMore.style.display = 'inline-block';
    hb.style.display = 'block';

    if (targetFormat === 'implicites') {
        const num = (v, p) => (p === 0 ? v : p > 0 ? `${v} - ${p}` : `${v} + ${Math.abs(p)}`);
        const getFracHtml = (n, d) =>
            `<div class="fraction" style="font-size:0.9rem;"><span>${n}</span><div class="fraction-line"></div><span>${d}</span></div>`;
        hb.innerHTML = `
            Escriu les equacions contínues i multiplica en creu per obtenir les dues equacions implícites:<br>
            <div style="display:inline-flex; align-items:center; margin: 0.5rem 0; font-family: var(--font-math);">
                Eq.1 (x i y): &nbsp; ${getFracHtml(num('x', p1), v1)} = ${getFracHtml(num('y', p2), v2)}
            </div><br>
            <div style="display:inline-flex; align-items:center; margin: 0.5rem 0; font-family: var(--font-math);">
                Eq.2 (y i z): &nbsp; ${getFracHtml(num('y', p2), v2)} = ${getFracHtml(num('z', p3), v3)}
            </div>
        `;
    } else if (currentSourceFormat === 'implicites') {
        hb.innerHTML = `
            Per trobar els elements geomètrics des de les implícites:<br><br>
            <strong>1. Punt P:</strong> Assigna un valor a una variable (ex: y=0) i resol el sistema.<br>
            <strong>2. Vector <span class="vec">v</span>:</strong> Fes el producte vectorial dels vectors normals.
        `;
    } else {
        hb.innerHTML = `
            Recorda l'estructura bàsica:<br>
            <strong>Punt:</strong> (x<sub>0</sub>, y<sub>0</sub>, z<sub>0</sub>)<br>
            <strong>Vector:</strong> (v<sub>1</sub>, v<sub>2</sub>, v<sub>3</sub>)
        `;
        btnMore.style.display = 'none';
    }
}

function handleLevel2Help() {
    const hb = document.getElementById('help-box');
    const btnMore = document.getElementById('btn-more-help');
    const [p1, p2, p3] = currentLine.P;
    const [v1, v2, v3] = currentLine.v;
    const num = (v, p) => (p === 0 ? v : p > 0 ? `${v} - ${p}` : `${v} + ${Math.abs(p)}`);

    if (currentSourceFormat === 'implicites') {
        const D1 = v1 * p2 - v2 * p1;
        const D2 = v2 * p3 - v3 * p2;
        const x_coord = (-D1 / v2) % 1 === 0 ? -D1 / v2 : (-D1 / v2).toFixed(2);
        const z_coord = (-D2 / -v2) % 1 === 0 ? -D2 / -v2 : (-D2 / -v2).toFixed(2);

        hb.innerHTML = `
            <div style="font-family:var(--font-math); background: white; padding: 1rem; border-radius: 0.4rem; border: 1px solid #e2e8f0; line-height: 1.8;">
                <strong>Resolució del punt P:</strong><br>
                ${v2}x ${formatConst(D1)} = 0 &nbsp; ⟹ &nbsp; x = ${x_coord}<br>
                ${-v2}z ${formatConst(D2)} = 0 &nbsp; ⟹ &nbsp; z = ${z_coord}<br>
                Punt trobat: <strong>P(${x_coord}, 0, ${z_coord})</strong><br><br>
                <strong>Resolució del vector <span class="vec">v</span>:</strong><br>
                <span class="vec">n<sub>1</sub></span> × <span class="vec">n<sub>2</sub></span> = (${v1 * v2}, ${v2 * v2}, ${v2 * v3}) &nbsp; ⟹ &nbsp; Simplificat: <strong>(${v1}, ${v2}, ${v3})</strong>
            </div>
        `;
    } else {
        const d1_x = v2;
        const d1_p1 = v2 * -p1;
        const d1_y = v1;
        const d1_p2 = v1 * -p2;
        const d2_y = v3;
        const d2_p2 = v3 * -p2;
        const d2_z = v2;
        const d2_p3 = v2 * -p3;

        hb.innerHTML = `
            <div style="font-family:var(--font-math); background: white; padding: 1rem; border-radius: 0.4rem; border: 1px solid #e2e8f0; line-height: 2;">
                Eq.1: (${v2}) · (${num('x', p1)}) = (${v1}) · (${num('y', p2)}) &nbsp; ⟹ &nbsp; ${cleanMath(d1_x, 'x', true)}${formatConst(d1_p1)} = ${cleanMath(d1_y, 'y', true)}${formatConst(d1_p2)}<br>
                Eq.2: (${v3}) · (${num('y', p2)}) = (${v2}) · (${num('z', p3)}) &nbsp; ⟹ &nbsp; ${cleanMath(d2_y, 'y', true)}${formatConst(d2_p2)} = ${cleanMath(d2_z, 'z', true)}${formatConst(d2_p3)}
            </div>
            <p style="margin-top: 1rem;">Aplica la propietat distributiva i agrupa tots els termes a l'esquerra.</p>
        `;
    }
    btnMore.style.display = 'none';
}

// --- FUNCIONS AUXILIARS MATEMÀTIQUES ---
function crossProduct(v, w) {
    return [v[1] * w[2] - v[2] * w[1], v[2] * w[0] - v[0] * w[2], v[0] * w[1] - v[1] * w[0]];
}

function dotProduct(v, w) {
    return v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
}

function isZeroVector(v) {
    return v.every(c => Math.abs(c) < 0.001);
}

function checkAnswer() {
    const format = document.getElementById('target-format').value;
    const getV = id => parseFloat(document.getElementById(id).value) || 0;
    const getS = id => (document.getElementById(id).value === '+' ? 1 : -1);

    let isCorrect = false;
    let errorMessage = '';
    const Vo = currentLine.v;
    const Po = currentLine.P;

    const markInputs = (valid, ids) => {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.remove('correct', 'incorrect');
            void el.offsetWidth;
            el.classList.add(valid ? 'correct' : 'incorrect');
        });
    };

    if (format === 'vectorial' || format === 'parametriques' || format === 'continues') {
        let Pu, Vu;
        let pIds = [],
            vIds = [];

        if (format === 'vectorial') {
            Pu = [getV('vp1'), getV('vp2'), getV('vp3')];
            Vu = [getV('vv1'), getV('vv2'), getV('vv3')];
            pIds = ['vp1', 'vp2', 'vp3'];
            vIds = ['vv1', 'vv2', 'vv3'];
        } else if (format === 'parametriques') {
            Pu = [getV('pp1'), getV('pp2'), getV('pp3')];
            Vu = [getS('ps1') * getV('pv1'), getS('ps2') * getV('pv2'), getS('ps3') * getV('pv3')];
            pIds = ['pp1', 'pp2', 'pp3'];
            vIds = ['ps1', 'pv1', 'ps2', 'pv2', 'ps3', 'pv3'];
        } else if (format === 'continues') {
            Pu = [-(getS('cs1') * getV('cp1')), -(getS('cs2') * getV('cp2')), -(getS('cs3') * getV('cp3'))];
            Vu = [getV('cv1'), getV('cv2'), getV('cv3')];
            pIds = ['cs1', 'cp1', 'cs2', 'cp2', 'cs3', 'cp3'];
            vIds = ['cv1', 'cv2', 'cv3'];
        }

        const pointOnLine = isZeroVector(crossProduct([Pu[0] - Po[0], Pu[1] - Po[1], Pu[2] - Po[2]], Vo));
        const vZero = isZeroVector(Vu);
        const vParallel = !vZero && isZeroVector(crossProduct(Vu, Vo));

        if (vZero) {
            errorMessage =
                '1.1 Un vector director no pot ser el vector nul <span class="vec">v</span> = (0,0,0). Has d\'escollir un vector no nul.';
            markInputs(false, vIds);
            if (pointOnLine) markInputs(true, pIds);
            else markInputs(false, pIds);
        } else if (!vParallel) {
            errorMessage =
                '1.2 El vector que has escrit no és vector director de la recta original. Revisa les operacions que has fet.';
            markInputs(false, vIds);
            if (pointOnLine) markInputs(true, pIds);
            else markInputs(false, pIds);
        } else if (!pointOnLine) {
            errorMessage =
                '1.3 La direcció de la recta és correcta. Ara bé, el punt que has triat no pertany a la recta original. Revisa els càlculs i escriu un punt adequat.';
            markInputs(true, vIds);
            markInputs(false, pIds);
        } else {
            markInputs(true, vIds);
            markInputs(true, pIds);
            isCorrect = true;
        }
    } else if (format === 'implicites') {
        const A1 = getV('ia1'),
            B1 = getS('is1') * getV('ib1'),
            C1 = 0,
            D1 = getS('is2') * getV('id1');
        const A2 = 0,
            B2 = getV('ib2'),
            C2 = getS('is3') * getV('ic2'),
            D2 = getS('is4') * getV('id2');

        const n1 = [A1, B1, C1];
        const n2 = [A2, B2, C2];
        const eq1Ids = ['ia1', 'is1', 'ib1', 'is2', 'id1'];
        const eq2Ids = ['ib2', 'is3', 'ic2', 'is4', 'id2'];

        const n1Zero = isZeroVector(n1);
        const n2Zero = isZeroVector(n2);

        if (n1Zero || n2Zero) {
            errorMessage =
                '2.1 Una de les equacions implícites que has escrit no és vàlida, perquè els coeficients A, B, C són tots zero.';
            if (n1Zero) markInputs(false, eq1Ids);
            else markInputs(true, eq1Ids);
            if (n2Zero) markInputs(false, eq2Ids);
            else markInputs(true, eq2Ids);
        } else {
            const independent = !isZeroVector(crossProduct(n1, n2));
            if (!independent) {
                errorMessage =
                    '2.2 Les dues equacions implícites que has escrit no defineixen una recta, perquè els plans que representa cadascuna no són secants.';
                markInputs(false, eq1Ids.concat(eq2Ids));
            } else {
                const perp1 = Math.abs(dotProduct(n1, Vo)) < 0.001;
                const perp2 = Math.abs(dotProduct(n2, Vo)) < 0.001;
                const pointInP1 = Math.abs(A1 * Po[0] + B1 * Po[1] + C1 * Po[2] + D1) < 0.001;
                const pointInP2 = Math.abs(A2 * Po[0] + B2 * Po[1] + C2 * Po[2] + D2) < 0.001;

                if (!perp1 || !perp2) {
                    errorMessage =
                        '2.3 La recta que has expressat amb aquestes equacions implícites no té la mateixa direcció de la recta original. Revisa els càlculs.';
                    if (!perp1) markInputs(false, eq1Ids);
                    else if (pointInP1) markInputs(true, eq1Ids);
                    else markInputs(false, eq1Ids);
                    if (!perp2) markInputs(false, eq2Ids);
                    else if (pointInP2) markInputs(true, eq2Ids);
                    else markInputs(false, eq2Ids);
                } else if (!pointInP1 || !pointInP2) {
                    errorMessage =
                        '2.4 La recta que has expressat amb aquestes equacions implícites té la direcció correcta, però no passa pel mateix punt que la recta original. Revisa els teus càlculs.';
                    if (!pointInP1) markInputs(false, eq1Ids);
                    else markInputs(true, eq1Ids);
                    if (!pointInP2) markInputs(false, eq2Ids);
                    else markInputs(true, eq2Ids);
                } else {
                    markInputs(true, eq1Ids.concat(eq2Ids));
                    isCorrect = true;
                }
            }
        }
    }

    const errBox = document.getElementById('error-box');
    if (isCorrect) {
        document.getElementById('btn-check').style.display = 'none';
        document.getElementById('btn-next').style.display = 'block';
        document.getElementById('btn-help').style.display = 'none';
        document.getElementById('btn-more-help').style.display = 'none';
        document.getElementById('help-box').style.display = 'none';
        if (errBox) errBox.style.display = 'none';
    } else if (errorMessage) {
        if (errBox) {
            errBox.innerHTML = errorMessage;
            errBox.style.display = 'block';
            errBox.classList.remove('shake-long');
            void errBox.offsetWidth; // Força el reflow per reiniciar l'animació
            errBox.classList.add('shake-long');
        }
    }
}
window.onload = () => {
    initProblem();
};

function initProblemPlans() {
    FixedSessions?.next('pla');
    let A, B, C, D, px, py, pz;
    let valid = false;

    while (!valid) {
        A = randNonZero(-2, 2);
        const b_fact = randInt(-3, 3);
        const c_fact = randInt(-3, 3);
        const d_fact = randInt(-5, 5);

        B = A * b_fact;
        C = A * c_fact;
        D = A * d_fact;

        py = randInt(-4, 4);
        pz = randInt(-4, 4);
        px = (-B * py - C * pz - D) / A;

        if (Number.isInteger(px) && Math.abs(px) < 16) {
            valid = true;
        }
    }

    currentPlane.P = [px, py, pz];
    currentPlane.n = [A, B, C];
    currentPlane.D = D;
    currentPlane.u = [-B / A, 1, 0];
    currentPlane.v = [-C / A, 0, 1];

    const formats = ['vectorial', 'parametriques', 'general'];
    currentSourceFormat = formats[Math.floor(Math.random() * formats.length)];

    const [p1, p2, p3] = currentPlane.P;
    const box = document.getElementById('source-equation-plans');
    const instruction = document.getElementById('instruction-text-plans');
    let html = '';

    if (currentSourceFormat === 'vectorial') {
        html = `(x, y, z) = (${p1}, ${p2}, ${p3}) + λ(${currentPlane.u[0]}, ${currentPlane.u[1]}, ${currentPlane.u[2]}) + μ(${currentPlane.v[0]}, ${currentPlane.v[1]}, ${currentPlane.v[2]})`;
    } else if (currentSourceFormat === 'parametriques') {
        html = `<div class="system-brace lines-3"><div style="text-align:left; white-space:nowrap; line-height: 1.5;">
            x = ${p1 === 0 ? '' : p1} ${cleanMath(currentPlane.u[0], 'λ', p1 === 0)} ${cleanMath(currentPlane.v[0], 'μ')}<br>
            y = ${p2 === 0 ? '' : p2} ${cleanMath(currentPlane.u[1], 'λ', p2 === 0)} ${cleanMath(currentPlane.v[1], 'μ')}<br>
            z = ${p3 === 0 ? '' : p3} ${cleanMath(currentPlane.u[2], 'λ', p3 === 0)} ${cleanMath(currentPlane.v[2], 'μ')}
        </div></div>`;
    } else if (currentSourceFormat === 'general') {
        html = `${cleanMath(A, 'x', true)} ${cleanMath(B, 'y')} ${cleanMath(C, 'z')} ${formatConst(D)} = 0`;
    }

    instruction.innerText = `Un pla s'expressa a partir d'aquesta equació ${currentSourceFormat}:`;
    box.innerHTML = html;

    const select = document.getElementById('target-format-plans');
    select.value = '';
    Array.from(select.options).forEach(opt => {
        opt.style.display = opt.value === currentSourceFormat || opt.value === '' ? 'none' : 'block';
    });
    document.getElementById('workspace-plans').innerHTML = '';
    document.getElementById('btn-check-plans').style.display = 'none';
    document.getElementById('btn-next-plans').style.display = 'none';
    document.getElementById('btn-help-plans').style.display = 'none';
    document.getElementById('help-box-plans').style.display = 'none';
    const errBoxPlans = document.getElementById('error-box-plans');
    if (errBoxPlans) errBoxPlans.style.display = 'none';
}

function renderWorkspacePlans() {
    const format = document.getElementById('target-format-plans').value;
    const ws = document.getElementById('workspace-plans');
    const btnHelp = document.getElementById('btn-help-plans');
    const btnMore = document.getElementById('btn-more-help-plans');
    const hb = document.getElementById('help-box-plans');

    document.getElementById('btn-check-plans').style.display = 'inline-block';
    document.getElementById('btn-next-plans').style.display = 'none';

    hb.style.display = 'none';
    const errBoxPlans = document.getElementById('error-box-plans');
    if (errBoxPlans) errBoxPlans.style.display = 'none';

    btnHelp.disabled = false;
    btnHelp.style.background = '#F0CB90';
    btnHelp.style.color = '#000';

    const toGeneral = format === 'general';
    const fromGeneral = currentSourceFormat === 'general';
    const isTrivial = !toGeneral && !fromGeneral;

    if (isTrivial) {
        btnHelp.style.display = 'none';
        btnMore.style.display = 'none';
    } else {
        btnHelp.style.display = 'inline-block';
        btnMore.style.display = 'none';
    }

    // APLICACIÓ DE CLASSES FLEX (eq-row, eq-col) PER EVITAR SALTS DE LÍNIA EN MÒBIL (CAPTURA DE PANTALLA)
    if (format === 'vectorial') {
        ws.innerHTML = `<div class="eq-row">(x,y,z) = (<input type="number" step="any" id="pp1" class="math-input">, <input type="number" step="any" id="pp2" class="math-input">, <input type="number" step="any" id="pp3" class="math-input">) + λ(<input type="number" step="any" id="pu1" class="math-input">, <input type="number" step="any" id="pu2" class="math-input">, <input type="number" step="any" id="pu3" class="math-input">) + μ(<input type="number" step="any" id="pv1" class="math-input">, <input type="number" step="any" id="pv2" class="math-input">, <input type="number" step="any" id="pv3" class="math-input">)</div>`;
    } else if (format === 'parametriques') {
        ws.innerHTML = `<div class="system-brace lines-3"><div class="eq-col">
            <div class="eq-row">x = <input type="number" step="any" id="pp1" class="math-input"> ${getSignSelect('ps1')} <input type="number" step="any" id="pu1" class="math-input"> λ ${getSignSelect('ps2')} <input type="number" step="any" id="pv1" class="math-input"> μ</div>
            <div class="eq-row">y = <input type="number" step="any" id="pp2" class="math-input"> ${getSignSelect('ps3')} <input type="number" step="any" id="pu2" class="math-input"> λ ${getSignSelect('ps4')} <input type="number" step="any" id="pv2" class="math-input"> μ</div>
            <div class="eq-row">z = <input type="number" step="any" id="pp3" class="math-input"> ${getSignSelect('ps5')} <input type="number" step="any" id="pu3" class="math-input"> λ ${getSignSelect('ps6')} <input type="number" step="any" id="pv3" class="math-input"> μ</div>
        </div></div>`;
    } else if (format === 'general') {
        ws.innerHTML = `<div class="eq-row"><input type="number" step="any" id="ga" class="math-input"> x ${getSignSelect('gs1')} <input type="number" step="any" id="gb" class="math-input"> y ${getSignSelect('gs2')} <input type="number" step="any" id="gc" class="math-input"> z ${getSignSelect('gs3')} <input type="number" step="any" id="gd" class="math-input"> = 0</div>`;
    }
}

function handleLevel1HelpPlans() {
    const hb = document.getElementById('help-box-plans');
    const btnHelp = document.getElementById('btn-help-plans');
    const btnMore = document.getElementById('btn-more-help-plans');
    const targetFormat = document.getElementById('target-format-plans').value;

    const P = currentPlane.P;
    const u = currentPlane.u;
    const v = currentPlane.v;

    btnHelp.disabled = true;
    btnHelp.style.background = '#e2e8f0';
    btnHelp.style.color = '#94a3b8';
    hb.style.display = 'block';

    if (targetFormat === 'general') {
        btnMore.style.display = 'inline-block';
        hb.innerHTML = `
            Per trobar l'equació general Ax + By + Cz + D = 0, segueix aquests passos:<br><br>
            <strong>Coordenades (A, B, C)</strong><br>
            Són les coordenades d'un vector normal al pla. Per trobar aquest vector <span class="vec">n</span>=(A,B,C), fes el producte vectorial: &nbsp; <span class="vec">n</span> = (${u[0]}, ${u[1]}, ${u[2]}) × (${v[0]}, ${v[1]}, ${v[2]}).<br><br>
            <strong>Coordenada D</strong><br>
            Un cop has trobat A, B, C, ja pots substituir el punt <strong>P(${P[0]}, ${P[1]}, ${P[2]})</strong> en l'equació Ax+By+Cz+D=0, i això et permetrà aïllar la constant D.
        `;
    } else {
        const [A, B, C] = currentPlane.n;
        const D = currentPlane.D;
        btnMore.style.display = 'inline-block';
        hb.innerHTML = `
            Aïlla una variable en funció de les altres dues. Per exemple, les variables lliures poden ser y=λ i z=μ i llavors, aïlla la variable x de l'equació:
            <div style="margin-top: 0.8rem; font-family: var(--font-math); text-align: center; font-size: 1.2rem; background: white; padding: 0.5rem; border-radius: 0.4rem; border: 1px solid #e2e8f0; width: 100%;">
                ${cleanMath(A, 'x', true)} ${cleanMath(B, 'λ')} ${cleanMath(C, 'μ')} ${formatConst(D)} = 0
            </div>
        `;
    }
}

function handleLevel2HelpPlans() {
    const hb = document.getElementById('help-box-plans');
    const targetFormat = document.getElementById('target-format-plans').value;
    const [A, B, C] = currentPlane.n;
    const D = currentPlane.D;

    if (currentSourceFormat === 'general') {
        const targetName = targetFormat === 'vectorial' ? "l'equació vectorial" : 'les equacions paramètriques';

        const p_x = -D / A;
        const u_x = -B / A;
        const v_x = -C / A;

        hb.innerHTML = `
            <div style="font-family:var(--font-math); background: white; padding: 1rem; border-radius: 0.4rem; border: 1px solid #e2e8f0; line-height: 1.8;">
                Tenim l'equació <strong>${cleanMath(A, 'x', true)} ${cleanMath(B, 'λ')} ${cleanMath(C, 'μ')} ${formatConst(D)} = 0</strong>. <br>
                Aïllem la 'x' i obtenim: <strong>x = ${cleanMath(u_x, 'λ', true)} ${cleanMath(v_x, 'μ')} ${formatConst(p_x)}</strong><br><br>
                Sabem que <strong>y = λ</strong> i que <strong>z = μ</strong>.<br><br>
                Per tant, un punt del pla és <strong>P(${p_x}, 0, 0)</strong> i els vectors directors del pla són <strong><span class="vec">u</span>(${u_x}, 1, 0)</strong> i <strong><span class="vec">v</span>(${v_x}, 0, 1)</strong>.<br><br>
                D'aquesta manera obtenim ${targetName}.
            </div>
        `;
    } else {
        hb.innerHTML = `
            <div style="font-family:var(--font-math); background: white; padding: 1rem; border-radius: 0.4rem; border: 1px solid #e2e8f0; line-height: 1.8;">
                <strong>Càlculs realitzats:</strong><br>
                <span class="vec">n</span> = (${currentPlane.u.join(', ')}) × (${currentPlane.v.join(', ')}) = (${A}, ${B}, ${C})<br>
                Substituint P(${currentPlane.P}): ${A}(${currentPlane.P[0]}) + ${B}(${currentPlane.P[1]}) + ${C}(${currentPlane.P[2]}) + D = 0<br>
                ⟹ D = ${D}
            </div>
        `;
    }
    document.getElementById('btn-more-help-plans').style.display = 'none';
}

function checkAnswerPlans() {
    const format = document.getElementById('target-format-plans').value;
    if (!format) return;

    const getV = id => parseFloat(document.getElementById(id).value) || 0;
    const getS = id => {
        const el = document.getElementById(id);
        return el && el.value === '-' ? -1 : 1;
    };

    let isCorrect = false;
    let errorMessage = '';

    const markInputs = (valid, ids) => {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('correct', 'incorrect');
                void el.offsetWidth;
                el.classList.add(valid ? 'correct' : 'incorrect');
            }
        });
    };

    if (format === 'general') {
        const A = getV('ga'),
            B = getS('gs1') * getV('gb'),
            C = getS('gs2') * getV('gc'),
            D = getS('gs3') * getV('gd');
        const userN = [A, B, C];
        const nIds = ['ga', 'gs1', 'gb', 'gs2', 'gc'];
        const dIds = ['gs3', 'gd'];

        if (isZeroVector(userN)) {
            errorMessage = '4.1 El vector normal <span class="vec">n</span> del pla no pot ser (0,0,0).';
            markInputs(false, nIds);
            markInputs(false, dIds);
        } else {
            const parallel = isZeroVector(crossProduct(userN, currentPlane.n));
            if (!parallel) {
                errorMessage = '4.2 Has comès algun error en les coordenades (A, B, C). Revisa els càlculs.';
                markInputs(false, nIds);
                markInputs(false, dIds);
            } else {
                const pointIn =
                    Math.abs(A * currentPlane.P[0] + B * currentPlane.P[1] + C * currentPlane.P[2] + D) < 0.001;
                if (!pointIn) {
                    errorMessage =
                        "4.3 Les coordenades (A, B, C) són correctes, però el terme independent D no és correcte. Repassa la substitució que has fet del punt del pla a l'equació i com has aïllat la variable D.";
                    markInputs(true, nIds);
                    markInputs(false, dIds);
                } else {
                    markInputs(true, nIds.concat(dIds));
                    isCorrect = true;
                }
            }
        }
    } else {
        let Pu, Uu, Vu;
        let pIds = [],
            uIds = [],
            vIds = [];
        if (format === 'vectorial') {
            Pu = [getV('pp1'), getV('pp2'), getV('pp3')];
            Uu = [getV('pu1'), getV('pu2'), getV('pu3')];
            Vu = [getV('pv1'), getV('pv2'), getV('pv3')];
            pIds = ['pp1', 'pp2', 'pp3'];
            uIds = ['pu1', 'pu2', 'pu3'];
            vIds = ['pv1', 'pv2', 'pv3'];
        } else {
            Pu = [getV('pp1'), getV('pp2'), getV('pp3')];
            Uu = [getS('ps1') * getV('pu1'), getS('ps3') * getV('pu2'), getS('ps5') * getV('pu3')];
            Vu = [getS('ps2') * getV('pv1'), getS('ps4') * getV('pv2'), getS('ps6') * getV('pv3')];
            pIds = ['pp1', 'pp2', 'pp3'];
            uIds = ['ps1', 'pu1', 'ps3', 'pu2', 'ps5', 'pu3'];
            vIds = ['ps2', 'pv1', 'ps4', 'pv2', 'ps6', 'pv3'];
        }

        const uZero = isZeroVector(Uu);
        const vZero = isZeroVector(Vu);
        const pointIn =
            Math.abs(
                currentPlane.n[0] * Pu[0] + currentPlane.n[1] * Pu[1] + currentPlane.n[2] * Pu[2] + currentPlane.D
            ) < 0.001;

        if (uZero || vZero) {
            errorMessage = "3.1 Els vectors directors d'un pla no poden ser nuls.";
            if (uZero) markInputs(false, uIds);
            else markInputs(true, uIds);
            if (vZero) markInputs(false, vIds);
            else markInputs(true, vIds);
            if (pointIn) markInputs(true, pIds);
            else markInputs(false, pIds);
        } else {
            const indep = !isZeroVector(crossProduct(Uu, Vu));
            if (!indep) {
                errorMessage =
                    '3.2 Els vectors directors que has escrit són paral·lels, i per tant no defineixen un pla. Modifica un dels dos vectors i de forma adequada.';
                markInputs(false, uIds.concat(vIds));
                if (pointIn) markInputs(true, pIds);
                else markInputs(false, pIds);
            } else {
                const uPerp = Math.abs(dotProduct(Uu, currentPlane.n)) < 0.001;
                const vPerp = Math.abs(dotProduct(Vu, currentPlane.n)) < 0.001;
                if (!uPerp || !vPerp) {
                    errorMessage =
                        '3.3 Els vectors directors que has escrit no són del pla original. Comprova un altre cop els teus càlculs.';
                    if (!uPerp) markInputs(false, uIds);
                    else markInputs(true, uIds);
                    if (!vPerp) markInputs(false, vIds);
                    else markInputs(true, vIds);
                    if (pointIn) markInputs(true, pIds);
                    else markInputs(false, pIds);
                } else if (!pointIn) {
                    errorMessage =
                        "3.4 Els vectors directors que has escrit són correctes, però el punt que has triat no pertany al pla. Revisa els càlculs, perquè amb aquesta resposta has creat un pla paral·lel a l'original.";
                    markInputs(true, uIds);
                    markInputs(true, vIds);
                    markInputs(false, pIds);
                } else {
                    markInputs(true, pIds.concat(uIds).concat(vIds));
                    isCorrect = true;
                }
            }
        }
    }

    const errBoxPlans = document.getElementById('error-box-plans');
    if (isCorrect) {
        document.getElementById('btn-check-plans').style.display = 'none';
        document.getElementById('btn-next-plans').style.display = 'block';
        document.getElementById('btn-help-plans').style.display = 'none';
        document.getElementById('btn-more-help-plans').style.display = 'none';
        document.getElementById('help-box-plans').style.display = 'none';
        if (errBoxPlans) errBoxPlans.style.display = 'none';
    } else if (errorMessage) {
        if (errBoxPlans) {
            errBoxPlans.innerHTML = errorMessage;
            errBoxPlans.style.display = 'block';
            errBoxPlans.classList.remove('shake-long');
            void errBoxPlans.offsetWidth;
            errBoxPlans.classList.add('shake-long');
        }
    }
}

function switchTab(t) {
    currentTab = t;
    document.getElementById('btn-rectes').classList.toggle('active', t === 'rectes');
    document.getElementById('btn-plans').classList.toggle('active', t === 'plans');
    document.getElementById('content-rectes').style.display = t === 'rectes' ? 'block' : 'none';
    document.getElementById('content-plans').style.display = t === 'plans' ? 'block' : 'none';

    if (t === 'plans' && !plansInitialized) {
        initProblemPlans();
        plansInitialized = true;
    }

    if (t === 'rectes' && !rectesInitialized) {
        initProblem();
        rectesInitialized = true;
    }
}

document.addEventListener('focusin', function (e) {
    if (e.target && e.target.classList) {
        e.target.classList.remove('incorrect', 'correct');
    }
});
