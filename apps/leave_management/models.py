from django.db import models
from django.conf import settings # To reference the Employee model cleanly
from apps.employees.models import Employee # Direct import also works
from datetime import date, timedelta # Make sure timedelta is imported

class LeaveRequest(models.Model):
    """
    Represents a leave request submitted by an employee.
    """
    # --- Choices ---
    LEAVE_TYPE_CHOICES = [
        ('paid', 'Paid Leave'),
        ('sick', 'Sick Leave'),
        ('unpaid', 'Unpaid Leave'),
        ('compassionate', 'Compassionate Leave'),
        ('study', 'Study Leave'),
        # Add other types as needed
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('manager_approved', 'Manager Approved'), # Approved by direct manager
        ('hr_approved', 'HR Approved'),         # Approved by HR (final step for some)
        ('approved', 'Approved'),               # Final approved state (can be manager or HR)
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),             # If employee cancels it
    ]

    # --- Fields ---
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE, # If employee is deleted, delete their requests
        related_name='leave_requests'
    )
    leave_type = models.CharField(
        max_length=20,
        choices=LEAVE_TYPE_CHOICES,
        default='paid'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(
        blank=True,
        help_text="Reason for the leave request (optional for some types, required for others)."
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    # Approval Tracking (can be enhanced later)
    # Using ForeignKey allows tracking *who* approved
    approved_by_manager = models.ForeignKey(
        Employee,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_manager_requests',
        limit_choices_to={'role__in': ['manager', 'admin', 'director']} # Limit who can be set here
    )
    approved_by_hr = models.ForeignKey(
        Employee,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_hr_requests',
        limit_choices_to={'role__in': ['hr', 'admin', 'director']} # Limit who can be set here
    )
    manager_approval_timestamp = models.DateTimeField(null=True, blank=True)
    hr_approval_timestamp = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, help_text="Reason if the request was rejected.")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', '-created_at'] # Show newest requests first
        verbose_name = "Leave Request"          # Optional: Controls singular name
        verbose_name_plural = "Leave Requests"

    def __str__(self):
        return f"Leave Request for {self.employee.first_name} {self.employee.last_name} ({self.start_date} to {self.end_date}) - {self.get_status_display()}"

    @property
    def duration_days(self):
        """Calculates the duration of the leave request in days (inclusive)."""
        if self.start_date and self.end_date and self.end_date >= self.start_date:
            # Calculate inclusive days: (end - start) + 1 day
            return (self.end_date - self.start_date).days + 1
        return 0 # Or None if you prefer, but 0 might be safer for frontend display

    # Add validation logic later if needed (e.g., end_date >= start_date)
