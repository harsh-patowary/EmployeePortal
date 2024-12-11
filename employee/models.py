from django.db import models

# Choices for dropdown fields
designations_opt = (
    ('Team Leader','Team Leader'),
    ('Project Manager','Project Manager'),
    ('Senior Developer','Senior Developer'),
    ('Junior Developer','Junior Developer'),
    ('Intern','Intern'),
    ('QA Tester','QA Tester')
)

months = [(str(i), month) for i, month in enumerate(
    ['January','February','March','April','May','June',
     'July','August','September','October','November','December']
)]

days = [(str(i), str(i)) for i in range(32)]  # Days 0-31

# Employee Model
class Employee(models.Model):
    eID = models.CharField(primary_key=True, max_length=20)
    firstName = models.CharField(max_length=50)
    middleName = models.CharField(max_length=50, blank=True, null=True)
    lastName = models.CharField(max_length=50)
    phoneNo = models.CharField(max_length=12, unique=True)
    email = models.EmailField(max_length=70, unique=True)
    dOB = models.DateField()
    designation = models.CharField(max_length=50, choices=designations_opt)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    joinDate = models.DateField()

    def __str__(self):
        return f"{self.eID} {self.firstName}"

# Attendance Model
class Attendance(models.Model):
    eId = models.ForeignKey(Employee, on_delete=models.CASCADE)
    month = models.CharField(max_length=50, choices=months)
    days = models.CharField(max_length=5, choices=days)

    def __str__(self):
        return f"{self.eId} - {self.month}"

# Notice Model
class Notice(models.Model):
    Id = models.CharField(primary_key=True, max_length=20)
    title = models.CharField(max_length=250)
    description = models.TextField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

# WorkAssignments Model
class WorkAssignments(models.Model):
    Id = models.CharField(max_length=20, primary_key=True)
    assignerId = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="assignerId")
    work = models.TextField()
    assignDate = models.DateTimeField()
    dueDate = models.DateTimeField()
    taskerId = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="taskerId")

# Requests Model
class Requests(models.Model):
    Id = models.CharField(max_length=20, primary_key=True)
    requesterId = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="requesterId")
    requestMessage = models.TextField()
    requestDate = models.DateTimeField()
    destinationEmployeeId = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="toEmployeeId")
