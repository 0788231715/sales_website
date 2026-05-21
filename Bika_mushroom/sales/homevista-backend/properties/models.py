from django.db import models
from django.conf import settings

class Property(models.Model):
    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('SOLD', 'Sold'),
        ('BOOKED', 'Booked'),
        ('PENDING', 'Pending'),
        ('RENTED', 'Rented'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=15, decimal_places=2)
    address = models.CharField(max_length=512)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    size = models.FloatField(help_text="Size in sqft or sqm")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    
    # Enterprise Fields
    is_verified = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    engagement_rate = models.FloatField(default=0.0)
    ai_tags = models.JSONField(default=list, blank=True)
    
    virtual_tour_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name_plural = "Properties"

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='properties/')
    is_main = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.property.title}"

class Review(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.full_name} for {self.property.title}"
