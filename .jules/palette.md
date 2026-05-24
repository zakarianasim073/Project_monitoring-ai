## 2025-03-24 - Accessible Role Switcher
**Learning:** CSS hover-based menus (group-hover:block) are inaccessible to keyboard and mobile users. They also lack state cues for assistive technologies.
**Action:** Replace hover-based visibility with state-controlled toggles using ARIA attributes (aria-expanded, aria-haspopup) and keyboard support (Escape key).

## 2025-03-24 - Document Manager Integrity
**Learning:** Fragmented or malformed component files can persist in the codebase and block builds. Consolidating logic and providing clear empty states improves developer experience and user clarity.
**Action:** Ensure components are fully formed and include semantic empty states when data is missing.
