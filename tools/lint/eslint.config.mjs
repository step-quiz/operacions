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

// Llibreries de vendor/ que les pàgines carreguen amb <script> clàssic i que,
// per tant, són globals (window.katex…).
const VENDOR = Object.fromEntries(
    ['katex', 'renderMathInElement', 'XLSX', 'ExcelJS', 'JSZip', 'pdfjsLib'].map(n => [n, 'readonly'])
);

export default [
    { ignores: ['vendor/**', 'cb/**', 'app/**', 'gem4eso/**', 'tools/**'] },
    js.configs.recommended,
    {
        // Tot el JS de js/ són mòduls ES: el que un fitxer necessita d'un altre
        // s'importa (import { randInt } from '../utils.js'), no hi ha globals
        // compartides. Un nom sense declarar ni importar és un error.
        files: ['js/**/*.js'],
        ignores: ['js/derivades/run-tests.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.browser, ...VENDOR },
        },
        rules: {
            'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
            // Un valor assignat que després no es llegeix: codi sobrer, no un error
            'no-useless-assignment': 'warn',
        },
    },
    {
        files: ['tests/**/*.js', 'js/derivades/run-tests.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
        rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
    },
];
