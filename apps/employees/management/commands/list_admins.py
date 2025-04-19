from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Lists all users with admin access'

    def handle(self, *args, **kwargs):
        admins = User.objects.filter(is_superuser=True)
        staff = User.objects.filter(is_staff=True, is_superuser=False)
        
        self.stdout.write(self.style.SUCCESS('=== Superusers ==='))
        for user in admins:
            self.stdout.write(f"Username: {user.username}, Email: {user.email}")
        
        self.stdout.write(self.style.SUCCESS('\n=== Staff Users ==='))
        for user in staff:
            self.stdout.write(f"Username: {user.username}, Email: {user.email}")