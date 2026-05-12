## 2026-08-01 - [Modal Trap Mitigation]
**Learning:** The `SmartUploadModal` was a UX 'trap' because it lacked a close button or backdrop click handler, forcing users to refresh or complete an upload to exit. Adding these basic controls is essential for user agency.
**Action:** Always include a clear exit path (close button, Esc key support, or backdrop click) for modal components.

## 2026-08-01 - [Broken Component Recovery]
**Learning:** `DocumentManager.tsx` contained floating JSX that broke the component. This often happens when developers copy-paste code without proper scoping.
**Action:** Always verify component structure and run a build/type-check after modifications to ensure the file is still a valid React component.
