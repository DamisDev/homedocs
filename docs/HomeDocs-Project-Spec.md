# HomeDocs — Sistema di Gestione Documenti Domestici

> Documento di progetto per bootstrap con Claude Code. Contiene overview, architettura, modello dati, MVP e roadmap.

---

## 1. Overview

**HomeDocs** è una web app per centralizzare e organizzare tutti i documenti della vita domestica di un nucleo familiare:

- Referti e visite mediche (con pagamenti associati)
- Documenti della casa (contratti, bollette, garanzie, assicurazioni)
- Documenti auto (bolli, revisioni, tagliandi, assicurazione, multe)
- Scadenze e promemoria automatici
- Estrazione automatica dei dati dai documenti tramite OCR + AI

**Target utenti**: nuclei familiari, con condivisione documenti tra più membri (es. marito/moglie, genitori/figli).

---

## 2. Stack Tecnologico

| Livello | Tecnologia | Motivazione |
|---|---|---|
| Frontend | Vue.js 3 + TypeScript + Vite | Naturale estensione da Angular, progetto personale ideale per fare pratica con Vue |
| Backend core | NestJS (Node/TypeScript) | Coerente con la tua esperienza Node, struttura modulare enterprise-ready |
| Servizio AI/OCR | Python + FastAPI + Claude API | Estrazione dati intelligente dai documenti, allineato al tuo percorso verso Agentic AI/LLM |
| Database | MongoDB | Schema flessibile, ideale per documenti eterogenei (categorie diverse → campi diversi) |
| Storage file | MinIO (S3-compatible) → migrabile su AWS S3 | Self-hostable in locale, stesso SDK di AWS per portabilità futura |
| Autenticazione | JWT + refresh token, gestito da NestJS | Standard, semplice da estendere a OAuth in futuro |
| Notifiche scadenze | Cron job (NestJS Schedule) + email (Nodemailer) | Nessuna dipendenza esterna per l'MVP |
| Containerizzazione | Docker Compose | Coerente con la tua esperienza Docker, facile deploy locale/cloud |

**Architettura logica:**

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   Vue.js    │─────▶│  NestJS API      │─────▶│  MongoDB             │
│  (frontend) │      │  (core business) │      │  (dati documentali)  │
└─────────────┘      └────────┬─────────┘      └─────────────────────┘
                               │
                               ▼
                      ┌──────────────────┐      ┌─────────────────────┐
                      │  FastAPI Service │─────▶│  Claude API          │
                      │  (OCR + AI)      │      │  (estrazione dati)   │
                      └────────┬─────────┘      └─────────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │  MinIO / S3      │
                      │  (file storage)  │
                      └──────────────────┘
```

---

## 3. Modello Dati (Collections MongoDB)

Con MongoDB passiamo da tabelle relazionali a **collections** documentali. Lo schema flessibile è perfetto per gestire categorie di documenti con campi molto diversi tra loro (una visita medica ha campi diversi da un bollo auto) senza bisogno di tabelle separate o colonne nullable.

### `users`
```json
{
  "_id": ObjectId,
  "email": "string",
  "passwordHash": "string",
  "nome": "string",
  "cognome": "string",
  "householdId": ObjectId,
  "ruolo": "admin | membro",
  "createdAt": Date
}
```

### `households` (nucleo familiare/gruppo condiviso)
```json
{
  "_id": ObjectId,
  "nome": "string",
  "createdAt": Date
}
```

### `documents`
```json
{
  "_id": ObjectId,
  "householdId": ObjectId,
  "uploadedBy": ObjectId,
  "categoria": "visita_medica | bollo_auto | assicurazione_casa | revisione | altro",
  "titolo": "string",
  "descrizione": "string",
  "fileUrl": "string",
  "fileType": "string",
  "dataDocumento": Date,
  "dataScadenza": Date | null,
  "visibilita": "privato | condiviso",   // privato = solo uploadedBy, condiviso = visibile a tutto l'household
  // campo flessibile: struttura diversa in base a "categoria"
  "datiEstratti": {
    "campoX": "valore",
    "campoY": "valore"
  },
  "statoOcr": "pending | completato | errore",
  "pagamento": {                     // embedded, solo se rilevante (es. visite mediche)
    "importo": "number",
    "valuta": "string",
    "metodoPagamento": "string",
    "dataPagamento": Date,
    "ricevutaUrl": "string"
  },
  "createdAt": Date,
  "updatedAt": Date
}
```

> Nota: grazie allo schema flessibile di MongoDB, `datiEstratti` e `pagamento` possono variare liberamente per categoria, senza bisogno di migrazioni.
>
> **Privacy by default**: ogni documento nasce con `visibilita: "privato"`. Solo l'utente che lo carica può decidere di renderlo `"condiviso"`, rendendolo visibile nella bacheca familiare. Questo va enforced sia lato query (filtro sempre presente) sia lato UI.

### `documentCategories` (configurazione categorie, non hardcoded)
```json
{
  "_id": ObjectId,
  "nome": "string",
  "tipo": "medico | casa | auto | altro",
  "templateCampi": ["dataScadenza", "importo", "ente", "..."]
}
```

### `reminders`
```json
{
  "_id": ObjectId,
  "documentId": ObjectId,
  "dataScadenza": Date,
  "tipoNotifica": "email",
  "stato": "attivo | inviato | scaduto",
  "giorniAnticipoNotifica": [30, 15, 7]
}
```

### `vehicles` (opzionale, per raggruppare documenti auto)
```json
{
  "_id": ObjectId,
  "householdId": ObjectId,
  "targa": "string",
  "marca": "string",
  "modello": "string",
  "anno": "number"
}
```

---

## 3bis. Privacy e Bacheca Familiare

Logica di visibilità a due livelli:

- **Spazio privato** (default): ogni membro ha un'area personale dove i documenti caricati sono visibili **solo a lui**, indipendentemente dal ruolo (anche l'admin dell'household non vede i documenti privati altrui).
- **Bacheca condivisa**: un membro può marcare esplicitamente un documento come `condiviso`, rendendolo visibile a tutti gli altri membri dell'household in una vista dedicata ("Bacheca familiare").

**Regole di enforcement:**

1. Ogni query ai documenti nel backend **deve sempre filtrare** per:
   `uploadedBy === currentUserId` **OR** `(householdId === currentUserHouseholdId AND visibilita === "condiviso")`
   Questo filtro va implementato una sola volta a livello di service/repository (non ripetuto nei controller) per evitare fughe di dati private.
2. Il cambio di visibilità (`privato → condiviso`) è permesso **solo** a chi ha caricato il documento (`uploadedBy`), non ad altri membri né all'admin.
3. Un documento condiviso può essere riportato a privato in qualsiasi momento dal proprietario.
4. Nella UI, ogni documento privato ha un'icona/indicatore chiaro ("Solo tu lo vedi") per evitare condivisioni accidentali.
5. I promemoria (`reminders`) seguono la stessa visibilità del documento a cui sono associati.

---

## 3ter. Direzione Grafica

**Approccio scelto**: component library pronta + mockup preliminari delle schermate chiave.

- **Component library**: da valutare tra **PrimeVue**, **Vuetify** o **shadcn-vue** (compatibili con Vue 3 + TypeScript). Scelta da confermare in base a licenza e qualità dei componenti per form/upload/dashboard.
- **Mockup preliminari**: prima di iniziare lo sviluppo frontend, definire con Claude Design (o Claude Chat con Visualizer) i mockup delle schermate principali:
  - Dashboard (scadenze imminenti, documenti recenti)
  - Bacheca familiare (documenti condivisi dagli altri membri)
  - Spazio privato personale (documenti privati dell'utente)
  - Upload documento (form con categoria, OCR in corso, conferma dati estratti)
- **Palette e tipografia**: da definire nei mockup, poi tradotte in variabili CSS/Tailwind da riusare in tutti i componenti Vue, per garantire coerenza visiva fin dall'inizio dello sviluppo.

> Nota: i mockup vanno prodotti **prima** di iniziare la Fase 1 (MVP), così Claude Code ha un riferimento visivo concreto da seguire invece di improvvisare stile componente per componente.

### Workflow di export dal Claude Design

1. **Pagina di riferimento del design system**: nel progetto Claude Design, chiedere a Claude di generare una pagina che documenti palette colori (hex), scala tipografica, spaziature, raggio bordi e tutti i componenti riutilizzati (card, badge, bottoni, icone categoria). Bloccare questi token **prima** di procedere alle altre schermate, per evitare deriva stilistica tra una schermata e l'altra.
2. **Handoff a Claude Code**: usare il pulsante Export (in alto a destra nel progetto) → **"Handoff to Claude Code"**. Claude impacchetta assets, componenti e specifiche in un bundle utilizzabile direttamente da Claude Code con una singola istruzione.
3. **Backup HTML**: esportare anche una versione **HTML standalone** dei mockup e salvarla in `docs/design/` nel repo, come riferimento visivo persistente (Claude Design non mantiene memoria tra sessioni separate).
4. **Sync futuri**: se il design system evolve, usare il comando `/design-sync` in Claude Code per re-importare le modifiche dal progetto Claude Design collegato.

### Design token — versione completa (tutte le 6 schermate)

File di riferimento in `docs/design/`: `Dashboard HomeDocs.dc.html`, `Dashboard.dc.html`, `Bacheca Familiare.dc.html`, `Spazio Privato.dc.html`, `Documenti Auto.dc.html`, `Upload Documento.dc.html`, `HomeDocs Mobile.dc.html`, `support.js`.

**Font**: Manrope (Google Fonts, pesi 400/500/600/700/800) per i testi, Material Symbols Rounded per le icone.

**Palette base:**

| Ruolo | Colore | Hex |
|---|---|---|
| Primario (brand) | Arancio terracotta | `#C4622D` |
| Primario hover/scuro | Terracotta scuro | `#A94F20` |
| Sfondo pagina | Crema chiaro | `#F7F3EE` |
| Testo principale | Bruno scuro | `#2B2622` |
| Testo secondario | Tortora | `#A79C90` / `#8A7F73` / `#6E655B` / `#5C544B` |
| Bordi/divisori | Beige | `#ECE4DA` |
| Card/superfici alternate | Beige chiaro | `#F3ECE4` / `#F0E9E1` / `#FAF6F1` |
| Successo | Verde | `#3B7A4E` / `#4E7A57` |
| Attenzione | Ambra | `#B07714` |
| Errore/urgenza | Rosso | `#C0392B` |
| Info | Blu | `#2F6DB0` |
| Accento viola (usato in Bacheca Familiare) | Viola | `#6A4FB0` |

**Mappatura colore per categoria documento** (icone e badge — consolidata nei mockup, da rispettare in tutta l'app):

| Categoria | Sfondo icona | Colore icona/testo |
|---|---|---|
| Medico | `#FCE9E9` | `#C0392B` |
| Casa | `#E7F3EA` | `#3B7A4E` |
| Auto | `#E6EEF7` | `#2F6DB0` |

> Questi token vanno tradotti in variabili CSS/Tailwind (`apps/frontend`) come base condivisa. La mappatura per categoria va centralizzata (es. un oggetto `categoryColors` in un composable/util), non ripetuta hardcoded in ogni componente — se si aggiunge una categoria futura, va aggiornata in un solo punto.

---

## 4. Funzionalità MVP (Fase 1)

Priorità confermate:

1. **Upload manuale documenti** — drag & drop, associazione a categoria, household condiviso
2. **OCR + estrazione automatica dati** — via servizio Python + Claude API:
   - Riconoscimento tipo documento
   - Estrazione data emissione, data scadenza, importo (se presente)
   - Precompilazione automatica dei campi del form
3. **Promemoria scadenze** — cron giornaliero che controlla `Reminder`, invia email 30/15/7 giorni prima
4. **Dashboard** — vista riepilogativa: scadenze imminenti, documenti recenti, per categoria
5. **Multi-utente condiviso** — gestione household con più membri, permessi base (chi ha caricato cosa)
6. **Gestione pagamenti** — per visite mediche: importo, metodo, ricevuta allegata
7. **Spazio privato + Bacheca familiare** — ogni documento nasce privato; il proprietario può condividerlo con l'household tramite una bacheca comune (vedi sezione 3bis per le regole di enforcement)

### Fuori dall'MVP (Fase 2+)
- App mobile (scansione da fotocamera)
- Notifiche push/SMS
- Integrazione calendario (Google Calendar/iCal)
- Condivisione documenti con terzi (es. commercialista) tramite link temporaneo
- Statistiche spese mediche annuali (utile per dichiarazione dei redditi)

---

## 5. Roadmap

| Fase | Contenuto | Stima |
|---|---|---|
| **Fase 0** | Setup monorepo, Docker Compose, CI/CD base, auth JWT | 1 settimana |
| **Fase 1 — MVP** | CRUD documenti, upload, categorie, dashboard base | 2-3 settimane |
| **Fase 2 — OCR/AI** | Servizio FastAPI + integrazione Claude API per estrazione dati | 1-2 settimane |
| **Fase 3 — Promemoria** | Cron scadenze, invio email, gestione stato notifiche | 1 settimana |
| **Fase 4 — Rifinitura** | Multi-utente avanzato, permessi, UX polish | 1-2 settimane |

---

## 6. Struttura Repository (Monorepo)

```
homedocs/
├── apps/
│   ├── frontend/          # Vue.js 3 + TypeScript
│   ├── backend/           # NestJS
│   └── ocr-service/        # Python + FastAPI
├── packages/
│   └── shared-types/       # Tipi TypeScript condivisi (DTO)
├── docker-compose.yml
├── CLAUDE.md               # Contesto per Claude Code (root)
├── apps/frontend/CLAUDE.md
├── apps/backend/CLAUDE.md
└── apps/ocr-service/CLAUDE.md
```

---

## 7. Note per Claude Code

Quando avvii il progetto con Claude Code, suggerisco di:

1. Iniziare con **Fase 0** (setup + scaffolding), verificando che i tre servizi comunichino correttamente in Docker Compose
2. Creare i `CLAUDE.md` gerarchici (come fatto per Nexus): uno alla root con contesto generale del monorepo, uno per ogni app con dettagli specifici
3. Definire prima le **interfacce/DTO condivisi** (`packages/shared-types`) tra frontend e backend, per evitare disallineamenti
4. Per il servizio OCR, iniziare con un flusso semplice: upload → chiamata Claude API con il documento (PDF/immagine) → parsing JSON strutturato → salvataggio in `dati_estratti`
5. Usare Conventional Commits e branch naming coerente con il tuo workflow Jira (`feature/HD-XXX-slug`), se vuoi tracciare il progetto anche su Jira

---

## 8. Prossimi Passi Suggeriti

1. Validare/modificare il modello dati sopra in base a esigenze specifiche
2. Decidere se serve un vero e proprio sistema di permessi granulare o basta "chi appartiene alla household vede tutto"
3. Avviare Fase 0 con Claude Code usando questo documento come contesto iniziale
