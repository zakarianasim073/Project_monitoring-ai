# Sentinel Security Journal

## 2025-05-15 - BOLA in Inventory Controller
**Vulnerability:** Broken Object Level Authorization (BOLA) in `inventoryController.ts`.
**Learning:** Resources like `Material`, `SubContractor`, and `Bill` were being fetched using `findById(id)` without verifying they belong to the `projectId` provided in the request. While the `requireProjectRole` middleware ensures the user has access to the project, it didn't prevent them from manipulating items belonging to other projects if they knew the item's ID.
**Prevention:** Always scope database lookups by both the resource ID and the parent project ID: `Model.findOne({ _id: id, project: projectId })`.
