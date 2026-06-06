from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Contract, ContractTemplate, SignatureLog
from .serializers import ContractSerializer, ContractTemplateSerializer
from audit.models import AuditEvent
from django.db import models

class ContractTemplateViewSet(viewsets.ModelViewSet):
    queryset = ContractTemplate.objects.all()
    serializer_class = ContractTemplateSerializer
    permission_classes = [permissions.IsAdminUser]

class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Contract.objects.all()
        return Contract.objects.filter(
            models.Q(booking__customer=user) | models.Q(booking__property__owner=user)
        )

    @action(detail=True, methods=['post'])
    def sign_contract(self, request, pk=None):
        contract = self.get_object()
        user = request.user
        signature = request.data.get('signature') # Base64 string

        if not signature:
            return Response({"error": "Signature is required"}, status=400)

        if contract.status == 'SIGNED':
            return Response({"error": "Contract is already fully signed and locked."}, status=400)

        # Determine side and validate
        is_customer = user == contract.booking.customer
        is_owner = user == contract.booking.property.owner
        
        if not (is_customer or is_owner or user.role == 'ADMIN'):
            return Response({"error": "Unauthorized to sign this contract."}, status=403)

        if is_customer:
            if contract.customer_signature:
                return Response({"error": "You have already signed this contract."}, status=400)
            contract.customer_signature = signature
        elif is_owner:
            if contract.owner_signature:
                return Response({"error": "You have already signed this contract."}, status=400)
            contract.owner_signature = signature
        elif user.role == 'ADMIN':
            # Admin can sign on behalf of missing party if needed (rare case, but allowed for flexibility)
            side = request.data.get('side')
            if side == 'customer':
                contract.customer_signature = signature
            elif side == 'owner':
                contract.owner_signature = signature
            else:
                return Response({"error": "Admin must specify 'side' (customer/owner)"}, status=400)

        contract.save()

        # Log Signature
        SignatureLog.objects.create(
            contract=contract,
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )

        # Audit Event
        AuditEvent.objects.create(
            user=user,
            action="CONTRACT_SIGNED",
            resource="Contract",
            resource_id=str(contract.id),
            changes={"side": "CUSTOMER" if is_customer else "OWNER" if is_owner else "ADMIN"}
        )

        # Check if both signed to transition state
        if contract.customer_signature and contract.owner_signature:
            contract.status = 'SIGNED'
            contract.save()
            
            # Update Booking status
            booking = contract.booking
            booking.status = 'COMPLETED'
            booking.save()
            
            # Send Notifications
            from notifications.models import Notification
            for recipient in [booking.customer, booking.property.owner]:
                Notification.objects.create(
                    user=recipient,
                    title="Contract Fully Signed",
                    body=f"The contract for {booking.property.title} is now fully signed and the sale is completed."
                )

            # Trigger PDF Generation
            try:
                from .tasks import generate_contract_pdf
                generate_contract_pdf.delay(contract.id)
            except ImportError:
                # Fallback if celery/tasks not setup
                pass

        return Response({"status": "Signed successfully", "contract_status": contract.status})

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        contract = self.get_object()
        if not contract.signed_pdf:
            return Response({"error": "Signed contract PDF is not available."}, status=404)

        response = HttpResponse(contract.signed_pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=contract_{contract.id}.pdf'
        return response
