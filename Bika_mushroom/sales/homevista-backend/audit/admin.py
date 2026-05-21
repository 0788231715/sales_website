from django.contrib import admin
from django.utils.html import format_html
from .models import AuditEvent

@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ('colored_action', 'resource_tag', 'resource_id', 'user_email', 'timestamp')
    list_filter = ('action', 'resource', 'timestamp')
    search_fields = ('resource_id', 'user__email')
    readonly_fields = ('timestamp', 'changes', 'ip_address', 'user', 'action', 'resource', 'resource_id')
    
    def colored_action(self, obj):
        color = '#333'
        if 'CREATED' in obj.action: color = '#28a745'
        elif 'DELETED' in obj.action: color = '#dc3545'
        elif 'UPDATED' in obj.action: color = '#007bff'
        return format_html('<span style="font-family: monospace; color: {}; font-weight: bold;">{}</span>', color, obj.action)
    colored_action.short_description = 'Action'

    def resource_tag(self, obj):
        return format_html('<span style="background: #eee; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>', obj.resource)
    resource_tag.short_description = 'Resource'

    def user_email(self, obj):
        return obj.user.email if obj.user else "System"
    user_email.short_description = 'Performed By'

    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None): return False
