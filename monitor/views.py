from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.response import Response

from django.db.models import Q

from .models import Monitor
from check.serializer import CheckSerializer
from incident.serializer import IncidentSerializer
from .serializer import MonitorSerializer
from .services.period_service import get_period_range, parse_date
from .services.uptime_service import calculate_uptime


class MonitorViewSet(viewsets.ModelViewSet):
    queryset = Monitor.objects.all()
    serializer_class = MonitorSerializer

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
