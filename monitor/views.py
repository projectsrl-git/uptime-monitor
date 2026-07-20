from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import Monitor
from .serializer import MonitorSerializer


class MonitorViewSet(viewsets.ModelViewSet):
    queryset = Monitor.objects.all()
    serializer_class = MonitorSerializer

    def destroy(self, request, *args, **kwargs):
        monitor = self.get_object()
        monitor.is_active = False
        monitor.save(update_fields=["is_active"])

        return Response(status=status.HTTP_204_NO_CONTENT)
