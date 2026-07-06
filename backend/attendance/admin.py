from django.contrib import admin
from .models import Attendance, AttendanceLog

class AttendanceLogInline(admin.TabularInline):
    model = AttendanceLog
    extra = 0
    readonly_fields = ['action', 'timestamp', 'details']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'check_in', 'check_out', 'status', 'check_in_method']
    list_filter = ['status', 'date', 'check_in_method']
    search_fields = ['employee__nom', 'employee__prenom', 'employee__matricule']
    date_hierarchy = 'date'
    inlines = [AttendanceLogInline]

@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ['attendance', 'action', 'timestamp']
    list_filter = ['action', 'timestamp']
    readonly_fields = ['attendance', 'action', 'timestamp', 'details']
