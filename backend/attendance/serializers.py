from rest_framework import serializers
from .models import Attendance, AttendanceLog


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_matricule = serializers.CharField(source='employee.matricule', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    photo = serializers.ImageField(source='employee.photo', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'ip_address']


class CheckInSerializer(serializers.Serializer):
    qr_token = serializers.UUIDField()
    gps_latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    gps_longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    device_info = serializers.CharField(required=False, allow_blank=True)


class CheckOutSerializer(serializers.Serializer):
    attendance_id = serializers.IntegerField()
    gps_latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    gps_longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)


class AttendanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLog
        fields = '__all__'
