from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Recommendation
from .serializers import RecommendationSerializer
from properties.models import Property
from properties.serializers import PropertySerializer

class AIViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def suggested_for_you(self, request):
        # In a real app, this would use a machine learning model or complex DB query
        # For now, we simulate by showing properties that match user's role or recent views
        recommended = Property.objects.filter(status='AVAILABLE').order_by('-views_count')[:6]
        serializer = PropertySerializer(recommended, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def similar_properties(self, request, pk=None):
        try:
            target = Property.objects.get(pk=pk)
            similar = Property.objects.filter(
                status='AVAILABLE',
                bedrooms__gte=target.bedrooms - 1,
                bedrooms__lte=target.bedrooms + 1
            ).exclude(pk=pk)[:4]
            return Response(PropertySerializer(similar, many=True).data)
        except Property.DoesNotExist:
            return Response({"error": "Property not found"}, status=404)

    @action(detail=False, methods=['post'])
    def generate_description(self, request):
        # Simulates an AI LLM generating a description based on house attributes
        title = request.data.get('title')
        beds = request.data.get('bedrooms')
        loc = request.data.get('address')
        
        description = f"Experience unparalleled luxury in this exquisite {beds}-bedroom residence located in the heart of {loc}. {title} offers a sophisticated blend of modern design and classic elegance, perfect for the discerning homeowner."
        
        return Response({"description": description})
