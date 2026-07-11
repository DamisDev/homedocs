# Build di produzione — servizio OCR/AI (Python + FastAPI).
# Nessun multi-stage: niente step di compilazione, basta rimuovere --reload
# (ricarica automatica, solo per sviluppo) dal comando di avvio.

FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
