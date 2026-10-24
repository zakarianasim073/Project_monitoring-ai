# Palette's UX Journal

## 2026-06-11 - [Role Switcher Accessibility]
**Learning:** Hover-only interactions for critical UI elements like role switchers are inaccessible to keyboard and screen reader users and feel "fragile" on touch devices.
**Action:** Always implement dropdowns as state-controlled components with explicit toggle buttons, ARIA attributes, and Escape key support.

## 2026-06-11 - [Component Structure Integrity]
**Learning:** React components with floating JSX (outside the main component function) cause rendering inconsistencies and build-time confusion, especially in monorepos.
**Action:** Ensure all UI logic and sub-components are properly encapsulated within the main component or imported from dedicated files.
