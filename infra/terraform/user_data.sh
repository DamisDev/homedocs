#!/usr/bin/env bash
# Cloud-init: installa Docker + Compose plugin al primo avvio dell'istanza
# (corrisponde al passo 2 del piano di deploy, "Installare Docker").
set -euo pipefail

# --- Swap: la t4g.micro ha solo ~1 GB di RAM, insufficiente per il build in
# loco delle immagini (Vite/nest). 2 GB di swap evitano l'OOM killer. ---
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update -y
apt-get install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker ubuntu

# --- Backup giornaliero: cron di sistema alle 08:00 che lancia infra/backup.sh
# come utente ubuntu. PATH esplicito perche' aws v2 sta in /usr/local/bin (fuori
# dal PATH minimale di cron). Gira dopo che il repo e' clonato e .env presente;
# finche' non lo sono, backup.sh fallisce in modo innocuo e logga in backup.log. ---
cat > /etc/cron.d/homedocs-backup <<'CRON'
PATH=/usr/local/bin:/usr/bin:/bin
0 8 * * * ubuntu /home/ubuntu/homedocs/infra/backup.sh >> /home/ubuntu/backup.log 2>&1
CRON
chmod 0644 /etc/cron.d/homedocs-backup

# --- AWS CLI v2: serve a backup.sh/restore.sh per leggere/scrivere sul bucket
# S3 dei backup (l'accesso e' via IAM instance profile, nessuna credenziale). ---
if ! command -v aws >/dev/null 2>&1; then
  apt-get install -y unzip
  ARCH="$(dpkg --print-architecture)"
  case "$ARCH" in
    arm64) AWSCLI_ARCH=aarch64 ;;
    amd64) AWSCLI_ARCH=x86_64 ;;
    *) AWSCLI_ARCH=aarch64 ;;
  esac
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${AWSCLI_ARCH}.zip" -o /tmp/awscliv2.zip
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
  rm -rf /tmp/aws /tmp/awscliv2.zip
fi
