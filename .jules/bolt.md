## 2025-01-24 - N+1 loop and heavy hydration in Project aggregate
**Learning:** The Project model acts as a root aggregate with large sub-document arrays (bills, dprs, documents). Sequential saves in loops and using findById for existence checks cause significant latency due to hydration and multiple roundtrips.
**Action:** Use Model.exists() for O(1) existence checks and updateMany with $inc or $push for atomic updates to avoid hydrating large documents and eliminate N+1 query patterns.
