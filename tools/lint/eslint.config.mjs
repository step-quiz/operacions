/**
 * Configuració d'ESLint (revisor de codi) del projecte.
 * ÚS (des de l'arrel del repositori):
 *   tools/lint/node_modules/.bin/eslint -c tools/lint/eslint.config.mjs .
 *
 * Només s'activen regles que troben ERRORS (variables no definides, codi
 * inabastable, claus repetides…), no qüestions d'estil: de l'estil se
 * n'encarrega Prettier.
 */
import js from '@eslint/js';
import globals from 'globals';

// Els fitxers de js/ es carreguen com a <script> clàssics i comparteixen
// variables globals. Aquestes són les que un fitxer fa servir i defineix un altre.
const readonly = names => Object.fromEntries(names.map(n => [n, 'readonly']));
const writable = names => Object.fromEntries(names.map(n => [n, 'writable']));

const PROJECT_GLOBALS = {
    // js/utils.js
    ...readonly(['getIntParam', 'randInt', 'randIntNonZero', 'pick', 'shuffle', 'parseStrictInt']),
    // js/config.js
    ...readonly(['TOTAL_SESSIONS', 'TOTAL_OPERATIONS', 'MAX_INTENTS', 'MAX_ENLLOC_MITJANA', 'LIMITS', 'urlParams']),
    // js/exercise-codes.js
    ...readonly(['EXERCISE_CODES', 'EXERCISE_NAMES']),
    // js/game-core.js — estat compartit del joc (els jocs el modifiquen)
    ...writable([
        'currentSession', 'currentOperation', 'sessionScore', 'sessionScores', 'sessionHistory',
        'sessionResults', 'attemptsLeft', 'isTransitioning', 'currentDifficulty',
    ]),
    // js/game-core.js — funcions
    ...readonly([
        'validateConfig', 'registerScreens', 'showScreen', 'startGame', 'startSession', 'endSession',
        'startNextSession', 'calculaNotaSobre10', 'renderFinalSummary', 'finalitzar', 'showMiniOverlay',
        'hideMiniOverlay', 'injectSharedHTML', 'isTouchDevice', 'initCustomKeyboard', 'showCustomKeyboard',
        'hideCustomKeyboard', 'kbMarkForOverwrite', 'escapeHtml', 'plainFrac', 'recordAnswerToHistory',
        'recordResult', 'showHistorySummary', 'copiarResultats', 'bgColors', 'MAX_PUNTS_PREGUNTA', 'MAX_RESULTS',
    ]),
    // js/fixed-sessions.js i llibreries
    ...readonly(['FixedSessions', 'katex']),
};

// Funcions que defineix cada joc i crida game-core.js (jocs amb scripts clàssics)
const GAME_HOOKS = readonly(['buildLevel', 'checkCurrentCell']);

// Scripts clàssics: la base compartida (js/*.js) i els pocs fitxers que encara
// fan servir jocs amb el JS dins de l'HTML (js/decimals/).
const CLASSIC = ['js/*.js', 'js/decimals/**/*.js'];

export default [
    { ignores: ['vendor/**', 'cb/**', 'app/**', 'gem4eso/**', 'tools/**'] },
    js.configs.recommended,
    {
        files: CLASSIC,
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: { ...globals.browser, ...PROJECT_GLOBALS, ...GAME_HOOKS },
        },
        rules: {
            // Un fitxer pot definir una global que un altre fa servir (p. ex. buildLevel)
            'no-redeclare': ['error', { builtinGlobals: false }],
            // Les funcions de nivell superior es fan servir des d'altres fitxers o des de l'HTML
            'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
        },
    },
    {
        // Mòduls ES de cada activitat (js/<activitat>/): els seus noms (MathEngine,
        // QuestionBank…) NO són globals i s'han d'importar. Només poden fer servir
        // les globals de la base compartida (utils, config, game-core…).
        files: ['js/*/**/*.js'],
        ignores: [...CLASSIC, 'js/derivades/run-tests.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.browser, ...PROJECT_GLOBALS },
        },
        rules: {
            'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
        },
    },
    {
        files: ['tests/**/*.js', 'js/derivades/run-tests.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
        rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
    },
];
