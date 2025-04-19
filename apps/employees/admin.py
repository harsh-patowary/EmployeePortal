from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('eID', 'get_full_name', 'email', 'position', 'department')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'eID', 'position')
    list_filter = ('department', 'date_hired')
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Name'
    
    def email(self, obj):
        return obj.user.email
