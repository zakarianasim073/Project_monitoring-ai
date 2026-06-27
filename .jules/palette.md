# Palette's Journal - UX & Accessibility

## 2026-06-25 - Smart Modal UX and Accessibility
**Learning:** Modals that lack Escape key support, backdrop click-to-close, and clear close buttons create high friction and accessibility barriers (WCAG 2.1 Success Criterion 2.1.2). Users expect standard interaction patterns, and their absence makes the UI feel broken or trapped. Providing immediate visual success feedback (e.g., a checkmark state) after async operations like "Smart Import" significantly reduces user anxiety.

**Action:** Always implement the "Standard Modal Trio" (Escape key, backdrop click, Close button) for any new modal. Ensure `role="dialog"` and `aria-modal="true"` are present for screen reader context.
