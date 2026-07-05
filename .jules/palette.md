## 2026-06-12 - Accessible Modal and File Upload Patterns
**Learning:** Using `display: none` or `hidden` on file inputs removes them from the tab order and makes them inaccessible to screen readers. Additionally, modals without ESC key listeners or backdrop click handlers can trap keyboard and mouse users.
**Action:** Always use `sr-only` for visually hidden inputs to maintain accessibility, and pair them with `focus-within` on parent containers to provide visual feedback for keyboard users. Ensure all modals implement a standard 'Escape' listener and backdrop click closure.
