from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet,
    ReviewViewSet,
    PropertyListingRequestViewSet,
    OfferViewSet,
    PropertyOwnershipDocumentViewSet,
)

router = DefaultRouter()
router.register(r'requests', PropertyListingRequestViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'offers', OfferViewSet)
router.register(r'ownership-documents', PropertyOwnershipDocumentViewSet)
router.register(r'', PropertyViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
