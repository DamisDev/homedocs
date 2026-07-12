"""Lambda: ferma/avvia l'istanza EC2 di HomeDocs.

Invocata da due regole EventBridge Scheduler con input {"action": "stop"}
o {"action": "start"}. Vedi README.md per il deploy.
"""
import os

import boto3

ec2 = boto3.client("ec2")


def handler(event, _context):
    instance_id = os.environ["INSTANCE_ID"]
    action = event.get("action")

    if action == "stop":
        ec2.stop_instances(InstanceIds=[instance_id])
    elif action == "start":
        ec2.start_instances(InstanceIds=[instance_id])
    else:
        raise ValueError(f"action sconosciuta: {action!r} (atteso 'stop' o 'start')")

    return {"instanceId": instance_id, "action": action}
