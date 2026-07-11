# CLAUDE.md — apps/backend

Contesto specifico per il backend core di homedocs. Leggi anche il `CLAUDE.md` root per contesto generale del monorepo.

## Stack

- NestJS (Node/TypeScript)
- MongoDB via **Mongoose** (`@nestjs/mongoose`, deciso in Fase 0)
- JWT + refresh token per autenticazione
- Cron job con `@nestjs/schedule` per i promemoria scadenze
- Nodemailer per invio email

## Moduli principali (da struttura NestJS)

- `AuthModule` — login, registrazione (nuovo household o join via `codiceInvito`), JWT, refresh token
- `HouseholdsModule` — household, `codiceInvito` univoco (generato alla creazione, rigenerabile), `GET /households/mine` con membri
- `DocumentsModule` — CRUD documenti, upload, gestione visibilità privato/condiviso, pagamento embedded, filtro per `tipo`/`vehicleId`
- `RemindersModule` — cron giornaliero, invio notifiche scadenze
- `VehiclesModule` — CRUD veicoli scoping per household, referenziati da `documents.vehicleId`
- `OcrModule` — comunicazione con il servizio Python (`apps/ocr-service`) per l'estrazione dati, fire-and-forget dopo l'upload

Nota: `AuthModule` e `HouseholdsModule` si importano a vicenda (JWT guard da un lato, servizio household in registrazione dall'altro) — il ciclo è risolto con `forwardRef` su entrambi i lati.

## Autorizzazione per ruolo

`ruolo` (`admin`/`membro`) viaggia nel JWT payload ed è disponibile su `AuthenticatedUser.ruolo` dopo `JwtAuthGuard`. Per proteggere un endpoint per ruolo: `@UseGuards(RolesGuard) @Roles('admin')` (`src/auth/roles.guard.ts` + `roles.decorator.ts`) — va applicato **dopo** `JwtAuthGuard` nella catena, perché legge `request.user` già popolato. Senza `@Roles(...)` il guard lascia passare chiunque sia autenticato.

## Sicurezza

- Upload: `fileFilter` su `FileInterceptor` (`documents.controller.ts`) accetta solo PDF/immagini — un content-type diverso viene scartato da multer prima ancora di arrivare al service.
- Rate limiting: `@nestjs/throttler` globale (100 req/min) via `APP_GUARD`; `/auth/login` e `/auth/register` hanno una soglia più stretta (`@Throttle`, 10/min) contro brute-force.
- CORS: `CORS_ORIGINS` in `.env`, lista di origin separate da virgola (fallback `FRONTEND_URL` poi `localhost:5173`) — mai wide-open.
- Secrets (JWT, MinIO) letti da `.env` via `env_file` nel compose, mai in chiaro nel file versionato.

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
- Test: Jest (già configurato, `npm test`), `*.spec.ts` accanto al service testato; i mock dei model Mongoose sono oggetti plain con `jest.fn()` sulle query, mai una connessione reale

## Build di produzione

`Dockerfile` (multi-stage, non `Dockerfile.dev`): builder esegue `npm ci` + `nest build` con contesto = repo root (serve a copiare `packages/shared-types` nella stessa posizione relativa attesa dal path mapping di `tsconfig.json` — tipi soltanto, erasi a runtime), lo stage runtime fa `npm ci --omit=dev` e avvia `node dist/main.js` (nessun watcher). Uso: `docker compose -f docker-compose.prod.yml up --build` dalla root del monorepo. Il file `docker-compose.prod.yml` usa `image:` esplicito e distinto da quello dev (suffisso `-prod`) — senza, Compose riuserebbe lo stesso tag tra i due file e l'ultimo build vincerebbe su entrambi gli stack.
