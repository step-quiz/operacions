// ============================================================
// js/config.js — Lectura de paràmetres URL i configuració global
// NOTA: Requereix utils.js carregat prèviament (usa getIntParam)
// ============================================================

// Cada joc pot definir window.APP_CONFIG ABANS de carregar aquest fitxer:
//
//   window.APP_CONFIG = {
//       defaultSessions:      1,
//       defaultOperations:    5,
//       defaultIntents:       4,
//       defaultEnllocMitjana: 1
//   };
//
// Si no ho fa, s'usen els valors base indicats aquí.

const DEFAULT_TOTAL_SESSIONS     = window.APP_CONFIG?.defaultSessions      ?? 1;
const DEFAULT_TOTAL_OPERATIONS   = window.APP_CONFIG?.defaultOperations    ?? 3;
const DEFAULT_MAX_INTENTS        = window.APP_CONFIG?.defaultIntents       ?? 4;
const DEFAULT_MAX_ENLLOC_MITJANA = window.APP_CONFIG?.defaultEnllocMitjana ?? 1;

const LIMITS = {
    totalsessions:    { min: 1, max: 20 },
    totaloperations:  { min: 1, max: 30 },
    maxintents:       { min: 1, max: 10 },
    maxenllocmitjana: { min: 0, max:  1 }
};

const urlParams = new URLSearchParams(window.location.search);

const TOTAL_SESSIONS     = getIntParam(urlParams, 'totalsessions',    DEFAULT_TOTAL_SESSIONS,     LIMITS.totalsessions.min,    LIMITS.totalsessions.max);
const TOTAL_OPERATIONS   = getIntParam(urlParams, 'totaloperations',  DEFAULT_TOTAL_OPERATIONS,   LIMITS.totaloperations.min,  LIMITS.totaloperations.max);
const MAX_INTENTS        = getIntParam(urlParams, 'maxintents',       DEFAULT_MAX_INTENTS,         LIMITS.maxintents.min,       LIMITS.maxintents.max);
const MAX_ENLLOC_MITJANA = getIntParam(urlParams, 'maxenllocmitjana', DEFAULT_MAX_ENLLOC_MITJANA,  LIMITS.maxenllocmitjana.min, LIMITS.maxenllocmitjana.max);
