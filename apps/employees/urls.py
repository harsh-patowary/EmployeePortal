from django.urls import path
# Import TokenRefreshView
from rest_framework_simplejwt.views import TokenRefreshView 
from apps.employees.views import (
    RegisterView, LoginView, EmployeeListCreateView, 
    EmployeeDetailView, get_user_details, get_manager_team
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    # Add the token refresh endpoint
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('user-details/', get_user_details, name='user-details'),
    path('manager-team/', get_manager_team, name='manager-team'),
]
