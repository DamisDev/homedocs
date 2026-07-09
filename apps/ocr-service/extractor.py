"""Estrazione dati dai documenti tramite Claude API.

Flusso: file (PDF/immagine) → Claude con structured outputs → JSON
strutturato con categoria riconosciuta, date, importo e campi liberi.
"""

import base64
import os

import anthropic

from models import ExtractionResult

MODEL = os.environ.get("OCR_MODEL", "claude-opus-4-8")

SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

SYSTEM_PROMPT = """\
Sei il motore di estrazione dati di HomeDocs, un archivio di documenti domestici
(bollette, referti medici, bolli auto, assicurazioni, garanzie, multe...).

Analizza il documento e restituisci i dati richiesti dallo schema:
- categoriaRiconosciuta: la categoria più adatta tra quelle elencate, o null se nessuna è plausibile
- dataDocumento: data di emissione del documento (YYYY-MM-DD), null se assente
- dataScadenza: data di scadenza/termine di pagamento (YYYY-MM-DD), null se assente
- importo: importo principale in euro (numero), null se assente
- campiEstratti: altri campi utili come coppie campo/valore (es. ente, targa,
  struttura, numero fattura, periodo di riferimento). Usa i nomi campo suggeriti
  quando pertinenti; valori sempre come stringhe leggibili.

Le date sono quasi sempre in formato italiano (gg/mm/aaaa): convertile in ISO.
Non inventare valori: se un dato non è leggibile o assente, usa null / ometti il campo.
"""


def _output_schema(categorie: list[str]) -> dict:
    campi_schema: dict = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "campo": {"type": "string"},
                "valore": {"type": "string"},
            },
            "required": ["campo", "valore"],
            "additionalProperties": False,
        },
    }
    categoria_schema: dict = {"type": ["string", "null"]}
    if categorie:
        categoria_schema = {"anyOf": [{"type": "string", "enum": categorie}, {"type": "null"}]}
    return {
        "type": "object",
        "properties": {
            "categoriaRiconosciuta": categoria_schema,
            "dataDocumento": {"type": ["string", "null"], "format": "date"},
            "dataScadenza": {"type": ["string", "null"], "format": "date"},
            "importo": {"type": ["number", "null"]},
            "campiEstratti": campi_schema,
        },
        "required": [
            "categoriaRiconosciuta",
            "dataDocumento",
            "dataScadenza",
            "importo",
            "campiEstratti",
        ],
        "additionalProperties": False,
    }


def _document_block(data: bytes, mime_type: str) -> dict:
    b64 = base64.standard_b64encode(data).decode("utf-8")
    if mime_type == "application/pdf":
        return {
            "type": "document",
            "source": {"type": "base64", "media_type": "application/pdf", "data": b64},
        }
    if mime_type in SUPPORTED_IMAGE_TYPES:
        return {
            "type": "image",
            "source": {"type": "base64", "media_type": mime_type, "data": b64},
        }
    raise ValueError(f"Tipo file non supportato per l'OCR: {mime_type}")


def extract(
    data: bytes,
    mime_type: str,
    categorie: list[str],
    categoria_indicata: str | None = None,
    template_campi: list[str] | None = None,
) -> ExtractionResult:
    """Chiama Claude e ritorna il risultato strutturato. Solleva su errore."""
    client = anthropic.Anthropic()  # ANTHROPIC_API_KEY dall'ambiente

    hints = []
    if categoria_indicata:
        hints.append(f"L'utente ha classificato il documento come: {categoria_indicata}.")
    if template_campi:
        hints.append(f"Campi suggeriti per questa categoria: {', '.join(template_campi)}.")
    user_text = " ".join(hints) or "Estrai i dati dal documento."

    response = client.messages.create(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        output_config={
            "format": {"type": "json_schema", "schema": _output_schema(categorie)}
        },
        messages=[
            {
                "role": "user",
                "content": [
                    _document_block(data, mime_type),
                    {"type": "text", "text": user_text},
                ],
            }
        ],
    )

    if response.stop_reason == "refusal":
        raise RuntimeError("Estrazione rifiutata dal modello")

    import json

    text = next(b.text for b in response.content if b.type == "text")
    raw = json.loads(text)

    return ExtractionResult(
        categoriaRiconosciuta=raw.get("categoriaRiconosciuta"),
        dataDocumento=raw.get("dataDocumento"),
        dataScadenza=raw.get("dataScadenza"),
        importo=raw.get("importo"),
        datiEstratti={
            item["campo"]: item["valore"] for item in raw.get("campiEstratti", [])
        },
    )
