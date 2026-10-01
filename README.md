# Url Shortener — Mobile

React Native mobile app (Expo) for **Url Shortener**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Features

- **Link shortener** (Links tab): paste a URL (scheme optional) and get a short
  code — a deterministic 6-character base62 hash, or your own alias. Only
  http(s) URLs are accepted (`javascript:`/`data:` and credentialed URLs are
  rejected), duplicates are reused, and alias clashes are reported. Each link
  can be opened (counted as a click) or shared. Links are in-memory for now and
  the `bkc.link` domain is a display placeholder until the redirect backend exists.
- Shortener logic lives in `lib/shortener.ts` (pure TypeScript, unit-tested).

## Tech Stack

- **Framework:** Expo SDK 53 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Getting Started

```bash
npm install
npx expo start
```

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint (eslint-config-expo)
npm test            # vitest unit tests for lib/
npx expo export --platform android --output-dir dist   # JS bundle smoke check
```

CI (`.github/workflows/build.yml`) runs all of the above with `npm ci`; failures
are not masked. The EAS preview build only runs on `main` when the `EXPO_TOKEN`
secret is configured (run `eas init` once to link the project).

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## Related

- **Frontend:** [bookchaowalit-website/url-shortener-frontend](https://github.com/bookchaowalit-website/url-shortener-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
