## 2025-05-14 - Redundant Database Round-trips in DPR Creation
**Learning:** The `createDPR` controller in `backend/src/controllers/dprController.ts` performs multiple sequential `save()` calls on various models (DPR, BOQItem, Material, Liability, Project) within a single request. Specifically, updating material stock in a loop using `findById` and `save()` is highly inefficient as it scales linearly with the number of materials used.
**Action:** Use batch operations like `bulkWrite` for multiple document updates, and atomic operators like `$inc` with `updateOne` to reduce the number of database round-trips and avoid document hydration overhead when not necessary.

## 2025-05-14 - MongoDB URI Password Encoding Resilience
**Learning:** passwords containing special characters (e.g., '@', '<', '>') in `MONGO_URI` can cause connection failures or SRV lookup errors (EBADNAME) if not correctly URL-encoded. Mongoose/MongoDB connection strings require the userinfo (username/password) portion to be URL-encoded before being parsed into hostnames and options.
**Action:** In `backend/src/config/db.ts`, implement logic to identify the last '@' as the host separator, then URL-encode the password segment to ensure robust connectivity and prevent SRV hostname mangling.
