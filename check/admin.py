from django.contrib import admin
from .models import Check


@admin.register(Check)
class CheckAdmin(admin.ModelAdmin):
    list_display = (
        "monitor",
        "executed_at",
        "success",
        "status_code",
        "response_time_ms",
    )
    list_filter = (
        "success",
        "status_code",
    )
    search_fields = ("monitor__name",)
    date_hierarchy = "executed_at"
