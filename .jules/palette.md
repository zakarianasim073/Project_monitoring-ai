## 2026-06-15 - ProjectList Accessibility and Role Switcher UX
**Learning:** Hover-based menus are inaccessible to keyboard users and often fail on touch devices. Non-semantic clickable divs prevent screen reader users from understanding interactivity and skip the natural tab order.
**Action:** Use state-based click toggles for dropdowns with ARIA attributes (expanded/haspopup). Replace interactive divs with semantic button elements and ensure focus-visible rings are present for keyboard navigation.
