from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/schedules/', include('schedules.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/qr-session/', include('qrcode_app.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/settings/', include('settings_app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
