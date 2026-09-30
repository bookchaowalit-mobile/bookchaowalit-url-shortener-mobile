/**
 * Pure URL-shortener logic (no React Native imports) so it can be unit-tested.
 * Deliberately avoids the `URL` class: React Native's polyfill does not
 * implement most of its getters.
 */

export interface ShortLink {
  code: string;
  url: string;
  createdAt: number;
  clicks: number;
  lastClickedAt: number | null;
}

export const SHORT_DOMAIN = "bkc.link";
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;
const URL_PATTERN = /^(https?):\/\/([^/?#\s:@]+)(:\d{1,5})?([/?#][^\s]*)?$/i;
const OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const HOST_PATTERN = new RegExp(
  `^(localhost|(${OCTET}\\.){3}${OCTET}|([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+([a-z]{2,63}|xn--[a-z0-9-]{1,59}))$`,
  "i",
);
/** Zero-width characters and BOM: never valid raw in a URL, often picked up by copy/paste. */
const INVISIBLE = /[\u200B-\u200D\u2060\uFEFF]/g;

/**
 * Adds `https://` when no scheme is given, lower-cases scheme and host, and
 * returns null for anything that is not a plausible http(s) URL (this also
 * rejects `javascript:`, `data:` and similar schemes).
 */
export function normalizeUrl(input: string): string | null {
  let text = input.replace(INVISIBLE, "").trim();
  if (!text) return null;
  // "example.com:8080/x" has no scheme: a colon followed by digits is a port.
  if (!/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(text)) text = `https://${text}`;
  const m = URL_PATTERN.exec(text);
  if (!m) return null;
  const [, scheme, host, port = "", rest = ""] = m;
  if (!HOST_PATTERN.test(host)) return null;
  if (port && (Number(port.slice(1)) < 1 || Number(port.slice(1)) > 65535)) return null;
  return `${scheme.toLowerCase()}://${host.toLowerCase()}${port}${rest || "/"}`;
}

export const isValidAlias = (alias: string) => ALIAS_PATTERN.test(alias);

/** 32-bit FNV-1a hash. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function toBase62(value: number): string {
  if (value === 0) return "0";
  let n = Math.floor(Math.abs(value));
  let out = "";
  while (n > 0) {
    out = BASE62[n % 62] + out;
    n = Math.floor(n / 62);
  }
  return out;
}

/** Deterministic 6-char code; `attempt` changes it on collision. */
export function generateCode(url: string, attempt = 0): string {
  return toBase62(fnv1a(`${attempt}:${url}`)).padStart(6, "0").slice(-6);
}

export interface CreateResult {
  links: ShortLink[];
  link: ShortLink;
  existing: boolean;
}

export function createLink(
  links: ShortLink[],
  input: { url: string; alias?: string },
  now: number,
): CreateResult {
  const url = normalizeUrl(input.url);
  if (!url) throw new Error("Enter a valid http(s) URL.");
  const alias = input.alias?.trim();
  const taken = new Set(links.map((l) => l.code.toLowerCase()));

  if (alias) {
    if (!isValidAlias(alias)) throw new Error("Alias must be 3-32 letters, digits, - or _.");
    if (taken.has(alias.toLowerCase())) throw new Error(`Alias "${alias}" is already taken.`);
  } else {
    const existing = links.find((l) => l.url === url);
    if (existing) return { links, link: existing, existing: true };
  }

  let code = alias;
  for (let attempt = 0; !code; attempt++) {
    const candidate = generateCode(url, attempt);
    if (!taken.has(candidate.toLowerCase())) code = candidate;
  }
  const link: ShortLink = { code, url, createdAt: now, clicks: 0, lastClickedAt: null };
  return { links: [link, ...links], link, existing: false };
}

export function recordClick(links: ShortLink[], code: string, now: number): ShortLink[] {
  return links.map((l) => (l.code === code ? { ...l, clicks: l.clicks + 1, lastClickedAt: now } : l));
}

export function resolve(links: ShortLink[], code: string): string | null {
  return links.find((l) => l.code.toLowerCase() === code.toLowerCase())?.url ?? null;
}

export const shortUrl = (code: string, domain = SHORT_DOMAIN) => `https://${domain}/${code}`;

export function totalClicks(links: ShortLink[]): number {
  return links.reduce((n, l) => n + l.clicks, 0);
}

export function removeLink(links: ShortLink[], code: string): ShortLink[] {
  return links.filter((l) => l.code !== code);
}

/**
 * Type guard used when loading links from local storage. The URL is re-validated
 * with `normalizeUrl` so tampered storage cannot smuggle a `javascript:` or
 * `data:` URL into `Linking.openURL`.
 */
export function isShortLink(value: unknown): value is ShortLink {
  if (typeof value !== "object" || value === null) return false;
  const l = value as Record<string, unknown>;
  return (
    typeof l.code === "string" &&
    /^[A-Za-z0-9_-]{1,32}$/.test(l.code) &&
    typeof l.url === "string" &&
    normalizeUrl(l.url) === l.url &&
    typeof l.createdAt === "number" &&
    Number.isFinite(l.createdAt) &&
    typeof l.clicks === "number" &&
    Number.isInteger(l.clicks) &&
    l.clicks >= 0 &&
    (l.lastClickedAt === null || (typeof l.lastClickedAt === "number" && Number.isFinite(l.lastClickedAt)))
  );
}
