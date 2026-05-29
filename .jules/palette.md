## 2025-05-22 - Login Form Accessibility and Usability
**Learning:** Core authentication components like `Login.tsx` are prone to regressions where standard accessibility attributes (`id`, `htmlFor`) and interactive helpers (password toggles, autofill buttons) are removed. These elements significantly improve the UX for both assistive technology and general developers/testers.
**Action:** Always verify that form inputs have explicitly associated labels and implement interactive demo helpers to facilitate rapid testing and onboarding.
