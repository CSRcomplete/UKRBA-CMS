import Imap from "imap";
import { simpleParser, type Attachment } from "mailparser";

export type ImapAccount = {
  username: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSsl: boolean;
};

export type ParsedHeader = {
  uid: number;
  rfcMessageId: string;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  to: { name?: string; email: string }[];
  cc: { name?: string; email: string }[];
  sentAt?: Date;
  inReplyTo?: string;
  references: string[];
};

/** mailparser returns `references` as a string, string[], or undefined
 * depending on how many References headers/values were present — normalise
 * to a clean array either way. */
function normalizeReferences(references: unknown): string[] {
  if (!references) return [];
  if (Array.isArray(references)) return references.filter(Boolean);
  if (typeof references === "string") return references.split(/\s+/).filter(Boolean);
  return [];
}

/** Open a connection and resolve when ready. Caller is responsible for imap.end(). */
export function connectImap(account: ImapAccount): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.username,
      password: account.password,
      host: account.imapHost,
      port: account.imapPort,
      tls: account.imapSsl,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 15000,
      connTimeout: 15000,
    });
    imap.once("ready", () => {
      imap.removeAllListeners("error");
      resolve(imap);
    });
    imap.once("error", reject);
    imap.connect();
  });
}

/** Fetch parsed headers for a list of UIDs from an already-open box. */
export function fetchHeaders(
  imap: Imap,
  uids: number[]
): Promise<ParsedHeader[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedHeader[] = [];
    const pending: Promise<void>[] = [];

    const fetch = imap.fetch(uids, { bodies: "HEADER" });

    fetch.on("message", (msg) => {
      let uid = 0;
      const chunks: Buffer[] = [];

      msg.on("attributes", (attrs) => { uid = attrs.uid; });
      msg.on("body", (stream) => {
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      });
      msg.on("end", () => {
        pending.push(
          (async () => {
            try {
              const parsed = await simpleParser(Buffer.concat(chunks));
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const toArr = (parsed.to as any)?.value ?? [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const ccArr = (parsed.cc as any)?.value ?? [];
              results.push({
                uid,
                rfcMessageId: parsed.messageId ?? `${uid}-header@local`,
                subject: parsed.subject,
                fromName: parsed.from?.value[0]?.name || undefined,
                fromEmail: parsed.from?.value[0]?.address || undefined,
                to: toArr.map((a: { name?: string; address?: string }) => ({
                  name: a.name,
                  email: a.address ?? "",
                })),
                cc: ccArr.map((a: { name?: string; address?: string }) => ({
                  name: a.name,
                  email: a.address ?? "",
                })),
                sentAt: parsed.date || undefined,
                inReplyTo: parsed.inReplyTo || undefined,
                references: normalizeReferences(parsed.references),
              });
            } catch (e) {
              console.warn(`[imap-utils] Failed to parse header for UID ${uid}:`, e);
              // skip unparseable header
            }
          })()
        );
      });
    });

    fetch.on("error", reject);
    fetch.on("end", () => {
      Promise.all(pending).then(() => resolve(results)).catch(reject);
    });
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * mailparser leaves inline/embedded images as `<img src="cid:...">` in the
 * parsed HTML and returns their actual bytes separately in `attachments`
 * (keyed by `cid`) — it does not re-embed them itself. Without this step
 * every email with an inline image/logo/signature renders a broken image.
 */
function embedInlineImages(html: string, attachments: Attachment[]): string {
  let result = html;
  for (const att of attachments) {
    if (!att.cid) continue;
    const dataUri = `data:${att.contentType};base64,${att.content.toString("base64")}`;
    const pattern = new RegExp(`cid:${escapeRegExp(att.cid)}`, "gi");
    result = result.replace(pattern, dataUri);
  }
  return result;
}

/**
 * Rewrite remote (http/https) <img> src URLs to route through our own
 * image proxy. Cloudflare-fronted CDNs frequently block or challenge
 * cross-site <img> requests made from inside another site's iframe (they
 * load fine as a direct fetch, but silently fail as an embedded image) —
 * fetching them server-side and re-serving from our own origin sidesteps
 * that entirely. Leaves data: URIs (already-embedded inline images) alone.
 */
function proxyRemoteImages(html: string): string {
  return html.replace(
    /(<img\b[^>]*?\bsrc\s*=\s*)(["'])(https?:\/\/[^"']+)\2/gi,
    (_match, prefix: string, quote: string, url: string) =>
      `${prefix}${quote}/api/emails/image-proxy?url=${encodeURIComponent(url)}${quote}`
  );
}

export type FetchedBody = {
  bodyText?: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string[];
};

/**
 * Fetches and parses the body of the message at `uid` in the currently-open
 * `box` on an already-connected `imap` client. Caller owns the connection
 * and box lifecycle — this only runs one FETCH.
 */
function fetchBodyOnOpenBox(
  imap: Imap,
  uid: number
): Promise<FetchedBody> {
  return new Promise((resolve, reject) => {
    const fetch = imap.fetch([uid], { bodies: "" });
    const chunks: Buffer[] = [];
    let found = false;

    fetch.on("message", (msg) => {
      found = true;
      msg.on("body", (stream) => {
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      });
      msg.on("end", () => {
        simpleParser(Buffer.concat(chunks))
          .then((parsed) => {
            let html = parsed.html || undefined;
            if (html) {
              if (parsed.attachments?.length) html = embedInlineImages(html, parsed.attachments);
              html = proxyRemoteImages(html);
            }
            resolve({
              bodyText: parsed.text || undefined,
              bodyHtml: html,
              inReplyTo: parsed.inReplyTo || undefined,
              references: normalizeReferences(parsed.references),
            });
          })
          .catch(reject);
      });
    });

    fetch.on("error", reject);
    fetch.on("end", () => {
      if (!found) resolve({});
    });
  });
}

function searchByMessageId(imap: Imap, messageId: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    imap.search([["HEADER", "MESSAGE-ID", messageId]], (err, uids) => {
      if (err) return reject(err);
      resolve(uids ?? []);
    });
  });
}

/**
 * Looks up and fetches multiple messages by Message-ID over a single IMAP
 * connection/box — for bulk re-fetching, opening a fresh TLS connection per
 * message is the dominant cost by far. Returns a map keyed by messageId;
 * entries are omitted for IDs that weren't found (synthetic/local IDs or
 * messages no longer present in this folder).
 */
export async function fetchBodiesByMessageIds(
  account: ImapAccount,
  folderName: string,
  messageIds: string[]
): Promise<Map<string, FetchedBody>> {
  const results = new Map<string, FetchedBody>();
  const imap = await connectImap(account);

  await new Promise<void>((resolve, reject) => {
    imap.openBox(folderName, true, (err) => (err ? reject(err) : resolve()));
  });

  try {
    for (const messageId of messageIds) {
      try {
        const uids = await searchByMessageId(imap, messageId);
        if (uids.length === 0) continue;
        const body = await fetchBodyOnOpenBox(imap, uids[uids.length - 1]);
        results.set(messageId, body);
      } catch (e) {
        console.warn(`[imap-utils] Failed to fetch message ${messageId} in ${folderName}:`, e);
      }
    }
  } finally {
    imap.end();
  }

  return results;
}

/**
 * Open a fresh IMAP connection, find the message by its stable Message-ID
 * header, then fetch its body. UIDs are only guaranteed to point at the
 * same message within a single UIDVALIDITY session — if the mailbox is
 * ever reindexed server-side (observed to happen on this account's
 * provider), a UID stored during the initial sync can silently start
 * pointing at a *different* message, pulling the wrong content into the
 * wrong CRM record. Message-ID is permanent for the life of the message,
 * so looking it up fresh every time avoids that class of corruption
 * entirely — this is the only body-fetch path that should be used.
 */
export async function fetchBodyByMessageId(
  account: ImapAccount,
  folderName: string,
  messageId: string
): Promise<FetchedBody> {
  const imap = await connectImap(account);

  try {
    await new Promise<void>((resolve, reject) => {
      imap.openBox(folderName, true, (err) => (err ? reject(err) : resolve()));
    });

    const uids = await searchByMessageId(imap, messageId);
    if (uids.length === 0) return {};

    // If somehow more than one message shares this Message-ID, prefer the
    // most recently added one.
    return await fetchBodyOnOpenBox(imap, uids[uids.length - 1]);
  } finally {
    imap.end();
  }
}

/** Open a fresh IMAP connection, fetch the full body of one message by UID.
 * @deprecated UIDs can go stale if the mailbox is reindexed server-side,
 * silently attributing one message's body to a different message's row.
 * Use `fetchBodyByMessageId` instead — kept only for the incremental-sync
 * watermark path where a stale UID just means a message gets re-checked,
 * not corrupted. */
export async function fetchBodyByUid(
  account: ImapAccount,
  folderName: string,
  uid: number
): Promise<FetchedBody> {
  const imap = await connectImap(account);

  return new Promise((resolve, reject) => {
    // Guard against double imap.end() calls across async paths
    let ended = false;
    const end = () => { if (!ended) { ended = true; imap.end(); } };

    imap.openBox(folderName, true, (err) => {
      if (err) { end(); return reject(err); }

      fetchBodyOnOpenBox(imap, uid)
        .then((result) => { end(); resolve(result); })
        .catch((e) => { end(); reject(e); });
    });
  });
}
