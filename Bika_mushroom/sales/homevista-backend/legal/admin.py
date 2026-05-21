from django.contrib import admin
from .models import Contract, ContractTemplate, SignatureLog

@admin.register(ContractTemplate)
class ContractTemplateAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('booking', 'status', 'version', 'created_at')
    list_filter = ('status',)
    search_fields = ('booking__property__title',)

@admin.register(SignatureLog)
class SignatureLogAdmin(admin.ModelAdmin):
    list_display = ('contract', 'user', 'timestamp', 'ip_address')
    readonly_fields = ('timestamp',)
