# CLAUDE.md — apps/backend

Contesto specifico per il backend core di homedocs. Leggi anche il `CLAUDE.md` root per contesto generale del monorepo.

## Stack

- NestJS (Node/TypeScript)
- MongoDB (via Mongoose o driver nativo — da decidere in Fase 0)
- JWT + refresh token per autenticazione
- Cron job con `@nestjs/schedule` per i promemoria scadenze
- Nodemailer per invio email

## Moduli principali (da struttura NestJS)

- `AuthModule` — login, registrazione, JWT, refresh token
- `HouseholdModule` — gestione nucleo familiare, membri
- `DocumentsModule` — CRUD documenti, upload, gestione visibilità privato/condiviso
- `RemindersModule` — cron giornaliero, invio notifiche scadenze
- `VehiclesModule` — gestione veicoli (opzionale, per raggruppare documenti auto)
- `OcrIntegrationModule` — comunicazione con il servizio Python (`apps/ocr-service`) per l'estrazione dati

## Regola non negoziabile: privacy dei documenti

Questa è la regola più importante del backend. Vedi sezione 3bis di `HomeDocs-Project-Spec.md` per il dettaglio completo.

**Ogni query che legge documenti deve applicare questo filtro, implementato una sola volta in `DocumentsService` (o repository), mai ripetuto nei controller:**

```
uploadedBy === currentUserId
OR (householdId === currentUserHouseholdId AND visibilita === "condiviso")
```

Regole aggiuntive:
- Solo `uploadedBy` può cambiare `visibilita` da privato a condiviso e viceversa
- I `reminders` ereditano la visibilità del documento collegato — non esporre reminder di documenti privati altrui

## Modello dati

Fai riferimento alla sezione 3 di `HomeDocs-Project-Spec.md` per lo schema completo delle collection MongoDB: `users`, `households`, `documents`, `documentCategories`, `reminders`, `vehicles`.

## Comunicazione con altri servizi

- **Frontend**: espone REST API consumate da Vue.js. Usa i DTO in `packages/shared-types` come contratto — se un DTO cambia, aggiornalo lì, non duplicarlo.
- **OCR service**: chiama `apps/ocr-service` (FastAPI) passando il file caricato; riceve `datiEstratti` in JSON da salvare nel documento.

## Convenzioni

- Un modulo NestJS per dominio (non un modulo unico "documents-and-everything")
- DTO con `class-validator` per validazione input
- Conventional Commits, branch `feature/HD-XXX-slug`
