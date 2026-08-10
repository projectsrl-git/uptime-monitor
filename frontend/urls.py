from django.urls import path

from .views import home, add_monitor_page,incidents_page,incident_detail

urlpatterns = [
    path("", home, name="dashboard"),
    path("monitor/add/", add_monitor_page, name="add_monitor"),
    path("incidents/", incidents_page, name="incidents"),
    path("incidents/<int:id>/", incident_detail, name="incident_detail"),
]
