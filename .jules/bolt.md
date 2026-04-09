## 2025-05-15 - Atomic Clamping with Aggregation Pipelines
**Learning:** Using an aggregation pipeline within a Mongoose `updateOne` call allows for complex atomic operations like stock clamping (`$max: [0, ...]`) without needing to fetch-modify-save. This prevents race conditions and reduces database roundtrips.
**Action:** Use `Model.updateOne({ _id }, [ { $set: { field: { $max: [0, { $subtract: ["$field", decrement] }] } } } ])` for atomic stock management.
