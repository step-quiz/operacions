/**
 * ============================================================================
 * PROJECTE: Vocabulari Matemàtic
 * FITXER: js/vocabulari/vocabulari-figures.js
 * ROL: Font de veritat única de totes les figures geomètriques.
 * ARQUITECTURA:
 * - Mòdul IIFE sense efectes secundaris ni dependències externes.
 * - Cada figura té: id, nom, dim (2=pla | 3=espai), svg (markup SVG literal) i etiquetes[].
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
            dim: 2,
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
            nom: 'Circumferència',
            dim: 2,
            svg: `
                <circle cx="250" cy="170" r="130" fill="white" stroke="#059669" stroke-width="2.5"/>
                <!-- diàmetre inclinat ~25° (extrems sobre la circumferència) -->
                <line x1="132" y1="115" x2="368" y2="225" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- radi vertical cap amunt -->
                <line x1="250" y1="170" x2="250" y2="40"  stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- corda obliqua -->
                <line x1="145" y1="105" x2="380" y2="200" stroke="#b45309" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'circumferencia'  , text: 'circumferència'  , px: 368, py: 225, lx:  96, ly:  20  },
                { id: 'radi'            , text: 'radi'            , px: 250, py: 107, lx:  82, ly:  67  },
                { id: 'diametre'        , text: 'diàmetre'        , px: 203, py: 148, lx:  55, ly: 313  },
                { id: 'corda'           , text: 'corda'           , px: 353, py: 188, lx: 410, ly:  76  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx: 409, ly: 302  }
            ]
        },

        // 3. TRIANGLE
        {
            id:  'triangle',
            nom: 'Triangle',
            dim: 2,
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
                { id: 'costat'          , text: 'costat'          , px: 195, py: 119, lx:  95, ly:  96  },
                { id: 'base'            , text: 'base'            , px: 219, py: 288, lx:  69, ly: 179  },
                { id: 'altura'          , text: 'altura'          , px: 249, py: 214, lx: 425, ly: 148  }
            ]
        },

        // 4. CERCLE
        {
            id:  'cercle',
            nom: 'Cercle',
            dim: 2,
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
                <!-- radi cap a dalt-dreta -->
                <line x1="250" y1="170" x2="352" y2="78" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- diàmetre inclinat ~25° (extrems sobre el cercle) -->
                <line x1="132" y1="115" x2="368" y2="225" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'cercle'          , text: 'cercle'          , px: 175, py: 240, lx: 110, ly:  26  },
                { id: 'radi'            , text: 'radi'            , px: 300, py: 124, lx: 416, ly: 289  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx:  73, ly: 270  },
                { id: 'diametre'        , text: 'diàmetre'        , px: 203, py: 148, lx:  55, ly:  85  }
            ]
        },

        // 5. PARAL·LELOGRAM
        {
            id:  'paralelogram',
            nom: 'Paral·lelogram',
            dim: 2,
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
            nom: 'Trapezi',
            dim: 2,
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
                { id: 'vertex'          , text: 'vèrtex'          , px: 330, py:  90, lx: 358, ly:  46  },
                { id: 'altura'          , text: 'altura'          , px: 215, py: 180, lx: 425, ly: 125  },
                { id: 'costat'          , text: 'costat'          , px: 120, py: 181, lx:  76, ly: 310  }
            ]
        },

        // 7. TRIANGLE RECTANGLE
        {
            id:  'triangle_rectangle',
            nom: 'Triangle rectangle',
            dim: 2,
            svg: `
                <polygon points="100,280 100,60 420,280" fill="#f0fdf4" stroke="#059669" stroke-width="2.5"/>
                <rect x="100" y="260" width="20" height="20" fill="none" stroke="#059669" stroke-width="2"/>
                <line x1="100" y1="60"  x2="420" y2="280" stroke="#059669" stroke-width="2.5"/>
                <circle cx="100" cy="280" r="5" fill="#059669"/>
                <circle cx="100" cy="60"  r="5" fill="#059669"/>
                <circle cx="420" cy="280" r="5" fill="#059669"/>
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
            nom: 'Pentàgon regular',
            dim: 2,
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
            nom: 'Hexàgon regular',
            dim: 2,
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
            nom: 'Cub',
            dim: 3,
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
            nom: 'Ortoedre',
            dim: 3,
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
                { id: 'vertex'          , text: 'vèrtex'          , px: 415, py: 119, lx: 433, ly:  29  },
                { id: 'aresta'          , text: 'aresta'          , px: 311, py: 174, lx: 342, ly:  76  },
                { id: 'cara'            , text: 'cara'            , px: 272, py: 144, lx: 177, ly:  76  },
                { id: 'amplada'         , text: 'amplada'         , px: 210, py: 315, lx: 177, ly: 257  },
                { id: 'altura'          , text: 'altura'          , px:  60, py: 235, lx: 144, ly: 202  },
                { id: 'profunditat'     , text: 'profunditat'     , px: 398, py: 278, lx: 320, ly: 218  }
            ]
        },

        // 12. PIRÀMIDE
        {
            id:  'piramide',
            nom: 'Piràmide',
            dim: 3,
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
                { id: 'aresta_lateral'  , text: 'aresta'  , px: 203, py: 180, lx:  72, ly: 103  },
                { id: 'cara_lateral'    , text: 'cara'    , px: 312, py: 166, lx: 403, ly:  95  },
                { id: 'base'            , text: 'base'            , px: 230, py: 276, lx:  96, ly: 319  },
                { id: 'altura'          , text: 'altura'          , px: 250, py: 208, lx: 431, ly: 262  }
            ]
        },

        // 13. CILINDRE
        {
            id:  'cilindre',
            nom: 'Cilindre',
            dim: 3,
            svg: `
                <rect x="110" y="90" width="280" height="180" fill="#f0f9ff" stroke="none"/>
                <line x1="110" y1="90"  x2="110" y2="270" stroke="#0369a1" stroke-width="2.5"/>
                <line x1="390" y1="90"  x2="390" y2="270" stroke="#0369a1" stroke-width="2.5"/>
                <ellipse cx="250" cy="270" rx="140" ry="32" fill="#dbeafe" stroke="#0369a1" stroke-width="2.5"/>
                <ellipse cx="250" cy="90"  rx="140" ry="32" fill="#dbeafe" stroke="#0369a1" stroke-width="2.5"/>
                <line x1="250" y1="90"  x2="390" y2="90"  stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <line x1="415" y1="90"  x2="415" y2="270" stroke="#d97706" stroke-width="1.5"/>
                <line x1="409" y1="90"  x2="421" y2="90"  stroke="#d97706" stroke-width="1.5"/>
                <line x1="409" y1="270" x2="421" y2="270" stroke="#d97706" stroke-width="1.5"/>
            `,
            etiquetes: [
                { id: 'cilindre'        , text: 'cilindre'        , px: 170, py: 200, lx: 101, ly:  28  },
                { id: 'base'            , text: 'base'            , px: 224, py: 276, lx:  90, ly: 314  },
                { id: 'cara_lateral'    , text: 'cara'    , px: 179, py: 159, lx:  99, ly: 138  },
                { id: 'alcada'          , text: 'alçada'          , px: 415, py: 182, lx: 379, ly: 321  },
                { id: 'radi'            , text: 'radi'            , px: 320, py:  90, lx: 325, ly:  29  }
            ]
        },

        // 14. CON
        {
            id:  'con',
            nom: 'Con',
            dim: 3,
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
                { id: 'base'            , text: 'base'            , px: 211, py: 291, lx:  73, ly: 140  },
                { id: 'altura'          , text: 'altura'          , px: 252, py: 185, lx: 435, ly: 180  },
                { id: 'radi'            , text: 'radi'            , px: 330, py: 280, lx: 438, ly: 322  }
            ]
        },

        // 15. ESFERA
        {
            id:  'esfera',
            nom: 'Esfera',
            dim: 3,
            svg: `
                <circle cx="250" cy="170" r="145" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
                <ellipse cx="250" cy="170" rx="145" ry="40"  fill="none" stroke="#d97706" stroke-width="1.8" stroke-dasharray="6 3"/>
                <ellipse cx="250" cy="170" rx="40"  ry="145" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 3"/>
                <line x1="250" y1="170" x2="352" y2="78" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'esfera'          , text: 'esfera'          , px: 250, py:  25, lx: 101, ly:  24  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx:  89, ly:  99  },
                { id: 'radi'            , text: 'radi'            , px: 325, py: 101, lx: 431, ly:  58  },
                { id: 'cercle_maxim'    , text: 'cercle màxim'    , px: 332, py: 202, lx: 431, ly: 286  }
            ]
        },

        // 16. QUADRAT
        {
            id:  'quadrat',
            nom: 'Quadrat',
            dim: 2,
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
                { id: 'costat'          , text: 'costat'          , px: 350, py: 170, lx: 431, ly: 226  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 350, py:  71, lx: 425, ly:  33  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 209, py: 208, lx:  92, ly: 142  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx: 249, ly: 312  }
            ]
        },

        // 17. ROMBE
        {
            id:  'rombe',
            nom: 'Rombe',
            dim: 2,
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
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx: 420, ly: 250  }
            ]
        },

        // 18. QUADRILÀTER (genèric, irregular)
        {
            id:  'quadrilater',
            nom: 'Quadrilàter',
            dim: 2,
            svg: `
                <polygon points="95,268 165,58 405,75 445,262" fill="#fdf4ff" stroke="#9333ea" stroke-width="2.5"/>
                <!-- diagonal A→C -->
                <line x1="95"  y1="268" x2="405" y2="75"  stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 4"/>
                <circle cx="95"  cy="268" r="5" fill="#9333ea"/>
                <circle cx="165" cy="58"  r="5" fill="#9333ea"/>
                <circle cx="405" cy="75"  r="5" fill="#9333ea"/>
                <circle cx="445" cy="262" r="5" fill="#9333ea"/>
            `,
            etiquetes: [
                { id: 'quadrilater'     , text: 'quadrilàter'     , px: 255, py: 165, lx: 108, ly:  26  },
                { id: 'vertex'          , text: 'vèrtex'          , px:  95, py: 268, lx:  55, ly: 315  },
                { id: 'costat'          , text: 'costat'          , px: 290, py:  75, lx: 340, ly:  37  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 220, py: 190, lx:  85, ly: 140  }
            ]
        },

        // 19. TETRAEDRE
        {
            id:  'tetraedre',
            nom: 'Tetraedre',
            dim: 3,
            svg: `
                <!-- Arestes ocultes (cap al vèrtex posterior de la base) -->
                <line x1="115" y1="285" x2="285" y2="195" stroke="#c2410c" stroke-width="1.5" stroke-dasharray="6 4"/>
                <line x1="395" y1="275" x2="285" y2="195" stroke="#c2410c" stroke-width="1.5" stroke-dasharray="6 4"/>
                <line x1="250" y1="42"  x2="285" y2="195" stroke="#c2410c" stroke-width="1.5" stroke-dasharray="6 4"/>

                <!-- Cara esquerra (la més clara) -->
                <polygon points="250,42 115,285 285,195"
                         fill="#fed7aa" fill-opacity="0.7" stroke="none"/>
                <!-- Cara dreta (la més fosca) -->
                <polygon points="250,42 395,275 285,195"
                         fill="#fb923c" fill-opacity="0.55" stroke="none"/>
                <!-- Cara frontal (mitja) -->
                <polygon points="250,42 115,285 395,275"
                         fill="#fdba74" fill-opacity="0.7" stroke="none"/>
                <!-- Base (translúcida, vista des de dalt) -->
                <polygon points="115,285 395,275 285,195"
                         fill="#fed7aa" fill-opacity="0.3" stroke="none"/>

                <!-- Arestes visibles (sòlides) -->
                <line x1="250" y1="42"  x2="115" y2="285" stroke="#c2410c" stroke-width="2.5"/>
                <line x1="250" y1="42"  x2="395" y2="275" stroke="#c2410c" stroke-width="2.5"/>
                <line x1="115" y1="285" x2="395" y2="275" stroke="#c2410c" stroke-width="2.5"/>

                <!-- Altura (del vèrtex al baricentre de la base) -->
                <line x1="250" y1="42" x2="265" y2="252" stroke="#c2410c" stroke-width="1.5" stroke-dasharray="4 3"/>
                <rect x="265" y="241" width="11" height="11" fill="none" stroke="#c2410c" stroke-width="1.3" transform="rotate(-3,270,246)"/>

                <!-- Vèrtexs -->
                <circle cx="250" cy="42"  r="5" fill="#c2410c"/>
                <circle cx="115" cy="285" r="4" fill="#c2410c"/>
                <circle cx="395" cy="275" r="4" fill="#c2410c"/>
                <circle cx="285" cy="195" r="4" fill="#c2410c" opacity="0.5"/>
                <circle cx="265" cy="252" r="3" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'tetraedre'       , text: 'tetraedre'       , px: 220, py: 200, lx: 110, ly:  26  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py:  41, lx: 381, ly:  41  },
                { id: 'aresta'          , text: 'aresta'          , px: 186, py: 157, lx:  70, ly: 105  },
                { id: 'cara'            , text: 'cara'            , px: 304, py: 162, lx: 415, ly: 135  },
                { id: 'base'            , text: 'base'            , px: 240, py: 252, lx: 100, ly: 319  },
                { id: 'altura'          , text: 'altura'          , px: 263, py: 219, lx: 339, ly: 322  }
            ]
        },

        // 19. EL·LIPSE
        {
            id:  'ellipse',
            nom: 'El·lipse',
            dim: 2,
            svg: `
                <ellipse cx="250" cy="170" rx="190" ry="120" fill="#f0fdf4" stroke="#059669" stroke-width="2.5"/>
                <!-- Eix major (horitzontal) -->
                <line x1="60"  y1="170" x2="440" y2="170" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- Eix menor (vertical) -->
                <line x1="250" y1="50"  x2="250" y2="290" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- Centre -->
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'ellipse'         , text: 'el·lipse'        , px: 350, py: 100, lx: 110, ly:  26  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx: 378, ly: 312  },
                { id: 'eix_major'       , text: 'eix major'       , px: 331, py: 170, lx: 414, ly:  44  },
                { id: 'eix_menor'       , text: 'eix menor'       , px: 250, py: 231, lx:  85, ly: 303  }
            ]
        },
        // 21. PRISMA TRIANGULAR
        {
            id:  'prisma_triangular',
            nom: 'Prisma triangular',
            dim: 3,
            svg: `
                <!-- Arestes ocultes -->
                <line x1="135" y1="295" x2="310" y2="240" stroke="#0e7490" stroke-width="1.5" stroke-dasharray="6 4"/>
                <line x1="310" y1="240" x2="310" y2="80"  stroke="#0e7490" stroke-width="1.5" stroke-dasharray="6 4"/>
                <line x1="310" y1="240" x2="450" y2="295" stroke="#0e7490" stroke-width="1.5" stroke-dasharray="6 4"/>

                <!-- Cara frontal (rectangle) -->
                <polygon points="135,295 450,295 450,135 135,135"
                         fill="#5eead4" fill-opacity="0.45" stroke="none"/>
                <!-- Cara lateral esquerra (rectangle inclinat) -->
                <polygon points="135,295 135,135 310,80 310,240"
                         fill="#2dd4bf" fill-opacity="0.55" stroke="none"/>
                <!-- Cara superior (rectangle inclinat) -->
                <polygon points="135,135 450,135 310,80"
                         fill="#a7f3d0" fill-opacity="0.55" stroke="none"/>
                <!-- Cara lateral dreta -->
                <polygon points="450,295 450,135 310,80 310,240"
                         fill="#14b8a6" fill-opacity="0.5" stroke="none"/>

                <!-- Arestes visibles (sòlides) -->
                <line x1="135" y1="295" x2="450" y2="295" stroke="#0f766e" stroke-width="2.8"/>
                <line x1="135" y1="295" x2="135" y2="135" stroke="#0f766e" stroke-width="2.8"/>
                <line x1="135" y1="135" x2="450" y2="135" stroke="#0f766e" stroke-width="2.8"/>
                <line x1="450" y1="295" x2="450" y2="135" stroke="#0f766e" stroke-width="2.8"/>
                <line x1="135" y1="135" x2="310" y2="80"  stroke="#0f766e" stroke-width="2.8"/>
                <line x1="450" y1="135" x2="310" y2="80"  stroke="#0f766e" stroke-width="2.8"/>

                <!-- Vèrtexs -->
                <circle cx="135" cy="295" r="4" fill="#0f766e"/>
                <circle cx="450" cy="295" r="4" fill="#0f766e"/>
                <circle cx="135" cy="135" r="4" fill="#0f766e"/>
                <circle cx="450" cy="135" r="4" fill="#0f766e"/>
                <circle cx="310" cy="80"  r="4" fill="#0f766e"/>
                <circle cx="310" cy="240" r="4" fill="#0f766e" opacity="0.5"/>
            `,
            etiquetes: [
                { id: 'prisma_triangular', text: 'prisma triangular', px: 300, py: 200, lx: 110, ly:  26  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 310, py:  80, lx: 329, ly:  39  },
                { id: 'aresta'          , text: 'aresta'          , px: 287, py: 135, lx:  81, ly:  95  },
                { id: 'cara_lateral'    , text: 'cara'    , px: 232, py: 175, lx: 106, ly: 227  },
                { id: 'base'            , text: 'base'            , px: 297, py: 274, lx: 329, ly: 319  },
                { id: 'altura'          , text: 'altura'          , px: 310, py: 180, lx: 430, ly:  80  }
            ]
        },

        // 22. PRISMA PENTAGONAL
        {
            id:  'prisma_pentagonal',
            nom: 'Prisma pentagonal',
            dim: 3,
            svg: `
                <!-- Bases pentagonals:
                     Top: t1(145,120) t2(355,120) t3(400,72) t4(250,38) t5(100,72)
                     Bot: b1(145,290) b2(355,290) b3(400,242) b4(250,208) b5(100,242) -->

                <!-- Arestes ocultes (base posterior inferior + vertical posterior) -->
                <line x1="400" y1="242" x2="250" y2="208" stroke="#b45309" stroke-width="1.5" stroke-dasharray="6 4"/>
                <line x1="250" y1="208" x2="100" y2="242" stroke="#b45309" stroke-width="1.5" stroke-dasharray="6 4"/>
                <line x1="250" y1="38"  x2="250" y2="208" stroke="#b45309" stroke-width="1.5" stroke-dasharray="6 4"/>

                <!-- Cara lateral esquerra (t5-t1-b1-b5) -->
                <polygon points="100,72 145,120 145,290 100,242"
                         fill="#fbbf24" fill-opacity="0.55" stroke="none"/>
                <!-- Cara frontal (t1-t2-b2-b1) -->
                <polygon points="145,120 355,120 355,290 145,290"
                         fill="#f59e0b" fill-opacity="0.6" stroke="none"/>
                <!-- Cara lateral dreta (t2-t3-b3-b2) -->
                <polygon points="355,120 400,72 400,242 355,290"
                         fill="#d97706" fill-opacity="0.55" stroke="none"/>
                <!-- Cara superior (pentàgon t1-t2-t3-t4-t5) -->
                <polygon points="145,120 355,120 400,72 250,38 100,72"
                         fill="#fcd34d" fill-opacity="0.6" stroke="none"/>

                <!-- Arestes visibles — base inferior -->
                <line x1="145" y1="290" x2="355" y2="290" stroke="#92400e" stroke-width="2.8"/>
                <line x1="355" y1="290" x2="400" y2="242" stroke="#92400e" stroke-width="2.8"/>
                <line x1="100" y1="242" x2="145" y2="290" stroke="#92400e" stroke-width="2.8"/>
                <!-- Arestes visibles — verticals -->
                <line x1="145" y1="290" x2="145" y2="120" stroke="#92400e" stroke-width="2.8"/>
                <line x1="355" y1="290" x2="355" y2="120" stroke="#92400e" stroke-width="2.8"/>
                <line x1="400" y1="242" x2="400" y2="72"  stroke="#92400e" stroke-width="2.8"/>
                <line x1="100" y1="242" x2="100" y2="72"  stroke="#92400e" stroke-width="2.8"/>
                <!-- Arestes visibles — pentàgon superior -->
                <line x1="145" y1="120" x2="355" y2="120" stroke="#92400e" stroke-width="2.8"/>
                <line x1="355" y1="120" x2="400" y2="72"  stroke="#92400e" stroke-width="2.8"/>
                <line x1="400" y1="72"  x2="250" y2="38"  stroke="#92400e" stroke-width="2.8"/>
                <line x1="250" y1="38"  x2="100" y2="72"  stroke="#92400e" stroke-width="2.8"/>
                <line x1="100" y1="72"  x2="145" y2="120" stroke="#92400e" stroke-width="2.8"/>

                <!-- Vèrtexs superiors -->
                <circle cx="145" cy="120" r="4" fill="#92400e"/>
                <circle cx="355" cy="120" r="4" fill="#92400e"/>
                <circle cx="400" cy="72"  r="4" fill="#92400e"/>
                <circle cx="250" cy="38"  r="4" fill="#92400e"/>
                <circle cx="100" cy="72"  r="4" fill="#92400e"/>
                <!-- Vèrtexs inferiors -->
                <circle cx="145" cy="290" r="4" fill="#92400e"/>
                <circle cx="355" cy="290" r="4" fill="#92400e"/>
                <circle cx="400" cy="242" r="4" fill="#92400e"/>
                <circle cx="250" cy="208" r="4" fill="#92400e" opacity="0.5"/>
                <circle cx="100" cy="242" r="4" fill="#92400e"/>
            `,
            etiquetes: [
                { id: 'prisma_pentagonal', text: 'prisma pentagonal', px: 260, py: 200, lx: 110, ly:  26  },
                { id: 'vertex'          , text: 'vèrtex'          , px:  99, py: 241, lx:  64, ly: 140  },
                { id: 'aresta'          , text: 'aresta'          , px: 146, py: 214, lx:  70, ly: 316  },
                { id: 'cara_lateral'    , text: 'cara'    , px: 380, py: 169, lx: 432, ly:  33  },
                { id: 'base'            , text: 'base'            , px: 236, py: 249, lx: 297, ly: 321  },
                { id: 'altura'          , text: 'altura'          , px: 250, py: 165, lx: 444, ly: 296  }
            ]
        }

    ];

    return { all: FIGURES };

})();
