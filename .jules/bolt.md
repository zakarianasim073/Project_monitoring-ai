
## 2026-04-02 - Optimized bill distribution with bulk updates
**Learning:** Sequential `save()` calls in a loop create an N+1 database update problem, which is highly inefficient for large datasets due to multiple round-trips and document hydration overhead. Using `updateMany` with the `$inc` operator allows for atomic, bulk updates in a single operation.
**Action:** Always look for patterns where multiple documents are updated based on a shared criterion and refactor them to use bulk write operations like `updateMany` or `bulkWrite`.
