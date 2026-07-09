"""HomeDocs OCR Service — estrazione dati dai documenti via Claude API.

Riceve un file dal backend NestJS e restituisce OcrExtractionResultDto.
Nessun database proprio: il backend salva il risultato in documents.datiEstratti.
"""

import json
import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from extractor import extract
from models import ExtractionResult

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="HomeDocs OCR Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract", response_model=ExtractionResult)
async def extract_endpoint(
    file: UploadFile = File(...),
    categoria: str | None = Form(default=None),
    categorie: str = Form(default="[]", description="JSON array degli slug categoria"),
    templateCampi: str = Form(default="[]", description="JSON array dei campi suggeriti"),
) -> ExtractionResult:
    try:
        categorie_list = json.loads(categorie)
        template_list = json.loads(templateCampi)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail=f"JSON non valido: {exc}") from exc

    data = await file.read()
    try:
        return extract(
            data,
            file.content_type or "application/octet-stream",
            categorie=categorie_list,
            categoria_indicata=categoria,
            template_campi=template_list,
        )
    except ValueError as exc:
        # tipo file non supportato: errore del chiamante, non del servizio
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — il backend gestisce statoOcr=errore
        logger.error("Estrazione fallita: %s", exc)
        raise HTTPException(status_code=502, detail=f"Estrazione fallita: {exc}") from exc
