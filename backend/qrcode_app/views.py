from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import QRSession
from .serializers import QRSessionSerializer, QRGenerateSerializer


class QRSessionViewSet(viewsets.ModelViewSet):
    queryset = QRSession.objects.all()
    serializer_class = QRSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-created_at']

    def perform_create(self, serializer):
        duration = self.request.data.get('duration_seconds', 30)
        valid_until = timezone.now() + timedelta(seconds=int(duration))
        serializer.save(
            generated_by=self.request.user,
            valid_until=valid_until
        )

    @action(detail=False, methods=['post'])
    def generate(self, request):
        serializer = QRGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        duration = serializer.validated_data['duration_seconds']

        # Deactivate old active sessions
        QRSession.objects.filter(
            generated_by=request.user, is_active=True
        ).update(is_active=False)

        qr_session = QRSession.objects.create(
            generated_by=request.user,
            valid_until=timezone.now() + timedelta(seconds=duration),
        )

        return Response(
            QRSessionSerializer(qr_session).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def active(self, request):
        qr_session = QRSession.objects.filter(
            is_active=True,
            valid_until__gt=timezone.now()
        ).first()

        if qr_session:
            return Response(QRSessionSerializer(qr_session).data)

        return Response(
            {'message': 'Aucun QR Code actif'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        qr_session = self.get_object()
        qr_session.is_active = False
        qr_session.save()
        return Response({'message': 'QR Code désactivé'})

    @action(detail=False, methods=['post'])
    def verify(self, request):
        token = request.data.get('token')
        signature = request.data.get('signature')
        date_str = request.data.get('date')

        if not all([token, signature, date_str]):
            return Response(
                {'valid': False, 'error': 'Données incomplètes'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_valid = QRSession.verify_qr_data(
            str(token), date_str, signature
        )

        if not is_valid:
            return Response(
                {'valid': False, 'error': 'Signature invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = QRSession.objects.get(
                token=token, is_active=True
            )
            if session.is_expired():
                return Response(
                    {'valid': False, 'error': 'QR Code expiré'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except QRSession.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Session invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'valid': True})
