## 2025-05-14 - [BOLA/IDOR Prevention Pattern]
**Vulnerability:** Sub-resource lookups (Material, BOQItem, SubContractor, Bill) were only using `_id`, allowing users in one project to access/modify resources in another project if they knew the ID.
**Learning:** Controllers often assumed that because a request passed the `projectId` validation in the middleware, subsequent lookups using IDs from the request body were safe. However, Mongoose `findById` does not inherently scope by parent reference.
**Prevention:** Always use `Model.findOne({ _id: id, project: projectId })` for sub-resources instead of `findById(id)` to enforce multi-tenancy at the query level.
