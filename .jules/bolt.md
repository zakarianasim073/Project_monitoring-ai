## 2026-04-12 - Root Aggregate Hydration Bottleneck
**Learning:** The `Project` model in this codebase serves as a massive root aggregate for bills, DPRs, materials, and more. Using `findById()` for existence checks triggers expensive hydration of all these sub-document arrays.
**Action:** Always use `Model.exists({ _id: id })` for simple presence validation on the `Project` model to skip hydration and reduce memory/CPU overhead.

## 2026-04-12 - N+1 Write Pattern in Controllers
**Learning:** Found a pattern in `billController.ts` where multiple documents were updated via a loop of sequential `await item.save()` calls. This is a significant performance bottleneck for large datasets.
**Action:** Replace sequential `.save()` loops with atomic bulk operations like `updateMany` or `bulkWrite`. Use `countDocuments` beforehand if a distribution factor (like `amount / count`) is required for the update.
