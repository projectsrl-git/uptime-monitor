from django.shortcuts import get_object_or_404, render

from incident.models import Incident
from monitor.models import Monitor
from monitor.serializer import MonitorReadSerializer


def home(request):

    monitors = Monitor.objects.all().order_by("name")

    return render(
        request,
        "dashboard.html",
        {
            "monitors": monitors,
        },
    )


def add_monitor_page(request):

    context = {
        "http_methods": Monitor.HTTP_METHOD_CHOICES,
        "auth_types": Monitor.AUTH_TYPE_CHOICES,
        "ip_versions": Monitor.IP_VERSION_CHOICES,
    }

    return render(
        request,
        "add_or_edit_monitor.html",
        context,
    )


def edit_monitor_page(request, id):

    monitor = get_object_or_404(Monitor, id=id)

    context = {
        "monitor": MonitorReadSerializer(monitor).data,
        "http_methods": Monitor.HTTP_METHOD_CHOICES,
        "auth_types": Monitor.AUTH_TYPE_CHOICES,
        "ip_versions": Monitor.IP_VERSION_CHOICES,
    }

    return render(
        request,
        "add_or_edit_monitor.html",
        context,
    )


def incidents_page(request):

    incidents = Incident.objects.all()

    return render(
        request,
        "incidents.html",
        {
            "incidents": incidents,
        },
    )


def incident_detail(request, id):

    incident = Incident.objects.get(id=id)

    return render(
        request,
        "incident_detail.html",
        {
            "incident": incident,
        },
    )


def monitor_detail(request, id):

    monitor = get_object_or_404(Monitor, id=id)

    serializer = MonitorReadSerializer(monitor)

    return render(
        request,
        "monitor_detail/monitor_detail.html",
        {
            "monitor": serializer.data,
        },
    )