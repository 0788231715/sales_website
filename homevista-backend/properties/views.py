from django.db.models import F, ExpressionWrapper, FloatField
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Property, PropertyImage, Review, PropertyListingRequest, PropertyListingRequestImage, Favorite
from .serializers import PropertySerializer, PropertyImageSerializer, ReviewSerializer, PropertyListingRequestSerializer

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'bedrooms', 'bathrooms', 'price']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['price', 'created_at', 'views_count']

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(
            rank_score=ExpressionWrapper(
                (F('views_count') * 0.3) + 
                (F('engagement_rate') * 0.5),
                output_field=FloatField()
            )
        )
        return queryset.order_by('-is_verified', '-rank_score', '-created_at')

    def perform_create(self, serializer):
        if self.request.user.role == 'ADMIN' and 'owner' in self.request.data:
            property_instance = serializer.save()
        else:
            property_instance = serializer.save(owner=self.request.user)
            
        # Handle multiple images
        images = self.request.FILES.getlist('images')
        for i, image in enumerate(images):
            PropertyImage.objects.create(
                property=property_instance,
                image=image,
                is_main=(i == 0)
            )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save()
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_favorite(self, request, pk=None):
        property_instance = self.get_object()
        favorite, created = Favorite.objects.get_or_create(user=request.user, property=property_instance)
        
        if not created:
            favorite.delete()
            return Response({'status': 'unfavorited', 'is_favorite': False})
        
        return Response({'status': 'favorited', 'is_favorite': True})

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PropertyListingRequestViewSet(viewsets.ModelViewSet):
    queryset = PropertyListingRequest.objects.all()
    serializer_class = PropertyListingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return PropertyListingRequest.objects.all()
        return PropertyListingRequest.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        request_instance = serializer.save(owner=self.request.user)
        
        # Handle multiple images for request
        images = self.request.FILES.getlist('images')
        for image in images:
            PropertyListingRequestImage.objects.create(
                request=request_instance,
                image=image
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        listing_request = self.get_object()
        if listing_request.status != 'PENDING':
            return Response({'error': 'Request is already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the property
        prop = Property.objects.create(
            title=listing_request.title,
            description=listing_request.description,
            price=listing_request.price,
            currency=listing_request.currency,
            address=listing_request.address,
            bedrooms=listing_request.bedrooms,
            bathrooms=listing_request.bathrooms,
            size=listing_request.size,
            owner=listing_request.owner,
            status='AVAILABLE',
            is_verified=True
        )
        
        # Copy images from request to property
        for i, req_img in enumerate(listing_request.images.all()):
            PropertyImage.objects.create(
                property=prop,
                image=req_img.image,
                is_main=(i == 0)
            )
        
        listing_request.status = 'APPROVED'
        listing_request.save()
        
        return Response({
            'status': 'Request approved and property created',
            'property_id': prop.id
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        listing_request = self.get_object()
        if listing_request.status != 'PENDING':
            return Response({'error': 'Request is already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        admin_comment = request.data.get('admin_comment', '')
        listing_request.status = 'REJECTED'
        listing_request.admin_comment = admin_comment
        listing_request.save()
        
        return Response({'status': 'Request rejected'})
