# WebSocket Implementation TODO

## Backend Tasks
- [x] 1. Initialize Socket.IO server in `apps/api/src/index.ts` with auth middleware
- [x] 2. Create `apps/api/src/socket/meeting.socket.ts` with all meeting event handlers
- [x] 3. Update `apps/api/src/controllers/meeting.controller.ts` to emit socket events

## Frontend Tasks
- [x] 4. Create `apps/web/hooks/useMeetingSocket.ts` hook
- [x] 5. Update `apps/web/components/class/ClassMeeting.tsx` to use socket hook
- [x] 6. Update `apps/web/app/class/[id]/ClassPageClient.tsx` for real-time active meeting badge

## Testing
- [ ] 7. Verify two tabs see mic/camera changes in real-time
- [ ] 8. Verify participant list updates in real-time on join/leave

