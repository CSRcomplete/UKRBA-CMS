"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Maximize2, Minimize2, ExternalLink, Video } from "lucide-react";
import { getJitsiDomain, getJitsiMeetUrl } from "@/lib/jitsi";

interface JitsiMeetRoomProps {
  roomId: string;
  displayName: string;
  userEmail?: string;
  onLeave?: () => void;
}

/**
 * JitsiMeetRoom — Clean, single-session embedded Jitsi video call component.
 *
 * Uses direct iframe embedding with URL parameters to prevent duplicate WebRTC connections
 * and prevent multiple participant instances from joining the room.
 */
export function JitsiMeetRoom({ roomId, displayName, userEmail, onLeave }: JitsiMeetRoomProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWindowOpened, setIsWindowOpened] = useState(false);

  const domain = getJitsiDomain();
  const jitsiUrl = getJitsiMeetUrl(roomId);

  // Clean URL parameters for single participant session
  const iframeSrc = `https://${domain}/${roomId}#userInfo.displayName="${encodeURIComponent(
    displayName
  )}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;

  const openPopupWindow = () => {
    setIsWindowOpened(true);
    const width = 1280;
    const height = 720;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      jitsiUrl,
      `JitsiMeeting_${roomId}`,
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  const handleLeave = () => {
    if (onLeave) onLeave();
  };

  return (
    <div
      className={`relative bg-slate-950 flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50" : "rounded-xl overflow-hidden shadow-2xl border border-slate-800"
      }`}
      style={{ height: isFullscreen ? "100dvh" : "640px" }}
    >
      {/* Top Controls Bar */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <Button
          size="sm"
          onClick={openPopupWindow}
          className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow"
        >
          <Video className="h-3.5 w-3.5" />
          Launch Window
        </Button>

        <a href={jitsiUrl} target="_blank" rel="noopener noreferrer" onClick={() => setIsWindowOpened(true)}>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 bg-black/60 hover:bg-black/80 text-white border-white/20 text-xs backdrop-blur"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            New Tab
          </Button>
        </a>

        <Button
          size="sm"
          variant="secondary"
          className="h-8 gap-1.5 bg-black/60 hover:bg-black/80 text-white border-white/20 text-xs backdrop-blur"
          onClick={() => setIsFullscreen((v) => !v)}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </Button>

        <Button
          size="sm"
          className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
          onClick={handleLeave}
        >
          <PhoneOff className="h-3.5 w-3.5" /> Leave Call
        </Button>
      </div>

      {/* Video Frame */}
      {isWindowOpened ? (
        <div className="flex flex-col items-center justify-center h-full text-white space-y-4 p-8 text-center bg-slate-900">
          <Video className="h-12 w-12 text-blue-500 animate-pulse" />
          <div>
            <h3 className="text-lg font-bold">Meeting Open in External Window</h3>
            <p className="text-xs text-slate-400 mt-1">
              Embedded frame paused to avoid duplicate connections.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs text-black bg-white" onClick={() => setIsWindowOpened(false)}>
              Resume Embedded Frame
            </Button>
            <Button size="sm" variant="destructive" className="text-xs" onClick={handleLeave}>
              End &amp; Leave Call
            </Button>
          </div>
        </div>
      ) : (
        <iframe
          key={roomId}
          src={iframeSrc}
          allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; fullscreen"
          className="w-full h-full border-0"
          title="Jitsi Video Meeting"
        />
      )}
    </div>
  );
}
