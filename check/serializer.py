from rest_framework import serializers

from .models import Check


class CheckSerializer(serializers.ModelSerializer):

    class Meta:
        model = Check

        fields = (
            "id",
            "executed_at",
            "success",
            "status_code",
            "response_time_ms",
            "error_message",
        )
