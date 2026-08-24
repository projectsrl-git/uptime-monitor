from django.shortcuts import get_object_or_404, render, redirect

from incident.models import Incident
from monitor.models import Monitor
from monitor.serializer import MonitorReadSerializer, MonitorWriteSerializer

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

    if request.method == "POST":

        data = prepare_monitor_data(request.POST)

        serializer = MonitorWriteSerializer(data=data)

        if serializer.is_valid():

            serializer.save()

            return redirect("dashboard")

        print(serializer.errors)

        return render(request, "add_monitor.html", {"errors": serializer.errors})

    return render(request, "add_monitor.html", context)


def prepare_monitor_data(data):

    data = data.dict()

    data["accepted_status_codes"] = [
        code.strip() for code in data["accepted_status_codes"].split(",")
    ]

    if data.get("slow_response_threshold_ms") == "":
        data["slow_response_threshold_ms"] = None

    return data


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

    return render(request, "incident_detail.html", {"incident": incident})


def monitor_detail(request, id):
    monitor = get_object_or_404(Monitor, id=id)

    serializer = MonitorReadSerializer(monitor)

    return render(
        request,
        "monitor_detail.html",
        {
            "monitor": serializer.data,
        },
    )
