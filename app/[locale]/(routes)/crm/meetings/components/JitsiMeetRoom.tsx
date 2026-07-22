"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { getJitsiDomain, getJitsiMeetUrl } from "@/lib/jitsi";

interface JitsiMeetRoomProps {
  roomId: string;
  displayName: string;
  userEmail?: string;
  onLeave?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

/**
 * JitsiMeetRoom — Embedded Jitsi video call component.
 *
 * Tries loading via Jitsi External API CDN. If CDN script loading is blocked or fails,
 * seamlessly falls back to direct responsive <iframe> embedding with full audio/video permissions.
 */
export function JitsiMeetRoom({ roomId, displayName, userEmail, onLeave }: JitsiMeetRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  const domain = getJitsiDomain();
  const jitsiUrl = getJitsiMeetUrl(roomId);
  const iframeSrc = `https://${domain}/${roomId}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    if (window.JitsiMeetExternalAPI) {
      initJitsiApi();
    } else {
      script = document.createElement("script");
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => initJitsiApi();
      script.onerror = () => {
        console.warn("[JitsiMeetRoom] CDN script failed to load. Falling back to direct iframe.");
        setUseIframeFallback(true);
      };
      document.body.appendChild(script);
    }

    function initJitsiApi() {
      if (!containerRef.current || apiRef.current) return;
      try {
        apiRef.current = new window.JitsiMeetExternalAPI(domain, {
          roomName: roomId,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            DEFAULT_LOCAL_DISPLAY_NAME: displayName,
          },
          userInfo: {
            displayName,
            email: userEmail || "",
          },
        });

        apiRef.current.addEventListener("readyToClose", () => {
          if (onLeave) onLeave();
        });

        apiRef.current.addEventListener("videoConferenceLeft", () => {
          if (onLeave) onLeave();
        });
      } catch (err) {
        console.warn("[JitsiMeetRoom] External API init error. Falling back to direct iframe:", err);
        setUseIframeFallback(true);
      }
    }

    return () => {
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch { /* ignore */ }
        apiRef.current = null;
      }
    };
  }, [domain, roomId, displayName, userEmail, onLeave]);

  const handleLeave = () => {
    if (apiRef.current) {
      try { apiRef.current.executeCommand("hangup"); } catch { /* ignore */ }
    }
    if (onLeave) onLeave();
  };

  return (
    <div
      className={`relative bg-black flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50" : "rounded-xl overflow-hidden"
      }`}
      style={{ height: isFullscreen ? "100dvh" : "620px" }}
    >
      {/* Control Header */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <a href={jitsiUrl} target="_blank" rel="noopener noreferrer">
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
          className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs"
          onClick={handleLeave}
        >
          <PhoneOff className="h-3.5 w-3.5" /> Leave Call
        </Button>
      </div>

      {/* Video Container */}
      {useIframeFallback ? (
        <iframe
          src={iframeSrc}
          allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; fullscreen"
          className="w-full h-full border-0"
          title="Jitsi Video Meeting"
        />
      ) : (
        <div ref={containerRef} className="flex-1 w-full h-full" />
      )}
    </div>
  );
}
