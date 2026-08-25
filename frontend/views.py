from django.shortcuts import get_object_or_404, render, redirect

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
        "monitor_detail.html",
        {
            "monitor": serializer.data,
        },
    )


def duplicate_monitor(request, id):

    if request.method != "POST":
        return redirect("monitor_detail", id=id)

    original = get_object_or_404(Monitor, id=id)

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

    return redirect("dashboard")
