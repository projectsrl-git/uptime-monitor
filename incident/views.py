from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Incident
from .serializer import IncidentSerializer
from .pagination import StandardResultsSetPagination
from rest_framework.exceptions import ValidationError

VALID_STATUS = (
    "active",
    "resolved",
)


class IncidentViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = IncidentSerializer
    pagination_class = StandardResultsSetPagination

    filter_backends = [OrderingFilter]

    ordering_fields = [
        "started_at",
    ]

    ordering = [
        "-started_at",
    ]

    def get_queryset(self):

        queryset = Incident.objects.select_related("monitor")

        status = self.request.query_params.get("status")

        if status is not None:

            if status not in VALID_STATUS:
                raise ValidationError(
                    {
                        "status": (
                            "Valore non valido. "
                            f"Valori consentiti: {', '.join(VALID_STATUS)}"
                        )
                    }
                )

            if status == "active":
                queryset = queryset.filter(ended_at__isnull=True)

            elif status == "resolved":
                queryset = queryset.filter(ended_at__isnull=False)

        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(monitor__name__icontains=search) | Q(root_cause__icontains=search)
            )

        return queryset


class IncidentStatisticsView(APIView):

    PERIODS = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "365d": timedelta(days=365),
    }

    def get(self, request):

        now = timezone.now()

        statistics = {}

        for period, delta in self.PERIODS.items():

            period_start = now - delta

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

            statistics[period] = {
                "incidents": incident_count,
                "active": active_count,
                "downtime_seconds": downtime_seconds,
            }

        return Response(statistics)
