from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyInteractionViewSet, AnalyticsViewSet

router = DefaultRouter()
router.register(r'interactions', PropertyInteractionViewSet)
router.register(r'', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
