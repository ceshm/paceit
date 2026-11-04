# PaceIt — AGENTS.md

A minimal podcast player for listening while walking, with ergonomics for language learners (French, Japanese). Philosophy: an audio player with learner features, NOT a learning app — simplicity beats features. See README.md for product context.

## Architecture map

- `src/app/` — routes only: `index` (Home feed), `search`, `following`. Providers + MiniPlayer live in `_layout.tsx`.
- `src/lib/player.tsx` — `PlayerProvider`: one persistent `useAudioPlayer` session for the app's lifetime. Background playback + lock screen (`setActiveForLockScreen`) require `interruptionMode: 'doNotMix'` and the `expo-audio` config plugin with `enableBackgroundPlayback: true` in `app.json`.
- `src/lib/library.tsx` — `LibraryProvider`: followed shows, episodes per show, playback positions. Feed refreshes happen here.
- `src/lib/` — `itunes.ts` (search), `rss.ts` (fast-xml-parser), `storage.ts` (AsyncStorage), `types.ts`.
- Data flow: Library → Player via props in `_layout.tsx` (positions read on play, progress written back on interval).

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx tsc --noEmit            # typecheck
npx eslint src              # lint (NOTE: `npx expo lint` errors out on this project — use eslint directly)
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

This project uses **npm** (package-lock.json, no bun.lock). Run typecheck and lint before declaring any task done.

Known pre-existing lint/typecheck errors in template files (do not chase these): `src/components/animated-icon.web.tsx`, `src/components/app-tabs.web.tsx`, `src/hooks/use-color-scheme.web.ts`, `src/constants/theme.ts` (global.css import). Filter them out when verifying clean output.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project gotchas (learned the hard way)

- React Compiler is enabled (`experiments.reactCompiler`): never hold mutable native objects (e.g. `AudioPlayer`) in `useState` or mutate refs during render — use the documented `useAudioPlayer`/`useAudioPlayerStatus` hooks and method calls (`player.setPlaybackRate()`), not property assignment.
- Route files in `src/app/` must only export the screen (default) — no arbitrary re-exports.
- Avoid sync `setState` in effect bodies; put updates inside async callbacks/timeouts (react-hooks/set-state-in-effect is an error here).
- The search `TextInput` is deliberately uncontrolled (no `value` prop) — don't make it controlled without a reason.
- Tab icons need BOTH platforms: `sf` (SF Symbols, iOS) + `md` (Material Symbols, Android) on `NativeTabs.Trigger.Icon`.
- MiniPlayer bottom offset in `src/components/mini-player.tsx` is hand-measured against the floating NativeTabs bar (iOS ≈ `insets.bottom + 54`, Android ≈ +82). Re-measure against screenshots if tab bar layout changes.
- Keep lists of `expo-audio` behavior verified against `/versions/v<major>/sdk/audio.md` — playback APIs changed significantly across SDKs.
