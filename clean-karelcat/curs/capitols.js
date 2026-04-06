// ════════════════════════════════════════════════════════
// curs/capitols.js — Dades dels capítols i helpers de UI del curs
//
// Depèn de: cap (és pur JS sense K.* ni cap altra dependència)
//
// Funcions exportades al window global:
//   renderSidebar(currentNum)  — omple #sidebar-nav amb la llista de capítols
//   renderSimuladors()         — converteix .simulador divs en iframes funcionals (B.4)
//   initSidebarToggle()        — hamburger per a mòbil (B.2)
//   toggleCursTheme()          — sincronitza el tema clar/fosc amb el simulador
// ════════════════════════════════════════════════════════


// ── Dades dels 10 capítols del curs ──────────────────────

const CAPITOLS_DATA = [
  { num: 1,  titol: 'Coneix en Karel',           subtitol: 'move · turn_left · turn_right',         arxiu: 'capitol-1.html'  },
  { num: 2,  titol: 'Agafa i deixa',             subtitol: 'grab · drop · pearl_here',              arxiu: 'capitol-2.html'  },
  { num: 3,  titol: 'Repeteix',                  subtitol: 'repeat(N) { ... }',                     arxiu: 'capitol-3.html'  },
  { num: 4,  titol: 'Procediments',              subtitol: 'proc nom { ... }',                      arxiu: 'capitol-4.html'  },
  { num: 5,  titol: 'Descomposició',             subtitol: 'Mètode top-down',                       arxiu: 'capitol-5.html'  },
  { num: 6,  titol: 'Si',                        subtitol: 'if(cond) { ... } / else { ... }',       arxiu: 'capitol-6.html'  },
  { num: 7,  titol: 'Mentre',                    subtitol: 'while(cond) { ... }',                   arxiu: 'capitol-7.html'  },
  { num: 8,  titol: 'Combinant condicions',      subtitol: 'not(...) · and · or',                   arxiu: 'capitol-8.html'  },
  { num: 9,  titol: 'Pensar com un programador', subtitol: '// comentaris · noms clars · codi net', arxiu: 'capitol-9.html'  },
  { num: 10, titol: 'Reptes',                    subtitol: 'Col·lecció d\'exercicis',               arxiu: 'capitol-10.html' },
];


// ── B.2 — Genera i munta la barra lateral ────────────────

function renderSidebar(currentNum) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  let html = '<ul class="sidebar-list">';
  for (const c of CAPITOLS_DATA) {
    const isActive = c.num === currentNum;
    html += `
      <li class="sidebar-item${isActive ? ' active' : ''}">
        <a href="${c.arxiu}" class="sidebar-link">
          <span class="sidebar-num">${String(c.num).padStart(2, '0')}</span>
          <span class="sidebar-info">
            <span class="sidebar-titol">${c.titol}</span>
            <span class="sidebar-sub">${c.subtitol}</span>
          </span>
        </a>
      </li>`;
  }
  html += '</ul>';
  nav.innerHTML = html;
}


// ── B.4 — Converteix .simulador divs en iframes funcionals ──
//
// Atributs reconeguts al div.simulador:
//   data-map      (string) CSV del mapa (raw, sense escapar)
//   data-code     (string) Codi Karel inicial
//   data-readonly (string) "true" → textarea en mode lectura
//   data-height   (number) alçada en px (per defecte: 340)
//   data-title    (string) text de llegenda sota el simulador (opcional)
//
// Exemple d'ús en una pàgina de capítol:
//   <div class="simulador"
//        data-map="K>,.,.,.,.,.\n.,.,.,.,.,."
//        data-code="move\nmove\n"
//        data-height="340">
//   </div>

function renderSimuladors() {
  const divs = document.querySelectorAll('.simulador');
  divs.forEach(div => {
    const rawMap   = div.dataset.map   || '';
    const rawCode  = div.dataset.code  || '';
    const height   = parseInt(div.dataset.height || '340', 10);
    const readonly = div.dataset.readonly === 'true';
    const title    = div.dataset.title || '';
    const label    = div.dataset.label || '';   // 'Exemple' | 'Exercici' | ''

    // Substitueix \n literals (de l'atribut HTML) per salts de línia reals
    const map  = rawMap.replace(/\\n/g, '\n');
    const code = rawCode.replace(/\\n/g, '\n');

    // Codifica a base64 per transportar CSV (comes, salts de línia) sense problemes
    const encMap  = btoa(unescape(encodeURIComponent(map)));
    const encCode = btoa(unescape(encodeURIComponent(code)));
    const roParam = readonly ? '&readonly=1' : '';

    // Respecta el tema actual de la pàgina
    const theme   = document.body.classList.contains('curs-light') ? '&theme=light' : '';

    const iframe = document.createElement('iframe');
    iframe.src        = `../index.html?embed=1&map=${encMap}&code=${encCode}${roParam}${theme}`;
    iframe.className  = 'simulador-frame';
    iframe.style.height = height + 'px';
    iframe.title      = title || 'Simulador Karel';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allowfullscreen', '');

    // Contenidor amb llegenda opcional
    const wrap = document.createElement('div');
    wrap.className = 'simulador-wrap';
    if (label) {
      const badge = document.createElement('span');
      badge.className = `simulador-badge simulador-badge--${label.toLowerCase()}`;
      badge.textContent = label;
      wrap.appendChild(badge);
    }
    wrap.appendChild(iframe);
    if (title) {
      const cap = document.createElement('p');
      cap.className = 'simulador-caption';
      cap.textContent = title;
      wrap.appendChild(cap);
    }

    div.replaceWith(wrap);
  });
}


// ── B.2 — Sidebar toggle (hamburger per a mòbil) ─────────

function initSidebarToggle() {
  const toggle  = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar) return;

  const open = () => {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? close() : open();
  });

  if (overlay) overlay.addEventListener('click', close);

  // Tanca en navegar (mòbil)
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 820) close();
  }));
}


// ── Sincronització del tema clar/fosc ─────────────────────
// Les pàgines del curs llegeixen el mateix localStorage que el simulador.

(function applyCursTheme() {
  if (localStorage.getItem('karel-theme') === 'light') {
    document.body.classList.add('curs-light');
  }
})();

function toggleCursTheme() {
  const isLight = document.body.classList.toggle('curs-light');
  localStorage.setItem('karel-theme', isLight ? 'light' : 'dark');
  // Actualitza la icona del botó
  const btn = document.getElementById('btn-curs-theme');
  if (btn) btn.textContent = isLight ? '🌙' : '☀️';
}

window.toggleCursTheme = toggleCursTheme;
