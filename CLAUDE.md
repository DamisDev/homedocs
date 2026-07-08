# CLAUDE.md — homedocs (root)

Questo è il contesto condiviso per tutto il monorepo **homedocs**. Ogni sotto-app ha il proprio `CLAUDE.md` con dettagli specifici — leggi anche quello prima di lavorare su una singola app.

Il documento di riferimento completo è `docs/HomeDocs-Project-Spec.md`: contiene overview, modello dati, roadmap e regole di privacy. Consultalo per qualsiasi decisione architetturale.

## Cos'è homedocs

Web app per gestire i documenti di casa di un nucleo familiare (visite mediche con pagamenti, referti, documenti casa, documenti auto, bolli, scadenze). Multi-utente condiviso (household), con logica privato/condiviso per ogni documento.

## Stack

| Livello | Tecnologia |
|---|---|
| Frontend | Vue.js 3 + TypeScript + Vite |
| Backend core | NestJS (Node/TypeScript) |
| Servizio OCR/AI | Python + FastAPI + Claude API |
| Database | MongoDB |
| Storage file | MinIO (S3-compatible) |
| Auth | JWT + refresh token |
| Containerizzazione | Docker Compose |

## Struttura repo

```
homedocs/
├── apps/
│   ├── frontend/          # Vue.js 3 — CLAUDE.md specifico
│   ├── backend/           # NestJS — CLAUDE.md specifico
│   └── ocr-service/       # Python/FastAPI — CLAUDE.md specifico
├── packages/
│   └── shared-types/       # Tipi TypeScript condivisi (DTO) tra frontend e backend
├── docs/
│   ├── HomeDocs-Project-Spec.md
│   └── design/              # Mockup e riferimenti visivi da Claude Design
├── docker-compose.yml
└── CLAUDE.md               # questo file
```

## Regola non negoziabile: privacy dei documenti

Ogni documento nasce `privato` (visibile solo a chi lo carica). Diventa `condiviso` solo se il proprietario lo decide esplicitamente. Il filtro di visibilità va implementato **una sola volta a livello di service/repository nel backend**, mai duplicato nei controller. Vedi sezione 3bis di `HomeDocs-Project-Spec.md` per le regole complete. Qualsiasi feature che tocca la lettura di documenti deve rispettare questo filtro.

## Convenzioni di lavoro

- **Branch naming**: `feature/HD-XXX-slug` (coerente con workflow Jira, se attivato)
- **Commit**: Conventional Commits (`feat:`, `fix:`, `chore:`, ecc.)
- **Ordine di sviluppo consigliato**: Fase 0 (setup) → Fase 1 (MVP: CRUD documenti, dashboard, privacy) → Fase 2 (OCR/AI) → Fase 3 (promemoria) → Fase 4 (rifinitura)
- **Mockup**: prima di implementare una schermata frontend, controlla se esiste un riferimento in `docs/design/` e seguilo per palette, spacing, componenti

## Fase attuale

Fase 0 — Setup iniziale del monorepo, Docker Compose, scaffolding dei tre servizi.
