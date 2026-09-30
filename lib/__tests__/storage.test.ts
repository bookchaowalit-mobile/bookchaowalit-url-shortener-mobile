import { describe, expect, it } from "vitest";
import { encodeEnvelope, listCodec } from "../persist";
import { createLink, isShortLink, recordClick, removeLink } from "../shortener";

describe("link persistence", () => {
  const codec = listCodec(isShortLink);
  const { links } = createLink([], { url: "example.com/a", alias: "" }, 1);
  const clicked = recordClick(links, links[0].code, 2);

  it("round-trips links created by createLink", () => {
    expect(codec.decode(codec.encode(clicked))).toEqual(clicked);
  });

  it("rejects tampered entries, including unsafe URL schemes", () => {
    const good = clicked[0];
    const raw = encodeEnvelope([
      good,
      { ...good, code: "x1", url: "javascript:alert(1)" },
      { ...good, code: "x2", url: "data:text/html,hi" },
      { ...good, code: "x3", clicks: -1 },
      { ...good, code: "bad code" },
    ]);
    expect(codec.decode(raw)).toEqual([good]);
  });

  it("removeLink deletes by code", () => {
    expect(removeLink(clicked, clicked[0].code)).toEqual([]);
  });
});
