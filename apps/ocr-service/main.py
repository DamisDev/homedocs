# PLACEHOLDER — Claude Code svilupperà qui la logica reale di
# estrazione dati (OCR/AI) nella Fase 2. Vedi CLAUDE.md in questa
# cartella per il flusso completo previsto.

from fastapi import FastAPI

app = FastAPI(title="HomeDocs OCR Service")


@app.get("/health")
def health():
    return {"status": "ok"}
