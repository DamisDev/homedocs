#!/usr/bin/env bash
# Restore di Mongo + dati MinIO dall'ultimo backup su S3 (creato da backup.sh).
# Uso: eseguito sull'istanza EC2, dalla root del repo clonato (dove vive .env),
# a stack gia' avviato (docker compose -f docker-compose.prod.yml up -d).
# Serve dopo una ricreazione dell'istanza (es. migrazione a Graviton/t4g),
# quando il volume root e i volumi Docker sono ripartiti vuoti.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

env_var() { grep "^$1=" .env | head -1 | cut -d= -f2-; }
MINIO_ACCESS_KEY="$(env_var MINIO_ACCESS_KEY)"
MINIO_SECRET_KEY="$(env_var MINIO_SECRET_KEY)"
MINIO_BUCKET="$(env_var MINIO_BUCKET)"
S3_BACKUP_BUCKET="$(env_var S3_BACKUP_BUCKET)"

: "${S3_BACKUP_BUCKET:?Imposta S3_BACKUP_BUCKET in .env}"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# --- Individua l'ultimo backup (ordine lessicografico = cronologico grazie al
#     timestamp YYYY-MM-DD_HHMMSS nel nome file) ---
echo "[restore] cerco l'ultimo backup Mongo su s3://${S3_BACKUP_BUCKET}/mongo/..."
LATEST_MONGO="$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/mongo/" | sort | tail -1 | awk '{print $4}')"
LATEST_MINIO="$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/minio/" | sort | tail -1 | awk '{print $4}')"
: "${LATEST_MONGO:?Nessun backup Mongo trovato sul bucket}"
: "${LATEST_MINIO:?Nessun backup MinIO trovato sul bucket}"
echo "[restore] Mongo: $LATEST_MONGO"
echo "[restore] MinIO: $LATEST_MINIO"

aws s3 cp "s3://${S3_BACKUP_BUCKET}/mongo/${LATEST_MONGO}" "$WORKDIR/${LATEST_MONGO}"
aws s3 cp "s3://${S3_BACKUP_BUCKET}/minio/${LATEST_MINIO}" "$WORKDIR/${LATEST_MINIO}"

# --- Restore Mongo (--drop: sostituisce le collezioni esistenti) ---
echo "[restore] mongorestore..."
docker compose -f docker-compose.prod.yml exec -T mongo \
  mongorestore --db=homedocs --drop --archive < "$WORKDIR/${LATEST_MONGO}"

# --- Restore dati MinIO ---
echo "[restore] estrazione archivio MinIO..."
tar -xzf "$WORKDIR/${LATEST_MINIO}" -C "$WORKDIR"

echo "[restore] mirror verso MinIO..."
docker run --rm \
  --network "$(basename "$REPO_DIR")_default" \
  -v "$WORKDIR:/backup" \
  -e MC_HOST_minio="http://${MINIO_ACCESS_KEY}:${MINIO_SECRET_KEY}@minio:9000" \
  minio/mc:latest \
  mirror --overwrite /backup/minio-data minio/"${MINIO_BUCKET}"

echo "[restore] completato dall'ultimo backup."
