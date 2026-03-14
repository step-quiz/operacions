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
                { id: 'angle'           , text: 'angle'           , px: 242, py: 250, lx: 114, ly:  32  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 150, py: 280, lx:  90, ly: 235  },
                { id: 'raig'            , text: 'raig'            , px: 285, py: 190, lx: 364, ly:  59  },
                { id: 'arc'             , text: 'arc'             , px: 220, py: 263, lx: 178, ly: 131  }
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
                { id: 'paralelogram'    , text: 'paral·lelogram'  , px: 250, py: 170, lx:  99, ly:  25  },
                { id: 'costat'          , text: 'costat'          , px: 338, py: 160, lx: 434, ly: 230  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 227, py: 125, lx:  96, ly: 105  },
                { id: 'altura'          , text: 'altura'          , px: 265, py: 232, lx: 146, ly: 309  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 370, py:  71, lx: 434, ly:  29  }
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
                { id: 'trapezi'         , text: 'trapezi'         , px: 250, py: 200, lx: 108, ly:  24  },
                { id: 'base'            , text: 'base'            , px: 270, py: 270, lx: 338, ly: 309  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 330, py:  90, lx: 420, ly:  63  },
                { id: 'altura'          , text: 'altura'          , px: 215, py: 180, lx: 428, ly: 119  },
                { id: 'costat'          , text: 'costat'          , px: 120, py: 181, lx:  76, ly: 310  }
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
                { id: 'segment'         , text: 'segment'         , px: 160, py: 170, lx: 112, ly:  29  },
                { id: 'extrem'          , text: 'extrem'          , px:  80, py: 170, lx:  68, ly: 115  },
                { id: 'punt_mig'        , text: 'punt mig'        , px: 250, py: 170, lx: 309, ly:  46  },
                { id: 'recta'           , text: 'recta'           , px: 459, py: 164, lx: 400, ly: 103  }
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
                { id: 'triangle_rectangle', text: 'triangle rectangle', px: 200, py: 200, lx: 110, ly:  26  },
                { id: 'angle_recte'     , text: 'angle recte'     , px: 110, py: 268, lx:  84, ly: 314  },
                { id: 'hipotenusa'      , text: 'hipotenusa'      , px: 260, py: 170, lx: 330, ly: 130  },
                { id: 'catet_contigu'   , text: 'catet'           , px: 100, py: 187, lx: 236, ly: 315  },
                { id: 'catet_oposat'    , text: 'catet'           , px: 326, py: 279, lx: 398, ly: 192  }
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
                { id: 'pentagono'       , text: 'pentàgon'        , px: 300, py: 200, lx: 106, ly:  22  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py:  55, lx: 114, ly:  77  },
                { id: 'costat'          , text: 'costat'          , px: 349, py: 184, lx: 412, ly: 245  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 175, lx:  82, ly: 219  },
                { id: 'apotema'         , text: 'apotema'         , px: 250, py: 224, lx: 312, ly: 319  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 285, py: 164, lx: 411, ly:  58  }
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
                { id: 'hexagono'        , text: 'hexàgon'         , px: 200, py: 130, lx: 106, ly:  28  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 354, py: 110, lx: 398, ly:  41  },
                { id: 'costat'          , text: 'costat'          , px: 306, py: 257, lx: 413, ly: 315  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx:  66, ly: 140  },
                { id: 'apotema'         , text: 'apotema'         , px: 302, py: 170, lx: 432, ly: 213  },
                { id: 'diagonal'        , text: 'diagonal'        , px: 294, py: 194, lx: 109, ly: 306  }
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
                { id: 'cub'             , text: 'cub'             , px: 190, py: 230, lx: 108, ly:  25  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 240, py: 160, lx: 431, ly: 116  },
                { id: 'aresta'          , text: 'aresta'          , px: 162, py: 160, lx: 218, ly:  68  },
                { id: 'cara'            , text: 'cara'            , px: 170, py: 230, lx: 395, ly: 291  }
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

        // 14. PIRÀMIDE
        {
            id:  'piramide',
            nom: 'Piràmide',
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
                { id: 'cilindre'        , text: 'cilindre'        , px: 170, py: 200, lx: 101, ly:  28  },
                { id: 'base'            , text: 'base'            , px: 224, py: 276, lx:  90, ly: 314  },
                { id: 'cara_lateral'    , text: 'cara lateral'    , px: 179, py: 159, lx:  99, ly: 138  },
                { id: 'alcada'          , text: 'alçada'          , px: 415, py: 182, lx: 379, ly: 321  },
                { id: 'radi'            , text: 'radi'            , px: 320, py:  90, lx: 325, ly:  29  },
                { id: 'eix'             , text: 'eix'             , px: 250, py: 150, lx: 179, ly: 209  }
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
                { id: 'con'             , text: 'con'             , px: 185, py: 220, lx:  98, ly:  31  },
                { id: 'vertex'          , text: 'vèrtex'          , px: 250, py:  50, lx: 377, ly:  30  },
                { id: 'generatriu'      , text: 'generatriu'      , px: 316, py: 144, lx: 410, ly: 117  },
                { id: 'base'            , text: 'base'            , px: 203, py: 281, lx:  73, ly: 140  },
                { id: 'altura'          , text: 'altura'          , px: 252, py: 185, lx: 435, ly: 180  },
                { id: 'radi'            , text: 'radi'            , px: 330, py: 280, lx: 438, ly: 322  }
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
                { id: 'esfera'          , text: 'esfera'          , px: 250, py:  25, lx: 101, ly:  24  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx:  65, ly: 275  },
                { id: 'radi'            , text: 'radi'            , px: 301, py: 124, lx: 430, ly: 301  },
                { id: 'cercle_maxim'    , text: 'cercle màxim'    , px: 358, py: 143, lx: 428, ly:  44  }
            ]
        },

        // 18. QUADRAT
        {
            id:  'quadrat',
            nom: 'Quadrat',
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

        // 19. ROMBE
        {
            id:  'rombe',
            nom: 'Rombe',
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

        // 20. TETRAEDRE
        {
            id:  'tetraedre',
            nom: 'Tetraedre',
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

        // 21. EL·LIPSE
        {
            id:  'ellipse',
            nom: 'El·lipse',
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

        // 22. TORUS
        {
            id:  'torus',
            nom: 'Torus',
            svg: `
                <!-- Cos del torus (el·lipse exterior) -->
                <ellipse cx="250" cy="170" rx="185" ry="100" fill="#fce7f3" stroke="#db2777" stroke-width="2.5"/>
                <!-- Forat interior (fons blanc per simular el buit) -->
                <ellipse cx="250" cy="155" rx="70" ry="28" fill="white" stroke="none"/>
                <!-- Vora frontal del forat -->
                <path d="M 180,155 A 70,28 0 0,0 320,155" fill="none" stroke="#db2777" stroke-width="2.5"/>
                <!-- Vora posterior del forat (oculta) -->
                <path d="M 180,155 A 70,28 0 0,1 320,155" fill="none" stroke="#db2777" stroke-width="1.5" stroke-dasharray="5 3"/>
                <!-- Secció transversal (dreta, suggereix el tub) -->
                <ellipse cx="378" cy="170" rx="6" ry="55" fill="#fbb6ce" fill-opacity="0.5"
                         stroke="#db2777" stroke-width="1.5" stroke-dasharray="4 3"/>
                <circle cx="378" cy="170" r="3" fill="#7c3aed"/>
                <!-- Radi major R: centre del torus al centre del tub -->
                <line x1="250" y1="170" x2="378" y2="170" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- Radi menor r: centre del tub a la vora del tub -->
                <line x1="378" y1="170" x2="378" y2="115" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 3"/>
                <!-- Centre -->
                <circle cx="250" cy="170" r="4.5" fill="#334155"/>
            `,
            etiquetes: [
                { id: 'torus'           , text: 'torus'           , px: 150, py: 110, lx: 110, ly:  26  },
                { id: 'centre'          , text: 'centre'          , px: 250, py: 170, lx:  70, ly: 280  },
                { id: 'radi_major'      , text: 'radi major'      , px: 314, py: 170, lx: 130, ly: 310  },
                { id: 'radi_menor'      , text: 'radi menor'      , px: 378, py: 142, lx: 430, ly:  60  }
            ]
        }

    ];

    return { all: FIGURES };

})();
