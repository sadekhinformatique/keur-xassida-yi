from django.db import models
from django.utils import timezone


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'PRESENT', 'Présent'
        ABSENT = 'ABSENT', 'Absent'
        LATE = 'LATE', 'Retard'
        EARLY_LEAVE = 'EARLY_LEAVE', 'Départ anticipé'
        HOLIDAY = 'HOLIDAY', 'Congé'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField(default=timezone.localdate)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PRESENT)
    gps_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    gps_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    device_info = models.CharField(max_length=255, blank=True, help_text="Infos du téléphone utilisé")
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    check_in_method = models.CharField(max_length=20, default='QR_CODE', choices=[
        ('QR_CODE', 'QR Code'),
        ('MANUAL', 'Manuel'),
        ('FACE', 'Reconnaissance faciale'),
    ])
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Pointage'
        verbose_name_plural = 'Pointages'
        unique_together = ['employee', 'date']
        ordering = ['-date', '-check_in']

    def __str__(self):
        return f"{self.employee} - {self.date} - {self.get_status_display()}"


class AttendanceLog(models.Model):
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)

    class Meta:
        verbose_name = 'Journal de pointage'
        verbose_name_plural = 'Journaux de pointage'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.attendance} - {self.action} at {self.timestamp}"
