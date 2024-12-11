from django import forms
from .models import WorkAssignments, Requests

# Work Form
class workform(forms.ModelForm):
    class Meta:
        model = WorkAssignments
        widgets = {
            "assignDate": forms.DateInput(attrs={'type': 'datetime-local'}),
            "dueDate": forms.DateInput(attrs={'type': 'datetime-local'}),
        }
        labels = {"assignerId": "Select Your ID"}
        fields = [
            "assignerId", "work", "assignDate", "dueDate", "taskerId",
        ]

# Make Request Form
class makeRequestForm(forms.ModelForm):
    class Meta:
        model = Requests
        widgets = {
            "requestDate": forms.DateInput(attrs={'type': 'datetime-local'}),
        }
        labels = {"requesterId": "Select Your ID"}
        fields = [
            "requesterId", "requestMessage", "requestDate", "destinationEmployeeId",
        ]
