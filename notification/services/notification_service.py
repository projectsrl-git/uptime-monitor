import os

from notification.services.console_notifier import ConsoleNotifier
from notification.services.email_notifier import EmailNotifier


def get_active_notifiers():
    channels = os.getenv("NOTIFICATION_CHANNELS", "console")
    channels = [channel.strip() for channel in channels.split(",")]

    notifiers = []

    if "console" in channels:
        notifiers.append(ConsoleNotifier())

    if "email" in channels:
        notifiers.append(EmailNotifier())

    return notifiers


def notify(event, incident):

    for notifier in get_active_notifiers():
        notifier.send(event, incident)
