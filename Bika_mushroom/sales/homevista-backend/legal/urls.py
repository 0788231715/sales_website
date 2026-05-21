from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContractViewSet, ContractTemplateViewSet

router = DefaultRouter()
router.register(r'templates', ContractTemplateViewSet)
router.register(r'', ContractViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
