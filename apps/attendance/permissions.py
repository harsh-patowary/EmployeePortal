from rest_framework import permissions

class IsManagerOrReadOnly(permissions.BasePermission):
    """
    Allow read access to all authenticated users,
    but only allow write operations to managers.
    """
    
    def has_permission(self, request, view):
        # Always allow read-only methods
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # For write operations, check if user is a manager
        try:
            employee = request.user.employee
            return employee.position.lower() == 'manager'
        except:
            return False