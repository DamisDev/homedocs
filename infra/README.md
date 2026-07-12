# infra

Script di supporto al deploy di produzione (EC2 + Docker Compose), non parte
dell'applicazione. Vedi il piano di deploy per il contesto completo:
`~/.claude/plans/voglio-che-stili-un-enumerated-duckling.md`.

- `terraform/` — provisioning dell'istanza EC2 (VPC default, security group,
  Ubuntu 24.04 + Docker via cloud-init, Elastic IP). Vedi la sezione più sotto
  per i passi di esecuzione.

- `backup.sh` — dump di Mongo + archivio dati MinIO, caricati su un bucket S3.
  Da schedulare come cron giornaliero sull'istanza EC2 (es. `crontab -e`:
  `0 3 * * * /opt/homedocs/infra/backup.sh >> /var/log/homedocs-backup.log 2>&1`).
  Richiede `aws` CLI configurata sull'istanza (IAM role con permessi di scrittura
  sul bucket di backup) e le stesse variabili di `.env` per Mongo/MinIO.

- `ec2-scheduler/` — Lambda per lo spegnimento/accensione automatico
  dell'istanza EC2 (00:00-07:00 Europe/Rome), invocata da due regole
  EventBridge Scheduler. Da deployare separatamente (non gira sull'istanza
  stessa, è infrastruttura AWS a parte).

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
