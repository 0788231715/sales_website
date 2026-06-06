from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
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
    offer = models.ForeignKey('properties.Offer', null=True, blank=True, on_delete=models.SET_NULL, related_name='bookings')
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    start_datetime = models.DateTimeField(null=True, blank=True)
    end_datetime = models.DateTimeField(null=True, blank=True)
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

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['start_datetime', 'end_datetime']),
            models.Index(fields=['property', 'customer']),
        ]

    def save(self, *args, **kwargs):
        if self.start_datetime is None and self.date and self.time:
            self.start_datetime = datetime.combine(self.date, self.time)
        if self.start_datetime and self.end_datetime is None:
            self.end_datetime = self.start_datetime + timedelta(hours=3)

        super().save(*args, **kwargs)
        self._sync_property_status()

    def _sync_property_status(self):
        prop = self.property
        if self.status == 'APPROVED' and prop.status != 'SOLD':
            prop.status = 'BOOKED'
            prop.save()
        elif self.status == 'COMPLETED':
            prop.status = 'SOLD'
            prop.save()
        elif self.status in ['REJECTED', 'CANCELLED']:
            active_bookings = Booking.objects.filter(
                property=prop,
                status__in=['PENDING', 'APPROVED', 'FINALIZING']
            ).exclude(id=self.id)
            if not active_bookings.exists():
                prop.status = 'AVAILABLE'
                prop.save()

    def margin_time_label(self):
        if not self.start_datetime or not self.end_datetime:
            return None

        now = timezone.now()
        if self.start_datetime > now:
            return f"Starts on {self.start_datetime.strftime('%B %d, %Y %H:%M')}"

        if self.end_datetime > now:
            difference = self.end_datetime - now
            days = difference.days
            hours = difference.seconds // 3600
            if days > 0:
                return f"Booked for {days} Days"
            if hours > 0:
                return f"Booked for {hours} Hours"
            minutes = (difference.seconds % 3600) // 60
            return f"Booked for {minutes} Minutes"

        return f"Booked until {self.end_datetime.strftime('%B %d, %Y')}"

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
