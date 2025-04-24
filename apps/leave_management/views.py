from django.shortcuts import render

# filepath: d:\developement\employee_management\apps\leave_management\views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q # For complex queries
from rest_framework.exceptions import PermissionDenied, ValidationError # Import exceptions
from django.db import transaction # Import transaction
from decimal import Decimal # Import Decimal

from .models import LeaveRequest, Employee
from .serializers import LeaveRequestSerializer
from .permissions import IsRequestOwner, IsRequestManager, IsHR # <-- Import custom permissions

# --- Helper function for duration (simple version) ---
def calculate_leave_duration(start_date, end_date):
    """Calculates duration in days (inclusive). Does NOT exclude weekends/holidays."""
    if start_date > end_date:
        return 0
    return (end_date - start_date).days + 1
# ----------------------------------------------------

class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows leave requests to be viewed or edited.
    Includes actions for approval, rejection, and cancellation.
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated] # Base permission: user must be logged in

    def get_queryset(self):
        """
        Dynamically filter queryset based on user role AND requested scope.
        Scopes:
        - 'my': Requests submitted by the logged-in user.
        - 'pending_approval': Requests awaiting the logged-in user's approval.
        - 'all': All requests (permission-based).
        - None (default): A sensible default, potentially 'my' or role-based overview.
        """
        user = self.request.user
        scope = self.request.query_params.get('scope', None) # <-- Get scope parameter

        try:
            employee = user.employee
        except Employee.DoesNotExist:
            return LeaveRequest.objects.none()

        # --- Scope: 'my' ---
        if scope == 'my':
            return LeaveRequest.objects.filter(employee=employee).order_by('-created_at') # Always show own requests

        # --- Scope: 'pending_approval' ---
        elif scope == 'pending_approval':
            if employee.role == 'manager':
                # Managers approve 'pending' requests from their direct reports
                return LeaveRequest.objects.filter(
                    employee__manager=employee,
                    status='pending'
                ).exclude(employee=employee).order_by('start_date') # Exclude own requests just in case
            elif employee.role == 'hr':
                # HR approves 'manager_approved' requests
                return LeaveRequest.objects.filter(
                    status='manager_approved'
                ).order_by('start_date')
            elif employee.role == 'admin':
                 # Admins approve 'pending' requests from their direct reports (who should be Managers)
                 # Admins might ALSO act as HR depending on workflow? If so, add HR's logic too.
                 # Assuming Admin primarily manages Managers here:
                #  return LeaveRequest.objects.filter(
                #     employee__manager=employee,
                #     status='pending'
                #  ).exclude(employee=employee).order_by('start_date')
                 # If Admin ALSO does HR approvals:
                 return LeaveRequest.objects.filter(
                    (Q(employee__manager=employee) & Q(status='pending')) | # Approve direct reports
                    Q(status='manager_approved')                             # Approve like HR
                 ).exclude(employee=employee).distinct().order_by('start_date')
            elif employee.role == 'director':
                 # Directors approve 'pending' requests from their direct reports (who should be Admins)
                 return LeaveRequest.objects.filter(
                    employee__manager=employee,
                    status='pending'
                 ).exclude(employee=employee).order_by('start_date')
            else:
                # Regular employees don't approve requests
                return LeaveRequest.objects.none()

        # --- Scope: 'all' ---
        elif scope == 'all':
            # Only allow HR, Admin, Director to see all (adjust roles as needed)
            if employee.role in ['hr', 'admin', 'director']:
                # Add any default filtering/ordering if desired
                return LeaveRequest.objects.all().order_by('-created_at')
            else:
                # Deny access for others trying to use 'all' scope
                # Alternatively, raise PermissionDenied here, but returning none is safer for querysets
                return LeaveRequest.objects.none()

        # --- Default Behavior (No Scope / Unrecognized Scope) ---
        else:
            # Define a sensible default view based on role.
            # Example: Employees/Managers see their own, HR/Admin/Director see pending approvals + own?
            if employee.role == 'employee':
                return LeaveRequest.objects.filter(employee=employee).order_by('-created_at')
            elif employee.role == 'manager':
                 # Default: Show own requests + requests from team (pending or not)
                 return LeaveRequest.objects.filter(
                     Q(employee=employee) | Q(employee__manager=employee, status='pending') # Show own + pending from team
                 ).distinct().order_by('-created_at', 'start_date')
            elif employee.role == 'hr':
                 # Default: Show own requests + requests needing HR action
                 return LeaveRequest.objects.filter(
                     Q(employee=employee) | Q(status='manager_approved')
                 ).distinct().order_by('-created_at', 'start_date')
            elif employee.role in ['admin', 'director']:
                 # Default: Show own requests + requests needing their approval
                 return LeaveRequest.objects.filter(
                     Q(employee=employee) | Q(employee__manager=employee, status='pending')
                 ).distinct().order_by('-created_at', 'start_date')
            else:
                 return LeaveRequest.objects.none()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires,
        based on the action being performed.
        """
        # Add permission check for 'list' action if scope='all' is requested
        if self.action == 'list' and self.request.query_params.get('scope') == 'all':
             # Ensure only authorized roles can use scope=all
             # You might want a specific permission class like IsAdminOrHRDirector
             permission_classes = [permissions.IsAuthenticated, IsHR] # Example: Reuse IsHR or create a new one
        elif self.action in ['approve_manager', 'reject_manager']:
            # This permission (IsRequestManager) should work hierarchically
            # if Employee.manager points correctly up the chain.
            permission_classes = [permissions.IsAuthenticated, IsRequestManager]
        elif self.action in ['approve_hr', 'reject_hr']:
            permission_classes = [permissions.IsAuthenticated, IsHR]
        elif self.action == 'cancel':
            permission_classes = [permissions.IsAuthenticated, IsRequestOwner]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated, IsRequestOwner] # Consider if managers/admins should edit
        elif self.action == 'destroy':
             permission_classes = [permissions.IsAuthenticated, IsRequestOwner] # Consider if managers/admins should delete
        elif self.action in ['list', 'retrieve', 'create']:
            # Base permissions, queryset handles visibility based on scope/role
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Automatically set the employee to the logged-in user when creating a request.
        Handle special status for Directors.
        """
        try:
            employee = self.request.user.employee
            initial_status = 'pending' # Default status

            # --- Special Handling for Director Requests ---
            if employee.role == 'director':
                # Option 1: Skip manager approval, go straight to HR for balance check/finalization
                initial_status = 'manager_approved'
                # Option 2: Auto-approve (if no balance check or HR finalization needed)
                # initial_status = 'approved'
                # If auto-approved, consider if balance deduction should happen here or if it's not applicable

                # --- Add Notification for HR about Director's Request ---
                # You'll need a way to find HR users or a group email
                print(f"--- DIRECTOR REQUEST NOTIFICATION ---")
                print(f"To: HR Department") # Replace with actual HR email/notification mechanism
                print(f"Subject: Leave Request Submitted by Director {employee.get_full_name()}")
                print(f"Body: Director {employee.get_full_name()} has submitted a leave request ({serializer.validated_data.get('start_date')} to {serializer.validated_data.get('end_date')}). Status set to: {initial_status}")
                print(f"--- END NOTIFICATION ---")
                # -------------------------------------------------------

            # Save with the determined status
            serializer.save(employee=employee, status=initial_status)

            # --- Standard Notification for non-Directors (if needed) ---
            if initial_status == 'pending' and employee.manager:
                 print(f"--- MANAGER NOTIFICATION ---")
                 print(f"To: {employee.manager.email}")
                 print(f"Subject: Leave Request Submitted by {employee.get_full_name()}")
                 print(f"Body: {employee.get_full_name()} has submitted a leave request for your approval.")
                 print(f"--- END NOTIFICATION ---")
            # ---------------------------------------------------------


        except Employee.DoesNotExist:
             from rest_framework.exceptions import ValidationError
             raise ValidationError("User does not have an associated employee profile.")
        except Exception as e:
             from rest_framework.exceptions import APIException
             raise APIException(f"Failed to create leave request: {str(e)}")


    # --- Action methods for Approvals/Rejections/Cancellations ---

    @action(detail=True, methods=['post']) # Removed permission_classes from decorator
    def approve_manager(self, request, pk=None):
        """
        Action for a manager (or Admin, Director) to approve a direct report's leave request.
        Sets status from 'pending' to 'manager_approved'.
        Relies on IsRequestManager permission.
        """
        leave_request = self.get_object() # Gets the specific LeaveRequest instance
        approving_employee = getattr(request.user, 'employee', None) # This is the Manager/Admin/Director

        # Permission check (IsRequestManager) is done before this method is called by get_permissions()

        # State Check: Can only approve if currently pending
        if leave_request.status != 'pending':
            raise ValidationError(f"Request cannot be approved. Current status: {leave_request.get_status_display()}.")

        # Update Status and Tracking
        leave_request.status = 'manager_approved' # This status indicates it's ready for HR
        leave_request.approved_by_manager = approving_employee # Record who approved this step
        leave_request.manager_approval_timestamp = timezone.now()
        leave_request.rejection_reason = ""
        leave_request.save()

        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}") # Notify the person who requested leave
        print(f"Subject: Leave Request Partially Approved")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) has been approved by {approving_employee.get_full_name()} ({approving_employee.role}) and is now pending HR approval.")
        # CC HR maybe? Or HR gets notified when they check their pending list.
        print(f"--- END NOTIFICATION ---")

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post']) # Removed permission_classes
    def reject_manager(self, request, pk=None):
        """
        Action for a manager to reject a leave request.
        Sets status from 'pending' to 'rejected'. Requires a reason.
        """
        leave_request = self.get_object()
        rejecting_employee = getattr(request.user, 'employee', None) # Use a consistent name
        reason = request.data.get('reason', None)

        if not reason:
            raise ValidationError({"reason": "A rejection reason is required."})

        if leave_request.status != 'pending':
             raise ValidationError(f"Request cannot be rejected. Current status: {leave_request.get_status_display()}.")

        leave_request.status = 'rejected'
        # Record who rejected it. Using approved_by_manager field might be confusing.
        # Consider adding a 'rejected_by' field or storing the rejector info in the reason/log.
        # For now, let's use approved_by_manager to store the actor.
        leave_request.approved_by_manager = rejecting_employee
        leave_request.manager_approval_timestamp = timezone.now() # Or maybe a rejection_timestamp?
        leave_request.rejection_reason = reason
        leave_request.save()

        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}")
        print(f"Subject: Leave Request Rejected")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) was rejected by {rejecting_employee.get_full_name()} ({rejecting_employee.role}). Reason: {reason}")
        print(f"--- END NOTIFICATION ---")

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post']) # Removed permission_classes
    def approve_hr(self, request, pk=None):
        """
        Action for HR to approve a leave request (final approval).
        Sets status from 'manager_approved' to 'approved'.
        """
        leave_request = self.get_object()
        hr_employee = getattr(request.user, 'employee', None)
        employee_requesting = leave_request.employee  # Get the employee who made the request

        # State Check
        if leave_request.status != 'manager_approved':
            raise ValidationError(f"Request cannot be approved by HR. Current status: {leave_request.get_status_display()}.")

        # --- Balance Check & Deduction Logic ---
        leave_type = leave_request.leave_type
        duration_decimal = Decimal(calculate_leave_duration(leave_request.start_date, leave_request.end_date))

        try:
            with transaction.atomic():  # Ensure atomic update
                # Reload the employee to make sure we have the latest data
                employee_requesting.refresh_from_db()
                
                # Skip balance check for unpaid leave
                if leave_type != 'unpaid':
                    # Check what fields are available on the employee model
                    print(f"DEBUG: Employee model attributes: {dir(employee_requesting)}")
                    
                    # Determine the correct field name based on leave type
                    # Try different possible field naming conventions
                    possible_field_names = [
                        f"{leave_type}_leave_balance",  # sick_leave_balance
                        f"{leave_type}_balance",        # sick_balance
                        f"leave_{leave_type}_balance"   # leave_sick_balance
                    ]
                    
                    # Find the first field that exists
                    balance_field = None
                    for field_name in possible_field_names:
                        if hasattr(employee_requesting, field_name):
                            balance_field = field_name
                            break
                    
                    if not balance_field:
                        raise ValidationError(f"Could not find balance field for '{leave_type}' leave type.")
                    
                    # Get the current balance from the correct field
                    current_balance = getattr(employee_requesting, balance_field, Decimal('0'))
                    print(f"DEBUG: {employee_requesting.first_name} {employee_requesting.last_name} - Found field: {balance_field}, Current balance: {current_balance}, Requested days: {duration_decimal}")
                    
                    # Check if employee has enough leave balance
                    if current_balance < duration_decimal:
                        raise ValidationError(f"Insufficient {leave_type} balance for the requested leave duration. Available: {current_balance}, Required: {duration_decimal}")

                    # Deduct leave balance
                    setattr(employee_requesting, balance_field, current_balance - duration_decimal)
                    employee_requesting.save()

                # Update leave request status and tracking
                leave_request.status = 'approved'
                leave_request.approved_by_hr = hr_employee
                leave_request.hr_approval_timestamp = timezone.now()
                leave_request.save()

        except ValidationError as ve:
            raise ve
        except Exception as e:
            print(f"ERROR: Failed to approve leave request: {str(e)}")
            raise APIException(f"Failed to approve leave request: {str(e)}")

        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}")
        print(f"Subject: Leave Request Approved")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) has been approved by HR ({hr_employee.get_full_name()}).")
        print(f"--- END NOTIFICATION ---")

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post']) # Removed permission_classes
    def reject_hr(self, request, pk=None):
        """
        Action for HR to reject a leave request.
        Sets status from 'manager_approved' to 'rejected'. Requires a reason.
        """
        leave_request = self.get_object()
        hr_employee = getattr(request.user, 'employee', None)
        reason = request.data.get('reason', None)

        if not reason:
            raise ValidationError({"reason": "A rejection reason is required."})

        if leave_request.status != 'manager_approved':
            raise ValidationError(f"Request cannot be rejected by HR. Current status: {leave_request.get_status_display()}.")

        leave_request.status = 'rejected'
        leave_request.approved_by_hr = hr_employee
        leave_request.hr_approval_timestamp = timezone.now()
        leave_request.rejection_reason = reason
        leave_request.save()

        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}")
        print(f"Subject: Leave Request Rejected")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) was rejected by HR ({hr_employee.get_full_name()}). Reason: {reason}")
        print(f"--- END NOTIFICATION ---")

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post']) # Removed permission_classes
    def cancel(self, request, pk=None):
        """
        Action for an employee to cancel their own leave request.
        Sets status from 'approved' or 'pending' to 'cancelled'.
        """
        leave_request = self.get_object()
        requesting_employee = getattr(request.user, 'employee', None)

        if leave_request.employee != requesting_employee:
            raise PermissionDenied("You can only cancel your own leave requests.")

        if leave_request.status not in ['approved', 'pending']:
            raise ValidationError(f"Request cannot be cancelled. Current status: {leave_request.get_status_display()}.")

        leave_request.status = 'cancelled'
        leave_request.cancellation_timestamp = timezone.now()
        leave_request.save()

        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}")
        print(f"Subject: Leave Request Cancelled")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) has been cancelled.")
        print(f"--- END NOTIFICATION ---")

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)
