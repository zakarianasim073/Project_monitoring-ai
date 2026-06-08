## 2026-06-20 - [Accessible Role Switcher]
**Learning:** Replacing hover-only interactions (like Tailwind's `group-hover`) with explicit React state and click-outside listeners significantly improves accessibility for keyboard and screen reader users. Adding ARIA attributes like `aria-expanded` and `aria-haspopup` provides necessary context to assistive technologies.
**Action:** Always prefer state-controlled interactions over hover-only patterns for menus and dropdowns. Ensure every interactive element has a clear focus state and appropriate ARIA labels.
