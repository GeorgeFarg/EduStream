'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Hand, RefreshCw, Send } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { socketBaseUrl } from '@/config/env'

type Role = 'student' | 'instructor'
type MessageType = 'message' | 'question' | 'system'

type Participant = {
  id: string
  name: string
  role: Role
  online: boolean
}

type MeetingMessage = {
  id: string
  senderId: string | null
  text: string
  type: MessageType
  createdAt: string
}

type MeetingChatEvent = {
  meetingId: string
  message: MeetingMessage
}

type MeetingTypingEvent = {
  meetingId: string
  userId: string
  isTyping: boolean
}

type MeetingJoinEvent = {
  meetingId: string
  participant: Participant
}

type MeetingLeaveEvent = {
  meetingId: string
  userId: string
}

type MeetingParticipantsEvent = {
  meetingId: string
  participants: Participant[]
}

type MeetingRaiseHandEvent = {
  meetingId: string
  userId: string
  userName: string
}

type WebRtcSignalEvent = {
  meetingId: string
  fromUserId: string
  toUserId?: string
}

type ServerToClientEvents = {
  'meeting:history': (payload: { meetingId: string; messages: MeetingMessage[] }) => void
  'meeting:chat': (payload: MeetingChatEvent) => void
  'meeting:typing': (payload: MeetingTypingEvent) => void
  'meeting:participants': (payload: MeetingParticipantsEvent) => void
  'meeting:user-joined': (payload: MeetingJoinEvent) => void
  'meeting:user-left': (payload: MeetingLeaveEvent) => void
  'meeting:raise-hand': (payload: MeetingRaiseHandEvent) => void
  'webrtc:offer': (payload: WebRtcSignalEvent) => void
  'webrtc:answer': (payload: WebRtcSignalEvent) => void
  'webrtc:ice-candidate': (payload: WebRtcSignalEvent) => void
  'webrtc:peer-ready': (payload: WebRtcSignalEvent) => void
}

type ClientToServerEvents = {
  'meeting:join': (payload: MeetingJoinEvent) => void
  'meeting:leave': (payload: MeetingLeaveEvent) => void
  'meeting:chat': (payload: MeetingChatEvent) => void
  'meeting:typing': (payload: MeetingTypingEvent) => void
  'meeting:raise-hand': (payload: MeetingRaiseHandEvent) => void
  'webrtc:peer-ready': (payload: WebRtcSignalEvent) => void
}

const MEETING_ID = 'networks-live-lecture-06'
const STORAGE_KEY = `edustream-live-chat-${MEETING_ID}`
const SESSION_START_ISO = '2026-03-02T19:00:00.000Z'

const PARTICIPANTS: Participant[] = [
  { id: 'inst-01', name: 'Dr. Samir', role: 'instructor', online: true },
  { id: 'std-01', name: 'Menna', role: 'student', online: true },
  { id: 'std-02', name: 'Ahmed', role: 'student', online: true },
  { id: 'std-03', name: 'Noura', role: 'student', online: true },
  { id: 'std-04', name: 'Youssef', role: 'student', online: false },
]

const CURRENT_USER_ID = 'std-01'
const DEFAULT_CURRENT_USER = PARTICIPANTS.find((participant) => participant.id === CURRENT_USER_ID)!
const DEFAULT_INSTRUCTOR = PARTICIPANTS.find((participant) => participant.role === 'instructor')!

const INITIAL_MESSAGES: MeetingMessage[] = [
  {
    id: 'm-1',
    senderId: null,
    text: 'Live class started. Recording is disabled for this session.',
    type: 'system',
    createdAt: '2026-03-02T19:00:00.000Z',
  },
  {
    id: 'm-2',
    senderId: 'inst-01',
    text: 'Welcome everyone. Today we continue TCP vs UDP and routing examples.',
    type: 'message',
    createdAt: '2026-03-02T19:01:10.000Z',
  },
  {
    id: 'm-3',
    senderId: 'std-02',
    text: 'Can you repeat when we choose UDP over TCP in real-time apps?',
    type: 'question',
    createdAt: '2026-03-02T19:02:40.000Z',
  },
]

const QUICK_QUESTIONS = [
  'Can you explain the TCP handshake again?',
  'What is the routing table role in this example?',
  'When should we prefer UDP?',
]

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')
}

function getInstructorReply(messageText: string): string {
  const normalized = messageText.toLowerCase()
  if (normalized.includes('udp')) {
    return 'Use UDP for low-latency streams where occasional packet loss is acceptable, like live audio/video.'
  }
  if (normalized.includes('handshake') || normalized.includes('tcp')) {
    return 'TCP uses SYN, SYN-ACK, and ACK before data transfer. That setup gives reliability and ordering.'
  }
  if (normalized.includes('routing') || normalized.includes('route')) {
    return 'Routers read destination IP and pick the next hop from routing tables; that is how packets move between networks.'
  }
  return 'Good question. We will cover this with another example in the next 5 minutes.'
}

export default function LiveMeetingChatPage() {
  const [messages, setMessages] = useState<MeetingMessage[]>(INITIAL_MESSAGES)
  const [participants, setParticipants] = useState<Participant[]>(PARTICIPANTS)
  const [input, setInput] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('message')
  const [instructorTyping, setInstructorTyping] = useState(false)
  const [remoteTypingUserIds, setRemoteTypingUserIds] = useState<string[]>([])
  const [socketConnected, setSocketConnected] = useState(false)
  const [lastSignalEvent, setLastSignalEvent] = useState<string>('No signaling event yet')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const replyTimeoutRef = useRef<number | null>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)

  const currentUser = useMemo(
    () => participants.find((participant) => participant.id === CURRENT_USER_ID) ?? DEFAULT_CURRENT_USER,
    [participants]
  )
  const instructor = useMemo(
    () => participants.find((participant) => participant.role === 'instructor') ?? DEFAULT_INSTRUCTOR,
    [participants]
  )
  const isRealtimeConnected = Boolean(socketBaseUrl && socketConnected)

  useEffect(() => {
    const storedMessages = localStorage.getItem(STORAGE_KEY)
    if (!storedMessages) {
      setMessages(INITIAL_MESSAGES)
      return
    }

    try {
      const parsed = JSON.parse(storedMessages) as MeetingMessage[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed)
      } else {
        setMessages(INITIAL_MESSAGES)
      }
    } catch {
      setMessages(INITIAL_MESSAGES)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, instructorTyping])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const sessionStart = new Date(SESSION_START_ISO).getTime()
      const now = Date.now()
      const nextSeconds = Math.max(0, Math.floor((now - sessionStart) / 1000))
      setElapsedSeconds(nextSeconds)
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) {
        window.clearTimeout(replyTimeoutRef.current)
      }
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!socketBaseUrl) return

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketBaseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setSocketConnected(true)
      socket.emit('meeting:join', { meetingId: MEETING_ID, participant: DEFAULT_CURRENT_USER })
      socket.emit('webrtc:peer-ready', { meetingId: MEETING_ID, fromUserId: DEFAULT_CURRENT_USER.id })
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
      setRemoteTypingUserIds([])
    })

    socket.on('meeting:history', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      if (payload.messages.length > 0) {
        setMessages(payload.messages)
      }
    })

    socket.on('meeting:participants', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setParticipants(payload.participants)
    })

    socket.on('meeting:user-joined', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setParticipants((previous) => {
        const alreadyExists = previous.some((participant) => participant.id === payload.participant.id)
        if (alreadyExists) return previous
        return [...previous, payload.participant]
      })
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          senderId: null,
          type: 'system',
          text: `${payload.participant.name} joined the meeting`,
          createdAt: new Date().toISOString(),
        },
      ])
    })

    socket.on('meeting:user-left', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setParticipants((previous) =>
        previous.map((participant) =>
          participant.id === payload.userId ? { ...participant, online: false } : participant
        )
      )
      setRemoteTypingUserIds((previous) => previous.filter((userId) => userId !== payload.userId))
    })

    socket.on('meeting:chat', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setMessages((previous) => {
        const alreadyExists = previous.some((message) => message.id === payload.message.id)
        if (alreadyExists) return previous
        return [...previous, payload.message]
      })
    })

    socket.on('meeting:typing', (payload) => {
      if (payload.meetingId !== MEETING_ID || payload.userId === CURRENT_USER_ID) return
      setRemoteTypingUserIds((previous) => {
        if (payload.isTyping) {
          if (previous.includes(payload.userId)) return previous
          return [...previous, payload.userId]
        }
        return previous.filter((userId) => userId !== payload.userId)
      })
    })

    socket.on('meeting:raise-hand', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          senderId: null,
          type: 'system',
          text: `${payload.userName} raised a hand`,
          createdAt: new Date().toISOString(),
        },
      ])
    })

    socket.on('webrtc:peer-ready', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setLastSignalEvent(`Peer ready from ${payload.fromUserId}`)
    })

    socket.on('webrtc:offer', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setLastSignalEvent(`Offer received from ${payload.fromUserId}`)
    })

    socket.on('webrtc:answer', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setLastSignalEvent(`Answer received from ${payload.fromUserId}`)
    })

    socket.on('webrtc:ice-candidate', (payload) => {
      if (payload.meetingId !== MEETING_ID) return
      setLastSignalEvent(`ICE candidate from ${payload.fromUserId}`)
    })

    return () => {
      if (socket.connected) {
        socket.emit('meeting:leave', { meetingId: MEETING_ID, userId: DEFAULT_CURRENT_USER.id })
      }
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const emitTypingState = (isTyping: boolean) => {
    if (!isRealtimeConnected || !socketRef.current) return
    socketRef.current.emit('meeting:typing', {
      meetingId: MEETING_ID,
      userId: currentUser.id,
      isTyping,
    })
  }

  const handleInputChange = (nextValue: string) => {
    setInput(nextValue)
    if (!isRealtimeConnected) return

    emitTypingState(nextValue.trim().length > 0)
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      emitTypingState(false)
    }, 1400)
  }

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const messageText = input.trim()
    if (!messageText) return

    const userMessage: MeetingMessage = {
      id: crypto.randomUUID(),
      senderId: currentUser.id,
      text: messageText,
      type: messageType,
      createdAt: new Date().toISOString(),
    }
    setMessages((previous) => [...previous, userMessage])
    setInput('')

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
    }
    emitTypingState(false)

    if (isRealtimeConnected && socketRef.current) {
      socketRef.current.emit('meeting:chat', {
        meetingId: MEETING_ID,
        message: userMessage,
      })
      return
    }

    if (replyTimeoutRef.current) {
      window.clearTimeout(replyTimeoutRef.current)
    }

    setInstructorTyping(true)
    replyTimeoutRef.current = window.setTimeout(() => {
      const instructorMessage: MeetingMessage = {
        id: crypto.randomUUID(),
        senderId: instructor.id,
        text: getInstructorReply(messageText),
        type: messageType === 'question' ? 'question' : 'message',
        createdAt: new Date().toISOString(),
      }
      setMessages((previous) => [...previous, instructorMessage])
      setInstructorTyping(false)
    }, 1100)
  }

  const resetChat = () => {
    if (replyTimeoutRef.current) {
      window.clearTimeout(replyTimeoutRef.current)
    }
    setInstructorTyping(false)
    setInput('')
    setMessageType('message')
    setMessages(INITIAL_MESSAGES)
    setParticipants(PARTICIPANTS)
    setRemoteTypingUserIds([])
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES))
  }

  const raiseHand = () => {
    if (isRealtimeConnected && socketRef.current) {
      socketRef.current.emit('meeting:raise-hand', {
        meetingId: MEETING_ID,
        userId: currentUser.id,
        userName: currentUser.name,
      })
      return
    }

    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        senderId: null,
        type: 'system',
        text: `${currentUser.name} raised a hand`,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  const onlineCount = participants.filter((participant) => participant.online).length
  const questionCount = messages.filter((message) => message.type === 'question').length
  const activeTypingNames = participants
    .filter((participant) => remoteTypingUserIds.includes(participant.id))
    .map((participant) => participant.name)

  return (
    <main className="min-h-screen gradient-bg px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="NavBG flex flex-col gap-3 rounded-2xl border border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-white/70">Computer Networks - Live Class</p>
            <h1 className="text-2xl font-bold">Student-Instructor Chat</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-red-500/20 px-3 py-1 font-semibold text-red-300">
              Live
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              Session {formatElapsed(elapsedSeconds)}
            </span>
            <span
              className={`rounded-full px-3 py-1 ${
                isRealtimeConnected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'
              }`}
            >
              {isRealtimeConnected ? 'Socket connected' : socketBaseUrl ? 'Socket reconnecting' : 'Local mode'}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">{onlineCount} online</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{questionCount} questions</span>
            <Link
              href="/"
              className="rounded-lg border border-white/20 px-3 py-1 font-medium hover:bg-white/10"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={resetChat}
              className="inline-flex items-center gap-2 rounded-lg bg-main px-3 py-1 font-semibold hover:bg-main/90"
            >
              <RefreshCw size={14} />
              Reset
            </button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[280px_1fr_260px]">
          <aside className="NavBG rounded-2xl border border-white/10 p-4">
            <h2 className="text-lg font-semibold">Participants</h2>
            <p className="mt-1 text-sm text-white/70">Current identity: {currentUser.name}</p>
            <p className="mt-1 text-xs text-white/60">Last signal: {lastSignalEvent}</p>
            <div className="mt-4 space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{participant.name}</p>
                    <p className="text-xs text-white/60">{participant.role}</p>
                  </div>
                  <Circle
                    size={12}
                    className={participant.online ? 'fill-emerald-400 text-emerald-400' : 'fill-zinc-500 text-zinc-500'}
                  />
                </div>
              ))}
            </div>
          </aside>

          <div className="NavBG flex h-[72vh] min-h-[520px] flex-col rounded-2xl border border-white/10">
            <div className="hide-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message) => {
                if (message.type === 'system') {
                  return (
                    <div key={message.id} className="mx-auto w-fit rounded-full bg-white/10 px-3 py-1 text-xs">
                      {message.text}
                    </div>
                  )
                }

                const sender = PARTICIPANTS.find((participant) => participant.id === message.senderId)
                const isMine = message.senderId === currentUser.id
                return (
                  <article
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      isMine ? 'ml-auto bg-main/80' : 'mr-auto bg-white/10'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs text-white/75">
                      <span className="rounded-full bg-black/20 px-2 py-0.5">{sender?.name ?? 'Unknown'}</span>
                      <span className="uppercase tracking-wide">{sender?.role ?? 'member'}</span>
                      <span>{formatTime(message.createdAt)}</span>
                      {message.type === 'question' ? (
                        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-amber-200">Question</span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-6">{message.text}</p>
                  </article>
                )
              })}

              {instructorTyping ? (
                <div className="mr-auto max-w-[85%] rounded-2xl bg-white/10 p-3 text-sm text-white/80">
                  {instructor.name} is typing...
                </div>
              ) : null}
              {activeTypingNames.length > 0 ? (
                <div className="mr-auto max-w-[85%] rounded-2xl bg-white/10 p-3 text-sm text-white/80">
                  {activeTypingNames.join(', ')} typing...
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
              <div className="mb-2 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMessageType('message')}
                  className={`rounded-full px-3 py-1 ${
                    messageType === 'message' ? 'bg-main font-semibold' : 'bg-white/10'
                  }`}
                >
                  Message
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('question')}
                  className={`rounded-full px-3 py-1 ${
                    messageType === 'question' ? 'bg-main font-semibold' : 'bg-white/10'
                  }`}
                >
                  Question
                </button>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(event) => handleInputChange(event.target.value)}
                  placeholder={
                    messageType === 'question'
                      ? 'Ask a question to the instructor...'
                      : 'Send a class message...'
                  }
                  className="max-h-40 min-h-[56px] flex-1 resize-y rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-main"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="inline-flex h-14 items-center justify-center rounded-xl bg-main px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>

          <aside className="NavBG rounded-2xl border border-white/10 p-4">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <button
              type="button"
              onClick={raiseHand}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10"
            >
              <Hand size={16} />
              Raise Hand
            </button>
            <p className="mt-4 text-sm text-white/70">Suggested questions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setMessageType('question')
                    setInput(prompt)
                  }}
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
              {socketBaseUrl
                ? 'Socket events are wired for chat, participants, raise hand, and WebRTC signaling.'
                : 'Set NEXT_PUBLIC_SOCKET_URL to enable Socket.IO + WebRTC signaling event wiring.'}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
