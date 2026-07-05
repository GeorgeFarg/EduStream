# TODO


## Frontend: Dashboard class management
- [ ] Add Edit/Delete UI inside each `ClassroomCard` dropdown.
- [ ] Create `EditClassModal` component (name + description) and wire it.
- [ ] Add delete confirmation (dialog/modal) and wire it.
- [ ] Call backend endpoints and refresh classrooms list on success.

## Backend: API endpoints
- [ ] Add controller `updateClass` (name + description) with owner-only authorization.
- [ ] Add controller `deleteClass` with owner-only authorization.
- [ ] Add routes: `PATCH /api/classes/:id` and `DELETE /api/classes/:id`.


## Verify
- [ ] Run frontend/backend tests/build and manual smoke test: edit & delete.


