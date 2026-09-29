# tools/lint — revisió i format del codi

Eines de desenvolupament. **El web no les fa servir**: només GitHub (a la revisió automàtica) i qui programa.

| Eina | Què fa | Configuració |
|------|--------|--------------|
| **ESLint** | Busca errors al JavaScript: variables no definides, codi que no s'executa mai, claus repetides… | `tools/lint/eslint.config.mjs` |
| **Prettier** | Deixa el codi de `js/`, `css/` i `tests/` amb el mateix format (sagnat, cometes, salts de línia) | `.prettierrc.json` i `.prettierignore` (a l'arrel) |

Són en aquesta carpeta, i no a l'arrel, perquè un `package.json` a l'arrel faria que Cloudflare Pages intentés instal·lar paquets en cada publicació.

## Ús (des de l'arrel del repositori)

```
npm ci --prefix tools/lint                                            # instal·lar (un sol cop)
tools/lint/node_modules/.bin/eslint -c tools/lint/eslint.config.mjs .  # revisar
tools/lint/node_modules/.bin/prettier --write .                        # formatar
tools/lint/node_modules/.bin/prettier --check .                        # comprovar el format
```

## A GitHub

- ESLint s'executa a cada pujada a `main` i a cada pull request. Els **errors** fan sortir la ✗ vermella; els **avisos** (p. ex. una variable que no es fa servir) no.
- Prettier només es comprova a les pull requests, perquè pujar un fitxer a mà no faci sortir una ✗ vermella per una qüestió de format.

## Per què no es formaten els HTML

Moltes activitats antigues encara porten tot el JavaScript i el CSS dins de l'HTML. Reformatar-los faria canvis enormes i difícils de revisar. Quan una activitat es passi a l'estructura modular (el seu JS a `js/<activitat>/`), el codi nou ja quedarà cobert.
