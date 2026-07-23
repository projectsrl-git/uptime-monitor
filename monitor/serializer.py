from urllib.parse import urlparse

from rest_framework import serializers

from .models import Monitor
from incident.models import Incident


class MonitorWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Monitor

        fields = "__all__"

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "has_run_first_check",
        )

    def validate_url(self, value):
        parsed_url = urlparse(value)

        if parsed_url.scheme not in ["http", "https"]:
            raise serializers.ValidationError("L'URL deve utilizzare HTTP o HTTPS.")

        return value


class MonitorReadSerializer(serializers.ModelSerializer):

    status = serializers.SerializerMethodField()

    class Meta:
        model = Monitor

        fields = "__all__"

    def get_status(self, obj):

        if not obj.has_run_first_check:
            return "not_started"

        if Incident.objects.filter(
            monitor=obj,
            ended_at__isnull=True,
        ).exists():
            return "down"

        return "up"
