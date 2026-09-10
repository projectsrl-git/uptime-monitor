from django.urls import path

from .views import StatisticsView
from incident.views import IncidentStatisticsView

urlpatterns = [
    path(
        "",
        StatisticsView.as_view(),
        name="statistics",
    ),
    path(
        "incidents/",
        IncidentStatisticsView.as_view(),
        name="incident_statistics",
    ),
]
