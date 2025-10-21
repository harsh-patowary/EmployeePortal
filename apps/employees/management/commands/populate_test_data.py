from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.employees.models import Employee
from django.db import transaction # Import transaction
from django.utils import timezone
import random
from datetime import timedelta
import string
from decimal import Decimal # Ensure Decimal is imported

class Command(BaseCommand):
    help = 'Populates the database with test employee data reflecting an organizational hierarchy.'

    def add_arguments(self, parser):
        # Define target counts for roles
        parser.add_argument('--directors', type=int, default=2, help='Number of Directors to create')
        parser.add_argument('--admins', type=int, default=4, help='Number of Admins (Mid-Level Managers) to create')
        parser.add_argument('--hr', type=int, default=3, help='Number of HR Staff to create')
        parser.add_argument('--managers', type=int, default=10, help='Number of Managers (Team Leads) to create')
        parser.add_argument('--employees', type=int, default=30, help='Number of regular Employees to create')
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing Employee and related User data before populating',
        )

    @transaction.atomic # Wrap handle in a transaction
    def handle(self, *args, **kwargs):
        num_directors = kwargs['directors']
        num_admins = kwargs['admins']
        num_hr = kwargs['hr']
        num_managers = kwargs['managers']
        num_employees = kwargs['employees']
        clear_existing = kwargs['clear']

        if clear_existing:
            self.stdout.write(self.style.WARNING('Clearing existing Employee and User data...'))
            # Delete Employees first due to potential foreign key constraints from User
            Employee.objects.all().delete()
            # Delete non-superuser Users (be careful not to delete your admin user)
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        self.stdout.write(f'Creating {num_directors} Directors, {num_admins} Admins, {num_hr} HR, {num_managers} Managers, and {num_employees} Employees...')

        # --- Data Lists (Keep as is or modify if needed) ---
        departments = ['Engineering', 'Marketing', 'Finance', 'Human Resources', 'Sales', 'Operations', 'Customer Support', 'Product']
        positions_by_dept = {
            'Engineering': ['Software Engineer', 'QA Engineer', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Tech Lead'],
            'Marketing': ['Marketing Specialist', 'Content Writer', 'SEO Analyst', 'Social Media Manager', 'Brand Manager'],
            'Finance': ['Accountant', 'Financial Analyst', 'Bookkeeper', 'Auditor', 'Payroll Specialist'],
            'Human Resources': ['HR Coordinator', 'Recruiter', 'Benefits Administrator', 'Training Specialist', 'HR Analyst'],
            'Sales': ['Sales Representative', 'Account Manager', 'Business Development', 'Sales Associate', 'Sales Coordinator'],
            'Operations': ['Operations Manager', 'Business Analyst', 'Project Coordinator', 'Process Improvement Specialist', 'Operations Analyst'],
            'Customer Support': ['Customer Service Rep', 'Technical Support', 'Customer Success Manager', 'Support Specialist', 'Client Relations'],
            'Product': ['Product Manager', 'UX Designer', 'UI Designer', 'Product Analyst', 'Product Owner']
        }
        # More distinct position names based on level
        director_positions = ['Director', 'VP', 'Head']
        admin_positions = ['Senior Manager', 'Department Head', 'Group Lead']
        manager_positions = ['Team Lead', 'Supervisor', 'Project Manager', 'Lead Developer'] # Team Lead level

        first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
                      'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
                      'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
                      'Steven', 'Ashley', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kevin', 'Dorothy'] # Added more names
        last_names = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
                     'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
                     'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King',
                     'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter'] # Added more names

        # --- Store created objects for linking ---
        created_directors = []
        created_admins = []
        created_hr_staff = []
        created_managers = []
        created_employees = []
        used_emails = set()
        used_phones = set()
        used_eIDs = set()
        used_usernames = set()

        # --- Helper Functions (Keep as is) ---
        def generate_unique_email(first, last):
            email = f"{first.lower()}.{last.lower()}@company.com"
            counter = 1
            while email in used_emails or User.objects.filter(email=email).exists():
                email = f"{first.lower()}.{last.lower()}{counter}@company.com"
                counter += 1
            used_emails.add(email)
            return email

        def generate_unique_phone():
            phone = f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            while phone in used_phones or Employee.objects.filter(phone_number=phone).exists():
                phone = f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            used_phones.add(phone)
            return phone

        def generate_unique_eID():
            chars = string.ascii_uppercase + string.digits
            eID = ''.join(random.choice(chars) for _ in range(7))
            while eID in used_eIDs or Employee.objects.filter(eID=eID).exists():
                eID = ''.join(random.choice(chars) for _ in range(7))
            used_eIDs.add(eID)
            return eID

        def generate_unique_username(first_name, last_name):
            initials = f"{first_name[0].lower()}{last_name[0].lower()}"
            random_digits = ''.join(str(random.randint(0, 9)) for _ in range(5))
            username = f"{initials}{random_digits}"
            while username in used_usernames or User.objects.filter(username=username).exists():
                random_digits = ''.join(str(random.randint(0, 9)) for _ in range(5))
                username = f"{initials}{random_digits}"
            used_usernames.add(username)
            return username

        # --- Function to create Employee and User ---
        def create_employee_user(role, manager_obj=None, specific_dept=None, position_list=None, salary_range=(50000, 100000), password='password123'):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            username = generate_unique_username(first_name, last_name)
            email = generate_unique_email(first_name, last_name)
            department = specific_dept if specific_dept else random.choice(departments)

            if position_list:
                 # If specific positions are provided (like for managers/directors)
                 position_base = random.choice(position_list)
                 position = f"{position_base}, {department}" if department != 'Executive' else position_base # Avoid 'Director, Executive'
            else:
                 # Use department-specific positions for regular employees
                 position = random.choice(positions_by_dept.get(department, ['Associate']))

            date_hired = timezone.now().date() - timedelta(days=random.randint(30, 3650))
            dob = timezone.now().date() - timedelta(days=random.randint(7300, 23725)) # Approx 20-65 years old

            # Create Django User
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                first_name=first_name,
                last_name=last_name
            )

            # Create Employee
            employee = Employee.objects.create(
                user=user,
                eID=generate_unique_eID(),
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone_number=generate_unique_phone(),
                DoB=dob,
                position=position,
                role=role,
                department=department,
                salary=Decimal(random.randint(salary_range[0], salary_range[1])), # Ensure salary is Decimal
                date_hired=date_hired,
                manager=manager_obj, # Assign manager here
                # --- SET INITIAL BALANCES FOR TEST DATA ---
                paid_leave_balance=Decimal('20.00'), # Example: Give a starting balance
                sick_leave_balance=Decimal('10.00')  # Example: Give a starting balance
            )
            self.stdout.write(f"  Created {role}: {first_name} {last_name} (User: {username}, eID: {employee.eID}, Dept: {department})")
            return employee

        # --- Create Hierarchy ---

        # 1. Create Directors (No Manager)
        self.stdout.write("Creating Directors...")
        for _ in range(num_directors):
            # Assign a broad department or 'Executive'
            dept = random.choice(departments + ['Executive'])
            director = create_employee_user(
                role='director',
                manager_obj=None,
                specific_dept=dept,
                position_list=director_positions,
                salary_range=(120000, 250000),
                password='director123'
            )
            created_directors.append(director)

        # 2. Create Admins (Report to Directors)
        self.stdout.write("Creating Admins (Mid-Level Managers)...")
        if not created_directors:
            self.stdout.write(self.style.WARNING("  No directors created, cannot assign managers to admins."))
        for _ in range(num_admins):
            manager = random.choice(created_directors) if created_directors else None
            dept = random.choice(departments) # Admins likely manage specific depts
            admin = create_employee_user(
                role='admin',
                manager_obj=manager,
                specific_dept=dept,
                position_list=admin_positions,
                salary_range=(90000, 160000),
                password='admin123'
            )
            created_admins.append(admin)

        # 3. Create HR Staff (Report to Directors or Admins)
        self.stdout.write("Creating HR Staff...")
        possible_hr_managers = created_directors + created_admins
        if not possible_hr_managers:
             self.stdout.write(self.style.WARNING("  No directors or admins created, cannot assign managers to HR staff."))
        for _ in range(num_hr):
            manager = random.choice(possible_hr_managers) if possible_hr_managers else None
            # HR staff are in the HR department
            hr_staff = create_employee_user(
                role='hr',
                manager_obj=manager,
                specific_dept='Human Resources',
                position_list=positions_by_dept['Human Resources'], # Use HR specific roles
                salary_range=(60000, 110000),
                password='hr123'
            )
            created_hr_staff.append(hr_staff)

        # 4. Create Managers (Team Leads - Report to Admins)
        self.stdout.write("Creating Managers (Team Leads)...")
        if not created_admins:
             self.stdout.write(self.style.WARNING("  No admins created, cannot assign managers to Team Leads."))
        for _ in range(num_managers):
            # Assign manager to an Admin, preferably in the same dept if possible
            admin_manager = random.choice(created_admins) if created_admins else None
            dept = admin_manager.department if admin_manager else random.choice(departments) # Inherit dept or random
            manager = create_employee_user(
                role='manager',
                manager_obj=admin_manager,
                specific_dept=dept,
                position_list=manager_positions,
                salary_range=(70000, 120000),
                password='manager123'
            )
            created_managers.append(manager)

        # 5. Create Employees (Report to Managers/Team Leads)
        self.stdout.write("Creating Employees...")
        if not created_managers:
             self.stdout.write(self.style.WARNING("  No managers (Team Leads) created, cannot assign managers to employees."))
        for _ in range(num_employees):
             # Assign employee to a Manager (Team Lead), preferably in the same dept
            team_lead_manager = random.choice(created_managers) if created_managers else None
            dept = team_lead_manager.department if team_lead_manager else random.choice(departments) # Inherit dept or random
            employee = create_employee_user(
                role='employee',
                manager_obj=team_lead_manager,
                specific_dept=dept,
                # position_list is None, uses positions_by_dept
                salary_range=(40000, 90000),
                password='employee123'
            )
            created_employees.append(employee)


        # --- Final Output ---
        total_created = len(created_directors) + len(created_admins) + len(created_hr_staff) + len(created_managers) + len(created_employees)
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {total_created} employees with hierarchy.'))
        self.stdout.write(self.style.SUCCESS(f'Sample login credentials:'))
        # Provide samples for each role if they exist
        if created_directors: self.stdout.write(self.style.SUCCESS(f'  Director: Username={created_directors[0].user.username}, Password=director123'))
        if created_admins: self.stdout.write(self.style.SUCCESS(f'  Admin: Username={created_admins[0].user.username}, Password=admin123'))
        if created_hr_staff: self.stdout.write(self.style.SUCCESS(f'  HR: Username={created_hr_staff[0].user.username}, Password=hr123'))
        if created_managers: self.stdout.write(self.style.SUCCESS(f'  Manager: Username={created_managers[0].user.username}, Password=manager123'))
        if created_employees: self.stdout.write(self.style.SUCCESS(f'  Employee: Username={created_employees[0].user.username}, Password=employee123'))