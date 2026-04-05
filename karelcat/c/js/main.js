// ════════════════════════════════════════════════════════
// main.js — Inicialització: connecta els mòduls del motor
// ════════════════════════════════════════════════════════

(function init() {
  const S = K.state;

  // 0) Aplica el tema guardat (fosc per defecte, clar si l'usuari ho va triar)
  K.initTheme();

  // 1) Aplica el llenguatge de programació
  K.applyCodeLang(S.codeLang);

  // 2) Inicialitza la UI mínima
  K.initSpeedSlider();

  // 3) Carrega el mapa per defecte
  K.loadMapFromCSV(K.DEFAULT_CSV);

  // 4) Inicialitza l'editor de codi
  K.initEditor();
  const ta = document.getElementById('code-editor');
  if (ta) {
    const saved = localStorage.getItem(K.LS_KEY_CODE);
    ta.value = saved || K.DEFAULT_CODE;
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
})();
