from django.contrib import admin
from .models import Schedule, EmployeeSchedule

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['name', 'entry_time', 'exit_time', 'tolerance_minutes', 'is_default']
    list_filter = ['is_default']

@admin.register(EmployeeSchedule)
class EmployeeScheduleAdmin(admin.ModelAdmin):
    list_display = ['employee', 'schedule', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active', 'schedule']
    date_hierarchy = 'start_date'
