## 2024-04-18 - [Login Page Enhancements]
**Learning:** Combining accessibility (label linking), security/usability (password toggle), and developer/demo convenience (Quick Login buttons) in a single component like `Login.tsx` provides a high-impact UX improvement with minimal code changes.
**Action:** Always check for missing `htmlFor`/`id` pairs in forms and consider adding password visibility toggles to sensitive fields.

## 2024-04-18 - [Surgical UX Changes]
**Learning:** Reviewers are extremely sensitive to "noise" in PRs. Including lockfiles, temporary logs, or new configuration files (even if they seem necessary for local verification) is considered out-of-scope for micro-UX tasks.
**Action:** Ensure all temporary files, logs, and unintended configuration changes are removed before requesting a review. Stick strictly to the UI component logic.
