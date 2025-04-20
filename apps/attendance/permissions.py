from rest_framework import permissions

class IsManagerOrReadOnly(permissions.BasePermission):
    """
    Allows read access to any authenticated user, but write access only to managers/admins/hr/directors.
    """

    def _get_user_role(self, user):
        """Helper to safely get the role from the related Employee profile."""
        try:
            # Adjust 'employee' if your related name from User to Employee is different
            return user.employee.role 
        except AttributeError:
            # Handle cases where the employee profile might not exist (shouldn't happen for logged-in users here)
            return None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = self._get_user_role(request.user)

        # Allow POST only for managers/admins/hr/directors
        if request.method == 'POST':
            # Check if user_role is one of the allowed roles
            return user_role in ['manager', 'admin', 'hr', 'director']

        # Allow GET, HEAD, OPTIONS for any authenticated user
        return True # Assumes IsAuthenticated is also checked by DRF

    def has_object_permission(self, request, view, obj):
        # Allow read permissions (GET, HEAD, OPTIONS) for any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions (PUT, PATCH, DELETE) are only allowed for managers/admins/hr/directors.
        user_role = self._get_user_role(request.user)
        # Check if user_role is one of the allowed roles
        return user_role in ['manager', 'admin', 'hr', 'director']