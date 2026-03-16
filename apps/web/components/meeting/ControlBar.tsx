"use client";

interface ControlBarProps {
  isMuted: boolean;
  isCamOff: boolean;
  isSharingScreen: boolean;
  unreadCount: number;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleShare: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
}

interface CtrlBtnProps {
  onClick: () => void;
  isOff?: boolean;
  isOn?: boolean;
  isDanger?: boolean;
  label: string;
  children: React.ReactNode;
  badge?: number;
}

function CtrlBtn({ onClick, isOff, isOn, isDanger, label, children, badge }: CtrlBtnProps) {
  let bg = "bg-[#161d2a] text-[#f0f4ff]";
  if (isOff) bg = "bg-red-500/18 text-red-400";
  if (isOn) bg = "bg-blue-500/20 text-blue-400";
  if (isDanger) bg = "bg-red-500 text-white";

  const size = isDanger ? "w-14 h-14" : "w-[52px] h-[52px]";

  return (
    <button
      onClick={onClick}
      className={`${size} rounded-full border-none flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-transform active:scale-[0.88] relative shrink-0 ${bg}`}>
      {children}
      <span className="text-[9px] font-semibold tracking-wide uppercase leading-none hidden sm:block">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export default function ControlBar({
  isMuted, isCamOff, isSharingScreen, unreadCount,
  onToggleMic, onToggleCam, onToggleShare, onToggleChat, onLeave
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-[rgba(8,11,16,0.95)] backdrop-blur-md border-t border-white/[0.07] shrink-0 flex-wrap" style={{ paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))" }}>

      {/* Mic */}
      <CtrlBtn onClick={onToggleMic} isOff={isMuted} label={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
            <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" />
          </svg>
        )}
      </CtrlBtn>

      {/* Camera */}
      <CtrlBtn onClick={onToggleCam} isOff={isCamOff} label={isCamOff ? "Start Cam" : "Video"}>
        {isCamOff ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h3a2 2 0 012 2v9.34m-7.72-2.06A4 4 0 018.72 8.72" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        )}
      </CtrlBtn>

      {/* Screen Share */}
      <CtrlBtn onClick={onToggleShare} isOn={isSharingScreen} label={isSharingScreen ? "Stop" : "Share"}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </CtrlBtn>

      {/* Chat */}
      <CtrlBtn onClick={onToggleChat} label="Chat" badge={unreadCount}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </CtrlBtn>

      {/* End */}
      <CtrlBtn onClick={onLeave} isDanger label="End">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[26px] h-[26px]">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" transform="rotate(135 12 12)" />
        </svg>
      </CtrlBtn>
    </div>
  );
}