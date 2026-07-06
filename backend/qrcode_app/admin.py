from django.contrib import admin
from .models import QRSession

@admin.register(QRSession)
class QRSessionAdmin(admin.ModelAdmin):
    list_display = ['token', 'generated_by', 'valid_from', 'valid_until', 'is_active']
    list_filter = ['is_active', 'valid_from']
    readonly_fields = ['token', 'signature', 'created_at']
