from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import AuditEvent
from properties.models import Property
from legal.models import Contract
from verification.models import KYCRequest
from bookings.models import Booking

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@receiver(post_save, sender=Property)
@receiver(post_save, sender=Contract)
@receiver(post_save, sender=KYCRequest)
@receiver(post_save, sender=Booking)
def log_save(sender, instance, created, **kwargs):
    action = "CREATED" if created else "UPDATED"
    resource = sender.__name__
    
    # We can't easily get the request user here without middleware or custom logic
    # In a real enterprise app, we'd use a thread-local or middleware to capture the current user
    # For now, we log the instance's associated user if available
    user = None
    if hasattr(instance, 'owner'):
        user = instance.owner
    elif hasattr(instance, 'user'):
        user = instance.user
    elif hasattr(instance, 'customer'):
        user = instance.customer
        
    AuditEvent.objects.create(
        user=user,
        action=f"{resource}_{action}",
        resource=resource,
        resource_id=str(instance.id),
        changes={"status": getattr(instance, 'status', 'N/A')}
    )

@receiver(post_delete, sender=Property)
def log_delete(sender, instance, **kwargs):
    resource = sender.__name__
    user = getattr(instance, 'owner', None)
    
    AuditEvent.objects.create(
        user=user,
        action=f"{resource}_DELETED",
        resource=resource,
        resource_id=str(instance.id)
    )
