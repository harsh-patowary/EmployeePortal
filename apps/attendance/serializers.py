from rest_framework import serializers
from .models import Attendance
from apps.employees.serializers import EmployeeSerializer

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'employee_name', 'date', 'check_in', 'check_out', 
                 'status', 'notes', 'duration_hours', 'created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"
        
    def get_duration_hours(self, obj):
        return obj.duration
        
class AttendanceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['employee', 'date', 'check_in', 'check_out', 'status', 'notes']
        
    def validate(self, data):
        # Validate check-out time is after check-in time
        if data.get('check_in') and data.get('check_out') and data['check_out'] < data['check_in']:
            raise serializers.ValidationError("Check-out time must be after check-in time")
        return data