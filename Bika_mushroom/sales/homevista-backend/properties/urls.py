from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, ReviewViewSet

router = DefaultRouter()
router.register(r'', PropertyViewSet)
router.register(r'reviews', ReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
