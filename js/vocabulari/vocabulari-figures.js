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
            nom: 'Rectangle', dim: 2,
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
                { id: 'rectangle'       , text: 'rectangle'       , px: 160, py: 130, lx: 111, ly:  29  },
                { id: 'vertex'          , text: 'vèrtex'          , px:  79, py: 270, lx: 107, ly: 314  },
                { id: 'costat'          , text: 'costat'          , px: 305, py:  90, lx: 379, ly:  40  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 181, py: 215, lx:  93, ly: 154  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 180, lx: 288, ly: 301  }
            ]
        },

        // 2. CIRCUMFERÈNCIA
        {
            id:  'circumferencia',
            nom: 'Circumferència', dim: 2,
            svg: `
                <circle cx="250" cy="170" r="130" fill="white" stroke="#059669" stroke-width="2.5"/>
                <line x1="120" y1="170" x2="380" y2="170" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <line x1="250" y1="170" x2="250" y2="40"  stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <line x1="145" y1="105" x2="380" y2="200" stroke="#b45309" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'circumferencia'  , text: 'circumferència'  , px: 380, py: 170, lx:  96, ly:  20  },
                { id: 'radi'            , text: 'radi'            , px: 250, py: 107, lx:  82, ly:  67  },
                { id: 'diametre'        , text: 'diàmetre'        , px: 191, py: 170, lx: 114, ly: 313  },
                { id: 'corda'           , text: 'corda'           , px: 353, py: 188, lx: 410, ly:  76  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx: 409, ly: 302  }
            ]
        },

        // 3. TRIANGLE
        {
            id:  'triangle',
            nom: 'Triangle', dim: 2,
            svg: `
                <polygon points="250,50 60,290 440,290" fill="#fffbeb" stroke="#d97706" stroke-width="2.5"/>
                <line x1="250" y1="50"  x2="250" y2="290" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <rect x="250" y="279" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
                <circle cx="250" cy="50"  r="5" fill="#d97706"/>
                <circle cx="60"  cy="290" r="5" fill="#d97706"/>
                <circle cx="440" cy="290" r="5" fill="#d97706"/>
            `,
            etiquetes: [
                { id: 'triangle'        , text: 'triangle'        , px: 250, py: 200, lx: 105, ly:  24  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py:  50, lx: 403, ly:  81  },
                { id: 'costat'          , text: 'costat'          , px: 195, py: 119, lx: 118, ly:  86  },
                { id: 'base'            , text: 'base'            , px: 201, py: 289, lx:  68, ly: 156  },
                { id: 'altura'          , text: 'altura'          , px: 249, py: 214, lx: 425, ly: 148  }
            ]
        },

        // 4. CERCLE
        {
            id:  'cercle',
            nom: 'Cercle', dim: 2,
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
                <line x1="120" y1="170" x2="380" y2="170" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'cercle'          , text: 'cercle'          , px: 175, py: 240, lx: 110, ly:  26  },
                { id: 'radi'            , text: 'radi'            , px: 300, py: 124, lx: 416, ly: 289  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx:  73, ly: 270  },
                { id: 'diametre'        , text: 'diàmetre'        , px: 185, py: 170, lx:  73, ly: 118  }
            ]
        },

        // 5. PARAL·LELOGRAM
        {
            id:  'paralelogram',
            nom: 'Paral·lelogram', dim: 2,
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
                { id: 'paralelogram'    , text: 'paral·lelogram'  , px: 250, py: 170, lx:  99, ly:  25  },
                { id: 'costat'          , text: 'costat'          , px: 338, py: 160, lx: 434, ly: 230  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 227, py: 125, lx:  96, ly: 105  },
                { id: 'altura'          , text: 'altura'          , px: 265, py: 232, lx: 146, ly: 309  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 370, py:  71, lx: 434, ly:  29  }
            ]
        },

        // 6. TRAPEZI
        {
            id:  'trapezi',
            nom: 'Trapezi', dim: 2,
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
                { id: 'trapezi'         , text: 'trapezi'         , px: 250, py: 200, lx: 108, ly:  24  },
                { id: 'base'            , text: 'base'            , px: 270, py: 270, lx: 338, ly: 309  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 330, py:  90, lx: 420, ly:  63  },
                { id: 'altura'          , text: 'altura'          , px: 215, py: 180, lx: 428, ly: 119  },
                { id: 'costat'          , text: 'costat'          , px: 120, py: 181, lx:  76, ly: 310  }
            ]
        },

        // 7. TRIANGLE RECTANGLE
        {
            id:  'triangle_rectangle',
            nom: 'Triangle rectangle', dim: 2,
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
                { id: 'triangle_rectangle', text: 'triangle rectangle', px: 200, py: 200, lx: 110, ly:  26  },
                { id: 'angle_recte'     , text: 'angle recte'     , px: 110, py: 268, lx:  84, ly: 314  },
                { id: 'hipotenusa'      , text: 'hipotenusa'      , px: 260, py: 170, lx: 330, ly: 130  },
                { id: 'catet_contigu'   , text: 'catet'           , px: 100, py: 187, lx: 236, ly: 315  },
                { id: 'catet_oposat'    , text: 'catet'           , px: 326, py: 279, lx: 398, ly: 192  }
            ]
        },

        // 8. PENTÀGON REGULAR
        {
            id:  'pentagono',
            nom: 'Pentàgon regular', dim: 2,
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
                { id: 'pentagono'       , text: 'pentàgon'        , px: 300, py: 200, lx: 106, ly:  22  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py:  55, lx: 114, ly:  77  },
                { id: 'costat'          , text: 'costat'          , px: 349, py: 184, lx: 412, ly: 245  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 175, lx:  82, ly: 219  },
                { id: 'apotema'         , text: 'apotema'         , px: 250, py: 224, lx: 312, ly: 319  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 285, py: 164, lx: 411, ly:  58  }
            ]
        },

        // 9. HEXÀGON REGULAR
        {
            id:  'hexagono',
            nom: 'Hexàgon regular', dim: 2,
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
                { id: 'hexagono'        , text: 'hexàgon'         , px: 200, py: 130, lx: 106, ly:  28  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 354, py: 110, lx: 398, ly:  41  },
                { id: 'costat'          , text: 'costat'          , px: 306, py: 257, lx: 413, ly: 315  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx:  66, ly: 140  },
                { id: 'apotema'         , text: 'apotema'         , px: 302, py: 170, lx: 432, ly: 213  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 294, py: 194, lx: 109, ly: 306  }
            ]
        },

        // 10. CUB
        {
            id:  'cub',
            nom: 'Cub', dim: 3,
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
                { id: 'cub'             , text: 'cub'             , px: 190, py: 230, lx: 108, ly:  25  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 240, py: 160, lx: 431, ly: 116  },
                { id: 'aresta'          , text: 'aresta'          , px: 162, py: 160, lx: 218, ly:  68  },
                { id: 'cara'            , text: 'cara'            , px: 170, py: 230, lx: 395, ly: 291  }
            ]
        },

        // 11. ORTOEDRE
        {
            id:  'ortoedre',
            nom: 'Ortoedre', dim: 3,
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
                <line x1="371" y1="306" x2="426" y2="251" stroke="#d97706" stroke-width="1.5"/>
                <line x1="367" y1="302" x2="375" y2="310" stroke="#d97706" stroke-width="1.5"/>
                <line x1="422" y1="247" x2="430" y2="255" stroke="#d97706" stroke-width="1.5"/>
            `,
            etiquetes: [
                { id: 'ortoedre'        , text: 'ortoedre'        , px: 240, py: 148, lx: 110, ly:  26  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 415, py: 119, lx: 400, ly:  34  },
                { id: 'aresta'          , text: 'aresta'          , px: 311, py: 174, lx: 294, ly:  85  },
                { id: 'cara'            , text: 'cara'            , px: 237, py: 148, lx:  77, ly:  83  },
                { id: 'amplada'         , text: 'amplada'         , px: 210, py: 315, lx: 445, ly: 300  },
                { id: 'altura'          , text: 'altura'          , px:  60, py: 235, lx: 206, ly: 261  },
                { id: 'profunditat'     , text: 'profunditat'     , px: 398, py: 278, lx: 445, ly: 165  }
            ]
        },

        // 12. PIRÀMIDE
        {
            id:  'piramide',
            nom: 'Piràmide', dim: 3,
            svg: `
                <!-- 3 arestes ocultes (darrere, traç discontinu) -->
                <line x1="138" y1="222" x2="250" y2="188" stroke="#d97706" stroke-width="1.3" stroke-dasharray="6 4"/>
                <line x1="250" y1="188" x2="362" y2="222" stroke="#d97706" stroke-width="1.3" stroke-dasharray="6 4"/>
                <line x1="250" y1="48"  x2="250" y2="188" stroke="#d97706" stroke-width="1.3" stroke-dasharray="6 4"/>

                <!-- Base (translúcida) -->
                <polygon points="250,188 362,222 338,298 162,298 138,222"
                         fill="#fef3c7" fill-opacity="0.45" stroke="#d97706" stroke-width="1.8"/>

                <!-- Cares laterals visibles (translúcides, 3 cares frontals) -->
                <polygon points="250,48 162,298 338,298"
                         fill="#fcd34d" fill-opacity="0.5" stroke="#d97706" stroke-width="2.5"/>
                <polygon points="250,48 338,298 362,222"
                         fill="#fef9c3" fill-opacity="0.45" stroke="#d97706" stroke-width="2"/>
                <polygon points="250,48 162,298 138,222"
                         fill="#fde68a" fill-opacity="0.45" stroke="#d97706" stroke-width="2"/>

                <!-- Altura (eix vertical, del vèrtex al centre de la base) -->
                <line x1="250" y1="48"  x2="250" y2="246" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <rect x="250" y="235" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1.5"/>

                <!-- Punts clau -->
                <circle cx="250" cy="246" r="3.5" fill="#334155"/>
                <circle cx="250" cy="48"  r="5.5" fill="#d97706"/>
                <circle cx="250" cy="188" r="4"   fill="#d97706" opacity="0.5"/>
                <circle cx="162" cy="298" r="4"   fill="#d97706"/>
                <circle cx="338" cy="298" r="4"   fill="#d97706"/>
                <circle cx="362" cy="222" r="4"   fill="#d97706"/>
                <circle cx="138" cy="222" r="4"   fill="#d97706"/>
            `,
            etiquetes: [
                { id: 'piramide'        , text: 'piràmide'        , px: 220, py: 180, lx: 110, ly:  26  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py:  48, lx: 336, ly:  30  },
                { id: 'aresta_lateral'  , text: 'aresta lateral'  , px: 203, py: 180, lx:  72, ly: 103  },
                { id: 'cara_lateral'    , text: 'cara lateral'    , px: 312, py: 166, lx: 403, ly:  95  },
                { id: 'base'            , text: 'base'            , px: 230, py: 276, lx:  96, ly: 319  },
                { id: 'altura'          , text: 'altura'          , px: 251, py: 222, lx: 431, ly: 262  }
            ]
        },

        // 13. CILINDRE
        {
            id:  'cilindre',
            nom: 'Cilindre', dim: 3,
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
                { id: 'cilindre'        , text: 'cilindre'        , px: 170, py: 200, lx: 101, ly:  28  },
                { id: 'base'            , text: 'base'            , px: 224, py: 276, lx:  90, ly: 314  },
                { id: 'cara_lateral'    , text: 'cara lateral'    , px: 179, py: 159, lx:  99, ly: 138  },
                { id: 'alcada'          , text: 'alçada'          , px: 415, py: 182, lx: 379, ly: 321  },
                { id: 'radi'            , text: 'radi'            , px: 320, py:  90, lx: 325, ly:  29  },
                { id: 'eix'             , text: 'eix'             , px: 250, py: 150, lx: 179, ly: 209  }
            ]
        },

        // 14. CON
        {
            id:  'con',
            nom: 'Con', dim: 3,
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
                { id: 'con'             , text: 'con'             , px: 185, py: 220, lx:  98, ly:  31  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py:  50, lx: 377, ly:  30  },
                { id: 'generatriu'      , text: 'generatriu'      , px: 316, py: 144, lx: 410, ly: 117  },
                { id: 'base'            , text: 'base'            , px: 203, py: 281, lx:  73, ly: 140  },
                { id: 'altura'          , text: 'altura'          , px: 252, py: 185, lx: 435, ly: 180  },
                { id: 'radi'            , text: 'radi'            , px: 330, py: 280, lx: 438, ly: 322  }
            ]
        },

        // 15. ESFERA
        {
            id:  'esfera',
            nom: 'Esfera', dim: 3,
            svg: `
                <circle cx="250" cy="170" r="145" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
                <ellipse cx="250" cy="170" rx="145" ry="40"  fill="none" stroke="#d97706" stroke-width="1.8" stroke-dasharray="6 3"/>
                <ellipse cx="250" cy="170" rx="40"  ry="145" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <line x1="250" y1="170" x2="352" y2="78" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'esfera'          , text: 'esfera'          , px: 250, py:  25, lx: 101, ly:  24  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx:  65, ly: 275  },
                { id: 'radi'            , text: 'radi'            , px: 301, py: 124, lx: 430, ly: 301  },
                { id: 'cercle_maxim'    , text: 'cercle màxim'    , px: 358, py: 143, lx: 428, ly:  44  }
            ]
        },

        // 16. QUADRAT
        {
            id:  'quadrat',
            nom: 'Quadrat', dim: 2,
            svg: `
                <rect x="150" y="70" width="200" height="200" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5"/>
                <line x1="150" y1="70"  x2="350" y2="270" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <line x1="350" y1="70"  x2="150" y2="270" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <circle cx="250" cy="170" r="4"   fill="#334155"/>
                <circle cx="150" cy="70"  r="5"   fill="#2563eb"/>
                <circle cx="350" cy="70"  r="5"   fill="#2563eb"/>
                <circle cx="350" cy="270" r="5"   fill="#2563eb"/>
                <circle cx="150" cy="270" r="5"   fill="#2563eb"/>
            `,
            etiquetes: [
                { id: 'quadrat'         , text: 'quadrat'         , px: 250, py: 170, lx: 110, ly:  26  },
                { id: 'costat'          , text: 'costat'          , px: 350, py: 170, lx: 420, ly: 100  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 150, py: 270, lx:  75, ly: 314  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 200, py: 220, lx:  75, ly: 155  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx: 320, ly: 310  }
            ]
        },

        // 17. ROMBE
        {
            id:  'rombe',
            nom: 'Rombe', dim: 2,
            svg: `
                <polygon points="250,50 410,170 250,290 90,170" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2.5"/>
                <line x1="90"  y1="170" x2="410" y2="170" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <line x1="250" y1="50"  x2="250" y2="290" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <circle cx="250" cy="170" r="4"   fill="#334155"/>
                <circle cx="250" cy="50"  r="5"   fill="#7c3aed"/>
                <circle cx="410" cy="170" r="5"   fill="#7c3aed"/>
                <circle cx="250" cy="290" r="5"   fill="#7c3aed"/>
                <circle cx="90"  cy="170" r="5"   fill="#7c3aed"/>
            `,
            etiquetes: [
                { id: 'rombe'           , text: 'rombe'           , px: 200, py: 130, lx: 110, ly:  26  },
                { id: 'costat'          , text: 'costat'          , px: 330, py: 110, lx: 410, ly:  55  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py: 290, lx: 330, ly: 314  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 250, py: 110, lx:  70, ly: 100  },
                { id: 'diagonal2'       , text: 'diagonal'        , px: 340, py: 170, lx:  70, ly: 270  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx: 420, ly: 250  }
            ]
        },

        // 18. TETRAEDRE
        {
            id:  'tetraedre',
            nom: 'Tetraedre', dim: 3,
            svg: `
                <!-- Aresta oculta (vèrtex superior a vèrtex posterior de la base) -->
                <line x1="250" y1="48" x2="250" y2="200" stroke="#d97706" stroke-width="1.3" stroke-dasharray="6 4"/>

                <!-- Base (triangle, translúcida) -->
                <polygon points="110,290 390,290 250,200"
                         fill="#fef3c7" fill-opacity="0.45" stroke="#d97706" stroke-width="1.8"/>

                <!-- Cara frontal -->
                <polygon points="250,48 110,290 390,290"
                         fill="#fcd34d" fill-opacity="0.5" stroke="#d97706" stroke-width="2.5"/>

                <!-- Cares laterals -->
                <polygon points="250,48 390,290 250,200"
                         fill="#fef9c3" fill-opacity="0.45" stroke="#d97706" stroke-width="2"/>
                <polygon points="250,48 110,290 250,200"
                         fill="#fde68a" fill-opacity="0.45" stroke="#d97706" stroke-width="2"/>

                <!-- Altura (del vèrtex superior al baricentre de la base) -->
                <line x1="250" y1="48" x2="250" y2="260" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <rect x="250" y="249" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="1.5"/>

                <!-- Punts clau -->
                <circle cx="250" cy="260" r="3.5" fill="#334155"/>
                <circle cx="250" cy="48"  r="5.5" fill="#d97706"/>
                <circle cx="110" cy="290" r="4"   fill="#d97706"/>
                <circle cx="390" cy="290" r="4"   fill="#d97706"/>
                <circle cx="250" cy="200" r="4"   fill="#d97706" opacity="0.5"/>
            `,
            etiquetes: [
                { id: 'tetraedre'       , text: 'tetraedre'       , px: 220, py: 200, lx: 110, ly:  26  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py:  48, lx: 345, ly:  30  },
                { id: 'aresta'          , text: 'aresta'          , px: 180, py: 169, lx:  70, ly: 105  },
                { id: 'cara'            , text: 'cara'            , px: 310, py: 200, lx: 410, ly: 135  },
                { id: 'base'            , text: 'base'            , px: 250, py: 270, lx: 100, ly: 319  },
                { id: 'altura'          , text: 'altura'          , px: 251, py: 210, lx: 430, ly: 260  }
            ]
        },

        // 19. EL·LIPSE
        {
            id:  'ellipse',
            nom: 'El·lipse', dim: 2,
            svg: `
                <ellipse cx="250" cy="170" rx="190" ry="120" fill="#f0fdf4" stroke="#059669" stroke-width="2.5"/>
                <!-- Eix major (horitzontal) -->
                <line x1="60"  y1="170" x2="440" y2="170" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- Eix menor (vertical) -->
                <line x1="250" y1="50"  x2="250" y2="290" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- Centre -->
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
                <!-- Focus (c ≈ 147 per a a=190, b=120) -->
                <circle cx="103" cy="170" r="4.5" fill="#d97706"/>
                <circle cx="397" cy="170" r="4.5" fill="#d97706"/>
            `,
            etiquetes: [
                { id: 'ellipse'         , text: 'el·lipse'        , px: 350, py: 100, lx: 110, ly:  26  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx: 290, ly: 310  },
                { id: 'eix_major'       , text: 'eix major'       , px: 145, py: 170, lx:  70, ly: 100  },
                { id: 'eix_menor'       , text: 'eix menor'       , px: 250, py: 110, lx: 380, ly:  55  },
                { id: 'focus'           , text: 'focus'           , px: 397, py: 170, lx: 420, ly: 260  }
            ]
        },

        // 20. TORUS
        {
            id:  'torus',
            nom: 'Torus', dim: 3,
            svg: `
<path d="M280,297L287,272L222,253L213,278Z" fill="rgb(169,102,130)" stroke="rgb(169,102,130)" stroke-width=".3"/>
<path d="M213,278L222,253L162,226L151,250Z" fill="rgb(180,108,138)" stroke="rgb(180,108,138)" stroke-width=".3"/>
<path d="M287,272L290,246L231,229L222,253Z" fill="rgb(117,71,95)" stroke="rgb(117,71,95)" stroke-width=".3"/>
<path d="M222,253L231,229L176,204L162,226Z" fill="rgb(125,76,100)" stroke="rgb(125,76,100)" stroke-width=".3"/>
<path d="M271,315L280,297L213,278L207,297Z" fill="rgb(210,126,158)" stroke="rgb(210,126,158)" stroke-width=".3"/>
<path d="M207,297L213,278L151,250L146,269Z" fill="rgb(221,133,165)" stroke="rgb(221,133,165)" stroke-width=".3"/>
<path d="M290,246L289,226L238,211L231,229Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M231,229L238,211L190,190L176,204Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M348,278L346,252L290,246L287,272Z" fill="rgb(104,63,86)" stroke="rgb(104,63,86)" stroke-width=".3"/>
<path d="M162,226L176,204L129,173L110,191Z" fill="rgb(128,77,103)" stroke="rgb(128,77,103)" stroke-width=".3"/>
<path d="M343,304L348,278L287,272L280,297Z" fill="rgb(152,91,118)" stroke="rgb(152,91,118)" stroke-width=".3"/>
<path d="M151,250L162,226L110,191L97,214Z" fill="rgb(184,111,140)" stroke="rgb(184,111,140)" stroke-width=".3"/>
<path d="M176,204L190,190L149,162L129,173Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M346,252L337,231L289,226L290,246Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M146,269L151,250L97,214L94,235Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M332,322L343,304L280,297L271,315Z" fill="rgb(193,116,146)" stroke="rgb(193,116,146)" stroke-width=".3"/>
<path d="M204,304L207,297L146,269L149,279Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M263,320L271,315L207,297L204,304Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M289,226L283,217L240,205L238,211Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M238,211L240,205L199,187L190,190Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M190,190L199,187L165,164L149,162Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M337,231L324,222L283,217L289,226Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M110,191L129,173L95,138L73,154Z" fill="rgb(126,76,101)" stroke="rgb(126,76,101)" stroke-width=".3"/>
<path d="M401,273L394,247L346,252L348,278Z" fill="rgb(89,54,76)" stroke="rgb(89,54,76)" stroke-width=".3"/>
<path d="M149,279L146,269L94,235L102,247Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M319,327L332,322L271,315L263,320Z" fill="rgb(217,130,163)" stroke="rgb(217,130,163)" stroke-width=".3"/>
<path d="M398,299L401,273L348,278L343,304Z" fill="rgb(130,79,104)" stroke="rgb(130,79,104)" stroke-width=".3"/>
<path d="M97,214L110,191L73,154L59,175Z" fill="rgb(181,109,138)" stroke="rgb(181,109,138)" stroke-width=".3"/>
<path d="M129,173L149,162L120,133L95,138Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M394,247L379,227L337,231L346,252Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M257,312L263,320L204,304L206,298Z" fill="rgb(222,133,166)" stroke="rgb(222,133,166)" stroke-width=".3"/>
<path d="M206,298L204,304L149,279L158,276Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M240,205L237,213L202,197L199,187Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M283,217L275,223L237,213L240,205Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M385,317L398,299L343,304L332,322Z" fill="rgb(171,103,132)" stroke="rgb(171,103,132)" stroke-width=".3"/>
<path d="M94,235L97,214L59,175L57,197Z" fill="rgb(222,133,166)" stroke="rgb(222,133,166)" stroke-width=".3"/>
<path d="M199,187L202,197L172,177L165,164Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M324,222L310,227L275,223L283,217Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M149,162L165,164L140,139L120,133Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M379,227L359,219L324,222L337,231Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M158,276L149,279L102,247L118,249Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M306,318L319,327L263,320L257,312Z" fill="rgb(218,131,163)" stroke="rgb(218,131,163)" stroke-width=".3"/>
<path d="M213,280L206,298L158,276L172,262Z" fill="rgb(187,112,142)" stroke="rgb(187,112,142)" stroke-width=".3"/>
<path d="M256,292L257,312L206,298L213,280Z" fill="rgb(190,114,144)" stroke="rgb(190,114,144)" stroke-width=".3"/>
<path d="M237,213L231,231L197,216L202,197Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M275,223L266,241L231,231L237,213Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M367,322L385,317L332,322L319,327Z" fill="rgb(201,121,152)" stroke="rgb(201,121,152)" stroke-width=".3"/>
<path d="M102,247L94,235L57,197L68,213Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M310,227L299,245L266,241L275,223Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M202,197L197,216L169,197L172,177Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M165,164L172,177L151,155L140,139Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M359,219L341,224L310,227L324,222Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M440,257L429,232L394,247L401,273Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M73,154L95,138L78,104L54,116Z" fill="rgb(118,72,96)" stroke="rgb(118,72,96)" stroke-width=".3"/>
<path d="M222,256L213,280L172,262L186,240Z" fill="rgb(133,80,106)" stroke="rgb(133,80,106)" stroke-width=".3"/>
<path d="M259,266L256,292L213,280L222,256Z" fill="rgb(141,85,111)" stroke="rgb(141,85,111)" stroke-width=".3"/>
<path d="M297,297L306,318L257,312L256,292Z" fill="rgb(195,117,147)" stroke="rgb(195,117,147)" stroke-width=".3"/>
<path d="M172,262L158,276L118,249L138,239Z" fill="rgb(186,112,142)" stroke="rgb(186,112,142)" stroke-width=".3"/>
<path d="M266,241L259,266L222,256L231,231Z" fill="rgb(89,54,76)" stroke="rgb(89,54,76)" stroke-width=".3"/>
<path d="M231,231L222,256L186,240L197,216Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M95,138L120,133L105,103L78,104Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M429,232L409,214L379,227L394,247Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M59,175L73,154L54,116L40,136Z" fill="rgb(171,103,131)" stroke="rgb(171,103,131)" stroke-width=".3"/>
<path d="M438,282L440,257L401,273L398,299Z" fill="rgb(107,65,88)" stroke="rgb(107,65,88)" stroke-width=".3"/>
<path d="M118,249L102,247L68,213L88,219Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M347,313L367,322L319,327L306,318Z" fill="rgb(212,127,159)" stroke="rgb(212,127,159)" stroke-width=".3"/>
<path d="M299,245L294,270L259,266L266,241Z" fill="rgb(106,65,88)" stroke="rgb(106,65,88)" stroke-width=".3"/>
<path d="M197,216L186,240L157,220L169,197Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M186,240L172,262L138,239L157,220Z" fill="rgb(130,79,104)" stroke="rgb(130,79,104)" stroke-width=".3"/>
<path d="M294,270L297,297L256,292L259,266Z" fill="rgb(154,93,120)" stroke="rgb(154,93,120)" stroke-width=".3"/>
<path d="M120,133L140,139L128,114L105,103Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M409,214L385,208L359,219L379,227Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M341,224L328,242L299,245L310,227Z" fill="rgb(87,53,75)" stroke="rgb(87,53,75)" stroke-width=".3"/>
<path d="M172,177L169,197L149,177L151,155Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M57,197L59,175L40,136L39,159Z" fill="rgb(212,127,159)" stroke="rgb(212,127,159)" stroke-width=".3"/>
<path d="M424,300L438,282L398,299L385,317Z" fill="rgb(148,89,116)" stroke="rgb(148,89,116)" stroke-width=".3"/>
<path d="M332,293L347,313L306,318L297,297Z" fill="rgb(200,120,151)" stroke="rgb(200,120,151)" stroke-width=".3"/>
<path d="M138,239L118,249L88,219L113,214Z" fill="rgb(187,112,142)" stroke="rgb(187,112,142)" stroke-width=".3"/>
<path d="M140,139L151,155L140,133L128,114Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M385,208L363,214L341,224L359,219Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M169,197L157,220L135,198L149,177Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M328,242L325,267L294,270L299,245Z" fill="rgb(128,77,102)" stroke="rgb(128,77,102)" stroke-width=".3"/>
<path d="M157,220L138,239L113,214L135,198Z" fill="rgb(132,80,105)" stroke="rgb(132,80,105)" stroke-width=".3"/>
<path d="M325,267L332,293L297,297L294,270Z" fill="rgb(169,102,131)" stroke="rgb(169,102,131)" stroke-width=".3"/>
<path d="M68,213L57,197L39,159L51,179Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M402,307L424,300L385,317L367,322Z" fill="rgb(184,111,140)" stroke="rgb(184,111,140)" stroke-width=".3"/>
<path d="M151,155L149,177L139,156L140,133Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M363,214L349,233L328,242L341,224Z" fill="rgb(110,67,90)" stroke="rgb(110,67,90)" stroke-width=".3"/>
<path d="M88,219L68,213L51,179L74,189Z" fill="rgb(223,134,167)" stroke="rgb(223,134,167)" stroke-width=".3"/>
<path d="M378,300L402,307L367,322L347,313Z" fill="rgb(206,124,155)" stroke="rgb(206,124,155)" stroke-width=".3"/>
<path d="M78,104L105,103L106,76L79,73Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M448,208L426,193L409,214L429,232Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M54,116L78,104L79,73L55,82Z" fill="rgb(106,64,88)" stroke="rgb(106,64,88)" stroke-width=".3"/>
<path d="M460,230L448,208L429,232L440,257Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M105,103L128,114L128,91L106,76Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M426,193L399,190L385,208L409,214Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M149,177L135,198L124,176L139,156Z" fill="rgb(87,53,75)" stroke="rgb(87,53,75)" stroke-width=".3"/>
<path d="M349,233L347,258L325,267L328,242Z" fill="rgb(151,91,118)" stroke="rgb(151,91,118)" stroke-width=".3"/>
<path d="M113,214L88,219L74,189L100,189Z" fill="rgb(189,114,144)" stroke="rgb(189,114,144)" stroke-width=".3"/>
<path d="M358,282L378,300L347,313L332,293Z" fill="rgb(207,124,156)" stroke="rgb(207,124,156)" stroke-width=".3"/>
<path d="M40,136L54,116L55,82L41,102Z" fill="rgb(154,93,120)" stroke="rgb(154,93,120)" stroke-width=".3"/>
<path d="M459,254L460,230L440,257L438,282Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M135,198L113,214L100,189L124,176Z" fill="rgb(140,84,110)" stroke="rgb(140,84,110)" stroke-width=".3"/>
<path d="M347,258L358,282L332,293L325,267Z" fill="rgb(187,112,142)" stroke="rgb(187,112,142)" stroke-width=".3"/>
<path d="M128,114L140,133L141,114L128,91Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M399,190L375,199L363,214L385,208Z" fill="rgb(91,55,77)" stroke="rgb(91,55,77)" stroke-width=".3"/>
<path d="M39,159L40,136L41,102L40,126Z" fill="rgb(196,118,148)" stroke="rgb(196,118,148)" stroke-width=".3"/>
<path d="M445,274L459,254L438,282L424,300Z" fill="rgb(125,75,100)" stroke="rgb(125,75,100)" stroke-width=".3"/>
<path d="M140,133L139,156L139,138L141,114Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M375,199L361,218L349,233L363,214Z" fill="rgb(133,81,106)" stroke="rgb(133,81,106)" stroke-width=".3"/>
<path d="M51,179L39,159L40,126L52,148Z" fill="rgb(219,132,164)" stroke="rgb(219,132,164)" stroke-width=".3"/>
<path d="M421,283L445,274L424,300L402,307Z" fill="rgb(167,101,129)" stroke="rgb(167,101,129)" stroke-width=".3"/>
<path d="M139,156L124,176L125,157L139,138Z" fill="rgb(104,63,86)" stroke="rgb(104,63,86)" stroke-width=".3"/>
<path d="M361,218L359,242L347,258L349,233Z" fill="rgb(175,105,134)" stroke="rgb(175,105,134)" stroke-width=".3"/>
<path d="M106,76L128,91L142,74L122,56Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M426,167L400,167L399,190L426,193Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M74,189L51,179L52,148L74,163Z" fill="rgb(218,131,164)" stroke="rgb(218,131,164)" stroke-width=".3"/>
<path d="M394,280L421,283L402,307L378,300Z" fill="rgb(199,120,151)" stroke="rgb(199,120,151)" stroke-width=".3"/>
<path d="M124,176L100,189L101,166L125,157Z" fill="rgb(152,92,119)" stroke="rgb(152,92,119)" stroke-width=".3"/>
<path d="M359,242L372,265L358,282L347,258Z" fill="rgb(204,122,154)" stroke="rgb(204,122,154)" stroke-width=".3"/>
<path d="M128,91L141,114L153,98L142,74Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M400,167L376,180L375,199L399,190Z" fill="rgb(106,64,88)" stroke="rgb(106,64,88)" stroke-width=".3"/>
<path d="M79,73L106,76L122,56L98,49Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M449,177L426,167L426,193L448,208Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M100,189L74,189L74,163L101,166Z" fill="rgb(194,116,147)" stroke="rgb(194,116,147)" stroke-width=".3"/>
<path d="M372,265L394,280L378,300L358,282Z" fill="rgb(213,128,160)" stroke="rgb(213,128,160)" stroke-width=".3"/>
<path d="M141,114L139,138L151,123L153,98Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M376,180L361,200L361,218L375,199Z" fill="rgb(154,93,120)" stroke="rgb(154,93,120)" stroke-width=".3"/>
<path d="M55,82L79,73L98,49L76,56Z" fill="rgb(91,55,77)" stroke="rgb(91,55,77)" stroke-width=".3"/>
<path d="M461,197L449,177L448,208L460,230Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M139,138L125,157L137,142L151,123Z" fill="rgb(125,75,100)" stroke="rgb(125,75,100)" stroke-width=".3"/>
<path d="M361,200L360,223L359,242L361,218Z" fill="rgb(196,118,148)" stroke="rgb(196,118,148)" stroke-width=".3"/>
<path d="M41,102L55,82L76,56L62,74Z" fill="rgb(133,81,106)" stroke="rgb(133,81,106)" stroke-width=".3"/>
<path d="M460,220L461,197L460,230L459,254Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M125,157L101,166L115,148L137,142Z" fill="rgb(167,101,129)" stroke="rgb(167,101,129)" stroke-width=".3"/>
<path d="M360,223L372,242L372,265L359,242Z" fill="rgb(219,132,164)" stroke="rgb(219,132,164)" stroke-width=".3"/>
<path d="M142,74L153,98L175,89L168,63Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M387,142L365,158L376,180L400,167Z" fill="rgb(118,72,96)" stroke="rgb(118,72,96)" stroke-width=".3"/>
<path d="M40,126L41,102L62,74L60,99Z" fill="rgb(175,105,134)" stroke="rgb(175,105,134)" stroke-width=".3"/>
<path d="M446,240L460,220L459,254L445,274Z" fill="rgb(104,63,86)" stroke="rgb(104,63,86)" stroke-width=".3"/>
<path d="M122,56L142,74L168,63L153,43Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M412,137L387,142L400,167L426,167Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M153,98L151,123L172,114L175,89Z" fill="rgb(107,65,88)" stroke="rgb(107,65,88)" stroke-width=".3"/>
<path d="M365,158L351,179L361,200L376,180Z" fill="rgb(171,103,131)" stroke="rgb(171,103,131)" stroke-width=".3"/>
<path d="M101,166L74,163L91,142L115,148Z" fill="rgb(199,120,151)" stroke="rgb(199,120,151)" stroke-width=".3"/>
<path d="M372,242L395,253L394,280L372,265Z" fill="rgb(218,131,164)" stroke="rgb(218,131,164)" stroke-width=".3"/>
<path d="M52,148L40,126L60,99L71,124Z" fill="rgb(204,122,154)" stroke="rgb(204,122,154)" stroke-width=".3"/>
<path d="M422,252L446,240L445,274L421,283Z" fill="rgb(152,92,119)" stroke="rgb(152,92,119)" stroke-width=".3"/>
<path d="M74,163L52,148L71,124L91,142Z" fill="rgb(213,128,160)" stroke="rgb(213,128,160)" stroke-width=".3"/>
<path d="M395,253L422,252L421,283L394,280Z" fill="rgb(194,116,147)" stroke="rgb(194,116,147)" stroke-width=".3"/>
<path d="M98,49L122,56L153,43L133,34Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M432,143L412,137L426,167L449,177Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M151,123L137,142L159,132L172,114Z" fill="rgb(148,89,116)" stroke="rgb(148,89,116)" stroke-width=".3"/>
<path d="M351,179L349,201L360,223L361,200Z" fill="rgb(212,127,159)" stroke="rgb(212,127,159)" stroke-width=".3"/>
<path d="M76,56L98,49L133,34L115,39Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M443,159L432,143L449,177L461,197Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M168,63L175,89L206,86L203,59Z" fill="rgb(89,54,76)" stroke="rgb(89,54,76)" stroke-width=".3"/>
<path d="M362,117L343,136L365,158L387,142Z" fill="rgb(126,76,101)" stroke="rgb(126,76,101)" stroke-width=".3"/>
<path d="M175,89L172,114L201,111L206,86Z" fill="rgb(130,79,104)" stroke="rgb(130,79,104)" stroke-width=".3"/>
<path d="M343,136L331,159L351,179L365,158Z" fill="rgb(181,109,138)" stroke="rgb(181,109,138)" stroke-width=".3"/>
<path d="M137,142L115,148L141,137L159,132Z" fill="rgb(184,111,140)" stroke="rgb(184,111,140)" stroke-width=".3"/>
<path d="M349,201L360,217L372,242L360,223Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M153,43L168,63L203,59L194,38Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M382,107L362,117L387,142L412,137Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M62,74L76,56L115,39L102,57Z" fill="rgb(110,67,90)" stroke="rgb(110,67,90)" stroke-width=".3"/>
<path d="M441,181L443,159L461,197L460,220Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M172,114L159,132L190,129L201,111Z" fill="rgb(171,103,132)" stroke="rgb(171,103,132)" stroke-width=".3"/>
<path d="M331,159L328,179L349,201L351,179Z" fill="rgb(222,133,166)" stroke="rgb(222,133,166)" stroke-width=".3"/>
<path d="M115,148L91,142L121,129L141,137Z" fill="rgb(206,124,155)" stroke="rgb(206,124,155)" stroke-width=".3"/>
<path d="M360,217L380,223L395,253L372,242Z" fill="rgb(223,134,167)" stroke="rgb(223,134,167)" stroke-width=".3"/>
<path d="M203,59L206,86L241,90L244,64Z" fill="rgb(104,63,86)" stroke="rgb(104,63,86)" stroke-width=".3"/>
<path d="M328,94L314,116L343,136L362,117Z" fill="rgb(128,77,103)" stroke="rgb(128,77,103)" stroke-width=".3"/>
<path d="M206,86L201,111L234,115L241,90Z" fill="rgb(152,91,118)" stroke="rgb(152,91,118)" stroke-width=".3"/>
<path d="M314,116L303,140L331,159L343,136Z" fill="rgb(184,111,140)" stroke="rgb(184,111,140)" stroke-width=".3"/>
<path d="M133,34L153,43L194,38L181,29Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M398,109L382,107L412,137L432,143Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M60,99L62,74L102,57L99,83Z" fill="rgb(151,91,118)" stroke="rgb(151,91,118)" stroke-width=".3"/>
<path d="M427,202L441,181L460,220L446,240Z" fill="rgb(87,53,75)" stroke="rgb(87,53,75)" stroke-width=".3"/>
<path d="M91,142L71,124L106,109L121,129Z" fill="rgb(207,124,156)" stroke="rgb(207,124,156)" stroke-width=".3"/>
<path d="M380,223L405,218L422,252L395,253Z" fill="rgb(189,114,144)" stroke="rgb(189,114,144)" stroke-width=".3"/>
<path d="M241,90L234,115L269,125L278,100Z" fill="rgb(169,102,130)" stroke="rgb(169,102,130)" stroke-width=".3"/>
<path d="M278,100L269,125L303,140L314,116Z" fill="rgb(180,108,138)" stroke="rgb(180,108,138)" stroke-width=".3"/>
<path d="M194,38L203,59L244,64L243,44Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M342,80L328,94L362,117L382,107Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M244,64L241,90L278,100L287,76Z" fill="rgb(117,71,95)" stroke="rgb(117,71,95)" stroke-width=".3"/>
<path d="M287,76L278,100L314,116L328,94Z" fill="rgb(125,76,100)" stroke="rgb(125,76,100)" stroke-width=".3"/>
<path d="M71,124L60,99L99,83L106,109Z" fill="rgb(187,112,142)" stroke="rgb(187,112,142)" stroke-width=".3"/>
<path d="M405,218L427,202L446,240L422,252Z" fill="rgb(140,84,110)" stroke="rgb(140,84,110)" stroke-width=".3"/>
<path d="M159,132L141,137L176,134L190,129Z" fill="rgb(201,121,152)" stroke="rgb(201,121,152)" stroke-width=".3"/>
<path d="M328,179L335,192L360,217L349,201Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M201,111L190,129L225,133L234,115Z" fill="rgb(193,116,146)" stroke="rgb(193,116,146)" stroke-width=".3"/>
<path d="M303,140L298,159L328,179L331,159Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M115,39L133,34L181,29L168,34Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M406,121L398,109L432,143L443,159Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M234,115L225,133L263,143L269,125Z" fill="rgb(210,126,158)" stroke="rgb(210,126,158)" stroke-width=".3"/>
<path d="M269,125L263,143L298,159L303,140Z" fill="rgb(221,133,165)" stroke="rgb(221,133,165)" stroke-width=".3"/>
<path d="M243,44L244,64L287,76L294,58Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M294,58L287,76L328,94L342,80Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M181,29L194,38L243,44L237,36Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M351,77L342,80L382,107L398,109Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M141,137L121,129L163,125L176,134Z" fill="rgb(212,127,159)" stroke="rgb(212,127,159)" stroke-width=".3"/>
<path d="M335,192L351,194L380,223L360,217Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M190,129L176,134L217,139L225,133Z" fill="rgb(217,130,163)" stroke="rgb(217,130,163)" stroke-width=".3"/>
<path d="M298,159L301,169L335,192L328,179Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M102,57L115,39L168,34L157,52Z" fill="rgb(87,53,75)" stroke="rgb(87,53,75)" stroke-width=".3"/>
<path d="M403,142L406,121L443,159L441,181Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M225,133L217,139L260,151L263,143Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M263,143L260,151L301,169L298,159Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M237,36L243,44L294,58L296,52Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M296,52L294,58L342,80L351,77Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M121,129L106,109L154,104L163,125Z" fill="rgb(200,120,151)" stroke="rgb(200,120,151)" stroke-width=".3"/>
<path d="M351,194L371,183L405,218L380,223Z" fill="rgb(187,112,142)" stroke="rgb(187,112,142)" stroke-width=".3"/>
<path d="M99,83L102,57L157,52L152,78Z" fill="rgb(128,77,102)" stroke="rgb(128,77,102)" stroke-width=".3"/>
<path d="M390,165L403,142L441,181L427,202Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M168,34L181,29L237,36L229,41Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M354,87L351,77L398,109L406,121Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M106,109L99,83L152,78L154,104Z" fill="rgb(169,102,131)" stroke="rgb(169,102,131)" stroke-width=".3"/>
<path d="M371,183L390,165L427,202L405,218Z" fill="rgb(132,80,105)" stroke="rgb(132,80,105)" stroke-width=".3"/>
<path d="M176,134L163,125L211,130L217,139Z" fill="rgb(218,131,163)" stroke="rgb(218,131,163)" stroke-width=".3"/>
<path d="M301,169L310,166L351,194L335,192Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M217,139L211,130L262,145L260,151Z" fill="rgb(222,133,166)" stroke="rgb(222,133,166)" stroke-width=".3"/>
<path d="M260,151L262,145L310,166L301,169Z" fill="rgb(225,135,168)" stroke="rgb(225,135,168)" stroke-width=".3"/>
<path d="M229,41L237,36L296,52L293,59Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M293,59L296,52L351,77L354,87Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M157,52L168,34L229,41L220,59Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M349,106L354,87L406,121L403,142Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M163,125L154,104L210,110L211,130Z" fill="rgb(195,117,147)" stroke="rgb(195,117,147)" stroke-width=".3"/>
<path d="M310,166L324,152L371,183L351,194Z" fill="rgb(186,112,142)" stroke="rgb(186,112,142)" stroke-width=".3"/>
<path d="M152,78L157,52L220,59L213,84Z" fill="rgb(106,65,88)" stroke="rgb(106,65,88)" stroke-width=".3"/>
<path d="M338,130L349,106L403,142L390,165Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M154,104L152,78L213,84L210,110Z" fill="rgb(154,93,120)" stroke="rgb(154,93,120)" stroke-width=".3"/>
<path d="M324,152L338,130L390,165L371,183Z" fill="rgb(130,79,104)" stroke="rgb(130,79,104)" stroke-width=".3"/>
<path d="M211,130L210,110L269,127L262,145Z" fill="rgb(190,114,144)" stroke="rgb(190,114,144)" stroke-width=".3"/>
<path d="M262,145L269,127L324,152L310,166Z" fill="rgb(187,112,142)" stroke="rgb(187,112,142)" stroke-width=".3"/>
<path d="M220,59L229,41L293,59L287,78Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M287,78L293,59L354,87L349,106Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<path d="M210,110L213,84L278,103L269,127Z" fill="rgb(141,85,111)" stroke="rgb(141,85,111)" stroke-width=".3"/>
<path d="M269,127L278,103L338,130L324,152Z" fill="rgb(133,80,106)" stroke="rgb(133,80,106)" stroke-width=".3"/>
<path d="M213,84L220,59L287,78L278,103Z" fill="rgb(89,54,76)" stroke="rgb(89,54,76)" stroke-width=".3"/>
<path d="M278,103L287,78L349,106L338,130Z" fill="rgb(84,51,73)" stroke="rgb(84,51,73)" stroke-width=".3"/>
<line x1="213" y1="278" x2="151" y2="250" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="280" y1="297" x2="213" y2="278" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="280" y1="297" x2="287" y2="272" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="287" y1="272" x2="290" y2="246" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="271" y1="315" x2="280" y2="297" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="290" y1="246" x2="289" y2="226" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="343" y1="304" x2="280" y2="297" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="151" y1="250" x2="97" y2="214" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="238" y1="211" x2="190" y2="190" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="289" y1="226" x2="238" y2="211" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="337" y1="231" x2="289" y2="226" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="190" y1="190" x2="149" y2="162" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="263" y1="320" x2="271" y2="315" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="289" y1="226" x2="283" y2="217" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="97" y1="214" x2="59" y2="175" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="398" y1="299" x2="343" y2="304" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="257" y1="312" x2="263" y2="320" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="379" y1="227" x2="337" y2="231" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="149" y1="162" x2="120" y2="133" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="73" y1="154" x2="95" y2="138" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="59" y1="175" x2="73" y2="154" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="95" y1="138" x2="120" y2="133" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="57" y1="197" x2="59" y2="175" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="120" y1="133" x2="140" y2="139" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="120" y1="133" x2="105" y2="103" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="409" y1="214" x2="379" y2="227" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="68" y1="213" x2="57" y2="197" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="59" y1="175" x2="40" y2="136" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="438" y1="282" x2="398" y2="299" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="140" y1="139" x2="151" y2="155" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="105" y1="103" x2="106" y2="76" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="426" y1="193" x2="409" y2="214" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="40" y1="136" x2="41" y2="102" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="459" y1="254" x2="438" y2="282" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="426" y1="193" x2="399" y2="190" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="448" y1="208" x2="426" y2="193" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="460" y1="230" x2="448" y2="208" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="399" y1="190" x2="375" y2="199" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="361" y1="218" x2="349" y2="233" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="375" y1="199" x2="361" y2="218" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="459" y1="254" x2="460" y2="230" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="106" y1="76" x2="122" y2="56" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="426" y1="167" x2="426" y2="193" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="361" y1="218" x2="359" y2="242" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="139" y1="138" x2="151" y2="123" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="361" y1="200" x2="361" y2="218" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="41" y1="102" x2="62" y2="74" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="122" y1="56" x2="153" y2="43" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="412" y1="137" x2="426" y2="167" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="151" y1="123" x2="172" y2="114" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="351" y1="179" x2="361" y2="200" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="168" y1="63" x2="175" y2="89" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="175" y1="89" x2="172" y2="114" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="153" y1="43" x2="168" y2="63" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="172" y1="114" x2="159" y2="132" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="133" y1="34" x2="153" y2="43" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="172" y1="114" x2="201" y2="111" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="331" y1="159" x2="351" y2="179" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="153" y1="43" x2="194" y2="38" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="382" y1="107" x2="412" y2="137" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="159" y1="132" x2="141" y2="137" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="115" y1="39" x2="133" y2="34" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="201" y1="111" x2="234" y2="115" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="303" y1="140" x2="331" y2="159" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="314" y1="116" x2="303" y2="140" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="328" y1="94" x2="314" y2="116" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="234" y1="115" x2="269" y2="125" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="269" y1="125" x2="303" y2="140" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="194" y1="38" x2="243" y2="44" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="342" y1="80" x2="382" y2="107" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="303" y1="140" x2="298" y2="159" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="342" y1="80" x2="328" y2="94" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="243" y1="44" x2="294" y2="58" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="294" y1="58" x2="342" y2="80" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="298" y1="159" x2="301" y2="169" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="351" y1="77" x2="342" y2="80" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="301" y1="169" x2="310" y2="166" stroke="#904068" stroke-width=".5" stroke-dasharray="3 2" opacity=".35"/>
<line x1="283" y1="217" x2="275" y2="223" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="206" y1="298" x2="158" y2="276" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="257" y1="312" x2="206" y2="298" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="256" y1="292" x2="257" y2="312" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="275" y1="223" x2="266" y2="241" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="158" y1="276" x2="118" y2="249" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="306" y1="318" x2="257" y2="312" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="231" y1="231" x2="197" y2="216" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="266" y1="241" x2="231" y2="231" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="259" y1="266" x2="256" y2="292" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="266" y1="241" x2="259" y2="266" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="197" y1="216" x2="169" y2="197" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="299" y1="245" x2="266" y2="241" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="347" y1="313" x2="306" y2="318" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="118" y1="249" x2="88" y2="219" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="328" y1="242" x2="299" y2="245" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="169" y1="197" x2="149" y2="177" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="88" y1="219" x2="68" y2="213" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="151" y1="155" x2="149" y2="177" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="113" y1="214" x2="88" y2="219" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="149" y1="177" x2="135" y2="198" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="135" y1="198" x2="113" y2="214" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="149" y1="177" x2="139" y2="156" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="349" y1="233" x2="328" y2="242" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="88" y1="219" x2="74" y2="189" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="378" y1="300" x2="347" y2="313" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="139" y1="156" x2="139" y2="138" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="74" y1="189" x2="74" y2="163" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="394" y1="280" x2="378" y2="300" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="445" y1="274" x2="459" y2="254" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="359" y1="242" x2="372" y2="265" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="421" y1="283" x2="445" y2="274" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="372" y1="265" x2="394" y2="280" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="394" y1="280" x2="421" y2="283" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="460" y1="220" x2="459" y2="254" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="74" y1="163" x2="91" y2="142" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="395" y1="253" x2="394" y2="280" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="62" y1="74" x2="102" y2="57" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="441" y1="181" x2="460" y2="220" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="91" y1="142" x2="121" y2="129" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="380" y1="223" x2="395" y2="253" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="141" y1="137" x2="121" y2="129" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="102" y1="57" x2="115" y2="39" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="121" y1="129" x2="106" y2="109" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="99" y1="83" x2="102" y2="57" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="106" y1="109" x2="99" y2="83" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="121" y1="129" x2="163" y2="125" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="351" y1="194" x2="380" y2="223" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="102" y1="57" x2="157" y2="52" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="403" y1="142" x2="441" y2="181" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="354" y1="87" x2="351" y2="77" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="163" y1="125" x2="211" y2="130" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="310" y1="166" x2="351" y2="194" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="211" y1="130" x2="262" y2="145" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="262" y1="145" x2="310" y2="166" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="157" y1="52" x2="220" y2="59" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="349" y1="106" x2="403" y2="142" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="310" y1="166" x2="324" y2="152" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="349" y1="106" x2="354" y2="87" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="324" y1="152" x2="338" y2="130" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="338" y1="130" x2="349" y2="106" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="220" y1="59" x2="287" y2="78" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
<line x1="287" y1="78" x2="349" y2="106" stroke="#7a2a55" stroke-width=".7" opacity=".55"/>
                <circle cx="375" cy="178" r="3" fill="#7c3aed"/>
                <line x1="250" y1="178" x2="375" y2="178" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <line x1="375" y1="178" x2="375" y2="96" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="178" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'torus'           , text: 'torus'           , px: 150, py: 110, lx: 110, ly:  26  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 178, lx:  70, ly: 280  },
                { id: 'radi_major'      , text: 'radi major'      , px: 312, py: 178, lx: 130, ly: 310  },
                { id: 'radi_menor'      , text: 'radi menor'      , px: 375, py: 137, lx: 430, ly:  60  }
            ]
        }

    ];

    return { all: FIGURES };

})();
