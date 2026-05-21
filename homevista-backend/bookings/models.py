from django.db import models
from django.conf import settings
from properties.models import Property

class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
        ('FINALIZING', 'Finalizing'),
        ('COMPLETED', 'Completed'),
    )

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='bookings')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='my_bookings')
    date = models.DateField()
    time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Dual Confirmation Fields
    owner_confirmed = models.BooleanField(default=False)
    customer_confirmed = models.BooleanField(default=False)
    
    # Optional Payment Proof
    payment_proof = models.ImageField(upload_to='payments/', null=True, blank=True)
    payment_proof_status = models.CharField(
        max_length=20, 
        choices=(('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')), 
        default='PENDING'
    )
    
    # Reversal Request Flags (Only Admin can reverse if both are True)
    owner_request_reversal = models.BooleanField(default=False)
    customer_request_reversal = models.BooleanField(default=False)
    
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking for {self.property.title} by {self.customer.email}"

    def check_and_finalize(self):
        """Automatically updates property status if both parties confirm."""
        if self.owner_confirmed and self.customer_confirmed:
            self.status = 'COMPLETED'
            self.save()
            
            # Update the property status to SOLD
            prop = self.property
            prop.status = 'SOLD'
            prop.save()
            return True
        return False
