from django.urls import path

from .views import (
    home,
    add_monitor_page,
    incidents_page,
    incident_detail,
    monitor_detail,
    duplicate_monitor,
    edit_monitor_page,
)

urlpatterns = [
    path("", home, name="dashboard"),
    path("monitor/add/", add_monitor_page, name="add_monitor"),
    path("monitor/<int:id>/", monitor_detail, name="monitor_detail"),
    path("monitor/<int:id>/edit/", edit_monitor_page, name="monitor_edit"),
    path("monitor/<int:id>/duplicate/", duplicate_monitor, name="monitor_duplicate"),
    path("incidents/", incidents_page, name="incidents"),
    path("incidents/<int:id>/", incident_detail, name="incident_detail"),
]
