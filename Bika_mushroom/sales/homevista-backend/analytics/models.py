from django.db import models
from django.conf import settings
from properties.models import Property

class PropertyInteraction(models.Model):
    INTERACTION_TYPES = (
        ('VIEW', 'View'),
        ('SAVE', 'Save'),
        ('SHARE', 'Share'),
        ('CLICK', 'Click'),
    )

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.interaction_type} on {self.property.title} at {self.timestamp}"

class UserPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='preferences')
    preferred_locations = models.JSONField(default=list)
    min_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    max_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    property_types = models.JSONField(default=list)
    
    def __str__(self):
        return f"Preferences for {self.user.email}"
