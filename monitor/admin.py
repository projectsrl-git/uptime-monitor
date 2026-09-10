from django.contrib import admin
from .models import Monitor


@admin.register(Monitor)
class MonitorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "url",
        "is_active",
        "check_interval_seconds",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "url")
