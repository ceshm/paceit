# PaceIt — session handoff

> Read `AGENTS.md` (rules, gotchas, lint quirks) and `README.md` (product + architecture) first.

## Guiding approach right now

**Polish the podcast-listening UX first. Discover the language-learning features later by dogfooding.**

The user's plan: make PaceIt feel complete *as a podcast player* so they can take it on real walks, then let actual usage dictate exactly which learning features get built (language filter chips, etc. are deliberately deferred — do not build them proactively). When suggesting work, prioritize whatever makes daily walking-listening feel polished.

## Current state (all on `main`, last commit `0a8eddf`)

- MVP: iTunes Search API search → follow shows (RSS) → Home feed of newest episodes + "Continue" section → playback with per-episode resume positions
- Added & device-verified: full-screen Now Playing modal (tap mini player → opens; ⌄ or swipe down to close), custom gesture-based Scrubber, ±15s both ways, persisted speed cycling (1→0.75→1.25→1.5→0.5→2), auto-advance to next episode of the same show on finish, ✕ clear button on search, MiniPlayer hidden while `/player` route is open
- Player modal presentation: `presentation: 'formSheet'` in `src/app/_layout.tsx` — native sheet on both platforms (iOS UIModalPresentationFormSheet card, Android Material BottomSheetBehavior) with native swipe-to-dismiss and scrim. Replaced a hand-rolled Android drag-to-dismiss that caused a background flash/double-animation on close. formSheet caveats: no nested navigators/headers inside the sheet screen; iOS animation duration not customizable
- Structure: `src/app/(tabs)/{index,search,following}` + `src/app/player.tsx` (modal) under root Stack; Library → Player providers in `src/app/_layout.tsx`; `GestureHandlerRootView` wraps the root there
- Verified: `npx tsc --noEmit` and `npx eslint src` clean (only pre-existing template errors in web-only files), `npx expo export` succeeds
- Pending: commit the Now Playing work; further device feel-testing (scrubber gesture feel, Android modal presentation)

## Next steps, in order

1. User tests current UI in Expo Go (iOS + Android) → fix visual/feel issues (scrubber gesture feel, modal presentation, mini-player offsets)
2. Commit the Now Playing work once approved
3. Dev build (`npx expo run:ios --device` or `eas build --profile development`) → verify background playback + lock-screen controls (core use case; only works in a compiled build — Expo Go stops audio when screen locks)
4. Further podcast polish candidates: queue management, episode "mark played", pull-to-refresh on Home
5. Learning/language features: **wait for dogfooding feedback**

## Workflow reminders

- npm project (not bun); `npx expo lint` is broken here — use `npx eslint src`
- expo-audio: use `useAudioPlayer`/`useAudioPlayerStatus` hooks and method calls; React Compiler forbids holding/mutating the player in state or refs during render
- **Gesture callbacks + worklets (crashed the app twice):** in RNGH v3 + Reanimated 4, gesture callbacks run as worklets on the UI thread. Calling a state setter OR any plain JS helper (e.g. a `clamp` util) directly inside them throws "Tried to synchronously call a Remote Function" and SIGABRTs with no redbox. Two fixes in use: `Gesture.Pan().runOnJS(true)` (scrubber) forces all callbacks onto the JS thread — use for gestures that only update React state. For worklet gestures (player swipe-to-dismiss), only mutate shared values inside callbacks and bridge to JS with `scheduleOnRN` from `react-native-worklets` (project convention over `runOnJS`).
- **React Compiler + Reanimated:** never pass a `useSharedValue` ref as a `useMemo`/`useCallback` dep — the compiler treats it as frozen and `react-hooks/immutability` errors on `.value =`. Omit it from deps (add exhaustive-deps disable comment).
- `GestureDetector` requires `GestureHandlerRootView` — already wrapping the root in `src/app/_layout.tsx`; don't remove it.
- **MiniPlayer visibility:** it's a sibling *after* the `Stack` in `src/app/_layout.tsx`, so it floats above screens on Android (iOS native modal hides it). It checks `usePathname()` and returns null when `/player` is open — keep that if restructuring.
- MiniPlayer tab-bar offsets are hand-measured constants in `src/components/mini-player.tsx` — re-measure from screenshots if touched
- Keep this file updated at the end of each session; delete superseded notes