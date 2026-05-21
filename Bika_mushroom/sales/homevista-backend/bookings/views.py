from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer
from rest_framework.decorators import action
from notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Booking.objects.all()
        elif user.role == 'OWNER':
            return Booking.objects.filter(property__owner=user)
        return Booking.objects.filter(customer=user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['post'])
    def confirm_deal(self, request, pk=None):
        booking = self.get_object()
        
        # Prevent any changes if already completed, unless user is Admin
        if booking.status == 'COMPLETED' and request.user.role != 'ADMIN':
            return Response({"error": "Transaction already completed and locked."}, status=400)

        user = request.user
        
        # Optional: Save payment proof image if provided
        if 'payment_proof' in request.FILES:
            booking.payment_proof = request.FILES['payment_proof']

        # Determine if current user is owner or customer
        if user == booking.property.owner:
            booking.owner_confirmed = True
            other_party = booking.customer
        elif user == booking.customer:
            booking.customer_confirmed = True
            other_party = booking.property.owner
        else:
            return Response({"error": "Unauthorized"}, status=403)
        
        booking.save()
        finalized = booking.check_and_finalize()
        
        # Send Notification to the other party
        Notification.objects.create(
            user=other_party,
            title="Deal Confirmation Update",
            body=f"{user.full_name} has confirmed the deal for {booking.property.title}. " + 
                 ("Transaction Complete!" if finalized else "Waiting for your confirmation.")
        )
        
        return Response({
            "status": "Confirmed",
            "finalized": finalized,
            "owner_confirmed": booking.owner_confirmed,
            "customer_confirmed": booking.customer_confirmed
        })

    @action(detail=True, methods=['post'])
    def approve_payment(self, request, pk=None):
        booking = self.get_object()
        if request.user != booking.property.owner and request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        
        booking.payment_proof_status = 'APPROVED'
        booking.save()
        
        Notification.objects.create(
            user=booking.customer,
            title="Payment Approved",
            body=f"Your payment proof for {booking.property.title} has been approved."
        )
        return Response({"status": "Payment approved"})

    @action(detail=True, methods=['post'])
    def reject_payment(self, request, pk=None):
        booking = self.get_object()
        if request.user != booking.property.owner and request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        
        booking.payment_proof_status = 'REJECTED'
        booking.save()
        
        Notification.objects.create(
            user=booking.customer,
            title="Payment Rejected",
            body=f"Your payment proof for {booking.property.title} was rejected. Please upload a valid proof."
        )
        return Response({"status": "Payment rejected"})

    @action(detail=True, methods=['post'])
    def request_reversal(self, request, pk=None):
        booking = self.get_object()
        if booking.status != 'COMPLETED':
            return Response({"error": "Only completed transactions can be reversed."}, status=400)
        
        user = request.user
        if user == booking.property.owner:
            booking.owner_request_reversal = True
        elif user == booking.customer:
            booking.customer_request_reversal = True
        else:
            return Response({"error": "Unauthorized"}, status=403)
        
        booking.save()
        
        # Notify Admin
        admin_users = User.objects.filter(role='ADMIN')
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                title="Reversal Requested",
                body=f"Reversal requested for {booking.property.title} by {user.full_name}."
            )

        return Response({"status": "Reversal request recorded."})

    @action(detail=True, methods=['post'])
    def admin_reverse(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Admins can reverse transactions."}, status=403)
        
        booking = self.get_object()
        if not (booking.owner_request_reversal and booking.customer_request_reversal):
            return Response({"error": "Both parties must request reversal before Admin can proceed."}, status=400)
        
        # Reverse status
        booking.status = 'CANCELLED'
        booking.owner_confirmed = False
        booking.customer_confirmed = False
        booking.owner_request_reversal = False
        booking.customer_request_reversal = False
        booking.save()
        
        # Revert Property status
        prop = booking.property
        prop.status = 'AVAILABLE'
        prop.save()
        
        return Response({"status": "Transaction successfully reversed by Admin."})
