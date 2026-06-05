## 2026-06-05 - Login Accessibility & Feedback
**Learning:** Standardizing label-input associations and providing clear visual feedback during async operations significantly improves perceived performance and accessibility for screen reader users. Redundant icon labels should be avoided by using aria-hidden on icons within buttons that have aria-labels.
**Action:** Always associate labels with inputs using htmlFor/id, add aria-hidden to decorative/redundant icons, and implement loading states with disabled buttons for all async form submissions.
