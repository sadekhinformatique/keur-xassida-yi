from rest_framework import viewsets, permissions
from .models import Schedule, EmployeeSchedule
from .serializers import ScheduleSerializer, EmployeeScheduleSerializer


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']


class EmployeeScheduleViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSchedule.objects.select_related('employee', 'schedule').all()
    serializer_class = EmployeeScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['employee', 'schedule', 'is_active']
