export const mockAttendanceData = [
    {
      id: 1,
      employee: 1,
      employee_name: "John Doe",
      date: "2023-05-01",
      check_in: "09:00:00",
      check_out: "17:30:00",
      status: "present",
      notes: "",
      duration_hours: 8.5
    },
    {
      id: 2,
      employee: 1,
      employee_name: "John Doe",
      date: "2023-05-02",
      check_in: "08:45:00",
      check_out: "17:15:00",
      status: "present",
      notes: "",
      duration_hours: 8.5
    },
    {
      id: 3,
      employee: 1,
      employee_name: "John Doe",
      date: "2023-05-03",
      check_in: null,
      check_out: null,
      status: "absent",
      notes: "Sick leave",
      duration_hours: null
    },
    {
      id: 4,
      employee: 1,
      employee_name: "John Doe",
      date: "2023-05-04",
      check_in: "09:15:00",
      check_out: "13:00:00",
      status: "half_day",
      notes: "Doctor appointment in afternoon",
      duration_hours: 3.75
    },
    {
      id: 5,
      employee: 1,
      employee_name: "John Doe",
      date: "2023-05-05",
      check_in: "08:30:00",
      check_out: "16:45:00",
      status: "remote",
      notes: "Working from home",
      duration_hours: 8.25
    }
  ];
  
  export const mockEmployees = [
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      department: "Engineering"
    },
    {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@example.com",
      department: "Marketing"
    }
  ];