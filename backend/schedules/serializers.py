from rest_framework import serializers
from .models import Schedule, EmployeeSchedule


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'


class EmployeeScheduleSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    schedule_name = serializers.CharField(source='schedule.name', read_only=True)

    class Meta:
        model = EmployeeSchedule
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
