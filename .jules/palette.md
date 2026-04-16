## 2026-05-22 - Login Experience Improvements
**Learning:** Linking labels to inputs with id/htmlFor and adding quick-fill demo buttons significantly improves accessibility and developer/demo experience. A password visibility toggle is a standard micro-UX expected by users for modern forms.
**Action:** Always ensure form fields are properly labeled and consider the "Quick Login" pattern for demo accounts to streamline first-time user interaction.

## 2026-05-22 - CI Infrastructure Fix
**Learning:** The CI build workflow in .github/workflows/webpack.yml must explicitly cd backend, npm install, and npm run build to prevent ENOENT failures caused by the absence of a root-level package.json. The generic npx webpack command is incorrect for this project.
**Action:** Always verify that CI workflows correctly navigate to project subdirectories and use the correct package manager and build commands.
