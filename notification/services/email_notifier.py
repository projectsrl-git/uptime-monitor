import os

from django.core.mail import send_mail


class EmailNotifier:

    def send(self, event, incident):

        recipient = os.getenv("NOTIFICATION_EMAIL")

        if not recipient:
            return

        subject = f"Monitor {event.upper()}: " f"{incident.monitor.name}"

        message = f"""
Monitor:
{incident.monitor.name}

URL:
{incident.monitor.url}

Evento:
{event.upper()}
"""

        send_mail(
            subject=subject,
            message=message,
            from_email=None,
            recipient_list=[recipient],
        )
