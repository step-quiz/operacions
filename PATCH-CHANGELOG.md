# PATCH CHANGELOG — Step Quiz
# Aplica amb copy-paste a l'arrel del projecte (mateixa estructura de carpetes)

## Fitxers modificats (7):

### area-perimetre.html
- **[FIX A1]** Migrat completament a game-core.js v2. Canvis:
  - Afegit APP_CONFIG + càrrega de fixed-sessions.js, utils.js, config.js,
    game-core.js i css/shared.css
  - Eliminades ~500 línies de codi duplicat (utils, config, estat, sessions,
    teclat, injectSharedHTML, copiarResultats v1)
  - Afegit `recordResult()` a `finishOperation()` — ara l'analitzador mostra
    el desglossament per pregunta (format v2, 30 caràcters)
  - `copiarResultats()` ara genera codi v2 (9 segments) en lloc de v1 (5 segments)
  - Sessions fixes (`?fixed=A/B/C`) ara funcionen correctament
  - Afegida icona home al títol (coherent amb la resta de jocs)
  - Overrides de showCustomKeyboard/hideCustomKeyboard per protegir inputs
    bloquejats (verd) i salt intel·ligent àrea↔perímetre

### css/shared.css
- **[FIX A4]** Afegit `min-height: 100dvh` al body (amb 100vh com fallback).
  Corregeix botons inaccessibles en Safari/Chrome mòbil per a tots els 24 jocs
  que carreguen shared.css.

### js/fixed-sessions.js
- **[FIX C2]** Afegit `beforeunload` listener com a safety net per restaurar
  `Math.random` original si l'alumne surt abans de la pantalla final.
- **Eliminat codi mort:** `setInterval(_waitForGameCore)` que feia polling
  innecessari i no feia res útil.

### js/game-core.js
- **[FIX A3]** `finalitzar()` ara demana confirmació amb `confirm()` abans de
  fer `reload()`. Prevé pèrdua accidental del codi de resultats.
- **[FIX M7]** `endSession()` mostra un text temporal "Preparant sessió
  següent…" durant el segon d'espera del botó, en lloc de deixar la pantalla
  buida.
- **[FIX C3]** `initCustomKeyboard()` ara pre-estableix `inputmode="none"` a
  tots els inputs del #game-screen en dispositius tàctils, evitant el flash del
  teclat natiu al primer tap. `hideCustomKeyboard()` ara conserva l'atribut
  en dispositius tàctils per evitar flashes posteriors.

### enters.html
- **[FIX m1]** `getTerm()` multiplicació: primer operand canviat de
  `randInt(-8,8)` a `randIntNonZero(-8,8)` per evitar operacions trivials
  com 0·0 o 0·N.

### js/recta-numerica/recta-numerica.js
- **[FIX m3]** `recordResult()` canviat de `attemptsLeft === MAX_INTENTS ? 1 : 2`
  a `Math.min(MAX_INTENTS - attemptsLeft + 1, 3)` per registrar correctament
  el 3r intent o posterior (codi 3), en lloc de col·lapsar-lo amb el 2n.

### index.html
- **[FIX A2]** Breakpoint `@media (max-height: ...)` augmentat de 600px a 850px
  per permetre scroll en tauletes landscape i Chromebooks on el contingut
  quedava tallat per `overflow: hidden`.

## Bugs NO corregits en aquest patch (requereixen més treball):

- **M2** (zoom tàctil): Afegir maximum-scale=1.0 a 49 fitxers és mecànic però
  extensiu; a més, pot afectar accessibilitat (WCAG 1.4.4).
- **M3** (Tab handling): Requereix implementació específica per a cada joc
  multi-input (fraccions, sistemes, inversa-matriu, etc.).
- **M1, M4, M5, M6**: Requereixen refactoritzacions CSS més àmplies.
