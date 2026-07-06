from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.EmployeeViewSet, basename='employees')

urlpatterns = [
    path('departments/', views.DepartmentViewSet.as_view({'get': 'list', 'post': 'create'}), name='departments'),
    path('departments/<int:pk>/', views.DepartmentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='department-detail'),
    path('departments/<int:pk>/employees/', views.EmployeeByDepartmentView.as_view(), name='department-employees'),
    path('services/', views.ServiceViewSet.as_view({'get': 'list', 'post': 'create'}), name='services'),
    path('services/<int:pk>/', views.ServiceViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='service-detail'),
    path('', include(router.urls)),
]
