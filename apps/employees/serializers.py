from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.employees.models import Employee

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff']

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # Make user read-only if not already

    class Meta:
        model = Employee
        fields = [
            'id',
            'user', # Include the nested user data
            'eID', # Added eID
            'first_name',
            'last_name',
            'email',
            'phone_number', # Added phone_number
            'DoB', # Added DoB
            'position',
            'department',
            'salary', # Added salary
            'date_hired', # Added date_hired
            'manager', # Added manager ID
            'is_manager', # Include flags if needed by frontend
            'role',
            # --- ADD NEW BALANCE FIELDS ---
            'paid_leave_balance',
            'sick_leave_balance',
        ]
        read_only_fields = [
            'user',
            'eID',
            'email', # Usually derived from user or unique
            # Make balances read-only in general employee endpoints
            
        ]

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_staff']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
