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

## Schermate principali (MVP)

1. **Dashboard** — scadenze imminenti, documenti recenti, navigazione verso le altre sezioni
2. **Spazio privato** — documenti dell'utente corrente non condivisi
3. **Bacheca familiare** — documenti condivisi da tutti i membri dell'household
4. **Upload documento** — form con categoria, upload file, stato OCR, conferma/modifica dati estratti
5. **Dettaglio documento** — visualizzazione completa, toggle privato/condiviso (solo per il proprietario)

## Regola privacy in UI

Ogni documento privato deve avere un indicatore visivo chiaro (es. icona lucchetto + tooltip "Solo tu lo vedi") per evitare condivisioni accidentali. Il toggle privato/condiviso è visibile e modificabile **solo** se l'utente corrente è il proprietario del documento (`uploadedBy`).

## Comunicazione con il backend

- Chiamate API verso NestJS (`apps/backend`)
- Tipi condivisi da importare da `packages/shared-types` — non duplicare interfacce/DTO localmente
- Gestione stato upload/OCR: mostrare stato `pending/completato/errore` in modo chiaro durante il polling o via websocket (da decidere in fase di implementazione)

## Convenzioni

- Componenti in PascalCase, un componente per file
- Composables in `composables/` per logica riutilizzabile (es. `useAuth`, `useDocuments`)
- Test: da definire in base al setup scelto in Fase 0 (Vitest consigliato per coerenza con Vite)
