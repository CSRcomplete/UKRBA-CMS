"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Maximize2, Minimize2, ExternalLink } from "lucide-react";

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
 * Uses the Jitsi External API (loaded via CDN script tag) to embed
 * a Jitsi Meet call in a div inside the CRM. Falls back to opening
 * meet.jit.si in a new tab if the API fails to load.
 */
export function JitsiMeetRoom({ roomId, displayName, userEmail, onLeave }: JitsiMeetRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const jitsiUrl = `https://meet.jit.si/${roomId}`;

  useEffect(() => {
    // Load Jitsi External API script from CDN
    if (window.JitsiMeetExternalAPI) {
      setApiLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => setApiLoaded(true);
    script.onerror = () => setLoadError(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!apiLoaded || !containerRef.current || apiRef.current) return;

    try {
      apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: roomId,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          toolbarButtons: [
            "microphone",
            "camera",
            "chat",
            "desktop",
            "fullscreen",
            "hangup",
            "participants-pane",
            "settings",
            "tileview",
            "toggle-camera",
            "videoquality",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: "",
          SHOW_POWERED_BY: false,
          APP_NAME: "UKRBA Video Meetings",
          NATIVE_APP_NAME: "UKRBA Video Meetings",
          DEFAULT_BACKGROUND: "#1a1a2e",
          DEFAULT_LOCAL_DISPLAY_NAME: displayName,
          TOOLBAR_ALWAYS_VISIBLE: false,
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
      console.error("[JitsiMeetRoom] Failed to initialize:", err);
      setLoadError(true);
    }

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch { /* ignore */ }
        apiRef.current = null;
      }
    };
  }, [apiLoaded, roomId, displayName, userEmail, onLeave]);

  const handleLeave = () => {
    if (apiRef.current) {
      try { apiRef.current.executeCommand("hangup"); } catch { /* ignore */ }
    }
    if (onLeave) onLeave();
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <p className="text-muted-foreground text-sm">
          Could not load the embedded video call. Please join via browser tab instead.
        </p>
        <div className="flex gap-2">
          <a href={jitsiUrl} target="_blank" rel="noopener noreferrer">
            <Button className="gap-1.5">
              <ExternalLink className="h-4 w-4" /> Open in New Tab
            </Button>
          </a>
          {onLeave && (
            <Button variant="outline" onClick={onLeave}>Back to Meetings</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : "rounded-xl overflow-hidden"}`} style={{ height: isFullscreen ? "100dvh" : "600px" }}>
      {/* Control Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
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
          <PhoneOff className="h-3.5 w-3.5" /> Leave
        </Button>
      </div>

      {/* Jitsi container */}
      {!apiLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-gray-900">
          <span className="animate-pulse">Connecting to video room...</span>
        </div>
      )}
      <div ref={containerRef} className="flex-1 w-full h-full" />
    </div>
  );
}
