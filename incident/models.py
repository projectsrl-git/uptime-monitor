from django.db import models
from monitor.models import Monitor


class Incident(models.Model):

    ROOT_CAUSE_CHOICES = [
        ("connection_timeout", "Connection Timeout"),
        ("connection_error", "Connection Error"),
        ("http_error", "HTTP Error"),
        ("ssl_expired", "SSL Expired"),
        ("ssl_error", "SSL Error"),
        ("unknown", "Unknown"),
    ]

    monitor = models.ForeignKey(
        Monitor, on_delete=models.PROTECT, related_name="incidents"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    root_cause = models.CharField(
        max_length=50,
        choices=ROOT_CAUSE_CHOICES,
        default="unknown",
    )
    suppressed_by_maintenance = models.BooleanField(default=False)

    @property
    def is_active(self):
        return self.ended_at is None

    def __str__(self):
        return f"{self.monitor.name} - {self.started_at}"
