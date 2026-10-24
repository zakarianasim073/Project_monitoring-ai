## 2025-03-24 - Accessibility for Toggle Buttons
**Learning:** When using icon-only buttons for toggling state (like password visibility), it is crucial to provide dynamic `aria-label` values and ensure `focus-visible` styles are maintained even if `focus:outline-none` is used for aesthetic reasons.
**Action:** Always include `focus-visible:ring` or equivalent when removing default focus outlines on interactive elements.

## 2025-03-24 - Playwright Locator Persistence
**Learning:** Locators based on `aria-label` or role names (like `get_by_role("button", name="Show password")`) will break if the label/name changes after an interaction.
**Action:** Re-locate elements in Playwright scripts after actions that change their accessible name, or use more stable selectors if available.
