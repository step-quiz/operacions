/**
 * products-diners.js
 * Catàleg de productes per a diners.html i a-diners.html.
 *
 * Cada entrada:
 *   emoji  — icona visual
 *   nom    — nom del producte (ca)
 *   preu   — [mínim, màxim] en euros (rang versemblant de supermercat/quiosc)
 *
 * Els preus corresponen a unitats individuals raonables a Espanya (2025):
 * poma = 1 unitat, llet = 1 L, ous = 6 unitats, formatge = aprox. 200 g, etc.
 *
 * Aquest fitxer és compartit entre diners.html i a-diners.html.
 * Mòdul ES: import { PRODUCTS_DINERS } from './products-diners.js';
 */

export const PRODUCTS_DINERS = [
    { emoji: '🍞', nom: 'Pa', preu: [0.8, 2.5] },
    { emoji: '🥛', nom: 'Llet', preu: [0.85, 1.5] },
    { emoji: '🍎', nom: 'Poma', preu: [0.25, 0.8] },
    { emoji: '✏️', nom: 'Llapis', preu: [0.3, 1.2] },
    { emoji: '📓', nom: 'Llibreta', preu: [1.0, 3.5] },
    { emoji: '🍫', nom: 'Xocolata', preu: [0.9, 2.5] },
    { emoji: '💧', nom: 'Aigua', preu: [0.4, 1.2] },
    { emoji: '🧃', nom: 'Suc', preu: [1.2, 2.5] },
    { emoji: '🥐', nom: 'Croissant', preu: [0.8, 1.8] },
    { emoji: '🍌', nom: 'Plàtan', preu: [0.2, 0.7] },
    { emoji: '🍪', nom: 'Galetes', preu: [1.0, 2.5] },
    { emoji: '🥪', nom: 'Entrepà', preu: [1.5, 3.5] },
    { emoji: '🍕', nom: 'Pizza', preu: [2.0, 4.5] },
    { emoji: '🥤', nom: 'Refresc', preu: [0.8, 2.0] },
    { emoji: '🖊️', nom: 'Boli', preu: [0.5, 1.8] },
    { emoji: '🧁', nom: 'Magdalena', preu: [0.6, 1.5] },
    { emoji: '🥜', nom: 'Fruits secs', preu: [1.5, 3.5] },
    { emoji: '🍇', nom: 'Raïm', preu: [0.8, 2.5] },
    { emoji: '🧀', nom: 'Formatge', preu: [1.5, 4.5] },
    { emoji: '🥚', nom: 'Ous', preu: [1.8, 3.5] },
];
