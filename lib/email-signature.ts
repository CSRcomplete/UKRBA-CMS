export function formatJobTitle(role?: string | null): string {
  if (!role) return "Staff Member";
  const normalized = role.toLowerCase().trim();
  switch (normalized) {
    case "admin":
      return "Administrator";
    case "ceo":
      return "Chief Executive Officer";
    case "coo":
      return "Chief Operating Officer";
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

type SignatureUser = { name?: string | null; role?: string | null; phone?: string | null };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getUKRBASignature(user?: SignatureUser): string {
  const name = user?.name?.trim() || "Kevin Turner";
  const jobTitle = user?.role ? formatJobTitle(user?.role) : "Chief Executive Officer";
  const phone = user?.phone?.trim();
  const phoneLine = phone ? `\n${phone}` : "";

  return `\n\n\n--\n${name}\n${jobTitle}${phoneLine}\nUK SME Responsible Business Association\nSupporting SMEs to evidence responsible business, CSR and ESG commitment\nwww.ukrba.org\n\nThe UK SME Responsible Business Association supports small and medium sized businesses in demonstrating responsible business, CSR and ESG activity through practical tools, accreditation and community engagement.\n\nConfidentiality Notice: This email and any attachments are confidential and may be legally privileged. If you are not the intended recipient, please notify the sender immediately and delete this email from your system. Any unauthorised use, disclosure or copying is prohibited.\n\nPlease consider the environment before printing this email.`;
}

export function stripExistingSignature(body: string): string {
  if (!body) return "";
  return body
    .replace(/<div class="ukrba-email-signature"[\s\S]*?<\/div>\s*$/i, "")
    .replace(/<div class="ukrba-signature"[\s\S]*?<\/div>\s*$/i, "")
    .replace(/<(div|p)[^>]*>\s*--\s*[\s\S]*?UKRBA[\s\S]*?<\/\1>/gi, "")
    .replace(/(<br\s*\/?>|\n|^)\s*--\s*[\s\S]*$/gi, "")
    .trim();
}

export function getUKRBASignatureEditorHtml(user?: SignatureUser): string {
  return "";
}

export function getUKRBASignatureHtml(
  user?: SignatureUser,
  logoUrl: string = UKRBA_LOGO_URL
): string {
  const name = escapeHtml(user?.name?.trim() || "Kevin Turner");
  const jobTitle = escapeHtml(user?.role ? formatJobTitle(user?.role) : "Chief Executive Officer");
  const phone = user?.phone?.trim();
  const phoneRow = phone
    ? `<p style="margin: 0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #475569; line-height: 1.3;">${escapeHtml(phone)}</p>`
    : "";

  return `
<br/><br/>
<div class="ukrba-email-signature" style="font-family: Arial, Helvetica, sans-serif; max-width: 680px; color: #1e293b; line-height: 1.5; margin-top: 24px;">
  <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 20px; background-color: #ffffff;">
    <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <tr>
        <td style="padding-right: 20px; vertical-align: middle; width: 170px; border-right: 1.5px solid #cbd5e1;">
          <img src="${logoUrl}" alt="UK SME Responsible Business Association Logo" width="150" style="display: block; width: 150px; max-width: 150px; height: auto; border: 0;" />
        </td>
        <td style="padding-left: 20px; vertical-align: middle;">
          <p style="margin: 0 0 4px 0; font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: bold; color: #1e293b; line-height: 1.2;">${name}</p>
          <p style="margin: 0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: #388e3c; line-height: 1.3;">${jobTitle}</p>
          ${phoneRow}
          <p style="margin: 0 0 4px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.3;">UK SME Responsible Business Association</p>
          <p style="margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #475569; line-height: 1.4;">Supporting SMEs to evidence responsible business, CSR and ESG commitment</p>
          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 600;"><a href="https://www.ukrba.org" target="_blank" style="color: #1e3a8a; text-decoration: none;">www.ukrba.org</a></p>
        </td>
      </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-top: 16px; margin-bottom: 12px;">
      <tr>
        <td style="border-bottom: 2px solid #388e3c; height: 1px; font-size: 1px; line-height: 1px;">&nbsp;</td>
      </tr>
    </table>
    <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; color: #334155; line-height: 1.4;">The UK SME Responsible Business Association supports small and medium sized businesses in demonstrating responsible business, CSR and ESG activity through practical tools, accreditation and community engagement.</p>
    <p style="margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #64748b; line-height: 1.35;">Confidentiality Notice: This email and any attachments are confidential and may be legally privileged. If you are not the intended recipient, please notify the sender immediately and delete this email from your system. Any unauthorised use, disclosure or copying is prohibited.</p>
    <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #475569; line-height: 1.35;">Please consider the environment before printing this email.</p>
  </div>
</div>
`;
}

export function parseMarkdownToEmailHtml(text: string): string {
  if (!text) return "";

  // If text is already HTML from the visual editor, return directly. The
  // editor's contenteditable innerHTML can contain entities (e.g. "&nbsp;"
  // for a double space) with no surrounding tags at all for a short
  // single-line message, so an entity alone is also treated as "already
  // HTML" — otherwise the escape step below turns "&nbsp;" into
  // "&amp;nbsp;", which renders as the literal text "&nbsp;".
  if (/<[a-z][\s\S]*>/i.test(text) || /&[a-zA-Z]+;|&#\d+;/.test(text)) {
    return text;
  }

  // 1. Escape HTML special characters
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Convert Bold (**text** or __text__)
  escaped = escaped.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>");

  // 3. Convert Italic (*text* or _text_)
  escaped = escaped.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");

  // 4. Convert Bullet points (- item or * item at start of line)
  escaped = escaped.replace(/^[\s]*[-*]\s+(.*)$/gm, "&bull; $1");

  // 5. Convert URLs (http:// or https://)
  escaped = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>'
  );

  // 6. Convert newlines to <br/>
  return escaped.replace(/\n/g, "<br/>");
}
