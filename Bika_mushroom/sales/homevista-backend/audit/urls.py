from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditEventViewSet

router = DefaultRouter()
router.register(r'logs', AuditEventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
