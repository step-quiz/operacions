/* ═══════════════════════════════════════════════════════════════════
   config.js — Configuració editorial del repàs PAU
   Edita aquest fitxer per gestionar vídeos i exercicis exclosos.
   No cal tocar index.html.
   ═══════════════════════════════════════════════════════════════════ */

/* ── EXERCICIS OPTATIUS ─────────────────────────────────────────────
   IDs dels exercicis que no cal estudiar obligatòriament aquest curs.
   Apareixen a la llista amb la marca "optatiu" però no desapareixen.
   L'ID és el nom base del fitxer sense el sufix -e/-p/-s.pdf        */
const OPTATIUS = new Set([
  // 'alg-23j-q2',
  // 'ana-24j-q1',
   'alg-24i-q2',
   'alg-23s-q1'
]);

/* ── VÍDEOS ─────────────────────────────────────────────────────────
   Exercicis amb vídeo explicatiu de YouTube.
   Clau  → ID de l'exercici (igual que a EXCLOSOS)
   Valor → ID del vídeo YouTube (la part ?v=XXXXX de l'URL)

   Exemple: https://www.youtube.com/watch?v=dQw4w9WgXcQ
            → 'alg-23j-q2': 'dQw4w9WgXcQ'                          */
const VIDEOS = {
  // 'alg-23j-q2': 'XXXXXXXXXXX',
  // 'ana-24j-q1': 'YYYYYYYYYYY',
   'ana-24j-q1':'bW5Cz1lC4TA',
   'ana-24s-q1':'lB4Q0zkDgiA',
   'ana-24j-q3':'z8l7bqoaAZs',
   'pro-24j-q4':'cBUZsq_4bWM'
};
