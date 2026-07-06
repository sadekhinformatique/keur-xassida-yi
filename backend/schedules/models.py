from django.db import models


class Schedule(models.Model):
    name = models.CharField(max_length=100, unique=True)
    entry_time = models.TimeField()
    exit_time = models.TimeField()
    break_start = models.TimeField(null=True, blank=True)
    break_end = models.TimeField(null=True, blank=True)
    tolerance_minutes = models.IntegerField(default=15, help_text="Tolérance de retard en minutes")
    is_default = models.BooleanField(default=False)
    days_of_week = models.JSONField(default=list, help_text="Liste des jours (0=Lu, 6=Di)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Horaire'
        verbose_name_plural = 'Horaires'

    def __str__(self):
        return f"{self.name} ({self.entry_time} - {self.exit_time})"


class EmployeeSchedule(models.Model):
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='schedules')
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='employee_schedules')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Horaire employé'
        verbose_name_plural = 'Horaires employés'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.employee} - {self.schedule}"
