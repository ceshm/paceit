# PaceIt — AGENTS.md

A minimal podcast player for listening while walking, with ergonomics for language learners (French, Japanese). Philosophy: an audio player with learner features, NOT a learning app — simplicity beats features. See [README.md](./README.md) for product context and [HANDOFF.md](./HANDOFF.md) for current session state and priorities.

## Architecture map

- `src/app/_layout.tsx` — Root shell: `GestureHandlerRootView` → `LibraryProvider` → `PlayerProvider` → `ThemeProvider` → `Stack` (`(tabs)` + `player` modal) + floating `MiniPlayer` sibling.
- `src/app/(tabs)/` — `NativeTabs` (`src/components/app-tabs.tsx`) with three per-tab stacks: `home/`, `search/`, and `following/` (labeled **Shows**). Each tab directory has `_layout.tsx` (`Stack`), `index.tsx`, and thin wrapper routes `show/[id].tsx` + `episode/[id].tsx`.
- `src/app/player.tsx` — Full-screen Now Playing modal presented at root with `presentation: 'formSheet'` (uses `src/components/scrubber.tsx`).
- `src/components/screens/` — Shared `show-details.tsx` and `episode-details.tsx` implementations rendered by the ×3 per-tab route wrappers (edit these, not the wrappers). `src/hooks/use-tab-prefix.ts` resolves the active tab prefix (`'/home' | '/search' | '/following'`) so shared components push detail routes inside the current tab.
- `src/lib/player.tsx` — `PlayerProvider`: one persistent `useAudioPlayer` session for the app's lifetime (rate cycling, seek, auto-advance). Background playback + lock screen (`setActiveForLockScreen`) require `interruptionMode: 'doNotMix'` and the `expo-audio` config plugin with `enableBackgroundPlayback: true` in `app.json`.
- `src/lib/library.tsx` — `LibraryProvider`: followed shows, episodes per show, playback positions, RSS feed refreshes.
- `src/lib/` — `itunes.ts` (search), `rss.ts` (`fast-xml-parser` + `stripHtml`), `storage.ts` (AsyncStorage), `types.ts`.
- Data flow: `LibraryProvider` → `PlayerProvider` via callback props in `src/app/_layout.tsx` (`getPosition`, `getNextEpisode`, `onProgress`).

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch `https://docs.expo.dev/llms.txt` — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

This project uses **npm** (`package-lock.json`, no `bun.lock`). Run typecheck and lint before declaring any task done — both should exit 0 with zero errors.

```bash
npx expo install <package>  # ALWAYS use instead of npm install — resolves SDK-compatible versions
npx expo start              # start the dev server
npm run typecheck           # tsc --noEmit
npm run lint                # expo lint (or npx eslint src)
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Route files in `src/app/` must only export the screen (`default`) — no arbitrary re-exports.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `npx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- `ios/` and `android/` are gitignored generated directories (Continuous Native Generation). Never edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, or to test background audio and lock-screen controls, use a development build: `npx expo run:ios|android` locally, or `npx eas-cli@latest build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project gotchas (learned the hard way)

- **React Compiler + `expo-audio`**: `experiments.reactCompiler` is enabled. Never hold mutable native objects (e.g. `AudioPlayer`) in `useState` or mutate refs during render — use `useAudioPlayer`/`useAudioPlayerStatus` hooks and method calls (`player.setPlaybackRate()`), not property assignment. Keep `expo-audio` behavior verified against `/versions/v<major>.0.0/sdk/audio.md`.
- **React Compiler + Reanimated**: Never pass a `useSharedValue` ref in a `useMemo`/`useCallback` dependency array — the compiler treats it as frozen and `react-hooks/immutability` errors on `.value =`. Omit it from deps (with an eslint-disable comment if needed).
- **Gesture callbacks + worklets (RNGH v3 + Reanimated 4)**: Gesture callbacks run as worklets on the UI thread. Calling a React state setter or any plain JS helper directly inside them throws `"Tried to synchronously call a Remote Function"` and SIGABRTs with no redbox. Either attach `.runOnJS(true)` for JS-state gestures (like `Scrubber`), or mutate only shared values in callbacks and bridge to JS with `scheduleOnRN` from `react-native-worklets` (project convention over `runOnJS`). Keep `GestureHandlerRootView` wrapping the root layout.
- **Effects**: Avoid synchronous `setState` in `useEffect` bodies (`react-hooks/set-state-in-effect` is an error); put updates inside async callbacks or timeouts.
- **Per-tab detail stacks**: Detail routes live under each tab (`/home/show/[id]`, etc.) as thin wrappers around `src/components/screens/*`. Bare `/show/[id]` or `/episode/[id]` routes do not exist. Keep `useTabPrefix()`'s union type in sync with tab directory names.
- **`formSheet` (`/player`)**: Nested navigators/headers inside a `formSheet` screen are unsupported, and iOS sheet animation duration isn't customizable.
- **`MiniPlayer` layout & visibility**: Rendered as a sibling *after* the root `Stack` in `src/app/_layout.tsx` so it floats above screens on Android; it checks `usePathname() === '/player'` to hide while the modal is open. Bottom offsets (`insets.bottom + 54` iOS / `+82` Android) are hand-measured against `NativeTabs` — re-measure from screenshots if tab bar layout changes.
- **Tab icons**: Specify BOTH platforms on `NativeTabs.Trigger.Icon` — `sf` (SF Symbols, iOS) and `md` (Material Symbols, Android).
- **Search input**: The search `TextInput` is deliberately uncontrolled (no `value` prop) — don't make it controlled without a reason.
- **RSS HTML descriptions**: Feed descriptions are raw HTML blobs — always parse through `stripHtml` in `src/lib/rss.ts`.
