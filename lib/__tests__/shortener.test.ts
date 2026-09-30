import { describe, expect, it } from "vitest";
import {
  createLink,
  generateCode,
  isValidAlias,
  normalizeUrl,
  recordClick,
  resolve,
  shortUrl,
  toBase62,
  totalClicks,
} from "../shortener";

const T0 = Date.UTC(2026, 0, 1);

describe("normalizeUrl", () => {
  it("adds a scheme and lower-cases the host", () => {
    expect(normalizeUrl("Example.COM/Path?q=1")).toBe("https://example.com/Path?q=1");
    expect(normalizeUrl("http://localhost:3000")).toBe("http://localhost:3000/");
    expect(normalizeUrl("https://10.0.0.1/a")).toBe("https://10.0.0.1/a");
  });

  it("rejects unsafe or malformed input", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("ftp://example.com")).toBeNull();
    expect(normalizeUrl("data:text/html,hi")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
    expect(normalizeUrl("https://user@evil.com")).toBeNull();
    expect(normalizeUrl("")).toBeNull();
  });
});

describe("codes", () => {
  it("encodes base62", () => {
    expect(toBase62(0)).toBe("0");
    expect(toBase62(61)).toBe("Z");
    expect(toBase62(62)).toBe("10");
  });

  it("generates stable 6-char codes that change per attempt", () => {
    const a = generateCode("https://example.com/");
    expect(a).toHaveLength(6);
    expect(generateCode("https://example.com/")).toBe(a);
    expect(generateCode("https://example.com/", 1)).not.toBe(a);
  });

  it("validates aliases", () => {
    expect(isValidAlias("my-link_1")).toBe(true);
    expect(isValidAlias("ab")).toBe(false);
    expect(isValidAlias("has space")).toBe(false);
  });
});

describe("createLink", () => {
  it("creates and de-duplicates generated links", () => {
    const first = createLink([], { url: "example.com" }, T0);
    expect(first.existing).toBe(false);
    const again = createLink(first.links, { url: "https://EXAMPLE.com/" }, T0 + 1);
    expect(again.existing).toBe(true);
    expect(again.links).toHaveLength(1);
  });

  it("supports custom aliases and rejects duplicates case-insensitively", () => {
    const { links } = createLink([], { url: "example.com", alias: "Promo" }, T0);
    expect(links[0].code).toBe("Promo");
    expect(() => createLink(links, { url: "other.com", alias: "promo" }, T0)).toThrow(/taken/);
    expect(() => createLink(links, { url: "other.com", alias: "x" }, T0)).toThrow(/Alias/);
  });

  it("avoids generated-code collisions", () => {
    const code = generateCode("https://a.com/");
    const blocked = [{ code, url: "https://z.com/", createdAt: T0, clicks: 0, lastClickedAt: null }];
    const { link } = createLink(blocked, { url: "a.com" }, T0);
    expect(link.code).toBe(generateCode("https://a.com/", 1));
  });

  it("rejects invalid URLs", () => {
    expect(() => createLink([], { url: "javascript:void(0)" }, T0)).toThrow(/valid/);
  });
});

describe("clicks and lookup", () => {
  it("records clicks and resolves codes", () => {
    const { links, link } = createLink([], { url: "example.com" }, T0);
    const clicked = recordClick(recordClick(links, link.code, T0 + 5), link.code, T0 + 9);
    expect(clicked[0]).toMatchObject({ clicks: 2, lastClickedAt: T0 + 9 });
    expect(totalClicks(clicked)).toBe(2);
    expect(resolve(clicked, link.code.toUpperCase())).toBe("https://example.com/");
    expect(resolve(clicked, "missing")).toBeNull();
    expect(shortUrl("abc")).toBe("https://bkc.link/abc");
  });
});
