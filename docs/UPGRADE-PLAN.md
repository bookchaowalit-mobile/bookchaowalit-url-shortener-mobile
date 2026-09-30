# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working local shortener (validation, deterministic codes,
aliases, click counts, share) with tested logic and honest CI; no backend, so
short links only exist on the device.

## Backlog

- P0: Connect to the URL-shortener backend so codes actually redirect; replace the
  placeholder `SHORT_DOMAIN` with configuration (app.json `extra`).
- P1: Persist links with AsyncStorage; delete/edit links.
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
