# PaceIt — session handoff

> Read `AGENTS.md` (rules, gotchas, lint quirks) and `README.md` (product + architecture) first.

## Guiding approach right now

**Polish the podcast-listening UX first. Discover the language-learning features later by dogfooding.**

The user's plan: make PaceIt feel complete *as a podcast player* so they can take it on real walks, then let actual usage dictate exactly which learning features get built (language filter chips, etc. are deliberately deferred — do not build them proactively). When suggesting work, prioritize whatever makes daily walking-listening feel polished.

## Current state (all on `main`, last commit `0a8eddf`)

- MVP: iTunes Search API search → follow shows (RSS) → Home feed of newest episodes + "Continue" section → playback with per-episode resume positions
- Just added, pending on-device verification: full-screen Now Playing modal (tap mini player → opens; ⌄ / swipe down to close), custom gesture-based Scrubber, ±15s both ways, persisted speed cycling (1→0.75→1.25→1.5→0.5→2), auto-advance to next episode of the same show on finish, ✕ clear button on search
- Structure: `src/app/(tabs)/{index,search,following}` + `src/app/player.tsx` (modal) under root Stack; Library → Player providers in `src/app/_layout.tsx`
- Verified: `npx tsc --noEmit` and `npx eslint src` clean (only pre-existing template errors in web-only files), `npx expo export` succeeds

## Next steps, in order

1. User tests current UI in Expo Go (iOS + Android) → fix visual/feel issues (scrubber gesture feel, modal presentation, mini-player offsets)
2. Commit the Now Playing work once approved
3. Dev build (`npx expo run:ios --device` or `eas build --profile development`) → verify background playback + lock-screen controls (core use case; only works in a compiled build — Expo Go stops audio when screen locks)
4. Further podcast polish candidates: queue management, episode "mark played", pull-to-refresh on Home
5. Learning/language features: **wait for dogfooding feedback**

## Workflow reminders

- npm project (not bun); `npx expo lint` is broken here — use `npx eslint src`
- expo-audio: use `useAudioPlayer`/`useAudioPlayerStatus` hooks and method calls; React Compiler forbids holding/mutating the player in state or refs during render
- MiniPlayer tab-bar offsets are hand-measured constants in `src/components/mini-player.tsx` — re-measure from screenshots if touched
- Keep this file updated at the end of each session; delete superseded notes