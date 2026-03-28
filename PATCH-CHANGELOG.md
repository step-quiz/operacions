# PATCH FINAL DEFINITIU — Step Quiz
# Descomprimeix a l'arrel d'operacions-main i sobreescriu.
# Inclou TOTS els fixes pendents (7) + els 8 de detall.

## Fitxers modificats (9):

### js/fixed-sessions.js
- **[C2]** beforeunload restaura Math.random si l'alumne surt abans del final
- Eliminat codi mort (setInterval _waitForGameCore)

### js/game-core.js
- **[A3]** finalitzar() demana confirm() abans de reload
- **[C3]** initCustomKeyboard() pre-estableix inputmode="none" en tàctils;
  hideCustomKeyboard() el conserva en tàctils
- **[M7]** endSession() mostra "Preparant sessió següent…" durant 1s
- **[m2]** parseInt amb radix 10 a currentDifficulty
- **[m8]** showHistorySummary reescrit amb classes CSS de shared.css
  (history-summary, history-item--ok/bad, etc.) en lloc d'estils inline
- **[m9]** Botó "Copiar codi" a l'historial unificat (crida copiarResultats
  que ja gestiona el feedback visual internament)

### css/shared.css
- **[A4]** min-height: 100dvh al body (cobreix 24 jocs)
- **[M2]** touch-action:manipulation global a button, input, select, etc.
  Prevé double-tap-to-zoom sense bloquejar pinch-to-zoom
- **[M4]** .panel canviat a overflow-x:hidden + overflow-y:auto
- **[M5]** Landscape split-layout llindar 500→600px
- **[M6]** Nou breakpoint per tauletes portrait (601-819px + coarse):
  touch targets ampliats (kb-btn 54px, btn-submit 46px, inputs 44px)

### css/chromebook.css
- **[M5]** Eliminats tots els !important del bloc landscape Chromebook.
  Substituïts per .panel.panel i #customKeyboard.kb-visible

### css/vocabulari.css
- **[m6]** Afegit overflow-y:auto al body en landscape petit (max-height:500px)

### js/recta-numerica/recta-numerica.js
- **[m3]** recordResult amb Math.min(MAX_INTENTS - attemptsLeft + 1, 3)

### js/vocabulari/vocabulari.js
- **[M1]** _isTouchDevice() canviat a matchMedia('(any-pointer: coarse)')

### js/sistemes-equacions/sistemes-equacions.js
- **[M3]** Tab/Shift+Tab navega entre inputs del stepSchema actiu

### index.html
- **[m5]** z-index del footer i icones baixat de 9999/10000 a 100/101

## Bugs NO inclosos (acció manual):
- **[m4]** Esborra manualment /game-core.js i /shared.css de l'arrel
  del projecte (són còpies errònies, cap HTML els referencia)
- **[m10]** Redundància tutorials: requereix refactorització arquitectural

## Resum complet: 22 de 24 bugs resolts

| ID  | Gravetat  | Estat |
|-----|-----------|-------|
| C1  | —         | Eliminat (Batxillerat, no cal codi) |
| C2  | Crític    | ✅ Resolt |
| C3  | Crític    | ✅ Resolt |
| A1  | Alt       | ✅ Resolt (patch anterior) |
| A2  | Alt       | ✅ Resolt (patch anterior) |
| A3  | Alt       | ✅ Resolt |
| A4  | Alt       | ✅ Resolt |
| M1  | Moderat   | ✅ Resolt |
| M2  | Moderat   | ✅ Resolt |
| M3  | Moderat   | ✅ Resolt (fraccions patch anterior + sistemes aquí) |
| M4  | Moderat   | ✅ Resolt |
| M5  | Moderat   | ✅ Resolt |
| M6  | Detall    | ✅ Resolt |
| M7  | Moderat   | ✅ Resolt |
| m1  | Detall    | ✅ Resolt (patch anterior) |
| m2  | Detall    | ✅ Resolt |
| m3  | Detall    | ✅ Resolt |
| m4  | Detall    | ⚠️ Manual (esborra 2 fitxers arrel) |
| m5  | Detall    | ✅ Resolt |
| m6  | Detall    | ✅ Resolt |
| m7  | Detall    | ✅ Resolt (patch anterior) |
| m8  | Detall    | ✅ Resolt |
| m9  | Detall    | ✅ Resolt |
| m10 | Detall    | ⚠️ Arquitectural (tutorials) |
