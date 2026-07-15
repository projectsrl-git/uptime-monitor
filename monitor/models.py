from django.db import models
from django.core.validators import MinValueValidator


class Monitor(models.Model):

    HTTP_METHOD_CHOICES = [
        ("HEAD", "HEAD"),
        ("GET", "GET"),
        ("POST", "POST"),
        ("PUT", "PUT"),
        ("PATCH", "PATCH"),
        ("DELETE", "DELETE"),
        ("OPTIONS", "OPTIONS"),
    ]

    AUTH_TYPE_CHOICES = [
        ("none", "None"),
        ("basic", "Basic"),
    ]

    IP_VERSION_CHOICES = [
        ("ipv4", "IPv4"),
        ("ipv6", "IPv6"),
        ("ipv4_priority", "IPv4 Priority"),
    ]

    def default_status_codes():
        return ["2xx", "3xx"]

    name = models.CharField(max_length=255)
    url = models.URLField()
    check_interval_seconds = models.IntegerField(validators=[MinValueValidator(1)])
    timeout_seconds = models.IntegerField(default=30)
    accepted_status_code = models.JSONField(default=default_status_codes)
    is_active = models.BooleanField
    consecutive_failures_threshold = models.IntegerField(default=2)
    slow_response_threshold_ms = models.IntegerField(null=True, blank=True)
    has_run_first_check = models.BooleanField
    http_method = models.CharField(
        max_length=10, choices=HTTP_METHOD_CHOICES, default="HEAD"
    )
    request_headers = models.JSONField(default=dict, blank=True)
    request_body = models.TextField(null=True, blank=True)
    send_body_as_json = models.BooleanField(default=False)
    auth_type = models.CharField(
        max_length=10, choices=AUTH_TYPE_CHOICES, default="none"
    )
    auth_username = models.CharField(max_length=255, blank=True)
    auth_password = models.CharField(max_length=255, blank=True)
    follow_redirect = models.BooleanField(default=True)
    ip_version = models.CharField(
        max_length=20, choices=IP_VERSION_CHOICES, default="ipv4_priority"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
