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

    ip_version_display = serializers.SerializerMethodField()
    auth_type_display = serializers.SerializerMethodField()

    last_check_at = serializers.SerializerMethodField()
    last_response_time_ms = serializers.SerializerMethodField()

    class Meta:
        model = Monitor
        fields = [
            "id",
            "name",
            "url",
            "check_interval_seconds",
            "timeout_seconds",
            "accepted_status_codes",
            "is_active",
            "consecutive_failures_threshold",
            "slow_response_threshold_ms",
            "has_run_first_check",
            "http_method",
            "request_headers",
            "request_body",
            "send_body_as_json",
            "auth_type",
            "auth_type_display",
            "auth_username",
            "auth_password",
            "follow_redirects",
            "ip_version",
            "ip_version_display",
            "created_at",
            "updated_at",
            "badges",
            "status",
            "last_check_at",
            "last_response_time_ms",
        ]

    def get_ip_version_display(self, obj):
        return obj.get_ip_version_display()

    def get_auth_type_display(self, obj):
        return obj.get_auth_type_display()

    def _get_last_check(self, obj):
        return obj.checks.order_by("-executed_at").first()

    def get_last_check_at(self, obj):
        last_check = self._get_last_check(obj)
        return last_check.executed_at if last_check else None

    def get_last_response_time_ms(self, obj):
        last_check = self._get_last_check(obj)
        return last_check.response_time_ms if last_check else None
