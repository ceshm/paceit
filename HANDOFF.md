# PaceIt — session handoff

> Read `AGENTS.md` (rules, gotchas, lint quirks) and `README.md` (product + architecture) first.

## Guiding approach right now

**Polish the podcast-listening UX first. Discover the language-learning features later by dogfooding.**

The user's plan: make PaceIt feel complete *as a podcast player* so they can take it on real walks, then let actual usage dictate exactly which learning features get built (language filter chips, etc. are deliberately deferred — do not build them proactively). When suggesting work, prioritize whatever makes daily walking-listening feel polished.

## Current state (all on `main`, last commit `6dd4f25` — Now Playing + formSheet work committed & pushed)

- MVP: iTunes Search API search → follow shows (RSS) → Home feed of newest episodes + "Continue" section → playback with per-episode resume positions
- Committed: full-screen Now Playing modal via `presentation: 'formSheet'` (native sheet on both platforms — iOS card, Android Material BottomSheetBehavior, native swipe-to-dismiss + scrim; replaced a hand-rolled Android drag-dismiss that flashed on close), custom Scrubber, ±15s both ways, persisted speed cycling, auto-advance to next episode of the same show, ✕ clear on search, MiniPlayer hidden while `/player` is open, `GestureHandlerRootView` at root
- **UNCOMMITTED UX work (device-verify, then commit):**
  - New `src/app/episode/[id].tsx`: artwork, title, show, date/duration, "X remaining" progress, play/pause, scrollable description; falls back to fetching the feed (feedUrl param) for episodes of unfollowed shows
  - New `src/app/show/[id].tsx`: **discovery mode for unfollowed shows** — renders from search params (id/title/artist/artwork/feedUrl), fetches feed live for episodes + channel description, follow toggle. Followed shows use library data. No more "show not found" dead end
  - `src/components/episode-row.tsx`: play badge = nested Pressable w/ stopPropagation (play/pause only); rest of row navigates to `/episode/[id]` with feedUrl param
  - `src/app/(tabs)/search.tsx`: rows navigate to `/show/[id]` passing title/artist/artwork/feedUrl params; follow button stopPropagation
  - Bottom padding: `src/app/player.tsx` safeArea + `src/components/mini-player.tsx` container (rate button clears the home/gesture bar)
  - Data: `description` added to Episode (required) + Show (optional) in `types.ts`; `rss.ts` has `stripHtml` (tags + entities) and parses item description/summary + channel description; `library.tsx` persists show description on follow and refresh
- Structure: `src/app/(tabs)/{index,search,following}` + `src/app/{player,show/[id],episode/[id]}.tsx` under root Stack; Library → Player providers in `src/app/_layout.tsx`
- Verified: `npx tsc --noEmit` and `npx eslint src` clean (only pre-existing template errors in web-only files)

## Next steps, in order

1. User tests the detail screens + navigation flow in Expo Go (iOS + Android) → fix issues, then **commit the uncommitted UX work**
2. Dev build (`npx expo run:ios --device` or `eas build --profile development`) → verify background playback + lock-screen controls (core use case; only works in a compiled build — Expo Go stops audio when screen locks)
3. Further podcast polish candidates: queue management, episode "mark played", pull-to-refresh on Home, richer episode rows (description snippet)
4. Learning/language features: **wait for dogfooding feedback**

## Known caveats

- formSheet: no nested navigators/headers inside the sheet screen; iOS animation duration not customizable
- Episodes cached *before* the description change have no description until the next feed refresh (app restart triggers it)
- Feed descriptions are HTML blobs — always parse through `stripHtml` in `rss.ts`, never render raw `item.description`

## Workflow reminders

- npm project (not bun); `npx expo lint` is broken here — use `npx eslint src`
- expo-audio: use `useAudioPlayer`/`useAudioPlayerStatus` hooks and method calls; React Compiler forbids holding/mutating the player in state or refs during render
- **Gesture callbacks + worklets (crashed the app twice):** in RNGH v3 + Reanimated 4, gesture callbacks run as worklets on the UI thread. Calling a state setter OR any plain JS helper (e.g. a `clamp` util) directly inside them throws "Tried to synchronously call a Remote Function" and SIGABRTs with no redbox. Two fixes in use: `Gesture.Pan().runOnJS(true)` (scrubber) forces all callbacks onto the JS thread — use for gestures that only update React state. For worklet gestures (player swipe-to-dismiss), only mutate shared values inside callbacks and bridge to JS with `scheduleOnRN` from `react-native-worklets` (project convention over `runOnJS`).
- **React Compiler + Reanimated:** never pass a `useSharedValue` ref as a `useMemo`/`useCallback` dep — the compiler treats it as frozen and `react-hooks/immutability` errors on `.value =`. Omit it from deps (add exhaustive-deps disable comment).
- `GestureDetector` requires `GestureHandlerRootView` — already wrapping the root in `src/app/_layout.tsx`; don't remove it.
- **MiniPlayer visibility:** it's a sibling *after* the `Stack` in `src/app/_layout.tsx`, so it floats above screens on Android (iOS native modal hides it). It checks `usePathname()` and returns null when `/player` is open — keep that if restructuring.
- MiniPlayer tab-bar offsets are hand-measured constants in `src/components/mini-player.tsx` — re-measure from screenshots if touched
- Keep this file updated at the end of each session; delete superseded notes