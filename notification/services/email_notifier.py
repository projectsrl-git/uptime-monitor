import os

from django.core.mail import send_mail


class EmailNotifier:

    def send(self, event, incident):

        recipient = os.getenv("NOTIFICATION_EMAIL")

        if not recipient:
            return

        subject = f"Monitor {event.upper()}: " f"{incident.monitor.name}"

        if event == "down":

            message = f"""
Monitor:
{incident.monitor.name}

URL:
{incident.monitor.url}

Evento:
DOWN

Data inizio incidente:
{incident.started_at}

Root cause:
{incident.root_cause}
"""

        else:

            message = f"""
Monitor:
{incident.monitor.name}

URL:
{incident.monitor.url}

Evento:
UP

Inizio incidente:
{incident.started_at}

Fine incidente:
{incident.ended_at}

Durata downtime:
{incident.duration_seconds} secondi
"""

        send_mail(
            subject=subject,
            message=message,
            from_email=None,
            recipient_list=[recipient],
        )
