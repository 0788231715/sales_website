from django.contrib import admin
from django.utils.html import format_html
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('property_title', 'customer_link', 'date_time', 'colored_status', 'proof_view', 'created_at')
    list_filter = ('status', 'payment_proof_status', 'date')
    search_fields = ('property__title', 'customer__email')
    actions = ['approve_payment', 'reject_payment']

    def property_title(self, obj):
        return obj.property.title
    property_title.short_description = 'Property'

    def customer_link(self, obj):
        return format_html('<a href="/admin/users/user/{}/change/">{}</a>', obj.customer.id, obj.customer.email)
    customer_link.short_description = 'Customer'

    def date_time(self, obj):
        return format_html('<span style="color: #666;">{} at {}</span>', obj.date, obj.time)
    date_time.short_description = 'Schedule'

    def colored_status(self, obj):
        colors = {'COMPLETED': '#28a745', 'CANCELLED': '#dc3545', 'PENDING': '#ffc107', 'APPROVED': '#007bff'}
        return format_html('<strong style="color: {};">{}</strong>', colors.get(obj.status, '#777'), obj.status)
    colored_status.short_description = 'Status'

    def proof_view(self, obj):
        if obj.payment_proof:
            return format_html('<a href="{}" target="_blank">🖼️ View Proof</a>', obj.payment_proof.url)
        return format_html('<span style="color: #ccc;">No Proof</span>')
    proof_view.short_description = 'Payment'

    def approve_payment(self, request, queryset):
        queryset.update(payment_proof_status='APPROVED')
    approve_payment.short_description = "💵 Approve Payment Proofs"

    def reject_payment(self, request, queryset):
        queryset.update(payment_proof_status='REJECTED')
    reject_payment.short_description = "🚫 Reject Payment Proofs"
