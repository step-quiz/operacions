// ════════════════════════════════════════════════════════
// karel.js — Karel (multiidioma: CAT / CAST / ENG)
// ════════════════════════════════════════════════════════


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 0. UTILITATS (seguretat, UI mòbil)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * FIX SEGURETAT: sanitizeHtml — permet només un conjunt segur de tags HTML.
 * Qualsevol tag fora de la whitelist es converteix en text pla.
 * Atributs no permesos (com onclick, onerror...) es descarten.
 */
const _SAFE_TAGS = new Set(['em','strong','code','br','span','b','i','u','sub','sup']);
const _SAFE_ATTRS = new Set(['class','title']); // només atributs inerts

function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  // Parseja usant el DOM parser (segur: no executa scripts)
  const doc = new DOMParser().parseFromString(html, 'text/html');
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode('');
    const tag = node.tagName.toLowerCase();
    if (!_SAFE_TAGS.has(tag)) {
      // Tag no permès: retorna només el contingut com a text
      const frag = document.createDocumentFragment();
      for (const child of node.childNodes) frag.appendChild(walk(child));
      return frag;
    }
    const el = document.createElement(tag);
    // Copia només atributs segurs
    for (const attr of node.attributes) {
      if (_SAFE_ATTRS.has(attr.name.toLowerCase())) el.setAttribute(attr.name, attr.value);
    }
    for (const child of node.childNodes) el.appendChild(walk(child));
    return el;
  }
  const frag = document.createDocumentFragment();
  for (const child of doc.body.childNodes) frag.appendChild(walk(child));
  // Retorna la string HTML neta
  const tmp = document.createElement('div');
  tmp.appendChild(frag);
  return tmp.innerHTML;
}

/**
 * FIX MOBILE: Hamburger menu toggle
 */
(function initHamburger() {
  const btn     = document.getElementById('topbar-hamburger');
  const actions = document.querySelector('.topbar-actions');
  if (!btn || !actions) return;

  btn.addEventListener('click', () => {
    const open = actions.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '✕' : '☰';
  });

  // Tanca el menú en fer clic a qualsevol botó dins el dropdown
  actions.addEventListener('click', e => {
    // FIX: inclou .lang-btn (no tenen classe .btn)
    if ((e.target.closest('.btn') || e.target.closest('.lang-btn')) && window.innerWidth <= 600) {
      actions.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '☰';
    }
  });

  // Tanca el menú si es redimensiona a >600px
  window.addEventListener('resize', () => {
    if (window.innerWidth > 600 && actions.classList.contains('open')) {
      actions.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '☰';
    }
  });
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. TRADUCCIONS (I18N)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const I18N = {

  /* ── CATALÀ ── */
  ca: {
    ui: {
      challenges: '🎯 Reptes',
      challenges_title: '🎯 Reptes — tria un exercici per començar',
      toggle_theme: 'Fosc / Clar', config_btn: 'Configuració',
      run: '▶ Executa', step: '⏭ Pas', stop: '■ Para',
      reset: '↺ Reinicia', clear_log: '⌫ Missatges',
      speed: 'Velocitat:', bag: 'Motxilla:', close: 'Tanca',
      level_easy: '⭐ Fàcil', level_medium: '⭐⭐ Mitjà', level_hard: '⭐⭐⭐ Difícil',
      lbl_codelang: 'Codi:', lbl_userlang: 'Idioma:',
      help_btn: 'Ajuda 💡', help_more: 'Més ajuda →', help_close: 'Tanca',
      ref_btn: '📋 Referència', ref_cmd: 'Moviment', ref_cond: 'Condicions', ref_kw: 'Estructures',
      success_title: '¡Repte superat!', success_msg: 'Excel·lent! Has resolt l\'exercici correctament.',
      success_more: '🎯 Més reptes', success_close: 'Continua',
      onboard_next: 'Següent →', onboard_prev: '← Enrere', onboard_start: 'Comencem! 🚀', onboard_skip: 'Salta',
      return_title: 'Benvingut de nou!', return_subtitle: 'Que vols fer?',
      return_lbl_challenge: 'Tria un repte', return_desc_challenge: 'Clàssics o Code in Place (Stanford)',
      return_lbl_csv: 'Carrega un mapa CSV', return_desc_csv: 'Obre un mapa personalitzat des del teu ordinador',
      return_lbl_edit: 'Edita mapa', return_desc_edit: 'Crea o modifica un mapa des de l\'editor visual',
      onboard_tutorial: 'Coneix Karel en 2 minuts 📖',
      hint_btn: '💡 Pista', hint_locked: '🔒 Pista ({time})', hint_panel_title: '💡 Pista', hint_next: 'Pista 2 →', hint_close: 'Tanca', hint_exhausted: 'Ja has vist totes les pistes!', hint_waiting: 'Pista disponible en',
      category_basic: '📘 Reptes originals', category_cp: '🎓 Code in Place (Stanford)',
      goal_btn: '🎯 Objectiu', goal_title: '🎯 Objectiu del repte', goal_desc: 'Així ha de quedar el món quan el programa acabi:',
      restore_btn: '📝 Codi inicial', restore_confirm: 'Vols recuperar el codi inicial del repte? Perdràs el codi actual.',
    },
    state: { idle: 'aturat', running: 'executant', step: 'pas a pas', error: 'error' },
    speed: ['Molt lent','Lent','Normal','Ràpid','Molt ràpid','Màxim'],
    log: {
      running: '▶ Executant...', step_mode: '⏭ Mode pas a pas',
      done: '✓ Programa acabat', reset: '↺ Reiniciat',
      map_loaded: 'Mapa carregat ✓', stop_first: 'Para el programa primer!',
      line: 'línia', inf_loop: '⚠ Bucle infinit! La condició del mentre mai es fa falsa. Afegeix una acció que canviï la situació dins el bucle.',
      deep_rec: '⚠ Recursió infinita! Un procediment es crida a si mateix sense parar. Assegura que hi ha una condició de parada.', challenge: '🎯 Repte',
    },
    err: {
      wall:      'Karel ha xocat! Usa si(veu-lliure) per comprovar el camí abans d\'avançar',
      no_water:  'No hi havia gota al davant. Usa si(veu-aigua) per comprovar-ho primer',
      bag_empty: 'La motxilla és buida! Usa agafa per recollir gotes abans de deixar-les',
      proc_undef:'Instrucció desconeguda. L\'has escrit bé? Consulta el Panell de Referència',
      syntax:    "Error d'escriptura",
    },
    parse: {
      expected:      "Línia {n}: he llegit '{got}' però esperava '{want}'. Falta un parèntesi o una clau?",
      unexpected:    "Línia {n}: no conec '{tok}'. Revisa l'ortografia o mira el Panell de Referència.",
      unknown_cond:  "Línia {n}: '{tok}' no és una condició coneguda. Mira les condicions al Panell de Referència.",
      expected_proc: "Línia {n}: escriu el nom del procediment just darrere de la paraula 'procediment'.",
    },
    help: {
      wall: {
        title:  '🪸 En Karel ha xocat amb una paret!',
        hint1:  'En Karel ha intentat avançar però hi havia una paret al davant. Comprova cap a on mira i si el camí és lliure.',
        title2: '💡 Com evitar el xoc',
        hint2:  'Comprova si el camí és lliure <em>abans</em> d\'avançar:<br><code>si(veu-lliure) { avança }</code><br>O usa un bucle que s\'atura sol:<br><code>mentre(veu-lliure) { avança }</code>',
      },
      no_water: {
        title:  '🫧 No hi ha cap gota al davant!',
        hint1:  'En Karel ha intentat agafar una gota d\'aigua, però la casella del davant estava buida. La gota ha d\'estar <em>just al davant</em>, no al costat ni darrere.',
        title2: '💡 Com agafar de manera segura',
        hint2:  'Comprova si hi ha gota <em>abans</em> d\'agafar:<br><code>si(veu-aigua) { agafa }</code><br>Combina-ho amb un bucle per recollir totes:<br><code>mentre(veu-lliure) {<br>&nbsp;&nbsp;si(veu-aigua) { agafa }<br>&nbsp;&nbsp;avança<br>}</code>',
      },
      bag_empty: {
        title:  '🎒 La motxilla és buida!',
        hint1:  'En Karel ha intentat deixar una gota però no en té cap a la motxilla. Primer cal recollir alguna gota amb l\'ordre <code>agafa</code>.',
        title2: '💡 Com deixar de manera segura',
        hint2:  'Comprova si la motxilla té alguna gota abans de deixar-la:<br><code>si(motxilla-plena) { deixa }</code><br>Recorda: <code>agafa</code> recull la gota del davant, <code>deixa</code> deixa una gota <em>aquí</em> on ets.',
      },
      proc_undef: {
        title:  '🤔 Instrucció desconeguda!',
        hint1:  'En Karel ha trobat una paraula que no reconeix. Potser hi ha un error d\'escriptura en una ordre o en el nom d\'un procediment que has definit.',
        title2: '💡 Com trobar l\'error',
        hint2:  '• Comprova que l\'ordre és una de les disponibles: <code>avança</code>, <code>agafa</code>, <code>deixa</code>, etc.<br>• Si és un procediment propi, assegura\'t que el nom és <em>exactament igual</em> a on el defines i a on l\'uses.<br>• Les lletres amb accent i els guions fan diferència!',
      },
      inf_loop: {
        title:  '🔁 Bucle infinit detectat!',
        hint1:  'El programa ha repetit la mateixa cosa més de 50.000 vegades sense parar. La condició del bucle <code>mentre</code> mai ha deixat de ser certa.',
        title2: '💡 Com arreglar-ho',
        hint2:  'Assegura\'t que dins del bucle hi ha una acció que <em>fa avançar</em> en Karel perquè la condició canviï:<br><code>mentre(veu-lliure) {<br>&nbsp;&nbsp;avança  ← això canvia la situació<br>}</code><br>Si la condició és sempre certa, el programa no acabarà mai.',
      },
      deep_rec: {
        title:  '🌀 Recursió massa profunda!',
        hint1:  'Un procediment s\'ha cridat a si mateix (o a un altre) més de 50 vegades seguides. Probablement hi ha un cicle infinit entre procediments.',
        title2: '💡 Com arreglar-ho',
        hint2:  'Comprova que els teus procediments no es cridin mútuament de manera indefinida. Cada procediment hauria de fer una feina concreta i acabar sense tornar a cridar-se a si mateix.',
      },
      syntax_brace: {
        title:  '{ } Falta una clau!',
        hint1:  'El parser espera un <code>{</code> o un <code>}</code> però no el troba. Cada bloc d\'instruccions ha d\'estar envoltat de claus.',
        title2: '💡 Estructura correcta',
        hint2:  'Cada estructura necessita les seves claus:<br><code>si(veu-lliure) {<br>&nbsp;&nbsp;avança<br>}</code><br><code>mentre(veu-lliure) {<br>&nbsp;&nbsp;avança<br>}</code><br>Compte: cada <code>{</code> ha de tenir el seu <code>}</code> de tancament.',
      },
      syntax_paren: {
        title:  '( ) Falta un parèntesi!',
        hint1:  'El parser espera un <code>(</code> o un <code>)</code>. Les condicions dels blocs han d\'anar entre parèntesis.',
        title2: '💡 Estructura correcta',
        hint2:  'Exemples correctes:<br><code>si(veu-lliure) { avança }</code><br><code>mentre(veu-aigua) { agafa }</code><br><code>repeteix(3) { avança }</code><br>El parèntesi va just darrere de la paraula clau, sense espais.',
      },
      syntax_number: {
        title:  '🔢 Falta un nombre!',
        hint1:  'Després de <code>repeteix</code> cal posar un nombre que indiqui quantes vegades es vol repetir.',
        title2: '💡 Com usar repeteix',
        hint2:  'L\'estructura és: <code>repeteix(<em>N</em>) { ... }</code><br>Exemples:<br><code>repeteix(4) { avança }</code><br><code>repeteix(10) {<br>&nbsp;&nbsp;si(veu-aigua) { agafa }<br>&nbsp;&nbsp;avança<br>}</code>',
      },
      syntax_cond: {
        title:  '❓ Condició desconeguda!',
        hint1:  'S\'ha usat una condició que en Karel no entén. Comprova que has escrit bé el nom de la condició.',
        title2: '💡 Condicions disponibles',
        hint2:  '• <code>veu-paret</code> — hi ha paret al davant<br>• <code>veu-lliure</code> — el camí és lliure<br>• <code>veu-aigua</code> — hi ha una gota al davant<br>• <code>motxilla-buida</code> — la motxilla és buida<br>• <code>motxilla-plena</code> — la motxilla té alguna gota<br>Recorda els guions i les lletres exactes!',
      },
      syntax_instr: {
        title:  '❓ Instrucció inesperada!',
        hint1:  'El parser ha trobat una paraula que no sap com interpretar. Comprova si hi ha un error d\'escriptura.',
        title2: '💡 Ordres disponibles',
        hint2:  'Les ordres que pots usar:<br>• <code>avança</code> • <code>gira.dreta</code> • <code>gira.esquerra</code> • <code>gira.enrere</code><br>• <code>agafa</code> • <code>deixa</code><br>I les estructures: <code>si</code>, <code>sinó</code>, <code>mentre</code>, <code>repeteix</code>, <code>procediment</code>',
      },
    },
    tokens: {
      commands:  ['avança','gira.dreta','gira.esquerra','gira.enrere','agafa','deixa'],
      conditions:['veu-paret','veu-lliure','veu-aigua','motxilla-buida','motxilla-plena'],
      keywords:  ['si','sinó','sino','mentre','repeteix','no','procediment','i','o'],
      if_kw: 'si', while_kw: 'mentre', repeat_kw: 'repeteix',
      else_kw: ['sinó','sino'], proc_kw: 'procediment',
      not_kw: 'no', and_kw: 'i', or_kw: 'o',
    },
    challenges: [
      { id:1, category:'basic', title:'Hola, Karel!', level:'easy',
        desc:"Karel és a l'esquerra. Fes-la avançar fins topar amb la paret del fons. Pista: usa <em>mentre</em> i la condició <em>veu-lliure</em>.",
        csv:'K>,.,.,.,.,P\n.,.,.,.,.,.\n.,.,.,.,.,.',
        code:'// Avança fins la paret\n// Pista: mentre(veu-lliure) { avança }\n\n',
        hints:['Has d\'avançar moltes vegades. En lloc d\'escriure avança repetidament, pensa en un bucle que s\'atura tot sol quan troba la paret.',
               'Solució: mentre(veu-lliure) { avança } — el bucle llegeix la condició cada vegada i s\'atura quan ja no pot avançar.'] },
      { id:2, category:'basic', title:'Recull una gota', level:'easy',
        desc:"Hi ha una gota d'aigua just al davant de Karel. Fes que l'agafi. L'ordre <em>agafa</em> pren l'aigua que hi ha al davant.",
        csv:'K>,A,.\n.,.,.\n.,.,.',
        code:'// Agafa la gota que hi ha al davant\n\n',
        hints:['La gota és just davant de Karel. L\'ordre agafa pren el que hi ha al davant sense necessitat de moure\'s primer.',
               'El programa té una sola instrucció: agafa'] },
      { id:3, category:'basic', title:'Recull totes les gotes', level:'easy',
        desc:"Hi ha diverses gotes disperses en línia recta. Karel ha de recollir-les totes mentre avança fins la paret. Combina <em>mentre</em>, <em>si</em> i <em>agafa</em>.",
        csv:'K>,A,.,A,A,.,A,P',
        code:'// Recull totes les gotes fins arribar a la paret\n\n',
        hints:['No totes les caselles tenen gota. Dins del bucle, comprova primer si hi ha gota amb si(veu-aigua) i, si n\'hi ha, agafa-la.',
               'Estructura completa: mentre(veu-lliure) { si(veu-aigua) { agafa } avança }'] },
      { id:4, category:'basic', title:'Corre i torna', level:'easy',
        desc:"Karel ha d'arribar fins la paret i tornar al punt de partida. Pista: <em>gira.enrere</em> gira 180° en una sola instrucció!",
        csv:'K>,.,.,.,.\n.,.,.,.,.',
        code:'// Arriba fins la paret, gira i torna\n\n',
        hints:['Primer usa un bucle per arribar a la paret. Després has de girar 180°. Hi ha una ordre que ho fa en una sola instrucció!',
               'Usa gira.enrere per girar completament. Llavors un altre bucle mentre(veu-lliure) { avança } per tornar.'] },
      { id:5, category:'basic', title:'Condicions combinades', level:'medium',
        desc:"Usa els operadors <em>i</em> i <em>o</em> per combinar condicions. Per exemple: <code>si(veu-lliure i veu-aigua)</code>. Karel ha d'agafar les gotes NOMÉS si el camí és lliure.",
        csv:'K>,A,.,P\n.,A,.,.\n.,.,.,.',
        code:'// Combina condicions amb \'i\' i \'o\'\n// Exemple: si(veu-lliure i veu-aigua) { agafa }\n\n',
        hints:['L\'operador i combina dues condicions. Pensa: quan vol agafar Karel? Quan hi ha gota I el camí és lliure al mateix temps.',
               'Estructura: mentre(veu-lliure) { si(veu-aigua i veu-lliure) { agafa } avança } — prova-ho!'] },
      { id:6, category:'basic', title:'Primer procediment', level:'medium',
        desc:"Defineix un <em>procediment</em> anomenat <code>mig-gir</code> que giri Karel 180°. Després usa'l per recollir gotes i tornar al punt de partida.",
        csv:'K>,A,A,A,.\n.,.,.,.,.',
        code:'procediment mig-gir {\n  // Escriu les instruccions aquí\n}\n\n// Programa principal\n\n',
        hints:['Un procediment és com crear una ordre nova. Defineix mig-gir com un bloc d\'instruccions i fes-lo servir al programa principal com si fos una ordre normal.',
               'procediment mig-gir { gira.enrere } — Programa principal: mentre(veu-lliure) { si(veu-aigua) { agafa } avança } mig-gir mentre(veu-lliure) { avança }'] },
      { id:7, category:'basic', title:'Recull i diposita', level:'medium',
        desc:"Karel ha de recollir les gotes de la primera fila i dipositar-les a la segona. Usa <em>gira.dreta</em> per baixar de fila i <em>deixa</em> per posar l'aigua on és Karel.",
        csv:'K>,A,A,A,P\n.,.,.,.,P',
        code:'// Pas 1: recull les gotes\n\n// Pas 2: baixa i diposita-les\n\n',
        hints:['Divideix el problema en dues fases: primer recull totes les gotes de la primera fila avançant fins la paret, després baixa a la fila inferior i diposita-les.',
               'Per baixar: gira.dreta avança gira.esquerra — Per dipositar: mentre(veu-lliure) { si(motxilla-plena) { deixa } avança }'] },
      { id:8, category:'basic', title:'Laberint', level:'hard',
        desc:"Karel ha de navegar pel laberint fent servir <em>si</em> i <em>sinó</em> per decidir quan girar. Observa bé el mapa!",
        csv:'K>,.,P,.,P,.,.\n.,.,P,.,.,.,P\n.,.,.,.,.,.,.',
        code:'// Navega el laberint\n// Pista: comprova en quines direccions hi ha parets\n\n',
        hints:['Karel no veu tot el laberint. Ha de decidir a cada pas: puc avançar? Si no, giro. Usa si i sinó per gestionar cada situació.',
               'Estructura base: mentre(veu-lliure) { avança } sinó { gira.dreta } — potser necessites combinar diverses condicions.'] },
      { id:9, category:'basic', title:'Serpenteja (difícil)', level:'hard',
        desc:"Karel ha de recollir totes les gotes anant en ziga-zaga per les dues files. Defineix procediments per organitzar el codi!",
        csv:'K>,A,A,A,P\nP,A,A,A,.',
        code:'procediment baixa-i-recull {\n  // ...\n}\n\n// Programa principal\n\n',
        hints:['Pensa en dues fases: primera fila d\'esquerra a dreta recollint gotes, baixar a la segona i anar de dreta a esquerra. Defineix procediments per a cada fase.',
               'Procediment per canviar de fila: gira.dreta avança gira.dreta — Usa mentre a cada fila: mentre(veu-lliure) { si(veu-aigua) { agafa } avança }'] },
      // ── CODE IN PLACE (Stanford) ──
      { id:101, category:'cp', title:'Welcome Karel', level:'easy',
        desc:"Primer contacte! Karel és a l'esquerra i hi ha una gota al final del camí. Fes-la avançar fins a la gota i que l'agafi. És el teu <em>Hello World</em> robòtic!",
        csv:'K>,.,.,.,A\n.,.,.,.,.',
        code:'// Avança fins la gota i agafa-la\n\n',
        hints:['Karel necessita arribar fins a la gota. Escriu instruccions avança repetides vegades o usa un bucle per arribar-hi.',
               'Solució: mentre(veu-lliure) { avança } agafa — Primer avança fins que no pugui més, després agafa la gota que té al davant.'] },
      { id:102, category:'cp', title:'Puja el graó (Step Up)', level:'easy',
        desc:"Karel ha de pujar un graó format per parets per arribar a la gota de dalt. No existeix <em>gira.dreta</em> directe a Stanford: allà cal girar tres cops a l'esquerra! Prova de definir un <em>procediment</em> per fer-ho.",
        csv:'.,.,.,A\nP,P,.,.\nK>,.,.,.',
        code:'// Defineix un procediment per girar a la dreta\nprocediment gira-dreta {\n  gira.esquerra\n  gira.esquerra\n  gira.esquerra\n}\n\n// Programa principal: puja el graó\n\n',
        hints:['Karel ha d\'anar cap a la dreta, pujar (girar a l\'esquerra = mirar amunt, avançar) i llavors girar a la dreta per agafar la gota.',
               'Ruta: avança avança gira.esquerra avança avança gira-dreta agafa — Fixa\'t com el procediment gira-dreta simplifica el codi!'] },
      { id:103, category:'cp', title:'Recull el diari (Collect Newspaper)', level:'medium',
        desc:"Karel viu dins d'una casa envoltada de parets 🪸 amb una porta al mig. Ha de <strong>sortir</strong>, <strong>recollir el diari</strong> (gota) i <strong>tornar a casa</strong> a la posició original. Descompon el problema en passos!",
        csv:'P,P,.,P,P\nP,K>,.,.,P\nP,P,.,P,P\n.,A,.,.,.',
        code:'// Descomposició: divideix en subproblemes\nprocediment surt-de-casa {\n  // ...\n}\nprocediment recull-diari {\n  // ...\n}\nprocediment torna-a-casa {\n  // ...\n}\n\n// Programa principal\nsurt-de-casa\nrecull-diari\ntorna-a-casa\n',
        hints:['Pensa en 3 fases: 1) Arribar a la porta i sortir, 2) Anar fins al diari i agafar-lo, 3) Tornar pel mateix camí fins la posició inicial.',
               'Ruta de sortida: avança gira.dreta avança avança gira.dreta avança agafa — Retorn: gira.enrere avança gira.esquerra avança avança gira.esquerra avança'] },
      { id:104, category:'cp', title:'Segueix el rastre (Beeper Path)', level:'medium',
        desc:"Un rastre de gotes forma un camí sinuós pel món. Karel ha de seguir el rastre recollint cada gota fins que s'acabi. Usa <em>mentre</em> amb <em>veu-aigua</em> per detectar el camí!",
        csv:'K>,A,A,.,.\n.,.,A,.,.\n.,.,A,A,A',
        code:'// Segueix el rastre de gotes\n// Pista: comprova en quina direcció hi ha aigua\n\n',
        hints:['El rastre gira! Quan no trobis gota al davant, prova de girar a la dreta o a l\'esquerra per trobar la continuació del camí.',
               'Estratègia: a cada pas, agafa la gota, després mira si n\'hi ha al davant. Si no, gira a la dreta i comprova. Si tampoc, gira a l\'esquerra (dues vegades des de la dreta).'] },
      { id:105, category:'cp', title:'Cursa de tanques (Steeple Chase)', level:'hard',
        desc:"Karel ha de córrer d'esquerra a dreta saltant tanques (parets) d'alçada variable fins arribar a la gota final. Quan topi amb una tanca, ha de pujar-la, saltar i baixar a l'altre costat!",
        csv:'.,.,.,.,.,.,.,.,A\n.,P,.,.,.,P,.,.,.\nK>,P,.,.,.,P,.,.,.',
        code:'// Corre i salta les tanques!\nprocediment salta-tanca {\n  // Puja, creua i baixa\n}\n\n// Programa principal\n\n',
        hints:['Divideix en dues accions: córrer (avançar mentre el camí és lliure) i saltar (quan hi ha paret, pujar, creuar el cim i baixar).',
               'Per saltar: gira.esquerra mentre(veu-paret) { avança } avança gira.dreta avança gira.dreta mentre(veu-lliure) { avança } gira.esquerra — Cal refinar-ho, prova pas a pas!'] },
      { id:106, category:'cp', title:'Neteja el món (Cleanup Karel)', level:'hard',
        desc:"Gotes escampades per tot el món! Karel ha d'escombrar tot l'espai en mode <strong>serpentina</strong>: una fila cap a la dreta, baixa, la següent cap a l'esquerra, baixa, i així. Ha de recollir cada gota que trobi.",
        csv:'K>,.,A,.,A,.\n.,A,.,.,.,A\nA,.,.,A,.,.',
        code:'// Escombra el món en serpentina\nprocediment neteja-fila {\n  mentre(veu-lliure) {\n    si(veu-aigua) { agafa }\n    avança\n  }\n  // No oblidis comprovar l\'última casella!\n}\n\nprocediment baixa-i-gira-esquerra {\n  // ...\n}\nprocediment baixa-i-gira-dreta {\n  // ...\n}\n\n// Programa principal\n\n',
        hints:['La serpentina té dues fases que s\'alternen: fila cap a la dreta (acabant contra la paret dreta) i fila cap a l\'esquerra (acabant contra la paret esquerra). A cada canvi, baixa una fila.',
               'Estructura: neteja-fila baixa-i-gira-esquerra neteja-fila baixa-i-gira-dreta neteja-fila — Cada procediment de baixada gira Karel per fregar en sentit contrari.'] },
      ],
      onboard: [
        { icon:'🪼', title:'Hola! Jo soc en Karel',
          body:'Soc un robot que aprèn a moure\'s seguint les teves instruccions. Tu escrius el codi, jo l\'executo! No cal cap experiència prèvia.' },
        { icon:'🗺️', title:'Com funciona la pantalla',
          body:'A l\'<strong>esquerra</strong> veus el meu món: una graella on me moc, recull gotes 🫧 i evito parets 🪸. A la <strong>dreta</strong> escrius el codi. Prem <code>▶ Executa</code> per veure\'m en acció.' },
        { icon:'🚀', title:'Preparat per començar?',
          body:'Fes clic a <strong>🎯 Reptes</strong> i tria el <strong>Repte 1</strong>. Trobaràs pistes comentades al codi per guiar-te. Sort!' },
      ],
  },

  /* ── CASTELLÀ ── */
  es: {
    ui: {
      challenges: '🎯 Retos',
      challenges_title: '🎯 Retos — elige un ejercicio para comenzar',
      toggle_theme: 'Oscuro / Claro', config_btn: 'Configuración',
      run: '▶ Ejecuta', step: '⏭ Paso', stop: '■ Para',
      reset: '↺ Reinicia', clear_log: '⌫ Mensajes',
      speed: 'Velocidad:', bag: 'Mochila:', close: 'Cerrar',
      level_easy: '⭐ Fácil', level_medium: '⭐⭐ Medio', level_hard: '⭐⭐⭐ Difícil',
      lbl_codelang: 'Código:', lbl_userlang: 'Idioma:',
      help_btn: 'Ayuda 💡', help_more: 'Más ayuda →', help_close: 'Cerrar',
      ref_btn: '📋 Referencia', ref_cmd: 'Movimiento', ref_cond: 'Condiciones', ref_kw: 'Estructuras',
      success_title: '¡Reto superado!', success_msg: '¡Excelente! Has resuelto el ejercicio correctamente.',
      success_more: '🎯 Más retos', success_close: 'Continuar',
      onboard_next: 'Siguiente →', onboard_prev: '← Atrás', onboard_start: '¡Empecemos! 🚀', onboard_skip: 'Saltar',
      return_title: '¡Bienvenido de nuevo!', return_subtitle: '¿Qué quieres hacer?',
      return_lbl_challenge: 'Elegir un reto', return_desc_challenge: 'Clásicos o Code in Place (Stanford)',
      return_lbl_csv: 'Cargar un mapa CSV', return_desc_csv: 'Abre un mapa personalizado desde tu ordenador',
      return_lbl_edit: 'Editar mapa', return_desc_edit: 'Crea o modifica un mapa desde el editor visual',
      onboard_tutorial: 'Conoce a Karel en 2 minutos 📖',
      hint_btn: '💡 Pista', hint_locked: '🔒 Pista ({time})', hint_panel_title: '💡 Pista', hint_next: 'Pista 2 →', hint_close: 'Cerrar', hint_exhausted: '¡Ya has visto todas las pistas!', hint_waiting: 'Pista disponible en',
      category_basic: '📘 Retos originales', category_cp: '🎓 Code in Place (Stanford)',
      goal_btn: '🎯 Objetivo', goal_title: '🎯 Objetivo del reto', goal_desc: 'Así debe quedar el mundo cuando el programa termine:',
      restore_btn: '📝 Código inicial', restore_confirm: '¿Quieres recuperar el código inicial del reto? Perderás el código actual.',
    },
    state: { idle: 'detenido', running: 'ejecutando', step: 'paso a paso', error: 'error' },
    speed: ['Muy lento','Lento','Normal','Rápido','Muy rápido','Máximo'],
    log: {
      running: '▶ Ejecutando...', step_mode: '⏭ Modo paso a paso',
      done: '✓ Programa terminado', reset: '↺ Reiniciado',
      map_loaded: 'Mapa cargado ✓', stop_first: '¡Para el programa primero!',
      line: 'línea', inf_loop: '⚠ ¡Bucle infinito! La condición del mientras nunca se hace falsa. Añade una acción que cambie la situación dentro del bucle.',
      deep_rec: '⚠ ¡Recursión infinita! Un procedimiento se llama a sí mismo sin parar. Asegúrate de que haya una condición de parada.', challenge: '🎯 Reto',
    },
    err: {
      wall:      'Karel ha chocado. Usa si(hay-camino) para comprobar el camino antes de avanzar',
      no_water:  'No había gota delante. Usa si(hay-agua) para comprobarlo primero',
      bag_empty: 'La mochila está vacía. Usa coge para recoger gotas antes de soltarlas',
      proc_undef:'Instrucción desconocida. ¿La has escrito bien? Consulta el Panel de Referencia',
      syntax:    "Error de escritura",
    },
    parse: {
      expected:      "Línea {n}: he leído '{got}' pero esperaba '{want}'. ¿Falta un paréntesis o una llave?",
      unexpected:    "Línea {n}: no conozco '{tok}'. ¿Está bien escrito? Mira el Panel de Referencia.",
      unknown_cond:  "Línea {n}: '{tok}' no es una condición conocida. Mira las condiciones en el Panel de Referencia.",
      expected_proc: "Línea {n}: escribe el nombre del procedimiento justo después de la palabra 'procedimiento'.",
    },
    help: {
      wall: {
        title:  '🪸 ¡Karel ha chocado con una pared!',
        hint1:  'Karel ha intentado avanzar pero había una pared delante. Comprueba hacia dónde mira y si el camino está libre.',
        title2: '💡 Cómo evitar el choque',
        hint2:  'Comprueba si el camino es libre <em>antes</em> de avanzar:<br><code>si(hay-camino) { avanza }</code><br>O usa un bucle que se detiene solo:<br><code>mientras(hay-camino) { avanza }</code>',
      },
      no_water: {
        title:  '🫧 ¡No hay ninguna gota delante!',
        hint1:  'Karel ha intentado coger una gota de agua, pero la casilla de delante estaba vacía. La gota debe estar <em>justo delante</em>, no al lado ni detrás.',
        title2: '💡 Cómo coger de forma segura',
        hint2:  'Comprueba si hay gota <em>antes</em> de cogerla:<br><code>si(hay-agua) { coge }</code><br>Combínalo con un bucle para recoger todas:<br><code>mientras(hay-camino) {<br>&nbsp;&nbsp;si(hay-agua) { coge }<br>&nbsp;&nbsp;avanza<br>}</code>',
      },
      bag_empty: {
        title:  '🎒 ¡La mochila está vacía!',
        hint1:  'Karel ha intentado soltar una gota pero no tiene ninguna en la mochila. Primero hay que recoger alguna gota con la orden <code>coge</code>.',
        title2: '💡 Cómo soltar de forma segura',
        hint2:  'Comprueba si la mochila tiene alguna gota antes de soltarla:<br><code>si(mochila-llena) { suelta }</code><br>Recuerda: <code>coge</code> recoge la gota de delante, <code>suelta</code> deja una gota <em>aquí</em> donde estás.',
      },
      proc_undef: {
        title:  '🤔 ¡Instrucción desconocida!',
        hint1:  'Karel ha encontrado una palabra que no reconoce. Quizás hay un error de escritura en una orden o en el nombre de un procedimiento que has definido.',
        title2: '💡 Cómo encontrar el error',
        hint2:  '• Comprueba que la orden es una de las disponibles: <code>avanza</code>, <code>coge</code>, <code>suelta</code>, etc.<br>• Si es un procedimiento propio, asegúrate de que el nombre es <em>exactamente igual</em> donde lo defines y donde lo usas.<br>• Las tildes y los guiones importan.',
      },
      inf_loop: {
        title:  '🔁 ¡Bucle infinito detectado!',
        hint1:  'El programa ha repetido lo mismo más de 50.000 veces sin parar. La condición del bucle <code>mientras</code> nunca ha dejado de ser cierta.',
        title2: '💡 Cómo arreglarlo',
        hint2:  'Asegúrate de que dentro del bucle hay una acción que hace que Karel avance y la condición cambie:<br><code>mientras(hay-camino) {<br>&nbsp;&nbsp;avanza  ← esto cambia la situación<br>}</code><br>Si la condición es siempre cierta, el programa no acabará nunca.',
      },
      deep_rec: {
        title:  '🌀 ¡Recursión demasiado profunda!',
        hint1:  'Un procedimiento se ha llamado a sí mismo (o a otro) más de 50 veces seguidas. Probablemente hay un ciclo infinito entre procedimientos.',
        title2: '💡 Cómo arreglarlo',
        hint2:  'Comprueba que tus procedimientos no se llamen entre sí de forma indefinida. Cada procedimiento debería hacer un trabajo concreto y acabar sin volver a llamarse a sí mismo.',
      },
      syntax_brace: {
        title:  '{ } ¡Falta una llave!',
        hint1:  'El parser espera un <code>{</code> o un <code>}</code> pero no lo encuentra. Cada bloque de instrucciones debe estar rodeado de llaves.',
        title2: '💡 Estructura correcta',
        hint2:  'Cada estructura necesita sus llaves:<br><code>si(hay-camino) {<br>&nbsp;&nbsp;avanza<br>}</code><br>Atención: cada <code>{</code> debe tener su <code>}</code> de cierre.',
      },
      syntax_paren: {
        title:  '( ) ¡Falta un paréntesis!',
        hint1:  'El parser espera un <code>(</code> o un <code>)</code>. Las condiciones de los bloques deben ir entre paréntesis.',
        title2: '💡 Estructura correcta',
        hint2:  'Ejemplos correctos:<br><code>si(hay-camino) { avanza }</code><br><code>mientras(hay-agua) { coge }</code><br><code>repite(3) { avanza }</code>',
      },
      syntax_number: {
        title:  '🔢 ¡Falta un número!',
        hint1:  'Después de <code>repite</code> hay que poner un número que indique cuántas veces se quiere repetir.',
        title2: '💡 Cómo usar repite',
        hint2:  'La estructura es: <code>repite(<em>N</em>) { ... }</code><br>Ejemplos:<br><code>repite(4) { avanza }</code><br><code>repite(10) {<br>&nbsp;&nbsp;si(hay-agua) { coge }<br>&nbsp;&nbsp;avanza<br>}</code>',
      },
      syntax_cond: {
        title:  '❓ ¡Condición desconocida!',
        hint1:  'Se ha usado una condición que Karel no entiende. Comprueba que has escrito bien el nombre de la condición.',
        title2: '💡 Condiciones disponibles',
        hint2:  '• <code>hay-pared</code> — hay pared delante<br>• <code>hay-camino</code> — el camino está libre<br>• <code>hay-agua</code> — hay una gota delante<br>• <code>mochila-vacía</code> — la mochila está vacía<br>• <code>mochila-llena</code> — la mochila tiene alguna gota',
      },
      syntax_instr: {
        title:  '❓ ¡Instrucción inesperada!',
        hint1:  'El parser ha encontrado una palabra que no sabe cómo interpretar. Comprueba si hay un error de escritura.',
        title2: '💡 Órdenes disponibles',
        hint2:  'Las órdenes que puedes usar:<br>• <code>avanza</code> • <code>gira.derecha</code> • <code>gira.izquierda</code> • <code>gira.atrás</code><br>• <code>coge</code> • <code>suelta</code><br>Y las estructuras: <code>si</code>, <code>sino</code>, <code>mientras</code>, <code>repite</code>, <code>procedimiento</code>',
      },
    },
    tokens: {
      commands:  ['avanza','gira.derecha','gira.izquierda','gira.atrás','coge','suelta'],
      conditions:['hay-pared','hay-camino','hay-agua','mochila-vacía','mochila-llena'],
      keywords:  ['si','sino','mientras','repite','no','procedimiento','y','o'],
      if_kw: 'si', while_kw: 'mientras', repeat_kw: 'repite',
      else_kw: ['sino'], proc_kw: 'procedimiento',
      not_kw: 'no', and_kw: 'y', or_kw: 'o',
    },
    challenges: [
      { id:1, category:'basic', title:'¡Hola, Karel!', level:'easy',
        desc:"Karel está a la izquierda. Hazla avanzar hasta topar con la pared del fondo. Pista: usa <em>mientras</em> y la condición <em>hay-camino</em>.",
        csv:'K>,.,.,.,.,P\n.,.,.,.,.,.\n.,.,.,.,.,.',
        code:'// Avanza hasta la pared\n// Pista: mientras(hay-camino) { avanza }\n\n',
        hints:['Tienes que avanzar muchas veces. En lugar de escribir avanza repetidamente, piensa en un bucle que se detiene solo al encontrar la pared.',
               'Solución: mientras(hay-camino) { avanza } — el bucle comprueba la condición cada vez y se detiene cuando no puede avanzar.'] },
      { id:2, category:'basic', title:'Recoge una gota', level:'easy',
        desc:"Hay una gota de agua justo delante de Karel. Haz que la recoja. La orden <em>coge</em> toma el agua que hay delante.",
        csv:'K>,A,.\n.,.,.\n.,.,.',
        code:'// Recoge la gota que hay delante\n\n',
        hints:['La gota está justo delante de Karel. La orden coge toma lo que hay delante sin necesidad de moverse primero.',
               'El programa tiene una sola instrucción: coge'] },
      { id:3, category:'basic', title:'Recoge todas las gotas', level:'easy',
        desc:"Hay varias gotas dispersas en línea recta. Karel debe recogerlas todas mientras avanza hasta la pared. Combina <em>mientras</em>, <em>si</em> y <em>coge</em>.",
        csv:'K>,A,.,A,A,.,A,P',
        code:'// Recoge todas las gotas hasta llegar a la pared\n\n',
        hints:['No todas las casillas tienen gota. Dentro del bucle, comprueba primero si hay gota con si(hay-agua) y, si la hay, recógela.',
               'Estructura completa: mientras(hay-camino) { si(hay-agua) { coge } avanza }'] },
      { id:4, category:'basic', title:'Corre y vuelve', level:'easy',
        desc:"Karel debe llegar hasta la pared y volver al punto de partida. Pista: <em>gira.atrás</em> gira 180° en una sola instrucción!",
        csv:'K>,.,.,.,.\n.,.,.,.,.',
        code:'// Llega hasta la pared, gira y vuelve\n\n',
        hints:['Primero usa un bucle para llegar a la pared. Luego tienes que girar 180°. ¡Hay una orden que lo hace en una sola instrucción!',
               'Usa gira.atrás para girar completamente. Luego otro bucle mientras(hay-camino) { avanza } para volver.'] },
      { id:5, category:'basic', title:'Condiciones combinadas', level:'medium',
        desc:"Usa los operadores <em>y</em> y <em>o</em> para combinar condiciones. Por ejemplo: <code>si(hay-camino y hay-agua)</code>. Karel debe coger las gotas SOLO si el camino es libre.",
        csv:'K>,A,.,P\n.,A,.,.\n.,.,.,.',
        code:'// Combina condiciones con \'y\' y \'o\'\n// Ejemplo: si(hay-camino y hay-agua) { coge }\n\n',
        hints:['El operador y combina dos condiciones. Piensa: ¿cuándo quiere coger Karel? Cuando hay gota Y el camino está libre al mismo tiempo.',
               'Estructura: mientras(hay-camino) { si(hay-agua y hay-camino) { coge } avanza } — ¡pruébalo!'] },
      { id:6, category:'basic', title:'Primer procedimiento', level:'medium',
        desc:"Define un <em>procedimiento</em> llamado <code>medio-giro</code> que gire Karel 180°. Luego úsalo para recoger gotas y volver al punto de partida.",
        csv:'K>,A,A,A,.\n.,.,.,.,.',
        code:'procedimiento medio-giro {\n  // Escribe las instrucciones aquí\n}\n\n// Programa principal\n\n',
        hints:['Un procedimiento es como crear una nueva orden. Define medio-giro como un bloque de instrucciones y úsalo en el programa principal como si fuera una orden normal.',
               'procedimiento medio-giro { gira.atrás } — Programa principal: mientras(hay-camino) { si(hay-agua) { coge } avanza } medio-giro mientras(hay-camino) { avanza }'] },
      { id:7, category:'basic', title:'Recoge y deposita', level:'medium',
        desc:"Karel debe recoger las gotas de la primera fila y depositarlas en la segunda. Usa <em>gira.derecha</em> para bajar de fila y <em>suelta</em> para poner el agua donde está Karel.",
        csv:'K>,A,A,A,P\n.,.,.,.,P',
        code:'// Paso 1: recoge las gotas\n\n// Paso 2: baja y deposítalas\n\n',
        hints:['Divide el problema en dos fases: primero recoge todas las gotas de la primera fila avanzando hasta la pared, luego baja a la fila inferior y deposítalas.',
               'Para bajar: gira.derecha avanza gira.izquierda — Para depositar: mientras(hay-camino) { si(mochila-llena) { suelta } avanza }'] },
      { id:8, category:'basic', title:'Laberinto', level:'hard',
        desc:"Karel debe navegar por el laberinto usando <em>si</em> y <em>sino</em> para decidir cuándo girar. ¡Observa bien el mapa!",
        csv:'K>,.,P,.,P,.,.\n.,.,P,.,.,.,P\n.,.,.,.,.,.,.',
        code:'// Navega el laberinto\n// Pista: comprueba en qué direcciones hay paredes\n\n',
        hints:['Karel no ve todo el laberinto. Tiene que decidir en cada paso: ¿puedo avanzar? Si no, giro. Usa si y sino para gestionar cada situación.',
               'Estructura base: mientras(hay-camino) { avanza } sino { gira.derecha } — quizás necesitas combinar varias condiciones.'] },
      { id:9, category:'basic', title:'Serpentea (difícil)', level:'hard',
        desc:"Karel debe recoger todas las gotas en zigzag por las dos filas. ¡Define procedimientos para organizar el código!",
        csv:'K>,A,A,A,P\nP,A,A,A,.',
        code:'procedimiento baja-y-recoge {\n  // ...\n}\n\n// Programa principal\n\n',
        hints:['Piensa en dos fases: primera fila de izquierda a derecha recogiendo gotas, bajar a la segunda y ir de derecha a izquierda. Define procedimientos para cada fase.',
               'Procedimiento para cambiar de fila: gira.derecha avanza gira.derecha — Usa mientras en cada fila: mientras(hay-camino) { si(hay-agua) { coge } avanza }'] },
      // ── CODE IN PLACE (Stanford) ──
      { id:101, category:'cp', title:'Welcome Karel', level:'easy',
        desc:"¡Primer contacto! Karel está a la izquierda y hay una gota al final del camino. Hazla avanzar hasta la gota y que la recoja. ¡Es tu <em>Hello World</em> robótico!",
        csv:'K>,.,.,.,A\n.,.,.,.,.',
        code:'// Avanza hasta la gota y recógela\n\n',
        hints:['Karel necesita llegar hasta la gota. Escribe instrucciones avanza repetidas veces o usa un bucle para llegar.',
               'Solución: mientras(hay-camino) { avanza } coge — Primero avanza hasta que no pueda más, luego coge la gota que tiene delante.'] },
      { id:102, category:'cp', title:'Sube el escalón (Step Up)', level:'easy',
        desc:"Karel debe subir un escalón formado por paredes para llegar a la gota de arriba. En Stanford no existe <em>gira.derecha</em> directo: ¡hay que girar tres veces a la izquierda! Prueba a definir un <em>procedimiento</em>.",
        csv:'.,.,.,A\nP,P,.,.\nK>,.,.,.',
        code:'// Define un procedimiento para girar a la derecha\nprocedimiento gira-derecha {\n  gira.izquierda\n  gira.izquierda\n  gira.izquierda\n}\n\n// Programa principal: sube el escalón\n\n',
        hints:['Karel debe ir a la derecha, subir (girar a la izquierda = mirar arriba, avanzar) y luego girar a la derecha para coger la gota.',
               'Ruta: avanza avanza gira.izquierda avanza avanza gira-derecha coge — ¡Fíjate cómo el procedimiento gira-derecha simplifica el código!'] },
      { id:103, category:'cp', title:'Recoge el periódico (Collect Newspaper)', level:'medium',
        desc:"Karel vive dentro de una casa rodeada de paredes 🪸 con una puerta en el centro. Debe <strong>salir</strong>, <strong>recoger el periódico</strong> (gota) y <strong>volver a casa</strong> a la posición original. ¡Descompón el problema en pasos!",
        csv:'P,P,.,P,P\nP,K>,.,.,P\nP,P,.,P,P\n.,A,.,.,.',
        code:'// Descomposición: divide en subproblemas\nprocedimiento sal-de-casa {\n  // ...\n}\nprocedimiento recoge-periodico {\n  // ...\n}\nprocedimiento vuelve-a-casa {\n  // ...\n}\n\n// Programa principal\nsal-de-casa\nrecoge-periodico\nvuelve-a-casa\n',
        hints:['Piensa en 3 fases: 1) Llegar a la puerta y salir, 2) Ir hasta el periódico y recogerlo, 3) Volver por el mismo camino hasta la posición inicial.',
               'Ruta de salida: avanza gira.derecha avanza avanza gira.derecha avanza coge — Retorno: gira.atrás avanza gira.izquierda avanza avanza gira.izquierda avanza'] },
      { id:104, category:'cp', title:'Sigue el rastro (Beeper Path)', level:'medium',
        desc:"Un rastro de gotas forma un camino sinuoso por el mundo. Karel debe seguir el rastro recogiendo cada gota hasta que se acabe. ¡Usa <em>mientras</em> con <em>hay-agua</em> para detectar el camino!",
        csv:'K>,A,A,.,.\n.,.,A,.,.\n.,.,A,A,A',
        code:'// Sigue el rastro de gotas\n// Pista: comprueba en qué dirección hay agua\n\n',
        hints:['¡El rastro gira! Cuando no encuentres gota delante, prueba a girar a la derecha o a la izquierda para encontrar la continuación del camino.',
               'Estrategia: en cada paso, coge la gota, luego mira si hay otra delante. Si no, gira a la derecha y comprueba. Si tampoco, gira a la izquierda (dos veces desde la derecha).'] },
      { id:105, category:'cp', title:'Carrera de vallas (Steeple Chase)', level:'hard',
        desc:"Karel debe correr de izquierda a derecha saltando vallas (paredes) de altura variable hasta llegar a la gota final. Cuando tope con una valla, ¡debe subirla, saltar y bajar al otro lado!",
        csv:'.,.,.,.,.,.,.,.,A\n.,P,.,.,.,P,.,.,.\nK>,P,.,.,.,P,.,.,.',
        code:'// ¡Corre y salta las vallas!\nprocedimiento salta-valla {\n  // Sube, cruza y baja\n}\n\n// Programa principal\n\n',
        hints:['Divide en dos acciones: correr (avanzar mientras el camino esté libre) y saltar (cuando hay pared, subir, cruzar la cima y bajar).',
               'Para saltar: gira.izquierda mientras(hay-pared) { avanza } avanza gira.derecha avanza gira.derecha mientras(hay-camino) { avanza } gira.izquierda — ¡Hay que refinarlo, prueba paso a paso!'] },
      { id:106, category:'cp', title:'Limpia el mundo (Cleanup Karel)', level:'hard',
        desc:"¡Gotas esparcidas por todo el mundo! Karel debe barrer todo el espacio en modo <strong>serpentina</strong>: una fila hacia la derecha, baja, la siguiente hacia la izquierda, baja, y así. Debe recoger cada gota que encuentre.",
        csv:'K>,.,A,.,A,.\n.,A,.,.,.,A\nA,.,.,A,.,.',
        code:'// Barre el mundo en serpentina\nprocedimiento limpia-fila {\n  mientras(hay-camino) {\n    si(hay-agua) { coge }\n    avanza\n  }\n  // ¡No olvides comprobar la última casilla!\n}\n\nprocedimiento baja-y-gira-izquierda {\n  // ...\n}\nprocedimiento baja-y-gira-derecha {\n  // ...\n}\n\n// Programa principal\n\n',
        hints:['La serpentina tiene dos fases que se alternan: fila hacia la derecha (acabando contra la pared derecha) y fila hacia la izquierda (acabando contra la pared izquierda). En cada cambio, baja una fila.',
               'Estructura: limpia-fila baja-y-gira-izquierda limpia-fila baja-y-gira-derecha limpia-fila — Cada procedimiento de bajada gira Karel para barrer en sentido contrario.'] },
      ],
      onboard: [
        { icon:'🪼', title:'¡Hola! Soy Karel',
          body:'Soy un robot que aprende a moverse siguiendo tus instrucciones. ¡Tú escribes el código, yo lo ejecuto! No hace falta ninguna experiencia previa.' },
        { icon:'🗺️', title:'Cómo funciona la pantalla',
          body:'A la <strong>izquierda</strong> ves mi mundo: una cuadrícula donde me muevo, recojo gotas 🫧 y evito paredes 🪸. A la <strong>derecha</strong> escribes el código. Pulsa <code>▶ Ejecuta</code> para verme en acción.' },
        { icon:'🚀', title:'¿Listo para empezar?',
          body:'Haz clic en <strong>🎯 Retos</strong> y elige el <strong>Reto 1</strong>. Encontrarás pistas comentadas en el código para guiarte. ¡Buena suerte!' },
      ],
  },

  /* ── ANGLÈS ── */
  en: {
    ui: {
      challenges: '🎯 Challenges',
      challenges_title: '🎯 Challenges — pick an exercise to start',
      toggle_theme: 'Dark / Light', config_btn: 'Settings',
      run: '▶ Run', step: '⏭ Step', stop: '■ Stop',
      reset: '↺ Reset', clear_log: '⌫ Messages',
      speed: 'Speed:', bag: 'Bag:', close: 'Close',
      level_easy: '⭐ Easy', level_medium: '⭐⭐ Medium', level_hard: '⭐⭐⭐ Hard',
      lbl_codelang: 'Code:', lbl_userlang: 'Language:',
      help_btn: 'Help 💡', help_more: 'More help →', help_close: 'Close',
      ref_btn: '📋 Reference', ref_cmd: 'Movement', ref_cond: 'Conditions', ref_kw: 'Structures',
      success_title: 'Challenge complete!', success_msg: 'Excellent! You solved the exercise correctly.',
      success_more: '🎯 More challenges', success_close: 'Continue',
      onboard_next: 'Next →', onboard_prev: '← Back', onboard_start: "Let's go! 🚀", onboard_skip: 'Skip',
      return_title: 'Welcome back!', return_subtitle: 'What do you want to do?',
      return_lbl_challenge: 'Pick a challenge', return_desc_challenge: 'Classic exercises or Code in Place (Stanford)',
      return_lbl_csv: 'Load a CSV map', return_desc_csv: 'Open a custom map from your computer',
      return_lbl_edit: 'Edit map', return_desc_edit: 'Create or modify a map with the visual editor',
      onboard_tutorial: 'Meet Karel in 2 minutes 📖',
      hint_btn: '💡 Hint', hint_locked: '🔒 Hint ({time})', hint_panel_title: '💡 Hint', hint_next: 'Hint 2 →', hint_close: 'Close', hint_exhausted: 'You\'ve seen all the hints!', hint_waiting: 'Hint available in',
      category_basic: '📘 Original challenges', category_cp: '🎓 Code in Place (Stanford)',
      goal_btn: '🎯 Goal', goal_title: '🎯 Challenge goal', goal_desc: 'This is how the world should look when the program finishes:',
      restore_btn: '📝 Starter code', restore_confirm: 'Restore the original starter code? You will lose your current code.',
    },
    state: { idle: 'stopped', running: 'running', step: 'step mode', error: 'error' },
    speed: ['Very slow','Slow','Normal','Fast','Very fast','Maximum'],
    log: {
      running: '▶ Running...', step_mode: '⏭ Step mode',
      done: '✓ Program done', reset: '↺ Reset',
      map_loaded: 'Map loaded ✓', stop_first: 'Stop the program first!',
      line: 'line', inf_loop: '⚠ Infinite loop! The while condition never becomes false. Add an action inside the loop that changes the situation.',
      deep_rec: '⚠ Infinite recursion! A procedure keeps calling itself. Make sure there is a stopping condition.', challenge: '🎯 Challenge',
    },
    err: {
      wall:      'Karel crashed! Use if(path-clear) to check the path before moving',
      no_water:  'No drop in front. Use if(water-ahead) to check first',
      bag_empty: 'Bag is empty! Use grab to collect drops before dropping them',
      proc_undef:'Unknown instruction. Spelled correctly? Check the Reference Panel',
      syntax:    "Spelling error",
    },
    parse: {
      expected:      "Line {n}: I found '{got}' but expected '{want}'. Missing a parenthesis or brace?",
      unexpected:    "Line {n}: I don't know '{tok}'. Check spelling or see the Reference Panel.",
      unknown_cond:  "Line {n}: '{tok}' is not a known condition. See conditions in the Reference Panel.",
      expected_proc: "Line {n}: write the procedure name right after the word 'procedure'.",
    },
    help: {
      wall: {
        title:  '🪸 Karel hit a wall!',
        hint1:  'Karel tried to move forward but there was a wall in the way. Check which direction Karel is facing and whether the path ahead is clear.',
        title2: '💡 How to avoid the crash',
        hint2:  'Check if the path is clear <em>before</em> moving:<br><code>if(path-clear) { move }</code><br>Or use a loop that stops automatically:<br><code>while(path-clear) { move }</code>',
      },
      no_water: {
        title:  '🫧 No water drop in front!',
        hint1:  'Karel tried to grab a water drop, but the cell ahead was empty. The drop must be <em>directly in front</em> of Karel.',
        title2: '💡 How to grab safely',
        hint2:  'Check if there\'s water <em>before</em> grabbing:<br><code>if(water-ahead) { grab }</code><br>Combine with a loop to collect all drops:<br><code>while(path-clear) {<br>&nbsp;&nbsp;if(water-ahead) { grab }<br>&nbsp;&nbsp;move<br>}</code>',
      },
      bag_empty: {
        title:  '🎒 The bag is empty!',
        hint1:  'Karel tried to drop a water drop but doesn\'t have any in the bag. First you need to pick some up using the <code>grab</code> command.',
        title2: '💡 How to drop safely',
        hint2:  'Check if the bag has a drop before dropping it:<br><code>if(bag-full) { drop }</code><br>Remember: <code>grab</code> picks up the drop in front, <code>drop</code> places a drop <em>here</em> where Karel is.',
      },
      proc_undef: {
        title:  '🤔 Unknown instruction!',
        hint1:  'Karel found a word it doesn\'t recognise. There may be a spelling mistake in a command or in the name of a procedure you defined.',
        title2: '💡 How to find the error',
        hint2:  '• Check that the command is one of the available ones: <code>move</code>, <code>grab</code>, <code>drop</code>, etc.<br>• If it\'s your own procedure, make sure the name is <em>exactly the same</em> where you define it and where you use it.<br>• Hyphens matter!',
      },
      inf_loop: {
        title:  '🔁 Infinite loop detected!',
        hint1:  'The program repeated the same thing more than 50,000 times without stopping. The condition in the <code>while</code> loop never became false.',
        title2: '💡 How to fix it',
        hint2:  'Make sure that inside the loop there\'s an action that makes Karel progress so the condition can change:<br><code>while(path-clear) {<br>&nbsp;&nbsp;move  ← this changes the situation<br>}</code><br>If the condition is always true, the program will never end.',
      },
      deep_rec: {
        title:  '🌀 Recursion too deep!',
        hint1:  'A procedure called itself (or another procedure) more than 50 times in a row. There\'s probably an endless cycle between procedures.',
        title2: '💡 How to fix it',
        hint2:  'Make sure your procedures don\'t call each other indefinitely. Each procedure should do a specific job and finish without calling itself again.',
      },
      syntax_brace: {
        title:  '{ } Missing curly brace!',
        hint1:  'The parser expected a <code>{</code> or <code>}</code> but didn\'t find one. Every block of instructions must be surrounded by curly braces.',
        title2: '💡 Correct structure',
        hint2:  'Every structure needs its braces:<br><code>if(path-clear) {<br>&nbsp;&nbsp;move<br>}</code><br>Note: every <code>{</code> must have a matching <code>}</code> to close it.',
      },
      syntax_paren: {
        title:  '( ) Missing parenthesis!',
        hint1:  'The parser expected a <code>(</code> or <code>)</code>. Conditions in blocks must go inside parentheses.',
        title2: '💡 Correct structure',
        hint2:  'Correct examples:<br><code>if(path-clear) { move }</code><br><code>while(water-ahead) { grab }</code><br><code>repeat(3) { move }</code>',
      },
      syntax_number: {
        title:  '🔢 Missing number!',
        hint1:  'After <code>repeat</code> you need to put a number saying how many times to repeat.',
        title2: '💡 How to use repeat',
        hint2:  'The structure is: <code>repeat(<em>N</em>) { ... }</code><br>Examples:<br><code>repeat(4) { move }</code><br><code>repeat(10) {<br>&nbsp;&nbsp;if(water-ahead) { grab }<br>&nbsp;&nbsp;move<br>}</code>',
      },
      syntax_cond: {
        title:  '❓ Unknown condition!',
        hint1:  'A condition was used that Karel doesn\'t understand. Check that you\'ve spelled the condition name correctly.',
        title2: '💡 Available conditions',
        hint2:  '• <code>wall-ahead</code> — there\'s a wall in front<br>• <code>path-clear</code> — the path is clear<br>• <code>water-ahead</code> — there\'s a drop in front<br>• <code>bag-empty</code> — the bag is empty<br>• <code>bag-full</code> — the bag has at least one drop',
      },
      syntax_instr: {
        title:  '❓ Unexpected instruction!',
        hint1:  'The parser found a word it doesn\'t know how to interpret. Check for a spelling mistake.',
        title2: '💡 Available commands',
        hint2:  'Commands you can use:<br>• <code>move</code> • <code>turn.right</code> • <code>turn.left</code> • <code>turn.around</code><br>• <code>grab</code> • <code>drop</code><br>And structures: <code>if</code>, <code>else</code>, <code>while</code>, <code>repeat</code>, <code>procedure</code>',
      },
    },
    tokens: {
      commands:  ['move','turn.right','turn.left','turn.around','grab','drop'],
      conditions:['wall-ahead','path-clear','water-ahead','bag-empty','bag-full'],
      keywords:  ['if','else','while','repeat','not','procedure','and','or'],
      if_kw: 'if', while_kw: 'while', repeat_kw: 'repeat',
      else_kw: ['else'], proc_kw: 'procedure',
      not_kw: 'not', and_kw: 'and', or_kw: 'or',
    },
    challenges: [
      { id:1, category:'basic', title:'Hello, Karel!', level:'easy',
        desc:"Karel is on the left. Make it move until it hits the end wall. Hint: use <em>while</em> and the condition <em>path-clear</em>.",
        csv:'K>,.,.,.,.,P\n.,.,.,.,.,.\n.,.,.,.,.,.',
        code:'// Move until the wall\n// Hint: while(path-clear) { move }\n\n',
        hints:['You need to move many times. Instead of writing move over and over, think of a loop that stops by itself when it hits the wall.',
               'Solution: while(path-clear) { move } — the loop checks the condition each time and stops when Karel can\'t move.'] },
      { id:2, category:'basic', title:'Grab a drop', level:'easy',
        desc:"There is a water drop right in front of Karel. Make it grab it. The <em>grab</em> command picks up the water in front of Karel.",
        csv:'K>,A,.\n.,.,.\n.,.,.',
        code:'// Grab the drop in front\n\n',
        hints:['The drop is right in front of Karel. The grab command picks up whatever is in front, no need to move first.',
               'The program is just one instruction: grab'] },
      { id:3, category:'basic', title:'Grab all drops', level:'easy',
        desc:"There are several drops scattered in a straight line. Karel must grab them all while moving to the wall. Combine <em>while</em>, <em>if</em> and <em>grab</em>.",
        csv:'K>,A,.,A,A,.,A,P',
        code:'// Grab all drops until reaching the wall\n\n',
        hints:['Not every cell has a drop. Inside the loop, first check if there is a drop with if(water-ahead) and only then grab it.',
               'Full structure: while(path-clear) { if(water-ahead) { grab } move }'] },
      { id:4, category:'basic', title:'Run and return', level:'easy',
        desc:"Karel must reach the wall and come back to the start. Hint: <em>turn.around</em> rotates 180° in a single command!",
        csv:'K>,.,.,.,.\n.,.,.,.,.',
        code:'// Reach the wall, turn around and come back\n\n',
        hints:['First use a loop to reach the wall. Then you need to turn 180°. There is a command that does it in a single instruction!',
               'Use turn.around to rotate fully. Then another loop while(path-clear) { move } to go back.'] },
      { id:5, category:'basic', title:'Combined conditions', level:'medium',
        desc:"Use the <em>and</em> and <em>or</em> operators to combine conditions. For example: <code>if(path-clear and water-ahead)</code>. Karel must grab drops ONLY if the path is clear.",
        csv:'K>,A,.,P\n.,A,.,.\n.,.,.,.',
        code:'// Combine conditions with \'and\' and \'or\'\n// Example: if(path-clear and water-ahead) { grab }\n\n',
        hints:['The and operator combines two conditions. Think: when does Karel want to grab? When there is water AND the path is clear at the same time.',
               'Structure: while(path-clear) { if(water-ahead and path-clear) { grab } move } — try it!'] },
      { id:6, category:'basic', title:'First procedure', level:'medium',
        desc:"Define a <em>procedure</em> called <code>half-turn</code> that rotates Karel 180°. Then use it to grab drops and return to the starting point.",
        csv:'K>,A,A,A,.\n.,.,.,.,.',
        code:'procedure half-turn {\n  // Write instructions here\n}\n\n// Main program\n\n',
        hints:['A procedure is like creating a new command. Define half-turn as a block of instructions and use it in the main program like any other command.',
               'procedure half-turn { turn.around } — Main program: while(path-clear) { if(water-ahead) { grab } move } half-turn while(path-clear) { move }'] },
      { id:7, category:'basic', title:'Grab and drop', level:'medium',
        desc:"Karel must grab the drops from the first row and drop them in the second. Use <em>turn.right</em> to go down a row and <em>drop</em> to place the water where Karel is.",
        csv:'K>,A,A,A,P\n.,.,.,.,P',
        code:'// Step 1: grab drops from the first row\n\n// Step 2: go down and drop them\n\n',
        hints:['Split the problem into two phases: first collect all drops from the first row moving to the wall, then go down to the second row and drop them.',
               'To go down: turn.right move turn.left — To drop: while(path-clear) { if(bag-full) { drop } move }'] },
      { id:8, category:'basic', title:'Maze', level:'hard',
        desc:"Karel must navigate the maze using <em>if</em> and <em>else</em> to decide when to turn. Look carefully at the map!",
        csv:'K>,.,P,.,P,.,.\n.,.,P,.,.,.,P\n.,.,.,.,.,.,.',
        code:'// Navigate the maze\n// Hint: check which directions have walls\n\n',
        hints:['Karel can\'t see the whole maze. It must decide at each step: can I move? If not, turn. Use if and else to handle each situation.',
               'Base structure: while(path-clear) { move } else { turn.right } — you may need to combine several conditions.'] },
      { id:9, category:'basic', title:'Zigzag (hard)', level:'hard',
        desc:"Karel must grab all drops in a zigzag pattern through both rows. Define procedures to organize the code into small parts!",
        csv:'K>,A,A,A,P\nP,A,A,A,.',
        code:'procedure go-down-grab {\n  // ...\n}\n\n// Main program\n\n',
        hints:['Think in two phases: first row left to right collecting drops, go down to the second and go right to left. Define procedures for each phase.',
               'Procedure to change row: turn.right move turn.right — Use while on each row: while(path-clear) { if(water-ahead) { grab } move }'] },
      // ── CODE IN PLACE (Stanford) ──
      { id:101, category:'cp', title:'Welcome Karel', level:'easy',
        desc:"First contact! Karel is on the left and there is a drop at the end of the path. Make it walk to the drop and grab it. This is your robotic <em>Hello World</em>!",
        csv:'K>,.,.,.,A\n.,.,.,.,.',
        code:'// Walk to the drop and grab it\n\n',
        hints:['Karel needs to reach the drop. Write move instructions repeatedly or use a loop to get there.',
               'Solution: while(path-clear) { move } grab — First walk until you can\'t, then grab the drop in front.'] },
      { id:102, category:'cp', title:'Step Up', level:'easy',
        desc:"Karel must climb a step made of walls to reach the drop above. At Stanford there is no direct <em>turn.right</em>: you must turn left three times! Try defining a <em>procedure</em> for it.",
        csv:'.,.,.,A\nP,P,.,.\nK>,.,.,.',
        code:'// Define a procedure to turn right\nprocedure turn-right {\n  turn.left\n  turn.left\n  turn.left\n}\n\n// Main program: climb the step\n\n',
        hints:['Karel must go right, go up (turn left = face up, move) and then turn right to grab the drop.',
               'Route: move move turn.left move move turn-right grab — Notice how the turn-right procedure simplifies the code!'] },
      { id:103, category:'cp', title:'Collect Newspaper', level:'medium',
        desc:"Karel lives inside a house surrounded by walls 🪸 with a door in the middle. It must <strong>exit</strong>, <strong>collect the newspaper</strong> (drop) and <strong>return home</strong> to the original position. Decompose the problem into steps!",
        csv:'P,P,.,P,P\nP,K>,.,.,P\nP,P,.,P,P\n.,A,.,.,.',
        code:'// Decomposition: split into subproblems\nprocedure exit-house {\n  // ...\n}\nprocedure get-newspaper {\n  // ...\n}\nprocedure return-home {\n  // ...\n}\n\n// Main program\nexit-house\nget-newspaper\nreturn-home\n',
        hints:['Think in 3 phases: 1) Reach the door and exit, 2) Go to the newspaper and grab it, 3) Return along the same path to the starting position.',
               'Exit route: move turn.right move move turn.right move grab — Return: turn.around move turn.left move move turn.left move'] },
      { id:104, category:'cp', title:'Beeper Path', level:'medium',
        desc:"A trail of drops forms a winding path through the world. Karel must follow the trail, grabbing each drop until it ends. Use <em>while</em> with <em>water-ahead</em> to detect the path!",
        csv:'K>,A,A,.,.\n.,.,A,.,.\n.,.,A,A,A',
        code:'// Follow the trail of drops\n// Hint: check which direction has water\n\n',
        hints:['The trail turns! When you don\'t find a drop ahead, try turning right or left to find where the trail continues.',
               'Strategy: at each step, grab the drop, then check if there is one ahead. If not, turn right and check. If still not, turn left (twice from right).'] },
      { id:105, category:'cp', title:'Steeple Chase', level:'hard',
        desc:"Karel must run from left to right, jumping over hurdles (walls) of varying height to reach the final drop. When it hits a hurdle, it must climb up, leap over and come back down!",
        csv:'.,.,.,.,.,.,.,.,A\n.,P,.,.,.,P,.,.,.\nK>,P,.,.,.,P,.,.,.',
        code:'// Run and jump the hurdles!\nprocedure jump-hurdle {\n  // Climb, cross and descend\n}\n\n// Main program\n\n',
        hints:['Split into two actions: run (move while path is clear) and jump (when there is a wall, climb, cross the top and descend).',
               'To jump: turn.left while(wall-ahead) { move } move turn.right move turn.right while(path-clear) { move } turn.left — Refine it, test step by step!'] },
      { id:106, category:'cp', title:'Cleanup Karel', level:'hard',
        desc:"Drops scattered everywhere! Karel must sweep the entire space in <strong>serpentine</strong> mode: one row to the right, down, next row to the left, down, and so on. It must grab every drop it finds.",
        csv:'K>,.,A,.,A,.\n.,A,.,.,.,A\nA,.,.,A,.,.',
        code:'// Sweep the world in serpentine\nprocedure clean-row {\n  while(path-clear) {\n    if(water-ahead) { grab }\n    move\n  }\n  // Don\'t forget to check the last cell!\n}\n\nprocedure go-down-turn-left {\n  // ...\n}\nprocedure go-down-turn-right {\n  // ...\n}\n\n// Main program\n\n',
        hints:['The serpentine alternates two phases: row to the right (ending against the right wall) and row to the left (ending against the left wall). At each switch, go down one row.',
               'Structure: clean-row go-down-turn-left clean-row go-down-turn-right clean-row — Each go-down procedure turns Karel to sweep in the opposite direction.'] },
      ],
      onboard: [
        { icon:'🪼', title:"Hi! I'm Karel",
          body:"I'm a robot that learns to move by following your instructions. You write the code, I run it! No prior experience needed." },
        { icon:'🗺️', title:'How the screen works',
          body:'On the <strong>left</strong> you see my world: a grid where I move, collect drops 🫧 and avoid walls 🪸. On the <strong>right</strong> you write the code. Press <code>▶ Run</code> to see me in action.' },
        { icon:'🚀', title:'Ready to start?',
          body:'Click <strong>🎯 Challenges</strong> and pick <strong>Challenge 1</strong>. You\'ll find hints commented in the code to guide you. Good luck!' },
      ],
  },
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. SISTEMA D'IDIOMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─────────────────────────────────────────────────────
// DOS EIXOS D'IDIOMA INDEPENDENTS:
//
//  currentCodeLang → les paraules que el parser entén
//                    (mentre/mientras/while, si/if, ...)
//                    Canvia quan l'alumne o la URL ho demana.
//                    Es desa a localStorage 'karel-codelang'.
//
//  currentUserLang → la llengua de la interfície
//                    (botons, errors, log, reptes)
//                    Es desa a localStorage 'karel-userlang'.
//
//  URL: ?codelang=en&userlang=ca
//       → codi en anglès, interfície en català
// ─────────────────────────────────────────────────────

// Normalitza els valors de la URL ('eng'→'en', 'cat'→'ca', 'cast'→'es')
function normalizeLang(raw) {
  if (!raw) return null;
  const map = { cat:'ca', cast:'es', eng:'en', ca:'ca', es:'es', en:'en' };
  return map[raw.toLowerCase()] ?? null;
}

// Llegim els params de la URL (prioritat màxima)
const _urlParams   = new URLSearchParams(window.location.search);
const _urlCodeLang = normalizeLang(_urlParams.get('codelang'));
const _urlUserLang = normalizeLang(_urlParams.get('userlang'));

let currentCodeLang = _urlCodeLang
  || localStorage.getItem('karel-codelang')
  || 'ca';

let currentUserLang = _urlUserLang
  || localStorage.getItem('karel-userlang')
  || 'ca';

let currentState = 'idle';

// t(key) → string de la INTERFÍCIE (usa currentUserLang)
function t(key) {
  const parts = key.split('.');
  let obj = I18N[currentUserLang];
  for (const k of parts) { obj = obj?.[k]; }
  return (obj !== undefined && obj !== null) ? String(obj) : key;
}

// tf(key, vars) → t(key) amb substitució de {var} per valors
function tf(key, vars) {
  let s = t(key);
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

// Velocitats: índex 0-5 (slider 1-6), dreta = ràpid
const SPEED_DELAYS = [2000, 800, 350, 150, 60, 10];

// Tokens dinàmics del parser (usa currentCodeLang)
let COMMANDS   = new Set();
let CONDS      = new Set();
let KEYWORDS   = new Set();
let KW_IF, KW_WHILE, KW_REPEAT, KW_ELSE_ALIASES, KW_PROC, KW_NOT, KW_AND, KW_OR;
let CMD_TO_ACTION  = {};
let COND_TO_ACTION = {};

const CMD_ACTIONS  = ['move','turn-right','turn-left','turn-around','grab','drop'];
const COND_ACTIONS = ['wall-ahead','free-ahead','water-ahead','bag-empty','bag-full'];

// Aplica el llenguatge de programació (tokens del parser)
function applyCodeLang(lang) {
  const tk = I18N[lang].tokens;
  COMMANDS  = new Set(tk.commands);
  CONDS     = new Set(tk.conditions);
  KEYWORDS  = new Set(tk.keywords);
  KW_IF           = tk.if_kw;
  KW_WHILE        = tk.while_kw;
  KW_REPEAT       = tk.repeat_kw;
  KW_ELSE_ALIASES = tk.else_kw;
  KW_PROC         = tk.proc_kw;
  KW_NOT          = tk.not_kw;
  KW_AND          = tk.and_kw;
  KW_OR           = tk.or_kw;
  CMD_TO_ACTION   = {};
  COND_TO_ACTION  = {};
  tk.commands.forEach((c, i)  => CMD_TO_ACTION[c]  = CMD_ACTIONS[i]);
  tk.conditions.forEach((c,i) => COND_TO_ACTION[c] = COND_ACTIONS[i]);
}

// Codi d'exemple per a cada codelang (per omplir l'editor en canviar)
const DEFAULT_CODE = {
  ca: `// Karel recull totes les aigües
// que troba en línia recta fins la paret

mentre(veu-lliure) {
  si(veu-aigua) {
    agafa
  }
  avança
}

// Gira i deixa les aigües recollides
gira.esquerra
repeteix(3) {
  si(no(veu-paret)) {
    deixa
    avança
  }
}`,
  es: `// Karel recoge todas las gotas
// que encuentra en línea recta hasta la pared

mientras(hay-camino) {
  si(hay-agua) {
    coge
  }
  avanza
}

// Gira y suelta las gotas recogidas
gira.izquierda
repite(3) {
  si(no(hay-pared)) {
    suelta
    avanza
  }
}`,
  en: `// Karel grabs all water drops
// it finds in a straight line until the wall

while(path-clear) {
  if(water-ahead) {
    grab
  }
  move
}

// Turn and drop the collected drops
turn.left
repeat(3) {
  if(not(wall-ahead)) {
    drop
    move
  }
}`,
};

// ── Canvia el LLENGUATGE DE PROGRAMACIÓ ──
function setCodeLang(lang) {
  if (!I18N[lang]) return;
  currentCodeLang = lang;
  localStorage.setItem('karel-codelang', lang);
  applyCodeLang(lang);
  stopProgram();
  // Substituïm el codi de l'editor pel codi d'exemple del nou llenguatge
  const ta = document.getElementById('code-editor');
  if (ta) {
    ta.value = DEFAULT_CODE[lang] || DEFAULT_CODE.ca;
    localStorage.setItem(LS_KEY_CODE, ta.value);
    updateEditor();
  }
  updateLangButtons();
  // Millora 5: actualitza el panell de referència si és obert (nou codelang)
  const refPanelCL = document.getElementById('ref-panel');
  if (refPanelCL && refPanelCL.classList.contains('visible')) renderRefPanel();
}

// ── Canvia l'IDIOMA DE LA INTERFÍCIE ──
function setUserLang(lang) {
  if (!I18N[lang]) return;
  currentUserLang = lang;
  localStorage.setItem('karel-userlang', lang);
  updateUI();
}

// Actualitza tots els textos de la interfície (usa currentUserLang via t())
function updateUI() {
  // Header
  const btnCh = document.getElementById('btn-challenges');
  if (btnCh) btnCh.textContent = t('ui.challenges');
  const btnTheme = document.getElementById('btn-theme');
  if (btnTheme) btnTheme.textContent = t('ui.toggle_theme');
  const lblConfig = document.getElementById('lbl-config');
  if (lblConfig) lblConfig.textContent = t('ui.config_btn') || 'Configuració';
  // Etiquetes dels dos selectors
  const lblCode = document.getElementById('lbl-codelang');
  if (lblCode) lblCode.textContent = t('ui.lbl_codelang');
  const lblUser = document.getElementById('lbl-userlang');
  if (lblUser) lblUser.textContent = t('ui.lbl_userlang');
  // Modal
  const mct = document.getElementById('modal-challenges-title');
  if (mct) mct.textContent = t('ui.challenges_title');
  // Botons de control
  const ids = {
    'btn-run':        'ui.run',
    'btn-step':       'ui.step',
    'btn-stop':       'ui.stop',
    'btn-reset':      'ui.reset',
    'btn-clear':      'ui.clear_log',
    'btn-ref':        'ui.ref_btn',
    'btn-modal-close':'ui.close',
    'btn-goal':       'ui.goal_btn',
  };
  for (const [id, key] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
  // Etiquetes
  const lblBag   = document.getElementById('lbl-bag');
  if (lblBag)   lblBag.textContent   = t('ui.bag');
  const lblSpeed = document.getElementById('lbl-speed');
  if (lblSpeed) lblSpeed.textContent = t('ui.speed');
  const spd = document.getElementById('speed');
  const lbl = document.getElementById('speed-lbl');
  if (spd && lbl) lbl.textContent = I18N[currentUserLang].speed[parseInt(spd.value) - 1] || spd.value;
  // Indicador d'estat
  setStateUI(currentState);
  // Botons de llengua actius
  updateLangButtons();

  // Millora 5: re-renderitza el panell si és obert
  const refPanel = document.getElementById('ref-panel');
  if (refPanel && refPanel.classList.contains('visible')) renderRefPanel();

  // Millora 1: re-tradueix botons del modal d'èxit
  const btnSuccMore  = document.getElementById('btn-success-more');
  const btnSuccClose = document.getElementById('btn-success-close');
  if (btnSuccMore)  btnSuccMore.textContent  = t('ui.success_more')  || '🎯 Reptes';
  if (btnSuccClose) btnSuccClose.textContent = t('ui.success_close') || 'Continua';

  // Millora 2: re-tradueix l'onboarding si és obert
  const obModal = document.getElementById('modal-onboard');
  if (obModal && obModal.classList.contains('open')) renderOnboardStep();
  const btnSkip = document.getElementById('onboard-skip');
  if (btnSkip) btnSkip.textContent = t('ui.onboard_skip') || 'Salta';

  // Millora 2: re-tradueix el botó de pista (text canvia amb idioma)
  updateHintButton();
}

// Marca el botó actiu als dos selectors
function updateLangButtons() {
  const LANG_BTN_MAP = { 'CAT': 'ca', 'CAST': 'es', 'ENG': 'en' };
  document.querySelectorAll('#codelang-switcher .lang-btn').forEach(btn => {
    btn.classList.toggle('active', LANG_BTN_MAP[btn.textContent.trim()] === currentCodeLang);
  });
  document.querySelectorAll('#userlang-switcher .lang-btn').forEach(btn => {
    btn.classList.toggle('active', LANG_BTN_MAP[btn.textContent.trim()] === currentUserLang);
  });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DIRS = [
  { name:'Est',  dx: 1, dy: 0, arrow:'→', dataDir:'right' },
  { name:'Sud',  dx: 0, dy: 1, arrow:'↓', dataDir:'bottom' },
  { name:'Oest', dx:-1, dy: 0, arrow:'←', dataDir:'left' },
  { name:'Nord', dx: 0, dy:-1, arrow:'↑', dataDir:'top' },
];


// ── ASSETS GRÀFICS (Pixel Art SVG) ─────────────────
const KAREL_ASSETS = {
  MEDUSA: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="karel-entity" fill="currentColor" shape-rendering="crispEdges"><rect x="5" y="2" width="1" height="1"/><rect x="6" y="2" width="1" height="1"/><rect x="7" y="2" width="1" height="1"/><rect x="8" y="2" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="10" y="2" width="1" height="1"/><rect x="4" y="3" width="1" height="1"/><rect x="5" y="3" width="1" height="1"/><rect x="10" y="3" width="1" height="1"/><rect x="11" y="3" width="1" height="1"/><rect x="3" y="4" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="5" y="4" width="1" height="1"/><rect x="6" y="4" width="1" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="8" y="4" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="11" y="4" width="1" height="1"/><rect x="12" y="4" width="1" height="1"/><rect x="3" y="5" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="7" y="5" width="1" height="1"/><rect x="8" y="5" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="11" y="5" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="3" y="6" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="5" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="7" y="6" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="9" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="11" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="3" y="7" width="1" height="1"/><rect x="4" y="7" width="1" height="1"/><rect x="5" y="7" width="1" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/><rect x="6" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="10" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="7" y="9" width="1" height="1"/><rect x="8" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="7" y="10" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="4" y="11" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="8" y="11" width="1" height="1"/><rect x="11" y="11" width="1" height="1"/><rect x="3" y="12" width="1" height="1"/><rect x="7" y="12" width="1" height="1"/><rect x="8" y="12" width="1" height="1"/><rect x="12" y="12" width="1" height="1"/><rect x="3" y="13" width="1" height="1"/><rect x="7" y="13" width="1" height="1"/><rect x="8" y="13" width="1" height="1"/><rect x="12" y="13" width="1" height="1"/><rect x="6" y="3" width="1" height="1" fill="var(--bg)"/><rect x="7" y="3" width="1" height="1" fill="var(--bg)"/><rect x="8" y="3" width="1" height="1" fill="var(--bg)"/><rect x="9" y="3" width="1" height="1" fill="var(--bg)"/></svg>`,
  CORALL: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" shape-rendering="crispEdges"><g fill="#9AB60C"><rect x="12" y="0" width="1" height="1"/><rect x="13" y="0" width="1" height="1"/><rect x="12" y="1" width="1" height="1"/><rect x="13" y="1" width="1" height="1"/><rect x="12" y="2" width="1" height="1"/><rect x="13" y="2" width="1" height="1"/><rect x="12" y="3" width="1" height="1"/><rect x="13" y="3" width="1" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="8" y="4" width="1" height="1"/><rect x="12" y="4" width="1" height="1"/><rect x="13" y="4" width="1" height="1"/><rect x="3" y="5" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/><rect x="7" y="5" width="1" height="1"/><rect x="8" y="5" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="3" y="6" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="7" y="6" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="13" y="6" width="1" height="1"/><rect x="3" y="7" width="1" height="1"/><rect x="4" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="13" y="7" width="1" height="1"/><rect x="3" y="8" width="1" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/><rect x="6" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="10" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="12" y="8" width="1" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="3" y="9" width="1" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="5" y="9" width="1" height="1"/><rect x="6" y="9" width="1" height="1"/><rect x="7" y="9" width="1" height="1"/><rect x="8" y="9" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="10" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="5" y="10" width="1" height="1"/><rect x="6" y="10" width="1" height="1"/><rect x="7" y="10" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="9" y="10" width="1" height="1"/><rect x="10" y="10" width="1" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="4" y="11" width="1" height="1"/><rect x="5" y="11" width="1" height="1"/><rect x="6" y="11" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="8" y="11" width="1" height="1"/><rect x="9" y="11" width="1" height="1"/><rect x="10" y="11" width="1" height="1"/><rect x="11" y="11" width="1" height="1"/><rect x="4" y="12" width="1" height="1"/><rect x="5" y="12" width="1" height="1"/><rect x="6" y="12" width="1" height="1"/><rect x="7" y="12" width="1" height="1"/><rect x="8" y="12" width="1" height="1"/><rect x="9" y="12" width="1" height="1"/><rect x="10" y="12" width="1" height="1"/><rect x="11" y="12" width="1" height="1"/><rect x="4" y="13" width="1" height="1"/><rect x="5" y="13" width="1" height="1"/><rect x="6" y="13" width="1" height="1"/><rect x="7" y="13" width="1" height="1"/><rect x="8" y="13" width="1" height="1"/><rect x="9" y="13" width="1" height="1"/><rect x="10" y="13" width="1" height="1"/><rect x="11" y="13" width="1" height="1"/><rect x="3" y="14" width="1" height="1"/><rect x="4" y="14" width="1" height="1"/><rect x="5" y="14" width="1" height="1"/><rect x="6" y="14" width="1" height="1"/><rect x="7" y="14" width="1" height="1"/><rect x="8" y="14" width="1" height="1"/><rect x="9" y="14" width="1" height="1"/><rect x="10" y="14" width="1" height="1"/><rect x="11" y="14" width="1" height="1"/><rect x="12" y="14" width="1" height="1"/><rect x="13" y="14" width="1" height="1"/><rect x="1" y="15" width="1" height="1"/><rect x="2" y="15" width="1" height="1"/><rect x="3" y="15" width="1" height="1"/><rect x="4" y="15" width="1" height="1"/><rect x="5" y="15" width="1" height="1"/><rect x="6" y="15" width="1" height="1"/><rect x="7" y="15" width="1" height="1"/><rect x="8" y="15" width="1" height="1"/><rect x="9" y="15" width="1" height="1"/><rect x="10" y="15" width="1" height="1"/><rect x="11" y="15" width="1" height="1"/><rect x="12" y="15" width="1" height="1"/><rect x="13" y="15" width="1" height="1"/><rect x="14" y="15" width="1" height="1"/></g></svg>`,
  BOMBOLLA: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" shape-rendering="crispEdges"><g fill="#90CDF4"><rect x="6" y="2" width="1" height="1"/><rect x="7" y="2" width="1" height="1"/><rect x="8" y="2" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="4" y="3" width="1" height="1"/><rect x="7" y="3" width="1" height="1"/><rect x="8" y="3" width="1" height="1"/><rect x="9" y="3" width="1" height="1"/><rect x="10" y="3" width="1" height="1"/><rect x="11" y="3" width="1" height="1"/><rect x="6" y="4" width="1" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="8" y="4" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="11" y="4" width="1" height="1"/><rect x="3" y="5" width="1" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="7" y="5" width="1" height="1"/><rect x="8" y="5" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="11" y="5" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="3" y="6" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="5" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="7" y="6" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="9" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="11" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="3" y="7" width="1" height="1"/><rect x="4" y="7" width="1" height="1"/><rect x="5" y="7" width="1" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="3" y="8" width="1" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/><rect x="6" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="10" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="12" y="8" width="1" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="5" y="9" width="1" height="1"/><rect x="6" y="9" width="1" height="1"/><rect x="7" y="9" width="1" height="1"/><rect x="8" y="9" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="10" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="5" y="10" width="1" height="1"/><rect x="6" y="10" width="1" height="1"/><rect x="7" y="10" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="9" y="10" width="1" height="1"/><rect x="10" y="10" width="1" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="6" y="11" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="8" y="11" width="1" height="1"/><rect x="9" y="11" width="1" height="1"/></g><g fill="#FFFFFF"><rect x="5" y="3" width="1" height="1"/><rect x="6" y="3" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="5" y="4" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/></g><g fill="#2B6CB0"><rect x="6" y="1" width="1" height="1"/><rect x="7" y="1" width="1" height="1"/><rect x="8" y="1" width="1" height="1"/><rect x="9" y="1" width="1" height="1"/><rect x="4" y="2" width="1" height="1"/><rect x="5" y="2" width="1" height="1"/><rect x="10" y="2" width="1" height="1"/><rect x="11" y="2" width="1" height="1"/><rect x="3" y="3" width="1" height="1"/><rect x="12" y="3" width="1" height="1"/><rect x="3" y="4" width="1" height="1"/><rect x="12" y="4" width="1" height="1"/><rect x="2" y="5" width="1" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="2" y="6" width="1" height="1"/><rect x="13" y="6" width="1" height="1"/><rect x="2" y="7" width="1" height="1"/><rect x="13" y="7" width="1" height="1"/><rect x="2" y="8" width="1" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="3" y="9" width="1" height="1"/><rect x="12" y="9" width="1" height="1"/><rect x="3" y="10" width="1" height="1"/><rect x="12" y="10" width="1" height="1"/><rect x="4" y="11" width="1" height="1"/><rect x="5" y="11" width="1" height="1"/><rect x="10" y="11" width="1" height="1"/><rect x="11" y="11" width="1" height="1"/><rect x="6" y="12" width="1" height="1"/><rect x="7" y="12" width="1" height="1"/><rect x="8" y="12" width="1" height="1"/><rect x="9" y="12" width="1" height="1"/></g><g fill="#63B3ED"><rect x="10" y="13" width="1" height="1"/><rect x="7" y="14" width="1" height="1"/></g></svg>`,
};

// ── Mapa d'objectius finals per a cada repte (CSV de l'estat final esperat) ──
const GOAL_CSV = {
  // Originals
  1:  '.,.,.,.,K>,P\n.,.,.,.,.,.\n.,.,.,.,.,.',
  2:  'K>,.,.\n.,.,.\n.,.,.',
  3:  '.,.,.,.,.,.,K>,P',
  4:  'K<,.,.,.,.\n.,.,.,.,.',
  5:  '.,K>,.,P\n.,.,.,.\n.,.,.,.',
  6:  'K<,.,.,.,.\n.,.,.,.,.',
  7:  '.,.,.,.,P\nK<,A,A,A,P',
  8:  '.,.,P,.,P,.,.\n.,.,P,.,.,.,P\n.,.,.,.,.,.,K>',
  9:  '.,.,.,.,P\nP,.,.,.,K>',
  // Code in Place (Stanford)
  101:'.,.,.,.,K>\n.,.,.,.,.',
  102:'.,.,.,K>\nP,P,.,.\n.,.,.,.',
  103:'P,P,.,P,P\nP,K>,.,.,P\nP,P,.,P,P\n.,.,.,.,.',
  104:'.,.,.,.,.\n.,.,.,.,.\n.,.,.,.,K>',
  105:'.,.,.,.,.,.,.,.,K>\n.,P,.,.,.,P,.,.,.\n.,P,.,.,.,P,.,.,.',
  106:'.,.,.,.,.,.\n.,.,.,.,.,.\n.,.,.,.,.,K>',
};

const LS_KEY_CODE = 'karel-code-v3';
const DEFAULT_CSV =
`K>,.,.,P,.,.
.,A,.,P,.,.
.,.,.,A,.,.
P,P,.,.,.,A
.,.,.,.,.,.`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. ESTAT GLOBAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let world      = { grid:[], rows:0, cols:0 };
let worldInit  = [];
let karel      = { x:0, y:0, dir:0, motxilla:0 };
let karelInit  = { x:0, y:0, dir:0, motxilla:0 };
let currentCSV = DEFAULT_CSV;

let running    = false;
let stepMode   = false;
let interpreter = null;
let tickTimer  = null;
let stepDelay  = SPEED_DELAYS[1]; // Lent per defecte (slider=2)

let editMode     = false;
let editBrush    = '.';
let editDragging = false;
let karelEditDir = 0;

let procs     = {};
let callDepth = 0;
let _stepCount = 0;   // FIX: comptador de passos per validar reptes
let currentChallengeId = null;   // Millora 1: repte actiu

// ── Millora 2: sistema de pistes ──
const HINT_DELAY_MS   = 2 * 60 * 1000;  // 2 minuts
let hintLoadTime      = null;
let hintLevel         = 0;   // 0=cap, 1=pista1 mostrada, 2=pista2 mostrada
let hintCountdownId   = null;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. INDICADOR D'ESTAT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setStateUI(state) {
  currentState = state;
  const dot = document.getElementById('state-dot');
  const lbl = document.getElementById('state-lbl');
  if (!dot || !lbl) return;
  dot.className = (state === 'idle') ? '' : state;
  lbl.textContent = t('state.' + state) || state;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. MODALS I REPTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

document.querySelectorAll('.modal-bg').forEach(bg =>
  bg.addEventListener('click', e => { if (e.target === bg) bg.classList.remove('open'); })
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.modal-bg.open').forEach(m => m.classList.remove('open'));
});

function openChallenges() {
  // Tanca el config panel si està obert
  closeConfig();

  const challenges = I18N[currentUserLang].challenges;
  const list = document.getElementById('challenges-list');
  if (!list) return;

  // Agrupa reptes per categoria
  const groups = {};
  for (const ch of challenges) {
    const cat = ch.category || 'basic';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(ch);
  }

  // Ordre: Stanford CP primer, Originals després
  const catOrder = ['cp', 'basic'];

  function renderCards(arr) {
    return arr.map(ch => {
      const numLabel = ch.category === 'cp'
        ? `CP ${ch.id - 100}`
        : `${escHtml(t('log.challenge'))} ${ch.id}`;
      return `
      <div class="ch-card" data-challenge-id="${ch.id}" role="button" tabindex="0">
        <div class="ch-num">${numLabel}</div>
        <div class="ch-title">${sanitizeHtml(ch.title)}</div>
        <div class="ch-desc">${sanitizeHtml(ch.desc)}</div>
        <div><span class="ch-tag ${escHtml(ch.level)}">${escHtml(t('ui.level_' + ch.level))}</span></div>
      </div>`;
    }).join('');
  }

  let html = '';
  for (let i = 0; i < catOrder.length; i++) {
    const cat = catOrder[i];
    if (!groups[cat]) continue;
    const label = t('ui.category_' + cat) || cat;
    const openAttr = i === 0 ? ' open' : '';   // primer grup obert per defecte
    html += `<details class="ch-details"${openAttr}>
      <summary class="ch-summary">${escHtml(label)}<span class="ch-count">${groups[cat].length}</span></summary>
      <div class="ch-grid">${renderCards(groups[cat])}</div>
    </details>`;
  }
  list.innerHTML = html;

  // Event delegation: evita inline onclick
  list.onclick = e => {
    const card = e.target.closest('[data-challenge-id]');
    if (card) loadChallenge(+card.dataset.challengeId);
  };
  openModal('modal-challenges');
}

function loadChallenge(id) {
  // FIX: UI text (title, desc) ve del userLang; codi i CSV del codeLang
  const chUI   = I18N[currentUserLang].challenges.find(c => c.id === id);
  const chCode = I18N[currentCodeLang].challenges.find(c => c.id === id);
  if (!chUI || !chCode) return;
  currentChallengeId = id;   // Millora 1
  startHintTimer();           // Millora 2
  loadMapFromCSV(chCode.csv);
  const ta = document.getElementById('code-editor');
  if (ta) {
    ta.value = chCode.code;   // codi en l'idioma de programació actiu
    localStorage.setItem(LS_KEY_CODE, chCode.code);
    updateEditor();
  }
  closeModal('modal-challenges');
  const logLabel = chUI.category === 'cp' ? `CP ${id - 100}` : `${t('log.challenge')} ${id}`;
  log(`${logLabel}: ${chUI.title}`, 'ok');

  // Mostra botó d'objectiu (instruccions + previsualització)
  const btnGoal = document.getElementById('btn-goal');
  if (btnGoal) {
    btnGoal.style.display = '';
    btnGoal.textContent = t('ui.goal_btn') || '🎯 Objectiu';
  }
}

function openBlankModal() { openModal('modal-blank'); }

function applyBlank() {
  const rows = Math.max(1, Math.min(20, parseInt(document.getElementById('blank-rows').value)||5));
  const cols = Math.max(1, Math.min(20, parseInt(document.getElementById('blank-cols').value)||7));
  const lines = [];
  for (let r = 0; r < rows; r++) {
    const cells = Array(cols).fill('.');
    if (r === 0) cells[0] = 'K>';
    lines.push(cells.join(','));
  }
  currentCSV = lines.join('\n');
  loadMapFromCSV(currentCSV);
  closeModal('modal-blank');
}

function triggerOpenCSV() {
  // A edit-mapa.html existeix #file-input; a index.html usem #welcome-file-input
  const input = document.getElementById('file-input') || document.getElementById('welcome-file-input');
  input?.click();
}

function handleWelcomeCSV(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const csv = e.target.result.trim();
    const url = location.href.split('?')[0] + '?mapa=' + encodeURIComponent(csv);
    location.href = url;
  };
  reader.readAsText(file);
  evt.target.value = '';
}

function handleFileOpen(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { currentCSV = e.target.result.trim(); loadMapFromCSV(currentCSV); log(`📂 ${file.name}`, 'ok'); };
  reader.readAsText(file);
  evt.target.value = '';
}

function saveCSV() {
  const csv = worldToCSV();
  const a   = document.createElement('a');
  a.href    = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
  a.download = 'mapa-karel.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  log('💾 CSV', 'ok');
}

function worldToCSV() {
  const AR = ['>','v','<','^'];
  return world.grid.map((row, r) =>
    row.map((c, col) =>
      (karelInit.x === col && karelInit.y === r) ? 'K' + AR[karelInit.dir] : c
    ).join(',')
  ).join('\n');
}

function copyMapURL() {
  const url = location.href.split('?')[0] + '?mapa=' + encodeURIComponent(worldToCSV());
  navigator.clipboard.writeText(url)
    .then(() => log('🔗 URL copiada!', 'ok'))
    .catch(() => log('🔗 ' + url, 'ok'));
}

function toggleLight() {
  document.body.classList.toggle('light');
  localStorage.setItem('karel-theme', document.body.classList.contains('light') ? 'light' : 'dark');
  closeConfig();
}
(function restoreTheme() {
  if (localStorage.getItem('karel-theme') === 'light') document.body.classList.add('light');
})();

function closeConfig() {
  const panel = document.getElementById('config-panel');
  if (panel) panel.classList.remove('open');
}

// Config dropdown
function toggleConfig() {
  const panel = document.getElementById('config-panel');
  if (panel) panel.classList.toggle('open');
}
// Tanca config si es fa clic fora
document.addEventListener('click', function(e) {
  const wrap = document.querySelector('.config-dropdown-wrap');
  const panel = document.getElementById('config-panel');
  if (wrap && panel && !wrap.contains(e.target)) panel.classList.remove('open');
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. CSV: PARSEJAT I CÀRREGA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseCSV(csv) {
  const lines = csv.trim().split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('//'));
  const grid = []; let kStart = {x:0,y:0,dir:0}; let foundK = false;
  for (let row = 0; row < lines.length; row++) {
    const cells = lines[row].split(',').map(c=>c.trim());
    grid.push([]);
    for (let col = 0; col < cells.length; col++) {
      const c = cells[col].toUpperCase();
      if (c.startsWith('K')) {
        grid[row].push('.');
        if (!foundK) {
          foundK = true;
          const s = c.slice(1);
          // FIX Bug 3: orientacions vàlides: >, V, <, ^. Qualsevol altra → error de mapa corrupte
          const DIR_MAP = { '>':0, 'V':1, '<':2, '^':3 };
          if (s && !(s in DIR_MAP)) {
            console.warn(`⚠ Mapa corrupte: orientació desconeguda '${s}' a (${col},${row}). S'assumeix direcció → (dreta).`);
          }
          kStart = { x:col, y:row, dir: DIR_MAP[s] ?? 0 };
        }
      } else { grid[row].push(c==='P'?'P' : c==='A'?'A' : '.'); }
    }
  }
  const maxCols = Math.max(...grid.map(r=>r.length), 1);
  for (const r of grid) while (r.length < maxCols) r.push('.');
  return { grid, rows:grid.length, cols:maxCols, kStart };
}

function loadMapFromCSV(csv) {
  const { grid, rows, cols, kStart } = parseCSV(csv);
  world     = { grid, rows, cols };
  worldInit = grid.map(r=>[...r]);
  karel     = { ...kStart, motxilla:0 };
  karelInit = { ...kStart, motxilla:0 };
  stopProgram();
  renderWorldFull();   // FIX RENDIMENT: força rebuild complet amb mapa nou
  updateStatus();
  log(t('log.map_loaded'), 'ok');
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. HELPERS DEL MÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isWall(x, y) {
  if (x<0||y<0||x>=world.cols||y>=world.rows) return true;
  return world.grid[y][x]==='P';
}
function getCell(x, y) {
  if (x<0||y<0||x>=world.cols||y>=world.rows) return null;
  return world.grid[y][x];
}
function setCell(x, y, v) { if (y>=0&&y<world.rows&&x>=0&&x<world.cols) world.grid[y][x]=v; }
function front() { const d=DIRS[karel.dir]; return {x:karel.x+d.dx, y:karel.y+d.dy}; }

function evalCond(cond) {
  switch (cond.type) {
    case 'not': return !evalCond(cond.inner);
    case 'and': return evalCond(cond.left) && evalCond(cond.right);
    case 'or':  return evalCond(cond.left) || evalCond(cond.right);
    case 'condition': {
      const action = COND_TO_ACTION[cond.name] ?? cond.name;
      const {x,y}  = front();
      switch (action) {
        case 'wall-ahead':  return isWall(x,y);
        case 'free-ahead':  return !isWall(x,y);
        case 'water-ahead': return getCell(x,y)==='A';
        case 'bag-empty':   return karel.motxilla===0;
        case 'bag-full':    return karel.motxilla>0;
      }
    }
  }
  return false;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. RENDERITZAT + AUTO-ESCALA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calcCellSize() {
  const area = document.getElementById('world-area');
  const pad=52, statusH=40;
  const byW = Math.floor((area.clientWidth  - pad - (world.cols+1)*2) / world.cols);
  const byH = Math.floor((area.clientHeight - pad - statusH - (world.rows+1)*2) / world.rows);
  return Math.max(18, Math.min(56, byW, byH));
}

// ── FIX RENDIMENT: Render diferencial ──────────────────
// Manté un snapshot de l'últim estat renderitzat.
// Només actualitza les cel·les que han canviat (Karel, aigua, etc.)
// Fa rebuild complet NOMÉS si canvia la mida de la graella.

let _renderedSnapshot = null;  // { rows, cols, karelX, karelY, karelDir, grid: string[][] }
let _lastCellSize     = 0;

function _cellKey(col, row) {
  if (karel.x === col && karel.y === row) return 'K' + karel.dir;
  return world.grid[row][col];
}

function _applyCellContent(div, col, row, fs) {
  div.className = 'cell';
  div.style.fontSize = fs;
  if (karel.x === col && karel.y === row) {
    div.classList.add('c-k');
    div.innerHTML = KAREL_ASSETS.MEDUSA;
    // Aplica la direcció via data-dir (la rotació la gestiona CSS)
    const svg = div.querySelector('.karel-entity');
    if (svg) svg.setAttribute('data-dir', DIRS[karel.dir].dataDir);
  } else {
    const c = world.grid[row][col];
    if      (c === 'P') { div.classList.add('c-p'); div.innerHTML = KAREL_ASSETS.CORALL; }
    else if (c === 'A') { div.classList.add('c-a'); div.innerHTML = KAREL_ASSETS.BOMBOLLA; }
    else                { div.classList.add('c-e'); div.innerHTML = ''; }
  }
}

function renderWorld() {
  const size = calcCellSize();
  const fs   = Math.round(size * 0.52) + 'px';
  document.documentElement.style.setProperty('--cell-size', size + 'px');
  const g = document.getElementById('world-grid');
  if (!g) return;
  g.style.gridTemplateColumns = `repeat(${world.cols}, ${size}px)`;

  // Comprova si cal un rebuild complet (dimensions canviades, primer render, o mode edició)
  const needsFullRebuild = !_renderedSnapshot
    || _renderedSnapshot.rows !== world.rows
    || _renderedSnapshot.cols !== world.cols
    || editMode;

  if (needsFullRebuild) {
    // ── Rebuild complet (com abans) ──
    g.innerHTML = '';
    for (let row = 0; row < world.rows; row++) {
      for (let col = 0; col < world.cols; col++) {
        const div = document.createElement('div');
        div.dataset.col = col;
        div.dataset.row = row;
        _applyCellContent(div, col, row, fs);
        if (editMode) {
          div.addEventListener('mousedown', e => { e.preventDefault(); editDragging=true; applyBrushAt(col,row); });
          div.addEventListener('mouseenter', () => { if (editDragging) applyBrushAt(col,row); });
        }
        g.appendChild(div);
      }
    }
  } else {
    // ── Render diferencial: només actualitza cel·les canviades ──
    const children = g.children;
    for (let row = 0; row < world.rows; row++) {
      for (let col = 0; col < world.cols; col++) {
        const newKey = _cellKey(col, row);
        const oldKey = _renderedSnapshot.keys[row * world.cols + col];
        if (newKey !== oldKey || size !== _lastCellSize) {
          const div = children[row * world.cols + col];
          if (div) _applyCellContent(div, col, row, fs);
        }
      }
    }
  }

  // Desa el snapshot
  const keys = [];
  for (let row = 0; row < world.rows; row++) {
    for (let col = 0; col < world.cols; col++) {
      keys.push(_cellKey(col, row));
    }
  }
  _renderedSnapshot = { rows: world.rows, cols: world.cols, keys };
  _lastCellSize = size;
}

// Força rebuild complet (cridat quan es carrega un mapa nou)
function renderWorldFull() {
  _renderedSnapshot = null;
  renderWorld();
}

function updateStatus() {
  const bagEl = document.getElementById('st-bag');
  if (bagEl) bagEl.textContent = karel.motxilla;
}

// ── FIX RENDIMENT: ResizeObserver amb debounce via rAF ──
let _resizeRafId = null;
new ResizeObserver(() => {
  if (world.rows <= 0) return;
  if (_resizeRafId) cancelAnimationFrame(_resizeRafId);
  _resizeRafId = requestAnimationFrame(() => {
    _resizeRafId = null;
    renderWorld();
  });
}).observe(document.getElementById('world-area'));


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. LOG + RESIZE HANDLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const logEl = document.getElementById('log');

function log(msg, type='dim') {
  if (!logEl) return;
  const p = document.createElement('p');
  p.className   = type;
  p.textContent = msg;
  logEl.appendChild(p);
  while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() { if (logEl) logEl.innerHTML=''; }


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10b. SISTEMA D'AJUDA (post-it + botó al log)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _helpCode = null;   // clau de l'error actual (p.ex. 'wall', 'syntax_brace')
let _helpLine = null;   // línia on s'ha produït

// logError: com log('...','err') però afegeix un botó "💡 Ajuda"
function logError(msg, errCode, line) {
  if (!logEl) return;
  const p = document.createElement('p');
  p.className = 'err';
  // FIX SEGURETAT: usa DOM API en comptes d'innerHTML amb onclick
  p.appendChild(document.createTextNode(String(msg) + ' '));
  const btn = document.createElement('button');
  btn.className = 'help-btn';
  btn.textContent = t('ui.help_btn') || 'Ajuda 💡';
  btn.addEventListener('click', () => showHelp(errCode, line ?? null));
  p.appendChild(btn);
  logEl.appendChild(p);
  while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
  logEl.scrollTop = logEl.scrollHeight;
  hideHelp(); // tanca qualsevol post-it anterior
}

// Mostra el post-it de nivell 1 (pista inicial)
function showHelp(errCode, line) {
  _helpCode = errCode;
  _helpLine = line;
  renderPostit(1);
}

// Passa al post-it de nivell 2 (ajuda ampliada / solució)
function showMoreHelp() { renderPostit(2); }

// Amaga i buida el post-it
function hideHelp() {
  const pi = document.getElementById('help-postit');
  if (!pi) return;
  pi.classList.remove('visible', 'level2');
  pi.innerHTML = '';
}

// Construeix i mostra el post-it per al nivell demanat (1 o 2)
function renderPostit(level) {
  const pi = document.getElementById('help-postit');
  if (!pi || !_helpCode) return;
  const h = I18N[currentUserLang]?.help?.[_helpCode];
  if (!h) return;

  const title   = level === 1 ? h.title  : h.title2;
  const body    = level === 1 ? h.hint1  : h.hint2;
  const closeLabel = t('ui.help_close') || '✕';
  const moreLabel  = t('ui.help_more')  || 'Més ajuda →';

  // FIX SEGURETAT: sanititzem el contingut HTML del sistema d'ajuda
  pi.innerHTML = `
    <button class="help-close" title="${escHtml(closeLabel)}">✕</button>
    <div class="help-title">${sanitizeHtml(title)}</div>
    <div class="help-body">${sanitizeHtml(body)}</div>
    ${level === 1 ? '<button class="help-more-btn"></button>' : ''}
  `;
  // FIX SEGURETAT: event listeners en comptes d'inline onclick
  pi.querySelector('.help-close')?.addEventListener('click', hideHelp);
  const moreBtn = pi.querySelector('.help-more-btn');
  if (moreBtn) {
    moreBtn.textContent = moreLabel;
    moreBtn.addEventListener('click', showMoreHelp);
  }

  pi.classList.remove('level2');
  if (level === 2) pi.classList.add('level2');
  pi.classList.add('visible');

  // Desplaça la línia d'error al centre del viewport de l'editor
  if (_helpLine) {
    document.getElementById('lbg-' + _helpLine)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

(function initLogResize() {
  const wrap   = document.getElementById('log-wrap');
  const handle = document.getElementById('log-resize');
  if (!wrap || !handle) return;
  let startY, startH;
  handle.addEventListener('mousedown', e => {
    startY=e.clientY; startH=wrap.offsetHeight;
    handle.classList.add('dragging');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
  function onMove(e) { wrap.style.height=Math.max(40,Math.min(startH+(startY-e.clientY),window.innerHeight*.6))+'px'; }
  function onUp()    { handle.classList.remove('dragging'); document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); }
})();

document.addEventListener('mouseup', () => { editDragging=false; });


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 11. EXECUCIÓ D'ACCIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function execAction({ cmd, line }) {
  highlightLine(line);
  _stepCount++;   // FIX: comptador de passos
  const action = CMD_TO_ACTION[cmd] ?? cmd;
  const {x:fx, y:fy} = front();

  function errStop(msgKey) {
    logError(`❌ ${cmd} (${t('log.line')} ${line}): ${t('err.'+msgKey)}`, msgKey, line);
    markErrorLine(line); setStateUI('error'); stopProgram(); return false;
  }

  switch (action) {
    case 'move':
      if (isWall(fx,fy)) return errStop('wall');
      karel.x=fx; karel.y=fy;
      log(`${cmd} → (${karel.x}, ${karel.y})`, 'inf');
      break;
    case 'turn-right':
      karel.dir=(karel.dir+1)%4;
      log(`${cmd} → ${DIRS[karel.dir].arrow}`, 'cmd');
      break;
    case 'turn-left':
      karel.dir=(karel.dir+3)%4;
      log(`${cmd} → ${DIRS[karel.dir].arrow}`, 'cmd');
      break;
    case 'turn-around':
      karel.dir=(karel.dir+2)%4;
      log(`${cmd} → ${DIRS[karel.dir].arrow}`, 'cmd');
      break;
    case 'grab':
      if (getCell(fx,fy)!=='A') return errStop('no_water');
      setCell(fx,fy,'.'); karel.motxilla++;
      log(`${cmd} 🫧 → ${karel.motxilla}`, 'ok');
      break;
    case 'drop':
      if (karel.motxilla<=0) return errStop('bag_empty');
      // FIX BUG: no deixar si la cel·la ja té una bombolla (es perdria)
      if (getCell(karel.x, karel.y)==='A') {
        log(`⚠ ${cmd}: ja hi ha una bombolla aquí — la teva es conserva a la motxilla`, 'inf');
        break;
      }
      setCell(karel.x,karel.y,'A'); karel.motxilla--;
      log(`${cmd} 🫧 → ${karel.motxilla}`, 'ok');
      break;
  }
  renderWorld(); updateStatus(); return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 12. INTÈRPRET (GENERADORS JS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function* runStmts(stmts) { for (const s of stmts) yield* runStmt(s); }

function* runStmt(node) {
  switch (node.type) {
    case 'command': yield { cmd: node.name, line: node.line }; break;
    case 'if':      yield* runStmts(evalCond(node.cond) ? node.then : node.else); break;
    case 'while': {
      let guard=50000;
      while (evalCond(node.cond)) {
        if (--guard<=0) { logError(t('log.inf_loop'), 'inf_loop', node.line); setStateUI('error'); return; }
        yield* runStmts(node.body);
      }
      break;
    }
    case 'repeat':
      for (let i=0; i<node.count; i++) yield* runStmts(node.body);
      break;
    case 'call': {
      const body = procs[node.name];
      if (!body) { logError(`❌ '${node.name}' (${t('log.line')} ${node.line}): ${t('err.proc_undef')}`, 'proc_undef', node.line); markErrorLine(node.line); setStateUI('error'); return; }
      callDepth++;
      if (callDepth>50) { logError(t('log.deep_rec'), 'deep_rec', node.line); setStateUI('error'); callDepth=0; return; }
      yield* runStmts(body);
      callDepth--;
      break;
    }
    case 'proc': break;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 13. EDITOR WYSIWYG DEL MAPA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleEditMode() {
  if (running) { log(t('log.stop_first'), 'err'); return; }
  editMode = !editMode;
  document.body.classList.toggle('editing', editMode);
  const btn = document.getElementById('btn-edit-toggle');
  if (btn) btn.textContent = editMode ? '✓ Surt' : '✏️ Edita';
  if (editMode) { stopProgram(); karel={...karelInit}; world.grid=worldInit.map(r=>[...r]); karelEditDir=karelInit.dir; updateSizeIndicators(); setBrush('.'); }
  renderWorldFull();  // FIX: cal rebuild complet per rebind d'events d'edició
}

function setBrush(b) {
  editBrush=b;
  ['dot','P','A','K'].forEach(id=>document.getElementById('brush-'+id)?.classList.remove('active'));
  const map={'.':'dot','P':'P','A':'A','K':'K'};
  document.getElementById('brush-'+map[b])?.classList.add('active');
  const ds = document.getElementById('dir-section');
  if (ds) ds.style.display = b==='K'?'block':'none';
  updateDirButtons();
}

function setKarelDir(d) { karelEditDir=d; karelInit={...karelInit,dir:d}; karel={...karelInit}; currentCSV=worldToCSV(); updateDirButtons(); renderWorld(); }
function updateDirButtons() { [0,1,2,3].forEach(d=>document.getElementById('dir-'+d)?.classList.toggle('active',d===karelEditDir)); }

function applyBrushAt(col, row) {
  if (col<0||col>=world.cols||row<0||row>=world.rows) return;
  let changed=false;
  if (editBrush==='K') {
    if (karelInit.x!==col||karelInit.y!==row) { karelInit={x:col,y:row,dir:karelEditDir,motxilla:0}; karel={...karelInit}; changed=true; }
  } else {
    if (karelInit.x===col&&karelInit.y===row) return;
    if (world.grid[row][col]!==editBrush) { world.grid[row][col]=editBrush; worldInit[row][col]=editBrush; changed=true; }
  }
  if (changed) { currentCSV=worldToCSV(); renderWorld(); }
}

function updateSizeIndicators() {
  const r=document.getElementById('rval-rows'); const c=document.getElementById('rval-cols');
  if (r) r.textContent=world.rows; if (c) c.textContent=world.cols;
}

function addRow()    { if(world.rows>=20)return; const nr=Array(world.cols).fill('.'); world.grid.push([...nr]); worldInit.push([...nr]); world.rows++; currentCSV=worldToCSV(); updateSizeIndicators(); renderWorldFull(); }
function removeRow() { if(world.rows<=1)return; if(karelInit.y>=world.rows-1){karelInit={...karelInit,y:world.rows-2};karel={...karelInit};} world.grid.pop();worldInit.pop();world.rows--; currentCSV=worldToCSV(); updateSizeIndicators(); renderWorldFull(); }
function addCol()    { if(world.cols>=20)return; world.grid.forEach((r,i)=>{r.push('.');worldInit[i].push('.');}); world.cols++; currentCSV=worldToCSV(); updateSizeIndicators(); renderWorldFull(); }
function removeCol() { if(world.cols<=1)return; if(karelInit.x>=world.cols-1){karelInit={...karelInit,x:world.cols-2};karel={...karelInit};} world.grid.forEach((r,i)=>{r.pop();worldInit[i].pop();}); world.cols--; currentCSV=worldToCSV(); updateSizeIndicators(); renderWorldFull(); }

document.getElementById('world-grid').addEventListener('touchstart', e => {
  if (!editMode) return; e.preventDefault();
  _dragSnapshot = _takeSnapshot();   // captura snapshot per undo tàctil
  const touch=e.touches[0], el=document.elementFromPoint(touch.clientX,touch.clientY);
  const c=el?.dataset?.col!==undefined?el:el?.closest?.('[data-col]');
  if(c) applyBrushAt(+c.dataset.col,+c.dataset.row);
}, {passive:false});

document.getElementById('world-grid').addEventListener('touchmove', e => {
  if (!editMode) return; e.preventDefault();
  const tc=e.touches[0], el=document.elementFromPoint(tc.clientX,tc.clientY);
  const c=el?.dataset?.col!==undefined?el:el?.closest?.('[data-col]');
  if(c) applyBrushAt(+c.dataset.col,+c.dataset.row);
}, {passive:false});

document.getElementById('world-grid').addEventListener('touchend', () => {
  if (!editMode || !_dragSnapshot) return;
  if (currentCSV !== _dragSnapshot.csv) {
    _undoStack.push(_dragSnapshot);
    if (_undoStack.length > _UNDO_MAX) _undoStack.shift();
    _redoStack.length = 0;
    _updateUndoButtons();
  }
  _dragSnapshot = null;
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 13b. UNDO / REDO (Editor de mapes)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const _undoStack = [];   // snapshots anteriors
const _redoStack = [];   // snapshots desfer
const _UNDO_MAX  = 50;   // límit d'historial
let   _dragSnapshot = null; // snapshot capturat a l'inici d'un drag

function _takeSnapshot() {
  return {
    grid: world.grid.map(r => [...r]),
    gridInit: worldInit.map(r => [...r]),
    karel: { ...karelInit },
    rows: world.rows,
    cols: world.cols,
    csv: currentCSV,
  };
}

function _restoreSnapshot(snap) {
  world.grid = snap.grid.map(r => [...r]);
  worldInit  = snap.gridInit.map(r => [...r]);
  world.rows = snap.rows;
  world.cols = snap.cols;
  karelInit  = { ...snap.karel };
  karel      = { ...karelInit };
  karelEditDir = karelInit.dir;
  currentCSV = snap.csv;
  updateSizeIndicators();
  renderWorldFull();
  _updateUndoButtons();
}

// Desa l'estat actual a l'undo stack (cridat ABANS de fer canvis)
function _pushUndo() {
  _undoStack.push(_takeSnapshot());
  if (_undoStack.length > _UNDO_MAX) _undoStack.shift();
  _redoStack.length = 0;   // qualsevol edit nou invalida el redo
  _updateUndoButtons();
}

function editUndo() {
  if (!_undoStack.length) return;
  _redoStack.push(_takeSnapshot());
  _restoreSnapshot(_undoStack.pop());
}

function editRedo() {
  if (!_redoStack.length) return;
  _undoStack.push(_takeSnapshot());
  _restoreSnapshot(_redoStack.pop());
}

function _updateUndoButtons() {
  const u = document.getElementById('btn-undo');
  const r = document.getElementById('btn-redo');
  if (u) u.disabled = _undoStack.length === 0;
  if (r) r.disabled = _redoStack.length === 0;
}

// ── Captura snapshot a l'inici de cada drag (mousedown/touchstart) ──
document.getElementById('world-grid')?.addEventListener('mousedown', () => {
  if (!editMode) return;
  _dragSnapshot = _takeSnapshot();
});

// ── En acabar el drag, compara i desa si ha canviat ──
const _origMouseUp = () => { editDragging = false; };
document.removeEventListener('mouseup', _origMouseUp); // no podem treure l'anònim original
// Sobreescrivim amb una versió que també gestiona l'undo:
document.addEventListener('mouseup', () => {
  if (!editMode) { editDragging = false; return; }
  editDragging = false;
  if (_dragSnapshot && currentCSV !== _dragSnapshot.csv) {
    _undoStack.push(_dragSnapshot);
    if (_undoStack.length > _UNDO_MAX) _undoStack.shift();
    _redoStack.length = 0;
    _updateUndoButtons();
  }
  _dragSnapshot = null;
});

// ── Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y ──
document.addEventListener('keydown', e => {
  if (!editMode) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); editUndo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey)  { e.preventDefault(); editRedo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y')                 { e.preventDefault(); editRedo(); }
});

// ── Undo per a operacions de mida (add/remove row/col) ──
// Embolcallem les funcions originals per afegir _pushUndo() abans
const _origAddRow = addRow, _origRemoveRow = removeRow, _origAddCol = addCol, _origRemoveCol = removeCol;
addRow    = function() { _pushUndo(); _origAddRow(); _updateUndoButtons(); };
removeRow = function() { _pushUndo(); _origRemoveRow(); _updateUndoButtons(); };
addCol    = function() { _pushUndo(); _origAddCol(); _updateUndoButtons(); };
removeCol = function() { _pushUndo(); _origRemoveCol(); _updateUndoButtons(); };


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 14. CONTROL D'EXECUCIÓ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildInterpreter() {
  const ast = parseCode(document.getElementById('code-editor')?.value || '');
  if (!ast) return null;
  procs={};callDepth=0;_stepCount=0;
  for (const node of ast) if (node.type==='proc') procs[node.name]=node.body;
  return runStmts(ast.filter(n=>n.type!=='proc'));
}

function runProgram() {
  if (running) return;
  const gen=buildInterpreter(); if (!gen) return;
  clearLineMarks(); interpreter=gen; stepMode=false; running=true;
  setStateUI('running'); log(t('log.running'),'ok'); tick();
}

function stepProgram() {
  if (!running&&!interpreter) {
    const gen=buildInterpreter(); if (!gen) return;
    clearLineMarks(); interpreter=gen; running=true; stepMode=true;
    setStateUI('step'); log(t('log.step_mode'),'ok');
  }
  doStep();
}

function doStep() {
  if (!interpreter) return;
  const res=interpreter.next();
  if (res.done) { log(t('log.done'),'ok'); clearLineMarks(); running=false; interpreter=null; setStateUI('idle'); checkChallengeSuccess(); return; }
  execAction(res.value);
}

function tick() {
  if (!running||stepMode||!interpreter) return;
  const res=interpreter.next();
  if (res.done) { log(t('log.done'),'ok'); clearLineMarks(); running=false; interpreter=null; setStateUI('idle'); checkChallengeSuccess(); return; }
  const ok=execAction(res.value);
  if (ok!==false) tickTimer=setTimeout(tick,stepDelay);
}

function stopProgram() {
  const was=running||stepMode;
  running=false;stepMode=false;interpreter=null;
  if (tickTimer){clearTimeout(tickTimer);tickTimer=null;}
  if (was){clearLineMarks();setStateUI('idle');}
}

function resetKarel() {
  stopProgram(); world.grid=worldInit.map(r=>[...r]); karel={...karelInit};
  clearLineMarks(); renderWorldFull(); updateStatus(); setStateUI('idle');
  log(t('log.reset'),'dim');
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 15. RESSALTAT SINTÀCTIC + NÚMEROS DE LÍNIA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function tokenizeLine(line) {
  let out='', i=0;
  while (i<line.length) {
    const c=line[i];
    if (/\s/.test(c)) { let ws=''; while(i<line.length&&/\s/.test(line[i])) ws+=line[i++]; out+=escHtml(ws); }
    else if ('{}()'.includes(c)) { out+=`<span class="hl-br">${escHtml(c)}</span>`; i++; }
    else if (/[0-9]/.test(c)) { let n=''; while(i<line.length&&/[0-9]/.test(line[i])) n+=line[i++]; out+=`<span class="hl-num">${n}</span>`; }
    else {
      let w=''; while(i<line.length&&!/[\s{}()\/]/.test(line[i])) w+=line[i++];
      if      (KEYWORDS.has(w)) out+=`<span class="hl-kw">${escHtml(w)}</span>`;
      else if (COMMANDS.has(w)) out+=`<span class="hl-cmd">${escHtml(w)}</span>`;
      else if (CONDS.has(w))    out+=`<span class="hl-cond">${escHtml(w)}</span>`;
      else                      out+=`<span class="hl-user">${escHtml(w)}</span>`;
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────
// FIX CURSOR (bug 4):
//
// Causa del bug: el codi anterior usava display:block
// en els spans .code-line + join(''), i padding-left:2px.
// Qualsevol propietat de layout en els spans de l'overlay
// desplaça el text respecte al textarea, i el cursor
// (que pertany al textarea) apareix en el lloc equivocat.
//
// Solució:
//  • highlightCode: join('\n') — el \n és el separador
//    de línia, igual que en el textarea (white-space:pre).
//  • .code-line: spans inline purs, sense cap propietat
//    de layout. Cap padding, cap border, cap display:block.
//  • El fons de línia activa/error es fa amb #line-bg
//    (capa separada) per no afectar el text de l'overlay.
// ─────────────────────────────────────────────────────

function highlightCode(code) {
  return code.split('\n').map((line, i) => {
    const ln = i + 1;
    const ci = line.indexOf('//');
    const content = ci !== -1
      ? tokenizeLine(line.slice(0, ci)) + `<span class="hl-cm">${escHtml(line.slice(ci))}</span>`
      : tokenizeLine(line);
    // Span inline: NO display:block, NO padding, NO border → no desplaça res
    return `<span class="code-line" id="cln-${ln}">${content}</span>`;
  }).join('\n');   // ← '\n' és el separador, igual que en el textarea (white-space:pre)
}

// Actualitza el #line-bg (una fila per línia de codi)
function updateLineBg(numLines) {
  const bg = document.getElementById('line-bg');
  if (!bg) return;
  bg.innerHTML = Array.from({length: numLines}, (_, i) =>
    `<div class="lbg-row" id="lbg-${i + 1}"></div>`
  ).join('');
}

// El marcatge de línies activa/error es fa sobre #line-bg, NO sobre .code-line
function highlightLine(n) {
  document.querySelectorAll('.lbg-row.active').forEach(el => el.classList.remove('active'));
  if (!n) return;
  const row = document.getElementById('lbg-' + n);
  if (!row) return;
  row.classList.add('active');

  // Desplaça totes les capes perquè la línia activa sigui sempre visible
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('code-highlight');
  const bg = document.getElementById('line-bg');
  const ln = document.getElementById('line-numbers');
  if (!ta) return;

  const style   = window.getComputedStyle(ta);
  const lineH   = parseFloat(style.lineHeight);
  const padTop  = parseFloat(style.paddingTop);
  const lineTop = padTop + (n - 1) * lineH;   // coordenada superior de la línia n
  const edH     = ta.clientHeight;

  // Només desplaça si la línia queda fora de la zona visible
  if (lineTop < ta.scrollTop || lineTop + lineH > ta.scrollTop + edH) {
    const target = Math.max(0, lineTop - edH / 2 + lineH / 2);
    ta.scrollTop = target;
    if (hl) hl.scrollTop = target;
    if (bg) bg.scrollTop = target;
    if (ln) ln.scrollTop = target;
  }
}
function markErrorLine(n) {
  if (n) document.getElementById('lbg-' + n)?.classList.add('error');
}
function clearLineMarks() {
  document.querySelectorAll('.lbg-row.active, .lbg-row.error')
    .forEach(el => el.classList.remove('active', 'error'));
  hideHelp();
}

function updateEditor() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('code-highlight');
  const ln = document.getElementById('line-numbers');
  const bg = document.getElementById('line-bg');
  if (!ta || !hl || !ln) return;
  const code  = ta.value;
  const lines = code.split('\n');
  hl.innerHTML = highlightCode(code);
  hl.scrollTop  = ta.scrollTop;
  hl.scrollLeft = ta.scrollLeft;   // FIX Bug 1: sincronitza scroll horitzontal
  ln.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
  ln.scrollTop = ta.scrollTop;
  if (bg) {
    updateLineBg(lines.length);
    bg.scrollTop  = ta.scrollTop;
    bg.scrollLeft = ta.scrollLeft; // FIX Bug 1: sincronitza scroll horitzontal
  }
}

// Inicialització de l'editor (condicional: no existeix a edit-mapa.html)
const codeTA = document.getElementById('code-editor');
if (codeTA) {
  // (el valor inicial s'estableix a la secció 18)

  codeTA.addEventListener('input', () => {
    updateEditor();
    localStorage.setItem(LS_KEY_CODE, codeTA.value);
  });

  // FIX 2 - cursor: sincronitzem les TRES capes (highlight, line-bg, numeració)
  codeTA.addEventListener('scroll', () => {
    const st = codeTA.scrollTop;
    const sl = codeTA.scrollLeft;   // FIX Bug 1: captura scroll horitzontal
    const hl = document.getElementById('code-highlight');
    hl.scrollTop  = st;
    hl.scrollLeft = sl;             // FIX Bug 1: sincronitza scroll horitzontal
    document.getElementById('line-numbers').scrollTop = st;
    const bg = document.getElementById('line-bg');
    if (bg) { bg.scrollTop = st; bg.scrollLeft = sl; } // FIX Bug 1
  });

  codeTA.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = codeTA.selectionStart, end = codeTA.selectionEnd;
      codeTA.value = codeTA.value.slice(0, s) + '  ' + codeTA.value.slice(end);
      codeTA.selectionStart = codeTA.selectionEnd = s + 2;
      updateEditor();
    }
  });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 15b. AUTOCOMPLETAT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(function initAutocomplete() {
  const ta = document.getElementById('code-editor');
  const ac = document.getElementById('autocomplete');
  if (!ta || !ac) return;

  let acItems   = [];   // [{text, kind}]
  let acIndex   = -1;

  // Tota la vocabulari del codelang actual, amb el seu tipus
  function getVocab() {
    const tk = I18N[currentCodeLang].tokens;
    return [
      ...tk.commands.map(w  => ({ text: w, kind: 'cmd'  })),
      ...tk.conditions.map(w => ({ text: w, kind: 'cond' })),
      ...tk.keywords.map(w   => ({ text: w, kind: 'kw'   })),
    ];
  }

  // Paraula parcial just abans del cursor (accepta lletres, dígits, punt, guió)
  function currentWord() {
    const before = ta.value.slice(0, ta.selectionStart);
    return (before.match(/[\w.\-àáèéíïòóúüçñ]+$/) || [''])[0];
  }

  // Coordenades de pantalla del cursor (per a position:fixed)
  let _acCanvas = null;
  function caretScreenPos() {
    const rect  = ta.getBoundingClientRect();
    const style = window.getComputedStyle(ta);
    const lineH = parseFloat(style.lineHeight);
    const padT  = parseFloat(style.paddingTop);
    const padL  = parseFloat(style.paddingLeft);

    // Amplada de caràcter precisa per a Space Mono (monospace)
    _acCanvas = _acCanvas || document.createElement('canvas');
    const ctx = _acCanvas.getContext('2d');
    ctx.font  = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const charW = ctx.measureText('m').width;

    const text  = ta.value.slice(0, ta.selectionStart);
    const lines = text.split('\n');
    const row   = lines.length - 1;
    const col   = lines[row].length;

    return {
      top:  rect.top  + padT + row * lineH - ta.scrollTop  + lineH + 2,
      left: rect.left + padL + col * charW - ta.scrollLeft,
    };
  }

  function renderAC() {
    ac.innerHTML = acItems.map((it, i) =>
      `<div class="ac-item${i === acIndex ? ' selected' : ''}"
            data-idx="${i}" data-kind="${it.kind}"
            role="option" aria-selected="${i === acIndex}">${it.text}</div>`
    ).join('');
  }

  function showAC(items) {
    acItems = items;
    acIndex = 0;
    const pos = caretScreenPos();
    // Evita que el menú surti per sota de la pantalla
    const dropH = Math.min(items.length * 27 + 4, 200);
    const top   = (pos.top + dropH > window.innerHeight - 8)
                  ? pos.top - dropH - parseFloat(window.getComputedStyle(ta).lineHeight) - 4
                  : pos.top;
    ac.style.top  = top  + 'px';
    ac.style.left = Math.max(4, pos.left) + 'px';
    renderAC();
    ac.classList.add('visible');
  }

  function hideAC() {
    ac.classList.remove('visible');
    acItems = [];
    acIndex = -1;
  }

  function acceptAC(idx) {
    const item = acItems[idx ?? acIndex];
    if (!item) return;
    const word = currentWord();
    const pos  = ta.selectionStart;
    const pre  = ta.value.slice(0, pos - word.length);
    const post = ta.value.slice(pos);
    ta.value = pre + item.text + post;
    ta.selectionStart = ta.selectionEnd = pre.length + item.text.length;
    hideAC();
    updateEditor();
    localStorage.setItem(LS_KEY_CODE, ta.value);
    ta.focus();
  }

  // ── Mostra suggeriments mentre l'usuari escriu ──
  ta.addEventListener('input', () => {
    const word = currentWord();
    if (word.length < 2) { hideAC(); return; }
    const wordLower = word.toLowerCase();
    const matches = getVocab().filter(it =>
      it.text.startsWith(wordLower) && it.text !== wordLower
    );
    if (matches.length) showAC(matches); else hideAC();
  });

  // ── Navegació per teclat ──
  ta.addEventListener('keydown', e => {
    if (!ac.classList.contains('visible')) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        acIndex = Math.min(acIndex + 1, acItems.length - 1);
        renderAC();
        ac.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
        break;
      case 'ArrowUp':
        e.preventDefault();
        acIndex = Math.max(acIndex - 1, 0);
        renderAC();
        ac.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
        break;
      case 'Enter':
      case 'Tab':
        if (acItems.length) { e.preventDefault(); acceptAC(); }
        break;
      case 'Escape':
        e.preventDefault();
        hideAC();
        break;
    }
  });

  // ── Clic sobre un suggeriment ──
  ac.addEventListener('mousedown', e => {
    const item = e.target.closest('.ac-item');
    if (!item) return;
    e.preventDefault();    // evita que el textarea perdi el focus
    acceptAC(+item.dataset.idx);
  });

  // ── Tanca en perdre el focus o fer clic fora ──
  ta.addEventListener('blur', () => setTimeout(hideAC, 150));
  ta.addEventListener('click', hideAC);
  // Actualitza posició si la finestra canvia de mida
  window.addEventListener('resize', hideAC);
})(/* initAutocomplete */);

// Dreceres de teclat
if (codeTA) {
  document.addEventListener('keydown', e => {
    const tag=document.activeElement.tagName;
    if (tag==='TEXTAREA'||tag==='INPUT') return;
    if (e.key==='F5')  { e.preventDefault(); runProgram(); }
    if (e.key==='F10') { e.preventDefault(); stepProgram(); }
    if (e.key==='F8')  { e.preventDefault(); stopProgram(); }
  });
}

// Fix 3 - velocitat: mostra números 1-6 (no paraules)
// Fix bug: t('speed') retornava l'array com a string. Usem l'índex directament.
const speedSlider = document.getElementById('speed');
if (speedSlider) {
  speedSlider.addEventListener('input', function () {
    const idx = parseInt(this.value) - 1;  // 0-5
    stepDelay  = SPEED_DELAYS[idx];
    const lbl  = document.getElementById('speed-lbl');
    if (lbl) lbl.textContent = I18N[currentUserLang].speed[idx] || this.value;
  });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 16. TOKENITZADOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function tokenize(code) {
  const toks=[]; let i=0, line=1;
  while (i<code.length) {
    const c=code[i];
    if (c==='\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c==='/'&&code[i+1]==='/') { while(i<code.length&&code[i]!=='\n') i++; continue; }
    if ('{}()'.includes(c)) { toks.push({t:c,line}); i++; continue; }
    if (/[0-9]/.test(c)) { let n=''; const tl=line; while(i<code.length&&/[0-9]/.test(code[i])) n+=code[i++]; toks.push({t:'N',v:parseInt(n),line:tl}); continue; }
    if (!/[\s{}()\/]/.test(c)) { let w=''; const tl=line; while(i<code.length&&!/[\s{}()\/]/.test(code[i])) w+=code[i++]; toks.push({t:'W',v:w,line:tl}); continue; }
    i++;
  }
  toks.push({t:'EOF',line});
  return toks;
}


// Error de sintaxi amb codi per al sistema d'ajuda
class KarelSyntaxError extends Error {
  constructor(msg, code, line) { super(msg); this.code = code; this.errorLine = line ?? null; }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17. PARSER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class Parser {
  constructor(toks) { this.toks=toks; this.i=0; }
  peek() { return this.toks[this.i]; }
  next() { return this.toks[this.i++]; }

  eat(t, v) {
    const tok = this.peek();
    if (tok.t !== t || (v !== undefined && tok.v !== v)) {
      const got  = tok.v ?? tok.t;
      const want = v ?? t;
      // Deduïm el codi d'error a partir del token esperat
      const errCode = (t === '{' || t === '}') ? 'syntax_brace'
                    : (t === '(' || t === ')') ? 'syntax_paren'
                    : t === 'N'                ? 'syntax_number'
                    :                           'syntax_instr';
      throw new KarelSyntaxError(
        tf('parse.expected', { want, got, n: tok.line }),
        errCode,
        tok.line
      );
    }
    return this.next();
  }

  parseAll() { const s=[]; while(this.peek().t!=='EOF') s.push(this.parseStmt()); return s; }

  parseStmt() {
    const tok=this.peek(), line=tok.line;
    if (tok.t!=='W')
      throw new KarelSyntaxError(
        tf('parse.unexpected', { tok: tok.v ?? tok.t, n: line }),
        'syntax_instr',
        line
      );
    const w=tok.v;
    if (COMMANDS.has(w)) { this.next(); return {type:'command',name:w,line}; }
    if (w===KW_IF) {
      this.next(); this.eat('('); const cond=this.parseCond(); this.eat(')');
      const thenB=this.parseBlock(); let elseB=[];
      const nxt=this.peek();
      if (nxt.t==='W'&&KW_ELSE_ALIASES.includes(nxt.v)) { this.next(); elseB=this.parseBlock(); }
      return {type:'if',cond,then:thenB,else:elseB,line};
    }
    if (w===KW_WHILE) {
      this.next(); this.eat('('); const cond=this.parseCond(); this.eat(')');
      return {type:'while',cond,body:this.parseBlock(),line};
    }
    if (w===KW_REPEAT) {
      this.next(); this.eat('('); const num=this.eat('N'); this.eat(')');
      return {type:'repeat',count:num.v,body:this.parseBlock(),line};
    }
    if (w===KW_PROC) {
      this.next(); const nt=this.peek();
      if (nt.t!=='W')
        throw new KarelSyntaxError(
          tf('parse.expected_proc', { n: nt.line }),
          'syntax_instr',
          nt.line
        );
      const name=nt.v; this.next(); return {type:'proc',name,body:this.parseBlock(),line};
    }
    // Crida a procediment definit per l'usuari
    this.next(); return {type:'call',name:w,line};
  }

  parseBlock() {
    this.eat('{');
    const s=[];
    while(this.peek().t!=='}'&&this.peek().t!=='EOF') s.push(this.parseStmt());
    this.eat('}');
    return s;
  }
  parseCond()    { return this.parseOrCond(); }
  parseOrCond()  { let l=this.parseAndCond(); while(this.peek().t==='W'&&this.peek().v===KW_OR)  { const ln=this.peek().line; this.next(); l={type:'or', left:l,right:this.parseAndCond(),ln}; } return l; }
  parseAndCond() { let l=this.parseNotCond(); while(this.peek().t==='W'&&this.peek().v===KW_AND) { const ln=this.peek().line; this.next(); l={type:'and',left:l,right:this.parseNotCond(),ln}; } return l; }
  parseNotCond() {
    const tok=this.peek();
    if (tok.t==='W'&&tok.v===KW_NOT) {
      const line=tok.line; this.next(); this.eat('('); const inner=this.parseCond(); this.eat(')');
      return {type:'not',inner,line};
    }
    return this.parseAtomCond();
  }
  parseAtomCond() {
    const tok=this.peek(), line=tok.line;
    if (tok.t==='W'&&CONDS.has(tok.v)) { this.next(); return {type:'condition',name:tok.v,line}; }
    throw new KarelSyntaxError(
      tf('parse.unknown_cond', { tok: tok.v ?? tok.t, n: line }),
      'syntax_cond',
      line
    );
  }
}

function parseCode(code) {
  try {
    return new Parser(tokenize(code)).parseAll();
  } catch (e) {
    // Extreu el número de línia directament de l'error (no regex dependent d'idioma)
    const ln = (e instanceof KarelSyntaxError) ? e.errorLine : null;
    const errCode = (e instanceof KarelSyntaxError) ? e.code : 'syntax_instr';
    logError(`❌ ${t('err.syntax')}: ${e.message}`, errCode, ln);
    if (ln) markErrorLine(ln);
    setStateUI('error');
    return null;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17a. MILLORA 2 — SISTEMA DE PISTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function startHintTimer() {
  // Reinicia el sistema de pistes per al nou repte
  hintLevel    = 0;
  hintLoadTime = Date.now();
  if (hintCountdownId) clearInterval(hintCountdownId);
  hideHintPanel();
  updateHintButton();
  hintCountdownId = setInterval(tickHintCountdown, 1000);
}

function tickHintCountdown() {
  if (!hintLoadTime) return;
  const elapsed = Date.now() - hintLoadTime;
  if (elapsed >= HINT_DELAY_MS) {
    clearInterval(hintCountdownId);
    hintCountdownId = null;
  }
  updateHintButton();
}

function updateHintButton() {
  const btn = document.getElementById('btn-hint');
  if (!btn) return;

  if (!currentChallengeId) { btn.style.display = 'none'; return; }
  btn.style.display = '';

  if (hintLevel >= 2) {
    // Totes les pistes ja mostrades
    btn.disabled    = true;
    btn.textContent = t('ui.hint_exhausted') || '✓ Totes les pistes vistes';
    btn.title       = '';
    return;
  }

  const elapsed = hintLoadTime ? Date.now() - hintLoadTime : 0;
  const remaining = Math.max(0, HINT_DELAY_MS - elapsed);

  if (remaining <= 0) {
    // Desbloquejat
    btn.disabled    = false;
    const label = hintLevel === 0
      ? (t('ui.hint_btn')  || '💡 Pista')
      : (t('ui.hint_next') || 'Pista 2 →');
    btn.textContent = label;
    btn.title       = '';
  } else {
    // Comptat enrere
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    const tmpl = t('ui.hint_locked') || '🔒 Pista ({time})';
    btn.disabled    = true;
    btn.textContent = tmpl.replace('{time}', timeStr);
    btn.title       = (t('ui.hint_waiting') || 'Pista disponible en') + ' ' + timeStr;
  }
}

function showNextHint() {
  const ch = I18N[currentUserLang]?.challenges?.find(c => c.id === currentChallengeId);
  if (!ch || !ch.hints) return;

  const nextLevel = hintLevel + 1;  // 1 o 2
  const hintText  = ch.hints[nextLevel - 1];
  if (!hintText) return;

  hintLevel = nextLevel;
  renderHintPanel(nextLevel, hintText, ch.hints.length);
  updateHintButton();
}

function renderHintPanel(level, text, total) {
  const panel = document.getElementById('hint-panel');
  if (!panel) return;

  const title    = escHtml((t('ui.hint_panel_title') || '💡 Pista') + ' ' + level);
  const closeTip = escHtml(t('ui.hint_close') || 'Tanca');

  panel.innerHTML = `
    <div class="hint-header">
      <span class="hint-title">${title}</span>
      <button class="hint-close-btn" title="${closeTip}">✕</button>
    </div>
    <div class="hint-body">${sanitizeHtml(text)}</div>
    <div class="hint-progress">${Array.from({length: total}, (_, i) =>
      `<span class="hint-dot${i < level ? ' done' : ''}"></span>`).join('')}
    </div>`;
  panel.querySelector('.hint-close-btn')?.addEventListener('click', hideHintPanel);
  panel.classList.add('visible');
}

function hideHintPanel() {
  document.getElementById('hint-panel')?.classList.remove('visible');
}




// Condicions d'èxit per a cada repte (per id):
// Retorna true si l'estat final de Karel/món és correcte.
function isChallengeSuccess(id) {
  const ch = I18N[currentUserLang]?.challenges?.find(c => c.id === id);
  if (!ch) return false;

  // Funció auxiliar: compta gotes al món
  function waterOnMap() {
    let n = 0;
    for (const row of world.grid) for (const c of row) if (c === 'A') n++;
    return n;
  }
  // Cap gota al mapa (totes recollides)
  function noWaterOnMap() { return waterOnMap() === 0; }

  switch (id) {
    case 1: // Avança fins la paret: Karel s'ha mogut i té paret al davant
      return _stepCount >= 2
        && (karel.x !== karelInit.x || karel.y !== karelInit.y)
        && isWall(front().x, front().y);
    case 2: // Recull una gota: la motxilla té > 0 gotes
      return karel.motxilla > 0;
    case 3: // Recull totes les gotes
      return noWaterOnMap() && karel.motxilla > 0;
    case 4: // Corre i torna: Karel ha tornat al punt de partida i ha girat (no programa buit)
      return _stepCount >= 3
        && karel.x === karelInit.x && karel.y === karelInit.y
        && karel.dir !== karelInit.dir;
    case 5: // Condicions combinades: ha de recollir alguna gota
      return karel.motxilla > 0;
    case 6: // Primer procediment: recull i torna
      return noWaterOnMap() && karel.x === karelInit.x && karel.y === karelInit.y;
    case 7: // Recull i diposita: totes les gotes a la fila inferior (y=1)
      return karel.motxilla === 0 && waterOnMap() > 0 &&
        world.grid[1]?.filter(c => c === 'A').length > 0;
    case 8: // Laberint: Karel ha navegat pel laberint (s'ha mogut prou i està lluny del punt de partida)
      return _stepCount >= 6
        && (Math.abs(karel.x - karelInit.x) + Math.abs(karel.y - karelInit.y)) >= 4;
    case 9: // Serpenteja: recull totes les gotes
      return noWaterOnMap() && karel.motxilla > 0;

    // ── CODE IN PLACE (Stanford) ──
    case 101: // Welcome Karel: avança fins la gota i agafa-la
      return noWaterOnMap() && karel.motxilla > 0;
    case 102: // Step Up: Karel ha de pujar el graó i agafar la gota (fila 0)
      return noWaterOnMap() && karel.motxilla > 0 && karel.y === 0;
    case 103: // Collect Newspaper: recull diari i torna a la posició original
      return noWaterOnMap() && karel.motxilla > 0
        && karel.x === karelInit.x && karel.y === karelInit.y;
    case 104: // Beeper Path: segueix el rastre recollint totes les gotes
      return noWaterOnMap() && karel.motxilla > 0;
    case 105: // Steeple Chase: arriba a la gota final saltant tanques
      return noWaterOnMap() && karel.motxilla > 0;
    case 106: // Cleanup Karel: recull totes les gotes (escombrat complet)
      return noWaterOnMap() && karel.motxilla > 0;

    default: return false;
  }
}

function checkChallengeSuccess() {
  if (!currentChallengeId) return;
  if (!isChallengeSuccess(currentChallengeId)) return;

  const ch = I18N[currentUserLang]?.challenges?.find(c => c.id === currentChallengeId);
  if (!ch) return;

  // Missatge de celebració al log
  log('🏆 ' + t('ui.success_title'), 'ok');

  // Obre el modal d'èxit després d'un petit retard (per veure l'animació)
  setTimeout(() => {
    const icons = ['🎉','🏆','⭐','🚀','🌟'];
    const icon  = icons[currentChallengeId % icons.length];
    document.getElementById('success-icon').textContent     = icon;
    const chLabel = ch.category === 'cp'
      ? 'CP ' + (ch.id - 100) + ': ' + ch.title
      : (t('log.challenge') || 'Repte') + ' ' + ch.id + ': ' + ch.title;
    document.getElementById('success-challenge').textContent = chLabel;
    document.getElementById('success-title').textContent    = t('ui.success_title');
    document.getElementById('success-msg').textContent      = t('ui.success_msg');

    const btnMore  = document.getElementById('btn-success-more');
    const btnClose = document.getElementById('btn-success-close');
    if (btnMore)  btnMore.textContent  = t('ui.success_more')  || '🎯 Més reptes';
    if (btnClose) btnClose.textContent = t('ui.success_close') || 'Continua';

    openModal('modal-success');
  }, 400);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17b-bis. OBJECTIU + RESTAURAR CODI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function renderGoalPreview(csv, container) {
  const { grid, rows, cols, kStart } = parseCSV(csv);
  const maxDim = Math.max(rows, cols);
  const cellPx = Math.max(18, Math.min(38, Math.floor(280 / maxDim)));
  const fs = Math.max(10, cellPx - 6) + 'px';
  let html = `<div class="goal-grid" style="grid-template-columns:repeat(${cols},${cellPx}px);grid-template-rows:repeat(${rows},${cellPx}px);gap:2px;">`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isKarel = (c === kStart.x && r === kStart.y);
      if (isKarel) {
        html += `<div class="gcell c-k" style="font-size:${fs}">${KAREL_ASSETS.MEDUSA.replace('class="karel-entity"', 'class="karel-entity" data-dir="' + DIRS[kStart.dir].dataDir + '"')}</div>`;
      } else {
        const v = grid[r][c];
        if (v === 'P') html += `<div class="gcell c-p" style="font-size:${fs}">${KAREL_ASSETS.CORALL}</div>`;
        else if (v === 'A') html += `<div class="gcell c-a" style="font-size:${fs}">${KAREL_ASSETS.BOMBOLLA}</div>`;
        else html += `<div class="gcell c-e"></div>`;
      }
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

function showGoalModal() {
  if (!currentChallengeId) return;
  const ch = I18N[currentUserLang]?.challenges?.find(c => c.id === currentChallengeId);
  if (!ch) return;

  // Títol del modal
  const titleEl = document.getElementById('modal-goal-title');
  if (titleEl) titleEl.textContent = t('ui.goal_title') || '🎯 Objectiu';

  // Nom del repte
  const nameEl = document.getElementById('goal-challenge-name');
  if (nameEl) {
    const numLabel = ch.category === 'cp' ? `CP ${ch.id - 100}` : `${t('log.challenge')} ${ch.id}`;
    nameEl.textContent = `${numLabel}: ${ch.title}`;
  }

  // Instruccions del repte (desc amb HTML sanititzat)
  const instrEl = document.getElementById('goal-instructions');
  if (instrEl) instrEl.innerHTML = sanitizeHtml(ch.desc);

  // Previsualització visual de l'objectiu
  const csv = GOAL_CSV[currentChallengeId];
  const container = document.getElementById('goal-grid');
  const labelEl = document.getElementById('goal-visual-label');
  if (csv && container) {
    if (labelEl) labelEl.textContent = t('ui.goal_desc') || '';
    renderGoalPreview(csv, container);
    container.style.display = '';
    if (labelEl) labelEl.style.display = '';
  } else {
    if (container) container.style.display = 'none';
    if (labelEl) labelEl.style.display = 'none';
  }

  // Botó tanca
  const btnClose = document.getElementById('btn-goal-close');
  if (btnClose) btnClose.textContent = t('ui.close') || 'Tanca';

  openModal('modal-goal');
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17c. MILLORA 2 — ONBOARDING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LS_ONBOARD = 'karel-onboard-done';
let onboardStep = 0;

function openOnboard() {
  onboardStep = 0;
  renderOnboardStep();
  openModal('modal-onboard');
}

function renderOnboardStep() {
  const steps = I18N[currentUserLang]?.onboard || [];
  if (!steps.length) return;
  const s = steps[onboardStep];

  document.getElementById('onboard-icon').textContent  = s.icon;
  document.getElementById('onboard-title').textContent = s.title;
  document.getElementById('onboard-body').innerHTML    = sanitizeHtml(s.body);

  // Dots
  const dotsEl = document.getElementById('onboard-dots');
  if (dotsEl) {
    dotsEl.innerHTML = steps.map((_, i) =>
      `<div class="onboard-dot${i === onboardStep ? ' active' : ''}"></div>`
    ).join('');
  }

  // Botons
  const prevBtn = document.getElementById('onboard-prev');
  const nextBtn = document.getElementById('onboard-next');
  const skipBtn = document.getElementById('onboard-skip');
  if (prevBtn) prevBtn.style.visibility = onboardStep === 0 ? 'hidden' : 'visible';
  if (nextBtn) {
    const isLast = onboardStep === steps.length - 1;
    nextBtn.textContent = isLast
      ? (t('ui.onboard_start') || 'Comencem! 🚀')
      : (t('ui.onboard_next')  || 'Següent →');
  }
  if (skipBtn) skipBtn.textContent = t('ui.onboard_skip') || 'Salta';

  // Tutorial & edit-map buttons: only visible on last step
  const isLastStep = onboardStep === steps.length - 1;
  const tutBtn = document.getElementById('onboard-tutorial');
  if (tutBtn) {
    tutBtn.style.display = isLastStep ? 'block' : 'none';
    tutBtn.textContent = t('ui.onboard_tutorial') || '📖 Coneix Karel en 2 minuts';
  }
  const editBtn = document.getElementById('onboard-editmap');
  if (editBtn) {
    editBtn.style.display = isLastStep ? 'block' : 'none';
    editBtn.textContent = '🗺️ ' + (t('ui.return_lbl_edit') || 'Edita mapa');
  }
}

function onboardNext() {
  const steps = I18N[currentUserLang]?.onboard || [];
  if (onboardStep < steps.length - 1) {
    onboardStep++;
    renderOnboardStep();
  } else {
    localStorage.setItem(LS_ONBOARD, '1');
    closeModal('modal-onboard');
    // Obre directament els reptes a l'últim pas
    setTimeout(openChallenges, 200);
  }
}

function onboardPrev() {
  if (onboardStep > 0) { onboardStep--; renderOnboardStep(); }
}

function onboardSkip() {
  localStorage.setItem(LS_ONBOARD, '1');
  closeModal('modal-onboard');
}

function maybeShowOnboard() {
  if (!localStorage.getItem(LS_ONBOARD)) {
    openOnboard();
  } else {
    openReturnWelcome();
  }
}

function openReturnWelcome() {
  document.getElementById('return-title').textContent      = t('ui.return_title')        || 'Benvingut de nou!';
  document.getElementById('return-subtitle').textContent   = t('ui.return_subtitle')     || 'Que vols fer?';
  document.getElementById('return-lbl-challenge').textContent = t('ui.return_lbl_challenge') || 'Tria un repte';
  document.getElementById('return-desc-challenge').textContent= t('ui.return_desc_challenge')|| 'Clàssics o Code in Place (Stanford)';
  document.getElementById('return-lbl-csv').textContent    = t('ui.return_lbl_csv')      || 'Carrega un mapa CSV';
  document.getElementById('return-desc-csv').textContent   = t('ui.return_desc_csv')     || 'Obre un mapa personalitzat des del teu ordinador';
  document.getElementById('return-lbl-edit').textContent   = t('ui.return_lbl_edit')     || 'Edita mapa';
  document.getElementById('return-desc-edit').textContent  = t('ui.return_desc_edit')    || 'Crea o modifica un mapa des de l\'editor visual';
  openModal('modal-return');
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17d. MILLORA 5 — PANELL DE REFERÈNCIA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleRef() {
  const panel = document.getElementById('ref-panel');
  const btn   = document.getElementById('btn-ref');
  if (!panel) return;
  const isVisible = panel.classList.toggle('visible');
  if (btn) btn.classList.toggle('active', isVisible);
  if (isVisible) renderRefPanel();
}

function renderRefPanel() {
  const panel = document.getElementById('ref-panel');
  if (!panel) return;
  const tk = I18N[currentCodeLang].tokens;
  const ui = I18N[currentUserLang].ui;

  const cmdLabel  = escHtml(ui.ref_cmd  || 'Moviment');
  const condLabel = escHtml(ui.ref_cond || 'Condicions');
  const kwLabel   = escHtml(ui.ref_kw   || 'Estructures');

  const tokenRow = (list, kind) =>
    list.map(w => `<span class="ref-token ${escHtml(kind)}" title="${escHtml(w)}">${escHtml(w)}</span>`).join('');

  panel.innerHTML = `<div class="ref-grid">
    <div>
      <div class="ref-section-title">${cmdLabel}</div>
      <div class="ref-tokens">${tokenRow(tk.commands, 'cmd')}</div>
    </div>
    <div>
      <div class="ref-section-title">${condLabel}</div>
      <div class="ref-tokens">${tokenRow(tk.conditions, 'cond')}</div>
    </div>
    <div>
      <div class="ref-section-title">${kwLabel}</div>
      <div class="ref-tokens">${tokenRow(tk.keywords, 'kw')}</div>
    </div>
  </div>`;
}




// Aplica els tokens del LLENGUATGE DE PROGRAMACIÓ
applyCodeLang(currentCodeLang);

// Carrega el mapa des de URL o per defecte
// (nota: _urlParams ja s'ha creat a la secció 2)
const _urlMapa = _urlParams.get('mapa');
loadMapFromCSV(_urlMapa ?? DEFAULT_CSV);

// Omple l'editor: primer mira el localStorage, si no, codi d'exemple del codelang
if (codeTA) {
  const saved = localStorage.getItem(LS_KEY_CODE);
  codeTA.value = saved || DEFAULT_CODE[currentCodeLang] || DEFAULT_CODE.ca;
  updateEditor();
  setTimeout(() => updateEditor(), 50);
}

// Actualitza la UI amb l'idioma de la interfície
updateUI();

// Millora 2: mostra l'onboarding si és la primera visita (no si ve amb ?mapa=)
if (!_urlMapa) setTimeout(maybeShowOnboard, 500);
