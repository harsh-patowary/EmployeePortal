# filepath: d:\developement\employee_management\apps\leave_management\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveRequestViewSet

# Create a router and register our viewset with it.
router = DefaultRouter()
router.register(r'requests', LeaveRequestViewSet, basename='leave-request')
# Using basename='leave-request' is good practice if get_queryset is complex

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    # You can add other app-specific non-viewset URLs here if needed
]