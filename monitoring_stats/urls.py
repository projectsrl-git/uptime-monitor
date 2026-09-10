from django.urls import path

from .views import (
    StatisticsView,
    IncidentStatisticsView,
    StatisticsExportView,
)

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
    path(
        "export/",
        StatisticsExportView.as_view(),
        name="statistics_export",
    ),
]
