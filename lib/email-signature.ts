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

export const UKRBA_LOGO_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/images/ukrba-logo.png`
  : "https://crm.ukrba.org/images/ukrba-logo.png";

export function getUKRBASignature(user?: { name?: string | null; role?: string | null }): string {
  const name = user?.name?.trim() || "UKRBA Team Member";
  const jobTitle = formatJobTitle(user?.role);

  return `\n\n--\n${name}\n${jobTitle} | UKRBA\n\nUK Resource & Business Association\nWebsite: https://ukrba.org`;
}

export function getUKRBASignatureHtml(
  user?: { name?: string | null; role?: string | null },
  logoUrl: string = UKRBA_LOGO_URL
): string {
  const name = user?.name?.trim() || "UKRBA Team Member";
  const jobTitle = formatJobTitle(user?.role);

  return `
<br/><br/>
<div class="ukrba-signature" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333333; line-height: 1.5; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
  <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
    <tr>
      <td style="padding-right: 15px; vertical-align: middle; border-right: 2px solid #0d1b3e;">
        <img src="${logoUrl}" alt="UK SME Responsible Business Association Logo" width="140" style="display: block; max-width: 140px; height: auto; border: 0;" />
      </td>
      <td style="padding-left: 15px; vertical-align: middle;">
        <p style="margin: 0; font-weight: bold; font-size: 15px; color: #0d1b3e;">${name}</p>
        <p style="margin: 2px 0 6px 0; color: #16a34a; font-size: 13px; font-weight: 600;">${jobTitle} | UKRBA</p>
        <p style="margin: 0; color: #374151; font-weight: 600; font-size: 13px;">UK SME Responsible Business Association</p>
        <p style="margin: 4px 0 0 0; font-size: 12px;"><a href="https://ukrba.org" target="_blank" style="color: #0d1b3e; text-decoration: none; font-weight: 600;">https://ukrba.org</a></p>
      </td>
    </tr>
  </table>
</div>
`;
}
