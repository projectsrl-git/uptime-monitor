import time
import requests

from django.utils import timezone

from .models import Check


def execute_check(monitor):
    start_time = time.time()

    try:
        response = requests.request(
            method=monitor.http_method,
            url=monitor.url,
            timeout=monitor.timeout_seconds,
        )

        response_time_ms = int((time.time() - start_time) * 1000)

        check = Check.objects.create(
            monitor=monitor,
            success=True,
            response_time_ms=response_time_ms,
            status_code=response.status_code,
        )

        return check

    except requests.RequestException as e:
        response_time_ms = int((time.time() - start_time) * 1000)

        check = Check.objects.create(
            monitor=monitor,
            success=False,
            response_time_ms=response_time_ms,
            error_message=str(e),
        )

        return check


def should_run_check(monitor):
    last_check = monitor.checks.first()

    if not last_check:
        return True

    now = timezone.now()

    elapsed_seconds = (now - last_check.executed_at).total_seconds()

    return elapsed_seconds >= monitor.check_interval_seconds
