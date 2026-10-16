# Palette's Journal - Critical UX/Accessibility Learnings

## 2026-06-25 - Smart Upload Modal UX Enhancements
**Learning:** Initial state management in modals is crucial for a consistent experience. When a modal is re-opened, users expect a clean slate. Accessibility features like focus trapping (though not fully implemented here yet) and the "Standard Modal Trio" (Escape, Backdrop click, Close button) are essential for a professional feel.
**Action:** Use `useEffect` to reset internal states when `isOpen` transitions to true. Always implement the Standard Modal Trio for all new modal components.
