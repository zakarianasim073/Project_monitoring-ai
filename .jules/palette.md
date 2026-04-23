## 2025-05-15 - [Login UX]
**Learning:** Adding role-specific 'Quick Login' buttons on the login page significantly streamlines testing and demoing by reducing manual input effort.
**Action:** Implement 'Quick Login' buttons for demo accounts in applications with fixed demo credentials.

## 2025-05-15 - [Accessibility & Interaction]
**Learning:** Icon-only buttons (like password toggles) require explicit `aria-label` for screen readers and visible focus states (e.g., `focus-visible:ring-2`) for keyboard users to be truly accessible.
**Action:** Always include `aria-label` and `focus-visible` ring styles on icon-only interactive elements.
