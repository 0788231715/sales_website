from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import KYCRequestViewSet

router = DefaultRouter()
router.register(r'kyc', KYCRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
