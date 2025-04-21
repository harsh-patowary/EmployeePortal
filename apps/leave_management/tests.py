from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from apps.employees.models import Employee # Import Employee model
from .models import LeaveRequest
from datetime import date, timedelta
import decimal # Import decimal for salary
import random # Import random for phone number generation
import string # Import string

# Helper function to create users and employees for tests
def create_test_user_employee(username, password, role, manager=None, first_name="Test", last_name="User", paid_leave=decimal.Decimal('20.0'), sick_leave=decimal.Decimal('10.0')): # Add defaults
    user = User.objects.create_user(username=username, password=password, first_name=first_name, last_name=last_name)

    # Generate a unique phone number for testing
    unique_phone = f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
    while Employee.objects.filter(phone_number=unique_phone).exists():
         unique_phone = f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"

    # Generate a unique eID (similar logic might already exist in your Employee model or populate script)
    unique_eid = f"E{username}{random.randint(100,999)}" # Make eID more unique for tests
    while Employee.objects.filter(eID=unique_eid).exists():
         unique_eid = f"E{username}{random.randint(100,999)}"

    employee = Employee.objects.create(
        user=user,
        eID=unique_eid, # Use generated unique eID
        first_name=first_name,
        last_name=last_name,
        email=f"{username}@test.com", # Ensure this is unique too if needed
        phone_number=unique_phone,
        position="Test Position", # <-- ADD DEFAULT POSITION HERE
        role=role,
        department="Test Dept",
        manager=manager,
        salary=decimal.Decimal('50000.00'),
        # --- ADD BALANCES ---
        paid_leave_balance=paid_leave,
        sick_leave_balance=sick_leave,
        # Add other required Employee fields with defaults if necessary
        # e.g., date_hired=date.today() if required
    )
    return user, employee

class LeaveRequestAPITests(APITestCase):
    """
    Tests for the LeaveRequest API endpoints.
    """
    def setUp(self):
        """
        Set up test data: create users/employees with different roles.
        """
        # Create a manager
        self.manager_user, self.manager_employee = create_test_user_employee(
            "testmanager", "testpass123", "manager"
        )
        # Create an employee reporting to the manager
        self.employee_user, self.employee_employee = create_test_user_employee(
            "testemployee", "testpass123", "employee", manager=self.manager_employee
        )
        # Create another employee (no relation for now)
        self.other_employee_user, self.other_employee = create_test_user_employee(
            "otheremployee", "testpass123", "employee"
        )
        # Create HR user
        self.hr_user, self.hr_employee = create_test_user_employee(
            "testhr", "testpass123", "hr"
        )
        # Create Admin user
        self.admin_user, self.admin_employee = create_test_user_employee(
            "testadmin", "testpass123", "admin"
        )

        # URL for the list/create endpoint
        self.list_create_url = reverse('leave-request-list') # Uses basename from urls.py

        # Authenticated client instance
        self.client = APIClient()

    # --- Authentication Tests ---
    def test_unauthenticated_access_list(self):
        """Ensure unauthenticated users cannot list requests."""
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_access_create(self):
        """Ensure unauthenticated users cannot create requests."""
        data = {
            "leave_type": "paid",
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=2),
            "reason": "Test reason"
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Creation Tests (POST) ---
    def test_employee_create_leave_request(self):
        """Test that a logged-in employee can create a leave request."""
        self.client.force_authenticate(user=self.employee_user)
        data = {
            "leave_type": "paid",
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=2),
            "reason": "Vacation"
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LeaveRequest.objects.count(), 1)
        created_request = LeaveRequest.objects.first()
        self.assertEqual(created_request.employee, self.employee_employee)
        self.assertEqual(created_request.status, 'pending')
        self.assertEqual(created_request.reason, "Vacation")

    def test_create_request_invalid_dates(self):
        """Test creating a request with end_date before start_date fails."""
        self.client.force_authenticate(user=self.employee_user)
        data = {
            "leave_type": "paid",
            "start_date": date.today(),
            "end_date": date.today() - timedelta(days=1), # Invalid end date
            "reason": "Time travel"
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('end_date', response.data) # Check if error is related to end_date

    # --- List Tests (GET) ---
    def test_employee_list_only_own_requests(self):
        """Test employee sees only their own requests."""
        # Create requests for different employees
        LeaveRequest.objects.create(employee=self.employee_employee, start_date=date.today(), end_date=date.today())
        LeaveRequest.objects.create(employee=self.other_employee, start_date=date.today(), end_date=date.today())

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data # <-- CHANGE THIS LINE
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['employee_details']['id'], self.employee_employee.id)

    def test_manager_list_own_and_team_requests(self):
        """Test manager sees their own requests and their direct reports' requests."""
        # Create requests
        req_manager = LeaveRequest.objects.create(employee=self.manager_employee, start_date=date.today(), end_date=date.today())
        req_employee = LeaveRequest.objects.create(employee=self.employee_employee, start_date=date.today(), end_date=date.today()) # Reports to manager
        req_other = LeaveRequest.objects.create(employee=self.other_employee, start_date=date.today(), end_date=date.today()) # Does not report

        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data # <-- CHANGE THIS LINE
        self.assertEqual(len(results), 2)
        request_ids = {req['id'] for req in results}
        self.assertIn(req_manager.id, request_ids)
        self.assertIn(req_employee.id, request_ids)
        self.assertNotIn(req_other.id, request_ids)

    # --- Retrieve Tests (GET /id/) ---
    def test_employee_retrieve_own_request(self):
        """Test employee can retrieve their own request."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, start_date=date.today(), end_date=date.today())
        detail_url = reverse('leave-request-detail', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], req.id)

    def test_employee_cannot_retrieve_others_request(self):
        """Test employee cannot retrieve another employee's request."""
        req_other = LeaveRequest.objects.create(employee=self.other_employee, start_date=date.today(), end_date=date.today())
        detail_url = reverse('leave-request-detail', kwargs={'pk': req_other.pk})

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Because get_queryset filters it out

    # --- Update Tests (PATCH /id/) ---
    def test_employee_update_own_pending_request(self):
        """Test employee can update their own pending request (e.g., reason)."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today(), reason="Initial")
        detail_url = reverse('leave-request-detail', kwargs={'pk': req.pk})
        update_data = {"reason": "Updated Reason"}

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.reason, "Updated Reason")

    def test_employee_cannot_update_status_directly(self):
        """Test employee cannot change the status field directly via PATCH."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        detail_url = reverse('leave-request-detail', kwargs={'pk': req.pk})
        update_data = {"status": "approved"} # Attempt to bypass workflow

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK) # Update might succeed but...
        req.refresh_from_db()
        self.assertEqual(req.status, 'pending') # Status should remain unchanged due to read_only_fields

    def test_employee_cannot_update_others_request(self):
        """Test employee cannot update another employee's request."""
        req_other = LeaveRequest.objects.create(employee=self.other_employee, status='pending', start_date=date.today(), end_date=date.today(), reason="Initial")
        detail_url = reverse('leave-request-detail', kwargs={'pk': req_other.pk})
        update_data = {"reason": "Attempted Update"}

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Filtered out by get_queryset

    # --- Delete Tests (DELETE /id/) ---
    def test_employee_delete_own_pending_request(self):
        """Test employee can delete their own pending request."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        detail_url = reverse('leave-request-detail', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(LeaveRequest.objects.count(), 0)

    def test_employee_cannot_delete_others_request(self):
        """Test employee cannot delete another employee's request."""
        req_other = LeaveRequest.objects.create(employee=self.other_employee, status='pending', start_date=date.today(), end_date=date.today())
        detail_url = reverse('leave-request-detail', kwargs={'pk': req_other.pk})

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Filtered out
        self.assertEqual(LeaveRequest.objects.count(), 1)

    # Add more tests for HR, Admin roles, and edge cases (e.g., trying to update/delete non-pending requests)

    # --- Workflow Action Tests ---

    # --- Manager Actions ---
    def test_manager_approve_request(self):
        """Test manager can approve a pending request from their direct report."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-approve-manager', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.manager_user)
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'manager_approved')
        self.assertEqual(req.approved_by_manager, self.manager_employee)
        self.assertIsNotNone(req.manager_approval_timestamp)

    def test_manager_cannot_approve_non_pending(self):
        """Test manager cannot approve a request not in 'pending' state."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='approved', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-approve-manager', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.manager_user)
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # ValidationError
        req.refresh_from_db()
        self.assertEqual(req.status, 'approved') # Status unchanged

    def test_wrong_manager_cannot_approve(self):
        """Test a manager cannot approve a request for an employee not reporting to them."""
        # Create another manager
        other_manager_user, other_manager = create_test_user_employee("othermanager", "testpass123", "manager")
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-approve-manager', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=other_manager_user) # Authenticate as the wrong manager
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # <-- CHANGE THIS LINE (404 is correct due to get_queryset)
        req.refresh_from_db()
        self.assertEqual(req.status, 'pending') # Status unchanged

    def test_employee_cannot_approve_manager(self):
        """Test an employee cannot use the manager approval action."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-approve-manager', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.employee_user) # Authenticate as employee
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # PermissionDenied

    def test_manager_reject_request(self):
        """Test manager can reject a pending request with a reason."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-reject-manager', kwargs={'pk': req.pk})
        rejection_data = {"reason": "Project deadline"}

        self.client.force_authenticate(user=self.manager_user)
        response = self.client.post(action_url, rejection_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'rejected')
        self.assertEqual(req.approved_by_manager, self.manager_employee) # Manager who rejected
        self.assertIsNotNone(req.manager_approval_timestamp) # Timestamp of rejection
        self.assertEqual(req.rejection_reason, "Project deadline")

    def test_manager_reject_request_requires_reason(self):
        """Test manager rejection fails without a reason."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-reject-manager', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.manager_user)
        response = self.client.post(action_url, {}, format='json') # Empty data
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    # --- HR Actions ---
    def test_hr_approve_request(self):
        """Test HR can approve a manager_approved request."""
        # Ensure employee has enough balance for the test request duration
        self.employee_employee.paid_leave_balance = decimal.Decimal('5.0') # Set sufficient balance
        self.employee_employee.save()

        req = LeaveRequest.objects.create(
            employee=self.employee_employee,
            status='manager_approved',
            approved_by_manager=self.manager_employee,
            leave_type='paid', # Use a type with balance check
            start_date=date.today(),
            end_date=date.today() + timedelta(days=1) # 2 day duration
        )
        action_url = reverse('leave-request-approve-hr', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.hr_user)
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'approved')
        self.assertEqual(req.approved_by_hr, self.hr_employee)
        self.assertIsNotNone(req.hr_approval_timestamp)

        # Verify balance deduction
        self.employee_employee.refresh_from_db()
        self.assertEqual(self.employee_employee.paid_leave_balance, decimal.Decimal('3.0')) # 5.0 - 2.0

    def test_hr_approve_request_insufficient_balance(self):
        """Test HR approval fails if balance is insufficient."""
        self.employee_employee.paid_leave_balance = decimal.Decimal('1.0') # Set insufficient balance
        self.employee_employee.save()

        req = LeaveRequest.objects.create(
            employee=self.employee_employee,
            status='manager_approved',
            approved_by_manager=self.manager_employee,
            leave_type='paid',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=1) # 2 day duration
        )
        action_url = reverse('leave-request-approve-hr', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.hr_user)
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # Should be validation error
        self.assertIn('Insufficient paid leave balance', response.data[0]) # Check error message
        req.refresh_from_db()
        self.assertEqual(req.status, 'manager_approved') # Status should not change
        self.employee_employee.refresh_from_db()
        self.assertEqual(self.employee_employee.paid_leave_balance, decimal.Decimal('1.0')) # Balance should not change

    def test_hr_cannot_approve_pending(self):
        """Test HR cannot approve a request that is still pending manager approval."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-approve-hr', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.hr_user)
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # <-- CHANGE THIS LINE (404 is correct due to get_queryset)
        req.refresh_from_db()
        self.assertEqual(req.status, 'pending')

    def test_manager_cannot_approve_hr(self):
        """Test a manager cannot use the HR approval action."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='manager_approved', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-approve-hr', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.manager_user) # Authenticate as manager
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # PermissionDenied

    def test_hr_reject_request(self):
        """Test HR can reject a manager_approved request with a reason."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='manager_approved', approved_by_manager=self.manager_employee, start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-reject-hr', kwargs={'pk': req.pk})
        rejection_data = {"reason": "Company policy conflict"}

        self.client.force_authenticate(user=self.hr_user)
        response = self.client.post(action_url, rejection_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'rejected')
        self.assertEqual(req.approved_by_hr, self.hr_employee) # HR who rejected
        self.assertIsNotNone(req.hr_approval_timestamp) # Timestamp of rejection
        self.assertEqual(req.rejection_reason, "Company policy conflict")

    def test_hr_reject_request_requires_reason(self):
        """Test HR rejection fails without a reason."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='manager_approved', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-reject-hr', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.hr_user)
        response = self.client.post(action_url, {}, format='json') # Empty data
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    # --- Cancellation Action ---
    def test_employee_cancel_own_pending_request(self):
        """Test employee can cancel their own pending request."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-cancel', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'cancelled')

    def test_employee_cancel_own_manager_approved_request(self):
        """Test employee can cancel their own manager_approved request."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='manager_approved', approved_by_manager=self.manager_employee, start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-cancel', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'cancelled')

    def test_employee_cannot_cancel_approved_request(self):
        """Test employee cannot cancel a fully approved request."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='approved', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-cancel', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # ValidationError
        req.refresh_from_db()
        self.assertEqual(req.status, 'approved')

    def test_employee_cannot_cancel_others_request(self):
        """Test employee cannot cancel another employee's request."""
        req_other = LeaveRequest.objects.create(employee=self.other_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-cancel', kwargs={'pk': req_other.pk})

        self.client.force_authenticate(user=self.employee_user) # Authenticate as different employee
        response = self.client.post(action_url)
        # This might be 403 (PermissionDenied) or 404 (if get_object filters based on user)
        # Based on current view action, it uses get_object first, then checks permission
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        req_other.refresh_from_db()
        self.assertEqual(req_other.status, 'pending')

    def test_manager_cannot_cancel_employee_request(self):
        """Test manager cannot use the cancel action on an employee's request."""
        req = LeaveRequest.objects.create(employee=self.employee_employee, status='pending', start_date=date.today(), end_date=date.today())
        action_url = reverse('leave-request-cancel', kwargs={'pk': req.pk})

        self.client.force_authenticate(user=self.manager_user) # Authenticate as manager
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # PermissionDenied

    # Add more tests for Admin roles if their permissions differ for actions
