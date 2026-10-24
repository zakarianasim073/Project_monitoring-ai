# Palette Journal - UX & Accessibility Learnings

## 2026-06-05 - Initial Setup
**Learning:** Project uses a mix of Next.js scripts and Vite for building. Memory suggests Vite is more reliable for dev in this environment.
**Action:** Use Vite for frontend verification.

## 2026-06-05 - Role Switcher Accessibility
**Learning:** Hover-only dropdowns (group-hover) are inaccessible to keyboard and screen reader users.
**Action:** Implement state-controlled toggles with ARIA attributes.
