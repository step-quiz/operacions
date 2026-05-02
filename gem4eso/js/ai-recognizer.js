// ═══════════════════════════════════════════════════════════════════════
// js/ai-recognizer.js — 100% Google Gemini 1.5 Flash
// ═══════════════════════════════════════════════════════════════════════

import { 
    getStuMap, setStudentAnswer, getStuOrder, getStuNames, markUnsaved 
} from './state.js';
import { getQ, getItemType, render } from './render.js';
import { showToast } from './ui.js';

const PROMPT_BASE = `Ets un expert en OMR. Transcriu les respostes d'aquest full d'examen. 
Retorna la informació en format JSON estricte amb "id_alumne" i "respostes" (Q01, Q02...). 
Fes servir "—" per a respostes en blanc.`;

export function openAiRec() {
    document.getElementById('ai-rec-overlay').classList.remove('off');
    const saved = localStorage.getItem('gemini-api-key');
    if (saved) document.getElementById('ai-rec-key').value = saved;
}

export function closeAiRec() {
    document.getElementById('ai-rec-overlay').classList.add('off');
}

export async function startAiRec() {
    const key = document.getElementById('ai-rec-key').value.trim();
    const fileInput = document.getElementById('ai-rec-file');
    
    if (!key || !fileInput.files.length) return alert('Falten dades (Key o Fitxer).');
    
    localStorage.setItem('gemini-api-key', key);
    const btnGo = document.getElementById('ai-rec-btn-go');
    btnGo.disabled = true;

    try {
        const arrayBuffer = await fileInput.files[0].arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
            _updateUI(`Processant pàgina ${i}...`, (i / pdf.numPages) * 100);
            const page = await pdf.getPage(i);
            const imgBase64 = await _pageToImg(page);
            const result = await _callGemini(key, imgBase64);
            _applyData(result);
        }
        
        _updateUI('Completat!', 100);
        showToast('Procés finalitzat');
        render();
    } catch (e) {
        _updateUI(`Error: ${e.message}`, 0);
    } finally {
        btnGo.disabled = false;
    }
}

async function _pageToImg(page) {
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height; canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

async function _callGemini(apiKey, base64) {
    // CORREGIT: Model 1.5-flash (el 2.5 no existeix)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const body = {
        contents: [{
            parts: [
                { text: PROMPT_BASE },
                { inlineData: { mimeType: "image/jpeg", data: base64 } }
            ]
        }],
        generationConfig: { responseMimeType: "application/json" }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text);
}

function _applyData(data) {
    const id = data.id_alumne || `IA_${Date.now()}`;
    const stuMap = getStuMap();
    if (!stuMap[id]) {
        stuMap[id] = new Array(getQ()).fill('_');
        getStuOrder().push(id);
        getStuNames()[id] = id;
    }
    Object.entries(data.respostes).forEach(([q, val]) => {
        const idx = parseInt(q.replace('Q','')) - 1;
        if (idx >= 0 && idx < getQ()) setStudentAnswer(id, idx, val);
    });
    markUnsaved();
}

function _updateUI(txt, p) {
    document.getElementById('ai-rec-status').textContent = txt;
    document.getElementById('ai-rec-bar').style.width = p + '%';
}
