// ════════════════════════════════════════════════════════
// main.js — Inicialització: connecta els mòduls del motor
// ════════════════════════════════════════════════════════

// ── Lectura de paràmetres d'URL (B.4 i B.5) ──────────────
// Suportat:
//   ?embed=1       → amaga topbar (body.embed, ja aplicat inline al HTML)
//   ?map=BASE64    → mapa inicial (base64 de CSV)
//   ?code=BASE64   → codi inicial (base64 de text)
//   ?readonly=1    → textarea en mode lectura (exemples no editables)
//   ?repte=N       → carrega el repte N de K.REPTES (B.5)
//   ?theme=light   → força mode clar (ja aplicat inline)

(function init() {
  const S      = K.state;
  const params = new URLSearchParams(location.search);

  // ── Descodifica un paràmetre base64 → string UTF-8 ──
  function decodeParam(b64) {
    try { return decodeURIComponent(escape(atob(b64))); } catch { return null; }
  }

  // ── Determina el mapa i el codi inicials ──
  let initMap        = K.DEFAULT_CSV;
  let initCode       = K.DEFAULT_CODE;
  let useLocalStorage = true;   // false quan el contingut ve de la URL (no guardarem a LS)
  let enunciatRepte  = null;    // text a mostrar al log per als reptes

  const repteId = params.get('repte') ? parseInt(params.get('repte'), 10) : null;
  const urlMap  = params.get('map')   ? decodeParam(params.get('map'))    : null;
  const urlCode = params.get('code')  ? decodeParam(params.get('code'))   : null;

  if (repteId && K.REPTES && K.REPTES[repteId]) {
    // B.5 — Deep link ?repte=N
    const r     = K.REPTES[repteId];
    initMap     = r.map;
    initCode    = r.code;
    enunciatRepte = r.enunciat;
    useLocalStorage = false;
  } else if (urlMap || urlCode) {
    // B.4 — Simulador incrustat amb mapa/codi des de la URL
    if (urlMap)  initMap  = urlMap;
    if (urlCode) initCode = urlCode;
    useLocalStorage = false;
  }

  // 0) Aplica el tema guardat (fosc per defecte, clar si l'usuari ho va triar)
  //    (si ?theme=light ja estava aplicat inline; initTheme el sincronitza)
  K.initTheme();

  // 1) Aplica el llenguatge de programació
  K.applyCodeLang(S.codeLang);

  // 2) Inicialitza la UI mínima
  K.initSpeedSlider();

  // 3) Carrega el mapa
  K.loadMapFromCSV(initMap);

  // 4) Inicialitza l'editor de codi
  K.initEditor();
  const ta = document.getElementById('code-editor');
  if (ta) {
    const saved = (useLocalStorage && !params.get('embed'))
                  ? localStorage.getItem(K.LS_KEY_CODE)
                  : null;
    ta.value = saved || initCode;

    // Mode lectura (?readonly=1): l'alumne veu el codi però no el pot editar
    if (params.get('readonly') === '1') {
      ta.setAttribute('readonly', 'readonly');
      ta.style.cursor = 'default';
    }

    K.updateEditor();
    setTimeout(() => K.updateEditor(), 50);
  }

  // 5) Auto-escala del grid en redimensionar
  const worldArea = document.getElementById('world-area');
  if (worldArea) {
    let rafId = null;
    new ResizeObserver(() => {
      if (S.world.rows <= 0) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => { rafId = null; K.renderWorld(); });
    }).observe(worldArea);
  }

  // 6) Pinta les etiquetes de la UI
  K.updateUI();

  // 7) Mostra l'enunciat del repte al log (B.5)
  if (enunciatRepte) {
    setTimeout(() => K.log(enunciatRepte, 'inf'), 100);
  }
})();

