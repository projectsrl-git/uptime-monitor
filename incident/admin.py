from django.contrib import admin
from .models import Incident


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        "monitor",
        "started_at",
        "ended_at",
        "duration_seconds",
        "root_cause",
        "suppressed_by_maintenance",
    )

    list_filter = (
        "root_cause",
        "suppressed_by_maintenance",
    )

    search_fields = ("monitor__name",)

    readonly_fields = (
        "started_at",
        "ended_at",
        "duration_seconds",
    )

    ordering = ("-started_at",)
