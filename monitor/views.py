from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter

from django.db.models import Q

from .models import Monitor
from check.serializer import CheckSerializer
from incident.serializer import IncidentSerializer
from .serializer import MonitorReadSerializer, MonitorWriteSerializer
from .services.period_service import get_period_range, parse_date
from .services.uptime_service import calculate_uptime

VALID_STATUS = (
    "up",
    "down",
    "paused",
    "not_started",
)


class MonitorViewSet(viewsets.ModelViewSet):
    queryset = Monitor.objects.all()

    filter_backends = [OrderingFilter]

    ordering_fields = [
        "name",
        "created_at",
    ]

    ordering = [
        "name",
    ]

    def get_serializer_class(self):

        if self.action in (
            "create",
            "update",
            "partial_update",
        ):
            return MonitorWriteSerializer

        return MonitorReadSerializer

    def get_queryset(self):

        queryset = Monitor.objects.all()

        status = self.request.query_params.get("status")

        if status is None:
            return queryset

        if status not in VALID_STATUS:
            raise ValidationError(
                {
                    "status": (
                        "Valore non valido. "
                        f"Valori consentiti: {', '.join(VALID_STATUS)}"
                    )
                }
            )

        if status == "paused":
            return queryset.filter(is_active=False)

        if status == "not_started":
            return queryset.filter(
                is_active=True,
                has_run_first_check=False,
            )

        if status == "down":
            return queryset.filter(
                incidents__isnull=False,
                incidents__ended_at__isnull=True,
            ).distinct()

        if status == "up":
            return queryset.filter(
                is_active=True,
                has_run_first_check=True,
            ).exclude(
                incidents__ended_at__isnull=True,
            )

        return queryset

    def destroy(self, request, *args, **kwargs):
        monitor = self.get_object()
        monitor.is_active = False
        monitor.save(update_fields=["is_active"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class MonitorUptimeView(APIView):

    def get(self, request, pk):

        try:
            monitor = Monitor.objects.get(id=pk)

        except Monitor.DoesNotExist:
            return Response(
                {"detail": "Monitor non trovato"}, status=status.HTTP_404_NOT_FOUND
            )

        period = request.query_params.get(
            "period",
            "24h",
        )

        from_date = request.query_params.get("from")
        to_date = request.query_params.get("to")

        try:
            from_date = parse_date(from_date)
            to_date = parse_date(to_date)

            start_date, end_date = get_period_range(
                period,
                from_date,
                to_date,
            )

        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = calculate_uptime(
            monitor,
            start_date,
            end_date,
        )

        return Response(result)


class MonitorCheckHistoryView(APIView):

    def get(self, request, pk):

        try:
            monitor = Monitor.objects.get(id=pk)

        except Monitor.DoesNotExist:
            return Response(
                {"detail": "Monitor non trovato"},
                status=status.HTTP_404_NOT_FOUND,
            )

        checks = monitor.checks.all()

        try:
            from_date = parse_date(request.query_params.get("from"))

            to_date = parse_date(request.query_params.get("to"))

        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if from_date:
            checks = checks.filter(
                executed_at__gte=from_date,
            )

        if to_date:
            checks = checks.filter(
                executed_at__lte=to_date,
            )

        serializer = CheckSerializer(
            checks,
            many=True,
        )

        return Response(serializer.data)


class MonitorIncidentHistoryView(APIView):

    def get(self, request, pk):

        try:
            monitor = Monitor.objects.get(id=pk)

        except Monitor.DoesNotExist:
            return Response(
                {"detail": "Monitor non trovato"},
                status=status.HTTP_404_NOT_FOUND,
            )

        incidents = monitor.incidents.all()

        try:
            from_date = parse_date(request.query_params.get("from"))

            to_date = parse_date(request.query_params.get("to"))

        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if from_date and to_date:
            incidents = incidents.filter(
                started_at__lte=to_date,
            ).filter(Q(ended_at__gte=from_date) | Q(ended_at__isnull=True))

        elif from_date:
            incidents = incidents.filter(
                Q(ended_at__gte=from_date) | Q(ended_at__isnull=True)
            )

        elif to_date:
            incidents = incidents.filter(
                started_at__lte=to_date,
            )
        serializer = IncidentSerializer(
            incidents,
            many=True,
        )

        return Response(serializer.data)
