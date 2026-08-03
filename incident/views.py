from rest_framework import viewsets

from .models import Incident
from .serializer import IncidentSerializer
from .pagination import StandardResultsSetPagination

class IncidentViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = IncidentSerializer

    queryset = Incident.objects.select_related("monitor").order_by("-started_at")
    pagination_class = StandardResultsSetPagination
