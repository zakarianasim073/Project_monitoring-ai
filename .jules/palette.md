## 2026-06-08 - Prioritizing state-controlled interactions over hover
**Learning:** Hover-based menus (e.g., using Tailwind's `group-hover`) are inherently inaccessible to screen readers and keyboard-only users as they don't provide state feedback or reliable focus management.
**Action:** Always implement dropdowns and menus using explicit React state to toggle visibility, and accompany them with appropriate ARIA attributes like `aria-expanded` and `aria-haspopup`.
