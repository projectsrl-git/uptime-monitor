from rest_framework import serializers
from .models import Monitor
from urllib.parse import urlparse


class MonitorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Monitor
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "has_run_first_check",
        ]

    def validate_url(self, value):
        parsed_url = urlparse(value)

        if parsed_url.scheme not in ["http", "https"]:
            raise serializers.ValidationError("L'URL deve utilizzare HTTP o HTTPS.")

        return value
