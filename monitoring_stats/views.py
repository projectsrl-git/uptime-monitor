from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.utils import timezone
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from check.models import Check
from incident.models import Incident
from monitor.models import Monitor

from .services import get_monitor_statistics
from .exports import (
    build_statistics_workbook,
    workbook_to_file_response,
)

VALID_PERIODS = (
    "24h",
    "7d",
    "30d",
    "365d",
)


PERIODS = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "365d": timedelta(days=365),
}

class StatisticsView(APIView):

    def get(self, request):

        period = request.query_params.get(
            "period",
            "24h",
        )

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

        now = timezone.now()

        period_start = now - PERIODS[period]

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

            statistics = get_monitor_statistics(
                monitor,
                period,
                now,
            )

            uptime = statistics["summary"]["uptime_percentage"]

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
        ).filter(Q(ended_at__isnull=True) | Q(ended_at__gt=period_start))

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

                total_downtime += int((incident_end - incident_start).total_seconds())

        incident_count = Incident.objects.filter(
            started_at__gte=period_start,
            started_at__lte=now,
        ).count()

        return Response(
            {
                "period": period,
                "uptime_percentage": uptime_percentage,
                "response_time_average_ms": (response_time_average),
                "checks": check_statistics["checks"],
                "incidents": incident_count,
                "downtime_seconds": total_downtime,
            }
        )


class MonitorStatisticsView(APIView):

    def get(self, request, pk):

        try:
            monitor = Monitor.objects.get(pk=pk)

        except Monitor.DoesNotExist:

            return Response(
                {"detail": ("Monitor non trovato")},
                status=404,
            )

        period = request.query_params.get(
            "period",
            "24h",
        )

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

        statistics = get_monitor_statistics(
            monitor,
            period,
        )

        return Response(
            {
                "period": statistics["period"],
                "summary": statistics["summary"],
                "response_time": (statistics["response_time"]),
                "checks": statistics["checks"],
                "uptime": statistics["uptime"],
                "response_time_over_time": (statistics["response_time_over_time"]),
                "incidents": statistics["incidents"],
            }
        )


class StatisticsExportView(APIView):

    def get(self, request):

        period = request.query_params.get(
            "period",
            "24h",
        )

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

        monitor_ids_param = request.query_params.get(
            "monitor_ids",
            "",
        ).strip()

        if not monitor_ids_param:
            raise ValidationError({"monitor_ids": ("Specificare almeno un monitor.")})

        try:

            monitor_ids = [
                int(value.strip())
                for value in monitor_ids_param.split(",")
                if value.strip()
            ]

        except ValueError:

            raise ValidationError(
                {"monitor_ids": ("Gli ID dei monitor devono " "essere numerici.")}
            )

        if not monitor_ids:
            raise ValidationError({"monitor_ids": ("Specificare almeno un monitor.")})

        monitors = list(Monitor.objects.filter(id__in=monitor_ids).order_by("name"))

        if not monitors:
            raise ValidationError({"monitor_ids": ("Nessun monitor trovato.")})

        include_summary = (
            request.query_params.get(
                "include_summary",
                "true",
            ).lower()
            == "true"
        )

        include_monitor_sheets = (
            request.query_params.get(
                "include_monitor_sheets",
                "true",
            ).lower()
            == "true"
        )

        if not include_summary and not include_monitor_sheets:
            raise ValidationError(
                {"export": ("Selezionare almeno " "una sezione da esportare.")}
            )

        workbook = build_statistics_workbook(
            monitors=monitors,
            period=period,
            include_summary=include_summary,
            include_monitor_sheets=(include_monitor_sheets),
        )

        content = workbook_to_file_response(
            workbook,
        )

        response = HttpResponse(
            content,
            content_type=(
                "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
            ),
        )

        response["Content-Disposition"] = (
            "attachment; " 'filename="monitor-statistics.xlsx"'
        )

        return response


class IncidentStatisticsView(APIView):

    def get(self, request):

        now = timezone.now()

        periods = {
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
            "365d": timedelta(days=365),
        }

        statistics = {}

        for period_name, period_delta in periods.items():

            period_start = now - period_delta

            incidents = Incident.objects.filter(
                started_at__lt=now,
            ).filter(Q(ended_at__isnull=True) | Q(ended_at__gt=period_start))

            incident_count = Incident.objects.filter(
                started_at__gte=period_start,
                started_at__lte=now,
            ).count()

            active_count = incidents.filter(ended_at__isnull=True).count()

            downtime_seconds = 0

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

                    downtime_seconds += int(
                        (incident_end - incident_start).total_seconds()
                    )

            statistics[period_name] = {
                "incidents": incident_count,
                "active": active_count,
                "downtime_seconds": downtime_seconds,
            }

        return Response(statistics)
