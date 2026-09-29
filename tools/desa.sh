#!/usr/bin/env bash
# ============================================================================
# PROJECTE: Motor Educatiu Step Quiz
# FITXER: tools/desa.sh
# ROL: Desa els canvis fets al Codespace i els publica a GitHub, amb un
#      missatge que expliqui QUÈ s'ha canviat (en lloc de "Add files via upload").
#      Abans de desar: passa els tests, revisa el codi i ensenya la llista de
#      fitxers que canvien, i demana confirmació.
# ÚS (des de la carpeta del repositori):
#      tools/desa.sh "Fraccions: el feedback de la suma diu quin denominador cal"
# Explicació pas a pas: COM-TREBALLAR.md
# ============================================================================
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

vermell() { printf '\033[31m%s\033[0m\n' "$*"; }
verd() { printf '\033[32m%s\033[0m\n' "$*"; }
negreta() { printf '\033[1m%s\033[0m\n' "$*"; }
pregunta() { # pregunta "text" → 0 si la resposta és s/S
    local r
    read -r -p "$1 (s/n) " r
    [[ "$r" == "s" || "$r" == "S" ]]
}

MISSATGE="${1:-}"
if [[ -z "$MISSATGE" ]]; then
    vermell "Falta el missatge. Escriu què has canviat, entre cometes. Per exemple:"
    echo '  tools/desa.sh "Fraccions: el feedback de la suma diu quin denominador cal"'
    exit 1
fi
if (( ${#MISSATGE} < 10 )); then
    vermell "El missatge és massa curt. Explica què has canviat i on (mínim 10 lletres)."
    exit 1
fi

if [[ -z "$(git status --porcelain)" ]]; then
    verd "No hi ha cap canvi per desar."
    exit 0
fi

BRANCA="$(git rev-parse --abbrev-ref HEAD)"
LINT=tools/lint/node_modules/.bin

# 1. Format (només si les eines estan instal·lades: el Codespace les instal·la sol)
if [[ -x "$LINT/prettier" ]]; then
    negreta "1/4 Posant el codi en format (Prettier)…"
    "$LINT/prettier" --write . --log-level warn
else
    negreta "1/4 (Prettier no està instal·lat: per instal·lar-lo, npm ci --prefix tools/lint)"
fi

# 2. Tests i revisió
negreta "2/4 Comprovant que tot funciona (tests i revisió del codi)…"
ERRORS=0
if ! node tests/run-all.js > /tmp/stepquiz-tests.log 2>&1; then
    ERRORS=1
    grep -E "✗" /tmp/stepquiz-tests.log | head -20
    vermell "Hi ha tests que fallen (el detall és a /tmp/stepquiz-tests.log)."
fi
if [[ -x "$LINT/eslint" ]] && ! "$LINT/eslint" -c tools/lint/eslint.config.mjs . --quiet; then
    ERRORS=1
    vermell "ESLint ha trobat errors (llistats a sobre)."
fi
if (( ERRORS )); then
    echo "Si els desa així, GitHub mostrarà una ✗ vermella al costat del canvi."
    pregunta "Vols desar-los igualment?" || { echo "No s'ha desat res."; exit 1; }
else
    verd "   Tot correcte."
fi

# 3. Què canvia
negreta "3/4 Aquests són els fitxers que canvien:"
git status --short
echo "   (M = modificat, ?? = nou, D = esborrat)"
pregunta "Els vols desar amb el missatge «$MISSATGE»?" || { echo "No s'ha desat res."; exit 1; }
git add -A
git commit -q -m "$MISSATGE" || { vermell "No s'ha pogut fer el commit."; exit 1; }
DESAT="$(git log -1 --format='%h %s')"

# 4. Publicar
negreta "4/4 Publicant a GitHub (branca $BRANCA)…"
if ! git pull -q --no-edit --no-rebase origin "$BRANCA"; then
    vermell "No s'han pogut ajuntar els teus canvis amb els que ja hi havia a GitHub"
    vermell "(algú ha canviat les mateixes línies). El teu canvi està desat aquí però NO publicat."
    echo "Per deixar-ho com estava abans d'aquest intent:  git merge --abort"
    echo "Després explica-ho a Claude i enganxa-li el que surt amb:  git status"
    exit 1
fi
if ! git push -q origin "$BRANCA"; then
    vermell "No s'ha pogut publicar a GitHub. El canvi està desat aquí; torna-ho a provar amb: git push"
    exit 1
fi
verd "Fet! Canvi publicat: $DESAT"
echo "D'aquí a un parell de minuts es veurà a step-quiz.net."
