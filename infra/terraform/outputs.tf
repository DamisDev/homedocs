output "instance_id" {
  description = "ID dell'istanza EC2 (serve per Caddyfile domain setup e per la Lambda di start/stop notturno, infra/ec2-scheduler)"
  value       = aws_instance.this.id
}

output "public_ip" {
  description = "Elastic IP pubblico — punta qui il record DNS A del dominio"
  value       = aws_eip.this.public_ip
}

output "backup_bucket" {
  description = "Bucket S3 per i backup giornalieri — usato da infra/backup.sh (S3_BACKUP_BUCKET)"
  value       = aws_s3_bucket.backups.bucket
}

output "ssh_command" {
  description = "Comando per connettersi via SSH alla nuova istanza"
  value       = "ssh -i ${local_sensitive_file.private_key.filename} ubuntu@${aws_eip.this.public_ip}"
}
