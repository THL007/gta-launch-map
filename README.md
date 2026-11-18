# GTA Launch Map

Expo SDK 58 app with Expo Router, TypeScript, and Progressive Web App support. Targets web (static PWA) first, with iOS/Android via Expo when you need native shells.

## Stack

- Expo Router (`src/app`) + React Compiler
- Static web export (`web.output: "static"`)
- PWA manifest + Workbox service worker
- Strict TypeScript path aliases (`@/*` → `src/*`)

## Commands

```bash
npm install
npm run web          # local web/PWA development
npm run start        # Expo Dev Tools (web/ios/android)
npm run typecheck
npm run lint
npm run build:web    # static export + Workbox SW → dist/
npm run serve:web    # preview dist/
```

## PWA notes

- Manifest: `public/manifest.json`
- Icons: `public/logo192.png`, `public/logo512.png`, `public/apple-touch-icon.png`
- Root HTML: `src/app/+html.tsx` (manifest, theme-color, SW bootstrap)
- Production offline cache: `workbox-config.js` (generated into `dist/sw.js` by `build:web`)

Installability needs HTTPS in production. Chrome → Application → Manifest / Service Workers to verify.

## Project layout

```
src/app/           routes + +html.tsx
src/components/    UI
src/constants/     theme tokens
src/hooks/
public/            static PWA assets (copied into dist/)
assets/            Expo icons / splash
```

## Environment

Copy `.env.example` → `.env` and use `EXPO_PUBLIC_*` for client-safe values.

## Native / EAS

`eas.json` is ready. After linking an Expo project, set `extra.eas.projectId` in `app.json`, then:

```bash
npx eas-cli@latest init
npx eas-cli@latest build --platform all
npx eas-cli@latest deploy   # Expo Hosting for the web export
```

## Fresh app shell

To drop the starter screens and keep config:

```bash
npm run reset-project
```
