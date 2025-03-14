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
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
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
            # Convert time objects to datetime for calculation
            from datetime import datetime, date
            today = date.today()
            dt_check_in = datetime.combine(today, self.check_in)
            dt_check_out = datetime.combine(today, self.check_out)
            
            # If checkout is earlier than checkin, assume it's the next day
            if dt_check_out < dt_check_in:
                from datetime import timedelta
                dt_check_out = dt_check_out + timedelta(days=1)
                
            duration = dt_check_out - dt_check_in
            return round(duration.total_seconds() / 3600, 2)  # Hours with 2 decimal places
        return None