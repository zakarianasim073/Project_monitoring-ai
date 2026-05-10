## 2026-07-29 - [A11y & Dropdown Refactor]
**Learning:** Hover-based dropdown menus are inaccessible to keyboard users and prone to accidental closing. Semantic buttons should always be used for interactive elements instead of divs with onClick.
**Action:** Always prefer state-based click interactions over CSS hover for menus, and ensure interactive cards are semantic button elements (using type="button") with proper focus-visible styles.
