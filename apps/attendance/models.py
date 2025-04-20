from django.db import models
from apps.employees.models import Employee

class Attendance(models.Model):
    ATTENDANCE_TYPE = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('leave', 'Leave'),
        ('remote', 'Working Remote'),
    )
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=ATTENDANCE_TYPE, default='present')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'date')
        order_with_respect_to = "employee"
    
    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name} - {self.date}"
    
    @property
    def duration(self):
        """Calculate work duration in hours if both check_in and check_out exist"""
        if self.check_in and self.check_out:
            # Ensure check_out is actually after check_in
            if self.check_out > self.check_in:
                # Direct subtraction of datetime objects gives a timedelta
                duration_timedelta = self.check_out - self.check_in
                # Convert timedelta to hours
                return round(duration_timedelta.total_seconds() / 3600, 2)  # Hours with 2 decimal places
            else:
                # Optional: Handle cases where check_out is somehow before check_in
                # This might indicate bad data. Return 0 or None as appropriate.
                return 0.0
        # Return None or 0.0 if either check_in or check_out is missing
        return None