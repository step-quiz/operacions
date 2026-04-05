// ════════════════════════════════════════════════════════
// constants.js — Dades globals, assets i utilitats pures
// ════════════════════════════════════════════════════════

// Namespace global
window.K = window.K || {};

// ── Seguretat: sanitització HTML ──

const _SAFE_TAGS  = new Set(['em','strong','code','br','span','b','i','u','sub','sup']);
const _SAFE_ATTRS = new Set(['class','title']);

function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode('');
    const tag = node.tagName.toLowerCase();
    if (!_SAFE_TAGS.has(tag)) {
      const frag = document.createDocumentFragment();
      for (const child of node.childNodes) frag.appendChild(walk(child));
      return frag;
    }
    const el = document.createElement(tag);
    for (const attr of node.attributes) {
      if (_SAFE_ATTRS.has(attr.name.toLowerCase())) el.setAttribute(attr.name, attr.value);
    }
    for (const child of node.childNodes) el.appendChild(walk(child));
    return el;
  }
  const frag = document.createDocumentFragment();
  for (const child of doc.body.childNodes) frag.appendChild(walk(child));
  const tmp = document.createElement('div');
  tmp.appendChild(frag);
  return tmp.innerHTML;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


// ── Direccions ──

const DIRS = [
  { name:'Est',  dx: 1, dy: 0, arrow:'→', dataDir:'right'  },
  { name:'Sud',  dx: 0, dy: 1, arrow:'↓', dataDir:'bottom' },
  { name:'Oest', dx:-1, dy: 0, arrow:'←', dataDir:'left'   },
  { name:'Nord', dx: 0, dy:-1, arrow:'↑', dataDir:'top'    },
];


// ── Assets gràfics (Pixel Art SVG) ──

const KAREL_ASSETS = {
  MEDUSA: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="karel-entity" fill="currentColor" shape-rendering="crispEdges"><rect x="5" y="2" width="1" height="1"/><rect x="6" y="2" width="1" height="1"/><rect x="7" y="2" width="1" height="1"/><rect x="8" y="2" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="10" y="2" width="1" height="1"/><rect x="4" y="3" width="1" height="1"/><rect x="5" y="3" width="1" height="1"/><rect x="10" y="3" width="1" height="1"/><rect x="11" y="3" width="1" height="1"/><rect x="3" y="4" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="5" y="4" width="1" height="1"/><rect x="6" y="4" width="1" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="8" y="4" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="11" y="4" width="1" height="1"/><rect x="12" y="4" width="1" height="1"/><rect x="3" y="5" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="7" y="5" width="1" height="1"/><rect x="8" y="5" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="11" y="5" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="3" y="6" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="5" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="7" y="6" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="9" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="11" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="3" y="7" width="1" height="1"/><rect x="4" y="7" width="1" height="1"/><rect x="5" y="7" width="1" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/><rect x="6" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="10" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="7" y="9" width="1" height="1"/><rect x="8" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="7" y="10" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="4" y="11" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="8" y="11" width="1" height="1"/><rect x="11" y="11" width="1" height="1"/><rect x="3" y="12" width="1" height="1"/><rect x="7" y="12" width="1" height="1"/><rect x="8" y="12" width="1" height="1"/><rect x="12" y="12" width="1" height="1"/><rect x="3" y="13" width="1" height="1"/><rect x="7" y="13" width="1" height="1"/><rect x="8" y="13" width="1" height="1"/><rect x="12" y="13" width="1" height="1"/><rect x="6" y="3" width="1" height="1" fill="var(--bg)"/><rect x="7" y="3" width="1" height="1" fill="var(--bg)"/><rect x="8" y="3" width="1" height="1" fill="var(--bg)"/><rect x="9" y="3" width="1" height="1" fill="var(--bg)"/></svg>`,

  ROCK: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" shape-rendering="crispEdges"><g fill="#6B5040"><rect x="6" y="2" width="5" height="1"/><rect x="5" y="3" width="7" height="1"/><rect x="4" y="4" width="8" height="1"/><rect x="3" y="5" width="10" height="1"/><rect x="3" y="6" width="10" height="1"/><rect x="2" y="7" width="12" height="1"/><rect x="2" y="8" width="12" height="1"/><rect x="1" y="9" width="13" height="1"/><rect x="1" y="10" width="14" height="1"/><rect x="1" y="11" width="14" height="1"/><rect x="1" y="12" width="14" height="1"/><rect x="1" y="13" width="14" height="1"/><rect x="1" y="14" width="14" height="1"/></g><g fill="#8A6848"><rect x="6" y="2" width="5" height="1"/><rect x="5" y="3" width="6" height="1"/></g><g fill="#4A3728"><rect x="1" y="11" width="14" height="4"/><rect x="7" y="4" width="1" height="2"/><rect x="6" y="6" width="2" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/></g><g fill="#506B38"><rect x="2" y="12" width="3" height="1"/><rect x="2" y="13" width="4" height="1"/><rect x="3" y="14" width="3" height="1"/><rect x="12" y="13" width="2" height="1"/><rect x="12" y="14" width="1" height="1"/></g><g fill="#6A8A48"><rect x="5" y="12" width="1" height="1"/><rect x="6" y="13" width="1" height="1"/><rect x="6" y="14" width="1" height="1"/><rect x="14" y="13" width="1" height="1"/><rect x="13" y="14" width="1" height="1"/></g></svg>`,

  PEARL: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" shape-rendering="crispEdges"><g fill="#7E8A96"><rect x="6" y="1" width="1" height="1"/><rect x="7" y="1" width="1" height="1"/><rect x="8" y="1" width="1" height="1"/><rect x="9" y="1" width="1" height="1"/><rect x="4" y="2" width="1" height="1"/><rect x="5" y="2" width="1" height="1"/><rect x="10" y="2" width="1" height="1"/><rect x="11" y="2" width="1" height="1"/><rect x="3" y="3" width="1" height="1"/><rect x="12" y="3" width="1" height="1"/><rect x="3" y="4" width="1" height="1"/><rect x="12" y="4" width="1" height="1"/><rect x="2" y="5" width="1" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="2" y="6" width="1" height="1"/><rect x="13" y="6" width="1" height="1"/><rect x="2" y="7" width="1" height="1"/><rect x="13" y="7" width="1" height="1"/><rect x="2" y="8" width="1" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="3" y="9" width="1" height="1"/><rect x="12" y="9" width="1" height="1"/><rect x="3" y="10" width="1" height="1"/><rect x="12" y="10" width="1" height="1"/><rect x="4" y="11" width="1" height="1"/><rect x="5" y="11" width="1" height="1"/><rect x="10" y="11" width="1" height="1"/><rect x="11" y="11" width="1" height="1"/><rect x="6" y="12" width="1" height="1"/><rect x="7" y="12" width="1" height="1"/><rect x="8" y="12" width="1" height="1"/><rect x="9" y="12" width="1" height="1"/></g><g fill="#FFFFFF"><rect x="4" y="3" width="1" height="1"/><rect x="5" y="3" width="1" height="1"/><rect x="6" y="3" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="5" y="4" width="1" height="1"/><rect x="3" y="5" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/></g><g fill="#E8ECF2"><rect x="6" y="2" width="1" height="1"/><rect x="7" y="2" width="1" height="1"/><rect x="8" y="2" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="7" y="3" width="1" height="1"/><rect x="8" y="3" width="1" height="1"/><rect x="9" y="3" width="1" height="1"/><rect x="10" y="3" width="1" height="1"/><rect x="11" y="3" width="1" height="1"/><rect x="6" y="4" width="1" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="8" y="4" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="11" y="4" width="1" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="7" y="5" width="1" height="1"/><rect x="8" y="5" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="11" y="5" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="3" y="6" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="5" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="7" y="6" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="9" y="6" width="1" height="1"/><rect x="3" y="7" width="1" height="1"/><rect x="4" y="7" width="1" height="1"/><rect x="5" y="7" width="1" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="3" y="8" width="1" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/><rect x="6" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/></g><g fill="#C8D4E4"><rect x="10" y="6" width="1" height="1"/><rect x="11" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="10" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="12" y="8" width="1" height="1"/></g><g fill="#B8C4D0"><rect x="4" y="9" width="1" height="1"/><rect x="5" y="9" width="1" height="1"/><rect x="6" y="9" width="1" height="1"/><rect x="7" y="9" width="1" height="1"/><rect x="8" y="9" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="10" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="5" y="10" width="1" height="1"/><rect x="6" y="10" width="1" height="1"/><rect x="7" y="10" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="9" y="10" width="1" height="1"/><rect x="10" y="10" width="1" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="6" y="11" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="8" y="11" width="1" height="1"/><rect x="9" y="11" width="1" height="1"/></g></svg>`,
};


// ── Velocitats (slider 1-6 → delays ms) ──

const SPEED_DELAYS = [2000, 800, 350, 150, 60, 10];


// ── Accions internes (mapejades 1:1 amb tokens de cada idioma) ──

const CMD_ACTIONS  = ['move','turn-right','turn-left','turn-around','grab','drop'];
const COND_ACTIONS = ['rock-ahead','path-clear','pearl-here','bag-empty','bag-full'];


// ── LocalStorage keys ──

const LS_KEY_CODE  = 'karel-code-v3';
const LS_KEY_THEME = 'karel-theme';
const LS_ONBOARD   = 'karel-onboard-done';


// ── Mapa i codi per defecte ──

const DEFAULT_CSV =
`K>,.,.,.,A,.
.,.,.,P,.,.
.,.,.,.,.,.
.,P,.,.,.,.
.,.,.,.,A,.`;

const DEFAULT_CODE = `// Welcome to Karel!
// Press Run to see Karel move

move
move
`;


// ── Exporta al namespace ──

K.DIRS          = DIRS;
K.KAREL_ASSETS  = KAREL_ASSETS;
K.SPEED_DELAYS  = SPEED_DELAYS;
K.CMD_ACTIONS   = CMD_ACTIONS;
K.COND_ACTIONS  = COND_ACTIONS;
K.LS_KEY_CODE   = LS_KEY_CODE;
K.LS_KEY_THEME  = LS_KEY_THEME;
K.LS_ONBOARD    = LS_ONBOARD;
K.DEFAULT_CSV   = DEFAULT_CSV;
K.DEFAULT_CODE  = DEFAULT_CODE;
K.sanitizeHtml  = sanitizeHtml;
K.escHtml       = escHtml;
