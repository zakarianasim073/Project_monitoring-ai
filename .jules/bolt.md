## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2024-06-21 - TypeScript Compiler Execution
**Learning:** Running `npx tsc` in the backend before `npm install` results in `npx` trying to install a deprecated `tsc` package instead of using the `typescript` package's binary.
**Action:** Always ensure `npm install` is run before attempting to use `npx tsc` or `npm run build` to ensure the correct compiler version is used.
