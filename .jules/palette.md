## 2026-06-15 - Accessibility for Project List and Role Switcher
**Learning:** Hover-based menus and non-semantic `div` elements for cards create significant barriers for keyboard and screen reader users. State-based click toggles combined with correct ARIA attributes and semantic HTML tags (like `button`) provide a much more robust and accessible experience.
**Action:** Always prefer click-to-open over hover-to-open for menus. Convert interactive `div` elements to `button` or `a` tags. Ensure `aria-expanded` and `aria-haspopup` are used on dropdown triggers.
