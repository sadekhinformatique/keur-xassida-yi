from django.urls import path
from . import views

urlpatterns = [
    path('', views.CompanySettingsViewSet.as_view({'get': 'list', 'post': 'create'}), name='settings'),
]
