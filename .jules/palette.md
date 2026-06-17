# Palette's UX Journal

## 2026-06-25 - State-controlled Dropdowns for Role Switching
**Learning:** Hover-only interactions (`group-hover`) are inaccessible for keyboard users and touch devices. State-controlled click-based dropdowns with `useRef` for outside-click detection and `Escape` key handling provide a much more robust and accessible experience.
**Action:** Always prioritize state-controlled click interactions over CSS-only hover states for interactive menus. Ensure `aria-expanded`, `aria-haspopup`, and proper focus management are implemented.
