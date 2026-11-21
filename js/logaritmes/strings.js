/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/logaritmes/strings.js
 * ROL: Textos de «Logaritmes i equacions» (logaritmes.html): consignes dels passos
 *      (fórmules entre $…$) i el perquè de cada error. Bloc 1, logaritmes (TEXTOS_LG,
 *      ERRORS_LG); bloc 2, equacions exponencials, logarítmiques i irracionals
 *      (TEXTOS_EQ, ERRORS_EQ).
 * ============================================================================
 */

export const TEXTOS_LG = {
    element: 'Exercici',
    enunciat: {
        potencia: (b, x) => `Escriu $${x}$ com a potència de $${b}$.`,
        valor: 'Ara, el logaritme: l’exponent al qual cal elevar la base per obtenir l’argument.',
        aExponencial: 'Escriu la igualtat en forma exponencial: $\\log_a x = y \\iff a^{y} = x$.',
        aLogaritmica: 'Escriu la igualtat en forma logarítmica: $a^{y} = x \\iff \\log_a x = y$.',
        desenvolupa: 'Desenvolupa el logaritme amb les propietats.',
        agrupa: 'Escriu-ho com un sol logaritme.',
        agrupaCalcul: 'Primer, escriu-ho com un sol logaritme.',
        valorCalcul: 'Quant val?',
        signe: 'Sense calcular-lo: aquest logaritme és positiu o negatiu?',
        calculadora: 'Calcula’l amb la calculadora (4 decimals).',
    },
    nomPas: {
        potencia: 'potència',
        valor: 'logaritme',
        forma: 'forma',
        propietats: 'propietats',
        agrupa: 'un sol logaritme',
        valorCalcul: 'valor',
        signe: 'signe',
        calculadora: 'calculadora',
    },
    nota: {
        racional: 'Si és una fracció, escriu-la a dalt i a baix; si és un enter, deixa el denominador en blanc.',
        decimals: 'Amb 4 decimals i coma: 0,69897 → 0,6990.',
    },
    opcions: { positiu: 'Positiu', negatiu: 'Negatiu' },
};

export const ERRORS_LG = {
    LG_SIGNE: {
        etiqueta: 'signe de l’exponent',
        missatge:
            'Un nombre més petit que 1 (com 1/9 o 0,01) és una potència d’exponent negatiu: 1/9 = 3⁻², 0,01 = 10⁻².',
    },
    LG_INVERS: {
        etiqueta: 'exponent invertit',
        missatge:
            'Mira quina és la base: si 4 = 2², llavors 2 = 4^(1/2). Escriu l’argument com a potència de la base, no al revés.',
    },
    LG_DIVIDEIX: {
        etiqueta: 'argument dividit per la base',
        missatge: 'El logaritme no és una divisió: log₂ 8 = 3 perquè 2³ = 8 (no 8 : 2).',
    },
    LG_ARGUMENT: {
        etiqueta: 'l’argument com a resultat',
        missatge: 'El logaritme és l’exponent: logₐ x = y vol dir aʸ = x. La resposta és y, no x.',
    },
    LG_DEFINICIO: {
        etiqueta: 'definició',
        missatge: 'logₐ x = y ⟺ aʸ = x: busca a quin exponent cal elevar la base per obtenir l’argument.',
    },
    LG_FORMA: {
        etiqueta: 'base i exponent intercanviats',
        missatge: 'La base del logaritme és la base de la potència: logₐ x = y ⟺ aʸ = x.',
    },
    LG_FORMA_ALTRE: {
        etiqueta: 'forma',
        missatge:
            'logₐ x = y ⟺ aʸ = x: la base es queda, el resultat del logaritme és l’exponent i l’argument és el resultat de la potència.',
    },
    LG_SUMA: {
        etiqueta: 'log(a + b) = log a + log b',
        missatge:
            'No hi ha cap propietat per al logaritme d’una suma: log(a·b) = log a + log b, però log(a + b) no es pot separar.',
    },
    LG_RESTA: {
        etiqueta: 'log(a − b) = log a − log b',
        missatge: 'La resta de logaritmes és el logaritme d’un quocient: log a − log b = log(a/b), no log(a − b).',
    },
    LG_PRODUCTE_LOGS: {
        etiqueta: 'log(a·b) = log a · log b',
        missatge: 'El logaritme d’un producte és la suma dels logaritmes: log(a·b) = log a + log b (no el producte).',
    },
    LG_QUOCIENT_LOGS: {
        etiqueta: 'log(a/b) = log a / log b',
        missatge: 'El logaritme d’un quocient és la resta: log(a/b) = log a − log b (no la divisió de logaritmes).',
    },
    LG_POTENCIA: {
        etiqueta: 'log aⁿ = (log a)ⁿ',
        missatge: 'L’exponent baixa multiplicant: log aⁿ = n·log a. (log a)ⁿ és una altra cosa.',
    },
    LG_QUOCIENT_SIGNE: {
        etiqueta: 'el denominador amb +',
        missatge: 'El que divideix resta: log(a/b) = log a − log b.',
    },
    LG_COEF: {
        etiqueta: 'el coeficient multiplica l’argument',
        missatge: 'Un nombre davant del logaritme és un exponent de l’argument: n·log a = log aⁿ (no log(n·a)).',
    },
    LG_ORDRE: {
        etiqueta: 'quocient a l’inrevés',
        missatge: 'log a − log b = log(a/b): el que resta va a baix.',
    },
    LG_VALOR: {
        etiqueta: 'valor del logaritme',
        missatge: 'Ara només cal la definició: busca l’exponent al qual cal elevar la base per obtenir l’argument.',
    },
    LG_SIGNE_CALC: {
        etiqueta: 'signe del logaritme',
        missatge:
            'Si la base és més gran que 1, el logaritme d’un nombre més gran que 1 és positiu i el d’un nombre entre 0 i 1, negatiu.',
    },
    LG_LN_LOG: {
        etiqueta: 'ln en lloc de log (o al revés)',
        missatge: 'log és el logaritme en base 10 (tecla log) i ln, el neperià, en base e (tecla ln).',
    },
    LG_CALC: {
        etiqueta: 'calculadora',
        missatge: 'Torna-ho a calcular amb la tecla que toca (log o ln) i arrodoneix a 4 decimals.',
    },
};

// ═════════════════════════════════════════════════════════════════════════════
// BLOC 2: EQUACIONS (lliurament 22b)
// ═════════════════════════════════════════════════════════════════════════════
export const TEXTOS_EQ = {
    subtitol: 'Equacions exponencials, logarítmiques i irracionals',
    que: 'Resol',
    enunciat: {
        mateixaBase: a => `Escriu els dos membres com a potències de base $${a}$.`,
        igualaExponents: 'Les bases són iguals: iguala els exponents i resol.',
        treuLog: 'Passa de la forma logarítmica a l’exponencial ($\\log_b A = m \\iff A = b^{m}$).',
        primerGrau: 'Resol l’equació de primer grau.',
        prenLogs: 'La incògnita és a l’exponent i no hi ha manera d’igualar les bases: pren logaritmes.',
        calculadora: 'Aïlla la $x$ i calcula-la amb la calculadora (4 decimals).',
        canvi: (a, tAx) => `Fes el canvi de variable $t = ${a}^{x}$ (llavors $${tAx}$). Quina equació en $t$ surt?`,
        arrelsT: eq => `Resol l’equació de segon grau: $${eq}$.`,
        desfesCanvi: a => `Desfés el canvi: $${a}^{x} = t$ per a cada valor de $t$. Quines solucions té l’equació?`,
        unLog: 'Agrupa el primer membre en un sol logaritme i passa a la forma exponencial.',
        arrels: eq => `Passa-ho tot a un costat i resol: $${eq}$.`,
        eleva: 'Eleva al quadrat els dos membres (l’arrel ja està aïllada).',
        comprova: (x, eq) => `Comprova $x = ${x}$: substitueix-la a l’equació inicial, $${eq}$. És solució?`,
    },
    nomPas: {
        mateixaBase: 'mateixa base',
        exponents: 'exponents',
        treuLog: 'forma exponencial',
        primerGrau: 'x',
        prenLogs: 'logaritmes',
        calculadora: 'calculadora',
        canvi: 'canvi de variable',
        arrelsT: 'valors de t',
        desfesCanvi: 'solucions',
        unLog: 'un sol logaritme',
        arrels: 'segon grau',
        eleva: 'al quadrat',
        comprova: 'comprovació',
    },
    nota: {
        racional: 'Si és una fracció, escriu-la a dalt i a baix; si és un enter, deixa el denominador en blanc.',
        decimals: 'Amb 4 decimals i coma: 2,80735 → 2,8074.',
        dues: 'Les dues solucions, en qualsevol ordre.',
    },
    opcions: {
        si: 'Sí, és solució',
        noLog: 'No: surt el logaritme d’un nombre negatiu (o de zero)',
        noIguals: 'No: en substituir, els dos membres no són iguals',
        noRadicand: 'No: el radicand surt negatiu',
        noSegon: 'No: l’arrel és positiva i el segon membre surt negatiu',
        capSolucio: 'No té cap solució',
    },
    solucio: 'Solució',
    noTeSolucio: 'no té solució',
};

export const ERRORS_EQ = {
    EQ_EXPONENT_SENSE_BASE: {
        etiqueta: 'exponents igualats sense la mateixa base',
        missatge:
            'Només es poden igualar els exponents quan les dues potències tenen la mateixa base: primer escriu el segon membre com a potència d’aquesta base (8 = 2³).',
    },
    EQ_POTENCIA_DE_POTENCIA: {
        etiqueta: 'potència d’una potència',
        missatge: 'Si 4 = 2², llavors 4ˣ⁺¹ = (2²)ˣ⁺¹ = 2²⁽ˣ⁺¹⁾ = 2²ˣ⁺²: l’exponent 2 multiplica tot l’exponent.',
    },
    EQ_SIGNE_EXPONENT: {
        etiqueta: 'signe de l’exponent',
        missatge: 'Un nombre entre 0 i 1 és una potència d’exponent negatiu: 1/8 = 2⁻³.',
    },
    EQ_PRIMER_GRAU: {
        etiqueta: 'equació de primer grau',
        missatge:
            'Revisa l’equació de primer grau: passa els termes sense x a l’altre membre i divideix pel coeficient.',
    },
    EQ_LOG_PRODUCTE: {
        etiqueta: 'logₐ A = m ⟹ A = m·a',
        missatge: 'logₐ A = m vol dir aᵐ = A: la base elevada al resultat (log₂ A = 3 ⟹ A = 2³ = 8, no 3·2).',
    },
    EQ_BASE_EXPONENT: {
        etiqueta: 'base i exponent intercanviats',
        missatge:
            'logₐ A = m vol dir A = aᵐ: la base del logaritme és la base de la potència (log₂ A = 3 ⟹ A = 2³, no 3²).',
    },
    EQ_TREU_LOG: {
        etiqueta: 'el logaritme desapareix',
        missatge: 'No es pot «treure» el logaritme sense més: logₐ A = m ⟺ A = aᵐ.',
    },
    EQ_LOG_SUMA: {
        etiqueta: 'log A + log B = log(A + B)',
        missatge:
            'La suma de logaritmes és el logaritme del producte: log A + log B = log(A·B). El logaritme d’una suma no es pot separar.',
    },
    EQ_LOG_QUOCIENT: {
        etiqueta: 'log N / log a = log N − log a',
        missatge:
            'Prenent logaritmes, aˣ = N ⟹ x·log a = log N ⟹ x = log N / log a: és un quocient de logaritmes, no el logaritme d’un quocient.',
    },
    EQ_DIVIDEIX: {
        etiqueta: 'aˣ = N ⟹ x = N/a',
        missatge: 'La x és un exponent, no un factor: aˣ no és a·x. Cal prendre logaritmes: x·log a = log N.',
    },
    EQ_INVERS: {
        etiqueta: 'quocient a l’inrevés',
        missatge: 'x·log a = log N ⟹ x = log N / log a: el logaritme de la base va a baix.',
    },
    EQ_CALC: {
        etiqueta: 'calculadora',
        missatge:
            'x = log N / log a: calcula els dos logaritmes amb la calculadora, divideix-los i arrodoneix a 4 decimals.',
    },
    EQ_CANVI_DOBLE: {
        etiqueta: 'a²ˣ = 2·aˣ',
        missatge: 'a²ˣ = (aˣ)² = t²: l’exponent 2 eleva al quadrat, no multiplica per 2.',
    },
    EQ_CANVI: {
        etiqueta: 'el canvi de variable',
        missatge: 'Amb t = aˣ, cada aˣ es canvia per t i a²ˣ = (aˣ)² per t²; els nombres sols no canvien.',
    },
    EQ_SIGNE_ARRELS: {
        etiqueta: 'signe de les solucions',
        missatge: 'Les solucions de x² + Bx + C = 0 sumen −B: comprova el signe (substitueix-les a l’equació).',
    },
    EQ_SEGON_GRAU: {
        etiqueta: 'equació de segon grau',
        missatge: 'Revisa l’equació de segon grau: x = (−B ± √(B² − 4C)) / 2. Comprova cada solució substituint-la.',
    },
    EQ_T_ES_X: {
        etiqueta: 't en lloc de x',
        missatge: 'Els valors de t encara no són les solucions: cal desfer el canvi, aˣ = t, i trobar la x.',
    },
    EQ_T_NEGATIU: {
        etiqueta: 'aˣ = t amb t ≤ 0',
        missatge:
            'Una potència de base positiva sempre és positiva: aˣ = t no té solució si t ≤ 0. Aquest valor de t es descarta.',
    },
    EQ_BONA_DESCARTADA: {
        etiqueta: 'solució bona descartada',
        missatge: 'Aquesta sí que és solució: en substituir-la, tot existeix i els dos membres són iguals.',
    },
    EQ_FALSA: {
        etiqueta: 'solució falsa acceptada',
        missatge:
            'En elevar al quadrat o en agrupar els logaritmes poden aparèixer solucions falses: substitueix-la a l’equació inicial i mira si tot existeix i si es compleix.',
    },
    EQ_MOTIU: {
        etiqueta: 'per què no és solució',
        missatge: 'No és solució, però per un altre motiu: substitueix-la a l’equació inicial i mira què falla.',
    },
    EQ_QUADRAT_BINOMI: {
        etiqueta: '(x + c)² = x² + c²',
        missatge: 'El quadrat d’una suma té tres termes: (x + c)² = x² + 2cx + c². No t’oblidis del doble producte.',
    },
    EQ_QUADRAT_SIGNE: {
        etiqueta: 'signe del doble producte',
        missatge: '(x + c)² = x² + 2cx + c²: el doble producte té el signe de c.',
    },
    EQ_RADICAND: {
        etiqueta: 'radicand elevat al quadrat',
        missatge: '(√A)² = A: en elevar l’arrel al quadrat, l’arrel desapareix i el radicand queda igual.',
    },
};
