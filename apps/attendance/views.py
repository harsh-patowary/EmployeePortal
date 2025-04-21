from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from datetime import date, datetime
from .models import Attendance
from .serializers import AttendanceSerializer, AttendanceCreateSerializer
from apps.employees.models import Employee
from .permissions import IsManagerOrReadOnly

class AttendanceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing attendance records
    """
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'status']
    ordering_fields = ['date', 'employee__first_name']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AttendanceCreateSerializer
        return AttendanceSerializer
    
    # Override permissions based on the action being performed
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        print(f"--- get_permissions called for action: {self.action} ---") # Add log
        
        if self.action in ['check_in', 'check_out']:
            # For check_in and check_out, only require authentication
            permission_classes_to_use = [permissions.IsAuthenticated] 
            print(f"Applying permissions for {self.action}: {[p.__name__ for p in permission_classes_to_use]}") # Add log
        else:
            # For all other actions use the default permissions
            permission_classes_to_use = self.permission_classes 
            print(f"Applying default permissions for {self.action}: {[p.__name__ for p in permission_classes_to_use]}") # Add log
        
        # Return instances of the permission classes
        return [permission() for permission in permission_classes_to_use]

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        print(f"--- check_in action entered by user: {request.user} ---") # Add log
        """Endpoint for employee check-in (uses authenticated user)"""
        user = request.user # Get the authenticated user
        try:
            # Find the Employee record linked to the authenticated user
            employee = Employee.objects.get(user=user) 
            today = date.today()
            check_in_time = datetime.now().time() # Use timezone.now() if using timezones

            attendance, created = Attendance.objects.get_or_create(
                employee=employee, # Use the authenticated user's employee record
                date=today,
                defaults={
                    'check_in': check_in_time,
                    'status': 'present' # Default status on check-in
                }
            )

            if not created and not attendance.check_in:
                # If record existed but check_in was null, update it
                attendance.check_in = check_in_time
                # Optionally reset status if needed, e.g., if they were marked absent
                # attendance.status = 'present' 
                attendance.save()

            serializer = self.get_serializer(attendance)
            # Return the updated/created record in the response
            # Frontend expects { record: ... } based on handleCheckIn
            return Response({'record': serializer.data}) 

        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found for the logged-in user'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        # Add a general exception handler if needed
        except Exception as e:
             print(f"Error during check-in for user {user.username}: {e}")
             return Response(
                 {'error': 'An unexpected error occurred during check-in.'},
                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
             )

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        print(f"--- check_out action entered by user: {request.user} ---") # Add log
        """Endpoint for employee check-out (uses authenticated user)"""
        user = request.user # Get the authenticated user
        try:
            # Find the Employee record linked to the authenticated user
            employee = Employee.objects.get(user=user) 
            today = date.today()
            check_out_time = datetime.now().time() # Use timezone.now() if using timezones

            try:
                # Find today's attendance record for the authenticated user's employee
                attendance = Attendance.objects.get(
                    employee=employee,
                    date=today
                )
                
                # Prevent checking out if not checked in or already checked out
                if not attendance.check_in:
                     return Response(
                         {'error': 'Cannot check out without a check-in record for today.'}, 
                         status=status.HTTP_400_BAD_REQUEST
                     )
                if attendance.check_out:
                     return Response(
                         {'error': 'Already checked out for today.'}, 
                         status=status.HTTP_400_BAD_REQUEST
                     )

                attendance.check_out = check_out_time
                attendance.save() # Triggers work_hours calculation via signal/save method

                # Refresh instance from DB to get calculated work_hours if applicable
                attendance.refresh_from_db() 

                serializer = self.get_serializer(attendance)
                # Return the updated record in the response
                # Frontend expects { record: ... } based on handleCheckOut
                return Response({'record': serializer.data}) 

            except Attendance.DoesNotExist:
                return Response(
                    {'error': 'No check-in record found for today'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found for the logged-in user'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        # Add a general exception handler if needed
        except Exception as e:
             print(f"Error during check-out for user {user.username}: {e}")
             return Response(
                 {'error': 'An unexpected error occurred during check-out.'},
                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
             )

    @action(detail=False, methods=['get'])
    def employee_history(self, request):
        """Get attendance history for a specific employee"""
        employee_id = request.query_params.get('employee_id')
        print(f"Employee ID: {employee_id}")
        if not employee_id:
            return Response(
                {'error': 'employee_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        queryset = self.queryset.filter(employee_id=employee_id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)