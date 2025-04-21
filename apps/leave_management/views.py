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
        Dynamically filter queryset based on user role.
        - Employees see only their own requests.
        - Managers see their own requests + requests of their direct reports.
        - HR sees requests needing HR approval + potentially others (configurable).
        - Admins/Directors see all requests (or based on specific rules).
        """
        user = self.request.user

        # Ensure user has an associated employee profile
        try:
            employee = user.employee # Assumes OneToOneField named 'employee' on User or related_name
        except Employee.DoesNotExist:
            # Or handle as an error, but returning none is safer for querysets
            return LeaveRequest.objects.none()

        if employee.role == 'employee':
            # Regular employees see only their own requests
            return LeaveRequest.objects.filter(employee=employee)
        elif employee.role == 'manager':
            # Managers see their own requests AND requests from their team members
            return LeaveRequest.objects.filter(
                Q(employee=employee) | Q(employee__manager=employee)
            ).distinct() # Use distinct if an employee could somehow be their own manager
        elif employee.role == 'hr':
            # HR sees requests pending HR approval, plus potentially all approved/rejected ones
            # This logic can be refined based on exact workflow needs
            # Example: Show requests needing HR action + own requests
            return LeaveRequest.objects.filter(
                 Q(employee=employee) |
                 Q(status='manager_approved') | # Needs HR review
                 Q(status='hr_approved') |      # Already handled by HR
                 Q(status='approved') |         # Final state
                 Q(status='rejected') |         # Final state
                 Q(status='cancelled')          # Maybe HR wants to see cancelled ones too?
            ).distinct()
        elif employee.role in ['admin', 'director']:
            # Admins/Directors see everything (adjust if needed)
            return LeaveRequest.objects.all()
        else:
            # Fallback for unknown roles (shouldn't happen ideally)
            return LeaveRequest.objects.none()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires,
        based on the action being performed.
        """
        if self.action in ['approve_manager', 'reject_manager']:
            # Only the direct manager can perform these actions
            permission_classes = [permissions.IsAuthenticated, IsRequestManager]
        elif self.action in ['approve_hr', 'reject_hr']:
            # Only HR/Admin/Director can perform these actions
            permission_classes = [permissions.IsAuthenticated, IsHR]
        elif self.action == 'cancel':
            # Only the owner can cancel
            permission_classes = [permissions.IsAuthenticated, IsRequestOwner]
        elif self.action in ['update', 'partial_update']:
            # Only owner can update (e.g., reason, dates if pending)
            # Note: Consider if managers/HR should be able to update certain fields.
            # If so, you might need a more complex permission like IsOwnerOrAdminOrHR
            permission_classes = [permissions.IsAuthenticated, IsRequestOwner]
        elif self.action == 'destroy':
             # Only owner can delete (and likely only if pending/cancelled)
             # State check should remain in the perform_destroy or override destroy method
             permission_classes = [permissions.IsAuthenticated, IsRequestOwner]
        elif self.action in ['list', 'retrieve', 'create']:
            # Basic authentication is sufficient, queryset filtering handles visibility
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Default to IsAuthenticated for any other custom actions
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Automatically set the employee to the logged-in user when creating a request.
        """
        try:
            employee = self.request.user.employee
            # Set default status to 'pending' on creation
            serializer.save(employee=employee, status='pending')
        except Employee.DoesNotExist:
             # Handle case where user has no employee profile
             # This shouldn't happen if user creation enforces profile creation
             from rest_framework.exceptions import ValidationError
             raise ValidationError("User does not have an associated employee profile.")
        except Exception as e:
             # Catch other potential errors during save
             from rest_framework.exceptions import APIException
             raise APIException(f"Failed to create leave request: {str(e)}")


    # --- Action methods for Approvals/Rejections/Cancellations ---

    @action(detail=True, methods=['post']) # Removed permission_classes from decorator
    def approve_manager(self, request, pk=None):
        """
        Action for a manager to approve a leave request.
        Sets status from 'pending' to 'manager_approved'.
        """
        leave_request = self.get_object() # Gets the specific LeaveRequest instance
        manager_employee = getattr(request.user, 'employee', None)

        # State Check: Can only approve if currently pending
        if leave_request.status != 'pending':
            raise ValidationError(f"Request cannot be approved by manager. Current status: {leave_request.get_status_display()}.")

        # Update Status and Tracking
        leave_request.status = 'manager_approved'
        leave_request.approved_by_manager = manager_employee
        leave_request.manager_approval_timestamp = timezone.now()
        leave_request.rejection_reason = "" # Clear any previous rejection reason if applicable
        leave_request.save()

        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}")
        print(f"Subject: Leave Request Partially Approved")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) has been approved by your manager ({manager_employee.get_full_name()}) and is now pending HR approval.")
        print(f"--- END NOTIFICATION ---")
        # Replace print statements with actual email sending (e.g., using Django's send_mail)

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post']) # Removed permission_classes
    def reject_manager(self, request, pk=None):
        """
        Action for a manager to reject a leave request.
        Sets status from 'pending' to 'rejected'. Requires a reason.
        """
        leave_request = self.get_object()
        manager_employee = getattr(request.user, 'employee', None)
        reason = request.data.get('reason', None) # Get reason from request body

        if not reason:
            raise ValidationError({"reason": "A rejection reason is required."})

        # State Check
        if leave_request.status != 'pending':
             raise ValidationError(f"Request cannot be rejected by manager. Current status: {leave_request.get_status_display()}.")

        # Update Status and Tracking
        leave_request.status = 'rejected'
        leave_request.approved_by_manager = manager_employee # Still record who actioned it
        leave_request.manager_approval_timestamp = timezone.now()
        leave_request.rejection_reason = reason
        leave_request.save()

        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}")
        print(f"Subject: Leave Request Rejected")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) was rejected by your manager ({manager_employee.get_full_name()}). Reason: {reason}")
        print(f"--- END NOTIFICATION ---")
        # Replace print statements with actual email sending

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
        employee_requesting = leave_request.employee # Get the employee who made the request

        # State Check
        if leave_request.status != 'manager_approved':
            raise ValidationError(f"Request cannot be approved by HR. Current status: {leave_request.get_status_display()}.")

        # --- Balance Check & Deduction Logic ---
        leave_type = leave_request.leave_type
        duration_decimal = Decimal(calculate_leave_duration(leave_request.start_date, leave_request.end_date))

        try:
            with transaction.atomic(): # Ensure atomic update
                # Refresh employee instance within transaction to prevent race conditions
                employee_requesting.refresh_from_db()

                sufficient_balance = False
                current_balance = Decimal('0.00')

                if leave_type == 'paid':
                    current_balance = employee_requesting.paid_leave_balance
                    if current_balance >= duration_decimal:
                        employee_requesting.paid_leave_balance -= duration_decimal
                        sufficient_balance = True
                elif leave_type == 'sick':
                    current_balance = employee_requesting.sick_leave_balance
                    if current_balance >= duration_decimal:
                        employee_requesting.sick_leave_balance -= duration_decimal
                        sufficient_balance = True
                elif leave_type == 'unpaid':
                    # No balance check needed, but maybe track taken days?
                    # employee_requesting.unpaid_leave_taken += duration_decimal # If tracking
                    sufficient_balance = True
                # Add elif for other leave types with balances...
                else:
                    # Assume other types don't require balance check or are not implemented yet
                    sufficient_balance = True # Or raise error if type is unknown/unsupported

                if not sufficient_balance:
                    raise ValidationError(
                        f"Insufficient {leave_type.replace('_', ' ')} balance. "
                        f"Required: {duration_decimal}, Available: {current_balance}."
                    )

                # If balance check passed, update request and save both
                leave_request.status = 'approved'
                leave_request.approved_by_hr = hr_employee
                leave_request.hr_approval_timestamp = timezone.now()
                leave_request.rejection_reason = ""

                leave_request.save()
                employee_requesting.save() # Save the updated balance

        except ValidationError as ve:
            # Re-raise validation errors (like insufficient balance)
            raise ve
        except Exception as e:
            # Handle potential errors during transaction
            # Log the error e
            raise APIException(f"An error occurred during the approval process: {str(e)}")
        # --- End Balance Check & Deduction ---


        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}")
        print(f"Subject: Leave Request Approved")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) has been fully approved by HR ({hr_employee.get_full_name()}).")
        if leave_request.approved_by_manager:
             print(f"CC: {leave_request.approved_by_manager.email}")
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

        # State Check
        if leave_request.status != 'manager_approved':
             raise ValidationError(f"Request cannot be rejected by HR. Current status: {leave_request.get_status_display()}.")

        # Update Status and Tracking
        leave_request.status = 'rejected'
        leave_request.approved_by_hr = hr_employee # Record who actioned it
        leave_request.hr_approval_timestamp = timezone.now()
        leave_request.rejection_reason = reason
        leave_request.save()

        # --- Notification Logic ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}")
        print(f"Subject: Leave Request Rejected")
        print(f"Body: Your leave request ({leave_request.start_date} to {leave_request.end_date}) was rejected by HR ({hr_employee.get_full_name()}). Reason: {reason}")
        # Optionally notify manager too?
        if leave_request.approved_by_manager:
             print(f"CC: {leave_request.approved_by_manager.email}")
        print(f"--- END NOTIFICATION ---")
        # Replace print statements with actual email sending

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post']) # Removed permission_classes
    def cancel(self, request, pk=None):
        """
        Action for an employee to cancel their own pending or manager-approved leave request.
        Sets status to 'cancelled'.
        """
        leave_request = self.get_object()
        requesting_employee = getattr(request.user, 'employee', None)

        # State Check: Can only cancel if pending or manager_approved
        if leave_request.status not in ['pending', 'manager_approved']:
            raise ValidationError(f"Request cannot be cancelled. Current status: {leave_request.get_status_display()}.")

        original_status = leave_request.status # Get status before changing
        leave_request.status = 'cancelled'
        leave_request.save()

        # --- Notification Logic (Optional for Cancellation) ---
        print(f"--- NOTIFICATION ---")
        print(f"To: {leave_request.employee.email}") # Notify self
        print(f"Subject: Leave Request Cancelled")
        print(f"Body: You have cancelled your leave request ({leave_request.start_date} to {leave_request.end_date}).")
        # Notify manager/HR if it was already approved by them?
        if original_status == 'manager_approved' and leave_request.approved_by_manager:
            print(f"CC: {leave_request.approved_by_manager.email}")
            print(f"Body (Manager): Employee {leave_request.employee.get_full_name()} cancelled a leave request you previously approved.")
        print(f"--- END NOTIFICATION ---")
        # Replace print statements with actual email sending

        serializer = self.get_serializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # You might also want to override perform_update and perform_destroy
    # to add state checks (e.g., only allow updates/deletes if status is 'pending')
    # Example for destroy:
    # def perform_destroy(self, instance):
    #     if instance.status not in ['pending', 'cancelled']: # Or just 'pending'
    #         raise ValidationError(f"Cannot delete request with status: {instance.get_status_display()}")
    #     instance.delete()
