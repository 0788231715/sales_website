from django.contrib import admin
from django.utils.html import format_html
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'colored_role', 'colored_kyc_status', 'is_verified_owner', 'created_at')
    list_filter = ('role', 'kyc_status', 'is_verified_owner')
    search_fields = ('email', 'full_name')
    list_per_page = 20
    
    def colored_role(self, obj):
        colors = {
            'ADMIN': '#d9534f',
            'OWNER': '#5bc0de',
            'CUSTOMER': '#5cb85c',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px; font-weight: bold; font-size: 11px;">{}</span>',
            colors.get(obj.role, '#777'),
            obj.role
        )
    colored_role.short_description = 'Role'

    def colored_kyc_status(self, obj):
        colors = {
            'VERIFIED': '#5cb85c',
            'PENDING': '#f0ad4e',
            'REJECTED': '#d9534f',
            'UNVERIFIED': '#777',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">● {}</span>',
            colors.get(obj.kyc_status, '#777'),
            obj.kyc_status
        )
    colored_kyc_status.short_description = 'KYC Status'
