from django.db.models import Q, F, ExpressionWrapper, FloatField
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from analytics.models import PropertyInteraction
from notifications.models import Notification
from legal.models import Contract, ContractTemplate
from .models import Property, PropertyImage, Review, PropertyListingRequest, PropertyListingRequestImage, Favorite, Offer, PropertyOwnershipDocument
from .serializers import (
    PropertySerializer,
    PropertyImageSerializer,
    ReviewSerializer,
    PropertyListingRequestSerializer,
    OfferSerializer,
    PropertyOwnershipDocumentSerializer,
)

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
    filterset_fields = ['status', 'property_type', 'ownership_status', 'bedrooms', 'bathrooms', 'price']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['price', 'created_at', 'views_count']

    def get_queryset(self):
        queryset = super().get_queryset().select_related('owner').prefetch_related('images', 'bookings')
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
        remote_addr = request.META.get('REMOTE_ADDR')
        user = request.user if request.user.is_authenticated else None
        today = timezone.now().date()
        interaction_exists = PropertyInteraction.objects.filter(
            property=instance,
            interaction_type='VIEW',
            timestamp__date=today
        )
        if user:
            interaction_exists = interaction_exists.filter(user=user)
        else:
            interaction_exists = interaction_exists.filter(ip_address=remote_addr)

        if not interaction_exists.exists():
            PropertyInteraction.objects.create(
                property=instance,
                user=user,
                interaction_type='VIEW',
                ip_address=remote_addr,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            Property.objects.filter(id=instance.id).update(views_count=F('views_count') + 1)

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
            property_type=listing_request.property_type,
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


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.select_related('property', 'buyer', 'seller', 'previous_offer')
    serializer_class = OfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            queryset = Offer.objects.all()
        else:
            queryset = Offer.objects.filter(Q(buyer=user) | Q(seller=user))

        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(property_id=property_id)

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status.upper())

        return queryset.select_related('property', 'buyer', 'seller')

    def perform_create(self, serializer):
        offer_property = serializer.validated_data['property']
        offer = serializer.save(
            buyer=self.request.user,
            seller=offer_property.owner,
            status='PENDING'
        )

        if offer_property.status == 'AVAILABLE':
            offer_property.status = 'UNDER_OFFER'
            offer_property.save(update_fields=['status'])

        Notification.objects.create(
            user=offer.seller,
            title='New Offer Received',
            body=f'{self.request.user.full_name} submitted an offer for {offer_property.title}.'
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        from django.db import transaction
        offer = self.get_object()
        
        if request.user != offer.seller and request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if offer.status != 'PENDING':
            return Response({'error': 'Only pending offers can be accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        prop = offer.property
        
        # CRITICAL: Ownership Verification Check
        if prop.ownership_status != 'VERIFIED':
            return Response({
                'error': 'Property ownership must be VERIFIED before accepting an offer.',
                'ownership_status': prop.ownership_status
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            offer.status = 'ACCEPTED'
            offer.save()

            if prop.property_type in ['SALE', 'RENT_TO_OWN']:
                prop.status = 'UNDER_CONTRACT'
            else:
                prop.status = 'BOOKED'
            prop.save(update_fields=['status'])

            # Atomic Transition: Reject all other pending offers for this property
            Offer.objects.filter(property=prop, status='PENDING').exclude(id=offer.id).update(status='REJECTED')

            booking = Booking.objects.create(
                property=prop,
                customer=offer.buyer,
                offer=offer,
                status='FINALIZING',
                owner_confirmed=True,
                notes=f'Booking created from accepted offer {offer.id}'
            )

            contract = None
            template = ContractTemplate.objects.filter(is_active=True).first()
            if template:
                contract = Contract.objects.create(booking=booking, template=template)

            Notification.objects.create(
                user=offer.buyer,
                title='Offer Accepted',
                body=f'Your offer on {prop.title} was accepted. The sale process is now under contract.'
            )

        return Response({
            'status': 'Offer accepted',
            'booking_id': booking.id,
            'contract_id': contract.id if contract else None,
            'property_status': prop.status,
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        offer = self.get_object()
        if request.user != offer.seller and request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if offer.status != 'PENDING':
            return Response({'error': 'Only pending offers can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        offer.status = 'REJECTED'
        offer.save()

        prop = offer.property
        if not Offer.objects.filter(property=prop, status='PENDING').exists() and prop.status == 'UNDER_OFFER':
            prop.status = 'AVAILABLE'
            prop.save(update_fields=['status'])

        Notification.objects.create(
            user=offer.buyer,
            title='Offer Rejected',
            body=f'Your offer for {prop.title} was rejected by the seller.'
        )

        return Response({'status': 'Offer rejected'})

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        offer = self.get_object()
        if request.user != offer.buyer and request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if offer.status != 'PENDING':
            return Response({'error': 'Only pending offers can be withdrawn.'}, status=status.HTTP_400_BAD_REQUEST)

        offer.status = 'WITHDRAWN'
        offer.save()

        Notification.objects.create(
            user=offer.seller,
            title='Offer Withdrawn',
            body=f'{request.user.full_name} withdrew their offer for {offer.property.title}.'
        )

        return Response({'status': 'Offer withdrawn'})

    @action(detail=True, methods=['post'])
    def counter(self, request, pk=None):
        parent_offer = self.get_object()
        if request.user not in [parent_offer.buyer, parent_offer.seller] and request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if parent_offer.status not in ['PENDING', 'COUNTERED']:
            return Response({'error': 'Only active offers can be countered.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = request.data.get('amount')
        message = request.data.get('message', '')
        expires_at = request.data.get('expires_at')

        if amount is None:
            return Response({'error': 'Amount is required for a counter-offer.'}, status=status.HTTP_400_BAD_REQUEST)

        counter_offer = Offer.objects.create(
            property=parent_offer.property,
            buyer=parent_offer.buyer,
            seller=parent_offer.seller,
            previous_offer=parent_offer,
            amount=amount,
            currency=parent_offer.currency,
            message=message,
            status='PENDING',
            expires_at=expires_at,
        )

        parent_offer.status = 'COUNTERED'
        parent_offer.save()

        recipient = parent_offer.seller if request.user == parent_offer.buyer else parent_offer.buyer
        Notification.objects.create(
            user=recipient,
            title='Counter Offer Submitted',
            body=f'A counter-offer has been submitted for {parent_offer.property.title}.'
        )

        return Response({'status': 'Counter-offer created', 'offer_id': counter_offer.id})


class PropertyOwnershipDocumentViewSet(viewsets.ModelViewSet):
    queryset = PropertyOwnershipDocument.objects.all()
    serializer_class = PropertyOwnershipDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return PropertyOwnershipDocument.objects.select_related('property', 'uploaded_by')
        return PropertyOwnershipDocument.objects.filter(property__owner=user).select_related('property', 'uploaded_by')

    def perform_create(self, serializer):
        property_instance = serializer.validated_data['property']
        if property_instance.owner != self.request.user:
            raise permissions.PermissionDenied('Only the property owner may upload ownership documents.')

        document = serializer.save(uploaded_by=self.request.user)
        property_instance.ownership_documents_submitted = True
        property_instance.save(update_fields=['ownership_documents_submitted'])
        Notification.objects.create(
            user=self.request.user,
            title='Ownership Document Uploaded',
            body=f'Ownership documentation was uploaded for {property_instance.title}. Awaiting verification.'
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        document = self.get_object()
        document.status = 'VERIFIED'
        document.admin_comment = request.data.get('comment', '')
        document.save()

        prop = document.property
        prop.ownership_status = 'VERIFIED'
        prop.save(update_fields=['ownership_status'])

        Notification.objects.create(
            user=prop.owner,
            title='Ownership Verified',
            body=f'Ownership documentation for {prop.title} has been verified.'
        )

        return Response({'status': 'Document approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        document = self.get_object()
        document.status = 'REJECTED'
        document.admin_comment = request.data.get('comment', 'Ownership documentation did not meet verification criteria.')
        document.save()

        prop = document.property
        prop.ownership_status = 'REJECTED'
        prop.save(update_fields=['ownership_status'])

        Notification.objects.create(
            user=prop.owner,
            title='Ownership Verification Rejected',
            body=f'Ownership documentation for {prop.title} has been rejected. Review the admin comments.'
        )

        return Response({'status': 'Document rejected'})
