from rest_framework import viewsets, filters, generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Employee, Department, Service
from .serializers import (
    EmployeeListSerializer, EmployeeDetailSerializer,
    DepartmentSerializer, ServiceSerializer
)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']
    filterset_fields = ['department']


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('department', 'service').all()
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['nom', 'prenom', 'matricule', 'email', 'telephone']
    filterset_fields = ['department', 'service', 'statut', 'sexe']
    ordering_fields = ['nom', 'prenom', 'matricule', 'date_embauche']

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EmployeeByDepartmentView(generics.ListAPIView):
    serializer_class = EmployeeListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(department_id=self.kwargs['pk'])
