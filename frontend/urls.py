from django.urls import path

from .views import home, add_monitor_page

urlpatterns = [
    path("", home, name="dashboard"),
    path("monitor/add/", add_monitor_page, name="add_monitor"),
]
