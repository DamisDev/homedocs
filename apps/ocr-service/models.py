"""Modelli Pydantic del servizio OCR.

Il contratto verso il backend è OcrExtractionResultDto in
packages/shared-types/src/ocr.d.ts — tenerli allineati.
"""

from pydantic import BaseModel, Field


class CampoEstratto(BaseModel):
    """Coppia campo/valore estratta dal documento (schema libero per categoria)."""

    campo: str
    valore: str


class ExtractionResult(BaseModel):
    """Risposta di POST /extract (→ OcrExtractionResultDto)."""

    categoriaRiconosciuta: str | None = None
    dataDocumento: str | None = Field(default=None, description="ISO 8601 (YYYY-MM-DD)")
    dataScadenza: str | None = Field(default=None, description="ISO 8601 (YYYY-MM-DD)")
    importo: float | None = None
    datiEstratti: dict[str, str] = Field(default_factory=dict)
