from rest_framework import serializers

from .models import Incident


class IncidentSerializer(serializers.ModelSerializer):

    monitor_name = serializers.CharField(
        source="monitor.name",
        read_only=True,
    )

    is_active = serializers.ReadOnlyField()

    class Meta:
        model = Incident

        fields = (
            "id",
            "monitor",
            "monitor_name",
            "started_at",
            "ended_at",
            "duration_seconds",
            "root_cause",
            "is_active",
        )
