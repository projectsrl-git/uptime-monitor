from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MonitorViewSet,
    MonitorUptimeView,
    MonitorCheckHistoryView,
    MonitorIncidentHistoryView,
)

router = DefaultRouter()
router.register("monitors", MonitorViewSet, basename="monitor")


urlpatterns = [
    path("", include(router.urls)),
    path("monitors/<int:pk>/uptime/", MonitorUptimeView.as_view()),
    path(
        "monitors/<int:pk>/checks/",
        MonitorCheckHistoryView.as_view(),
    ),
    path(
        "monitors/<int:pk>/incidents/",
        MonitorIncidentHistoryView.as_view(),
    ),
]
