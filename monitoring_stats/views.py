from datetime import timedelta

from django.db.models import Avg, Count, Max, Min, Q
from django.db.models.functions import TruncHour, TruncDay
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

PERIODS = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "365d": timedelta(days=365),
}


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
                "response_time_average_ms": response_time_average,
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
                {"detail": "Monitor non trovato"},
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

        now = timezone.now()

        period_start = now - PERIODS[period]

        # ==================================================
        # GRANULARITÀ
        # ==================================================

        if period == "24h":

            bucket = timedelta(hours=1)

        elif period == "7d":

            bucket = timedelta(hours=12)

        elif period == "30d":

            bucket = timedelta(days=1)

        else:

            bucket = timedelta(days=7)

        # ==================================================
        # CHECK
        # ==================================================

        checks = Check.objects.filter(
            monitor=monitor,
            executed_at__gte=period_start,
            executed_at__lte=now,
        )

        check_stats = checks.aggregate(
            total=Count("id"),
            successful=Count(
                "id",
                filter=Q(success=True),
            ),
            failed=Count(
                "id",
                filter=Q(success=False),
            ),
            response_time_min=Min("response_time_ms"),
            response_time_max=Max("response_time_ms"),
            response_time_average=Avg("response_time_ms"),
        )

        total_checks = check_stats["total"] or 0

        successful_checks = check_stats["successful"] or 0

        failed_checks = check_stats["failed"] or 0

        response_time_min = check_stats["response_time_min"]

        response_time_max = check_stats["response_time_max"]

        response_time_average = check_stats["response_time_average"]

        if response_time_average is not None:

            response_time_average = round(
                response_time_average,
                2,
            )

        # ==================================================
        # UPTIME
        # ==================================================

        uptime_result = calculate_uptime(
            monitor,
            period_start,
            now,
        )

        uptime_percentage = uptime_result.get("uptime_percentage")

        # ==================================================
        # INCIDENTI
        # ==================================================

        incidents = (
            Incident.objects.filter(
                monitor=monitor,
                started_at__lt=now,
            )
            .filter(Q(ended_at__isnull=True) | Q(ended_at__gt=period_start))
            .distinct()
        )

        incident_count = Incident.objects.filter(
            monitor=monitor,
            started_at__gte=period_start,
            started_at__lte=now,
        ).count()

        # ==================================================
        # DOWNTIME
        # ==================================================

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

        # ==================================================
        # RESPONSE TIME NEL TEMPO
        # ==================================================

        response_time = []

        current_start = period_start

        # Creiamo un dizionario con i check
        # raggruppati nel relativo bucket.

        bucket_values = {}

        for check in checks.values(
            "executed_at",
            "response_time_ms",
        ):

            if check["response_time_ms"] is None:
                continue

            executed_at = check["executed_at"]

            elapsed = (executed_at - period_start).total_seconds()

            bucket_index = int(elapsed / bucket.total_seconds())

            bucket_start = period_start + bucket * bucket_index

            bucket_values.setdefault(bucket_start, []).append(check["response_time_ms"])

        while current_start < now:

            values = bucket_values.get(current_start, [])

            if values:

                average_ms = round(
                    sum(values) / len(values),
                    2,
                )

            else:

                average_ms = None

            response_time.append(
                {
                    "date": current_start,
                    "average_ms": average_ms,
                }
            )

            current_start += bucket

        # ==================================================
        # CHECK NEL TEMPO
        # ==================================================

        checks_over_time = []

        current_start = period_start

        check_bucket_values = {}

        for check in checks.values(
            "executed_at",
            "success",
        ):

            executed_at = check["executed_at"]

            elapsed = (executed_at - period_start).total_seconds()

            bucket_index = int(elapsed / bucket.total_seconds())

            bucket_start = period_start + bucket * bucket_index

            if bucket_start not in check_bucket_values:

                check_bucket_values[bucket_start] = {
                    "successful": 0,
                    "failed": 0,
                }

            if check["success"]:

                check_bucket_values[bucket_start]["successful"] += 1

            else:

                check_bucket_values[bucket_start]["failed"] += 1

        while current_start < now:

            values = check_bucket_values.get(
                current_start,
                {
                    "successful": 0,
                    "failed": 0,
                },
            )

            checks_over_time.append(
                {
                    "date": current_start,
                    "successful": values["successful"],
                    "failed": values["failed"],
                }
            )

            current_start += bucket

        # ==================================================
        # INCIDENTI NEL TEMPO
        # ==================================================

        incident_data = (
            Incident.objects.filter(
                monitor=monitor,
                started_at__lt=now,
            )
            .filter(Q(ended_at__isnull=True) | Q(ended_at__gt=period_start))
            .order_by("started_at")
        )

        incidents_over_time = []

        current_start = period_start

        while current_start < now:

            current_end = min(
                current_start + bucket,
                now,
            )

            bucket_incidents = incident_data.filter(started_at__lt=current_end).filter(
                Q(ended_at__isnull=True) | Q(ended_at__gt=current_start)
            )

            incident_count = 0

            downtime_seconds = 0

            for incident in bucket_incidents:

                incident_start = max(
                    incident.started_at,
                    current_start,
                )

                incident_end = min(
                    incident.ended_at or now,
                    current_end,
                )

                if incident_end > incident_start:

                    incident_count += 1

                    downtime_seconds += int(
                        (incident_end - incident_start).total_seconds()
                    )

            incidents_over_time.append(
                {
                    "date": current_start,
                    "count": incident_count,
                    "downtime_seconds": downtime_seconds,
                }
            )

            current_start = current_end

        # ==================================================
        # UPTIME NEL TEMPO
        # ==================================================

        uptime = []

        current_start = period_start

        while current_start < now:

            current_end = min(
                current_start + bucket,
                now,
            )

            result = calculate_uptime(
                monitor,
                current_start,
                current_end,
            )

            uptime.append(
                {
                    "date": current_start,
                    "uptime_percentage": result.get("uptime_percentage"),
                }
            )

            current_start = current_end

        # ==================================================
        # RESPONSE
        # ==================================================

        return Response(
            {
                "period": period,
                "summary": {
                    "uptime_percentage": (uptime_percentage),
                    "downtime_seconds": (total_downtime),
                    "checks": total_checks,
                    "successful_checks": (successful_checks),
                    "failed_checks": (failed_checks),
                    "incidents": (incident_count),
                },
                "response_time": {
                    "min_ms": response_time_min,
                    "max_ms": response_time_max,
                    "average_ms": response_time_average,
                },
                "checks": checks_over_time,
                "uptime": uptime,
                "response_time_over_time": (response_time),
                "incidents": incidents_over_time,
            }
        )
