from django.core.management.base import BaseCommand
from apps.employees.models import Employee
from decimal import Decimal
import random # Example: Give random balances for testing

class Command(BaseCommand):
    help = 'Populates initial leave balances for existing employees who have 0.'

    def handle(self, *args, **options):
        # --- IMPORTANT: Customize this logic based on your company policy ---
        # This is just a basic example setting a default or random balance.
        # You might need logic based on hire date, role, contract type etc.

        default_paid_leave = Decimal('20.00')
        default_sick_leave = Decimal('10.00')

        employees_to_update = Employee.objects.filter(
            paid_leave_balance=Decimal('0.00'),
            sick_leave_balance=Decimal('0.00')
            # Add conditions if you only want to update certain employees
        )

        updated_count = 0
        self.stdout.write(f"Found {employees_to_update.count()} employees with zero balances to update...")

        for employee in employees_to_update:
            # Example Logic: Give everyone a default balance
            employee.paid_leave_balance = default_paid_leave
            employee.sick_leave_balance = default_sick_leave

            # # Example Logic 2: Give random balance for testing
            # employee.paid_leave_balance = Decimal(random.randint(5, 25))
            # employee.sick_leave_balance = Decimal(random.randint(3, 15))

            employee.save()
            updated_count += 1
            self.stdout.write(f"Updated balances for {employee.get_full_name()} ({employee.eID})")

        self.stdout.write(self.style.SUCCESS(f"Successfully updated initial balances for {updated_count} employees."))
        if employees_to_update.count() == 0:
             self.stdout.write(self.style.WARNING("No employees found with zero balances (already populated?)."))
