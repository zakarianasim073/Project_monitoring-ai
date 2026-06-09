## 2026-06-09 - Accessible State-Controlled Dropdowns
**Learning:** Hover-only menus (e.g., using Tailwind `group-hover`) are inaccessible to keyboard and screen reader users and can be frustrating on touch devices. Explicit React state with click triggers provides a more robust and accessible interaction model.
**Action:** Always use explicit state for menus/dropdowns, and include click-outside, `Escape` key handlers, and ARIA attributes (`aria-expanded`, `aria-haspopup`) to ensure full accessibility and a polished UX.
