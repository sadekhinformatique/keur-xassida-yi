from django.db import models


class CompanySettings(models.Model):
    company_name = models.CharField(max_length=200, default="Mon Entreprise")
    address = models.TextField(blank=True)
    logo = models.ImageField(upload_to='company/', blank=True, null=True)
    primary_color = models.CharField(max_length=7, default="#2563eb")
    secondary_color = models.CharField(max_length=7, default="#1e40af")
    accent_color = models.CharField(max_length=7, default="#0ea5e9")
    notification_email = models.EmailField(blank=True)
    notification_sms = models.BooleanField(default=False)
    auto_generate_qr = models.BooleanField(default=True)
    qr_duration_seconds = models.IntegerField(default=30)
    enable_gps = models.BooleanField(default=False)
    enable_face_recognition = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paramètres entreprise'
        verbose_name_plural = 'Paramètres entreprise'

    def __str__(self):
        return self.company_name

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
