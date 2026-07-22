/**
 * Jitsi Meet utility helpers.
 *
 * These are pure sync functions — kept in a separate file so they can be
 * safely imported by both Server Actions ("use server") and Client Components
 * without violating Next.js "use server" export rules.
 */

/**
 * Get the active Jitsi domain server.
 * Defaults to 'meet.element.io' (Matrix/Element open public Jitsi server - completely open, zero moderator login required).
 * Can be overridden via NEXT_PUBLIC_JITSI_DOMAIN environment variable.
 */
export function getJitsiDomain(): string {
  return process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.element.io";
}

/**
 * Generate a unique Jitsi-safe room ID from a meeting title.
 * Format: ukrba-<slugified-title>-<6-char-hex>
 * e.g. "ukrba-quarterly-review-a3f9b2"
 */
export function generateJitsiRoomId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const suffix = Math.random().toString(16).slice(2, 8);
  return `ukrba-${slug}-${suffix}`;
}

/**
 * Get the full Jitsi Meet URL for a given room ID.
 */
export function getJitsiMeetUrl(roomId: string): string {
  const domain = getJitsiDomain();
  return `https://${domain}/${roomId}`;
}
