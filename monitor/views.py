from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter

from django.db.models import Q, Exists, OuterRef

from .models import Monitor
from incident.models import Incident
from check.serializer import CheckSerializer
from incident.serializer import IncidentSerializer
from .serializer import MonitorReadSerializer, MonitorWriteSerializer
from .services.period_service import get_period_range, parse_date
from .services.uptime_service import calculate_uptime
from rest_framework.pagination import PageNumberPagination

VALID_STATUS = (
    "up",
    "down",
    "paused",
    "not_started",
)


class HistoryPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


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

        queryset = super().get_queryset()

        open_incidents = Incident.objects.filter(
            monitor=OuterRef("pk"),
            ended_at__isnull=True,
        )

        queryset = queryset.annotate(has_open_incident=Exists(open_incidents))

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
                has_open_incident=True,
            )

        if status == "up":
            return queryset.filter(
                is_active=True,
                has_run_first_check=True,
                has_open_incident=False,
            )

        return queryset

    def list(self, request, *args, **kwargs):

        ordering = request.query_params.get("ordering")

        if ordering not in ("status", "-status"):
            return super().list(request, *args, **kwargs)

        queryset = self.filter_queryset(self.get_queryset())

        if ordering == "status":
            priority = {
                "up": 0,
                "down": 1,
                "paused": 2,
                "not_started": 3,
            }

        else:  # -status
            priority = {
                "down": 0,
                "up": 1,
                "paused": 2,
                "not_started": 3,
            }

        monitors = sorted(
            queryset,
            key=lambda monitor: priority[monitor.status],
        )

        page = self.paginate_queryset(monitors)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(monitors, many=True)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        monitor = self.get_object()
        monitor.is_active = False
        monitor.save(update_fields=["is_active", "updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):

        monitor = self.get_object()

        monitor.is_active = True
        monitor.save(update_fields=["is_active", "updated_at"])

        serializer = MonitorReadSerializer(monitor)

        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):

        original = self.get_object()

        duplicated = Monitor.objects.create(
            name=f"{original.name} (Copia)",
            url=original.url,
            check_interval_seconds=original.check_interval_seconds,
            timeout_seconds=original.timeout_seconds,
            accepted_status_codes=original.accepted_status_codes.copy(),
            is_active=original.is_active,
            consecutive_failures_threshold=original.consecutive_failures_threshold,
            slow_response_threshold_ms=original.slow_response_threshold_ms,
            has_run_first_check=False,
            http_method=original.http_method,
            request_headers=original.request_headers.copy(),
            request_body=original.request_body,
            send_body_as_json=original.send_body_as_json,
            auth_type=original.auth_type,
            auth_username=original.auth_username,
            auth_password=original.auth_password,
            follow_redirects=original.follow_redirects,
            ip_version=original.ip_version,
            badges=original.badges.copy(),
        )

        serializer = MonitorReadSerializer(duplicated)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


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

    VALID_ORDERING = (
        "executed_at",
        "-executed_at",
        "response_time_ms",
        "-response_time_ms",
    )

    VALID_SUCCESS = (
        "true",
        "false",
    )

    def get(self, request, pk):

        try:
            monitor = Monitor.objects.get(id=pk)

        except Monitor.DoesNotExist:
            return Response(
                {"detail": "Monitor non trovato"},
                status=status.HTTP_404_NOT_FOUND,
            )

        checks = monitor.checks.all()

        # ==========================
        # FILTRO DATA
        # ==========================

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

        # ==========================
        # FILTRO SUCCESS
        # ==========================

        success = request.query_params.get("success")

        if success is not None:

            if success not in self.VALID_SUCCESS:
                return Response(
                    {
                        "detail": (
                            "Valore non valido per 'success'. "
                            "Valori consentiti: true, false"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            checks = checks.filter(success=(success == "true"))

        # ==========================
        # ORDINAMENTO
        # ==========================

        ordering = request.query_params.get(
            "ordering",
            "-executed_at",
        )

        if ordering not in self.VALID_ORDERING:
            return Response(
                {
                    "detail": (
                        "Ordinamento non valido. "
                        "Valori consentiti: "
                        f"{', '.join(self.VALID_ORDERING)}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        checks = checks.order_by(ordering)

        # ==========================
        # PAGINAZIONE
        # ==========================

        paginator = HistoryPagination()

        page = paginator.paginate_queryset(
            checks,
            request,
        )

        serializer = CheckSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )


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

        paginator = HistoryPagination()

        page = paginator.paginate_queryset(
            incidents,
            request,
        )

        serializer = IncidentSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )
