from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Property, PropertyImage, Review, PropertyListingRequest, PropertyListingRequestImage, Favorite
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
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()

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

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user.role != 'ADMIN' and 'owner' in attrs:
            if attrs['owner'] != request.user:
                raise serializers.ValidationError({"owner": "You cannot set the owner to someone else."})
        return attrs

class PropertyListingRequestSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    images = PropertyListingRequestImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = PropertyListingRequest
        fields = '__all__'
        read_only_fields = ('owner', 'status', 'created_at', 'updated_at')
