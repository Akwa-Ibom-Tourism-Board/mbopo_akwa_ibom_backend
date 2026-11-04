import axios from "axios";
import configurations from ".";

// Thin client over the Zoho Mail REST API (https://mail.zoho.com/api) for
// the info@akhtdc.com.ng mailbox — used only by
// messages/services/zoho-mail-sync.service.ts to pull new mail on a
// schedule. OAuth only (no IMAP): a short-lived access token is minted from
// the long-lived refresh token on demand and cached in memory until shortly
// before it expires.
//
// Zoho issues the access/refresh token pair per data-center (the "ng"
// account here was provisioned on the .com DC — see api_domain in the
// original token response) — accounts.zoho.com / mail.zoho.com below are
// correct for that DC. If the mailbox is ever moved to another DC this
// client's two base URLs need to follow it.

const ACCOUNTS_BASE_URL = "https://accounts.zoho.com";
const MAIL_API_BASE_URL = "https://mail.zoho.com/api";
const REQUEST_TIMEOUT_MS = 15_000;
// Refresh a bit before the token's real expiry (Zoho access tokens last
// 3600s) so a slow request never races a just-expired token.
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

export interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accountId: string;
  inboxFolderId: string;
}

export const isZohoMailConfigured = (): boolean =>
  Boolean(
    configurations.ZOHO_CLIENT_ID &&
      configurations.ZOHO_CLIENT_SECRET &&
      configurations.ZOHO_REFRESH_TOKEN &&
      configurations.ZOHO_ACCOUNT_ID &&
      configurations.ZOHO_INBOX_FOLDER_ID,
  );

const requireZohoConfig = (): ZohoConfig => {
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_ACCOUNT_ID,
    ZOHO_INBOX_FOLDER_ID,
  } = configurations;
  if (
    !ZOHO_CLIENT_ID ||
    !ZOHO_CLIENT_SECRET ||
    !ZOHO_REFRESH_TOKEN ||
    !ZOHO_ACCOUNT_ID ||
    !ZOHO_INBOX_FOLDER_ID
  ) {
    throw new Error("Zoho Mail is not configured (ZOHO_* env vars missing)");
  }
  return {
    clientId: ZOHO_CLIENT_ID,
    clientSecret: ZOHO_CLIENT_SECRET,
    refreshToken: ZOHO_REFRESH_TOKEN,
    accountId: ZOHO_ACCOUNT_ID,
    inboxFolderId: ZOHO_INBOX_FOLDER_ID,
  };
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const { clientId, clientSecret, refreshToken } = requireZohoConfig();

  const response = await axios.post(
    `${ACCOUNTS_BASE_URL}/oauth/v2/token`,
    null,
    {
      params: {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
      },
      timeout: REQUEST_TIMEOUT_MS,
    },
  );

  const { access_token, expires_in } = response.data ?? {};
  if (!access_token) {
    throw new Error(`Zoho token refresh returned no access_token: ${JSON.stringify(response.data)}`);
  }

  cachedAccessToken = {
    token: access_token,
    expiresAt: Date.now() + (Number(expires_in ?? 3600) * 1000 - TOKEN_REFRESH_MARGIN_MS),
  };
  return access_token;
};

const authHeaders = async () => ({
  Authorization: `Zoho-oauthtoken ${await getAccessToken()}`,
});

export interface ZohoMessageSummary {
  messageId: string;
  subject: string;
  // Display name <email>, as Zoho returns it in the list view.
  sender: string;
  fromAddress: string;
  receivedTime: string;
  hasAttachment: boolean;
}

/**
 * Lists the most recent messages in the configured inbox folder, newest
 * first. The sync service diffs this against what's already in our DB
 * (by zohoMessageId) rather than this client tracking a "since" cursor —
 * simpler, and self-healing if a poll is ever missed entirely.
 */
export const listInboxMessages = async (limit = 50): Promise<ZohoMessageSummary[]> => {
  const { accountId, inboxFolderId } = requireZohoConfig();

  const response = await axios.get(
    `${MAIL_API_BASE_URL}/accounts/${accountId}/messages/view`,
    {
      headers: await authHeaders(),
      params: {
        folderId: inboxFolderId,
        limit,
        start: 1,
        sortBy: "date",
        sortorder: false, // false = descending (newest first)
      },
      timeout: REQUEST_TIMEOUT_MS,
    },
  );

  const rows: any[] = response.data?.data ?? [];
  return rows.map((row) => ({
    messageId: String(row.messageId),
    subject: row.subject ?? "",
    sender: row.sender ?? "",
    fromAddress: (row.fromAddress ?? row.sender ?? "").toLowerCase(),
    receivedTime: row.receivedTime ?? "",
    hasAttachment: Boolean(row.hasAttachment),
  }));
};

export interface ZohoAttachmentInfo {
  attachmentId: string;
  attachmentName: string;
  attachmentSize: number;
}

export interface ZohoMessageContent {
  messageId: string;
  subject: string;
  fromAddress: string;
  /** Plain-text body, HTML tags stripped if only an HTML body was available. */
  content: string;
  attachments: ZohoAttachmentInfo[];
}

// Mail clients attach the entire previous email (our own reply, quoted in
// full) below whatever the person actually typed — shown to staff as one
// giant message otherwise, and it grows on every back-and-forth. These two
// passes (HTML structure, then plain-text heuristics) remove it so only the
// person's own new text is saved, same approach helpdesk tools like Front/
// Zendesk/Help Scout use. Not foolproof against every client's markup, so
// if nothing matches, the original content is kept rather than risking an
// empty message — see stripQuotedReply's fallback.

// Common wrappers mail clients use to hold the quoted original message.
const HTML_QUOTE_PATTERNS = [
  /<blockquote[\s\S]*?<\/blockquote>/gi,
  // Gmail
  /<div[^>]*class="[^"]*gmail_quote[^"]*"[\s\S]*?<\/div>\s*$/gi,
  // Yahoo Mail
  /<div[^>]*class="[^"]*yahoo_quoted[^"]*"[\s\S]*$/gi,
  // Outlook's reply/forward header block, through end of document
  /<div[^>]*id="divRplyFwdMsg"[\s\S]*$/gi,
  // Zoho Mail's own quote separator (<hr id="zwchr">) through end of document
  /<hr[^>]*id="zwchr"[^>]*>[\s\S]*$/gi,
];

const stripHtmlQuotes = (html: string): string =>
  HTML_QUOTE_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, ""), html);

const stripHtml = (html: string): string =>
  stripHtmlQuotes(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Plain-text-level cutoffs — catches quoting styles the HTML pass above
// doesn't structurally wrap (or when the source was plain text to begin
// with). Each marker's earliest match wins; everything from there on is
// dropped. Order doesn't matter since we take the minimum index.
const TEXT_QUOTE_MARKERS: RegExp[] = [
  // "On Wed, Nov 4, 2026 at 10:00 PM X wrote:" (Gmail, Apple Mail, many others)
  /^On .{0,120} wrote:\s*$/im,
  /-{2,}\s*Original Message\s*-{2,}/i,
  /-{2,}\s*Forwarded message\s*-{2,}/i,
  // Our own outgoing templates' fixed boilerplate — if this shows up, it's
  // our own prior email being quoted back at us, not a new complaint.
  /Thank you for reaching out to Mbopo Akwa Ibom/i,
  // A run of 3+ consecutive ">"-quoted lines (classic plain-text quoting).
  /(?:^>.*\n){3,}/m,
];

export const stripQuotedReply = (text: string): string => {
  let cutAt = text.length;
  for (const marker of TEXT_QUOTE_MARKERS) {
    const match = marker.exec(text);
    if (match && match.index < cutAt) cutAt = match.index;
  }
  const cleaned = text.slice(0, cutAt).trim();
  // If stripping would leave nothing (e.g. a reply that quoted-matched too
  // early, or a reply with no new text at all), keep the original rather
  // than saving an empty complaint — capped, matching the widget's own
  // 5000-char message limit.
  return cleaned.length >= 2 ? cleaned : text.trim().slice(0, 5000);
};

export const getMessageContent = async (messageId: string): Promise<ZohoMessageContent> => {
  const { accountId, inboxFolderId } = requireZohoConfig();

  const response = await axios.get(
    `${MAIL_API_BASE_URL}/accounts/${accountId}/folders/${inboxFolderId}/messages/${messageId}/content`,
    {
      headers: await authHeaders(),
      timeout: REQUEST_TIMEOUT_MS,
    },
  );

  const data = response.data?.data ?? {};
  const rawContent: string = data.content ?? data.summary ?? "";
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(rawContent);
  const plainText = looksLikeHtml ? stripHtml(rawContent) : rawContent.trim();

  return {
    messageId,
    subject: data.subject ?? "",
    fromAddress: (data.fromAddress ?? "").toLowerCase(),
    content: stripQuotedReply(plainText),
    attachments: (data.attachments ?? []).map((a: any) => ({
      attachmentId: String(a.attachmentId ?? a.storeName ?? ""),
      attachmentName: a.attachmentName ?? a.fileName ?? "attachment",
      attachmentSize: Number(a.attachmentSize ?? a.size ?? 0),
    })),
  };
};

/**
 * Downloads one attachment's raw bytes, for re-upload to Cloudinary. If
 * Zoho's attachment-download shape doesn't match this at runtime, the
 * caller (zoho-mail-sync.service.ts) catches and skips that single
 * attachment rather than failing the whole message.
 */
export const downloadAttachment = async (
  messageId: string,
  attachmentId: string,
): Promise<Buffer> => {
  const { accountId } = requireZohoConfig();

  const response = await axios.get(
    `${MAIL_API_BASE_URL}/accounts/${accountId}/messages/${messageId}/attachments/${attachmentId}`,
    {
      headers: await authHeaders(),
      responseType: "arraybuffer",
      timeout: REQUEST_TIMEOUT_MS,
    },
  );

  return Buffer.from(response.data);
};

/**
 * Best-effort: lets staff see (in Zoho's own webmail) which messages this
 * sync has already picked up. Never allowed to fail the sync — the
 * zohoMessageId unique constraint is what actually prevents reprocessing.
 */
export const markMessagesRead = async (messageIds: string[]): Promise<void> => {
  if (!messageIds.length) return;
  const { accountId } = requireZohoConfig();

  await axios.put(
    `${MAIL_API_BASE_URL}/accounts/${accountId}/updatemessage`,
    { mode: "markAsRead", messageId: messageIds },
    { headers: await authHeaders(), timeout: REQUEST_TIMEOUT_MS },
  );
};

export default {
  isZohoMailConfigured,
  listInboxMessages,
  getMessageContent,
  downloadAttachment,
  markMessagesRead,
};
