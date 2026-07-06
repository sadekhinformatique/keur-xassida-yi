from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Département'
        verbose_name_plural = 'Départements'

    def __str__(self):
        return self.name


class Service(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='services')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
        unique_together = ['name', 'department']

    def __str__(self):
        return f"{self.name} - {self.department.name}"


class Employee(models.Model):
    class Sexe(models.TextChoices):
        M = 'M', 'Masculin'
        F = 'F', 'Féminin'

    class Status(models.TextChoices):
        ACTIF = 'ACTIF', 'Actif'
        INACTIF = 'INACTIF', 'Inactif'
        CONGE = 'CONGE', 'Congé'
        SUSPENDU = 'SUSPENDU', 'Suspendu'

    photo = models.ImageField(upload_to='employees/photos/', blank=True, null=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=Sexe.choices)
    matricule = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    fonction = models.CharField(max_length=200)
    telephone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    date_embauche = models.DateField()
    statut = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIF)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.prenom}"

    @property
    def full_name(self):
        return f"{self.nom} {self.prenom}"
