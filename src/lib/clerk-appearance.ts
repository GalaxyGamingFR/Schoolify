// Clerk's hosted widgets (SignIn/SignUp/UserButton) render into the same DOM
// tree as the rest of the app, so pointing these at the app's own CSS
// custom properties (defined in globals.css) means the widgets pick up
// the current light/dark theme automatically instead of needing a second,
// hand-maintained color set — see roadmap.md/STYLE.md for the palette these
// resolve to. Previously deferred (Phase 3 note: Clerk's widgets "aren't
// reskinned for dark mode") — this is that follow-up.
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--card)",
    colorInputBackground: "var(--background)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorTextOnPrimaryBackground: "var(--primary-foreground)",
    colorInputText: "var(--foreground)",
    colorNeutral: "var(--foreground)",
    colorDanger: "var(--destructive)",
    borderRadius: "var(--radius-lg)",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    card: "shadow-none border border-border bg-card/40 backdrop-blur-sm",
    headerTitle: "font-heading",
    formButtonPrimary:
      "bg-primary text-primary-foreground hover:bg-primary/80 shadow-none normal-case text-sm",
    socialButtonsBlockButton: "border border-border bg-background hover:bg-muted",
    formFieldInput: "border border-input bg-transparent",
    footer: "bg-transparent",
    // Hides just the "Secured by Clerk" badge (Clerk's own stable
    // `cl-footerItem` class), not the whole footer -- the "Don't have an
    // account? Sign up" action link is a separate element and stays.
    footerItem: "hidden",
    footerActionLink: "text-primary hover:text-primary/80",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    userButtonPopoverCard: "border border-border bg-popover shadow-md",
  },
};
