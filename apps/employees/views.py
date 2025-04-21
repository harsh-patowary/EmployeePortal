from django.shortcuts import render
from django.contrib.auth import get_user_model, authenticate
from rest_framework import generics, permissions, status # Added status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from apps.employees.models import Employee
from apps.employees.serializers import RegisterSerializer, UserSerializer, EmployeeSerializer

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
        employee = Employee.objects.get(user=user)
        serializer = EmployeeSerializer(employee)
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
        # Check if user is a manager
        if not employee.is_manager and employee.role not in ['manager', 'admin', 'hr', 'director']:
            return Response(
                {"error": "You don't have manager permissions"},
                status=403
            )
        
        # Get direct reports (employees where this user is the manager)
        team_members = employee.team_members.all()
        simplified_team_data = [
            {'id': member.id, 'name': f"{member.first_name} {member.last_name}"}
            for member in team_members
        ]
        print("Simplified Team Data:", simplified_team_data)
        # You might want to add additional data or statistics
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
            status=404
        )
