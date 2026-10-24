## 2024-06-19 - Accessible Dropdown Pattern
**Learning:** Hover-based dropdowns (`group-hover:block`) are inaccessible for keyboard-only and touch-device users. State-controlled click-based dropdowns with `useRef` for outside-click detection and `Escape` key handling provide a much more robust and accessible experience.
**Action:** Use the `useState`, `useRef`, and `useEffect` pattern for all future dropdowns or popovers to ensure accessibility and consistent behavior across devices.
