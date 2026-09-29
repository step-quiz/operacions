/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/config.js
 * ROL: Gestió de la configuració de la partida i paràmetres URL.
 * ARQUITECTURA:
 * - Permet al professorat configurar la partida via paràmetres GET a la URL
 * (ex: ?totalsessions=3&maxintents=2).
 * - Inclou mecanismes de seguretat defensiva i fallbacks (límits min/max) per
 * evitar comportaments anòmals si l'usuari manipula la URL.
 * - Mòdul ES. Importa primer fixed-sessions.js: si la URL porta ?fixed=A/B/C,
 *   aquest afegeix paràmetres a la URL (5 preguntes, 1 sessió…) i s'ha
 *   d'executar ABANS que aquí es llegeixin.
 * DEPENDÈNCIES: fixed-sessions.js, utils.js (getIntParam).
 * ============================================================================
 */
import './fixed-sessions.js';
import { getIntParam } from './utils.js';

const DEFAULT_TOTAL_SESSIONS = window.APP_CONFIG?.defaultSessions ?? 1;
const DEFAULT_TOTAL_OPERATIONS = window.APP_CONFIG?.defaultOperations ?? 3;
const DEFAULT_MAX_INTENTS = window.APP_CONFIG?.defaultIntents ?? 4;
const DEFAULT_MAX_ENLLOC_MITJANA = window.APP_CONFIG?.defaultEnllocMitjana ?? 1;

// Els màxims de sessions i preguntes coincideixen amb el que pot representar
// el codi de verificació v2 (S = 1-5, QQ = 01-10) i amb el que ofereix index.html.
export const LIMITS = {
    totalsessions: { min: 1, max: 5 },
    totaloperations: { min: 1, max: 10 },
    maxintents: { min: 1, max: 10 },
    maxenllocmitjana: { min: 0, max: 1 },
};

export const urlParams = new URLSearchParams(window.location.search);

export const TOTAL_SESSIONS = getIntParam(
    urlParams,
    'totalsessions',
    DEFAULT_TOTAL_SESSIONS,
    LIMITS.totalsessions.min,
    LIMITS.totalsessions.max
);
export const TOTAL_OPERATIONS = getIntParam(
    urlParams,
    'totaloperations',
    DEFAULT_TOTAL_OPERATIONS,
    LIMITS.totaloperations.min,
    LIMITS.totaloperations.max
);
export const MAX_INTENTS = getIntParam(
    urlParams,
    'maxintents',
    DEFAULT_MAX_INTENTS,
    LIMITS.maxintents.min,
    LIMITS.maxintents.max
);
export const MAX_ENLLOC_MITJANA = getIntParam(
    urlParams,
    'maxenllocmitjana',
    DEFAULT_MAX_ENLLOC_MITJANA,
    LIMITS.maxenllocmitjana.min,
    LIMITS.maxenllocmitjana.max
);
