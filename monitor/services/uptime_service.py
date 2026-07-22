from django.utils import timezone
from django.db.models import Avg, Min, Max


def calculate_uptime(monitor, start_date, end_date):

    if not has_checks_in_period(
        monitor,
        start_date,
        end_date,
    ):
        return {
            "status": "no_data",
            "uptime_percentage": None,
            "mtbf_seconds": None,
            "downtime_seconds": None,
            "response_time": {
                "average_ms": None,
                "minimum_ms": None,
                "maximum_ms": None,
            },
        }
    return {
        "uptime_percentage": get_uptime_percentage(
            monitor,
            start_date,
            end_date,
        ),
        "downtime_seconds": get_total_downtime(
            monitor,
            start_date,
            end_date,
        ),
        "mtbf_seconds": get_mtbf(
            monitor,
            start_date,
            end_date,
        ),
        "response_time": get_response_statistics(
            monitor,
            start_date,
            end_date,
        ),
    }


def get_incidents_in_period(monitor, start_date, end_date):
    return monitor.incidents.filter(
        started_at__lte=end_date,
        ended_at__gte=start_date,
    )


def get_total_downtime(monitor, start_date, end_date):
    incidents = get_incidents_in_period(
        monitor,
        start_date,
        end_date,
    )

    total_downtime = 0

    for incident in incidents:

        incident_start = max(
            incident.started_at,
            start_date,
        )

        incident_end = min(
            incident.ended_at or timezone.now(),
            end_date,
        )

        duration = (incident_end - incident_start).total_seconds()

        total_downtime += duration

    return int(total_downtime)


def get_uptime_percentage(monitor, start_date, end_date):

    total_seconds = (end_date - start_date).total_seconds()

    if total_seconds <= 0:
        return None

    downtime_seconds = get_total_downtime(
        monitor,
        start_date,
        end_date,
    )

    uptime_seconds = total_seconds - downtime_seconds

    uptime_percentage = (uptime_seconds / total_seconds) * 100

    return round(uptime_percentage, 2)


def get_mtbf(monitor, start_date, end_date):

    total_seconds = (end_date - start_date).total_seconds()

    incidents_count = get_incidents_in_period(
        monitor,
        start_date,
        end_date,
    ).count()

    if incidents_count == 0:
        return int(total_seconds)

    return int(total_seconds / incidents_count)


def get_response_statistics(monitor, start_date, end_date):

    result = monitor.checks.filter(
        success=True,
        executed_at__range=(start_date, end_date),
    ).aggregate(
        average=Avg("response_time_ms"),
        minimum=Min("response_time_ms"),
        maximum=Max("response_time_ms"),
    )

    return {
        "average_ms": round(result["average"], 2) if result["average"] else None,
        "minimum_ms": result["minimum"],
        "maximum_ms": result["maximum"],
    }


def has_checks_in_period(monitor, start_date, end_date):
    return monitor.checks.filter(executed_at__range=(start_date, end_date)).exists()
