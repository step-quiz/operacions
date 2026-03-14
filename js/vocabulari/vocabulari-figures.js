/**
 * ============================================================================
 * PROJECTE: Vocabulari Matemàtic
 * FITXER: js/vocabulari/vocabulari-figures.js
 * ROL: Font de veritat única de totes les figures geomètriques.
 * ARQUITECTURA:
 * - Mòdul IIFE sense efectes secundaris ni dependències externes.
 * - Cada figura té: id, nom, svg (markup SVG literal) i etiquetes[].
 * - Cada etiqueta té: id, text, px/py (punt de la figura), lx/ly (caixa).
 * - El viewBox SVG és sempre 500 × 340.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
window.VocabFigures = (() => {

    const FIGURES = [

        // 1. RECTANGLE
        {
            id:  'rectangle',
            nom: 'Rectangle',
            svg: `
                <rect x="80" y="90" width="340" height="180" fill="#f0f9ff" stroke="#0369a1" stroke-width="2.5"/>
                <line x1="80"  y1="90"  x2="420" y2="270" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <line x1="420" y1="90"  x2="80"  y2="270" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <circle cx="250" cy="180" r="4"   fill="#334155"/>
                <circle cx="80"  cy="90"  r="5"   fill="#0369a1"/>
                <circle cx="420" cy="90"  r="5"   fill="#0369a1"/>
                <circle cx="420" cy="270" r="5"   fill="#0369a1"/>
                <circle cx="80"  cy="270" r="5"   fill="#0369a1"/>
            `,
            etiquetes: [
                { id: 'rectangle', text: 'rectangle', px: 160, py: 130, lx: 250, ly: 20  },
                { id: 'vertex',    text: 'vèrtex',    px: 80,  py: 90,  lx: 45,  ly: 60  },
                { id: 'costat',    text: 'costat',    px: 250, py: 90,  lx: 370, ly: 55  },
                { id: 'diagonal',  text: 'diagonal',  px: 170, py: 135, lx: 80,  ly: 160 },
                { id: 'centre',    text: 'centre',    px: 250, py: 180, lx: 310, ly: 205 },
            ]
        },

        // 2. CIRCUMFERÈNCIA
        {
            id:  'circumferencia',
            nom: 'Circumferència',
            svg: `
                <circle cx="250" cy="170" r="130" fill="white" stroke="#059669" stroke-width="2.5"/>
                <line x1="120" y1="170" x2="380" y2="170" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <line x1="250" y1="170" x2="250" y2="40"  stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <line x1="145" y1="105" x2="380" y2="200" stroke="#b45309" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'circumferencia', text: 'circumferència', px: 380, py: 170, lx: 430, ly: 80  },
                { id: 'radi',           text: 'radi',           px: 250, py: 105, lx: 155, ly: 55  },
                { id: 'diametre',       text: 'diàmetre',       px: 215, py: 170, lx: 110, ly: 210 },
                { id: 'corda',          text: 'corda',          px: 265, py: 155, lx: 350, ly: 260 },
                { id: 'centre',         text: 'centre',         px: 250, py: 170, lx: 310, ly: 190 },
            ]
        },

        // 3. TRIANGLE
        {
            id:  'triangle',
            nom: 'Triangle',
            svg: `
                <polygon points="250,50 60,290 440,290" fill="#fffbeb" stroke="#d97706" stroke-width="2.5"/>
                <line x1="250" y1="50"  x2="250" y2="290" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <rect x="250" y="279" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
                <circle cx="250" cy="50"  r="5" fill="#d97706"/>
                <circle cx="60"  cy="290" r="5" fill="#d97706"/>
                <circle cx="440" cy="290" r="5" fill="#d97706"/>
            `,
            etiquetes: [
                { id: 'triangle', text: 'triangle', px: 250, py: 200, lx: 250, ly: 17  },
                { id: 'vertex',   text: 'vèrtex',   px: 250, py: 50,  lx: 140, ly: 40  },
                { id: 'costat',   text: 'costat',   px: 155, py: 170, lx: 60,  ly: 185 },
                { id: 'base',     text: 'base',     px: 250, py: 290, lx: 420, ly: 315 },
                { id: 'altura',   text: 'altura',   px: 250, py: 170, lx: 330, ly: 160 },
            ]
        },

        // 4. CERCLE
        {
            id:  'cercle',
            nom: 'Cercle',
            svg: `
                <defs>
                    <pattern id="cercle-dots" patternUnits="userSpaceOnUse" width="9" height="9">
                        <circle cx="4.5" cy="4.5" r="1.4" fill="#db2777" opacity="0.35"/>
                    </pattern>
                    <clipPath id="cercle-clip">
                        <circle cx="250" cy="170" r="128"/>
                    </clipPath>
                </defs>
                <circle cx="250" cy="170" r="130" fill="url(#cercle-dots)" clip-path="url(#cercle-clip)" stroke="none"/>
                <circle cx="250" cy="170" r="130" fill="none" stroke="#db2777" stroke-width="2.5"/>
                <line x1="250" y1="170" x2="352" y2="78" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'cercle',  text: 'cercle',  px: 175, py: 240, lx: 110, ly: 30  },
                { id: 'radi',    text: 'radi',    px: 300, py: 124, lx: 370, ly: 80  },
                { id: 'centre',  text: 'centre',  px: 250, py: 170, lx: 310, ly: 190 },
            ]
        },

        // 5. ANGLE
        {
            id:  'angle',
            nom: 'Angle',
            svg: `
                <line x1="150" y1="280" x2="420" y2="100" stroke="#0369a1" stroke-width="2.5"/>
                <line x1="150" y1="280" x2="430" y2="280" stroke="#0369a1" stroke-width="2.5"/>
                <path d="M 220 280 A 70 70 0 0 0 192 219" fill="none" stroke="#7c3aed" stroke-width="2" stroke-dasharray="5 3"/>
                <circle cx="150" cy="280" r="5" fill="#0369a1"/>
                <text x="242" y="260" font-family="serif" font-style="italic" font-size="18" fill="#7c3aed">α</text>
            `,
            etiquetes: [
                { id: 'angle',  text: 'angle',  px: 242, py: 250, lx: 340, ly: 195 },
                { id: 'vertex', text: 'vèrtex', px: 150, py: 280, lx: 90,  ly: 235 },
                { id: 'raig',   text: 'raig',   px: 285, py: 190, lx: 175, ly: 140 },
                { id: 'arc',    text: 'arc',    px: 206, py: 249, lx: 130, ly: 185 },
            ]
        },

        // 6. PARAL·LELOGRAM
        {
            id:  'paralelogram',
            nom: 'Paral·lelogram',
            svg: `
                <polygon points="130,270 200,70 370,70 300,270" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2.5"/>
                <line x1="130" y1="270" x2="370" y2="70"  stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <line x1="200" y1="70"  x2="300" y2="270" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <line x1="265" y1="70"  x2="265" y2="270" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4 3"/>
                <rect x="265" y="259" width="11" height="11" fill="none" stroke="#d97706" stroke-width="1.5"/>
                <circle cx="130" cy="270" r="5" fill="#7c3aed"/>
                <circle cx="200" cy="70"  r="5" fill="#7c3aed"/>
                <circle cx="370" cy="70"  r="5" fill="#7c3aed"/>
                <circle cx="300" cy="270" r="5" fill="#7c3aed"/>
                <circle cx="250" cy="170" r="4" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'paralelogram', text: 'paral·lelogram', px: 250, py: 170, lx: 250, ly: 20  },
                { id: 'costat',       text: 'costat',         px: 165, py: 170, lx: 68,  ly: 140 },
                { id: 'diagonal',     text: 'diagonal',       px: 200, py: 195, lx: 90,  ly: 230 },
                { id: 'altura',       text: 'altura',         px: 265, py: 170, lx: 390, ly: 165 },
                { id: 'vertex',       text: 'vèrtex',         px: 300, py: 270, lx: 375, ly: 295 },
            ]
        },

        // 7. TRAPEZI
        {
            id:  'trapezi',
            nom: 'Trapezi',
            svg: `
                <polygon points="140,270 100,90 330,90 400,270" fill="#fff7ed" stroke="#ea580c" stroke-width="2.5"/>
                <line x1="215" y1="90"  x2="215" y2="270" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <rect x="215" y="259" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
                <circle cx="140" cy="270" r="5" fill="#ea580c"/>
                <circle cx="100" cy="90"  r="5" fill="#ea580c"/>
                <circle cx="330" cy="90"  r="5" fill="#ea580c"/>
                <circle cx="400" cy="270" r="5" fill="#ea580c"/>
            `,
            etiquetes: [
                { id: 'trapezi',    text: 'trapezi',    px: 250, py: 200, lx: 250, ly: 20  },
                { id: 'base_major', text: 'base major', px: 270, py: 270, lx: 390, ly: 305 },
                { id: 'base_menor', text: 'base menor', px: 215, py: 90,  lx: 100, ly: 55  },
                { id: 'altura',     text: 'altura',     px: 215, py: 180, lx: 110, ly: 185 },
                { id: 'costat',     text: 'costat',     px: 365, py: 180, lx: 440, ly: 175 },
            ]
        },

        // 8. SEGMENT
        {
            id:  'segment',
            nom: 'Segment',
            svg: `
                <line x1="80"  y1="170" x2="420" y2="170" stroke="#0369a1" stroke-width="3"/>
                <circle cx="80"  cy="170" r="6" fill="#0369a1"/>
                <circle cx="420" cy="170" r="6" fill="#0369a1"/>
                <circle cx="250" cy="170" r="5" fill="#7c3aed"/>
                <line x1="20"  y1="170" x2="480" y2="170" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 6"/>
            `,
            etiquetes: [
                { id: 'segment',  text: 'segment',  px: 160, py: 170, lx: 250, ly: 70  },
                { id: 'extrem',   text: 'extrem',   px: 80,  py: 170, lx: 68,  ly: 115 },
                { id: 'punt_mig', text: 'punt mig', px: 250, py: 170, lx: 350, ly: 220 },
                { id: 'longitud', text: 'longitud', px: 340, py: 170, lx: 140, ly: 230 },
                { id: 'recta',    text: 'recta',    px: 440, py: 170, lx: 440, ly: 120 },
            ]
        },

        // 9. TRIANGLE RECTANGLE
        {
            id:  'triangle_rectangle',
            nom: 'Triangle rectangle',
            svg: `
                <polygon points="100,280 100,60 420,280" fill="#f0fdf4" stroke="#059669" stroke-width="2.5"/>
                <rect x="100" y="260" width="20" height="20" fill="none" stroke="#059669" stroke-width="2"/>
                <line x1="100" y1="60"  x2="420" y2="280" stroke="#059669" stroke-width="2.5"/>
                <path d="M 100 90 A 30 30 0 0 1 128 76" fill="none" stroke="#7c3aed" stroke-width="2" stroke-dasharray="4 3"/>
                <circle cx="100" cy="280" r="5" fill="#059669"/>
                <circle cx="100" cy="60"  r="5" fill="#7c3aed"/>
                <circle cx="420" cy="280" r="5" fill="#059669"/>
                <text x="112" y="105" font-family="serif" font-style="italic" font-size="18" fill="#7c3aed">α</text>
            `,
            etiquetes: [
                { id: 'angle_recte',   text: 'angle recte',   px: 110, py: 268, lx: 52,  ly: 230 },
                { id: 'hipotenusa',    text: 'hipotenusa',    px: 260, py: 170, lx: 330, ly: 130 },
                { id: 'catet_contigu', text: 'catet contigu', px: 100, py: 170, lx: 28,  ly: 148 },
                { id: 'catet_oposat',  text: 'catet oposat',  px: 260, py: 280, lx: 260, ly: 322 },
                { id: 'angle_agut',    text: 'angle agut',    px: 118, py: 95,  lx: 220, ly: 55  },
            ]
        },

        // 10. PENTÀGON REGULAR
        {
            id:  'pentagono',
            nom: 'Pentàgon regular',
            svg: `
                <polygon points="250,55 364,138 320,272 180,272 136,138" fill="#fff7ed" stroke="#ea580c" stroke-width="2.5"/>
                <line x1="250" y1="175" x2="250" y2="272" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <line x1="250" y1="55"  x2="320" y2="272" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 4"/>
                <circle cx="250" cy="175" r="4"   fill="#334155"/>
                <circle cx="250" cy="55"  r="5"   fill="#ea580c"/>
                <circle cx="364" cy="138" r="5"   fill="#ea580c"/>
                <circle cx="320" cy="272" r="5"   fill="#ea580c"/>
                <circle cx="180" cy="272" r="5"   fill="#ea580c"/>
                <circle cx="136" cy="138" r="5"   fill="#ea580c"/>
            `,
            etiquetes: [
                { id: 'pentagono', text: 'pentàgon', px: 300, py: 200, lx: 250, ly: 20  },
                { id: 'vertex',    text: 'vèrtex',   px: 250, py: 55,  lx: 145, ly: 38  },
                { id: 'costat',    text: 'costat',   px: 193, py: 205, lx: 68,  ly: 195 },
                { id: 'centre',    text: 'centre',   px: 250, py: 175, lx: 360, ly: 192 },
                { id: 'apotema',   text: 'apotema',  px: 250, py: 224, lx: 360, ly: 250 },
                { id: 'diagonal',  text: 'diagonal', px: 285, py: 164, lx: 420, ly: 135 },
            ]
        },

        // 11. HEXÀGON REGULAR
        {
            id:  'hexagono',
            nom: 'Hexàgon regular',
            svg: `
                <polygon points="250,50 354,110 354,230 250,290 146,230 146,110" fill="#f0fdf4" stroke="#059669" stroke-width="2.5"/>
                <line x1="250" y1="170" x2="354" y2="170" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <line x1="146" y1="110" x2="354" y2="230" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 4"/>
                <circle cx="250" cy="170" r="4" fill="#334155"/>
                <circle cx="250" cy="50"  r="5" fill="#059669"/>
                <circle cx="354" cy="110" r="5" fill="#059669"/>
                <circle cx="354" cy="230" r="5" fill="#059669"/>
                <circle cx="250" cy="290" r="5" fill="#059669"/>
                <circle cx="146" cy="230" r="5" fill="#059669"/>
                <circle cx="146" cy="110" r="5" fill="#059669"/>
            `,
            etiquetes: [
                { id: 'hexagono',  text: 'hexàgon',  px: 200, py: 130, lx: 250, ly: 18  },
                { id: 'vertex',    text: 'vèrtex',   px: 354, py: 110, lx: 432, ly: 80  },
                { id: 'costat',    text: 'costat',   px: 354, py: 170, lx: 448, ly: 170 },
                { id: 'centre',    text: 'centre',   px: 250, py: 170, lx: 138, ly: 152 },
                { id: 'apotema',   text: 'apotema',  px: 302, py: 170, lx: 418, ly: 238 },
                { id: 'diagonal',  text: 'diagonal', px: 310, py: 215, lx: 118, ly: 255 },
            ]
        },

        // 12. CUB
        {
            id:  'cub',
            nom: 'Cub',
            svg: `
                <line x1="100" y1="300" x2="170" y2="240" stroke="#0369a1" stroke-width="1.2" stroke-dasharray="5 3"/>
                <line x1="170" y1="240" x2="310" y2="240" stroke="#0369a1" stroke-width="1.2" stroke-dasharray="5 3"/>
                <line x1="170" y1="240" x2="170" y2="100" stroke="#0369a1" stroke-width="1.2" stroke-dasharray="5 3"/>
                <polygon points="100,300 240,300 240,160 100,160" fill="#eff6ff" stroke="#0369a1" stroke-width="2.5"/>
                <polygon points="240,160 310,100 310,240 240,300" fill="#bfdbfe" stroke="#0369a1" stroke-width="2.5"/>
                <polygon points="100,160 170,100 310,100 240,160" fill="#dbeafe" stroke="#0369a1" stroke-width="2.5"/>
                <circle cx="100" cy="300" r="4.5" fill="#0369a1"/>
                <circle cx="240" cy="300" r="4.5" fill="#0369a1"/>
                <circle cx="240" cy="160" r="4.5" fill="#0369a1"/>
                <circle cx="100" cy="160" r="4.5" fill="#0369a1"/>
                <circle cx="170" cy="100" r="4.5" fill="#0369a1"/>
                <circle cx="310" cy="100" r="4.5" fill="#0369a1"/>
                <circle cx="310" cy="240" r="4.5" fill="#0369a1"/>
            `,
            etiquetes: [
                { id: 'cub',    text: 'cub',    px: 190, py: 230, lx: 190, ly: 20  },
                { id: 'vertex', text: 'vèrtex', px: 240, py: 160, lx: 375, ly: 135 },
                { id: 'aresta', text: 'aresta', px: 170, py: 130, lx: 218, ly: 68  },
                { id: 'cara',   text: 'cara',   px: 170, py: 230, lx: 48,  ly: 228 },
            ]
        },

        // 13. ORTOEDRE
        {
            id:  'ortoedre',
            nom: 'Ortoedre',
            svg: `
                <line x1="60"  y1="295" x2="115" y2="240" stroke="#059669" stroke-width="1.2" stroke-dasharray="5 3"/>
                <line x1="115" y1="240" x2="415" y2="240" stroke="#059669" stroke-width="1.2" stroke-dasharray="5 3"/>
                <line x1="115" y1="240" x2="115" y2="120" stroke="#059669" stroke-width="1.2" stroke-dasharray="5 3"/>
                <polygon points="60,295 360,295 360,175 60,175"   fill="#f0fdf4" stroke="#059669" stroke-width="2.5"/>
                <polygon points="360,175 415,120 415,240 360,295" fill="#bbf7d0" stroke="#059669" stroke-width="2.5"/>
                <polygon points="60,175 115,120 415,120 360,175"  fill="#dcfce7" stroke="#059669" stroke-width="2.5"/>
                <circle cx="60"  cy="295" r="4.5" fill="#059669"/>
                <circle cx="360" cy="295" r="4.5" fill="#059669"/>
                <circle cx="360" cy="175" r="4.5" fill="#059669"/>
                <circle cx="60"  cy="175" r="4.5" fill="#059669"/>
                <circle cx="115" cy="120" r="4.5" fill="#059669"/>
                <circle cx="415" cy="120" r="4.5" fill="#059669"/>
                <circle cx="415" cy="240" r="4.5" fill="#059669"/>
                <line x1="60"  y1="315" x2="360" y2="315" stroke="#d97706" stroke-width="1.5"/>
                <line x1="60"  y1="309" x2="60"  y2="321" stroke="#d97706" stroke-width="1.5"/>
                <line x1="360" y1="309" x2="360" y2="321" stroke="#d97706" stroke-width="1.5"/>
            `,
            etiquetes: [
                { id: 'ortoedre', text: 'ortoedre', px: 240, py: 148, lx: 210, ly: 20  },
                { id: 'vertex',   text: 'vèrtex',   px: 360, py: 175, lx: 448, ly: 148 },
                { id: 'aresta',   text: 'aresta',   px: 210, py: 175, lx: 178, ly: 105 },
                { id: 'cara',     text: 'cara',     px: 210, py: 235, lx: 45,  ly: 235 },
                { id: 'amplada',  text: 'amplada',  px: 210, py: 315, lx: 210, ly: 336 },
                { id: 'alcada',   text: 'alçada',   px: 60,  py: 235, lx: 22,  ly: 205 },
            ]
        },

        // 14. PIRÀMIDE
        {
            id:  'piramide',
            nom: 'Piràmide',
            svg: `
                <polygon points="110,280 390,280 330,215 170,215" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
                <line x1="250" y1="60" x2="170" y2="215" stroke="#d97706" stroke-width="1.5" stroke-dasharray="5 3"/>
                <line x1="250" y1="60" x2="330" y2="215" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4 3"/>
                <polygon points="250,60 110,280 390,280"  fill="#fcd34d" stroke="#d97706" stroke-width="2.5"/>
                <polygon points="250,60 110,280 170,215"  fill="#fde68a" stroke="#d97706" stroke-width="2"/>
                <polygon points="250,60 390,280 330,215"  fill="#fef9c3" stroke="#d97706" stroke-width="2"/>
                <line x1="250" y1="60"  x2="250" y2="248" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <rect x="250" y="237" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
                <circle cx="250" cy="248" r="3.5" fill="#334155"/>
                <circle cx="250" cy="60"  r="5.5" fill="#d97706"/>
            `,
            etiquetes: [
                { id: 'piramide',       text: 'piràmide',       px: 250, py: 175, lx: 250, ly: 20  },
                { id: 'vertex',         text: 'vèrtex',         px: 250, py: 60,  lx: 148, ly: 42  },
                { id: 'aresta_lateral', text: 'aresta lateral', px: 180, py: 168, lx: 65,  ly: 138 },
                { id: 'cara_lateral',   text: 'cara lateral',   px: 290, py: 195, lx: 408, ly: 168 },
                { id: 'base',           text: 'base',           px: 250, py: 248, lx: 408, ly: 252 },
                { id: 'altura',         text: 'altura',         px: 250, py: 154, lx: 340, ly: 200 },
            ]
        },

        // 15. CILINDRE
        {
            id:  'cilindre',
            nom: 'Cilindre',
            svg: `
                <rect x="110" y="90" width="280" height="180" fill="#f0f9ff" stroke="none"/>
                <line x1="110" y1="90"  x2="110" y2="270" stroke="#0369a1" stroke-width="2.5"/>
                <line x1="390" y1="90"  x2="390" y2="270" stroke="#0369a1" stroke-width="2.5"/>
                <ellipse cx="250" cy="270" rx="140" ry="32" fill="#dbeafe" stroke="#0369a1" stroke-width="2.5"/>
                <ellipse cx="250" cy="90"  rx="140" ry="32" fill="#dbeafe" stroke="#0369a1" stroke-width="2.5"/>
                <line x1="250" y1="90"  x2="250" y2="270" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>
                <line x1="250" y1="90"  x2="390" y2="90"  stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <line x1="415" y1="90"  x2="415" y2="270" stroke="#d97706" stroke-width="1.5"/>
                <line x1="409" y1="90"  x2="421" y2="90"  stroke="#d97706" stroke-width="1.5"/>
                <line x1="409" y1="270" x2="421" y2="270" stroke="#d97706" stroke-width="1.5"/>
            `,
            etiquetes: [
                { id: 'cilindre',     text: 'cilindre',     px: 170, py: 200, lx: 250, ly: 18  },
                { id: 'base',         text: 'base',         px: 250, py: 270, lx: 105, ly: 315 },
                { id: 'cara_lateral', text: 'cara lateral', px: 110, py: 180, lx: 42,  ly: 155 },
                { id: 'alcada',       text: 'alçada',       px: 415, py: 180, lx: 460, ly: 168 },
                { id: 'radi',         text: 'radi',         px: 320, py: 90,  lx: 400, ly: 40  },
                { id: 'eix',          text: 'eix',          px: 250, py: 180, lx: 162, ly: 175 },
            ]
        },

        // 16. CON
        {
            id:  'con',
            nom: 'Con',
            svg: `
                <line x1="250" y1="50"  x2="90"  y2="280" stroke="#db2777" stroke-width="2.5"/>
                <line x1="250" y1="50"  x2="410" y2="280" stroke="#d97706" stroke-width="2.5"/>
                <ellipse cx="250" cy="280" rx="160" ry="35" fill="#fce7f3" stroke="#db2777" stroke-width="2.5"/>
                <line x1="250" y1="280" x2="410" y2="280" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <line x1="250" y1="50"  x2="250" y2="280" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <rect x="250" y="269" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
                <circle cx="250" cy="50"  r="5.5" fill="#db2777"/>
                <circle cx="250" cy="280" r="3.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'con',        text: 'con',        px: 185, py: 220, lx: 68,  ly: 130 },
                { id: 'vertex',     text: 'vèrtex',     px: 250, py: 50,  lx: 148, ly: 28  },
                { id: 'generatriu', text: 'generatriu', px: 330, py: 165, lx: 442, ly: 138 },
                { id: 'base',       text: 'base',       px: 250, py: 280, lx: 100, ly: 318 },
                { id: 'altura',     text: 'altura',     px: 250, py: 165, lx: 332, ly: 210 },
                { id: 'radi',       text: 'radi',       px: 330, py: 280, lx: 388, ly: 308 },
            ]
        },

        // 17. ESFERA
        {
            id:  'esfera',
            nom: 'Esfera',
            svg: `
                <circle cx="250" cy="170" r="145" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
                <ellipse cx="250" cy="170" rx="145" ry="40"  fill="none" stroke="#d97706" stroke-width="1.8" stroke-dasharray="6 3"/>
                <ellipse cx="250" cy="170" rx="40"  ry="145" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <line x1="250" y1="170" x2="352" y2="78" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'esfera',       text: 'esfera',       px: 250, py: 25,  lx: 108, ly: 22  },
                { id: 'centre',       text: 'centre',       px: 250, py: 170, lx: 155, ly: 188 },
                { id: 'radi',         text: 'radi',         px: 301, py: 124, lx: 368, ly: 60  },
                { id: 'cercle_maxim', text: 'cercle màxim', px: 395, py: 170, lx: 440, ly: 220 },
            ]
        },

    ];

    return { all: FIGURES };

})();
