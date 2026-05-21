from django.db import models
from django.conf import settings

class KYCRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kyc_requests')
    id_document = models.ImageField(upload_to='kyc/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"KYC for {self.user.email} - {self.status}"
