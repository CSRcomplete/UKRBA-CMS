"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const CURRENT_BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
const POLL_MS = 60_000;
const RELOAD_DELAY_MS = 4_000;
const RELOAD_GUARD_KEY = "crm-version-reload-at";
const RELOAD_GUARD_MS = 30_000;

/**
 * Forces every open session to refresh after a new release is deployed.
 * Compares the build ID baked into this page with the one the server reports,
 * checking every minute and whenever the tab becomes visible again.
 */
export function VersionChecker() {
  useEffect(() => {
    // Local dev has no real build ID.
    if (CURRENT_BUILD === "dev") return;

    let reloading = false;

    const check = async () => {
      if (reloading) return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = await res.json();
        if (!buildId || buildId === CURRENT_BUILD) return;

        // Loop guard: never reload more than once per 30s if something is off.
        try {
          const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
          if (Date.now() - last < RELOAD_GUARD_MS) return;
          sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
        } catch {
          // sessionStorage unavailable — proceed anyway
        }

        reloading = true;
        toast.info("A new version of the CRM is available. Refreshing…");
        setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);
      } catch {
        // Server restarting / offline — try again next tick.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    const interval = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    check();

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
}
