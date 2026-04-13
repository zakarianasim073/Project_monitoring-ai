# Bolt Performance Journal

## 2025-04-06 - Initial Profile
**Learning:** Found N+1 query patterns in `billController.ts` and `dprController.ts` where multiple documents are updated in a loop using `.save()`. Also identified dynamic `import()` calls in `inventoryController.ts` which add overhead to request handling.
**Action:** Use `updateMany` or `bulkWrite` for batch updates. Use static imports for models to reduce runtime overhead. Parallelize independent database operations using `Promise.all`.
