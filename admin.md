# Schoolify Academy: Admin Dashboard Prompt

To recreate the Admin Dashboard component (`AdminDashboard.tsx`) for the Schoolify Academy portal using a simple prompt, provide the following instructions to an AI coding assistant.

## General Overview
Create an `AdminDashboard` React component that acts as the primary "Command Center" for platform administrators. It should provide a high-level overview of system health, user statistics, and recent activity, utilizing a dark, high-tech aesthetic with red accents (`#110C0C` backgrounds, `red-500` accents).

## Tech Stack & Dependencies
- **React:** Functional component using `useState` and `useEffect`.
- **Styling:** Tailwind CSS.
- **Icons:** `lucide-react` (specifically: `Users`, `Shield`, `AlertTriangle`, `TrendingUp`, `Activity`, `Database`).

## Layout & Aesthetics
- **Container:** `max-w-7xl mx-auto space-y-8` with a fade-in entrance animation (`animate-in fade-in duration-500`).
- **Header:** 
  - Title: "Admin Command Center" accompanied by a red `Shield` icon. Use a light `font-mono` styling (`text-2xl sm:text-3xl`).
  - Subtitle: "System administration and institutional oversight." in gray (`text-gray-500`).

## Core Sections

### 1. Key Statistics Grid
Create a responsive 4-column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) displaying the following metrics as clickable cards. Clicking a card should call an `onNavigate(path)` prop to route the admin to the appropriate page.
- **Cards Style:** Dark background (`bg-[#110C0C]`), subtle red borders (`border-red-900/30`), hovering increases border opacity (`hover:border-red-500/50`).
- **Metrics Data:**
  - **Total Active Users:** '4,289', Trend '+12%', Icon `Users`, Path `admin-users`, Color `text-blue-500`.
  - **System Health:** '99.9%', Trend 'Stable', Icon `Activity`, Path `admin-dashboard`, Color `text-green-500`.
  - **Active Sessions:** '842', Trend '+5%', Icon `TrendingUp`, Path `admin-users`, Color `text-purple-500`.
  - **Reported Issues:** '3', Trend '-2', Icon `AlertTriangle`, Path `admin-reports`, Color `text-red-500`.

### 2. Live Platform Traffic Chart
Create a visual representation of server/platform traffic alongside a recent events log in a 2-column grid (`lg:grid-cols-2`).
- **Header:** "Platform Traffic" with an `Activity` icon (red) and "Last 24h" label.
- **Visualization:** Build a pseudo-bar chart using an array of 12 height percentages (`[30, 45, 25, ...]`).
- **Animation:** Use a `useEffect` hook with a `setInterval` (every 2000ms) to simulate real-time data by shifting the array left and pushing a new random value between 30 and 100.
- **Bar Style:** The bars should sit in a 48-unit high container (`h-48`). Use relative positioning to grow from the bottom (`bottom-0`) with a red translucent fill (`bg-red-500/50`), transitioning smoothly when the height changes (`transition-all duration-500`).

### 3. Recent System Events Log
A read-only log feed placed next to the traffic chart.
- **Header:** "Recent System Events" with a `Database` icon (red).
- **Log Items:** Display a hardcoded list of recent events.
  - Each row should show a monospace timestamp (e.g., '10:42:05') and a message.
  - Separate items with a subtle red bottom border (`border-b border-red-900/30`).
  - Use different text colors based on event severity (e.g., standard info messages in `text-gray-300`, warnings in `text-yellow-500`).
  - **Example Logs:**
    - "User profile backup completed." (info)
    - "Failed login attempt (IP: 192.168.1.104)" (warn)
    - "API Gateway auto-scaled to 4 instances." (info)
    - "Daily data sync initiated." (info)

## Interactions
- The component must accept an optional `onNavigate?: (path: string) => void` prop to allow routing to other administrative views like `admin-users` and `admin-reports`.
