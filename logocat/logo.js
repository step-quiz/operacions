// ════════════════════════════════════════════════════════
// logo.js — LOGOcat (multiidioma: CAT / CAST / ENG)
// ════════════════════════════════════════════════════════


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 0. UTILITATS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const _SAFE_TAGS = new Set(['em','strong','code','br','span','b','i','u']);
const _SAFE_ATTRS = new Set(['class','title']);

function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode('');
    const tag = node.tagName.toLowerCase();
    if (!_SAFE_TAGS.has(tag)) { const f = document.createDocumentFragment(); for (const c of node.childNodes) f.appendChild(walk(c)); return f; }
    const el = document.createElement(tag);
    for (const a of node.attributes) if (_SAFE_ATTRS.has(a.name.toLowerCase())) el.setAttribute(a.name, a.value);
    for (const c of node.childNodes) el.appendChild(walk(c));
    return el;
  }
  const frag = document.createDocumentFragment();
  for (const c of doc.body.childNodes) frag.appendChild(walk(c));
  const tmp = document.createElement('div'); tmp.appendChild(frag);
  return tmp.innerHTML;
}
function escHtml(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. I18N
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const I18N = {
  /* ── CATALÀ ── */
  ca: {
    ui: {
      challenges: '🎯 Reptes', challenges_title: '🎯 Reptes — tria un exercici',
      toggle_theme: 'Fosc / Clar', run: '▶ Executa', step: '⏭ Pas', stop: '■ Para',
      reset: '↺ Reinicia', clear_log: '⌫ Log', speed: 'Velocitat:', close: 'Tanca',
      lbl_codelang: 'Codi:', lbl_userlang: 'Idioma:',
      level_easy: '⭐ Fàcil', level_medium: '⭐⭐ Mitjà', level_hard: '⭐⭐⭐ Difícil',
      ref_btn: '📋 Ref', ref_cmd: 'Moviment', ref_struct: 'Estructures',
      success_title: 'Repte superat!', success_msg: 'Excel·lent! Has resolt l\'exercici correctament.',
      success_more: '🎯 Més reptes', success_close: 'Continua',
      category_basic: '🐢 Reptes bàsics', category_advanced: '🌟 Reptes avançats',
      goal_btn: '🎯 Objectiu', goal_title: '🎯 Objectiu del repte', goal_desc: 'Dibuix objectiu:',
      hint_btn: '💡 Pista', hint_locked: '🔒 Pista ({time})',
      onboard_next: 'Següent →', onboard_prev: '← Enrere', onboard_start: 'Comencem! 🚀', onboard_skip: 'Salta',
      pos: 'Pos:', heading: 'Dir:', pen: 'Llapis:', pen_down: 'baix ✏️', pen_up: 'amunt ✗',
    },
    state: { idle: 'aturat', running: 'executant', step: 'pas a pas', error: 'error' },
    speed: ['Molt lent','Lent','Normal','Ràpid','Molt ràpid','Instant'],
    log: {
      running: '▶ Executant...', step_mode: '⏭ Mode pas a pas',
      done: '✓ Programa acabat', reset: '↺ Reiniciat', cleared: '⌫ Netejat',
      challenge: '🎯 Repte', error: '✗ Error',
      err_parse: 'Error de sintaxi', err_unknown_cmd: 'Ordre desconeguda',
      err_expect_num: 'S\'esperava un número', err_expect_brace: 'Falta \'{\' o \'}\'',
      err_max_steps: '⚠ Massa passos! Bucle infinit?', err_deep: '⚠ Massa profunditat!',
      err_unknown_proc: 'Procediment desconegut',
    },
    commands: ['avança','retrocedeix','gira.dreta','gira.esquerra','posa.llapis','treu.llapis','centre','neteja'],
    keywords: ['repeteix','procediment'],
    challenges: [
      { id:1, category:'basic', title:'Primera línia', level:'easy',
        desc:"Fes que la tortuga avanci <em>100 passes</em> endavant. Veuràs com dibuixa una línia recta!",
        code:'// Fes avançar la tortuga 100 passes\n\n',
        goal:'forward 100',
        hints:['L\'ordre avança fa moure la tortuga endavant. Escriu: avança(100)','Solució: avança(100) — la tortuga avança 100 passes i dibuixa una línia.'] },
      { id:2, category:'basic', title:'El quadrat', level:'easy',
        desc:"Dibuixa un quadrat de 100x100. Usa <em>repeteix</em> per no escriure 4 vegades el mateix!",
        code:'// Dibuixa un quadrat\n// Pista: repeteix(4) { avança(100) gira.dreta(90) }\n\n',
        goal:'repeat(4){forward 100 right 90}',
        hints:['Un quadrat té 4 costats iguals i 4 girs de 90°. Usa repeteix(4) per repetir el patró.','Solució: repeteix(4) { avança(100) gira.dreta(90) }'] },
      { id:3, category:'basic', title:'El triangle', level:'easy',
        desc:"Dibuixa un triangle equilàter. Quants graus ha de girar la tortuga a cada cantonada?",
        code:'// Dibuixa un triangle equilàter\n// Pista: la suma dels girs exteriors és 360°\n\n',
        goal:'repeat(3){forward 100 right 120}',
        hints:['Un triangle equilàter té 3 costats. La suma dels girs exteriors sempre és 360°, així que cada gir és 360÷3 = 120°.','Solució: repeteix(3) { avança(100) gira.dreta(120) }'] },
      { id:4, category:'basic', title:'L\'estrella', level:'medium',
        desc:"Dibuixa una estrella de 5 puntes. El secret és girar <em>144 graus</em> a cada punta!",
        code:'// Dibuixa una estrella de 5 puntes\n\n',
        goal:'repeat(5){forward 100 right 144}',
        hints:['Una estrella de 5 puntes es fa amb 5 costats i girs de 144°. Per què 144? Perquè la tortuga fa 2 voltes completes: 720÷5 = 144.','Solució: repeteix(5) { avança(100) gira.dreta(144) }'] },
      { id:5, category:'basic', title:'L\'escala', level:'medium',
        desc:"Dibuixa una escala de 4 graons. Cada graó és: avança, gira dreta, avança, gira esquerra.",
        code:'// Dibuixa una escala de 4 graons\n\n',
        goal:'repeat(4){forward 40 right 90 forward 40 left 90}',
        hints:['Cada graó combina dos moviments i dos girs. Prova: avança(40) gira.dreta(90) avança(40) gira.esquerra(90) i repeteix-ho 4 cops.','Solució: repeteix(4) { avança(40) gira.dreta(90) avança(40) gira.esquerra(90) }'] },
      { id:6, category:'basic', title:'L\'hexàgon', level:'medium',
        desc:"Dibuixa un hexàgon regular. Recorda: la suma dels girs exteriors és sempre <em>360°</em>.",
        code:'// Dibuixa un hexàgon regular\n\n',
        goal:'repeat(6){forward 60 right 60}',
        hints:['Un hexàgon té 6 costats. Gir exterior = 360÷6 = 60°.','Solució: repeteix(6) { avança(60) gira.dreta(60) }'] },
      { id:7, category:'basic', title:'La casa', level:'hard',
        desc:"Dibuixa una casa: un quadrat (base) amb un triangle (teulada) a sobre. Defineix un <em>procediment</em> per a cada part!",
        code:'procediment base {\n  // quadrat de 100\n}\nprocediment teulada {\n  // triangle a sobre\n}\n\n// Programa principal\nbase\nteulada\n',
        goal:'repeat(4){forward 100 right 90} right 30 forward 100 right 120 forward 100',
        hints:['La base és un quadrat de 100. Per la teulada, després del quadrat Karel mira a la dreta. Has de girar 30° a la dreta i dibuixar un triangle amb girs de 120°.','Base: repeteix(4) { avança(100) gira.dreta(90) } — Teulada: gira.dreta(30) avança(100) gira.dreta(120) avança(100)'] },
      // ── AVANÇATS ──
      { id:101, category:'advanced', title:'El cercle', level:'easy',
        desc:"Aproxima un cercle: repeteix <em>36 vegades</em> un petit avanç i un petit gir. 36 × 10° = 360°!",
        code:'// Dibuixa un cercle (aproximació)\n// Pista: molts passos petits + girs petits\n\n',
        goal:'repeat(36){forward 10 right 10}',
        hints:['Un cercle és un polígon amb molts costats petits. Si gires 10° cada vegada, necessites 36 repeticions (36×10=360).','Solució: repeteix(36) { avança(10) gira.dreta(10) }'] },
      { id:102, category:'advanced', title:'Línia discontínua', level:'medium',
        desc:"Dibuixa una línia discontínua: alterna entre dibuixar i no dibuixar amb <em>posa.llapis</em> i <em>treu.llapis</em>.",
        code:'// Línia discontínua: dibuixa-salta-dibuixa-salta...\n\n',
        goal:'repeat(8){forward 20 pen.up forward 15 pen.down}',
        hints:['Usa treu.llapis per moure sense dibuixar i posa.llapis per tornar a dibuixar.','Solució: repeteix(8) { avança(20) treu.llapis avança(15) posa.llapis }'] },
      { id:103, category:'advanced', title:'El ventall', level:'medium',
        desc:"Dibuixa un ventall de 6 triangles girats. Combina un bucle exterior (gira entre triangles) i un interior (dibuixa cada triangle).",
        code:'// Ventall de triangles\n// Pista: repeteix dins de repeteix\n\n',
        goal:'repeat(6){repeat(3){forward 60 right 120}right 60}',
        hints:['Dibuixa un triangle, gira 60°, dibuixa un altre triangle, gira 60°... 6 vegades.','Solució: repeteix(6) { repeteix(3) { avança(60) gira.dreta(120) } gira.dreta(60) }'] },
      { id:104, category:'advanced', title:'La flor', level:'hard',
        desc:"Dibuixa una flor: 8 cercles petits disposats en forma de flor. Cada pètal és un cercle!",
        code:'// Flor de cercles\nprocediment petal {\n  // un cercle petit\n}\n\n// Programa principal: 8 pètals girats\n\n',
        goal:'repeat(8){repeat(36){forward 5 right 10}right 45}',
        hints:['Cada pètal és un cercle petit: repeteix(36) { avança(5) gira.dreta(10) }. Dibuixa 8 pètals girant 45° entre cada un.','Solució: repeteix(8) { repeteix(36) { avança(5) gira.dreta(10) } gira.dreta(45) }'] },
      { id:105, category:'advanced', title:'El caleidoscopi', level:'hard',
        desc:"Dibuixa 12 quadrats girats 30° entre ells. El resultat és un patró de caleidoscopi espectacular!",
        code:'// Caleidoscopi de quadrats\n\n',
        goal:'repeat(12){repeat(4){forward 80 right 90}right 30}',
        hints:['Dibuixa un quadrat, gira 30°, dibuixa un altre quadrat... 12 vegades (12×30=360).','Solució: repeteix(12) { repeteix(4) { avança(80) gira.dreta(90) } gira.dreta(30) }'] },
    ],
    onboard: [
      { icon:'🐢', title:'Hola! Soc la tortuga Logo', body:'Segueixo les teves instruccions per dibuixar formes al llenç. Tu escrius el codi, jo dibuixo!' },
      { icon:'🖊️', title:'Com funciona', body:'A l\'<strong>esquerra</strong> veus el llenç on dibuixo. A la <strong>dreta</strong> escrius ordres com <code>avança(100)</code> o <code>gira.dreta(90)</code>. Prem <code>▶ Executa</code> per veure el resultat.' },
      { icon:'🚀', title:'Preparat?', body:'Fes clic a <strong>🎯 Reptes</strong> i tria el primer. Sort!' },
    ],
  },

  /* ── CASTELLÀ ── */
  es: {
    ui: {
      challenges: '🎯 Retos', challenges_title: '🎯 Retos — elige un ejercicio',
      toggle_theme: 'Oscuro / Claro', run: '▶ Ejecuta', step: '⏭ Paso', stop: '■ Para',
      reset: '↺ Reinicia', clear_log: '⌫ Log', speed: 'Velocidad:', close: 'Cerrar',
      lbl_codelang: 'Código:', lbl_userlang: 'Idioma:',
      level_easy: '⭐ Fácil', level_medium: '⭐⭐ Medio', level_hard: '⭐⭐⭐ Difícil',
      ref_btn: '📋 Ref', ref_cmd: 'Movimiento', ref_struct: 'Estructuras',
      success_title: '¡Reto superado!', success_msg: '¡Excelente! Has resuelto el ejercicio correctamente.',
      success_more: '🎯 Más retos', success_close: 'Continuar',
      category_basic: '🐢 Retos básicos', category_advanced: '🌟 Retos avanzados',
      goal_btn: '🎯 Objetivo', goal_title: '🎯 Objetivo del reto', goal_desc: 'Dibujo objetivo:',
      hint_btn: '💡 Pista', hint_locked: '🔒 Pista ({time})',
      onboard_next: 'Siguiente →', onboard_prev: '← Atrás', onboard_start: '¡Empecemos! 🚀', onboard_skip: 'Saltar',
      pos: 'Pos:', heading: 'Dir:', pen: 'Lápiz:', pen_down: 'abajo ✏️', pen_up: 'arriba ✗',
    },
    state: { idle: 'detenido', running: 'ejecutando', step: 'paso a paso', error: 'error' },
    speed: ['Muy lento','Lento','Normal','Rápido','Muy rápido','Instante'],
    log: {
      running: '▶ Ejecutando...', step_mode: '⏭ Modo paso a paso',
      done: '✓ Programa terminado', reset: '↺ Reiniciado', cleared: '⌫ Limpiado',
      challenge: '🎯 Reto', error: '✗ Error',
      err_parse: 'Error de sintaxis', err_unknown_cmd: 'Orden desconocida',
      err_expect_num: 'Se esperaba un número', err_expect_brace: 'Falta \'{\' o \'}\'',
      err_max_steps: '⚠ ¡Demasiados pasos! ¿Bucle infinito?', err_deep: '⚠ ¡Demasiada profundidad!',
      err_unknown_proc: 'Procedimiento desconocido',
    },
    commands: ['avanza','retrocede','gira.derecha','gira.izquierda','pon.lapiz','quita.lapiz','centro','limpia'],
    keywords: ['repite','procedimiento'],
    challenges: [
      { id:1, category:'basic', title:'Primera línea', level:'easy', desc:"Haz que la tortuga avance <em>100 pasos</em>. ¡Verás cómo dibuja una línea recta!",
        code:'// Haz avanzar la tortuga 100 pasos\n\n', goal:'forward 100',
        hints:['La orden avanza mueve la tortuga. Escribe: avanza(100)','Solución: avanza(100)'] },
      { id:2, category:'basic', title:'El cuadrado', level:'easy', desc:"Dibuja un cuadrado de 100×100. Usa <em>repite</em> para no escribir 4 veces lo mismo.",
        code:'// Dibuja un cuadrado\n// Pista: repite(4) { avanza(100) gira.derecha(90) }\n\n', goal:'repeat(4){forward 100 right 90}',
        hints:['Un cuadrado tiene 4 lados iguales y 4 giros de 90°.','Solución: repite(4) { avanza(100) gira.derecha(90) }'] },
      { id:3, category:'basic', title:'El triángulo', level:'easy', desc:"Dibuja un triángulo equilátero. ¿Cuántos grados gira la tortuga en cada esquina?",
        code:'// Dibuja un triángulo equilátero\n\n', goal:'repeat(3){forward 100 right 120}',
        hints:['Giro exterior = 360÷3 = 120°.','Solución: repite(3) { avanza(100) gira.derecha(120) }'] },
      { id:4, category:'basic', title:'La estrella', level:'medium', desc:"Dibuja una estrella de 5 puntas. ¡El secreto es girar <em>144 grados</em>!",
        code:'// Dibuja una estrella de 5 puntas\n\n', goal:'repeat(5){forward 100 right 144}',
        hints:['5 lados con giros de 144° (720÷5).','Solución: repite(5) { avanza(100) gira.derecha(144) }'] },
      { id:5, category:'basic', title:'La escalera', level:'medium', desc:"Dibuja una escalera de 4 peldaños.",
        code:'// Dibuja una escalera de 4 peldaños\n\n', goal:'repeat(4){forward 40 right 90 forward 40 left 90}',
        hints:['Cada peldaño: avanza, gira derecha, avanza, gira izquierda.','Solución: repite(4) { avanza(40) gira.derecha(90) avanza(40) gira.izquierda(90) }'] },
      { id:6, category:'basic', title:'El hexágono', level:'medium', desc:"Dibuja un hexágono regular. 360÷6 = ?",
        code:'// Dibuja un hexágono regular\n\n', goal:'repeat(6){forward 60 right 60}',
        hints:['Giro = 60°.','Solución: repite(6) { avanza(60) gira.derecha(60) }'] },
      { id:7, category:'basic', title:'La casa', level:'hard', desc:"Dibuja una casa: cuadrado + triángulo como tejado. Define <em>procedimientos</em>.",
        code:'procedimiento base {\n  // cuadrado de 100\n}\nprocedimiento tejado {\n  // triángulo encima\n}\n\nbase\ntejado\n', goal:'repeat(4){forward 100 right 90} right 30 forward 100 right 120 forward 100',
        hints:['Base = cuadrado. Tejado: gira 30° a la derecha y dibuja triángulo con giros de 120°.','Base: repite(4){avanza(100) gira.derecha(90)} — Tejado: gira.derecha(30) avanza(100) gira.derecha(120) avanza(100)'] },
      { id:101, category:'advanced', title:'El círculo', level:'easy', desc:"Aproxima un círculo: 36 pasos pequeños con giros de 10°.",
        code:'// Dibuja un círculo\n\n', goal:'repeat(36){forward 10 right 10}',
        hints:['36 × 10° = 360°.','Solución: repite(36) { avanza(10) gira.derecha(10) }'] },
      { id:102, category:'advanced', title:'Línea discontinua', level:'medium', desc:"Alterna <em>pon.lapiz</em> y <em>quita.lapiz</em> para dibujar una línea a trazos.",
        code:'// Línea discontinua\n\n', goal:'repeat(8){forward 20 pen.up forward 15 pen.down}',
        hints:['quita.lapiz para no dibujar, pon.lapiz para volver a dibujar.','Solución: repite(8) { avanza(20) quita.lapiz avanza(15) pon.lapiz }'] },
      { id:103, category:'advanced', title:'El abanico', level:'medium', desc:"6 triángulos girados formando un abanico.",
        code:'// Abanico de triángulos\n\n', goal:'repeat(6){repeat(3){forward 60 right 120}right 60}',
        hints:['Dibuja triángulo, gira 60°, repite 6 veces.','Solución: repite(6) { repite(3) { avanza(60) gira.derecha(120) } gira.derecha(60) }'] },
      { id:104, category:'advanced', title:'La flor', level:'hard', desc:"8 círculos pequeños (pétalos) girados 45° entre sí.",
        code:'procedimiento petalo {\n  // círculo pequeño\n}\n\n// 8 pétalos\n\n', goal:'repeat(8){repeat(36){forward 5 right 10}right 45}',
        hints:['Cada pétalo es un mini-círculo. Gira 45° entre pétalos (8×45=360).','Solución: repite(8) { repite(36) { avanza(5) gira.derecha(10) } gira.derecha(45) }'] },
      { id:105, category:'advanced', title:'El caleidoscopio', level:'hard', desc:"12 cuadrados girados 30° entre sí.",
        code:'// Caleidoscopio de cuadrados\n\n', goal:'repeat(12){repeat(4){forward 80 right 90}right 30}',
        hints:['Cuadrado + giro 30°, 12 veces.','Solución: repite(12) { repite(4) { avanza(80) gira.derecha(90) } gira.derecha(30) }'] },
    ],
    onboard: [
      { icon:'🐢', title:'¡Hola! Soy la tortuga Logo', body:'Sigo tus instrucciones para dibujar. ¡Tú escribes, yo dibujo!' },
      { icon:'🖊️', title:'Cómo funciona', body:'A la <strong>izquierda</strong> está el lienzo. A la <strong>derecha</strong> escribes órdenes como <code>avanza(100)</code>. Pulsa <code>▶ Ejecuta</code>.' },
      { icon:'🚀', title:'¿Listo?', body:'Haz clic en <strong>🎯 Retos</strong> y elige el primero. ¡Suerte!' },
    ],
  },

  /* ── ENGLISH ── */
  en: {
    ui: {
      challenges: '🎯 Challenges', challenges_title: '🎯 Challenges — pick an exercise',
      toggle_theme: 'Dark / Light', run: '▶ Run', step: '⏭ Step', stop: '■ Stop',
      reset: '↺ Reset', clear_log: '⌫ Log', speed: 'Speed:', close: 'Close',
      lbl_codelang: 'Code:', lbl_userlang: 'Lang:',
      level_easy: '⭐ Easy', level_medium: '⭐⭐ Medium', level_hard: '⭐⭐⭐ Hard',
      ref_btn: '📋 Ref', ref_cmd: 'Movement', ref_struct: 'Structures',
      success_title: 'Challenge complete!', success_msg: 'Excellent! You solved the exercise correctly.',
      success_more: '🎯 More challenges', success_close: 'Continue',
      category_basic: '🐢 Basic challenges', category_advanced: '🌟 Advanced challenges',
      goal_btn: '🎯 Goal', goal_title: '🎯 Challenge goal', goal_desc: 'Target drawing:',
      hint_btn: '💡 Hint', hint_locked: '🔒 Hint ({time})',
      onboard_next: 'Next →', onboard_prev: '← Back', onboard_start: 'Let\'s go! 🚀', onboard_skip: 'Skip',
      pos: 'Pos:', heading: 'Dir:', pen: 'Pen:', pen_down: 'down ✏️', pen_up: 'up ✗',
    },
    state: { idle: 'stopped', running: 'running', step: 'step mode', error: 'error' },
    speed: ['Very slow','Slow','Normal','Fast','Very fast','Instant'],
    log: {
      running: '▶ Running...', step_mode: '⏭ Step mode',
      done: '✓ Program finished', reset: '↺ Reset', cleared: '⌫ Cleared',
      challenge: '🎯 Challenge', error: '✗ Error',
      err_parse: 'Syntax error', err_unknown_cmd: 'Unknown command',
      err_expect_num: 'Expected a number', err_expect_brace: 'Missing \'{\' or \'}\'',
      err_max_steps: '⚠ Too many steps! Infinite loop?', err_deep: '⚠ Too deep!',
      err_unknown_proc: 'Unknown procedure',
    },
    commands: ['forward','back','right','left','pen.down','pen.up','home','clear'],
    keywords: ['repeat','procedure'],
    challenges: [
      { id:1, category:'basic', title:'First line', level:'easy', desc:"Make the turtle move <em>100 steps</em> forward. Watch it draw a straight line!",
        code:'// Move the turtle 100 steps forward\n\n', goal:'forward 100',
        hints:['The forward command moves the turtle. Write: forward(100)','Solution: forward(100)'] },
      { id:2, category:'basic', title:'The square', level:'easy', desc:"Draw a 100×100 square. Use <em>repeat</em> to avoid writing the same thing 4 times!",
        code:'// Draw a square\n// Hint: repeat(4) { forward(100) right(90) }\n\n', goal:'repeat(4){forward 100 right 90}',
        hints:['A square has 4 equal sides and 4 turns of 90°.','Solution: repeat(4) { forward(100) right(90) }'] },
      { id:3, category:'basic', title:'The triangle', level:'easy', desc:"Draw an equilateral triangle. How many degrees should the turtle turn at each corner?",
        code:'// Draw an equilateral triangle\n\n', goal:'repeat(3){forward 100 right 120}',
        hints:['Exterior angle = 360÷3 = 120°.','Solution: repeat(3) { forward(100) right(120) }'] },
      { id:4, category:'basic', title:'The star', level:'medium', desc:"Draw a 5-pointed star. The secret is turning <em>144 degrees</em>!",
        code:'// Draw a 5-pointed star\n\n', goal:'repeat(5){forward 100 right 144}',
        hints:['5 sides with turns of 144° (720÷5).','Solution: repeat(5) { forward(100) right(144) }'] },
      { id:5, category:'basic', title:'The staircase', level:'medium', desc:"Draw a staircase with 4 steps.",
        code:'// Draw a 4-step staircase\n\n', goal:'repeat(4){forward 40 right 90 forward 40 left 90}',
        hints:['Each step: forward, right, forward, left.','Solution: repeat(4) { forward(40) right(90) forward(40) left(90) }'] },
      { id:6, category:'basic', title:'The hexagon', level:'medium', desc:"Draw a regular hexagon. 360÷6 = ?",
        code:'// Draw a regular hexagon\n\n', goal:'repeat(6){forward 60 right 60}',
        hints:['Turn = 60°.','Solution: repeat(6) { forward(60) right(60) }'] },
      { id:7, category:'basic', title:'The house', level:'hard', desc:"Draw a house: square base + triangle roof. Define <em>procedures</em>!",
        code:'procedure base {\n  // square of 100\n}\nprocedure roof {\n  // triangle on top\n}\n\nbase\nroof\n', goal:'repeat(4){forward 100 right 90} right 30 forward 100 right 120 forward 100',
        hints:['Base = square. Roof: turn 30° right then draw triangle with 120° turns.','Base: repeat(4){forward(100) right(90)} — Roof: right(30) forward(100) right(120) forward(100)'] },
      { id:101, category:'advanced', title:'The circle', level:'easy', desc:"Approximate a circle: 36 small steps with 10° turns.",
        code:'// Draw a circle\n\n', goal:'repeat(36){forward 10 right 10}',
        hints:['36 × 10° = 360°.','Solution: repeat(36) { forward(10) right(10) }'] },
      { id:102, category:'advanced', title:'Dashed line', level:'medium', desc:"Alternate <em>pen.down</em> and <em>pen.up</em> to draw a dashed line.",
        code:'// Dashed line\n\n', goal:'repeat(8){forward 20 pen.up forward 15 pen.down}',
        hints:['pen.up to stop drawing, pen.down to resume.','Solution: repeat(8) { forward(20) pen.up forward(15) pen.down }'] },
      { id:103, category:'advanced', title:'The fan', level:'medium', desc:"6 rotated triangles forming a fan pattern.",
        code:'// Fan of triangles\n\n', goal:'repeat(6){repeat(3){forward 60 right 120}right 60}',
        hints:['Draw triangle, turn 60°, repeat 6 times.','Solution: repeat(6) { repeat(3) { forward(60) right(120) } right(60) }'] },
      { id:104, category:'advanced', title:'The flower', level:'hard', desc:"8 small circles (petals) rotated 45° apart.",
        code:'procedure petal {\n  // small circle\n}\n\n// 8 petals\n\n', goal:'repeat(8){repeat(36){forward 5 right 10}right 45}',
        hints:['Each petal is a mini-circle. Turn 45° between petals.','Solution: repeat(8) { repeat(36) { forward(5) right(10) } right(45) }'] },
      { id:105, category:'advanced', title:'Kaleidoscope', level:'hard', desc:"12 squares rotated 30° apart.",
        code:'// Kaleidoscope of squares\n\n', goal:'repeat(12){repeat(4){forward 80 right 90}right 30}',
        hints:['Square + 30° turn, 12 times.','Solution: repeat(12) { repeat(4) { forward(80) right(90) } right(30) }'] },
    ],
    onboard: [
      { icon:'🐢', title:"Hi! I'm the Logo turtle", body:"I follow your instructions to draw shapes. You write the code, I draw!" },
      { icon:'🖊️', title:'How it works', body:'On the <strong>left</strong> is the canvas. On the <strong>right</strong> you write commands like <code>forward(100)</code>. Press <code>▶ Run</code>.' },
      { icon:'🚀', title:'Ready?', body:'Click <strong>🎯 Challenges</strong> and pick the first one. Good luck!' },
    ],
  },
};

// Command → internal name mapping
const CMD_MAP = {
  ca: { 'avança':'forward','retrocedeix':'back','gira.dreta':'right','gira.esquerra':'left','posa.llapis':'pendown','treu.llapis':'penup','centre':'home','neteja':'clear' },
  es: { 'avanza':'forward','retrocede':'back','gira.derecha':'right','gira.izquierda':'left','pon.lapiz':'pendown','quita.lapiz':'penup','centro':'home','limpia':'clear' },
  en: { 'forward':'forward','back':'back','right':'right','left':'left','pen.down':'pendown','pen.up':'penup','home':'home','clear':'clear' },
};
const KW_MAP = {
  ca: { 'repeteix':'repeat','procediment':'procedure' },
  es: { 'repite':'repeat','procedimiento':'procedure' },
  en: { 'repeat':'repeat','procedure':'procedure' },
};
const NEEDS_ARG = new Set(['forward','back','right','left']);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. SISTEMA D'IDIOMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentCodeLang = localStorage.getItem('logo-codelang') || 'ca';
let currentUserLang = localStorage.getItem('logo-userlang') || 'ca';

function t(path) {
  const parts = path.split('.');
  let obj = I18N[currentUserLang];
  for (const p of parts) { obj = obj?.[p]; if (obj === undefined) return ''; }
  return obj;
}

function setCodeLang(lang) {
  if (!I18N[lang]) return;
  currentCodeLang = lang;
  localStorage.setItem('logo-codelang', lang);
  updateLangBtns();
  updateRefPanel();
}

function setUserLang(lang) {
  if (!I18N[lang]) return;
  currentUserLang = lang;
  localStorage.setItem('logo-userlang', lang);
  updateUI();
}

function updateLangBtns() {
  document.querySelectorAll('#codelang-switcher .lang-btn').forEach(b => b.classList.toggle('active', b.textContent.trim().toLowerCase().replace('cast','es').replace('cat','ca').replace('eng','en') === currentCodeLang));
  document.querySelectorAll('#userlang-switcher .lang-btn').forEach(b => b.classList.toggle('active', b.textContent.trim().toLowerCase().replace('cast','es').replace('cat','ca').replace('eng','en') === currentUserLang));
}

function updateUI() {
  updateLangBtns();
  const ids = { 'btn-run':'ui.run','btn-step':'ui.step','btn-stop':'ui.stop','btn-reset':'ui.reset',
    'btn-clear':'ui.clear_log','btn-ref':'ui.ref_btn','btn-challenges':'ui.challenges',
    'btn-modal-close':'ui.close','btn-goal':'ui.goal_btn' };
  for (const [id,key] of Object.entries(ids)) { const el=document.getElementById(id); if(el) el.textContent=t(key); }
  const mct = document.getElementById('modal-challenges-title');
  if (mct) mct.textContent = t('ui.challenges_title');
  const lbls = { 'lbl-codelang':'ui.lbl_codelang','lbl-userlang':'ui.lbl_userlang',
    'lbl-speed':'ui.speed','lbl-pos':'ui.pos','lbl-heading':'ui.heading','lbl-pen':'ui.pen' };
  for (const [id,key] of Object.entries(lbls)) { const el=document.getElementById(id); if(el) el.textContent=t(key); }
  const btnTheme = document.getElementById('btn-theme');
  if (btnTheme) btnTheme.textContent = t('ui.toggle_theme');
  updateRefPanel();
  updateStatus();
  const sl = document.getElementById('speed');
  if (sl) document.getElementById('speed-lbl').textContent = I18N[currentUserLang].speed[+sl.value - 1] || sl.value;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. TOKENITZADOR + PARSER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function tokenize(code, lang) {
  const cmdMap = CMD_MAP[lang] || CMD_MAP.en;
  const kwMap = KW_MAP[lang] || KW_MAP.en;
  const tokens = []; let i = 0, line = 1;
  while (i < code.length) {
    if (code[i] === '\n') { line++; i++; continue; }
    if (/[ \t\r]/.test(code[i])) { i++; continue; }
    if (code[i] === '/' && code[i+1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
    if ('(){}'.includes(code[i])) { tokens.push({ type: code[i], line }); i++; continue; }
    if (/[0-9]/.test(code[i]) || (code[i] === '-' && i+1 < code.length && /[0-9]/.test(code[i+1]))) {
      let num = '';
      if (code[i] === '-') { num += '-'; i++; }
      while (i < code.length && /[0-9.]/.test(code[i])) { num += code[i]; i++; }
      tokens.push({ type: 'NUM', value: parseFloat(num), line }); continue;
    }
    if (/[a-zA-ZàèéíòóúïüçñÀÈÉÍÒÓÚÏÜÇÑ_]/.test(code[i])) {
      let word = '';
      while (i < code.length && /[a-zA-ZàèéíòóúïüçñÀÈÉÍÒÓÚÏÜÇÑ_.0-9\-]/.test(code[i])) { word += code[i]; i++; }
      const low = word.toLowerCase();
      if (cmdMap[low]) tokens.push({ type: 'CMD', name: cmdMap[low], raw: word, line });
      else if (kwMap[low]) tokens.push({ type: 'KW', name: kwMap[low], raw: word, line });
      else tokens.push({ type: 'IDENT', name: word, line });
      continue;
    }
    i++; // skip unknown char
  }
  return tokens;
}

function parse(tokens) {
  let pos = 0;
  function peek() { return tokens[pos]; }
  function eat(type) {
    if (pos >= tokens.length) throw { msg: t('log.err_expect_brace'), line: tokens[tokens.length-1]?.line || 1 };
    if (tokens[pos].type !== type) throw { msg: t('log.err_expect_brace') + ` ('${type}')`, line: tokens[pos].line };
    return tokens[pos++];
  }
  function readNum() {
    if (peek()?.type === '(') { pos++; const n = readNum(); eat(')'); return n; }
    if (peek()?.type === 'NUM') return tokens[pos++].value;
    throw { msg: t('log.err_expect_num'), line: peek()?.line || 1 };
  }
  function parseBlock() {
    eat('{');
    const body = [];
    while (pos < tokens.length && peek()?.type !== '}') { const s = parseStmt(); if (s) body.push(s); }
    eat('}');
    return body;
  }
  function parseStmt() {
    const tok = peek();
    if (!tok) return null;
    if (tok.type === 'CMD') {
      pos++;
      if (NEEDS_ARG.has(tok.name)) return { type:'cmd', name:tok.name, arg:readNum(), line:tok.line };
      return { type:'cmd', name:tok.name, line:tok.line };
    }
    if (tok.type === 'KW' && tok.name === 'repeat') {
      pos++;
      const count = readNum();
      if (count < 0 || count > 100000) throw { msg: t('log.err_max_steps'), line: tok.line };
      const body = parseBlock();
      return { type:'repeat', count, body, line:tok.line };
    }
    if (tok.type === 'KW' && tok.name === 'procedure') {
      pos++;
      const nameTok = peek();
      if (!nameTok || nameTok.type !== 'IDENT') throw { msg: t('log.err_unknown_cmd'), line: tok.line };
      pos++;
      const body = parseBlock();
      return { type:'procdef', name:nameTok.name, body, line:tok.line };
    }
    if (tok.type === 'IDENT') { pos++; return { type:'call', name:tok.name, line:tok.line }; }
    pos++;
    return null;
  }
  const program = [];
  while (pos < tokens.length) { const s = parseStmt(); if (s) program.push(s); }
  return program;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. INTÈRPRET (generador)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MAX_STEPS = 50000;

function* interpret(ast) {
  const procs = {};
  for (const n of ast) if (n.type === 'procdef') procs[n.name] = n.body;
  let steps = 0;
  function* exec(node, depth) {
    if (depth > 500) throw { msg: t('log.err_deep'), line: node.line };
    if (++steps > MAX_STEPS) throw { msg: t('log.err_max_steps'), line: node.line };
    switch (node.type) {
      case 'cmd': executeCommand(node); yield node; break;
      case 'repeat':
        for (let i = 0; i < node.count; i++)
          for (const c of node.body) yield* exec(c, depth+1);
        break;
      case 'call':
        if (!procs[node.name]) throw { msg: t('log.err_unknown_proc') + ': ' + node.name, line: node.line };
        for (const c of procs[node.name]) yield* exec(c, depth+1);
        break;
      case 'procdef': break;
    }
  }
  for (const node of ast) if (node.type !== 'procdef') yield* exec(node, 0);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. CANVAS + TORTUGA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let turtle = { x:0, y:0, heading:0, penDown:true };
let drawHistory = []; // { x1,y1,x2,y2,color,width }
let ctxDraw = null, ctxTurtle = null;
let canvasW = 0, canvasH = 0;

function setupCanvases() {
  const area = document.getElementById('canvas-area');
  const cDraw = document.getElementById('canvas-draw');
  const cTurtle = document.getElementById('canvas-turtle');
  const dpr = window.devicePixelRatio || 1;
  const w = area.clientWidth, h = area.clientHeight;
  canvasW = w; canvasH = h;
  for (const c of [cDraw, cTurtle]) {
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + 'px'; c.style.height = h + 'px';
  }
  ctxDraw = cDraw.getContext('2d'); ctxDraw.scale(dpr, dpr);
  ctxTurtle = cTurtle.getContext('2d'); ctxTurtle.scale(dpr, dpr);
  redrawAll();
}

function redrawAll() {
  if (!ctxDraw) return;
  ctxDraw.clearRect(0,0,canvasW,canvasH);
  // Subtle center crosshair
  const cx = canvasW/2, cy = canvasH/2;
  ctxDraw.strokeStyle = 'rgba(0,230,118,.08)';
  ctxDraw.lineWidth = 1;
  ctxDraw.beginPath(); ctxDraw.moveTo(cx,0); ctxDraw.lineTo(cx,canvasH); ctxDraw.moveTo(0,cy); ctxDraw.lineTo(canvasW,cy); ctxDraw.stroke();
  // Replay draw history
  for (const seg of drawHistory) {
    ctxDraw.strokeStyle = seg.color;
    ctxDraw.lineWidth = seg.width;
    ctxDraw.lineCap = 'round';
    ctxDraw.beginPath();
    ctxDraw.moveTo(cx + seg.x1, cy + seg.y1);
    ctxDraw.lineTo(cx + seg.x2, cy + seg.y2);
    ctxDraw.stroke();
  }
  drawTurtle();
}

function drawTurtle() {
  if (!ctxTurtle) return;
  ctxTurtle.clearRect(0,0,canvasW,canvasH);
  const cx = canvasW/2 + turtle.x, cy = canvasH/2 + turtle.y;
  const rad = turtle.heading * Math.PI / 180;
  const sz = 12;
  ctxTurtle.save();
  ctxTurtle.translate(cx, cy);
  ctxTurtle.rotate(rad);
  ctxTurtle.beginPath();
  ctxTurtle.moveTo(0, -sz);
  ctxTurtle.lineTo(-sz*0.5, sz*0.45);
  ctxTurtle.lineTo(sz*0.5, sz*0.45);
  ctxTurtle.closePath();
  ctxTurtle.fillStyle = turtle.penDown ? getComputedStyle(document.documentElement).getPropertyValue('--pen-color').trim() : '#888';
  ctxTurtle.fill();
  ctxTurtle.strokeStyle = turtle.penDown ? '#fff' : '#666';
  ctxTurtle.lineWidth = 1.5;
  ctxTurtle.stroke();
  ctxTurtle.restore();
}

function executeCommand(node) {
  const penColor = getComputedStyle(document.documentElement).getPropertyValue('--pen-color').trim() || '#00e676';
  switch (node.name) {
    case 'forward': case 'back': {
      const dist = node.name === 'back' ? -node.arg : node.arg;
      const rad = turtle.heading * Math.PI / 180;
      const dx = dist * Math.sin(rad), dy = -dist * Math.cos(rad);
      const nx = turtle.x + dx, ny = turtle.y + dy;
      if (turtle.penDown) {
        drawHistory.push({ x1:turtle.x, y1:turtle.y, x2:nx, y2:ny, color:penColor, width:2 });
        const cx = canvasW/2;
        const cyc = canvasH/2;
        if (ctxDraw) { ctxDraw.strokeStyle=penColor; ctxDraw.lineWidth=2; ctxDraw.lineCap='round'; ctxDraw.beginPath(); ctxDraw.moveTo(cx+turtle.x, cyc+turtle.y); ctxDraw.lineTo(cx+nx, cyc+ny); ctxDraw.stroke(); }
      }
      turtle.x = nx; turtle.y = ny; break;
    }
    case 'right': turtle.heading = (turtle.heading + node.arg) % 360; break;
    case 'left': turtle.heading = ((turtle.heading - node.arg) % 360 + 360) % 360; break;
    case 'pendown': turtle.penDown = true; break;
    case 'penup': turtle.penDown = false; break;
    case 'home': turtle.x = 0; turtle.y = 0; turtle.heading = 0; break;
    case 'clear': drawHistory = []; turtle.x=0; turtle.y=0; turtle.heading=0; turtle.penDown=true; redrawAll(); break;
  }
  drawTurtle();
  updateStatus();
}

function updateStatus() {
  const p = document.getElementById('st-pos');
  const h = document.getElementById('st-heading');
  const pe = document.getElementById('st-pen');
  if (p) p.textContent = `(${Math.round(turtle.x)}, ${Math.round(-turtle.y)})`;
  if (h) h.textContent = Math.round(turtle.heading) + '°';
  if (pe) pe.textContent = turtle.penDown ? (t('ui.pen_down')||'baix ✏️') : (t('ui.pen_up')||'amunt ✗');
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. EDITOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LS_CODE = 'logo-code-v1';

function updateEditor() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('code-highlight');
  const ln = document.getElementById('line-numbers');
  if (!ta) return;
  const code = ta.value;
  hl.innerHTML = highlightCode(code);
  const lines = code.split('\n');
  ln.innerHTML = lines.map((_,i) => `<div>${i+1}</div>`).join('');
  localStorage.setItem(LS_CODE, code);
}

function highlightCode(code) {
  const lang = currentCodeLang;
  const cmds = Object.keys(CMD_MAP[lang] || {});
  const kws = Object.keys(KW_MAP[lang] || {});
  return code.split('\n').map(line => {
    const ci = line.indexOf('//');
    let main = ci >= 0 ? line.substring(0, ci) : line;
    let comment = ci >= 0 ? line.substring(ci) : '';
    // Escape HTML in main
    main = escHtml(main);
    // Highlight numbers
    main = main.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="hl-num">$1</span>');
    // Highlight keywords (must be before commands to catch 'repeteix' etc.)
    for (const kw of kws) {
      const re = new RegExp('\\b' + escRegex(kw) + '\\b', 'gi');
      main = main.replace(re, '<span class="hl-kw">$&</span>');
    }
    // Highlight commands
    for (const cmd of cmds) {
      const re = new RegExp('(?<![\\w.])' + escRegex(cmd) + '(?![\\w])', 'gi');
      main = main.replace(re, '<span class="hl-cmd">$&</span>');
    }
    // Braces
    main = main.replace(/([{}()])/g, '<span class="hl-br">$1</span>');
    if (comment) comment = '<span class="hl-cm">' + escHtml(comment) + '</span>';
    return main + comment;
  }).join('\n');
}

function escRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function syncEditorScroll() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('code-highlight');
  const ln = document.getElementById('line-numbers');
  const lb = document.getElementById('line-bg');
  if (ta && hl) { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }
  if (ta && ln) ln.scrollTop = ta.scrollTop;
  if (ta && lb) lb.style.top = -ta.scrollTop + 'px';
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. CONTROLS D'EXECUCIÓ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let running = false, stepping = false, iterator = null, _runTimer = null;

const SPEED_MS = [500, 200, 80, 20, 5, 0];

function setStateUI(state) {
  const dot = document.getElementById('state-dot');
  const lbl = document.getElementById('state-lbl');
  dot.className = state === 'error' ? 'error' : state === 'idle' ? '' : 'running';
  lbl.textContent = t('state.' + state) || state;
}

function log(msg, cls) {
  const el = document.getElementById('log');
  if (!el) return;
  const d = document.createElement('div');
  if (cls) d.className = 'log-' + cls;
  d.textContent = msg;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}

function clearLog() { const el = document.getElementById('log'); if (el) el.innerHTML = ''; }

function clearLineMarks() {
  const lb = document.getElementById('line-bg');
  if (lb) lb.innerHTML = '';
}

function markLine(lineNum, cls) {
  const lb = document.getElementById('line-bg');
  if (!lb) return;
  lb.innerHTML = '';
  if (lineNum < 1) return;
  const d = document.createElement('div');
  d.className = 'line-mark ' + cls;
  d.style.top = ((lineNum - 1) * 1.58) + 'em';
  lb.appendChild(d);
}

function getSpeedMs() {
  const v = parseInt(document.getElementById('speed')?.value || 3);
  return SPEED_MS[v - 1] ?? 80;
}

function runProgram() {
  if (running) return;
  const code = document.getElementById('code-editor')?.value || '';
  try {
    const tokens = tokenize(code, currentCodeLang);
    const ast = parse(tokens);
    iterator = interpret(ast);
    running = true; stepping = false;
    setStateUI('running');
    log(t('log.running'), 'ok');
    tick();
  } catch(e) {
    log((t('log.err_parse')||'Error') + ' (L' + (e.line||'?') + '): ' + (e.msg||e.message||e), 'err');
    setStateUI('error');
    if (e.line) markLine(e.line, 'err');
  }
}

function tick() {
  if (!running || !iterator) return;
  try {
    const res = iterator.next();
    if (res.done) { finishRun(); return; }
    if (res.value?.line) markLine(res.value.line, 'exec');
    _runTimer = setTimeout(tick, getSpeedMs());
  } catch(e) {
    log((t('log.error')||'Error') + ' (L' + (e.line||'?') + '): ' + (e.msg||e.message||e), 'err');
    if (e.line) markLine(e.line, 'err');
    running = false; iterator = null; setStateUI('error');
  }
}

function stepProgram() {
  if (!iterator) {
    const code = document.getElementById('code-editor')?.value || '';
    try {
      const tokens = tokenize(code, currentCodeLang);
      const ast = parse(tokens);
      iterator = interpret(ast);
      running = true; stepping = true;
      setStateUI('step');
      log(t('log.step_mode'), 'ok');
    } catch(e) {
      log((t('log.err_parse')||'Error') + ' (L' + (e.line||'?') + '): ' + (e.msg||e.message||e), 'err');
      setStateUI('error');
      if (e.line) markLine(e.line, 'err');
      return;
    }
  }
  try {
    const res = iterator.next();
    if (res.done) { finishRun(); return; }
    if (res.value?.line) markLine(res.value.line, 'exec');
  } catch(e) {
    log((t('log.error')||'Error') + ': ' + (e.msg||e.message||e), 'err');
    running = false; iterator = null; setStateUI('error');
  }
}

function stopProgram() {
  clearTimeout(_runTimer);
  running = false; stepping = false; iterator = null;
  clearLineMarks();
  setStateUI('idle');
}

function finishRun() {
  running = false; iterator = null;
  clearLineMarks();
  setStateUI('idle');
  log(t('log.done'), 'ok');
  checkChallengeSuccess();
}

function resetCanvas() {
  stopProgram();
  turtle = { x:0, y:0, heading:0, penDown:true };
  drawHistory = [];
  redrawAll();
  updateStatus();
  log(t('log.reset'), 'ok');
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. REPTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentChallengeId = null;

function openChallenges() {
  const challenges = I18N[currentUserLang].challenges;
  const list = document.getElementById('challenges-list');
  if (!list) return;
  const groups = {};
  for (const ch of challenges) { const cat = ch.category||'basic'; if(!groups[cat]) groups[cat]=[]; groups[cat].push(ch); }
  const catOrder = ['basic', 'advanced'];
  function renderCards(arr) {
    return arr.map(ch => {
      const num = ch.id >= 100 ? `★ ${ch.id - 100}` : `${t('log.challenge')} ${ch.id}`;
      return `<div class="ch-card" data-challenge-id="${ch.id}" role="button" tabindex="0">
        <div class="ch-num">${escHtml(num)}</div>
        <div class="ch-title">${escHtml(ch.title)}</div>
        <div class="ch-desc">${sanitizeHtml(ch.desc)}</div>
        <div><span class="ch-tag ${escHtml(ch.level)}">${escHtml(t('ui.level_'+ch.level))}</span></div>
      </div>`;
    }).join('');
  }
  let html = '';
  catOrder.forEach((cat, i) => {
    if (!groups[cat]) return;
    const label = t('ui.category_'+cat) || cat;
    html += `<details class="ch-details"${i===0?' open':''}>
      <summary class="ch-summary">${escHtml(label)}<span class="ch-count">${groups[cat].length}</span></summary>
      <div class="ch-grid">${renderCards(groups[cat])}</div>
    </details>`;
  });
  list.innerHTML = html;
  list.onclick = e => { const card = e.target.closest('[data-challenge-id]'); if(card) loadChallenge(+card.dataset.challengeId); };
  openModal('modal-challenges');
}

function loadChallenge(id) {
  const chUI = I18N[currentUserLang].challenges.find(c=>c.id===id);
  const chCode = I18N[currentCodeLang].challenges.find(c=>c.id===id);
  if (!chUI || !chCode) return;
  currentChallengeId = id;
  resetCanvas();
  const ta = document.getElementById('code-editor');
  if (ta) { ta.value = chCode.code; localStorage.setItem(LS_CODE, chCode.code); updateEditor(); }
  closeModal('modal-challenges');
  const lbl = id >= 100 ? `★ ${id-100}` : `${t('log.challenge')} ${id}`;
  log(`${lbl}: ${chUI.title}`, 'ok');
  // Show goal & hint buttons
  const btnGoal = document.getElementById('btn-goal');
  if (btnGoal) { btnGoal.style.display=''; btnGoal.textContent=t('ui.goal_btn'); }
  const btnHint = document.getElementById('btn-hint');
  if (btnHint) { btnHint.style.display=''; btnHint.disabled=false; btnHint.textContent=t('ui.hint_btn'); _hintIdx=0; }
  document.getElementById('hint-panel')?.classList.remove('visible');
}

// ── Goal Modal ──
function showGoalModal() {
  if (!currentChallengeId) return;
  const ch = I18N[currentUserLang]?.challenges?.find(c=>c.id===currentChallengeId);
  const chAny = I18N[currentUserLang]?.challenges?.find(c=>c.id===currentChallengeId);
  if (!ch) return;
  document.getElementById('modal-goal-title').textContent = t('ui.goal_title');
  const lbl = ch.id>=100 ? `★ ${ch.id-100}` : `${t('log.challenge')} ${ch.id}`;
  document.getElementById('goal-challenge-name').textContent = `${lbl}: ${ch.title}`;
  document.getElementById('goal-instructions').innerHTML = sanitizeHtml(ch.desc);
  document.getElementById('goal-visual-label').textContent = t('ui.goal_desc');
  document.getElementById('btn-goal-close').textContent = t('ui.close');
  // Render goal preview on mini canvas
  renderGoalPreview(ch.goal);
  openModal('modal-goal');
}

function renderGoalPreview(goalCode) {
  const canvas = document.getElementById('goal-canvas');
  if (!canvas || !goalCode) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  // Parse and execute silently using English lang
  try {
    const tokens = tokenize(goalCode, 'en');
    const ast = parse(tokens);
    const t = { x:0, y:0, heading:0, penDown:true };
    const segs = [];
    const procs = {};
    for (const n of ast) if(n.type==='procdef') procs[n.name]=n.body;
    function run(nodes, depth) {
      if(depth>200) return;
      for (const n of nodes) {
        if(n.type==='cmd') {
          switch(n.name) {
            case 'forward': case 'back': {
              const d = n.name==='back'?-n.arg:n.arg;
              const r = t.heading*Math.PI/180;
              const nx=t.x+d*Math.sin(r), ny=t.y-d*Math.cos(r);
              if(t.penDown) segs.push({x1:t.x,y1:t.y,x2:nx,y2:ny});
              t.x=nx; t.y=ny; break;
            }
            case 'right': t.heading=(t.heading+n.arg)%360; break;
            case 'left': t.heading=((t.heading-n.arg)%360+360)%360; break;
            case 'pendown': t.penDown=true; break;
            case 'penup': t.penDown=false; break;
            case 'home': t.x=0;t.y=0;t.heading=0; break;
            case 'clear': segs.length=0;t.x=0;t.y=0;t.heading=0;t.penDown=true; break;
          }
        } else if(n.type==='repeat') { for(let i=0;i<n.count;i++) run(n.body,depth+1); }
        else if(n.type==='call' && procs[n.name]) run(procs[n.name],depth+1);
      }
    }
    run(ast, 0);
    // Auto-scale to fit
    if (segs.length === 0) return;
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const s of segs) { minX=Math.min(minX,s.x1,s.x2); maxX=Math.max(maxX,s.x1,s.x2); minY=Math.min(minY,s.y1,s.y2); maxY=Math.max(maxY,s.y1,s.y2); }
    const pad = 20;
    const dw = maxX-minX||1, dh = maxY-minY||1;
    const scale = Math.min((w-pad*2)/dw, (h-pad*2)/dh);
    const ox = w/2 - (minX+maxX)/2*scale, oy = h/2 - (minY+maxY)/2*scale;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--pen-color').trim() || '#00e676';
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const s of segs) {
      ctx.beginPath();
      ctx.moveTo(ox+s.x1*scale, oy+s.y1*scale);
      ctx.lineTo(ox+s.x2*scale, oy+s.y2*scale);
      ctx.stroke();
    }
  } catch(e) { /* silent */ }
}

// ── Challenge Success ──
function checkChallengeSuccess() {
  if (!currentChallengeId) return;
  // Compare drawn lines with goal lines
  const ch = I18N['en'].challenges.find(c=>c.id===currentChallengeId);
  if (!ch || !ch.goal) return;
  // Execute goal code
  try {
    const tokens = tokenize(ch.goal, 'en');
    const ast = parse(tokens);
    const gt = {x:0,y:0,heading:0,penDown:true};
    const goalSegs = [];
    const procs = {};
    for(const n of ast) if(n.type==='procdef') procs[n.name]=n.body;
    function run(nodes,d){if(d>200)return;for(const n of nodes){if(n.type==='cmd'){switch(n.name){case 'forward':case'back':{const dist=n.name==='back'?-n.arg:n.arg;const r=gt.heading*Math.PI/180;const nx=gt.x+dist*Math.sin(r),ny=gt.y-dist*Math.cos(r);if(gt.penDown)goalSegs.push({x1:Math.round(gt.x*10)/10,y1:Math.round(gt.y*10)/10,x2:Math.round(nx*10)/10,y2:Math.round(ny*10)/10});gt.x=nx;gt.y=ny;break;}case'right':gt.heading=(gt.heading+n.arg)%360;break;case'left':gt.heading=((gt.heading-n.arg)%360+360)%360;break;case'pendown':gt.penDown=true;break;case'penup':gt.penDown=false;break;case'home':gt.x=0;gt.y=0;gt.heading=0;break;case'clear':goalSegs.length=0;gt.x=0;gt.y=0;gt.heading=0;gt.penDown=true;break;}}else if(n.type==='repeat'){for(let i=0;i<n.count;i++)run(n.body,d+1);}else if(n.type==='call'&&procs[n.name])run(procs[n.name],d+1);}}
    run(ast,0);
    // Compare segments (tolerance)
    const userSegs = drawHistory.map(s=>({x1:Math.round(s.x1*10)/10,y1:Math.round(s.y1*10)/10,x2:Math.round(s.x2*10)/10,y2:Math.round(s.y2*10)/10}));
    if (goalSegs.length === 0 || userSegs.length === 0) return;
    // Check if all goal segments exist in user segments (with tolerance)
    const tol = 2;
    function segMatch(a,b) { return Math.abs(a.x1-b.x1)<tol && Math.abs(a.y1-b.y1)<tol && Math.abs(a.x2-b.x2)<tol && Math.abs(a.y2-b.y2)<tol; }
    let matched = 0;
    for (const gs of goalSegs) {
      if (userSegs.some(us => segMatch(gs,us))) matched++;
    }
    if (matched < goalSegs.length * 0.85) return; // need 85% match
  } catch(e) { return; }

  // Success!
  const chUI = I18N[currentUserLang].challenges.find(c=>c.id===currentChallengeId);
  if (!chUI) return;
  log('🏆 ' + t('ui.success_title'), 'ok');
  setTimeout(() => {
    const icons = ['🎉','🏆','⭐','🚀','🌟','🐢'];
    document.getElementById('success-icon').textContent = icons[currentChallengeId % icons.length];
    const lbl = chUI.id>=100 ? `★ ${chUI.id-100}` : `${t('log.challenge')} ${chUI.id}`;
    document.getElementById('success-challenge').textContent = lbl + ': ' + chUI.title;
    document.getElementById('success-title').textContent = t('ui.success_title');
    document.getElementById('success-msg').textContent = t('ui.success_msg');
    const bm = document.getElementById('btn-success-more'); if(bm) bm.textContent = t('ui.success_more');
    const bc = document.getElementById('btn-success-close'); if(bc) bc.textContent = t('ui.success_close');
    openModal('modal-success');
  }, 400);
}


// ── Hints ──
let _hintIdx = 0;
function showNextHint() {
  const ch = I18N[currentUserLang]?.challenges?.find(c=>c.id===currentChallengeId);
  if (!ch || !ch.hints) return;
  const panel = document.getElementById('hint-panel');
  if (_hintIdx >= ch.hints.length) { panel.textContent = '✓'; return; }
  panel.textContent = ch.hints[_hintIdx];
  panel.classList.add('visible');
  _hintIdx++;
  const btn = document.getElementById('btn-hint');
  if (btn) btn.textContent = _hintIdx < ch.hints.length ? (t('ui.hint_btn')+' →') : '✓';
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. UI (theme, modals, ref, onboard)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Theme ──
function toggleLight() { document.body.classList.toggle('light'); localStorage.setItem('logo-light', document.body.classList.contains('light')?'1':'0'); redrawAll(); }

// ── Modals ──
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ── Ref panel ──
let _refVisible = false;
function toggleRef() { _refVisible = !_refVisible; document.getElementById('ref-panel')?.classList.toggle('visible', _refVisible); updateRefPanel(); }
function updateRefPanel() {
  const rp = document.getElementById('ref-panel');
  if (!rp || !_refVisible) return;
  const cmds = I18N[currentCodeLang].commands;
  const kws = I18N[currentCodeLang].keywords;
  rp.innerHTML = `
    <div class="ref-section-title">${escHtml(t('ui.ref_cmd'))}</div>
    ${cmds.map(c=>`<div class="ref-item"><code>${escHtml(c)}</code></div>`).join('')}
    <div class="ref-section-title">${escHtml(t('ui.ref_struct'))}</div>
    ${kws.map(k=>`<div class="ref-item"><code>${escHtml(k)}</code></div>`).join('')}
  `;
}

// ── Hamburger ──
function initHamburger() {
  const btn = document.getElementById('topbar-hamburger');
  const actions = document.querySelector('.topbar-actions');
  if (!btn || !actions) return;
  btn.onclick = () => { const open = actions.classList.toggle('open'); btn.setAttribute('aria-expanded', open); };
  actions.addEventListener('click', e => { if (e.target.closest('.btn') || e.target.closest('.lang-btn')) { actions.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }});
}

// ── Onboarding ──
const LS_ONBOARD = 'logo-onboard-done';
let onboardStep = 0;
function openOnboard() { onboardStep=0; renderOnboardStep(); openModal('modal-onboard'); }
function renderOnboardStep() {
  const steps = I18N[currentUserLang].onboard;
  const s = steps[onboardStep];
  if (!s) return;
  document.getElementById('onboard-icon').textContent = s.icon;
  document.getElementById('onboard-title').textContent = s.title;
  document.getElementById('onboard-body').innerHTML = sanitizeHtml(s.body);
  document.getElementById('onboard-dots').innerHTML = steps.map((_,i) => `<div class="onboard-dot${i===onboardStep?' active':''}"></div>`).join('');
  const prev = document.getElementById('onboard-prev');
  const next = document.getElementById('onboard-next');
  prev.style.visibility = onboardStep === 0 ? 'hidden' : 'visible';
  next.textContent = onboardStep === steps.length - 1 ? (t('ui.onboard_start')||'🚀') : (t('ui.onboard_next')||'→');
  document.getElementById('onboard-skip').textContent = t('ui.onboard_skip');
}
function onboardNext() {
  const steps = I18N[currentUserLang].onboard;
  if (onboardStep >= steps.length - 1) { onboardSkip(); return; }
  onboardStep++; renderOnboardStep();
}
function onboardPrev() { if(onboardStep>0){onboardStep--;renderOnboardStep();} }
function onboardSkip() { closeModal('modal-onboard'); localStorage.setItem(LS_ONBOARD,'1'); setTimeout(openChallenges, 200); }


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. INIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

window.addEventListener('DOMContentLoaded', () => {
  // Theme
  if (localStorage.getItem('logo-light') === '1') document.body.classList.add('light');

  // Canvas
  setupCanvases();
  window.addEventListener('resize', () => { setupCanvases(); });

  // Editor
  const ta = document.getElementById('code-editor');
  if (ta) {
    ta.value = localStorage.getItem(LS_CODE) || '// Escriu el teu codi Logo aquí!\n// Prova: avança(100)\n\n';
    ta.addEventListener('input', updateEditor);
    ta.addEventListener('scroll', syncEditorScroll);
    updateEditor();
  }

  // Speed
  const sp = document.getElementById('speed');
  if (sp) sp.addEventListener('input', () => {
    document.getElementById('speed-lbl').textContent = I18N[currentUserLang].speed[+sp.value - 1] || sp.value;
  });

  // Log resize
  const lr = document.getElementById('log-resize');
  if (lr) {
    let dragging = false, startY = 0, startH = 0;
    lr.addEventListener('mousedown', e => { dragging=true; startY=e.clientY; startH=document.getElementById('log-wrap').offsetHeight; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if(!dragging)return; const dh=startY-e.clientY; document.getElementById('log-wrap').style.height=Math.max(40,startH+dh)+'px'; });
    window.addEventListener('mouseup', () => { dragging=false; });
  }

  // UI
  updateUI();
  initHamburger();
  updateStatus();

  // Onboarding
  if (!localStorage.getItem(LS_ONBOARD)) openOnboard();
});
