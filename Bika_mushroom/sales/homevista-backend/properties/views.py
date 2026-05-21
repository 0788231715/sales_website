from django.db.models import F, ExpressionWrapper, FloatField
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Property, PropertyImage, Review
from .serializers import PropertySerializer, PropertyImageSerializer, ReviewSerializer

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'bedrooms', 'bathrooms', 'price']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['price', 'created_at', 'views_count']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Smart Ranking Algorithm:
        # Score = (Views * 0.3) + (is_verified * 100) + (Engagement * 0.5)
        # For simplicity, we annotate a 'rank_score' and order by it
        queryset = queryset.annotate(
            rank_score=ExpressionWrapper(
                (F('views_count') * 0.3) + 
                (F('engagement_rate') * 0.5),
                output_field=FloatField()
            )
        )
        
        # Boost verified properties
        # This is harder to do in a single annotation with booleans in SQLite
        # but we can order by is_verified first, then rank_score
        return queryset.order_by('-is_verified', '-rank_score', '-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save()
        return super().retrieve(request, *args, **kwargs)

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
