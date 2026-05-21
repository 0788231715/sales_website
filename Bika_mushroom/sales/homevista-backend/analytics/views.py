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
        from audit.models import AuditEvent
        from audit.serializers import AuditEventSerializer

        total_users = User.objects.count()
        total_properties = Property.objects.count()
        active_bookings = Booking.objects.exclude(status__in=['CANCELLED', 'REJECTED']).count()
        
        # Revenue Calculation: Sum of prices of properties in COMPLETED bookings
        total_revenue = Booking.objects.filter(status='COMPLETED').aggregate(total=Sum('property__price'))['total'] or 0
        
        # Simulated cost and profit (Standard business logic: 20% cost, 80% profit on service fees)
        estimated_profit = float(total_revenue) * 0.05 # Assume 5% platform fee
        estimated_cost = estimated_profit * 0.15 # 10% of profit as platform cost

        # Platform Growth (Last 30 days)
        platform_growth = PropertyInteraction.objects.annotate(date=TruncDate('timestamp')).values('date').annotate(count=Count('id')).order_by('date')[:30]
        
        # User Distribution
        user_distribution = User.objects.values('role').annotate(count=Count('id'))

        # Recent Activity (Audit Logs)
        recent_activity = AuditEvent.objects.all()[:10]
        
        # Pending Requests
        pending_kyc = KYCRequest.objects.filter(status='PENDING').count()
        pending_payments = Booking.objects.filter(payment_proof_status='PENDING').exclude(payment_proof='').count()

        return Response({
            "metrics": {
                "total_users": total_users,
                "total_properties": total_properties,
                "active_bookings": active_bookings,
                "total_revenue": total_revenue,
                "estimated_profit": estimated_profit,
                "estimated_cost": estimated_cost,
                "pending_kyc": pending_kyc,
                "pending_payments": pending_payments
            },
            "charts": {
                "growth": platform_growth,
                "user_distribution": user_distribution,
                "financials": [
                    {"name": "Revenue", "value": float(total_revenue)},
                    {"name": "Profit", "value": estimated_profit},
                    {"name": "Cost", "value": estimated_cost}
                ]
            },
            "recent_activity": AuditEventSerializer(recent_activity, many=True).data
        })

    @action(detail=False, methods=['get'])
    def generate_report(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        
        from django.http import HttpResponse
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        from io import BytesIO
        from users.models import User
        from datetime import datetime
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        p.setFont("Helvetica-Bold", 18)
        p.drawString(100, 750, "HOMEVISTA - ENTERPRISE STATUS REPORT")
        p.setFont("Helvetica", 12)
        p.drawString(100, 730, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        
        # Stats
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, 690, "System Overview")
        p.setFont("Helvetica", 12)
        p.drawString(100, 670, f"Total Users: {User.objects.count()}")
        p.drawString(100, 650, f"Total Properties: {Property.objects.count()}")
        p.drawString(100, 630, f"Completed Bookings: {Booking.objects.filter(status='COMPLETED').count()}")
        
        revenue = Booking.objects.filter(status='COMPLETED').aggregate(total=Sum('property__price'))['total'] or 0
        p.drawString(100, 610, f"Gross Platform Volume: ${revenue:,.2f}")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

    @action(detail=False, methods=['post'])
    def resolve_all_kyc(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        
        from verification.models import KYCRequest
        pending = KYCRequest.objects.filter(status='PENDING')
        count = pending.count()
        for kyc in pending:
            kyc.status = 'APPROVED'
            kyc.save()
            user = kyc.user
            user.kyc_status = 'VERIFIED'
            if user.role == 'OWNER':
                user.is_verified_owner = True
            user.save()
            
        return Response({"status": f"Successfully resolved {count} KYC requests"})
