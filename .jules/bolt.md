## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-02 - Parallelizing Side-Effects and Bulk Updates in createDPR
**Learning:** Controllers that trigger multiple automated side-effects (material deduction, BOQ updates, liability creation) can suffer from high latency due to sequential await calls. Furthermore, updating individual materials in a loop creates an N+1 query problem. Atomic operations like `bulkWrite` and `updateOne` combined with `Promise.all` significantly reduce total request time and prevent race conditions.
**Action:** Parallelize independent side-effects using `Promise.all` and consolidate multiple document updates into a single `bulkWrite` operation. Avoid hydrating root aggregate documents when only an existence check is needed.

## 2026-06-02 - Pinning pnpm for Build Stability
**Learning:** Modern `pnpm` versions (v10+) have stricter security defaults for build scripts, which can cause CI failures if not explicitly configured with `onlyBuiltDependencies`. Pinning `pnpm` to a known compatible version (like v9) in CI workflows ensures build stability across diverse environments.
**Action:** Pin `pnpm` version in GitHub Actions using `@version` and explicitly list allowed build dependencies in `package.json` under `pnpm.onlyBuiltDependencies`.
