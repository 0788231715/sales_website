from rest_framework import viewsets, permissions
from .models import AuditEvent
from .serializers import AuditEventSerializer

class AuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditEvent.objects.all()
    serializer_class = AuditEventSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        # Allow admins to filter by user or resource
        queryset = AuditEvent.objects.all()
        user_id = self.request.query_params.get('user_id')
        resource = self.request.query_params.get('resource')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if resource:
            queryset = queryset.filter(resource=resource)
        return queryset
