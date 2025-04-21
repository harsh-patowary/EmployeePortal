import random
from datetime import date, timedelta, datetime, time
from django.core.management.base import BaseCommand
from django.utils import timezone # Use timezone-aware datetimes if settings.USE_TZ=True
from faker import Faker # Use Faker for more realistic random notes
from django.db import transaction # Import transaction

from apps.employees.models import Employee
from apps.attendance.models import Attendance

class Command(BaseCommand):
    help = 'Populates the database with fake attendance data for the last N days for existing employees.'

    def add_arguments(self, parser):
        parser.add_argument(
            'days',
            type=int,
            default=120, # Default to 120 days
            help='Number of past days to populate data for (e.g., 120 for approx 4 months)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing attendance data before populating',
        )

    @transaction.atomic # Wrap handle in a transaction
    def handle(self, *args, **options):
        days_to_populate = options['days']
        clear_existing = options['clear']
        fake = Faker()

        if clear_existing:
            self.stdout.write(self.style.WARNING('Clearing existing attendance data...'))
            Attendance.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        employees = Employee.objects.all()
        if not employees.exists():
            self.stdout.write(self.style.ERROR('No employees found. Please run populate_test_data first.'))
            return

        today = timezone.now().date() if timezone.is_aware(timezone.now()) else date.today()
        total_created = 0
        total_skipped = 0 # Keep track of skipped records

        # Define statuses, separating 'absent'
        normal_statuses = ['present', 'remote', 'half_day', 'leave']
        absent_status = 'absent'
        # Define probability for being absent (e.g., 5%)
        absent_probability = 0.05

        self.stdout.write(f'Populating attendance data for {employees.count()} employees over the last {days_to_populate} days...')

        # --- Pre-fetch existing records for faster checking ---
        # Create a set of (employee_id, date) tuples for existing records
        existing_records = set(
            Attendance.objects.filter(
                date__gte=today - timedelta(days=days_to_populate - 1)
            ).values_list('employee_id', 'date')
        )
        self.stdout.write(f"Found {len(existing_records)} existing records in the date range to potentially skip.")


        records_to_create = [] # Batch create records for efficiency

        for i in range(days_to_populate):
            current_date = today - timedelta(days=i)

            # Optional: Skip weekends
            # if current_date.weekday() >= 5: continue

            for employee in employees:
                # Check if record already exists using the pre-fetched set
                if (employee.id, current_date) in existing_records:
                    total_skipped += 1
                    continue

                # --- Generate Random Attendance Data ---
                if random.random() < absent_probability:
                    status = absent_status
                else:
                    status = random.choice(normal_statuses)

                check_in_dt = None
                check_out_dt = None
                notes = None

                if status in ['present', 'remote', 'half_day']:
                    check_in_hour = random.randint(8, 9)
                    check_in_minute = random.randint(0, 59)
                    check_in_time = time(check_in_hour, check_in_minute)
                    check_in_dt_naive = datetime.combine(current_date, check_in_time)

                    duration_hours = random.uniform(4.0, 8.5) if status != 'half_day' else random.uniform(3.5, 4.5)
                    check_out_dt_naive = check_in_dt_naive + timedelta(hours=duration_hours)

                    # Ensure check_out is on the same day unless duration pushes it over midnight
                    if check_out_dt_naive.date() != current_date:
                         max_time = time(23, 59, 59)
                         check_out_dt_naive = datetime.combine(current_date, max_time)

                    # Make aware if using timezones
                    if timezone.is_aware(timezone.now()):
                         check_in_dt = timezone.make_aware(check_in_dt_naive, timezone.get_current_timezone())
                         check_out_dt = timezone.make_aware(check_out_dt_naive, timezone.get_current_timezone())
                    else:
                         check_in_dt = check_in_dt_naive
                         check_out_dt = check_out_dt_naive


                # --- Generate Random Notes ---
                # Add notes for 'manager', 'admin', 'director' roles more often
                if employee.role in ['manager', 'admin', 'director']:
                     if random.random() < 0.6: # 60% chance for higher roles
                         notes = fake.sentence(nb_words=random.randint(5, 15))
                # Sometimes add notes for other employees (e.g., 20% chance)
                elif random.random() < 0.20:
                     notes = fake.sentence(nb_words=random.randint(3, 10))

                # Add record to batch list
                records_to_create.append(
                    Attendance(
                        employee=employee,
                        date=current_date,
                        check_in=check_in_dt,
                        check_out=check_out_dt,
                        status=status,
                        notes=notes,
                        _order=0  # <-- ADD THIS LINE
                    )
                )

        # Bulk create records
        if records_to_create:
            try:
                Attendance.objects.bulk_create(records_to_create, batch_size=500) # Adjust batch_size as needed
                total_created = len(records_to_create)
                self.stdout.write(f"Bulk creating {total_created} records...")
            except Exception as e:
                 self.stdout.write(self.style.ERROR(f"Error during bulk create: {e}"))
                 # Optionally, you could fall back to individual creation here if bulk fails
                 total_created = 0 # Reset count as bulk failed


        self.stdout.write(self.style.SUCCESS(f'Finished populating attendance data. Attempted to Create: {total_created}, Skipped (already existed): {total_skipped}'))