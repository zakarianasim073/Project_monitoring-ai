## 2026-05-20 - Login Page Micro-UX & Accessibility
**Learning:** Initial audit revealed standard input patterns lacked basic accessibility (missing label associations) and common micro-interactions (password visibility toggle). Demo users also faced friction manually typing credentials.
**Action:** Always link labels to inputs via `htmlFor`/`id`. Include password visibility toggles with `aria-label` and `focus-visible` rings. Add 'Quick Login' buttons for demo/dev environments to streamline onboarding.
