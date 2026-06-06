from builtins import property as builtin_property
from django.db import models
from django.conf import settings
from django.utils import timezone

class Property(models.Model):
    PROPERTY_TYPE_CHOICES = (
        ('RENT', 'For Rent'),
        ('SALE', 'For Sale'),
        ('RENT_TO_OWN', 'Rent To Own'),
    )

    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('RESERVED', 'Reserved'),
        ('UNDER_OFFER', 'Under Offer'),
        ('UNDER_REVIEW', 'Under Review'),
        ('UNDER_CONTRACT', 'Under Contract'),
        ('BOOKED', 'Booked'),
        ('SOLD', 'Sold'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    )

    CURRENCY_CHOICES = (
        ('USD', 'US Dollar'),
        ('RWF', 'Rwandan Franc'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    address = models.CharField(max_length=512)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    size = models.FloatField(help_text="Size in sqft or sqm")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES, default='RENT')
    ownership_status = models.CharField(
        max_length=20,
        choices=(
            ('PENDING', 'Pending'),
            ('VERIFIED', 'Verified'),
            ('REJECTED', 'Rejected'),
        ),
        default='PENDING'
    )
    ownership_documents_submitted = models.BooleanField(default=False)
    
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
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['views_count']),
            models.Index(fields=['latitude', 'longitude']),
        ]

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

class PropertyListingRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listing_requests')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, choices=Property.CURRENCY_CHOICES, default='USD')
    address = models.CharField(max_length=512)
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    size = models.FloatField()
    property_type = models.CharField(max_length=20, choices=Property.PROPERTY_TYPE_CHOICES, default='RENT')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request: {self.title} by {self.owner.email}"

class PropertyListingRequestImage(models.Model):
    request = models.ForeignKey(PropertyListingRequest, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='requests/')

    def __str__(self):
        return f"Image for Request: {self.request.title}"

class PropertyOwnershipDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ('TITLE_DEED', 'Title Deed'),
        ('TAX_DOCUMENT', 'Tax Document'),
        ('OTHER', 'Other'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    )

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='ownership_documents')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_ownership_documents')
    document = models.FileField(upload_to='ownership_documents/')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default='OTHER')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ownership document for {self.property.title}"

class Offer(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
        ('COUNTERED', 'Countered'),
        ('EXPIRED', 'Expired'),
    )

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='offers')
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='offers')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_offers')
    previous_offer = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='counter_offers')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, choices=Property.CURRENCY_CHOICES, default='USD')
    message = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Offer {self.amount} {self.currency} for {self.property.title}"

    @builtin_property
    def is_active(self):
        return self.status == 'PENDING' and (self.expires_at is None or self.expires_at > timezone.now())

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'property')

    def __str__(self):
        return f"{self.user.email} likes {self.property.title}"
