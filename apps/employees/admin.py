from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('eID', 'get_full_name', 'email', 'position', 'department', 'role', 'paid_leave_balance', 'sick_leave_balance') # Added role and balances
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'eID', 'position', 'email') # Added email
    list_filter = ('department', 'role', 'date_hired') # Added role
    readonly_fields = ('paid_leave_balance', 'sick_leave_balance') # Make balances read-only in admin

    def get_full_name(self, obj):
        # Use employee first/last name directly if available
        return f"{obj.first_name} {obj.last_name}" if obj.first_name else obj.user.username
    get_full_name.short_description = 'Name'

    # Remove email method if using employee.email directly
    # def email(self, obj):
    #     return obj.email # Use direct field

    # Optional: Add balances to fieldsets for detail view
    fieldsets = (
        (None, {'fields': ('user', 'eID', 'first_name', 'last_name', 'email', 'phone_number')}),
        ('Employment Details', {'fields': ('position', 'role', 'department', 'salary', 'date_hired', 'manager', 'is_manager')}),
        ('Personal Information', {'fields': ('DoB',), 'classes': ('collapse',)}),
        ('Leave Balances', {'fields': ('paid_leave_balance', 'sick_leave_balance'), 'classes': ('collapse',)}), # New fieldset
    )
