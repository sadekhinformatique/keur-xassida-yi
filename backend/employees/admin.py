from django.contrib import admin
from .models import Employee, Department, Service

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'department']
    list_filter = ['department']
    search_fields = ['name']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['matricule', 'nom', 'prenom', 'department', 'fonction', 'statut']
    list_filter = ['department', 'service', 'statut', 'sexe']
    search_fields = ['nom', 'prenom', 'matricule', 'telephone', 'email']
    date_hierarchy = 'date_embauche'
