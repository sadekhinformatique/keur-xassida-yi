from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import CompanySettings
from .serializers import CompanySettingsSerializer


class CompanySettingsViewSet(viewsets.ModelViewSet):
    queryset = CompanySettings.objects.all()
    serializer_class = CompanySettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        settings = CompanySettings.get_settings()
        return Response(CompanySettingsSerializer(settings).data)

    def create(self, request):
        settings = CompanySettings.get_settings()
        serializer = CompanySettingsSerializer(
            settings, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
