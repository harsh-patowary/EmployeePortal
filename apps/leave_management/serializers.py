from rest_framework import serializers
from .models import LeaveRequest, Employee # Import Employee from leave_management's models context
from apps.employees.serializers import EmployeeSerializer # Import your existing EmployeeSerializer

class LeaveRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for the LeaveRequest model.
    Uses the existing EmployeeSerializer for nested employee details.
    """
    # Use the imported EmployeeSerializer for read-only employee details
    employee_details = EmployeeSerializer(source='employee', read_only=True)
    # REMOVE the PrimaryKeyRelatedField definition for 'employee' below
    # employee = serializers.PrimaryKeyRelatedField(
    #     queryset=Employee.objects.all(), # Or filter as needed
    #     write_only=True # Only used for writing, display uses employee_details
    # )

    # Make status display human-readable (read-only)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)

    # Optional: Display approver names if needed (read-only)
    # Assuming Employee model has a get_full_name method or similar
    approved_by_manager_name = serializers.CharField(source='approved_by_manager.get_full_name', read_only=True, allow_null=True)
    approved_by_hr_name = serializers.CharField(source='approved_by_hr.get_full_name', read_only=True, allow_null=True)

    # Explicitly include the duration_days property
    duration_days = serializers.IntegerField(read_only=True) # Add this line

    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'employee', # Keep for writing (will be set in perform_create)
            'employee_details', # For reading
            'leave_type',
            'leave_type_display', # For reading
            'start_date',
            'end_date',
            'reason',
            'status',
            'status_display', # For reading
            'approved_by_manager', # Keep for potential direct setting (though actions are preferred)
            'approved_by_hr',      # Keep for potential direct setting
            'approved_by_manager_name', # For reading
            'approved_by_hr_name',      # For reading
            'manager_approval_timestamp',
            'hr_approval_timestamp',
            'rejection_reason',
            'created_at',
            'updated_at',
            'duration_days', # Add this line here too
        ]
        read_only_fields = [
            'employee_details',
            'status_display',
            'leave_type_display',
            'approved_by_manager_name',
            'approved_by_hr_name',
            'created_at',
            'updated_at',
            'status', # Status will be controlled by specific actions/views, not direct update
            'approved_by_manager',
            'approved_by_hr',
            'manager_approval_timestamp',
            'hr_approval_timestamp',
            'rejection_reason', # Set by specific actions
            'duration_days', # Ensure it's read-only
        ]

    # Add custom validation if needed (e.g., end_date >= start_date)
    def validate(self, data):
        """
        Check that the start date is before the end date.
        """
        start_date = data.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = data.get('end_date', getattr(self.instance, 'end_date', None))

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        return data

    # perform_create in the ViewSet handles setting the employee and initial status
