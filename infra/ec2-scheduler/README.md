# ec2-scheduler

Lambda minimale per fermare/avviare l'istanza EC2 di HomeDocs, per ridurre le
ore fatturate (spegnimento notturno 00:00-07:00 Europe/Rome).

## Deploy

1. Crea la funzione Lambda (runtime Python 3.12) con il codice di `handler.py`.
2. Ruolo IAM della Lambda: solo `ec2:StopInstances` e `ec2:StartInstances`,
   con `Resource` limitato all'ARN dell'istanza specifica (non `*`).
3. Variabile d'ambiente della Lambda: `INSTANCE_ID=i-xxxxxxxxxxxxxxxxx`.
4. Due regole EventBridge Scheduler (non EventBridge Rules classiche — supportano
   il timezone nativamente):
   - `homedocs-stop`: cron `0 0 * * ? *`, timezone `Europe/Rome`, invoca la Lambda
     con input `{"action": "stop"}`.
   - `homedocs-start`: cron `0 7 * * ? *`, timezone `Europe/Rome`, invoca la Lambda
     con input `{"action": "start"}`.

## Note

- L'Elastic IP resta associato all'istanza anche da ferma: nessuna modifica DNS
  necessaria al riavvio.
- `restart: unless-stopped` nei servizi di `docker-compose.prod.yml` fa ripartire
  tutti i container automaticamente quando la VM si riavvia — nessun intervento
  manuale al mattino.
