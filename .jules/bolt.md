## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-02 - Atomic Multi-Material Updates with Stock Capping
**Learning:** Updating multiple material stock levels sequentially in a loop creates an N+1 bottleneck. Using `bulkWrite` with an aggregation pipeline allows for atomic updates and complex logic (like `Math.max(0, currentStock - usage)`) to be executed entirely within the database in a single roundtrip.
**Action:** Use `Model.bulkWrite` with update pipelines for batching conditional updates that would otherwise require multiple fetch-and-save cycles.

## 2026-06-03 - CI Build Failures with pnpm v10 and esbuild
**Learning:** Node.js 22+ environments with `pnpm@10` ignore build scripts (like `esbuild`) by default, leading to build failures unless `pnpm.onlyBuiltDependencies` is configured. Pinning `pnpm@9` and explicitly allowing `esbuild` ensures reliable CI builds.
**Action:** Pin `pnpm@9` in GitHub Actions and add `esbuild` to `onlyBuiltDependencies` in `package.json` for Vite-based projects.
