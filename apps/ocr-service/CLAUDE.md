# CLAUDE.md — apps/ocr-service

Contesto specifico per il servizio OCR/AI di homedocs. Leggi anche il `CLAUDE.md` root per contesto generale del monorepo.

## Stack

- Python + FastAPI
- Claude API per estrazione dati strutturati dai documenti (PDF/immagini)
- Nessun database proprio — riceve il file, restituisce JSON al backend NestJS che lo salva

## Responsabilità del servizio

1. Ricevere un documento (PDF o immagine) dal backend NestJS
2. Determinare la categoria del documento (se non già specificata) o confermarla
3. Estrarre i dati rilevanti in base alla categoria, usando Claude API:
   - Data emissione, data scadenza
   - Importo (se presente, es. visite mediche)
   - Ente/struttura emittente
   - Altri campi specifici da `documentCategories.templateCampi`
4. Restituire un JSON strutturato compatibile con il campo `datiEstratti` del documento (vedi sezione 3 di `HomeDocs-Project-Spec.md`)
5. Gestire errori di estrazione restituendo `statoOcr: "errore"` con motivo, senza bloccare il flusso principale

## Flusso consigliato per l'MVP (Fase 2)

```
Upload file → NestJS salva su MinIO → NestJS chiama ocr-service con URL/file
→ ocr-service invia a Claude API (documento + prompt di estrazione)
→ Claude API risponde con JSON strutturato
→ ocr-service valida/pulisce il JSON → risponde a NestJS
→ NestJS salva in documents.datiEstratti, aggiorna statoOcr
```

## Prompt di estrazione (linee guida)

- Il prompt a Claude deve specificare esplicitamente il formato JSON atteso in base a `documentCategories.templateCampi` della categoria
- Chiedere sempre risposta in **solo JSON**, senza testo aggiuntivo, per facilitare il parsing
- Gestire il caso in cui Claude non trovi un campo (es. data scadenza assente) restituendo `null` esplicito, non omettere il campo

## Convenzioni

- Endpoint REST esposti con FastAPI, documentati automaticamente via OpenAPI/Swagger
- Validazione input/output con Pydantic
- Variabili sensibili (API key Claude) da `.env`, mai hardcoded
- Conventional Commits, branch `feature/HD-XXX-slug`
