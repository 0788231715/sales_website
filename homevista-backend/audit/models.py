from django.db import models
from django.conf import settings

class AuditEvent(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255) # e.g., "CONTRACT_SIGNED", "PROPERTY_DELETED"
    resource = models.CharField(max_length=100) # e.g., "Property", "Contract"
    resource_id = models.CharField(max_length=100, null=True, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} on {self.resource} by {self.user} at {self.timestamp}"
