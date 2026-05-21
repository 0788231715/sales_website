from django.db import models
from django.conf import settings
from bookings.models import Booking

class ContractTemplate(models.Model):
    title = models.CharField(max_length=255)
    content_html = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Contract(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SIGNED', 'Signed'),
        ('ARCHIVED', 'Archived'),
    )

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='contract')
    template = models.ForeignKey(ContractTemplate, on_delete=models.SET_NULL, null=True)
    signed_pdf = models.FileField(upload_to='contracts/', null=True, blank=True)
    customer_signature = models.TextField(null=True, blank=True) # Base64 signature
    owner_signature = models.TextField(null=True, blank=True)    # Base64 signature
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    version = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Contract for {self.booking.property.title}"

class SignatureLog(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='signatures')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Signature by {self.user.email} at {self.timestamp}"
