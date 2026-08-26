from django.urls import path

from .views import StatisticsView, MonitorStatisticsView

urlpatterns = [
    path(
        "",
        StatisticsView.as_view(),
        name="statistics",
    ),
]
