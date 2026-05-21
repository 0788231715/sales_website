from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Contract, ContractTemplate, SignatureLog
from .serializers import ContractSerializer, ContractTemplateSerializer
from audit.models import AuditEvent

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

        if user == contract.booking.customer:
            contract.customer_signature = signature
        elif user == contract.booking.property.owner:
            contract.owner_signature = signature
        else:
            return Response({"error": "Unauthorized"}, status=403)

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
            changes={"side": "CUSTOMER" if user == contract.booking.customer else "OWNER"}
        )

        # Check if both signed
        if contract.customer_signature and contract.owner_signature:
            contract.status = 'SIGNED'
            contract.save()
            from .tasks import generate_contract_pdf
            generate_contract_pdf.delay(contract.id)

        return Response({"status": "Signed successfully", "contract_status": contract.status})
