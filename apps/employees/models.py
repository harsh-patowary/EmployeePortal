from datetime import timezone
from django.contrib.auth.models import User
from django.db import models
from decimal import Decimal # Import Decimal

class Employee(models.Model):
    # Define role choices
    ROLE_CHOICES = (
        ('employee', 'Employee'),
        ('manager', 'Manager'),
        ('admin', 'Administrator'),
        ('hr', 'HR Staff'),
        ('director', 'Director'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    eID = models.CharField(max_length=255, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True)
    DoB = models.DateField(null=True, blank=True)
    position = models.CharField(max_length=255)
    # Keep the boolean field for backwards compatibility
    is_manager = models.BooleanField(default=False)
    # Add the new role field with choices
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='employee',
        help_text='The role defines what permissions the employee has in the system'
    )
    department = models.CharField(max_length=255)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    date_hired = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='team_members'
    )

    # --- NEW LEAVE BALANCE FIELDS ---
    paid_leave_balance = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0.00'),
        help_text="Available paid leave days."
    )
    sick_leave_balance = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0.00'),
        help_text="Available sick leave days."
    )
    # Add other balance fields corresponding to LEAVE_TYPE_CHOICES if needed
    # unpaid_leave_taken = models.DecimalField(...) # Might track taken unpaid leave separately

    def __str__(self):
        return self.user.username
        
    def save(self, *args, **kwargs):
        # Sync is_manager with role for backwards compatibility
        if self.role in ['manager', 'admin', 'director']:
            self.is_manager = True
        else:
            self.is_manager = False
        super().save(*args, **kwargs)
        
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
