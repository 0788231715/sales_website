from rest_framework import viewsets, serializers, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import KYCRequest
from users.models import User

class KYCRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCRequest
        fields = '__all__'
        read_only_fields = ('user', 'status', 'admin_comment')

class KYCRequestViewSet(viewsets.ModelViewSet):
    queryset = KYCRequest.objects.all()
    serializer_class = KYCRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return KYCRequest.objects.all()
        return KYCRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        user = self.request.user
        user.kyc_status = 'PENDING'
        user.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        kyc = self.get_object()
        kyc.status = 'APPROVED'
        kyc.save()
        
        user = kyc.user
        user.kyc_status = 'VERIFIED'
        if user.role == 'OWNER':
            user.is_verified_owner = True
        user.trust_score = 100
        user.save()
        
        return Response({"status": "KYC Approved and User Verified"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        kyc = self.get_object()
        kyc.status = 'REJECTED'
        kyc.admin_comment = request.data.get('comment', 'Identity documents were unclear or invalid.')
        kyc.save()
        
        user = kyc.user
        user.kyc_status = 'REJECTED'
        user.save()
        
        return Response({"status": "KYC Rejected"})
