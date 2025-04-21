from django.contrib import admin
from .models import Attendance

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status', 'check_in', 'check_out', 'duration')
    list_filter = ('status', 'date')
    search_fields = ('employee__first_name', 'employee__last_name', 'notes')
    date_hierarchy = 'date'