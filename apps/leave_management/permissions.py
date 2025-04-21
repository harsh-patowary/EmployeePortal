from rest_framework import permissions
from .models import Employee # Assuming Employee model is accessible or adjust import

class IsRequestOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a leave request to access/edit it
    (for specific actions like cancel or update).
    """
    message = "You do not have permission to perform this action on this request."

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed, so we'll always allow GET, HEAD or OPTIONS requests.
        # if request.method in permissions.SAFE_METHODS:
        #     return True # Or apply stricter read permissions if needed

        # Write permissions are only allowed to the owner of the request.
        requesting_employee = getattr(request.user, 'employee', None)
        return requesting_employee and obj.employee == requesting_employee

class IsRequestManager(permissions.BasePermission):
    """
    Custom permission to only allow the direct manager of the employee
    who submitted the request to perform manager actions.
    """
    message = "You must be the direct manager of the employee to perform this action."

    def has_object_permission(self, request, view, obj):
        manager_employee = getattr(request.user, 'employee', None)
        # Check if the user is an employee and if they are the manager of the request's employee
        return manager_employee and obj.employee.manager == manager_employee

class IsHR(permissions.BasePermission):
    """
    Custom permission to only allow users with HR, Admin, or Director roles.
    """
    message = "You must have HR, Admin, or Director privileges to perform this action."

    def has_permission(self, request, view):
        # Check permission based on the user's role without needing a specific object yet
        hr_employee = getattr(request.user, 'employee', None)
        return hr_employee and hr_employee.role in ['hr', 'admin', 'director']

    # Optional: If HR actions also need object-level checks (though role check might be sufficient)
    # def has_object_permission(self, request, view, obj):
    #     hr_employee = getattr(request.user, 'employee', None)
    #     return hr_employee and hr_employee.role in ['hr', 'admin', 'director']

# You might also create combined permissions if needed, e.g., IsOwnerOrManager