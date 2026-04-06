// ════════════════════════════════════════════════════════
// reptes.js — Reptes predefinits + gestió de deep links (?repte=N)
//
// ESTRUCTURA DE CADA REPTE:
//   titol    (string) — títol curt del repte
//   enunciat (string) — descripció per a l'alumne (es mostra al log)
//   map      (string) — CSV del món inicial
//   code     (string) — codi inicial a l'editor
//
// DEEP LINK: index.html?repte=N
//   Carrega el repte N directament al simulador.
//   Útil per compartir des de Google Classroom o similar.
//
// FORMAT CSV: columnes separades per comes, files per salts de línia.
//   K> = Karel mirant a l'Est   K^ = Nord   K< = Oest   Kv = Sud
//   A  = Roca (obstacle)        P  = Perla   . = cel·la buida
// ════════════════════════════════════════════════════════

K.REPTES = {

  1: {
    titol:    'Primers passos',
    enunciat: '🎯 Repte 1 — Primers passos: En Karel s\'ha de moure fins a la perla i recollir-la. Quantes vegades cal moure?',
    map:
`K>,.,.,P,.,.\n` +
`.,.,.,.,.,.\n` +
`.,.,.,.,.,.\n`,
    code:
`// Repte 1: Primers passos
// Porta en Karel fins a la perla i recull-la.

`,
  },

  2: {
    titol:    'La perla al racó',
    enunciat: '🎯 Repte 2 — La perla al racó: En Karel és al centre. La perla és al racó inferior dret. Arriba-hi i recull-la.',
    map:
`.,.,.,.,.,.\n` +
`.,.,.,.,.,.\n` +
`.,.,K>,.,P,.\n` +
`.,.,.,.,.,.\n` +
`.,.,.,.,.,.\n`,
    code:
`// Repte 2: La perla al racó
// En Karel ha d'arribar a la perla i recollir-la.

`,
  },

  3: {
    titol:    'El passadís',
    enunciat: '🎯 Repte 3 — El passadís: En Karel ha de recollir totes les perles del passadís i arribar a l\'extrem oposat.',
    map:
`A,A,A,A,A,A,A\n` +
`K>,P,P,P,P,P,.\n` +
`A,A,A,A,A,A,A\n`,
    code:
`// Repte 3: El passadís
// Recull totes les perles i arriba a l'extrem dret.

`,
  },

  4: {
    titol:    'Anar i tornar',
    enunciat: '🎯 Repte 4 — Anar i tornar: En Karel ha de recollir la perla de la dreta i portar-la fins al quadrat marcat a l\'esquerra.',
    map:
`.,.,.,.,.,.\n` +
`.,.,.,.,.,.\n` +
`K>,.,.,.,P,.\n` +
`.,.,.,.,.,.\n`,
    code:
`// Repte 4: Anar i tornar
// Agafa la perla de la dreta i porta-la fins a la posició inicial.

`,
  },

  5: {
    titol:    'El laberint',
    enunciat: '🎯 Repte 5 — El laberint: En Karel ha de trobar el camí fins a la perla evitant les roques.',
    map:
`K>,.,A,.,.,.\n` +
`.,.,A,.,A,.\n` +
`.,.,.,.,A,.\n` +
`A,A,A,.,A,.\n` +
`.,.,.,.,.,P\n`,
    code:
`// Repte 5: El laberint
// Troba el camí fins a la perla evitant les roques.

`,
  },

};


// ── Exporta al namespace global ──

K.REPTES = K.REPTES;
