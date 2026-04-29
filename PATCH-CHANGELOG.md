# PATCH SEGÜENT — Auditoria cross-device (29 abril 2026, 2a part)

## Bugs corregits:

### [M9] Aplicació de [M8] a fitxers que se'n havien escapat
La correcció [M8] només es va aplicar a `js/game-core.js` i `js/vocabulari/vocabulari.js`.
Una auditoria posterior va revelar que `complexos.html` i `ruffini.html` definien
**inline** la seva pròpia funció `isTouchDevice()` amb el patró antic
`(any-pointer: coarse)`, així que continuaven trencant-se en portàtils tàctils.

### [m11] iOS zoom forçat en inputs amb font-size < 16px
iOS Safari fa zoom automàtic en obtenir focus a un `<input>` amb `font-size < 16px`,
descentrant la pàgina. Tres inputs el patien:
- `radicals.html` línia 172 (@media 480px): `0.8em` ≈ 12.8px
- `radicals.html` línia 184 (@media 350px): `0.75em` ≈ 12px
- `css/estadistica.css` línia 354 (@media 600px): `0.9em` ≈ 14.4px

### [m12] `factoritzar.html` bloquejava el zoom de l'usuari (WCAG)
El meta viewport tenia `maximum-scale=1.0, user-scalable=no`, cosa que viola
WCAG 2.1 SC 1.4.4 (Resize Text) i impedeix als usuaris amb baixa visió
ampliar el contingut a Android. iOS Safari ja l'ignorava per accessibilitat.

## Fitxers modificats (5):

### complexos.html (línia 369) — [M9]
- `isTouchDevice()`: `(any-pointer: coarse)` →
  `(pointer: coarse) and (hover: none)`

### ruffini.html (línia 934) — [M9]
- `isTouchDevice()`: `(any-pointer: coarse)` →
  `(pointer: coarse) and (hover: none)`

### radicals.html (línies 172 i 184) — [m11]
- `.schema-input` font-size de `0.8em`/`0.75em` → `16px` (forçat al límit
  iOS-safe). Les dimensions width/height es mantenen iguals.

### css/estadistica.css (línia 354) — [m11]
- `.cell-input` font-size de `0.9em` → `16px`. Dimensions iguals.

### factoritzar.html (línia 5) — [m12]
- Meta viewport: eliminat `maximum-scale=1.0, user-scalable=no`.

## Comportament resultant:
- Portàtils tàctils a `complexos.html` i `ruffini.html`: ja no activen mode
  tàctil quan l'usuari fa servir ratolí/trackpad ✅
- iPhones / iPads a `radicals.html` i el joc d'estadística: ja no fan zoom
  forçat en tocar un input ✅
- Android a `factoritzar.html`: l'usuari pot fer pinch-to-zoom per llegir
  millor el contingut ✅

## Notes pendents (Onada 3, no aplicades en aquest patch):
- `area-perimetre-tutorial.html`: `height: 100vh` sense `100dvh` fallback
  pot tallar contingut en iPad portrait.
- `area-perimetre.html`, `PAU/index.html`: `min-height: 100vh` sense `dvh`
  fallback (no bloquejant).
- `setup_vocabulari.html`: `clipboard.writeText` sense `.catch()` ni fallback.

---

# PATCH ANTERIOR — Fix detecció dispositius tàctils (29 abril 2026)

## Bug corregit:
- **[M8]** `isTouchDevice()` detectava com a "mòbil" qualsevol ordinador amb
  pantalla tàctil disponible, encara que l'usuari estigués utilitzant ratolí o
  trackpad. Això activava el teclat numèric custom i les regles CSS pensades
  per Chromebooks en portàtils Windows/Linux/Mac amb touchscreen, trencant
  el layout del panell del joc (l'equació deixava de veure's correctament).

## Causa tècnica:
- `(any-pointer: coarse)` retorna `true` si **qualsevol** pointing device
  del sistema és coarse, encara que sigui una pantalla tàctil que l'usuari
  no està fent servir.
- Substituït per `(pointer: coarse)` (només el dispositiu principal) i,
  a JavaScript, combinat amb `(hover: none)` per descartar amb seguretat
  els portàtils tàctils on també hi ha un ratolí amb hover.

## Fitxers modificats (4):

### js/game-core.js (línia 280)
- `isTouchDevice()`: `(any-pointer: coarse)` →
  `(pointer: coarse) and (hover: none)`

### css/chromebook.css (5 ocurrències: línies 12, 210, 228, 246, 259)
- Totes les `(any-pointer: coarse)` → `(pointer: coarse)`

### css/shared.css (línia 302)
- Media query tauletes portrait (601-819px):
  `(any-pointer: coarse)` → `(pointer: coarse)`

### js/vocabulari/vocabulari.js (línies 103 i 569)
- `_isTouchDevice()` re-unificada amb game-core.js (supersedeix part de [M1])
- `_isMobilePortrait()`: check Chromebook actualitzat a `(pointer: coarse)`
- Comentari `[FIX M1]` actualitzat per reflectir la nova lògica

## Comportament resultant:
- Portàtils amb pantalla tàctil + ratolí: NO activen mode tàctil ✅
- Mòbils i tauletes: ACTIVEN mode tàctil ✅
- Chromebooks autèntics en mode tablet: ACTIVEN mode tàctil ✅

---

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

## Resum complet: 26 de 28 bugs resolts

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
| M8  | Moderat   | ✅ Resolt (29-04-2026) |
| M9  | Crític    | ✅ Resolt (29-04-2026, audit) |
| m11 | Alt       | ✅ Resolt (29-04-2026, audit) |
| m12 | Alt       | ✅ Resolt (29-04-2026, audit) |
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
