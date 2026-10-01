# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working local shortener (validation, deterministic codes,
aliases, click counts, share) with tested logic and honest CI; no backend, so
short links only exist on the device.

## Backlog

- P0: Connect to the URL-shortener backend so codes actually redirect; replace the
  placeholder `SHORT_DOMAIN` with configuration (app.json `extra`).
- P1: Edit a link's destination URL.
- P1: Copy short URL to clipboard (expo-clipboard) and QR code for each link.
- P1: Component tests for the links screen (jest-expo + @testing-library/react-native).
- P2: Link expiry and per-day click chart.
- P2: Link the EAS project (`eas init`) so the preview build job can run.

## Done in this pass

- Fixed the app not bundling: aligned `expo-router`/`react-native`/`expo-constants`
  with SDK 53 and added missing `expo-font`, `expo-asset`, `query-string` deps.
- Links screen backed by pure `lib/shortener.ts` (safe URL normalisation that rejects
  `javascript:`/`data:`/credentialed URLs, FNV-1a base62 codes with collision retry,
  aliases, de-duplication, click tracking) with 10 vitest tests.
- CI runs `npm ci`, typecheck, lint, tests and an Android JS bundle without `|| true`;
  EAS job skips cleanly without `EXPO_TOKEN`; added `eas.json`, ESLint config, lockfile.

## Done in this pass (pass 2)

Score: 6/10 (was 5/10) — links persist and can be deleted; still local-only codes (backend P0 open).

- Links persist via AsyncStorage (`@react-native-async-storage/async-storage` 2.1.2) through `lib/usePersistentState.ts`; Delete per link (`removeLink`). Edit is still TODO.
- Security: `isShortLink` re-validates stored URLs with `normalizeUrl`, so tampered storage cannot feed `javascript:`/`data:` URLs to `Linking.openURL` (tested); open/share failures are caught instead of unhandled rejections.
- Accessibility: shorten/delete buttons labelled; profile links get link roles.
- Advisories: `overrides.postcss ^8.5.28` clears the high-severity PostCSS advisory in Expo metro-config (minor bump). Remaining `image-size` (metro, bundler-only), `uuid` (via `xcode`) and `decode-uri-component` (via `query-string@7`) need an Expo SDK major upgrade; deliberately not auto-fixed.
- Verified: typecheck, lint, 19 vitest tests, Android `expo export` bundle.

## Done in this pass (pass 3)

Score: 6.5/10 (was 6/10) — edge-case hunt in `lib/shortener.ts` (`normalizeUrl`).

- Bug: `example.com:8080/x` and `localhost:3000` (no scheme) were rejected, because `host:` was
  mistaken for a URL scheme. A colon followed by digits is now read as a port.
- Bug: ports 0 and 65536–99999 and IPv4 octets above 255 (`999.1.1.1`) were accepted.
- Bug: punycode TLDs (`xn--p1ai`) were rejected by the letters-only TLD rule.
- Bug: zero-width characters picked up by copy/paste stayed in the URL, so a pasted duplicate
  created a second, broken link; they are stripped before validation.
- `javascript:`/`tel:` etc. are still refused (regression-tested).
- Verified: typecheck, `expo lint`, vitest (24), Android `expo export`; new tests fail on the old code.
