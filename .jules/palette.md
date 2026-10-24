# Palette's UX & Accessibility Journal

## 2026-05-15 - Modal Trap Persistence
**Learning:** Common UI patterns like modals often omit escape hatches (Close button, ESC key, backdrop click) in rapid development, leading to "modal traps" that break user flow and accessibility. This project has seen recurring regressions in this area.
**Action:** Always implement a standard "Accessible Modal" pattern: Close (X) button, Cancel button, ESC key listener, and backdrop click dismissal.

## 2026-05-15 - Hover-based Menus
**Learning:** CSS `hover` based dropdowns are inaccessible to keyboard and touch users.
**Action:** Use state-driven visibility for dropdowns and ensure the trigger is a `<button>` that can be activated via space/enter.
