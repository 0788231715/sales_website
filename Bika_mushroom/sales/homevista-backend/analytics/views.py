from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Sum, Avg, F
from django.db.models.functions import TruncDate
from .models import PropertyInteraction, UserPreference
from .serializers import PropertyInteractionSerializer, UserPreferenceSerializer
from properties.models import Property
from bookings.models import Booking

class PropertyInteractionViewSet(viewsets.ModelViewSet):
    queryset = PropertyInteraction.objects.all()
    serializer_class = PropertyInteractionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(
            user=user,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
        
        # Increment property view count if it's a VIEW interaction
        interaction_type = self.request.data.get('interaction_type', 'VIEW')
        if interaction_type == 'VIEW':
            prop_id = self.request.data.get('property')
            if prop_id:
                Property.objects.filter(id=prop_id).update(views_count=F('views_count') + 1)

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def owner_dashboard(self, request):
        if request.user.role not in ['OWNER', 'ADMIN']:
            return Response({"error": "Unauthorized"}, status=403)
        
        user_properties = Property.objects.filter(owner=request.user)
        property_ids = user_properties.values_list('id', flat=True)
        
        # 1. Total Views
        total_views = user_properties.aggregate(total=Sum('views_count'))['total'] or 0
        
        # 2. Daily Interaction Chart (last 30 days)
        daily_interactions = PropertyInteraction.objects.filter(
            property_id__in=property_ids
        ).annotate(date=TruncDate('timestamp')).values('date').annotate(count=Count('id')).order_by('date')
        
        # 3. Conversion Rate (Views to Bookings)
        total_bookings = Booking.objects.filter(property_id__in=property_ids).count()
        conversion_rate = (total_bookings / total_views * 100) if total_views > 0 else 0
        
        # 4. Property Ranking
        property_ranking = user_properties.values('title', 'views_count').order_by('-views_count')[:5]
        
        return Response({
            "total_views": total_views,
            "total_bookings": total_bookings,
            "conversion_rate": round(conversion_rate, 2),
            "daily_interactions": daily_interactions,
            "property_ranking": property_ranking
        })

    @action(detail=False, methods=['get'])
    def admin_stats(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        
        from users.models import User
        return Response({
            "total_users": User.objects.count(),
            "total_properties": Property.objects.count(),
            "active_bookings": Booking.objects.exclude(status__in=['CANCELLED', 'REJECTED']).count(),
            "platform_growth": PropertyInteraction.objects.annotate(date=TruncDate('timestamp')).values('date').annotate(count=Count('id')).order_by('date')[:30]
        })
