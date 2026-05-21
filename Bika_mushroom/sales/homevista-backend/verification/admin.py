from django.contrib import admin
from django.utils.html import format_html
from .models import KYCRequest

@admin.register(KYCRequest)
class KYCRequestAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'doc_preview', 'colored_status', 'created_at')
    list_filter = ('status',)
    actions = ['approve_kyc', 'reject_kyc']

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'

    def doc_preview(self, obj):
        if obj.id_document:
            return format_html('<a href="{}" target="_blank"><img src="{}" style="max-height: 50px; border: 1px solid #ddd; border-radius: 4px;"/></a>', obj.id_document.url, obj.id_document.url)
        return "No Document"
    doc_preview.short_description = 'ID Document'

    def colored_status(self, obj):
        colors = {'APPROVED': '#28a745', 'REJECTED': '#dc3545', 'PENDING': '#ffc107'}
        return format_html('<span style="background: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">{}</span>', colors.get(obj.status, '#777'), obj.status)
    colored_status.short_description = 'Status'

    def approve_kyc(self, request, queryset):
        for kyc in queryset:
            kyc.status = 'APPROVED'
            kyc.save()
            user = kyc.user
            user.kyc_status = 'VERIFIED'
            if user.role == 'OWNER':
                user.is_verified_owner = True
            user.trust_score = 100
            user.save()
    approve_kyc.short_description = "✅ Approve selected KYC requests"

    def reject_kyc(self, request, queryset):
        queryset.update(status='REJECTED')
    reject_kyc.short_description = "❌ Reject selected KYC requests"
