# infra

Script di supporto al deploy di produzione (EC2 + Docker Compose), non parte
dell'applicazione. Vedi il piano di deploy per il contesto completo:
`~/.claude/plans/voglio-che-stili-un-enumerated-duckling.md`.

- `terraform/` — provisioning dell'istanza EC2 (VPC default, security group,
  Ubuntu 24.04 + Docker via cloud-init, Elastic IP). Vedi la sezione più sotto
  per i passi di esecuzione.

- `backup.sh` — dump di Mongo + archivio dati MinIO, caricati sul bucket S3
  `homedocs-backups-<account-id>` (creato da `terraform/backup.tf`, retention
  30 giorni). Legge `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`/`MINIO_BUCKET`/
  `S3_BACKUP_BUCKET` direttamente da `.env` (non serve esportarle a mano).
  Scritture su S3 autorizzate via instance profile IAM associato all'EC2,
  nessuna credenziale statica sul server. Schedulato via crontab root:
  `30 7 * * * cd /home/ubuntu/homedocs && /home/ubuntu/homedocs/infra/backup.sh >> /var/log/homedocs-backup.log 2>&1`
  — le 7:30 sono scelte apposta subito dopo l'accensione automatica delle 7:00
  (vedi sotto), altrimenti un orario nella finestra 00:00-07:00 troverebbe
  il server spento e il backup non partirebbe mai.

- `ec2-scheduler/` — Lambda per lo spegnimento/accensione automatico
  dell'istanza EC2 (00:00-07:00 Europe/Rome), deployata da
  `terraform/scheduler.tf` con due regole EventBridge Scheduler. Testata
  manualmente con `aws lambda invoke` per entrambe le azioni (stop/start).

## Provisioning EC2 con Terraform

```
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# modifica terraform.tfvars con il tuo IP pubblico (curl ifconfig.me)

terraform init
terraform plan    # controlla le risorse che verranno create
terraform apply   # crea VPC lookup, security group, EC2, Elastic IP
```

Richiede le credenziali AWS configurate (`aws configure` o variabili
`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`) e Terraform >= 1.5 installato
localmente. Al termine, `terraform output` mostra `public_ip` (da usare per
il record DNS A del dominio) e `ssh_command` per il primo accesso.

Lo stato Terraform (`*.tfstate`) e la chiave privata generata (`*.pem`) non
vanno mai committati — sono già in `.gitignore` di questa cartella.
