# Palette UX/Accessibility Journal

This file tracks critical UX and accessibility learnings for the project.

## 2026-07-28 - Role Switcher and Project Navigation Accessibility
**Learning:** Interactive elements like role switchers and project cards should use semantic `button` elements and state-based visibility (rather than hover-only) to ensure keyboard accessibility and screen reader compatibility.
**Action:** Always prefer `button` for click actions, implement `aria-expanded` for menus, and use state-based toggles for dropdowns.
