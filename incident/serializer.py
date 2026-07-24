from rest_framework import serializers

from .models import Incident


class IncidentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Incident

        fields = (
            "id",
            "started_at",
            "ended_at",
            "duration_seconds",
            "root_cause",
        )
