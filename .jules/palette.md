## 2026-06-11 - Accessible Role Switcher Pattern
**Learning:** Hover-only (`group-hover`) dropdowns are inaccessible to keyboard and screen reader users and can be finicky on touch devices. Explicit React state with `useRef` for outside-click and `Escape` key handling provides a much more robust and inclusive experience.
**Action:** Avoid CSS-only hover menus for interactive controls; always prefer state-controlled components with proper ARIA attributes.
