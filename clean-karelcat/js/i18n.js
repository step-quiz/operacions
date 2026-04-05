// ════════════════════════════════════════════════════════
// i18n.js — Vocabulari del llenguatge + textos d'interfície
//
// Dos eixos ortogonals i independents:
//   K.CODE_LANGS[codeLang]  →  paraules que l'alumne escriu al codi
//   K.UI_LANGS[uiLang]      →  textos que l'alumne llegeix a la pantalla
//
// Ara: codeLang='en', uiLang='ca'. Afegir un altre codeLang o uiLang
// és tan senzill com afegir una entrada a l'objecte corresponent.
// ════════════════════════════════════════════════════════


// ── Vocabulari del llenguatge de programació ──

K.CODE_LANGS = {
  en: {
    _name: 'English',
    commands:   ['move','turn_right','turn_left','turn_around','grab','drop'],
    conditions: ['rock_ahead','path_clear','pearl_here','bag_empty','bag_full'],
    keywords:   ['if','else','while','repeat','proc','not','and','or'],
    if_kw:      'if',
    else_kw:    ['else'],
    while_kw:   'while',
    repeat_kw:  'repeat',
    proc_kw:    'proc',
    not_kw:     'not',
    and_kw:     'and',
    or_kw:      'or',
  },
};


// ── Textos d'interfície ──

K.UI_LANGS = {
  ca: {
    _name: 'Català',

    ui: {
      run:       '▶ Executa',
      stop:      '■ Atura',
      reset:     '↺ Reinicia',
      speed:     'Velocitat:',
      bag:       'Motxilla:',
    },

    state: {
      idle:    'aturat',
      running: 'executant',
      step:    'pas a pas',
      error:   'error',
    },

    speed: ['Molt lent', 'Lent', 'Normal', 'Ràpid', 'Molt ràpid', 'Màxim'],

    log: {
      running:    '▶ Executant…',
      step_mode:  '⏭ Mode pas a pas',
      done:       '✓ Programa acabat',
      reset:      '↺ Reiniciat',
      map_loaded: 'Mapa carregat ✓',
      line:       'línia',
      inf_loop:   '⚠ Bucle infinit detectat',
      deep_rec:   '⚠ Recursió massa profunda',
    },

    err: {
      rock:       'Karel ha xocat contra una roca',
      no_pearl:   'No hi ha cap perla en aquesta casella',
      bag_empty:  'La motxilla és buida',
      proc_undef: 'Procediment no definit',
      syntax:     'Error de sintaxi',
    },

    parse: {
      expected:      "Línia {n}: he llegit '{got}' però esperava '{want}'",
      unexpected:    "Línia {n}: no esperava '{tok}'",
      unknown_cond:  "Línia {n}: condició desconeguda '{tok}'",
      expected_proc: "Línia {n}: falta el nom del procediment",
    },
  },
};


// ── Sistema d'idioma: lectura dels textos d'interfície ──

function t(key) {
  const parts = key.split('.');
  let obj = K.UI_LANGS[K.state.uiLang];
  for (const k of parts) obj = obj?.[k];
  return (obj !== undefined && obj !== null) ? String(obj) : key;
}

function tf(key, vars) {
  let s = t(key);
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

K.t  = t;
K.tf = tf;
