## 2026-07-28 - [Accessibility & Interaction]
**Learning:** Avoid hover-only menus as they are inaccessible to touch and keyboard users. Always prefer state-based click-to-open patterns with appropriate ARIA attributes. Interactive card elements should be semantic `button` tags rather than `div` tags with `onClick` to ensure they are focusable and announceable.
**Action:** Use semantic `button` for interactive cards and state-managed menus with `aria-expanded` and `aria-haspopup`.
