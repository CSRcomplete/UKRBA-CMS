export function formatJobTitle(role?: string | null): string {
  if (!role) return "Staff Member";
  const normalized = role.toLowerCase().trim();
  switch (normalized) {
    case "admin":
      return "Administrator";
    case "ceo":
      return "Chief Executive Officer";
    case "operations_director":
      return "Operations Director";
    case "area_director":
      return "Area Director";
    case "regional_director":
      return "Regional Director";
    case "channel_partner":
      return "Channel Partner";
    case "user":
      return "Staff Member";
    default:
      return role
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
  }
}

export function getUKRBASignature(user?: { name?: string | null; role?: string | null }): string {
  const name = user?.name?.trim() || "UKRBA Team Member";
  const jobTitle = formatJobTitle(user?.role);

  return `\n\n--\n${name}\n${jobTitle} | UKRBA\n\nUK Resource & Business Association\nWebsite: https://ukrba.org`;
}

export function getUKRBASignatureHtml(user?: { name?: string | null; role?: string | null }): string {
  const name = user?.name?.trim() || "UKRBA Team Member";
  const jobTitle = formatJobTitle(user?.role);

  return `
<br/><br/>
<div class="ukrba-signature" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.5; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
  <p style="margin: 0; font-weight: bold; font-size: 15px; color: #111827;">${name}</p>
  <p style="margin: 2px 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 500;">${jobTitle} | UKRBA</p>
  <p style="margin: 0; color: #374151; font-weight: 600;">UK Resource &amp; Business Association</p>
  <p style="margin: 4px 0 0 0; font-size: 12px; color: #2563eb;"><a href="https://ukrba.org" target="_blank" style="color: #2563eb; text-decoration: none;">https://ukrba.org</a></p>
</div>
`;
}
