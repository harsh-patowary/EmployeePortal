import { subDays } from 'date-fns';

// Simulate different users/roles for authoring
const mockAuthors = {
  1: "John Doe (Admin)",
  5: "Jane Smith (Manager)",
  10: "Peter Jones (Employee)",
  12: "Susan Lee (HR)",
};

let nextId = 1;

export const mockNotices = [
  {
    id: nextId++,
    title: "System Maintenance Scheduled",
    content: "Please be advised that there will be scheduled system maintenance on Friday evening from 10:00 PM to 11:00 PM. Access to internal tools may be intermittent during this period.",
    author_id: 1,
    author_name: mockAuthors[1],
    created_at: subDays(new Date(), 1).toISOString(),
    scope: 'company', // company, team, department, direct
    priority: 'important', // normal, important, urgent
    target_team_id: null,
    target_department_id: null,
    target_employee_id: null,
  },
  {
    id: nextId++,
    title: "Team Lunch Next Wednesday",
    content: "Hi Team, let's grab lunch together next Wednesday at 12:30 PM. Meet in the lobby. Please RSVP by Monday so I can make a reservation.",
    author_id: 5,
    author_name: mockAuthors[5],
    created_at: subDays(new Date(), 2).toISOString(),
    scope: 'team',
    priority: 'normal',
    target_team_id: 2, // Example team ID
    target_department_id: null,
    target_employee_id: null,
  },
  {
    id: nextId++,
    title: "Reminder: Submit Expense Reports",
    content: "A friendly reminder to all employees in the Engineering department to submit your expense reports for the previous month by the end of this week (Friday EOD).",
    author_id: 12,
    author_name: mockAuthors[12],
    created_at: subDays(new Date(), 3).toISOString(),
    scope: 'department',
    priority: 'normal',
    target_team_id: null,
    target_department_id: 1, // Example department ID (Engineering)
    target_employee_id: null,
  },
  {
    id: nextId++,
    title: "Welcome New Team Member!",
    content: "Let's all give a warm welcome to Alex Green, who joins our team today! Alex will be working on the Project Phoenix initiative.",
    author_id: 5,
    author_name: mockAuthors[5],
    created_at: subDays(new Date(), 0).toISOString(),
    scope: 'team',
    priority: 'normal',
    target_team_id: 2,
    target_department_id: null,
    target_employee_id: null,
  },
    {
    id: nextId++,
    title: "Urgent: Security Update Required",
    content: "All employees must install the latest security patch on their workstations by end of day today. Instructions have been emailed separately. Failure to comply may result in restricted network access.",
    author_id: 1,
    author_name: mockAuthors[1],
    created_at: subDays(new Date(), 0).toISOString(),
    scope: 'company',
    priority: 'urgent',
    target_team_id: null,
    target_department_id: null,
    target_employee_id: null,
  },
   {
    id: nextId++,
    title: "Project Alpha - Quick Sync",
    content: "Peter, can we have a quick 15-minute sync regarding the latest updates on Project Alpha? Please let me know what time works for you tomorrow morning.",
    author_id: 5,
    author_name: mockAuthors[5],
    created_at: subDays(new Date(), 1).toISOString(),
    scope: 'direct',
    priority: 'normal',
    target_team_id: null,
    target_department_id: null,
    target_employee_id: 10, // Direct message to Peter Jones
  },
];

// Function to add a new mock notice (simulates backend creation)
export const addMockNotice = (noticeData) => {
  const newNotice = {
    id: nextId++,
    ...noticeData,
    created_at: new Date().toISOString(),
    // Simulate author based on who is logged in (needs user context)
    // For now, let's assume author_id 10 (Peter Jones) is creating
    author_id: noticeData.author_id || 10,
    author_name: mockAuthors[noticeData.author_id || 10] || 'Unknown Employee',
  };
  mockNotices.unshift(newNotice); // Add to the beginning
  return newNotice;
};