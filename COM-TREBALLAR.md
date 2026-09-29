# Com treballar amb el repositori

Guia pas a pas per fer canvis al web **sense perdre el fil** de què s'ha canviat. Les ordres de dins els requadres grisos es poden copiar i enganxar tal qual.

## Per què

Fins ara els canvis arribaven com a fitxers pujats per la web de GitHub, amb el missatge automàtic *«Add files via upload»*, sovint des d'un zip. Així, a l'historial:

- no es veu **què** ha canviat ni **per què**;
- és difícil **desfer** un canvi concret si alguna cosa s'espatlla.

La idea és senzilla: **cada canvi amb un missatge que expliqui què fa**. A GitHub, a la pestanya **Commits**, es veurà l'historial com una llista llegible. Qualsevol canvi s'hi pot consultar línia per línia i desfer amb una sola ordre.

## Tres maneres de fer un canvi

| Quan | Com |
|------|-----|
| Un canvi que em demanes a mi (Claude) | Jo preparo una *pull request*; tu només l'has de fusionar (vegeu [Les pull requests de Claude](#les-pull-requests-de-claude)). |
| Un canvi petit (un text, una xifra) | Directament a la web de GitHub (vegeu [Des de la web](#des-de-la-web-de-github)). |
| Canvis més grans, diversos fitxers o un pegat en zip | Amb el **Codespace** (vegeu [El Codespace](#el-codespace)). |

---

## Des de la web de GitHub

**Editar un fitxer**

1. Obre el fitxer a GitHub i clica el llapis ✏️ (a dalt a la dreta).
2. Fes el canvi.
3. Clica el botó verd **Commit changes…**.
4. Al quadre **Commit message**, esborra el text proposat i **escriu què has canviat**, per exemple: `Fraccions: corregit l'enunciat del nivell 2`.
5. Deixa marcat *Commit directly to the main branch* i clica **Commit changes**.

**Pujar fitxers**

Fes **Add file → Upload files** i, abans de clicar **Commit changes**, escriu també aquí el missatge al primer quadre. Evita deixar-hi *«Add files via upload»*.

---

## El Codespace

Un Codespace és un ordinador al núvol, amb un editor (VS Code) dins del navegador, que ja té el repositori a dins. Té dues parts que farem servir:

- **L'explorador de fitxers**, a l'esquerra.
- **El terminal**, a baix: és on s'escriuen (o s'enganxen) les ordres. Si no el veus, menú ☰ → **Terminal → New Terminal**.

### Obrir-lo

1. Ves a <https://github.com/step-quiz/operacions>.
2. Botó verd **Code** → pestanya **Codespaces**.
3. La primera vegada: **Create codespace on main**. Les altres vegades: clica el nom del codespace que ja tens.

La primera vegada triga un parell de minuts, perquè instal·la les eines. Quan acaba, s'engega sol un **servidor de prova** en un terminal que es diu *servidor*.

> **Si ja tenies un Codespace creat abans d'aquesta guia**, no té encara la configuració nova (el servidor automàtic i les eines). Per posar-la-hi: tecla **F1** → escriu `Rebuild Container` → **Codespaces: Rebuild Container**. Abans, publica els canvis que hi tinguis pendents, si n'hi ha.

### Veure les activitats mentre les canvies

Quan el servidor s'engega, a baix a la dreta surt un avís: *«Your application running on port 8000 is available»*. Clica **Open in Browser** i s'obrirà el web en una pestanya nova.

- Si no veus l'avís: pestanya **PORTS** (a la part de baix) → fila del port **8000** → icona del globus 🌐.
- Si el servidor no està engegat, escriu al terminal:
  ```
  node tools/servidor.js
  ```
  (Per aturar-lo: `Ctrl+C`.)

Cada vegada que desis un fitxer, torna a carregar la pestanya del web (`F5`) i veuràs el canvi.

### Abans de començar a treballar (cada vegada)

Porta al Codespace els canvis que hi hagi a GitHub (per exemple, les *pull requests* que has fusionat):

```
git checkout main
git pull
```

### Fer els canvis

- **Editar**: obre el fitxer a l'explorador de l'esquerra, fes el canvi i desa'l amb `Ctrl+S`.
- **Un pegat en zip**: arrossega el fitxer `.zip` a l'explorador de l'esquerra (a sota de tot, fora de qualsevol carpeta). Mira què conté:
  ```
  unzip -l nom-del-pegat.zip
  ```
  Si els camins que surten són com `js/fraccions/fraccions.js` o `fraccions.html` (sense cap carpeta al davant), descomprimeix-lo sobre el repositori i esborra el zip:
  ```
  unzip -o nom-del-pegat.zip
  rm nom-del-pegat.zip
  ```
  Si hi ha una carpeta al davant (per exemple `operacions/js/…`), no el descomprimeixis: pregunta-m'ho. (El `.zip` mai no es publica, encara que te l'oblidis: està a `.gitignore`.)

### Desar i publicar: `tools/desa.sh`

Quan el canvi funcioni, escriu al terminal (amb el teu missatge entre cometes):

```
tools/desa.sh "Fraccions: el feedback de la suma diu quin denominador cal"
```

L'script fa quatre passos:

1. Posa el codi en el format del projecte (Prettier).
2. Passa **tots els tests** i la revisió del codi. Si alguna cosa falla, t'ho diu i et pregunta si vols desar igualment.
3. T'ensenya la **llista de fitxers** que canvien i et demana confirmació: respon `s` (sí) o `n` (no) i prem Enter.
4. Ho **publica** a GitHub. Al cap d'un parell de minuts es veu a step-quiz.net.

**Bons missatges** (què + on):

- `Fraccions: el feedback de la suma diu quin denominador cal`
- `Índex: afegeix l'enllaç a l'activitat de radicals`
- `Enters: el nivell 3 arriba fins a 20`

**Missatges que no ajuden**: `canvis`, `arreglat`, `Add files via upload`.

### Veure què has canviat

| Per veure… | Ordre |
|---|---|
| quins fitxers has canviat i encara no has desat | `git status` |
| les línies exactes que has canviat (surt amb la tecla `q`) | `git diff` |
| els últims canvis desats | `git log --oneline -15` |

A GitHub, la pestanya **Commits** mostra el mateix historial, i clicant un canvi es veuen les línies en verd (afegides) i vermell (tretes).

### Desfer

**Un canvi que encara no has desat** (torna el fitxer com estava):

```
git restore nom-del-fitxer.html
```

**Un canvi ja publicat**: busca'n el codi (les 7 lletres del principi) amb `git log --oneline -15`, i després (canviant `1a2b3c4` pel codi):

```
git revert --no-edit 1a2b3c4
git push
```

Això crea un canvi nou que desfà l'antic, de manera que l'historial queda sencer.

### Si alguna cosa surt malament

- **L'script diu que no ha pogut ajuntar els canvis** (algú, o una *pull request*, ha canviat les mateixes línies): escriu `git merge --abort` i demana-m'ho enganxant el que surt amb `git status`.
- **Et surt una pantalla estranya plena de `~`**: és l'editor *vim*. Escriu `:q` i prem Enter per sortir.
- **Qualsevol altre missatge d'error**: copia'l sencer i enganxa'l a la conversa amb mi.

### En acabar

No cal tancar res: el Codespace s'atura sol al cap d'una estona sense fer-lo servir. Recorda, però, que **el que no hagis publicat amb `tools/desa.sh` només és al Codespace**, i GitHub esborra els Codespaces que fa setmanes que no s'obren.

---

## Les pull requests de Claude

Quan et faig una *pull request*, et passo l'enllaç.

1. **Provar-la abans de fusionar** (opcional): a la *pull request*, pestanya **Checks** → **Cloudflare Pages**. Hi ha l'enllaç **Preview URL**: és el web amb els canvis, però encara no a step-quiz.net.
2. **Fusionar-la**: pestanya **Conversation**, a baix de tot → **Merge pull request** → **Confirm merge**.
3. Si tens el Codespace obert, porta-hi els canvis:
   ```
   git checkout main
   git pull
   ```
