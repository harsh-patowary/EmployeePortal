from django.shortcuts import redirect, render
from django.contrib.auth.models import User, auth
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from employee.models import Employee

# Login User
def login_user(request):
    if request.method == "POST":
        id = request.POST["id"]
        password = request.POST["password"]
        user = authenticate(request, username=id, password=password)
        if user:
            login(request, user)
            return redirect("/ems/dashboard")
        else:
            messages.error(request, "Invalid Credentials")
            return redirect("/")
    return render(request, "employee/Login.html")

# Logout User
def logout_user(request):
    logout(request)
    return redirect("/")

# Signup User
def signup(request):
    if request.method == "POST":
        id = request.POST["id"]
        password = request.POST["password"]
        cnfpass = request.POST["cnfpass"]

        if password == cnfpass:
            if Employee.objects.filter(eID=id).exists():
                if User.objects.filter(username=id).exists():
                    messages.error(request, "Employee Already Registered")
                else:
                    User.objects.create_user(username=id, password=password)
                    messages.success(request, "Registered Successfully")
                    return redirect("/")
            else:
                messages.error(request, "Invalid Employee ID")
        else:
            messages.error(request, "Passwords Do Not Match")
        return redirect("/signup")
    return render(request, "employee/signup.html")
