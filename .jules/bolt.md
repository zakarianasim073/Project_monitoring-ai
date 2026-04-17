
## 2026-05-22 - DPR Creation Bottlenecks
**Learning:** Sequential database operations and heavy document hydration in `createDPR` (Project model as root aggregate) caused significant request latency. Using `Project.exists()` and atomic `updateOne` updates avoids loading large sub-document arrays (bills, dprs, documents) into memory.
**Action:** Always prefer `exists()` for presence checks and atomic `updateOne`/`bulkWrite` for updates to large aggregate models to minimize database roundtrips and memory overhead.

## 2026-05-22 - DPR Creation Bottlenecks
**Learning:** Sequential database operations and heavy document hydration in `createDPR` (Project model as root aggregate) caused significant request latency. Using `Project.exists()` and atomic `updateOne` updates avoids loading large sub-document arrays (bills, dprs, documents) into memory.
**Action:** Always prefer `exists()` for presence checks and atomic `updateOne`/`bulkWrite` for updates to large aggregate models to minimize database roundtrips and memory overhead.

## 2026-05-22 - DPR Creation Bottlenecks
**Learning:** Sequential database operations and heavy document hydration in `createDPR` (Project model as root aggregate) caused significant request latency. Using `Project.exists()` and atomic `updateOne` updates avoids loading large sub-document arrays (bills, dprs, documents) into memory.
**Action:** Always prefer `exists()` for presence checks and atomic `updateOne`/`bulkWrite` for updates to large aggregate models to minimize database roundtrips and memory overhead.
