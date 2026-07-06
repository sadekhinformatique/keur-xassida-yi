import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib
import json


def get_fernet():
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


class QRSession(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    generated_by = models.ForeignKey('authentication.User', on_delete=models.CASCADE)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    signature = models.TextField(editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Session QR'
        verbose_name_plural = 'Sessions QR'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.valid_until:
            self.valid_until = timezone.now() + timedelta(seconds=30)
        if not self.signature:
            self.signature = self._generate_signature()
        super().save(*args, **kwargs)

    def _generate_signature(self):
        data = {
            'token': str(self.token),
            'date': self.valid_from.isoformat(),
            'valid_until': self.valid_until.isoformat(),
        }
        f = get_fernet()
        return f.encrypt(json.dumps(data).encode()).decode()

    def get_qr_data(self):
        return {
            'token': str(self.token),
            'date': self.valid_from.isoformat(),
            'signature': self.signature,
        }

    def is_expired(self):
        return timezone.now() > self.valid_until

    def __str__(self):
        return f"QR {self.token} - {self.valid_from.strftime('%H:%M:%S')}"

    @staticmethod
    def verify_qr_data(token, date, signature):
        try:
            f = get_fernet()
            decrypted = json.loads(f.decrypt(signature.encode()).decode())
            return (
                decrypted['token'] == token and
                decrypted['date'] == date
            )
        except Exception:
            return False
