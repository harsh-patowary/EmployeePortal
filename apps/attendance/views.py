from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from datetime import date, datetime
from .models import Attendance
from .serializers import AttendanceSerializer, AttendanceCreateSerializer
from apps.employees.models import Employee

class AttendanceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing attendance records
    """
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'status']
    ordering_fields = ['date', 'employee__first_name']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AttendanceCreateSerializer
        return AttendanceSerializer
    
    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Endpoint for employee check-in"""
        employee_id = request.data.get('employee_id')
        try:
            employee = Employee.objects.get(id=employee_id)
            today = date.today()
            check_in_time = datetime.now().time()
            
            # Check if attendance record already exists for today
            attendance, created = Attendance.objects.get_or_create(
                employee=employee,
                date=today,
                defaults={
                    'check_in': check_in_time,
                    'status': 'present'
                }
            )
            
            if not created:
                # Record exists but maybe check_in was not recorded
                if not attendance.check_in:
                    attendance.check_in = check_in_time
                    attendance.save()
                    
            serializer = self.get_serializer(attendance)
            return Response(serializer.data)
            
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Endpoint for employee check-out"""
        employee_id = request.data.get('employee_id')
        try:
            employee = Employee.objects.get(id=employee_id)
            today = date.today()
            check_out_time = datetime.now().time()
            
            try:
                attendance = Attendance.objects.get(
                    employee=employee,
                    date=today
                )
                attendance.check_out = check_out_time
                attendance.save()
                
                serializer = self.get_serializer(attendance)
                return Response(serializer.data)
                
            except Attendance.DoesNotExist:
                return Response(
                    {'error': 'No check-in record found for today'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def employee_history(self, request):
        """Get attendance history for a specific employee"""
        employee_id = request.query_params.get('employee_id')
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