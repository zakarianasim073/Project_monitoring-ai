## 2026-05-13 - [Modal Accessibility and Build Stability]
**Learning:** Found a 'modal trap' pattern in `SmartUploadModal.tsx` where the user couldn't exit without a successful upload, and critical syntax errors in `DocumentManager.tsx` that broke the build.
**Action:** Always include a close button (X), cancel button, backdrop click dismissal, and Escape key listeners in modals. Ensure all JSX snippets are properly contained within component definitions to maintain build integrity. Avoid `window.location.reload()` in SPAs; prefer state-based updates.
