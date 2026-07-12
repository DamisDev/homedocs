#!/usr/bin/env bash
# Backup giornaliero di Mongo + dati MinIO verso S3.
# Uso: eseguito via cron sull'istanza EC2, dalla stessa directory dove vive
# .env (root del repo clonato). Richiede: docker, aws CLI configurata con un
# ruolo/credenziali che possano scrivere sul bucket S3_BACKUP_BUCKET.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

: "${S3_BACKUP_BUCKET:?Imposta S3_BACKUP_BUCKET (es. export S3_BACKUP_BUCKET=homedocs-backups)}"

TIMESTAMP="$(date +%Y-%m-%d_%H%M%S)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "[backup] dump Mongo..."
docker compose -f docker-compose.prod.yml exec -T mongo \
  mongodump --db=homedocs --archive > "$WORKDIR/mongo-$TIMESTAMP.archive"

echo "[backup] archivio dati MinIO..."
docker run --rm \
  --network "$(basename "$REPO_DIR")_default" \
  -v "$WORKDIR:/backup" \
  -e MC_HOST_minio="http://${MINIO_ACCESS_KEY}:${MINIO_SECRET_KEY}@minio:9000" \
  minio/mc:latest \
  mirror minio/"${MINIO_BUCKET}" /backup/minio-data

echo "[backup] compressione..."
tar -czf "$WORKDIR/minio-$TIMESTAMP.tar.gz" -C "$WORKDIR" minio-data
rm -rf "$WORKDIR/minio-data"

echo "[backup] upload su s3://${S3_BACKUP_BUCKET}..."
aws s3 cp "$WORKDIR/mongo-$TIMESTAMP.archive" "s3://${S3_BACKUP_BUCKET}/mongo/mongo-$TIMESTAMP.archive"
aws s3 cp "$WORKDIR/minio-$TIMESTAMP.tar.gz" "s3://${S3_BACKUP_BUCKET}/minio/minio-$TIMESTAMP.tar.gz"

echo "[backup] completato: $TIMESTAMP"
