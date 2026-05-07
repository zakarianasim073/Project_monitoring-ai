## 2026-07-28 - Accessible Role Switcher & Project Cards
**Learning:** The application frequently reverts to inaccessible hover-based menus and non-semantic `div` elements for interactive components; Palette re-remediates these using state-based click toggles, `aria-expanded`/`aria-haspopup` attributes, and semantic `button` tags with `focus-visible` rings.
**Action:** Always prefer state-based click interactions over CSS hover for menus, and ensure interactive cards are semantic `button` elements with proper ARIA labels.
