# 🎨 Palette's UX & Accessibility Journal

## 2026-06-09 - Accessible Role Switcher in ProjectList
**Learning:** Hover-only triggers (using Tailwind's `group-hover`) for menus are inaccessible to keyboard and screen reader users. They also provide a poor user experience on mobile and can be finicky on desktop if the hover area is lost.

**Action:** Always use explicit React state (e.g., `isRoleMenuOpen`) for menus and dropdowns. Combine with `useRef` for outside-click detection and add `Escape` key dismissal. Include standard ARIA attributes (`aria-expanded`, `aria-haspopup`, `aria-label`) to ensure clear communication to assistive technologies.

## 2026-06-09 - Modal Accessibility and Functionality Restoration
**Learning:** Modals must always have a clear, accessible way to close them (Cancel buttons, X icons with ARIA labels). High-visibility actions like "Smart Import" should be visually distinct (e.g., using gradients or emerald colors) but must maintain functional parity with standard actions.

**Action:** When implementing or restoring modals like `SmartUploadModal`, ensure they include both a primary action and a clear "Cancel" or "Close" path. Use consistent iconography (e.g., `Sparkles` for AI features) to set user expectations.
