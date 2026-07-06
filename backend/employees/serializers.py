from rest_framework import serializers
from .models import Employee, Department, Service


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class EmployeeListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'photo', 'nom', 'prenom', 'full_name', 'matricule', 'sexe',
                  'department_name', 'service_name', 'fonction', 'telephone', 'email',
                  'statut', 'date_embauche']
        read_only_fields = ['id']


class EmployeeDetailSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class EmployeeImportSerializer(serializers.Serializer):
    file = serializers.FileField()
