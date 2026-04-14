## 2025-05-15 - Optimizing Heavy Document Validation and Batch Writes
**Learning:** In this architecture, the `Project` model acts as a root aggregate with many sub-document arrays (bills, dprs, liabilities, etc.). Using `findById()` for existence checks causes unnecessary hydration of these large arrays. Additionally, sequential loops for BOQ distribution create significant N+1 write overhead.
**Action:** Always prefer `Model.exists()` for lightweight validation and `updateMany` with `$inc` for distribution logic to keep database operations O(1) regardless of the number of items.
