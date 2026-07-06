from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.ScheduleViewSet, basename='schedules')

urlpatterns = [
    path('assignments/', views.EmployeeScheduleViewSet.as_view({'get': 'list', 'post': 'create'}), name='schedule-assignments'),
    path('assignments/<int:pk>/', views.EmployeeScheduleViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='schedule-assignment-detail'),
    path('', include(router.urls)),
]
