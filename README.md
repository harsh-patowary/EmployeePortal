# Employee Management Application

This project consists of a Django backend and a React frontend for managing employees, attendance, leave, etc.


## Application Screenshots

### Dashboard
![Dashboard Screenshot](ui1.png)

### Leave Management
![Leave Management Screenshot](ui2.png)

### Reports Dashboard
![Reports Dashboard Screenshot](ui3.png)


## Database Schema

Below is the project's database schema visualised. The diagram shows the main entities and relationships used for users, employees, attendance and leave requests.

![Database schema](schema.png)

<details>
<summary>PlantUML source</summary>

```plantuml
@startuml
' Define skin parameters for better readability
skinparam classAttributeIconSize 0
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam roundcorner 10
skinparam shadowing false
skinparam class {
        BackgroundColor PaleGreen
        ArrowColor Navy
        BorderColor Navy
}
skinparam note {
        BackgroundColor LightYellow
        BorderColor Gray
}

' --- Classes ---

class User {
    + username: string
    + email: string
    + first_name: string
    + last_name: string
    + is_staff: boolean
    + is_active: boolean
    + date_joined: datetime
    --
    + set_password(raw_password)
    + check_password(raw_password)
    + get_full_name()
    ' ... other standard User methods ...
}
note right of User: Django's built-in User model

class Employee {
    + eID: string {unique}
    + first_name: string
    + last_name: string
    + email: string {unique}
    + phone_number: string {unique}
    + DoB: date (nullable)
    + position: string
    + is_manager: boolean <<derived>>
    + role: string {choices: employee, manager, admin, hr, director}
    + department: string
    + salary: decimal
    + date_hired: date (nullable)
    + paid_leave_balance: decimal
    + sick_leave_balance: decimal
    --
    + get_full_name(): string
    + save()
}
note right of Employee::role
    Role defines permissions.
    is_manager is synced from role.
end note

class Attendance {
    + date: date
    + check_in: datetime (nullable)
    + check_out: datetime (nullable)
    + status: string {choices: present, absent, half_day, leave, remote}
    + notes: text (nullable)
    + created_at: datetime
    + updated_at: datetime
    --
    + duration(): float (nullable) <<property>>
}
note bottom of Attendance
    unique_together = (employee, date)
end note

class LeaveRequest {
    + leave_type: string {choices: paid, sick, unpaid, ...}
    + start_date: date
    + end_date: date
    + reason: text (nullable)
    + status: string {choices: pending, manager_approved, hr_approved, approved, rejected, cancelled}
    + manager_approval_timestamp: datetime (nullable)
    + hr_approval_timestamp: datetime (nullable)
    + rejection_reason: text (nullable)
    + created_at: datetime
    + updated_at: datetime
    --
    + duration_days(): int <<property>>
}

' --- Relationships ---

User "1" -- "1" Employee : user
Employee "1" -- "*" Attendance : employee
Employee "1" -- "*" LeaveRequest : employee

' Self-referencing relationship for manager
Employee "0..1" -- "*" Employee : manager / team_members

' Relationships for approval tracking in LeaveRequest
Employee "0..1" -- "*" LeaveRequest : approved_by_manager
Employee "0..1" -- "*" LeaveRequest : approved_by_hr


@enduml
```

</details>

Key entities

- User: Django's built-in authentication user. Stores credentials and basic profile fields.
- Employee: Extends the User with employment-specific data (employee id, role, department, leave balances, manager link).
- Attendance: Daily attendance records linked to an employee (check-in/out, status, notes).
- LeaveRequest: Employee leave requests with type, date range, approval status and timestamps.



## Prerequisites

*   **Python**: Version 3.8+ recommended.
*   **Node.js**: Version 14+ recommended, along with npm.
*   **Git**: For cloning the repository (if applicable).

## Backend Setup (Django)

1.  **Navigate to the project root directory:**
    ```bash
    cd d:\developement\employee_management
    ```

2.  **Create and activate a virtual environment (Recommended):**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # On Windows
    # source venv/bin/activate # On macOS/Linux
    ```

3.  **Install Python dependencies:**
    *(Assuming a requirements.txt file exists)*
    ```bash
    pip install -r requirements.txt
    ```
    *(If no requirements.txt exists, you might need to install Django and other dependencies manually: `pip install django djangorestframework django-cors-headers djangorestframework-simplejwt psycopg2-binary ...`)*

4.  **Apply database migrations:**
    ```bash
    python manage.py migrate
    ```

5.  **Create a superuser (for accessing the Django Admin):**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts to set up a username, email, and password.

6.  **Run the backend development server:**
    ```bash
    python manage.py runserver
    ```
    The backend API will typically be available at `http://127.0.0.1:8000/` or `http://localhost:8000/`.

## Frontend Setup (React)

1.  **Navigate to the frontend directory:**
    ```bash
    cd d:\developement\employee_management\frontend
    ```

2.  **Node dependencies:**
    *(In the frontend dir)*
    ```bash
    .\frontend-requirements.txt
    ```

3.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

4.  **Run the frontend development server:**
    ```bash
    npm start
    ```
    The React application will typically open automatically in your browser at `http://localhost:3000/`. If not, open it manually.

## Accessing the Application

*   **Frontend Application:** `http://localhost:3000`
*   **Backend API:** `http://localhost:8000/api/` (Base URL, specific endpoints vary)
*   **Django Admin:** `http://localhost:8000/admin/` (Login with superuser credentials)

## Default Login Credentials (from structure.txt)

*   **Superuser:** `root` / `toor` (or the one you created)
*   **CMS Login:** `rk12345` / `admin@123`
*   **HR Login** `aw93521`/ `hr123` ; `th63996`/ `hr123`; 
*   **Manager:** `ah95579` / `manager123`
*   **Employee:** `dc41393` / `employee123`

*(Note: Use these credentials for testing purposes. Ensure they are changed or managed securely in a production environment.)*  

---

