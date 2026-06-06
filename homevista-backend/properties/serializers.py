from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.utils import timezone
from .models import Property, PropertyImage, Review, PropertyListingRequest, PropertyListingRequestImage, Favorite, Offer, PropertyOwnershipDocument
from bookings.models import Booking
from users.serializers import UserSerializer

User = get_user_model()

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ('id', 'image', 'is_main')

class PropertyListingRequestImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyListingRequestImage
        fields = ('id', 'image')

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'rating', 'comment', 'created_at')

class PropertyOwnershipDocumentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = PropertyOwnershipDocument
        fields = '__all__'
        read_only_fields = ('uploaded_by', 'status', 'created_at', 'updated_at')

class OfferSerializer(serializers.ModelSerializer):
    property_details = serializers.SerializerMethodField()
    buyer_details = UserSerializer(source='buyer', read_only=True)
    seller_details = UserSerializer(source='seller', read_only=True)
    counter_offers = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Offer
        fields = '__all__'
        read_only_fields = ('buyer', 'seller', 'status', 'counter_offers', 'created_at', 'updated_at')

    def validate(self, data):
        request = self.context.get('request')
        prop = data.get('property')
        user = request.user if request else None

        if not prop:
            raise serializers.ValidationError({'property': 'Property is required for an offer.'})

        if prop.owner == user:
            raise serializers.ValidationError({'buyer': 'Owner cannot make an offer on their own property.'})

        if prop.status in ['SOLD', 'CANCELLED', 'EXPIRED']:
            raise serializers.ValidationError({'property': 'Offers cannot be placed on this property status.'})

        if prop.property_type in ['SALE', 'RENT_TO_OWN'] and user and user.kyc_status != 'VERIFIED':
            raise serializers.ValidationError({'buyer': 'KYC verification is required before submitting an offer.'})

        if data.get('amount') is not None and data.get('amount') <= 0:
            raise serializers.ValidationError({'amount': 'Offer amount must be greater than zero.'})

        previous_offer = data.get('previous_offer')
        if previous_offer and previous_offer.property != prop:
            raise serializers.ValidationError({'previous_offer': 'Previous offer must belong to the same property.'})

        return data

    def get_property_details(self, obj):
        return {
            'id': obj.property.id,
            'title': obj.property.title,
            'price': str(obj.property.price),
            'currency': obj.property.currency,
            'status': obj.property.status,
            'property_type': obj.property.property_type,
        }

class ActiveBookingSerializer(serializers.ModelSerializer):
    customer_details = UserSerializer(source='customer', read_only=True)
    duration_text = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'status', 'start_datetime', 'end_datetime',
            'duration_text', 'customer_details'
        ]

    def get_duration_text(self, obj):
        return obj.margin_time_label()

class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='owner',
        write_only=True,
        required=False
    )
    reviews = ReviewSerializer(many=True, read_only=True)
    ownership_documents = PropertyOwnershipDocumentSerializer(many=True, read_only=True)
    offers = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()
    current_booking = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('views_count', 'created_at', 'updated_at')

    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('views_count', 'created_at', 'updated_at')

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return 0
        return sum(r.rating for r in reviews) / len(reviews)

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, property=obj).exists()
        return False

    def get_favorites_count(self, obj):
        return obj.favorited_by.count()

    def get_current_booking(self, obj):
        current = obj.bookings.filter(status__in=['APPROVED', 'FINALIZING', 'PENDING']).order_by('-start_datetime').first()
        if not current:
            return None
        return ActiveBookingSerializer(current, context=self.context).data

    def get_status_label(self, obj):
        if obj.status == 'AVAILABLE':
            return 'In Stock'
        if obj.status == 'BOOKED':
            return 'Booked'
        if obj.status == 'SOLD':
            return 'Sold / Unavailable'
        return obj.get_status_display()

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user.role != 'ADMIN' and 'owner' in attrs:
            if attrs['owner'] != request.user:
                raise serializers.ValidationError({"owner": "You cannot set the owner to someone else."})

        latitude = attrs.get('latitude')
        longitude = attrs.get('longitude')
        if latitude is not None and (latitude < -90 or latitude > 90):
            raise serializers.ValidationError({"latitude": "Latitude must be between -90 and 90."})
        if longitude is not None and (longitude < -180 or longitude > 180):
            raise serializers.ValidationError({"longitude": "Longitude must be between -180 and 180."})

        return attrs

class PropertyListingRequestSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    images = PropertyListingRequestImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = PropertyListingRequest
        fields = '__all__'
        read_only_fields = ('owner', 'status', 'created_at', 'updated_at')
