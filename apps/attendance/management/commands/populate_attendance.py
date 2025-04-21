import random
from datetime import date, timedelta, datetime, time
from django.core.management.base import BaseCommand
from django.utils import timezone # Use timezone-aware datetimes if settings.USE_TZ=True
from faker import Faker # Use Faker for more realistic random notes

from apps.employees.models import Employee
from apps.attendance.models import Attendance

class Command(BaseCommand):
    help = 'Populates the database with fake attendance data for the last N days'

    def add_arguments(self, parser):
        parser.add_argument(
            'days',
            type=int,
            # Updated help text to suggest 120 days for 4 months
            help='Number of past days to populate data for (e.g., 120 for approx 4 months)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing attendance data before populating',
        )

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
            self.stdout.write(self.style.ERROR('No employees found. Please populate employees first.'))
            return

        today = timezone.now().date() if timezone.is_aware(timezone.now()) else date.today()
        total_created = 0
        total_skipped = 0

        # Define statuses, separating 'absent'
        normal_statuses = ['present', 'remote', 'half_day', 'leave']
        absent_status = 'absent'
        # Define probability for being absent (e.g., 5%)
        absent_probability = 0.05

        self.stdout.write(f'Populating attendance data for the last {days_to_populate} days...')

        for i in range(days_to_populate):
            current_date = today - timedelta(days=i)

            # Optional: Skip weekends to make data slightly more realistic
            # if current_date.weekday() >= 5: # Monday=0, Sunday=6
            #     continue

            for employee in employees:
                # Check if record already exists for this employee and date
                if Attendance.objects.filter(employee=employee, date=current_date).exists():
                    total_skipped += 1
                    continue

                # --- Generate Random Attendance Data ---
                # Decide status with lower absent probability
                if random.random() < absent_probability:
                    status = absent_status
                else:
                    status = random.choice(normal_statuses)

                check_in_dt = None
                check_out_dt = None
                notes = None

                # Only generate times if status indicates presence
                if status in ['present', 'remote', 'half_day']:
                    # Generate random check-in time (e.g., 8:00 - 10:00)
                    check_in_hour = random.randint(8, 9)
                    check_in_minute = random.randint(0, 59)
                    check_in_time = time(check_in_hour, check_in_minute)
                    # Combine date and time - Use timezone.make_aware if USE_TZ=True
                    check_in_dt = datetime.combine(current_date, check_in_time)
                    if timezone.is_aware(timezone.now()):
                         check_in_dt = timezone.make_aware(check_in_dt, timezone.get_current_timezone())


                    # Generate random check-out time (e.g., 4 - 8 hours after check-in)
                    duration_hours = random.uniform(4.0, 8.5) if status != 'half_day' else random.uniform(3.5, 4.5)
                    check_out_dt = check_in_dt + timedelta(hours=duration_hours)

                    # Ensure check_out is on the same day unless duration pushes it over midnight (unlikely here)
                    if check_out_dt.date() != current_date:
                         # If it crosses midnight, cap it at 23:59:59 or handle as needed
                         max_time = time(23, 59, 59)
                         check_out_dt = datetime.combine(current_date, max_time)
                         if timezone.is_aware(timezone.now()):
                             check_out_dt = timezone.make_aware(check_out_dt, timezone.get_current_timezone())


                # --- Generate Random Notes ---
                # Always add notes for managers
                if employee.role == 'manager':
                    notes = fake.sentence(nb_words=random.randint(5, 15))
                # Sometimes add notes for other employees (e.g., 25% chance)
                elif random.random() < 0.25:
                     notes = fake.sentence(nb_words=random.randint(3, 10))


                # Create Attendance Record
                try:
                    Attendance.objects.create(
                        employee=employee,
                        date=current_date,
                        check_in=check_in_dt,
                        check_out=check_out_dt,
                        status=status,
                        notes=notes # Add the generated notes
                    )
                    total_created += 1
                except Exception as e: # Catch potential integrity errors if unique_together fails unexpectedly
                    self.stdout.write(self.style.ERROR(f"Error creating record for {employee} on {current_date}: {e}"))
                    total_skipped += 1


        self.stdout.write(self.style.SUCCESS(f'Successfully populated attendance data. Created: {total_created}, Skipped: {total_skipped}'))