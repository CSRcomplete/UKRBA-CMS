/**
 * Zoom Server-to-Server OAuth helpers for creating real Zoom meetings.
 *
 * Requires a Server-to-Server OAuth app in the Zoom App Marketplace with
 * scopes: meeting:write:admin, meeting:read:admin, user:read:admin.
 *
 * Server-only — never import this from a Client Component (it uses
 * ZOOM_CLIENT_SECRET). Only import from Server Actions / Route Handlers.
 */

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

async function getZoomAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      "Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET."
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Zoom OAuth token request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

/**
 * The Zoom user (by email, or "me") under which meetings are created.
 * Staff without their own Zoom license all share this host account.
 */
function getZoomHostId(): string {
  return process.env.ZOOM_HOST_EMAIL || "me";
}

export interface ZoomMeeting {
  id: number;
  joinUrl: string;
  startUrl: string;
  password?: string;
}

export function isZoomConfigured(): boolean {
  return Boolean(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET);
}

/**
 * Create a Zoom meeting. Pass startTime for a scheduled meeting, or omit it
 * for an instant meeting (type 1).
 */
export async function createZoomMeeting(opts: {
  topic: string;
  startTime?: Date;
  durationMinutes?: number;
  agenda?: string;
}): Promise<ZoomMeeting> {
  const token = await getZoomAccessToken();
  const hostId = getZoomHostId();
  const isInstant = !opts.startTime;

  const body: Record<string, any> = {
    topic: opts.topic.slice(0, 200),
    type: isInstant ? 1 : 2,
    duration: opts.durationMinutes || 30,
    agenda: opts.agenda ? opts.agenda.slice(0, 2000) : undefined,
    settings: {
      join_before_host: true,
      waiting_room: false,
      approval_type: 2,
      audio: "both",
    },
  };

  if (!isInstant && opts.startTime) {
    body.start_time = opts.startTime.toISOString();
    body.timezone = "Europe/London";
  }

  const res = await fetch(`https://api.zoom.us/v2/users/${hostId}/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Zoom meeting creation failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    joinUrl: data.join_url,
    startUrl: data.start_url,
    password: data.password,
  };
}
