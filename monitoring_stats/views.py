from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from check.models import Check
from monitor.models import Monitor
from incident.models import Incident
from monitor.services.uptime_service import calculate_uptime

VALID_PERIODS = (
    "24h",
    "7d",
    "30d",
    "365d",
)


class StatisticsView(APIView):

    def get(self, request):

        period = request.query_params.get("period", "24h")

        if period not in VALID_PERIODS:
            raise ValidationError(
                {
                    "period": (
                        "Valore non valido. "
                        f"Valori consentiti: "
                        f"{', '.join(VALID_PERIODS)}"
                    )
                }
            )

        durations = {
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
            "365d": timedelta(days=365),
        }

        now = timezone.now()

        period_start = now - durations[period]

        checks = Check.objects.filter(
            executed_at__gte=period_start,
            executed_at__lte=now,
        )

        check_statistics = checks.aggregate(
            response_time_average_ms=Avg("response_time_ms"),
            checks=Count("id"),
        )

        monitors = Monitor.objects.all()

        uptimes = []

        for monitor in monitors:

            result = calculate_uptime(
                monitor,
                period_start,
                now,
            )

            uptime = result["uptime_percentage"]

            if uptime is not None:
                uptimes.append(uptime)

        if uptimes:

            uptime_percentage = round(
                sum(uptimes) / len(uptimes),
                2,
            )

        else:

            uptime_percentage = None

        response_time_average = check_statistics["response_time_average_ms"]

        if response_time_average is not None:

            response_time_average = round(
                response_time_average,
                2,
            )

        incidents = Incident.objects.filter(
            started_at__lt=now,
        ).filter(
            Q(ended_at__isnull=True)
            | Q(ended_at__gt=period_start)
        )

        total_downtime = 0

        for incident in incidents:

            incident_start = max(
                incident.started_at,
                period_start,
            )

            incident_end = min(
                incident.ended_at or now,
                now,
            )

            if incident_end > incident_start:

                total_downtime += int(
                    (
                        incident_end - incident_start
                    ).total_seconds()
                )

        incident_count = Incident.objects.filter(
            started_at__gte=period_start,
            started_at__lte=now,
        ).count()

        return Response(
            {
                "period": period,
                "uptime_percentage": uptime_percentage,
                "response_time_average_ms": response_time_average,
                "checks": check_statistics["checks"],
                "incidents": incident_count,
                "downtime_seconds": total_downtime,
            }
        )
