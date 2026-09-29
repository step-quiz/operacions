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
    // Funcions que defineix cada joc i crida game-core.js
    ...readonly(['buildLevel', 'checkCurrentCell']),
    // Mòduls (window.X = (() => { … })()) i llibreries
    ...readonly([
        'MathEngine', 'Strings', 'DistractorLib', 'QuestionBank', 'QuestionBankA', 'StringsA', 'FunctionEngine',
        'CloudEngine', 'SvgRenderer', 'VocabFigures', 'VocabEngine', 'FixedSessions', 'katex',
    ]),
};

export default [
    { ignores: ['vendor/**', 'cb/**', 'app/**', 'gem4eso/**', 'tools/**'] },
    js.configs.recommended,
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: { ...globals.browser, ...PROJECT_GLOBALS },
        },
        rules: {
            // Un fitxer pot definir una global que un altre fa servir (p. ex. buildLevel)
            'no-redeclare': ['error', { builtinGlobals: false }],
            // Les funcions de nivell superior es fan servir des d'altres fitxers o des de l'HTML
            'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
        },
    },
    {
        files: ['tests/**/*.js', 'js/derivades/run-tests.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
        rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
    },
];
