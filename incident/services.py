from django.utils import timezone
from incident.models import Incident


def determine_status(monitor):

    if not monitor.has_run_first_check:
        return "not_started"

    consecutive_failures = 0

    for check in monitor.checks.all().order_by("-executed_at"):
        if check.success:
            break

        consecutive_failures += 1

    if consecutive_failures >= monitor.consecutive_failures_threshold:
        return "down"

    return "up"


def handle_incident(monitor, status, check):

    if status == "down":

        open_incident = Incident.objects.filter(
            monitor=monitor, ended_at__isnull=True
        ).exists()

        if not open_incident:

            root_cause = get_root_cause(check)

            Incident.objects.create(monitor=monitor, root_cause=root_cause)

    elif status == "up":

        open_incident = Incident.objects.filter(
            monitor=monitor, ended_at__isnull=True
        ).first()

        if open_incident:
            open_incident.ended_at = timezone.now()

            open_incident.duration_seconds = int(
                (open_incident.ended_at - open_incident.started_at).total_seconds()
            )

            open_incident.save(update_fields=["ended_at", "duration_seconds"])


def get_root_cause(check):

    if check.error_message:
        error = check.error_message.lower()

        if "timeout" in error:
            return "connection_timeout"

        return "connection_error"

    if check.status_code and check.status_code >= 500:
        return "http_error"

    return "unknown"
