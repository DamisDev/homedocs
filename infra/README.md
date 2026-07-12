# infra

Script di supporto al deploy di produzione (EC2 + Docker Compose), non parte
dell'applicazione. Vedi il piano di deploy per il contesto completo:
`~/.claude/plans/voglio-che-stili-un-enumerated-duckling.md`.

- `backup.sh` — dump di Mongo + archivio dati MinIO, caricati su un bucket S3.
  Da schedulare come cron giornaliero sull'istanza EC2 (es. `crontab -e`:
  `0 3 * * * /opt/homedocs/infra/backup.sh >> /var/log/homedocs-backup.log 2>&1`).
  Richiede `aws` CLI configurata sull'istanza (IAM role con permessi di scrittura
  sul bucket di backup) e le stesse variabili di `.env` per Mongo/MinIO.

- `ec2-scheduler/` — Lambda per lo spegnimento/accensione automatico
  dell'istanza EC2 (00:00-07:00 Europe/Rome), invocata da due regole
  EventBridge Scheduler. Da deployare separatamente (non gira sull'istanza
  stessa, è infrastruttura AWS a parte).
