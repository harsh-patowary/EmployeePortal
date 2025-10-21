from django.shortcuts import render
from django.contrib.auth import get_user_model, authenticate
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from apps.employees.models import Employee
from .serializers import (
    RegisterSerializer, UserSerializer, EmployeeSerializer, EmployeeDetailSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)

# --- Password Reset Imports ---
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.urls import reverse

User = get_user_model()

# Register a new user
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]



# Login View - Returns JWT tokens
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        print(user)
        if user:
            refresh = RefreshToken.for_user(user)
            print(f"refresh: {refresh}\n")
            
            print(f"token: {str(refresh.access_token)}\n")
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"Error": "Invalid Credentials"}, status=400)


# Employee Management API
class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_details(request):
    """Get current user details including employee info"""
    user = request.user
    try:
        # Optimize query by prefetching related manager details
        employee = Employee.objects.select_related('manager', 'user').get(user=user)
        serializer = EmployeeDetailSerializer(employee) # Use the detail serializer with nested manager
        data = serializer.data

        # Optional: Keep debug print if needed
        print(f"Employee {employee.first_name} role: {data.get('role')}, is_manager: {data.get('is_manager')}")

    except Employee.DoesNotExist:
        return Response(
            {"detail": "Employee profile not found for this user."},
            status=status.HTTP_404_NOT_FOUND
        )

    print("Returning user details:", data) # Now logs the serialized data
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manager_team(request):
    """Get employees managed by the current user (if they're a manager)"""
    user = request.user
    try:
        employee = Employee.objects.get(user=user)
        print(f"Getting team for manager....... {employee.first_name} {employee.last_name}")

        # Simplified Permission Check: Check role directly
        allowed_roles = ['manager', 'admin', 'hr', 'director']
        if employee.role not in allowed_roles:
            return Response(
                {"error": "You don't have permission to view teams"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get direct reports
        team_members = employee.team_members.all()

        team_data = {
            'manager': {
                'id': employee.id,
                'name': f"{employee.first_name} {employee.last_name}",
                'role': employee.role,
                'department': employee.department,
            },
            'team_size': team_members.count(),
            'team_members': EmployeeSerializer(team_members, many=True).data
        }
        
        return Response(team_data)
        
    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )

# --- Password Reset API Views ---

class PasswordResetRequestAPIView(generics.GenericAPIView):
    """
    API view to request a password reset email.
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)

        # Generate token and uid
        token_generator = PasswordResetTokenGenerator()
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        # Construct frontend reset URL (Adjust domain/port as needed)
        frontend_url = settings.FRONTEND_URL
        reset_link = f"{frontend_url}/reset-password/{uidb64}/{token}/"

        # Send email
        subject = "Password Reset Request"
        message = f"""
        Hi {user.username},

        Someone requested a password reset for your account.
        If this was you, click the link below to set a new password:
        {reset_link}

        If you didn't request this, please ignore this email.

        Thanks,
        The Team
        """
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return Response({"error": "Failed to send password reset email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetConfirmAPIView(generics.GenericAPIView):
    """
    API view to confirm the password reset using uid and token.
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        new_password = serializer.validated_data['new_password']

        # Set the new password
        user.set_password(new_password)
        user.save()

        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
