from urllib.parse import urlparse

from rest_framework import serializers

from .models import Monitor


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

    status = serializers.ReadOnlyField()
    last_check_at = serializers.SerializerMethodField()
    last_response_time_ms = serializers.SerializerMethodField()

    class Meta:
        model = Monitor
        fields = "__all__"

    def _get_last_check(self, obj):
        return obj.checks.order_by("-executed_at").first()

    def get_last_check_at(self, obj):
        last_check = self._get_last_check(obj)
        return last_check.executed_at if last_check else None

    def get_last_response_time_ms(self, obj):
        last_check = self._get_last_check(obj)
        return last_check.response_time_ms if last_check else None
