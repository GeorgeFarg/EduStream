# TODO: Meeting WebRTC + Avatar Grid Implementation

## Goal
Make camera/screen share visible to all participants and show avatars when camera is off (like Zoom).

## Steps

### 1. Update Socket Server (`apps/api/src/socket/meeting.socket.ts`)
- [ ] Track userId → socketId mappings
- [ ] Add `meeting-joined` event
- [ ] Add WebRTC signaling: `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`

### 2. Update Socket Hook (`apps/web/hooks/useMeetingSocket.ts`)
- [ ] Add RTCPeerConnection management
- [ ] Add `remoteStreams` state
- [ ] Add `initLocalStream()` and `replaceVideoTrack()` helpers
- [ ] Handle WebRTC socket events

### 3. Update Meeting UI (`apps/web/components/class/ClassMeeting.tsx`)
- [ ] Integrate WebRTC init/replace calls
- [ ] Replace single video with responsive participant grid
- [ ] Show video when camera/screen on, avatar when off
- [ ] Add status overlays for each participant

### 4. Test & Verify
- [ ] Multi-user camera sharing
- [ ] Screen share visibility
- [ ] Avatar display when camera off
- [ ] Leave meeting cleanup

