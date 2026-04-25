## 2025-05-14 - Semantic Interactive Cards
**Learning:** Project cards in this application were implemented using non-semantic `div` tags with `onClick` handlers, which prevents keyboard navigation and hides the interactive nature from screen readers.
**Action:** Always use `<button>` or `<a>` tags for clickable cards. Ensure `w-full` and `text-left` (or appropriate alignment) are applied to maintain layout, and include `focus-visible` styles for accessibility.
