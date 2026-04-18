## 2025-05-14 - [Optimization Pattern for Bill Creation]
**Learning:** Heavy hydration of the Project model during presence checks and sequential BOQ item updates were causing performance bottlenecks in the bill creation flow.
**Action:** Use `Project.exists()` for presence checks, atomic `Project.updateOne` for relationship linking, and `BOQItem.updateMany` with `$inc` to eliminate N+1 query bottlenecks in value distribution.
