from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
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

class ManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ('id', 'first_name', 'last_name') # Add other fields if needed

class EmployeeDetailSerializer(serializers.ModelSerializer):
    # Use the nested serializer for the 'manager' field
    manager = ManagerSerializer(read_only=True)
    # Use UserSerializer for nested user details if needed, or StringRelatedField for just username/email
    # user = UserSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True) # Keep as string for simplicity if that's enough

    class Meta:
        model = Employee
        # --- ADD ALL REQUIRED FIELDS HERE ---
        fields = [
            'id',
            'user', # String representation (username/email)
            'eID',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'DoB',
            'position', # Make sure 'position' is the correct field name, or use 'job_title' if that's the model field # Added job_title explicitly if it exists and is different from position
            'department',
            'salary',
            'date_hired',
            'manager', # Nested manager object
            'is_manager',
            'role',
            'paid_leave_balance',
            'sick_leave_balance',
            # 'profile_picture_url', # Ensure this field exists on the model or is added via SerializerMethodField if needed
            # Add any other fields needed by ProfilePage.js
        ]
        # Define read_only_fields if necessary, similar to EmployeeSerializer
        read_only_fields = [
            'user',
            'eID',
            'email',
            'manager', # Manager is read-only due to ManagerSerializer(read_only=True)
            'paid_leave_balance',
            'sick_leave_balance',
        ]

# --- Password Reset Serializers ---

class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting a password reset e-mail.
    """
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming a password reset.
    """
    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        try:
            uid = force_str(urlsafe_base64_decode(attrs['uidb64']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uidb64": "Invalid user ID."})

        if not PasswordResetTokenGenerator().check_token(user, attrs['token']):
            raise serializers.ValidationError({"token": "Invalid or expired token."})

        attrs['user'] = user # Pass user to the view
        return attrs
