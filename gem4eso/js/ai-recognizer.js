// ═══════════════════════════════════════════════════════════════════════
// js/ai-recognizer.js — Reconeixement automàtic de respostes via GEMINI.
// ═══════════════════════════════════════════════════════════════════════

import { 
  getStuMap, setStudentAnswer, getStuOrder, getStuNames,
  markUnsaved 
} from './state.js';
import { getQ, getItemType, render } from './render.js';
import { showToast } from './ui.js';

const PROMPT_SISTEMA_BASE = `Ets un sistema expert de reconeixement òptic de marques (OMR) especialitzat a corregir exàmens de competències bàsiques.

La teva tasca és analitzar imatges de fulls de respostes i extreure'n allò que l'alumne ha contestat a cada pregunta, seguint unes regles molt estrictes d'interpretació de marques, esborrats i rectificacions.

REGLES D'INTERPRETACIÓ DE LES MARQUES:
1. Opció marcada: L'alumne marca l'opció triada fent-hi una creu o una X. 
2. Correccions (Ratllades): Si una marca està clarament ratllada o "guixada" per sobre, significa que l'alumne s'ha penedit d'aquella resposta i l'ha anul·lada. NO s'ha de comptar.
3. Substitució (El cercle de salvació): Si l'alumne ha anul·lat una resposta, normalment marcarà la nova resposta correcta encerclant l'opció bona, o bé fent-hi una altra X molt clara. Fes cas sempre a la "nova" marca.
4. Blanc dubtós: Si una casella té una petita taca, o sembla que hi havia una X però s'ha esborrat gairebé perfectament amb goma, considera-ho com a resposta EN BLANC. (Retorna «—»).
5. Doble marca sense correcció: Si veus dues marques (per exemple, dues X en opcions diferents) i cap d'elles està clarament ratllada/anul·lada, és una pregunta NUL·LA. (Retorna «?»).

VALORS A RETORNAR PER CADA PREGUNTA:
- Si és de tipus opció (A, B, C, D, E): Retorna la lletra de l'opció triada en minúscula (ex: "a").
- Si és de tipus Cert/Fals: Retorna "V" o "F" en majúscula.
- Si no hi ha resposta: Retorna «—» (Guió llarg).
- Si hi ha confusió de marques (nul): Retorna «?» (Interrogant).
- Si la marca és il·legible o hi ha un gargot: Retorna «!» (Exclamació).

Si veus a la part superior del full una etiqueta identificativa (codi, DNI, número o text manuscrit identificador), transcriu-la al camp "id_alumne". Si no es veu o és il·legible, posa "id_alumne" com a string buit "".

FORMAT DE SORTIDA OBLIGATORI (JSON estricte, res més):
{
  "id_alumne": "...",
  "respostes": {
__CLAUS_DINAMIQUES__
  },
  "comentari": "Notes breus sobre fulls dubtosos. Buit si tot és clar."
}`;

export function openAiRec() {
  document.getElementById('ai-rec-overlay').classList.remove('off');
  const savedKey = localStorage.getItem('cb-ai-key-gemini');
  if (savedKey) document.getElementById('ai-rec-key').value = savedKey;
}

export function closeAiRec() {
  document.getElementById('ai-rec-overlay').classList.add('off');
}

export async function startAiRec() {
  const key = document.getElementById('ai-rec-key').value.trim();
  const fileInput = document.getElementById('ai-rec-file');
  
  if (!key) return alert('Cal una API Key de Google Gemini.');
  if (!fileInput.files.length) return alert('Selecciona un fitxer PDF.');
  
  localStorage.setItem('cb-ai-key-gemini', key);
  const file = fileInput.files[0];
  
  const btnGo = document.getElementById('ai-rec-btn-go');
  btnGo.disabled = true;
  _setStatus('Carregant PDF...');
  _setProgress(0);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const Q = getQ();

    for (let i = 1; i <= numPages; i++) {
      _setStatus(`Processant pàgina ${i} de ${numPages} amb Gemini...`);
      const page = await pdf.getPage(i);
      const base64Image = await _pageToJpg(page);
      
      const result = await _callGemini(key, base64Image, Q);
      _processResult(result);
      
      _setProgress((i / numPages) * 100);
    }

    _setStatus('Reconeixement finalitzat amb èxit.');
    showToast('S\'han processat totes les pàgines');
    render();
  } catch (err) {
    console.error(err);
    _setStatus(`Error: ${err.message}`);
  } finally {
    btnGo.disabled = false;
  }
}

async function _pageToJpg(page) {
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

async function _callGemini(apiKey, base64Image, Q) {
  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  let jsonKeys = "";
  for(let i=1; i<=Q; i++) {
    const id = i.toString().padStart(2, '0');
    jsonKeys += `    "Q${id}": "...",\n`;
  }
  const promptSistema = PROMPT_SISTEMA_BASE.replace('__CLAUS_DINAMIQUES__', jsonKeys);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: promptSistema }]
    },
    contents: [
      {
        parts: [
          { text: "Extreu les respostes d'aquest examen." },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.text();
    throw new Error(`Error de Gemini: ${response.status} - ${errData}`);
  }

  const data = await response.json();
  const textResposta = data.candidates[0].content.parts[0].text;
  return JSON.parse(textResposta);
}

function _processResult(data) {
  const stuMap = getStuMap();
  const stuOrder = getStuOrder();
  const stuNames = getStuNames();
  
  const id = data.id_alumne || `Nova_IA_${Date.now()}`;
  if (!stuMap[id]) {
    stuMap[id] = new Array(getQ()).fill(null);
    stuOrder.push(id);
    stuNames[id] = id;
  }

  Object.entries(data.respostes).forEach(([key, val]) => {
    const idx = parseInt(key.replace('Q', '')) - 1;
    if (idx >= 0 && idx < getQ()) {
      const normalized = _normalize(val, idx);
      setStudentAnswer(id, idx, normalized);
    }
  });
  markUnsaved();
}

function _normalize(val, qIdx) {
  if (!val || val === '—' || val === ' ') return '_';
  const type = getItemType(qIdx);
  let v = val.toString().toUpperCase().trim();
  if (type === 'vf') return (v === 'V' || v === 'A') ? 'A' : (v === 'F' || v === 'B' ? 'B' : '_');
  return v;
}

function _setStatus(text) { document.getElementById('ai-rec-status').textContent = text; }
function _setProgress(pct) { document.getElementById('ai-rec-bar').style.width = pct + '%'; }
