from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from apps.employees.views import (
    RegisterView, LoginView, EmployeeListCreateView,
    EmployeeDetailView, get_user_details, get_manager_team,
    PasswordResetRequestAPIView,
    PasswordResetConfirmAPIView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('user-details/', get_user_details, name='user-details'),
    path('manager-team/', get_manager_team, name='manager-team'),
    path('password-reset/', PasswordResetRequestAPIView.as_view(), name='api_password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmAPIView.as_view(), name='api_password_reset_confirm'),
]
