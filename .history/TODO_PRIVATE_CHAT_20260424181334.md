# Private Chat Feature Implementation (User-to-User)

## Plan

### 1. Prisma Schema
Add `PrivateMessage` model:
- `id`, `content`, `senderId`, `receiverId`, `createdAt`, `updatedAt`, `readAt`
- Relations: `sender` → `User`, `receiver` → `User`
- Add inverse relations on `User` model

### 2. Backend — Private Chat Module
- `apps/api/src/validators/privateChat.validator.ts` — Zod schema for sending messages
- `apps/api/src/services/privateChat.service.ts` — `getConversations`, `getMessages`, `sendMessage`
- `apps/api/src/controllers/privateChat.controller.ts` — `getConversationsController`, `getMessagesController`, `sendMessageController`
- `apps/api/src/routes/privateChat.routes.ts` — `/api/private-chat` routes
- Update `apps/api/src/app.ts` — Mount private chat routes

### 3. Frontend — Private Chat UI
- `apps/web/app/private-chat/page.tsx` — Main private chat page
- `apps/web/components/chat/PrivateChat.tsx` — Full chat component with user list + message view
- Update `apps/web/components/ClasssideBar.tsx` — Add link to private chat page

### 4. Dependencies
- Socket.io already installed
- Run `prisma generate` after schema change

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/private-chat/conversations` | Get all conversations for current user |
| GET | `/api/private-chat/messages/:userId` | Get messages between current user and another user |
| POST | `/api/private-chat/messages/:userId` | Send a message to another user |

## Files to Create
1. `apps/api/src/validators/privateChat.validator.ts`
2. `apps/api/src/services/privateChat.service.ts`
3. `apps/api/src/controllers/privateChat.controller.ts`
4. `apps/api/src/routes/privateChat.routes.ts`
5. `apps/web/app/private-chat/page.tsx`
6. `apps/web/components/chat/PrivateChat.tsx`

## Files to Edit
1. `apps/api/prisma/schema.prisma` — Add `PrivateMessage` model
2. `apps/api/src/app.ts` — Mount private chat routes
3. `apps/web/components/ClasssideBar.tsx` — Add chat nav link
