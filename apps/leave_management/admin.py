from django.contrib import admin
from .models import LeaveRequest # Import your LeaveRequest model

# Register your models here.

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    """
    Admin configuration for LeaveRequest model.
    """
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'status', 'created_at')
    list_filter = ('status', 'leave_type', 'start_date', 'employee__department') # Add filters
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__email', 'reason') # Add search
    readonly_fields = ('created_at', 'updated_at', 'manager_approval_timestamp', 'hr_approval_timestamp') # Fields not editable in admin directly
    fieldsets = (
        (None, {
            'fields': ('employee', 'leave_type', 'start_date', 'end_date', 'reason')
        }),
        ('Approval Status', {
            'fields': ('status', 'approved_by_manager', 'manager_approval_timestamp', 'approved_by_hr', 'hr_approval_timestamp', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',) # Make this section collapsible
        }),
    )

    # Optional: Improve employee dropdown performance if you have many employees
    # raw_id_fields = ('employee', 'approved_by_manager', 'approved_by_hr')

# Alternatively, the simplest registration:
# admin.site.register(LeaveRequest)
