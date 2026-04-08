## 2025-05-14 - Atomic BOQ Distribution Pattern
**Learning:** Replaced a sequential find-and-save loop with a single `updateMany` call using `$inc` for amount distribution. This pattern reduces database roundtrips from N+1 to 2 (count + update) and prevents race conditions inherent in the fetch-modify-save cycle.
**Action:** Always check for sequential save loops in controllers when distributing values across multiple documents and replace them with atomic MongoDB operators like `$inc` or `$push` within an `updateMany` call.
