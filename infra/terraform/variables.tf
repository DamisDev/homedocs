variable "aws_region" {
  description = "Regione AWS per l'istanza EC2"
  type        = string
  default     = "eu-central-1"
}

variable "instance_type" {
  description = "Tipo di istanza EC2. t4g.micro (Graviton/ARM) ha stesse risorse del t3.micro ma ~25% piu economico; richiede AMI arm64 (vedi data.aws_ami.ubuntu) e immagini Docker arm64-compatibili (le basi node/python/nginx usate lo sono)."
  type        = string
  default     = "t4g.micro"
}

variable "ssh_allowed_cidr" {
  description = "CIDR autorizzato a connettersi in SSH (porta 22). Usa il tuo IP pubblico /32, mai 0.0.0.0/0."
  type        = string
  # Placeholder intenzionale: terraform plan/apply si rifiuta finché non lo
  # sovrascrivi con il tuo IP reale in terraform.tfvars.
  default = "REPLACE_ME/32"

  validation {
    condition     = var.ssh_allowed_cidr != "REPLACE_ME/32"
    error_message = "Imposta ssh_allowed_cidr al tuo IP pubblico (es. curl ifconfig.me) in terraform.tfvars, non lasciare il placeholder."
  }
}

variable "root_volume_gb" {
  description = "Dimensione del volume EBS root (gp3)"
  type        = number
  default     = 20
}

variable "project_name" {
  description = "Prefisso usato per il naming/tag delle risorse"
  type        = string
  default     = "homedocs"
}
