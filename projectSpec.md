# Schoolify Academy: Full-Stack React Application Prompt

To recreate this application from scratch using a simple prompt, provide the following instructions to an AI coding assistant.

## General Overview
Create a comprehensive, single-page application (SPA) called "Schoolify Academy" (also referred to as the Schoolify Portal). It serves as a modern, high-tech dashboard for both students and administrators.
- **Tech Stack:** React 18+, Vite, Tailwind CSS, Lucide React (for icons).
- **Styling:** Use Tailwind CSS for utility-first styling. The UI must be sleek, modern, and dark-themed (e.g., `bg-[#0A0A0B]` for backgrounds, `bg-[#161618]` for cards). Use vibrant accents like cyan (`#00D1FF`) and red (`text-red-500` for admin actions). 
- **Typography:** Use an elegant sans-serif (like Inter) for body text and a monospace font (like JetBrains Mono or Space Grotesk) for headers, labels, and small uppercase tracking text (`tracking-widest`). No custom fonts need to be imported if not available, but use Tailwind's `font-sans` and `font-mono`.

## Architecture & Layout
- **State Management:** Use standard React hooks (`useState`, `useEffect`) and persist critical state (user profile, auth state, admin logs, blogs) in `localStorage`.
- **Layout:**
  - **Sidebar:** Dynamic sidebar navigation. Student view contains links to Dashboard, Academics, Grade Optimizer, Study Plan, University Engine, Analytics, Competitions, Messages, Blog, Calendar, Parent Portal, and Settings. Admin view contains links to Admin Dashboard, User Directory, System Logs, Security & Access, Broadcasts, Reports, and Content Manager.
  - **Header/Navbar:** Contains the user's profile icon and name, logout button, and a dynamic title.
- **Simulation Mode:** Admins have the ability to "Simulate" a user's session. When simulating, the app acts as if the admin is logged in as that user, and a banner/indicator is shown in the header (e.g., "Sim: User Name (End)") to allow ending the simulation.

## Core Features

### 1. Authentication (Login)
- A single login screen with a sleek card interface.
- Fields for Email, Password, Full Name (for registration).
- School selector dropdown (default: "Schoolify Academy").
- Support for "Simulated" Social Logins (Google, Microsoft, Apple, GitHub) using small loading delays before redirecting.
- If the user logs in as "Administrator" (or email contains "admin"), route them to the Admin Dashboard. Otherwise, route them to the Student Dashboard.

### 2. Student Dashboard
- **Dashboard:** Overview of classes, recent grades, upcoming assignments, and GPA trajectory.
- **Academics:** Detailed view of current courses and grades.
- **Grade Optimizer:** Interactive tool to calculate what grade is needed on a final to get a desired overall grade.
- **Study Plan:** Kanban-style or list view of tasks.
- **University Engine:** A college admissions probability and application tracker.
- **Analytics:** Charts/graphs showing performance trends.
- **Competitions & Extracurriculars:** Tracking student involvement outside of class.
- **Messages / Blog:** A place to view announcements and internal messaging.
- **Calendar:** Event tracking.
- **Parent Portal:** Specific view/metrics meant to be shared with parents.
- **Settings:** Update profile details (Name, Email, School, Avatar).

### 3. Admin Dashboard
- **Admin Overview:** System health, active sessions, reported issues, and total users.
- **User Directory (`AdminUsers`):**
  - List of all users.
  - Ability to toggle user status between Active, Suspended, Pending, and Inactive.
  - Ability to provision new accounts.
  - Ability to click "Simulate" on a user to log in as them (triggers `isSimulating` mode in the app).
- **System Logs (`AdminLogs`):** Read-only view of recent system activities, errors, and logins.
- **Security & Access (`AdminSecurity`):**
  - Buttons to "Force Global Logout", "Wipe Local Cache Data", and "Initiate Lockdown Protocol". Clicking these should append to the system logs and show UI notifications.
- **Broadcasts (`AdminBroadcasts`):**
  - Ability to send a global push notification/announcement. Uses a radio icon for its sidebar entry.
- **Reports (`AdminReports`):**
  - View reported issues (bugs, platform violations).
  - Ability to mark issues as "Resolved". Uses an alert triangle icon for its sidebar entry.
- **Content Manager (`AdminBlogs`):**
  - Manage blog posts/announcements.
  - Create, edit, and delete posts.
  - Ability to view a post and its comments, and reply to user comments as an Administrator.

## General Requirements
- Ensure all forms have proper state management and validation.
- All "Delete" or "Destructive" actions should have a confirmation state or at least a clear UI notification (e.g. custom toast/alert).
- Use `lucide-react` for all iconography. Ensure standard icons are used, such as `Radio` for Broadcasts and `AlertTriangle` for Reports.
- Never use the term "Pro Tier" anywhere in the app; all features should be accessible without simulated paywalls.
- All components must be cleanly separated (e.g. `/src/pages`, `/src/components/layout`).
- Persist mock data in `localStorage` so that refreshing the page does not reset changes made during the session.
