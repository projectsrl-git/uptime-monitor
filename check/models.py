from django.db import models
from monitor.models import Monitor


class Check(models.Model):

    monitor = models.ForeignKey(
        Monitor, on_delete=models.PROTECT, related_name="checks"
    )
    executed_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField()
    response_time_ms = models.IntegerField(null=True, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    error_message = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.monitor.name} - {self.executed_at}"

    class Meta:
        ordering = ["-executed_at"]
        indexes = [models.Index(fields=["monitor", "executed_at"])]
