# TODO - People page: add users to class from Prisma

- [x] Backend: implement `GET /api/classes/:id/users/search?q=` to search Prisma users by name/email (excluding current class members)


- [x] Backend: implement `POST /api/classes/:id/users/add` to add a user as STUDENT to the class via `ClassMembership`





- [x] Backend: update `EduStream/apps/api/src/routes/class.routes.ts` to expose new endpoints (teacher-only via existing middleware)

- [x] Frontend: update `EduStream/apps/web/app/(dashboard)/people/page.tsx`
  - [ ] show real member name/email from Prisma (instead of placeholders)
  - [x] add teacher-only UI: search users + add button
  - [x] refresh members after add

- [ ] Testing: verify permissions (non-teacher cannot add)
- [ ] Testing: verify duplicates are handled (unique constraint)

