from django.db.models import Q
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter

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
