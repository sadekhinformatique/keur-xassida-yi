from rest_framework import serializers
from .models import QRSession


class QRSessionSerializer(serializers.ModelSerializer):
    qr_data = serializers.SerializerMethodField()

    class Meta:
        model = QRSession
        fields = ['id', 'token', 'generated_by', 'valid_from', 'valid_until', 'is_active', 'qr_data', 'created_at']
        read_only_fields = ['id', 'token', 'generated_by', 'signature', 'created_at']

    def get_qr_data(self, obj):
        return obj.get_qr_data()


class QRGenerateSerializer(serializers.Serializer):
    duration_seconds = serializers.IntegerField(default=30, min_value=5, max_value=300)
