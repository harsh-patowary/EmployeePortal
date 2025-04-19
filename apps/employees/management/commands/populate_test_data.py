from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.employees.models import Employee
from django.utils import timezone
import random
from datetime import timedelta
import string

class Command(BaseCommand):
    help = 'Populates the database with test employee data including managers and their team members'

    def add_arguments(self, parser):
        parser.add_argument('--managers', type=int, default=5, help='Number of managers to create')
        parser.add_argument('--employees', type=int, default=25, help='Number of regular employees to create')
        
    def handle(self, *args, **kwargs):
        num_managers = kwargs['managers']
        num_employees = kwargs['employees']
        total = num_managers + num_employees
        
        self.stdout.write(f'Creating {num_managers} managers and {num_employees} employees...')
        
        # Lists of realistic data to use
        departments = ['Engineering', 'Marketing', 'Finance', 'Human Resources', 'Sales', 'Operations', 'Customer Support', 'Product']
        positions_by_dept = {
            'Engineering': ['Software Engineer', 'QA Engineer', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer'],
            'Marketing': ['Marketing Specialist', 'Content Writer', 'SEO Analyst', 'Social Media Manager', 'Brand Manager'],
            'Finance': ['Accountant', 'Financial Analyst', 'Bookkeeper', 'Auditor', 'Payroll Specialist'],
            'Human Resources': ['HR Coordinator', 'Recruiter', 'Benefits Administrator', 'Training Specialist', 'HR Analyst'],
            'Sales': ['Sales Representative', 'Account Manager', 'Business Development', 'Sales Associate', 'Sales Coordinator'],
            'Operations': ['Operations Manager', 'Business Analyst', 'Project Coordinator', 'Process Improvement Specialist', 'Operations Analyst'],
            'Customer Support': ['Customer Service Rep', 'Technical Support', 'Customer Success Manager', 'Support Specialist', 'Client Relations'],
            'Product': ['Product Manager', 'UX Designer', 'UI Designer', 'Product Analyst', 'Product Owner']
        }
        
        manager_positions = ['Department Manager', 'Team Lead', 'Director', 'Vice President', 'Senior Manager']
        first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
                      'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
                      'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra']
        last_names = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
                     'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
                     'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King']
        
        # Store created employees to assign managers later
        created_employees = []
        created_managers = []
        used_emails = set()
        used_phones = set()
        used_eIDs = set()
        used_usernames = set()
        
        # Function to generate unique email
        def generate_unique_email(first, last):
            email = f"{first.lower()}.{last.lower()}@company.com"
            if email in used_emails:
                email = f"{first.lower()}.{last.lower()}{random.randint(1, 999)}@company.com"
            used_emails.add(email)
            return email
        
        # Function to generate unique phone
        def generate_unique_phone():
            phone = f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            while phone in used_phones:
                phone = f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            used_phones.add(phone)
            return phone
        
        # Function to generate unique employee ID - 7 digit alphanumeric
        def generate_unique_eID():
            chars = string.ascii_uppercase + string.digits
            eID = ''.join(random.choice(chars) for _ in range(7))
            while eID in used_eIDs:
                eID = ''.join(random.choice(chars) for _ in range(7))
            used_eIDs.add(eID)
            return eID
            
        # Function to generate unique username in format: FL + 5 random numbers
        def generate_unique_username(first_name, last_name):
            initials = f"{first_name[0].lower()}{last_name[0].lower()}"
            random_digits = ''.join(str(random.randint(0, 9)) for _ in range(5))
            username = f"{initials}{random_digits}"
            
            while username in used_usernames:
                random_digits = ''.join(str(random.randint(0, 9)) for _ in range(5))
                username = f"{initials}{random_digits}"
                
            used_usernames.add(username)
            return username
        
        self.stdout.write("Creating managers...")
        
        # Create manager accounts
        for i in range(num_managers):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            username = generate_unique_username(first_name, last_name)
            email = generate_unique_email(first_name, last_name)
            
            # Randomize data
            department = random.choice(departments)
            position = f"{random.choice(manager_positions)} - {department}"
            date_hired = timezone.now().date() - timedelta(days=random.randint(365, 3650))
            
            # Create Django User
            user = User.objects.create_user(
                username=username,
                password='manager123',
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            
            # Create Employee with manager role
            manager_role = random.choice(['manager', 'manager', 'manager', 'hr', 'director'])
            
            employee = Employee.objects.create(
                user=user,
                eID=generate_unique_eID(),
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone_number=generate_unique_phone(),
                DoB=timezone.now().date() - timedelta(days=random.randint(10000, 20000)),
                position=position,
                role=manager_role,
                department=department,
                salary=random.randint(70000, 150000),
                date_hired=date_hired
            )
            
            # Save to assign employees later
            created_managers.append(employee)
            self.stdout.write(f"  Created manager: {first_name} {last_name} - Username: {username} - ID: {employee.eID} ({employee.role})")
        
        self.stdout.write("Creating regular employees...")
        
        # Create employee accounts
        for i in range(num_employees):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            username = generate_unique_username(first_name, last_name)
            email = generate_unique_email(first_name, last_name)
            
            # Randomize data
            department = random.choice(departments)
            position = random.choice(positions_by_dept[department])
            date_hired = timezone.now().date() - timedelta(days=random.randint(30, 3650))
            
            # Create Django User
            user = User.objects.create_user(
                username=username,
                password='employee123',
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            
            # Create Employee with regular role
            employee = Employee.objects.create(
                user=user,
                eID=generate_unique_eID(),
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone_number=generate_unique_phone(),
                DoB=timezone.now().date() - timedelta(days=random.randint(8000, 20000)),
                position=position,
                role='employee',
                department=department,
                salary=random.randint(40000, 90000),
                date_hired=date_hired
            )
            
            created_employees.append(employee)
            self.stdout.write(f"  Created employee: {first_name} {last_name} - Username: {username} - ID: {employee.eID}")
        
        # Assign employees to managers
        self.stdout.write("Assigning employees to managers...")
        
        # Group managers by department
        managers_by_dept = {}
        for manager in created_managers:
            if manager.department not in managers_by_dept:
                managers_by_dept[manager.department] = []
            managers_by_dept[manager.department].append(manager)
        
        # Assign each employee to a manager in the same department if possible
        for employee in created_employees:
            dept = employee.department
            
            # If there are managers in this department
            if dept in managers_by_dept and managers_by_dept[dept]:
                # Randomly select a manager from the same department
                manager = random.choice(managers_by_dept[dept])
                employee.manager = manager
                employee.save()
                self.stdout.write(f"  Assigned {employee.first_name} {employee.last_name} to {manager.first_name} {manager.last_name}")
            else:
                self.stdout.write(f"  No manager found for {employee.first_name} {employee.last_name} in {dept} department")
                
                # Assign to a random manager if no department match
                if created_managers:
                    random_manager = random.choice(created_managers)
                    employee.manager = random_manager
                    employee.save()
                    self.stdout.write(f"  Assigned {employee.first_name} {employee.last_name} to {random_manager.first_name} {random_manager.last_name} (different department)")
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {num_managers} managers and {num_employees} employees'))
        self.stdout.write(self.style.SUCCESS(f'Sample login credentials:'))
        if created_managers:
            self.stdout.write(self.style.SUCCESS(f'Manager: Username={created_managers[0].user.username}, Password=manager123'))
        if created_employees:
            self.stdout.write(self.style.SUCCESS(f'Employee: Username={created_employees[0].user.username}, Password=employee123'))