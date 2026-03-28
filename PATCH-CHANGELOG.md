# PATCH DEFINITIU — Step Quiz
# Aplica amb copy-paste a l'arrel del projecte (mateixa estructura de carpetes)
# Inclou els 6 patches pendents anteriors + els 6 moderats

## Fitxers modificats (9):

### js/fixed-sessions.js
- **[FIX C2]** Afegit `beforeunload` listener per restaurar `Math.random`
  si l'alumne surt abans de la pantalla final.
- Eliminat codi mort del `setInterval(_waitForGameCore)`.

### js/game-core.js
- **[FIX A3]** `finalitzar()` demana confirmació amb `confirm()`.
- **[FIX C3]** `initCustomKeyboard()` pre-estableix `inputmode="none"` en
  tàctils. `hideCustomKeyboard()` conserva l'atribut en tàctils.
- **[FIX M7]** `endSession()` mostra "Preparant sessió següent…" durant 1s.

### css/shared.css
- **[FIX A4]** `min-height: 100dvh` al body (cobreix els 24 jocs integrats).
- **[FIX M2]** `touch-action: manipulation` global a tots els elements
  interactius. Prevé double-tap-to-zoom sense bloquejar pinch-to-zoom
  (respecta WCAG 1.4.4, no cal maximum-scale a cada HTML).
- **[FIX M4]** `.panel` canviat de `overflow: hidden` a
  `overflow-x: hidden; overflow-y: auto`. El border-radius segueix
  funcionant, i el contingut dinàmic (teclat, historial, fallback) ja
  no queda tallat.
- **[FIX M5]** Landscape split-layout llindar augmentat de 500px a 600px
  per cobrir mòbils moderns (500-600px d'alçada en landscape).

### css/chromebook.css
- **[FIX M5]** Eliminats tots els `!important` del bloc landscape Chromebook.
  Substituïts per doble selector (`.panel.panel`, `#customKeyboard.kb-visible`)
  per guanyar especificitat sense forçar.

### js/recta-numerica/recta-numerica.js
- **[FIX m3]** `recordResult()` canviat a fórmula estàndard
  `Math.min(MAX_INTENTS - attemptsLeft + 1, 3)`.

### js/vocabulari/vocabulari.js
- **[FIX M1]** `_isTouchDevice()` canviat de feature detection
  (`ontouchstart`/`maxTouchPoints`) a media query
  (`any-pointer: coarse`), coherent amb `game-core.js`.

### fraccions.html
- **[FIX M3]** Afegit handler de tecla Tab al `keydown` listener.
  Tab/Shift+Tab salten al següent/anterior input visible dins del pas
  actiu. Funciona tant amb teclat físic com amb teclat custom.

### js/sistemes-equacions/sistemes-equacions.js
- **[FIX M3]** Afegit handler de tecla Tab al `keydown` listener.
  Tab/Shift+Tab salten entre inputs del `stepSchema` actiu.

### sistemes-equacions.html
- **[FIX m7]** CDN de KaTeX canviat de `cdnjs.cloudflare.com` a
  `cdn.jsdelivr.net`, coherent amb derivades, integrals, probabilitat
  i la resta de fitxers que usen KaTeX.

## Resum de bugs resolts en aquest patch:

| ID  | Gravetat | Descripció |
|-----|----------|------------|
| C2  | Crític   | Math.random no es restaurava si l'alumne sortia |
| C3  | Crític   | Flash teclat natiu en tàctils |
| A3  | Alt      | "Tornar a jugar" sense confirmació |
| A4  | Alt      | 100vh sense 100dvh a shared.css |
| M1  | Moderat  | Detecció tàctil inconsistent vocabulari vs game-core |
| M2  | Moderat  | Zoom tàctil per double-tap |
| M3  | Moderat  | Tab handling absent en fraccions i sistemes |
| M4  | Moderat  | .panel overflow:hidden tallava contingut dinàmic |
| M5  | Moderat  | Landscape split llindar 500px + !important chromebook |
| M7  | Moderat  | Botó sessió invisible 1s sense feedback |
| m3  | Menor    | recordResult simplificat a recta-numèrica |
| m7  | Menor    | KaTeX CDN diferent a sistemes-equacions |
