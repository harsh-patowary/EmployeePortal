from django.contrib.auth.models import User
from django.db import models

# class CustomUser(AbstractUser):
#     is_admin = models.BooleanField(default=False)
    
#     groups = models.ManyToManyField(
#         "auth.Group",
#         related_name="customuser_set",
#         blank=True
#     )
#     user_permissions = models.ManyToManyField(
#         "auth.Permission",
#         related_name="customuser_set",
#         blank=True
#     )

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    position = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    date_hired = models.DateField()

    def __str__(self):
        return self.user.username
