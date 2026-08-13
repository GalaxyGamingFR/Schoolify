# Prompt for Claude

Copy the text below and paste it to Claude along with your current React code (likely your `App.jsx` or main component file). 

***

Please refactor my React component's visual design. The current layout is structurally good, but it suffers from generic "default AI" styling. I want it to look like a premium, modern SaaS application (similar to Linear, Vercel, or shadcn/ui). 

Here are the strict design rules to apply using Tailwind CSS and Lucide React icons:

1. **Color Palette (No pure black/white):**
   - Background: Change pure black to `bg-zinc-950`.
   - Cards/Containers: Use `bg-zinc-900/40` with `backdrop-blur-sm`.
   - Borders: Add subtle `border border-zinc-800` to the welcome card, navigation, and inputs.
   - Text: Main text should be `text-zinc-100`, secondary text `text-zinc-400`.

2. **Typography & Spacing:**
   - Standardize the global font to a modern sans-serif (remove any serif fonts). 
   - The "Hey Galaxy" header should be larger, bolder, and use `tracking-tight`. 
   - Add generous padding. Increase the vertical spacing between the main sections so they can breathe.

3. **The "Add Task" Input Component:**
   - Make the input field taller and more substantial (e.g., `py-3 px-4`).
   - Remove the external "+" button. Instead, put the submit icon/button *inside* the right edge of the input field so it feels like a unified search/entry bar.
   - Add a subtle focus ring (`focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700`).

4. **Empty States & Buttons:**
   - Wrap the 'Nothing due today' and 'Nothing coming up' sections in subtle, rounded containers with a dashed border (`border-dashed border-zinc-800/80 p-8`) and centered, muted text.
   - Style the 'Add your first course' button to look like a sleek secondary button (`bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors`).