from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('users/', views.UserListView.as_view(), name='auth-users'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='auth-user-detail'),
    path('me/', views.MeView.as_view(), name='auth-me'),
    path('change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
