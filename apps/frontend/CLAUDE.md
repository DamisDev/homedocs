# CLAUDE.md — apps/frontend

Contesto specifico per il frontend di homedocs. Leggi anche il `CLAUDE.md` root per contesto generale del monorepo.

## Stack

- Vue.js 3 (Composition API, `<script setup>`)
- TypeScript
- Vite
- UI: **Tailwind CSS 4 + componenti custom** (deciso in Fase 1: i mockup hanno uno stile completamente custom, una component library avrebbe richiesto troppi override). I design token vivono in `src/style.css` (`@theme`).
- Router: vue-router; stato: Pinia (`src/stores/`); API: fetch wrapper in `src/api/client.ts` con refresh token automatico

## Riferimenti visivi

Prima di implementare qualsiasi schermata, controlla `docs/design/` per i mockup prodotti con Claude Design (dashboard, bacheca familiare, spazio privato, documenti auto, upload documento, versione mobile). Rispetta palette, tipografia e spacing definiti lì — non improvvisare stile componente per componente.

### Design token (da tutte le 6 schermate)

Font: **Manrope** (Google Fonts, pesi 400/500/600/700/800), icone **Material Symbols Rounded**.

| Ruolo | Hex |
|---|---|
| Primario (brand) | `#C4622D` |
| Primario hover/scuro | `#A94F20` |
| Sfondo pagina | `#F7F3EE` |
| Testo principale | `#2B2622` |
| Testo secondario | `#A79C90` / `#8A7F73` / `#6E655B` / `#5C544B` |
| Bordi/divisori | `#ECE4DA` |
| Card/superfici alternate | `#F3ECE4` / `#F0E9E1` / `#FAF6F1` |
| Successo | `#3B7A4E` / `#4E7A57` |
| Attenzione | `#B07714` |
| Errore/urgenza | `#C0392B` |
| Info | `#2F6DB0` |
| Accento viola (Bacheca Familiare) | `#6A4FB0` |

**Mappatura colore per categoria** (icone/badge, consolidata nei mockup):

| Categoria | Sfondo icona | Colore icona/testo |
|---|---|---|
| Medico | `#FCE9E9` | `#C0392B` |
| Casa | `#E7F3EA` | `#3B7A4E` |
| Auto | `#E6EEF7` | `#2F6DB0` |

Traduci questi valori in variabili CSS/Tailwind (`tailwind.config` o `:root` custom properties) prima di iniziare qualsiasi componente. La mappatura categoria→colore va centralizzata in un unico util/composable (es. `useCategoryStyle`), mai duplicata hardcoded nei singoli componenti.

## Schermate principali

1. **Dashboard** — scadenze imminenti, documenti recenti, navigazione verso le altre sezioni
2. **Spazio privato** — documenti dell'utente corrente non condivisi
3. **Bacheca familiare** — documenti condivisi da tutti i membri dell'household
4. **Upload documento** — form con categoria, upload file, stato OCR, veicolo (categorie auto), pagamento facoltativo (categorie che lo prevedono, es. visite mediche)
5. **Dettaglio documento** — visualizzazione completa, toggle privato/condiviso (solo per il proprietario), dati estratti OCR, card pagamento con modifica/rimozione (solo proprietario)
6. **Documenti auto** — una card per veicolo con prossima scadenza e documenti collegati; CRUD veicoli
7. **La mia famiglia** — elenco membri household e codice invito (copia/rigenera)

La registrazione (`RegisterView`) permette di creare un nuovo household o entrare in uno esistente tramite `codiceInvito`.

## Layout responsive

`AppLayout.vue` replica `docs/design/HomeDocs Mobile.dc.html`: sidebar visibile solo `md:` (`≥768px`), sotto quella soglia sostituita da una bottom nav fissa (stessi `navItems`) + un FAB "nuovo documento". Il FAB è `position:fixed` e resta sopra il contenuto durante lo scroll: va nascosto (`showFab` in `AppLayout.vue`) sulle rotte con proprie azioni fitte vicino al bordo, altrimenti le copre — vale sia per rotte esistenti (`documento`, `upload`) sia per qualunque nuova vista con bottoni in basso a destra.

## Regola privacy in UI

Ogni documento privato deve avere un indicatore visivo chiaro (es. icona lucchetto + tooltip "Solo tu lo vedi") per evitare condivisioni accidentali. Il toggle privato/condiviso è visibile e modificabile **solo** se l'utente corrente è il proprietario del documento (`uploadedBy`).

## Ruoli in UI

Il `ruolo` (`admin`/`membro`) arriva da `auth.user?.ruolo` (store Pinia). Le azioni riservate all'admin (es. rigenerare il codice invito in `FamilyView.vue`) vanno nascoste in UI per i non-admin **e** protette lato backend con `@Roles('admin')` — il controllo UI da solo non basta, è solo cosmetica.

## Comunicazione con il backend

- Chiamate API verso NestJS (`apps/backend`), un modulo in `src/api/` per dominio (`documents.ts`, `vehicles.ts`, `households.ts`, ...)
- Tipi condivisi da importare da `packages/shared-types` — non duplicare interfacce/DTO localmente
- Gestione stato upload/OCR: `DocumentDetailView` fa polling ogni 3s finché `statoOcr === 'pending'`
- Upload multipart: i campi annidati (es. `pagamento`) vanno in `FormData` con notazione bracket (`pagamento[importo]`, ...), che il backend ricompone via `class-transformer` — un campo innestato assegnato solo nel tipo TS ma mai aggiunto al `FormData` viene scartato silenziosamente

## Convenzioni

- Componenti in PascalCase, un componente per file
- Composables in `composables/` per logica riutilizzabile (es. `useAuth`, `useDocuments`)
- Test: Vitest + `@vue/test-utils` (`npm test`), file `*.spec.ts` accanto al sorgente testato. In CI gira prima di `npm run build`.

## Build di produzione

`Dockerfile` (multi-stage, non `Dockerfile.dev`): builder Node esegue `vue-tsc -b && vite build` (contesto = repo root, serve per risolvere `@homedocs/shared-types` tramite lo stesso path relativo usato in dev), lo stage runtime è `nginx:alpine` che serve `dist/` con `nginx.conf` (fallback SPA per vue-router in modalità history). `VITE_API_URL` è un build arg: Vite lo inlinea nel bundle in fase di build, non è leggibile a runtime come le altre env. Uso: `docker compose -f docker-compose.prod.yml up --build` dalla root del monorepo.
