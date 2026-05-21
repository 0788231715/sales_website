from django.contrib import admin
from django.utils.html import format_html
from .models import Property, PropertyImage, Review

class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px; border-radius: 5px;"/>', obj.image.url)
        return "-"

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner_link', 'price_display', 'colored_status', 'is_verified', 'views_count', 'created_at')
    list_filter = ('status', 'is_verified', 'bedrooms', 'bathrooms')
    search_fields = ('title', 'address', 'owner__email')
    inlines = [PropertyImageInline]
    list_editable = ('is_verified', 'status')
    
    def owner_link(self, obj):
        return format_html('<a href="/admin/users/user/{}/change/">{}</a>', obj.owner.id, obj.owner.email)
    owner_link.short_description = 'Owner'

    def price_display(self, obj):
        return format_html('<strong style="color: #28a745;">${:,.2f}</strong>', obj.price)
    price_display.short_description = 'Price'

    def colored_status(self, obj):
        colors = {
            'AVAILABLE': '#28a745',
            'SOLD': '#dc3545',
            'BOOKED': '#007bff',
            'PENDING': '#ffc107',
            'RENTED': '#17a2b8',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, '#777'),
            obj.status
        )
    colored_status.short_description = 'Status'

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('property', 'user', 'stars', 'created_at')
    list_filter = ('rating',)
    
    def stars(self, obj):
        return format_html('<span style="color: #ffc107;">{}</span>', '★' * obj.rating + '☆' * (5 - obj.rating))
    stars.short_description = 'Rating'
