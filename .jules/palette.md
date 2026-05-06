# Palette's Journal - Critical UX/Accessibility Learnings

This journal documents critical UX and accessibility learnings discovered during development.

## 2025-05-14 - [Accessibility Refactor for Project Selection]
**Learning:** Hover-based interactive menus (e.g., using `group-hover`) are inaccessible to screen readers and keyboard-only users, as they lack state-based focus and ARIA signaling. Additionally, using `div` elements for clickable cards prevents users from navigating via the Tab key and fails to provide semantic roles to assistive technologies.
**Action:** Replace hover-based menus with `useState` managed click toggles, adding `aria-expanded` and `aria-haspopup` attributes. Convert interactive `div` containers to semantic `button` elements with `focus-visible` rings for clear keyboard navigation.
